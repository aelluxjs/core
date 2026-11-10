import { expect, test } from "@playwright/test";

for (const boot of ["aellux.js", "aellux.min.js"]) for (const forceLegacy of [false, true]) {
  for (const mode of ["basic", "full"]) {
    test(`canonical global survives ${mode} startup and extension loading (${boot}, Legacy=${forceLegacy})`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/tests/index.htm");
      await page.addScriptTag({ url: `/dist/${boot}` });
      const state = await page.evaluate(async ({ mode, forceLegacy }) => {
        const api = globalThis.aelluxJs;
        const comm = api.comm;
        const ready = new Promise(resolve => api.on("Ready", resolve, { once: true }));
        api.init({ mode, forceLegacy });
        await ready;
        // Independent signed scripts must find the same global after startup.
        api.ext("progress", { load: false });
        await api.wait("progress");
        const probe = document.createElement("progress");
        document.body.append(probe);
        await api.mount(probe);
        return {
          sameInstance: api === globalThis.aelluxJs && api === globalThis.$ae,
          sameCommunication: comm === api.comm,
          hasOldGlobal: Object.prototype.hasOwnProperty.call(globalThis, "AelluxJs"),
          hasBrandAlias: Object.prototype.hasOwnProperty.call(globalThis, "aellux"),
          progressInitialized: api.ext.progress.initialized,
          legacy: api.diagnostics.legacy,
          eventType: api.eventName("Ready")
        };
      }, { mode, forceLegacy });
      expect(state).toEqual({ sameInstance: true, sameCommunication: true, hasOldGlobal: false,
        hasBrandAlias: false, progressInitialized: true, legacy: forceLegacy, eventType: "AelluxJsReady" });
      expect(errors).toEqual([]);
    });
  }
}

for (const esm of ["aellux.esm.js", "aellux.esm.min.js"]) for (const order of ["module-first", "boot-first"]) {
  test(`${esm} shares the canonical global with the boot (${order})`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    if (order === "boot-first") await page.addScriptTag({ url: "/dist/aellux.js" });
    await page.evaluate(async esm => {
      const { default: api } = await import(`/dist/${esm}`);
      globalThis.importedApi = api;
    }, esm);
    if (order === "module-first") await page.addScriptTag({ url: "/dist/aellux.js" });
    expect(await page.evaluate(() => ({
      shared: importedApi === globalThis.aelluxJs && importedApi === globalThis.$ae,
      hasOldGlobal: Object.prototype.hasOwnProperty.call(globalThis, "AelluxJs"),
      hasBrandAlias: Object.prototype.hasOwnProperty.call(globalThis, "aellux")
    }))).toEqual({ shared: true, hasOldGlobal: false, hasBrandAlias: false });
  });
}
