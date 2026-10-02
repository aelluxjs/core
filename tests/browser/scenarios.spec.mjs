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

test("ESM entry exports the shared core API", async ({ page }) => {
  await page.goto("/tests/index.htm");
  const created = await page.evaluate(async () => {
    const AelluxJs = (await import("/dist/aellux.esm.js")).default;
    window.importedAelluxJs = AelluxJs;
    return {
      sharedApi: AelluxJs === globalThis.AelluxJs,
      sharedAlias: AelluxJs === globalThis.$ae,
      attribute: AelluxJs.attr("preference"),
      extensionName: AelluxJs.extName("aellux.ext.state-navigation.js")
    };
  });
  expect(created).toEqual({
    sharedApi: true,
    sharedAlias: true,
    attribute: "data-ae-preference",
    extensionName: "state-navigation"
  });

  await page.addScriptTag({ url: "/dist/aellux.js" });
  expect(await page.evaluate(async () => {
    const AelluxJs = (await import("/dist/aellux.esm.js")).default;
    return AelluxJs === window.importedAelluxJs &&
      AelluxJs === globalThis.AelluxJs && AelluxJs === globalThis.$ae;
  })).toBe(true);
  await page.evaluate(() => window.importedAelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => window.importedAelluxJs.supported)).toBe(true);

  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  expect(await page.evaluate(async () => {
    const api = globalThis.AelluxJs;
    const AelluxJs = (await import("/dist/aellux.esm.js")).default;
    return AelluxJs === api && globalThis.$ae === api;
  })).toBe(true);
});

test("extension filename helper exposes the name terminology", async ({ page }) => {
  await openScenario(page, "runtime-modern");
  expect(await page.evaluate(() =>
    AelluxJs.extName("/dist/aellux.ext.state-navigation.js")
  )).toBe("state-navigation");
});

test("Extension names do not replace core API methods", async ({ page }) => {
  await openScenario(page, "runtime-modern");
  const result = await page.evaluate(async () => {
    const coreRequest = AelluxJs.request;
    AelluxJs.ext("request");
    AelluxJs.extRegister("request", { init() {} });
    const extension = await AelluxJs.wait("request");
    return {
      coreRequestPreserved: AelluxJs.request === coreRequest,
      extension: AelluxJs.ext.request === extension,
      initialized: extension.initialized,
      apiIsObject: typeof AelluxJs === "object"
    };
  });
  expect(result).toEqual({
    coreRequestPreserved: true,
    extension: true,
    initialized: true,
    apiIsObject: true
  });
});

for (const forceLegacy of [false, true]) {
  test(`Extension init receives normalized options in ${forceLegacy ? "Legacy" : "Modern"} runtime`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });
    await page.evaluate((legacy) => {
      AelluxJs.ext("option-probe");
      AelluxJs.extRegister("option-probe", {
        init(options) { window.optionProbeOptions = options; }
      });
      AelluxJs.ext("empty-probe");
      AelluxJs.extRegister("empty-probe", {
        init(options) { window.emptyProbeOptions = options; }
      });
      AelluxJs.init({
        mode: "basic",
        forceLegacy: legacy,
        extensions: {
          "option-probe": { enabled: true },
          alreadyCamel: { retained: true }
        }
      });
    }, forceLegacy);

    await expect.poll(() => page.evaluate(() => AelluxJs.ext.optionProbe?.initialized)).toBe(true);
    expect(await page.evaluate(() => ({
      legacy: AelluxJs.legacy,
      sameObject: window.optionProbeOptions === AelluxJs.options.extensions.optionProbe,
      enabled: window.optionProbeOptions.enabled,
      camelKeyRetained: AelluxJs.options.extensions.alreadyCamel.retained,
      hyphenKeyRemoved: !Object.hasOwn(AelluxJs.options.extensions, "option-probe"),
      emptyOptions: Object.keys(window.emptyProbeOptions).length === 0
    }))).toEqual({
      legacy: forceLegacy,
      sameObject: true,
      enabled: true,
      camelKeyRetained: true,
      hyphenKeyRemoved: true,
      emptyOptions: true
    });
  });
}

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
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.stateNavigation?.initialized)).toBe(true);
  expect(await page.evaluate(() => ({
    registered: Object.hasOwn(AelluxJs.extRegistry, "stateNavigation"),
    bundled: Object.hasOwn(AelluxJs.bundledExtensions, "stateNavigation"),
    oldRegistered: Object.hasOwn(AelluxJs.extRegistry, "state-navigation"),
    oldBundled: Object.hasOwn(AelluxJs.bundledExtensions, "state-navigation")
  }))).toEqual({ registered: true, bundled: true, oldRegistered: false, oldBundled: false });
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
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.preference?.initialized)).toBe(true);
  await page.evaluate(() => {
    AelluxJs.ext.preference.set("color-scheme", "light");
    AelluxJs.ext.preference.update();
  });
  await expect(page.locator('[id="scheme:light"]')).toBeChecked();
  await expect(page.locator('[id="scheme:light"]')).toHaveValue("light");
});

