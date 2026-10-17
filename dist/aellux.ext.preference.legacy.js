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
  function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
        t && (r = t);
        var _n = 0, F = function F2() {
        };
        return { s: F, n: function n() {
          return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
        }, e: function e2(r2) {
          throw r2;
        }, f: F };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o, a = true, u = false;
    return { s: function s() {
      t = t.call(r);
    }, n: function n() {
      var r2 = t.next();
      return a = r2.done, r2;
    }, e: function e2(r2) {
      u = true, o = r2;
    }, f: function f() {
      try {
        a || null == t.return || t.return();
      } finally {
        if (u) throw o;
      }
    } };
  }
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
    var NO_PREFERENCE = "no-preference";
    var userPreferences = /* @__PURE__ */ Object.create(null);
    var defaultPreferences = /* @__PURE__ */ Object.create(null);
    var computedPreferences = /* @__PURE__ */ Object.create(null);
    var containersByPreference = /* @__PURE__ */ new Map();
    var containerPreferences = /* @__PURE__ */ new Map();
    var containerLabels = /* @__PURE__ */ new Map();
    var labelMemories = /* @__PURE__ */ new WeakMap();
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
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attr.preference, "]"),
        priority: 0,
        mount: mountPreferenceContainer,
        unmount: unmountPreferenceContainer
      });
      AelluxJs.onTarget(window, "$storage", storageEvent);
      var allQueries = AelluxJs.registry.preferenceMediaQueries;
      Object.values(allQueries).forEach(function(queries) {
        return Object.values(queries).forEach(function(query) {
          if (!query) return;
          if (query.addEventListener) {
            AelluxJs.onTarget(query, "$change", update);
          } else if (query.addListener) {
            query.addListener(update);
          }
        });
      });
      Object.entries(prefOptions).forEach(function(_ref) {
        var _ref2 = _slicedToArray(_ref, 2), param = _ref2[0], options2 = _ref2[1];
        defaultPreferences[param] = options2[0];
      });
      loadUserPreferences();
      update();
    }
    function destroy() {
      var _iterator = _createForOfIteratorHelper(containerPreferences.keys()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var container = _step.value;
          unmountPreferenceContainer(container);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
      containersByPreference.clear();
      containerPreferences.clear();
      AelluxJs.offTarget(window, "$storage", storageEvent);
      AelluxJs.off("$DOMContentLoaded", update);
      var allQueries = AelluxJs.registry.preferenceMediaQueries;
      Object.values(allQueries).forEach(function(queries) {
        return Object.values(queries).forEach(function(query) {
          if (!query) return;
          if (query.removeEventListener) {
            AelluxJs.offTarget(query, "$change", update);
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
      var nextPreferences = Object.assign(/* @__PURE__ */ Object.create(null), defaultPreferences, userPreferences);
      var changed = /* @__PURE__ */ new Set();
      for (var key in computedPreferences) {
        if (!(key in nextPreferences)) {
          delete computedPreferences[key];
          changed.add(key);
        }
      }
      for (var _key in nextPreferences) {
        if (computedPreferences[_key] !== nextPreferences[_key]) changed.add(_key);
        computedPreferences[_key] = nextPreferences[_key];
      }
      AelluxJs.updatePreferenceAttributesHTML(computedPreferences);
      var _iterator2 = _createForOfIteratorHelper(containerPreferences.keys()), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var container = _step2.value;
          if (indexContainer(container)) updateContainer(container);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      var _iterator3 = _createForOfIteratorHelper(changed), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var _key2 = _step3.value;
          var containers = containersByPreference.get(_key2);
          if (containers) {
            var _iterator4 = _createForOfIteratorHelper(containers), _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
                var _container = _step4.value;
                updateContainer(_container);
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      AelluxJs.dispatch("PreferencesChange", {
        detail: {
          changed: Array.from(changed),
          preferences: Object.assign({}, computedPreferences)
        }
      });
    }
    function indexContainer(container) {
      var key = toCamelCase2(container.getAttribute(attr.preference) || "");
      var previous = containerPreferences.get(container);
      if (previous === key) return false;
      if (previous !== void 0) {
        var _containers = containersByPreference.get(previous);
        _containers.delete(container);
        if (!_containers.size) containersByPreference.delete(previous);
      }
      var containers = containersByPreference.get(key);
      if (!containers) {
        containers = /* @__PURE__ */ new Set();
        containersByPreference.set(key, containers);
      }
      containers.add(container);
      containerPreferences.set(container, key);
      return true;
    }
    function updateContainer(container) {
      var preference = container.getAttribute(attr.preference);
      var elements = container.querySelectorAll("[".concat(attr.option, "]"));
      var labels = container.querySelectorAll("[".concat(attr.label, "]"));
      var currentValue = get(preference || "");
      labels.forEach(function(label) {
        var ownedLabels = containerLabels.get(container);
        if (!ownedLabels) {
          ownedLabels = /* @__PURE__ */ new Set();
          containerLabels.set(container, ownedLabels);
        }
        if (!ownedLabels.has(label)) {
          labelMemories.set(label, AelluxJs.persist.element.save(label, ["hidden"], []));
          ownedLabels.add(label);
        }
        var value = label.getAttribute(attr.label);
        var selected = String(value) === String(currentValue);
        label.hidden = !selected;
      });
      elements.forEach(function(element) {
        var value = element.getAttribute(attr.option);
        var selected = value === currentValue;
        element.classList.toggle(className.active, selected);
        var labelFor = element.getAttribute("for");
        if (labelFor) {
          var forTarget = document.getElementById(labelFor);
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
      AelluxJs.offTarget(container, "$click", onContainerClick);
      var labels = containerLabels.get(container);
      if (labels) {
        var _iterator5 = _createForOfIteratorHelper(labels), _step5;
        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
            var _labelMemories$get;
            var label = _step5.value;
            (_labelMemories$get = labelMemories.get(label)) === null || _labelMemories$get === void 0 || _labelMemories$get.restore();
            labelMemories.delete(label);
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
      }
      containerLabels.delete(container);
      var key = containerPreferences.get(container);
      if (key === void 0) return;
      var containers = containersByPreference.get(key);
      containers.delete(container);
      if (!containers.size) containersByPreference.delete(key);
      containerPreferences.delete(container);
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
        var key = toCamelCase2(_preference);
        var options = prefOptions[key];
        if (!options || options.length === 0) return;
        var change = buttonNext ? 1 : -1;
        var currentValue = get(key);
        var currentIndex = options.findIndex(function(option) {
          return String(option) === String(currentValue);
        });
        var nextIndex = currentIndex < 0 ? buttonNext ? 0 : options.length - 1 : (currentIndex + change + options.length) % options.length;
        set(_preference, options[nextIndex]);
        update();
      }
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.preference.legacy.js.map
