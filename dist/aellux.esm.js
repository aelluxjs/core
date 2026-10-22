// src/internal/build-diagnostics.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function buildDiagnostics(catalog) {
  var levels = { error: 0, warn: 1, info: 2 };
  var consoleMethods = ["error", "warn", "info"];
  var historyLimit = 100;
  var history = [];
  var historyStart = 0;
  var identities = [];
  var resourceIds = typeof WeakMap === "function" ? /* @__PURE__ */ new WeakMap() : null;
  var nextResourceId = 1;
  var diagnostics = {
    legacy: false,
    supported: false,
    notAvailable: [],
    levels,
    verboseLevel: levels.error,
    update: function(options) {
      var requestedLevel = options && Object.prototype.hasOwnProperty.call(options, "verboseLevel") ? options.verboseLevel : diagnostics.verboseLevel;
      if (typeof requestedLevel === "string" && Object.prototype.hasOwnProperty.call(levels, requestedLevel)) {
        requestedLevel = levels[requestedLevel];
      }
      if (requestedLevel !== levels.error && requestedLevel !== levels.warn && requestedLevel !== levels.info) {
        throw diagnostics.create(diagnostics.ERROR_INVALID_VERBOSE_LEVEL);
      }
      diagnostics.verboseLevel = requestedLevel;
      return requestedLevel;
    },
    create: function(definition, context) {
      var error = new Error(definition.message);
      error.name = "AelluxJsDiagnosticError";
      error.code = definition.code;
      if (context) error.context = context;
      return error;
    },
    error: function(definition, context) {
      return emit(levels.error, definition, context);
    },
    warn: function(definition, context) {
      return emit(levels.warn, definition, context);
    },
    info: function(definition, context) {
      return emit(levels.info, definition, context);
    },
    showHistory: function(lines) {
      if (typeof lines === "undefined") lines = history.length;
      if (typeof lines !== "number" || !isFinite(lines) || lines < 0 || lines !== Math.floor(lines)) {
        throw new RangeError("diagnostics.showHistory(lines) requires a non-negative integer.");
      }
      var count = Math.min(lines, history.length);
      var entries = [];
      for (var i = 0; i < count; i++) {
        entries.push(history[(historyStart + history.length - count + i) % history.length]);
      }
      if (typeof console !== "undefined" && typeof console.log === "function") {
        for (var j = 0; j < entries.length; j++) {
          var entry = entries[j];
          var message = "[" + entry.timestamp + "] [aellux.js " + entry.code + "] " + entry.message;
          if (entry.context) console.log(message, entry.context);
          else console.log(message);
        }
      }
      return entries;
    }
  };
  function getVerboseLevel() {
    return diagnostics.verboseLevel;
  }
  function emit(level, definition, context) {
    var identity = String(level) + "|" + diagnosticIdentity(definition, context);
    if (identities.indexOf(identity) !== -1) return diagnostics.create(definition, context);
    var diagnostic = diagnostics.create(definition, context);
    var entry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      code: definition.code,
      message: definition.message,
      context
    };
    if (history.length < historyLimit) {
      history.push(entry);
      identities.push(identity);
    } else {
      identities[historyStart] = identity;
      history[historyStart] = entry;
      historyStart = (historyStart + 1) % historyLimit;
    }
    var verboseLevel = getVerboseLevel();
    var consoleMethod = consoleMethods[level];
    if ((level === levels.error || level <= verboseLevel) && typeof console !== "undefined" && typeof console[consoleMethod] === "function") {
      console[consoleMethod](
        "[aellux.js " + definition.code + "] " + definition.message,
        context || ""
      );
    }
    return diagnostic;
  }
  function diagnosticIdentity(definition, context) {
    return String(definition.code) + "|" + identityValue(context, []);
  }
  function identityValue(value, seen) {
    if (value === null) return "null";
    var type = typeof value;
    if (type !== "object" && type !== "function") return type + ":" + String(value);
    if (value && value.nodeType) return "element:" + resourceId(value);
    if (value instanceof Error) {
      return "error:" + value.name + ":" + value.message + ":" + String(value.code || "");
    }
    if (seen.indexOf(value) !== -1) return "circular";
    seen.push(value);
    var result;
    if (Array.isArray(value)) {
      result = "[" + value.map(function(item) {
        return identityValue(item, seen);
      }).join(",") + "]";
    } else {
      var keys = Object.keys(value).sort();
      result = "{" + keys.map(function(key) {
        return key + ":" + identityValue(value[key], seen);
      }).join(",") + "}";
    }
    seen.pop();
    return result;
  }
  function resourceId(resource) {
    if (!resourceIds) return String(resource);
    var id = resourceIds.get(resource);
    if (!id) {
      id = nextResourceId++;
      resourceIds.set(resource, id);
    }
    return id;
  }
  for (var name in catalog) {
    if (Object.prototype.hasOwnProperty.call(catalog, name)) {
      diagnostics[name] = catalog[name];
    }
  }
  return diagnostics;
}

