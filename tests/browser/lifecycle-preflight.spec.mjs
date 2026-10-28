import { expect, test } from "@playwright/test";

async function start(page, forceLegacy) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(forceLegacy => new Promise(resolve => {
    AelluxJs.on("Ready", resolve, { once: true });
    AelluxJs.init({ mode: "basic", skipGlobalMount: true, forceLegacy });
  }), forceLegacy);
  await page.evaluate(async () => {
    document.body.innerHTML = `<section id="scope" data-lifecycle-probe data-ae-wait-mounted
      aria-busy="initial" class="ae--initial"><div id="child" data-lifecycle-probe></div></section>`;
    window.calls = { mount: [], unmount: [], update: [], destroy: 0 };
    AelluxJs.ext("lifecycle-probe");
    AelluxJs.extAttach("lifecycle-probe", {
      init() {
        AelluxJs.mountManager.add({
          extensionName: "lifecycle-probe", selector: "[data-lifecycle-probe]",
          mount: el => calls.mount.push(el.id),
          unmount: el => calls.unmount.push(el.id),
          update: el => calls.update.push(el.id)
        });
      },
      destroy() { calls.destroy++; }
    });
    await AelluxJs.wait("lifecycle-probe");
  });
}

for (const forceLegacy of [false, true]) {
  test(`BeforeMount veto preserves DOM, lazy declarations and waiting state (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, forceLegacy);
    const result = await page.evaluate(async () => {
      const scope = document.getElementById("scope");
      scope.insertAdjacentHTML("beforeend", '<link rel="aelluxjs-ext" href="/unused-ext.js">');
      const initial = scope.outerHTML;
      const events = [];
      AelluxJs.ext("unused-lazy", { loadWhen: "[data-lifecycle-probe]" });
      AelluxJs.on("BeforeMount", event => {
        events.push({ name: "BeforeMount", root: event.detail.root.id,
          extensions: event.detail.extensions, cancelable: event.cancelable,
          documentTarget: event.target === document, unchanged: scope.outerHTML === initial });
        event.preventDefault();
      });
      AelluxJs.on("Mount", () => events.push({ name: "Mount" }));
      const mounted = await AelluxJs.mount("#scope");
      return { mounted, events, unchanged: scope.outerHTML === initial, calls,
        lazyState: AelluxJs.registry.ext.unusedLazy.state,
        declarativeRegistered: !!AelluxJs.registry.ext.unusedExt,
        extensionScripts: document.querySelectorAll('script[data-ae-ext]').length };
    });
    expect(result).toEqual({
      mounted: [], events: [{ name: "BeforeMount", root: "scope", extensions: null,
        cancelable: true, documentTarget: true, unchanged: true }],
      unchanged: true, calls: { mount: [], unmount: [], update: [], destroy: 0 },
      lazyState: "wait", declarativeRegistered: false, extensionScripts: 0
    });
  });

  test(`lifecycle vetoes apply to APIs and preserve controllers until an accepted retry (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, forceLegacy);
    const result = await page.evaluate(async () => {
      const scope = document.getElementById("scope");
      const events = [];
      for (const name of ["BeforeMount", "Mount", "BeforeUnmount", "Unmount"]) {
        AelluxJs.on(name, event => events.push({ name, root: event.detail.root.id,
          extensions: event.detail.extensions, elements: event.detail.elements?.map(el => el.id) }));
      }
      const cancelMount = event => event.preventDefault();
      AelluxJs.on("BeforeMount", cancelMount);
      const vetoedMount = await AelluxJs.mountManager.mount(scope, "lifecycleProbe");
      AelluxJs.off("BeforeMount", cancelMount);
      const mounted = await AelluxJs.mount(scope, ["lifecycleProbe"]);
      const controller = $ae(scope);
      const cancelUnmount = event => event.preventDefault();
      AelluxJs.on("BeforeUnmount", cancelUnmount);
      const vetoedUnmount = await controller.unmount("lifecycleProbe");
      const retained = $ae(scope) === controller && scope.classList.contains("ae--mounted");
      await controller.update("lifecycleProbe");
      AelluxJs.off("BeforeUnmount", cancelUnmount);
      const accepted = await AelluxJs.mountManager.unmount(scope, "lifecycleProbe");
      return { vetoedMount, mounted: mounted.map(el => el.id), vetoedUnmount, retained,
        accepted, calls, events };
    });
    expect(result).toEqual({
      vetoedMount: [], mounted: ["scope", "child"], vetoedUnmount: false, retained: true,
      accepted: true, calls: { mount: ["scope", "child"], unmount: ["child", "scope"],
        update: ["scope", "child"], destroy: 0 },
      events: [
        { name: "BeforeMount", root: "scope", extensions: ["lifecycle-probe"] },
        { name: "BeforeMount", root: "scope", extensions: ["lifecycle-probe"] },
        { name: "Mount", root: "scope", extensions: ["lifecycle-probe"], elements: ["scope", "child"] },
        { name: "BeforeUnmount", root: "scope", extensions: ["lifecycle-probe"] },
        { name: "BeforeUnmount", root: "scope", extensions: ["lifecycle-probe"] },
        { name: "Unmount", root: "scope", extensions: ["lifecycle-probe"], elements: ["child", "scope"] }
      ]
    });
  });

  test(`BeforeMount can veto startup while Ready and manual mounting remain available (legacy=${forceLegacy})`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });
    const result = await page.evaluate(async forceLegacy => {
      document.body.innerHTML = '<div id="target" data-startup-probe></div>';
      const events = [];
      AelluxJs.ext("startup-probe");
      AelluxJs.extAttach("startup-probe", { init() {
        AelluxJs.mountManager.add({ extensionName: "startup-probe", selector: "[data-startup-probe]",
          mount() { events.push("callback"); } });
      } });
      AelluxJs.on("BeforeMount", event => { events.push("BeforeMount"); event.preventDefault(); }, { once: true });
      AelluxJs.on("Mount", () => events.push("Mount"));
      const ready = new Promise(resolve => AelluxJs.on("Ready", () => { events.push("Ready"); resolve(); }, { once: true }));
      AelluxJs.init({ mode: "basic", forceLegacy });
      await ready;
      const mounted = await AelluxJs.mount(document);
      return { events, mounted: mounted.map(el => el.id) };
    }, forceLegacy);
    expect(result).toEqual({ events: ["BeforeMount", "Ready", "callback", "Mount"], mounted: ["target"] });
  });

  test(`invalid roots emit no preflight and empty passes still complete (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, forceLegacy);
    const result = await page.evaluate(async () => {
      const events = [];
      for (const name of ["BeforeMount", "Mount", "BeforeUnmount", "Unmount"]) {
        AelluxJs.on(name, event => events.push({ name, extensions: event.detail.extensions }));
      }
      const invalidMount = await AelluxJs.mount("missing");
      const invalidUnmount = await AelluxJs.unmount("missing");
      const invalidEvents = events.slice();
      const emptyMount = await AelluxJs.mount("scope", []);
      const emptyUnmount = await AelluxJs.unmount("scope", []);
      return { invalidMount, invalidUnmount, invalidEvents, emptyMount, emptyUnmount, events };
    });
    expect(result).toEqual({ invalidMount: [], invalidUnmount: false, invalidEvents: [],
      emptyMount: [], emptyUnmount: true,
      events: ["BeforeMount", "Mount", "BeforeUnmount", "Unmount"].map(name => ({ name, extensions: [] })) });
  });

  test(`BeforeUnmount can veto detached cleanup without a retry loop (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, forceLegacy);
    const result = await page.evaluate(async () => {
      const scope = document.getElementById("scope");
      await AelluxJs.mount(scope);
      const controller = $ae(scope);
      let attempts = 0, completions = 0;
      let notified;
      const before = new Promise(resolve => { notified = resolve; });
      const cancel = event => {
        if (!event.detail.detachedOnly) return;
        attempts++;
        event.preventDefault();
        notified();
      };
      AelluxJs.on("BeforeUnmount", cancel);
      AelluxJs.on("Unmount", () => completions++);
      scope.remove();
      await before;
      await new Promise(resolve => setTimeout(resolve, 50));
      const canceled = { attempts, completions, calls: calls.unmount.slice(), retained: $ae(scope) === controller };
      AelluxJs.off("BeforeUnmount", cancel);
      const retry = await AelluxJs.unmount(scope);
      return { canceled, retry, completions, unmounts: calls.unmount };
    });
    expect(result).toEqual({ canceled: { attempts: 1, completions: 0, calls: [], retained: true },
      retry: true, completions: 1, unmounts: ["child", "scope"] });
  });

  test(`teardown honors BeforeUnmount before clearing runtime resources (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, forceLegacy);
    const result = await page.evaluate(async () => {
      const scope = document.getElementById("scope");
      await AelluxJs.mount(scope);
      const controller = $ae(scope);
      const cancel = event => event.preventDefault();
      AelluxJs.on("BeforeUnmount", cancel);
      let clears = 0, observerDestroys = 0, queuedRan = false;
      const clear = AelluxJs.waitLayout.clear;
      AelluxJs.waitLayout = { ...AelluxJs.waitLayout,
        clear(...args) { clears++; return clear(...args); } };
      const destroy = AelluxJs.mountManager.destroy;
      AelluxJs.mountManager.destroy = () => { observerDestroys++; return destroy(); };
      const task = AelluxJs.waitLayout.update(() => { queuedRan = true; });
      const extensionResult = await AelluxJs.destroyExtensions("lifecycle-probe");
      const coreResult = await AelluxJs.destroy();
      await task;
      const canceled = { extensionResult, coreResult, clears, observerDestroys, queuedRan,
        retained: $ae(scope) === controller && !!AelluxJs.registry.ext.lifecycleProbe,
        unmounts: calls.unmount.slice(), destroys: calls.destroy };
      AelluxJs.off("BeforeUnmount", cancel);
      await AelluxJs.destroy();
      return { canceled, clears, observerDestroys, calls, registered: !!AelluxJs.registry.ext.lifecycleProbe };
    });
    expect(result).toEqual({
      canceled: { extensionResult: false, coreResult: false, clears: 0, observerDestroys: 0,
        queuedRan: true, retained: true, unmounts: [], destroys: 0 },
      clears: 1, observerDestroys: 1,
      calls: { mount: ["scope", "child"], unmount: ["child", "scope"], update: [], destroy: 1 }, registered: false
    });
  });

  test(`Ajax Href retains a region whose unmount was vetoed (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, forceLegacy);
    await page.route("**/lifecycle-next.htm", route => route.fulfill({ contentType: "text/html",
      body: '<section id="scope" data-lifecycle-probe>New content</section>' }));
    const result = await page.evaluate(async () => {
      const scope = document.getElementById("scope");
      await AelluxJs.mount(scope);
      const controller = $ae(scope);
      AelluxJs.ext("ajax-href");
      await AelluxJs.wait("ajax-href");
      const cancel = event => { if (event.detail.root === scope) event.preventDefault(); };
      AelluxJs.on("BeforeUnmount", cancel);
      await AelluxJs.ext.ajaxHref.load("/lifecycle-next.htm", "#scope", { ignoreHistory: true });
      const canceled = { sameElement: document.getElementById("scope") === scope,
        retained: $ae(scope) === controller, unmounts: calls.unmount.slice() };
      AelluxJs.off("BeforeUnmount", cancel);
      await AelluxJs.ext.ajaxHref.load("/lifecycle-next.htm", "#scope", { ignoreHistory: true });
      return { canceled, replaced: document.getElementById("scope") !== scope, calls };
    });
    expect(result).toEqual({ canceled: { sameElement: true, retained: true, unmounts: [] }, replaced: true,
      calls: { mount: ["scope", "child", "scope"], unmount: ["child", "scope"], update: [], destroy: 0 } });
  });
}
