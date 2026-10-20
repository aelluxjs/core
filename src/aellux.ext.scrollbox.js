/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Scrollbox Extension
 *
 * Purpose: enhances native scrolling with progress state, optional pointer drag
 * scroll (PDS), elastic edges and custom scrollbars.
 *
 * Capability profile: interaction and input, visual state, and motion.
 *
 * Inputs and activation: mounts `[data-ae-scrollbox]`; `native` is the default
 * and `pointer` enables desktop mouse or pen dragging. A single marked content
 * child enables elastic behavior. `data-ae-scrollbar` enables bars.
 * Native scroll, wheel, pointer and touch input drive the relevant features.
 *
 * Outputs and owned state: publishes scroll progress and edge classes on the
 * box and PDS events. It creates custom bars when needed.
 *
 * Lifecycle: removes listeners and owned bars, stops animations, clears its
 * classes and restores owned inline styles on unmount.
 *
 * Accessibility: native scrolling remains available. Consumers must keep
 * scrollable content reachable and provide usable controls for essential
 * interactions that depend on pointer gestures.
 */

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "scrollbox";
  if (!AelluxJs) throw new Error('[aellux.js] Load the boot script before the scrollbox extension.');
  const { onEvent, offEvent } = AelluxJs;

  const
    POINTER = "pointer",
    POINTER_DOWN = `${POINTER}down`,
    POINTER_MOVE = `${POINTER}move`,
    POINTER_UP = `${POINTER}up`,
    POINTER_CANCEL = `${POINTER}cancel`,
    POINTER_OVER = `${POINTER}over`,
    POINTER_OUT = `${POINTER}out`,
    POINTER_ENTER = `${POINTER}enter`,
    POINTER_LEAVE = `${POINTER}leave`,
    POINTER_DOWN_TARGET = `$${POINTER_DOWN}`,
    POINTER_MOVE_TARGET = `$${POINTER_MOVE}`,
    POINTER_UP_TARGET = `$${POINTER_UP}`,
    POINTER_CANCEL_TARGET = `$${POINTER_CANCEL}`;

  const attribute = AelluxJs.attr(extensionName);
  const wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
  const momentumAttribute = AelluxJs.attr("scrollbox-momentum");
  const elasticAttribute = AelluxJs.attr("scrollbox-elastic");

  const scrollbarAttribute = AelluxJs.attr("scrollbar");
  const scrollbarVerticalAttribute = AelluxJs.attr("scrollbar-vertical");
  const scrollbarHorizontalAttribute = AelluxJs.attr("scrollbar-horizontal");

  const elasticReleaseClass = AelluxJs.className("scrollbox-elastic-release");
  const pointerScrollingClass = AelluxJs.className("pointerscrolling");
  const nativeScrollbarHideClass = AelluxJs.className("native-sb-hide");
  const scrollbarVisibleClass = AelluxJs.className("scrollbar-visible");
  const scrollEdgeClasses = [
    AelluxJs.className("scroll-v-start"), AelluxJs.className("scroll-v-end"),
    AelluxJs.className("scroll-h-start"), AelluxJs.className("scroll-h-end")
  ];

  const pointerScrollExceptionSelector =
    `a, button, input, select, textarea, [contenteditable], [draggable='true'], ` +
    `[${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`;

  const SCROLL_EDGE_MARGIN_PX = 5;
  let nextLayoutId = 3000000;

  const POINTER_SCROLL_THRESHOLD_PX = 3;
  const POINTER_SCROLL_MULTICLICK_MS = 500;
  const POINTER_SCROLL_MULTICLICK_DISTANCE_PX = 8;
  const TEXT_SELECTION_WAIT_MS = 100;
  const VERTICAL_TEXT_DRAG_PX = 10;

  const MOMENTUM_LIMIT_TIME_MS = 300;
  const MOMENTUM_LIMIT_DISTANCE_PX = 15;
  const MOMENTUM_DECELERATION = 0.0015;


  const ELASTIC_DAMPING = 1 / 3;
  const DEFAULT_ELASTIC_LIMIT = { unit: "ratio", value: 1 / 4 };
  const ELASTIC_RETURN_LERP = 0.15;
  const ELASTIC_RETURN_EPSILON = 0.01;
  const ELASTIC_WHEEL_IDLE_MS = 80;

  const SCROLLBAR_MIN_THUMB_PX = 20;
  const SCROLLBAR_INTERACTION_HIDE_DELAY_MS = 1000;
  const SCROLLBAR_HOVER_HIDE_DELAY_MS = 300;

  const scrollbarProperties = [
    "--ae-scrollbar-x", "--ae-scrollbar-y", "--ae-scrollbar-length",
    "--ae-scrollbar-thumb-size", "--ae-scrollbar-thumb-position",
    "--ae-scrollbar-display"
  ];

  const pointerListeners = [
    [POINTER_DOWN, "onPointerDown"], [POINTER_OVER, "onPointerOver"],
    [POINTER_OUT, "onPointerOut"], ["mousedown", "onMouseDown"]
  ];
  const scrollbarHoverListeners = [
    [POINTER_DOWN, "onScrollbarPointerDown"],
    [POINTER_ENTER, "onScrollbarPointerEnter"], [POINTER_LEAVE, "onScrollbarPointerLeave"],
    [POINTER_OVER, "onScrollbarPointerOver"], [POINTER_OUT, "onScrollbarPointerOut"],
    [POINTER_MOVE, "onScrollbarPointerMove"],
    [POINTER_UP, "onScrollbarPointerEnd"], [POINTER_CANCEL, "onScrollbarPointerEnd"],
    ["mouseenter", "onScrollbarMouseEnter"], ["mouseleave", "onScrollbarMouseLeave"],
    ["mouseover", "onScrollbarMouseOver"], ["mouseout", "onScrollbarMouseOut"]
  ];
  const scrollbarAxisListeners = [
    [POINTER_DOWN, "onPointerDown"], [POINTER_MOVE, "onPointerMove"],
    [POINTER_UP, "onPointerEnd"], [POINTER_CANCEL, "onPointerEnd"]
  ];
  const touchListeners = [
    ["touchstart", "onTouchStart", { passive: true }],
    ["touchmove", "onTouchMove", { passive: false }],
    ["touchend", "onTouchEnd", { passive: true }],
    ["touchcancel", "onTouchEnd", { passive: true }]
  ];

  function setListeners(target, owner, entries, active) {
    const method = active ? onEvent : offEvent;
    for (const [event, handler, options] of entries) {
      method(target, `$${event}`, owner[handler], active ? options :
        options === true || !!options?.capture);
    }
  }

  function isTouch(callback) { return (event) => { if (event && event.pointerType !== "touch") { callback(event); } } }

  const pointerScrollMouseEvents = [
    "mousedown", "mousemove", "mouseup", "click", "dblclick", "auxclick",
    "contextmenu", "mouseover", "mouseout", "mouseenter", "mouseleave"
  ];
  const pointerScrollDragEvents = [
    "dragstart", "drag", "dragenter", "dragover", "dragleave", "drop", "dragend"
  ];
  const mouseHoldEvents = new Set([
    "mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave"
  ]);
  const mouseReleaseEvents = new Set([
    "mouseup", "click", "dblclick", "auxclick", "contextmenu"
  ]);

  const properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
  const scrollboxes = new Map();
  const elementMemories = new WeakMap();
  const cursorMemories = new WeakMap();
  const scrollbarMemories = new WeakMap();
  const inlineMemories = new WeakMap();
  const elasticMemories = new WeakMap();
  const pointerScrollMemories = new WeakMap();
  let snapController = null;
  let activePointerScrollState = null;

  AelluxJs.extAttach(extensionName, {
    init, destroy, next, previous, goto, registerSnapController, unregisterSnapController
  });

  function init() {
    AelluxJs.registerCssProperty(
      ...properties.map(name =>
        ({ name, syntax: "<number>", initialValue: "0" })),
      ...scrollbarProperties.map((name, index) => ({
        name,
        syntax: index === 5 ? "block | none" : "<length>",
        initialValue: index === 5 ? "none" : "0px"
      })),
      { name: "--ae-scrollbar-opacity-visible", syntax: "<number>", initialValue: "1" },
      { name: "--ae-scrollbar-opacity-fade", syntax: "<number>", initialValue: "0" },
      { name: "--ae-scrollbar-thumb-color", syntax: "*" },
      { name: "--ae-scrollbar-thumb-hover-color", syntax: "*" },
      { name: "--ae-scrollbar-track-color", syntax: "*" },
      {
        name: "--ae-scrollbar-thumb-radius", syntax: "<length-percentage>",
        initialValue: "10px"
      },
      { name: "--ae-scrollbar-size", syntax: "<length>", initialValue: "8px" }
    );
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attribute}]`,
      priority: 0,
      mount: mountScrollbox, update: updateScrollbox, unmount: unmountScrollbox,
      controllers: ["next", "previous", "goto"]
    });
  }

  function destroy() {
    for (const element of scrollboxes.keys()) unmountScrollbox(element);
    AelluxJs.mountManager.remove({ extensionName });
  }

  function registerSnapController(controller) { snapController = controller; }

  function unregisterSnapController(controller) {
    if (snapController === controller) snapController = null;
  }

  function goto(element, index, behavior) {
    return snapController?.goto(element, index, behavior) || false;
  }

  function next(element) { return snapController?.next(element) || false; }

  function previous(element) { return snapController?.previous(element) || false; }

  function dispatchInteraction(state, reason, active) {
    AelluxJs.dispatchFrom(state.element, "ScrollboxInteraction", {
      detail: { reason, active: !!active }
    });
  }

  function dispatchSnapGesture(state, phase, pointerScroll) {
    return AelluxJs.dispatchFrom(state.element, "ScrollboxSnapGesture", {
      cancelable: phase !== "start",
      detail: {
        phase, axis: pointerScroll.axis, moved: pointerScroll.moved,
        startX: pointerScroll.startX, startY: pointerScroll.startY,
        lastX: pointerScroll.lastX, lastY: pointerScroll.lastY,
        startTime: pointerScroll.startTime, endTime: pointerScroll.endTime
      }
    });
  }

  function dispatchWheel(state, event) {
    return AelluxJs.dispatchFrom(state.element, "ScrollboxWheel", {
      cancelable: true, detail: { event }
    });
  }

  function mountScrollbox(element) {
    if (scrollboxes.has(element)) return;
    elementMemories.set(element, AelluxJs.persist.element.save(element, [], properties));
    cursorMemories.set(element, AelluxJs.persist.element.save(element, [], ["cursor"]));
    const elastic = {
      wrapper: null, baseTransform: "", baseOrigin: "",
      baseMargins: null,
      dimensions: null,

      invalidReported: false, invalidLimit: null,
      limits: [DEFAULT_ELASTIC_LIMIT, DEFAULT_ELASTIC_LIMIT],
      amounts: [0, 0, 0, 0], active: false, owned: false, touch: null,
      releaseFrame: null, wheelTimeout: null
    };

    const inlineWrapper = {
      element: null, owned: false, reportedDisplay: null
    };

    const scrollbar = {
      x: null, y: null, drag: null, hideOwned: false, visibleOwned: false,
      listening: false, pointerHover: false, mouseHover: false,
      hoverVisible: false, hoverTimeout: null,
      interactionVisible: false, interactionTimeout: null,
      lastScrollLeft: null, lastScrollTop: null
    };

    const state = {
      element, metrics: null, mode: null, desktop: false,
      cursor: { owned: false },

      wheelEnabled: true, momentumEnabled: true, elasticEnabled: false,
      wheelListening: false, pointerListening: false, touchListening: false,

      pointerScroll: null, lastPointerDown: null,
      mouseReleaseButton: null, mouseReleaseTimeout: null,

      momentum: null, elastic, inlineWrapper, scrollbar,
      resizeObserver: null, mutationObserver: null, desktopMedia: null,

      publishPending: false, publishDirty: false, layoutRevision: 0,
      resizeLayoutId: nextLayoutId++, disposed: false
    };

    state.onScroll = event => {
      if (event.target !== element) return;
      if ((state.scrollbar.x || state.scrollbar.y) &&
        (state.scrollbar.lastScrollLeft !== element.scrollLeft ||
          state.scrollbar.lastScrollTop !== element.scrollTop)) {
        const metrics = nativeMetrics(element);
        updateScrollbars(state, readScrollbars(state, metrics, wheelAxes(state, metrics)));
        state.scrollbar.lastScrollLeft = element.scrollLeft;
        state.scrollbar.lastScrollTop = element.scrollTop;
      }
      publish(state);
      if (!state.desktop && state.scrollbar.listening) scheduleScrollbarInteractionHide(state);
    };
    state.onScrollEnd = event => {
      if (event.target !== element) return;
    };
    state.onWheel = event => handleWheel(state, event);

    state.onPointerDown = event => startPointerScroll(state, event);
    state.onPointerOver = event => updatePointerScrollCursor(state, event.target,
      event.clientX, event.clientY);
    state.onPointerOut = event => {
      if (state.pointerScroll && state.pointerScroll.moved) return;
      if (!event.relatedTarget || !element.contains(event.relatedTarget))
        restorePointerScrollCursor(state);
    };
    state.onMouseDown = event => {
      if (event.button === 0 && event.detail > 1) endPointerScroll(state);
    };
    state.onPointerMove = event => movePointerScroll(state, event);
    state.onMouseEvent = event => cancelPointerScrollMouseEvent(state, event);
    state.onPointerScrollTouchMove = event => {
      if (state.pointerScroll && state.pointerScroll.moved && event.cancelable)
        event.preventDefault();
    };
    state.onPointerScrollNativeEvent = event => {
      if (state.pointerScroll && state.pointerScroll.moved && event.cancelable)
        event.preventDefault();
    };
    state.onPointerEnd = event => endPointerScroll(state, event);
    state.onBlur = () => endPointerScroll(state);

    state.onTouchStart = event => startTouch(state, event);
    state.onTouchMove = event => moveTouch(state, event);
    state.onTouchEnd = event => endTouch(state, event);

    state.onScrollbarPointerDown = isTouch(() => startScrollbarInteractionVisibility(state));
    state.onScrollbarPointerEnd = isTouch(() => scheduleScrollbarInteractionHide(state));
    state.onScrollbarPointerEnter = isTouch(() => setScrollbarHover(state, "pointerHover", true));
    state.onScrollbarPointerLeave = isTouch(() => setScrollbarHover(state, "pointerHover", false));
    state.onScrollbarPointerOver = isTouch(() => setScrollbarHover(state, "pointerHover", true));
    state.onScrollbarPointerOut = isTouch(event => {
      if (!event.relatedTarget || !element.contains(event.relatedTarget))
        setScrollbarHover(state, "pointerHover", false);
    });
    state.onScrollbarPointerMove = isTouch(() => {
      if (!state.scrollbar.pointerHover)
        setScrollbarHover(state, "pointerHover", true);
    });
    state.onScrollbarMouseEnter = () => {
      if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
    };
    state.onScrollbarMouseLeave = () => setScrollbarHover(state, "mouseHover", false);
    state.onScrollbarMouseOver = () => {
      if (supportsMouseHover()) setScrollbarHover(state, "mouseHover", true);
    };
    state.onScrollbarMouseOut = event => {
      if (!event.relatedTarget || !element.contains(event.relatedTarget))
        setScrollbarHover(state, "mouseHover", false);
    };
    state.onScrollbarOutsideDown = event => {
      if (!element.contains(event.target)) {
        setScrollbarHover(state, "pointerHover", false);
        setScrollbarHover(state, "mouseHover", false);
        if (!element.classList.contains(pointerScrollingClass))
          clearScrollbarInteractionVisibility(state);
        syncScrollbarVisibility(state);
      }
    };

    scrollboxes.set(element, state);
    onEvent(element, "$scroll", state.onScroll, { passive: true });
    onEvent(element, "$scrollend", state.onScrollEnd, { passive: true });
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
    if (activePointerScrollState && activePointerScrollState.pointerScroll &&
      activePointerScrollState.pointerScroll.chain.includes(state))
      endPointerScroll(activePointerScrollState);
    endPointerScroll(state);
    stopPointerScrollMouseEvents(state);
    restorePointerScrollCursor(state);
    cancelMomentum(state);
    resetElastic(state);
    if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
    restoreInlineWrapper(state);
    resetScrollbars(state);
    offEvent(element, "$scroll", state.onScroll);
    offEvent(element, "$scrollend", state.onScrollEnd);
    if (state.wheelListening) offEvent(element, "$wheel", state.onWheel, true);
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
    AelluxJs.waitLayout.cancel(state.resizeLayoutId);
    offEvent(root, "$resize", state.onResize);
    elementMemories.get(element)?.restore();
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
    configureInlineWrapper(state);
    configureScrollbars(state);

    state.desktop = isDesktop();
    if ((state.desktop || state.elasticEnabled) && !state.wheelListening) {
      onEvent(element, "$wheel", state.onWheel, { passive: false, capture: true });
      state.wheelListening = true;
    } else if (!state.desktop && !state.elasticEnabled &&
      state.wheelListening) {
      offEvent(element, "$wheel", state.onWheel, true);
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
      if (activePointerScrollState && activePointerScrollState.pointerScroll &&
        activePointerScrollState.pointerScroll.chain.includes(state))
        endPointerScroll(activePointerScrollState);
      setListeners(element, state, pointerListeners, false);
      state.pointerListening = false;
      endPointerScroll(state);
      state.lastPointerDown = null;
      restorePointerScrollCursor(state);
    }

    refresh(state);
  }

  function contentChildren(element) {
    return Array.from(element.children).filter(child =>
      !child.hasAttribute(scrollbarVerticalAttribute) &&
      !child.hasAttribute(scrollbarHorizontalAttribute));
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
    let scrollbarElement = null;

    if (enabled) scrollbarElement = Array.from(state.element.children).find(child =>
      child.hasAttribute(attributeName)) || null;
    if (current && current.element === scrollbarElement && enabled) {
      positionScrollbarAxis(state, current);
      return;
    }
    if (current) resetScrollbarAxis(state, axis);
    if (!enabled) return;

    const owned = !scrollbarElement;
    if (!scrollbarElement) {
      scrollbarElement = root.document.createElement("div");
      scrollbarElement.setAttribute(attributeName, "");
      state.element.appendChild(scrollbarElement);
    }

    const marker = owned ? null : root.document.createComment("scrollbar position");
    if (marker) scrollbarElement.before(marker);
    if (!owned) scrollbarMemories.set(scrollbarElement, AelluxJs.persist.element.save(
      scrollbarElement, [], scrollbarProperties
    ));
    const record = {
      element: scrollbarElement, owned, axis, marker,
      thumbPosition: null, thumbSize: null,
      trackSize: null, max: null, display: null
    };

    record.onPointerDown = event => startScrollbarDrag(state, record, event);
    record.onPointerMove = event => moveScrollbarDrag(state, record, event);
    record.onPointerEnd = event => endScrollbarDrag(state, record, event);

    setListeners(scrollbarElement, record, scrollbarAxisListeners, true);
    scrollbar[axis] = record;
    positionScrollbarAxis(state, record);
  }

  function positionScrollbarAxis(state, record) {
    const container = state.element;
    if (record.axis === "y" && container.firstChild !== record.element)
      container.prepend(record.element);
    else if (record.axis === "x" && container.lastChild !== record.element)
      container.append(record.element);
  }

  function resetScrollbarAxis(state, axis) {
    const record = state.scrollbar[axis];
    if (!record) return;
    endScrollbarDrag(state, record);
    const element = record.element;
    setListeners(element, record, scrollbarAxisListeners, false);
    if (record.owned) element.remove();
    else {
      scrollbarMemories.get(element)?.restore();
      if (record.marker.parentNode) record.marker.replaceWith(element);
      else record.marker.remove();
    }
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
    } else if (!scrollbar.pointerHover && !scrollbar.mouseHover &&
      scrollbar.hoverVisible && scrollbar.hoverTimeout === null) {
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
    if (scrollbar.listening && (scrollbar.hoverVisible ||
      scrollbar.drag || scrollbar.interactionVisible || state.cursor.owned)) showScrollbars(state);
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
      const metrics = nativeMetrics(state.element);
      updateScrollbars(state, readScrollbars(state, metrics, wheelAxes(state, metrics)));
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
      const thumbSize = max > 1 ? Math.min(trackSize,
        Math.max(SCROLLBAR_MIN_THUMB_PX, trackSize * trackSize / scrollSize)) : 0;
      const position = vertical ? element.scrollTop : element.scrollLeft;
      const thumbPosition = max > 0 ?
        (trackSize - thumbSize) * progress(position, max) : 0;
      const display = axes[axis] ? "block" : "none";
      values.push({
        record, trackSize, thumbSize, thumbPosition,
        max: axes[axis] ? max : 0, display
      });
    }
    return values;
  }

  function updateScrollbars(state, values) {
    for (const { record, trackSize, thumbSize, thumbPosition, max, display } of values) {
      if (state.scrollbar[record.axis] !== record) continue;
      const style = record.element.style;
      if (record.trackSize !== trackSize)
        style.setProperty(scrollbarProperties[2], `${trackSize}px`);
      if (record.thumbSize !== thumbSize)
        style.setProperty(scrollbarProperties[3], `${thumbSize}px`);
      if (record.thumbPosition !== thumbPosition)
        style.setProperty(scrollbarProperties[4], `${thumbPosition}px`);
      if (record.display !== display)
        style.setProperty(scrollbarProperties[5], display);
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

  function visibleScrollbarTrack(record) {
    const style = root.getComputedStyle(record.element);
    if (Number.parseFloat(style.opacity) <= 0) return false;
    const color = style.backgroundColor;
    if (!color || color === "transparent") return false;
    const rgba = color.match(/^rgba\((.+)\)$/);
    return !rgba || Number.parseFloat(rgba[1].split(",").at(-1)) > 0;
  }

  function startScrollbarDrag(state, record, event) {
    if (state.disposed || event.button !== 0 || !record.max) return;

    if (activePointerScrollState && activePointerScrollState.pointerScroll &&
      activePointerScrollState.pointerScroll.chain.includes(state))
      endPointerScroll(activePointerScrollState);
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();

    const position = scrollbarPointerPosition(record, event);
    if (event.pointerType !== "touch") state.scrollbar.pointerHover = true;
    showScrollbars(state);
    if (position < record.thumbPosition ||
      position > record.thumbPosition + record.thumbSize) {
      if (!visibleScrollbarTrack(record)) return;
      const travel = record.trackSize - record.thumbSize;
      const thumbStart = Math.max(0, Math.min(travel, position - record.thumbSize / 2));
      const destination = travel > 0 ? thumbStart / travel * record.max : 0;
      if (record.axis === "y") state.element.scrollTo({ top: destination });
      else state.element.scrollTo({ left: destination });
      return;
    }

    state.scrollbar.drag = {
      record, pointerId: event.pointerId,
      offset: position - record.thumbPosition
    };
    dispatchInteraction(state, "scrollbar", true);
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
      trackSize: record.trackSize, thumbSize: record.thumbSize,
      thumbPosition: travel * destination / record.max,
      max: record.max, display: record.display
    }]);

    publish(state);
  }

  function endScrollbarDrag(state, record, event) {
    const drag = state.scrollbar.drag;
    if (!drag || drag.record !== record ||
      event && drag.pointerId !== event.pointerId) return;
    if (event) {
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
    }
    state.scrollbar.drag = null;
    if (record.element.hasPointerCapture &&
      record.element.hasPointerCapture(drag.pointerId))
      record.element.releasePointerCapture(drag.pointerId);
    syncScrollbarVisibility(state);
    dispatchInteraction(state, "scrollbar", false);
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
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_WRAPPER_DISPLAY,
        { element: wrapper, display });
      inline.reportedDisplay = display;
    }

    const replacement = {
      block: "inline-block", flex: "inline-flex", grid: "inline-grid",
      "flow-root": "inline-block", table: "inline-table"
    }[display];
    if (!replacement) return;

    if (!inline.owned) inlineMemories.set(wrapper, AelluxJs.persist.element.save(
      wrapper, [], ["display"]
    ));

    wrapper.style.setProperty("display", replacement, "important");
    inline.owned = true;
  }

  function restoreInlineWrapper(state) {
    const inline = state.inlineWrapper;
    if (inline.owned && inline.element) inlineMemories.get(inline.element)?.restore();
    if (inline.element) inlineMemories.delete(inline.element);
    inline.element = null;
    inline.owned = false;
    inline.reportedDisplay = null;
  }

  function configureElastic(state) {
    const element = state.element;
    const children = contentChildren(element);
    const child = children.length === 1 ? children[0] : null;
    const wrapper = child && child.hasAttribute(elasticAttribute) &&
      child.getAttribute(elasticAttribute) !== "false" ? child : null;
    if (!wrapper) {
      resetElastic(state);
      if (state.elastic.wrapper) elasticMemories.delete(state.elastic.wrapper);
      state.elasticEnabled = false;
      state.elastic.wrapper = null;
      const requested = element.hasAttribute(elasticAttribute) ||
        children.some(item => item.hasAttribute(elasticAttribute) &&
          item.getAttribute(elasticAttribute) !== "false");
      if (requested && !state.elastic.invalidReported) {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_SCROLLBOX_ELASTIC_WRAPPER,
          { element });
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
      state.elastic.baseMargins = {
        top: computed.marginTop, right: computed.marginRight,
        bottom: computed.marginBottom, left: computed.marginLeft
      };
      elasticMemories.set(wrapper, AelluxJs.persist.element.save(
        wrapper, [], ["transform", "transform-origin",
        "margin-top", "margin-right", "margin-bottom", "margin-left"]
      ));
    }
    state.elasticEnabled = true;
    const value = wrapper.getAttribute(elasticAttribute).trim();
    const tokens = value ? value.split(/\s+/) : [];
    const limits = tokens.map(parseElasticLimit);
    if (tokens.length > 2 || limits.some(limit => !limit)) {
      if (state.elastic.invalidLimit !== value) {
        AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_ELASTIC_LIMIT_INVALID,
          { element, value });
      }
      state.elastic.invalidLimit = value;
      state.elastic.limits = [DEFAULT_ELASTIC_LIMIT, DEFAULT_ELASTIC_LIMIT];
    } else {
      state.elastic.invalidLimit = null;
      state.elastic.limits = tokens.length === 2 ? limits :
        [limits[0] || DEFAULT_ELASTIC_LIMIT, limits[0] || DEFAULT_ELASTIC_LIMIT];
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
    AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_MODE_INVALID,
      { element, value });
    return "native";
  }

  function isDesktop() {
    return !!(root.matchMedia && root.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }

  function updatePointerScrollCursor(state, target, x, y) {
    if (!state.pointerListening || (state.pointerScroll && state.pointerScroll.moved)) return;
    if (!target || target.nodeType !== 1 ||
      target.closest(`[${attribute}]`) !== state.element ||
      target.closest(pointerScrollExceptionSelector) || isTextAtPoint(target, x, y)) {
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
    if (!state.cursor.owned) return;
    cursorMemories.get(state.element)?.restore();
    state.cursor.owned = false;
    syncScrollbarVisibility(state);
  }

  function startPointerScroll(state, event) {
    if (event.detail > 1) return;
    if (activePointerScrollState || state.pointerScroll || state.scrollbar.drag ||
      event.defaultPrevented ||
      event.button !== 0 || !event.isPrimary ||
      event.pointerType === "touch" || (event.buttons & 1) === 0) return;

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

    if (chain.some(member => member.scrollbar.drag)) return;

    const axes = new Map(chain.map(member => {
      const metrics = nativeMetrics(member.element);
      member.metrics = metrics;
      return [member, wheelAxes(member, metrics)];
    }));
    const chains = {
      x: pointerAxisChain(chain, axes, "x"),
      y: pointerAxisChain(chain, axes, "y")
    };
    if (!chains.x.some(member => axes.get(member).x) &&
      !chains.y.some(member => axes.get(member).y)) return;

    const rect = element.getBoundingClientRect();
    if (event.clientX >= rect.left + element.clientWidth ||
      event.clientY >= rect.top + element.clientHeight) return;

    const previousDown = state.lastPointerDown;
    const time = now();
    state.lastPointerDown = { x: event.clientX, y: event.clientY, time };
    if (previousDown && time - previousDown.time <= POINTER_SCROLL_MULTICLICK_MS &&
      Math.abs(event.clientX - previousDown.x) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX &&
      Math.abs(event.clientY - previousDown.y) <= POINTER_SCROLL_MULTICLICK_DISTANCE_PX) return;

    const textOrigin = isTextAtPoint(event.target, event.clientX, event.clientY);
    const selectionAtDown = readSelection();
    const verticalOnly = chains.y.some(member => axes.get(member).y) &&
      !chains.x.some(member => axes.get(member).x);

    if (!textOrigin && event.cancelable) event.preventDefault();

    for (const member of new Set([...chains.x, ...chains.y])) {
      cancelMomentum(member);
      if (member.elastic.owned) {
        resetElastic(member);
        refresh(member);
      }
    }

    if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
    state.mouseReleaseTimeout = null;
    state.mouseReleaseButton = null;
    state.pointerScroll = {
      pointerId: event.pointerId, pointerType: event.pointerType, button: event.button,
      startX: event.clientX, startY: event.clientY,
      lastX: event.clientX, lastY: event.clientY,
      moved: false, started: false, axis: null, chain, chains, axes,

      styles: [],
      momentumState: null, momentumStartX: 0, momentumStartY: 0,
      elasticForce: 0,
      startTime: time, endTime: null,

      selectionAtDown, verticalOnly,
      selectionReadyTime: textOrigin ? time + TEXT_SELECTION_WAIT_MS : 0,
      selectionWaitTimeout: null, pendingMove: null,
      momentumStartTime: time
    };

    activePointerScrollState = state;

    onEvent(root, POINTER_MOVE_TARGET, state.onPointerMove, { passive: false, capture: true });
    onEvent(root, "$touchmove", state.onPointerScrollTouchMove,
      { passive: false, capture: true });
    for (const name of pointerScrollDragEvents) {
      onEvent(root, "$" + name, state.onPointerScrollNativeEvent, true);
    }
    onEvent(root, "$selectstart", state.onPointerScrollNativeEvent, true);
    for (const name of pointerScrollMouseEvents) {
      onEvent(root, "$" + name, state.onMouseEvent, { passive: false, capture: true });
    }
    onEvent(root, POINTER_UP_TARGET, state.onPointerEnd, true);
    onEvent(root, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
    onEvent(root, "$blur", state.onBlur);
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

    if (!pointerScroll.axis)
      pointerScroll.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    const chain = pointerScroll.chains[pointerScroll.axis];
    const threshold = chain.some(member => !member.disposed &&
      pointerAxisMaximum(member, pointerScroll.axis, pointerScroll) > 0 &&
      !dispatchSnapGesture(member, "probe", pointerScroll)) ? 1 : POINTER_SCROLL_THRESHOLD_PX;
    if (!pointerScroll.moved && dx * dx + dy * dy < threshold * threshold) return;
    const verticalTextDrag = pointerScroll.verticalOnly && pointerScroll.axis === "y" &&
      Math.abs(dy) > VERTICAL_TEXT_DRAG_PX;

    if (!pointerScroll.moved && now() < pointerScroll.selectionReadyTime && !verticalTextDrag) {
      pointerScroll.pendingMove = { x: event.clientX, y: event.clientY };
      if (pointerScroll.selectionWaitTimeout === null) {
        pointerScroll.selectionWaitTimeout = root.setTimeout(() => {
          pointerScroll.selectionWaitTimeout = null;
          if (state.pointerScroll !== pointerScroll) return;
          const pendingMove = pointerScroll.pendingMove;
          movePointerScroll(state, {
            pointerId: pointerScroll.pointerId, buttons: 1, cancelable: false,
            clientX: pendingMove.x, clientY: pendingMove.y
          });
        }, Math.max(0, pointerScroll.selectionReadyTime - now()));
      }
      return;
    }

    if (!pointerScroll.moved) {
      const axis = pointerScroll.axis;
      if (!chain.some(member => pointerAxisMaximum(member, axis, pointerScroll) > 0)) {
        endPointerScroll(state);
        return;
      }
      pointerScroll.chain = chain;
      activatePointerScroll(state, pointerScroll, axis);
      if (state.pointerScroll !== pointerScroll) return;
    }

    const axis = pointerScroll.axis;
    let remaining = axis === "x" ? pointerScroll.lastX - event.clientX :
      pointerScroll.lastY - event.clientY;
    pointerScroll.lastX = event.clientX;
    pointerScroll.lastY = event.clientY;

    if (event.cancelable) event.preventDefault();
    if (!remaining) return;

    let outermost = null;
    for (const member of pointerScroll.chain) {
      if (!member.disposed && member.pointerListening &&
        pointerAxisMaximum(member, axis, pointerScroll) > 0) outermost = member;
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
      if (member.disposed || !member.pointerListening ||
        pointerAxisMaximum(member, axis, pointerScroll) <= 0) continue;
      if (Math.abs(remaining) < 0.001) continue;
      const element = member.element;
      const previousX = element.scrollLeft, previousY = element.scrollTop;
      const current = axis === "x" ? previousX : previousY;
      const desired = Math.max(0, Math.min(pointerAxisMaximum(member, axis, pointerScroll),
        current + remaining));
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
      rangeCount: selection.rangeCount, isCollapsed: selection.isCollapsed,
      anchorNode: selection.anchorNode, anchorOffset: selection.anchorOffset,
      focusNode: selection.focusNode, focusOffset: selection.focusOffset
    };
  }

  function selectionHasChanged(initial) {
    const current = readSelection();
    const initialSelected = initial && initial.rangeCount && !initial.isCollapsed;
    const currentSelected = current && current.rangeCount && !current.isCollapsed;
    if (!initialSelected && !currentSelected) return false;
    if (!initial || !current) return initial !== current;
    return current.rangeCount !== initial.rangeCount ||
      current.isCollapsed !== initial.isCollapsed ||
      current.anchorNode !== initial.anchorNode ||
      current.anchorOffset !== initial.anchorOffset ||
      current.focusNode !== initial.focusNode ||
      current.focusOffset !== initial.focusOffset;
  }

  function pointerAxisMaximum(state, axis, pointerScroll = null) {
    const metrics = state.metrics || nativeMetrics(state.element);
    const axes = pointerScroll && pointerScroll.axes.get(state) || wheelAxes(state, metrics);
    return axes[axis] ? (axis === "x" ? metrics.maxX : metrics.maxY) : 0;
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
        element, [], ["scroll-behavior"]
      ));
      pointerScroll.styles.push({
        element, classOwned: !element.classList.contains(pointerScrollingClass)
      });
      element.style.setProperty("scroll-behavior", "auto", "important");
      element.classList.add(pointerScrollingClass);
      dispatchInteraction(member, POINTER, true);
      dispatchSnapGesture(member, "start", pointerScroll);
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
        elements: pointerScroll.styles.map(saved => saved.element)
      }
    });
  }

  function endPointerScroll(state, event) {
    const pointerScroll = state.pointerScroll;
    if (!pointerScroll || (event && event.pointerId !== pointerScroll.pointerId)) return;

    pointerScroll.endTime = now();
    if (event && event.type === POINTER_UP) {
      pointerScroll.lastX = event.clientX;
      pointerScroll.lastY = event.clientY;
    }
    state.pointerScroll = null;
    if (activePointerScrollState === state) activePointerScrollState = null;
    if (pointerScroll.selectionWaitTimeout !== null)
      root.clearTimeout(pointerScroll.selectionWaitTimeout);
    offEvent(root, POINTER_MOVE_TARGET, state.onPointerMove, true);
    offEvent(root, "$touchmove", state.onPointerScrollTouchMove, true);
    for (const name of pointerScrollDragEvents) {
      offEvent(root, "$" + name, state.onPointerScrollNativeEvent, true);
    }
    offEvent(root, "$selectstart", state.onPointerScrollNativeEvent, true);
    offEvent(root, POINTER_UP_TARGET, state.onPointerEnd, true);
    offEvent(root, POINTER_CANCEL_TARGET, state.onPointerEnd, true);
    offEvent(root, "$blur", state.onBlur);

    if (pointerScroll.moved && !state.disposed) {
      state.mouseReleaseButton = pointerScroll.button;
      if (state.mouseReleaseTimeout !== null) root.clearTimeout(state.mouseReleaseTimeout);
      state.mouseReleaseTimeout = root.setTimeout(() => stopPointerScrollMouseEvents(state), 0);
    } else {
      stopPointerScrollMouseEvents(state);
    }

    let snapHandled = false;
    if (event && event.type === POINTER_UP && pointerScroll.axis &&
        !selectionHasChanged(pointerScroll.selectionAtDown)) {
      const snapChain = pointerScroll.moved ? pointerScroll.chain :
        pointerScroll.chains[pointerScroll.axis];
      for (const member of snapChain) {
        if (!member.disposed && !dispatchSnapGesture(member, "end", pointerScroll))
          snapHandled = true;
      }
    }

    for (const saved of pointerScroll.styles) {
      if (saved.classOwned) saved.element.classList.remove(pointerScrollingClass);
      pointerScrollMemories.get(saved.element)?.restore();
      pointerScrollMemories.delete(saved.element);
      const member = scrollboxes.get(saved.element);
      if (member) {
        dispatchInteraction(member, POINTER, false);
        scheduleScrollbarInteractionHide(member);
      }
    }

    if (event && event.type === POINTER_UP && state.pointerListening) {
      updatePointerScrollCursor(state, document.elementFromPoint(event.clientX, event.clientY),
        event.clientX, event.clientY);
    } else restorePointerScrollCursor(state);

    if (pointerScroll.started)
      dispatchPointerScroll(state, pointerScroll, "PointerScrollEnd");

    const hadElastic = pointerScroll.chain.some(member => member.elastic.active);
    const momentumState = pointerScroll.momentumState;
    for (const member of pointerScroll.chain) releaseElastic(member);
    if (!snapHandled && event && event.type === POINTER_UP && pointerScroll.moved && momentumState &&
      momentumState.momentumEnabled && !hadElastic && !momentumState.disposed &&
      now() - pointerScroll.momentumStartTime < MOMENTUM_LIMIT_TIME_MS) {
      startMomentum(momentumState, pointerScroll);
    }
  }

  function cancelPointerScrollMouseEvent(state, event) {
    const active = state.pointerScroll && state.pointerScroll.moved;
    if (!active && !mouseReleaseEvents.has(event.type)) return;
    const button = active ? state.pointerScroll.button : state.mouseReleaseButton;
    if (button === null || !event.cancelable) return;
    if (mouseHoldEvents.has(event.type)) {
      if ((event.buttons & (1 << button)) === 0) return;
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
      offEvent(root, "$" + name, state.onMouseEvent, true);
    }
  }

  function startMomentum(state, pointerScroll) {
    const element = state.element;
    const elapsed = Math.max(1, now() - pointerScroll.momentumStartTime);
    const x = pointerScroll.axis === "x" ? momentumAxis(element.scrollLeft,
      pointerScroll.momentumStartX, elapsed,
      Math.max(0, element.scrollWidth - element.clientWidth)) : element.scrollLeft;
    const y = pointerScroll.axis === "y" ? momentumAxis(element.scrollTop,
      pointerScroll.momentumStartY, elapsed,
      Math.max(0, element.scrollHeight - element.clientHeight)) : element.scrollTop;
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
    setListeners(state.element, state, touchListeners, true);
    state.touchListening = true;
  }

  function removeTouchListeners(state) {
    setListeners(state.element, state, touchListeners, false);
    state.touchListening = false;
    restoreTouchOverflow(state);
    state.elastic.touch = null;
  }

  function restoreTouchOverflow(state) {
    const touch = state.elastic.touch;
    if (!touch) return;
    for (const [element, { value, priority }] of touch.scrollBehaviors) {
      if (value) element.style.setProperty("scroll-behavior", value, priority);
      else element.style.removeProperty("scroll-behavior");
    }
    touch.scrollBehaviors.clear();
  }

  function startTouch(state, event) {
    if (event.target.closest(
      `[${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]`)) return;
    if (event.touches.length !== 1) {
      restoreTouchOverflow(state);
      state.elastic.touch = null;
      releaseElastic(state);
      return;
    }
    if (event.target.closest(`[${attribute}]`) !== state.element) return;
    cancelMomentum(state);
    const touch = event.touches[0];
    restoreTouchOverflow(state);
    if (state.elastic.owned) {
      resetElastic(state);
      refresh(state);
    }
    state.elastic.touch = {
      identifier: touch.identifier, x: touch.clientX, y: touch.clientY,
      lastX: touch.clientX, lastY: touch.clientY, scrollBehaviors: new Map(),
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
    const deltaX = start.lastX - touch.clientX;
    const deltaY = start.lastY - touch.clientY;
    start.lastX = touch.clientX;
    start.lastY = touch.clientY;
    if (!applyElasticFromDesired(state, desiredX, desiredY, false)) return;
    const metrics = state.metrics || nativeMetrics(state.element);
    const style = root.getComputedStyle(state.element);
    const scrollable = value => value === "auto" || value === "scroll";
    const blockedX = !scrollable(style.overflowX) || metrics.maxX <= 1;
    const blockedY = !scrollable(style.overflowY) || metrics.maxY <= 1;
    if (event.cancelable) {
      event.preventDefault();
      if (blockedX && (!style.overscrollBehaviorX || style.overscrollBehaviorX === "auto"))
        scrollTouchOverflow(state, "x", deltaX);
      if (blockedY && (!style.overscrollBehaviorY || style.overscrollBehaviorY === "auto"))
        scrollTouchOverflow(state, "y", deltaY);
    }
    scrollWithinElasticBounds(state,
      blockedX ? state.element.scrollLeft : desiredX,
      blockedY ? state.element.scrollTop : desiredY);
    publish(state);
  }

  function scrollTouchOverflow(state, axis, delta) {
    if (!delta) return;
    const horizontal = axis === "x";
    for (let parent = state.element.parentElement; parent && delta; parent = parent.parentElement) {
      const style = root.getComputedStyle(parent);
      const overflow = horizontal ? style.overflowX : style.overflowY;
      const position = horizontal ? parent.scrollLeft : parent.scrollTop;
      const maximum = horizontal ? parent.scrollWidth - parent.clientWidth :
        parent.scrollHeight - parent.clientHeight;
      if ((overflow === "auto" || overflow === "scroll" ||
        parent === root.document.scrollingElement) && maximum > 0) {
        const next = Math.max(0, Math.min(maximum, position + delta));
        if (!state.elastic.touch.scrollBehaviors.has(parent)) {
          state.elastic.touch.scrollBehaviors.set(parent, {
            value: parent.style.getPropertyValue("scroll-behavior"),
            priority: parent.style.getPropertyPriority("scroll-behavior")
          });
          parent.style.setProperty("scroll-behavior", "auto", "important");
        }
        if (horizontal) parent.scrollLeft = next;
        else parent.scrollTop = next;
        delta -= (horizontal ? parent.scrollLeft : parent.scrollTop) - position;
      }
      const behavior = horizontal ? style.overscrollBehaviorX : style.overscrollBehaviorY;
      if (behavior && behavior !== "auto") break;
    }
  }

  function endTouch(state, event) {
    const touch = state.elastic.touch;
    if (!touch) return;
    for (const item of event.touches) {
      if (item.identifier === touch.identifier) return;
    }
    restoreTouchOverflow(state);
    state.elastic.touch = null;
    releaseElastic(state);
  }

  function elasticAxes(state) {
    const style = root.getComputedStyle(state.element);
    const scrollable = value => value === "auto" || value === "scroll";
    return {
      x: scrollable(style.overflowX) && style.overscrollBehaviorX !== "none",
      y: scrollable(style.overflowY) && style.overscrollBehaviorY !== "none"
    };
  }

  function applyElasticFromDesired(state, desiredX, desiredY, additive,
    axis = null, allowed = elasticAxes(state)) {
    if (!state.elasticEnabled) return false;

    const element = state.element;
    const metrics = state.metrics || nativeMetrics(element);
    const elastic = state.elastic;
    const amounts = [0, 0, 0, 0];

    if (axis !== "x" && allowed.y && metrics.maxY > 1) {
      const limitY = elasticLimit(element.clientHeight, elastic.limits[0]);
      if (desiredY < 0) amounts[0] = elasticResistance(-desiredY,
        additive ? elastic.amounts[0] : 0, limitY);
      else if (desiredY > metrics.maxY) amounts[2] = elasticResistance(desiredY - metrics.maxY,
        additive ? elastic.amounts[2] : 0, limitY);
    }

    if (axis !== "y" && allowed.x && metrics.maxX > 1) {
      const limitX = elasticLimit(element.clientWidth, elastic.limits[1]);
      if (desiredX > metrics.maxX) amounts[1] = elasticResistance(desiredX - metrics.maxX,
        additive ? elastic.amounts[1] : 0, limitX);
      else if (desiredX < 0) amounts[3] = elasticResistance(-desiredX,
        additive ? elastic.amounts[3] : 0, limitX);
    }

    const active = amounts.some(amount => amount > 0);
    if (!active && !elastic.owned) return false;
    const dimensions = elastic.dimensions || measureElasticWrapper(elastic.wrapper);

    elastic.dimensions = dimensions;
    if (elastic.releaseFrame !== null) root.cancelAnimationFrame(elastic.releaseFrame);
    elastic.releaseFrame = null;
    elastic.wrapper.classList.remove(elasticReleaseClass);
    elastic.amounts = amounts;
    elastic.active = active;
    elastic.owned = true;
    if (active) dispatchInteraction(state, "elastic", true);

    setElasticTransform(state, dimensions);
    return active;
  }

  function measureElasticWrapper(wrapper) {
    return {
      offsetWidth: wrapper.offsetWidth, scrollWidth: wrapper.scrollWidth,
      clientLeft: wrapper.clientLeft,
      offsetHeight: wrapper.offsetHeight, scrollHeight: wrapper.scrollHeight,
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
      const originX = elastic.amounts[3] > 0 ? "0%" :
        elastic.amounts[1] > 0 ? `${Math.max(dimensions.offsetWidth,
          dimensions.scrollWidth + dimensions.clientLeft)}px` : baseOrigin[0];
      const originY = elastic.amounts[0] > 0 ? "0%" :
        elastic.amounts[2] > 0 ? `${Math.max(dimensions.offsetHeight,
          dimensions.scrollHeight + dimensions.clientTop)}px` : baseOrigin[1];
      wrapper.style.setProperty("transform-origin", `${originX} ${originY}`,
        elasticMemories.get(wrapper).cssProperties["transform-origin"].priority);
    }

    wrapper.style.setProperty("transform",
      [scale, translate, elastic.baseTransform].filter(Boolean).join(" ") || "none",
      elasticMemories.get(wrapper).cssProperties.transform.priority);

    setElasticCompensation(state, scaleX, scaleY);
  }

  function setElasticCompensation(state, scaleX, scaleY) {
    const elastic = state.elastic;
    const wrapper = elastic.wrapper;
    const memory = elasticMemories.get(wrapper).cssProperties;
    // Offset leading-edge stretch on the opposite margin. Negative top/left
    // margins at the trailing edges would shrink the scrollable range.
    const compensated = {
      top: 0,
      right: elastic.amounts[3] * (2 + scaleX),
      bottom: elastic.amounts[0] * (2 + scaleY),
      left: 0
    };
    for (const side of ["top", "right", "bottom", "left"]) {
      const base = elastic.baseMargins?.[side] || "0px";
      const property = `margin-${side}`;
      if (compensated[side]) {
        wrapper.style.setProperty(property, `calc(${base} - ${compensated[side]}px)`,
          memory[property].priority);
      } else if (memory[property].present) {
        wrapper.style.setProperty(property, memory[property].value, memory[property].priority);
      } else wrapper.style.removeProperty(property);
    }
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
    if (AelluxJs.currentPreference("reduced-motion") === "reduced") {
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
    elastic.amounts = elastic.amounts.map(amount =>
      amount < ELASTIC_RETURN_EPSILON ? 0 : amount * (1 - ELASTIC_RETURN_LERP));
    if (elastic.amounts.every(amount => amount === 0)) {
      resetElastic(state);
      refresh(state);
      return;
    }
    setElasticTransform(state);
    publish(state);
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
      elasticMemories.get(elastic.wrapper)?.restore();
    }
    elastic.amounts = [0, 0, 0, 0];
    elastic.active = false;
    elastic.owned = false;

    if (wasOwned && !state.disposed) {
      dispatchInteraction(state, "elastic", false);
    }
    if (wasOwned && !state.disposed) publish(state);
  }

  function observe(state) {
    state.onResize = () => scheduleResize(state);
    onEvent(root, "$resize", state.onResize, { passive: true });
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
      state.mutationObserver = new root.MutationObserver(records => {
        if (state.resizeObserver) {
          state.resizeObserver.disconnect();
          state.resizeObserver.observe(state.element);
          for (const child of state.element.children) state.resizeObserver.observe(child);
        }
        if (records.some(record => record.type === "attributes" ||
          record.target === state.element ||
          record.target === state.elastic.wrapper)) configure(state);
        else refresh(state);
      });
      state.mutationObserver.observe(state.element,
        {
          childList: true, subtree: true, characterData: true,
          attributes: true,
          attributeFilter: [elasticAttribute, scrollbarAttribute]
        });
    }
  }

  function scheduleResize(state) {
    if (state.disposed) return;
    AelluxJs.waitLayout.sequence(state.resizeLayoutId, {
      update: () => refresh(state),
      maxFPS: AelluxJs.layoutMaxFPS(state.element),
      abort: () => state.disposed
    });
  }

  function now() {
    return root.performance && typeof root.performance.now === "function"
      ? root.performance.now() : Date.now();
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
    const available = value => value === "auto" || value === "scroll";
    const stopsChain = value => value === "contain" || value === "none";
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
        scrollTop, scrollLeft,
        y: progress(scrollTop, metrics.maxY),
        x: progress(scrollLeft, metrics.maxX),
        edges: state.elastic.owned ? null : [
          scrollTop < SCROLL_EDGE_MARGIN_PX,
          scrollTop >= metrics.maxY - SCROLL_EDGE_MARGIN_PX,
          scrollLeft < SCROLL_EDGE_MARGIN_PX,
          scrollLeft >= metrics.maxX - SCROLL_EDGE_MARGIN_PX
        ],
        scrollbars: bars ? readScrollbars(state, metrics, axes) : []
      };
    }).then(values => {
      if (!values || state.disposed) {
        state.publishDirty = false;
        return;
      }

      return AelluxJs.waitLayout.update(() => {
        if (state.disposed || state.layoutRevision !== values.revision) return;
        if (state.element.scrollTop !== values.scrollTop ||
          state.element.scrollLeft !== values.scrollLeft) {
          state.publishDirty = true;
          return;
        }

        state.element.style.setProperty(properties[0], values.y);
        state.element.style.setProperty(properties[1], values.x);
        if (values.edges && !state.elastic.owned) {
          scrollEdgeClasses.forEach((name, index) =>
            state.element.classList.toggle(name, values.edges[index]));
        }
        updateScrollbars(state, values.scrollbars);
      });
    }).catch(cause => {
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
        { cause, extension: extensionName, element: state.element, method: "update" });
    }).finally(() => {
      state.publishPending = false;
      if (state.publishDirty && !state.disposed) publish(state);
    });
  }

  function progress(position, distance) {
    return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
  }

  function scrollAxis(element, axis, delta, maximum) {
    const property = axis === "x" ? "scrollLeft" : "scrollTop";
    const current = element[property];
    const desired = current + delta;
    const next = Math.max(0, Math.min(maximum, desired));
    if (next !== current) {
      element.scrollTo(axis === "x" ? { left: next, behavior: "instant" } :
        { top: next, behavior: "instant" });
    }
    return desired - next;
  }

  function inheritedWheelAxes(element, metrics) {
    const style = root.getComputedStyle(element);
    const available = value => value === "auto" || value === "scroll";
    return {
      x: metrics.maxX > 1 && available(style.overflowX),
      y: metrics.maxY > 1 && available(style.overflowY)
    };
  }

  function nextWheelTarget(element) {
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const state = scrollboxes.get(parent);
      const metrics = nativeMetrics(parent);
      const axes = state ? wheelAxes(state, metrics) : inheritedWheelAxes(parent, metrics);
      if (axes.x || axes.y) return { element: parent, state, metrics, axes };
    }
    return null;
  }

  function receivesVerticalWheelAsHorizontal(target) {
    return !!target.state && target.state.desktop && target.state.wheelEnabled &&
      target.axes.x && !target.axes.y;
  }

  function handoffWheelEvent(event, target, deltaY) {
    const handed = {
      ctrlKey: event.ctrlKey,
      cancelable: event.cancelable,
      deltaX: 0,
      deltaY,
      target: target.element,
      get defaultPrevented() { return event.defaultPrevented; },
      preventDefault() { event.preventDefault(); }
    };
    return dispatchWheel(target.state, handed);
  }

  // Native wheel chaining cannot turn a vertical delta into a horizontal one.
  // At a vertical edge, hand only its unconsumed portion to horizontal Aellux
  // parents.  Once such a parent reaches its own edge, `remaining` is still a
  // vertical delta, so a following parent only converts it when it explicitly
  // opts into the same wheel-horizontal behavior.
  function handoffVerticalWheel(state, event, metrics, axes, deltaY, factor) {
    if (!state.desktop || state.elasticEnabled || !axes.y || !deltaY) return false;
    const current = state.element.scrollTop;
    const desired = current + deltaY;
    if (desired >= 0 && desired <= metrics.maxY) return false;

    let target = nextWheelTarget(state.element);
    // Do not take over the native chain until its next scrollable parent is a
    // horizontal Scrollbox that permits conversion.  This preserves ordinary
    // vertical chaining and horizontally-disabled boxes.
    while (target && !target.axes.y && !receivesVerticalWheelAsHorizontal(target))
      target = nextWheelTarget(target.element);
    if (!target || target.axes.y) return false;

    let remaining = scrollAxis(state.element, "y", deltaY, metrics.maxY);
    if (remaining !== deltaY) publish(state);

    while (target && remaining) {
      if (receivesVerticalWheelAsHorizontal(target)) {
        // Give Snap first refusal, as it normally receives this same converted
        // wheel on a direct horizontal target.
        if (!handoffWheelEvent(event, target, remaining / factor)) return true;
        remaining = scrollAxis(target.element, "x", remaining, target.metrics.maxX);
        publish(target.state);
      } else if (target.axes.y) {
        remaining = scrollAxis(target.element, "y", remaining, target.metrics.maxY);
        if (target.state) publish(target.state);
      }
      if (!remaining) {
        event.preventDefault();
        return true;
      }
      target = nextWheelTarget(target.element);
    }
    event.preventDefault();
    return true;
  }

  function handleWheel(state, event) {
    if (event.ctrlKey || !event.cancelable) return;

    if (state.desktop && state.mode === POINTER &&
      state.element.classList.contains(pointerScrollingClass)) {
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      return;
    }

    cancelMomentum(state);
    if (event.defaultPrevented) return;
    if (event.target.closest(`[${attribute}]`) !== state.element) return;
    if (!dispatchWheel(state, event)) return;
    const metrics = nativeMetrics(state.element);
    if (!metrics) return;
    const axes = wheelAxes(state, metrics);
    const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
    const converted = state.desktop && state.wheelEnabled && axes.x && !axes.y &&
      Math.abs(event.deltaX) <= Math.abs(event.deltaY);
    const deltaX = (converted ? event.deltaY : event.deltaX) * factor;
    const deltaY = (converted ? 0 : event.deltaY) * factor;

    if (!converted && handoffVerticalWheel(state, event, metrics, axes, deltaY, factor))
      return;

    if (converted && deltaX) {
      const current = state.element.scrollLeft;
      const desiredX = current + deltaX;
      const next = Math.max(0, Math.min(metrics.maxX, desiredX));
      const overflow = desiredX < 0 || desiredX > metrics.maxX;
      let stretched = false;

      if (overflow && state.elasticEnabled) {
        stretched = applyElasticFromDesired(state, desiredX, state.element.scrollTop,
          true, "x");
        if (stretched) {
          scrollWithinElasticBounds(state, desiredX, state.element.scrollTop);
          if (state.elastic.wheelTimeout !== null)
            root.clearTimeout(state.elastic.wheelTimeout);
          state.elastic.wheelTimeout = root.setTimeout(() => releaseElastic(state),
            ELASTIC_WHEEL_IDLE_MS);
        }
      } else if (state.elastic.owned) {
        resetElastic(state);
        refresh(state);
      }

      if (!stretched && next !== current)
        state.element.scrollTo({ left: next, behavior: "instant" });
      if (stretched || next !== current) publish(state);
      if (!overflow && next !== current) event.preventDefault();
      return;
    }

    if (state.elasticEnabled && (axes.x || axes.y)) {
      const desiredX = state.element.scrollLeft + (axes.x ? deltaX : 0);
      const desiredY = state.element.scrollTop + (axes.y ? deltaY : 0);
      const axis = axes.x && axes.y ? null : axes.x ? "x" : "y";

      if (applyElasticFromDesired(state, desiredX, desiredY, true, axis)) {
        const parent = nextWheelTarget(state.element);
        const overscroll = root.getComputedStyle(state.element).overscrollBehaviorY;
        const verticalChain = axes.y && deltaY && parent?.axes.y &&
          (!overscroll || overscroll === "auto") &&
          (desiredY < 0 || desiredY > metrics.maxY);
        event.preventDefault();
        if (verticalChain) {
          let remaining = desiredY < 0 ? desiredY : desiredY - metrics.maxY;
          for (let target = parent; target && remaining; target = nextWheelTarget(target.element)) {
            if (target.axes.y) {
              remaining = scrollAxis(target.element, "y", remaining, target.metrics.maxY);
              if (target.state) publish(target.state);
            }
            const parentOverscroll = root.getComputedStyle(target.element).overscrollBehaviorY;
            if (parentOverscroll && parentOverscroll !== "auto") break;
          }
        }
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
