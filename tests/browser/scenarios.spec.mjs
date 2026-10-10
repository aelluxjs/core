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

test("callable API returns null before the mount manager starts", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  expect(await page.evaluate(() => ({
    sameAlias: AelluxJs === $ae,
    callable: typeof AelluxJs === "function",
    result: $ae("missing")
  }))).toEqual({ sameAlias: true, callable: true, result: null });
});

test("invalid mount root selectors are recorded for mount and unmount", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    const mounted = await AelluxJs.mount("[");
    const unmounted = await AelluxJs.unmount("[");
    const entries = AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 1005);
    return {
      mounted, unmounted,
      entries: entries.map(entry => ({
        level: entry.level,
        selector: entry.context.selector,
        method: entry.context.method,
        hasCause: entry.context.cause instanceof Error
      }))
    };
  });
  expect(result).toEqual({
    mounted: [],
    unmounted: true,
    entries: [
      { level: 0, selector: "[", method: "mount", hasCause: true },
      { level: 0, selector: "[", method: "unmount", hasCause: true }
    ]
  });
});

test("mount failure records a diagnostic and clears aria-busy", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    const target = document.createElement("div");
    target.setAttribute(AelluxJs.attr("wait-mounted"), "");
    document.body.append(target);
    AelluxJs.ext("failure-probe");
    const originalWait = AelluxJs.wait;
    AelluxJs.wait = () => Promise.reject(new Error("mount preparation failed"));
    try {
      const mounted = await AelluxJs.mount(target, "failure-probe");
      const entry = AelluxJs.diagnostics.showHistory().find(item => item.code === 1006);
      return {
        mounted,
        busy: target.getAttribute("aria-busy"),
        diagnostic: entry && {
          level: entry.level,
          sameRoot: entry.context.root === target,
          extensions: entry.context.extensions,
          cause: entry.context.cause.message
        }
      };
    } finally {
      AelluxJs.wait = originalWait;
    }
  });

  expect(result).toEqual({
    mounted: [],
    busy: "false",
    diagnostic: {
      level: 0,
      sameRoot: true,
      extensions: "failure-probe",
      cause: "mount preparation failed"
    }
  });
});

test("mount returns unique newly mounted elements across matching roots", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = `
      <section data-result-root><div id="first" data-result-mount></div></section>
      <section data-result-root><div id="second" data-result-mount></div></section>
    `;
    AelluxJs.ext("result-probe");
    AelluxJs.extAttach("result-probe", { init() {} });
    await AelluxJs.wait("result-probe");
    const manager = AelluxJs.mountManager;
    for (const selector of ["[data-result-mount]", "div[data-result-mount]"]) {
      manager.add({ extensionName: "result-probe", selector, mount() {} });
    }

    const first = await AelluxJs.mount("[data-result-root]", "result-probe");
    const second = await AelluxJs.mount("[data-result-root]", "result-probe");
    const missing = await AelluxJs.mount("[data-missing-root]", "result-probe");
    return { first: first.map(element => element.id), second, missing };
  });

  expect(result).toEqual({ first: ["first", "second"], second: [], missing: [] });
});

test("mount unmounts elements detached by an async mount callback", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="detached-during-mount" data-detach-probe aria-expanded="initial"></div>';
    const target = document.getElementById("detached-during-mount");
    let unmountCalls = 0;
    AelluxJs.ext("detach-probe");
    AelluxJs.extAttach("detach-probe", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "detach-probe",
          selector: "[data-detach-probe]",
          async mount(element) {
            element.setAttribute("aria-expanded", "mounting");
            element.remove();
            await Promise.resolve();
            element.setAttribute("aria-expanded", "mounted");
          },
          unmount() { unmountCalls++; },
          controllers: []
        });
      }
    });
    await AelluxJs.wait("detach-probe");
    const mounted = await AelluxJs.mount(target, "detach-probe");
    return {
      mounted: mounted.map(element => element.id),
      unmountCalls,
      expanded: target.getAttribute("aria-expanded"),
      mountedClass: target.classList.contains(AelluxJs.className("mounted")),
      controller: AelluxJs.mountManager.controller(target)
    };
  });

  expect(result).toEqual({
    mounted: [],
    unmountCalls: 1,
    expanded: "initial",
    mountedClass: false,
    controller: null
  });
});

test("concurrent mount calls share a pending element mount", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="concurrent" data-concurrent-probe></div>';
    const target = document.getElementById("concurrent");
    let mountCalls = 0;
    AelluxJs.ext("concurrent-probe");
    AelluxJs.extAttach("concurrent-probe", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "concurrent-probe",
          selector: "[data-concurrent-probe]",
          async mount() {
            mountCalls++;
            await new Promise(resolve => setTimeout(resolve, 20));
          }
        });
      }
    });
    await AelluxJs.wait("concurrent-probe");
    const [first, second] = await Promise.all([
      AelluxJs.mount(target, "concurrent-probe"),
      AelluxJs.mount(target, "concurrent-probe")
    ]);
    return {
      mountCalls,
      first: first.map(element => element.id),
      second: second.map(element => element.id)
    };
  });

  expect(result).toEqual({ mountCalls: 1, first: ["concurrent"], second: [] });
});

test("partial mount failures return only successful elements and restore the failure", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = `
      <div id="partial-first" data-partial aria-label="first"></div>
      <div id="partial-failure" data-partial aria-label="failure"></div>
      <div id="partial-after" data-partial aria-label="after"></div>
    `;
    AelluxJs.ext("partial-probe");
    AelluxJs.extAttach("partial-probe", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "partial-probe", selector: "[data-partial]",
          mount(element) {
            element.setAttribute("aria-label", `mounted-${element.id}`);
            if (element.id === "partial-failure") throw new Error("partial failure");
          }
        });
      }
    });
    await AelluxJs.wait("partial-probe");
    const mounted = await AelluxJs.mount(document, "partial-probe");
    const diagnostic = AelluxJs.diagnostics.showHistory()
      .find(entry => entry.code === 1103 && entry.context.extension === "partial-probe");
    return {
      mounted: mounted.map(element => element.id),
      first: document.getElementById("partial-first").getAttribute("aria-label"),
      failure: document.getElementById("partial-failure").getAttribute("aria-label"),
      after: document.getElementById("partial-after").getAttribute("aria-label"),
      diagnostic: diagnostic && {
        method: diagnostic.context.method,
        selector: diagnostic.context.selector,
        cause: diagnostic.context.cause.message
      }
    };
  });

  expect(result).toEqual({
    mounted: ["partial-first", "partial-after"],
    first: "mounted-partial-first",
    failure: "failure",
    after: "mounted-partial-after",
    diagnostic: {
      method: "mount",
      selector: "[data-partial]",
      cause: "partial failure"
    }
  });
});

