/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

(function () {
  "use strict";

  const moduleName = "feedback";
  Aellux.uxmRegister(moduleName, {
    init, destroy,
    warning, error, success, announce,
    busy, validate, progress,
    on, off, send
  });


  const handlers = new Map();

  async function init() { }
  async function destroy() { }

  function on(type, handler) {
    if (!handlers.has(type)) { handlers.set(type, new Set()); }
    handlers.get(type).add(handler);
    return { off() { !handlers.has(type) ? null : handlers.get(type).delete(handler); } };
  }

  function off(type, handler) {
    return !handlers.has(type) ? null : handlers.get(type).delete(handler);
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
    Aellux.dispatchFrom(target, "Feedback", { detail: feedback });
    if (handlers.has(type)) handlers.get(type).forEach(call => call(feedback));
    if (handlers.has("*")) handlers.get("*").forEach(call => call(feedback));
  }
})();

