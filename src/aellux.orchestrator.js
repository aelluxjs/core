/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Aellux orchestrator: extends the bootstrap with shared modern-runtime services.
// Loads and caches configured Aellux Extensions, initializes them, and dispatches the Ready event.
// Ready signals that the orchestrator is initialized and available; it does not guarantee
// successful Aellux Extension initialization or completed DOM mounting. Component-specific events
// such as AdaptiveUpdate report their own readiness or updates.
// Routes explicit DOM update/unmount requests through extension mountDOM declarations,
// forwards browser observer notifications, and provides layout scheduling and fetch helpers.
// Uses ES2017 syntax, Promises, and modern browser APIs; legacy fallback
// selection belongs to the bootstrap, while feature-specific behavior belongs to Aellux Extensions.

"use strict";

const root =
  typeof globalThis !== "undefined"
    ? globalThis
    : window;
const extensionPromises = {};

root.Aellux = Object.assign(AelluxForceUpdate, root.Aellux, {
  async startAellux() {
    if (root.Aellux.bundledExtensions) {
      Object.keys(root.Aellux.bundledExtensions)
        .forEach(extensionName => Aellux.ext(extensionName));
    }

    const waitExtensions = [];

    if (root.Aellux.extPaths) {
      Object.keys(root.Aellux.extPaths)
        .forEach(extensionName => waitExtensions.push(loadExtension(extensionName)));
    }

    await Promise.all(waitExtensions);

    Aellux.dispatch("Ready");

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => { Aellux.update(); },
        { once: true }
      );
    } else {
      Aellux.update();
    }

    return true;
  },
  update(root) { AelluxForceUpdate(root); },
  unmount(root) { AelluxForceUnmount(root); },
  destroy() {
    Aellux.observers.resize.disconnect();
    Aellux.observers.mutation.disconnect();
    Aellux.observers.intersection.disconnect();
  },

  dispatchFrom(from, event, options) {
    //console.log(`dispatch: Aellux${event}`, options);
    from.dispatchEvent(new CustomEvent(Aellux.eventName(event), options));
  },

  wait(extensionName) {
    return loadExtension(extensionName);
  },

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

function loadExtension(extensionName) {
  extensionName = fromCamelCase(extensionName);
  const key = toCamelCase(extensionName);

  if (extensionPromises[key])
    return extensionPromises[key];

  if (Aellux[key]) {
    if (!Aellux[key].initialized) {
      try {
        Aellux[key].init();
        Aellux[key].initialized = true;
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

  if (!(extensionName in Aellux.extPaths)) { return Promise.reject(); }

  const bundledLoader =
    Aellux.bundledExtensions ?
      Aellux.bundledExtensions[extensionName] :
      null;

  extensionPromises[key] =
    (bundledLoader
      ? Promise.resolve().then(() => bundledLoader())
      : loadScript(
        key,
        Aellux.extPaths[extensionName].replace(/^\.\//, Aellux.aelluxBasePath)
      ))
      .then(() => {
        Aellux[key].init();
        Aellux[key].initialized = true;
        return Aellux[key];
      })
      .catch((error) => {
        console.error(
          `[Aellux] Aellux Extension "${extensionName}" failed to initialize.`,
          error
        );
        return null;
      });

  return extensionPromises[key];
}

async function loadScript(name, scriptPath) {
  return new Promise((resolve, reject) => {
    var attr = Aellux.attr("ext");
    var script = document.createElement("script");
    script.src = scriptPath;
    script.setAttribute(attr, name);
    script.onload = () => { resolve(); };
    script.onerror = () => { reject(); };
    document.head.appendChild(script);
  });
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

function AelluxForceUpdate(root) { return AelluxForce(root, "update"); }
function AelluxForceUnmount(root) { return AelluxForce(root, "unmount"); }

function AelluxForce(root, method) {
  resolveRoots(root)
    .forEach(rootElement => {
      Object.keys(Aellux.extPaths).forEach(extensionName => {
        const key = toCamelCase(extensionName);
        if (!Aellux[key] || !Aellux[key].initialized || !Aellux[key].mountDOM) return;
        const mounter = Aellux[key].mountDOM;
        for (const [attr, controller] of mounter) {
          if (!(method in controller)) continue;
          const elements = findElements(rootElement, attr);
          elements.forEach(currentElement => {
            try {
              Promise.resolve(controller[method](currentElement))
                .catch(error => console.error(error));
            } catch (error) {
              console.error(error);
            }
          });
        }
      });
    });
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

function toCamelCase(name) { return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); };
function fromCamelCase(name) { return name.replace(/([A-Z])/g, "-$1").toLowerCase(); };

//BFCache
let pageWasHidden = false;
window.addEventListener("pagehide", () => pageWasHidden = true);
window.addEventListener("pageshow", (event) => {
  if (event.persisted && pageWasHidden) {// página voltou via BFCache
    pageWasHidden = false;
  }
});