test("update and unmount failures are isolated and cleanup still completes", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="failure-lifecycle" data-failure-lifecycle aria-expanded="initial"></div>';
    const calls = [];
    AelluxJs.ext("failure-lifecycle");
    AelluxJs.extAttach("failure-lifecycle", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "failure-lifecycle", selector: "[data-failure-lifecycle]",
          mount(element) { element.setAttribute("aria-expanded", "true"); },
          update() { throw new Error("update failed"); },
          unmount() { throw new Error("unmount failed"); }
        });
        AelluxJs.mountManager.add({
          extensionName: "failure-lifecycle", selector: "#failure-lifecycle",
          mount() { calls.push("second-mount"); },
          update() { calls.push("second-update"); },
          unmount() { calls.push("second-unmount"); }
        });
      }
    });
    await AelluxJs.wait("failure-lifecycle");
    const target = document.getElementById("failure-lifecycle");
    await AelluxJs.mount(target, "failure-lifecycle");
    const controller = AelluxJs.mountManager.controller(target);
    await AelluxJs.mountManager.update(target, "failure-lifecycle");
    await AelluxJs.unmount(target, "failure-lifecycle");
    const diagnostics = AelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 1103 &&
        entry.context.extension === "failure-lifecycle");
    return {
      calls,
      methods: diagnostics.map(entry => entry.context.method),
      causes: diagnostics.map(entry => entry.context.cause.message),
      expanded: target.getAttribute("aria-expanded"),
      mountedClass: target.classList.contains(AelluxJs.className("mounted")),
      controllerHasMounts: controller.hasMounts()
    };
  });

  expect(result).toEqual({
    calls: ["second-mount", "second-update", "second-unmount"],
    methods: ["update", "unmount"],
    causes: ["update failed", "unmount failed"],
    expanded: "initial",
    mountedClass: false,
    controllerHasMounts: false
  });
});

test("wait awaits async Extension init and diagnoses rejection", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    AelluxJs.ext("async-success");
    let finishInit;
    AelluxJs.extAttach("async-success", {
      init() { return new Promise(resolve => { finishInit = resolve; }); }
    });
    const pending = AelluxJs.wait("async-success");
    await Promise.resolve();
    const initializedBeforeResolution = AelluxJs.ext.asyncSuccess.initialized;
    finishInit();
    const success = await pending;

    AelluxJs.ext("async-failure");
    AelluxJs.extAttach("async-failure", {
      async init() { throw new Error("init probe failed"); }
    });
    const failure = await AelluxJs.wait("async-failure");
    const diagnostic = AelluxJs.diagnostics.showHistory()
      .find(entry => entry.code === 1102 && entry.context.extension === "async-failure");
    return {
      initializedBeforeResolution,
      initializedAfterResolution: success.initialized,
      failure,
      failureInitialized: AelluxJs.ext.asyncFailure.initialized,
      diagnostic: diagnostic && {
        level: diagnostic.level,
        cause: diagnostic.context.cause.message
      }
    };
  });
  expect(result).toEqual({
    initializedBeforeResolution: false,
    initializedAfterResolution: true,
    failure: null,
    failureInitialized: false,
    diagnostic: { level: 0, cause: "init probe failed" }
  });
});

test("failed lazy Extension initialization can be retried", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    let initCalls = 0;
    AelluxJs.ext("retry-initialize", { loadWhen: "[data-retry-initialize]" });
    AelluxJs.extAttach("retry-initialize", {
      async init() {
        initCalls++;
        await Promise.resolve();
        if (initCalls === 1) throw new Error("first initialization failed");
      }
    });

    const firstPromise = AelluxJs.wait("retry-initialize");
    const concurrentPromise = AelluxJs.wait("retry-initialize");
    const firstResults = await Promise.all([firstPromise, concurrentPromise]);
    const indexedAfterFailure = Object.hasOwn(
      AelluxJs.registry.lazyExtSelectors, "retryInitialize"
    );
    const retried = await AelluxJs.wait("retry-initialize");
    const indexedAfterSuccess = Object.hasOwn(
      AelluxJs.registry.lazyExtSelectors, "retryInitialize"
    );
    const diagnostics = AelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 1102 &&
        entry.context.extension === "retry-initialize");

    return {
      sharedPromise: firstPromise === concurrentPromise,
      firstResults,
      indexedAfterFailure,
      retried: retried === AelluxJs.ext.retryInitialize,
      initialized: AelluxJs.ext.retryInitialize.initialized,
      indexedAfterSuccess,
      initCalls,
      diagnosticCount: diagnostics.length
    };
  });

  expect(result).toEqual({
    sharedPromise: true,
    firstResults: [null, null],
    indexedAfterFailure: true,
    retried: true,
    initialized: true,
    indexedAfterSuccess: false,
    initCalls: 2,
    diagnosticCount: 1
  });
});

