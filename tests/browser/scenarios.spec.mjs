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

async function initialize(page, options = { mode: "basic" }) {
  await page.evaluate(initOptions => new Promise((resolve, reject) => {
    const eventName = aelluxJs.eventName("Ready");
    const ready = () => resolve();
    document.addEventListener(eventName, ready, { once: true });
    try {
      aelluxJs.init(initOptions);
    } catch (error) {
      document.removeEventListener(eventName, ready);
      reject(error);
    }
  }), options);
}

for (const scenario of scenarios) {
  test(`${scenario} completes`, async ({ page }) => {
    const externalRequests = [];
    if (scenario === "bootstrap-integration") {
      page.on("request", request => {
        if (new URL(request.url()).origin !== "http://127.0.0.1:4173") {
          externalRequests.push(request.url());
        }
      });
    }
    await openScenario(page, scenario);
    if (scenario === "bootstrap-integration") {
      expect(externalRequests).toEqual([]);
    }
  });
}

test("callable API returns null before the mount manager starts", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  expect(await page.evaluate(() => ({
    sameAlias: aelluxJs === $ae,
    callable: typeof aelluxJs === "function",
    result: $ae("missing")
  }))).toEqual({ sameAlias: true, callable: true, result: null });
});

test("boot does not mark the document when the browser reports low hardware", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 2
    });
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      value: 2
    });
  });
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect(page.locator("html")).not.toHaveAttribute("data-ae-low-hardware", "");
});

test("boot preserves an explicitly set low-hardware attribute", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.locator("html").evaluate(element => element.setAttribute("data-ae-low-hardware", ""));
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect(page.locator("html")).toHaveAttribute("data-ae-low-hardware", "");
});

test("boot adds a missing viewport meta tag by default", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.locator('meta[name="viewport"]').evaluate(element => element.remove());
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.setAttribute("data-ae-weak-style", "true");
    document.head.append(style);
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content", "width=device-width, initial-scale=1"
  );
});

test("autoViewportMeta false leaves a missing viewport meta tag absent", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.locator('meta[name="viewport"]').evaluate(element => element.remove());
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic", autoViewportMeta: false }));
  await expect(page.locator('meta[name="viewport"]')).toHaveCount(0);
});

for (const [label, extraOptions, expectedInitialMounts] of [
  ["default", {}, 1],
  ["Modern skipGlobalMount", { skipGlobalMount: true }, 0],
  ["Legacy skipGlobalMount", { skipGlobalMount: true, forceLegacy: true }, 0]
]) {
  test(`boot global mount: ${label}`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });

    const result = await page.evaluate(async options => {
      document.body.innerHTML = '<div id="skip-mount-target" data-skip-mount-probe></div>';
      let mountCalls = 0;
      aelluxJs.ext("skip-mount-probe");
      aelluxJs.extAttach("skip-mount-probe", {
        init() {
          aelluxJs.mountManager.add({
            extensionName: "skip-mount-probe",
            selector: "[data-skip-mount-probe]",
            mount() { mountCalls++; }
          });
        }
      });
      const ready = new Promise(resolve => aelluxJs.on("Ready", resolve, { once: true }));
      aelluxJs.init({ mode: "basic", ...options });
      await ready;
      const beforeManualMount = mountCalls;
      const readyBeforeManualMount = aelluxJs.diagnostics.legacy === Boolean(options.forceLegacy)
        && aelluxJs.options.skipGlobalMount === Boolean(options.skipGlobalMount);
      await aelluxJs.mount(document);
      return { beforeManualMount, afterManualMount: mountCalls, readyBeforeManualMount };
    }, extraOptions);

    expect(result).toEqual({
      beforeManualMount: expectedInitialMounts,
      afterManualMount: 1,
      readyBeforeManualMount: true
    });
  });
}

test("invalid element or ID inputs are recorded for mount and unmount", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    const mounted = await aelluxJs.mount({});
    const unmounted = await aelluxJs.unmount("missing-id");
    const entries = aelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2011);
    return {
      mounted, unmounted,
      entries: entries.map(entry => ({
        level: entry.level,
        elementOrId: entry.context.elementOrId,
        method: entry.context.method,
      }))
    };
  });
  expect(result).toEqual({
    mounted: [],
    unmounted: false,
    entries: [
      { level: 1, elementOrId: {}, method: "mount" },
      { level: 1, elementOrId: "missing-id", method: "unmount" }
    ]
  });
});

test("mount failure records a diagnostic and clears aria-busy", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    const target = document.createElement("div");
    target.setAttribute(aelluxJs.attr("wait-mounted"), "");
    document.body.append(target);
    aelluxJs.ext("failure-probe");
    const originalWait = aelluxJs.wait;
    aelluxJs.wait = () => Promise.reject(new Error("mount preparation failed"));
    try {
      const mounted = await aelluxJs.mount(target, "failure-probe");
      const entry = aelluxJs.diagnostics.showHistory().find(item => item.code === 1006);
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
      aelluxJs.wait = originalWait;
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

test("mount resolves plain and hashed IDs to one root", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = `
      <section id="result-root"><div id="first" data-result-mount></div>
        <div id="second" data-result-mount></div></section>
    `;
    aelluxJs.ext("result-probe");
    aelluxJs.extAttach("result-probe", { init() {} });
    await aelluxJs.wait("result-probe");
    const manager = aelluxJs.mountManager;
    for (const selector of ["[data-result-mount]", "div[data-result-mount]"]) {
      manager.add({ extensionName: "result-probe", selector, mount() {} });
    }

    const first = await aelluxJs.mount("result-root", "result-probe");
    const second = await aelluxJs.mount("#result-root", "result-probe");
    const missing = await aelluxJs.mount("missing-root", "result-probe");
    return { first: first.map(element => element.id), second, missing };
  });

  expect(result).toEqual({ first: ["first", "second"], second: [], missing: [] });
});

test("mount and unmount run in opposite priority order across extensions and selectors", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await initialize(page);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="priority-target" data-priority-probe></div>';
    const calls = { mount: [], unmount: [] };

    for (const name of ["priority-first", "priority-second"]) {
      aelluxJs.ext(name);
      aelluxJs.extAttach(name, { init() {} });
      await aelluxJs.wait(name);
    }

    const add = (extensionName, selector, priority, label) =>
      aelluxJs.mountManager.add({
        extensionName, selector, priority,
        mount() { calls.mount.push(label); },
        unmount() { calls.unmount.push(label); }
      });

    add("priority-first", "[data-priority-probe]", 10, "high");
    add("priority-first", "#priority-target", -10, "low");
    add("priority-first", "div[data-priority-probe]", 0, "zero-first");
    add("priority-second", "div#priority-target", 0, "zero-second");

    await aelluxJs.mount("priority-target");
    await aelluxJs.unmount("priority-target");
    return calls;
  });

  expect(result).toEqual({
    mount: ["low", "zero-first", "zero-second", "high"],
    unmount: ["high", "zero-second", "zero-first", "low"]
  });
});

test("equal-priority unmount reverses mount order across elements", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await initialize(page);

  const calls = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="first" data-order-probe></div><div id="second" data-order-probe></div>';
    const calls = { mount: [], unmount: [] };
    aelluxJs.ext("order-probe");
    aelluxJs.extAttach("order-probe", { init() {
      aelluxJs.mountManager.add({
        extensionName: "order-probe", selector: "[data-order-probe]",
        mount(element) { calls.mount.push(element.id); },
        unmount(element) { calls.unmount.push(element.id); }
      });
    } });
    await aelluxJs.wait("order-probe");
    await aelluxJs.mount(document, "order-probe");
    await aelluxJs.unmount(document, "order-probe");
    return calls;
  });

  expect(calls).toEqual({ mount: ["first", "second"], unmount: ["second", "first"] });
});

