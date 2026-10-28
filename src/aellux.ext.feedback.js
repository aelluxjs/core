/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Feedback Extension
 *
 * Purpose: provides a common event channel for application feedback such as
 * errors, warnings, success messages, progress, busy state and validation.
 *
 * Capability profile: infrastructure and policy, with an integration boundary
 * for user-facing feedback renderers.
 *
 * Inputs and activation: public methods publish typed payloads. Consumers can
 * subscribe to all feedback or one type and may dispatch the feedback event.
 *
 * Outputs and owned state: dispatches `AelluxJsFeedback`, owns its subscription
 * registry, and mounts feedback boundaries. It creates no messages or dialogs.
 *
 * Lifecycle: removes mounted listeners and clears subscriptions on destruction.
 *
 * Accessibility: a renderer must choose suitable semantics, focus behavior and
 * announcement priority. `announce()` publishes an event; it does not itself
 * announce content to assistive technology.
 */

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "feedback";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  AelluxJs.extAttach(extensionName, {
    init, destroy,
    warning, error, success, announce,
    busy, validate, progress,
    on, off, send
  });

  const motionOptions = ["shake", "yes", "no", "breathe", "tremble", "pulse", "alert"];
  const feedbackTypes = ["warning", "error", "success", "announce", "busy", "progress", "validate"];

  const handlers = new Map();
  const motionOperations = new Map();
  const motionIds = new WeakMap();
  const feedbackAttribute = AelluxJs.attr(extensionName);
  const messageTargetAttribute = AelluxJs.attr("messageTarget");
  const transformTargetAttribute = AelluxJs.attr("transformTarget");
  const presentTargetAttribute = AelluxJs.attr("presentTarget");
  const presentSelector = `[${AelluxJs.attr("present")}]`;

  function init() {
    AelluxJs.mountManager.add({
      extensionName, selector: `[${feedbackAttribute}]`, priority: 0,
      mount: mountFeedback, unmount: unmountFeedback,
      controllers: feedbackTypes.concat("send")
    });
  }

  async function destroy() {
    AelluxJs.mountManager.remove({ extensionName });
    for (const operation of motionOperations.values()) AelluxJs.motion.cancel(operation.id);
    motionOperations.clear();
    handlers.clear();
  }

  function mountFeedback(element) {
    AelluxJs.onEvent(element, "Feedback", onFeedback);
  }

  function unmountFeedback(element) {
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
    if (!event.detail) return;
    const { message, type, motion } = event.detail;
    const messageTarget = element.getAttribute(messageTargetAttribute);
    const transformTarget = element.getAttribute(transformTargetAttribute);
    const messageElement = AelluxJs.elementOrId(messageTarget, { defaultElement: element });
    const transformElement = AelluxJs.elementOrId(transformTarget, { defaultElement: element });

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
      for (const target of [element, messageElement, transformElement]) {
        if (target) target.classList.add(typeClass);
      }
    }

    const presentTarget = element.getAttribute(presentTargetAttribute);
    const present = AelluxJs.ext.present;
    if (presentTarget !== null && present?.initialized) {
      if (presentTarget.trim()) {
        const presentElement = AelluxJs.elementOrId(presentTarget);
        if (presentElement) present.pop(presentElement);
      } else {
        const target = messageElement?.closest(presentSelector) ||
          transformElement?.closest(presentSelector);
        if (target) present.pop(target);
      }
    }

    if (transformElement) {
      const motionPrefix = AelluxJs.className("feedback-motion-");
      for (const className of Array.from(transformElement.classList)) {
        if (className.startsWith(motionPrefix)) transformElement.classList.remove(className);
      }
      const previous = motionOperations.get(transformElement);
      if (previous) AelluxJs.motion.cancel(previous.id);
      motionOperations.delete(transformElement);
      if (typeof motion === "string") {
        const motionClass = AelluxJs.className(`feedback-motion-${motion}`);
        let id = motionIds.get(transformElement);
        if (id === undefined) {
          id = AelluxJs.motion.id();
          motionIds.set(transformElement, id);
        }
        const operation = { id, className: motionClass };
        motionOperations.set(transformElement, operation);
        const advancedEase = root.getComputedStyle(transformElement)
          .getPropertyValue("--ae-feedback-aellux-ease").trim() || undefined;
        AelluxJs.motion.run(transformElement, {
          extension: extensionName,
          id,
          apply: () => transformElement.classList.add(motionClass),
          easing: advancedEase,
          abort: () => !transformElement.isConnected
        }).catch(cause => {
          AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION,
            { cause, extension: extensionName, element: transformElement });
        }).finally(() => {
          if (motionOperations.get(transformElement) !== operation) return;
          transformElement.classList.remove(motionClass);
          motionOperations.delete(transformElement);
        });
      }
    }
  }

  function on(type, handler) {
    if (!handlers.has(type)) { handlers.set(type, new Set()); }
    handlers.get(type).add(handler);
    return { off() { removeHandler(type, handler); } };
  }

  function off(type, handler) {
    return removeHandler(type, handler);
  }

  function warning(message, target, value, motion) { publish("warning", message, target, value, motion); }
  function error(message, target, value, motion) { publish("error", message, target, value, motion); }
  function success(message, target, value, motion) { publish("success", message, target, value, motion); }
  function announce(message, target, value, motion) { publish("announce", message, target, value, motion); }

  function busy(message, target, value, motion) { publish("busy", message, target, value, motion); }
  function validate(message, target, value, motion) { publish("validate", message, target, value, motion); }
  function progress(message, target, value, motion) { publish("progress", message, target, value, motion); }

  function publish(type, message, target, value, motion) {
    // Mounted controllers prepend their element to the public arguments.
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
        extension: extensionName, motion, standardMotions: motionOptions.slice()
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
      extension: extensionName, argument, value
    });
  }

  function notifyHandlers(type, feedback) {
    if (!handlers.has(type)) return;
    handlers.get(type).forEach(call => {
      try {
        const result = call(feedback);
        if (result && typeof result.then === "function") {
          Promise.resolve(result).catch(error => reportCallbackError(error, type));
        }
      } catch (error) {
        reportCallbackError(error, type);
      }
    });
  }

  function reportCallbackError(error, type) {
    AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_CALLBACK, {
      cause: error, extension: extensionName, type
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

