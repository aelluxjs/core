import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Validator } from "jsonschema";
import { createSemanticCatalog, renderEditorData, editorDataFiles } from "../../scripts/build-editor-data.mjs";
import { createAelluxConstants } from "../../src/internal/create-aellux-constants.js";

const root = new URL("../../", import.meta.url);
const metadata = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const catalog = await createSemanticCatalog(metadata);
const output = renderEditorData(catalog);
const find = (entries, name) => entries.find(entry => entry.name === name);

for (const [name, schemaName] of [["aellux.html-data.json", "html"], ["aellux.css-data.json", "css"], ["aellux.web-types.json", "web-types"]]) {
  test(`${name} validates against the official ${schemaName} schema`, async () => {
    const schema = JSON.parse(await readFile(new URL(`tests/fixtures/editor-schemas/${schemaName}.schema.json`, root), "utf8"));
    const result = new Validator().validate(output[name], schema);
    assert.equal(result.valid, true, result.errors.map(error => error.stack).join("\n"));
    // Demonstrate that schema validation is meaningful, not only JSON parsing.
    const invalid = structuredClone(output[name]);
    if (schemaName === "web-types") delete invalid.name;
    else invalid.version = "1.1";
    assert.equal(new Validator().validate(invalid, schema).valid, false);
  });
}

test("open attribute grammars remain open while closed enums preserve string values", () => {
  const attributes = output["aellux.web-types.json"].contributions.html.attributes;
  assert.equal(find(attributes, "data-ae-trigger").value.type, '\"\" | \"toggle\" | \"pop\" | \"unpop\"');
  assert.equal(find(attributes, "data-ae-target").value.type, "string");
  assert.equal(find(attributes, "data-ae-anchor").value.type, "string");
  assert.equal(find(attributes, "data-ae-present").value.type, "string");
  assert.equal(find(attributes, "data-ae-option").value.type, "string");
  assert.equal(find(attributes, "data-ae-scrollbox-momentum").value.type, '\"true\" | \"false\"');
  assert.deepEqual(find(attributes, "data-ae-adaptive").value, { kind: "no-value" });
  assert.equal(find(attributes, "data-ae-present-key"), undefined);
  assert.equal(find(attributes, "data-ae-present-group-anchor"), undefined);
  assert.equal(find(attributes, "data-ae-overflow-marquee").value.type, "string");
  assert.equal(find(attributes, "data-ae-overflow-marquee-fade").value.type, '\"\" | \"true\" | \"false\"');
  assert.equal(find(attributes, "data-ae-scrollbox-fade").value.type, '\"\" | \"true\" | \"false\"');
  assert.match(find(catalog.attributes, "data-ae-anchor-target").description, /multiple Anchors per group/);
});

test("tag-specific declarations extend native tags and retain the default namespace", () => {
  const html = output["aellux.html-data.json"];
  const web = output["aellux.web-types.json"];
  assert.equal(find(html.globalAttributes, "data-ae-ajax-href"), undefined);
  assert.ok(find(find(html.tags, "a").attributes, "data-ae-ajax-href"));
  assert.ok(find(find(html.tags, "link").attributes, "data-ae-load-when"));
  assert.ok(find(find(html.tags, "link").attributes, "rel").values.some(value => value.name === "aelluxjs-ext"));
  assert.equal(find(web.contributions.html.elements, "link").extension, true);
  assert.equal(find(html.globalAttributes, "data-ae-point").description.includes("nonnegative integer"), true);
});

test("metadata agrees with runtime defaults and distinguishes outputs from private fields", () => {
  assert.equal(find(catalog.cssProperties, "--ae-scrollbar-size").default, "8px");
  assert.equal(find(catalog.cssProperties, "--ae-overflow-marquee-fade-size").default, "16px");
  assert.equal(find(catalog.cssProperties, "--ae-scrollbox-fade-size").default, "16px");
  assert.equal(find(catalog.cssProperties, "--ae-pop-duration").default, "250ms");
  assert.equal(find(catalog.cssProperties, "--ae-snap-focus").role, "output");
  assert.match(find(catalog.cssProperties, "--ae-snap-viewport").description, /-2\.\.2/);
  assert.ok(find(catalog.cssProperties, "--anchor-opacity"));
  assert.equal(find(output["aellux.css-data.json"].properties, "--ae-present-pop-phase"), undefined);
  assert.equal(find(output["aellux.html-data.json"].globalAttributes, "data-ae-ext"), undefined);
  assert.ok(find(catalog.classes, "ar-16x9"));
  assert.ok(find(catalog.classes, "p-ux-sm-3"));
  assert.equal(find(catalog.events, "AelluxJsPointerDown").bubbles, false);
  assert.equal(find(catalog.events, "AelluxJsBeforePop").cancelable, true);
  assert.equal(find(catalog.events, "AelluxJsScroll"), undefined);
});

