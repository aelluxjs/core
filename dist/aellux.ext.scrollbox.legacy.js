(function() {
  // src/src/aellux.ext.scrollbox.js
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
    var attribute = AelluxJs.attr(extensionName);
    var wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
    var momentumAttribute = AelluxJs.attr("scrollbox-momentum");
    var elasticAttribute = AelluxJs.attr("scrollbox-elastic");
    var snapAttribute = AelluxJs.attr("scrollbox-snap");
    var scrollbarAttribute = AelluxJs.attr("scrollbar");
    var scrollbarVerticalAttribute = AelluxJs.attr("scrollbar-vertical");
    var scrollbarHorizontalAttribute = AelluxJs.attr("scrollbar-horizontal");
    var elasticReleaseClass = AelluxJs.className("scrollbox-elastic-release");
    var pointerScrollingClass = AelluxJs.className("pointerscrolling");
    var nativeScrollbarHideClass = AelluxJs.className("native-sb-hide");
    var scrollbarVisibleClass = AelluxJs.className("scrollbar-visible");
    var pointerScrollExceptionSelector = "a, button, input, select, textarea, [contenteditable], [draggable='true'], " + "[".concat(scrollbarVerticalAttribute, "], [").concat(scrollbarHorizontalAttribute, "]");
    var RESIZE_INTERVAL_MS = 100;
    var POINTER_SCROLL_THRESHOLD_PX = 3;
    var POINTER_SCROLL_MULTICLICK_MS = 500;
    var POINTER_SCROLL_MULTICLICK_DISTANCE_PX = 8;
    var TEXT_SELECTION_WAIT_MS = 100;
    var VERTICAL_TEXT_DRAG_PX = 10;
    var MOMENTUM_LIMIT_TIME_MS = 300;
    var MOMENTUM_LIMIT_DISTANCE_PX = 15;
    var MOMENTUM_DECELERATION = 15e-4;
    var SNAP_SWIPE_SPEED_PX_MS = 0.5;
    var SNAP_FLICK_WINDOW_MS = 200;
    var SNAP_FLICK_FAST_TIME_MS = 50;
    var SNAP_FLICK_MAX_DISTANCE_PX = 100;
    var SNAP_FLICK_MIN_DISTANCE_PX = 1;
    var SNAP_DRAG_DISTANCE_RATIO = 0.25;
    var SNAP_SCROLL_IDLE_MS = 120;
    var SNAP_WHEEL_IDLE_MS = 120;
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
    var SCROLLBAR_PDS_HIDE_DELAY_MS = 1e3;
    var scrollbarProperties = ["--ae-scrollbar-x", "--ae-scrollbar-y", "--ae-scrollbar-length", "--ae-scrollbar-thumb-size", "--ae-scrollbar-thumb-position", "--ae-scrollbar-display"];
    var pointerScrollMouseEvents = ["mousedown", "mousemove", "mouseup", "click", "dblclick", "auxclick", "contextmenu", "mouseover", "mouseout", "mouseenter", "mouseleave"];
    var pointerScrollDragEvents = ["dragstart", "drag", "dragenter", "dragover", "dragleave", "drop", "dragend"];
    var mouseHoldEvents = /* @__PURE__ */ new Set(["mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave"]);
    var mouseReleaseEvents = /* @__PURE__ */ new Set(["mouseup", "click", "dblclick", "auxclick", "contextmenu"]);
    var properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
    var snapProperties = ["--ae-snap-viewport", "--ae-snap-focus"];
    var scrollboxes = /* @__PURE__ */ new Map();
    var activePointerScrollState = null;
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      next: next,
      previous: previous,
      goto: goto
    });
    function init() {
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attribute, "]"),
        mount: mountScrollbox,
        update: updateScrollbox,
        unmount: unmountScrollbox,
        controllers: ["next", "previous", "goto"]
      });
    }
    function destroy() {
      var _iterator = _createForOfIteratorHelper(scrollboxes.keys()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var element = _step.value;
          unmountScrollbox(element);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
    }
    function mountScrollbox(element) {
      if (scrollboxes.has(element)) return;
      var previous2 = properties.map(function(name) {
        return {
          value: element.style.getPropertyValue(name),
          priority: element.style.getPropertyPriority(name)
        };
      });
      var elastic = {
        wrapper: null,
        baseTransform: "",
        baseOrigin: "",
        previousTransform: null,
        previousOrigin: null,
        previousMinWidth: null,
        previousMinHeight: null,
        extentX: false,
        extentY: false,
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
        wrapper: null,
        initialized: false,
        invalidReported: false,
        pending: null,
        index: 0,
        wheelTarget: null,
        scrollEndTimeout: null,
        wheelTimeout: null
      };
      var inlineWrapper = {
        element: null,
        previousDisplay: null,
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
        pdsVisible: false,
        hideTimeout: null
      };
      var state = {
        element: element,
        previous: previous2,
        metrics: null,
        mode: null,
        desktop: false,
        cursor: {
          value: element.style.getPropertyValue("cursor"),
          priority: element.style.getPropertyPriority("cursor"),
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
        publishPending: false,
        publishDirty: false,
        layoutRevision: 0,
        lastResizeTime: -RESIZE_INTERVAL_MS,
        resizeTimeout: null,
        disposed: false
      };
      state.onScroll = function() {
        publish(state);
        if (state.snapEnabled && !("onscrollend" in element)) scheduleScrollEnd(state);
      };
      state.onScrollEnd = function() {
        return finishNativeScroll(state);
      };
      state.onWheel = function(event) {
        return handleWheel(state, event);
      };
      state.onClick = function(event) {
        return handleSnapClick(state, event);
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
      state.onScrollbarPointerEnter = function(event) {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", true);
      };
      state.onScrollbarPointerLeave = function(event) {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", false);
      };
      state.onScrollbarMouseEnter = function() {
        return setScrollbarHover(state, "mouseHover", true);
      };
      state.onScrollbarMouseLeave = function() {
        return setScrollbarHover(state, "mouseHover", false);
      };
      state.onScrollbarOutsideDown = function(event) {
        if (!element.contains(event.target)) {
          scrollbar.pointerHover = false;
          scrollbar.mouseHover = false;
          if (!element.classList.contains(pointerScrollingClass)) clearScrollbarPdsVisibility(state);
          syncScrollbarVisibility(state);
        }
      };
      scrollboxes.set(element, state);
      element.addEventListener("scroll", state.onScroll, {
        passive: true
      });
      element.addEventListener("scrollend", state.onScrollEnd, {
        passive: true
      });
      element.addEventListener("click", state.onClick);
      observe(state);
      configure(state);
    }
    function updateScrollbox(element) {
      var state = scrollboxes.get(element);
      if (state) configure(state);
    }
    function unmountScrollbox(element) {
      var state = scrollboxes.get(element);
      if (!state) return;
      state.disposed = true;
      if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) endPointerScroll(activePointerScrollState);
      endPointerScroll(state);
      stopPointerScrollMouseEvents(state);
      restorePointerScrollCursor(state);
      cancelMomentum(state);
      state.snap.pending = null;
      clearScrollEnd(state);
      clearSnapWheel(state);
      resetElastic(state);
      restoreInlineWrapper(state);
      resetScrollbars(state);
      element.removeEventListener("scroll", state.onScroll);
      element.removeEventListener("scrollend", state.onScrollEnd);
      element.removeEventListener("click", state.onClick);
      if (state.wheelListening) element.removeEventListener("wheel", state.onWheel, true);
      if (state.pointerListening) {
        element.removeEventListener("pointerdown", state.onPointerDown);
        element.removeEventListener("pointerover", state.onPointerOver);
        element.removeEventListener("pointerout", state.onPointerOut);
        element.removeEventListener("mousedown", state.onMouseDown);
      }
      if (state.touchListening) removeTouchListeners(state);
      if (state.resizeObserver) state.resizeObserver.disconnect();
      if (state.mutationObserver) state.mutationObserver.disconnect();
      if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
      root.removeEventListener("resize", state.onResize);
      properties.forEach(function(name, index) {
        var original = state.previous[index];
        if (original.value) element.style.setProperty(name, original.value, original.priority);
        else element.style.removeProperty(name);
      });
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
        element.addEventListener("wheel", state.onWheel, {
          passive: false,
          capture: true
        });
        state.wheelListening = true;
      } else if (!state.desktop && !state.elasticEnabled && !state.snapEnabled && state.wheelListening) {
        element.removeEventListener("wheel", state.onWheel, true);
        state.wheelListening = false;
      }
      if (state.elasticEnabled && !state.touchListening) addTouchListeners(state);
      else if (!state.elasticEnabled && state.touchListening) removeTouchListeners(state);
      if (!state.elasticEnabled) resetElastic(state);
      var pointerEnabled = state.desktop && state.mode === "pointer";
      if (!pointerEnabled || !state.momentumEnabled) cancelMomentum(state);
      if (pointerEnabled && !state.pointerListening) {
        element.addEventListener("pointerdown", state.onPointerDown);
        element.addEventListener("pointerover", state.onPointerOver);
        element.addEventListener("pointerout", state.onPointerOut);
        element.addEventListener("mousedown", state.onMouseDown);
        state.pointerListening = true;
      } else if (!pointerEnabled && state.pointerListening) {
        if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) endPointerScroll(activePointerScrollState);
        element.removeEventListener("pointerdown", state.onPointerDown);
        element.removeEventListener("pointerover", state.onPointerOver);
        element.removeEventListener("pointerout", state.onPointerOut);
        element.removeEventListener("mousedown", state.onMouseDown);
        state.pointerListening = false;
        endPointerScroll(state);
        state.lastPointerDown = null;
        restorePointerScrollCursor(state);
      }
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
      var _iterator2 = _createForOfIteratorHelper(tokens), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var token = _step2.value;
          var short = token.replace(/horizontal/g, "h").replace(/vertical/g, "v");
          if (!/^[vhxy]+$/.test(short)) continue;
          if (/[hx]/.test(short)) axes.x = true;
          if (/[vy]/.test(short)) axes.y = true;
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      return axes;
    }
    function configureScrollbars(state) {
      var element = state.element;
      var axes = scrollbarAxes(element.getAttribute(scrollbarAttribute));
      configureScrollbarAxis(state, "y", axes.y, scrollbarVerticalAttribute);
      configureScrollbarAxis(state, "x", axes.x, scrollbarHorizontalAttribute);
      var enabled = axes.x || axes.y;
      var scrollbar = state.scrollbar;
      if (enabled && !scrollbar.listening) {
        scrollbar.hideOwned = !element.classList.contains(nativeScrollbarHideClass);
        if (scrollbar.hideOwned) element.classList.add(nativeScrollbarHideClass);
        scrollbar.mouseHover = element.matches(":hover") && !!(root.matchMedia && root.matchMedia("(any-hover: hover)").matches);
        element.addEventListener("pointerenter", state.onScrollbarPointerEnter);
        element.addEventListener("pointerleave", state.onScrollbarPointerLeave);
        element.addEventListener("mouseenter", state.onScrollbarMouseEnter);
        element.addEventListener("mouseleave", state.onScrollbarMouseLeave);
        root.document.addEventListener("pointerdown", state.onScrollbarOutsideDown, true);
        scrollbar.listening = true;
        syncScrollbarVisibility(state);
      } else if (!enabled && scrollbar.listening) {
        element.removeEventListener("pointerenter", state.onScrollbarPointerEnter);
        element.removeEventListener("pointerleave", state.onScrollbarPointerLeave);
        element.removeEventListener("mouseenter", state.onScrollbarMouseEnter);
        element.removeEventListener("mouseleave", state.onScrollbarMouseLeave);
        root.document.removeEventListener("pointerdown", state.onScrollbarOutsideDown, true);
        if (scrollbar.hideOwned) element.classList.remove(nativeScrollbarHideClass);
        scrollbar.hideOwned = false;
        scrollbar.listening = false;
        clearScrollbarPdsVisibility(state);
        scrollbar.pointerHover = false;
        scrollbar.mouseHover = false;
        syncScrollbarVisibility(state);
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
      var previous2 = scrollbarProperties.map(function(name) {
        return {
          name: name,
          value: element.style.getPropertyValue(name),
          priority: element.style.getPropertyPriority(name)
        };
      });
      var record = {
        element: element,
        owned: owned,
        previous: previous2,
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
      element.addEventListener("pointerdown", record.onPointerDown);
      element.addEventListener("pointermove", record.onPointerMove);
      element.addEventListener("pointerup", record.onPointerEnd);
      element.addEventListener("pointercancel", record.onPointerEnd);
      scrollbar[axis] = record;
    }
    function resetScrollbarAxis(state, axis) {
      var record = state.scrollbar[axis];
      if (!record) return;
      endScrollbarDrag(state, record);
      var element = record.element;
      element.removeEventListener("pointerdown", record.onPointerDown);
      element.removeEventListener("pointermove", record.onPointerMove);
      element.removeEventListener("pointerup", record.onPointerEnd);
      element.removeEventListener("pointercancel", record.onPointerEnd);
      if (record.owned) element.remove();
      else {
        var _iterator3 = _createForOfIteratorHelper(record.previous), _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
            var original = _step3.value;
            if (original.value) element.style.setProperty(original.name, original.value, original.priority);
            else element.style.removeProperty(original.name);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }
      state.scrollbar[axis] = null;
    }
    function resetScrollbars(state) {
      resetScrollbarAxis(state, "x");
      resetScrollbarAxis(state, "y");
      var scrollbar = state.scrollbar;
      if (scrollbar.listening) {
        state.element.removeEventListener("pointerenter", state.onScrollbarPointerEnter);
        state.element.removeEventListener("pointerleave", state.onScrollbarPointerLeave);
        state.element.removeEventListener("mouseenter", state.onScrollbarMouseEnter);
        state.element.removeEventListener("mouseleave", state.onScrollbarMouseLeave);
        root.document.removeEventListener("pointerdown", state.onScrollbarOutsideDown, true);
        scrollbar.listening = false;
      }
      if (scrollbar.hideOwned) state.element.classList.remove(nativeScrollbarHideClass);
      scrollbar.hideOwned = false;
      clearScrollbarPdsVisibility(state);
      scrollbar.pointerHover = false;
      scrollbar.mouseHover = false;
      syncScrollbarVisibility(state);
    }
    function setScrollbarHover(state, name, active) {
      state.scrollbar[name] = active;
      syncScrollbarVisibility(state);
    }
    function syncScrollbarVisibility(state) {
      var scrollbar = state.scrollbar;
      if (scrollbar.listening && (scrollbar.pointerHover || scrollbar.mouseHover || scrollbar.drag || scrollbar.pdsVisible)) showScrollbars(state);
      else hideScrollbars(state);
    }
    function clearScrollbarPdsVisibility(state) {
      var scrollbar = state.scrollbar;
      if (scrollbar.hideTimeout !== null) root.clearTimeout(scrollbar.hideTimeout);
      scrollbar.hideTimeout = null;
      scrollbar.pdsVisible = false;
    }
    function startScrollbarPdsVisibility(state) {
      if (!state.scrollbar.listening) return;
      clearScrollbarPdsVisibility(state);
      state.scrollbar.pdsVisible = true;
      syncScrollbarVisibility(state);
    }
    function scheduleScrollbarPdsHide(state) {
      if (!state.scrollbar.listening || state.disposed) return;
      clearScrollbarPdsVisibility(state);
      state.scrollbar.pdsVisible = true;
      syncScrollbarVisibility(state);
      state.scrollbar.hideTimeout = root.setTimeout(function() {
        state.scrollbar.hideTimeout = null;
        state.scrollbar.pdsVisible = false;
        syncScrollbarVisibility(state);
      }, SCROLLBAR_PDS_HIDE_DELAY_MS);
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
      var _iterator4 = _createForOfIteratorHelper(values), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var _step4$value = _step4.value, record = _step4$value.record, x = _step4$value.x, y = _step4$value.y, trackSize = _step4$value.trackSize, thumbSize = _step4$value.thumbSize, thumbPosition = _step4$value.thumbPosition, max = _step4$value.max, display = _step4$value.display;
          if (state.scrollbar[record.axis] !== record) continue;
          var style = record.element.style;
          if (record.x !== x) style.setProperty("--ae-scrollbar-x", "".concat(x, "px"));
          if (record.y !== y) style.setProperty("--ae-scrollbar-y", "".concat(y, "px"));
          if (record.trackSize !== trackSize) style.setProperty("--ae-scrollbar-length", "".concat(trackSize, "px"));
          if (record.thumbSize !== thumbSize) style.setProperty("--ae-scrollbar-thumb-size", "".concat(thumbSize, "px"));
          if (record.thumbPosition !== thumbPosition) style.setProperty("--ae-scrollbar-thumb-position", "".concat(thumbPosition, "px"));
          if (record.display !== display) style.setProperty("--ae-scrollbar-display", display);
          record.x = x;
          record.y = y;
          record.trackSize = trackSize;
          record.thumbSize = thumbSize;
          record.thumbPosition = thumbPosition;
          record.max = max;
          record.display = display;
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
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
      if (state.snapEnabled && !state.disposed) scheduleScrollEnd(state);
    }
    function configureSnap(state) {
      var element = state.element;
      var children = contentChildren(element);
      var child = children.length === 1 ? children[0] : null;
      var wrapper = child && child.hasAttribute(snapAttribute) && child.getAttribute(snapAttribute) !== "false" ? child : null;
      if (!wrapper) {
        state.snapEnabled = false;
        state.snap.wrapper = null;
        state.snap.initialized = false;
        state.snap.pending = null;
        state.snap.index = 0;
        state.snap.wheelTarget = null;
        clearScrollEnd(state);
        clearSnapWheel(state);
        var requested = element.hasAttribute(snapAttribute) || children.some(function(item) {
          return item.hasAttribute(snapAttribute) && item.getAttribute(snapAttribute) !== "false";
        });
        if (requested && !state.snap.invalidReported) AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_SCROLLBOX_SNAP_WRAPPER, {
          element: element
        });
        state.snap.invalidReported = requested;
        return;
      }
      state.snap.invalidReported = false;
      if (state.snap.wrapper !== wrapper) {
        state.snap.wrapper = wrapper;
        state.snap.initialized = false;
        state.snap.pending = null;
        state.snap.index = 0;
        state.snap.wheelTarget = null;
        clearSnapWheel(state);
      }
      state.snapEnabled = true;
    }
    function configureInlineWrapper(state) {
      var inline = state.inlineWrapper;
      var wrapper = state.elastic.wrapper || state.snap.wrapper;
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
      if (!inline.owned) {
        inline.previousDisplay = {
          value: wrapper.style.getPropertyValue("display"),
          priority: wrapper.style.getPropertyPriority("display")
        };
      }
      wrapper.style.setProperty("display", replacement, "important");
      inline.owned = true;
    }
    function restoreInlineWrapper(state) {
      var inline = state.inlineWrapper;
      if (inline.owned && inline.element) {
        var _previous = inline.previousDisplay;
        if (_previous.value) inline.element.style.setProperty("display", _previous.value, _previous.priority);
        else inline.element.style.removeProperty("display");
      }
      inline.element = null;
      inline.previousDisplay = null;
      inline.owned = false;
      inline.reportedDisplay = null;
    }
    function snapItems(state) {
      return state.snapEnabled && state.snap.wrapper ? Array.from(state.snap.wrapper.children) : [];
    }
    function snapAxis(state) {
      var metrics = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : nativeMetrics(state.element);
      var axes = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : wheelAxes(state, metrics);
      return axes.x ? "x" : axes.y ? "y" : metrics.maxX > 1 ? "x" : metrics.maxY > 1 ? "y" : "x";
    }
    function snapCenterOffset(state, item, axis) {
      var box = state.element.getBoundingClientRect();
      var target = item.getBoundingClientRect();
      return axis === "x" ? target.left + target.width / 2 - (box.left + state.element.clientLeft + state.element.clientWidth / 2) : target.top + target.height / 2 - (box.top + state.element.clientTop + state.element.clientHeight / 2);
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
    function nearestSnapIndex(state, items) {
      var projectionX = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
      var projectionY = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
      var rect = state.element.getBoundingClientRect();
      var centerX = rect.left + state.element.clientLeft + state.element.clientWidth / 2;
      var centerY = rect.top + state.element.clientTop + state.element.clientHeight / 2;
      var nearest = 0, distance = Infinity;
      for (var index = 0; index < items.length; index++) {
        var item = items[index].getBoundingClientRect();
        var dx = item.left + item.width / 2 + projectionX - centerX;
        var dy = item.top + item.height / 2 + projectionY - centerY;
        var candidate = dx * dx + dy * dy;
        if (candidate < distance) {
          nearest = index;
          distance = candidate;
        }
      }
      return nearest;
    }
    function snapNeedsScroll(state, item, axis, metrics) {
      var element = state.element;
      var box = element.getBoundingClientRect();
      var target = item.getBoundingClientRect();
      var dx = target.left + target.width / 2 - (box.left + element.clientLeft + element.clientWidth / 2);
      var dy = target.top + target.height / 2 - (box.top + element.clientTop + element.clientHeight / 2);
      var x = Math.max(0, Math.min(metrics.maxX, element.scrollLeft + dx));
      var y = Math.max(0, Math.min(metrics.maxY, element.scrollTop + dy));
      return axis === "x" ? Math.abs(x - element.scrollLeft) > 0.5 : Math.abs(y - element.scrollTop) > 0.5;
    }
    function snapItemFullyVisible(state, item) {
      var element = state.element;
      var box = element.getBoundingClientRect();
      var target = item.getBoundingClientRect();
      var left = box.left + element.clientLeft;
      var top = box.top + element.clientTop;
      return target.left >= left - 0.5 && target.top >= top - 0.5 && target.right <= left + element.clientWidth + 0.5 && target.bottom <= top + element.clientHeight + 0.5;
    }
    function handleSnapClick(state, event) {
      if (!state.snapEnabled || state.disposed || event.button !== 0 || event.detail !== 1 || event.defaultPrevented) return;
      var item = event.target.nodeType === 1 ? event.target : event.target.parentElement;
      if (!item || item.closest("[".concat(attribute, "]")) !== state.element) return;
      var wrapper = state.snap.wrapper;
      while (item && item.parentElement !== wrapper) item = item.parentElement;
      if (!item || snapItemFullyVisible(state, item)) return;
      scrollToSnap(state, snapItems(state).indexOf(item));
    }
    function scheduleScrollEnd(state) {
      clearScrollEnd(state);
      state.snap.scrollEndTimeout = root.setTimeout(function() {
        state.snap.scrollEndTimeout = null;
        finishNativeScroll(state);
      }, SNAP_SCROLL_IDLE_MS);
    }
    function clearScrollEnd(state) {
      if (state.snap.scrollEndTimeout !== null) root.clearTimeout(state.snap.scrollEndTimeout);
      state.snap.scrollEndTimeout = null;
    }
    function clearSnapWheel(state) {
      if (state.snap.wheelTimeout !== null) root.clearTimeout(state.snap.wheelTimeout);
      state.snap.wheelTimeout = null;
    }
    function scheduleSnapWheelEnd(state) {
      clearSnapWheel(state);
      state.snap.wheelTimeout = root.setTimeout(function() {
        state.snap.wheelTimeout = null;
      }, SNAP_WHEEL_IDLE_MS);
    }
    function finishNativeScroll(state) {
      if (state.disposed || !state.snapEnabled || state.snap.pending || state.momentum || state.scrollbar.drag || activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) return;
      var items = snapItems(state);
      if (!items.length) return;
      var metrics = nativeMetrics(state.element);
      var axis = snapAxis(state, metrics);
      if (state.snap.wheelTarget) {
        var _target = state.snap.wheelTarget;
        if (items.includes(_target) && snapNeedsScroll(state, _target, axis, metrics)) return;
        state.snap.wheelTarget = null;
        if (items.includes(_target)) return;
      }
      var edgeIndex = edgeSnapIndex(state, items, axis, metrics);
      var target = items[edgeIndex === null ? nearestSnapIndex(state, items) : edgeIndex];
      state.snap.index = items.indexOf(target);
      if (!snapNeedsScroll(state, target, axis, metrics)) return;
      if (state.elastic.active) state.snap.pending = target;
      else scrollToSnap(state, items.indexOf(target), axis);
    }
    function initializeSnap(state) {
      var first = snapItems(state)[0];
      if (!first) return;
      state.snap.initialized = true;
      state.snap.index = 0;
      first.scrollIntoView(snapScrollOptions(snapAxis(state), "instant"));
      refresh(state);
    }
    function snapScrollOptions(axis, behavior) {
      var horizontal = axis === "x";
      var options = {
        block: horizontal ? "nearest" : "center",
        inline: horizontal ? "center" : "nearest"
      };
      if (behavior) options.behavior = behavior;
      return options;
    }
    function scrollToSnap(state, index) {
      var axis = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : snapAxis(state);
      var items = snapItems(state);
      if (!items.length || !Number.isInteger(index) || index < 0 || index >= items.length) return false;
      cancelMomentum(state);
      clearScrollEnd(state);
      clearSnapWheel(state);
      state.snap.pending = null;
      state.snap.index = index;
      state.snap.wheelTarget = items[index];
      if (state.elastic.owned) resetElastic(state);
      items[index].scrollIntoView(snapScrollOptions(axis));
      return true;
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
        var computed = root.getComputedStyle(wrapper);
        state.elastic.wrapper = wrapper;
        state.elastic.dimensions = null;
        state.elastic.baseTransform = computed.transform === "none" ? "" : computed.transform;
        state.elastic.baseOrigin = computed.transformOrigin;
        state.elastic.previousTransform = {
          value: wrapper.style.getPropertyValue("transform"),
          priority: wrapper.style.getPropertyPriority("transform")
        };
        state.elastic.previousOrigin = {
          value: wrapper.style.getPropertyValue("transform-origin"),
          priority: wrapper.style.getPropertyPriority("transform-origin")
        };
        state.elastic.previousMinWidth = {
          value: wrapper.style.getPropertyValue("min-width"),
          priority: wrapper.style.getPropertyPriority("min-width")
        };
        state.elastic.previousMinHeight = {
          value: wrapper.style.getPropertyValue("min-height"),
          priority: wrapper.style.getPropertyPriority("min-height")
        };
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
      if (value === "native" || value === "pointer") return value;
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
      var _iterator5 = _createForOfIteratorHelper(element.childNodes), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var node = _step5.value;
          if (node.nodeType !== 3 || !node.textContent.trim()) continue;
          range.selectNodeContents(node);
          var _iterator6 = _createForOfIteratorHelper(range.getClientRects()), _step6;
          try {
            for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
              var rect = _step6.value;
              if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return true;
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      return false;
    }
    function setPointerScrollCursor(state, value) {
      state.element.style.setProperty("cursor", value, "important");
      state.cursor.owned = true;
    }
    function restorePointerScrollCursor(state) {
      if (!state.cursor.owned) return;
      if (state.cursor.value) state.element.style.setProperty("cursor", state.cursor.value, state.cursor.priority);
      else state.element.style.removeProperty("cursor");
      state.cursor.owned = false;
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
      if (!chain.some(function(member2) {
        return axes.get(member2).x || axes.get(member2).y;
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
      var verticalOnly = chain.some(function(member2) {
        return axes.get(member2).y;
      }) && !chain.some(function(member2) {
        return axes.get(member2).x;
      });
      if (!textOrigin && event.cancelable) event.preventDefault();
      for (var _i2 = 0, _chain = chain; _i2 < _chain.length; _i2++) {
        var _member = _chain[_i2];
        cancelMomentum(_member);
        _member.snap.pending = null;
        _member.snap.wheelTarget = null;
        if (_member.elastic.owned) {
          resetElastic(_member);
          refresh(_member);
        }
      }
      if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
      state.mouseReleaseTimeout = null;
      state.mouseReleaseButton = null;
      state.pointerScroll = {
        pointerId: event.pointerId,
        button: event.button,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
        axis: null,
        chain: chain,
        axes: axes,
        styles: [],
        momentumState: null,
        momentumStartX: 0,
        momentumStartY: 0,
        elasticForce: 0,
        startTime: time,
        endTime: null,
        snapStarts: new Map(chain.filter(function(member2) {
          return member2.snapEnabled;
        }).map(function(member2) {
          var items = snapItems(member2);
          var item = items[member2.snap.index] || null;
          var axis = snapAxis(member2, member2.metrics, axes.get(member2));
          return [member2, item ? {
            item: item,
            offset: snapCenterOffset(member2, item, axis)
          } : null];
        })),
        selectionAtDown: selectionAtDown,
        verticalOnly: verticalOnly,
        selectionReadyTime: textOrigin ? time + TEXT_SELECTION_WAIT_MS : 0,
        selectionWaitTimeout: null,
        pendingMove: null,
        momentumStartTime: time
      };
      activePointerScrollState = state;
      root.addEventListener("pointermove", state.onPointerMove, {
        passive: false,
        capture: true
      });
      root.addEventListener("touchmove", state.onPointerScrollTouchMove, {
        passive: false,
        capture: true
      });
      var _iterator7 = _createForOfIteratorHelper(pointerScrollDragEvents), _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
          var name = _step7.value;
          root.addEventListener(name, state.onPointerScrollNativeEvent, true);
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      root.addEventListener("selectstart", state.onPointerScrollNativeEvent, true);
      var _iterator8 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
          var _name = _step8.value;
          root.addEventListener(_name, state.onMouseEvent, {
            passive: false,
            capture: true
          });
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
      root.addEventListener("pointerup", state.onPointerEnd, true);
      root.addEventListener("pointercancel", state.onPointerEnd, true);
      root.addEventListener("blur", state.onBlur);
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
        if (!pointerScroll.chain.some(function(member2) {
          return pointerAxisMaximum(member2, _axis, pointerScroll) > 0;
        })) {
          endPointerScroll(state);
          return;
        }
        activatePointerScroll(state, pointerScroll, _axis);
      }
      var axis = pointerScroll.axis;
      var remaining = axis === "x" ? pointerScroll.lastX - event.clientX : pointerScroll.lastY - event.clientY;
      pointerScroll.lastX = event.clientX;
      pointerScroll.lastY = event.clientY;
      if (event.cancelable) event.preventDefault();
      if (!remaining) return;
      var outermost = null;
      var _iterator9 = _createForOfIteratorHelper(pointerScroll.chain), _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
          var member = _step9.value;
          if (!member.disposed && member.pointerListening && pointerAxisMaximum(member, axis, pointerScroll) > 0) outermost = member;
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      if (outermost && outermost.elasticEnabled && pointerScroll.elasticForce) {
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
      var _iterator0 = _createForOfIteratorHelper(pointerScroll.chain), _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done; ) {
          var _member2 = _step0.value;
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
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      if (outermost && outermost.elasticEnabled) {
        pointerScroll.elasticForce += remaining;
        var element = outermost.element;
        var desiredX = element.scrollLeft + (axis === "x" ? pointerScroll.elasticForce : 0);
        var desiredY = element.scrollTop + (axis === "y" ? pointerScroll.elasticForce : 0);
        applyElasticFromDesired(outermost, desiredX, desiredY, false);
        scrollWithinElasticBounds(outermost, desiredX, desiredY);
        publish(outermost);
      }
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
    function activatePointerScroll(state, pointerScroll, axis) {
      pointerScroll.axis = axis;
      pointerScroll.moved = true;
      restorePointerScrollCursor(state);
      var _iterator1 = _createForOfIteratorHelper(pointerScroll.chain), _step1;
      try {
        for (_iterator1.s(); !(_step1 = _iterator1.n()).done; ) {
          var member = _step1.value;
          if (pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
          var element = member.element;
          pointerScroll.styles.push({
            element: element,
            classOwned: !element.classList.contains(pointerScrollingClass),
            scrollBehavior: element.style.getPropertyValue("scroll-behavior"),
            scrollBehaviorPriority: element.style.getPropertyPriority("scroll-behavior")
          });
          element.style.setProperty("scroll-behavior", "auto", "important");
          element.classList.add(pointerScrollingClass);
          startScrollbarPdsVisibility(member);
        }
      } catch (err) {
        _iterator1.e(err);
      } finally {
        _iterator1.f();
      }
    }
    function endPointerScroll(state, event) {
      var pointerScroll = state.pointerScroll;
      if (!pointerScroll || event && event.pointerId !== pointerScroll.pointerId) return;
      pointerScroll.endTime = now();
      if (event && event.type === "pointerup" && !pointerScroll.moved && pointerScroll.endTime < pointerScroll.selectionReadyTime && !selectionHasChanged(pointerScroll.selectionAtDown)) {
        var dx = pointerScroll.startX - event.clientX;
        var dy = pointerScroll.startY - event.clientY;
        var axis = pointerScroll.axis || (Math.abs(dx) >= Math.abs(dy) ? "x" : "y");
        pointerScroll.lastX = event.clientX;
        pointerScroll.lastY = event.clientY;
        if (pointerScroll.chain.some(function(member2) {
          return member2.snapEnabled && snapAxis(member2, member2.metrics, pointerScroll.axes.get(member2)) === axis && pointerAxisMaximum(member2, axis, pointerScroll) > 0;
        }) && isSnapFlick(pointerScroll, axis)) {
          pointerScroll.axis = axis;
          pointerScroll.moved = true;
        }
      }
      state.pointerScroll = null;
      if (activePointerScrollState === state) activePointerScrollState = null;
      if (pointerScroll.selectionWaitTimeout !== null) root.clearTimeout(pointerScroll.selectionWaitTimeout);
      root.removeEventListener("pointermove", state.onPointerMove, true);
      root.removeEventListener("touchmove", state.onPointerScrollTouchMove, true);
      var _iterator10 = _createForOfIteratorHelper(pointerScrollDragEvents), _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
          var name = _step10.value;
          root.removeEventListener(name, state.onPointerScrollNativeEvent, true);
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
      root.removeEventListener("selectstart", state.onPointerScrollNativeEvent, true);
      root.removeEventListener("pointerup", state.onPointerEnd, true);
      root.removeEventListener("pointercancel", state.onPointerEnd, true);
      root.removeEventListener("blur", state.onBlur);
      if (pointerScroll.moved && !state.disposed) {
        state.mouseReleaseButton = pointerScroll.button;
        if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
        state.mouseReleaseTimeout = root.setTimeout(function() {
          return stopPointerScrollMouseEvents(state);
        }, 0);
      } else {
        stopPointerScrollMouseEvents(state);
      }
      var _iterator11 = _createForOfIteratorHelper(pointerScroll.styles), _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
          var saved = _step11.value;
          if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
          if (saved.scrollBehavior) saved.element.style.setProperty("scroll-behavior", saved.scrollBehavior, saved.scrollBehaviorPriority);
          else saved.element.style.removeProperty("scroll-behavior");
          var member = scrollboxes.get(saved.element);
          if (member) scheduleScrollbarPdsHide(member);
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      if (event && event.type === "pointerup" && state.pointerListening) {
        updatePointerScrollCursor(state, document.elementFromPoint(event.clientX, event.clientY), event.clientX, event.clientY);
      } else restorePointerScrollCursor(state);
      var hadElastic = pointerScroll.chain.some(function(member2) {
        return member2.elastic.active;
      });
      var momentumState = pointerScroll.momentumState;
      var snapState = momentumState ? momentumState.snapEnabled ? momentumState : null : pointerScroll.chain.find(function(member2) {
        return member2.snapEnabled && pointerAxisMaximum(member2, pointerScroll.axis, pointerScroll) > 0;
      });
      var shouldSnap = event && event.type === "pointerup" && pointerScroll.moved && snapState && !snapState.disposed && snapItems(snapState).length;
      if (shouldSnap) schedulePointerSnap(snapState, pointerScroll);
      var _iterator12 = _createForOfIteratorHelper(pointerScroll.chain), _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done; ) {
          var _member3 = _step12.value;
          releaseElastic(_member3);
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
      if (!shouldSnap && event && event.type === "pointerup" && pointerScroll.moved && momentumState && momentumState.momentumEnabled && !hadElastic && !momentumState.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(momentumState, pointerScroll);
      }
    }
    function schedulePointerSnap(state, pointerScroll) {
      var items = snapItems(state);
      var metrics = nativeMetrics(state.element);
      var axis = snapAxis(state, metrics);
      var edgeIndex = edgeSnapIndex(state, items, axis, metrics);
      var start = pointerScroll.snapStarts.get(state);
      var startIndex = start ? items.indexOf(start.item) : -1;
      var projection = axis === pointerScroll.axis ? axis === "x" ? pointerScroll.lastX - pointerScroll.startX : pointerScroll.lastY - pointerScroll.startY : 0;
      var index = edgeIndex === null ? nearestSnapIndex(state, items, axis === "x" ? projection : 0, axis === "y" ? projection : 0) : edgeIndex;
      if (edgeIndex === null && index === startIndex && axis === pointerScroll.axis && start) {
        var flick = isSnapFlick(pointerScroll, axis);
        var distance = axis === "x" ? pointerScroll.startX - pointerScroll.lastX : pointerScroll.startY - pointerScroll.lastY;
        var offset = snapCenterOffset(state, start.item, axis);
        var size = axis === "x" ? state.element.clientWidth : state.element.clientHeight;
        var movedAway = Math.abs(offset) - Math.abs(start.offset) >= size * SNAP_DRAG_DISTANCE_RATIO;
        if (flick || movedAway) {
          var direction = flick ? Math.sign(distance) : Math.sign(start.offset - offset);
          index = Math.max(0, Math.min(items.length - 1, index + direction));
        }
      }
      state.snap.pending = items[index];
      flushPendingSnap(state);
    }
    function isSnapFlick(pointerScroll, axis) {
      var distance = axis === "x" ? pointerScroll.startX - pointerScroll.lastX : pointerScroll.startY - pointerScroll.lastY;
      var elapsed = Math.max(1, pointerScroll.endTime - pointerScroll.startTime);
      return elapsed <= SNAP_FLICK_WINDOW_MS && Math.abs(distance) > SNAP_FLICK_MIN_DISTANCE_PX && Math.abs(distance) < SNAP_FLICK_MAX_DISTANCE_PX && (elapsed <= SNAP_FLICK_FAST_TIME_MS || Math.abs(distance) / elapsed >= SNAP_SWIPE_SPEED_PX_MS);
    }
    function flushPendingSnap(state) {
      var target = state.snap.pending;
      if (!target || state.elastic.active || state.disposed) return;
      state.snap.pending = null;
      var index = snapItems(state).indexOf(target);
      if (index >= 0) scrollToSnap(state, index);
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
      var _iterator13 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step13;
      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done; ) {
          var name = _step13.value;
          root.removeEventListener(name, state.onMouseEvent, true);
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
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
      var element = state.element;
      element.addEventListener("touchstart", state.onTouchStart, {
        passive: true
      });
      element.addEventListener("touchmove", state.onTouchMove, {
        passive: false
      });
      element.addEventListener("touchend", state.onTouchEnd, {
        passive: true
      });
      element.addEventListener("touchcancel", state.onTouchEnd, {
        passive: true
      });
      state.touchListening = true;
    }
    function removeTouchListeners(state) {
      var element = state.element;
      element.removeEventListener("touchstart", state.onTouchStart);
      element.removeEventListener("touchmove", state.onTouchMove);
      element.removeEventListener("touchend", state.onTouchEnd);
      element.removeEventListener("touchcancel", state.onTouchEnd);
      state.touchListening = false;
      state.elastic.touch = null;
    }
    function startTouch(state, event) {
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
      var _iterator14 = _createForOfIteratorHelper(event.touches), _step14;
      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done; ) {
          var item = _step14.value;
          if (item.identifier === start.identifier) {
            touch = item;
            break;
          }
        }
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
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
      var _iterator15 = _createForOfIteratorHelper(event.touches), _step15;
      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done; ) {
          var item = _step15.value;
          if (item.identifier === touch.identifier) return;
        }
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }
      state.elastic.touch = null;
      releaseElastic(state);
    }
    function applyElasticFromDesired(state, desiredX, desiredY, additive) {
      var axis = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : null;
      if (!state.elasticEnabled) return false;
      var element = state.element;
      var metrics = state.metrics || nativeMetrics(element);
      var elastic = state.elastic;
      var amounts = [0, 0, 0, 0];
      if (axis !== "x" && metrics.maxY > 1) {
        var limitY = elasticLimit(element.clientHeight, elastic.limits[0]);
        if (desiredY < 0) amounts[0] = elasticResistance(-desiredY, additive ? elastic.amounts[0] : 0, limitY);
        else if (desiredY > metrics.maxY) amounts[2] = elasticResistance(desiredY - metrics.maxY, additive ? elastic.amounts[2] : 0, limitY);
      }
      if (axis !== "y" && metrics.maxX > 1) {
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
      if (amounts[1] > 0 && !elastic.extentX) {
        elastic.wrapper.style.setProperty("min-width", "".concat(Math.max(dimensions.offsetWidth, dimensions.scrollWidth), "px"), elastic.previousMinWidth.priority);
        elastic.extentX = true;
      }
      if (amounts[2] > 0 && !elastic.extentY) {
        elastic.wrapper.style.setProperty("min-height", "".concat(Math.max(dimensions.offsetHeight, dimensions.scrollHeight), "px"), elastic.previousMinHeight.priority);
        elastic.extentY = true;
      }
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
        wrapper.style.setProperty("transform-origin", "".concat(originX, " ").concat(originY), elastic.previousOrigin.priority);
      }
      wrapper.style.setProperty("transform", [scale, translate, elastic.baseTransform].filter(Boolean).join(" ") || "none", elastic.previousTransform.priority);
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
      if (root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
      elastic.releaseFrame = root.requestAnimationFrame(function() {
        return stepElasticRelease(state);
      });
    }
    function resetElastic(state) {
      var elastic = state.elastic;
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.releaseFrame = null;
      elastic.wheelTimeout = null;
      if (elastic.wrapper) elastic.wrapper.classList.remove(elasticReleaseClass);
      if (elastic.owned && elastic.wrapper) {
        var _previous2 = elastic.previousTransform;
        if (_previous2.value) elastic.wrapper.style.setProperty("transform", _previous2.value, _previous2.priority);
        else elastic.wrapper.style.removeProperty("transform");
        var previousOrigin = elastic.previousOrigin;
        if (previousOrigin.value) elastic.wrapper.style.setProperty("transform-origin", previousOrigin.value, previousOrigin.priority);
        else elastic.wrapper.style.removeProperty("transform-origin");
        if (elastic.extentX) {
          var previousMinWidth = elastic.previousMinWidth;
          if (previousMinWidth.value) elastic.wrapper.style.setProperty("min-width", previousMinWidth.value, previousMinWidth.priority);
          else elastic.wrapper.style.removeProperty("min-width");
        }
        if (elastic.extentY) {
          var previousMinHeight = elastic.previousMinHeight;
          if (previousMinHeight.value) elastic.wrapper.style.setProperty("min-height", previousMinHeight.value, previousMinHeight.priority);
          else elastic.wrapper.style.removeProperty("min-height");
        }
      }
      elastic.amounts = [0, 0, 0, 0];
      elastic.active = false;
      elastic.owned = false;
      elastic.extentX = false;
      elastic.extentY = false;
    }
    function observe(state) {
      state.onResize = function() {
        return scheduleResize(state);
      };
      root.addEventListener("resize", state.onResize, {
        passive: true
      });
      if (root.ResizeObserver) {
        state.resizeObserver = new root.ResizeObserver(function() {
          return scheduleResize(state);
        });
        state.resizeObserver.observe(state.element);
        var _iterator16 = _createForOfIteratorHelper(state.element.children), _step16;
        try {
          for (_iterator16.s(); !(_step16 = _iterator16.n()).done; ) {
            var child = _step16.value;
            state.resizeObserver.observe(child);
          }
        } catch (err) {
          _iterator16.e(err);
        } finally {
          _iterator16.f();
        }
      }
      if (root.MutationObserver) {
        state.mutationObserver = new root.MutationObserver(function(records) {
          if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver.observe(state.element);
            var _iterator17 = _createForOfIteratorHelper(state.element.children), _step17;
            try {
              for (_iterator17.s(); !(_step17 = _iterator17.n()).done; ) {
                var _child = _step17.value;
                state.resizeObserver.observe(_child);
              }
            } catch (err) {
              _iterator17.e(err);
            } finally {
              _iterator17.f();
            }
          }
          if (records.some(function(record) {
            return record.target === state.element;
          })) configure(state);
          else refresh(state);
        });
        state.mutationObserver.observe(state.element, {
          childList: true,
          subtree: true,
          characterData: true
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
      return {
        x: metrics.maxX > 1 && available(style.overflowX),
        y: metrics.maxY > 1 && available(style.overflowY)
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
        if (!state.elastic.active) state.metrics = metrics;
        if (state.elasticEnabled && state.elastic.wrapper && !state.elastic.active) state.elastic.dimensions = measureElasticWrapper(state.elastic.wrapper);
        var bars = state.scrollbar.x || state.scrollbar.y;
        var axes = state.snapEnabled || bars ? wheelAxes(state, metrics) : null;
        return {
          revision: state.layoutRevision,
          y: progress(state.element.scrollTop, metrics.maxY),
          x: progress(state.element.scrollLeft, metrics.maxX),
          snapValues: state.snapEnabled ? measureSnapValues(state, metrics, axes) : [],
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
          var _iterator18 = _createForOfIteratorHelper(values.snapValues), _step18;
          try {
            for (_iterator18.s(); !(_step18 = _iterator18.n()).done; ) {
              var _step18$value = _step18.value, item = _step18$value.item, viewport = _step18$value.viewport, focus = _step18$value.focus;
              item.style.setProperty(snapProperties[0], viewport);
              item.style.setProperty(snapProperties[1], focus);
            }
          } catch (err) {
            _iterator18.e(err);
          } finally {
            _iterator18.f();
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
    function measureSnapValues(state, metrics, axes) {
      var element = state.element;
      var rect = element.getBoundingClientRect();
      var axis = snapAxis(state, metrics, axes);
      var size = axis === "x" ? element.clientWidth : element.clientHeight;
      if (!size) return [];
      var center = axis === "x" ? rect.left + element.clientLeft + size / 2 : rect.top + element.clientTop + size / 2;
      return snapItems(state).map(function(item) {
        var box = item.getBoundingClientRect();
        var itemCenter = axis === "x" ? box.left + box.width / 2 : box.top + box.height / 2;
        var viewport = Math.max(-2, Math.min(2, (itemCenter - center) * 2 / size));
        var focus = Math.max(0, 1 - Math.abs(viewport) / 2);
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
    function handleSnapWheel(state, event, deltaX, deltaY, axes) {
      var items = snapItems(state);
      if (!items.length) return false;
      var hasX = axes.x, hasY = axes.y;
      if (!hasX && !hasY) return false;
      var axis = hasX && hasY ? Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y" : hasX ? "x" : "y";
      var delta = axis === "x" ? deltaX : deltaY;
      if (!delta) return false;
      if (state.snap.wheelTimeout !== null) {
        if (event.cancelable) event.preventDefault();
        scheduleSnapWheelEnd(state);
        return true;
      }
      var index = Math.max(0, Math.min(items.length - 1, state.snap.index));
      var destination = Math.max(0, Math.min(items.length - 1, index + Math.sign(delta)));
      if (destination === index) {
        if (state.elasticEnabled) {
          var desiredX = state.element.scrollLeft + (axis === "x" ? delta : 0);
          var desiredY = state.element.scrollTop + (axis === "y" ? delta : 0);
          if (applyElasticFromDesired(state, desiredX, desiredY, true, axis)) {
            scrollWithinElasticBounds(state, desiredX, desiredY);
            publish(state);
            if (state.elastic.wheelTimeout !== null) root.clearTimeout(state.elastic.wheelTimeout);
            state.elastic.wheelTimeout = root.setTimeout(function() {
              return releaseElastic(state);
            }, ELASTIC_WHEEL_IDLE_MS);
          }
        }
        return true;
      }
      if (event.cancelable) event.preventDefault();
      scrollToSnap(state, destination);
      state.snap.wheelTarget = items[destination];
      scheduleSnapWheelEnd(state);
      return true;
    }
    function handleWheel(state, event) {
      state.snap.pending = null;
      if (state.desktop && state.mode === "pointer" && state.element.classList.contains(pointerScrollingClass)) {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        return;
      }
      cancelMomentum(state);
      if (event.defaultPrevented || event.ctrlKey) return;
      if (event.target.closest("[".concat(attribute, "]")) !== state.element) return;
      var metrics = nativeMetrics(state.element);
      if (!metrics) return;
      var axes = wheelAxes(state, metrics);
      var factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
      var converted = state.desktop && state.wheelEnabled && axes.x && !axes.y && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
      var deltaX = (converted ? event.deltaY : event.deltaX) * factor;
      var deltaY = (converted ? 0 : event.deltaY) * factor;
      if (state.snapEnabled && handleSnapWheel(state, event, deltaX, deltaY, axes)) return;
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
          event.preventDefault();
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
