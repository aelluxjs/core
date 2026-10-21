(function() {
  // src/src/aellux.ext.adaptive.js
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
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r2) {
        return Object.getOwnPropertyDescriptor(e, r2).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
        _defineProperty(e, r2, t[r2]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
        Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
      });
    }
    return e;
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == _typeof(i) ? i : i + "";
  }
  function _toPrimitive(t, r) {
    if ("object" != _typeof(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
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
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var AelluxJs = root.AelluxJs;
    var extensionName = "adaptive";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    var attr = {
      adaptive: AelluxJs.attr(extensionName)
    };
    var modifier = {
      shapeHorizontal: AelluxJs.className("shape-horizontal"),
      shapeVertical: AelluxJs.className("shape-vertical"),
      shapeSquare: AelluxJs.className("shape-square")
    };
    var adaptiveElements = /* @__PURE__ */ new Set();
    var elementMemories = /* @__PURE__ */ new WeakMap();
    var dimensionProperties = ["--ae-width", "--ae-height"];
    var pendingResizeEntries = /* @__PURE__ */ new Map();
    var pendingResizeElements = /* @__PURE__ */ new Set();
    var layoutIds = /* @__PURE__ */ new WeakMap();
    var orientationLayoutIds = /* @__PURE__ */ new WeakMap();
    var nextLayoutId = 1e6;
    var adaptiveParams = {
      experienceScale: {
        near: 1,
        far: 1.5
      },
      ratioShapes: {
        vertical: 0.8,
        horizontal: 1.25
      },
      minSizes: {
        compact: 0,
        small: 480,
        medium: 768,
        large: 1024,
        xl: 1280,
        xxl: 1600
      }
    };
    var ariaHandlers = /* @__PURE__ */ new WeakMap();
    var managedClasses;
    var sizeThresholds = [];
    var resizeObserver = typeof root.ResizeObserver === "function" ? new root.ResizeObserver(onResize) : null;
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      adaptiveParams: adaptiveParams
    });
    function init() {
      var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      AelluxJs.registerCssProperty({
        name: "--ae-width",
        syntax: "<number>",
        initialValue: "0"
      }, {
        name: "--ae-height",
        syntax: "<number>",
        initialValue: "0"
      });
      var overrides = options.adaptiveParams === void 0 ? {} : options.adaptiveParams;
      if (!overrides || _typeof(overrides) !== "object" || Array.isArray(overrides)) {
        parameterDiagnostic("", overrides, "Expected an object of Adaptive parameter groups; using defaults.");
        overrides = {};
      }
      for (var _i = 0, _Object$keys = Object.keys(adaptiveParams); _i < _Object$keys.length; _i++) {
        var group = _Object$keys[_i];
        if (group in overrides && (!overrides[group] || _typeof(overrides[group]) !== "object" || Array.isArray(overrides[group]))) {
          parameterDiagnostic(group, overrides[group], "Expected a parameter group object; using defaults.");
          continue;
        }
        if (overrides[group] && _typeof(overrides[group]) === "object") {
          for (var _i2 = 0, _Object$entries = Object.entries(overrides[group]); _i2 < _Object$entries.length; _i2++) {
            var _Object$entries$_i = _slicedToArray(_Object$entries[_i2], 2), key = _Object$entries$_i[0], value = _Object$entries$_i[1];
            if (typeof value !== "number" || !Number.isFinite(value) || (group === "minSizes" ? value < 0 : value <= 0)) {
              parameterDiagnostic("".concat(group, ".").concat(key), value, "Expected a finite positive number (zero is allowed for minimum sizes).");
              continue;
            }
            adaptiveParams[group][key] = value;
          }
        }
      }
      for (var _i3 = 0, _arr = [["ratioShapes", "vertical", "horizontal", [0.8, 1.25]], ["experienceScale", "near", "far", [1, 1.5]]]; _i3 < _arr.length; _i3++) {
        var _arr$_i = _slicedToArray(_arr[_i3], 4), _group = _arr$_i[0], lower = _arr$_i[1], upper = _arr$_i[2], fallback = _arr$_i[3];
        if (adaptiveParams[_group][lower] >= adaptiveParams[_group][upper]) {
          parameterDiagnostic(_group, _objectSpread({}, adaptiveParams[_group]), "The lower boundary must be less than the upper boundary; using defaults.");
          adaptiveParams[_group][lower] = fallback[0];
          adaptiveParams[_group][upper] = fallback[1];
        }
      }
      var orderedSizes = ["compact", "small", "medium", "large", "xl", "xxl"];
      if (orderedSizes.some(function(name, index) {
        return index > 0 && adaptiveParams.minSizes[name] < adaptiveParams.minSizes[orderedSizes[index - 1]];
      })) parameterDiagnostic("minSizes", _objectSpread({}, adaptiveParams.minSizes), "Named minimum sizes are out of order; the configured thresholds are preserved.");
      managedClasses = getManagedClasses();
      for (var _i4 = 0, _Object$keys2 = Object.keys(adaptiveParams); _i4 < _Object$keys2.length; _i4++) {
        var _group2 = _Object$keys2[_i4];
        Object.freeze(adaptiveParams[_group2]);
      }
      Object.freeze(adaptiveParams);
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attr.adaptive, "]"),
        priority: 0,
        mount: mountAdaptive,
        unmount: unmountAdaptive
      });
    }
    function getManagedClasses() {
      var classes = [modifier.shapeHorizontal, modifier.shapeVertical, modifier.shapeSquare];
      sizeThresholds = [];
      for (var _i5 = 0, _Object$entries2 = Object.entries(adaptiveParams.minSizes); _i5 < _Object$entries2.length; _i5++) {
        var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i5], 2), size = _Object$entries2$_i[0], minimum = _Object$entries2$_i[1];
        var className = AelluxJs.className("fits-" + size);
        sizeThresholds.push({
          className: className,
          minimum: minimum
        });
        classes.push(className);
      }
      return classes;
    }
    function parameterDiagnostic(attribute, value, reason) {
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: extensionName,
        attribute: "adaptiveParams".concat(attribute ? "." + attribute : ""),
        value: value,
        reason: reason,
        suggestion: "Use finite nonnegative minimum sizes and positive, ordered ratio/experience boundaries."
      });
    }
    function destroy() {
      pendingResizeEntries.clear();
      pendingResizeElements.clear();
      var _iterator = _createForOfIteratorHelper(adaptiveElements), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var element = _step.value;
          unmountAdaptive(element);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (resizeObserver) resizeObserver.disconnect();
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
    }
    function mountAdaptive(element) {
      if (adaptiveElements.has(element)) return;
      elementMemories.set(element, AelluxJs.persist.element.save(element, [], dimensionProperties));
      ariaHandlers.set(element, AelluxJs.aria.register(element));
      adaptiveElements.add(element);
      layoutIds.set(element, nextLayoutId++);
      if (resizeObserver) resizeObserver.observe(element);
      else {
        scheduleElement(element, null);
        if (adaptiveElements.size === 1) AelluxJs.onEvent(root, "$resize", onWindowResize);
      }
    }
    function unmountAdaptive(element) {
      var _ariaHandlers$get, _elementMemories$get;
      if (!adaptiveElements.delete(element)) return;
      pendingResizeEntries.delete(element);
      pendingResizeElements.delete(element);
      var id = layoutIds.get(element);
      if (id !== void 0) AelluxJs.waitLayout.cancel(id);
      layoutIds.delete(element);
      if (resizeObserver) resizeObserver.unobserve(element);
      else if (adaptiveElements.size === 0) AelluxJs.offEvent(root, "$resize", onWindowResize);
      var _iterator2 = _createForOfIteratorHelper(managedClasses), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var name = _step2.value;
          element.classList.remove(name);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      (_ariaHandlers$get = ariaHandlers.get(element)) === null || _ariaHandlers$get === void 0 || _ariaHandlers$get.release();
      ariaHandlers.delete(element);
      (_elementMemories$get = elementMemories.get(element)) === null || _elementMemories$get === void 0 || _elementMemories$get.restore();
      elementMemories.delete(element);
    }
    function onResize(entries) {
      var _iterator3 = _createForOfIteratorHelper(entries), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var entry = _step3.value;
          if (adaptiveElements.has(entry.target)) {
            pendingResizeEntries.set(entry.target, entry);
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      scheduleUpdate();
    }
    function onWindowResize() {
      var _iterator4 = _createForOfIteratorHelper(adaptiveElements), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var element = _step4.value;
          pendingResizeElements.add(element);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      scheduleUpdate();
    }
    function scheduleUpdate() {
      flushPendingUpdate();
    }
    function flushPendingUpdate() {
      if (!pendingResizeEntries.size && !pendingResizeElements.size) return;
      var entries = Array.from(pendingResizeEntries.entries());
      pendingResizeEntries.clear();
      for (var _i6 = 0, _entries = entries; _i6 < _entries.length; _i6++) {
        var _entries$_i = _slicedToArray(_entries[_i6], 2), element = _entries$_i[0], entry = _entries$_i[1];
        scheduleElement(element, entry.contentRect);
      }
      var elements = Array.from(pendingResizeElements);
      pendingResizeElements.clear();
      for (var _i7 = 0, _elements = elements; _i7 < _elements.length; _i7++) {
        var _element = _elements[_i7];
        scheduleElement(_element, null);
      }
    }
    function scheduleElement(element, contentRect) {
      var id = layoutIds.get(element);
      if (id === void 0) return;
      var maxFPS = AelluxJs.layoutMaxFPS(element);
      var abort = function abort2() {
        return !adaptiveElements.has(element);
      };
      if (contentRect) {
        AelluxJs.waitLayout.sequence(id, {
          update: function update() {
            return updateAdaptive(element, contentRect.width, contentRect.height);
          },
          maxFPS: maxFPS,
          abort: abort
        });
        return;
      }
      AelluxJs.waitLayout.sequence(id, {
        read: function read() {
          return element.getBoundingClientRect();
        },
        update: function update(rect) {
          return updateAdaptive(element, rect.width, rect.height);
        },
        maxFPS: maxFPS,
        abort: abort
      });
    }
    function updateAdaptive(element, width, height) {
      var _ariaHandlers$get2;
      if (!adaptiveElements.has(element)) return;
      var ratio = height > 0 ? width / height : 0;
      (_ariaHandlers$get2 = ariaHandlers.get(element)) === null || _ariaHandlers$get2 === void 0 || _ariaHandlers$get2.set({
        orientation: height > width ? "vertical" : "horizontal"
      });
      element.classList.toggle(modifier.shapeVertical, ratio < adaptiveParams.ratioShapes.vertical);
      element.classList.toggle(modifier.shapeHorizontal, ratio > adaptiveParams.ratioShapes.horizontal);
      element.classList.toggle(modifier.shapeSquare, ratio >= adaptiveParams.ratioShapes.vertical && ratio <= adaptiveParams.ratioShapes.horizontal);
      var space = Math.sqrt(width * height);
      for (var i = 0; i < sizeThresholds.length; i++) {
        var threshold = sizeThresholds[i];
        element.classList.toggle(threshold.className, space >= threshold.minimum);
      }
      var _iterator5 = _createForOfIteratorHelper(dimensionProperties), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var name = _step5.value;
          if (element.style.getPropertyPriority(name)) element.style.removeProperty(name);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      element.style.setProperty("--ae-width", width);
      element.style.setProperty("--ae-height", height);
      AelluxJs.dispatchFrom(element, "AdaptiveUpdate", {
        detail: {
          width: width,
          height: height,
          ratio: ratio
        }
      });
    }
    function inferOrientation(flexBox) {
      var selector = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "*";
      var id = orientationLayoutIds.get(flexBox);
      if (id === void 0) {
        id = nextLayoutId++;
        orientationLayoutIds.set(flexBox, id);
      }
      return AelluxJs.waitLayout.read(id, function() {
        var fallback = "horizontal";
        var style = getComputedStyle(flexBox);
        if (style.display === "flex" || style.display === "inline-flex") {
          return style.flexDirection.indexOf("column") === 0 ? "vertical" : "horizontal";
        }
        if (!selector || selector.length === 0) return fallback;
        var children = flexBox.querySelectorAll(selector);
        if (children.length < 2) return fallback;
        var first = children[0].getBoundingClientRect();
        var second = children[1].getBoundingClientRect();
        var deltaX = Math.abs(second.left + second.width / 2 - (first.left + first.width / 2));
        var deltaY = Math.abs(second.top + second.height / 2 - (first.top + first.height / 2));
        return deltaY > deltaX ? "vertical" : "horizontal";
      });
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.adaptive.legacy.js.map
