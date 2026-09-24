(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };

  // src/aellux.ext.preferences.js
  var aellux_ext_preferences_exports = {};
  var init_aellux_ext_preferences = __esm({
    "src/aellux.ext.preferences.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const extensionName = "preferences";
        const userPreferences = /* @__PURE__ */ Object.create(null);
        const defaultPreferences = /* @__PURE__ */ Object.create(null);
        const computedPreferences = /* @__PURE__ */ Object.create(null);
        const mountDOM = /* @__PURE__ */ new Map();
        Aellux.extRegister(extensionName, { init, destroy, update, get, set, mountDOM });
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
        const prefOptions = {
          colorScheme: ["auto", "light", "dark"],
          contrast: ["auto", "no-preference", "more", "less"],
          reducedMotion: ["auto", "no-preference", "reduced"],
          reducedTransparency: ["auto", "no-preference", "reduced"],
          forcedColors: ["auto", "no-preference", "active"],
          textScale: [1, 1.5, 0.8],
          interfaceScale: [1, 1.5, 0.8],
          extendedTiming: ["off", "on"],
          largeTargets: ["off", "on"],
          haptics: ["on", "off"],
          sound: ["off", "on", "low"]
        };
        function init() {
          mountDOM.set(`[${attr.preference}]`, {
            mount: mountPreferenceContainer,
            unmount: unmountPreferenceContainer
          });
          window.addEventListener("storage", storageEvent);
          const allQueries = Aellux.preferencesMediaQueries;
          Object.values(allQueries).forEach(
            (queries) => Object.values(queries).forEach(
              (query) => {
                if (!query) return;
                if (query.addEventListener) {
                  query.addEventListener("change", update);
                } else if (query.addListener) {
                  query.addListener(update);
                }
              }
            )
          );
          Object.entries(prefOptions).forEach(([param, options]) => defaultPreferences[param] = options[0]);
          loadUserPreferences();
          update();
        }
        function destroy() {
          window.removeEventListener("storage", storageEvent);
          document.removeEventListener("DOMContentLoaded", update);
          const allQueries = Aellux.preferencesMediaQueries;
          Object.values(allQueries).forEach(
            (queries) => Object.values(queries).forEach(
              (query) => {
                if (!query) return;
                if (query.removeEventListener) {
                  query.removeEventListener("change", update);
                } else if (query.removeListener) {
                  query.removeListener(update);
                }
              }
            )
          );
        }
        function get(preference) {
          const key = toCamelCase(preference);
          return computedPreferences[key];
        }
        function set(preference, value) {
          const key = toCamelCase(preference);
          if (userPreferences[key] === value) return;
          userPreferences[key] = value;
          saveUserPreferences();
        }
        function storageEvent(event) {
          if (event.key !== "AelluxPreferences") return;
          const newPreferences = new URLSearchParams(event.newValue || "");
          Object.keys(userPreferences).forEach((key) => delete userPreferences[key]);
          newPreferences.forEach((value, key) => {
            userPreferences[key] = value;
          });
          update();
        }
        function update() {
          Object.assign(computedPreferences, defaultPreferences, userPreferences);
          Aellux.updatePreferencesAttributesHTML(computedPreferences);
          document.querySelectorAll(`[${attr.preference}]`).forEach((container) => updateContainer(container));
          Aellux.dispatch("PreferencesChange");
        }
        function updateContainer(container) {
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
        }
        function saveUserPreferences() {
          Aellux.persist.preferences.setObject(userPreferences);
        }
        function loadUserPreferences() {
          Object.assign(userPreferences, Aellux.persist.preferences.getObject());
        }
        function mountPreferenceContainer(container) {
          container.addEventListener("click", onContainerClick);
        }
        function unmountPreferenceContainer(container) {
          container.removeEventListener("click", onContainerClick);
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
        function toCamelCase(name) {
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

  // src/aellux.ext.state-navigation.js
  var aellux_ext_state_navigation_exports = {};
  var init_aellux_ext_state_navigation = __esm({
    "src/aellux.ext.state-navigation.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const extensionName = "state-navigation";
        const globalSnapshot = {};
        Aellux.extRegister(extensionName, {
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

  // src/aellux.ext.adaptive.js
  var aellux_ext_adaptive_exports = {};
  var init_aellux_ext_adaptive = __esm({
    "src/aellux.ext.adaptive.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const extensionName = "adaptive";
        const attr = {
          adaptive: Aellux.attr(extensionName)
        };
        const modifier = {
          shapeHorizontal: Aellux.className("shape-horizontal"),
          shapeVertical: Aellux.className("shape-vertical"),
          shapeSquare: Aellux.className("shape-square")
        };
        const mountDOM = /* @__PURE__ */ new Map();
        const adaptiveParams = {
          experienceScale: {
            near: 1,
            far: 1.5
          },
          minSizes: {
            compact: 0,
            small: 480,
            medium: 768,
            large: 1024,
            xl: 1280,
            xxl: 1600
          },
          ratioShapes: {
            vertical: 0.8,
            //>square<
            horizontal: 1.25
          }
        };
        Aellux.extRegister(extensionName, { init, destroy, mountDOM, adaptiveParams });
        function init() {
          mountDOM.set(`[${attr.adaptive}]`, {
            mount: mountAdaptive,
            unmount: unmountAdaptive
          });
        }
        function destroy() {
        }
        function mountAdaptive(adaptiveContainer) {
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
          const params = adaptiveParams;
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

  // src/aellux.ext.feedback.js
  var aellux_ext_feedback_exports = {};
  var init_aellux_ext_feedback = __esm({
    "src/aellux.ext.feedback.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const extensionName = "feedback";
        Aellux.extRegister(extensionName, {
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
        function init() {
        }
        async function destroy() {
          handlers.clear();
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

  // src/aellux.ext.ajax-href.js
  var aellux_ext_ajax_href_exports = {};
  var init_aellux_ext_ajax_href = __esm({
    "src/aellux.ext.ajax-href.js"() {
      /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const extensionName = "ajax-href";
        Aellux.extRegister(extensionName, { init, destroy, load });
        const attr = {
          ajaxHref: Aellux.attr(extensionName)
        };
        function init() {
          document.addEventListener("click", onClick);
        }
        async function destroy() {
          document.removeEventListener("click", onClick);
          if (previousController) {
            previousController.abort();
          }
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
  (function() {
    "use strict";
    const root2 = typeof globalThis !== "undefined" ? globalThis : window;
    const extensionPromises = {};
    root2.Aellux = Object.assign(AelluxForceUpdate, root2.Aellux, {
      async startAellux() {
        if (root2.Aellux.bundledExtensions) {
          Object.keys(root2.Aellux.bundledExtensions).forEach((extensionName) => Aellux.ext(extensionName));
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
      async update(rootOrSelector, extensionLabels = null) {
        return AelluxForceUpdate(rootOrSelector, extensionLabels);
      },
      async unmount(rootOrSelector, extensionLabels = null) {
        return AelluxForceUnmount(rootOrSelector, extensionLabels);
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
          extensionLabels = Object.keys(extensionPromises);
        extensionLabels = extensionLabels.map((_) => fromCamelCase(_));
        try {
          await Aellux.unmount(document, extensionLabels);
        } catch (error) {
          console.error("[Aellux] Extension unmount failed.", error);
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
            console.error("[Aellux] Extension destroy failed.", error);
          } finally {
            delete extensionPromises[key];
            delete Aellux.extensionMounters[extensionLabel];
            if (extension) extension.initialized = false;
          }
        }
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
    root2[root2.Aellux.shortJSName] = root2.Aellux;
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
            const styleDefaultURL = data.loadStyle === true || data.loadStyle === "true" || data.loadStyle === "";
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
    ;
    async function AelluxForceUnmount(rootOrSelector, extensionLabels = null) {
      for (const rootElement of resolveRoots(rootOrSelector)) {
        await AelluxForce(rootElement, "unmount", extensionLabels);
      }
      return true;
    }
    async function AelluxForceUpdate(rootOrSelector, extensionLabels = null) {
      for (const rootElement of resolveRoots(rootOrSelector)) {
        const allWaiters = findElements(rootElement, Aellux.attr("wait-mounted"));
        allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "true"));
        const allLinks = findElements(rootElement, "link[rel='aellux-ext']");
        for (const link of allLinks) {
          const href = link.getAttribute("href");
          const loadWhen = link.getAttribute(Aellux.attr("load-when")) || void 0;
          const loadStyleValue = link.getAttribute(Aellux.attr("load-style"));
          const loadStyle = loadStyleValue === null || loadStyleValue === "false" ? false : loadStyleValue || true;
          link.setAttribute("rel", "aellux-ext-registered");
          Aellux.ext(href, { loadWhen, loadStyle });
        }
        const waitExtensions = [];
        for (const [extensionLabel, options] of Object.entries(root2.Aellux.extRegistry)) {
          if (options.loadWhen) continue;
          waitExtensions.push(getExtension(extensionLabel));
        }
        await Promise.all(waitExtensions);
        await AelluxForce(rootElement, "mount", extensionLabels);
        allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "false"));
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
        extensionLabels = extensionLabels.map((_) => fromCamelCase(_));
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
        const elementsAffected = /* @__PURE__ */ new Set();
        var localExtensionLabels;
        if (extensionLabels) {
          localExtensionLabels = new Set(extensionLabels);
        } else {
          localExtensionLabels = /* @__PURE__ */ new Set();
          for (const [extensionLabel, selector] of Object.entries(Aellux.lazyExtensionSelectors))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionLabels.add(extensionLabel);
          for (const [extensionLabel, selector] of Object.entries(Aellux.extensionMounters))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionLabels.add(extensionLabel);
        }
        for (const extensionLabel of localExtensionLabels) {
          const extensionPromise = method === "mount" ? getExtension(extensionLabel) : extensionPromises[toCamelCase(extensionLabel)];
          if (!extensionPromise) {
            continue;
          }
          const extension = await extensionPromise;
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
    ;
    function fromCamelCase(name) {
      return name.replace(/([A-Z])/g, "-$1").toLowerCase();
    }
    ;
  })();

  // src/aellux.full.esm.js
  /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  function appendBundledStyle(extensionName) {
    return new Promise((resolve) => {
      const data = root.Aellux.extRegistry[extensionName];
      const url = data.url.replace(/^\.\//, root.Aellux.aelluxBasePath);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url.replace(/\.js(?=[?#]|$)/, ".css");
      link.setAttribute(root.Aellux.attr("ext-style"), extensionName);
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }
  root.Aellux.bundledExtensions = Object.freeze({
    "preferences": () => Promise.resolve().then(() => (init_aellux_ext_preferences(), aellux_ext_preferences_exports)),
    "state-navigation": () => Promise.resolve().then(() => (init_aellux_ext_state_navigation(), aellux_ext_state_navigation_exports)),
    "adaptive": () => Promise.all([
      Promise.resolve().then(() => (init_aellux_ext_adaptive(), aellux_ext_adaptive_exports)),
      appendBundledStyle("adaptive")
    ]),
    "feedback": () => Promise.resolve().then(() => (init_aellux_ext_feedback(), aellux_ext_feedback_exports)),
    "ajax-href": () => Promise.resolve().then(() => (init_aellux_ext_ajax_href(), aellux_ext_ajax_href_exports))
  });
})();
//# sourceMappingURL=aellux.full.js.map
