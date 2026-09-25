/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { build } from "esbuild";
import { transformAsync } from "@babel/core";
import presetEnv from "@babel/preset-env";
import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative } from "node:path";
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
const legacySourceFiles = sourceFiles.filter(sourceFile => {
  const filename = basename(sourceFile);
  return filename === "aellux.orchestrator.js" ||
    /^aellux\.ext\.[\w-]+\.js$/.test(filename);
});
const legacyPolyfills = `
require("core-js/stable");
require("custom-event-polyfill");
require("raf/polyfill");
require("whatwg-fetch");
if (window.Element && !window.Element.prototype.matches) {
  window.Element.prototype.matches =
    window.Element.prototype.msMatchesSelector ||
    window.Element.prototype.webkitMatchesSelector;
}
if (window.NodeList && !window.NodeList.prototype.forEach) {
  window.NodeList.prototype.forEach = function (callback, thisArg) {
    Array.prototype.forEach.call(this, callback, thisArg);
  };
}
`;

const legacyOrchestratorEntry = `${legacyPolyfills}
require("./src/aellux.orchestrator.js");
`;
const legacyFullEntry = `${legacyPolyfills}
require("./src/aellux.full.esm.js");
`;

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
bootstrapContext.globalThis = bootstrapContext;
const bootstrapEvaluationBuild = await build({
  absWorkingDir: projectRoot,
  entryPoints: [bootstrapPath],
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "es2017",
  write: false,
  legalComments: "none"
});
runInContext(bootstrapEvaluationBuild.outputFiles[0].text, bootstrapContext);
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
  const classic = filename === "aellux.js";
  const full = filename === "aellux.full.esm.js";
  const orchestrator = filename === "aellux.orchestrator.js";
  const distributionFilename = full ? "aellux.full.js" : filename;

  for (const minify of [false, true]) {
    const outputFilename = minify ? distributionFilename.replace(/\.js$/, ".min.js") : distributionFilename;
    await build({
      absWorkingDir: projectRoot,
      entryPoints: [sourceFile],
      outfile: join(outputDirectory, outputFilename),
      bundle: classic || full || orchestrator,
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

for (const sourceFile of legacySourceFiles) {
  const filename = basename(sourceFile);
  const distributionFilename = filename.replace(/\.js$/, ".legacy.js");
  const sourceFileName = relative(projectRoot, sourceFile).replace(/\\/g, "/");
  const isOrchestrator = filename === "aellux.orchestrator.js";
  const transformed = isOrchestrator
    ? null
    : await transpileLegacySource(sourceFile, sourceFileName);

  for (const minify of [false, true]) {
    const outputFilename = minify
      ? distributionFilename.replace(/\.js$/, ".min.js")
      : distributionFilename;
    await build({
      absWorkingDir: projectRoot,
      stdin: {
        contents: isOrchestrator ? legacyOrchestratorEntry : transformed.code,
        loader: "js",
        resolveDir: projectRoot,
        sourcefile: isOrchestrator
          ? "aellux.orchestrator.legacy.entry.js"
          : sourceFileName
      },
      outfile: join(outputDirectory, outputFilename),
      bundle: isOrchestrator,
      platform: "browser",
      format: "iife",
      target: "es5",
      minify,
      sourcemap: true,
      legalComments: "inline",
      plugins: isOrchestrator
        ? [legacyBundlePlugin()]
        : []
    });
    generatedFiles.add(outputFilename);
    generatedFiles.add(outputFilename + ".map");
  }
}

for (const minify of [false, true]) {
  const outputFilename = minify
    ? "aellux.full.legacy.min.js"
    : "aellux.full.legacy.js";
  await build({
    absWorkingDir: projectRoot,
    stdin: {
      contents: legacyFullEntry,
      loader: "js",
      resolveDir: projectRoot,
      sourcefile: "aellux.full.legacy.entry.js"
    },
    outfile: join(outputDirectory, outputFilename),
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es5",
    minify,
    sourcemap: true,
    legalComments: "inline",
    plugins: [legacyBundlePlugin()]
  });
  generatedFiles.add(outputFilename);
  generatedFiles.add(outputFilename + ".map");
}

async function transpileLegacySource(sourceFile, sourceFileName) {
  const transformed = await transformAsync(
    await readFile(sourceFile, "utf8"),
    {
      filename: sourceFile,
      sourceFileName,
      presets: [[presetEnv, {
        modules: false,
        targets: { ie: "11" },
        useBuiltIns: false
      }]],
      sourceMaps: "inline"
    }
  );

  if (!transformed || !transformed.code) {
    throw new Error(`Failed to transpile Legacy source: ${sourceFileName}`);
  }

  return transformed;
}

function legacyBundlePlugin() {
  return {
    name: "aellux-legacy-bundle",
    setup(buildContext) {
      buildContext.onLoad({ filter: /\.js$/ }, async args => {
        const sourceFileName = relative(projectRoot, args.path).replace(/\\/g, "/");
        const sourceRelativePath = relative(sourceDirectory, args.path);
        if (sourceRelativePath.startsWith("..") || isAbsolute(sourceRelativePath)) {
          return null;
        }

        const transformed = await transpileLegacySource(args.path, sourceFileName);
        return {
          contents: transformed.code,
          loader: "js",
          resolveDir: dirname(args.path)
        };
      });
    }
  };
}

for (const entry of await readdir(outputDirectory, { withFileTypes: true })) {
  if (entry.isFile() && /^aellux(?:\.[\w-]+)*\.(?:js|css)(?:\.map)?$/.test(entry.name) &&
    !generatedFiles.has(entry.name)) {
    await unlink(join(outputDirectory, entry.name));
    console.log(`Removed obsolete build artifact: ${entry.name}`);
  }
}

const readme = await readFile(join(projectRoot, "README.md"), "utf8");
const distributionReadme = readme.replace(
  /\]\((docs\/|templates\/|CHANGELOG\.md)/g,
  "](../$1"
);
await writeFile(join(outputDirectory, "README.md"), distributionReadme, "utf8");
await copyFile(join(projectRoot, "LICENSE"), join(outputDirectory, "LICENSE"));
const generatedJavaScriptFiles = Array.from(generatedFiles)
  .filter(filename => filename.endsWith(".js")).length;
console.log(`Build complete: ${generatedJavaScriptFiles} JavaScript files, source maps, and Aellux Extension CSS in dist/.`);
