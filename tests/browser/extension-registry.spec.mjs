import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

async function startBasic(page, options = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => AelluxJs.init({ mode: "basic", skipGlobalMount: true, ...options }), options);
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
}

test("official manifest is fetched lazily once and supplies integrity metadata", async ({ page }) => {
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
  expect(manifestRequests).toBe(1);
  expect(result.preference.official).toBe(true);
  expect(result.preference.artifacts.modern.integrity).toMatch(/^sha384-/);
  expect(result.point.coreCompatibility).toBe("0.1.0-beta.10");
});

test("full uses embedded official metadata without a manifest or extension download", async ({ page }) => {
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
