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
          AelluxJs2.mountManager.add(
            extensionName,
            `[${attr.preference}]`,
            mountPreferenceContainer,
            unmountPreferenceContainer
          );
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
          Object.entries(prefOptions).forEach(([param, options2]) => defaultPreferences[param] = options2[0]);
          loadUserPreferences();
          update();
        }
        function destroy() {
          AelluxJs2.mountManager.remove(extensionName);
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
          Object.assign(computedPreferences, defaultPreferences, userPreferences);
          AelluxJs2.updatePreferenceAttributesHTML(computedPreferences);
          document.querySelectorAll(`[${attr.preference}]`).forEach((container) => updateContainer(container));
          AelluxJs2.dispatch("PreferencesChange");
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
          AelluxJs2.persist.preferences.setObject(userPreferences);
        }
        function loadUserPreferences() {
          Object.assign(userPreferences, AelluxJs2.persist.preferences.getObject());
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
          tabOpen,
          ajaxHref,
          flowStep,
          formFocus,
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
          if ("useHash" in AelluxJs2.options) {
            useHash = AelluxJs2.options.useHash;
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
          baseTitle = title;
        }
        function tabOpen(tabGroupId, tabId, title) {
          return change(tabGroupId, tabId, title);
        }
        function ajaxHref(url, selectors) {
          history.replaceState({ aelluxJsState: true, snapshot: globalSnapshot, ajaxHref: selectors }, "", window.location.href);
          updateSnapshotData();
          history.pushState({ aelluxJsState: true, snapshot: null, ajaxHref: selectors }, "", url);
        }
        function flowStep(flowId, stepId, title) {
          return change(flowId, stepId, title);
        }
        function formFocus(formId, focusId, title) {
          return change(formId, focusId, title);
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
          AelluxJs2.dispatch(name, options);
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
          if (browserState.ajaxHref && AelluxJs2.ext.ajaxHref) {
            AelluxJs2.ext.ajaxHref.load(
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
        const initialClasses = /* @__PURE__ */ new WeakMap();
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
        let managedClasses = getManagedClasses();
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
          AelluxJs2.mountManager.add(
            extensionName,
            `[${attr.adaptive}]`,
            mountAdaptive,
            unmountAdaptive
          );
        }
        function getManagedClasses() {
          return [
            modifier.shapeHorizontal,
            modifier.shapeVertical,
            modifier.shapeSquare,
            ...Object.keys(adaptiveParams.minSizes).map((size) => AelluxJs2.className("fits-" + size))
          ];
        }
        function destroy() {
          for (const element of adaptiveElements) unmountAdaptive(element);
          if (resizeObserver) resizeObserver.disconnect();
          AelluxJs2.mountManager.remove(extensionName);
        }
        function mountAdaptive(element) {
          if (adaptiveElements.has(element)) return;
          initialClasses.set(element, managedClasses.filter((name) => element.classList.contains(name)));
          adaptiveElements.add(element);
          const bounds = element.getBoundingClientRect();
          updateAdaptive(element, bounds.width, bounds.height);
          if (resizeObserver) resizeObserver.observe(element);
          else if (adaptiveElements.size === 1) root2.addEventListener("resize", onWindowResize);
        }
        function unmountAdaptive(element) {
          if (!adaptiveElements.delete(element)) return;
          if (resizeObserver) resizeObserver.unobserve(element);
          else if (adaptiveElements.size === 0) root2.removeEventListener("resize", onWindowResize);
          const initial = initialClasses.get(element) || [];
          for (const name of managedClasses) {
            element.classList.toggle(name, initial.includes(name));
          }
          initialClasses.delete(element);
        }
        function onResize(entries) {
          for (const entry of entries) {
            if (adaptiveElements.has(entry.target)) {
              updateAdaptive(entry.target, entry.contentRect.width, entry.contentRect.height);
            }
          }
        }
        function onWindowResize() {
          for (const element of adaptiveElements) {
            const bounds = element.getBoundingClientRect();
            updateAdaptive(element, bounds.width, bounds.height);
          }
        }
        function updateAdaptive(element, width, height) {
          const ratio = height > 0 ? width / height : 0;
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
          for (const [size, minimum] of Object.entries(adaptiveParams.minSizes)) {
            element.classList.toggle(AelluxJs2.className("fits-" + size), space >= minimum);
          }
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
          //selector
          target: AelluxJs2.attr("target")
          //selector
        };
        const className = {
          pop: AelluxJs2.className("pop"),
          popping: AelluxJs2.className("popping"),
          unpopping: AelluxJs2.className("unpopping")
        };
        AelluxJs2.extAttach(extensionName, {
          init,
          destroy,
          pop,
          unpop,
          toggle,
          trigger
        });
        const POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", ARIA_EXPANDED = "aria-expanded", ARIA_CONTROLS = "aria-controls";
        const presentElements = /* @__PURE__ */ new Map();
        const triggerElementsSet = /* @__PURE__ */ new Set();
        const triggerTargets = /* @__PURE__ */ new Map();
        const initialTriggerControls = /* @__PURE__ */ new WeakMap();
        const attrMemoryUsers = /* @__PURE__ */ new WeakMap();
        const initialAttributes = [
          "hidden",
          ARIA_EXPANDED,
          ARIA_CONTROLS,
          attr.presentMotion
        ];
        function init(options) {
          AelluxJs2.mountManager.add(
            extensionName,
            `[${attr.present}]`,
            mountPresentContainer,
            unmountPresentContainer,
            null,
            ["pop", "unpop", "trigger", "toggle"]
          );
          AelluxJs2.mountManager.add(
            extensionName,
            `[${[
              attr.trigger,
              attr.dismiss,
              attr.target
            ].join("],[")}]`,
            mountTriggerElement,
            unmountTriggerElement,
            null,
            null
          );
          document.addEventListener("click", OnClick);
        }
        function destroy() {
          AelluxJs2.mountManager.remove(extensionName);
          document.removeEventListener("click", OnClick);
          for (const triggerElement of triggerElementsSet) {
            unmountTriggerElement(triggerElement);
          }
          for (const element of presentElements.keys()) {
            unmountPresentContainer(element);
          }
          triggerTargets.clear();
        }
        function mountPresentContainer(element) {
          if (presentElements.has(element)) return;
          const presentMotion = element.querySelector(`:scope>[${attr.presentMotion}]`) || element;
          rememberAttributes(element);
          if (presentMotion !== element) rememberAttributes(presentMotion);
          if (presentMotion === element) {
            if (!presentMotion.hasAttribute(attr.presentMotion))
              presentMotion.setAttribute(attr.presentMotion, "auto");
          } else {
            if (!element.hidden) {
              element.hidden = presentMotion.hidden;
            }
            presentMotion.hidden = false;
          }
          const presentController = {
            interruptTransition: null,
            direction: null,
            timeout: null,
            presentMotion,
            classList: presentMotion.classList,
            triggers: /* @__PURE__ */ new Set(),
            setAriaExpanded: function(value) {
              element.setAttribute(ARIA_EXPANDED, value);
              this.triggers.forEach(updateTriggerAriaExpanded);
            },
            stop: function() {
              this.classList.remove(...Object.values(className));
              if (this.interruptTransition !== null && typeof this.interruptTransition === "function") {
                this.interruptTransition(
                  AelluxJs2.diagnostics.create(
                    AelluxJs2.diagnostics.WARN_INTERRUPTION,
                    { extensionName }
                  )
                );
                this.interruptTransition = null;
              }
              if (this.timeout !== null) {
                clearTimeout(this.timeout);
                this.timeout = null;
              }
            }
          };
          presentController.setAriaExpanded(
            element.hidden ? "false" : "true"
          );
          if (!element.hidden) {
            presentController.classList.add(className.pop);
          }
          presentElements.set(element, presentController);
          for (const triggerElement of triggerElementsSet) {
            refreshTriggerTargets(triggerElement);
          }
          for (const [triggerElement, targets] of triggerTargets) {
            if (targets.has(element)) {
              presentController.triggers.add(triggerElement);
              updateTriggerAriaExpanded(triggerElement);
            }
          }
          autoUnpopSchedule(element, presentController);
        }
        function unmountPresentContainer(element) {
          if (!presentElements.has(element)) return;
          const controller = presentElements.get(element);
          controller.stop();
          presentElements.delete(element);
          controller.triggers.forEach(updateTriggerAriaExpanded);
          if (controller.presentMotion !== element)
            restoreAttributes(controller.presentMotion);
          restoreAttributes(element);
        }
        function mountTriggerElement(triggerElement) {
          if (triggerElementsSet.has(triggerElement)) return;
          initialTriggerControls.set(triggerElement, triggerElement.getAttribute(ARIA_CONTROLS));
          rememberAttributes(triggerElement);
          triggerElementsSet.add(triggerElement);
          refreshTriggerTargets(triggerElement);
        }
        function unmountTriggerElement(triggerElement) {
          var _a;
          if (!triggerElementsSet.has(triggerElement)) return;
          const targets = triggerTargets.get(triggerElement);
          if (targets) {
            for (const target of targets) {
              (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
            }
            triggerTargets.delete(triggerElement);
          }
          triggerElementsSet.delete(triggerElement);
          restoreAttributes(triggerElement);
          initialTriggerControls.delete(triggerElement);
        }
        function refreshTriggerTargets(triggerElement) {
          var _a;
          const targetIds = /* @__PURE__ */ new Set();
          const previousTargets = triggerTargets.get(triggerElement);
          const targets = /* @__PURE__ */ new Set();
          const targetSelector = triggerElement.getAttribute(attr.target);
          const dismiss = triggerElement.getAttribute(attr.dismiss);
          const container = triggerElement.closest(`[${attr.present}]`);
          if (previousTargets) {
            for (const target of previousTargets) {
              (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
            }
          }
          if (dismiss || targetSelector) {
            iterateSelector(
              document,
              dismiss || targetSelector,
              (present) => {
                if (!present.id) {
                  return;
                }
                targetIds.add(present.id);
                targets.add(present);
                const controller = presentElements.get(present);
                if (controller) {
                  controller.triggers.add(triggerElement);
                }
              }
            );
          } else if (container && container.id) {
            targetIds.add(container.id);
            targets.add(container);
            const controller = presentElements.get(container);
            if (controller) {
              controller.triggers.add(triggerElement);
            }
          }
          if (targets.size === 0) {
            triggerTargets.delete(triggerElement);
            return;
          }
          triggerTargets.set(triggerElement, targets);
          const initial = initialTriggerControls.get(triggerElement);
          if (initial) {
            initial.trim().split(/\s+/).forEach((x) => targetIds.add(x));
          }
          updateTriggerAriaExpanded(triggerElement);
          triggerElement.setAttribute(ARIA_CONTROLS, [...targetIds].join(" "));
        }
        function updateTriggerAriaExpanded(triggerElement) {
          const targets = triggerTargets.get(triggerElement);
          if (!targets) return;
          const expanded = [...targets].some((target) => {
            const controller = presentElements.get(target);
            return controller && target.getAttribute(ARIA_EXPANDED) === "true";
          });
          triggerElement.setAttribute(ARIA_EXPANDED, String(expanded));
        }
        function pop(element) {
          return presentTransition(element, true);
        }
        function unpop(element) {
          return presentTransition(element, false);
        }
        function toggle(element, goto) {
          return presentTransition(element, goto);
        }
        function trigger(element, trigger2) {
          switch (trigger2) {
            case "pop":
              return pop(element);
              break;
            case "unpop":
              return unpop(element);
              break;
            case "toggle":
              return toggle(element);
              break;
            default:
              return toggle(element);
              break;
          }
        }
        function presentTransition(element, gotoVisible) {
          const controller = presentElements.get(element);
          if (!controller) return;
          if (controller.direction === null)
            controller.direction = element.hidden ? UNPOP : POP;
          if (typeof gotoVisible === "undefined" || gotoVisible === null)
            gotoVisible = controller.direction === POP ? false : true;
          const newDirection = gotoVisible ? POP : UNPOP;
          if (element.hidden && !gotoVisible || newDirection === controller.direction) {
            return;
          }
          const allowEvent = AelluxJs2.dispatchFrom(
            element,
            `${BEFORE}${newDirection}`,
            { bubbles: true, cancelable: true }
          );
          if (!allowEvent) {
            return;
          }
          controller.stop();
          controller.direction = newDirection;
          new Promise((completeTransition, interruptTransition) => {
            controller.interruptTransition = interruptTransition;
            const c = className[`${newDirection}${PING}`.toLowerCase()];
            const duration = root2.getComputedStyle(controller.presentMotion).getPropertyValue(`--ae-${newDirection}-duration`.toLowerCase()).trim();
            const time = getString2Time(duration);
            controller.classList.add(c);
            element.hidden = false;
            controller.timeout = setTimeout(
              finishTransition,
              time,
              element,
              controller,
              c,
              gotoVisible,
              completeTransition
            );
            AelluxJs2.dispatchFrom(element, `${newDirection}${PING}`, { bubbles: true });
          }).then(() => {
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
          }).catch((error) => {
            switch (error && error.code) {
              case AelluxJs2.diagnostics.WARN_INTERRUPTION.code:
                AelluxJs2.diagnostics.warn(
                  AelluxJs2.diagnostics.WARN_INTERRUPTION,
                  { cause: error, extension: extensionName, element }
                );
                break;
              default:
                AelluxJs2.diagnostics.error(
                  AelluxJs2.diagnostics.ERROR_EXTENSION_TRANSITION,
                  { cause: error, extension: extensionName, element }
                );
                break;
            }
          });
        }
        function finishTransition(element, controller, c, gotoVisible, completeTransition) {
          controller.classList.remove(c);
          element.hidden = gotoVisible ? false : true;
          controller.interruptTransition = null;
          controller.timeout = null;
          completeTransition();
        }
        function autoUnpopSchedule(element, controller) {
          const autoUnpopValue = element.getAttribute(attr.autoUnpop);
          if (!element.hidden && autoUnpopValue) {
            const autoTime = getString2Time(autoUnpopValue);
            controller.timeout = setTimeout(
              autoUnpop,
              autoTime,
              element,
              controller
            );
          }
        }
        function autoUnpop(element, controller) {
          controller.timeout = null;
          unpop(element);
        }
        function outsideClickAutoUnpop(currentExceptions) {
          for (const pContainer of presentElements.keys()) {
            if (pContainer.hidden === true || pContainer.getAttribute(attr.unpopOnOutside) === "false" || currentExceptions.some((e) => pContainer.contains(e))) {
              continue;
            }
            unpop(pContainer);
          }
        }
        function OnClick(event) {
          if (!event.target) return;
          const container = event.target.closest(`[${attr.present}]`);
          const exceptions = [event.target];
          var button;
          button = event.target.closest(`[${attr.trigger}]`);
          if (button) {
            const triggerAttr = button.getAttribute(attr.trigger);
            const targetSelector = button.getAttribute(attr.target);
            if (targetSelector) {
              iterateSelector(
                document,
                targetSelector,
                (element) => {
                  exceptions.push(element);
                  trigger(element, triggerAttr);
                }
              );
            } else if (container) {
              exceptions.push(container);
              trigger(container, triggerAttr);
            } else {
            }
          }
          button = event.target.closest(`[${attr.dismiss}]`);
          if (button) {
            const dismiss = button.getAttribute(attr.dismiss);
            const targetSelector = button.getAttribute(attr.target);
            if (dismiss || targetSelector) {
              iterateSelector(
                document,
                dismiss || targetSelector,
                (element) => {
                  exceptions.push(element);
                  unpop(element);
                }
              );
            } else if (container) {
              exceptions.push(container);
              unpop(container);
            } else {
            }
          }
          outsideClickAutoUnpop(exceptions);
        }
        function iterateSelector(element, selector, callback) {
          try {
            element.querySelectorAll(selector).forEach((element2) => {
              try {
                callback(element2);
              } catch (error) {
                AelluxJs2.diagnostics.error(
                  AelluxJs2.diagnostics.ERROR_CALLBACK,
                  { cause: error, extension: extensionName, selector }
                );
              }
            });
          } catch (error) {
            AelluxJs2.diagnostics.error(
              AelluxJs2.diagnostics.ERROR_EXTENSION_SELECTOR,
              { cause: error, extension: extensionName, selector }
            );
          }
        }
        function rememberAttributes(element) {
          const users = attrMemoryUsers.get(element) || 0;
          if (users === 0) AelluxJs2.attrMem.save(element, initialAttributes);
          attrMemoryUsers.set(element, users + 1);
        }
        function restoreAttributes(element) {
          const users = attrMemoryUsers.get(element);
          if (!users) return;
          if (users > 1) {
            attrMemoryUsers.set(element, users - 1);
            return;
          }
          attrMemoryUsers.delete(element);
          AelluxJs2.attrMem.restore(element);
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

  // src/internal/create-controller-helper.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createControllerHelper(root2, element) {
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const mounts = /* @__PURE__ */ new Map();
    const controller = { spawn, despawn, hasMounts };
    function spawn(extensionName, mountId, methodNames) {
      const key = toCamelCase2(fromCamelCase2(extensionName));
      mounts.set(mountId, {
        extension: key,
        methods: Array.isArray(methodNames) ? methodNames : []
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
      const names = /* @__PURE__ */ new Set();
      for (const registration of mounts.values()) {
        if (registration.extension !== key) continue;
        for (const name of registration.methods) {
          if (typeof name === "string" && extension && typeof extension[name] === "function") {
            names.add(name);
          }
        }
      }
      if (names.size === 0) {
        const namespace2 = controller[key];
        if (namespace2) {
          for (const name of Object.keys(namespace2)) delete namespace2[name];
        }
        delete controller[key];
        return;
      }
      const namespace = controller[key] || /* @__PURE__ */ Object.create(null);
      for (const name of Object.keys(namespace)) {
        if (!names.has(name)) delete namespace[name];
      }
      for (const name of names) {
        namespace[name] = (...args) => {
          const current = root2.AelluxJs.ext[key];
          return current[name](element, ...args);
        };
      }
      controller[key] = namespace;
    }
    return controller;
  }

  // src/internal/create-mount-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createMountHelper(root2, extensionPromises, mountMaps, mountedElements, elementControllers) {
    const { toCapitalized: toCapitalized2, toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    return { mount, unmount };
    async function unmount(rootOrSelector, extensionNames = null) {
      for (const rootElement of resolveRoots(rootOrSelector)) {
        await AelluxJsForce(rootElement, "unmount", extensionNames);
      }
      return true;
    }
    async function mount(rootOrSelector, extensionNames = null) {
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
        for (const [key, options] of Object.entries(root2.AelluxJs.registry.ext)) {
          if (options.loadWhen) continue;
          waitExtensions.push(AelluxJs2.wait(key));
        }
        await Promise.all(waitExtensions);
        await AelluxJsForce(rootElement, "mount", extensionNames);
        allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "false"));
      }
      return true;
    }
    async function AelluxJsForce(rootElement, method, extensionNames = null) {
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
      const allElements = findElements(rootElement, filter.join(","));
      for (const element of allElements) {
        const elementsAffected = /* @__PURE__ */ new Set();
        var localExtensionNames;
        if (extensionNames) {
          localExtensionNames = new Set(extensionNames);
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
          const extensionPromise = method === "mount" ? AelluxJs2.wait(extensionName) : extensionPromises[toCamelCase2(extensionName)];
          if (!extensionPromise) {
            continue;
          }
          const extension = await extensionPromise;
          if (!extension) {
            continue;
          }
          const mounter = mountMaps.get(toCamelCase2(extensionName));
          if (!mounter) {
            continue;
          }
          for (const [selector, controller] of mounter) {
            try {
              if (!controller[method]) {
                continue;
              }
              const mountableElements = findElements(element, selector);
              for (const mountable of mountableElements) {
                const mountId = `${extensionName}@${selector}`;
                const mounting = method === "mount";
                if (mounting === isMounted(mountable, mountId)) continue;
                await controller[method](mountable);
                elementsAffected.add(mountable);
                setMounted(mountable, mountId, mounting);
                if (mounting) {
                  let elementController = elementControllers.get(mountable);
                  if (!elementController) {
                    elementController = createControllerHelper(root2, mountable);
                    elementControllers.set(mountable, elementController);
                  }
                  elementController.spawn(extensionName, mountId, controller.controllers);
                } else {
                  const elementController = elementControllers.get(mountable);
                  if (elementController) {
                    elementController.despawn(mountId);
                    if (!elementController.hasMounts()) elementControllers.delete(mountable);
                  }
                }
              }
            } catch (error) {
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
                {
                  cause: error,
                  extension: extensionName,
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
  }

  // src/internal/build-mount-map-manager.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildMountMapManager(root2, extensionPromises) {
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const mountedElements = /* @__PURE__ */ new WeakMap();
    const elementControllers = /* @__PURE__ */ new WeakMap();
    const maps = /* @__PURE__ */ new Map();
    const helper = createMountHelper(
      root2,
      extensionPromises,
      maps,
      mountedElements,
      elementControllers
    );
    const manager = {
      add,
      remove,
      controller,
      mount: helper.mount,
      unmount: helper.unmount
    };
    return manager;
    function controller(elementOrId) {
      const requested = elementOrId;
      if (typeof elementOrId === "string")
        elementOrId = root2.document.getElementById(elementOrId.replace(/^#/, ""));
      const diagnostics = root2.AelluxJs.diagnostics;
      if (!elementOrId || elementOrId.nodeType !== 1) {
        diagnostics.warn(diagnostics.WARN_INVALID_CONTROLLER_ELEMENT, { elementOrId: requested });
        return null;
      }
      const found = elementControllers.get(elementOrId);
      if (found) return found;
      diagnostics.error(diagnostics.ERROR_CONTROLLER_NOT_FOUND, { element: elementOrId });
      return null;
    }
    function keyFor(extensionName) {
      return toCamelCase2(fromCamelCase2(extensionName));
    }
    function add(extensionName, selector, mount, unmount, update, controllers) {
      if (typeof extensionName !== "string" || !extensionName || typeof selector !== "string" || !selector.trim()) {
        throw new TypeError("mountManager.add requires an extension name and selector");
      }
      const key = keyFor(extensionName);
      let map = maps.get(key);
      if (!map) {
        map = /* @__PURE__ */ new Map();
        maps.set(key, map);
      }
      map.set(selector, { mount, unmount, update, controllers });
      root2.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
      return manager;
    }
    function remove(extensionName, selector) {
      if (typeof extensionName !== "string" || !extensionName) return false;
      const key = keyFor(extensionName);
      const map = maps.get(key);
      if (!map) return false;
      const removed = selector === void 0 ? true : map.delete(selector);
      if (selector === void 0 || map.size === 0) {
        maps.delete(key);
        delete root2.AelluxJs.registry.extMounters[key];
      } else if (removed) {
        root2.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
      }
      return removed;
    }
  }

  // src/aellux.orchestrator.js
  init_utils_name_case();
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root2) {
    "use strict";
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const extensionPromises = {};
    const mountManager = buildMountMapManager(root2, extensionPromises);
    const layoutScheduler = createLayoutScheduler();
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
        async mount(rootOrSelector, extensionNames = null) {
          return mountManager.mount(rootOrSelector, extensionNames);
        },
        async unmount(rootOrSelector, extensionNames = null) {
          return mountManager.unmount(rootOrSelector, extensionNames);
        },
        async destroy() {
          AelluxJs.waitLayout.clear();
          await AelluxJs.destroyExtensions();
        },
        async destroyExtensions(extensionNames) {
          if (typeof extensionNames === "string")
            extensionNames = [extensionNames];
          if (!extensionNames)
            extensionNames = Object.keys(extensionPromises);
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
              mountManager.remove(extensionName);
              delete AelluxJs.registry.lazyExtSelectors[key];
              if (extension) extension.initialized = false;
            }
          }
        },
        dispatchFrom(from, event, options) {
          return from.dispatchEvent(new CustomEvent(AelluxJs.eventName(event), options));
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
          try {
            extensionInitialize(extensionName);
          } catch (error) {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
              { cause: error, extension: extensionName }
            );
            extensionPromises[key] = Promise.resolve(null);
            return extensionPromises[key];
          }
        }
        extensionPromises[key] = Promise.resolve(AelluxJs.ext[key]);
        return extensionPromises[key];
      }
      if (!(key in AelluxJs.registry.ext)) {
        return Promise.reject();
      }
      const bundledLoader = AelluxJs.bundledExtensions ? AelluxJs.bundledExtensions[key] : null;
      extensionPromises[key] = appendExtensionAssets(extensionName, bundledLoader).then(() => extensionInitialize(extensionName)).catch((error) => {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
          { cause: error, extension: extensionName }
        );
        return null;
      });
      return extensionPromises[key];
    }
    function extensionInitialize(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const options = AelluxJs.options.extensions[key] || {};
      AelluxJs.ext[key].init(options);
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
    "adaptive": () => Promise.resolve().then(() => (init_aellux_ext_adaptive(), aellux_ext_adaptive_exports)),
    "present": () => Promise.resolve().then(() => (init_aellux_ext_present(), aellux_ext_present_exports))
  });
  root.AelluxJs.ext("adaptive", { loadStyle: true });
})();
//# sourceMappingURL=aellux.full.js.map