// src/internal/build-persist-memory.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function buildPersistMemory(root2, name, identifier, diagnostics) {
  var defaultIdentifier = identifier ? identifier : "AelluxJsPersist";
  var target;
  try {
    target = root2[name] || null;
    if (!target || typeof target.setItem !== "function" || typeof target.getItem !== "function") {
      throw new Error("Storage unavailable");
    }
  } catch (error) {
    if (diagnostics) {
      diagnostics.warn(diagnostics.WARN_STORAGE_FALLBACK, {
        storage: name,
        identifier: defaultIdentifier,
        cause: error
      });
    }
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

// src/internal/create-save-element-memory-helper.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function createSaveElementMemoryHelper() {
  return { save: saveElementMemory };
}
function saveElementMemory(element, attributes, cssProperties) {
  if (!element || typeof element.hasAttribute !== "function" || typeof element.setAttribute !== "function" || !element.style) {
    throw new TypeError("persist.element.save requires an element");
  }
  if (typeof attributes === "undefined") attributes = [];
  if (typeof cssProperties === "undefined") cssProperties = [];
  if (!Array.isArray(attributes) || !Array.isArray(cssProperties)) {
    throw new TypeError("persist.element.save requires arrays of attributes and CSS properties");
  }
  var savedAttributes = /* @__PURE__ */ Object.create(null);
  var savedCssProperties = /* @__PURE__ */ Object.create(null);
  var style = element.style;
  var i;
  for (i = 0; i < attributes.length; i++) {
    var attribute = attributes[i];
    savedAttributes[attribute] = {
      present: element.hasAttribute(attribute),
      value: element.getAttribute(attribute)
    };
  }
  for (i = 0; i < cssProperties.length; i++) {
    var property = cssProperties[i];
    var value = style.getPropertyValue(property);
    var priority = style.getPropertyPriority(property);
    var present = value !== "" || priority !== "";
    if (!present) {
      for (var j = 0; j < style.length; j++) {
        if (style.item(j) === property) {
          present = true;
          break;
        }
      }
    }
    savedCssProperties[property] = {
      present,
      value,
      priority
    };
  }
  return {
    attributes: savedAttributes,
    cssProperties: savedCssProperties,
    restore: function() {
      if (!element || typeof element.setAttribute !== "function" || !element.style) return false;
      for (var name in savedAttributes) {
        if (!Object.prototype.hasOwnProperty.call(savedAttributes, name)) continue;
        var savedAttribute = savedAttributes[name];
        if (savedAttribute.present) element.setAttribute(name, savedAttribute.value);
        else element.removeAttribute(name);
      }
      for (var cssName in savedCssProperties) {
        if (!Object.prototype.hasOwnProperty.call(savedCssProperties, cssName)) continue;
        var savedCss = savedCssProperties[cssName];
        if (savedCss.present) element.style.setProperty(cssName, savedCss.value, savedCss.priority);
        else element.style.removeProperty(cssName);
      }
      return true;
    }
  };
}

