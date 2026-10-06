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
    const mountMap = /* @__PURE__ */ new Map();
    AelluxJs.extAttach(extensionName, {
      init,
      destroy,
      mountMap,
      pop,
      unpop,
      toggle,
      trigger
    });
    const presentElements = /* @__PURE__ */ new Map();
    function init(options) {
      mountMap.set(`[${attr.present}]`, {
        mount: mountElement,
        unmount: unmountElement
      });
      document.addEventListener("click", OnClick);
    }
    function destroy() {
      mountMap.clear();
      document.removeEventListener("click", OnClick);
      for (const controller of presentElements.values()) {
        controller.stop();
      }
      presentElements.clear();
    }
    function mountElement(element) {
      const controller = {
        interruptTransition: null,
        direction: null,
        timeout: null,
        stop: function() {
          if (this.interruptTransition !== null && typeof this.interruptTransition === "function") {
            this.interruptTransition();
            this.interruptTransition = null;
          }
          if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }
        }
      };
      presentElements.set(element, controller);
      autoUnpopSchedule(element, controller);
    }
    function unmountElement(element) {
      if (!presentElements.has(element)) return;
      const controller = presentElements.get(element);
      controller.stop();
      presentElements.delete(element);
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
    function pop(element) {
      return changeState(element, true);
    }
    function unpop(element) {
      return changeState(element, false);
    }
    function toggle(element, gotoVisible = void 0) {
      return changeState(element, gotoVisible);
    }
    function changeState(element, gotoVisible = void 0) {
      const controller = presentElements.get(element);
      if (!controller) return;
      if (controller.direction === null)
        controller.direction = element.hidden ? "unpop" : "pop";
      if (typeof gotoVisible === "undefined" || gotoVisible === null)
        gotoVisible = controller.direction === "pop" ? false : true;
      const newDirection = gotoVisible ? "pop" : "unpop";
      if (element.hidden && !gotoVisible || newDirection === controller.direction) {
        return;
      }
      controller.stop();
      controller.direction = newDirection;
      new Promise((completeTransition, interruptTransition) => {
        controller.interruptTransition = interruptTransition;
        const c = className[`${newDirection}ping`];
        const duration = root.getComputedStyle(element).getPropertyValue(`--ae-${newDirection}-duration`).trim();
        const time = getString2Time(duration);
        element.classList.remove(...Object.values(className));
        AelluxJs.dispatchFrom(element, `${newDirection}ping`);
        element.hidden = false;
        element.classList.add(c);
        controller.timeout = setTimeout(() => {
          element.classList.remove(c);
          element.hidden = gotoVisible ? false : true;
          controller.interruptTransition = null;
          controller.timeout = null;
          completeTransition();
        }, time);
      }).then(() => {
        if (gotoVisible && !element.hidden) {
          autoUnpopSchedule(element, controller);
          element.classList.add(className.pop);
          AelluxJs.dispatchFrom(element, "Pop");
        }
        if (!gotoVisible && element.hidden) {
          AelluxJs.dispatchFrom(element, "Unpop");
        }
      }).catch((interrupt) => {
      });
    }
    function autoUnpopSchedule(element, controller) {
      const autoUnpop = element.getAttribute(attr.autoUnpop);
      if (!element.hidden && autoUnpop) {
        const autoTime = getString2Time(autoUnpop);
        controller.timeout = setTimeout(() => {
          controller.timeout = null;
          unpop(element);
        }, autoTime);
      }
    }
    function outsideClickAutoUnpop(currentExceptions) {
      for (const container of presentElements.keys()) {
        if (container.hidden === true || container.getAttribute(attr.unpopOnOutside) === "false" || currentExceptions.some((e) => container.contains(e))) {
          continue;
        }
        unpop(container);
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
          document.querySelectorAll(targetSelector).forEach((element) => {
            exceptions.push(element);
            trigger(element, triggerAttr);
          });
        } else if (container) {
          exceptions.push(container);
          trigger(container, triggerAttr);
        } else {
        }
      }
      button = event.target.closest(`[${attr.dismiss}]`);
      if (button) {
        const dismiss = button.getAttribute(attr.dismiss);
        const targetSelector = button.getAttribute(attr.target);
        if (dismiss || targetSelector) {
          document.querySelectorAll(dismiss || targetSelector).forEach((element) => {
            exceptions.push(element);
            unpop(element);
          });
        } else if (container) {
          exceptions.push(container);
          unpop(container);
        } else {
        }
      }
      outsideClickAutoUnpop(exceptions);
    }
    function getString2Time(string) {
      return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
    }
    function getMillisecondsMulti(value) {
      return !value.endsWith("ms") && value.endsWith("s") ? 1e3 : 1;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.present.js.map
