(function() {
  // src/internal/has-progress-api.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function hasProgressAPI(root, tag) {
    try {
      var ctor = root[tag === "progress" ? "HTMLProgressElement" : "HTMLMeterElement"];
      if (typeof ctor !== "function") return false;
      var element = root.document.createElement(tag);
      var names = tag === "progress" ? ["value", "max", "position"] : ["value", "min", "max", "low", "high", "optimum"];
      for (var i = 0; i < names.length; i++) {
        if (typeof element[names[i]] !== "number" || !isFinite(element[names[i]])) return false;
      }
      element.setAttribute("max", "10");
      element.setAttribute("value", "5");
      if (element.max !== 10 || element.value !== 5) return false;
      element.value = 20;
      if (element.value !== 10 || element.getAttribute("value") !== "20") return false;
      if (tag === "progress") {
        element.removeAttribute("value");
        return element.position === -1 && element.value === 0;
      }
      element.setAttribute("min", "2");
      element.setAttribute("low", "3");
      element.setAttribute("high", "8");
      element.setAttribute("optimum", "6");
      return element.min === 2 && element.low === 3 && element.high === 8 && element.optimum === 6;
    } catch (error) {
      return false;
    }
  }

  // src/internal/install-progress-fallback.js
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
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
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function installProgressFallback(root, element) {
    var tag = element.tagName.toLowerCase();
    if (hasProgressAPI(root, tag)) return null;
    var api = root.AelluxJs;
    var marker = api.attr("progress-fallback");
    var names = tag === "progress" ? ["value", "max", "position"] : ["value", "min", "max", "low", "high", "optimum"];
    var descriptors = names.map(function(name) {
      return Object.getOwnPropertyDescriptor(element, name);
    });
    var memory = api.persist.element.save(element, [marker, "role", "aria-valuemin", "aria-valuemax", "aria-valuenow"], ["display", "position", "width", "height", "background", "overflow"]);
    var active = true;
    var bar = element.ownerDocument.createElement("span");
    bar.setAttribute("aria-hidden", "true");
    bar.style.cssText = "position:absolute;left:0;top:0;height:100%;pointer-events:none";
    element.appendChild(bar);
    element.setAttribute(marker, tag);
    element.style.cssText += ";display:inline-block;position:relative;width:10em;height:1em;background:#ddd;overflow:hidden";
    element.setAttribute("role", tag === "progress" ? "progressbar" : "meter");
    var clamp = function clamp2(value, min, max) {
      return Math.max(min, Math.min(max, value));
    };
    function number(name, fallback) {
      var raw = element.getAttribute(name);
      var value = raw === null || raw.trim() === "" ? NaN : Number(raw);
      return Number.isFinite(value) ? value : fallback;
    }
    function read(name) {
      var min = tag === "progress" ? 0 : number("min", 0);
      var rawMax = number("max", 1);
      var max = tag === "progress" ? rawMax > 0 ? rawMax : 1 : Math.max(min, rawMax);
      if (name === "min") return min;
      if (name === "max") return max;
      var value = clamp(number("value", 0), min, max);
      if (name === "value") return value;
      if (name === "position") return element.hasAttribute("value") ? value / max : -1;
      var low = clamp(number("low", min), min, max);
      if (name === "low") return low;
      if (name === "high") return clamp(number("high", max), low, max);
      return clamp(number("optimum", (min + max) / 2), min, max);
    }
    function render() {
      if (!active) return;
      var min = tag === "progress" ? 0 : read("min");
      var max = read("max");
      var value = read("value");
      var indeterminate = tag === "progress" && !element.hasAttribute("value");
      element.setAttribute("aria-valuemin", String(min));
      element.setAttribute("aria-valuemax", String(max));
      if (indeterminate) element.removeAttribute("aria-valuenow");
      else element.setAttribute("aria-valuenow", String(value));
      bar.style.width = "".concat(indeterminate ? 100 : max === min ? 0 : (value - min) / (max - min) * 100, "%");
      bar.style.background = indeterminate ? "#777" : "#2878b5";
      if (indeterminate) bar.style.backgroundImage = "repeating-linear-gradient(45deg,#777 0,#777 8px,#bbb 8px,#bbb 16px)";
      if (tag === "meter") {
        var low = read("low"), high = read("high"), optimum = read("optimum");
        var level = optimum < low ? value <= low ? 0 : value <= high ? 1 : 2 : optimum > high ? value >= high ? 0 : value >= low ? 1 : 2 : value >= low && value <= high ? 0 : 1;
        bar.style.background = ["#278341", "#b58212", "#bc3131"][level];
      }
    }
    names.forEach(function(name) {
      return Object.defineProperty(element, name, _objectSpread({
        configurable: true,
        enumerable: true,
        get: function get() {
          return read(name);
        }
      }, name === "position" ? {} : {
        set: function set(value) {
          value = Number(value);
          if (!Number.isFinite(value)) throw new TypeError("Expected a finite number");
          element.setAttribute(name, String(value));
          render();
        }
      }));
    });
    var observer = new root.MutationObserver(render);
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["value", "min", "max", "low", "high", "optimum"]
    });
    render();
    return {
      destroy: function destroy() {
        active = false;
        observer.disconnect();
        if (bar.parentNode) bar.parentNode.removeChild(bar);
        names.forEach(function(name, index) {
          if (descriptors[index]) Object.defineProperty(element, name, descriptors[index]);
          else delete element[name];
        });
        memory.restore();
      }
    };
  }

  // src/src/aellux.ext.progress.js
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
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var AelluxJs = root.AelluxJs;
    var extensionName = "progress";
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the progress Extension.");
    var targetAttribute = AelluxJs.attr("progress-target");
    var mounted = /* @__PURE__ */ new Map();
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy
    });
    function init() {
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "progress, meter",
        priority: -1,
        mount: mount,
        unmount: unmount,
        update: connect
      });
    }
    function destroy() {
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
      var _iterator = _createForOfIteratorHelper(mounted.keys()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var element = _step.value;
          unmount(element);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    function mount(element) {
      if (mounted.has(element)) return;
      var state = {
        target: null,
        memory: AelluxJs.persist.element.save(element, ["value"]),
        fallback: true ? installProgressFallback(root, element) : null,
        observer: null,
        listener: null
      };
      state.listener = function(event) {
        if (!element.isConnected || !mounted.has(element)) return;
        var detail = event.detail;
        if (!detail || typeof detail.value !== "number" || typeof detail.max !== "number" || !Number.isFinite(detail.value) || !Number.isFinite(detail.max) || detail.max <= 0 || detail.value < 0 || detail.value > detail.max) return;
        var max = element.max;
        if (!Number.isFinite(max) || max <= 0) return;
        element.value = Math.max(0, Math.min(max, detail.value / detail.max * max));
      };
      mounted.set(element, state);
      if (element.tagName.toLowerCase() === "progress") {
        state.observer = new root.MutationObserver(function() {
          return connect(element);
        });
        state.observer.observe(element, {
          attributes: true,
          attributeFilter: [targetAttribute]
        });
        connect(element);
      }
    }
    function connect(element) {
      var state = mounted.get(element);
      if (!state || element.tagName.toLowerCase() !== "progress") return;
      if (state.target) AelluxJs.offEvent(state.target, "Progress", state.listener);
      var id = element.getAttribute(targetAttribute);
      state.target = id === null ? null : AelluxJs.elementOrId(id, {
        method: "progress.target"
      });
      if (state.target) AelluxJs.onEvent(state.target, "Progress", state.listener);
    }
    function unmount(element) {
      var _state$observer, _state$fallback;
      var state = mounted.get(element);
      if (!state) return;
      mounted.delete(element);
      (_state$observer = state.observer) === null || _state$observer === void 0 || _state$observer.disconnect();
      if (state.target) AelluxJs.offEvent(state.target, "Progress", state.listener);
      state.memory.restore();
      (_state$fallback = state.fallback) === null || _state$fallback === void 0 || _state$fallback.destroy();
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.progress.legacy.js.map
