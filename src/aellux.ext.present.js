/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createPresentPlayback } from "./internal/create-present-playback.js";
import { createPresentGestures } from "./internal/create-present-gestures.js";
import { createPresentEffects } from "./internal/create-present-effects.js";

/**
 * Present Extension
 *
 * Purpose: controls the presented or hidden state of mounted regions and
 * coordinates triggers, dismiss controls, outside interaction and CSS motion.
 * It also owns temporary effects that execute only between presentation transitions.
 *
 * Capability profile: interaction and input, structure and state, and motion
 * and timing.
 *
 * Inputs and activation: mounts `[data-ae-present]` regions. Its whitespace-
 * separated opacity, transform, height and width values select the animated
 * properties. An empty value disables presentation transitions while allowing effects;
 * `all` expands to all four
 * tokens during mount. A direct `[data-ae-present-motion]` child enables grid
 * size transitions; without it, size transitions measure the container.
 * Trigger and dismiss relationships use extension data attributes and may
 * target a region by ID, with or without a leading #. Input tap notifications
 * share click activation; a matching native click takes priority over a queued tap.
 *
 * Outputs and owned state: owns presentation and will-change classes plus its
 * changes to `hidden`, `aria-expanded` and `aria-controls`. It exposes
 * controller methods for presenting, dismissing, reversing, toggling and temporary effects, and dispatches
 * lifecycle events.
 * When hiding a region containing the active element, it dispatches
 * `DismissFocusLost` or `UnpopFocusLost` after that element loses focus.
 *
 * Lifecycle: cancels timers, removes listeners and restores managed initial
 * attributes on unmount.
 *
 * Accessibility: trigger and dismiss markup must be natively keyboard operable
 * and named. Consuming styles must respect reduced motion. The implementation
 * releases focus from content it hides. The focus extension can restore a
 * previous target; other focus behavior belongs to the consuming application.
 */

