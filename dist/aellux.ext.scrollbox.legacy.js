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
    var elasticReleaseClass = AelluxJs.className("scrollbox-elastic-release");
    var pointerScrollExceptionSelector = "a, button, input, select, textarea, [contenteditable], [draggable='true']";
    var RESIZE_INTERVAL_MS = 100;
    var POINTER_SCROLL_THRESHOLD_PX = 3;
    var POINTER_SCROLL_MULTICLICK_MS = 500;
    var POINTER_SCROLL_MULTICLICK_DISTANCE_PX = 8;
    var SELECTION_HORIZONTAL_THRESHOLD_PX = 8;
    var SELECTION_VERTICAL_TOLERANCE_PX = 6;
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
    var pointerScrollMouseEvents = ["mousedown", "mousemove", "mouseup", "click", "dblclick", "auxclick", "contextmenu", "mouseover", "mouseout", "mouseenter", "mouseleave"];
    var mouseHoldEvents = /* @__PURE__ */ new Set(["mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave"]);
    var mouseReleaseEvents = /* @__PURE__ */ new Set(["mouseup", "click", "dblclick", "auxclick", "contextmenu"]);
    var properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
    var scrollboxes = /* @__PURE__ */ new Map();
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy
    });
    function init() {
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attribute, "]"),
        mount: mountScrollbox,
        update: updateScrollbox,
        unmount: unmountScrollbox
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
      var previous = properties.map(function(name) {
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
      var state = {
        element: element,
        previous: previous,
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
        wheelListening: false,
        pointerListening: false,
        touchListening: false,
        pointerScroll: null,
        lastPointerDown: null,
        mouseReleaseButton: null,
        mouseReleaseTimeout: null,
        momentum: null,
        elastic: elastic,
        resizeObserver: null,
        mutationObserver: null,
        lastResizeTime: -RESIZE_INTERVAL_MS,
        resizeTimeout: null,
        disposed: false
      };
      state.onScroll = function() {
        return publish(state);
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
      state.onPointerScrollNativeStart = function(event) {
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
      endPointerScroll(state);
      stopPointerScrollMouseEvents(state);
      restorePointerScrollCursor(state);
      cancelMomentum(state);
      resetElastic(state);
      element.removeEventListener("scroll", state.onScroll);
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
      state.desktop = isDesktop();
      if ((state.desktop || state.elasticEnabled) && !state.wheelListening) {
        element.addEventListener("wheel", state.onWheel, {
          passive: false,
          capture: true
        });
        state.wheelListening = true;
      } else if (!state.desktop && !state.elasticEnabled && state.wheelListening) {
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
      cancelMomentum(state);
      if (state.pointerScroll || event.defaultPrevented || event.button !== 0 || !event.isPrimary || event.pointerType === "touch" || (event.buttons & 1) === 0) return;
      var element = state.element;
      var nested = event.target.closest("[".concat(attribute, "]"));
      if (nested !== element || event.target.closest(pointerScrollExceptionSelector)) return;
      var metrics = nativeMetrics(element);
      if (metrics.maxX <= 0 && metrics.maxY <= 0) return;
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
      if (!isTextAtPoint(event.target, event.clientX, event.clientY) && event.cancelable) event.preventDefault();
      if (state.elastic.owned) {
        resetElastic(state);
        refresh(state);
        metrics = state.metrics;
      }
      if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
      state.mouseReleaseTimeout = null;
      state.mouseReleaseButton = null;
      state.pointerScroll = {
        pointerId: event.pointerId,
        button: event.button,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop,
        moved: false,
        selectionPending: metrics.maxX <= 1 && metrics.maxY > 1,
        userSelectApplied: false,
        momentumStartX: element.scrollLeft,
        momentumStartY: element.scrollTop,
        momentumStartTime: now(),
        userSelect: element.style.getPropertyValue("user-select"),
        userSelectPriority: element.style.getPropertyPriority("user-select"),
        scrollBehavior: element.style.getPropertyValue("scroll-behavior"),
        scrollBehaviorPriority: element.style.getPropertyPriority("scroll-behavior")
      };
      root.addEventListener("pointermove", state.onPointerMove, {
        passive: false,
        capture: true
      });
      root.addEventListener("touchmove", state.onPointerScrollTouchMove, {
        passive: false,
        capture: true
      });
      root.addEventListener("dragstart", state.onPointerScrollNativeStart, true);
      root.addEventListener("selectstart", state.onPointerScrollNativeStart, true);
      var _iterator4 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var name = _step4.value;
          root.addEventListener(name, state.onMouseEvent, {
            passive: false,
            capture: true
          });
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
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
      if (pointerScroll.selectionPending) {
        var horizontal = Math.abs(dx);
        var vertical = Math.abs(dy);
        if (horizontal >= SELECTION_HORIZONTAL_THRESHOLD_PX && horizontal > vertical) {
          endPointerScroll(state);
          return;
        }
        if (vertical < SELECTION_VERTICAL_TOLERANCE_PX || vertical < horizontal) return;
        pointerScroll.selectionPending = false;
      }
      if (!pointerScroll.moved && dx * dx + dy * dy < POINTER_SCROLL_THRESHOLD_PX * POINTER_SCROLL_THRESHOLD_PX) return;
      if (!pointerScroll.moved) {
        state.element.style.setProperty("user-select", "none");
        state.element.style.setProperty("scroll-behavior", "auto", "important");
        setPointerScrollCursor(state, "grabbing");
        pointerScroll.userSelectApplied = true;
        var selection = root.getSelection();
        if (selection && selection.anchorNode && state.element.contains(selection.anchorNode)) selection.removeAllRanges();
      }
      pointerScroll.moved = true;
      var time = now();
      var resetMomentum = time - pointerScroll.momentumStartTime > MOMENTUM_LIMIT_TIME_MS;
      var desiredX = pointerScroll.scrollLeft + dx;
      var desiredY = pointerScroll.scrollTop + dy;
      if (event.cancelable) event.preventDefault();
      applyElasticFromDesired(state, desiredX, desiredY, false);
      scrollWithinElasticBounds(state, desiredX, desiredY);
      if (resetMomentum) {
        pointerScroll.momentumStartX = state.element.scrollLeft;
        pointerScroll.momentumStartY = state.element.scrollTop;
        pointerScroll.momentumStartTime = time;
      }
      publish(state);
    }
    function endPointerScroll(state, event) {
      var pointerScroll = state.pointerScroll;
      if (!pointerScroll || event && event.pointerId !== pointerScroll.pointerId) return;
      state.pointerScroll = null;
      root.removeEventListener("pointermove", state.onPointerMove, true);
      root.removeEventListener("touchmove", state.onPointerScrollTouchMove, true);
      root.removeEventListener("dragstart", state.onPointerScrollNativeStart, true);
      root.removeEventListener("selectstart", state.onPointerScrollNativeStart, true);
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
      if (pointerScroll.userSelectApplied) {
        if (pointerScroll.userSelect) state.element.style.setProperty("user-select", pointerScroll.userSelect, pointerScroll.userSelectPriority);
        else state.element.style.removeProperty("user-select");
        if (pointerScroll.scrollBehavior) state.element.style.setProperty("scroll-behavior", pointerScroll.scrollBehavior, pointerScroll.scrollBehaviorPriority);
        else state.element.style.removeProperty("scroll-behavior");
      }
      if (event && event.type === "pointerup" && state.pointerListening) {
        updatePointerScrollCursor(state, document.elementFromPoint(event.clientX, event.clientY), event.clientX, event.clientY);
      } else restorePointerScrollCursor(state);
      var hadElastic = state.elastic.active;
      releaseElastic(state);
      if (event && event.type === "pointerup" && pointerScroll.moved && state.momentumEnabled && !hadElastic && !state.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(state, pointerScroll);
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
      var _iterator5 = _createForOfIteratorHelper(pointerScrollMouseEvents), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var name = _step5.value;
          root.removeEventListener(name, state.onMouseEvent, true);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
    function startMomentum(state, pointerScroll) {
      var element = state.element;
      var elapsed = Math.max(1, now() - pointerScroll.momentumStartTime);
      var x = momentumAxis(element.scrollLeft, pointerScroll.momentumStartX, elapsed, Math.max(0, element.scrollWidth - element.clientWidth));
      var y = momentumAxis(element.scrollTop, pointerScroll.momentumStartY, elapsed, Math.max(0, element.scrollHeight - element.clientHeight));
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
      var _iterator6 = _createForOfIteratorHelper(event.touches), _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
          var item = _step6.value;
          if (item.identifier === start.identifier) {
            touch = item;
            break;
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
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
      var _iterator7 = _createForOfIteratorHelper(event.touches), _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
          var item = _step7.value;
          if (item.identifier === touch.identifier) return;
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      state.elastic.touch = null;
      releaseElastic(state);
    }
    function applyElasticFromDesired(state, desiredX, desiredY, additive) {
      if (!state.elasticEnabled) return false;
      var element = state.element;
      var metrics = state.metrics || nativeMetrics(element);
      var elastic = state.elastic;
      var amounts = [0, 0, 0, 0];
      if (metrics.maxY > 1) {
        var limitY = elasticLimit(element.clientHeight, elastic.limits[0]);
        if (desiredY < 0) amounts[0] = elasticResistance(-desiredY, additive ? elastic.amounts[0] : 0, limitY);
        else if (desiredY > metrics.maxY) amounts[2] = elasticResistance(desiredY - metrics.maxY, additive ? elastic.amounts[2] : 0, limitY);
      }
      if (metrics.maxX > 1) {
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
      var scaleX = 1 + Math.max(elastic.amounts[1], elastic.amounts[3]) / width;
      var scaleY = 1 + Math.max(elastic.amounts[0], elastic.amounts[2]) / height;
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
      if (!elastic.owned) return;
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.wheelTimeout = null;
      if (!elastic.active) {
        resetElastic(state);
        return;
      }
      if (root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
        var previous = elastic.previousTransform;
        if (previous.value) elastic.wrapper.style.setProperty("transform", previous.value, previous.priority);
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
        var _iterator8 = _createForOfIteratorHelper(state.element.children), _step8;
        try {
          for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
            var child = _step8.value;
            state.resizeObserver.observe(child);
          }
        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }
      }
      if (root.MutationObserver) {
        state.mutationObserver = new root.MutationObserver(function(records) {
          if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver.observe(state.element);
            var _iterator9 = _createForOfIteratorHelper(state.element.children), _step9;
            try {
              for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
                var _child = _step9.value;
                state.resizeObserver.observe(_child);
              }
            } catch (err) {
              _iterator9.e(err);
            } finally {
              _iterator9.f();
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
    function publish(state) {
      var metrics = state.metrics || nativeMetrics(state.element);
      state.element.style.setProperty(properties[0], progress(state.element.scrollTop, metrics.maxY));
      state.element.style.setProperty(properties[1], progress(state.element.scrollLeft, metrics.maxX));
    }
    function progress(position, distance) {
      return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
    }
    function handleWheel(state, event) {
      if (state.desktop && state.mode === "pointer" && state.pointerScroll && state.pointerScroll.moved) {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        return;
      }
      cancelMomentum(state);
      if (event.defaultPrevented || event.ctrlKey) return;
      if (event.target.closest("[".concat(attribute, "]")) !== state.element) return;
      var metrics = state.metrics;
      if (!metrics) return;
      var factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
      var converted = state.desktop && state.wheelEnabled && metrics.maxX > 1 && metrics.maxY <= 1 && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
      var deltaX = (converted ? event.deltaY : event.deltaX) * factor;
      var deltaY = (converted ? 0 : event.deltaY) * factor;
      if (state.elasticEnabled) {
        var desiredX = Math.max(0, Math.min(metrics.maxX, state.element.scrollLeft)) + deltaX;
        var desiredY = Math.max(0, Math.min(metrics.maxY, state.element.scrollTop)) + deltaY;
        if (applyElasticFromDesired(state, desiredX, desiredY, true)) {
          event.preventDefault();
          scrollWithinElasticBounds(state, desiredX, desiredY);
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
      if (!converted || !deltaX) return;
      var current = state.element.scrollLeft;
      var next = Math.max(0, Math.min(metrics.maxX, current + deltaX));
      if (next === current) return;
      event.preventDefault();
      state.element.scrollTo({
        left: next,
        behavior: "instant"
      });
      publish(state);
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.scrollbox.legacy.js.map
