import type { GqField, GqOption, GuidedQuoteConfig, LineItem } from "@/verticals/types";

export type Selections = Record<string, string>;

function matches(when: Record<string, string[]>, sel: Selections): boolean {
  return Object.entries(when).every(([field, options]) => options.includes(sel[field]));
}

/** For one field: option id -> the reason it is unavailable given the other choices. */
export function disabledOptions(config: GuidedQuoteConfig, sel: Selections, fieldId: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rule of config.constraints) {
    if (rule.field !== fieldId || !matches(rule.when, sel)) continue;
    for (const option of rule.disable) out[option] = rule.reason;
  }
  return out;
}

/** Drops any choice that an earlier choice has just ruled out. */
export function pruneSelections(config: GuidedQuoteConfig, sel: Selections): Selections {
  const next = { ...sel };
  for (const field of config.fields) {
    const current = next[field.id];
    if (current && disabledOptions(config, next, field.id)[current]) delete next[field.id];
  }
  return next;
}

export function isComplete(config: GuidedQuoteConfig, sel: Selections, quantity: number | null, needBy: string | null): boolean {
  return config.fields.every((f) => Boolean(sel[f.id])) && quantity !== null && needBy !== null;
}

function selectedOption(field: GqField, sel: Selections): GqOption | undefined {
  return field.options.find((o) => o.id === sel[field.id]);
}

function attr(config: GuidedQuoteConfig, sel: Selections, path: string): string | number {
  const [fieldId, name] = path.split(".");
  const field = config.fields.find((f) => f.id === fieldId);
  const option = field ? selectedOption(field, sel) : undefined;
  if (!option) return "";
  if (name === "label") return option.label;
  if (name === "hint") return option.hint ?? "";
  return option.attrs?.[name] ?? "";
}

const PLACEHOLDER = /\{([a-z]+\.[a-zA-Z0-9]+)\}/g;

/**
 * Fills "{field.attr}" placeholders from the selected options, and "{quantity}" from the quantity answer.
 * A placeholder may sit inside another, so an attribute can depend on two answers:
 * "{cost.financed{down.code}}" reads `financedTen` from the selected cost when the selected down
 * payment's code is "Ten", and "{tier.factor{quantity}}" reads `factor60` for a quantity of 60.
 */
function fill(config: GuidedQuoteConfig, sel: Selections, template: string, quantity: number): string {
  let text = template.replace(/\{quantity\}/g, String(quantity));
  for (let pass = 0; pass < 3; pass++) {
    const next = text.replace(PLACEHOLDER, (_, path: string) => String(attr(config, sel, path)));
    if (next === text) break;
    text = next;
  }
  return text;
}

function num(config: GuidedQuoteConfig, sel: Selections, path: string, quantity: number): number {
  const value = Number(attr(config, sel, fill(config, sel, path, quantity)));
  return Number.isFinite(value) ? value : 0;
}

function quantityBreak(config: GuidedQuoteConfig, quantity: number | null) {
  if (quantity === null) return undefined;
  return (config.quantityBreaks ?? []).filter((b) => quantity >= b.from).sort((x, y) => y.from - x.from)[0];
}

/** The rules engine: the same selections always give the same line items, prices, and lead times. */
export function generateLines(config: GuidedQuoteConfig, sel: Selections, quantity: number): LineItem[] {
  const volume = quantityBreak(config, quantity)?.multiplier ?? 1;
  return config.lines
    .filter((template) => !template.when || matches(template.when, sel))
    .map((template) => {
      const added = template.price.add.reduce((sum, path) => sum + num(config, sel, path, quantity), template.price.base);
      const multiplied = template.price.multiply.reduce((value, path) => value * (num(config, sel, path, quantity) || 1), added);
      const unitPrice = Math.round(multiplied * (template.volume ? volume : 1));
      return {
        sku: fill(config, sel, template.sku, quantity),
        name: fill(config, sel, template.name, quantity),
        description: fill(config, sel, template.description, quantity),
        qty: template.qtyFixed ?? quantity * template.qtyPerUnit,
        unitPrice,
        unitCost: Math.round(unitPrice * template.costRatio),
        leadDays: template.lead.add.reduce((sum, path) => sum + num(config, sel, path, quantity), template.lead.base),
        ...(template.timing ? { timing: fill(config, sel, template.timing, quantity) } : {}),
        ...(template.recurring ? { recurring: true } : {}),
      };
    });
}

export function activeNotes(config: GuidedQuoteConfig, sel: Selections, quantity: number | null = null): string[] {
  const volume = quantityBreak(config, quantity);
  return [...config.notes.filter((n) => matches(n.when, sel)).map((n) => n.text), ...(volume ? [volume.note] : [])];
}
