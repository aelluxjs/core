"use strict";
(() => {
  /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  const root = typeof globalThis !== "undefined" ? globalThis : window;
  const extensionPromises = {};
  root.Aellux = Object.assign(AelluxForceUpdate, root.Aellux, {
    async startAellux() {
      if (root.Aellux.bundledExtensions) {
        Object.keys(root.Aellux.bundledExtensions).forEach((extensionName) => Aellux.ext(extensionName));
      }
      await new Promise((resolve) => {
        const startUpdateCallback = function() {
          Aellux.update().then(function() {
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
      Aellux.dispatch("Ready");
      return true;
    },
    update(rootOrSelector) {
      return AelluxForceUpdate(rootOrSelector);
    },
    unmount(rootOrSelector) {
      return AelluxForceUnmount(rootOrSelector);
    },
    destroy() {
      Aellux.observers.resize.disconnect();
      Aellux.observers.mutation.disconnect();
      Aellux.observers.intersection.disconnect();
      document.removeEventListener("DOMContentLoaded", Aellux.update);
    },
    dispatchFrom(from, event, options) {
      from.dispatchEvent(new CustomEvent(Aellux.eventName(event), options));
    },
    wait(extensionName) {
      return getExtension(extensionName);
    },
    observe(element, type) {
      Aellux.observers[type].observe(element);
    },
    unobserve(element, type) {
      Aellux.observers[type].unobserve(element);
    },
    request: defaultRequest,
    observers: Object.freeze({
      resize: new ResizeObserver(resizeObserverCallback),
      mutation: new MutationObserver(mutationObserverCallback),
      intersection: new IntersectionObserver(intersectionObserverCallback)
    }),
    waitLayout: createLayoutScheduler()
  });
  root[root.Aellux.shortJSName] = root.Aellux;
  function intersectionObserverCallback(entries) {
    observerCallback(entries, "Intersection");
  }
  function mutationObserverCallback(entries) {
    observerCallback(entries, "Mutation");
  }
  function resizeObserverCallback(entries) {
    observerCallback(entries, "Resize");
  }
  function observerCallback(entries, event) {
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
          console.error(
            `[Aellux] Aellux Extension "${extensionName}" failed to initialize.`,
            error
          );
          extensionPromises[key] = Promise.resolve(null);
          return extensionPromises[key];
        }
      }
      extensionPromises[key] = Promise.resolve(Aellux[key]);
      return extensionPromises[key];
    }
    if (!(extensionName in Aellux.extRegistry)) {
      return Promise.reject();
    }
    const bundledLoader = Aellux.bundledExtensions ? Aellux.bundledExtensions[extensionName] : null;
    extensionPromises[key] = (bundledLoader ? Promise.resolve().then(() => bundledLoader()) : appendExtensionAssets(key)).then(() => extensionInitialize(key)).catch((error) => {
      console.error(
        `[Aellux] Aellux Extension "${extensionName}" failed to initialize.`,
        error
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
          const styleDefaultURL = data.loadStyle === "true" || data.loadStyle === "";
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
  function createLayoutScheduler() {
    var readQueue = [];
    var updateQueue = [];
    var framePending = false;
    var phase = "idle";
    function scheduleFrame() {
      if (framePending || phase !== "idle") return;
      framePending = true;
      requestAnimationFrame(flushFrame);
    }
    function flushFrame() {
      framePending = false;
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
    return Object.freeze({
      read: (callback) => queueTask(readQueue, callback),
      update: (callback) => queueTask(updateQueue, callback)
    });
  }
  function defaultRequest(url, options) {
    var requestOptions = Object.assign(
      { method: "GET", credentials: "same-origin" },
      options
    );
    return fetch(url, requestOptions).then(function(response) {
      if (!response.ok) {
        var error = new Error("HTTP " + response.status + " " + response.statusText);
        error.name = "AelluxRequestError";
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
  async function AelluxForceUnmount(rootOrSelector) {
    for (const rootElement of resolveRoots(rootOrSelector)) {
      await AelluxForce(rootElement, "unmount");
    }
    return true;
  }
  async function AelluxForceUpdate(rootOrSelector) {
    for (const rootElement of resolveRoots(rootOrSelector)) {
      const allWaiters = findElements(rootElement, Aellux.attr("wait-mounted"));
      allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "true"));
      const allLinks = findElements(rootElement, "link[rel='aellux-ext']");
      for (const link of allLinks) {
        const href = link.getAttribute("href");
        const loadWhen = link.getAttribute(Aellux.attr("load-when")) || void 0;
        const loadStyle = link.hasAttribute(Aellux.attr("load-style")) && link.getAttribute(Aellux.attr("load-style")) !== "false";
        link.setAttribute("rel", "aellux-ext-registered");
        Aellux.ext(href, { loadWhen, loadStyle });
      }
      const waitExtensions = [];
      for (const [extensionLabel, options] of Object.entries(root.Aellux.extRegistry)) {
        if (options.loadWhen) continue;
        waitExtensions.push(getExtension(extensionLabel));
      }
      await Promise.all(waitExtensions);
      await AelluxForce(rootElement, "mount");
      allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "false"));
    }
    return true;
  }
  async function AelluxForce(rootElement, method) {
    const mounterSelectors = Object.values(Aellux.extensionMounters);
    const lazySelectors = Object.values(Aellux.lazyExtensionSelectors);
    if (mounterSelectors.length + lazySelectors.length === 0) return;
    const selector = [...mounterSelectors, ...lazySelectors].join(",");
    const allElements = findElements(rootElement, selector);
    for (const element of allElements) {
      const extensionLabels = /* @__PURE__ */ new Set();
      const elementsAffected = /* @__PURE__ */ new Set();
      for (const [extensionLabel, selector2] of Object.entries(Aellux.lazyExtensionSelectors))
        if (element.matches(selector2))
          extensionLabels.add(extensionLabel);
      for (const [extensionLabel, selector2] of Object.entries(Aellux.extensionMounters))
        if (element.matches(selector2))
          extensionLabels.add(extensionLabel);
      for (const extensionLabel of extensionLabels) {
        const extension = await getExtension(extensionLabel);
        if (!extension || !extension.mountDOM) {
          continue;
        }
        const mounter = extension.mountDOM;
        for (const [attr, controller] of mounter) {
          try {
            if (!controller[method]) {
              continue;
            }
            const mountableElements = findElements(element, attr);
            for (const mountable of mountableElements) {
              await controller[method](mountable);
              elementsAffected.add(mountable);
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
      for (const affected of elementsAffected) {
        affected.classList[method === "mount" ? "add" : "remove"](Aellux.className("mounted"));
      }
    }
    Aellux.dispatch("Update");
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
  function toCamelCase(name) {
    return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
  function fromCamelCase(name) {
    return name.replace(/([A-Z])/g, "-$1").toLowerCase();
  }
  let pageWasHidden = false;
  window.addEventListener("pagehide", () => pageWasHidden = true);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && pageWasHidden) {
      pageWasHidden = false;
    }
  });
})();
//# sourceMappingURL=aellux.orchestrator.js.map
