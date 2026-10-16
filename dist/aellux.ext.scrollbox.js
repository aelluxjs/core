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
    const snapAttribute = AelluxJs.attr("scrollbox-snap");
    const scrollbarAttribute = AelluxJs.attr("scrollbar");
    const scrollbarVerticalAttribute = AelluxJs.attr("scrollbar-vertical");
    const scrollbarHorizontalAttribute = AelluxJs.attr("scrollbar-horizontal");
    const elasticReleaseClass = AelluxJs.className("scrollbox-elastic-release");
    const pointerScrollingClass = AelluxJs.className("pointerscrolling");
    const nativeScrollbarHideClass = AelluxJs.className("native-sb-hide");
    const scrollbarVisibleClass = AelluxJs.className("scrollbar-visible");
    const scrollEdgeClasses = [
      AelluxJs.className("scroll-v-start"),
      AelluxJs.className("scroll-v-end"),
      AelluxJs.className("scroll-h-start"),
      AelluxJs.className("scroll-h-end")
    ];
    const pointerScrollExceptionSelector = `a, button, input, select, textarea, [contenteditable], [draggable='true'], [${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`;
    const RESIZE_INTERVAL_MS = 100;
    const SCROLL_EDGE_MARGIN_PX = 5;
    const POINTER_SCROLL_THRESHOLD_PX = 3;
    const POINTER_SCROLL_MULTICLICK_MS = 500;
    const POINTER_SCROLL_MULTICLICK_DISTANCE_PX = 8;
    const TEXT_SELECTION_WAIT_MS = 100;
    const VERTICAL_TEXT_DRAG_PX = 10;
    const MOMENTUM_LIMIT_TIME_MS = 300;
    const MOMENTUM_LIMIT_DISTANCE_PX = 15;
    const MOMENTUM_DECELERATION = 15e-4;
    const SNAP_SWIPE_SPEED_PX_MS = 0.5;
    const SNAP_FLICK_WINDOW_MS = 200;
    const SNAP_FLICK_FAST_TIME_MS = 50;
    const SNAP_FLICK_MAX_DISTANCE_PX = 100;
    const SNAP_FLICK_MIN_DISTANCE_PX = 1;
    const SNAP_DRAG_DISTANCE_RATIO = 0.25;
    const SNAP_SCROLL_IDLE_MS = 120;
    const SNAP_WHEEL_IDLE_MS = 120;
    const SNAP_EDGE_DISTANCE_PX = 10;
    const ELASTIC_DAMPING = 1 / 3;
    const DEFAULT_ELASTIC_LIMIT = { unit: "ratio", value: 1 / 4 };
    const ELASTIC_RETURN_LERP = 0.15;
    const ELASTIC_RETURN_EPSILON = 0.01;
    const ELASTIC_WHEEL_IDLE_MS = 80;
    const SCROLLBAR_SIZE_PX = 8;
    const SCROLLBAR_MIN_THUMB_PX = 20;
    const SCROLLBAR_PDS_HIDE_DELAY_MS = 1e3;
    const scrollbarProperties = [
      "--ae-scrollbar-x",
      "--ae-scrollbar-y",
      "--ae-scrollbar-length",
      "--ae-scrollbar-thumb-size",
      "--ae-scrollbar-thumb-position",
      "--ae-scrollbar-display"
    ];
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
    const snapProperties = ["--ae-snap-viewport", "--ae-snap-focus"];
    const scrollboxes = /* @__PURE__ */ new Map();
    let activePointerScrollState = null;
    AelluxJs.extAttach(extensionName, { init, destroy, next, previous, goto });
    function init() {
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${attribute}]`,
        priority: 0,
        mount: mountScrollbox,
        update: updateScrollbox,
        unmount: unmountScrollbox,
        controllers: ["next", "previous", "goto"]
      });
    }
    function destroy() {
      for (const element of scrollboxes.keys()) unmountScrollbox(element);
      AelluxJs.mountManager.remove({ extensionName });
    }
    function mountScrollbox(element) {
      if (scrollboxes.has(element)) return;
      const previous2 = properties.map((name) => ({
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
      const snap = {
        wrapper: null,
        initialized: false,
        invalidReported: false,
        pending: null,
        index: 0,
        wheelTarget: null,
        notifiedItem: null,
        notifiedIndex: null,
        scrollEndTimeout: null,
        wheelTimeout: null
      };
      const inlineWrapper = {
        element: null,
        previousDisplay: null,
        owned: false,
        reportedDisplay: null
      };
      const scrollbar = {
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
      const state = {
        element,
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
        elastic,
        snap,
        inlineWrapper,
        scrollbar,
        resizeObserver: null,
        mutationObserver: null,
        publishPending: false,
        publishDirty: false,
        layoutRevision: 0,
        lastResizeTime: -RESIZE_INTERVAL_MS,
        resizeTimeout: null,
        disposed: false
      };
      state.onScroll = () => {
        publish(state);
        if (state.snapEnabled && !("onscrollend" in element)) scheduleScrollEnd(state);
      };
      state.onScrollEnd = () => finishNativeScroll(state);
      state.onWheel = (event) => handleWheel(state, event);
      state.onClick = (event) => handleSnapClick(state, event);
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
      state.onScrollbarPointerEnter = (event) => {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", true);
      };
      state.onScrollbarPointerLeave = (event) => {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", false);
      };
      state.onScrollbarMouseEnter = () => setScrollbarHover(state, "mouseHover", true);
      state.onScrollbarMouseLeave = () => setScrollbarHover(state, "mouseHover", false);
      state.onScrollbarOutsideDown = (event) => {
        if (!element.contains(event.target)) {
          scrollbar.pointerHover = false;
          scrollbar.mouseHover = false;
          if (!element.classList.contains(pointerScrollingClass))
            clearScrollbarPdsVisibility(state);
          syncScrollbarVisibility(state);
        }
      };
      scrollboxes.set(element, state);
      element.addEventListener("scroll", state.onScroll, { passive: true });
      element.addEventListener("scrollend", state.onScrollEnd, { passive: true });
      element.addEventListener("click", state.onClick);
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
      if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
        endPointerScroll(activePointerScrollState);
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
      properties.forEach((name, index) => {
        const original = state.previous[index];
        if (original.value) element.style.setProperty(name, original.value, original.priority);
        else element.style.removeProperty(name);
      });
      for (const name of scrollEdgeClasses) element.classList.remove(name);
      scrollboxes.delete(element);
    }
    function configure(state) {
      const element = state.element;
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
        element.addEventListener("wheel", state.onWheel, { passive: false, capture: true });
        state.wheelListening = true;
      } else if (!state.desktop && !state.elasticEnabled && !state.snapEnabled && state.wheelListening) {
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
        if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
          endPointerScroll(activePointerScrollState);
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
      return Array.from(element.children).filter((child) => !child.hasAttribute(scrollbarVerticalAttribute) && !child.hasAttribute(scrollbarHorizontalAttribute));
    }
    function scrollbarAxes(value) {
      if (value === null) return { x: false, y: false };
      const tokens = value.toLowerCase().trim().split(/[\s,|/+]+/).filter(Boolean);
      if (!tokens.length) return { x: true, y: true };
      const axes = { x: false, y: false };
      for (const token of tokens) {
        const short = token.replace(/horizontal/g, "h").replace(/vertical/g, "v");
        if (!/^[vhxy]+$/.test(short)) continue;
        if (/[hx]/.test(short)) axes.x = true;
        if (/[vy]/.test(short)) axes.y = true;
      }
      return axes;
    }
    function configureScrollbars(state) {
      const element = state.element;
      const axes = scrollbarAxes(element.getAttribute(scrollbarAttribute));
      configureScrollbarAxis(state, "y", axes.y, scrollbarVerticalAttribute);
      configureScrollbarAxis(state, "x", axes.x, scrollbarHorizontalAttribute);
      const enabled = axes.x || axes.y;
      const scrollbar = state.scrollbar;
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
      const scrollbar = state.scrollbar;
      const current = scrollbar[axis];
      let element = null;
      if (enabled) element = Array.from(state.element.children).find((child) => child.hasAttribute(attributeName)) || null;
      if (current && current.element === element && enabled) return;
      if (current) resetScrollbarAxis(state, axis);
      if (!enabled) return;
      const owned = !element;
      if (!element) {
        element = root.document.createElement("div");
        element.setAttribute(attributeName, "");
        state.element.appendChild(element);
      }
      const previous2 = scrollbarProperties.map((name) => ({
        name,
        value: element.style.getPropertyValue(name),
        priority: element.style.getPropertyPriority(name)
      }));
      const record = {
        element,
        owned,
        previous: previous2,
        axis,
        x: null,
        y: null,
        thumbPosition: null,
        thumbSize: null,
        trackSize: null,
        max: null,
        display: null
      };
      record.onPointerDown = (event) => startScrollbarDrag(state, record, event);
      record.onPointerMove = (event) => moveScrollbarDrag(state, record, event);
      record.onPointerEnd = (event) => endScrollbarDrag(state, record, event);
      element.addEventListener("pointerdown", record.onPointerDown);
      element.addEventListener("pointermove", record.onPointerMove);
      element.addEventListener("pointerup", record.onPointerEnd);
      element.addEventListener("pointercancel", record.onPointerEnd);
      scrollbar[axis] = record;
    }
    function resetScrollbarAxis(state, axis) {
      const record = state.scrollbar[axis];
      if (!record) return;
      endScrollbarDrag(state, record);
      const element = record.element;
      element.removeEventListener("pointerdown", record.onPointerDown);
      element.removeEventListener("pointermove", record.onPointerMove);
      element.removeEventListener("pointerup", record.onPointerEnd);
      element.removeEventListener("pointercancel", record.onPointerEnd);
      if (record.owned) element.remove();
      else for (const original of record.previous) {
        if (original.value) element.style.setProperty(
          original.name,
          original.value,
          original.priority
        );
        else element.style.removeProperty(original.name);
      }
      state.scrollbar[axis] = null;
    }
    function resetScrollbars(state) {
      resetScrollbarAxis(state, "x");
      resetScrollbarAxis(state, "y");
      const scrollbar = state.scrollbar;
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
      const scrollbar = state.scrollbar;
      if (scrollbar.listening && (scrollbar.pointerHover || scrollbar.mouseHover || scrollbar.drag || scrollbar.pdsVisible)) showScrollbars(state);
      else hideScrollbars(state);
    }
    function clearScrollbarPdsVisibility(state) {
      const scrollbar = state.scrollbar;
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
      state.scrollbar.hideTimeout = root.setTimeout(() => {
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
      if (state.scrollbar.visibleOwned)
        state.element.classList.remove(scrollbarVisibleClass);
      state.scrollbar.visibleOwned = false;
    }
    function readScrollbars(state, metrics, axes) {
      const element = state.element;
      const values = [];
      for (const axis of ["x", "y"]) {
        const record = state.scrollbar[axis];
        if (!record) continue;
        const vertical = axis === "y";
        const trackSize = vertical ? element.clientHeight : element.clientWidth;
        const max = vertical ? metrics.maxY : metrics.maxX;
        const scrollSize = trackSize + max;
        const thumbSize = max > 1 ? Math.min(
          trackSize,
          Math.max(SCROLLBAR_MIN_THUMB_PX, trackSize * trackSize / scrollSize)
        ) : 0;
        const position = vertical ? element.scrollTop : element.scrollLeft;
        const thumbPosition = max > 0 ? (trackSize - thumbSize) * progress(position, max) : 0;
        const x = element.scrollLeft + (vertical ? element.clientWidth - SCROLLBAR_SIZE_PX : 0);
        const y = element.scrollTop + (vertical ? 0 : element.clientHeight - SCROLLBAR_SIZE_PX);
        const display = axes[axis] ? "block" : "none";
        values.push({
          record,
          x,
          y,
          trackSize,
          thumbSize,
          thumbPosition,
          max: axes[axis] ? max : 0,
          display
        });
      }
      return values;
    }
    function updateScrollbars(state, values) {
      for (const { record, x, y, trackSize, thumbSize, thumbPosition, max, display } of values) {
        if (state.scrollbar[record.axis] !== record) continue;
        const style = record.element.style;
        if (record.x !== x) style.setProperty("--ae-scrollbar-x", `${x}px`);
        if (record.y !== y) style.setProperty("--ae-scrollbar-y", `${y}px`);
        if (record.trackSize !== trackSize)
          style.setProperty("--ae-scrollbar-length", `${trackSize}px`);
        if (record.thumbSize !== thumbSize)
          style.setProperty("--ae-scrollbar-thumb-size", `${thumbSize}px`);
        if (record.thumbPosition !== thumbPosition)
          style.setProperty("--ae-scrollbar-thumb-position", `${thumbPosition}px`);
        if (record.display !== display)
          style.setProperty("--ae-scrollbar-display", display);
        record.x = x;
        record.y = y;
        record.trackSize = trackSize;
        record.thumbSize = thumbSize;
        record.thumbPosition = thumbPosition;
        record.max = max;
        record.display = display;
      }
    }
    function scrollbarPointerPosition(record, event) {
      const rect = record.element.getBoundingClientRect();
      return record.axis === "y" ? event.clientY - rect.top : event.clientX - rect.left;
    }
    function startScrollbarDrag(state, record, event) {
      if (state.disposed || event.button !== 0 || !record.max) return;
      if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
        endPointerScroll(activePointerScrollState);
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      const position = scrollbarPointerPosition(record, event);
      if (event.pointerType !== "touch") state.scrollbar.pointerHover = true;
      showScrollbars(state);
      if (position < record.thumbPosition || position > record.thumbPosition + record.thumbSize) {
        const travel = record.trackSize - record.thumbSize;
        const thumbStart = Math.max(0, Math.min(travel, position - record.thumbSize / 2));
        const destination = travel > 0 ? thumbStart / travel * record.max : 0;
        if (record.axis === "y") state.element.scrollTo({ top: destination });
        else state.element.scrollTo({ left: destination });
        return;
      }
      state.scrollbar.drag = {
        record,
        pointerId: event.pointerId,
        offset: position - record.thumbPosition
      };
      if (record.element.setPointerCapture)
        record.element.setPointerCapture(event.pointerId);
    }
    function moveScrollbarDrag(state, record, event) {
      const drag = state.scrollbar.drag;
      if (!drag || drag.record !== record || drag.pointerId !== event.pointerId) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      const travel = record.trackSize - record.thumbSize;
      if (travel <= 0) return;
      const position = scrollbarPointerPosition(record, event) - drag.offset;
      const destination = Math.max(0, Math.min(record.max, position / travel * record.max));
      if (record.axis === "y") state.element.scrollTo({ top: destination, behavior: "instant" });
      else state.element.scrollTo({ left: destination, behavior: "instant" });
      updateScrollbars(state, [{
        record,
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
      const drag = state.scrollbar.drag;
      if (!drag || drag.record !== record || event && drag.pointerId !== event.pointerId) return;
      if (event) {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
      }
      state.scrollbar.drag = null;
      if (record.element.hasPointerCapture && record.element.hasPointerCapture(drag.pointerId))
        record.element.releasePointerCapture(drag.pointerId);
      syncScrollbarVisibility(state);
      if (state.snapEnabled && !state.disposed) scheduleScrollEnd(state);
    }
    function configureSnap(state) {
      const element = state.element;
      const children = contentChildren(element);
      const child = children.length === 1 ? children[0] : null;
      const wrapper = child && child.hasAttribute(snapAttribute) && child.getAttribute(snapAttribute) !== "false" ? child : null;
      if (!wrapper) {
        state.snapEnabled = false;
        state.snap.wrapper = null;
        state.snap.initialized = false;
        state.snap.pending = null;
        state.snap.index = 0;
        state.snap.wheelTarget = null;
        state.snap.notifiedItem = null;
        state.snap.notifiedIndex = null;
        clearScrollEnd(state);
        clearSnapWheel(state);
        const requested = element.hasAttribute(snapAttribute) || children.some((item) => item.hasAttribute(snapAttribute) && item.getAttribute(snapAttribute) !== "false");
        if (requested && !state.snap.invalidReported)
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_SCROLLBOX_SNAP_WRAPPER,
            { element }
          );
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
        state.snap.notifiedItem = null;
        state.snap.notifiedIndex = null;
        clearSnapWheel(state);
      }
      state.snapEnabled = true;
    }
    function configureInlineWrapper(state) {
      const inline = state.inlineWrapper;
      const wrapper = state.elastic.wrapper || state.snap.wrapper;
      if (inline.element !== wrapper) {
        restoreInlineWrapper(state);
        inline.element = wrapper;
      }
      if (!wrapper) return;
      const display = root.getComputedStyle(wrapper).display;
      if (display.startsWith("inline")) return;
      if (inline.reportedDisplay !== display) {
        AelluxJs.diagnostics.warn(
          AelluxJs.diagnostics.WARN_SCROLLBOX_WRAPPER_DISPLAY,
          { element: wrapper, display }
        );
        inline.reportedDisplay = display;
      }
      const replacement = {
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
      const inline = state.inlineWrapper;
      if (inline.owned && inline.element) {
        const previous2 = inline.previousDisplay;
        if (previous2.value) inline.element.style.setProperty(
          "display",
          previous2.value,
          previous2.priority
        );
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
    function snapAxis(state, metrics = nativeMetrics(state.element), axes = wheelAxes(state, metrics)) {
      return axes.x ? "x" : axes.y ? "y" : metrics.maxX > 1 ? "x" : metrics.maxY > 1 ? "y" : "x";
    }
    function snapCenterOffset(state, item, axis) {
      const box = state.element.getBoundingClientRect();
      const target = item.getBoundingClientRect();
      return axis === "x" ? target.left + target.width / 2 - (box.left + state.element.clientLeft + state.element.clientWidth / 2) : target.top + target.height / 2 - (box.top + state.element.clientTop + state.element.clientHeight / 2);
    }
    function edgeSnapIndex(state, items, axis, metrics) {
      const element = state.element;
      const horizontal = axis === "x";
      const maximum = horizontal ? metrics.maxX : metrics.maxY;
      const position = horizontal ? element.scrollLeft : element.scrollTop;
      const startDistance = position;
      const endDistance = maximum - position;
      if (startDistance <= SNAP_EDGE_DISTANCE_PX && startDistance <= endDistance)
        return 0;
      if (endDistance <= SNAP_EDGE_DISTANCE_PX) return items.length - 1;
      return null;
    }
    function nearestSnapIndex(state, items, projectionX = 0, projectionY = 0) {
      const rect = state.element.getBoundingClientRect();
      const centerX = rect.left + state.element.clientLeft + state.element.clientWidth / 2;
      const centerY = rect.top + state.element.clientTop + state.element.clientHeight / 2;
      let nearest = 0, distance = Infinity;
      for (let index = 0; index < items.length; index++) {
        const item = items[index].getBoundingClientRect();
        const dx = item.left + item.width / 2 + projectionX - centerX;
        const dy = item.top + item.height / 2 + projectionY - centerY;
        const candidate = dx * dx + dy * dy;
        if (candidate < distance) {
          nearest = index;
          distance = candidate;
        }
      }
      return nearest;
    }
    function snapNeedsScroll(state, item, axis, metrics) {
      const element = state.element;
      const box = element.getBoundingClientRect();
      const target = item.getBoundingClientRect();
      const dx = target.left + target.width / 2 - (box.left + element.clientLeft + element.clientWidth / 2);
      const dy = target.top + target.height / 2 - (box.top + element.clientTop + element.clientHeight / 2);
      const x = Math.max(0, Math.min(metrics.maxX, element.scrollLeft + dx));
      const y = Math.max(0, Math.min(metrics.maxY, element.scrollTop + dy));
      return axis === "x" ? Math.abs(x - element.scrollLeft) > 0.5 : Math.abs(y - element.scrollTop) > 0.5;
    }
    function snapItemFullyVisible(state, item) {
      const element = state.element;
      const box = element.getBoundingClientRect();
      const target = item.getBoundingClientRect();
      const left = box.left + element.clientLeft;
      const top = box.top + element.clientTop;
      return target.left >= left - 0.5 && target.top >= top - 0.5 && target.right <= left + element.clientWidth + 0.5 && target.bottom <= top + element.clientHeight + 0.5;
    }
    function handleSnapClick(state, event) {
      if (!state.snapEnabled || state.disposed || event.button !== 0 || event.detail !== 1 || event.defaultPrevented) return;
      let item = event.target.nodeType === 1 ? event.target : event.target.parentElement;
      if (!item || item.closest(`[${attribute}]`) !== state.element) return;
      const wrapper = state.snap.wrapper;
      while (item && item.parentElement !== wrapper) item = item.parentElement;
      if (!item || snapItemFullyVisible(state, item)) return;
      scrollToSnap(state, snapItems(state).indexOf(item));
    }
    function scheduleScrollEnd(state) {
      clearScrollEnd(state);
      state.snap.scrollEndTimeout = root.setTimeout(() => {
        state.snap.scrollEndTimeout = null;
        finishNativeScroll(state);
      }, SNAP_SCROLL_IDLE_MS);
    }
    function clearScrollEnd(state) {
      if (state.snap.scrollEndTimeout !== null)
        root.clearTimeout(state.snap.scrollEndTimeout);
      state.snap.scrollEndTimeout = null;
    }
    function clearSnapWheel(state) {
      if (state.snap.wheelTimeout !== null)
        root.clearTimeout(state.snap.wheelTimeout);
      state.snap.wheelTimeout = null;
    }
    function scheduleSnapWheelEnd(state) {
      clearSnapWheel(state);
      state.snap.wheelTimeout = root.setTimeout(() => {
        state.snap.wheelTimeout = null;
      }, SNAP_WHEEL_IDLE_MS);
    }
    function finishNativeScroll(state) {
      if (state.disposed || !state.snapEnabled || state.snap.pending || state.momentum || state.scrollbar.drag || activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) return;
      const items = snapItems(state);
      if (!items.length) return;
      const metrics = nativeMetrics(state.element);
      const axis = snapAxis(state, metrics);
      if (state.snap.wheelTarget) {
        const target2 = state.snap.wheelTarget;
        if (items.includes(target2) && snapNeedsScroll(state, target2, axis, metrics)) return;
        state.snap.wheelTarget = null;
        if (items.includes(target2)) {
          notifySnapChange(state, target2, axis);
          return;
        }
      }
      const edgeIndex = edgeSnapIndex(state, items, axis, metrics);
      const target = items[edgeIndex === null ? nearestSnapIndex(state, items) : edgeIndex];
      state.snap.index = items.indexOf(target);
      if (!snapNeedsScroll(state, target, axis, metrics)) {
        notifySnapChange(state, target, axis);
        return;
      }
      if (state.elastic.active) state.snap.pending = target;
      else scrollToSnap(state, items.indexOf(target), axis);
    }
    function initializeSnap(state) {
      const first = snapItems(state)[0];
      if (!first) return;
      state.snap.initialized = true;
      state.snap.index = 0;
      const axis = snapAxis(state);
      first.scrollIntoView(snapScrollOptions(axis, "instant"));
      notifySnapChange(state, first, axis);
      refresh(state);
    }
    function notifySnapChange(state, item, axis) {
      const index = snapItems(state).indexOf(item);
      if (index < 0 || state.snap.notifiedItem === item && state.snap.notifiedIndex === index) return;
      const previousIndex = state.snap.notifiedIndex;
      state.snap.index = index;
      state.snap.notifiedItem = item;
      state.snap.notifiedIndex = index;
      AelluxJs.dispatchFrom(state.element, "ScrollboxSnapChange", {
        detail: { item, index, previousIndex, axis }
      });
    }
    function snapScrollOptions(axis, behavior) {
      const horizontal = axis === "x";
      const options = {
        block: horizontal ? "nearest" : "center",
        inline: horizontal ? "center" : "nearest"
      };
      if (behavior) options.behavior = behavior;
      return options;
    }
    function scrollToSnap(state, index, axis = snapAxis(state)) {
      const items = snapItems(state);
      if (!items.length || !Number.isInteger(index) || index < 0 || index >= items.length)
        return false;
      cancelMomentum(state);
      clearScrollEnd(state);
      clearSnapWheel(state);
      state.snap.pending = null;
      state.snap.index = index;
      state.snap.wheelTarget = items[index];
      if (state.elastic.owned) resetElastic(state);
      items[index].scrollIntoView(snapScrollOptions(axis));
      scheduleScrollEnd(state);
      return true;
    }
    function goto(element, index) {
      const state = scrollboxes.get(element);
      return state && !state.disposed ? scrollToSnap(state, index) : false;
    }
    function next(element) {
      const state = scrollboxes.get(element);
      if (!state || state.disposed) return false;
      const items = snapItems(state);
      return items.length ? scrollToSnap(
        state,
        Math.min(items.length - 1, state.snap.index + 1)
      ) : false;
    }
    function previous(element) {
      const state = scrollboxes.get(element);
      if (!state || state.disposed) return false;
      const items = snapItems(state);
      return items.length ? scrollToSnap(
        state,
        Math.max(0, state.snap.index - 1)
      ) : false;
    }
    function configureElastic(state) {
      const element = state.element;
      const children = contentChildren(element);
      const child = children.length === 1 ? children[0] : null;
      const wrapper = child && child.hasAttribute(elasticAttribute) && child.getAttribute(elasticAttribute) !== "false" ? child : null;
      if (!wrapper) {
        resetElastic(state);
        state.elasticEnabled = false;
        state.elastic.wrapper = null;
        const requested = element.hasAttribute(elasticAttribute) || children.some((item) => item.hasAttribute(elasticAttribute) && item.getAttribute(elasticAttribute) !== "false");
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
      if (activePointerScrollState || state.pointerScroll || state.scrollbar.drag || event.defaultPrevented || event.button !== 0 || !event.isPrimary || event.pointerType === "touch" || (event.buttons & 1) === 0) return;
      const element = state.element;
      const nested = event.target.closest(`[${attribute}]`);
      if (nested !== element || event.target.closest(pointerScrollExceptionSelector)) return;
      const chain = [];
      let node = element;
      while (node) {
        const member = scrollboxes.get(node);
        if (member && member.pointerListening && !member.disposed) chain.push(member);
        node = node.parentElement && node.parentElement.closest(`[${attribute}]`);
      }
      if (chain.some((member) => member.scrollbar.drag)) return;
      const axes = new Map(chain.map((member) => {
        const metrics = nativeMetrics(member.element);
        member.metrics = metrics;
        return [member, wheelAxes(member, metrics)];
      }));
      if (!chain.some((member) => axes.get(member).x || axes.get(member).y)) return;
      const rect = element.getBoundingClientRect();
      if (event.clientX >= rect.left + element.clientWidth || event.clientY >= rect.top + element.clientHeight) return;
      const previousDown = state.lastPointerDown;
      const time = now();
      state.lastPointerDown = { x: event.clientX, y: event.clientY, time };
      if (previousDown && time - previousDown.time <= POINTER_SCROLL_MULTICLICK_MS && Math.abs(event.clientX - previousDown.x) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX && Math.abs(event.clientY - previousDown.y) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX) return;
      const textOrigin = isTextAtPoint(event.target, event.clientX, event.clientY);
      const selectionAtDown = readSelection();
      const verticalOnly = chain.some((member) => axes.get(member).y) && !chain.some((member) => axes.get(member).x);
      if (!textOrigin && event.cancelable) event.preventDefault();
      for (const member of chain) {
        cancelMomentum(member);
        member.snap.pending = null;
        member.snap.wheelTarget = null;
        if (member.elastic.owned) {
          resetElastic(member);
          refresh(member);
        }
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
        chain,
        axes,
        styles: [],
        momentumState: null,
        momentumStartX: 0,
        momentumStartY: 0,
        elasticForce: 0,
        startTime: time,
        endTime: null,
        snapStarts: new Map(chain.filter((member) => member.snapEnabled).map((member) => {
          const items = snapItems(member);
          const item = items[member.snap.index] || null;
          const axis = snapAxis(member, member.metrics, axes.get(member));
          return [member, item ? { item, offset: snapCenterOffset(member, item, axis) } : null];
        })),
        selectionAtDown,
        verticalOnly,
        selectionReadyTime: textOrigin ? time + TEXT_SELECTION_WAIT_MS : 0,
        selectionWaitTimeout: null,
        pendingMove: null,
        momentumStartTime: time
      };
      activePointerScrollState = state;
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
      if (!pointerScroll.moved && selectionHasChanged(pointerScroll.selectionAtDown)) {
        endPointerScroll(state);
        return;
      }
      const threshold = pointerScroll.chain.some((member) => member.snapEnabled) ? SNAP_FLICK_MIN_DISTANCE_PX : POINTER_SCROLL_THRESHOLD_PX;
      if (!pointerScroll.moved && dx * dx + dy * dy < threshold * threshold) return;
      if (!pointerScroll.axis)
        pointerScroll.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      const verticalTextDrag = pointerScroll.verticalOnly && pointerScroll.axis === "y" && Math.abs(dy) > VERTICAL_TEXT_DRAG_PX;
      if (!pointerScroll.moved && now() < pointerScroll.selectionReadyTime && !verticalTextDrag) {
        pointerScroll.pendingMove = { x: event.clientX, y: event.clientY };
        if (pointerScroll.selectionWaitTimeout === null) {
          pointerScroll.selectionWaitTimeout = root.setTimeout(() => {
            pointerScroll.selectionWaitTimeout = null;
            if (state.pointerScroll !== pointerScroll) return;
            const pendingMove = pointerScroll.pendingMove;
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
        const axis2 = pointerScroll.axis;
        if (!pointerScroll.chain.some((member) => pointerAxisMaximum(member, axis2, pointerScroll) > 0)) {
          endPointerScroll(state);
          return;
        }
        activatePointerScroll(state, pointerScroll, axis2);
        if (state.pointerScroll !== pointerScroll) return;
      }
      const axis = pointerScroll.axis;
      let remaining = axis === "x" ? pointerScroll.lastX - event.clientX : pointerScroll.lastY - event.clientY;
      pointerScroll.lastX = event.clientX;
      pointerScroll.lastY = event.clientY;
      if (event.cancelable) event.preventDefault();
      if (!remaining) return;
      let outermost = null;
      for (const member of pointerScroll.chain) {
        if (!member.disposed && member.pointerListening && pointerAxisMaximum(member, axis, pointerScroll) > 0) outermost = member;
      }
      if (outermost && outermost.elasticEnabled && pointerScroll.elasticForce) {
        const force = pointerScroll.elasticForce + remaining;
        if (!force || Math.sign(force) === Math.sign(pointerScroll.elasticForce)) {
          pointerScroll.elasticForce = force;
          remaining = 0;
        } else {
          pointerScroll.elasticForce = 0;
          remaining = force;
        }
      }
      let lastUsed = null;
      let lastStartX = 0, lastStartY = 0;
      for (const member of pointerScroll.chain) {
        if (member.disposed || !member.pointerListening || pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
        if (Math.abs(remaining) < 1e-3) continue;
        const element = member.element;
        const previousX = element.scrollLeft, previousY = element.scrollTop;
        const current = axis === "x" ? previousX : previousY;
        const desired = Math.max(0, Math.min(
          pointerAxisMaximum(member, axis, pointerScroll),
          current + remaining
        ));
        element.scrollTo({
          left: axis === "x" ? desired : previousX,
          top: axis === "y" ? desired : previousY,
          behavior: "instant"
        });
        const used = (axis === "x" ? element.scrollLeft : element.scrollTop) - current;
        if (!used) continue;
        remaining -= used;
        publish(member);
        lastUsed = member;
        lastStartX = previousX;
        lastStartY = previousY;
      }
      if (outermost && outermost.elasticEnabled) {
        pointerScroll.elasticForce += remaining;
        const element = outermost.element;
        const desiredX = element.scrollLeft + (axis === "x" ? pointerScroll.elasticForce : 0);
        const desiredY = element.scrollTop + (axis === "y" ? pointerScroll.elasticForce : 0);
        applyElasticFromDesired(outermost, desiredX, desiredY, false);
        scrollWithinElasticBounds(outermost, desiredX, desiredY);
        publish(outermost);
      }
      if (lastUsed) {
        const time = now();
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
      const selection = root.getSelection();
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
      const current = readSelection();
      const initialSelected = initial && initial.rangeCount && !initial.isCollapsed;
      const currentSelected = current && current.rangeCount && !current.isCollapsed;
      if (!initialSelected && !currentSelected) return false;
      if (!initial || !current) return initial !== current;
      return current.rangeCount !== initial.rangeCount || current.isCollapsed !== initial.isCollapsed || current.anchorNode !== initial.anchorNode || current.anchorOffset !== initial.anchorOffset || current.focusNode !== initial.focusNode || current.focusOffset !== initial.focusOffset;
    }
    function pointerAxisMaximum(state, axis, pointerScroll = null) {
      const metrics = state.metrics || nativeMetrics(state.element);
      const axes = pointerScroll && pointerScroll.axes.get(state) || wheelAxes(state, metrics);
      return axes[axis] ? axis === "x" ? metrics.maxX : metrics.maxY : 0;
    }
    function activatePointerScroll(state, pointerScroll, axis) {
      pointerScroll.axis = axis;
      pointerScroll.moved = true;
      pointerScroll.started = true;
      restorePointerScrollCursor(state);
      for (const member of pointerScroll.chain) {
        if (pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
        const element = member.element;
        pointerScroll.styles.push({
          element,
          classOwned: !element.classList.contains(pointerScrollingClass),
          scrollBehavior: element.style.getPropertyValue("scroll-behavior"),
          scrollBehaviorPriority: element.style.getPropertyPriority("scroll-behavior")
        });
        element.style.setProperty("scroll-behavior", "auto", "important");
        element.classList.add(pointerScrollingClass);
        startScrollbarPdsVisibility(member);
      }
      dispatchPointerScroll(state, pointerScroll, "PointerScrollStart");
    }
    function dispatchPointerScroll(state, pointerScroll, name) {
      AelluxJs.dispatchFrom(state.element, name, {
        detail: {
          axis: pointerScroll.axis,
          pointerId: pointerScroll.pointerId,
          pointerType: pointerScroll.pointerType,
          elements: pointerScroll.styles.map((saved) => saved.element)
        }
      });
    }
    function endPointerScroll(state, event) {
      const pointerScroll = state.pointerScroll;
      if (!pointerScroll || event && event.pointerId !== pointerScroll.pointerId) return;
      pointerScroll.endTime = now();
      if (event && event.type === "pointerup" && !pointerScroll.moved && pointerScroll.endTime < pointerScroll.selectionReadyTime && !selectionHasChanged(pointerScroll.selectionAtDown)) {
        const dx = pointerScroll.startX - event.clientX;
        const dy = pointerScroll.startY - event.clientY;
        const axis = pointerScroll.axis || (Math.abs(dx) >= Math.abs(dy) ? "x" : "y");
        pointerScroll.lastX = event.clientX;
        pointerScroll.lastY = event.clientY;
        if (pointerScroll.chain.some((member) => member.snapEnabled && snapAxis(member, member.metrics, pointerScroll.axes.get(member)) === axis && pointerAxisMaximum(member, axis, pointerScroll) > 0) && isSnapFlick(pointerScroll, axis)) {
          pointerScroll.axis = axis;
          pointerScroll.moved = true;
        }
      }
      state.pointerScroll = null;
      if (activePointerScrollState === state) activePointerScrollState = null;
      if (pointerScroll.selectionWaitTimeout !== null)
        root.clearTimeout(pointerScroll.selectionWaitTimeout);
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
      for (const saved of pointerScroll.styles) {
        if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
        if (saved.scrollBehavior) saved.element.style.setProperty(
          "scroll-behavior",
          saved.scrollBehavior,
          saved.scrollBehaviorPriority
        );
        else saved.element.style.removeProperty("scroll-behavior");
        const member = scrollboxes.get(saved.element);
        if (member) scheduleScrollbarPdsHide(member);
      }
      if (event && event.type === "pointerup" && state.pointerListening) {
        updatePointerScrollCursor(
          state,
          document.elementFromPoint(event.clientX, event.clientY),
          event.clientX,
          event.clientY
        );
      } else restorePointerScrollCursor(state);
      if (pointerScroll.started)
        dispatchPointerScroll(state, pointerScroll, "PointerScrollEnd");
      const hadElastic = pointerScroll.chain.some((member) => member.elastic.active);
      const momentumState = pointerScroll.momentumState;
      const snapState = momentumState ? momentumState.snapEnabled ? momentumState : null : pointerScroll.chain.find((member) => member.snapEnabled && pointerAxisMaximum(member, pointerScroll.axis, pointerScroll) > 0);
      const shouldSnap = event && event.type === "pointerup" && pointerScroll.moved && snapState && !snapState.disposed && snapItems(snapState).length;
      if (shouldSnap) schedulePointerSnap(snapState, pointerScroll);
      for (const member of pointerScroll.chain) releaseElastic(member);
      if (!shouldSnap && event && event.type === "pointerup" && pointerScroll.moved && momentumState && momentumState.momentumEnabled && !hadElastic && !momentumState.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(momentumState, pointerScroll);
      }
    }
    function schedulePointerSnap(state, pointerScroll) {
      const items = snapItems(state);
      const metrics = nativeMetrics(state.element);
      const axis = snapAxis(state, metrics);
      const edgeIndex = edgeSnapIndex(state, items, axis, metrics);
      const start = pointerScroll.snapStarts.get(state);
      const startIndex = start ? items.indexOf(start.item) : -1;
      const projection = axis === pointerScroll.axis ? axis === "x" ? pointerScroll.lastX - pointerScroll.startX : pointerScroll.lastY - pointerScroll.startY : 0;
      let index = edgeIndex === null ? nearestSnapIndex(
        state,
        items,
        axis === "x" ? projection : 0,
        axis === "y" ? projection : 0
      ) : edgeIndex;
      if (edgeIndex === null && index === startIndex && axis === pointerScroll.axis && start) {
        const flick = isSnapFlick(pointerScroll, axis);
        const distance = axis === "x" ? pointerScroll.startX - pointerScroll.lastX : pointerScroll.startY - pointerScroll.lastY;
        const offset = snapCenterOffset(state, start.item, axis);
        const size = axis === "x" ? state.element.clientWidth : state.element.clientHeight;
        const movedAway = Math.abs(offset) - Math.abs(start.offset) >= size * SNAP_DRAG_DISTANCE_RATIO;
        if (flick || movedAway) {
          const direction = flick ? Math.sign(distance) : Math.sign(start.offset - offset);
          index = Math.max(0, Math.min(items.length - 1, index + direction));
        }
      }
      state.snap.pending = items[index];
      flushPendingSnap(state);
    }
    function isSnapFlick(pointerScroll, axis) {
      const distance = axis === "x" ? pointerScroll.startX - pointerScroll.lastX : pointerScroll.startY - pointerScroll.lastY;
      const elapsed = Math.max(1, pointerScroll.endTime - pointerScroll.startTime);
      return elapsed <= SNAP_FLICK_WINDOW_MS && Math.abs(distance) > SNAP_FLICK_MIN_DISTANCE_PX && Math.abs(distance) < SNAP_FLICK_MAX_DISTANCE_PX && (elapsed <= SNAP_FLICK_FAST_TIME_MS || Math.abs(distance) / elapsed >= SNAP_SWIPE_SPEED_PX_MS);
    }
    function flushPendingSnap(state) {
      const target = state.snap.pending;
      if (!target || state.elastic.active || state.disposed) return;
      state.snap.pending = null;
      const index = snapItems(state).indexOf(target);
      if (index >= 0) scrollToSnap(state, index);
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
      const x = pointerScroll.axis === "x" ? momentumAxis(
        element.scrollLeft,
        pointerScroll.momentumStartX,
        elapsed,
        Math.max(0, element.scrollWidth - element.clientWidth)
      ) : element.scrollLeft;
      const y = pointerScroll.axis === "y" ? momentumAxis(
        element.scrollTop,
        pointerScroll.momentumStartY,
        elapsed,
        Math.max(0, element.scrollHeight - element.clientHeight)
      ) : element.scrollTop;
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
    function applyElasticFromDesired(state, desiredX, desiredY, additive, axis = null) {
      if (!state.elasticEnabled) return false;
      const element = state.element;
      const metrics = state.metrics || nativeMetrics(element);
      const elastic = state.elastic;
      const amounts = [0, 0, 0, 0];
      if (axis !== "x" && metrics.maxY > 1) {
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
      if (axis !== "y" && metrics.maxX > 1) {
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
      const dimensions = elastic.dimensions || measureElasticWrapper(elastic.wrapper);
      elastic.dimensions = dimensions;
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      elastic.releaseFrame = null;
      elastic.wrapper.classList.remove(elasticReleaseClass);
      elastic.amounts = amounts;
      elastic.active = active;
      elastic.owned = true;
      if (amounts[1] > 0 && !elastic.extentX) {
        elastic.wrapper.style.setProperty(
          "min-width",
          `${Math.max(dimensions.offsetWidth, dimensions.scrollWidth)}px`,
          elastic.previousMinWidth.priority
        );
        elastic.extentX = true;
      }
      if (amounts[2] > 0 && !elastic.extentY) {
        elastic.wrapper.style.setProperty(
          "min-height",
          `${Math.max(dimensions.offsetHeight, dimensions.scrollHeight)}px`,
          elastic.previousMinHeight.priority
        );
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
    function setElasticTransform(state, dimensions = state.elastic.dimensions) {
      const elastic = state.elastic;
      const wrapper = elastic.wrapper;
      const x = elastic.amounts[3] - elastic.amounts[1];
      const y = elastic.amounts[0] - elastic.amounts[2];
      const translate = x || y ? `translate3d(${x}px, ${y}px, 0)` : "";
      const width = Math.max(dimensions.offsetWidth, dimensions.scrollWidth, 1);
      const height = Math.max(dimensions.offsetHeight, dimensions.scrollHeight, 1);
      const scaleX = 1 + 2 * (Math.max(elastic.amounts[1], elastic.amounts[3]) / width);
      const scaleY = 1 + 2 * (Math.max(elastic.amounts[0], elastic.amounts[2]) / height);
      const scale = scaleX > 1 || scaleY > 1 ? `scale(${scaleX}, ${scaleY})` : "";
      if (scaleX > 1 || scaleY > 1) {
        const baseOrigin = elastic.baseOrigin.split(" ");
        const originX = elastic.amounts[3] > 0 ? "0%" : elastic.amounts[1] > 0 ? `${Math.max(
          dimensions.offsetWidth,
          dimensions.scrollWidth + dimensions.clientLeft
        )}px` : baseOrigin[0];
        const originY = elastic.amounts[0] > 0 ? "0%" : elastic.amounts[2] > 0 ? `${Math.max(
          dimensions.offsetHeight,
          dimensions.scrollHeight + dimensions.clientTop
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
        flushPendingSnap(state);
        return;
      }
      setElasticTransform(state);
      elastic.releaseFrame = root.requestAnimationFrame(() => stepElasticRelease(state));
    }
    function resetElastic(state) {
      const elastic = state.elastic;
      const wasOwned = elastic.owned;
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.releaseFrame = null;
      elastic.wheelTimeout = null;
      if (elastic.wrapper) elastic.wrapper.classList.remove(elasticReleaseClass);
      if (elastic.owned && elastic.wrapper) {
        const previous2 = elastic.previousTransform;
        if (previous2.value) elastic.wrapper.style.setProperty(
          "transform",
          previous2.value,
          previous2.priority
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
      if (wasOwned && !state.disposed) publish(state);
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
      const style = root.getComputedStyle(state.element);
      const available = (value) => value === "auto" || value === "scroll";
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
      AelluxJs.waitLayout.read(() => {
        if (state.disposed) return null;
        state.publishDirty = false;
        const metrics = nativeMetrics(state.element);
        const scrollTop = state.element.scrollTop;
        const scrollLeft = state.element.scrollLeft;
        if (!state.elastic.active) state.metrics = metrics;
        if (state.elasticEnabled && state.elastic.wrapper && !state.elastic.active)
          state.elastic.dimensions = measureElasticWrapper(state.elastic.wrapper);
        const bars = state.scrollbar.x || state.scrollbar.y;
        const axes = state.snapEnabled || bars ? wheelAxes(state, metrics) : null;
        return {
          revision: state.layoutRevision,
          y: progress(scrollTop, metrics.maxY),
          x: progress(scrollLeft, metrics.maxX),
          edges: state.elastic.owned ? null : [
            scrollTop < SCROLL_EDGE_MARGIN_PX,
            scrollTop >= metrics.maxY - SCROLL_EDGE_MARGIN_PX,
            scrollLeft < SCROLL_EDGE_MARGIN_PX,
            scrollLeft >= metrics.maxX - SCROLL_EDGE_MARGIN_PX
          ],
          snapValues: state.snapEnabled ? measureSnapValues(state, metrics, axes) : [],
          scrollbars: bars ? readScrollbars(state, metrics, axes) : []
        };
      }).then((values) => {
        if (!values || state.disposed) {
          state.publishDirty = false;
          return;
        }
        return AelluxJs.waitLayout.update(() => {
          if (state.disposed || state.layoutRevision !== values.revision) return;
          state.element.style.setProperty(properties[0], values.y);
          state.element.style.setProperty(properties[1], values.x);
          if (values.edges && !state.elastic.owned) {
            scrollEdgeClasses.forEach((name, index) => state.element.classList.toggle(name, values.edges[index]));
          }
          for (const { item, viewport, focus } of values.snapValues) {
            item.style.setProperty(snapProperties[0], viewport);
            item.style.setProperty(snapProperties[1], focus);
          }
          updateScrollbars(state, values.scrollbars);
        });
      }).catch((cause) => {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
          { cause, extension: extensionName, element: state.element, method: "update" }
        );
      }).finally(() => {
        state.publishPending = false;
        if (state.publishDirty && !state.disposed) publish(state);
      });
    }
    function measureSnapValues(state, metrics, axes) {
      const element = state.element;
      const rect = element.getBoundingClientRect();
      const axis = snapAxis(state, metrics, axes);
      const size = axis === "x" ? element.clientWidth : element.clientHeight;
      if (!size) return [];
      const center = axis === "x" ? rect.left + element.clientLeft + size / 2 : rect.top + element.clientTop + size / 2;
      return snapItems(state).map((item) => {
        const box = item.getBoundingClientRect();
        const itemCenter = axis === "x" ? box.left + box.width / 2 : box.top + box.height / 2;
        const viewport = Math.max(-2, Math.min(2, (itemCenter - center) * 2 / size));
        const focus = Math.max(0, 1 - Math.abs(viewport) / 2);
        return { item, viewport, focus };
      });
    }
    function progress(position, distance) {
      return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
    }
    function handleSnapWheel(state, event, deltaX, deltaY, axes) {
      const items = snapItems(state);
      if (!items.length) return false;
      const hasX = axes.x, hasY = axes.y;
      if (!hasX && !hasY) return false;
      const axis = hasX && hasY ? Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y" : hasX ? "x" : "y";
      const delta = axis === "x" ? deltaX : deltaY;
      if (!delta) return false;
      if (state.snap.wheelTimeout !== null) {
        if (event.cancelable) event.preventDefault();
        scheduleSnapWheelEnd(state);
        return true;
      }
      const index = Math.max(0, Math.min(items.length - 1, state.snap.index));
      const destination = Math.max(0, Math.min(
        items.length - 1,
        index + Math.sign(delta)
      ));
      if (destination === index) {
        if (state.elasticEnabled) {
          const desiredX = state.element.scrollLeft + (axis === "x" ? delta : 0);
          const desiredY = state.element.scrollTop + (axis === "y" ? delta : 0);
          if (applyElasticFromDesired(state, desiredX, desiredY, true, axis)) {
            scrollWithinElasticBounds(state, desiredX, desiredY);
            publish(state);
            if (state.elastic.wheelTimeout !== null)
              root.clearTimeout(state.elastic.wheelTimeout);
            state.elastic.wheelTimeout = root.setTimeout(
              () => releaseElastic(state),
              ELASTIC_WHEEL_IDLE_MS
            );
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
      if (event.target.closest(`[${attribute}]`) !== state.element) return;
      const metrics = nativeMetrics(state.element);
      if (!metrics) return;
      const axes = wheelAxes(state, metrics);
      const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
      const converted = state.desktop && state.wheelEnabled && axes.x && !axes.y && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
      const deltaX = (converted ? event.deltaY : event.deltaX) * factor;
      const deltaY = (converted ? 0 : event.deltaY) * factor;
      if (state.snapEnabled && handleSnapWheel(state, event, deltaX, deltaY, axes)) return;
      if (converted && deltaX) {
        const current = state.element.scrollLeft;
        const desiredX = current + deltaX;
        const next2 = Math.max(0, Math.min(metrics.maxX, desiredX));
        const overflow = desiredX < 0 || desiredX > metrics.maxX;
        let stretched = false;
        if (overflow && state.elasticEnabled) {
          stretched = applyElasticFromDesired(
            state,
            desiredX,
            state.element.scrollTop,
            true,
            "x"
          );
          if (stretched) {
            scrollWithinElasticBounds(state, desiredX, state.element.scrollTop);
            if (state.elastic.wheelTimeout !== null)
              root.clearTimeout(state.elastic.wheelTimeout);
            state.elastic.wheelTimeout = root.setTimeout(
              () => releaseElastic(state),
              ELASTIC_WHEEL_IDLE_MS
            );
          }
        } else if (state.elastic.owned) {
          resetElastic(state);
          refresh(state);
        }
        if (!stretched && next2 !== current)
          state.element.scrollTo({ left: next2, behavior: "instant" });
        if (stretched || next2 !== current) publish(state);
        if (!overflow && next2 !== current) event.preventDefault();
        return;
      }
      if (state.elasticEnabled && (axes.x || axes.y)) {
        const desiredX = state.element.scrollLeft + (axes.x ? deltaX : 0);
        const desiredY = state.element.scrollTop + (axes.y ? deltaY : 0);
        const axis = axes.x && axes.y ? null : axes.x ? "x" : "y";
        if (applyElasticFromDesired(state, desiredX, desiredY, true, axis)) {
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
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.scrollbox.js.map
