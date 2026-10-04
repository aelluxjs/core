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
    var diagnostics = {
      legacy: false,
      supported: false,
      notAvailable: [],
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

  // src/internal/utils-preference-html.js
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
    var diagnostics = buildDiagnostics(constants.AELLUXJS_DIAGNOSTICS);
    var oldShortInstance = root[constants.AELLUXJS_SHORT_JS_NAME];
    var document2 = root.document;
    var preferenceHtml = createPreferenceHtmlHelper(root, function() {
      return api;
    });
    var api = {
      shortJSName: constants.AELLUXJS_SHORT_JS_NAME,
      diagnostics: diagnostics,
      options: constants.AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS,
      minified: false,
      waitLayout: null,
      init: function() {
        throw diagnostics.create(diagnostics.ERROR_NOT_INITIALIZED);
      },
      persist: {
        local: buildPersistMemory(root, "localStorage"),
        session: buildPersistMemory(root, "sessionStorage"),
        preferences: buildPersistMemory(root, "localStorage", "AelluxJsPreferences")
      },
      updatePreferenceAttributesHTML: preferenceHtml.updatePreferenceAttributesHTML,
      on: function(event, handler, options) {
        document2.addEventListener(api.eventName(event), handler, options);
      },
      off: function(event, handler, options) {
        document2.removeEventListener(api.eventName(event), handler, options);
      },
      attr: function(name) {
        name = fromCamelCase2(name);
        return "data-" + constants.AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX.replace(/\?/, name);
      },
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
      ext: function(nameOrUrl, options) {
        var name = fromCamelCase2(api.extName(nameOrUrl));
        var key = toCamelCase2(name);
        var url = nameOrUrl;
        if (key in api.registry.ext) {
          diagnostics.report(diagnostics.ERROR_EXTENSION_DUPLICATE, { extension: name });
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
      extAttach: function(name, object) {
        name = fromCamelCase2(name);
        var key = toCamelCase2(name);
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
      dispatch: function(event, options) {
        api.dispatchFrom(document2, event, options);
      },
      dispatchFrom: function(from, event, options) {
        var obj = document2.createEvent("Event");
        obj.initEvent(api.eventName(event), false, false);
        from.dispatchEvent(obj);
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
      if (typeof document === "undefined") {
        console.log("[aellux.js] Browser not supported.");
        return;
      }
      if (document.querySelector("[" + api.attr("legacy") + "]") || document.querySelector("[" + api.attr("esm") + "]")) return;
      mergeOptions(api.options, options || {});
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
      if (AelluxJs.diagnostics.notAvailable.length !== 0)
        console.log("[aellux.js] " + AelluxJs.diagnostics.notAvailable.join(", ") + " not available in browser.");
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
