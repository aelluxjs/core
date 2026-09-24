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

(function () {
  "use strict";

  const root =
    typeof globalThis !== "undefined"
      ? globalThis
      : window;

  const extensionPromises = {};
  const mountedElements = new WeakMap(); //DOM, string Set

  root.Aellux = Object.assign(AelluxForceUpdate, root.Aellux, {
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
    async update(rootOrSelector, extensionLabels = null) { return AelluxForceUpdate(rootOrSelector, extensionLabels); },
    async unmount(rootOrSelector, extensionLabels = null) { return AelluxForceUnmount(rootOrSelector, extensionLabels); },
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
        console.error("[Aellux] Extension unmount failed.", error)
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
          console.error("[Aellux] Extension destroy failed.", error)
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

    waitLayout: createLayoutScheduler(),
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

      Promise.resolve().then(function () {
        phase = "update";
        var updates = updateQueue.splice(0);
        for (var i = 0; i < updates.length; i++)
          runTask(updates[i]);

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
      var promise = new Promise(function (resolve, reject) {
        queue.push({
          callback: callback,
          resolve: resolve,
          reject: reject
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

  async function AelluxForceUnmount(rootOrSelector, extensionLabels = null) {
    for (const rootElement of resolveRoots(rootOrSelector)) {
      await AelluxForce(rootElement, "unmount", extensionLabels);
    }
    return true;
  }

  async function AelluxForceUpdate(rootOrSelector, extensionLabels = null) {
    for (const rootElement of resolveRoots(rootOrSelector)) {
      const allWaiters = findElements(rootElement, Aellux.attr("wait-mounted"));
      allWaiters.forEach(waiter => waiter.setAttribute("aria-busy", "true"));

      const allLinks = findElements(rootElement, "link[rel='aellux-ext']");
      for (const link of allLinks) {
        const href = link.getAttribute("href");
        const loadWhen = link.getAttribute(Aellux.attr("load-when")) || undefined;
        const loadStyleValue = link.getAttribute(Aellux.attr("load-style"));
        const loadStyle = loadStyleValue === null || loadStyleValue === "false"
          ? false
          : loadStyleValue || true;
        link.setAttribute("rel", "aellux-ext-registered");
        Aellux.ext(href, { loadWhen, loadStyle });
      }

      const waitExtensions = [];
      for (const [extensionLabel, options] of
        Object.entries(root.Aellux.extRegistry)) {
        if (options.loadWhen) continue;
        waitExtensions.push(getExtension(extensionLabel));
      }
      await Promise.all(waitExtensions);

      await AelluxForce(rootElement, "mount", extensionLabels);

      allWaiters.forEach(waiter => waiter.setAttribute("aria-busy", "false"));
    }
    return true;
  }

  async function AelluxForce(rootElement, method, extensionLabels = null) {
    if (typeof extensionLabels === "string")
      extensionLabels = [extensionLabels];

    var filter;
    if (!extensionLabels) {
      const mounterSelectors = Object.values(Aellux.extensionMounters);
      const lazySelectors = Object.values(Aellux.lazyExtensionSelectors);
      filter = [...mounterSelectors, ...lazySelectors];
    } else {
      filter = [];
      extensionLabels = extensionLabels.map(_ => fromCamelCase(_));

      for (const [label, selectorString] of Object.entries(Aellux.extensionMounters))
        if (extensionLabels.indexOf(fromCamelCase(label)) !== -1)
          filter.push(selectorString);

      for (const [label, selectorString] of Object.entries(Aellux.lazyExtensionSelectors))
        if (extensionLabels.indexOf(fromCamelCase(label)) !== -1)
          filter.push(selectorString);
    }

    if (filter.length === 0) return;

    const allElements = findElements(rootElement, filter.join(","));
    for (const element of allElements) {
      const elementsAffected = new Set();
      var localExtensionLabels;

      if (extensionLabels) {
        localExtensionLabels = new Set(extensionLabels);
      } else {
        localExtensionLabels = new Set();
        //Load needed lazies
        for (const [extensionLabel, selector]
          of Object.entries(Aellux.lazyExtensionSelectors))
          if (element.matches(selector) && filter.indexOf(selector) !== -1)
            localExtensionLabels.add(extensionLabel);

        //Mount readies
        for (const [extensionLabel, selector]
          of Object.entries(Aellux.extensionMounters))
          if (element.matches(selector) && filter.indexOf(selector) !== -1)
            localExtensionLabels.add(extensionLabel);
      }

      for (const extensionLabel of localExtensionLabels) {
        const extensionPromise = method === "mount" ?
          getExtension(extensionLabel) :
          extensionPromises[toCamelCase(extensionLabel)];
        if (!extensionPromise) { continue; }
        const extension = await extensionPromise;
        if (!extension || !extension.mountDOM) { continue; }
        const mounter = extension.mountDOM;
        for (const [selector, controller] of mounter) {
          try {
            if (!controller[method]) { continue; }
            const mountableElements = findElements(element, selector);
            for (const mountable of mountableElements) {
              const mountId = `${extensionLabel}@${selector}`;
              const mounting = (method === "mount");
              if (mounting === isMounted(mountable, mountId)) continue;
              await controller[method](mountable);
              elementsAffected.add(mountable);
              setMounted(mountable, mountId, mounting);
            }
          } catch (error) {
            console.error(error);
          }
        }
      }

      for (const affected of elementsAffected) {
        affected.classList.toggle(
          Aellux.className("mounted"),
          isMounted(affected)
        );
      }
    }
    Aellux.dispatch("Update");
  }

  function resolveRoots(root) {
    if (!root) { return [document]; }
    if (typeof root === "string") {
      try { return Array.from(document.querySelectorAll(root)); }
      catch (error) { return []; }
    }
    if (
      root instanceof Element ||
      root instanceof Document ||
      root instanceof DocumentFragment
    ) { return [root]; }
    return [];
  }

  function findElements(root, selector) {
    const elements = [];
    if (
      root.nodeType === Node.ELEMENT_NODE &&
      root.matches(selector)
    ) { elements.push(root); }
    if (root.querySelectorAll) {
      root.querySelectorAll(selector)
        .forEach(function (element) {
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
      mountedElements.set(element, new Set());
    }
    const mounts = mountedElements.get(element);
    mounts[mounted ? "add" : "delete"](mountId);
    if (mounts.size === 0) mountedElements.delete(element);
  }

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

})();