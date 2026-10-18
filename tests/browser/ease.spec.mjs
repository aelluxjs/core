import { expect, test } from "@playwright/test";

for (const forceLegacy of [false, true]) {
  test(`core easing is available after orchestrator load with forceLegacy=${forceLegacy}`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });

    const before = await page.evaluate(() => {
      window.bootEase = $ae.ease;
      try {
        $ae.ease("linear", 0.5);
      } catch (error) {
        return { type: typeof $ae.ease, code: error.code };
      }
      return { type: typeof $ae.ease, code: null };
    });
    expect(before).toEqual({ type: "function", code: 1001 });

    await page.evaluate(forceLegacy => $ae.init({ mode: "basic", forceLegacy }), forceLegacy);
    await expect.poll(() => page.evaluate(() => $ae.ease === window.bootEase)).toBe(false);

    const values = await page.evaluate(() => {
      const ease = $ae.ease;
      return {
        sameAlias: ease === AelluxJs.ease,
        presentAbsent: $ae.ext.present === undefined,
        backOut: ease("backOut", 0.5),
        prefixed: ease("easeBackOut", 0.5),
        kebab: ease("back-out", 0.5),
        prefixedKebab: ease("ease-back-out", 0.5),
        backIn: ease("backIn", 0.5),
        cubicOut: ease("cubicOut", 0.5),
        linearAbove: ease("linear", 1.2),
        linearBelow: ease("linear", -0.2)
      };
    });
    expect(values.sameAlias).toBe(true);
    expect(values.presentAbsent).toBe(true);
    expect(values.backOut).toBeGreaterThan(1);
    expect(values.backIn).toBeLessThan(0);
    expect(values.prefixed).toBeCloseTo(values.backOut);
    expect(values.kebab).toBeCloseTo(values.backOut);
    expect(values.prefixedKebab).toBeCloseTo(values.backOut);
    expect(values.cubicOut).toBeCloseTo(0.875);
    expect(values.linearAbove).toBe(1);
    expect(values.linearBelow).toBe(0);

    const presentHasEase = await page.evaluate(async () => {
      $ae.ext("present");
      const present = await $ae.wait("present");
      return Object.hasOwn(present, "ease");
    });
    expect(presentHasEase).toBe(false);
  });
}
