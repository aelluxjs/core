(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };

  // src/internal/utils-name-case.js
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
  var utils_name_case_default;
  var init_utils_name_case = __esm({
    "src/internal/utils-name-case.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      utils_name_case_default = {
        toCapitalized,
        toCamelCase,
        fromCamelCase
      };
    }
  });

  // src/aellux.ext.preferences.js
  var aellux_ext_preferences_exports = {};
  var init_aellux_ext_preferences = __esm({
    "src/aellux.ext.preferences.js"() {
      init_utils_name_case();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const { toCamelCase: toCamelCase2 } = utils_name_case_default;
        const extensionName = "preferences";
        const userPreferences = /* @__PURE__ */ Object.create(null);
        const defaultPreferences = /* @__PURE__ */ Object.create(null);
        const computedPreferences = /* @__PURE__ */ Object.create(null);
        const mountMap = /* @__PURE__ */ new Map();
        AelluxJs.extRegister(extensionName, { init, destroy, update, get, set, mountMap });
        const attr = {
          preference: AelluxJs.attr("preference"),
          option: AelluxJs.attr("option"),
          label: AelluxJs.attr("label"),
          next: AelluxJs.attr("next"),
          prev: AelluxJs.attr("prev"),
          ready: AelluxJs.attr("ready")
        };
        const className = {
          active: AelluxJs.className("active")
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
          mountMap.set(`[${attr.preference}]`, {
            mount: mountPreferenceContainer,
            unmount: unmountPreferenceContainer
          });
          window.addEventListener("storage", storageEvent);
          const allQueries = AelluxJs.preferencesMediaQueries;
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
          const allQueries = AelluxJs.preferencesMediaQueries;
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
          const key = toCamelCase2(preference);
          return computedPreferences[key];
        }
        function set(preference, value) {
          const key = toCamelCase2(preference);
          if (userPreferences[key] === value) return;
          userPreferences[key] = value;
          saveUserPreferences();
        }
        function storageEvent(event) {
          if (event.key !== "AelluxJsPreferences") return;
          const newPreferences = new URLSearchParams(event.newValue || "");
          Object.keys(userPreferences).forEach((key) => delete userPreferences[key]);
          newPreferences.forEach((value, key) => {
            userPreferences[key] = value;
          });
          update();
        }
        function update() {
          Object.assign(computedPreferences, defaultPreferences, userPreferences);
          AelluxJs.updatePreferencesAttributesHTML(computedPreferences);
          document.querySelectorAll(`[${attr.preference}]`).forEach((container) => updateContainer(container));
          AelluxJs.dispatch("PreferencesChange");
        }
        function updateContainer(container) {
          const preference = container.getAttribute(attr.preference);
          const elements = container.querySelectorAll(`[${attr.option}]`);
          const selectedLabel = container.querySelector(`[${attr.label}]`);
          elements.forEach((element) => {
            const value = element.getAttribute(attr.option);
            const selected = value === get(preference);
            element.classList.toggle(className.active, selected);
            const labelFor = element.getAttribute("for");
            if (labelFor) {
              const forTarget = document.getElementById(labelFor);
              if (forTarget) {
                if ("value" in forTarget) forTarget.value = value;
                if ("checked" in forTarget) forTarget.checked = selected;
              }
            }
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
          AelluxJs.persist.preferences.setObject(userPreferences);
        }
        function loadUserPreferences() {
          Object.assign(userPreferences, AelluxJs.persist.preferences.getObject());
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
      })();
    }
  });

  // src/aellux.ext.state-navigation.js
  var aellux_ext_state_navigation_exports = {};
  var init_aellux_ext_state_navigation = __esm({
    "src/aellux.ext.state-navigation.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const extensionName = "state-navigation";
        const globalSnapshot = {};
        AelluxJs.extRegister(extensionName, {
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
          if ("useHash" in AelluxJs.options) {
            useHash = AelluxJs.options.useHash;
          }
          baseTitle = document.title;
          onHashChange();
          history.replaceState({
            aelluxJsState: true,
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
          history.replaceState({ aelluxJsState: true, snapshot: globalSnapshot, ajaxHref: selectors }, "", window.location.href);
          updateSnapshotData();
          history.pushState({ aelluxJsState: true, snapshot: null, ajaxHref: selectors }, "", url);
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
          const state = { aelluxJsState: true, snapshot: Object.assign({}, globalSnapshot) };
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
          AelluxJs.dispatch(name, options);
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
          if (!browserState || !browserState.aelluxJsState) return;
          if (browserState.ajaxHref && AelluxJs.ajaxHref) {
            AelluxJs.ajaxHref.load(
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

  // src/aellux.ext.feedback.js
  var aellux_ext_feedback_exports = {};
  var init_aellux_ext_feedback = __esm({
    "src/aellux.ext.feedback.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const extensionName = "feedback";
        AelluxJs.extRegister(extensionName, {
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
            removeHandler(type, handler);
          } };
        }
        function off(type, handler) {
          return removeHandler(type, handler);
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
          AelluxJs.dispatchFrom(target, "Feedback", { detail: feedback });
          if (handlers.has(type)) handlers.get(type).forEach((call) => call(feedback));
          if (handlers.has("*")) handlers.get("*").forEach((call) => call(feedback));
        }
        function removeHandler(type, handler) {
          const typeHandlers = handlers.get(type);
          if (!typeHandlers) return false;
          const removed = typeHandlers.delete(handler);
          if (typeHandlers.size === 0) handlers.delete(type);
          return removed;
        }
      })();
    }
  });

  // src/aellux.ext.ajax-href.js
  var aellux_ext_ajax_href_exports = {};
  var init_aellux_ext_ajax_href = __esm({
    "src/aellux.ext.ajax-href.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function() {
        "use strict";
        const extensionName = "ajax-href";
        AelluxJs.extRegister(extensionName, { init, destroy, load });
        const attr = {
          ajaxHref: AelluxJs.attr(extensionName)
        };
        function init() {
          document.addEventListener("click", onClick);
        }
        function destroy() {
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
            if (AelluxJs.feedback) {
              AelluxJs.feedback.busy(currentElement, "Ajax loading", true);
              AelluxJs.feedback.progress(currentElement, "Ajax loading", 0);
            }
          });
          if (!options.ignoreHistory && AelluxJs.stateNavigation) {
            AelluxJs.stateNavigation.ajaxHref(url, selectors);
          }
          AelluxJs.dispatch("AjaxHrefStart");
          try {
            const response = await AelluxJs.request(url, { signal: controller.signal });
            const html = await response.text();
            const loadedDocument = new DOMParser().parseFromString(html, "text/html");
            for (const selector of selectorList) {
              const currentElement = elements.get(selector);
              if (!currentElement) continue;
              const loadedElement = loadedDocument.querySelector(selector);
              if (!loadedElement) continue;
              await AelluxJs.unmount(currentElement);
              const replacement = document.importNode(loadedElement, true);
              currentElement.replaceWith(replacement);
              if (selector === "title" && AelluxJs.stateNavigation)
                AelluxJs.stateNavigation.updateBaseTitle(replacement.innerText);
              await AelluxJs.update(replacement);
              if (AelluxJs.feedback) {
                AelluxJs.feedback.busy(replacement, "Ajax loaded", false);
                AelluxJs.feedback.progress(replacement, "Ajax loaded", 1);
              }
            }
            AelluxJs.dispatch("AjaxHrefLoaded");
          } catch (error) {
            selectorList.forEach(function(selector) {
              const currentElement = elements.get(selector);
              if (!currentElement) return;
              if (AelluxJs.feedback) {
                AelluxJs.feedback.busy(currentElement, "Ajax loading", false);
                AelluxJs.feedback.progress(currentElement, "Ajax loading", 1);
              }
            });
            AelluxJs.dispatch("AjaxHrefError");
            if (error.name === "AbortError") return null;
            throw error;
          } finally {
            if (previousController === controller)
              previousController = null;
            AelluxJs.dispatch("AjaxHrefComplete");
          }
        }
        function onClick(event) {
          if (event.button !== 0) return;
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          const link = event.target.closest(`[${attr.ajaxHref}]`);
          if (!link || !link.href || link.tagName !== "A") return;
          const rawHref = link.getAttribute("href");
          if (link.target && link.target !== "_self") return;
          if (rawHref && rawHref.startsWith("#")) return;
          if (link.hasAttribute("download") || link.hasAttribute("data-no-ajax")) return;
          const selectors = link.getAttribute(attr.ajaxHref);
          if (!selectors) return;
          const destinyUrl = comparableUrl(link.href);
          const currentUrl = comparableUrl(window.location.href);
          if (destinyUrl.origin !== currentUrl.origin) {
            AelluxJs.dispatch("AjaxHrefDropOrigin");
            return;
          }
          if (destinyUrl.href === currentUrl.href) {
            if (destinyUrl.hash && destinyUrl.hash !== currentUrl.hash) return;
            event.preventDefault();
            AelluxJs.dispatch("AjaxHrefStart");
            AelluxJs.dispatch("AjaxHrefLoaded");
            AelluxJs.dispatch("AjaxHrefComplete");
            return;
          }
          event.preventDefault();
          AelluxJs.ajaxHref.load(link.href, selectors);
        }
        function comparableUrl(value) {
          const url = new URL(value, window.location.href);
          return {
            origin: url.origin,
            href: `${url.origin}${url.pathname}${url.search}`,
            hash: url.hash
          };
        }
      })();
    }
  });

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
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createMountHelper(root2, extensionPromises) {
    const { toCapitalized: toCapitalized2, toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const mountedElements = /* @__PURE__ */ new WeakMap();
    async function AelluxJsForceUnmount(rootOrSelector, extensionLabels = null) {
      for (const rootElement of resolveRoots(rootOrSelector)) {
        await AelluxJsForce(rootElement, "unmount", extensionLabels);
      }
      return true;
    }
    async function AelluxJsForceUpdate(rootOrSelector, extensionLabels = null) {
      const AelluxJs2 = root2.AelluxJs;
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
        for (const [extensionLabel, options] of Object.entries(root2.AelluxJs.extRegistry)) {
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
      const AelluxJs2 = root2.AelluxJs;
      if (typeof extensionLabels === "string")
        extensionLabels = [extensionLabels];
      var filter;
      if (!extensionLabels) {
        const mounterSelectors = Object.values(AelluxJs2.extensionMounters);
        const lazySelectors = Object.values(AelluxJs2.lazyExtensionSelectors);
        filter = [...mounterSelectors, ...lazySelectors];
      } else {
        filter = [];
        extensionLabels = extensionLabels.map((_) => fromCamelCase2(_));
        for (const [label, selectorString] of Object.entries(AelluxJs2.extensionMounters))
          if (extensionLabels.indexOf(fromCamelCase2(label)) !== -1)
            filter.push(selectorString);
        for (const [label, selectorString] of Object.entries(AelluxJs2.lazyExtensionSelectors))
          if (extensionLabels.indexOf(fromCamelCase2(label)) !== -1)
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
          const extensionPromise = method === "mount" ? AelluxJs2.wait(extensionLabel) : extensionPromises[toCamelCase2(extensionLabel)];
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
      AelluxJs2.dispatch(toCapitalized2(method));
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
    return {
      AelluxJsForceUpdate,
      AelluxJsForceUnmount
    };
  }

  // src/aellux.orchestrator.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root2) {
    "use strict";
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const extensionPromises = {};
    const mountHelper = createMountHelper(root2, extensionPromises);
    const layoutScheduler = createLayoutScheduler();
    root2.AelluxJs = Object.assign(
      mountHelper.AelluxJsForceUpdate,
      root2.AelluxJs,
      {
        async startAelluxJs() {
          if (root2.AelluxJs.bundledExtensions) {
            Object.keys(root2.AelluxJs.bundledExtensions).forEach((extensionName) => AelluxJs.ext(extensionName));
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
          extensionLabels = extensionLabels.map((_) => fromCamelCase2(_));
          try {
            await AelluxJs.unmount(document, extensionLabels);
          } catch (error) {
            AelluxJs.diagnostics.report(
              AelluxJs.diagnostics.ERROR_EXTENSION_UNMOUNT,
              { cause: error, extensions: extensionLabels }
            );
          }
          for (const extensionLabel of extensionLabels) {
            const key = toCamelCase2(extensionLabel);
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
    root2[root2.AelluxJs.shortJSName] = root2.AelluxJs;
    function getExtension(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
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
      const extensionName = fromCamelCase2(extensionLabel);
      const key = toCamelCase2(extensionLabel);
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
      const extensionName = fromCamelCase2(name);
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
  })(typeof globalThis !== "undefined" ? globalThis : window);

  // src/aellux.full.esm.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  root.AelluxJs.bundledExtensions = Object.freeze({
    "preferences": () => Promise.resolve().then(() => (init_aellux_ext_preferences(), aellux_ext_preferences_exports)),
    "state-navigation": () => Promise.resolve().then(() => (init_aellux_ext_state_navigation(), aellux_ext_state_navigation_exports)),
    "feedback": () => Promise.resolve().then(() => (init_aellux_ext_feedback(), aellux_ext_feedback_exports)),
    "ajax-href": () => Promise.resolve().then(() => (init_aellux_ext_ajax_href(), aellux_ext_ajax_href_exports))
  });
})();
//# sourceMappingURL=aellux.full.js.map
