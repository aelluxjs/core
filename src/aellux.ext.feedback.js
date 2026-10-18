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
  const motionTimers = new Map();
  const feedbackAttribute = AelluxJs.attr(extensionName);
  const targetMessageAttribute = AelluxJs.attr("targetMessage");
  const targetTransformAttribute = AelluxJs.attr("targetTransform");

  function init() {
    AelluxJs.mountManager.add({
      extensionName, selector: `[${feedbackAttribute}]`, priority: 0,
      mount: mountFeedback, unmount: unmountFeedback
    });
  }

  async function destroy() {
    AelluxJs.mountManager.remove({ extensionName });
    for (const timer of motionTimers.values()) root.clearTimeout(timer);
    motionTimers.clear();
    handlers.clear();
  }

  function mountFeedback(element) {
    AelluxJs.onTarget(element, "Feedback", onFeedback);
  }

  function unmountFeedback(element) {
    AelluxJs.offTarget(element, "Feedback", onFeedback);
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
    const messageTarget = element.getAttribute(targetMessageAttribute);
    const transformTarget = element.getAttribute(targetTransformAttribute);
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

    if (transformElement) {
      const motionPrefix = AelluxJs.className("feedback-motion-");
      for (const className of Array.from(transformElement.classList)) {
        if (className.startsWith(motionPrefix)) transformElement.classList.remove(className);
      }
      const previousTimer = motionTimers.get(transformElement);
      if (previousTimer) root.clearTimeout(previousTimer);
      motionTimers.delete(transformElement);
      if (typeof motion === "string") {
        const motionClass = AelluxJs.className(`feedback-motion-${motion}`);
        transformElement.classList.add(motionClass);
        motionTimers.set(transformElement, root.setTimeout(() => {
          transformElement.classList.remove(motionClass);
          motionTimers.delete(transformElement);
        }, 1000));
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

  function warning(message, target, value, motion) { send({ type: "warning", message, value, target, motion }); }
  function error(message, target, value, motion) { send({ type: "error", message, value, target, motion }); }
  function success(message, target, value, motion) { send({ type: "success", message, value, target, motion }); }
  function announce(message, target, value, motion) { send({ type: "announce", message, value, target, motion }); }

  function busy(message, target, value, motion) { send({ type: "busy", message, value, target, motion }); }
  function validate(message, target, value, motion) { send({ type: "validate", message, value, target, motion }); }
  function progress(message, target, value, motion) { send({ type: "progress", message, value, target, motion }); }

  function send({ type, message, value, target, motion }) {
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

