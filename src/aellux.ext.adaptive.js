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
 * Outputs and owned state: owns the `ae--shape-*` and `ae--fits-*` classes,
 * `--ae-width`, `--ae-height` and the `aria-orientation` value it writes, then
 * dispatches `AelluxJsAdaptiveUpdate`.
 *
 * Lifecycle: removes fallback listeners, stops observing unmounted elements
 * and removes every class it manages. It restores prior inline dimension values.
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
  const initialDimensions = new Map();
  const dimensionProperties = ["--ae-width", "--ae-height"];
  const pendingResizeEntries = new Map();
  const pendingResizeElements = new Set();

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
  const UPDATE_INTERVAL_MS = 100;
  let managedClasses;
  let sizeThresholds = [];
  let updateTimeout = null;
  let lastUpdateTime = -UPDATE_INTERVAL_MS;
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
    for (const group of Object.keys(adaptiveParams)) Object.freeze(adaptiveParams[group]);
    Object.freeze(adaptiveParams);
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attr.adaptive}]`,
      mount: mountAdaptive, unmount: unmountAdaptive
    });
  }

  function getManagedClasses() {
    const classes = [
      modifier.shapeHorizontal,
      modifier.shapeVertical,
      modifier.shapeSquare
    ];
    sizeThresholds = [];
    for (const [size, minimum] of Object.entries(adaptiveParams.minSizes)) {
      const className = AelluxJs.className("fits-" + size);
      sizeThresholds.push({ className, minimum });
      classes.push(className);
    }
    return classes;
  }

  function destroy() {
    if (updateTimeout !== null) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
    pendingResizeEntries.clear();
    pendingResizeElements.clear();
    lastUpdateTime = -UPDATE_INTERVAL_MS;
    for (const element of adaptiveElements) unmountAdaptive(element);
    if (resizeObserver) resizeObserver.disconnect();
    AelluxJs.mountManager.remove({ extensionName });
  }

  function mountAdaptive(element) {
    if (adaptiveElements.has(element)) return;
    initialDimensions.set(element, dimensionProperties.map(name => ({
      value: element.style.getPropertyValue(name),
      priority: element.style.getPropertyPriority(name)
    })));
    adaptiveElements.add(element);
    const bounds = element.getBoundingClientRect();
    updateAdaptive(element, bounds.width, bounds.height);
    if (resizeObserver) resizeObserver.observe(element);
    else if (adaptiveElements.size === 1) root.addEventListener("resize", onWindowResize);
  }

  function unmountAdaptive(element) {
    if (!adaptiveElements.delete(element)) return;
    pendingResizeEntries.delete(element);
    pendingResizeElements.delete(element);
    if (resizeObserver) resizeObserver.unobserve(element);
    else if (adaptiveElements.size === 0) root.removeEventListener("resize", onWindowResize);

    for (const name of managedClasses) { element.classList.remove(name); }
    const initial = initialDimensions.get(element);
    dimensionProperties.forEach((name, index) => {
      const { value, priority } = initial[index];
      if (value) element.style.setProperty(name, value, priority);
      else element.style.removeProperty(name);
    });
    initialDimensions.delete(element);
  }

  function onResize(entries) {
    for (const entry of entries) {
      if (adaptiveElements.has(entry.target)) {
        pendingResizeEntries.set(entry.target, entry);
      }
    }
    scheduleUpdate();
  }

  function onWindowResize() {
    for (const element of adaptiveElements) {
      pendingResizeElements.add(element);
    }
    scheduleUpdate();
  }

  function scheduleUpdate() {
    const elapsed = now() - lastUpdateTime;
    if (elapsed >= UPDATE_INTERVAL_MS) {
      if (updateTimeout !== null) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
      }
      flushPendingUpdate();
      return;
    }
    if (updateTimeout !== null) return;
    updateTimeout = setTimeout(
      flushPendingUpdate,
      UPDATE_INTERVAL_MS - elapsed
    );
  }

  function flushPendingUpdate() {
    updateTimeout = null;
    if (!pendingResizeEntries.size && !pendingResizeElements.size) return;
    lastUpdateTime = now();

    const entries = Array.from(pendingResizeEntries.values());
    pendingResizeEntries.clear();
    for (const entry of entries) {
      updateAdaptive(entry.target, entry.contentRect.width, entry.contentRect.height);
    }

    const elements = Array.from(pendingResizeElements);
    pendingResizeElements.clear();
    for (const element of elements) {
      AelluxJs.waitLayout.read(readBounds, [element]);
    }
  }

  function now() {
    return root.performance && typeof root.performance.now === "function"
      ? root.performance.now()
      : Date.now();
  }

  function readBounds(entry) {
    const { width, height } = entry.getBoundingClientRect();
    AelluxJs.waitLayout.update(
      updateAdaptive,
      [entry, width, height]
    );
  }

  function updateAdaptive(element, width, height) {
    if (!adaptiveElements.has(element)) return;
    const ratio = height > 0 ? width / height : 0;
    element.setAttribute(
      "aria-orientation",
      height > width ? "vertical" : "horizontal"
    );
    element.classList.toggle(modifier.shapeVertical,
      ratio < adaptiveParams.ratioShapes.vertical);
    element.classList.toggle(modifier.shapeHorizontal,
      ratio > adaptiveParams.ratioShapes.horizontal);
    element.classList.toggle(modifier.shapeSquare,
      ratio >= adaptiveParams.ratioShapes.vertical &&
      ratio <= adaptiveParams.ratioShapes.horizontal);

    const space = Math.sqrt(width * height);
    for (let i = 0; i < sizeThresholds.length; i++) {
      const threshold = sizeThresholds[i];
      element.classList.toggle(
        threshold.className,
        space >= threshold.minimum
      );
    }

    for (const name of dimensionProperties) {
      if (element.style.getPropertyPriority(name)) element.style.removeProperty(name);
    }
    element.style.setProperty("--ae-width", width);
    element.style.setProperty("--ae-height", height);

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
