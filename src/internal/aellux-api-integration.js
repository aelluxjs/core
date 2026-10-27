/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { buildDiagnostics } from "./build-diagnostics.js";
import { buildPersistMemory } from "./build-persist-memory.js";
import { createSaveElementMemoryHelper } from "./create-save-element-memory-helper.js";
import { buildPreferenceMediaQueries } from "./build-preference-media-queries.js";
import utilsNameCase from "./utils-name-case.js";
import { createNamingNormalization } from "./create-naming-normalization.js";
import { createPreferenceHtmlHelper } from "./create-preference-html-helper.js";
import { assetLoadHelper } from "./asset-load-helper.js";
import { resolveElementOrId } from "./resolve-element-or-id.js";
import { createSelectorHelper, validateSelector } from "./create-selector-helper.js";

// Build-time imports aside, keep this factory ES5-compatible for the boot bundle.
// The caller publishes the returned function and replaces init with the boot loader.
export function createAelluxApi(root, constants) {
  var toCamelCase = utilsNameCase.toCamelCase;
  var fromCamelCase = utilsNameCase.fromCamelCase;
  var namingNormalization = createNamingNormalization(constants);

  var options = constants.AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS;
  var diagnostics = buildDiagnostics(constants.AELLUXJS_DIAGNOSTICS);
  var oldShortInstance = root[constants.AELLUXJS_SHORT_JS_NAME];
  var document = root.document;
  var selectors = createSelectorHelper(document);
  var preferenceHtml = createPreferenceHtmlHelper(root, function () { return api; });

  var api = function (elementOrId) {
    return api.mountManager ? api.mountManager.controller(elementOrId) : null;
  };
  var apiProperties = {
    shortJSName: constants.AELLUXJS_SHORT_JS_NAME,
    version: constants.AELLUXJS_VERSION,
    orchestratorVersion: null,
    diagnostics: diagnostics,
    options: options,
    minified: false,
    waitLayout: null,
    motion: null,
    mountManager: null,
    init: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    persist: {
      local: buildPersistMemory(root, "localStorage", null, diagnostics),
      session: buildPersistMemory(root, "sessionStorage", null, diagnostics),
      preferences: buildPersistMemory(root, "localStorage", "AelluxJsPreferences", diagnostics),
      element: createSaveElementMemoryHelper()
    },
    updatePreferenceAttributesHTML: preferenceHtml.updatePreferenceAttributesHTML,
    currentPreference: preferenceHtml.currentPreference,
    elementOrId: (elementOrId, options) => resolveElementOrId(root, elementOrId, options),
    isValidSelector: selectors.isValidSelector,
    parseSelectors: selectors.parseSelectors,
    on: function (event, handler, options) {
      api.onEvent(document, event, handler, options);
    },
    off: function (event, handler, options) {
      api.offEvent(document, event, handler, options);
    },
    onEvent: function (target, event, handler, options) {
      target.addEventListener(api.eventName(event), handler, options);
    },
    offEvent: function (target, event, handler, options) {
      target.removeEventListener(api.eventName(event), handler, options);
    },
    attr: namingNormalization.attr,
    className: namingNormalization.className,
    cssVar: namingNormalization.cssVar,
    registerCssProperty: function () {
      if (!arguments.length || !root.CSS ||
        typeof root.CSS.registerProperty !== "function") return false;
      var registered = true;
      for (var index = 0; index < arguments.length; index++) {
        try {
          var descriptor = arguments[index];
          if (descriptor && typeof descriptor === "object" && !("inherits" in descriptor)) {
            var normalized = {};
            for (var key in descriptor)
              if (Object.prototype.hasOwnProperty.call(descriptor, key))
                normalized[key] = descriptor[key];
            normalized.inherits = true;
            descriptor = normalized;
          }
          root.CSS.registerProperty(descriptor);
        } catch (error) {
          registered = false;
        }
      }
      return registered;
    },
    // Shared by visual extensions. This value belongs only to the mounted
    // element; it is intentionally not inherited from its ancestors.
    layoutMaxFPS: function (element, specific) {
      var value = element && typeof element.getAttribute === "function"
        ? element.getAttribute(api.attr("maxfps")) : null;
      var generic;
      if (value !== null) {
        generic = String(value).trim() === "" ? NaN : Number(value);
        if (!Number.isFinite(generic) || generic <= 0) {
          diagnostics.warn(diagnostics.WARN_LAYOUT_MAX_FPS_INVALID, {
            extension: "core", element: element, attribute: api.attr("maxfps"), value: value,
            reason: "Frame rate must be finite and greater than zero.",
            suggestion: "Use a positive number or remove the attribute."
          });
          generic = undefined;
        }
      }
      if (!Number.isFinite(specific) || specific <= 0) return generic;
      return generic === undefined ? specific : Math.min(generic, specific);
    },
    // Keep minified tied to the API even when callers store this method separately.
    extFilename: namingNormalization.extFilename.bind(api),
    extName: namingNormalization.extName,
    eventName: namingNormalization.eventName,
    noConflict: function () { return oldShortInstance; },
    extIndex: {
      official: null,
      officialURL: null,
      fallback: null,
      fallbackURL: null,
      setFallback: function (url) {
        if (typeof url !== "string" || !url.trim()) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_INDEX_INVALID, {
            source: "custom", expected: "a nonempty manifest URL"
          });
          return api;
        }
        this.fallbackURL = url.trim();
        this.fallback = null;
        this.fallbackPromise = null;
        return api;
      }
    },
    registry: {
      ext: {},
      dep: Object.create(null),
      lazyExtSelectors: {},
      extMounters: {},
      preferenceMediaQueries: buildPreferenceMediaQueries(root)
    },
    ext: function (nameOrUrl, options) {
      var name = fromCamelCase(api.extName(nameOrUrl));
      var key = toCamelCase(name);
      var url = nameOrUrl;
      var implicit = url === api.extName(nameOrUrl);
      var previous = api.registry.ext[key];
      // Host declarations may replace an unused automatic Core registration.
      if (previous && (!previous.automatic || previous.state !== "wait")) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_DUPLICATE, { extension: name });
        return;
      }
      if (url === api.extName(nameOrUrl)) url = "./" + api.extFilename(name);
      if (!options) options = {};
      var explicitBuilds = Object.prototype.hasOwnProperty.call(options, "builds");
      var selector = options.loadWhen;
      if (selector !== null && typeof selector !== "undefined") {
        var invalidSelector = validateSelector(document, selector);
        if (invalidSelector) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_LOAD_WHEN, {
            extension: name, selector: selector, cause: invalidSelector.cause,
            expected: invalidSelector.cause ? undefined : "a valid nonempty CSS selector"
          });
          return;
        }
      }
      if (typeof options.loadStyle === "undefined") options.loadStyle = false;
      if (!options.loadWhen) options.loadWhen = null;
      options.builds = normalizeExtensionBuilds(options.builds);
      options.explicitBuilds = explicitBuilds;
      delete api.registry.lazyExtSelectors[key];
      if (options.loadWhen) api.registry.lazyExtSelectors[key] = options.loadWhen;
      options.url = url;
      options.implicit = implicit;
      options.load = options.loadWhen ? false : options.load !== false;
      options.state = "wait";
      api.registry.ext[key] = options;
    },
    dep: function (label, url, integrity, crossOrigin) {
      if (typeof label !== "string" || !label.trim() ||
        typeof url !== "string" || !url.trim()) {
        return root.Promise.reject(diagnostics.error(
          diagnostics.ERROR_DEPENDENCY_ARGUMENT,
          { label: label, url: url, expected: "a nonempty label and script or stylesheet URL" }
        ));
      }

      // Keep the original options-object overload while also accepting
      // dep(label, url, integrity, crossOrigin).
      var options = integrity && typeof integrity === "object" && !Array.isArray(integrity)
        ? integrity : { integrity: integrity, crossOrigin: crossOrigin };
      if ((typeof options.integrity !== "undefined" && options.integrity !== null &&
        typeof options.integrity !== "string") ||
        (typeof options.crossOrigin !== "undefined" && options.crossOrigin !== null &&
          typeof options.crossOrigin !== "string")) {
        return root.Promise.reject(diagnostics.error(
          diagnostics.ERROR_DEPENDENCY_ARGUMENT,
          { label: label, url: url, expected: "integrity and crossOrigin strings" }
        ));
      }

      var isStyle = /\.css$/i.test(url.split(/[?#]/)[0]);
      var asset = document.createElement(isStyle ? "link" : "script");
      var sourceAttribute = isStyle ? "href" : "src";
      if (isStyle) asset.rel = "stylesheet";
      asset[sourceAttribute] = url.replace(/^\.\//, api.aelluxBasePath);
      var resolvedURL = asset[sourceAttribute];
      var registry = api.registry.dep;
      var existing = Object.prototype.hasOwnProperty.call(registry, label)
        ? registry[label] : null;
      if (existing) {
        if (existing.url !== resolvedURL) {
          return root.Promise.reject(diagnostics.error(
            diagnostics.ERROR_DEPENDENCY_CONFLICT,
            { label: label, url: resolvedURL, registeredURL: existing.url }
          ));
        }
        return existing.promise;
      }

      var registration = { url: resolvedURL, state: "loading", promise: null };
      registration[isStyle ? "style" : "script"] = asset;
      registry[label] = registration;
      asset.setAttribute(api.attr("dep"), label);
      if (options && options.integrity) asset.setAttribute("integrity", options.integrity);
      if ((options && (options.integrity || options.crossOrigin)) || api.options.crossOrigin) {
        asset.setAttribute("crossorigin",
          (options && options.crossOrigin) || api.options.crossOrigin || "anonymous");
      }
      registration.promise = new root.Promise(function (resolve, reject) {
        try {
          assetLoadHelper(asset, {
            loadCallback: function () {
              registration.state = "loaded";
              resolve(asset);
            },
            errorCallback: function (cause) {
              if (asset.parentNode) asset.parentNode.removeChild(asset);
              delete registry[label];
              reject(diagnostics.error(
                diagnostics.ERROR_DEPENDENCY_LOAD,
                { label: label, url: resolvedURL, cause: cause }
              ));
            }
          });
        } catch (cause) {
          if (asset.parentNode) asset.parentNode.removeChild(asset);
          delete registry[label];
          reject(diagnostics.error(
            diagnostics.ERROR_DEPENDENCY_LOAD,
            { label: label, url: resolvedURL, cause: cause }
          ));
        }
      });
      return registration.promise;
    },
    extAttach: function (name, object) {
      if (typeof name !== "string" ||
        !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$|^[a-z][a-zA-Z0-9]*$/.test(name)) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
          extension: name, argument: "name", expected: "a nonempty kebab-case or camelCase extension name"
        });
        return;
      }
      name = fromCamelCase(name);
      var key = toCamelCase(name);
      if (key in Object.prototype || key === "prototype") {
        diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
          extension: name, argument: "name", expected: "a name that does not conflict with object properties"
        });
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(api.registry.ext, key)) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_NOT_REGISTERED, {
          extension: name, method: "extAttach"
        });
        return;
      }
      if (Object.prototype.hasOwnProperty.call(api.ext, key)) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_DUPLICATE, {
          extension: name, method: "extAttach"
        });
        return;
      }
      if (!object || typeof object !== "object" || Array.isArray(object) ||
        typeof object.init !== "function" ||
        (typeof object.destroy !== "undefined" && typeof object.destroy !== "function")) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
          extension: name, argument: "api", expected: "an object with init() and an optional destroy()"
        });
        return;
      }
      var registration = api.registry.ext[key];
      var selector = registration && registration.loadWhen;
      if (selector !== null && typeof selector !== "undefined") {
        var invalidSelector = validateSelector(document, selector);
        if (invalidSelector) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
            extension: name, argument: "loadWhen", selector: selector,
            cause: invalidSelector.cause,
            expected: invalidSelector.cause ? undefined : "a valid nonempty CSS selector"
          });
          return;
        }
      }
      api.registry.ext[key].state = "register";
      object.initialized = false;
      api.ext[key] = object;
    },
    dispatch: function (event, options) { return api.dispatchFrom(document, event, options); },
    dispatchFrom: function (from, event, options) {
      var obj = document.createEvent("Event");
      var bubbles = options && "bubbles" in options ? options.bubbles : true;
      var cancelable = options && "cancelable" in options ? options.cancelable : false;
      obj.initEvent(api.eventName(event), bubbles, cancelable);
      if (options && "detail" in options) obj.detail = options.detail;
      return from.dispatchEvent(obj);
    },
    wait: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    mount: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    unmount: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    request: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    ease: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    startAelluxJs: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    destroyExtensions: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    destroy: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); }
  };

  for (var property in apiProperties) {
    if (Object.prototype.hasOwnProperty.call(apiProperties, property)) {
      api[property] = apiProperties[property];
    }
  }

  return api;

  function normalizeExtensionBuilds(builds) {
    if (typeof builds === "undefined" || builds === null || builds === "") {
      return ["modern", "legacy"];
    }
    if (typeof builds === "string") builds = builds.split(/[\s,]+/);
    if (!Array.isArray(builds)) return [];

    var normalized = [];
    for (var i = 0; i < builds.length; i++) {
      var build = String(builds[i]).toLowerCase();
      if ((build === "modern" || build === "legacy") && normalized.indexOf(build) === -1) {
        normalized.push(build);
      }
    }
    return normalized;
  }

}