test("mount lifecycle events report the resolved root and distinct affected elements", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await initialize(page);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="lifecycle-detail" data-lifecycle-detail></div>';
    const target = document.getElementById("lifecycle-detail");
    const events = [];

    aelluxJs.ext("lifecycle-detail-probe");
    aelluxJs.extAttach("lifecycle-detail-probe", { init() {
      for (const selector of ["[data-lifecycle-detail]", "#lifecycle-detail"]) {
        aelluxJs.mountManager.add({
          extensionName: "lifecycle-detail-probe", selector,
          mount() {}, update() {}, unmount() {}
        });
      }
    } });
    await aelluxJs.wait("lifecycle-detail-probe");

    for (const name of ["Mount", "Update", "Unmount"]) {
      document.addEventListener(`AelluxJs${name}`, event => {
        const { root, extensions, elements } = event.detail;
        events.push({ name, root: root === target, extensions,
          elements: elements.map(element => element.id) });
      });
    }

    await aelluxJs.mountManager.mount(target, "lifecycle-detail-probe");
    await aelluxJs.mountManager.update(target, "lifecycle-detail-probe");
    await aelluxJs.mountManager.unmount(target, "lifecycle-detail-probe");
    await aelluxJs.mountManager.update(target, "lifecycle-detail-probe");
    return events;
  });

  expect(result).toEqual(["Mount", "Update", "Unmount", "Update"].map((name, index) => ({
    name, root: true, extensions: ["lifecycle-detail-probe"],
    elements: index === 3 ? [] : ["lifecycle-detail"]
  })));
});

test("mount unmounts elements detached by an async mount callback", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="detached-during-mount" data-detach-probe aria-expanded="initial"></div>';
    const target = document.getElementById("detached-during-mount");
    let unmountCalls = 0;
    aelluxJs.ext("detach-probe");
    aelluxJs.extAttach("detach-probe", {
      init() {
        const memories = new WeakMap();
        aelluxJs.mountManager.add({
          extensionName: "detach-probe",
          selector: "[data-detach-probe]",
          async mount(element) {
            memories.set(element, aelluxJs.persist.element.save(element, ["aria-expanded"], []));
            element.setAttribute("aria-expanded", "mounting");
            element.remove();
            await Promise.resolve();
            element.setAttribute("aria-expanded", "mounted");
          },
          unmount(element) {
            unmountCalls++;
            memories.get(element)?.restore();
            memories.delete(element);
          },
          controllers: []
        });
      }
    });
    await aelluxJs.wait("detach-probe");
    const mounted = await aelluxJs.mount(target, "detach-probe");
    return {
      mounted: mounted.map(element => element.id),
      unmountCalls,
      expanded: target.getAttribute("aria-expanded"),
      mountedClass: target.classList.contains(aelluxJs.className("mounted")),
      controller: aelluxJs.mountManager.controller(target)
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="concurrent" data-concurrent-probe></div>';
    const target = document.getElementById("concurrent");
    let mountCalls = 0;
    aelluxJs.ext("concurrent-probe");
    aelluxJs.extAttach("concurrent-probe", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "concurrent-probe",
          selector: "[data-concurrent-probe]",
          async mount() {
            mountCalls++;
            await new Promise(resolve => setTimeout(resolve, 20));
          }
        });
      }
    });
    await aelluxJs.wait("concurrent-probe");
    const [first, second] = await Promise.all([
      aelluxJs.mount(target, "concurrent-probe"),
      aelluxJs.mount(target, "concurrent-probe")
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = `
      <div id="partial-first" data-partial aria-label="first"></div>
      <div id="partial-failure" data-partial aria-label="failure"></div>
      <div id="partial-after" data-partial aria-label="after"></div>
    `;
    aelluxJs.ext("partial-probe");
    aelluxJs.extAttach("partial-probe", {
      init() {
        const memories = new WeakMap();
        aelluxJs.mountManager.add({
          extensionName: "partial-probe", selector: "[data-partial]",
          mount(element) {
            const memory = aelluxJs.persist.element.save(element, ["aria-label"], []);
            memories.set(element, memory);
            element.setAttribute("aria-label", `mounted-${element.id}`);
            if (element.id === "partial-failure") {
              memory.restore();
              memories.delete(element);
              throw new Error("partial failure");
            }
          },
          unmount(element) {
            memories.get(element)?.restore();
            memories.delete(element);
          }
        });
      }
    });
    await aelluxJs.wait("partial-probe");
    const mounted = await aelluxJs.mount(document, "partial-probe");
    const diagnostic = aelluxJs.diagnostics.showHistory()
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="failure-lifecycle" data-failure-lifecycle aria-expanded="initial"></div>';
    const calls = [];
    aelluxJs.ext("failure-lifecycle");
    aelluxJs.extAttach("failure-lifecycle", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "failure-lifecycle", selector: "[data-failure-lifecycle]",
          mount(element) { element.setAttribute("aria-expanded", "true"); },
          update() { throw new Error("update failed"); },
          unmount() { throw new Error("unmount failed"); }
        });
        aelluxJs.mountManager.add({
          extensionName: "failure-lifecycle", selector: "#failure-lifecycle",
          mount() { calls.push("second-mount"); },
          update() { calls.push("second-update"); },
          unmount() { calls.push("second-unmount"); }
        });
      }
    });
    await aelluxJs.wait("failure-lifecycle");
    const target = document.getElementById("failure-lifecycle");
    await aelluxJs.mount(target, "failure-lifecycle");
    const controller = aelluxJs.mountManager.controller(target);
    await aelluxJs.mountManager.update(target, "failure-lifecycle");
    await aelluxJs.unmount(target, "failure-lifecycle");
    const diagnostics = aelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 1103 &&
        entry.context.extension === "failure-lifecycle");
    return {
      calls,
      methods: diagnostics.map(entry => entry.context.method),
      causes: diagnostics.map(entry => entry.context.cause.message),
      expanded: target.getAttribute("aria-expanded"),
      mountedClass: target.classList.contains(aelluxJs.className("mounted")),
      controllerHasMounts: controller.hasMounts()
    };
  });

  expect(result).toEqual({
    calls: ["second-mount", "second-update", "second-unmount"],
    methods: ["update", "unmount"],
    causes: ["update failed", "unmount failed"],
    expanded: "true",
    mountedClass: false,
    controllerHasMounts: false
  });
});

