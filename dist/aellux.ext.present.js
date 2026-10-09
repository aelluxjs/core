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
      //selector
      target: AelluxJs.attr("target")
      //selector
    };
    const className = {
      pop: AelluxJs.className("pop"),
      popping: AelluxJs.className("popping"),
      unpopping: AelluxJs.className("unpopping")
    };
    AelluxJs.extAttach(extensionName, {
      init,
      destroy,
      pop,
      unpop,
      toggle,
      trigger
    });
    const POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", ARIA_EXPANDED = "aria-expanded", ARIA_CONTROLS = "aria-controls";
    const presentElements = /* @__PURE__ */ new Map();
    const triggerElementsSet = /* @__PURE__ */ new Set();
    const triggerTargets = /* @__PURE__ */ new Map();
    const initialTriggerControls = /* @__PURE__ */ new WeakMap();
    const attrMemoryUsers = /* @__PURE__ */ new WeakMap();
    const initialAttributes = [
      "hidden",
      ARIA_EXPANDED,
      ARIA_CONTROLS,
      attr.presentMotion
    ];
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
      triggerTargets.clear();
    }
    function mountPresentContainer(element) {
      if (presentElements.has(element)) return;
      const presentMotion = element.querySelector(`:scope>[${attr.presentMotion}]`) || element;
      rememberAttributes(element);
      if (presentMotion !== element) rememberAttributes(presentMotion);
      if (presentMotion === element) {
        if (!presentMotion.hasAttribute(attr.presentMotion))
          presentMotion.setAttribute(attr.presentMotion, "auto");
      } else {
        if (presentMotion.hidden) {
          AelluxJs.diagnostics.warn(
            AelluxJs.diagnostics.WARN_PRESENT_MOTION_HIDDEN,
            { extension: extensionName, element, presentMotion }
          );
        }
        if (!element.hidden) {
          element.hidden = presentMotion.hidden;
        }
        presentMotion.hidden = false;
      }
      const presentController = {
        interruptTransition: null,
        direction: null,
        timeout: null,
        presentMotion,
        classList: presentMotion.classList,
        triggers: /* @__PURE__ */ new Set(),
        setAriaExpanded: function(value) {
          element.setAttribute(ARIA_EXPANDED, value);
          this.triggers.forEach(updateTriggerAriaExpanded);
        },
        stop: function() {
          this.classList.remove(...Object.values(className));
          if (this.interruptTransition !== null && typeof this.interruptTransition === "function") {
            this.interruptTransition(
              AelluxJs.diagnostics.create(
                AelluxJs.diagnostics.WARN_INTERRUPTION,
                { extensionName }
              )
            );
            this.interruptTransition = null;
          }
          if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }
        }
      };
      presentController.setAriaExpanded(
        element.hidden ? "false" : "true"
      );
      if (!element.hidden) {
        presentController.classList.add(className.pop);
      }
      presentElements.set(element, presentController);
      for (const triggerElement of triggerElementsSet) {
        refreshTriggerTargets(triggerElement);
      }
      for (const [triggerElement, targets] of triggerTargets) {
        if (targets.has(element)) {
          presentController.triggers.add(triggerElement);
          updateTriggerAriaExpanded(triggerElement);
        }
      }
      autoUnpopSchedule(element, presentController);
    }
    function unmountPresentContainer(element) {
      if (!presentElements.has(element)) return;
      const controller = presentElements.get(element);
      controller.stop();
      presentElements.delete(element);
      controller.triggers.forEach(updateTriggerAriaExpanded);
      if (controller.presentMotion !== element)
        restoreAttributes(controller.presentMotion);
      restoreAttributes(element);
    }
    function mountTriggerElement(triggerElement) {
      if (triggerElementsSet.has(triggerElement)) return;
      initialTriggerControls.set(triggerElement, triggerElement.getAttribute(ARIA_CONTROLS));
      rememberAttributes(triggerElement);
      triggerElementsSet.add(triggerElement);
      refreshTriggerTargets(triggerElement);
    }
    function unmountTriggerElement(triggerElement) {
      var _a;
      if (!triggerElementsSet.has(triggerElement)) return;
      const targets = triggerTargets.get(triggerElement);
      if (targets) {
        for (const target of targets) {
          (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
        }
        triggerTargets.delete(triggerElement);
      }
      triggerElementsSet.delete(triggerElement);
      restoreAttributes(triggerElement);
      initialTriggerControls.delete(triggerElement);
    }
    function refreshTriggerTargets(triggerElement) {
      var _a;
      const targetIds = /* @__PURE__ */ new Set();
      const previousTargets = triggerTargets.get(triggerElement);
      const targets = /* @__PURE__ */ new Set();
      const targetSelector = triggerElement.getAttribute(attr.target);
      const dismiss = triggerElement.getAttribute(attr.dismiss);
      const container = triggerElement.closest(`[${attr.present}]`);
      if (previousTargets) {
        for (const target of previousTargets) {
          (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
        }
      }
      if (dismiss || targetSelector) {
        iterateSelector(
          document,
          dismiss || targetSelector,
          (present) => {
            if (!present.id) {
              return;
            }
            targetIds.add(present.id);
            targets.add(present);
            const controller = presentElements.get(present);
            if (controller) {
              controller.triggers.add(triggerElement);
            }
          }
        );
      } else if (container && container.id) {
        targetIds.add(container.id);
        targets.add(container);
        const controller = presentElements.get(container);
        if (controller) {
          controller.triggers.add(triggerElement);
        }
      }
      if (targets.size === 0) {
        triggerTargets.delete(triggerElement);
        return;
      }
      triggerTargets.set(triggerElement, targets);
      const initial = initialTriggerControls.get(triggerElement);
      if (initial) {
        initial.trim().split(/\s+/).forEach((x) => targetIds.add(x));
      }
      updateTriggerAriaExpanded(triggerElement);
      triggerElement.setAttribute(ARIA_CONTROLS, [...targetIds].join(" "));
    }
    function updateTriggerAriaExpanded(triggerElement) {
      const targets = triggerTargets.get(triggerElement);
      if (!targets) return;
      const expanded = [...targets].some((target) => {
        const controller = presentElements.get(target);
        return controller && target.getAttribute(ARIA_EXPANDED) === "true";
      });
      triggerElement.setAttribute(ARIA_EXPANDED, String(expanded));
    }
    function pop(element) {
      return presentTransition(element, true);
    }
    function unpop(element) {
      return presentTransition(element, false);
    }
    function toggle(element, goto) {
      return presentTransition(element, goto);
    }
    function trigger(element, trigger2) {
      switch (trigger2) {
        case "pop":
          return pop(element);
          break;
        case "unpop":
          return unpop(element);
          break;
        case "toggle":
          return toggle(element);
          break;
        default:
          return toggle(element);
          break;
      }
    }
    function presentTransition(element, gotoVisible) {
      const controller = presentElements.get(element);
      if (!controller) return;
      if (controller.direction === null)
        controller.direction = element.hidden ? UNPOP : POP;
      if (typeof gotoVisible === "undefined" || gotoVisible === null)
        gotoVisible = controller.direction === POP ? false : true;
      const newDirection = gotoVisible ? POP : UNPOP;
      if (element.hidden && !gotoVisible || newDirection === controller.direction) {
        return;
      }
      const allowEvent = AelluxJs.dispatchFrom(
        element,
        `${BEFORE}${newDirection}`,
        { bubbles: true, cancelable: true }
      );
      if (!allowEvent) {
        return;
      }
      controller.stop();
      controller.direction = newDirection;
      new Promise((completeTransition, interruptTransition) => {
        controller.interruptTransition = interruptTransition;
        const c = className[`${newDirection}${PING}`.toLowerCase()];
        const duration = root.getComputedStyle(controller.presentMotion).getPropertyValue(`--ae-${newDirection}-duration`.toLowerCase()).trim();
        const time = getString2Time(duration);
        controller.classList.add(c);
        element.hidden = false;
        controller.timeout = setTimeout(
          finishTransition,
          time,
          element,
          controller,
          c,
          gotoVisible,
          completeTransition
        );
        AelluxJs.dispatchFrom(element, `${newDirection}${PING}`, { bubbles: true });
      }).then(() => {
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
      }).catch((error) => {
        switch (error && error.code) {
          case AelluxJs.diagnostics.WARN_INTERRUPTION.code:
            AelluxJs.diagnostics.warn(
              AelluxJs.diagnostics.WARN_INTERRUPTION,
              { cause: error, extension: extensionName, element }
            );
            break;
          default:
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION,
              { cause: error, extension: extensionName, element }
            );
            break;
        }
      });
    }
    function finishTransition(element, controller, c, gotoVisible, completeTransition) {
      controller.classList.remove(c);
      element.hidden = gotoVisible ? false : true;
      controller.interruptTransition = null;
      controller.timeout = null;
      completeTransition();
    }
    function autoUnpopSchedule(element, controller) {
      const autoUnpopValue = element.getAttribute(attr.autoUnpop);
      if (!element.hidden && autoUnpopValue) {
        const autoTime = getString2Time(autoUnpopValue);
        controller.timeout = setTimeout(
          autoUnpop,
          autoTime,
          element,
          controller
        );
      }
    }
    function autoUnpop(element, controller) {
      controller.timeout = null;
      unpop(element);
    }
    function outsideClickAutoUnpop(currentExceptions) {
      for (const pContainer of presentElements.keys()) {
        if (pContainer.hidden === true || pContainer.getAttribute(attr.unpopOnOutside) === "false" || currentExceptions.some((e) => pContainer.contains(e))) {
          continue;
        }
        unpop(pContainer);
      }
    }
    function OnClick(event) {
      if (!event.target) return;
      const container = event.target.closest(`[${attr.present}]`);
      const exceptions = [event.target];
      var button;
      button = event.target.closest(`[${attr.trigger}]`);
      if (button) {
        const triggerAttr = button.getAttribute(attr.trigger);
        const targetSelector = button.getAttribute(attr.target);
        if (targetSelector) {
          iterateSelector(
            document,
            targetSelector,
            (element) => {
              exceptions.push(element);
              trigger(element, triggerAttr);
            }
          );
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
        const dismiss = button.getAttribute(attr.dismiss);
        const targetSelector = button.getAttribute(attr.target);
        if (dismiss || targetSelector) {
          iterateSelector(
            document,
            dismiss || targetSelector,
            (element) => {
              exceptions.push(element);
              unpop(element);
            }
          );
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
    function iterateSelector(element, selector, callback) {
      try {
        element.querySelectorAll(selector).forEach((element2) => {
          try {
            callback(element2);
          } catch (error) {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_CALLBACK,
              { cause: error, extension: extensionName, selector }
            );
          }
        });
      } catch (error) {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_SELECTOR,
          { cause: error, extension: extensionName, selector }
        );
      }
    }
    function rememberAttributes(element) {
      const users = attrMemoryUsers.get(element) || 0;
      if (users === 0) AelluxJs.attrMem.save(element, initialAttributes);
      attrMemoryUsers.set(element, users + 1);
    }
    function restoreAttributes(element) {
      const users = attrMemoryUsers.get(element);
      if (!users) return;
      if (users > 1) {
        attrMemoryUsers.set(element, users - 1);
        return;
      }
      attrMemoryUsers.delete(element);
      AelluxJs.attrMem.restore(element);
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
