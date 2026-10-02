/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { assetLoadHelper } from "./internal/asset-load-helper.js";
import { createAelluxApi } from "./internal/aellux-api-integration.js";
import { createAelluxConstants } from "./internal/create-aellux-constants.js";
import nameCase from "./internal/utils-name-case.js";

// aellux.js boot script: intentionally minimal. Apart from build-time imports, its runtime body and
// internal helpers must remain ES5-compatible; keep feature logic out and use conservative JavaScript.

// It must load either the modern classic-script runtime or the legacy fallback without requiring Promise,
// modules, async/await, or other modern-only features to reach the fallback path.

// Optional browser capabilities must be feature-detected: use matchMedia when available,
// URLSearchParams with a JSON-based persistence fallback, Web Storage with an in-memory
// fallback, and document.currentScript with a script-element lookup fallback.
// Promise-based stylesheet tracking is optional and must be skipped when unavailable.

(function (root) {
  var toCamelCase = nameCase.toCamelCase;

  var CONSTANTS = createAelluxConstants();

  var scriptExtension = ".js";
  var existingApi = root.AelluxJs;
  var api = existingApi &&
    existingApi.shortJSName === CONSTANTS.AELLUXJS_SHORT_JS_NAME &&
    existingApi.extRegistry && existingApi.diagnostics
    ? existingApi : createAelluxApi(root, CONSTANTS);
  var diagnostics = api.diagnostics;

  var bootstrapScript =
    document.currentScript ||
    document.querySelector("script[src*='aellux.js'],script[src*='aellux.min.js']");

  var aelluxBootstrapSrc = root.__aelluxBootstrapURL ||
    (bootstrapScript && bootstrapScript.src);

  if (!aelluxBootstrapSrc) {
    throw diagnostics.create(diagnostics.ERROR_BOOTSTRAP_NOT_FOUND);
  }

  var aelluxBasePath = aelluxBootstrapSrc.substring(0,
    aelluxBootstrapSrc.lastIndexOf("/") + 1);

  api.minified = aelluxBootstrapSrc.indexOf(".min.js") !== -1;
  root.AelluxJs = api;
  root[api.shortJSName] = api;
  api.init = function (options) {
    if (typeof document === "undefined") { console.log("[aellux.js] Browser not supported."); return; }

    if (document.querySelector("[" + api.attr("legacy") + "]") ||
      document.querySelector("[" + api.attr("esm") + "]")) return; //Already loaded

    mergeOptions(api.options, options || {});
    api.options.extensions = normalizeExtensionOptions(api.options.extensions);

    if (api.options.mode !== "basic" && api.options.mode !== "full") {
      throw diagnostics.create(diagnostics.ERROR_INVALID_MODE);
    }

    api.aelluxBasePath = api.options.basePath || aelluxBasePath;
    api.notAvailable = [];

    api.updatePreferencesAttributesHTML(); // Set HTML to persisted preferences.
    addWeakStyles();
    loadOrchestrator();
  };
  if (api.minified) scriptExtension = ".min.js";

  function loadOrchestrator() {
    var attr = AelluxJs.attr("esm");

    CONSTANTS.AELLUXJS_MODERN_API_DEPENDENCIES
      .forEach(function (option) {
        if (typeof option === "string") {
          if (typeof window[option] !== "function") {
            AelluxJs.notAvailable.push(option);
          }
        } else {
          option.function.forEach(function (method) {
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
      loadCallback: function () {
        AelluxJs.dispatch("Awake");
        AelluxJs.startAelluxJs()
          .then(function () {
            AelluxJs.legacy = false;
            AelluxJs.supported = true;
          }).catch(function (error) {
            script.parentNode.removeChild(script);
            console.log(error);
            console.log("[aellux.js] Orchestrator failed to load, fallback to legacy.");
            loadLegacyOrchestratorFallback();
          });
      },
      errorCallback: function () {
        script.parentNode.removeChild(script);
        console.log("[aellux.js] Orchestrator failed to load, fallback to legacy.");
        loadLegacyOrchestratorFallback();
      }
    });
  }

  function loadLegacyOrchestratorFallback() {
    var attr = AelluxJs.attr("legacy");
    if (typeof document === "undefined" ||
      document.querySelector("[" + attr + "]"))
      return;

    if (AelluxJs.notAvailable.length !== 0)
      console.log("[aellux.js] " + AelluxJs.notAvailable.join(", ") + " not available in browser.");

    AelluxJs.legacy = true;
    AelluxJs.supported = false;

    var script = document.createElement("script");
    var runtime = AelluxJs.options.mode === "basic"
      ? "aellux.orchestrator.legacy"
      : "aellux.full.legacy";
    script.src = AelluxJs.aelluxBasePath + runtime + scriptExtension;
    script.setAttribute(attr, "true");

    assetLoadHelper(script, {
      loadCallback: function () {
        AelluxJs.dispatch("Legacy");
        AelluxJs.startAelluxJs()
          .catch(function (error) {
            AelluxJs.diagnostics.report(
              AelluxJs.diagnostics.ERROR_LEGACY_RUNTIME_START,
              { cause: error }
            );
          });
      },
      errorCallback: function () {
        AelluxJs.diagnostics.report(
          AelluxJs.diagnostics.ERROR_LEGACY_RUNTIME_LOAD,
          { url: script.src }
        );
      }
    });
  }

  function addWeakStyles() {
    var attr = AelluxJs.attr("weak-style");
    if (typeof document === "undefined" ||
      document.querySelector("[" + attr + "]"))
      return;

    var style = document.createElement("style");
    style.setAttribute(attr, "true");
    var a = AelluxJs.attr("$1");
    var c = AelluxJs.className("$1");
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

  function normalizeExtensionOptions(extensions) {
    var normalized = {};
    if (!extensions || typeof extensions !== "object" || Array.isArray(extensions)) {
      return normalized;
    }

    for (var name in extensions) {
      if (!Object.prototype.hasOwnProperty.call(extensions, name)) continue;
      var key = toCamelCase(name);
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
    return AelluxJs.options.forceLegacy ? true : /(?:^|[?&])aellux-debug-legacy(?:=1|=true)?(?:&|$)/i
      .test(window.location.search);
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
