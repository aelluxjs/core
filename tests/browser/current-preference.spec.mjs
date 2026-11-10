import { expect, test } from "@playwright/test";

test("currentPreference reads the resolved HTML value before and after initialization", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addScriptTag({ url: "/dist/aellux.js" });

  const values = await page.evaluate(() => {
    const root = document.documentElement;
    const absent = aelluxJs.currentPreference("reduced-motion");
    root.setAttribute("data-ae-reduced-motion", "no-preference");
    const beforeInit = $ae.currentPreference("reducedMotion");
    root.removeAttribute("data-ae-reduced-motion");
    aelluxJs.init({ mode: "basic" });
    const device = aelluxJs.currentPreference("reduced-motion");
    aelluxJs.updatePreferenceAttributesHTML({ reducedMotion: "no-preference" });
    const local = aelluxJs.currentPreference("reducedMotion");
    root.removeAttribute("data-ae-reduced-motion");
    return { absent, beforeInit, device, local,
      cleared: aelluxJs.currentPreference("reduced-motion"),
      sharedAlias: aelluxJs.currentPreference === $ae.currentPreference };
  });

  expect(values).toEqual({ absent: null, beforeInit: "no-preference", device: "reduced",
    local: "no-preference", cleared: null, sharedAlias: true });
});