// src/internal/build-preference-media-queries.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function buildPreferenceMediaQueries(root2) {
  function mediaQuery(query) {
    return typeof root2.matchMedia === "function" ? root2.matchMedia(query) : null;
  }
  var NO_PREFERENCE = "no-preference";
  var PREFERS = "prefers-";
  var REDUCED = "reduced";
  var COLOR_SCHEME = PREFERS + "color-scheme";
  var REDUCED_MOTION = PREFERS + "reduced-motion";
  var REDUCED_TRANSPARENCY = PREFERS + "reduced-transparency";
  var FORCED_COLORS = "forced-colors";
  var CONTRAST = PREFERS + "contrast";
  function preferenceQuery(feature, value) {
    return mediaQuery("(" + feature + ": " + value + ")");
  }
  return {
    colorScheme: {
      light: preferenceQuery(COLOR_SCHEME, "light"),
      dark: preferenceQuery(COLOR_SCHEME, "dark")
    },
    reducedMotion: {
      reduced: preferenceQuery(REDUCED_MOTION, "reduce"),
      "no-preference": preferenceQuery(REDUCED_MOTION, NO_PREFERENCE)
    },
    reducedTransparency: {
      reduced: preferenceQuery(REDUCED_TRANSPARENCY, REDUCED),
      "no-preference": preferenceQuery(REDUCED_TRANSPARENCY, NO_PREFERENCE)
    },
    forcedColors: {
      active: preferenceQuery(FORCED_COLORS, "active"),
      "no-preference": preferenceQuery(FORCED_COLORS, NO_PREFERENCE)
    },
    contrast: {
      more: preferenceQuery(CONTRAST, "more"),
      less: preferenceQuery(CONTRAST, "less"),
      "no-preference": preferenceQuery(CONTRAST, NO_PREFERENCE)
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

// src/internal/create-naming-normalization.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function createNamingNormalization(constants) {
  var fromCamelCase2 = utils_name_case_default.fromCamelCase;
  var toCapitalized2 = utils_name_case_default.toCapitalized;
  return {
    attr: function(name) {
      name = fromCamelCase2(name);
      return "data-" + constants.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX.replace(/\?/, name);
    },
    className: function(name) {
      name = fromCamelCase2(name);
      return constants.AELLUXJS_CLASS_NAME_PREFFIX.replace(/\?/, name);
    },
    cssVar: function(name) {
      name = fromCamelCase2(name);
      return constants.AELLUXJS_CSS_VAR_PREFFIX.replace(/\?/, name);
    },
    extFilename: function(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      return "aellux." + constants.AELLUXJS_EXT_SCRIPT_PREFIX + "." + extensionName + (this.minified ? ".min.js" : ".js");
    },
    extName: function(filename) {
      return filename.replace(
        new RegExp("^.*aellux\\." + constants.AELLUXJS_EXT_SCRIPT_PREFIX + "\\.([^.\\/?#]+)(?:\\.min)?\\.js(?:[?#].*)?$"),
        "$1"
      );
    },
    eventName: function(name) {
      if (/^[$#_!]/.test(name)) return name.slice(1).trim();
      var format = constants.AELLUXJS_EVENT_NAME_PREFFIX;
      var prefix = format.slice(0, format.indexOf("?"));
      if (name.indexOf(prefix) === 0) return name;
      return format.replace(/\?/, toCapitalized2(name));
    }
  };
}

// src/internal/create-preference-html-helper.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function createPreferenceHtmlHelper(root2, getApi) {
  var document2 = root2.document;
  var fromCamelCase2 = utils_name_case_default.fromCamelCase;
  return {
    updatePreferenceAttributesHTML,
    currentPreference
  };
  function currentPreference(name) {
    return document2.documentElement.getAttribute(getApi().attr(name));
  }
  function updatePreferenceAttributesHTML(preferences) {
    var api = getApi();
    var allQueries = api.registry.preferenceMediaQueries;
    preferences = preferences ? preferences : api.persist.preferences.getObject();
    for (var param in allQueries) {
      if (!Object.prototype.hasOwnProperty.call(allQueries, param)) continue;
      document2.documentElement.removeAttribute(api.attr(fromCamelCase2(param)));
      var queries = allQueries[param];
      for (var value in queries) {
        if (!Object.prototype.hasOwnProperty.call(queries, value)) continue;
        var query = queries[value];
        if (!preferences || !preferences[param] || preferences[param] === "auto") {
          if (!query || !query.matches) continue;
        } else if (preferences[param] !== value) {
          continue;
        }
        document2.documentElement.setAttribute(api.attr(fromCamelCase2(param)), value);
      }
    }
    if (preferences && "colorScheme" in preferences) {
      updateColorSchemeMeta(preferences.colorScheme);
    }
  }
  function updateColorSchemeMeta(preferenceColorScheme) {
    var api = getApi();
    var attr = api.attr("theme-color");
    var aeMetaTag = document2.head.querySelector("meta[" + attr + "]") || document2.createElement("meta");
    if (preferenceColorScheme === "auto") {
      if (aeMetaTag.parentNode) aeMetaTag.parentNode.removeChild(aeMetaTag);
      return;
    }
    var themeColorTags = document2.head.querySelectorAll("meta[name='theme-color']");
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
    document2.head.insertBefore(aeMetaTag, document2.head.firstChild);
  }
}

// src/internal/asset-load-helper.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function assetLoadHelper(asset, options) {
  var loadCallback = options.loadCallback;
  var errorCallback = options.errorCallback;
  function clear() {
    asset.onload = null;
    asset.onerror = null;
  }
  asset.onload = function(event) {
    clear();
    if (typeof loadCallback === "function") {
      return loadCallback(event);
    }
  };
  asset.onerror = function(event) {
    clear();
    if (typeof errorCallback === "function") {
      return errorCallback(event);
    }
  };
  document.head.appendChild(asset);
  return { clear };
}

// src/internal/resolve-element-or-id.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function resolveElementOrId(root2, elementOrId, options) {
  options = options || {};
  var fallback = options.defaultElement;
  if ((elementOrId === void 0 || elementOrId === null) && fallback) {
    return fallback;
  }
  var requested = elementOrId;
  if (typeof elementOrId === "string") {
    var id = elementOrId.trim().replace(/^#/, "");
    elementOrId = id ? root2.document.getElementById(id) : null;
  }
  var allowedNodeTypes = options.allowedNodeTypes || [root2.Node.ELEMENT_NODE];
  if (elementOrId && allowedNodeTypes.indexOf(elementOrId.nodeType) !== -1) {
    return elementOrId;
  }
  var diagnostics = root2.AelluxJs.diagnostics;
  diagnostics.warn(diagnostics.WARN_INVALID_ELEMENT_OR_ID, {
    elementOrId: requested,
    method: options.method
  });
  return null;
}

// src/internal/aellux-api-integration.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function createAelluxApi(root2, constants) {
  var toCamelCase2 = utils_name_case_default.toCamelCase;
  var fromCamelCase2 = utils_name_case_default.fromCamelCase;
  var namingNormalization = createNamingNormalization(constants);
  var options = constants.AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS;
  var diagnostics = buildDiagnostics(constants.AELLUXJS_DIAGNOSTICS);
  var oldShortInstance = root2[constants.AELLUXJS_SHORT_JS_NAME];
  var document2 = root2.document;
  var preferenceHtml = createPreferenceHtmlHelper(root2, function() {
    return api;
  });
  var api = function(elementOrId) {
    return api.mountManager ? api.mountManager.controller(elementOrId) : null;
  };
  var apiProperties = {
    shortJSName: constants.AELLUXJS_SHORT_JS_NAME,
    version: constants.AELLUXJS_VERSION,
    orchestratorVersion: null,
    diagnostics,
    options,
    minified: false,
    waitLayout: null,
    motion: null,
    mountManager: null,
    init: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    persist: {
      local: buildPersistMemory(root2, "localStorage", null, diagnostics),
      session: buildPersistMemory(root2, "sessionStorage", null, diagnostics),
      preferences: buildPersistMemory(root2, "localStorage", "AelluxJsPreferences", diagnostics),
      element: createSaveElementMemoryHelper()
    },
    updatePreferenceAttributesHTML: preferenceHtml.updatePreferenceAttributesHTML,
    currentPreference: preferenceHtml.currentPreference,
    elementOrId: (elementOrId, options2) => resolveElementOrId(root2, elementOrId, options2),
    on: function(event, handler, options2) {
      api.onEvent(document2, event, handler, options2);
    },
    off: function(event, handler, options2) {
      api.offEvent(document2, event, handler, options2);
    },
    onEvent: function(target, event, handler, options2) {
      target.addEventListener(api.eventName(event), handler, options2);
    },
    offEvent: function(target, event, handler, options2) {
      target.removeEventListener(api.eventName(event), handler, options2);
    },
    attr: namingNormalization.attr,
    className: namingNormalization.className,
    cssVar: namingNormalization.cssVar,
    registerCssProperty: function() {
      if (!arguments.length || !root2.CSS || typeof root2.CSS.registerProperty !== "function") return false;
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
          root2.CSS.registerProperty(descriptor);
        } catch (error) {
          registered = false;
        }
      }
      return registered;
    },
    // Shared by visual extensions. This value belongs only to the mounted
    // element; it is intentionally not inherited from its ancestors.
    layoutMaxFPS: function(element, specific) {
      var value = element && typeof element.getAttribute === "function" ? element.getAttribute(api.attr("maxfps")) : null;
      var generic;
      if (value !== null) {
        generic = String(value).trim() === "" ? NaN : Number(value);
        if (!Number.isFinite(generic) || generic <= 0) {
          diagnostics.warn(diagnostics.WARN_LAYOUT_MAX_FPS_INVALID, {
            extension: "core",
            element,
            attribute: api.attr("maxfps"),
            value,
            reason: "Frame rate must be finite and greater than zero.",
            suggestion: "Use a positive number or remove the attribute."
          });
          generic = void 0;
        }
      }
      if (!Number.isFinite(specific) || specific <= 0) return generic;
      return generic === void 0 ? specific : Math.min(generic, specific);
    },
    // Keep minified tied to the API even when callers store this method separately.
    extFilename: namingNormalization.extFilename.bind(api),
    extName: namingNormalization.extName,
    eventName: namingNormalization.eventName,
    noConflict: function() {
      return oldShortInstance;
    },
    extIndex: {
      official: null,
      officialURL: null,
      fallback: null,
      fallbackURL: null,
      setFallback: function(url) {
        if (typeof url !== "string" || !url.trim()) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_INDEX_INVALID, {
            source: "custom",
            expected: "a nonempty manifest URL"
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
      dep: /* @__PURE__ */ Object.create(null),
      lazyExtSelectors: {},
      extMounters: {},
      preferenceMediaQueries: buildPreferenceMediaQueries(root2)
    },
    ext: function(nameOrUrl, options2) {
      var name = fromCamelCase2(api.extName(nameOrUrl));
      var key = toCamelCase2(name);
      var url = nameOrUrl;
      var implicit = url === api.extName(nameOrUrl);
      if (key in api.registry.ext) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_DUPLICATE, { extension: name });
        return;
      }
      if (url === api.extName(nameOrUrl)) url = "./" + api.extFilename(name);
      if (!options2) options2 = {};
      var explicitBuilds = Object.prototype.hasOwnProperty.call(options2, "builds");
      var selector = options2.loadWhen;
      if (selector !== null && typeof selector !== "undefined") {
        if (typeof selector !== "string" || !selector.trim()) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_LOAD_WHEN, {
            extension: name,
            selector,
            expected: "a valid nonempty CSS selector"
          });
          return;
        }
        try {
          document2.querySelector(selector);
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_LOAD_WHEN, {
            extension: name,
            selector,
            cause
          });
          return;
        }
      }
      if (typeof options2.loadStyle === "undefined") options2.loadStyle = false;
      if (!options2.loadWhen) options2.loadWhen = null;
      options2.builds = normalizeExtensionBuilds(options2.builds);
      options2.explicitBuilds = explicitBuilds;
      if (options2.loadWhen) api.registry.lazyExtSelectors[key] = options2.loadWhen;
      options2.url = url;
      options2.implicit = implicit;
      options2.load = options2.loadWhen ? false : true;
      options2.state = "wait";
      api.registry.ext[key] = options2;
    },
    dep: function(label, url, integrity, crossOrigin) {
      if (typeof label !== "string" || !label.trim() || typeof url !== "string" || !url.trim()) {
        return root2.Promise.reject(diagnostics.error(
          diagnostics.ERROR_DEPENDENCY_ARGUMENT,
          { label, url, expected: "a nonempty label and script URL" }
        ));
      }
      var options2 = integrity && typeof integrity === "object" && !Array.isArray(integrity) ? integrity : { integrity, crossOrigin };
      if (typeof options2.integrity !== "undefined" && options2.integrity !== null && typeof options2.integrity !== "string" || typeof options2.crossOrigin !== "undefined" && options2.crossOrigin !== null && typeof options2.crossOrigin !== "string") {
        return root2.Promise.reject(diagnostics.error(
          diagnostics.ERROR_DEPENDENCY_ARGUMENT,
          { label, url, expected: "integrity and crossOrigin strings" }
        ));
      }
      var script = document2.createElement("script");
      script.src = url.replace(/^\.\//, api.aelluxBasePath);
      var resolvedURL = script.src;
      var registry = api.registry.dep;
      var existing = Object.prototype.hasOwnProperty.call(registry, label) ? registry[label] : null;
      if (existing) {
        if (existing.url !== resolvedURL) {
          return root2.Promise.reject(diagnostics.error(
            diagnostics.ERROR_DEPENDENCY_CONFLICT,
            { label, url: resolvedURL, registeredURL: existing.url }
          ));
        }
        return existing.promise;
      }
      var registration = { url: resolvedURL, state: "loading", script, promise: null };
      registry[label] = registration;
      script.setAttribute(api.attr("dep"), label);
      if (options2 && options2.integrity) script.setAttribute("integrity", options2.integrity);
      if (options2 && (options2.integrity || options2.crossOrigin) || api.options.crossOrigin) {
        script.setAttribute(
          "crossorigin",
          options2 && options2.crossOrigin || api.options.crossOrigin || "anonymous"
        );
      }
      registration.promise = new root2.Promise(function(resolve, reject) {
        try {
          assetLoadHelper(script, {
            loadCallback: function() {
              registration.state = "loaded";
              resolve(script);
            },
            errorCallback: function(cause) {
              if (script.parentNode) script.parentNode.removeChild(script);
              delete registry[label];
              reject(diagnostics.error(
                diagnostics.ERROR_DEPENDENCY_LOAD,
                { label, url: resolvedURL, cause }
              ));
            }
          });
        } catch (cause) {
          if (script.parentNode) script.parentNode.removeChild(script);
          delete registry[label];
          reject(diagnostics.error(
            diagnostics.ERROR_DEPENDENCY_LOAD,
            { label, url: resolvedURL, cause }
          ));
        }
      });
      return registration.promise;
    },
    extAttach: function(name, object) {
      if (typeof name !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$|^[a-z][a-zA-Z0-9]*$/.test(name)) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
          extension: name,
          argument: "name",
          expected: "a nonempty kebab-case or camelCase extension name"
        });
        return;
      }
      name = fromCamelCase2(name);
      var key = toCamelCase2(name);
      if (key in Object.prototype || key === "prototype") {
        diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
          extension: name,
          argument: "name",
          expected: "a name that does not conflict with object properties"
        });
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(api.registry.ext, key)) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_NOT_REGISTERED, {
          extension: name,
          method: "extAttach"
        });
        return;
      }
      if (Object.prototype.hasOwnProperty.call(api.ext, key)) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_DUPLICATE, {
          extension: name,
          method: "extAttach"
        });
        return;
      }
      if (!object || typeof object !== "object" || Array.isArray(object) || typeof object.init !== "function" || typeof object.destroy !== "undefined" && typeof object.destroy !== "function") {
        diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
          extension: name,
          argument: "api",
          expected: "an object with init() and an optional destroy()"
        });
        return;
      }
      var registration = api.registry.ext[key];
      var selector = registration && registration.loadWhen;
      if (selector !== null && typeof selector !== "undefined") {
        if (typeof selector !== "string" || !selector.trim()) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
            extension: name,
            argument: "loadWhen",
            selector,
            expected: "a valid nonempty CSS selector"
          });
          return;
        }
        try {
          document2.querySelector(selector);
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_ATTACH, {
            extension: name,
            argument: "loadWhen",
            selector,
            cause
          });
          return;
        }
      }
      api.registry.ext[key].state = "register";
      object.initialized = false;
      api.ext[key] = object;
    },
    dispatch: function(event, options2) {
      return api.dispatchFrom(document2, event, options2);
    },
    dispatchFrom: function(from, event, options2) {
      var obj = document2.createEvent("Event");
      var bubbles = options2 && "bubbles" in options2 ? options2.bubbles : true;
      var cancelable = options2 && "cancelable" in options2 ? options2.cancelable : false;
      obj.initEvent(api.eventName(event), bubbles, cancelable);
      if (options2 && "detail" in options2) obj.detail = options2.detail;
      return from.dispatchEvent(obj);
    },
    wait: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    mount: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    unmount: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    request: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    ease: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    startAelluxJs: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    destroyExtensions: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    },
    destroy: function() {
      throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
    }
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

