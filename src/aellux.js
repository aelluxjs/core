/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Aellux boot script: intentionally minimal, using ES5-compatible syntax for legacy browsers;
// keep feature logic out of this file and use conservative JavaScript only.

// It must load either the modern classic-script runtime or the legacy fallback without requiring Promise,
// modules, async/await, or other modern-only features to reach the fallback path.

// Optional browser capabilities must be feature-detected: use matchMedia when available,
// URLSearchParams with a JSON-based persistence fallback, Web Storage with an in-memory
// fallback, and document.currentScript with a script-element lookup fallback.
// Promise-based stylesheet tracking is optional and must be skipped when unavailable.

(function () {
  var CONSTANTS = {
    AELLUX_SHORT_JS_NAME: "$ae",
    AELLUX_EXT_SCRIPT_PREFIX: "ext",

    AELLUX_CLASS_NAME_PREFFIX: "ae--?",
    AELLUX_EVENT_NAME_PREFFIX: "Aellux?",
    AELLUX_DATA_ATTRIBUTE_NAME_PREFFIX: "ae-?",

    AELLUX_DEFAULT_INITIALIZATION_OPTIONS: {
      mode: "full",
      forceLegacy: false,
      basePath: null
    },

    AELLUX_MODERN_API_DEPENDENCIES: [
      "Promise", "Map", "ResizeObserver", "MutationObserver",
      "IntersectionObserver", "CustomEvent", "requestAnimationFrame", "fetch",
      { name: "Object", function: ["assign", "entries", "freeze"] },
      { name: "Array", function: ["from", "isArray"] }
    ]
  };

  var scriptExtension = ".js";

  var root =
    typeof globalThis !== "undefined"
      ? globalThis
      : window;

  var bootstrapScript =
    document.currentScript ||
    document.querySelector("script[src*='aellux.js'],script[src*='aellux.min.js']");

  var aelluxBootstrapSrc = root.__aelluxBootstrapURL ||
    (bootstrapScript && bootstrapScript.src);

  if (!aelluxBootstrapSrc) {
    throw new Error("[Aellux] Bootstrap script could not be located.");
  }

  var aelluxBasePath = aelluxBootstrapSrc
    ? aelluxBootstrapSrc.substring(0,
      aelluxBootstrapSrc.lastIndexOf("/") + 1)
    : "";

  var old$Instance = root[CONSTANTS.AELLUX_SHORT_JS_NAME];

  root.Aellux = {
    shortJSName: CONSTANTS.AELLUX_SHORT_JS_NAME,
    options: CONSTANTS.AELLUX_DEFAULT_INITIALIZATION_OPTIONS,
    minified: aelluxBootstrapSrc.indexOf(".min.js") !== -1,
    legacy: false,
    supported: false,
    notAvailable: [],
    observers: null,
    waitLayout: null,
    init: function (options) {
      if (typeof document === "undefined") { console.log("[Aellux] Browser not supported."); return; }

      if (document.querySelector("[" + Aellux.attr("legacy") + "]") ||
        document.querySelector("[" + Aellux.attr("esm") + "]")) return; //Already loaded

      mergeOptions(Aellux.options, options || {});

      if (Aellux.options.mode !== "basic" && Aellux.options.mode !== "full") {
        throw new Error("[Aellux] mode must be basic or full.");
      }

      Aellux.aelluxBasePath = Aellux.options.basePath || aelluxBasePath;
      Aellux.notAvailable = [];

      updatePreferencesAttributesHTML();//SET HTML TO PERSISTED PREFERENCES
      addWeakStyles();
      loadOrchestrator();
    },
    destroy: function () { return false; },
    persist: {
      local: buildPersistMemory("localStorage"),
      session: buildPersistMemory("sessionStorage"),
      preferences: buildPersistMemory("localStorage", "AelluxPreferences")
    },
    updatePreferencesAttributesHTML: updatePreferencesAttributesHTML,
    on: function (event, handler, options) { document.addEventListener(Aellux.eventName(event), handler, options); },
    off: function (event, handler, options) { document.removeEventListener(Aellux.eventName(event), handler, options); },
    attr: function (name) { return "data-" + CONSTANTS.AELLUX_DATA_ATTRIBUTE_NAME_PREFFIX.replace(/\?/, name); },
    className: function (name) { return CONSTANTS.AELLUX_CLASS_NAME_PREFFIX.replace(/\?/, name); },
    extFilename: function (name) { return "aellux." + CONSTANTS.AELLUX_EXT_SCRIPT_PREFIX + "." + name + scriptExtension; },
    extLabel: function (filename) {
      return filename.replace(
        new RegExp("^.*aellux\\." + CONSTANTS.AELLUX_EXT_SCRIPT_PREFIX + "\\.([^.\\/?#]+)(?:\\.min)?\\.js(?:[?#].*)?$"),
        "$1"
      );
    },
    eventName: function (name) { return CONSTANTS.AELLUX_EVENT_NAME_PREFFIX.replace(/\?/, toCapitalized(name)); },
    noConflict: function () { return old$Instance; },

    lazyExtensionSelectors: {},
    extensionMounters: {},
    extRegistry: {},
    ext: function (labelOrUrl, options) {
      var label = fromCamelCase(Aellux.extLabel(labelOrUrl));
      var url = labelOrUrl;
      if (label in Aellux.extRegistry) {
        console.error("Duplicate ext");
        return;
      }
      if (url === label) url = "./" + Aellux.extFilename(label);
      if (!options) options = {};
      if (typeof options.loadStyle === "undefined") options.loadStyle = false;
      if (!options.loadWhen) options.loadWhen = null;
      if (options.loadWhen) { Aellux.lazyExtensionSelectors[label] = options.loadWhen; }
      options.url = url;
      options.load = options.loadWhen ? false : true;
      options.state = "wait";
      Aellux.extRegistry[label] = options;
    },
    extRegister: function (label, object) {
      label = fromCamelCase(label);
      var key = toCamelCase(label);
      Aellux.extRegistry[label].state = "register";
      object.initialized = false;
      Aellux[key] = object;
    },

    startAellux: function () { },
    dispatchFrom: function (from, event, options) {
      var obj = document.createEvent("Event");
      obj.initEvent(Aellux.eventName(event), false, false);
      from.dispatchEvent(obj);
    },
    dispatch: function (event, options) { Aellux.dispatchFrom(document, event, options); },
    wait: function (extensionName) { throw new Error("[Aellux] Aellux não foi inicializado"); },
    observe: function (element, type) { throw new Error("[Aellux] Aellux não foi inicializado"); },
    unobserve: function (element, type) { throw new Error("[Aellux] Aellux não foi inicializado"); },
    update: function (element) { throw new Error("[Aellux] Aellux não foi inicializado"); },

    preferencesMediaQueries: {
      colorScheme: {
        "light": !window.matchMedia ? null : window.matchMedia("(prefers-color-scheme: light)"),
        "dark": !window.matchMedia ? null : window.matchMedia("(prefers-color-scheme: dark)")
      },
      reducedMotion: {
        "reduced": !window.matchMedia ? null : window.matchMedia("(prefers-reduced-motion: reduced)"),
        "no-preference": !window.matchMedia ? null : window.matchMedia("(prefers-reduced-motion: no-preference)")
      },
      reducedTransparency: {
        "reduced": !window.matchMedia ? null : window.matchMedia("(prefers-reduced-transparency: reduced)"),
        "no-preference": !window.matchMedia ? null : window.matchMedia("(prefers-reduced-transparency: no-preference)")
      },
      forcedColors: {
        "active": !window.matchMedia ? null : window.matchMedia("(forced-colors: active)"),
        "no-preference": !window.matchMedia ? null : window.matchMedia("(forced-colors: no-preference)")
      },
      contrast: {
        "more": !window.matchMedia ? null : window.matchMedia("(prefers-contrast: more)"),
        "less": !window.matchMedia ? null : window.matchMedia("(prefers-contrast: less)"),
        "no-preference": !window.matchMedia ? null : window.matchMedia("(prefers-contrast: no-preference)")
      },
    },
  };

  root[CONSTANTS.AELLUX_SHORT_JS_NAME] = root.Aellux;
  if (Aellux.minified) { scriptExtension = ".min.js"; }

  function loadOrchestrator() {
    var attr = Aellux.attr("esm");

    CONSTANTS.AELLUX_MODERN_API_DEPENDENCIES
      .forEach(function (option) {
        if (typeof option === "string") {
          if (typeof window[option] !== "function") {
            Aellux.notAvailable.push(option);
          }
        } else {
          option.function.forEach(function (method) {
            if (!window[option.name] || typeof window[option.name][method] !== "function") {
              Aellux.notAvailable.push(option.name + "." + method);
            }
          });
        }
      });

    if (!window.Element || typeof window.Element.prototype.matches !== "function")
      Aellux.notAvailable.push("Element.matches");
    if (!window.NodeList || typeof window.NodeList.prototype.forEach !== "function")
      Aellux.notAvailable.push("NodeList.forEach");

    if (Aellux.notAvailable.length !== 0 || isLegacyForced())
      return loadLegacyOrchestratorFallback();

    var script = document.createElement("script");
    if (Aellux.options.mode === "basic") {
      script.src = Aellux.aelluxBasePath + "aellux.orchestrator" + scriptExtension;
    } else {
      script.src = Aellux.aelluxBasePath + "aellux.full" + scriptExtension;
    }
    script.setAttribute(attr, "true");
    script.onload = function () {
      Aellux.dispatch("Awake");
      Aellux.startAellux()
        .then(function () {
          Aellux.legacy = false;
          Aellux.supported = true;
        }).catch(function (error) {
          script.parentNode.removeChild(script);
          console.log(error);
          console.log("[Aellux] Orchestrator failed to load, fallback to legacy.");
          loadLegacyOrchestratorFallback();
        });
    };
    script.onerror = function () {
      script.parentNode.removeChild(script);
      console.log("[Aellux] Orchestrator failed to load, fallback to legacy.");
      loadLegacyOrchestratorFallback();
    };
    document.head.appendChild(script);
  }

  function loadLegacyOrchestratorFallback() {
    var attr = Aellux.attr("legacy");
    if (typeof document === "undefined" ||
      document.querySelector("[" + attr + "]"))
      return;

    if (Aellux.notAvailable.length !== 0)
      console.log("[Aellux] " + Aellux.notAvailable.join(", ") + " not available in browser.");

    Aellux.legacy = true;
    Aellux.supported = false;

    var script = document.createElement("script");
    script.src = Aellux.aelluxBasePath + "aellux.orchestrator.legacy" + scriptExtension;
    script.setAttribute(attr, "true");
    script.onload = function () {
      Aellux.dispatch("Legacy");
    };
    script.onerror = function () {
      console.error("[Aellux] Legacy fallback could not be loaded.");
    };
    document.head.appendChild(script);
  }

  function addWeakStyles() {
    var attr = Aellux.attr("weak-style");
    if (typeof document === "undefined" ||
      document.querySelector("[" + attr + "]"))
      return;

    var style = document.createElement("style");
    style.setAttribute(attr, "true");
    var a = Aellux.attr("$1");
    var c = Aellux.className("$1");
    style.textContent = (":where(html){color-scheme:light dark;}" +
      ":where(html[?color-scheme='dark']){color-scheme:dark;}" + //pref force
      ":where(html[?color-scheme='light']){color-scheme:light;}" + //pref force
      ":where(body,html) {font-family:system-ui;background-color:Canvas;color:CanvasText;}" +
      ":where(button,a[href],[role='button'],[role='tab']){touch-action:manipulation;}" +
      "[?wait-mounted]:not(.%mounted) > *:not([?loader]) {visibility: hidden!important;}" +
      "[?wait-mounted].%mounted > [?loader] {display: none!important;}")
      .replace(/\?([a-z][0-9a-z\-]*)/gi, a)
      .replace(/\%([a-z][0-9a-z\-]*)/gi, c);
    document.head.appendChild(style);

    if (!document.querySelector('meta[name="viewport"]')) {
      var meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1";
      document.head.appendChild(meta);
    }
  }

  function updatePreferencesAttributesHTML(preferences) {
    var allQueries = Aellux.preferencesMediaQueries;
    preferences = preferences ? preferences : Aellux.persist.preferences.getObject();
    for (var param in allQueries) {
      var queries = allQueries[param];
      for (var value in queries) {
        var query = queries[value];
        if (!preferences || !preferences[param] || preferences[param] === "auto") {
          if (!query || !query.matches) { continue; }
        } else if (preferences[param] !== value) { continue; }
        var hyphenized = fromCamelCase(param);
        document.documentElement.setAttribute(Aellux.attr(hyphenized), value);
      }
    }
  }

  function buildPersistMemory(name, identifier) {
    var defaultIdentifier = identifier ? identifier : "AelluxPersist";

    try {
      var target = window[name] || null;
      if (!target ||
        typeof target.setItem !== "function" ||
        typeof target.getItem !== "function") {
        throw new Error("Storage unavailable");
      }
    } catch (error) {
      var target = {
        data: {},
        setItem: function (key, value) { this.data[key] = value; },
        getItem: function (key) { return this.data[key] ? this.data[key] : null; }
      };
    }

    var fallback = {
      data: {},
      keys: function () {
        var keys = [];
        for (var key in this.data) {
          if (Object.prototype.hasOwnProperty.call(this.data, key)) {
            keys.push(key);
          }
        }
        return keys;
      },
      get: function (key) { return this.data[key] ? this.data[key] : null; },
      set: function (key, value) { this.data[key] = value },
      toString: function () { return JSON.stringify(this.data); },
    };

    function getData() {
      if (typeof URLSearchParams !== "undefined")
        return new URLSearchParams(target.getItem(defaultIdentifier) || "");
      else {
        fallback.data = JSON.parse(target.getItem(defaultIdentifier) || "{}");
        return fallback;
      }
    }

    return {
      get: function (key, fallback) {
        return getData().get(key) || fallback;
      },
      set: function (key, value) {
        var data = getData();
        data.set(key, value);
        return target.setItem(defaultIdentifier, data.toString());
      },
      setObject: function (object) {
        var data = getData();
        for (var key in object) {
          var value = object[key];
          data.set(key, value);
        }
        return target.setItem(defaultIdentifier, data.toString());
      },
      getObject: function () {
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
          keys.forEach(function (key) {
            object[key] = data.get(key);
          });
        }
        return object;
      }
    };
  }

  function mergeOptions(target, source) {
    if (!source)
      return target;

    for (var key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key))
        continue;
      if (
        key === "__proto__" ||
        key === "constructor" ||
        key === "prototype"
      )
        continue;
      var sourceValue = source[key];
      var targetValue = target[key];

      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue)
      ) {

        if (
          !targetValue ||
          typeof targetValue !== "object" ||
          Array.isArray(targetValue)
        ) {
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
    return Aellux.options.forceLegacy ? true : /(?:^|[?&])aellux-debug-legacy(?:=1|=true)?(?:&|$)/i
      .test(window.location.search);
  }

  function toCapitalized(name) {
    return name.replace(/^([a-z])|-([a-z])/g, function (_, first, afterHyphen) {
      return (first || afterHyphen).toUpperCase();
    });
  };
  function toCamelCase(name) { return name.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); };
  function fromCamelCase(name) { return name.replace(/([A-Z])/g, "-$1").toLowerCase(); };
})();
