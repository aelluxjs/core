/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "present";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  const attr = {
    present: AelluxJs.attr(extensionName),
    presentMotion: AelluxJs.attr("present-motion"),
    autoUnpop: AelluxJs.attr("auto-unpop"),
    unpopOnOutside: AelluxJs.attr("unpop-on-outside"),
    trigger: AelluxJs.attr("trigger"), //toggle,pop,unpop
    dismiss: AelluxJs.attr("dismiss"), //selector
    target: AelluxJs.attr("target"), //selector
  };
  const className = {
    pop: AelluxJs.className("pop"),
    popping: AelluxJs.className("popping"),
    unpopping: AelluxJs.className("unpopping"),
  };
  const mountMap = new Map();

  AelluxJs.extAttach(extensionName, {
    init, destroy, mountMap,
    pop, unpop, toggle, trigger
  });

  const presentElements = new Map();

  function init(options) {
    mountMap.set(`[${attr.present}]`, {
      mount: mountPresentContainer,
      unmount: unmountPresentContainer
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

  function mountPresentContainer(element) {
    const presentMotion =
      element.querySelector(`:scope>[${attr.presentMotion}]`)
      || element;
    if (presentMotion === element) {
      presentMotion.setAttribute(attr.presentMotion, "");
    } else {
      if (!element.hidden) {
        //Diagnostic present should be hidden not motion
        element.hidden = presentMotion.hidden;
      }
      presentMotion.hidden = false;
    }
    presentMotion.setAttribute(
      "aria-expanded",
      element.hidden ? "false" : "true"
    );
    const controller = {
      interruptTransition: null,
      direction: null,
      timeout: null,
      presentMotion,
      classList: presentMotion.classList,
      stop: function () {
        if (this.interruptTransition !== null
          && typeof this.interruptTransition === "function") {
          this.interruptTransition();
          this.interruptTransition = null;
        }
        if (this.timeout !== null) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
      }
    };
    if (!element.hidden) {
      controller.classList.add(className.pop);
    }
    presentElements.set(element, controller);
    autoUnpopSchedule(element, controller);
  }

  function unmountPresentContainer(element) {
    if (!presentElements.has(element)) return;
    const controller = presentElements.get(element);
    controller.stop();
    presentElements.delete(element);
  }

  function pop(element) { return presentTransition(element, true); }
  function unpop(element) { return presentTransition(element, false); }
  function toggle(element, gotoVisible) { return presentTransition(element, gotoVisible); }
  function trigger(element, trigger) {
    switch (trigger) {
      case "pop": return pop(element); break;
      case "unpop": return unpop(element); break;
      case "toggle": return toggle(element); break;
      default: return toggle(element); break;
    }
  }

  function presentTransition(element, gotoVisible) {
    const controller = presentElements.get(element);
    if (!controller) return;

    if (controller.direction === null)
      controller.direction = element.hidden ? "unpop" : "pop";
    if (typeof gotoVisible === "undefined" || gotoVisible === null)
      gotoVisible = (controller.direction === "pop") ? false : true;

    const newDirection = gotoVisible ? "pop" : "unpop";

    if ((element.hidden && !gotoVisible)
      || newDirection === controller.direction) { return; }

    controller.stop();
    controller.direction = newDirection;

    new Promise((completeTransition, interruptTransition) => {
      controller.interruptTransition = interruptTransition;

      const c = className[`${newDirection}ping`];
      const duration = root.getComputedStyle(controller.presentMotion)
        .getPropertyValue(`--ae-${newDirection}-duration`).trim();
      const time = getString2Time(duration);
      controller.classList.remove(...Object.values(className));
      AelluxJs.dispatchFrom(element, `${newDirection}ping`, { bubbles: true });
      element.hidden = false;

      controller.classList.add(c);
      controller.timeout = setTimeout(() => {
        controller.classList.remove(c);
        element.hidden = gotoVisible ? false : true;
        controller.interruptTransition = null;
        controller.timeout = null;
        completeTransition();
      }, time);
    }).then(() => {
      if (gotoVisible && !element.hidden) {
        autoUnpopSchedule(element, controller);
        controller.classList.add(className.pop);
        controller.presentMotion.setAttribute("aria-expanded", "true");
        AelluxJs.dispatchFrom(element, "Pop", { bubbles: true });
      }
      if (!gotoVisible && element.hidden) {
        controller.presentMotion.setAttribute("aria-expanded", "false");
        AelluxJs.dispatchFrom(element, "Unpop", { bubbles: true });
      }
    }).catch((interrupt) => {
      //Diagnostic transition interrupt
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
    //unpop all not parenting except
    //or with proprerty explicit to keep open when click outside
    for (const pContainer of presentElements.keys()) {
      if (pContainer.hidden === true
        || pContainer.getAttribute(attr.unpopOnOutside) === "false"
        || currentExceptions.some((e) => pContainer.contains(e))) {
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
        document
          .querySelectorAll(targetSelector)
          .forEach((element) => {
            exceptions.push(element);
            trigger(element, triggerAttr);
          });
      } else if (container) {
        exceptions.push(container);
        trigger(container, triggerAttr);
      } else {
        //ERROR
      }
    }
    button = event.target.closest(`[${attr.dismiss}]`);
    if (button) {
      const dismiss = button.getAttribute(attr.dismiss);
      const targetSelector = button.getAttribute(attr.target);
      if (dismiss || targetSelector) {
        document
          .querySelectorAll(dismiss || targetSelector)
          .forEach((element) => {
            exceptions.push(element);
            unpop(element);
          });
      } else if (container) {
        exceptions.push(container);
        unpop(container);
      } else {
        //ERROR
      }
    }

    outsideClickAutoUnpop(exceptions);
  }

  function getString2Time(string) {
    return string
      ? parseFloat(string) * getMillisecondsMulti(string)
      : 0
  }

  function getMillisecondsMulti(value) {
    return !value.endsWith("ms") && value.endsWith("s") ? 1000 : 1;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