(function (root) {
  "use strict";

  const aelluxJs = root.aelluxJs;
  const extensionName = "present";
  if (!aelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  const attr = {
    present: aelluxJs.attr(extensionName),
    group: aelluxJs.attr("present-group"),
    active: aelluxJs.attr("present-active"),
    when: aelluxJs.attr("present-when"),
    triggerOn: aelluxJs.attr("present-trigger-on"),
    autoDismiss: aelluxJs.attr("auto-dismiss"),
    presentMotion: aelluxJs.attr("present-motion"),
    dismissOnClick: aelluxJs.attr("dismiss-on-click"),
    unpopOnClick: aelluxJs.attr("unpop-on-click"),
    trigger: aelluxJs.attr("present-trigger"), //toggle,pop,dismiss,unpop,effect
    target: aelluxJs.attr("present-target"), //target ID
    effect: aelluxJs.attr("present-effect"),
  };
  const className = {
    pop: aelluxJs.className("pop"),
    popping: aelluxJs.className("popping"),
    dismissing: aelluxJs.className("dismissing"),
    unpopping: aelluxJs.className("unpopping"),
    unpop: aelluxJs.className("unpop"),
    dismissed: aelluxJs.className("dismissed"),
    willChange: aelluxJs.className("will-change"),
    grid: aelluxJs.className("present-grid")
  };
  const presentSelector = `[${attr.present}]`;
  const groupSelector = `[${attr.group}]`;

  aelluxJs.extAttach(extensionName, {
    init, destroy,
    pop, dismiss, unpop, toggle, trigger, show, selected, popNext, effect, cancelEffect
  });

  const
    POP = "Pop",
    DISMISS = "Dismiss",
    UNPOP = "Unpop",
    BEFORE = "Before",
    MILLISECOND = "ms",
    SECOND = "s",
    DEFAULT_PRESENT = "opacity transform height width",
    OPACITY_SYNTAX = "<number> | <percentage>",
    TRANSFORM_SYNTAX = "<transform-list> | none";

  const TRANSITION_PREPARE_TIME = 100;
  const TAP_CLICK_WAIT_TIME = 32;
  const presentElements = new Map();
  const effects = createPresentEffects(root, aelluxJs, presentElements);
  const openPresentElements = new Set();
  let fallbackMotionId = 5000000;
  const triggerElementsSet = new Set();
  const triggerTargets = new Map();
  const triggersByTargetId = new Map();
  const indexedTriggerValues = new Map();
  const elementMemories = new WeakMap();
  const containerAriaHandlers = new WeakMap();
  const triggerAriaHandlers = new WeakMap();
  const measuredMemories = new WeakMap();
  const groups = new Map();
  const hoverTimers = new Map();
  const hoveredTriggers = new Set();
  const pendingTaps = new Set();
  let groupObserver = null;
  let groupsQueued = false;
  let interpolatedProgress = false;
  let interpolatedUnpop = false;
  const playback = createPresentPlayback(root, aelluxJs);
  const gestures = createPresentGestures(root, aelluxJs, {
    state: element => presentElements.get(element)?.state,
    busy: element => !!presentElements.get(element)?.transition,
    order: element => presentElements.get(element)?.presentationOrder || 0,
    begin(element, direction, gesture) {
      const controller = presentElements.get(element);
      controller.gestureRequest = gesture;
      presentTransition(element, direction === POP, false, false, undefined, direction).finally(() => {
        if (controller.gestureRequest === gesture) controller.gestureRequest = null;
        if (controller.gesture !== gesture) gesture.abort();
      });
      if (!controller.transition) gesture.abort();
    }
  });
  let autoObserver = null;
  let presentationSequence = 0;
  const cssProperties = [
    ["pop-progress", "<number>", "0"],
    ["dismiss-progress", "<number>", "1"],
    ["present-pop-phase", "<number>", "0"],
    ["present-dismiss-phase", "<number>", "1"],
    ["from-opacity", OPACITY_SYNTAX, "0"],
    ["pop-opacity", OPACITY_SYNTAX, "1"],
    ["dismiss-opacity", OPACITY_SYNTAX, "0"],
    ["from-transform", TRANSFORM_SYNTAX, "scale(0.5)"],
    ["pop-transform", TRANSFORM_SYNTAX, "scale(1)"],
    ["dismiss-transform", TRANSFORM_SYNTAX, "scale(1.2)"],
    ["from-height", "*", "0fr"], ["pop-height", "*", "1fr"],
    ["dismiss-height", "*", "0fr"], ["from-width", "*", "0fr"],
    ["pop-width", "*", "1fr"], ["dismiss-width", "*", "0fr"],
    ["pop-ease", "*", "ease-out"], ["dismiss-ease", "*", "ease-in"],
    ["pop-duration", "<time>", "250ms"], ["dismiss-duration", "<time>", "250ms"]
  ];

  function init(options) {
    const communication = { owner: extensionName };
    for (const [name, method] of Object.entries({ pop, unpop, dismiss }))
      aelluxJs.comm.handle("present." + name, ({ element }) => method(element), communication);
    aelluxJs.comm.handle("present.toggle", ({ element, goto }) => toggle(element, goto), communication);
    aelluxJs.comm.handle("present.effect", ({ element, effect: name, effectTarget }) => effect(element, name, effectTarget), communication);
    aelluxJs.comm.handle("present.show", ({ group, member }) => show(group, member), communication);
    aelluxJs.comm.handle("present.selection", ({ group }) => selected(group), communication);
    aelluxJs.comm.handle("present.pop-next", request => popNext(request.group, member => {
      if (request.preparation) {
        const result = aelluxJs.comm.request(request.preparation.contract, { ...request.preparation.payload, element: member });
        if (!result.handled || result.value === false) throw new Error("Present preparation is unavailable.");
      }
    }), communication);
    playback.init();
    const descriptors = cssProperties.map(([name, syntax, initialValue]) =>
      ({ name: `--ae-${name}`, syntax, initialValue }));
    const progressRegistered = aelluxJs.registerCssProperty(...descriptors.slice(0, 4));
    interpolatedProgress = !!(progressRegistered && root.CSS.supports &&
      root.CSS.supports("opacity", "clamp(0, 0.5, 1)"));
    interpolatedUnpop = !!aelluxJs.registerCssProperty({ name: "--ae-unpop-progress", syntax: "<number>", initialValue: "1" });
    aelluxJs.registerCssProperty(...descriptors.slice(4));
    aelluxJs.mountManager.add({
      extensionName, selector: presentSelector,
      priority: 0,
      mount: mountPresentContainer, unmount: unmountPresentContainer,
      update: element => autoDismissSchedule(element, presentElements.get(element)),
      controllers: ["pop", "dismiss", "unpop", "trigger", "toggle", "effect", "cancelEffect"]
    });

    aelluxJs.mountManager.add({
      extensionName,
      priority: 0,
      selector: `[${attr.trigger}]`,
      mount: mountTriggerElement, unmount: unmountTriggerElement,
      update: refreshTriggerTargets
    });

    aelluxJs.mountManager.add({
      extensionName, selector: groupSelector, priority: 1,
      mount: mountGroup, unmount: unmountGroup, controllers: ["show", "selected", "popNext"]
    });
    autoObserver = new root.MutationObserver(records => {
      for (const record of records) {
        if (record.target === document.documentElement && record.attributeName === aelluxJs.attr("reduced-motion")) effects.preferences();
        const controller = presentElements.get(record.target);
        if (controller) {
          if (record.attributeName !== attr.autoDismiss) gestures.update(record.target);
          autoDismissSchedule(record.target, controller);
        }
      }
      if (records.some(record => record.type === "childList" || record.attributeName === "id")) {
        for (const element of presentElements.keys()) if (element.hasAttribute(aelluxJs.attr("present-gesture-source"))) gestures.update(element);
      }
    });
    autoObserver.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: [attr.autoDismiss, "id", aelluxJs.attr("reduced-motion"),
      ...["", "-source", "-unpop", "-dismiss"].map(suffix => aelluxJs.attr(`present-gesture${suffix}`))] });
    document.addEventListener("pointerover", onHover);
    document.addEventListener("pointerout", onHover);
    aelluxJs.on("$click", OnClick);
    aelluxJs.on("tap", onTap);
    aelluxJs.onEvent(root, "$resize", refreshExpandedStates);
  }

  function destroy() {
    aelluxJs.comm.removeOwner(extensionName);
    effects.destroy();
    gestures.destroy();
    autoObserver?.disconnect();
    autoObserver = null;
    aelluxJs.mountManager.remove({ extensionName });
    aelluxJs.off("$click", OnClick);
    aelluxJs.off("tap", onTap);
    for (const pending of pendingTaps) cancelPendingTap(pending);
    aelluxJs.offEvent(root, "$resize", refreshExpandedStates);
    document.removeEventListener("pointerover", onHover);
    document.removeEventListener("pointerout", onHover);
    for (const group of groups.keys()) unmountGroup(group);
    for (const target of hoverTimers.keys()) cancelHoverClose(target);
    hoveredTriggers.clear();

    for (const triggerElement of triggerElementsSet) {
      unmountTriggerElement(triggerElement);
    }
    for (const element of presentElements.keys()) {
      unmountPresentContainer(element);
    }
    openPresentElements.clear();
  }

  function mountPresentContainer(element) {
    if (presentElements.has(element)) return;
    elementMemories.set(element, aelluxJs.persist.element.save(
      element,
      [attr.present, attr.presentMotion, "hidden"],
      ["--ae-pop-progress", "--ae-dismiss-progress", "--ae-unpop-progress",
        "--ae-present-pop-phase", "--ae-present-dismiss-phase"]
    ));
    containerAriaHandlers.set(element, aelluxJs.aria.register(element));
    const initialState = element.classList.contains(className.dismissed) ? DISMISS
      : element.classList.contains(className.unpop) || element.hidden ? UNPOP : POP;
    const legacyHidden = element.hidden || ![className.pop, className.unpop, className.dismissed].some(name => element.classList.contains(name));
    if ((element.getAttribute(attr.present) || "").trim().toLowerCase() === "all") {
      element.setAttribute(attr.present, DEFAULT_PRESENT);
    }
    if (element.hasAttribute(attr.presentMotion)) {
      element.removeAttribute(attr.presentMotion);
    }
    const presentMotion = element.querySelector(`:scope>[${attr.presentMotion}]`);
    const tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
    const measuredHeight = !presentMotion && tokens.includes("height");
    const measuredWidth = !presentMotion && tokens.includes("width");
    if (presentMotion) element.classList.add(className.grid);
    else if (measuredHeight || measuredWidth) {
      aelluxJs.diagnostics.info(
        aelluxJs.diagnostics.INFO_PRESENT_MEASURED_LAYOUT,
        { extension: extensionName, element }
      );
    }
    const presentController = {
      state: initialState,
      legacyHidden,
      initialClasses: [className.pop, className.unpop, className.dismissed].filter(name => element.classList.contains(name)),
      gesture: null,
      gestureRequest: null,
      presentMotion,
      measuredHeight,
      measuredWidth,
      motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
      motionId: aelluxJs.motion ? aelluxJs.motion.id() : fallbackMotionId++,
      transition: null,
      handoff: null,
      opening: null,
      reverse: null,
      operationRevision: 0,
      presentationOrder: element.hidden ? 0 : ++presentationSequence,
      autoDismissTimeout: null,
      autoCountdown: null,
      direction: initialState,
      classList: element.classList,
      triggers: new Set(),
      triggerExpanded: initialState === POP,
      setAriaExpanded: function (value) {
        this.expanded = value === "true";
        containerAriaHandlers.get(element).set({ expanded: this.expanded });
      },
      setTriggerExpanded: function (value) {
        this.triggerExpanded = value;
        this.triggers.forEach(updateTriggerAriaExpanded);
      },
      stop: function (options = {}) {
        effects.cancelWithin(element);
        this.gesture?.abort();
        this.gesture = null;
        const replacement = options.replacement === true;
        const transitionStart = options.transitionStart === true;
        const transition = this.transition;
        if (transition) {
          transition.cancelled = true;
          transition.replacement = replacement;
          if (aelluxJs.motion) aelluxJs.motion.cancel(this.motionId);
          if (transition.timeout !== null) {
            clearTimeout(transition.timeout);
            transition.timeout = null;
          }
          if (!transitionStart && transition.className) {
            this.classList.remove(transition.className);
          }
          this.transition = null;
          transition.interrupt(
            aelluxJs.diagnostics.create(
              aelluxJs.diagnostics.WARN_INTERRUPTION,
              { extensionName, replacement }
            )
          );
        }
        cancelAutoDismiss(this);
        this.reverse?.cleanup();
        this.reverse = null;
        this.gestureDisplay?.restore();
        this.gestureDisplay = null;
        restoreHandoff(this);
        if (transitionStart) {
          this.classList.remove(className.dismissing, className.unpopping);
        } else {
          this.classList.remove(
            className.pop,
            className.popping,
            className.dismissing,
            className.unpopping,
            className.willChange
          );
        }
        if (!replacement) restoreMeasuredStyles(element, this);
      }
    };
    establishState(element, presentController, initialState);
    if (initialState === POP) {
      openPresentElements.add(element);
    }
    presentElements.set(element, presentController);
    for (const triggerElement of element.querySelectorAll(
      `[${attr.trigger}]`
    )) {
      if (triggerTargets.get(triggerElement) === element) {
        presentController.triggers.add(triggerElement);
        updateTriggerAriaExpanded(triggerElement);
      }
    }
    const idTriggers = triggersByTargetId.get(element.id);
    if (idTriggers) {
      for (const triggerElement of idTriggers) {
        refreshTriggerTargets(triggerElement);
      }
    }
    setProgress(element, initialState === POP);
    syncAriaExpanded(element, presentController);
    queueGroups();
    autoDismissSchedule(element, presentController);
    gestures.update(element);
  }

  function unmountPresentContainer(element) {
    if (!presentElements.has(element)) return;
    cancelElementTaps(element);
    const controller = presentElements.get(element);
    gestures.remove(element);
    cancelHoverClose(element);
    for (const button of controller.triggers) hoveredTriggers.delete(button);
    controller.stop();
    aelluxJs.waitLayout?.cancel(controller.motionId);
    element.classList.remove(className.grid);
    element.classList.remove(className.pop, className.unpop, className.dismissed);
    element.classList.add(...controller.initialClasses);
    presentElements.delete(element);
    openPresentElements.delete(element);
    containerAriaHandlers.get(element)?.release();
    containerAriaHandlers.delete(element);
    elementMemories.get(element)?.restore();
    elementMemories.delete(element);
    controller.triggers.forEach(updateTriggerAriaExpanded);
    queueGroups();
  }

  function mountTriggerElement(triggerElement) {
    if (triggerElementsSet.has(triggerElement) || !triggerElement.hasAttribute(attr.trigger)) return;
    triggerAriaHandlers.set(triggerElement, aelluxJs.aria.register(triggerElement));
    triggerElementsSet.add(triggerElement);
    refreshTriggerTargets(triggerElement);
  }

  function unmountTriggerElement(triggerElement) {
    if (!triggerElementsSet.has(triggerElement)) return;
    cancelElementTaps(triggerElement);
    hoveredTriggers.delete(triggerElement);
    const target = triggerTargets.get(triggerElement);
    if (target) {
      cancelHoverClose(target);
      presentElements.get(target)?.triggers.delete(triggerElement);
      triggerTargets.delete(triggerElement);
    }
    unindexTriggerTarget(triggerElement);
    triggerElementsSet.delete(triggerElement);
    triggerAriaHandlers.get(triggerElement)?.release();
    triggerAriaHandlers.delete(triggerElement);
  }

  function targetIdFor(value) {
    if (!value) return null;
    const id = value.charAt(0) === "#" ? value.slice(1) : value;
    return id && !/[\s#]/.test(id) ? id : null;
  }

  function targetById(value) {
    const id = targetIdFor(value);
    if (!id) {
      aelluxJs.diagnostics.error(aelluxJs.diagnostics.ERROR_EXTENSION_SELECTOR, {
        cause: new SyntaxError(),
        extension: extensionName,
        selector: value,
        reason: "Present targets accept one element ID, not a CSS selector list.",
        suggestion: "Use one existing Present ID, optionally prefixed with #."
      });
      return null;
    }
    return document.getElementById(id);
  }

  function unindexTriggerTarget(triggerElement) {
    const previous = indexedTriggerValues.get(triggerElement);
    const id = targetIdFor(previous);
    if (id) {
      const triggers = triggersByTargetId.get(id);
      triggers.delete(triggerElement);
      if (!triggers.size) triggersByTargetId.delete(id);
    }
    indexedTriggerValues.delete(triggerElement);
  }

  function indexTriggerTarget(triggerElement, value) {
    if (indexedTriggerValues.get(triggerElement) === value) return;
    unindexTriggerTarget(triggerElement);
    indexedTriggerValues.set(triggerElement, value);
    const id = targetIdFor(value);
    if (id) {
      let triggers = triggersByTargetId.get(id);
      if (!triggers) {
        triggers = new Set();
        triggersByTargetId.set(id, triggers);
      }
      triggers.add(triggerElement);
    }
  }

  function refreshTriggerTargets(triggerElement) {
    if (!triggerElement.hasAttribute(attr.trigger)) {
      unmountTriggerElement(triggerElement);
      return;
    }
    if (!triggerElementsSet.has(triggerElement)) {
      mountTriggerElement(triggerElement);
      return;
    }
    const previousTarget = triggerTargets.get(triggerElement);
    const targetSelector = triggerElement.getAttribute(attr.target);
    indexTriggerTarget(triggerElement, targetSelector);
    const container = triggerElement.closest(presentSelector);

    if (previousTarget) {
      presentElements.get(previousTarget)?.triggers.delete(triggerElement);
    }

    let target = null;
    if (targetSelector) {
      target = targetById(targetSelector);
    } else if (container) {
      target = container;
    }

    if (previousTarget !== target) hoveredTriggers.delete(triggerElement);

    if (!target) {
      triggerTargets.delete(triggerElement);
      triggerAriaHandlers.get(triggerElement)?.unset("expanded");
      triggerAriaHandlers.get(triggerElement)?.unset("controls");
      return;
    }
    triggerTargets.set(triggerElement, target);
    presentElements.get(target)?.triggers.add(triggerElement);
    const targetIds = new Set(target.id ? [target.id] : []);
    const initial = triggerAriaHandlers.get(triggerElement)?.initial("controls");
    if (initial) { initial.trim().split(/\s+/).forEach(x => targetIds.add(x)); }
    updateTriggerAriaExpanded(triggerElement);
    if (targetIds.size) triggerAriaHandlers.get(triggerElement).set({ controls: [...targetIds] });
    else triggerAriaHandlers.get(triggerElement).unset("controls");
  }

  function updateTriggerAriaExpanded(triggerElement) {
    const target = triggerTargets.get(triggerElement);
    if (!target) return;
    const expanded = presentElements.get(target)?.triggerExpanded === true;
    triggerAriaHandlers.get(triggerElement)?.set({ expanded });
  }

  function pop(element) { return presentTransition(element, true, true); }
  function dismiss(element) { return presentTransition(element, false); }
  function unpop(element) { return presentTransition(element, false, false, false, undefined, UNPOP); }
  function toggle(element, goto) { return presentTransition(element, goto, false, false, undefined, UNPOP); }
  function effect(element, name, effectTarget) { return effects.effect(element, name, effectTarget); }
  function cancelEffect(element) { effects.cancelWithin(element); }
  function trigger(element, trigger, name) {
    trigger = typeof trigger === "string" ?
      (trigger || "toggle").toLowerCase() :
      "toggle";
    if (trigger === "effect") return effect(element, name);
    if (!["pop", "dismiss", "unpop", "toggle"].includes(trigger)) aelluxJs.diagnostics.warn(
      aelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: extensionName, element, attribute: attr.trigger, value: trigger,
        reason: "Unknown Present action; using toggle.",
        suggestion: "Use pop, dismiss, unpop, or toggle."
      });
    const method = trigger === "pop" ? pop : trigger === "dismiss" ? dismiss : trigger === "unpop" ? unpop : toggle;
    return method(element);
  }

  function restoreMeasuredStyles(element, controller) {
    const memory = measuredMemories.get(element);
    if (!memory) return;
    memory.restore();
    measuredMemories.delete(element);
  }

  function restoreHandoff(controller) {
    controller.handoff?.memory.restore();
    controller.handoff = null;
  }

  function captureHandoff(element, controller) {
    if ((controller.measuredHeight || controller.measuredWidth) && !measuredMemories.has(element)) {
      measuredMemories.set(element, aelluxJs.persist.element.save(element, [], ["max-height", "max-width"]));
    }
    const tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
    const properties = [];
    if (tokens.includes("opacity")) properties.push("opacity");
    if (tokens.includes("transform") && !element.hasAttribute(aelluxJs.attr("anchor"))) properties.push("transform");
    if (tokens.includes("height")) properties.push(...(controller.presentMotion ? ["grid-template-rows", "height"] : ["max-height"]));
    if (tokens.includes("width")) properties.push(...(controller.presentMotion ? ["grid-template-columns", "width"] : ["max-width"]));
    properties.push("--ae-present-pop-phase", "--ae-present-dismiss-phase",
      "--ae-pop-progress", "--ae-dismiss-progress", "--ae-unpop-progress");
    const computed = root.getComputedStyle(element);
    // Copy strings before touching CSS: computed style is a live declaration.
    const values = properties.map(property => {
      let value = computed.getPropertyValue(property).trim();
      // A stable measured panel may have max-size:none (or an author cap
      // larger than its box). Closing starts at its actual untransformed size.
      if (property === "max-height" || property === "max-width") {
        const dimension = property.slice(4);
        value = `${Math.max(0, parseFloat(computed[dimension]) || 0)}px`;
      }
      return [property, value];
    });
    if (controller.reverse) {
      // Snapshot the rendered reverse frame above, but save the author's
      // declarations below rather than the replay's temporary endpoints.
      controller.reverse.cleanup();
      controller.reverse = null;
      restoreHandoff(controller);
    }
    const memory = aelluxJs.persist.element.save(element, [], [...properties, "transition-property"]);
    const transition = aelluxJs.persist.element.save(element, [], ["transition-property"]);
    const freeze = () => {
      element.style.setProperty("transition-property", "none", "important");
      // Progress channels are already owned inline. Keep their priority:
      // WebKit cannot downgrade an important custom property via setProperty.
      for (const [property, value] of values) element.style.setProperty(property, value, property.startsWith("--") ? "" : "important");
      element.getBoundingClientRect();
    };
    freeze();
    return { memory, transition, values, freeze };
  }

  async function prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation) {
    if (!controller.measuredHeight && !controller.measuredWidth) return null;
    if (!measuredMemories.has(element)) {
      measuredMemories.set(element, aelluxJs.persist.element.save(
        element, [], ["max-height", "max-width"]
      ));
    }
    if (gotoVisible || !previousSize) measuredMemories.get(element).restore();
    let size = previousSize;
    if (gotoVisible || !size) {
      const states = [className.unpop, className.dismissed].filter(name => element.classList.contains(name));
      if (gotoVisible) element.classList.remove(...states);
      const computed = root.getComputedStyle(element);
      const height = parseFloat(computed.height);
      const width = parseFloat(computed.width);
      size = {
        height: Number.isFinite(height) ? height : element.scrollHeight,
        width: Number.isFinite(width) ? width : element.scrollWidth
      };
      if (gotoVisible) element.classList.add(...states);
    }
    const start = previousSize || (gotoVisible
      ? { height: 0, width: 0 } : size);
    if (controller.measuredHeight) {
      element.style.setProperty("max-height", `${Math.max(0, start.height)}px`, "important");
    }
    if (controller.measuredWidth) {
      element.style.setProperty("max-width", `${Math.max(0, start.width)}px`, "important");
    }
    if (!waitForPreparation)
      await aelluxJs.waitLayout.read(controller.motionId,
        () => element.getBoundingClientRect());
    return size;
  }

  async function presentTransition(element, gotoVisible, forceRepop = false, groupOperation = false, presentationOrder, closingDirection = DISMISS) {
    const controller = presentElements.get(element);
    if (!controller) return;
    const gesture = controller.gestureRequest;
    if (controller.direction === null)
      controller.direction = element.hidden ? DISMISS : POP;
    if (typeof gotoVisible === "undefined" || gotoVisible === null)
      gotoVisible = (controller.direction === POP) ? false : true;
    const reversing = closingDirection === UNPOP && gotoVisible === false;
    if (reversing && controller.direction === DISMISS && controller.transition) return false;

    const group = element.closest(groupSelector);
    const groupState = groups.get(group);
    const groupRevision = groupState?.revision;
    if (!groupOperation && groupState && !groupState.accumulating && element !== group) {
      if (!element.id) {
        groupDiagnostic(group, "Present Group members must have an ID.");
        return false;
      }
      if (gotoVisible) return show(group, element.id);
      if (groups.get(group).selected === element) {
        if (!reversing) return show(group, "");
        if (group.getAttribute(attr.active) !== "") group.setAttribute(attr.active, "");
        return selectGroup(group, null, groupMembers(group), UNPOP);
      }
    }
    const hasCapacity = () => groupOperation || element === group || !gotoVisible || !groupState?.accumulating ||
      groupMemberActive(element, groupState) ||
      activeGroupMembers(group, groupState).length < groupLimit(group, groupState);
    if (!hasCapacity()) return false;
    const newDirection = gotoVisible ? POP : closingDirection;

    if (((controller.state !== POP && !controller.transition) && !gotoVisible)
      || (newDirection === controller.direction && !forceRepop)) {
      if (!controller.transition) syncAriaExpanded(element, controller);
      return;
    }

    let transition = null;

    try {
      const revision = controller.operationRevision;
      const allowEvent = groupOperation || aelluxJs.dispatchFrom(
        element, `${BEFORE}${newDirection}`,
        { bubbles: true, cancelable: true }
      );
      if (!allowEvent || controller.operationRevision !== revision ||
        presentElements.get(element) !== controller || !element.isConnected) return;
      if (!groupOperation && element !== group && (element.closest(groupSelector) !== group ||
        (groupState && (groups.get(group) !== groupState || groupState.revision !== groupRevision)))) return;
      if (!hasCapacity()) return false;
      effects.cancelWithin(element);
      controller.operationRevision++;
      const impliedReverse = reversing && !controller.opening && !controller.transition;
      const reverseTracks = reversing && controller.motionEnabled &&
        aelluxJs.currentPreference?.("reduced-motion") !== "reduced"
        ? (gesture ? playback.full(element, controller, false) : playback.snapshot(element, controller, interpolatedProgress)) : [];
      if (gotoVisible) controller.opening = null;
      if (gotoVisible) controller.presentationOrder = presentationOrder === undefined
        ? ++presentationSequence : presentationOrder;
      if (!gotoVisible || !groupOperation) groups.get(group)?.reservations.delete(element);

      if (forceRepop && (!element.hidden || controller.transition)) {
        controller.stop();
        element.hidden = true;
        openPresentElements.delete(element);
        syncAriaExpanded(element, controller);
        element.getBoundingClientRect();
      }

      const reusePreparation = !forceRepop && controller.motionEnabled &&
        controller.transition !== null &&
        controller.classList.contains(className.willChange);
      const waitForPreparation = !gesture && controller.motionEnabled && !reusePreparation && !reversing;
      let previousSize = null;
      const handoff = !gesture && !gotoVisible && controller.motionEnabled ? captureHandoff(element, controller) : null;
      if (handoff && (controller.measuredHeight || controller.measuredWidth)) {
        const computed = root.getComputedStyle(element);
        previousSize = {
          height: parseFloat(computed.maxHeight),
          width: parseFloat(computed.maxWidth)
        };
      }
      if (!forceRepop) {
        controller.stop({ replacement: !!handoff || reusePreparation, transitionStart: true });
      }
      controller.handoff = handoff;
      controller.gestureRequest = null;
      controller.gesture = gesture;
      controller.direction = newDirection;
      if (reversing) controller.reverse = gesture
        ? playback.control(element, reverseTracks, false, interpolatedProgress, interpolatedUnpop)
        : playback.reverse(element, reverseTracks, interpolatedUnpop);
      // Triggers announce the accepted action immediately, independently of
      // the panel's effective visibility at the end of the transition.
      controller.setTriggerExpanded(gotoVisible);
      if (!handoff) {
        setPhase(element, "pop", "0");
        setPhase(element, "dismiss", "0");
        element.style.setProperty("--ae-pop-progress", "0");
        element.style.setProperty("--ae-dismiss-progress", "0");
      }
      if (gotoVisible || reversing) element.style.setProperty("--ae-unpop-progress", "0");
      root.getComputedStyle(element).getPropertyValue("--ae-pop-progress");

      const interrupted = new Promise((_, interruptTransition) => {
        transition = {
          className: null,
          timeout: null,
          interrupt: interruptTransition,
          replacement: false
        };
        controller.transition = transition;
      });
      interrupted.catch(() => { });

      element.hidden = false;
      if (gesture && root.getComputedStyle(element).display === "none") {
        controller.gestureDisplay = aelluxJs.persist.element.save(element, [], ["display"]);
        element.style.setProperty("display", controller.presentMotion ? "inline-grid" : "block", "important");
      }
      openPresentElements.add(element);
      let size = null;
      if (!reversing && (controller.measuredHeight || controller.measuredWidth))
        size = await prepareMeasuredSize(
          element, controller, gotoVisible, previousSize, waitForPreparation || !!gesture
        );
      if (controller.transition !== transition) return;
      if (controller.motionEnabled) {
        controller.classList.add(className.willChange);
      }

      if (waitForPreparation) {
        const prepared = new Promise(resolve => {
          transition.timeout = setTimeout(() => {
            transition.timeout = null;
            resolve();
          }, TRANSITION_PREPARE_TIME);
        });
        await Promise.race([prepared, interrupted]);
      }

      transition.className = gotoVisible ? className.popping : reversing ? className.unpopping : className.dismissing;
      const configurationDirection = reversing ? POP : newDirection;
      const duration = root.getComputedStyle(element)
        .getPropertyValue(`--ae-${configurationDirection}-duration`.toLowerCase()).trim();
      const timeMs = reversing ? controller.reverse.duration : getString2Time(duration);

      const applyDestination = () => {
        controller.classList.remove(
          className.unpop, className.dismissed,
          className.pop,
          className.popping,
          className.dismissing, className.unpopping
        );
        controller.classList.add(transition.className);
        // Clamp private CSS interpolation without adding an animation loop.
        // Stable states use literal endpoints to avoid stale computed-value
        // dependencies after Firefox releases a controlled custom-property effect.
        if (interpolatedProgress) {
          element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
          element.style.setProperty("--ae-dismiss-progress", "clamp(0, var(--ae-present-dismiss-phase), 1)");
        }
        setPhase(element, "pop", gotoVisible ? "1" : "0");
        setPhase(element, "dismiss", gotoVisible ? "0" : "1");
        if (size) {
          if (controller.measuredHeight) {
            element.style.setProperty("max-height", `${gotoVisible ? size.height : 0}px`, "important");
          }
          if (controller.measuredWidth) {
            element.style.setProperty("max-width", `${gotoVisible ? size.width : 0}px`, "important");
          }
        }
      };
      const activateTransition = () => {
        if (controller.transition !== transition) return;
        if (gesture) {
          let tracks = reverseTracks;
          if (!reversing) {
            const opening = controller.opening;
            controller.opening = playback.capture(element, controller, applyDestination, size, gotoVisible && interpolatedProgress, gotoVisible ? "pop" : "dismiss");
            tracks = playback.full(element, controller, false);
            controller.opening = gotoVisible ? { saved: tracks, completed: true } : opening;
            controller.reverse = playback.control(element, tracks, gesture.dismiss, interpolatedProgress, interpolatedUnpop);
          }
          controller.classList.remove(className.pop, className.unpop, className.dismissed, className.popping, className.unpopping, className.dismissing);
          controller.classList.add(transition.className);
          controller.reverse.apply();
          let distance = 0;
          const transform = tracks?.find(track => track.property === "transform");
          if (transform) try {
            const frames = transform.frames;
            const from = new root.DOMMatrix(frames[0].transform), to = new root.DOMMatrix(frames[frames.length - 1].transform);
            distance = Math.abs(gesture.axis === "x" ? to.m41 - from.m41 : to.m42 - from.m42);
          } catch (_) { /* non-matrix authored transforms use the dimension fallback */ }
          let previous = gesture.progress;
          gesture.attach({
            seek(value) {
              if (controller.transition !== transition) return;
              controller.reverse.seek(value);
              if (!gesture.dismiss && value !== previous) {
                transition.className = value > previous ? className.popping : className.unpopping;
                controller.classList.remove(className.popping, className.unpopping);
                controller.classList.add(transition.className);
              }
              previous = value;
              const popValue = gesture.dismiss ? 1 - value : value;
              if (!interpolatedProgress) {
                setPhase(element, "pop", String(popValue));
                setPhase(element, "dismiss", String(gesture.dismiss ? value : 1 - value));
                element.style.setProperty("--ae-pop-progress", String(popValue));
                element.style.setProperty("--ae-dismiss-progress", String(gesture.dismiss ? value : 1 - value));
              }
              if (!interpolatedUnpop) element.style.setProperty("--ae-unpop-progress", String(1 - popValue));
            },
            playTo(target) {
              if (controller.transition !== transition) return Promise.reject();
              if (!gesture.dismiss) {
                transition.className = target ? className.popping : className.unpopping;
                controller.classList.remove(className.popping, className.unpopping);
                controller.classList.add(transition.className);
              }
              return controller.reverse.playTo(target);
            }
          }, distance);
          return;
        }
        if (reversing) {
          handoff?.memory.restore();
          if (interpolatedProgress)
            element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
          controller.classList.remove(className.pop, className.popping, className.dismissing);
          controller.classList.add(className.unpopping);
          controller.reverse.apply();
          return;
        }
        if (handoff) {
          handoff.memory.restore();
          element.style.setProperty("transition-property", "none", "important");
          applyDestination();
          // Grid's computed tracks are pixels. Resolve the destination in the
          // same units so px -> fr cannot become a discrete transition. This
          // synchronous measurement is never painted; endpoints stay authored.
          const computed = root.getComputedStyle(element);
          const tracks = handoff.values.filter(([property]) => property.startsWith("grid-template-") || property === "height" || property === "width")
            .map(([property]) => [property, computed.getPropertyValue(property)]);
          handoff.freeze();
          handoff.transition.restore();
          const properties = root.getComputedStyle(element).transitionProperty;
          element.getBoundingClientRect();
          handoff.memory.restore();
          applyDestination();
          if (tracks.length) element.style.setProperty("transition-property", `${properties}, height, width`, "important");
          for (const [property, value] of tracks) element.style.setProperty(property, value, "important");
        } else if (gotoVisible) {
          controller.opening = playback.capture(element, controller, applyDestination, size, interpolatedProgress);
        } else applyDestination();
      };
      const advancedEase = root.getComputedStyle(element)
        .getPropertyValue(`--ae-${configurationDirection}-aellux-ease`.toLowerCase()).trim() || undefined;
      const motionOptions = {
        extension: extensionName,
        id: controller.motionId,
        ownedOnly: reversing,
        apply: activateTransition,
        easing: reversing && !impliedReverse ? undefined : advancedEase,
        nativeDuration: timeMs,
        maxFPS: aelluxJs.layoutMaxFPS ? aelluxJs.layoutMaxFPS(element) : undefined,
        abort: () => controller.transition !== transition || !element.isConnected
      };
      const completed = gesture ? (activateTransition(), gesture.settled) : aelluxJs.motion
        ? aelluxJs.motion.run(element, motionOptions)
        : legacyMotionRun(motionOptions, transition);

      aelluxJs.dispatchFrom(element, "Layout", {
        detail: {
          origin: `present.${newDirection}`.toLowerCase(),
          durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
        },
        bubbles: true
      });
      if (controller.transition !== transition || !element.isConnected) return;
      const autoDismissValue = gotoVisible && element.getAttribute(attr.autoDismiss);
      if (autoDismissValue) {
        const duration = getString2Time(autoDismissValue);
        if (Number.isFinite(duration) && duration >= 0) {
          emitAutoDismissProgress(element, 0, duration);
        }
      }
      if (controller.transition !== transition || !element.isConnected) return;
      aelluxJs.dispatchFrom(element, gotoVisible ? "Popping" : reversing ? "Unpopping" : "Dismissing", { bubbles: true });
      const motionResult = await Promise.race([completed, interrupted]);
      if (controller.transition !== transition ||
        (gesture && !motionResult) ||
        (!gesture && motionResult && motionResult.status !== "completed")) return;
      if (gesture) {
        const finalVisible = motionResult === POP;
        controller.direction = motionResult;
        controller.setTriggerExpanded(finalVisible);
        finishTransition(element, controller, transition, finalVisible);
        if (groupState && groups.get(group) === groupState && !groupState.accumulating) {
          const selected = finalVisible ? element : groupState.selected === element ? null : groupState.selected;
          groupState.selected = selected;
          const active = selected?.id || "";
          if (group.getAttribute(attr.active) !== active) group.setAttribute(attr.active, active);
          publishGroup(group, groupState, selected);
        }
        controller.gesture = null;
        aelluxJs.dispatchFrom(element, motionResult, { bubbles: true });
        if (finalVisible) autoDismissSchedule(element, controller);
        return;
      }
      if (gotoVisible) playback.complete(element, controller, interpolatedProgress);
      finishTransition(element, controller, transition, gotoVisible);

      if (gotoVisible && !element.hidden) {
        autoDismissSchedule(element, controller);
        controller.classList.add(className.pop);
        aelluxJs.dispatchFrom(element, POP, { bubbles: true });
      }
      if (!gotoVisible && controller.state !== POP) {
        aelluxJs.dispatchFrom(element, newDirection, { bubbles: true });
      }
    } catch (error) {
      const ownsTransition = transition && controller.transition === transition;
      if (ownsTransition && transition.timeout !== null) {
        clearTimeout(transition.timeout);
        transition.timeout = null;
      }
      if (ownsTransition && transition.className) {
        controller.classList.remove(transition.className);
      }
      switch (error && error.code) {
        case aelluxJs.diagnostics.WARN_INTERRUPTION.code:
          // Replacement and teardown are expected lifecycle operations.
          // Unexpected interruption diagnostics still reach the reporter.
          if (transition && transition.cancelled) break;
          aelluxJs.diagnostics.warn(
            aelluxJs.diagnostics.WARN_INTERRUPTION,
            {
              cause: error,
              extension: extensionName,
              element,
              replacement: transition && transition.replacement === true
            }
          );
          break;
        default:
          aelluxJs.diagnostics.error(
            aelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION,
            { cause: error, extension: extensionName, element }
          );
          break;
      }
    } finally {
      if (transition && controller.transition === transition) {
        controller.gesture?.abort();
        controller.gesture = null;
        controller.reverse?.cleanup();
        controller.reverse = null;
        controller.gestureDisplay?.restore();
        controller.gestureDisplay = null;
        restoreHandoff(controller);
        restoreMeasuredStyles(element, controller);
        controller.transition = null;
        controller.classList.remove(className.willChange);
        effects.settled(transition);
      }
    }
  }

  function legacyMotionRun(options, transition) {
    options.apply();
    return new Promise(resolve => {
      transition.timeout = setTimeout(() => {
        transition.timeout = null;
        resolve({ id: options.id, status: "completed", mode: "native" });
      }, Math.max(0, Number(options.nativeDuration) || 0));
    });
  }

  function finishTransition(element, controller, transition, gotoVisible) {
    restoreHandoff(controller);
    const focused = !gotoVisible && element.contains(document.activeElement)
      ? document.activeElement : null;
    controller.classList.remove(className.popping, className.unpopping, className.dismissing);
    establishState(element, controller, gotoVisible ? POP : controller.direction);
    element.hidden = !gotoVisible && controller.legacyHidden;
    controller.reverse?.cleanup();
    controller.reverse = null;
    controller.gestureDisplay?.restore();
    controller.gestureDisplay = null;
    restoreMeasuredStyles(element, controller);
    setProgress(element, gotoVisible);
    syncAriaExpanded(element, controller);
    refreshExpandedStates();
    gestures.inspect(element);
    if (!gotoVisible) openPresentElements.delete(element);
    else openPresentElements.add(element);
    if (focused && !controller.expanded) {
      if (document.activeElement === focused) focused.blur();
      if (document.activeElement !== focused) aelluxJs.dispatch(`${controller.direction}FocusLost`, {
        detail: { element, focused }
      });
    }
    transition.timeout = null;
    transition.completed = true;
  }

  function establishState(element, controller, state) {
    controller.state = state;
    controller.classList.toggle(className.pop, state === POP);
    controller.classList.toggle(className.unpop, state === UNPOP);
    controller.classList.toggle(className.dismissed, state === DISMISS);
  }

  function autoDismissSchedule(element, controller) {
    if (!controller) return;
    cancelAutoDismiss(controller);
    const autoDismissValue = element.getAttribute(attr.autoDismiss);
    if (controller.state !== POP || (controller.transition && !controller.classList.contains(className.pop)) ||
      !element.isConnected || !autoDismissValue) return;
    const duration = getString2Time(autoDismissValue);
    if (!Number.isFinite(duration) || duration < 0) return;
    const countdown = { start: root.performance.now(), duration, frame: null, last: 0 };
    controller.autoCountdown = countdown;
    const valid = () => controller.autoCountdown === countdown &&
      presentElements.get(element) === controller && element.isConnected;
    const emit = (completed, initial = false) => {
      const elapsedMs = completed ? duration : initial ? 0 :
        Math.min(duration, Math.max(0, root.performance.now() - countdown.start));
      emitAutoDismissProgress(element, elapsedMs, duration, completed);
    };
    const tick = () => {
      if (!valid()) { if (controller.autoCountdown === countdown) cancelAutoDismiss(controller); return; }
      const now = root.performance.now();
      const fps = aelluxJs.layoutMaxFPS?.(element) || aelluxJs.options.cssMotionPropertyMaxFPS || 55;
      if (now - countdown.last >= 1000 / fps) {
        countdown.last = now;
        emit(false);
      }
      if (valid()) countdown.frame = root.requestAnimationFrame(tick);
    };
    // Install before dispatch: a consumer can synchronously cancel/restart.
    controller.autoDismissTimeout = setTimeout(() => {
      if (!valid()) { if (controller.autoCountdown === countdown) cancelAutoDismiss(controller); return; }
      if (countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
      countdown.frame = null;
      controller.autoDismissTimeout = null;
      emit(true);
      if (!valid()) return;
      controller.autoCountdown = null;
      dismiss(element);
    }, duration);
    emit(false, true);
    if (valid()) countdown.frame = root.requestAnimationFrame(tick);
  }

  function emitAutoDismissProgress(element, elapsedMs, duration, completed = false) {
    aelluxJs.dispatchFrom(element, "Progress", { bubbles: false, cancelable: false,
      detail: { value: completed ? 1 : duration ? elapsedMs / duration : 0, max: 1,
        status: completed ? "completed" : "running", elapsedMs,
        durationMs: duration, remainingMs: Math.max(0, duration - elapsedMs) } });
  }

  function cancelAutoDismiss(controller) {
    if (controller.autoDismissTimeout !== null) clearTimeout(controller.autoDismissTimeout);
    const countdown = controller.autoCountdown;
    if (countdown && countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
    controller.autoDismissTimeout = null;
    controller.autoCountdown = null;
  }

  function matchesClick(element, attribute, inside) {
    const mode = (element.getAttribute(attribute) || "").trim();
    return (inside ? /^in(side)?$/i : /^out(side)?$/i).test(mode);
  }

  function clickAutoDismiss(eventTarget, currentExceptions) {
    for (const pContainer of openPresentElements) {
      if (pContainer.hidden === true
        || currentExceptions.some((e) => pContainer.contains(e))) continue;
      const inside = pContainer.contains(eventTarget);
      // Dismiss wins when both policies match; each activation starts only one operation.
      if (matchesClick(pContainer, attr.dismissOnClick, inside)) dismiss(pContainer);
      else if (matchesClick(pContainer, attr.unpopOnClick, inside)) unpop(pContainer);
    }
  }

  function refreshChangedTrigger(button) {
    if (!triggerElementsSet.has(button)) return;
    const value = button.getAttribute(attr.target);
    if (value !== indexedTriggerValues.get(button)) refreshTriggerTargets(button);
  }

  function OnClick(event) {
    const target = activationTarget(event);
    if (!target) return;
    let matched;
    for (const pending of pendingTaps) {
      const pointerId = event.pointerId;
      // WebKit may expose a touch/pen compatibility click as a mouse pointer
      // with a different ID. Match that short-lived pair by its target instead.
      const compatibilityClick = event.pointerType === "mouse" &&
        ["touch", "pen"].includes(pending.event.detail?.pointerType);
      if (!compatibilityClick && typeof pointerId === "number" && typeof pending.event.detail?.pointerId === "number" &&
        pointerId !== pending.event.detail.pointerId) continue;
      if (pending.target === target || pending.target.contains(target) || target.contains(pending.target))
        matched = pending;
    }
    if (matched) cancelPendingTap(matched);
    activate(event, target);
  }

  function activationTarget(event) {
    const path = event.composedPath ? event.composedPath() : [];
    const target = path[0] || event.target;
    return target?.closest ? target : null;
  }

  function onTap(event) {
    const target = activationTarget(event);
    if (!target) return;
    const control = target.closest(`[${attr.trigger}]`);
    if (control) refreshChangedTrigger(control);
    const pending = {
      event, target, hoverSuppressed: control && suppressHoverClick(control, event),
      present: triggerTargets.get(control),
      input: aelluxJs.comm.request("input.mount-token", { element: target }).value,
      timer: null
    };
    pendingTaps.add(pending);
    // Touch compatibility click can arrive in a later input task, after a 0 ms
    // timer. Keep a short grace period so that click owns the action.
    pending.timer = setTimeout(() => {
      pendingTaps.delete(pending);
      if (!target.isConnected ||
        (pending.input && aelluxJs.comm.request("input.mount-token", { element: target }).value !== pending.input)) return;
      activate(event, target, pending.hoverSuppressed);
    }, TAP_CLICK_WAIT_TIME);
  }

  function cancelPendingTap(pending) {
    clearTimeout(pending.timer);
    pendingTaps.delete(pending);
  }

  function cancelElementTaps(element) {
    for (const pending of pendingTaps) {
      if (element.contains(pending.target) || pending.present === element)
        cancelPendingTap(pending);
    }
  }

  function activate(event, eventTarget, hoverSuppressed) {
    const container = eventTarget.closest(presentSelector);
    const exceptions = [];

    var button;
    button = eventTarget.closest(`[${attr.trigger}]`);
    if (button) {
      refreshChangedTrigger(button);
      const triggerAttr = button.getAttribute(attr.trigger);
      const targetSelector = button.getAttribute(attr.target);
      if (targetSelector) {
        const target = targetById(targetSelector);
        diagnoseTarget(button, target, attr.target, targetSelector);
        if (target) {
          exceptions.push(target);
          if (!(hoverSuppressed ?? suppressHoverClick(button, event))) trigger(target, triggerAttr, button.getAttribute(attr.effect));
        }
      } else if (container) {
        exceptions.push(container);
        if (!(hoverSuppressed ?? suppressHoverClick(button, event))) trigger(container, triggerAttr, button.getAttribute(attr.effect));
      } else {
        aelluxJs.diagnostics.error(
          aelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
          { extension: extensionName, element: button, action: triggerAttr === "dismiss" ? "dismiss" : "trigger" }
        );
      }
    }

    clickAutoDismiss(eventTarget, exceptions);
  }

  function diagnoseTarget(element, target, attribute, value) {
    // Invalid ID syntax already has its specific selector diagnostic (1107).
    if (!targetIdFor(value)) return;
    if (target && target.hasAttribute(attr.present)) return;
    aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_CONFIGURATION_TARGET, {
      extension: extensionName, element, attribute, value,
      reason: target ? "Target is not a Present container." : "Target element was not found.",
      suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
    });
  }

  function syncAriaExpanded(element, controller) {
    // hidden can be overridden by responsive CSS. Read the stable rendered
    // state rather than the attribute or a transient animation endpoint.
    let visible = element.isConnected;
    const visibility = root.getComputedStyle(element).visibility;
    if (visibility === "hidden" || visibility === "collapse") visible = false;
    for (let current = element; visible && current; current = current.parentElement) {
      const style = root.getComputedStyle(current);
      if (style.display === "none" || style.contentVisibility === "hidden" ||
        Number(style.opacity) === 0) visible = false;
    }
    if (controller.expanded !== visible) controller.setAriaExpanded(String(visible));
  }

  function refreshExpandedStates() {
    for (const [element, controller] of presentElements) {
      if (!controller.transition) syncAriaExpanded(element, controller);
    }
  }

  function setProgress(element, visible) {
    setPhase(element, "pop", visible ? "1" : "0");
    setPhase(element, "dismiss", visible ? "0" : "1");
    element.style.setProperty("--ae-pop-progress", visible ? "1" : "0");
    element.style.setProperty("--ae-dismiss-progress", visible ? "0" : "1");
    element.style.setProperty("--ae-unpop-progress", visible ? "0" : "1");
  }

  function setPhase(element, direction, value) {
    element.style.setProperty(`--ae-present-${direction}-phase`, value);
    if (!interpolatedProgress) element.style.setProperty(`--ae-${direction}-progress`, value);
  }

  function groupMembers(group, includeUnidentified = false) {
    return [...presentElements.keys()].filter(element => element.isConnected &&
      element !== group && (includeUnidentified || element.id) && element.closest(groupSelector) === group);
  }

  function groupLimit(group, state) {
    const value = group.getAttribute(attr.group);
    if (state.limitValue === value) return state.limit;
    state.limitValue = value;
    const text = (value || "").trim();
    const limit = text === "" ? 1 : Number(text);
    const valid = text === "" || (/^\d+$/.test(text) && Number.isSafeInteger(limit) && limit > 0);
    state.limit = valid ? limit : 1;
    if (!valid) aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
      extension: extensionName, element: group, attribute: attr.group, value,
      reason: "Present Group capacity must be a positive integer.",
      suggestion: "Use a positive integer, or leave the attribute empty for a capacity of 1."
    });
    return state.limit;
  }

  function groupMemberActive(member, state) {
    return state.reservations.has(member) ||
      isPresented(member);
  }

  function isPresented(element) {
    const controller = presentElements.get(element);
    return controller && (controller.transition ? controller.direction === POP : controller.state === POP);
  }

  function activeGroupMembers(group, state) {
    return groupMembers(group, true).filter(member => groupMemberActive(member, state));
  }

  function mountGroup(group) {
    if (groups.has(group)) return;
    const visible = groupMembers(group).filter(member => presentElements.get(member)?.state === POP);
    groups.set(group, {
      selected: visible.length === 1 ? visible[0] : null,
      accumulating: false, reservations: new Map(),
      revision: 0, pending: Promise.resolve(true), jobs: new Map(),
      memory: aelluxJs.persist.element.save(group, [attr.active])
    });
    groupLimit(group, groups.get(group));
    if (!groupObserver && typeof root.MutationObserver === "function") {
      groupObserver = new root.MutationObserver(records => {
        if (records.some(record => record.type === "childList" ||
          record.attributeName !== "class" || groups.has(record.target))) queueGroups();
      });
      groupObserver.observe(document, { subtree: true, childList: true, attributes: true,
        attributeFilter: ["class", "id", attr.active, attr.when, attr.group] });
    }
    queueGroups();
  }

  function unmountGroup(group) {
    const state = groups.get(group);
    if (!state) return;
    state.revision++;
    groups.delete(group);
    state.jobs.clear();
    state.reservations.clear();
    publishGroup(group, state, null);
    for (const member of groupMembers(group)) {
      const controller = presentElements.get(member);
      if (controller.transition) {
        const visible = controller.direction === POP;
        controller.stop();
        member.hidden = !visible && controller.legacyHidden;
        establishState(member, controller, visible ? POP : controller.direction);
        controller.setTriggerExpanded(visible);
        setProgress(member, visible);
        syncAriaExpanded(member, controller);
        if (!visible) openPresentElements.delete(member);
      }
    }
    state.memory.restore();
    if (!groups.size && groupObserver) {
      groupObserver.disconnect();
      groupObserver = null;
    }
  }

  function queueGroups() {
    if (groupsQueued || !groups.size) return;
    groupsQueued = true;
    Promise.resolve().then(() => {
      groupsQueued = false;
      groups.forEach((state, group) => {
        reconcileGroup(group);
        if (groups.get(group) === state) publishGroup(group, state, state.selected);
      });
    });
  }

  function groupDiagnostic(group, reason) {
    aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_PRESENT_GROUP_SELECTION,
      { extension: extensionName, element: group, attribute: attr.active,
        value: group.getAttribute(attr.active), reason,
        suggestion: "Use unique native IDs on Present members of this group; select one ID or one matching condition." });
  }

  function reconcileGroup(group, exclusive = false) {
    if (!group.isConnected || !group.hasAttribute(attr.group)) return;
    const members = groupMembers(group);
    const state = groups.get(group);
    groupLimit(group, state);
    if (state.accumulating) {
      if (!exclusive && state.accumulationInputs === selectionInputs(group)) return;
    }
    if (!members.includes(state.selected)) state.selected = null;
    let matches;
    if (group.hasAttribute(attr.active)) {
      const id = group.getAttribute(attr.active);
      matches = id === "" ? [] : members.filter(member => member.id === id);
      if (id && matches.length !== 1) {
        groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
        return;
      }
    } else {
      matches = members.filter(member => {
        const token = member.getAttribute(attr.when);
        return token && !/\s/.test(token) && group.classList.contains(token);
      });
      if (!matches.length) {
        const visible = members.filter(isPresented);
        if (visible.length > 1) groupDiagnostic(group, "Multiple initially visible members.");
        else if (!state.selected) state.selected = visible[0] || null;
        return;
      }
    }
    if (matches.length > 1) {
      groupDiagnostic(group, "Multiple members match the container classes.");
      return;
    }
    return selectGroup(group, matches[0] || null, members);
  }

  function show(group, id) {
    const state = groups.get(group);
    if (!state || typeof id !== "string") return Promise.resolve(false);
    const matches = groupMembers(group).filter(member => member.id === id);
    if (id && matches.length !== 1) {
      groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
      return Promise.resolve(false);
    }
    if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
    const result = reconcileGroup(group, true);
    return Promise.resolve(result === undefined ? state.pending : result);
  }

  function selectionInputs(group) {
    return JSON.stringify([group.getAttribute(attr.active), groupMembers(group)
      .filter(member => {
        const token = member.getAttribute(attr.when);
        return token && !/\s/.test(token) && group.classList.contains(token);
      }).map(member => member.id).sort()]);
  }

  // Reserve and rotate synchronously; prepare runs before BeforePop/motion.
  // Return the completed member, or null on veto, replacement or no candidate.
  function popNext(group, prepare) {
    const state = groups.get(group);
    if (!state || !group.isConnected || !group.hasAttribute(attr.group)) return Promise.resolve(null);
    const members = Array.from(group.children).filter(member => member !== group &&
      member.hasAttribute(attr.present) && presentElements.has(member) &&
      member.closest(groupSelector) === group);
    const limit = groupLimit(group, state);
    const active = activeGroupMembers(group, state);
    const inactive = members.filter(member => !groupMemberActive(member, state));
    const closed = inactive.filter(member => presentElements.get(member)?.state !== POP);
    const available = closed.length ? closed : inactive;
    const candidates = active.length < limit && available.length ? available :
      members.filter(member => active.includes(member)).sort((left, right) => {
        const order = member => state.reservations.get(member)?.order || presentElements.get(member).presentationOrder;
        return order(right) - order(left);
      });
    const member = candidates[candidates.length - 1];
    if (!member) return Promise.resolve(null);
    const entering = !state.accumulating;
    if (entering) {
      state.revision++;
      state.jobs.clear();
      state.accumulating = true;
      state.accumulationInputs = selectionInputs(group);
      state.selected = null;
    }
    const controller = presentElements.get(member);
    const revision = state.revision;
    const capacity = group.getAttribute(attr.group);
    const inputs = selectionInputs(group);
    const previousReservation = state.reservations.get(member);
    const reservation = { revision: controller.operationRevision, order: ++presentationSequence };
    state.reservations.set(member, reservation);
    group.insertBefore(member, members[0]);
    const valid = (preflight = false) => groups.get(group) === state && state.revision === revision && state.accumulating &&
      state.reservations.get(member) === reservation && presentElements.get(member) === controller &&
      controller.operationRevision === reservation.revision &&
      (!preflight || (group.getAttribute(attr.group) === capacity && selectionInputs(group) === inputs)) &&
      member.isConnected && member.parentElement === group && member.closest(groupSelector) === group;
    const release = (restore = false) => {
      if (state.reservations.get(member) !== reservation) return;
      if (restore && previousReservation && groups.get(group) === state && state.revision === revision &&
        state.accumulating && presentElements.get(member) === controller &&
        previousReservation.revision === controller.operationRevision &&
        member.isConnected && member.closest(groupSelector) === group) {
        state.reservations.set(member, previousReservation);
      } else state.reservations.delete(member);
    };
    let job;
    try {
      if (entering) publishGroup(group, state, null);
      if (!valid(true)) {
        release(true);
        return Promise.resolve(null);
      }
      if (typeof prepare === "function") prepare(member);
      if (!valid(true) || !aelluxJs.dispatchFrom(member, "BeforePop", { bubbles: true, cancelable: true }) ||
        !valid(true)) {
        release(true);
        return Promise.resolve(null);
      }
      reservation.revision++;
      job = presentTransition(member, true, true, true, reservation.order);
    } catch (error) {
      release(true);
      return Promise.reject(error);
    }
    return job.then(() => valid() && !member.hidden && presentElements.get(member).direction === POP
      ? member : null).finally(() => release());
  }

  function selected(group) {
    const state = groups.get(group);
    const member = state && state.selected;
    return member && member !== group && presentElements.has(member) && member.isConnected && member.id &&
      member.closest(groupSelector) === group ? member : null;
  }

  function publishGroup(group, state, current) {
    if (state.announced === current) return;
    const previous = state.announced || null;
    state.announced = current;
    aelluxJs.dispatchFrom(group, "PresentGroupChange", { bubbles: true,
      detail: { group, previous, current, key: current && current.id } });
  }

  function selectGroup(group, selected, members, closingDirection = DISMISS) {
    const state = groups.get(group);
    const changes = members.filter(member => member === selected ? !isPresented(member) : isPresented(member));
    if (state.selected === selected && !changes.length) {
      state.accumulating = false;
      state.reservations.clear();
      return state.pending;
    }
    const revision = ++state.revision;
    // Before listeners can mutate declarative inputs without calling show().
    // Validate the whole preflight before changing any member's visual state.
    const active = group.getAttribute(attr.active);
    const classes = group.getAttribute("class");
    const ids = members.map(member => member.id);
    const conditions = members.map(member => member.getAttribute(attr.when));
    const valid = () => groups.get(group) === state && state.revision === revision &&
      group.isConnected && group.hasAttribute(attr.group) &&
      group.getAttribute(attr.active) === active && group.getAttribute("class") === classes &&
      groupMembers(group).length === members.length && members.every((member, index) =>
        presentElements.has(member) && member.isConnected && member.closest(groupSelector) === group &&
        member.id === ids[index] && member.getAttribute(attr.when) === conditions[index]);
    for (const member of changes) {
      const allowed = aelluxJs.dispatchFrom(member, member === selected ? "BeforePop" : `${BEFORE}${closingDirection}`,
        { bubbles: true, cancelable: true });
      if (!valid()) { queueGroups(); return false; }
      if (!allowed) {
        if (state.accumulating) {
          // A rejected exclusive request preserves independently open members;
          // do not let the observer immediately retry the same declaration.
          state.accumulationInputs = selectionInputs(group);
          return false;
        }
        // A veto keeps the accepted selection, including the declarative source.
        if (state.revision === revision) {
          const id = state.selected?.id || "";
          if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
        }
        return false;
      }
    }
    state.accumulating = false;
    state.reservations.clear();
    state.selected = selected;
    let complete;
    const pending = new Promise(resolve => { complete = resolve; });
    state.pending = pending;
    for (const member of changes) {
      const job = presentTransition(member, member === selected, false, true, undefined, closingDirection);
      if (groups.get(group) !== state || state.revision !== revision) {
        complete(false);
        return pending;
      }
      state.jobs.set(member, job);
      job.then(() => {
        if (state.jobs.get(member) === job) state.jobs.delete(member);
      });
    }
    publishGroup(group, state, selected);
    // An unchanged outgoing member can still be animating from an earlier
    // selection. The latest request includes its completion too.
    Promise.all(members.map(member => state.jobs.get(member))).then(() => {
        const current = groupMembers(group);
        complete(groups.get(group) === state && state.revision === revision &&
          (!selected || current.includes(selected)) &&
          current.every(member => member === selected ? presentElements.get(member)?.state === POP : presentElements.get(member)?.state !== POP));
      });
    return pending;
  }

  function cancelHoverClose(target) {
    clearTimeout(hoverTimers.get(target));
    hoverTimers.delete(target);
  }

  function inHoverRegion(target, node) {
    if (!node || !node.nodeType) return false;
    if (target.contains(node)) return true;
    for (const button of triggerElementsSet) {
      if (button.getAttribute(attr.triggerOn) === "hover" &&
        triggerTargets.get(button) === target && button.contains(node)) return true;
    }
    return false;
  }

  function suppressHoverClick(button, event) {
    const pointerType = event.pointerType || event.detail?.pointerType;
    const pointerActivation = typeof event.detail === "number" ? event.detail > 0 : !!pointerType;
    return button.getAttribute(attr.triggerOn) === "hover" && pointerActivation &&
      pointerType !== "touch" && hoveredTriggers.has(button);
  }

  function onHover(event) {
    if (event.pointerType === "touch" || !event.target?.closest) return;
    const entering = event.type === "pointerover";
    const button = event.target.closest(`[${attr.trigger}][${attr.triggerOn}="hover"]`);
    if (button && triggerElementsSet.has(button) && !button.contains(event.relatedTarget)) {
      refreshChangedTrigger(button);
      const target = triggerTargets.get(button);
      if (target && presentElements.has(target)) {
        if (entering) {
          cancelHoverClose(target);
          hoveredTriggers.add(button);
          const action = button.getAttribute(attr.trigger);
          if (action === "pop") toggle(target, true);
          else trigger(target, action, button.getAttribute(attr.effect));
        } else hoveredTriggers.delete(button);
      }
    }
    for (const target of openPresentElements) {
      if (!inHoverRegion(target, event.target)) continue;
      if (entering || inHoverRegion(target, event.relatedTarget)) cancelHoverClose(target);
      else if ([...triggerElementsSet].some(control =>
        triggerTargets.get(control) === target && control.getAttribute(attr.triggerOn) === "hover" &&
        !["dismiss", "unpop", "effect"].includes(control.getAttribute(attr.trigger)))) {
        cancelHoverClose(target);
        hoverTimers.set(target, setTimeout(() => {
          hoverTimers.delete(target);
          if (presentElements.has(target) && target.isConnected &&
            !inHoverRegion(target, document.activeElement)) dismiss(target);
        }, 120));
      }
    }
  }

  function getString2Time(string) {
    return string
      ? parseFloat(string) * getMillisecondsMulti(string)
      : 0
  }

  function getMillisecondsMulti(value) {
    return !value.endsWith(MILLISECOND)
      && value.endsWith(SECOND) ? 1000 : 1;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
