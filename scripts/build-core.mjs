/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { build } from "esbuild";
import { minify as minifyWithTerser } from "terser";
import { createHash } from "node:crypto";
import { transformAsync } from "@babel/core";
import presetEnv from "@babel/preset-env";
import { copyFile, cp, mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createContext, runInContext } from "node:vm";
import { generateAdaptiveCSS } from "../src/aellux.ext.adaptive.css.js";
import { generatePresentCSS } from "../src/aellux.ext.present.css.js";
import { generateFeedbackCSS } from "../src/aellux.ext.feedback.css.js";
import { generateScrollboxCSS } from "../src/aellux.ext.scrollbox.css.js";
import { generateAnchorCSS } from "../src/aellux.ext.anchor.css.js";
import { generateOverflowMarqueeCSS } from "../src/aellux.ext.overflow-marquee.css.js";
import { generateFullCSS } from "../src/aellux.full.css.js";
import { officialExtensionDefinitions } from "../src/official-extension-definitions.js";
import { createOfficialExtensionManifest } from "./extension-manifest.mjs";
import { normalizeSourceMapText } from "./normalize-source-map.mjs";
import { buildEditorData } from "./build-editor-data.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceDirectory = join(projectRoot, "src");
const outputDirectory = join(projectRoot, "dist");
const sourceFiles = [];

for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".css.js") &&
    entry.name !== "official-extension-definitions.js") {
    sourceFiles.push(join(sourceDirectory, entry.name));
  }
}

const generatedFiles = new Set();
const packageMetadata = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
const packageVersion = packageMetadata.version;
const versionDefine = { __AELLUX_VERSION__: JSON.stringify(packageVersion) };
const legacyThirdPartyBanner =
  "/*! Includes Babel helpers, core-js, custom-event-polyfill, raf, performance-now and whatwg-fetch (MIT). " +
  "Copyright and license texts: third-party/licenses/ in this distribution. */";
const dialogThirdPartyBanner =
  "/*! Includes dialog-polyfill (BSD-3-Clause). Copyright and license text: " +
  "third-party/licenses/dialog-polyfill.LICENSE in this distribution. */";
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
require("./src/aellux.full.js");
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
  legalComments: "none",
  define: { ...versionDefine, __AELLUX_CORE_ASSET_INTEGRITY__: "{}" }
});
runInContext(bootstrapEvaluationBuild.outputFiles[0].text, bootstrapContext);
runInContext('AelluxJs.ext("adaptive")', bootstrapContext);
runInContext(await readFile(adaptiveExtensionPath, "utf8"), bootstrapContext);
await buildGeneratedStylesheet(
  "aellux.ext.adaptive.css",
  generateAdaptiveCSS(bootstrapContext.AelluxJs)
);
await buildGeneratedStylesheet(
  "aellux.ext.present.css",
  generatePresentCSS(bootstrapContext.AelluxJs)
);
await buildGeneratedStylesheet(
  "aellux.ext.feedback.css",
  generateFeedbackCSS(bootstrapContext.AelluxJs)
);
await buildGeneratedStylesheet(
  "aellux.ext.scrollbox.css",
  generateScrollboxCSS(bootstrapContext.AelluxJs)
);
await buildGeneratedStylesheet(
  "aellux.ext.anchor.css",
  generateAnchorCSS(bootstrapContext.AelluxJs)
);
await buildGeneratedStylesheet(
  "aellux.ext.overflow-marquee.css",
  generateOverflowMarqueeCSS(bootstrapContext.AelluxJs)
);
await buildGeneratedStylesheet("aellux.full.css", generateFullCSS(bootstrapContext.AelluxJs));

async function buildGeneratedStylesheet(filename, contents) {
  const outputPath = join(outputDirectory, filename);
  const minifiedFilename = filename.replace(/\.css$/, ".min.css");
  await writeFile(outputPath, contents, "utf8");
  generatedFiles.add(filename);
  await build({
    absWorkingDir: projectRoot,
    entryPoints: [outputPath],
    outfile: join(outputDirectory, minifiedFilename),
    minify: true,
    legalComments: "inline"
  });
  generatedFiles.add(minifiedFilename);
}

