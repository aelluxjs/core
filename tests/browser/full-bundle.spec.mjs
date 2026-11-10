import { expect, test } from "@playwright/test";
import { officialExtensionDefinitions } from "../../src/official-extension-definitions.js";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const coreExtensions = officialExtensionDefinitions
  .map(({ name }) => name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())).sort();
const bundledExtensions = officialExtensionDefinitions.filter(entry => !entry.optional)
  .map(({ name }) => name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())).sort();

for (const { boot, forceLegacy } of [
  { boot: "aellux.js", forceLegacy: false },
  { boot: "aellux.min.js", forceLegacy: false },
  { boot: "aellux.js", forceLegacy: true },
  { boot: "aellux.min.js", forceLegacy: true }
]) {
  test(`full ${boot} keeps only foundational extensions eager with forceLegacy=${forceLegacy}`, async ({ page, baseURL }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: `/dist/${boot}` });
    await page.evaluate(forceLegacy => aelluxJs.init({ mode: "full", forceLegacy }), forceLegacy);
    await expect.poll(() => page.evaluate(() =>
      ["preference", "stateNavigation"].filter(name =>
        aelluxJs.ext[name]?.initialized !== true)
    )).toEqual([]);

    const state = await page.evaluate(() => ({
      bundled: Object.keys(aelluxJs.bundledExtensions).sort(),
      registered: Object.keys(aelluxJs.registry.ext).sort(),
      lazy: Object.keys(aelluxJs.registry.lazyExtSelectors).sort(),
      externalScripts: [...document.querySelectorAll(`script[${aelluxJs.attr("ext")}]`)]
        .map(script => script.getAttribute(aelluxJs.attr("ext"))),
      legacy: aelluxJs.diagnostics.legacy
    }));
    expect(state).toEqual({
      bundled: bundledExtensions,
      registered: coreExtensions,
      lazy: coreExtensions.filter(name => !["preference", "stateNavigation"].includes(name)),
      externalScripts: [],
      legacy: forceLegacy
    });
    const cssFilename = boot.includes(".min.") ? "aellux.full.min.css" : "aellux.full.css";
    const style = page.locator("link[data-ae-full-style]");
    await expect(style).toHaveAttribute("href", new URL(`/dist/${cssFilename}`, baseURL).href);
    expect(await style.getAttribute("integrity")).toBe("sha384-" + createHash("sha384")
      .update(await readFile(new URL(`../../dist/${cssFilename}`, import.meta.url))).digest("base64"));
    await expect(page.locator("link[data-ae-ext-style],style[data-ae-weak-style]")).toHaveCount(0);
  });

  test(`full ${boot} bundles Viewport and loads Marquee separately with forceLegacy=${forceLegacy}`, async ({ page }) => {
    const requests = [];
    page.on("request", request => {
      if (/aellux\.ext\./.test(request.url())) requests.push(new URL(request.url()).pathname.split("/").pop());
    });
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: `/dist/${boot}` });
    await page.evaluate(forceLegacy => aelluxJs.init({ mode: "full", forceLegacy }), forceLegacy);
    await expect.poll(() => page.evaluate(() => aelluxJs.ext.preference?.initialized)).toBe(true);
    expect(requests).toEqual([]);
    await page.evaluate(async () => {
      document.body.innerHTML = '<div id="observed" data-ae-viewport style="width:100px;height:50px"></div>';
      await aelluxJs.mount(document.body);
    });
    await expect.poll(() => page.locator("#observed").evaluate(element =>
      element.style.getPropertyValue("--ae-viewport-visible"))).toBe("1");
    expect(requests).toEqual([]);
    await page.evaluate(async () => {
      document.body.insertAdjacentHTML("beforeend", '<div id="label" data-ae-overflow-marquee style="width:100px">A long overflowing marquee label</div>');
      await aelluxJs.mount(document.getElementById("label"));
    });
    const min = boot.includes(".min.") ? ".min" : "";
    expect(requests.sort()).toEqual([
      `aellux.ext.overflow-marquee${min}.css`,
      `aellux.ext.overflow-marquee${forceLegacy ? ".legacy" : ""}${min}.js`
    ].sort());
    await expect(page.locator("#label")).toHaveCSS("white-space", "nowrap");
    await expect(page.locator("#label [data-ae-overflow-marquee-content]")).toHaveCount(1);
    const style = page.locator('link[data-ae-ext-style="overflow-marquee"]');
    expect(await style.getAttribute("integrity")).toBe("sha384-" + createHash("sha384")
      .update(await readFile(new URL(`../../dist/aellux.ext.overflow-marquee${min}.css`, import.meta.url))).digest("base64"));
    await page.evaluate(() => aelluxJs.destroyExtensions("overflow-marquee"));
    await expect(style).toHaveCount(0);
    await expect(page.locator("link[data-ae-full-style]")).toHaveCount(1);
  });
}

