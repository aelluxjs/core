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
 * Outputs and owned state: dispatches `AelluxJsFeedback` and owns only its
 * subscription registry. It creates no messages, dialogs or live regions.
 *
 * Lifecycle: removes the document listener and clears all subscriptions when
 * the extension is destroyed.
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

  const handlers = new Map();

  function init(options) { }

  async function destroy() {
    handlers.clear();
  }

  function on(type, handler) {
    if (!handlers.has(type)) { handlers.set(type, new Set()); }
    handlers.get(type).add(handler);
    return { off() { removeHandler(type, handler); } };
  }

  function off(type, handler) {
    return removeHandler(type, handler);
  }

  function warning(message) { send({ type: "warning", message }); }
  function error(message) { send({ type: "error", message }); }
  function success(message) { send({ type: "success", message }); }
  function announce(message) { send({ type: "announce", message }); }

  function busy(target, message, value) { send({ type: "busy", message, value, target }); }
  function validate(target, message, value) { send({ type: "validate", message, value, target }); }
  function progress(target, message, value) { send({ type: "progress", message, value, target }); }

  function send({ type, message, value, target }) {
    target = target || document;
    const feedback = { type, message, value, target };
    AelluxJs.dispatchFrom(target, "Feedback", { detail: feedback });
    notifyHandlers(type, feedback);
    notifyHandlers("*", feedback);
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

