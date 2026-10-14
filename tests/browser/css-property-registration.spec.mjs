import { expect, test } from "@playwright/test";

test("public CSS property registration detects support and rejected registrations", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  const result = await page.evaluate(() => {
    const descriptor = {
      name: "--ae-public-registration-probe",
      syntax: "<length>", inherits: false, initialValue: "0px"
    };
    const supported = !!(window.CSS && typeof CSS.registerProperty === "function");
    const beforeInit = AelluxJs.registerCssProperty(descriptor);
    const duplicate = AelluxJs.registerCssProperty(descriptor);
    const invalid = AelluxJs.registerCssProperty({ ...descriptor, name: "invalid-name" });

    const css = window.CSS;
    const original = css && Object.getOwnPropertyDescriptor(css, "registerProperty");
    if (css) Object.defineProperty(css, "registerProperty", {
      configurable: true, value: undefined
    });
    const unavailable = AelluxJs.registerCssProperty({ ...descriptor, name: "--ae-no-api-probe" });
    if (css) {
      if (original) Object.defineProperty(css, "registerProperty", original);
      else delete css.registerProperty;
    }
    return {
      supported, beforeInit, duplicate, invalid, unavailable,
      sharedAlias: AelluxJs.registerCssProperty === $ae.registerCssProperty
    };
  });
  expect(result).toEqual({
    supported: result.supported,
    beforeInit: result.supported,
    duplicate: false,
    invalid: false,
    unavailable: false,
    sharedAlias: true
  });
});