test("Full waits for its shared CSS and mounts lazy extensions without separate styles", async ({ page }) => {
  const requests = [];
  let releaseStyle;
  const styleGate = new Promise(resolve => { releaseStyle = resolve; });
  await page.route("**/dist/aellux.full.css", async route => {
    await styleGate;
    await route.continue();
  });
  page.on("request", request => {
    if (request.url().endsWith(".css")) requests.push(new URL(request.url()).pathname);
  });
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `<section style="position:relative;width:300px;height:200px">
      <div id="anchor" data-ae-anchor="top-left:top-left">Anchor</div>
      <div id="box" data-ae-scrollbox style="width:100px;height:50px"><div style="height:300px"></div></div>
      <div data-ae-adaptive></div><div data-ae-present="opacity"></div><div data-ae-feedback></div>
    </section>`;
    window.readyCount = 0;
    aelluxJs.on("Ready", () => window.readyCount++);
    aelluxJs.init({ mode: "full" });
    aelluxJs.init({ mode: "full" });
  });
  await expect(page.locator("link[data-ae-full-style]")).toHaveCount(1);
  expect(await page.evaluate(() => window.readyCount)).toBe(0);
  await expect(page.locator('script[src$="aellux.full.js"]')).toHaveCount(0);
  releaseStyle();
  await expect.poll(() => page.evaluate(() => window.readyCount)).toBe(1);
  await expect(page.locator("#box")).toHaveCSS("overflow", "auto");
  await expect(page.locator("#anchor")).toHaveCSS("position", "absolute");
  await expect(page.locator("link[data-ae-ext-style],style[data-ae-weak-style],style[data-ae-anchor-style],style[data-ae-scrollbox-style],style[data-ae-overflow-marquee-style]")).toHaveCount(0);
  expect(requests).toEqual(["/dist/aellux.full.css"]);
  await page.evaluate(() => aelluxJs.destroyExtensions(["anchor", "scrollbox"]));
  await expect(page.locator("link[data-ae-full-style]")).toHaveCount(1);
  await page.evaluate(async () => {
    aelluxJs.ext("scrollbox", { loadStyle: true });
    await aelluxJs.mount(document, "scrollbox");
  });
  await expect(page.locator("#box")).toHaveCSS("overflow", "auto");
  await expect(page.locator("link[data-ae-ext-style]")).toHaveCount(0);
  expect(requests).toEqual(["/dist/aellux.full.css"]);
});

test("Full reports a missing shared stylesheet and continues runtime startup", async ({ page }) => {
  await page.route("**/dist/aellux.full.css", route => route.abort());
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.diagnostics.supported)).toBe(true);
  expect(await page.evaluate(() => aelluxJs.diagnostics.showHistory().some(entry =>
    entry.code === aelluxJs.diagnostics.WARN_EXTENSION_STYLE_LOAD.code && entry.context.extension === "full"))).toBe(true);
});

test("a Present trigger alone loads its lazy extension in full mode", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = '<button id="trigger" data-ae-present-trigger="toggle" data-ae-present-target="#later"></button>';
    aelluxJs.init({ mode: "full" });
  });
  await expect.poll(() => page.evaluate(() => aelluxJs.ext.present?.initialized)).toBe(true);
  await expect.poll(() => page.evaluate(() =>
    !!aelluxJs.mountManager.controller("trigger")?.present)).toBe(true);
});