test("wait awaits async Extension init and diagnoses rejection", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    aelluxJs.ext("async-success");
    let finishInit;
    aelluxJs.extAttach("async-success", {
      init() { return new Promise(resolve => { finishInit = resolve; }); }
    });
    const pending = aelluxJs.wait("async-success");
    await Promise.resolve();
    const initializedBeforeResolution = aelluxJs.ext.asyncSuccess.initialized;
    finishInit();
    const success = await pending;

    aelluxJs.ext("async-failure");
    aelluxJs.extAttach("async-failure", {
      async init() { throw new Error("init probe failed"); }
    });
    const failure = await aelluxJs.wait("async-failure");
    const diagnostic = aelluxJs.diagnostics.showHistory()
      .find(entry => entry.code === 1102 && entry.context.extension === "async-failure");
    return {
      initializedBeforeResolution,
      initializedAfterResolution: success.initialized,
      failure,
      failureInitialized: aelluxJs.ext.asyncFailure.initialized,
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    let initCalls = 0;
    aelluxJs.ext("retry-initialize", { loadWhen: "[data-retry-initialize]" });
    aelluxJs.extAttach("retry-initialize", {
      async init() {
        initCalls++;
        await Promise.resolve();
        if (initCalls === 1) throw new Error("first initialization failed");
      }
    });

    const firstPromise = aelluxJs.wait("retry-initialize");
    const concurrentPromise = aelluxJs.wait("retry-initialize");
    const firstResults = await Promise.all([firstPromise, concurrentPromise]);
    const indexedAfterFailure = Object.hasOwn(
      aelluxJs.registry.lazyExtSelectors, "retryInitialize"
    );
    const retried = await aelluxJs.wait("retry-initialize");
    const indexedAfterSuccess = Object.hasOwn(
      aelluxJs.registry.lazyExtSelectors, "retryInitialize"
    );
    const diagnostics = aelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 1102 &&
        entry.context.extension === "retry-initialize");

    return {
      sharedPromise: firstPromise === concurrentPromise,
      firstResults,
      indexedAfterFailure,
      retried: retried === aelluxJs.ext.retryInitialize,
      initialized: aelluxJs.ext.retryInitialize.initialized,
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

test("mount waits for all matching lazy Extensions before searching their targets", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = `
      <div id="outer" data-first-activation>
        <div data-first-activation data-second-activation>
          <div id="target" data-first-target data-second-target></div>
        </div>
      </div>`;
    const calls = [];
    let secondStarted;
    let releaseSecond;
    const secondReady = new Promise(resolve => { secondStarted = resolve; });
    const secondGate = new Promise(resolve => { releaseSecond = resolve; });

    aelluxJs.ext("first-phase", { loadWhen: "[data-first-activation]" });
    aelluxJs.extAttach("first-phase", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "first-phase", selector: "[data-first-target]",
          mount() { calls.push(aelluxJs.ext.secondPhase.initialized ? "first-ready" : "first-early"); }
        });
      }
    });
    aelluxJs.ext("second-phase", { loadWhen: "[data-second-activation]" });
    aelluxJs.extAttach("second-phase", {
      async init() {
        secondStarted();
        await secondGate;
        aelluxJs.mountManager.add({
          extensionName: "second-phase", selector: "[data-second-target]",
          mount() { calls.push("second-ready"); }
        });
      }
    });

    const mounting = aelluxJs.mount(document.getElementById("outer"));
    await secondReady;
    const beforeRelease = calls.slice();
    releaseSecond();
    const mounted = await mounting;
    return {
      beforeRelease,
      calls,
      mounted: mounted.map(element => element.id)
    };
  });
  expect(result).toEqual({
    beforeRelease: [],
    calls: ["first-ready", "second-ready"],
    mounted: ["target"]
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
      body: `aelluxJs.extAttach("retry-load", {
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    aelluxJs.ext("/virtual/aellux.ext.retry-load.js", {
      loadWhen: "[data-retry-load]",
      loadStyle: true
    });
    const firstPromise = aelluxJs.wait("retry-load");
    const concurrentPromise = aelluxJs.wait("retry-load");
    const failed = await Promise.all([firstPromise, concurrentPromise]);
    const indexedAfterFailure = Object.hasOwn(
      aelluxJs.registry.lazyExtSelectors, "retryLoad"
    );
    const retried = await aelluxJs.wait("retry-load");
    const retrySucceeded = retried === aelluxJs.ext.retryLoad;
    const assetSelector = `[data-ae-ext="retry-load"], [data-ae-ext-style="retry-load"]`;
    const assetsBeforeDestroy = document.querySelectorAll(assetSelector).length;
    await aelluxJs.destroyExtensions("retry-load");
    return {
      sharedPromise: firstPromise === concurrentPromise,
      failed,
      indexedAfterFailure,
      retried: retrySucceeded,
      initCalls: window.retryLoadInitCalls,
      assetsBeforeDestroy,
      assetsAfterDestroy: document.querySelectorAll(assetSelector).length,
      registeredAfterDestroy: Object.hasOwn(aelluxJs.registry.ext, "retryLoad")
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    aelluxJs.ext("/dist/aellux.ext.feedback.js", {
      loadStyle: "/tests/browser/missing-extension-style.css"
    });
    const extension = await aelluxJs.wait("feedback");
    const diagnostic = aelluxJs.diagnostics.showHistory()
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    const rejection = await aelluxJs.wait("never-registered-probe").catch(error => error);
    const entry = aelluxJs.diagnostics.showHistory()
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
    const aelluxJs = createAelluxApi(window, createAelluxConstants());
    const api = { init() {} };
    aelluxJs.extAttach(null, api);
    aelluxJs.extAttach("bad name", api);
    aelluxJs.extAttach("constructor", api);
    aelluxJs.ext("bad-api");
    aelluxJs.extAttach("bad-api", null);
    aelluxJs.extAttach("bad-api", { init: true });
    aelluxJs.extAttach("bad-api", { init() {}, destroy: false });
    aelluxJs.ext("bad-selector", { loadWhen: "[" });
    aelluxJs.extAttach("bad-selector", api);
    aelluxJs.ext("bad-selector-type", { loadWhen: 123 });
    aelluxJs.extAttach("bad-selector-type", api);
    aelluxJs.ext("bad-selector-empty", { loadWhen: " " });
    aelluxJs.ext("bad-selector-false", { loadWhen: false });
    aelluxJs.ext("retry-probe", { loadWhen: "[" });
    aelluxJs.ext("retry-probe", { loadWhen: "[data-retry]" });
    aelluxJs.extAttach("retry-probe", { init() {} });
    aelluxJs.extAttach("undeclared-probe", api);
    aelluxJs.ext("valid-probe");
    aelluxJs.extAttach("valid-probe", api);
    aelluxJs.extAttach("valid-probe", { init() {} });
    aelluxJs.ext("valid-lazy", { loadWhen: "[data-valid]" });
    aelluxJs.extAttach("valid-lazy", { init() {}, metadata: { ok: true } });

    const entries = aelluxJs.diagnostics.showHistory().filter(entry => entry.code === 1112);
    const registrationEntries = aelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 1110 || entry.code === 1101);
    const loadWhenEntries = aelluxJs.diagnostics.showHistory()
      .filter(entry => entry.code === 1114);
    return {
      arguments: entries.map(entry => entry.context.argument),
      registrationCodes: registrationEntries.map(entry => entry.code),
      unregisteredAttachMethod: registrationEntries
        .find(entry => entry.code === 1110 && entry.context.extension === "undeclared-probe")
        .context.method,
      invalidSelectors: loadWhenEntries.map(entry => entry.context.selector),
      malformedSelectorHasCause: loadWhenEntries[0].context.cause instanceof Error,
      undeclaredRegistered: Object.hasOwn(aelluxJs.registry.ext, "undeclaredProbe"),
      undeclaredAttached: Object.hasOwn(aelluxJs.ext, "undeclaredProbe"),
      invalidNameRegistered: Object.hasOwn(aelluxJs.registry.ext, "bad name"),
      badApiState: aelluxJs.registry.ext.badApi.state,
      badApiAttached: Object.hasOwn(aelluxJs.ext, "badApi"),
      badSelectorRegistered: Object.hasOwn(aelluxJs.registry.ext, "badSelector"),
      badSelectorAttached: Object.hasOwn(aelluxJs.ext, "badSelector"),
      badSelectorTypeRegistered: Object.hasOwn(aelluxJs.registry.ext, "badSelectorType"),
      badSelectorTypeAttached: Object.hasOwn(aelluxJs.ext, "badSelectorType"),
      badSelectorEmptyRegistered: Object.hasOwn(aelluxJs.registry.ext, "badSelectorEmpty"),
      badSelectorFalseRegistered: Object.hasOwn(aelluxJs.registry.ext, "badSelectorFalse"),
      badSelectorIndexed: Object.hasOwn(aelluxJs.registry.lazyExtSelectors, "badSelector"),
      retryAttached: !!aelluxJs.ext.retryProbe,
      validAttached: aelluxJs.ext.validProbe === api,
      validLazyAttached: aelluxJs.ext.validLazy.metadata.ok
    };
  });

  expect(result).toEqual({
    // Repeated invalid API shapes share one diagnostic identity.
    arguments: ["name", "name", "name", "api"],
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="method-target" data-method-probe></div>';
    aelluxJs.ext("method-probe");
    aelluxJs.extAttach("method-probe", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "method-probe", selector: "[data-method-probe]",
          mount: () => {}, unmount: () => {}, controllers: ["missingMethod"]
        });
      }
    });
    await aelluxJs.wait("method-probe");
    const target = document.getElementById("method-target");
    await aelluxJs.mount(target, "method-probe");
    const controller = aelluxJs.mountManager.controller(target);
    const entry = aelluxJs.diagnostics.showHistory()
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="mount-probe" data-mount-probe></div>';
    let mountCalls = 0;
    aelluxJs.ext("mount-probe");
    aelluxJs.extAttach("mount-probe", { init() {} });
    await aelluxJs.wait("mount-probe");
    const manager = aelluxJs.mountManager;
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
    const entries = aelluxJs.diagnostics.showHistory().filter(entry => entry.code === 1113);
    return {
      accepted,
      allRejected: rejected.every(value => value === false),
      arguments: entries.map(entry => entry.context.argument),
      mountCalls,
      selectorIndex: aelluxJs.registry.extMounters.mountProbe
    };
  });

  expect(result).toEqual({
    accepted: true,
    allRejected: true,
    arguments: ["options", "extensionName", "extensionName", "extensionName", "selector", "selector",
      "mount", "unmount", "update", "controllers",
      "initialAttributes", "mout"],
    mountCalls: 1,
    selectorIndex: "[data-mount-probe]"
  });
});

test("mount maps cannot be replaced or removed while in use", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="target" data-map-guard></div>';
    const calls = [];
    aelluxJs.ext("map-guard");
    aelluxJs.extAttach("map-guard", { init() {} });
    await aelluxJs.wait("map-guard");
    const manager = aelluxJs.mountManager;
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
    const entries = aelluxJs.diagnostics.showHistory()
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

test("mount helper leaves attribute restoration to extensions", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);
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
    const initialClassSeen = [];
    aelluxJs.ext("attribute-probe");
    aelluxJs.extAttach("attribute-probe", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "attribute-probe", selector: "[data-track]",
          mount(element) {
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
        aelluxJs.mountManager.add({
          extensionName: "attribute-probe", selector: "[data-secondary]",
          mount(element) {
            initialClassSeen.push(element.classList.contains("ae--active"));
            element.setAttribute("data-ae-state", "second");
          },
          unmount() { duringUnmount.push(target.getAttribute("data-ae-state")); }
        });
        aelluxJs.mountManager.add({
          extensionName: "attribute-probe", selector: "[data-fail]",
          mount(element) {
            element.setAttribute("data-ae-state", "failed");
            element.setAttribute("data-ae-added", "failed");
            throw new Error("mount failure");
          }
        });
      }
    });
    await aelluxJs.wait("attribute-probe");
    await aelluxJs.mount(target, "attribute-probe");
    const mounted = target.getAttribute("data-ae-state");
    await aelluxJs.unmount(target, "attribute-probe");
    await aelluxJs.mount(failure, "attribute-probe");
    return {
      mounted,
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
      failureMounted: !!aelluxJs.mountManager.controller(failure)
    };
  });
  expect(result).toEqual({
    mounted: "second",
    initialClassSeen: [false, true],
    duringUnmount: ["second", "second"],
    restored: "second",
    addedRestored: true,
    ariaRestored: "changed label",
    hiddenRestored: false,
    unrelatedRetained: "keep",
    classRetained: true,
    staleClassRetained: false,
    styleRetained: "blue",
    childRetained: "changed",
    failureRestored: "failed",
    failureAddedRestored: true,
    failureMounted: false
  });
});

test("extension memories restore owned attributes after partial unmount and failed mount", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);
  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="shared" data-first data-second data-failing data-ae-state="initial"></div>';
    const element = document.getElementById("shared");
    const savedValues = [];
    for (const [name, selector, value] of [
      ["first-probe", "[data-first]", "first"],
      ["second-probe", "[data-second]", "second"],
      ["failing-probe", "[data-failing]", "failed"]
    ]) {
      aelluxJs.ext(name);
      aelluxJs.extAttach(name, {
        init() {
          const memories = new WeakMap();
          aelluxJs.mountManager.add({
            extensionName: name, selector,
            mount(target) {
              const memory = aelluxJs.persist.element.save(target, ["data-ae-state"], []);
              memories.set(target, memory);
              savedValues.push(memory.attributes["data-ae-state"].value);
              target.setAttribute("data-ae-state", value);
              if (name === "failing-probe") {
                memory.restore();
                memories.delete(target);
                throw new Error("expected failure");
              }
            },
            unmount(target) {
              memories.get(target)?.restore();
              memories.delete(target);
            }
          });
        }
      });
      await aelluxJs.wait(name);
      await aelluxJs.mount(element, name);
    }
    const afterFailure = element.getAttribute("data-ae-state");
    await aelluxJs.unmount(element, "second-probe");
    const afterSecondUnmount = element.getAttribute("data-ae-state");
    await aelluxJs.unmount(element, "first-probe");
    return {
      savedValues,
      afterFailure,
      afterSecondUnmount,
      restored: element.getAttribute("data-ae-state")
    };
  });
  expect(result).toEqual({
    savedValues: ["initial", "first", "second"],
    afterFailure: "second",
    afterSecondUnmount: "first",
    restored: "initial"
  });
});

test("mounted element controller runs mount, update, and unmount lifecycle methods", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="root" data-lifecycle-probe><div id="child" data-lifecycle-probe></div></div>';
    const counts = { mount: [], update: [], unmount: [] };
    aelluxJs.ext("lifecycle-probe");
    aelluxJs.extAttach("lifecycle-probe", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "lifecycle-probe", selector: "[data-lifecycle-probe]",
          mount: element => counts.mount.push(element.id),
          update: element => counts.update.push(element.id),
          unmount: element => counts.unmount.push(element.id)
        });
      }
    });
    await aelluxJs.wait("lifecycle-probe");
    const root = document.getElementById("root");
    await aelluxJs.mount(root, "lifecycle-probe");
    const controller = aelluxJs.mountManager.controller(root);
    const methods = ["mount", "update", "unmount"].map(name => typeof controller[name]);
    const extensionUpdate = typeof controller.lifecycleProbe.update;
    await controller.lifecycleProbe.update();
    await controller.update("lifecycle-probe");
    await controller.mount("lifecycle-probe");
    await controller.unmount("lifecycle-probe");
    const updateAfterUnmount = typeof controller.update;
    await controller.update("lifecycle-probe");
    const removed = !root.classList.contains(aelluxJs.className("mounted"));
    await controller.mount("lifecycle-probe");
    return {
      counts,
      removed,
      updateAfterUnmount,
      extensionUpdate,
      newController: aelluxJs.mountManager.controller(root) !== controller,
      methods
    };
  });
  expect(result).toEqual({
    counts: {
      mount: ["root", "child", "root", "child"],
      update: ["root", "child", "root", "child"],
      unmount: ["child", "root"]
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="scope"><div id="target" data-mounted-probe></div></div><div id="outside" data-mounted-probe></div>';
    const calls = { update: [], unmount: [] };
    aelluxJs.ext("mounted-probe");
    aelluxJs.extAttach("mounted-probe", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "mounted-probe",
          selector: "[data-mounted-probe]",
          mount() {},
          update: element => calls.update.push(element.id),
          unmount: element => calls.unmount.push(element.id)
        });
      }
    });
    await aelluxJs.wait("mounted-probe");
    await aelluxJs.mount(document, "mounted-probe");
    const target = document.getElementById("target");
    const outside = document.getElementById("outside");
    target.removeAttribute("data-mounted-probe");
    outside.removeAttribute("data-mounted-probe");
    await aelluxJs.mountManager.update("scope", "mounted-probe");
    await aelluxJs.unmount("#scope", "mounted-probe");
    return {
      calls,
      targetMounted: target.classList.contains(aelluxJs.className("mounted")),
      outsideMounted: outside.classList.contains(aelluxJs.className("mounted"))
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="scope"></div><div id="alpha" data-detached-alpha></div><div id="beta" data-detached-beta></div>';
    const calls = [];
    for (const name of ["detached-alpha", "detached-beta"]) {
      aelluxJs.ext(name);
      aelluxJs.extAttach(name, {
        init() {
          aelluxJs.mountManager.add({
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
    await aelluxJs.mount(document);
    const alpha = document.getElementById("alpha");
    const beta = document.getElementById("beta");
    const alphaController = aelluxJs.mountManager.controller(alpha);
    const betaController = aelluxJs.mountManager.controller(beta);
    alpha.remove();
    beta.remove();

    const scope = document.getElementById("scope");
    await aelluxJs.mountManager.update(scope, "detached-alpha");
    await aelluxJs.unmount(scope, "detached-alpha");
    const afterScoped = {
      calls: [...calls],
      alphaMounted: alphaController.hasMounts(),
      betaMounted: betaController.hasMounts()
    };

    await aelluxJs.destroyExtensions("detached-alpha");
    const afterDestroy = {
      calls: [...calls],
      alphaMounted: alphaController.hasMounts(),
      betaMounted: betaController.hasMounts()
    };
    await aelluxJs.unmount(document);
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const afterMove = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="observed" data-observed-detach aria-expanded="original"></div>';
    window.observedCalls = [];
    aelluxJs.ext("observed-detach");
    aelluxJs.extAttach("observed-detach", {
      init() {
        const memories = new WeakMap();
        aelluxJs.mountManager.add({
          extensionName: "observed-detach", selector: "[data-observed-detach]",
          mount(element) {
            memories.set(element, aelluxJs.persist.element.save(element, ["aria-expanded"], []));
            element.setAttribute("aria-expanded", "true");
          },
          async unmount(element) {
            await Promise.resolve();
            window.observedCalls.push(element.id);
            memories.get(element)?.restore();
            memories.delete(element);
          }
        });
      }
    });
    await aelluxJs.wait("observed-detach");
    await aelluxJs.mount(document, "observed-detach");
    window.observedElement = document.getElementById("observed");
    window.observedController = aelluxJs.mountManager.controller(window.observedElement);
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

test("mounted controller listens and dispatches events on its element", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="first" data-event-probe></div><div id="second" data-event-probe></div>';
    aelluxJs.ext("event-probe");
    aelluxJs.extAttach("event-probe", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "event-probe", selector: "[data-event-probe]",
          mount() {}, unmount() {}
        });
      }
    });
    await aelluxJs.wait("event-probe");
    await aelluxJs.mount(document);
    const first = document.getElementById("first");
    const second = document.getElementById("second");
    const controller = $ae("first");
    const received = [];
    const handler = event => received.push({
      target: event.target.id, type: event.type,
      bubbles: event.bubbles, cancelable: event.cancelable
    });
    controller.on("Example", handler);
    second.dispatchEvent(new Event("AelluxJsExample", { bubbles: true }));
    const dispatched = controller.dispatch("Example", { bubbles: false, cancelable: true });
    controller.off("Example", handler);
    controller.dispatch("Example");
    return {
      sameController: controller === aelluxJs(first),
      received, dispatched,
      dispatchTarget: first.id
    };
  });
  expect(result).toEqual({
    sameController: true,
    received: [{ target: "first", type: "AelluxJsExample", bubbles: false, cancelable: true }],
    dispatched: true,
    dispatchTarget: "first"
  });
});

test("MutationObserver cleans elements removed during an earlier async cleanup", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  await page.evaluate(async () => {
    document.body.innerHTML = '<div id="first" data-observed-queue></div>';
    window.observedQueueCalls = [];
    aelluxJs.ext("observed-queue");
    aelluxJs.extAttach("observed-queue", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "observed-queue", selector: "[data-observed-queue]",
          mount() {},
          async unmount(element) {
            if (element.id === "first") {
              await new Promise(resolve => { window.releaseFirstUnmount = resolve; });
            }
            window.observedQueueCalls.push(element.id);
          }
        });
      }
    });
    await aelluxJs.wait("observed-queue");
    await aelluxJs.mount(document.getElementById("first"), "observed-queue");
    document.getElementById("first").remove();
  });
  await expect.poll(() => page.evaluate(() =>
    typeof window.releaseFirstUnmount
  )).toBe("function");

  await page.evaluate(async () => {
    const second = document.createElement("div");
    second.id = "second";
    second.setAttribute("data-observed-queue", "");
    document.body.append(second);
    await aelluxJs.mount(second, "observed-queue");
    second.remove();
    await Promise.resolve();
    window.releaseFirstUnmount();
  });
  await expect.poll(() => page.evaluate(() => window.observedQueueCalls))
    .toEqual(["first", "second"]);
});

test("observed cleanup and explicit unmount share each registration once", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="parent" data-nested-detach><div id="child" data-nested-detach></div></div>';
    const calls = [];
    aelluxJs.ext("nested-detach");
    aelluxJs.extAttach("nested-detach", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "nested-detach", selector: "[data-nested-detach]",
          mount() {},
          async unmount(element) {
            calls.push(element.id);
            if (element.id === "parent") {
              await aelluxJs.unmount(element.querySelector("#child"), "nested-detach");
            }
          }
        });
      }
    });
    await aelluxJs.wait("nested-detach");
    await aelluxJs.mount(document, "nested-detach");
    const parent = document.getElementById("parent");
    const child = document.getElementById("child");
    const parentController = aelluxJs.mountManager.controller(parent);
    const childController = aelluxJs.mountManager.controller(child);
    parent.remove();
    await aelluxJs.unmount(document, "nested-detach");
    await new Promise(resolve => setTimeout(resolve, 0));
    return {
      calls,
      parentMounted: parentController.hasMounts(),
      childMounted: childController.hasMounts()
    };
  });
  expect(result).toEqual({ calls: ["child", "parent"], parentMounted: false, childMounted: false });
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    aelluxJs.ext("destroy-failure");
    aelluxJs.extAttach("destroy-failure", {
      init() {},
      destroy() { throw new Error("destroy failed"); }
    });
    await aelluxJs.wait("destroy-failure");
    aelluxJs.ext("dormant-lazy", { loadWhen: "[data-dormant-lazy]" });

    for (const extensionName of ["destroy-failure", "dormant-lazy"]) {
      const script = document.createElement("script");
      script.setAttribute(aelluxJs.attr("ext"), extensionName);
      document.head.append(script);
      const style = document.createElement("link");
      style.setAttribute(aelluxJs.attr("ext-style"), extensionName);
      document.head.append(style);
    }

    let followingTaskRan = false;
    const failedTask = aelluxJs.waitLayout.read((message) => {
      throw new Error(message);
    }, ["layout failed"]);
    const followingTask = aelluxJs.waitLayout.update((value) => {
      followingTaskRan = value;
    }, [true]);
    const layoutFailure = await failedTask.catch(error => error.message);
    await followingTask;

    let clearedTaskRan = false;
    const clearedTask = aelluxJs.waitLayout.update(() => {
      clearedTaskRan = true;
    });
    await aelluxJs.destroy();
    await clearedTask;

    const assetSelector = [
      '[data-ae-ext="destroy-failure"]',
      '[data-ae-ext-style="destroy-failure"]',
      '[data-ae-ext="dormant-lazy"]',
      '[data-ae-ext-style="dormant-lazy"]'
    ].join(",");
    const diagnostic = aelluxJs.diagnostics.showHistory()
      .find(entry => entry.code === 1105 &&
        entry.context.extension === "destroy-failure");
    return {
      layoutFailure,
      followingTaskRan,
      clearedTaskRan,
      observerDisconnects: window.observerDisconnects,
      registry: Object.keys(aelluxJs.registry.ext),
      lazy: Object.keys(aelluxJs.registry.lazyExtSelectors),
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

test("mount manager has idempotent observer destruction", async ({ page }) => {
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
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<div id="manager-destroy" data-manager-destroy aria-label="initial"></div>';
    const target = document.getElementById("manager-destroy");
    let unmountCalls = 0;
    aelluxJs.ext("manager-destroy");
    aelluxJs.extAttach("manager-destroy", {
      init() {
        aelluxJs.mountManager.add({
          extensionName: "manager-destroy",
          selector: "[data-manager-destroy]",
          mount(element) {
            element.setAttribute("aria-label", "mounted");
          },
          unmount() { unmountCalls++; }
        });
      }
    });
    await aelluxJs.wait("manager-destroy");
    await aelluxJs.mount(target, "manager-destroy");
    const methods = {
      destroy: typeof aelluxJs.mountManager.destroy,
      initialAttribute: typeof aelluxJs.mountManager.initialAttribute
    };
    const destroyed = [
      aelluxJs.mountManager.destroy(),
      aelluxJs.mountManager.destroy()
    ];
    target.remove();
    await new Promise(resolve => setTimeout(resolve, 0));
    return {
      methods,
      destroyed,
      observerDisconnects: window.observerDisconnects,
      unmountCalls
    };
  });

  expect(result).toEqual({
    methods: { destroy: "function", initialAttribute: "undefined" },
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
  await page.evaluate(() => aelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.stateNavigation?.initialized)).toBe(true);

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

test("navigation event details retain snapshots after later changes", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full", useHash: false }));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(async () => {
    let firstChange, restoration;
    document.addEventListener("AelluxJsSnapshotChange", event => {
      if (!firstChange) firstChange = event.detail;
    });

    await aelluxJs.ext.stateNavigation.setState("section", "one");
    await aelluxJs.ext.stateNavigation.setState("section", "two");

    const state = {
      aelluxJsState: true,
      snapshot: { section: "three" },
      ajaxReplace: { url: "/next", selectors: ["#content"] }
    };
    document.addEventListener("AelluxJsSnapshotRestore", event => {
      restoration = event.detail;
    }, { once: true });
    window.dispatchEvent(new PopStateEvent("popstate", { state }));
    state.snapshot.section = "changed";
    state.ajaxReplace.selectors.push("#other");

    return {
      firstSnapshot: firstChange.snapshot,
      firstRemoved: firstChange.removeSnapshot,
      restoredSnapshot: restoration.snapshot,
      popState: restoration.popState,
      copied: restoration.popState !== state
    };
  });

  expect(result).toEqual({
    firstSnapshot: { section: "one" },
    firstRemoved: {},
    restoredSnapshot: { section: "three" },
    popState: {
      aelluxJsState: true,
      snapshot: { section: "three" },
      ajaxReplace: { url: "/next", selectors: ["#content"] }
    },
    copied: true
  });
});

test("navigation preserves existing history state when replacing the current entry", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => history.replaceState({ external: "before-init" }, ""));
  await page.evaluate(() => aelluxJs.init({ mode: "full", useHash: false }));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(async () => {
    const afterInit = { ...history.state };
    history.replaceState(Object.assign({}, history.state, { another: 42 }), "");
    await aelluxJs.ext.stateNavigation.setState("tab", "silent", undefined, true);
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
  await page.evaluate(() => aelluxJs.init({ mode: "full", useHash: false }));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(async () => {
    const navigation = aelluxJs.ext.stateNavigation;
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
  await page.evaluate(() => aelluxJs.init({ mode: "full", useHash: false }));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(async () => {
    const navigation = aelluxJs.ext.stateNavigation;
    await navigation.setState("tab", "before");
    aelluxJs.dispatch("PushAjaxReplace", {
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
  await page.evaluate(() => aelluxJs.init({ mode: "full", useHash: false }));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.stateNavigation?.initialized)).toBe(true);

  const result = await page.evaluate(() => {
    const title = document.title;
    const state = history.state;
    aelluxJs.dispatch("PushState");
    aelluxJs.dispatch("PushState", { detail: { key: "", value: "value" } });
    aelluxJs.dispatch("PushState", { detail: { key: "tab", value: null } });
    aelluxJs.dispatch("PushAjaxReplace");
    aelluxJs.dispatch("PushAjaxReplace", { detail: { selectors: ["#content"] } });
    aelluxJs.dispatch("UpdateBaseTitle");
    aelluxJs.dispatch("UpdateBaseTitle", { detail: { title: null } });
    const warnings = aelluxJs.diagnostics.showHistory()
      .filter(item => item.code === 2009)
      .map(item => item.context.event);
    return { warnings, titleUnchanged: document.title === title, stateUnchanged: history.state === state };
  });
  expect(result).toEqual({
    warnings: ["PushState", "PushAjaxReplace", "UpdateBaseTitle"],
    titleUnchanged: true,
    stateUnchanged: true
  });
});

test("feedback reports callback failures and continues notifying subscribers", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  await page.evaluate(() => aelluxJs.wait("feedback"));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.feedback?.initialized)).toBe(true);

  const result = await page.evaluate(async () => {
    let calls = 0;
    aelluxJs.ext.feedback.on("warning", () => { throw new Error("sync subscriber failed"); });
    aelluxJs.ext.feedback.on("warning", async () => { throw new Error("async subscriber failed"); });
    aelluxJs.ext.feedback.on("warning", () => { calls++; });
    aelluxJs.ext.feedback.warning("probe");
    await Promise.resolve();
    const entries = aelluxJs.diagnostics.showHistory()
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
    const levels = aelluxJs.diagnostics.levels;
    aelluxJs.init({ mode: "basic", verboseLevel: "warn" });
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
      aelluxJs.diagnostics.error(definition);
      aelluxJs.diagnostics.warn(definition);
      aelluxJs.diagnostics.info(definition);
    } finally {
      console.error = original.error;
      console.warn = original.warn;
      console.info = original.info;
    }
    return {
      levels,
      configured: aelluxJs.options.verboseLevel,
      diagnosticLevel: aelluxJs.diagnostics.verboseLevel,
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
    aelluxJs.init();
    const initial = aelluxJs.diagnostics.verboseLevel;
    aelluxJs.init({ verboseLevel: "info" });
    return {
      initial,
      configured: aelluxJs.options.verboseLevel,
      active: aelluxJs.diagnostics.verboseLevel
    };
  });
  expect(result).toEqual({ initial: 0, configured: 2, active: 2 });
});

test("diagnostic history includes filtered logs and shows the last requested lines", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  const result = await page.evaluate(() => {
    const diagnostics = aelluxJs.diagnostics;
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

test("diagnostic history retains the latest 100 entries in chronological order", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  const result = await page.evaluate(() => {
    const diagnostics = aelluxJs.diagnostics;
    const originalLog = console.log;
    console.log = () => {};
    try {
      for (let i = 0; i < 105; i++) {
        diagnostics.info({ code: i, message: "History limit probe" }, { index: i });
      }
      const all = diagnostics.showHistory();
      const lastThree = diagnostics.showHistory(3);
      return {
        count: all.length,
        first: all[0].context.index,
        last: all[all.length - 1].context.index,
        lastThree: lastThree.map(entry => entry.context.index),
        oversizedRequest: diagnostics.showHistory(1000).length,
        emptyRequest: diagnostics.showHistory(0).length
      };
    } finally {
      console.log = originalLog;
    }
  });
  expect(result).toEqual({
    count: 100,
    first: 5,
    last: 104,
    lastThree: [102, 103, 104],
    oversizedRequest: 100,
    emptyRequest: 0
  });
});

test("renamed global and event prefix are available", async ({ page }) => {
  await openScenario(page, "runtime-modern");
  const result = await page.evaluate(() => ({
    sameAlias: window.aelluxJs === window.$ae,
    oldGlobal: typeof window.Aellux,
    eventName: window.aelluxJs.eventName("Ready")
  }));
  expect(result).toEqual({
    sameAlias: true,
    oldGlobal: "undefined",
    eventName: "AelluxJsReady"
  });
  const dispatchedType = await page.evaluate(() => new Promise(resolve => {
    document.addEventListener("AelluxJsProbe", event => resolve(event.type), { once: true });
    aelluxJs.dispatch("Probe");
  }));
  expect(dispatchedType).toBe("AelluxJsProbe");
});

test("event names preserve existing formatting and explicit raw names", async ({ page }) => {
  await openScenario(page, "runtime-modern");
  const result = await page.evaluate(() => {
    const names = ["pointerdown", "AelluxJsPointerDown", "$pointerdown", "#pointerdown",
      "_pointerdown", "!pointerdown", "!my-CustomEvent"];
    const normalized = names.map(name => aelluxJs.eventName(name));
    const received = [];
    for (const name of ["AelluxJsPointerDown", "_pointerdown", "$pointerdown"]) {
      const handler = event => received.push(event.type);
      aelluxJs.on(name, handler);
      aelluxJs.dispatch(name);
      aelluxJs.off(name, handler);
    }
    const element = document.createElement("div");
    element.addEventListener("pointerdown", event => received.push(event.type));
    aelluxJs.dispatchFrom(element, "!pointerdown");
    return { normalized, received };
  });
  expect(result).toEqual({
    normalized: ["AelluxJsPointerdown", "AelluxJsPointerDown", "pointerdown",
      "pointerdown", "pointerdown", "pointerdown", "my-CustomEvent"],
    received: ["AelluxJsPointerDown", "pointerdown", "pointerdown", "pointerdown"]
  });
});

test("target listeners handle native and aellux.js events with matching removal", async ({ page }) => {
  await openScenario(page, "runtime-modern");
  const received = await page.evaluate(() => {
    const target = document.createElement("div");
    const events = [];
    const onClick = event => events.push(event.type);
    const onLayout = event => events.push(event.type);
    aelluxJs.onEvent(target, "$click", onClick, { capture: true });
    aelluxJs.onEvent(target, "Layout", onLayout);
    aelluxJs.dispatchFrom(target, "$click");
    aelluxJs.dispatchFrom(target, "Layout");
    aelluxJs.offEvent(target, "$click", onClick, true);
    aelluxJs.offEvent(target, "Layout", onLayout);
    aelluxJs.dispatchFrom(target, "$click");
    aelluxJs.dispatchFrom(target, "Layout");
    return events;
  });
  expect(received).toEqual(["click", "AelluxJsLayout"]);
});

test("ESM entry exports the shared core API", async ({ page }) => {
  await page.goto("/tests/index.htm");
  const created = await page.evaluate(async () => {
    const aelluxJs = (await import("/dist/aellux.esm.js")).default;
    window.importedAelluxJs = aelluxJs;
    return {
      sharedApi: aelluxJs === globalThis.aelluxJs,
      sharedAlias: aelluxJs === globalThis.$ae,
      extensionRegistry: Object.keys(aelluxJs.registry.ext).length,
      dependencyRegistry: Object.keys(aelluxJs.registry.dep).length,
      lazySelectors: Object.keys(aelluxJs.registry.lazyExtSelectors).length,
      extMounters: Object.keys(aelluxJs.registry.extMounters).length,
      preferenceMediaQueries: Object.hasOwn(aelluxJs.registry.preferenceMediaQueries, "colorScheme"),
      oldPreferenceMediaQueries: Object.hasOwn(aelluxJs, "preferencesMediaQueries"),
      diagnosticsLegacy: aelluxJs.diagnostics.legacy,
      diagnosticsSupported: aelluxJs.diagnostics.supported,
      diagnosticsNotAvailable: aelluxJs.diagnostics.notAvailable.length,
      oldRuntimeStatus: ["legacy", "supported", "notAvailable"].some(key => Object.hasOwn(aelluxJs, key)),
      oldRegistry: Object.hasOwn(aelluxJs, "extRegistry"),
      oldLazySelectors: Object.hasOwn(aelluxJs, "lazyExtensionSelectors"),
      oldExtensionMounters: Object.hasOwn(aelluxJs, "extensionMounters"),
      oldRegistryLazySelectors: Object.hasOwn(aelluxJs.registry, "lazyExtensionSelectors"),
      oldRegistryExtensionMounters: Object.hasOwn(aelluxJs.registry, "extensionMounters"),
      attribute: aelluxJs.attr("preference"),
      extensionName: aelluxJs.extName("aellux.ext.state-navigation.js")
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
    const aelluxJs = (await import("/dist/aellux.esm.js")).default;
    return aelluxJs === window.importedAelluxJs &&
      aelluxJs === globalThis.aelluxJs && aelluxJs === globalThis.$ae;
  })).toBe(true);
  await page.evaluate(() => window.importedAelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => window.importedAelluxJs.diagnostics.supported)).toBe(true);

  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  expect(await page.evaluate(async () => {
    const api = globalThis.aelluxJs;
    const aelluxJs = (await import("/dist/aellux.esm.js")).default;
    return aelluxJs === api && globalThis.$ae === api;
  })).toBe(true);
});

test("extension filename helper exposes the name terminology", async ({ page }) => {
  await openScenario(page, "runtime-modern");
  expect(await page.evaluate(() =>
    aelluxJs.extName("/dist/aellux.ext.state-navigation.js")
  )).toBe("state-navigation");
});

test("Extension names do not replace core API methods", async ({ page }) => {
  await openScenario(page, "runtime-modern");
  const result = await page.evaluate(async () => {
    const coreRequest = aelluxJs.request;
    aelluxJs.ext("request");
    aelluxJs.extAttach("request", { init() {} });
    const extension = await aelluxJs.wait("request");
    return {
      coreRequestPreserved: aelluxJs.request === coreRequest,
      extension: aelluxJs.ext.request === extension,
      initialized: extension.initialized,
      apiIsFunction: typeof aelluxJs === "function"
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
      aelluxJs.ext("option-probe");
      aelluxJs.extAttach("option-probe", {
        init(options) { window.optionProbeOptions = options; }
      });
      aelluxJs.ext("empty-probe");
      aelluxJs.extAttach("empty-probe", {
        init(options) { window.emptyProbeOptions = options; }
      });
      aelluxJs.init({
        mode: "basic",
        forceLegacy: legacy,
        extensions: {
          "option-probe": { enabled: true },
          alreadyCamel: { retained: true }
        }
      });
    }, forceLegacy);

    await expect.poll(() => page.evaluate(() => aelluxJs.ext.optionProbe?.initialized)).toBe(true);
    expect(await page.evaluate(() => ({
      legacy: aelluxJs.diagnostics.legacy,
      sameObject: window.optionProbeOptions === aelluxJs.options.extensions.optionProbe,
      enabled: window.optionProbeOptions.enabled,
      camelKeyRetained: aelluxJs.options.extensions.alreadyCamel.retained,
      hyphenKeyRemoved: !Object.hasOwn(aelluxJs.options.extensions, "option-probe"),
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
    aelluxJs.persist.local.set("probe", "local");
    aelluxJs.persist.preferences.set("probe", "preferences");
    return {
      local: localStorage.getItem("AelluxJsPersist"),
      preferences: localStorage.getItem("AelluxJsPreferences"),
      oldLocal: localStorage.getItem("AelluxPersist"),
      oldPreferences: localStorage.getItem("AelluxPreferences"),
      errorName: aelluxJs.diagnostics.create(aelluxJs.diagnostics.ERROR_NOT_INITIALIZED).name
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
  await page.evaluate(() => aelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.stateNavigation?.initialized)).toBe(true);
  expect(await page.evaluate(() => ({
    registered: Object.hasOwn(aelluxJs.registry.ext, "stateNavigation"),
    bundled: Object.hasOwn(aelluxJs.bundledExtensions, "stateNavigation"),
    oldRegistered: Object.hasOwn(aelluxJs.registry.ext, "state-navigation"),
    oldBundled: Object.hasOwn(aelluxJs.bundledExtensions, "state-navigation")
  }))).toEqual({ registered: true, bundled: true, oldRegistered: false, oldBundled: false });
  expect(await page.evaluate(() => ({
    initialized: aelluxJs.ext.adaptive?.initialized === true,
    registered: Object.hasOwn(aelluxJs.registry.ext, "adaptive"),
    bundled: Object.hasOwn(aelluxJs.bundledExtensions, "adaptive"),
    style: aelluxJs.registry.ext.adaptive?.loadStyle,
    presentInitialized: aelluxJs.ext.present?.initialized === true,
    presentStyle: aelluxJs.registry.ext.present?.loadStyle,
    ajaxHrefBundled: Object.hasOwn(aelluxJs.bundledExtensions, "ajaxHref")
  }))).toEqual({
    initialized: false,
    registered: true,
    bundled: true,
    style: false,
    presentInitialized: false,
    presentStyle: false,
    ajaxHrefBundled: false
  });
  expect(await page.evaluate(() => history.state?.aelluxJsState)).toBe(true);
  expect(await page.evaluate(() => history.state?.aelluxState)).toBeUndefined();
});

test("minified distribution exposes the renamed global", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.min.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => window.aelluxJs.diagnostics.supported)).toBe(true);
  await page.evaluate(() => Promise.all([aelluxJs.wait("adaptive"), aelluxJs.wait("present")]));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.adaptive?.initialized)).toBe(true);
  await expect(page.locator('link[data-ae-full-style]')).toHaveAttribute(
    "href", /aellux\.full\.min\.css$/
  );
  await expect(page.locator('link[data-ae-full-style]')).toHaveAttribute(
    "href", /aellux\.full\.min\.css$/
  );
  expect(await page.evaluate(() => window.aelluxJs === window.$ae)).toBe(true);
  expect(await page.evaluate(() => typeof window.Aellux)).toBe("undefined");
});

test("legacy full runtime loads generated Extension stylesheets", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full", forceLegacy: true }));
  await expect.poll(() => page.evaluate(() => aelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  await page.evaluate(() => Promise.all([aelluxJs.wait("adaptive"), aelluxJs.wait("present")]));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.adaptive?.initialized)).toBe(true);
  await expect(page.locator('link[data-ae-full-style]')).toHaveAttribute(
    "href", /aellux\.full\.css$/
  );
  await expect(page.locator('link[data-ae-full-style]')).toHaveAttribute(
    "href", /aellux\.full\.css$/
  );
});

test("preference options update inputs and value-label visibility", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div data-ae-preference="color-scheme">
        <input id="scheme:light" type="radio" name="scheme">
        <label data-ae-option="light" for="scheme:light">Light</label>
        <label data-ae-option="dark" for="missing-input">Dark</label>
        <span id="label-auto" data-ae-label="auto">Automatic</span>
        <span id="label-light" data-ae-label="light">Light selected</span>
        <span id="label-dark" data-ae-label="dark">Dark selected</span>
      </div>`;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.preference?.initialized)).toBe(true);
  await expect(page.locator("#label-auto")).toBeVisible();
  await expect(page.locator("#label-light")).toBeHidden();
  await expect(page.locator("#label-dark")).toBeHidden();
  await page.evaluate(() => {
    aelluxJs.ext.preference.set("color-scheme", "light");
    aelluxJs.ext.preference.update();
  });
  await expect(page.locator('[id="scheme:light"]')).toBeChecked();
  await expect(page.locator('[id="scheme:light"]')).toHaveValue("light");
  await expect(page.locator("#label-auto")).toBeHidden();
  await expect(page.locator("#label-light")).toBeVisible();
  await expect(page.locator("#label-dark")).toBeHidden();

  await page.getByText("Dark", { exact: true }).click();
  await expect(page.locator("#label-light")).toBeHidden();
  await expect(page.locator("#label-dark")).toBeVisible();
  await page.evaluate(() => aelluxJs.unmount(
    document.querySelector("[data-ae-preference]"), "preference"
  ));
  await expect(page.locator("#label-auto")).toBeVisible();
  await expect(page.locator("#label-light")).toBeVisible();
  await expect(page.locator("#label-dark")).toBeVisible();
});

