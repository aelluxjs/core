/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { buildDiagnostics } from "./build-diagnostics.js";
import { buildPersistMemory } from "./build-persist-memory.js";
import { buildPreferencesMediaQueries } from "./build-preferences-media-queries.js";
import nameCase from "./utils-name-case.js";
import { createPreferencesHtmlHelper } from "./utils-preference-html.js";

// Build-time imports aside, keep this factory ES5-compatible for the boot bundle.
// The caller publishes the returned object and replaces init with the boot loader.
export function createAelluxApi(root, constants) {
  var toCapitalized = nameCase.toCapitalized;
  var toCamelCase = nameCase.toCamelCase;
  var fromCamelCase = nameCase.fromCamelCase;

  var diagnostics = buildDiagnostics(constants.AELLUXJS_DIAGNOSTICS);
  var oldShortInstance = root[constants.AELLUXJS_SHORT_JS_NAME];
  var document = root.document;
  var api;
  var preferencesHtml = createPreferencesHtmlHelper(root, function () { return api; });

  api = {
    shortJSName: constants.AELLUXJS_SHORT_JS_NAME,
    diagnostics: diagnostics,
    options: constants.AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS,
    minified: false,
    legacy: false,
    supported: false,
    notAvailable: [],
    waitLayout: null,
    init: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    persist: {
      local: buildPersistMemory(root, "localStorage"),
      session: buildPersistMemory(root, "sessionStorage"),
      preferences: buildPersistMemory(root, "localStorage", "AelluxJsPreferences")
    },
    updatePreferencesAttributesHTML: preferencesHtml.updatePreferencesAttributesHTML,
    on: function (event, handler, options) {
      document.addEventListener(api.eventName(event), handler, options);
    },
    off: function (event, handler, options) {
      document.removeEventListener(api.eventName(event), handler, options);
    },
    attr: function (name) {
      return "data-" + constants.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX.replace(/\?/, name);
    },
    className: function (name) {
      return constants.AELLUXJS_CLASS_NAME_PREFFIX.replace(/\?/, name);
    },
    extFilename: function (name) {
      return "aellux." + constants.AELLUXJS_EXT_SCRIPT_PREFIX + "." + name +
        (api.minified ? ".min.js" : ".js");
    },
    extLabel: function (filename) {
      return filename.replace(
        new RegExp("^.*aellux\\." + constants.AELLUXJS_EXT_SCRIPT_PREFIX +
          "\\.([^.\\/?#]+)(?:\\.min)?\\.js(?:[?#].*)?$"),
        "$1"
      );
    },
    eventName: function (name) {
      return constants.AELLUXJS_EVENT_NAME_PREFFIX.replace(/\?/, toCapitalized(name));
    },
    noConflict: function () { return oldShortInstance; },
    lazyExtensionSelectors: {},
    extensionMounters: {},
    extRegistry: {},
    ext: function (labelOrUrl, options) {
      var label = fromCamelCase(api.extLabel(labelOrUrl));
      var url = labelOrUrl;
      if (label in api.extRegistry) {
        diagnostics.report(diagnostics.ERROR_EXTENSION_DUPLICATE, { extension: label });
        return;
      }
      if (url === label) url = "./" + api.extFilename(label);
      if (!options) options = {};
      if (typeof options.loadStyle === "undefined") options.loadStyle = false;
      if (!options.loadWhen) options.loadWhen = null;
      options.builds = normalizeExtensionBuilds(options.builds);
      if (options.loadWhen) api.lazyExtensionSelectors[label] = options.loadWhen;
      options.url = url;
      options.load = options.loadWhen ? false : true;
      options.state = "wait";
      api.extRegistry[label] = options;
    },
    extRegister: function (label, object) {
      label = fromCamelCase(label);
      var key = toCamelCase(label);
      api.extRegistry[label].state = "register";
      object.initialized = false;
      api.ext[key] = object;
    },
    startAelluxJs: function () { },
    destroy: function () { },
    destroyExtensions: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    dispatchFrom: function (from, event, options) {
      var obj = document.createEvent("Event");
      obj.initEvent(api.eventName(event), false, false);
      from.dispatchEvent(obj);
    },
    dispatch: function (event, options) { api.dispatchFrom(document, event, options); },
    wait: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    update: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    unmount: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    request: function () { throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED); },
    preferencesMediaQueries: buildPreferencesMediaQueries(root)
  };

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
