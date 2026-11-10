import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

async function startBasic(page, options = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => aelluxJs.init({ mode: "basic", skipGlobalMount: true, ...options }), options);
  await expect.poll(() => page.evaluate(() => aelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
}

test("basic uses the embedded official manifest and supplies integrity metadata", async ({ page }) => {
  let manifestRequests = 0;
  page.on("request", request => {
    if (request.url().endsWith("/dist/aellux.extensions.min.json")) manifestRequests++;
  });
  await startBasic(page);
  expect(manifestRequests).toBe(0);
  const result = await page.evaluate(async () => {
    aelluxJs.ext("preference");
    aelluxJs.ext("input");
    await Promise.all([aelluxJs.wait("preference"), aelluxJs.wait("input")]);
    return {
      preference: aelluxJs.registry.ext.preference,
      input: aelluxJs.registry.ext.input
    };
  });
  expect(manifestRequests).toBe(0);
  expect(result.preference.official).toBe(true);
  expect(result.preference.artifacts.modern.integrity).toMatch(/^sha384-/);
  expect(result.input.coreCompatibility).toBe("0.1.0-beta.10");
});

test("full initializes a lazy bundled extension on demand without a network request", async ({ page }) => {
  let manifestRequests = 0;
  let extensionRequests = 0;
  page.on("request", request => {
    if (request.url().endsWith("/dist/aellux.extensions.min.json")) manifestRequests++;
    if (/\/dist\/aellux\.ext\.present(?:\.legacy)?(?:\.min)?\.js$/.test(request.url()))
      extensionRequests++;
  });
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full", skipGlobalMount: true }));
  await expect.poll(() => page.evaluate(() => aelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  expect(await page.evaluate(async () => !!(await aelluxJs.wait("present")))).toBe(true);
  expect(manifestRequests).toBe(0);
  expect(extensionRequests).toBe(0);
});

test("full resolves an unbundled official extension from its manifest", async ({ page }) => {
  let manifestRequests = 0;
  page.on("request", request => {
    if (request.url().endsWith("/dist/aellux.extensions.min.json")) manifestRequests++;
  });
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.min.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "full", skipGlobalMount: true }));
  await expect.poll(() => page.evaluate(() => aelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");

  const artifact = await page.evaluate(async () => {
    await aelluxJs.wait("ajax-href");
    return aelluxJs.registry.ext.ajaxHref.artifacts.modern;
  });

  expect(manifestRequests).toBe(0);
  expect(artifact.url).toMatch(/aellux\.ext\.ajax-href\.min\.js$/);
  expect(artifact.integrity).toMatch(/^sha384-/);
});

test("scrollbox-snap registers and awaits Scrollbox before mounting", async ({ page }) => {
  await startBasic(page);
  const result = await page.evaluate(async () => {
    document.body.innerHTML = `<div id="gallery" data-ae-scrollbox data-ae-scrollbox-snap
      style="width:100px;height:100px;overflow:auto"><div style="display:flex;width:300px">
      <div data-ae-snap-item style="width:100px;flex:none"></div>
      <div data-ae-snap-item style="width:100px;flex:none"></div>
      <div data-ae-snap-item style="width:100px;flex:none"></div>
    </div></div>`;
    aelluxJs.ext("scrollbox-snap");
    await aelluxJs.wait("scrollbox-snap");
    await aelluxJs.mountManager.mount(document.body);
    const controller = aelluxJs.mountManager.controller("gallery").scrollbox;
    return {
      scrollbox: aelluxJs.ext.scrollbox?.initialized,
      snap: aelluxJs.ext.scrollboxSnap?.initialized,
      mounted: !!controller,
      navigated: controller.goto(1)
    };
  });
  expect(result).toEqual({ scrollbox: true, snap: true, mounted: true, navigated: true });
});

for (const boot of ["aellux.js", "aellux.min.js"]) {
  for (const forceLegacy of [false, true]) {
    test(`full ${boot} loads Snap and Scrollbox on demand with forceLegacy=${forceLegacy}`, async ({ page }) => {
      const requests = [];
      page.on("request", request => requests.push(new URL(request.url()).pathname.split("/").pop()));
      await page.goto("/tests/index.htm");
      await page.addScriptTag({ url: `/dist/${boot}` });
      await page.evaluate(forceLegacy => aelluxJs.init({
        mode: "full", forceLegacy, skipGlobalMount: true
      }), forceLegacy);
      await expect.poll(() => page.evaluate(() => aelluxJs.orchestratorVersion))
        .toBe("0.1.0-beta.10");
      const result = await page.evaluate(async () => {
        document.body.innerHTML = `<div id="gallery" data-ae-scrollbox data-ae-scrollbox-snap
          style="width:100px;height:100px;overflow-x:auto;display:flex">
          <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
          <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
        </div>`;
        await aelluxJs.mountManager.mount(document.body);
        return {
          base: aelluxJs.ext.scrollbox?.initialized,
          snap: aelluxJs.ext.scrollboxSnap?.initialized,
          navigated: aelluxJs.mountManager.controller("gallery").scrollbox.goto(1),
          legacy: aelluxJs.diagnostics.legacy
        };
      });
      expect(result).toEqual({ base: true, snap: true, navigated: true, legacy: forceLegacy });
      expect(requests.filter(file => /^aellux\.ext\.scrollbox(?:-snap)?(?:\.legacy)?(?:\.min)?\.js$/.test(file)).sort())
        .toEqual([`aellux.ext.scrollbox-snap${forceLegacy ? ".legacy" : ""}${boot.includes(".min.") ? ".min" : ""}.js`]);
      expect(requests).not.toContain("aellux.extensions.min.json");
    });
  }
}

test("the official manifest selects the Legacy artifact for a Legacy runtime", async ({ page }) => {
  await startBasic(page, { forceLegacy: true });
  const artifact = await page.evaluate(async () => {
    aelluxJs.ext("input");
    await aelluxJs.wait("input");
    return aelluxJs.registry.ext.input.artifacts.legacy;
  });
  // The non-minified boot script selects the matching non-minified Legacy
  // artifact; only a .min boot script selects the .legacy.min variant.
  expect(artifact.url).toMatch(/aellux\.ext\.input\.legacy\.js$/);
  expect(artifact.integrity).toMatch(/^sha384-/);
});

test("a Bootscript and Orchestrator version mismatch blocks startup", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => { aelluxJs.version = "99.0.0"; });
  await page.addScriptTag({ url: "/dist/aellux.orchestrator.js" });
  const result = await page.evaluate(async () => {
    let blocked = false;
    try { await aelluxJs.startAelluxJs(); }
    catch (_) { blocked = true; }
    return {
      blocked,
      version: aelluxJs.orchestratorVersion,
      codes: aelluxJs.diagnostics.showHistory(10).map(entry => entry.code)
    };
  });
  expect(result.blocked).toBe(true);
  expect(result.version).toBe("0.1.0-beta.10");
  expect(result.codes).toContain(1124);
});

