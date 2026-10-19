(function() {
  // src/src/aellux.ext.scrollbox-snap.js
  function _regenerator() {
    /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
    var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag";
    function i(r2, n2, o2, i2) {
      var c2 = n2 && n2.prototype instanceof Generator ? n2 : Generator, u2 = Object.create(c2.prototype);
      return _regeneratorDefine2(u2, "_invoke", (function(r3, n3, o3) {
        var i3, c3, u3, f2 = 0, p = o3 || [], y = false, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d2(t2, r4) {
          return i3 = t2, c3 = 0, u3 = e, G.n = r4, a;
        } };
        function d(r4, n4) {
          for (c3 = r4, u3 = n4, t = 0; !y && f2 && !o4 && t < p.length; t++) {
            var o4, i4 = p[t], d2 = G.p, l = i4[2];
            r4 > 3 ? (o4 = l === n4) && (u3 = i4[(c3 = i4[4]) ? 5 : (c3 = 3, 3)], i4[4] = i4[5] = e) : i4[0] <= d2 && ((o4 = r4 < 2 && d2 < i4[1]) ? (c3 = 0, G.v = n4, G.n = i4[1]) : d2 < l && (o4 = r4 < 3 || i4[0] > n4 || n4 > l) && (i4[4] = r4, i4[5] = n4, G.n = l, c3 = 0));
          }
          if (o4 || r4 > 1) return a;
          throw y = true, n4;
        }
        return function(o4, p2, l) {
          if (f2 > 1) throw TypeError("Generator is already running");
          for (y && 1 === p2 && d(p2, l), c3 = p2, u3 = l; (t = c3 < 2 ? e : u3) || !y; ) {
            i3 || (c3 ? c3 < 3 ? (c3 > 1 && (G.n = -1), d(c3, u3)) : G.n = u3 : G.v = u3);
            try {
              if (f2 = 2, i3) {
                if (c3 || (o4 = "next"), t = i3[o4]) {
                  if (!(t = t.call(i3, u3))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  u3 = t.value, c3 < 2 && (c3 = 0);
                } else 1 === c3 && (t = i3.return) && t.call(i3), c3 < 2 && (u3 = TypeError("The iterator does not provide a '" + o4 + "' method"), c3 = 1);
                i3 = e;
              } else if ((t = (y = G.n < 0) ? u3 : r3.call(n3, G)) !== a) break;
            } catch (t2) {
              i3 = e, c3 = 1, u3 = t2;
            } finally {
              f2 = 1;
            }
          }
          return { value: t, done: y };
        };
      })(r2, o2, i2), true), u2;
    }
    var a = {};
    function Generator() {
    }
    function GeneratorFunction() {
    }
    function GeneratorFunctionPrototype() {
    }
    t = Object.getPrototypeOf;
    var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function() {
      return this;
    }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
    function f(e2) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e2, GeneratorFunctionPrototype) : (e2.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e2, o, "GeneratorFunction")), e2.prototype = Object.create(u), e2;
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function() {
      return this;
    }), _regeneratorDefine2(u, "toString", function() {
      return "[object Generator]";
    }), (_regenerator = function _regenerator2() {
      return { w: i, m: f };
    })();
  }
  function _regeneratorDefine2(e, r, n, t) {
    var i = Object.defineProperty;
    try {
      i({}, "", {});
    } catch (e2) {
      i = 0;
    }
    _regeneratorDefine2 = function _regeneratorDefine(e2, r2, n2, t2) {
      function o(r3, n3) {
        _regeneratorDefine2(e2, r3, function(e3) {
          return this._invoke(r3, n3, e3);
        });
      }
      r2 ? i ? i(e2, r2, { value: n2, enumerable: !t2, configurable: !t2, writable: !t2 }) : e2[r2] = n2 : (o("next", 0), o("throw", 1), o("return", 2));
    }, _regeneratorDefine2(e, r, n, t);
  }
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
  function asyncGeneratorStep(n, t, e, r, o, a, c) {
    try {
      var i = n[a](c), u = i.value;
    } catch (n2) {
      return void e(n2);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
  }
  function _asyncToGenerator(n) {
    return function() {
      var t = this, e = arguments;
      return new Promise(function(r, o) {
        var a = n.apply(t, e);
        function _next(n2) {
          asyncGeneratorStep(a, r, o, _next, _throw, "next", n2);
        }
        function _throw(n2) {
          asyncGeneratorStep(a, r, o, _next, _throw, "throw", n2);
        }
        _next(void 0);
      });
    };
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var AelluxJs = root.AelluxJs;
    var extensionName = "scrollbox-snap";
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the scrollbox-snap extension.");
    var POINTER = "pointer", TOUCH = "touch", HORIZONTAL = "x", VERTICAL = "y", FALSE = "false", INSTANT = "instant", SMOOTH = "smooth", START = "start", END = "end", CENTER = "center", SCROLL_EVENT = "$scroll", SCROLL_END_EVENT = "$scrollend", WHEEL_EVENT = "$wheel", INTERACTION_EVENT = "$AelluxJsScrollboxInteraction", POINTER_DOWN_EVENT = "$pointerdown", POINTER_UP_EVENT = "$pointerup", POINTER_CANCEL_EVENT = "$pointercancel", TOUCH_START_EVENT = "$touchstart", TOUCH_END_EVENT = "$touchend", TOUCH_CANCEL_EVENT = "$touchcancel";
    var SNAP_SCROLL_IDLE_MS = 120;
    var SNAP_TARGET_IDLE_MS = 500;
    var scrollboxAttribute = AelluxJs.attr("scrollbox");
    var snapAttribute = AelluxJs.attr("scrollbox-snap");
    var itemAttribute = AelluxJs.attr("snap-item");
    var elasticAttribute = AelluxJs.attr("scrollbox-elastic");
    var readyClass = AelluxJs.className("snap-ready");
    var suspendedClass = AelluxJs.className("snap-suspended");
    var properties = ["--ae-snap-viewport", "--ae-snap-focus"];
    var states = /* @__PURE__ */ new Map();
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      next: next,
      previous: previous,
      goto: goto
    });
    function init() {
      return _init.apply(this, arguments);
    }
    function _init() {
      _init = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee() {
        var scrollbox;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              if (!AelluxJs.registry.ext.scrollbox) AelluxJs.ext("scrollbox");
              _context.n = 1;
              return AelluxJs.wait("scrollbox");
            case 1:
              scrollbox = _context.v;
              if (scrollbox) {
                _context.n = 2;
                break;
              }
              throw new Error("[aellux.js] Scrollbox Snap requires the Scrollbox extension.");
            case 2:
              AelluxJs.registerCssProperty.apply(AelluxJs, _toConsumableArray(properties.map(function(name) {
                return {
                  name: name,
                  syntax: "<number>",
                  initialValue: "0"
                };
              })));
              scrollbox.registerSnapController({
                next: next,
                previous: previous,
                goto: goto
              });
              AelluxJs.mountManager.add({
                extensionName: extensionName,
                selector: "[".concat(scrollboxAttribute, "][").concat(snapAttribute, "]:not([").concat(snapAttribute, '="').concat(FALSE, '"])'),
                priority: 1,
                mount: mount,
                update: update,
                unmount: unmount,
                controllers: []
              });
            case 3:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _init.apply(this, arguments);
    }
    function destroy() {
      var _AelluxJs$ext$scrollb;
      var _iterator = _createForOfIteratorHelper(states.keys()), _step;
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
      (_AelluxJs$ext$scrollb = AelluxJs.ext.scrollbox) === null || _AelluxJs$ext$scrollb === void 0 || _AelluxJs$ext$scrollb.unregisterSnapController({
        next: next,
        previous: previous,
        goto: goto
      });
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
    }
    function mount(element) {
      if (states.has(element)) return;
      var state = {
        element: element,
        root: null,
        index: 0,
        notifiedItem: null,
        notifiedIndex: null,
        target: null,
        targetAxis: null,
        timeout: null,
        wheelTimeout: null,
        activePointers: /* @__PURE__ */ new Set(),
        activeTouches: /* @__PURE__ */ new Set(),
        savedItems: /* @__PURE__ */ new Map(),
        suspensions: /* @__PURE__ */ new Set(),
        observer: null,
        resizeObserver: null,
        disposed: false
      };
      state.onScroll = function() {
        updateValues(state);
        if (state.target !== null && !targetReached(state)) scheduleTargetIdle(state);
        else scheduleSettle(state);
      };
      state.onScrollEnd = function() {
        return finish(state);
      };
      state.onPointerDown = function(event) {
        return beginGesture(state, POINTER, event);
      };
      state.onPointerEnd = function(event) {
        return endGesture(state, POINTER, event);
      };
      state.onTouchStart = function(event) {
        return beginGesture(state, TOUCH, event);
      };
      state.onTouchEnd = function(event) {
        return endGesture(state, TOUCH, event);
      };
      state.onWheel = function(event) {
        return handleWheel(state, event);
      };
      state.onInteraction = function(event) {
        return setSuspension(state, event.detail);
      };
      states.set(element, state);
      AelluxJs.onEvent(element, SCROLL_EVENT, state.onScroll, {
        passive: true
      });
      AelluxJs.onEvent(element, SCROLL_END_EVENT, state.onScrollEnd, {
        passive: true
      });
      AelluxJs.onEvent(element, POINTER_DOWN_EVENT, state.onPointerDown, true);
      AelluxJs.onEvent(element, TOUCH_START_EVENT, state.onTouchStart, {
        passive: true,
        capture: true
      });
      AelluxJs.onEvent(element, WHEEL_EVENT, state.onWheel, {
        passive: false,
        capture: true
      });
      AelluxJs.onEvent(element, INTERACTION_EVENT, state.onInteraction);
      AelluxJs.onEvent(root, POINTER_UP_EVENT, state.onPointerEnd, true);
      AelluxJs.onEvent(root, POINTER_CANCEL_EVENT, state.onPointerEnd, true);
      AelluxJs.onEvent(root, TOUCH_END_EVENT, state.onTouchEnd, true);
      AelluxJs.onEvent(root, TOUCH_CANCEL_EVENT, state.onTouchEnd, true);
      observe(state);
      configure(state);
    }
    function update(element) {
      var state = states.get(element);
      if (state) configure(state);
    }
    function unmount(element) {
      var _state$observer, _state$resizeObserver;
      var state = states.get(element);
      if (!state) return;
      state.disposed = true;
      clearTimer(state, "timeout");
      clearTimer(state, "wheelTimeout");
      (_state$observer = state.observer) === null || _state$observer === void 0 || _state$observer.disconnect();
      (_state$resizeObserver = state.resizeObserver) === null || _state$resizeObserver === void 0 || _state$resizeObserver.disconnect();
      AelluxJs.offEvent(element, SCROLL_EVENT, state.onScroll);
      AelluxJs.offEvent(element, SCROLL_END_EVENT, state.onScrollEnd);
      AelluxJs.offEvent(element, POINTER_DOWN_EVENT, state.onPointerDown, true);
      AelluxJs.offEvent(element, TOUCH_START_EVENT, state.onTouchStart, true);
      AelluxJs.offEvent(element, WHEEL_EVENT, state.onWheel, true);
      AelluxJs.offEvent(element, INTERACTION_EVENT, state.onInteraction);
      AelluxJs.offEvent(root, POINTER_UP_EVENT, state.onPointerEnd, true);
      AelluxJs.offEvent(root, POINTER_CANCEL_EVENT, state.onPointerEnd, true);
      AelluxJs.offEvent(root, TOUCH_END_EVENT, state.onTouchEnd, true);
      AelluxJs.offEvent(root, TOUCH_CANCEL_EVENT, state.onTouchEnd, true);
      restoreItems(state);
      element.classList.remove(readyClass, suspendedClass);
      states.delete(element);
    }
    function configure(state) {
      var nextRoot = elasticRoot(state.element);
      if (state.root !== nextRoot) {
        restoreItems(state);
        state.root = nextRoot;
        state.index = 0;
        state.notifiedItem = null;
        state.notifiedIndex = null;
      }
      var items = itemsFor(state);
      if (!items.length) {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_SCROLLBOX_SNAP_ITEMS, {
          element: state.element
        });
        state.element.classList.remove(readyClass, suspendedClass);
        return;
      }
      state.element.classList.add(readyClass);
      updateValues(state);
      if (state.notifiedItem === null) goto(state.element, 0, INSTANT);
    }
    function observe(state) {
      state.observer = new root.MutationObserver(function() {
        return configure(state);
      });
      state.observer.observe(state.element, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [snapAttribute, itemAttribute, elasticAttribute]
      });
      if (root.ResizeObserver) {
        state.resizeObserver = new root.ResizeObserver(function() {
          return updateValues(state);
        });
        state.resizeObserver.observe(state.element);
      }
    }
    function elasticRoot(element) {
      return Array.from(element.children).find(function(child) {
        return child.hasAttribute(elasticAttribute);
      }) || element;
    }
    function itemsFor(state) {
      if (!state.root) return [];
      return Array.from(state.root.querySelectorAll("[".concat(itemAttribute, "]"))).filter(function(item) {
        return item.closest("[".concat(scrollboxAttribute, "]")) === state.element;
      });
    }
    function axisFor(state) {
      return state.element.getAttribute(snapAttribute) === "vertical" ? VERTICAL : HORIZONTAL;
    }
    function alignment(item) {
      var value = item.getAttribute(itemAttribute);
      if (value === START || value === "left" || value === "top") return START;
      if (value === END || value === "right" || value === "bottom") return END;
      return CENTER;
    }
    function offset(state, item) {
      var axis = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : axisFor(state);
      var box = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : state.element.getBoundingClientRect();
      var target = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : item.getBoundingClientRect();
      var horizontal = axis === HORIZONTAL;
      var start = horizontal ? box.left + state.element.clientLeft : box.top + state.element.clientTop;
      var size = horizontal ? state.element.clientWidth : state.element.clientHeight;
      var itemStart = horizontal ? target.left : target.top;
      var itemSize = horizontal ? target.width : target.height;
      if (alignment(item) === START) return itemStart - start;
      if (alignment(item) === END) return itemStart + itemSize - (start + size);
      return itemStart + itemSize / 2 - (start + size / 2);
    }
    function updateValues(state) {
      if (state.disposed) return;
      var axis = axisFor(state), element = state.element;
      var rect = element.getBoundingClientRect();
      var size = axis === HORIZONTAL ? element.clientWidth : element.clientHeight;
      if (!size) return;
      var center = axis === HORIZONTAL ? rect.left + element.clientLeft + size / 2 : rect.top + element.clientTop + size / 2;
      var _iterator2 = _createForOfIteratorHelper(itemsFor(state)), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var item = _step2.value;
          if (!state.savedItems.has(item)) {
            state.savedItems.set(item, AelluxJs.persist.element.save(item, [], properties));
          }
          var box = item.getBoundingClientRect();
          var itemCenter = axis === HORIZONTAL ? box.left + box.width / 2 : box.top + box.height / 2;
          item.style.setProperty(properties[0], Math.max(-2, Math.min(2, (itemCenter - center) * 2 / size)));
          item.style.setProperty(properties[1], Math.max(0, 1 - Math.abs(offset(state, item, axis, rect, box)) / size));
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
    function restoreItems(state) {
      var _iterator3 = _createForOfIteratorHelper(state.savedItems.values()), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var memory = _step3.value;
          memory.restore();
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      state.savedItems.clear();
    }
    function goto(element, index) {
      var behavior = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : SMOOTH;
      var state = states.get(element), items = state && itemsFor(state);
      if (!state || !Number.isInteger(index) || index < 0 || index >= items.length) return false;
      var axis = axisFor(state), metrics = metricsFor(element);
      var destination = axis === HORIZONTAL ? Math.max(0, Math.min(metrics.x, element.scrollLeft + offset(state, items[index], axis))) : Math.max(0, Math.min(metrics.y, element.scrollTop + offset(state, items[index], axis)));
      state.index = index;
      state.target = destination;
      state.targetAxis = axis;
      if (axis === HORIZONTAL) element.scrollTo({
        left: destination,
        behavior: behavior
      });
      else element.scrollTo({
        top: destination,
        behavior: behavior
      });
      if (targetReached(state)) finish(state);
      return true;
    }
    function next(element) {
      var state = states.get(element);
      return state ? goto(element, Math.min(itemsFor(state).length - 1, selectedIndex(state) + 1)) : false;
    }
    function previous(element) {
      var state = states.get(element);
      return state ? goto(element, Math.max(0, selectedIndex(state) - 1)) : false;
    }
    function selectedIndex(state) {
      var items = itemsFor(state);
      var nearest = 0, distance = Infinity;
      for (var index = 0; index < items.length; index++) {
        var candidate = Math.abs(offset(state, items[index]));
        if (candidate < distance) {
          nearest = index;
          distance = candidate;
        }
      }
      return nearest;
    }
    function handleWheel(state, event) {
      if (event.ctrlKey || !event.cancelable || event.defaultPrevented) return;
      var axis = axisFor(state), horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      var delta = axis === HORIZONTAL ? horizontal ? event.deltaX : event.deltaY : horizontal ? 0 : event.deltaY;
      if (!delta) return;
      var items = itemsFor(state), index = state.target !== null ? state.index : selectedIndex(state);
      var nextIndex = index + Math.sign(delta);
      if (nextIndex < 0 || nextIndex >= items.length) return;
      event.preventDefault();
      if (state.wheelTimeout !== null) return;
      state.wheelTimeout = root.setTimeout(function() {
        state.wheelTimeout = null;
      }, SNAP_SCROLL_IDLE_MS);
      goto(state.element, nextIndex);
    }
    function setSuspension(state, detail) {
      if (!detail || !detail.reason) return;
      if (detail.active) state.suspensions.add(detail.reason);
      else state.suspensions.delete(detail.reason);
      state.element.classList.toggle(suspendedClass, state.suspensions.size > 0);
      if (!detail.active && state.suspensions.size === 0) scheduleSettle(state);
    }
    function beginGesture(state, kind, event) {
      var active = kind === POINTER ? state.activePointers : state.activeTouches;
      if (kind === POINTER) active.add(event.pointerId);
      else {
        var _iterator4 = _createForOfIteratorHelper(event.changedTouches), _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
            var touch = _step4.value;
            active.add(touch.identifier);
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }
      state.target = null;
      clearTimer(state, "timeout");
    }
    function endGesture(state, kind, event) {
      var active = kind === POINTER ? state.activePointers : state.activeTouches;
      if (kind === POINTER) active.delete(event.pointerId);
      else {
        var _iterator5 = _createForOfIteratorHelper(event.changedTouches), _step5;
        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
            var touch = _step5.value;
            active.delete(touch.identifier);
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
      }
      if (!state.activePointers.size && !state.activeTouches.size) scheduleSettle(state);
    }
    function scheduleSettle(state) {
      if (state.activePointers.size || state.activeTouches.size) return;
      clearTimer(state, "timeout");
      state.timeout = root.setTimeout(function() {
        return finish(state);
      }, SNAP_SCROLL_IDLE_MS);
    }
    function scheduleTargetIdle(state) {
      clearTimer(state, "timeout");
      state.timeout = root.setTimeout(function() {
        return finish(state);
      }, SNAP_TARGET_IDLE_MS);
    }
    function finish(state) {
      if (state.disposed) return;
      clearTimer(state, "timeout");
      state.target = null;
      var items = itemsFor(state), index = selectedIndex(state), item = items[index];
      if (!item || state.notifiedItem === item && state.notifiedIndex === index) return;
      var previousIndex = state.notifiedIndex;
      state.index = index;
      state.notifiedItem = item;
      state.notifiedIndex = index;
      AelluxJs.dispatchFrom(state.element, "ScrollboxSnapChange", {
        detail: {
          item: item,
          index: index,
          previousIndex: previousIndex,
          axis: axisFor(state)
        }
      });
    }
    function targetReached(state) {
      if (state.target === null) return false;
      var position = state.targetAxis === HORIZONTAL ? state.element.scrollLeft : state.element.scrollTop;
      return Math.abs(position - state.target) <= 1;
    }
    function clearTimer(state, name) {
      if (state[name] !== null) root.clearTimeout(state[name]);
      state[name] = null;
    }
    function metricsFor(element) {
      return {
        x: Math.max(0, element.scrollWidth - element.clientWidth),
        y: Math.max(0, element.scrollHeight - element.clientHeight)
      };
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.scrollbox-snap.legacy.js.map