test("failed lazy asset loading can retry and destroy removes its assets", async ({ page }) => {
  let scriptRequests = 0;
  await page.route("**/aellux.ext.retry-load.js", async route => {
    scriptRequests++;
    if (scriptRequests === 1) {
      await route.abort("failed");
      return;
    }
    await route.fulfill({
      contentType: "text/javascript",
      body: `AelluxJs.extAttach("retry-load", {
        init: function () { window.retryLoadInitCalls = (window.retryLoadInitCalls || 0) + 1; },
        destroy: function () {}
      });`
    });
  });
  await page.route("**/aellux.ext.retry-load.css", route => route.fulfill({
    contentType: "text/css",
    body: "[data-retry-load] { display: block; }"
  }));
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    AelluxJs.ext("/virtual/aellux.ext.retry-load.js", {
      loadWhen: "[data-retry-load]",
      loadStyle: true
    });
    const firstPromise = AelluxJs.wait("retry-load");
    const concurrentPromise = AelluxJs.wait("retry-load");
    const failed = await Promise.all([firstPromise, concurrentPromise]);
    const indexedAfterFailure = Object.hasOwn(
      AelluxJs.registry.lazyExtSelectors, "retryLoad"
    );
    const retried = await AelluxJs.wait("retry-load");
    const retrySucceeded = retried === AelluxJs.ext.retryLoad;
    const assetSelector = `[data-ae-ext="retry-load"], [data-ae-ext-style="retry-load"]`;
    const assetsBeforeDestroy = document.querySelectorAll(assetSelector).length;
    await AelluxJs.destroyExtensions("retry-load");
    return {
      sharedPromise: firstPromise === concurrentPromise,
      failed,
      indexedAfterFailure,
      retried: retrySucceeded,
      initCalls: window.retryLoadInitCalls,
      assetsBeforeDestroy,
      assetsAfterDestroy: document.querySelectorAll(assetSelector).length,
      registeredAfterDestroy: Object.hasOwn(AelluxJs.registry.ext, "retryLoad")
    };
  });

  expect(scriptRequests).toBe(2);
  expect(result).toEqual({
    sharedPromise: true,
    failed: [null, null],
    indexedAfterFailure: true,
    retried: true,
    initCalls: 1,
    assetsBeforeDestroy: 4,
    assetsAfterDestroy: 0,
    registeredAfterDestroy: false
  });
});

test("failed Extension stylesheet records a warning without blocking init", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    AelluxJs.ext("/dist/aellux.ext.feedback.js", {
      loadStyle: "/tests/browser/missing-extension-style.css"
    });
    const extension = await AelluxJs.wait("feedback");
    const diagnostic = AelluxJs.diagnostics.showHistory()
      .find(entry => entry.code === 2004);
    return {
      initialized: extension.initialized,
      diagnostic: diagnostic && {
        level: diagnostic.level,
        extension: diagnostic.context.extension,
        url: diagnostic.context.url
      }
    };
  });
  expect(result.initialized).toBe(true);
  expect(result.diagnostic).toEqual({
    level: 1,
    extension: "feedback",
    url: expect.stringContaining("/tests/browser/missing-extension-style.css")
  });
});

test("waiting for an unregistered Extension records an error", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    const rejection = await AelluxJs.wait("never-registered-probe").catch(error => error);
    const entry = AelluxJs.diagnostics.showHistory()
      .find(item => item.code === 1110);
    return {
      rejectionCode: rejection.code,
      level: entry.level,
      extension: entry.context.extension
    };
  });
  expect(result).toEqual({
    rejectionCode: 1110, level: 0, extension: "never-registered-probe"
  });
});

test("extAttach diagnoses invalid arguments without attaching the Extension", async ({ page }) => {
  await page.goto("/tests/index.htm");

  const result = await page.evaluate(async () => {
    const [{ createAelluxApi }, { createAelluxConstants }] = await Promise.all([
      import("/src/internal/aellux-api-integration.js"),
      import("/src/internal/create-aellux-constants.js")
    ]);
    const AelluxJs = createAelluxApi(window, createAelluxConstants());
    const api = { init() {} };
    AelluxJs.extAttach(null, api);
    AelluxJs.extAttach("bad name", api);
    AelluxJs.extAttach("constructor", api);
    AelluxJs.ext("bad-api");
    AelluxJs.extAttach("bad-api", null);
    AelluxJs.extAttach("bad-api", { init: true });
    AelluxJs.extAttach("bad-api", { init() {}, destroy: false });
    AelluxJs.ext("bad-selector", { loadWhen: "[" });
    AelluxJs.extAttach("bad-selector", api);
    AelluxJs.ext("bad-selector-type", { loadWhen: 123 });
    AelluxJs.extAttach("bad-selector-type", api);
    AelluxJs.ext("bad-selector-empty", { loadWhen: " " });
    AelluxJs.ext("bad-selector-false", { loadWhen: false });
    AelluxJs.ext("retry-probe", { loadWhen: "[" });
    AelluxJs.ext("retry-probe", { loadWhen: "[data-retry]" });
    AelluxJs.extAttach("retry-probe", { init() {} });
    AelluxJs.extAttach("undeclared-probe", api);
    AelluxJs.ext("valid-probe");
    AelluxJs.extAttach("valid-probe", api);
    AelluxJs.extAttach("valid-probe", { init() {} });
    AelluxJs.ext("valid-lazy", { loadWhen: "[data-valid]" });
    AelluxJs.extAttach("valid-lazy", { init() {}, metadata: { ok: true } });

    const entries = AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 1112);
    const registrationEntries = AelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 1110 || entry.code === 1101);
    const loadWhenEntries = AelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 1114);
    return {
      arguments: entries.map(entry => entry.context.argument),
      registrationCodes: registrationEntries.map(entry => entry.code),
      unregisteredAttachMethod: registrationEntries
        .find(entry => entry.code === 1110 && entry.context.extension === "undeclared-probe")
        .context.method,
      invalidSelectors: loadWhenEntries.map(entry => entry.context.selector),
      malformedSelectorHasCause: loadWhenEntries[0].context.cause instanceof Error,
      undeclaredRegistered: Object.hasOwn(AelluxJs.registry.ext, "undeclaredProbe"),
      undeclaredAttached: Object.hasOwn(AelluxJs.ext, "undeclaredProbe"),
      invalidNameRegistered: Object.hasOwn(AelluxJs.registry.ext, "bad name"),
      badApiState: AelluxJs.registry.ext.badApi.state,
      badApiAttached: Object.hasOwn(AelluxJs.ext, "badApi"),
      badSelectorRegistered: Object.hasOwn(AelluxJs.registry.ext, "badSelector"),
      badSelectorAttached: Object.hasOwn(AelluxJs.ext, "badSelector"),
      badSelectorTypeRegistered: Object.hasOwn(AelluxJs.registry.ext, "badSelectorType"),
      badSelectorTypeAttached: Object.hasOwn(AelluxJs.ext, "badSelectorType"),
      badSelectorEmptyRegistered: Object.hasOwn(AelluxJs.registry.ext, "badSelectorEmpty"),
      badSelectorFalseRegistered: Object.hasOwn(AelluxJs.registry.ext, "badSelectorFalse"),
      badSelectorIndexed: Object.hasOwn(AelluxJs.registry.lazyExtSelectors, "badSelector"),
      retryAttached: !!AelluxJs.ext.retryProbe,
      validAttached: AelluxJs.ext.validProbe === api,
      validLazyAttached: AelluxJs.ext.validLazy.metadata.ok
    };
  });

  expect(result).toEqual({
    arguments: ["name", "name", "name", "api", "api", "api"],
    registrationCodes: [1110, 1110, 1110, 1101],
    unregisteredAttachMethod: "extAttach",
    invalidSelectors: ["[", 123, " ", false, "["],
    malformedSelectorHasCause: true,
    undeclaredRegistered: false,
    undeclaredAttached: false,
    invalidNameRegistered: false,
    badApiState: "wait",
    badApiAttached: false,
    badSelectorRegistered: false,
    badSelectorAttached: false,
    badSelectorTypeRegistered: false,
    badSelectorTypeAttached: false,
    badSelectorEmptyRegistered: false,
    badSelectorFalseRegistered: false,
    badSelectorIndexed: false,
    retryAttached: true,
    validAttached: true,
    validLazyAttached: true
  });
});

