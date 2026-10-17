(function() {
  // src/src/aellux.ext.point.js
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
  }
  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: false }), e;
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
    var extensionName = "point";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    var POINTER = "pointer";
    var trackedPointers = /* @__PURE__ */ new Map();
    var pointableElements = /* @__PURE__ */ new Set();
    var pointableAttribute = AelluxJs.attr("point");
    var pointableSelector = "[".concat(pointableAttribute, "]");
    var pointerEvents = [["down", onPointerDown], ["move", onPointerMove], ["up", onPointerUp], ["cancel", onPointerCancel], ["over", onPointerOver], ["out", onPointerOut]];
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      pointers: pointers
    });
    function init() {
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: pointableSelector,
        priority: 0,
        mount: mountPointable,
        unmount: unmountPointable,
        controllers: ["pointers"]
      });
      var _iterator = _createForOfIteratorHelper(pointerEvents), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var _step$value = _slicedToArray(_step.value, 2), suffix = _step$value[0], handler = _step$value[1];
          AelluxJs.on("$".concat(POINTER).concat(suffix), handler, true);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    function destroy() {
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
      var _iterator2 = _createForOfIteratorHelper(pointerEvents), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var _step2$value = _slicedToArray(_step2.value, 2), suffix = _step2$value[0], handler = _step2$value[1];
          AelluxJs.off("$".concat(POINTER).concat(suffix), handler, true);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      trackedPointers.clear();
      pointableElements.clear();
    }
    function mountPointable(element) {
      pointableElements.add(element);
    }
    function unmountPointable(element) {
      pointableElements.delete(element);
      var _iterator3 = _createForOfIteratorHelper(trackedPointers.values()), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var pointer = _step3.value;
          if (pointer.target === element) pointer.target = null;
          if (pointer.pressStart === element) pointer.pressStart = null;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
    function pointers(element) {
      var result = [];
      var _iterator4 = _createForOfIteratorHelper(trackedPointers.values()), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var pointer = _step4.value;
          if (pointer.target === element) result.push(pointer);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      return result;
    }
    function limitFor(element) {
      var value = element.getAttribute(pointableAttribute);
      if (value === null || !value.trim()) return 1;
      var trimmed = value.trim();
      var limit = Number(trimmed);
      return /^\d+$/.test(trimmed) && Number.isSafeInteger(limit) ? limit : 1;
    }
    function targetFor(target, pointer) {
      var element = target && target.nodeType === 1 ? target : target && target.parentElement;
      while (element) {
        if (pointableElements.has(element) && element.hasAttribute(pointableAttribute)) {
          var occupied = 0;
          var _iterator5 = _createForOfIteratorHelper(trackedPointers.values()), _step5;
          try {
            for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
              var other = _step5.value;
              if (other !== pointer && other.target === element) occupied++;
            }
          } catch (err) {
            _iterator5.e(err);
          } finally {
            _iterator5.f();
          }
          if (occupied < limitFor(element)) return element;
        }
        element = element.parentElement;
      }
      return null;
    }
    function dispatchPointer(name, pointer, originalEvent, recipient, hover) {
      var target = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : pointer.target;
      var pressStart = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : pointer.pressStart;
      if (!recipient) return;
      AelluxJs.dispatchFrom(recipient, name, {
        bubbles: false,
        detail: {
          pointer: pointer,
          target: target,
          pressStart: pressStart,
          originalEvent: originalEvent,
          hover: hover
        }
      });
    }
    function dispatchToTarget(name, pointer, originalEvent) {
      if (!pointer.target) return;
      pointer.beforeDispatch();
      dispatchPointer(name, pointer, originalEvent, pointer.target);
    }
    function dispatchRelease(name, pointer, originalEvent) {
      var target = pointer.target;
      var pressStart = pointer.pressStart;
      if (!target && !pressStart) return;
      pointer.beforeDispatch();
      dispatchPointer(name, pointer, originalEvent, target, void 0, target, pressStart);
      if (pressStart !== target) dispatchPointer(name, pointer, originalEvent, pressStart, void 0, target, pressStart);
    }
    function updateHoverTarget(pointer, event, nextTarget) {
      var previousTarget = pointer.target;
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
      var pointer = new AePointer(event, pressed, hover);
      trackedPointers.set(event.pointerId, pointer);
      return pointer;
    }
    function onPointerDown(event) {
      var pointer = trackedPointers.get(event.pointerId) || addPointer(event, true, canHover(event));
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
      var pointer = trackedPointers.get(event.pointerId);
      if (!pointer) {
        if (!canHover(event)) return;
        pointer = addPointer(event, false, true);
      }
      pointer.update(event);
      pointer.target = targetFor(event.target, pointer);
      dispatchToTarget("PointerMove", pointer, event);
    }
    function onPointerUp(event) {
      var pointer = trackedPointers.get(event.pointerId);
      if (!pointer) return;
      pointer.update(event);
      pointer.pressed = false;
      pointer.endPress();
      pointer.target = targetFor(event.target, pointer);
      dispatchRelease("PointerUp", pointer, event);
      if (!pointer.hover) trackedPointers.delete(event.pointerId);
    }
    function onPointerCancel(event) {
      var pointer = trackedPointers.get(event.pointerId);
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
      var pointer = trackedPointers.get(event.pointerId) || addPointer(event, false, true);
      pointer.update(event);
      pointer.hover = true;
      updateHoverTarget(pointer, event, targetFor(event.target, pointer));
    }
    function onPointerOut(event) {
      var pointer = trackedPointers.get(event.pointerId);
      if (!pointer) return;
      var relatedTarget = event.relatedTarget;
      pointer.update(event);
      updateHoverTarget(pointer, event, targetFor(relatedTarget, pointer));
      if (!relatedTarget || !relatedTarget.nodeType || !document.contains(relatedTarget)) {
        pointer.hover = false;
        pointer.target = null;
      }
      if (!pointer.pressed && !pointer.hover) trackedPointers.delete(event.pointerId);
    }
    var AePointer = /* @__PURE__ */ (function() {
      function AePointer2(event, pressed, hover) {
        _classCallCheck(this, AePointer2);
        var x = event.clientX;
        var y = event.clientY;
        this.pointerId = event.pointerId;
        this.pointerType = event.pointerType;
        this.initial = {
          x: x,
          y: y
        };
        this.current = {
          x: x,
          y: y
        };
        this.delta = {
          x: 0,
          y: 0
        };
        this.movement = {
          x: 0,
          y: 0
        };
        this.lastDispatched = {
          x: x,
          y: y
        };
        this.time = {
          pressStart: null,
          pressEnd: null
        };
        this.buttons = event.buttons;
        this.pressed = pressed;
        this.hover = hover;
        this.target = null;
        this.pressStart = null;
      }
      return _createClass(AePointer2, [{
        key: "deltaTime",
        get: function get() {
          var _this$time$pressEnd;
          if (this.time.pressStart === null) return 0;
          return ((_this$time$pressEnd = this.time.pressEnd) !== null && _this$time$pressEnd !== void 0 ? _this$time$pressEnd : root.performance.now()) - this.time.pressStart;
        }
      }, {
        key: "startPress",
        value: function startPress() {
          this.time.pressStart = root.performance.now();
          this.time.pressEnd = null;
        }
      }, {
        key: "endPress",
        value: function endPress() {
          if (this.time.pressStart !== null && this.time.pressEnd === null) this.time.pressEnd = root.performance.now();
        }
      }, {
        key: "update",
        value: function update(event) {
          this.current.x = event.clientX;
          this.current.y = event.clientY;
          this.delta.x = this.current.x - this.initial.x;
          this.delta.y = this.current.y - this.initial.y;
          this.buttons = event.buttons;
        }
      }, {
        key: "beforeDispatch",
        value: function beforeDispatch() {
          this.movement.x = this.current.x - this.lastDispatched.x;
          this.movement.y = this.current.y - this.lastDispatched.y;
          this.lastDispatched.x = this.current.x;
          this.lastDispatched.y = this.current.y;
        }
      }]);
    })();
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.point.legacy.js.map
