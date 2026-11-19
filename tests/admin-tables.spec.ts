import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

const TABLES = ["/admin", "/admin/activity", "/admin/runs", "/admin/audit"];

for (const [width, height] of [
  [1440, 900],
  [1280, 720],
]) {
  test(`admin tables fit their cards at ${width}x${height}, with dates, statuses, and buttons on one line`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await signIn(page);
    for (const path of TABLES) {
      await page.goto(path);
      await page.waitForSelector("table");
      const layout = await page.evaluate(() => {
        const table = document.querySelector("table")!;
        const card = table.parentElement!.getBoundingClientRect();
        // Counted from the text itself: a pill's own box sits a little higher than the text inside it.
        const lines = (el: Element) => {
          const tops = new Set<number>();
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const range = document.createRange();
            range.selectNodeContents(node);
            for (const rect of range.getClientRects()) tops.add(Math.round(rect.top));
          }
          return tops.size;
        };
        const oneLine = [...table.querySelectorAll("tbody .whitespace-nowrap")];
        const controls = [...table.querySelectorAll("tbody button, tbody a")];
        return {
          pageScrolls: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          tableOverflow: Math.round(table.getBoundingClientRect().width - card.width),
          wrapped: oneLine.filter((el) => lines(el) > 1).map((el) => el.textContent),
          spilled: oneLine.filter((el) => el.tagName === "TD" && el.scrollWidth > el.clientWidth).map((el) => el.textContent),
          offCard: controls.filter((el) => el.getBoundingClientRect().right > card.right || el.getBoundingClientRect().left < card.left).map((el) => el.textContent),
        };
      });
      expect(layout, path).toEqual({ pageScrolls: false, tableOverflow: 0, wrapped: [], spilled: [], offCard: [] });
    }
  });
}

test("a long email in an admin table is shortened with the full address on hover", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await signIn(page);
  await page.goto("/admin");
  const emails = page.locator("tbody td:first-child span[title]");
  await expect(emails.first()).toBeVisible();
  for (const email of await emails.all()) expect(await email.getAttribute("title")).toBe(await email.textContent());
});