test("missing mounted controller method records a warning", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="method-target" data-method-probe></div>';
    AelluxJs.ext("method-probe");
    AelluxJs.extAttach("method-probe", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "method-probe", selector: "[data-method-probe]",
          mount: () => {}, unmount: () => {}, controllers: ["missingMethod"]
        });
      }
    });
    await AelluxJs.wait("method-probe");
    const target = document.getElementById("method-target");
    await AelluxJs.mount(target, "method-probe");
    const controller = AelluxJs.mountManager.controller(target);
    const entry = AelluxJs.diagnostics.showHistory()
      .find(item => item.code === 2005);
    return {
      controllerExists: !!controller,
      hasMissingMethod: typeof controller.methodProbe?.missingMethod === "function",
      diagnostic: entry && {
        level: entry.level,
        extension: entry.context.extension,
        method: entry.context.method,
        sameElement: entry.context.element === target
      }
    };
  });
  expect(result).toEqual({
    controllerExists: true,
    hasMissingMethod: false,
    diagnostic: {
      level: 1, extension: "methodProbe", method: "missingMethod", sameElement: true
    }
  });
});

test("mountManager.add diagnoses invalid registrations without changing the mount map", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="mount-probe" data-mount-probe></div>';
    let mountCalls = 0;
    AelluxJs.ext("mount-probe");
    AelluxJs.extAttach("mount-probe", { init() {} });
    await AelluxJs.wait("mount-probe");
    const manager = AelluxJs.mountManager;
    const valid = {
      extensionName: "mount-probe", selector: "[data-mount-probe]",
      mount() { mountCalls++; }
    };
    const accepted = manager.add(valid) === manager;
    const invalid = [
      null,
      { ...valid, extensionName: 2 },
      { ...valid, extensionName: "constructor" },
      { ...valid, extensionName: "undeclared-mount" },
      { ...valid, selector: "[" },
      { ...valid, selector: 42 },
      { ...valid, mount: null },
      { ...valid, unmount: false },
      { ...valid, update: "update" },
      { ...valid, controllers: ["ok", 3] },
      { ...valid, controllers: "method" },
      { ...valid, initialAttributes: "data-state" },
      { ...valid, mout: () => {} }
    ];
    const rejected = invalid.map(options => manager.add(options));
    await manager.mount(document.getElementById("mount-probe"), "mount-probe");
    const entries = AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 1113);
    return {
      accepted,
      allRejected: rejected.every(value => value === false),
      arguments: entries.map(entry => entry.context.argument),
      mountCalls,
      selectorIndex: AelluxJs.registry.extMounters.mountProbe
    };
  });

  expect(result).toEqual({
    accepted: true,
    allRejected: true,
    arguments: ["options", "extensionName", "extensionName", "extensionName", "selector", "selector",
      "mount", "unmount", "update", "controllers", "controllers",
      "initialAttributes", "mout"],
    mountCalls: 1,
    selectorIndex: "[data-mount-probe]"
  });
});

test("mount maps cannot be replaced or removed while in use", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="target" data-map-guard></div>';
    const calls = [];
    AelluxJs.ext("map-guard");
    AelluxJs.extAttach("map-guard", { init() {} });
    await AelluxJs.wait("map-guard");
    const manager = AelluxJs.mountManager;
    const selector = "[data-map-guard]";
    manager.add({
      extensionName: "map-guard", selector,
      mount() { calls.push("mount-original"); },
      unmount() { calls.push("unmount-original"); }
    });
    const replacement = manager.add({
      extensionName: "map-guard", selector,
      mount() { calls.push("mount-replacement"); },
      unmount() { calls.push("unmount-replacement"); }
    });
    const target = document.getElementById("target");
    await manager.mount(target, "map-guard");
    const removeSelectorWhileMounted = manager.remove({ extensionName: "map-guard", selector });
    const removeExtensionWhileMounted = manager.remove({ extensionName: "map-guard" });
    await manager.unmount(target, "map-guard");
    const removeAfterUnmount = manager.remove({ extensionName: "map-guard", selector });
    const entries = AelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 1113 || entry.code === 1115);
    return {
      replacement,
      removeSelectorWhileMounted,
      removeExtensionWhileMounted,
      removeAfterUnmount,
      calls,
      entries: entries.map(entry => ({
        code: entry.code,
        extension: entry.context.extension,
        selector: entry.context.selector
      }))
    };
  });

  expect(result).toEqual({
    replacement: false,
    removeSelectorWhileMounted: false,
    removeExtensionWhileMounted: false,
    removeAfterUnmount: true,
    calls: ["mount-original", "unmount-original"],
    entries: [
      { code: 1113, extension: "map-guard", selector: "[data-map-guard]" },
      { code: 1115, extension: "map-guard", selector: "[data-map-guard]" },
      { code: 1115, extension: "map-guard", selector: undefined }
    ]
  });
});

