/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";
import { createAelluxConstants } from "../src/internal/create-aellux-constants.js";
import { createNamingNormalization } from "../src/internal/create-naming-normalization.js";
import createWeakCss from "../src/internal/create-weak-css.js";
import { generateAdaptiveCSS } from "../src/aellux.ext.adaptive.css.js";
import { generateFeedbackCSS } from "../src/aellux.ext.feedback.css.js";
import { generatePresentCSS } from "../src/aellux.ext.present.css.js";
import { generateScrollboxCSS } from "../src/aellux.ext.scrollbox.css.js";
import { generateAnchorCSS } from "../src/aellux.ext.anchor.css.js";
import { generateOverflowMarqueeCSS } from "../src/aellux.ext.overflow-marquee.css.js";
import { officialExtensionDefinitions } from "../src/official-extension-definitions.js";
import { semanticAttributes, semanticCSSProperties, semanticEvents } from "./semantic-definitions.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const editorDataFiles = ["aellux.semantic.json", "aellux.html-data.json", "aellux.css-data.json", "aellux.web-types.json"];
const sorted = entries => entries.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);

export async function createSemanticCatalog(metadata, constants = createAelluxConstants()) {
  const api = { ...createNamingNormalization(constants), ext: {} };
  api.extAttach = (name, extension) => { api.ext[name] = extension; };
  // Adaptive's public defaults are read from the actual Extension; no init or
  // DOM emulation is needed to generate its utility classes.
  runInNewContext(await readFile(join(projectRoot, "src/aellux.ext.adaptive.js"), "utf8"), { AelluxJs: api });
  const release = metadata.version.split("-")[0];
  const apiContext = {};
  runInNewContext(await readFile(join(projectRoot, "src/internal/aellux-api-contract.js"), "utf8"), apiContext);
  const docsBase = `https://aelluxjs.github.io/core/docs/${release}/`;
  const experimental = new Set(officialExtensionDefinitions.filter(entry => entry.experimental).map(entry => entry.name));
  const docURL = entry => {
    let path = entry.doc || (entry.extension === "core" ? "runtime/api" : `core-extensions/${entry.extension}`);
    if (experimental.has(path.replace(/^core-extensions\//, "").split("#")[0])) {
      path = path.replace(/^core-extensions\//, "core-extensions/experimental/");
    }
    return `${docsBase}${path}.htm`;
  };
  const attributes = sorted(semanticAttributes.map(entry => ({ ...entry, name: api.attr(entry.name), role: entry.role || "input", docURL: docURL(entry) })));
  const cssProperties = sorted(semanticCSSProperties.map(entry => ({ ...entry, name: entry.literal ? entry.name : api.cssVar(entry.name), role: entry.role || "input", docURL: docURL(entry) })));
  const classes = new Map();
  const stylesheets = [
    ["adaptive", generateAdaptiveCSS(api)], ["present", generatePresentCSS(api)],
    ["feedback", generateFeedbackCSS(api)],
    ["scrollbox", generateScrollboxCSS(api)],
    ["anchor", generateAnchorCSS(api)],
    ["overflow-marquee", generateOverflowMarqueeCSS(api)],
    ["core", createWeakCss().replace(/\?([a-z][0-9a-z-]*)/gi, (_, name) => api.attr(name)).replace(/%([a-z][0-9a-z-]*)/gi, (_, name) => api.className(name))]
  ];
  for (const [extension, css] of stylesheets) {
    // Scan selector preludes, not declarations (decimal CSS values are not classes).
    for (const [, selector] of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g)) {
      for (const [, name] of selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)) {
        if (classes.has(name)) continue;
        const role = name.startsWith(api.className("")) ? "output" : "input";
        classes.set(name, { name, extension, role,
          description: role === "input" ? "Adaptive CSS utility. Requires the generated Adaptive stylesheet and, for conditional utilities, a matching Adaptive ancestor state." : "Runtime-managed state class. Use in application CSS selectors; do not set it to command the runtime.",
          docURL: docURL({ extension }) });
      }
    }
  }
  // Include runtime classes not mentioned by a stylesheet, without guessing
  // names from partial template strings or JavaScript identifiers.
  for (const name of (await readdir(join(projectRoot, "src"))).filter(name => /^aellux(?:\.ext\.[\w-]+)?\.js$/.test(name))) {
    const source = await readFile(join(projectRoot, "src", name), "utf8");
    const extension = /^aellux\.ext\.(.+)\.js$/.exec(name)?.[1] || "core";
    for (const [, , local] of source.matchAll(/\.className\(\s*(["'])([^"']+)\1\s*\)/g)) {
      const name = api.className(local);
      if (!classes.has(name)) classes.set(name, { name, extension, role: "output", description: "Runtime-managed state class; useful in CSS selectors.", docURL: docURL({ extension }) });
    }
  }
  return {
    schemaVersion: 1, name: metadata.name, version: metadata.version,
    namespaces: { attributes: api.attr(""), cssProperties: api.cssVar(""), classes: api.className(""), events: constants.AELLUXJS_EVENT_NAME_PREFFIX.replace("?", "") },
    extensions: officialExtensionDefinitions.map(entry => entry.name),
    api: JSON.parse(JSON.stringify(apiContext.aelluxApiContract)),
    attributes, cssProperties, classes: sorted([...classes.values()]),
    events: sorted(semanticEvents.map(entry => ({ bubbles: true, cancelable: false, ...entry,
      name: api.eventName(entry.name), docURL: `${docsBase}runtime/events.htm` })))
  };
}

function describe(entry) {
  return [entry.description, entry.role === "output" ? "Runtime output; read it in selectors/styles instead of using it as an activation command." : "",
    entry.syntax ? `Value syntax: ${entry.syntax}.` : "",
    entry.default !== undefined ? `Default behavior: ${JSON.stringify(entry.default)}.` : "",
    entry.examples?.length ? `Examples: ${entry.examples.map(value => `\`${value}\``).join(", ")}.` : "",
    entry.values?.length && entry.syntax !== "enum" ? `Suggested values: ${entry.values.map(value => `\`${value}\``).join(", ")}. This is an open grammar, not a closed enumeration.` : ""
  ].filter(Boolean).join("\n\n");
}

export function renderEditorData(catalog) {
  const exposed = entries => entries.filter(entry => entry.role !== "internal");
  const references = entry => [{ name: `AelluxJS ${entry.extension}`, url: entry.docURL }];
  const htmlAttribute = entry => ({ name: entry.name, description: describe(entry), references: references(entry),
    ...(entry.syntax === "presence" ? { valueSet: "v" } : {}),
    ...((entry.values || entry.examples)?.length ? { values: (entry.values || entry.examples).map(name => ({ name })) } : {}) });
  const webAttribute = entry => ({ name: entry.name, description: describe(entry), "doc-url": entry.docURL,
    ...(entry.default !== undefined ? { default: entry.default } : {}),
    // Literal TypeScript types preserve string booleans and empty values. Open
    // grammars remain strings, so examples never restrict IDs/selectors/lists.
    value: entry.syntax === "presence" ? { kind: "no-value" } : {
      kind: "plain", type: entry.syntax === "enum" ? entry.values.map(value => JSON.stringify(value)).join(" | ") : "string"
    } });
  const tags = new Map();
  for (const entry of exposed(catalog.attributes)) {
    for (const tag of entry.tags || []) {
      if (!tags.has(tag)) tags.set(tag, []);
      tags.get(tag).push(entry);
    }
  }
  const linkRel = {
    name: "rel", extension: "core", role: "input", syntax: "string", values: ["aelluxjs-ext"],
    description: "Registers an Aellux Extension declared by this link. href is an official name or compatible Extension URL; data-ae-load-when enables lazy loading.",
    docURL: catalog.attributes.find(entry => entry.name.endsWith("load-when")).docURL
  };
  const htmlTags = [...tags].map(([name, attributes]) => ({ name, attributes: attributes.map(htmlAttribute) }));
  const webTags = [...tags].map(([name, attributes]) => ({ name, extension: true, attributes: attributes.map(webAttribute) }));
  htmlTags.find(tag => tag.name === "link").attributes.push(htmlAttribute(linkRel));
  webTags.find(tag => tag.name === "link").attributes.push(webAttribute(linkRel));
  return {
    "aellux.semantic.json": catalog,
    "aellux.html-data.json": {
      $schema: "https://raw.githubusercontent.com/microsoft/vscode-html-languageservice/main/docs/customData.schema.json",
      version: 1.1, globalAttributes: exposed(catalog.attributes).filter(entry => !entry.tags).map(htmlAttribute),
      tags: sorted(htmlTags), valueSets: [{ name: "v", values: [] }]
    },
    "aellux.css-data.json": {
      $schema: "https://raw.githubusercontent.com/microsoft/vscode-css-languageservice/main/docs/customData.schema.json",
      version: 1.1, properties: exposed(catalog.cssProperties).map(entry => ({ name: entry.name, description: describe(entry), syntax: entry.syntax,
        references: references(entry), ...(entry.values?.length ? { values: entry.values.map(name => ({ name })) } : {}) }))
    },
    "aellux.web-types.json": {
      $schema: "https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json",
      name: catalog.name, version: catalog.version, "js-types-syntax": "typescript", "description-markup": "markdown",
      contributions: {
        html: { attributes: exposed(catalog.attributes).filter(entry => !entry.tags).map(webAttribute), elements: sorted(webTags) },
        css: { properties: exposed(catalog.cssProperties).map(entry => ({ name: entry.name, description: describe(entry), "doc-url": entry.docURL, ...(entry.values ? { values: entry.values } : {}) })),
          classes: catalog.classes.map(entry => ({ name: entry.name, description: entry.description, "doc-url": entry.docURL })) },
        js: { events: catalog.events.map(entry => ({ name: entry.name, description: `${entry.description} Bubbles: ${entry.bubbles}. Cancelable: ${entry.cancelable}.`, "doc-url": entry.docURL })) }
      }
    }
  };
}

export async function buildEditorData() {
  const metadata = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  const catalog = await createSemanticCatalog(metadata);
  const output = renderEditorData(catalog);
  await mkdir(join(projectRoot, "dist"), { recursive: true });
  for (const [name, content] of Object.entries(output))
    await writeFile(join(projectRoot, "dist", name), JSON.stringify(content, null, 2) + "\n", "utf8");
  console.log(`Editor data: ${catalog.attributes.length} attributes, ${catalog.cssProperties.length} CSS properties, ${catalog.classes.length} classes, ${catalog.events.length} events.`);
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await buildEditorData();
