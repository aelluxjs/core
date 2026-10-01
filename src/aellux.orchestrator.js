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

(function (root) {
  "use strict";

  const extensionPromises = {};
  const mountHelper = createMountHelper(root, extensionPromises);
  const layoutScheduler = createLayoutScheduler();

  root.AelluxJs = Object.assign(
    mountHelper.AelluxJsForceUpdate,
    root.AelluxJs,
    {
      async startAelluxJs() {
        if (root.AelluxJs.bundledExtensions) {
          Object.keys(root.AelluxJs.bundledExtensions)
            .forEach(extensionName => AelluxJs.ext(extensionName));
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
      async update(rootOrSelector, extensionLabels = null) {
        return mountHelper.AelluxJsForceUpdate(rootOrSelector, extensionLabels);
      },
      async unmount(rootOrSelector, extensionLabels = null) {
        return mountHelper.AelluxJsForceUnmount(rootOrSelector, extensionLabels);
      },
      async destroy() {
        AelluxJs.waitLayout.clear();
        await AelluxJs.destroyExtensions();
      },
      async destroyExtensions(extensionLabels) {
        if (typeof extensionLabels === "string")
          extensionLabels = [extensionLabels];

        if (!extensionLabels)
          extensionLabels = Object.keys(extensionPromises)

        extensionLabels = extensionLabels.map(_ => fromCamelCase(_));

        try {
          await AelluxJs.unmount(document, extensionLabels);
        } catch (error) {
          AelluxJs.diagnostics.report(
            AelluxJs.diagnostics.ERROR_EXTENSION_UNMOUNT,
            { cause: error, extensions: extensionLabels }
          );
        }

        for (const extensionLabel of extensionLabels) {
          const key = toCamelCase(extensionLabel);
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
              { cause: error, extension: extensionLabel }
            );
          } finally {
            delete AelluxJs[key];
            delete extensionPromises[key];
            delete AelluxJs.extRegistry[extensionLabel];
            delete AelluxJs.extensionMounters[extensionLabel];
            if (extension) extension.initialized = false;
          }
        }
      },

      dispatchFrom(from, event, options) {
        //console.log(`dispatch: AelluxJs${event}`, options);
        from.dispatchEvent(new CustomEvent(AelluxJs.eventName(event), options));
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

    const data = AelluxJs.extRegistry[extensionName];
    if (data && !hasCompatibleBuild(data)) {
      AelluxJs.diagnostics.report(
        AelluxJs.diagnostics.ERROR_EXTENSION_INCOMPATIBLE,
        {
          extension: extensionName,
          runtime: AelluxJs.legacy ? "legacy" : "modern",
          builds: data.builds
        }
      );
      delete AelluxJs.lazyExtensionSelectors[extensionName];
      extensionPromises[key] = Promise.resolve(null);
      return extensionPromises[key];
    }

    if (AelluxJs[key]) {
      if (!AelluxJs[key].initialized) {
        try {
          extensionInitialize(key);
        } catch (error) {
          AelluxJs.diagnostics.report(
            AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
            { cause: error, extension: extensionName }
          );
          extensionPromises[key] = Promise.resolve(null);
          return extensionPromises[key];
        }
      }
      extensionPromises[key] = Promise.resolve(AelluxJs[key]);
      return extensionPromises[key];
    }

    if (!(extensionName in AelluxJs.extRegistry)) { return Promise.reject(); }

    const bundledLoader =
      AelluxJs.bundledExtensions ?
        AelluxJs.bundledExtensions[extensionName] :
        null;

    extensionPromises[key] =
      (bundledLoader
        ? Promise.resolve().then(() => bundledLoader())
        : appendExtensionAssets(key))
        .then(() => extensionInitialize(key))
        .catch((error) => {
          AelluxJs.diagnostics.report(
            AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
            { cause: error, extension: extensionName }
          );
          return null;
        });

    return extensionPromises[key];
  }

  function extensionInitialize(extensionLabel) {
    const extensionName = fromCamelCase(extensionLabel);
    const key = toCamelCase(extensionLabel);
    AelluxJs[key].init();
    AelluxJs[key].initialized = true;

    if (AelluxJs[key].mountMap) {
      const selectors = Array.from(AelluxJs[key].mountMap.keys()).join(",");
      if (selectors) AelluxJs.extensionMounters[extensionName] = selectors;
    }

    //Clean lazy registry
    delete AelluxJs.lazyExtensionSelectors[extensionName];

    return AelluxJs[key];
  }

  async function appendExtensionAssets(name) {
    const extensionName = fromCamelCase(name);
    const data = AelluxJs.extRegistry[extensionName];
    const url = data.url.replace(/^\.\//, AelluxJs.aelluxBasePath);
    const useLegacyBuild = AelluxJs.legacy || data.builds.indexOf("modern") === -1;
    const scriptURL = useLegacyBuild ? toLegacyScriptURL(url) : url;
    const loadPromises = [];

    loadPromises.push(new Promise(
      (resolve, reject) => {
        const attr = AelluxJs.attr("ext");
        const script = document.createElement("script");
        script.src = scriptURL;
        script.setAttribute(attr, name);

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
          link.setAttribute(attrStyle, name);

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
    if (AelluxJs.legacy) return data.builds.indexOf("legacy") !== -1;
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


  function toCamelCase(name) { return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); };
  function fromCamelCase(name) { return name.replace(/([A-Z])/g, "-$1").toLowerCase(); };

  //BFCache
  // let pageWasHidden = false;
  // window.addEventListener("pagehide", () => pageWasHidden = true);
  // window.addEventListener("pageshow", (event) => {
  //   if (event.persisted && pageWasHidden) {// página voltou via BFCache
  //     pageWasHidden = false;
  //   }
  // });

})(typeof globalThis !== "undefined" ? globalThis : window);
