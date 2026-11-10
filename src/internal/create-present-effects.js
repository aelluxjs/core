/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Effects share Present's controller and CSS Motion service. A request holds
// references to the exact transitions it awaits, never just a CSS state class.
export function createPresentEffects(root, api, controllers) {
  const operations = new Map();
  const targets = new Map();
  const presets = new Set(["shake", "yes", "no", "breathe", "tremble", "pulse", "alert"]);
  const presentAttribute = api.attr("present");

  function visible(element) {
    if (!element.isConnected || !element.getClientRects().length) return false;
    const style = root.getComputedStyle(element);
    if (["hidden", "collapse"].includes(style.visibility)) return false;
    for (let node = element; node; node = node.parentElement) {
      const computed = root.getComputedStyle(node);
      if (computed.display === "none" || computed.contentVisibility === "hidden" || Number(computed.opacity) === 0) return false;
    }
    return true;
  }

  function finish(operation, status) {
    if (operations.get(operation.element) !== operation) return;
    api.motion.cancel(operation.id);
    if (!operation.authoredClass) operation.target.classList.remove(operation.className);
    operations.delete(operation.element);
    if (targets.get(operation.target) === operation) targets.delete(operation.target);
    operation.resolve({ status });
  }

  function cancelWithin(element) {
    for (const operation of operations.values()) {
      if (element.contains(operation.element) || element.contains(operation.target)) finish(operation, "aborted");
    }
  }

  function blocked(operation) {
    for (let node = operation.target; node; node = node.parentElement) {
      const controller = controllers.get(node);
      if (controller?.transition) operation.waiting.add(controller.transition);
    }
    const transition = controllers.get(operation.element)?.transition;
    if (transition) operation.waiting.add(transition);
    return operation.waiting.size > 0;
  }

  function start(operation) {
    if (operations.get(operation.element) !== operation) return;
    if (!controllers.has(operation.element) || !operation.element.contains(operation.target) || !visible(operation.target) ||
        api.currentPreference("reduced-motion") === "reduced") {
      finish(operation, "skipped");
      return;
    }
    if (blocked(operation)) return;
    const transform = root.getComputedStyle(operation.target).transform;
    if (presets.has(operation.effect) &&
        (operation.target.hasAttribute(api.attr("anchor")) || operation.target.hasAttribute(api.attr("scrollbox-elastic")) ||
          (operation.target.getAttribute(presentAttribute) || "").split(/\s+/).includes("transform") ||
          (transform && transform !== "none" && transform !== "matrix(1, 0, 0, 1, 0, 0)"))) {
      const owners = [];
      for (const name of ["anchor", "scrollbox-elastic"]) if (operation.target.hasAttribute(api.attr(name))) owners.push(name);
      if (!operation.target.hasAttribute(api.attr("anchor")) &&
          (operation.target.getAttribute(presentAttribute) || "").split(/\s+/).includes("transform")) owners.push("present");
      if (!owners.length) owners.push("authored-transform");
      if (api.options.environment === "development") for (const owner of owners) api.diagnostics.warn(api.diagnostics.WARN_RESOURCE_CONFLICT, {
        extension: "present", element: operation.target, property: "transform", writers: [owner, "present-effect"],
        reason: "A preset effect would replace the stable transform.",
        suggestion: "Pass an untransformed inner effectTarget to present.effect()."
      });
      finish(operation, "skipped");
      return;
    }
    // Flush the removal of a previous effect before reapplying the same class.
    operation.target.getBoundingClientRect();
    api.motion.run(operation.target, {
      extension: "present-effect", id: operation.id, ownedOnly: true,
      apply: () => operation.target.classList.add(operation.className),
      easing: root.getComputedStyle(operation.target).getPropertyValue("--ae-present-effect-aellux-ease").trim() || undefined,
      abort: () => operations.get(operation.element) !== operation || !controllers.has(operation.element) ||
        !operation.target.isConnected || !operation.element.contains(operation.target) ||
        api.currentPreference("reduced-motion") === "reduced" || blocked(operation)
    }).then(result => finish(operation, result.status), cause => {
      api.diagnostics.error(api.diagnostics.ERROR_EXTENSION_TRANSITION, { cause, extension: "present", element: operation.target });
      finish(operation, "aborted");
    });
  }

  function effect(element, effect, effectTarget = element) {
    const controller = controllers.get(element);
    if (!controller) return Promise.resolve({ status: "skipped" });
    if (typeof effect !== "string" || !/^[a-zA-Z_][\w-]*$/.test(effect) ||
        !effectTarget || effectTarget.nodeType !== 1 || !element.contains(effectTarget)) {
      api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: "present", element, value: effect,
        reason: "An effect requires one CSS identifier and a target inside its mounted Present.",
        suggestion: "Use a preset or custom effect name and an optional descendant Element."
      });
      return Promise.resolve({ status: "skipped" });
    }
    if (operations.has(element)) finish(operations.get(element), "aborted");
    if (targets.has(effectTarget)) finish(targets.get(effectTarget), "aborted");
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    const className = api.className(`present-effect-${effect}`);
    const operation = { element, target: effectTarget, effect, resolve, className,
      id: api.motion.id(), waiting: new Set(), authoredClass: effectTarget.classList.contains(className) };
    operations.set(element, operation);
    targets.set(effectTarget, operation);
    if (api.currentPreference("reduced-motion") === "reduced") finish(operation, "skipped");
    else if (!blocked(operation)) start(operation);
    return promise;
  }

  function settled(transition) {
    for (const operation of operations.values()) {
      if (!operation.waiting.delete(transition)) continue;
      if (!transition.completed) finish(operation, "aborted");
      else if (!operation.waiting.size) start(operation);
    }
  }

  function destroy() {
    for (const operation of operations.values()) finish(operation, "aborted");
  }

  function preferences() {
    if (api.currentPreference("reduced-motion") === "reduced")
      for (const operation of operations.values()) finish(operation, "skipped");
  }

  return { effect, cancelWithin, settled, destroy, preferences };
}
