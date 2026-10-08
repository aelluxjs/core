/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { buildDiagnostics } from "./build-diagnostics.js";
import { buildPersistMemory } from "./build-persist-memory.js";
import { buildPreferenceMediaQueries } from "./build-preference-media-queries.js";
import { saveAttr, restoreAttr } from "./build-initial-attr-memory.js";
import utilsNameCase from "./utils-name-case.js";
import { createPreferenceHtmlHelper } from "./create-preference-html-helper.js";

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
      dep: {},
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
      if (typeof options.loadStyle === "undefined") options.loadStyle = false;
      if (!options.loadWhen) options.loadWhen = null;
      options.builds = normalizeExtensionBuilds(options.builds);
      if (options.loadWhen) api.registry.lazyExtSelectors[key] = options.loadWhen;
      options.url = url;
      options.load = options.loadWhen ? false : true;
      options.state = "wait";
      api.registry.ext[key] = options;
    },
    extAttach: function (name, object) {
      name = fromCamelCase(name);
      var key = toCamelCase(name);
      if (!(key in api.registry.ext)) {
        api.registry.ext[key] = {
          loadWhen: null,
          state: null,
          loadStyle: false
        };
      }
      api.registry.ext[key].state = "register";
      object.initialized = false;
      api.ext[key] = object;
    },
    dispatch: function (event, options) { return api.dispatchFrom(document, event, options); },
    dispatchFrom: function (from, event, options) {
      var obj = document.createEvent("Event");
      var bubbles = options && "bubbles" in options ? options.bubbles : false;
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