test("extension compatibility blocks by default and explicit skip emits warn", async ({ page }) => {
  await startBasic(page, { verboseLevel: 2 });
  const result = await page.evaluate(async () => {
    function attach(name, compatibility, skip) {
      aelluxJs.ext(`/virtual/aellux.ext.${name}.js`, {
        coreCompatibility: compatibility,
        skipCompatibilityCheck: skip
      });
      aelluxJs.extAttach(name, { init() {} });
    }
    attach("compatible-test", aelluxJs.version, false);
    attach("incompatible-test", "99.0.0", false);
    attach("forced-test", "99.0.0", true);
    attach("unspecified-test", undefined, false);
    const values = await Promise.all([
      aelluxJs.wait("compatible-test"),
      aelluxJs.wait("incompatible-test"),
      aelluxJs.wait("forced-test"),
      aelluxJs.wait("unspecified-test")
    ]);
    return {
      initialized: values.map(Boolean),
      codes: aelluxJs.diagnostics.showHistory(30).map(entry => entry.code)
    };
  });
  expect(result.initialized).toEqual([true, false, true, true]);
  expect(result.codes).toContain(1123);
  expect(result.codes).toContain(2018);
});

test("development enables info unless verboseLevel is explicitly overridden", async ({ page }) => {
  await startBasic(page, { environment: "development" });
  expect(await page.evaluate(() => aelluxJs.diagnostics.verboseLevel)).toBe(2);

  await page.reload();
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({
    mode: "basic", skipGlobalMount: true, environment: "development", verboseLevel: 0
  }));
  expect(await page.evaluate(() => aelluxJs.diagnostics.verboseLevel)).toBe(0);
});

