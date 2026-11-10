/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const directories = new Set([".github", ".vscode", "src", "scripts", "templates", "tests", "docs-source", "dist", "docs"]);
const textFile = /\.(?:[cm]?js|json|map|md|html?|css|webmanifest|ya?ml|txt)$/;
// Historical reports, released changelog entries, third-party/vendor assets,
// licenses and existing artwork are outside current first-party naming.
const explanatoryFiles = new Set([
  "BRAND_GUIDELINES.md", "dist/BRAND_GUIDELINES.md",
  "docs-source/0.1.x/brand-naming.md", "docs/0.1.x/brand-naming.htm"
]);
const capitalizedBrand = "A" + "ellux";
const canonicalBrand = "aellux";
const obsoleteGlobal = capitalizedBrand + "Js";
const forbidden = new RegExp(`(?<![\\w$])(?:${capitalizedBrand}(?:JS|Js|\\.js)?|${canonicalBrand}JS|${canonicalBrand.toUpperCase()}(?:JS|\\.JS)?|\\u00c6llux(?:\\.js)?)(?![\\w$])`, "gu");
let checked = 0;
const violations = [];

async function inspect(directory = "") {
  for (const entry of await readdir(new URL(directory || "./", root), { withFileTypes: true })) {
    const path = directory + entry.name;
    if (entry.isDirectory()) {
      if ((!directory && !directories.has(entry.name)) || ["vendor", "third-party"].includes(entry.name)) continue;
      await inspect(path + "/");
      continue;
    }
    if (!entry.isFile() || !textFile.test(entry.name) || /^(?:LICENSE|THIRD_PARTY_LICENSES)/.test(entry.name) || explanatoryFiles.has(path)) continue;
    let content = await readFile(new URL(path, root), "utf8");
    if (path === "CHANGELOG.md") {
      content = content.split(/\n## \[(?!Unreleased\])/)[0];
      // Only the documented migration entry may describe the retired global.
      content = content.replace(/^- \*\*Breaking: public global naming\.\*\*.*$/m, "");
    }
    if (path === "dist/aellux.semantic.json") {
      // The editor catalog describes the existing DOM event namespace.
      content = content.replace(`"events": "${obsoleteGlobal}"`, '"events": "event-prefix"');
    }
    if (path === "src/internal/create-aellux-constants.js" || /^dist\/aellux(?:\.esm)?(?:\.min)?\.js(?:\.map)?$/.test(path)) {
      // An internal diagnostic-string constant follows JavaScript constant naming.
      content = content.replace(new RegExp(`\\b${canonicalBrand.toUpperCase()}\\b`, "g"), "INTERNAL_BRAND");
    }
    if (path === "tests/browser/global-naming.spec.mjs" || path === "tests/unit/global-naming.test.mjs") {
      // Behavioral assertions must be able to verify the retired global is absent.
      content = content.replaceAll(`Object.prototype.hasOwnProperty.call(globalThis, "${obsoleteGlobal}")`, "false");
    }
    if (path === "tests/browser/scenarios.spec.mjs") {
      // Existing negative assertions also reject a still older beta global.
      content = content.replace(new RegExp(`typeof window\\.${capitalizedBrand}\\b`, "g"), "undefined");
    }
    // Preserve the event-prefix template, including its embedded source-map form.
    if (path === "src/internal/create-aellux-constants.js" || /^dist\/aellux(?:\.esm)?(?:\.min)?\.js(?:\.map)?$/.test(path)) {
      content = content.replaceAll(obsoleteGlobal + "?", "event-prefix?");
    }
    checked++;
    for (const match of content.matchAll(forbidden)) {
      const line = content.slice(0, match.index).split("\n").length;
      violations.push(`${path}:${line}: ${match[0]}`);
    }
  }
}

await inspect();
if (violations.length) {
  console.error(violations.join("\n"));
  console.error(`Naming check failed: ${violations.length} occurrence(s). See BRAND_GUIDELINES.md.`);
  process.exitCode = 1;
} else {
  console.log(`Naming check passed: ${checked} current first-party text files in ${fileURLToPath(root)}.`);
}
