/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Present Extension
 *
 * Purpose: controls the presented or hidden state of mounted regions and
 * coordinates triggers, dismiss controls, outside interaction and CSS motion.
 *
 * Capability profile: interaction and input, structure and state, and motion
 * and timing.
 *
 * Inputs and activation: mounts `[data-ae-present]` regions. Its whitespace-
 * separated opacity, transform, height and width values select the animated
 * properties. An empty value disables motion, while `all` expands to all four
 * tokens during mount. A direct `[data-ae-present-motion]` child enables grid
 * size transitions; without it, size transitions measure the container.
 * Trigger and dismiss relationships use extension data attributes and may
 * target a region by ID, with or without a leading #. Point tap notifications
 * share click activation; a matching native click takes priority over a queued tap.
 *
 * Outputs and owned state: owns presentation and will-change classes plus its
 * changes to `hidden`, `aria-expanded` and `aria-controls`. It exposes
 * controller methods for presenting, dismissing and toggling and dispatches
 * lifecycle events.
 * When hiding a region containing the active element, it dispatches
 * `UnpopFocusLost` after that element loses focus.
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

  const AelluxJs = root.AelluxJs;
  const extensionName = "present";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  const attr = {
    present: AelluxJs.attr(extensionName),
    group: AelluxJs.attr("present-group"),
    active: AelluxJs.attr("present-active"),
    when: AelluxJs.attr("present-when"),
    triggerOn: AelluxJs.attr("trigger-on"),
    autoUnpop: AelluxJs.attr("auto-unpop"),
    presentMotion: AelluxJs.attr("present-motion"),
    unpopOnOutside: AelluxJs.attr("unpop-on-outside"),
    trigger: AelluxJs.attr("trigger"), //toggle,pop,unpop
    dismiss: AelluxJs.attr("dismiss"), //target ID
    target: AelluxJs.attr("target"), //target ID
  };
  const className = {
    pop: AelluxJs.className("pop"),
    popping: AelluxJs.className("popping"),
    unpopping: AelluxJs.className("unpopping"),
    willChange: AelluxJs.className("will-change"),
    grid: AelluxJs.className("present-grid")
  };
  const presentSelector = `[${attr.present}]`;
  const groupSelector = `[${attr.group}]`;

  AelluxJs.extAttach(extensionName, {
    init, destroy,
    pop, unpop, toggle, trigger, show, selected, popNext
  });

  const
    POP = "Pop",
    UNPOP = "Unpop",
    BEFORE = "Before",
    PING = "ping",
    MILLISECOND = "ms",
    SECOND = "s",
    DEFAULT_PRESENT = "opacity transform height width",
    OPACITY_SYNTAX = "<number> | <percentage>",
    TRANSFORM_SYNTAX = "<transform-list> | none";

  const TRANSITION_PREPARE_TIME = 100;
  const TAP_CLICK_WAIT_TIME = 32;
  const presentElements = new Map();
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
  let autoObserver = null;
  let presentationSequence = 0;
  const cssProperties = [
    ["pop-progress", "<number>", "0"],
    ["unpop-progress", "<number>", "1"],
    ["present-pop-phase", "<number>", "0"],
    ["present-unpop-phase", "<number>", "1"],
    ["from-opacity", OPACITY_SYNTAX, "0"],
    ["pop-opacity", OPACITY_SYNTAX, "1"],
    ["unpop-opacity", OPACITY_SYNTAX, "0"],
    ["from-transform", TRANSFORM_SYNTAX, "scale(0.5)"],
    ["pop-transform", TRANSFORM_SYNTAX, "scale(1)"],
    ["unpop-transform", TRANSFORM_SYNTAX, "scale(1.2)"],
    ["from-height", "*", "0fr"], ["pop-height", "*", "1fr"],
    ["unpop-height", "*", "0fr"], ["from-width", "*", "0fr"],
    ["pop-width", "*", "1fr"], ["unpop-width", "*", "0fr"],
    ["pop-ease", "*", "ease-out"], ["unpop-ease", "*", "ease-in"],
    ["pop-duration", "<time>", "250ms"], ["unpop-duration", "<time>", "250ms"]
  ];

  function init(options) {
    const descriptors = cssProperties.map(([name, syntax, initialValue]) =>
      ({ name: `--ae-${name}`, syntax, initialValue }));
    const progressRegistered = AelluxJs.registerCssProperty(...descriptors.slice(0, 4));
    interpolatedProgress = !!(progressRegistered && root.CSS.supports &&
      root.CSS.supports("opacity", "clamp(0, 0.5, 1)"));
    AelluxJs.registerCssProperty(...descriptors.slice(4));
    AelluxJs.mountManager.add({
      extensionName, selector: presentSelector,
      priority: 0,
      mount: mountPresentContainer, unmount: unmountPresentContainer,
      update: element => autoUnpopSchedule(element, presentElements.get(element)),
      controllers: ["pop", "unpop", "trigger", "toggle"]
    });

    AelluxJs.mountManager.add({
      extensionName,
      priority: 0,
      selector: `[${[
        attr.trigger,
        attr.dismiss,
        attr.target
      ].join('],[')}]`,
      mount: mountTriggerElement, unmount: unmountTriggerElement
    });

    AelluxJs.mountManager.add({
      extensionName, selector: groupSelector, priority: 1,
      mount: mountGroup, unmount: unmountGroup, controllers: ["show", "selected", "popNext"]
    });
    autoObserver = new root.MutationObserver(records => {
      for (const record of records) {
        const controller = presentElements.get(record.target);
        if (controller) autoUnpopSchedule(record.target, controller);
      }
    });
    autoObserver.observe(document, { subtree: true, attributes: true, attributeFilter: [attr.autoUnpop] });
    document.addEventListener("pointerover", onHover);
    document.addEventListener("pointerout", onHover);
    AelluxJs.on("$click", OnClick);
    AelluxJs.on("tap", onTap);
    AelluxJs.onEvent(root, "$resize", refreshExpandedStates);
  }

  function destroy() {
    autoObserver?.disconnect();
    autoObserver = null;
    AelluxJs.mountManager.remove({ extensionName });
    AelluxJs.off("$click", OnClick);
    AelluxJs.off("tap", onTap);
    for (const pending of pendingTaps) cancelPendingTap(pending);
    AelluxJs.offEvent(root, "$resize", refreshExpandedStates);
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
    elementMemories.set(element, AelluxJs.persist.element.save(
      element,
      [attr.present, attr.presentMotion, "hidden"],
      ["--ae-pop-progress", "--ae-unpop-progress",
        "--ae-present-pop-phase", "--ae-present-unpop-phase"]
    ));
    containerAriaHandlers.set(element, AelluxJs.aria.register(element));
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
      AelluxJs.diagnostics.info(
        AelluxJs.diagnostics.INFO_PRESENT_MEASURED_LAYOUT,
        { extension: extensionName, element }
      );
    }
    const presentController = {
      presentMotion,
      measuredHeight,
      measuredWidth,
      motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
      motionId: AelluxJs.motion ? AelluxJs.motion.id() : fallbackMotionId++,
      transition: null,
      operationRevision: 0,
      presentationOrder: element.hidden ? 0 : ++presentationSequence,
      autoUnpopTimeout: null,
      autoCountdown: null,
      direction: null,
      classList: element.classList,
      triggers: new Set(),
      triggerExpanded: !element.hidden,
      setAriaExpanded: function (value) {
        this.expanded = value === "true";
        containerAriaHandlers.get(element).set({ expanded: this.expanded });
      },
      setTriggerExpanded: function (value) {
        this.triggerExpanded = value;
        this.triggers.forEach(updateTriggerAriaExpanded);
      },
      stop: function (options = {}) {
        const replacement = options.replacement === true;
        const transitionStart = options.transitionStart === true;
        const transition = this.transition;
        if (transition) {
          transition.cancelled = true;
          transition.replacement = replacement;
          if (AelluxJs.motion) AelluxJs.motion.cancel(this.motionId);
          if (transition.timeout !== null) {
            clearTimeout(transition.timeout);
            transition.timeout = null;
          }
          if (!transitionStart && transition.className) {
            this.classList.remove(transition.className);
          }
          this.transition = null;
          transition.interrupt(
            AelluxJs.diagnostics.create(
              AelluxJs.diagnostics.WARN_INTERRUPTION,
              { extensionName, replacement }
            )
          );
        }
        cancelAutoUnpop(this);
        if (transitionStart) {
          this.classList.remove(className.unpopping);
        } else {
          this.classList.remove(
            className.pop,
            className.popping,
            className.unpopping,
            className.willChange
          );
        }
        if (!replacement) restoreMeasuredStyles(element, this);
      }
    };
    if (!element.hidden) {
      presentController.classList.add(className.pop);
      openPresentElements.add(element);
    }
    presentElements.set(element, presentController);
    for (const triggerElement of element.querySelectorAll(
      `[${attr.trigger}],[${attr.dismiss}],[${attr.target}]`
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
    setProgress(element, !element.hidden);
    syncAriaExpanded(element, presentController);
    queueGroups();
    autoUnpopSchedule(element, presentController);
  }

  function unmountPresentContainer(element) {
    if (!presentElements.has(element)) return;
    cancelElementTaps(element);
    const controller = presentElements.get(element);
    cancelHoverClose(element);
    for (const button of controller.triggers) hoveredTriggers.delete(button);
    controller.stop();
    AelluxJs.waitLayout?.cancel(controller.motionId);
    element.classList.remove(className.grid);
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
    if (triggerElementsSet.has(triggerElement)) return;
    triggerAriaHandlers.set(triggerElement, AelluxJs.aria.register(triggerElement));
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
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_SELECTOR, {
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
    const previousTarget = triggerTargets.get(triggerElement);
    const targetSelector = triggerElement.getAttribute(attr.target);
    const dismiss = triggerElement.getAttribute(attr.dismiss);
    indexTriggerTarget(triggerElement, dismiss || targetSelector);
    const container = triggerElement.closest(presentSelector);

    if (previousTarget) {
      presentElements.get(previousTarget)?.triggers.delete(triggerElement);
    }

    let target = null;
    if (dismiss || targetSelector) {
      target = targetById(dismiss || targetSelector);
    } else if (container && container.id) {
      target = container;
    }

    if (previousTarget !== target) hoveredTriggers.delete(triggerElement);

    if (!target || !target.id) {
      triggerTargets.delete(triggerElement);
      triggerAriaHandlers.get(triggerElement)?.unset("expanded");
      triggerAriaHandlers.get(triggerElement)?.unset("controls");
      return;
    }
    triggerTargets.set(triggerElement, target);
    presentElements.get(target)?.triggers.add(triggerElement);
    const targetIds = new Set([target.id]);
    const initial = triggerAriaHandlers.get(triggerElement)?.initial("controls");
    if (initial) { initial.trim().split(/\s+/).forEach(x => targetIds.add(x)); }
    updateTriggerAriaExpanded(triggerElement);
    triggerAriaHandlers.get(triggerElement).set({ controls: [...targetIds] });
  }

  function updateTriggerAriaExpanded(triggerElement) {
    const target = triggerTargets.get(triggerElement);
    if (!target) return;
    const expanded = presentElements.get(target)?.triggerExpanded === true;
    triggerAriaHandlers.get(triggerElement)?.set({ expanded });
  }

  function pop(element) { return presentTransition(element, true, true); }
  function unpop(element) { return presentTransition(element, false); }
  function toggle(element, goto) { return presentTransition(element, goto); }
  function trigger(element, trigger) {
    trigger = typeof trigger === "string" ?
      (trigger || "toggle").toLowerCase() :
      "toggle";
    if (!["pop", "unpop", "toggle"].includes(trigger)) AelluxJs.diagnostics.warn(
      AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: extensionName, element, attribute: attr.trigger, value: trigger,
        reason: "Unknown Present action; using toggle.",
        suggestion: "Use pop, unpop, or toggle."
      });
    const method = trigger === "pop" ? pop : trigger === "unpop" ? unpop : toggle;
    return method(element);
  }

  function restoreMeasuredStyles(element, controller) {
    const memory = measuredMemories.get(element);
    if (!memory) return;
    memory.restore();
    measuredMemories.delete(element);
  }

  async function prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation) {
    if (!controller.measuredHeight && !controller.measuredWidth) return null;
    if (!measuredMemories.has(element)) {
      measuredMemories.set(element, AelluxJs.persist.element.save(
        element, [], ["max-height", "max-width"]
      ));
    }
    measuredMemories.get(element).restore();
    let size = previousSize;
    if (gotoVisible || !size) {
      const computed = root.getComputedStyle(element);
      const height = parseFloat(computed.height);
      const width = parseFloat(computed.width);
      size = {
        height: Number.isFinite(height) ? height : element.scrollHeight,
        width: Number.isFinite(width) ? width : element.scrollWidth
      };
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
      await AelluxJs.waitLayout.read(controller.motionId,
        () => element.getBoundingClientRect());
    return size;
  }

  async function presentTransition(element, gotoVisible, forceRepop = false, groupOperation = false, presentationOrder) {
    const controller = presentElements.get(element);
    if (!controller) return;

    if (controller.direction === null)
      controller.direction = element.hidden ? UNPOP : POP;
    if (typeof gotoVisible === "undefined" || gotoVisible === null)
      gotoVisible = (controller.direction === POP) ? false : true;

    const group = element.closest(groupSelector);
    const groupState = groups.get(group);
    const groupRevision = groupState?.revision;
    if (!groupOperation && groupState && !groupState.accumulating && element !== group) {
      if (!element.id) {
        groupDiagnostic(group, "Present Group members must have an ID.");
        return false;
      }
      if (gotoVisible) return show(group, element.id);
      if (groups.get(group).selected === element) return show(group, "");
    }
    const hasCapacity = () => groupOperation || element === group || !gotoVisible || !groupState?.accumulating ||
      groupMemberActive(element, groupState) ||
      activeGroupMembers(group, groupState).length < groupLimit(group, groupState);
    if (!hasCapacity()) return false;
    const newDirection = gotoVisible ? POP : UNPOP;

    if ((element.hidden && !gotoVisible)
      || (newDirection === controller.direction && !forceRepop)) {
      if (!controller.transition) syncAriaExpanded(element, controller);
      return;
    }

    let transition = null;

    try {
      const revision = controller.operationRevision;
      const allowEvent = groupOperation || AelluxJs.dispatchFrom(
        element, `${BEFORE}${newDirection}`,
        { bubbles: true, cancelable: true }
      );
      if (!allowEvent || controller.operationRevision !== revision ||
        presentElements.get(element) !== controller || !element.isConnected) return;
      if (!groupOperation && element !== group && (element.closest(groupSelector) !== group ||
        (groupState && (groups.get(group) !== groupState || groupState.revision !== groupRevision)))) return;
      if (!hasCapacity()) return false;
      controller.operationRevision++;
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
      const waitForPreparation = controller.motionEnabled && !reusePreparation;
      let previousSize = null;
      if (reusePreparation && (controller.measuredHeight || controller.measuredWidth)) {
        const computed = root.getComputedStyle(element);
        previousSize = {
          height: parseFloat(computed.maxHeight),
          width: parseFloat(computed.maxWidth)
        };
      }
      if (!forceRepop) {
        controller.stop({ replacement: reusePreparation, transitionStart: true });
      }
      controller.direction = newDirection;
      // Triggers announce the accepted action immediately, independently of
      // the panel's effective visibility at the end of the transition.
      controller.setTriggerExpanded(gotoVisible);
      // Neither channel animates backwards when the direction changes.
      setPhase(element, "pop", "0");
      setPhase(element, "unpop", "0");
      element.style.setProperty("--ae-pop-progress", "0");
      element.style.setProperty("--ae-unpop-progress", "0");
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
      openPresentElements.add(element);
      let size = null;
      if (controller.measuredHeight || controller.measuredWidth)
        size = await prepareMeasuredSize(
          element, controller, gotoVisible, previousSize, waitForPreparation
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

      transition.className = className[`${newDirection}${PING}`.toLowerCase()];
      const duration = root.getComputedStyle(element)
        .getPropertyValue(`--ae-${newDirection}-duration`.toLowerCase()).trim();
      const timeMs = getString2Time(duration);

      const activateTransition = () => {
        if (controller.transition !== transition) return;
        controller.classList.remove(
          className.pop,
          className.popping,
          className.unpopping
        );
        controller.classList.add(transition.className);
        // Clamp private CSS interpolation without adding an animation loop.
        // Stable states use literal endpoints to avoid stale computed-value
        // dependencies after Firefox releases a controlled custom-property effect.
        if (interpolatedProgress) {
          element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
          element.style.setProperty("--ae-unpop-progress", "clamp(0, var(--ae-present-unpop-phase), 1)");
        }
        setPhase(element, gotoVisible ? "pop" : "unpop", "1");
        if (size) {
          if (controller.measuredHeight) {
            element.style.setProperty("max-height", `${gotoVisible ? size.height : 0}px`, "important");
          }
          if (controller.measuredWidth) {
            element.style.setProperty("max-width", `${gotoVisible ? size.width : 0}px`, "important");
          }
        }
      };
      const advancedEase = root.getComputedStyle(element)
        .getPropertyValue(`--ae-${newDirection}-aellux-ease`.toLowerCase()).trim() || undefined;
      const motionOptions = {
        extension: extensionName,
        id: controller.motionId,
        apply: activateTransition,
        easing: advancedEase,
        nativeDuration: timeMs,
        maxFPS: AelluxJs.layoutMaxFPS ? AelluxJs.layoutMaxFPS(element) : undefined,
        abort: () => controller.transition !== transition || !element.isConnected
      };
      const completed = AelluxJs.motion
        ? AelluxJs.motion.run(element, motionOptions)
        : legacyMotionRun(motionOptions, transition);

      AelluxJs.dispatchFrom(element, "Layout", {
        detail: {
          origin: `present.${newDirection}`.toLowerCase(),
          durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
        },
        bubbles: true
      });
      if (controller.transition !== transition || !element.isConnected) return;
      const autoUnpopValue = gotoVisible && element.getAttribute(attr.autoUnpop);
      if (autoUnpopValue) {
        const duration = getString2Time(autoUnpopValue);
        if (Number.isFinite(duration) && duration >= 0) {
          emitAutoUnpopProgress(element, 0, duration);
        }
      }
      if (controller.transition !== transition || !element.isConnected) return;
      AelluxJs.dispatchFrom(element, `${newDirection}${PING}`, { bubbles: true });
      const motionResult = await Promise.race([completed, interrupted]);
      if (controller.transition !== transition ||
        (motionResult && motionResult.status !== "completed")) return;
      finishTransition(element, controller, transition, gotoVisible);

      if (gotoVisible && !element.hidden) {
        autoUnpopSchedule(element, controller);
        controller.classList.add(className.pop);
        AelluxJs.dispatchFrom(element, POP, { bubbles: true });
      }
      if (!gotoVisible && element.hidden) {
        AelluxJs.dispatchFrom(element, UNPOP, { bubbles: true });
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
      if (ownsTransition) restoreMeasuredStyles(element, controller);
      switch (error && error.code) {
        case AelluxJs.diagnostics.WARN_INTERRUPTION.code:
          // Replacement and teardown are expected lifecycle operations.
          // Unexpected interruption diagnostics still reach the reporter.
          if (transition && transition.cancelled) break;
          AelluxJs.diagnostics.warn(
            AelluxJs.diagnostics.WARN_INTERRUPTION,
            {
              cause: error,
              extension: extensionName,
              element,
              replacement: transition && transition.replacement === true
            }
          );
          break;
        default:
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION,
            { cause: error, extension: extensionName, element }
          );
          break;
      }
    } finally {
      if (transition && controller.transition === transition) {
        controller.transition = null;
        controller.classList.remove(className.willChange);
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
    controller.classList.toggle(className.pop, gotoVisible);
    controller.classList.remove(transition.className);
    restoreMeasuredStyles(element, controller);
    const focused = !gotoVisible && element.contains(document.activeElement)
      ? document.activeElement : null;
    element.hidden = gotoVisible ? false : true;
    setProgress(element, gotoVisible);
    syncAriaExpanded(element, controller);
    refreshExpandedStates();
    if (element.hidden) openPresentElements.delete(element);
    else openPresentElements.add(element);
    if (focused) {
      if (document.activeElement === focused) focused.blur();
      if (document.activeElement !== focused) AelluxJs.dispatch("UnpopFocusLost", {
        detail: { element, focused }
      });
    }
    transition.timeout = null;
  }

  function autoUnpopSchedule(element, controller) {
    if (!controller) return;
    cancelAutoUnpop(controller);
    const autoUnpopValue = element.getAttribute(attr.autoUnpop);
    if (element.hidden || (controller.transition && !controller.classList.contains(className.pop)) ||
      !element.isConnected || !autoUnpopValue) return;
    const duration = getString2Time(autoUnpopValue);
    if (!Number.isFinite(duration) || duration < 0) return;
    const countdown = { start: root.performance.now(), duration, frame: null, last: 0 };
    controller.autoCountdown = countdown;
    const valid = () => controller.autoCountdown === countdown &&
      presentElements.get(element) === controller && element.isConnected;
    const emit = (completed, initial = false) => {
      const elapsedMs = initial ? 0 : Math.min(duration, Math.max(0, root.performance.now() - countdown.start));
      emitAutoUnpopProgress(element, elapsedMs, duration, completed);
    };
    const tick = () => {
      if (!valid()) { if (controller.autoCountdown === countdown) cancelAutoUnpop(controller); return; }
      const now = root.performance.now();
      const fps = AelluxJs.layoutMaxFPS?.(element) || AelluxJs.options.cssMotionPropertyMaxFPS || 55;
      if (now - countdown.last >= 1000 / fps) {
        countdown.last = now;
        emit(false);
      }
      if (valid()) countdown.frame = root.requestAnimationFrame(tick);
    };
    // Install before dispatch: a consumer can synchronously cancel/restart.
    controller.autoUnpopTimeout = setTimeout(() => {
      if (!valid()) { if (controller.autoCountdown === countdown) cancelAutoUnpop(controller); return; }
      if (countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
      countdown.frame = null;
      controller.autoUnpopTimeout = null;
      emit(true);
      if (!valid()) return;
      controller.autoCountdown = null;
      unpop(element);
    }, duration);
    emit(false, true);
    if (valid()) countdown.frame = root.requestAnimationFrame(tick);
  }

  function emitAutoUnpopProgress(element, elapsedMs, duration, completed = false) {
    AelluxJs.dispatchFrom(element, "Progress", { bubbles: false, cancelable: false,
      detail: { value: completed ? 1 : duration ? elapsedMs / duration : 0, max: 1,
        status: completed ? "completed" : "running", elapsedMs,
        durationMs: duration, remainingMs: Math.max(0, duration - elapsedMs) } });
  }

  function cancelAutoUnpop(controller) {
    if (controller.autoUnpopTimeout !== null) clearTimeout(controller.autoUnpopTimeout);
    const countdown = controller.autoCountdown;
    if (countdown && countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
    controller.autoUnpopTimeout = null;
    controller.autoCountdown = null;
  }

  function outsideClickAutoUnpop(currentExceptions) {
    //unpop all not parenting except
    //or with proprerty explicit to keep open when click outside
    for (const pContainer of openPresentElements) {
      if (pContainer.hidden === true
        || pContainer.getAttribute(attr.unpopOnOutside) === "false"
        || currentExceptions.some((e) => pContainer.contains(e))) {
        continue;
      }
      unpop(pContainer);
    }
  }

  function refreshChangedTrigger(button) {
    if (!triggerElementsSet.has(button)) return;
    const value = button.getAttribute(attr.dismiss) || button.getAttribute(attr.target);
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
    const control = target.closest(`[${attr.trigger}],[${attr.dismiss}]`);
    if (control) refreshChangedTrigger(control);
    const pending = {
      event, target, hoverSuppressed: control && suppressHoverClick(control, event),
      present: triggerTargets.get(control),
      point: AelluxJs.mountManager.controller(target)?.point,
      timer: null
    };
    pendingTaps.add(pending);
    // Touch compatibility click can arrive in a later input task, after a 0 ms
    // timer. Keep a short grace period so that click owns the action.
    pending.timer = setTimeout(() => {
      pendingTaps.delete(pending);
      if (!target.isConnected ||
        (pending.point && AelluxJs.mountManager.controller(target)?.point !== pending.point)) return;
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
    const exceptions = [eventTarget];

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
          if (!(hoverSuppressed ?? suppressHoverClick(button, event))) trigger(target, triggerAttr);
        }
      } else if (container) {
        exceptions.push(container);
        if (!(hoverSuppressed ?? suppressHoverClick(button, event))) trigger(container, triggerAttr);
      } else {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
          { extension: extensionName, element: button, action: "trigger" }
        );
      }
    }
    button = eventTarget.closest(`[${attr.dismiss}]`);
    if (button) {
      refreshChangedTrigger(button);
      const dismiss = button.getAttribute(attr.dismiss);
      const targetSelector = button.getAttribute(attr.target);
      if (dismiss || targetSelector) {
        const target = targetById(dismiss || targetSelector);
        diagnoseTarget(button, target, dismiss ? attr.dismiss : attr.target, dismiss || targetSelector);
        if (target) {
          exceptions.push(target);
          unpop(target);
        }
      } else if (container) {
        exceptions.push(container);
        unpop(container);
      } else {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
          { extension: extensionName, element: button, action: "dismiss" }
        );
      }
    }

    outsideClickAutoUnpop(exceptions);
  }

  function diagnoseTarget(element, target, attribute, value) {
    // Invalid ID syntax already has its specific selector diagnostic (1107).
    if (!targetIdFor(value)) return;
    if (target && target.hasAttribute(attr.present)) return;
    AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_TARGET, {
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
    setPhase(element, "unpop", visible ? "0" : "1");
    element.style.setProperty("--ae-pop-progress", visible ? "1" : "0");
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
    if (!valid) AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
      extension: extensionName, element: group, attribute: attr.group, value,
      reason: "Present Group capacity must be a positive integer.",
      suggestion: "Use a positive integer, or leave the attribute empty for a capacity of 1."
    });
    return state.limit;
  }

  function groupMemberActive(member, state) {
    return state.reservations.has(member) ||
      (!member.hidden && presentElements.get(member)?.direction !== UNPOP);
  }

  function activeGroupMembers(group, state) {
    return groupMembers(group, true).filter(member => groupMemberActive(member, state));
  }

  function mountGroup(group) {
    if (groups.has(group)) return;
    const visible = groupMembers(group).filter(member => !member.hidden);
    groups.set(group, {
      selected: visible.length === 1 ? visible[0] : null,
      accumulating: false, reservations: new Map(),
      revision: 0, pending: Promise.resolve(true), jobs: new Map(),
      memory: AelluxJs.persist.element.save(group, [attr.active])
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
        member.hidden = !visible;
        controller.classList.toggle(className.pop, visible);
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
    AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_PRESENT_GROUP_SELECTION,
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
        const visible = members.filter(member => !member.hidden &&
          presentElements.get(member).direction !== UNPOP);
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
    const closed = inactive.filter(member => member.hidden);
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
      if (!valid(true) || !AelluxJs.dispatchFrom(member, "BeforePop", { bubbles: true, cancelable: true }) ||
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
    AelluxJs.dispatchFrom(group, "PresentGroupChange", { bubbles: true,
      detail: { group, previous, current, key: current && current.id } });
  }

  function selectGroup(group, selected, members) {
    const state = groups.get(group);
    const changes = members.filter(member => {
      const controller = presentElements.get(member);
      return member === selected ? member.hidden || controller.direction === UNPOP :
        !member.hidden && controller.direction !== UNPOP;
    });
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
      const allowed = AelluxJs.dispatchFrom(member, member === selected ? "BeforePop" : "BeforeUnpop",
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
      const job = presentTransition(member, member === selected, false, true);
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
          current.every(member => member === selected ? !member.hidden : member.hidden));
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
          else trigger(target, action);
        } else hoveredTriggers.delete(button);
      }
    }
    for (const target of openPresentElements) {
      if (!inHoverRegion(target, event.target)) continue;
      if (entering || inHoverRegion(target, event.relatedTarget)) cancelHoverClose(target);
      else if ([...triggerElementsSet].some(control =>
        triggerTargets.get(control) === target && control.getAttribute(attr.triggerOn) === "hover" &&
        control.getAttribute(attr.trigger) !== "unpop")) {
        cancelHoverClose(target);
        hoverTimers.set(target, setTimeout(() => {
          hoverTimers.delete(target);
          if (presentElements.has(target) && target.isConnected &&
            !inHoverRegion(target, document.activeElement)) unpop(target);
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
