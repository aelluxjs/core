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
    var RESIZE_INTERVAL_MS = 100;
    var DRAG_THRESHOLD_PX = 3;
    var SELECTION_HORIZONTAL_THRESHOLD_PX = 8;
    var SELECTION_VERTICAL_TOLERANCE_PX = 6;
    var MOMENTUM_LIMIT_TIME_MS = 300;
    var MOMENTUM_LIMIT_DISTANCE_PX = 15;
    var MOMENTUM_DECELERATION = 15e-4;
    var ELASTIC_DAMPING = 1 / 3;
    var ELASTIC_LIMIT_RATIO = 1 / 4;
    var ELASTIC_RELEASE_MS = 800;
    var ELASTIC_WHEEL_IDLE_MS = 80;
    var properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
    var paddingProperties = ["padding-top", "padding-right", "padding-bottom", "padding-left"];
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
      var computed = root.getComputedStyle(element);
      var elastic = {
        base: paddingProperties.map(function(name) {
          return parseFloat(computed.getPropertyValue(name)) || 0;
        }),
        previous: paddingProperties.map(function(name) {
          return {
            value: element.style.getPropertyValue(name),
            priority: element.style.getPropertyPriority(name)
          };
        }),
        amounts: [0, 0, 0, 0],
        active: false,
        owned: false,
        touch: null,
        releaseTimeout: null,
        wheelTimeout: null
      };
      var state = {
        element: element,
        previous: previous,
        metrics: null,
        mode: null,
        desktop: false,
        wheelEnabled: true,
        momentumEnabled: true,
        elasticEnabled: false,
        wheelListening: false,
        pointerListening: false,
        touchListening: false,
        drag: null,
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
        return startDrag(state, event);
      };
      state.onPointerMove = function(event) {
        return moveDrag(state, event);
      };
      state.onPointerEnd = function(event) {
        return endDrag(state, event);
      };
      state.onBlur = function() {
        return endDrag(state);
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
      endDrag(state);
      cancelMomentum(state);
      resetElastic(state);
      element.removeEventListener("scroll", state.onScroll);
      if (state.wheelListening) element.removeEventListener("wheel", state.onWheel, true);
      if (state.pointerListening) element.removeEventListener("pointerdown", state.onPointerDown);
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
      state.elasticEnabled = element.hasAttribute(elasticAttribute) && element.getAttribute(elasticAttribute) !== "false";
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
        state.pointerListening = true;
      } else if (!pointerEnabled && state.pointerListening) {
        element.removeEventListener("pointerdown", state.onPointerDown);
        state.pointerListening = false;
        endDrag(state);
      }
      refresh(state);
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
    function startDrag(state, event) {
      cancelMomentum(state);
      if (state.drag || event.defaultPrevented || event.button !== 0 || !event.isPrimary || event.pointerType === "touch" || (event.buttons & 1) === 0) return;
      var element = state.element;
      var nested = event.target.closest("[".concat(attribute, "]"));
      if (nested !== element || event.target.closest("a, button, input, select, textarea, [contenteditable], [draggable='true']")) return;
      var metrics = nativeMetrics(element);
      if (metrics.maxX <= 0 && metrics.maxY <= 0) return;
      var rect = element.getBoundingClientRect();
      if (event.clientX >= rect.left + element.clientWidth || event.clientY >= rect.top + element.clientHeight) return;
      if (state.elastic.owned) {
        resetElastic(state);
        refresh(state);
        metrics = state.metrics;
      }
      state.drag = {
        pointerId: event.pointerId,
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
        userSelectPriority: element.style.getPropertyPriority("user-select")
      };
      if (!state.drag.selectionPending) {
        element.style.setProperty("user-select", "none");
        state.drag.userSelectApplied = true;
      }
      root.addEventListener("pointermove", state.onPointerMove, {
        passive: false,
        capture: true
      });
      root.addEventListener("pointerup", state.onPointerEnd, true);
      root.addEventListener("pointercancel", state.onPointerEnd, true);
      root.addEventListener("blur", state.onBlur);
    }
    function moveDrag(state, event) {
      var drag = state.drag;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if ((event.buttons & 1) === 0) {
        endDrag(state);
        return;
      }
      var dx = drag.startX - event.clientX;
      var dy = drag.startY - event.clientY;
      if (drag.selectionPending) {
        if (Math.abs(dx) >= SELECTION_HORIZONTAL_THRESHOLD_PX && Math.abs(dy) < SELECTION_VERTICAL_TOLERANCE_PX) {
          endDrag(state);
          return;
        }
        if (Math.abs(dy) < SELECTION_VERTICAL_TOLERANCE_PX) return;
        drag.selectionPending = false;
        state.element.style.setProperty("user-select", "none");
        drag.userSelectApplied = true;
      }
      if (!drag.moved && dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
      drag.moved = true;
      if (event.cancelable) event.preventDefault();
      var time = now();
      var resetMomentum = time - drag.momentumStartTime > MOMENTUM_LIMIT_TIME_MS;
      var desiredX = drag.scrollLeft + dx;
      var desiredY = drag.scrollTop + dy;
      applyElasticFromDesired(state, desiredX, desiredY, false);
      scrollWithinElasticBounds(state, desiredX, desiredY);
      if (resetMomentum) {
        drag.momentumStartX = state.element.scrollLeft;
        drag.momentumStartY = state.element.scrollTop;
        drag.momentumStartTime = time;
      }
      publish(state);
    }
    function endDrag(state, event) {
      var drag = state.drag;
      if (!drag || event && event.pointerId !== drag.pointerId) return;
      state.drag = null;
      root.removeEventListener("pointermove", state.onPointerMove, true);
      root.removeEventListener("pointerup", state.onPointerEnd, true);
      root.removeEventListener("pointercancel", state.onPointerEnd, true);
      root.removeEventListener("blur", state.onBlur);
      if (drag.userSelectApplied) {
        if (drag.userSelect) state.element.style.setProperty("user-select", drag.userSelect, drag.userSelectPriority);
        else state.element.style.removeProperty("user-select");
      }
      var hadElastic = state.elastic.active;
      releaseElastic(state);
      if (event && event.type === "pointerup" && drag.moved && state.momentumEnabled && !hadElastic && !state.disposed && now() - drag.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(state, drag);
      }
    }
    function startMomentum(state, drag) {
      var element = state.element;
      var elapsed = Math.max(1, now() - drag.momentumStartTime);
      var x = momentumAxis(element.scrollLeft, drag.momentumStartX, elapsed, Math.max(0, element.scrollWidth - element.clientWidth));
      var y = momentumAxis(element.scrollTop, drag.momentumStartY, elapsed, Math.max(0, element.scrollHeight - element.clientHeight));
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
      var _iterator2 = _createForOfIteratorHelper(event.touches), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var item = _step2.value;
          if (item.identifier === start.identifier) {
            touch = item;
            break;
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
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
      var _iterator3 = _createForOfIteratorHelper(event.touches), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var item = _step3.value;
          if (item.identifier === touch.identifier) return;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
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
        if (desiredY < 0) amounts[0] = Math.min(element.clientHeight * ELASTIC_LIMIT_RATIO, (additive ? elastic.amounts[0] : 0) - desiredY * ELASTIC_DAMPING);
        else if (desiredY > metrics.maxY) amounts[2] = Math.min(element.clientHeight * ELASTIC_LIMIT_RATIO, (additive ? elastic.amounts[2] : 0) + (desiredY - metrics.maxY) * ELASTIC_DAMPING);
      }
      if (metrics.maxX > 1) {
        if (desiredX > metrics.maxX) amounts[1] = Math.min(element.clientWidth * ELASTIC_LIMIT_RATIO, (additive ? elastic.amounts[1] : 0) + (desiredX - metrics.maxX) * ELASTIC_DAMPING);
        else if (desiredX < 0) amounts[3] = Math.min(element.clientWidth * ELASTIC_LIMIT_RATIO, (additive ? elastic.amounts[3] : 0) - desiredX * ELASTIC_DAMPING);
      }
      var active = amounts.some(function(amount) {
        return amount > 0;
      });
      if (!active && !elastic.owned) return false;
      if (elastic.releaseTimeout !== null) root.clearTimeout(elastic.releaseTimeout);
      elastic.releaseTimeout = null;
      element.classList.remove(elasticReleaseClass);
      elastic.amounts = amounts;
      elastic.active = active;
      elastic.owned = true;
      paddingProperties.forEach(function(name, index) {
        return element.style.setProperty(name, "".concat(elastic.base[index] + amounts[index], "px"));
      });
      return active;
    }
    function scrollWithinElasticBounds(state, desiredX, desiredY) {
      var metrics = state.metrics || nativeMetrics(state.element);
      state.element.scrollTo({
        left: Math.max(0, Math.min(metrics.maxX, desiredX)) + state.elastic.amounts[1],
        top: Math.max(0, Math.min(metrics.maxY, desiredY)) + state.elastic.amounts[2],
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
      state.element.classList.add(elasticReleaseClass);
      elastic.amounts = [0, 0, 0, 0];
      paddingProperties.forEach(function(name, index) {
        return state.element.style.setProperty(name, "".concat(elastic.base[index], "px"));
      });
      if (elastic.releaseTimeout !== null) root.clearTimeout(elastic.releaseTimeout);
      elastic.releaseTimeout = root.setTimeout(function() {
        resetElastic(state);
        refresh(state);
      }, ELASTIC_RELEASE_MS);
    }
    function resetElastic(state) {
      var elastic = state.elastic;
      if (elastic.releaseTimeout !== null) root.clearTimeout(elastic.releaseTimeout);
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.releaseTimeout = null;
      elastic.wheelTimeout = null;
      state.element.classList.remove(elasticReleaseClass);
      if (elastic.owned) paddingProperties.forEach(function(name, index) {
        var previous = elastic.previous[index];
        if (previous.value) state.element.style.setProperty(name, previous.value, previous.priority);
        else state.element.style.removeProperty(name);
      });
      elastic.amounts = [0, 0, 0, 0];
      elastic.active = false;
      elastic.owned = false;
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
        var _iterator4 = _createForOfIteratorHelper(state.element.children), _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
            var child = _step4.value;
            state.resizeObserver.observe(child);
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }
      if (root.MutationObserver) {
        state.mutationObserver = new root.MutationObserver(function() {
          if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver.observe(state.element);
            var _iterator5 = _createForOfIteratorHelper(state.element.children), _step5;
            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
                var _child = _step5.value;
                state.resizeObserver.observe(_child);
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
          }
          refresh(state);
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
