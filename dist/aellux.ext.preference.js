(() => {
  // src/internal/utils-name-case.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
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
  var utils_name_case_default = {
    toCapitalized,
    toCamelCase,
    fromCamelCase
  };

  // src/aellux.ext.preference.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const { toCamelCase: toCamelCase2 } = utils_name_case_default;
    const extensionName = "preference";
    if (!AelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    const userPreferences = /* @__PURE__ */ Object.create(null);
    const defaultPreferences = /* @__PURE__ */ Object.create(null);
    const computedPreferences = /* @__PURE__ */ Object.create(null);
    const containersByPreference = /* @__PURE__ */ new Map();
    const containerPreferences = /* @__PURE__ */ new Map();
    const containerLabels = /* @__PURE__ */ new Map();
    const labelMemories = /* @__PURE__ */ new WeakMap();
    AelluxJs.extAttach(extensionName, { init, destroy, update, get, set });
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
    function init(options) {
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${attr.preference}]`,
        priority: 0,
        mount: mountPreferenceContainer,
        unmount: unmountPreferenceContainer
      });
      AelluxJs.onTarget(window, "$storage", storageEvent);
      const allQueries = AelluxJs.registry.preferenceMediaQueries;
      Object.values(allQueries).forEach(
        (queries) => Object.values(queries).forEach(
          (query) => {
            if (!query) return;
            if (query.addEventListener) {
              AelluxJs.onTarget(query, "$change", update);
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
      AelluxJs.mountManager.remove({ extensionName });
      containersByPreference.clear();
      containerPreferences.clear();
      AelluxJs.offTarget(window, "$storage", storageEvent);
      AelluxJs.off("$DOMContentLoaded", update);
      const allQueries = AelluxJs.registry.preferenceMediaQueries;
      Object.values(allQueries).forEach(
        (queries) => Object.values(queries).forEach(
          (query) => {
            if (!query) return;
            if (query.removeEventListener) {
              AelluxJs.offTarget(query, "$change", update);
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
      AelluxJs.updatePreferenceAttributesHTML(computedPreferences);
      for (const container of containerPreferences.keys()) {
        if (indexContainer(container)) updateContainer(container);
      }
      for (const key of changed) {
        const containers = containersByPreference.get(key);
        if (containers) for (const container of containers) updateContainer(container);
      }
      AelluxJs.dispatch("PreferencesChange", {
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
          labelMemories.set(label, AelluxJs.persist.element.save(label, ["hidden"], []));
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
      AelluxJs.persist.preferences.setObject(userPreferences);
    }
    function loadUserPreferences() {
      Object.assign(userPreferences, AelluxJs.persist.preferences.getObject());
    }
    function mountPreferenceContainer(container) {
      indexContainer(container);
      updateContainer(container);
      AelluxJs.onTarget(container, "$click", onContainerClick);
    }
    function unmountPreferenceContainer(container) {
      var _a;
      AelluxJs.offTarget(container, "$click", onContainerClick);
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
})();
//# sourceMappingURL=aellux.ext.preference.js.map
