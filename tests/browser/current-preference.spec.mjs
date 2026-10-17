import { expect, test } from "@playwright/test";

test("currentPreference reads the resolved HTML value before and after initialization", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addScriptTag({ url: "/dist/aellux.js" });

  const values = await page.evaluate(() => {
    const root = document.documentElement;
    const absent = AelluxJs.currentPreference("reduced-motion");
    root.setAttribute("data-ae-reduced-motion", "no-preference");
    const beforeInit = $ae.currentPreference("reducedMotion");
    root.removeAttribute("data-ae-reduced-motion");
    AelluxJs.init({ mode: "basic" });
    const device = AelluxJs.currentPreference("reduced-motion");
    AelluxJs.updatePreferenceAttributesHTML({ reducedMotion: "no-preference" });
    const local = AelluxJs.currentPreference("reducedMotion");
    root.removeAttribute("data-ae-reduced-motion");
    return { absent, beforeInit, device, local,
      cleared: AelluxJs.currentPreference("reduced-motion"),
      sharedAlias: AelluxJs.currentPreference === $ae.currentPreference };
  });

  expect(values).toEqual({ absent: null, beforeInit: "no-preference", device: "reduced",
    local: "no-preference", cleared: null, sharedAlias: true });
});
