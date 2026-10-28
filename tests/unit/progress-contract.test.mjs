import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { hasProgressAPI } from "../../src/internal/has-progress-api.js";
import { semanticEvents, semanticAttributes, semanticMethods } from "../../scripts/semantic-definitions.mjs";

test("Progress variants share the main body and enable fallbacks only in Legacy", async () => {
  for (const variant of ["", ".min", ".legacy", ".legacy.min"]) {
    const map = JSON.parse(await readFile(new URL(`../../dist/aellux.ext.progress${variant}.js.map`, import.meta.url), "utf8"));
    assert.ok(map.sources.some(source => source.endsWith("aellux.ext.progress.js")), variant);
    const script = await readFile(new URL(`../../dist/aellux.ext.progress${variant}.js`, import.meta.url), "utf8");
    // Unminified maps can retain license-only references to tree-shaken modules.
    assert.equal(/["']progress-fallback["']/.test(script),
      variant.includes("legacy"), variant);
  }
});

test("Progress catalog keeps the generic event independent and the consumer progress-only", () => {
  const event = semanticEvents.find(e => e.name === "Progress");
  assert.equal(event.extension, "core");
  assert.equal(event.bubbles, false);
  assert.equal(event.cancelable, false);
  assert.deepEqual(semanticAttributes.find(a => a.name === "progress-target").tags, ["progress"]);
  assert.ok(semanticMethods.some(m => m.name === "present.popNext"));
});

test("capability detection tolerates missing/throwing constructors and incomplete numeric APIs", () => {
  for (const tag of ["progress", "meter"]) {
    assert.equal(hasProgressAPI({}, tag), false);
    const root = { HTMLProgressElement() {}, HTMLMeterElement() {}, document: {
      createElement() { return { value: 0, max: 1, position: -1, min: 0, low: 0, high: 1, optimum: .5,
        setAttribute() {}, removeAttribute() {} }; }
    } };
    assert.equal(hasProgressAPI(root, tag), false, "presence alone is insufficient without reflection");
    root.document.createElement = () => { throw new Error("unsupported"); };
    assert.equal(hasProgressAPI(root, tag), false);
  }
});