test("mount helper restores selected attributes only on mounted elements", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);
  const result = await page.evaluate(async () => {
    document.body.innerHTML = `
      <div id="target" data-track data-secondary data-ae-state="initial" aria-label="initial label" hidden class="original ae--stale" style="color: red">
        <span id="child" data-ae-child-state="child-initial"></span>
      </div>
      <div id="failure" data-fail data-ae-state="failure-initial"></div>
    `;
    const target = document.getElementById("target");
    const child = document.getElementById("child");
    const failure = document.getElementById("failure");
    const duringUnmount = [];
    const initialSeen = [];
    const initialClassSeen = [];
    AelluxJs.ext("attribute-probe");
    AelluxJs.extAttach("attribute-probe", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "attribute-probe", selector: "[data-track]",
          mount(element) {
            initialSeen.push(AelluxJs.mountManager.initialAttribute(element, "data-ae-state"));
            initialClassSeen.push(element.classList.contains("ae--stale"));
            element.classList.add("ae--active");
            element.setAttribute("data-ae-state", "first");
            element.setAttribute("data-ae-added", "new");
            element.setAttribute("data-unrelated", "keep");
            element.setAttribute("aria-label", "changed label");
            element.removeAttribute("hidden");
            element.classList.add("changed");
            element.style.color = "blue";
            child.setAttribute("data-ae-child-state", "changed");
          },
          unmount() {
            duringUnmount.push(target.getAttribute("data-ae-state"));
            target.classList.remove("ae--active");
          }
        });
        AelluxJs.mountManager.add({
          extensionName: "attribute-probe", selector: "[data-secondary]",
          mount(element) {
            initialSeen.push(AelluxJs.mountManager.initialAttribute(element, "data-ae-state"));
            initialClassSeen.push(element.classList.contains("ae--active"));
            element.setAttribute("data-ae-state", "second");
          },
          unmount() { duringUnmount.push(target.getAttribute("data-ae-state")); }
        });
        AelluxJs.mountManager.add({
          extensionName: "attribute-probe", selector: "[data-fail]",
          mount(element) {
            element.setAttribute("data-ae-state", "failed");
            element.setAttribute("data-ae-added", "failed");
            throw new Error("mount failure");
          }
        });
      }
    });
    await AelluxJs.wait("attribute-probe");
    await AelluxJs.mount(target, "attribute-probe");
    const mounted = target.getAttribute("data-ae-state");
    await AelluxJs.unmount(target, "attribute-probe");
    await AelluxJs.mount(failure, "attribute-probe");
    return {
      mounted,
      initialSeen,
      initialClassSeen,
      duringUnmount,
      restored: target.getAttribute("data-ae-state"),
      addedRestored: target.hasAttribute("data-ae-added"),
      ariaRestored: target.getAttribute("aria-label"),
      hiddenRestored: target.hasAttribute("hidden"),
      unrelatedRetained: target.getAttribute("data-unrelated"),
      classRetained: target.classList.contains("changed"),
      staleClassRetained: target.classList.contains("ae--stale"),
      styleRetained: target.style.color,
      childRetained: child.getAttribute("data-ae-child-state"),
      failureRestored: failure.getAttribute("data-ae-state"),
      failureAddedRestored: failure.hasAttribute("data-ae-added"),
      failureMounted: !!AelluxJs.mountManager.controller(failure)
    };
  });
  expect(result).toEqual({
    mounted: "second",
    initialSeen: ["initial", "initial"],
    initialClassSeen: [false, true],
    duringUnmount: ["second", "second"],
    restored: "initial",
    addedRestored: false,
    ariaRestored: "initial label",
    hiddenRestored: true,
    unrelatedRetained: "keep",
    classRetained: true,
    staleClassRetained: false,
    styleRetained: "blue",
    childRetained: "changed",
    failureRestored: "failure-initial",
    failureAddedRestored: false,
    failureMounted: false
  });
});

test("mounted element controller runs mount, update, and unmount lifecycle methods", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="root" data-lifecycle-probe><div id="child" data-lifecycle-probe></div></div>';
    const counts = { mount: [], update: [], unmount: [] };
    AelluxJs.ext("lifecycle-probe");
    AelluxJs.extAttach("lifecycle-probe", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "lifecycle-probe", selector: "[data-lifecycle-probe]",
          mount: element => counts.mount.push(element.id),
          update: element => counts.update.push(element.id),
          unmount: element => counts.unmount.push(element.id)
        });
      }
    });
    await AelluxJs.wait("lifecycle-probe");
    const root = document.getElementById("root");
    await AelluxJs.mount(root, "lifecycle-probe");
    const controller = AelluxJs.mountManager.controller(root);
    const methods = ["mount", "update", "unmount"].map(name => typeof controller[name]);
    const extensionUpdate = typeof controller.lifecycleProbe.update;
    await controller.lifecycleProbe.update();
    await controller.update("lifecycle-probe");
    await controller.mount("lifecycle-probe");
    await controller.unmount("lifecycle-probe");
    const updateAfterUnmount = typeof controller.update;
    await controller.update("lifecycle-probe");
    const removed = !root.classList.contains(AelluxJs.className("mounted"));
    await controller.mount("lifecycle-probe");
    return {
      counts,
      removed,
      updateAfterUnmount,
      extensionUpdate,
      newController: AelluxJs.mountManager.controller(root) !== controller,
      methods
    };
  });
  expect(result).toEqual({
    counts: {
      mount: ["root", "child", "root", "child"],
      update: ["root", "child", "root", "child"],
      unmount: ["root", "child"]
    },
    removed: true,
    updateAfterUnmount: "function",
    extensionUpdate: "function",
    newController: true,
    methods: ["function", "function", "function"]
  });
});

