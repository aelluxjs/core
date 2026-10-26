import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { officialExtensionDefinitions } from "../../src/official-extension-definitions.js";
import {
  createOfficialExtensionManifest,
  validateOfficialExtensionManifest
} from "../../scripts/extension-manifest.mjs";

const version = "1.2.3";
const sri = "sha384-" + createHash("sha384").update("artifact").digest("base64");

test("Bundled and Optional documentation groups match the Full distribution", async () => {
  const { summary } = JSON.parse(await readFile(new URL("../../docs-source/0.1.x/summary.json", import.meta.url), "utf8"));
  const core = summary.find(group => group.slug === "core-extensions");
  for (const [slug, label, optional] of [["bundled", "Bundled Extensions", false], ["optional", "Optional Extensions", true]]) {
    const group = core.children.find(group => group.slug === slug);
    assert.equal(group.label, label);
    assert.deepEqual(group.children.map(entry => entry.href.split("/").pop().replace(/\.md$/, "")).sort(),
      officialExtensionDefinitions.filter(entry => !!entry.optional === optional).map(entry => entry.name).sort());
    for (const entry of group.children) {
      assert.equal(entry.href.startsWith("core-extensions/optional/"), optional, entry.href);
      await readFile(new URL(`../../docs-source/0.1.x/${entry.href}`, import.meta.url), "utf8");
    }
  }
});

test("Full artifacts include Bundled Extensions and Basic bundles none", async () => {
  const bundled = officialExtensionDefinitions.filter(entry => !entry.optional).map(entry => entry.name).sort();
  for (const variant of ["", ".min", ".legacy", ".legacy.min"]) {
    for (const runtime of ["full", "orchestrator"]) {
      const map = JSON.parse(await readFile(new URL(`../../dist/aellux.${runtime}${variant}.js.map`, import.meta.url), "utf8"));
      const implementations = map.sources.map(source => source.match(/aellux\.ext\.([\w-]+)\.js$/)?.[1]).filter(Boolean).sort();
      assert.deepEqual(implementations, runtime === "full" ? bundled : [], `${runtime}${variant}`);
    }
  }
});

function integrities() {
  const result = { regular: {}, minified: {} };
  for (const extension of officialExtensionDefinitions) {
    result.minified[`aellux.ext.${extension.name}.min.js`] = sri;
    result.minified[`aellux.ext.${extension.name}.legacy.min.js`] = sri;
    result.regular[`aellux.ext.${extension.name}.js`] = sri;
    result.regular[`aellux.ext.${extension.name}.legacy.js`] = sri;
    if (extension.style) {
      result.minified[`aellux.ext.${extension.name}.min.css`] = sri;
      result.regular[`aellux.ext.${extension.name}.css`] = sri;
    }
  }
  return result;
}

test("official manifest contains only the explicit approved list and final SRI", () => {
  const { manifest, report } = createOfficialExtensionManifest({
    version,
    definitions: officialExtensionDefinitions,
    integrity: integrities(),
    cdnBase: "https://cdn.example.test/aellux"
  });
  assert.equal(manifest.coreVersion, version);
  assert.deepEqual(Object.keys(manifest.extensions),
    officialExtensionDefinitions.map(extension => extension.name));
  assert.equal(manifest.extensions.scrollbox.builds.modern.integrity, sri);
  assert.match(manifest.extensions.scrollbox.builds.modern.url,
    /\/1\.2\.3\/aellux\.ext\.scrollbox\.min\.js$/);
  assert.equal(report.every(extension => extension.status === "valid"), true);
  assert.equal(JSON.stringify(manifest).includes("\n"), false);
});

test("official manifest validation rejects incomplete compatibility and artifacts", () => {
  assert.throws(() => validateOfficialExtensionManifest({
    schemaVersion: 1,
    coreVersion: version,
    extensions: { bad: { builds: {} } }
  }), /Invalid official extension metadata/);
  assert.throws(() => createOfficialExtensionManifest({
    version,
    definitions: officialExtensionDefinitions,
    integrity: {},
    cdnBase: "https://cdn.example.test"
  }), /artifact is missing/);
  assert.throws(() => createOfficialExtensionManifest({
    version,
    definitions: officialExtensionDefinitions,
    integrity: integrities(),
    cdnBase: "http://cdn.example.test"
  }), /must use HTTPS/);
  assert.throws(() => createOfficialExtensionManifest({
    version,
    definitions: [{ name: "bad-dependency", style: false, dependencies: [{
      label: "remote", url: "https://cdn.example.test/remote.js"
    }] }],
    integrity: integrities()
  }), /Invalid dependency metadata/);
});
