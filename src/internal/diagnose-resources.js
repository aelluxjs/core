/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Describe persistent writers, rather than maintaining a second mount registry.
// Callers inspect actual effects before comparing their resources with these.
export function transformOwners(api, element) {
  const owners = [];
  if (api.ext.anchor?.initialized && element.classList.contains(api.className("anchored"))) owners.push("anchor");
  const parent = element.parentElement;
  if (api.ext.scrollbox?.initialized && element.hasAttribute(api.attr("scrollbox-elastic")) &&
      element.getAttribute(api.attr("scrollbox-elastic")) !== "false" && parent?.hasAttribute(api.attr("scrollbox"))) {
    const children = [...parent.children].filter(child =>
      !child.hasAttribute(api.attr("scrollbar-vertical")) && !child.hasAttribute(api.attr("scrollbar-horizontal")));
    if (children.length === 1) owners.push("scrollbox-elastic");
  }
  if (api.ext.present?.initialized && !element.hasAttribute(api.attr("anchor")) &&
      element.getAttribute(api.attr("present"))?.split(/\s+/).includes("transform")) owners.push("present");
  return owners;
}

export function diagnoseResource(api, element, property, writers) {
  api.diagnostics.warn(api.diagnostics.WARN_RESOURCE_CONFLICT, {
    extension: writers[writers.length - 1], element, attribute: "style", property, writers,
    reason: `${writers.join(" and ")} replace the same ${property} on this element.`,
    suggestion: "Keep positioning and elastic transforms on the outer element; animate a child element instead."
  });
}

export function diagnoseMotionResources(api, element, animations, extension) {
  if (api.options.environment !== "development") return;
  for (const animation of animations) {
    try {
      // Additive effects intentionally compose with the underlying value.
      const effect = animation.effect;
      if (effect?.target !== element || effect.pseudoElement) continue;
      const frames = effect.getKeyframes();
      if (!frames.some(frame => "transform" in frame &&
          (frame.composite === "replace" || ((!frame.composite || frame.composite === "auto") &&
            (!effect.composite || effect.composite === "replace"))))) continue;
      const owners = transformOwners(api, element).filter(owner => owner !== extension);
      for (const owner of owners) diagnoseResource(api, element, "transform", [owner, extension]);
    } catch (_) { /* A browser without inspectable keyframes cannot confirm a conflict. */ }
  }
}
