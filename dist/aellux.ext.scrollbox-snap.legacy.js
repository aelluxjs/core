(function() {
  // src/src/aellux.ext.scrollbox-snap.js
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
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
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
    var extensionName = "scrollbox-snap";
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the scrollbox-snap extension.");
    var POINTER = "pointer", GESTURE = "gesture", TOUCH = "touch", HORIZONTAL = "x", VERTICAL = "y", FALSE = "false", INSTANT = "instant", SMOOTH = "smooth", START = "start", END = "end", CENTER = "center", SCROLL_EVENT = "$scroll", SCROLL_END_EVENT = "$scrollend", INTERACTION_EVENT = "$AelluxJsScrollboxInteraction", SNAP_GESTURE_EVENT = "$AelluxJsScrollboxSnapGesture", SCROLLBOX_WHEEL_EVENT = "$AelluxJsScrollboxWheel", POINTER_DOWN_EVENT = "$pointerdown", POINTER_UP_EVENT = "$pointerup", POINTER_CANCEL_EVENT = "$pointercancel", TOUCH_START_EVENT = "$touchstart", TOUCH_END_EVENT = "$touchend", TOUCH_CANCEL_EVENT = "$touchcancel";
    var SNAP_SCROLL_IDLE_MS = 120;
    var SNAP_TARGET_IDLE_MS = 500;
    var SNAP_RELEASE_MS = 300;
    var SNAP_SWIPE_SPEED_PX_MS = 0.5;
    var SNAP_FLICK_WINDOW_MS = 100;
    var SNAP_FLICK_FAST_TIME_MS = 50;
    var SNAP_FLICK_MAX_DISTANCE_PX = 100;
    var SNAP_FLICK_MIN_DISTANCE_PX = 1;
    var scrollboxAttribute = AelluxJs.attr("scrollbox");
    var wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
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
      if (!AelluxJs.registry.ext.scrollbox) AelluxJs.ext("scrollbox");
      return AelluxJs.wait("scrollbox").then(function(scrollbox) {
        if (!scrollbox) throw new Error("[aellux.js] Scrollbox Snap requires the Scrollbox extension.");
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
      });
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
        edgeWheelTimeout: null,
        frame: null,
        activePointers: /* @__PURE__ */ new Set(),
        activeTouches: /* @__PURE__ */ new Set(),
        savedItems: /* @__PURE__ */ new Map(),
        suspensions: /* @__PURE__ */ new Set(),
        pointerScroll: null,
        flick: null,
        release: false,
        observer: null,
        resizeObserver: null,
        disposed: false
      };
      state.onScroll = function() {
        updateValues(state);
        scheduleSettle(state, state.target !== null && !targetReached(state));
      };
      state.onScrollEnd = function(event) {
        if (event.target !== state.element || state.target !== null && !targetReached(state)) return;
        finish(state);
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
      state.onBlur = function() {
        if (!hasActiveGesture(state)) return;
        state.activePointers.clear();
        state.activeTouches.clear();
        state.pointerScroll = null;
        state.flick = null;
        endDesktopGesture(state);
      };
      state.onScrollboxWheel = function(event) {
        var _event$detail;
        if (handleWheel(state, (_event$detail = event.detail) === null || _event$detail === void 0 ? void 0 : _event$detail.event)) event.preventDefault();
      };
      state.onInteraction = function(event) {
        return setSuspension(state, event.detail);
      };
      state.onSnapGesture = function(event) {
        return handlePointerScroll(state, event);
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
      AelluxJs.onEvent(element, INTERACTION_EVENT, state.onInteraction);
      AelluxJs.onEvent(element, SNAP_GESTURE_EVENT, state.onSnapGesture);
      AelluxJs.onEvent(element, SCROLLBOX_WHEEL_EVENT, state.onScrollboxWheel);
      AelluxJs.onEvent(root, POINTER_UP_EVENT, state.onPointerEnd, true);
      AelluxJs.onEvent(root, POINTER_CANCEL_EVENT, state.onPointerEnd, true);
      AelluxJs.onEvent(root, TOUCH_END_EVENT, state.onTouchEnd, true);
      AelluxJs.onEvent(root, TOUCH_CANCEL_EVENT, state.onTouchEnd, true);
      AelluxJs.onEvent(root, "$blur", state.onBlur);
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
      cancelRelease(state);
      clearTimer(state, "timeout");
      clearTimer(state, "wheelTimeout");
      clearTimer(state, "edgeWheelTimeout");
      (_state$observer = state.observer) === null || _state$observer === void 0 || _state$observer.disconnect();
      (_state$resizeObserver = state.resizeObserver) === null || _state$resizeObserver === void 0 || _state$resizeObserver.disconnect();
      AelluxJs.offEvent(element, SCROLL_EVENT, state.onScroll);
      AelluxJs.offEvent(element, SCROLL_END_EVENT, state.onScrollEnd);
      AelluxJs.offEvent(element, POINTER_DOWN_EVENT, state.onPointerDown, true);
      AelluxJs.offEvent(element, TOUCH_START_EVENT, state.onTouchStart, true);
      AelluxJs.offEvent(element, INTERACTION_EVENT, state.onInteraction);
      AelluxJs.offEvent(element, SNAP_GESTURE_EVENT, state.onSnapGesture);
      AelluxJs.offEvent(element, SCROLLBOX_WHEEL_EVENT, state.onScrollboxWheel);
      AelluxJs.offEvent(root, POINTER_UP_EVENT, state.onPointerEnd, true);
      AelluxJs.offEvent(root, POINTER_CANCEL_EVENT, state.onPointerEnd, true);
      AelluxJs.offEvent(root, TOUCH_END_EVENT, state.onTouchEnd, true);
      AelluxJs.offEvent(root, TOUCH_CANCEL_EVENT, state.onTouchEnd, true);
      AelluxJs.offEvent(root, "$blur", state.onBlur);
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
      var free = arguments.length > 3 ? arguments[3] : void 0;
      var box = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : state.element.getBoundingClientRect();
      var target = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : item.getBoundingClientRect();
      var horizontal = axis === HORIZONTAL;
      var start = horizontal ? box.left + state.element.clientLeft : box.top + state.element.clientTop;
      var size = horizontal ? state.element.clientWidth : state.element.clientHeight;
      var itemStart = horizontal ? target.left : target.top;
      var itemSize = horizontal ? target.width : target.height;
      if (free && itemSize > size) return Math.max(itemStart - start, Math.min(itemStart + itemSize - start - size, 0));
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
          item.style.setProperty(properties[1], Math.max(0, 1 - Math.abs(offset(state, item, axis, false, rect, box)) / size));
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
      var free = arguments.length > 3 ? arguments[3] : void 0;
      var state = states.get(element), items = state && itemsFor(state);
      if (!state || state.activeTouches.size || !Number.isInteger(index) || index < 0 || index >= items.length) return false;
      var axis = axisFor(state), metrics = metricsFor(element);
      var position = axis === HORIZONTAL ? element.scrollLeft : element.scrollTop;
      var destination = Math.max(0, Math.min(metrics[axis], position + offset(state, items[index], axis, free)));
      state.index = index;
      state.target = destination;
      state.targetAxis = axis;
      cancelRelease(state);
      if (state.release && behavior === SMOOTH) animateRelease(state, position, destination, axis);
      else scrollTo(state, destination, axis, behavior);
      if (targetReached(state)) {
        cancelRelease(state);
        finish(state);
      }
      return true;
    }
    function scrollTo(state, position, axis, behavior) {
      state.element.scrollTo(axis === HORIZONTAL ? {
        left: position,
        behavior: behavior
      } : {
        top: position,
        behavior: behavior
      });
    }
    function cancelRelease(state) {
      if (state.frame !== null) root.cancelAnimationFrame(state.frame);
      state.frame = null;
    }
    function animateRelease(state, from, to, axis) {
      var start = root.performance.now();
      var _step4 = function step(time) {
        var progress = Math.max(0, Math.min(1, (time - start) / SNAP_RELEASE_MS));
        scrollTo(state, from + (to - from) * (1 - Math.pow(1 - progress, 3)), axis, INSTANT);
        if (progress < 1) state.frame = root.requestAnimationFrame(_step4);
        else {
          cancelRelease(state);
          finish(state);
        }
      };
      state.frame = root.requestAnimationFrame(_step4);
    }
    function next(element) {
      var state = states.get(element);
      return state ? goto(element, Math.min(itemsFor(state).length - 1, selectedIndex(state) + 1)) : false;
    }
    function previous(element) {
      var state = states.get(element);
      return state ? goto(element, Math.max(0, selectedIndex(state) - 1)) : false;
    }
    function selectedIndex(state, free) {
      var items = itemsFor(state);
      var axis = axisFor(state), maximum = metricsFor(state.element)[axis];
      var position = axis === HORIZONTAL ? state.element.scrollLeft : state.element.scrollTop;
      if (items.length > 1) {
        if (position <= 1) return 0;
        if (maximum > 0 && position >= maximum - 1) return items.length - 1;
      }
      var nearest = 0, distance = Infinity;
      for (var index = 0; index < items.length; index++) {
        var candidate = Math.abs(Math.max(0, Math.min(maximum, position + offset(state, items[index], axis, free))) - position);
        if (candidate < distance) {
          nearest = index;
          distance = candidate;
        }
      }
      return nearest;
    }
    function handleWheel(state, event) {
      if (!event || event.ctrlKey || !event.cancelable || event.defaultPrevented || event.target.closest("[".concat(scrollboxAttribute, "]")) !== state.element) return false;
      var axis = axisFor(state), horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (axis === HORIZONTAL && !horizontal && state.element.getAttribute(wheelAttribute) === FALSE) return false;
      var delta = axis === HORIZONTAL ? horizontal ? event.deltaX : event.deltaY : horizontal ? 0 : event.deltaY;
      if (!delta) return false;
      var items = itemsFor(state), index = state.target !== null ? state.index : selectedIndex(state);
      if (!items.length) return false;
      var nextIndex = index + Math.sign(delta);
      if (nextIndex < 0 || nextIndex >= items.length) {
        if (state.target !== null && !targetReached(state)) {
          event.preventDefault();
          return true;
        }
        var behavior = root.getComputedStyle(state.element)[axis === HORIZONTAL ? "overscrollBehaviorX" : "overscrollBehaviorY"];
        if (behavior === "contain" || behavior === "none") {
          event.preventDefault();
          return true;
        }
        setSuspension(state, {
          reason: "wheel-edge",
          active: true
        });
        clearTimer(state, "edgeWheelTimeout");
        state.edgeWheelTimeout = root.setTimeout(function() {
          state.edgeWheelTimeout = null;
          setSuspension(state, {
            reason: "wheel-edge",
            active: false
          });
        }, SNAP_SCROLL_IDLE_MS);
        return false;
      }
      event.preventDefault();
      if (state.wheelTimeout !== null) return true;
      state.wheelTimeout = root.setTimeout(function() {
        state.wheelTimeout = null;
      }, SNAP_SCROLL_IDLE_MS);
      goto(state.element, nextIndex);
      return true;
    }
    function setSuspension(state, detail) {
      if (!detail || !detail.reason) return;
      if (detail.active) state.suspensions.add(detail.reason);
      else state.suspensions.delete(detail.reason);
      state.element.classList.toggle(suspendedClass, state.suspensions.size > 0);
      if (!detail.active) {
        settlePointer(state);
        if (!state.suspensions.size) scheduleSettle(state);
      }
    }
    function handlePointerScroll(state, event) {
      var _state$pointerScroll;
      var detail = event.detail;
      if (!detail || detail.axis !== axisFor(state)) return;
      var items = itemsFor(state);
      if (!items.length) return;
      if (detail.phase === "start" || detail.phase === "probe") {
        state.pointerScroll = {
          axis: detail.axis,
          index: selectedIndex(state)
        };
        if (detail.phase === "start") state.flick = null;
        else event.preventDefault();
        return;
      }
      if (detail.phase !== "end") return;
      var start = ((_state$pointerScroll = state.pointerScroll) === null || _state$pointerScroll === void 0 ? void 0 : _state$pointerScroll.axis) === detail.axis ? state.pointerScroll.index : selectedIndex(state);
      state.pointerScroll = null;
      var flick = isFlick(detail);
      if (!detail.moved && !flick) return;
      event.preventDefault();
      if (!flick) return;
      var distance = detail.axis === HORIZONTAL ? detail.startX - detail.lastX : detail.startY - detail.lastY;
      var index = Math.max(0, Math.min(items.length - 1, start + Math.sign(distance)));
      if (index !== start) state.flick = index;
    }
    function isFlick(detail) {
      var distance = detail.axis === HORIZONTAL ? detail.startX - detail.lastX : detail.startY - detail.lastY;
      var elapsed = Math.max(1, detail.endTime - detail.startTime);
      return elapsed <= SNAP_FLICK_WINDOW_MS && Math.abs(distance) > SNAP_FLICK_MIN_DISTANCE_PX && Math.abs(distance) < SNAP_FLICK_MAX_DISTANCE_PX && (elapsed <= SNAP_FLICK_FAST_TIME_MS || Math.abs(distance) / elapsed >= SNAP_SWIPE_SPEED_PX_MS);
    }
    function beginGesture(state, kind, event) {
      var active = kind === POINTER ? state.activePointers : state.activeTouches;
      if (kind === POINTER) active.add(event.pointerId);
      else {
        var _iterator4 = _createForOfIteratorHelper(event.changedTouches), _step5;
        try {
          for (_iterator4.s(); !(_step5 = _iterator4.n()).done; ) {
            var touch = _step5.value;
            active.add(touch.identifier);
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }
      state.target = null;
      state.release = false;
      cancelRelease(state);
      state.pointerScroll = null;
      state.flick = null;
      clearTimer(state, "timeout");
      if (kind === POINTER && event.pointerType !== TOUCH) {
        var element = state.element, left = element.scrollLeft, top = element.scrollTop;
        setSuspension(state, {
          reason: GESTURE,
          active: true
        });
        element.scrollTo({
          left: left > 0 ? left - 1 : 1,
          top: top > 0 ? top - 1 : 1,
          behavior: INSTANT
        });
        element.scrollTo({
          left: left,
          top: top,
          behavior: INSTANT
        });
      } else setSuspension(state, {
        reason: GESTURE,
        active: false
      });
    }
    function endGesture(state, kind, event) {
      var active = kind === POINTER ? state.activePointers : state.activeTouches;
      if (kind === POINTER) active.delete(event.pointerId);
      else {
        var _iterator5 = _createForOfIteratorHelper(event.changedTouches), _step6;
        try {
          for (_iterator5.s(); !(_step6 = _iterator5.n()).done; ) {
            var touch = _step6.value;
            active.delete(touch.identifier);
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
      }
      if (!hasActiveGesture(state)) endDesktopGesture(state);
    }
    function hasActiveGesture(state) {
      return state.activePointers.size || state.activeTouches.size;
    }
    function endDesktopGesture(state) {
      if (!state.suspensions.has(GESTURE)) {
        scheduleSettle(state);
        return;
      }
      state.release = true;
      root.setTimeout(function() {
        return settlePointer(state);
      }, 0);
    }
    function settlePointer(state) {
      if (state.disposed || !releaseReady(state) || state.target !== null || hasActiveGesture(state)) return;
      var flick = state.flick;
      state.flick = null;
      goto(state.element, flick !== null ? flick : selectedIndex(state, true), AelluxJs.currentPreference("reduced-motion") === "reduced" ? INSTANT : SMOOTH, flick === null);
    }
    function releaseReady(state) {
      return state.release && state.suspensions.size === 1;
    }
    function scheduleSettle(state, target) {
      if (!target && (hasActiveGesture(state) || state.suspensions.size && !state.release)) return;
      clearTimer(state, "timeout");
      state.timeout = root.setTimeout(function() {
        return finish(state);
      }, target ? SNAP_TARGET_IDLE_MS : SNAP_SCROLL_IDLE_MS);
    }
    function finish(state) {
      if (state.disposed || state.frame !== null || hasActiveGesture(state)) return;
      if (state.suspensions.size) {
        if (!releaseReady(state) || !targetReached(state)) return;
        state.release = false;
        setSuspension(state, {
          reason: GESTURE,
          active: false
        });
      }
      clearTimer(state, "timeout");
      cancelRelease(state);
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