test("update and unmount use mounted registrations after attributes are removed", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="scope"><div id="target" data-mounted-probe></div></div><div id="outside" data-mounted-probe></div>';
    const calls = { update: [], unmount: [] };
    AelluxJs.ext("mounted-probe");
    AelluxJs.extAttach("mounted-probe", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "mounted-probe",
          selector: "[data-mounted-probe]",
          mount() {},
          update: element => calls.update.push(element.id),
          unmount: element => calls.unmount.push(element.id)
        });
      }
    });
    await AelluxJs.wait("mounted-probe");
    await AelluxJs.mount(document, "mounted-probe");
    const target = document.getElementById("target");
    const outside = document.getElementById("outside");
    target.removeAttribute("data-mounted-probe");
    outside.removeAttribute("data-mounted-probe");
    await AelluxJs.mountManager.update(document.getElementById("scope"), "mounted-probe");
    await AelluxJs.unmount(document.getElementById("scope"), "mounted-probe");
    return {
      calls,
      targetMounted: target.classList.contains(AelluxJs.className("mounted")),
      outsideMounted: outside.classList.contains(AelluxJs.className("mounted"))
    };
  });
  expect(result).toEqual({
    calls: { update: ["target"], unmount: ["target"] },
    targetMounted: false,
    outsideMounted: true
  });
});

test("global unmount cleans detached elements without crossing scoped roots or Extensions", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    Object.defineProperty(window, "MutationObserver", { configurable: true, value: undefined });
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="scope"></div><div id="alpha" data-detached-alpha></div><div id="beta" data-detached-beta></div>';
    const calls = [];
    for (const name of ["detached-alpha", "detached-beta"]) {
      AelluxJs.ext(name);
      AelluxJs.extAttach(name, {
        init() {
          AelluxJs.mountManager.add({
            extensionName: name,
            selector: `[data-${name}]`,
            mount() {},
            async unmount(element) {
              await Promise.resolve();
              calls.push(element.id);
            },
            update(element) { calls.push(`update:${element.id}`); }
          });
        }
      });
    }
    await AelluxJs.mount(document);
    const alpha = document.getElementById("alpha");
    const beta = document.getElementById("beta");
    const alphaController = AelluxJs.mountManager.controller(alpha);
    const betaController = AelluxJs.mountManager.controller(beta);
    alpha.remove();
    beta.remove();

    const scope = document.getElementById("scope");
    await AelluxJs.mountManager.update(scope, "detached-alpha");
    await AelluxJs.unmount(scope, "detached-alpha");
    const afterScoped = {
      calls: [...calls],
      alphaMounted: alphaController.hasMounts(),
      betaMounted: betaController.hasMounts()
    };

    await AelluxJs.destroyExtensions("detached-alpha");
    const afterDestroy = {
      calls: [...calls],
      alphaMounted: alphaController.hasMounts(),
      betaMounted: betaController.hasMounts()
    };
    await AelluxJs.unmount(document);
    return {
      afterScoped,
      afterDestroy,
      finalCalls: calls,
      betaMounted: betaController.hasMounts()
    };
  });

  expect(result).toEqual({
    afterScoped: { calls: [], alphaMounted: true, betaMounted: true },
    afterDestroy: { calls: ["alpha"], alphaMounted: false, betaMounted: true },
    finalCalls: ["alpha", "beta"],
    betaMounted: false
  });
});

test("MutationObserver unmounts removed elements but preserves moved elements", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const afterMove = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="observed" data-observed-detach aria-expanded="original"></div>';
    window.observedCalls = [];
    AelluxJs.ext("observed-detach");
    AelluxJs.extAttach("observed-detach", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "observed-detach", selector: "[data-observed-detach]",
          mount(element) { element.setAttribute("aria-expanded", "true"); },
          async unmount(element) {
            await Promise.resolve();
            window.observedCalls.push(element.id);
          }
        });
      }
    });
    await AelluxJs.wait("observed-detach");
    await AelluxJs.mount(document, "observed-detach");
    window.observedElement = document.getElementById("observed");
    window.observedController = AelluxJs.mountManager.controller(window.observedElement);
    window.observedElement.remove();
    document.body.append(window.observedElement);
    await new Promise(resolve => setTimeout(resolve, 0));
    return {
      mounted: window.observedController.hasMounts(),
      calls: [...window.observedCalls]
    };
  });
  expect(afterMove).toEqual({ mounted: true, calls: [] });

  await page.evaluate(() => window.observedElement.remove());
  await expect.poll(() => page.evaluate(() => ({
    mounted: window.observedController.hasMounts(),
    calls: window.observedCalls,
    aria: window.observedElement.getAttribute("aria-expanded")
  }))).toEqual({ mounted: false, calls: ["observed"], aria: "original" });
});

test("observed cleanup and explicit unmount share each registration once", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="parent" data-nested-detach><div id="child" data-nested-detach></div></div>';
    const calls = [];
    AelluxJs.ext("nested-detach");
    AelluxJs.extAttach("nested-detach", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "nested-detach", selector: "[data-nested-detach]",
          mount() {},
          async unmount(element) {
            calls.push(element.id);
            if (element.id === "parent") {
              await AelluxJs.unmount(element.querySelector("#child"), "nested-detach");
            }
          }
        });
      }
    });
    await AelluxJs.wait("nested-detach");
    await AelluxJs.mount(document, "nested-detach");
    const parent = document.getElementById("parent");
    const child = document.getElementById("child");
    const parentController = AelluxJs.mountManager.controller(parent);
    const childController = AelluxJs.mountManager.controller(child);
    parent.remove();
    await AelluxJs.unmount(document, "nested-detach");
    await new Promise(resolve => setTimeout(resolve, 0));
    return {
      calls,
      parentMounted: parentController.hasMounts(),
      childMounted: childController.hasMounts()
    };
  });
  expect(result).toEqual({ calls: ["parent", "child"], parentMounted: false, childMounted: false });
});

