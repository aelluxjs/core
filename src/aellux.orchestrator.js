/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// aellux.js orchestrator: extends the bootstrap with shared modern-runtime services.
// Loads and caches configured aellux.js Extensions, initializes them, and dispatches the Ready event.
// Ready signals that the orchestrator is initialized and available; it does not guarantee
// successful aellux.js Extension initialization or completed DOM mounting. Component-specific events
// such as Extension-specific events report their own readiness or updates.
// Routes explicit DOM update/unmount requests through extension mount/unmount declarations
// and provides layout scheduling and fetch helpers.
// Uses ES2017 syntax, Promises, and modern browser APIs; legacy fallback
// selection belongs to the bootstrap, while feature-specific behavior belongs to aellux.js Extensions.

import { assetLoadHelper } from "./internal/asset-load-helper.js";
import { createLayoutScheduler } from "./internal/create-layout-scheduler.js";
import { createMountHelper } from "./internal/create-mount-helper.js";
import utilsNameCase from "./internal/utils-name-case.js";

(function (root) {
  "use strict";

  const { toCamelCase, fromCamelCase } = utilsNameCase;

  const extensionPromises = {};
  const mountHelper = createMountHelper(root, extensionPromises);
  const layoutScheduler = createLayoutScheduler();

  // Keep the boot API object: its methods close over the same instance.
  root.AelluxJs = Object.assign(
    root.AelluxJs,
    {
      async startAelluxJs() {
        if (root.AelluxJs.bundledExtensions) {
          Object.keys(root.AelluxJs.bundledExtensions)
            .forEach(key => AelluxJs.ext(key));
        }

        await new Promise((resolve) => {
          const startUpdateCallback = function () {
            AelluxJs.update().then(function () {
              document.removeEventListener(
                "DOMContentLoaded", startUpdateCallback
              );
              resolve();
            });
          };

          if (document.readyState === "loading")
            document.addEventListener(
              "DOMContentLoaded", startUpdateCallback,
              { once: true }
            );
          else
            startUpdateCallback();
        });

        AelluxJs.dispatch("Ready");

        return true;
      },
      async update(rootOrSelector, extensionNames = null) {
        return mountHelper.AelluxJsForceUpdate(rootOrSelector, extensionNames);
      },
      async unmount(rootOrSelector, extensionNames = null) {
        return mountHelper.AelluxJsForceUnmount(rootOrSelector, extensionNames);
      },
      async destroy() {
        AelluxJs.waitLayout.clear();
        await AelluxJs.destroyExtensions();
      },
      async destroyExtensions(extensionNames) {
        if (typeof extensionNames === "string")
          extensionNames = [extensionNames];

        if (!extensionNames)
          extensionNames = Object.keys(extensionPromises)

        extensionNames = extensionNames.map(_ => fromCamelCase(_));

        try {
          await AelluxJs.unmount(document, extensionNames);
        } catch (error) {
          AelluxJs.diagnostics.report(
            AelluxJs.diagnostics.ERROR_EXTENSION_UNMOUNT,
            { cause: error, extensions: extensionNames }
          );
        }

        for (const extensionName of extensionNames) {
          const key = toCamelCase(extensionName);
          let extension;
          try {
            if (!extensionPromises[key]) continue;
            extension = await extensionPromises[key];
            if (extension && extension.destroy) {
              await extension.destroy();
            }
          } catch (error) {
            AelluxJs.diagnostics.report(
              AelluxJs.diagnostics.ERROR_EXTENSION_DESTROY,
              { cause: error, extension: extensionName }
            );
          } finally {
            delete AelluxJs.ext[key];
            delete extensionPromises[key];
            delete AelluxJs.registry.ext[key];
            delete AelluxJs.registry.extMounters[key];
            delete AelluxJs.registry.lazyExtSelectors[key];
            if (extension) extension.initialized = false;
          }
        }
      },

      dispatchFrom(from, event, options) {
        return from.dispatchEvent(new CustomEvent(AelluxJs.eventName(event), options));
      },

      wait(extensionName) { return getExtension(extensionName); },

      request: defaultRequest,

      waitLayout: layoutScheduler,
    });

  root[root.AelluxJs.shortJSName] = root.AelluxJs;

  function getExtension(extensionName) {
    extensionName = fromCamelCase(extensionName);
    const key = toCamelCase(extensionName);

    if (extensionPromises[key])
      return extensionPromises[key];

    const data = AelluxJs.registry.ext[key];
    if (data && !hasCompatibleBuild(data)) {
      AelluxJs.diagnostics.report(
        AelluxJs.diagnostics.ERROR_EXTENSION_INCOMPATIBLE,
        {
          extension: extensionName,
          runtime: AelluxJs.diagnostics.legacy ? "legacy" : "modern",
          builds: data.builds
        }
      );
      delete AelluxJs.registry.lazyExtSelectors[key];
      extensionPromises[key] = Promise.resolve(null);
      return extensionPromises[key];
    }

    if (AelluxJs.ext[key]) {
      if (!AelluxJs.ext[key].initialized) {
        try {
          extensionInitialize(extensionName);
        } catch (error) {
          AelluxJs.diagnostics.report(
            AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
            { cause: error, extension: extensionName }
          );
          extensionPromises[key] = Promise.resolve(null);
          return extensionPromises[key];
        }
      }
      extensionPromises[key] = Promise.resolve(AelluxJs.ext[key]);
      return extensionPromises[key];
    }

    if (!(key in AelluxJs.registry.ext)) { return Promise.reject(); }

    const bundledLoader =
      AelluxJs.bundledExtensions ?
        AelluxJs.bundledExtensions[key] :
        null;

    extensionPromises[key] =
      (bundledLoader
        ? Promise.resolve().then(() => bundledLoader())
        : appendExtensionAssets(extensionName))
        .then(() => extensionInitialize(extensionName))
        .catch((error) => {
          AelluxJs.diagnostics.report(
            AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
            { cause: error, extension: extensionName }
          );
          return null;
        });

    return extensionPromises[key];
  }

  function extensionInitialize(extensionName) {
    extensionName = fromCamelCase(extensionName);
    const key = toCamelCase(extensionName);
    const options = AelluxJs.options.extensions[key] || {};
    AelluxJs.ext[key].init(options);
    AelluxJs.ext[key].initialized = true;

    if (AelluxJs.ext[key].mountMap) {
      const selectors = Array.from(AelluxJs.ext[key].mountMap.keys()).join(",");
      if (selectors) AelluxJs.registry.extMounters[key] = selectors;
    }

    //Clean lazy registry
    delete AelluxJs.registry.lazyExtSelectors[key];

    return AelluxJs.ext[key];
  }

  async function appendExtensionAssets(extensionName) {
    extensionName = fromCamelCase(extensionName);
    const key = toCamelCase(extensionName);
    const data = AelluxJs.registry.ext[key];
    const url = data.url.replace(/^\.\//, AelluxJs.aelluxBasePath);
    const useLegacyBuild = AelluxJs.diagnostics.legacy || data.builds.indexOf("modern") === -1;
    const scriptURL = useLegacyBuild ? toLegacyScriptURL(url) : url;
    const loadPromises = [];

    loadPromises.push(new Promise(
      (resolve, reject) => {
        const attr = AelluxJs.attr("ext");
        const script = document.createElement("script");
        script.src = scriptURL;
        script.setAttribute(attr, extensionName);

        assetLoadHelper(script, {
          loadCallback: resolve,
          errorCallback: reject
        });
      }
    ));

    if (data.loadStyle && data.loadStyle !== "false") {
      loadPromises.push(new Promise(
        (resolve) => {
          const styleDefaultURL = data.loadStyle === true ||
            data.loadStyle === "true" || data.loadStyle === "";
          const href = styleDefaultURL ? url.replace(/\.js(?=[?#]|$)/, ".css") : data.loadStyle;
          const attrStyle = AelluxJs.attr("ext-style");
          const link = document.createElement("link");
          link.href = href;
          link.rel = "stylesheet";
          link.setAttribute(attrStyle, extensionName);

          assetLoadHelper(link, {
            loadCallback: resolve,
            errorCallback: resolve
          });
        }
      ));
    }

    return Promise.all(loadPromises);
  }

  function toLegacyScriptURL(url) {
    return url.replace(
      /(?:\.legacy)?(?:\.min)?\.js(?=[?#]|$)/,
      ".legacy" + (AelluxJs.minified ? ".min" : "") + ".js"
    );
  }

  function hasCompatibleBuild(data) {
    if (!data || !Array.isArray(data.builds) || data.builds.length === 0) return false;
    if (AelluxJs.diagnostics.legacy) return data.builds.indexOf("legacy") !== -1;
    return data.builds.indexOf("modern") !== -1 || data.builds.indexOf("legacy") !== -1;
  }

  function defaultRequest(url, options) {
    var requestOptions = Object.assign(
      { method: "GET", credentials: "same-origin" },
      options
    );
    return fetch(url, requestOptions)
      .then(function (response) {
        if (!response.ok) {
          var error = new Error("HTTP " + response.status + " " + response.statusText);
          error.name = "AelluxJsRequestError";
          error.status = response.status;
          error.statusText = response.statusText;
          error.response = response;
          throw error;
        }
        return response;
      }).catch(function (error) {
        throw error;
      });
  };

})(typeof globalThis !== "undefined" ? globalThis : window);