// src/internal/create-aellux-constants.js
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
function createAelluxConstants() {
  var AELLUX = "aellux.js ", EXTENSION = AELLUX + "Extension ", DEPENDENCY = AELLUX + "Dependency ", INVALID_ARGUMENTS = " has invalid arguments.", LEGACY_RUNTIME = AELLUX + "Legacy runtime ", MODERN_RUNTIME = AELLUX + "Modern runtime ";
  return {
    AELLUXJS_VERSION: true ? "0.1.0-beta.10" : "0.1.0-beta.10",
    AELLUXJS_SHORT_JS_NAME: "$ae",
    AELLUXJS_EXT_SCRIPT_PREFIX: "ext",
    AELLUXJS_CLASS_NAME_PREFFIX: "ae--?",
    AELLUXJS_CSS_VAR_PREFFIX: "--ae-?",
    AELLUXJS_EVENT_NAME_PREFFIX: "AelluxJs?",
    AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX: "ae-?",
    AELLUXJS_DIAGNOSTICS: {
      ERROR_BOOTSTRAP_NOT_FOUND: { code: 1e3, message: AELLUX + "boot script could not be located." },
      ERROR_NOT_INITIALIZED: { code: 1001, message: AELLUX + "has not been initialized." },
      ERROR_INVALID_MODE: { code: 1002, message: AELLUX + "mode must be basic or full." },
      ERROR_INVALID_VERBOSE_LEVEL: { code: 1003, message: AELLUX + "verboseLevel must be 0, 1, 2, or the matching error, warn, info key." },
      ERROR_CONTROLLER_NOT_FOUND: { code: 1004, message: "No controller was found for this element. It may not be mounted." },
      ERROR_MOUNT: { code: 1006, message: AELLUX + "failed to mount a root." },
      ERROR_EXTENSION_DUPLICATE: { code: 1101, message: EXTENSION + "is already registered." },
      ERROR_EXTENSION_INITIALIZE: { code: 1102, message: EXTENSION + "failed to initialize." },
      ERROR_EXTENSION_MOUNT: { code: 1103, message: EXTENSION + "failed to mount or unmount an element." },
      ERROR_EXTENSION_UNMOUNT: { code: 1104, message: EXTENSION + "failed to unmount." },
      ERROR_EXTENSION_DESTROY: { code: 1105, message: EXTENSION + "failed to destroy." },
      ERROR_EXTENSION_INCOMPATIBLE: { code: 1106, message: EXTENSION + "has no compatible build for the selected runtime." },
      ERROR_EXTENSION_SELECTOR: { code: 1107, message: EXTENSION + "failed to iterate a selector." },
      ERROR_CALLBACK: { code: 1108, message: EXTENSION + "selector callback failed." },
      ERROR_EXTENSION_TRANSITION: { code: 1109, message: EXTENSION + "transition failed." },
      ERROR_EXTENSION_NOT_REGISTERED: { code: 1110, message: EXTENSION + "is not registered." },
      ERROR_PRESENT_CONTROL_TARGET_MISSING: { code: 1111, message: "A present control has no target selector and is not inside a present container." },
      ERROR_EXTENSION_ATTACH: { code: 1112, message: EXTENSION + "attachment" + INVALID_ARGUMENTS },
      ERROR_MOUNT_REGISTRATION: { code: 1113, message: AELLUX + "Mount registration" + INVALID_ARGUMENTS },
      ERROR_EXTENSION_LOAD_WHEN: { code: 1114, message: EXTENSION + "loadWhen selector is invalid." },
      ERROR_MOUNT_MAP_IN_USE: { code: 1115, message: "A mount map cannot be removed while elements are still mounted." },
      ERROR_DEPENDENCY_ARGUMENT: { code: 1116, message: DEPENDENCY + "registration" + INVALID_ARGUMENTS },
      ERROR_DEPENDENCY_CONFLICT: { code: 1117, message: DEPENDENCY + "label is already registered with a different URL." },
      ERROR_DEPENDENCY_LOAD: { code: 1118, message: DEPENDENCY + "script could not be loaded." },
      ERROR_ANCHOR_REFERENCE_CONTEXT: { code: 1119, message: "Anchor target and anchored element must share the same containing block / absolute positioning reference." },
      ERROR_SCROLLBOX_ELASTIC_WRAPPER: { code: 1120, message: "Elastic Scrollbox requires exactly one direct child marked with data-ae-scrollbox-elastic." },
      ERROR_SCROLLBOX_SNAP_ITEMS: { code: 1121, message: "Snap Scrollbox requires at least one eligible data-ae-snap-item." },
      ERROR_FEEDBACK_ARGUMENT: { code: 1122, message: "Feedback requires a string message, a known string type, a string motion when provided, and a DOM Element target when provided." },
      ERROR_EXTENSION_VERSION_INCOMPATIBLE: { code: 1123, message: EXTENSION + "is incompatible with this Core version." },
      ERROR_RUNTIME_VERSION_MISMATCH: { code: 1124, message: "Bootscript and runtime versions do not match." },
      ERROR_EXTENSION_INDEX_LOAD: { code: 1125, message: "The extension manifest could not be loaded." },
      ERROR_EXTENSION_INDEX_INVALID: { code: 1126, message: "The extension manifest is invalid." },
      ERROR_EXTENSION_VARIANT_UNAVAILABLE: { code: 1127, message: "The extension manifest has no compatible runtime variant." },
      ERROR_INVALID_ENVIRONMENT: { code: 1128, message: AELLUX + "environment must be production or development." },
      ERROR_EXTENSION_INDEX_NOT_FOUND: { code: 1129, message: "The requested Extension was not found in an extension manifest." },
      ERROR_LEGACY_RUNTIME_START: { code: 1201, message: LEGACY_RUNTIME + "failed to start." },
      ERROR_LEGACY_RUNTIME_LOAD: { code: 1202, message: LEGACY_RUNTIME + "could not be loaded." },
      ERROR_MODERN_RUNTIME_START: { code: 1203, message: MODERN_RUNTIME + "failed to start; trying Legacy runtime." },
      ERROR_MODERN_RUNTIME_LOAD: { code: 1204, message: MODERN_RUNTIME + "could not be loaded; trying Legacy runtime." },
      WARN_BROWSER_UNSUPPORTED: { code: 2e3, message: "Browser environment is not available." },
      WARN_BROWSER_CAPABILITIES: { code: 2001, message: "Some browser capabilities are unavailable; trying Legacy runtime." },
      WARN_INTERRUPTION: { code: 2002, message: EXTENSION + "transition was interrupted." },
      WARN_EXTENSION_STYLE_LOAD: { code: 2004, message: EXTENSION + "stylesheet could not be loaded." },
      WARN_CONTROLLER_METHOD_MISSING: { code: 2005, message: "A mounted controller method is not available on its Extension." },
      WARN_STORAGE_FALLBACK: { code: 2006, message: "Browser storage is unavailable; values will be kept in memory only." },
      WARN_PRESENT_MOTION_HIDDEN: { code: 2008, message: "A present-motion child should not be hidden; hidden belongs on its present container." },
      WARN_NAVIGATION_EVENT_INVALID: { code: 2009, message: "A state-navigation event has missing or invalid detail properties." },
      WARN_PRESENT_MOTION_MISSING: { code: 2010, message: "A present container has no direct present-motion child; one was generated automatically." },
      WARN_INVALID_ELEMENT_OR_ID: { code: 2011, message: "Expected a DOM Element or an existing element ID, optionally prefixed with #." },
      WARN_SCROLLBOX_MODE_INVALID: { code: 2012, message: "Scrollbox mode must be native or pointer; using native." },
      WARN_SCROLLBOX_OPTIONS_JSON: { code: 2013, message: "Scrollbox options are not valid JSON; using defaults." },
      WARN_SCROLLBOX_OPTIONS_OBJECT: { code: 2014, message: "Scrollbox options must be a JSON object; using defaults." },
      WARN_SCROLLBOX_ELASTIC_LIMIT_INVALID: { code: 2015, message: "Scrollbox elastic limit must be one or two nonnegative fractions or pixel values; using 1/4." },
      WARN_SCROLLBOX_WRAPPER_DISPLAY: { code: 2016, message: "Scrollbox elastic wrappers require an inline display; converting to an inline counterpart when available." },
      WARN_LAYOUT_MAX_FPS_INVALID: { code: 2017, message: "data-ae-maxfps must be a finite number greater than zero; the limit was ignored." },
      WARN_EXTENSION_COMPATIBILITY_SKIPPED: { code: 2018, message: "Extension compatibility verification was explicitly skipped." },
      WARN_CSS_MOTION_PROPERTY_MAX_FPS_INVALID: { code: 2019, message: "cssMotionPropertyMaxFPS is invalid; using 55 FPS." },
      WARN_SCROLLBOX_SNAP_TRANSFORM: { code: 2020, message: "A transformed snap item can invalidate Scrollbox snap geometry; apply the visual transform to a child element instead." },
      WARN_PRESENT_GROUP_SELECTION: { code: 2021, message: "Present Group selection is invalid or ambiguous; the previous selection is preserved." },
      WARN_ANCHOR_MATCH: { code: 2022, message: "Anchor match accepts width and/or height." },
      WARN_ANCHOR_GROUP: { code: 2023, message: "Anchor association or geometry is invalid." },
      WARN_ATTRIBUTE_UNKNOWN: { code: 2024, message: "An Aellux attribute may be misspelled; check the suggested name." },
      WARN_EXTENSION_REQUIRED: { code: 2025, message: "A declared behavior requires an initialized Extension." },
      WARN_CONFIGURATION_VALUE: { code: 2026, message: "An Aellux configuration value is invalid; check the expected format." },
      WARN_CONFIGURATION_TARGET: { code: 2027, message: "An Aellux target is missing, incompatible, or cannot be measured." },
      WARN_CONFIGURATION_STRUCTURE: { code: 2028, message: "An Aellux declaration is missing required HTML structure." },
      WARN_CONTROL_ACCESSIBILITY: { code: 2029, message: "An Aellux control is not reachable with the keyboard." },
      WARN_CONFIGURATION_STYLE: { code: 2030, message: "Effective CSS prevents the declared Aellux behavior." },
      WARN_PRESENT_ANCHOR_TRANSFORM: { code: 2031, message: "Anchor owns transform; Present transform is ignored." },
      WARN_ATTRIBUTE_DUPLICATE: { code: 2032, message: "Duplicate HTML attributes discard values and may affect appearance or behavior." },
      WARN_RESOURCE_CONFLICT: { code: 2033, message: "Behaviors replace the same CSS resource; animate a child element instead." },
      INFO_LEGACY_FALLBACK: { code: 3e3, message: AELLUX + "is starting the Legacy runtime." },
      INFO_PRESENT_MEASURED_LAYOUT: { code: 3001, message: "Present measures size transitions without a direct present-motion child; add one to use the grid layout strategy." },
      INFO_FEEDBACK_MOTION_CUSTOM: { code: 3002, message: "The requested feedback motion is not standard. Standard motions are listed in the diagnostic context." },
      INFO_EXTENSION_INDEX_LOADED: { code: 3003, message: "An extension manifest was loaded." }
    },
    AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS: {
      mode: "full",
      verboseLevel: 0,
      environment: "production",
      forceLegacy: false,
      skipGlobalMount: false,
      cssMotionController: true,
      cssMotionPropertyMaxFPS: 55,
      autoViewportMeta: true,
      basePath: null,
      crossOrigin: null,
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
      { name: "Array", function: ["from", "isArray"] },
      { name: ["HTMLDialogElement", "prototype"], function: ["show", "showModal", "close"] }
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
