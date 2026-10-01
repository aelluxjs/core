import { expect, test } from "@playwright/test";

const scenarios = [
  "html-web-platform",
  "bootstrap-integration",
  "dynamic-update",
  "extension-eager",
  "extension-lazy",
  "extension-with-css",
  "extension-without-css",
  "extension-modern-only",
  "extension-legacy-only",
  "lifecycle-init-idempotence",
  "lifecycle-element-mount-unmount",
  "lifecycle-extension-destroy",
  "lifecycle-core-destroy",
  "runtime-modern",
  "runtime-legacy-forced",
  "extension-modern-legacy",
  "extension-failure-isolation"
];

async function openScenario(page, name) {
  await page.goto(`/tests/browser/${name}.html`);
  const result = page.locator("html");
  await expect.poll(async () => {
    const status = await result.getAttribute("data-test-status");
    if (status === "failed") {
      throw new Error(`${name}: ${await result.getAttribute("data-test-message")}`);
    }
    return status;
  }).toBe("passed");
}

for (const scenario of scenarios) {
  test(`${scenario} completes`, async ({ page }) => {
    await openScenario(page, scenario);
  });
}

test("renamed global and event prefix are available", async ({ page }) => {
  await openScenario(page, "runtime-modern");
  const result = await page.evaluate(() => ({
    sameAlias: window.AelluxJs === window.$ae,
    oldGlobal: typeof window.Aellux,
    eventName: window.AelluxJs.eventName("Ready")
  }));
  expect(result).toEqual({
    sameAlias: true,
    oldGlobal: "undefined",
    eventName: "AelluxJsReady"
  });
  const dispatchedType = await page.evaluate(() => new Promise(resolve => {
    document.addEventListener("AelluxJsProbe", event => resolve(event.type), { once: true });
    AelluxJs.dispatch("Probe");
  }));
  expect(dispatchedType).toBe("AelluxJsProbe");
});

test("renamed persistence keys and diagnostic name are used", async ({ page }) => {
  await openScenario(page, "runtime-modern");
  const result = await page.evaluate(() => {
    AelluxJs.persist.local.set("probe", "local");
    AelluxJs.persist.preferences.set("probe", "preferences");
    return {
      local: localStorage.getItem("AelluxJsPersist"),
      preferences: localStorage.getItem("AelluxJsPreferences"),
      oldLocal: localStorage.getItem("AelluxPersist"),
      oldPreferences: localStorage.getItem("AelluxPreferences"),
      errorName: AelluxJs.diagnostics.create(AelluxJs.diagnostics.ERROR_NOT_INITIALIZED).name
    };
  });
  expect(new URLSearchParams(result.local).get("probe")).toBe("local");
  expect(new URLSearchParams(result.preferences).get("probe")).toBe("preferences");
  expect(result.oldLocal).toBeNull();
  expect(result.oldPreferences).toBeNull();
  expect(result.errorName).toBe("AelluxJsDiagnosticError");
});

test("full runtime writes the renamed history state marker", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.stateNavigation?.initialized)).toBe(true);
  expect(await page.evaluate(() => ({
    adaptive: AelluxJs.adaptive,
    registered: Object.hasOwn(AelluxJs.extRegistry, "adaptive"),
    bundled: Object.hasOwn(AelluxJs.bundledExtensions, "adaptive")
  }))).toEqual({ adaptive: undefined, registered: false, bundled: false });
  expect(await page.evaluate(() => history.state?.aelluxJsState)).toBe(true);
  expect(await page.evaluate(() => history.state?.aelluxState)).toBeUndefined();
});

test("minified distribution exposes the renamed global", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.min.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => window.AelluxJs.supported)).toBe(true);
  expect(await page.evaluate(() => window.AelluxJs === window.$ae)).toBe(true);
  expect(await page.evaluate(() => typeof window.Aellux)).toBe("undefined");
});

test("preference labels update associated inputs safely", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div data-ae-preference="color-scheme">
        <input id="scheme:light" type="radio" name="scheme">
        <label data-ae-option="light" for="scheme:light">Light</label>
        <label data-ae-option="dark" for="missing-input">Dark</label>
      </div>`;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.preferences?.initialized)).toBe(true);
  await page.evaluate(() => {
    AelluxJs.preferences.set("color-scheme", "light");
    AelluxJs.preferences.update();
  });
  await expect(page.locator('[id="scheme:light"]')).toBeChecked();
  await expect(page.locator('[id="scheme:light"]')).toHaveValue("light");
});

test("dynamic elements can be mounted and unmounted after initialization", async ({ page }) => {
  await openScenario(page, "dynamic-update");
  await page.evaluate(async () => {
    const element = document.createElement("section");
    element.id = "playwright-dynamic-target";
    element.setAttribute("data-ae-preference", "color-scheme");
    document.querySelector("#dynamic-root").append(element);
    await $ae.update(element);
  });
  await expect(page.locator("#playwright-dynamic-target")).toHaveClass(/ae--mounted/);
  await page.evaluate(() => $ae.unmount(document.querySelector("#playwright-dynamic-target")));
  await expect(page.locator("#playwright-dynamic-target")).not.toHaveClass(/ae--mounted/);
});

test("extension stylesheet is loaded and applies its rule", async ({ page }) => {
  await openScenario(page, "extension-with-css");
  const style = page.locator("link[data-ae-ext-style='preferences']");
  await expect.poll(() => style.evaluate(link => Boolean(link.sheet))).toBe(true);
  await page.evaluate(() => {
    const element = document.createElement("div");
    element.id = "playwright-style-probe";
    document.body.append(element);
  });
  await expect.poll(() => page.locator("#playwright-style-probe").evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
});
