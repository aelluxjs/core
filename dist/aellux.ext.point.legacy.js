(function() {
  // src/src/aellux.ext.point.js
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
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
    var trackedPointers = /* @__PURE__ */ new Map();
    var pointableElements = /* @__PURE__ */ new Set();
    var pointableAttribute = AelluxJs.attr("point");
    var pointableSelector = "[".concat(pointableAttribute, "]");
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      pointers: pointers
    });
    function init() {
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: pointableSelector,
        mount: mountPointable,
        unmount: unmountPointable,
        controllers: ["pointers"]
      });
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("pointermove", onPointerMove, true);
      document.addEventListener("pointerup", onPointerUp, true);
      document.addEventListener("pointercancel", onPointerCancel, true);
      document.addEventListener("pointerover", onPointerOver, true);
      document.addEventListener("pointerout", onPointerOut, true);
    }
    function destroy() {
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerCancel, true);
      document.removeEventListener("pointerover", onPointerOver, true);
      document.removeEventListener("pointerout", onPointerOut, true);
      trackedPointers.clear();
      pointableElements.clear();
    }
    function mountPointable(element) {
      pointableElements.add(element);
    }
    function unmountPointable(element) {
      pointableElements.delete(element);
      var _iterator = _createForOfIteratorHelper(trackedPointers.values()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var pointer = _step.value;
          pointer.pointables = pointer.pointables.filter(function(pointable) {
            return pointable !== element;
          });
          if (pointer.pressStart) pointer.pressStart = pointer.pressStart.filter(function(pointable) {
            return pointable !== element;
          });
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    function pointers(element) {
      return Array.from(trackedPointers.values()).filter(function(pointer) {
        return pointer.pointables.includes(element);
      });
    }
    function limitFor(element) {
      var value = element.getAttribute(pointableAttribute);
      if (value === null || !value.trim()) return 1;
      var trimmed = value.trim();
      var limit = Number(trimmed);
      return /^\d+$/.test(trimmed) && Number.isSafeInteger(limit) ? limit : 1;
    }
    function pointablesFor(target, pointer) {
      var result = [];
      var element = target && target.nodeType === 1 ? target : target && target.parentElement;
      while (element) {
        if (pointableElements.has(element) && element.hasAttribute(pointableAttribute)) {
          var occupied = 0;
          var _iterator2 = _createForOfIteratorHelper(trackedPointers.values()), _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
              var other = _step2.value;
              if (other !== pointer && other.pointables.includes(element)) occupied++;
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
          if (occupied < limitFor(element)) result.push(element);
        }
        element = element.parentElement;
      }
      return result;
    }
    function dispatchPointer(name, pointer, originalEvent) {
      var _pointer$pressStart$s, _pointer$pressStart;
      var targets = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : pointer.pointables;
      var hover = arguments.length > 4 ? arguments[4] : void 0;
      var pointables = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : pointer.pointables;
      var chain = pointables.slice();
      var pressStart = (_pointer$pressStart$s = (_pointer$pressStart = pointer.pressStart) === null || _pointer$pressStart === void 0 ? void 0 : _pointer$pressStart.slice()) !== null && _pointer$pressStart$s !== void 0 ? _pointer$pressStart$s : null;
      var _iterator3 = _createForOfIteratorHelper(targets.slice()), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var _pressStart$slice;
          var element = _step3.value;
          AelluxJs.dispatchFrom(element, name, {
            bubbles: false,
            detail: {
              pointer: pointer,
              pointables: chain.slice(),
              pressStart: (_pressStart$slice = pressStart === null || pressStart === void 0 ? void 0 : pressStart.slice()) !== null && _pressStart$slice !== void 0 ? _pressStart$slice : null,
              originalEvent: originalEvent,
              hover: hover
            }
          });
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
    function releaseTargets(pointer) {
      if (!pointer.pointables.length) return pointer.pressStart || [];
      return _toConsumableArray(new Set([].concat(_toConsumableArray(pointer.pointables), _toConsumableArray(pointer.pressStart || []))));
    }
    function canHover(event) {
      return event.pointerType === "mouse" || event.pointerType === "pen";
    }
    function addPointer(event, pressed, hover) {
      var x = event.clientX;
      var y = event.clientY;
      var pointer = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        initial: {
          x: x,
          y: y
        },
        current: {
          x: x,
          y: y
        },
        delta: {
          x: 0,
          y: 0
        },
        buttons: event.buttons,
        pressed: pressed,
        hover: hover,
        pointables: [],
        pressStart: null
      };
      trackedPointers.set(event.pointerId, pointer);
      return pointer;
    }
    function updatePointer(pointer, event) {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      pointer.delta.x = pointer.current.x - pointer.initial.x;
      pointer.delta.y = pointer.current.y - pointer.initial.y;
      pointer.buttons = event.buttons;
    }
    function onPointerDown(event) {
      var pointer = trackedPointers.get(event.pointerId) || addPointer(event, true, canHover(event));
      pointer.initial.x = event.clientX;
      pointer.initial.y = event.clientY;
      pointer.pointerType = event.pointerType;
      pointer.pressed = true;
      pointer.hover = canHover(event);
      updatePointer(pointer, event);
      pointer.pointables = pointablesFor(event.target, pointer);
      pointer.pressStart = pointer.pointables.slice();
      dispatchPointer("PointerDown", pointer, event);
    }
    function onPointerMove(event) {
      var pointer = trackedPointers.get(event.pointerId);
      if (!pointer) {
        if (!canHover(event)) return;
        pointer = addPointer(event, false, true);
      }
      updatePointer(pointer, event);
      pointer.pointables = pointablesFor(event.target, pointer);
      dispatchPointer("PointerMove", pointer, event);
    }
    function onPointerUp(event) {
      var pointer = trackedPointers.get(event.pointerId);
      if (!pointer) return;
      updatePointer(pointer, event);
      pointer.pressed = false;
      pointer.pointables = pointablesFor(event.target, pointer);
      dispatchPointer("PointerUp", pointer, event, releaseTargets(pointer));
      if (!pointer.hover) trackedPointers.delete(event.pointerId);
    }
    function onPointerCancel(event) {
      var pointer = trackedPointers.get(event.pointerId);
      if (pointer) {
        updatePointer(pointer, event);
        pointer.pressed = false;
        pointer.pointables = pointablesFor(event.target, pointer);
        dispatchPointer("PointerCancel", pointer, event, releaseTargets(pointer));
      }
      trackedPointers.delete(event.pointerId);
    }
    function onPointerOver(event) {
      if (!canHover(event)) return;
      var pointer = trackedPointers.get(event.pointerId) || addPointer(event, false, true);
      var previous = pointer.pointables;
      updatePointer(pointer, event);
      pointer.hover = true;
      pointer.pointables = pointablesFor(event.target, pointer);
      var entered = pointer.pointables.filter(function(element) {
        return !previous.includes(element);
      });
      dispatchPointer("PointerHover", pointer, event, entered, true);
    }
    function onPointerOut(event) {
      var pointer = trackedPointers.get(event.pointerId);
      if (!pointer) return;
      var relatedTarget = event.relatedTarget;
      updatePointer(pointer, event);
      var previous = pointer.pointables;
      var nextPointables = pointablesFor(relatedTarget, pointer);
      var left = previous.filter(function(element) {
        return !nextPointables.includes(element);
      });
      dispatchPointer("PointerHover", pointer, event, left, false, previous);
      pointer.pointables = previous.filter(function(element) {
        return nextPointables.includes(element);
      });
      if (!relatedTarget || !relatedTarget.nodeType || !document.contains(relatedTarget)) {
        pointer.hover = false;
        pointer.pointables = [];
      }
      if (!pointer.pressed && !pointer.hover) trackedPointers.delete(event.pointerId);
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.point.legacy.js.map
