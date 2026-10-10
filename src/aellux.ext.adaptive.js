/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Adaptive Extension
 *
 * Purpose: observes elements marked with `data-ae-adaptive` and exposes their
 * current shape and fit ranges through Aellux Adaptive CSS classes.
 *
 * Capability profile: visual and adaptive behavior, with infrastructure for
 * resize observation.
 *
 * Inputs and activation: mounts `[data-ae-adaptive]`. Thresholds come from
 * `options.adaptiveParams`. `ResizeObserver` is preferred and window resize is
 * the fallback when that API is unavailable.
 *
 * Outputs and owned state: owns the `ae--shape-*` and `ae--fits-*` classes it
 * writes and dispatches `AelluxJsAdaptiveUpdate` after classification changes.
 *
 * Lifecycle: removes fallback listeners, stops observing unmounted elements
 * and removes every class it manages.
 *
 * Accessibility: does not change semantics, focus, reading order or visibility
 * by itself. Styles consuming its classes remain responsible for readable
 * reflow, zoom support, contrast and preservation of meaningful content.
 */

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "adaptive";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  const attr = {
    adaptive: AelluxJs.attr(extensionName)
  };
  const modifier = {
    shapeHorizontal: AelluxJs.className("shape-horizontal"),
    shapeVertical: AelluxJs.className("shape-vertical"),
    shapeSquare: AelluxJs.className("shape-square")
  };
  const adaptiveElements = new Set();

  const adaptiveParams = {
    experienceScale: { near: 1, far: 1.5 },
    ratioShapes: { vertical: 0.8, horizontal: 1.25 },
    minSizes: {
      compact: 0,
      small: 480,
      medium: 768,
      large: 1024,
      xl: 1280,
      xxl: 1600
    }
  };
  let managedClasses;
  const resizeObserver = typeof root.ResizeObserver === "function"
    ? new root.ResizeObserver(onResize)
    : null;

  AelluxJs.extAttach(extensionName, { init, destroy, adaptiveParams });

  function init(options = {}) {
    const overrides = options.adaptiveParams || {};
    for (const group of Object.keys(adaptiveParams)) {
      if (overrides[group] && typeof overrides[group] === "object") {
        Object.assign(adaptiveParams[group], overrides[group]);
      }
    }
    managedClasses = getManagedClasses();
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attr.adaptive}]`,
      mount: mountAdaptive, unmount: unmountAdaptive
    });
  }

  function getManagedClasses() {
    return [
      modifier.shapeHorizontal,
      modifier.shapeVertical,
      modifier.shapeSquare,
      ...Object.keys(adaptiveParams.minSizes).map(size => AelluxJs.className("fits-" + size))
    ];
  }

  function destroy() {
    for (const element of adaptiveElements) unmountAdaptive(element);
    if (resizeObserver) resizeObserver.disconnect();
    AelluxJs.mountManager.remove({ extensionName });
  }

  function mountAdaptive(element) {
    if (adaptiveElements.has(element)) return;
    adaptiveElements.add(element);
    const bounds = element.getBoundingClientRect();
    updateAdaptive(element, bounds.width, bounds.height);
    if (resizeObserver) resizeObserver.observe(element);
    else if (adaptiveElements.size === 1) root.addEventListener("resize", onWindowResize);
  }

  function unmountAdaptive(element) {
    if (!adaptiveElements.delete(element)) return;
    if (resizeObserver) resizeObserver.unobserve(element);
    else if (adaptiveElements.size === 0) root.removeEventListener("resize", onWindowResize);

    for (const name of managedClasses) { element.classList.remove(name); }
  }

  function onResize(entries) {
    for (const entry of entries) {
      if (adaptiveElements.has(entry.target)) {
        updateAdaptive(entry.target, entry.contentRect.width, entry.contentRect.height);
      }
    }
  }

  function onWindowResize() {
    for (const element of adaptiveElements) {
      const bounds = element.getBoundingClientRect();
      updateAdaptive(element, bounds.width, bounds.height);
    }
  }

  function updateAdaptive(element, width, height) {
    const ratio = height > 0 ? width / height : 0;
    element.classList.toggle(modifier.shapeVertical,
      ratio < adaptiveParams.ratioShapes.vertical);
    element.classList.toggle(modifier.shapeHorizontal,
      ratio > adaptiveParams.ratioShapes.horizontal);
    element.classList.toggle(modifier.shapeSquare,
      ratio >= adaptiveParams.ratioShapes.vertical &&
      ratio <= adaptiveParams.ratioShapes.horizontal);

    const space = Math.sqrt(width * height);
    for (const [size, minimum] of Object.entries(adaptiveParams.minSizes)) {
      element.classList.toggle(AelluxJs.className("fits-" + size), space >= minimum);
    }
    AelluxJs.dispatchFrom(element, "AdaptiveUpdate", { detail: null });
  }

  function inferOrientation(flexBox, selector = "*") {
    return AelluxJs.waitLayout.read(() => {
      const fallback = "horizontal";
      var style = getComputedStyle(flexBox);

      if (style.display === "flex" || style.display === "inline-flex") {
        return style.flexDirection.indexOf("column") === 0
          ? "vertical"
          : "horizontal";
      }

      if (!selector || selector.length === 0) return fallback;
      var children = flexBox.querySelectorAll(selector);
      if (children.length < 2) return fallback;

      var first = children[0].getBoundingClientRect();
      var second = children[1].getBoundingClientRect();

      var deltaX = Math.abs(
        (second.left + second.width / 2) -
        (first.left + first.width / 2)
      );
      var deltaY = Math.abs(
        (second.top + second.height / 2) -
        (first.top + first.height / 2)
      );

      return deltaY > deltaX
        ? "vertical"
        : "horizontal";
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
