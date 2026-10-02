// src/internal/build-diagnostics.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function buildDiagnostics(catalog) {
  var diagnostics = {
    create: function(definition, context) {
      var error = new Error(definition.message);
      error.name = "AelluxJsDiagnosticError";
      error.code = definition.code;
      if (context) error.context = context;
      return error;
    },
    report: function(definition, context) {
      var error = diagnostics.create(definition, context);
      if (typeof console !== "undefined" && typeof console.error === "function") {
        console.error(
          "[aellux.js " + definition.code + "] " + definition.message,
          context || ""
        );
      }
      return error;
    }
  };
  for (var name in catalog) {
    if (Object.prototype.hasOwnProperty.call(catalog, name)) {
      diagnostics[name] = catalog[name];
    }
  }
  return diagnostics;
}

// src/internal/build-persist-memory.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function buildPersistMemory(root2, name, identifier) {
  var defaultIdentifier = identifier ? identifier : "AelluxJsPersist";
  var target;
  try {
    target = root2[name] || null;
    if (!target || typeof target.setItem !== "function" || typeof target.getItem !== "function") {
      throw new Error("Storage unavailable");
    }
  } catch (error) {
    target = {
      data: {},
      setItem: function(key, value) {
        this.data[key] = value;
      },
      getItem: function(key) {
        return this.data[key] ? this.data[key] : null;
      }
    };
  }
  var fallback = {
    data: {},
    keys: function() {
      var keys = [];
      for (var key in this.data) {
        if (Object.prototype.hasOwnProperty.call(this.data, key)) {
          keys.push(key);
        }
      }
      return keys;
    },
    get: function(key) {
      return this.data[key] ? this.data[key] : null;
    },
    set: function(key, value) {
      this.data[key] = value;
    },
    toString: function() {
      return JSON.stringify(this.data);
    }
  };
  function getData() {
    if (typeof root2.URLSearchParams !== "undefined")
      return new root2.URLSearchParams(target.getItem(defaultIdentifier) || "");
    fallback.data = JSON.parse(target.getItem(defaultIdentifier) || "{}");
    return fallback;
  }
  return {
    get: function(key, fallbackValue) {
      return getData().get(key) || fallbackValue;
    },
    set: function(key, value) {
      var data = getData();
      data.set(key, value);
      return target.setItem(defaultIdentifier, data.toString());
    },
    setObject: function(object) {
      var data = getData();
      for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          data.set(key, object[key]);
        }
      }
      return target.setItem(defaultIdentifier, data.toString());
    },
    getObject: function() {
      var data = getData();
      var object = {};
      var keys = data.keys();
      if (typeof keys.next === "function") {
        var entry = keys.next();
        while (!entry.done) {
          object[entry.value] = data.get(entry.value);
          entry = keys.next();
        }
      } else {
        keys.forEach(function(key) {
          object[key] = data.get(key);
        });
      }
      return object;
    }
  };
}

// src/internal/build-preferences-media-queries.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function buildPreferencesMediaQueries(root2) {
  function mediaQuery(query) {
    return typeof root2.matchMedia === "function" ? root2.matchMedia(query) : null;
  }
  return {
    colorScheme: {
      light: mediaQuery("(prefers-color-scheme: light)"),
      dark: mediaQuery("(prefers-color-scheme: dark)")
    },
    reducedMotion: {
      reduced: mediaQuery("(prefers-reduced-motion: reduced)"),
      "no-preference": mediaQuery("(prefers-reduced-motion: no-preference)")
    },
    reducedTransparency: {
      reduced: mediaQuery("(prefers-reduced-transparency: reduced)"),
      "no-preference": mediaQuery("(prefers-reduced-transparency: no-preference)")
    },
    forcedColors: {
      active: mediaQuery("(forced-colors: active)"),
      "no-preference": mediaQuery("(forced-colors: no-preference)")
    },
    contrast: {
      more: mediaQuery("(prefers-contrast: more)"),
      less: mediaQuery("(prefers-contrast: less)"),
      "no-preference": mediaQuery("(prefers-contrast: no-preference)")
    }
  };
}

// src/internal/utils-name-case.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function toCapitalized(name) {
  return name.replace(/^([a-z])|-([a-z])/g, function(_, first, afterHyphen) {
    return (first || afterHyphen).toUpperCase();
  });
}
function toCamelCase(name) {
  return name.replace(/-([a-z])/g, function(_, character) {
    return character.toUpperCase();
  });
}
function fromCamelCase(name) {
  return name.replace(/([A-Z])/g, "-$1").toLowerCase();
}
var utils_name_case_default = {
  toCapitalized,
  toCamelCase,
  fromCamelCase
};