test("color scheme preference updates theme color metadata", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.head.insertAdjacentHTML("beforeend", `
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000">`);
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    AelluxJs.persist.preferences.set("colorScheme", "dark");
    AelluxJs.ext("preference");
    AelluxJs.init({ mode: "basic" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.preference?.initialized)).toBe(true);
  const themeColor = () => page.locator("meta[data-ae-theme-color]").getAttribute("content");
  await expect.poll(themeColor).toBe("#000000");

  await page.evaluate(() => {
    AelluxJs.ext.preference.set("color-scheme", "light");
    AelluxJs.ext.preference.update();
  });
  await expect.poll(themeColor).toBe("#ffffff");

  await page.evaluate(() => {
    AelluxJs.ext.preference.set("color-scheme", "auto");
    AelluxJs.ext.preference.update();
  });
  await expect(page.locator("meta[data-ae-theme-color]")).toHaveCount(0);
});

test("AJAX links preserve native navigation when appropriate", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    AelluxJs.ext("ajax-href");
    AelluxJs.init({ mode: "basic" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.ajaxHref?.initialized)).toBe(true);

  const results = await page.evaluate(() => {
    const results = [];
    const listener = event => {
      results.push(event.defaultPrevented);
      event.preventDefault();
    };
    document.addEventListener("click", listener);
    for (const [href, target] of [
      [location.href, "_blank"],
      ["#probe", ""],
      [location.href, ""]
    ]) {
      const link = document.createElement("a");
      link.href = href;
      link.target = target;
      link.setAttribute("data-ae-ajax-href", "main");
      document.body.append(link);
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
      link.remove();
    }
    document.removeEventListener("click", listener);
    return results;
  });
  expect(results).toEqual([false, false, true]);
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
  const style = page.locator("link[data-ae-ext-style='preference']");
  await expect.poll(() => style.evaluate(link => Boolean(link.sheet))).toBe(true);
  await page.evaluate(() => {
    const element = document.createElement("div");
    element.id = "playwright-style-probe";
    document.body.append(element);
  });
  await expect.poll(() => page.locator("#playwright-style-probe").evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
});

test("compound extension names use camelCase registry keys and hyphenated assets", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  const initial = await page.evaluate(() => {
    AelluxJs.ext("stateNavigation", {
      loadWhen: "#state-navigation-probe",
      loadStyle: "/tests/browser/extension-style.css"
    });
    const registryKey = Object.hasOwn(AelluxJs.extRegistry, "stateNavigation");
    const lazyKey = Object.hasOwn(AelluxJs.lazyExtensionSelectors, "stateNavigation");
    document.body.insertAdjacentHTML("beforeend", '<div id="state-navigation-probe"></div>');
    AelluxJs.init({ mode: "basic" });
    return { registryKey, lazyKey };
  });
  expect(initial).toEqual({ registryKey: true, lazyKey: true });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.stateNavigation?.initialized)).toBe(true);
  const result = await page.evaluate(() => ({
    registryKey: Object.hasOwn(AelluxJs.extRegistry, "stateNavigation"),
    oldRegistryKey: Object.hasOwn(AelluxJs.extRegistry, "state-navigation"),
    lazyKeyCleared: !Object.hasOwn(AelluxJs.lazyExtensionSelectors, "stateNavigation"),
    script: document.querySelector("script[data-ae-ext='state-navigation']")?.getAttribute("src"),
    style: Boolean(document.querySelector("link[data-ae-ext-style='state-navigation']"))
  }));
  expect(result.registryKey).toBe(true);
  expect(result.oldRegistryKey).toBe(false);
  expect(result.lazyKeyCleared).toBe(true);
  expect(result.script).toMatch(/aellux\.ext\.state-navigation\.js$/);
  expect(result.style).toBe(true);
});
