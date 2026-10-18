import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { officialExtensionDefinitions } from "../../src/official-extension-definitions.js";
import {
  createOfficialExtensionManifest,
  validateOfficialExtensionManifest
} from "../../scripts/extension-manifest.mjs";

const version = "1.2.3";
const sri = "sha384-" + createHash("sha384").update("artifact").digest("base64");

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
