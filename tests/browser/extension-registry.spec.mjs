import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

async function startBasic(page, options = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => AelluxJs.init({ mode: "basic", skipGlobalMount: true, ...options }), options);
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
}

test("basic uses the embedded official manifest and supplies integrity metadata", async ({ page }) => {
  let manifestRequests = 0;
  page.on("request", request => {
    if (request.url().endsWith("/dist/aellux.extensions.min.json")) manifestRequests++;
  });
  await startBasic(page);
  expect(manifestRequests).toBe(0);
  const result = await page.evaluate(async () => {
    AelluxJs.ext("preference");
    AelluxJs.ext("point");
    await Promise.all([AelluxJs.wait("preference"), AelluxJs.wait("point")]);
    return {
      preference: AelluxJs.registry.ext.preference,
      point: AelluxJs.registry.ext.point
    };
  });
  expect(manifestRequests).toBe(0);
  expect(result.preference.official).toBe(true);
  expect(result.preference.artifacts.modern.integrity).toMatch(/^sha384-/);
  expect(result.point.coreCompatibility).toBe("0.1.0-beta.10");
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
  await page.evaluate(() => AelluxJs.init({ mode: "full", skipGlobalMount: true }));
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  expect(await page.evaluate(async () => !!(await AelluxJs.wait("present")))).toBe(true);
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
  await page.evaluate(() => AelluxJs.init({ mode: "full", skipGlobalMount: true }));
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");

  const artifact = await page.evaluate(async () => {
    await AelluxJs.wait("scrollbox");
    return AelluxJs.registry.ext.scrollbox.artifacts.modern;
  });

  expect(manifestRequests).toBe(0);
  expect(artifact.url).toMatch(/aellux\.ext\.scrollbox\.min\.js$/);
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
    AelluxJs.ext("scrollbox-snap");
    await AelluxJs.wait("scrollbox-snap");
    await AelluxJs.mountManager.mount(document.body);
    const controller = AelluxJs.mountManager.controller("gallery").scrollbox;
    return {
      scrollbox: AelluxJs.ext.scrollbox?.initialized,
      snap: AelluxJs.ext.scrollboxSnap?.initialized,
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
      await page.evaluate(forceLegacy => AelluxJs.init({
        mode: "full", forceLegacy, skipGlobalMount: true
      }), forceLegacy);
      await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion))
        .toBe("0.1.0-beta.10");
      const result = await page.evaluate(async () => {
        document.body.innerHTML = `<div id="gallery" data-ae-scrollbox data-ae-scrollbox-snap
          style="width:100px;height:100px;overflow-x:auto;display:flex">
          <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
          <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
        </div>`;
        await AelluxJs.mountManager.mount(document.body);
        return {
          base: AelluxJs.ext.scrollbox?.initialized,
          snap: AelluxJs.ext.scrollboxSnap?.initialized,
          navigated: AelluxJs.mountManager.controller("gallery").scrollbox.goto(1),
          legacy: AelluxJs.diagnostics.legacy
        };
      });
      expect(result).toEqual({ base: true, snap: true, navigated: true, legacy: forceLegacy });
      const variant = `${forceLegacy ? ".legacy" : ""}${boot === "aellux.min.js" ? ".min" : ""}.js`;
      expect(requests.filter(file => /^aellux\.ext\.scrollbox(?:-snap)?(?:\.legacy)?(?:\.min)?\.js$/.test(file)).sort())
        .toEqual([`aellux.ext.scrollbox${variant}`, `aellux.ext.scrollbox-snap${variant}`].sort());
      expect(requests).not.toContain("aellux.extensions.min.json");
    });
  }
}

test("the official manifest selects the Legacy artifact for a Legacy runtime", async ({ page }) => {
  await startBasic(page, { forceLegacy: true });
  const artifact = await page.evaluate(async () => {
    AelluxJs.ext("point");
    await AelluxJs.wait("point");
    return AelluxJs.registry.ext.point.artifacts.legacy;
  });
  // The non-minified boot script selects the matching non-minified Legacy
  // artifact; only a .min boot script selects the .legacy.min variant.
  expect(artifact.url).toMatch(/aellux\.ext\.point\.legacy\.js$/);
  expect(artifact.integrity).toMatch(/^sha384-/);
});

test("a Bootscript and Orchestrator version mismatch blocks startup", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => { AelluxJs.version = "99.0.0"; });
  await page.addScriptTag({ url: "/dist/aellux.orchestrator.js" });
  const result = await page.evaluate(async () => {
    let blocked = false;
    try { await AelluxJs.startAelluxJs(); }
    catch (_) { blocked = true; }
    return {
      blocked,
      version: AelluxJs.orchestratorVersion,
      codes: AelluxJs.diagnostics.showHistory(10).map(entry => entry.code)
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
      AelluxJs.ext(`/virtual/aellux.ext.${name}.js`, {
        coreCompatibility: compatibility,
        skipCompatibilityCheck: skip
      });
      AelluxJs.extAttach(name, { init() {} });
    }
    attach("compatible-test", AelluxJs.version, false);
    attach("incompatible-test", "99.0.0", false);
    attach("forced-test", "99.0.0", true);
    attach("unspecified-test", undefined, false);
    const values = await Promise.all([
      AelluxJs.wait("compatible-test"),
      AelluxJs.wait("incompatible-test"),
      AelluxJs.wait("forced-test"),
      AelluxJs.wait("unspecified-test")
    ]);
    return {
      initialized: values.map(Boolean),
      codes: AelluxJs.diagnostics.showHistory(30).map(entry => entry.code)
    };
  });
  expect(result.initialized).toEqual([true, false, true, true]);
  expect(result.codes).toContain(1123);
  expect(result.codes).toContain(2018);
});

test("development enables info unless verboseLevel is explicitly overridden", async ({ page }) => {
  await startBasic(page, { environment: "development" });
  expect(await page.evaluate(() => AelluxJs.diagnostics.verboseLevel)).toBe(2);

  await page.reload();
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({
    mode: "basic", skipGlobalMount: true, environment: "development", verboseLevel: 0
  }));
  expect(await page.evaluate(() => AelluxJs.diagnostics.verboseLevel)).toBe(0);
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
    AelluxJs.extIndex.setFallback("/invalid-index.json");
    AelluxJs.ext("point");
    const official = await AelluxJs.wait("point");
    AelluxJs.ext("missing-from-both-indexes");
    const missing = await AelluxJs.wait("missing-from-both-indexes");
    return {
      official: !!official,
      missing: !!missing,
      codes: AelluxJs.diagnostics.showHistory(50).map(entry => entry.code)
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
    AelluxJs.extIndex.setFallback("/bad-integrity-index.json");
    AelluxJs.ext("bad-integrity");
    return !!(await AelluxJs.wait("bad-integrity"));
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
    AelluxJs.extIndex.setFallback("/bad-dependency-index.json");
    AelluxJs.ext("bad-dependency");
    return {
      loaded: !!(await AelluxJs.wait("bad-dependency")),
      codes: AelluxJs.diagnostics.showHistory(30).map(entry => entry.code)
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
    AelluxJs.extIndex.setFallback("/custom-index.json");
    AelluxJs.ext("private-test");
    const extension = await AelluxJs.wait("private-test");
    return extension && extension.loaded;
  });
  expect(loaded).toBe(true);
  expect(customRequests).toBe(1);
});
