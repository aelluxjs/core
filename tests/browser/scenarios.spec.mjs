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

test("diagnostic verbosity normalizes a named level", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  const result = await page.evaluate(() => {
    const levels = AelluxJs.diagnostics.levels;
    AelluxJs.init({ mode: "basic", verboseLevel: "warn" });
    const calls = [];
    const original = {
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    console.error = () => calls.push("error");
    console.warn = () => calls.push("warn");
    console.info = () => calls.push("info");
    try {
      const definition = { code: 9999, message: "Probe" };
      AelluxJs.diagnostics.error(definition);
      AelluxJs.diagnostics.warn(definition);
      AelluxJs.diagnostics.info(definition);
    } finally {
      console.error = original.error;
      console.warn = original.warn;
      console.info = original.info;
    }
    return {
      levels,
      configured: AelluxJs.options.verboseLevel,
      diagnosticLevel: AelluxJs.diagnostics.verboseLevel,
      calls
    };
  });
  expect(result).toEqual({
    levels: { error: 0, warn: 1, info: 2 },
    configured: 1,
    diagnosticLevel: 1,
    calls: ["error", "warn"]
  });
});

test("diagnostic verbosity can change after init without other options", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  const result = await page.evaluate(() => {
    AelluxJs.init();
    const initial = AelluxJs.diagnostics.verboseLevel;
    AelluxJs.init({ verboseLevel: "info" });
    return {
      initial,
      configured: AelluxJs.options.verboseLevel,
      active: AelluxJs.diagnostics.verboseLevel
    };
  });
  expect(result).toEqual({ initial: 0, configured: 2, active: 2 });
});

test("diagnostic history includes filtered logs and shows the last requested lines", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  const result = await page.evaluate(() => {
    const diagnostics = AelluxJs.diagnostics;
    const definition = { code: 9999, message: "History probe" };
    const calls = [];
    const original = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      log: console.log
    };
    console.error = () => calls.push("error");
    console.warn = () => calls.push("warn");
    console.info = () => calls.push("info");
    console.log = (...args) => calls.push(args);
    try {
      diagnostics.error(definition);
      diagnostics.warn(definition, { source: "filtered warning" });
      diagnostics.info(definition);
      const beforeReplay = calls.slice();
      const lastTwo = diagnostics.showHistory(2);
      const all = diagnostics.showHistory();
      const noLines = diagnostics.showHistory(0);
      return { beforeReplay, calls, lastTwo, all, noLines };
    } finally {
      console.error = original.error;
      console.warn = original.warn;
      console.info = original.info;
      console.log = original.log;
    }
  });
  expect(result.beforeReplay).toEqual(["error"]);
  expect(result.all).toHaveLength(3);
  expect(result.all.map(entry => entry.level)).toEqual([0, 1, 2]);
  expect(result.lastTwo).toEqual(result.all.slice(1));
  expect(result.noLines).toEqual([]);
  expect(result.all[1].context).toEqual({ source: "filtered warning" });
  expect(result.all[0].timestamp).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  expect(result.calls).toHaveLength(6);
  expect(result.calls[1][0]).toContain(result.all[1].timestamp);
  expect(result.calls[1][0]).toContain("History probe");
});

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
      extensionRegistry: Object.keys(AelluxJs.registry.ext).length,
      dependencyRegistry: Object.keys(AelluxJs.registry.dep).length,
      lazySelectors: Object.keys(AelluxJs.registry.lazyExtSelectors).length,
      extMounters: Object.keys(AelluxJs.registry.extMounters).length,
      preferenceMediaQueries: Object.hasOwn(AelluxJs.registry.preferenceMediaQueries, "colorScheme"),
      oldPreferenceMediaQueries: Object.hasOwn(AelluxJs, "preferencesMediaQueries"),
      diagnosticsLegacy: AelluxJs.diagnostics.legacy,
      diagnosticsSupported: AelluxJs.diagnostics.supported,
      diagnosticsNotAvailable: AelluxJs.diagnostics.notAvailable.length,
      oldRuntimeStatus: ["legacy", "supported", "notAvailable"].some(key => Object.hasOwn(AelluxJs, key)),
      oldRegistry: Object.hasOwn(AelluxJs, "extRegistry"),
      oldLazySelectors: Object.hasOwn(AelluxJs, "lazyExtensionSelectors"),
      oldExtensionMounters: Object.hasOwn(AelluxJs, "extensionMounters"),
      oldRegistryLazySelectors: Object.hasOwn(AelluxJs.registry, "lazyExtensionSelectors"),
      oldRegistryExtensionMounters: Object.hasOwn(AelluxJs.registry, "extensionMounters"),
      attribute: AelluxJs.attr("preference"),
      extensionName: AelluxJs.extName("aellux.ext.state-navigation.js")
    };
  });
  expect(created).toEqual({
    sharedApi: true,
    sharedAlias: true,
    extensionRegistry: 0,
    dependencyRegistry: 0,
    lazySelectors: 0,
    extMounters: 0,
    preferenceMediaQueries: true,
    oldPreferenceMediaQueries: false,
    diagnosticsLegacy: false,
    diagnosticsSupported: false,
    diagnosticsNotAvailable: 0,
    oldRuntimeStatus: false,
    oldRegistry: false,
    oldLazySelectors: false,
    oldExtensionMounters: false,
    oldRegistryLazySelectors: false,
    oldRegistryExtensionMounters: false,
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
  await expect.poll(() => page.evaluate(() => window.importedAelluxJs.diagnostics.supported)).toBe(true);

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
    AelluxJs.extAttach("request", { init() {} });
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
      AelluxJs.extAttach("option-probe", {
        init(options) { window.optionProbeOptions = options; }
      });
      AelluxJs.ext("empty-probe");
      AelluxJs.extAttach("empty-probe", {
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
      legacy: AelluxJs.diagnostics.legacy,
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
    registered: Object.hasOwn(AelluxJs.registry.ext, "stateNavigation"),
    bundled: Object.hasOwn(AelluxJs.bundledExtensions, "stateNavigation"),
    oldRegistered: Object.hasOwn(AelluxJs.registry.ext, "state-navigation"),
    oldBundled: Object.hasOwn(AelluxJs.bundledExtensions, "state-navigation")
  }))).toEqual({ registered: true, bundled: true, oldRegistered: false, oldBundled: false });
  expect(await page.evaluate(() => ({
    initialized: AelluxJs.ext.adaptive?.initialized,
    registered: Object.hasOwn(AelluxJs.registry.ext, "adaptive"),
    bundled: Object.hasOwn(AelluxJs.bundledExtensions, "adaptive"),
    style: AelluxJs.registry.ext.adaptive?.loadStyle,
    ajaxHrefBundled: Object.hasOwn(AelluxJs.bundledExtensions, "ajaxHref")
  }))).toEqual({ initialized: true, registered: true, bundled: true, style: true, ajaxHrefBundled: false });
  expect(await page.evaluate(() => history.state?.aelluxJsState)).toBe(true);
  expect(await page.evaluate(() => history.state?.aelluxState)).toBeUndefined();
});

