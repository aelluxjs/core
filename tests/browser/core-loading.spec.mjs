import { expect, test } from "@playwright/test";
import { officialExtensionDefinitions } from "../../src/official-extension-definitions.js";

const keys = officialExtensionDefinitions.map(({ name }) =>
  name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())).sort();

for (const boot of ["aellux.js", "aellux.min.js"]) for (const forceLegacy of [false, true]) {
  for (const mode of ["basic", "full"]) {
    test(`${mode} ${boot} honors its registration policy (Legacy=${forceLegacy})`, async ({ page }) => {
      const scripts = [];
      page.on("request", request => {
        if (/\/aellux\.ext\..*\.js$/.test(request.url())) scripts.push(new URL(request.url()).pathname.split("/").pop());
      });
      await page.goto("/tests/index.htm");
      await page.addScriptTag({ url: `/dist/${boot}` });
      await page.evaluate(async ({ mode, forceLegacy }) => {
        await new Promise(resolve => {
          AelluxJs.on("Ready", resolve, { once: true });
          AelluxJs.on(forceLegacy ? "Legacy" : "Awake", () => {
            window.registeredAtAwake = Object.keys(AelluxJs.registry.ext).sort();
          }, { once: true });
          AelluxJs.init({ mode, forceLegacy });
        });
      }, { mode, forceLegacy });
      expect(scripts).toEqual([]);
      expect(await page.evaluate(() => Object.keys(AelluxJs.registry.ext).sort())).toEqual(mode === "full" ? keys : []);
      expect(await page.evaluate(() => window.registeredAtAwake)).toEqual(mode === "full" ? keys : []);
      if (mode === "basic") {
        expect(await page.evaluate(() => Object.keys(AelluxJs.ext))).toEqual([]);
        expect(await page.evaluate(() => Object.keys(AelluxJs.registry.lazyExtSelectors))).toEqual([]);
      }
      await page.evaluate(async () => {
        document.body.innerHTML = `<div id="scope">
          <button data-ae-point>Point</button><div data-ae-preference="color-scheme"></div>
          <button data-ae-trigger="toggle" data-ae-target="#later">Present</button>
          <div data-ae-scrollbox data-ae-scrollbox-snap style="width:100px;height:50px;overflow:auto"><div style="width:300px;height:100px" data-ae-snap-item></div></div>
          <a data-ae-ajax-href="#scope" href="/next">Next</a>
          <dialog></dialog><button data-ae-pwa="install">Install</button><div data-ae-viewport></div>
        </div>`;
        await AelluxJs.mount(document.getElementById("scope"));
      });
      const loaded = ["point", "preference", "present", "scrollbox", "scrollboxSnap", "ajaxHref", "dialog", "pwa", "viewport"];
      if (mode === "basic") {
        expect(scripts).toEqual([]);
        expect(await page.evaluate(() => Object.keys(AelluxJs.registry.ext))).toEqual([]);
        expect(await page.evaluate(() => Object.keys(AelluxJs.ext))).toEqual([]);
        expect(await page.evaluate(async () => AelluxJs.wait("point").catch(error => error.code))).toBe(1110);
        await page.evaluate(async () => {
          for (const [name, loadWhen] of [
            ["point", "[data-ae-point]"], ["preference", "[data-ae-preference]"],
            ["present", "[data-ae-trigger]"], ["scrollbox", "[data-ae-scrollbox]"],
            ["scrollbox-snap", "[data-ae-scrollbox-snap]"], ["ajax-href", "a[data-ae-ajax-href]"],
            ["dialog", "dialog"], ["pwa", "[data-ae-pwa]"], ["viewport", "[data-ae-viewport]"]
          ]) AelluxJs.ext(name, { loadWhen });
          await AelluxJs.mount(document.getElementById("scope"));
        });
        expect(await page.evaluate(() => Object.keys(AelluxJs.registry.ext).sort())).toEqual([...loaded].sort());
      }
      expect(await page.evaluate(loaded => loaded.filter(key => !AelluxJs.ext[key]?.initialized), loaded)).toEqual([]);
      const suffix = `${forceLegacy ? ".legacy" : ""}${boot.includes(".min.") ? ".min" : ""}.js`;
      const external = mode === "full" ? ["ajax-href", "dialog", "pwa", "viewport"] :
        ["point", "preference", "present", "scrollbox", "scrollbox-snap", "ajax-href", "dialog", "pwa", "viewport"];
      expect(scripts.sort()).toEqual(external.map(name => `aellux.ext.${name}${suffix}`).sort());
      await page.evaluate(() => AelluxJs.mount(document.getElementById("scope")));
      expect(scripts).toHaveLength(external.length);
      if (mode === "basic") {
        await page.evaluate(() => AelluxJs.ext("state-navigation", { load: false }));
        expect(await page.evaluate(async () => !!(await AelluxJs.wait("state-navigation")))).toBe(true);
        expect(scripts).toContain(`aellux.ext.state-navigation${suffix}`);
      }
    });
  }
}

test("Basic accepts only host declarations and retains explicit styles and selectors", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  const result = await page.evaluate(async () => {
    AelluxJs.ext("feedback", { loadWhen: "#custom-feedback", loadStyle: true });
    await new Promise(resolve => {
      AelluxJs.on("Ready", resolve, { once: true });
      AelluxJs.init({ mode: "basic" });
    });
    document.body.innerHTML = '<link rel="aelluxjs-ext" href="anchor" data-ae-load-when="#custom-anchor" data-ae-load-style="true">';
    await AelluxJs.mount(document);
    AelluxJs.ext("preference", { load: false });
    return {
      feedback: AelluxJs.registry.ext.feedback.loadWhen,
      anchor: AelluxJs.registry.ext.anchor.loadWhen,
      style: AelluxJs.registry.ext.anchor.loadStyle,
      preference: AelluxJs.registry.ext.preference.load,
      registered: Object.keys(AelluxJs.registry.ext).sort(),
      errors: AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 1101)
    };
  });
  expect(result).toEqual({ feedback: "#custom-feedback", anchor: "#custom-anchor", style: "true", preference: false,
    registered: ["anchor", "feedback", "preference"], errors: [] });
});