test("core destroy survives lifecycle failures and clears resources", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    const NativeMutationObserver = window.MutationObserver;
    window.observerDisconnects = 0;
    window.MutationObserver = class extends NativeMutationObserver {
      disconnect() {
        window.observerDisconnects++;
        return super.disconnect();
      }
    };
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    AelluxJs.ext("destroy-failure");
    AelluxJs.extAttach("destroy-failure", {
      init() {},
      destroy() { throw new Error("destroy failed"); }
    });
    await AelluxJs.wait("destroy-failure");
    AelluxJs.ext("dormant-lazy", { loadWhen: "[data-dormant-lazy]" });

    for (const extensionName of ["destroy-failure", "dormant-lazy"]) {
      const script = document.createElement("script");
      script.setAttribute(AelluxJs.attr("ext"), extensionName);
      document.head.append(script);
      const style = document.createElement("link");
      style.setAttribute(AelluxJs.attr("ext-style"), extensionName);
      document.head.append(style);
    }

    let followingTaskRan = false;
    const failedTask = AelluxJs.waitLayout.read(() => {
      throw new Error("layout failed");
    });
    const followingTask = AelluxJs.waitLayout.update(() => {
      followingTaskRan = true;
    });
    const layoutFailure = await failedTask.catch(error => error.message);
    await followingTask;

    let clearedTaskRan = false;
    const clearedTask = AelluxJs.waitLayout.update(() => {
      clearedTaskRan = true;
    });
    await AelluxJs.destroy();
    await clearedTask;

    const assetSelector = [
      '[data-ae-ext="destroy-failure"]',
      '[data-ae-ext-style="destroy-failure"]',
      '[data-ae-ext="dormant-lazy"]',
      '[data-ae-ext-style="dormant-lazy"]'
    ].join(",");
    const diagnostic = AelluxJs.diagnostics.showHistory()
      .find(entry => entry.code === 1105 &&
        entry.context.extension === "destroy-failure");
    return {
      layoutFailure,
      followingTaskRan,
      clearedTaskRan,
      observerDisconnects: window.observerDisconnects,
      registry: Object.keys(AelluxJs.registry.ext),
      lazy: Object.keys(AelluxJs.registry.lazyExtSelectors),
      assets: document.querySelectorAll(assetSelector).length,
      diagnostic: diagnostic && diagnostic.context.cause.message
    };
  });

  expect(result).toEqual({
    layoutFailure: "layout failed",
    followingTaskRan: true,
    clearedTaskRan: false,
    observerDisconnects: 1,
    registry: [],
    lazy: [],
    assets: 0,
    diagnostic: "destroy failed"
  });
});

test("mount manager exposes initial attributes and idempotent observer destruction", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    const NativeMutationObserver = window.MutationObserver;
    window.observerDisconnects = 0;
    window.MutationObserver = class extends NativeMutationObserver {
      disconnect() {
        window.observerDisconnects++;
        return super.disconnect();
      }
    };
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="manager-destroy" data-manager-destroy aria-label="initial"></div>';
    const target = document.getElementById("manager-destroy");
    let unmountCalls = 0;
    AelluxJs.ext("manager-destroy");
    AelluxJs.extAttach("manager-destroy", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "manager-destroy",
          selector: "[data-manager-destroy]",
          mount(element) {
            element.setAttribute("aria-label", "mounted");
          },
          unmount() { unmountCalls++; }
        });
      }
    });
    await AelluxJs.wait("manager-destroy");
    await AelluxJs.mount(target, "manager-destroy");
    const initial = AelluxJs.mountManager.initialAttribute(target, "aria-label");
    const methods = {
      destroy: typeof AelluxJs.mountManager.destroy,
      initialAttribute: typeof AelluxJs.mountManager.initialAttribute
    };
    const destroyed = [
      AelluxJs.mountManager.destroy(),
      AelluxJs.mountManager.destroy()
    ];
    target.remove();
    await new Promise(resolve => setTimeout(resolve, 0));
    return {
      methods,
      initial,
      destroyed,
      observerDisconnects: window.observerDisconnects,
      unmountCalls
    };
  });

  expect(result).toEqual({
    methods: { destroy: "function", initialAttribute: "function" },
    initial: "initial",
    destroyed: [true, false],
    observerDisconnects: 1,
    unmountCalls: 0
  });
});

test("unavailable browser storage records the memory fallback", async ({ page }) => {
  await page.goto("/tests/index.htm");
  const result = await page.evaluate(async () => {
    const [{ buildPersistMemory }, { buildDiagnostics }, { createAelluxConstants }] =
      await Promise.all([
        import("/src/internal/build-persist-memory.js"),
        import("/src/internal/build-diagnostics.js"),
        import("/src/internal/create-aellux-constants.js")
      ]);
    const diagnostics = buildDiagnostics(createAelluxConstants().AELLUXJS_DIAGNOSTICS);
    const storageRoot = {
      URLSearchParams,
      get localStorage() { throw new Error("storage denied"); }
    };
    const memory = buildPersistMemory(storageRoot, "localStorage", "Probe", diagnostics);
    memory.set("item", "value");
    const entry = diagnostics.showHistory(1)[0];
    return {
      value: memory.get("item"),
      code: entry.code,
      level: entry.level,
      storage: entry.context.storage,
      identifier: entry.context.identifier,
      cause: entry.context.cause.message
    };
  });
  expect(result).toEqual({
    value: "value", code: 2006, level: 1,
    storage: "localStorage", identifier: "Probe", cause: "storage denied"
  });
});

test("navigation exposes ajaxReplace metadata on snapshot restoration", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(() => {
    const url = window.location.href;
    let restoredState;
    document.addEventListener("AelluxJsSnapshotRestore", event => {
      restoredState = event.detail.popState;
    }, { once: true });
    window.dispatchEvent(new PopStateEvent("popstate", {
      state: {
        aelluxJsState: true,
        snapshot: null,
        ajaxReplace: { url, selectors: ["#content"] }
      }
    }));
    return { restoredState, url };
  });
  expect(result.restoredState).toEqual({
    aelluxJsState: true,
    snapshot: null,
    ajaxReplace: { url: result.url, selectors: ["#content"] }
  });
});

