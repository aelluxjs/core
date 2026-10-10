import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const distribution = join(process.cwd(), "dist");

async function expectedIntegrity(filename) {
  const bytes = await readFile(join(distribution, filename));
  return "sha384-" + createHash("sha384").update(bytes).digest("base64");
}

test("generated integrity covers the orchestrator and built-in Extension assets", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    AelluxJs.ext("feedback");
    AelluxJs.ext("adaptive", { loadStyle: true });
    AelluxJs.init({ mode: "basic" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);
  await expect.poll(() => page.evaluate(() =>
    AelluxJs.ext.feedback?.initialized && AelluxJs.ext.adaptive?.initialized
  )).toBe(true);

  const assets = await page.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll("script[src], link[data-ae-ext-style]")]
      .filter(asset => /\/dist\/aellux\./.test(asset.src || asset.href))
      .map(asset => [new URL(asset.src || asset.href).pathname.split("/").pop(), {
        integrity: asset.getAttribute("integrity"),
        crossOrigin: asset.getAttribute("crossorigin")
      }])
  ));

  for (const filename of [
    "aellux.orchestrator.js",
    "aellux.ext.feedback.js",
    "aellux.ext.adaptive.js",
    "aellux.ext.adaptive.css"
  ]) {
    expect(assets[filename]).toEqual({
      integrity: await expectedIntegrity(filename),
      crossOrigin: "anonymous"
    });
  }
});

test("generated integrity matches each runtime variant", async ({ page }) => {
  for (const { boot, mode, forceLegacy, runtime } of [
    { boot: "aellux.js", mode: "basic", forceLegacy: true,
      runtime: "aellux.orchestrator.legacy.js" },
    { boot: "aellux.min.js", mode: "basic", forceLegacy: false,
      runtime: "aellux.orchestrator.min.js" },
    { boot: "aellux.js", mode: "full", forceLegacy: false,
      runtime: "aellux.full.js" },
    { boot: "aellux.min.js", mode: "full", forceLegacy: true,
      runtime: "aellux.full.legacy.min.js" }
  ]) {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: `/dist/${boot}` });
    await page.evaluate(options => AelluxJs.init(options), { mode, forceLegacy });
    const loaded = await page.locator(`script[src$="${runtime}"]`).getAttribute("integrity");
    expect(loaded).toBe(await expectedIntegrity(runtime));
    expect(await page.locator(`script[src$="${runtime}"]`).getAttribute("crossorigin"))
      .toBe("anonymous");
    await expect.poll(() => page.evaluate(() => typeof AelluxJs.wait))
      .toBe("function");
    expect(await page.evaluate(() => AelluxJs.diagnostics.legacy)).toBe(forceLegacy);
  }
});

test("changed orchestrator bytes are rejected before Legacy fallback", async ({ page }) => {
  await page.route("**/dist/aellux.orchestrator.js", route => route.fulfill({
    contentType: "text/javascript",
    body: "window.changedOrchestratorExecuted = true;"
  }));
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => typeof AelluxJs.wait)).toBe("function");
  expect(await page.evaluate(() => ({
    changedExecuted: Boolean(window.changedOrchestratorExecuted),
    legacy: AelluxJs.diagnostics.legacy
  }))).toEqual({ changedExecuted: false, legacy: true });
  expect(await page.locator('script[src$="aellux.orchestrator.legacy.js"]')
    .getAttribute("integrity"))
    .toBe(await expectedIntegrity("aellux.orchestrator.legacy.js"));
});

test("global crossorigin applies to orchestrator and can be overridden per Extension", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    AelluxJs.ext("feedback", { crossOrigin: "anonymous" });
    AelluxJs.init({ mode: "basic", crossOrigin: "use-credentials" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.feedback?.initialized))
    .toBe(true);
  expect(await page.locator('script[src$="aellux.orchestrator.js"]')
    .getAttribute("crossorigin")).toBe("use-credentials");
  expect(await page.locator('script[data-ae-ext="feedback"]')
    .getAttribute("crossorigin")).toBe("anonymous");
});

test("declared Extension integrity accepts matching bytes and rejects changed bytes", async ({ page }) => {
  const validSource = 'AelluxJs.extAttach("sri-valid", { init: function () {} });';
  const changedSource = 'AelluxJs.extAttach("sri-changed", { init: function () {} });';
  await page.route("**/aellux.ext.sri-valid.js", route => route.fulfill({
    contentType: "text/javascript", body: validSource
  }));
  await page.route("**/aellux.ext.sri-changed.js", route => route.fulfill({
    contentType: "text/javascript", body: changedSource
  }));
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const goodHash = "sha384-" + createHash("sha384").update(validSource).digest("base64");
  const result = await page.evaluate(async hash => {
    AelluxJs.ext("/virtual/aellux.ext.sri-valid.js", { integrity: { modern: hash } });
    AelluxJs.ext("/virtual/aellux.ext.sri-changed.js", { integrity: { modern: hash } });
    const valid = await AelluxJs.wait("sri-valid");
    const changed = await AelluxJs.wait("sri-changed");
    const validScript = document.querySelector('script[data-ae-ext="sri-valid"]');
    return {
      valid: valid?.initialized,
      changed,
      integrity: validScript?.getAttribute("integrity"),
      crossOrigin: validScript?.getAttribute("crossorigin")
    };
  }, goodHash);
  expect(result).toEqual({
    valid: true,
    changed: null,
    integrity: goodHash,
    crossOrigin: "anonymous"
  });
});

test("declared stylesheet integrity and crossorigin are applied independently", async ({ page }) => {
  const scriptSource = 'AelluxJs.extAttach("sri-style", { init: function () {} });';
  const styleSource = ".sri-style { display: block; }";
  await page.route("**/aellux.ext.sri-style.js", route => route.fulfill({
    contentType: "text/javascript", body: scriptSource
  }));
  await page.route("**/aellux.ext.sri-style.css", route => route.fulfill({
    contentType: "text/css", body: styleSource
  }));
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.supported)).toBe(true);

  const scriptHash = "sha384-" + createHash("sha384").update(scriptSource).digest("base64");
  const styleHash = "sha384-" + createHash("sha384").update(styleSource).digest("base64");
  const result = await page.evaluate(async hashes => {
    AelluxJs.ext("/virtual/aellux.ext.sri-style.js", {
      loadStyle: true,
      integrity: { modern: hashes.script, style: hashes.style },
      crossOrigin: "use-credentials"
    });
    const extension = await AelluxJs.wait("sri-style");
    const script = document.querySelector('script[data-ae-ext="sri-style"]');
    const style = document.querySelector('link[data-ae-ext-style="sri-style"]');
    return {
      initialized: extension?.initialized,
      script: [script?.getAttribute("integrity"), script?.getAttribute("crossorigin")],
      style: [style?.getAttribute("integrity"), style?.getAttribute("crossorigin")]
    };
  }, { script: scriptHash, style: styleHash });
  expect(result).toEqual({
    initialized: true,
    script: [scriptHash, "use-credentials"],
    style: [styleHash, "use-credentials"]
  });
});
