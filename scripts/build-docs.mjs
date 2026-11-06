import path from "node:path";
import { copyFile, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildDocs } from "@wolimp/docweaver";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsPath = path.join(projectRoot, "docs-source");
const outputPath = path.join(projectRoot, "docs");
const themePath = path.join(projectRoot, "templates", "docweaver");
const publicPrefix = process.env.DOCS_PUBLIC_PREFIX ?? "/core";
const publicPath = path.posix.join("/", publicPrefix, "docs");
const baseURL = process.env.DOCS_BASE_URL ?? "https://aelluxjs.github.io" + publicPath;

await buildDocs({
  docsPath,
  outputPath,
  themePath,
  baseURL,
  publicPath,
  title: "aellux.js"
});

const { version } = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
async function updateCoreCdnVersion(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await updateCoreCdnVersion(entryPath);
    } else if (entry.name.endsWith(".htm")) {
      const html = await readFile(entryPath, "utf8");
      // Template conditionals can leave indentation on otherwise blank lines.
      const updated = html.replace(/^[\t ]+(?=\r?$)/gm, "").replace(
        /(@aelluxjs\/core@)0\.1\.0-beta\.\d+(\/dist\/aellux\.min\.js)/g,
        (_match, prefix, suffix) => `${prefix}${version}${suffix}`
      );
      if (updated !== html) await writeFile(entryPath, updated, "utf8");
    }
  }
}
await updateCoreCdnVersion(outputPath);

// Preserve the former Point documentation URL while Input owns the content.
await writeFile(path.join(outputPath, "0.1.x", "core-extensions", "point.htm"),
  '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>Input Extension</title>' +
  '<meta http-equiv="refresh" content="0;url=input.htm"><link rel="canonical" href="input.htm"></head>' +
  '<body><a href="input.htm">Input Extension documentation</a></body></html>\n', "utf8");

const docweaverAssetPath = path.join(outputPath, "assets", "docweaver");
// Docweaver copies its default assets before overlaying the local theme.
// Ajax Href is now supplied by Core, so discard the upstream standalone copy.
await unlink(path.join(docweaverAssetPath, "js", "aellux.ext.ajax-href.js"))
  .catch(error => { if (error.code !== "ENOENT") throw error; });
await copyFile(
  path.join(themePath, "LICENSE"),
  path.join(docweaverAssetPath, "LICENSE")
);
await writeFile(
  path.join(docweaverAssetPath, "THIRD_PARTY_LICENSES.txt"),
  "Docweaver theme assets and generated page template\n" +
  "@wolimp/docweaver 0.1.0-beta.8 (Apache-2.0)\n" +
  "License text: LICENSE in this directory.\n",
  "utf8"
);
