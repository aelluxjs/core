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
    const implicitInheritance = AelluxJs.registerCssProperty({
      name: "--ae-public-inheritance-probe", syntax: "<number>", initialValue: "0"
    });
    const parent = document.createElement("div");
    const child = document.createElement("div");
    parent.appendChild(child);
    document.body.appendChild(parent);
    parent.style.setProperty("--ae-public-inheritance-probe", "7");
    parent.style.setProperty(descriptor.name, "5px");
    const inheritedValue = getComputedStyle(child).getPropertyValue("--ae-public-inheritance-probe").trim();
    const isolatedValue = getComputedStyle(child).getPropertyValue(descriptor.name).trim();
    parent.remove();
    const duplicate = AelluxJs.registerCssProperty(descriptor);
    const invalid = AelluxJs.registerCssProperty({ ...descriptor, name: "invalid-name" });
    const batch = AelluxJs.registerCssProperty(
      { ...descriptor, name: "--ae-batch-registration-first" },
      { ...descriptor, name: "--ae-batch-registration-second" }
    );
    const partial = AelluxJs.registerCssProperty(
      descriptor,
      { ...descriptor, name: "--ae-batch-registration-after-failure" }
    );
    const continued = AelluxJs.registerCssProperty({
      ...descriptor, name: "--ae-batch-registration-after-failure"
    });
    const empty = AelluxJs.registerCssProperty();

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
      supported, beforeInit, implicitInheritance, inheritedValue, isolatedValue,
      duplicate, invalid, batch, partial, continued,
      empty, unavailable,
      sharedAlias: AelluxJs.registerCssProperty === $ae.registerCssProperty
    };
  });
  expect(result).toEqual({
    supported: result.supported,
    beforeInit: result.supported,
    implicitInheritance: result.supported,
    inheritedValue: "7",
    isolatedValue: result.supported ? "0px" : "5px",
    duplicate: false,
    invalid: false,
    batch: result.supported,
    partial: false,
    continued: false,
    empty: false,
    unavailable: false,
    sharedAlias: true
  });
});

test("extensions register the CSS properties they publish during init", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  await page.evaluate(() => Promise.all([
    "adaptive", "anchor", "present", "scrollbox", "scrollbox-snap"
  ].map(name => AelluxJs.wait(name))));
  await expect.poll(() => page.evaluate(() =>
    ["adaptive", "anchor", "present", "scrollbox", "scrollboxSnap"].every(name =>
      AelluxJs.ext[name]?.initialized)
  )).toBe(true);

  const values = await page.evaluate(() => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    const style = getComputedStyle(element);
    const names = [
      "--ae-width", "--ae-height",
      "--ae-anchor-x", "--ae-anchor-y", "--ae-anchor-origin-x", "--ae-anchor-origin-y",
      "--anchor-opacity",
      "--ae-from-opacity", "--ae-pop-opacity", "--ae-unpop-opacity",
      "--ae-from-transform", "--ae-pop-transform", "--ae-unpop-transform",
      "--ae-from-height", "--ae-pop-height", "--ae-unpop-height",
      "--ae-from-width", "--ae-pop-width", "--ae-unpop-width",
      "--ae-pop-ease", "--ae-unpop-ease", "--ae-pop-duration", "--ae-unpop-duration",
      "--ae-scroll-y-progress", "--ae-scroll-x-progress",
      "--ae-snap-viewport", "--ae-snap-focus",
      "--ae-scrollbar-x", "--ae-scrollbar-y", "--ae-scrollbar-length",
      "--ae-scrollbar-thumb-size", "--ae-scrollbar-thumb-position", "--ae-scrollbar-display",
      "--ae-scrollbar-opacity-visible", "--ae-scrollbar-opacity-fade",
      "--ae-scrollbar-thumb-radius", "--ae-scrollbar-size"
    ];
    const result = names.map(name => style.getPropertyValue(name).trim());
    element.remove();
    return result;
  });
  expect(values).toEqual([
    "0", "0", "0px", "0px", "50%", "0%", "1",
    "0", "1", "0", "scale(0.5)", "scale(1)", "scale(1.2)",
    "0fr", "1fr", "0fr", "0fr", "1fr", "0fr",
    "ease-out", "ease-in", "0.25s", "0.25s",
    "0", "0", "0", "0", "0px", "0px", "0px", "0px", "0px", "none", "1", "0", "10px", "8px"
  ]);

  const colors = await page.evaluate(() => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    const style = getComputedStyle(element);
    const values = ["--ae-scrollbar-thumb-color", "--ae-scrollbar-thumb-hover-color",
      "--ae-scrollbar-track-color"].map(name => style.getPropertyValue(name).trim());
    element.remove();
    return values;
  });
  expect(colors).toEqual(["", "", ""]);
});
