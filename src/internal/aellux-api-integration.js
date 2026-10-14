/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { buildDiagnostics } from "./build-diagnostics.js";
import { buildPersistMemory } from "./build-persist-memory.js";
import { buildPreferenceMediaQueries } from "./build-preference-media-queries.js";
import { saveAttr, restoreAttr } from "./build-initial-attr-memory.js";
import utilsNameCase from "./utils-name-case.js";
import { createPreferenceHtmlHelper } from "./create-preference-html-helper.js";
import { assetLoadHelper } from "./asset-load-helper.js";

// Build-time imports aside, keep this factory ES5-compatible for the boot bundle.
// The caller publishes the returned function and replaces init with the boot loader.
export function createAelluxApi(root, constants) {
  var toCapitalized = utilsNameCase.toCapitalized;
  var toCamelCase = utilsNameCase.toCamelCase;
  var fromCamelCase = utilsNameCase.fromCamelCase;

  var options = constants.AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS;
  var diagnostics = buildDiagnostics(constants.AELLUXJS_DIAGNOSTICS);
  var oldShortInstance = root[constants.AELLUXJS_SHORT_JS_NAME];
  var document = root.document;
  var preferenceHtml = createPreferenceHtmlHelper(root, function () { return api; });

  var api = function (elementOrId) {
    return api.mountManager ? api.mountManager.controller(elementOrId) : null;
  };
  var apiProperties = {
    shortJSName: constants.AELLUXJS_SHORT_JS_NAME,
    diagnostics: diagnostics,
    options: options,
    minified: false,
    waitLayout: null,
    mountManager: null,
    init: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    persist: {
      local: buildPersistMemory(root, "localStorage", null, diagnostics),
      session: buildPersistMemory(root, "sessionStorage", null, diagnostics),
      preferences: buildPersistMemory(root, "localStorage", "AelluxJsPreferences", diagnostics)
    },
    updatePreferenceAttributesHTML: preferenceHtml.updatePreferenceAttributesHTML,
    on: function (event, handler, options) {
      document.addEventListener(api.eventName(event), handler, options);
    },
    off: function (event, handler, options) {
      document.removeEventListener(api.eventName(event), handler, options);
    },
    attr: function (name) {
      name = fromCamelCase(name);
      return "data-" + constants.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX.replace(/\?/, name);
    },
    attrMem: { save: saveAttr, restore: restoreAttr },
    className: function (name) {
      name = fromCamelCase(name);
      return constants.AELLUXJS_CLASS_NAME_PREFFIX.replace(/\?/, name);
    },
    registerCssProperty: function (descriptor) {
      if (!root.CSS || typeof root.CSS.registerProperty !== "function") return false;
      try {
        root.CSS.registerProperty(descriptor);
        return true;
      } catch (error) {
        return false;
      }
    },
    extFilename: function (extensionName) {
      extensionName = fromCamelCase(extensionName);
      return "aellux." + constants.AELLUXJS_EXT_SCRIPT_PREFIX + "." + extensionName +
        (api.minified ? ".min.js" : ".js");
    },
    extName: function (filename) {
      return filename.replace(
        new RegExp("^.*aellux\\." + constants.AELLUXJS_EXT_SCRIPT_PREFIX +
          "\\.([^.\\/?#]+)(?:\\.min)?\\.js(?:[?#].*)?$"),
        "$1"
      );
    },
    eventName: function (name) {
      name = toCapitalized(name);
      return constants.AELLUXJS_EVENT_NAME_PREFFIX.replace(/\?/, name);
    },
    noConflict: function () { return oldShortInstance; },
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
      if (key in api.registry.ext) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_DUPLICATE, { extension: name });
        return;
      }
      if (url === api.extName(nameOrUrl)) url = "./" + api.extFilename(name);
      if (!options) options = {};
      var selector = options.loadWhen;
      if (selector !== null && typeof selector !== "undefined") {
        if (typeof selector !== "string" || !selector.trim()) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_LOAD_WHEN, {
            extension: name, selector: selector, expected: "a valid nonempty CSS selector"
          });
          return;
        }
        try {
          document.querySelector(selector);
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_LOAD_WHEN, {
            extension: name, selector: selector, cause: cause
          });
          return;
        }
      }
      if (typeof options.loadStyle === "undefined") options.loadStyle = false;
      if (!options.loadWhen) options.loadWhen = null;
      options.builds = normalizeExtensionBuilds(options.builds);
      if (options.loadWhen) api.registry.lazyExtSelectors[key] = options.loadWhen;
      options.url = url;
      options.load = options.loadWhen ? false : true;
      options.state = "wait";
      api.registry.ext[key] = options;
    },
    dep: function (label, url, integrity, crossOrigin) {
      if (typeof label !== "string" || !label.trim() ||
        typeof url !== "string" || !url.trim()) {
        return root.Promise.reject(diagnostics.error(
          diagnostics.ERROR_DEPENDENCY_ARGUMENT,
          { label: label, url: url, expected: "a nonempty label and script URL" }
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

      var script = document.createElement("script");
      script.src = url.replace(/^\.\//, api.aelluxBasePath);
      var resolvedURL = script.src;
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

      var registration = { url: resolvedURL, state: "loading", script: script, promise: null };
      registry[label] = registration;
      script.setAttribute(api.attr("dep"), label);
      if (options && options.integrity) script.setAttribute("integrity", options.integrity);
      if ((options && (options.integrity || options.crossOrigin)) || api.options.crossOrigin) {
        script.setAttribute("crossorigin",
          (options && options.crossOrigin) || api.options.crossOrigin || "anonymous");
      }
      registration.promise = new root.Promise(function (resolve, reject) {
        try {
          assetLoadHelper(script, {
            loadCallback: function () {
              registration.state = "loaded";
              resolve(script);
            },
            errorCallback: function (cause) {
              if (script.parentNode) script.parentNode.removeChild(script);
              delete registry[label];
              reject(diagnostics.error(
                diagnostics.ERROR_DEPENDENCY_LOAD,
                { label: label, url: resolvedURL, cause: cause }
              ));
            }
          });
        } catch (cause) {
          if (script.parentNode) script.parentNode.removeChild(script);
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
        if (typeof selector !== "string" || !selector.trim()) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
            extension: name, argument: "loadWhen", selector: selector,
            expected: "a valid nonempty CSS selector"
          });
          return;
        }
        try {
          document.querySelector(selector);
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
            extension: name, argument: "loadWhen", selector: selector, cause: cause
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
      return from.dispatchEvent(obj);
    },
    wait: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    mount: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    unmount: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    request: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
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
