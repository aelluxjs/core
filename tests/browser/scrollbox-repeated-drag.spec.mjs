import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/browser/fixtures/scrollbox-interactions.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await page.waitForFunction(() => window.AelluxJs?.ext.scrollboxSnap?.initialized);
});

for (const edge of ["start", "end"]) for (const delay of [0, 16, 100]) {
  test(`elastic ${edge} re-grab tolerates initial cross-axis jitter after ${delay}ms`, async ({ page }) => {
    const gallery = page.locator('[data-scenario="elastic"]');
    await expect(gallery).toHaveClass(/ae--snap-ready/);
    await gallery.scrollIntoViewIfNeeded();
    await gallery.evaluate((element, edge) => element.scrollTo({
      left: edge === "start" ? 0 : element.scrollWidth, behavior: "instant"
    }), edge);
    const rect = await gallery.boundingBox();
    const direction = edge === "start" ? 1 : -1;
    const x = rect.x + (edge === "start" ? 120 : 380), y = rect.y + 140;
    await page.mouse.move(x, y);
    await page.mouse.down();
    const nextX = x + direction * 75;
    await page.mouse.move(nextX, y, { steps: 2 });
    await page.mouse.up();
    await expect(gallery.locator(".track")).toHaveClass(/ae--scrollbox-elastic-release/);
    await page.waitForTimeout(delay);
    await page.mouse.down({ clickCount: 2 });
    await expect(gallery.locator(".track")).not.toHaveClass(/ae--scrollbox-elastic-release/);
    expect(await gallery.locator(".track").evaluate(element => element.style.transform)).toBe("");
    const start = await gallery.evaluate(element => element.scrollLeft);
    // Hand jitter before the horizontal movement must not choose a vertical
    // gesture that this horizontal-only Scrollbox cannot consume.
    await page.mouse.move(nextX, y + 1);
    expect(await gallery.evaluate(element => element.scrollLeft)).toBe(start);
    await page.mouse.move(nextX - direction * 10, y);
    expect(await gallery.evaluate(element => element.scrollLeft)).toBe(start + direction * 10);
    await expect(gallery).toHaveClass(/ae--pointerscrolling/);
    await expect(gallery).toHaveCSS("cursor", "grabbing");
    await page.waitForTimeout(80);
    expect(await gallery.evaluate(element => element.scrollLeft)).toBe(start + direction * 10);
    await page.mouse.up();
    await expect(gallery).not.toHaveClass(/ae--pointerscrolling/);
    await expect.poll(() => gallery.evaluate(element => getComputedStyle(element).scrollSnapType)).toBe("x mandatory");
  });
}

for (const [key, scenario] of [
  ["elastic", "with elastic"],
  ["plain", "without elastic"],
  ["nested", "with nested vertical Scrollboxes"]
]) {
  test(`PDS release visibly eases into snap ${scenario}`, async ({ page }) => {
    const gallery = page.locator(`[data-scenario="${key}"]`);
    await expect(gallery).toHaveClass(/ae--snap-ready/);
    await gallery.scrollIntoViewIfNeeded();
    const rect = await gallery.boundingBox();
    await page.mouse.move(rect.x + 350, rect.y + 80);
    await page.mouse.down();
    await page.mouse.move(rect.x + 100, rect.y + 80, { steps: 3 });
    await gallery.evaluate(element => {
      window.releaseSamples = { held: element.scrollLeft, positions: [], done: false };
      window.addEventListener("pointerup", () => queueMicrotask(() => {
        window.releaseSamples.released = element.scrollLeft;
        const record = () => {
          window.releaseSamples.positions.push(element.scrollLeft);
          if (element.classList.contains("ae--snap-suspended")) requestAnimationFrame(record);
          else window.releaseSamples.done = true;
        };
        requestAnimationFrame(record);
      }), { once: true });
    });
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.releaseSamples.done)).toBe(true);
    const { held, released, positions } = await page.evaluate(() => window.releaseSamples);
    const destination = positions.at(-1);
    expect(released).toBe(held);
    expect(positions.some(position => position > Math.min(held, destination) + 1 &&
      position < Math.max(held, destination) - 1)).toBe(true);
    await expect.poll(() => gallery.evaluate(element => getComputedStyle(element).scrollSnapType))
      .toBe("x mandatory");
  });

  test(`rapid alternating drags stay proportional ${scenario}`,
    async ({ page }) => {
      test.setTimeout(60_000);
      const gallery = page.locator(`[data-scenario="${key}"]`);
      await expect(gallery).toHaveClass(/ae--snap-ready/);
      await gallery.scrollIntoViewIfNeeded();
      const rect = await gallery.boundingBox();
      const position = () => gallery.evaluate(element => element.scrollLeft);
      for (let gesture = 0; gesture < 24; gesture++) {
        const distance = [-250, 250, -180, 160, -20, 20, -2, 2][gesture % 8];
        // Re-grab the same location in the final eight gestures. Alternating
        // distant origins alone misses accidental multi-click suppression.
        const x = rect.x + (gesture >= 16 ? 240 : distance < 0 ? 320 : 140), y = rect.y + 80;
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
