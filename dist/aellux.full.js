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
        const NO_PREFERENCE = "no-preference";
        const userPreferences = /* @__PURE__ */ Object.create(null);
        const defaultPreferences = /* @__PURE__ */ Object.create(null);
        const computedPreferences = /* @__PURE__ */ Object.create(null);
        const containersByPreference = /* @__PURE__ */ new Map();
        const containerPreferences = /* @__PURE__ */ new Map();
        const containerLabels = /* @__PURE__ */ new Map();
        const labelMemories = /* @__PURE__ */ new WeakMap();
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
          contrast: ["auto", NO_PREFERENCE, "more", "less"],
          reducedMotion: ["auto", NO_PREFERENCE, "reduced"],
          reducedTransparency: ["auto", NO_PREFERENCE, "reduced"],
          forcedColors: ["auto", NO_PREFERENCE, "active"],
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
          AelluxJs2.onTarget(window, "$storage", storageEvent);
          const allQueries = AelluxJs2.registry.preferenceMediaQueries;
          Object.values(allQueries).forEach(
            (queries) => Object.values(queries).forEach(
              (query) => {
                if (!query) return;
                if (query.addEventListener) {
                  AelluxJs2.onTarget(query, "$change", update);
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
          for (const container of containerPreferences.keys()) unmountPreferenceContainer(container);
          AelluxJs2.mountManager.remove({ extensionName });
          containersByPreference.clear();
          containerPreferences.clear();
          AelluxJs2.offTarget(window, "$storage", storageEvent);
          AelluxJs2.off("$DOMContentLoaded", update);
          const allQueries = AelluxJs2.registry.preferenceMediaQueries;
          Object.values(allQueries).forEach(
            (queries) => Object.values(queries).forEach(
              (query) => {
                if (!query) return;
                if (query.removeEventListener) {
                  AelluxJs2.offTarget(query, "$change", update);
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
            let ownedLabels = containerLabels.get(container);
            if (!ownedLabels) {
              ownedLabels = /* @__PURE__ */ new Set();
              containerLabels.set(container, ownedLabels);
            }
            if (!ownedLabels.has(label)) {
              labelMemories.set(label, AelluxJs2.persist.element.save(label, ["hidden"], []));
              ownedLabels.add(label);
            }
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
          AelluxJs2.onTarget(container, "$click", onContainerClick);
        }
        function unmountPreferenceContainer(container) {
          var _a;
          AelluxJs2.offTarget(container, "$click", onContainerClick);
          const labels = containerLabels.get(container);
          if (labels) for (const label of labels) {
            (_a = labelMemories.get(label)) == null ? void 0 : _a.restore();
            labelMemories.delete(label);
          }
          containerLabels.delete(container);
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
        const PUSH_AJAX_REPLACE = "PushAjaxReplace", UPDATE_BASE_TITLE = "UpdateBaseTitle";
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
          AelluxJs2.onTarget(window, "$popstate", onPopState);
          AelluxJs2.onTarget(window, "$hashchange", onHashChange);
          AelluxJs2.on("PushState", OnPushState);
          AelluxJs2.on(PUSH_AJAX_REPLACE, OnPushAjaxReplace);
          AelluxJs2.on(UPDATE_BASE_TITLE, OnUpdateBaseTitle);
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
          AelluxJs2.offTarget(window, "$popstate", onPopState);
          AelluxJs2.offTarget(window, "$hashchange", onHashChange);
          AelluxJs2.off("PushState", OnPushState);
          AelluxJs2.off(PUSH_AJAX_REPLACE, OnPushAjaxReplace);
          AelluxJs2.off(UPDATE_BASE_TITLE, OnUpdateBaseTitle);
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
                event: PUSH_AJAX_REPLACE,
                expected: "detail: { url: non-empty string, selectors: value }"
              });
              return;
            }
            ajaxReplace(detail.url, detail.selectors);
          } catch (cause) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
              extension: extensionName,
              event: PUSH_AJAX_REPLACE,
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
                event: UPDATE_BASE_TITLE,
                expected: "detail: { title: string }"
              });
              return;
            }
            updateBaseTitle(detail.title);
          } catch (cause) {
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_CALLBACK, {
              extension: extensionName,
              event: UPDATE_BASE_TITLE,
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
        const hintMemories = /* @__PURE__ */ new WeakMap();
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
          AelluxJs2.on("$focusin", onFocusIn, true);
          AelluxJs2.on("$focus", onFocusChange, true);
          AelluxJs2.on("$blur", onBlur, true);
          AelluxJs2.onTarget(root2, "$focus", onWindowFocus);
          AelluxJs2.onTarget(root2, "$blur", onWindowBlur);
          AelluxJs2.on("SnapshotRestore", onSnapshotRestore);
          AelluxJs2.on("UnpopFocusLost", onUnpopFocusLost);
          remember(document.activeElement, false);
        }
        function destroy() {
          AelluxJs2.off("$focusin", onFocusIn, true);
          AelluxJs2.off("$focus", onFocusChange, true);
          AelluxJs2.off("$blur", onBlur, true);
          AelluxJs2.offTarget(root2, "$focus", onWindowFocus);
          AelluxJs2.offTarget(root2, "$blur", onWindowBlur);
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
              AelluxJs2.onTarget(element, "$keydown", onNextKeyDown);
              nextElements.add(element);
              if (!element.hasAttribute("enterkeyhint") && element.matches(textEntrySelector)) {
                hintMemories.set(element, AelluxJs2.persist.element.save(element, ["enterkeyhint"], []));
                element.setAttribute("enterkeyhint", "next");
              }
              break;
          }
        }
        function unmountFocusElement(element) {
          var _a;
          if (nextElements.delete(element)) AelluxJs2.offTarget(element, "$keydown", onNextKeyDown);
          (_a = hintMemories.get(element)) == null ? void 0 : _a.restore();
          hintMemories.delete(element);
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
        const POINTER = "pointer";
        const trackedPointers = /* @__PURE__ */ new Map();
        const pointableElements = /* @__PURE__ */ new Set();
        const pointableAttribute = AelluxJs2.attr("point");
        const pointableSelector = `[${pointableAttribute}]`;
        const pointerEvents = [
          ["down", onPointerDown],
          ["move", onPointerMove],
          ["up", onPointerUp],
          ["cancel", onPointerCancel],
          ["over", onPointerOver],
          ["out", onPointerOut]
        ];
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
          for (const [suffix, handler] of pointerEvents)
            AelluxJs2.on(`$${POINTER}${suffix}`, handler, true);
        }
        function destroy() {
          AelluxJs2.mountManager.remove({ extensionName });
          for (const [suffix, handler] of pointerEvents)
            AelluxJs2.off(`$${POINTER}${suffix}`, handler, true);
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
        const ORIGIN_X = "--ae-anchor-origin-x", ORIGIN_Y = "--ae-anchor-origin-y", ANCHOR_OPACITY = "--anchor-opacity";
        const attribute = AelluxJs2.attr(extensionName);
        const presentAttribute = AelluxJs2.attr("present");
        const targetAttribute = AelluxJs2.attr("anchor-target");
        const fpsAttribute = AelluxJs2.attr("anchor-fps");
        const layoutEvent = AelluxJs2.eventName("Layout");
        const anchoredClass = AelluxJs2.className("anchored");
        const baseProperties = ["position", "left", "top", "transform", "transform-origin"];
        const ownedProperties = [
          ...baseProperties,
          "--ae-anchor-x",
          "--ae-anchor-y",
          ORIGIN_X,
          ORIGIN_Y,
          ANCHOR_OPACITY
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
        const DEFAULT_FPS = 30;
        const DEFAULT_INTERVAL_MS = Math.round(1e3 / DEFAULT_FPS);
        const anchors = /* @__PURE__ */ new Map();
        const elementMemories = /* @__PURE__ */ new WeakMap();
        let updateTimeout = null;
        let layoutUpdateTimeout = null;
        let layoutUpdateUntil = 0;
        let lastUpdateTime = -DEFAULT_INTERVAL_MS;
        function updateIntervalMs() {
          let interval = Infinity;
          for (const element of anchors.keys()) {
            const value = element.getAttribute(fpsAttribute);
            const fps = value === null || !value.trim() ? NaN : Number(value);
            const elementInterval = Number.isFinite(fps) && fps > 0 ? Math.max(1, Math.round(1e3 / fps)) : DEFAULT_INTERVAL_MS;
            interval = Math.min(interval, elementInterval);
          }
          return Number.isFinite(interval) ? interval : DEFAULT_INTERVAL_MS;
        }
        AelluxJs2.extAttach(extensionName, { init, destroy });
        function init() {
          AelluxJs2.registerCssProperty(
            { name: "--ae-anchor-x", syntax: "<length>", initialValue: "0px" },
            { name: "--ae-anchor-y", syntax: "<length>", initialValue: "0px" },
            { name: ORIGIN_X, syntax: "<percentage>", initialValue: "50%" },
            { name: ORIGIN_Y, syntax: "<percentage>", initialValue: "0%" },
            { name: ANCHOR_OPACITY, syntax: "<number>", initialValue: "1" }
          );
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
          if (layoutUpdateTimeout !== null) clearTimeout(layoutUpdateTimeout);
          updateTimeout = null;
          layoutUpdateTimeout = null;
          layoutUpdateUntil = 0;
          lastUpdateTime = -DEFAULT_INTERVAL_MS;
          await Promise.all(Array.from(anchors.keys(), unmountAnchor));
          AelluxJs2.mountManager.remove({ extensionName });
        }
        function mountAnchor(element) {
          if (anchors.has(element)) return;
          elementMemories.set(element, AelluxJs2.persist.element.save(element, [], ownedProperties));
          const state = {
            invalidContext: false,
            active: false,
            revision: 0,
            target: null,
            reference: null,
            layoutListener: (event) => scheduleLayoutUpdate(event),
            observer: null,
            intersectionObserver: null
          };
          anchors.set(element, state);
          if (anchors.size === 1) {
            AelluxJs2.onTarget(root2, "$scroll", scheduleUpdate, { capture: true, passive: true });
            AelluxJs2.onTarget(root2, "$resize", scheduleUpdate);
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
          const memory = elementMemories.get(element);
          elementMemories.delete(element);
          state.revision++;
          if (state.reference) AelluxJs2.offTarget(state.reference, layoutEvent, state.layoutListener);
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          anchors.delete(element);
          if (!anchors.size) {
            AelluxJs2.offTarget(root2, "$scroll", scheduleUpdate, true);
            AelluxJs2.offTarget(root2, "$resize", scheduleUpdate);
            if (updateTimeout !== null) clearTimeout(updateTimeout);
            if (layoutUpdateTimeout !== null) clearTimeout(layoutUpdateTimeout);
            updateTimeout = null;
            layoutUpdateTimeout = null;
            layoutUpdateUntil = 0;
            lastUpdateTime = -DEFAULT_INTERVAL_MS;
          }
          await AelluxJs2.waitLayout.update(deactivate, [element, state, memory]);
        }
        function scheduleUpdate() {
          if (!anchors.size) return;
          const interval = updateIntervalMs();
          const elapsed = now() - lastUpdateTime;
          if (elapsed >= interval) {
            if (updateTimeout !== null) clearTimeout(updateTimeout);
            updateTimeout = null;
            flushUpdate();
            return;
          }
          if (updateTimeout !== null) return;
          updateTimeout = setTimeout(flushUpdate, interval - elapsed);
        }
        function scheduleLayoutUpdate(event) {
          const interval = updateIntervalMs();
          const durationMs = Number(event && event.detail ? event.detail.durationMs : NaN);
          if (!Number.isFinite(durationMs) || durationMs < 0) {
            scheduleUpdate();
            return;
          }
          if (durationMs === 0) {
            if (layoutUpdateTimeout === null)
              layoutUpdateTimeout = setTimeout(checkLayoutUpdate, interval);
            return;
          }
          scheduleUpdate();
          layoutUpdateUntil = Math.max(layoutUpdateUntil, now() + durationMs);
          if (layoutUpdateTimeout !== null) return;
          layoutUpdateTimeout = setTimeout(
            checkLayoutUpdate,
            Math.min(interval, durationMs)
          );
        }
        function checkLayoutUpdate() {
          layoutUpdateTimeout = null;
          scheduleUpdate();
          const remaining = layoutUpdateUntil - now();
          if (remaining > 0) {
            layoutUpdateTimeout = setTimeout(
              checkLayoutUpdate,
              Math.min(updateIntervalMs(), remaining)
            );
          } else {
            layoutUpdateUntil = 0;
          }
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
          if (placement.hidden) {
            await AelluxJs2.waitLayout.update(() => {
              if (current()) hideForTarget(element, state, placement);
            });
            return;
          }
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
            if (placement.hidden) {
              await AelluxJs2.waitLayout.update(() => {
                if (current()) hideForTarget(element, state, placement);
              });
              return;
            }
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
            element.style.setProperty(ORIGIN_X, `${selected.self[0] * 100}%`);
            element.style.setProperty(ORIGIN_Y, `${selected.self[1] * 100}%`);
            element.style.setProperty(ANCHOR_OPACITY, placement.opacity);
            for (const name of baseProperties) element.style.removeProperty(name);
            element.classList.add(anchoredClass);
          });
        }
        function readPlacement(element, target, candidates, measure) {
          const reference = element.offsetParent;
          target = target || reference;
          if (target && isInvisible(target)) return { hidden: true, target, reference };
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
          const present = target.closest(`[${presentAttribute}]`);
          const opacity = present ? root2.getComputedStyle(present).opacity : "1";
          return { valid: true, target, reference, selected, opacity };
        }
        function isInvisible(element) {
          const visibility = root2.getComputedStyle(element).visibility;
          if (visibility === "hidden" || visibility === "collapse") return true;
          for (let current = element; current && current.nodeType === 1; current = current.parentElement) {
            const style = root2.getComputedStyle(current);
            if (current.hidden || style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) return true;
          }
          return false;
        }
        function hideForTarget(element, state, placement) {
          deactivate(element, state);
          state.invalidContext = false;
          if (placement.reference) listenForLayout(state, placement.reference);
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
          if (state.reference) AelluxJs2.offTarget(state.reference, layoutEvent, state.layoutListener);
          state.reference = reference;
          if (reference) AelluxJs2.onTarget(reference, layoutEvent, state.layoutListener);
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
        function deactivate(element, state, memory = elementMemories.get(element)) {
          if (state.reference) AelluxJs2.offTarget(state.reference, layoutEvent, state.layoutListener);
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          state.target = state.reference = null;
          element.classList.remove(anchoredClass);
          if (state.active && memory) memory.restore();
          state.active = false;
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
        const { onTarget, offTarget } = AelluxJs2;
        const POINTER = "pointer", POINTER_DOWN = `${POINTER}down`, POINTER_MOVE = `${POINTER}move`, POINTER_UP = `${POINTER}up`, POINTER_CANCEL = `${POINTER}cancel`, POINTER_OVER = `${POINTER}over`, POINTER_OUT = `${POINTER}out`, POINTER_ENTER = `${POINTER}enter`, POINTER_LEAVE = `${POINTER}leave`, POINTER_DOWN_TARGET = `$${POINTER_DOWN}`, POINTER_MOVE_TARGET = `$${POINTER_MOVE}`, POINTER_UP_TARGET = `$${POINTER_UP}`, POINTER_CANCEL_TARGET = `$${POINTER_CANCEL}`;
        const attribute = AelluxJs2.attr(extensionName);
        const wheelAttribute = AelluxJs2.attr("scrollbox-wheel-horizontal");
        const momentumAttribute = AelluxJs2.attr("scrollbox-momentum");
        const elasticAttribute = AelluxJs2.attr("scrollbox-elastic");
        const snapAttribute = AelluxJs2.attr("scrollbox-snap");
        const snapItemAttribute = AelluxJs2.attr("snap-item");
        const scrollbarAttribute = AelluxJs2.attr("scrollbar");
        const scrollbarVerticalAttribute = AelluxJs2.attr("scrollbar-vertical");
        const scrollbarHorizontalAttribute = AelluxJs2.attr("scrollbar-horizontal");
        const elasticReleaseClass = AelluxJs2.className("scrollbox-elastic-release");
        const pointerScrollingClass = AelluxJs2.className("pointerscrolling");
        const nativeScrollbarHideClass = AelluxJs2.className("native-sb-hide");
        const scrollbarVisibleClass = AelluxJs2.className("scrollbar-visible");
        const snapReadyClass = AelluxJs2.className("snap-ready");
        const snapSuspendedClass = AelluxJs2.className("snap-suspended");
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
        const SNAP_FLICK_WINDOW_MS = 100;
        const SNAP_FLICK_FAST_TIME_MS = 50;
        const SNAP_FLICK_MAX_DISTANCE_PX = 100;
        const SNAP_FLICK_MIN_DISTANCE_PX = 1;
        const SNAP_SCROLL_IDLE_MS = 120;
        const SNAP_TARGET_IDLE_MS = 500;
        const SNAP_EDGE_DISTANCE_PX = 10;
        const ELASTIC_DAMPING = 1 / 3;
        const DEFAULT_ELASTIC_LIMIT = { unit: "ratio", value: 1 / 4 };
        const ELASTIC_RETURN_LERP = 0.15;
        const ELASTIC_RETURN_EPSILON = 0.01;
        const ELASTIC_WHEEL_IDLE_MS = 80;
        const SCROLLBAR_SIZE_PX = 8;
        const SCROLLBAR_MIN_THUMB_PX = 20;
        const SCROLLBAR_INTERACTION_HIDE_DELAY_MS = 1e3;
        const SCROLLBAR_HOVER_HIDE_DELAY_MS = 300;
        const scrollbarProperties = [
          "--ae-scrollbar-x",
          "--ae-scrollbar-y",
          "--ae-scrollbar-length",
          "--ae-scrollbar-thumb-size",
          "--ae-scrollbar-thumb-position",
          "--ae-scrollbar-display"
        ];
        const pointerListeners = [
          [POINTER_DOWN, "onPointerDown"],
          [POINTER_OVER, "onPointerOver"],
          [POINTER_OUT, "onPointerOut"],
          ["mousedown", "onMouseDown"]
        ];
        const scrollbarHoverListeners = [
          [POINTER_DOWN, "onScrollbarPointerDown"],
          [POINTER_ENTER, "onScrollbarPointerEnter"],
          [POINTER_LEAVE, "onScrollbarPointerLeave"],
          [POINTER_OVER, "onScrollbarPointerOver"],
          [POINTER_OUT, "onScrollbarPointerOut"],
          [POINTER_MOVE, "onScrollbarPointerMove"],
          [POINTER_UP, "onScrollbarPointerEnd"],
          [POINTER_CANCEL, "onScrollbarPointerEnd"],
          ["mouseenter", "onScrollbarMouseEnter"],
          ["mouseleave", "onScrollbarMouseLeave"],
          ["mouseover", "onScrollbarMouseOver"],
          ["mouseout", "onScrollbarMouseOut"]
        ];
        const scrollbarAxisListeners = [
          [POINTER_DOWN, "onPointerDown"],
          [POINTER_MOVE, "onPointerMove"],
          [POINTER_UP, "onPointerEnd"],
          [POINTER_CANCEL, "onPointerEnd"]
        ];
        const snapEndListeners = [
          [POINTER_UP, "onSnapPointerEnd", true],
          [POINTER_CANCEL, "onSnapPointerEnd", true],
          ["touchend", "onSnapTouchEnd", true],
          ["touchcancel", "onSnapTouchEnd", true],
          ["blur", "onSnapBlur"]
        ];
        const touchListeners = [
          ["touchstart", "onTouchStart", { passive: true }],
          ["touchmove", "onTouchMove", { passive: false }],
          ["touchend", "onTouchEnd", { passive: true }],
          ["touchcancel", "onTouchEnd", { passive: true }]
        ];
        function setListeners(target, owner, entries, active) {
          const method = active ? onTarget : offTarget;
          for (const [event, handler, options] of entries) {
            method(target, `$${event}`, owner[handler], active ? options : options === true || !!(options == null ? void 0 : options.capture));
          }
        }
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
        const elementMemories = /* @__PURE__ */ new WeakMap();
        const cursorMemories = /* @__PURE__ */ new WeakMap();
        const scrollbarMemories = /* @__PURE__ */ new WeakMap();
        const inlineMemories = /* @__PURE__ */ new WeakMap();
        const elasticMemories = /* @__PURE__ */ new WeakMap();
        const pointerScrollMemories = /* @__PURE__ */ new WeakMap();
        const snapItemMemories = /* @__PURE__ */ new WeakMap();
        let activePointerScrollState = null;
        AelluxJs2.extAttach(extensionName, { init, destroy, next, previous, goto });
        function init() {
          AelluxJs2.registerCssProperty(
            ...[...properties, ...snapProperties].map((name) => ({ name, syntax: "<number>", initialValue: "0" })),
            ...scrollbarProperties.map((name, index) => ({
              name,
              syntax: index === 5 ? "block | none" : "<length>",
              initialValue: index === 5 ? "none" : "0px"
            }))
          );
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
          elementMemories.set(element, AelluxJs2.persist.element.save(element, [], properties));
          cursorMemories.set(element, AelluxJs2.persist.element.save(element, [], ["cursor"]));
          const elastic = {
            wrapper: null,
            baseTransform: "",
            baseOrigin: "",
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
            root: null,
            initialized: false,
            invalidReported: false,
            index: 0,
            flick: null,
            axis: null,
            deferredIndex: null,
            suspensions: { pointer: false, elastic: false, scrollbar: false, wheel: false },
            notifiedItem: null,
            notifiedIndex: null,
            scrollEndTimeout: null,
            scrollingToTarget: -1,
            scrollingToAxis: null,
            wheelTimeout: null,
            edgeWheelTimeout: null,
            activePointers: /* @__PURE__ */ new Set(),
            activeTouches: /* @__PURE__ */ new Set(),
            savedItems: /* @__PURE__ */ new Set(),
            gestureListening: false,
            endListening: false,
            waitingForGestureEnd: false
          };
          const inlineWrapper = {
            element: null,
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
            hoverVisible: false,
            hoverTimeout: null,
            interactionVisible: false,
            interactionTimeout: null
          };
          const state = {
            element,
            metrics: null,
            mode: null,
            desktop: false,
            cursor: { owned: false },
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
            desktopMedia: null,
            publishPending: false,
            publishDirty: false,
            layoutRevision: 0,
            lastResizeTime: -RESIZE_INTERVAL_MS,
            resizeTimeout: null,
            disposed: false
          };
          state.onScroll = (event) => {
            if (event.target !== element) return;
            publish(state);
            if (!state.desktop && state.scrollbar.listening) scheduleScrollbarInteractionHide(state);
            if (!state.snapEnabled) return;
            if (state.snap.scrollingToTarget !== -1) {
              if (!snapTargetReached(state)) {
                scheduleSnapTargetIdle(state);
                return;
              }
              clearSnapTarget(state);
              scheduleScrollEnd(state);
            } else if (!("onscrollend" in element) || state.snap.scrollEndTimeout !== null) {
              scheduleScrollEnd(state);
            }
          };
          state.onScrollEnd = (event) => {
            if (event.target !== element) return;
            clearSnapTarget(state);
            clearScrollEnd(state);
            finishNativeScroll(state);
          };
          state.onWheel = (event) => handleWheel(state, event);
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
          state.onSnapPointerDown = (event) => beginSnapGesture(state, POINTER, event);
          state.onSnapPointerEnd = (event) => endSnapGesture(state, POINTER, event);
          state.onSnapTouchStart = (event) => beginSnapGesture(state, "touch", event);
          state.onSnapTouchEnd = (event) => endSnapGesture(state, "touch", event);
          state.onSnapBlur = () => endSnapGesture(state);
          state.onScrollbarPointerDown = () => startScrollbarInteractionVisibility(state);
          state.onScrollbarPointerEnd = () => scheduleScrollbarInteractionHide(state);
          state.onScrollbarPointerEnter = (event) => {
            if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", true);
          };
          state.onScrollbarPointerLeave = (event) => {
            if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", false);
          };
          state.onScrollbarPointerOver = (event) => {
            if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", true);
          };
          state.onScrollbarPointerOut = (event) => {
            if (event.pointerType !== "touch" && (!event.relatedTarget || !element.contains(event.relatedTarget)))
              setScrollbarHover(state, "pointerHover", false);
          };
          state.onScrollbarPointerMove = (event) => {
            if (event.pointerType !== "touch" && !state.scrollbar.pointerHover)
              setScrollbarHover(state, "pointerHover", true);
          };
          state.onScrollbarMouseEnter = () => {
            if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
          };
          state.onScrollbarMouseLeave = () => setScrollbarHover(state, "mouseHover", false);
          state.onScrollbarMouseOver = () => {
            if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
          };
          state.onScrollbarMouseOut = (event) => {
            if (!event.relatedTarget || !element.contains(event.relatedTarget))
              setScrollbarHover(state, "mouseHover", false);
          };
          state.onScrollbarOutsideDown = (event) => {
            if (!element.contains(event.target)) {
              setScrollbarHover(state, "pointerHover", false);
              setScrollbarHover(state, "mouseHover", false);
              if (!element.classList.contains(pointerScrollingClass))
                clearScrollbarInteractionVisibility(state);
              syncScrollbarVisibility(state);
            }
          };
          scrollboxes.set(element, state);
          onTarget(element, "$scroll", state.onScroll, { passive: true });
          onTarget(element, "$scrollend", state.onScrollEnd, { passive: true });
          observe(state);
          configure(state);
        }
        function updateScrollbox(element) {
          const state = scrollboxes.get(element);
          if (state) configure(state);
        }
        function unmountScrollbox(element) {
          var _a;
          const state = scrollboxes.get(element);
          if (!state) return;
          state.disposed = true;
          if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
            endPointerScroll(activePointerScrollState);
          endPointerScroll(state);
          stopPointerScrollMouseEvents(state);
          restorePointerScrollCursor(state);
          cancelMomentum(state);
          state.snap.flick = null;
          state.snap.deferredIndex = null;
          clearSnapTarget(state);
          clearScrollEnd(state);
          removeSnapGestureListeners(state);
          restoreSnapStyles(state);
          resetElastic(state);
          if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
          restoreInlineWrapper(state);
          resetScrollbars(state);
          offTarget(element, "$scroll", state.onScroll);
          offTarget(element, "$scrollend", state.onScrollEnd);
          if (state.wheelListening) offTarget(element, "$wheel", state.onWheel, true);
          if (state.pointerListening) setListeners(element, state, pointerListeners, false);
          if (state.touchListening) removeTouchListeners(state);
          if (state.resizeObserver) state.resizeObserver.disconnect();
          if (state.mutationObserver) state.mutationObserver.disconnect();
          if (state.desktopMedia) {
            if (state.desktopMedia.removeEventListener)
              state.desktopMedia.removeEventListener("change", state.onDesktopMediaChange);
            else if (state.desktopMedia.removeListener)
              state.desktopMedia.removeListener(state.onDesktopMediaChange);
          }
          if (state.resizeTimeout !== null) root2.clearTimeout(state.resizeTimeout);
          offTarget(root2, "$resize", state.onResize);
          (_a = elementMemories.get(element)) == null ? void 0 : _a.restore();
          elementMemories.delete(element);
          cursorMemories.delete(element);
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
            onTarget(element, "$wheel", state.onWheel, { passive: false, capture: true });
            state.wheelListening = true;
          } else if (!state.desktop && !state.elasticEnabled && !state.snapEnabled && state.wheelListening) {
            offTarget(element, "$wheel", state.onWheel, true);
            state.wheelListening = false;
          }
          if (state.elasticEnabled && !state.touchListening) addTouchListeners(state);
          else if (!state.elasticEnabled && state.touchListening) removeTouchListeners(state);
          if (!state.elasticEnabled) resetElastic(state);
          const pointerEnabled = state.desktop && state.mode === POINTER;
          if (!pointerEnabled || !state.momentumEnabled) cancelMomentum(state);
          if (pointerEnabled && !state.pointerListening) {
            setListeners(element, state, pointerListeners, true);
            state.pointerListening = true;
          } else if (!pointerEnabled && state.pointerListening) {
            if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
              endPointerScroll(activePointerScrollState);
            setListeners(element, state, pointerListeners, false);
            state.pointerListening = false;
            endPointerScroll(state);
            state.lastPointerDown = null;
            restorePointerScrollCursor(state);
          }
          if (state.snapEnabled) syncSnapStyles(state);
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
        function supportsMouseHover() {
          return !!(root2.matchMedia && root2.matchMedia("(any-hover: hover)").matches);
        }
        function configureScrollbars(state) {
          const element = state.element;
          const value = element.getAttribute(scrollbarAttribute);
          const axes = scrollbarAxes(value);
          configureScrollbarAxis(state, "y", axes.y, scrollbarVerticalAttribute);
          configureScrollbarAxis(state, "x", axes.x, scrollbarHorizontalAttribute);
          const enabled = axes.x || axes.y;
          const scrollbar = state.scrollbar;
          if (enabled && !scrollbar.listening) {
            scrollbar.mouseHover = element.matches(":hover") && supportsMouseHover();
            scrollbar.hoverVisible = scrollbar.mouseHover;
            setListeners(element, state, scrollbarHoverListeners, true);
            AelluxJs2.on(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
            scrollbar.listening = true;
            syncScrollbarVisibility(state);
          } else if (!enabled && scrollbar.listening) {
            setListeners(element, state, scrollbarHoverListeners, false);
            AelluxJs2.off(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
            scrollbar.listening = false;
            clearScrollbarInteractionVisibility(state);
            clearScrollbarHover(state);
            syncScrollbarVisibility(state);
          }
          const hideNative = enabled || value !== null && value.trim().toLowerCase() === "none";
          if (hideNative && !element.classList.contains(nativeScrollbarHideClass)) {
            element.classList.add(nativeScrollbarHideClass);
            scrollbar.hideOwned = true;
          } else if (!hideNative && scrollbar.hideOwned) {
            element.classList.remove(nativeScrollbarHideClass);
            scrollbar.hideOwned = false;
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
          if (!owned) scrollbarMemories.set(element, AelluxJs2.persist.element.save(
            element,
            [],
            scrollbarProperties
          ));
          const record = {
            element,
            owned,
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
          setListeners(element, record, scrollbarAxisListeners, true);
          scrollbar[axis] = record;
        }
        function resetScrollbarAxis(state, axis) {
          var _a;
          const record = state.scrollbar[axis];
          if (!record) return;
          endScrollbarDrag(state, record);
          const element = record.element;
          setListeners(element, record, scrollbarAxisListeners, false);
          if (record.owned) element.remove();
          else (_a = scrollbarMemories.get(element)) == null ? void 0 : _a.restore();
          scrollbarMemories.delete(element);
          state.scrollbar[axis] = null;
        }
        function resetScrollbars(state) {
          resetScrollbarAxis(state, "x");
          resetScrollbarAxis(state, "y");
          const scrollbar = state.scrollbar;
          if (scrollbar.listening) {
            setListeners(state.element, state, scrollbarHoverListeners, false);
            AelluxJs2.off(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
            scrollbar.listening = false;
          }
          if (scrollbar.hideOwned) state.element.classList.remove(nativeScrollbarHideClass);
          scrollbar.hideOwned = false;
          clearScrollbarInteractionVisibility(state);
          clearScrollbarHover(state);
          syncScrollbarVisibility(state);
        }
        function setScrollbarHover(state, name, active) {
          const scrollbar = state.scrollbar;
          scrollbar[name] = active;
          if (active) {
            if (scrollbar.hoverTimeout !== null) root2.clearTimeout(scrollbar.hoverTimeout);
            scrollbar.hoverTimeout = null;
            scrollbar.hoverVisible = true;
          } else if (!scrollbar.pointerHover && !scrollbar.mouseHover && scrollbar.hoverVisible && scrollbar.hoverTimeout === null) {
            scrollbar.hoverTimeout = root2.setTimeout(() => {
              scrollbar.hoverTimeout = null;
              scrollbar.hoverVisible = false;
              syncScrollbarVisibility(state);
            }, SCROLLBAR_HOVER_HIDE_DELAY_MS);
          }
          syncScrollbarVisibility(state);
        }
        function clearScrollbarHover(state) {
          const scrollbar = state.scrollbar;
          if (scrollbar.hoverTimeout !== null) root2.clearTimeout(scrollbar.hoverTimeout);
          scrollbar.hoverTimeout = null;
          scrollbar.hoverVisible = scrollbar.pointerHover = scrollbar.mouseHover = false;
        }
        function syncScrollbarVisibility(state) {
          const scrollbar = state.scrollbar;
          if (scrollbar.listening && (scrollbar.hoverVisible || scrollbar.drag || scrollbar.interactionVisible || state.cursor.owned)) showScrollbars(state);
          else hideScrollbars(state);
        }
        function clearScrollbarInteractionVisibility(state) {
          const scrollbar = state.scrollbar;
          if (scrollbar.interactionTimeout !== null) root2.clearTimeout(scrollbar.interactionTimeout);
          scrollbar.interactionTimeout = null;
          scrollbar.interactionVisible = false;
        }
        function startScrollbarInteractionVisibility(state) {
          if (!state.scrollbar.listening) return;
          clearScrollbarInteractionVisibility(state);
          state.scrollbar.interactionVisible = true;
          syncScrollbarVisibility(state);
        }
        function scheduleScrollbarInteractionHide(state) {
          if (!state.scrollbar.listening || state.disposed) return;
          clearScrollbarInteractionVisibility(state);
          state.scrollbar.interactionVisible = true;
          syncScrollbarVisibility(state);
          state.scrollbar.interactionTimeout = root2.setTimeout(() => {
            state.scrollbar.interactionTimeout = null;
            state.scrollbar.interactionVisible = false;
            syncScrollbarVisibility(state);
          }, SCROLLBAR_INTERACTION_HIDE_DELAY_MS);
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
            if (record.x !== x) style.setProperty(scrollbarProperties[0], `${x}px`);
            if (record.y !== y) style.setProperty(scrollbarProperties[1], `${y}px`);
            if (record.trackSize !== trackSize)
              style.setProperty(scrollbarProperties[2], `${trackSize}px`);
            if (record.thumbSize !== thumbSize)
              style.setProperty(scrollbarProperties[3], `${thumbSize}px`);
            if (record.thumbPosition !== thumbPosition)
              style.setProperty(scrollbarProperties[4], `${thumbPosition}px`);
            if (record.display !== display)
              style.setProperty(scrollbarProperties[5], display);
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
          suspendSnapStyles(state, "scrollbar", true);
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
          suspendSnapStyles(state, "scrollbar", false);
        }
        function configureSnap(state) {
          const element = state.element;
          const requested = element.hasAttribute(snapAttribute) && element.getAttribute(snapAttribute) !== "false";
          const root3 = state.elastic.wrapper || element;
          const items = collectSnapItems(state, root3);
          if (!requested || !items.length) {
            state.snapEnabled = false;
            removeSnapGestureListeners(state);
            restoreSnapStyles(state);
            state.snap.root = null;
            state.snap.initialized = false;
            state.snap.index = 0;
            state.snap.flick = null;
            state.snap.deferredIndex = null;
            clearSnapTarget(state);
            state.snap.notifiedItem = null;
            state.snap.notifiedIndex = null;
            clearScrollEnd(state);
            const missingItems = requested && !items.length;
            if (missingItems && !state.snap.invalidReported)
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_SCROLLBOX_SNAP_ITEMS,
                { element }
              );
            state.snap.invalidReported = missingItems;
            return;
          }
          state.snap.invalidReported = false;
          if (state.snap.root !== root3) {
            restoreSnapStyles(state);
            state.snap.root = root3;
            state.snap.initialized = false;
            state.snap.index = 0;
            state.snap.flick = null;
            state.snap.deferredIndex = null;
            clearSnapTarget(state);
            state.snap.notifiedItem = null;
            state.snap.notifiedIndex = null;
          }
          state.snapEnabled = true;
          addSnapGestureListeners(state);
        }
        function configureInlineWrapper(state) {
          const inline = state.inlineWrapper;
          const wrapper = state.elastic.wrapper;
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
          if (!inline.owned) inlineMemories.set(wrapper, AelluxJs2.persist.element.save(
            wrapper,
            [],
            ["display"]
          ));
          wrapper.style.setProperty("display", replacement, "important");
          inline.owned = true;
        }
        function restoreInlineWrapper(state) {
          var _a;
          const inline = state.inlineWrapper;
          if (inline.owned && inline.element) (_a = inlineMemories.get(inline.element)) == null ? void 0 : _a.restore();
          if (inline.element) inlineMemories.delete(inline.element);
          inline.element = null;
          inline.owned = false;
          inline.reportedDisplay = null;
        }
        function syncSnapStyles(state, axis = snapAxis(state)) {
          const snap = state.snap;
          if (!state.snapEnabled || !snap.root) return;
          snap.axis = axis;
          state.element.classList.add(snapReadyClass);
          state.element.classList.toggle(
            snapSuspendedClass,
            snap.suspensions.pointer || snap.suspensions.elastic || snap.suspensions.scrollbar || snap.suspensions.wheel
          );
        }
        function suspendSnapStyles(state, reason, suspended) {
          if (!state.snapEnabled || !state.snap.root || state.snap.suspensions[reason] === suspended) return;
          state.snap.suspensions[reason] = suspended;
          syncSnapStyles(state, state.snap.axis || snapAxis(state));
          if (!suspended && !Object.values(state.snap.suspensions).some(Boolean))
            scheduleScrollEnd(state);
        }
        function scheduleSnapWheelIdle(state) {
          clearSnapWheelTimeout(state);
          state.snap.wheelTimeout = root2.setTimeout(() => {
            state.snap.wheelTimeout = null;
          }, SNAP_SCROLL_IDLE_MS);
        }
        function clearSnapWheelTimeout(state) {
          const snap = state.snap;
          if (snap.wheelTimeout !== null) root2.clearTimeout(snap.wheelTimeout);
          snap.wheelTimeout = null;
        }
        function suspendSnapForEdgeWheel(state) {
          const snap = state.snap;
          if (snap.edgeWheelTimeout !== null) root2.clearTimeout(snap.edgeWheelTimeout);
          suspendSnapStyles(state, "wheel", true);
          snap.edgeWheelTimeout = root2.setTimeout(() => {
            snap.edgeWheelTimeout = null;
            suspendSnapStyles(state, "wheel", false);
          }, SNAP_SCROLL_IDLE_MS);
        }
        function clearEdgeWheelSuspension(state) {
          const snap = state.snap;
          if (snap.edgeWheelTimeout !== null) root2.clearTimeout(snap.edgeWheelTimeout);
          snap.edgeWheelTimeout = null;
          suspendSnapStyles(state, "wheel", false);
        }
        function restoreSnapStyles(state) {
          var _a;
          const snap = state.snap;
          clearSnapWheelTimeout(state);
          if (snap.edgeWheelTimeout !== null) root2.clearTimeout(snap.edgeWheelTimeout);
          snap.edgeWheelTimeout = null;
          for (const item of snap.savedItems) {
            (_a = snapItemMemories.get(item)) == null ? void 0 : _a.restore();
            snapItemMemories.delete(item);
          }
          snap.savedItems.clear();
          state.element.classList.remove(snapReadyClass, snapSuspendedClass);
          snap.axis = null;
          snap.suspensions.pointer = false;
          snap.suspensions.elastic = false;
          snap.suspensions.scrollbar = false;
          snap.suspensions.wheel = false;
        }
        function collectSnapItems(state, root3) {
          return Array.from(root3.querySelectorAll(`[${snapItemAttribute}]`)).filter((item) => item.closest(`[${attribute}]`) === state.element);
        }
        function snapItems(state) {
          return state.snapEnabled && state.snap.root ? collectSnapItems(state, state.snap.root) : [];
        }
        function snapAxis(state) {
          return state.element.getAttribute(snapAttribute) === "vertical" ? "y" : "x";
        }
        function snapAlignment(item) {
          const value = item.getAttribute(snapItemAttribute);
          if (value === "start" || value === "left" || value === "top") return "start";
          if (value === "end" || value === "right" || value === "bottom") return "end";
          return "center";
        }
        function snapAlignmentOffset(state, item, axis, box = state.element.getBoundingClientRect(), target = item.getBoundingClientRect()) {
          const horizontal = axis === "x";
          const start = horizontal ? box.left + state.element.clientLeft : box.top + state.element.clientTop;
          const size = horizontal ? state.element.clientWidth : state.element.clientHeight;
          const itemStart = horizontal ? target.left : target.top;
          const itemSize = horizontal ? target.width : target.height;
          const alignment = snapAlignment(item);
          if (alignment === "start") return itemStart - start;
          if (alignment === "end") return itemStart + itemSize - start - size;
          return itemStart + itemSize / 2 - start - size / 2;
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
        function nearestSnapIndex(state, items, axis) {
          const box = state.element.getBoundingClientRect();
          let nearest = 0, distance = Infinity;
          for (let index = 0; index < items.length; index++) {
            const candidate = Math.abs(snapAlignmentOffset(state, items[index], axis, box));
            if (candidate < distance) {
              nearest = index;
              distance = candidate;
            }
          }
          return nearest;
        }
        function addSnapGestureListeners(state) {
          if (state.snap.gestureListening) return;
          onTarget(state.element, POINTER_DOWN_TARGET, state.onSnapPointerDown, true);
          onTarget(
            state.element,
            "$touchstart",
            state.onSnapTouchStart,
            { passive: true, capture: true }
          );
          state.snap.gestureListening = true;
        }
        function removeSnapGestureListeners(state) {
          if (state.snap.gestureListening) {
            offTarget(state.element, POINTER_DOWN_TARGET, state.onSnapPointerDown, true);
            offTarget(state.element, "$touchstart", state.onSnapTouchStart, true);
            state.snap.gestureListening = false;
          }
          stopSnapGestureEndListeners(state);
          state.snap.activePointers.clear();
          state.snap.activeTouches.clear();
          state.snap.waitingForGestureEnd = false;
        }
        function listenSnapGestureEnd(state) {
          if (state.snap.endListening) return;
          setListeners(root2, state, snapEndListeners, true);
          state.snap.endListening = true;
        }
        function stopSnapGestureEndListeners(state) {
          if (!state.snap.endListening) return;
          setListeners(root2, state, snapEndListeners, false);
          state.snap.endListening = false;
        }
        function beginSnapGesture(state, kind, event) {
          if (!state.snapEnabled || event.target.closest(
            `[${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`
          )) return;
          const snap = state.snap;
          const active = kind === POINTER ? snap.activePointers : snap.activeTouches;
          if (kind === POINTER) active.add(event.pointerId);
          else for (const touch of event.changedTouches) active.add(touch.identifier);
          if (!active.size) return;
          snap.flick = null;
          if (snap.scrollEndTimeout !== null || snap.scrollingToTarget !== -1)
            snap.waitingForGestureEnd = true;
          clearSnapTarget(state);
          clearScrollEnd(state);
          listenSnapGestureEnd(state);
        }
        function endSnapGesture(state, kind, event) {
          const snap = state.snap;
          if (kind === POINTER) snap.activePointers.delete(event.pointerId);
          else if (kind === "touch") {
            for (const touch of event.changedTouches) snap.activeTouches.delete(touch.identifier);
          } else {
            snap.activePointers.clear();
            snap.activeTouches.clear();
          }
          if (snap.activePointers.size || snap.activeTouches.size) return;
          stopSnapGestureEndListeners(state);
          if ((snap.waitingForGestureEnd || snap.flick) && snap.gestureListening && !state.disposed) {
            snap.waitingForGestureEnd = false;
            scheduleScrollEnd(state);
          }
        }
        function scheduleScrollEnd(state) {
          if (state.snap.scrollingToTarget !== -1) return;
          clearScrollEnd(state);
          if (state.snap.activePointers.size || state.snap.activeTouches.size) {
            state.snap.waitingForGestureEnd = true;
            return;
          }
          state.snap.waitingForGestureEnd = false;
          state.snap.scrollEndTimeout = root2.setTimeout(() => {
            state.snap.scrollEndTimeout = null;
            finishNativeScroll(state);
          }, SNAP_SCROLL_IDLE_MS);
        }
        function scheduleSnapTargetIdle(state) {
          clearScrollEnd(state);
          state.snap.scrollEndTimeout = root2.setTimeout(() => {
            state.snap.scrollEndTimeout = null;
            if (state.snap.scrollingToTarget === -1) return;
            clearSnapTarget(state);
            finishNativeScroll(state);
          }, SNAP_TARGET_IDLE_MS);
        }
        function clearScrollEnd(state) {
          if (state.snap.scrollEndTimeout !== null)
            root2.clearTimeout(state.snap.scrollEndTimeout);
          state.snap.scrollEndTimeout = null;
        }
        function snapTargetReached(state) {
          const snap = state.snap;
          if (snap.scrollingToTarget === -1) return false;
          const position = snap.scrollingToAxis === "x" ? state.element.scrollLeft : state.element.scrollTop;
          return Math.abs(position - snap.scrollingToTarget) <= 1;
        }
        function clearSnapTarget(state) {
          state.snap.scrollingToTarget = -1;
          state.snap.scrollingToAxis = null;
        }
        function finishNativeScroll(state) {
          if (state.disposed || !state.snapEnabled) return;
          if (state.snap.activePointers.size || state.snap.activeTouches.size) {
            state.snap.waitingForGestureEnd = true;
            return;
          }
          if (state.snap.suspensions.pointer || state.snap.suspensions.elastic || state.snap.suspensions.wheel || state.momentum || state.scrollbar.drag || activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) return;
          const items = snapItems(state);
          if (!items.length) return;
          const metrics = nativeMetrics(state.element);
          const axis = snapAxis(state);
          const edgeIndex = edgeSnapIndex(state, items, axis, metrics);
          const index = edgeIndex === null ? nearestSnapIndex(state, items, axis) : edgeIndex;
          const flick = state.snap.flick;
          state.snap.flick = null;
          if (flick && flick.axis === axis && flick.index !== index && flick.index >= 0 && flick.index < items.length) {
            scrollToSnap(state, flick.index, axis);
            return;
          }
          notifySnapChange(state, items[index], axis);
        }
        function initializeSnap(state) {
          const first = snapItems(state)[0];
          if (!first) return;
          state.snap.initialized = true;
          state.snap.index = 0;
          const axis = snapAxis(state);
          scrollToSnap(state, 0, axis, "instant");
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
        function scrollToSnap(state, index, axis = snapAxis(state), behavior = "smooth") {
          const items = snapItems(state);
          if (!items.length || !Number.isInteger(index) || index < 0 || index >= items.length)
            return false;
          if (state.snap.suspensions.elastic) {
            clearSnapTarget(state);
            clearScrollEnd(state);
            state.snap.deferredIndex = index;
            return true;
          }
          cancelMomentum(state);
          clearScrollEnd(state);
          state.snap.flick = null;
          state.snap.deferredIndex = null;
          state.snap.index = index;
          const element = state.element;
          const offset = snapAlignmentOffset(state, items[index], axis);
          const metrics = nativeMetrics(element);
          const destination = axis === "x" ? Math.max(0, Math.min(metrics.maxX, element.scrollLeft + offset)) : Math.max(0, Math.min(metrics.maxY, element.scrollTop + offset));
          state.snap.scrollingToTarget = destination;
          state.snap.scrollingToAxis = axis;
          if (axis === "x") element.scrollTo({ left: destination, behavior });
          else element.scrollTo({ top: destination, behavior });
          if (snapTargetReached(state)) {
            clearSnapTarget(state);
            scheduleScrollEnd(state);
          }
          return true;
        }
        function selectedSnapIndex(state) {
          const items = snapItems(state);
          if (!items.length) return 0;
          const metrics = nativeMetrics(state.element);
          const axis = snapAxis(state);
          const edge = edgeSnapIndex(state, items, axis, metrics);
          return edge === null ? nearestSnapIndex(state, items, axis) : edge;
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
            if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
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
            if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
            const computed = root2.getComputedStyle(wrapper);
            state.elastic.wrapper = wrapper;
            state.elastic.dimensions = null;
            state.elastic.baseTransform = computed.transform === "none" ? "" : computed.transform;
            state.elastic.baseOrigin = computed.transformOrigin;
            elasticMemories.set(wrapper, AelluxJs2.persist.element.save(
              wrapper,
              [],
              ["transform", "transform-origin"]
            ));
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
          if (value === "native" || value === POINTER) return value;
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
          syncScrollbarVisibility(state);
        }
        function restorePointerScrollCursor(state) {
          var _a;
          if (!state.cursor.owned) return;
          (_a = cursorMemories.get(state.element)) == null ? void 0 : _a.restore();
          state.cursor.owned = false;
          syncScrollbarVisibility(state);
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
          const chains = {
            x: pointerAxisChain(chain, axes, "x"),
            y: pointerAxisChain(chain, axes, "y")
          };
          if (!chains.x.some((member) => axes.get(member).x) && !chains.y.some((member) => axes.get(member).y)) return;
          const rect = element.getBoundingClientRect();
          if (event.clientX >= rect.left + element.clientWidth || event.clientY >= rect.top + element.clientHeight) return;
          const previousDown = state.lastPointerDown;
          const time = now();
          state.lastPointerDown = { x: event.clientX, y: event.clientY, time };
          if (previousDown && time - previousDown.time <= POINTER_SCROLL_MULTICLICK_MS && Math.abs(event.clientX - previousDown.x) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX && Math.abs(event.clientY - previousDown.y) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX) return;
          const textOrigin = isTextAtPoint(event.target, event.clientX, event.clientY);
          const selectionAtDown = readSelection();
          const verticalOnly = chains.y.some((member) => axes.get(member).y) && !chains.x.some((member) => axes.get(member).x);
          if (!textOrigin && event.cancelable) event.preventDefault();
          for (const member of /* @__PURE__ */ new Set([...chains.x, ...chains.y])) {
            cancelMomentum(member);
            member.snap.flick = null;
            clearSnapTarget(member);
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
            chains,
            axes,
            styles: [],
            momentumState: null,
            momentumStartX: 0,
            momentumStartY: 0,
            elasticForce: 0,
            startTime: time,
            endTime: null,
            snapStarts: new Map(chain.filter((member) => member.snapEnabled && (chains.x.includes(member) || chains.y.includes(member))).map((member) => {
              return [member, selectedSnapIndex(member)];
            })),
            selectionAtDown,
            verticalOnly,
            selectionReadyTime: textOrigin ? time + TEXT_SELECTION_WAIT_MS : 0,
            selectionWaitTimeout: null,
            pendingMove: null,
            momentumStartTime: time
          };
          activePointerScrollState = state;
          onTarget(root2, POINTER_MOVE_TARGET, state.onPointerMove, { passive: false, capture: true });
          onTarget(
            root2,
            "$touchmove",
            state.onPointerScrollTouchMove,
            { passive: false, capture: true }
          );
          for (const name of pointerScrollDragEvents) {
            onTarget(root2, "$" + name, state.onPointerScrollNativeEvent, true);
          }
          onTarget(root2, "$selectstart", state.onPointerScrollNativeEvent, true);
          for (const name of pointerScrollMouseEvents) {
            onTarget(root2, "$" + name, state.onMouseEvent, { passive: false, capture: true });
          }
          onTarget(root2, POINTER_UP_TARGET, state.onPointerEnd, true);
          onTarget(root2, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
          onTarget(root2, "$blur", state.onBlur);
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
            const chain = pointerScroll.chains[axis2];
            if (!chain.some((member) => pointerAxisMaximum(member, axis2, pointerScroll) > 0)) {
              endPointerScroll(state);
              return;
            }
            pointerScroll.chain = chain;
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
          const allowed = outermost && outermost.elasticEnabled ? elasticAxes(outermost) : null;
          const canStretch = allowed && allowed[axis];
          if (canStretch && pointerScroll.elasticForce) {
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
          if (canStretch) {
            pointerScroll.elasticForce += remaining;
            const element = outermost.element;
            const desiredX = element.scrollLeft + (axis === "x" ? pointerScroll.elasticForce : 0);
            const desiredY = element.scrollTop + (axis === "y" ? pointerScroll.elasticForce : 0);
            applyElasticFromDesired(outermost, desiredX, desiredY, false, axis, allowed);
            scrollWithinElasticBounds(outermost, desiredX, desiredY);
            publish(outermost);
          } else pointerScroll.elasticForce = 0;
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
        function pointerAxisChain(chain, axes, axis) {
          const result = [];
          for (const member of chain) {
            result.push(member);
            if (axes.get(member)[axis === "x" ? "stopX" : "stopY"]) break;
          }
          return result;
        }
        function activatePointerScroll(state, pointerScroll, axis) {
          pointerScroll.axis = axis;
          pointerScroll.moved = true;
          pointerScroll.started = true;
          restorePointerScrollCursor(state);
          for (const member of pointerScroll.chain) {
            if (pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
            const element = member.element;
            pointerScrollMemories.set(element, AelluxJs2.persist.element.save(
              element,
              [],
              ["scroll-behavior"]
            ));
            pointerScroll.styles.push({
              element,
              classOwned: !element.classList.contains(pointerScrollingClass)
            });
            element.style.setProperty("scroll-behavior", "auto", "important");
            element.classList.add(pointerScrollingClass);
            if (member.snapEnabled) suspendSnapStyles(member, POINTER, true);
            startScrollbarInteractionVisibility(member);
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
          var _a;
          const pointerScroll = state.pointerScroll;
          if (!pointerScroll || event && event.pointerId !== pointerScroll.pointerId) return;
          pointerScroll.endTime = now();
          if (event && event.type === POINTER_UP) {
            pointerScroll.lastX = event.clientX;
            pointerScroll.lastY = event.clientY;
          }
          if (event && event.type === POINTER_UP && !pointerScroll.moved && pointerScroll.endTime < pointerScroll.selectionReadyTime && !selectionHasChanged(pointerScroll.selectionAtDown)) {
            const dx = pointerScroll.startX - event.clientX;
            const dy = pointerScroll.startY - event.clientY;
            const axis = pointerScroll.axis || (Math.abs(dx) >= Math.abs(dy) ? "x" : "y");
            const chain = pointerScroll.chains[axis];
            if (chain.some((member) => member.snapEnabled && snapAxis(member) === axis && pointerAxisMaximum(member, axis, pointerScroll) > 0) && isSnapFlick(pointerScroll, axis)) {
              pointerScroll.chain = chain;
              pointerScroll.axis = axis;
              pointerScroll.moved = true;
            }
          }
          state.pointerScroll = null;
          if (activePointerScrollState === state) activePointerScrollState = null;
          if (pointerScroll.selectionWaitTimeout !== null)
            root2.clearTimeout(pointerScroll.selectionWaitTimeout);
          offTarget(root2, POINTER_MOVE_TARGET, state.onPointerMove, true);
          offTarget(root2, "$touchmove", state.onPointerScrollTouchMove, true);
          for (const name of pointerScrollDragEvents) {
            offTarget(root2, "$" + name, state.onPointerScrollNativeEvent, true);
          }
          offTarget(root2, "$selectstart", state.onPointerScrollNativeEvent, true);
          offTarget(root2, POINTER_UP_TARGET, state.onPointerEnd, true);
          offTarget(root2, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
          offTarget(root2, "$blur", state.onBlur);
          if (pointerScroll.moved && !state.disposed) {
            state.mouseReleaseButton = pointerScroll.button;
            if (state.mouseReleaseTimeout !== null) root2.clearTimeout(state.mouseReleaseTimeout);
            state.mouseReleaseTimeout = root2.setTimeout(() => stopPointerScrollMouseEvents(state), 0);
          } else {
            stopPointerScrollMouseEvents(state);
          }
          for (const saved of pointerScroll.styles) {
            if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
            (_a = pointerScrollMemories.get(saved.element)) == null ? void 0 : _a.restore();
            pointerScrollMemories.delete(saved.element);
            const member = scrollboxes.get(saved.element);
            if (member) {
              suspendSnapStyles(member, POINTER, false);
              scheduleScrollbarInteractionHide(member);
            }
          }
          if (event && event.type === POINTER_UP && state.pointerListening) {
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
          const shouldSnap = event && event.type === POINTER_UP && pointerScroll.moved && snapState && !snapState.disposed && snapItems(snapState).length;
          if (shouldSnap) {
            recordSnapFlick(
              snapState,
              pointerScroll,
              pointerScroll.axis,
              pointerScroll.snapStarts.get(snapState)
            );
            scheduleScrollEnd(snapState);
          }
          for (const member of pointerScroll.chain) releaseElastic(member);
          if (!shouldSnap && event && event.type === POINTER_UP && pointerScroll.moved && momentumState && momentumState.momentumEnabled && !hadElastic && !momentumState.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
            startMomentum(momentumState, pointerScroll);
          }
        }
        function recordSnapFlick(state, gesture, axis, startIndex) {
          if (!state.snapEnabled || snapAxis(state) !== axis || !Number.isInteger(startIndex) || !isSnapFlick(gesture, axis)) return;
          const distance = axis === "x" ? gesture.startX - gesture.lastX : gesture.startY - gesture.lastY;
          const items = snapItems(state);
          const index = Math.max(0, Math.min(
            items.length - 1,
            startIndex + Math.sign(distance)
          ));
          if (index !== startIndex) {
            state.snap.flick = { axis, index };
          }
        }
        function isSnapFlick(pointerScroll, axis) {
          const distance = axis === "x" ? pointerScroll.startX - pointerScroll.lastX : pointerScroll.startY - pointerScroll.lastY;
          const elapsed = Math.max(1, pointerScroll.endTime - pointerScroll.startTime);
          return elapsed <= SNAP_FLICK_WINDOW_MS && Math.abs(distance) > SNAP_FLICK_MIN_DISTANCE_PX && Math.abs(distance) < SNAP_FLICK_MAX_DISTANCE_PX && (elapsed <= SNAP_FLICK_FAST_TIME_MS || Math.abs(distance) / elapsed >= SNAP_SWIPE_SPEED_PX_MS);
        }
        function flushPendingSnap(state) {
          if (state.snapEnabled && !state.disposed) scheduleScrollEnd(state);
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
            offTarget(root2, "$" + name, state.onMouseEvent, true);
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
          setListeners(state.element, state, touchListeners, true);
          state.touchListening = true;
        }
        function removeTouchListeners(state) {
          setListeners(state.element, state, touchListeners, false);
          state.touchListening = false;
          state.elastic.touch = null;
        }
        function startTouch(state, event) {
          if (event.target.closest(
            `[${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`
          )) return;
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
        function elasticAxes(state) {
          const style = root2.getComputedStyle(state.element);
          return {
            x: style.overscrollBehaviorX !== "none",
            y: style.overscrollBehaviorY !== "none"
          };
        }
        function applyElasticFromDesired(state, desiredX, desiredY, additive, axis = null, allowed = elasticAxes(state)) {
          if (!state.elasticEnabled) return false;
          const element = state.element;
          const metrics = state.metrics || nativeMetrics(element);
          const elastic = state.elastic;
          const amounts = [0, 0, 0, 0];
          if (axis !== "x" && allowed.y && metrics.maxY > 1) {
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
          if (axis !== "y" && allowed.x && metrics.maxX > 1) {
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
          if (active) suspendSnapStyles(state, "elastic", true);
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
              elasticMemories.get(wrapper).cssProperties["transform-origin"].priority
            );
          }
          wrapper.style.setProperty(
            "transform",
            [scale, translate, elastic.baseTransform].filter(Boolean).join(" ") || "none",
            elasticMemories.get(wrapper).cssProperties.transform.priority
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
          if (AelluxJs2.currentPreference("reduced-motion") === "reduced") {
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
          publish(state);
          elastic.releaseFrame = root2.requestAnimationFrame(() => stepElasticRelease(state));
        }
        function resetElastic(state) {
          var _a;
          const elastic = state.elastic;
          const wasOwned = elastic.owned;
          if (elastic.releaseFrame !== null) root2.cancelAnimationFrame(elastic.releaseFrame);
          if (elastic.wheelTimeout !== null) root2.clearTimeout(elastic.wheelTimeout);
          elastic.releaseFrame = null;
          elastic.wheelTimeout = null;
          if (elastic.wrapper) elastic.wrapper.classList.remove(elasticReleaseClass);
          if (elastic.owned && elastic.wrapper) {
            (_a = elasticMemories.get(elastic.wrapper)) == null ? void 0 : _a.restore();
          }
          elastic.amounts = [0, 0, 0, 0];
          elastic.active = false;
          elastic.owned = false;
          if (wasOwned && !state.disposed) {
            suspendSnapStyles(state, "elastic", false);
            if (state.snap.deferredIndex !== null) {
              const index = state.snap.deferredIndex;
              state.snap.deferredIndex = null;
              scrollToSnap(state, index);
            }
          }
          if (wasOwned && !state.disposed) publish(state);
        }
        function observe(state) {
          state.onResize = () => scheduleResize(state);
          onTarget(root2, "$resize", state.onResize, { passive: true });
          if (root2.matchMedia) {
            state.desktopMedia = root2.matchMedia("(hover: hover) and (pointer: fine)");
            state.onDesktopMediaChange = () => configure(state);
            if (state.desktopMedia.addEventListener)
              state.desktopMedia.addEventListener("change", state.onDesktopMediaChange);
            else if (state.desktopMedia.addListener)
              state.desktopMedia.addListener(state.onDesktopMediaChange);
          }
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
              if (records.some((record) => record.type === "attributes" || record.target === state.element || record.target === state.elastic.wrapper || [...record.addedNodes, ...record.removedNodes].some((node) => node.nodeType === 1 && (node.hasAttribute(snapItemAttribute) || node.querySelector(`[${snapItemAttribute}]`))))) configure(state);
              else refresh(state);
            });
            state.mutationObserver.observe(
              state.element,
              {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: [
                  snapAttribute,
                  snapItemAttribute,
                  elasticAttribute,
                  scrollbarAttribute
                ]
              }
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
          const stopsChain = (value) => value === "contain" || value === "none";
          return {
            x: metrics.maxX > 1 && available(style.overflowX),
            y: metrics.maxY > 1 && available(style.overflowY),
            stopX: available(style.overflowX) && stopsChain(style.overscrollBehaviorX),
            stopY: available(style.overflowY) && stopsChain(style.overscrollBehaviorY)
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
            const axes = bars ? wheelAxes(state, metrics) : null;
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
              snapAxis: state.snapEnabled ? snapAxis(state) : null,
              snapValues: state.snapEnabled ? measureSnapValues(state) : [],
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
              if (values.snapAxis && state.snap.axis !== values.snapAxis)
                syncSnapStyles(state, values.snapAxis);
              for (const { item, viewport, focus } of values.snapValues) {
                if (!state.snap.savedItems.has(item)) {
                  snapItemMemories.set(item, AelluxJs2.persist.element.save(item, [], snapProperties));
                  state.snap.savedItems.add(item);
                }
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
        function measureSnapValues(state) {
          const element = state.element;
          const rect = element.getBoundingClientRect();
          const axis = snapAxis(state);
          const size = axis === "x" ? element.clientWidth : element.clientHeight;
          if (!size) return [];
          const center = axis === "x" ? rect.left + element.clientLeft + size / 2 : rect.top + element.clientTop + size / 2;
          return snapItems(state).map((item) => {
            const box = item.getBoundingClientRect();
            const itemCenter = axis === "x" ? box.left + box.width / 2 : box.top + box.height / 2;
            const viewport = Math.max(-2, Math.min(2, (itemCenter - center) * 2 / size));
            const focus = Math.max(0, 1 - Math.abs(snapAlignmentOffset(state, item, axis, rect, box)) / size);
            return { item, viewport, focus };
          });
        }
        function progress(position, distance) {
          return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
        }
        function handleSnapWheel(state, event) {
          if (!state.snapEnabled) return false;
          const axis = snapAxis(state);
          const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
          const delta = axis === "x" ? horizontal ? event.deltaX : state.wheelEnabled ? event.deltaY : 0 : horizontal ? 0 : event.deltaY;
          if (!delta) return false;
          const items = snapItems(state);
          if (!items.length) {
            if (event.cancelable) event.preventDefault();
            return true;
          }
          const metrics = nativeMetrics(state.element);
          const edge = edgeSnapIndex(state, items, axis, metrics);
          const index = edge !== null ? edge : state.snap.scrollingToTarget !== -1 ? state.snap.index : selectedSnapIndex(state);
          const next2 = index + Math.sign(delta);
          if (next2 < 0 || next2 >= items.length) {
            if (state.snap.scrollingToTarget !== -1) {
              if (event.cancelable) event.preventDefault();
              return true;
            }
            suspendSnapForEdgeWheel(state);
            const position = axis === "x" ? state.element.scrollLeft : state.element.scrollTop;
            const maximum = axis === "x" ? metrics.maxX : metrics.maxY;
            if (delta < 0 ? position <= 1 : position >= maximum - 1) {
              const style = root2.getComputedStyle(state.element);
              const behavior = horizontal ? style.overscrollBehaviorX : style.overscrollBehaviorY;
              if (behavior === "contain" || behavior === "none") event.preventDefault();
            }
            return false;
          }
          clearEdgeWheelSuspension(state);
          if (event.cancelable) event.preventDefault();
          if (state.scrollbar.drag || state.snap.suspensions.elastic) return true;
          const busy = state.snap.wheelTimeout !== null;
          scheduleSnapWheelIdle(state);
          if (busy) return true;
          scrollToSnap(state, next2, axis);
          return true;
        }
        function handleWheel(state, event) {
          if (event.ctrlKey || !event.cancelable) return;
          state.snap.flick = null;
          if (state.desktop && state.mode === POINTER && state.element.classList.contains(pointerScrollingClass)) {
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();
            return;
          }
          cancelMomentum(state);
          if (event.defaultPrevented) return;
          if (event.target.closest(`[${attribute}]`) !== state.element) return;
          if (handleSnapWheel(state, event)) return;
          const interruptedSnap = state.snap.scrollingToTarget !== -1;
          clearSnapTarget(state);
          clearScrollEnd(state);
          if (interruptedSnap && state.snapEnabled) scheduleScrollEnd(state);
          const metrics = nativeMetrics(state.element);
          if (!metrics) return;
          const axes = wheelAxes(state, metrics);
          const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
          const converted = state.desktop && state.wheelEnabled && axes.x && !axes.y && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
          const deltaX = (converted ? event.deltaY : event.deltaX) * factor;
          const deltaY = (converted ? 0 : event.deltaY) * factor;
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
              if (!state.snapEnabled) event.preventDefault();
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
        const elementMemories = /* @__PURE__ */ new WeakMap();
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
        const ariaHandlers = /* @__PURE__ */ new WeakMap();
        let managedClasses;
        let sizeThresholds = [];
        let updateTimeout = null;
        let lastUpdateTime = -UPDATE_INTERVAL_MS;
        const resizeObserver = typeof root2.ResizeObserver === "function" ? new root2.ResizeObserver(onResize) : null;
        AelluxJs2.extAttach(extensionName, { init, destroy, adaptiveParams });
        function init(options = {}) {
          AelluxJs2.registerCssProperty(
            { name: "--ae-width", syntax: "<number>", initialValue: "0" },
            { name: "--ae-height", syntax: "<number>", initialValue: "0" }
          );
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
          elementMemories.set(element, AelluxJs2.persist.element.save(
            element,
            [],
            dimensionProperties
          ));
          ariaHandlers.set(element, AelluxJs2.aria.register(element));
          adaptiveElements.add(element);
          if (resizeObserver) resizeObserver.observe(element);
          else {
            AelluxJs2.waitLayout.read(readBounds, [element]);
            if (adaptiveElements.size === 1) AelluxJs2.onTarget(root2, "$resize", onWindowResize);
          }
        }
        function unmountAdaptive(element) {
          var _a, _b;
          if (!adaptiveElements.delete(element)) return;
          pendingResizeEntries.delete(element);
          pendingResizeElements.delete(element);
          if (resizeObserver) resizeObserver.unobserve(element);
          else if (adaptiveElements.size === 0) AelluxJs2.offTarget(root2, "$resize", onWindowResize);
          for (const name of managedClasses) {
            element.classList.remove(name);
          }
          (_a = ariaHandlers.get(element)) == null ? void 0 : _a.release();
          ariaHandlers.delete(element);
          (_b = elementMemories.get(element)) == null ? void 0 : _b.restore();
          elementMemories.delete(element);
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
          var _a;
          if (!adaptiveElements.has(element)) return;
          const ratio = height > 0 ? width / height : 0;
          (_a = ariaHandlers.get(element)) == null ? void 0 : _a.set({
            orientation: height > width ? "vertical" : "horizontal"
          });
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
        const POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", DEFAULT_PRESENT = "opacity transform height width", OPACITY_SYNTAX = "<number> | <percentage>", TRANSFORM_SYNTAX = "<transform-list> | none";
        const TRANSITION_PREPARE_TIME = 100;
        const presentElements = /* @__PURE__ */ new Map();
        const openPresentElements = /* @__PURE__ */ new Set();
        const triggerElementsSet = /* @__PURE__ */ new Set();
        const triggerTargets = /* @__PURE__ */ new Map();
        const triggersByTargetId = /* @__PURE__ */ new Map();
        const indexedTriggerValues = /* @__PURE__ */ new Map();
        const elementMemories = /* @__PURE__ */ new WeakMap();
        const containerAriaHandlers = /* @__PURE__ */ new WeakMap();
        const triggerAriaHandlers = /* @__PURE__ */ new WeakMap();
        const measuredMemories = /* @__PURE__ */ new WeakMap();
        const cssProperties = [
          ["from-opacity", OPACITY_SYNTAX, "0"],
          ["pop-opacity", OPACITY_SYNTAX, "1"],
          ["unpop-opacity", OPACITY_SYNTAX, "0"],
          ["from-transform", TRANSFORM_SYNTAX, "scale(0.5)"],
          ["pop-transform", TRANSFORM_SYNTAX, "scale(1)"],
          ["unpop-transform", TRANSFORM_SYNTAX, "scale(1.2)"],
          ["from-height", "*", "0fr"],
          ["pop-height", "*", "1fr"],
          ["unpop-height", "*", "0fr"],
          ["from-width", "*", "0fr"],
          ["pop-width", "*", "1fr"],
          ["unpop-width", "*", "0fr"],
          ["pop-ease", "*", "ease-out"],
          ["unpop-ease", "*", "ease-in"],
          ["pop-duration", "<time>", "250ms"],
          ["unpop-duration", "<time>", "250ms"],
          ["pop-low-steps", "<integer>", "4"],
          ["unpop-low-steps", "<integer>", "4"]
        ];
        function init(options) {
          AelluxJs2.registerCssProperty(
            ...cssProperties.map(([name, syntax, initialValue]) => ({ name: `--ae-${name}`, syntax, initialValue }))
          );
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
          AelluxJs2.on("$click", OnClick);
        }
        function destroy() {
          AelluxJs2.mountManager.remove({ extensionName });
          AelluxJs2.off("$click", OnClick);
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
          elementMemories.set(element, AelluxJs2.persist.element.save(
            element,
            [attr.present, attr.presentMotion, "hidden"],
            ["--ae-pop-low-steps", "--ae-unpop-low-steps"]
          ));
          containerAriaHandlers.set(element, AelluxJs2.aria.register(element));
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
            motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
            transition: null,
            autoUnpopTimeout: null,
            direction: null,
            classList: element.classList,
            triggers: /* @__PURE__ */ new Set(),
            setAriaExpanded: function(value) {
              this.expanded = value === "true";
              containerAriaHandlers.get(element).set({ expanded: this.expanded });
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
          var _a, _b;
          if (!presentElements.has(element)) return;
          const controller = presentElements.get(element);
          controller.stop();
          element.classList.remove(className.grid);
          presentElements.delete(element);
          openPresentElements.delete(element);
          (_a = containerAriaHandlers.get(element)) == null ? void 0 : _a.release();
          containerAriaHandlers.delete(element);
          (_b = elementMemories.get(element)) == null ? void 0 : _b.restore();
          elementMemories.delete(element);
          controller.triggers.forEach(updateTriggerAriaExpanded);
        }
        function mountTriggerElement(triggerElement) {
          if (triggerElementsSet.has(triggerElement)) return;
          triggerAriaHandlers.set(triggerElement, AelluxJs2.aria.register(triggerElement));
          triggerElementsSet.add(triggerElement);
          refreshTriggerTargets(triggerElement);
        }
        function unmountTriggerElement(triggerElement) {
          var _a, _b;
          if (!triggerElementsSet.has(triggerElement)) return;
          const target = triggerTargets.get(triggerElement);
          if (target) {
            (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
            triggerTargets.delete(triggerElement);
          }
          unindexTriggerTarget(triggerElement);
          triggerElementsSet.delete(triggerElement);
          (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.release();
          triggerAriaHandlers.delete(triggerElement);
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
          var _a, _b, _c, _d, _e;
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
            (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.unset("expanded");
            (_c = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _c.unset("controls");
            return;
          }
          triggerTargets.set(triggerElement, target);
          (_d = presentElements.get(target)) == null ? void 0 : _d.triggers.add(triggerElement);
          const targetIds = /* @__PURE__ */ new Set([target.id]);
          const initial = (_e = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _e.initial("controls");
          if (initial) {
            initial.trim().split(/\s+/).forEach((x) => targetIds.add(x));
          }
          updateTriggerAriaExpanded(triggerElement);
          triggerAriaHandlers.get(triggerElement).set({ controls: [...targetIds] });
        }
        function updateTriggerAriaExpanded(triggerElement) {
          var _a, _b;
          const target = triggerTargets.get(triggerElement);
          if (!target) return;
          const expanded = ((_a = presentElements.get(target)) == null ? void 0 : _a.expanded) === true;
          (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.set({ expanded });
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
          const memory = measuredMemories.get(element);
          if (!memory) return;
          memory.restore();
          measuredMemories.delete(element);
        }
        async function prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation) {
          if (!controller.measuredHeight && !controller.measuredWidth) return null;
          if (!measuredMemories.has(element)) {
            measuredMemories.set(element, AelluxJs2.persist.element.save(
              element,
              [],
              ["max-height", "max-width"]
            ));
          }
          measuredMemories.get(element).restore();
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
            AelluxJs2.dispatchFrom(element, "Layout", {
              detail: {
                origin: `present.${newDirection}`.toLowerCase(),
                durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
              },
              bubbles: true
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
        root2.AelluxJs.onTarget(element, event, handler, options);
      },
      off(event, handler, options) {
        root2.AelluxJs.offTarget(element, event, handler, options);
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
    const UNMOUNT = "unmount";
    const { toCapitalized: toCapitalized2, toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const pendingMounts = /* @__PURE__ */ new WeakMap();
    const pendingUnmounts = /* @__PURE__ */ new WeakMap();
    const mountRecords = /* @__PURE__ */ new WeakMap();
    let mountOrder = 0;
    const classPrefix = root2.AelluxJs.className("");
    return { mount, unmount, unmountDetached, update };
    async function update(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, "update");
      if (!rootElement) return false;
      await AelluxJsMounted(rootElement, "update", extensionNames);
      return true;
    }
    async function unmount(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, UNMOUNT);
      if (!rootElement) return false;
      await AelluxJsMounted(rootElement, UNMOUNT, extensionNames);
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
      await AelluxJsMounted(root2.document, UNMOUNT, null, true);
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
              setMounted(mountable, mountId, true, controller.priority);
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
      const registrations = [];
      for (const [element, mountIds] of Array.from(mountedElements)) {
        const inRoot = element === rootElement || rootElement.contains(element);
        const detachedInGlobalUnmount = method === UNMOUNT && rootElement === root2.document && !element.isConnected;
        if (detachedOnly ? element.isConnected || hasPendingMounts(element) : !inRoot && !detachedInGlobalUnmount) continue;
        for (const mountId of Array.from(mountIds)) {
          const separator = mountId.indexOf("@");
          const extensionName = mountId.slice(0, separator);
          const selector = mountId.slice(separator + 1);
          if (selectedNames && !selectedNames.has(extensionName)) continue;
          const extensionKey = toCamelCase2(extensionName);
          const mounter = mountMaps.get(extensionKey);
          const controller = mounter && mounter.get(selector);
          if (method === UNMOUNT) {
            registrations.push({ element, mountId, controller, extensionName, selector });
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
      if (method === UNMOUNT) {
        registrations.sort(compareUnmountOrder);
        for (const { element, mountId, controller, extensionName, selector } of registrations) {
          if (await unmountRegistration(element, mountId, controller, extensionName, selector))
            affected.add(element);
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
            method: UNMOUNT,
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
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
            cause,
            extension: extensionName,
            method: UNMOUNT,
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
      const registrations = Array.from(mountedElements.get(element) || [], (mountId) => {
        const separator = mountId.indexOf("@");
        const extensionName = mountId.slice(0, separator);
        const selector = mountId.slice(separator + 1);
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        const controller = mounter && mounter.get(selector);
        return { element, mountId, controller, extensionName, selector };
      });
      registrations.sort(compareUnmountOrder);
      for (const { mountId, controller, extensionName, selector } of registrations) {
        await unmountRegistration(element, mountId, controller, extensionName, selector);
      }
    }
    function compareUnmountOrder(left, right) {
      var _a, _b, _c, _d, _e, _f;
      const leftRecord = (_a = mountRecords.get(left.element)) == null ? void 0 : _a.get(left.mountId);
      const rightRecord = (_b = mountRecords.get(right.element)) == null ? void 0 : _b.get(right.mountId);
      return ((_c = rightRecord == null ? void 0 : rightRecord.priority) != null ? _c : 0) - ((_d = leftRecord == null ? void 0 : leftRecord.priority) != null ? _d : 0) || ((_e = rightRecord == null ? void 0 : rightRecord.order) != null ? _e : 0) - ((_f = leftRecord == null ? void 0 : leftRecord.order) != null ? _f : 0);
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
    function setMounted(element, mountId, mounted = true, priority = 0) {
      if (!mountedElements.has(element)) {
        mountedElements.set(element, /* @__PURE__ */ new Set());
      }
      const mounts = mountedElements.get(element);
      mounts[mounted ? "add" : "delete"](mountId);
      let records = mountRecords.get(element);
      if (mounted) {
        if (!records) {
          records = /* @__PURE__ */ new Map();
          mountRecords.set(element, records);
        }
        records.set(mountId, { priority, order: mountOrder++ });
      } else if (records) {
        records.delete(mountId);
        if (!records.size) mountRecords.delete(element);
      }
      if (mounts.size === 0) mountedElements.delete(element);
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

  // src/internal/create-aria-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createAriaHelper() {
    const elements = /* @__PURE__ */ new WeakMap();
    let nextOrder = 0;
    function attributeName(name) {
      if (typeof name !== "string" || !/^(?:aria-)?[a-z][a-z0-9-]*$/.test(name)) {
        throw new TypeError("Invalid ARIA name");
      }
      return name.startsWith("aria-") ? name : `aria-${name}`;
    }
    function attributeValue(name, value) {
      if (value === null || value === void 0) {
        throw new TypeError("Use unset() for null");
      }
      if (Array.isArray(value)) {
        return value.join(" ");
      }
      if (name === "aria-hidden" && typeof value !== "boolean") {
        throw new TypeError("Invalid aria-hidden value");
      }
      return String(value);
    }
    function write(element, name, value) {
      if (value === null) {
        if (element.hasAttribute(name)) element.removeAttribute(name);
      } else if (element.getAttribute(name) !== value) {
        element.setAttribute(name, value);
      }
    }
    function reconcile(element, record, name) {
      var _a;
      let winner = null;
      let hidden = false;
      record.handlers.forEach((handler) => {
        if (!handler.values.has(name)) return;
        if (name === "aria-hidden" && handler.values.get(name) === "true") hidden = true;
        if (!winner || handler.priority > winner.priority || handler.priority === winner.priority && handler.order > winner.order) {
          winner = handler;
        }
      });
      if (!winner) {
        write(element, name, (_a = record.baseline.get(name)) != null ? _a : null);
        record.baseline.delete(name);
        return;
      }
      write(element, name, name === "aria-hidden" && hidden ? "true" : winner.values.get(name));
    }
    function register(element, options = {}) {
      if (!element || element.nodeType !== 1) {
        throw new TypeError("Invalid ARIA element");
      }
      const priority = options.priority === void 0 ? 0 : options.priority;
      if (typeof priority !== "number" || !Number.isFinite(priority)) {
        throw new TypeError("Invalid ARIA priority");
      }
      let record = elements.get(element);
      if (!record) {
        record = { handlers: /* @__PURE__ */ new Set(), baseline: /* @__PURE__ */ new Map() };
        elements.set(element, record);
      }
      const handler = { priority, order: nextOrder++, values: /* @__PURE__ */ new Map() };
      record.handlers.add(handler);
      let released = false;
      return {
        set(values) {
          if (released) return false;
          if (!values || typeof values !== "object") {
            throw new TypeError("Invalid ARIA values");
          }
          const updates = Object.entries(values).map(([key, value]) => {
            const name = attributeName(key);
            return [name, attributeValue(name, value)];
          });
          updates.forEach(([name, value]) => {
            if (!record.baseline.has(name)) record.baseline.set(name, element.getAttribute(name));
            handler.values.set(name, value);
            reconcile(element, record, name);
          });
          return true;
        },
        unset(key) {
          if (released) return false;
          const name = attributeName(key);
          if (!handler.values.delete(name)) return false;
          reconcile(element, record, name);
          return true;
        },
        initial(key) {
          const name = attributeName(key);
          return record.baseline.has(name) ? record.baseline.get(name) : element.getAttribute(name);
        },
        release() {
          if (released) return false;
          released = true;
          record.handlers.delete(handler);
          handler.values.forEach((_, name) => reconcile(element, record, name));
          handler.values.clear();
          if (!record.handlers.size) elements.delete(element);
          return true;
        }
      };
    }
    return { register };
  }

  // src/aellux.orchestrator.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root2) {
    "use strict";
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const extensionPromises = {};
    const aria = createAriaHelper();
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
            const startCallback = function() {
              if (AelluxJs.options.skipGlobalMount === true) {
                AelluxJs.off("$DOMContentLoaded", startCallback);
                resolve();
                return;
              }
              AelluxJs.mount().then(function() {
                AelluxJs.off("$DOMContentLoaded", startCallback);
                resolve();
              });
            };
            if (document.readyState === "loading")
              AelluxJs.on("$DOMContentLoaded", startCallback, { once: true });
            else
              startCallback();
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
        aria,
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
