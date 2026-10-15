/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/** Scrollbox Extension: native scroll progress with optional desktop pointer dragging. */
(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "scrollbox";
  if (!AelluxJs) throw new Error('[aellux.js] Load the boot script before the scrollbox extension.');

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
  const MOMENTUM_DECELERATION = 0.0015;
  const ELASTIC_DAMPING = 1 / 3;
  const ELASTIC_LIMIT_RATIO = 1 / 4;
  const ELASTIC_RELEASE_MS = 800;
  const ELASTIC_WHEEL_IDLE_MS = 80;
  const properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
  const paddingProperties = ["padding-top", "padding-right", "padding-bottom", "padding-left"];
  const scrollboxes = new Map();

  AelluxJs.extAttach(extensionName, { init, destroy });

  function init() {
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attribute}]`,
      mount: mountScrollbox, update: updateScrollbox, unmount: unmountScrollbox
    });
  }

  function destroy() {
    for (const element of scrollboxes.keys()) unmountScrollbox(element);
    AelluxJs.mountManager.remove({ extensionName });
  }

  function mountScrollbox(element) {
    if (scrollboxes.has(element)) return;
    const previous = properties.map(name => ({
      value: element.style.getPropertyValue(name),
      priority: element.style.getPropertyPriority(name)
    }));
    const computed = root.getComputedStyle(element);
    const elastic = {
      base: paddingProperties.map(name => parseFloat(computed.getPropertyValue(name)) || 0),
      previous: paddingProperties.map(name => ({
        value: element.style.getPropertyValue(name),
        priority: element.style.getPropertyPriority(name)
      })),
      amounts: [0, 0, 0, 0], active: false, owned: false, touch: null,
      releaseTimeout: null, wheelTimeout: null
    };
    const state = {
      element, previous, metrics: null, mode: null, desktop: false,
      wheelEnabled: true, momentumEnabled: true, elasticEnabled: false,
      wheelListening: false, pointerListening: false, touchListening: false,
      drag: null, momentum: null, elastic, resizeObserver: null, mutationObserver: null,
      lastResizeTime: -RESIZE_INTERVAL_MS, resizeTimeout: null, disposed: false
    };
    state.onScroll = () => publish(state);
    state.onWheel = event => handleWheel(state, event);
    state.onPointerDown = event => startDrag(state, event);
    state.onPointerMove = event => moveDrag(state, event);
    state.onPointerEnd = event => endDrag(state, event);
    state.onBlur = () => endDrag(state);
    state.onTouchStart = event => startTouch(state, event);
    state.onTouchMove = event => moveTouch(state, event);
    state.onTouchEnd = event => endTouch(state, event);
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
    if (state.pointerListening) element.removeEventListener("pointerdown", state.onPointerDown);
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
    state.elasticEnabled = element.hasAttribute(elasticAttribute) &&
      element.getAttribute(elasticAttribute) !== "false";
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
      state.pointerListening = true;
    } else if (!pointerEnabled && state.pointerListening) {
      element.removeEventListener("pointerdown", state.onPointerDown);
      state.pointerListening = false;
      endDrag(state);
    }
    refresh(state);
  }

  function readMode(element) {
    const value = (element.getAttribute(attribute) || "").trim().toLowerCase() || "native";
    if (value === "native" || value === "pointer") return value;
    AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_MODE_INVALID,
      { element, value });
    return "native";
  }

  function isDesktop() {
    return !!(root.matchMedia && root.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }

  function startDrag(state, event) {
    cancelMomentum(state);
    if (state.drag || event.defaultPrevented || event.button !== 0 || !event.isPrimary ||
      event.pointerType === "touch" || (event.buttons & 1) === 0) return;
    const element = state.element;
    const nested = event.target.closest(`[${attribute}]`);
    if (nested !== element || event.target.closest(
      "a, button, input, select, textarea, [contenteditable], [draggable='true']")) return;
    let metrics = nativeMetrics(element);
    if (metrics.maxX <= 0 && metrics.maxY <= 0) return;
    const rect = element.getBoundingClientRect();
    if (event.clientX >= rect.left + element.clientWidth ||
      event.clientY >= rect.top + element.clientHeight) return;
    if (state.elastic.owned) {
      resetElastic(state);
      refresh(state);
      metrics = state.metrics;
    }
    state.drag = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      scrollLeft: element.scrollLeft, scrollTop: element.scrollTop, moved: false,
      selectionPending: metrics.maxX <= 1 && metrics.maxY > 1,
      userSelectApplied: false,
      momentumStartX: element.scrollLeft, momentumStartY: element.scrollTop,
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
      if (Math.abs(dx) >= SELECTION_HORIZONTAL_THRESHOLD_PX &&
        Math.abs(dy) < SELECTION_VERTICAL_TOLERANCE_PX) {
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
    if (!drag || (event && event.pointerId !== drag.pointerId)) return;
    state.drag = null;
    root.removeEventListener("pointermove", state.onPointerMove, true);
    root.removeEventListener("pointerup", state.onPointerEnd, true);
    root.removeEventListener("pointercancel", state.onPointerEnd, true);
    root.removeEventListener("blur", state.onBlur);
    if (drag.userSelectApplied) {
      if (drag.userSelect) state.element.style.setProperty(
        "user-select", drag.userSelect, drag.userSelectPriority);
      else state.element.style.removeProperty("user-select");
    }
    const hadElastic = state.elastic.active;
    releaseElastic(state);
    if (event && event.type === "pointerup" && drag.moved && state.momentumEnabled &&
      !hadElastic && !state.disposed && now() - drag.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
      startMomentum(state, drag);
    }
  }

  function startMomentum(state, drag) {
    const element = state.element;
    const elapsed = Math.max(1, now() - drag.momentumStartTime);
    const x = momentumAxis(element.scrollLeft, drag.momentumStartX, elapsed,
      Math.max(0, element.scrollWidth - element.clientWidth));
    const y = momentumAxis(element.scrollTop, drag.momentumStartY, elapsed,
      Math.max(0, element.scrollHeight - element.clientHeight));
    if (x === element.scrollLeft && y === element.scrollTop) return;
    const momentum = {
      currentX: element.scrollLeft, currentY: element.scrollTop,
      toX: x, toY: y, frame: null
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
    const done = momentum.currentX.toFixed(3) === momentum.toX.toFixed(3) &&
      momentum.currentY.toFixed(3) === momentum.toY.toFixed(3);
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
      identifier: touch.identifier, x: touch.clientX, y: touch.clientY,
      scrollLeft: state.element.scrollLeft, scrollTop: state.element.scrollTop
    };
  }

  function moveTouch(state, event) {
    const start = state.elastic.touch;
    if (!start) return;
    let touch = null;
    for (const item of event.touches) {
      if (item.identifier === start.identifier) { touch = item; break; }
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
      if (desiredY < 0) amounts[0] = Math.min(element.clientHeight * ELASTIC_LIMIT_RATIO,
        (additive ? elastic.amounts[0] : 0) - desiredY * ELASTIC_DAMPING);
      else if (desiredY > metrics.maxY) amounts[2] = Math.min(element.clientHeight * ELASTIC_LIMIT_RATIO,
        (additive ? elastic.amounts[2] : 0) + (desiredY - metrics.maxY) * ELASTIC_DAMPING);
    }
    if (metrics.maxX > 1) {
      if (desiredX > metrics.maxX) amounts[1] = Math.min(element.clientWidth * ELASTIC_LIMIT_RATIO,
        (additive ? elastic.amounts[1] : 0) + (desiredX - metrics.maxX) * ELASTIC_DAMPING);
      else if (desiredX < 0) amounts[3] = Math.min(element.clientWidth * ELASTIC_LIMIT_RATIO,
        (additive ? elastic.amounts[3] : 0) - desiredX * ELASTIC_DAMPING);
    }
    const active = amounts.some(amount => amount > 0);
    if (!active && !elastic.owned) return false;
    if (elastic.releaseTimeout !== null) root.clearTimeout(elastic.releaseTimeout);
    elastic.releaseTimeout = null;
    element.classList.remove(elasticReleaseClass);
    elastic.amounts = amounts;
    elastic.active = active;
    elastic.owned = true;
    paddingProperties.forEach((name, index) =>
      element.style.setProperty(name, `${elastic.base[index] + amounts[index]}px`));
    return active;
  }

  function scrollWithinElasticBounds(state, desiredX, desiredY) {
    const element = state.element;
    const metrics = state.metrics || nativeMetrics(element);
    const amounts = state.elastic.amounts;
    element.scrollTo({
      left: amounts[1] > 0 ? Math.max(0, element.scrollWidth - element.clientWidth) :
        Math.max(0, Math.min(metrics.maxX, desiredX)),
      top: amounts[2] > 0 ? Math.max(0, element.scrollHeight - element.clientHeight) :
        Math.max(0, Math.min(metrics.maxY, desiredY)),
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
    state.element.classList.add(elasticReleaseClass);
    elastic.amounts = [0, 0, 0, 0];
    paddingProperties.forEach((name, index) =>
      state.element.style.setProperty(name, `${elastic.base[index]}px`));
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
    state.element.classList.remove(elasticReleaseClass);
    if (elastic.owned) paddingProperties.forEach((name, index) => {
      const previous = elastic.previous[index];
      if (previous.value) state.element.style.setProperty(name, previous.value, previous.priority);
      else state.element.style.removeProperty(name);
    });
    elastic.amounts = [0, 0, 0, 0];
    elastic.active = false;
    elastic.owned = false;
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
      state.mutationObserver = new root.MutationObserver(() => {
        if (state.resizeObserver) {
          state.resizeObserver.disconnect();
          state.resizeObserver.observe(state.element);
          for (const child of state.element.children) state.resizeObserver.observe(child);
        }
        refresh(state);
      });
      state.mutationObserver.observe(state.element,
        { childList: true, subtree: true, characterData: true });
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
    return root.performance && typeof root.performance.now === "function"
      ? root.performance.now() : Date.now();
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
    const converted = state.desktop && state.wheelEnabled && metrics.maxX > 1 &&
      metrics.maxY <= 1 && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
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
