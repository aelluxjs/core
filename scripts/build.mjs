/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { build } from "esbuild";
import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createContext, runInContext } from "node:vm";
import { generateAdaptiveCSS } from "../src/aellux.ext.adaptive.css.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceDirectory = join(projectRoot, "src");
const outputDirectory = join(projectRoot, "dist");
const sourceFiles = [];

for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".css.js")) {
    sourceFiles.push(join(sourceDirectory, entry.name));
  }
}

const generatedFiles = new Set();

await mkdir(outputDirectory, { recursive: true });

const bootstrapPath = join(sourceDirectory, "aellux.js");
const adaptiveExtensionPath = join(sourceDirectory, "aellux.ext.adaptive.js");
const bootstrapContext = createContext({
  document: {
    currentScript: { src: pathToFileURL(bootstrapPath).href },
    querySelector() { return null; }
  }
});
bootstrapContext.window = bootstrapContext;
runInContext(await readFile(bootstrapPath, "utf8"), bootstrapContext);
bootstrapContext.Aellux.ext("adaptive");
runInContext(await readFile(adaptiveExtensionPath, "utf8"), bootstrapContext);
await writeFile(
  join(outputDirectory, "aellux.ext.adaptive.css"),
  generateAdaptiveCSS(bootstrapContext.Aellux),
  "utf8"
);
generatedFiles.add("aellux.ext.adaptive.css");

await build({
  absWorkingDir: projectRoot,
  entryPoints: [join(outputDirectory, "aellux.ext.adaptive.css")],
  outfile: join(outputDirectory, "aellux.ext.adaptive.min.css"),
  minify: true,
  legalComments: "inline"
});
generatedFiles.add("aellux.ext.adaptive.min.css");

for (const sourceFile of sourceFiles) {
  const filename = basename(sourceFile);
  const classic = filename === "aellux.js" || filename === "aellux.legacy.js";
  const full = filename === "aellux.full.esm.js";
  const distributionFilename = full ? "aellux.full.js" : filename;

  for (const minify of [false, true]) {
    const outputFilename = minify ? distributionFilename.replace(/\.js$/, ".min.js") : distributionFilename;
    await build({
      absWorkingDir: projectRoot,
      entryPoints: [sourceFile],
      outfile: join(outputDirectory, outputFilename),
      bundle: full,
      platform: "browser",
      format: "iife",
      target: classic ? "es5" : "es2017",
      minify,
      sourcemap: true,
      legalComments: "inline"
    });
    generatedFiles.add(outputFilename);
    generatedFiles.add(outputFilename + ".map");
  }
}

for (const entry of await readdir(outputDirectory, { withFileTypes: true })) {
  if (entry.isFile() && /^aellux(?:\.[\w-]+)*\.(?:js|css)(?:\.map)?$/.test(entry.name) &&
    !generatedFiles.has(entry.name)) {
    await unlink(join(outputDirectory, entry.name));
    console.log(`Removed obsolete build artifact: ${entry.name}`);
  }
}

await copyFile(join(projectRoot, "README.md"), join(outputDirectory, "README.md"));
await copyFile(join(projectRoot, "LICENSE"), join(outputDirectory, "LICENSE"));
console.log(`Build complete: ${sourceFiles.length * 2} JavaScript files, source maps, and Aellux Extension CSS in dist/.`);