test("official entries win over a custom fallback and invalid fallback data is diagnosed", async ({ page }) => {
  let customRequests = 0;
  await page.route("**/invalid-index.json", async route => {
    customRequests++;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({
      schemaVersion: 1, coreVersion: "0.1.0-beta.10", extensions: {
        malformed: { builds: {} }
      }
    }) });
  });
  await startBasic(page, { environment: "development", verboseLevel: 2 });
  const result = await page.evaluate(async () => {
    aelluxJs.extIndex.setFallback("/invalid-index.json");
    aelluxJs.ext("input");
    const official = await aelluxJs.wait("input");
    aelluxJs.ext("missing-from-both-indexes");
    const missing = await aelluxJs.wait("missing-from-both-indexes");
    return {
      official: !!official,
      missing: !!missing,
      codes: aelluxJs.diagnostics.showHistory(50).map(entry => entry.code)
    };
  });
  expect(result.official).toBe(true);
  expect(result.missing).toBe(false);
  expect(customRequests).toBe(1);
  expect(result.codes).toContain(1126);
});

test("a custom manifest cannot bypass an invalid resource integrity hash", async ({ page }) => {
  const invalidIntegrity = "sha384-" + "A".repeat(64);
  await page.route("**/bad-integrity-index.json", async route => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({
      schemaVersion: 1,
      coreVersion: "0.1.0-beta.10",
      extensions: {
        "bad-integrity": {
          coreCompatibility: "0.1.0-beta.10",
          builds: {
            modern: { url: "/tests/browser/aellux.ext.private-test.js", integrity: invalidIntegrity },
            legacy: { url: "/tests/browser/aellux.ext.private-test.js", integrity: invalidIntegrity }
          },
          dependencies: []
        }
      }
    }) });
  });
  await startBasic(page, { environment: "development" });
  const loaded = await page.evaluate(async () => {
    aelluxJs.extIndex.setFallback("/bad-integrity-index.json");
    aelluxJs.ext("bad-integrity");
    return !!(await aelluxJs.wait("bad-integrity"));
  });
  expect(loaded).toBe(false);
});

test("a custom manifest rejects malformed remote dependency metadata", async ({ page }) => {
  await page.route("**/bad-dependency-index.json", async route => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({
      schemaVersion: 1,
      coreVersion: "0.1.0-beta.10",
      extensions: {
        "bad-dependency": {
          coreCompatibility: "0.1.0-beta.10",
          builds: {
            modern: { url: "/tests/browser/aellux.ext.private-test.js", integrity: "sha384-" + "A".repeat(64) },
            legacy: { url: "/tests/browser/aellux.ext.private-test.js", integrity: "sha384-" + "A".repeat(64) }
          },
          dependencies: [{ label: "remote-without-sri", url: "/tests/browser/aellux.ext.private-test.js" }]
        }
      }
    }) });
  });
  await startBasic(page, { environment: "development", verboseLevel: 2 });
  const result = await page.evaluate(async () => {
    aelluxJs.extIndex.setFallback("/bad-dependency-index.json");
    aelluxJs.ext("bad-dependency");
    return {
      loaded: !!(await aelluxJs.wait("bad-dependency")),
      codes: aelluxJs.diagnostics.showHistory(30).map(entry => entry.code)
    };
  });
  expect(result.loaded).toBe(false);
  expect(result.codes).toContain(1126);
});

test("custom manifest resolves only after an official miss", async ({ page }) => {
  const body = await readFile("tests/browser/aellux.ext.private-test.js");
  const integrity = "sha384-" + createHash("sha384").update(body).digest("base64");
  let customRequests = 0;
  await page.route("**/custom-index.json", async route => {
    customRequests++;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({
      schemaVersion: 1,
      coreVersion: "0.1.0-beta.10",
      extensions: {
        "private-test": {
          coreCompatibility: "0.1.0-beta.10",
          builds: {
            modern: { url: "/tests/browser/aellux.ext.private-test.js", integrity },
            legacy: { url: "/tests/browser/aellux.ext.private-test.js", integrity }
          },
          dependencies: []
        }
      }
    }) });
  });
  await startBasic(page, { environment: "development" });
  const loaded = await page.evaluate(async () => {
    aelluxJs.extIndex.setFallback("/custom-index.json");
    aelluxJs.ext("private-test");
    const extension = await aelluxJs.wait("private-test");
    return extension && extension.loaded;
  });
  expect(loaded).toBe(true);
  expect(customRequests).toBe(1);
});
