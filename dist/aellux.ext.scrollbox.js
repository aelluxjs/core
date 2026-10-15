(() => {
  // src/aellux.ext.scrollbox.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "scrollbox";
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the scrollbox extension.");
    const attribute = AelluxJs.attr(extensionName);
    const wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
    const momentumAttribute = AelluxJs.attr("scrollbox-momentum");
    const elasticAttribute = AelluxJs.attr("scrollbox-elastic");
    const elasticReleaseClass = AelluxJs.className("scrollbox-elastic-release");
    const RESIZE_INTERVAL_MS = 100;
    const DRAG_THRESHOLD_PX = 3;
    const SELECTION_HORIZONTAL_THRESHOLD_PX = 8;
    const SELECTION_VERTICAL_TOLERANCE_PX = 6;
    const MOMENTUM_LIMIT_TIME_MS = 300;
    const MOMENTUM_LIMIT_DISTANCE_PX = 15;
    const MOMENTUM_DECELERATION = 15e-4;
    const ELASTIC_DAMPING = 1 / 3;
    const ELASTIC_LIMIT_RATIO = 1 / 4;
    const ELASTIC_RELEASE_MS = 800;
    const ELASTIC_WHEEL_IDLE_MS = 80;
    const properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
    const scrollboxes = /* @__PURE__ */ new Map();
    AelluxJs.extAttach(extensionName, { init, destroy });
    function init() {
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${attribute}]`,
        mount: mountScrollbox,
        update: updateScrollbox,
        unmount: unmountScrollbox
      });
    }
    function destroy() {
      for (const element of scrollboxes.keys()) unmountScrollbox(element);
      AelluxJs.mountManager.remove({ extensionName });
    }
    function mountScrollbox(element) {
      if (scrollboxes.has(element)) return;
      const previous = properties.map((name) => ({
        value: element.style.getPropertyValue(name),
        priority: element.style.getPropertyPriority(name)
      }));
      const elastic = {
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
        amounts: [0, 0, 0, 0],
        active: false,
        owned: false,
        touch: null,
        releaseTimeout: null,
        wheelTimeout: null
      };
      const state = {
        element,
        previous,
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
        elastic,
        resizeObserver: null,
        mutationObserver: null,
        lastResizeTime: -RESIZE_INTERVAL_MS,
        resizeTimeout: null,
        disposed: false
      };
      state.onScroll = () => publish(state);
      state.onWheel = (event) => handleWheel(state, event);
      state.onPointerDown = (event) => startDrag(state, event);
      state.onMouseDown = (event) => {
        if (event.button === 0 && event.detail > 1) endDrag(state);
      };
      state.onPointerMove = (event) => moveDrag(state, event);
      state.onPointerEnd = (event) => endDrag(state, event);
      state.onBlur = () => endDrag(state);
      state.onTouchStart = (event) => startTouch(state, event);
      state.onTouchMove = (event) => moveTouch(state, event);
      state.onTouchEnd = (event) => endTouch(state, event);
      scrollboxes.set(element, state);
      element.addEventListener("scroll", state.onScroll, { passive: true });
      observe(state);
      configure(state);
    }
    function updateScrollbox(element) {
      const state = scrollboxes.get(element);
      if (state) configure(state);
    }
    function unmountScrollbox(element) {
      const state = scrollboxes.get(element);
      if (!state) return;
      state.disposed = true;
      endDrag(state);
      cancelMomentum(state);
      resetElastic(state);
      element.removeEventListener("scroll", state.onScroll);
      if (state.wheelListening) element.removeEventListener("wheel", state.onWheel, true);
      if (state.pointerListening) {
        element.removeEventListener("pointerdown", state.onPointerDown);
        element.removeEventListener("mousedown", state.onMouseDown);
      }
      if (state.touchListening) removeTouchListeners(state);
      if (state.resizeObserver) state.resizeObserver.disconnect();
      if (state.mutationObserver) state.mutationObserver.disconnect();
      if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
      root.removeEventListener("resize", state.onResize);
      properties.forEach((name, index) => {
        const original = state.previous[index];
        if (original.value) element.style.setProperty(name, original.value, original.priority);
        else element.style.removeProperty(name);
      });
      scrollboxes.delete(element);
    }
    function configure(state) {
      const element = state.element;
      state.mode = readMode(element);
      state.wheelEnabled = element.getAttribute(wheelAttribute) !== "false";
      state.momentumEnabled = element.getAttribute(momentumAttribute) !== "false";
      configureElastic(state);
      state.desktop = isDesktop();
      if ((state.desktop || state.elasticEnabled) && !state.wheelListening) {
        element.addEventListener("wheel", state.onWheel, { passive: false, capture: true });
        state.wheelListening = true;
      } else if (!state.desktop && !state.elasticEnabled && state.wheelListening) {
        element.removeEventListener("wheel", state.onWheel, true);
        state.wheelListening = false;
      }
      if (state.elasticEnabled && !state.touchListening) addTouchListeners(state);
      else if (!state.elasticEnabled && state.touchListening) removeTouchListeners(state);
      if (!state.elasticEnabled) resetElastic(state);
      const pointerEnabled = state.desktop && state.mode === "pointer";
      if (!pointerEnabled || !state.momentumEnabled) cancelMomentum(state);
      if (pointerEnabled && !state.pointerListening) {
        element.addEventListener("pointerdown", state.onPointerDown);
        element.addEventListener("mousedown", state.onMouseDown);
        state.pointerListening = true;
      } else if (!pointerEnabled && state.pointerListening) {
        element.removeEventListener("pointerdown", state.onPointerDown);
        element.removeEventListener("mousedown", state.onMouseDown);
        state.pointerListening = false;
        endDrag(state);
      }
      refresh(state);
    }
    function configureElastic(state) {
      const element = state.element;
      const child = element.children.length === 1 ? element.children[0] : null;
      const wrapper = child && child.hasAttribute(elasticAttribute) && child.getAttribute(elasticAttribute) !== "false" ? child : null;
      if (!wrapper) {
        resetElastic(state);
        state.elasticEnabled = false;
        state.elastic.wrapper = null;
        const requested = element.hasAttribute(elasticAttribute) || Array.from(element.children).some((item) => item.hasAttribute(elasticAttribute) && item.getAttribute(elasticAttribute) !== "false");
        if (requested && !state.elastic.invalidReported) {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_SCROLLBOX_ELASTIC_WRAPPER,
            { element }
          );
        }
        state.elastic.invalidReported = requested;
        return;
      }
      state.elastic.invalidReported = false;
      if (state.elastic.wrapper !== wrapper) {
        resetElastic(state);
        const computed = root.getComputedStyle(wrapper);
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
    }
    function readMode(element) {
      const value = (element.getAttribute(attribute) || "").trim().toLowerCase() || "native";
      if (value === "native" || value === "pointer") return value;
      AelluxJs.diagnostics.warn(
        AelluxJs.diagnostics.WARN_SCROLLBOX_MODE_INVALID,
        { element, value }
      );
      return "native";
    }
    function isDesktop() {
      return !!(root.matchMedia && root.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }
    function startDrag(state, event) {
      cancelMomentum(state);
      if (state.drag || event.defaultPrevented || event.button !== 0 || !event.isPrimary || event.pointerType === "touch" || (event.buttons & 1) === 0) return;
      const element = state.element;
      const nested = event.target.closest(`[${attribute}]`);
      if (nested !== element || event.target.closest(
        "a, button, input, select, textarea, [contenteditable], [draggable='true']"
      )) return;
      let metrics = nativeMetrics(element);
      if (metrics.maxX <= 0 && metrics.maxY <= 0) return;
      const rect = element.getBoundingClientRect();
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
      root.addEventListener("pointermove", state.onPointerMove, { passive: false, capture: true });
      root.addEventListener("pointerup", state.onPointerEnd, true);
      root.addEventListener("pointercancel", state.onPointerEnd, true);
      root.addEventListener("blur", state.onBlur);
    }
    function moveDrag(state, event) {
      const drag = state.drag;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if ((event.buttons & 1) === 0) {
        endDrag(state);
        return;
      }
      const dx = drag.startX - event.clientX;
      const dy = drag.startY - event.clientY;
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
      const time = now();
      const resetMomentum = time - drag.momentumStartTime > MOMENTUM_LIMIT_TIME_MS;
      const desiredX = drag.scrollLeft + dx;
      const desiredY = drag.scrollTop + dy;
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
      const drag = state.drag;
      if (!drag || event && event.pointerId !== drag.pointerId) return;
      state.drag = null;
      root.removeEventListener("pointermove", state.onPointerMove, true);
      root.removeEventListener("pointerup", state.onPointerEnd, true);
      root.removeEventListener("pointercancel", state.onPointerEnd, true);
      root.removeEventListener("blur", state.onBlur);
      if (drag.userSelectApplied) {
        if (drag.userSelect) state.element.style.setProperty(
          "user-select",
          drag.userSelect,
          drag.userSelectPriority
        );
        else state.element.style.removeProperty("user-select");
      }
      const hadElastic = state.elastic.active;
      releaseElastic(state);
      if (event && event.type === "pointerup" && drag.moved && state.momentumEnabled && !hadElastic && !state.disposed && now() - drag.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(state, drag);
      }
    }
    function startMomentum(state, drag) {
      const element = state.element;
      const elapsed = Math.max(1, now() - drag.momentumStartTime);
      const x = momentumAxis(
        element.scrollLeft,
        drag.momentumStartX,
        elapsed,
        Math.max(0, element.scrollWidth - element.clientWidth)
      );
      const y = momentumAxis(
        element.scrollTop,
        drag.momentumStartY,
        elapsed,
        Math.max(0, element.scrollHeight - element.clientHeight)
      );
      if (x === element.scrollLeft && y === element.scrollTop) return;
      const momentum = {
        currentX: element.scrollLeft,
        currentY: element.scrollTop,
        toX: x,
        toY: y,
        frame: null
      };
      state.momentum = momentum;
      momentum.frame = root.requestAnimationFrame(() => stepMomentum(state, momentum));
    }
    function momentumAxis(current, start, elapsed, maximum) {
      const distance = current - start;
      if (Math.abs(distance) <= MOMENTUM_LIMIT_DISTANCE_PX) return current;
      const speed = Math.abs(distance) / elapsed;
      const projected = current + Math.sign(distance) * speed * speed / MOMENTUM_DECELERATION;
      return Math.max(0, Math.min(maximum, Math.round(projected)));
    }
    function stepMomentum(state, momentum) {
      if (state.momentum !== momentum || state.disposed) return;
      momentum.currentX += (momentum.toX - momentum.currentX) * 0.1;
      momentum.currentY += (momentum.toY - momentum.currentY) * 0.1;
      const done = momentum.currentX.toFixed(3) === momentum.toX.toFixed(3) && momentum.currentY.toFixed(3) === momentum.toY.toFixed(3);
      const element = state.element;
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
      momentum.frame = root.requestAnimationFrame(() => stepMomentum(state, momentum));
    }
    function cancelMomentum(state) {
      if (!state.momentum) return;
      root.cancelAnimationFrame(state.momentum.frame);
      state.momentum = null;
    }
    function addTouchListeners(state) {
      const element = state.element;
      element.addEventListener("touchstart", state.onTouchStart, { passive: true });
      element.addEventListener("touchmove", state.onTouchMove, { passive: false });
      element.addEventListener("touchend", state.onTouchEnd, { passive: true });
      element.addEventListener("touchcancel", state.onTouchEnd, { passive: true });
      state.touchListening = true;
    }
    function removeTouchListeners(state) {
      const element = state.element;
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
      if (event.target.closest(`[${attribute}]`) !== state.element) return;
      cancelMomentum(state);
      const touch = event.touches[0];
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
      const start = state.elastic.touch;
      if (!start) return;
      let touch = null;
      for (const item of event.touches) {
        if (item.identifier === start.identifier) {
          touch = item;
          break;
        }
      }
      if (!touch) return;
      const desiredX = start.scrollLeft + start.x - touch.clientX;
      const desiredY = start.scrollTop + start.y - touch.clientY;
      if (!applyElasticFromDesired(state, desiredX, desiredY, false)) return;
      if (event.cancelable) event.preventDefault();
      scrollWithinElasticBounds(state, desiredX, desiredY);
      publish(state);
    }
    function endTouch(state, event) {
      const touch = state.elastic.touch;
      if (!touch) return;
      for (const item of event.touches) {
        if (item.identifier === touch.identifier) return;
      }
      state.elastic.touch = null;
      releaseElastic(state);
    }
    function applyElasticFromDesired(state, desiredX, desiredY, additive) {
      if (!state.elasticEnabled) return false;
      const element = state.element;
      const metrics = state.metrics || nativeMetrics(element);
      const elastic = state.elastic;
      const amounts = [0, 0, 0, 0];
      if (metrics.maxY > 1) {
        if (desiredY < 0) amounts[0] = Math.min(
          element.clientHeight * ELASTIC_LIMIT_RATIO,
          (additive ? elastic.amounts[0] : 0) - desiredY * ELASTIC_DAMPING
        );
        else if (desiredY > metrics.maxY) amounts[2] = Math.min(
          element.clientHeight * ELASTIC_LIMIT_RATIO,
          (additive ? elastic.amounts[2] : 0) + (desiredY - metrics.maxY) * ELASTIC_DAMPING
        );
      }
      if (metrics.maxX > 1) {
        if (desiredX > metrics.maxX) amounts[1] = Math.min(
          element.clientWidth * ELASTIC_LIMIT_RATIO,
          (additive ? elastic.amounts[1] : 0) + (desiredX - metrics.maxX) * ELASTIC_DAMPING
        );
        else if (desiredX < 0) amounts[3] = Math.min(
          element.clientWidth * ELASTIC_LIMIT_RATIO,
          (additive ? elastic.amounts[3] : 0) - desiredX * ELASTIC_DAMPING
        );
      }
      const active = amounts.some((amount) => amount > 0);
      if (!active && !elastic.owned) return false;
      if (elastic.releaseTimeout !== null) root.clearTimeout(elastic.releaseTimeout);
      elastic.releaseTimeout = null;
      elastic.wrapper.classList.remove(elasticReleaseClass);
      elastic.amounts = amounts;
      elastic.active = active;
      elastic.owned = true;
      if (amounts[1] > 0 && !elastic.extentX) {
        elastic.wrapper.style.setProperty(
          "min-width",
          `${Math.max(elastic.wrapper.offsetWidth, elastic.wrapper.scrollWidth)}px`,
          elastic.previousMinWidth.priority
        );
        elastic.extentX = true;
      }
      if (amounts[2] > 0 && !elastic.extentY) {
        elastic.wrapper.style.setProperty(
          "min-height",
          `${Math.max(elastic.wrapper.offsetHeight, elastic.wrapper.scrollHeight)}px`,
          elastic.previousMinHeight.priority
        );
        elastic.extentY = true;
      }
      setElasticTransform(state);
      return active;
    }
    function setElasticTransform(state) {
      const elastic = state.elastic;
      const wrapper = elastic.wrapper;
      const x = elastic.amounts[3] - elastic.amounts[1];
      const y = elastic.amounts[0] - elastic.amounts[2];
      const translate = x || y ? `translate3d(${x}px, ${y}px, 0)` : "";
      const limitX = state.element.clientWidth * ELASTIC_LIMIT_RATIO || 1;
      const limitY = state.element.clientHeight * ELASTIC_LIMIT_RATIO || 1;
      const scaleX = 1 + 0.1 * Math.max(elastic.amounts[1], elastic.amounts[3]) / limitX;
      const scaleY = 1 + 0.1 * Math.max(elastic.amounts[0], elastic.amounts[2]) / limitY;
      const scale = scaleX > 1 || scaleY > 1 ? `scale(${scaleX}, ${scaleY})` : "";
      if (scaleX > 1 || scaleY > 1) {
        const baseOrigin = elastic.baseOrigin.split(" ");
        const originX = elastic.amounts[3] > 0 ? "0%" : elastic.amounts[1] > 0 ? `${Math.max(
          wrapper.offsetWidth,
          wrapper.scrollWidth + wrapper.clientLeft
        )}px` : baseOrigin[0];
        const originY = elastic.amounts[0] > 0 ? "0%" : elastic.amounts[2] > 0 ? `${Math.max(
          wrapper.offsetHeight,
          wrapper.scrollHeight + wrapper.clientTop
        )}px` : baseOrigin[1];
        wrapper.style.setProperty(
          "transform-origin",
          `${originX} ${originY}`,
          elastic.previousOrigin.priority
        );
      }
      wrapper.style.setProperty(
        "transform",
        [scale, translate, elastic.baseTransform].filter(Boolean).join(" ") || "none",
        elastic.previousTransform.priority
      );
    }
    function scrollWithinElasticBounds(state, desiredX, desiredY) {
      const element = state.element;
      const metrics = state.metrics || nativeMetrics(element);
      element.scrollTo({
        left: Math.max(0, Math.min(metrics.maxX, desiredX)),
        top: Math.max(0, Math.min(metrics.maxY, desiredY)),
        behavior: "instant"
      });
    }
    function releaseElastic(state) {
      const elastic = state.elastic;
      if (!elastic.owned) return;
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.wheelTimeout = null;
      if (!elastic.active) {
        resetElastic(state);
        return;
      }
      elastic.wrapper.classList.add(elasticReleaseClass);
      elastic.amounts = [0, 0, 0, 0];
      setElasticTransform(state);
      if (elastic.releaseTimeout !== null) root.clearTimeout(elastic.releaseTimeout);
      elastic.releaseTimeout = root.setTimeout(() => {
        resetElastic(state);
        refresh(state);
      }, ELASTIC_RELEASE_MS);
    }
    function resetElastic(state) {
      const elastic = state.elastic;
      if (elastic.releaseTimeout !== null) root.clearTimeout(elastic.releaseTimeout);
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.releaseTimeout = null;
      elastic.wheelTimeout = null;
      if (elastic.wrapper) elastic.wrapper.classList.remove(elasticReleaseClass);
      if (elastic.owned && elastic.wrapper) {
        const previous = elastic.previousTransform;
        if (previous.value) elastic.wrapper.style.setProperty(
          "transform",
          previous.value,
          previous.priority
        );
        else elastic.wrapper.style.removeProperty("transform");
        const previousOrigin = elastic.previousOrigin;
        if (previousOrigin.value) elastic.wrapper.style.setProperty(
          "transform-origin",
          previousOrigin.value,
          previousOrigin.priority
        );
        else elastic.wrapper.style.removeProperty("transform-origin");
        if (elastic.extentX) {
          const previousMinWidth = elastic.previousMinWidth;
          if (previousMinWidth.value) elastic.wrapper.style.setProperty(
            "min-width",
            previousMinWidth.value,
            previousMinWidth.priority
          );
          else elastic.wrapper.style.removeProperty("min-width");
        }
        if (elastic.extentY) {
          const previousMinHeight = elastic.previousMinHeight;
          if (previousMinHeight.value) elastic.wrapper.style.setProperty(
            "min-height",
            previousMinHeight.value,
            previousMinHeight.priority
          );
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
      state.onResize = () => scheduleResize(state);
      root.addEventListener("resize", state.onResize, { passive: true });
      if (root.ResizeObserver) {
        state.resizeObserver = new root.ResizeObserver(() => scheduleResize(state));
        state.resizeObserver.observe(state.element);
        for (const child of state.element.children) state.resizeObserver.observe(child);
      }
      if (root.MutationObserver) {
        state.mutationObserver = new root.MutationObserver((records) => {
          if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver.observe(state.element);
            for (const child of state.element.children) state.resizeObserver.observe(child);
          }
          if (records.some((record) => record.target === state.element)) configure(state);
          else refresh(state);
        });
        state.mutationObserver.observe(
          state.element,
          { childList: true, subtree: true, characterData: true }
        );
      }
    }
    function scheduleResize(state) {
      if (state.disposed) return;
      const elapsed = now() - state.lastResizeTime;
      if (elapsed >= RESIZE_INTERVAL_MS) {
        if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
        state.resizeTimeout = null;
        flushResize(state);
        return;
      }
      if (state.resizeTimeout !== null) return;
      state.resizeTimeout = root.setTimeout(() => flushResize(state), RESIZE_INTERVAL_MS - elapsed);
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
      const metrics = state.metrics || nativeMetrics(state.element);
      state.element.style.setProperty(properties[0], progress(state.element.scrollTop, metrics.maxY));
      state.element.style.setProperty(properties[1], progress(state.element.scrollLeft, metrics.maxX));
    }
    function progress(position, distance) {
      return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
    }
    function handleWheel(state, event) {
      if (state.desktop && state.mode === "pointer" && state.drag && state.drag.moved) {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        return;
      }
      cancelMomentum(state);
      if (event.defaultPrevented || event.ctrlKey) return;
      if (event.target.closest(`[${attribute}]`) !== state.element) return;
      const metrics = state.metrics;
      if (!metrics) return;
      const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
      const converted = state.desktop && state.wheelEnabled && metrics.maxX > 1 && metrics.maxY <= 1 && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
      const deltaX = (converted ? event.deltaY : event.deltaX) * factor;
      const deltaY = (converted ? 0 : event.deltaY) * factor;
      if (state.elasticEnabled) {
        const desiredX = Math.max(0, Math.min(metrics.maxX, state.element.scrollLeft)) + deltaX;
        const desiredY = Math.max(0, Math.min(metrics.maxY, state.element.scrollTop)) + deltaY;
        if (applyElasticFromDesired(state, desiredX, desiredY, true)) {
          event.preventDefault();
          scrollWithinElasticBounds(state, desiredX, desiredY);
          publish(state);
          if (state.elastic.wheelTimeout !== null) root.clearTimeout(state.elastic.wheelTimeout);
          state.elastic.wheelTimeout = root.setTimeout(() => releaseElastic(state), ELASTIC_WHEEL_IDLE_MS);
          return;
        }
        if (state.elastic.owned) {
          resetElastic(state);
          refresh(state);
        }
      }
      if (!converted || !deltaX) return;
      const current = state.element.scrollLeft;
      const next = Math.max(0, Math.min(metrics.maxX, current + deltaX));
      if (next === current) return;
      event.preventDefault();
      state.element.scrollTo({ left: next, behavior: "instant" });
      publish(state);
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.scrollbox.js.map