test("preference change details report changed keys and stable values", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.preference?.initialized)).toBe(true);

  const result = await page.evaluate(() => {
    const events = [];
    document.addEventListener("AelluxJsPreferencesChange", event => events.push(event.detail));
    const preference = aelluxJs.ext.preference;
    preference.update();
    preference.set("color-scheme", "light");
    preference.update();
    preference.set("color-scheme", "dark");
    preference.update();
    return events.map(detail => ({
      changed: detail.changed,
      colorScheme: detail.preferences.colorScheme
    }));
  });

  expect(result).toEqual([
    { changed: [], colorScheme: "auto" },
    { changed: ["colorScheme"], colorScheme: "light" },
    { changed: ["colorScheme"], colorScheme: "dark" }
  ]);
});

test("preference updates only affected mounted controls and still dispatches change", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="color-controls" data-ae-preference="color-scheme">
        <span data-ae-label="light">Light</span>
      </div>
      <div id="scale-controls" data-ae-preference="text-scale">
        <span data-ae-label="1.5">Large</span>
      </div>`;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() =>
    !!aelluxJs.mountManager?.controller(document.getElementById("color-controls")) &&
    !!aelluxJs.mountManager.controller(document.getElementById("scale-controls"))
  )).toBe(true);

  const result = await page.evaluate(async () => {
    const color = document.getElementById("color-controls");
    const scale = document.getElementById("scale-controls");
    const calls = { color: 0, scale: 0, events: 0 };
    for (const [element, key] of [[color, "color"], [scale, "scale"]]) {
      const querySelectorAll = element.querySelectorAll;
      element.querySelectorAll = function (selector) {
        calls[key]++;
        return querySelectorAll.call(this, selector);
      };
    }
    document.addEventListener("AelluxJsPreferencesChange", () => calls.events++);
    const preference = aelluxJs.ext.preference;
    preference.set("color-scheme", "light");
    preference.update();
    const afterColor = { ...calls, visible: !color.querySelector("span").hidden };
    preference.update();
    const afterSameValue = { ...calls };
    scale.setAttribute("data-ae-preference", "color-scheme");
    preference.update();
    const afterRename = { ...calls, visible: !scale.querySelector("span").hidden };
    await aelluxJs.unmount(color, "preference");
    preference.set("color-scheme", "dark");
    preference.update();
    return { afterColor, afterSameValue, afterRename, afterUnmount: { ...calls } };
  });
  expect(result).toEqual({
    afterColor: { color: 2, scale: 0, events: 1, visible: true },
    afterSameValue: { color: 2, scale: 0, events: 2 },
    afterRename: { color: 2, scale: 2, events: 3, visible: false },
    afterUnmount: { color: 2, scale: 4, events: 4 }
  });
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
        <span id="scale-label" data-ae-label="1.5">150%</span>
      </div>
    `;
    aelluxJs.persist.preferences.set("textScale", "1.5");
    aelluxJs.init({ mode: "full" });
  });
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.preference?.initialized)).toBe(true);
  await expect.poll(() => page.evaluate(() =>
    !!aelluxJs.mountManager.controller(document.getElementById("color-next").parentElement)
    && !!aelluxJs.mountManager.controller(document.getElementById("scale-next").parentElement)
  )).toBe(true);
  await expect(page.locator("#scale-label")).toBeVisible();

  await page.locator("#color-next").press("Enter");

  const result = await page.evaluate(() => {
    const preference = aelluxJs.ext.preference;
    const values = {};
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
    aelluxJs.persist.preferences.set("colorScheme", "dark");
    aelluxJs.ext("preference");
    aelluxJs.init({ mode: "basic" });
  });
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.preference?.initialized)).toBe(true);
  const themeColor = () => page.locator("meta[data-ae-theme-color]").getAttribute("content");
  await expect.poll(themeColor).toBe("#000000");

  await page.evaluate(() => {
    aelluxJs.ext.preference.set("color-scheme", "light");
    aelluxJs.ext.preference.update();
  });
  await expect.poll(themeColor).toBe("#ffffff");

  await page.evaluate(() => {
    aelluxJs.ext.preference.set("color-scheme", "auto");
    aelluxJs.ext.preference.update();
  });
  await expect(page.locator("meta[data-ae-theme-color]")).toHaveCount(0);
});

