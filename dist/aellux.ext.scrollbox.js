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
    const pointerScrollingClass = AelluxJs.className("pointerscrolling");
    const pointerScrollExceptionSelector = "a, button, input, select, textarea, [contenteditable], [draggable='true']";
    const RESIZE_INTERVAL_MS = 100;
    const POINTER_SCROLL_THRESHOLD_PX = 3;
    const POINTER_SCROLL_MULTICLICK_MS = 500;
    const POINTER_SCROLL_MULTICLICK_DISTANCE_PX = 8;
    const SELECTION_HORIZONTAL_THRESHOLD_PX = 8;
    const SELECTION_VERTICAL_TOLERANCE_PX = 6;
    const MOMENTUM_LIMIT_TIME_MS = 300;
    const MOMENTUM_LIMIT_DISTANCE_PX = 15;
    const MOMENTUM_DECELERATION = 15e-4;
    const ELASTIC_DAMPING = 1 / 3;
    const DEFAULT_ELASTIC_LIMIT = { unit: "ratio", value: 1 / 4 };
    const ELASTIC_RETURN_LERP = 0.15;
    const ELASTIC_RETURN_EPSILON = 0.01;
    const ELASTIC_WHEEL_IDLE_MS = 80;
    const pointerScrollMouseEvents = [
      "mousedown",
      "mousemove",
      "mouseup",
      "click",
      "dblclick",
      "auxclick",
      "contextmenu",
      "mouseover",
      "mouseout",
      "mouseenter",
      "mouseleave"
    ];
    const pointerScrollDragEvents = [
      "dragstart",
      "drag",
      "dragenter",
      "dragover",
      "dragleave",
      "drop",
      "dragend"
    ];
    const mouseHoldEvents = /* @__PURE__ */ new Set([
      "mousemove",
      "mouseover",
      "mouseout",
      "mouseenter",
      "mouseleave"
    ]);
    const mouseReleaseEvents = /* @__PURE__ */ new Set([
      "mouseup",
      "click",
      "dblclick",
      "auxclick",
      "contextmenu"
    ]);
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
        invalidLimit: null,
        limits: [DEFAULT_ELASTIC_LIMIT, DEFAULT_ELASTIC_LIMIT],
        amounts: [0, 0, 0, 0],
        active: false,
        owned: false,
        touch: null,
        releaseFrame: null,
        wheelTimeout: null
      };
      const state = {
        element,
        previous,
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
        pointerScrollingClassOwned: false,
        mouseReleaseButton: null,
        mouseReleaseTimeout: null,
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
      state.onPointerDown = (event) => startPointerScroll(state, event);
      state.onPointerOver = (event) => updatePointerScrollCursor(
        state,
        event.target,
        event.clientX,
        event.clientY
      );
      state.onPointerOut = (event) => {
        if (state.pointerScroll && state.pointerScroll.moved) return;
        if (!event.relatedTarget || !element.contains(event.relatedTarget))
          restorePointerScrollCursor(state);
      };
      state.onMouseDown = (event) => {
        if (event.button === 0 && event.detail > 1) endPointerScroll(state);
      };
      state.onPointerMove = (event) => movePointerScroll(state, event);
      state.onMouseEvent = (event) => cancelPointerScrollMouseEvent(state, event);
      state.onPointerScrollTouchMove = (event) => {
        if (state.pointerScroll && state.pointerScroll.moved && event.cancelable)
          event.preventDefault();
      };
      state.onPointerScrollNativeEvent = (event) => {
        if (state.pointerScroll && state.pointerScroll.moved && event.cancelable)
          event.preventDefault();
      };
      state.onPointerEnd = (event) => endPointerScroll(state, event);
      state.onBlur = () => endPointerScroll(state);
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
      const value = wrapper.getAttribute(elasticAttribute).trim();
      const tokens = value ? value.split(/\s+/) : [];
      const limits = tokens.map(parseElasticLimit);
      if (tokens.length > 2 || limits.some((limit) => !limit)) {
        if (state.elastic.invalidLimit !== value) {
          AelluxJs.diagnostics.warn(
            AelluxJs.diagnostics.WARN_SCROLLBOX_ELASTIC_LIMIT_INVALID,
            { element, value }
          );
        }
        state.elastic.invalidLimit = value;
        state.elastic.limits = [DEFAULT_ELASTIC_LIMIT, DEFAULT_ELASTIC_LIMIT];
      } else {
        state.elastic.invalidLimit = null;
        state.elastic.limits = tokens.length === 2 ? limits : [limits[0] || DEFAULT_ELASTIC_LIMIT, limits[0] || DEFAULT_ELASTIC_LIMIT];
      }
    }
    function parseElasticLimit(token) {
      const fraction = /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(token);
      if (fraction && Number(fraction[2]) > 0) {
        return { unit: "ratio", value: Number(fraction[1]) / Number(fraction[2]) };
      }
      const pixels = /^(\d+(?:\.\d+)?)(?:px)?$/i.exec(token);
      return pixels ? { unit: "px", value: Number(pixels[1]) } : null;
    }
    function elasticLimit(size, limit) {
      return limit.unit === "px" ? limit.value : size * limit.value;
    }
    function elasticResistance(force, current, limit) {
      if (limit <= 0) return 0;
      return current + (limit - current) * (1 - Math.exp(-force * ELASTIC_DAMPING / limit));
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
    function updatePointerScrollCursor(state, target, x, y) {
      if (!state.pointerListening || state.pointerScroll && state.pointerScroll.moved) return;
      if (!target || target.nodeType !== 1 || target.closest(`[${attribute}]`) !== state.element || target.closest(pointerScrollExceptionSelector) || isTextAtPoint(target, x, y)) {
        restorePointerScrollCursor(state);
        return;
      }
      setPointerScrollCursor(state, "grab");
    }
    function isTextAtPoint(element, x, y) {
      if (root.getComputedStyle(element).userSelect === "none") return false;
      const range = document.createRange();
      for (const node of element.childNodes) {
        if (node.nodeType !== 3 || !node.textContent.trim()) continue;
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
            return true;
        }
      }
      return false;
    }
    function setPointerScrollCursor(state, value) {
      state.element.style.setProperty("cursor", value, "important");
      state.cursor.owned = true;
    }
    function restorePointerScrollCursor(state) {
      if (!state.cursor.owned) return;
      if (state.cursor.value) state.element.style.setProperty(
        "cursor",
        state.cursor.value,
        state.cursor.priority
      );
      else state.element.style.removeProperty("cursor");
      state.cursor.owned = false;
    }
    function startPointerScroll(state, event) {
      if (event.detail > 1) return;
      cancelMomentum(state);
      if (state.pointerScroll || event.defaultPrevented || event.button !== 0 || !event.isPrimary || event.pointerType === "touch" || (event.buttons & 1) === 0) return;
      const element = state.element;
      const nested = event.target.closest(`[${attribute}]`);
      if (nested !== element || event.target.closest(pointerScrollExceptionSelector)) return;
      let metrics = nativeMetrics(element);
      if (metrics.maxX <= 0 && metrics.maxY <= 0) return;
      const rect = element.getBoundingClientRect();
      if (event.clientX >= rect.left + element.clientWidth || event.clientY >= rect.top + element.clientHeight) return;
      const previousDown = state.lastPointerDown;
      const time = now();
      state.lastPointerDown = { x: event.clientX, y: event.clientY, time };
      if (previousDown && time - previousDown.time <= POINTER_SCROLL_MULTICLICK_MS && Math.abs(event.clientX - previousDown.x) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX && Math.abs(event.clientY - previousDown.y) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX) return;
      if (!isTextAtPoint(event.target, event.clientX, event.clientY) && event.cancelable)
        event.preventDefault();
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
      root.addEventListener("pointermove", state.onPointerMove, { passive: false, capture: true });
      root.addEventListener(
        "touchmove",
        state.onPointerScrollTouchMove,
        { passive: false, capture: true }
      );
      for (const name of pointerScrollDragEvents) {
        root.addEventListener(name, state.onPointerScrollNativeEvent, true);
      }
      root.addEventListener("selectstart", state.onPointerScrollNativeEvent, true);
      for (const name of pointerScrollMouseEvents) {
        root.addEventListener(name, state.onMouseEvent, { passive: false, capture: true });
      }
      root.addEventListener("pointerup", state.onPointerEnd, true);
      root.addEventListener("pointercancel", state.onPointerEnd, true);
      root.addEventListener("blur", state.onBlur);
    }
    function movePointerScroll(state, event) {
      const pointerScroll = state.pointerScroll;
      if (!pointerScroll || event.pointerId !== pointerScroll.pointerId) return;
      if ((event.buttons & 1) === 0) {
        endPointerScroll(state);
        return;
      }
      const dx = pointerScroll.startX - event.clientX;
      const dy = pointerScroll.startY - event.clientY;
      if (pointerScroll.selectionPending) {
        const horizontal = Math.abs(dx);
        const vertical = Math.abs(dy);
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
        restorePointerScrollCursor(state);
        state.pointerScrollingClassOwned = !state.element.classList.contains(pointerScrollingClass);
        state.element.classList.add(pointerScrollingClass);
        pointerScroll.userSelectApplied = true;
        const selection = root.getSelection();
        if (selection && selection.anchorNode && state.element.contains(selection.anchorNode))
          selection.removeAllRanges();
      }
      pointerScroll.moved = true;
      const time = now();
      const resetMomentum = time - pointerScroll.momentumStartTime > MOMENTUM_LIMIT_TIME_MS;
      const desiredX = pointerScroll.scrollLeft + dx;
      const desiredY = pointerScroll.scrollTop + dy;
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
      const pointerScroll = state.pointerScroll;
      if (!pointerScroll || event && event.pointerId !== pointerScroll.pointerId) return;
      state.pointerScroll = null;
      if (state.pointerScrollingClassOwned) state.element.classList.remove(pointerScrollingClass);
      state.pointerScrollingClassOwned = false;
      root.removeEventListener("pointermove", state.onPointerMove, true);
      root.removeEventListener("touchmove", state.onPointerScrollTouchMove, true);
      for (const name of pointerScrollDragEvents) {
        root.removeEventListener(name, state.onPointerScrollNativeEvent, true);
      }
      root.removeEventListener("selectstart", state.onPointerScrollNativeEvent, true);
      root.removeEventListener("pointerup", state.onPointerEnd, true);
      root.removeEventListener("pointercancel", state.onPointerEnd, true);
      root.removeEventListener("blur", state.onBlur);
      if (pointerScroll.moved && !state.disposed) {
        state.mouseReleaseButton = pointerScroll.button;
        if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
        state.mouseReleaseTimeout = root.setTimeout(() => stopPointerScrollMouseEvents(state), 0);
      } else {
        stopPointerScrollMouseEvents(state);
      }
      if (pointerScroll.userSelectApplied) {
        if (pointerScroll.userSelect) state.element.style.setProperty(
          "user-select",
          pointerScroll.userSelect,
          pointerScroll.userSelectPriority
        );
        else state.element.style.removeProperty("user-select");
        if (pointerScroll.scrollBehavior) state.element.style.setProperty(
          "scroll-behavior",
          pointerScroll.scrollBehavior,
          pointerScroll.scrollBehaviorPriority
        );
        else state.element.style.removeProperty("scroll-behavior");
      }
      if (event && event.type === "pointerup" && state.pointerListening) {
        updatePointerScrollCursor(
          state,
          document.elementFromPoint(event.clientX, event.clientY),
          event.clientX,
          event.clientY
        );
      } else restorePointerScrollCursor(state);
      const hadElastic = state.elastic.active;
      releaseElastic(state);
      if (event && event.type === "pointerup" && pointerScroll.moved && state.momentumEnabled && !hadElastic && !state.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(state, pointerScroll);
      }
    }
    function cancelPointerScrollMouseEvent(state, event) {
      const active = state.pointerScroll && state.pointerScroll.moved;
      if (!active && !mouseReleaseEvents.has(event.type)) return;
      const button = active ? state.pointerScroll.button : state.mouseReleaseButton;
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
      for (const name of pointerScrollMouseEvents) {
        root.removeEventListener(name, state.onMouseEvent, true);
      }
    }
    function startMomentum(state, pointerScroll) {
      const element = state.element;
      const elapsed = Math.max(1, now() - pointerScroll.momentumStartTime);
      const x = momentumAxis(
        element.scrollLeft,
        pointerScroll.momentumStartX,
        elapsed,
        Math.max(0, element.scrollWidth - element.clientWidth)
      );
      const y = momentumAxis(
        element.scrollTop,
        pointerScroll.momentumStartY,
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
        const limitY = elasticLimit(element.clientHeight, elastic.limits[0]);
        if (desiredY < 0) amounts[0] = elasticResistance(
          -desiredY,
          additive ? elastic.amounts[0] : 0,
          limitY
        );
        else if (desiredY > metrics.maxY) amounts[2] = elasticResistance(
          desiredY - metrics.maxY,
          additive ? elastic.amounts[2] : 0,
          limitY
        );
      }
      if (metrics.maxX > 1) {
        const limitX = elasticLimit(element.clientWidth, elastic.limits[1]);
        if (desiredX > metrics.maxX) amounts[1] = elasticResistance(
          desiredX - metrics.maxX,
          additive ? elastic.amounts[1] : 0,
          limitX
        );
        else if (desiredX < 0) amounts[3] = elasticResistance(
          -desiredX,
          additive ? elastic.amounts[3] : 0,
          limitX
        );
      }
      const active = amounts.some((amount) => amount > 0);
      if (!active && !elastic.owned) return false;
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      elastic.releaseFrame = null;
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
      const width = Math.max(wrapper.offsetWidth, wrapper.scrollWidth, 1);
      const height = Math.max(wrapper.offsetHeight, wrapper.scrollHeight, 1);
      const scaleX = 1 + 2 * (Math.max(elastic.amounts[1], elastic.amounts[3]) / width);
      const scaleY = 1 + 2 * (Math.max(elastic.amounts[0], elastic.amounts[2]) / height);
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
      if (root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        resetElastic(state);
        refresh(state);
        return;
      }
      elastic.wrapper.classList.add(elasticReleaseClass);
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      elastic.releaseFrame = root.requestAnimationFrame(() => stepElasticRelease(state));
    }
    function stepElasticRelease(state) {
      const elastic = state.elastic;
      elastic.releaseFrame = null;
      if (state.disposed || !elastic.owned) return;
      elastic.amounts = elastic.amounts.map((amount) => amount < ELASTIC_RETURN_EPSILON ? 0 : amount * (1 - ELASTIC_RETURN_LERP));
      if (elastic.amounts.every((amount) => amount === 0)) {
        resetElastic(state);
        refresh(state);
        return;
      }
      setElasticTransform(state);
      elastic.releaseFrame = root.requestAnimationFrame(() => stepElasticRelease(state));
    }
    function resetElastic(state) {
      const elastic = state.elastic;
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.releaseFrame = null;
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
      if (state.desktop && state.mode === "pointer" && state.pointerScroll && state.pointerScroll.moved) {
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
