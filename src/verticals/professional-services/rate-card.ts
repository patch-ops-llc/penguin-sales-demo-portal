import type { LineItem, Product } from "../types";

// Quillon Technology Partners' rate card and product library.
// Managed services are priced per user per month and sold on annual terms, so the library and
// every quote carry the price per year. Hourly rates carry the loaded cost per hour, which sets
// the rate-card floor the approval rule checks.

/** Minimum margin on any line. A rate's floor is its loaded cost divided by (1 - this share). */
export const MARGIN_FLOOR_PCT = 20;

export function usd(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

function managed(sku: string, name: string, perMonth: number, costRatio: number): Product {
  const price = perMonth * 12;
  return { sku, name, family: "Managed services", price, cost: Math.round(price * costRatio), leadDays: 0, onHand: 0, timing: "Billed monthly", recurring: true };
}

function hourly(sku: string, name: string, rate: number, loadedCost: number): Product {
  return { sku, name, family: "Professional services rate card", price: rate, cost: loadedCost, leadDays: 7, onHand: 0, timing: "Billed as worked" };
}

function project(sku: string, name: string, price: number, leadDays: number): Product {
  return { sku, name, family: "Fixed-fee projects", price, cost: Math.round(price * 0.64), leadDays, onHand: 0, timing: "One-time" };
}

function hardware(sku: string, name: string, price: number, leadDays: number, onHand: number): Product {
  return { sku, name, family: "Hardware", price, cost: Math.round(price * 0.78), leadDays, onHand, timing: `Ships in ${leadDays} days` };
}

function licence(sku: string, name: string, price: number): Product {
  return { sku, name, family: "Licences", price, cost: Math.round(price * 0.78), leadDays: 0, onHand: 0, timing: "Billed annually", recurring: true };
}

export const ENGINEER_RATE = 165;

export const products: Product[] = [
  managed("QT-MS-ESS", "Managed IT Essentials, per user", 85, 0.62),
  managed("QT-MS-CMP", "Managed IT Complete, per user", 125, 0.62),
  managed("QT-MS-PLS", "Managed IT Complete Plus, per user", 165, 0.62),
  managed("QT-SEC-MDR", "Managed detection and response, per user", 18, 0.55),
  managed("QT-SEC-CPL", "Security and compliance pack, per user", 29, 0.55),
  managed("QT-NET-SITE", "Managed network and firewall, per site", 350, 0.5),
  managed("QT-BKP-TB", "Managed backup, per terabyte", 40, 0.5),
  hourly("QT-PS-ARC", "Solutions architect, per hour", 225, 164),
  hourly("QT-PS-SNR", "Senior engineer, per hour", 195, 142),
  hourly("QT-PS-ENG", "Systems engineer, per hour", ENGINEER_RATE, 120),
  hourly("QT-PS-PM", "Project manager, per hour", 150, 109),
  project("QT-ONB-ESS", "Onboarding project, Essentials", 40 * ENGINEER_RATE, 14),
  project("QT-ONB-CMP", "Onboarding project, Complete", 60 * ENGINEER_RATE, 21),
  project("QT-ONB-PLS", "Onboarding project, Complete Plus", 80 * ENGINEER_RATE, 28),
  project("QT-ASM-SEC", "Security assessment, fixed fee", 7500, 10),
  project("QT-USR-SETUP", "New user setup, per user", 95, 3),
  hardware("QT-HW-LT14", "Business laptop, 14-inch", 1240, 3, 38),
  hardware("QT-HW-DOCK", "Docking station with power", 210, 3, 52),
  hardware("QT-HW-MON", "Monitor, 27-inch", 290, 3, 44),
  hardware("QT-HW-FW", "Branch firewall", 2850, 7, 6),
  hardware("QT-HW-SW24", "Managed switch, 24-port PoE", 1480, 5, 9),
  hardware("QT-HW-SW48", "Managed switch, 48-port PoE", 2390, 5, 4),
  hardware("QT-HW-AP", "Wireless access point", 520, 12, 0),
  licence("QT-LIC-PROD", "Productivity suite licence, per user", 264),
  licence("QT-LIC-EDR", "Endpoint protection licence, per device", 72),
];

export function product(sku: string): Product {
  const p = products.find((x) => x.sku === sku);
  if (!p) throw new Error(`Unknown SKU in seed: ${sku}`);
  return p;
}

/** A line at the rate card, or at the contract rate when one is given. */
export function line(sku: string, qty: number, unitPrice?: number): LineItem {
  const p = product(sku);
  return { sku, name: p.name, qty, unitPrice: unitPrice ?? p.price, unitCost: p.cost, leadDays: p.leadDays, ...(p.timing ? { timing: p.timing } : {}), ...(p.recurring ? { recurring: true } : {}) };
}