test("preference reflects and clears motion, contrast, and forced-color values", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    for (const queries of Object.values(aelluxJs.registry.preferenceMediaQueries)) {
      for (const key of Object.keys(queries)) queries[key] = null;
    }
    aelluxJs.init({ mode: "full" });
  });
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.preference?.initialized)).toBe(true);

  const attributes = ["data-ae-reduced-motion", "data-ae-contrast", "data-ae-forced-colors"];
  const readAttributes = () => page.evaluate((names) => Object.fromEntries(
    names.map(name => [name, document.documentElement.getAttribute(name)])
  ), attributes);

  await page.evaluate(() => {
    const preference = aelluxJs.ext.preference;
    preference.set("reduced-motion", "reduced");
    preference.set("contrast", "more");
    preference.set("forced-colors", "active");
    preference.update();
  });
  expect(await readAttributes()).toEqual({
    "data-ae-reduced-motion": "reduced",
    "data-ae-contrast": "more",
    "data-ae-forced-colors": "active"
  });

  await page.evaluate(() => {
    const preference = aelluxJs.ext.preference;
    preference.set("reduced-motion", "auto");
    preference.set("contrast", "auto");
    preference.set("forced-colors", "auto");
    preference.update();
  });
  expect(await readAttributes()).toEqual({
    "data-ae-reduced-motion": null,
    "data-ae-contrast": null,
    "data-ae-forced-colors": null
  });
});

