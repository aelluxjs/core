import { expect, test } from "@playwright/test";

for (const [index, scenario] of ["with elastic", "without elastic", "with nested vertical Scrollboxes"].entries()) {
  test(`teste.htm rapid alternating drags stay proportional ${scenario}`,
    async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto("/docs/teste.htm");
      await page.waitForFunction(() => window.AelluxJs?.ext.scrollboxSnap?.initialized);
      // Use element order: the page has duplicate gallery IDs, but each
      // element must still behave as an independent Scrollbox.
      const gallery = page.locator("[data-ae-scrollbox-snap]").nth(index);
      await expect(gallery).toHaveClass(/ae--snap-ready/);
      await gallery.scrollIntoViewIfNeeded();
      const rect = await gallery.boundingBox();
      const position = () => gallery.evaluate(element => element.scrollLeft);
      for (let gesture = 0; gesture < 24; gesture++) {
        const distance = [-250, 250, -180, 160, -20, 20, -2, 2][gesture % 8];
        const x = rect.x + (distance < 0 ? 320 : 140), y = rect.y + 80;
        await page.mouse.move(x, y);
        await page.mouse.down();
        const start = await position();
        const maximum = await gallery.evaluate(element => element.scrollWidth - element.clientWidth);
        await page.waitForTimeout([0, 8, 20, 60][gesture % 4]);
        expect(await position(), `gesture ${gesture}: held without movement`).toBe(start);
        for (let step = 1; step <= 3; step++) {
          // Three steps deliberately generate fractional pointer coordinates.
          await page.mouse.move(x + distance * step / 3, y);
          const expected = Math.max(0, Math.min(maximum, start - distance * step / 3));
          expect(Math.abs(await position() - expected),
            `gesture ${gesture}, step ${step}: movement follows the pointer`).toBeLessThanOrEqual(1);
        }
        const held = await position();
        await page.waitForTimeout([0, 10, 50][gesture % 3]);
        expect(await position(), `gesture ${gesture}: held after moving`).toBe(held);
        await page.mouse.up();
        await page.waitForTimeout([0, 16, 35][gesture % 3]);
      }
      await expect.poll(() => gallery.evaluate(element => getComputedStyle(element).scrollSnapType))
        .toBe("x mandatory");
    });
}
