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
      AelluxJs.mountManager.add(
        extensionName,
        `[${attr.preference}]`,
        mountPreferenceContainer,
        unmountPreferenceContainer
      );
      window.addEventListener("storage", storageEvent);
      const allQueries = AelluxJs.registry.preferenceMediaQueries;
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
      AelluxJs.mountManager.remove(extensionName);
      window.removeEventListener("storage", storageEvent);
      document.removeEventListener("DOMContentLoaded", update);
      const allQueries = AelluxJs.registry.preferenceMediaQueries;
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
      AelluxJs.updatePreferenceAttributesHTML(computedPreferences);
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
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.preference.js.map
