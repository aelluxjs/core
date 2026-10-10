(function() {
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
    return { clear: clear };
  }

  // src/internal/build-diagnostics.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildDiagnostics(catalog) {
    var levels = { error: 0, warn: 1, info: 2 };
    var consoleMethods = ["error", "warn", "info"];
    var history = [];
    var diagnostics = {
      legacy: false,
      supported: false,
      notAvailable: [],
      levels: levels,
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
        var entries = history.slice(Math.max(0, history.length - lines));
        if (typeof console !== "undefined" && typeof console.log === "function") {
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
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
      var diagnostic = diagnostics.create(definition, context);
      history.push({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        level: level,
        code: definition.code,
        message: definition.message,
        context: context
      });
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
    for (var name in catalog) {
      if (Object.prototype.hasOwnProperty.call(catalog, name)) {
        diagnostics[name] = catalog[name];
      }
    }
    return diagnostics;
  }

  // src/internal/build-persist-memory.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildPersistMemory(root, name, identifier, diagnostics) {
    var defaultIdentifier = identifier ? identifier : "AelluxJsPersist";
    var target;
    try {
      target = root[name] || null;
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
      if (typeof root.URLSearchParams !== "undefined")
        return new root.URLSearchParams(target.getItem(defaultIdentifier) || "");
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

  // src/internal/build-preference-media-queries.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildPreferenceMediaQueries(root) {
    function mediaQuery(query) {
      return typeof root.matchMedia === "function" ? root.matchMedia(query) : null;
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

  // src/internal/build-initial-attr-memory.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var savedAttributes;
  function saveAttr(target, attributes) {
    if (!savedAttributes) savedAttributes = /* @__PURE__ */ new WeakMap();
    var snapshot = [];
    for (var i = 0; i < attributes.length; i++) {
      var name = attributes[i];
      snapshot.push([name, target.getAttribute(name)]);
    }
    savedAttributes.set(target, snapshot);
  }
  function restoreAttr(target) {
    if (!savedAttributes) return;
    var snapshot = savedAttributes.get(target);
    if (!snapshot) return;
    for (var i = 0; i < snapshot.length; i++) {
      var name = snapshot[i][0];
      var value = snapshot[i][1];
      if (value === null) target.removeAttribute(name);
      else target.setAttribute(name, value);
    }
    savedAttributes.delete(target);
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
    toCapitalized: toCapitalized,
    toCamelCase: toCamelCase,
    fromCamelCase: fromCamelCase
  };

  // src/internal/create-preference-html-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createPreferenceHtmlHelper(root, getApi) {
    var document2 = root.document;
    var fromCamelCase2 = utils_name_case_default.fromCamelCase;
    return {
      updatePreferenceAttributesHTML: updatePreferenceAttributesHTML
    };
    function updatePreferenceAttributesHTML(preferences) {
      var api = getApi();
      var allQueries = api.registry.preferenceMediaQueries;
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

  // src/internal/aellux-api-integration.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createAelluxApi(root, constants) {
    var toCapitalized2 = utils_name_case_default.toCapitalized;
    var toCamelCase2 = utils_name_case_default.toCamelCase;
    var fromCamelCase2 = utils_name_case_default.fromCamelCase;
    var options = constants.AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS;
    var diagnostics = buildDiagnostics(constants.AELLUXJS_DIAGNOSTICS);
    var oldShortInstance = root[constants.AELLUXJS_SHORT_JS_NAME];
    var document2 = root.document;
    var preferenceHtml = createPreferenceHtmlHelper(root, function() {
      return api;
    });
    var api = function(elementOrId) {
      return api.mountManager ? api.mountManager.controller(elementOrId) : null;
    };
    var apiProperties = {
      shortJSName: constants.AELLUXJS_SHORT_JS_NAME,
      diagnostics: diagnostics,
      options: options,
      minified: false,
      waitLayout: null,
      mountManager: null,
      init: function() {
        throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
      },
      persist: {
        local: buildPersistMemory(root, "localStorage", null, diagnostics),
        session: buildPersistMemory(root, "sessionStorage", null, diagnostics),
        preferences: buildPersistMemory(root, "localStorage", "AelluxJsPreferences", diagnostics)
      },
      updatePreferenceAttributesHTML: preferenceHtml.updatePreferenceAttributesHTML,
      on: function(event, handler, options2) {
        document2.addEventListener(api.eventName(event), handler, options2);
      },
      off: function(event, handler, options2) {
        document2.removeEventListener(api.eventName(event), handler, options2);
      },
      attr: function(name) {
        name = fromCamelCase2(name);
        return "data-" + constants.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX.replace(/\?/, name);
      },
      attrMem: { save: saveAttr, restore: restoreAttr },
      className: function(name) {
        name = fromCamelCase2(name);
        return constants.AELLUXJS_CLASS_NAME_PREFFIX.replace(/\?/, name);
      },
      extFilename: function(extensionName) {
        extensionName = fromCamelCase2(extensionName);
        return "aellux." + constants.AELLUXJS_EXT_SCRIPT_PREFIX + "." + extensionName + (api.minified ? ".min.js" : ".js");
      },
      extName: function(filename) {
        return filename.replace(
          new RegExp("^.*aellux\\." + constants.AELLUXJS_EXT_SCRIPT_PREFIX + "\\.([^.\\/?#]+)(?:\\.min)?\\.js(?:[?#].*)?$"),
          "$1"
        );
      },
      eventName: function(name) {
        name = toCapitalized2(name);
        return constants.AELLUXJS_EVENT_NAME_PREFFIX.replace(/\?/, name);
      },
      noConflict: function() {
        return oldShortInstance;
      },
      registry: {
        ext: {},
        dep: {},
        lazyExtSelectors: {},
        extMounters: {},
        preferenceMediaQueries: buildPreferenceMediaQueries(root)
      },
      ext: function(nameOrUrl, options2) {
        var name = fromCamelCase2(api.extName(nameOrUrl));
        var key = toCamelCase2(name);
        var url = nameOrUrl;
        if (key in api.registry.ext) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_DUPLICATE, { extension: name });
          return;
        }
        if (url === api.extName(nameOrUrl)) url = "./" + api.extFilename(name);
        if (!options2) options2 = {};
        var selector = options2.loadWhen;
        if (selector !== null && typeof selector !== "undefined") {
          if (typeof selector !== "string" || !selector.trim()) {
            diagnostics.error(diagnostics.ERROR_EXTENSION_LOAD_WHEN, {
              extension: name,
              selector: selector,
              expected: "a valid nonempty CSS selector"
            });
            return;
          }
          try {
            document2.querySelector(selector);
          } catch (cause) {
            diagnostics.error(diagnostics.ERROR_EXTENSION_LOAD_WHEN, {
              extension: name,
              selector: selector,
              cause: cause
            });
            return;
          }
        }
        if (typeof options2.loadStyle === "undefined") options2.loadStyle = false;
        if (!options2.loadWhen) options2.loadWhen = null;
        options2.builds = normalizeExtensionBuilds(options2.builds);
        if (options2.loadWhen) api.registry.lazyExtSelectors[key] = options2.loadWhen;
        options2.url = url;
        options2.load = options2.loadWhen ? false : true;
        options2.state = "wait";
        api.registry.ext[key] = options2;
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
              selector: selector,
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
              selector: selector,
              cause: cause
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
        ERROR_INVALID_VERBOSE_LEVEL: { code: 1003, message: "aellux.js verboseLevel must be 0, 1, 2, or the matching error, warn, info key." },
        ERROR_CONTROLLER_NOT_FOUND: { code: 1004, message: "No controller was found for this element. It may not be mounted." },
        ERROR_MOUNT_ROOT_SELECTOR: { code: 1005, message: "Invalid root selector for mounting or unmounting." },
        ERROR_MOUNT: { code: 1006, message: "aellux.js failed to mount a root." },
        ERROR_EXTENSION_DUPLICATE: { code: 1101, message: "aellux.js Extension is already registered." },
        ERROR_EXTENSION_INITIALIZE: { code: 1102, message: "aellux.js Extension failed to initialize." },
        ERROR_EXTENSION_MOUNT: { code: 1103, message: "aellux.js Extension failed to mount or unmount an element." },
        ERROR_EXTENSION_UNMOUNT: { code: 1104, message: "aellux.js Extension failed to unmount." },
        ERROR_EXTENSION_DESTROY: { code: 1105, message: "aellux.js Extension failed to destroy." },
        ERROR_EXTENSION_INCOMPATIBLE: { code: 1106, message: "aellux.js Extension has no compatible build for the selected runtime." },
        ERROR_EXTENSION_SELECTOR: { code: 1107, message: "aellux.js Extension failed to iterate a selector." },
        ERROR_CALLBACK: { code: 1108, message: "aellux.js Extension selector callback failed." },
        ERROR_EXTENSION_TRANSITION: { code: 1109, message: "aellux.js Extension transition failed." },
        ERROR_EXTENSION_NOT_REGISTERED: { code: 1110, message: "aellux.js Extension is not registered." },
        ERROR_PRESENT_CONTROL_TARGET_MISSING: { code: 1111, message: "A present control has no target selector and is not inside a present container." },
        ERROR_EXTENSION_ATTACH: { code: 1112, message: "aellux.js Extension attachment has invalid arguments." },
        ERROR_MOUNT_REGISTRATION: { code: 1113, message: "aellux.js Mount registration has invalid arguments." },
        ERROR_EXTENSION_LOAD_WHEN: { code: 1114, message: "aellux.js Extension loadWhen selector is invalid." },
        ERROR_MOUNT_MAP_IN_USE: { code: 1115, message: "A mount map cannot be removed while elements are still mounted." },
        ERROR_LEGACY_RUNTIME_START: { code: 1201, message: "aellux.js Legacy runtime failed to start." },
        ERROR_LEGACY_RUNTIME_LOAD: { code: 1202, message: "aellux.js Legacy runtime could not be loaded." },
        ERROR_MODERN_RUNTIME_START: { code: 1203, message: "aellux.js Modern runtime failed to start; trying Legacy runtime." },
        ERROR_MODERN_RUNTIME_LOAD: { code: 1204, message: "aellux.js Modern runtime could not be loaded; trying Legacy runtime." },
        WARN_BROWSER_UNSUPPORTED: { code: 2e3, message: "Browser environment is not available." },
        WARN_BROWSER_CAPABILITIES: { code: 2001, message: "Some browser capabilities are unavailable; trying Legacy runtime." },
        WARN_INTERRUPTION: { code: 2002, message: "aellux.js Extension transition was interrupted." },
        WARN_INVALID_CONTROLLER_ELEMENT: { code: 2003, message: "Controller lookup requires a DOM Element or an existing element ID, optionally prefixed with #." },
        WARN_EXTENSION_STYLE_LOAD: { code: 2004, message: "aellux.js Extension stylesheet could not be loaded." },
        WARN_CONTROLLER_METHOD_MISSING: { code: 2005, message: "A mounted controller method is not available on its Extension." },
        WARN_STORAGE_FALLBACK: { code: 2006, message: "Browser storage is unavailable; values will be kept in memory only." },
        WARN_PRESENT_MOTION_HIDDEN: { code: 2008, message: "A present-motion child should not be hidden; hidden belongs on its present container." },
        WARN_NAVIGATION_EVENT_INVALID: { code: 2009, message: "A state-navigation event has missing or invalid detail properties." },
        INFO_LEGACY_FALLBACK: { code: 3e3, message: "aellux.js is starting the Legacy runtime." }
      },
      AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS: {
        mode: "full",
        verboseLevel: 0,
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

  // src/internal/create-weak-css.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createWeakCss() {
    return "\n:where(html) { color-scheme: light dark; }\n:where(html[?color-scheme='dark']) { color-scheme: dark; }\n:where(html[?color-scheme='light']) { color-scheme: light; }\n:where(body,html) { font-family: system-ui; background-color: Canvas; color: CanvasText; }\n:where(button,a[href],[role='button'],[role='tab']) { touch-action: manipulation; }\n[?wait-mounted]:not(.%mounted) > *:not([?loader]) { visibility: hidden !important; }\n[?wait-mounted].%mounted > [?loader] { display: none !important; }\n:where([?present-motion]) {\n  --ae-from-opacity: 0;\n  --ae-pop-opacity: 1;\n  --ae-unpop-opacity: 0;\n  --ae-from-transform: scale(0.5);\n  --ae-pop-transform: scale(1);\n  --ae-unpop-transform: scale(1.2);\n  --ae-pop-ease: ease-out;\n  --ae-unpop-ease: ease-in;\n  --ae-pop-duration: 250ms;\n  --ae-unpop-duration: 250ms;\n  transition-property: opacity, transform;\n}\n:where([?present-motion]:not(.%popping, .%pop, .%unpopping, [hidden])) {\n  transition-duration: var(--ae-pop-duration), var(--ae-pop-duration);\n  transition-timing-function: linear, var(--ae-pop-ease, linear);\n  opacity: var(--ae-from-opacity, 0);\n  transform: var(--ae-from-transform);\n}\n:where([?present-motion].%popping, [?present-motion].%pop) {\n  transition-duration: var(--ae-pop-duration), var(--ae-pop-duration);\n  transition-timing-function: linear, var(--ae-pop-ease, linear);\n  opacity: var(--ae-pop-opacity, 1);\n  transform: var(--ae-pop-transform);\n}\n:where([?present-motion].%unpopping) {\n  transition-duration: var(--ae-unpop-duration), var(--ae-unpop-duration);\n  transition-timing-function: linear, var(--ae-unpop-ease, linear);\n  opacity: var(--ae-unpop-opacity, 0);\n  transform: var(--ae-unpop-transform);\n}";
  }

  // src/aellux.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    var toCamelCase2 = utils_name_case_default.toCamelCase;
    var CONSTANTS = createAelluxConstants();
    var scriptExtension = ".js";
    var existingApi = root.AelluxJs;
    var api = existingApi && existingApi.shortJSName === CONSTANTS.AELLUXJS_SHORT_JS_NAME && existingApi.registry && existingApi.registry.ext && existingApi.registry.dep && existingApi.registry.lazyExtSelectors && existingApi.registry.extMounters && existingApi.registry.preferenceMediaQueries && existingApi.diagnostics ? existingApi : createAelluxApi(root, CONSTANTS);
    var diagnostics = api.diagnostics;
    var bootstrapScript = document.currentScript || document.querySelector("script[src*='aellux.js'],script[src*='aellux.min.js']");
    var aelluxBootstrapSrc = root.__aelluxBootstrapURL || bootstrapScript && bootstrapScript.src;
    if (!aelluxBootstrapSrc) {
      throw diagnostics.create(diagnostics.ERROR_BOOTSTRAP_NOT_FOUND);
    }
    var aelluxBasePath = aelluxBootstrapSrc.substring(
      0,
      aelluxBootstrapSrc.lastIndexOf("/") + 1
    );
    api.minified = aelluxBootstrapSrc.indexOf(".min.js") !== -1;
    root.AelluxJs = api;
    root[api.shortJSName] = api;
    api.init = function(options) {
      api.options.verboseLevel = diagnostics.update(options);
      if (typeof document === "undefined") {
        diagnostics.warn(diagnostics.WARN_BROWSER_UNSUPPORTED);
        return;
      }
      if (document.querySelector("[" + api.attr("legacy") + "]") || document.querySelector("[" + api.attr("esm") + "]")) return;
      mergeOptions(api.options, options || {});
      api.options.verboseLevel = diagnostics.verboseLevel;
      api.options.extensions = normalizeExtensionOptions(api.options.extensions);
      if (api.options.mode !== "basic" && api.options.mode !== "full") {
        throw diagnostics.create(diagnostics.ERROR_INVALID_MODE);
      }
      api.aelluxBasePath = api.options.basePath || aelluxBasePath;
      api.diagnostics.notAvailable = [];
      api.updatePreferenceAttributesHTML();
      addWeakStyles();
      loadOrchestrator();
    };
    if (api.minified) scriptExtension = ".min.js";
    function loadOrchestrator() {
      var attr = AelluxJs.attr("esm");
      CONSTANTS.AELLUXJS_MODERN_API_DEPENDENCIES.forEach(function(option) {
        if (typeof option === "string") {
          if (typeof window[option] !== "function") {
            AelluxJs.diagnostics.notAvailable.push(option);
          }
        } else {
          option.function.forEach(function(method) {
            if (!window[option.name] || typeof window[option.name][method] !== "function") {
              AelluxJs.diagnostics.notAvailable.push(option.name + "." + method);
            }
          });
        }
      });
      if (!window.Element || typeof window.Element.prototype.matches !== "function")
        AelluxJs.diagnostics.notAvailable.push("Element.matches");
      if (!window.NodeList || typeof window.NodeList.prototype.forEach !== "function")
        AelluxJs.diagnostics.notAvailable.push("NodeList.forEach");
      if (AelluxJs.diagnostics.notAvailable.length !== 0 || isLegacyForced())
        return loadLegacyOrchestratorFallback();
      var script = document.createElement("script");
      if (AelluxJs.options.mode === "basic") {
        script.src = AelluxJs.aelluxBasePath + "aellux.orchestrator" + scriptExtension;
      } else {
        script.src = AelluxJs.aelluxBasePath + "aellux.full" + scriptExtension;
      }
      script.setAttribute(attr, "true");
      assetLoadHelper(script, {
        loadCallback: function() {
          AelluxJs.dispatch("Awake");
          AelluxJs.startAelluxJs().then(function() {
            AelluxJs.diagnostics.legacy = false;
            AelluxJs.diagnostics.supported = true;
          }).catch(function(error) {
            script.parentNode.removeChild(script);
            diagnostics.error(diagnostics.ERROR_MODERN_RUNTIME_START, { cause: error });
            loadLegacyOrchestratorFallback();
          });
        },
        errorCallback: function() {
          script.parentNode.removeChild(script);
          diagnostics.error(diagnostics.ERROR_MODERN_RUNTIME_LOAD, { url: script.src });
          loadLegacyOrchestratorFallback();
        }
      });
    }
    function loadLegacyOrchestratorFallback() {
      var attr = AelluxJs.attr("legacy");
      if (typeof document === "undefined" || document.querySelector("[" + attr + "]"))
        return;
      if (AelluxJs.diagnostics.notAvailable.length !== 0)
        diagnostics.warn(diagnostics.WARN_BROWSER_CAPABILITIES, {
          notAvailable: AelluxJs.diagnostics.notAvailable
        });
      diagnostics.info(diagnostics.INFO_LEGACY_FALLBACK);
      AelluxJs.diagnostics.legacy = true;
      AelluxJs.diagnostics.supported = false;
      var script = document.createElement("script");
      var runtime = AelluxJs.options.mode === "basic" ? "aellux.orchestrator.legacy" : "aellux.full.legacy";
      script.src = AelluxJs.aelluxBasePath + runtime + scriptExtension;
      script.setAttribute(attr, "true");
      assetLoadHelper(script, {
        loadCallback: function() {
          AelluxJs.dispatch("Legacy");
          AelluxJs.startAelluxJs().catch(function(error) {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_LEGACY_RUNTIME_START,
              { cause: error }
            );
          });
        },
        errorCallback: function() {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_LEGACY_RUNTIME_LOAD,
            { url: script.src }
          );
        }
      });
    }
    function addWeakStyles() {
      var attr = AelluxJs.attr("weak-style");
      if (typeof document === "undefined" || document.querySelector("[" + attr + "]"))
        return;
      var style = document.createElement("style");
      style.setAttribute(attr, "true");
      var a = AelluxJs.attr("$1");
      var c = AelluxJs.className("$1");
      style.textContent = createWeakCss().replace(/\?([a-z][0-9a-z\-]*)/gi, a).replace(/\%([a-z][0-9a-z\-]*)/gi, c);
      document.head.appendChild(style);
      if (!document.head.querySelector('meta[name="viewport"]')) {
        var meta = document.createElement("meta");
        meta.name = "viewport";
        meta.content = "width=device-width, initial-scale=1";
        document.head.appendChild(meta);
      }
    }
    function mergeOptions(target, source) {
      if (!source)
        return target;
      for (var key in source) {
        if (!Object.prototype.hasOwnProperty.call(source, key))
          continue;
        if (key === "__proto__" || key === "constructor" || key === "prototype")
          continue;
        var sourceValue = source[key];
        var targetValue = target[key];
        if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue)) {
          if (!targetValue || typeof targetValue !== "object" || Array.isArray(targetValue)) {
            targetValue = {};
            target[key] = targetValue;
          }
          mergeOptions(targetValue, sourceValue);
        } else {
          target[key] = sourceValue;
        }
      }
      return target;
    }
    function normalizeExtensionOptions(extensions) {
      var normalized = {};
      if (!extensions || typeof extensions !== "object" || Array.isArray(extensions)) {
        return normalized;
      }
      for (var name in extensions) {
        if (!Object.prototype.hasOwnProperty.call(extensions, name)) continue;
        var key = toCamelCase2(name);
        var value = extensions[name];
        if (!value || typeof value !== "object" || Array.isArray(value)) value = {};
        if (Object.prototype.hasOwnProperty.call(normalized, key)) {
          mergeOptions(normalized[key], value);
        } else {
          normalized[key] = value;
        }
      }
      return normalized;
    }
    function isLegacyForced() {
      return AelluxJs.options.forceLegacy ? true : /(?:^|[?&])aellux-debug-legacy(?:=1|=true)?(?:&|$)/i.test(window.location.search);
    }
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
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.js.map