// src/internal/utils-preference-html.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function createPreferencesHtmlHelper(root2, getApi) {
  var document = root2.document;
  var fromCamelCase2 = utils_name_case_default.fromCamelCase;
  return {
    updatePreferencesAttributesHTML
  };
  function updatePreferencesAttributesHTML(preferences) {
    var api = getApi();
    var allQueries = api.preferencesMediaQueries;
    preferences = preferences ? preferences : api.persist.preferences.getObject();
    for (var param in allQueries) {
      if (!Object.prototype.hasOwnProperty.call(allQueries, param)) continue;
      var queries = allQueries[param];
      for (var value in queries) {
        if (!Object.prototype.hasOwnProperty.call(queries, value)) continue;
        var query = queries[value];
        if (!preferences || !preferences[param] || preferences[param] === "auto") {
          if (!query || !query.matches) continue;
        } else if (preferences[param] !== value) {
          continue;
        }
        document.documentElement.setAttribute(api.attr(fromCamelCase2(param)), value);
      }
    }
    if (preferences && "colorScheme" in preferences) {
      updateColorSchemeMeta(preferences.colorScheme);
    }
  }
  function updateColorSchemeMeta(preferenceColorScheme) {
    var api = getApi();
    var attr = api.attr("theme-color");
    var aeMetaTag = document.head.querySelector("meta[" + attr + "]") || document.createElement("meta");
    if (preferenceColorScheme === "auto") {
      if (aeMetaTag.parentNode) aeMetaTag.parentNode.removeChild(aeMetaTag);
      return;
    }
    var themeColorTags = document.head.querySelectorAll("meta[name='theme-color']");
    if (themeColorTags.length < 2) return;
    var color = null;
    for (var i = 0; i < themeColorTags.length; i++) {
      var meta = themeColorTags[i];
      var media = meta.getAttribute("media") || "";
      if (preferenceColorScheme === "dark") {
        if (media.indexOf("dark") === -1) continue;
        color = meta.getAttribute("content");
        break;
      }
      if (media.indexOf("dark") > -1) continue;
      color = meta.getAttribute("content");
    }
    if (color === null) {
      if (aeMetaTag.parentNode) aeMetaTag.parentNode.removeChild(aeMetaTag);
      return;
    }
    aeMetaTag.name = "theme-color";
    aeMetaTag.content = color;
    aeMetaTag.setAttribute(attr, "");
    document.head.insertBefore(aeMetaTag, document.head.firstChild);
  }
}

