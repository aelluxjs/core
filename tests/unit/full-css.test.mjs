import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { officialExtensionDefinitions } from "../../src/official-extension-definitions.js";

test("Full CSS includes global defaults and only Bundled Extension stylesheets", async () => {
  const dist = new URL("../../dist/", import.meta.url);
  const css = await readFile(new URL("aellux.full.css", dist), "utf8");
  for (const { name, style, optional } of officialExtensionDefinitions) {
    if (!style) continue;
    const filename = `aellux.ext.${name}.css`;
    assert.equal(css.includes((await readFile(new URL(filename, dist), "utf8")).trim()), !optional, filename);
  }
  assert.match(css, /data-ae-wait-mounted/);
  assert.match(css, /color-scheme:light dark/);
  assert.doesNotMatch(css, /\[\?[a-z]/);
});
