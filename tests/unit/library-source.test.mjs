import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { runInNewContext, Script } from "node:vm";
import test from "node:test";

const window = {};
runInNewContext(await readFile(new URL("../../home/library/assets/snippets.js", import.meta.url), "utf8"), { window });
const source = window.librarySource;

test("Library preserves stored snippet IDs and declares executable component fragments", () => {
  assert.equal(source.categories.length, 7);
  assert.equal(source.snippets.length, 17);
  const ids = new Set(source.snippets.map(snippet => snippet.id));
  assert.equal(ids.size, source.snippets.length);
  for (const id of ["hello-present", "little-tabs", "responsive-sidebar", "slow-scroll", "in-view", "your-theme", "next-focus"]) assert.ok(ids.has(id));
  for (const snippet of source.snippets) {
    assert.ok(source.categories.some(category => category.id === snippet.category), snippet.id);
    assert.ok(Array.isArray(snippet.dependencies) && Array.isArray(snippet.features), snippet.id);
    assert.doesNotMatch(snippet.code, /<!doctype|<(?:html|head|body)(?:\s|>)|\$ae\.(?:init|ext)\(/i);
    for (const [, code] of snippet.code.matchAll(/<script>([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => new Script(code), snippet.id);
  }
  assert.deepEqual(Array.from(source.snippets.find(snippet => snippet.id === "responsive-split-hero").extensions), []);
});

test("Library offline cache includes every declared extension, stylesheet and input adapter", async () => {
  const scope = "https://library.test/home/library/";
  const worker = await readFile(new URL("../../home/library/sw.js", import.meta.url), "utf8");
  const urls = runInNewContext(worker + "\nPRECACHE", { URL, self: { registration: { scope }, addEventListener() {} } });
  const paths = new Set(urls.map(url => new URL(url).pathname));
  for (const snippet of source.snippets) {
    for (const extension of snippet.extensions) {
      assert.ok(paths.has(`/dist/aellux.ext.${extension}.min.js`), `${snippet.id}: ${extension}`);
      const stylesheet = new URL(`../../dist/aellux.ext.${extension}.min.css`, import.meta.url);
      try { await access(stylesheet); } catch { continue; }
      assert.ok(paths.has(`/dist/aellux.ext.${extension}.min.css`), `${snippet.id}: stylesheet ${extension}`);
    }
  }
  for (const adapter of ["point", "keyboard"]) assert.ok(paths.has(`/dist/aellux.input.${adapter}.min.js`));
  for (const path of paths) await access(new URL(`../..${path}`, import.meta.url));
});