// src/internal/aellux-api-integration.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function createAelluxApi(root2, constants) {
  var toCapitalized2 = utils_name_case_default.toCapitalized;
  var toCamelCase2 = utils_name_case_default.toCamelCase;
  var fromCamelCase2 = utils_name_case_default.fromCamelCase;
  var diagnostics = buildDiagnostics(constants.AELLUXJS_DIAGNOSTICS);
  var oldShortInstance = root2[constants.AELLUXJS_SHORT_JS_NAME];
  var document = root2.document;
  var api;
  var preferencesHtml = createPreferencesHtmlHelper(root2, function() {
    return api;
  });
  api = {
    shortJSName: constants.AELLUXJS_SHORT_JS_NAME,
    diagnostics,
    options: constants.AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS,
    minified: false,
    legacy: false,
    supported: false,
    notAvailable: [],
    waitLayout: null,
    init: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    persist: {
      local: buildPersistMemory(root2, "localStorage"),
      session: buildPersistMemory(root2, "sessionStorage"),
      preferences: buildPersistMemory(root2, "localStorage", "AelluxJsPreferences")
    },
    updatePreferencesAttributesHTML: preferencesHtml.updatePreferencesAttributesHTML,
    on: function(event, handler, options) {
      document.addEventListener(api.eventName(event), handler, options);
    },
    off: function(event, handler, options) {
      document.removeEventListener(api.eventName(event), handler, options);
    },
    attr: function(name) {
      return "data-" + constants.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX.replace(/\?/, name);
    },
    className: function(name) {
      return constants.AELLUXJS_CLASS_NAME_PREFFIX.replace(/\?/, name);
    },
    extFilename: function(name) {
      return "aellux." + constants.AELLUXJS_EXT_SCRIPT_PREFIX + "." + name + (api.minified ? ".min.js" : ".js");
    },
    extName: function(filename) {
      return filename.replace(
        new RegExp("^.*aellux\\." + constants.AELLUXJS_EXT_SCRIPT_PREFIX + "\\.([^.\\/?#]+)(?:\\.min)?\\.js(?:[?#].*)?$"),
        "$1"
      );
    },
    eventName: function(name) {
      return constants.AELLUXJS_EVENT_NAME_PREFFIX.replace(/\?/, toCapitalized2(name));
    },
    noConflict: function() {
      return oldShortInstance;
    },
    lazyExtensionSelectors: {},
    extensionMounters: {},
    extRegistry: {},
    ext: function(nameOrUrl, options) {
      var name = fromCamelCase2(api.extName(nameOrUrl));
      var key = toCamelCase2(name);
      var url = nameOrUrl;
      if (key in api.extRegistry) {
        diagnostics.report(diagnostics.ERROR_EXTENSION_DUPLICATE, { extension: name });
        return;
      }
      if (url === api.extName(nameOrUrl)) url = "./" + api.extFilename(name);
      if (!options) options = {};
      if (typeof options.loadStyle === "undefined") options.loadStyle = false;
      if (!options.loadWhen) options.loadWhen = null;
      options.builds = normalizeExtensionBuilds(options.builds);
      if (options.loadWhen) api.lazyExtensionSelectors[key] = options.loadWhen;
      options.url = url;
      options.load = options.loadWhen ? false : true;
      options.state = "wait";
      api.extRegistry[key] = options;
    },
    extRegister: function(name, object) {
      name = fromCamelCase2(name);
      var key = toCamelCase2(name);
      api.extRegistry[key].state = "register";
      object.initialized = false;
      api.ext[key] = object;
    },
    startAelluxJs: function() {
    },
    destroy: function() {
    },
    destroyExtensions: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    dispatchFrom: function(from, event, options) {
      var obj = document.createEvent("Event");
      obj.initEvent(api.eventName(event), false, false);
      from.dispatchEvent(obj);
    },
    dispatch: function(event, options) {
      api.dispatchFrom(document, event, options);
    },
    wait: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    update: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    unmount: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    request: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    preferencesMediaQueries: buildPreferencesMediaQueries(root2)
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

// src/internal/create-aellux-constants.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function createAelluxConstants() {
  return {
    AELLUXJS_SHORT_JS_NAME: "$ae",
    AELLUXJS_EXT_SCRIPT_PREFIX: "ext",
    AELLUXJS_CLASS_NAME_PREFFIX: "ae--?",
    AELLUXJS_EVENT_NAME_PREFFIX: "AelluxJs?",
    AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX: "ae-?",
    AELLUXJS_DIAGNOSTICS: {
      ERROR_BOOTSTRAP_NOT_FOUND: { code: 1e3, message: "aellux.js boot script could not be located." },
      ERROR_NOT_INITIALIZED: { code: 1001, message: "aellux.js has not been initialized." },
      ERROR_INVALID_MODE: { code: 1002, message: "aellux.js mode must be basic or full." },
      ERROR_EXTENSION_DUPLICATE: { code: 1101, message: "aellux.js Extension is already registered." },
      ERROR_EXTENSION_INITIALIZE: { code: 1102, message: "aellux.js Extension failed to initialize." },
      ERROR_EXTENSION_MOUNT: { code: 1103, message: "aellux.js Extension failed to mount or unmount an element." },
      ERROR_EXTENSION_UNMOUNT: { code: 1104, message: "aellux.js Extension failed to unmount." },
      ERROR_EXTENSION_DESTROY: { code: 1105, message: "aellux.js Extension failed to destroy." },
      ERROR_EXTENSION_INCOMPATIBLE: { code: 1106, message: "aellux.js Extension has no compatible build for the selected runtime." },
      ERROR_LEGACY_RUNTIME_START: { code: 1201, message: "aellux.js Legacy runtime failed to start." },
      ERROR_LEGACY_RUNTIME_LOAD: { code: 1202, message: "aellux.js Legacy runtime could not be loaded." }
    },
    AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS: {
      mode: "full",
      forceLegacy: false,
      basePath: null,
      extensions: {}
    },
    AELLUXJS_MODERN_API_DEPENDENCIES: [
      "Promise",
      "Map",
      "CustomEvent",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "fetch",
      { name: "Object", function: ["assign", "entries", "freeze"] },
      { name: "Array", function: ["from", "isArray"] }
    ]
  };
}

// src/aellux.esm.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
var root = typeof globalThis !== "undefined" ? globalThis : window;
var AelluxJs = root.AelluxJs || createAelluxApi(root, createAelluxConstants());
root.AelluxJs = AelluxJs;
root[AelluxJs.shortJSName] = AelluxJs;
var aellux_esm_default = AelluxJs;
export {
  aellux_esm_default as default
};
//# sourceMappingURL=aellux.esm.js.map
