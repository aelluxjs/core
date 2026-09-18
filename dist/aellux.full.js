(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };

  // src/aellux.uxm.preferences.js
  var aellux_uxm_preferences_exports = {};
  var init_aellux_uxm_preferences = __esm({
    "src/aellux.uxm.preferences.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const moduleName = "preferences";
        Aellux.uxmRegister(moduleName, { init, destroy, update, get, set });
        const userPreferences = /* @__PURE__ */ Object.create(null);
        const defaultPreferences = /* @__PURE__ */ Object.create(null);
        const computedPreferences = /* @__PURE__ */ Object.create(null);
        const attr = {
          preference: Aellux.attr("preference"),
          option: Aellux.attr("option"),
          label: Aellux.attr("label"),
          next: Aellux.attr("next"),
          prev: Aellux.attr("prev"),
          ready: Aellux.attr("ready")
        };
        const className = {
          active: Aellux.className("active")
        };
        async function init() {
          window.addEventListener("storage", function(event) {
            if (event.key !== "AelluxPreferences") return;
            const newPreferences = new URLSearchParams(event.newValue || "");
            newPreferences.forEach((value, key) => userPreferences[key] = value);
            update();
          });
          const allQueries = Aellux.options.preferencesMediaQueries;
          Object.values(allQueries).forEach(
            (queries) => Object.values(queries).forEach(
              (query) => query.addEventListener("change", update)
            )
          );
          Object.entries(Aellux.options.preferencesOptions).forEach(([param, options]) => defaultPreferences[param] = options[0]);
          loadUserPreferences();
          if (document.readyState === "loading") {
            document.addEventListener(
              "DOMContentLoaded",
              update,
              { once: true }
            );
          } else {
            update();
          }
        }
        async function destroy() {
        }
        function update() {
          Object.assign(computedPreferences, defaultPreferences, userPreferences);
          Aellux.updatePreferencesAttributesHTML(computedPreferences);
          preferenceContainersUpdate();
          Aellux.dispatch("PreferencesChange");
        }
        function get(preference) {
          const key = toCamelCase2(preference);
          return computedPreferences[key];
        }
        function set(preference, value) {
          const key = toCamelCase2(preference);
          if (userPreferences[key] === value) return;
          userPreferences[key] = value;
          saveUserPreferences();
        }
        function saveUserPreferences() {
          Aellux.persist.preferences.setObject(userPreferences);
        }
        function loadUserPreferences() {
          Object.assign(userPreferences, Aellux.persist.preferences.getObject());
        }
        function preferenceContainersUpdate() {
          document.querySelectorAll(`[${attr.preference}]`).forEach((container) => {
            const ready = container.getAttribute(attr.ready);
            if (!ready) {
              setupPreferenceContainer(container);
            }
            const preference = container.getAttribute(attr.preference);
            const elements = container.querySelectorAll(`[${attr.option}]`);
            const selectedLabel = container.querySelector(`[${attr.label}]`);
            elements.forEach((element) => {
              const value = element.getAttribute(attr.option);
              const selected = value === get(preference);
              element.classList.toggle(className.active, selected);
              if (selectedLabel && selected) {
                if (selectedLabel.value) {
                  selectedLabel.value = element.innerText;
                } else {
                  selectedLabel.innerHTML = element.innerHTML;
                }
              }
            });
          });
        }
        function setupPreferenceContainer(container) {
          container.addEventListener("click", onContainerClick);
          container.setAttribute(attr.ready, "");
        }
        function onContainerClick(event) {
          const container = event.currentTarget;
          if (!event.target) return;
          const optionButton = event.target.closest(`[${attr.option}]`);
          const buttonNext = event.target.closest(`[${attr.next}]`);
          const buttonPrev = event.target.closest(`[${attr.prev}]`);
          if (optionButton) {
            const preference = container.getAttribute(attr.preference);
            const value = optionButton.getAttribute(attr.option);
            set(preference, value);
            update();
          } else if (buttonNext || buttonPrev) {
            const preference = container.getAttribute(attr.preference);
            const change = buttonNext ? 1 : -1;
          }
        }
        function toCamelCase2(name) {
          return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        }
        ;
        function fromCamelCase(name) {
          return name.replace(/([A-Z])/g, "-$1").toLowerCase();
        }
        ;
      })();
    }
  });

  // src/aellux.uxm.state-navigation.js
  var aellux_uxm_state_navigation_exports = {};
  var init_aellux_uxm_state_navigation = __esm({
    "src/aellux.uxm.state-navigation.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const moduleName = "state-navigation";
        const globalSnapshot = {};
        Aellux.uxmRegister(moduleName, {
          init,
          destroy,
          tabOpen,
          ajaxHref,
          flowStep,
          formUpdate,
          updateBaseTitle,
          normalize,
          globalSnapshot
        });
        const globalRemoveSnapshot = {};
        let globalSnapshotString = "";
        let skipHashChange = null;
        let baseTitle = "";
        let useHash = true;
        function init() {
          window.addEventListener("popstate", onPopState);
          window.addEventListener("hashchange", onHashChange);
          if ("useHash" in Aellux.options) {
            useHash = Aellux.options.useHash;
          }
          baseTitle = document.title;
          onHashChange();
          history.replaceState({
            aelluxState: true,
            snapshot: Object.assign({}, globalSnapshot)
          }, "");
        }
        async function destroy() {
          window.removeEventListener("popstate", onPopState);
          window.removeEventListener("hashchange", onHashChange);
        }
        function updateBaseTitle(title) {
        }
        function tabOpen(tabGroupId, tabId, title) {
          return change(tabGroupId, tabId, title);
        }
        function ajaxHref(url, selectors) {
          history.replaceState({ aelluxState: true, snapshot: globalSnapshot, ajaxHref: selectors }, "", window.location.href);
          updateSnapshotData();
          history.pushState({ aelluxState: true, snapshot: null, ajaxHref: selectors }, "", url);
        }
        function flowStep(flowId, step, options) {
        }
        function formUpdate(formId, event, value, options) {
        }
        function normalize(key, value, title = void 0, silent) {
          return change(key, value, title, silent);
        }
        async function change(key, value, title, silent = false) {
          if (globalSnapshot.title === title && globalSnapshot[key] === value) return;
          if (title) globalSnapshot.title = title.replace(/\s+/g, " ");
          else delete globalSnapshot.title;
          globalSnapshot[key] = value;
          updateSnapshotData(snapshotToString(globalSnapshot));
          const state = { aelluxState: true, snapshot: Object.assign({}, globalSnapshot) };
          const url = useHash ? `#${globalSnapshotString}` : void 0;
          if (silent) history.replaceState(state, "", url);
          else history.pushState(state, "", url);
          dispatchSnapshotEvent("SnapshotChange");
        }
        function updateSnapshotData(string) {
          globalSnapshotString = string;
          for (const key in globalRemoveSnapshot) {
            delete globalRemoveSnapshot[key];
          }
          Object.assign(globalRemoveSnapshot, globalSnapshot);
          for (const key in globalSnapshot) {
            delete globalSnapshot[key];
          }
          new URLSearchParams(string).forEach((value, key) => globalSnapshot[key] = value);
          for (const key in globalRemoveSnapshot) {
            if (key in globalSnapshot) {
              delete globalRemoveSnapshot[key];
            }
          }
        }
        function snapshotToString(snapshot) {
          return new URLSearchParams(snapshot || {}).toString();
        }
        function dispatchSnapshotEvent(name) {
          document.title = globalSnapshot.title || false ? `${globalSnapshot.title} - ${baseTitle}` : baseTitle;
          const options = {
            detail: {
              snapshot: globalSnapshot,
              removeSnapshot: globalRemoveSnapshot
            },
            bubbles: true
          };
          Aellux.dispatch(name, options);
        }
        function dispatchEventRestore() {
          return dispatchSnapshotEvent("SnapshotRestore");
        }
        function onHashChange() {
          if (!useHash) return;
          if (skipHashChange === window.location.hash) {
            skipHashChange = null;
            return;
          }
          if (window.location.hash.length < 2) return;
          updateSnapshotData(window.location.hash.substring(1));
          dispatchEventRestore();
        }
        function onPopState(event) {
          const browserState = event.state;
          if (!browserState || !browserState.aelluxState) return;
          if (browserState.ajaxHref && Aellux.ajaxHref) {
            Aellux.ajaxHref.load(
              window.location.href,
              browserState.ajaxHref,
              { ignoreHistory: true }
            );
          }
          if (browserState.snapshot) {
            updateSnapshotData(snapshotToString(browserState.snapshot));
            dispatchEventRestore();
          } else if (useHash) {
            updateSnapshotData(window.location.hash.substring(1));
            dispatchEventRestore();
          }
          if (!useHash) return;
          skipHashChange = window.location.hash;
          setTimeout(function() {
            if (skipHashChange === window.location.hash)
              skipHashChange = null;
          }, 0);
        }
      })();
    }
  });

  // src/aellux.uxm.adaptive.js
  var aellux_uxm_adaptive_exports = {};
  var init_aellux_uxm_adaptive = __esm({
    "src/aellux.uxm.adaptive.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const moduleName = "adaptive";
        const attr = {
          adaptive: Aellux.attr(moduleName)
        };
        const modifier = {
          shapeHorizontal: Aellux.className("shape-horizontal"),
          shapeVertical: Aellux.className("shape-vertical"),
          shapeSquare: Aellux.className("shape-square")
        };
        const mountDOM = /* @__PURE__ */ new Map();
        Aellux.uxmRegister(moduleName, { init, destroy, mountDOM });
        async function init() {
          mountDOM.set(`[${attr.adaptive}]`, {
            update: updateAdaptive,
            unmount: unmountAdaptive
          });
        }
        async function destroy() {
        }
        async function updateAdaptive(adaptiveContainer) {
          if (!adaptiveContainer.hasAttribute("aria-busy"))
            adaptiveContainer.setAttribute("aria-busy", true);
          Aellux.observe(adaptiveContainer, "resize");
          adaptiveContainer.addEventListener(Aellux.eventName("ResizeObserver"), onResizeObserver);
        }
        function unmountAdaptive(adaptiveContainer) {
          Aellux.unobserve(adaptiveContainer, "resize");
          adaptiveContainer.removeEventListener(Aellux.eventName("ResizeObserver"), onResizeObserver);
        }
        function onResizeObserver(event) {
          const entry = event.detail;
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;
          const adaptiveContainer = entry.target;
          const params = Aellux.options.adaptiveParams;
          const ratioBreakpoints = params.ratioShapes;
          const ratio = height > 0 ? width / height : 0;
          adaptiveContainer.classList.toggle(modifier.shapeVertical, ratio < ratioBreakpoints.vertical);
          adaptiveContainer.classList.toggle(modifier.shapeHorizontal, ratio > ratioBreakpoints.horizontal);
          adaptiveContainer.classList.toggle(
            modifier.shapeSquare,
            ratio >= ratioBreakpoints.vertical && ratio <= ratioBreakpoints.horizontal
          );
          const sizes = Object.keys(params.minSizes);
          const spaceBreakpoints = params.minSizes;
          const space = Math.sqrt(width * height);
          for (var i = 0; i < sizes.length; i++) {
            var size = sizes[i];
            adaptiveContainer.classList.toggle(
              Aellux.className("fits-" + size),
              space >= spaceBreakpoints[size]
            );
          }
          adaptiveContainer.setAttribute(Aellux.attr("ready"), "");
          Aellux.dispatchFrom(adaptiveContainer, "AdaptiveUpdate", { detail: null });
        }
        function inferOrientation(flexBox, selector = "*") {
          return Aellux.waitLayout.read(() => {
            const fallback = "horizontal";
            var style = getComputedStyle(flexBox);
            if (style.display === "flex" || style.display === "inline-flex") {
              return style.flexDirection.indexOf("column") === 0 ? "vertical" : "horizontal";
            }
            if (!selector || selector.length === 0) return fallback;
            var children = flexBox.querySelectorAll(selector);
            if (children.length < 2) return fallback;
            var first = children[0].getBoundingClientRect();
            var second = children[1].getBoundingClientRect();
            var deltaX = Math.abs(
              second.left + second.width / 2 - (first.left + first.width / 2)
            );
            var deltaY = Math.abs(
              second.top + second.height / 2 - (first.top + first.height / 2)
            );
            return deltaY > deltaX ? "vertical" : "horizontal";
          });
        }
      })();
    }
  });

  // src/aellux.uxm.feedback.js
  var aellux_uxm_feedback_exports = {};
  var init_aellux_uxm_feedback = __esm({
    "src/aellux.uxm.feedback.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const moduleName = "feedback";
        Aellux.uxmRegister(moduleName, {
          init,
          destroy,
          warning,
          error,
          success,
          announce,
          busy,
          validate,
          progress,
          on,
          off,
          send
        });
        const handlers = /* @__PURE__ */ new Map();
        async function init() {
        }
        async function destroy() {
        }
        function on(type, handler) {
          if (!handlers.has(type)) {
            handlers.set(type, /* @__PURE__ */ new Set());
          }
          handlers.get(type).add(handler);
          return { off() {
            !handlers.has(type) ? null : handlers.get(type).delete(handler);
          } };
        }
        function off(type, handler) {
          return !handlers.has(type) ? null : handlers.get(type).delete(handler);
        }
        function warning(message) {
          send({ type: "warning", message });
        }
        function error(message) {
          send({ type: "error", message });
        }
        function success(message) {
          send({ type: "success", message });
        }
        function announce(message) {
          send({ type: "announce", message });
        }
        function busy(target, message, value) {
          send({ type: "busy", message, value, target });
        }
        function validate(target, message, value) {
          send({ type: "validate", message, value, target });
        }
        function progress(target, message, value) {
          send({ type: "progress", message, value, target });
        }
        function send({ type, message, value, target }) {
          target = target || document;
          const feedback = { type, message, value, target };
          Aellux.dispatchFrom(target, "Feedback", { detail: feedback });
          if (handlers.has(type)) handlers.get(type).forEach((call) => call(feedback));
          if (handlers.has("*")) handlers.get("*").forEach((call) => call(feedback));
        }
      })();
    }
  });

  // src/aellux.uxm.ajax-href.js
  var aellux_uxm_ajax_href_exports = {};
  var init_aellux_uxm_ajax_href = __esm({
    "src/aellux.uxm.ajax-href.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const moduleName = "ajax-href";
        Aellux.uxmRegister(moduleName, { init, destroy, load });
        const attr = {
          ajaxHref: Aellux.attr(moduleName)
        };
        async function init() {
          document.addEventListener("click", onClick);
        }
        async function destroy() {
          document.removeEventListener("click", onClick);
        }
        let previousController = null;
        async function load(url, selectors, options = {}) {
          options = options || {};
          if (previousController) {
            previousController.abort();
          }
          const controller = "AbortController" in window ? new AbortController() : { signal: null, abort: () => null };
          previousController = controller;
          const selectorList = (Array.isArray(selectors) ? selectors : selectors.split(",")).map((selector) => selector.trim()).filter(Boolean);
          const elements = /* @__PURE__ */ new Map();
          selectorList.forEach(function(selector) {
            const currentElement = document.querySelector(selector);
            if (!currentElement) return;
            elements.set(selector, currentElement);
            if (Aellux.feedback) {
              Aellux.feedback.busy(currentElement, "Ajax loading", true);
              Aellux.feedback.progress(currentElement, "Ajax loading", 0);
            }
          });
          try {
            const response = await Aellux.request(url, { signal: controller.signal });
            const html = await response.text();
            const loadedDocument = new DOMParser().parseFromString(html, "text/html");
            selectorList.forEach(function(selector) {
              const currentElement = elements.get(selector);
              if (!currentElement) return;
              const loadedElement = loadedDocument.querySelector(selector);
              if (!loadedElement) return;
              const replacement = document.importNode(loadedElement, true);
              currentElement.replaceWith(replacement);
              if (selector === "title" && Aellux.stateNavigation)
                Aellux.stateNavigation.updateBaseTitle(replacement.innerText);
              Aellux(replacement);
              if (Aellux.feedback) {
                Aellux.feedback.busy(replacement, "Ajax loaded", false);
                Aellux.feedback.progress(replacement, "Ajax loaded", 1);
              }
            });
            if (!options.ignoreHistory && Aellux.stateNavigation) {
              Aellux.stateNavigation.ajaxHref(url, selectors);
            }
          } catch (error) {
            selectorList.forEach(function(selector) {
              const currentElement = elements.get(selector);
              if (!currentElement) return;
              if (Aellux.feedback) {
                Aellux.feedback.busy(currentElement, "Ajax loading", false);
                Aellux.feedback.progress(currentElement, "Ajax loading", 1);
              }
            });
            if (error.name === "AbortError") return null;
            throw error;
          } finally {
            if (previousController === controller)
              previousController = null;
          }
        }
        function onClick(event) {
          if (event.button !== 0) return;
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          const link = event.target.closest(`[${attr.ajaxHref}]`);
          if (!link || link.tagName !== "A") return;
          if (link.target && link.target !== "_self") return;
          if (link.hasAttribute("download")) return;
          const selectors = link.getAttribute(attr.ajaxHref);
          if (!selectors) return;
          event.preventDefault();
          Aellux.ajaxHref.load(link.href, selectors);
        }
      })();
    }
  });

  // src/aellux.orchestrator.js
  /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var modulePromises = {};
  root.Aellux = Object.assign(AelluxForceUpdate, root.Aellux, {
    async startAellux() {
      const allModules = [];
      Aellux.options.load.forEach((mName) => allModules.push(
        loadUXM(mName).then((module) => {
          if ("init" in module && typeof module.init === "function" && "destroy" in module && typeof module.destroy === "function")
            return module.init();
        }).catch((error) => {
          console.error(
            `[Aellux] UX module "${mName}" failed to initialize.`,
            error
          );
        })
      ));
      await Promise.all(allModules);
      Aellux.dispatch("Ready");
      if (document.readyState === "loading") {
        document.addEventListener(
          "DOMContentLoaded",
          () => {
            Aellux.update();
          },
          { once: true }
        );
      } else {
        Aellux.update();
      }
      return true;
    },
    update(root3) {
      AelluxForceUpdate(root3);
    },
    unmount(root3) {
      AelluxForceUnmount(root3);
    },
    destroy() {
      Aellux.observers.resize.disconnect();
      Aellux.observers.mutation.disconnect();
      Aellux.observers.intersection.disconnect();
    },
    dispatchFrom(from, event, options) {
      from.dispatchEvent(new CustomEvent(Aellux.eventName(event), options));
    },
    wait(moduleName) {
      const key = toCamelCase(moduleName);
      if (key in Aellux) {
        return Promise.resolve(Aellux[key]);
      }
      if (modulePromises[key]) {
        return modulePromises[key];
      }
      if (Aellux.options.load.indexOf(moduleName) > -1) {
        return loadUXM(moduleName);
      }
      return Promise.reject();
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
      intersection: new IntersectionObserver(mutationObserverCallback)
    }),
    waitLayout: createLayoutScheduler()
  });
  root[root.Aellux.shortJSName] = root.Aellux;
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
  function loadUXM(mName) {
    const key = toCamelCase(mName);
    if (modulePromises[key])
      return modulePromises[key];
    const bundledLoader = Aellux.bundledModules ? Aellux.bundledModules[mName] : null;
    modulePromises[key] = (bundledLoader ? Promise.resolve().then(() => bundledLoader()) : loadScript(key, `${Aellux.aelluxBasePath}${Aellux.uxmFilename(mName)}`)).then(() => Aellux[key]).catch(() => Promise.reject());
    return modulePromises[key];
  }
  async function loadScript(name, scriptPath) {
    return new Promise((resolve, reject) => {
      var attr = Aellux.attr("uxm");
      var script = document.createElement("script");
      script.src = scriptPath;
      script.setAttribute(attr, name);
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        reject();
      };
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
  function AelluxForceUpdate(root3) {
    return AelluxForce(root3, "update");
  }
  function AelluxForceUnmount(root3) {
    return AelluxForce(root3, "unmount");
  }
  function AelluxForce(root3, method) {
    resolveRoots(root3).forEach((rootElement) => {
      Aellux.options.load.forEach((mName) => {
        const key = toCamelCase(mName);
        const mounter = Aellux[key].mountDOM;
        if (!mounter) return;
        for (const [attr, controller] of mounter) {
          if (!(method in controller)) continue;
          const elements = findElements(rootElement, attr);
          elements.forEach((currentElement) => {
            try {
              Promise.resolve(controller[method](currentElement)).catch((error) => console.error(error));
            } catch (error) {
              console.error(error);
            }
          });
        }
      });
    });
  }
  function resolveRoots(root3) {
    if (!root3) {
      return [document];
    }
    if (typeof root3 === "string") {
      try {
        return Array.from(document.querySelectorAll(root3));
      } catch (error) {
        return [];
      }
    }
    if (root3 instanceof Element || root3 instanceof Document || root3 instanceof DocumentFragment) {
      return [root3];
    }
    return [];
  }
  function findElements(root3, selector) {
    const elements = [];
    if (root3.nodeType === Node.ELEMENT_NODE && root3.matches(selector)) {
      elements.push(root3);
    }
    if (root3.querySelectorAll) {
      root3.querySelectorAll(selector).forEach(function(element) {
        elements.push(element);
      });
    }
    return elements;
  }
  function toCamelCase(name) {
    return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
  var pageWasHidden = false;
  window.addEventListener("pagehide", () => pageWasHidden = true);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && pageWasHidden) {
      pageWasHidden = false;
    }
  });

  // src/aellux.full.esm.js
  /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var root2 = typeof globalThis !== "undefined" ? globalThis : window;
  root2.Aellux.bundledModules = Object.freeze({
    "preferences": () => Promise.resolve().then(() => (init_aellux_uxm_preferences(), aellux_uxm_preferences_exports)),
    "state-navigation": () => Promise.resolve().then(() => (init_aellux_uxm_state_navigation(), aellux_uxm_state_navigation_exports)),
    "adaptive": () => Promise.resolve().then(() => (init_aellux_uxm_adaptive(), aellux_uxm_adaptive_exports)),
    "feedback": () => Promise.resolve().then(() => (init_aellux_uxm_feedback(), aellux_uxm_feedback_exports)),
    "ajax-href": () => Promise.resolve().then(() => (init_aellux_uxm_ajax_href(), aellux_uxm_ajax_href_exports))
  });
})();
//# sourceMappingURL=aellux.full.js.map
