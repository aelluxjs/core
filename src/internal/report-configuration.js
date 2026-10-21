/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Keep the existing diagnostic envelope: actionable details live in context.
export function reportConfiguration(api, name, context) {
  if (context.element && context.attribute && !("value" in context))
    context.value = context.element.getAttribute(context.attribute);
  return api.diagnostics.warn(api.diagnostics[name], context);
}

export function diagnosePresentTarget(api, element, target, attribute, value) {
  if (!value || /[\s#]/.test(value.replace(/^#/, ""))) return false;
  if (target && target.hasAttribute(api.attr("present"))) return true;
  reportConfiguration(api, "WARN_CONFIGURATION_TARGET", {
    extension: "present", element, attribute, value,
    reason: target ? "Target is not a Present container." : "Target element was not found.",
    suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
  });
  return false;
}