test("catalog uses the configured naming contract instead of hardcoded namespace names", async () => {
  const constants = createAelluxConstants();
  constants.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX = "demo-?";
  constants.AELLUXJS_CLASS_NAME_PREFFIX = "demo--?";
  constants.AELLUXJS_CSS_VAR_PREFFIX = "--demo-?";
  constants.AELLUXJS_EVENT_NAME_PREFFIX = "Demo?";
  const customized = await createSemanticCatalog(metadata, constants);
  assert.ok(find(customized.attributes, "data-demo-trigger"));
  assert.ok(find(customized.cssProperties, "--demo-pop-duration"));
  assert.ok(find(customized.events, "DemoBeforePop"));
  assert.ok(find(customized.classes, "demo--shape-square"));
});

test("native artifacts are deterministic, versioned, shipped and up to date", async () => {
  assert.equal(output["aellux.web-types.json"].version, metadata.version);
  assert.equal(metadata["web-types"], "./dist/aellux.web-types.json");
  assert.equal(catalog.api.runtime.properties.mount.type, "function");
  assert.equal(catalog.api.bootstrap.properties.diagnostics.properties.WARN_ATTRIBUTE_UNKNOWN.type, "object");
  for (const name of editorDataFiles) {
    const committed = await readFile(new URL(`dist/${name}`, root), "utf8");
    assert.equal(committed.replace(/\r\n/g, "\n"), JSON.stringify(output[name], null, 2) + "\n");
    assert.ok(Object.values(metadata.exports).includes(`./dist/${name}`));
  }
  for (const entries of [catalog.attributes, catalog.cssProperties, catalog.classes, catalog.events])
    assert.equal(new Set(entries.map(entry => entry.name)).size, entries.length);
});

test("literal Extension attributes have semantic definitions, including internal markers", async () => {
  const known = new Set(catalog.attributes.map(entry => entry.name));
  const constants = createAelluxConstants();
  for (const name of await readdir(new URL("src/", root))) {
    const match = /^aellux\.ext\.(.+)\.js$/.exec(name);
    if (!match) continue;
    const text = await readFile(new URL(`src/${name}`, root), "utf8");
    for (const [, , local] of text.matchAll(/\.attr\(\s*(["'])([^"']+)\1\s*\)/g)) {
      const normalized = local.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
      assert.ok(known.has("data-" + constants.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX.replace("?", normalized)), `${name}: ${local}`);
    }
    // Extensions declaring their own extensionName as an attribute must also be covered.
    if (text.includes(".attr(extensionName)")) assert.ok(known.has(`data-ae-${match[1]}`), name);
  }
});

test("literal CSS custom properties referenced by Extensions are accounted for", async () => {
  const known = new Set(catalog.cssProperties.map(entry => entry.name));
  for (const name of await readdir(new URL("src/", root))) {
    if (!/^aellux\.ext\.[\w-]+\.js$/.test(name)) continue;
    const source = await readFile(new URL(`src/${name}`, root), "utf8");
    for (const [, , property] of source.matchAll(/(["'`])(--(?:ae-)?[a-z][a-z0-9-]*)\1/g)) {
      if (property.endsWith("-")) continue; // A prefix, not a complete property.
      assert.ok(known.has(property), `${name}: ${property}`);
    }
  }
});

test("every documentation reference has a source page", async () => {
  const urls = new Set([...catalog.attributes, ...catalog.cssProperties, ...catalog.classes, ...catalog.events].map(entry => entry.docURL));
  for (const url of urls) {
    const relative = new URL(url).pathname.split("/docs/")[1].replace(/\.htm$/, ".md");
    await readFile(new URL(`docs-source/${relative}`, root), "utf8");
  }
});
