(() => {
  // src/aellux.ext.scrollbox-snap.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "scrollbox-snap";
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the scrollbox-snap extension.");
    const POINTER = "pointer", GESTURE = "gesture", TOUCH = "touch", HORIZONTAL = "x", VERTICAL = "y", FALSE = "false", INSTANT = "instant", SMOOTH = "smooth", START = "start", END = "end", CENTER = "center", SCROLL_EVENT = "$scroll", SCROLL_END_EVENT = "$scrollend", INTERACTION_EVENT = "$AelluxJsScrollboxInteraction", SNAP_GESTURE_EVENT = "$AelluxJsScrollboxSnapGesture", SCROLLBOX_WHEEL_EVENT = "$AelluxJsScrollboxWheel", POINTER_DOWN_EVENT = "$pointerdown", POINTER_UP_EVENT = "$pointerup", POINTER_CANCEL_EVENT = "$pointercancel", TOUCH_START_EVENT = "$touchstart", TOUCH_END_EVENT = "$touchend", TOUCH_CANCEL_EVENT = "$touchcancel";
    const SNAP_SCROLL_IDLE_MS = 120;
    const SNAP_TARGET_IDLE_MS = 500;
    const SNAP_RELEASE_MS = 300;
    const SNAP_SWIPE_SPEED_PX_MS = 0.5;
    const SNAP_FLICK_WINDOW_MS = 100;
    const SNAP_FLICK_FAST_TIME_MS = 50;
    const SNAP_FLICK_MAX_DISTANCE_PX = 100;
    const SNAP_FLICK_MIN_DISTANCE_PX = 1;
    const scrollboxAttribute = AelluxJs.attr("scrollbox");
    const wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
    const snapAttribute = AelluxJs.attr("scrollbox-snap");
    const itemAttribute = AelluxJs.attr("snap-item");
    const elasticAttribute = AelluxJs.attr("scrollbox-elastic");
    const readyClass = AelluxJs.className("snap-ready");
    const suspendedClass = AelluxJs.className("snap-suspended");
    const properties = ["--ae-snap-viewport", "--ae-snap-focus"];
    const states = /* @__PURE__ */ new Map();
    AelluxJs.extAttach(extensionName, { init, destroy, next, previous, goto });
    function init() {
      if (!AelluxJs.registry.ext.scrollbox) AelluxJs.ext("scrollbox");
      return AelluxJs.wait("scrollbox").then((scrollbox) => {
        if (!scrollbox) throw new Error("[aellux.js] Scrollbox Snap requires the Scrollbox extension.");
        AelluxJs.registerCssProperty(...properties.map((name) => ({ name, syntax: "<number>", initialValue: "0" })));
        scrollbox.registerSnapController({ next, previous, goto });
        AelluxJs.mountManager.add({
          extensionName,
          selector: `[${scrollboxAttribute}][${snapAttribute}]:not([${snapAttribute}="${FALSE}"])`,
          priority: 1,
          mount,
          update,
          unmount,
          controllers: []
        });
      });
    }
    function destroy() {
      var _a;
      for (const element of states.keys()) unmount(element);
      (_a = AelluxJs.ext.scrollbox) == null ? void 0 : _a.unregisterSnapController({ next, previous, goto });
      AelluxJs.mountManager.remove({ extensionName });
    }
    function mount(element) {
      if (states.has(element)) return;
      const state = {
        element,
        root: null,
        index: 0,
        notifiedItem: null,
        notifiedIndex: null,
        target: null,
        targetAxis: null,
        timeout: null,
        wheelTimeout: null,
        edgeWheelTimeout: null,
        frame: null,
        activePointers: /* @__PURE__ */ new Set(),
        activeTouches: /* @__PURE__ */ new Set(),
        savedItems: /* @__PURE__ */ new Map(),
        suspensions: /* @__PURE__ */ new Set(),
        pointerScroll: null,
        flick: null,
        release: false,
        observer: null,
        resizeObserver: null,
        disposed: false
      };
      state.onScroll = () => {
        updateValues(state);
        scheduleSettle(state, state.target !== null && !targetReached(state));
      };
      state.onScrollEnd = (event) => {
        if (event.target !== state.element || state.target !== null && !targetReached(state)) return;
        finish(state);
      };
      state.onPointerDown = (event) => beginGesture(state, POINTER, event);
      state.onPointerEnd = (event) => endGesture(state, POINTER, event);
      state.onTouchStart = (event) => beginGesture(state, TOUCH, event);
      state.onTouchEnd = (event) => endGesture(state, TOUCH, event);
      state.onBlur = () => {
        if (!hasActiveGesture(state)) return;
        state.activePointers.clear();
        state.activeTouches.clear();
        state.pointerScroll = null;
        state.flick = null;
        endDesktopGesture(state);
      };
      state.onScrollboxWheel = (event) => {
        var _a;
        if (handleWheel(state, (_a = event.detail) == null ? void 0 : _a.event)) event.preventDefault();
      };
      state.onInteraction = (event) => setSuspension(state, event.detail);
      state.onSnapGesture = (event) => handlePointerScroll(state, event);
      states.set(element, state);
      AelluxJs.onEvent(element, SCROLL_EVENT, state.onScroll, { passive: true });
      AelluxJs.onEvent(element, SCROLL_END_EVENT, state.onScrollEnd, { passive: true });
      AelluxJs.onEvent(element, POINTER_DOWN_EVENT, state.onPointerDown, true);
      AelluxJs.onEvent(element, TOUCH_START_EVENT, state.onTouchStart, { passive: true, capture: true });
      AelluxJs.onEvent(element, INTERACTION_EVENT, state.onInteraction);
      AelluxJs.onEvent(element, SNAP_GESTURE_EVENT, state.onSnapGesture);
      AelluxJs.onEvent(element, SCROLLBOX_WHEEL_EVENT, state.onScrollboxWheel);
      AelluxJs.onEvent(root, POINTER_UP_EVENT, state.onPointerEnd, true);
      AelluxJs.onEvent(root, POINTER_CANCEL_EVENT, state.onPointerEnd, true);
      AelluxJs.onEvent(root, TOUCH_END_EVENT, state.onTouchEnd, true);
      AelluxJs.onEvent(root, TOUCH_CANCEL_EVENT, state.onTouchEnd, true);
      AelluxJs.onEvent(root, "$blur", state.onBlur);
      observe(state);
      configure(state);
    }
    function update(element) {
      const state = states.get(element);
      if (state) configure(state);
    }
    function unmount(element) {
      var _a, _b;
      const state = states.get(element);
      if (!state) return;
      state.disposed = true;
      cancelRelease(state);
      clearTimer(state, "timeout");
      clearTimer(state, "wheelTimeout");
      clearTimer(state, "edgeWheelTimeout");
      (_a = state.observer) == null ? void 0 : _a.disconnect();
      (_b = state.resizeObserver) == null ? void 0 : _b.disconnect();
      AelluxJs.offEvent(element, SCROLL_EVENT, state.onScroll);
      AelluxJs.offEvent(element, SCROLL_END_EVENT, state.onScrollEnd);
      AelluxJs.offEvent(element, POINTER_DOWN_EVENT, state.onPointerDown, true);
      AelluxJs.offEvent(element, TOUCH_START_EVENT, state.onTouchStart, true);
      AelluxJs.offEvent(element, INTERACTION_EVENT, state.onInteraction);
      AelluxJs.offEvent(element, SNAP_GESTURE_EVENT, state.onSnapGesture);
      AelluxJs.offEvent(element, SCROLLBOX_WHEEL_EVENT, state.onScrollboxWheel);
      AelluxJs.offEvent(root, POINTER_UP_EVENT, state.onPointerEnd, true);
      AelluxJs.offEvent(root, POINTER_CANCEL_EVENT, state.onPointerEnd, true);
      AelluxJs.offEvent(root, TOUCH_END_EVENT, state.onTouchEnd, true);
      AelluxJs.offEvent(root, TOUCH_CANCEL_EVENT, state.onTouchEnd, true);
      AelluxJs.offEvent(root, "$blur", state.onBlur);
      restoreItems(state);
      element.classList.remove(readyClass, suspendedClass);
      states.delete(element);
    }
    function configure(state) {
      const nextRoot = elasticRoot(state.element);
      if (state.root !== nextRoot) {
        restoreItems(state);
        state.root = nextRoot;
        state.index = 0;
        state.notifiedItem = null;
        state.notifiedIndex = null;
      }
      const items = itemsFor(state);
      if (!items.length) {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_SCROLLBOX_SNAP_ITEMS,
          { element: state.element }
        );
        state.element.classList.remove(readyClass, suspendedClass);
        return;
      }
      state.element.classList.add(readyClass);
      updateValues(state);
      if (state.notifiedItem === null) goto(state.element, 0, INSTANT);
    }
    function observe(state) {
      state.observer = new root.MutationObserver(() => configure(state));
      state.observer.observe(state.element, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [snapAttribute, itemAttribute, elasticAttribute]
      });
      if (root.ResizeObserver) {
        state.resizeObserver = new root.ResizeObserver(() => updateValues(state));
        state.resizeObserver.observe(state.element);
      }
    }
    function elasticRoot(element) {
      return Array.from(element.children).find((child) => child.hasAttribute(elasticAttribute)) || element;
    }
    function itemsFor(state) {
      if (!state.root) return [];
      return Array.from(state.root.querySelectorAll(`[${itemAttribute}]`)).filter((item) => item.closest(`[${scrollboxAttribute}]`) === state.element);
    }
    function axisFor(state) {
      return state.element.getAttribute(snapAttribute) === "vertical" ? VERTICAL : HORIZONTAL;
    }
    function alignment(item) {
      const value = item.getAttribute(itemAttribute);
      if (value === START || value === "left" || value === "top") return START;
      if (value === END || value === "right" || value === "bottom") return END;
      return CENTER;
    }
    function offset(state, item, axis = axisFor(state), free, box = state.element.getBoundingClientRect(), target = item.getBoundingClientRect()) {
      const horizontal = axis === HORIZONTAL;
      const start = horizontal ? box.left + state.element.clientLeft : box.top + state.element.clientTop;
      const size = horizontal ? state.element.clientWidth : state.element.clientHeight;
      const itemStart = horizontal ? target.left : target.top;
      const itemSize = horizontal ? target.width : target.height;
      if (free && itemSize > size)
        return Math.max(itemStart - start, Math.min(itemStart + itemSize - start - size, 0));
      if (alignment(item) === START) return itemStart - start;
      if (alignment(item) === END) return itemStart + itemSize - (start + size);
      return itemStart + itemSize / 2 - (start + size / 2);
    }
    function updateValues(state) {
      if (state.disposed) return;
      const axis = axisFor(state), element = state.element;
      const rect = element.getBoundingClientRect();
      const size = axis === HORIZONTAL ? element.clientWidth : element.clientHeight;
      if (!size) return;
      const center = axis === HORIZONTAL ? rect.left + element.clientLeft + size / 2 : rect.top + element.clientTop + size / 2;
      for (const item of itemsFor(state)) {
        if (!state.savedItems.has(item)) {
          state.savedItems.set(item, AelluxJs.persist.element.save(item, [], properties));
        }
        const box = item.getBoundingClientRect();
        const itemCenter = axis === HORIZONTAL ? box.left + box.width / 2 : box.top + box.height / 2;
        item.style.setProperty(properties[0], Math.max(-2, Math.min(2, (itemCenter - center) * 2 / size)));
        item.style.setProperty(properties[1], Math.max(0, 1 - Math.abs(offset(state, item, axis, false, rect, box)) / size));
      }
    }
    function restoreItems(state) {
      for (const memory of state.savedItems.values()) memory.restore();
      state.savedItems.clear();
    }
    function goto(element, index, behavior = SMOOTH, free) {
      const state = states.get(element), items = state && itemsFor(state);
      if (!state || state.activeTouches.size || !Number.isInteger(index) || index < 0 || index >= items.length) return false;
      const axis = axisFor(state), metrics = metricsFor(element);
      const position = axis === HORIZONTAL ? element.scrollLeft : element.scrollTop;
      const destination = Math.max(0, Math.min(
        metrics[axis],
        position + offset(state, items[index], axis, free)
      ));
      state.index = index;
      state.target = destination;
      state.targetAxis = axis;
      cancelRelease(state);
      if (state.release && behavior === SMOOTH) animateRelease(state, position, destination, axis);
      else scrollTo(state, destination, axis, behavior);
      if (targetReached(state)) {
        cancelRelease(state);
        finish(state);
      }
      return true;
    }
    function scrollTo(state, position, axis, behavior) {
      state.element.scrollTo(axis === HORIZONTAL ? { left: position, behavior } : { top: position, behavior });
    }
    function cancelRelease(state) {
      if (state.frame !== null) root.cancelAnimationFrame(state.frame);
      state.frame = null;
    }
    function animateRelease(state, from, to, axis) {
      const start = root.performance.now();
      const step = (time) => {
        const progress = Math.max(0, Math.min(1, (time - start) / SNAP_RELEASE_MS));
        scrollTo(state, from + (to - from) * (1 - Math.pow(1 - progress, 3)), axis, INSTANT);
        if (progress < 1) state.frame = root.requestAnimationFrame(step);
        else {
          cancelRelease(state);
          finish(state);
        }
      };
      state.frame = root.requestAnimationFrame(step);
    }
    function next(element) {
      const state = states.get(element);
      return state ? goto(element, Math.min(itemsFor(state).length - 1, selectedIndex(state) + 1)) : false;
    }
    function previous(element) {
      const state = states.get(element);
      return state ? goto(element, Math.max(0, selectedIndex(state) - 1)) : false;
    }
    function selectedIndex(state, free) {
      const items = itemsFor(state);
      const axis = axisFor(state), maximum = metricsFor(state.element)[axis];
      const position = axis === HORIZONTAL ? state.element.scrollLeft : state.element.scrollTop;
      if (items.length > 1) {
        if (position <= 1) return 0;
        if (maximum > 0 && position >= maximum - 1) return items.length - 1;
      }
      let nearest = 0, distance = Infinity;
      for (let index = 0; index < items.length; index++) {
        const candidate = Math.abs(Math.max(0, Math.min(
          maximum,
          position + offset(state, items[index], axis, free)
        )) - position);
        if (candidate < distance) {
          nearest = index;
          distance = candidate;
        }
      }
      return nearest;
    }
    function handleWheel(state, event) {
      if (!event || event.ctrlKey || !event.cancelable || event.defaultPrevented || event.target.closest(`[${scrollboxAttribute}]`) !== state.element) return false;
      const axis = axisFor(state), horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (axis === HORIZONTAL && !horizontal && state.element.getAttribute(wheelAttribute) === FALSE) return false;
      const delta = axis === HORIZONTAL ? horizontal ? event.deltaX : event.deltaY : horizontal ? 0 : event.deltaY;
      if (!delta) return false;
      const items = itemsFor(state), index = state.target !== null ? state.index : selectedIndex(state);
      if (!items.length) return false;
      const nextIndex = index + Math.sign(delta);
      if (nextIndex < 0 || nextIndex >= items.length) {
        if (state.target !== null && !targetReached(state)) {
          event.preventDefault();
          return true;
        }
        const behavior = root.getComputedStyle(state.element)[axis === HORIZONTAL ? "overscrollBehaviorX" : "overscrollBehaviorY"];
        if (behavior === "contain" || behavior === "none") {
          event.preventDefault();
          return true;
        }
        setSuspension(state, { reason: "wheel-edge", active: true });
        clearTimer(state, "edgeWheelTimeout");
        state.edgeWheelTimeout = root.setTimeout(() => {
          state.edgeWheelTimeout = null;
          setSuspension(state, { reason: "wheel-edge", active: false });
        }, SNAP_SCROLL_IDLE_MS);
        return false;
      }
      event.preventDefault();
      if (state.wheelTimeout !== null) return true;
      state.wheelTimeout = root.setTimeout(() => {
        state.wheelTimeout = null;
      }, SNAP_SCROLL_IDLE_MS);
      goto(state.element, nextIndex);
      return true;
    }
    function setSuspension(state, detail) {
      if (!detail || !detail.reason) return;
      if (detail.active) state.suspensions.add(detail.reason);
      else state.suspensions.delete(detail.reason);
      state.element.classList.toggle(suspendedClass, state.suspensions.size > 0);
      if (!detail.active) {
        settlePointer(state);
        if (!state.suspensions.size) scheduleSettle(state);
      }
    }
    function handlePointerScroll(state, event) {
      var _a;
      const detail = event.detail;
      if (!detail || detail.axis !== axisFor(state)) return;
      const items = itemsFor(state);
      if (!items.length) return;
      if (detail.phase === "start" || detail.phase === "probe") {
        state.pointerScroll = { axis: detail.axis, index: selectedIndex(state) };
        if (detail.phase === "start") state.flick = null;
        else event.preventDefault();
        return;
      }
      if (detail.phase !== "end") return;
      const start = ((_a = state.pointerScroll) == null ? void 0 : _a.axis) === detail.axis ? state.pointerScroll.index : selectedIndex(state);
      state.pointerScroll = null;
      const flick = isFlick(detail);
      if (!detail.moved && !flick) return;
      event.preventDefault();
      if (!flick) return;
      const distance = detail.axis === HORIZONTAL ? detail.startX - detail.lastX : detail.startY - detail.lastY;
      const index = Math.max(0, Math.min(
        items.length - 1,
        start + Math.sign(distance)
      ));
      if (index !== start) state.flick = index;
    }
    function isFlick(detail) {
      const distance = detail.axis === HORIZONTAL ? detail.startX - detail.lastX : detail.startY - detail.lastY;
      const elapsed = Math.max(1, detail.endTime - detail.startTime);
      return elapsed <= SNAP_FLICK_WINDOW_MS && Math.abs(distance) > SNAP_FLICK_MIN_DISTANCE_PX && Math.abs(distance) < SNAP_FLICK_MAX_DISTANCE_PX && (elapsed <= SNAP_FLICK_FAST_TIME_MS || Math.abs(distance) / elapsed >= SNAP_SWIPE_SPEED_PX_MS);
    }
    function beginGesture(state, kind, event) {
      const active = kind === POINTER ? state.activePointers : state.activeTouches;
      if (kind === POINTER) active.add(event.pointerId);
      else for (const touch of event.changedTouches) active.add(touch.identifier);
      state.target = null;
      state.release = false;
      cancelRelease(state);
      state.pointerScroll = null;
      state.flick = null;
      clearTimer(state, "timeout");
      if (kind === POINTER && event.pointerType !== TOUCH) {
        const element = state.element, left = element.scrollLeft, top = element.scrollTop;
        setSuspension(state, { reason: GESTURE, active: true });
        element.scrollTo({
          left: left > 0 ? left - 1 : 1,
          top: top > 0 ? top - 1 : 1,
          behavior: INSTANT
        });
        element.scrollTo({ left, top, behavior: INSTANT });
      } else setSuspension(state, { reason: GESTURE, active: false });
    }
    function endGesture(state, kind, event) {
      const active = kind === POINTER ? state.activePointers : state.activeTouches;
      if (kind === POINTER) active.delete(event.pointerId);
      else for (const touch of event.changedTouches) active.delete(touch.identifier);
      if (!hasActiveGesture(state)) endDesktopGesture(state);
    }
    function hasActiveGesture(state) {
      return state.activePointers.size || state.activeTouches.size;
    }
    function endDesktopGesture(state) {
      if (!state.suspensions.has(GESTURE)) {
        scheduleSettle(state);
        return;
      }
      state.release = true;
      root.setTimeout(() => settlePointer(state), 0);
    }
    function settlePointer(state) {
      if (state.disposed || !releaseReady(state) || state.target !== null || hasActiveGesture(state)) return;
      const flick = state.flick;
      state.flick = null;
      goto(
        state.element,
        flick !== null ? flick : selectedIndex(state, true),
        AelluxJs.currentPreference("reduced-motion") === "reduced" ? INSTANT : SMOOTH,
        flick === null
      );
    }
    function releaseReady(state) {
      return state.release && state.suspensions.size === 1;
    }
    function scheduleSettle(state, target) {
      if (!target && (hasActiveGesture(state) || state.suspensions.size && !state.release)) return;
      clearTimer(state, "timeout");
      state.timeout = root.setTimeout(() => finish(state), target ? SNAP_TARGET_IDLE_MS : SNAP_SCROLL_IDLE_MS);
    }
    function finish(state) {
      if (state.disposed || state.frame !== null || hasActiveGesture(state)) return;
      if (state.suspensions.size) {
        if (!releaseReady(state) || !targetReached(state)) return;
        state.release = false;
        setSuspension(state, { reason: GESTURE, active: false });
      }
      clearTimer(state, "timeout");
      cancelRelease(state);
      state.target = null;
      const items = itemsFor(state), index = selectedIndex(state), item = items[index];
      if (!item || state.notifiedItem === item && state.notifiedIndex === index) return;
      const previousIndex = state.notifiedIndex;
      state.index = index;
      state.notifiedItem = item;
      state.notifiedIndex = index;
      AelluxJs.dispatchFrom(state.element, "ScrollboxSnapChange", {
        detail: { item, index, previousIndex, axis: axisFor(state) }
      });
    }
    function targetReached(state) {
      if (state.target === null) return false;
      const position = state.targetAxis === HORIZONTAL ? state.element.scrollLeft : state.element.scrollTop;
      return Math.abs(position - state.target) <= 1;
    }
    function clearTimer(state, name) {
      if (state[name] !== null) root.clearTimeout(state[name]);
      state[name] = null;
    }
    function metricsFor(element) {
      return {
        x: Math.max(0, element.scrollWidth - element.clientWidth),
        y: Math.max(0, element.scrollHeight - element.clientHeight)
      };
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.scrollbox-snap.js.map
