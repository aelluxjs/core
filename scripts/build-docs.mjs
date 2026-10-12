import path from "node:path";
import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildDocs } from "@wolimp/docweaver";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsPath = path.join(projectRoot, "docs-source");
const outputPath = path.join(projectRoot, "docs");
const publicPrefix = process.env.DOCS_PUBLIC_PREFIX ?? "/core";
const publicPath = path.posix.join("/", publicPrefix, "docs");
const baseURL = process.env.DOCS_BASE_URL ?? "https://aelluxjs.github.io" + publicPath;

await buildDocs({
  docsPath,
  outputPath,
  baseURL,
  publicPath,
  title: "aellux.js Docs"
});

const { version } = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
async function updateCoreCdnVersion(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await updateCoreCdnVersion(entryPath);
    } else if (entry.name.endsWith(".htm")) {
      const html = await readFile(entryPath, "utf8");
      const updated = html.replace(
        /(@aelluxjs\/core@)0\.1\.0-beta\.\d+(\/dist\/aellux\.min\.js)/g,
        (_match, prefix, suffix) => `${prefix}${version}${suffix}`
      );
      if (updated !== html) await writeFile(entryPath, updated, "utf8");
    }
  }
}
await updateCoreCdnVersion(outputPath);

const docweaverAssetPath = path.join(outputPath, "assets", "docweaver");
await copyFile(
  path.join(projectRoot, "node_modules", "@wolimp", "docweaver", "LICENSE"),
  path.join(docweaverAssetPath, "LICENSE")
);
await writeFile(
  path.join(docweaverAssetPath, "THIRD_PARTY_LICENSES.txt"),
  "Docweaver theme assets and generated page template\n" +
    "@wolimp/docweaver 0.1.0-beta.8 (Apache-2.0)\n" +
    "License text: LICENSE in this directory.\n",
  "utf8"
);
