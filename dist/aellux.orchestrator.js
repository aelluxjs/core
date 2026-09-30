(() => {
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

  // src/internal/create-layout-scheduler.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createLayoutScheduler() {
    var readQueue = [];
    var updateQueue = [];
    var frameRequest = null;
    var phase = "idle";
    function scheduleFrame() {
      if (frameRequest !== null || phase !== "idle") return;
      frameRequest = requestAnimationFrame(flushFrame);
    }
    function flushFrame() {
      frameRequest = null;
      phase = "read";
      var reads = readQueue.splice(0);
      for (var i = 0; i < reads.length; i++)
        runTask(reads[i]);
      Promise.resolve().then(function() {
        phase = "update";
        var updates = updateQueue.splice(0);
        for (var i2 = 0; i2 < updates.length; i2++)
          runTask(updates[i2]);
        phase = "idle";
        if (readQueue.length || updateQueue.length) scheduleFrame();
      });
    }
    function runTask(task) {
      try {
        task.resolve(task.callback());
      } catch (error) {
        task.reject(error);
      }
    }
    function queueTask(queue, callback) {
      var promise = new Promise(function(resolve, reject) {
        queue.push({
          callback,
          resolve,
          reject
        });
      });
      if (phase === "idle") scheduleFrame();
      return promise;
    }
    function clear() {
      if (frameRequest !== null) {
        cancelAnimationFrame(frameRequest);
        frameRequest = null;
      }
      settleQueue(readQueue);
      settleQueue(updateQueue);
      phase = "idle";
    }
    function settleQueue(queue) {
      var tasks = queue.splice(0);
      for (var i = 0; i < tasks.length; i++) {
        tasks[i].resolve(void 0);
      }
    }
    return Object.freeze({
      read: (callback) => queueTask(readQueue, callback),
      update: (callback) => queueTask(updateQueue, callback),
      clear
    });
  }

  // src/internal/create-mount-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createMountHelper(root, extensionPromises) {
    const mountedElements = /* @__PURE__ */ new WeakMap();
    async function AelluxJsForceUnmount(rootOrSelector, extensionLabels = null) {
      for (const rootElement of resolveRoots(rootOrSelector)) {
        await AelluxJsForce(rootElement, "unmount", extensionLabels);
      }
      return true;
    }
    async function AelluxJsForceUpdate(rootOrSelector, extensionLabels = null) {
      const AelluxJs2 = root.AelluxJs;
      for (const rootElement of resolveRoots(rootOrSelector)) {
        const allWaiters = findElements(rootElement, AelluxJs2.attr("wait-mounted"));
        allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "true"));
        const allLinks = findElements(rootElement, "link[rel='aelluxjs-ext']");
        for (const link of allLinks) {
          const href = link.getAttribute("href");
          const loadWhen = link.getAttribute(AelluxJs2.attr("load-when")) || void 0;
          const builds = link.getAttribute(AelluxJs2.attr("builds")) || void 0;
          const loadStyleValue = link.getAttribute(AelluxJs2.attr("load-style"));
          const loadStyle = loadStyleValue === null || loadStyleValue === "false" ? false : loadStyleValue || true;
          link.setAttribute("rel", "aelluxjs-ext-registered");
          AelluxJs2.ext(href, { builds, loadWhen, loadStyle });
        }
        const waitExtensions = [];
        for (const [extensionLabel, options] of Object.entries(root.AelluxJs.extRegistry)) {
          if (options.loadWhen) continue;
          waitExtensions.push(AelluxJs2.wait(extensionLabel));
        }
        await Promise.all(waitExtensions);
        await AelluxJsForce(rootElement, "mount", extensionLabels);
        allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "false"));
      }
      return true;
    }
    async function AelluxJsForce(rootElement, method, extensionLabels = null) {
      const AelluxJs2 = root.AelluxJs;
      if (typeof extensionLabels === "string")
        extensionLabels = [extensionLabels];
      var filter;
      if (!extensionLabels) {
        const mounterSelectors = Object.values(AelluxJs2.extensionMounters);
        const lazySelectors = Object.values(AelluxJs2.lazyExtensionSelectors);
        filter = [...mounterSelectors, ...lazySelectors];
      } else {
        filter = [];
        extensionLabels = extensionLabels.map((_) => fromCamelCase(_));
        for (const [label, selectorString] of Object.entries(AelluxJs2.extensionMounters))
          if (extensionLabels.indexOf(fromCamelCase(label)) !== -1)
            filter.push(selectorString);
        for (const [label, selectorString] of Object.entries(AelluxJs2.lazyExtensionSelectors))
          if (extensionLabels.indexOf(fromCamelCase(label)) !== -1)
            filter.push(selectorString);
      }
      if (filter.length === 0) return;
      const allElements = findElements(rootElement, filter.join(","));
      for (const element of allElements) {
        const elementsAffected = /* @__PURE__ */ new Set();
        var localExtensionLabels;
        if (extensionLabels) {
          localExtensionLabels = new Set(extensionLabels);
        } else {
          localExtensionLabels = /* @__PURE__ */ new Set();
          for (const [extensionLabel, selector] of Object.entries(AelluxJs2.lazyExtensionSelectors))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionLabels.add(extensionLabel);
          for (const [extensionLabel, selector] of Object.entries(AelluxJs2.extensionMounters))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionLabels.add(extensionLabel);
        }
        for (const extensionLabel of localExtensionLabels) {
          const extensionPromise = method === "mount" ? AelluxJs2.wait(extensionLabel) : extensionPromises[toCamelCase(extensionLabel)];
          if (!extensionPromise) {
            continue;
          }
          const extension = await extensionPromise;
          if (!extension || !extension.mountMap) {
            continue;
          }
          const mounter = extension.mountMap;
          for (const [selector, controller] of mounter) {
            try {
              if (!controller[method]) {
                continue;
              }
              const mountableElements = findElements(element, selector);
              for (const mountable of mountableElements) {
                const mountId = `${extensionLabel}@${selector}`;
                const mounting = method === "mount";
                if (mounting === isMounted(mountable, mountId)) continue;
                await controller[method](mountable);
                elementsAffected.add(mountable);
                setMounted(mountable, mountId, mounting);
              }
            } catch (error) {
              AelluxJs2.diagnostics.report(
                AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
                {
                  cause: error,
                  extension: extensionLabel,
                  method,
                  selector
                }
              );
            }
          }
        }
        for (const affected of elementsAffected) {
          affected.classList.toggle(
            AelluxJs2.className("mounted"),
            isMounted(affected)
          );
        }
      }
      AelluxJs2.dispatch(toCapitalized(method));
    }
    function resolveRoots(root2) {
      if (!root2) {
        return [document];
      }
      if (typeof root2 === "string") {
        try {
          return Array.from(document.querySelectorAll(root2));
        } catch (error) {
          return [];
        }
      }
      if (root2 instanceof Element || root2 instanceof Document || root2 instanceof DocumentFragment) {
        return [root2];
      }
      return [];
    }
    function findElements(root2, selector) {
      const elements = [];
      if (root2.nodeType === Node.ELEMENT_NODE && root2.matches(selector)) {
        elements.push(root2);
      }
      if (root2.querySelectorAll) {
        root2.querySelectorAll(selector).forEach(function(element) {
          elements.push(element);
        });
      }
      return elements;
    }
    function isMounted(element, mountId = null) {
      const mounts = mountedElements.get(element);
      if (!mounts) return false;
      return mountId ? mounts.has(mountId) : mounts.size > 0;
    }
    function setMounted(element, mountId, mounted = true) {
      if (!mountedElements.has(element)) {
        mountedElements.set(element, /* @__PURE__ */ new Set());
      }
      const mounts = mountedElements.get(element);
      mounts[mounted ? "add" : "delete"](mountId);
      if (mounts.size === 0) mountedElements.delete(element);
    }
    function toCamelCase(name) {
      return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    }
    ;
    function fromCamelCase(name) {
      return name.replace(/([A-Z])/g, "-$1").toLowerCase();
    }
    ;
    function toCapitalized(name) {
      return name.replace(/^([a-z])|-([a-z])/g, function(_, first, afterHyphen) {
        return (first || afterHyphen).toUpperCase();
      });
    }
    ;
    return {
      AelluxJsForceUpdate,
      AelluxJsForceUnmount
    };
  }

  // src/aellux.orchestrator.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
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
            Object.keys(root.AelluxJs.bundledExtensions).forEach((extensionName) => AelluxJs.ext(extensionName));
          }
          await new Promise((resolve) => {
            const startUpdateCallback = function() {
              AelluxJs.update().then(function() {
                document.removeEventListener(
                  "DOMContentLoaded",
                  startUpdateCallback
                );
                resolve();
              });
            };
            if (document.readyState === "loading")
              document.addEventListener(
                "DOMContentLoaded",
                startUpdateCallback,
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
            extensionLabels = Object.keys(extensionPromises);
          extensionLabels = extensionLabels.map((_) => fromCamelCase(_));
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
          from.dispatchEvent(new CustomEvent(AelluxJs.eventName(event), options));
        },
        wait(extensionName) {
          return getExtension(extensionName);
        },
        request: defaultRequest,
        waitLayout: layoutScheduler
      }
    );
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
      if (!(extensionName in AelluxJs.extRegistry)) {
        return Promise.reject();
      }
      const bundledLoader = AelluxJs.bundledExtensions ? AelluxJs.bundledExtensions[extensionName] : null;
      extensionPromises[key] = (bundledLoader ? Promise.resolve().then(() => bundledLoader()) : appendExtensionAssets(key)).then(() => extensionInitialize(key)).catch((error) => {
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
            const styleDefaultURL = data.loadStyle === true || data.loadStyle === "true" || data.loadStyle === "";
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
      return fetch(url, requestOptions).then(function(response) {
        if (!response.ok) {
          var error = new Error("HTTP " + response.status + " " + response.statusText);
          error.name = "AelluxJsRequestError";
          error.status = response.status;
          error.statusText = response.statusText;
          error.response = response;
          throw error;
        }
        return response;
      }).catch(function(error) {
        throw error;
      });
    }
    ;
    function toCamelCase(name) {
      return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    }
    ;
    function fromCamelCase(name) {
      return name.replace(/([A-Z])/g, "-$1").toLowerCase();
    }
    ;
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.orchestrator.js.map
