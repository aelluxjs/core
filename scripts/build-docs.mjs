import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDocs } from "@wolimp/docweaver";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsPath = path.join(projectRoot, "docs-source");
const outputDirectory = path.join(projectRoot, "docs");
const publicPrefix = process.env.DOCS_PUBLIC_PREFIX ?? "/core";
const publicPath = path.posix.join("/", publicPrefix, "docs");
const baseURL = process.env.DOCS_BASE_URL ?? "https://aelluxjs.github.io" + publicPath;

await buildDocs({
  docsPath,
  outputPath: outputDirectory,
  baseURL,
  publicPath,
  title: "aellux.js Docs"
});
