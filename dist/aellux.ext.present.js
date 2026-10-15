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
      autoUnpop: AelluxJs.attr("auto-unpop"),
      presentMotion: AelluxJs.attr("present-motion"),
      unpopOnOutside: AelluxJs.attr("unpop-on-outside"),
      trigger: AelluxJs.attr("trigger"),
      //toggle,pop,unpop
      dismiss: AelluxJs.attr("dismiss"),
      //target ID
      target: AelluxJs.attr("target"),
      //target ID
      lowHardware: AelluxJs.attr("low-hardware")
    };
    const className = {
      pop: AelluxJs.className("pop"),
      popping: AelluxJs.className("popping"),
      unpopping: AelluxJs.className("unpopping"),
      willChange: AelluxJs.className("will-change"),
      grid: AelluxJs.className("present-grid")
    };
    AelluxJs.extAttach(extensionName, {
      init,
      destroy,
      pop,
      unpop,
      toggle,
      trigger
    });
    const POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", TRANSITION_PREPARE_TIME = 100, ARIA_EXPANDED = "aria-expanded", ARIA_CONTROLS = "aria-controls", DEFAULT_PRESENT = "opacity transform height width";
    const presentElements = /* @__PURE__ */ new Map();
    const openPresentElements = /* @__PURE__ */ new Set();
    const triggerElementsSet = /* @__PURE__ */ new Set();
    const triggerTargets = /* @__PURE__ */ new Map();
    const triggersByTargetId = /* @__PURE__ */ new Map();
    const indexedTriggerValues = /* @__PURE__ */ new Map();
    function init(options) {
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${attr.present}]`,
        mount: mountPresentContainer,
        unmount: unmountPresentContainer,
        controllers: ["pop", "unpop", "trigger", "toggle"]
      });
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${[
          attr.trigger,
          attr.dismiss,
          attr.target
        ].join("],[")}]`,
        mount: mountTriggerElement,
        unmount: unmountTriggerElement
      });
      document.addEventListener("click", OnClick);
    }
    function destroy() {
      AelluxJs.mountManager.remove({ extensionName });
      document.removeEventListener("click", OnClick);
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
        measuredStyles: null,
        motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
        transition: null,
        autoUnpopTimeout: null,
        direction: null,
        classList: element.classList,
        triggers: /* @__PURE__ */ new Set(),
        setAriaExpanded: function(value) {
          element.setAttribute(ARIA_EXPANDED, value);
          this.triggers.forEach(updateTriggerAriaExpanded);
        },
        stop: function(options = {}) {
          const replacement = options.replacement === true;
          const transitionStart = options.transitionStart === true;
          const transition = this.transition;
          if (transition) {
            transition.replacement = replacement;
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
      presentController.setAriaExpanded(
        element.hidden ? "false" : "true"
      );
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
      autoUnpopSchedule(element, presentController);
    }
    function unmountPresentContainer(element) {
      if (!presentElements.has(element)) return;
      const controller = presentElements.get(element);
      controller.stop();
      element.classList.remove(className.grid);
      presentElements.delete(element);
      openPresentElements.delete(element);
      controller.triggers.forEach(updateTriggerAriaExpanded);
    }
    function mountTriggerElement(triggerElement) {
      if (triggerElementsSet.has(triggerElement)) return;
      triggerElementsSet.add(triggerElement);
      refreshTriggerTargets(triggerElement);
    }
    function unmountTriggerElement(triggerElement) {
      var _a;
      if (!triggerElementsSet.has(triggerElement)) return;
      const target = triggerTargets.get(triggerElement);
      if (target) {
        (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
        triggerTargets.delete(triggerElement);
      }
      unindexTriggerTarget(triggerElement);
      triggerElementsSet.delete(triggerElement);
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
          selector: value
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
      var _a, _b, _c, _d;
      const previousTarget = triggerTargets.get(triggerElement);
      const targetSelector = triggerElement.getAttribute(attr.target);
      const dismiss = triggerElement.getAttribute(attr.dismiss);
      indexTriggerTarget(triggerElement, dismiss || targetSelector);
      const container = triggerElement.closest(`[${attr.present}]`);
      if (previousTarget) {
        (_a = presentElements.get(previousTarget)) == null ? void 0 : _a.triggers.delete(triggerElement);
      }
      let target = null;
      if (dismiss || targetSelector) {
        target = targetById(dismiss || targetSelector);
      } else if (container && container.id) {
        target = container;
      }
      if (!target || !target.id) {
        triggerTargets.delete(triggerElement);
        return;
      }
      triggerTargets.set(triggerElement, target);
      (_b = presentElements.get(target)) == null ? void 0 : _b.triggers.add(triggerElement);
      const targetIds = /* @__PURE__ */ new Set([target.id]);
      const initial = (_d = (_c = AelluxJs.mountManager).initialAttribute) == null ? void 0 : _d.call(_c, triggerElement, ARIA_CONTROLS);
      if (initial) {
        initial.trim().split(/\s+/).forEach((x) => targetIds.add(x));
      }
      updateTriggerAriaExpanded(triggerElement);
      triggerElement.setAttribute(ARIA_CONTROLS, [...targetIds].join(" "));
    }
    function updateTriggerAriaExpanded(triggerElement) {
      const target = triggerTargets.get(triggerElement);
      if (!target) return;
      const expanded = presentElements.has(target) && target.getAttribute(ARIA_EXPANDED) === "true";
      triggerElement.setAttribute(ARIA_EXPANDED, String(expanded));
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
      const method = AelluxJs.ext.present[trigger2];
      return method && typeof method === "function" ? method(element) : toggle(element);
    }
    function restoreMeasuredStyles(element, controller) {
      const saved = controller.measuredStyles;
      if (!saved) return;
      for (const [name, value, priority] of saved) {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      }
      controller.measuredStyles = null;
    }
    async function prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation) {
      if (!controller.measuredHeight && !controller.measuredWidth) return null;
      if (!controller.measuredStyles) {
        controller.measuredStyles = ["max-height", "max-width"].map((name) => [
          name,
          element.style.getPropertyValue(name),
          element.style.getPropertyPriority(name)
        ]);
      }
      for (const [name, value, priority] of controller.measuredStyles) {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      }
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
        await AelluxJs.waitLayout.read(() => element.getBoundingClientRect());
      return size;
    }
    async function presentTransition(element, gotoVisible, forceRepop = false) {
      const controller = presentElements.get(element);
      if (!controller) return;
      if (controller.direction === null)
        controller.direction = element.hidden ? UNPOP : POP;
      if (typeof gotoVisible === "undefined" || gotoVisible === null)
        gotoVisible = controller.direction === POP ? false : true;
      const newDirection = gotoVisible ? POP : UNPOP;
      if (element.hidden && !gotoVisible || newDirection === controller.direction && !forceRepop) {
        return;
      }
      let transition = null;
      try {
        const allowEvent = AelluxJs.dispatchFrom(
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
          controller.setAriaExpanded("false");
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
          element.style.setProperty(
            `--ae-${newDirection}-low-steps`.toLowerCase(),
            Math.max(1, parseInt(timeMs / 62.5))
          );
          controller.classList.remove(
            className.pop,
            className.popping,
            className.unpopping
          );
          controller.classList.add(transition.className);
          if (size) {
            if (controller.measuredHeight) {
              element.style.setProperty("max-height", `${gotoVisible ? size.height : 0}px`, "important");
            }
            if (controller.measuredWidth) {
              element.style.setProperty("max-width", `${gotoVisible ? size.width : 0}px`, "important");
            }
          }
        };
        if (size && !waitForPreparation)
          await AelluxJs.waitLayout.update(activateTransition);
        else activateTransition();
        if (controller.transition !== transition) return;
        const completed = new Promise((completeTransition) => {
          transition.timeout = setTimeout(
            finishTransition,
            timeMs,
            element,
            controller,
            transition,
            gotoVisible,
            completeTransition
          );
        });
        AelluxJs.dispatchFrom(element, `${newDirection}${PING}`, { bubbles: true });
        await Promise.race([completed, interrupted]);
        if (gotoVisible && !element.hidden) {
          autoUnpopSchedule(element, controller);
          controller.classList.add(className.pop);
          controller.setAriaExpanded("true");
          AelluxJs.dispatchFrom(element, POP, { bubbles: true });
        }
        if (!gotoVisible && element.hidden) {
          controller.setAriaExpanded("false");
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
    function finishTransition(element, controller, transition, gotoVisible, completeTransition) {
      controller.classList.remove(transition.className);
      restoreMeasuredStyles(element, controller);
      const focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
      element.hidden = gotoVisible ? false : true;
      if (element.hidden) openPresentElements.delete(element);
      else openPresentElements.add(element);
      if (focused) {
        if (document.activeElement === focused) focused.blur();
        if (document.activeElement !== focused) AelluxJs.dispatch("UnpopFocusLost");
      }
      transition.timeout = null;
      completeTransition();
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
      const container = event.target.closest(`[${attr.present}]`);
      const exceptions = [event.target];
      var button;
      button = event.target.closest(`[${attr.trigger}]`);
      if (button) {
        refreshChangedTrigger(button);
        const triggerAttr = button.getAttribute(attr.trigger);
        const targetSelector = button.getAttribute(attr.target);
        if (targetSelector) {
          const target = targetById(targetSelector);
          if (target) {
            exceptions.push(target);
            trigger(target, triggerAttr);
          }
        } else if (container) {
          exceptions.push(container);
          trigger(container, triggerAttr);
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
    function getString2Time(string) {
      return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
    }
    function getMillisecondsMulti(value) {
      return !value.endsWith(MILLISECOND) && value.endsWith(SECOND) ? 1e3 : 1;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.present.js.map
