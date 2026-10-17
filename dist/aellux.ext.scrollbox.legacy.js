(function() {
  // src/src/aellux.ext.scrollbox.js
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
    var extensionName = "scrollbox";
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the scrollbox extension.");
    var onTarget = AelluxJs.onTarget, offTarget = AelluxJs.offTarget;
    var POINTER = "pointer", POINTER_DOWN = "".concat(POINTER, "down"), POINTER_MOVE = "".concat(POINTER, "move"), POINTER_UP = "".concat(POINTER, "up"), POINTER_CANCEL = "".concat(POINTER, "cancel"), POINTER_OVER = "".concat(POINTER, "over"), POINTER_OUT = "".concat(POINTER, "out"), POINTER_ENTER = "".concat(POINTER, "enter"), POINTER_LEAVE = "".concat(POINTER, "leave"), POINTER_DOWN_TARGET = "$".concat(POINTER_DOWN), POINTER_MOVE_TARGET = "$".concat(POINTER_MOVE), POINTER_UP_TARGET = "$".concat(POINTER_UP), POINTER_CANCEL_TARGET = "$".concat(POINTER_CANCEL);
    var attribute = AelluxJs.attr(extensionName);
    var wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
    var momentumAttribute = AelluxJs.attr("scrollbox-momentum");
    var elasticAttribute = AelluxJs.attr("scrollbox-elastic");
    var snapAttribute = AelluxJs.attr("scrollbox-snap");
    var snapItemAttribute = AelluxJs.attr("snap-item");
    var scrollbarAttribute = AelluxJs.attr("scrollbar");
    var scrollbarVerticalAttribute = AelluxJs.attr("scrollbar-vertical");
    var scrollbarHorizontalAttribute = AelluxJs.attr("scrollbar-horizontal");
    var elasticReleaseClass = AelluxJs.className("scrollbox-elastic-release");
    var pointerScrollingClass = AelluxJs.className("pointerscrolling");
    var nativeScrollbarHideClass = AelluxJs.className("native-sb-hide");
    var scrollbarVisibleClass = AelluxJs.className("scrollbar-visible");
    var snapReadyClass = AelluxJs.className("snap-ready");
    var snapSuspendedClass = AelluxJs.className("snap-suspended");
    var scrollEdgeClasses = [AelluxJs.className("scroll-v-start"), AelluxJs.className("scroll-v-end"), AelluxJs.className("scroll-h-start"), AelluxJs.className("scroll-h-end")];
    var pointerScrollExceptionSelector = "a, button, input, select, textarea, [contenteditable], [draggable='true'], " + "[".concat(scrollbarVerticalAttribute, "], [").concat(scrollbarHorizontalAttribute, "]");
    var RESIZE_INTERVAL_MS = 100;
    var SCROLL_EDGE_MARGIN_PX = 5;
    var POINTER_SCROLL_THRESHOLD_PX = 3;
    var POINTER_SCROLL_MULTICLICK_MS = 500;
    var POINTER_SCROLL_MULTICLICK_DISTANCE_PX = 8;
    var TEXT_SELECTION_WAIT_MS = 100;
    var VERTICAL_TEXT_DRAG_PX = 10;
    var MOMENTUM_LIMIT_TIME_MS = 300;
    var MOMENTUM_LIMIT_DISTANCE_PX = 15;
    var MOMENTUM_DECELERATION = 15e-4;
    var SNAP_SWIPE_SPEED_PX_MS = 0.5;
    var SNAP_FLICK_WINDOW_MS = 100;
    var SNAP_FLICK_FAST_TIME_MS = 50;
    var SNAP_FLICK_MAX_DISTANCE_PX = 100;
    var SNAP_FLICK_MIN_DISTANCE_PX = 1;
    var SNAP_SCROLL_IDLE_MS = 120;
    var SNAP_TARGET_IDLE_MS = 500;
    var SNAP_EDGE_DISTANCE_PX = 10;
    var ELASTIC_DAMPING = 1 / 3;
    var DEFAULT_ELASTIC_LIMIT = {
      unit: "ratio",
      value: 1 / 4
    };
    var ELASTIC_RETURN_LERP = 0.15;
    var ELASTIC_RETURN_EPSILON = 0.01;
    var ELASTIC_WHEEL_IDLE_MS = 80;
    var SCROLLBAR_SIZE_PX = 8;
    var SCROLLBAR_MIN_THUMB_PX = 20;
    var SCROLLBAR_INTERACTION_HIDE_DELAY_MS = 1e3;
    var SCROLLBAR_HOVER_HIDE_DELAY_MS = 300;
    var scrollbarProperties = ["--ae-scrollbar-x", "--ae-scrollbar-y", "--ae-scrollbar-length", "--ae-scrollbar-thumb-size", "--ae-scrollbar-thumb-position", "--ae-scrollbar-display"];
    var pointerListeners = [[POINTER_DOWN, "onPointerDown"], [POINTER_OVER, "onPointerOver"], [POINTER_OUT, "onPointerOut"], ["mousedown", "onMouseDown"]];
    var scrollbarHoverListeners = [[POINTER_DOWN, "onScrollbarPointerDown"], [POINTER_ENTER, "onScrollbarPointerEnter"], [POINTER_LEAVE, "onScrollbarPointerLeave"], [POINTER_OVER, "onScrollbarPointerOver"], [POINTER_OUT, "onScrollbarPointerOut"], [POINTER_MOVE, "onScrollbarPointerMove"], [POINTER_UP, "onScrollbarPointerEnd"], [POINTER_CANCEL, "onScrollbarPointerEnd"], ["mouseenter", "onScrollbarMouseEnter"], ["mouseleave", "onScrollbarMouseLeave"], ["mouseover", "onScrollbarMouseOver"], ["mouseout", "onScrollbarMouseOut"]];
    var scrollbarAxisListeners = [[POINTER_DOWN, "onPointerDown"], [POINTER_MOVE, "onPointerMove"], [POINTER_UP, "onPointerEnd"], [POINTER_CANCEL, "onPointerEnd"]];
    var snapEndListeners = [[POINTER_UP, "onSnapPointerEnd", true], [POINTER_CANCEL, "onSnapPointerEnd", true], ["touchend", "onSnapTouchEnd", true], ["touchcancel", "onSnapTouchEnd", true], ["blur", "onSnapBlur"]];
    var touchListeners = [["touchstart", "onTouchStart", {
      passive: true
    }], ["touchmove", "onTouchMove", {
      passive: false
    }], ["touchend", "onTouchEnd", {
      passive: true
    }], ["touchcancel", "onTouchEnd", {
      passive: true
    }]];
    function setListeners(target, owner, entries, active) {
      var method = active ? onTarget : offTarget;
      var _iterator = _createForOfIteratorHelper(entries), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var _step$value = _slicedToArray(_step.value, 3), event = _step$value[0], handler = _step$value[1], options = _step$value[2];
          method(target, "$".concat(event), owner[handler], active ? options : options === true || !!(options !== null && options !== void 0 && options.capture));
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    var pointerScrollMouseEvents = ["mousedown", "mousemove", "mouseup", "click", "dblclick", "auxclick", "contextmenu", "mouseover", "mouseout", "mouseenter", "mouseleave"];
    var pointerScrollDragEvents = ["dragstart", "drag", "dragenter", "dragover", "dragleave", "drop", "dragend"];
    var mouseHoldEvents = /* @__PURE__ */ new Set(["mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave"]);
    var mouseReleaseEvents = /* @__PURE__ */ new Set(["mouseup", "click", "dblclick", "auxclick", "contextmenu"]);
    var properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
    var snapProperties = ["--ae-snap-viewport", "--ae-snap-focus"];
    var scrollboxes = /* @__PURE__ */ new Map();
    var elementMemories = /* @__PURE__ */ new WeakMap();
    var cursorMemories = /* @__PURE__ */ new WeakMap();
    var scrollbarMemories = /* @__PURE__ */ new WeakMap();
    var inlineMemories = /* @__PURE__ */ new WeakMap();
    var elasticMemories = /* @__PURE__ */ new WeakMap();
    var pointerScrollMemories = /* @__PURE__ */ new WeakMap();
    var snapItemMemories = /* @__PURE__ */ new WeakMap();
    var activePointerScrollState = null;
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      next: next,
      previous: previous,
      goto: goto
    });
    function init() {
      AelluxJs.registerCssProperty.apply(AelluxJs, _toConsumableArray([].concat(properties, snapProperties).map(function(name) {
        return {
          name: name,
          syntax: "<number>",
          inherits: false,
          initialValue: "0"
        };
      })).concat(_toConsumableArray(scrollbarProperties.map(function(name, index) {
        return {
          name: name,
          syntax: index === 5 ? "block | none" : "<length>",
          inherits: false,
          initialValue: index === 5 ? "none" : "0px"
        };
      }))));
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attribute, "]"),
        priority: 0,
        mount: mountScrollbox,
        update: updateScrollbox,
        unmount: unmountScrollbox,
        controllers: ["next", "previous", "goto"]
      });
    }
    function destroy() {
      var _iterator2 = _createForOfIteratorHelper(scrollboxes.keys()), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var element = _step2.value;
          unmountScrollbox(element);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
    }
    function mountScrollbox(element) {
      if (scrollboxes.has(element)) return;
      elementMemories.set(element, AelluxJs.persist.element.save(element, [], properties));
      cursorMemories.set(element, AelluxJs.persist.element.save(element, [], ["cursor"]));
      var elastic = {
        wrapper: null,
        baseTransform: "",
        baseOrigin: "",
        dimensions: null,
        invalidReported: false,
        invalidLimit: null,
        limits: [DEFAULT_ELASTIC_LIMIT, DEFAULT_ELASTIC_LIMIT],
        amounts: [0, 0, 0, 0],
        active: false,
        owned: false,
        touch: null,
        releaseFrame: null,
        wheelTimeout: null
      };
      var snap = {
        root: null,
        initialized: false,
        invalidReported: false,
        index: 0,
        flick: null,
        axis: null,
        deferredIndex: null,
        suspensions: {
          pointer: false,
          elastic: false,
          scrollbar: false,
          wheel: false
        },
        notifiedItem: null,
        notifiedIndex: null,
        scrollEndTimeout: null,
        scrollingToTarget: -1,
        scrollingToAxis: null,
        wheelTimeout: null,
        edgeWheelTimeout: null,
        activePointers: /* @__PURE__ */ new Set(),
        activeTouches: /* @__PURE__ */ new Set(),
        savedItems: /* @__PURE__ */ new Set(),
        gestureListening: false,
        endListening: false,
        waitingForGestureEnd: false
      };
      var inlineWrapper = {
        element: null,
        owned: false,
        reportedDisplay: null
      };
      var scrollbar = {
        x: null,
        y: null,
        drag: null,
        hideOwned: false,
        visibleOwned: false,
        listening: false,
        pointerHover: false,
        mouseHover: false,
        hoverVisible: false,
        hoverTimeout: null,
        interactionVisible: false,
        interactionTimeout: null
      };
      var state = {
        element: element,
        metrics: null,
        mode: null,
        desktop: false,
        cursor: {
          owned: false
        },
        wheelEnabled: true,
        momentumEnabled: true,
        elasticEnabled: false,
        snapEnabled: false,
        wheelListening: false,
        pointerListening: false,
        touchListening: false,
        pointerScroll: null,
        lastPointerDown: null,
        mouseReleaseButton: null,
        mouseReleaseTimeout: null,
        momentum: null,
        elastic: elastic,
        snap: snap,
        inlineWrapper: inlineWrapper,
        scrollbar: scrollbar,
        resizeObserver: null,
        mutationObserver: null,
        desktopMedia: null,
        publishPending: false,
        publishDirty: false,
        layoutRevision: 0,
        lastResizeTime: -RESIZE_INTERVAL_MS,
        resizeTimeout: null,
        disposed: false
      };
      state.onScroll = function(event) {
        if (event.target !== element) return;
        publish(state);
        if (!state.desktop && state.scrollbar.listening) scheduleScrollbarInteractionHide(state);
        if (!state.snapEnabled) return;
        if (state.snap.scrollingToTarget !== -1) {
          if (!snapTargetReached(state)) {
            scheduleSnapTargetIdle(state);
            return;
          }
          clearSnapTarget(state);
          scheduleScrollEnd(state);
        } else if (!("onscrollend" in element) || state.snap.scrollEndTimeout !== null) {
          scheduleScrollEnd(state);
        }
      };
      state.onScrollEnd = function(event) {
        if (event.target !== element) return;
        clearSnapTarget(state);
        clearScrollEnd(state);
        finishNativeScroll(state);
      };
      state.onWheel = function(event) {
        return handleWheel(state, event);
      };
      state.onPointerDown = function(event) {
        return startPointerScroll(state, event);
      };
      state.onPointerOver = function(event) {
        return updatePointerScrollCursor(state, event.target, event.clientX, event.clientY);
      };
      state.onPointerOut = function(event) {
        if (state.pointerScroll && state.pointerScroll.moved) return;
        if (!event.relatedTarget || !element.contains(event.relatedTarget)) restorePointerScrollCursor(state);
      };
      state.onMouseDown = function(event) {
        if (event.button === 0 && event.detail > 1) endPointerScroll(state);
      };
      state.onPointerMove = function(event) {
        return movePointerScroll(state, event);
      };
      state.onMouseEvent = function(event) {
        return cancelPointerScrollMouseEvent(state, event);
      };
      state.onPointerScrollTouchMove = function(event) {
        if (state.pointerScroll && state.pointerScroll.moved && event.cancelable) event.preventDefault();
      };
      state.onPointerScrollNativeEvent = function(event) {
        if (state.pointerScroll && state.pointerScroll.moved && event.cancelable) event.preventDefault();
      };
      state.onPointerEnd = function(event) {
        return endPointerScroll(state, event);
      };
      state.onBlur = function() {
        return endPointerScroll(state);
      };
      state.onTouchStart = function(event) {
        return startTouch(state, event);
      };
      state.onTouchMove = function(event) {
        return moveTouch(state, event);
      };
      state.onTouchEnd = function(event) {
        return endTouch(state, event);
      };
      state.onSnapPointerDown = function(event) {
        return beginSnapGesture(state, POINTER, event);
      };
      state.onSnapPointerEnd = function(event) {
        return endSnapGesture(state, POINTER, event);
      };
      state.onSnapTouchStart = function(event) {
        return beginSnapGesture(state, "touch", event);
      };
      state.onSnapTouchEnd = function(event) {
        return endSnapGesture(state, "touch", event);
      };
      state.onSnapBlur = function() {
        return endSnapGesture(state);
      };
      state.onScrollbarPointerDown = function() {
        return startScrollbarInteractionVisibility(state);
      };
      state.onScrollbarPointerEnd = function() {
        return scheduleScrollbarInteractionHide(state);
      };
      state.onScrollbarPointerEnter = function(event) {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", true);
      };
      state.onScrollbarPointerLeave = function(event) {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", false);
      };
      state.onScrollbarPointerOver = function(event) {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", true);
      };
      state.onScrollbarPointerOut = function(event) {
        if (event.pointerType !== "touch" && (!event.relatedTarget || !element.contains(event.relatedTarget))) setScrollbarHover(state, "pointerHover", false);
      };
      state.onScrollbarPointerMove = function(event) {
        if (event.pointerType !== "touch" && !state.scrollbar.pointerHover) setScrollbarHover(state, "pointerHover", true);
      };
      state.onScrollbarMouseEnter = function() {
        if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
      };
      state.onScrollbarMouseLeave = function() {
        return setScrollbarHover(state, "mouseHover", false);
      };
      state.onScrollbarMouseOver = function() {
        if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
      };
      state.onScrollbarMouseOut = function(event) {
        if (!event.relatedTarget || !element.contains(event.relatedTarget)) setScrollbarHover(state, "mouseHover", false);
      };
      state.onScrollbarOutsideDown = function(event) {
        if (!element.contains(event.target)) {
          setScrollbarHover(state, "pointerHover", false);
          setScrollbarHover(state, "mouseHover", false);
          if (!element.classList.contains(pointerScrollingClass)) clearScrollbarInteractionVisibility(state);
          syncScrollbarVisibility(state);
        }
      };
      scrollboxes.set(element, state);
      onTarget(element, "$scroll", state.onScroll, {
        passive: true
      });
      onTarget(element, "$scrollend", state.onScrollEnd, {
        passive: true
      });
      observe(state);
      configure(state);
    }
    function updateScrollbox(element) {
      var state = scrollboxes.get(element);
      if (state) configure(state);
    }
    function unmountScrollbox(element) {
      var _elementMemories$get;
      var state = scrollboxes.get(element);
      if (!state) return;
      state.disposed = true;
      if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) endPointerScroll(activePointerScrollState);
      endPointerScroll(state);
      stopPointerScrollMouseEvents(state);
      restorePointerScrollCursor(state);
      cancelMomentum(state);
      state.snap.flick = null;
      state.snap.deferredIndex = null;
      clearSnapTarget(state);
      clearScrollEnd(state);
      removeSnapGestureListeners(state);
      restoreSnapStyles(state);
      resetElastic(state);
      if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
      restoreInlineWrapper(state);
      resetScrollbars(state);
      offTarget(element, "$scroll", state.onScroll);
      offTarget(element, "$scrollend", state.onScrollEnd);
      if (state.wheelListening) offTarget(element, "$wheel", state.onWheel, true);
      if (state.pointerListening) setListeners(element, state, pointerListeners, false);
      if (state.touchListening) removeTouchListeners(state);
      if (state.resizeObserver) state.resizeObserver.disconnect();
      if (state.mutationObserver) state.mutationObserver.disconnect();
      if (state.desktopMedia) {
        if (state.desktopMedia.removeEventListener) state.desktopMedia.removeEventListener("change", state.onDesktopMediaChange);
        else if (state.desktopMedia.removeListener) state.desktopMedia.removeListener(state.onDesktopMediaChange);
      }
      if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
      offTarget(root, "$resize", state.onResize);
      (_elementMemories$get = elementMemories.get(element)) === null || _elementMemories$get === void 0 || _elementMemories$get.restore();
      elementMemories.delete(element);
      cursorMemories.delete(element);
      var _iterator3 = _createForOfIteratorHelper(scrollEdgeClasses), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var name = _step3.value;
          element.classList.remove(name);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      scrollboxes.delete(element);
    }
    function configure(state) {
      var element = state.element;
      state.layoutRevision++;
      state.mode = readMode(element);
      state.wheelEnabled = element.getAttribute(wheelAttribute) !== "false";
      state.momentumEnabled = element.getAttribute(momentumAttribute) !== "false";
      configureElastic(state);
      configureSnap(state);
      configureInlineWrapper(state);
      configureScrollbars(state);
      state.desktop = isDesktop();
      if ((state.desktop || state.elasticEnabled || state.snapEnabled) && !state.wheelListening) {
        onTarget(element, "$wheel", state.onWheel, {
          passive: false,
          capture: true
        });
        state.wheelListening = true;
      } else if (!state.desktop && !state.elasticEnabled && !state.snapEnabled && state.wheelListening) {
        offTarget(element, "$wheel", state.onWheel, true);
        state.wheelListening = false;
      }
      if (state.elasticEnabled && !state.touchListening) addTouchListeners(state);
      else if (!state.elasticEnabled && state.touchListening) removeTouchListeners(state);
      if (!state.elasticEnabled) resetElastic(state);
      var pointerEnabled = state.desktop && state.mode === POINTER;
      if (!pointerEnabled || !state.momentumEnabled) cancelMomentum(state);
      if (pointerEnabled && !state.pointerListening) {
        setListeners(element, state, pointerListeners, true);
        state.pointerListening = true;
      } else if (!pointerEnabled && state.pointerListening) {
        if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) endPointerScroll(activePointerScrollState);
        setListeners(element, state, pointerListeners, false);
        state.pointerListening = false;
        endPointerScroll(state);
        state.lastPointerDown = null;
        restorePointerScrollCursor(state);
      }
      if (state.snapEnabled) syncSnapStyles(state);
      refresh(state);
      if (state.snapEnabled && !state.snap.initialized) initializeSnap(state);
    }
    function contentChildren(element) {
      return Array.from(element.children).filter(function(child) {
        return !child.hasAttribute(scrollbarVerticalAttribute) && !child.hasAttribute(scrollbarHorizontalAttribute);
      });
    }
    function scrollbarAxes(value) {
      if (value === null) return {
        x: false,
        y: false
      };
      var tokens = value.toLowerCase().trim().split(/[\s,|/+]+/).filter(Boolean);
      if (!tokens.length) return {
        x: true,
        y: true
      };
      var axes = {
        x: false,
        y: false
      };
      var _iterator4 = _createForOfIteratorHelper(tokens), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var token = _step4.value;
          var short = token.replace(/horizontal/g, "h").replace(/vertical/g, "v");
          if (!/^[vhxy]+$/.test(short)) continue;
          if (/[hx]/.test(short)) axes.x = true;
          if (/[vy]/.test(short)) axes.y = true;
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      return axes;
    }
    function supportsMouseHover() {
      return !!(root.matchMedia && root.matchMedia("(any-hover: hover)").matches);
    }
    function configureScrollbars(state) {
      var element = state.element;
      var value = element.getAttribute(scrollbarAttribute);
      var axes = scrollbarAxes(value);
      configureScrollbarAxis(state, "y", axes.y, scrollbarVerticalAttribute);
      configureScrollbarAxis(state, "x", axes.x, scrollbarHorizontalAttribute);
      var enabled = axes.x || axes.y;
      var scrollbar = state.scrollbar;
      if (enabled && !scrollbar.listening) {
        scrollbar.mouseHover = element.matches(":hover") && supportsMouseHover();
        scrollbar.hoverVisible = scrollbar.mouseHover;
        setListeners(element, state, scrollbarHoverListeners, true);
        AelluxJs.on(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
        scrollbar.listening = true;
        syncScrollbarVisibility(state);
      } else if (!enabled && scrollbar.listening) {
        setListeners(element, state, scrollbarHoverListeners, false);
        AelluxJs.off(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
        scrollbar.listening = false;
        clearScrollbarInteractionVisibility(state);
        clearScrollbarHover(state);
        syncScrollbarVisibility(state);
      }
      var hideNative = enabled || value !== null && value.trim().toLowerCase() === "none";
      if (hideNative && !element.classList.contains(nativeScrollbarHideClass)) {
        element.classList.add(nativeScrollbarHideClass);
        scrollbar.hideOwned = true;
      } else if (!hideNative && scrollbar.hideOwned) {
        element.classList.remove(nativeScrollbarHideClass);
        scrollbar.hideOwned = false;
      }
    }
    function configureScrollbarAxis(state, axis, enabled, attributeName) {
      var scrollbar = state.scrollbar;
      var current = scrollbar[axis];
      var element = null;
      if (enabled) element = Array.from(state.element.children).find(function(child) {
        return child.hasAttribute(attributeName);
      }) || null;
      if (current && current.element === element && enabled) return;
      if (current) resetScrollbarAxis(state, axis);
      if (!enabled) return;
      var owned = !element;
      if (!element) {
        element = root.document.createElement("div");
        element.setAttribute(attributeName, "");
        state.element.appendChild(element);
      }
      if (!owned) scrollbarMemories.set(element, AelluxJs.persist.element.save(element, [], scrollbarProperties));
      var record = {
        element: element,
        owned: owned,
        axis: axis,
        x: null,
        y: null,
        thumbPosition: null,
        thumbSize: null,
        trackSize: null,
        max: null,
        display: null
      };
      record.onPointerDown = function(event) {
        return startScrollbarDrag(state, record, event);
      };
      record.onPointerMove = function(event) {
        return moveScrollbarDrag(state, record, event);
      };
      record.onPointerEnd = function(event) {
        return endScrollbarDrag(state, record, event);
      };
      setListeners(element, record, scrollbarAxisListeners, true);
      scrollbar[axis] = record;
    }
    function resetScrollbarAxis(state, axis) {
      var _scrollbarMemories$ge;
      var record = state.scrollbar[axis];
      if (!record) return;
      endScrollbarDrag(state, record);
      var element = record.element;
      setListeners(element, record, scrollbarAxisListeners, false);
      if (record.owned) element.remove();
      else (_scrollbarMemories$ge = scrollbarMemories.get(element)) === null || _scrollbarMemories$ge === void 0 || _scrollbarMemories$ge.restore();
      scrollbarMemories.delete(element);
      state.scrollbar[axis] = null;
    }
    function resetScrollbars(state) {
      resetScrollbarAxis(state, "x");
      resetScrollbarAxis(state, "y");
      var scrollbar = state.scrollbar;
      if (scrollbar.listening) {
        setListeners(state.element, state, scrollbarHoverListeners, false);
        AelluxJs.off(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
        scrollbar.listening = false;
      }
      if (scrollbar.hideOwned) state.element.classList.remove(nativeScrollbarHideClass);
      scrollbar.hideOwned = false;
      clearScrollbarInteractionVisibility(state);
      clearScrollbarHover(state);
      syncScrollbarVisibility(state);
    }
    function setScrollbarHover(state, name, active) {
      var scrollbar = state.scrollbar;
      scrollbar[name] = active;
      if (active) {
        if (scrollbar.hoverTimeout !== null) root.clearTimeout(scrollbar.hoverTimeout);
        scrollbar.hoverTimeout = null;
        scrollbar.hoverVisible = true;
      } else if (!scrollbar.pointerHover && !scrollbar.mouseHover && scrollbar.hoverVisible && scrollbar.hoverTimeout === null) {
        scrollbar.hoverTimeout = root.setTimeout(function() {
          scrollbar.hoverTimeout = null;
          scrollbar.hoverVisible = false;
          syncScrollbarVisibility(state);
        }, SCROLLBAR_HOVER_HIDE_DELAY_MS);
      }
      syncScrollbarVisibility(state);
    }
    function clearScrollbarHover(state) {
      var scrollbar = state.scrollbar;
      if (scrollbar.hoverTimeout !== null) root.clearTimeout(scrollbar.hoverTimeout);
      scrollbar.hoverTimeout = null;
      scrollbar.hoverVisible = scrollbar.pointerHover = scrollbar.mouseHover = false;
    }
    function syncScrollbarVisibility(state) {
      var scrollbar = state.scrollbar;
      if (scrollbar.listening && (scrollbar.hoverVisible || scrollbar.drag || scrollbar.interactionVisible || state.cursor.owned)) showScrollbars(state);
      else hideScrollbars(state);
    }
    function clearScrollbarInteractionVisibility(state) {
      var scrollbar = state.scrollbar;
      if (scrollbar.interactionTimeout !== null) root.clearTimeout(scrollbar.interactionTimeout);
      scrollbar.interactionTimeout = null;
      scrollbar.interactionVisible = false;
    }
    function startScrollbarInteractionVisibility(state) {
      if (!state.scrollbar.listening) return;
      clearScrollbarInteractionVisibility(state);
      state.scrollbar.interactionVisible = true;
      syncScrollbarVisibility(state);
    }
    function scheduleScrollbarInteractionHide(state) {
      if (!state.scrollbar.listening || state.disposed) return;
      clearScrollbarInteractionVisibility(state);
      state.scrollbar.interactionVisible = true;
      syncScrollbarVisibility(state);
      state.scrollbar.interactionTimeout = root.setTimeout(function() {
        state.scrollbar.interactionTimeout = null;
        state.scrollbar.interactionVisible = false;
        syncScrollbarVisibility(state);
      }, SCROLLBAR_INTERACTION_HIDE_DELAY_MS);
    }
    function showScrollbars(state) {
      if (!state.scrollbar.listening) return;
      if (!state.element.classList.contains(scrollbarVisibleClass)) {
        state.element.classList.add(scrollbarVisibleClass);
        state.scrollbar.visibleOwned = true;
      }
    }
    function hideScrollbars(state) {
      if (state.scrollbar.drag) return;
      if (state.scrollbar.visibleOwned) state.element.classList.remove(scrollbarVisibleClass);
      state.scrollbar.visibleOwned = false;
    }
    function readScrollbars(state, metrics, axes) {
      var element = state.element;
      var values = [];
      for (var _i = 0, _arr = ["x", "y"]; _i < _arr.length; _i++) {
        var axis = _arr[_i];
        var record = state.scrollbar[axis];
        if (!record) continue;
        var vertical = axis === "y";
        var trackSize = vertical ? element.clientHeight : element.clientWidth;
        var max = vertical ? metrics.maxY : metrics.maxX;
        var scrollSize = trackSize + max;
        var thumbSize = max > 1 ? Math.min(trackSize, Math.max(SCROLLBAR_MIN_THUMB_PX, trackSize * trackSize / scrollSize)) : 0;
        var position = vertical ? element.scrollTop : element.scrollLeft;
        var thumbPosition = max > 0 ? (trackSize - thumbSize) * progress(position, max) : 0;
        var x = element.scrollLeft + (vertical ? element.clientWidth - SCROLLBAR_SIZE_PX : 0);
        var y = element.scrollTop + (vertical ? 0 : element.clientHeight - SCROLLBAR_SIZE_PX);
        var display = axes[axis] ? "block" : "none";
        values.push({
          record: record,
          x: x,
          y: y,
          trackSize: trackSize,
          thumbSize: thumbSize,
          thumbPosition: thumbPosition,
          max: axes[axis] ? max : 0,
          display: display
        });
      }
      return values;
    }
    function updateScrollbars(state, values) {
      var _iterator5 = _createForOfIteratorHelper(values), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var _step5$value = _step5.value, record = _step5$value.record, x = _step5$value.x, y = _step5$value.y, trackSize = _step5$value.trackSize, thumbSize = _step5$value.thumbSize, thumbPosition = _step5$value.thumbPosition, max = _step5$value.max, display = _step5$value.display;
          if (state.scrollbar[record.axis] !== record) continue;
          var style = record.element.style;
          if (record.x !== x) style.setProperty(scrollbarProperties[0], "".concat(x, "px"));
          if (record.y !== y) style.setProperty(scrollbarProperties[1], "".concat(y, "px"));
          if (record.trackSize !== trackSize) style.setProperty(scrollbarProperties[2], "".concat(trackSize, "px"));
          if (record.thumbSize !== thumbSize) style.setProperty(scrollbarProperties[3], "".concat(thumbSize, "px"));
          if (record.thumbPosition !== thumbPosition) style.setProperty(scrollbarProperties[4], "".concat(thumbPosition, "px"));
          if (record.display !== display) style.setProperty(scrollbarProperties[5], display);
          record.x = x;
          record.y = y;
          record.trackSize = trackSize;
          record.thumbSize = thumbSize;
          record.thumbPosition = thumbPosition;
          record.max = max;
          record.display = display;
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
    function scrollbarPointerPosition(record, event) {
      var rect = record.element.getBoundingClientRect();
      return record.axis === "y" ? event.clientY - rect.top : event.clientX - rect.left;
    }
    function startScrollbarDrag(state, record, event) {
      if (state.disposed || event.button !== 0 || !record.max) return;
      if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) endPointerScroll(activePointerScrollState);
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      var position = scrollbarPointerPosition(record, event);
      if (event.pointerType !== "touch") state.scrollbar.pointerHover = true;
      showScrollbars(state);
      if (position < record.thumbPosition || position > record.thumbPosition + record.thumbSize) {
        var travel = record.trackSize - record.thumbSize;
        var thumbStart = Math.max(0, Math.min(travel, position - record.thumbSize / 2));
        var destination = travel > 0 ? thumbStart / travel * record.max : 0;
        if (record.axis === "y") state.element.scrollTo({
          top: destination
        });
        else state.element.scrollTo({
          left: destination
        });
        return;
      }
      state.scrollbar.drag = {
        record: record,
        pointerId: event.pointerId,
        offset: position - record.thumbPosition
      };
      suspendSnapStyles(state, "scrollbar", true);
      if (record.element.setPointerCapture) record.element.setPointerCapture(event.pointerId);
    }
    function moveScrollbarDrag(state, record, event) {
      var drag = state.scrollbar.drag;
      if (!drag || drag.record !== record || drag.pointerId !== event.pointerId) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      var travel = record.trackSize - record.thumbSize;
      if (travel <= 0) return;
      var position = scrollbarPointerPosition(record, event) - drag.offset;
      var destination = Math.max(0, Math.min(record.max, position / travel * record.max));
      if (record.axis === "y") state.element.scrollTo({
        top: destination,
        behavior: "instant"
      });
      else state.element.scrollTo({
        left: destination,
        behavior: "instant"
      });
      updateScrollbars(state, [{
        record: record,
        x: record.axis === "x" ? destination : record.x,
        y: record.axis === "y" ? destination : record.y,
        trackSize: record.trackSize,
        thumbSize: record.thumbSize,
        thumbPosition: travel * destination / record.max,
        max: record.max,
        display: record.display
      }]);
      publish(state);
    }
    function endScrollbarDrag(state, record, event) {
      var drag = state.scrollbar.drag;
      if (!drag || drag.record !== record || event && drag.pointerId !== event.pointerId) return;
      if (event) {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
      }
      state.scrollbar.drag = null;
      if (record.element.hasPointerCapture && record.element.hasPointerCapture(drag.pointerId)) record.element.releasePointerCapture(drag.pointerId);
      syncScrollbarVisibility(state);
      suspendSnapStyles(state, "scrollbar", false);
    }
    function configureSnap(state) {
      var element = state.element;
      var requested = element.hasAttribute(snapAttribute) && element.getAttribute(snapAttribute) !== "false";
      var root2 = state.elastic.wrapper || element;
      var items = collectSnapItems(state, root2);
      if (!requested || !items.length) {
        state.snapEnabled = false;
        removeSnapGestureListeners(state);
        restoreSnapStyles(state);
        state.snap.root = null;
        state.snap.initialized = false;
        state.snap.index = 0;
        state.snap.flick = null;
        state.snap.deferredIndex = null;
        clearSnapTarget(state);
        state.snap.notifiedItem = null;
        state.snap.notifiedIndex = null;
        clearScrollEnd(state);
        var missingItems = requested && !items.length;
        if (missingItems && !state.snap.invalidReported) AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_SCROLLBOX_SNAP_ITEMS, {
          element: element
        });
        state.snap.invalidReported = missingItems;
        return;
      }
      state.snap.invalidReported = false;
      if (state.snap.root !== root2) {
        restoreSnapStyles(state);
        state.snap.root = root2;
        state.snap.initialized = false;
        state.snap.index = 0;
        state.snap.flick = null;
        state.snap.deferredIndex = null;
        clearSnapTarget(state);
        state.snap.notifiedItem = null;
        state.snap.notifiedIndex = null;
      }
      state.snapEnabled = true;
      addSnapGestureListeners(state);
    }
    function configureInlineWrapper(state) {
      var inline = state.inlineWrapper;
      var wrapper = state.elastic.wrapper;
      if (inline.element !== wrapper) {
        restoreInlineWrapper(state);
        inline.element = wrapper;
      }
      if (!wrapper) return;
      var display = root.getComputedStyle(wrapper).display;
      if (display.startsWith("inline")) return;
      if (inline.reportedDisplay !== display) {
        AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_WRAPPER_DISPLAY, {
          element: wrapper,
          display: display
        });
        inline.reportedDisplay = display;
      }
      var replacement = {
        block: "inline-block",
        flex: "inline-flex",
        grid: "inline-grid",
        "flow-root": "inline-block",
        table: "inline-table"
      }[display];
      if (!replacement) return;
      if (!inline.owned) inlineMemories.set(wrapper, AelluxJs.persist.element.save(wrapper, [], ["display"]));
      wrapper.style.setProperty("display", replacement, "important");
      inline.owned = true;
    }
    function restoreInlineWrapper(state) {
      var _inlineMemories$get;
      var inline = state.inlineWrapper;
      if (inline.owned && inline.element) (_inlineMemories$get = inlineMemories.get(inline.element)) === null || _inlineMemories$get === void 0 || _inlineMemories$get.restore();
      if (inline.element) inlineMemories.delete(inline.element);
      inline.element = null;
      inline.owned = false;
      inline.reportedDisplay = null;
    }
    function syncSnapStyles(state) {
      var axis = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : snapAxis(state);
      var snap = state.snap;
      if (!state.snapEnabled || !snap.root) return;
      snap.axis = axis;
      state.element.classList.add(snapReadyClass);
      state.element.classList.toggle(snapSuspendedClass, snap.suspensions.pointer || snap.suspensions.elastic || snap.suspensions.scrollbar || snap.suspensions.wheel);
    }
    function suspendSnapStyles(state, reason, suspended) {
      if (!state.snapEnabled || !state.snap.root || state.snap.suspensions[reason] === suspended) return;
      state.snap.suspensions[reason] = suspended;
      syncSnapStyles(state, state.snap.axis || snapAxis(state));
      if (!suspended && !Object.values(state.snap.suspensions).some(Boolean)) scheduleScrollEnd(state);
    }
    function scheduleSnapWheelIdle(state) {
      clearSnapWheelTimeout(state);
      state.snap.wheelTimeout = root.setTimeout(function() {
        state.snap.wheelTimeout = null;
      }, SNAP_SCROLL_IDLE_MS);
    }
    function clearSnapWheelTimeout(state) {
      var snap = state.snap;
      if (snap.wheelTimeout !== null) root.clearTimeout(snap.wheelTimeout);
      snap.wheelTimeout = null;
    }
    function suspendSnapForEdgeWheel(state) {
      var snap = state.snap;
      if (snap.edgeWheelTimeout !== null) root.clearTimeout(snap.edgeWheelTimeout);
      suspendSnapStyles(state, "wheel", true);
      snap.edgeWheelTimeout = root.setTimeout(function() {
        snap.edgeWheelTimeout = null;
        suspendSnapStyles(state, "wheel", false);
      }, SNAP_SCROLL_IDLE_MS);
    }
    function clearEdgeWheelSuspension(state) {
      var snap = state.snap;
      if (snap.edgeWheelTimeout !== null) root.clearTimeout(snap.edgeWheelTimeout);
      snap.edgeWheelTimeout = null;
      suspendSnapStyles(state, "wheel", false);
    }
    function restoreSnapStyles(state) {
      var snap = state.snap;
      clearSnapWheelTimeout(state);
      if (snap.edgeWheelTimeout !== null) root.clearTimeout(snap.edgeWheelTimeout);
      snap.edgeWheelTimeout = null;
      var _iterator6 = _createForOfIteratorHelper(snap.savedItems), _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
          var _snapItemMemories$get;
          var item = _step6.value;
          (_snapItemMemories$get = snapItemMemories.get(item)) === null || _snapItemMemories$get === void 0 || _snapItemMemories$get.restore();
          snapItemMemories.delete(item);
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      snap.savedItems.clear();
      state.element.classList.remove(snapReadyClass, snapSuspendedClass);
      snap.axis = null;
      snap.suspensions.pointer = false;
      snap.suspensions.elastic = false;
      snap.suspensions.scrollbar = false;
      snap.suspensions.wheel = false;
    }
    function collectSnapItems(state, root2) {
      return Array.from(root2.querySelectorAll("[".concat(snapItemAttribute, "]"))).filter(function(item) {
        return item.closest("[".concat(attribute, "]")) === state.element;
      });
    }
    function snapItems(state) {
      return state.snapEnabled && state.snap.root ? collectSnapItems(state, state.snap.root) : [];
    }
    function snapAxis(state) {
      return state.element.getAttribute(snapAttribute) === "vertical" ? "y" : "x";
    }
    function snapAlignment(item) {
      var value = item.getAttribute(snapItemAttribute);
      if (value === "start" || value === "left" || value === "top") return "start";
      if (value === "end" || value === "right" || value === "bottom") return "end";
      return "center";
    }
    function snapAlignmentOffset(state, item, axis) {
      var box = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : state.element.getBoundingClientRect();
      var target = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : item.getBoundingClientRect();
      var horizontal = axis === "x";
      var start = horizontal ? box.left + state.element.clientLeft : box.top + state.element.clientTop;
      var size = horizontal ? state.element.clientWidth : state.element.clientHeight;
      var itemStart = horizontal ? target.left : target.top;
      var itemSize = horizontal ? target.width : target.height;
      var alignment = snapAlignment(item);
      if (alignment === "start") return itemStart - start;
      if (alignment === "end") return itemStart + itemSize - start - size;
      return itemStart + itemSize / 2 - start - size / 2;
    }
    function edgeSnapIndex(state, items, axis, metrics) {
      var element = state.element;
      var horizontal = axis === "x";
      var maximum = horizontal ? metrics.maxX : metrics.maxY;
      var position = horizontal ? element.scrollLeft : element.scrollTop;
      var startDistance = position;
      var endDistance = maximum - position;
      if (startDistance <= SNAP_EDGE_DISTANCE_PX && startDistance <= endDistance) return 0;
      if (endDistance <= SNAP_EDGE_DISTANCE_PX) return items.length - 1;
      return null;
    }
    function nearestSnapIndex(state, items, axis) {
      var box = state.element.getBoundingClientRect();
      var nearest = 0, distance = Infinity;
      for (var index = 0; index < items.length; index++) {
        var candidate = Math.abs(snapAlignmentOffset(state, items[index], axis, box));
        if (candidate < distance) {
          nearest = index;
          distance = candidate;
        }
      }
      return nearest;
    }
    function addSnapGestureListeners(state) {
      if (state.snap.gestureListening) return;
      onTarget(state.element, POINTER_DOWN_TARGET, state.onSnapPointerDown, true);
      onTarget(state.element, "$touchstart", state.onSnapTouchStart, {
        passive: true,
        capture: true
      });
      state.snap.gestureListening = true;
    }
    function removeSnapGestureListeners(state) {
      if (state.snap.gestureListening) {
        offTarget(state.element, POINTER_DOWN_TARGET, state.onSnapPointerDown, true);
        offTarget(state.element, "$touchstart", state.onSnapTouchStart, true);
        state.snap.gestureListening = false;
      }
      stopSnapGestureEndListeners(state);
      state.snap.activePointers.clear();
      state.snap.activeTouches.clear();
      state.snap.waitingForGestureEnd = false;
    }
    function listenSnapGestureEnd(state) {
      if (state.snap.endListening) return;
      setListeners(root, state, snapEndListeners, true);
      state.snap.endListening = true;
    }
    function stopSnapGestureEndListeners(state) {
      if (!state.snap.endListening) return;
      setListeners(root, state, snapEndListeners, false);
      state.snap.endListening = false;
    }
    function beginSnapGesture(state, kind, event) {
      if (!state.snapEnabled || event.target.closest("[".concat(scrollbarVerticalAttribute, "], [").concat(scrollbarHorizontalAttribute, "]"))) return;
      var snap = state.snap;
      var active = kind === POINTER ? snap.activePointers : snap.activeTouches;
      if (kind === POINTER) active.add(event.pointerId);
      else {
        var _iterator7 = _createForOfIteratorHelper(event.changedTouches), _step7;
        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
            var touch = _step7.value;
            active.add(touch.identifier);
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
      }
      if (!active.size) return;
      snap.flick = null;
      if (snap.scrollEndTimeout !== null || snap.scrollingToTarget !== -1) snap.waitingForGestureEnd = true;
      clearSnapTarget(state);
      clearScrollEnd(state);
      listenSnapGestureEnd(state);
    }
    function endSnapGesture(state, kind, event) {
      var snap = state.snap;
      if (kind === POINTER) snap.activePointers.delete(event.pointerId);
      else if (kind === "touch") {
        var _iterator8 = _createForOfIteratorHelper(event.changedTouches), _step8;
        try {
          for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
            var touch = _step8.value;
            snap.activeTouches.delete(touch.identifier);
          }
        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }
      } else {
        snap.activePointers.clear();
        snap.activeTouches.clear();
      }
      if (snap.activePointers.size || snap.activeTouches.size) return;
      stopSnapGestureEndListeners(state);
      if ((snap.waitingForGestureEnd || snap.flick) && snap.gestureListening && !state.disposed) {
        snap.waitingForGestureEnd = false;
        scheduleScrollEnd(state);
      }
    }
    function scheduleScrollEnd(state) {
      if (state.snap.scrollingToTarget !== -1) return;
      clearScrollEnd(state);
      if (state.snap.activePointers.size || state.snap.activeTouches.size) {
        state.snap.waitingForGestureEnd = true;
        return;
      }
      state.snap.waitingForGestureEnd = false;
      state.snap.scrollEndTimeout = root.setTimeout(function() {
        state.snap.scrollEndTimeout = null;
        finishNativeScroll(state);
      }, SNAP_SCROLL_IDLE_MS);
    }
    function scheduleSnapTargetIdle(state) {
      clearScrollEnd(state);
      state.snap.scrollEndTimeout = root.setTimeout(function() {
        state.snap.scrollEndTimeout = null;
        if (state.snap.scrollingToTarget === -1) return;
        clearSnapTarget(state);
        finishNativeScroll(state);
      }, SNAP_TARGET_IDLE_MS);
    }
    function clearScrollEnd(state) {
      if (state.snap.scrollEndTimeout !== null) root.clearTimeout(state.snap.scrollEndTimeout);
      state.snap.scrollEndTimeout = null;
    }
    function snapTargetReached(state) {
      var snap = state.snap;
      if (snap.scrollingToTarget === -1) return false;
      var position = snap.scrollingToAxis === "x" ? state.element.scrollLeft : state.element.scrollTop;
      return Math.abs(position - snap.scrollingToTarget) <= 1;
    }
    function clearSnapTarget(state) {
      state.snap.scrollingToTarget = -1;
      state.snap.scrollingToAxis = null;
    }
    function finishNativeScroll(state) {
      if (state.disposed || !state.snapEnabled) return;
      if (state.snap.activePointers.size || state.snap.activeTouches.size) {
        state.snap.waitingForGestureEnd = true;
        return;
      }
      if (state.snap.suspensions.pointer || state.snap.suspensions.elastic || state.snap.suspensions.wheel || state.momentum || state.scrollbar.drag || activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) return;
      var items = snapItems(state);
      if (!items.length) return;
      var metrics = nativeMetrics(state.element);
      var axis = snapAxis(state);
      var edgeIndex = edgeSnapIndex(state, items, axis, metrics);
      var index = edgeIndex === null ? nearestSnapIndex(state, items, axis) : edgeIndex;
      var flick = state.snap.flick;
      state.snap.flick = null;
      if (flick && flick.axis === axis && flick.index !== index && flick.index >= 0 && flick.index < items.length) {
        scrollToSnap(state, flick.index, axis);
        return;
      }
      notifySnapChange(state, items[index], axis);
    }
    function initializeSnap(state) {
      var first = snapItems(state)[0];
      if (!first) return;
      state.snap.initialized = true;
      state.snap.index = 0;
      var axis = snapAxis(state);
      scrollToSnap(state, 0, axis, "instant");
      notifySnapChange(state, first, axis);
      refresh(state);
    }
    function notifySnapChange(state, item, axis) {
      var index = snapItems(state).indexOf(item);
      if (index < 0 || state.snap.notifiedItem === item && state.snap.notifiedIndex === index) return;
      var previousIndex = state.snap.notifiedIndex;
      state.snap.index = index;
      state.snap.notifiedItem = item;
      state.snap.notifiedIndex = index;
      AelluxJs.dispatchFrom(state.element, "ScrollboxSnapChange", {
        detail: {
          item: item,
          index: index,
          previousIndex: previousIndex,
          axis: axis
        }
      });
    }
    function scrollToSnap(state, index) {
      var axis = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : snapAxis(state);
      var behavior = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "smooth";
      var items = snapItems(state);
      if (!items.length || !Number.isInteger(index) || index < 0 || index >= items.length) return false;
      if (state.snap.suspensions.elastic) {
        clearSnapTarget(state);
        clearScrollEnd(state);
        state.snap.deferredIndex = index;
        return true;
      }
      cancelMomentum(state);
      clearScrollEnd(state);
      state.snap.flick = null;
      state.snap.deferredIndex = null;
      state.snap.index = index;
      var element = state.element;
      var offset = snapAlignmentOffset(state, items[index], axis);
      var metrics = nativeMetrics(element);
      var destination = axis === "x" ? Math.max(0, Math.min(metrics.maxX, element.scrollLeft + offset)) : Math.max(0, Math.min(metrics.maxY, element.scrollTop + offset));
      state.snap.scrollingToTarget = destination;
      state.snap.scrollingToAxis = axis;
      if (axis === "x") element.scrollTo({
        left: destination,
        behavior: behavior
      });
      else element.scrollTo({
        top: destination,
        behavior: behavior
      });
      if (snapTargetReached(state)) {
        clearSnapTarget(state);
        scheduleScrollEnd(state);
      }
      return true;
    }
    function selectedSnapIndex(state) {
      var items = snapItems(state);
      if (!items.length) return 0;
      var metrics = nativeMetrics(state.element);
      var axis = snapAxis(state);
      var edge = edgeSnapIndex(state, items, axis, metrics);
      return edge === null ? nearestSnapIndex(state, items, axis) : edge;
    }
    function goto(element, index) {
      var state = scrollboxes.get(element);
      return state && !state.disposed ? scrollToSnap(state, index) : false;
    }
    function next(element) {
      var state = scrollboxes.get(element);
      if (!state || state.disposed) return false;
      var items = snapItems(state);
      return items.length ? scrollToSnap(state, Math.min(items.length - 1, state.snap.index + 1)) : false;
    }
    function previous(element) {
      var state = scrollboxes.get(element);
      if (!state || state.disposed) return false;
      var items = snapItems(state);
      return items.length ? scrollToSnap(state, Math.max(0, state.snap.index - 1)) : false;
    }
    function configureElastic(state) {
      var element = state.element;
      var children = contentChildren(element);
      var child = children.length === 1 ? children[0] : null;
      var wrapper = child && child.hasAttribute(elasticAttribute) && child.getAttribute(elasticAttribute) !== "false" ? child : null;
      if (!wrapper) {
        resetElastic(state);
        if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
        state.elasticEnabled = false;
        state.elastic.wrapper = null;
        var requested = element.hasAttribute(elasticAttribute) || children.some(function(item) {
          return item.hasAttribute(elasticAttribute) && item.getAttribute(elasticAttribute) !== "false";
        });
        if (requested && !state.elastic.invalidReported) {
          AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_SCROLLBOX_ELASTIC_WRAPPER, {
            element: element
          });
        }
        state.elastic.invalidReported = requested;
        return;
      }
      state.elastic.invalidReported = false;
      if (state.elastic.wrapper !== wrapper) {
        resetElastic(state);
        if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
        var computed = root.getComputedStyle(wrapper);
        state.elastic.wrapper = wrapper;
        state.elastic.dimensions = null;
        state.elastic.baseTransform = computed.transform === "none" ? "" : computed.transform;
        state.elastic.baseOrigin = computed.transformOrigin;
        elasticMemories.set(wrapper, AelluxJs.persist.element.save(wrapper, [], ["transform", "transform-origin"]));
      }
      state.elasticEnabled = true;
      var value = wrapper.getAttribute(elasticAttribute).trim();
      var tokens = value ? value.split(/\s+/) : [];
      var limits = tokens.map(parseElasticLimit);
      if (tokens.length > 2 || limits.some(function(limit) {
        return !limit;
      })) {
        if (state.elastic.invalidLimit !== value) {
          AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_ELASTIC_LIMIT_INVALID, {
            element: element,
            value: value
          });
        }
        state.elastic.invalidLimit = value;
        state.elastic.limits = [DEFAULT_ELASTIC_LIMIT, DEFAULT_ELASTIC_LIMIT];
      } else {
        state.elastic.invalidLimit = null;
        state.elastic.limits = tokens.length === 2 ? limits : [limits[0] || DEFAULT_ELASTIC_LIMIT, limits[0] || DEFAULT_ELASTIC_LIMIT];
      }
    }
    function parseElasticLimit(token) {
      var fraction = /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(token);
      if (fraction && Number(fraction[2]) > 0) {
        return {
          unit: "ratio",
          value: Number(fraction[1]) / Number(fraction[2])
        };
      }
      var pixels = /^(\d+(?:\.\d+)?)(?:px)?$/i.exec(token);
      return pixels ? {
        unit: "px",
        value: Number(pixels[1])
      } : null;
    }
    function elasticLimit(size, limit) {
      return limit.unit === "px" ? limit.value : size * limit.value;
    }
    function elasticResistance(force, current, limit) {
      if (limit <= 0) return 0;
      return current + (limit - current) * (1 - Math.exp(-force * ELASTIC_DAMPING / limit));
    }
    function readMode(element) {
      var value = (element.getAttribute(attribute) || "").trim().toLowerCase() || "native";
      if (value === "native" || value === POINTER) return value;
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_MODE_INVALID, {
        element: element,
        value: value
      });
      return "native";
    }
    function isDesktop() {
      return !!(root.matchMedia && root.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }
    function updatePointerScrollCursor(state, target, x, y) {
      if (!state.pointerListening || state.pointerScroll && state.pointerScroll.moved) return;
      if (!target || target.nodeType !== 1 || target.closest("[".concat(attribute, "]")) !== state.element || target.closest(pointerScrollExceptionSelector) || isTextAtPoint(target, x, y)) {
        restorePointerScrollCursor(state);
        return;
      }
      setPointerScrollCursor(state, "grab");
    }
    function isTextAtPoint(element, x, y) {
      if (root.getComputedStyle(element).userSelect === "none") return false;
      var range = document.createRange();
      var _iterator9 = _createForOfIteratorHelper(element.childNodes), _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
          var node = _step9.value;
          if (node.nodeType !== 3 || !node.textContent.trim()) continue;
          range.selectNodeContents(node);
          var _iterator0 = _createForOfIteratorHelper(range.getClientRects()), _step0;
          try {
            for (_iterator0.s(); !(_step0 = _iterator0.n()).done; ) {
              var rect = _step0.value;
              if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return true;
            }
          } catch (err) {
            _iterator0.e(err);
          } finally {
            _iterator0.f();
          }
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      return false;
    }
    function setPointerScrollCursor(state, value) {
      state.element.style.setProperty("cursor", value, "important");
      state.cursor.owned = true;
      syncScrollbarVisibility(state);
    }
    function restorePointerScrollCursor(state) {
      var _cursorMemories$get;
      if (!state.cursor.owned) return;
      (_cursorMemories$get = cursorMemories.get(state.element)) === null || _cursorMemories$get === void 0 || _cursorMemories$get.restore();
      state.cursor.owned = false;
      syncScrollbarVisibility(state);
    }
    function startPointerScroll(state, event) {
      if (event.detail > 1) return;
      if (activePointerScrollState || state.pointerScroll || state.scrollbar.drag || event.defaultPrevented || event.button !== 0 || !event.isPrimary || event.pointerType === "touch" || (event.buttons & 1) === 0) return;
      var element = state.element;
      var nested = event.target.closest("[".concat(attribute, "]"));
      if (nested !== element || event.target.closest(pointerScrollExceptionSelector)) return;
      var chain = [];
      var node = element;
      while (node) {
        var member = scrollboxes.get(node);
        if (member && member.pointerListening && !member.disposed) chain.push(member);
        node = node.parentElement && node.parentElement.closest("[".concat(attribute, "]"));
      }
      if (chain.some(function(member2) {
        return member2.scrollbar.drag;
      })) return;
      var axes = new Map(chain.map(function(member2) {
        var metrics = nativeMetrics(member2.element);
        member2.metrics = metrics;
        return [member2, wheelAxes(member2, metrics)];
      }));
      var chains = {
        x: pointerAxisChain(chain, axes, "x"),
        y: pointerAxisChain(chain, axes, "y")
      };
      if (!chains.x.some(function(member2) {
        return axes.get(member2).x;
      }) && !chains.y.some(function(member2) {
        return axes.get(member2).y;
      })) return;
      var rect = element.getBoundingClientRect();
      if (event.clientX >= rect.left + element.clientWidth || event.clientY >= rect.top + element.clientHeight) return;
      var previousDown = state.lastPointerDown;
      var time = now();
      state.lastPointerDown = {
        x: event.clientX,
        y: event.clientY,
        time: time
      };
      if (previousDown && time - previousDown.time <= POINTER_SCROLL_MULTICLICK_MS && Math.abs(event.clientX - previousDown.x) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX && Math.abs(event.clientY - previousDown.y) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX) return;
      var textOrigin = isTextAtPoint(event.target, event.clientX, event.clientY);
      var selectionAtDown = readSelection();
      var verticalOnly = chains.y.some(function(member2) {
        return axes.get(member2).y;
      }) && !chains.x.some(function(member2) {
        return axes.get(member2).x;
      });
      if (!textOrigin && event.cancelable) event.preventDefault();
      var _iterator1 = _createForOfIteratorHelper(new Set([].concat(_toConsumableArray(chains.x), _toConsumableArray(chains.y)))), _step1;
      try {
        for (_iterator1.s(); !(_step1 = _iterator1.n()).done; ) {
          var _member = _step1.value;
          cancelMomentum(_member);
          _member.snap.flick = null;
          clearSnapTarget(_member);
          if (_member.elastic.owned) {
            resetElastic(_member);
            refresh(_member);
          }
        }
      } catch (err) {
        _iterator1.e(err);
      } finally {
        _iterator1.f();
      }
      if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
      state.mouseReleaseTimeout = null;
      state.mouseReleaseButton = null;
      state.pointerScroll = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        button: event.button,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
        started: false,
        axis: null,
        chain: chain,
        chains: chains,
        axes: axes,
        styles: [],
        momentumState: null,
        momentumStartX: 0,
        momentumStartY: 0,
        elasticForce: 0,
        startTime: time,
        endTime: null,
        snapStarts: new Map(chain.filter(function(member2) {
          return member2.snapEnabled && (chains.x.includes(member2) || chains.y.includes(member2));
        }).map(function(member2) {
          return [member2, selectedSnapIndex(member2)];
        })),
        selectionAtDown: selectionAtDown,
        verticalOnly: verticalOnly,
        selectionReadyTime: textOrigin ? time + TEXT_SELECTION_WAIT_MS : 0,
        selectionWaitTimeout: null,
        pendingMove: null,
        momentumStartTime: time
      };
      activePointerScrollState = state;
      onTarget(root, POINTER_MOVE_TARGET, state.onPointerMove, {
        passive: false,
        capture: true
      });
      onTarget(root, "$touchmove", state.onPointerScrollTouchMove, {
        passive: false,
        capture: true
      });
      var _iterator10 = _createForOfIteratorHelper(pointerScrollDragEvents), _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
          var name = _step10.value;
          onTarget(root, "$" + name, state.onPointerScrollNativeEvent, true);
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
      onTarget(root, "$selectstart", state.onPointerScrollNativeEvent, true);
      var _iterator11 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
          var _name = _step11.value;
          onTarget(root, "$" + _name, state.onMouseEvent, {
            passive: false,
            capture: true
          });
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      onTarget(root, POINTER_UP_TARGET, state.onPointerEnd, true);
      onTarget(root, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
      onTarget(root, "$blur", state.onBlur);
    }
    function movePointerScroll(state, event) {
      var pointerScroll = state.pointerScroll;
      if (!pointerScroll || event.pointerId !== pointerScroll.pointerId) return;
      if ((event.buttons & 1) === 0) {
        endPointerScroll(state);
        return;
      }
      var dx = pointerScroll.startX - event.clientX;
      var dy = pointerScroll.startY - event.clientY;
      if (!pointerScroll.moved && selectionHasChanged(pointerScroll.selectionAtDown)) {
        endPointerScroll(state);
        return;
      }
      var threshold = pointerScroll.chain.some(function(member2) {
        return member2.snapEnabled;
      }) ? SNAP_FLICK_MIN_DISTANCE_PX : POINTER_SCROLL_THRESHOLD_PX;
      if (!pointerScroll.moved && dx * dx + dy * dy < threshold * threshold) return;
      if (!pointerScroll.axis) pointerScroll.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      var verticalTextDrag = pointerScroll.verticalOnly && pointerScroll.axis === "y" && Math.abs(dy) > VERTICAL_TEXT_DRAG_PX;
      if (!pointerScroll.moved && now() < pointerScroll.selectionReadyTime && !verticalTextDrag) {
        pointerScroll.pendingMove = {
          x: event.clientX,
          y: event.clientY
        };
        if (pointerScroll.selectionWaitTimeout === null) {
          pointerScroll.selectionWaitTimeout = root.setTimeout(function() {
            pointerScroll.selectionWaitTimeout = null;
            if (state.pointerScroll !== pointerScroll) return;
            var pendingMove = pointerScroll.pendingMove;
            movePointerScroll(state, {
              pointerId: pointerScroll.pointerId,
              buttons: 1,
              cancelable: false,
              clientX: pendingMove.x,
              clientY: pendingMove.y
            });
          }, Math.max(0, pointerScroll.selectionReadyTime - now()));
        }
        return;
      }
      if (!pointerScroll.moved) {
        var _axis = pointerScroll.axis;
        var chain = pointerScroll.chains[_axis];
        if (!chain.some(function(member2) {
          return pointerAxisMaximum(member2, _axis, pointerScroll) > 0;
        })) {
          endPointerScroll(state);
          return;
        }
        pointerScroll.chain = chain;
        activatePointerScroll(state, pointerScroll, _axis);
        if (state.pointerScroll !== pointerScroll) return;
      }
      var axis = pointerScroll.axis;
      var remaining = axis === "x" ? pointerScroll.lastX - event.clientX : pointerScroll.lastY - event.clientY;
      pointerScroll.lastX = event.clientX;
      pointerScroll.lastY = event.clientY;
      if (event.cancelable) event.preventDefault();
      if (!remaining) return;
      var outermost = null;
      var _iterator12 = _createForOfIteratorHelper(pointerScroll.chain), _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done; ) {
          var member = _step12.value;
          if (!member.disposed && member.pointerListening && pointerAxisMaximum(member, axis, pointerScroll) > 0) outermost = member;
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
      var allowed = outermost && outermost.elasticEnabled ? elasticAxes(outermost) : null;
      var canStretch = allowed && allowed[axis];
      if (canStretch && pointerScroll.elasticForce) {
        var force = pointerScroll.elasticForce + remaining;
        if (!force || Math.sign(force) === Math.sign(pointerScroll.elasticForce)) {
          pointerScroll.elasticForce = force;
          remaining = 0;
        } else {
          pointerScroll.elasticForce = 0;
          remaining = force;
        }
      }
      var lastUsed = null;
      var lastStartX = 0, lastStartY = 0;
      var _iterator13 = _createForOfIteratorHelper(pointerScroll.chain), _step13;
      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done; ) {
          var _member2 = _step13.value;
          if (_member2.disposed || !_member2.pointerListening || pointerAxisMaximum(_member2, axis, pointerScroll) <= 0) continue;
          if (Math.abs(remaining) < 1e-3) continue;
          var _element = _member2.element;
          var previousX = _element.scrollLeft, previousY = _element.scrollTop;
          var current = axis === "x" ? previousX : previousY;
          var desired = Math.max(0, Math.min(pointerAxisMaximum(_member2, axis, pointerScroll), current + remaining));
          _element.scrollTo({
            left: axis === "x" ? desired : previousX,
            top: axis === "y" ? desired : previousY,
            behavior: "instant"
          });
          var used = (axis === "x" ? _element.scrollLeft : _element.scrollTop) - current;
          if (!used) continue;
          remaining -= used;
          publish(_member2);
          lastUsed = _member2;
          lastStartX = previousX;
          lastStartY = previousY;
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }
      if (canStretch) {
        pointerScroll.elasticForce += remaining;
        var element = outermost.element;
        var desiredX = element.scrollLeft + (axis === "x" ? pointerScroll.elasticForce : 0);
        var desiredY = element.scrollTop + (axis === "y" ? pointerScroll.elasticForce : 0);
        applyElasticFromDesired(outermost, desiredX, desiredY, false, axis, allowed);
        scrollWithinElasticBounds(outermost, desiredX, desiredY);
        publish(outermost);
      } else pointerScroll.elasticForce = 0;
      if (lastUsed) {
        var time = now();
        if (pointerScroll.momentumState !== lastUsed) {
          pointerScroll.momentumState = lastUsed;
          pointerScroll.momentumStartX = lastStartX;
          pointerScroll.momentumStartY = lastStartY;
          pointerScroll.momentumStartTime = time;
        } else if (time - pointerScroll.momentumStartTime > MOMENTUM_LIMIT_TIME_MS) {
          pointerScroll.momentumStartX = lastUsed.element.scrollLeft;
          pointerScroll.momentumStartY = lastUsed.element.scrollTop;
          pointerScroll.momentumStartTime = time;
        }
      }
    }
    function readSelection() {
      var selection = root.getSelection();
      if (!selection) return null;
      return {
        rangeCount: selection.rangeCount,
        isCollapsed: selection.isCollapsed,
        anchorNode: selection.anchorNode,
        anchorOffset: selection.anchorOffset,
        focusNode: selection.focusNode,
        focusOffset: selection.focusOffset
      };
    }
    function selectionHasChanged(initial) {
      var current = readSelection();
      var initialSelected = initial && initial.rangeCount && !initial.isCollapsed;
      var currentSelected = current && current.rangeCount && !current.isCollapsed;
      if (!initialSelected && !currentSelected) return false;
      if (!initial || !current) return initial !== current;
      return current.rangeCount !== initial.rangeCount || current.isCollapsed !== initial.isCollapsed || current.anchorNode !== initial.anchorNode || current.anchorOffset !== initial.anchorOffset || current.focusNode !== initial.focusNode || current.focusOffset !== initial.focusOffset;
    }
    function pointerAxisMaximum(state, axis) {
      var pointerScroll = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      var metrics = state.metrics || nativeMetrics(state.element);
      var axes = pointerScroll && pointerScroll.axes.get(state) || wheelAxes(state, metrics);
      return axes[axis] ? axis === "x" ? metrics.maxX : metrics.maxY : 0;
    }
    function pointerAxisChain(chain, axes, axis) {
      var result = [];
      var _iterator14 = _createForOfIteratorHelper(chain), _step14;
      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done; ) {
          var member = _step14.value;
          result.push(member);
          if (axes.get(member)[axis === "x" ? "stopX" : "stopY"]) break;
        }
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }
      return result;
    }
    function activatePointerScroll(state, pointerScroll, axis) {
      pointerScroll.axis = axis;
      pointerScroll.moved = true;
      pointerScroll.started = true;
      restorePointerScrollCursor(state);
      var _iterator15 = _createForOfIteratorHelper(pointerScroll.chain), _step15;
      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done; ) {
          var member = _step15.value;
          if (pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
          var element = member.element;
          pointerScrollMemories.set(element, AelluxJs.persist.element.save(element, [], ["scroll-behavior"]));
          pointerScroll.styles.push({
            element: element,
            classOwned: !element.classList.contains(pointerScrollingClass)
          });
          element.style.setProperty("scroll-behavior", "auto", "important");
          element.classList.add(pointerScrollingClass);
          if (member.snapEnabled) suspendSnapStyles(member, POINTER, true);
          startScrollbarInteractionVisibility(member);
        }
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }
      dispatchPointerScroll(state, pointerScroll, "PointerScrollStart");
    }
    function dispatchPointerScroll(state, pointerScroll, name) {
      AelluxJs.dispatchFrom(state.element, name, {
        detail: {
          axis: pointerScroll.axis,
          pointerId: pointerScroll.pointerId,
          pointerType: pointerScroll.pointerType,
          elements: pointerScroll.styles.map(function(saved) {
            return saved.element;
          })
        }
      });
    }
    function endPointerScroll(state, event) {
      var pointerScroll = state.pointerScroll;
      if (!pointerScroll || event && event.pointerId !== pointerScroll.pointerId) return;
      pointerScroll.endTime = now();
      if (event && event.type === POINTER_UP) {
        pointerScroll.lastX = event.clientX;
        pointerScroll.lastY = event.clientY;
      }
      if (event && event.type === POINTER_UP && !pointerScroll.moved && pointerScroll.endTime < pointerScroll.selectionReadyTime && !selectionHasChanged(pointerScroll.selectionAtDown)) {
        var dx = pointerScroll.startX - event.clientX;
        var dy = pointerScroll.startY - event.clientY;
        var axis = pointerScroll.axis || (Math.abs(dx) >= Math.abs(dy) ? "x" : "y");
        var chain = pointerScroll.chains[axis];
        if (chain.some(function(member2) {
          return member2.snapEnabled && snapAxis(member2) === axis && pointerAxisMaximum(member2, axis, pointerScroll) > 0;
        }) && isSnapFlick(pointerScroll, axis)) {
          pointerScroll.chain = chain;
          pointerScroll.axis = axis;
          pointerScroll.moved = true;
        }
      }
      state.pointerScroll = null;
      if (activePointerScrollState === state) activePointerScrollState = null;
      if (pointerScroll.selectionWaitTimeout !== null) root.clearTimeout(pointerScroll.selectionWaitTimeout);
      offTarget(root, POINTER_MOVE_TARGET, state.onPointerMove, true);
      offTarget(root, "$touchmove", state.onPointerScrollTouchMove, true);
      var _iterator16 = _createForOfIteratorHelper(pointerScrollDragEvents), _step16;
      try {
        for (_iterator16.s(); !(_step16 = _iterator16.n()).done; ) {
          var name = _step16.value;
          offTarget(root, "$" + name, state.onPointerScrollNativeEvent, true);
        }
      } catch (err) {
        _iterator16.e(err);
      } finally {
        _iterator16.f();
      }
      offTarget(root, "$selectstart", state.onPointerScrollNativeEvent, true);
      offTarget(root, POINTER_UP_TARGET, state.onPointerEnd, true);
      offTarget(root, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
      offTarget(root, "$blur", state.onBlur);
      if (pointerScroll.moved && !state.disposed) {
        state.mouseReleaseButton = pointerScroll.button;
        if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
        state.mouseReleaseTimeout = root.setTimeout(function() {
          return stopPointerScrollMouseEvents(state);
        }, 0);
      } else {
        stopPointerScrollMouseEvents(state);
      }
      var _iterator17 = _createForOfIteratorHelper(pointerScroll.styles), _step17;
      try {
        for (_iterator17.s(); !(_step17 = _iterator17.n()).done; ) {
          var _pointerScrollMemorie;
          var saved = _step17.value;
          if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
          (_pointerScrollMemorie = pointerScrollMemories.get(saved.element)) === null || _pointerScrollMemorie === void 0 || _pointerScrollMemorie.restore();
          pointerScrollMemories.delete(saved.element);
          var member = scrollboxes.get(saved.element);
          if (member) {
            suspendSnapStyles(member, POINTER, false);
            scheduleScrollbarInteractionHide(member);
          }
        }
      } catch (err) {
        _iterator17.e(err);
      } finally {
        _iterator17.f();
      }
      if (event && event.type === POINTER_UP && state.pointerListening) {
        updatePointerScrollCursor(state, document.elementFromPoint(event.clientX, event.clientY), event.clientX, event.clientY);
      } else restorePointerScrollCursor(state);
      if (pointerScroll.started) dispatchPointerScroll(state, pointerScroll, "PointerScrollEnd");
      var hadElastic = pointerScroll.chain.some(function(member2) {
        return member2.elastic.active;
      });
      var momentumState = pointerScroll.momentumState;
      var snapState = momentumState ? momentumState.snapEnabled ? momentumState : null : pointerScroll.chain.find(function(member2) {
        return member2.snapEnabled && pointerAxisMaximum(member2, pointerScroll.axis, pointerScroll) > 0;
      });
      var shouldSnap = event && event.type === POINTER_UP && pointerScroll.moved && snapState && !snapState.disposed && snapItems(snapState).length;
      if (shouldSnap) {
        recordSnapFlick(snapState, pointerScroll, pointerScroll.axis, pointerScroll.snapStarts.get(snapState));
        scheduleScrollEnd(snapState);
      }
      var _iterator18 = _createForOfIteratorHelper(pointerScroll.chain), _step18;
      try {
        for (_iterator18.s(); !(_step18 = _iterator18.n()).done; ) {
          var _member3 = _step18.value;
          releaseElastic(_member3);
        }
      } catch (err) {
        _iterator18.e(err);
      } finally {
        _iterator18.f();
      }
      if (!shouldSnap && event && event.type === POINTER_UP && pointerScroll.moved && momentumState && momentumState.momentumEnabled && !hadElastic && !momentumState.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(momentumState, pointerScroll);
      }
    }
    function recordSnapFlick(state, gesture, axis, startIndex) {
      if (!state.snapEnabled || snapAxis(state) !== axis || !Number.isInteger(startIndex) || !isSnapFlick(gesture, axis)) return;
      var distance = axis === "x" ? gesture.startX - gesture.lastX : gesture.startY - gesture.lastY;
      var items = snapItems(state);
      var index = Math.max(0, Math.min(items.length - 1, startIndex + Math.sign(distance)));
      if (index !== startIndex) {
        state.snap.flick = {
          axis: axis,
          index: index
        };
      }
    }
    function isSnapFlick(pointerScroll, axis) {
      var distance = axis === "x" ? pointerScroll.startX - pointerScroll.lastX : pointerScroll.startY - pointerScroll.lastY;
      var elapsed = Math.max(1, pointerScroll.endTime - pointerScroll.startTime);
      return elapsed <= SNAP_FLICK_WINDOW_MS && Math.abs(distance) > SNAP_FLICK_MIN_DISTANCE_PX && Math.abs(distance) < SNAP_FLICK_MAX_DISTANCE_PX && (elapsed <= SNAP_FLICK_FAST_TIME_MS || Math.abs(distance) / elapsed >= SNAP_SWIPE_SPEED_PX_MS);
    }
    function flushPendingSnap(state) {
      if (state.snapEnabled && !state.disposed) scheduleScrollEnd(state);
    }
    function cancelPointerScrollMouseEvent(state, event) {
      var active = state.pointerScroll && state.pointerScroll.moved;
      if (!active && !mouseReleaseEvents.has(event.type)) return;
      var button = active ? state.pointerScroll.button : state.mouseReleaseButton;
      if (button === null || !event.cancelable) return;
      if (mouseHoldEvents.has(event.type)) {
        if ((event.buttons & 1 << button) === 0) return;
      } else if (event.button !== button) {
        return;
      }
      event.preventDefault();
    }
    function stopPointerScrollMouseEvents(state) {
      if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
      state.mouseReleaseTimeout = null;
      state.mouseReleaseButton = null;
      var _iterator19 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step19;
      try {
        for (_iterator19.s(); !(_step19 = _iterator19.n()).done; ) {
          var name = _step19.value;
          offTarget(root, "$" + name, state.onMouseEvent, true);
        }
      } catch (err) {
        _iterator19.e(err);
      } finally {
        _iterator19.f();
      }
    }
    function startMomentum(state, pointerScroll) {
      var element = state.element;
      var elapsed = Math.max(1, now() - pointerScroll.momentumStartTime);
      var x = pointerScroll.axis === "x" ? momentumAxis(element.scrollLeft, pointerScroll.momentumStartX, elapsed, Math.max(0, element.scrollWidth - element.clientWidth)) : element.scrollLeft;
      var y = pointerScroll.axis === "y" ? momentumAxis(element.scrollTop, pointerScroll.momentumStartY, elapsed, Math.max(0, element.scrollHeight - element.clientHeight)) : element.scrollTop;
      if (x === element.scrollLeft && y === element.scrollTop) return;
      var momentum = {
        currentX: element.scrollLeft,
        currentY: element.scrollTop,
        toX: x,
        toY: y,
        frame: null
      };
      state.momentum = momentum;
      momentum.frame = root.requestAnimationFrame(function() {
        return stepMomentum(state, momentum);
      });
    }
    function momentumAxis(current, start, elapsed, maximum) {
      var distance = current - start;
      if (Math.abs(distance) <= MOMENTUM_LIMIT_DISTANCE_PX) return current;
      var speed = Math.abs(distance) / elapsed;
      var projected = current + Math.sign(distance) * speed * speed / MOMENTUM_DECELERATION;
      return Math.max(0, Math.min(maximum, Math.round(projected)));
    }
    function stepMomentum(state, momentum) {
      if (state.momentum !== momentum || state.disposed) return;
      momentum.currentX += (momentum.toX - momentum.currentX) * 0.1;
      momentum.currentY += (momentum.toY - momentum.currentY) * 0.1;
      var done = momentum.currentX.toFixed(3) === momentum.toX.toFixed(3) && momentum.currentY.toFixed(3) === momentum.toY.toFixed(3);
      var element = state.element;
      element.scrollTo({
        left: done ? momentum.toX : momentum.currentX,
        top: done ? momentum.toY : momentum.currentY,
        behavior: "instant"
      });
      publish(state);
      if (done) {
        state.momentum = null;
        return;
      }
      momentum.frame = root.requestAnimationFrame(function() {
        return stepMomentum(state, momentum);
      });
    }
    function cancelMomentum(state) {
      if (!state.momentum) return;
      root.cancelAnimationFrame(state.momentum.frame);
      state.momentum = null;
    }
    function addTouchListeners(state) {
      setListeners(state.element, state, touchListeners, true);
      state.touchListening = true;
    }
    function removeTouchListeners(state) {
      setListeners(state.element, state, touchListeners, false);
      state.touchListening = false;
      state.elastic.touch = null;
    }
    function startTouch(state, event) {
      if (event.target.closest("[".concat(scrollbarVerticalAttribute, "], [").concat(scrollbarHorizontalAttribute, "]"))) return;
      if (event.touches.length !== 1) {
        state.elastic.touch = null;
        releaseElastic(state);
        return;
      }
      if (event.target.closest("[".concat(attribute, "]")) !== state.element) return;
      cancelMomentum(state);
      var touch = event.touches[0];
      if (state.elastic.owned) {
        resetElastic(state);
        refresh(state);
      }
      state.elastic.touch = {
        identifier: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        scrollLeft: state.element.scrollLeft,
        scrollTop: state.element.scrollTop
      };
    }
    function moveTouch(state, event) {
      var start = state.elastic.touch;
      if (!start) return;
      var touch = null;
      var _iterator20 = _createForOfIteratorHelper(event.touches), _step20;
      try {
        for (_iterator20.s(); !(_step20 = _iterator20.n()).done; ) {
          var item = _step20.value;
          if (item.identifier === start.identifier) {
            touch = item;
            break;
          }
        }
      } catch (err) {
        _iterator20.e(err);
      } finally {
        _iterator20.f();
      }
      if (!touch) return;
      var desiredX = start.scrollLeft + start.x - touch.clientX;
      var desiredY = start.scrollTop + start.y - touch.clientY;
      if (!applyElasticFromDesired(state, desiredX, desiredY, false)) return;
      if (event.cancelable) event.preventDefault();
      scrollWithinElasticBounds(state, desiredX, desiredY);
      publish(state);
    }
    function endTouch(state, event) {
      var touch = state.elastic.touch;
      if (!touch) return;
      var _iterator21 = _createForOfIteratorHelper(event.touches), _step21;
      try {
        for (_iterator21.s(); !(_step21 = _iterator21.n()).done; ) {
          var item = _step21.value;
          if (item.identifier === touch.identifier) return;
        }
      } catch (err) {
        _iterator21.e(err);
      } finally {
        _iterator21.f();
      }
      state.elastic.touch = null;
      releaseElastic(state);
    }
    function elasticAxes(state) {
      var style = root.getComputedStyle(state.element);
      return {
        x: style.overscrollBehaviorX !== "none",
        y: style.overscrollBehaviorY !== "none"
      };
    }
    function applyElasticFromDesired(state, desiredX, desiredY, additive) {
      var axis = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : null;
      var allowed = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : elasticAxes(state);
      if (!state.elasticEnabled) return false;
      var element = state.element;
      var metrics = state.metrics || nativeMetrics(element);
      var elastic = state.elastic;
      var amounts = [0, 0, 0, 0];
      if (axis !== "x" && allowed.y && metrics.maxY > 1) {
        var limitY = elasticLimit(element.clientHeight, elastic.limits[0]);
        if (desiredY < 0) amounts[0] = elasticResistance(-desiredY, additive ? elastic.amounts[0] : 0, limitY);
        else if (desiredY > metrics.maxY) amounts[2] = elasticResistance(desiredY - metrics.maxY, additive ? elastic.amounts[2] : 0, limitY);
      }
      if (axis !== "y" && allowed.x && metrics.maxX > 1) {
        var limitX = elasticLimit(element.clientWidth, elastic.limits[1]);
        if (desiredX > metrics.maxX) amounts[1] = elasticResistance(desiredX - metrics.maxX, additive ? elastic.amounts[1] : 0, limitX);
        else if (desiredX < 0) amounts[3] = elasticResistance(-desiredX, additive ? elastic.amounts[3] : 0, limitX);
      }
      var active = amounts.some(function(amount) {
        return amount > 0;
      });
      if (!active && !elastic.owned) return false;
      var dimensions = elastic.dimensions || measureElasticWrapper(elastic.wrapper);
      elastic.dimensions = dimensions;
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      elastic.releaseFrame = null;
      elastic.wrapper.classList.remove(elasticReleaseClass);
      elastic.amounts = amounts;
      elastic.active = active;
      elastic.owned = true;
      if (active) suspendSnapStyles(state, "elastic", true);
      setElasticTransform(state, dimensions);
      return active;
    }
    function measureElasticWrapper(wrapper) {
      return {
        offsetWidth: wrapper.offsetWidth,
        scrollWidth: wrapper.scrollWidth,
        clientLeft: wrapper.clientLeft,
        offsetHeight: wrapper.offsetHeight,
        scrollHeight: wrapper.scrollHeight,
        clientTop: wrapper.clientTop
      };
    }
    function setElasticTransform(state) {
      var dimensions = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : state.elastic.dimensions;
      var elastic = state.elastic;
      var wrapper = elastic.wrapper;
      var x = elastic.amounts[3] - elastic.amounts[1];
      var y = elastic.amounts[0] - elastic.amounts[2];
      var translate = x || y ? "translate3d(".concat(x, "px, ").concat(y, "px, 0)") : "";
      var width = Math.max(dimensions.offsetWidth, dimensions.scrollWidth, 1);
      var height = Math.max(dimensions.offsetHeight, dimensions.scrollHeight, 1);
      var scaleX = 1 + 2 * (Math.max(elastic.amounts[1], elastic.amounts[3]) / width);
      var scaleY = 1 + 2 * (Math.max(elastic.amounts[0], elastic.amounts[2]) / height);
      var scale = scaleX > 1 || scaleY > 1 ? "scale(".concat(scaleX, ", ").concat(scaleY, ")") : "";
      if (scaleX > 1 || scaleY > 1) {
        var baseOrigin = elastic.baseOrigin.split(" ");
        var originX = elastic.amounts[3] > 0 ? "0%" : elastic.amounts[1] > 0 ? "".concat(Math.max(dimensions.offsetWidth, dimensions.scrollWidth + dimensions.clientLeft), "px") : baseOrigin[0];
        var originY = elastic.amounts[0] > 0 ? "0%" : elastic.amounts[2] > 0 ? "".concat(Math.max(dimensions.offsetHeight, dimensions.scrollHeight + dimensions.clientTop), "px") : baseOrigin[1];
        wrapper.style.setProperty("transform-origin", "".concat(originX, " ").concat(originY), elasticMemories.get(wrapper).cssProperties["transform-origin"].priority);
      }
      wrapper.style.setProperty("transform", [scale, translate, elastic.baseTransform].filter(Boolean).join(" ") || "none", elasticMemories.get(wrapper).cssProperties.transform.priority);
    }
    function scrollWithinElasticBounds(state, desiredX, desiredY) {
      var element = state.element;
      var metrics = state.metrics || nativeMetrics(element);
      element.scrollTo({
        left: Math.max(0, Math.min(metrics.maxX, desiredX)),
        top: Math.max(0, Math.min(metrics.maxY, desiredY)),
        behavior: "instant"
      });
    }
    function releaseElastic(state) {
      var elastic = state.elastic;
      if (!elastic.owned) {
        flushPendingSnap(state);
        return;
      }
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.wheelTimeout = null;
      if (!elastic.active) {
        resetElastic(state);
        flushPendingSnap(state);
        return;
      }
      if (AelluxJs.currentPreference("reduced-motion") === "reduced") {
        resetElastic(state);
        refresh(state);
        flushPendingSnap(state);
        return;
      }
      elastic.wrapper.classList.add(elasticReleaseClass);
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      elastic.releaseFrame = root.requestAnimationFrame(function() {
        return stepElasticRelease(state);
      });
    }
    function stepElasticRelease(state) {
      var elastic = state.elastic;
      elastic.releaseFrame = null;
      if (state.disposed || !elastic.owned) return;
      elastic.amounts = elastic.amounts.map(function(amount) {
        return amount < ELASTIC_RETURN_EPSILON ? 0 : amount * (1 - ELASTIC_RETURN_LERP);
      });
      if (elastic.amounts.every(function(amount) {
        return amount === 0;
      })) {
        resetElastic(state);
        refresh(state);
        flushPendingSnap(state);
        return;
      }
      setElasticTransform(state);
      publish(state);
      elastic.releaseFrame = root.requestAnimationFrame(function() {
        return stepElasticRelease(state);
      });
    }
    function resetElastic(state) {
      var elastic = state.elastic;
      var wasOwned = elastic.owned;
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.releaseFrame = null;
      elastic.wheelTimeout = null;
      if (elastic.wrapper) elastic.wrapper.classList.remove(elasticReleaseClass);
      if (elastic.owned && elastic.wrapper) {
        var _elasticMemories$get;
        (_elasticMemories$get = elasticMemories.get(elastic.wrapper)) === null || _elasticMemories$get === void 0 || _elasticMemories$get.restore();
      }
      elastic.amounts = [0, 0, 0, 0];
      elastic.active = false;
      elastic.owned = false;
      if (wasOwned && !state.disposed) {
        suspendSnapStyles(state, "elastic", false);
        if (state.snap.deferredIndex !== null) {
          var index = state.snap.deferredIndex;
          state.snap.deferredIndex = null;
          scrollToSnap(state, index);
        }
      }
      if (wasOwned && !state.disposed) publish(state);
    }
    function observe(state) {
      state.onResize = function() {
        return scheduleResize(state);
      };
      onTarget(root, "$resize", state.onResize, {
        passive: true
      });
      if (root.matchMedia) {
        state.desktopMedia = root.matchMedia("(hover: hover) and (pointer: fine)");
        state.onDesktopMediaChange = function() {
          return configure(state);
        };
        if (state.desktopMedia.addEventListener) state.desktopMedia.addEventListener("change", state.onDesktopMediaChange);
        else if (state.desktopMedia.addListener) state.desktopMedia.addListener(state.onDesktopMediaChange);
      }
      if (root.ResizeObserver) {
        state.resizeObserver = new root.ResizeObserver(function() {
          return scheduleResize(state);
        });
        state.resizeObserver.observe(state.element);
        var _iterator22 = _createForOfIteratorHelper(state.element.children), _step22;
        try {
          for (_iterator22.s(); !(_step22 = _iterator22.n()).done; ) {
            var child = _step22.value;
            state.resizeObserver.observe(child);
          }
        } catch (err) {
          _iterator22.e(err);
        } finally {
          _iterator22.f();
        }
      }
      if (root.MutationObserver) {
        state.mutationObserver = new root.MutationObserver(function(records) {
          if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver.observe(state.element);
            var _iterator23 = _createForOfIteratorHelper(state.element.children), _step23;
            try {
              for (_iterator23.s(); !(_step23 = _iterator23.n()).done; ) {
                var _child = _step23.value;
                state.resizeObserver.observe(_child);
              }
            } catch (err) {
              _iterator23.e(err);
            } finally {
              _iterator23.f();
            }
          }
          if (records.some(function(record) {
            return record.type === "attributes" || record.target === state.element || record.target === state.elastic.wrapper || [].concat(_toConsumableArray(record.addedNodes), _toConsumableArray(record.removedNodes)).some(function(node) {
              return node.nodeType === 1 && (node.hasAttribute(snapItemAttribute) || node.querySelector("[".concat(snapItemAttribute, "]")));
            });
          })) configure(state);
          else refresh(state);
        });
        state.mutationObserver.observe(state.element, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: [snapAttribute, snapItemAttribute, elasticAttribute, scrollbarAttribute]
        });
      }
    }
    function scheduleResize(state) {
      if (state.disposed) return;
      var elapsed = now() - state.lastResizeTime;
      if (elapsed >= RESIZE_INTERVAL_MS) {
        if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
        state.resizeTimeout = null;
        flushResize(state);
        return;
      }
      if (state.resizeTimeout !== null) return;
      state.resizeTimeout = root.setTimeout(function() {
        return flushResize(state);
      }, RESIZE_INTERVAL_MS - elapsed);
    }
    function flushResize(state) {
      state.resizeTimeout = null;
      if (state.disposed) return;
      state.lastResizeTime = now();
      refresh(state);
    }
    function now() {
      return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
    }
    function refresh(state) {
      if (state.disposed) return;
      publish(state);
    }
    function nativeMetrics(element) {
      return {
        maxX: Math.max(0, element.scrollWidth - element.clientWidth),
        maxY: Math.max(0, element.scrollHeight - element.clientHeight),
        page: element.clientHeight || 1
      };
    }
    function wheelAxes(state, metrics) {
      var style = root.getComputedStyle(state.element);
      var available = function available2(value) {
        return value === "auto" || value === "scroll";
      };
      var stopsChain = function stopsChain2(value) {
        return value === "contain" || value === "none";
      };
      return {
        x: metrics.maxX > 1 && available(style.overflowX),
        y: metrics.maxY > 1 && available(style.overflowY),
        stopX: available(style.overflowX) && stopsChain(style.overscrollBehaviorX),
        stopY: available(style.overflowY) && stopsChain(style.overscrollBehaviorY)
      };
    }
    function publish(state) {
      if (state.disposed) return;
      state.publishDirty = true;
      if (state.publishPending) return;
      state.publishPending = true;
      AelluxJs.waitLayout.read(function() {
        if (state.disposed) return null;
        state.publishDirty = false;
        var metrics = nativeMetrics(state.element);
        var scrollTop = state.element.scrollTop;
        var scrollLeft = state.element.scrollLeft;
        if (!state.elastic.active) state.metrics = metrics;
        if (state.elasticEnabled && state.elastic.wrapper && !state.elastic.active) state.elastic.dimensions = measureElasticWrapper(state.elastic.wrapper);
        var bars = state.scrollbar.x || state.scrollbar.y;
        var axes = bars ? wheelAxes(state, metrics) : null;
        return {
          revision: state.layoutRevision,
          y: progress(scrollTop, metrics.maxY),
          x: progress(scrollLeft, metrics.maxX),
          edges: state.elastic.owned ? null : [scrollTop < SCROLL_EDGE_MARGIN_PX, scrollTop >= metrics.maxY - SCROLL_EDGE_MARGIN_PX, scrollLeft < SCROLL_EDGE_MARGIN_PX, scrollLeft >= metrics.maxX - SCROLL_EDGE_MARGIN_PX],
          snapAxis: state.snapEnabled ? snapAxis(state) : null,
          snapValues: state.snapEnabled ? measureSnapValues(state) : [],
          scrollbars: bars ? readScrollbars(state, metrics, axes) : []
        };
      }).then(function(values) {
        if (!values || state.disposed) {
          state.publishDirty = false;
          return;
        }
        return AelluxJs.waitLayout.update(function() {
          if (state.disposed || state.layoutRevision !== values.revision) return;
          state.element.style.setProperty(properties[0], values.y);
          state.element.style.setProperty(properties[1], values.x);
          if (values.edges && !state.elastic.owned) {
            scrollEdgeClasses.forEach(function(name, index) {
              return state.element.classList.toggle(name, values.edges[index]);
            });
          }
          if (values.snapAxis && state.snap.axis !== values.snapAxis) syncSnapStyles(state, values.snapAxis);
          var _iterator24 = _createForOfIteratorHelper(values.snapValues), _step24;
          try {
            for (_iterator24.s(); !(_step24 = _iterator24.n()).done; ) {
              var _step24$value = _step24.value, item = _step24$value.item, viewport = _step24$value.viewport, focus = _step24$value.focus;
              if (!state.snap.savedItems.has(item)) {
                snapItemMemories.set(item, AelluxJs.persist.element.save(item, [], snapProperties));
                state.snap.savedItems.add(item);
              }
              item.style.setProperty(snapProperties[0], viewport);
              item.style.setProperty(snapProperties[1], focus);
            }
          } catch (err) {
            _iterator24.e(err);
          } finally {
            _iterator24.f();
          }
          updateScrollbars(state, values.scrollbars);
        });
      }).catch(function(cause) {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT, {
          cause: cause,
          extension: extensionName,
          element: state.element,
          method: "update"
        });
      }).finally(function() {
        state.publishPending = false;
        if (state.publishDirty && !state.disposed) publish(state);
      });
    }
    function measureSnapValues(state) {
      var element = state.element;
      var rect = element.getBoundingClientRect();
      var axis = snapAxis(state);
      var size = axis === "x" ? element.clientWidth : element.clientHeight;
      if (!size) return [];
      var center = axis === "x" ? rect.left + element.clientLeft + size / 2 : rect.top + element.clientTop + size / 2;
      return snapItems(state).map(function(item) {
        var box = item.getBoundingClientRect();
        var itemCenter = axis === "x" ? box.left + box.width / 2 : box.top + box.height / 2;
        var viewport = Math.max(-2, Math.min(2, (itemCenter - center) * 2 / size));
        var focus = Math.max(0, 1 - Math.abs(snapAlignmentOffset(state, item, axis, rect, box)) / size);
        return {
          item: item,
          viewport: viewport,
          focus: focus
        };
      });
    }
    function progress(position, distance) {
      return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
    }
    function handleSnapWheel(state, event) {
      if (!state.snapEnabled) return false;
      var axis = snapAxis(state);
      var horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      var delta = axis === "x" ? horizontal ? event.deltaX : state.wheelEnabled ? event.deltaY : 0 : horizontal ? 0 : event.deltaY;
      if (!delta) return false;
      var items = snapItems(state);
      if (!items.length) {
        if (event.cancelable) event.preventDefault();
        return true;
      }
      var metrics = nativeMetrics(state.element);
      var edge = edgeSnapIndex(state, items, axis, metrics);
      var index = edge !== null ? edge : state.snap.scrollingToTarget !== -1 ? state.snap.index : selectedSnapIndex(state);
      var next2 = index + Math.sign(delta);
      if (next2 < 0 || next2 >= items.length) {
        if (state.snap.scrollingToTarget !== -1) {
          if (event.cancelable) event.preventDefault();
          return true;
        }
        suspendSnapForEdgeWheel(state);
        var position = axis === "x" ? state.element.scrollLeft : state.element.scrollTop;
        var maximum = axis === "x" ? metrics.maxX : metrics.maxY;
        if (delta < 0 ? position <= 1 : position >= maximum - 1) {
          var style = root.getComputedStyle(state.element);
          var behavior = horizontal ? style.overscrollBehaviorX : style.overscrollBehaviorY;
          if (behavior === "contain" || behavior === "none") event.preventDefault();
        }
        return false;
      }
      clearEdgeWheelSuspension(state);
      if (event.cancelable) event.preventDefault();
      if (state.scrollbar.drag || state.snap.suspensions.elastic) return true;
      var busy = state.snap.wheelTimeout !== null;
      scheduleSnapWheelIdle(state);
      if (busy) return true;
      scrollToSnap(state, next2, axis);
      return true;
    }
    function handleWheel(state, event) {
      if (event.ctrlKey || !event.cancelable) return;
      state.snap.flick = null;
      if (state.desktop && state.mode === POINTER && state.element.classList.contains(pointerScrollingClass)) {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        return;
      }
      cancelMomentum(state);
      if (event.defaultPrevented) return;
      if (event.target.closest("[".concat(attribute, "]")) !== state.element) return;
      if (handleSnapWheel(state, event)) return;
      var interruptedSnap = state.snap.scrollingToTarget !== -1;
      clearSnapTarget(state);
      clearScrollEnd(state);
      if (interruptedSnap && state.snapEnabled) scheduleScrollEnd(state);
      var metrics = nativeMetrics(state.element);
      if (!metrics) return;
      var axes = wheelAxes(state, metrics);
      var factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
      var converted = state.desktop && state.wheelEnabled && axes.x && !axes.y && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
      var deltaX = (converted ? event.deltaY : event.deltaX) * factor;
      var deltaY = (converted ? 0 : event.deltaY) * factor;
      if (converted && deltaX) {
        var current = state.element.scrollLeft;
        var desiredX = current + deltaX;
        var _next = Math.max(0, Math.min(metrics.maxX, desiredX));
        var overflow = desiredX < 0 || desiredX > metrics.maxX;
        var stretched = false;
        if (overflow && state.elasticEnabled) {
          stretched = applyElasticFromDesired(state, desiredX, state.element.scrollTop, true, "x");
          if (stretched) {
            scrollWithinElasticBounds(state, desiredX, state.element.scrollTop);
            if (state.elastic.wheelTimeout !== null) root.clearTimeout(state.elastic.wheelTimeout);
            state.elastic.wheelTimeout = root.setTimeout(function() {
              return releaseElastic(state);
            }, ELASTIC_WHEEL_IDLE_MS);
          }
        } else if (state.elastic.owned) {
          resetElastic(state);
          refresh(state);
        }
        if (!stretched && _next !== current) state.element.scrollTo({
          left: _next,
          behavior: "instant"
        });
        if (stretched || _next !== current) publish(state);
        if (!overflow && _next !== current) event.preventDefault();
        return;
      }
      if (state.elasticEnabled && (axes.x || axes.y)) {
        var _desiredX = state.element.scrollLeft + (axes.x ? deltaX : 0);
        var desiredY = state.element.scrollTop + (axes.y ? deltaY : 0);
        var axis = axes.x && axes.y ? null : axes.x ? "x" : "y";
        if (applyElasticFromDesired(state, _desiredX, desiredY, true, axis)) {
          if (!state.snapEnabled) event.preventDefault();
          scrollWithinElasticBounds(state, _desiredX, desiredY);
          publish(state);
          if (state.elastic.wheelTimeout !== null) root.clearTimeout(state.elastic.wheelTimeout);
          state.elastic.wheelTimeout = root.setTimeout(function() {
            return releaseElastic(state);
          }, ELASTIC_WHEEL_IDLE_MS);
          return;
        }
        if (state.elastic.owned) {
          resetElastic(state);
          refresh(state);
        }
      }
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.scrollbox.legacy.js.map
