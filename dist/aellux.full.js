(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };
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

  // src/internal/sample-css-easing.js
  function sampleCssEasing(api, name) {
    const points = [];
    const round = (value) => Math.round(value * 1e5) / 1e5;
    try {
      for (let index = 0; index <= 60; index++) {
        const progress = index / 60;
        const value = api.ease(name, progress);
        if (!Number.isFinite(value)) return null;
        points.push(`${round(value)} ${round(progress * 100)}%`);
      }
    } catch (_) {
      return null;
    }
    return `linear(${points.join(", ")})`;
  }
  var init_sample_css_easing = __esm({
    "src/internal/sample-css-easing.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
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
        const aelluxJs2 = root2.aelluxJs;
        const { toCamelCase: toCamelCase2 } = utils_name_case_default;
        const extensionName = "preference";
        if (!aelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const NO_PREFERENCE = "no-preference";
        const userPreferences = /* @__PURE__ */ Object.create(null);
        const defaultPreferences = /* @__PURE__ */ Object.create(null);
        const computedPreferences = /* @__PURE__ */ Object.create(null);
        const containersByPreference = /* @__PURE__ */ new Map();
        const containerPreferences = /* @__PURE__ */ new Map();
        const containerLabels = /* @__PURE__ */ new Map();
        const labelMemories = /* @__PURE__ */ new WeakMap();
        const containerOptionAria = /* @__PURE__ */ new Map();
        aelluxJs2.extAttach(extensionName, { init, destroy, update, get, set });
        const attr = {
          preference: aelluxJs2.attr("preference"),
          option: aelluxJs2.attr("option"),
          label: aelluxJs2.attr("label"),
          next: aelluxJs2.attr("next"),
          prev: aelluxJs2.attr("prev"),
          ready: aelluxJs2.attr("ready")
        };
        const className = {
          active: aelluxJs2.className("active")
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
          aelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attr.preference}]`,
            priority: 0,
            mount: mountPreferenceContainer,
            unmount: unmountPreferenceContainer
          });
          aelluxJs2.onEvent(window, "$storage", storageEvent);
          const allQueries = aelluxJs2.registry.preferenceMediaQueries;
          Object.values(allQueries).forEach(
            (queries) => Object.values(queries).forEach(
              (query) => {
                if (!query) return;
                if (query.addEventListener) {
                  aelluxJs2.onEvent(query, "$change", update);
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
          aelluxJs2.mountManager.remove({ extensionName });
          containersByPreference.clear();
          containerPreferences.clear();
          aelluxJs2.offEvent(window, "$storage", storageEvent);
          aelluxJs2.off("$DOMContentLoaded", update);
          const allQueries = aelluxJs2.registry.preferenceMediaQueries;
          Object.values(allQueries).forEach(
            (queries) => Object.values(queries).forEach(
              (query) => {
                if (!query) return;
                if (query.removeEventListener) {
                  aelluxJs2.offEvent(query, "$change", update);
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
          aelluxJs2.updatePreferenceAttributesHTML(computedPreferences);
          for (const container of containerPreferences.keys()) {
            if (indexContainer(container)) updateContainer(container);
          }
          for (const key of changed) {
            const containers = containersByPreference.get(key);
            if (containers) for (const container of containers) updateContainer(container);
          }
          aelluxJs2.dispatch("PreferencesChange", {
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
        function isOptionButton(element) {
          const role = element.getAttribute("role");
          if (role) return role === "button";
          return element.tagName === "BUTTON" || element.tagName === "INPUT" && /^(button|submit|reset)$/.test(element.type);
        }
        function updateContainer(container) {
          const preference = container.getAttribute(attr.preference);
          const elements = container.querySelectorAll(`[${attr.option}]`);
          const labels = container.querySelectorAll(`[${attr.label}]`);
          const currentValue = get(preference || "");
          let optionAria = containerOptionAria.get(container);
          if (!optionAria) containerOptionAria.set(container, optionAria = /* @__PURE__ */ new Map());
          for (const [element, handler] of optionAria) {
            if (!container.contains(element) || !element.hasAttribute(attr.option) || !isOptionButton(element)) {
              handler.release();
              optionAria.delete(element);
            }
          }
          labels.forEach((label) => {
            let ownedLabels = containerLabels.get(container);
            if (!ownedLabels) {
              ownedLabels = /* @__PURE__ */ new Set();
              containerLabels.set(container, ownedLabels);
            }
            if (!ownedLabels.has(label)) {
              labelMemories.set(label, aelluxJs2.persist.element.save(label, ["hidden"], []));
              ownedLabels.add(label);
            }
            const value = label.getAttribute(attr.label);
            const selected = String(value) === String(currentValue);
            label.hidden = !selected;
          });
          elements.forEach((element) => {
            const value = element.getAttribute(attr.option);
            const selected = String(value) === String(currentValue);
            element.classList.toggle(className.active, selected);
            if (isOptionButton(element)) {
              if (!optionAria.has(element)) optionAria.set(element, aelluxJs2.aria.register(element));
              optionAria.get(element).set({ pressed: selected });
            }
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
          aelluxJs2.persist.preferences.setObject(userPreferences);
        }
        function loadUserPreferences() {
          Object.assign(userPreferences, aelluxJs2.persist.preferences.getObject());
        }
        function mountPreferenceContainer(container) {
          indexContainer(container);
          updateContainer(container);
          aelluxJs2.onEvent(container, "$click", onContainerClick);
        }
        function unmountPreferenceContainer(container) {
          var _a;
          aelluxJs2.offEvent(container, "$click", onContainerClick);
          const optionAria = containerOptionAria.get(container);
          if (optionAria) for (const handler of optionAria.values()) handler.release();
          containerOptionAria.delete(container);
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
        const aelluxJs2 = root2.aelluxJs;
        const extensionName = "state-navigation";
        if (!aelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const PUSH_AJAX_REPLACE = "PushAjaxReplace", UPDATE_BASE_TITLE = "UpdateBaseTitle";
        const globalSnapshot = {};
        aelluxJs2.extAttach(extensionName, {
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
          aelluxJs2.onEvent(window, "$popstate", onPopState);
          aelluxJs2.onEvent(window, "$hashchange", onHashChange);
          aelluxJs2.on("PushState", OnPushState);
          aelluxJs2.on(PUSH_AJAX_REPLACE, OnPushAjaxReplace);
          aelluxJs2.on(UPDATE_BASE_TITLE, OnUpdateBaseTitle);
          if ("useHash" in aelluxJs2.options)
            useHash = aelluxJs2.options.useHash;
          baseTitle = document.title;
          onHashChange();
          history.replaceState(mergeHistoryState({
            aelluxJsState: true,
            snapshot: Object.assign({}, globalSnapshot)
          }), "");
        }
        async function destroy() {
          aelluxJs2.offEvent(window, "$popstate", onPopState);
          aelluxJs2.offEvent(window, "$hashchange", onHashChange);
          aelluxJs2.off("PushState", OnPushState);
          aelluxJs2.off(PUSH_AJAX_REPLACE, OnPushAjaxReplace);
          aelluxJs2.off(UPDATE_BASE_TITLE, OnUpdateBaseTitle);
        }
        function updateBaseTitle(title = null) {
          baseTitle = title != null ? title : baseTitle;
          document.title = globalSnapshot.title || false ? `${globalSnapshot.title} - ${baseTitle}` : baseTitle;
        }
        function setState(key, value, title = void 0, silent = false) {
          return change(key, value, title, silent);
        }
        async function change(key, value, title = void 0, silent = false) {
          try {
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
          } catch (error) {
            aelluxJs2.dispatch("StateNavigationError", {
              detail: { operation: "setState", key, value, title, silent, error }
            });
            throw error;
          }
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
          aelluxJs2.dispatch(name, options);
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
              aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
                extension: extensionName,
                event: "PushState",
                expected: "detail: { key: non-empty string, value: non-empty string, title?: string }"
              });
              return;
            }
            setState(detail.key, detail.value, detail.title).catch((cause) => {
              aelluxJs2.diagnostics.error(aelluxJs2.diagnostics.ERROR_CALLBACK, {
                extension: extensionName,
                event: "PushState",
                cause
              });
            });
          } catch (cause) {
            aelluxJs2.diagnostics.error(aelluxJs2.diagnostics.ERROR_CALLBACK, {
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
              aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
                extension: extensionName,
                event: PUSH_AJAX_REPLACE,
                expected: "detail: { url: non-empty string, selectors: value }"
              });
              return;
            }
            ajaxReplace(detail.url, detail.selectors);
          } catch (cause) {
            aelluxJs2.diagnostics.error(aelluxJs2.diagnostics.ERROR_CALLBACK, {
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
              aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
                extension: extensionName,
                event: UPDATE_BASE_TITLE,
                expected: "detail: { title: string }"
              });
              return;
            }
            updateBaseTitle(detail.title);
          } catch (cause) {
            aelluxJs2.diagnostics.error(aelluxJs2.diagnostics.ERROR_CALLBACK, {
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
        const aelluxJs2 = root2.aelluxJs;
        const extensionName = "feedback";
        if (!aelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        aelluxJs2.extAttach(extensionName, {
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
        const motionOptions = ["shake", "yes", "no", "breathe", "tremble", "pulse", "alert"];
        const feedbackTypes = ["warning", "error", "success", "announce", "busy", "progress", "validate"];
        const handlers = /* @__PURE__ */ new Map();
        const feedbackAttribute = aelluxJs2.attr(extensionName);
        const messageTargetAttribute = aelluxJs2.attr("feedback-message-target");
        const effectTargetAttribute = aelluxJs2.attr("feedback-effect-target");
        const presentTargetAttribute = aelluxJs2.attr("presentTarget");
        const presentSelector = `[${aelluxJs2.attr("present")}]`;
        const mountedFeedback = /* @__PURE__ */ new Map();
        const applications = /* @__PURE__ */ new WeakMap();
        function init() {
          aelluxJs2.comm.handle("feedback.prepare", (request) => {
            const { boundary, feedback, element } = request;
            if (!mountedFeedback.has(boundary) || !boundary.isConnected || !feedback || typeof feedback !== "object") return false;
            applications.set(feedback, applyFeedback(boundary, feedback, element, false));
            return true;
          }, { owner: extensionName });
          aelluxJs2.mountManager.add({
            extensionName,
            selector: `[${feedbackAttribute}]`,
            priority: 0,
            mount: mountFeedback,
            unmount: unmountFeedback,
            controllers: feedbackTypes.concat("send")
          });
        }
        async function destroy() {
          aelluxJs2.comm.removeOwner(extensionName);
          mountedFeedback.clear();
          aelluxJs2.mountManager.remove({ extensionName });
          handlers.clear();
        }
        function mountFeedback(element) {
          mountedFeedback.set(element, {});
          aelluxJs2.onEvent(element, "Feedback", onFeedback);
        }
        function unmountFeedback(element) {
          applications.delete(element);
          mountedFeedback.delete(element);
          aelluxJs2.offEvent(element, "Feedback", onFeedback);
        }
        function onFeedback(event) {
          const element = event.currentTarget;
          const value = element.getAttribute(feedbackAttribute);
          if (value === null) return;
          const list2 = value.trim();
          if (list2) {
            const type = event.detail && event.detail.type;
            const names = list2.split(/\s+/);
            if (!names.includes(type)) {
              return;
            }
          }
          event.stopPropagation();
          if (!event.detail || typeof event.detail !== "object") return;
          const presentTarget = element.getAttribute(presentTargetAttribute);
          const presentElement = presentTarget !== null && presentTarget.trim() && (aelluxJs2.comm.has("present.pop") || aelluxJs2.comm.has("present.pop-next")) ? aelluxJs2.elementOrId(presentTarget) : null;
          if (presentElement == null ? void 0 : presentElement.hasAttribute(aelluxJs2.attr("present-group"))) {
            const preparation = { boundary: element, feedback: event.detail };
            const result = aelluxJs2.comm.request("present.pop-next", {
              group: presentElement,
              preparation: { contract: "feedback.prepare", payload: preparation }
            });
            if (result.handled) {
              const application = applications.get(event.detail);
              Promise.resolve(result.value).then((member) => {
                if (member) requestEffect(element, application);
              }).catch((cause) => aelluxJs2.diagnostics.error(
                aelluxJs2.diagnostics.ERROR_EXTENSION_TRANSITION,
                { cause, extension: extensionName, element: presentElement }
              ));
              return;
            }
          }
          applyFeedback(element, event.detail, element, (messageElement, effectElement) => {
            if (presentTarget !== null) {
              const target = presentElement || !presentTarget.trim() && ((messageElement == null ? void 0 : messageElement.closest(presentSelector)) || (effectElement == null ? void 0 : effectElement.closest(presentSelector)));
              if (target) aelluxJs2.comm.request("present.pop", { element: target });
            }
          });
        }
        function applyFeedback(element, { message, type, motion }, defaultElement = element, presentRequest) {
          const application = { mount: mountedFeedback.get(element) };
          const messageTarget = element.getAttribute(messageTargetAttribute);
          const effectTarget = element.getAttribute(effectTargetAttribute);
          const messageElement = aelluxJs2.elementOrId(messageTarget, { defaultElement });
          const effectElement = aelluxJs2.elementOrId(effectTarget, { defaultElement });
          application.effectElement = effectElement;
          application.motion = motion;
          if (effectElement) applications.set(effectElement, application);
          if (messageElement && typeof message === "string") {
            let textNode = null;
            for (const child of messageElement.childNodes) {
              if (child.nodeType === 3) {
                textNode = child;
                break;
              }
            }
            if (textNode) textNode.nodeValue = message;
            else messageElement.appendChild(messageElement.ownerDocument.createTextNode(message));
          }
          if (feedbackTypes.includes(type)) {
            const typeClass = aelluxJs2.className(`feedback-${type}`);
            for (const target of [element, messageElement, effectElement]) {
              if (target) {
                if (defaultElement !== element) {
                  for (const previous of feedbackTypes) target.classList.remove(aelluxJs2.className(`feedback-${previous}`));
                }
                target.classList.add(typeClass);
              }
            }
          }
          if (typeof presentRequest === "function") presentRequest(messageElement, effectElement);
          if (presentRequest !== false) requestEffect(element, application);
          return application;
        }
        function requestEffect(element, application) {
          if (!application || application.mount !== mountedFeedback.get(element) || !element.isConnected) return;
          const { effectElement, motion } = application;
          if (!(effectElement == null ? void 0 : effectElement.isConnected) || applications.get(effectElement) !== application || typeof motion !== "string") return;
          aelluxJs2.comm.request("present.effect", {
            element: effectElement.closest(presentSelector) || effectElement,
            effect: motion,
            effectTarget: effectElement
          });
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
        function warning(message, target, value, motion) {
          publish("warning", message, target, value, motion);
        }
        function error(message, target, value, motion) {
          publish("error", message, target, value, motion);
        }
        function success(message, target, value, motion) {
          publish("success", message, target, value, motion);
        }
        function announce(message, target, value, motion) {
          publish("announce", message, target, value, motion);
        }
        function busy(message, target, value, motion) {
          publish("busy", message, target, value, motion);
        }
        function validate(message, target, value, motion) {
          publish("validate", message, target, value, motion);
        }
        function progress(message, target, value, motion) {
          publish("progress", message, target, value, motion);
        }
        function publish(type, message, target, value, motion) {
          if (message && message.nodeType === 1) {
            const element = message;
            message = target;
            target = element;
          }
          send({ type, message, value, target, motion });
        }
        function send(input, payload) {
          let { type, message, value, target, motion } = payload || input;
          if (input && input.nodeType === 1) target = input;
          if (typeof message !== "string") {
            reportInvalidArgument("message", message);
            return;
          }
          if (!feedbackTypes.includes(type)) {
            reportInvalidArgument("type", type);
            return;
          }
          if (typeof motion !== "undefined" && typeof motion !== "string") {
            reportInvalidArgument("motion", motion);
            return;
          }
          if (typeof target === "undefined") target = root2.document;
          else if (!target || target.nodeType !== 1 || typeof target.dispatchEvent !== "function") {
            reportInvalidArgument("target", target);
            return;
          }
          if (typeof motion === "string" && !motionOptions.includes(motion)) {
            aelluxJs2.diagnostics.info(aelluxJs2.diagnostics.INFO_FEEDBACK_MOTION_CUSTOM, {
              extension: extensionName,
              motion,
              standardMotions: motionOptions.slice()
            });
          }
          const feedback = { type, message, value, target, motion };
          const options = {
            detail: feedback,
            bubbles: true,
            cancelable: true
          };
          aelluxJs2.dispatchFrom(target, "Feedback", options);
          notifyHandlers(type, feedback);
          notifyHandlers("*", feedback);
        }
        function reportInvalidArgument(argument, value) {
          aelluxJs2.diagnostics.error(aelluxJs2.diagnostics.ERROR_FEEDBACK_ARGUMENT, {
            extension: extensionName,
            argument,
            value
          });
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
          aelluxJs2.diagnostics.error(aelluxJs2.diagnostics.ERROR_CALLBACK, {
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

  // src/internal/input-shortcuts.js
  function parseShortcuts(value) {
    return String(value || "").split(";").map((part) => {
      const match = part.trim().match(/^([a-z][a-z0-9-]*):([^:;\s]+)$/i);
      if (!match) return null;
      const tokens = match[2].split("+");
      const code = tokens.pop();
      const modifiers = tokens.map((token) => token.toLowerCase()).sort();
      if (!code || modifiers.some((token) => !["alt", "ctrl", "meta", "shift"].includes(token)) || new Set(modifiers).size !== modifiers.length) return null;
      return Object.freeze({ source: match[1].toLowerCase(), code, modifiers: Object.freeze(modifiers) });
    }).filter(Boolean);
  }
  function matchesShortcut(shortcut, command) {
    const modifiers = command.modifiers || {};
    return shortcut.source === command.source && shortcut.code === command.code && ["alt", "ctrl", "meta", "shift"].every((name) => !!modifiers[name] === shortcut.modifiers.includes(name));
  }
  function shortcutLabel(shortcut, family = "generic") {
    if (!shortcut) return "";
    const faces = {
      xbox: { south: "A", east: "B", west: "X", north: "Y" },
      playstation: { south: "\xD7", east: "\u25CB", west: "\u25A1", north: "\u25B3" },
      nintendo: { south: "B", east: "A", west: "Y", north: "X" }
    };
    const label = shortcut.source === "keyboard" ? shortcut.code.replace(/^Key(?=[A-Z]$)|^Digit(?=\d$)/g, "") : faces[family] && faces[family][shortcut.code] || shortcut.code;
    return [...shortcut.modifiers.map((name) => name[0].toUpperCase() + name.slice(1)), label].join("+");
  }
  var init_input_shortcuts = __esm({
    "src/internal/input-shortcuts.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
    }
  });

  // src/internal/focus-spatial.js
  function validSpatialRect(rect) {
    return !!rect && [rect.left, rect.top, rect.right, rect.bottom].every(Number.isFinite) && rect.right > rect.left && rect.bottom > rect.top;
  }
  function selectSpatialCandidate(origin, candidates, direction) {
    if (!["left", "right", "up", "down"].includes(direction)) return null;
    const horizontal = direction === "left" || direction === "right";
    const forward = direction === "right" || direction === "down";
    const start = horizontal ? "left" : "top", end = horizontal ? "right" : "bottom";
    const crossStart = horizontal ? "top" : "left", crossEnd = horizontal ? "bottom" : "right";
    if (origin && !validSpatialRect(origin)) return null;
    let best = null, bestScore = null;
    for (const candidate of candidates) {
      const rect = candidate.rect;
      if (!validSpatialRect(rect)) continue;
      let score;
      if (!origin) {
        score = [forward ? rect[start] : -rect[end], rect[crossStart]];
      } else {
        const advance = (rect[start] + rect[end] - (origin[start] + origin[end])) / 2 * (forward ? 1 : -1);
        if (advance <= 0) continue;
        const overlap = Math.min(origin[crossEnd], rect[crossEnd]) - Math.max(origin[crossStart], rect[crossStart]);
        const primaryGap = Math.max(0, forward ? rect[start] - origin[end] : origin[start] - rect[end]);
        const crossGap = Math.max(0, -overlap);
        const crossOffset = Math.abs((rect[crossStart] + rect[crossEnd] - origin[crossStart] - origin[crossEnd]) / 2);
        score = [overlap > 0 ? 0 : 1, primaryGap + crossGap * 3 + crossOffset * 0.1, advance];
      }
      const different = bestScore && score.findIndex((value, index) => value !== bestScore[index]);
      if (!bestScore || different >= 0 && score[different] < bestScore[different]) {
        best = candidate;
        bestScore = score;
      }
    }
    return best;
  }
  var init_focus_spatial = __esm({
    "src/internal/focus-spatial.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
    }
  });

  // src/aellux.ext.focus.js
  var aellux_ext_focus_exports = {};
  var init_aellux_ext_focus = __esm({
    "src/aellux.ext.focus.js"() {
      init_input_shortcuts();
      init_focus_spatial();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const aelluxJs2 = root2.aelluxJs;
        const extensionName = "focus";
        if (!aelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        aelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          restoreLastFocus,
          createContext,
          destroyContext,
          getContext,
          setFocus,
          updateContext,
          eligibleShortcuts,
          registerShortcutAction
        });
        const attribute = aelluxJs2.attr(extensionName);
        const snapshotKey = "ae-focus";
        const entries = [];
        const hintMemories = /* @__PURE__ */ new WeakMap();
        const nextElements = /* @__PURE__ */ new WeakSet();
        const textEntrySelector = "input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])";
        const focusableSelector = "a[href], area[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])";
        let current = null, restoring = false;
        const contexts = /* @__PURE__ */ new Map();
        const shortcutActions = /* @__PURE__ */ new Map();
        let contextObserver = null;
        const scopeSelector = `[${aelluxJs2.attr("focus-scope")}], dialog, [aria-modal="true"]`;
        const navAttribute = aelluxJs2.attr("focus-nav");
        const keyboardWidgetSelector = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="scrollbar"], [role="tablist"], [role="tab"], [role="menu"], [role="menubar"], [role="menuitem"], [role="listbox"], [role="option"], [role="grid"], [role="treegrid"], [role="tree"], [role="treeitem"], [role="radiogroup"], [role="radio"], [role="toolbar"], audio[controls], video[controls]';
        const focusClasses = [null, aelluxJs2.className("focus-player1"), aelluxJs2.className("focus-player2"), aelluxJs2.className("focus-player3")];
        const focusClass = (id) => focusClasses[id] || aelluxJs2.className("focus-player" + id);
        function init() {
          createContext(1);
          aelluxJs2.comm.handle("focus.command", consumeCommand, { owner: extensionName });
          aelluxJs2.comm.handle("focus.context", ({ focusId }) => getContext(focusId), { owner: extensionName });
          contextObserver = new root2.MutationObserver((records) => {
            if (records.some((record) => Array.from(contexts.values()).some((context) => !context.scope.isConnected || context.element && (record.type === "attributes" && record.target.contains(context.element) || record.type === "childList" && Array.from(record.removedNodes).some((node) => node.contains(context.element)))))) pruneContexts();
          });
          contextObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["hidden", "inert", "disabled", "aria-disabled", "class", "style", "open", "aria-hidden"]
          });
          aelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
            priority: 0,
            mount: mountFocusElement,
            unmount: unmountFocusElement
          });
          aelluxJs2.on("$focusin", onFocusIn, true);
          aelluxJs2.on("$focus", onFocusChange, true);
          aelluxJs2.on("$blur", onBlur, true);
          aelluxJs2.onEvent(root2, "$focus", onWindowFocus);
          aelluxJs2.onEvent(root2, "$blur", onWindowBlur);
          aelluxJs2.on("SnapshotRestore", onSnapshotRestore);
          aelluxJs2.on("DismissFocusLost", onDismissFocusLost);
          aelluxJs2.on("UnpopFocusLost", onDismissFocusLost);
          aelluxJs2.on("Unmount", onContextUnmount);
          aelluxJs2.on("Mount", onContextMount);
          remember(document.activeElement, false);
          syncNative(document.activeElement);
        }
        function destroy() {
          aelluxJs2.comm.removeOwner(extensionName);
          contextObserver == null ? void 0 : contextObserver.disconnect();
          contextObserver = null;
          for (const context of contexts.values()) clearContext(context);
          contexts.clear();
          shortcutActions.clear();
          aelluxJs2.off("$focusin", onFocusIn, true);
          aelluxJs2.off("$focus", onFocusChange, true);
          aelluxJs2.off("$blur", onBlur, true);
          aelluxJs2.offEvent(root2, "$focus", onWindowFocus);
          aelluxJs2.offEvent(root2, "$blur", onWindowBlur);
          aelluxJs2.off("SnapshotRestore", onSnapshotRestore);
          aelluxJs2.off("DismissFocusLost", onDismissFocusLost);
          aelluxJs2.off("UnpopFocusLost", onDismissFocusLost);
          aelluxJs2.off("Unmount", onContextUnmount);
          aelluxJs2.off("Mount", onContextMount);
          aelluxJs2.mountManager.remove({ extensionName });
          entries.length = 0;
          current = null;
        }
        function mountFocusElement(element) {
          const type = element.getAttribute(attribute);
          switch (type) {
            case "next":
              aelluxJs2.onEvent(element, "$keydown", onNextKeyDown);
              nextElements.add(element);
              if (!element.hasAttribute("enterkeyhint") && element.matches(textEntrySelector)) {
                hintMemories.set(element, aelluxJs2.persist.element.save(element, ["enterkeyhint"], []));
                element.setAttribute("enterkeyhint", "next");
              }
              break;
          }
        }
        function unmountFocusElement(element) {
          var _a;
          if (nextElements.delete(element)) aelluxJs2.offEvent(element, "$keydown", onNextKeyDown);
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
        function isValid(element, spatial = false) {
          if (!element || element === document.body || element === document.documentElement || !element.isConnected || typeof element.focus !== "function" || element.matches(":disabled, [disabled], [hidden], [inert]") || element.closest('[aria-disabled="true"]')) return false;
          for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
            if (node.hidden || node.hasAttribute("inert") || spatial && node.getAttribute("aria-hidden") === "true") return false;
            const style = root2.getComputedStyle(node);
            if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || spatial && (style.contentVisibility === "hidden" || Number(style.opacity) === 0)) return false;
            if (spatial && node.hasAttribute(aelluxJs2.attr("present")) && (node.classList.contains(aelluxJs2.className("dismissed")) || node.classList.contains(aelluxJs2.className("unpop")))) return false;
          }
          return element.getClientRects().length > 0;
        }
        function remember(element, push) {
          if (!isValid(element) || current && current.element === element) return;
          const entry = { element };
          entries.push(entry);
          if (entries.length > 100) entries.shift();
          current = entry;
          if (!push || !stateNavigationEligible(element) || !element.id || !element.id.trim()) return;
          aelluxJs2.dispatch("PushState", {
            detail: { key: snapshotKey, value: element.id }
          });
        }
        function stateNavigationEligible(element) {
          if (element.hasAttribute(attribute)) return true;
          const name = element.tagName && element.tagName.toLowerCase();
          if (name === "textarea" || name === "select") return true;
          if (name === "input") return String(element.type || "text").toLowerCase() !== "hidden";
          return element.isContentEditable || element.hasAttribute("contenteditable") && element.getAttribute("contenteditable") !== "false";
        }
        function onFocusIn(event) {
          syncNative(event.target);
          if (!restoring) remember(event.target, true);
        }
        function onFocusChange(event) {
          syncNative(event.target);
          if (!restoring) remember(event.target, true);
        }
        function onBlur(event) {
          if (!restoring) remember(event.target, false);
          Promise.resolve().then(() => syncNative(document.activeElement));
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
          syncNative(entry.element);
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
        function onDismissFocusLost() {
          restoreLastFocus();
        }
        function onSnapshotRestore(event) {
          const snapshot = event.detail && event.detail.snapshot;
          if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, snapshotKey)) return;
          const target = document.getElementById(snapshot[snapshotKey]);
          if (target && stateNavigationEligible(target)) {
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
        function warn(reason, extra = {}) {
          aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_CONFIGURATION_VALUE, __spreadValues({ extension: extensionName, reason }, extra));
        }
        function getContext(focusId = 1) {
          const context = contexts.get(focusId);
          return context ? Object.freeze(__spreadValues({}, context)) : null;
        }
        function createContext(focusId, { scope = document.body, syncDOM = focusId === 1 } = {}) {
          if (!Number.isSafeInteger(focusId) || focusId < 1 || contexts.has(focusId) || !scope || scope.nodeType !== 1 || !scope.isConnected || focusId !== 1 && syncDOM) return false;
          contexts.set(focusId, { focusId, element: null, scope, syncDOM: !!syncDOM });
          return getContext(focusId);
        }
        function clearContext(context) {
          const previous = context.element;
          context.element = null;
          previous == null ? void 0 : previous.classList.remove(focusClass(context.focusId));
          if (previous) publishFocus({ focusId: context.focusId, element: null, previous });
        }
        function publishFocus(detail) {
          aelluxJs2.comm.emit("focus.changed", detail);
          aelluxJs2.dispatch("FocusChange", { detail });
        }
        function destroyContext(focusId) {
          if (focusId === 1 || !contexts.has(focusId)) return false;
          clearContext(contexts.get(focusId));
          contexts.delete(focusId);
          aelluxJs2.comm.emit("focus.context-destroyed", { focusId });
          aelluxJs2.dispatch("FocusContextDestroy", { detail: { focusId } });
          return true;
        }
        function updateContext(focusId, { scope, syncDOM } = {}) {
          const context = contexts.get(focusId);
          if (!context || scope && (scope.nodeType !== 1 || !scope.isConnected) || focusId !== 1 && syncDOM) return false;
          if (scope) context.scope = scope;
          if (syncDOM !== void 0) context.syncDOM = !!syncDOM;
          if (context.element && !context.scope.contains(context.element)) clearContext(context);
          if (context.syncDOM) syncNative(document.activeElement);
          return getContext(focusId);
        }
        function assign(context, element) {
          if (context.element === element) return true;
          const previous = context.element;
          previous == null ? void 0 : previous.classList.remove(focusClass(context.focusId));
          context.element = element;
          element == null ? void 0 : element.classList.add(focusClass(context.focusId));
          publishFocus({ focusId: context.focusId, element, previous });
          return true;
        }
        function setFocus(focusId, elementOrId) {
          const context = contexts.get(focusId);
          const element = typeof elementOrId === "string" ? document.getElementById(elementOrId.replace(/^#/, "")) : elementOrId;
          return applyFocus(context, element);
        }
        function applyFocus(context, element, preventScroll = false) {
          var _a;
          if (!context || element !== null && (!isValid(element) || !context.scope.contains(element))) return false;
          if (element && context.syncDOM) {
            element.focus({ preventScroll });
            if (document.activeElement !== element) return false;
          }
          if (!element && context.syncDOM) (_a = context.element) == null ? void 0 : _a.blur();
          return assign(context, element);
        }
        function syncNative(element) {
          const context = contexts.get(1);
          if (context == null ? void 0 : context.syncDOM) assign(context, isValid(element) && context.scope.contains(element) ? element : null);
        }
        function pruneContexts() {
          for (const context of contexts.values()) {
            if (!context.scope.isConnected && context.focusId !== 1) {
              destroyContext(context.focusId);
              continue;
            }
            if (context.element && (!isValid(context.element) || !context.scope.contains(context.element))) clearContext(context);
          }
          for (let index = entries.length - 1; index >= 0; index--) if (!entries[index].element.isConnected) entries.splice(index, 1);
          if (current && !current.element.isConnected) current = null;
        }
        function onContextUnmount(event) {
          const { root: scope, extensions } = event.detail;
          if (extensions && !extensions.includes(extensionName)) return;
          if (event.detail.detachedOnly) {
            pruneContexts();
            return;
          }
          for (const context of contexts.values()) {
            if (context.focusId !== 1 && scope.contains(context.scope)) destroyContext(context.focusId);
            else if (context.element && scope.contains(context.element)) clearContext(context);
          }
          for (let index = entries.length - 1; index >= 0; index--) if (scope.contains(entries[index].element)) entries.splice(index, 1);
          if (current && scope.contains(current.element)) current = null;
        }
        function onContextMount() {
          syncNative(document.activeElement);
          for (const context of contexts.values()) if (context.element && isValid(context.element)) context.element.classList.add(focusClass(context.focusId));
        }
        function activeScope(context) {
          var _a;
          const nearest = (_a = context.element) == null ? void 0 : _a.closest(scopeSelector);
          const scope = nearest && context.scope.contains(nearest) ? nearest : context.scope;
          const modal = Array.from(document.querySelectorAll('dialog[open], [aria-modal="true"]')).reverse().find((element) => {
            if (!isValid(element)) return false;
            try {
              return element.matches(":modal") || element.getAttribute("aria-modal") === "true";
            } catch (_) {
              return element.getAttribute("aria-modal") === "true";
            }
          });
          if (modal && !modal.contains(context.element || context.scope)) return null;
          return scope;
        }
        function navigate(context, command, scope) {
          var _a;
          const region = (context.element || context.scope).closest(`[${navAttribute}]`);
          const policy = ((_a = region == null ? void 0 : region.getAttribute(navAttribute)) == null ? void 0 : _a.trim().toLowerCase()) || "auto";
          if (policy === "none") return false;
          const keyboard = command.source === "keyboard";
          if (keyboard && (policy === "native" || context.syncDOM && policy !== "spatial")) return false;
          if (!keyboard && command.source !== "gamepad" && context.syncDOM && policy !== "spatial") return false;
          if (region && scope.contains(region)) scope = region;
          const focused = context.element;
          const origin = focused && available(focused, scope, true) ? focused.getBoundingClientRect() : null;
          const candidates = Array.from(scope.querySelectorAll(focusableSelector)).filter((element) => element !== focused && available(element, scope, true)).map((element) => ({ element, rect: element.getBoundingClientRect() }));
          const selected = selectSpatialCandidate(origin, candidates, command.action.slice(9));
          if (!selected || !applyFocus(context, selected.element, true)) return false;
          reveal(selected.element, scope);
          return true;
        }
        function reveal(element, scope) {
          if (scope === document.body || scope === document.documentElement) {
            element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
            return;
          }
          for (let node = element.parentElement; node && scope.contains(node); node = node.parentElement) {
            const style = root2.getComputedStyle(node);
            const rect = element.getBoundingClientRect(), box = node.getBoundingClientRect();
            const left = box.left + node.clientLeft, top = box.top + node.clientTop;
            const offset = (start, end, min, max) => start < min ? start - min : end > max ? Math.min(end - max, start - min) : 0;
            const x = /^(auto|scroll|overlay)$/.test(style.overflowX) ? offset(rect.left, rect.right, left, left + node.clientWidth) : 0;
            const y = /^(auto|scroll|overlay)$/.test(style.overflowY) ? offset(rect.top, rect.bottom, top, top + node.clientHeight) : 0;
            if (x || y) node.scrollBy({ left: x, top: y, behavior: "instant" });
            if (node === scope) break;
          }
        }
        function available(element, scope, spatial = false) {
          if (!isValid(element, spatial) || !scope.contains(element)) return false;
          const nearest = element.closest(scopeSelector);
          return !nearest || nearest === scope || !scope.contains(nearest);
        }
        function distance(a, b, scope) {
          const ancestors = /* @__PURE__ */ new Map();
          let depth = 0;
          for (let node = a; node; node = node.parentElement) {
            ancestors.set(node, depth++);
            if (node === scope) break;
          }
          depth = 0;
          for (let node = b; node; node = node.parentElement) {
            if (ancestors.has(node)) return depth + ancestors.get(node);
            if (node === scope) break;
            depth++;
          }
          return Infinity;
        }
        function eligibleShortcuts(focusId = 1, command = null) {
          const context = contexts.get(focusId);
          if (!context || !context.element || !isValid(context.element)) return [];
          const scope = activeScope(context);
          if (!scope) return [];
          const shortcutAttribute = aelluxJs2.attr("shortcut");
          const candidates = [scope, ...scope.querySelectorAll(`[${shortcutAttribute}]`)].filter((element) => element.hasAttribute(shortcutAttribute) && available(element, scope));
          return candidates.map((element, order) => ({
            element,
            order,
            shortcuts: parseShortcuts(element.getAttribute(shortcutAttribute)),
            distance: distance(context.element, element, scope),
            priority: Number(element.getAttribute(aelluxJs2.attr("shortcut-priority"))) || 0
          })).filter((item) => !command || item.shortcuts.some((shortcut) => matchesShortcut(shortcut, command))).sort((a, b) => a.distance - b.distance || b.priority - a.priority || a.order - b.order);
        }
        function registerShortcutAction(name, handler, { signal } = {}) {
          if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof handler !== "function" || shortcutActions.has(name)) throw new TypeError("Invalid or duplicate shortcut action.");
          const remove = () => {
            if (shortcutActions.get(name) === handler) shortcutActions.delete(name);
            signal == null ? void 0 : signal.removeEventListener("abort", remove);
          };
          if (!(signal == null ? void 0 : signal.aborted)) {
            shortcutActions.set(name, handler);
            signal == null ? void 0 : signal.addEventListener("abort", remove, { once: true });
          }
          return remove;
        }
        function executeShortcut(element, command) {
          const action = element.getAttribute(aelluxJs2.attr("shortcut-action")) || "click";
          if (!aelluxJs2.dispatchFrom(element, "BeforeShortcut", { cancelable: true, detail: { command, action } })) return false;
          if (action === "click") element.click();
          else {
            const handler = shortcutActions.get(action);
            if (handler) {
              if (handler(element, command) === false) return false;
            } else if (["pop", "unpop", "dismiss"].includes(action)) {
              const id = element.getAttribute(aelluxJs2.attr("shortcut-target"));
              const target = id ? document.getElementById(id.replace(/^#/, "")) : element;
              if (!target) return false;
              const response = aelluxJs2.comm.request("present." + action, { element: target });
              if (!response.handled) return false;
            } else {
              warn("Unknown shortcut action.", { value: action, element });
              return false;
            }
          }
          aelluxJs2.dispatchFrom(element, "Shortcut", { detail: { command, action } });
          return true;
        }
        function consumeCommand(command) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i;
          const context = contexts.get(command.focusId);
          if (!context) {
            warn("Input command refers to an unknown focus context; command blocked.", { focusId: command.focusId });
            return false;
          }
          if (!["press", "repeat"].includes(command.phase) || ((_a = command.originalEvent) == null ? void 0 : _a.defaultPrevented) || ((_b = command.originalEvent) == null ? void 0 : _b.isComposing) || ((_c = command.originalEvent) == null ? void 0 : _c.keyCode) === 229) return false;
          if (command.source === "point") return false;
          const focused = context.element;
          const inputScope = (focused || context.scope).closest(`[${aelluxJs2.attr("inputs")}]`);
          if (inputScope && !inputScope.getAttribute(aelluxJs2.attr("inputs")).split(/\s+/).includes(command.source)) return false;
          const origin = (_d = command.originalEvent) == null ? void 0 : _d.target;
          const editable = (element) => element == null ? void 0 : element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]');
          const reserved = ((_e = command.modifiers) == null ? void 0 : _e.meta) || ((_f = command.modifiers) == null ? void 0 : _f.ctrl) && ["KeyW", "KeyT", "KeyN", "KeyR", "KeyL", "KeyF", "KeyP", "KeyS", "KeyC", "KeyV", "KeyX", "KeyA", "KeyZ", "KeyY"].includes(command.code) || ((_g = command.modifiers) == null ? void 0 : _g.alt) && ["ArrowLeft", "ArrowRight", "F4"].includes(command.code);
          if (command.source === "keyboard" && (editable(origin) || editable(focused) || command.code === "Tab" || reserved)) return false;
          const directional = (_h = command.action) == null ? void 0 : _h.startsWith("navigate-");
          if (command.source === "keyboard" && directional && (((_i = origin == null ? void 0 : origin.closest) == null ? void 0 : _i.call(origin, keyboardWidgetSelector)) || (focused == null ? void 0 : focused.closest(keyboardWidgetSelector)) || Object.values(command.modifiers || {}).some(Boolean))) return false;
          const candidate = eligibleShortcuts(command.focusId, command)[0];
          if (candidate && command.phase === "press") return executeShortcut(candidate.element, command);
          const scope = activeScope(context);
          if (!scope) return false;
          if (directional) return navigate(context, command, scope);
          if (context.syncDOM && command.source === "keyboard") return false;
          if (command.action === "confirm" && command.phase === "press" && focused && available(focused, scope)) {
            focused.click();
            return true;
          }
          return false;
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/aellux.ext.input.js
  var aellux_ext_input_exports = {};
  var init_aellux_ext_input = __esm({
    "src/aellux.ext.input.js"() {
      init_input_shortcuts();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const api = root2.aelluxJs;
        if (!api) throw new Error("[aellux.js] Load the boot script before Input.");
        const extensionName = "input", attr = (name) => api.attr(name);
        const mounted = /* @__PURE__ */ new Set(), adapters = /* @__PURE__ */ new Map(), active = /* @__PURE__ */ new Map(), routers = [], families = [];
        const hintContexts = /* @__PURE__ */ new Map(), hints = /* @__PURE__ */ new Map();
        const loading = /* @__PURE__ */ new Map();
        const mountTokens = /* @__PURE__ */ new WeakMap();
        const outputs = ["gamepad", "active-input", "gamepad-family", "gamepad-model"];
        const actionMaps = {
          keyboard: {
            Enter: "confirm",
            Space: "confirm",
            Escape: "cancel",
            ArrowLeft: "navigate-left",
            ArrowRight: "navigate-right",
            ArrowUp: "navigate-up",
            ArrowDown: "navigate-down"
          },
          gamepad: { "dpad-left": "navigate-left", "dpad-right": "navigate-right", "dpad-up": "navigate-up", "dpad-down": "navigate-down" }
        };
        let running = false, observer = null, rootMemory = null, routerOrder = 0, familyOrder = 0;
        for (const name of ["point", "keyboard", "gamepad"]) adapters.set(name, () => loadAdapter(name));
        api.extAttach(extensionName, {
          init,
          destroy,
          pointers: (element) => {
            var _a;
            return ((_a = active.get("point")) == null ? void 0 : _a.pointers(element)) || [];
          },
          registerRouter,
          removeRouters,
          resolveFocusId,
          dispatchCommand,
          registerAdapter,
          registerGamepadFamily,
          devices: () => {
            var _a;
            return ((_a = active.get("gamepad")) == null ? void 0 : _a.devices()) || [];
          },
          setActionMap,
          setHintContext,
          describeShortcuts: parseShortcuts,
          refresh
        });
        function warn(reason, extra = {}) {
          api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, __spreadValues({ extension: extensionName, reason }, extra));
        }
        function modalities(element) {
          const scope = element && element.nodeType === 1 ? element.closest(`[${attr("inputs")}]`) : null;
          const value = scope ? scope.getAttribute(attr("inputs")) : root2.document.documentElement.getAttribute(attr("inputs"));
          return new Set(value === null ? ["point", "keyboard"] : value.trim().split(/\s+/).filter(Boolean));
        }
        function accepts(source, element) {
          return modalities(element).has(source);
        }
        async function init() {
          if (running) return;
          running = true;
          rootMemory = api.persist.element.save(root2.document.documentElement, outputs.map(attr), []);
          root2.document.documentElement.setAttribute(attr("gamepad"), "false");
          api.mountManager.add({
            extensionName,
            selector: ["point", "inputs", "shortcut-hint"].map((name) => `[${attr(name)}]`).join(","),
            mount,
            unmount,
            update: refresh,
            controllers: ["pointers"]
          });
          api.comm.on("extension.destroyed", extensionDestroyed, { owner: extensionName });
          api.comm.on("focus.context-destroyed", contextDestroyed, { owner: extensionName });
          api.comm.handle("input.mount-token", ({ element }) => mountTokens.get(element) || null, { owner: extensionName });
          api.on("Unmount", onUnmount);
          observer = new root2.MutationObserver((records) => {
            if (records.some((record) => record.type === "attributes" || record.removedNodes.length || record.addedNodes.length)) refresh().catch((cause) => warn("Input adapter refresh failed.", { cause }));
          });
          observer.observe(root2.document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["inputs", "shortcut", "shortcut-hint", "shortcut-focus"].map(attr)
          });
          try {
            await refresh();
          } catch (cause) {
            destroy();
            throw cause;
          }
        }
        function mount(element) {
          var _a;
          if (!mounted.has(element)) mountTokens.set(element, {});
          mounted.add(element);
          if (element.hasAttribute(attr("point"))) (_a = active.get("point")) == null ? void 0 : _a.mount(element);
          return refresh();
        }
        function unmount(element) {
          var _a;
          mounted.delete(element);
          mountTokens.delete(element);
          (_a = active.get("point")) == null ? void 0 : _a.unmount(element);
          restoreHint(element);
          removeRouters(element);
          return refresh();
        }
        async function loadAdapter(name) {
          var _a, _b, _c;
          const filename = `aellux.input.${name}${api.diagnostics.legacy ? ".legacy" : ""}${api.minified ? ".min" : ""}.js`;
          if (!((_a = api.registry.inputAdapters) == null ? void 0 : _a[name])) {
            await api.dep("aellux-input-" + filename, "./" + filename, (_b = api.coreAssetIntegrity) == null ? void 0 : _b[filename]);
          }
          const factory = (_c = api.registry.inputAdapters) == null ? void 0 : _c[name];
          if (!factory) throw new Error("Input adapter did not register: " + name);
          return factory({ root: root2, emit: dispatchCommand, accepts, changed: deviceChanged, identify: identifyFamily });
        }
        async function refresh() {
          if (!running) return;
          const requested = modalities(root2.document.documentElement);
          for (const element of mounted) if (element.isConnected && element.hasAttribute(attr("inputs"))) {
            for (const name of modalities(element)) requested.add(name);
          }
          for (const name of requested) if (!adapters.has(name)) warn("Unknown Input adapter.", { value: name });
          for (const [name, adapter] of active) if (!requested.has(name)) {
            active.delete(name);
            adapter.destroy();
          }
          await Promise.all(Array.from(requested).filter((name) => adapters.has(name)).map(async (name) => {
            if (active.has(name)) return;
            if (!loading.has(name)) loading.set(name, Promise.resolve().then(() => adapters.get(name)()).then(async (adapter) => {
              if (!running || !adapters.has(name) || !requestedModalities().has(name)) return;
              active.set(name, adapter);
              await adapter.init();
              if (!running || !adapters.has(name) || !requestedModalities().has(name)) {
                if (active.get(name) === adapter) active.delete(name);
                adapter.destroy();
                return;
              }
              if (name === "point") {
                for (const element of mounted) if (element.hasAttribute(attr("point"))) adapter.mount(element);
              }
            }).finally(() => loading.delete(name)));
            await loading.get(name);
          }));
          for (const entry of routers.slice()) if (entry.owner && entry.owner.nodeType && !entry.owner.isConnected) entry.remove();
          for (const [id] of hintContexts) if (!Number.isSafeInteger(id)) hintContexts.delete(id);
          updateHints();
        }
        function requestedModalities() {
          const names = modalities(root2.document.documentElement);
          for (const element of mounted) if (element.isConnected && element.hasAttribute(attr("inputs"))) for (const name of modalities(element)) names.add(name);
          return names;
        }
        function destroy() {
          running = false;
          observer == null ? void 0 : observer.disconnect();
          observer = null;
          api.comm.removeOwner(extensionName);
          for (const element of mounted) mountTokens.delete(element);
          api.off("Unmount", onUnmount);
          for (const adapter of active.values()) adapter.destroy();
          active.clear();
          mounted.clear();
          for (const entry of routers.slice()) entry.remove();
          for (const element of hints.keys()) restoreHint(element);
          hintContexts.clear();
          families.length = 0;
          rootMemory == null ? void 0 : rootMemory.restore();
          rootMemory = null;
          api.mountManager.remove({ extensionName });
        }
        function registerAdapter(name, factory) {
          if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof factory !== "function" || adapters.has(name)) throw new TypeError("Invalid or duplicate Input adapter.");
          adapters.set(name, factory);
          refresh().catch((cause) => warn("Input adapter refresh failed.", { cause }));
          return () => {
            var _a;
            (_a = active.get(name)) == null ? void 0 : _a.destroy();
            active.delete(name);
            adapters.delete(name);
          };
        }
        function registerRouter(resolve, { priority = 0, owner = null, signal } = {}) {
          if (typeof resolve !== "function" || !Number.isFinite(priority)) throw new TypeError("A router requires a synchronous function and a finite priority.");
          if (signal == null ? void 0 : signal.aborted) return () => {
          };
          const entry = { resolve, priority, owner, order: routerOrder++, remove() {
            const index = routers.indexOf(entry);
            if (index !== -1) routers.splice(index, 1);
            signal == null ? void 0 : signal.removeEventListener("abort", entry.remove);
          } };
          routers.push(entry);
          routers.sort((a, b) => b.priority - a.priority || a.order - b.order);
          signal == null ? void 0 : signal.addEventListener("abort", entry.remove, { once: true });
          return entry.remove;
        }
        function removeRouters(owner) {
          for (const entry of routers.slice()) if (entry.owner === owner) entry.remove();
        }
        function extensionDestroyed(detail) {
          removeRouters(detail.extension);
        }
        function contextDestroyed(detail) {
          hintContexts.delete(detail.focusId);
          updateHints();
        }
        function onUnmount(event) {
          var _a;
          const { root: scope, extensions, detachedOnly } = event.detail;
          if (extensions && !extensions.includes(extensionName)) return;
          for (const entry of routers.slice()) if (((_a = entry.owner) == null ? void 0 : _a.nodeType) && (detachedOnly ? !entry.owner.isConnected : scope.contains(entry.owner))) entry.remove();
        }
        function resolveFocusId(command) {
          var _a;
          for (const entry of routers.slice()) {
            if (!routers.includes(entry)) continue;
            if (((_a = entry.owner) == null ? void 0 : _a.nodeType) && !entry.owner.isConnected) {
              entry.remove();
              continue;
            }
            let id;
            try {
              id = entry.resolve(command);
            } catch (cause) {
              warn("Input router failed; command blocked.", { cause, deviceId: command.deviceId });
              return null;
            }
            if (id === void 0) continue;
            if (id === null) return null;
            if (Number.isSafeInteger(id) && id > 0) return id;
            if (id && typeof id.then === "function") Promise.resolve(id).catch(() => {
            });
            warn("Invalid focus association; command blocked.", { value: id, deviceId: command.deviceId });
            return null;
          }
          return 1;
        }
        function dispatchCommand(value) {
          var _a, _b;
          if (!running || !value || typeof value.deviceId !== "string" || !value.deviceId || typeof value.source !== "string" || typeof value.code !== "string" || !["press", "release", "repeat", "move", "cancel"].includes(value.phase)) return false;
          if (!active.has(value.source) || value.target && !accepts(value.source, value.target)) return false;
          const normalized = Object.freeze(__spreadProps(__spreadValues({}, value), {
            modifiers: Object.freeze(__spreadValues({}, value.modifiers)),
            action: value.action || ((_a = actionMaps[value.source]) == null ? void 0 : _a[value.code]) || null,
            timestamp: root2.performance.now()
          }));
          const focusId = resolveFocusId(normalized);
          if (focusId === null) {
            api.dispatch("InputBlocked", { detail: { command: normalized } });
            return false;
          }
          const command = Object.freeze(__spreadProps(__spreadValues({}, normalized), { focusId }));
          if (command.intentional && (command.phase === "press" || command.phase === "repeat")) {
            setHintContext(focusId, { source: command.source, family: command.family || "generic", model: command.model || "", deviceId: command.deviceId });
            const html = root2.document.documentElement;
            html.setAttribute(attr("active-input"), command.source);
            if (command.source === "gamepad") {
              html.setAttribute(attr("gamepad-family"), command.family);
              html.setAttribute(attr("gamepad-model"), command.model);
            }
          }
          if (!api.dispatch("BeforeInputCommand", { cancelable: true, detail: { command } })) return false;
          const response = api.comm.request("focus.command", command);
          const handled = response.handled && response.value === true;
          if (handled && ((_b = command.originalEvent) == null ? void 0 : _b.cancelable)) command.originalEvent.preventDefault();
          api.dispatch("InputCommand", { detail: { command, handled } });
          return handled;
        }
        function setActionMap(source, mapping) {
          actionMaps[source] = __spreadValues(__spreadValues({}, actionMaps[source]), mapping);
        }
        function registerGamepadFamily(identify, { priority = 0 } = {}) {
          if (typeof identify !== "function" || !Number.isFinite(priority)) throw new TypeError("Invalid gamepad family detector.");
          const entry = { identify, priority, order: familyOrder++ };
          families.push(entry);
          families.sort((a, b) => b.priority - a.priority || a.order - b.order);
          return () => {
            const index = families.indexOf(entry);
            if (index !== -1) families.splice(index, 1);
          };
        }
        function identifyFamily(id) {
          for (const entry of families) {
            const result = entry.identify(id);
            if (result) return result;
          }
          return null;
        }
        function deviceChanged(device, connected, operational) {
          if (running) root2.document.documentElement.setAttribute(attr("gamepad"), String(operational));
          if (!connected) {
            for (const [id, context] of hintContexts) if (context.deviceId === device.deviceId) hintContexts.delete(id);
          }
          api.dispatch(connected ? "InputDeviceConnected" : "InputDeviceDisconnected", { detail: { device } });
          updateHints();
        }
        function setHintContext(focusId, context) {
          if (!Number.isSafeInteger(focusId) || focusId < 1) throw new TypeError("Invalid hint focusId.");
          hintContexts.set(focusId, Object.freeze(__spreadValues({}, context)));
          updateHints();
        }
        function restoreHint(element) {
          var _a;
          (_a = hints.get(element)) == null ? void 0 : _a.restore();
          hints.delete(element);
        }
        function updateHints() {
          for (const element of hints.keys()) if (!element.isConnected || !element.hasAttribute(attr("shortcut-hint"))) restoreHint(element);
          for (const element of mounted) {
            if (!element.isConnected || !element.hasAttribute(attr("shortcut-hint"))) continue;
            if (!hints.has(element)) hints.set(element, api.persist.element.save(
              element,
              ["shortcut-label", "shortcut-source", "gamepad-family", "shortcut-code", "gamepad-model"].map(attr),
              []
            ));
            const explicit = element.getAttribute(attr("shortcut-hint"));
            const owner = element.closest(`[${attr("shortcut")}]`);
            const descriptions = parseShortcuts(explicit || (owner == null ? void 0 : owner.getAttribute(attr("shortcut"))));
            const id = Number(element.getAttribute(attr("shortcut-focus")) || 1);
            const context = hintContexts.get(id) || { source: "keyboard", family: "generic" };
            const description = descriptions.find((item) => item.source === context.source) || descriptions[0];
            for (const [name, value] of [
              ["shortcut-label", shortcutLabel(description, context.family)],
              ["shortcut-source", (description == null ? void 0 : description.source) || ""],
              ["shortcut-code", (description == null ? void 0 : description.code) || ""],
              ["gamepad-family", context.family || "generic"],
              ["gamepad-model", context.model || ""]
            ]) element.setAttribute(attr(name), value);
          }
        }
      })(typeof globalThis !== "undefined" ? globalThis : window);
    }
  });

  // src/internal/create-css-easing.js
  function createCssEasing(value, api) {
    const name = String(value || "ease-in-out").trim().toLowerCase();
    const keywords = {
      ease: ".25,.1,.25,1",
      "ease-in": ".42,0,1,1",
      "ease-out": "0,0,.58,1",
      "ease-in-out": ".42,0,.58,1"
    };
    if (name === "linear") return (progress) => progress;
    const steps = /^(?:steps\(\s*(\d+)\s*(?:,\s*(jump-start|jump-end|jump-none|jump-both|start|end)\s*)?\)|step-(start|end))$/.exec(name);
    if (steps) {
      const count = steps[3] ? 1 : Number(steps[1]);
      const position = steps[3] || steps[2] || "end";
      const start = position === "start" || position === "jump-start" || position === "jump-both";
      const jumps = count + (position === "jump-both" ? 1 : position === "jump-none" ? -1 : 0);
      if (count > 0 && jumps > 0) return (progress) => Math.max(0, Math.min(1, (Math.floor(progress * count) + (start ? 1 : 0)) / jumps));
    }
    const linear = /^linear\(([^()]*)\)$/.exec(name);
    if (linear) {
      const points = [];
      for (const stop of linear[1].split(",")) {
        const tokens = stop.trim().split(/\s+/);
        const values = tokens.filter((token) => !token.endsWith("%"));
        const positions = tokens.filter((token) => token.endsWith("%"));
        if (values.length !== 1 || positions.length > 2 || !tokens.every((token) => /^[+-]?(?:\d*\.\d+|\d+\.?)(?:e[+-]?\d+)?%?$/.test(token))) return fallback(api);
        for (const position of positions.length ? positions : [null])
          points.push({ x: position === null ? null : parseFloat(position) / 100, y: Number(values[0]) });
      }
      if (points.length < 2) return fallback(api);
      if (points[0].x === null) points[0].x = 0;
      if (points[points.length - 1].x === null) points[points.length - 1].x = 1;
      let largest = -Infinity;
      for (const point of points) if (point.x !== null) largest = point.x = Math.max(largest, point.x);
      for (let index = 1; index < points.length; index++) {
        if (points[index].x !== null) continue;
        const begin = index - 1;
        while (points[index].x === null) index++;
        for (let cursor = begin + 1; cursor < index; cursor++)
          points[cursor].x = points[begin].x + (points[index].x - points[begin].x) * (cursor - begin) / (index - begin);
      }
      return (progress) => {
        let index = 0;
        while (index < points.length - 1 && points[index + 1].x <= progress) index++;
        const first = points[Math.min(index, points.length - 2)], second = points[Math.min(index + 1, points.length - 1)];
        return second.x === first.x ? progress < first.x ? first.y : second.y : first.y + (second.y - first.y) * (progress - first.x) / (second.x - first.x);
      };
    }
    let curve = keywords[name] ? `cubic-bezier(${keywords[name]})` : name;
    const cubic = /^cubic-bezier\(([^()]*)\)$/.exec(curve);
    if (cubic) {
      const values = cubic[1].split(",").map((value2) => value2.trim());
      if (values.length === 4 && values.every((value2) => /^[+-]?(?:\d*\.\d+|\d+\.?)(?:e[+-]?\d+)?$/.test(value2)))
        curve = `cubic-bezier(${values.map(Number).join(",")})`;
    }
    if (/^cubic-bezier\(/.test(curve)) {
      try {
        api.ease(curve, 0.5);
        return (progress) => api.ease(curve, progress);
      } catch (_) {
      }
    }
    return fallback(api);
  }
  function fallback(api) {
    return (progress) => api.ease("cubic-bezier(.25,.1,.25,1)", progress);
  }
  var init_create_css_easing = __esm({
    "src/internal/create-css-easing.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
    }
  });

  // src/aellux.ext.anchor.js
  var aellux_ext_anchor_exports = {};
  var init_aellux_ext_anchor = __esm({
    "src/aellux.ext.anchor.js"() {
      init_create_css_easing();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const aelluxJs2 = root2.aelluxJs;
        const extensionName = "anchor";
        if (!aelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const ORIGIN_X = "--ae-anchor-origin-x", ORIGIN_Y = "--ae-anchor-origin-y", ANCHOR_OPACITY = "--anchor-opacity";
        const attribute = aelluxJs2.attr(extensionName);
        const presentAttribute = aelluxJs2.attr("present");
        const targetAttribute = aelluxJs2.attr("anchor-target");
        const matchAttribute = aelluxJs2.attr("anchor-match");
        const scrollIntoViewAttribute = aelluxJs2.attr("anchor-scroll-into-view");
        const groupAttribute = aelluxJs2.attr("present-group");
        const layoutEvent = aelluxJs2.eventName("Layout");
        const anchoredClass = aelluxJs2.className("anchored");
        const switchingClass = aelluxJs2.className("anchor-switching");
        const baseProperties = ["position", "left", "top", "transform", "transform-origin"];
        const ownedProperties = [
          ...baseProperties,
          "--ae-anchor-x",
          "--ae-anchor-y",
          ORIGIN_X,
          ORIGIN_Y,
          ANCHOR_OPACITY,
          "--ae-anchor-target-width",
          "--ae-anchor-target-height",
          "--ae-anchor-pivot-x",
          "--ae-anchor-pivot-y"
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
        const anchors = /* @__PURE__ */ new Map();
        const elementMemories = /* @__PURE__ */ new WeakMap();
        const placementMaps = /* @__PURE__ */ new Set();
        const requestedMaps = /* @__PURE__ */ new Map();
        let nextLayoutId = 2e6;
        let mutations = null;
        aelluxJs2.extAttach(extensionName, { init, destroy, createPlacementMap });
        function init() {
          aelluxJs2.comm.handle("anchor.placement", placementRequest, { owner: extensionName });
          aelluxJs2.registerCssProperty(
            { name: "--ae-anchor-x", syntax: "<length>", initialValue: "0px" },
            { name: "--ae-anchor-y", syntax: "<length>", initialValue: "0px" },
            { name: "--ae-anchor-target-width", syntax: "<length>", initialValue: "0px" },
            { name: "--ae-anchor-target-height", syntax: "<length>", initialValue: "0px" },
            { name: "--ae-anchor-switch-duration", syntax: "<time>", initialValue: "0ms" },
            { name: ORIGIN_X, syntax: "<percentage>", initialValue: "50%" },
            { name: ORIGIN_Y, syntax: "<percentage>", initialValue: "0%" },
            { name: ANCHOR_OPACITY, syntax: "<number>", initialValue: "1" }
          );
          aelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
            priority: 0,
            mount: mountAnchor,
            unmount: unmountAnchor,
            update: (element) => updateAnchor(element, true)
          });
        }
        async function destroy() {
          aelluxJs2.comm.removeOwner(extensionName);
          for (const map of placementMaps) map.destroy();
          requestedMaps.clear();
          await Promise.all(Array.from(anchors.keys(), unmountAnchor));
          aelluxJs2.mountManager.remove({ extensionName });
        }
        function placementRequest({ action, owner, element, pairs, target, placement }) {
          if (action === "invisible") return isInvisible(element);
          let map = requestedMaps.get(owner);
          if (action === "dispose") {
            map == null ? void 0 : map.destroy();
            requestedMaps.delete(owner);
            return true;
          }
          if (action === "mount" && !map) {
            map = createPlacementMap();
            requestedMaps.set(owner, map);
          }
          if (!map) return null;
          if (action === "mount") return map.mount(element);
          if (action === "unmount") return map.unmount(element);
          if (action === "measure") return map.measure(element, pairs, target);
          if (action === "place") return map.place(element, placement);
          return null;
        }
        function createPlacementMap() {
          const memories = /* @__PURE__ */ new Map();
          let disposed = false;
          const map = {
            mount(element) {
              if (!disposed && !memories.has(element))
                memories.set(element, aelluxJs2.persist.element.save(element, ["class"], ownedProperties));
            },
            unmount(element) {
              var _a;
              (_a = memories.get(element)) == null ? void 0 : _a.restore();
              memories.delete(element);
            },
            measure(element, pairs, target = element.parentElement) {
              const candidates = parseCandidates(pairs);
              if (memories.has(element) && candidates.length) return readPlacement(element, target, candidates, true);
              return null;
            },
            place(element, placement) {
              if (memories.has(element) && (placement == null ? void 0 : placement.valid)) writePlacement(element, placement);
            },
            invisible: isInvisible,
            destroy() {
              disposed = true;
              for (const element of memories.keys()) map.unmount(element);
              placementMaps.delete(map);
            }
          };
          placementMaps.add(map);
          return map;
        }
        function mountAnchor(element) {
          if (anchors.has(element)) return;
          elementMemories.set(element, aelluxJs2.persist.element.save(element, [], ownedProperties));
          const state = {
            invalidContext: false,
            active: false,
            revision: 0,
            target: null,
            resolvedTarget: null,
            reference: null,
            group: null,
            lastPlacement: null,
            switchOperation: null,
            motionId: aelluxJs2.motion.id(),
            scrollVisible: false,
            scrollPending: false,
            ownClass: null,
            ownStyle: null,
            layoutId: nextLayoutId++,
            styleLayoutId: nextLayoutId++,
            layoutUntil: 0,
            layoutSingle: false,
            layoutFinalPending: false,
            layoutPolling: false,
            updatePending: false,
            updateDirty: false,
            repeatPending: false,
            lastUpdateAt: -Infinity,
            updateTimer: null,
            updateTimerDue: false,
            layoutListener: (event) => scheduleLayoutUpdate(event),
            observer: null,
            intersectionObserver: null
          };
          anchors.set(element, state);
          if (element.offsetParent) listenForLayout(state, element.offsetParent);
          if (anchors.size === 1) {
            aelluxJs2.onEvent(root2, "$scroll", scheduleUpdate, { capture: true, passive: true });
            aelluxJs2.onEvent(root2, "$resize", scheduleUpdate);
            aelluxJs2.on("PresentGroupChange", onGroupChange);
            if (typeof root2.MutationObserver === "function") {
              mutations = new root2.MutationObserver(onMutations);
              mutations.observe(document, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: [
                  attribute,
                  targetAttribute,
                  matchAttribute,
                  scrollIntoViewAttribute,
                  groupAttribute,
                  aelluxJs2.attr("reduced-motion"),
                  "id",
                  "hidden",
                  "class",
                  "style"
                ]
              });
            }
          }
          if (typeof root2.ResizeObserver === "function") {
            state.observer = new root2.ResizeObserver((entries) => {
              if (state.switchOperation !== null && entries.every((entry) => entry.target === element)) return;
              scheduleAnchor(element);
            });
          }
          if (typeof root2.IntersectionObserver === "function") {
            state.intersectionObserver = new root2.IntersectionObserver(() => scheduleAnchor(element));
          }
          return updateAnchor(element);
        }
        async function unmountAnchor(element) {
          const state = anchors.get(element);
          if (!state) return;
          const memory = elementMemories.get(element);
          elementMemories.delete(element);
          state.revision++;
          stopSwitch(element, state);
          if (state.reference) aelluxJs2.offEvent(state.reference, layoutEvent, state.layoutListener);
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          if (state.updateTimer !== null) root2.clearTimeout(state.updateTimer);
          anchors.delete(element);
          if (!anchors.size) {
            aelluxJs2.offEvent(root2, "$scroll", scheduleUpdate, true);
            aelluxJs2.offEvent(root2, "$resize", scheduleUpdate);
            aelluxJs2.off("PresentGroupChange", onGroupChange);
            if (mutations) mutations.disconnect();
            mutations = null;
          }
          aelluxJs2.waitLayout.cancel(state.layoutId);
          aelluxJs2.waitLayout.cancel(state.styleLayoutId);
          await aelluxJs2.waitLayout.update(state.styleLayoutId, deactivate, [element, state, memory]);
        }
        function scheduleUpdate(event) {
          if (!anchors.size) return;
          const source = (event == null ? void 0 : event.type) === "scroll" ? scrollSource(event) : null;
          for (const [element, state] of anchors) {
            if (source && !relevantScroll(source, element, state)) continue;
            scheduleAnchor(element);
          }
        }
        function scrollSource(event) {
          return event.target === document || event.target === root2 ? document.scrollingElement || document.documentElement : event.target;
        }
        function relevantScroll(source, element, state) {
          var _a, _b;
          return ((_a = source.contains) == null ? void 0 : _a.call(source, element)) || ((_b = source.contains) == null ? void 0 : _b.call(source, effectiveTarget(element, state)));
        }
        function onGroupChange(event) {
          var _a;
          for (const [element, state] of anchors)
            if (state.group === ((_a = event.detail) == null ? void 0 : _a.group)) scheduleAnchor(element);
        }
        function onMutations(records) {
          var _a;
          const affected = /* @__PURE__ */ new Set();
          for (const record of records) {
            const node = record.target;
            const structural = record.type === "childList";
            const visual = record.attributeName === "class" || record.attributeName === "style";
            for (const [element, state] of anchors) {
              if (visual) {
                if (node === element && element.hasAttribute(scrollIntoViewAttribute) && (element.getAttribute("class") !== state.ownClass || element.getAttribute("style") !== state.ownStyle)) affected.add(element);
                if (node !== element && (node.contains(element) || state.resolvedTarget && node.contains(state.resolvedTarget) || state.group && node.contains(state.group) || targetChanged(element, state))) affected.add(element);
                continue;
              }
              if (node === element || node === document.documentElement || node.contains(element) || state.resolvedTarget && node.contains(state.resolvedTarget) || state.group && node.contains(state.group) || structural && ((_a = state.reference) == null ? void 0 : _a.contains(node)) || targetChanged(element, state)) affected.add(element);
            }
          }
          for (const element of affected) scheduleAnchor(element);
        }
        function targetChanged(element, state) {
          const value = element.getAttribute(targetAttribute);
          return value && value.trim() && resolveElement(value) !== (state.group || state.resolvedTarget);
        }
        function associationDiagnostic(element, reason) {
          aelluxJs2.diagnostics.warn(
            aelluxJs2.diagnostics.WARN_ANCHOR_GROUP,
            {
              extension: extensionName,
              element,
              reason,
              attribute: targetAttribute,
              value: element.getAttribute(targetAttribute),
              suggestion: "Reference an element or Present Group without circular targets, share a positioning reference, and keep dimension-matched Anchors out of normal flow."
            }
          );
        }
        function effectiveTarget(element, state) {
          const value = element.getAttribute(targetAttribute);
          const target = value && value.trim() ? resolveElement(value) : element.offsetParent;
          state.group = value && value.trim() && (target == null ? void 0 : target.hasAttribute(groupAttribute)) ? target : null;
          return state.group ? aelluxJs2.comm.request("present.selection", { group: state.group }).value || null : target;
        }
        function circularTarget(element, target) {
          const visited = /* @__PURE__ */ new Set([element]);
          while (target) {
            if (visited.has(target)) return true;
            visited.add(target);
            const state = anchors.get(target);
            if (!state) return false;
            target = effectiveTarget(target, state);
          }
          return false;
        }
        function scheduleLayoutUpdate(event) {
          const durationMs = Number(event && event.detail ? event.detail.durationMs : NaN);
          if (!Number.isFinite(durationMs) || durationMs < 0) {
            scheduleUpdate();
            return;
          }
          if (durationMs === 0) {
            for (const [element, state] of anchors) {
              const maxFPS = aelluxJs2.layoutMaxFPS(element);
              state.layoutUntil = now() + 1e3 / (maxFPS || 60);
              state.layoutSingle = true;
              state.layoutFinalPending = true;
              scheduleAnchor(element, true);
            }
            return;
          }
          for (const [element, state] of anchors) {
            state.layoutUntil = Math.max(state.layoutUntil, now() + durationMs);
            state.layoutSingle = false;
            state.layoutFinalPending = true;
            scheduleAnchor(element, durationMs > 0);
          }
        }
        function scheduleAnchor(element, repeat = false) {
          const state = anchors.get(element);
          if (!state) return;
          if (state.updatePending) {
            state.updateDirty = true;
            state.repeatPending = state.repeatPending || repeat;
            return;
          }
          const maxFPS = aelluxJs2.layoutMaxFPS(element);
          if (maxFPS && !repeat && !state.updateTimerDue) {
            if (state.updateTimer === null) {
              state.updateTimer = root2.setTimeout(() => {
                state.updateTimer = null;
                state.updateTimerDue = true;
                scheduleAnchor(element);
              }, 1e3 / maxFPS);
            }
            return;
          }
          state.updateTimerDue = false;
          const due = maxFPS ? state.lastUpdateAt + 1e3 / maxFPS : -Infinity;
          if (due > now()) {
            if (state.updateTimer === null) {
              state.updateTimer = root2.setTimeout(() => {
                state.updateTimer = null;
                scheduleAnchor(element, repeat);
              }, Math.max(0, due - now()));
            }
            return;
          }
          if (state.layoutPolling) {
            state.updateDirty = true;
            return;
          }
          const run = () => {
            if (state.layoutSingle && now() < state.layoutUntil) return;
            state.layoutSingle = false;
            if (repeat && now() >= state.layoutUntil) state.layoutFinalPending = false;
            requestAnchorUpdate(element, state);
          };
          if (repeat) state.layoutPolling = true;
          const sequence = aelluxJs2.waitLayout.sequence(state.layoutId, {
            update: run,
            repeat: repeat ? { ms: 0 } : void 0,
            maxFPS,
            abort: () => !anchors.has(element) || repeat && now() >= state.layoutUntil && !state.layoutSingle && !state.layoutFinalPending
          });
          if (repeat) sequence.finally(() => {
            if (anchors.get(element) !== state) return;
            state.layoutPolling = false;
            if (state.updateDirty) scheduleAnchor(element);
          });
        }
        function requestAnchorUpdate(element, state) {
          if (state.updatePending) {
            state.updateDirty = true;
            return;
          }
          state.updatePending = true;
          state.updateDirty = false;
          updateAnchor(element).catch((cause) => {
            aelluxJs2.diagnostics.error(
              aelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
              { cause, extension: extensionName, element, method: "update" }
            );
          }).finally(() => {
            if (anchors.get(element) !== state) return;
            state.updatePending = false;
            if (state.updateDirty && !state.layoutPolling) {
              const repeat = state.repeatPending;
              state.repeatPending = false;
              scheduleAnchor(element, repeat);
            }
          });
        }
        function now() {
          return root2.performance && typeof root2.performance.now === "function" ? root2.performance.now() : Date.now();
        }
        async function updateAnchor(element, ensureLatest = false) {
          const state = anchors.get(element);
          if (!state) return;
          const revision = ++state.revision;
          const current = () => anchors.get(element) === state && state.revision === revision;
          const retry = () => ensureLatest && anchors.get(element) === state ? updateAnchor(element, true) : void 0;
          const target = effectiveTarget(element, state);
          state.resolvedTarget = target;
          const candidates = parseCandidates(element.getAttribute(attribute));
          if (!target || !target.isConnected || !candidates.length || circularTarget(element, target)) {
            if (target && circularTarget(element, target))
              associationDiagnostic(element, "Circular target reference.");
            await aelluxJs2.waitLayout.update(state.styleLayoutId, () => {
              if (current()) deactivate(element, state);
            });
            if (!current()) return retry();
            return;
          }
          let placement = await aelluxJs2.waitLayout.read(
            state.styleLayoutId,
            () => current() ? readPlacement(element, target, candidates, state.active) : null
          );
          if (!current()) return retry();
          if (!placement) return;
          if (placement.hidden) {
            await aelluxJs2.waitLayout.update(state.styleLayoutId, () => {
              if (current()) hideForTarget(element, state, placement);
            });
            if (!current()) return retry();
            return;
          }
          if (!placement.valid) {
            await aelluxJs2.waitLayout.update(state.styleLayoutId, () => {
              if (current()) invalidContext(element, state, placement);
            });
            if (!current()) return retry();
            return;
          }
          if (!state.active) {
            await aelluxJs2.waitLayout.update(state.styleLayoutId, () => {
              if (!current()) return;
              state.active = true;
              if (state.lastPlacement) writePlacement(element, state.lastPlacement);
            });
            if (!current()) return retry();
            placement = await aelluxJs2.waitLayout.read(
              state.styleLayoutId,
              () => current() ? readPlacement(element, target, candidates, true) : null
            );
            if (!current()) return retry();
            if (!placement) return;
            if (placement.hidden) {
              await aelluxJs2.waitLayout.update(state.styleLayoutId, () => {
                if (current()) hideForTarget(element, state, placement);
              });
              if (!current()) return retry();
              return;
            }
            if (!placement.valid) {
              await aelluxJs2.waitLayout.update(state.styleLayoutId, () => {
                if (current()) invalidContext(element, state, placement);
              });
              if (!current()) return retry();
              return;
            }
          }
          let applied = false;
          await aelluxJs2.waitLayout.update(state.styleLayoutId, () => {
            if (!current()) return;
            if (effectiveTarget(element, state) !== placement.target) return;
            state.invalidContext = false;
            observe(state, element, placement.target, placement.reference);
            const previous = state.lastPlacement;
            const switching = previous && previous.target !== placement.target;
            if (!previous || switching) state.scrollPending = true;
            const moved = !previous || previous.signature !== placement.signature;
            if (switching && placement.duration > 0) {
              startSwitch(element, state, placement);
            } else if (state.switchOperation && !switching && aelluxJs2.currentPreference("reduced-motion") !== "reduced") {
              state.switchOperation.toGeometry = placement;
            } else if (state.switchOperation) {
              writePlacement(element, placement);
              stopSwitch(element, state);
            } else {
              stopSwitch(element, state);
              if (moved) placeDirectly(element, placement);
              else writePlacement(element, placement);
            }
            if (switching) {
              state.scrollPending = false;
              state.scrollVisible = true;
              scrollTargetIntoView(element, placement.target);
            }
            rememberVisual(element, state);
            state.lastUpdateAt = now();
            state.lastPlacement = placement;
            applied = true;
          });
          if (!applied && anchors.get(element) === state) return updateAnchor(element, ensureLatest);
          if (!applied || !element.hasAttribute(scrollIntoViewAttribute)) return;
          const visible = await aelluxJs2.waitLayout.read(state.styleLayoutId, () => current() && !isInvisible(element));
          if (!current()) return retry();
          if (visible && !state.scrollVisible) state.scrollPending = true;
          state.scrollVisible = visible;
          if (!visible || !state.scrollPending) return;
          await aelluxJs2.waitLayout.update(state.styleLayoutId, () => {
            if (!current() || effectiveTarget(element, state) !== placement.target) return;
            state.scrollPending = false;
            scrollTargetIntoView(element, placement.target);
          });
        }
        function scrollTargetIntoView(element, target) {
          const tokens = (element.getAttribute(scrollIntoViewAttribute) || "").trim().split(/\s+/);
          if (tokens.length !== 2 || tokens.some((token) => !["start", "center", "end", "nearest"].includes(token))) return;
          target.scrollIntoView({
            block: tokens[0],
            inline: tokens[1],
            behavior: aelluxJs2.currentPreference("reduced-motion") === "reduced" ? "instant" : "smooth"
          });
        }
        function rememberVisual(element, state) {
          state.ownClass = element.getAttribute("class");
          state.ownStyle = element.getAttribute("style");
        }
        function readPlacement(element, target, candidates, measure) {
          const reference = element.offsetParent;
          target = target || reference;
          if (target && isInvisible(target)) return { hidden: true, target, reference };
          if (!reference || target !== reference && target.offsetParent !== reference) {
            return { valid: false, target, reference };
          }
          const style = root2.getComputedStyle(element);
          const tokens = (element.getAttribute(matchAttribute) || "").trim().split(/\s+/).filter(Boolean);
          if (element.hasAttribute(matchAttribute) && (!tokens.length || tokens.some((token) => token !== "width" && token !== "height")))
            aelluxJs2.diagnostics.warn(
              aelluxJs2.diagnostics.WARN_ANCHOR_MATCH,
              { extension: extensionName, element, value: element.getAttribute(matchAttribute) }
            );
          if ((tokens.includes("width") || tokens.includes("height")) && style.position !== "absolute" && style.position !== "fixed") {
            associationDiagnostic(element, "Dimension matching requires an out-of-flow Anchor.");
            return { hidden: true, target, reference };
          }
          if (!measure) return { valid: true, target };
          const referenceRect = reference.getBoundingClientRect();
          const scaleX = reference.offsetWidth ? referenceRect.width / reference.offsetWidth : 1;
          const scaleY = reference.offsetHeight ? referenceRect.height / reference.offsetHeight : 1;
          const targetRect = toReference(target.getBoundingClientRect(), reference, referenceRect, scaleX, scaleY);
          const selfRect = element.getBoundingClientRect();
          const visual = toReference(selfRect, reference, referenceRect, scaleX, scaleY);
          const fromSelf = [ORIGIN_X, ORIGIN_Y].map((name) => (parseFloat(style.getPropertyValue(name)) || 0) / 100);
          const matrix = /^matrix(3d)?\(([^)]*)\)$/.exec(style.transform);
          const components = matrix ? matrix[2].split(",").map(Number) : null;
          const visualX = components ? components[matrix[1] ? 12 : 4] : visual.left - element.offsetLeft;
          const visualY = components ? components[matrix[1] ? 13 : 5] : visual.top - element.offsetTop;
          const fromGeometry = {
            width: parseFloat(style.getPropertyValue("--ae-anchor-target-width")) || 0,
            height: parseFloat(style.getPropertyValue("--ae-anchor-target-height")) || 0,
            selected: {
              x: visualX,
              y: visualY,
              self: fromSelf,
              pivotX: visualX + visual.width * fromSelf[0],
              pivotY: visualY + visual.height * fromSelf[1]
            }
          };
          const projectSize = (axis, actual, desired) => {
            var _a;
            const inline = element.style[axis].replace(/\s+/g, "");
            if (!tokens.includes(axis) || inline && inline !== `var(--ae-anchor-target-${axis})`) return actual;
            const previous = parseFloat(element.style.getPropertyValue(`--ae-anchor-target-${axis}`)) || 0;
            const sides = axis === "width" ? ["Left", "Right"] : ["Top", "Bottom"];
            const extra = sides.reduce((sum, side) => sum + (parseFloat(style[`padding${side}`]) || 0) + (parseFloat(style[`border${side}Width`]) || 0), 0);
            const borderBox = style.boxSizing === "border-box";
            const minimum = Math.max(borderBox ? extra : 0, parseFloat(style.getPropertyValue(`min-${axis}`)) || 0);
            const maximum = parseFloat(style.getPropertyValue(`max-${axis}`));
            const constrain = (value) => Math.max(minimum, Math.min(Number.isFinite(maximum) ? maximum : Infinity, value));
            return !((_a = anchors.get(element)) == null ? void 0 : _a.switchOperation) && Math.abs(parseFloat(style[axis]) - constrain(previous)) > 0.5 ? actual : constrain(desired) + (borderBox ? 0 : extra);
          };
          const selfWidth = projectSize("width", selfRect.width / scaleX, targetRect.width);
          const selfHeight = projectSize("height", selfRect.height / scaleY, targetRect.height);
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
            const result = {
              x,
              y,
              self: candidate.self,
              pivotX: targetRect.left + targetRect.width * candidate.target[0],
              pivotY: targetRect.top + targetRect.height * candidate.target[1]
            };
            if (!selected) selected = result;
            if (x >= boundaryRect.left && y >= boundaryRect.top && x + selfWidth <= boundaryRect.left + boundaryRect.width && y + selfHeight <= boundaryRect.top + boundaryRect.height) {
              selected = result;
              break;
            }
          }
          const present = target.closest(`[${presentAttribute}]`);
          const opacity = present ? root2.getComputedStyle(present).opacity : "1";
          const rawDuration = style.getPropertyValue("--ae-anchor-switch-duration").trim();
          const duration = aelluxJs2.currentPreference("reduced-motion") === "reduced" ? 0 : Math.max(0, (parseFloat(rawDuration) || 0) * (rawDuration.endsWith("ms") ? 1 : 1e3));
          const position = tokens.includes("width") || tokens.includes("height") ? [selected.pivotX, selected.pivotY] : [selected.x, selected.y];
          return {
            valid: true,
            target,
            reference,
            selected,
            opacity,
            duration,
            scaleX,
            scaleY,
            fromGeometry,
            easing: style.getPropertyValue("--ae-anchor-switch-ease").trim() || "ease-in-out",
            width: targetRect.width,
            height: targetRect.height,
            signature: [...position, targetRect.width, targetRect.height, ...selected.self].join("/")
          };
        }
        function writePlacement(element, placement) {
          const selected = placement.selected;
          const style = element.style;
          setValue(style, "--ae-anchor-x", `${selected.x}px`);
          setValue(style, "--ae-anchor-y", `${selected.y}px`);
          setValue(style, ORIGIN_X, `${selected.self[0] * 100}%`);
          setValue(style, ORIGIN_Y, `${selected.self[1] * 100}%`);
          setValue(style, ANCHOR_OPACITY, placement.opacity);
          setValue(style, "--ae-anchor-target-width", `${placement.width}px`);
          setValue(style, "--ae-anchor-target-height", `${placement.height}px`);
          setValue(style, "--ae-anchor-pivot-x", `${selected.pivotX}px`);
          setValue(style, "--ae-anchor-pivot-y", `${selected.pivotY}px`);
          element.classList.add(anchoredClass);
        }
        function isInvisible(element) {
          const visibility = root2.getComputedStyle(element).visibility;
          if (visibility === "hidden" || visibility === "collapse") return true;
          for (let current = element; current && current.nodeType === 1; current = current.parentElement) {
            const style = root2.getComputedStyle(current);
            if (style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) return true;
          }
          return false;
        }
        function hideForTarget(element, state, placement) {
          var _a;
          const previous = state.group && ((_a = state.lastPlacement) == null ? void 0 : _a.target) !== placement.target ? state.lastPlacement : null;
          deactivate(element, state);
          state.lastPlacement = previous;
          state.invalidContext = false;
          if (placement.reference) listenForLayout(state, placement.reference);
        }
        function invalidContext(element, state, placement) {
          deactivate(element, state);
          if (placement.reference)
            listenForLayout(state, placement.reference);
          if (state.invalidContext) return;
          aelluxJs2.diagnostics.error(
            aelluxJs2.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT,
            {
              extension: extensionName,
              element,
              target: placement.target,
              attribute: targetAttribute,
              value: element.getAttribute(targetAttribute),
              reason: "Anchor and target use incompatible positioning references.",
              suggestion: "Place both elements in the same containing block, or use that block as the target."
            }
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
          if (state.reference) aelluxJs2.offEvent(state.reference, layoutEvent, state.layoutListener);
          state.reference = reference;
          if (reference) aelluxJs2.onEvent(reference, layoutEvent, state.layoutListener);
        }
        function deactivate(element, state, memory = elementMemories.get(element)) {
          stopSwitch(element, state);
          if (state.reference) aelluxJs2.offEvent(state.reference, layoutEvent, state.layoutListener);
          if (state.observer) state.observer.disconnect();
          if (state.intersectionObserver) state.intersectionObserver.disconnect();
          state.target = state.reference = null;
          element.classList.remove(anchoredClass);
          if (state.active && memory) memory.restore();
          state.active = false;
          state.lastPlacement = null;
          state.scrollVisible = false;
          state.scrollPending = false;
          rememberVisual(element, state);
        }
        function stopSwitch(element, state, keepStyles = false) {
          const operation = state.switchOperation;
          state.switchOperation = null;
          aelluxJs2.waitLayout.cancel(state.motionId);
          aelluxJs2.waitLayout.setVisualFPSLimit(state.motionId, null);
          element.classList.remove(switchingClass);
          if (!keepStyles && (operation == null ? void 0 : operation.styles)) {
            element.getBoundingClientRect();
            operation.styles.restore();
          }
          rememberVisual(element, state);
          return (operation == null ? void 0 : operation.styles) || null;
        }
        function suppressTransitions(element) {
          const style = root2.getComputedStyle(element);
          if (!style.transitionDuration.split(",").some((value) => parseFloat(value) > 0)) return null;
          const properties = style.transitionProperty.split(",").map((property) => property.trim());
          const controlled = [
            "transform",
            "transform-origin",
            ...(element.getAttribute(matchAttribute) || "").split(/\s+/).filter((property) => property === "width" || property === "height"),
            ...ownedProperties.filter((property) => property.startsWith("--ae-anchor-"))
          ];
          const horizontal = !style.writingMode || style.writingMode.startsWith("horizontal");
          if (controlled.includes("width")) controlled.push(horizontal ? "inline-size" : "block-size");
          if (controlled.includes("height")) controlled.push(horizontal ? "block-size" : "inline-size");
          const memory = aelluxJs2.persist.element.save(element, [], ["transition-property", "transition-duration", "transition-delay", "transition-timing-function"]);
          const durations = style.transitionDuration.split(","), delays = style.transitionDelay.split(",");
          const timing = style.transitionTimingFunction.match(/(?:[^,(]|\([^)]*\))+/g) || ["ease"];
          const retained = [], times = [], waits = [], easings = [];
          properties.forEach((property, index) => {
            for (const name of property === "all" ? Array.from(style) : [property]) {
              if (name === "none" || controlled.includes(name.replace(/^-(?:webkit|moz|ms|o)-/, ""))) continue;
              retained.push(name);
              times.push(durations[index % durations.length]);
              waits.push(delays[index % delays.length]);
              easings.push(timing[index % timing.length]);
            }
          });
          element.style.setProperty("transition-property", retained.join(",") || "none", "important");
          element.style.setProperty("transition-duration", times.join(",") || "0s", "important");
          element.style.setProperty("transition-delay", waits.join(",") || "0s", "important");
          element.style.setProperty("transition-timing-function", easings.join(",") || "ease", "important");
          return memory;
        }
        function placeDirectly(element, placement) {
          const memory = suppressTransitions(element);
          try {
            writePlacement(element, placement);
            if (memory) element.getBoundingClientRect();
          } finally {
            memory == null ? void 0 : memory.restore();
          }
        }
        function setValue(style, name, value) {
          if (style.getPropertyValue(name) === value && !style.getPropertyPriority(name)) return;
          if (style.getPropertyPriority(name)) style.removeProperty(name);
          style.setProperty(name, value);
        }
        function startSwitch(element, state, placement) {
          var _a;
          const from = ((_a = state.switchOperation) == null ? void 0 : _a.rendered) || placement.fromGeometry;
          const retained = stopSwitch(element, state, true);
          const operation = {
            target: placement.target,
            startedAt: now(),
            duration: placement.duration,
            easing: createCssEasing(placement.easing, aelluxJs2),
            fromGeometry: from,
            toGeometry: placement,
            rendered: from,
            styles: retained || suppressTransitions(element)
          };
          state.switchOperation = operation;
          element.classList.add(switchingClass);
          renderSwitch(element, state, operation);
          const limits = [aelluxJs2.layoutMaxFPS(element)];
          const matching = (element.getAttribute(matchAttribute) || "").split(/\s+/).some((axis) => axis === "width" || axis === "height");
          const policy = aelluxJs2.options.cssMotionPropertyMaxFPS;
          if (matching && policy !== null && policy !== 0) {
            const value = Number(policy);
            if (Number.isFinite(value) && value > 0) limits.push(value);
            else {
              if (policy !== void 0) aelluxJs2.diagnostics.warn(
                aelluxJs2.diagnostics.WARN_CSS_MOTION_PROPERTY_MAX_FPS_INVALID,
                {
                  extension: "core",
                  option: "cssMotionPropertyMaxFPS",
                  value: policy,
                  fallback: 55,
                  reason: "CSS Motion frame rate must be finite and greater than zero; using 55 FPS.",
                  suggestion: "Use a positive finite number or omit the option for the default."
                }
              );
              limits.push(55);
            }
          }
          const maxFPS = limits.filter((value) => Number.isFinite(value) && value > 0).reduce((min, value) => Math.min(min, value), Infinity);
          aelluxJs2.waitLayout.setVisualFPSLimit(state.motionId, maxFPS === Infinity ? null : maxFPS);
          aelluxJs2.waitLayout.sequence(state.motionId, {
            update: () => renderSwitch(element, state, operation),
            repeat: { ms: 0 },
            maxFPS: maxFPS === Infinity ? void 0 : maxFPS,
            abort: () => anchors.get(element) !== state || state.switchOperation !== operation
          }).catch((cause) => {
            if (state.switchOperation === operation) stopSwitch(element, state);
            aelluxJs2.diagnostics.error(
              aelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
              { cause, extension: extensionName, element, method: "switch" }
            );
          });
        }
        function renderSwitch(element, state, operation) {
          if (state.switchOperation !== operation || effectiveTarget(element, state) !== operation.target) return;
          const progress = Math.max(0, Math.min(1, (now() - operation.startedAt) / operation.duration));
          const from = operation.fromGeometry, to = operation.toGeometry;
          const eased = operation.easing(progress);
          const mix = (a, b) => a + (b - a) * eased;
          const geometry = {
            target: to.target,
            reference: to.reference,
            opacity: to.opacity,
            width: Math.max(0, mix(from.width, to.width)),
            height: Math.max(0, mix(from.height, to.height)),
            selected: {
              x: mix(from.selected.x, to.selected.x),
              y: mix(from.selected.y, to.selected.y),
              pivotX: mix(from.selected.pivotX, to.selected.pivotX),
              pivotY: mix(from.selected.pivotY, to.selected.pivotY),
              self: from.selected.self.map((value, axis) => mix(value, to.selected.self[axis]))
            }
          };
          operation.rendered = progress === 1 ? to : geometry;
          writePlacement(element, operation.rendered);
          if (progress === 1 || aelluxJs2.currentPreference("reduced-motion") === "reduced") {
            writePlacement(element, to);
            stopSwitch(element, state);
            scheduleAnchor(element);
          }
          rememberVisual(element, state);
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

  // src/aellux.ext.viewport.js
  var aellux_ext_viewport_exports = {};
  var init_aellux_ext_viewport = __esm({
    "src/aellux.ext.viewport.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const aelluxJs2 = root2.aelluxJs;
        if (!aelluxJs2) throw new Error("[aellux.js] Load the boot script before the viewport extension.");
        const extensionName = "viewport";
        const attribute = aelluxJs2.attr(extensionName);
        const targetAttribute = aelluxJs2.attr("viewport-target");
        const properties = ["--ae-viewport-x", "--ae-viewport-y", "--ae-viewport-visible"];
        const EVENT_EPSILON = 1e-6;
        const document2 = root2.document;
        const states = /* @__PURE__ */ new Map();
        const groups = /* @__PURE__ */ new Map();
        const resizeTargets = /* @__PURE__ */ new Map();
        const owners = /* @__PURE__ */ new Map();
        const writtenStyles = /* @__PURE__ */ new WeakMap();
        let nextLayoutId = 6e6;
        let mutations = null, resizeObserver = null;
        aelluxJs2.extAttach(extensionName, { init, destroy });
        function init() {
          aelluxJs2.registerCssProperty(...properties.map((name) => ({ name, syntax: "<number>", initialValue: "0", inherits: false })));
          aelluxJs2.mountManager.add({
            extensionName,
            selector: `[${attribute}]`,
            mount,
            update,
            unmount
          });
        }
        function destroy() {
          for (const element of states.keys()) unmount(element);
          aelluxJs2.mountManager.remove({ extensionName });
        }
        function mount(element) {
          if (states.has(element)) return;
          const state = {
            element,
            group: null,
            configuration: null,
            axes: "both",
            target: null,
            memories: [],
            targetWarning: null,
            conflict: null,
            values: [],
            snapshot: null,
            unmountRequest: null,
            resizeTargets: /* @__PURE__ */ new Set()
          };
          states.set(element, state);
          if (states.size === 1) startObserving();
          join(state, document2);
          return update(element);
        }
        async function update(element) {
          const state = states.get(element);
          if (!state) return;
          let group;
          do {
            group = state.group;
            await schedule(group);
          } while (states.get(element) === state && state.group !== group);
        }
        function unmount(element) {
          const state = states.get(element);
          if (!state) return;
          states.delete(element);
          leave(state);
          observeSizes(state, /* @__PURE__ */ new Set());
          releaseTarget(state);
          if (!states.size) stopObserving();
        }
        function startObserving() {
          aelluxJs2.onEvent(root2, "$resize", scheduleAll);
          aelluxJs2.onEvent(document2, "$load", scheduleAll, true);
          aelluxJs2.onEvent(document2, aelluxJs2.eventName("Layout"), onLayout);
          aelluxJs2.onEvent(document2, aelluxJs2.eventName("BeforeUnmount"), onBeforeUnmount);
          if (root2.ResizeObserver) resizeObserver = new root2.ResizeObserver(scheduleAll);
          if (root2.MutationObserver) {
            mutations = new root2.MutationObserver((records) => {
              if (records.some((record) => {
                return record.type !== "attributes" || record.attributeName !== "style" || !writtenStyles.has(record.target) || record.target.getAttribute("style") !== writtenStyles.get(record.target);
              })) scheduleAll();
            });
            mutations.observe(document2, {
              childList: true,
              subtree: true,
              characterData: true,
              attributes: true,
              attributeFilter: [attribute, targetAttribute, "id", "class", "style", "hidden", "open", "width", "height", "src"]
            });
          }
        }
        function stopObserving() {
          aelluxJs2.offEvent(root2, "$resize", scheduleAll);
          aelluxJs2.offEvent(document2, "$load", scheduleAll, true);
          aelluxJs2.offEvent(document2, aelluxJs2.eventName("Layout"), onLayout);
          aelluxJs2.offEvent(document2, aelluxJs2.eventName("BeforeUnmount"), onBeforeUnmount);
          mutations == null ? void 0 : mutations.disconnect();
          resizeObserver == null ? void 0 : resizeObserver.disconnect();
          mutations = resizeObserver = null;
          resizeTargets.clear();
        }
        function onLayout(event) {
          var _a;
          const duration = Number((_a = event.detail) == null ? void 0 : _a.durationMs);
          for (const group of groups.values()) {
            if (Number.isFinite(duration) && duration > 0)
              group.layoutUntil = Math.max(group.layoutUntil, root2.performance.now() + duration);
            schedule(group);
          }
        }
        function onBeforeUnmount(event) {
          const { root: subtree, extensions, detachedOnly } = event.detail;
          if (extensions && !extensions.includes(extensionName)) return;
          for (const state of states.values()) {
            if (detachedOnly && state.element.isConnected) continue;
            if (state.element === subtree || subtree.contains(state.element) || subtree === document2 && !state.element.isConnected) state.unmountRequest = event;
          }
        }
        function current(state, group) {
          return states.get(state.element) === state && state.group === group && state.element.isConnected && state.element.hasAttribute(attribute) && (!state.unmountRequest || state.unmountRequest.defaultPrevented);
        }
        function scheduleAll() {
          for (const group of groups.values()) schedule(group);
        }
        function join(state, reference) {
          var _a, _b;
          if (((_a = state.group) == null ? void 0 : _a.reference) === reference) return;
          leave(state);
          let group = groups.get(reference);
          if (!group) {
            group = {
              reference,
              states: /* @__PURE__ */ new Set(),
              id: nextLayoutId++,
              active: true,
              pending: null,
              dirty: false,
              timer: null,
              layoutUntil: 0,
              intersection: null
            };
            group.onScroll = () => schedule(group);
            aelluxJs2.onEvent(reference === document2 ? root2 : reference, "$scroll", group.onScroll, { passive: true });
            if (root2.IntersectionObserver) {
              group.intersection = new root2.IntersectionObserver(
                group.onScroll,
                { root: reference === document2 ? null : reference, threshold: [0, 1e-6, 1] }
              );
            }
            groups.set(reference, group);
          }
          state.group = group;
          group.states.add(state);
          (_b = group.intersection) == null ? void 0 : _b.observe(state.element);
        }
        function leave(state) {
          var _a, _b;
          const group = state.group;
          if (!group) return;
          group.states.delete(state);
          (_a = group.intersection) == null ? void 0 : _a.unobserve(state.element);
          state.group = null;
          if (group.states.size) return;
          group.active = false;
          aelluxJs2.waitLayout.cancel(group.id);
          if (group.timer !== null) root2.clearTimeout(group.timer);
          (_b = group.intersection) == null ? void 0 : _b.disconnect();
          aelluxJs2.offEvent(group.reference === document2 ? root2 : group.reference, "$scroll", group.onScroll);
          groups.delete(group.reference);
        }
        function schedule(group) {
          if (!(group == null ? void 0 : group.active)) return;
          if (group.pending) {
            group.dirty = true;
            return group.pending;
          }
          group.pending = refresh(group).catch((error) => {
            group.dirty = false;
            group.layoutUntil = 0;
            throw error;
          }).finally(() => {
            group.pending = null;
            if (!group.active) return;
            if (group.dirty) {
              group.dirty = false;
              schedule(group);
            } else if (root2.performance.now() < group.layoutUntil && group.timer === null) {
              group.timer = root2.setTimeout(() => {
                group.timer = null;
                schedule(group);
              }, 16);
            }
          });
          group.pending.catch((error) => reportError(group, "refresh", error));
          return group.pending;
        }
        function reportError(group, operation, error, element = group.reference) {
          aelluxJs2.dispatch("ViewportError", {
            detail: {
              error,
              operation,
              reference: group.reference,
              elements: operation === "unmount" ? [element] : Array.from(group.states, (state) => state.element)
            }
          });
          aelluxJs2.diagnostics.error(operation === "unmount" ? aelluxJs2.diagnostics.ERROR_EXTENSION_UNMOUNT : aelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT, {
            extension: extensionName,
            cause: error,
            operation,
            element
          });
        }
        async function refresh(group) {
          const measurements = await aelluxJs2.waitLayout.read(group.id, () => measure(group));
          if (!group.active || !measurements) return;
          await aelluxJs2.waitLayout.update(group.id, () => {
            for (const { state, target, values, snapshot, changed } of measurements) {
              if (states.get(state.element) !== state || state.group !== group) continue;
              if (values === null) {
                aelluxJs2.mountManager.unmount(state.element, extensionName).catch((error) => reportError(group, "unmount", error, state.element));
                continue;
              }
              if (!current(state, group)) continue;
              selectTarget(state, (target == null ? void 0 : target.isConnected) ? target : null);
              for (let index = 0; state.target && index < properties.length; index++) {
                if (values[index] === state.values[index]) continue;
                if (values[index] === null) state.memories[index].restore();
                else state.target.style.setProperty(
                  properties[index],
                  String(values[index]),
                  state.memories[index].cssProperties[properties[index]].priority
                );
              }
              if (state.target) {
                state.values = values;
                writtenStyles.set(state.target, state.target.getAttribute("style"));
              }
              if (changed) {
                const previous = state.snapshot;
                state.snapshot = snapshot;
                const initial = previous === null;
                const emit = (name) => aelluxJs2.dispatchFrom(state.element, name, {
                  bubbles: true,
                  composed: true,
                  cancelable: false,
                  detail: __spreadProps(__spreadValues({}, snapshot), { previous: previous && __spreadValues({}, previous), initial })
                });
                emit("ViewportChange");
                if (current(state, group) && snapshot.measurable && snapshot.state !== (previous == null ? void 0 : previous.state)) {
                  if (snapshot.state === "inside") emit("ViewportFullyInside");
                  else if (snapshot.state === "outside") emit("ViewportFullyOutside");
                }
              }
            }
          });
        }
        function measure(group) {
          const measurements = [];
          let viewport;
          for (const state of Array.from(group.states)) {
            const element = state.element;
            if (!element.isConnected) continue;
            if (!element.hasAttribute(attribute)) {
              measurements.push({ state, values: null });
              continue;
            }
            const targets = /* @__PURE__ */ new Set([element]);
            let reference = document2;
            for (let parent = element.parentElement; parent; parent = parent.parentElement) {
              targets.add(parent);
              for (const sibling of parent.children) targets.add(sibling);
              const rootStyle = parent === document2.body ? root2.getComputedStyle(document2.documentElement) : null;
              const propagatedBody = rootStyle && rootStyle.overflowX === "visible" && rootStyle.overflowY === "visible";
              if (reference === document2 && parent !== (document2.scrollingElement || document2.documentElement) && !propagatedBody && scrollable(parent))
                reference = parent;
            }
            observeSizes(state, targets);
            configure(state);
            if (reference !== group.reference) {
              join(state, reference);
              schedule(state.group);
              continue;
            }
            if (!viewport) viewport = viewportRect(reference);
            const { values, snapshot } = valuesFor(state, viewport);
            measurements.push({
              state,
              target: resolveTarget(state),
              values,
              snapshot,
              changed: geometryChanged(state.snapshot, snapshot)
            });
          }
          return measurements;
        }
        function configure(state) {
          const value = state.element.getAttribute(attribute);
          if (value === state.configuration) return;
          state.configuration = value;
          state.axes = value === "x" || value === "y" ? value : "both";
          if (value !== "" && value !== "both" && value !== "x" && value !== "y") {
            aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_CONFIGURATION_VALUE, {
              extension: extensionName,
              element: state.element,
              attribute,
              value,
              reason: "Unknown viewport axis; using both.",
              suggestion: 'Use an empty value, "both", "x", or "y".'
            });
          }
        }
        function resolveTarget(state) {
          const value = state.element.getAttribute(targetAttribute);
          if (value === null) {
            state.targetWarning = null;
            return state.element;
          }
          const id = value.trim().replace(/^#/, "");
          const target = id && !/\s/.test(id) ? document2.getElementById(id) : null;
          if (!target || !target.style) {
            if (state.targetWarning !== value) aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_CONFIGURATION_TARGET, {
              extension: extensionName,
              element: state.element,
              attribute: targetAttribute,
              value,
              reason: "Viewport target does not exist or is not a styleable element ID.",
              suggestion: "Use one existing element ID, optionally prefixed with #, or remove the target attribute."
            });
            state.targetWarning = value;
            return null;
          }
          state.targetWarning = null;
          return target;
        }
        function releaseTarget(state) {
          if (!state.target) return;
          for (const memory of state.memories) memory.restore();
          writtenStyles.set(state.target, state.target.getAttribute("style"));
          owners.delete(state.target);
          state.target = null;
          state.memories = [];
          state.values = [];
          scheduleAll();
        }
        function selectTarget(state, target) {
          if (state.target === target) return;
          releaseTarget(state);
          const owner = owners.get(target);
          if (owner) {
            if (state.conflict !== owner) aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_RESOURCE_CONFLICT, {
              extension: extensionName,
              element: state.element,
              attribute: targetAttribute,
              target,
              property: "--ae-viewport-visible",
              writers: [owner.element, state.element],
              reason: "Two Viewport observers publish the same CSS properties on this target.",
              suggestion: "Use a separate target for each Viewport observer."
            });
            state.conflict = owner;
            return;
          }
          state.conflict = null;
          if (!target) return;
          owners.set(target, state);
          state.target = target;
          state.memories = properties.map((property) => aelluxJs2.persist.element.save(target, [], [property]));
        }
        function scrollable(element) {
          const style = root2.getComputedStyle(element);
          return ["X", "Y"].some((axis) => {
            const overflow = style["overflow" + axis];
            return overflow === "auto" || overflow === "scroll" || overflow === "hidden" && element[axis === "X" ? "scrollWidth" : "scrollHeight"] > element[axis === "X" ? "clientWidth" : "clientHeight"];
          });
        }
        function observeSizes(state, targets) {
          if (!resizeObserver) return;
          for (const target of state.resizeTargets) {
            if (targets.has(target)) continue;
            const count = resizeTargets.get(target) - 1;
            if (count) resizeTargets.set(target, count);
            else {
              resizeTargets.delete(target);
              resizeObserver.unobserve(target);
            }
          }
          for (const target of targets) {
            if (state.resizeTargets.has(target)) continue;
            const count = resizeTargets.get(target) || 0;
            if (!count) resizeObserver.observe(target);
            resizeTargets.set(target, count + 1);
          }
          state.resizeTargets = targets;
        }
        function viewportRect(reference) {
          if (reference === document2) {
            const scrolling = document2.scrollingElement || document2.documentElement;
            return {
              left: 0,
              top: 0,
              width: document2.documentElement.clientWidth || scrolling.clientWidth || root2.innerWidth,
              height: document2.documentElement.clientHeight || scrolling.clientHeight || root2.innerHeight
            };
          }
          const rect = reference.getBoundingClientRect();
          const style = root2.getComputedStyle(reference);
          const borderSize = (axis) => parseFloat(style[axis]) + (style.boxSizing === "border-box" ? 0 : axis === "width" ? parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth) : parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth));
          const width = borderSize("width"), height = borderSize("height");
          const left = parseFloat(style.borderLeftWidth), right = parseFloat(style.borderRightWidth);
          const top = parseFloat(style.borderTopWidth), bottom = parseFloat(style.borderBottomWidth);
          const scaleX = rect.width / width, scaleY = rect.height / height;
          const scrollbarX = Math.max(0, reference.offsetWidth - reference.clientWidth - Math.round(left + right));
          const scrollbarY = Math.max(0, reference.offsetHeight - reference.clientHeight - Math.round(top + bottom));
          const leftScrollbar = Math.max(0, reference.clientLeft - Math.round(left));
          return {
            left: rect.left + (left + leftScrollbar) * scaleX,
            top: rect.top + top * scaleY,
            width: Math.max(0, width - left - right - scrollbarX) * scaleX,
            height: Math.max(0, height - top - bottom - scrollbarY) * scaleY
          };
        }
        function valuesFor(state, viewport) {
          const rect = state.element.getBoundingClientRect();
          let x = 0, y = 0, visible = 0;
          const snapshot = {
            viewport: state.group.reference,
            x1: null,
            y1: null,
            x2: null,
            y2: null,
            x: null,
            y: null,
            visible,
            state: null,
            measurable: false
          };
          if ([
            viewport.left,
            viewport.top,
            viewport.width,
            viewport.height,
            rect.left,
            rect.top,
            rect.right,
            rect.bottom,
            rect.width,
            rect.height
          ].every(Number.isFinite) && viewport.width > 0 && viewport.height > 0 && rect.width > 0 && rect.height > 0) {
            const centerX = viewport.left + viewport.width / 2, centerY = viewport.top + viewport.height / 2;
            const x1 = (rect.left - centerX) * 2 / viewport.width, x2 = (rect.right - centerX) * 2 / viewport.width;
            const y1 = (rect.top - centerY) * 2 / viewport.height, y2 = (rect.bottom - centerY) * 2 / viewport.height;
            if (![x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2].every(Number.isFinite))
              return { values: [state.axes === "y" ? null : 0, state.axes === "x" ? null : 0, 0], snapshot };
            snapshot.x1 = x1;
            snapshot.y1 = y1;
            snapshot.x2 = x2;
            snapshot.y2 = y2;
            snapshot.x = (x1 + x2) / 2;
            snapshot.y = (y1 + y2) / 2;
            x = clamp2(snapshot.x, -2, 2);
            y = clamp2(snapshot.y, -2, 2);
            const width = Math.max(0, Math.min(rect.right, viewport.left + viewport.width) - Math.max(rect.left, viewport.left));
            const height = Math.max(0, Math.min(rect.bottom, viewport.top + viewport.height) - Math.max(rect.top, viewport.top));
            visible = clamp2(width / rect.width * (height / rect.height), 0, 1);
            snapshot.visible = visible;
            snapshot.measurable = true;
            snapshot.state = width > 0 && height > 0 ? rect.left >= viewport.left && rect.top >= viewport.top && rect.right <= viewport.left + viewport.width && rect.bottom <= viewport.top + viewport.height ? "inside" : "partial" : "outside";
          }
          return { values: [state.axes === "y" ? null : x, state.axes === "x" ? null : y, visible], snapshot };
        }
        function geometryChanged(previous, snapshot) {
          if (!previous) return snapshot.measurable;
          if (snapshot.viewport !== previous.viewport || snapshot.measurable !== previous.measurable || snapshot.state !== previous.state) return true;
          if (snapshot.measurable && ["x1", "y1", "x2", "y2"].some((key) => [-1, 1].some((edge) => Math.sign(snapshot[key] - edge) !== Math.sign(previous[key] - edge)))) return true;
          return ["x1", "y1", "x2", "y2", "x", "y", "visible"].some((key) => Math.abs(snapshot[key] - previous[key]) > EVENT_EPSILON);
        }
        function clamp2(value, minimum, maximum) {
          return Math.max(minimum, Math.min(maximum, value));
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
        const aelluxJs2 = root2.aelluxJs;
        const extensionName = "scrollbox";
        if (!aelluxJs2) throw new Error("[aellux.js] Load the boot script before the scrollbox extension.");
        const { onEvent, offEvent } = aelluxJs2;
        const POINTER = "pointer", POINTER_DOWN = `${POINTER}down`, POINTER_MOVE = `${POINTER}move`, POINTER_UP = `${POINTER}up`, POINTER_CANCEL = `${POINTER}cancel`, POINTER_OVER = `${POINTER}over`, POINTER_OUT = `${POINTER}out`, POINTER_ENTER = `${POINTER}enter`, POINTER_LEAVE = `${POINTER}leave`, POINTER_DOWN_TARGET = `$${POINTER_DOWN}`, POINTER_MOVE_TARGET = `$${POINTER_MOVE}`, POINTER_UP_TARGET = `$${POINTER_UP}`, POINTER_CANCEL_TARGET = `$${POINTER_CANCEL}`;
        const attribute = aelluxJs2.attr(extensionName);
        const wheelAttribute = aelluxJs2.attr("scrollbox-wheel-horizontal");
        const momentumAttribute = aelluxJs2.attr("scrollbox-momentum");
        const snapAttribute = aelluxJs2.attr("scrollbox-snap");
        const elasticAttribute = aelluxJs2.attr("scrollbox-elastic");
        const fadeAttribute = aelluxJs2.attr("scrollbox-fade");
        const fadeStateAttribute = aelluxJs2.attr("scrollbox-fade-state");
        const layoutEvents = ["Layout", "Pop", "Dismiss", "Unpop"].map((name) => aelluxJs2.eventName(name));
        const scrollbarAttribute = aelluxJs2.attr("scrollbar");
        const scrollbarParentAttribute = aelluxJs2.attr("scrollbar-parent");
        const scrollbarVerticalAttribute = aelluxJs2.attr("scrollbar-vertical");
        const scrollbarHorizontalAttribute = aelluxJs2.attr("scrollbar-horizontal");
        const elasticReleaseClass = aelluxJs2.className("scrollbox-elastic-release");
        const pointerScrollingClass = aelluxJs2.className("pointerscrolling");
        const nativeScrollbarHideClass = aelluxJs2.className("native-sb-hide");
        const scrollbarVisibleClass = aelluxJs2.className("scrollbar-visible");
        const scrollbarWrapperClass = aelluxJs2.className("scrollbar-wrapper");
        const scrollEdgeClasses = [
          aelluxJs2.className("scroll-v-start"),
          aelluxJs2.className("scroll-v-end"),
          aelluxJs2.className("scroll-h-start"),
          aelluxJs2.className("scroll-h-end")
        ];
        const pointerScrollControlSelector = "a[draggable='false'], button[draggable='false']";
        const pointerScrollExceptionSelector = `a:not([draggable='false']), button:not([draggable='false']), input, select, textarea, [contenteditable], [draggable='true'], [${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`;
        const SCROLL_EDGE_MARGIN_PX = 5;
        let nextLayoutId = 3e6;
        const POINTER_SCROLL_THRESHOLD_PX = 3;
        const POINTER_SCROLL_MULTICLICK_MS = 500;
        const POINTER_SCROLL_MULTICLICK_DISTANCE_PX = 8;
        const TEXT_SELECTION_WAIT_MS = 100;
        const VERTICAL_TEXT_DRAG_PX = 10;
        const MOMENTUM_LIMIT_TIME_MS = 300;
        const MOMENTUM_LIMIT_DISTANCE_PX = 15;
        const MOMENTUM_DECELERATION = 15e-4;
        const ELASTIC_DAMPING = 1 / 3;
        const DEFAULT_ELASTIC_LIMIT = { unit: "ratio", value: 1 / 4 };
        const ELASTIC_RETURN_LERP = 0.15;
        const ELASTIC_RETURN_EPSILON = 0.01;
        const ELASTIC_WHEEL_IDLE_MS = 80;
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
        const scrollbarThemeProperties = [
          "size",
          "thumb-radius",
          "thumb-color",
          "thumb-hover-color",
          "track-color",
          "opacity-visible",
          "opacity-fade"
        ].map((name) => `--ae-scrollbar-${name}`);
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
        const touchListeners = [
          ["touchstart", "onTouchStart", { passive: true }],
          ["touchmove", "onTouchMove", { passive: false }],
          ["touchend", "onTouchEnd", { passive: true }],
          ["touchcancel", "onTouchEnd", { passive: true }]
        ];
        function setListeners(target, owner, entries, active) {
          const method = active ? onEvent : offEvent;
          for (const [event, handler, options] of entries) {
            method(target, `$${event}`, owner[handler], active ? options : options === true || !!(options == null ? void 0 : options.capture));
          }
        }
        function isTouch(callback) {
          return (event) => {
            if (event && event.pointerType !== "touch") {
              callback(event);
            }
          };
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
        const fadeProperties = ["top", "right", "bottom", "left"].map((side) => `--ae-scrollbox-hidden-${side}`);
        const supportsCSS = (name, value) => {
          var _a, _b;
          return !!((_b = (_a = root2.CSS) == null ? void 0 : _a.supports) == null ? void 0 : _b.call(_a, name, value));
        };
        const maskSupported = supportsCSS("mask-image", "linear-gradient(#000,#000)") || supportsCSS("-webkit-mask-image", "linear-gradient(#000,#000)");
        const compositeSupported = supportsCSS("mask-composite", "intersect") || supportsCSS("-webkit-mask-composite", "source-in");
        let rtlScrollType = null;
        const scrollboxes = /* @__PURE__ */ new Map();
        const elementMemories = /* @__PURE__ */ new WeakMap();
        const cursorMemories = /* @__PURE__ */ new WeakMap();
        const scrollbarMemories = /* @__PURE__ */ new WeakMap();
        const scrollbarWrappers = /* @__PURE__ */ new WeakMap();
        const scrollbarOwners = /* @__PURE__ */ new WeakMap();
        const inlineMemories = /* @__PURE__ */ new WeakMap();
        const elasticMemories = /* @__PURE__ */ new WeakMap();
        const pointerScrollMemories = /* @__PURE__ */ new WeakMap();
        let activePointerScrollState = null;
        aelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          next,
          previous,
          goto
        });
        function init() {
          layoutEvents.forEach((name) => onEvent(root2.document, name, onLayout));
          aelluxJs2.registerCssProperty(
            ...properties.map((name) => ({ name, syntax: "<number>", initialValue: "0" })),
            ...fadeProperties.map((name) => ({ name, syntax: "<length>", initialValue: "0px", inherits: false })),
            { name: "--ae-scrollbox-fade-size", syntax: "<length>", initialValue: "16px" },
            ...scrollbarProperties.map((name, index) => ({
              name,
              syntax: index === 5 ? "block | none" : "<length>",
              initialValue: index === 5 ? "none" : "0px"
            })),
            { name: "--ae-scrollbar-opacity-visible", syntax: "<number>", initialValue: "1" },
            { name: "--ae-scrollbar-opacity-fade", syntax: "<number>", initialValue: "0" },
            { name: "--ae-scrollbar-thumb-color", syntax: "*" },
            { name: "--ae-scrollbar-thumb-hover-color", syntax: "*" },
            { name: "--ae-scrollbar-track-color", syntax: "*" },
            {
              name: "--ae-scrollbar-thumb-radius",
              syntax: "<length-percentage>",
              initialValue: "10px"
            },
            { name: "--ae-scrollbar-size", syntax: "<length>", initialValue: "8px" }
          );
          aelluxJs2.mountManager.add({
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
          layoutEvents.forEach((name) => offEvent(root2.document, name, onLayout));
          for (const element of scrollboxes.keys()) unmountScrollbox(element);
          aelluxJs2.mountManager.remove({ extensionName });
        }
        function goto(element, index, behavior) {
          return aelluxJs2.comm.request("scrollbox-snap.goto", { element, index, behavior }).value || false;
        }
        function next(element) {
          return aelluxJs2.comm.request("scrollbox-snap.next", { element }).value || false;
        }
        function previous(element) {
          return aelluxJs2.comm.request("scrollbox-snap.previous", { element }).value || false;
        }
        function dispatchInteraction(state, reason, active) {
          aelluxJs2.dispatchFrom(state.element, "ScrollboxInteraction", {
            detail: { reason, active: !!active }
          });
        }
        function dispatchSnapGesture(state, phase, pointerScroll) {
          return aelluxJs2.dispatchFrom(state.element, "ScrollboxSnapGesture", {
            cancelable: phase !== "start",
            detail: {
              phase,
              axis: pointerScroll.axis,
              moved: pointerScroll.moved,
              startX: pointerScroll.startX,
              startY: pointerScroll.startY,
              lastX: pointerScroll.lastX,
              lastY: pointerScroll.lastY,
              startTime: pointerScroll.startTime,
              endTime: pointerScroll.endTime
            }
          });
        }
        function dispatchWheel(state, event) {
          return aelluxJs2.dispatchFrom(state.element, "ScrollboxWheel", {
            cancelable: true,
            detail: { event }
          });
        }
        function mountScrollbox(element) {
          if (scrollboxes.has(element)) return;
          elementMemories.set(element, aelluxJs2.persist.element.save(element, [fadeStateAttribute], [...properties, ...fadeProperties]));
          cursorMemories.set(element, aelluxJs2.persist.element.save(element, [], ["cursor"]));
          const elastic = {
            wrapper: null,
            baseTransform: "",
            baseOrigin: "",
            baseMargins: null,
            dimensions: null,
            invalidReported: false,
            invalidLimit: null,
            limits: [DEFAULT_ELASTIC_LIMIT, DEFAULT_ELASTIC_LIMIT],
            amounts: [0, 0, 0, 0],
            active: false,
            owned: false,
            touch: null,
            releaseFrame: null,
            wheelTimeout: null,
            layoutId: nextLayoutId++,
            publication: null
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
            interactionTimeout: null,
            parent: null
          };
          const state = {
            element,
            metrics: null,
            mode: null,
            desktop: false,
            fadeAuthored: null,
            fadeAxes: null,
            cursor: { owned: false },
            wheelEnabled: true,
            momentumEnabled: true,
            elasticEnabled: false,
            wheelListening: false,
            pointerListening: false,
            touchListening: false,
            pointerScroll: null,
            lastPointerDown: null,
            mouseReleaseButton: null,
            mouseReleaseTimeout: null,
            momentum: null,
            elastic,
            inlineWrapper,
            scrollbar,
            resizeObserver: null,
            mutationObserver: null,
            desktopMedia: null,
            publishPending: false,
            publishDirty: false,
            layoutRevision: 0,
            layoutUntil: 0,
            resizeLayoutId: nextLayoutId++,
            publishLayoutId: nextLayoutId++,
            disposed: false
          };
          state.onScroll = (event) => {
            if (event.target !== element) return;
            publish(state);
            if (!state.desktop && state.scrollbar.listening) scheduleScrollbarInteractionHide(state);
          };
          state.onScrollEnd = (event) => {
            if (event.target !== element) return;
          };
          state.onWheel = (event) => handleWheel(state, event);
          state.onInteractionStart = () => {
            cancelMomentum(state);
            finishElasticRelease(state);
          };
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
            var _a;
            if (event.button === 0 && event.detail > 1 && !((_a = state.pointerScroll) == null ? void 0 : _a.afterDrag))
              endPointerScroll(state);
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
          state.onScrollbarPointerDown = isTouch(() => startScrollbarInteractionVisibility(state));
          state.onScrollbarPointerEnd = isTouch(() => scheduleScrollbarInteractionHide(state));
          state.onScrollbarPointerEnter = isTouch(() => setScrollbarHover(state, "pointerHover", true));
          state.onScrollbarPointerLeave = isTouch(() => setScrollbarHover(state, "pointerHover", false));
          state.onScrollbarPointerOver = isTouch(() => setScrollbarHover(state, "pointerHover", true));
          state.onScrollbarPointerOut = isTouch((event) => {
            if (!containsScrollbarTarget(state, event.relatedTarget))
              setScrollbarHover(state, "pointerHover", false);
          });
          state.onScrollbarPointerMove = isTouch(() => {
            if (!state.scrollbar.pointerHover)
              setScrollbarHover(state, "pointerHover", true);
          });
          state.onScrollbarMouseEnter = () => {
            if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
          };
          state.onScrollbarMouseLeave = () => setScrollbarHover(state, "mouseHover", false);
          state.onScrollbarMouseOver = () => {
            if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
          };
          state.onScrollbarMouseOut = (event) => {
            if (!containsScrollbarTarget(state, event.relatedTarget))
              setScrollbarHover(state, "mouseHover", false);
          };
          state.onScrollbarOutsideDown = (event) => {
            if (!containsScrollbarTarget(state, event.target)) {
              setScrollbarHover(state, "pointerHover", false);
              setScrollbarHover(state, "mouseHover", false);
              if (!element.classList.contains(pointerScrollingClass))
                clearScrollbarInteractionVisibility(state);
              syncScrollbarVisibility(state);
            }
          };
          scrollboxes.set(element, state);
          onEvent(element, "$scroll", state.onScroll, { passive: true });
          onEvent(element, "$scrollend", state.onScrollEnd, { passive: true });
          onEvent(element, POINTER_DOWN_TARGET, state.onInteractionStart, true);
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
          resetElastic(state);
          if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
          restoreInlineWrapper(state);
          resetScrollbars(state);
          offEvent(element, "$scroll", state.onScroll);
          offEvent(element, "$scrollend", state.onScrollEnd);
          offEvent(element, POINTER_DOWN_TARGET, state.onInteractionStart, true);
          if (state.wheelListening) offEvent(element, "$wheel", state.onWheel, true);
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
          aelluxJs2.waitLayout.cancel(state.resizeLayoutId);
          aelluxJs2.waitLayout.cancel(state.publishLayoutId);
          offEvent(root2, "$resize", state.onResize);
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
          state.momentumEnabled = element.getAttribute(momentumAttribute) !== "false" && !hasSnap(element);
          configureElastic(state);
          configureInlineWrapper(state);
          configureScrollbars(state);
          state.desktop = isDesktop();
          if ((state.desktop || state.elasticEnabled) && !state.wheelListening) {
            onEvent(element, "$wheel", state.onWheel, { passive: false, capture: true });
            state.wheelListening = true;
          } else if (!state.desktop && !state.elasticEnabled && state.wheelListening) {
            offEvent(element, "$wheel", state.onWheel, true);
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
          refresh(state);
        }
        function hasSnap(element) {
          return element.hasAttribute(snapAttribute) && element.getAttribute(snapAttribute) !== "false";
        }
        function contentChildren(element, limit) {
          const children = [];
          for (let child = element.firstElementChild; child; child = child.nextElementSibling) {
            if (child.hasAttribute(scrollbarVerticalAttribute) || child.hasAttribute(scrollbarHorizontalAttribute)) continue;
            children.push(child);
            if (children.length === limit) break;
          }
          return children;
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
          const previousParent = state.scrollbar.parent;
          const parent = (axes.x || axes.y) && element.getAttribute(scrollbarParentAttribute) === "wrapper" ? element.parentElement : null;
          if (parent !== previousParent) {
            if (parent) {
              let wrapper = scrollbarWrappers.get(parent);
              if (!wrapper) {
                wrapper = { users: 0, memory: null };
                if (root2.getComputedStyle(parent).position === "static") {
                  wrapper.memory = aelluxJs2.persist.element.save(parent, [], ["position"]);
                  parent.style.setProperty("position", "relative", "important");
                }
                scrollbarWrappers.set(parent, wrapper);
              }
              wrapper.users++;
            }
            state.scrollbar.parent = parent;
            if (state.resizeObserver) {
              if (previousParent) state.resizeObserver.unobserve(previousParent);
              if (parent) state.resizeObserver.observe(parent);
            }
          }
          configureScrollbarAxis(state, "y", axes.y, scrollbarVerticalAttribute);
          configureScrollbarAxis(state, "x", axes.x, scrollbarHorizontalAttribute);
          if (parent !== previousParent) releaseScrollbarWrapper(previousParent);
          const enabled = axes.x || axes.y;
          const scrollbar = state.scrollbar;
          if (enabled && !scrollbar.listening) {
            scrollbar.mouseHover = element.matches(":hover") && supportsMouseHover();
            scrollbar.hoverVisible = scrollbar.mouseHover;
            setListeners(element, state, scrollbarHoverListeners, true);
            aelluxJs2.on(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
            scrollbar.listening = true;
            syncScrollbarVisibility(state);
          } else if (!enabled && scrollbar.listening) {
            setListeners(element, state, scrollbarHoverListeners, false);
            aelluxJs2.off(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
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
          syncScrollbarVisibility(state);
        }
        function configureScrollbarAxis(state, axis, enabled, attributeName) {
          const scrollbar = state.scrollbar;
          const current = scrollbar[axis];
          if (current && enabled && current.parent === scrollbar.parent) {
            positionScrollbarAxis(state, current);
            return;
          }
          if (current) resetScrollbarAxis(state, axis);
          if (!enabled) return;
          let scrollbarElement = Array.from(state.element.children).find((child) => child.hasAttribute(attributeName)) || null;
          const owned = !scrollbarElement;
          if (!scrollbarElement) {
            scrollbarElement = root2.document.createElement("div");
            scrollbarElement.setAttribute(attributeName, "");
            state.element.appendChild(scrollbarElement);
          }
          const marker = owned ? null : root2.document.createComment("scrollbar position");
          if (marker) scrollbarElement.before(marker);
          if (!owned) scrollbarMemories.set(scrollbarElement, aelluxJs2.persist.element.save(
            scrollbarElement,
            [],
            [...scrollbarProperties, ...scrollbarThemeProperties]
          ));
          const record = {
            element: scrollbarElement,
            owned,
            axis,
            marker,
            parent: scrollbar.parent,
            wrapperClassOwned: false,
            visibleClassOwned: false,
            theme: null,
            themeOverrides: scrollbarThemeProperties.map((name) => scrollbarElement.style.getPropertyValue(name)),
            thumbPosition: null,
            thumbSize: null,
            trackSize: null,
            max: null,
            display: null
          };
          record.onPointerDown = (event) => startScrollbarDrag(state, record, event);
          record.onPointerMove = (event) => moveScrollbarDrag(state, record, event);
          record.onPointerEnd = (event) => endScrollbarDrag(state, record, event);
          record.onInteractionStart = () => state.onInteractionStart();
          setListeners(scrollbarElement, record, scrollbarAxisListeners, true);
          scrollbarOwners.set(scrollbarElement, state);
          if (record.parent) {
            record.wrapperClassOwned = !scrollbarElement.classList.contains(scrollbarWrapperClass);
            scrollbarElement.classList.add(scrollbarWrapperClass);
            setListeners(scrollbarElement, state, scrollbarHoverListeners, true);
            onEvent(scrollbarElement, POINTER_DOWN_TARGET, record.onInteractionStart, true);
            onEvent(scrollbarElement, "$wheel", state.onWheel, { passive: false, capture: true });
          }
          scrollbar[axis] = record;
          positionScrollbarAxis(state, record);
        }
        function positionScrollbarAxis(state, record) {
          if (record.parent) {
            if (record.element.parentElement !== record.parent) record.parent.append(record.element);
            return;
          }
          const container = state.element;
          if (record.axis === "y" && container.firstChild !== record.element)
            container.prepend(record.element);
          else if (record.axis === "x" && container.lastChild !== record.element)
            container.append(record.element);
        }
        function resetScrollbarAxis(state, axis) {
          var _a;
          const record = state.scrollbar[axis];
          if (!record) return;
          endScrollbarDrag(state, record);
          const element = record.element;
          setListeners(element, record, scrollbarAxisListeners, false);
          if (record.parent) {
            setListeners(element, state, scrollbarHoverListeners, false);
            offEvent(element, POINTER_DOWN_TARGET, record.onInteractionStart, true);
            offEvent(element, "$wheel", state.onWheel, true);
          }
          if (record.wrapperClassOwned) element.classList.remove(scrollbarWrapperClass);
          if (record.visibleClassOwned) element.classList.remove(scrollbarVisibleClass);
          if (record.owned) element.remove();
          else {
            (_a = scrollbarMemories.get(element)) == null ? void 0 : _a.restore();
            if (record.marker.parentNode) record.marker.replaceWith(element);
            else record.marker.remove();
          }
          scrollbarMemories.delete(element);
          scrollbarOwners.delete(element);
          state.scrollbar[axis] = null;
        }
        function resetScrollbars(state) {
          resetScrollbarAxis(state, "x");
          resetScrollbarAxis(state, "y");
          const scrollbar = state.scrollbar;
          releaseScrollbarWrapper(scrollbar.parent);
          scrollbar.parent = null;
          if (scrollbar.listening) {
            setListeners(state.element, state, scrollbarHoverListeners, false);
            aelluxJs2.off(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
            scrollbar.listening = false;
          }
          if (scrollbar.hideOwned) state.element.classList.remove(nativeScrollbarHideClass);
          scrollbar.hideOwned = false;
          clearScrollbarInteractionVisibility(state);
          clearScrollbarHover(state);
          syncScrollbarVisibility(state);
        }
        function releaseScrollbarWrapper(parent) {
          var _a;
          const wrapper = parent && scrollbarWrappers.get(parent);
          if (!wrapper || --wrapper.users) return;
          (_a = wrapper.memory) == null ? void 0 : _a.restore();
          scrollbarWrappers.delete(parent);
        }
        function containsScrollbarTarget(state, target) {
          return !!target && (state.element.contains(target) || [state.scrollbar.x, state.scrollbar.y].some((record) => record == null ? void 0 : record.element.contains(target)));
        }
        function syncScrollbarBarVisibility(state, visible) {
          for (const record of [state.scrollbar.x, state.scrollbar.y]) {
            if (!(record == null ? void 0 : record.parent)) continue;
            if (visible && !record.element.classList.contains(scrollbarVisibleClass)) {
              record.element.classList.add(scrollbarVisibleClass);
              record.visibleClassOwned = true;
            } else if (!visible && record.visibleClassOwned) {
              record.element.classList.remove(scrollbarVisibleClass);
              record.visibleClassOwned = false;
            }
          }
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
          syncScrollbarBarVisibility(state, true);
          if (!state.element.classList.contains(scrollbarVisibleClass)) {
            publish(state);
            state.element.classList.add(scrollbarVisibleClass);
            state.scrollbar.visibleOwned = true;
          }
        }
        function hideScrollbars(state) {
          if (state.scrollbar.drag) return;
          syncScrollbarBarVisibility(state, false);
          if (state.scrollbar.visibleOwned)
            state.element.classList.remove(scrollbarVisibleClass);
          state.scrollbar.visibleOwned = false;
        }
        function readScrollbars(state, metrics, axes, style) {
          const element = state.element;
          const values = [];
          const parent = state.scrollbar.parent;
          const theme = parent ? scrollbarThemeProperties.map((name) => style.getPropertyValue(name)) : null;
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
            const display = axes[axis] ? "block" : "none";
            values.push({
              record,
              trackSize,
              thumbSize,
              thumbPosition,
              max: axes[axis] ? max : 0,
              display,
              theme,
              x: parent ? element.offsetLeft + element.clientLeft + (vertical ? element.clientWidth : 0) : null,
              y: parent ? element.offsetTop + element.clientTop + (vertical ? 0 : element.clientHeight) : null
            });
          }
          return values;
        }
        function updateScrollbars(state, values) {
          for (const { record, trackSize, thumbSize, thumbPosition, max, display, theme, x, y } of values) {
            if (state.scrollbar[record.axis] !== record) continue;
            const style = record.element.style;
            if (theme) {
              scrollbarThemeProperties.forEach((name, index) => {
                var _a;
                if (record.themeOverrides[index] || ((_a = record.theme) == null ? void 0 : _a[index]) === theme[index]) return;
                if (theme[index]) style.setProperty(name, theme[index]);
                else style.removeProperty(name);
              });
              record.theme = theme;
              if (record.x !== x) writeFadeProperty(record.element, scrollbarProperties[0], x);
              if (record.y !== y) writeFadeProperty(record.element, scrollbarProperties[1], y);
              record.x = x;
              record.y = y;
            }
            if (record.trackSize !== trackSize)
              style.setProperty(scrollbarProperties[2], `${trackSize}px`);
            if (record.thumbSize !== thumbSize)
              style.setProperty(scrollbarProperties[3], `${thumbSize}px`);
            if (record.thumbPosition !== thumbPosition)
              style.setProperty(scrollbarProperties[4], `${thumbPosition}px`);
            if (record.display !== display)
              style.setProperty(scrollbarProperties[5], display);
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
        function visibleScrollbarTrack(record) {
          const style = root2.getComputedStyle(record.element);
          if (Number.parseFloat(style.opacity) <= 0) return false;
          const color = style.backgroundColor;
          if (!color || color === "transparent") return false;
          const rgba = color.match(/^rgba\((.+)\)$/);
          return !rgba || Number.parseFloat(rgba[1].split(",").at(-1)) > 0;
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
            if (!visibleScrollbarTrack(record)) return;
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
          dispatchInteraction(state, "scrollbar", true);
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
          dispatchInteraction(state, "scrollbar", false);
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
            aelluxJs2.diagnostics.warn(
              aelluxJs2.diagnostics.WARN_SCROLLBOX_WRAPPER_DISPLAY,
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
          if (!inline.owned) inlineMemories.set(wrapper, aelluxJs2.persist.element.save(
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
              aelluxJs2.diagnostics.error(
                aelluxJs2.diagnostics.ERROR_SCROLLBOX_ELASTIC_WRAPPER,
                {
                  extension: extensionName,
                  element,
                  attribute: elasticAttribute,
                  reason: "Elastic content wrapper is missing or is not the only direct child.",
                  suggestion: "Wrap all Scrollbox content in exactly one direct child with data-ae-scrollbox-elastic."
                }
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
            state.elastic.baseMargins = {
              top: computed.marginTop,
              right: computed.marginRight,
              bottom: computed.marginBottom,
              left: computed.marginLeft
            };
            elasticMemories.set(wrapper, aelluxJs2.persist.element.save(
              wrapper,
              [],
              [
                "transform",
                "transform-origin",
                "margin-top",
                "margin-right",
                "margin-bottom",
                "margin-left"
              ]
            ));
          }
          state.elasticEnabled = true;
          const value = wrapper.getAttribute(elasticAttribute).trim();
          const tokens = value ? value.split(/\s+/) : [];
          const limits = tokens.map(parseElasticLimit);
          if (tokens.length > 2 || limits.some((limit) => !limit)) {
            if (state.elastic.invalidLimit !== value) {
              aelluxJs2.diagnostics.warn(
                aelluxJs2.diagnostics.WARN_SCROLLBOX_ELASTIC_LIMIT_INVALID,
                {
                  extension: extensionName,
                  element: wrapper,
                  attribute: elasticAttribute,
                  value,
                  reason: "Elastic limits are invalid; using 1/4.",
                  suggestion: "Use one or two nonnegative fractions or pixel values, such as 1/4 or 80px 40px."
                }
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
          aelluxJs2.diagnostics.warn(
            aelluxJs2.diagnostics.WARN_SCROLLBOX_MODE_INVALID,
            {
              extension: extensionName,
              element,
              attribute,
              value,
              reason: "Unknown Scrollbox mode; using native.",
              suggestion: "Use native or pointer, or leave the attribute empty for native scrolling."
            }
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
          var _a;
          if (event.detail > 1 && !((_a = state.lastPointerDown) == null ? void 0 : _a.dragged)) return;
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
          for (const member of chain) {
            cancelMomentum(member);
            if (member.elastic.owned) resetElastic(member);
          }
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
          if (previousDown && !previousDown.dragged && time - previousDown.time <= POINTER_SCROLL_MULTICLICK_MS && Math.abs(event.clientX - previousDown.x) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX && Math.abs(event.clientY - previousDown.y) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX) return;
          const controlOrigin = event.target.closest(pointerScrollControlSelector);
          const textOrigin = !controlOrigin && isTextAtPoint(event.target, event.clientX, event.clientY);
          const selectionAtDown = readSelection();
          const verticalOnly = chains.y.some((member) => axes.get(member).y) && !chains.x.some((member) => axes.get(member).x);
          if (!textOrigin && !controlOrigin && event.cancelable) event.preventDefault();
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
            afterDrag: !!(previousDown == null ? void 0 : previousDown.dragged),
            styles: [],
            fractions: /* @__PURE__ */ new Map(),
            momentumState: null,
            momentumStartX: 0,
            momentumStartY: 0,
            elasticForce: 0,
            startTime: time,
            endTime: null,
            selectionAtDown,
            verticalOnly,
            selectionReadyTime: textOrigin ? time + TEXT_SELECTION_WAIT_MS : 0,
            selectionWaitTimeout: null,
            pendingMove: null,
            momentumStartTime: time
          };
          activePointerScrollState = state;
          onEvent(root2, POINTER_MOVE_TARGET, state.onPointerMove, { passive: false, capture: true });
          onEvent(
            root2,
            "$touchmove",
            state.onPointerScrollTouchMove,
            { passive: false, capture: true }
          );
          for (const name of pointerScrollDragEvents) {
            onEvent(root2, "$" + name, state.onPointerScrollNativeEvent, true);
          }
          onEvent(root2, "$selectstart", state.onPointerScrollNativeEvent, true);
          for (const name of pointerScrollMouseEvents) {
            onEvent(root2, "$" + name, state.onMouseEvent, { passive: false, capture: true });
          }
          onEvent(root2, POINTER_UP_TARGET, state.onPointerEnd, true);
          onEvent(root2, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
          onEvent(root2, "$blur", state.onBlur);
        }
        function movePointerScroll(state, event) {
          const pointerScroll = state.pointerScroll;
          if (!pointerScroll || event.pointerId !== pointerScroll.pointerId) return;
          if (event.defaultPrevented) {
            endPointerScroll(state);
            return;
          }
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
          const previousAxis = pointerScroll.axis;
          if (!pointerScroll.axis)
            pointerScroll.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
          const chain = pointerScroll.chains[pointerScroll.axis];
          const threshold = !pointerScroll.moved && chain.some((member) => !member.disposed && pointerAxisMaximum(member, pointerScroll.axis, pointerScroll) > 0 && !dispatchSnapGesture(member, "probe", pointerScroll)) ? 1 : POINTER_SCROLL_THRESHOLD_PX;
          if (!pointerScroll.moved && dx * dx + dy * dy < threshold * threshold) {
            pointerScroll.axis = previousAxis;
            return;
          }
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
            const maximum = pointerAxisMaximum(member, axis, pointerScroll);
            const logical = Math.max(0, Math.min(
              maximum,
              current + (pointerScroll.fractions.get(member) || 0)
            ));
            const desired = Math.max(0, Math.min(maximum, logical + remaining));
            element.scrollTo({
              left: axis === "x" ? desired : previousX,
              top: axis === "y" ? desired : previousY,
              behavior: "instant"
            });
            const actual = axis === "x" ? element.scrollLeft : element.scrollTop;
            pointerScroll.fractions.set(member, desired - actual);
            remaining -= desired - logical;
            const used = actual - current;
            if (!used) continue;
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
            pointerScrollMemories.set(element, aelluxJs2.persist.element.save(
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
            dispatchInteraction(member, POINTER, true);
            dispatchSnapGesture(member, "start", pointerScroll);
            startScrollbarInteractionVisibility(member);
          }
          dispatchPointerScroll(state, pointerScroll, "PointerScrollStart");
        }
        function dispatchPointerScroll(state, pointerScroll, name) {
          aelluxJs2.dispatchFrom(state.element, name, {
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
          state.pointerScroll = null;
          if (activePointerScrollState === state) activePointerScrollState = null;
          if (pointerScroll.selectionWaitTimeout !== null)
            root2.clearTimeout(pointerScroll.selectionWaitTimeout);
          offEvent(root2, POINTER_MOVE_TARGET, state.onPointerMove, true);
          offEvent(root2, "$touchmove", state.onPointerScrollTouchMove, true);
          for (const name of pointerScrollDragEvents) {
            offEvent(root2, "$" + name, state.onPointerScrollNativeEvent, true);
          }
          offEvent(root2, "$selectstart", state.onPointerScrollNativeEvent, true);
          offEvent(root2, POINTER_UP_TARGET, state.onPointerEnd, true);
          offEvent(root2, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
          offEvent(root2, "$blur", state.onBlur);
          if (pointerScroll.moved && !state.disposed) {
            state.mouseReleaseButton = pointerScroll.button;
            if (state.mouseReleaseTimeout !== null) root2.clearTimeout(state.mouseReleaseTimeout);
            state.mouseReleaseTimeout = root2.setTimeout(() => stopPointerScrollMouseEvents(state), 0);
          } else {
            stopPointerScrollMouseEvents(state);
          }
          let snapHandled = false;
          if (event && event.type === POINTER_UP && pointerScroll.axis && !selectionHasChanged(pointerScroll.selectionAtDown)) {
            const snapChain = pointerScroll.moved ? pointerScroll.chain : pointerScroll.chains[pointerScroll.axis];
            for (const member of snapChain) {
              if (!member.disposed && !dispatchSnapGesture(member, "end", pointerScroll))
                snapHandled = true;
            }
          }
          if ((pointerScroll.moved || snapHandled) && state.lastPointerDown)
            state.lastPointerDown.dragged = true;
          for (const saved of pointerScroll.styles) {
            if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
            (_a = pointerScrollMemories.get(saved.element)) == null ? void 0 : _a.restore();
            pointerScrollMemories.delete(saved.element);
            const member = scrollboxes.get(saved.element);
            if (member) {
              dispatchInteraction(member, POINTER, false);
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
          for (const member of pointerScroll.chain) releaseElastic(member);
          if (!snapHandled && event && event.type === POINTER_UP && pointerScroll.moved && momentumState && momentumState.momentumEnabled && !hadElastic && !momentumState.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
            startMomentum(momentumState, pointerScroll);
          }
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
            offEvent(root2, "$" + name, state.onMouseEvent, true);
          }
        }
        function startMomentum(state, pointerScroll) {
          const element = state.element;
          if (hasSnap(element)) return;
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
          if (hasSnap(state.element)) {
            cancelMomentum(state);
            return;
          }
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
          restoreTouchOverflow(state);
          state.elastic.touch = null;
        }
        function restoreTouchOverflow(state) {
          const touch = state.elastic.touch;
          if (!touch) return;
          for (const [element, { value, priority }] of touch.scrollBehaviors) {
            if (value) element.style.setProperty("scroll-behavior", value, priority);
            else element.style.removeProperty("scroll-behavior");
          }
          touch.scrollBehaviors.clear();
        }
        function startTouch(state, event) {
          if (event.target.closest(
            `[${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`
          )) return;
          if (event.touches.length !== 1) {
            restoreTouchOverflow(state);
            state.elastic.touch = null;
            releaseElastic(state);
            return;
          }
          if (event.target.closest(`[${attribute}]`) !== state.element) return;
          cancelMomentum(state);
          const touch = event.touches[0];
          restoreTouchOverflow(state);
          if (state.elastic.owned) {
            resetElastic(state);
            refresh(state);
          }
          state.elastic.touch = {
            identifier: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            lastX: touch.clientX,
            lastY: touch.clientY,
            scrollBehaviors: /* @__PURE__ */ new Map(),
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
          const deltaX = start.lastX - touch.clientX;
          const deltaY = start.lastY - touch.clientY;
          start.lastX = touch.clientX;
          start.lastY = touch.clientY;
          if (!applyElasticFromDesired(state, desiredX, desiredY, false)) return;
          const metrics = state.metrics || nativeMetrics(state.element);
          const style = root2.getComputedStyle(state.element);
          const scrollable = (value) => value === "auto" || value === "scroll";
          const blockedX = !scrollable(style.overflowX) || metrics.maxX <= 1;
          const blockedY = !scrollable(style.overflowY) || metrics.maxY <= 1;
          if (event.cancelable) {
            event.preventDefault();
            if (blockedX && (!style.overscrollBehaviorX || style.overscrollBehaviorX === "auto"))
              scrollTouchOverflow(state, "x", deltaX);
            if (blockedY && (!style.overscrollBehaviorY || style.overscrollBehaviorY === "auto"))
              scrollTouchOverflow(state, "y", deltaY);
          }
          scrollWithinElasticBounds(
            state,
            blockedX ? state.element.scrollLeft : desiredX,
            blockedY ? state.element.scrollTop : desiredY
          );
          publish(state);
        }
        function scrollTouchOverflow(state, axis, delta) {
          if (!delta) return;
          const horizontal = axis === "x";
          for (let parent = state.element.parentElement; parent && delta; parent = parent.parentElement) {
            const style = root2.getComputedStyle(parent);
            const overflow = horizontal ? style.overflowX : style.overflowY;
            const position = horizontal ? parent.scrollLeft : parent.scrollTop;
            const maximum = horizontal ? parent.scrollWidth - parent.clientWidth : parent.scrollHeight - parent.clientHeight;
            if ((overflow === "auto" || overflow === "scroll" || parent === root2.document.scrollingElement) && maximum > 0) {
              const next2 = Math.max(0, Math.min(maximum, position + delta));
              if (!state.elastic.touch.scrollBehaviors.has(parent)) {
                state.elastic.touch.scrollBehaviors.set(parent, {
                  value: parent.style.getPropertyValue("scroll-behavior"),
                  priority: parent.style.getPropertyPriority("scroll-behavior")
                });
                parent.style.setProperty("scroll-behavior", "auto", "important");
              }
              if (horizontal) parent.scrollLeft = next2;
              else parent.scrollTop = next2;
              delta -= (horizontal ? parent.scrollLeft : parent.scrollTop) - position;
            }
            const behavior = horizontal ? style.overscrollBehaviorX : style.overscrollBehaviorY;
            if (behavior && behavior !== "auto") break;
          }
        }
        function endTouch(state, event) {
          const touch = state.elastic.touch;
          if (!touch) return;
          for (const item of event.touches) {
            if (item.identifier === touch.identifier) return;
          }
          restoreTouchOverflow(state);
          state.elastic.touch = null;
          releaseElastic(state);
        }
        function elasticAxes(state) {
          const style = root2.getComputedStyle(state.element);
          const scrollable = (value) => value === "auto" || value === "scroll";
          return {
            x: scrollable(style.overflowX) && style.overscrollBehaviorX !== "none",
            y: scrollable(style.overflowY) && style.overscrollBehaviorY !== "none"
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
          if (active) dispatchInteraction(state, "elastic", true);
          setElasticTransform(state);
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
        function setElasticTransform(state) {
          const elastic = state.elastic;
          if (state.disposed || elastic.publication) return;
          const publication = {};
          elastic.publication = publication;
          aelluxJs2.waitLayout.update(elastic.layoutId, () => {
            if (elastic.publication !== publication || state.disposed || !elastic.owned) return;
            elastic.publication = null;
            writeElasticTransform(state);
          }).catch((cause) => {
            aelluxJs2.diagnostics.error(
              aelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
              { cause, extension: extensionName, element: state.element, method: "update" }
            );
          }).finally(() => {
            if (elastic.publication === publication) elastic.publication = null;
          });
        }
        function writeElasticTransform(state, dimensions = state.elastic.dimensions) {
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
          setElasticCompensation(state, scaleX, scaleY);
        }
        function setElasticCompensation(state, scaleX, scaleY) {
          var _a;
          const elastic = state.elastic;
          const wrapper = elastic.wrapper;
          const memory = elasticMemories.get(wrapper).cssProperties;
          const compensated = {
            top: 0,
            right: elastic.amounts[3] * (2 + scaleX),
            bottom: elastic.amounts[0] * (2 + scaleY),
            left: 0
          };
          for (const side of ["top", "right", "bottom", "left"]) {
            const base = ((_a = elastic.baseMargins) == null ? void 0 : _a[side]) || "0px";
            const property = `margin-${side}`;
            if (compensated[side]) {
              wrapper.style.setProperty(
                property,
                `calc(${base} - ${compensated[side]}px)`,
                memory[property].priority
              );
            } else if (memory[property].present) {
              wrapper.style.setProperty(property, memory[property].value, memory[property].priority);
            } else wrapper.style.removeProperty(property);
          }
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
          if (!elastic.owned) return;
          if (elastic.wheelTimeout !== null) root2.clearTimeout(elastic.wheelTimeout);
          elastic.wheelTimeout = null;
          if (!elastic.active) {
            resetElastic(state);
            return;
          }
          if (aelluxJs2.currentPreference("reduced-motion") === "reduced") {
            resetElastic(state);
            refresh(state);
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
            return;
          }
          setElasticTransform(state);
          publish(state);
          elastic.releaseFrame = root2.requestAnimationFrame(() => stepElasticRelease(state));
        }
        function finishElasticRelease(state) {
          if (state.elastic.releaseFrame === null) return;
          resetElastic(state);
          refresh(state);
        }
        function resetElastic(state) {
          var _a;
          const elastic = state.elastic;
          const wasOwned = elastic.owned;
          aelluxJs2.waitLayout.cancel(elastic.layoutId);
          elastic.publication = null;
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
            state.metrics = nativeMetrics(state.element);
            dispatchInteraction(state, "elastic", false);
          }
          if (wasOwned && !state.disposed) publish(state);
        }
        function observe(state) {
          state.onResize = () => scheduleResize(state);
          onEvent(root2, "$resize", state.onResize, { passive: true });
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
                if (state.scrollbar.parent) state.resizeObserver.observe(state.scrollbar.parent);
                for (const child of state.element.children) state.resizeObserver.observe(child);
              }
              if (records.some((record) => record.type === "attributes" || record.target === state.element || record.target === state.elastic.wrapper)) configure(state);
              else refresh(state);
            });
            state.mutationObserver.observe(
              state.element,
              {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: [elasticAttribute, scrollbarAttribute, scrollbarParentAttribute, snapAttribute, fadeAttribute, attribute, "dir"]
              }
            );
          }
        }
        function onLayout(event) {
          var _a;
          const target = event.target;
          const duration = Number((_a = event.detail) == null ? void 0 : _a.durationMs);
          scrollboxes.forEach((state) => {
            if (!target.contains(state.element) && !state.element.contains(target)) return;
            if (Number.isFinite(duration) && duration > 0)
              state.layoutUntil = Math.max(state.layoutUntil, now() + duration);
            scheduleResize(state);
          });
        }
        function scheduleResize(state) {
          if (state.disposed) return;
          let complete = false;
          aelluxJs2.waitLayout.sequence(state.resizeLayoutId, {
            update: () => {
              complete = now() >= state.layoutUntil;
              refresh(state);
            },
            repeat: { ms: 0 },
            maxFPS: aelluxJs2.layoutMaxFPS(state.element),
            abort: () => state.disposed || complete
          });
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
        function wheelAxes(state, metrics, style = root2.getComputedStyle(state.element)) {
          const available = (value) => value === "auto" || value === "scroll";
          const stopsChain = (value) => value === "contain" || value === "none";
          return {
            x: metrics.maxX > 1 && available(style.overflowX),
            y: metrics.maxY > 1 && available(style.overflowY),
            stopX: available(style.overflowX) && stopsChain(style.overscrollBehaviorX),
            stopY: available(style.overflowY) && stopsChain(style.overscrollBehaviorY)
          };
        }
        function physicalScrollLeft(element, maximum, direction) {
          let position = element.scrollLeft;
          if (direction === "rtl" && maximum > 0) {
            if (rtlScrollType === null) {
              const probe = root2.document.createElement("div");
              const child = root2.document.createElement("div");
              probe.style.cssText = "position:absolute;left:-10000px;top:-10000px;width:4px;height:1px;overflow:scroll;direction:rtl;visibility:hidden;scroll-behavior:auto";
              child.style.cssText = "width:8px;height:1px";
              probe.appendChild(child);
              root2.document.body.appendChild(probe);
              if (probe.scrollLeft > 0) rtlScrollType = "default";
              else {
                probe.scrollLeft = 1;
                rtlScrollType = probe.scrollLeft === 0 ? "negative" : "reverse";
              }
              probe.remove();
            }
            if (rtlScrollType === "negative") position += maximum;
            else if (rtlScrollType === "reverse") position = maximum - position;
          }
          return Math.max(0, Math.min(maximum, position));
        }
        function readFade(state, metrics, axes, style) {
          const element = state.element;
          if (state.fadeAuthored === null)
            state.fadeAuthored = [style.maskImage, style.webkitMaskImage].some((value) => value && value !== "none");
          if (state.elastic.owned) {
            metrics = state.metrics || metrics;
            axes = state.fadeAxes || axes;
          } else state.fadeAxes = axes;
          const x = axes.x ? physicalScrollLeft(element, metrics.maxX, style.direction) : 0;
          const y = Math.max(0, Math.min(metrics.maxY, element.scrollTop));
          const distances = [
            axes.y ? y : 0,
            axes.x ? metrics.maxX - x : 0,
            axes.y ? metrics.maxY - y : 0,
            axes.x ? x : 0
          ];
          const snapAxis = hasSnap(element) ? element.getAttribute(snapAttribute) === "vertical" ? "y" : "x" : null;
          const primary = snapAxis || (axes.y ? "y" : "x");
          const fadeValue = element.getAttribute(fadeAttribute);
          const fadeEnabled = fadeValue === "" || fadeValue === "true" || fadeValue !== "false" && axes.x !== axes.y;
          const mode = maskSupported && !state.fadeAuthored && fadeEnabled && (axes.x || axes.y) ? compositeSupported ? "both" : primary : "";
          return { distances, mode };
        }
        function writeFadeProperty(element, name, value) {
          if (element.style.getPropertyPriority(name)) element.style.removeProperty(name);
          element.style.setProperty(name, `${value}px`);
        }
        function updateFade(state, fade) {
          fadeProperties.forEach((name, index) => writeFadeProperty(state.element, name, fade.distances[index]));
          if (fade.mode) state.element.setAttribute(fadeStateAttribute, fade.mode);
          else state.element.removeAttribute(fadeStateAttribute);
        }
        function publish(state) {
          if (state.disposed) return;
          state.publishDirty = true;
          if (state.publishPending) return;
          state.publishPending = true;
          aelluxJs2.waitLayout.read(state.publishLayoutId, () => {
            if (state.disposed) return null;
            state.publishDirty = false;
            const metrics = nativeMetrics(state.element);
            const scrollTop = state.element.scrollTop;
            const scrollLeft = state.element.scrollLeft;
            const style = root2.getComputedStyle(state.element);
            const axes = wheelAxes(state, metrics, style);
            const fade = readFade(state, metrics, axes, style);
            if (!state.elastic.active) state.metrics = metrics;
            if (state.elasticEnabled && state.elastic.wrapper && !state.elastic.active)
              state.elastic.dimensions = measureElasticWrapper(state.elastic.wrapper);
            const bars = state.scrollbar.x || state.scrollbar.y;
            return {
              revision: state.layoutRevision,
              fade,
              scrollTop,
              scrollLeft,
              y: progress(scrollTop, metrics.maxY),
              x: progress(scrollLeft, metrics.maxX),
              edges: state.elastic.owned ? null : [
                scrollTop < SCROLL_EDGE_MARGIN_PX,
                scrollTop >= metrics.maxY - SCROLL_EDGE_MARGIN_PX,
                scrollLeft < SCROLL_EDGE_MARGIN_PX,
                scrollLeft >= metrics.maxX - SCROLL_EDGE_MARGIN_PX
              ],
              scrollbars: bars ? readScrollbars(state, metrics, axes, style) : []
            };
          }).then((values) => {
            if (!values || state.disposed) {
              state.publishDirty = false;
              return;
            }
            return aelluxJs2.waitLayout.update(state.publishLayoutId, () => {
              if (state.disposed || state.layoutRevision !== values.revision) return;
              if (state.element.scrollTop !== values.scrollTop || state.element.scrollLeft !== values.scrollLeft) {
                state.publishDirty = true;
                return;
              }
              state.element.style.setProperty(properties[0], values.y);
              state.element.style.setProperty(properties[1], values.x);
              updateFade(state, values.fade);
              if (values.edges && !state.elastic.owned) {
                scrollEdgeClasses.forEach((name, index) => state.element.classList.toggle(name, values.edges[index]));
              }
              updateScrollbars(state, values.scrollbars);
            });
          }).catch((cause) => {
            aelluxJs2.diagnostics.error(
              aelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
              { cause, extension: extensionName, element: state.element, method: "update" }
            );
          }).finally(() => {
            state.publishPending = false;
            if (state.publishDirty && !state.disposed) publish(state);
          });
        }
        function progress(position, distance) {
          return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
        }
        function scrollAxis(element, axis, delta, maximum) {
          const property = axis === "x" ? "scrollLeft" : "scrollTop";
          const current = element[property];
          const desired = current + delta;
          const next2 = Math.max(0, Math.min(maximum, desired));
          if (next2 !== current) {
            element.scrollTo(axis === "x" ? { left: next2, behavior: "instant" } : { top: next2, behavior: "instant" });
          }
          return desired - next2;
        }
        function inheritedWheelAxes(element, metrics) {
          const style = root2.getComputedStyle(element);
          const available = (value) => value === "auto" || value === "scroll" || element === document.scrollingElement && value === "visible";
          const stops = (value) => value === "contain" || value === "none";
          return {
            x: metrics.maxX > 1 && available(style.overflowX),
            y: metrics.maxY > 1 && available(style.overflowY),
            stopX: available(style.overflowX) && stops(style.overscrollBehaviorX),
            stopY: available(style.overflowY) && stops(style.overscrollBehaviorY)
          };
        }
        function nextWheelTarget(element) {
          for (let parent = element.parentElement; parent; parent = parent.parentElement) {
            const state = scrollboxes.get(parent);
            const metrics = nativeMetrics(parent);
            const axes = state ? wheelAxes(state, metrics) : inheritedWheelAxes(parent, metrics);
            if (axes.x || axes.y || axes.stopX || axes.stopY)
              return { element: parent, state, metrics, axes };
          }
          return null;
        }
        function receivesVerticalWheelAsHorizontal(target) {
          return !!target.state && target.state.desktop && target.state.wheelEnabled && target.axes.x && !target.axes.y;
        }
        function handoffWheelEvent(event, target, deltaX, deltaY) {
          const handed = {
            ctrlKey: event.ctrlKey,
            cancelable: event.cancelable,
            deltaX,
            deltaY,
            deltaMode: 0,
            target: target.element,
            get defaultPrevented() {
              return event.defaultPrevented;
            },
            preventDefault() {
              event.preventDefault();
            }
          };
          return dispatchWheel(target.state, handed);
        }
        function chainWheel(state, event, metrics, factor, nativeTarget = true) {
          let deltaX = event.deltaX * factor, deltaY = event.deltaY * factor;
          let target = { element: state.element, state, metrics, axes: wheelAxes(state, metrics) };
          let first = true, handled = false;
          while (target && (deltaX || deltaY)) {
            const member = target.state, element = target.element;
            if (!first && member) {
              if (member.desktop && element.classList.contains(pointerScrollingClass)) {
                event.preventDefault();
                return;
              }
              cancelMomentum(member);
              finishElasticRelease(member);
              target.metrics = nativeMetrics(element);
              target.axes = wheelAxes(member, target.metrics);
              if (!handoffWheelEvent(event, target, deltaX, deltaY)) {
                event.preventDefault();
                return;
              }
            }
            const bounds = (member == null ? void 0 : member.elastic.active) ? member.metrics : target.metrics;
            const axes = target.axes;
            const converted = receivesVerticalWheelAsHorizontal(target) && Math.abs(deltaX) <= Math.abs(deltaY);
            const x = converted ? deltaY : deltaX, y = converted ? 0 : deltaY;
            const left = element.scrollLeft, top = element.scrollTop;
            const desiredX = left + (axes.x ? x : 0), desiredY = top + (axes.y ? y : 0);
            const nextX = Math.max(0, Math.min(bounds.maxX, desiredX));
            const nextY = Math.max(0, Math.min(bounds.maxY, desiredY));
            let remainingX = x - (nextX - left), remainingY = y - (nextY - top);
            if (first && nativeTarget && !converted && !remainingX && !remainingY) {
              if (member.elastic.owned) resetElastic(member);
              return;
            }
            let stretched = false;
            if ((member == null ? void 0 : member.elasticEnabled) && (axes.x || axes.y)) {
              if (!member.elastic.active) member.metrics = bounds;
              stretched = applyElasticFromDesired(
                member,
                desiredX,
                desiredY,
                true,
                axes.x && axes.y ? null : axes.x ? "x" : "y"
              );
              if (stretched) {
                scrollWithinElasticBounds(member, desiredX, desiredY);
                if (member.elastic.wheelTimeout !== null) root2.clearTimeout(member.elastic.wheelTimeout);
                member.elastic.wheelTimeout = root2.setTimeout(() => releaseElastic(member), ELASTIC_WHEEL_IDLE_MS);
              } else if (member.elastic.owned) resetElastic(member);
            }
            if (!stretched) {
              if (axes.x) scrollAxis(element, "x", x, bounds.maxX);
              if (axes.y) scrollAxis(element, "y", y, bounds.maxY);
            }
            const moved = nextX !== left || nextY !== top;
            if (member && (moved || stretched)) publish(member);
            const blocked = remainingX && axes.stopX || remainingY && axes.stopY;
            if (axes.stopX) remainingX = 0;
            if (axes.stopY) remainingY = 0;
            handled = handled || moved || stretched || !!blocked;
            deltaX = converted ? 0 : remainingX;
            deltaY = converted ? remainingX : remainingY;
            first = false;
            target = deltaX || deltaY ? nextWheelTarget(element) : null;
          }
          if (handled) event.preventDefault();
        }
        function handleWheel(state, event) {
          cancelMomentum(state);
          if (event.ctrlKey || !event.cancelable) return;
          if (state.desktop && state.mode === POINTER && state.element.classList.contains(pointerScrollingClass)) {
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();
            return;
          }
          if (event.defaultPrevented) return;
          const bar = event.target.closest(`[${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`);
          const owner = bar && scrollbarOwners.get(bar);
          if (owner ? owner !== state : event.target.closest(`[${attribute}]`) !== state.element) return;
          finishElasticRelease(state);
          if (!dispatchWheel(state, event)) return;
          const metrics = nativeMetrics(state.element);
          if (!metrics) return;
          const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
          chainWheel(state, event, metrics, factor, !(owner == null ? void 0 : owner.scrollbar.parent));
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
        const aelluxJs2 = root2.aelluxJs;
        const extensionName = "adaptive";
        if (!aelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const attr = {
          adaptive: aelluxJs2.attr(extensionName)
        };
        const modifier = {
          shapeHorizontal: aelluxJs2.className("shape-horizontal"),
          shapeVertical: aelluxJs2.className("shape-vertical"),
          shapeSquare: aelluxJs2.className("shape-square")
        };
        const adaptiveElements = /* @__PURE__ */ new Set();
        const elementMemories = /* @__PURE__ */ new WeakMap();
        const dimensionProperties = ["--ae-width", "--ae-height"];
        const pendingResizeEntries = /* @__PURE__ */ new Map();
        const pendingResizeElements = /* @__PURE__ */ new Set();
        const layoutIds = /* @__PURE__ */ new WeakMap();
        const orientationLayoutIds = /* @__PURE__ */ new WeakMap();
        let nextLayoutId = 1e6;
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
        const ariaHandlers = /* @__PURE__ */ new WeakMap();
        let managedClasses;
        let sizeThresholds = [];
        const resizeObserver = typeof root2.ResizeObserver === "function" ? new root2.ResizeObserver(onResize) : null;
        aelluxJs2.extAttach(extensionName, { init, destroy, adaptiveParams });
        function init(options = {}) {
          aelluxJs2.registerCssProperty(
            { name: "--ae-width", syntax: "<number>", initialValue: "0" },
            { name: "--ae-height", syntax: "<number>", initialValue: "0" }
          );
          let overrides = options.adaptiveParams === void 0 ? {} : options.adaptiveParams;
          if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
            parameterDiagnostic("", overrides, "Expected an object of Adaptive parameter groups; using defaults.");
            overrides = {};
          }
          for (const group of Object.keys(adaptiveParams)) {
            if (group in overrides && (!overrides[group] || typeof overrides[group] !== "object" || Array.isArray(overrides[group]))) {
              parameterDiagnostic(group, overrides[group], "Expected a parameter group object; using defaults.");
              continue;
            }
            if (overrides[group] && typeof overrides[group] === "object") {
              for (const [key, value] of Object.entries(overrides[group])) {
                if (typeof value !== "number" || !Number.isFinite(value) || (group === "minSizes" ? value < 0 : value <= 0)) {
                  parameterDiagnostic(`${group}.${key}`, value, "Expected a finite positive number (zero is allowed for minimum sizes).");
                  continue;
                }
                adaptiveParams[group][key] = value;
              }
            }
          }
          for (const [group, lower, upper, fallback2] of [
            ["ratioShapes", "vertical", "horizontal", [0.8, 1.25]],
            ["experienceScale", "near", "far", [1, 1.5]]
          ]) if (adaptiveParams[group][lower] >= adaptiveParams[group][upper]) {
            parameterDiagnostic(group, __spreadValues({}, adaptiveParams[group]), "The lower boundary must be less than the upper boundary; using defaults.");
            adaptiveParams[group][lower] = fallback2[0];
            adaptiveParams[group][upper] = fallback2[1];
          }
          const orderedSizes = ["compact", "small", "medium", "large", "xl", "xxl"];
          if (orderedSizes.some((name, index) => index > 0 && adaptiveParams.minSizes[name] < adaptiveParams.minSizes[orderedSizes[index - 1]]))
            parameterDiagnostic("minSizes", __spreadValues({}, adaptiveParams.minSizes), "Named minimum sizes are out of order; the configured thresholds are preserved.");
          managedClasses = getManagedClasses();
          for (const group of Object.keys(adaptiveParams)) Object.freeze(adaptiveParams[group]);
          Object.freeze(adaptiveParams);
          aelluxJs2.mountManager.add({
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
            const className = aelluxJs2.className("fits-" + size);
            sizeThresholds.push({ className, minimum });
            classes.push(className);
          }
          return classes;
        }
        function parameterDiagnostic(attribute, value, reason) {
          aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_CONFIGURATION_VALUE, {
            extension: extensionName,
            attribute: `adaptiveParams${attribute ? "." + attribute : ""}`,
            value,
            reason,
            suggestion: "Use finite nonnegative minimum sizes and positive, ordered ratio/experience boundaries."
          });
        }
        function destroy() {
          pendingResizeEntries.clear();
          pendingResizeElements.clear();
          for (const element of adaptiveElements) unmountAdaptive(element);
          if (resizeObserver) resizeObserver.disconnect();
          aelluxJs2.mountManager.remove({ extensionName });
        }
        function mountAdaptive(element) {
          if (adaptiveElements.has(element)) return;
          elementMemories.set(element, aelluxJs2.persist.element.save(
            element,
            [],
            dimensionProperties
          ));
          ariaHandlers.set(element, aelluxJs2.aria.register(element));
          adaptiveElements.add(element);
          layoutIds.set(element, nextLayoutId++);
          if (resizeObserver) resizeObserver.observe(element);
          else {
            scheduleElement(element, null);
            if (adaptiveElements.size === 1) aelluxJs2.onEvent(root2, "$resize", onWindowResize);
          }
        }
        function unmountAdaptive(element) {
          var _a, _b;
          if (!adaptiveElements.delete(element)) return;
          pendingResizeEntries.delete(element);
          pendingResizeElements.delete(element);
          const id = layoutIds.get(element);
          if (id !== void 0) aelluxJs2.waitLayout.cancel(id);
          layoutIds.delete(element);
          if (resizeObserver) resizeObserver.unobserve(element);
          else if (adaptiveElements.size === 0) aelluxJs2.offEvent(root2, "$resize", onWindowResize);
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
          flushPendingUpdate();
        }
        function flushPendingUpdate() {
          if (!pendingResizeEntries.size && !pendingResizeElements.size) return;
          const entries = Array.from(pendingResizeEntries.entries());
          pendingResizeEntries.clear();
          for (const [element, entry] of entries) scheduleElement(element, entry.contentRect);
          const elements = Array.from(pendingResizeElements);
          pendingResizeElements.clear();
          for (const element of elements) scheduleElement(element, null);
        }
        function scheduleElement(element, contentRect) {
          const id = layoutIds.get(element);
          if (id === void 0) return;
          const maxFPS = aelluxJs2.layoutMaxFPS(element);
          const abort = () => !adaptiveElements.has(element);
          if (contentRect) {
            aelluxJs2.waitLayout.sequence(id, {
              update: () => updateAdaptive(element, contentRect.width, contentRect.height),
              maxFPS,
              abort
            });
            return;
          }
          aelluxJs2.waitLayout.sequence(id, {
            read: () => element.getBoundingClientRect(),
            update: (rect) => updateAdaptive(element, rect.width, rect.height),
            maxFPS,
            abort
          });
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
          for (let i = 0; i < sizeThresholds.length; i++) {
            const threshold = sizeThresholds[i];
            element.classList.toggle(
              threshold.className,
              width >= threshold.minimum
            );
          }
          for (const name of dimensionProperties) {
            if (element.style.getPropertyPriority(name)) element.style.removeProperty(name);
          }
          element.style.setProperty("--ae-width", width);
          element.style.setProperty("--ae-height", height);
          aelluxJs2.dispatchFrom(element, "AdaptiveUpdate", {
            detail: { width, height, ratio }
          });
        }
        function inferOrientation(flexBox, selector = "*") {
          let id = orientationLayoutIds.get(flexBox);
          if (id === void 0) {
            id = nextLayoutId++;
            orientationLayoutIds.set(flexBox, id);
          }
          return aelluxJs2.waitLayout.read(id, () => {
            const fallback2 = "horizontal";
            var style = getComputedStyle(flexBox);
            if (style.display === "flex" || style.display === "inline-flex") {
              return style.flexDirection.indexOf("column") === 0 ? "vertical" : "horizontal";
            }
            if (!selector || selector.length === 0) return fallback2;
            var children = flexBox.querySelectorAll(selector);
            if (children.length < 2) return fallback2;
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

  // src/internal/create-present-playback.js
  function createPresentPlayback(root2, api) {
    let interpolatedSizes = false;
    const now = () => root2.performance.now();
    const animations = (element) => {
      try {
        return element.getAnimations();
      } catch (_) {
        return null;
      }
    };
    const properties = (element, controller, progress) => {
      const tokens = (element.getAttribute(api.attr("present")) || "").split(/\s+/);
      return presentPlaybackProperties.filter((property) => {
        if (property === "--ae-present-pop-phase") return progress;
        if (property === "transform") return tokens.includes(property) && !element.hasAttribute(api.attr("anchor"));
        if (property === "opacity") return tokens.includes(property);
        const dimension = /rows|height/.test(property) ? "height" : "width";
        return tokens.includes(dimension) && property.startsWith(controller.presentMotion ? "grid" : "max");
      });
    };
    function init() {
      interpolatedSizes = !!api.registerCssProperty(...["height", "width"].map((dimension) => ({
        name: `--ae-present-reverse-max-${dimension}`,
        syntax: "<length>",
        initialValue: "0px"
      })));
    }
    function capture(element, controller, apply, size, progress, direction = "pop") {
      var _a, _b;
      const computed = root2.getComputedStyle(element);
      const tracks = properties(element, controller, progress).map((property) => {
        const dimension = /rows|height/.test(property) ? "height" : "width";
        const to = property === "--ae-present-pop-phase" ? "1" : property.startsWith("max-") ? `${direction === "pop" ? size[dimension] : 0}px` : computed.getPropertyValue(`--ae-${direction}-${property.startsWith("grid") ? dimension : property}`).trim();
        const from = property.startsWith("grid") ? computed.getPropertyValue(`--ae-${direction === "pop" ? "from" : "pop"}-${dimension}`).trim() : computed.getPropertyValue(property).trim();
        return { property, from, to };
      });
      const before = animations(element);
      apply();
      const style = root2.getComputedStyle(element);
      const names = list(style.transitionProperty), durations = list(style.transitionDuration), delays = list(style.transitionDelay), easings = list(style.transitionTimingFunction);
      for (const track of tracks) {
        let index = names.lastIndexOf(track.property);
        if (index < 0) index = names.lastIndexOf("all");
        track.duration = index < 0 ? 0 : seconds(durations[index % durations.length]);
        track.delay = index < 0 ? 0 : seconds(delays[index % delays.length]);
        track.easing = index < 0 ? "linear" : easings[index % easings.length];
      }
      const after = animations(element);
      const advanced = style.getPropertyValue(`--ae-${direction}-aellux-ease`).trim();
      const curve = advanced && ((_a = api.motion) == null ? void 0 : _a.supported(element)) ? sampleCssEasing(api, advanced) : null;
      return {
        tracks,
        effects: after == null ? void 0 : after.filter((effect) => !(before == null ? void 0 : before.includes(effect)) && tracks.some((track) => track.property === effect.transitionProperty)),
        advancedEasing: curve && ((_b = root2.CSS) == null ? void 0 : _b.supports("animation-timing-function", curve)) ? curve : null,
        nativeEasing: style.getPropertyValue(`--ae-${direction}-ease`).trim(),
        start: now(),
        completed: false
      };
    }
    function snapshot(element, controller, progress) {
      let record = controller.opening;
      if (!record) {
        if (controller.transition) return [];
        const owned = properties(element, controller, progress);
        const memory = api.persist.element.save(element, [], owned);
        const transition = api.persist.element.save(element, [], ["transition-property"]);
        const classes = ["pop", "popping"].map((name) => api.className(name)).filter((name) => element.classList.contains(name));
        const to = owned.map((property) => {
          const style2 = root2.getComputedStyle(element);
          if (property === "transform" || property.startsWith("grid")) {
            const name = property === "transform" ? property : property.endsWith("rows") ? "height" : "width";
            return style2.getPropertyValue(`--ae-pop-${name}`).trim() || style2.getPropertyValue(property).trim();
          }
          return property.startsWith("max-") ? style2.getPropertyValue(property.slice(4)).trim() : style2.getPropertyValue(property).trim();
        });
        const style = root2.getComputedStyle(element);
        const duration = seconds(style.getPropertyValue("--ae-pop-duration"));
        const easing = style.getPropertyValue("--ae-pop-ease").trim() || "ease-out";
        try {
          element.style.setProperty("transition-property", "none", "important");
          element.classList.remove(...classes);
          if (controller.measuredHeight) element.style.setProperty("max-height", "0px", "important");
          if (controller.measuredWidth) element.style.setProperty("max-width", "0px", "important");
          if (progress) element.style.setProperty("--ae-present-pop-phase", "0");
          const from = root2.getComputedStyle(element);
          record = { completed: true, start: now(), tracks: owned.map((property, index) => {
            const name = property === "transform" ? property : property.endsWith("rows") ? "height" : "width";
            const start = property === "transform" || property.startsWith("grid") ? from.getPropertyValue(`--ae-from-${name}`).trim() : from.getPropertyValue(property).trim();
            return { property, from: start, to: to[index], duration, delay: 0, easing };
          }) };
        } finally {
          element.classList.add(...classes);
          memory.restore();
          element.getBoundingClientRect();
          transition.restore();
        }
      }
      if (record.effects) {
        return record.effects.map((animation) => {
          const timing = animation.effect.getTiming();
          if (record.advancedEasing) timing.easing = record.advancedEasing;
          else if (/^linear\(/i.test(record.nativeEasing || "") && timing.easing.startsWith("linear(")) timing.easing = record.nativeEasing;
          const duration = Number(timing.duration);
          const time = record.completed ? duration : Math.max(0, Math.min(duration, Number(animation.currentTime) - timing.delay));
          const source = record.tracks.find((track) => track.property === animation.transitionProperty);
          const frames = source.property.startsWith("grid") ? [{ [camel(source.property)]: source.from }, { [camel(source.property)]: source.to }] : animation.effect.getKeyframes().map((_a) => {
            var _b = _a, { computedOffset } = _b, frame = __objRest(_b, ["computedOffset"]);
            return frame;
          });
          return {
            property: animation.transitionProperty,
            frames,
            timing,
            time,
            duration
          };
        }).filter((track) => Number.isFinite(track.duration) && track.duration > 0 && track.time > 0);
      }
      return record.tracks.map((track) => __spreadProps(__spreadValues({}, track), {
        frames: [{ [camel(track.property)]: track.from }, { [camel(track.property)]: track.to }],
        timing: { easing: /^linear\(/i.test(record.nativeEasing || "") ? record.nativeEasing : track.easing },
        time: record.completed ? track.duration : Math.max(0, Math.min(track.duration, now() - record.start - track.delay))
      })).filter((track) => track.duration > 0 && track.time > 0 && track.from !== track.to);
    }
    function complete(element, controller, progress) {
      if (!controller.opening) return;
      controller.opening.completed = true;
      const tracks = snapshot(element, controller, progress);
      controller.opening = { completed: true, start: now(), tracks: [], effects: null, saved: tracks };
    }
    function reverse(element, tracks, progress, interactive = false) {
      const duration = Math.max(0, ...tracks.map((track) => track.time));
      const owned = [...new Set(tracks.map((track) => track.property))];
      const privateProperties = owned.flatMap((property) => ["from", "to"].map((phase) => `--ae-present-reverse-${phase}-${suffix(property)}`));
      privateProperties.push(...owned.filter((property) => property.startsWith("max-")).map((property) => `--ae-present-reverse-${property}`));
      let memory = null, effects = [];
      const inspectable = typeof element.getAnimations === "function" && root2.KeyframeEffect && typeof root2.KeyframeEffect.prototype.setKeyframes === "function";
      function apply() {
        var _a;
        memory = api.persist.element.save(element, [], [
          ...owned,
          ...privateProperties,
          ...transitionProperties.map((name) => `transition-${name}`),
          ...animationProperties.map((name) => `animation-${name}`)
        ]);
        const style = element.style;
        if (!duration) return;
        if (inspectable) {
          style.setProperty("transition-property", "none", "important");
          for (const track of tracks) style.setProperty(track.property, track.frames[0][camel(track.property)], track.property.startsWith("--") ? "" : "important");
          element.getBoundingClientRect();
          style.setProperty("transition-property", owned.join(","), "important");
          style.setProperty("transition-duration", tracks.map((track) => `${track.duration}ms`).join(","), "important");
          style.setProperty("transition-delay", "0ms", "important");
          style.setProperty("transition-timing-function", "linear", "important");
          for (const track of tracks) style.setProperty(track.property, track.frames[track.frames.length - 1][camel(track.property)], track.property.startsWith("--") ? "" : "important");
          effects = ((_a = animations(element)) == null ? void 0 : _a.filter((animation) => owned.includes(animation.transitionProperty))) || [];
          for (const animation of effects) {
            const track = tracks.find((track2) => track2.property === animation.transitionProperty);
            animation.effect.setKeyframes(track.frames);
            animation.effect.updateTiming({
              duration: track.duration,
              easing: interactive ? "linear" : track.timing.easing || "linear",
              delay: interactive ? 0 : track.time - track.duration,
              direction: interactive ? "normal" : "reverse",
              fill: "both",
              iterations: 1,
              iterationStart: 0,
              endDelay: 0
            });
            if (interactive) animation.pause();
            animation.currentTime = 0;
          }
        } else {
          const computed = root2.getComputedStyle(element);
          const previous = animationProperties.map((name) => computed.getPropertyValue(`animation-${name}`));
          const additions = [[], [], [], [], [], [], [], []];
          for (const track of tracks) {
            const name = suffix(track.property);
            style.setProperty(`--ae-present-reverse-from-${name}`, track.frames[0][camel(track.property)]);
            style.setProperty(`--ae-present-reverse-to-${name}`, track.frames[track.frames.length - 1][camel(track.property)]);
            if (track.property.startsWith("max-") && interpolatedSizes)
              style.setProperty(track.property, `var(--ae-present-reverse-${track.property})`, "important");
            else style.setProperty(track.property, track.frames[0][camel(track.property)]);
            const nativeName = track.property.startsWith("max-") && !interpolatedSizes ? `${name}-plain` : name;
            const values = [
              api.className(`present-reverse-${nativeName}`),
              `${track.duration}ms`,
              `${track.time - track.duration}ms`,
              track.timing.easing || "linear",
              "reverse",
              "both",
              "1",
              "running"
            ];
            values.forEach((value, index) => additions[index].push(value));
          }
          animationProperties.forEach((name, index) => style.setProperty(`animation-${name}`, [previous[index], ...additions[index]].join(","), "important"));
        }
        if (progress && !interactive) {
          style.setProperty("--ae-unpop-progress", "0");
          element.getBoundingClientRect();
          const computed = root2.getComputedStyle(element);
          const previous = list(computed.transitionProperty);
          const durations = list(computed.transitionDuration), delays = list(computed.transitionDelay), easings = list(computed.transitionTimingFunction);
          style.setProperty("transition-property", [...previous, "--ae-unpop-progress"].join(","), "important");
          for (const [name, values, extra] of [["duration", durations, `${duration}ms`], ["delay", delays, "0ms"], ["timing-function", easings, "linear"]])
            style.setProperty(`transition-${name}`, [...previous.map((_, index) => values[index % values.length]), extra].join(","), "important");
          style.setProperty("--ae-unpop-progress", "1");
        }
      }
      return {
        duration,
        apply,
        seek(value) {
          for (const effect of effects) effect.currentTime = value * Number(effect.effect.getTiming().duration);
        },
        playTo(target) {
          for (const animation of effects) {
            const track = tracks.find((track2) => track2.property === animation.transitionProperty);
            const timing = animation.effect.getTiming();
            const value = Number(animation.currentTime) / Number(timing.duration);
            animation.effect.updateTiming({ easing: track.timing.easing || "linear" });
            let best = value, error = Infinity;
            const evaluate = (fraction) => {
              animation.currentTime = fraction * track.duration;
              return animation.effect.getComputedTiming().progress;
            };
            let previous = evaluate(0), previousTime = 0;
            for (let index = 1; index <= 120; index++) {
              const time = index / 120, next = evaluate(time);
              if ((previous - value) * (next - value) <= 0) {
                let low = previousTime, high = time, lowValue = previous;
                for (let step = 0; step < 20; step++) {
                  const middle = (low + high) / 2, result = evaluate(middle);
                  if ((lowValue - value) * (result - value) <= 0) high = middle;
                  else {
                    low = middle;
                    lowValue = result;
                  }
                }
                const candidate = (low + high) / 2;
                if (Math.abs(candidate - value) < error) {
                  best = candidate;
                  error = Math.abs(candidate - value);
                }
              }
              previous = next;
              previousTime = time;
            }
            if (value !== 0 && value !== 1 && Math.abs(evaluate(best) - value) > 1e-4) {
              animation.effect.updateTiming({ easing: "linear" });
              best = value;
            }
            animation.currentTime = (value === 0 || value === 1 ? value : best) * track.duration;
            animation.playbackRate = target ? 1 : -1;
            animation.play();
            if (value === target) animation.finish();
          }
          return Promise.all(effects.map((effect) => effect.finished));
        },
        cleanup() {
          for (const animation of effects) animation.cancel();
          effects = [];
          memory == null ? void 0 : memory.restore();
          memory = null;
        }
      };
    }
    function full(element, controller, progress) {
      var _a;
      if ((_a = controller.opening) == null ? void 0 : _a.saved) return controller.opening.saved;
      const record = controller.opening;
      if (record) {
        const completed = record.completed;
        record.completed = true;
        try {
          return snapshot(element, controller, progress);
        } finally {
          record.completed = completed;
        }
      }
      return snapshot(element, controller, progress);
    }
    function control(element, source, dismiss, progress, unpop) {
      var _a;
      const tracks = source.filter((track) => !track.property.startsWith("--ae-"));
      const duration = Math.max(0, ...tracks.map((track) => track.duration));
      const easing = ((_a = tracks[0]) == null ? void 0 : _a.timing.easing) || "linear";
      const channels = progress ? ["--ae-present-pop-phase", "--ae-present-dismiss-phase", "--ae-pop-progress", "--ae-dismiss-progress"] : [];
      if (unpop) channels.push("--ae-unpop-progress");
      for (const property of channels) {
        const forward = property.includes("dismiss") ? dismiss : property.includes("unpop") ? dismiss : !dismiss;
        tracks.push({
          property,
          duration,
          time: duration,
          timing: { easing },
          frames: [{ [property]: forward ? "0" : "1" }, { [property]: forward ? "1" : "0" }]
        });
      }
      return reverse(element, tracks, false, true);
    }
    return { init, capture, full, control, snapshot: (element, controller, progress) => {
      var _a;
      return ((_a = controller.opening) == null ? void 0 : _a.saved) || snapshot(element, controller, progress);
    }, complete, reverse };
  }
  var presentPlaybackProperties, camel, suffix, seconds, list, animationProperties, transitionProperties;
  var init_create_present_playback = __esm({
    "src/internal/create-present-playback.js"() {
      init_sample_css_easing();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      presentPlaybackProperties = [
        "opacity",
        "transform",
        "grid-template-rows",
        "grid-template-columns",
        "max-height",
        "max-width",
        "--ae-present-pop-phase"
      ];
      camel = (name) => name.startsWith("--") ? name : name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      suffix = (name) => name.replace(/^--ae-present-/, "");
      seconds = (value) => (parseFloat(value) || 0) * (String(value).trim().endsWith("ms") ? 1 : 1e3);
      list = (value) => value.split(/,(?![^()]*\))/).map((item) => item.trim());
      animationProperties = ["name", "duration", "delay", "timing-function", "direction", "fill-mode", "iteration-count", "play-state"];
      transitionProperties = ["property", "duration", "delay", "timing-function"];
    }
  });

  // src/internal/create-present-gestures.js
  function createPresentGestures(root2, api, services) {
    const entries = /* @__PURE__ */ new Map(), sources = /* @__PURE__ */ new Map();
    let interaction = null, suppressed = null, suppressTimer = null;
    const attribute = (name) => api.attr(`present-gesture${name ? `-${name}` : ""}`);
    const inputExceptions = `a:not([draggable='false']),button:not([draggable='false']),input,textarea,select,[contenteditable],[draggable='true'],[${api.attr("scrollbar-vertical")}],[${api.attr("scrollbar-horizontal")}]`;
    const warn = (element, name, value, reason) => api.diagnostics.warn(
      api.diagnostics.WARN_CONFIGURATION_VALUE,
      { extension: "present", element, attribute: name, value, reason }
    );
    const state = (element) => services.state(element);
    function update(element) {
      var _a, _b, _c;
      if (!element.hasAttribute(attribute(""))) {
        remove(element);
        return;
      }
      const signature = ["", "source", "unpop", "dismiss"].map((name) => element.getAttribute(attribute(name))).join("|");
      const direction = element.getAttribute(attribute(""));
      if (!directions[direction]) {
        remove(element);
        warn(element, attribute(""), direction, "Use up, down, left or right.");
        return;
      }
      const value = element.getAttribute(attribute("source"));
      const id = value == null ? void 0 : value.replace(/^#/, "");
      const source = value === "document" ? root2.document : value ? !/[\s#]/.test(id) && root2.document.getElementById(id) : element;
      if (((_a = source == null ? void 0 : source.matches) == null ? void 0 : _a.call(source, "a,button")) && source.getAttribute("draggable") !== "false") {
        api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, {
          extension: "present",
          element: source,
          attribute: "draggable",
          value: source.getAttribute("draggable"),
          reason: "An interactive Present gesture source requires draggable=false; applying it automatically.",
          suggestion: 'Declare draggable="false" on the gesture source.'
        });
        source.setAttribute("draggable", "false");
      }
      if (((_b = entries.get(element)) == null ? void 0 : _b.signature) === signature && ((_c = entries.get(element)) == null ? void 0 : _c.source) === source) return;
      remove(element);
      if (!source) {
        api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_TARGET, {
          extension: "present",
          element,
          attribute: attribute("source"),
          value,
          reason: "Gesture source ID was not found."
        });
        return;
      }
      let dismiss = element.getAttribute(attribute("dismiss"));
      if (dismiss && (!directions[dismiss] || directions[dismiss][0] === directions[direction][0])) {
        warn(element, attribute("dismiss"), dismiss, "Dismiss must use a direction on the other axis.");
        dismiss = null;
      }
      const unpop = element.getAttribute(attribute("unpop"));
      if (unpop !== null && !["", "true", "false"].includes(unpop))
        warn(element, attribute("unpop"), unpop, "Use true or false; invalid values enable gesture Unpop.");
      const entry = { element, source, direction, dismiss, unpop: unpop !== "false", signature };
      entries.set(element, entry);
      for (const target of /* @__PURE__ */ new Set([source, element])) {
        if (!sources.has(target)) {
          sources.set(target, /* @__PURE__ */ new Set());
          target.addEventListener("pointerdown", down, true);
        }
        sources.get(target).add(entry);
      }
      inspect(element);
    }
    function inspect(element) {
      var _a;
      if (((_a = entries.get(element)) == null ? void 0 : _a.source) === element && root2.getComputedStyle(element).display === "none")
        api.diagnostics.info(api.diagnostics.INFO_PRESENT_GESTURE_HIDDEN, { extension: "present", element });
    }
    function remove(element) {
      var _a;
      const entry = entries.get(element);
      if (!entry) return;
      if (((_a = interaction == null ? void 0 : interaction.owner) == null ? void 0 : _a.entry) === entry || (interaction == null ? void 0 : interaction.candidates.some((candidate) => candidate.entry === entry))) cancel();
      entries.delete(element);
      for (const target of /* @__PURE__ */ new Set([entry.source, element])) {
        const set = sources.get(target);
        set.delete(entry);
        if (!set.size) {
          target.removeEventListener("pointerdown", down, true);
          sources.delete(target);
        }
      }
    }
    function down(event) {
      if (interaction && interaction.id !== event.pointerId) {
        cancel();
        return;
      }
      if (event.button !== 0 || event.isPrimary === false || event.defaultPrevented) return;
      const target = event.target;
      if (!target.closest || target.closest(inputExceptions)) return;
      if (!interaction) {
        interaction = {
          id: event.pointerId,
          pointerType: event.pointerType,
          x: event.clientX,
          y: event.clientY,
          candidates: [],
          owner: null,
          target
        };
        for (const name of ["pointermove", "pointerup", "pointercancel", "lostpointercapture"])
          root2.addEventListener(name, move, { capture: true, passive: false });
        if (event.pointerType === "touch") root2.addEventListener("touchmove", touchMove, { capture: true, passive: false });
      }
      for (const entry of sources.get(event.currentTarget) || []) {
        if (interaction.candidates.some((candidate) => candidate.entry === entry)) continue;
        const origin = state(entry.element);
        const onElement = entry.element.contains(target);
        const onSource = entry.source === root2.document || entry.source.contains(target);
        if (services.busy(entry.element)) continue;
        if (origin === "Pop" ? onElement : onSource)
          interaction.candidates.push({ entry, origin });
      }
      if (event.pointerType !== "touch" && interaction.candidates.length && !interaction.captured) {
        try {
          target.setPointerCapture(event.pointerId);
          interaction.captured = true;
        } catch (_) {
        }
      }
    }
    function parameters(element, axis) {
      const style = root2.getComputedStyle(element);
      const thresholds = {};
      for (const name of ["pop", "unpop", "dismiss"]) {
        const property2 = `--ae-present-${name}-threshold`, raw2 = style.getPropertyValue(property2).trim();
        const value = raw2 === "" ? 0.5 : Number(raw2);
        thresholds[name] = Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.5;
        if (thresholds[name] !== value) warn(element, property2, raw2, "Use a number between 0 and 1; using 0.5.");
      }
      const property = "--ae-present-gesture-distance", raw = style.getPropertyValue(property).trim();
      let distance = 0;
      if (raw && raw !== "auto") {
        const probe = root2.document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;padding:0;border:0;min-width:0;max-width:none;height:0;";
        probe.style.fontSize = style.fontSize;
        probe.style.width = raw;
        if (probe.style.width && !raw.includes("%")) {
          element.appendChild(probe);
          distance = parseFloat(root2.getComputedStyle(probe).width);
          probe.remove();
        }
        if (!(distance > 0)) warn(element, property, raw, "Use a positive CSS length or auto; using auto.");
      }
      return __spreadProps(__spreadValues({}, thresholds), {
        distance: distance > 0 ? distance : 0,
        fallback: Math.max(1, axis === "x" ? element.offsetWidth : element.offsetHeight)
      });
    }
    function move(event) {
      var _a;
      const current = interaction;
      if (!current || current.id !== event.pointerId) return;
      if (event.type !== "pointermove") {
        release(event.type !== "pointerup");
        return;
      }
      if (event.isTrusted && event.pointerType !== "touch" && (event.buttons & 1) === 0) {
        release(false);
        return;
      }
      if (current.scrollOwned) return;
      const x = event.clientX - current.x, y = event.clientY - current.y;
      if (!current.owner) {
        if (Math.max(Math.abs(x), Math.abs(y)) < 8) return;
        const axis = Math.abs(x) > Math.abs(y) * 1.2 ? "x" : Math.abs(y) > Math.abs(x) * 1.2 ? "y" : null;
        if (!axis) return;
        const delta = axis === "x" ? x : y;
        const candidates = current.candidates.filter((candidate2) => {
          const { entry, origin } = candidate2;
          if (!entry.element.isConnected || state(entry.element) !== origin || services.busy(entry.element)) return false;
          const main = directions[entry.direction], dismiss = directions[entry.dismiss];
          candidate2.dismiss = origin === "Pop" && (dismiss == null ? void 0 : dismiss[0]) === axis && delta * dismiss[1] > 0;
          candidate2.sign = candidate2.dismiss ? dismiss[1] : main[1];
          return candidate2.dismiss || main[0] === axis && (origin === "Pop" ? entry.unpop && delta * main[1] < 0 : delta * main[1] > 0);
        });
        candidates.sort((a, b) => {
          const left = a.origin === "Pop" ? a.entry.element : a.entry.source;
          const right = b.origin === "Pop" ? b.entry.element : b.entry.source;
          if (left !== right) {
            if (left.contains(right)) return 1;
            if (right.contains(left)) return -1;
          }
          return services.order(b.entry.element) - services.order(a.entry.element);
        });
        const candidate = candidates[0];
        if (!candidate) {
          clear();
          return;
        }
        if (nativeScroll(current.target, candidate.entry.element, axis, delta)) {
          current.scrollOwned = true;
          return;
        }
        if (!((_a = root2.KeyframeEffect) == null ? void 0 : _a.prototype.setKeyframes) || !candidate.entry.element.getAnimations) {
          warn(candidate.entry.element, attribute(""), candidate.entry.direction, "Interactive Present requires inspectable Web Animations transitions.");
          clear();
          return;
        }
        const params = parameters(candidate.entry.element, axis);
        let resolve;
        const settled = new Promise((done) => {
          resolve = done;
        });
        const owner2 = current.owner = __spreadProps(__spreadValues({}, candidate), {
          params,
          axis,
          displacement: 0,
          progress: candidate.dismiss ? 0 : candidate.origin === "Pop" ? 1 : 0,
          handle: null,
          released: null,
          settled,
          attach(handle, autoDistance) {
            this.handle = handle;
            if (!params.distance) params.distance = autoDistance || Math.max(1, axis === "x" ? this.entry.element.offsetWidth : this.entry.element.offsetHeight);
            this.progress = clamp(this.start + this.displacement / params.distance);
            this.seek();
            if (this.released !== null) this.finish(this.released);
          },
          seek() {
            var _a2;
            (_a2 = this.handle) == null ? void 0 : _a2.seek(this.progress);
          },
          finish(cancelled) {
            this.released = cancelled;
            if (!this.handle) return;
            const target = cancelled ? this.dismiss ? 0 : this.origin === "Pop" ? 1 : 0 : this.dismiss ? +(this.progress >= params.dismiss) : this.origin === "Pop" ? +(this.progress > params.unpop) : +(this.progress >= params.pop);
            const destination = this.dismiss ? target ? "Dismiss" : this.origin : target ? "Pop" : this.origin === "Dismiss" ? "Dismiss" : "Unpop";
            this.handle.playTo(target).then(() => resolve(destination), () => resolve(null));
          },
          abort() {
            resolve(null);
            if ((interaction == null ? void 0 : interaction.owner) === this) clear();
          }
        });
        owner2.start = owner2.progress;
        services.begin(candidate.entry.element, candidate.dismiss ? "Dismiss" : candidate.origin === "Pop" ? "Unpop" : "Pop", owner2);
        if (interaction !== current) return;
        if (event.pointerType === "touch" && !current.captured) {
          try {
            current.target.setPointerCapture(event.pointerId);
            current.captured = true;
          } catch (_) {
          }
        }
      }
      const owner = current.owner;
      const displacement = (owner.axis === "x" ? x : y) * owner.sign;
      owner.displacement = displacement;
      owner.progress = clamp(owner.start + displacement / (owner.params.distance || owner.params.fallback));
      owner.seek();
      if (event.cancelable) event.preventDefault();
    }
    function nativeScroll(target, element, axis, delta) {
      for (let current = target; current && current !== element && current !== root2.document; current = current.parentElement) {
        const style = root2.getComputedStyle(current);
        if (!/auto|scroll/.test(axis === "x" ? style.overflowX : style.overflowY)) continue;
        const position = axis === "x" ? current.scrollLeft : current.scrollTop;
        const maximum = axis === "x" ? current.scrollWidth - current.clientWidth : current.scrollHeight - current.clientHeight;
        if (maximum > 0 && (delta < 0 ? position < maximum : position > 0)) return true;
      }
      return false;
    }
    function touchMove(event) {
      if ((interaction == null ? void 0 : interaction.pointerType) === "touch" && interaction.owner && event.touches.length === 1 && event.cancelable)
        event.preventDefault();
    }
    function release(cancelled) {
      const owner = interaction == null ? void 0 : interaction.owner;
      if (owner) {
        owner.finish(cancelled);
        suppressed = interaction.target;
        clearTimeout(suppressTimer);
        root2.document.addEventListener("click", click, true);
        suppressTimer = setTimeout(clearClick, 500);
      }
      clear();
    }
    function click(event) {
      if (!suppressed || !(suppressed === event.target || suppressed.contains(event.target) || event.target.contains(suppressed))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      clearClick();
    }
    function clearClick() {
      clearTimeout(suppressTimer);
      suppressTimer = null;
      suppressed = null;
      root2.document.removeEventListener("click", click, true);
    }
    function clear() {
      const previous = interaction;
      interaction = null;
      for (const name of ["pointermove", "pointerup", "pointercancel", "lostpointercapture"])
        root2.removeEventListener(name, move, true);
      if ((previous == null ? void 0 : previous.pointerType) === "touch") root2.removeEventListener("touchmove", touchMove, true);
      if (previous == null ? void 0 : previous.captured) try {
        previous.target.releasePointerCapture(previous.id);
      } catch (_) {
      }
    }
    function cancel() {
      release(true);
    }
    return { update, remove, inspect, destroy() {
      cancel();
      for (const element of [...entries.keys()]) remove(element);
      clearClick();
    } };
  }
  var directions, clamp;
  var init_create_present_gestures = __esm({
    "src/internal/create-present-gestures.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      directions = { up: ["y", -1], down: ["y", 1], left: ["x", -1], right: ["x", 1] };
      clamp = (value) => Math.max(0, Math.min(1, value));
    }
  });

  // src/internal/create-present-effects.js
  function createPresentEffects(root2, api, controllers) {
    const operations = /* @__PURE__ */ new Map();
    const targets = /* @__PURE__ */ new Map();
    const presets = /* @__PURE__ */ new Set(["shake", "yes", "no", "breathe", "tremble", "pulse", "alert"]);
    const presentAttribute = api.attr("present");
    function visible(element) {
      if (!element.isConnected || !element.getClientRects().length) return false;
      const style = root2.getComputedStyle(element);
      if (["hidden", "collapse"].includes(style.visibility)) return false;
      for (let node = element; node; node = node.parentElement) {
        const computed = root2.getComputedStyle(node);
        if (computed.display === "none" || computed.contentVisibility === "hidden" || Number(computed.opacity) === 0) return false;
      }
      return true;
    }
    function finish(operation, status) {
      if (operations.get(operation.element) !== operation) return;
      api.motion.cancel(operation.id);
      if (!operation.authoredClass) operation.target.classList.remove(operation.className);
      operations.delete(operation.element);
      if (targets.get(operation.target) === operation) targets.delete(operation.target);
      operation.resolve({ status });
    }
    function cancelWithin(element) {
      for (const operation of operations.values()) {
        if (element.contains(operation.element) || element.contains(operation.target)) finish(operation, "aborted");
      }
    }
    function blocked(operation) {
      var _a;
      for (let node = operation.target; node; node = node.parentElement) {
        const controller = controllers.get(node);
        if (controller == null ? void 0 : controller.transition) operation.waiting.add(controller.transition);
      }
      const transition = (_a = controllers.get(operation.element)) == null ? void 0 : _a.transition;
      if (transition) operation.waiting.add(transition);
      return operation.waiting.size > 0;
    }
    function start(operation) {
      if (operations.get(operation.element) !== operation) return;
      if (!controllers.has(operation.element) || !operation.element.contains(operation.target) || !visible(operation.target) || api.currentPreference("reduced-motion") === "reduced") {
        finish(operation, "skipped");
        return;
      }
      if (blocked(operation)) return;
      const transform = root2.getComputedStyle(operation.target).transform;
      if (presets.has(operation.effect) && (operation.target.hasAttribute(api.attr("anchor")) || operation.target.hasAttribute(api.attr("scrollbox-elastic")) || (operation.target.getAttribute(presentAttribute) || "").split(/\s+/).includes("transform") || transform && transform !== "none" && transform !== "matrix(1, 0, 0, 1, 0, 0)")) {
        const owners = [];
        for (const name of ["anchor", "scrollbox-elastic"]) if (operation.target.hasAttribute(api.attr(name))) owners.push(name);
        if (!operation.target.hasAttribute(api.attr("anchor")) && (operation.target.getAttribute(presentAttribute) || "").split(/\s+/).includes("transform")) owners.push("present");
        if (!owners.length) owners.push("authored-transform");
        if (api.options.environment === "development") for (const owner of owners) api.diagnostics.warn(api.diagnostics.WARN_RESOURCE_CONFLICT, {
          extension: "present",
          element: operation.target,
          property: "transform",
          writers: [owner, "present-effect"],
          reason: "A preset effect would replace the stable transform.",
          suggestion: "Pass an untransformed inner effectTarget to present.effect()."
        });
        finish(operation, "skipped");
        return;
      }
      operation.target.getBoundingClientRect();
      api.motion.run(operation.target, {
        extension: "present-effect",
        id: operation.id,
        ownedOnly: true,
        apply: () => operation.target.classList.add(operation.className),
        easing: root2.getComputedStyle(operation.target).getPropertyValue("--ae-present-effect-aellux-ease").trim() || void 0,
        abort: () => operations.get(operation.element) !== operation || !controllers.has(operation.element) || !operation.target.isConnected || !operation.element.contains(operation.target) || api.currentPreference("reduced-motion") === "reduced" || blocked(operation)
      }).then((result) => finish(operation, result.status), (cause) => {
        api.diagnostics.error(api.diagnostics.ERROR_EXTENSION_TRANSITION, { cause, extension: "present", element: operation.target });
        finish(operation, "aborted");
      });
    }
    function effect(element, effect2, effectTarget = element) {
      const controller = controllers.get(element);
      if (!controller) return Promise.resolve({ status: "skipped" });
      if (typeof effect2 !== "string" || !/^[a-zA-Z_][\w-]*$/.test(effect2) || !effectTarget || effectTarget.nodeType !== 1 || !element.contains(effectTarget)) {
        api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, {
          extension: "present",
          element,
          value: effect2,
          reason: "An effect requires one CSS identifier and a target inside its mounted Present.",
          suggestion: "Use a preset or custom effect name and an optional descendant Element."
        });
        return Promise.resolve({ status: "skipped" });
      }
      if (operations.has(element)) finish(operations.get(element), "aborted");
      if (targets.has(effectTarget)) finish(targets.get(effectTarget), "aborted");
      let resolve;
      const promise = new Promise((done) => {
        resolve = done;
      });
      const className = api.className(`present-effect-${effect2}`);
      const operation = {
        element,
        target: effectTarget,
        effect: effect2,
        resolve,
        className,
        id: api.motion.id(),
        waiting: /* @__PURE__ */ new Set(),
        authoredClass: effectTarget.classList.contains(className)
      };
      operations.set(element, operation);
      targets.set(effectTarget, operation);
      if (api.currentPreference("reduced-motion") === "reduced") finish(operation, "skipped");
      else if (!blocked(operation)) start(operation);
      return promise;
    }
    function settled(transition) {
      for (const operation of operations.values()) {
        if (!operation.waiting.delete(transition)) continue;
        if (!transition.completed) finish(operation, "aborted");
        else if (!operation.waiting.size) start(operation);
      }
    }
    function destroy() {
      for (const operation of operations.values()) finish(operation, "aborted");
    }
    function preferences() {
      if (api.currentPreference("reduced-motion") === "reduced")
        for (const operation of operations.values()) finish(operation, "skipped");
    }
    return { effect, cancelWithin, settled, destroy, preferences };
  }
  var init_create_present_effects = __esm({
    "src/internal/create-present-effects.js"() {
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
    }
  });

  // src/aellux.ext.present.js
  var aellux_ext_present_exports = {};
  var init_aellux_ext_present = __esm({
    "src/aellux.ext.present.js"() {
      init_create_present_playback();
      init_create_present_gestures();
      init_create_present_effects();
      /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
      (function(root2) {
        "use strict";
        const aelluxJs2 = root2.aelluxJs;
        const extensionName = "present";
        if (!aelluxJs2) {
          throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
        }
        const attr = {
          present: aelluxJs2.attr(extensionName),
          group: aelluxJs2.attr("present-group"),
          active: aelluxJs2.attr("present-active"),
          when: aelluxJs2.attr("present-when"),
          triggerOn: aelluxJs2.attr("present-trigger-on"),
          autoDismiss: aelluxJs2.attr("auto-dismiss"),
          presentMotion: aelluxJs2.attr("present-motion"),
          dismissOnClick: aelluxJs2.attr("dismiss-on-click"),
          trigger: aelluxJs2.attr("present-trigger"),
          //toggle,pop,dismiss,unpop,effect
          target: aelluxJs2.attr("present-target"),
          //target ID
          effect: aelluxJs2.attr("present-effect")
        };
        const className = {
          pop: aelluxJs2.className("pop"),
          popping: aelluxJs2.className("popping"),
          dismissing: aelluxJs2.className("dismissing"),
          unpopping: aelluxJs2.className("unpopping"),
          unpop: aelluxJs2.className("unpop"),
          dismissed: aelluxJs2.className("dismissed"),
          willChange: aelluxJs2.className("will-change"),
          grid: aelluxJs2.className("present-grid")
        };
        const presentSelector = `[${attr.present}]`;
        const groupSelector = `[${attr.group}]`;
        aelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          pop,
          dismiss,
          unpop,
          toggle,
          trigger,
          show,
          selected,
          popNext,
          effect,
          cancelEffect
        });
        const POP = "Pop", DISMISS = "Dismiss", UNPOP = "Unpop", BEFORE = "Before", MILLISECOND = "ms", SECOND = "s", DEFAULT_PRESENT = "opacity transform height width", OPACITY_SYNTAX = "<number> | <percentage>", TRANSFORM_SYNTAX = "<transform-list> | none";
        const TRANSITION_PREPARE_TIME = 100;
        const TAP_CLICK_WAIT_TIME = 32;
        const presentElements = /* @__PURE__ */ new Map();
        const effects = createPresentEffects(root2, aelluxJs2, presentElements);
        const openPresentElements = /* @__PURE__ */ new Set();
        let fallbackMotionId = 5e6;
        const triggerElementsSet = /* @__PURE__ */ new Set();
        const triggerTargets = /* @__PURE__ */ new Map();
        const triggersByTargetId = /* @__PURE__ */ new Map();
        const indexedTriggerValues = /* @__PURE__ */ new Map();
        const elementMemories = /* @__PURE__ */ new WeakMap();
        const containerAriaHandlers = /* @__PURE__ */ new WeakMap();
        const triggerAriaHandlers = /* @__PURE__ */ new WeakMap();
        const measuredMemories = /* @__PURE__ */ new WeakMap();
        const groups = /* @__PURE__ */ new Map();
        const hoverTimers = /* @__PURE__ */ new Map();
        const hoveredTriggers = /* @__PURE__ */ new Set();
        const pendingTaps = /* @__PURE__ */ new Set();
        let groupObserver = null;
        let groupsQueued = false;
        let interpolatedProgress = false;
        let interpolatedUnpop = false;
        const playback = createPresentPlayback(root2, aelluxJs2);
        const gestures = createPresentGestures(root2, aelluxJs2, {
          state: (element) => {
            var _a;
            return (_a = presentElements.get(element)) == null ? void 0 : _a.state;
          },
          busy: (element) => {
            var _a;
            return !!((_a = presentElements.get(element)) == null ? void 0 : _a.transition);
          },
          order: (element) => {
            var _a;
            return ((_a = presentElements.get(element)) == null ? void 0 : _a.presentationOrder) || 0;
          },
          begin(element, direction, gesture) {
            const controller = presentElements.get(element);
            controller.gestureRequest = gesture;
            presentTransition(element, direction === POP, false, false, void 0, direction).finally(() => {
              if (controller.gestureRequest === gesture) controller.gestureRequest = null;
              if (controller.gesture !== gesture) gesture.abort();
            });
            if (!controller.transition) gesture.abort();
          }
        });
        let autoObserver = null;
        let presentationSequence = 0;
        const cssProperties = [
          ["pop-progress", "<number>", "0"],
          ["dismiss-progress", "<number>", "1"],
          ["present-pop-phase", "<number>", "0"],
          ["present-dismiss-phase", "<number>", "1"],
          ["from-opacity", OPACITY_SYNTAX, "0"],
          ["pop-opacity", OPACITY_SYNTAX, "1"],
          ["dismiss-opacity", OPACITY_SYNTAX, "0"],
          ["from-transform", TRANSFORM_SYNTAX, "scale(0.5)"],
          ["pop-transform", TRANSFORM_SYNTAX, "scale(1)"],
          ["dismiss-transform", TRANSFORM_SYNTAX, "scale(1.2)"],
          ["from-height", "*", "0fr"],
          ["pop-height", "*", "1fr"],
          ["dismiss-height", "*", "0fr"],
          ["from-width", "*", "0fr"],
          ["pop-width", "*", "1fr"],
          ["dismiss-width", "*", "0fr"],
          ["pop-ease", "*", "ease-out"],
          ["dismiss-ease", "*", "ease-in"],
          ["pop-duration", "<time>", "250ms"],
          ["dismiss-duration", "<time>", "250ms"]
        ];
        function init(options) {
          const communication = { owner: extensionName };
          for (const [name, method] of Object.entries({ pop, unpop, dismiss }))
            aelluxJs2.comm.handle("present." + name, ({ element }) => method(element), communication);
          aelluxJs2.comm.handle("present.toggle", ({ element, goto }) => toggle(element, goto), communication);
          aelluxJs2.comm.handle("present.effect", ({ element, effect: name, effectTarget }) => effect(element, name, effectTarget), communication);
          aelluxJs2.comm.handle("present.show", ({ group, member }) => show(group, member), communication);
          aelluxJs2.comm.handle("present.selection", ({ group }) => selected(group), communication);
          aelluxJs2.comm.handle("present.pop-next", (request) => popNext(request.group, (member) => {
            if (request.preparation) {
              const result = aelluxJs2.comm.request(request.preparation.contract, __spreadProps(__spreadValues({}, request.preparation.payload), { element: member }));
              if (!result.handled || result.value === false) throw new Error("Present preparation is unavailable.");
            }
          }), communication);
          playback.init();
          const descriptors = cssProperties.map(([name, syntax, initialValue]) => ({ name: `--ae-${name}`, syntax, initialValue }));
          const progressRegistered = aelluxJs2.registerCssProperty(...descriptors.slice(0, 4));
          interpolatedProgress = !!(progressRegistered && root2.CSS.supports && root2.CSS.supports("opacity", "clamp(0, 0.5, 1)"));
          interpolatedUnpop = !!aelluxJs2.registerCssProperty({ name: "--ae-unpop-progress", syntax: "<number>", initialValue: "1" });
          aelluxJs2.registerCssProperty(...descriptors.slice(4));
          aelluxJs2.mountManager.add({
            extensionName,
            selector: presentSelector,
            priority: 0,
            mount: mountPresentContainer,
            unmount: unmountPresentContainer,
            update: (element) => autoDismissSchedule(element, presentElements.get(element)),
            controllers: ["pop", "dismiss", "unpop", "trigger", "toggle", "effect", "cancelEffect"]
          });
          aelluxJs2.mountManager.add({
            extensionName,
            priority: 0,
            selector: `[${attr.trigger}]`,
            mount: mountTriggerElement,
            unmount: unmountTriggerElement,
            update: refreshTriggerTargets
          });
          aelluxJs2.mountManager.add({
            extensionName,
            selector: groupSelector,
            priority: 1,
            mount: mountGroup,
            unmount: unmountGroup,
            controllers: ["show", "selected", "popNext"]
          });
          autoObserver = new root2.MutationObserver((records) => {
            for (const record of records) {
              if (record.target === document.documentElement && record.attributeName === aelluxJs2.attr("reduced-motion")) effects.preferences();
              const controller = presentElements.get(record.target);
              if (controller) {
                if (record.attributeName !== attr.autoDismiss) gestures.update(record.target);
                autoDismissSchedule(record.target, controller);
              }
            }
            if (records.some((record) => record.type === "childList" || record.attributeName === "id")) {
              for (const element of presentElements.keys()) if (element.hasAttribute(aelluxJs2.attr("present-gesture-source"))) gestures.update(element);
            }
          });
          autoObserver.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: [
            attr.autoDismiss,
            "id",
            aelluxJs2.attr("reduced-motion"),
            ...["", "-source", "-unpop", "-dismiss"].map((suffix2) => aelluxJs2.attr(`present-gesture${suffix2}`))
          ] });
          document.addEventListener("pointerover", onHover);
          document.addEventListener("pointerout", onHover);
          aelluxJs2.on("$click", OnClick);
          aelluxJs2.on("tap", onTap);
          aelluxJs2.onEvent(root2, "$resize", refreshExpandedStates);
        }
        function destroy() {
          aelluxJs2.comm.removeOwner(extensionName);
          effects.destroy();
          gestures.destroy();
          autoObserver == null ? void 0 : autoObserver.disconnect();
          autoObserver = null;
          aelluxJs2.mountManager.remove({ extensionName });
          aelluxJs2.off("$click", OnClick);
          aelluxJs2.off("tap", onTap);
          for (const pending of pendingTaps) cancelPendingTap(pending);
          aelluxJs2.offEvent(root2, "$resize", refreshExpandedStates);
          document.removeEventListener("pointerover", onHover);
          document.removeEventListener("pointerout", onHover);
          for (const group of groups.keys()) unmountGroup(group);
          for (const target of hoverTimers.keys()) cancelHoverClose(target);
          hoveredTriggers.clear();
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
          elementMemories.set(element, aelluxJs2.persist.element.save(
            element,
            [attr.present, attr.presentMotion, "hidden"],
            [
              "--ae-pop-progress",
              "--ae-dismiss-progress",
              "--ae-unpop-progress",
              "--ae-present-pop-phase",
              "--ae-present-dismiss-phase"
            ]
          ));
          containerAriaHandlers.set(element, aelluxJs2.aria.register(element));
          const initialState = element.classList.contains(className.dismissed) ? DISMISS : element.classList.contains(className.unpop) || element.hidden ? UNPOP : POP;
          const legacyHidden = element.hidden || ![className.pop, className.unpop, className.dismissed].some((name) => element.classList.contains(name));
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
            aelluxJs2.diagnostics.info(
              aelluxJs2.diagnostics.INFO_PRESENT_MEASURED_LAYOUT,
              { extension: extensionName, element }
            );
          }
          const presentController = {
            state: initialState,
            legacyHidden,
            initialClasses: [className.pop, className.unpop, className.dismissed].filter((name) => element.classList.contains(name)),
            gesture: null,
            gestureRequest: null,
            presentMotion,
            measuredHeight,
            measuredWidth,
            motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
            motionId: aelluxJs2.motion ? aelluxJs2.motion.id() : fallbackMotionId++,
            transition: null,
            handoff: null,
            opening: null,
            reverse: null,
            operationRevision: 0,
            presentationOrder: element.hidden ? 0 : ++presentationSequence,
            autoDismissTimeout: null,
            autoCountdown: null,
            direction: initialState,
            classList: element.classList,
            triggers: /* @__PURE__ */ new Set(),
            triggerExpanded: initialState === POP,
            setAriaExpanded: function(value) {
              this.expanded = value === "true";
              containerAriaHandlers.get(element).set({ expanded: this.expanded });
            },
            setTriggerExpanded: function(value) {
              this.triggerExpanded = value;
              this.triggers.forEach(updateTriggerAriaExpanded);
            },
            stop: function(options = {}) {
              var _a, _b, _c;
              effects.cancelWithin(element);
              (_a = this.gesture) == null ? void 0 : _a.abort();
              this.gesture = null;
              const replacement = options.replacement === true;
              const transitionStart = options.transitionStart === true;
              const transition = this.transition;
              if (transition) {
                transition.cancelled = true;
                transition.replacement = replacement;
                if (aelluxJs2.motion) aelluxJs2.motion.cancel(this.motionId);
                if (transition.timeout !== null) {
                  clearTimeout(transition.timeout);
                  transition.timeout = null;
                }
                if (!transitionStart && transition.className) {
                  this.classList.remove(transition.className);
                }
                this.transition = null;
                transition.interrupt(
                  aelluxJs2.diagnostics.create(
                    aelluxJs2.diagnostics.WARN_INTERRUPTION,
                    { extensionName, replacement }
                  )
                );
              }
              cancelAutoDismiss(this);
              (_b = this.reverse) == null ? void 0 : _b.cleanup();
              this.reverse = null;
              (_c = this.gestureDisplay) == null ? void 0 : _c.restore();
              this.gestureDisplay = null;
              restoreHandoff(this);
              if (transitionStart) {
                this.classList.remove(className.dismissing, className.unpopping);
              } else {
                this.classList.remove(
                  className.pop,
                  className.popping,
                  className.dismissing,
                  className.unpopping,
                  className.willChange
                );
              }
              if (!replacement) restoreMeasuredStyles(element, this);
            }
          };
          establishState(element, presentController, initialState);
          if (initialState === POP) {
            openPresentElements.add(element);
          }
          presentElements.set(element, presentController);
          for (const triggerElement of element.querySelectorAll(
            `[${attr.trigger}]`
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
          setProgress(element, initialState === POP);
          syncAriaExpanded(element, presentController);
          queueGroups();
          autoDismissSchedule(element, presentController);
          gestures.update(element);
        }
        function unmountPresentContainer(element) {
          var _a, _b, _c;
          if (!presentElements.has(element)) return;
          cancelElementTaps(element);
          const controller = presentElements.get(element);
          gestures.remove(element);
          cancelHoverClose(element);
          for (const button of controller.triggers) hoveredTriggers.delete(button);
          controller.stop();
          (_a = aelluxJs2.waitLayout) == null ? void 0 : _a.cancel(controller.motionId);
          element.classList.remove(className.grid);
          element.classList.remove(className.pop, className.unpop, className.dismissed);
          element.classList.add(...controller.initialClasses);
          presentElements.delete(element);
          openPresentElements.delete(element);
          (_b = containerAriaHandlers.get(element)) == null ? void 0 : _b.release();
          containerAriaHandlers.delete(element);
          (_c = elementMemories.get(element)) == null ? void 0 : _c.restore();
          elementMemories.delete(element);
          controller.triggers.forEach(updateTriggerAriaExpanded);
          queueGroups();
        }
        function mountTriggerElement(triggerElement) {
          if (triggerElementsSet.has(triggerElement) || !triggerElement.hasAttribute(attr.trigger)) return;
          triggerAriaHandlers.set(triggerElement, aelluxJs2.aria.register(triggerElement));
          triggerElementsSet.add(triggerElement);
          refreshTriggerTargets(triggerElement);
        }
        function unmountTriggerElement(triggerElement) {
          var _a, _b;
          if (!triggerElementsSet.has(triggerElement)) return;
          cancelElementTaps(triggerElement);
          hoveredTriggers.delete(triggerElement);
          const target = triggerTargets.get(triggerElement);
          if (target) {
            cancelHoverClose(target);
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
            aelluxJs2.diagnostics.error(aelluxJs2.diagnostics.ERROR_EXTENSION_SELECTOR, {
              cause: new SyntaxError(),
              extension: extensionName,
              selector: value,
              reason: "Present targets accept one element ID, not a CSS selector list.",
              suggestion: "Use one existing Present ID, optionally prefixed with #."
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
          if (!triggerElement.hasAttribute(attr.trigger)) {
            unmountTriggerElement(triggerElement);
            return;
          }
          if (!triggerElementsSet.has(triggerElement)) {
            mountTriggerElement(triggerElement);
            return;
          }
          const previousTarget = triggerTargets.get(triggerElement);
          const targetSelector = triggerElement.getAttribute(attr.target);
          indexTriggerTarget(triggerElement, targetSelector);
          const container = triggerElement.closest(presentSelector);
          if (previousTarget) {
            (_a = presentElements.get(previousTarget)) == null ? void 0 : _a.triggers.delete(triggerElement);
          }
          let target = null;
          if (targetSelector) {
            target = targetById(targetSelector);
          } else if (container) {
            target = container;
          }
          if (previousTarget !== target) hoveredTriggers.delete(triggerElement);
          if (!target) {
            triggerTargets.delete(triggerElement);
            (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.unset("expanded");
            (_c = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _c.unset("controls");
            return;
          }
          triggerTargets.set(triggerElement, target);
          (_d = presentElements.get(target)) == null ? void 0 : _d.triggers.add(triggerElement);
          const targetIds = new Set(target.id ? [target.id] : []);
          const initial = (_e = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _e.initial("controls");
          if (initial) {
            initial.trim().split(/\s+/).forEach((x) => targetIds.add(x));
          }
          updateTriggerAriaExpanded(triggerElement);
          if (targetIds.size) triggerAriaHandlers.get(triggerElement).set({ controls: [...targetIds] });
          else triggerAriaHandlers.get(triggerElement).unset("controls");
        }
        function updateTriggerAriaExpanded(triggerElement) {
          var _a, _b;
          const target = triggerTargets.get(triggerElement);
          if (!target) return;
          const expanded = ((_a = presentElements.get(target)) == null ? void 0 : _a.triggerExpanded) === true;
          (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.set({ expanded });
        }
        function pop(element) {
          return presentTransition(element, true, true);
        }
        function dismiss(element) {
          return presentTransition(element, false);
        }
        function unpop(element) {
          return presentTransition(element, false, false, false, void 0, UNPOP);
        }
        function toggle(element, goto) {
          return presentTransition(element, goto, false, false, void 0, UNPOP);
        }
        function effect(element, name, effectTarget) {
          return effects.effect(element, name, effectTarget);
        }
        function cancelEffect(element) {
          effects.cancelWithin(element);
        }
        function trigger(element, trigger2, name) {
          trigger2 = typeof trigger2 === "string" ? (trigger2 || "toggle").toLowerCase() : "toggle";
          if (trigger2 === "effect") return effect(element, name);
          if (!["pop", "dismiss", "unpop", "toggle"].includes(trigger2)) aelluxJs2.diagnostics.warn(
            aelluxJs2.diagnostics.WARN_CONFIGURATION_VALUE,
            {
              extension: extensionName,
              element,
              attribute: attr.trigger,
              value: trigger2,
              reason: "Unknown Present action; using toggle.",
              suggestion: "Use pop, dismiss, unpop, or toggle."
            }
          );
          const method = trigger2 === "pop" ? pop : trigger2 === "dismiss" ? dismiss : trigger2 === "unpop" ? unpop : toggle;
          return method(element);
        }
        function restoreMeasuredStyles(element, controller) {
          const memory = measuredMemories.get(element);
          if (!memory) return;
          memory.restore();
          measuredMemories.delete(element);
        }
        function restoreHandoff(controller) {
          var _a;
          (_a = controller.handoff) == null ? void 0 : _a.memory.restore();
          controller.handoff = null;
        }
        function captureHandoff(element, controller) {
          if ((controller.measuredHeight || controller.measuredWidth) && !measuredMemories.has(element)) {
            measuredMemories.set(element, aelluxJs2.persist.element.save(element, [], ["max-height", "max-width"]));
          }
          const tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
          const properties = [];
          if (tokens.includes("opacity")) properties.push("opacity");
          if (tokens.includes("transform") && !element.hasAttribute(aelluxJs2.attr("anchor"))) properties.push("transform");
          if (tokens.includes("height")) properties.push(...controller.presentMotion ? ["grid-template-rows", "height"] : ["max-height"]);
          if (tokens.includes("width")) properties.push(...controller.presentMotion ? ["grid-template-columns", "width"] : ["max-width"]);
          properties.push(
            "--ae-present-pop-phase",
            "--ae-present-dismiss-phase",
            "--ae-pop-progress",
            "--ae-dismiss-progress",
            "--ae-unpop-progress"
          );
          const computed = root2.getComputedStyle(element);
          const values = properties.map((property) => {
            let value = computed.getPropertyValue(property).trim();
            if (property === "max-height" || property === "max-width") {
              const dimension = property.slice(4);
              value = `${Math.max(0, parseFloat(computed[dimension]) || 0)}px`;
            }
            return [property, value];
          });
          if (controller.reverse) {
            controller.reverse.cleanup();
            controller.reverse = null;
            restoreHandoff(controller);
          }
          const memory = aelluxJs2.persist.element.save(element, [], [...properties, "transition-property"]);
          const transition = aelluxJs2.persist.element.save(element, [], ["transition-property"]);
          const freeze = () => {
            element.style.setProperty("transition-property", "none", "important");
            for (const [property, value] of values) element.style.setProperty(property, value, property.startsWith("--") ? "" : "important");
            element.getBoundingClientRect();
          };
          freeze();
          return { memory, transition, values, freeze };
        }
        async function prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation) {
          if (!controller.measuredHeight && !controller.measuredWidth) return null;
          if (!measuredMemories.has(element)) {
            measuredMemories.set(element, aelluxJs2.persist.element.save(
              element,
              [],
              ["max-height", "max-width"]
            ));
          }
          if (gotoVisible || !previousSize) measuredMemories.get(element).restore();
          let size = previousSize;
          if (gotoVisible || !size) {
            const states = [className.unpop, className.dismissed].filter((name) => element.classList.contains(name));
            if (gotoVisible) element.classList.remove(...states);
            const computed = root2.getComputedStyle(element);
            const height = parseFloat(computed.height);
            const width = parseFloat(computed.width);
            size = {
              height: Number.isFinite(height) ? height : element.scrollHeight,
              width: Number.isFinite(width) ? width : element.scrollWidth
            };
            if (gotoVisible) element.classList.add(...states);
          }
          const start = previousSize || (gotoVisible ? { height: 0, width: 0 } : size);
          if (controller.measuredHeight) {
            element.style.setProperty("max-height", `${Math.max(0, start.height)}px`, "important");
          }
          if (controller.measuredWidth) {
            element.style.setProperty("max-width", `${Math.max(0, start.width)}px`, "important");
          }
          if (!waitForPreparation)
            await aelluxJs2.waitLayout.read(
              controller.motionId,
              () => element.getBoundingClientRect()
            );
          return size;
        }
        async function presentTransition(element, gotoVisible, forceRepop = false, groupOperation = false, presentationOrder, closingDirection = DISMISS) {
          var _a, _b, _c, _d, _e;
          const controller = presentElements.get(element);
          if (!controller) return;
          const gesture = controller.gestureRequest;
          if (controller.direction === null)
            controller.direction = element.hidden ? DISMISS : POP;
          if (typeof gotoVisible === "undefined" || gotoVisible === null)
            gotoVisible = controller.direction === POP ? false : true;
          const reversing = closingDirection === UNPOP && gotoVisible === false;
          if (reversing && controller.direction === DISMISS && controller.transition) return false;
          const group = element.closest(groupSelector);
          const groupState = groups.get(group);
          const groupRevision = groupState == null ? void 0 : groupState.revision;
          if (!groupOperation && groupState && !groupState.accumulating && element !== group) {
            if (!element.id) {
              groupDiagnostic(group, "Present Group members must have an ID.");
              return false;
            }
            if (gotoVisible) return show(group, element.id);
            if (groups.get(group).selected === element) {
              if (!reversing) return show(group, "");
              if (group.getAttribute(attr.active) !== "") group.setAttribute(attr.active, "");
              return selectGroup(group, null, groupMembers(group), UNPOP);
            }
          }
          const hasCapacity = () => groupOperation || element === group || !gotoVisible || !(groupState == null ? void 0 : groupState.accumulating) || groupMemberActive(element, groupState) || activeGroupMembers(group, groupState).length < groupLimit(group, groupState);
          if (!hasCapacity()) return false;
          const newDirection = gotoVisible ? POP : closingDirection;
          if (controller.state !== POP && !controller.transition && !gotoVisible || newDirection === controller.direction && !forceRepop) {
            if (!controller.transition) syncAriaExpanded(element, controller);
            return;
          }
          let transition = null;
          try {
            const revision = controller.operationRevision;
            const allowEvent = groupOperation || aelluxJs2.dispatchFrom(
              element,
              `${BEFORE}${newDirection}`,
              { bubbles: true, cancelable: true }
            );
            if (!allowEvent || controller.operationRevision !== revision || presentElements.get(element) !== controller || !element.isConnected) return;
            if (!groupOperation && element !== group && (element.closest(groupSelector) !== group || groupState && (groups.get(group) !== groupState || groupState.revision !== groupRevision))) return;
            if (!hasCapacity()) return false;
            effects.cancelWithin(element);
            controller.operationRevision++;
            const impliedReverse = reversing && !controller.opening && !controller.transition;
            const reverseTracks = reversing && controller.motionEnabled && ((_a = aelluxJs2.currentPreference) == null ? void 0 : _a.call(aelluxJs2, "reduced-motion")) !== "reduced" ? gesture ? playback.full(element, controller, false) : playback.snapshot(element, controller, interpolatedProgress) : [];
            if (gotoVisible) controller.opening = null;
            if (gotoVisible) controller.presentationOrder = presentationOrder === void 0 ? ++presentationSequence : presentationOrder;
            if (!gotoVisible || !groupOperation) (_b = groups.get(group)) == null ? void 0 : _b.reservations.delete(element);
            if (forceRepop && (!element.hidden || controller.transition)) {
              controller.stop();
              element.hidden = true;
              openPresentElements.delete(element);
              syncAriaExpanded(element, controller);
              element.getBoundingClientRect();
            }
            const reusePreparation = !forceRepop && controller.motionEnabled && controller.transition !== null && controller.classList.contains(className.willChange);
            const waitForPreparation = !gesture && controller.motionEnabled && !reusePreparation && !reversing;
            let previousSize = null;
            const handoff = !gesture && !gotoVisible && controller.motionEnabled ? captureHandoff(element, controller) : null;
            if (handoff && (controller.measuredHeight || controller.measuredWidth)) {
              const computed = root2.getComputedStyle(element);
              previousSize = {
                height: parseFloat(computed.maxHeight),
                width: parseFloat(computed.maxWidth)
              };
            }
            if (!forceRepop) {
              controller.stop({ replacement: !!handoff || reusePreparation, transitionStart: true });
            }
            controller.handoff = handoff;
            controller.gestureRequest = null;
            controller.gesture = gesture;
            controller.direction = newDirection;
            if (reversing) controller.reverse = gesture ? playback.control(element, reverseTracks, false, interpolatedProgress, interpolatedUnpop) : playback.reverse(element, reverseTracks, interpolatedUnpop);
            controller.setTriggerExpanded(gotoVisible);
            if (!handoff) {
              setPhase(element, "pop", "0");
              setPhase(element, "dismiss", "0");
              element.style.setProperty("--ae-pop-progress", "0");
              element.style.setProperty("--ae-dismiss-progress", "0");
            }
            if (gotoVisible || reversing) element.style.setProperty("--ae-unpop-progress", "0");
            root2.getComputedStyle(element).getPropertyValue("--ae-pop-progress");
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
            if (gesture && root2.getComputedStyle(element).display === "none") {
              controller.gestureDisplay = aelluxJs2.persist.element.save(element, [], ["display"]);
              element.style.setProperty("display", controller.presentMotion ? "inline-grid" : "block", "important");
            }
            openPresentElements.add(element);
            let size = null;
            if (!reversing && (controller.measuredHeight || controller.measuredWidth))
              size = await prepareMeasuredSize(
                element,
                controller,
                gotoVisible,
                previousSize,
                waitForPreparation || !!gesture
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
            transition.className = gotoVisible ? className.popping : reversing ? className.unpopping : className.dismissing;
            const configurationDirection = reversing ? POP : newDirection;
            const duration = root2.getComputedStyle(element).getPropertyValue(`--ae-${configurationDirection}-duration`.toLowerCase()).trim();
            const timeMs = reversing ? controller.reverse.duration : getString2Time(duration);
            const applyDestination = () => {
              controller.classList.remove(
                className.unpop,
                className.dismissed,
                className.pop,
                className.popping,
                className.dismissing,
                className.unpopping
              );
              controller.classList.add(transition.className);
              if (interpolatedProgress) {
                element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
                element.style.setProperty("--ae-dismiss-progress", "clamp(0, var(--ae-present-dismiss-phase), 1)");
              }
              setPhase(element, "pop", gotoVisible ? "1" : "0");
              setPhase(element, "dismiss", gotoVisible ? "0" : "1");
              if (size) {
                if (controller.measuredHeight) {
                  element.style.setProperty("max-height", `${gotoVisible ? size.height : 0}px`, "important");
                }
                if (controller.measuredWidth) {
                  element.style.setProperty("max-width", `${gotoVisible ? size.width : 0}px`, "important");
                }
              }
            };
            const activateTransition = () => {
              if (controller.transition !== transition) return;
              if (gesture) {
                let tracks = reverseTracks;
                if (!reversing) {
                  const opening = controller.opening;
                  controller.opening = playback.capture(element, controller, applyDestination, size, gotoVisible && interpolatedProgress, gotoVisible ? "pop" : "dismiss");
                  tracks = playback.full(element, controller, false);
                  controller.opening = gotoVisible ? { saved: tracks, completed: true } : opening;
                  controller.reverse = playback.control(element, tracks, gesture.dismiss, interpolatedProgress, interpolatedUnpop);
                }
                controller.classList.remove(className.pop, className.unpop, className.dismissed, className.popping, className.unpopping, className.dismissing);
                controller.classList.add(transition.className);
                controller.reverse.apply();
                let distance = 0;
                const transform = tracks == null ? void 0 : tracks.find((track) => track.property === "transform");
                if (transform) try {
                  const frames = transform.frames;
                  const from = new root2.DOMMatrix(frames[0].transform), to = new root2.DOMMatrix(frames[frames.length - 1].transform);
                  distance = Math.abs(gesture.axis === "x" ? to.m41 - from.m41 : to.m42 - from.m42);
                } catch (_) {
                }
                let previous = gesture.progress;
                gesture.attach({
                  seek(value) {
                    if (controller.transition !== transition) return;
                    controller.reverse.seek(value);
                    if (!gesture.dismiss && value !== previous) {
                      transition.className = value > previous ? className.popping : className.unpopping;
                      controller.classList.remove(className.popping, className.unpopping);
                      controller.classList.add(transition.className);
                    }
                    previous = value;
                    const popValue = gesture.dismiss ? 1 - value : value;
                    if (!interpolatedProgress) {
                      setPhase(element, "pop", String(popValue));
                      setPhase(element, "dismiss", String(gesture.dismiss ? value : 1 - value));
                      element.style.setProperty("--ae-pop-progress", String(popValue));
                      element.style.setProperty("--ae-dismiss-progress", String(gesture.dismiss ? value : 1 - value));
                    }
                    if (!interpolatedUnpop) element.style.setProperty("--ae-unpop-progress", String(1 - popValue));
                  },
                  playTo(target) {
                    if (controller.transition !== transition) return Promise.reject();
                    if (!gesture.dismiss) {
                      transition.className = target ? className.popping : className.unpopping;
                      controller.classList.remove(className.popping, className.unpopping);
                      controller.classList.add(transition.className);
                    }
                    return controller.reverse.playTo(target);
                  }
                }, distance);
                return;
              }
              if (reversing) {
                handoff == null ? void 0 : handoff.memory.restore();
                if (interpolatedProgress)
                  element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
                controller.classList.remove(className.pop, className.popping, className.dismissing);
                controller.classList.add(className.unpopping);
                controller.reverse.apply();
                return;
              }
              if (handoff) {
                handoff.memory.restore();
                element.style.setProperty("transition-property", "none", "important");
                applyDestination();
                const computed = root2.getComputedStyle(element);
                const tracks = handoff.values.filter(([property]) => property.startsWith("grid-template-") || property === "height" || property === "width").map(([property]) => [property, computed.getPropertyValue(property)]);
                handoff.freeze();
                handoff.transition.restore();
                const properties = root2.getComputedStyle(element).transitionProperty;
                element.getBoundingClientRect();
                handoff.memory.restore();
                applyDestination();
                if (tracks.length) element.style.setProperty("transition-property", `${properties}, height, width`, "important");
                for (const [property, value] of tracks) element.style.setProperty(property, value, "important");
              } else if (gotoVisible) {
                controller.opening = playback.capture(element, controller, applyDestination, size, interpolatedProgress);
              } else applyDestination();
            };
            const advancedEase = root2.getComputedStyle(element).getPropertyValue(`--ae-${configurationDirection}-aellux-ease`.toLowerCase()).trim() || void 0;
            const motionOptions = {
              extension: extensionName,
              id: controller.motionId,
              ownedOnly: reversing,
              apply: activateTransition,
              easing: reversing && !impliedReverse ? void 0 : advancedEase,
              nativeDuration: timeMs,
              maxFPS: aelluxJs2.layoutMaxFPS ? aelluxJs2.layoutMaxFPS(element) : void 0,
              abort: () => controller.transition !== transition || !element.isConnected
            };
            const completed = gesture ? (activateTransition(), gesture.settled) : aelluxJs2.motion ? aelluxJs2.motion.run(element, motionOptions) : legacyMotionRun(motionOptions, transition);
            aelluxJs2.dispatchFrom(element, "Layout", {
              detail: {
                origin: `present.${newDirection}`.toLowerCase(),
                durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
              },
              bubbles: true
            });
            if (controller.transition !== transition || !element.isConnected) return;
            const autoDismissValue = gotoVisible && element.getAttribute(attr.autoDismiss);
            if (autoDismissValue) {
              const duration2 = getString2Time(autoDismissValue);
              if (Number.isFinite(duration2) && duration2 >= 0) {
                emitAutoDismissProgress(element, 0, duration2);
              }
            }
            if (controller.transition !== transition || !element.isConnected) return;
            aelluxJs2.dispatchFrom(element, gotoVisible ? "Popping" : reversing ? "Unpopping" : "Dismissing", { bubbles: true });
            const motionResult = await Promise.race([completed, interrupted]);
            if (controller.transition !== transition || gesture && !motionResult || !gesture && motionResult && motionResult.status !== "completed") return;
            if (gesture) {
              const finalVisible = motionResult === POP;
              controller.direction = motionResult;
              controller.setTriggerExpanded(finalVisible);
              finishTransition(element, controller, transition, finalVisible);
              if (groupState && groups.get(group) === groupState && !groupState.accumulating) {
                const selected2 = finalVisible ? element : groupState.selected === element ? null : groupState.selected;
                groupState.selected = selected2;
                const active = (selected2 == null ? void 0 : selected2.id) || "";
                if (group.getAttribute(attr.active) !== active) group.setAttribute(attr.active, active);
                publishGroup(group, groupState, selected2);
              }
              controller.gesture = null;
              aelluxJs2.dispatchFrom(element, motionResult, { bubbles: true });
              if (finalVisible) autoDismissSchedule(element, controller);
              return;
            }
            if (gotoVisible) playback.complete(element, controller, interpolatedProgress);
            finishTransition(element, controller, transition, gotoVisible);
            if (gotoVisible && !element.hidden) {
              autoDismissSchedule(element, controller);
              controller.classList.add(className.pop);
              aelluxJs2.dispatchFrom(element, POP, { bubbles: true });
            }
            if (!gotoVisible && controller.state !== POP) {
              aelluxJs2.dispatchFrom(element, newDirection, { bubbles: true });
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
            switch (error && error.code) {
              case aelluxJs2.diagnostics.WARN_INTERRUPTION.code:
                if (transition && transition.cancelled) break;
                aelluxJs2.diagnostics.warn(
                  aelluxJs2.diagnostics.WARN_INTERRUPTION,
                  {
                    cause: error,
                    extension: extensionName,
                    element,
                    replacement: transition && transition.replacement === true
                  }
                );
                break;
              default:
                aelluxJs2.diagnostics.error(
                  aelluxJs2.diagnostics.ERROR_EXTENSION_TRANSITION,
                  { cause: error, extension: extensionName, element }
                );
                break;
            }
          } finally {
            if (transition && controller.transition === transition) {
              (_c = controller.gesture) == null ? void 0 : _c.abort();
              controller.gesture = null;
              (_d = controller.reverse) == null ? void 0 : _d.cleanup();
              controller.reverse = null;
              (_e = controller.gestureDisplay) == null ? void 0 : _e.restore();
              controller.gestureDisplay = null;
              restoreHandoff(controller);
              restoreMeasuredStyles(element, controller);
              controller.transition = null;
              controller.classList.remove(className.willChange);
              effects.settled(transition);
            }
          }
        }
        function legacyMotionRun(options, transition) {
          options.apply();
          return new Promise((resolve) => {
            transition.timeout = setTimeout(() => {
              transition.timeout = null;
              resolve({ id: options.id, status: "completed", mode: "native" });
            }, Math.max(0, Number(options.nativeDuration) || 0));
          });
        }
        function finishTransition(element, controller, transition, gotoVisible) {
          var _a, _b;
          restoreHandoff(controller);
          const focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
          controller.classList.remove(className.popping, className.unpopping, className.dismissing);
          establishState(element, controller, gotoVisible ? POP : controller.direction);
          element.hidden = !gotoVisible && controller.legacyHidden;
          (_a = controller.reverse) == null ? void 0 : _a.cleanup();
          controller.reverse = null;
          (_b = controller.gestureDisplay) == null ? void 0 : _b.restore();
          controller.gestureDisplay = null;
          restoreMeasuredStyles(element, controller);
          setProgress(element, gotoVisible);
          syncAriaExpanded(element, controller);
          refreshExpandedStates();
          gestures.inspect(element);
          if (!gotoVisible) openPresentElements.delete(element);
          else openPresentElements.add(element);
          if (focused && !controller.expanded) {
            if (document.activeElement === focused) focused.blur();
            if (document.activeElement !== focused) aelluxJs2.dispatch(`${controller.direction}FocusLost`, {
              detail: { element, focused }
            });
          }
          transition.timeout = null;
          transition.completed = true;
        }
        function establishState(element, controller, state) {
          controller.state = state;
          controller.classList.toggle(className.pop, state === POP);
          controller.classList.toggle(className.unpop, state === UNPOP);
          controller.classList.toggle(className.dismissed, state === DISMISS);
        }
        function autoDismissSchedule(element, controller) {
          if (!controller) return;
          cancelAutoDismiss(controller);
          const autoDismissValue = element.getAttribute(attr.autoDismiss);
          if (controller.state !== POP || controller.transition && !controller.classList.contains(className.pop) || !element.isConnected || !autoDismissValue) return;
          const duration = getString2Time(autoDismissValue);
          if (!Number.isFinite(duration) || duration < 0) return;
          const countdown = { start: root2.performance.now(), duration, frame: null, last: 0 };
          controller.autoCountdown = countdown;
          const valid = () => controller.autoCountdown === countdown && presentElements.get(element) === controller && element.isConnected;
          const emit = (completed, initial = false) => {
            const elapsedMs = completed ? duration : initial ? 0 : Math.min(duration, Math.max(0, root2.performance.now() - countdown.start));
            emitAutoDismissProgress(element, elapsedMs, duration, completed);
          };
          const tick = () => {
            var _a;
            if (!valid()) {
              if (controller.autoCountdown === countdown) cancelAutoDismiss(controller);
              return;
            }
            const now = root2.performance.now();
            const fps = ((_a = aelluxJs2.layoutMaxFPS) == null ? void 0 : _a.call(aelluxJs2, element)) || aelluxJs2.options.cssMotionPropertyMaxFPS || 55;
            if (now - countdown.last >= 1e3 / fps) {
              countdown.last = now;
              emit(false);
            }
            if (valid()) countdown.frame = root2.requestAnimationFrame(tick);
          };
          controller.autoDismissTimeout = setTimeout(() => {
            if (!valid()) {
              if (controller.autoCountdown === countdown) cancelAutoDismiss(controller);
              return;
            }
            if (countdown.frame !== null) root2.cancelAnimationFrame(countdown.frame);
            countdown.frame = null;
            controller.autoDismissTimeout = null;
            emit(true);
            if (!valid()) return;
            controller.autoCountdown = null;
            dismiss(element);
          }, duration);
          emit(false, true);
          if (valid()) countdown.frame = root2.requestAnimationFrame(tick);
        }
        function emitAutoDismissProgress(element, elapsedMs, duration, completed = false) {
          aelluxJs2.dispatchFrom(element, "Progress", {
            bubbles: false,
            cancelable: false,
            detail: {
              value: completed ? 1 : duration ? elapsedMs / duration : 0,
              max: 1,
              status: completed ? "completed" : "running",
              elapsedMs,
              durationMs: duration,
              remainingMs: Math.max(0, duration - elapsedMs)
            }
          });
        }
        function cancelAutoDismiss(controller) {
          if (controller.autoDismissTimeout !== null) clearTimeout(controller.autoDismissTimeout);
          const countdown = controller.autoCountdown;
          if (countdown && countdown.frame !== null) root2.cancelAnimationFrame(countdown.frame);
          controller.autoDismissTimeout = null;
          controller.autoCountdown = null;
        }
        function clickAutoDismiss(eventTarget, currentExceptions) {
          for (const pContainer of openPresentElements) {
            if (pContainer.hidden === true || currentExceptions.some((e) => pContainer.contains(e))) continue;
            const mode = (pContainer.getAttribute(attr.dismissOnClick) || "outside").trim().toLowerCase();
            if (mode === "false" || mode === "none") continue;
            const inside = pContainer.contains(eventTarget);
            if (inside === (mode === "inside" || mode === "in")) dismiss(pContainer);
          }
        }
        function refreshChangedTrigger(button) {
          if (!triggerElementsSet.has(button)) return;
          const value = button.getAttribute(attr.target);
          if (value !== indexedTriggerValues.get(button)) refreshTriggerTargets(button);
        }
        function OnClick(event) {
          var _a, _b;
          const target = activationTarget(event);
          if (!target) return;
          let matched;
          for (const pending of pendingTaps) {
            const pointerId = event.pointerId;
            const compatibilityClick = event.pointerType === "mouse" && ["touch", "pen"].includes((_a = pending.event.detail) == null ? void 0 : _a.pointerType);
            if (!compatibilityClick && typeof pointerId === "number" && typeof ((_b = pending.event.detail) == null ? void 0 : _b.pointerId) === "number" && pointerId !== pending.event.detail.pointerId) continue;
            if (pending.target === target || pending.target.contains(target) || target.contains(pending.target))
              matched = pending;
          }
          if (matched) cancelPendingTap(matched);
          activate(event, target);
        }
        function activationTarget(event) {
          const path = event.composedPath ? event.composedPath() : [];
          const target = path[0] || event.target;
          return (target == null ? void 0 : target.closest) ? target : null;
        }
        function onTap(event) {
          const target = activationTarget(event);
          if (!target) return;
          const control = target.closest(`[${attr.trigger}]`);
          if (control) refreshChangedTrigger(control);
          const pending = {
            event,
            target,
            hoverSuppressed: control && suppressHoverClick(control, event),
            present: triggerTargets.get(control),
            input: aelluxJs2.comm.request("input.mount-token", { element: target }).value,
            timer: null
          };
          pendingTaps.add(pending);
          pending.timer = setTimeout(() => {
            pendingTaps.delete(pending);
            if (!target.isConnected || pending.input && aelluxJs2.comm.request("input.mount-token", { element: target }).value !== pending.input) return;
            activate(event, target, pending.hoverSuppressed);
          }, TAP_CLICK_WAIT_TIME);
        }
        function cancelPendingTap(pending) {
          clearTimeout(pending.timer);
          pendingTaps.delete(pending);
        }
        function cancelElementTaps(element) {
          for (const pending of pendingTaps) {
            if (element.contains(pending.target) || pending.present === element)
              cancelPendingTap(pending);
          }
        }
        function activate(event, eventTarget, hoverSuppressed) {
          const container = eventTarget.closest(presentSelector);
          const exceptions = [];
          var button;
          button = eventTarget.closest(`[${attr.trigger}]`);
          if (button) {
            refreshChangedTrigger(button);
            const triggerAttr = button.getAttribute(attr.trigger);
            const targetSelector = button.getAttribute(attr.target);
            if (targetSelector) {
              const target = targetById(targetSelector);
              diagnoseTarget(button, target, attr.target, targetSelector);
              if (target) {
                exceptions.push(target);
                if (!(hoverSuppressed != null ? hoverSuppressed : suppressHoverClick(button, event))) trigger(target, triggerAttr, button.getAttribute(attr.effect));
              }
            } else if (container) {
              exceptions.push(container);
              if (!(hoverSuppressed != null ? hoverSuppressed : suppressHoverClick(button, event))) trigger(container, triggerAttr, button.getAttribute(attr.effect));
            } else {
              aelluxJs2.diagnostics.error(
                aelluxJs2.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
                { extension: extensionName, element: button, action: triggerAttr === "dismiss" ? "dismiss" : "trigger" }
              );
            }
          }
          clickAutoDismiss(eventTarget, exceptions);
        }
        function diagnoseTarget(element, target, attribute, value) {
          if (!targetIdFor(value)) return;
          if (target && target.hasAttribute(attr.present)) return;
          aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_CONFIGURATION_TARGET, {
            extension: extensionName,
            element,
            attribute,
            value,
            reason: target ? "Target is not a Present container." : "Target element was not found.",
            suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
          });
        }
        function syncAriaExpanded(element, controller) {
          let visible = element.isConnected;
          const visibility = root2.getComputedStyle(element).visibility;
          if (visibility === "hidden" || visibility === "collapse") visible = false;
          for (let current = element; visible && current; current = current.parentElement) {
            const style = root2.getComputedStyle(current);
            if (style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) visible = false;
          }
          if (controller.expanded !== visible) controller.setAriaExpanded(String(visible));
        }
        function refreshExpandedStates() {
          for (const [element, controller] of presentElements) {
            if (!controller.transition) syncAriaExpanded(element, controller);
          }
        }
        function setProgress(element, visible) {
          setPhase(element, "pop", visible ? "1" : "0");
          setPhase(element, "dismiss", visible ? "0" : "1");
          element.style.setProperty("--ae-pop-progress", visible ? "1" : "0");
          element.style.setProperty("--ae-dismiss-progress", visible ? "0" : "1");
          element.style.setProperty("--ae-unpop-progress", visible ? "0" : "1");
        }
        function setPhase(element, direction, value) {
          element.style.setProperty(`--ae-present-${direction}-phase`, value);
          if (!interpolatedProgress) element.style.setProperty(`--ae-${direction}-progress`, value);
        }
        function groupMembers(group, includeUnidentified = false) {
          return [...presentElements.keys()].filter((element) => element.isConnected && element !== group && (includeUnidentified || element.id) && element.closest(groupSelector) === group);
        }
        function groupLimit(group, state) {
          const value = group.getAttribute(attr.group);
          if (state.limitValue === value) return state.limit;
          state.limitValue = value;
          const text = (value || "").trim();
          const limit = text === "" ? 1 : Number(text);
          const valid = text === "" || /^\d+$/.test(text) && Number.isSafeInteger(limit) && limit > 0;
          state.limit = valid ? limit : 1;
          if (!valid) aelluxJs2.diagnostics.warn(aelluxJs2.diagnostics.WARN_CONFIGURATION_VALUE, {
            extension: extensionName,
            element: group,
            attribute: attr.group,
            value,
            reason: "Present Group capacity must be a positive integer.",
            suggestion: "Use a positive integer, or leave the attribute empty for a capacity of 1."
          });
          return state.limit;
        }
        function groupMemberActive(member, state) {
          return state.reservations.has(member) || isPresented(member);
        }
        function isPresented(element) {
          const controller = presentElements.get(element);
          return controller && (controller.transition ? controller.direction === POP : controller.state === POP);
        }
        function activeGroupMembers(group, state) {
          return groupMembers(group, true).filter((member) => groupMemberActive(member, state));
        }
        function mountGroup(group) {
          if (groups.has(group)) return;
          const visible = groupMembers(group).filter((member) => {
            var _a;
            return ((_a = presentElements.get(member)) == null ? void 0 : _a.state) === POP;
          });
          groups.set(group, {
            selected: visible.length === 1 ? visible[0] : null,
            accumulating: false,
            reservations: /* @__PURE__ */ new Map(),
            revision: 0,
            pending: Promise.resolve(true),
            jobs: /* @__PURE__ */ new Map(),
            memory: aelluxJs2.persist.element.save(group, [attr.active])
          });
          groupLimit(group, groups.get(group));
          if (!groupObserver && typeof root2.MutationObserver === "function") {
            groupObserver = new root2.MutationObserver((records) => {
              if (records.some((record) => record.type === "childList" || record.attributeName !== "class" || groups.has(record.target))) queueGroups();
            });
            groupObserver.observe(document, {
              subtree: true,
              childList: true,
              attributes: true,
              attributeFilter: ["class", "id", attr.active, attr.when, attr.group]
            });
          }
          queueGroups();
        }
        function unmountGroup(group) {
          const state = groups.get(group);
          if (!state) return;
          state.revision++;
          groups.delete(group);
          state.jobs.clear();
          state.reservations.clear();
          publishGroup(group, state, null);
          for (const member of groupMembers(group)) {
            const controller = presentElements.get(member);
            if (controller.transition) {
              const visible = controller.direction === POP;
              controller.stop();
              member.hidden = !visible && controller.legacyHidden;
              establishState(member, controller, visible ? POP : controller.direction);
              controller.setTriggerExpanded(visible);
              setProgress(member, visible);
              syncAriaExpanded(member, controller);
              if (!visible) openPresentElements.delete(member);
            }
          }
          state.memory.restore();
          if (!groups.size && groupObserver) {
            groupObserver.disconnect();
            groupObserver = null;
          }
        }
        function queueGroups() {
          if (groupsQueued || !groups.size) return;
          groupsQueued = true;
          Promise.resolve().then(() => {
            groupsQueued = false;
            groups.forEach((state, group) => {
              reconcileGroup(group);
              if (groups.get(group) === state) publishGroup(group, state, state.selected);
            });
          });
        }
        function groupDiagnostic(group, reason) {
          aelluxJs2.diagnostics.warn(
            aelluxJs2.diagnostics.WARN_PRESENT_GROUP_SELECTION,
            {
              extension: extensionName,
              element: group,
              attribute: attr.active,
              value: group.getAttribute(attr.active),
              reason,
              suggestion: "Use unique native IDs on Present members of this group; select one ID or one matching condition."
            }
          );
        }
        function reconcileGroup(group, exclusive = false) {
          if (!group.isConnected || !group.hasAttribute(attr.group)) return;
          const members = groupMembers(group);
          const state = groups.get(group);
          groupLimit(group, state);
          if (state.accumulating) {
            if (!exclusive && state.accumulationInputs === selectionInputs(group)) return;
          }
          if (!members.includes(state.selected)) state.selected = null;
          let matches;
          if (group.hasAttribute(attr.active)) {
            const id = group.getAttribute(attr.active);
            matches = id === "" ? [] : members.filter((member) => member.id === id);
            if (id && matches.length !== 1) {
              groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
              return;
            }
          } else {
            matches = members.filter((member) => {
              const token = member.getAttribute(attr.when);
              return token && !/\s/.test(token) && group.classList.contains(token);
            });
            if (!matches.length) {
              const visible = members.filter(isPresented);
              if (visible.length > 1) groupDiagnostic(group, "Multiple initially visible members.");
              else if (!state.selected) state.selected = visible[0] || null;
              return;
            }
          }
          if (matches.length > 1) {
            groupDiagnostic(group, "Multiple members match the container classes.");
            return;
          }
          return selectGroup(group, matches[0] || null, members);
        }
        function show(group, id) {
          const state = groups.get(group);
          if (!state || typeof id !== "string") return Promise.resolve(false);
          const matches = groupMembers(group).filter((member) => member.id === id);
          if (id && matches.length !== 1) {
            groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
            return Promise.resolve(false);
          }
          if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
          const result = reconcileGroup(group, true);
          return Promise.resolve(result === void 0 ? state.pending : result);
        }
        function selectionInputs(group) {
          return JSON.stringify([group.getAttribute(attr.active), groupMembers(group).filter((member) => {
            const token = member.getAttribute(attr.when);
            return token && !/\s/.test(token) && group.classList.contains(token);
          }).map((member) => member.id).sort()]);
        }
        function popNext(group, prepare) {
          const state = groups.get(group);
          if (!state || !group.isConnected || !group.hasAttribute(attr.group)) return Promise.resolve(null);
          const members = Array.from(group.children).filter((member2) => member2 !== group && member2.hasAttribute(attr.present) && presentElements.has(member2) && member2.closest(groupSelector) === group);
          const limit = groupLimit(group, state);
          const active = activeGroupMembers(group, state);
          const inactive = members.filter((member2) => !groupMemberActive(member2, state));
          const closed = inactive.filter((member2) => {
            var _a;
            return ((_a = presentElements.get(member2)) == null ? void 0 : _a.state) !== POP;
          });
          const available = closed.length ? closed : inactive;
          const candidates = active.length < limit && available.length ? available : members.filter((member2) => active.includes(member2)).sort((left, right) => {
            const order = (member2) => {
              var _a;
              return ((_a = state.reservations.get(member2)) == null ? void 0 : _a.order) || presentElements.get(member2).presentationOrder;
            };
            return order(right) - order(left);
          });
          const member = candidates[candidates.length - 1];
          if (!member) return Promise.resolve(null);
          const entering = !state.accumulating;
          if (entering) {
            state.revision++;
            state.jobs.clear();
            state.accumulating = true;
            state.accumulationInputs = selectionInputs(group);
            state.selected = null;
          }
          const controller = presentElements.get(member);
          const revision = state.revision;
          const capacity = group.getAttribute(attr.group);
          const inputs = selectionInputs(group);
          const previousReservation = state.reservations.get(member);
          const reservation = { revision: controller.operationRevision, order: ++presentationSequence };
          state.reservations.set(member, reservation);
          group.insertBefore(member, members[0]);
          const valid = (preflight = false) => groups.get(group) === state && state.revision === revision && state.accumulating && state.reservations.get(member) === reservation && presentElements.get(member) === controller && controller.operationRevision === reservation.revision && (!preflight || group.getAttribute(attr.group) === capacity && selectionInputs(group) === inputs) && member.isConnected && member.parentElement === group && member.closest(groupSelector) === group;
          const release = (restore = false) => {
            if (state.reservations.get(member) !== reservation) return;
            if (restore && previousReservation && groups.get(group) === state && state.revision === revision && state.accumulating && presentElements.get(member) === controller && previousReservation.revision === controller.operationRevision && member.isConnected && member.closest(groupSelector) === group) {
              state.reservations.set(member, previousReservation);
            } else state.reservations.delete(member);
          };
          let job;
          try {
            if (entering) publishGroup(group, state, null);
            if (!valid(true)) {
              release(true);
              return Promise.resolve(null);
            }
            if (typeof prepare === "function") prepare(member);
            if (!valid(true) || !aelluxJs2.dispatchFrom(member, "BeforePop", { bubbles: true, cancelable: true }) || !valid(true)) {
              release(true);
              return Promise.resolve(null);
            }
            reservation.revision++;
            job = presentTransition(member, true, true, true, reservation.order);
          } catch (error) {
            release(true);
            return Promise.reject(error);
          }
          return job.then(() => valid() && !member.hidden && presentElements.get(member).direction === POP ? member : null).finally(() => release());
        }
        function selected(group) {
          const state = groups.get(group);
          const member = state && state.selected;
          return member && member !== group && presentElements.has(member) && member.isConnected && member.id && member.closest(groupSelector) === group ? member : null;
        }
        function publishGroup(group, state, current) {
          if (state.announced === current) return;
          const previous = state.announced || null;
          state.announced = current;
          aelluxJs2.dispatchFrom(group, "PresentGroupChange", {
            bubbles: true,
            detail: { group, previous, current, key: current && current.id }
          });
        }
        function selectGroup(group, selected2, members, closingDirection = DISMISS) {
          var _a;
          const state = groups.get(group);
          const changes = members.filter((member) => member === selected2 ? !isPresented(member) : isPresented(member));
          if (state.selected === selected2 && !changes.length) {
            state.accumulating = false;
            state.reservations.clear();
            return state.pending;
          }
          const revision = ++state.revision;
          const active = group.getAttribute(attr.active);
          const classes = group.getAttribute("class");
          const ids = members.map((member) => member.id);
          const conditions = members.map((member) => member.getAttribute(attr.when));
          const valid = () => groups.get(group) === state && state.revision === revision && group.isConnected && group.hasAttribute(attr.group) && group.getAttribute(attr.active) === active && group.getAttribute("class") === classes && groupMembers(group).length === members.length && members.every((member, index) => presentElements.has(member) && member.isConnected && member.closest(groupSelector) === group && member.id === ids[index] && member.getAttribute(attr.when) === conditions[index]);
          for (const member of changes) {
            const allowed = aelluxJs2.dispatchFrom(
              member,
              member === selected2 ? "BeforePop" : `${BEFORE}${closingDirection}`,
              { bubbles: true, cancelable: true }
            );
            if (!valid()) {
              queueGroups();
              return false;
            }
            if (!allowed) {
              if (state.accumulating) {
                state.accumulationInputs = selectionInputs(group);
                return false;
              }
              if (state.revision === revision) {
                const id = ((_a = state.selected) == null ? void 0 : _a.id) || "";
                if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
              }
              return false;
            }
          }
          state.accumulating = false;
          state.reservations.clear();
          state.selected = selected2;
          let complete;
          const pending = new Promise((resolve) => {
            complete = resolve;
          });
          state.pending = pending;
          for (const member of changes) {
            const job = presentTransition(member, member === selected2, false, true, void 0, closingDirection);
            if (groups.get(group) !== state || state.revision !== revision) {
              complete(false);
              return pending;
            }
            state.jobs.set(member, job);
            job.then(() => {
              if (state.jobs.get(member) === job) state.jobs.delete(member);
            });
          }
          publishGroup(group, state, selected2);
          Promise.all(members.map((member) => state.jobs.get(member))).then(() => {
            const current = groupMembers(group);
            complete(groups.get(group) === state && state.revision === revision && (!selected2 || current.includes(selected2)) && current.every((member) => {
              var _a2, _b;
              return member === selected2 ? ((_a2 = presentElements.get(member)) == null ? void 0 : _a2.state) === POP : ((_b = presentElements.get(member)) == null ? void 0 : _b.state) !== POP;
            }));
          });
          return pending;
        }
        function cancelHoverClose(target) {
          clearTimeout(hoverTimers.get(target));
          hoverTimers.delete(target);
        }
        function inHoverRegion(target, node) {
          if (!node || !node.nodeType) return false;
          if (target.contains(node)) return true;
          for (const button of triggerElementsSet) {
            if (button.getAttribute(attr.triggerOn) === "hover" && triggerTargets.get(button) === target && button.contains(node)) return true;
          }
          return false;
        }
        function suppressHoverClick(button, event) {
          var _a;
          const pointerType = event.pointerType || ((_a = event.detail) == null ? void 0 : _a.pointerType);
          const pointerActivation = typeof event.detail === "number" ? event.detail > 0 : !!pointerType;
          return button.getAttribute(attr.triggerOn) === "hover" && pointerActivation && pointerType !== "touch" && hoveredTriggers.has(button);
        }
        function onHover(event) {
          var _a;
          if (event.pointerType === "touch" || !((_a = event.target) == null ? void 0 : _a.closest)) return;
          const entering = event.type === "pointerover";
          const button = event.target.closest(`[${attr.trigger}][${attr.triggerOn}="hover"]`);
          if (button && triggerElementsSet.has(button) && !button.contains(event.relatedTarget)) {
            refreshChangedTrigger(button);
            const target = triggerTargets.get(button);
            if (target && presentElements.has(target)) {
              if (entering) {
                cancelHoverClose(target);
                hoveredTriggers.add(button);
                const action = button.getAttribute(attr.trigger);
                if (action === "pop") toggle(target, true);
                else trigger(target, action, button.getAttribute(attr.effect));
              } else hoveredTriggers.delete(button);
            }
          }
          for (const target of openPresentElements) {
            if (!inHoverRegion(target, event.target)) continue;
            if (entering || inHoverRegion(target, event.relatedTarget)) cancelHoverClose(target);
            else if ([...triggerElementsSet].some((control) => triggerTargets.get(control) === target && control.getAttribute(attr.triggerOn) === "hover" && !["dismiss", "unpop", "effect"].includes(control.getAttribute(attr.trigger)))) {
              cancelHoverClose(target);
              hoverTimers.set(target, setTimeout(() => {
                hoverTimers.delete(target);
                if (presentElements.has(target) && target.isConnected && !inHoverRegion(target, document.activeElement)) dismiss(target);
              }, 120));
            }
          }
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
    const MIN_FPS = 5;
    const FPS_STEP = 15;
    const PRESSURE_WINDOW_MS = 3e3;
    const PRESSURE_MIN_DURATION_MS = 2e3;
    const PRESSURE_MIN_SAMPLES = 24;
    const PRESSURE_MIN_SLOW_SAMPLES = 12;
    const PRESSURE_SLOW_RATIO = 0.35;
    const BASE_RECOVERY_DELAY = 1e3;
    const MAX_RECOVERY_DELAY = 8e3;
    const queues = { read: [], update: [] };
    const groups = /* @__PURE__ */ new Map();
    const tasks = /* @__PURE__ */ new Set();
    const visualFPSLimits = /* @__PURE__ */ new Map();
    const sequenceStarts = /* @__PURE__ */ new Map();
    let frameRequest = null;
    let phase = "idle";
    let waitingForVisibility = false;
    let idleSince = null;
    let nativeFPS = null;
    let limitFPS = null;
    let initialDeltas = [];
    let lastFrameTime = null;
    let frameCredit = 0;
    let samples = [];
    let lastAdjustment = -Infinity;
    let stableSince = null;
    let recoveryDelay = BASE_RECOVERY_DELAY;
    let trialLimit = null;
    const now = () => performance.now();
    const hidden = () => typeof document !== "undefined" && document.hidden;
    const hasWork = () => queues.read.length > 0 || queues.update.length > 0;
    function visualFPSLimit() {
      let result = Infinity;
      for (const value of visualFPSLimits.values()) result = Math.min(result, value);
      return result;
    }
    function setVisualFPSLimit(owner, value) {
      validId(owner);
      if (value === void 0 || value === null) visualFPSLimits.delete(owner);
      else {
        if (!Number.isFinite(value) || value <= 0) throw new RangeError("visual FPS must be positive");
        visualFPSLimits.set(owner, value);
      }
      if (hasWork()) scheduleFrame();
    }
    function publishLimit() {
      if (typeof document === "undefined" || !document.documentElement) return;
      const value = nativeFPS !== null && limitFPS !== null && limitFPS < nativeFPS ? String(limitFPS) : null;
      if (value === null) {
        if (document.documentElement.hasAttribute("data-ae-fps"))
          document.documentElement.removeAttribute("data-ae-fps");
      } else if (document.documentElement.getAttribute("data-ae-fps") !== value) {
        document.documentElement.setAttribute("data-ae-fps", value);
      }
    }
    function resetMeasurements(resetLimit) {
      lastFrameTime = null;
      frameCredit = 0;
      samples = [];
      stableSince = null;
      initialDeltas = [];
      if (resetLimit) {
        nativeFPS = null;
        limitFPS = null;
        lastAdjustment = -Infinity;
      }
      publishLimit();
      trialLimit = null;
      recoveryDelay = BASE_RECOVERY_DELAY;
    }
    function onVisible() {
      if (hidden()) return;
      document.removeEventListener("visibilitychange", onVisible);
      waitingForVisibility = false;
      resetMeasurements(true);
      scheduleFrame();
    }
    function scheduleFrame() {
      if (frameRequest !== null || phase !== "idle" || !hasWork()) return;
      if (hidden()) {
        if (!waitingForVisibility) {
          document.addEventListener("visibilitychange", onVisible);
          waitingForVisibility = true;
        }
        return;
      }
      if (idleSince !== null && now() - idleSince > 250) resumeAfterIdle(now());
      idleSince = null;
      frameRequest = requestAnimationFrame(flushFrame);
    }
    function stopFrameIfIdle() {
      if (hasWork()) return;
      if (frameRequest !== null) cancelAnimationFrame(frameRequest);
      frameRequest = null;
      if (waitingForVisibility) document.removeEventListener("visibilitychange", onVisible);
      waitingForVisibility = false;
      if (phase === "idle") idleSince = now();
    }
    function observeFrame(time) {
      const previous = lastFrameTime;
      lastFrameTime = time;
      if (previous === null) return true;
      const delta = time - previous;
      if (delta <= 0 || delta > 250) {
        frameCredit = 0;
        samples = [];
        stableSince = null;
        return true;
      }
      if (nativeFPS === null) {
        initialDeltas.push(delta);
        if (initialDeltas.length >= 8) {
          const ordered = initialDeltas.slice().sort((a, b) => a - b);
          nativeFPS = Math.max(MIN_FPS, Math.round(1e3 / ordered[4]));
          limitFPS = nativeFPS;
          initialDeltas = [];
        }
      } else {
        const expected = 1e3 / Math.max(MIN_FPS, limitFPS);
        const slow = delta > expected * 1.23;
        samples.push({ time, slow, delay: delta, cost: 0 });
        while (samples.length && time - samples[0].time > PRESSURE_WINDOW_MS) samples.shift();
        adjustLimit(time);
      }
      const effectiveFPS = Math.min(limitFPS === null ? Infinity : limitFPS, visualFPSLimit());
      if (effectiveFPS === Infinity || nativeFPS !== null && effectiveFPS >= nativeFPS) return true;
      const period = 1e3 / effectiveFPS;
      frameCredit += delta;
      if (frameCredit + 1e-3 < period) return false;
      frameCredit = Math.min(period, frameCredit - period);
      return true;
    }
    function adjustLimit(time) {
      if (samples.length < PRESSURE_MIN_SAMPLES || time - samples[0].time < PRESSURE_MIN_DURATION_MS) return;
      const slowCount = samples.reduce((n, item) => n + (item.slow ? 1 : 0), 0);
      if (slowCount >= PRESSURE_MIN_SLOW_SAMPLES && slowCount / samples.length >= PRESSURE_SLOW_RATIO) {
        stableSince = null;
        if (time - lastAdjustment >= 1e3 && limitFPS > MIN_FPS) {
          const previous = limitFPS;
          const delay = Math.max(...samples.filter((sample) => sample.slow).map((sample) => Math.max(sample.delay, sample.cost)));
          limitFPS = Math.min(limitFPS, adaptiveLimit(1e3 / delay));
          publishLimit();
          if (trialLimit === previous) recoveryDelay = Math.min(MAX_RECOVERY_DELAY, recoveryDelay * 2);
          trialLimit = null;
          lastAdjustment = time;
          samples = [];
          frameCredit = 0;
        }
      } else {
        if (stableSince === null) stableSince = time;
        recoverLimitAfterStablePeriod(time);
      }
    }
    function resumeAfterIdle(time) {
      lastFrameTime = null;
      frameCredit = 0;
      samples = [];
      initialDeltas = [];
      if (nativeFPS === null || limitFPS >= nativeFPS) return;
      if (stableSince === null) stableSince = idleSince;
      recoverLimitAfterStablePeriod(time);
    }
    function recoverLimitAfterStablePeriod(time) {
      if (stableSince === null || time - stableSince < recoveryDelay || time - lastAdjustment < recoveryDelay) return false;
      if (trialLimit === limitFPS) {
        trialLimit = null;
        recoveryDelay = BASE_RECOVERY_DELAY;
      }
      if (limitFPS >= nativeFPS) return false;
      limitFPS = recoveryLimit(limitFPS);
      publishLimit();
      trialLimit = limitFPS;
      lastAdjustment = time;
      stableSince = null;
      samples = [];
      frameCredit = 0;
      return true;
    }
    function adaptiveLimit(observedFPS) {
      let candidate = nativeFPS;
      while (candidate > MIN_FPS && candidate > observedFPS) {
        candidate = Math.max(MIN_FPS, candidate - FPS_STEP);
      }
      return candidate;
    }
    function recoveryLimit(current) {
      const levels = [nativeFPS];
      while (levels[levels.length - 1] > MIN_FPS) {
        levels.push(Math.max(MIN_FPS, levels[levels.length - 1] - FPS_STEP));
      }
      for (let index = levels.length - 1; index >= 0; index--) {
        if (levels[index] > current) return levels[index];
      }
      return nativeFPS;
    }
    function flushFrame(time) {
      frameRequest = null;
      if (hidden()) {
        resetMeasurements(true);
        scheduleFrame();
        return;
      }
      if (!observeFrame(time)) {
        scheduleFrame();
        return;
      }
      const start = now();
      phase = "read";
      const reads = queues.read.splice(0);
      for (const task of reads) runTask(task);
      Promise.resolve().then(() => {
        phase = "update";
        const updates = queues.update.splice(0);
        for (const task of updates) runTask(task);
        if (nativeFPS !== null && samples.length) {
          const cost = now() - start;
          const sample = samples[samples.length - 1];
          sample.cost = cost;
          if (cost > 1e3 / Math.max(MIN_FPS, limitFPS) * 0.8) sample.slow = true;
        }
        phase = "idle";
        if (hasWork()) scheduleFrame();
        else idleSince = now();
      });
    }
    function removeTask(task) {
      tasks.delete(task);
      if (!task.group) return;
      task.group.tasks.delete(task);
      if (task.group[task.phase] === task) task.group[task.phase] = null;
      if (!task.group.sequence && task.group.tasks.size === 0 && groups.get(task.group.id) === task.group) groups.delete(task.group.id);
    }
    function settleTask(task, error, value) {
      if (task.state === "settled") return;
      task.state = "settled";
      removeTask(task);
      if (error) task.reject(value);
      else task.resolve(value);
    }
    function cancelTask(task) {
      if (task.state === "settled") return;
      if (task.state === "pending") {
        const queue = queues[task.phase];
        const index = queue.indexOf(task);
        if (index !== -1) queue.splice(index, 1);
      }
      settleTask(task, false, void 0);
    }
    function runTask(task) {
      if (task.state !== "pending") return;
      task.state = "running";
      if (task.group && task.group[task.phase] === task) task.group[task.phase] = null;
      let result;
      try {
        result = task.parameters ? task.callback.apply(void 0, task.parameters) : task.callback();
      } catch (error) {
        settleTask(task, true, error);
        return;
      }
      let then;
      try {
        then = result && result.then;
      } catch (error) {
        settleTask(task, true, error);
        return;
      }
      if (typeof then === "function") {
        Promise.resolve(result).then(
          (value) => settleTask(task, false, value),
          (error) => settleTask(task, true, error)
        );
      } else {
        settleTask(task, false, result);
      }
    }
    function makeGroup(id) {
      const group = { id, read: null, update: null, tasks: /* @__PURE__ */ new Set(), sequence: null };
      groups.set(id, group);
      return group;
    }
    function cancelGroup(group, status) {
      if (groups.get(group.id) === group) groups.delete(group.id);
      const sequence2 = group.sequence;
      if (sequence2 && sequence2.active) {
        sequence2.active = false;
        if (sequence2.timer !== null) clearTimeout(sequence2.timer);
        sequence2.timer = null;
        detachAbortSignals(sequence2);
        group.sequence = null;
      }
      for (const task of Array.from(group.tasks)) cancelTask(task);
      if (sequence2) sequence2.resolve({ id: group.id, status });
      stopFrameIfIdle();
    }
    function queueTask(kind, callback, parameters, id, owner) {
      let group = null;
      if (id !== void 0) {
        group = owner ? owner.group : groups.get(id);
        if (!owner && group && (group.sequence || group[kind])) {
          cancelGroup(group, "superseded");
          group = null;
        }
        if (!group) group = makeGroup(id);
      }
      let task;
      const promise = new Promise((resolve, reject) => {
        task = { phase: kind, callback, parameters, group, resolve, reject, state: "pending" };
      });
      tasks.add(task);
      if (group) {
        group[kind] = task;
        group.tasks.add(task);
      }
      queues[kind].push(task);
      scheduleFrame();
      return promise;
    }
    function validId(id) {
      if (!Number.isSafeInteger(id)) throw new TypeError("waitLayout ID must be a safe integer");
    }
    function request(kind, first, second, third) {
      if (typeof first === "number") {
        validId(first);
        return queueTask(kind, second, third, first, null);
      }
      return queueTask(kind, first, second, void 0, null);
    }
    function validateStages(stages) {
      if (!stages.length) throw new TypeError("sequence() requires at least one stage");
      return stages.map((stage) => {
        if (!stage || typeof stage !== "object" || typeof stage.read !== "function" && typeof stage.update !== "function") {
          throw new TypeError("Each sequence stage needs a read or update callback");
        }
        if (stage.read !== void 0 && typeof stage.read !== "function" || stage.update !== void 0 && typeof stage.update !== "function") {
          throw new TypeError("Sequence callbacks must be functions");
        }
        let abort = null;
        let signal = null;
        if (typeof stage.abort === "function") abort = stage.abort;
        else if (stage.abort !== void 0) {
          const candidate = stage.abort && (stage.abort.signal || stage.abort);
          if (!candidate || typeof candidate.aborted !== "boolean" || typeof candidate.addEventListener !== "function" || typeof candidate.removeEventListener !== "function") {
            throw new TypeError("abort must be a function, AbortController, or AbortSignal");
          }
          signal = candidate;
        }
        let interval = 0;
        let times = 1;
        if (stage.repeat !== void 0) {
          const repeat = stage.repeat;
          if (!repeat || typeof repeat !== "object" || repeat.ms !== void 0 && repeat.s !== void 0) {
            throw new TypeError("repeat must use either ms or s");
          }
          interval = repeat.ms !== void 0 ? repeat.ms : repeat.s !== void 0 ? repeat.s * 1e3 : 0;
          if (!Number.isFinite(interval) || interval < 0) throw new RangeError("Invalid repeat interval");
          times = repeat.times === void 0 ? repeat.ms !== void 0 || repeat.s !== void 0 ? Infinity : 1 : repeat.times;
          if (repeat.times !== void 0 && (!Number.isSafeInteger(times) || times < 1)) {
            throw new RangeError("repeat.times must be a positive integer");
          }
        }
        if (stage.maxFPS !== void 0 && (!Number.isFinite(stage.maxFPS) || stage.maxFPS <= 0)) {
          throw new RangeError("maxFPS must be positive");
        }
        return {
          read: stage.read,
          update: stage.update,
          abort,
          signal,
          interval,
          times,
          maxFPS: stage.maxFPS
        };
      });
    }
    function detachAbortSignals(owner) {
      for (const signal of owner.abortSignals) {
        signal.removeEventListener("abort", owner.abortHandler);
      }
      owner.abortSignals.length = 0;
    }
    function sequence(id, ...stages) {
      validId(id);
      const configs = validateStages(stages);
      const previous = groups.get(id);
      if (previous) cancelGroup(previous, "superseded");
      const group = makeGroup(id);
      let resolve;
      let reject;
      const result = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      const owner = {
        group,
        configs,
        index: 0,
        count: 0,
        lastStart: null,
        timer: null,
        active: true,
        resolve,
        reject,
        abortSignals: [],
        abortHandler: null
      };
      group.sequence = owner;
      owner.abortHandler = () => finishSequence(owner, "aborted");
      try {
        for (const config of configs) {
          if (config.signal && !owner.abortSignals.includes(config.signal)) {
            config.signal.addEventListener("abort", owner.abortHandler);
            owner.abortSignals.push(config.signal);
          }
        }
        if (owner.abortSignals.some((signal) => signal.aborted)) {
          finishSequence(owner, "aborted");
        } else {
          startIteration(owner);
        }
      } catch (error) {
        finishSequence(owner, null, error);
      }
      return result;
    }
    function finishSequence(owner, status, error) {
      if (!owner.active) return;
      const group = owner.group;
      owner.active = false;
      if (owner.timer !== null) clearTimeout(owner.timer);
      owner.timer = null;
      detachAbortSignals(owner);
      group.sequence = null;
      if (groups.get(group.id) === group) groups.delete(group.id);
      for (const task of Array.from(group.tasks)) cancelTask(task);
      stopFrameIfIdle();
      if (status === null) owner.reject(error);
      else owner.resolve({ id: group.id, status });
    }
    function checkAbort(owner, config) {
      if (!owner.active || !config.abort) return false;
      const result = config.abort();
      if (typeof result !== "boolean") throw new TypeError("abort must return a boolean");
      if (result) finishSequence(owner, "aborted");
      return result;
    }
    function startIteration(owner) {
      if (!owner.active) return;
      const config = owner.configs[owner.index];
      const previousStart = sequenceStarts.get(owner.group.id);
      const minimumStart = config.maxFPS === void 0 || !previousStart || previousStart.owner === owner ? 0 : previousStart.time + 1e3 / config.maxFPS;
      if (minimumStart > now()) {
        owner.timer = setTimeout(() => {
          owner.timer = null;
          startIteration(owner);
        }, Math.max(0, minimumStart - now() - 1));
        return;
      }
      try {
        if (checkAbort(owner, config)) return;
      } catch (error) {
        finishSequence(owner, null, error);
        return;
      }
      owner.lastStart = now();
      sequenceStarts.set(owner.group.id, { owner, time: owner.lastStart });
      const read = config.read ? queueTask("read", () => {
        if (checkAbort(owner, config)) return;
        return config.read();
      }, void 0, owner.group.id, owner) : Promise.resolve(void 0);
      read.then((value) => {
        if (!owner.active) return;
        try {
          if (checkAbort(owner, config)) return;
        } catch (error) {
          finishSequence(owner, null, error);
          return;
        }
        return config.update ? queueTask("update", (input) => {
          if (checkAbort(owner, config)) return;
          return config.update(input);
        }, [value], owner.group.id, owner) : void 0;
      }).then(() => {
        if (owner.active) completeIteration(owner, config);
      }, (error) => finishSequence(owner, null, error));
    }
    function completeIteration(owner, config) {
      owner.count++;
      if (owner.count >= config.times) {
        owner.index++;
        owner.count = 0;
        owner.lastStart = null;
        if (owner.index >= owner.configs.length) {
          finishSequence(owner, "completed");
          return;
        }
        startIteration(owner);
        return;
      }
      const completed = now();
      const fpsDue = config.maxFPS === void 0 ? completed : owner.lastStart + 1e3 / config.maxFPS;
      const due = Math.max(completed + config.interval, fpsDue);
      const delay = Math.max(0, due - now() - 1);
      if (delay > 1) {
        owner.timer = setTimeout(() => {
          owner.timer = null;
          startIteration(owner);
        }, delay);
      } else {
        startIteration(owner);
      }
    }
    function clear() {
      if (frameRequest !== null) cancelAnimationFrame(frameRequest);
      frameRequest = null;
      if (waitingForVisibility) document.removeEventListener("visibilitychange", onVisible);
      waitingForVisibility = false;
      for (const group of Array.from(groups.values())) cancelGroup(group, "cleared");
      for (const task of Array.from(tasks)) cancelTask(task);
      queues.read.length = 0;
      queues.update.length = 0;
      phase = "idle";
      idleSince = null;
      resetMeasurements(true);
      sequenceStarts.clear();
    }
    function cancel(id) {
      validId(id);
      const group = groups.get(id);
      if (!group) return false;
      cancelGroup(group, "aborted");
      return true;
    }
    return Object.freeze({
      read: (first, second, third) => request("read", first, second, third),
      update: (first, second, third) => request("update", first, second, third),
      sequence,
      cancel,
      clear,
      setVisualFPSLimit
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
        root2.aelluxJs.onEvent(element, event, handler, options);
      },
      off(event, handler, options) {
        root2.aelluxJs.offEvent(element, event, handler, options);
      },
      dispatch(event, options) {
        return root2.aelluxJs.dispatchFrom(element, event, options);
      },
      mount(extensionNames = null) {
        return root2.aelluxJs.mountManager.mount(element, extensionNames);
      },
      unmount(extensionNames = null) {
        return root2.aelluxJs.mountManager.unmount(element, extensionNames);
      },
      update(extensionNames = null) {
        return root2.aelluxJs.mountManager.update(element, extensionNames);
      }
    };
    function spawn(extensionName, mountId, methodNames, updatable = false) {
      const key = toCamelCase2(fromCamelCase2(extensionName));
      const extension = root2.aelluxJs.ext[key];
      const methods = Array.isArray(methodNames) ? methodNames : [];
      for (const name of methods) {
        if (name === "update" && updatable) continue;
        if (typeof name === "string" && extension && typeof extension[name] === "function") continue;
        const diagnostics = root2.aelluxJs.diagnostics;
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
      const extension = root2.aelluxJs.ext[key];
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
          const current = root2.aelluxJs.ext[key];
          return current[name](element, ...args);
        };
      }
      namespace.update = registrations.some((registration) => registration.updatable) ? () => root2.aelluxJs.mountManager.update(element, key) : null;
      controller[key] = namespace;
    }
    return controller;
  }

  // src/internal/resolve-element-or-id.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function resolveElementOrId(root2, elementOrId, options) {
    options = options || {};
    var fallback2 = options.defaultElement;
    if ((elementOrId === void 0 || elementOrId === null) && fallback2) {
      return fallback2;
    }
    var requested = elementOrId;
    if (typeof elementOrId === "string") {
      var id = elementOrId.trim().replace(/^#/, "");
      elementOrId = id ? root2.document.getElementById(id) : null;
    }
    var allowedNodeTypes = options.allowedNodeTypes || [root2.Node.ELEMENT_NODE];
    if (elementOrId && allowedNodeTypes.indexOf(elementOrId.nodeType) !== -1) {
      return elementOrId;
    }
    var diagnostics = root2.aelluxJs.diagnostics;
    diagnostics.warn(diagnostics.WARN_INVALID_ELEMENT_OR_ID, {
      elementOrId: requested,
      method: options.method
    });
    return null;
  }

  // src/internal/development-helpers.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createDocumentHTMLValidator(root2) {
    const sourceURL = root2.document.URL;
    let sourceChecked = false;
    return function validateDocumentDoubleAttributeHTML() {
      const api = root2.aelluxJs;
      if (api.options.environment !== "development" || sourceChecked || root2.document.contentType !== "text/html" || !/^https?:/i.test(sourceURL)) return;
      sourceChecked = true;
      Promise.resolve().then(() => api.request(sourceURL, { cache: "force-cache" })).then((response) => response.text()).then((html) => validateDoubleAttributeHTML(api, html, sourceURL)).catch(() => {
      });
    };
  }
  function validateDoubleAttributeHTML(api, html, source) {
    if (api.options.environment !== "development") return;
    for (const duplicate of findDuplicateAttributes(html)) {
      const { attribute } = duplicate;
      reportConfiguration(api, "WARN_ATTRIBUTE_DUPLICATE", __spreadProps(__spreadValues({
        extension: "core",
        source
      }, duplicate), {
        reason: `The ${attribute} attribute occurs more than once on the same start tag; the HTML parser keeps the first value and discards the others.`,
        suggestion: attribute === "class" ? "Combine all class names in one class attribute, separated by spaces." : attribute === "style" ? "Combine the intended CSS declarations in one style attribute, separated by semicolons." : `Keep one ${attribute} attribute with the intended value.`
      }));
    }
  }
  function validateMotionResourceConflicts(api, element, animations, extension) {
    if (api.options.environment !== "development") return;
    for (const animation of animations) {
      try {
        const effect = animation.effect;
        if ((effect == null ? void 0 : effect.target) !== element || effect.pseudoElement) continue;
        const frames = effect.getKeyframes();
        if (!frames.some((frame) => "transform" in frame && (frame.composite === "replace" || (!frame.composite || frame.composite === "auto") && (!effect.composite || effect.composite === "replace")))) continue;
        const owners = transformOwners(api, element).filter((owner) => owner !== extension);
        for (const owner of owners) diagnoseResource(api, element, "transform", [owner, extension]);
      } catch (_) {
      }
    }
  }
  var attributesByExtension = {
    present: "present present-group present-active present-when present-motion present-trigger present-trigger-on present-target present-effect auto-dismiss dismiss-on-click",
    anchor: "anchor anchor-target anchor-match anchor-scroll-into-view",
    "overflow-marquee": "overflow-marquee overflow-marquee-fade overflow-marquee-viewport overflow-marquee-content overflow-marquee-active overflow-marquee-ready",
    scrollbox: "scrollbox scrollbox-fade scrollbox-fade-state scrollbox-wheel-horizontal scrollbox-momentum scrollbox-elastic scrollbar scrollbar-parent scrollbar-vertical scrollbar-horizontal",
    "scrollbox-snap": "scrollbox-snap snap-item",
    focus: "focus focus-scope focus-nav shortcut shortcut-priority shortcut-action shortcut-target",
    input: "point inputs shortcut-hint shortcut-focus shortcut-hint-position shortcut-label shortcut-source shortcut-code gamepad gamepad-family gamepad-model active-input",
    adaptive: "adaptive",
    "ajax-href": "ajax-href",
    viewport: "viewport viewport-target",
    progress: "progress-target progress-fallback",
    preference: "preference option label next prev ready",
    feedback: "feedback feedback-message-target feedback-effect-target present-target"
  };
  var coreAttributes = "maxfps wait-mounted ext ext-style dep load-when builds load-style weak-style full-style legacy esm theme-color";
  var activation = {
    present: "present present-group present-trigger",
    anchor: "anchor",
    "overflow-marquee": "overflow-marquee",
    scrollbox: "scrollbox",
    "scrollbox-snap": "scrollbox-snap",
    focus: "focus focus-scope focus-nav shortcut",
    input: "point inputs shortcut-hint",
    adaptive: "adaptive",
    "ajax-href": "ajax-href",
    viewport: "viewport",
    preference: "preference",
    feedback: "feedback"
  };
  function validateExtensionDeclarations(root2, scope, extensionNames = null, method = "mount") {
    var _a, _b;
    const api = root2.aelluxJs;
    if (api.options.environment !== "development") return;
    const selected = extensionNames === null ? null : new Set(
      (Array.isArray(extensionNames) ? extensionNames : [extensionNames]).map(utils_name_case_default.fromCamelCase)
    );
    const attr = (name) => api.attr(name);
    const prefix = attr("");
    const owners = /* @__PURE__ */ new Map();
    for (const [extension, names] of Object.entries(attributesByExtension))
      for (const name of names.split(" ")) owners.set(attr(name), extension);
    const known = /* @__PURE__ */ new Set([
      ...owners.keys(),
      ...coreAttributes.split(" ").map(attr),
      ...Object.keys(api.registry.preferenceMediaQueries).map((name) => attr(utils_name_case_default.fromCamelCase(name)))
    ]);
    for (const selector of [...Object.values(api.registry.extMounters), ...Object.values(api.registry.lazyExtSelectors)])
      for (const match of selector.match(/\[[^\s\]~|^$*!=]+/g) || []) known.add(match.slice(1));
    const elements = [...scope.nodeType === 1 ? [scope] : [], ...scope.querySelectorAll("*")];
    for (const element of elements) {
      let validatePresent = function() {
        if (has("present") && value("present").trim().split(/\s+/).some((token) => token && !["opacity", "transform", "height", "width"].includes(token)))
          invalid("present", "present", "Unknown animated Present property.", "Use opacity, transform, height, width, all, or an empty value to disable motion.");
        if (has("present-when") && /\s/.test(value("present-when")))
          invalid("present", "present-when", "A group condition must be one class token.", "Use one class name without spaces or a leading dot.", "WARN_PRESENT_GROUP_SELECTION");
        for (const [name, allowed] of [["present-trigger", ["", "toggle", "pop", "dismiss", "unpop", "effect"]], ["present-trigger-on", ["", "click", "hover"]]])
          if (has(name) && !allowed.includes(name === "present-trigger" ? value(name).toLowerCase() : value(name)))
            invalid("present", name, "Unknown Present control value.", `Use ${allowed.filter(Boolean).join(", ")}.`);
        if (has("present-trigger")) {
          const name = "present-target";
          const reference = value(name);
          if (reference) diagnosePresentTarget(api, element, root2.document.getElementById(reference.replace(/^#/, "")), attr(name), reference);
          else if (!element.closest(`[${attr("present")}]`))
            invalid(
              "present",
              "present-trigger",
              "Control has no target or enclosing Present container.",
              "Set data-ae-present-target to an existing Present ID or place the control inside its Present container.",
              "WARN_CONFIGURATION_TARGET"
            );
          if (element.tabIndex < 0 && !element.matches(":disabled,[inert]"))
            invalid(
              "present",
              "present-trigger",
              "Control is not reachable with the keyboard.",
              "Prefer a native button; custom controls need focusability and appropriate keyboard activation.",
              "WARN_CONTROL_ACCESSIBILITY"
            );
        }
        if (has("auto-dismiss") && value("auto-dismiss") && !/^(?:\d+(?:\.\d+)?|\.\d+)(?:ms|s)?$/.test(value("auto-dismiss").trim()))
          invalid("present", "auto-dismiss", "Auto-dismiss duration is invalid.", "Use a nonnegative duration such as 250ms or 2s.");
        if (has("present-group")) {
          const members = [...element.querySelectorAll(`[${attr("present")}]`)].filter((member) => member.closest(`[${attr("present-group")}]`) === element);
          if (!members.some((member) => member.id))
            invalid("present", "present-group", "Group has no identifiable Present members.", "Add Present descendants with unique native IDs.", "WARN_PRESENT_GROUP_SELECTION");
          for (const member of members) if (!member.id) reportConfiguration(api, "WARN_PRESENT_GROUP_SELECTION", {
            extension: "present",
            element: member,
            attribute: "id",
            value: member.id,
            reason: "Present Group member has no ID.",
            suggestion: "Assign a unique native ID so the group can select this member."
          });
        }
      }, validateAnchor = function() {
        var _a2;
        const pivots = new Set("top-left top-center top-right center-left center center-right bottom-left bottom-center bottom-right".split(" "));
        const pairs = has("anchor") ? value("anchor").split(",") : [];
        if (has("anchor") && !pairs.every((token) => {
          const pair = token.trim().toLowerCase().split(":");
          return pair.length === 2 && pair.every((pivot) => pivots.has(pivot.trim()));
        }))
          invalid("anchor", "anchor", "Anchor pivot pair is invalid.", "Use target:self pairs such as bottom-center:top-center, separated by commas.");
        if (has("anchor-match") && value("anchor-match").trim().split(/\s+/).some((token) => !["width", "height"].includes(token)))
          invalid("anchor", "anchor-match", "Unknown matching dimension.", "Use width, height, or width height.", "WARN_ANCHOR_MATCH");
        const reference = value("anchor-target");
        if (!reference) return;
        let target;
        try {
          target = root2.document.getElementById(reference.replace(/^#/, "")) || root2.document.querySelector(reference);
        } catch (_) {
        }
        if (target == null ? void 0 : target.hasAttribute(attr("present-group"))) {
          if (!((_a2 = api.ext.present) == null ? void 0 : _a2.initialized))
            report("WARN_EXTENSION_REQUIRED", "present", "anchor-target", "A Present Group target requires Present.", "Register and initialize Present before mounting the group and its Anchors.");
          target = api.comm.request("present.selection", { group: target }).value;
          if (!target) return;
        }
        if (!target) invalid("anchor", "anchor-target", "Anchor target does not exist or the selector is invalid.", "Use an existing target ID or a valid CSS selector.", "WARN_CONFIGURATION_TARGET");
        else if (method === "update" && element.getClientRects().length && !target.getClientRects().length && !target.closest(`[${attr("present")}],[hidden]`))
          invalid("anchor", "anchor-target", "The explicitly updated Anchor target cannot currently be measured.", "Reveal the target before requesting placement, or update again after it becomes measurable.", "WARN_CONFIGURATION_TARGET");
      }, validateScrollbox = function() {
        if (!has("scrollbox")) return;
        if (has("scrollbar-parent") && !["scrollbox", "wrapper"].includes(value("scrollbar-parent")))
          invalid("scrollbox", "scrollbar-parent", "Unknown custom scrollbar parent.", "Use scrollbox (default) or wrapper; wrapper uses the existing immediate parent.");
        if (!element.getClientRects().length) return;
        const style = root2.getComputedStyle(element);
        const blockedX = element.scrollWidth > element.clientWidth + 1 && !["auto", "scroll"].includes(style.overflowX);
        const blockedY = element.scrollHeight > element.clientHeight + 1 && !["auto", "scroll"].includes(style.overflowY);
        const usableX = element.scrollWidth > element.clientWidth + 1 && ["auto", "scroll"].includes(style.overflowX);
        const usableY = element.scrollHeight > element.clientHeight + 1 && ["auto", "scroll"].includes(style.overflowY);
        const barTokens = (value("scrollbar") || "").toLowerCase().trim().split(/[\s,|/+]+/).filter(Boolean);
        const customBars = has("scrollbar") && (!barTokens.length || barTokens.some((token) => /^[vhxy]+$/.test(token.replace(/horizontal/g, "h").replace(/vertical/g, "v"))));
        if (usableX && usableY && customBars && has("scrollbox-fade") && ["", "true"].includes(value("scrollbox-fade")) && value("scrollbar-parent") !== "wrapper" && parseFloat(style.getPropertyValue("--ae-scrollbox-fade-size") || "16") > 0)
          invalid(
            "scrollbox",
            "scrollbar-parent",
            "The two-axis fade also masks custom scrollbars painted inside Scrollbox.",
            'Place Scrollbox in a wrapper and set data-ae-scrollbar-parent="wrapper" on Scrollbox to move its bars outside the fade.',
            "WARN_SCROLLBOX_FADE_SCROLLBAR"
          );
        if (value("scrollbox").trim().toLowerCase() === "pointer" && (blockedX || blockedY) && !usableX && !usableY)
          invalid("scrollbox", "scrollbox", "Content overflows but CSS disables the pointer scrolling axes.", "Set overflow:auto or overflow:scroll on the intended axis.", "WARN_CONFIGURATION_STYLE");
      }, validateSnap = function() {
        if (!["", "horizontal", "vertical", "false"].includes(value("scrollbox-snap")))
          invalid("scrollbox-snap", "scrollbox-snap", "Unknown snap axis.", "Use horizontal, vertical, or false.");
        for (const item of element.querySelectorAll(`[${attr("snap-item")}]`)) {
          if (item.closest(`[${attr("scrollbox")}]`) !== element) continue;
          const alignment = item.getAttribute(attr("snap-item"));
          const style = root2.getComputedStyle(item);
          if (item.getClientRects().length && [style.transform, style.translate, style.rotate, style.scale].some((value2) => value2 && value2 !== "none"))
            reportConfiguration(api, "WARN_SCROLLBOX_SNAP_TRANSFORM", {
              extension: "scrollbox-snap",
              element: item,
              attribute: attr("snap-item"),
              reason: "Snap geometry includes a transform applied to the item itself.",
              suggestion: "Apply the visual transform to a child of the snap item."
            });
          if (!["", "start", "end", "center", "left", "right", "top", "bottom"].includes(alignment))
            reportConfiguration(api, "WARN_CONFIGURATION_VALUE", {
              extension: "scrollbox-snap",
              element: item,
              attribute: attr("snap-item"),
              value: alignment,
              reason: "Unknown snap item alignment.",
              suggestion: "Use start, center, or end (left/right/top/bottom are aliases)."
            });
        }
      }, validateCSS = function() {
        var _a2;
        const checkAnchor = has("anchor") && (!selected || selected.has("anchor"));
        const checkPresent = (has("present") || has("present-motion")) && (!selected || selected.has("present"));
        if (!checkAnchor && !checkPresent) return;
        if (has("anchor") && has("present") && value("present").trim().split(/\s+/).some((token) => token === "transform" || token === "all"))
          invalid(
            "present",
            "present",
            "Anchor and Present both declare transform; Anchor takes priority.",
            "Remove transform from Present, or animate a child element instead.",
            "WARN_PRESENT_ANCHOR_TRANSFORM"
          );
        const extension = checkAnchor ? "anchor" : "present";
        const style = root2.getComputedStyle(element);
        const durations = [
          ...checkPresent ? ["--ae-pop-duration", "--ae-dismiss-duration"] : [],
          ...checkAnchor ? ["--ae-anchor-switch-duration"] : []
        ];
        for (const name of durations) {
          const value2 = (element.style.getPropertyValue(name) || style.getPropertyValue(name)).trim();
          if (value2 && ((_a2 = root2.CSS) == null ? void 0 : _a2.supports) && !root2.CSS.supports("transition-duration", value2))
            reportConfiguration(api, "WARN_CONFIGURATION_STYLE", {
              extension,
              element,
              attribute: "style",
              value: value2,
              reason: `Invalid duration in ${name}.`,
              suggestion: "Use a nonnegative CSS time such as 250ms or 0s."
            });
        }
        if (!element.getClientRects().length) return;
        if (checkPresent && has("present") && element.classList.contains(api.className("present-grid")) && /(?:^|\s)(height|width)(?:\s|$)/.test(value("present")) && !["grid", "inline-grid"].includes(style.display))
          invalid(extension, "present", "Present's size motion requires its grid layout stylesheet.", "Load the Present stylesheet, check CSP, and preserve the container's grid display.", "WARN_CONFIGURATION_STYLE");
        if (checkAnchor && element.classList.contains(api.className("anchored")) && !["absolute", "fixed"].includes(style.position))
          invalid(extension, "anchor", "Effective CSS prevents Anchor's absolute positioning.", "Check the weak stylesheet, CSP and overriding position rules.", "WARN_CONFIGURATION_STYLE");
        if (checkPresent && has("present") && element.hidden && style.display !== "none" && !invisible(element))
          invalid(extension, "present", "CSS makes a hidden Present container render.", "Preserve display:none for hidden Present containers; check overriding display rules.", "WARN_CONFIGURATION_STYLE");
      };
      const has = (name) => element.hasAttribute(attr(name));
      const value = (name) => element.getAttribute(attr(name));
      const report = (name, extension, attribute, reason, suggestion, extra = {}) => reportConfiguration(api, name, __spreadValues({ extension, element, attribute: attr(attribute), reason, suggestion }, extra));
      const invalid = (extension, name, reason, suggestion, code = "WARN_CONFIGURATION_VALUE") => report(code, extension, name, reason, suggestion);
      for (const attribute of element.attributes) {
        const owner = owners.get(attribute.name);
        if (selected && (!owner || !selected.has(owner))) continue;
        if (!selected && attribute.name.startsWith(prefix) && !known.has(attribute.name)) {
          const candidate = [...known].find((name) => oneEditApart(attribute.name, name));
          if (candidate) reportConfiguration(api, "WARN_ATTRIBUTE_UNKNOWN", {
            extension: owners.get(candidate) || "core",
            element,
            attribute: attribute.name,
            value: attribute.value,
            reason: "Unknown aellux.js attribute.",
            suggestion: `Check the spelling; did you mean ${candidate}?`
          });
        }
      }
      for (const [extension, declarations] of Object.entries(activation)) {
        if (selected && !selected.has(extension)) continue;
        const declaration = declarations.split(" ").find((name) => has(name) && (name !== "scrollbox-snap" || value(name) !== "false"));
        if (!declaration) continue;
        if (extension === "scrollbox-snap" && !has("scrollbox"))
          invalid(extension, "scrollbox-snap", "Snap requires Scrollbox on the same element.", "Add data-ae-scrollbox to the Snap container.", "WARN_CONFIGURATION_STRUCTURE");
        const key = utils_name_case_default.toCamelCase(extension);
        if (!((_a = api.ext[key]) == null ? void 0 : _a.initialized)) {
          report(
            "WARN_EXTENSION_REQUIRED",
            extension,
            declaration,
            "The declared behavior's Extension is not initialized.",
            `Register ${extension} before mounting, await $ae.wait("${extension}"), and check earlier load diagnostics.`
          );
          continue;
        }
        if (extension === "present") validatePresent();
        if (extension === "anchor") validateAnchor();
        if (extension === "overflow-marquee" && has("overflow-marquee-fade") && !["", "true", "false"].includes(value("overflow-marquee-fade")))
          invalid(
            extension,
            "overflow-marquee-fade",
            "Overflow Marquee fade expects a boolean value.",
            "Use true or false, or omit the attribute to enable the fade."
          );
        if (extension === "scrollbox") validateScrollbox();
        if (extension === "scrollbox" && has("scrollbox-fade") && !["", "true", "false"].includes(value("scrollbox-fade")))
          invalid(
            extension,
            "scrollbox-fade",
            "Scrollbox fade expects a boolean value.",
            "Use true or false to force the fade, or omit the attribute for automatic single-axis fading."
          );
        if (extension === "scrollbox-snap") validateSnap();
        if (extension === "focus") {
          if (value("focus") && value("focus") !== "next")
            invalid(extension, "focus", "Unknown Focus mode.", "Use next for Enter navigation, or remove the attribute.");
          if (value("focus") === "next" && !element.matches("input:not([type]),input[type=text],input[type=search],input[type=email],input[type=url],input[type=tel],input[type=password],input[type=number],textarea,[contenteditable]:not([contenteditable=false])"))
            invalid(extension, "focus", "Enter navigation is declared on a non-text-entry element.", "Apply data-ae-focus=next to a text input, textarea or editable element.");
        }
        if (extension === "input" && value("point") !== "" && element.hasAttribute(attr("point")) && (!/^\d+$/.test(value("point")) || !Number.isSafeInteger(Number(value("point")))))
          invalid(extension, "point", "Pointer count must be a nonnegative integer.", "Use an integer such as 1; 0 disables pointer association.");
        if (extension === "ajax-href") {
          const selectors = api.parseSelectors(value("ajax-href").trim() || "title,body");
          if (!selectors) {
            invalid(extension, "ajax-href", "The AJAX selector is invalid.", "Provide a valid CSS selector such as #content.");
          } else if (selectors.some((selector) => !root2.document.querySelector(selector)))
            invalid(extension, "ajax-href", "No current content matches the AJAX selector.", "Provide a CSS selector present in both the current page and the response.");
        }
      }
      if ((!selected || selected.has("scrollbox")) && has("scrollbox-elastic") && value("scrollbox-elastic") !== "false" && !((_b = element.parentElement) == null ? void 0 : _b.hasAttribute(attr("scrollbox"))))
        invalid("scrollbox", "scrollbox-elastic", "Elastic wrapper must be a direct child of Scrollbox.", "Place exactly one marked wrapper directly inside data-ae-scrollbox.", "WARN_CONFIGURATION_STRUCTURE");
      if ((!selected || selected.has("scrollbox-snap")) && has("snap-item") && !element.closest(`[${attr("scrollbox")}]`))
        invalid("scrollbox-snap", "snap-item", "Snap item has no Scrollbox ancestor.", "Place snap items inside a Scrollbox with Snap enabled.", "WARN_CONFIGURATION_STRUCTURE");
      if (!selected && has("maxfps") && (!value("maxfps").trim() || !Number.isFinite(Number(value("maxfps"))) || Number(value("maxfps")) <= 0))
        invalid("core", "maxfps", "Frame rate must be finite and greater than zero.", "Use a positive number or remove the attribute.", "WARN_LAYOUT_MAX_FPS_INVALID");
      if (!selected || selected.has("present") || selected.has("anchor")) validateCSS();
      if ((!selected || selected.has("present") || selected.has("scrollbox")) && has("scrollbox-elastic")) {
        const writers = transformOwners(api, element);
        if (writers.includes("scrollbox-elastic") && writers.includes("present"))
          diagnoseResource(api, element, "transform", ["scrollbox-elastic", "present"]);
      }
    }
    function invisible(element) {
      for (let node = element; node; node = node.parentElement) {
        const style = root2.getComputedStyle(node);
        if (style.visibility !== "visible" || Number(style.opacity) === 0) return true;
      }
      return false;
    }
  }
  function oneEditApart(left, right) {
    if (Math.abs(left.length - right.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < left.length && j < right.length) {
      if (left[i] === right[j]) {
        i++;
        j++;
        continue;
      }
      if (++edits > 1) return false;
      if (left[i] === right[j + 1] && left[i + 1] === right[j] && left.length === right.length) {
        i += 2;
        j += 2;
      } else if (left.length > right.length) i++;
      else if (right.length > left.length) j++;
      else {
        i++;
        j++;
      }
    }
    return edits + Number(i < left.length || j < right.length) === 1;
  }
  function reportConfiguration(api, name, context) {
    if (context.element && context.attribute && !("value" in context))
      context.value = context.element.getAttribute(context.attribute);
    return api.diagnostics.warn(api.diagnostics[name], context);
  }
  function diagnosePresentTarget(api, element, target, attribute, value) {
    if (!value || /[\s#]/.test(value.replace(/^#/, ""))) return false;
    if (target && target.hasAttribute(api.attr("present"))) return true;
    reportConfiguration(api, "WARN_CONFIGURATION_TARGET", {
      extension: "present",
      element,
      attribute,
      value,
      reason: target ? "Target is not a Present container." : "Target element was not found.",
      suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
    });
    return false;
  }
  function transformOwners(api, element) {
    var _a, _b, _c, _d;
    const owners = [];
    if (((_a = api.ext.anchor) == null ? void 0 : _a.initialized) && element.classList.contains(api.className("anchored"))) owners.push("anchor");
    const parent = element.parentElement;
    if (((_b = api.ext.scrollbox) == null ? void 0 : _b.initialized) && element.hasAttribute(api.attr("scrollbox-elastic")) && element.getAttribute(api.attr("scrollbox-elastic")) !== "false" && (parent == null ? void 0 : parent.hasAttribute(api.attr("scrollbox")))) {
      const children = [...parent.children].filter((child) => !child.hasAttribute(api.attr("scrollbar-vertical")) && !child.hasAttribute(api.attr("scrollbar-horizontal")));
      if (children.length === 1) owners.push("scrollbox-elastic");
    }
    if (((_c = api.ext.present) == null ? void 0 : _c.initialized) && !element.hasAttribute(api.attr("anchor")) && ((_d = element.getAttribute(api.attr("present"))) == null ? void 0 : _d.split(/\s+/).includes("transform"))) owners.push("present");
    return owners;
  }
  function diagnoseResource(api, element, property, writers) {
    api.diagnostics.warn(api.diagnostics.WARN_RESOURCE_CONFLICT, {
      extension: writers[writers.length - 1],
      element,
      attribute: "style",
      property,
      writers,
      reason: `${writers.join(" and ")} replace the same ${property} on this element.`,
      suggestion: "Keep positioning and elastic transforms on the outer element; animate a child element instead."
    });
  }
  function findDuplicateAttributes(html) {
    const duplicates = [];
    const space = /[\t\n\f\r ]/;
    const lower = (text) => text.replace(/[A-Z]/g, (char) => char.toLowerCase());
    let index = 0, lineIndex = 0, line = 1, column = 1;
    while ((index = html.indexOf("<", index)) !== -1) {
      if (html.startsWith("<!--", index)) {
        const end = /--!?>/.exec(html.slice(index + 4));
        index = end ? index + 4 + end.index + end[0].length : html.length;
        continue;
      }
      if (html.startsWith("<![CDATA[", index)) {
        const end = html.indexOf("]]>", index + 9);
        index = end < 0 ? html.length : end + 3;
        continue;
      }
      if (/[!?/]/.test(html[index + 1] || "")) {
        const end = html.indexOf(">", index + 2);
        index = end < 0 ? html.length : end + 1;
        continue;
      }
      if (!/[a-z]/i.test(html[index + 1] || "")) {
        index++;
        continue;
      }
      const tagStart = ++index;
      while (index < html.length && !space.test(html[index]) && !/[/>]/.test(html[index])) index++;
      const tagName = lower(html.slice(tagStart, index));
      const attributes = /* @__PURE__ */ new Map();
      while (index < html.length && html[index] !== ">") {
        if (space.test(html[index]) || html[index] === "/") {
          index++;
          continue;
        }
        const offset = index++;
        while (index < html.length && !space.test(html[index]) && !/[=/>]/.test(html[index])) index++;
        const attribute = lower(html.slice(offset, index).replace(/\0/g, "\uFFFD"));
        while (space.test(html[index] || "")) index++;
        let value = "";
        if (html[index] === "=") {
          index++;
          while (space.test(html[index] || "")) index++;
          const quote = html[index];
          if (quote === '"' || quote === "'") {
            const start = ++index;
            while (index < html.length && html[index] !== quote) index++;
            value = html.slice(start, index);
            if (index < html.length) index++;
          } else {
            const start = index;
            while (index < html.length && !space.test(html[index]) && html[index] !== ">") index++;
            value = html.slice(start, index);
          }
        }
        const previous = attributes.get(attribute);
        if (previous) {
          previous.values.push(value);
          if (!previous.duplicate) {
            while (lineIndex < offset) {
              const char = html[lineIndex++];
              if (char === "\r" || char === "\n" && html[lineIndex - 2] !== "\r") {
                line++;
                column = 1;
              } else if (char !== "\n") column++;
            }
            previous.duplicate = { tagName, attribute, value: previous.values[0], values: previous.values, offset, line, column };
          }
        } else attributes.set(attribute, { values: [value] });
      }
      if (index >= html.length) break;
      for (const attribute of attributes.values())
        if (attribute.duplicate) duplicates.push(attribute.duplicate);
      index++;
      if (tagName === "plaintext") break;
      if (/^(script|style|textarea|title|xmp|iframe|noembed|noframes|noscript)$/.test(tagName)) {
        const closing = new RegExp(`</${tagName}(?=[\\t\\n\\f\\r />])`, "ig");
        closing.lastIndex = index;
        const end = closing.exec(html);
        index = end ? end.index : html.length;
      }
    }
    return duplicates;
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
    const classPrefix = root2.aelluxJs.className("");
    const validateDocumentDoubleAttributeHTML = createDocumentHTMLValidator(root2);
    return { mount, unmount, unmountDetached, update };
    async function update(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, "update");
      if (!rootElement) return false;
      await AelluxJsMounted(rootElement, "update", extensionNames);
      validateExtensionDeclarations(root2, rootElement, extensionNames, "update");
      return true;
    }
    async function unmount(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, UNMOUNT);
      if (!rootElement) return false;
      return AelluxJsMounted(rootElement, UNMOUNT, extensionNames);
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
      return AelluxJsMounted(root2.document, UNMOUNT, null, true);
    }
    async function mount(elementOrId, extensionNames = null) {
      const aelluxJs2 = root2.aelluxJs;
      const newlyMounted = /* @__PURE__ */ new Set();
      const rootElement = resolveMountElement(elementOrId, "mount");
      if (!rootElement) return [];
      if (!aelluxJs2.dispatch("BeforeMount", {
        cancelable: true,
        detail: {
          root: rootElement,
          extensions: extensionNames == null ? null : (typeof extensionNames === "string" ? [extensionNames] : extensionNames).map((name) => fromCamelCase2(name))
        }
      })) return [];
      const waitMountedAttr = aelluxJs2.attr("wait-mounted");
      const allWaiters = findElements(rootElement, `[${waitMountedAttr}]`);
      allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "true"));
      try {
        const allLinks = findElements(rootElement, "link[rel='aelluxjs-ext']");
        for (const link of allLinks) {
          const href = link.getAttribute("href");
          const loadWhen = link.getAttribute(aelluxJs2.attr("load-when")) || void 0;
          const builds = link.getAttribute(aelluxJs2.attr("builds")) || void 0;
          const loadStyleValue = link.getAttribute(aelluxJs2.attr("load-style"));
          const loadStyle = loadStyleValue === null || loadStyleValue === "false" ? false : loadStyleValue || true;
          link.setAttribute("rel", "aelluxjs-ext-registered");
          aelluxJs2.ext(href, { builds, loadWhen, loadStyle });
        }
        const waitExtensions = [];
        for (const [key, options] of Object.entries(root2.aelluxJs.registry.ext)) {
          if (options.load === false) continue;
          waitExtensions.push(aelluxJs2.wait(key));
        }
        await Promise.all(waitExtensions);
        await AelluxJsMount(rootElement, extensionNames, newlyMounted);
        validateExtensionDeclarations(root2, rootElement, extensionNames);
        if (rootElement === root2.document && extensionNames == null) validateDocumentDoubleAttributeHTML();
      } catch (error) {
        aelluxJs2.diagnostics.error(aelluxJs2.diagnostics.ERROR_MOUNT, {
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
      const aelluxJs2 = root2.aelluxJs;
      if (typeof extensionNames === "string")
        extensionNames = [extensionNames];
      var filter;
      if (!extensionNames) {
        const mounterSelectors = Object.values(aelluxJs2.registry.extMounters);
        const lazySelectors = Object.values(aelluxJs2.registry.lazyExtSelectors);
        filter = [...mounterSelectors, ...lazySelectors];
      } else {
        filter = [];
        extensionNames = extensionNames.map((_) => fromCamelCase2(_));
        for (const [key, selectorString] of Object.entries(aelluxJs2.registry.extMounters))
          if (extensionNames.indexOf(fromCamelCase2(key)) !== -1)
            filter.push(selectorString);
        for (const [key, selectorString] of Object.entries(aelluxJs2.registry.lazyExtSelectors))
          if (extensionNames.indexOf(fromCamelCase2(key)) !== -1)
            filter.push(selectorString);
      }
      if (filter.length === 0) {
        aelluxJs2.dispatch("Mount", {
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
          for (const [key, selector] of Object.entries(aelluxJs2.registry.lazyExtSelectors))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionNames.add(fromCamelCase2(key));
          for (const [key, selector] of Object.entries(aelluxJs2.registry.extMounters))
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
        extensions.map(([extensionName]) => aelluxJs2.wait(extensionName).then(
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
        const [extensionName] = extensions[index];
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        if (!mounter) continue;
        for (const [selector, controller] of mounter) {
          registrations.push({
            extensionName,
            selector,
            controller,
            priority: controller.priority,
            order: registrations.length
          });
        }
      }
      registrations.sort((left, right) => left.priority - right.priority || left.order - right.order);
      const elementsAffected = /* @__PURE__ */ new Set();
      for (const { extensionName, selector, controller } of registrations) {
        try {
          if (!controller.mount) {
            continue;
          }
          const mountableElements = findElements(rootElement, selector);
          for (const mountable of mountableElements) {
            const mountId = `${extensionName}@${selector}`;
            if (isMounted(mountable, mountId)) {
              const pendingMount = getPendingMount(mountable, mountId);
              if (pendingMount) await pendingMount;
              continue;
            }
            if (!isMounted(mountable)) {
              const presentStates = mountable.hasAttribute(aelluxJs2.attr("present")) ? ["pop", "unpop", "dismissed"].map((name) => aelluxJs2.className(name)) : [];
              for (const name of Array.from(mountable.classList)) {
                if (name.startsWith(classPrefix) && !presentStates.includes(name)) mountable.classList.remove(name);
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
              aelluxJs2.diagnostics.error(
                aelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
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
        } catch (error) {
          aelluxJs2.diagnostics.error(
            aelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
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
        affected.classList.toggle(aelluxJs2.className("mounted"), true);
      }
      aelluxJs2.dispatch("Mount", {
        detail: {
          root: rootElement,
          extensions: extensionNames,
          elements: Array.from(newlyMounted)
        }
      });
    }
    async function AelluxJsMounted(rootElement, method, extensionNames = null, detachedOnly = false) {
      const aelluxJs2 = root2.aelluxJs;
      const selectedNames = extensionNames === null ? null : new Set((typeof extensionNames === "string" ? [extensionNames] : extensionNames).map((name) => fromCamelCase2(name)));
      if (method === UNMOUNT && !aelluxJs2.dispatch("BeforeUnmount", {
        cancelable: true,
        detail: {
          root: rootElement,
          extensions: selectedNames ? Array.from(selectedNames) : null,
          detachedOnly
        }
      })) return false;
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
            aelluxJs2.diagnostics.error(aelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT, {
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
      aelluxJs2.dispatch(toCapitalized2(method), {
        detail: __spreadValues({
          root: rootElement,
          extensions: selectedNames ? Array.from(selectedNames) : null,
          elements: Array.from(affected)
        }, detachedOnly ? { detachedOnly: true } : {})
      });
      return true;
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
      const aelluxJs2 = root2.aelluxJs;
      const diagnostics = aelluxJs2.diagnostics;
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
          element.classList.toggle(aelluxJs2.className("mounted"), isMounted(element));
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

  // src/internal/create-selector-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function validateSelector(document2, value) {
    if (typeof value !== "string" || !value.trim())
      return { value, reason: "Expected a nonempty selector string." };
    try {
      document2.querySelector(value);
      return null;
    } catch (cause) {
      return { value, reason: "Invalid CSS selector.", cause };
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
          const diagnostics = root2.aelluxJs.diagnostics;
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
      const diagnostics = root2.aelluxJs.diagnostics;
      elementOrId = resolveElementOrId(root2, elementOrId, { method: "controller" });
      if (!elementOrId) return null;
      const found = elementControllers.get(elementOrId);
      if (found) return found;
      diagnostics.error(diagnostics.ERROR_CONTROLLER_NOT_FOUND, {
        element: elementOrId,
        method: "controller",
        reason: "No completed mount exposes a controller for this element.",
        suggestion: "Register the required Extension, await $ae.mount(element), and inspect earlier load or mount diagnostics."
      });
      return null;
    }
    function keyFor(extensionName) {
      return toCamelCase2(fromCamelCase2(extensionName));
    }
    function add(options) {
      const diagnostics = root2.aelluxJs.diagnostics;
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
      if (!Object.prototype.hasOwnProperty.call(root2.aelluxJs.registry.ext, key))
        return reject("extensionName");
      const invalidSelector = validateSelector(root2.document, selector);
      if (invalidSelector) return reject("selector", invalidSelector.cause);
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
      root2.aelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
      return manager;
    }
    function remove({ extensionName, selector } = {}) {
      if (typeof extensionName !== "string" || !extensionName) return false;
      const key = keyFor(extensionName);
      const map = maps.get(key);
      if (!map) return false;
      if (hasMountedRegistration(extensionName, selector)) {
        const diagnostics = root2.aelluxJs.diagnostics;
        diagnostics.error(diagnostics.ERROR_MOUNT_MAP_IN_USE, {
          extension: fromCamelCase2(extensionName),
          selector
        });
        return false;
      }
      const removed = selector === void 0 ? true : map.delete(selector);
      if (selector === void 0 || map.size === 0) {
        maps.delete(key);
        delete root2.aelluxJs.registry.extMounters[key];
      } else if (removed) {
        root2.aelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
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

  // src/internal/create-css-motion-controller.js
  init_sample_css_easing();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createCssMotionController(root2, getAelluxJs) {
    const operations = /* @__PURE__ */ new Map();
    const lightweightProperties = /* @__PURE__ */ new Set([
      "transform",
      "opacity",
      "--ae-pop-progress",
      "--ae-dismiss-progress",
      "--ae-unpop-progress",
      "--ae-present-pop-phase",
      "--ae-present-dismiss-phase"
    ]);
    let nextId = 4e6;
    function id() {
      return nextId++;
    }
    function supported(element) {
      if (getAelluxJs().options.cssMotionController === false) return false;
      const Animation = root2.Animation;
      return !!(element && typeof element.getAnimations === "function" && Animation && Animation.prototype && typeof Animation.prototype.pause === "function" && "currentTime" in Animation.prototype);
    }
    function cancel(operationId) {
      const operation = operations.get(operationId);
      if (!operation) return false;
      operation.cancelled = true;
      getAelluxJs().waitLayout.cancel(operationId);
      const nativeResolve = operation.nativeResolve;
      release(operation, false);
      if (nativeResolve) nativeResolve({ id: operationId, status: "aborted", mode: "native" });
      return true;
    }
    function run(element, options = {}) {
      const aelluxJs2 = getAelluxJs();
      const operationId = options.id;
      if (!Number.isSafeInteger(operationId))
        return Promise.reject(new TypeError("motion.run() requires a safe integer ID"));
      if (!element || element.nodeType !== 1 || typeof options.apply !== "function")
        return Promise.reject(new TypeError("motion.run() requires an Element and apply callback"));
      cancel(operationId);
      const operation = {
        id: operationId,
        element,
        options,
        animations: [],
        before: /* @__PURE__ */ new Set(),
        start: 0,
        endTime: 0,
        done: false,
        cancelled: false,
        controlled: false,
        captureFailed: false,
        conservative: false,
        nativeTimer: null,
        nativeResolve: null
      };
      operations.set(operationId, operation);
      if (aelluxJs2.currentPreference("reduced-motion") === "reduced") {
        options.apply();
        operations.delete(operationId);
        return Promise.resolve({ id: operationId, status: "completed", mode: "reduced" });
      }
      if (!supported(element)) return nativeRun(operation);
      try {
        for (const animation of animationsFor(operation)) operation.before.add(animation);
        options.apply();
      } catch (error) {
        operations.delete(operationId);
        return Promise.reject(error);
      }
      const requestedMaxFPS = options.maxFPS === void 0 ? aelluxJs2.layoutMaxFPS(element) : options.maxFPS;
      const externalAbort = typeof options.abort === "function" ? options.abort : null;
      const shouldAbort = () => operation.cancelled || !element.isConnected || (externalAbort ? externalAbort() : false);
      const captureResult = aelluxJs2.waitLayout.sequence(operationId, {
        read: () => capture(operation),
        update: (animations) => prepare(operation, animations),
        abort: shouldAbort
      });
      return captureResult.then((sequenceResult) => {
        if (operation.cancelled || operations.get(operationId) !== operation) {
          release(operation, false);
          return { id: operationId, status: "aborted", mode: "native" };
        }
        if (sequenceResult.status !== "completed") {
          release(operation, false);
          return { id: operationId, status: sequenceResult.status, mode: "native" };
        }
        if (operation.captureFailed && !operation.cancelled) {
          release(operation, false);
          operations.set(operationId, operation);
          return nativeWait(operation);
        }
        const policyFPS = operation.conservative ? propertyPolicyFPS(aelluxJs2.options.cssMotionPropertyMaxFPS, aelluxJs2) : void 0;
        const maxFPS = minimumFPS(requestedMaxFPS, policyFPS);
        operation.visualFPS = maxFPS;
        aelluxJs2.waitLayout.setVisualFPSLimit(operation.id, maxFPS);
        return aelluxJs2.waitLayout.sequence(operationId, {
          update: () => advance(operation),
          repeat: { ms: 0 },
          abort: () => operation.done || shouldAbort()
        }).then((progressResult) => {
          const completed = operation.done && !operation.cancelled;
          release(operation, completed);
          return {
            id: operationId,
            status: completed ? "completed" : progressResult.status,
            mode: "controlled"
          };
        });
      }, (error) => {
        release(operation, false, true);
        throw error;
      });
    }
    function capture(operation) {
      operation.element.getBoundingClientRect();
      const animations = animationsFor(operation).filter((animation) => !operation.before.has(animation) && controllable(animation));
      validateMotionResourceConflicts(getAelluxJs(), operation.element, animations, operation.options.extension || "css-motion");
      return animations;
    }
    function controllable(animation) {
      try {
        const effect = animation && animation.effect;
        return !!(effect && typeof effect.getComputedTiming === "function" && typeof animation.pause === "function");
      } catch (_) {
        return false;
      }
    }
    function animationsFor(operation) {
      const { element, options } = operation;
      if (!options.subtree) return element.getAnimations();
      return [element, ...element.querySelectorAll("*")].flatMap((node) => node.getAnimations());
    }
    function prepare(operation, animations) {
      if (!animations.length) {
        operation.captureFailed = true;
        operation.done = true;
        return;
      }
      let endTime = 0;
      operation.animations = animations;
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = 0;
        const timing = animation.effect.getComputedTiming();
        const end = Number(timing.endTime);
        if (Number.isFinite(end)) endTime = Math.max(endTime, end);
        applyAelluxEasing(operation, animation);
        if (!onlyLightweightProperties(animation)) operation.conservative = true;
      }
      operation.endTime = endTime;
      operation.start = now();
      operation.controlled = true;
      if (!(endTime > 0)) operation.done = true;
    }
    function onlyLightweightProperties(animation) {
      try {
        if (typeof root2.CSSTransition === "function" && animation instanceof root2.CSSTransition) {
          return lightweightProperties.has(animation.transitionProperty);
        }
        const frames = animation.effect.getKeyframes();
        if (!frames.length) return false;
        const metadata = /* @__PURE__ */ new Set(["offset", "computedOffset", "easing", "composite"]);
        let found = false;
        for (const frame of frames) {
          for (const property of Object.keys(frame)) {
            if (metadata.has(property)) continue;
            found = true;
            if (!lightweightProperties.has(property)) return false;
          }
        }
        return found;
      } catch (_) {
        return false;
      }
    }
    function positiveFPS(value, fallback2) {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? number : fallback2;
    }
    function propertyPolicyFPS(value, aelluxJs2) {
      if (value === null || value === 0) return void 0;
      const number = Number(value);
      if (Number.isFinite(number) && number > 0) return number;
      if (value !== void 0) {
        aelluxJs2.diagnostics.warn(
          aelluxJs2.diagnostics.WARN_CSS_MOTION_PROPERTY_MAX_FPS_INVALID,
          {
            extension: "core",
            option: "cssMotionPropertyMaxFPS",
            attribute: "cssMotionPropertyMaxFPS",
            value,
            fallback: 55,
            reason: "CSS Motion frame rate must be finite and greater than zero; using 55 FPS.",
            suggestion: "Use a positive finite number or omit the option for the default."
          }
        );
      }
      return 55;
    }
    function minimumFPS(first, second) {
      const values = [first, second].filter((value) => Number.isFinite(value) && value > 0);
      return values.length ? Math.min(...values) : void 0;
    }
    function advance(operation) {
      if (!operation.controlled || operation.done) return;
      const elapsed = Math.max(0, now() - operation.start);
      const time = Math.min(elapsed, operation.endTime);
      for (const animation of operation.animations) animation.currentTime = time;
      if (elapsed >= operation.endTime) operation.done = true;
    }
    function applyAelluxEasing(operation, animation) {
      const name = operation.options.easing;
      if (!name || !root2.CSS || typeof root2.CSS.supports !== "function" || !animation.effect || typeof animation.effect.updateTiming !== "function") return;
      const easing = sampleCssEasing(getAelluxJs(), name);
      if (!easing || !root2.CSS.supports("animation-timing-function", easing)) return;
      animation.effect.updateTiming({ easing });
    }
    function nativeRun(operation) {
      let before = operation.before;
      if ((operation.options.subtree || operation.options.ownedOnly || getAelluxJs().options.environment === "development") && typeof operation.element.getAnimations === "function")
        before = new Set(animationsFor(operation));
      if (operation.options.subtree || operation.options.ownedOnly) operation.before = before;
      operation.options.apply();
      return nativeWait(operation, before);
    }
    function nativeWait(operation, before = operation.before) {
      const animations = typeof operation.element.getAnimations === "function" ? animationsFor(operation).filter((animation) => !operation.before.has(animation)) : [];
      validateMotionResourceConflicts(
        getAelluxJs(),
        operation.element,
        before === operation.before ? animations : animations.filter((animation) => !before.has(animation)),
        operation.options.extension || "css-motion"
      );
      return new Promise((resolve) => {
        operation.nativeResolve = resolve;
        const complete = () => {
          if (operations.get(operation.id) !== operation) return;
          operations.delete(operation.id);
          operation.nativeResolve = null;
          resolve({ id: operation.id, status: "completed", mode: "native" });
        };
        if (animations.length && animations.every((animation) => animation.finished && typeof animation.finished.then === "function")) {
          Promise.all(animations.map((animation) => animation.finished.catch(() => void 0))).then(complete);
          return;
        }
        const explicit = Number(operation.options.nativeDuration);
        const duration = Number.isFinite(explicit) ? explicit : cssMotionTime(operation.element);
        if (Number.isFinite(duration) && duration > 0) {
          operation.nativeTimer = root2.setTimeout(complete, duration);
        } else {
          Promise.resolve().then(complete);
        }
      });
    }
    function cssMotionTime(element) {
      try {
        const style = root2.getComputedStyle(element);
        return Math.max(
          listTime(style.animationDuration, style.animationDelay, style.animationIterationCount),
          listTime(style.transitionDuration, style.transitionDelay)
        );
      } catch (_) {
        return 0;
      }
    }
    function listTime(durations, delays, iterations) {
      const durationList = String(durations || "0s").split(",");
      const delayList = String(delays || "0s").split(",");
      const iterationList = String(iterations || "1").split(",");
      const count = Math.max(durationList.length, delayList.length, iterationList.length);
      let maximum = 0;
      for (let index = 0; index < count; index++) {
        const duration = cssTime(durationList[index % durationList.length]);
        const delay = cssTime(delayList[index % delayList.length]);
        const rawIterations = iterationList[index % iterationList.length].trim();
        const iterationCount = rawIterations === "infinite" ? 1 : Number(rawIterations);
        maximum = Math.max(maximum, Math.max(0, delay) + duration * (Number.isFinite(iterationCount) ? Math.max(0, iterationCount) : 1));
      }
      return maximum;
    }
    function cssTime(value) {
      const text = String(value || "0s").trim().toLowerCase();
      const number = parseFloat(text);
      if (!Number.isFinite(number)) return 0;
      return text.endsWith("ms") ? number : number * 1e3;
    }
    function release(operation, finish, resume = false) {
      if (operations.get(operation.id) === operation)
        getAelluxJs().waitLayout.setVisualFPSLimit(operation.id, null);
      if (operation.nativeTimer !== null) root2.clearTimeout(operation.nativeTimer);
      operation.nativeTimer = null;
      for (const animation of operation.animations) {
        try {
          if (finish) {
            animation.finish();
            if (typeof root2.CSSTransition === "function" && animation instanceof root2.CSSTransition)
              animation.cancel();
          } else if (resume) animation.play();
          else animation.cancel();
        } catch (_) {
        }
      }
      operation.animations.length = 0;
      if (operations.get(operation.id) === operation) operations.delete(operation.id);
    }
    function now() {
      return root2.performance && typeof root2.performance.now === "function" ? root2.performance.now() : Date.now();
    }
    return Object.freeze({ run, cancel, id, supported });
  }

  // src/internal/ease.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var EASE_PREFIX = "ease";
  var IN = "in";
  var OUT = "out";
  var IN_OUT = "inout";
  var DIRECTIONS = [IN_OUT, OUT, IN];
  var QUAD = "quad";
  var CUBIC = "cubic";
  var QUART = "quart";
  var QUINT = "quint";
  var SINE = "sine";
  var EXPO = "expo";
  var CIRC = "circ";
  var BACK = "back";
  var ELASTIC = "elastic";
  var BOUNCE = "bounce";
  var FAMILIES = [QUAD, CUBIC, QUART, QUINT, SINE, EXPO, CIRC, BACK, ELASTIC, BOUNCE];
  var ALIASES = {
    quadratic: QUAD,
    quartic: QUART,
    quintic: QUINT,
    sinusoidal: SINE,
    exponential: EXPO,
    circular: CIRC
  };
  var CSS_NUMBER = /^[+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?$/i;
  function bezierCoordinate(u, p1, p2) {
    const v = 1 - u;
    return 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u;
  }
  function cubicBezier(t, x1, y1, x2, y2) {
    if (![t, x1, y1, x2, y2].every((value) => typeof value === "number" && Number.isFinite(value))) {
      throw new TypeError("cubicBezier(t, x1, y1, x2, y2) requires finite numbers");
    }
    if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
      throw new RangeError("Cubic bezier x coordinates must be between 0 and 1");
    }
    t = Math.min(1, Math.max(0, t));
    if (t === 0 || t === 1) return t;
    if (x1 === y1 && x2 === y2) return t;
    let low = 0;
    let high = 1;
    let u = t;
    for (let i = 0; i < 40; i++) {
      const x = bezierCoordinate(u, x1, x2);
      if (x === t) break;
      if (x < t) low = u;
      else high = u;
      u = (low + high) / 2;
    }
    return bezierCoordinate(u, y1, y2);
  }
  function bounceOut(t) {
    const n = 7.5625;
    const d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) {
      t -= 1.5 / d;
      return n * t * t + 0.75;
    }
    if (t < 2.5 / d) {
      t -= 2.25 / d;
      return n * t * t + 0.9375;
    }
    t -= 2.625 / d;
    return n * t * t + 0.984375;
  }
  function easeIn(family, t) {
    switch (family) {
      case QUAD:
        return t * t;
      case CUBIC:
        return t * t * t;
      case QUART:
        return t * t * t * t;
      case QUINT:
        return t * t * t * t * t;
      case SINE:
        return 1 - Math.cos(t * Math.PI / 2);
      case EXPO:
        return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
      case CIRC:
        return 1 - Math.sqrt(1 - t * t);
      case BACK:
        return t * t * (2.70158 * t - 1.70158);
      case ELASTIC:
        return t === 0 || t === 1 ? t : -Math.pow(2, 10 * t - 10) * Math.sin((10 * t - 10.75) * 2 * Math.PI / 3);
      case BOUNCE:
        return 1 - bounceOut(1 - t);
      default:
        throw new RangeError(`Unknown easing family: ${family}`);
    }
  }
  function ease(name, t) {
    if (typeof name !== "string" || typeof t !== "number" || !Number.isFinite(t)) {
      throw new TypeError("ease(name, t) requires a name and a finite number");
    }
    t = Math.min(1, Math.max(0, t));
    const bezier = /^cubic-bezier\(([^()]*)\)$/i.exec(name.trim());
    if (bezier) {
      const points = bezier[1].split(",").map((value) => value.trim());
      if (points.length !== 4 || !points.every((value) => CSS_NUMBER.test(value))) {
        throw new RangeError(`Invalid cubic bezier: ${name}`);
      }
      return cubicBezier(t, ...points.map(Number));
    }
    let key = name.replace(/[\s_-]/g, "").toLowerCase();
    if (key.startsWith(EASE_PREFIX)) key = key.slice(EASE_PREFIX.length);
    if (key === "linear") return t;
    if (key === "smoothstep") return t * t * (3 - 2 * t);
    if (key === "smootherstep") return t * t * t * (t * (6 * t - 15) + 10);
    let family = "";
    let direction = "";
    for (const candidate of DIRECTIONS) {
      if (key.endsWith(candidate)) {
        family = key.slice(0, -candidate.length);
        direction = candidate;
        break;
      }
      if (key.startsWith(candidate)) {
        family = key.slice(candidate.length);
        direction = candidate;
        break;
      }
    }
    family = ALIASES[family] || family;
    if (!FAMILIES.includes(family)) throw new RangeError(`Unknown easing: ${name}`);
    if (direction === IN) return easeIn(family, t);
    if (direction === OUT) return 1 - easeIn(family, 1 - t);
    if (family === BACK) {
      const c = 1.70158 * 1.525;
      const x = t < 0.5 ? 2 * t : 2 * t - 2;
      return t < 0.5 ? x * x * ((c + 1) * x - c) / 2 : (x * x * ((c + 1) * x + c) + 2) / 2;
    }
    if (family === ELASTIC) {
      if (t === 0 || t === 1) return t;
      const wave = Math.sin((20 * t - 11.125) * 2 * Math.PI / 4.5);
      return t < 0.5 ? -Math.pow(2, 20 * t - 10) * wave / 2 : Math.pow(2, -20 * t + 10) * wave / 2 + 1;
    }
    return t < 0.5 ? easeIn(family, 2 * t) / 2 : 1 - easeIn(family, 2 - 2 * t) / 2;
  }

  // src/aellux.orchestrator.js
  init_utils_name_case();

  // src/official-extension-definitions.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var officialExtensionDefinitions = Object.freeze([
    Object.freeze({ name: "preference", style: false, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "state-navigation", style: false, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "feedback", style: true, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "focus", style: false, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "dialog", optional: true, style: false, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "progress", optional: true, style: false, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "pwa", optional: true, style: false, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "viewport", style: false, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "input", style: true, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "anchor", style: true, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "overflow-marquee", optional: true, style: true, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "ajax-href", optional: true, style: false, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "scrollbox", style: true, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "scrollbox-snap", optional: true, style: false, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "adaptive", style: true, dependencies: Object.freeze([]) }),
    Object.freeze({ name: "present", style: true, dependencies: Object.freeze([]) })
  ]);

  // src/aellux.orchestrator.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root2) {
    "use strict";
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const officialPackage = "@aelluxjs/core";
    const orchestratorVersion = true ? "0.1.0-beta.10" : "0.1.0-beta.10";
    if (root2.aelluxJs.version !== orchestratorVersion) {
      const error = root2.aelluxJs.diagnostics.error(
        root2.aelluxJs.diagnostics.ERROR_RUNTIME_VERSION_MISMATCH,
        { expected: root2.aelluxJs.version, found: orchestratorVersion }
      );
      root2.aelluxJs.orchestratorVersion = orchestratorVersion;
      root2.aelluxJs.startAelluxJs = () => Promise.reject(error);
      return;
    }
    root2.aelluxJs.orchestratorVersion = orchestratorVersion;
    const extensionPromises = {};
    const aria = createAriaHelper();
    const mountManager = buildMountMapManager(root2);
    const layoutScheduler = buildLayoutScheduler();
    const motion = createCssMotionController(root2, () => root2.aelluxJs);
    root2.aelluxJs = Object.assign(
      root2.aelluxJs,
      {
        async startAelluxJs() {
          if (root2.aelluxJs.bundledExtensions) {
            Object.keys(root2.aelluxJs.bundledExtensions).forEach((key) => {
              if (!(key in aelluxJs.registry.ext)) aelluxJs.ext(key);
              const name = fromCamelCase2(key);
              const metadata = aelluxJs.extIndex.official && aelluxJs.extIndex.official.extensions[name];
              if (metadata && metadata.coreCompatibility) {
                aelluxJs.registry.ext[key].coreCompatibility = metadata.coreCompatibility;
                aelluxJs.registry.ext[key].official = true;
              }
            });
          }
          await new Promise((resolve, reject) => {
            const startCallback = function() {
              aelluxJs.off("$DOMContentLoaded", startCallback);
              if (aelluxJs.options.skipGlobalMount === true) {
                resolve();
                return;
              }
              Promise.resolve().then(() => aelluxJs.mount()).then(resolve, reject);
            };
            if (document.readyState === "loading")
              aelluxJs.on("$DOMContentLoaded", startCallback, { once: true });
            else
              startCallback();
          }).catch((error) => {
            aelluxJs.dispatch("RuntimeStartError", { detail: { error, operation: "mount" } });
            throw error;
          });
          aelluxJs.dispatch("Ready");
          return true;
        },
        async mount(elementOrId, extensionNames = null) {
          return mountManager.mount(elementOrId, extensionNames);
        },
        async unmount(elementOrId, extensionNames = null) {
          return mountManager.unmount(elementOrId, extensionNames);
        },
        async destroy() {
          if (await destroyExtensions(null, () => aelluxJs.waitLayout.clear()) === false)
            return false;
          mountManager.destroy();
          aelluxJs.comm.clear();
        },
        async destroyExtensions(extensionNames) {
          return destroyExtensions(extensionNames);
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
              aelluxJs.eventName(event),
              options
            )
          );
        },
        wait(extensionName) {
          return getExtension(extensionName);
        },
        request: defaultRequest,
        ease,
        aria,
        motion,
        waitLayout: layoutScheduler,
        mountManager
      }
    );
    root2[root2.aelluxJs.shortJSName] = root2.aelluxJs;
    if (root2.aelluxJs.options.mode === "full") registerCoreExtensions();
    function registerCoreExtensions() {
      const api = root2.aelluxJs;
      const attr = (name) => `[${api.attr(name)}]`;
      for (const { name, optional, style } of officialExtensionDefinitions) {
        const key = toCamelCase2(name);
        if (key in api.registry.ext) continue;
        let loadWhen = name === "dialog" ? "dialog" : attr(name);
        if (name === "progress") loadWhen = "progress, meter";
        if (name === "ajax-href") loadWhen = "a" + loadWhen;
        if (name === "present") {
          loadWhen = ["present", "present-group", "present-trigger"].map(attr).join(",");
        }
        if (name === "input") loadWhen = ["point", "inputs", "shortcut", "shortcut-hint"].map(attr).join(",");
        if (name === "focus") loadWhen = ["focus", "focus-scope", "focus-nav", "shortcut"].map(attr).join(",");
        if (name === "state-navigation" || name === "preference") loadWhen = null;
        api.ext(name, { loadWhen, load: true, loadStyle: !!(optional && style) });
        api.registry.ext[key].automatic = true;
      }
    }
    async function destroyExtensions(extensionNames, onUnmounted) {
      if (typeof extensionNames === "string") extensionNames = [extensionNames];
      if (!extensionNames) extensionNames = Object.keys(aelluxJs.registry.ext);
      extensionNames = extensionNames.map((_) => fromCamelCase2(_));
      try {
        if (await aelluxJs.unmount(document, extensionNames) === false) return false;
      } catch (error) {
        aelluxJs.diagnostics.error(
          aelluxJs.diagnostics.ERROR_EXTENSION_UNMOUNT,
          { cause: error, extensions: extensionNames }
        );
      }
      if (onUnmounted) onUnmounted();
      for (const extensionName of extensionNames) {
        const key = toCamelCase2(extensionName);
        let extension;
        try {
          if (!extensionPromises[key]) continue;
          extension = await extensionPromises[key];
          if (extension && extension.destroy) await extension.destroy();
        } catch (error) {
          aelluxJs.diagnostics.error(
            aelluxJs.diagnostics.ERROR_EXTENSION_DESTROY,
            { cause: error, extension: extensionName }
          );
        } finally {
          aelluxJs.comm.removeOwner(extensionName);
          if (key !== extensionName) aelluxJs.comm.removeOwner(key);
          aelluxJs.comm.emit("extension.destroyed", { extension: extensionName });
          aelluxJs.dispatch("ExtensionDestroy", { detail: { extension: extensionName } });
          delete aelluxJs.ext[key];
          delete extensionPromises[key];
          delete aelluxJs.registry.ext[key];
          mountManager.remove({ extensionName });
          delete aelluxJs.registry.lazyExtSelectors[key];
          removeExtensionAssets(extensionName);
          if (extension) extension.initialized = false;
        }
      }
    }
    function getExtension(extensionName) {
      const request = parseExtensionRequest(extensionName);
      extensionName = request.name;
      const key = toCamelCase2(extensionName);
      if (extensionPromises[key])
        return extensionPromises[key];
      if (!(key in aelluxJs.registry.ext)) {
        return Promise.reject(aelluxJs.diagnostics.error(
          aelluxJs.diagnostics.ERROR_EXTENSION_NOT_REGISTERED,
          { extension: extensionName }
        ));
      }
      aelluxJs.registry.ext[key].automatic = false;
      if (aelluxJs.ext[key]) {
        if (aelluxJs.ext[key].initialized) {
          extensionPromises[key] = Promise.resolve(aelluxJs.ext[key]);
        } else {
          const registration = aelluxJs.registry.ext[key];
          extensionPromises[key] = (registration.loadStyle && registration.loadStyle !== "false" ? appendExtensionAssets(extensionName) : Promise.resolve()).then(() => extensionInitialize(extensionName)).catch((error) => {
            if (!error || !error.aelluxCompatibility) {
              aelluxJs.diagnostics.error(
                aelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
                { cause: error, extension: extensionName }
              );
            }
            delete extensionPromises[key];
            return null;
          });
        }
        return extensionPromises[key];
      }
      const bundledLoader = aelluxJs.bundledExtensions ? aelluxJs.bundledExtensions[key] : null;
      extensionPromises[key] = Promise.resolve().then(() => {
        const registration = aelluxJs.registry.ext[key];
        return (registration.implicit || request.version) && !bundledLoader && !aelluxJs.ext[key] ? resolveImplicitRegistration(extensionName, registration, request.version) : registration;
      }).then(async (data) => {
        if (!hasCompatibleBuild(data)) {
          aelluxJs.diagnostics.error(
            aelluxJs.diagnostics.ERROR_EXTENSION_INCOMPATIBLE,
            {
              extension: extensionName,
              runtime: aelluxJs.diagnostics.legacy ? "legacy" : "modern",
              builds: data && data.builds
            }
          );
          delete aelluxJs.registry.lazyExtSelectors[key];
          return null;
        }
        if (!aelluxJs.ext[key]) await appendExtensionAssets(extensionName, bundledLoader);
        if (!aelluxJs.ext[key].initialized) return extensionInitialize(extensionName);
        return aelluxJs.ext[key];
      }).catch((error) => {
        if (!error || !error.aelluxCompatibility) {
          const registration = aelluxJs.registry.ext[key];
          if (registration && registration.implicit && !registration.manifestResolved) {
            aelluxJs.diagnostics.error(
              aelluxJs.diagnostics.ERROR_EXTENSION_INDEX_NOT_FOUND,
              { extension: extensionName }
            );
          }
          aelluxJs.diagnostics.error(
            aelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
            { cause: error, extension: extensionName }
          );
        }
        delete extensionPromises[key];
        return null;
      });
      return extensionPromises[key];
    }
    function parseExtensionRequest(value) {
      const text = String(value || "").trim();
      const match = /^([a-z][a-z0-9-]*)(?:@([0-9]+(?:\.[0-9]+){0,2}(?:-[0-9A-Za-z.-]+)?))?$/i.exec(text);
      return { name: fromCamelCase2(match ? match[1] : text), version: match && match[2] || null };
    }
    async function extensionInitialize(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const registration = aelluxJs.registry.ext[key];
      if (registration.coreCompatibility && !versionSatisfies(aelluxJs.version, registration.coreCompatibility)) {
        const context = {
          extension: extensionName,
          coreVersion: aelluxJs.version,
          coreCompatibility: registration.coreCompatibility
        };
        if (registration.skipCompatibilityCheck === true) {
          aelluxJs.diagnostics.warn(
            aelluxJs.diagnostics.WARN_EXTENSION_COMPATIBILITY_SKIPPED,
            __spreadProps(__spreadValues({}, context), { explicitlySkipped: true })
          );
        } else {
          const error = aelluxJs.diagnostics.error(
            aelluxJs.diagnostics.ERROR_EXTENSION_VERSION_INCOMPATIBLE,
            context
          );
          error.aelluxCompatibility = true;
          throw error;
        }
      }
      const options = aelluxJs.options.extensions[key] || {};
      try {
        await aelluxJs.ext[key].init(options);
      } catch (cause) {
        aelluxJs.comm.removeOwner(extensionName);
        if (key !== extensionName) aelluxJs.comm.removeOwner(key);
        throw cause;
      }
      aelluxJs.ext[key].initialized = true;
      delete aelluxJs.registry.lazyExtSelectors[key];
      return aelluxJs.ext[key];
    }
    async function appendExtensionAssets(extensionName, bundledLoader = null) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const data = aelluxJs.registry.ext[key];
      const useLegacyBuild = aelluxJs.diagnostics.legacy || data.builds.indexOf("modern") === -1;
      const artifact = data.artifacts && data.artifacts[useLegacyBuild ? "legacy" : "modern"];
      const url = data.url.replace(/^\.\//, aelluxJs.aelluxBasePath);
      const scriptURL = artifact ? artifact.url : useLegacyBuild ? toLegacyScriptURL(url) : url;
      const minifiedScript = /\.min\.js(?=[?#]|$)/.test(scriptURL);
      const scriptVariant = useLegacyBuild ? minifiedScript ? "legacyMin" : "legacy" : minifiedScript ? "modernMin" : "modern";
      const loadPromises = [];
      for (const dependency of data.dependencies || []) {
        if (typeof dependency === "string") continue;
        loadPromises.push(aelluxJs.dep(
          dependency.label,
          dependency.url,
          { integrity: dependency.integrity, crossOrigin: dependency.crossOrigin }
        ));
      }
      if (bundledLoader) {
        loadPromises.push(Promise.resolve().then(() => bundledLoader()));
      } else if (!aelluxJs.ext[key]) {
        loadPromises.push(new Promise(
          (resolve, reject) => {
            const attr = aelluxJs.attr("ext");
            const script = document.createElement("script");
            script.src = scriptURL;
            script.setAttribute(attr, extensionName);
            applyAssetIntegrity(script, artifact && artifact.integrity || getExtensionIntegrity(data, scriptVariant, scriptURL), data.crossOrigin);
            assetLoadHelper(script, {
              loadCallback: resolve,
              errorCallback: reject
            });
          }
        ));
      }
      const defaultStyle = data.loadStyle === true || data.loadStyle === "true";
      const fullStyle = bundledLoader && document.querySelector(`link[${aelluxJs.attr("full-style")}]`);
      if (data.loadStyle && data.loadStyle !== "false" && !(defaultStyle && fullStyle)) {
        loadPromises.push(new Promise(
          (resolve) => {
            const styleDefaultURL = data.loadStyle === true || data.loadStyle === "true" || data.loadStyle === "";
            const href = data.styleArtifact ? data.styleArtifact.url : styleDefaultURL ? url.replace(/\.js(?=[?#]|$)/, ".css") : data.loadStyle;
            const attrStyle = aelluxJs.attr("ext-style");
            const link = document.createElement("link");
            link.href = href;
            link.rel = "stylesheet";
            link.setAttribute(attrStyle, extensionName);
            applyAssetIntegrity(link, data.styleArtifact && data.styleArtifact.integrity || getExtensionIntegrity(data, "style", href), data.crossOrigin);
            assetLoadHelper(link, {
              loadCallback: resolve,
              errorCallback: () => {
                aelluxJs.diagnostics.warn(
                  aelluxJs.diagnostics.WARN_EXTENSION_STYLE_LOAD,
                  {
                    extension: extensionName,
                    element: link,
                    attribute: "href",
                    value: link.href,
                    url: link.href,
                    reason: "The Extension stylesheet could not be loaded.",
                    suggestion: "Check the stylesheet URL, network response, integrity metadata and CSP style-src policy."
                  }
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
      const basePath = aelluxJs.aelluxBasePath;
      if (!url.startsWith(basePath)) return null;
      const filename = url.slice(basePath.length);
      const builtin = aelluxJs.coreAssetIntegrity;
      return builtin && Object.prototype.hasOwnProperty.call(builtin, filename) ? builtin[filename] : null;
    }
    function applyAssetIntegrity(asset, integrity, crossOrigin) {
      if (integrity) asset.setAttribute("integrity", integrity);
      if (integrity || crossOrigin || aelluxJs.options.crossOrigin) {
        asset.setAttribute("crossorigin", crossOrigin || aelluxJs.options.crossOrigin || "anonymous");
      }
    }
    function toLegacyScriptURL(url) {
      return url.replace(
        /(?:\.legacy)?(?:\.min)?\.js(?=[?#]|$)/,
        ".legacy" + (aelluxJs.minified ? ".min" : "") + ".js"
      );
    }
    function removeExtensionAssets(extensionName) {
      const scriptAttribute = aelluxJs.attr("ext");
      const styleAttribute = aelluxJs.attr("ext-style");
      document.querySelectorAll(`script[${scriptAttribute}], link[${styleAttribute}]`).forEach((asset) => {
        if (asset.getAttribute(scriptAttribute) === extensionName || asset.getAttribute(styleAttribute) === extensionName) {
          asset.remove();
        }
      });
    }
    async function resolveImplicitRegistration(extensionName, registration, requestedVersion = null) {
      const officialURL = aelluxJs.extIndex.officialURL || aelluxJs.aelluxBasePath + "aellux.extensions.min.json";
      const requestedURL = requestedVersion && requestedVersion !== aelluxJs.version ? `https://cdn.jsdelivr.net/npm/${officialPackage}@${encodeURIComponent(requestedVersion)}/dist/aellux.extensions.min.json` : officialURL;
      let entry = null;
      let sourceURL = requestedURL;
      try {
        const embeddedOfficial = requestedVersion ? null : aelluxJs.extIndex.official;
        const embeddedEntry = embeddedOfficial && embeddedOfficial.extensions[extensionName];
        const official = embeddedEntry && embeddedEntry.builds ? embeddedOfficial : await loadExtensionIndex(requestedVersion ? `official@${requestedVersion}` : "official", requestedURL);
        entry = official.extensions[extensionName] || null;
      } catch (error) {
        reportIndexFailure(error, "official", requestedURL);
      }
      if (!entry && aelluxJs.extIndex.fallbackURL) {
        sourceURL = aelluxJs.extIndex.fallbackURL;
        try {
          const fallback2 = aelluxJs.extIndex.fallback || await loadExtensionIndex("fallback", sourceURL);
          entry = fallback2.extensions[extensionName] || null;
        } catch (error) {
          reportIndexFailure(error, "custom", sourceURL);
        }
      }
      if (!entry) return registration;
      applyManifestEntry(registration, entry, sourceURL, extensionName);
      return registration;
    }
    function loadExtensionIndex(kind, url) {
      const promiseKey = kind + "Promise";
      if (aelluxJs.extIndex[promiseKey]) return aelluxJs.extIndex[promiseKey];
      validateManifestURL(url, kind);
      aelluxJs.extIndex[promiseKey] = aelluxJs.request(url).then((response) => response.json()).then((index) => {
        validateExtensionIndex(index, kind, url);
        aelluxJs.extIndex[kind] = index;
        aelluxJs.diagnostics.info(
          aelluxJs.diagnostics.INFO_EXTENSION_INDEX_LOADED,
          { source: kind, url, extensions: Object.keys(index.extensions).length }
        );
        return index;
      }).catch((error) => {
        aelluxJs.extIndex[promiseKey] = null;
        throw error;
      });
      return aelluxJs.extIndex[promiseKey];
    }
    function validateManifestURL(url, kind) {
      let parsed;
      try {
        parsed = new URL(url, document.baseURI);
      } catch (_) {
        throw manifestError(kind, url, "valid URL");
      }
      const development = aelluxJs.options.environment === "development";
      if (parsed.protocol !== "https:" && parsed.origin !== location.origin && !development) {
        throw manifestError(kind, url, "HTTPS for external manifests");
      }
    }
    function validateExtensionIndex(index, kind, url) {
      if (!index || index.schemaVersion !== 1 || typeof index.coreVersion !== "string" || !index.extensions || typeof index.extensions !== "object" || Array.isArray(index.extensions)) {
        throw manifestError(kind, url, "schemaVersion 1, coreVersion, and extensions object");
      }
      if (index.coreVersion !== aelluxJs.version) {
        throw manifestError(
          kind,
          url,
          `coreVersion ${aelluxJs.version} (received ${index.coreVersion})`
        );
      }
      for (const [name, entry] of Object.entries(index.extensions)) {
        if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || !entry || typeof entry.coreCompatibility !== "string" || !entry.builds || typeof entry.builds !== "object") {
          throw manifestError(kind, url, `valid metadata for ${name}`);
        }
        for (const variant of ["modern", "legacy"]) {
          const artifact = entry.builds[variant];
          if (!artifact) continue;
          if (typeof artifact.url !== "string" || typeof artifact.integrity !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(artifact.integrity)) {
            throw manifestError(kind, url, `URL and SHA-384 integrity for ${name}/${variant}`);
          }
          validateArtifactURL(artifact.url, url, kind);
          if (artifact.regular) {
            if (typeof artifact.regular.url !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(artifact.regular.integrity || "")) {
              throw manifestError(kind, url, `regular URL and SHA-384 integrity for ${name}/${variant}`);
            }
            validateArtifactURL(artifact.regular.url, url, kind);
          }
        }
        if (!entry.builds.modern && !entry.builds.legacy)
          throw manifestError(kind, url, `a runtime build for ${name}`);
        if (entry.style) {
          if (typeof entry.style.url !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(entry.style.integrity || "")) {
            throw manifestError(kind, url, `URL and SHA-384 integrity for ${name}/style`);
          }
          validateArtifactURL(entry.style.url, url, kind);
          if (entry.style.regular) {
            if (typeof entry.style.regular.url !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(entry.style.regular.integrity || "")) {
              throw manifestError(kind, url, `regular URL and SHA-384 integrity for ${name}/style`);
            }
            validateArtifactURL(entry.style.regular.url, url, kind);
          }
        }
        if (!Array.isArray(entry.dependencies)) {
          throw manifestError(kind, url, `dependencies array for ${name}`);
        }
        for (const dependency of entry.dependencies) {
          if (typeof dependency === "string") continue;
          if (!dependency || typeof dependency.label !== "string" || !dependency.label.trim() || typeof dependency.url !== "string" || typeof dependency.integrity !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(dependency.integrity)) {
            throw manifestError(kind, url, `dependency URL and SHA-384 integrity for ${name}`);
          }
          validateArtifactURL(dependency.url, url, kind);
        }
      }
    }
    function validateArtifactURL(url, manifestURL, kind) {
      let parsed;
      try {
        parsed = new URL(url, new URL(manifestURL, document.baseURI));
      } catch (_) {
        throw manifestError(kind, manifestURL, `valid artifact URL: ${url}`);
      }
      const development = aelluxJs.options.environment === "development";
      if (parsed.protocol !== "https:" && parsed.origin !== location.origin && !development)
        throw manifestError(kind, manifestURL, `HTTPS artifact URL: ${url}`);
    }
    function manifestError(kind, url, expected) {
      return aelluxJs.diagnostics.create(
        aelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID,
        { source: kind, url, expected }
      );
    }
    function reportIndexFailure(error, source, url) {
      if (error && error.code === aelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID.code) {
        aelluxJs.diagnostics.error(
          aelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID,
          { source, url, expected: error.context && error.context.expected, cause: error }
        );
      } else {
        aelluxJs.diagnostics.error(
          aelluxJs.diagnostics.ERROR_EXTENSION_INDEX_LOAD,
          { source, url, cause: error }
        );
      }
    }
    function applyManifestEntry(registration, entry, manifestURL, extensionName) {
      const base = new URL(manifestURL, document.baseURI);
      const artifacts = {};
      for (const variant of ["modern", "legacy"]) {
        if (entry.builds[variant] && (!registration.explicitBuilds || registration.builds.includes(variant))) {
          const declared = !aelluxJs.minified && entry.builds[variant].regular ? entry.builds[variant].regular : entry.builds[variant];
          artifacts[variant] = {
            url: new URL(declared.url, base).href,
            integrity: declared.integrity
          };
        }
      }
      const selected = artifacts[aelluxJs.diagnostics.legacy ? "legacy" : "modern"] || !aelluxJs.diagnostics.legacy && artifacts.legacy;
      registration.artifacts = artifacts;
      registration.manifestResolved = true;
      registration.builds = Object.keys(artifacts);
      if (selected) registration.url = selected.url;
      registration.coreCompatibility = entry.coreCompatibility;
      registration.dependencies = (entry.dependencies || []).map((dependency) => typeof dependency === "string" ? dependency : __spreadProps(__spreadValues({}, dependency), {
        url: new URL(dependency.url, base).href
      }));
      registration.official = aelluxJs.extIndex.official && aelluxJs.extIndex.official.extensions[extensionName] === entry;
      if (entry.style && registration.loadStyle && registration.loadStyle !== "false") {
        const declaredStyle = !aelluxJs.minified && entry.style.regular ? entry.style.regular : entry.style;
        registration.styleArtifact = {
          url: new URL(declaredStyle.url, base).href,
          integrity: declaredStyle.integrity
        };
      }
    }
    function versionSatisfies(version, range) {
      if (typeof range !== "string" || !range.trim()) return true;
      return range.split("||").some((group) => group.trim().split(/\s+/).every((token) => {
        if (token === "*" || token.toLowerCase() === "latest") return true;
        const match = token.match(/^(\^|~|>=|<=|>|<|=)?(.+)$/);
        if (!match) return false;
        const operator = match[1] || "=";
        const comparison = compareVersions(version, match[2]);
        if (operator === "=") return comparison === 0;
        if (operator === ">") return comparison > 0;
        if (operator === ">=") return comparison >= 0;
        if (operator === "<") return comparison < 0;
        if (operator === "<=") return comparison <= 0;
        const current = parseVersion(version);
        const expected = parseVersion(match[2]);
        if (!current || !expected || comparison < 0) return false;
        if (operator === "~") return current[0] === expected[0] && current[1] === expected[1];
        return expected[0] > 0 ? current[0] === expected[0] : expected[1] > 0 ? current[0] === 0 && current[1] === expected[1] : current[0] === 0 && current[1] === 0 && current[2] === expected[2];
      }));
    }
    function compareVersions(first, second) {
      const a = parseVersion(first);
      const b = parseVersion(second);
      if (!a || !b) return first === second ? 0 : -1;
      for (let index = 0; index < 3; index++) if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
      if (a[3] === b[3]) return 0;
      if (!a[3]) return 1;
      if (!b[3]) return -1;
      return a[3] > b[3] ? 1 : -1;
    }
    function parseVersion(version) {
      const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] || ""] : null;
    }
    function hasCompatibleBuild(data) {
      if (!data || !Array.isArray(data.builds) || data.builds.length === 0) return false;
      if (aelluxJs.diagnostics.legacy) return data.builds.indexOf("legacy") !== -1;
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
  root.aelluxJs.bundledExtensions = Object.freeze({
    "preference": () => Promise.resolve().then(() => (init_aellux_ext_preference(), aellux_ext_preference_exports)),
    "stateNavigation": () => Promise.resolve().then(() => (init_aellux_ext_state_navigation(), aellux_ext_state_navigation_exports)),
    "feedback": () => Promise.resolve().then(() => (init_aellux_ext_feedback(), aellux_ext_feedback_exports)),
    "focus": () => Promise.resolve().then(() => (init_aellux_ext_focus(), aellux_ext_focus_exports)),
    "input": () => Promise.resolve().then(() => (init_aellux_ext_input(), aellux_ext_input_exports)),
    "anchor": () => Promise.resolve().then(() => (init_aellux_ext_anchor(), aellux_ext_anchor_exports)),
    "viewport": () => Promise.resolve().then(() => (init_aellux_ext_viewport(), aellux_ext_viewport_exports)),
    "scrollbox": () => Promise.resolve().then(() => (init_aellux_ext_scrollbox(), aellux_ext_scrollbox_exports)),
    "adaptive": () => Promise.resolve().then(() => (init_aellux_ext_adaptive(), aellux_ext_adaptive_exports)),
    "present": () => Promise.resolve().then(() => (init_aellux_ext_present(), aellux_ext_present_exports))
  });
})();
//# sourceMappingURL=aellux.full.js.map
