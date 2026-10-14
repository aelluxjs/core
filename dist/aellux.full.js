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
          AelluxJs2.dispatch("PreferencesChange");
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
              snapshot: globalSnapshot,
              removeSnapshot: globalRemoveSnapshot,
              popState
            },
            bubbles: true
          };
          AelluxJs2.dispatch(name, options);
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
        let sequence = 0, current = null, restoring = false;
        function init() {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
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
          const entry = { token: String(++sequence), element };
          entries.push(entry);
          if (entries.length > 100) entries.shift();
          current = entry;
          if (!push) return;
          AelluxJs2.dispatch("PushState", {
            detail: { key: snapshotKey, value: entry.token }
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
          for (let i = entries.length - 1; i >= 0; i--) {
            if (entries[i].token === snapshot[snapshotKey]) {
              if (!restore(entries[i])) restoreLastFocus();
              return;
            }
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
            observer: null
          };
          anchors.set(element, state);
          if (anchors.size === 1) {
            root2.addEventListener("scroll", scheduleUpdate, { capture: true, passive: true });
            root2.addEventListener("resize", scheduleUpdate);
          }
          if (typeof root2.ResizeObserver === "function") {
            state.observer = new root2.ResizeObserver(scheduleUpdate);
          }
          return updateAnchor(element);
        }
        async function unmountAnchor(element) {
          const state = anchors.get(element);
          if (!state) return;
          state.revision++;
          if (state.observer) state.observer.disconnect();
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
          const target = resolveElement(element.getAttribute(targetAttribute));
          const candidates = parseCandidates(element.getAttribute(attribute));
          if (!target || !candidates.length) {
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
              if (current()) invalidContext(element, state, target);
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
              () => current() ? readPlacement(element, target, candidates, true) : null
            );
            if (!current() || !placement) return;
            if (!placement.valid) {
              await AelluxJs2.waitLayout.update(() => {
                if (current()) invalidContext(element, state, target);
              });
              return;
            }
          }
          await AelluxJs2.waitLayout.update(() => {
            if (!current()) return;
            state.invalidContext = false;
            observe(state, element, target, placement.reference);
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
          if (!reference || target.offsetParent !== reference) return { valid: false };
          if (!measure) return { valid: true };
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
          return { valid: true, reference, selected };
        }
        function invalidContext(element, state, target) {
          deactivate(element, state);
          if (state.invalidContext) return;
          AelluxJs2.diagnostics.error(
            AelluxJs2.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT,
            { extension: extensionName, element, target }
          );
          state.invalidContext = true;
        }
        function observe(state, element, target, reference) {
          if (state.target === target && state.reference === reference) return;
          state.target = target;
          state.reference = reference;
          if (!state.observer) return;
          state.observer.disconnect();
          for (const observed of /* @__PURE__ */ new Set([element, target, reference])) {
            if (observed) state.observer.observe(observed);
          }
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
          if (state.observer) state.observer.disconnect();
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
        if (!AelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const attribute = AelluxJs2.attr(extensionName);
        const scrollboxes = /* @__PURE__ */ new Map();
        const properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
        AelluxJs2.extAttach(extensionName, { init, destroy });
        function init() {
          AelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
            mount: mountScrollbox,
            unmount: unmountScrollbox
          });
        }
        function destroy() {
          for (const element of scrollboxes.keys()) unmountScrollbox(element);
          AelluxJs2.mountManager.remove({ extensionName });
        }
        function mountScrollbox(element) {
          if (scrollboxes.has(element)) return;
          const previous = properties.map((name) => ({
            value: element.style.getPropertyValue(name),
            priority: element.style.getPropertyPriority(name)
          }));
          const onScroll = () => updateProgress(element);
          scrollboxes.set(element, { onScroll, previous });
          element.addEventListener("scroll", onScroll, { passive: true });
          updateProgress(element);
        }
        function unmountScrollbox(element) {
          const state = scrollboxes.get(element);
          if (!state) return;
          element.removeEventListener("scroll", state.onScroll);
          properties.forEach((name, index) => {
            const original = state.previous[index];
            if (original.value) element.style.setProperty(name, original.value, original.priority);
            else element.style.removeProperty(name);
          });
          scrollboxes.delete(element);
        }
        function updateProgress(element) {
          element.style.setProperty(properties[0], progress(element.scrollTop, element.scrollHeight - element.clientHeight));
          element.style.setProperty(properties[1], progress(element.scrollLeft, element.scrollWidth - element.clientWidth));
        }
        function progress(position, distance) {
          return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
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
          const bounds = element.getBoundingClientRect();
          updateAdaptive(element, bounds.width, bounds.height);
          if (resizeObserver) resizeObserver.observe(element);
          else if (adaptiveElements.size === 1) root2.addEventListener("resize", onWindowResize);
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
          AelluxJs2.dispatchFrom(element, "AdaptiveUpdate", { detail: null });
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
            mount: mountPresentContainer,
            unmount: unmountPresentContainer,
            controllers: ["pop", "unpop", "trigger", "toggle"]
          });
          AelluxJs2.mountManager.add({
            extensionName,
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
        function prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation) {
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
          if (!waitForPreparation) element.getBoundingClientRect();
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
            element.hidden = false;
            openPresentElements.add(element);
            const size = prepareMeasuredSize(
              element,
              controller,
              gotoVisible,
              previousSize,
              waitForPreparation
            );
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
            if (document.activeElement !== focused) AelluxJs2.dispatch("UnpopFocusLost");
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
      if (filter.length === 0) return;
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
      const elementsAffected = /* @__PURE__ */ new Set();
      for (let index = 0; index < extensions.length; index++) {
        if (!loaded[index].value) continue;
        const [extensionName, candidates] = extensions[index];
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        if (!mounter) {
          continue;
        }
        const searchRoots = [];
        for (const candidate of candidates) {
          let ancestor = candidate.parentNode;
          while (ancestor && !candidates.has(ancestor)) ancestor = ancestor.parentNode;
          if (!ancestor) searchRoots.push(candidate);
        }
        for (const [selector, controller] of mounter) {
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
      }
      for (const affected of elementsAffected) {
        if (!affected.isConnected || !isMounted(affected)) {
          if (!affected.isConnected) await unmountElementRegistrations(affected);
          newlyMounted.delete(affected);
          continue;
        }
        affected.classList.toggle(AelluxJs2.className("mounted"), true);
      }
      AelluxJs2.dispatch("Mount");
    }
    async function AelluxJsMounted(rootElement, method, extensionNames = null, detachedOnly = false) {
      const AelluxJs2 = root2.AelluxJs;
      const selectedNames = extensionNames === null ? null : new Set((typeof extensionNames === "string" ? [extensionNames] : extensionNames).map((name) => fromCamelCase2(name)));
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
            await unmountRegistration(element, mountId, controller, extensionName, selector);
            continue;
          }
          try {
            if (controller && controller[method]) {
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
      AelluxJs2.dispatch(toCapitalized2(method));
    }
    async function unmountRegistration(element, mountId, controller, extensionName, selector) {
      const pendingMount = getPendingMount(element, mountId);
      if (pendingMount) await pendingMount;
      if (!isMounted(element, mountId)) return;
      let tasks = pendingUnmounts.get(element);
      if (!tasks) {
        tasks = /* @__PURE__ */ new Map();
        pendingUnmounts.set(element, tasks);
      }
      if (tasks.has(mountId)) {
        await tasks.get(mountId);
        return;
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
      if (unmount !== void 0 && typeof unmount !== "function") return reject("unmount");
      if (update !== void 0 && typeof update !== "function") return reject("update");
      if (controllers !== void 0 && (!Array.isArray(controllers) || controllers.some((name) => typeof name !== "string" || !name.trim())))
        return reject("controllers");
      const allowed = ["extensionName", "selector", "mount", "unmount", "update", "controllers"];
      const unknown = Object.keys(options).find((name) => !allowed.includes(name));
      if (unknown) return reject(unknown);
      let map = maps.get(key);
      if (!map) {
        map = /* @__PURE__ */ new Map();
        maps.set(key, map);
      }
      if (map.has(selector)) return reject("selector");
      map.set(selector, { mount, unmount, update, controllers });
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
