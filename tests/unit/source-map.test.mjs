import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSourceMapText } from "../../scripts/normalize-source-map.mjs";

for (const indentation of [2, undefined]) {
  test(`source map normalization preserves replacement tokens (indent=${indentation})`, () => {
    const source = "const regex = /]+$'/;\r\nconst tokens = \"$& $` $$\";\r";
    const input = { version: 3, sources: ["example.js"], sourcesContent: [source], mappings: "AAAA" };
    const normalized = normalizeSourceMapText(JSON.stringify(input, null, indentation));
    assert.deepEqual(JSON.parse(normalized), { ...input, sourcesContent: [source.replace(/\r\n?/g, "\n")] });
    assert.equal(normalizeSourceMapText(normalized), normalized);
  });
}
