(() => {
  // src/aellux.ext.feedback.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "feedback";
    if (!AelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    AelluxJs.extAttach(extensionName, {
      init,
      destroy,
      warning,
      error,
      success,
      announce,
      busy,
      validate,
      progress,
      on,
      off,
      send
    });
    const motionOptions = ["shake", "yes", "no", "breathe", "tremble", "pulse", "alert"];
    const feedbackTypes = ["warning", "error", "success", "announce", "busy", "progress", "validate"];
    const handlers = /* @__PURE__ */ new Map();
    const feedbackAttribute = AelluxJs.attr(extensionName);
    const messageTargetAttribute = AelluxJs.attr("feedback-message-target");
    const effectTargetAttribute = AelluxJs.attr("feedback-effect-target");
    const presentTargetAttribute = AelluxJs.attr("presentTarget");
    const presentSelector = `[${AelluxJs.attr("present")}]`;
    const mountedFeedback = /* @__PURE__ */ new Map();
    const applications = /* @__PURE__ */ new WeakMap();
    function init() {
      AelluxJs.comm.handle("feedback.prepare", (request) => {
        const { boundary, feedback, element } = request;
        if (!mountedFeedback.has(boundary) || !boundary.isConnected || !feedback || typeof feedback !== "object") return false;
        applications.set(feedback, applyFeedback(boundary, feedback, element, false));
        return true;
      }, { owner: extensionName });
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${feedbackAttribute}]`,
        priority: 0,
        mount: mountFeedback,
        unmount: unmountFeedback,
        controllers: feedbackTypes.concat("send")
      });
    }
    async function destroy() {
      AelluxJs.comm.removeOwner(extensionName);
      mountedFeedback.clear();
      AelluxJs.mountManager.remove({ extensionName });
      handlers.clear();
    }
    function mountFeedback(element) {
      mountedFeedback.set(element, {});
      AelluxJs.onEvent(element, "Feedback", onFeedback);
    }
    function unmountFeedback(element) {
      applications.delete(element);
      mountedFeedback.delete(element);
      AelluxJs.offEvent(element, "Feedback", onFeedback);
    }
    function onFeedback(event) {
      const element = event.currentTarget;
      const value = element.getAttribute(feedbackAttribute);
      if (value === null) return;
      const list = value.trim();
      if (list) {
        const type = event.detail && event.detail.type;
        const names = list.split(/\s+/);
        if (!names.includes(type)) {
          return;
        }
      }
      event.stopPropagation();
      if (!event.detail || typeof event.detail !== "object") return;
      const presentTarget = element.getAttribute(presentTargetAttribute);
      const presentElement = presentTarget !== null && presentTarget.trim() && (AelluxJs.comm.has("present.pop") || AelluxJs.comm.has("present.pop-next")) ? AelluxJs.elementOrId(presentTarget) : null;
      if (presentElement == null ? void 0 : presentElement.hasAttribute(AelluxJs.attr("present-group"))) {
        const preparation = { boundary: element, feedback: event.detail };
        const result = AelluxJs.comm.request("present.pop-next", {
          group: presentElement,
          preparation: { contract: "feedback.prepare", payload: preparation }
        });
        if (result.handled) {
          const application = applications.get(event.detail);
          Promise.resolve(result.value).then((member) => {
            if (member) requestEffect(element, application);
          }).catch((cause) => AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION,
            { cause, extension: extensionName, element: presentElement }
          ));
          return;
        }
      }
      applyFeedback(element, event.detail, element, (messageElement, effectElement) => {
        if (presentTarget !== null) {
          const target = presentElement || !presentTarget.trim() && ((messageElement == null ? void 0 : messageElement.closest(presentSelector)) || (effectElement == null ? void 0 : effectElement.closest(presentSelector)));
          if (target) AelluxJs.comm.request("present.pop", { element: target });
        }
      });
    }
    function applyFeedback(element, { message, type, motion }, defaultElement = element, presentRequest) {
      const application = { mount: mountedFeedback.get(element) };
      const messageTarget = element.getAttribute(messageTargetAttribute);
      const effectTarget = element.getAttribute(effectTargetAttribute);
      const messageElement = AelluxJs.elementOrId(messageTarget, { defaultElement });
      const effectElement = AelluxJs.elementOrId(effectTarget, { defaultElement });
      application.effectElement = effectElement;
      application.motion = motion;
      if (effectElement) applications.set(effectElement, application);
      if (messageElement && typeof message === "string") {
        let textNode = null;
        for (const child of messageElement.childNodes) {
          if (child.nodeType === 3) {
            textNode = child;
            break;
          }
        }
        if (textNode) textNode.nodeValue = message;
        else messageElement.appendChild(messageElement.ownerDocument.createTextNode(message));
      }
      if (feedbackTypes.includes(type)) {
        const typeClass = AelluxJs.className(`feedback-${type}`);
        for (const target of [element, messageElement, effectElement]) {
          if (target) {
            if (defaultElement !== element) {
              for (const previous of feedbackTypes) target.classList.remove(AelluxJs.className(`feedback-${previous}`));
            }
            target.classList.add(typeClass);
          }
        }
      }
      if (typeof presentRequest === "function") presentRequest(messageElement, effectElement);
      if (presentRequest !== false) requestEffect(element, application);
      return application;
    }
    function requestEffect(element, application) {
      if (!application || application.mount !== mountedFeedback.get(element) || !element.isConnected) return;
      const { effectElement, motion } = application;
      if (!(effectElement == null ? void 0 : effectElement.isConnected) || applications.get(effectElement) !== application || typeof motion !== "string") return;
      AelluxJs.comm.request("present.effect", {
        element: effectElement.closest(presentSelector) || effectElement,
        effect: motion,
        effectTarget: effectElement
      });
    }
    function on(type, handler) {
      if (!handlers.has(type)) {
        handlers.set(type, /* @__PURE__ */ new Set());
      }
      handlers.get(type).add(handler);
      return { off() {
        removeHandler(type, handler);
      } };
    }
    function off(type, handler) {
      return removeHandler(type, handler);
    }
    function warning(message, target, value, motion) {
      publish("warning", message, target, value, motion);
    }
    function error(message, target, value, motion) {
      publish("error", message, target, value, motion);
    }
    function success(message, target, value, motion) {
      publish("success", message, target, value, motion);
    }
    function announce(message, target, value, motion) {
      publish("announce", message, target, value, motion);
    }
    function busy(message, target, value, motion) {
      publish("busy", message, target, value, motion);
    }
    function validate(message, target, value, motion) {
      publish("validate", message, target, value, motion);
    }
    function progress(message, target, value, motion) {
      publish("progress", message, target, value, motion);
    }
    function publish(type, message, target, value, motion) {
      if (message && message.nodeType === 1) {
        const element = message;
        message = target;
        target = element;
      }
      send({ type, message, value, target, motion });
    }
    function send(input, payload) {
      let { type, message, value, target, motion } = payload || input;
      if (input && input.nodeType === 1) target = input;
      if (typeof message !== "string") {
        reportInvalidArgument("message", message);
        return;
      }
      if (!feedbackTypes.includes(type)) {
        reportInvalidArgument("type", type);
        return;
      }
      if (typeof motion !== "undefined" && typeof motion !== "string") {
        reportInvalidArgument("motion", motion);
        return;
      }
      if (typeof target === "undefined") target = root.document;
      else if (!target || target.nodeType !== 1 || typeof target.dispatchEvent !== "function") {
        reportInvalidArgument("target", target);
        return;
      }
      if (typeof motion === "string" && !motionOptions.includes(motion)) {
        AelluxJs.diagnostics.info(AelluxJs.diagnostics.INFO_FEEDBACK_MOTION_CUSTOM, {
          extension: extensionName,
          motion,
          standardMotions: motionOptions.slice()
        });
      }
      const feedback = { type, message, value, target, motion };
      const options = {
        detail: feedback,
        bubbles: true,
        cancelable: true
      };
      AelluxJs.dispatchFrom(target, "Feedback", options);
      notifyHandlers(type, feedback);
      notifyHandlers("*", feedback);
    }
    function reportInvalidArgument(argument, value) {
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_FEEDBACK_ARGUMENT, {
        extension: extensionName,
        argument,
        value
      });
    }
    function notifyHandlers(type, feedback) {
      if (!handlers.has(type)) return;
      handlers.get(type).forEach((call) => {
        try {
          const result = call(feedback);
          if (result && typeof result.then === "function") {
            Promise.resolve(result).catch((error2) => reportCallbackError(error2, type));
          }
        } catch (error2) {
          reportCallbackError(error2, type);
        }
      });
    }
    function reportCallbackError(error2, type) {
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_CALLBACK, {
        cause: error2,
        extension: extensionName,
        type
      });
    }
    function removeHandler(type, handler) {
      const typeHandlers = handlers.get(type);
      if (!typeHandlers) return false;
      const removed = typeHandlers.delete(handler);
      if (typeHandlers.size === 0) handlers.delete(type);
      return removed;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.feedback.js.map