test("minified distribution exposes the renamed global", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.min.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => window.AelluxJs.diagnostics.supported)).toBe(true);
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.adaptive?.initialized)).toBe(true);
  await expect(page.locator('link[data-ae-ext-style="adaptive"]')).toHaveAttribute(
    "href", /aellux\.ext\.adaptive\.min\.css$/
  );
  expect(await page.evaluate(() => window.AelluxJs === window.$ae)).toBe(true);
  expect(await page.evaluate(() => typeof window.Aellux)).toBe("undefined");
});

test("legacy full runtime loads adaptive and its stylesheet", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full", forceLegacy: true }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.adaptive?.initialized)).toBe(true);
  await expect(page.locator('link[data-ae-ext-style="adaptive"]')).toHaveAttribute(
    "href", /aellux\.ext\.adaptive\.css$/
  );
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

test("full runtime loads generated adaptive styles", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="ae--fits-small"><div id="adaptive-probe" class="p-ux-sm-2"></div></div>';
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.adaptive?.initialized)).toBe(true);
  await expect(page.locator('link[data-ae-ext-style="adaptive"]')).toHaveAttribute(
    "href", /aellux\.ext\.adaptive\.css$/
  );
  await expect.poll(() => page.locator("#adaptive-probe").evaluate(
    element => getComputedStyle(element).paddingTop
  )).toBe("8px");
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
    const registryKey = Object.hasOwn(AelluxJs.registry.ext, "stateNavigation");
    const lazyKey = Object.hasOwn(AelluxJs.registry.lazyExtSelectors, "stateNavigation");
    document.body.insertAdjacentHTML("beforeend", '<div id="state-navigation-probe"></div>');
    AelluxJs.init({ mode: "basic" });
    return { registryKey, lazyKey };
  });
  expect(initial).toEqual({ registryKey: true, lazyKey: true });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.stateNavigation?.initialized)).toBe(true);
  const result = await page.evaluate(() => ({
    registryKey: Object.hasOwn(AelluxJs.registry.ext, "stateNavigation"),
    oldRegistryKey: Object.hasOwn(AelluxJs.registry.ext, "state-navigation"),
    lazyKeyCleared: !Object.hasOwn(AelluxJs.registry.lazyExtSelectors, "stateNavigation"),
    script: document.querySelector("script[data-ae-ext='state-navigation']")?.getAttribute("src"),
    style: Boolean(document.querySelector("link[data-ae-ext-style='state-navigation']"))
  }));
  expect(result.registryKey).toBe(true);
  expect(result.oldRegistryKey).toBe(false);
  expect(result.lazyKeyCleared).toBe(true);
  expect(result.script).toMatch(/aellux\.ext\.state-navigation\.js$/);
  expect(result.style).toBe(true);
});