for (const sourceFile of sourceFiles) {
  const filename = basename(sourceFile);
  const classic = filename === "aellux.js";
  if (classic) continue;
  const moduleEntry = filename === "aellux.esm.js";
  const full = filename === "aellux.full.js";
  // aellux.pwa.sw.js is discovered as an independent classic entry, never an
  // Extension dependency or Full import. It has no Legacy/DOM runtime variant.
  const distributionFilename = full ? "aellux.full.js" : filename;

  for (const minify of [false, true]) {
    const outputFilename = minify ? distributionFilename.replace(/\.js$/, ".min.js") : distributionFilename;
    await build({
      absWorkingDir: projectRoot,
      entryPoints: [sourceFile],
      outfile: join(outputDirectory, outputFilename),
      bundle: true,
      platform: "browser",
      format: moduleEntry ? "esm" : "iife",
      target: classic ? "es5" : "es2017",
      minify,
      sourcemap: true,
      // Deduplicate notices retained from Progress's removed fallback imports.
      legalComments: filename === "aellux.ext.progress.js" ? "eof" : "inline"
      ,define: { ...versionDefine, __AELLUX_PROGRESS_LEGACY__: "false" }
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
  const isDialog = filename === "aellux.ext.dialog.js";
  const isProgress = filename === "aellux.ext.progress.js";
  const transformed = isOrchestrator || isDialog
    ? null
    : await transpileLegacySource(sourceFile, sourceFileName);

  for (const minify of [false, true]) {
    const outputFilename = minify
      ? distributionFilename.replace(/\.js$/, ".min.js")
      : distributionFilename;
    await build({
      absWorkingDir: projectRoot,
      stdin: {
        contents: isOrchestrator ? legacyOrchestratorEntry : isDialog
          ? 'require("./src/internal/dialog.legacy.entry.js");' : transformed.code,
        loader: "js",
        resolveDir: isOrchestrator || isDialog ? projectRoot : sourceDirectory,
        sourcefile: isOrchestrator
          ? "aellux.orchestrator.legacy.entry.js"
          : isDialog ? "aellux.ext.dialog.legacy.entry.js" : sourceFileName
      },
      outfile: join(outputDirectory, outputFilename),
      bundle: true,
      platform: "browser",
      format: "iife",
      target: "es5",
      minify,
      sourcemap: true,
      legalComments: "inline",
      ...(isOrchestrator ? { banner: { js: legacyThirdPartyBanner } } : {}),
      ...(isDialog ? { banner: { js: dialogThirdPartyBanner }, loader: { ".css": "text" } } : {}),
      plugins: [legacyBundlePlugin()]
      ,define: { ...versionDefine, __AELLUX_PROGRESS_LEGACY__: isProgress ? "true" : "false" }
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
    banner: { js: legacyThirdPartyBanner },
    plugins: [legacyBundlePlugin()]
    ,define: versionDefine
  });
  generatedFiles.add(outputFilename);
  generatedFiles.add(outputFilename + ".map");
}

// Terser performs deeper compression than esbuild on the already bundled code.
// Run it before computing integrity hashes so the boot script uses final bytes.
for (const filename of generatedFiles) {
  if (filename.endsWith(".min.js")) await compressJavaScript(filename);
}

async function compressJavaScript(filename) {
  const outputPath = join(outputDirectory, filename);
  const originalCode = await readFile(outputPath, "utf8");
  const originalMap = await readFile(outputPath + ".map", "utf8");
  const legacy = filename.includes(".legacy.") || filename === "aellux.min.js";
  const result = await minifyWithTerser({ [filename]: originalCode }, {
    ecma: legacy ? 5 : 2017,
    compress: { passes: 1 },
    mangle: true,
    format: { comments: /^!/ },
    sourceMap: { content: originalMap, url: filename + ".map" }
  });
  if (!result.code || !result.map) throw new Error(`Terser failed: ${filename}`);
  // Keep esbuild's output if Terser does not actually reduce the file.
  if (Buffer.byteLength(result.code) < Buffer.byteLength(originalCode)) {
    await writeFile(outputPath, result.code, "utf8");
    await writeFile(outputPath + ".map", result.map, "utf8");
  }
}

// Hash the final bytes, then embed the map in the boot script that loads them.
// The boot script cannot contain its own hash.
const coreAssetIntegrity = { regular: {}, minified: {} };
for (const filename of generatedFiles) {
  if (!/\.(?:js|css)$/.test(filename)) continue;
  const content = await readFile(join(outputDirectory, filename));
  const variant = /\.min\.(?:js|css)$/.test(filename) ? "minified" : "regular";
  coreAssetIntegrity[variant][filename] = "sha384-" +
    createHash("sha384").update(content).digest("base64");
}

const extensionManifestResult = createOfficialExtensionManifest({
  version: packageVersion,
  definitions: officialExtensionDefinitions,
  integrity: coreAssetIntegrity,
  cdnBase: process.env.AELLUX_OFFICIAL_CDN_BASE || ""
});
await writeFile(
  join(outputDirectory, "aellux.extensions.min.json"),
  JSON.stringify(extensionManifestResult.manifest),
  "utf8"
);
await writeFile(
  join(outputDirectory, "aellux.extensions.report.json"),
  JSON.stringify({
    schemaVersion: 1,
    coreVersion: packageVersion,
    status: "valid",
    extensions: extensionManifestResult.report
  }, null, 2) + "\n",
  "utf8"
);

// Only the boot script embeds the signed official index. Full reuses it, so
// the Full artifacts already built and hashed above need no second build.
const embeddedManifestDefine = JSON.stringify(extensionManifestResult.manifest);
for (const minify of [false, true]) {
  const outputFilename = minify ? "aellux.min.js" : "aellux.js";
  await build({
    absWorkingDir: projectRoot,
    entryPoints: [bootstrapPath],
    outfile: join(outputDirectory, outputFilename),
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es5",
    minify,
    sourcemap: true,
    legalComments: "inline",
    define: {
      ...versionDefine,
      __AELLUX_OFFICIAL_EXTENSION_MANIFEST__: embeddedManifestDefine,
      __AELLUX_CORE_ASSET_INTEGRITY__: JSON.stringify(
        coreAssetIntegrity[minify ? "minified" : "regular"])
    }
  });
  generatedFiles.add(outputFilename);
  generatedFiles.add(outputFilename + ".map");
  if (minify) await compressJavaScript(outputFilename);
}

// Source maps embed the original source text. Normalize its line endings so
// builds from Windows and Linux produce the same committed artifacts.
for (const filename of generatedFiles) {
  if (!filename.endsWith(".map")) continue;
  const mapPath = join(outputDirectory, filename);
  const mapText = await readFile(mapPath, "utf8");
  const normalizedText = normalizeSourceMapText(mapText, filename);
  if (normalizedText !== mapText) await writeFile(mapPath, normalizedText, "utf8");
}

async function transpileLegacySource(sourceFile, sourceFileName) {
  const transformed = await transformAsync(
    (await readFile(sourceFile, "utf8")).replace(/\r\n?/g, "\n"),
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
await copyFile(join(projectRoot, "THIRD_PARTY_LICENSES.md"), join(outputDirectory, "THIRD_PARTY_LICENSES.md"));
await cp(join(projectRoot, "third-party", "licenses"), join(outputDirectory, "third-party", "licenses"), { recursive: true });
await buildEditorData();
const generatedJavaScriptFiles = Array.from(generatedFiles)
  .filter(filename => filename.endsWith(".js")).length;
console.log(`Build complete: ${generatedJavaScriptFiles} JavaScript files and source maps in dist/.`);
