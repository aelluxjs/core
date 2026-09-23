(function() {
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
  /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function() {
    "use strict";
    var extensionName = "preferences";
    Aellux.extRegister(extensionName, {
      init: init,
      destroy: destroy,
      update: update,
      get: get,
      set: set
    });
    var userPreferences = /* @__PURE__ */ Object.create(null);
    var defaultPreferences = /* @__PURE__ */ Object.create(null);
    var computedPreferences = /* @__PURE__ */ Object.create(null);
    var attr = {
      preference: Aellux.attr("preference"),
      option: Aellux.attr("option"),
      label: Aellux.attr("label"),
      next: Aellux.attr("next"),
      prev: Aellux.attr("prev"),
      ready: Aellux.attr("ready")
    };
    var className = {
      active: Aellux.className("active")
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
    function init() {
      window.addEventListener("storage", storageEvent);
      var allQueries = Aellux.preferencesMediaQueries;
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
        var _ref2 = _slicedToArray(_ref, 2), param = _ref2[0], options = _ref2[1];
        return defaultPreferences[param] = options[0];
      });
      loadUserPreferences();
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", update, {
          once: true
        });
      } else {
        update();
      }
    }
    function destroy() {
      window.removeEventListener("storage", storageEvent);
      document.addEventListener("DOMContentLoaded", update);
      var allQueries = Aellux.preferencesMediaQueries;
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
    function update() {
      Object.assign(computedPreferences, defaultPreferences, userPreferences);
      Aellux.updatePreferencesAttributesHTML(computedPreferences);
      preferenceContainersUpdate();
      Aellux.dispatch("PreferencesChange");
    }
    function get(preference) {
      var key = toCamelCase(preference);
      return computedPreferences[key];
    }
    function set(preference, value) {
      var key = toCamelCase(preference);
      if (userPreferences[key] === value) return;
      userPreferences[key] = value;
      saveUserPreferences();
    }
    function storageEvent(event) {
      if (event.key !== "AelluxPreferences") return;
      var newPreferences = new URLSearchParams(event.newValue || "");
      Object.keys(userPreferences).forEach(function(key) {
        return delete userPreferences[key];
      });
      newPreferences.forEach(function(value, key) {
        userPreferences[key] = value;
      });
      update();
    }
    function saveUserPreferences() {
      Aellux.persist.preferences.setObject(userPreferences);
    }
    function loadUserPreferences() {
      Object.assign(userPreferences, Aellux.persist.preferences.getObject());
    }
    function preferenceContainersUpdate() {
      document.querySelectorAll("[".concat(attr.preference, "]")).forEach(function(container) {
        var ready = container.getAttribute(attr.ready);
        if (!ready) {
          setupPreferenceContainer(container);
        }
        var preference = container.getAttribute(attr.preference);
        var elements = container.querySelectorAll("[".concat(attr.option, "]"));
        var selectedLabel = container.querySelector("[".concat(attr.label, "]"));
        elements.forEach(function(element) {
          var value = element.getAttribute(attr.option);
          var selected = value === get(preference);
          element.classList.toggle(className.active, selected);
          if (selectedLabel && selected) {
            if (selectedLabel.value) {
              selectedLabel.value = element.innerText;
            } else {
              selectedLabel.innerHTML = element.innerHTML;
            }
          }
        });
      });
    }
    function setupPreferenceContainer(container) {
      container.addEventListener("click", onContainerClick);
      container.setAttribute(attr.ready, "");
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
    function toCamelCase(name) {
      return name.replace(/-([a-z])/g, function(_, c) {
        return c.toUpperCase();
      });
    }
    ;
    function fromCamelCase(name) {
      return name.replace(/([A-Z])/g, "-$1").toLowerCase();
    }
    ;
  })();
})();
//# sourceMappingURL=aellux.ext.preferences.legacy.js.map
