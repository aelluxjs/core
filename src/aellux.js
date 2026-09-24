/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { buildPersistMemory } from "./internal/build-persist-memory.js";
import { buildPreferencesMediaQueries } from "./internal/build-preferences-media-queries.js";
import { buildDiagnostics } from "./internal/build-diagnostics.js";

// Aellux boot script: intentionally minimal. Apart from build-time imports, its runtime body and
// internal helpers must remain ES5-compatible; keep feature logic out and use conservative JavaScript.

// It must load either the modern classic-script runtime or the legacy fallback without requiring Promise,
// modules, async/await, or other modern-only features to reach the fallback path.

// Optional browser capabilities must be feature-detected: use matchMedia when available,
// URLSearchParams with a JSON-based persistence fallback, Web Storage with an in-memory
// fallback, and document.currentScript with a script-element lookup fallback.
// Promise-based stylesheet tracking is optional and must be skipped when unavailable.

(function (root) {
  var CONSTANTS = {
    AELLUX_SHORT_JS_NAME: "$ae",
    AELLUX_EXT_SCRIPT_PREFIX: "ext",

    AELLUX_CLASS_NAME_PREFFIX: "ae--?",
    AELLUX_EVENT_NAME_PREFFIX: "Aellux?",
    AELLUX_DATA_ATTRIBUTE_NAME_PREFFIX: "ae-?",

    AELLUX_DIAGNOSTICS: {
      ERROR_BOOTSTRAP_NOT_FOUND: { code: 1000, message: "Aellux boot script could not be located." },
      ERROR_NOT_INITIALIZED: { code: 1001, message: "Aellux has not been initialized." },
      ERROR_INVALID_MODE: { code: 1002, message: "Aellux mode must be basic or full." },
      ERROR_EXTENSION_DUPLICATE: { code: 1101, message: "Aellux Extension is already registered." },
      ERROR_EXTENSION_INITIALIZE: { code: 1102, message: "Aellux Extension failed to initialize." },
      ERROR_EXTENSION_MOUNT: { code: 1103, message: "Aellux Extension failed to mount or unmount an element." },
      ERROR_EXTENSION_UNMOUNT: { code: 1104, message: "Aellux Extension failed to unmount." },
      ERROR_EXTENSION_DESTROY: { code: 1105, message: "Aellux Extension failed to destroy." },
      ERROR_LEGACY_RUNTIME_START: { code: 1201, message: "Aellux Legacy runtime failed to start." },
      ERROR_LEGACY_RUNTIME_LOAD: { code: 1202, message: "Aellux Legacy runtime could not be loaded." }
    },

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
  var diagnostics = buildDiagnostics(CONSTANTS.AELLUX_DIAGNOSTICS);

  var bootstrapScript =
    document.currentScript ||
    document.querySelector("script[src*='aellux.js'],script[src*='aellux.min.js']");

  var aelluxBootstrapSrc = root.__aelluxBootstrapURL ||
    (bootstrapScript && bootstrapScript.src);

  if (!aelluxBootstrapSrc) {
    throw diagnostics.create(diagnostics.ERROR_BOOTSTRAP_NOT_FOUND);
  }

  var aelluxBasePath = aelluxBootstrapSrc
    ? aelluxBootstrapSrc.substring(0,
      aelluxBootstrapSrc.lastIndexOf("/") + 1)
    : "";

  var old$Instance = root[CONSTANTS.AELLUX_SHORT_JS_NAME];

  root.Aellux = {
    shortJSName: CONSTANTS.AELLUX_SHORT_JS_NAME,
    diagnostics: diagnostics,
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
        throw Aellux.diagnostics.create(Aellux.diagnostics.ERROR_INVALID_MODE);
      }

      Aellux.aelluxBasePath = Aellux.options.basePath || aelluxBasePath;
      Aellux.notAvailable = [];

      updatePreferencesAttributesHTML();//SET HTML TO PERSISTED PREFERENCES
      addWeakStyles();
      loadOrchestrator();
    },
    persist: {
      local: buildPersistMemory(root, "localStorage"),
      session: buildPersistMemory(root, "sessionStorage"),
      preferences: buildPersistMemory(root, "localStorage", "AelluxPreferences")
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
        Aellux.diagnostics.report(
          Aellux.diagnostics.ERROR_EXTENSION_DUPLICATE,
          { extension: label }
        );
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
    destroy: function () { },
    dispatchFrom: function (from, event, options) {
      var obj = document.createEvent("Event");
      obj.initEvent(Aellux.eventName(event), false, false);
      from.dispatchEvent(obj);
    },
    dispatch: function (event, options) { Aellux.dispatchFrom(document, event, options); },
    wait: function (extensionName) { throw Aellux.diagnostics.create(Aellux.diagnostics.ERROR_NOT_INITIALIZED); },
    observe: function (element, type) { throw Aellux.diagnostics.create(Aellux.diagnostics.ERROR_NOT_INITIALIZED); },
    unobserve: function (element, type) { throw Aellux.diagnostics.create(Aellux.diagnostics.ERROR_NOT_INITIALIZED); },
    update: function (rootOrSelector) { throw Aellux.diagnostics.create(Aellux.diagnostics.ERROR_NOT_INITIALIZED); },
    unmount: function (rootOrSelector) { throw Aellux.diagnostics.create(Aellux.diagnostics.ERROR_NOT_INITIALIZED); },

    preferencesMediaQueries: buildPreferencesMediaQueries(root)
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
    var runtime = Aellux.options.mode === "basic"
      ? "aellux.orchestrator.legacy"
      : "aellux.full.legacy";
    script.src = Aellux.aelluxBasePath + runtime + scriptExtension;
    script.setAttribute(attr, "true");
    script.onload = function () {
      Aellux.dispatch("Legacy");
      Aellux.startAellux()
        .catch(function (error) {
          Aellux.diagnostics.report(
            Aellux.diagnostics.ERROR_LEGACY_RUNTIME_START,
            { cause: error }
          );
        });
    };
    script.onerror = function () {
      Aellux.diagnostics.report(
        Aellux.diagnostics.ERROR_LEGACY_RUNTIME_LOAD,
        { url: script.src }
      );
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

})(typeof globalThis !== "undefined" ? globalThis : window);
