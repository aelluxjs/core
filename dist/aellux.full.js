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

  // src/aellux.ext.preference.js
  var aellux_ext_preference_exports = {};
  var init_aellux_ext_preference = __esm({
    "src/aellux.ext.preference.js"() {
      init_utils_name_case();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const { toCamelCase: toCamelCase2 } = utils_name_case_default;
        const extensionName = "preference";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const userPreferences = /* @__PURE__ */ Object.create(null);
        const defaultPreferences = /* @__PURE__ */ Object.create(null);
        const computedPreferences = /* @__PURE__ */ Object.create(null);
        const containersByPreference = /* @__PURE__ */ new Map();
        const containerPreferences = /* @__PURE__ */ new Map();
        AelluxJs2.extAttach(extensionName, { init, destroy, update, get, set });
        const attr = {
          preference: AelluxJs2.attr("preference"),
          option: AelluxJs2.attr("option"),
          label: AelluxJs2.attr("label"),
          next: AelluxJs2.attr("next"),
          prev: AelluxJs2.attr("prev"),
          ready: AelluxJs2.attr("ready")
        };
        const className = {
          active: AelluxJs2.className("active")
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
        function init(options) {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attr.preference}]`,
            priority: 0,
            mount: mountPreferenceContainer,
            unmount: unmountPreferenceContainer
          });
          window.addEventListener("storage", storageEvent);
          const allQueries = AelluxJs2.registry.preferenceMediaQueries;
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
          Object.entries(prefOptions).forEach(([param, options2]) => {
            defaultPreferences[param] = options2[0];
          });
          loadUserPreferences();
          update();
        }
        function destroy() {
          AelluxJs2.mountManager.remove({ extensionName });
          containersByPreference.clear();
          containerPreferences.clear();
          window.removeEventListener("storage", storageEvent);
          document.removeEventListener("DOMContentLoaded", update);
          const allQueries = AelluxJs2.registry.preferenceMediaQueries;
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
          const nextPreferences = Object.assign(/* @__PURE__ */ Object.create(null), defaultPreferences, userPreferences);
          const changed = /* @__PURE__ */ new Set();
          for (const key in computedPreferences) {
            if (!(key in nextPreferences)) {
              delete computedPreferences[key];
              changed.add(key);
            }
          }
          for (const key in nextPreferences) {
            if (computedPreferences[key] !== nextPreferences[key]) changed.add(key);
            computedPreferences[key] = nextPreferences[key];
          }
          AelluxJs2.updatePreferenceAttributesHTML(computedPreferences);
          for (const container of containerPreferences.keys()) {
            if (indexContainer(container)) updateContainer(container);
          }
          for (const key of changed) {
            const containers = containersByPreference.get(key);
            if (containers) for (const container of containers) updateContainer(container);
          }
          AelluxJs2.dispatch("PreferencesChange", {
            detail: {
              changed: Array.from(changed),
              preferences: Object.assign({}, computedPreferences)
            }
          });
        }
        function indexContainer(container) {
          const key = toCamelCase2(container.getAttribute(attr.preference) || "");
          const previous = containerPreferences.get(container);
          if (previous === key) return false;
          if (previous !== void 0) {
            const containers2 = containersByPreference.get(previous);
            containers2.delete(container);
            if (!containers2.size) containersByPreference.delete(previous);
          }
          let containers = containersByPreference.get(key);
          if (!containers) {
            containers = /* @__PURE__ */ new Set();
            containersByPreference.set(key, containers);
          }
          containers.add(container);
          containerPreferences.set(container, key);
          return true;
        }
        function updateContainer(container) {
          const preference = container.getAttribute(attr.preference);
          const elements = container.querySelectorAll(`[${attr.option}]`);
          const labels = container.querySelectorAll(`[${attr.label}]`);
          const currentValue = get(preference || "");
          labels.forEach((label) => {
            const value = label.getAttribute(attr.label);
            const selected = String(value) === String(currentValue);
            label.hidden = !selected;
          });
          elements.forEach((element) => {
            const value = element.getAttribute(attr.option);
            const selected = value === currentValue;
            element.classList.toggle(className.active, selected);
            const labelFor = element.getAttribute("for");
            if (labelFor) {
              const forTarget = document.getElementById(labelFor);
              if (forTarget) {
                if ("value" in forTarget) forTarget.value = value;
                if ("checked" in forTarget) forTarget.checked = selected;
              }
            }
          });
        }
        function saveUserPreferences() {
          AelluxJs2.persist.preferences.setObject(userPreferences);
        }
        function loadUserPreferences() {
          Object.assign(userPreferences, AelluxJs2.persist.preferences.getObject());
        }
        function mountPreferenceContainer(container) {
          indexContainer(container);
          updateContainer(container);
          container.addEventListener("click", onContainerClick);
        }
        function unmountPreferenceContainer(container) {
          container.removeEventListener("click", onContainerClick);
          const key = containerPreferences.get(container);
          if (key === void 0) return;
          const containers = containersByPreference.get(key);
          containers.delete(container);
          if (!containers.size) containersByPreference.delete(key);
          containerPreferences.delete(container);
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
            const key = toCamelCase2(preference);
            const options = prefOptions[key];
            if (!options || options.length === 0) return;
            const change = buttonNext ? 1 : -1;
            const currentValue = get(key);
            const currentIndex = options.findIndex(
              (option) => String(option) === String(currentValue)
            );
            const nextIndex = currentIndex < 0 ? buttonNext ? 0 : options.length - 1 : (currentIndex + change + options.length) % options.length;
            set(preference, options[nextIndex]);
            update();
          }
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.state-navigation.js
  var aellux_ext_state_navigation_exports = {};
  var init_aellux_ext_state_navigation = __esm({
    "src/aellux.ext.state-navigation.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "state-navigation";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const globalSnapshot = {};
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          updateBaseTitle,
          setState,
          globalSnapshot
        });
        const globalRemoveSnapshot = {};
        let globalSnapshotString = "";
        let skipHashChange = null;
        let baseTitle = "";
        let useHash = true;
        function init(options) {
          window.addEventListener("popstate", onPopState);
          window.addEventListener("hashchange", onHashChange);
          AelluxJs2.on("PushState", OnPushState);
          AelluxJs2.on("PushAjaxReplace", OnPushAjaxReplace);
          AelluxJs2.on("UpdateBaseTitle", OnUpdateBaseTitle);
          if ("useHash" in AelluxJs2.options)
            useHash = AelluxJs2.options.useHash;
          baseTitle = document.title;
          onHashChange();
          history.replaceState(mergeHistoryState({
            aelluxJsState: true,
            snapshot: Object.assign({}, globalSnapshot)
          }), "");
        }
        async function destroy() {
          window.removeEventListener("popstate", onPopState);
          window.removeEventListener("hashchange", onHashChange);
          AelluxJs2.off("PushState", OnPushState);
          AelluxJs2.off("PushAjaxReplace", OnPushAjaxReplace);
          AelluxJs2.off("UpdateBaseTitle", OnUpdateBaseTitle);
        }
        function updateBaseTitle(title = null) {
          baseTitle = title != null ? title : baseTitle;
          document.title = globalSnapshot.title || false ? `${globalSnapshot.title} - ${baseTitle}` : baseTitle;
        }
        function setState(key, value, title = void 0, silent = false) {
          return change(key, value, title, silent);
        }
        async function change(key, value, title = void 0, silent = false) {
          if (globalSnapshot.title === title && globalSnapshot[key] === value) return;
          if (title) globalSnapshot.title = title.replace(/\s+/g, " ");
          else delete globalSnapshot.title;
          globalSnapshot[key] = value;
          updateSnapshotData(snapshotToString(globalSnapshot));
          const state = { aelluxJsState: true, snapshot: Object.assign({}, globalSnapshot) };
          const url = useHash ? `#${globalSnapshotString}` : void 0;
          if (silent) history.replaceState(mergeHistoryState(state), "", url);
          else history.pushState(state, "", url);
          dispatchSnapshotEvent("SnapshotChange");
        }
        function updateSnapshotData(string = "") {
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
        function dispatchSnapshotEvent(name, popState = void 0) {
          updateBaseTitle();
          const options = {
            detail: {
              snapshot: Object.assign({}, globalSnapshot),
              removeSnapshot: Object.assign({}, globalRemoveSnapshot),
              popState: copyHistoryState(popState)
            },
            bubbles: true
          };
          AelluxJs2.dispatch(name, options);
        }
        function copyHistoryState(state) {
          if (!state || typeof state !== "object") return state;
          if (typeof root2.structuredClone === "function") return root2.structuredClone(state);
          const copy = Array.isArray(state) ? state.slice() : Object.assign({}, state);
          if (state.snapshot && typeof state.snapshot === "object")
            copy.snapshot = Object.assign({}, state.snapshot);
          if (state.ajaxReplace && typeof state.ajaxReplace === "object") {
            copy.ajaxReplace = Object.assign({}, state.ajaxReplace);
            if (Array.isArray(state.ajaxReplace.selectors))
              copy.ajaxReplace.selectors = state.ajaxReplace.selectors.slice();
          }
          return copy;
        }
        function onHashChange() {
          if (!useHash) return;
          if (skipHashChange === window.location.hash) {
            skipHashChange = null;
            return;
          }
          updateSnapshotData(window.location.hash.substring(1));
          dispatchSnapshotEvent("SnapshotRestore");
        }
        function onPopState(event) {
          const popState = event.state;
          if (!popState || !popState.aelluxJsState) return;
          if (popState.snapshot)
            updateSnapshotData(snapshotToString(popState.snapshot));
          else if (useHash)
            updateSnapshotData(window.location.hash.substring(1));
          else
            updateSnapshotData();
          dispatchSnapshotEvent("SnapshotRestore", popState);
          if (!useHash) return;
          skipHashChange = window.location.hash;
          setTimeout(function() {
            if (skipHashChange === window.location.hash)
              skipHashChange = null;
          }, 0);
        }
        function ajaxReplace(url, selectors) {
          const currentState = {
            aelluxJsState: true,
            snapshot: globalSnapshot,
            ajaxReplace: { url: window.location.href, selectors }
          }, targetState = {
            aelluxJsState: true,
            snapshot: null,
            ajaxReplace: { url, selectors }
          };
          history.replaceState(mergeHistoryState(currentState), "", window.location.href);
          updateSnapshotData();
          history.pushState(targetState, "", url);
        }
        function mergeHistoryState(state) {
          const currentState = history.state;
          if (!currentState || typeof currentState !== "object" || Array.isArray(currentState))
            return state;
          return Object.assign({}, currentState, state);
        }
        function OnPushState(event) {
          try {
            const detail = event && event.detail;
            if (!detail || typeof detail !== "object" || typeof detail.key !== "string" || !detail.key.trim() || typeof detail.value !== "string" || !detail.value.trim() || detail.title !== void 0 && typeof detail.title !== "string") {
              AelluxJs2.diagnostics.warn(AelluxJs2.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
                extension: extensionName,
                event: "PushState",
                expected: "detail: { key: non-empty string, value: non-empty string, title?: string }"
              });
              return;
            }
            setState(detail.key, detail.value, detail.title);
          } catch (cause) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
              extension: extensionName,
              event: "PushState",
              cause
            });
          }
        }
        function OnPushAjaxReplace(event) {
          try {
            const detail = event && event.detail;
            if (!detail || typeof detail !== "object" || typeof detail.url !== "string" || !detail.url.trim() || !Object.prototype.hasOwnProperty.call(detail, "selectors") || detail.selectors == null) {
              AelluxJs2.diagnostics.warn(AelluxJs2.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
                extension: extensionName,
                event: "PushAjaxReplace",
                expected: "detail: { url: non-empty string, selectors: value }"
              });
              return;
            }
            ajaxReplace(detail.url, detail.selectors);
          } catch (cause) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
              extension: extensionName,
              event: "PushAjaxReplace",
              cause
            });
          }
        }
        function OnUpdateBaseTitle(event) {
          try {
            const detail = event && event.detail;
            if (!detail || typeof detail !== "object" || !Object.prototype.hasOwnProperty.call(detail, "title") || typeof detail.title !== "string") {
              AelluxJs2.diagnostics.warn(AelluxJs2.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
                extension: extensionName,
                event: "UpdateBaseTitle",
                expected: "detail: { title: string }"
              });
              return;
            }
            updateBaseTitle(detail.title);
          } catch (cause) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
              extension: extensionName,
              event: "UpdateBaseTitle",
              cause
            });
          }
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.feedback.js
  var aellux_ext_feedback_exports = {};
  var init_aellux_ext_feedback = __esm({
    "src/aellux.ext.feedback.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "feedback";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        AelluxJs2.extAttach(extensionName, {
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
        function init(options) {
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
          AelluxJs2.dispatchFrom(target, "Feedback", { detail: feedback });
          notifyHandlers(type, feedback);
          notifyHandlers("*", feedback);
        }
        function notifyHandlers(type, feedback) {
          if (!handlers.has(type)) return;
          handlers.get(type).forEach((call) => {
            try {
              const result = call(feedback);
              if (result && typeof result.then === "function") {
                Promise.resolve(result).catch((error2) => reportCallbackError(error2, type));
              }
            } catch (error2) {
              reportCallbackError(error2, type);
            }
          });
        }
        function reportCallbackError(error2, type) {
          AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
            cause: error2,
            extension: extensionName,
            type
          });
        }
        function removeHandler(type, handler) {
          const typeHandlers = handlers.get(type);
          if (!typeHandlers) return false;
          const removed = typeHandlers.delete(handler);
          if (typeHandlers.size === 0) handlers.delete(type);
          return removed;
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.focus.js
  var aellux_ext_focus_exports = {};
  var init_aellux_ext_focus = __esm({
    "src/aellux.ext.focus.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "focus";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          restoreLastFocus
        });
        const attribute = AelluxJs2.attr(extensionName);
        const snapshotKey = "ae-focus";
        const entries = [];
        const generatedHints = /* @__PURE__ */ new WeakSet();
        const nextElements = /* @__PURE__ */ new WeakSet();
        const textEntrySelector = "input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])";
        const focusableSelector = "a[href], area[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])";
        let current = null, restoring = false;
        function init() {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
            priority: 0,
            mount: mountFocusElement,
            unmount: unmountFocusElement
          });
          document.addEventListener("focusin", onFocusIn, true);
          document.addEventListener("focus", onFocusChange, true);
          document.addEventListener("blur", onBlur, true);
          root2.addEventListener("focus", onWindowFocus);
          root2.addEventListener("blur", onWindowBlur);
          AelluxJs2.on("SnapshotRestore", onSnapshotRestore);
          AelluxJs2.on("UnpopFocusLost", onUnpopFocusLost);
          remember(document.activeElement, false);
        }
        function destroy() {
          document.removeEventListener("focusin", onFocusIn, true);
          document.removeEventListener("focus", onFocusChange, true);
          document.removeEventListener("blur", onBlur, true);
          root2.removeEventListener("focus", onWindowFocus);
          root2.removeEventListener("blur", onWindowBlur);
          AelluxJs2.off("SnapshotRestore", onSnapshotRestore);
          AelluxJs2.off("UnpopFocusLost", onUnpopFocusLost);
          AelluxJs2.mountManager.remove({ extensionName });
          entries.length = 0;
          current = null;
        }
        function mountFocusElement(element) {
          const type = element.getAttribute(attribute);
          switch (type) {
            case "next":
              element.addEventListener("keydown", onNextKeyDown);
              nextElements.add(element);
              if (!element.hasAttribute("enterkeyhint") && element.matches(textEntrySelector)) {
                element.setAttribute("enterkeyhint", "next");
                generatedHints.add(element);
              }
              break;
          }
        }
        function unmountFocusElement(element) {
          if (nextElements.delete(element)) element.removeEventListener("keydown", onNextKeyDown);
          if (generatedHints.delete(element)) element.removeAttribute("enterkeyhint");
        }
        function onNextKeyDown(event) {
          if (event.key !== "Enter" || event.isComposing || event.repeat || event.defaultPrevented || event.target !== event.currentTarget && event.target.closest(focusableSelector) !== event.currentTarget) return;
          const elements = document.querySelectorAll(focusableSelector);
          let foundCurrent = false;
          for (const element of elements) {
            if (element === event.currentTarget) {
              foundCurrent = true;
            } else if (foundCurrent && element.tabIndex >= 0 && isValid(element)) {
              event.preventDefault();
              element.focus();
              return;
            }
          }
        }
        function isValid(element) {
          if (!element || element === document.body || element === document.documentElement || !element.isConnected || typeof element.focus !== "function" || element.matches(":disabled, [hidden], [inert]")) return false;
          for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
            if (node.hidden || node.hasAttribute("inert")) return false;
            const style = root2.getComputedStyle(node);
            if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
          }
          return element.getClientRects().length > 0;
        }
        function remember(element, push) {
          if (!isValid(element) || current && current.element === element) return;
          const entry = { element };
          entries.push(entry);
          if (entries.length > 100) entries.shift();
          current = entry;
          if (!push || !element.id || !element.id.trim()) return;
          AelluxJs2.dispatch("PushState", {
            detail: { key: snapshotKey, value: element.id }
          });
        }
        function onFocusIn(event) {
          if (!restoring) remember(event.target, true);
        }
        function onFocusChange(event) {
          if (!restoring) remember(event.target, true);
        }
        function onBlur(event) {
          if (!restoring) remember(event.target, false);
        }
        function onWindowFocus() {
          if (!restoring) remember(document.activeElement, true);
        }
        function onWindowBlur() {
          if (!restoring) remember(document.activeElement, false);
        }
        function restore(entry) {
          if (!entry || !isValid(entry.element)) return false;
          restoring = true;
          try {
            entry.element.focus();
          } finally {
            restoring = false;
          }
          if (document.activeElement !== entry.element) return false;
          current = entry;
          return true;
        }
        function restoreLastFocus() {
          const index = entries.indexOf(current);
          const start = (index < 0 ? entries.length : index) - 1;
          for (let i = start; i >= 0; i--) {
            if (restore(entries[i])) return true;
          }
          return false;
        }
        function onUnpopFocusLost() {
          restoreLastFocus();
        }
        function onSnapshotRestore(event) {
          const snapshot = event.detail && event.detail.snapshot;
          if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, snapshotKey)) return;
          const target = document.getElementById(snapshot[snapshotKey]);
          if (target) {
            for (let i = entries.length - 1; i >= 0; i--) {
              if (entries[i].element === target) {
                if (!restore(entries[i])) restoreLastFocus();
                return;
              }
            }
            if (restore({ element: target })) return;
          }
          restoreLastFocus();
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.point.js
  var aellux_ext_point_exports = {};
  var init_aellux_ext_point = __esm({
    "src/aellux.ext.point.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "point";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const trackedPointers = /* @__PURE__ */ new Map();
        const pointableElements = /* @__PURE__ */ new Set();
        const pointableAttribute = AelluxJs2.attr("point");
        const pointableSelector = `[${pointableAttribute}]`;
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          pointers
        });
        function init() {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: pointableSelector,
            priority: 0,
            mount: mountPointable,
            unmount: unmountPointable,
            controllers: ["pointers"]
          });
          document.addEventListener("pointerdown", onPointerDown, true);
          document.addEventListener("pointermove", onPointerMove, true);
          document.addEventListener("pointerup", onPointerUp, true);
          document.addEventListener("pointercancel", onPointerCancel, true);
          document.addEventListener("pointerover", onPointerOver, true);
          document.addEventListener("pointerout", onPointerOut, true);
        }
        function destroy() {
          AelluxJs2.mountManager.remove({ extensionName });
          document.removeEventListener("pointerdown", onPointerDown, true);
          document.removeEventListener("pointermove", onPointerMove, true);
          document.removeEventListener("pointerup", onPointerUp, true);
          document.removeEventListener("pointercancel", onPointerCancel, true);
          document.removeEventListener("pointerover", onPointerOver, true);
          document.removeEventListener("pointerout", onPointerOut, true);
          trackedPointers.clear();
          pointableElements.clear();
        }
        function mountPointable(element) {
          pointableElements.add(element);
        }
        function unmountPointable(element) {
          pointableElements.delete(element);
          for (const pointer of trackedPointers.values()) {
            if (pointer.target === element) pointer.target = null;
            if (pointer.pressStart === element) pointer.pressStart = null;
          }
        }
        function pointers(element) {
          const result = [];
          for (const pointer of trackedPointers.values()) {
            if (pointer.target === element) result.push(pointer);
          }
          return result;
        }
        function limitFor(element) {
          const value = element.getAttribute(pointableAttribute);
          if (value === null || !value.trim()) return 1;
          const trimmed = value.trim();
          const limit = Number(trimmed);
          return /^\d+$/.test(trimmed) && Number.isSafeInteger(limit) ? limit : 1;
        }
        function targetFor(target, pointer) {
          let element = target && target.nodeType === 1 ? target : target && target.parentElement;
          while (element) {
            if (pointableElements.has(element) && element.hasAttribute(pointableAttribute)) {
              let occupied = 0;
              for (const other of trackedPointers.values()) {
                if (other !== pointer && other.target === element) occupied++;
              }
              if (occupied < limitFor(element)) return element;
            }
            element = element.parentElement;
          }
          return null;
        }
        function dispatchPointer(name, pointer, originalEvent, recipient, hover, target = pointer.target, pressStart = pointer.pressStart) {
          if (!recipient) return;
          AelluxJs2.dispatchFrom(recipient, name, {
            bubbles: false,
            detail: {
              pointer,
              target,
              pressStart,
              originalEvent,
              hover
            }
          });
        }
        function dispatchToTarget(name, pointer, originalEvent) {
          if (!pointer.target) return;
          pointer.beforeDispatch();
          dispatchPointer(name, pointer, originalEvent, pointer.target);
        }
        function dispatchRelease(name, pointer, originalEvent) {
          const target = pointer.target;
          const pressStart = pointer.pressStart;
          if (!target && !pressStart) return;
          pointer.beforeDispatch();
          dispatchPointer(name, pointer, originalEvent, target, void 0, target, pressStart);
          if (pressStart !== target)
            dispatchPointer(name, pointer, originalEvent, pressStart, void 0, target, pressStart);
        }
        function updateHoverTarget(pointer, event, nextTarget) {
          const previousTarget = pointer.target;
          if (previousTarget === nextTarget) return;
          if (previousTarget || nextTarget) pointer.beforeDispatch();
          dispatchPointer("PointerHover", pointer, event, previousTarget, false);
          pointer.target = nextTarget;
          dispatchPointer("PointerHover", pointer, event, nextTarget, true);
        }
        function canHover(event) {
          return event.pointerType === "mouse" || event.pointerType === "pen";
        }
        function addPointer(event, pressed, hover) {
          const pointer = new AePointer(event, pressed, hover);
          trackedPointers.set(event.pointerId, pointer);
          return pointer;
        }
        function onPointerDown(event) {
          const pointer = trackedPointers.get(event.pointerId) || addPointer(event, true, canHover(event));
          pointer.initial.x = event.clientX;
          pointer.initial.y = event.clientY;
          pointer.pointerType = event.pointerType;
          pointer.pressed = true;
          pointer.startPress();
          pointer.hover = canHover(event);
          pointer.update(event);
          pointer.target = targetFor(event.target, pointer);
          pointer.pressStart = pointer.target;
          dispatchToTarget("PointerDown", pointer, event);
        }
        function onPointerMove(event) {
          let pointer = trackedPointers.get(event.pointerId);
          if (!pointer) {
            if (!canHover(event)) return;
            pointer = addPointer(event, false, true);
          }
          pointer.update(event);
          pointer.target = targetFor(event.target, pointer);
          dispatchToTarget("PointerMove", pointer, event);
        }
        function onPointerUp(event) {
          const pointer = trackedPointers.get(event.pointerId);
          if (!pointer) return;
          pointer.update(event);
          pointer.pressed = false;
          pointer.endPress();
          pointer.target = targetFor(event.target, pointer);
          dispatchRelease("PointerUp", pointer, event);
          if (!pointer.hover) trackedPointers.delete(event.pointerId);
        }
        function onPointerCancel(event) {
          const pointer = trackedPointers.get(event.pointerId);
          if (pointer) {
            pointer.update(event);
            pointer.pressed = false;
            pointer.endPress();
            pointer.target = targetFor(event.target, pointer);
            dispatchRelease("PointerCancel", pointer, event);
          }
          trackedPointers.delete(event.pointerId);
        }
        function onPointerOver(event) {
          if (!canHover(event)) return;
          const pointer = trackedPointers.get(event.pointerId) || addPointer(event, false, true);
          pointer.update(event);
          pointer.hover = true;
          updateHoverTarget(pointer, event, targetFor(event.target, pointer));
        }
        function onPointerOut(event) {
          const pointer = trackedPointers.get(event.pointerId);
          if (!pointer) return;
          const relatedTarget = event.relatedTarget;
          pointer.update(event);
          updateHoverTarget(pointer, event, targetFor(relatedTarget, pointer));
          if (!relatedTarget || !relatedTarget.nodeType || !document.contains(relatedTarget)) {
            pointer.hover = false;
            pointer.target = null;
          }
          if (!pointer.pressed && !pointer.hover) trackedPointers.delete(event.pointerId);
        }
        class AePointer {
          constructor(event, pressed, hover) {
            const x = event.clientX;
            const y = event.clientY;
            this.pointerId = event.pointerId;
            this.pointerType = event.pointerType;
            this.initial = { x, y };
            this.current = { x, y };
            this.delta = { x: 0, y: 0 };
            this.movement = { x: 0, y: 0 };
            this.lastDispatched = { x, y };
            this.time = { pressStart: null, pressEnd: null };
            this.buttons = event.buttons;
            this.pressed = pressed;
            this.hover = hover;
            this.target = null;
            this.pressStart = null;
          }
          get deltaTime() {
            var _a;
            if (this.time.pressStart === null) return 0;
            return ((_a = this.time.pressEnd) != null ? _a : root2.performance.now()) - this.time.pressStart;
          }
          startPress() {
            this.time.pressStart = root2.performance.now();
            this.time.pressEnd = null;
          }
          endPress() {
            if (this.time.pressStart !== null && this.time.pressEnd === null)
              this.time.pressEnd = root2.performance.now();
          }
          update(event) {
            this.current.x = event.clientX;
            this.current.y = event.clientY;
            this.delta.x = this.current.x - this.initial.x;
            this.delta.y = this.current.y - this.initial.y;
            this.buttons = event.buttons;
          }
          beforeDispatch() {
            this.movement.x = this.current.x - this.lastDispatched.x;
            this.movement.y = this.current.y - this.lastDispatched.y;
            this.lastDispatched.x = this.current.x;
            this.lastDispatched.y = this.current.y;
          }
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.anchor.js
  var aellux_ext_anchor_exports = {};
  var init_aellux_ext_anchor = __esm({
    "src/aellux.ext.anchor.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "anchor";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const attribute = AelluxJs2.attr(extensionName);
        const targetAttribute = AelluxJs2.attr("anchor-target");
        const layoutEvent = AelluxJs2.eventName("Layout");
        const anchoredClass = AelluxJs2.className("anchored");
        const baseProperties = ["position", "left", "top", "transform", "transform-origin"];
        const ownedProperties = [
          ...baseProperties,
          "--ae-anchor-x",
          "--ae-anchor-y",
          "--ae-anchor-origin-x",
          "--ae-anchor-origin-y"
        ];
        const pivots = {
          "top-left": [0, 0],
          "top-center": [0.5, 0],
          "top-right": [1, 0],
          "center-left": [0, 0.5],
          center: [0.5, 0.5],
          "center-right": [1, 0.5],
          "bottom-left": [0, 1],
          "bottom-center": [0.5, 1],
          "bottom-right": [1, 1]
        };
        const UPDATE_INTERVAL_MS = 100;
        const anchors = /* @__PURE__ */ new Map();
        let updateTimeout = null;
        let lastUpdateTime = -UPDATE_INTERVAL_MS;
        AelluxJs2.extAttach(extensionName, { init, destroy });
        function init() {
          AelluxJs2.registerCssProperty({
            name: "--ae-anchor-x",
            syntax: "<length>",
            inherits: false,
            initialValue: "0px"
          });
          AelluxJs2.registerCssProperty({
            name: "--ae-anchor-y",
            syntax: "<length>",
            inherits: false,
            initialValue: "0px"
          });
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
            priority: 0,
            mount: mountAnchor,
            unmount: unmountAnchor,
            update: updateAnchor
          });
        }
        async function destroy() {
          if (updateTimeout !== null) clearTimeout(updateTimeout);
          updateTimeout = null;
          lastUpdateTime = -UPDATE_INTERVAL_MS;
          await Promise.all(Array.from(anchors.keys(), unmountAnchor));
          AelluxJs2.mountManager.remove({ extensionName });
        }
        function mountAnchor(element) {
          if (anchors.has(element)) return;
          const original = ownedProperties.map((name) => ({
            value: element.style.getPropertyValue(name),
            priority: element.style.getPropertyPriority(name)
          }));
          const state = {
            original,
            invalidContext: false,
            active: false,
            revision: 0,
            target: null,
            reference: null,
            layoutListener: () => scheduleUpdate(),
            observer: null,
            intersectionObserver: null
          };
          anchors.set(element, state);
          if (anchors.size === 1) {
            root2.addEventListener("scroll", scheduleUpdate, { capture: true, passive: true });
            root2.addEventListener("resize", scheduleUpdate);
          }
          if (typeof root2.ResizeObserver === "function") {
            state.observer = new root2.ResizeObserver(scheduleUpdate);
          }
          if (typeof root2.IntersectionObserver === "function") {
            state.intersectionObserver = new root2.IntersectionObserver(scheduleUpdate);
          }
          return updateAnchor(element);
        }
        async function unmountAnchor(element) {
          const state = anchors.get(element);
          if (!state) return;
          state.revision++;
          if (state.reference) state.reference.removeEventListener(layoutEvent, state.layoutListener);
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          anchors.delete(element);
          if (!anchors.size) {
            root2.removeEventListener("scroll", scheduleUpdate, true);
            root2.removeEventListener("resize", scheduleUpdate);
            if (updateTimeout !== null) clearTimeout(updateTimeout);
            updateTimeout = null;
            lastUpdateTime = -UPDATE_INTERVAL_MS;
          }
          await AelluxJs2.waitLayout.update(deactivate, [element, state]);
        }
        function scheduleUpdate() {
          if (!anchors.size) return;
          const elapsed = now() - lastUpdateTime;
          if (elapsed >= UPDATE_INTERVAL_MS) {
            if (updateTimeout !== null) clearTimeout(updateTimeout);
            updateTimeout = null;
            flushUpdate();
            return;
          }
          if (updateTimeout !== null) return;
          updateTimeout = setTimeout(flushUpdate, UPDATE_INTERVAL_MS - elapsed);
        }
        function flushUpdate() {
          updateTimeout = null;
          lastUpdateTime = now();
          for (const element of anchors.keys()) {
            updateAnchor(element).catch((cause) => {
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
                { cause, extension: extensionName, element, method: "update" }
              );
            });
          }
        }
        function now() {
          return root2.performance && typeof root2.performance.now === "function" ? root2.performance.now() : Date.now();
        }
        async function updateAnchor(element) {
          const state = anchors.get(element);
          if (!state) return;
          const revision = ++state.revision;
          const current = () => anchors.get(element) === state && state.revision === revision;
          const targetValue = element.getAttribute(targetAttribute);
          const useReference = !targetValue || !targetValue.trim();
          const target = useReference ? null : resolveElement(targetValue);
          const candidates = parseCandidates(element.getAttribute(attribute));
          if (!target && !useReference || !candidates.length) {
            await AelluxJs2.waitLayout.update(() => {
              if (current()) deactivate(element, state);
            });
            return;
          }
          let placement = await AelluxJs2.waitLayout.read(
            () => current() ? readPlacement(element, target, candidates, state.active) : null
          );
          if (!current() || !placement) return;
          if (!placement.valid) {
            await AelluxJs2.waitLayout.update(() => {
              if (current()) invalidContext(element, state, placement);
            });
            return;
          }
          if (!state.active) {
            await AelluxJs2.waitLayout.update(() => {
              if (!current()) return;
              applyBaseStyles(element);
              state.active = true;
            });
            if (!current()) return;
            placement = await AelluxJs2.waitLayout.read(
              () => current() ? readPlacement(element, useReference ? null : target, candidates, true) : null
            );
            if (!current() || !placement) return;
            if (!placement.valid) {
              await AelluxJs2.waitLayout.update(() => {
                if (current()) invalidContext(element, state, placement);
              });
              return;
            }
          }
          await AelluxJs2.waitLayout.update(() => {
            if (!current()) return;
            state.invalidContext = false;
            observe(state, element, placement.target, placement.reference);
            const selected = placement.selected;
            element.style.setProperty("--ae-anchor-x", `${selected.x}px`);
            element.style.setProperty("--ae-anchor-y", `${selected.y}px`);
            element.style.setProperty("--ae-anchor-origin-x", `${selected.self[0] * 100}%`);
            element.style.setProperty("--ae-anchor-origin-y", `${selected.self[1] * 100}%`);
            for (const name of baseProperties) element.style.removeProperty(name);
            element.classList.add(anchoredClass);
          });
        }
        function readPlacement(element, target, candidates, measure) {
          const reference = element.offsetParent;
          target = target || reference;
          if (!reference || target !== reference && target.offsetParent !== reference) {
            return { valid: false, target, reference };
          }
          if (!measure) return { valid: true, target };
          const referenceRect = reference.getBoundingClientRect();
          const scaleX = reference.offsetWidth ? referenceRect.width / reference.offsetWidth : 1;
          const scaleY = reference.offsetHeight ? referenceRect.height / reference.offsetHeight : 1;
          const targetRect = toReference(target.getBoundingClientRect(), reference, referenceRect, scaleX, scaleY);
          const selfRect = element.getBoundingClientRect();
          const selfWidth = selfRect.width / scaleX;
          const selfHeight = selfRect.height / scaleY;
          const boundaryRect = toReference(
            { left: 0, top: 0, width: root2.innerWidth, height: root2.innerHeight },
            reference,
            referenceRect,
            scaleX,
            scaleY
          );
          let selected = null;
          for (const candidate of candidates) {
            const x = targetRect.left + targetRect.width * candidate.target[0] - selfWidth * candidate.self[0];
            const y = targetRect.top + targetRect.height * candidate.target[1] - selfHeight * candidate.self[1];
            const result = { x, y, self: candidate.self };
            if (!selected) selected = result;
            if (x >= boundaryRect.left && y >= boundaryRect.top && x + selfWidth <= boundaryRect.left + boundaryRect.width && y + selfHeight <= boundaryRect.top + boundaryRect.height) {
              selected = result;
              break;
            }
          }
          return { valid: true, target, reference, selected };
        }
        function invalidContext(element, state, placement) {
          deactivate(element, state);
          if (placement.reference)
            listenForLayout(state, placement.reference);
          if (state.invalidContext) return;
          AelluxJs2.diagnostics.error(
            AelluxJs2.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT,
            { extension: extensionName, element, target: placement.target }
          );
          state.invalidContext = true;
        }
        function observe(state, element, target, reference) {
          if (state.target === target && state.reference === reference) return;
          listenForLayout(state, reference);
          state.target = target;
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          for (const observed of /* @__PURE__ */ new Set([element, target, reference])) {
            if (!observed) continue;
            if (state.observer) state.observer.observe(observed);
            if (state.intersectionObserver) state.intersectionObserver.observe(observed);
          }
        }
        function listenForLayout(state, reference) {
          if (state.reference === reference) return;
          if (state.reference) state.reference.removeEventListener(layoutEvent, state.layoutListener);
          state.reference = reference;
          if (reference) reference.addEventListener(layoutEvent, state.layoutListener);
        }
        function applyBaseStyles(element) {
          element.style.setProperty("position", "absolute");
          element.style.setProperty("left", "0px");
          element.style.setProperty("top", "0px");
          element.style.setProperty(
            "transform",
            "translate3d(var(--ae-anchor-x, 0px), var(--ae-anchor-y, 0px), 0)"
          );
          element.style.setProperty(
            "transform-origin",
            "var(--ae-anchor-origin-x, 50%) var(--ae-anchor-origin-y, 0%)"
          );
        }
        function deactivate(element, state) {
          if (state.reference) state.reference.removeEventListener(layoutEvent, state.layoutListener);
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          state.target = state.reference = null;
          element.classList.remove(anchoredClass);
          if (state.active) restoreStyles(element, state.original);
          state.active = false;
        }
        function restoreStyles(element, original) {
          ownedProperties.forEach((name, index) => {
            const { value, priority } = original[index];
            if (value) element.style.setProperty(name, value, priority);
            else element.style.removeProperty(name);
          });
        }
        function resolveElement(value) {
          if (!value || !value.trim()) return null;
          const selector = value.trim();
          const id = selector[0] === "#" ? selector.slice(1) : selector;
          const byId = document.getElementById(id);
          if (byId) return byId;
          try {
            return document.querySelector(selector);
          } catch (_) {
            return null;
          }
        }
        function parseCandidates(value) {
          const result = [];
          for (const token of (value || "").split(",")) {
            const pair = token.trim().toLowerCase().split(":");
            if (pair.length !== 2 || !pivots[pair[0].trim()] || !pivots[pair[1].trim()]) continue;
            result.push({ target: pivots[pair[0].trim()], self: pivots[pair[1].trim()] });
          }
          return result;
        }
        function toReference(rect, reference, referenceRect, scaleX, scaleY) {
          return {
            left: (rect.left - referenceRect.left) / scaleX - reference.clientLeft + reference.scrollLeft,
            top: (rect.top - referenceRect.top) / scaleY - reference.clientTop + reference.scrollTop,
            width: rect.width / scaleX,
            height: rect.height / scaleY
          };
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.scrollbox.js
  var aellux_ext_scrollbox_exports = {};
  var init_aellux_ext_scrollbox = __esm({
    "src/aellux.ext.scrollbox.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "scrollbox";
        if (!AelluxJs2) throw new Error("[aellux.js] Load the boot script before the scrollbox extension.");
        const attribute = AelluxJs2.attr(extensionName);
        const wheelAttribute = AelluxJs2.attr("scrollbox-wheel-horizontal");
        const momentumAttribute = AelluxJs2.attr("scrollbox-momentum");
        const elasticAttribute = AelluxJs2.attr("scrollbox-elastic");
        const snapAttribute = AelluxJs2.attr("scrollbox-snap");
        const scrollbarAttribute = AelluxJs2.attr("scrollbar");
        const scrollbarVerticalAttribute = AelluxJs2.attr("scrollbar-vertical");
        const scrollbarHorizontalAttribute = AelluxJs2.attr("scrollbar-horizontal");
        const elasticReleaseClass = AelluxJs2.className("scrollbox-elastic-release");
        const pointerScrollingClass = AelluxJs2.className("pointerscrolling");
        const nativeScrollbarHideClass = AelluxJs2.className("native-sb-hide");
        const scrollbarVisibleClass = AelluxJs2.className("scrollbar-visible");
        const scrollEdgeClasses = [
          AelluxJs2.className("scroll-v-start"),
          AelluxJs2.className("scroll-v-end"),
          AelluxJs2.className("scroll-h-start"),
          AelluxJs2.className("scroll-h-end")
        ];
        const pointerScrollExceptionSelector = `a, button, input, select, textarea, [contenteditable], [draggable='true'], [${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`;
        const RESIZE_INTERVAL_MS = 100;
        const SCROLL_EDGE_MARGIN_PX = 5;
        const POINTER_SCROLL_THRESHOLD_PX = 3;
        const POINTER_SCROLL_MULTICLICK_MS = 500;
        const POINTER_SCROLL_MULTICLICK_DISTANCE_PX = 8;
        const TEXT_SELECTION_WAIT_MS = 100;
        const VERTICAL_TEXT_DRAG_PX = 10;
        const MOMENTUM_LIMIT_TIME_MS = 300;
        const MOMENTUM_LIMIT_DISTANCE_PX = 15;
        const MOMENTUM_DECELERATION = 15e-4;
        const SNAP_SWIPE_SPEED_PX_MS = 0.5;
        const SNAP_FLICK_WINDOW_MS = 200;
        const SNAP_FLICK_FAST_TIME_MS = 50;
        const SNAP_FLICK_MAX_DISTANCE_PX = 100;
        const SNAP_FLICK_MIN_DISTANCE_PX = 1;
        const SNAP_DRAG_DISTANCE_RATIO = 0.25;
        const SNAP_SCROLL_IDLE_MS = 120;
        const SNAP_WHEEL_IDLE_MS = 120;
        const SNAP_EDGE_DISTANCE_PX = 10;
        const ELASTIC_DAMPING = 1 / 3;
        const DEFAULT_ELASTIC_LIMIT = { unit: "ratio", value: 1 / 4 };
        const ELASTIC_RETURN_LERP = 0.15;
        const ELASTIC_RETURN_EPSILON = 0.01;
        const ELASTIC_WHEEL_IDLE_MS = 80;
        const SCROLLBAR_SIZE_PX = 8;
        const SCROLLBAR_MIN_THUMB_PX = 20;
        const SCROLLBAR_PDS_HIDE_DELAY_MS = 1e3;
        const scrollbarProperties = [
          "--ae-scrollbar-x",
          "--ae-scrollbar-y",
          "--ae-scrollbar-length",
          "--ae-scrollbar-thumb-size",
          "--ae-scrollbar-thumb-position",
          "--ae-scrollbar-display"
        ];
        const pointerScrollMouseEvents = [
          "mousedown",
          "mousemove",
          "mouseup",
          "click",
          "dblclick",
          "auxclick",
          "contextmenu",
          "mouseover",
          "mouseout",
          "mouseenter",
          "mouseleave"
        ];
        const pointerScrollDragEvents = [
          "dragstart",
          "drag",
          "dragenter",
          "dragover",
          "dragleave",
          "drop",
          "dragend"
        ];
        const mouseHoldEvents = /* @__PURE__ */ new Set([
          "mousemove",
          "mouseover",
          "mouseout",
          "mouseenter",
          "mouseleave"
        ]);
        const mouseReleaseEvents = /* @__PURE__ */ new Set([
          "mouseup",
          "click",
          "dblclick",
          "auxclick",
          "contextmenu"
        ]);
        const properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
        const snapProperties = ["--ae-snap-viewport", "--ae-snap-focus"];
        const scrollboxes = /* @__PURE__ */ new Map();
        let activePointerScrollState = null;
        AelluxJs2.extAttach(extensionName, { init, destroy, next, previous, goto });
        function init() {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
            priority: 0,
            mount: mountScrollbox,
            update: updateScrollbox,
            unmount: unmountScrollbox,
            controllers: ["next", "previous", "goto"]
          });
        }
        function destroy() {
          for (const element of scrollboxes.keys()) unmountScrollbox(element);
          AelluxJs2.mountManager.remove({ extensionName });
        }
        function mountScrollbox(element) {
          if (scrollboxes.has(element)) return;
          const previous2 = properties.map((name) => ({
            value: element.style.getPropertyValue(name),
            priority: element.style.getPropertyPriority(name)
          }));
          const elastic = {
            wrapper: null,
            baseTransform: "",
            baseOrigin: "",
            previousTransform: null,
            previousOrigin: null,
            previousMinWidth: null,
            previousMinHeight: null,
            extentX: false,
            extentY: false,
            dimensions: null,
            invalidReported: false,
            invalidLimit: null,
            limits: [DEFAULT_ELASTIC_LIMIT, DEFAULT_ELASTIC_LIMIT],
            amounts: [0, 0, 0, 0],
            active: false,
            owned: false,
            touch: null,
            releaseFrame: null,
            wheelTimeout: null
          };
          const snap = {
            wrapper: null,
            initialized: false,
            invalidReported: false,
            pending: null,
            index: 0,
            wheelTarget: null,
            notifiedItem: null,
            notifiedIndex: null,
            scrollEndTimeout: null,
            wheelTimeout: null
          };
          const inlineWrapper = {
            element: null,
            previousDisplay: null,
            owned: false,
            reportedDisplay: null
          };
          const scrollbar = {
            x: null,
            y: null,
            drag: null,
            hideOwned: false,
            visibleOwned: false,
            listening: false,
            pointerHover: false,
            mouseHover: false,
            pdsVisible: false,
            hideTimeout: null
          };
          const state = {
            element,
            previous: previous2,
            metrics: null,
            mode: null,
            desktop: false,
            cursor: {
              value: element.style.getPropertyValue("cursor"),
              priority: element.style.getPropertyPriority("cursor"),
              owned: false
            },
            wheelEnabled: true,
            momentumEnabled: true,
            elasticEnabled: false,
            snapEnabled: false,
            wheelListening: false,
            pointerListening: false,
            touchListening: false,
            pointerScroll: null,
            lastPointerDown: null,
            mouseReleaseButton: null,
            mouseReleaseTimeout: null,
            momentum: null,
            elastic,
            snap,
            inlineWrapper,
            scrollbar,
            resizeObserver: null,
            mutationObserver: null,
            publishPending: false,
            publishDirty: false,
            layoutRevision: 0,
            lastResizeTime: -RESIZE_INTERVAL_MS,
            resizeTimeout: null,
            disposed: false
          };
          state.onScroll = () => {
            publish(state);
            if (state.snapEnabled && !("onscrollend" in element)) scheduleScrollEnd(state);
          };
          state.onScrollEnd = () => finishNativeScroll(state);
          state.onWheel = (event) => handleWheel(state, event);
          state.onClick = (event) => handleSnapClick(state, event);
          state.onPointerDown = (event) => startPointerScroll(state, event);
          state.onPointerOver = (event) => updatePointerScrollCursor(
            state,
            event.target,
            event.clientX,
            event.clientY
          );
          state.onPointerOut = (event) => {
            if (state.pointerScroll && state.pointerScroll.moved) return;
            if (!event.relatedTarget || !element.contains(event.relatedTarget))
              restorePointerScrollCursor(state);
          };
          state.onMouseDown = (event) => {
            if (event.button === 0 && event.detail > 1) endPointerScroll(state);
          };
          state.onPointerMove = (event) => movePointerScroll(state, event);
          state.onMouseEvent = (event) => cancelPointerScrollMouseEvent(state, event);
          state.onPointerScrollTouchMove = (event) => {
            if (state.pointerScroll && state.pointerScroll.moved && event.cancelable)
              event.preventDefault();
          };
          state.onPointerScrollNativeEvent = (event) => {
            if (state.pointerScroll && state.pointerScroll.moved && event.cancelable)
              event.preventDefault();
          };
          state.onPointerEnd = (event) => endPointerScroll(state, event);
          state.onBlur = () => endPointerScroll(state);
          state.onTouchStart = (event) => startTouch(state, event);
          state.onTouchMove = (event) => moveTouch(state, event);
          state.onTouchEnd = (event) => endTouch(state, event);
          state.onScrollbarPointerEnter = (event) => {
            if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", true);
          };
          state.onScrollbarPointerLeave = (event) => {
            if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", false);
          };
          state.onScrollbarMouseEnter = () => setScrollbarHover(state, "mouseHover", true);
          state.onScrollbarMouseLeave = () => setScrollbarHover(state, "mouseHover", false);
          state.onScrollbarOutsideDown = (event) => {
            if (!element.contains(event.target)) {
              scrollbar.pointerHover = false;
              scrollbar.mouseHover = false;
              if (!element.classList.contains(pointerScrollingClass))
                clearScrollbarPdsVisibility(state);
              syncScrollbarVisibility(state);
            }
          };
          scrollboxes.set(element, state);
          element.addEventListener("scroll", state.onScroll, { passive: true });
          element.addEventListener("scrollend", state.onScrollEnd, { passive: true });
          element.addEventListener("click", state.onClick);
          observe(state);
          configure(state);
        }
        function updateScrollbox(element) {
          const state = scrollboxes.get(element);
          if (state) configure(state);
        }
        function unmountScrollbox(element) {
          const state = scrollboxes.get(element);
          if (!state) return;
          state.disposed = true;
          if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
            endPointerScroll(activePointerScrollState);
          endPointerScroll(state);
          stopPointerScrollMouseEvents(state);
          restorePointerScrollCursor(state);
          cancelMomentum(state);
          state.snap.pending = null;
          clearScrollEnd(state);
          clearSnapWheel(state);
          resetElastic(state);
          restoreInlineWrapper(state);
          resetScrollbars(state);
          element.removeEventListener("scroll", state.onScroll);
          element.removeEventListener("scrollend", state.onScrollEnd);
          element.removeEventListener("click", state.onClick);
          if (state.wheelListening) element.removeEventListener("wheel", state.onWheel, true);
          if (state.pointerListening) {
            element.removeEventListener("pointerdown", state.onPointerDown);
            element.removeEventListener("pointerover", state.onPointerOver);
            element.removeEventListener("pointerout", state.onPointerOut);
            element.removeEventListener("mousedown", state.onMouseDown);
          }
          if (state.touchListening) removeTouchListeners(state);
          if (state.resizeObserver) state.resizeObserver.disconnect();
          if (state.mutationObserver) state.mutationObserver.disconnect();
          if (state.resizeTimeout !== null) root2.clearTimeout(state.resizeTimeout);
          root2.removeEventListener("resize", state.onResize);
          properties.forEach((name, index) => {
            const original = state.previous[index];
            if (original.value) element.style.setProperty(name, original.value, original.priority);
            else element.style.removeProperty(name);
          });
          for (const name of scrollEdgeClasses) element.classList.remove(name);
          scrollboxes.delete(element);
        }
        function configure(state) {
          const element = state.element;
          state.layoutRevision++;
          state.mode = readMode(element);
          state.wheelEnabled = element.getAttribute(wheelAttribute) !== "false";
          state.momentumEnabled = element.getAttribute(momentumAttribute) !== "false";
          configureElastic(state);
          configureSnap(state);
          configureInlineWrapper(state);
          configureScrollbars(state);
          state.desktop = isDesktop();
          if ((state.desktop || state.elasticEnabled || state.snapEnabled) && !state.wheelListening) {
            element.addEventListener("wheel", state.onWheel, { passive: false, capture: true });
            state.wheelListening = true;
          } else if (!state.desktop && !state.elasticEnabled && !state.snapEnabled && state.wheelListening) {
            element.removeEventListener("wheel", state.onWheel, true);
            state.wheelListening = false;
          }
          if (state.elasticEnabled && !state.touchListening) addTouchListeners(state);
          else if (!state.elasticEnabled && state.touchListening) removeTouchListeners(state);
          if (!state.elasticEnabled) resetElastic(state);
          const pointerEnabled = state.desktop && state.mode === "pointer";
          if (!pointerEnabled || !state.momentumEnabled) cancelMomentum(state);
          if (pointerEnabled && !state.pointerListening) {
            element.addEventListener("pointerdown", state.onPointerDown);
            element.addEventListener("pointerover", state.onPointerOver);
            element.addEventListener("pointerout", state.onPointerOut);
            element.addEventListener("mousedown", state.onMouseDown);
            state.pointerListening = true;
          } else if (!pointerEnabled && state.pointerListening) {
            if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
              endPointerScroll(activePointerScrollState);
            element.removeEventListener("pointerdown", state.onPointerDown);
            element.removeEventListener("pointerover", state.onPointerOver);
            element.removeEventListener("pointerout", state.onPointerOut);
            element.removeEventListener("mousedown", state.onMouseDown);
            state.pointerListening = false;
            endPointerScroll(state);
            state.lastPointerDown = null;
            restorePointerScrollCursor(state);
          }
          refresh(state);
          if (state.snapEnabled && !state.snap.initialized) initializeSnap(state);
        }
        function contentChildren(element) {
          return Array.from(element.children).filter((child) => !child.hasAttribute(scrollbarVerticalAttribute) && !child.hasAttribute(scrollbarHorizontalAttribute));
        }
        function scrollbarAxes(value) {
          if (value === null) return { x: false, y: false };
          const tokens = value.toLowerCase().trim().split(/[\s,|/+]+/).filter(Boolean);
          if (!tokens.length) return { x: true, y: true };
          const axes = { x: false, y: false };
          for (const token of tokens) {
            const short = token.replace(/horizontal/g, "h").replace(/vertical/g, "v");
            if (!/^[vhxy]+$/.test(short)) continue;
            if (/[hx]/.test(short)) axes.x = true;
            if (/[vy]/.test(short)) axes.y = true;
          }
          return axes;
        }
        function configureScrollbars(state) {
          const element = state.element;
          const axes = scrollbarAxes(element.getAttribute(scrollbarAttribute));
          configureScrollbarAxis(state, "y", axes.y, scrollbarVerticalAttribute);
          configureScrollbarAxis(state, "x", axes.x, scrollbarHorizontalAttribute);
          const enabled = axes.x || axes.y;
          const scrollbar = state.scrollbar;
          if (enabled && !scrollbar.listening) {
            scrollbar.hideOwned = !element.classList.contains(nativeScrollbarHideClass);
            if (scrollbar.hideOwned) element.classList.add(nativeScrollbarHideClass);
            scrollbar.mouseHover = element.matches(":hover") && !!(root2.matchMedia && root2.matchMedia("(any-hover: hover)").matches);
            element.addEventListener("pointerenter", state.onScrollbarPointerEnter);
            element.addEventListener("pointerleave", state.onScrollbarPointerLeave);
            element.addEventListener("mouseenter", state.onScrollbarMouseEnter);
            element.addEventListener("mouseleave", state.onScrollbarMouseLeave);
            root2.document.addEventListener("pointerdown", state.onScrollbarOutsideDown, true);
            scrollbar.listening = true;
            syncScrollbarVisibility(state);
          } else if (!enabled && scrollbar.listening) {
            element.removeEventListener("pointerenter", state.onScrollbarPointerEnter);
            element.removeEventListener("pointerleave", state.onScrollbarPointerLeave);
            element.removeEventListener("mouseenter", state.onScrollbarMouseEnter);
            element.removeEventListener("mouseleave", state.onScrollbarMouseLeave);
            root2.document.removeEventListener("pointerdown", state.onScrollbarOutsideDown, true);
            if (scrollbar.hideOwned) element.classList.remove(nativeScrollbarHideClass);
            scrollbar.hideOwned = false;
            scrollbar.listening = false;
            clearScrollbarPdsVisibility(state);
            scrollbar.pointerHover = false;
            scrollbar.mouseHover = false;
            syncScrollbarVisibility(state);
          }
        }
        function configureScrollbarAxis(state, axis, enabled, attributeName) {
          const scrollbar = state.scrollbar;
          const current = scrollbar[axis];
          let element = null;
          if (enabled) element = Array.from(state.element.children).find((child) => child.hasAttribute(attributeName)) || null;
          if (current && current.element === element && enabled) return;
          if (current) resetScrollbarAxis(state, axis);
          if (!enabled) return;
          const owned = !element;
          if (!element) {
            element = root2.document.createElement("div");
            element.setAttribute(attributeName, "");
            state.element.appendChild(element);
          }
          const previous2 = scrollbarProperties.map((name) => ({
            name,
            value: element.style.getPropertyValue(name),
            priority: element.style.getPropertyPriority(name)
          }));
          const record = {
            element,
            owned,
            previous: previous2,
            axis,
            x: null,
            y: null,
            thumbPosition: null,
            thumbSize: null,
            trackSize: null,
            max: null,
            display: null
          };
          record.onPointerDown = (event) => startScrollbarDrag(state, record, event);
          record.onPointerMove = (event) => moveScrollbarDrag(state, record, event);
          record.onPointerEnd = (event) => endScrollbarDrag(state, record, event);
          element.addEventListener("pointerdown", record.onPointerDown);
          element.addEventListener("pointermove", record.onPointerMove);
          element.addEventListener("pointerup", record.onPointerEnd);
          element.addEventListener("pointercancel", record.onPointerEnd);
          scrollbar[axis] = record;
        }
        function resetScrollbarAxis(state, axis) {
          const record = state.scrollbar[axis];
          if (!record) return;
          endScrollbarDrag(state, record);
          const element = record.element;
          element.removeEventListener("pointerdown", record.onPointerDown);
          element.removeEventListener("pointermove", record.onPointerMove);
          element.removeEventListener("pointerup", record.onPointerEnd);
          element.removeEventListener("pointercancel", record.onPointerEnd);
          if (record.owned) element.remove();
          else for (const original of record.previous) {
            if (original.value) element.style.setProperty(
              original.name,
              original.value,
              original.priority
            );
            else element.style.removeProperty(original.name);
          }
          state.scrollbar[axis] = null;
        }
        function resetScrollbars(state) {
          resetScrollbarAxis(state, "x");
          resetScrollbarAxis(state, "y");
          const scrollbar = state.scrollbar;
          if (scrollbar.listening) {
            state.element.removeEventListener("pointerenter", state.onScrollbarPointerEnter);
            state.element.removeEventListener("pointerleave", state.onScrollbarPointerLeave);
            state.element.removeEventListener("mouseenter", state.onScrollbarMouseEnter);
            state.element.removeEventListener("mouseleave", state.onScrollbarMouseLeave);
            root2.document.removeEventListener("pointerdown", state.onScrollbarOutsideDown, true);
            scrollbar.listening = false;
          }
          if (scrollbar.hideOwned) state.element.classList.remove(nativeScrollbarHideClass);
          scrollbar.hideOwned = false;
          clearScrollbarPdsVisibility(state);
          scrollbar.pointerHover = false;
          scrollbar.mouseHover = false;
          syncScrollbarVisibility(state);
        }
        function setScrollbarHover(state, name, active) {
          state.scrollbar[name] = active;
          syncScrollbarVisibility(state);
        }
        function syncScrollbarVisibility(state) {
          const scrollbar = state.scrollbar;
          if (scrollbar.listening && (scrollbar.pointerHover || scrollbar.mouseHover || scrollbar.drag || scrollbar.pdsVisible)) showScrollbars(state);
          else hideScrollbars(state);
        }
        function clearScrollbarPdsVisibility(state) {
          const scrollbar = state.scrollbar;
          if (scrollbar.hideTimeout !== null) root2.clearTimeout(scrollbar.hideTimeout);
          scrollbar.hideTimeout = null;
          scrollbar.pdsVisible = false;
        }
        function startScrollbarPdsVisibility(state) {
          if (!state.scrollbar.listening) return;
          clearScrollbarPdsVisibility(state);
          state.scrollbar.pdsVisible = true;
          syncScrollbarVisibility(state);
        }
        function scheduleScrollbarPdsHide(state) {
          if (!state.scrollbar.listening || state.disposed) return;
          clearScrollbarPdsVisibility(state);
          state.scrollbar.pdsVisible = true;
          syncScrollbarVisibility(state);
          state.scrollbar.hideTimeout = root2.setTimeout(() => {
            state.scrollbar.hideTimeout = null;
            state.scrollbar.pdsVisible = false;
            syncScrollbarVisibility(state);
          }, SCROLLBAR_PDS_HIDE_DELAY_MS);
        }
        function showScrollbars(state) {
          if (!state.scrollbar.listening) return;
          if (!state.element.classList.contains(scrollbarVisibleClass)) {
            state.element.classList.add(scrollbarVisibleClass);
            state.scrollbar.visibleOwned = true;
          }
        }
        function hideScrollbars(state) {
          if (state.scrollbar.drag) return;
          if (state.scrollbar.visibleOwned)
            state.element.classList.remove(scrollbarVisibleClass);
          state.scrollbar.visibleOwned = false;
        }
        function readScrollbars(state, metrics, axes) {
          const element = state.element;
          const values = [];
          for (const axis of ["x", "y"]) {
            const record = state.scrollbar[axis];
            if (!record) continue;
            const vertical = axis === "y";
            const trackSize = vertical ? element.clientHeight : element.clientWidth;
            const max = vertical ? metrics.maxY : metrics.maxX;
            const scrollSize = trackSize + max;
            const thumbSize = max > 1 ? Math.min(
              trackSize,
              Math.max(SCROLLBAR_MIN_THUMB_PX, trackSize * trackSize / scrollSize)
            ) : 0;
            const position = vertical ? element.scrollTop : element.scrollLeft;
            const thumbPosition = max > 0 ? (trackSize - thumbSize) * progress(position, max) : 0;
            const x = element.scrollLeft + (vertical ? element.clientWidth - SCROLLBAR_SIZE_PX : 0);
            const y = element.scrollTop + (vertical ? 0 : element.clientHeight - SCROLLBAR_SIZE_PX);
            const display = axes[axis] ? "block" : "none";
            values.push({
              record,
              x,
              y,
              trackSize,
              thumbSize,
              thumbPosition,
              max: axes[axis] ? max : 0,
              display
            });
          }
          return values;
        }
        function updateScrollbars(state, values) {
          for (const { record, x, y, trackSize, thumbSize, thumbPosition, max, display } of values) {
            if (state.scrollbar[record.axis] !== record) continue;
            const style = record.element.style;
            if (record.x !== x) style.setProperty("--ae-scrollbar-x", `${x}px`);
            if (record.y !== y) style.setProperty("--ae-scrollbar-y", `${y}px`);
            if (record.trackSize !== trackSize)
              style.setProperty("--ae-scrollbar-length", `${trackSize}px`);
            if (record.thumbSize !== thumbSize)
              style.setProperty("--ae-scrollbar-thumb-size", `${thumbSize}px`);
            if (record.thumbPosition !== thumbPosition)
              style.setProperty("--ae-scrollbar-thumb-position", `${thumbPosition}px`);
            if (record.display !== display)
              style.setProperty("--ae-scrollbar-display", display);
            record.x = x;
            record.y = y;
            record.trackSize = trackSize;
            record.thumbSize = thumbSize;
            record.thumbPosition = thumbPosition;
            record.max = max;
            record.display = display;
          }
        }
        function scrollbarPointerPosition(record, event) {
          const rect = record.element.getBoundingClientRect();
          return record.axis === "y" ? event.clientY - rect.top : event.clientX - rect.left;
        }
        function startScrollbarDrag(state, record, event) {
          if (state.disposed || event.button !== 0 || !record.max) return;
          if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
            endPointerScroll(activePointerScrollState);
          if (event.cancelable) event.preventDefault();
          event.stopPropagation();
          const position = scrollbarPointerPosition(record, event);
          if (event.pointerType !== "touch") state.scrollbar.pointerHover = true;
          showScrollbars(state);
          if (position < record.thumbPosition || position > record.thumbPosition + record.thumbSize) {
            const travel = record.trackSize - record.thumbSize;
            const thumbStart = Math.max(0, Math.min(travel, position - record.thumbSize / 2));
            const destination = travel > 0 ? thumbStart / travel * record.max : 0;
            if (record.axis === "y") state.element.scrollTo({ top: destination });
            else state.element.scrollTo({ left: destination });
            return;
          }
          state.scrollbar.drag = {
            record,
            pointerId: event.pointerId,
            offset: position - record.thumbPosition
          };
          if (record.element.setPointerCapture)
            record.element.setPointerCapture(event.pointerId);
        }
        function moveScrollbarDrag(state, record, event) {
          const drag = state.scrollbar.drag;
          if (!drag || drag.record !== record || drag.pointerId !== event.pointerId) return;
          if (event.cancelable) event.preventDefault();
          event.stopPropagation();
          const travel = record.trackSize - record.thumbSize;
          if (travel <= 0) return;
          const position = scrollbarPointerPosition(record, event) - drag.offset;
          const destination = Math.max(0, Math.min(record.max, position / travel * record.max));
          if (record.axis === "y") state.element.scrollTo({ top: destination, behavior: "instant" });
          else state.element.scrollTo({ left: destination, behavior: "instant" });
          updateScrollbars(state, [{
            record,
            x: record.axis === "x" ? destination : record.x,
            y: record.axis === "y" ? destination : record.y,
            trackSize: record.trackSize,
            thumbSize: record.thumbSize,
            thumbPosition: travel * destination / record.max,
            max: record.max,
            display: record.display
          }]);
          publish(state);
        }
        function endScrollbarDrag(state, record, event) {
          const drag = state.scrollbar.drag;
          if (!drag || drag.record !== record || event && drag.pointerId !== event.pointerId) return;
          if (event) {
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();
          }
          state.scrollbar.drag = null;
          if (record.element.hasPointerCapture && record.element.hasPointerCapture(drag.pointerId))
            record.element.releasePointerCapture(drag.pointerId);
          syncScrollbarVisibility(state);
          if (state.snapEnabled && !state.disposed) scheduleScrollEnd(state);
        }
        function configureSnap(state) {
          const element = state.element;
          const children = contentChildren(element);
          const child = children.length === 1 ? children[0] : null;
          const wrapper = child && child.hasAttribute(snapAttribute) && child.getAttribute(snapAttribute) !== "false" ? child : null;
          if (!wrapper) {
            state.snapEnabled = false;
            state.snap.wrapper = null;
            state.snap.initialized = false;
            state.snap.pending = null;
            state.snap.index = 0;
            state.snap.wheelTarget = null;
            state.snap.notifiedItem = null;
            state.snap.notifiedIndex = null;
            clearScrollEnd(state);
            clearSnapWheel(state);
            const requested = element.hasAttribute(snapAttribute) || children.some((item) => item.hasAttribute(snapAttribute) && item.getAttribute(snapAttribute) !== "false");
            if (requested && !state.snap.invalidReported)
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_SCROLLBOX_SNAP_WRAPPER,
                { element }
              );
            state.snap.invalidReported = requested;
            return;
          }
          state.snap.invalidReported = false;
          if (state.snap.wrapper !== wrapper) {
            state.snap.wrapper = wrapper;
            state.snap.initialized = false;
            state.snap.pending = null;
            state.snap.index = 0;
            state.snap.wheelTarget = null;
            state.snap.notifiedItem = null;
            state.snap.notifiedIndex = null;
            clearSnapWheel(state);
          }
          state.snapEnabled = true;
        }
        function configureInlineWrapper(state) {
          const inline = state.inlineWrapper;
          const wrapper = state.elastic.wrapper || state.snap.wrapper;
          if (inline.element !== wrapper) {
            restoreInlineWrapper(state);
            inline.element = wrapper;
          }
          if (!wrapper) return;
          const display = root2.getComputedStyle(wrapper).display;
          if (display.startsWith("inline")) return;
          if (inline.reportedDisplay !== display) {
            AelluxJs2.diagnostics.warn(
              AelluxJs2.diagnostics.WARN_SCROLLBOX_WRAPPER_DISPLAY,
              { element: wrapper, display }
            );
            inline.reportedDisplay = display;
          }
          const replacement = {
            block: "inline-block",
            flex: "inline-flex",
            grid: "inline-grid",
            "flow-root": "inline-block",
            table: "inline-table"
          }[display];
          if (!replacement) return;
          if (!inline.owned) {
            inline.previousDisplay = {
              value: wrapper.style.getPropertyValue("display"),
              priority: wrapper.style.getPropertyPriority("display")
            };
          }
          wrapper.style.setProperty("display", replacement, "important");
          inline.owned = true;
        }
        function restoreInlineWrapper(state) {
          const inline = state.inlineWrapper;
          if (inline.owned && inline.element) {
            const previous2 = inline.previousDisplay;
            if (previous2.value) inline.element.style.setProperty(
              "display",
              previous2.value,
              previous2.priority
            );
            else inline.element.style.removeProperty("display");
          }
          inline.element = null;
          inline.previousDisplay = null;
          inline.owned = false;
          inline.reportedDisplay = null;
        }
        function snapItems(state) {
          return state.snapEnabled && state.snap.wrapper ? Array.from(state.snap.wrapper.children) : [];
        }
        function snapAxis(state, metrics = nativeMetrics(state.element), axes = wheelAxes(state, metrics)) {
          return axes.x ? "x" : axes.y ? "y" : metrics.maxX > 1 ? "x" : metrics.maxY > 1 ? "y" : "x";
        }
        function snapCenterOffset(state, item, axis) {
          const box = state.element.getBoundingClientRect();
          const target = item.getBoundingClientRect();
          return axis === "x" ? target.left + target.width / 2 - (box.left + state.element.clientLeft + state.element.clientWidth / 2) : target.top + target.height / 2 - (box.top + state.element.clientTop + state.element.clientHeight / 2);
        }
        function edgeSnapIndex(state, items, axis, metrics) {
          const element = state.element;
          const horizontal = axis === "x";
          const maximum = horizontal ? metrics.maxX : metrics.maxY;
          const position = horizontal ? element.scrollLeft : element.scrollTop;
          const startDistance = position;
          const endDistance = maximum - position;
          if (startDistance <= SNAP_EDGE_DISTANCE_PX && startDistance <= endDistance)
            return 0;
          if (endDistance <= SNAP_EDGE_DISTANCE_PX) return items.length - 1;
          return null;
        }
        function nearestSnapIndex(state, items, projectionX = 0, projectionY = 0) {
          const rect = state.element.getBoundingClientRect();
          const centerX = rect.left + state.element.clientLeft + state.element.clientWidth / 2;
          const centerY = rect.top + state.element.clientTop + state.element.clientHeight / 2;
          let nearest = 0, distance = Infinity;
          for (let index = 0; index < items.length; index++) {
            const item = items[index].getBoundingClientRect();
            const dx = item.left + item.width / 2 + projectionX - centerX;
            const dy = item.top + item.height / 2 + projectionY - centerY;
            const candidate = dx * dx + dy * dy;
            if (candidate < distance) {
              nearest = index;
              distance = candidate;
            }
          }
          return nearest;
        }
        function snapNeedsScroll(state, item, axis, metrics) {
          const element = state.element;
          const box = element.getBoundingClientRect();
          const target = item.getBoundingClientRect();
          const dx = target.left + target.width / 2 - (box.left + element.clientLeft + element.clientWidth / 2);
          const dy = target.top + target.height / 2 - (box.top + element.clientTop + element.clientHeight / 2);
          const x = Math.max(0, Math.min(metrics.maxX, element.scrollLeft + dx));
          const y = Math.max(0, Math.min(metrics.maxY, element.scrollTop + dy));
          return axis === "x" ? Math.abs(x - element.scrollLeft) > 0.5 : Math.abs(y - element.scrollTop) > 0.5;
        }
        function snapItemFullyVisible(state, item) {
          const element = state.element;
          const box = element.getBoundingClientRect();
          const target = item.getBoundingClientRect();
          const left = box.left + element.clientLeft;
          const top = box.top + element.clientTop;
          return target.left >= left - 0.5 && target.top >= top - 0.5 && target.right <= left + element.clientWidth + 0.5 && target.bottom <= top + element.clientHeight + 0.5;
        }
        function handleSnapClick(state, event) {
          if (!state.snapEnabled || state.disposed || event.button !== 0 || event.detail !== 1 || event.defaultPrevented) return;
          let item = event.target.nodeType === 1 ? event.target : event.target.parentElement;
          if (!item || item.closest(`[${attribute}]`) !== state.element) return;
          const wrapper = state.snap.wrapper;
          while (item && item.parentElement !== wrapper) item = item.parentElement;
          if (!item || snapItemFullyVisible(state, item)) return;
          scrollToSnap(state, snapItems(state).indexOf(item));
        }
        function scheduleScrollEnd(state) {
          clearScrollEnd(state);
          state.snap.scrollEndTimeout = root2.setTimeout(() => {
            state.snap.scrollEndTimeout = null;
            finishNativeScroll(state);
          }, SNAP_SCROLL_IDLE_MS);
        }
        function clearScrollEnd(state) {
          if (state.snap.scrollEndTimeout !== null)
            root2.clearTimeout(state.snap.scrollEndTimeout);
          state.snap.scrollEndTimeout = null;
        }
        function clearSnapWheel(state) {
          if (state.snap.wheelTimeout !== null)
            root2.clearTimeout(state.snap.wheelTimeout);
          state.snap.wheelTimeout = null;
        }
        function scheduleSnapWheelEnd(state) {
          clearSnapWheel(state);
          state.snap.wheelTimeout = root2.setTimeout(() => {
            state.snap.wheelTimeout = null;
          }, SNAP_WHEEL_IDLE_MS);
        }
        function finishNativeScroll(state) {
          if (state.disposed || !state.snapEnabled || state.snap.pending || state.momentum || state.scrollbar.drag || activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) return;
          const items = snapItems(state);
          if (!items.length) return;
          const metrics = nativeMetrics(state.element);
          const axis = snapAxis(state, metrics);
          if (state.snap.wheelTarget) {
            const target2 = state.snap.wheelTarget;
            if (items.includes(target2) && snapNeedsScroll(state, target2, axis, metrics)) return;
            state.snap.wheelTarget = null;
            if (items.includes(target2)) {
              notifySnapChange(state, target2, axis);
              return;
            }
          }
          const edgeIndex = edgeSnapIndex(state, items, axis, metrics);
          const target = items[edgeIndex === null ? nearestSnapIndex(state, items) : edgeIndex];
          state.snap.index = items.indexOf(target);
          if (!snapNeedsScroll(state, target, axis, metrics)) {
            notifySnapChange(state, target, axis);
            return;
          }
          if (state.elastic.active) state.snap.pending = target;
          else scrollToSnap(state, items.indexOf(target), axis);
        }
        function initializeSnap(state) {
          const first = snapItems(state)[0];
          if (!first) return;
          state.snap.initialized = true;
          state.snap.index = 0;
          const axis = snapAxis(state);
          first.scrollIntoView(snapScrollOptions(axis, "instant"));
          notifySnapChange(state, first, axis);
          refresh(state);
        }
        function notifySnapChange(state, item, axis) {
          const index = snapItems(state).indexOf(item);
          if (index < 0 || state.snap.notifiedItem === item && state.snap.notifiedIndex === index) return;
          const previousIndex = state.snap.notifiedIndex;
          state.snap.index = index;
          state.snap.notifiedItem = item;
          state.snap.notifiedIndex = index;
          AelluxJs2.dispatchFrom(state.element, "ScrollboxSnapChange", {
            detail: { item, index, previousIndex, axis }
          });
        }
        function snapScrollOptions(axis, behavior) {
          const horizontal = axis === "x";
          const options = {
            block: horizontal ? "nearest" : "center",
            inline: horizontal ? "center" : "nearest"
          };
          if (behavior) options.behavior = behavior;
          return options;
        }
        function scrollToSnap(state, index, axis = snapAxis(state)) {
          const items = snapItems(state);
          if (!items.length || !Number.isInteger(index) || index < 0 || index >= items.length)
            return false;
          cancelMomentum(state);
          clearScrollEnd(state);
          clearSnapWheel(state);
          state.snap.pending = null;
          state.snap.index = index;
          state.snap.wheelTarget = items[index];
          if (state.elastic.owned) resetElastic(state);
          items[index].scrollIntoView(snapScrollOptions(axis));
          scheduleScrollEnd(state);
          return true;
        }
        function goto(element, index) {
          const state = scrollboxes.get(element);
          return state && !state.disposed ? scrollToSnap(state, index) : false;
        }
        function next(element) {
          const state = scrollboxes.get(element);
          if (!state || state.disposed) return false;
          const items = snapItems(state);
          return items.length ? scrollToSnap(
            state,
            Math.min(items.length - 1, state.snap.index + 1)
          ) : false;
        }
        function previous(element) {
          const state = scrollboxes.get(element);
          if (!state || state.disposed) return false;
          const items = snapItems(state);
          return items.length ? scrollToSnap(
            state,
            Math.max(0, state.snap.index - 1)
          ) : false;
        }
        function configureElastic(state) {
          const element = state.element;
          const children = contentChildren(element);
          const child = children.length === 1 ? children[0] : null;
          const wrapper = child && child.hasAttribute(elasticAttribute) && child.getAttribute(elasticAttribute) !== "false" ? child : null;
          if (!wrapper) {
            resetElastic(state);
            state.elasticEnabled = false;
            state.elastic.wrapper = null;
            const requested = element.hasAttribute(elasticAttribute) || children.some((item) => item.hasAttribute(elasticAttribute) && item.getAttribute(elasticAttribute) !== "false");
            if (requested && !state.elastic.invalidReported) {
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_SCROLLBOX_ELASTIC_WRAPPER,
                { element }
              );
            }
            state.elastic.invalidReported = requested;
            return;
          }
          state.elastic.invalidReported = false;
          if (state.elastic.wrapper !== wrapper) {
            resetElastic(state);
            const computed = root2.getComputedStyle(wrapper);
            state.elastic.wrapper = wrapper;
            state.elastic.dimensions = null;
            state.elastic.baseTransform = computed.transform === "none" ? "" : computed.transform;
            state.elastic.baseOrigin = computed.transformOrigin;
            state.elastic.previousTransform = {
              value: wrapper.style.getPropertyValue("transform"),
              priority: wrapper.style.getPropertyPriority("transform")
            };
            state.elastic.previousOrigin = {
              value: wrapper.style.getPropertyValue("transform-origin"),
              priority: wrapper.style.getPropertyPriority("transform-origin")
            };
            state.elastic.previousMinWidth = {
              value: wrapper.style.getPropertyValue("min-width"),
              priority: wrapper.style.getPropertyPriority("min-width")
            };
            state.elastic.previousMinHeight = {
              value: wrapper.style.getPropertyValue("min-height"),
              priority: wrapper.style.getPropertyPriority("min-height")
            };
          }
          state.elasticEnabled = true;
          const value = wrapper.getAttribute(elasticAttribute).trim();
          const tokens = value ? value.split(/\s+/) : [];
          const limits = tokens.map(parseElasticLimit);
          if (tokens.length > 2 || limits.some((limit) => !limit)) {
            if (state.elastic.invalidLimit !== value) {
              AelluxJs2.diagnostics.warn(
                AelluxJs2.diagnostics.WARN_SCROLLBOX_ELASTIC_LIMIT_INVALID,
                { element, value }
              );
            }
            state.elastic.invalidLimit = value;
            state.elastic.limits = [DEFAULT_ELASTIC_LIMIT, DEFAULT_ELASTIC_LIMIT];
          } else {
            state.elastic.invalidLimit = null;
            state.elastic.limits = tokens.length === 2 ? limits : [limits[0] || DEFAULT_ELASTIC_LIMIT, limits[0] || DEFAULT_ELASTIC_LIMIT];
          }
        }
        function parseElasticLimit(token) {
          const fraction = /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(token);
          if (fraction && Number(fraction[2]) > 0) {
            return { unit: "ratio", value: Number(fraction[1]) / Number(fraction[2]) };
          }
          const pixels = /^(\d+(?:\.\d+)?)(?:px)?$/i.exec(token);
          return pixels ? { unit: "px", value: Number(pixels[1]) } : null;
        }
        function elasticLimit(size, limit) {
          return limit.unit === "px" ? limit.value : size * limit.value;
        }
        function elasticResistance(force, current, limit) {
          if (limit <= 0) return 0;
          return current + (limit - current) * (1 - Math.exp(-force * ELASTIC_DAMPING / limit));
        }
        function readMode(element) {
          const value = (element.getAttribute(attribute) || "").trim().toLowerCase() || "native";
          if (value === "native" || value === "pointer") return value;
          AelluxJs2.diagnostics.warn(
            AelluxJs2.diagnostics.WARN_SCROLLBOX_MODE_INVALID,
            { element, value }
          );
          return "native";
        }
        function isDesktop() {
          return !!(root2.matchMedia && root2.matchMedia("(hover: hover) and (pointer: fine)").matches);
        }
        function updatePointerScrollCursor(state, target, x, y) {
          if (!state.pointerListening || state.pointerScroll && state.pointerScroll.moved) return;
          if (!target || target.nodeType !== 1 || target.closest(`[${attribute}]`) !== state.element || target.closest(pointerScrollExceptionSelector) || isTextAtPoint(target, x, y)) {
            restorePointerScrollCursor(state);
            return;
          }
          setPointerScrollCursor(state, "grab");
        }
        function isTextAtPoint(element, x, y) {
          if (root2.getComputedStyle(element).userSelect === "none") return false;
          const range = document.createRange();
          for (const node of element.childNodes) {
            if (node.nodeType !== 3 || !node.textContent.trim()) continue;
            range.selectNodeContents(node);
            for (const rect of range.getClientRects()) {
              if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
                return true;
            }
          }
          return false;
        }
        function setPointerScrollCursor(state, value) {
          state.element.style.setProperty("cursor", value, "important");
          state.cursor.owned = true;
        }
        function restorePointerScrollCursor(state) {
          if (!state.cursor.owned) return;
          if (state.cursor.value) state.element.style.setProperty(
            "cursor",
            state.cursor.value,
            state.cursor.priority
          );
          else state.element.style.removeProperty("cursor");
          state.cursor.owned = false;
        }
        function startPointerScroll(state, event) {
          if (event.detail > 1) return;
          if (activePointerScrollState || state.pointerScroll || state.scrollbar.drag || event.defaultPrevented || event.button !== 0 || !event.isPrimary || event.pointerType === "touch" || (event.buttons & 1) === 0) return;
          const element = state.element;
          const nested = event.target.closest(`[${attribute}]`);
          if (nested !== element || event.target.closest(pointerScrollExceptionSelector)) return;
          const chain = [];
          let node = element;
          while (node) {
            const member = scrollboxes.get(node);
            if (member && member.pointerListening && !member.disposed) chain.push(member);
            node = node.parentElement && node.parentElement.closest(`[${attribute}]`);
          }
          if (chain.some((member) => member.scrollbar.drag)) return;
          const axes = new Map(chain.map((member) => {
            const metrics = nativeMetrics(member.element);
            member.metrics = metrics;
            return [member, wheelAxes(member, metrics)];
          }));
          if (!chain.some((member) => axes.get(member).x || axes.get(member).y)) return;
          const rect = element.getBoundingClientRect();
          if (event.clientX >= rect.left + element.clientWidth || event.clientY >= rect.top + element.clientHeight) return;
          const previousDown = state.lastPointerDown;
          const time = now();
          state.lastPointerDown = { x: event.clientX, y: event.clientY, time };
          if (previousDown && time - previousDown.time <= POINTER_SCROLL_MULTICLICK_MS && Math.abs(event.clientX - previousDown.x) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX && Math.abs(event.clientY - previousDown.y) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX) return;
          const textOrigin = isTextAtPoint(event.target, event.clientX, event.clientY);
          const selectionAtDown = readSelection();
          const verticalOnly = chain.some((member) => axes.get(member).y) && !chain.some((member) => axes.get(member).x);
          if (!textOrigin && event.cancelable) event.preventDefault();
          for (const member of chain) {
            cancelMomentum(member);
            member.snap.pending = null;
            member.snap.wheelTarget = null;
            if (member.elastic.owned) {
              resetElastic(member);
              refresh(member);
            }
          }
          if (state.mouseReleaseTimeout !== null) root2.clearTimeout(state.mouseReleaseTimeout);
          state.mouseReleaseTimeout = null;
          state.mouseReleaseButton = null;
          state.pointerScroll = {
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            button: event.button,
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
            moved: false,
            started: false,
            axis: null,
            chain,
            axes,
            styles: [],
            momentumState: null,
            momentumStartX: 0,
            momentumStartY: 0,
            elasticForce: 0,
            startTime: time,
            endTime: null,
            snapStarts: new Map(chain.filter((member) => member.snapEnabled).map((member) => {
              const items = snapItems(member);
              const item = items[member.snap.index] || null;
              const axis = snapAxis(member, member.metrics, axes.get(member));
              return [member, item ? { item, offset: snapCenterOffset(member, item, axis) } : null];
            })),
            selectionAtDown,
            verticalOnly,
            selectionReadyTime: textOrigin ? time + TEXT_SELECTION_WAIT_MS : 0,
            selectionWaitTimeout: null,
            pendingMove: null,
            momentumStartTime: time
          };
          activePointerScrollState = state;
          root2.addEventListener("pointermove", state.onPointerMove, { passive: false, capture: true });
          root2.addEventListener(
            "touchmove",
            state.onPointerScrollTouchMove,
            { passive: false, capture: true }
          );
          for (const name of pointerScrollDragEvents) {
            root2.addEventListener(name, state.onPointerScrollNativeEvent, true);
          }
          root2.addEventListener("selectstart", state.onPointerScrollNativeEvent, true);
          for (const name of pointerScrollMouseEvents) {
            root2.addEventListener(name, state.onMouseEvent, { passive: false, capture: true });
          }
          root2.addEventListener("pointerup", state.onPointerEnd, true);
          root2.addEventListener("pointercancel", state.onPointerEnd, true);
          root2.addEventListener("blur", state.onBlur);
        }
        function movePointerScroll(state, event) {
          const pointerScroll = state.pointerScroll;
          if (!pointerScroll || event.pointerId !== pointerScroll.pointerId) return;
          if ((event.buttons & 1) === 0) {
            endPointerScroll(state);
            return;
          }
          const dx = pointerScroll.startX - event.clientX;
          const dy = pointerScroll.startY - event.clientY;
          if (!pointerScroll.moved && selectionHasChanged(pointerScroll.selectionAtDown)) {
            endPointerScroll(state);
            return;
          }
          const threshold = pointerScroll.chain.some((member) => member.snapEnabled) ? SNAP_FLICK_MIN_DISTANCE_PX : POINTER_SCROLL_THRESHOLD_PX;
          if (!pointerScroll.moved && dx * dx + dy * dy < threshold * threshold) return;
          if (!pointerScroll.axis)
            pointerScroll.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
          const verticalTextDrag = pointerScroll.verticalOnly && pointerScroll.axis === "y" && Math.abs(dy) > VERTICAL_TEXT_DRAG_PX;
          if (!pointerScroll.moved && now() < pointerScroll.selectionReadyTime && !verticalTextDrag) {
            pointerScroll.pendingMove = { x: event.clientX, y: event.clientY };
            if (pointerScroll.selectionWaitTimeout === null) {
              pointerScroll.selectionWaitTimeout = root2.setTimeout(() => {
                pointerScroll.selectionWaitTimeout = null;
                if (state.pointerScroll !== pointerScroll) return;
                const pendingMove = pointerScroll.pendingMove;
                movePointerScroll(state, {
                  pointerId: pointerScroll.pointerId,
                  buttons: 1,
                  cancelable: false,
                  clientX: pendingMove.x,
                  clientY: pendingMove.y
                });
              }, Math.max(0, pointerScroll.selectionReadyTime - now()));
            }
            return;
          }
          if (!pointerScroll.moved) {
            const axis2 = pointerScroll.axis;
            if (!pointerScroll.chain.some((member) => pointerAxisMaximum(member, axis2, pointerScroll) > 0)) {
              endPointerScroll(state);
              return;
            }
            activatePointerScroll(state, pointerScroll, axis2);
            if (state.pointerScroll !== pointerScroll) return;
          }
          const axis = pointerScroll.axis;
          let remaining = axis === "x" ? pointerScroll.lastX - event.clientX : pointerScroll.lastY - event.clientY;
          pointerScroll.lastX = event.clientX;
          pointerScroll.lastY = event.clientY;
          if (event.cancelable) event.preventDefault();
          if (!remaining) return;
          let outermost = null;
          for (const member of pointerScroll.chain) {
            if (!member.disposed && member.pointerListening && pointerAxisMaximum(member, axis, pointerScroll) > 0) outermost = member;
          }
          if (outermost && outermost.elasticEnabled && pointerScroll.elasticForce) {
            const force = pointerScroll.elasticForce + remaining;
            if (!force || Math.sign(force) === Math.sign(pointerScroll.elasticForce)) {
              pointerScroll.elasticForce = force;
              remaining = 0;
            } else {
              pointerScroll.elasticForce = 0;
              remaining = force;
            }
          }
          let lastUsed = null;
          let lastStartX = 0, lastStartY = 0;
          for (const member of pointerScroll.chain) {
            if (member.disposed || !member.pointerListening || pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
            if (Math.abs(remaining) < 1e-3) continue;
            const element = member.element;
            const previousX = element.scrollLeft, previousY = element.scrollTop;
            const current = axis === "x" ? previousX : previousY;
            const desired = Math.max(0, Math.min(
              pointerAxisMaximum(member, axis, pointerScroll),
              current + remaining
            ));
            element.scrollTo({
              left: axis === "x" ? desired : previousX,
              top: axis === "y" ? desired : previousY,
              behavior: "instant"
            });
            const used = (axis === "x" ? element.scrollLeft : element.scrollTop) - current;
            if (!used) continue;
            remaining -= used;
            publish(member);
            lastUsed = member;
            lastStartX = previousX;
            lastStartY = previousY;
          }
          if (outermost && outermost.elasticEnabled) {
            pointerScroll.elasticForce += remaining;
            const element = outermost.element;
            const desiredX = element.scrollLeft + (axis === "x" ? pointerScroll.elasticForce : 0);
            const desiredY = element.scrollTop + (axis === "y" ? pointerScroll.elasticForce : 0);
            applyElasticFromDesired(outermost, desiredX, desiredY, false);
            scrollWithinElasticBounds(outermost, desiredX, desiredY);
            publish(outermost);
          }
          if (lastUsed) {
            const time = now();
            if (pointerScroll.momentumState !== lastUsed) {
              pointerScroll.momentumState = lastUsed;
              pointerScroll.momentumStartX = lastStartX;
              pointerScroll.momentumStartY = lastStartY;
              pointerScroll.momentumStartTime = time;
            } else if (time - pointerScroll.momentumStartTime > MOMENTUM_LIMIT_TIME_MS) {
              pointerScroll.momentumStartX = lastUsed.element.scrollLeft;
              pointerScroll.momentumStartY = lastUsed.element.scrollTop;
              pointerScroll.momentumStartTime = time;
            }
          }
        }
        function readSelection() {
          const selection = root2.getSelection();
          if (!selection) return null;
          return {
            rangeCount: selection.rangeCount,
            isCollapsed: selection.isCollapsed,
            anchorNode: selection.anchorNode,
            anchorOffset: selection.anchorOffset,
            focusNode: selection.focusNode,
            focusOffset: selection.focusOffset
          };
        }
        function selectionHasChanged(initial) {
          const current = readSelection();
          const initialSelected = initial && initial.rangeCount && !initial.isCollapsed;
          const currentSelected = current && current.rangeCount && !current.isCollapsed;
          if (!initialSelected && !currentSelected) return false;
          if (!initial || !current) return initial !== current;
          return current.rangeCount !== initial.rangeCount || current.isCollapsed !== initial.isCollapsed || current.anchorNode !== initial.anchorNode || current.anchorOffset !== initial.anchorOffset || current.focusNode !== initial.focusNode || current.focusOffset !== initial.focusOffset;
        }
        function pointerAxisMaximum(state, axis, pointerScroll = null) {
          const metrics = state.metrics || nativeMetrics(state.element);
          const axes = pointerScroll && pointerScroll.axes.get(state) || wheelAxes(state, metrics);
          return axes[axis] ? axis === "x" ? metrics.maxX : metrics.maxY : 0;
        }
        function activatePointerScroll(state, pointerScroll, axis) {
          pointerScroll.axis = axis;
          pointerScroll.moved = true;
          pointerScroll.started = true;
          restorePointerScrollCursor(state);
          for (const member of pointerScroll.chain) {
            if (pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
            const element = member.element;
            pointerScroll.styles.push({
              element,
              classOwned: !element.classList.contains(pointerScrollingClass),
              scrollBehavior: element.style.getPropertyValue("scroll-behavior"),
              scrollBehaviorPriority: element.style.getPropertyPriority("scroll-behavior")
            });
            element.style.setProperty("scroll-behavior", "auto", "important");
            element.classList.add(pointerScrollingClass);
            startScrollbarPdsVisibility(member);
          }
          dispatchPointerScroll(state, pointerScroll, "PointerScrollStart");
        }
        function dispatchPointerScroll(state, pointerScroll, name) {
          AelluxJs2.dispatchFrom(state.element, name, {
            detail: {
              axis: pointerScroll.axis,
              pointerId: pointerScroll.pointerId,
              pointerType: pointerScroll.pointerType,
              elements: pointerScroll.styles.map((saved) => saved.element)
            }
          });
        }
        function endPointerScroll(state, event) {
          const pointerScroll = state.pointerScroll;
          if (!pointerScroll || event && event.pointerId !== pointerScroll.pointerId) return;
          pointerScroll.endTime = now();
          if (event && event.type === "pointerup" && !pointerScroll.moved && pointerScroll.endTime < pointerScroll.selectionReadyTime && !selectionHasChanged(pointerScroll.selectionAtDown)) {
            const dx = pointerScroll.startX - event.clientX;
            const dy = pointerScroll.startY - event.clientY;
            const axis = pointerScroll.axis || (Math.abs(dx) >= Math.abs(dy) ? "x" : "y");
            pointerScroll.lastX = event.clientX;
            pointerScroll.lastY = event.clientY;
            if (pointerScroll.chain.some((member) => member.snapEnabled && snapAxis(member, member.metrics, pointerScroll.axes.get(member)) === axis && pointerAxisMaximum(member, axis, pointerScroll) > 0) && isSnapFlick(pointerScroll, axis)) {
              pointerScroll.axis = axis;
              pointerScroll.moved = true;
            }
          }
          state.pointerScroll = null;
          if (activePointerScrollState === state) activePointerScrollState = null;
          if (pointerScroll.selectionWaitTimeout !== null)
            root2.clearTimeout(pointerScroll.selectionWaitTimeout);
          root2.removeEventListener("pointermove", state.onPointerMove, true);
          root2.removeEventListener("touchmove", state.onPointerScrollTouchMove, true);
          for (const name of pointerScrollDragEvents) {
            root2.removeEventListener(name, state.onPointerScrollNativeEvent, true);
          }
          root2.removeEventListener("selectstart", state.onPointerScrollNativeEvent, true);
          root2.removeEventListener("pointerup", state.onPointerEnd, true);
          root2.removeEventListener("pointercancel", state.onPointerEnd, true);
          root2.removeEventListener("blur", state.onBlur);
          if (pointerScroll.moved && !state.disposed) {
            state.mouseReleaseButton = pointerScroll.button;
            if (state.mouseReleaseTimeout !== null) root2.clearTimeout(state.mouseReleaseTimeout);
            state.mouseReleaseTimeout = root2.setTimeout(() => stopPointerScrollMouseEvents(state), 0);
          } else {
            stopPointerScrollMouseEvents(state);
          }
          for (const saved of pointerScroll.styles) {
            if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
            if (saved.scrollBehavior) saved.element.style.setProperty(
              "scroll-behavior",
              saved.scrollBehavior,
              saved.scrollBehaviorPriority
            );
            else saved.element.style.removeProperty("scroll-behavior");
            const member = scrollboxes.get(saved.element);
            if (member) scheduleScrollbarPdsHide(member);
          }
          if (event && event.type === "pointerup" && state.pointerListening) {
            updatePointerScrollCursor(
              state,
              document.elementFromPoint(event.clientX, event.clientY),
              event.clientX,
              event.clientY
            );
          } else restorePointerScrollCursor(state);
          if (pointerScroll.started)
            dispatchPointerScroll(state, pointerScroll, "PointerScrollEnd");
          const hadElastic = pointerScroll.chain.some((member) => member.elastic.active);
          const momentumState = pointerScroll.momentumState;
          const snapState = momentumState ? momentumState.snapEnabled ? momentumState : null : pointerScroll.chain.find((member) => member.snapEnabled && pointerAxisMaximum(member, pointerScroll.axis, pointerScroll) > 0);
          const shouldSnap = event && event.type === "pointerup" && pointerScroll.moved && snapState && !snapState.disposed && snapItems(snapState).length;
          if (shouldSnap) schedulePointerSnap(snapState, pointerScroll);
          for (const member of pointerScroll.chain) releaseElastic(member);
          if (!shouldSnap && event && event.type === "pointerup" && pointerScroll.moved && momentumState && momentumState.momentumEnabled && !hadElastic && !momentumState.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
            startMomentum(momentumState, pointerScroll);
          }
        }
        function schedulePointerSnap(state, pointerScroll) {
          const items = snapItems(state);
          const metrics = nativeMetrics(state.element);
          const axis = snapAxis(state, metrics);
          const edgeIndex = edgeSnapIndex(state, items, axis, metrics);
          const start = pointerScroll.snapStarts.get(state);
          const startIndex = start ? items.indexOf(start.item) : -1;
          const projection = axis === pointerScroll.axis ? axis === "x" ? pointerScroll.lastX - pointerScroll.startX : pointerScroll.lastY - pointerScroll.startY : 0;
          let index = edgeIndex === null ? nearestSnapIndex(
            state,
            items,
            axis === "x" ? projection : 0,
            axis === "y" ? projection : 0
          ) : edgeIndex;
          if (edgeIndex === null && index === startIndex && axis === pointerScroll.axis && start) {
            const flick = isSnapFlick(pointerScroll, axis);
            const distance = axis === "x" ? pointerScroll.startX - pointerScroll.lastX : pointerScroll.startY - pointerScroll.lastY;
            const offset = snapCenterOffset(state, start.item, axis);
            const size = axis === "x" ? state.element.clientWidth : state.element.clientHeight;
            const movedAway = Math.abs(offset) - Math.abs(start.offset) >= size * SNAP_DRAG_DISTANCE_RATIO;
            if (flick || movedAway) {
              const direction = flick ? Math.sign(distance) : Math.sign(start.offset - offset);
              index = Math.max(0, Math.min(items.length - 1, index + direction));
            }
          }
          state.snap.pending = items[index];
          flushPendingSnap(state);
        }
        function isSnapFlick(pointerScroll, axis) {
          const distance = axis === "x" ? pointerScroll.startX - pointerScroll.lastX : pointerScroll.startY - pointerScroll.lastY;
          const elapsed = Math.max(1, pointerScroll.endTime - pointerScroll.startTime);
          return elapsed <= SNAP_FLICK_WINDOW_MS && Math.abs(distance) > SNAP_FLICK_MIN_DISTANCE_PX && Math.abs(distance) < SNAP_FLICK_MAX_DISTANCE_PX && (elapsed <= SNAP_FLICK_FAST_TIME_MS || Math.abs(distance) / elapsed >= SNAP_SWIPE_SPEED_PX_MS);
        }
        function flushPendingSnap(state) {
          const target = state.snap.pending;
          if (!target || state.elastic.active || state.disposed) return;
          state.snap.pending = null;
          const index = snapItems(state).indexOf(target);
          if (index >= 0) scrollToSnap(state, index);
        }
        function cancelPointerScrollMouseEvent(state, event) {
          const active = state.pointerScroll && state.pointerScroll.moved;
          if (!active && !mouseReleaseEvents.has(event.type)) return;
          const button = active ? state.pointerScroll.button : state.mouseReleaseButton;
          if (button === null || !event.cancelable) return;
          if (mouseHoldEvents.has(event.type)) {
            if ((event.buttons & 1 << button) === 0) return;
          } else if (event.button !== button) {
            return;
          }
          event.preventDefault();
        }
        function stopPointerScrollMouseEvents(state) {
          if (state.mouseReleaseTimeout !== null) root2.clearTimeout(state.mouseReleaseTimeout);
          state.mouseReleaseTimeout = null;
          state.mouseReleaseButton = null;
          for (const name of pointerScrollMouseEvents) {
            root2.removeEventListener(name, state.onMouseEvent, true);
          }
        }
        function startMomentum(state, pointerScroll) {
          const element = state.element;
          const elapsed = Math.max(1, now() - pointerScroll.momentumStartTime);
          const x = pointerScroll.axis === "x" ? momentumAxis(
            element.scrollLeft,
            pointerScroll.momentumStartX,
            elapsed,
            Math.max(0, element.scrollWidth - element.clientWidth)
          ) : element.scrollLeft;
          const y = pointerScroll.axis === "y" ? momentumAxis(
            element.scrollTop,
            pointerScroll.momentumStartY,
            elapsed,
            Math.max(0, element.scrollHeight - element.clientHeight)
          ) : element.scrollTop;
          if (x === element.scrollLeft && y === element.scrollTop) return;
          const momentum = {
            currentX: element.scrollLeft,
            currentY: element.scrollTop,
            toX: x,
            toY: y,
            frame: null
          };
          state.momentum = momentum;
          momentum.frame = root2.requestAnimationFrame(() => stepMomentum(state, momentum));
        }
        function momentumAxis(current, start, elapsed, maximum) {
          const distance = current - start;
          if (Math.abs(distance) <= MOMENTUM_LIMIT_DISTANCE_PX) return current;
          const speed = Math.abs(distance) / elapsed;
          const projected = current + Math.sign(distance) * speed * speed / MOMENTUM_DECELERATION;
          return Math.max(0, Math.min(maximum, Math.round(projected)));
        }
        function stepMomentum(state, momentum) {
          if (state.momentum !== momentum || state.disposed) return;
          momentum.currentX += (momentum.toX - momentum.currentX) * 0.1;
          momentum.currentY += (momentum.toY - momentum.currentY) * 0.1;
          const done = momentum.currentX.toFixed(3) === momentum.toX.toFixed(3) && momentum.currentY.toFixed(3) === momentum.toY.toFixed(3);
          const element = state.element;
          element.scrollTo({
            left: done ? momentum.toX : momentum.currentX,
            top: done ? momentum.toY : momentum.currentY,
            behavior: "instant"
          });
          publish(state);
          if (done) {
            state.momentum = null;
            return;
          }
          momentum.frame = root2.requestAnimationFrame(() => stepMomentum(state, momentum));
        }
        function cancelMomentum(state) {
          if (!state.momentum) return;
          root2.cancelAnimationFrame(state.momentum.frame);
          state.momentum = null;
        }
        function addTouchListeners(state) {
          const element = state.element;
          element.addEventListener("touchstart", state.onTouchStart, { passive: true });
          element.addEventListener("touchmove", state.onTouchMove, { passive: false });
          element.addEventListener("touchend", state.onTouchEnd, { passive: true });
          element.addEventListener("touchcancel", state.onTouchEnd, { passive: true });
          state.touchListening = true;
        }
        function removeTouchListeners(state) {
          const element = state.element;
          element.removeEventListener("touchstart", state.onTouchStart);
          element.removeEventListener("touchmove", state.onTouchMove);
          element.removeEventListener("touchend", state.onTouchEnd);
          element.removeEventListener("touchcancel", state.onTouchEnd);
          state.touchListening = false;
          state.elastic.touch = null;
        }
        function startTouch(state, event) {
          if (event.touches.length !== 1) {
            state.elastic.touch = null;
            releaseElastic(state);
            return;
          }
          if (event.target.closest(`[${attribute}]`) !== state.element) return;
          cancelMomentum(state);
          const touch = event.touches[0];
          if (state.elastic.owned) {
            resetElastic(state);
            refresh(state);
          }
          state.elastic.touch = {
            identifier: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            scrollLeft: state.element.scrollLeft,
            scrollTop: state.element.scrollTop
          };
        }
        function moveTouch(state, event) {
          const start = state.elastic.touch;
          if (!start) return;
          let touch = null;
          for (const item of event.touches) {
            if (item.identifier === start.identifier) {
              touch = item;
              break;
            }
          }
          if (!touch) return;
          const desiredX = start.scrollLeft + start.x - touch.clientX;
          const desiredY = start.scrollTop + start.y - touch.clientY;
          if (!applyElasticFromDesired(state, desiredX, desiredY, false)) return;
          if (event.cancelable) event.preventDefault();
          scrollWithinElasticBounds(state, desiredX, desiredY);
          publish(state);
        }
        function endTouch(state, event) {
          const touch = state.elastic.touch;
          if (!touch) return;
          for (const item of event.touches) {
            if (item.identifier === touch.identifier) return;
          }
          state.elastic.touch = null;
          releaseElastic(state);
        }
        function applyElasticFromDesired(state, desiredX, desiredY, additive, axis = null) {
          if (!state.elasticEnabled) return false;
          const element = state.element;
          const metrics = state.metrics || nativeMetrics(element);
          const elastic = state.elastic;
          const amounts = [0, 0, 0, 0];
          if (axis !== "x" && metrics.maxY > 1) {
            const limitY = elasticLimit(element.clientHeight, elastic.limits[0]);
            if (desiredY < 0) amounts[0] = elasticResistance(
              -desiredY,
              additive ? elastic.amounts[0] : 0,
              limitY
            );
            else if (desiredY > metrics.maxY) amounts[2] = elasticResistance(
              desiredY - metrics.maxY,
              additive ? elastic.amounts[2] : 0,
              limitY
            );
          }
          if (axis !== "y" && metrics.maxX > 1) {
            const limitX = elasticLimit(element.clientWidth, elastic.limits[1]);
            if (desiredX > metrics.maxX) amounts[1] = elasticResistance(
              desiredX - metrics.maxX,
              additive ? elastic.amounts[1] : 0,
              limitX
            );
            else if (desiredX < 0) amounts[3] = elasticResistance(
              -desiredX,
              additive ? elastic.amounts[3] : 0,
              limitX
            );
          }
          const active = amounts.some((amount) => amount > 0);
          if (!active && !elastic.owned) return false;
          const dimensions = elastic.dimensions || measureElasticWrapper(elastic.wrapper);
          elastic.dimensions = dimensions;
          if (elastic.releaseFrame !== null) root2.cancelAnimationFrame(elastic.releaseFrame);
          elastic.releaseFrame = null;
          elastic.wrapper.classList.remove(elasticReleaseClass);
          elastic.amounts = amounts;
          elastic.active = active;
          elastic.owned = true;
          if (amounts[1] > 0 && !elastic.extentX) {
            elastic.wrapper.style.setProperty(
              "min-width",
              `${Math.max(dimensions.offsetWidth, dimensions.scrollWidth)}px`,
              elastic.previousMinWidth.priority
            );
            elastic.extentX = true;
          }
          if (amounts[2] > 0 && !elastic.extentY) {
            elastic.wrapper.style.setProperty(
              "min-height",
              `${Math.max(dimensions.offsetHeight, dimensions.scrollHeight)}px`,
              elastic.previousMinHeight.priority
            );
            elastic.extentY = true;
          }
          setElasticTransform(state, dimensions);
          return active;
        }
        function measureElasticWrapper(wrapper) {
          return {
            offsetWidth: wrapper.offsetWidth,
            scrollWidth: wrapper.scrollWidth,
            clientLeft: wrapper.clientLeft,
            offsetHeight: wrapper.offsetHeight,
            scrollHeight: wrapper.scrollHeight,
            clientTop: wrapper.clientTop
          };
        }
        function setElasticTransform(state, dimensions = state.elastic.dimensions) {
          const elastic = state.elastic;
          const wrapper = elastic.wrapper;
          const x = elastic.amounts[3] - elastic.amounts[1];
          const y = elastic.amounts[0] - elastic.amounts[2];
          const translate = x || y ? `translate3d(${x}px, ${y}px, 0)` : "";
          const width = Math.max(dimensions.offsetWidth, dimensions.scrollWidth, 1);
          const height = Math.max(dimensions.offsetHeight, dimensions.scrollHeight, 1);
          const scaleX = 1 + 2 * (Math.max(elastic.amounts[1], elastic.amounts[3]) / width);
          const scaleY = 1 + 2 * (Math.max(elastic.amounts[0], elastic.amounts[2]) / height);
          const scale = scaleX > 1 || scaleY > 1 ? `scale(${scaleX}, ${scaleY})` : "";
          if (scaleX > 1 || scaleY > 1) {
            const baseOrigin = elastic.baseOrigin.split(" ");
            const originX = elastic.amounts[3] > 0 ? "0%" : elastic.amounts[1] > 0 ? `${Math.max(
              dimensions.offsetWidth,
              dimensions.scrollWidth + dimensions.clientLeft
            )}px` : baseOrigin[0];
            const originY = elastic.amounts[0] > 0 ? "0%" : elastic.amounts[2] > 0 ? `${Math.max(
              dimensions.offsetHeight,
              dimensions.scrollHeight + dimensions.clientTop
            )}px` : baseOrigin[1];
            wrapper.style.setProperty(
              "transform-origin",
              `${originX} ${originY}`,
              elastic.previousOrigin.priority
            );
          }
          wrapper.style.setProperty(
            "transform",
            [scale, translate, elastic.baseTransform].filter(Boolean).join(" ") || "none",
            elastic.previousTransform.priority
          );
        }
        function scrollWithinElasticBounds(state, desiredX, desiredY) {
          const element = state.element;
          const metrics = state.metrics || nativeMetrics(element);
          element.scrollTo({
            left: Math.max(0, Math.min(metrics.maxX, desiredX)),
            top: Math.max(0, Math.min(metrics.maxY, desiredY)),
            behavior: "instant"
          });
        }
        function releaseElastic(state) {
          const elastic = state.elastic;
          if (!elastic.owned) {
            flushPendingSnap(state);
            return;
          }
          if (elastic.wheelTimeout !== null) root2.clearTimeout(elastic.wheelTimeout);
          elastic.wheelTimeout = null;
          if (!elastic.active) {
            resetElastic(state);
            flushPendingSnap(state);
            return;
          }
          if (root2.matchMedia && root2.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            resetElastic(state);
            refresh(state);
            flushPendingSnap(state);
            return;
          }
          elastic.wrapper.classList.add(elasticReleaseClass);
          if (elastic.releaseFrame !== null) root2.cancelAnimationFrame(elastic.releaseFrame);
          elastic.releaseFrame = root2.requestAnimationFrame(() => stepElasticRelease(state));
        }
        function stepElasticRelease(state) {
          const elastic = state.elastic;
          elastic.releaseFrame = null;
          if (state.disposed || !elastic.owned) return;
          elastic.amounts = elastic.amounts.map((amount) => amount < ELASTIC_RETURN_EPSILON ? 0 : amount * (1 - ELASTIC_RETURN_LERP));
          if (elastic.amounts.every((amount) => amount === 0)) {
            resetElastic(state);
            refresh(state);
            flushPendingSnap(state);
            return;
          }
          setElasticTransform(state);
          elastic.releaseFrame = root2.requestAnimationFrame(() => stepElasticRelease(state));
        }
        function resetElastic(state) {
          const elastic = state.elastic;
          const wasOwned = elastic.owned;
          if (elastic.releaseFrame !== null) root2.cancelAnimationFrame(elastic.releaseFrame);
          if (elastic.wheelTimeout !== null) root2.clearTimeout(elastic.wheelTimeout);
          elastic.releaseFrame = null;
          elastic.wheelTimeout = null;
          if (elastic.wrapper) elastic.wrapper.classList.remove(elasticReleaseClass);
          if (elastic.owned && elastic.wrapper) {
            const previous2 = elastic.previousTransform;
            if (previous2.value) elastic.wrapper.style.setProperty(
              "transform",
              previous2.value,
              previous2.priority
            );
            else elastic.wrapper.style.removeProperty("transform");
            const previousOrigin = elastic.previousOrigin;
            if (previousOrigin.value) elastic.wrapper.style.setProperty(
              "transform-origin",
              previousOrigin.value,
              previousOrigin.priority
            );
            else elastic.wrapper.style.removeProperty("transform-origin");
            if (elastic.extentX) {
              const previousMinWidth = elastic.previousMinWidth;
              if (previousMinWidth.value) elastic.wrapper.style.setProperty(
                "min-width",
                previousMinWidth.value,
                previousMinWidth.priority
              );
              else elastic.wrapper.style.removeProperty("min-width");
            }
            if (elastic.extentY) {
              const previousMinHeight = elastic.previousMinHeight;
              if (previousMinHeight.value) elastic.wrapper.style.setProperty(
                "min-height",
                previousMinHeight.value,
                previousMinHeight.priority
              );
              else elastic.wrapper.style.removeProperty("min-height");
            }
          }
          elastic.amounts = [0, 0, 0, 0];
          elastic.active = false;
          elastic.owned = false;
          elastic.extentX = false;
          elastic.extentY = false;
          if (wasOwned && !state.disposed) publish(state);
        }
        function observe(state) {
          state.onResize = () => scheduleResize(state);
          root2.addEventListener("resize", state.onResize, { passive: true });
          if (root2.ResizeObserver) {
            state.resizeObserver = new root2.ResizeObserver(() => scheduleResize(state));
            state.resizeObserver.observe(state.element);
            for (const child of state.element.children) state.resizeObserver.observe(child);
          }
          if (root2.MutationObserver) {
            state.mutationObserver = new root2.MutationObserver((records) => {
              if (state.resizeObserver) {
                state.resizeObserver.disconnect();
                state.resizeObserver.observe(state.element);
                for (const child of state.element.children) state.resizeObserver.observe(child);
              }
              if (records.some((record) => record.target === state.element)) configure(state);
              else refresh(state);
            });
            state.mutationObserver.observe(
              state.element,
              { childList: true, subtree: true, characterData: true }
            );
          }
        }
        function scheduleResize(state) {
          if (state.disposed) return;
          const elapsed = now() - state.lastResizeTime;
          if (elapsed >= RESIZE_INTERVAL_MS) {
            if (state.resizeTimeout !== null) root2.clearTimeout(state.resizeTimeout);
            state.resizeTimeout = null;
            flushResize(state);
            return;
          }
          if (state.resizeTimeout !== null) return;
          state.resizeTimeout = root2.setTimeout(() => flushResize(state), RESIZE_INTERVAL_MS - elapsed);
        }
        function flushResize(state) {
          state.resizeTimeout = null;
          if (state.disposed) return;
          state.lastResizeTime = now();
          refresh(state);
        }
        function now() {
          return root2.performance && typeof root2.performance.now === "function" ? root2.performance.now() : Date.now();
        }
        function refresh(state) {
          if (state.disposed) return;
          publish(state);
        }
        function nativeMetrics(element) {
          return {
            maxX: Math.max(0, element.scrollWidth - element.clientWidth),
            maxY: Math.max(0, element.scrollHeight - element.clientHeight),
            page: element.clientHeight || 1
          };
        }
        function wheelAxes(state, metrics) {
          const style = root2.getComputedStyle(state.element);
          const available = (value) => value === "auto" || value === "scroll";
          return {
            x: metrics.maxX > 1 && available(style.overflowX),
            y: metrics.maxY > 1 && available(style.overflowY)
          };
        }
        function publish(state) {
          if (state.disposed) return;
          state.publishDirty = true;
          if (state.publishPending) return;
          state.publishPending = true;
          AelluxJs2.waitLayout.read(() => {
            if (state.disposed) return null;
            state.publishDirty = false;
            const metrics = nativeMetrics(state.element);
            const scrollTop = state.element.scrollTop;
            const scrollLeft = state.element.scrollLeft;
            if (!state.elastic.active) state.metrics = metrics;
            if (state.elasticEnabled && state.elastic.wrapper && !state.elastic.active)
              state.elastic.dimensions = measureElasticWrapper(state.elastic.wrapper);
            const bars = state.scrollbar.x || state.scrollbar.y;
            const axes = state.snapEnabled || bars ? wheelAxes(state, metrics) : null;
            return {
              revision: state.layoutRevision,
              y: progress(scrollTop, metrics.maxY),
              x: progress(scrollLeft, metrics.maxX),
              edges: state.elastic.owned ? null : [
                scrollTop < SCROLL_EDGE_MARGIN_PX,
                scrollTop >= metrics.maxY - SCROLL_EDGE_MARGIN_PX,
                scrollLeft < SCROLL_EDGE_MARGIN_PX,
                scrollLeft >= metrics.maxX - SCROLL_EDGE_MARGIN_PX
              ],
              snapValues: state.snapEnabled ? measureSnapValues(state, metrics, axes) : [],
              scrollbars: bars ? readScrollbars(state, metrics, axes) : []
            };
          }).then((values) => {
            if (!values || state.disposed) {
              state.publishDirty = false;
              return;
            }
            return AelluxJs2.waitLayout.update(() => {
              if (state.disposed || state.layoutRevision !== values.revision) return;
              state.element.style.setProperty(properties[0], values.y);
              state.element.style.setProperty(properties[1], values.x);
              if (values.edges && !state.elastic.owned) {
                scrollEdgeClasses.forEach((name, index) => state.element.classList.toggle(name, values.edges[index]));
              }
              for (const { item, viewport, focus } of values.snapValues) {
                item.style.setProperty(snapProperties[0], viewport);
                item.style.setProperty(snapProperties[1], focus);
              }
              updateScrollbars(state, values.scrollbars);
            });
          }).catch((cause) => {
            AelluxJs2.diagnostics.error(
              AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
              { cause, extension: extensionName, element: state.element, method: "update" }
            );
          }).finally(() => {
            state.publishPending = false;
            if (state.publishDirty && !state.disposed) publish(state);
          });
        }
        function measureSnapValues(state, metrics, axes) {
          const element = state.element;
          const rect = element.getBoundingClientRect();
          const axis = snapAxis(state, metrics, axes);
          const size = axis === "x" ? element.clientWidth : element.clientHeight;
          if (!size) return [];
          const center = axis === "x" ? rect.left + element.clientLeft + size / 2 : rect.top + element.clientTop + size / 2;
          return snapItems(state).map((item) => {
            const box = item.getBoundingClientRect();
            const itemCenter = axis === "x" ? box.left + box.width / 2 : box.top + box.height / 2;
            const viewport = Math.max(-2, Math.min(2, (itemCenter - center) * 2 / size));
            const focus = Math.max(0, 1 - Math.abs(viewport) / 2);
            return { item, viewport, focus };
          });
        }
        function progress(position, distance) {
          return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
        }
        function handleSnapWheel(state, event, deltaX, deltaY, axes) {
          const items = snapItems(state);
          if (!items.length) return false;
          const hasX = axes.x, hasY = axes.y;
          if (!hasX && !hasY) return false;
          const axis = hasX && hasY ? Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y" : hasX ? "x" : "y";
          const delta = axis === "x" ? deltaX : deltaY;
          if (!delta) return false;
          if (state.snap.wheelTimeout !== null) {
            if (event.cancelable) event.preventDefault();
            scheduleSnapWheelEnd(state);
            return true;
          }
          const index = Math.max(0, Math.min(items.length - 1, state.snap.index));
          const destination = Math.max(0, Math.min(
            items.length - 1,
            index + Math.sign(delta)
          ));
          if (destination === index) {
            if (state.elasticEnabled) {
              const desiredX = state.element.scrollLeft + (axis === "x" ? delta : 0);
              const desiredY = state.element.scrollTop + (axis === "y" ? delta : 0);
              if (applyElasticFromDesired(state, desiredX, desiredY, true, axis)) {
                scrollWithinElasticBounds(state, desiredX, desiredY);
                publish(state);
                if (state.elastic.wheelTimeout !== null)
                  root2.clearTimeout(state.elastic.wheelTimeout);
                state.elastic.wheelTimeout = root2.setTimeout(
                  () => releaseElastic(state),
                  ELASTIC_WHEEL_IDLE_MS
                );
              }
            }
            return true;
          }
          if (event.cancelable) event.preventDefault();
          scrollToSnap(state, destination);
          state.snap.wheelTarget = items[destination];
          scheduleSnapWheelEnd(state);
          return true;
        }
        function handleWheel(state, event) {
          state.snap.pending = null;
          if (state.desktop && state.mode === "pointer" && state.element.classList.contains(pointerScrollingClass)) {
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();
            return;
          }
          cancelMomentum(state);
          if (event.defaultPrevented || event.ctrlKey) return;
          if (event.target.closest(`[${attribute}]`) !== state.element) return;
          const metrics = nativeMetrics(state.element);
          if (!metrics) return;
          const axes = wheelAxes(state, metrics);
          const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
          const converted = state.desktop && state.wheelEnabled && axes.x && !axes.y && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
          const deltaX = (converted ? event.deltaY : event.deltaX) * factor;
          const deltaY = (converted ? 0 : event.deltaY) * factor;
          if (state.snapEnabled && handleSnapWheel(state, event, deltaX, deltaY, axes)) return;
          if (converted && deltaX) {
            const current = state.element.scrollLeft;
            const desiredX = current + deltaX;
            const next2 = Math.max(0, Math.min(metrics.maxX, desiredX));
            const overflow = desiredX < 0 || desiredX > metrics.maxX;
            let stretched = false;
            if (overflow && state.elasticEnabled) {
              stretched = applyElasticFromDesired(
                state,
                desiredX,
                state.element.scrollTop,
                true,
                "x"
              );
              if (stretched) {
                scrollWithinElasticBounds(state, desiredX, state.element.scrollTop);
                if (state.elastic.wheelTimeout !== null)
                  root2.clearTimeout(state.elastic.wheelTimeout);
                state.elastic.wheelTimeout = root2.setTimeout(
                  () => releaseElastic(state),
                  ELASTIC_WHEEL_IDLE_MS
                );
              }
            } else if (state.elastic.owned) {
              resetElastic(state);
              refresh(state);
            }
            if (!stretched && next2 !== current)
              state.element.scrollTo({ left: next2, behavior: "instant" });
            if (stretched || next2 !== current) publish(state);
            if (!overflow && next2 !== current) event.preventDefault();
            return;
          }
          if (state.elasticEnabled && (axes.x || axes.y)) {
            const desiredX = state.element.scrollLeft + (axes.x ? deltaX : 0);
            const desiredY = state.element.scrollTop + (axes.y ? deltaY : 0);
            const axis = axes.x && axes.y ? null : axes.x ? "x" : "y";
            if (applyElasticFromDesired(state, desiredX, desiredY, true, axis)) {
              event.preventDefault();
              scrollWithinElasticBounds(state, desiredX, desiredY);
              publish(state);
              if (state.elastic.wheelTimeout !== null) root2.clearTimeout(state.elastic.wheelTimeout);
              state.elastic.wheelTimeout = root2.setTimeout(() => releaseElastic(state), ELASTIC_WHEEL_IDLE_MS);
              return;
            }
            if (state.elastic.owned) {
              resetElastic(state);
              refresh(state);
            }
          }
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.adaptive.js
  var aellux_ext_adaptive_exports = {};
  var init_aellux_ext_adaptive = __esm({
    "src/aellux.ext.adaptive.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "adaptive";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const attr = {
          adaptive: AelluxJs2.attr(extensionName)
        };
        const modifier = {
          shapeHorizontal: AelluxJs2.className("shape-horizontal"),
          shapeVertical: AelluxJs2.className("shape-vertical"),
          shapeSquare: AelluxJs2.className("shape-square")
        };
        const adaptiveElements = /* @__PURE__ */ new Set();
        const initialDimensions = /* @__PURE__ */ new Map();
        const dimensionProperties = ["--ae-width", "--ae-height"];
        const pendingResizeEntries = /* @__PURE__ */ new Map();
        const pendingResizeElements = /* @__PURE__ */ new Set();
        const adaptiveParams = {
          experienceScale: { near: 1, far: 1.5 },
          ratioShapes: { vertical: 0.8, horizontal: 1.25 },
          minSizes: {
            compact: 0,
            small: 480,
            medium: 768,
            large: 1024,
            xl: 1280,
            xxl: 1600
          }
        };
        const UPDATE_INTERVAL_MS = 100;
        let managedClasses;
        let sizeThresholds = [];
        let updateTimeout = null;
        let lastUpdateTime = -UPDATE_INTERVAL_MS;
        const resizeObserver = typeof root2.ResizeObserver === "function" ? new root2.ResizeObserver(onResize) : null;
        AelluxJs2.extAttach(extensionName, { init, destroy, adaptiveParams });
        function init(options = {}) {
          const overrides = options.adaptiveParams || {};
          for (const group of Object.keys(adaptiveParams)) {
            if (overrides[group] && typeof overrides[group] === "object") {
              Object.assign(adaptiveParams[group], overrides[group]);
            }
          }
          managedClasses = getManagedClasses();
          for (const group of Object.keys(adaptiveParams)) Object.freeze(adaptiveParams[group]);
          Object.freeze(adaptiveParams);
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attr.adaptive}]`,
            priority: 0,
            mount: mountAdaptive,
            unmount: unmountAdaptive
          });
        }
        function getManagedClasses() {
          const classes = [
            modifier.shapeHorizontal,
            modifier.shapeVertical,
            modifier.shapeSquare
          ];
          sizeThresholds = [];
          for (const [size, minimum] of Object.entries(adaptiveParams.minSizes)) {
            const className = AelluxJs2.className("fits-" + size);
            sizeThresholds.push({ className, minimum });
            classes.push(className);
          }
          return classes;
        }
        function destroy() {
          if (updateTimeout !== null) {
            clearTimeout(updateTimeout);
            updateTimeout = null;
          }
          pendingResizeEntries.clear();
          pendingResizeElements.clear();
          lastUpdateTime = -UPDATE_INTERVAL_MS;
          for (const element of adaptiveElements) unmountAdaptive(element);
          if (resizeObserver) resizeObserver.disconnect();
          AelluxJs2.mountManager.remove({ extensionName });
        }
        function mountAdaptive(element) {
          if (adaptiveElements.has(element)) return;
          initialDimensions.set(element, dimensionProperties.map((name) => ({
            value: element.style.getPropertyValue(name),
            priority: element.style.getPropertyPriority(name)
          })));
          adaptiveElements.add(element);
          if (resizeObserver) resizeObserver.observe(element);
          else {
            AelluxJs2.waitLayout.read(readBounds, [element]);
            if (adaptiveElements.size === 1) root2.addEventListener("resize", onWindowResize);
          }
        }
        function unmountAdaptive(element) {
          if (!adaptiveElements.delete(element)) return;
          pendingResizeEntries.delete(element);
          pendingResizeElements.delete(element);
          if (resizeObserver) resizeObserver.unobserve(element);
          else if (adaptiveElements.size === 0) root2.removeEventListener("resize", onWindowResize);
          for (const name of managedClasses) {
            element.classList.remove(name);
          }
          const initial = initialDimensions.get(element);
          dimensionProperties.forEach((name, index) => {
            const { value, priority } = initial[index];
            if (value) element.style.setProperty(name, value, priority);
            else element.style.removeProperty(name);
          });
          initialDimensions.delete(element);
        }
        function onResize(entries) {
          for (const entry of entries) {
            if (adaptiveElements.has(entry.target)) {
              pendingResizeEntries.set(entry.target, entry);
            }
          }
          scheduleUpdate();
        }
        function onWindowResize() {
          for (const element of adaptiveElements) {
            pendingResizeElements.add(element);
          }
          scheduleUpdate();
        }
        function scheduleUpdate() {
          const elapsed = now() - lastUpdateTime;
          if (elapsed >= UPDATE_INTERVAL_MS) {
            if (updateTimeout !== null) {
              clearTimeout(updateTimeout);
              updateTimeout = null;
            }
            flushPendingUpdate();
            return;
          }
          if (updateTimeout !== null) return;
          updateTimeout = setTimeout(
            flushPendingUpdate,
            UPDATE_INTERVAL_MS - elapsed
          );
        }
        function flushPendingUpdate() {
          updateTimeout = null;
          if (!pendingResizeEntries.size && !pendingResizeElements.size) return;
          lastUpdateTime = now();
          const entries = Array.from(pendingResizeEntries.values());
          pendingResizeEntries.clear();
          for (const entry of entries) {
            updateAdaptive(entry.target, entry.contentRect.width, entry.contentRect.height);
          }
          const elements = Array.from(pendingResizeElements);
          pendingResizeElements.clear();
          for (const element of elements) {
            AelluxJs2.waitLayout.read(readBounds, [element]);
          }
        }
        function now() {
          return root2.performance && typeof root2.performance.now === "function" ? root2.performance.now() : Date.now();
        }
        function readBounds(entry) {
          const { width, height } = entry.getBoundingClientRect();
          AelluxJs2.waitLayout.update(
            updateAdaptive,
            [entry, width, height]
          );
        }
        function updateAdaptive(element, width, height) {
          if (!adaptiveElements.has(element)) return;
          const ratio = height > 0 ? width / height : 0;
          element.setAttribute(
            "aria-orientation",
            height > width ? "vertical" : "horizontal"
          );
          element.classList.toggle(
            modifier.shapeVertical,
            ratio < adaptiveParams.ratioShapes.vertical
          );
          element.classList.toggle(
            modifier.shapeHorizontal,
            ratio > adaptiveParams.ratioShapes.horizontal
          );
          element.classList.toggle(
            modifier.shapeSquare,
            ratio >= adaptiveParams.ratioShapes.vertical && ratio <= adaptiveParams.ratioShapes.horizontal
          );
          const space = Math.sqrt(width * height);
          for (let i = 0; i < sizeThresholds.length; i++) {
            const threshold = sizeThresholds[i];
            element.classList.toggle(
              threshold.className,
              space >= threshold.minimum
            );
          }
          for (const name of dimensionProperties) {
            if (element.style.getPropertyPriority(name)) element.style.removeProperty(name);
          }
          element.style.setProperty("--ae-width", width);
          element.style.setProperty("--ae-height", height);
          AelluxJs2.dispatchFrom(element, "AdaptiveUpdate", {
            detail: { width, height, ratio }
          });
        }
        function inferOrientation(flexBox, selector = "*") {
          return AelluxJs2.waitLayout.read(() => {
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
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.present.js
  var aellux_ext_present_exports = {};
  var init_aellux_ext_present = __esm({
    "src/aellux.ext.present.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const AelluxJs2 = root2.AelluxJs;
        const extensionName = "present";
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const attr = {
          present: AelluxJs2.attr(extensionName),
          autoUnpop: AelluxJs2.attr("auto-unpop"),
          presentMotion: AelluxJs2.attr("present-motion"),
          unpopOnOutside: AelluxJs2.attr("unpop-on-outside"),
          trigger: AelluxJs2.attr("trigger"),
          //toggle,pop,unpop
          dismiss: AelluxJs2.attr("dismiss"),
          //target ID
          target: AelluxJs2.attr("target"),
          //target ID
          lowHardware: AelluxJs2.attr("low-hardware")
        };
        const className = {
          pop: AelluxJs2.className("pop"),
          popping: AelluxJs2.className("popping"),
          unpopping: AelluxJs2.className("unpopping"),
          willChange: AelluxJs2.className("will-change"),
          grid: AelluxJs2.className("present-grid")
        };
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          pop,
          unpop,
          toggle,
          trigger
        });
        const POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", TRANSITION_PREPARE_TIME = 100, ARIA_EXPANDED = "aria-expanded", ARIA_CONTROLS = "aria-controls", DEFAULT_PRESENT = "opacity transform height width";
        const presentElements = /* @__PURE__ */ new Map();
        const openPresentElements = /* @__PURE__ */ new Set();
        const triggerElementsSet = /* @__PURE__ */ new Set();
        const triggerTargets = /* @__PURE__ */ new Map();
        const triggersByTargetId = /* @__PURE__ */ new Map();
        const indexedTriggerValues = /* @__PURE__ */ new Map();
        function init(options) {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attr.present}]`,
            priority: 0,
            mount: mountPresentContainer,
            unmount: unmountPresentContainer,
            controllers: ["pop", "unpop", "trigger", "toggle"]
          });
          AelluxJs2.mountManager.add({
            extensionName,
            priority: 0,
            selector: `[${[
              attr.trigger,
              attr.dismiss,
              attr.target
            ].join("],[")}]`,
            mount: mountTriggerElement,
            unmount: unmountTriggerElement
          });
          document.addEventListener("click", OnClick);
        }
        function destroy() {
          AelluxJs2.mountManager.remove({ extensionName });
          document.removeEventListener("click", OnClick);
          for (const triggerElement of triggerElementsSet) {
            unmountTriggerElement(triggerElement);
          }
          for (const element of presentElements.keys()) {
            unmountPresentContainer(element);
          }
          openPresentElements.clear();
        }
        function mountPresentContainer(element) {
          if (presentElements.has(element)) return;
          if ((element.getAttribute(attr.present) || "").trim().toLowerCase() === "all") {
            element.setAttribute(attr.present, DEFAULT_PRESENT);
          }
          if (element.hasAttribute(attr.presentMotion)) {
            element.removeAttribute(attr.presentMotion);
          }
          const presentMotion = element.querySelector(`:scope>[${attr.presentMotion}]`);
          const tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
          const measuredHeight = !presentMotion && tokens.includes("height");
          const measuredWidth = !presentMotion && tokens.includes("width");
          if (presentMotion) element.classList.add(className.grid);
          else if (measuredHeight || measuredWidth) {
            AelluxJs2.diagnostics.info(
              AelluxJs2.diagnostics.INFO_PRESENT_MEASURED_LAYOUT,
              { extension: extensionName, element }
            );
          }
          const presentController = {
            presentMotion,
            measuredHeight,
            measuredWidth,
            measuredStyles: null,
            motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
            transition: null,
            autoUnpopTimeout: null,
            direction: null,
            classList: element.classList,
            triggers: /* @__PURE__ */ new Set(),
            setAriaExpanded: function(value) {
              element.setAttribute(ARIA_EXPANDED, value);
              this.triggers.forEach(updateTriggerAriaExpanded);
            },
            stop: function(options = {}) {
              const replacement = options.replacement === true;
              const transitionStart = options.transitionStart === true;
              const transition = this.transition;
              if (transition) {
                transition.replacement = replacement;
                if (transition.timeout !== null) {
                  clearTimeout(transition.timeout);
                  transition.timeout = null;
                }
                if (!transitionStart && transition.className) {
                  this.classList.remove(transition.className);
                }
                this.transition = null;
                transition.interrupt(
                  AelluxJs2.diagnostics.create(
                    AelluxJs2.diagnostics.WARN_INTERRUPTION,
                    { extensionName, replacement }
                  )
                );
              }
              if (this.autoUnpopTimeout !== null) {
                clearTimeout(this.autoUnpopTimeout);
                this.autoUnpopTimeout = null;
              }
              if (transitionStart) {
                this.classList.remove(className.unpopping);
              } else {
                this.classList.remove(
                  className.pop,
                  className.popping,
                  className.unpopping,
                  className.willChange
                );
              }
              if (!replacement) restoreMeasuredStyles(element, this);
            }
          };
          presentController.setAriaExpanded(
            element.hidden ? "false" : "true"
          );
          if (!element.hidden) {
            presentController.classList.add(className.pop);
            openPresentElements.add(element);
          }
          presentElements.set(element, presentController);
          for (const triggerElement of element.querySelectorAll(
            `[${attr.trigger}],[${attr.dismiss}],[${attr.target}]`
          )) {
            if (triggerTargets.get(triggerElement) === element) {
              presentController.triggers.add(triggerElement);
              updateTriggerAriaExpanded(triggerElement);
            }
          }
          const idTriggers = triggersByTargetId.get(element.id);
          if (idTriggers) {
            for (const triggerElement of idTriggers) {
              refreshTriggerTargets(triggerElement);
            }
          }
          autoUnpopSchedule(element, presentController);
        }
        function unmountPresentContainer(element) {
          if (!presentElements.has(element)) return;
          const controller = presentElements.get(element);
          controller.stop();
          element.classList.remove(className.grid);
          presentElements.delete(element);
          openPresentElements.delete(element);
          controller.triggers.forEach(updateTriggerAriaExpanded);
        }
        function mountTriggerElement(triggerElement) {
          if (triggerElementsSet.has(triggerElement)) return;
          triggerElementsSet.add(triggerElement);
          refreshTriggerTargets(triggerElement);
        }
        function unmountTriggerElement(triggerElement) {
          var _a;
          if (!triggerElementsSet.has(triggerElement)) return;
          const target = triggerTargets.get(triggerElement);
          if (target) {
            (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
            triggerTargets.delete(triggerElement);
          }
          unindexTriggerTarget(triggerElement);
          triggerElementsSet.delete(triggerElement);
        }
        function targetIdFor(value) {
          if (!value) return null;
          const id = value.charAt(0) === "#" ? value.slice(1) : value;
          return id && !/[\s#]/.test(id) ? id : null;
        }
        function targetById(value) {
          const id = targetIdFor(value);
          if (!id) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_EXTENSION_SELECTOR, {
              cause: new SyntaxError(),
              extension: extensionName,
              selector: value
            });
            return null;
          }
          return document.getElementById(id);
        }
        function unindexTriggerTarget(triggerElement) {
          const previous = indexedTriggerValues.get(triggerElement);
          const id = targetIdFor(previous);
          if (id) {
            const triggers = triggersByTargetId.get(id);
            triggers.delete(triggerElement);
            if (!triggers.size) triggersByTargetId.delete(id);
          }
          indexedTriggerValues.delete(triggerElement);
        }
        function indexTriggerTarget(triggerElement, value) {
          if (indexedTriggerValues.get(triggerElement) === value) return;
          unindexTriggerTarget(triggerElement);
          indexedTriggerValues.set(triggerElement, value);
          const id = targetIdFor(value);
          if (id) {
            let triggers = triggersByTargetId.get(id);
            if (!triggers) {
              triggers = /* @__PURE__ */ new Set();
              triggersByTargetId.set(id, triggers);
            }
            triggers.add(triggerElement);
          }
        }
        function refreshTriggerTargets(triggerElement) {
          var _a, _b, _c, _d;
          const previousTarget = triggerTargets.get(triggerElement);
          const targetSelector = triggerElement.getAttribute(attr.target);
          const dismiss = triggerElement.getAttribute(attr.dismiss);
          indexTriggerTarget(triggerElement, dismiss || targetSelector);
          const container = triggerElement.closest(`[${attr.present}]`);
          if (previousTarget) {
            (_a = presentElements.get(previousTarget)) == null ? void 0 : _a.triggers.delete(triggerElement);
          }
          let target = null;
          if (dismiss || targetSelector) {
            target = targetById(dismiss || targetSelector);
          } else if (container && container.id) {
            target = container;
          }
          if (!target || !target.id) {
            triggerTargets.delete(triggerElement);
            return;
          }
          triggerTargets.set(triggerElement, target);
          (_b = presentElements.get(target)) == null ? void 0 : _b.triggers.add(triggerElement);
          const targetIds = /* @__PURE__ */ new Set([target.id]);
          const initial = (_d = (_c = AelluxJs2.mountManager).initialAttribute) == null ? void 0 : _d.call(_c, triggerElement, ARIA_CONTROLS);
          if (initial) {
            initial.trim().split(/\s+/).forEach((x) => targetIds.add(x));
          }
          updateTriggerAriaExpanded(triggerElement);
          triggerElement.setAttribute(ARIA_CONTROLS, [...targetIds].join(" "));
        }
        function updateTriggerAriaExpanded(triggerElement) {
          const target = triggerTargets.get(triggerElement);
          if (!target) return;
          const expanded = presentElements.has(target) && target.getAttribute(ARIA_EXPANDED) === "true";
          triggerElement.setAttribute(ARIA_EXPANDED, String(expanded));
        }
        function pop(element) {
          return presentTransition(element, true, true);
        }
        function unpop(element) {
          return presentTransition(element, false);
        }
        function toggle(element, goto) {
          return presentTransition(element, goto);
        }
        function trigger(element, trigger2) {
          trigger2 = typeof trigger2 === "string" ? (trigger2 || "toggle").toLowerCase() : "toggle";
          const method = AelluxJs2.ext.present[trigger2];
          return method && typeof method === "function" ? method(element) : toggle(element);
        }
        function restoreMeasuredStyles(element, controller) {
          const saved = controller.measuredStyles;
          if (!saved) return;
          for (const [name, value, priority] of saved) {
            if (value) element.style.setProperty(name, value, priority);
            else element.style.removeProperty(name);
          }
          controller.measuredStyles = null;
        }
        async function prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation) {
          if (!controller.measuredHeight && !controller.measuredWidth) return null;
          if (!controller.measuredStyles) {
            controller.measuredStyles = ["max-height", "max-width"].map((name) => [
              name,
              element.style.getPropertyValue(name),
              element.style.getPropertyPriority(name)
            ]);
          }
          for (const [name, value, priority] of controller.measuredStyles) {
            if (value) element.style.setProperty(name, value, priority);
            else element.style.removeProperty(name);
          }
          let size = previousSize;
          if (gotoVisible || !size) {
            const computed = root2.getComputedStyle(element);
            const height = parseFloat(computed.height);
            const width = parseFloat(computed.width);
            size = {
              height: Number.isFinite(height) ? height : element.scrollHeight,
              width: Number.isFinite(width) ? width : element.scrollWidth
            };
          }
          const start = previousSize || (gotoVisible ? { height: 0, width: 0 } : size);
          if (controller.measuredHeight) {
            element.style.setProperty("max-height", `${Math.max(0, start.height)}px`, "important");
          }
          if (controller.measuredWidth) {
            element.style.setProperty("max-width", `${Math.max(0, start.width)}px`, "important");
          }
          if (!waitForPreparation)
            await AelluxJs2.waitLayout.read(() => element.getBoundingClientRect());
          return size;
        }
        async function presentTransition(element, gotoVisible, forceRepop = false) {
          const controller = presentElements.get(element);
          if (!controller) return;
          if (controller.direction === null)
            controller.direction = element.hidden ? UNPOP : POP;
          if (typeof gotoVisible === "undefined" || gotoVisible === null)
            gotoVisible = controller.direction === POP ? false : true;
          const newDirection = gotoVisible ? POP : UNPOP;
          if (element.hidden && !gotoVisible || newDirection === controller.direction && !forceRepop) {
            return;
          }
          let transition = null;
          try {
            const allowEvent = AelluxJs2.dispatchFrom(
              element,
              `${BEFORE}${newDirection}`,
              { bubbles: true, cancelable: true }
            );
            if (!allowEvent) {
              return;
            }
            if (forceRepop && (!element.hidden || controller.transition)) {
              controller.stop();
              element.hidden = true;
              openPresentElements.delete(element);
              controller.setAriaExpanded("false");
              element.getBoundingClientRect();
            }
            const reusePreparation = !forceRepop && controller.motionEnabled && controller.transition !== null && controller.classList.contains(className.willChange);
            const waitForPreparation = controller.motionEnabled && !reusePreparation;
            let previousSize = null;
            if (reusePreparation && (controller.measuredHeight || controller.measuredWidth)) {
              const computed = root2.getComputedStyle(element);
              previousSize = {
                height: parseFloat(computed.maxHeight),
                width: parseFloat(computed.maxWidth)
              };
            }
            if (!forceRepop) {
              controller.stop({ replacement: reusePreparation, transitionStart: true });
            }
            controller.direction = newDirection;
            const interrupted = new Promise((_, interruptTransition) => {
              transition = {
                className: null,
                timeout: null,
                interrupt: interruptTransition,
                replacement: false
              };
              controller.transition = transition;
            });
            interrupted.catch(() => {
            });
            element.hidden = false;
            openPresentElements.add(element);
            let size = null;
            if (controller.measuredHeight || controller.measuredWidth)
              size = await prepareMeasuredSize(
                element,
                controller,
                gotoVisible,
                previousSize,
                waitForPreparation
              );
            if (controller.transition !== transition) return;
            if (controller.motionEnabled) {
              controller.classList.add(className.willChange);
            }
            if (waitForPreparation) {
              const prepared = new Promise((resolve) => {
                transition.timeout = setTimeout(() => {
                  transition.timeout = null;
                  resolve();
                }, TRANSITION_PREPARE_TIME);
              });
              await Promise.race([prepared, interrupted]);
            }
            transition.className = className[`${newDirection}${PING}`.toLowerCase()];
            const duration = root2.getComputedStyle(element).getPropertyValue(`--ae-${newDirection}-duration`.toLowerCase()).trim();
            const timeMs = getString2Time(duration);
            const activateTransition = () => {
              if (controller.transition !== transition) return;
              element.style.setProperty(
                `--ae-${newDirection}-low-steps`.toLowerCase(),
                Math.max(1, parseInt(timeMs / 62.5))
              );
              controller.classList.remove(
                className.pop,
                className.popping,
                className.unpopping
              );
              controller.classList.add(transition.className);
              if (size) {
                if (controller.measuredHeight) {
                  element.style.setProperty("max-height", `${gotoVisible ? size.height : 0}px`, "important");
                }
                if (controller.measuredWidth) {
                  element.style.setProperty("max-width", `${gotoVisible ? size.width : 0}px`, "important");
                }
              }
            };
            if (size && !waitForPreparation)
              await AelluxJs2.waitLayout.update(activateTransition);
            else activateTransition();
            if (controller.transition !== transition) return;
            const completed = new Promise((completeTransition) => {
              transition.timeout = setTimeout(
                finishTransition,
                timeMs,
                element,
                controller,
                transition,
                gotoVisible,
                completeTransition
              );
            });
            AelluxJs2.dispatchFrom(element, `${newDirection}${PING}`, { bubbles: true });
            await Promise.race([completed, interrupted]);
            if (gotoVisible && !element.hidden) {
              autoUnpopSchedule(element, controller);
              controller.classList.add(className.pop);
              controller.setAriaExpanded("true");
              AelluxJs2.dispatchFrom(element, POP, { bubbles: true });
            }
            if (!gotoVisible && element.hidden) {
              controller.setAriaExpanded("false");
              AelluxJs2.dispatchFrom(element, UNPOP, { bubbles: true });
            }
            AelluxJs2.dispatchFrom(element, "Layout", { bubbles: true });
          } catch (error) {
            const ownsTransition = transition && controller.transition === transition;
            if (ownsTransition && transition.timeout !== null) {
              clearTimeout(transition.timeout);
              transition.timeout = null;
            }
            if (ownsTransition && transition.className) {
              controller.classList.remove(transition.className);
            }
            if (ownsTransition) restoreMeasuredStyles(element, controller);
            switch (error && error.code) {
              case AelluxJs2.diagnostics.WARN_INTERRUPTION.code:
                AelluxJs2.diagnostics.warn(
                  AelluxJs2.diagnostics.WARN_INTERRUPTION,
                  {
                    cause: error,
                    extension: extensionName,
                    element,
                    replacement: transition && transition.replacement === true
                  }
                );
                break;
              default:
                AelluxJs2.diagnostics.error(
                  AelluxJs2.diagnostics.ERROR_EXTENSION_TRANSITION,
                  { cause: error, extension: extensionName, element }
                );
                break;
            }
          } finally {
            if (transition && controller.transition === transition) {
              controller.transition = null;
              controller.classList.remove(className.willChange);
            }
          }
        }
        function finishTransition(element, controller, transition, gotoVisible, completeTransition) {
          controller.classList.remove(transition.className);
          restoreMeasuredStyles(element, controller);
          const focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
          element.hidden = gotoVisible ? false : true;
          if (element.hidden) openPresentElements.delete(element);
          else openPresentElements.add(element);
          if (focused) {
            if (document.activeElement === focused) focused.blur();
            if (document.activeElement !== focused) AelluxJs2.dispatch("UnpopFocusLost", {
              detail: { element, focused }
            });
          }
          transition.timeout = null;
          completeTransition();
        }
        function autoUnpopSchedule(element, controller) {
          const autoUnpopValue = element.getAttribute(attr.autoUnpop);
          if (!element.hidden && autoUnpopValue) {
            const autoTime = getString2Time(autoUnpopValue);
            controller.autoUnpopTimeout = setTimeout(
              autoUnpop,
              autoTime,
              element,
              controller
            );
          }
        }
        function autoUnpop(element, controller) {
          controller.autoUnpopTimeout = null;
          unpop(element);
        }
        function outsideClickAutoUnpop(currentExceptions) {
          for (const pContainer of openPresentElements) {
            if (pContainer.hidden === true || pContainer.getAttribute(attr.unpopOnOutside) === "false" || currentExceptions.some((e) => pContainer.contains(e))) {
              continue;
            }
            unpop(pContainer);
          }
        }
        function refreshChangedTrigger(button) {
          if (!triggerElementsSet.has(button)) return;
          const value = button.getAttribute(attr.dismiss) || button.getAttribute(attr.target);
          if (value !== indexedTriggerValues.get(button)) refreshTriggerTargets(button);
        }
        function OnClick(event) {
          if (!event.target) return;
          const container = event.target.closest(`[${attr.present}]`);
          const exceptions = [event.target];
          var button;
          button = event.target.closest(`[${attr.trigger}]`);
          if (button) {
            refreshChangedTrigger(button);
            const triggerAttr = button.getAttribute(attr.trigger);
            const targetSelector = button.getAttribute(attr.target);
            if (targetSelector) {
              const target = targetById(targetSelector);
              if (target) {
                exceptions.push(target);
                trigger(target, triggerAttr);
              }
            } else if (container) {
              exceptions.push(container);
              trigger(container, triggerAttr);
            } else {
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
                { extension: extensionName, element: button, action: "trigger" }
              );
            }
          }
          button = event.target.closest(`[${attr.dismiss}]`);
          if (button) {
            refreshChangedTrigger(button);
            const dismiss = button.getAttribute(attr.dismiss);
            const targetSelector = button.getAttribute(attr.target);
            if (dismiss || targetSelector) {
              const target = targetById(dismiss || targetSelector);
              if (target) {
                exceptions.push(target);
                unpop(target);
              }
            } else if (container) {
              exceptions.push(container);
              unpop(container);
            } else {
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
                { extension: extensionName, element: button, action: "dismiss" }
              );
            }
          }
          outsideClickAutoUnpop(exceptions);
        }
        function getString2Time(string) {
          return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
        }
        function getMillisecondsMulti(value) {
          return !value.endsWith(MILLISECOND) && value.endsWith(SECOND) ? 1e3 : 1;
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
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

  // src/internal/build-layout-scheduler.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildLayoutScheduler() {
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
        task.resolve(task.parameters ? task.callback.apply(void 0, task.parameters) : task.callback());
      } catch (error) {
        task.reject(error);
      }
    }
    function queueTask(queue, callback, parameters) {
      var promise = new Promise(function(resolve, reject) {
        queue.push({
          callback,
          parameters,
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
      read: (callback, parameters) => queueTask(readQueue, callback, parameters),
      update: (callback, parameters) => queueTask(updateQueue, callback, parameters),
      clear
    });
  }

  // src/internal/create-mount-helper.js
  init_utils_name_case();

  // src/internal/create-controller-helper.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createControllerHelper(root2, element) {
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const mounts = /* @__PURE__ */ new Map();
    const controller = {
      spawn,
      despawn,
      hasMounts,
      on(event, handler, options) {
        element.addEventListener(root2.AelluxJs.eventName(event), handler, options);
      },
      off(event, handler, options) {
        element.removeEventListener(root2.AelluxJs.eventName(event), handler, options);
      },
      dispatch(event, options) {
        return root2.AelluxJs.dispatchFrom(element, event, options);
      },
      mount(extensionNames = null) {
        return root2.AelluxJs.mountManager.mount(element, extensionNames);
      },
      unmount(extensionNames = null) {
        return root2.AelluxJs.mountManager.unmount(element, extensionNames);
      },
      update(extensionNames = null) {
        return root2.AelluxJs.mountManager.update(element, extensionNames);
      }
    };
    function spawn(extensionName, mountId, methodNames, updatable = false) {
      const key = toCamelCase2(fromCamelCase2(extensionName));
      const extension = root2.AelluxJs.ext[key];
      const methods = Array.isArray(methodNames) ? methodNames : [];
      for (const name of methods) {
        if (name === "update" && updatable) continue;
        if (typeof name === "string" && extension && typeof extension[name] === "function") continue;
        const diagnostics = root2.AelluxJs.diagnostics;
        diagnostics.warn(diagnostics.WARN_CONTROLLER_METHOD_MISSING, {
          extension: key,
          method: name,
          mountId,
          element
        });
      }
      mounts.set(mountId, {
        extension: key,
        methods,
        updatable
      });
      refresh(key);
      return controller[key] || null;
    }
    function despawn(mountId) {
      const registration = mounts.get(mountId);
      if (!registration) return false;
      mounts.delete(mountId);
      refresh(registration.extension);
      return true;
    }
    function hasMounts() {
      return mounts.size > 0;
    }
    function refresh(key) {
      const extension = root2.AelluxJs.ext[key];
      const registrations = Array.from(mounts.values()).filter((registration) => registration.extension === key);
      const names = /* @__PURE__ */ new Set();
      for (const registration of registrations) {
        for (const name of registration.methods) {
          if (name !== "update" && typeof name === "string" && extension && typeof extension[name] === "function") {
            names.add(name);
          }
        }
      }
      if (registrations.length === 0) {
        const namespace2 = controller[key];
        if (namespace2) {
          for (const name of Object.keys(namespace2)) delete namespace2[name];
        }
        delete controller[key];
        return;
      }
      const namespace = controller[key] || /* @__PURE__ */ Object.create(null);
      for (const name of Object.keys(namespace)) {
        if (name !== "update" && !names.has(name)) delete namespace[name];
      }
      for (const name of names) {
        namespace[name] = (...args) => {
          const current = root2.AelluxJs.ext[key];
          return current[name](element, ...args);
        };
      }
      namespace.update = registrations.some((registration) => registration.updatable) ? () => root2.AelluxJs.mountManager.update(element, key) : null;
      controller[key] = namespace;
    }
    return controller;
  }

  // src/internal/resolve-element-or-id.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function resolveElementOrId(root2, elementOrId, options = {}) {
    const fallback = options.defaultElement;
    if ((elementOrId === void 0 || elementOrId === null) && fallback) {
      return fallback;
    }
    const requested = elementOrId;
    if (typeof elementOrId === "string") {
      const id = elementOrId.trim().replace(/^#/, "");
      elementOrId = id ? root2.document.getElementById(id) : null;
    }
    const allowedNodeTypes = options.allowedNodeTypes || [root2.Node.ELEMENT_NODE];
    if (elementOrId && allowedNodeTypes.indexOf(elementOrId.nodeType) !== -1) {
      return elementOrId;
    }
    const diagnostics = root2.AelluxJs.diagnostics;
    diagnostics.warn(diagnostics.WARN_INVALID_ELEMENT_OR_ID, {
      elementOrId: requested,
      method: options.method
    });
    return null;
  }

  // src/internal/create-mount-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createMountHelper(root2, mountMaps, mountedElements, elementControllers) {
    const { toCapitalized: toCapitalized2, toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const initialAttributeValues = /* @__PURE__ */ new WeakMap();
    const pendingMounts = /* @__PURE__ */ new WeakMap();
    const pendingUnmounts = /* @__PURE__ */ new WeakMap();
    const classPrefix = root2.AelluxJs.className("");
    return { mount, unmount, unmountDetached, update, initialAttribute };
    function initialAttribute(element, name) {
      var _a, _b;
      return (_b = (_a = initialAttributeValues.get(element)) == null ? void 0 : _a.initial.get(name)) != null ? _b : null;
    }
    async function update(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, "update");
      if (!rootElement) return false;
      await AelluxJsMounted(rootElement, "update", extensionNames);
      return true;
    }
    async function unmount(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, "unmount");
      if (!rootElement) return false;
      await AelluxJsMounted(rootElement, "unmount", extensionNames);
      return true;
    }
    async function unmountDetached() {
      let hasDetachedElement = false;
      for (const element of mountedElements.keys()) {
        if (!element.isConnected) {
          hasDetachedElement = true;
          break;
        }
      }
      if (!hasDetachedElement) return false;
      await AelluxJsMounted(root2.document, "unmount", null, true);
      return true;
    }
    async function mount(elementOrId, extensionNames = null) {
      const AelluxJs2 = root2.AelluxJs;
      const newlyMounted = /* @__PURE__ */ new Set();
      const rootElement = resolveMountElement(elementOrId, "mount");
      if (!rootElement) return [];
      const waitMountedAttr = AelluxJs2.attr("wait-mounted");
      const allWaiters = findElements(rootElement, `[${waitMountedAttr}]`);
      allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "true"));
      try {
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
        for (const [key, options] of Object.entries(root2.AelluxJs.registry.ext)) {
          if (options.loadWhen) continue;
          waitExtensions.push(AelluxJs2.wait(key));
        }
        await Promise.all(waitExtensions);
        await AelluxJsMount(rootElement, extensionNames, newlyMounted);
      } catch (error) {
        AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_MOUNT, {
          cause: error,
          root: rootElement,
          extensions: extensionNames
        });
      } finally {
        allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "false"));
      }
      return Array.from(newlyMounted);
    }
    async function AelluxJsMount(rootElement, extensionNames, newlyMounted) {
      const AelluxJs2 = root2.AelluxJs;
      if (typeof extensionNames === "string")
        extensionNames = [extensionNames];
      var filter;
      if (!extensionNames) {
        const mounterSelectors = Object.values(AelluxJs2.registry.extMounters);
        const lazySelectors = Object.values(AelluxJs2.registry.lazyExtSelectors);
        filter = [...mounterSelectors, ...lazySelectors];
      } else {
        filter = [];
        extensionNames = extensionNames.map((_) => fromCamelCase2(_));
        for (const [key, selectorString] of Object.entries(AelluxJs2.registry.extMounters))
          if (extensionNames.indexOf(fromCamelCase2(key)) !== -1)
            filter.push(selectorString);
        for (const [key, selectorString] of Object.entries(AelluxJs2.registry.lazyExtSelectors))
          if (extensionNames.indexOf(fromCamelCase2(key)) !== -1)
            filter.push(selectorString);
      }
      if (filter.length === 0) {
        AelluxJs2.dispatch("Mount", {
          detail: { root: rootElement, extensions: extensionNames, elements: [] }
        });
        return;
      }
      const candidatesByExtension = /* @__PURE__ */ new Map();
      const allElements = findElements(rootElement, filter.join(","));
      for (const element of allElements) {
        let localExtensionNames;
        if (extensionNames) {
          localExtensionNames = extensionNames;
        } else {
          localExtensionNames = /* @__PURE__ */ new Set();
          for (const [key, selector] of Object.entries(AelluxJs2.registry.lazyExtSelectors))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionNames.add(fromCamelCase2(key));
          for (const [key, selector] of Object.entries(AelluxJs2.registry.extMounters))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionNames.add(fromCamelCase2(key));
        }
        for (const extensionName of localExtensionNames) {
          let candidates = candidatesByExtension.get(extensionName);
          if (!candidates) {
            candidates = /* @__PURE__ */ new Set();
            candidatesByExtension.set(extensionName, candidates);
          }
          candidates.add(element);
        }
      }
      const extensions = Array.from(candidatesByExtension);
      const loaded = await Promise.all(
        extensions.map(([extensionName]) => AelluxJs2.wait(extensionName).then(
          (value) => ({ value }),
          (error) => ({ error })
        ))
      );
      for (const result of loaded) {
        if (Object.prototype.hasOwnProperty.call(result, "error")) throw result.error;
      }
      const registrations = [];
      for (let index = 0; index < extensions.length; index++) {
        if (!loaded[index].value) continue;
        const [extensionName, candidates] = extensions[index];
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        if (!mounter) continue;
        const searchRoots = [];
        for (const candidate of candidates) {
          let ancestor = candidate.parentNode;
          while (ancestor && !candidates.has(ancestor)) ancestor = ancestor.parentNode;
          if (!ancestor) searchRoots.push(candidate);
        }
        for (const [selector, controller] of mounter) {
          registrations.push({
            extensionName,
            selector,
            controller,
            searchRoots,
            priority: controller.priority,
            order: registrations.length
          });
        }
      }
      registrations.sort((left, right) => left.priority - right.priority || left.order - right.order);
      const elementsAffected = /* @__PURE__ */ new Set();
      for (const { extensionName, selector, controller, searchRoots } of registrations) {
        try {
          if (!controller.mount) {
            continue;
          }
          for (const searchRoot of searchRoots) {
            const mountableElements = findElements(searchRoot, selector);
            for (const mountable of mountableElements) {
              const mountId = `${extensionName}@${selector}`;
              if (isMounted(mountable, mountId)) {
                const pendingMount = getPendingMount(mountable, mountId);
                if (pendingMount) await pendingMount;
                continue;
              }
              if (!isMounted(mountable)) {
                for (const name of Array.from(mountable.classList)) {
                  if (name.startsWith(classPrefix)) mountable.classList.remove(name);
                }
              }
              rememberInitialAttributes(mountable);
              setMounted(mountable, mountId);
              const finishPendingMount = beginPendingMount(mountable, mountId);
              try {
                await controller.mount(mountable);
                let elementController = elementControllers.get(mountable);
                if (!elementController) {
                  elementController = createControllerHelper(root2, mountable);
                  elementControllers.set(mountable, elementController);
                }
                elementController.spawn(
                  extensionName,
                  mountId,
                  controller.controllers,
                  typeof controller.update === "function"
                );
                elementsAffected.add(mountable);
                newlyMounted.add(mountable);
              } catch (error) {
                setMounted(mountable, mountId, false);
                const elementController = elementControllers.get(mountable);
                if (elementController) {
                  elementController.despawn(mountId);
                  if (!elementController.hasMounts()) elementControllers.delete(mountable);
                }
                restoreInitialAttributes(mountable);
                AelluxJs2.diagnostics.error(
                  AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
                  {
                    cause: error,
                    extension: extensionName,
                    method: "mount",
                    selector,
                    element: mountable
                  }
                );
              } finally {
                finishPendingMount();
              }
            }
          }
        } catch (error) {
          AelluxJs2.diagnostics.error(
            AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
            {
              cause: error,
              extension: extensionName,
              method: "mount",
              selector
            }
          );
        }
      }
      for (const affected of elementsAffected) {
        if (!affected.isConnected || !isMounted(affected)) {
          if (!affected.isConnected) await unmountElementRegistrations(affected);
          newlyMounted.delete(affected);
          continue;
        }
        affected.classList.toggle(AelluxJs2.className("mounted"), true);
      }
      AelluxJs2.dispatch("Mount", {
        detail: {
          root: rootElement,
          extensions: extensionNames,
          elements: Array.from(newlyMounted)
        }
      });
    }
    async function AelluxJsMounted(rootElement, method, extensionNames = null, detachedOnly = false) {
      const AelluxJs2 = root2.AelluxJs;
      const selectedNames = extensionNames === null ? null : new Set((typeof extensionNames === "string" ? [extensionNames] : extensionNames).map((name) => fromCamelCase2(name)));
      const affected = /* @__PURE__ */ new Set();
      for (const [element, mountIds] of Array.from(mountedElements)) {
        const inRoot = element === rootElement || rootElement.contains(element);
        const detachedInGlobalUnmount = method === "unmount" && rootElement === root2.document && !element.isConnected;
        if (detachedOnly ? element.isConnected || hasPendingMounts(element) : !inRoot && !detachedInGlobalUnmount) continue;
        for (const mountId of Array.from(mountIds)) {
          const separator = mountId.indexOf("@");
          const extensionName = mountId.slice(0, separator);
          const selector = mountId.slice(separator + 1);
          if (selectedNames && !selectedNames.has(extensionName)) continue;
          const extensionKey = toCamelCase2(extensionName);
          const mounter = mountMaps.get(extensionKey);
          const controller = mounter && mounter.get(selector);
          if (method === "unmount") {
            if (await unmountRegistration(element, mountId, controller, extensionName, selector))
              affected.add(element);
            continue;
          }
          try {
            if (controller && controller[method]) {
              affected.add(element);
              await controller[method](element);
            }
          } catch (error) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT, {
              cause: error,
              extension: extensionName,
              method,
              selector
            });
          }
        }
      }
      AelluxJs2.dispatch(toCapitalized2(method), {
        detail: {
          root: rootElement,
          extensions: selectedNames ? Array.from(selectedNames) : null,
          elements: Array.from(affected)
        }
      });
    }
    async function unmountRegistration(element, mountId, controller, extensionName, selector) {
      const pendingMount = getPendingMount(element, mountId);
      if (pendingMount) await pendingMount;
      if (!isMounted(element, mountId)) return false;
      let tasks = pendingUnmounts.get(element);
      if (!tasks) {
        tasks = /* @__PURE__ */ new Map();
        pendingUnmounts.set(element, tasks);
      }
      if (tasks.has(mountId)) {
        await tasks.get(mountId);
        return false;
      }
      let finish;
      tasks.set(mountId, new Promise((resolve) => {
        finish = resolve;
      }));
      const AelluxJs2 = root2.AelluxJs;
      const diagnostics = AelluxJs2.diagnostics;
      try {
        try {
          if (controller && controller.unmount) await controller.unmount(element);
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
            cause,
            extension: extensionName,
            method: "unmount",
            selector
          });
        }
        try {
          setMounted(element, mountId, false);
          const elementController = elementControllers.get(element);
          if (elementController) {
            elementController.despawn(mountId);
            if (!elementController.hasMounts()) elementControllers.delete(element);
          }
          element.classList.toggle(AelluxJs2.className("mounted"), isMounted(element));
          restoreInitialAttributes(element);
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
            cause,
            extension: extensionName,
            method: "unmount",
            selector
          });
        }
      } finally {
        tasks.delete(mountId);
        if (!tasks.size) pendingUnmounts.delete(element);
        finish();
      }
      return !isMounted(element, mountId);
    }
    async function unmountElementRegistrations(element) {
      const mountIds = Array.from(mountedElements.get(element) || []);
      for (const mountId of mountIds) {
        const separator = mountId.indexOf("@");
        const extensionName = mountId.slice(0, separator);
        const selector = mountId.slice(separator + 1);
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        const controller = mounter && mounter.get(selector);
        await unmountRegistration(element, mountId, controller, extensionName, selector);
      }
    }
    function beginPendingMount(element, mountId) {
      let mounts = pendingMounts.get(element);
      if (!mounts) {
        mounts = /* @__PURE__ */ new Map();
        pendingMounts.set(element, mounts);
      }
      let finish;
      mounts.set(mountId, new Promise((resolve) => {
        finish = resolve;
      }));
      return function() {
        mounts.delete(mountId);
        if (!mounts.size) pendingMounts.delete(element);
        finish();
      };
    }
    function getPendingMount(element, mountId) {
      var _a;
      return ((_a = pendingMounts.get(element)) == null ? void 0 : _a.get(mountId)) || null;
    }
    function hasPendingMounts(element) {
      var _a;
      return Boolean((_a = pendingMounts.get(element)) == null ? void 0 : _a.size);
    }
    function resolveMountElement(elementOrId, method) {
      return resolveElementOrId(root2, elementOrId, {
        defaultElement: root2.document,
        allowedNodeTypes: [
          root2.Node.ELEMENT_NODE,
          root2.Node.DOCUMENT_NODE,
          root2.Node.DOCUMENT_FRAGMENT_NODE
        ],
        method
      });
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
    function rememberInitialAttributes(element) {
      const record = initialAttributeValues.get(element);
      if (record) {
        record.users++;
        return;
      }
      const initial = /* @__PURE__ */ new Map();
      for (const attribute of element.attributes) {
        if (isRestoredAttribute(attribute.name))
          initial.set(attribute.name, attribute.value);
      }
      initialAttributeValues.set(element, { initial, users: 1 });
    }
    function restoreInitialAttributes(element) {
      const record = initialAttributeValues.get(element);
      if (!record || --record.users) return;
      for (let index = element.attributes.length - 1; index >= 0; index--) {
        const name = element.attributes[index].name;
        if (isRestoredAttribute(name) && !record.initial.has(name))
          element.removeAttribute(name);
      }
      for (const [name, value] of record.initial) {
        if (element.getAttribute(name) !== value) element.setAttribute(name, value);
      }
      initialAttributeValues.delete(element);
    }
    function isRestoredAttribute(name) {
      return name === "hidden" || name.startsWith("data-ae-") || name.startsWith("aria-");
    }
  }

  // src/internal/build-mount-map-manager.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildMountMapManager(root2) {
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const mountedElements = /* @__PURE__ */ new Map();
    const elementControllers = /* @__PURE__ */ new WeakMap();
    const maps = /* @__PURE__ */ new Map();
    let unmountQueue = Promise.resolve();
    let unmountScheduled = false;
    let rescanAfterUnmount = false;
    const helper = createMountHelper(
      root2,
      maps,
      mountedElements,
      elementControllers
    );
    const manager = {
      add,
      remove,
      controller,
      mount: helper.mount,
      unmount: helper.unmount,
      update: helper.update,
      initialAttribute: helper.initialAttribute,
      destroy
    };
    let observer = null;
    if (typeof root2.MutationObserver === "function") {
      observer = new root2.MutationObserver((records) => {
        if (!hasRemovedNodes(records) || !hasDetachedMountedElement()) return;
        scheduleDetachedUnmount();
      });
      observer.observe(root2.document, { childList: true, subtree: true });
    }
    function destroy() {
      if (!observer) return false;
      observer.disconnect();
      observer = null;
      return true;
    }
    return manager;
    function scheduleUnmount(operation) {
      const task = unmountQueue.then(operation);
      unmountQueue = task.catch(() => {
      });
      return task;
    }
    function hasRemovedNodes(records) {
      for (const record of records) {
        if (record.removedNodes.length) return true;
      }
      return false;
    }
    function hasDetachedMountedElement() {
      for (const element of mountedElements.keys()) {
        if (!element.isConnected) return true;
      }
      return false;
    }
    function scheduleDetachedUnmount() {
      if (unmountScheduled) {
        rescanAfterUnmount = true;
        return;
      }
      unmountScheduled = true;
      scheduleUnmount(() => helper.unmountDetached()).then(
        finishDetachedUnmount,
        (error) => {
          const diagnostics = root2.AelluxJs.diagnostics;
          diagnostics.error(diagnostics.ERROR_EXTENSION_UNMOUNT, { cause: error });
          finishDetachedUnmount();
        }
      );
    }
    function finishDetachedUnmount() {
      unmountScheduled = false;
      if (!rescanAfterUnmount || !observer) return;
      rescanAfterUnmount = false;
      if (hasDetachedMountedElement()) scheduleDetachedUnmount();
    }
    function controller(elementOrId) {
      const diagnostics = root2.AelluxJs.diagnostics;
      elementOrId = resolveElementOrId(root2, elementOrId, { method: "controller" });
      if (!elementOrId) return null;
      const found = elementControllers.get(elementOrId);
      if (found) return found;
      diagnostics.error(diagnostics.ERROR_CONTROLLER_NOT_FOUND, { element: elementOrId });
      return null;
    }
    function keyFor(extensionName) {
      return toCamelCase2(fromCamelCase2(extensionName));
    }
    function add(options) {
      const diagnostics = root2.AelluxJs.diagnostics;
      function reject(argument, cause) {
        diagnostics.error(diagnostics.ERROR_MOUNT_REGISTRATION, {
          extension: options && options.extensionName,
          selector: options && options.selector,
          argument,
          cause
        });
        return false;
      }
      if (!options || typeof options !== "object" || Array.isArray(options))
        return reject("options");
      const { extensionName, selector, mount, unmount, update, controllers } = options;
      const priority = options.priority === void 0 ? 0 : options.priority;
      if (typeof extensionName !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$|^[a-z][a-zA-Z0-9]*$/.test(extensionName))
        return reject("extensionName");
      const key = keyFor(extensionName);
      if (key in Object.prototype || key === "prototype")
        return reject("extensionName");
      if (!Object.prototype.hasOwnProperty.call(root2.AelluxJs.registry.ext, key))
        return reject("extensionName");
      if (typeof selector !== "string" || !selector.trim())
        return reject("selector");
      try {
        root2.document.querySelector(selector);
      } catch (cause) {
        return reject("selector", cause);
      }
      if (typeof mount !== "function") return reject("mount");
      if (typeof priority !== "number" || !isFinite(priority)) return reject("priority");
      if (unmount !== void 0 && typeof unmount !== "function") return reject("unmount");
      if (update !== void 0 && typeof update !== "function") return reject("update");
      if (controllers !== void 0 && (!Array.isArray(controllers) || controllers.some((name) => typeof name !== "string" || !name.trim())))
        return reject("controllers");
      const allowed = ["extensionName", "selector", "mount", "unmount", "update", "controllers", "priority"];
      const unknown = Object.keys(options).find((name) => !allowed.includes(name));
      if (unknown) return reject(unknown);
      let map = maps.get(key);
      if (!map) {
        map = /* @__PURE__ */ new Map();
        maps.set(key, map);
      }
      if (map.has(selector)) return reject("selector");
      map.set(selector, { mount, unmount, update, controllers, priority });
      root2.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
      return manager;
    }
    function remove({ extensionName, selector } = {}) {
      if (typeof extensionName !== "string" || !extensionName) return false;
      const key = keyFor(extensionName);
      const map = maps.get(key);
      if (!map) return false;
      if (hasMountedRegistration(extensionName, selector)) {
        const diagnostics = root2.AelluxJs.diagnostics;
        diagnostics.error(diagnostics.ERROR_MOUNT_MAP_IN_USE, {
          extension: fromCamelCase2(extensionName),
          selector
        });
        return false;
      }
      const removed = selector === void 0 ? true : map.delete(selector);
      if (selector === void 0 || map.size === 0) {
        maps.delete(key);
        delete root2.AelluxJs.registry.extMounters[key];
      } else if (removed) {
        root2.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
      }
      return removed;
    }
    function hasMountedRegistration(extensionName, selector) {
      const prefix = `${fromCamelCase2(extensionName)}@`;
      const mountId = selector === void 0 ? null : `${prefix}${selector}`;
      for (const registrations of mountedElements.values()) {
        if (mountId) {
          if (registrations.has(mountId)) return true;
          continue;
        }
        for (const id of registrations) {
          if (id.startsWith(prefix)) return true;
        }
      }
      return false;
    }
  }

  // src/aellux.orchestrator.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root2) {
    "use strict";
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const extensionPromises = {};
    const mountManager = buildMountMapManager(root2);
    const layoutScheduler = buildLayoutScheduler();
    root2.AelluxJs = Object.assign(
      root2.AelluxJs,
      {
        async startAelluxJs() {
          if (root2.AelluxJs.bundledExtensions) {
            Object.keys(root2.AelluxJs.bundledExtensions).forEach((key) => {
              if (!(key in AelluxJs.registry.ext)) AelluxJs.ext(key);
            });
          }
          await new Promise((resolve) => {
            const startMountCallback = function() {
              AelluxJs.mount().then(function() {
                document.removeEventListener(
                  "DOMContentLoaded",
                  startMountCallback
                );
                resolve();
              });
            };
            if (document.readyState === "loading")
              document.addEventListener(
                "DOMContentLoaded",
                startMountCallback,
                { once: true }
              );
            else
              startMountCallback();
          });
          AelluxJs.dispatch("Ready");
          return true;
        },
        async mount(elementOrId, extensionNames = null) {
          return mountManager.mount(elementOrId, extensionNames);
        },
        async unmount(elementOrId, extensionNames = null) {
          return mountManager.unmount(elementOrId, extensionNames);
        },
        async destroy() {
          AelluxJs.waitLayout.clear();
          await AelluxJs.destroyExtensions();
          mountManager.destroy();
        },
        async destroyExtensions(extensionNames) {
          if (typeof extensionNames === "string")
            extensionNames = [extensionNames];
          if (!extensionNames)
            extensionNames = Object.keys(AelluxJs.registry.ext);
          extensionNames = extensionNames.map((_) => fromCamelCase2(_));
          try {
            await AelluxJs.unmount(document, extensionNames);
          } catch (error) {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_UNMOUNT,
              { cause: error, extensions: extensionNames }
            );
          }
          for (const extensionName of extensionNames) {
            const key = toCamelCase2(extensionName);
            let extension;
            try {
              if (!extensionPromises[key]) continue;
              extension = await extensionPromises[key];
              if (extension && extension.destroy) {
                await extension.destroy();
              }
            } catch (error) {
              AelluxJs.diagnostics.error(
                AelluxJs.diagnostics.ERROR_EXTENSION_DESTROY,
                { cause: error, extension: extensionName }
              );
            } finally {
              delete AelluxJs.ext[key];
              delete extensionPromises[key];
              delete AelluxJs.registry.ext[key];
              mountManager.remove({ extensionName });
              delete AelluxJs.registry.lazyExtSelectors[key];
              removeExtensionAssets(extensionName);
              if (extension) extension.initialized = false;
            }
          }
        },
        dispatchFrom(from, event, options) {
          options = options || {};
          if (!("bubbles" in options)) {
            options.bubbles = true;
          }
          if (!("cancelable" in options)) {
            options.cancelable = false;
          }
          return from.dispatchEvent(
            new CustomEvent(
              AelluxJs.eventName(event),
              options
            )
          );
        },
        wait(extensionName) {
          return getExtension(extensionName);
        },
        request: defaultRequest,
        waitLayout: layoutScheduler,
        mountManager
      }
    );
    root2[root2.AelluxJs.shortJSName] = root2.AelluxJs;
    function getExtension(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      if (extensionPromises[key])
        return extensionPromises[key];
      const data = AelluxJs.registry.ext[key];
      if (data && !hasCompatibleBuild(data)) {
        AelluxJs.diagnostics.error(
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
          extensionPromises[key] = Promise.resolve().then(() => extensionInitialize(extensionName)).catch((error) => {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
              { cause: error, extension: extensionName }
            );
            delete extensionPromises[key];
            return null;
          });
          return extensionPromises[key];
        }
        extensionPromises[key] = Promise.resolve(AelluxJs.ext[key]);
        return extensionPromises[key];
      }
      if (!(key in AelluxJs.registry.ext)) {
        return Promise.reject(AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_NOT_REGISTERED,
          { extension: extensionName }
        ));
      }
      const bundledLoader = AelluxJs.bundledExtensions ? AelluxJs.bundledExtensions[key] : null;
      extensionPromises[key] = appendExtensionAssets(extensionName, bundledLoader).then(() => extensionInitialize(extensionName)).catch((error) => {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
          { cause: error, extension: extensionName }
        );
        delete extensionPromises[key];
        return null;
      });
      return extensionPromises[key];
    }
    async function extensionInitialize(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const options = AelluxJs.options.extensions[key] || {};
      await AelluxJs.ext[key].init(options);
      AelluxJs.ext[key].initialized = true;
      delete AelluxJs.registry.lazyExtSelectors[key];
      return AelluxJs.ext[key];
    }
    async function appendExtensionAssets(extensionName, bundledLoader = null) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const data = AelluxJs.registry.ext[key];
      const url = data.url.replace(/^\.\//, AelluxJs.aelluxBasePath);
      const useLegacyBuild = AelluxJs.diagnostics.legacy || data.builds.indexOf("modern") === -1;
      const scriptURL = useLegacyBuild ? toLegacyScriptURL(url) : url;
      const minifiedScript = /\.min\.js(?=[?#]|$)/.test(scriptURL);
      const scriptVariant = useLegacyBuild ? minifiedScript ? "legacyMin" : "legacy" : minifiedScript ? "modernMin" : "modern";
      const loadPromises = [];
      if (bundledLoader) {
        loadPromises.push(Promise.resolve().then(() => bundledLoader()));
      } else {
        loadPromises.push(new Promise(
          (resolve, reject) => {
            const attr = AelluxJs.attr("ext");
            const script = document.createElement("script");
            script.src = scriptURL;
            script.setAttribute(attr, extensionName);
            applyAssetIntegrity(script, getExtensionIntegrity(data, scriptVariant, scriptURL), data.crossOrigin);
            assetLoadHelper(script, {
              loadCallback: resolve,
              errorCallback: reject
            });
          }
        ));
      }
      if (data.loadStyle && data.loadStyle !== "false") {
        loadPromises.push(new Promise(
          (resolve) => {
            const styleDefaultURL = data.loadStyle === true || data.loadStyle === "true" || data.loadStyle === "";
            const href = styleDefaultURL ? url.replace(/\.js(?=[?#]|$)/, ".css") : data.loadStyle;
            const attrStyle = AelluxJs.attr("ext-style");
            const link = document.createElement("link");
            link.href = href;
            link.rel = "stylesheet";
            link.setAttribute(attrStyle, extensionName);
            applyAssetIntegrity(link, getExtensionIntegrity(data, "style", href), data.crossOrigin);
            assetLoadHelper(link, {
              loadCallback: resolve,
              errorCallback: () => {
                AelluxJs.diagnostics.warn(
                  AelluxJs.diagnostics.WARN_EXTENSION_STYLE_LOAD,
                  { extension: extensionName, url: link.href }
                );
                resolve();
              }
            });
          }
        ));
      }
      return Promise.all(loadPromises);
    }
    function getExtensionIntegrity(data, variant, url) {
      const declared = data.integrity;
      const explicit = typeof declared === "string" ? variant === "style" ? null : declared : declared && declared[variant];
      if (explicit) return explicit;
      const basePath = AelluxJs.aelluxBasePath;
      if (!url.startsWith(basePath)) return null;
      const filename = url.slice(basePath.length);
      const builtin = AelluxJs.coreAssetIntegrity;
      return builtin && Object.prototype.hasOwnProperty.call(builtin, filename) ? builtin[filename] : null;
    }
    function applyAssetIntegrity(asset, integrity, crossOrigin) {
      if (integrity) asset.setAttribute("integrity", integrity);
      if (integrity || crossOrigin || AelluxJs.options.crossOrigin) {
        asset.setAttribute("crossorigin", crossOrigin || AelluxJs.options.crossOrigin || "anonymous");
      }
    }
    function toLegacyScriptURL(url) {
      return url.replace(
        /(?:\.legacy)?(?:\.min)?\.js(?=[?#]|$)/,
        ".legacy" + (AelluxJs.minified ? ".min" : "") + ".js"
      );
    }
    function removeExtensionAssets(extensionName) {
      const scriptAttribute = AelluxJs.attr("ext");
      const styleAttribute = AelluxJs.attr("ext-style");
      document.querySelectorAll(`script[${scriptAttribute}], link[${styleAttribute}]`).forEach((asset) => {
        if (asset.getAttribute(scriptAttribute) === extensionName || asset.getAttribute(styleAttribute) === extensionName) {
          asset.remove();
        }
      });
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

  // src/aellux.full.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  root.AelluxJs.bundledExtensions = Object.freeze({
    "preference": () => Promise.resolve().then(() => (init_aellux_ext_preference(), aellux_ext_preference_exports)),
    "stateNavigation": () => Promise.resolve().then(() => (init_aellux_ext_state_navigation(), aellux_ext_state_navigation_exports)),
    "feedback": () => Promise.resolve().then(() => (init_aellux_ext_feedback(), aellux_ext_feedback_exports)),
    "focus": () => Promise.resolve().then(() => (init_aellux_ext_focus(), aellux_ext_focus_exports)),
    "point": () => Promise.resolve().then(() => (init_aellux_ext_point(), aellux_ext_point_exports)),
    "anchor": () => Promise.resolve().then(() => (init_aellux_ext_anchor(), aellux_ext_anchor_exports)),
    "scrollbox": () => Promise.resolve().then(() => (init_aellux_ext_scrollbox(), aellux_ext_scrollbox_exports)),
    "adaptive": () => Promise.resolve().then(() => (init_aellux_ext_adaptive(), aellux_ext_adaptive_exports)),
    "present": () => Promise.resolve().then(() => (init_aellux_ext_present(), aellux_ext_present_exports))
  });
  root.AelluxJs.ext("adaptive", { loadStyle: true });
  root.AelluxJs.ext("present", { loadStyle: true });
})();
//# sourceMappingURL=aellux.full.js.map
