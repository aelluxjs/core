/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { transformAsync } from "@babel/core";
import presetEnv from "@babel/preset-env";
import { build, transform } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const sourceArgument = process.argv[2];
const outputArgument = process.argv[3] || "dist";

if (!sourceArgument) {
  throw new Error("Usage: node build-extension.mjs <aellux.ext.name.js> [output-directory]");
}

const sourcePath = resolve(process.cwd(), sourceArgument);
const outputDirectory = resolve(process.cwd(), outputArgument);
const sourceFilename = basename(sourcePath);

if (!/^aellux\.ext\.[\w-]+\.js$/.test(sourceFilename)) {
  throw new Error("Extension source must follow aellux.ext.<name>.js");
}

await mkdir(outputDirectory, { recursive: true });

const modernBuild = await build({
  entryPoints: [sourcePath],
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "es2017",
  write: false,
  legalComments: "inline"
});
const modernCode = modernBuild.outputFiles[0].text;
const legacyTransform = await transformAsync(modernCode, {
  filename: sourcePath,
  comments: true,
  compact: false,
  presets: [[presetEnv, {
    bugfixes: true,
    modules: false,
    targets: { ie: "11" },
    useBuiltIns: false
  }]]
});

if (!legacyTransform || !legacyTransform.code) {
  throw new Error("Babel did not produce a Legacy build");
}

const legacyFilename = sourceFilename.replace(/\.js$/, ".legacy.js");
await writeVariant(sourceFilename, modernCode, "es2017");
await writeVariant(legacyFilename, legacyTransform.code, "es5");

console.log(`Built ${sourceFilename} and ${legacyFilename} in ${outputDirectory}`);

async function writeVariant(filename, code, target) {
  await writeFile(resolve(outputDirectory, filename), code, "utf8");
  const minified = await transform(code, {
    loader: "js",
    target,
    minify: true,
    legalComments: "inline"
  });
  await writeFile(
    resolve(outputDirectory, filename.replace(/\.js$/, ".min.js")),
    minified.code,
    "utf8"
  );
}
