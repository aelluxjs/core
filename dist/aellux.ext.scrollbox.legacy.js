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
    var onEvent = AelluxJs.onEvent, offEvent = AelluxJs.offEvent;
    var POINTER = "pointer", POINTER_DOWN = "".concat(POINTER, "down"), POINTER_MOVE = "".concat(POINTER, "move"), POINTER_UP = "".concat(POINTER, "up"), POINTER_CANCEL = "".concat(POINTER, "cancel"), POINTER_OVER = "".concat(POINTER, "over"), POINTER_OUT = "".concat(POINTER, "out"), POINTER_ENTER = "".concat(POINTER, "enter"), POINTER_LEAVE = "".concat(POINTER, "leave"), POINTER_DOWN_TARGET = "$".concat(POINTER_DOWN), POINTER_MOVE_TARGET = "$".concat(POINTER_MOVE), POINTER_UP_TARGET = "$".concat(POINTER_UP), POINTER_CANCEL_TARGET = "$".concat(POINTER_CANCEL);
    var attribute = AelluxJs.attr(extensionName);
    var wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
    var momentumAttribute = AelluxJs.attr("scrollbox-momentum");
    var elasticAttribute = AelluxJs.attr("scrollbox-elastic");
    var scrollbarAttribute = AelluxJs.attr("scrollbar");
    var scrollbarVerticalAttribute = AelluxJs.attr("scrollbar-vertical");
    var scrollbarHorizontalAttribute = AelluxJs.attr("scrollbar-horizontal");
    var elasticReleaseClass = AelluxJs.className("scrollbox-elastic-release");
    var pointerScrollingClass = AelluxJs.className("pointerscrolling");
    var nativeScrollbarHideClass = AelluxJs.className("native-sb-hide");
    var scrollbarVisibleClass = AelluxJs.className("scrollbar-visible");
    var scrollEdgeClasses = [AelluxJs.className("scroll-v-start"), AelluxJs.className("scroll-v-end"), AelluxJs.className("scroll-h-start"), AelluxJs.className("scroll-h-end")];
    var pointerScrollExceptionSelector = "a, button, input, select, textarea, [contenteditable], [draggable='true'], " + "[".concat(scrollbarVerticalAttribute, "], [").concat(scrollbarHorizontalAttribute, "]");
    var SCROLL_EDGE_MARGIN_PX = 5;
    var nextLayoutId = 3e6;
    var POINTER_SCROLL_THRESHOLD_PX = 3;
    var POINTER_SCROLL_MULTICLICK_MS = 500;
    var POINTER_SCROLL_MULTICLICK_DISTANCE_PX = 8;
    var TEXT_SELECTION_WAIT_MS = 100;
    var VERTICAL_TEXT_DRAG_PX = 10;
    var MOMENTUM_LIMIT_TIME_MS = 300;
    var MOMENTUM_LIMIT_DISTANCE_PX = 15;
    var MOMENTUM_DECELERATION = 15e-4;
    var ELASTIC_DAMPING = 1 / 3;
    var DEFAULT_ELASTIC_LIMIT = {
      unit: "ratio",
      value: 1 / 4
    };
    var ELASTIC_RETURN_LERP = 0.15;
    var ELASTIC_RETURN_EPSILON = 0.01;
    var ELASTIC_WHEEL_IDLE_MS = 80;
    var SCROLLBAR_MIN_THUMB_PX = 20;
    var SCROLLBAR_INTERACTION_HIDE_DELAY_MS = 1e3;
    var SCROLLBAR_HOVER_HIDE_DELAY_MS = 300;
    var scrollbarProperties = ["--ae-scrollbar-x", "--ae-scrollbar-y", "--ae-scrollbar-length", "--ae-scrollbar-thumb-size", "--ae-scrollbar-thumb-position", "--ae-scrollbar-display"];
    var pointerListeners = [[POINTER_DOWN, "onPointerDown"], [POINTER_OVER, "onPointerOver"], [POINTER_OUT, "onPointerOut"], ["mousedown", "onMouseDown"]];
    var scrollbarHoverListeners = [[POINTER_DOWN, "onScrollbarPointerDown"], [POINTER_ENTER, "onScrollbarPointerEnter"], [POINTER_LEAVE, "onScrollbarPointerLeave"], [POINTER_OVER, "onScrollbarPointerOver"], [POINTER_OUT, "onScrollbarPointerOut"], [POINTER_MOVE, "onScrollbarPointerMove"], [POINTER_UP, "onScrollbarPointerEnd"], [POINTER_CANCEL, "onScrollbarPointerEnd"], ["mouseenter", "onScrollbarMouseEnter"], ["mouseleave", "onScrollbarMouseLeave"], ["mouseover", "onScrollbarMouseOver"], ["mouseout", "onScrollbarMouseOut"]];
    var scrollbarAxisListeners = [[POINTER_DOWN, "onPointerDown"], [POINTER_MOVE, "onPointerMove"], [POINTER_UP, "onPointerEnd"], [POINTER_CANCEL, "onPointerEnd"]];
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
      var method = active ? onEvent : offEvent;
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
    function isTouch(callback) {
      return function(event) {
        if (event && event.pointerType !== "touch") {
          callback(event);
        }
      };
    }
    var pointerScrollMouseEvents = ["mousedown", "mousemove", "mouseup", "click", "dblclick", "auxclick", "contextmenu", "mouseover", "mouseout", "mouseenter", "mouseleave"];
    var pointerScrollDragEvents = ["dragstart", "drag", "dragenter", "dragover", "dragleave", "drop", "dragend"];
    var mouseHoldEvents = /* @__PURE__ */ new Set(["mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave"]);
    var mouseReleaseEvents = /* @__PURE__ */ new Set(["mouseup", "click", "dblclick", "auxclick", "contextmenu"]);
    var properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
    var scrollboxes = /* @__PURE__ */ new Map();
    var elementMemories = /* @__PURE__ */ new WeakMap();
    var cursorMemories = /* @__PURE__ */ new WeakMap();
    var scrollbarMemories = /* @__PURE__ */ new WeakMap();
    var inlineMemories = /* @__PURE__ */ new WeakMap();
    var elasticMemories = /* @__PURE__ */ new WeakMap();
    var pointerScrollMemories = /* @__PURE__ */ new WeakMap();
    var snapController = null;
    var activePointerScrollState = null;
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      next: next,
      previous: previous,
      goto: goto,
      registerSnapController: registerSnapController,
      unregisterSnapController: unregisterSnapController
    });
    function init() {
      AelluxJs.registerCssProperty.apply(AelluxJs, _toConsumableArray(properties.map(function(name) {
        return {
          name: name,
          syntax: "<number>",
          initialValue: "0"
        };
      })).concat(_toConsumableArray(scrollbarProperties.map(function(name, index) {
        return {
          name: name,
          syntax: index === 5 ? "block | none" : "<length>",
          initialValue: index === 5 ? "none" : "0px"
        };
      })), [{
        name: "--ae-scrollbar-opacity-visible",
        syntax: "<number>",
        initialValue: "1"
      }, {
        name: "--ae-scrollbar-opacity-fade",
        syntax: "<number>",
        initialValue: "0"
      }, {
        name: "--ae-scrollbar-thumb-color",
        syntax: "*"
      }, {
        name: "--ae-scrollbar-thumb-hover-color",
        syntax: "*"
      }, {
        name: "--ae-scrollbar-track-color",
        syntax: "*"
      }, {
        name: "--ae-scrollbar-thumb-radius",
        syntax: "<length-percentage>",
        initialValue: "10px"
      }, {
        name: "--ae-scrollbar-size",
        syntax: "<length>",
        initialValue: "8px"
      }]));
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
    function registerSnapController(controller) {
      snapController = controller;
    }
    function unregisterSnapController(controller) {
      if (snapController === controller) snapController = null;
    }
    function goto(element, index, behavior) {
      var _snapController;
      return ((_snapController = snapController) === null || _snapController === void 0 ? void 0 : _snapController.goto(element, index, behavior)) || false;
    }
    function next(element) {
      var _snapController2;
      return ((_snapController2 = snapController) === null || _snapController2 === void 0 ? void 0 : _snapController2.next(element)) || false;
    }
    function previous(element) {
      var _snapController3;
      return ((_snapController3 = snapController) === null || _snapController3 === void 0 ? void 0 : _snapController3.previous(element)) || false;
    }
    function dispatchInteraction(state, reason, active) {
      AelluxJs.dispatchFrom(state.element, "ScrollboxInteraction", {
        detail: {
          reason: reason,
          active: !!active
        }
      });
    }
    function dispatchSnapGesture(state, phase, pointerScroll) {
      return AelluxJs.dispatchFrom(state.element, "ScrollboxSnapGesture", {
        cancelable: phase !== "start",
        detail: {
          phase: phase,
          axis: pointerScroll.axis,
          moved: pointerScroll.moved,
          startX: pointerScroll.startX,
          startY: pointerScroll.startY,
          lastX: pointerScroll.lastX,
          lastY: pointerScroll.lastY,
          startTime: pointerScroll.startTime,
          endTime: pointerScroll.endTime
        }
      });
    }
    function dispatchWheel(state, event) {
      return AelluxJs.dispatchFrom(state.element, "ScrollboxWheel", {
        cancelable: true,
        detail: {
          event: event
        }
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
        baseMargins: null,
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
        interactionTimeout: null,
        lastScrollLeft: null,
        lastScrollTop: null
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
        wheelListening: false,
        pointerListening: false,
        touchListening: false,
        pointerScroll: null,
        lastPointerDown: null,
        mouseReleaseButton: null,
        mouseReleaseTimeout: null,
        momentum: null,
        elastic: elastic,
        inlineWrapper: inlineWrapper,
        scrollbar: scrollbar,
        resizeObserver: null,
        mutationObserver: null,
        desktopMedia: null,
        publishPending: false,
        publishDirty: false,
        layoutRevision: 0,
        resizeLayoutId: nextLayoutId++,
        publishLayoutId: nextLayoutId++,
        disposed: false
      };
      state.onScroll = function(event) {
        if (event.target !== element) return;
        if ((state.scrollbar.x || state.scrollbar.y) && (state.scrollbar.lastScrollLeft !== element.scrollLeft || state.scrollbar.lastScrollTop !== element.scrollTop)) {
          var metrics = nativeMetrics(element);
          updateScrollbars(state, readScrollbars(state, metrics, wheelAxes(state, metrics)));
          state.scrollbar.lastScrollLeft = element.scrollLeft;
          state.scrollbar.lastScrollTop = element.scrollTop;
        }
        publish(state);
        if (!state.desktop && state.scrollbar.listening) scheduleScrollbarInteractionHide(state);
      };
      state.onScrollEnd = function(event) {
        if (event.target !== element) return;
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
      state.onScrollbarPointerDown = isTouch(function() {
        return startScrollbarInteractionVisibility(state);
      });
      state.onScrollbarPointerEnd = isTouch(function() {
        return scheduleScrollbarInteractionHide(state);
      });
      state.onScrollbarPointerEnter = isTouch(function() {
        return setScrollbarHover(state, "pointerHover", true);
      });
      state.onScrollbarPointerLeave = isTouch(function() {
        return setScrollbarHover(state, "pointerHover", false);
      });
      state.onScrollbarPointerOver = isTouch(function() {
        return setScrollbarHover(state, "pointerHover", true);
      });
      state.onScrollbarPointerOut = isTouch(function(event) {
        if (!event.relatedTarget || !element.contains(event.relatedTarget)) setScrollbarHover(state, "pointerHover", false);
      });
      state.onScrollbarPointerMove = isTouch(function() {
        if (!state.scrollbar.pointerHover) setScrollbarHover(state, "pointerHover", true);
      });
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
      onEvent(element, "$scroll", state.onScroll, {
        passive: true
      });
      onEvent(element, "$scrollend", state.onScrollEnd, {
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
      resetElastic(state);
      if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
      restoreInlineWrapper(state);
      resetScrollbars(state);
      offEvent(element, "$scroll", state.onScroll);
      offEvent(element, "$scrollend", state.onScrollEnd);
      if (state.wheelListening) offEvent(element, "$wheel", state.onWheel, true);
      if (state.pointerListening) setListeners(element, state, pointerListeners, false);
      if (state.touchListening) removeTouchListeners(state);
      if (state.resizeObserver) state.resizeObserver.disconnect();
      if (state.mutationObserver) state.mutationObserver.disconnect();
      if (state.desktopMedia) {
        if (state.desktopMedia.removeEventListener) state.desktopMedia.removeEventListener("change", state.onDesktopMediaChange);
        else if (state.desktopMedia.removeListener) state.desktopMedia.removeListener(state.onDesktopMediaChange);
      }
      AelluxJs.waitLayout.cancel(state.resizeLayoutId);
      AelluxJs.waitLayout.cancel(state.publishLayoutId);
      offEvent(root, "$resize", state.onResize);
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
      configureInlineWrapper(state);
      configureScrollbars(state);
      state.desktop = isDesktop();
      if ((state.desktop || state.elasticEnabled) && !state.wheelListening) {
        onEvent(element, "$wheel", state.onWheel, {
          passive: false,
          capture: true
        });
        state.wheelListening = true;
      } else if (!state.desktop && !state.elasticEnabled && state.wheelListening) {
        offEvent(element, "$wheel", state.onWheel, true);
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
      refresh(state);
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
      var scrollbarElement = null;
      if (enabled) scrollbarElement = Array.from(state.element.children).find(function(child) {
        return child.hasAttribute(attributeName);
      }) || null;
      if (current && current.element === scrollbarElement && enabled) {
        positionScrollbarAxis(state, current);
        return;
      }
      if (current) resetScrollbarAxis(state, axis);
      if (!enabled) return;
      var owned = !scrollbarElement;
      if (!scrollbarElement) {
        scrollbarElement = root.document.createElement("div");
        scrollbarElement.setAttribute(attributeName, "");
        state.element.appendChild(scrollbarElement);
      }
      var marker = owned ? null : root.document.createComment("scrollbar position");
      if (marker) scrollbarElement.before(marker);
      if (!owned) scrollbarMemories.set(scrollbarElement, AelluxJs.persist.element.save(scrollbarElement, [], scrollbarProperties));
      var record = {
        element: scrollbarElement,
        owned: owned,
        axis: axis,
        marker: marker,
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
      setListeners(scrollbarElement, record, scrollbarAxisListeners, true);
      scrollbar[axis] = record;
      positionScrollbarAxis(state, record);
    }
    function positionScrollbarAxis(state, record) {
      var container = state.element;
      if (record.axis === "y" && container.firstChild !== record.element) container.prepend(record.element);
      else if (record.axis === "x" && container.lastChild !== record.element) container.append(record.element);
    }
    function resetScrollbarAxis(state, axis) {
      var record = state.scrollbar[axis];
      if (!record) return;
      endScrollbarDrag(state, record);
      var element = record.element;
      setListeners(element, record, scrollbarAxisListeners, false);
      if (record.owned) element.remove();
      else {
        var _scrollbarMemories$ge;
        (_scrollbarMemories$ge = scrollbarMemories.get(element)) === null || _scrollbarMemories$ge === void 0 || _scrollbarMemories$ge.restore();
        if (record.marker.parentNode) record.marker.replaceWith(element);
        else record.marker.remove();
      }
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
        var metrics = nativeMetrics(state.element);
        updateScrollbars(state, readScrollbars(state, metrics, wheelAxes(state, metrics)));
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
        var display = axes[axis] ? "block" : "none";
        values.push({
          record: record,
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
          var _step5$value = _step5.value, record = _step5$value.record, trackSize = _step5$value.trackSize, thumbSize = _step5$value.thumbSize, thumbPosition = _step5$value.thumbPosition, max = _step5$value.max, display = _step5$value.display;
          if (state.scrollbar[record.axis] !== record) continue;
          var style = record.element.style;
          if (record.trackSize !== trackSize) style.setProperty(scrollbarProperties[2], "".concat(trackSize, "px"));
          if (record.thumbSize !== thumbSize) style.setProperty(scrollbarProperties[3], "".concat(thumbSize, "px"));
          if (record.thumbPosition !== thumbPosition) style.setProperty(scrollbarProperties[4], "".concat(thumbPosition, "px"));
          if (record.display !== display) style.setProperty(scrollbarProperties[5], display);
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
    function visibleScrollbarTrack(record) {
      var style = root.getComputedStyle(record.element);
      if (Number.parseFloat(style.opacity) <= 0) return false;
      var color = style.backgroundColor;
      if (!color || color === "transparent") return false;
      var rgba = color.match(/^rgba\((.+)\)$/);
      return !rgba || Number.parseFloat(rgba[1].split(",").at(-1)) > 0;
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
        if (!visibleScrollbarTrack(record)) return;
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
      dispatchInteraction(state, "scrollbar", true);
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
      dispatchInteraction(state, "scrollbar", false);
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
        state.elastic.baseMargins = {
          top: computed.marginTop,
          right: computed.marginRight,
          bottom: computed.marginBottom,
          left: computed.marginLeft
        };
        elasticMemories.set(wrapper, AelluxJs.persist.element.save(wrapper, [], ["transform", "transform-origin", "margin-top", "margin-right", "margin-bottom", "margin-left"]));
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
      var _iterator6 = _createForOfIteratorHelper(element.childNodes), _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
          var node = _step6.value;
          if (node.nodeType !== 3 || !node.textContent.trim()) continue;
          range.selectNodeContents(node);
          var _iterator7 = _createForOfIteratorHelper(range.getClientRects()), _step7;
          try {
            for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
              var rect = _step7.value;
              if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return true;
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
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
      var _iterator8 = _createForOfIteratorHelper(new Set([].concat(_toConsumableArray(chains.x), _toConsumableArray(chains.y)))), _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
          var _member = _step8.value;
          cancelMomentum(_member);
          if (_member.elastic.owned) {
            resetElastic(_member);
            refresh(_member);
          }
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
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
        selectionAtDown: selectionAtDown,
        verticalOnly: verticalOnly,
        selectionReadyTime: textOrigin ? time + TEXT_SELECTION_WAIT_MS : 0,
        selectionWaitTimeout: null,
        pendingMove: null,
        momentumStartTime: time
      };
      activePointerScrollState = state;
      onEvent(root, POINTER_MOVE_TARGET, state.onPointerMove, {
        passive: false,
        capture: true
      });
      onEvent(root, "$touchmove", state.onPointerScrollTouchMove, {
        passive: false,
        capture: true
      });
      var _iterator9 = _createForOfIteratorHelper(pointerScrollDragEvents), _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
          var name = _step9.value;
          onEvent(root, "$" + name, state.onPointerScrollNativeEvent, true);
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      onEvent(root, "$selectstart", state.onPointerScrollNativeEvent, true);
      var _iterator0 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done; ) {
          var _name = _step0.value;
          onEvent(root, "$" + _name, state.onMouseEvent, {
            passive: false,
            capture: true
          });
        }
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      onEvent(root, POINTER_UP_TARGET, state.onPointerEnd, true);
      onEvent(root, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
      onEvent(root, "$blur", state.onBlur);
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
      if (!pointerScroll.axis) pointerScroll.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      var chain = pointerScroll.chains[pointerScroll.axis];
      var threshold = chain.some(function(member2) {
        return !member2.disposed && pointerAxisMaximum(member2, pointerScroll.axis, pointerScroll) > 0 && !dispatchSnapGesture(member2, "probe", pointerScroll);
      }) ? 1 : POINTER_SCROLL_THRESHOLD_PX;
      if (!pointerScroll.moved && dx * dx + dy * dy < threshold * threshold) return;
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
      var _iterator1 = _createForOfIteratorHelper(pointerScroll.chain), _step1;
      try {
        for (_iterator1.s(); !(_step1 = _iterator1.n()).done; ) {
          var member = _step1.value;
          if (!member.disposed && member.pointerListening && pointerAxisMaximum(member, axis, pointerScroll) > 0) outermost = member;
        }
      } catch (err) {
        _iterator1.e(err);
      } finally {
        _iterator1.f();
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
      var _iterator10 = _createForOfIteratorHelper(pointerScroll.chain), _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
          var _member2 = _step10.value;
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
        _iterator10.e(err);
      } finally {
        _iterator10.f();
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
      var _iterator11 = _createForOfIteratorHelper(chain), _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
          var member = _step11.value;
          result.push(member);
          if (axes.get(member)[axis === "x" ? "stopX" : "stopY"]) break;
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      return result;
    }
    function activatePointerScroll(state, pointerScroll, axis) {
      pointerScroll.axis = axis;
      pointerScroll.moved = true;
      pointerScroll.started = true;
      restorePointerScrollCursor(state);
      var _iterator12 = _createForOfIteratorHelper(pointerScroll.chain), _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done; ) {
          var member = _step12.value;
          if (pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
          var element = member.element;
          pointerScrollMemories.set(element, AelluxJs.persist.element.save(element, [], ["scroll-behavior"]));
          pointerScroll.styles.push({
            element: element,
            classOwned: !element.classList.contains(pointerScrollingClass)
          });
          element.style.setProperty("scroll-behavior", "auto", "important");
          element.classList.add(pointerScrollingClass);
          dispatchInteraction(member, POINTER, true);
          dispatchSnapGesture(member, "start", pointerScroll);
          startScrollbarInteractionVisibility(member);
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
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
      state.pointerScroll = null;
      if (activePointerScrollState === state) activePointerScrollState = null;
      if (pointerScroll.selectionWaitTimeout !== null) root.clearTimeout(pointerScroll.selectionWaitTimeout);
      offEvent(root, POINTER_MOVE_TARGET, state.onPointerMove, true);
      offEvent(root, "$touchmove", state.onPointerScrollTouchMove, true);
      var _iterator13 = _createForOfIteratorHelper(pointerScrollDragEvents), _step13;
      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done; ) {
          var name = _step13.value;
          offEvent(root, "$" + name, state.onPointerScrollNativeEvent, true);
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }
      offEvent(root, "$selectstart", state.onPointerScrollNativeEvent, true);
      offEvent(root, POINTER_UP_TARGET, state.onPointerEnd, true);
      offEvent(root, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
      offEvent(root, "$blur", state.onBlur);
      if (pointerScroll.moved && !state.disposed) {
        state.mouseReleaseButton = pointerScroll.button;
        if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
        state.mouseReleaseTimeout = root.setTimeout(function() {
          return stopPointerScrollMouseEvents(state);
        }, 0);
      } else {
        stopPointerScrollMouseEvents(state);
      }
      var snapHandled = false;
      if (event && event.type === POINTER_UP && pointerScroll.axis && !selectionHasChanged(pointerScroll.selectionAtDown)) {
        var snapChain = pointerScroll.moved ? pointerScroll.chain : pointerScroll.chains[pointerScroll.axis];
        var _iterator14 = _createForOfIteratorHelper(snapChain), _step14;
        try {
          for (_iterator14.s(); !(_step14 = _iterator14.n()).done; ) {
            var member = _step14.value;
            if (!member.disposed && !dispatchSnapGesture(member, "end", pointerScroll)) snapHandled = true;
          }
        } catch (err) {
          _iterator14.e(err);
        } finally {
          _iterator14.f();
        }
      }
      var _iterator15 = _createForOfIteratorHelper(pointerScroll.styles), _step15;
      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done; ) {
          var _pointerScrollMemorie;
          var saved = _step15.value;
          if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
          (_pointerScrollMemorie = pointerScrollMemories.get(saved.element)) === null || _pointerScrollMemorie === void 0 || _pointerScrollMemorie.restore();
          pointerScrollMemories.delete(saved.element);
          var _member3 = scrollboxes.get(saved.element);
          if (_member3) {
            dispatchInteraction(_member3, POINTER, false);
            scheduleScrollbarInteractionHide(_member3);
          }
        }
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }
      if (event && event.type === POINTER_UP && state.pointerListening) {
        updatePointerScrollCursor(state, document.elementFromPoint(event.clientX, event.clientY), event.clientX, event.clientY);
      } else restorePointerScrollCursor(state);
      if (pointerScroll.started) dispatchPointerScroll(state, pointerScroll, "PointerScrollEnd");
      var hadElastic = pointerScroll.chain.some(function(member2) {
        return member2.elastic.active;
      });
      var momentumState = pointerScroll.momentumState;
      var _iterator16 = _createForOfIteratorHelper(pointerScroll.chain), _step16;
      try {
        for (_iterator16.s(); !(_step16 = _iterator16.n()).done; ) {
          var _member4 = _step16.value;
          releaseElastic(_member4);
        }
      } catch (err) {
        _iterator16.e(err);
      } finally {
        _iterator16.f();
      }
      if (!snapHandled && event && event.type === POINTER_UP && pointerScroll.moved && momentumState && momentumState.momentumEnabled && !hadElastic && !momentumState.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(momentumState, pointerScroll);
      }
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
      var _iterator17 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step17;
      try {
        for (_iterator17.s(); !(_step17 = _iterator17.n()).done; ) {
          var name = _step17.value;
          offEvent(root, "$" + name, state.onMouseEvent, true);
        }
      } catch (err) {
        _iterator17.e(err);
      } finally {
        _iterator17.f();
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
      restoreTouchOverflow(state);
      state.elastic.touch = null;
    }
    function restoreTouchOverflow(state) {
      var touch = state.elastic.touch;
      if (!touch) return;
      var _iterator18 = _createForOfIteratorHelper(touch.scrollBehaviors), _step18;
      try {
        for (_iterator18.s(); !(_step18 = _iterator18.n()).done; ) {
          var _step18$value = _slicedToArray(_step18.value, 2), element = _step18$value[0], _step18$value$ = _step18$value[1], value = _step18$value$.value, priority = _step18$value$.priority;
          if (value) element.style.setProperty("scroll-behavior", value, priority);
          else element.style.removeProperty("scroll-behavior");
        }
      } catch (err) {
        _iterator18.e(err);
      } finally {
        _iterator18.f();
      }
      touch.scrollBehaviors.clear();
    }
    function startTouch(state, event) {
      if (event.target.closest("[".concat(scrollbarVerticalAttribute, "], [").concat(scrollbarHorizontalAttribute, "]"))) return;
      if (event.touches.length !== 1) {
        restoreTouchOverflow(state);
        state.elastic.touch = null;
        releaseElastic(state);
        return;
      }
      if (event.target.closest("[".concat(attribute, "]")) !== state.element) return;
      cancelMomentum(state);
      var touch = event.touches[0];
      restoreTouchOverflow(state);
      if (state.elastic.owned) {
        resetElastic(state);
        refresh(state);
      }
      state.elastic.touch = {
        identifier: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        scrollBehaviors: /* @__PURE__ */ new Map(),
        scrollLeft: state.element.scrollLeft,
        scrollTop: state.element.scrollTop
      };
    }
    function moveTouch(state, event) {
      var start = state.elastic.touch;
      if (!start) return;
      var touch = null;
      var _iterator19 = _createForOfIteratorHelper(event.touches), _step19;
      try {
        for (_iterator19.s(); !(_step19 = _iterator19.n()).done; ) {
          var item = _step19.value;
          if (item.identifier === start.identifier) {
            touch = item;
            break;
          }
        }
      } catch (err) {
        _iterator19.e(err);
      } finally {
        _iterator19.f();
      }
      if (!touch) return;
      var desiredX = start.scrollLeft + start.x - touch.clientX;
      var desiredY = start.scrollTop + start.y - touch.clientY;
      var deltaX = start.lastX - touch.clientX;
      var deltaY = start.lastY - touch.clientY;
      start.lastX = touch.clientX;
      start.lastY = touch.clientY;
      if (!applyElasticFromDesired(state, desiredX, desiredY, false)) return;
      var metrics = state.metrics || nativeMetrics(state.element);
      var style = root.getComputedStyle(state.element);
      var scrollable = function scrollable2(value) {
        return value === "auto" || value === "scroll";
      };
      var blockedX = !scrollable(style.overflowX) || metrics.maxX <= 1;
      var blockedY = !scrollable(style.overflowY) || metrics.maxY <= 1;
      if (event.cancelable) {
        event.preventDefault();
        if (blockedX && (!style.overscrollBehaviorX || style.overscrollBehaviorX === "auto")) scrollTouchOverflow(state, "x", deltaX);
        if (blockedY && (!style.overscrollBehaviorY || style.overscrollBehaviorY === "auto")) scrollTouchOverflow(state, "y", deltaY);
      }
      scrollWithinElasticBounds(state, blockedX ? state.element.scrollLeft : desiredX, blockedY ? state.element.scrollTop : desiredY);
      publish(state);
    }
    function scrollTouchOverflow(state, axis, delta) {
      if (!delta) return;
      var horizontal = axis === "x";
      for (var parent = state.element.parentElement; parent && delta; parent = parent.parentElement) {
        var style = root.getComputedStyle(parent);
        var overflow = horizontal ? style.overflowX : style.overflowY;
        var position = horizontal ? parent.scrollLeft : parent.scrollTop;
        var maximum = horizontal ? parent.scrollWidth - parent.clientWidth : parent.scrollHeight - parent.clientHeight;
        if ((overflow === "auto" || overflow === "scroll" || parent === root.document.scrollingElement) && maximum > 0) {
          var _next = Math.max(0, Math.min(maximum, position + delta));
          if (!state.elastic.touch.scrollBehaviors.has(parent)) {
            state.elastic.touch.scrollBehaviors.set(parent, {
              value: parent.style.getPropertyValue("scroll-behavior"),
              priority: parent.style.getPropertyPriority("scroll-behavior")
            });
            parent.style.setProperty("scroll-behavior", "auto", "important");
          }
          if (horizontal) parent.scrollLeft = _next;
          else parent.scrollTop = _next;
          delta -= (horizontal ? parent.scrollLeft : parent.scrollTop) - position;
        }
        var behavior = horizontal ? style.overscrollBehaviorX : style.overscrollBehaviorY;
        if (behavior && behavior !== "auto") break;
      }
    }
    function endTouch(state, event) {
      var touch = state.elastic.touch;
      if (!touch) return;
      var _iterator20 = _createForOfIteratorHelper(event.touches), _step20;
      try {
        for (_iterator20.s(); !(_step20 = _iterator20.n()).done; ) {
          var item = _step20.value;
          if (item.identifier === touch.identifier) return;
        }
      } catch (err) {
        _iterator20.e(err);
      } finally {
        _iterator20.f();
      }
      restoreTouchOverflow(state);
      state.elastic.touch = null;
      releaseElastic(state);
    }
    function elasticAxes(state) {
      var style = root.getComputedStyle(state.element);
      var scrollable = function scrollable2(value) {
        return value === "auto" || value === "scroll";
      };
      return {
        x: scrollable(style.overflowX) && style.overscrollBehaviorX !== "none",
        y: scrollable(style.overflowY) && style.overscrollBehaviorY !== "none"
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
      if (active) dispatchInteraction(state, "elastic", true);
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
      setElasticCompensation(state, scaleX, scaleY);
    }
    function setElasticCompensation(state, scaleX, scaleY) {
      var elastic = state.elastic;
      var wrapper = elastic.wrapper;
      var memory = elasticMemories.get(wrapper).cssProperties;
      var compensated = {
        top: 0,
        right: elastic.amounts[3] * (2 + scaleX),
        bottom: elastic.amounts[0] * (2 + scaleY),
        left: 0
      };
      for (var _i2 = 0, _arr2 = ["top", "right", "bottom", "left"]; _i2 < _arr2.length; _i2++) {
        var _elastic$baseMargins;
        var side = _arr2[_i2];
        var base = ((_elastic$baseMargins = elastic.baseMargins) === null || _elastic$baseMargins === void 0 ? void 0 : _elastic$baseMargins[side]) || "0px";
        var property = "margin-".concat(side);
        if (compensated[side]) {
          wrapper.style.setProperty(property, "calc(".concat(base, " - ").concat(compensated[side], "px)"), memory[property].priority);
        } else if (memory[property].present) {
          wrapper.style.setProperty(property, memory[property].value, memory[property].priority);
        } else wrapper.style.removeProperty(property);
      }
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
      if (!elastic.owned) return;
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.wheelTimeout = null;
      if (!elastic.active) {
        resetElastic(state);
        return;
      }
      if (AelluxJs.currentPreference("reduced-motion") === "reduced") {
        resetElastic(state);
        refresh(state);
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
        dispatchInteraction(state, "elastic", false);
      }
      if (wasOwned && !state.disposed) publish(state);
    }
    function observe(state) {
      state.onResize = function() {
        return scheduleResize(state);
      };
      onEvent(root, "$resize", state.onResize, {
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
        var _iterator21 = _createForOfIteratorHelper(state.element.children), _step21;
        try {
          for (_iterator21.s(); !(_step21 = _iterator21.n()).done; ) {
            var child = _step21.value;
            state.resizeObserver.observe(child);
          }
        } catch (err) {
          _iterator21.e(err);
        } finally {
          _iterator21.f();
        }
      }
      if (root.MutationObserver) {
        state.mutationObserver = new root.MutationObserver(function(records) {
          if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver.observe(state.element);
            var _iterator22 = _createForOfIteratorHelper(state.element.children), _step22;
            try {
              for (_iterator22.s(); !(_step22 = _iterator22.n()).done; ) {
                var _child = _step22.value;
                state.resizeObserver.observe(_child);
              }
            } catch (err) {
              _iterator22.e(err);
            } finally {
              _iterator22.f();
            }
          }
          if (records.some(function(record) {
            return record.type === "attributes" || record.target === state.element || record.target === state.elastic.wrapper;
          })) configure(state);
          else refresh(state);
        });
        state.mutationObserver.observe(state.element, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: [elasticAttribute, scrollbarAttribute]
        });
      }
    }
    function scheduleResize(state) {
      if (state.disposed) return;
      AelluxJs.waitLayout.sequence(state.resizeLayoutId, {
        update: function update() {
          return refresh(state);
        },
        maxFPS: AelluxJs.layoutMaxFPS(state.element),
        abort: function abort() {
          return state.disposed;
        }
      });
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
      AelluxJs.waitLayout.read(state.publishLayoutId, function() {
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
          scrollTop: scrollTop,
          scrollLeft: scrollLeft,
          y: progress(scrollTop, metrics.maxY),
          x: progress(scrollLeft, metrics.maxX),
          edges: state.elastic.owned ? null : [scrollTop < SCROLL_EDGE_MARGIN_PX, scrollTop >= metrics.maxY - SCROLL_EDGE_MARGIN_PX, scrollLeft < SCROLL_EDGE_MARGIN_PX, scrollLeft >= metrics.maxX - SCROLL_EDGE_MARGIN_PX],
          scrollbars: bars ? readScrollbars(state, metrics, axes) : []
        };
      }).then(function(values) {
        if (!values || state.disposed) {
          state.publishDirty = false;
          return;
        }
        return AelluxJs.waitLayout.update(state.publishLayoutId, function() {
          if (state.disposed || state.layoutRevision !== values.revision) return;
          if (state.element.scrollTop !== values.scrollTop || state.element.scrollLeft !== values.scrollLeft) {
            state.publishDirty = true;
            return;
          }
          state.element.style.setProperty(properties[0], values.y);
          state.element.style.setProperty(properties[1], values.x);
          if (values.edges && !state.elastic.owned) {
            scrollEdgeClasses.forEach(function(name, index) {
              return state.element.classList.toggle(name, values.edges[index]);
            });
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
    function progress(position, distance) {
      return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
    }
    function scrollAxis(element, axis, delta, maximum) {
      var property = axis === "x" ? "scrollLeft" : "scrollTop";
      var current = element[property];
      var desired = current + delta;
      var next2 = Math.max(0, Math.min(maximum, desired));
      if (next2 !== current) {
        element.scrollTo(axis === "x" ? {
          left: next2,
          behavior: "instant"
        } : {
          top: next2,
          behavior: "instant"
        });
      }
      return desired - next2;
    }
    function inheritedWheelAxes(element, metrics) {
      var style = root.getComputedStyle(element);
      var available = function available2(value) {
        return value === "auto" || value === "scroll";
      };
      return {
        x: metrics.maxX > 1 && available(style.overflowX),
        y: metrics.maxY > 1 && available(style.overflowY)
      };
    }
    function nextWheelTarget(element) {
      for (var parent = element.parentElement; parent; parent = parent.parentElement) {
        var state = scrollboxes.get(parent);
        var metrics = nativeMetrics(parent);
        var axes = state ? wheelAxes(state, metrics) : inheritedWheelAxes(parent, metrics);
        if (axes.x || axes.y) return {
          element: parent,
          state: state,
          metrics: metrics,
          axes: axes
        };
      }
      return null;
    }
    function receivesVerticalWheelAsHorizontal(target) {
      return !!target.state && target.state.desktop && target.state.wheelEnabled && target.axes.x && !target.axes.y;
    }
    function handoffWheelEvent(event, target, deltaY) {
      var handed = {
        ctrlKey: event.ctrlKey,
        cancelable: event.cancelable,
        deltaX: 0,
        deltaY: deltaY,
        target: target.element,
        get defaultPrevented() {
          return event.defaultPrevented;
        },
        preventDefault: function preventDefault() {
          event.preventDefault();
        }
      };
      return dispatchWheel(target.state, handed);
    }
    function handoffVerticalWheel(state, event, metrics, axes, deltaY, factor) {
      if (!state.desktop || state.elasticEnabled || !axes.y || !deltaY) return false;
      var current = state.element.scrollTop;
      var desired = current + deltaY;
      if (desired >= 0 && desired <= metrics.maxY) return false;
      var target = nextWheelTarget(state.element);
      while (target && !target.axes.y && !receivesVerticalWheelAsHorizontal(target)) target = nextWheelTarget(target.element);
      if (!target || target.axes.y) return false;
      var remaining = scrollAxis(state.element, "y", deltaY, metrics.maxY);
      if (remaining !== deltaY) publish(state);
      while (target && remaining) {
        if (receivesVerticalWheelAsHorizontal(target)) {
          if (!handoffWheelEvent(event, target, remaining / factor)) return true;
          remaining = scrollAxis(target.element, "x", remaining, target.metrics.maxX);
          publish(target.state);
        } else if (target.axes.y) {
          remaining = scrollAxis(target.element, "y", remaining, target.metrics.maxY);
          if (target.state) publish(target.state);
        }
        if (!remaining) {
          event.preventDefault();
          return true;
        }
        target = nextWheelTarget(target.element);
      }
      event.preventDefault();
      return true;
    }
    function handleWheel(state, event) {
      if (event.ctrlKey || !event.cancelable) return;
      if (state.desktop && state.mode === POINTER && state.element.classList.contains(pointerScrollingClass)) {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        return;
      }
      cancelMomentum(state);
      if (event.defaultPrevented) return;
      if (event.target.closest("[".concat(attribute, "]")) !== state.element) return;
      if (!dispatchWheel(state, event)) return;
      var metrics = nativeMetrics(state.element);
      if (!metrics) return;
      var axes = wheelAxes(state, metrics);
      var factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
      var converted = state.desktop && state.wheelEnabled && axes.x && !axes.y && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
      var deltaX = (converted ? event.deltaY : event.deltaX) * factor;
      var deltaY = (converted ? 0 : event.deltaY) * factor;
      if (!converted && handoffVerticalWheel(state, event, metrics, axes, deltaY, factor)) return;
      if (converted && deltaX) {
        var current = state.element.scrollLeft;
        var desiredX = current + deltaX;
        var _next2 = Math.max(0, Math.min(metrics.maxX, desiredX));
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
        if (!stretched && _next2 !== current) state.element.scrollTo({
          left: _next2,
          behavior: "instant"
        });
        if (stretched || _next2 !== current) publish(state);
        if (!overflow && _next2 !== current) event.preventDefault();
        return;
      }
      if (state.elasticEnabled && (axes.x || axes.y)) {
        var _desiredX = state.element.scrollLeft + (axes.x ? deltaX : 0);
        var desiredY = state.element.scrollTop + (axes.y ? deltaY : 0);
        var axis = axes.x && axes.y ? null : axes.x ? "x" : "y";
        if (applyElasticFromDesired(state, _desiredX, desiredY, true, axis)) {
          var parent = nextWheelTarget(state.element);
          var overscroll = root.getComputedStyle(state.element).overscrollBehaviorY;
          var verticalChain = axes.y && deltaY && (parent === null || parent === void 0 ? void 0 : parent.axes.y) && (!overscroll || overscroll === "auto") && (desiredY < 0 || desiredY > metrics.maxY);
          event.preventDefault();
          if (verticalChain) {
            var remaining = desiredY < 0 ? desiredY : desiredY - metrics.maxY;
            for (var target = parent; target && remaining; target = nextWheelTarget(target.element)) {
              if (target.axes.y) {
                remaining = scrollAxis(target.element, "y", remaining, target.metrics.maxY);
                if (target.state) publish(target.state);
              }
              var parentOverscroll = root.getComputedStyle(target.element).overscrollBehaviorY;
              if (parentOverscroll && parentOverscroll !== "auto") break;
            }
          }
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
