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
    var elasticReleaseClass = AelluxJs.className("scrollbox-elastic-release");
    var pointerScrollingClass = AelluxJs.className("pointerscrolling");
    var pointerScrollExceptionSelector = "a, button, input, select, textarea, [contenteditable], [draggable='true']";
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
        resizeObserver: null,
        mutationObserver: null,
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
      state.mode = readMode(element);
      state.wheelEnabled = element.getAttribute(wheelAttribute) !== "false";
      state.momentumEnabled = element.getAttribute(momentumAttribute) !== "false";
      configureElastic(state);
      configureSnap(state);
      configureInlineWrapper(state);
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
    function configureSnap(state) {
      var element = state.element;
      var child = element.children.length === 1 ? element.children[0] : null;
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
        var requested = element.hasAttribute(snapAttribute) || Array.from(element.children).some(function(item) {
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
      var metrics = nativeMetrics(state.element);
      return metrics.maxX > 1 ? "x" : metrics.maxY > 1 ? "y" : "x";
    }
    function snapCenterOffset(state, item, axis) {
      var box = state.element.getBoundingClientRect();
      var target = item.getBoundingClientRect();
      return axis === "x" ? target.left + target.width / 2 - (box.left + state.element.clientLeft + state.element.clientWidth / 2) : target.top + target.height / 2 - (box.top + state.element.clientTop + state.element.clientHeight / 2);
    }
    function edgeSnapIndex(state, items) {
      var element = state.element;
      var metrics = nativeMetrics(element);
      var horizontal = metrics.maxX > 1 || metrics.maxY <= 1;
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
    function snapNeedsScroll(state, item) {
      var element = state.element;
      var metrics = nativeMetrics(element);
      var box = element.getBoundingClientRect();
      var target = item.getBoundingClientRect();
      var dx = target.left + target.width / 2 - (box.left + element.clientLeft + element.clientWidth / 2);
      var dy = target.top + target.height / 2 - (box.top + element.clientTop + element.clientHeight / 2);
      var x = Math.max(0, Math.min(metrics.maxX, element.scrollLeft + dx));
      var y = Math.max(0, Math.min(metrics.maxY, element.scrollTop + dy));
      return Math.abs(x - element.scrollLeft) > 0.5 || Math.abs(y - element.scrollTop) > 0.5;
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
      if (state.disposed || !state.snapEnabled || state.snap.pending || state.momentum || activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) return;
      var items = snapItems(state);
      if (!items.length) return;
      if (state.snap.wheelTarget) {
        var _target = state.snap.wheelTarget;
        if (items.includes(_target) && snapNeedsScroll(state, _target)) return;
        state.snap.wheelTarget = null;
        if (items.includes(_target)) return;
      }
      var edgeIndex = edgeSnapIndex(state, items);
      var target = items[edgeIndex === null ? nearestSnapIndex(state, items) : edgeIndex];
      state.snap.index = items.indexOf(target);
      if (!snapNeedsScroll(state, target)) return;
      if (state.elastic.active) state.snap.pending = target;
      else scrollToSnap(state, items.indexOf(target));
    }
    function initializeSnap(state) {
      var first = snapItems(state)[0];
      if (!first) return;
      state.snap.initialized = true;
      state.snap.index = 0;
      first.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "instant"
      });
      refresh(state);
    }
    function scrollToSnap(state, index) {
      var items = snapItems(state);
      if (!items.length || !Number.isInteger(index) || index < 0 || index >= items.length) return false;
      cancelMomentum(state);
      clearScrollEnd(state);
      clearSnapWheel(state);
      state.snap.pending = null;
      state.snap.index = index;
      state.snap.wheelTarget = items[index];
      if (state.elastic.owned) resetElastic(state);
      items[index].scrollIntoView({
        block: "center",
        inline: "center"
      });
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
      var child = element.children.length === 1 ? element.children[0] : null;
      var wrapper = child && child.hasAttribute(elasticAttribute) && child.getAttribute(elasticAttribute) !== "false" ? child : null;
      if (!wrapper) {
        resetElastic(state);
        state.elasticEnabled = false;
        state.elastic.wrapper = null;
        var requested = element.hasAttribute(elasticAttribute) || Array.from(element.children).some(function(item) {
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
      var _iterator2 = _createForOfIteratorHelper(element.childNodes), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var node = _step2.value;
          if (node.nodeType !== 3 || !node.textContent.trim()) continue;
          range.selectNodeContents(node);
          var _iterator3 = _createForOfIteratorHelper(range.getClientRects()), _step3;
          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
              var rect = _step3.value;
              if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return true;
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
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
      if (activePointerScrollState || state.pointerScroll || event.defaultPrevented || event.button !== 0 || !event.isPrimary || event.pointerType === "touch" || (event.buttons & 1) === 0) return;
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
      if (!chain.some(function(member2) {
        var metrics = nativeMetrics(member2.element);
        return metrics.maxX > 0 || metrics.maxY > 0;
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
        return pointerAxisMaximum(member2, "y") > 0;
      }) && !chain.some(function(member2) {
        return pointerAxisMaximum(member2, "x") > 0;
      });
      if (!textOrigin && event.cancelable) event.preventDefault();
      for (var _i = 0, _chain = chain; _i < _chain.length; _i++) {
        var _member = _chain[_i];
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
          var axis = snapAxis(member2);
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
      var _iterator4 = _createForOfIteratorHelper(pointerScrollDragEvents), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var name = _step4.value;
          root.addEventListener(name, state.onPointerScrollNativeEvent, true);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      root.addEventListener("selectstart", state.onPointerScrollNativeEvent, true);
      var _iterator5 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var _name = _step5.value;
          root.addEventListener(_name, state.onMouseEvent, {
            passive: false,
            capture: true
          });
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
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
          return pointerAxisMaximum(member2, _axis) > 0;
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
      var _iterator6 = _createForOfIteratorHelper(pointerScroll.chain), _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
          var member = _step6.value;
          if (!member.disposed && member.pointerListening && pointerAxisMaximum(member, axis) > 0) outermost = member;
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
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
      var _iterator7 = _createForOfIteratorHelper(pointerScroll.chain), _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
          var _member2 = _step7.value;
          if (_member2.disposed || !_member2.pointerListening || pointerAxisMaximum(_member2, axis) <= 0) continue;
          if (Math.abs(remaining) < 1e-3) continue;
          var _element = _member2.element;
          var previousX = _element.scrollLeft, previousY = _element.scrollTop;
          var current = axis === "x" ? previousX : previousY;
          var desired = Math.max(0, Math.min(pointerAxisMaximum(_member2, axis), current + remaining));
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
        _iterator7.e(err);
      } finally {
        _iterator7.f();
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
      var metrics = state.metrics || nativeMetrics(state.element);
      return axis === "x" ? metrics.maxX : metrics.maxY;
    }
    function activatePointerScroll(state, pointerScroll, axis) {
      pointerScroll.axis = axis;
      pointerScroll.moved = true;
      restorePointerScrollCursor(state);
      var _iterator8 = _createForOfIteratorHelper(pointerScroll.chain), _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
          var member = _step8.value;
          if (pointerAxisMaximum(member, axis) <= 0) continue;
          var element = member.element;
          pointerScroll.styles.push({
            element: element,
            classOwned: !element.classList.contains(pointerScrollingClass),
            userSelect: element.style.getPropertyValue("user-select"),
            userSelectPriority: element.style.getPropertyPriority("user-select"),
            scrollBehavior: element.style.getPropertyValue("scroll-behavior"),
            scrollBehaviorPriority: element.style.getPropertyPriority("scroll-behavior")
          });
          element.style.setProperty("user-select", "none");
          element.style.setProperty("scroll-behavior", "auto", "important");
          element.classList.add(pointerScrollingClass);
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
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
          return member2.snapEnabled && snapAxis(member2) === axis && pointerAxisMaximum(member2, axis) > 0;
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
      var _iterator9 = _createForOfIteratorHelper(pointerScrollDragEvents), _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
          var name = _step9.value;
          root.removeEventListener(name, state.onPointerScrollNativeEvent, true);
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
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
      var _iterator0 = _createForOfIteratorHelper(pointerScroll.styles), _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done; ) {
          var saved = _step0.value;
          if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
          if (saved.userSelect) saved.element.style.setProperty("user-select", saved.userSelect, saved.userSelectPriority);
          else saved.element.style.removeProperty("user-select");
          if (saved.scrollBehavior) saved.element.style.setProperty("scroll-behavior", saved.scrollBehavior, saved.scrollBehaviorPriority);
          else saved.element.style.removeProperty("scroll-behavior");
        }
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      if (event && event.type === "pointerup" && state.pointerListening) {
        updatePointerScrollCursor(state, document.elementFromPoint(event.clientX, event.clientY), event.clientX, event.clientY);
      } else restorePointerScrollCursor(state);
      var hadElastic = pointerScroll.chain.some(function(member2) {
        return member2.elastic.active;
      });
      var momentumState = pointerScroll.momentumState;
      var snapState = momentumState ? momentumState.snapEnabled ? momentumState : null : pointerScroll.chain.find(function(member2) {
        return member2.snapEnabled && pointerAxisMaximum(member2, pointerScroll.axis) > 0;
      });
      var shouldSnap = event && event.type === "pointerup" && pointerScroll.moved && snapState && !snapState.disposed && snapItems(snapState).length;
      if (shouldSnap) schedulePointerSnap(snapState, pointerScroll);
      var _iterator1 = _createForOfIteratorHelper(pointerScroll.chain), _step1;
      try {
        for (_iterator1.s(); !(_step1 = _iterator1.n()).done; ) {
          var member = _step1.value;
          releaseElastic(member);
        }
      } catch (err) {
        _iterator1.e(err);
      } finally {
        _iterator1.f();
      }
      if (!shouldSnap && event && event.type === "pointerup" && pointerScroll.moved && momentumState && momentumState.momentumEnabled && !hadElastic && !momentumState.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(momentumState, pointerScroll);
      }
    }
    function schedulePointerSnap(state, pointerScroll) {
      var items = snapItems(state);
      var axis = snapAxis(state);
      var edgeIndex = edgeSnapIndex(state, items);
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
      var _iterator10 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
          var name = _step10.value;
          root.removeEventListener(name, state.onMouseEvent, true);
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
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
      var _iterator11 = _createForOfIteratorHelper(event.touches), _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
          var item = _step11.value;
          if (item.identifier === start.identifier) {
            touch = item;
            break;
          }
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
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
      var _iterator12 = _createForOfIteratorHelper(event.touches), _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done; ) {
          var item = _step12.value;
          if (item.identifier === touch.identifier) return;
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
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
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      elastic.releaseFrame = null;
      elastic.wrapper.classList.remove(elasticReleaseClass);
      elastic.amounts = amounts;
      elastic.active = active;
      elastic.owned = true;
      if (amounts[1] > 0 && !elastic.extentX) {
        elastic.wrapper.style.setProperty("min-width", "".concat(Math.max(elastic.wrapper.offsetWidth, elastic.wrapper.scrollWidth), "px"), elastic.previousMinWidth.priority);
        elastic.extentX = true;
      }
      if (amounts[2] > 0 && !elastic.extentY) {
        elastic.wrapper.style.setProperty("min-height", "".concat(Math.max(elastic.wrapper.offsetHeight, elastic.wrapper.scrollHeight), "px"), elastic.previousMinHeight.priority);
        elastic.extentY = true;
      }
      setElasticTransform(state);
      return active;
    }
    function setElasticTransform(state) {
      var elastic = state.elastic;
      var wrapper = elastic.wrapper;
      var x = elastic.amounts[3] - elastic.amounts[1];
      var y = elastic.amounts[0] - elastic.amounts[2];
      var translate = x || y ? "translate3d(".concat(x, "px, ").concat(y, "px, 0)") : "";
      var width = Math.max(wrapper.offsetWidth, wrapper.scrollWidth, 1);
      var height = Math.max(wrapper.offsetHeight, wrapper.scrollHeight, 1);
      var scaleX = 1 + 2 * (Math.max(elastic.amounts[1], elastic.amounts[3]) / width);
      var scaleY = 1 + 2 * (Math.max(elastic.amounts[0], elastic.amounts[2]) / height);
      var scale = scaleX > 1 || scaleY > 1 ? "scale(".concat(scaleX, ", ").concat(scaleY, ")") : "";
      if (scaleX > 1 || scaleY > 1) {
        var baseOrigin = elastic.baseOrigin.split(" ");
        var originX = elastic.amounts[3] > 0 ? "0%" : elastic.amounts[1] > 0 ? "".concat(Math.max(wrapper.offsetWidth, wrapper.scrollWidth + wrapper.clientLeft), "px") : baseOrigin[0];
        var originY = elastic.amounts[0] > 0 ? "0%" : elastic.amounts[2] > 0 ? "".concat(Math.max(wrapper.offsetHeight, wrapper.scrollHeight + wrapper.clientTop), "px") : baseOrigin[1];
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
        var _iterator13 = _createForOfIteratorHelper(state.element.children), _step13;
        try {
          for (_iterator13.s(); !(_step13 = _iterator13.n()).done; ) {
            var child = _step13.value;
            state.resizeObserver.observe(child);
          }
        } catch (err) {
          _iterator13.e(err);
        } finally {
          _iterator13.f();
        }
      }
      if (root.MutationObserver) {
        state.mutationObserver = new root.MutationObserver(function(records) {
          if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver.observe(state.element);
            var _iterator14 = _createForOfIteratorHelper(state.element.children), _step14;
            try {
              for (_iterator14.s(); !(_step14 = _iterator14.n()).done; ) {
                var _child = _step14.value;
                state.resizeObserver.observe(_child);
              }
            } catch (err) {
              _iterator14.e(err);
            } finally {
              _iterator14.f();
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
      if (!state.elastic.active) state.metrics = nativeMetrics(state.element);
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
      var metrics = state.metrics || nativeMetrics(state.element);
      var snapValues = state.snapEnabled ? measureSnapValues(state) : [];
      state.element.style.setProperty(properties[0], progress(state.element.scrollTop, metrics.maxY));
      state.element.style.setProperty(properties[1], progress(state.element.scrollLeft, metrics.maxX));
      var _iterator15 = _createForOfIteratorHelper(snapValues), _step15;
      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done; ) {
          var _step15$value = _step15.value, item = _step15$value.item, viewport = _step15$value.viewport, focus = _step15$value.focus;
          item.style.setProperty(snapProperties[0], viewport);
          item.style.setProperty(snapProperties[1], focus);
        }
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }
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
      var metrics = state.metrics;
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
