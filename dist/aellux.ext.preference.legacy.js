(function() {
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
    toCapitalized: toCapitalized,
    toCamelCase: toCamelCase,
    fromCamelCase: fromCamelCase
  };

  // src/src/aellux.ext.preference.js
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e, n, i, u, a = [], f = true, o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f = false;
        } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
      } catch (r2) {
        o = true, n = r2;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var AelluxJs = root.AelluxJs;
    var toCamelCase2 = utils_name_case_default.toCamelCase;
    var extensionName = "preference";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    var userPreferences = /* @__PURE__ */ Object.create(null);
    var defaultPreferences = /* @__PURE__ */ Object.create(null);
    var computedPreferences = /* @__PURE__ */ Object.create(null);
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      update: update,
      get: get,
      set: set
    });
    var attr = {
      preference: AelluxJs.attr("preference"),
      option: AelluxJs.attr("option"),
      label: AelluxJs.attr("label"),
      next: AelluxJs.attr("next"),
      prev: AelluxJs.attr("prev"),
      ready: AelluxJs.attr("ready")
    };
    var className = {
      active: AelluxJs.className("active")
    };
    var prefOptions = {
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
      AelluxJs.mountManager.add(extensionName, "[".concat(attr.preference, "]"), mountPreferenceContainer, unmountPreferenceContainer);
      window.addEventListener("storage", storageEvent);
      var allQueries = AelluxJs.registry.preferenceMediaQueries;
      Object.values(allQueries).forEach(function(queries) {
        return Object.values(queries).forEach(function(query) {
          if (!query) return;
          if (query.addEventListener) {
            query.addEventListener("change", update);
          } else if (query.addListener) {
            query.addListener(update);
          }
        });
      });
      Object.entries(prefOptions).forEach(function(_ref) {
        var _ref2 = _slicedToArray(_ref, 2), param = _ref2[0], options2 = _ref2[1];
        return defaultPreferences[param] = options2[0];
      });
      loadUserPreferences();
      update();
    }
    function destroy() {
      AelluxJs.mountManager.remove(extensionName);
      window.removeEventListener("storage", storageEvent);
      document.removeEventListener("DOMContentLoaded", update);
      var allQueries = AelluxJs.registry.preferenceMediaQueries;
      Object.values(allQueries).forEach(function(queries) {
        return Object.values(queries).forEach(function(query) {
          if (!query) return;
          if (query.removeEventListener) {
            query.removeEventListener("change", update);
          } else if (query.removeListener) {
            query.removeListener(update);
          }
        });
      });
    }
    function get(preference) {
      var key = toCamelCase2(preference);
      return computedPreferences[key];
    }
    function set(preference, value) {
      var key = toCamelCase2(preference);
      if (userPreferences[key] === value) return;
      userPreferences[key] = value;
      saveUserPreferences();
    }
    function storageEvent(event) {
      if (event.key !== "AelluxJsPreferences") return;
      var newPreferences = new URLSearchParams(event.newValue || "");
      Object.keys(userPreferences).forEach(function(key) {
        return delete userPreferences[key];
      });
      newPreferences.forEach(function(value, key) {
        userPreferences[key] = value;
      });
      update();
    }
    function update() {
      Object.assign(computedPreferences, defaultPreferences, userPreferences);
      AelluxJs.updatePreferenceAttributesHTML(computedPreferences);
      document.querySelectorAll("[".concat(attr.preference, "]")).forEach(function(container) {
        return updateContainer(container);
      });
      AelluxJs.dispatch("PreferencesChange");
    }
    function updateContainer(container) {
      var preference = container.getAttribute(attr.preference);
      var elements = container.querySelectorAll("[".concat(attr.option, "]"));
      var selectedLabel = container.querySelector("[".concat(attr.label, "]"));
      elements.forEach(function(element) {
        var value = element.getAttribute(attr.option);
        var selected = value === get(preference);
        element.classList.toggle(className.active, selected);
        var labelFor = element.getAttribute("for");
        if (labelFor) {
          var forTarget = document.getElementById(labelFor);
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
      var container = event.currentTarget;
      if (!event.target) return;
      var optionButton = event.target.closest("[".concat(attr.option, "]"));
      var buttonNext = event.target.closest("[".concat(attr.next, "]"));
      var buttonPrev = event.target.closest("[".concat(attr.prev, "]"));
      if (optionButton) {
        var preference = container.getAttribute(attr.preference);
        var value = optionButton.getAttribute(attr.option);
        set(preference, value);
        update();
      } else if (buttonNext || buttonPrev) {
        var _preference = container.getAttribute(attr.preference);
        var change = buttonNext ? 1 : -1;
      }
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.preference.legacy.js.map
