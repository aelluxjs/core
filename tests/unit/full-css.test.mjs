import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("Full CSS includes the global defaults and every generated Extension stylesheet", async () => {
  const dist = new URL("../../dist/", import.meta.url);
  const css = await readFile(new URL("aellux.full.css", dist), "utf8");
  const extensions = (await readdir(dist)).filter(name => /^aellux\.ext\..+(?<!\.min)\.css$/.test(name));
  assert.ok(extensions.length >= 6);
  for (const filename of extensions) {
    assert.ok(css.includes((await readFile(new URL(filename, dist), "utf8")).trim()), filename);
  }
  assert.match(css, /data-ae-wait-mounted/);
  assert.match(css, /color-scheme:light dark/);
  assert.doesNotMatch(css, /\[\?[a-z]/);
});
