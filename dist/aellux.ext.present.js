(() => {
  // src/aellux.ext.present.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
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
      trigger: AelluxJs.attr("trigger"),
      //toggle,pop,unpop
      dismiss: AelluxJs.attr("dismiss"),
      //target ID
      target: AelluxJs.attr("target")
      //target ID
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
      init,
      destroy,
      pop,
      unpop,
      toggle,
      trigger,
      show,
      selected
    });
    const POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", DEFAULT_PRESENT = "opacity transform height width", OPACITY_SYNTAX = "<number> | <percentage>", TRANSFORM_SYNTAX = "<transform-list> | none";
    const TRANSITION_PREPARE_TIME = 100;
    const presentElements = /* @__PURE__ */ new Map();
    const openPresentElements = /* @__PURE__ */ new Set();
    let fallbackMotionId = 5e6;
    const triggerElementsSet = /* @__PURE__ */ new Set();
    const triggerTargets = /* @__PURE__ */ new Map();
    const triggersByTargetId = /* @__PURE__ */ new Map();
    const indexedTriggerValues = /* @__PURE__ */ new Map();
    const elementMemories = /* @__PURE__ */ new WeakMap();
    const containerAriaHandlers = /* @__PURE__ */ new WeakMap();
    const triggerAriaHandlers = /* @__PURE__ */ new WeakMap();
    const measuredMemories = /* @__PURE__ */ new WeakMap();
    const groups = /* @__PURE__ */ new Map();
    const hoverTimers = /* @__PURE__ */ new Map();
    const hoveredTriggers = /* @__PURE__ */ new Set();
    let groupObserver = null;
    let groupsQueued = false;
    let interpolatedProgress = false;
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
      ["from-height", "*", "0fr"],
      ["pop-height", "*", "1fr"],
      ["unpop-height", "*", "0fr"],
      ["from-width", "*", "0fr"],
      ["pop-width", "*", "1fr"],
      ["unpop-width", "*", "0fr"],
      ["pop-ease", "*", "ease-out"],
      ["unpop-ease", "*", "ease-in"],
      ["pop-duration", "<time>", "250ms"],
      ["unpop-duration", "<time>", "250ms"]
    ];
    function init(options) {
      const descriptors = cssProperties.map(([name, syntax, initialValue]) => ({ name: `--ae-${name}`, syntax, initialValue }));
      const progressRegistered = AelluxJs.registerCssProperty(...descriptors.slice(0, 4));
      interpolatedProgress = !!(progressRegistered && root.CSS.supports && root.CSS.supports("opacity", "clamp(0, 0.5, 1)"));
      AelluxJs.registerCssProperty(...descriptors.slice(4));
      AelluxJs.mountManager.add({
        extensionName,
        selector: presentSelector,
        priority: 0,
        mount: mountPresentContainer,
        unmount: unmountPresentContainer,
        controllers: ["pop", "unpop", "trigger", "toggle"]
      });
      AelluxJs.mountManager.add({
        extensionName,
        priority: 0,
        selector: `[${[
          attr.trigger,
          attr.dismiss,
          attr.target
        ].join("],[")}]`,
        mount: mountTriggerElement,
        unmount: unmountTriggerElement
      });
      AelluxJs.mountManager.add({
        extensionName,
        selector: groupSelector,
        priority: 1,
        mount: mountGroup,
        unmount: unmountGroup,
        controllers: ["show", "selected"]
      });
      document.addEventListener("pointerover", onHover);
      document.addEventListener("pointerout", onHover);
      AelluxJs.on("$click", OnClick);
      AelluxJs.onEvent(root, "$resize", refreshExpandedStates);
    }
    function destroy() {
      AelluxJs.mountManager.remove({ extensionName });
      AelluxJs.off("$click", OnClick);
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
        [
          "--ae-pop-progress",
          "--ae-unpop-progress",
          "--ae-present-pop-phase",
          "--ae-present-unpop-phase"
        ]
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
        autoUnpopTimeout: null,
        direction: null,
        classList: element.classList,
        triggers: /* @__PURE__ */ new Set(),
        setAriaExpanded: function(value) {
          this.expanded = value === "true";
          containerAriaHandlers.get(element).set({ expanded: this.expanded });
          this.triggers.forEach(updateTriggerAriaExpanded);
        },
        stop: function(options = {}) {
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
          if (this.autoUnpopTimeout !== null) {
            clearTimeout(this.autoUnpopTimeout);
            this.autoUnpopTimeout = null;
          }
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
      var _a, _b, _c;
      if (!presentElements.has(element)) return;
      const controller = presentElements.get(element);
      cancelHoverClose(element);
      for (const button of controller.triggers) hoveredTriggers.delete(button);
      controller.stop();
      (_a = AelluxJs.waitLayout) == null ? void 0 : _a.cancel(controller.motionId);
      element.classList.remove(className.grid);
      presentElements.delete(element);
      openPresentElements.delete(element);
      (_b = containerAriaHandlers.get(element)) == null ? void 0 : _b.release();
      containerAriaHandlers.delete(element);
      (_c = elementMemories.get(element)) == null ? void 0 : _c.restore();
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
      var _a, _b;
      if (!triggerElementsSet.has(triggerElement)) return;
      hoveredTriggers.delete(triggerElement);
      const target = triggerTargets.get(triggerElement);
      if (target) {
        cancelHoverClose(target);
        (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
        triggerTargets.delete(triggerElement);
      }
      unindexTriggerTarget(triggerElement);
      triggerElementsSet.delete(triggerElement);
      (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.release();
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
          triggers = /* @__PURE__ */ new Set();
          triggersByTargetId.set(id, triggers);
        }
        triggers.add(triggerElement);
      }
    }
    function refreshTriggerTargets(triggerElement) {
      var _a, _b, _c, _d, _e;
      const previousTarget = triggerTargets.get(triggerElement);
      const targetSelector = triggerElement.getAttribute(attr.target);
      const dismiss = triggerElement.getAttribute(attr.dismiss);
      indexTriggerTarget(triggerElement, dismiss || targetSelector);
      const container = triggerElement.closest(presentSelector);
      if (previousTarget) {
        (_a = presentElements.get(previousTarget)) == null ? void 0 : _a.triggers.delete(triggerElement);
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
        (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.unset("expanded");
        (_c = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _c.unset("controls");
        return;
      }
      triggerTargets.set(triggerElement, target);
      (_d = presentElements.get(target)) == null ? void 0 : _d.triggers.add(triggerElement);
      const targetIds = /* @__PURE__ */ new Set([target.id]);
      const initial = (_e = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _e.initial("controls");
      if (initial) {
        initial.trim().split(/\s+/).forEach((x) => targetIds.add(x));
      }
      updateTriggerAriaExpanded(triggerElement);
      triggerAriaHandlers.get(triggerElement).set({ controls: [...targetIds] });
    }
    function updateTriggerAriaExpanded(triggerElement) {
      var _a, _b;
      const target = triggerTargets.get(triggerElement);
      if (!target) return;
      const expanded = ((_a = presentElements.get(target)) == null ? void 0 : _a.expanded) === true;
      (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.set({ expanded });
    }
    function pop(element) {
      return presentTransition(element, true, true);
    }
    function unpop(element) {
      return presentTransition(element, false);
    }
    function toggle(element, goto) {
      return presentTransition(element, goto);
    }
    function trigger(element, trigger2) {
      trigger2 = typeof trigger2 === "string" ? (trigger2 || "toggle").toLowerCase() : "toggle";
      if (!["pop", "unpop", "toggle"].includes(trigger2)) AelluxJs.diagnostics.warn(
        AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE,
        {
          extension: extensionName,
          element,
          attribute: attr.trigger,
          value: trigger2,
          reason: "Unknown Present action; using toggle.",
          suggestion: "Use pop, unpop, or toggle."
        }
      );
      const method = trigger2 === "pop" ? pop : trigger2 === "unpop" ? unpop : toggle;
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
          element,
          [],
          ["max-height", "max-width"]
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
      const start = previousSize || (gotoVisible ? { height: 0, width: 0 } : size);
      if (controller.measuredHeight) {
        element.style.setProperty("max-height", `${Math.max(0, start.height)}px`, "important");
      }
      if (controller.measuredWidth) {
        element.style.setProperty("max-width", `${Math.max(0, start.width)}px`, "important");
      }
      if (!waitForPreparation)
        await AelluxJs.waitLayout.read(
          controller.motionId,
          () => element.getBoundingClientRect()
        );
      return size;
    }
    async function presentTransition(element, gotoVisible, forceRepop = false, groupOperation = false) {
      const controller = presentElements.get(element);
      if (!controller) return;
      if (controller.direction === null)
        controller.direction = element.hidden ? UNPOP : POP;
      if (typeof gotoVisible === "undefined" || gotoVisible === null)
        gotoVisible = controller.direction === POP ? false : true;
      const group = element.closest(groupSelector);
      if (!groupOperation && groups.has(group) && element !== group) {
        if (!element.id) {
          groupDiagnostic(group, "Present Group members must have an ID.");
          return false;
        }
        if (gotoVisible) return show(group, element.id);
        if (groups.get(group).selected === element) return show(group, "");
      }
      const newDirection = gotoVisible ? POP : UNPOP;
      if (element.hidden && !gotoVisible || newDirection === controller.direction && !forceRepop) {
        if (!controller.transition) syncAriaExpanded(element, controller);
        return;
      }
      let transition = null;
      try {
        const allowEvent = groupOperation || AelluxJs.dispatchFrom(
          element,
          `${BEFORE}${newDirection}`,
          { bubbles: true, cancelable: true }
        );
        if (!allowEvent) {
          return;
        }
        if (forceRepop && (!element.hidden || controller.transition)) {
          controller.stop();
          element.hidden = true;
          openPresentElements.delete(element);
          syncAriaExpanded(element, controller);
          element.getBoundingClientRect();
        }
        const reusePreparation = !forceRepop && controller.motionEnabled && controller.transition !== null && controller.classList.contains(className.willChange);
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
        interrupted.catch(() => {
        });
        element.hidden = false;
        openPresentElements.add(element);
        let size = null;
        if (controller.measuredHeight || controller.measuredWidth)
          size = await prepareMeasuredSize(
            element,
            controller,
            gotoVisible,
            previousSize,
            waitForPreparation
          );
        if (controller.transition !== transition) return;
        if (controller.motionEnabled) {
          controller.classList.add(className.willChange);
        }
        if (waitForPreparation) {
          const prepared = new Promise((resolve) => {
            transition.timeout = setTimeout(() => {
              transition.timeout = null;
              resolve();
            }, TRANSITION_PREPARE_TIME);
          });
          await Promise.race([prepared, interrupted]);
        }
        transition.className = className[`${newDirection}${PING}`.toLowerCase()];
        const duration = root.getComputedStyle(element).getPropertyValue(`--ae-${newDirection}-duration`.toLowerCase()).trim();
        const timeMs = getString2Time(duration);
        const activateTransition = () => {
          if (controller.transition !== transition) return;
          controller.classList.remove(
            className.pop,
            className.popping,
            className.unpopping
          );
          controller.classList.add(transition.className);
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
        const advancedEase = root.getComputedStyle(element).getPropertyValue(`--ae-${newDirection}-aellux-ease`.toLowerCase()).trim() || void 0;
        const motionOptions = {
          extension: extensionName,
          id: controller.motionId,
          apply: activateTransition,
          easing: advancedEase,
          nativeDuration: timeMs,
          maxFPS: AelluxJs.layoutMaxFPS ? AelluxJs.layoutMaxFPS(element) : void 0,
          abort: () => controller.transition !== transition || !element.isConnected
        };
        const completed = AelluxJs.motion ? AelluxJs.motion.run(element, motionOptions) : legacyMotionRun(motionOptions, transition);
        AelluxJs.dispatchFrom(element, "Layout", {
          detail: {
            origin: `present.${newDirection}`.toLowerCase(),
            durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
          },
          bubbles: true
        });
        AelluxJs.dispatchFrom(element, `${newDirection}${PING}`, { bubbles: true });
        const motionResult = await Promise.race([completed, interrupted]);
        if (controller.transition !== transition || motionResult && motionResult.status !== "completed") return;
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
      return new Promise((resolve) => {
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
      const focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
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
      const autoUnpopValue = element.getAttribute(attr.autoUnpop);
      if (!element.hidden && autoUnpopValue) {
        const autoTime = getString2Time(autoUnpopValue);
        controller.autoUnpopTimeout = setTimeout(
          autoUnpop,
          autoTime,
          element,
          controller
        );
      }
    }
    function autoUnpop(element, controller) {
      controller.autoUnpopTimeout = null;
      unpop(element);
    }
    function outsideClickAutoUnpop(currentExceptions) {
      for (const pContainer of openPresentElements) {
        if (pContainer.hidden === true || pContainer.getAttribute(attr.unpopOnOutside) === "false" || currentExceptions.some((e) => pContainer.contains(e))) {
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
      if (!event.target) return;
      const container = event.target.closest(presentSelector);
      const exceptions = [event.target];
      var button;
      button = event.target.closest(`[${attr.trigger}]`);
      if (button) {
        refreshChangedTrigger(button);
        const triggerAttr = button.getAttribute(attr.trigger);
        const targetSelector = button.getAttribute(attr.target);
        if (targetSelector) {
          const target = targetById(targetSelector);
          diagnoseTarget(button, target, attr.target, targetSelector);
          if (target) {
            exceptions.push(target);
            if (!suppressHoverClick(button, event)) trigger(target, triggerAttr);
          }
        } else if (container) {
          exceptions.push(container);
          if (!suppressHoverClick(button, event)) trigger(container, triggerAttr);
        } else {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
            { extension: extensionName, element: button, action: "trigger" }
          );
        }
      }
      button = event.target.closest(`[${attr.dismiss}]`);
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
      if (!targetIdFor(value)) return;
      if (target && target.hasAttribute(attr.present)) return;
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_TARGET, {
        extension: extensionName,
        element,
        attribute,
        value,
        reason: target ? "Target is not a Present container." : "Target element was not found.",
        suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
      });
    }
    function syncAriaExpanded(element, controller) {
      let visible = element.isConnected;
      const visibility = root.getComputedStyle(element).visibility;
      if (visibility === "hidden" || visibility === "collapse") visible = false;
      for (let current = element; visible && current; current = current.parentElement) {
        const style = root.getComputedStyle(current);
        if (style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) visible = false;
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
    function groupMembers(group) {
      return [...presentElements.keys()].filter((element) => element.isConnected && element !== group && element.id && element.closest(groupSelector) === group);
    }
    function mountGroup(group) {
      if (groups.has(group)) return;
      const visible = groupMembers(group).filter((member) => !member.hidden);
      groups.set(group, {
        selected: visible.length === 1 ? visible[0] : null,
        revision: 0,
        pending: Promise.resolve(true),
        jobs: /* @__PURE__ */ new Map(),
        memory: AelluxJs.persist.element.save(group, [attr.active])
      });
      if (!groupObserver && typeof root.MutationObserver === "function") {
        groupObserver = new root.MutationObserver((records) => {
          if (records.some((record) => record.type === "childList" || record.attributeName !== "class" || groups.has(record.target))) queueGroups();
        });
        groupObserver.observe(document, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["class", "id", attr.active, attr.when, attr.group]
        });
      }
      queueGroups();
    }
    function unmountGroup(group) {
      const state = groups.get(group);
      if (!state) return;
      state.revision++;
      groups.delete(group);
      state.jobs.clear();
      publishGroup(group, state, null);
      for (const member of groupMembers(group)) {
        const controller = presentElements.get(member);
        if (controller.transition) {
          const visible = controller.direction === POP;
          controller.stop();
          member.hidden = !visible;
          controller.classList.toggle(className.pop, visible);
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
      AelluxJs.diagnostics.warn(
        AelluxJs.diagnostics.WARN_PRESENT_GROUP_SELECTION,
        {
          extension: extensionName,
          element: group,
          attribute: attr.active,
          value: group.getAttribute(attr.active),
          reason,
          suggestion: "Use unique native IDs on Present members of this group; select one ID or one matching condition."
        }
      );
    }
    function reconcileGroup(group) {
      if (!group.isConnected || !group.hasAttribute(attr.group)) return;
      const members = groupMembers(group);
      const state = groups.get(group);
      if (!members.includes(state.selected)) state.selected = null;
      let matches;
      if (group.hasAttribute(attr.active)) {
        const id = group.getAttribute(attr.active);
        matches = id === "" ? [] : members.filter((member) => member.id === id);
        if (id && matches.length !== 1) {
          groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
          return;
        }
      } else {
        matches = members.filter((member) => {
          const token = member.getAttribute(attr.when);
          return token && !/\s/.test(token) && group.classList.contains(token);
        });
        if (!matches.length) {
          const visible = members.filter((member) => !member.hidden && presentElements.get(member).direction !== UNPOP);
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
      const matches = groupMembers(group).filter((member) => member.id === id);
      if (id && matches.length !== 1) {
        groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
        return Promise.resolve(false);
      }
      if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
      const result = reconcileGroup(group);
      return Promise.resolve(result === void 0 ? state.pending : result);
    }
    function selected(group) {
      const state = groups.get(group);
      const member = state && state.selected;
      return member && member !== group && presentElements.has(member) && member.isConnected && member.id && member.closest(groupSelector) === group ? member : null;
    }
    function publishGroup(group, state, current) {
      if (state.announced === current) return;
      const previous = state.announced || null;
      state.announced = current;
      AelluxJs.dispatchFrom(group, "PresentGroupChange", {
        bubbles: true,
        detail: { group, previous, current, key: current && current.id }
      });
    }
    function selectGroup(group, selected2, members) {
      var _a;
      const state = groups.get(group);
      const changes = members.filter((member) => {
        const controller = presentElements.get(member);
        return member === selected2 ? member.hidden || controller.direction === UNPOP : !member.hidden && controller.direction !== UNPOP;
      });
      if (state.selected === selected2 && !changes.length) return state.pending;
      const revision = ++state.revision;
      const active = group.getAttribute(attr.active);
      const classes = group.getAttribute("class");
      const ids = members.map((member) => member.id);
      const conditions = members.map((member) => member.getAttribute(attr.when));
      const valid = () => groups.get(group) === state && state.revision === revision && group.isConnected && group.hasAttribute(attr.group) && group.getAttribute(attr.active) === active && group.getAttribute("class") === classes && groupMembers(group).length === members.length && members.every((member, index) => presentElements.has(member) && member.isConnected && member.closest(groupSelector) === group && member.id === ids[index] && member.getAttribute(attr.when) === conditions[index]);
      for (const member of changes) {
        const allowed = AelluxJs.dispatchFrom(
          member,
          member === selected2 ? "BeforePop" : "BeforeUnpop",
          { bubbles: true, cancelable: true }
        );
        if (!valid()) {
          queueGroups();
          return false;
        }
        if (!allowed) {
          if (state.revision === revision) {
            const id = ((_a = state.selected) == null ? void 0 : _a.id) || "";
            if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
          }
          return false;
        }
      }
      state.selected = selected2;
      let complete;
      const pending = new Promise((resolve) => {
        complete = resolve;
      });
      state.pending = pending;
      for (const member of changes) {
        const job = presentTransition(member, member === selected2, false, true);
        if (groups.get(group) !== state || state.revision !== revision) {
          complete(false);
          return pending;
        }
        state.jobs.set(member, job);
        job.then(() => {
          if (state.jobs.get(member) === job) state.jobs.delete(member);
        });
      }
      publishGroup(group, state, selected2);
      Promise.all(members.map((member) => state.jobs.get(member))).then(() => {
        const current = groupMembers(group);
        complete(groups.get(group) === state && state.revision === revision && (!selected2 || current.includes(selected2)) && current.every((member) => member === selected2 ? !member.hidden : member.hidden));
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
        if (button.getAttribute(attr.triggerOn) === "hover" && triggerTargets.get(button) === target && button.contains(node)) return true;
      }
      return false;
    }
    function suppressHoverClick(button, event) {
      return button.getAttribute(attr.triggerOn) === "hover" && event.detail > 0 && event.pointerType !== "touch" && hoveredTriggers.has(button);
    }
    function onHover(event) {
      var _a;
      if (event.pointerType === "touch" || !((_a = event.target) == null ? void 0 : _a.closest)) return;
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
        else if ([...triggerElementsSet].some((control) => triggerTargets.get(control) === target && control.getAttribute(attr.triggerOn) === "hover" && control.getAttribute(attr.trigger) !== "unpop")) {
          cancelHoverClose(target);
          hoverTimers.set(target, setTimeout(() => {
            hoverTimers.delete(target);
            if (presentElements.has(target) && target.isConnected && !inHoverRegion(target, document.activeElement)) unpop(target);
          }, 120));
        }
      }
    }
    function getString2Time(string) {
      return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
    }
    function getMillisecondsMulti(value) {
      return !value.endsWith(MILLISECOND) && value.endsWith(SECOND) ? 1e3 : 1;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.present.js.map
