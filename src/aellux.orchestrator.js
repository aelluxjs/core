/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Aellux orchestrator: extends the bootstrap with shared modern-runtime services.
// Loads and caches configured Aellux Extensions, initializes them, and dispatches the Ready event.
// Ready signals that the orchestrator is initialized and available; it does not guarantee
// successful Aellux Extension initialization or completed DOM mounting. Component-specific events
// such as AdaptiveUpdate report their own readiness or updates.
// Routes explicit DOM update/unmount requests through extension mount/unmount declarations,
// forwards browser observer notifications, and provides layout scheduling and fetch helpers.
// Uses ES2017 syntax, Promises, and modern browser APIs; legacy fallback
// selection belongs to the bootstrap, while feature-specific behavior belongs to Aellux Extensions.

import { createLayoutScheduler } from "./internal/create-layout-scheduler.js";
import { createMountHelper } from "./internal/create-mount-helper.js";

(function (root) {
  "use strict";

  const extensionPromises = {};
  const mountHelper = createMountHelper(root, extensionPromises);
  const layoutScheduler = createLayoutScheduler();

  root.Aellux = Object.assign(
    mountHelper.AelluxForceUpdate,
    root.Aellux,
    {
      async startAellux() {
        if (root.Aellux.bundledExtensions) {
          Object.keys(root.Aellux.bundledExtensions)
            .forEach(extensionName => Aellux.ext(extensionName));
        }

        await new Promise((resolve) => {
          const startUpdateCallback = function () {
            Aellux.update().then(function () {
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

        Aellux.dispatch("Ready");

        return true;
      },
      async update(rootOrSelector, extensionLabels = null) {
        return mountHelper.AelluxForceUpdate(rootOrSelector, extensionLabels);
      },
      async unmount(rootOrSelector, extensionLabels = null) {
        return mountHelper.AelluxForceUnmount(rootOrSelector, extensionLabels);
      },
      async destroy() {
        await Aellux.destroyExtensions();

        Aellux.observers.resize.disconnect();
        Aellux.observers.mutation.disconnect();
        Aellux.observers.intersection.disconnect();
      },
      async destroyExtensions(extensionLabels) {
        if (typeof extensionLabels === "string")
          extensionLabels = [extensionLabels];

        if (!extensionLabels)
          extensionLabels = Object.keys(extensionPromises)

        extensionLabels = extensionLabels.map(_ => fromCamelCase(_));

        try {
          await Aellux.unmount(document, extensionLabels);
        } catch (error) {
          Aellux.diagnostics.report(
            Aellux.diagnostics.ERROR_EXTENSION_UNMOUNT,
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
            Aellux.diagnostics.report(
              Aellux.diagnostics.ERROR_EXTENSION_DESTROY,
              { cause: error, extension: extensionLabel }
            );
          } finally {
            delete extensionPromises[key];
            delete Aellux.extensionMounters[extensionLabel];
            if (extension) extension.initialized = false;
          }
        }
      },

      dispatchFrom(from, event, options) {
        //console.log(`dispatch: Aellux${event}`, options);
        from.dispatchEvent(new CustomEvent(Aellux.eventName(event), options));
      },

      wait(extensionName) { return getExtension(extensionName); },

      observe(element, type) { Aellux.observers[type].observe(element); },
      unobserve(element, type) { Aellux.observers[type].unobserve(element); },
      request: defaultRequest,

      observers: Object.freeze({
        resize: new ResizeObserver(resizeObserverCallback),
        mutation: new MutationObserver(mutationObserverCallback),
        intersection: new IntersectionObserver(intersectionObserverCallback)
      }),

      waitLayout: layoutScheduler,
    });

  root[root.Aellux.shortJSName] = root.Aellux;

  function intersectionObserverCallback(entries) { observerCallback(entries, "Intersection"); }
  function mutationObserverCallback(entries) { observerCallback(entries, "Mutation"); }
  function resizeObserverCallback(entries) { observerCallback(entries, "Resize"); }
  function observerCallback(entries, event) {
    //Definir um intervalo em MS para rodar apenas a alteração mais recente
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      Aellux.dispatchFrom(entry.target, `${event}Observer`, { detail: entry });
    }
  }

  function getExtension(extensionName) {
    extensionName = fromCamelCase(extensionName);
    const key = toCamelCase(extensionName);

    if (extensionPromises[key])
      return extensionPromises[key];

    if (Aellux[key]) {
      if (!Aellux[key].initialized) {
        try {
          extensionInitialize(key);
        } catch (error) {
          Aellux.diagnostics.report(
            Aellux.diagnostics.ERROR_EXTENSION_INITIALIZE,
            { cause: error, extension: extensionName }
          );
          extensionPromises[key] = Promise.resolve(null);
          return extensionPromises[key];
        }
      }
      extensionPromises[key] = Promise.resolve(Aellux[key]);
      return extensionPromises[key];
    }

    if (!(extensionName in Aellux.extRegistry)) { return Promise.reject(); }

    const bundledLoader =
      Aellux.bundledExtensions ?
        Aellux.bundledExtensions[extensionName] :
        null;

    extensionPromises[key] =
      (bundledLoader
        ? Promise.resolve().then(() => bundledLoader())
        : appendExtensionAssets(key))
        .then(() => extensionInitialize(key))
        .catch((error) => {
          Aellux.diagnostics.report(
            Aellux.diagnostics.ERROR_EXTENSION_INITIALIZE,
            { cause: error, extension: extensionName }
          );
          return null;
        });

    return extensionPromises[key];
  }

  function extensionInitialize(extensionLabel) {
    const extensionName = fromCamelCase(extensionLabel);
    const key = toCamelCase(extensionLabel);
    Aellux[key].init();
    Aellux[key].initialized = true;

    if (Aellux[key].mountDOM) {
      const selectors = Array.from(Aellux[key].mountDOM.keys()).join(",");
      if (selectors) Aellux.extensionMounters[extensionName] = selectors;
    }

    //Clean lazy registry
    delete Aellux.lazyExtensionSelectors[extensionName];

    return Aellux[key];
  }

  async function appendExtensionAssets(name) {
    const extensionName = fromCamelCase(name);
    const data = Aellux.extRegistry[extensionName];
    const url = data.url.replace(/^\.\//, Aellux.aelluxBasePath);
    const scriptURL = Aellux.legacy ? toLegacyScriptURL(url) : url;
    const loadPromises = [];

    loadPromises.push(new Promise(
      (resolve, reject) => {
        const attr = Aellux.attr("ext");
        const script = document.createElement("script");
        script.src = scriptURL;
        script.setAttribute(attr, name);
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      }
    ));

    if (data.loadStyle && data.loadStyle !== "false") {
      loadPromises.push(new Promise(
        (resolve) => {
          const styleDefaultURL = data.loadStyle === true ||
            data.loadStyle === "true" || data.loadStyle === "";
          const href = styleDefaultURL ? url.replace(/\.js(?=[?#]|$)/, ".css") : data.loadStyle;
          const attrStyle = Aellux.attr("ext-style");
          const link = document.createElement("link");
          link.href = href;
          link.rel = "stylesheet";
          link.setAttribute(attrStyle, name);
          link.onload = resolve;
          link.onerror = resolve;
          document.head.appendChild(link);
        }
      ));
    }

    return Promise.all(loadPromises);
  }

  function toLegacyScriptURL(url) {
    return url.replace(
      /(?:\.legacy)?(?:\.min)?\.js(?=[?#]|$)/,
      ".legacy" + (Aellux.minified ? ".min" : "") + ".js"
    );
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
          error.name = "AelluxRequestError";
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
