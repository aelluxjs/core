(() => {
  // src/aellux.ext.scrollbox.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "scrollbox";
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the scrollbox extension.");
    const { onTarget, offTarget } = AelluxJs;
    const POINTER = "pointer", POINTER_DOWN = `${POINTER}down`, POINTER_MOVE = `${POINTER}move`, POINTER_UP = `${POINTER}up`, POINTER_CANCEL = `${POINTER}cancel`, POINTER_OVER = `${POINTER}over`, POINTER_OUT = `${POINTER}out`, POINTER_ENTER = `${POINTER}enter`, POINTER_LEAVE = `${POINTER}leave`, POINTER_DOWN_TARGET = `$${POINTER_DOWN}`, POINTER_MOVE_TARGET = `$${POINTER_MOVE}`, POINTER_UP_TARGET = `$${POINTER_UP}`, POINTER_CANCEL_TARGET = `$${POINTER_CANCEL}`;
    const attribute = AelluxJs.attr(extensionName);
    const wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
    const momentumAttribute = AelluxJs.attr("scrollbox-momentum");
    const elasticAttribute = AelluxJs.attr("scrollbox-elastic");
    const snapAttribute = AelluxJs.attr("scrollbox-snap");
    const snapItemAttribute = AelluxJs.attr("snap-item");
    const scrollbarAttribute = AelluxJs.attr("scrollbar");
    const scrollbarVerticalAttribute = AelluxJs.attr("scrollbar-vertical");
    const scrollbarHorizontalAttribute = AelluxJs.attr("scrollbar-horizontal");
    const elasticReleaseClass = AelluxJs.className("scrollbox-elastic-release");
    const pointerScrollingClass = AelluxJs.className("pointerscrolling");
    const nativeScrollbarHideClass = AelluxJs.className("native-sb-hide");
    const scrollbarVisibleClass = AelluxJs.className("scrollbar-visible");
    const snapReadyClass = AelluxJs.className("snap-ready");
    const snapSuspendedClass = AelluxJs.className("snap-suspended");
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
    const SNAP_FLICK_WINDOW_MS = 100;
    const SNAP_FLICK_FAST_TIME_MS = 50;
    const SNAP_FLICK_MAX_DISTANCE_PX = 100;
    const SNAP_FLICK_MIN_DISTANCE_PX = 1;
    const SNAP_SCROLL_IDLE_MS = 120;
    const SNAP_TARGET_IDLE_MS = 500;
    const SNAP_EDGE_DISTANCE_PX = 10;
    const ELASTIC_DAMPING = 1 / 3;
    const DEFAULT_ELASTIC_LIMIT = { unit: "ratio", value: 1 / 4 };
    const ELASTIC_RETURN_LERP = 0.15;
    const ELASTIC_RETURN_EPSILON = 0.01;
    const ELASTIC_WHEEL_IDLE_MS = 80;
    const SCROLLBAR_SIZE_PX = 8;
    const SCROLLBAR_MIN_THUMB_PX = 20;
    const SCROLLBAR_INTERACTION_HIDE_DELAY_MS = 1e3;
    const SCROLLBAR_HOVER_HIDE_DELAY_MS = 300;
    const scrollbarProperties = [
      "--ae-scrollbar-x",
      "--ae-scrollbar-y",
      "--ae-scrollbar-length",
      "--ae-scrollbar-thumb-size",
      "--ae-scrollbar-thumb-position",
      "--ae-scrollbar-display"
    ];
    const pointerListeners = [
      [POINTER_DOWN, "onPointerDown"],
      [POINTER_OVER, "onPointerOver"],
      [POINTER_OUT, "onPointerOut"],
      ["mousedown", "onMouseDown"]
    ];
    const scrollbarHoverListeners = [
      [POINTER_DOWN, "onScrollbarPointerDown"],
      [POINTER_ENTER, "onScrollbarPointerEnter"],
      [POINTER_LEAVE, "onScrollbarPointerLeave"],
      [POINTER_OVER, "onScrollbarPointerOver"],
      [POINTER_OUT, "onScrollbarPointerOut"],
      [POINTER_MOVE, "onScrollbarPointerMove"],
      [POINTER_UP, "onScrollbarPointerEnd"],
      [POINTER_CANCEL, "onScrollbarPointerEnd"],
      ["mouseenter", "onScrollbarMouseEnter"],
      ["mouseleave", "onScrollbarMouseLeave"],
      ["mouseover", "onScrollbarMouseOver"],
      ["mouseout", "onScrollbarMouseOut"]
    ];
    const scrollbarAxisListeners = [
      [POINTER_DOWN, "onPointerDown"],
      [POINTER_MOVE, "onPointerMove"],
      [POINTER_UP, "onPointerEnd"],
      [POINTER_CANCEL, "onPointerEnd"]
    ];
    const snapEndListeners = [
      [POINTER_UP, "onSnapPointerEnd", true],
      [POINTER_CANCEL, "onSnapPointerEnd", true],
      ["touchend", "onSnapTouchEnd", true],
      ["touchcancel", "onSnapTouchEnd", true],
      ["blur", "onSnapBlur"]
    ];
    const touchListeners = [
      ["touchstart", "onTouchStart", { passive: true }],
      ["touchmove", "onTouchMove", { passive: false }],
      ["touchend", "onTouchEnd", { passive: true }],
      ["touchcancel", "onTouchEnd", { passive: true }]
    ];
    function setListeners(target, owner, entries, active) {
      const method = active ? onTarget : offTarget;
      for (const [event, handler, options] of entries) {
        method(target, `$${event}`, owner[handler], active ? options : options === true || !!(options == null ? void 0 : options.capture));
      }
    }
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
    const elementMemories = /* @__PURE__ */ new WeakMap();
    const cursorMemories = /* @__PURE__ */ new WeakMap();
    const scrollbarMemories = /* @__PURE__ */ new WeakMap();
    const inlineMemories = /* @__PURE__ */ new WeakMap();
    const elasticMemories = /* @__PURE__ */ new WeakMap();
    const pointerScrollMemories = /* @__PURE__ */ new WeakMap();
    const snapItemMemories = /* @__PURE__ */ new WeakMap();
    let activePointerScrollState = null;
    AelluxJs.extAttach(extensionName, { init, destroy, next, previous, goto });
    function init() {
      AelluxJs.registerCssProperty(
        ...[...properties, ...snapProperties].map((name) => ({ name, syntax: "<number>", initialValue: "0" })),
        ...scrollbarProperties.map((name, index) => ({
          name,
          syntax: index === 5 ? "block | none" : "<length>",
          initialValue: index === 5 ? "none" : "0px"
        }))
      );
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
      elementMemories.set(element, AelluxJs.persist.element.save(element, [], properties));
      cursorMemories.set(element, AelluxJs.persist.element.save(element, [], ["cursor"]));
      const elastic = {
        wrapper: null,
        baseTransform: "",
        baseOrigin: "",
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
        root: null,
        initialized: false,
        invalidReported: false,
        index: 0,
        flick: null,
        axis: null,
        deferredIndex: null,
        suspensions: { pointer: false, elastic: false, scrollbar: false, wheel: false },
        notifiedItem: null,
        notifiedIndex: null,
        scrollEndTimeout: null,
        scrollingToTarget: -1,
        scrollingToAxis: null,
        wheelTimeout: null,
        edgeWheelTimeout: null,
        activePointers: /* @__PURE__ */ new Set(),
        activeTouches: /* @__PURE__ */ new Set(),
        savedItems: /* @__PURE__ */ new Set(),
        gestureListening: false,
        endListening: false,
        waitingForGestureEnd: false
      };
      const inlineWrapper = {
        element: null,
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
        hoverVisible: false,
        hoverTimeout: null,
        interactionVisible: false,
        interactionTimeout: null
      };
      const state = {
        element,
        metrics: null,
        mode: null,
        desktop: false,
        cursor: { owned: false },
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
        desktopMedia: null,
        publishPending: false,
        publishDirty: false,
        layoutRevision: 0,
        lastResizeTime: -RESIZE_INTERVAL_MS,
        resizeTimeout: null,
        disposed: false
      };
      state.onScroll = (event) => {
        if (event.target !== element) return;
        publish(state);
        if (!state.desktop && state.scrollbar.listening) scheduleScrollbarInteractionHide(state);
        if (!state.snapEnabled) return;
        if (state.snap.scrollingToTarget !== -1) {
          if (!snapTargetReached(state)) {
            scheduleSnapTargetIdle(state);
            return;
          }
          clearSnapTarget(state);
          scheduleScrollEnd(state);
        } else if (!("onscrollend" in element) || state.snap.scrollEndTimeout !== null) {
          scheduleScrollEnd(state);
        }
      };
      state.onScrollEnd = (event) => {
        if (event.target !== element) return;
        clearSnapTarget(state);
        clearScrollEnd(state);
        finishNativeScroll(state);
      };
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
      state.onSnapPointerDown = (event) => beginSnapGesture(state, POINTER, event);
      state.onSnapPointerEnd = (event) => endSnapGesture(state, POINTER, event);
      state.onSnapTouchStart = (event) => beginSnapGesture(state, "touch", event);
      state.onSnapTouchEnd = (event) => endSnapGesture(state, "touch", event);
      state.onSnapBlur = () => endSnapGesture(state);
      state.onScrollbarPointerDown = () => startScrollbarInteractionVisibility(state);
      state.onScrollbarPointerEnd = () => scheduleScrollbarInteractionHide(state);
      state.onScrollbarPointerEnter = (event) => {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", true);
      };
      state.onScrollbarPointerLeave = (event) => {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", false);
      };
      state.onScrollbarPointerOver = (event) => {
        if (event.pointerType !== "touch") setScrollbarHover(state, "pointerHover", true);
      };
      state.onScrollbarPointerOut = (event) => {
        if (event.pointerType !== "touch" && (!event.relatedTarget || !element.contains(event.relatedTarget)))
          setScrollbarHover(state, "pointerHover", false);
      };
      state.onScrollbarPointerMove = (event) => {
        if (event.pointerType !== "touch" && !state.scrollbar.pointerHover)
          setScrollbarHover(state, "pointerHover", true);
      };
      state.onScrollbarMouseEnter = () => {
        if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
      };
      state.onScrollbarMouseLeave = () => setScrollbarHover(state, "mouseHover", false);
      state.onScrollbarMouseOver = () => {
        if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
      };
      state.onScrollbarMouseOut = (event) => {
        if (!event.relatedTarget || !element.contains(event.relatedTarget))
          setScrollbarHover(state, "mouseHover", false);
      };
      state.onScrollbarOutsideDown = (event) => {
        if (!element.contains(event.target)) {
          setScrollbarHover(state, "pointerHover", false);
          setScrollbarHover(state, "mouseHover", false);
          if (!element.classList.contains(pointerScrollingClass))
            clearScrollbarInteractionVisibility(state);
          syncScrollbarVisibility(state);
        }
      };
      scrollboxes.set(element, state);
      onTarget(element, "$scroll", state.onScroll, { passive: true });
      onTarget(element, "$scrollend", state.onScrollEnd, { passive: true });
      observe(state);
      configure(state);
    }
    function updateScrollbox(element) {
      const state = scrollboxes.get(element);
      if (state) configure(state);
    }
    function unmountScrollbox(element) {
      var _a;
      const state = scrollboxes.get(element);
      if (!state) return;
      state.disposed = true;
      if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
        endPointerScroll(activePointerScrollState);
      endPointerScroll(state);
      stopPointerScrollMouseEvents(state);
      restorePointerScrollCursor(state);
      cancelMomentum(state);
      state.snap.flick = null;
      state.snap.deferredIndex = null;
      clearSnapTarget(state);
      clearScrollEnd(state);
      removeSnapGestureListeners(state);
      restoreSnapStyles(state);
      resetElastic(state);
      if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
      restoreInlineWrapper(state);
      resetScrollbars(state);
      offTarget(element, "$scroll", state.onScroll);
      offTarget(element, "$scrollend", state.onScrollEnd);
      if (state.wheelListening) offTarget(element, "$wheel", state.onWheel, true);
      if (state.pointerListening) setListeners(element, state, pointerListeners, false);
      if (state.touchListening) removeTouchListeners(state);
      if (state.resizeObserver) state.resizeObserver.disconnect();
      if (state.mutationObserver) state.mutationObserver.disconnect();
      if (state.desktopMedia) {
        if (state.desktopMedia.removeEventListener)
          state.desktopMedia.removeEventListener("change", state.onDesktopMediaChange);
        else if (state.desktopMedia.removeListener)
          state.desktopMedia.removeListener(state.onDesktopMediaChange);
      }
      if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
      offTarget(root, "$resize", state.onResize);
      (_a = elementMemories.get(element)) == null ? void 0 : _a.restore();
      elementMemories.delete(element);
      cursorMemories.delete(element);
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
        onTarget(element, "$wheel", state.onWheel, { passive: false, capture: true });
        state.wheelListening = true;
      } else if (!state.desktop && !state.elasticEnabled && !state.snapEnabled && state.wheelListening) {
        offTarget(element, "$wheel", state.onWheel, true);
        state.wheelListening = false;
      }
      if (state.elasticEnabled && !state.touchListening) addTouchListeners(state);
      else if (!state.elasticEnabled && state.touchListening) removeTouchListeners(state);
      if (!state.elasticEnabled) resetElastic(state);
      const pointerEnabled = state.desktop && state.mode === POINTER;
      if (!pointerEnabled || !state.momentumEnabled) cancelMomentum(state);
      if (pointerEnabled && !state.pointerListening) {
        setListeners(element, state, pointerListeners, true);
        state.pointerListening = true;
      } else if (!pointerEnabled && state.pointerListening) {
        if (activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state))
          endPointerScroll(activePointerScrollState);
        setListeners(element, state, pointerListeners, false);
        state.pointerListening = false;
        endPointerScroll(state);
        state.lastPointerDown = null;
        restorePointerScrollCursor(state);
      }
      if (state.snapEnabled) syncSnapStyles(state);
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
    function supportsMouseHover() {
      return !!(root.matchMedia && root.matchMedia("(any-hover: hover)").matches);
    }
    function configureScrollbars(state) {
      const element = state.element;
      const value = element.getAttribute(scrollbarAttribute);
      const axes = scrollbarAxes(value);
      configureScrollbarAxis(state, "y", axes.y, scrollbarVerticalAttribute);
      configureScrollbarAxis(state, "x", axes.x, scrollbarHorizontalAttribute);
      const enabled = axes.x || axes.y;
      const scrollbar = state.scrollbar;
      if (enabled && !scrollbar.listening) {
        scrollbar.mouseHover = element.matches(":hover") && supportsMouseHover();
        scrollbar.hoverVisible = scrollbar.mouseHover;
        setListeners(element, state, scrollbarHoverListeners, true);
        AelluxJs.on(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
        scrollbar.listening = true;
        syncScrollbarVisibility(state);
      } else if (!enabled && scrollbar.listening) {
        setListeners(element, state, scrollbarHoverListeners, false);
        AelluxJs.off(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
        scrollbar.listening = false;
        clearScrollbarInteractionVisibility(state);
        clearScrollbarHover(state);
        syncScrollbarVisibility(state);
      }
      const hideNative = enabled || value !== null && value.trim().toLowerCase() === "none";
      if (hideNative && !element.classList.contains(nativeScrollbarHideClass)) {
        element.classList.add(nativeScrollbarHideClass);
        scrollbar.hideOwned = true;
      } else if (!hideNative && scrollbar.hideOwned) {
        element.classList.remove(nativeScrollbarHideClass);
        scrollbar.hideOwned = false;
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
      if (!owned) scrollbarMemories.set(element, AelluxJs.persist.element.save(
        element,
        [],
        scrollbarProperties
      ));
      const record = {
        element,
        owned,
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
      setListeners(element, record, scrollbarAxisListeners, true);
      scrollbar[axis] = record;
    }
    function resetScrollbarAxis(state, axis) {
      var _a;
      const record = state.scrollbar[axis];
      if (!record) return;
      endScrollbarDrag(state, record);
      const element = record.element;
      setListeners(element, record, scrollbarAxisListeners, false);
      if (record.owned) element.remove();
      else (_a = scrollbarMemories.get(element)) == null ? void 0 : _a.restore();
      scrollbarMemories.delete(element);
      state.scrollbar[axis] = null;
    }
    function resetScrollbars(state) {
      resetScrollbarAxis(state, "x");
      resetScrollbarAxis(state, "y");
      const scrollbar = state.scrollbar;
      if (scrollbar.listening) {
        setListeners(state.element, state, scrollbarHoverListeners, false);
        AelluxJs.off(POINTER_DOWN_TARGET, state.onScrollbarOutsideDown, true);
        scrollbar.listening = false;
      }
      if (scrollbar.hideOwned) state.element.classList.remove(nativeScrollbarHideClass);
      scrollbar.hideOwned = false;
      clearScrollbarInteractionVisibility(state);
      clearScrollbarHover(state);
      syncScrollbarVisibility(state);
    }
    function setScrollbarHover(state, name, active) {
      const scrollbar = state.scrollbar;
      scrollbar[name] = active;
      if (active) {
        if (scrollbar.hoverTimeout !== null) root.clearTimeout(scrollbar.hoverTimeout);
        scrollbar.hoverTimeout = null;
        scrollbar.hoverVisible = true;
      } else if (!scrollbar.pointerHover && !scrollbar.mouseHover && scrollbar.hoverVisible && scrollbar.hoverTimeout === null) {
        scrollbar.hoverTimeout = root.setTimeout(() => {
          scrollbar.hoverTimeout = null;
          scrollbar.hoverVisible = false;
          syncScrollbarVisibility(state);
        }, SCROLLBAR_HOVER_HIDE_DELAY_MS);
      }
      syncScrollbarVisibility(state);
    }
    function clearScrollbarHover(state) {
      const scrollbar = state.scrollbar;
      if (scrollbar.hoverTimeout !== null) root.clearTimeout(scrollbar.hoverTimeout);
      scrollbar.hoverTimeout = null;
      scrollbar.hoverVisible = scrollbar.pointerHover = scrollbar.mouseHover = false;
    }
    function syncScrollbarVisibility(state) {
      const scrollbar = state.scrollbar;
      if (scrollbar.listening && (scrollbar.hoverVisible || scrollbar.drag || scrollbar.interactionVisible || state.cursor.owned)) showScrollbars(state);
      else hideScrollbars(state);
    }
    function clearScrollbarInteractionVisibility(state) {
      const scrollbar = state.scrollbar;
      if (scrollbar.interactionTimeout !== null) root.clearTimeout(scrollbar.interactionTimeout);
      scrollbar.interactionTimeout = null;
      scrollbar.interactionVisible = false;
    }
    function startScrollbarInteractionVisibility(state) {
      if (!state.scrollbar.listening) return;
      clearScrollbarInteractionVisibility(state);
      state.scrollbar.interactionVisible = true;
      syncScrollbarVisibility(state);
    }
    function scheduleScrollbarInteractionHide(state) {
      if (!state.scrollbar.listening || state.disposed) return;
      clearScrollbarInteractionVisibility(state);
      state.scrollbar.interactionVisible = true;
      syncScrollbarVisibility(state);
      state.scrollbar.interactionTimeout = root.setTimeout(() => {
        state.scrollbar.interactionTimeout = null;
        state.scrollbar.interactionVisible = false;
        syncScrollbarVisibility(state);
      }, SCROLLBAR_INTERACTION_HIDE_DELAY_MS);
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
        if (record.x !== x) style.setProperty(scrollbarProperties[0], `${x}px`);
        if (record.y !== y) style.setProperty(scrollbarProperties[1], `${y}px`);
        if (record.trackSize !== trackSize)
          style.setProperty(scrollbarProperties[2], `${trackSize}px`);
        if (record.thumbSize !== thumbSize)
          style.setProperty(scrollbarProperties[3], `${thumbSize}px`);
        if (record.thumbPosition !== thumbPosition)
          style.setProperty(scrollbarProperties[4], `${thumbPosition}px`);
        if (record.display !== display)
          style.setProperty(scrollbarProperties[5], display);
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
      suspendSnapStyles(state, "scrollbar", true);
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
      suspendSnapStyles(state, "scrollbar", false);
    }
    function configureSnap(state) {
      const element = state.element;
      const requested = element.hasAttribute(snapAttribute) && element.getAttribute(snapAttribute) !== "false";
      const root2 = state.elastic.wrapper || element;
      const items = collectSnapItems(state, root2);
      if (!requested || !items.length) {
        state.snapEnabled = false;
        removeSnapGestureListeners(state);
        restoreSnapStyles(state);
        state.snap.root = null;
        state.snap.initialized = false;
        state.snap.index = 0;
        state.snap.flick = null;
        state.snap.deferredIndex = null;
        clearSnapTarget(state);
        state.snap.notifiedItem = null;
        state.snap.notifiedIndex = null;
        clearScrollEnd(state);
        const missingItems = requested && !items.length;
        if (missingItems && !state.snap.invalidReported)
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_SCROLLBOX_SNAP_ITEMS,
            { element }
          );
        state.snap.invalidReported = missingItems;
        return;
      }
      state.snap.invalidReported = false;
      if (state.snap.root !== root2) {
        restoreSnapStyles(state);
        state.snap.root = root2;
        state.snap.initialized = false;
        state.snap.index = 0;
        state.snap.flick = null;
        state.snap.deferredIndex = null;
        clearSnapTarget(state);
        state.snap.notifiedItem = null;
        state.snap.notifiedIndex = null;
      }
      state.snapEnabled = true;
      addSnapGestureListeners(state);
    }
    function configureInlineWrapper(state) {
      const inline = state.inlineWrapper;
      const wrapper = state.elastic.wrapper;
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
      if (!inline.owned) inlineMemories.set(wrapper, AelluxJs.persist.element.save(
        wrapper,
        [],
        ["display"]
      ));
      wrapper.style.setProperty("display", replacement, "important");
      inline.owned = true;
    }
    function restoreInlineWrapper(state) {
      var _a;
      const inline = state.inlineWrapper;
      if (inline.owned && inline.element) (_a = inlineMemories.get(inline.element)) == null ? void 0 : _a.restore();
      if (inline.element) inlineMemories.delete(inline.element);
      inline.element = null;
      inline.owned = false;
      inline.reportedDisplay = null;
    }
    function syncSnapStyles(state, axis = snapAxis(state)) {
      const snap = state.snap;
      if (!state.snapEnabled || !snap.root) return;
      snap.axis = axis;
      state.element.classList.add(snapReadyClass);
      state.element.classList.toggle(
        snapSuspendedClass,
        snap.suspensions.pointer || snap.suspensions.elastic || snap.suspensions.scrollbar || snap.suspensions.wheel
      );
    }
    function suspendSnapStyles(state, reason, suspended) {
      if (!state.snapEnabled || !state.snap.root || state.snap.suspensions[reason] === suspended) return;
      state.snap.suspensions[reason] = suspended;
      syncSnapStyles(state, state.snap.axis || snapAxis(state));
      if (!suspended && !Object.values(state.snap.suspensions).some(Boolean))
        scheduleScrollEnd(state);
    }
    function scheduleSnapWheelIdle(state) {
      clearSnapWheelTimeout(state);
      state.snap.wheelTimeout = root.setTimeout(() => {
        state.snap.wheelTimeout = null;
      }, SNAP_SCROLL_IDLE_MS);
    }
    function clearSnapWheelTimeout(state) {
      const snap = state.snap;
      if (snap.wheelTimeout !== null) root.clearTimeout(snap.wheelTimeout);
      snap.wheelTimeout = null;
    }
    function suspendSnapForEdgeWheel(state) {
      const snap = state.snap;
      if (snap.edgeWheelTimeout !== null) root.clearTimeout(snap.edgeWheelTimeout);
      suspendSnapStyles(state, "wheel", true);
      snap.edgeWheelTimeout = root.setTimeout(() => {
        snap.edgeWheelTimeout = null;
        suspendSnapStyles(state, "wheel", false);
      }, SNAP_SCROLL_IDLE_MS);
    }
    function clearEdgeWheelSuspension(state) {
      const snap = state.snap;
      if (snap.edgeWheelTimeout !== null) root.clearTimeout(snap.edgeWheelTimeout);
      snap.edgeWheelTimeout = null;
      suspendSnapStyles(state, "wheel", false);
    }
    function restoreSnapStyles(state) {
      var _a;
      const snap = state.snap;
      clearSnapWheelTimeout(state);
      if (snap.edgeWheelTimeout !== null) root.clearTimeout(snap.edgeWheelTimeout);
      snap.edgeWheelTimeout = null;
      for (const item of snap.savedItems) {
        (_a = snapItemMemories.get(item)) == null ? void 0 : _a.restore();
        snapItemMemories.delete(item);
      }
      snap.savedItems.clear();
      state.element.classList.remove(snapReadyClass, snapSuspendedClass);
      snap.axis = null;
      snap.suspensions.pointer = false;
      snap.suspensions.elastic = false;
      snap.suspensions.scrollbar = false;
      snap.suspensions.wheel = false;
    }
    function collectSnapItems(state, root2) {
      return Array.from(root2.querySelectorAll(`[${snapItemAttribute}]`)).filter((item) => item.closest(`[${attribute}]`) === state.element);
    }
    function snapItems(state) {
      return state.snapEnabled && state.snap.root ? collectSnapItems(state, state.snap.root) : [];
    }
    function snapAxis(state) {
      return state.element.getAttribute(snapAttribute) === "vertical" ? "y" : "x";
    }
    function snapAlignment(item) {
      const value = item.getAttribute(snapItemAttribute);
      if (value === "start" || value === "left" || value === "top") return "start";
      if (value === "end" || value === "right" || value === "bottom") return "end";
      return "center";
    }
    function snapAlignmentOffset(state, item, axis, box = state.element.getBoundingClientRect(), target = item.getBoundingClientRect()) {
      const horizontal = axis === "x";
      const start = horizontal ? box.left + state.element.clientLeft : box.top + state.element.clientTop;
      const size = horizontal ? state.element.clientWidth : state.element.clientHeight;
      const itemStart = horizontal ? target.left : target.top;
      const itemSize = horizontal ? target.width : target.height;
      const alignment = snapAlignment(item);
      if (alignment === "start") return itemStart - start;
      if (alignment === "end") return itemStart + itemSize - start - size;
      return itemStart + itemSize / 2 - start - size / 2;
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
    function nearestSnapIndex(state, items, axis) {
      const box = state.element.getBoundingClientRect();
      let nearest = 0, distance = Infinity;
      for (let index = 0; index < items.length; index++) {
        const candidate = Math.abs(snapAlignmentOffset(state, items[index], axis, box));
        if (candidate < distance) {
          nearest = index;
          distance = candidate;
        }
      }
      return nearest;
    }
    function addSnapGestureListeners(state) {
      if (state.snap.gestureListening) return;
      onTarget(state.element, POINTER_DOWN_TARGET, state.onSnapPointerDown, true);
      onTarget(
        state.element,
        "$touchstart",
        state.onSnapTouchStart,
        { passive: true, capture: true }
      );
      state.snap.gestureListening = true;
    }
    function removeSnapGestureListeners(state) {
      if (state.snap.gestureListening) {
        offTarget(state.element, POINTER_DOWN_TARGET, state.onSnapPointerDown, true);
        offTarget(state.element, "$touchstart", state.onSnapTouchStart, true);
        state.snap.gestureListening = false;
      }
      stopSnapGestureEndListeners(state);
      state.snap.activePointers.clear();
      state.snap.activeTouches.clear();
      state.snap.waitingForGestureEnd = false;
    }
    function listenSnapGestureEnd(state) {
      if (state.snap.endListening) return;
      setListeners(root, state, snapEndListeners, true);
      state.snap.endListening = true;
    }
    function stopSnapGestureEndListeners(state) {
      if (!state.snap.endListening) return;
      setListeners(root, state, snapEndListeners, false);
      state.snap.endListening = false;
    }
    function beginSnapGesture(state, kind, event) {
      if (!state.snapEnabled || event.target.closest(
        `[${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`
      )) return;
      const snap = state.snap;
      const active = kind === POINTER ? snap.activePointers : snap.activeTouches;
      if (kind === POINTER) active.add(event.pointerId);
      else for (const touch of event.changedTouches) active.add(touch.identifier);
      if (!active.size) return;
      snap.flick = null;
      if (snap.scrollEndTimeout !== null || snap.scrollingToTarget !== -1)
        snap.waitingForGestureEnd = true;
      clearSnapTarget(state);
      clearScrollEnd(state);
      listenSnapGestureEnd(state);
    }
    function endSnapGesture(state, kind, event) {
      const snap = state.snap;
      if (kind === POINTER) snap.activePointers.delete(event.pointerId);
      else if (kind === "touch") {
        for (const touch of event.changedTouches) snap.activeTouches.delete(touch.identifier);
      } else {
        snap.activePointers.clear();
        snap.activeTouches.clear();
      }
      if (snap.activePointers.size || snap.activeTouches.size) return;
      stopSnapGestureEndListeners(state);
      if ((snap.waitingForGestureEnd || snap.flick) && snap.gestureListening && !state.disposed) {
        snap.waitingForGestureEnd = false;
        scheduleScrollEnd(state);
      }
    }
    function scheduleScrollEnd(state) {
      if (state.snap.scrollingToTarget !== -1) return;
      clearScrollEnd(state);
      if (state.snap.activePointers.size || state.snap.activeTouches.size) {
        state.snap.waitingForGestureEnd = true;
        return;
      }
      state.snap.waitingForGestureEnd = false;
      state.snap.scrollEndTimeout = root.setTimeout(() => {
        state.snap.scrollEndTimeout = null;
        finishNativeScroll(state);
      }, SNAP_SCROLL_IDLE_MS);
    }
    function scheduleSnapTargetIdle(state) {
      clearScrollEnd(state);
      state.snap.scrollEndTimeout = root.setTimeout(() => {
        state.snap.scrollEndTimeout = null;
        if (state.snap.scrollingToTarget === -1) return;
        clearSnapTarget(state);
        finishNativeScroll(state);
      }, SNAP_TARGET_IDLE_MS);
    }
    function clearScrollEnd(state) {
      if (state.snap.scrollEndTimeout !== null)
        root.clearTimeout(state.snap.scrollEndTimeout);
      state.snap.scrollEndTimeout = null;
    }
    function snapTargetReached(state) {
      const snap = state.snap;
      if (snap.scrollingToTarget === -1) return false;
      const position = snap.scrollingToAxis === "x" ? state.element.scrollLeft : state.element.scrollTop;
      return Math.abs(position - snap.scrollingToTarget) <= 1;
    }
    function clearSnapTarget(state) {
      state.snap.scrollingToTarget = -1;
      state.snap.scrollingToAxis = null;
    }
    function finishNativeScroll(state) {
      if (state.disposed || !state.snapEnabled) return;
      if (state.snap.activePointers.size || state.snap.activeTouches.size) {
        state.snap.waitingForGestureEnd = true;
        return;
      }
      if (state.snap.suspensions.pointer || state.snap.suspensions.elastic || state.snap.suspensions.wheel || state.momentum || state.scrollbar.drag || activePointerScrollState && activePointerScrollState.pointerScroll && activePointerScrollState.pointerScroll.chain.includes(state)) return;
      const items = snapItems(state);
      if (!items.length) return;
      const metrics = nativeMetrics(state.element);
      const axis = snapAxis(state);
      const edgeIndex = edgeSnapIndex(state, items, axis, metrics);
      const index = edgeIndex === null ? nearestSnapIndex(state, items, axis) : edgeIndex;
      const flick = state.snap.flick;
      state.snap.flick = null;
      if (flick && flick.axis === axis && flick.index !== index && flick.index >= 0 && flick.index < items.length) {
        scrollToSnap(state, flick.index, axis);
        return;
      }
      notifySnapChange(state, items[index], axis);
    }
    function initializeSnap(state) {
      const first = snapItems(state)[0];
      if (!first) return;
      state.snap.initialized = true;
      state.snap.index = 0;
      const axis = snapAxis(state);
      scrollToSnap(state, 0, axis, "instant");
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
    function scrollToSnap(state, index, axis = snapAxis(state), behavior = "smooth") {
      const items = snapItems(state);
      if (!items.length || !Number.isInteger(index) || index < 0 || index >= items.length)
        return false;
      if (state.snap.suspensions.elastic) {
        clearSnapTarget(state);
        clearScrollEnd(state);
        state.snap.deferredIndex = index;
        return true;
      }
      cancelMomentum(state);
      clearScrollEnd(state);
      state.snap.flick = null;
      state.snap.deferredIndex = null;
      state.snap.index = index;
      const element = state.element;
      const offset = snapAlignmentOffset(state, items[index], axis);
      const metrics = nativeMetrics(element);
      const destination = axis === "x" ? Math.max(0, Math.min(metrics.maxX, element.scrollLeft + offset)) : Math.max(0, Math.min(metrics.maxY, element.scrollTop + offset));
      state.snap.scrollingToTarget = destination;
      state.snap.scrollingToAxis = axis;
      if (axis === "x") element.scrollTo({ left: destination, behavior });
      else element.scrollTo({ top: destination, behavior });
      if (snapTargetReached(state)) {
        clearSnapTarget(state);
        scheduleScrollEnd(state);
      }
      return true;
    }
    function selectedSnapIndex(state) {
      const items = snapItems(state);
      if (!items.length) return 0;
      const metrics = nativeMetrics(state.element);
      const axis = snapAxis(state);
      const edge = edgeSnapIndex(state, items, axis, metrics);
      return edge === null ? nearestSnapIndex(state, items, axis) : edge;
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
        if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
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
        if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
        const computed = root.getComputedStyle(wrapper);
        state.elastic.wrapper = wrapper;
        state.elastic.dimensions = null;
        state.elastic.baseTransform = computed.transform === "none" ? "" : computed.transform;
        state.elastic.baseOrigin = computed.transformOrigin;
        elasticMemories.set(wrapper, AelluxJs.persist.element.save(
          wrapper,
          [],
          ["transform", "transform-origin"]
        ));
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
      if (value === "native" || value === POINTER) return value;
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
      syncScrollbarVisibility(state);
    }
    function restorePointerScrollCursor(state) {
      var _a;
      if (!state.cursor.owned) return;
      (_a = cursorMemories.get(state.element)) == null ? void 0 : _a.restore();
      state.cursor.owned = false;
      syncScrollbarVisibility(state);
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
      const chains = {
        x: pointerAxisChain(chain, axes, "x"),
        y: pointerAxisChain(chain, axes, "y")
      };
      if (!chains.x.some((member) => axes.get(member).x) && !chains.y.some((member) => axes.get(member).y)) return;
      const rect = element.getBoundingClientRect();
      if (event.clientX >= rect.left + element.clientWidth || event.clientY >= rect.top + element.clientHeight) return;
      const previousDown = state.lastPointerDown;
      const time = now();
      state.lastPointerDown = { x: event.clientX, y: event.clientY, time };
      if (previousDown && time - previousDown.time <= POINTER_SCROLL_MULTICLICK_MS && Math.abs(event.clientX - previousDown.x) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX && Math.abs(event.clientY - previousDown.y) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX) return;
      const textOrigin = isTextAtPoint(event.target, event.clientX, event.clientY);
      const selectionAtDown = readSelection();
      const verticalOnly = chains.y.some((member) => axes.get(member).y) && !chains.x.some((member) => axes.get(member).x);
      if (!textOrigin && event.cancelable) event.preventDefault();
      for (const member of /* @__PURE__ */ new Set([...chains.x, ...chains.y])) {
        cancelMomentum(member);
        member.snap.flick = null;
        clearSnapTarget(member);
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
        chains,
        axes,
        styles: [],
        momentumState: null,
        momentumStartX: 0,
        momentumStartY: 0,
        elasticForce: 0,
        startTime: time,
        endTime: null,
        snapStarts: new Map(chain.filter((member) => member.snapEnabled && (chains.x.includes(member) || chains.y.includes(member))).map((member) => {
          return [member, selectedSnapIndex(member)];
        })),
        selectionAtDown,
        verticalOnly,
        selectionReadyTime: textOrigin ? time + TEXT_SELECTION_WAIT_MS : 0,
        selectionWaitTimeout: null,
        pendingMove: null,
        momentumStartTime: time
      };
      activePointerScrollState = state;
      onTarget(root, POINTER_MOVE_TARGET, state.onPointerMove, { passive: false, capture: true });
      onTarget(
        root,
        "$touchmove",
        state.onPointerScrollTouchMove,
        { passive: false, capture: true }
      );
      for (const name of pointerScrollDragEvents) {
        onTarget(root, "$" + name, state.onPointerScrollNativeEvent, true);
      }
      onTarget(root, "$selectstart", state.onPointerScrollNativeEvent, true);
      for (const name of pointerScrollMouseEvents) {
        onTarget(root, "$" + name, state.onMouseEvent, { passive: false, capture: true });
      }
      onTarget(root, POINTER_UP_TARGET, state.onPointerEnd, true);
      onTarget(root, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
      onTarget(root, "$blur", state.onBlur);
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
        const chain = pointerScroll.chains[axis2];
        if (!chain.some((member) => pointerAxisMaximum(member, axis2, pointerScroll) > 0)) {
          endPointerScroll(state);
          return;
        }
        pointerScroll.chain = chain;
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
      const allowed = outermost && outermost.elasticEnabled ? elasticAxes(outermost) : null;
      const canStretch = allowed && allowed[axis];
      if (canStretch && pointerScroll.elasticForce) {
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
      if (canStretch) {
        pointerScroll.elasticForce += remaining;
        const element = outermost.element;
        const desiredX = element.scrollLeft + (axis === "x" ? pointerScroll.elasticForce : 0);
        const desiredY = element.scrollTop + (axis === "y" ? pointerScroll.elasticForce : 0);
        applyElasticFromDesired(outermost, desiredX, desiredY, false, axis, allowed);
        scrollWithinElasticBounds(outermost, desiredX, desiredY);
        publish(outermost);
      } else pointerScroll.elasticForce = 0;
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
    function pointerAxisChain(chain, axes, axis) {
      const result = [];
      for (const member of chain) {
        result.push(member);
        if (axes.get(member)[axis === "x" ? "stopX" : "stopY"]) break;
      }
      return result;
    }
    function activatePointerScroll(state, pointerScroll, axis) {
      pointerScroll.axis = axis;
      pointerScroll.moved = true;
      pointerScroll.started = true;
      restorePointerScrollCursor(state);
      for (const member of pointerScroll.chain) {
        if (pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
        const element = member.element;
        pointerScrollMemories.set(element, AelluxJs.persist.element.save(
          element,
          [],
          ["scroll-behavior"]
        ));
        pointerScroll.styles.push({
          element,
          classOwned: !element.classList.contains(pointerScrollingClass)
        });
        element.style.setProperty("scroll-behavior", "auto", "important");
        element.classList.add(pointerScrollingClass);
        if (member.snapEnabled) suspendSnapStyles(member, POINTER, true);
        startScrollbarInteractionVisibility(member);
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
      var _a;
      const pointerScroll = state.pointerScroll;
      if (!pointerScroll || event && event.pointerId !== pointerScroll.pointerId) return;
      pointerScroll.endTime = now();
      if (event && event.type === POINTER_UP) {
        pointerScroll.lastX = event.clientX;
        pointerScroll.lastY = event.clientY;
      }
      if (event && event.type === POINTER_UP && !pointerScroll.moved && pointerScroll.endTime < pointerScroll.selectionReadyTime && !selectionHasChanged(pointerScroll.selectionAtDown)) {
        const dx = pointerScroll.startX - event.clientX;
        const dy = pointerScroll.startY - event.clientY;
        const axis = pointerScroll.axis || (Math.abs(dx) >= Math.abs(dy) ? "x" : "y");
        const chain = pointerScroll.chains[axis];
        if (chain.some((member) => member.snapEnabled && snapAxis(member) === axis && pointerAxisMaximum(member, axis, pointerScroll) > 0) && isSnapFlick(pointerScroll, axis)) {
          pointerScroll.chain = chain;
          pointerScroll.axis = axis;
          pointerScroll.moved = true;
        }
      }
      state.pointerScroll = null;
      if (activePointerScrollState === state) activePointerScrollState = null;
      if (pointerScroll.selectionWaitTimeout !== null)
        root.clearTimeout(pointerScroll.selectionWaitTimeout);
      offTarget(root, POINTER_MOVE_TARGET, state.onPointerMove, true);
      offTarget(root, "$touchmove", state.onPointerScrollTouchMove, true);
      for (const name of pointerScrollDragEvents) {
        offTarget(root, "$" + name, state.onPointerScrollNativeEvent, true);
      }
      offTarget(root, "$selectstart", state.onPointerScrollNativeEvent, true);
      offTarget(root, POINTER_UP_TARGET, state.onPointerEnd, true);
      offTarget(root, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
      offTarget(root, "$blur", state.onBlur);
      if (pointerScroll.moved && !state.disposed) {
        state.mouseReleaseButton = pointerScroll.button;
        if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
        state.mouseReleaseTimeout = root.setTimeout(() => stopPointerScrollMouseEvents(state), 0);
      } else {
        stopPointerScrollMouseEvents(state);
      }
      for (const saved of pointerScroll.styles) {
        if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
        (_a = pointerScrollMemories.get(saved.element)) == null ? void 0 : _a.restore();
        pointerScrollMemories.delete(saved.element);
        const member = scrollboxes.get(saved.element);
        if (member) {
          suspendSnapStyles(member, POINTER, false);
          scheduleScrollbarInteractionHide(member);
        }
      }
      if (event && event.type === POINTER_UP && state.pointerListening) {
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
      const shouldSnap = event && event.type === POINTER_UP && pointerScroll.moved && snapState && !snapState.disposed && snapItems(snapState).length;
      if (shouldSnap) {
        recordSnapFlick(
          snapState,
          pointerScroll,
          pointerScroll.axis,
          pointerScroll.snapStarts.get(snapState)
        );
        scheduleScrollEnd(snapState);
      }
      for (const member of pointerScroll.chain) releaseElastic(member);
      if (!shouldSnap && event && event.type === POINTER_UP && pointerScroll.moved && momentumState && momentumState.momentumEnabled && !hadElastic && !momentumState.disposed && now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
        startMomentum(momentumState, pointerScroll);
      }
    }
    function recordSnapFlick(state, gesture, axis, startIndex) {
      if (!state.snapEnabled || snapAxis(state) !== axis || !Number.isInteger(startIndex) || !isSnapFlick(gesture, axis)) return;
      const distance = axis === "x" ? gesture.startX - gesture.lastX : gesture.startY - gesture.lastY;
      const items = snapItems(state);
      const index = Math.max(0, Math.min(
        items.length - 1,
        startIndex + Math.sign(distance)
      ));
      if (index !== startIndex) {
        state.snap.flick = { axis, index };
      }
    }
    function isSnapFlick(pointerScroll, axis) {
      const distance = axis === "x" ? pointerScroll.startX - pointerScroll.lastX : pointerScroll.startY - pointerScroll.lastY;
      const elapsed = Math.max(1, pointerScroll.endTime - pointerScroll.startTime);
      return elapsed <= SNAP_FLICK_WINDOW_MS && Math.abs(distance) > SNAP_FLICK_MIN_DISTANCE_PX && Math.abs(distance) < SNAP_FLICK_MAX_DISTANCE_PX && (elapsed <= SNAP_FLICK_FAST_TIME_MS || Math.abs(distance) / elapsed >= SNAP_SWIPE_SPEED_PX_MS);
    }
    function flushPendingSnap(state) {
      if (state.snapEnabled && !state.disposed) scheduleScrollEnd(state);
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
        offTarget(root, "$" + name, state.onMouseEvent, true);
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
      setListeners(state.element, state, touchListeners, true);
      state.touchListening = true;
    }
    function removeTouchListeners(state) {
      setListeners(state.element, state, touchListeners, false);
      state.touchListening = false;
      state.elastic.touch = null;
    }
    function startTouch(state, event) {
      if (event.target.closest(
        `[${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`
      )) return;
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
    function elasticAxes(state) {
      const style = root.getComputedStyle(state.element);
      return {
        x: style.overscrollBehaviorX !== "none",
        y: style.overscrollBehaviorY !== "none"
      };
    }
    function applyElasticFromDesired(state, desiredX, desiredY, additive, axis = null, allowed = elasticAxes(state)) {
      if (!state.elasticEnabled) return false;
      const element = state.element;
      const metrics = state.metrics || nativeMetrics(element);
      const elastic = state.elastic;
      const amounts = [0, 0, 0, 0];
      if (axis !== "x" && allowed.y && metrics.maxY > 1) {
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
      if (axis !== "y" && allowed.x && metrics.maxX > 1) {
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
      if (active) suspendSnapStyles(state, "elastic", true);
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
          elasticMemories.get(wrapper).cssProperties["transform-origin"].priority
        );
      }
      wrapper.style.setProperty(
        "transform",
        [scale, translate, elastic.baseTransform].filter(Boolean).join(" ") || "none",
        elasticMemories.get(wrapper).cssProperties.transform.priority
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
      if (AelluxJs.currentPreference("reduced-motion") === "reduced") {
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
      publish(state);
      elastic.releaseFrame = root.requestAnimationFrame(() => stepElasticRelease(state));
    }
    function resetElastic(state) {
      var _a;
      const elastic = state.elastic;
      const wasOwned = elastic.owned;
      if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
      if (elastic.wheelTimeout !== null) root.clearTimeout(elastic.wheelTimeout);
      elastic.releaseFrame = null;
      elastic.wheelTimeout = null;
      if (elastic.wrapper) elastic.wrapper.classList.remove(elasticReleaseClass);
      if (elastic.owned && elastic.wrapper) {
        (_a = elasticMemories.get(elastic.wrapper)) == null ? void 0 : _a.restore();
      }
      elastic.amounts = [0, 0, 0, 0];
      elastic.active = false;
      elastic.owned = false;
      if (wasOwned && !state.disposed) {
        suspendSnapStyles(state, "elastic", false);
        if (state.snap.deferredIndex !== null) {
          const index = state.snap.deferredIndex;
          state.snap.deferredIndex = null;
          scrollToSnap(state, index);
        }
      }
      if (wasOwned && !state.disposed) publish(state);
    }
    function observe(state) {
      state.onResize = () => scheduleResize(state);
      onTarget(root, "$resize", state.onResize, { passive: true });
      if (root.matchMedia) {
        state.desktopMedia = root.matchMedia("(hover: hover) and (pointer: fine)");
        state.onDesktopMediaChange = () => configure(state);
        if (state.desktopMedia.addEventListener)
          state.desktopMedia.addEventListener("change", state.onDesktopMediaChange);
        else if (state.desktopMedia.addListener)
          state.desktopMedia.addListener(state.onDesktopMediaChange);
      }
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
          if (records.some((record) => record.type === "attributes" || record.target === state.element || record.target === state.elastic.wrapper || [...record.addedNodes, ...record.removedNodes].some((node) => node.nodeType === 1 && (node.hasAttribute(snapItemAttribute) || node.querySelector(`[${snapItemAttribute}]`))))) configure(state);
          else refresh(state);
        });
        state.mutationObserver.observe(
          state.element,
          {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: [
              snapAttribute,
              snapItemAttribute,
              elasticAttribute,
              scrollbarAttribute
            ]
          }
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
      const stopsChain = (value) => value === "contain" || value === "none";
      return {
        x: metrics.maxX > 1 && available(style.overflowX),
        y: metrics.maxY > 1 && available(style.overflowY),
        stopX: available(style.overflowX) && stopsChain(style.overscrollBehaviorX),
        stopY: available(style.overflowY) && stopsChain(style.overscrollBehaviorY)
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
        const axes = bars ? wheelAxes(state, metrics) : null;
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
          snapAxis: state.snapEnabled ? snapAxis(state) : null,
          snapValues: state.snapEnabled ? measureSnapValues(state) : [],
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
          if (values.snapAxis && state.snap.axis !== values.snapAxis)
            syncSnapStyles(state, values.snapAxis);
          for (const { item, viewport, focus } of values.snapValues) {
            if (!state.snap.savedItems.has(item)) {
              snapItemMemories.set(item, AelluxJs.persist.element.save(item, [], snapProperties));
              state.snap.savedItems.add(item);
            }
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
    function measureSnapValues(state) {
      const element = state.element;
      const rect = element.getBoundingClientRect();
      const axis = snapAxis(state);
      const size = axis === "x" ? element.clientWidth : element.clientHeight;
      if (!size) return [];
      const center = axis === "x" ? rect.left + element.clientLeft + size / 2 : rect.top + element.clientTop + size / 2;
      return snapItems(state).map((item) => {
        const box = item.getBoundingClientRect();
        const itemCenter = axis === "x" ? box.left + box.width / 2 : box.top + box.height / 2;
        const viewport = Math.max(-2, Math.min(2, (itemCenter - center) * 2 / size));
        const focus = Math.max(0, 1 - Math.abs(snapAlignmentOffset(state, item, axis, rect, box)) / size);
        return { item, viewport, focus };
      });
    }
    function progress(position, distance) {
      return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
    }
    function handleSnapWheel(state, event) {
      if (!state.snapEnabled) return false;
      const axis = snapAxis(state);
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const delta = axis === "x" ? horizontal ? event.deltaX : state.wheelEnabled ? event.deltaY : 0 : horizontal ? 0 : event.deltaY;
      if (!delta) return false;
      const items = snapItems(state);
      if (!items.length) {
        if (event.cancelable) event.preventDefault();
        return true;
      }
      const metrics = nativeMetrics(state.element);
      const edge = edgeSnapIndex(state, items, axis, metrics);
      const index = edge !== null ? edge : state.snap.scrollingToTarget !== -1 ? state.snap.index : selectedSnapIndex(state);
      const next2 = index + Math.sign(delta);
      if (next2 < 0 || next2 >= items.length) {
        if (state.snap.scrollingToTarget !== -1) {
          if (event.cancelable) event.preventDefault();
          return true;
        }
        suspendSnapForEdgeWheel(state);
        const position = axis === "x" ? state.element.scrollLeft : state.element.scrollTop;
        const maximum = axis === "x" ? metrics.maxX : metrics.maxY;
        if (delta < 0 ? position <= 1 : position >= maximum - 1) {
          const style = root.getComputedStyle(state.element);
          const behavior = horizontal ? style.overscrollBehaviorX : style.overscrollBehaviorY;
          if (behavior === "contain" || behavior === "none") event.preventDefault();
        }
        return false;
      }
      clearEdgeWheelSuspension(state);
      if (event.cancelable) event.preventDefault();
      if (state.scrollbar.drag || state.snap.suspensions.elastic) return true;
      const busy = state.snap.wheelTimeout !== null;
      scheduleSnapWheelIdle(state);
      if (busy) return true;
      scrollToSnap(state, next2, axis);
      return true;
    }
    function handleWheel(state, event) {
      if (event.ctrlKey || !event.cancelable) return;
      state.snap.flick = null;
      if (state.desktop && state.mode === POINTER && state.element.classList.contains(pointerScrollingClass)) {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        return;
      }
      cancelMomentum(state);
      if (event.defaultPrevented) return;
      if (event.target.closest(`[${attribute}]`) !== state.element) return;
      if (handleSnapWheel(state, event)) return;
      const interruptedSnap = state.snap.scrollingToTarget !== -1;
      clearSnapTarget(state);
      clearScrollEnd(state);
      if (interruptedSnap && state.snapEnabled) scheduleScrollEnd(state);
      const metrics = nativeMetrics(state.element);
      if (!metrics) return;
      const axes = wheelAxes(state, metrics);
      const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
      const converted = state.desktop && state.wheelEnabled && axes.x && !axes.y && Math.abs(event.deltaX) <= Math.abs(event.deltaY);
      const deltaX = (converted ? event.deltaY : event.deltaX) * factor;
      const deltaY = (converted ? 0 : event.deltaY) * factor;
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
          if (!state.snapEnabled) event.preventDefault();
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