test("full runtime loads generated adaptive styles", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="ae--fits-small"><div id="adaptive-probe" class="p-ux-sm-2"></div></div>';
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  await page.evaluate(() => aelluxJs.wait("adaptive"));
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.adaptive?.initialized)).toBe(true);
  await expect(page.locator('link[data-ae-full-style]')).toHaveAttribute(
    "href", /aellux\.full\.css$/
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
    aelluxJs.ext("stateNavigation", {
      loadWhen: "#state-navigation-probe",
      loadStyle: "/tests/browser/extension-style.css"
    });
    const registryKey = Object.hasOwn(aelluxJs.registry.ext, "stateNavigation");
    const lazyKey = Object.hasOwn(aelluxJs.registry.lazyExtSelectors, "stateNavigation");
    document.body.insertAdjacentHTML("beforeend", '<div id="state-navigation-probe"></div>');
    aelluxJs.init({ mode: "basic" });
    return { registryKey, lazyKey };
  });
  expect(initial).toEqual({ registryKey: true, lazyKey: true });
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.stateNavigation?.initialized)).toBe(true);
  const result = await page.evaluate(() => ({
    registryKey: Object.hasOwn(aelluxJs.registry.ext, "stateNavigation"),
    oldRegistryKey: Object.hasOwn(aelluxJs.registry.ext, "state-navigation"),
    lazyKeyCleared: !Object.hasOwn(aelluxJs.registry.lazyExtSelectors, "stateNavigation"),
    script: document.querySelector("script[data-ae-ext='state-navigation']")?.getAttribute("src"),
    style: Boolean(document.querySelector("link[data-ae-ext-style='state-navigation']"))
  }));
  expect(result.registryKey).toBe(true);
  expect(result.oldRegistryKey).toBe(false);
  expect(result.lazyKeyCleared).toBe(true);
  expect(result.script).toMatch(/aellux\.ext\.state-navigation\.js$/);
  expect(result.style).toBe(true);
});