test("navigation preserves existing history state when replacing the current entry", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => history.replaceState({ external: "before-init" }, ""));
  await page.evaluate(() => AelluxJs.init({ mode: "full", useHash: false }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(async () => {
    const afterInit = { ...history.state };
    history.replaceState(Object.assign({}, history.state, { another: 42 }), "");
    await AelluxJs.ext.stateNavigation.setState("tab", "silent", undefined, true);
    return { afterInit, afterSilentChange: history.state };
  });

  expect(result).toEqual({
    afterInit: {
      external: "before-init",
      aelluxJsState: true,
      snapshot: {}
    },
    afterSilentChange: {
      external: "before-init",
      another: 42,
      aelluxJsState: true,
      snapshot: { tab: "silent" }
    }
  });
});

test("navigation restores snapshots before dispatch with hash disabled", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full", useHash: false }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(async () => {
    const navigation = AelluxJs.ext.stateNavigation;
    const baseTitle = document.title;
    await navigation.setState("tab", "before", "Before");
    const events = [];
    document.addEventListener("AelluxJsSnapshotRestore", event => {
      events.push({
        snapshot: { ...event.detail.snapshot },
        removedTab: event.detail.removeSnapshot.tab || null,
        browserSnapshot: event.detail.popState.snapshot,
        title: document.title
      });
    });
    window.dispatchEvent(new PopStateEvent("popstate", {
      state: { aelluxJsState: true, snapshot: null }
    }));
    window.dispatchEvent(new PopStateEvent("popstate", {
      state: { aelluxJsState: true, snapshot: { tab: "after", title: "After" } }
    }));
    return { events, baseTitle, finalSnapshot: { ...navigation.globalSnapshot } };
  });
  expect(result.events).toEqual([
    { snapshot: {}, removedTab: "before", browserSnapshot: null, title: result.baseTitle },
    {
      snapshot: { tab: "after", title: "After" },
      removedTab: null,
      browserSnapshot: { tab: "after", title: "After" },
      title: `After - ${result.baseTitle}`
    }
  ]);
  expect(result.finalSnapshot).toEqual({ tab: "after", title: "After" });
});

test("navigation ajaxReplace records URL and selectors in the target history state", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full", useHash: false }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(async () => {
    const navigation = AelluxJs.ext.stateNavigation;
    await navigation.setState("tab", "before");
    AelluxJs.dispatch("PushAjaxReplace", {
      detail: { url: "/tests/ajax-next.htm", selectors: ["#content"] }
    });
    return {
      state: history.state,
      pathname: location.pathname,
      snapshot: { ...navigation.globalSnapshot }
    };
  });
  expect(result).toEqual({
    state: {
      aelluxJsState: true,
      snapshot: null,
      ajaxReplace: { url: "/tests/ajax-next.htm", selectors: ["#content"] }
    },
    pathname: "/tests/ajax-next.htm",
    snapshot: {}
  });
});

test("navigation warns for malformed command events without changing history or title", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full", useHash: false }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(() => {
    const title = document.title;
    const state = history.state;
    AelluxJs.dispatch("PushAjaxReplace");
    AelluxJs.dispatch("PushAjaxReplace", { detail: { selectors: ["#content"] } });
    AelluxJs.dispatch("UpdateBaseTitle");
    AelluxJs.dispatch("UpdateBaseTitle", { detail: { title: null } });
    const warnings = AelluxJs.diagnostics.showHistory()
      .filter(item => item.code === 2009)
      .map(item => item.context.event);
    return { warnings, titleUnchanged: document.title === title, stateUnchanged: history.state === state };
  });
  expect(result).toEqual({
    warnings: ["PushAjaxReplace", "PushAjaxReplace", "UpdateBaseTitle", "UpdateBaseTitle"],
    titleUnchanged: true,
    stateUnchanged: true
  });
});

test("feedback reports callback failures and continues notifying subscribers", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.feedback?.initialized)).toBe(true);

  const result = await page.evaluate(async () => {
    let calls = 0;
    AelluxJs.ext.feedback.on("warning", () => { throw new Error("sync subscriber failed"); });
    AelluxJs.ext.feedback.on("warning", async () => { throw new Error("async subscriber failed"); });
    AelluxJs.ext.feedback.on("warning", () => { calls++; });
    AelluxJs.ext.feedback.warning("probe");
    await Promise.resolve();
    const entries = AelluxJs.diagnostics.showHistory()
      .filter(item => item.code === 1108 && item.context.extension === "feedback");
    return {
      calls,
      entries: entries.map(entry => ({
        level: entry.level,
        type: entry.context.type,
        cause: entry.context.cause.message
      }))
    };
  });
  expect(result).toEqual({
    calls: 1,
    entries: [
      { level: 0, type: "warning", cause: "sync subscriber failed" },
      { level: 0, type: "warning", cause: "async subscriber failed" }
    ]
  });
});

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
      apiIsFunction: typeof AelluxJs === "function"
    };
  });
  expect(result).toEqual({
    coreRequestPreserved: true,
    extension: true,
    initialized: true,
    apiIsFunction: true
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

test("preference next and previous controls cycle built-in values", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div data-ae-preference="color-scheme">
        <button id="color-prev" data-ae-prev></button>
        <button id="color-next" data-ae-next></button>
      </div>
      <div data-ae-preference="text-scale">
        <button id="scale-prev" data-ae-prev></button>
        <button id="scale-next" data-ae-next></button>
      </div>
    `;
    AelluxJs.persist.preferences.set("textScale", "1.5");
    AelluxJs.init({ mode: "full" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.preference?.initialized)).toBe(true);

  const result = await page.evaluate(() => {
    const preference = AelluxJs.ext.preference;
    const values = {};
    document.getElementById("color-next").click();
    values.colorNext = preference.get("colorScheme");
    preference.set("colorScheme", "unknown");
    preference.update();
    document.getElementById("color-prev").click();
    values.unknownPrev = preference.get("colorScheme");
    document.getElementById("color-next").click();
    values.colorWrapped = preference.get("colorScheme");
    document.getElementById("scale-next").click();
    values.persistedNumericNext = preference.get("textScale");
    document.getElementById("scale-prev").click();
    values.persistedNumericPrev = preference.get("textScale");
    return values;
  });

  expect(result).toEqual({
    colorNext: "light",
    unknownPrev: "dark",
    colorWrapped: "auto",
    persistedNumericNext: 0.8,
    persistedNumericPrev: 1.5
  });
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
    await $ae.mount(element);
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
