/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// aellux.js orchestrator: extends the bootstrap with shared modern-runtime services.
// Loads and caches configured aellux.js Extensions, initializes them, and dispatches the Ready event.
// Ready signals that the orchestrator is initialized and available; it does not guarantee
// successful aellux.js Extension initialization or completed DOM mounting. Component-specific events
// such as Extension-specific events report their own readiness or updates.
// Routes explicit DOM mount/unmount requests through extension mount/unmount declarations
// and provides layout scheduling and fetch helpers.
// Uses ES2017 syntax, Promises, and modern browser APIs; legacy fallback
// selection belongs to the bootstrap, while feature-specific behavior belongs to aellux.js Extensions.

import { assetLoadHelper } from "./internal/asset-load-helper.js";
import { buildLayoutScheduler } from "./internal/build-layout-scheduler.js";
import { buildMountMapManager } from "./internal/build-mount-map-manager.js";
import { createAriaHelper } from "./internal/create-aria-helper.js";
import { createCssMotionController } from "./internal/create-css-motion-controller.js";
import { ease } from "./internal/ease.js";
import utilsNameCase from "./internal/utils-name-case.js";
import { officialExtensionDefinitions } from "./official-extension-definitions.js";

(function (root) {
  "use strict";

  const { toCamelCase, fromCamelCase } = utilsNameCase;
  const officialPackage = "@aelluxjs/core";
  const orchestratorVersion = typeof __AELLUX_VERSION__ !== "undefined"
    ? __AELLUX_VERSION__ : "0.1.0-beta.10";

  if (root.AelluxJs.version !== orchestratorVersion) {
    const error = root.AelluxJs.diagnostics.error(
      root.AelluxJs.diagnostics.ERROR_RUNTIME_VERSION_MISMATCH,
      { expected: root.AelluxJs.version, found: orchestratorVersion }
    );
    root.AelluxJs.orchestratorVersion = orchestratorVersion;
    root.AelluxJs.startAelluxJs = () => Promise.reject(error);
    return;
  }
  root.AelluxJs.orchestratorVersion = orchestratorVersion;

  const extensionPromises = {};
  const aria = createAriaHelper();
  const mountManager = buildMountMapManager(root);
  const layoutScheduler = buildLayoutScheduler();
  const motion = createCssMotionController(root, () => root.AelluxJs);

  // Keep the boot API function: its methods close over the same instance.
  root.AelluxJs = Object.assign(
    root.AelluxJs,
    {
      async startAelluxJs() {
        if (root.AelluxJs.bundledExtensions) {
          Object.keys(root.AelluxJs.bundledExtensions)
            .forEach(key => {
              if (!(key in AelluxJs.registry.ext)) AelluxJs.ext(key);
              const name = fromCamelCase(key);
              const metadata = AelluxJs.extIndex.official &&
                AelluxJs.extIndex.official.extensions[name];
              if (metadata && metadata.coreCompatibility) {
                AelluxJs.registry.ext[key].coreCompatibility = metadata.coreCompatibility;
                AelluxJs.registry.ext[key].official = true;
              }
            });
        }

        await new Promise((resolve) => {
          const startCallback = function () {
            if (AelluxJs.options.skipGlobalMount === true) {
              AelluxJs.off("$DOMContentLoaded", startCallback);
              resolve();
              return;
            }
            AelluxJs.mount().then(function () {
              AelluxJs.off("$DOMContentLoaded", startCallback);
              resolve();
            });
          };

          if (document.readyState === "loading")
            AelluxJs.on("$DOMContentLoaded", startCallback, { once: true });
          else
            startCallback();
        });

        AelluxJs.dispatch("Ready");

        return true;
      },
      async mount(elementOrId, extensionNames = null) {
        return mountManager.mount(elementOrId, extensionNames);
      },
      async unmount(elementOrId, extensionNames = null) {
        return mountManager.unmount(elementOrId, extensionNames);
      },
      async destroy() {
        if (await destroyExtensions(null, () => AelluxJs.waitLayout.clear()) === false)
          return false;
        mountManager.destroy();
      },
      async destroyExtensions(extensionNames) {
        return destroyExtensions(extensionNames);
      },

      dispatchFrom(from, event, options) {
        options = options || {};
        if (!("bubbles" in options)) { options.bubbles = true; }
        if (!("cancelable" in options)) { options.cancelable = false; }
        return from.dispatchEvent(
          new CustomEvent(
            AelluxJs.eventName(event),
            options
          )
        );
      },

      wait(extensionName) { return getExtension(extensionName); },

      request: defaultRequest,
      ease,

      aria,
      motion,
      waitLayout: layoutScheduler,
      mountManager,
    });

  root[root.AelluxJs.shortJSName] = root.AelluxJs;
  // Publish Full defaults before the boot script dispatches Awake/Legacy.
  // Basic keeps registration under the host's control.
  if (root.AelluxJs.options.mode === "full") registerCoreExtensions();

  function registerCoreExtensions() {
    const api = root.AelluxJs;
    const attr = name => `[${api.attr(name)}]`;
    for (const { name } of officialExtensionDefinitions) {
      const key = toCamelCase(name);
      if (key in api.registry.ext) continue;
      let loadWhen = name === "dialog" ? "dialog" : attr(name);
      if (name === "ajax-href") loadWhen = "a" + loadWhen;
      if (name === "present") {
        loadWhen = ["present", "present-group", "trigger", "dismiss", "target"].map(attr).join(",");
      }
      // Full initializes its foundational services without a DOM selector.
      if (name === "state-navigation" || name === "preference") loadWhen = null;
      api.ext(name, { loadWhen, load: true });
      api.registry.ext[key].automatic = true;
    }
  }

  async function destroyExtensions(extensionNames, onUnmounted) {
    if (typeof extensionNames === "string") extensionNames = [extensionNames];
    if (!extensionNames) extensionNames = Object.keys(AelluxJs.registry.ext);
    extensionNames = extensionNames.map(_ => fromCamelCase(_));

    try {
      if (await AelluxJs.unmount(document, extensionNames) === false) return false;
    } catch (error) {
      AelluxJs.diagnostics.error(
        AelluxJs.diagnostics.ERROR_EXTENSION_UNMOUNT,
        { cause: error, extensions: extensionNames }
      );
    }
    if (onUnmounted) onUnmounted();

    for (const extensionName of extensionNames) {
      const key = toCamelCase(extensionName);
      let extension;
      try {
        if (!extensionPromises[key]) continue;
        extension = await extensionPromises[key];
        if (extension && extension.destroy) await extension.destroy();
      } catch (error) {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_DESTROY,
          { cause: error, extension: extensionName }
        );
      } finally {
        delete AelluxJs.ext[key];
        delete extensionPromises[key];
        delete AelluxJs.registry.ext[key];
        mountManager.remove({ extensionName });
        delete AelluxJs.registry.lazyExtSelectors[key];
        removeExtensionAssets(extensionName);
        if (extension) extension.initialized = false;
      }
    }
  }

  function getExtension(extensionName) {
    const request = parseExtensionRequest(extensionName);
    extensionName = request.name;
    const key = toCamelCase(extensionName);

    if (extensionPromises[key])
      return extensionPromises[key];

    if (!(key in AelluxJs.registry.ext)) {
      return Promise.reject(AelluxJs.diagnostics.error(
        AelluxJs.diagnostics.ERROR_EXTENSION_NOT_REGISTERED,
        { extension: extensionName }
      ));
    }

    AelluxJs.registry.ext[key].automatic = false;

    if (AelluxJs.ext[key]) {
      if (AelluxJs.ext[key].initialized) {
        extensionPromises[key] = Promise.resolve(AelluxJs.ext[key]);
      } else {
        const registration = AelluxJs.registry.ext[key];
        extensionPromises[key] = (registration.loadStyle && registration.loadStyle !== "false"
          ? appendExtensionAssets(extensionName) : Promise.resolve())
          .then(() => extensionInitialize(extensionName))
          .catch(error => {
            if (!error || !error.aelluxCompatibility) {
              AelluxJs.diagnostics.error(
                AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
                { cause: error, extension: extensionName }
              );
            }
            delete extensionPromises[key];
            return null;
          });
      }
      return extensionPromises[key];
    }

    const bundledLoader =
      AelluxJs.bundledExtensions ?
        AelluxJs.bundledExtensions[key] :
        null;

    extensionPromises[key] = Promise.resolve()
      .then(() => {
        const registration = AelluxJs.registry.ext[key];
        return (registration.implicit || request.version) && !bundledLoader && !AelluxJs.ext[key]
          ? resolveImplicitRegistration(extensionName, registration, request.version) : registration;
      })
      .then(async data => {
        if (!hasCompatibleBuild(data)) {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_INCOMPATIBLE,
            {
              extension: extensionName,
              runtime: AelluxJs.diagnostics.legacy ? "legacy" : "modern",
              builds: data && data.builds
            }
          );
          delete AelluxJs.registry.lazyExtSelectors[key];
          return null;
        }
        if (!AelluxJs.ext[key]) await appendExtensionAssets(extensionName, bundledLoader);
        if (!AelluxJs.ext[key].initialized) return extensionInitialize(extensionName);
        return AelluxJs.ext[key];
      })
        .catch((error) => {
          if (!error || !error.aelluxCompatibility) {
            const registration = AelluxJs.registry.ext[key];
            if (registration && registration.implicit && !registration.manifestResolved) {
              AelluxJs.diagnostics.error(
                AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_NOT_FOUND,
                { extension: extensionName }
              );
            }
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
              { cause: error, extension: extensionName }
            );
          }
          delete extensionPromises[key];
          return null;
        });

    return extensionPromises[key];
  }

  function parseExtensionRequest(value) {
    const text = String(value || "").trim();
    const match = /^([a-z][a-z0-9-]*)(?:@([0-9]+(?:\.[0-9]+){0,2}(?:-[0-9A-Za-z.-]+)?))?$/i.exec(text);
    return { name: fromCamelCase(match ? match[1] : text), version: match && match[2] || null };
  }

  async function extensionInitialize(extensionName) {
    extensionName = fromCamelCase(extensionName);
    const key = toCamelCase(extensionName);
    const registration = AelluxJs.registry.ext[key];
    if (registration.coreCompatibility &&
      !versionSatisfies(AelluxJs.version, registration.coreCompatibility)) {
      const context = {
        extension: extensionName,
        coreVersion: AelluxJs.version,
        coreCompatibility: registration.coreCompatibility
      };
      if (registration.skipCompatibilityCheck === true) {
        AelluxJs.diagnostics.warn(
          AelluxJs.diagnostics.WARN_EXTENSION_COMPATIBILITY_SKIPPED,
          { ...context, explicitlySkipped: true }
        );
      } else {
        const error = AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_VERSION_INCOMPATIBLE,
          context
        );
        error.aelluxCompatibility = true;
        throw error;
      }
    }

    const options = AelluxJs.options.extensions[key] || {};
    await AelluxJs.ext[key].init(options);
    AelluxJs.ext[key].initialized = true;

    //Clean lazy registry
    delete AelluxJs.registry.lazyExtSelectors[key];

    return AelluxJs.ext[key];
  }

  async function appendExtensionAssets(extensionName, bundledLoader = null) {
    extensionName = fromCamelCase(extensionName);
    const key = toCamelCase(extensionName);
    const data = AelluxJs.registry.ext[key];
    const useLegacyBuild = AelluxJs.diagnostics.legacy || data.builds.indexOf("modern") === -1;
    const artifact = data.artifacts && data.artifacts[useLegacyBuild ? "legacy" : "modern"];
    const url = data.url.replace(/^\.\//, AelluxJs.aelluxBasePath);
    const scriptURL = artifact ? artifact.url : (useLegacyBuild ? toLegacyScriptURL(url) : url);
    const minifiedScript = /\.min\.js(?=[?#]|$)/.test(scriptURL);
    const scriptVariant = useLegacyBuild
      ? (minifiedScript ? "legacyMin" : "legacy")
      : (minifiedScript ? "modernMin" : "modern");
    const loadPromises = [];

    for (const dependency of data.dependencies || []) {
      if (typeof dependency === "string") continue;
      loadPromises.push(AelluxJs.dep(
        dependency.label, dependency.url,
        { integrity: dependency.integrity, crossOrigin: dependency.crossOrigin }
      ));
    }

    if (bundledLoader) {
      loadPromises.push(Promise.resolve().then(() => bundledLoader()));
    } else if (!AelluxJs.ext[key]) {
      loadPromises.push(new Promise(
        (resolve, reject) => {
          const attr = AelluxJs.attr("ext");
          const script = document.createElement("script");
          script.src = scriptURL;
          script.setAttribute(attr, extensionName);
          applyAssetIntegrity(script, artifact && artifact.integrity ||
            getExtensionIntegrity(data, scriptVariant, scriptURL), data.crossOrigin);

          assetLoadHelper(script, {
            loadCallback: resolve,
            errorCallback: reject
          });
        }
      ));
    }

    const defaultStyle = data.loadStyle === true || data.loadStyle === "true";
    const fullStyle = AelluxJs.bundledExtensions && (bundledLoader || data.official) &&
      document.querySelector(`link[${AelluxJs.attr("full-style")}]`);
    if (data.loadStyle && data.loadStyle !== "false" && !(defaultStyle && fullStyle)) {
      loadPromises.push(new Promise(
        (resolve) => {
          const styleDefaultURL = data.loadStyle === true ||
            data.loadStyle === "true" || data.loadStyle === "";
          const href = data.styleArtifact ? data.styleArtifact.url :
            (styleDefaultURL ? url.replace(/\.js(?=[?#]|$)/, ".css") : data.loadStyle);
          const attrStyle = AelluxJs.attr("ext-style");
          const link = document.createElement("link");
          link.href = href;
          link.rel = "stylesheet";
          link.setAttribute(attrStyle, extensionName);
          applyAssetIntegrity(link, data.styleArtifact && data.styleArtifact.integrity ||
            getExtensionIntegrity(data, "style", href), data.crossOrigin);

          assetLoadHelper(link, {
            loadCallback: resolve,
            errorCallback: () => {
              AelluxJs.diagnostics.warn(
                AelluxJs.diagnostics.WARN_EXTENSION_STYLE_LOAD,
                { extension: extensionName, element: link, attribute: "href", value: link.href, url: link.href,
                  reason: "The Extension stylesheet could not be loaded.",
                  suggestion: "Check the stylesheet URL, network response, integrity metadata and CSP style-src policy." }
              );
              resolve();
            }
          });
        }
      ));
    }

    return Promise.all(loadPromises);
  }

  function getExtensionIntegrity(data, variant, url) {
    const declared = data.integrity;
    const explicit = typeof declared === "string"
      ? (variant === "style" ? null : declared)
      : declared && declared[variant];
    if (explicit) return explicit;

    const basePath = AelluxJs.aelluxBasePath;
    if (!url.startsWith(basePath)) return null;
    const filename = url.slice(basePath.length);
    const builtin = AelluxJs.coreAssetIntegrity;
    return builtin && Object.prototype.hasOwnProperty.call(builtin, filename)
      ? builtin[filename]
      : null;
  }

  function applyAssetIntegrity(asset, integrity, crossOrigin) {
    if (integrity) asset.setAttribute("integrity", integrity);
    if (integrity || crossOrigin || AelluxJs.options.crossOrigin) {
      asset.setAttribute("crossorigin", crossOrigin || AelluxJs.options.crossOrigin || "anonymous");
    }
  }

  function toLegacyScriptURL(url) {
    return url.replace(
      /(?:\.legacy)?(?:\.min)?\.js(?=[?#]|$)/,
      ".legacy" + (AelluxJs.minified ? ".min" : "") + ".js"
    );
  }

  function removeExtensionAssets(extensionName) {
    const scriptAttribute = AelluxJs.attr("ext");
    const styleAttribute = AelluxJs.attr("ext-style");
    document.querySelectorAll(`script[${scriptAttribute}], link[${styleAttribute}]`)
      .forEach(asset => {
        if (asset.getAttribute(scriptAttribute) === extensionName ||
          asset.getAttribute(styleAttribute) === extensionName) {
          asset.remove();
        }
      });
  }

  async function resolveImplicitRegistration(extensionName, registration, requestedVersion = null) {
    const officialURL = AelluxJs.extIndex.officialURL ||
      AelluxJs.aelluxBasePath + "aellux.extensions.min.json";
    const requestedURL = requestedVersion && requestedVersion !== AelluxJs.version
      ? `https://cdn.jsdelivr.net/npm/${officialPackage}@${encodeURIComponent(requestedVersion)}/dist/aellux.extensions.min.json`
      : officialURL;
    let entry = null;
    let sourceURL = requestedURL;

    try {
      const embeddedOfficial = requestedVersion ? null : AelluxJs.extIndex.official;
      const embeddedEntry = embeddedOfficial &&
        embeddedOfficial.extensions[extensionName];
      // The full bundle embeds compatibility metadata for bundled loaders.
      // An implicit extension without a bundled loader still needs its signed
      // artifact URLs, which only the distributable manifest supplies.
      const official = embeddedEntry && embeddedEntry.builds
        ? embeddedOfficial
        : await loadExtensionIndex(requestedVersion ? `official@${requestedVersion}` : "official", requestedURL);
      entry = official.extensions[extensionName] || null;
    } catch (error) {
      reportIndexFailure(error, "official", requestedURL);
    }

    if (!entry && AelluxJs.extIndex.fallbackURL) {
      sourceURL = AelluxJs.extIndex.fallbackURL;
      try {
        const fallback = AelluxJs.extIndex.fallback ||
          await loadExtensionIndex("fallback", sourceURL);
        entry = fallback.extensions[extensionName] || null;
      } catch (error) {
        reportIndexFailure(error, "custom", sourceURL);
      }
    }

    // Preserve the original local convention when neither index resolves it.
    if (!entry) return registration;
    applyManifestEntry(registration, entry, sourceURL, extensionName);
    return registration;
  }

  function loadExtensionIndex(kind, url) {
    const promiseKey = kind + "Promise";
    if (AelluxJs.extIndex[promiseKey]) return AelluxJs.extIndex[promiseKey];
    validateManifestURL(url, kind);
    AelluxJs.extIndex[promiseKey] = AelluxJs.request(url)
      .then(response => response.json())
      .then(index => {
        validateExtensionIndex(index, kind, url);
        AelluxJs.extIndex[kind] = index;
        AelluxJs.diagnostics.info(AelluxJs.diagnostics.INFO_EXTENSION_INDEX_LOADED,
          { source: kind, url, extensions: Object.keys(index.extensions).length });
        return index;
      })
      .catch(error => {
        AelluxJs.extIndex[promiseKey] = null;
        throw error;
      });
    return AelluxJs.extIndex[promiseKey];
  }

  function validateManifestURL(url, kind) {
    let parsed;
    try { parsed = new URL(url, document.baseURI); }
    catch (_) { throw manifestError(kind, url, "valid URL"); }
    const development = AelluxJs.options.environment === "development";
    if (parsed.protocol !== "https:" && parsed.origin !== location.origin && !development) {
      throw manifestError(kind, url, "HTTPS for external manifests");
    }
  }

  function validateExtensionIndex(index, kind, url) {
    if (!index || index.schemaVersion !== 1 || typeof index.coreVersion !== "string" ||
      !index.extensions || typeof index.extensions !== "object" || Array.isArray(index.extensions)) {
      throw manifestError(kind, url, "schemaVersion 1, coreVersion, and extensions object");
    }
    if (index.coreVersion !== AelluxJs.version) {
      throw manifestError(kind, url,
        `coreVersion ${AelluxJs.version} (received ${index.coreVersion})`);
    }
    for (const [name, entry] of Object.entries(index.extensions)) {
      if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || !entry ||
        typeof entry.coreCompatibility !== "string" || !entry.builds ||
        typeof entry.builds !== "object") {
        throw manifestError(kind, url, `valid metadata for ${name}`);
      }
      for (const variant of ["modern", "legacy"]) {
        const artifact = entry.builds[variant];
        if (!artifact) continue;
        if (typeof artifact.url !== "string" || typeof artifact.integrity !== "string" ||
          !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(artifact.integrity)) {
          throw manifestError(kind, url, `URL and SHA-384 integrity for ${name}/${variant}`);
        }
        validateArtifactURL(artifact.url, url, kind);
        if (artifact.regular) {
          if (typeof artifact.regular.url !== "string" ||
            !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(artifact.regular.integrity || "")) {
            throw manifestError(kind, url, `regular URL and SHA-384 integrity for ${name}/${variant}`);
          }
          validateArtifactURL(artifact.regular.url, url, kind);
        }
      }
      if (!entry.builds.modern && !entry.builds.legacy)
        throw manifestError(kind, url, `a runtime build for ${name}`);
      if (entry.style) {
        if (typeof entry.style.url !== "string" ||
          !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(entry.style.integrity || "")) {
          throw manifestError(kind, url, `URL and SHA-384 integrity for ${name}/style`);
        }
        validateArtifactURL(entry.style.url, url, kind);
        if (entry.style.regular) {
          if (typeof entry.style.regular.url !== "string" ||
            !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(entry.style.regular.integrity || "")) {
            throw manifestError(kind, url, `regular URL and SHA-384 integrity for ${name}/style`);
          }
          validateArtifactURL(entry.style.regular.url, url, kind);
        }
      }
      if (!Array.isArray(entry.dependencies)) {
        throw manifestError(kind, url, `dependencies array for ${name}`);
      }
      for (const dependency of entry.dependencies) {
        // A string references a dependency already registered by the host.
        // Remote dependency metadata must be complete enough for the same
        // URL and SRI checks used by extension artifacts.
        if (typeof dependency === "string") continue;
        if (!dependency || typeof dependency.label !== "string" || !dependency.label.trim() ||
          typeof dependency.url !== "string" || typeof dependency.integrity !== "string" ||
          !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(dependency.integrity)) {
          throw manifestError(kind, url, `dependency URL and SHA-384 integrity for ${name}`);
        }
        validateArtifactURL(dependency.url, url, kind);
      }
    }
  }

  function validateArtifactURL(url, manifestURL, kind) {
    let parsed;
    try { parsed = new URL(url, new URL(manifestURL, document.baseURI)); }
    catch (_) { throw manifestError(kind, manifestURL, `valid artifact URL: ${url}`); }
    const development = AelluxJs.options.environment === "development";
    if (parsed.protocol !== "https:" && parsed.origin !== location.origin && !development)
      throw manifestError(kind, manifestURL, `HTTPS artifact URL: ${url}`);
  }

  function manifestError(kind, url, expected) {
    return AelluxJs.diagnostics.create(AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID,
      { source: kind, url, expected });
  }

  function reportIndexFailure(error, source, url) {
    if (error && error.code === AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID.code) {
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID,
        { source, url, expected: error.context && error.context.expected, cause: error });
    } else {
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_LOAD,
        { source, url, cause: error });
    }
  }

  function applyManifestEntry(registration, entry, manifestURL, extensionName) {
    const base = new URL(manifestURL, document.baseURI);
    const artifacts = {};
    for (const variant of ["modern", "legacy"]) {
      if (entry.builds[variant] &&
        (!registration.explicitBuilds || registration.builds.includes(variant))) {
        const declared = !AelluxJs.minified && entry.builds[variant].regular
          ? entry.builds[variant].regular : entry.builds[variant];
        artifacts[variant] = {
          url: new URL(declared.url, base).href,
          integrity: declared.integrity
        };
      }
    }
    const selected = artifacts[AelluxJs.diagnostics.legacy ? "legacy" : "modern"] ||
      (!AelluxJs.diagnostics.legacy && artifacts.legacy);
    registration.artifacts = artifacts;
    registration.manifestResolved = true;
    registration.builds = Object.keys(artifacts);
    if (selected) registration.url = selected.url;
    registration.coreCompatibility = entry.coreCompatibility;
    registration.dependencies = (entry.dependencies || []).map(dependency =>
      typeof dependency === "string" ? dependency : {
        ...dependency, url: new URL(dependency.url, base).href
      });
    registration.official = AelluxJs.extIndex.official &&
      AelluxJs.extIndex.official.extensions[extensionName] === entry;
    if (entry.style && registration.loadStyle && registration.loadStyle !== "false") {
      const declaredStyle = !AelluxJs.minified && entry.style.regular
        ? entry.style.regular : entry.style;
      registration.styleArtifact = {
        url: new URL(declaredStyle.url, base).href,
        integrity: declaredStyle.integrity
      };
    }
  }

  function versionSatisfies(version, range) {
    if (typeof range !== "string" || !range.trim()) return true;
    return range.split("||").some(group => group.trim().split(/\s+/).every(token => {
      if (token === "*" || token.toLowerCase() === "latest") return true;
      const match = token.match(/^(\^|~|>=|<=|>|<|=)?(.+)$/);
      if (!match) return false;
      const operator = match[1] || "=";
      const comparison = compareVersions(version, match[2]);
      if (operator === "=") return comparison === 0;
      if (operator === ">") return comparison > 0;
      if (operator === ">=") return comparison >= 0;
      if (operator === "<") return comparison < 0;
      if (operator === "<=") return comparison <= 0;
      const current = parseVersion(version);
      const expected = parseVersion(match[2]);
      if (!current || !expected || comparison < 0) return false;
      if (operator === "~") return current[0] === expected[0] && current[1] === expected[1];
      return expected[0] > 0 ? current[0] === expected[0]
        : expected[1] > 0 ? current[0] === 0 && current[1] === expected[1]
          : current[0] === 0 && current[1] === 0 && current[2] === expected[2];
    }));
  }

  function compareVersions(first, second) {
    const a = parseVersion(first);
    const b = parseVersion(second);
    if (!a || !b) return first === second ? 0 : -1;
    for (let index = 0; index < 3; index++) if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
    if (a[3] === b[3]) return 0;
    if (!a[3]) return 1;
    if (!b[3]) return -1;
    return a[3] > b[3] ? 1 : -1;
  }

  function parseVersion(version) {
    const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] || ""] : null;
  }

  function hasCompatibleBuild(data) {
    if (!data || !Array.isArray(data.builds) || data.builds.length === 0) return false;
    if (AelluxJs.diagnostics.legacy) return data.builds.indexOf("legacy") !== -1;
    return data.builds.indexOf("modern") !== -1 || data.builds.indexOf("legacy") !== -1;
  }

  function defaultRequest(url, options) {
    var requestOptions = Object.assign(
      { method: "GET", credentials: "same-origin" },
      options
    );
    return fetch(url, requestOptions)
      .then(function (response) {
        if (!response.ok) {
          var error = new Error("HTTP " + response.status + " " + response.statusText);
          error.name = "AelluxJsRequestError";
          error.status = response.status;
          error.statusText = response.statusText;
          error.response = response;
          throw error;
        }
        return response;
      }).catch(function (error) {
        throw error;
      });
  };

})(typeof globalThis !== "undefined" ? globalThis : window);
