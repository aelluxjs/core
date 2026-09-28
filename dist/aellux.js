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

  // src/internal/build-persist-memory.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildPersistMemory(root, name, identifier) {
    var defaultIdentifier = identifier ? identifier : "AelluxJsPersist";
    var target;
    try {
      target = root[name] || null;
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

  // src/internal/build-preferences-media-queries.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildPreferencesMediaQueries(root) {
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

  // src/aellux.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    var CONSTANTS = {
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
        basePath: null
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
    var scriptExtension = ".js";
    var diagnostics = buildDiagnostics(CONSTANTS.AELLUXJS_DIAGNOSTICS);
    var bootstrapScript = document.currentScript || document.querySelector("script[src*='aellux.js'],script[src*='aellux.min.js']");
    var aelluxBootstrapSrc = root.__aelluxBootstrapURL || bootstrapScript && bootstrapScript.src;
    if (!aelluxBootstrapSrc) {
      throw diagnostics.create(diagnostics.ERROR_BOOTSTRAP_NOT_FOUND);
    }
    var aelluxBasePath = aelluxBootstrapSrc ? aelluxBootstrapSrc.substring(
      0,
      aelluxBootstrapSrc.lastIndexOf("/") + 1
    ) : "";
    var old$Instance = root[CONSTANTS.AELLUXJS_SHORT_JS_NAME];
    root.AelluxJs = {
      shortJSName: CONSTANTS.AELLUXJS_SHORT_JS_NAME,
      diagnostics: diagnostics,
      options: CONSTANTS.AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS,
      minified: aelluxBootstrapSrc.indexOf(".min.js") !== -1,
      legacy: false,
      supported: false,
      notAvailable: [],
      waitLayout: null,
      init: function(options) {
        if (typeof document === "undefined") {
          console.log("[aellux.js] Browser not supported.");
          return;
        }
        if (document.querySelector("[" + AelluxJs.attr("legacy") + "]") || document.querySelector("[" + AelluxJs.attr("esm") + "]")) return;
        mergeOptions(AelluxJs.options, options || {});
        if (AelluxJs.options.mode !== "basic" && AelluxJs.options.mode !== "full") {
          throw AelluxJs.diagnostics.create(AelluxJs.diagnostics.ERROR_INVALID_MODE);
        }
        AelluxJs.aelluxBasePath = AelluxJs.options.basePath || aelluxBasePath;
        AelluxJs.notAvailable = [];
        updatePreferencesAttributesHTML();
        addWeakStyles();
        loadOrchestrator();
      },
      persist: {
        local: buildPersistMemory(root, "localStorage"),
        session: buildPersistMemory(root, "sessionStorage"),
        preferences: buildPersistMemory(root, "localStorage", "AelluxJsPreferences")
      },
      updatePreferencesAttributesHTML: updatePreferencesAttributesHTML,
      on: function(event, handler, options) {
        document.addEventListener(AelluxJs.eventName(event), handler, options);
      },
      off: function(event, handler, options) {
        document.removeEventListener(AelluxJs.eventName(event), handler, options);
      },
      attr: function(name) {
        return "data-" + CONSTANTS.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX.replace(/\?/, name);
      },
      className: function(name) {
        return CONSTANTS.AELLUXJS_CLASS_NAME_PREFFIX.replace(/\?/, name);
      },
      extFilename: function(name) {
        return "aellux." + CONSTANTS.AELLUXJS_EXT_SCRIPT_PREFIX + "." + name + scriptExtension;
      },
      extLabel: function(filename) {
        return filename.replace(
          new RegExp("^.*aellux\\." + CONSTANTS.AELLUXJS_EXT_SCRIPT_PREFIX + "\\.([^.\\/?#]+)(?:\\.min)?\\.js(?:[?#].*)?$"),
          "$1"
        );
      },
      eventName: function(name) {
        return CONSTANTS.AELLUXJS_EVENT_NAME_PREFFIX.replace(/\?/, toCapitalized(name));
      },
      noConflict: function() {
        return old$Instance;
      },
      lazyExtensionSelectors: {},
      extensionMounters: {},
      extRegistry: {},
      ext: function(labelOrUrl, options) {
        var label = fromCamelCase(AelluxJs.extLabel(labelOrUrl));
        var url = labelOrUrl;
        if (label in AelluxJs.extRegistry) {
          AelluxJs.diagnostics.report(
            AelluxJs.diagnostics.ERROR_EXTENSION_DUPLICATE,
            { extension: label }
          );
          return;
        }
        if (url === label) url = "./" + AelluxJs.extFilename(label);
        if (!options) options = {};
        if (typeof options.loadStyle === "undefined") options.loadStyle = false;
        if (!options.loadWhen) options.loadWhen = null;
        options.builds = normalizeExtensionBuilds(options.builds);
        if (options.loadWhen) {
          AelluxJs.lazyExtensionSelectors[label] = options.loadWhen;
        }
        options.url = url;
        options.load = options.loadWhen ? false : true;
        options.state = "wait";
        AelluxJs.extRegistry[label] = options;
      },
      extRegister: function(label, object) {
        label = fromCamelCase(label);
        var key = toCamelCase(label);
        AelluxJs.extRegistry[label].state = "register";
        object.initialized = false;
        AelluxJs[key] = object;
      },
      startAelluxJs: function() {
      },
      destroy: function() {
      },
      dispatchFrom: function(from, event, options) {
        var obj = document.createEvent("Event");
        obj.initEvent(AelluxJs.eventName(event), false, false);
        from.dispatchEvent(obj);
      },
      dispatch: function(event, options) {
        AelluxJs.dispatchFrom(document, event, options);
      },
      wait: function(extensionName) {
        throw AelluxJs.diagnostics.create(AelluxJs.diagnostics.ERROR_NOT_INITIALIZED);
      },
      update: function(rootOrSelector) {
        throw AelluxJs.diagnostics.create(AelluxJs.diagnostics.ERROR_NOT_INITIALIZED);
      },
      unmount: function(rootOrSelector) {
        throw AelluxJs.diagnostics.create(AelluxJs.diagnostics.ERROR_NOT_INITIALIZED);
      },
      preferencesMediaQueries: buildPreferencesMediaQueries(root)
    };
    root[CONSTANTS.AELLUXJS_SHORT_JS_NAME] = root.AelluxJs;
    if (AelluxJs.minified) {
      scriptExtension = ".min.js";
    }
    function loadOrchestrator() {
      var attr = AelluxJs.attr("esm");
      CONSTANTS.AELLUXJS_MODERN_API_DEPENDENCIES.forEach(function(option) {
        if (typeof option === "string") {
          if (typeof window[option] !== "function") {
            AelluxJs.notAvailable.push(option);
          }
        } else {
          option.function.forEach(function(method) {
            if (!window[option.name] || typeof window[option.name][method] !== "function") {
              AelluxJs.notAvailable.push(option.name + "." + method);
            }
          });
        }
      });
      if (!window.Element || typeof window.Element.prototype.matches !== "function")
        AelluxJs.notAvailable.push("Element.matches");
      if (!window.NodeList || typeof window.NodeList.prototype.forEach !== "function")
        AelluxJs.notAvailable.push("NodeList.forEach");
      if (AelluxJs.notAvailable.length !== 0 || isLegacyForced())
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
            AelluxJs.legacy = false;
            AelluxJs.supported = true;
          }).catch(function(error) {
            script.parentNode.removeChild(script);
            console.log(error);
            console.log("[aellux.js] Orchestrator failed to load, fallback to legacy.");
            loadLegacyOrchestratorFallback();
          });
        },
        errorCallback: function() {
          script.parentNode.removeChild(script);
          console.log("[aellux.js] Orchestrator failed to load, fallback to legacy.");
          loadLegacyOrchestratorFallback();
        }
      });
    }
    function loadLegacyOrchestratorFallback() {
      var attr = AelluxJs.attr("legacy");
      if (typeof document === "undefined" || document.querySelector("[" + attr + "]"))
        return;
      if (AelluxJs.notAvailable.length !== 0)
        console.log("[aellux.js] " + AelluxJs.notAvailable.join(", ") + " not available in browser.");
      AelluxJs.legacy = true;
      AelluxJs.supported = false;
      var script = document.createElement("script");
      var runtime = AelluxJs.options.mode === "basic" ? "aellux.orchestrator.legacy" : "aellux.full.legacy";
      script.src = AelluxJs.aelluxBasePath + runtime + scriptExtension;
      script.setAttribute(attr, "true");
      assetLoadHelper(script, {
        loadCallback: function() {
          AelluxJs.dispatch("Legacy");
          AelluxJs.startAelluxJs().catch(function(error) {
            AelluxJs.diagnostics.report(
              AelluxJs.diagnostics.ERROR_LEGACY_RUNTIME_START,
              { cause: error }
            );
          });
        },
        errorCallback: function() {
          AelluxJs.diagnostics.report(
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
      style.textContent = ":where(html){color-scheme:light dark;}:where(html[?color-scheme='dark']){color-scheme:dark;}:where(html[?color-scheme='light']){color-scheme:light;}:where(body,html) {font-family:system-ui;background-color:Canvas;color:CanvasText;}:where(button,a[href],[role='button'],[role='tab']){touch-action:manipulation;}[?wait-mounted]:not(.%mounted) > *:not([?loader]) {visibility: hidden!important;}[?wait-mounted].%mounted > [?loader] {display: none!important;}".replace(/\?([a-z][0-9a-z\-]*)/gi, a).replace(/\%([a-z][0-9a-z\-]*)/gi, c);
      document.head.appendChild(style);
      if (!document.querySelector('meta[name="viewport"]')) {
        var meta = document.createElement("meta");
        meta.name = "viewport";
        meta.content = "width=device-width, initial-scale=1";
        document.head.appendChild(meta);
      }
    }
    function updatePreferencesAttributesHTML(preferences) {
      var allQueries = AelluxJs.preferencesMediaQueries;
      preferences = preferences ? preferences : AelluxJs.persist.preferences.getObject();
      for (var param in allQueries) {
        var queries = allQueries[param];
        for (var value in queries) {
          var query = queries[value];
          if (!preferences || !preferences[param] || preferences[param] === "auto") {
            if (!query || !query.matches) {
              continue;
            }
          } else if (preferences[param] !== value) {
            continue;
          }
          var hyphenized = fromCamelCase(param);
          document.documentElement.setAttribute(AelluxJs.attr(hyphenized), value);
        }
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
    function toCapitalized(name) {
      return name.replace(/^([a-z])|-([a-z])/g, function(_, first, afterHyphen) {
        return (first || afterHyphen).toUpperCase();
      });
    }
    ;
    function toCamelCase(name) {
      return name.replace(/-([a-z])/g, function(_, c) {
        return c.toUpperCase();
      });
    }
    ;
    function fromCamelCase(name) {
      return name.replace(/([A-Z])/g, "-$1").toLowerCase();
    }
    ;
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.js.map
