import path from "node:path";
import { copyFile, writeFile } from "node:fs/promises";
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
