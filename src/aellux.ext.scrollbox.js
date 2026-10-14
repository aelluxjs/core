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
  const RESIZE_INTERVAL_MS = 100;
  const DRAG_THRESHOLD_PX = 3;
  const MOMENTUM_LIMIT_TIME_MS = 300;
  const MOMENTUM_LIMIT_DISTANCE_PX = 15;
  const MOMENTUM_DECELERATION = 0.0015;
  const MOMENTUM_MAX_TIME_MS = 2500;
  const MOMENTUM_BOUNDARY_TIME_MS = 500;
  const properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
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
    const state = {
      element, previous, metrics: null, mode: null, desktop: false,
      wheelEnabled: true, momentumEnabled: true, wheelListening: false, pointerListening: false,
      drag: null, momentum: null, resizeObserver: null, mutationObserver: null,
      lastResizeTime: -RESIZE_INTERVAL_MS, resizeTimeout: null, disposed: false
    };
    state.onScroll = () => publish(state);
    state.onWheel = event => handleWheel(state, event);
    state.onPointerDown = event => startDrag(state, event);
    state.onPointerMove = event => moveDrag(state, event);
    state.onPointerEnd = event => endDrag(state, event);
    state.onBlur = () => endDrag(state);
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
    element.removeEventListener("scroll", state.onScroll);
    if (state.wheelListening) element.removeEventListener("wheel", state.onWheel, true);
    if (state.pointerListening) element.removeEventListener("pointerdown", state.onPointerDown);
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
    state.desktop = isDesktop();
    if (state.desktop && !state.wheelListening) {
      element.addEventListener("wheel", state.onWheel, { passive: false, capture: true });
      state.wheelListening = true;
    } else if (!state.desktop && state.wheelListening) {
      element.removeEventListener("wheel", state.onWheel, true);
      state.wheelListening = false;
    }
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
    const metrics = nativeMetrics(element);
    if (metrics.maxX <= 0 && metrics.maxY <= 0) return;
    const rect = element.getBoundingClientRect();
    if (event.clientX >= rect.left + element.clientWidth ||
      event.clientY >= rect.top + element.clientHeight) return;
    state.drag = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      scrollLeft: element.scrollLeft, scrollTop: element.scrollTop, moved: false,
      momentumStartX: element.scrollLeft, momentumStartY: element.scrollTop,
      momentumStartTime: now(),
      userSelect: element.style.getPropertyValue("user-select"),
      userSelectPriority: element.style.getPropertyPriority("user-select")
    };
    element.style.setProperty("user-select", "none");
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
    if (!drag.moved && dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
    drag.moved = true;
    if (event.cancelable) event.preventDefault();
    const time = now();
    const resetMomentum = time - drag.momentumStartTime > MOMENTUM_LIMIT_TIME_MS;
    state.element.scrollTo({
      left: drag.scrollLeft + dx, top: drag.scrollTop + dy, behavior: "instant"
    });
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
    if (drag.userSelect) state.element.style.setProperty(
      "user-select", drag.userSelect, drag.userSelectPriority);
    else state.element.style.removeProperty("user-select");
    if (event && event.type === "pointerup" && drag.moved && state.momentumEnabled &&
      !state.disposed && now() - drag.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
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
    const duration = Math.max(x.duration, y.duration);
    if (!duration) return;
    const momentum = {
      fromX: element.scrollLeft, fromY: element.scrollTop,
      toX: x.destination, toY: y.destination,
      startTime: now(), duration, frame: null
    };
    state.momentum = momentum;
    momentum.frame = root.requestAnimationFrame(() => stepMomentum(state, momentum));
  }

  function momentumAxis(current, start, elapsed, maximum) {
    const distance = current - start;
    if (Math.abs(distance) <= MOMENTUM_LIMIT_DISTANCE_PX) {
      return { destination: current, duration: 0 };
    }
    const speed = Math.abs(distance) / elapsed;
    const projected = current + Math.sign(distance) * speed * speed / MOMENTUM_DECELERATION;
    const destination = Math.max(0, Math.min(maximum, Math.round(projected)));
    if (destination === current) return { destination, duration: 0 };
    return {
      destination,
      duration: projected !== destination ? MOMENTUM_BOUNDARY_TIME_MS
        : Math.min(MOMENTUM_MAX_TIME_MS, 2 * speed / MOMENTUM_DECELERATION)
    };
  }

  function stepMomentum(state, momentum) {
    if (state.momentum !== momentum || state.disposed) return;
    const fraction = Math.min(1, (now() - momentum.startTime) / momentum.duration);
    const remaining = 1 - fraction;
    const eased = 1 - remaining * remaining * remaining * remaining;
    const element = state.element;
    element.scrollTo({
      left: momentum.fromX + (momentum.toX - momentum.fromX) * eased,
      top: momentum.fromY + (momentum.toY - momentum.fromY) * eased,
      behavior: "instant"
    });
    publish(state);
    if (fraction >= 1) {
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
    state.metrics = nativeMetrics(state.element);
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
    cancelMomentum(state);
    if (!state.desktop || event.defaultPrevented) return;
    const metrics = state.metrics;
    if (!metrics || metrics.maxX <= 1 || metrics.maxY > 1 || !state.wheelEnabled) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
    const delta = event.deltaY * factor;
    if (!delta) return;
    const current = state.element.scrollLeft;
    const next = Math.max(0, Math.min(metrics.maxX, current + delta));
    if (next === current) return;
    event.preventDefault();
    state.element.scrollTo({ left: next, behavior: "instant" });
    publish(state);
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
