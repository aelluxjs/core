/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Anchor Extension
 *
 * Purpose: positions `data-ae-anchor` elements against a target sharing their
 * absolute-positioning reference, using pivot pairs in declaration order. The
 * reference itself can also be the target.
 *
 * Capability profile: visual positioning and layout observation.
 *
 * Inputs and activation: mounts `[data-ae-anchor]` and resolves an optional
 * `data-ae-anchor-target`; without one, the positioning parent is the target.
 * `data-ae-anchor-fps` sets the update rate (30 FPS by default).
 * Scroll, resize, size and intersection changes, and bubbling `AelluxJsLayout`
 * events schedule placement updates at the configured rate. A Layout event with
 * `detail.durationMs` keeps checking at that interval until the time expires;
 * zero duration schedules one check after the configured interval.
 *
 * Outputs and owned state: publishes anchor position and origin through inline
 * CSS properties. The boot's weak CSS hides uncalculated elements and positions
 * them when `ae--anchored` marks a valid calculation.
 *
 * Lifecycle: disconnects observers and listeners, cancels pending updates, and
 * restores previous inline values and priorities on unmount or destruction.
 *
 * Accessibility: positioning does not change DOM or focus order. Consumers
 * remain responsible for a meaningful reading order and reachable content.
 */

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "anchor";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }

  const attribute = AelluxJs.attr(extensionName);
  const targetAttribute = AelluxJs.attr("anchor-target");
  const fpsAttribute = AelluxJs.attr("anchor-fps");

  const layoutEvent = AelluxJs.eventName("Layout");
  const anchoredClass = AelluxJs.className("anchored");

  const baseProperties = ["position", "left", "top", "transform", "transform-origin"];
  const ownedProperties = [
    ...baseProperties,
    "--ae-anchor-x", "--ae-anchor-y",
    "--ae-anchor-origin-x", "--ae-anchor-origin-y"
  ];
  const pivots = {
    "top-left": [0, 0], "top-center": [0.5, 0], "top-right": [1, 0],
    "center-left": [0, 0.5], center: [0.5, 0.5], "center-right": [1, 0.5],
    "bottom-left": [0, 1], "bottom-center": [0.5, 1], "bottom-right": [1, 1]
  };

  const DEFAULT_FPS = 30;
  const DEFAULT_INTERVAL_MS = Math.round(1000 / DEFAULT_FPS);
  const anchors = new Map();
  const elementMemories = new WeakMap();

  let updateTimeout = null;
  let layoutUpdateTimeout = null;
  let layoutUpdateUntil = 0;
  let lastUpdateTime = -DEFAULT_INTERVAL_MS;

  function updateIntervalMs() {
    let interval = Infinity;
    for (const element of anchors.keys()) {
      const value = element.getAttribute(fpsAttribute);
      const fps = value === null || !value.trim() ? NaN : Number(value);
      const elementInterval = Number.isFinite(fps) && fps > 0
        ? Math.max(1, Math.round(1000 / fps)) : DEFAULT_INTERVAL_MS;
      interval = Math.min(interval, elementInterval);
    }
    return Number.isFinite(interval) ? interval : DEFAULT_INTERVAL_MS;
  }

  AelluxJs.extAttach(extensionName, { init, destroy });

  function init() {
    AelluxJs.registerCssProperty({
      name: "--ae-anchor-x", syntax: "<length>", inherits: false, initialValue: "0px"
    });
    AelluxJs.registerCssProperty({
      name: "--ae-anchor-y", syntax: "<length>", inherits: false, initialValue: "0px"
    });
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attribute}]`,
      priority: 0,
      mount: mountAnchor, unmount: unmountAnchor, update: updateAnchor
    });
  }

  async function destroy() {
    if (updateTimeout !== null) clearTimeout(updateTimeout);
    if (layoutUpdateTimeout !== null) clearTimeout(layoutUpdateTimeout);
    updateTimeout = null;
    layoutUpdateTimeout = null;
    layoutUpdateUntil = 0;
    lastUpdateTime = -DEFAULT_INTERVAL_MS;
    await Promise.all(Array.from(anchors.keys(), unmountAnchor));
    AelluxJs.mountManager.remove({ extensionName });
  }

  function mountAnchor(element) {
    if (anchors.has(element)) return;
    elementMemories.set(element, AelluxJs.persist.element.save(element, [], ownedProperties));
    const state = {
      invalidContext: false, active: false, revision: 0,
      target: null, reference: null,
      layoutListener: event => scheduleLayoutUpdate(event),
      observer: null, intersectionObserver: null
    };

    anchors.set(element, state);
    if (anchors.size === 1) {
      AelluxJs.onTarget(root, "$scroll", scheduleUpdate, { capture: true, passive: true });
      AelluxJs.onTarget(root, "$resize", scheduleUpdate);
    }
    if (typeof root.ResizeObserver === "function") {
      state.observer = new root.ResizeObserver(scheduleUpdate);
    }
    if (typeof root.IntersectionObserver === "function") {
      state.intersectionObserver = new root.IntersectionObserver(scheduleUpdate);
    }
    return updateAnchor(element);
  }

  async function unmountAnchor(element) {
    const state = anchors.get(element);
    if (!state) return;
    const memory = elementMemories.get(element);
    elementMemories.delete(element);
    state.revision++;
    if (state.reference) AelluxJs.offTarget(state.reference, layoutEvent, state.layoutListener);
    if (state.observer) state.observer.disconnect();
    if (state.intersectionObserver) state.intersectionObserver.disconnect();
    anchors.delete(element);
    if (!anchors.size) {
      AelluxJs.offTarget(root, "$scroll", scheduleUpdate, true);
      AelluxJs.offTarget(root, "$resize", scheduleUpdate);
      if (updateTimeout !== null) clearTimeout(updateTimeout);
      if (layoutUpdateTimeout !== null) clearTimeout(layoutUpdateTimeout);
      updateTimeout = null;
      layoutUpdateTimeout = null;
      layoutUpdateUntil = 0;
      lastUpdateTime = -DEFAULT_INTERVAL_MS;
    }
    await AelluxJs.waitLayout.update(deactivate, [element, state, memory]);
  }

  function scheduleUpdate() {
    if (!anchors.size) return;
    const interval = updateIntervalMs();
    const elapsed = now() - lastUpdateTime;
    if (elapsed >= interval) {
      if (updateTimeout !== null) clearTimeout(updateTimeout);
      updateTimeout = null;
      flushUpdate();
      return;
    }
    if (updateTimeout !== null) return;
    updateTimeout = setTimeout(flushUpdate, interval - elapsed);
  }

  function scheduleLayoutUpdate(event) {
    const interval = updateIntervalMs();
    const durationMs = Number(event && event.detail ? event.detail.durationMs : NaN);
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      scheduleUpdate();
      return;
    }

    if (durationMs === 0) {
      if (layoutUpdateTimeout === null)
        layoutUpdateTimeout = setTimeout(checkLayoutUpdate, interval);
      return;
    }

    scheduleUpdate();
    layoutUpdateUntil = Math.max(layoutUpdateUntil, now() + durationMs);
    if (layoutUpdateTimeout !== null) return;
    layoutUpdateTimeout = setTimeout(
      checkLayoutUpdate, Math.min(interval, durationMs)
    );
  }

  function checkLayoutUpdate() {
    layoutUpdateTimeout = null;
    scheduleUpdate();

    const remaining = layoutUpdateUntil - now();
    if (remaining > 0) {
      layoutUpdateTimeout = setTimeout(
        checkLayoutUpdate, Math.min(updateIntervalMs(), remaining)
      );
    } else {
      layoutUpdateUntil = 0;
    }
  }

  function flushUpdate() {
    updateTimeout = null;
    lastUpdateTime = now();
    for (const element of anchors.keys()) {
      updateAnchor(element).catch(cause => {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
          { cause, extension: extensionName, element, method: "update" });
      });
    }
  }

  function now() {
    return root.performance && typeof root.performance.now === "function"
      ? root.performance.now() : Date.now();
  }

  async function updateAnchor(element) {
    const state = anchors.get(element);
    if (!state) return;
    const revision = ++state.revision;
    const current = () => anchors.get(element) === state && state.revision === revision;
    const targetValue = element.getAttribute(targetAttribute);
    const useReference = !targetValue || !targetValue.trim();
    const target = useReference ? null : resolveElement(targetValue);
    const candidates = parseCandidates(element.getAttribute(attribute));
    if ((!target && !useReference) || !candidates.length) {
      await AelluxJs.waitLayout.update(() => {
        if (current()) deactivate(element, state);
      });
      return;
    }

    let placement = await AelluxJs.waitLayout.read(() =>
      current() ? readPlacement(element, target, candidates, state.active) : null
    );
    if (!current() || !placement) return;
    if (!placement.valid) {
      await AelluxJs.waitLayout.update(() => {
        if (current()) invalidContext(element, state, placement);
      });
      return;
    }
    if (!state.active) {
      await AelluxJs.waitLayout.update(() => {
        if (!current()) return;
        applyBaseStyles(element);
        state.active = true;
      });
      if (!current()) return;
      placement = await AelluxJs.waitLayout.read(() =>
        current() ? readPlacement(element, useReference ? null : target, candidates, true) : null
      );
      if (!current() || !placement) return;
      if (!placement.valid) {
        await AelluxJs.waitLayout.update(() => {
          if (current()) invalidContext(element, state, placement);
        });
        return;
      }
    }
    await AelluxJs.waitLayout.update(() => {
      if (!current()) return;
      state.invalidContext = false;
      observe(state, element, placement.target, placement.reference);
      const selected = placement.selected;
      element.style.setProperty("--ae-anchor-x", `${selected.x}px`);
      element.style.setProperty("--ae-anchor-y", `${selected.y}px`);
      element.style.setProperty("--ae-anchor-origin-x", `${selected.self[0] * 100}%`);
      element.style.setProperty("--ae-anchor-origin-y", `${selected.self[1] * 100}%`);
      for (const name of baseProperties) element.style.removeProperty(name);
      element.classList.add(anchoredClass);
    });
  }

  function readPlacement(element, target, candidates, measure) {
    const reference = element.offsetParent;
    target = target || reference;
    if (!reference || (target !== reference && target.offsetParent !== reference)) {
      return { valid: false, target, reference };
    }
    if (!measure) return { valid: true, target };

    const referenceRect = reference.getBoundingClientRect();
    const scaleX = reference.offsetWidth ? referenceRect.width / reference.offsetWidth : 1;
    const scaleY = reference.offsetHeight ? referenceRect.height / reference.offsetHeight : 1;
    const targetRect = toReference(target.getBoundingClientRect(), reference, referenceRect, scaleX, scaleY);
    const selfRect = element.getBoundingClientRect();
    const selfWidth = selfRect.width / scaleX;
    const selfHeight = selfRect.height / scaleY;
    const boundaryRect = toReference(
      { left: 0, top: 0, width: root.innerWidth, height: root.innerHeight },
      reference, referenceRect, scaleX, scaleY
    );
    let selected = null;
    for (const candidate of candidates) {
      const x = targetRect.left + targetRect.width * candidate.target[0] -
        selfWidth * candidate.self[0];
      const y = targetRect.top + targetRect.height * candidate.target[1] -
        selfHeight * candidate.self[1];
      const result = { x, y, self: candidate.self };
      if (!selected) selected = result;
      if (x >= boundaryRect.left && y >= boundaryRect.top &&
        x + selfWidth <= boundaryRect.left + boundaryRect.width &&
        y + selfHeight <= boundaryRect.top + boundaryRect.height) {
        selected = result;
        break;
      }
    }
    return { valid: true, target, reference, selected };
  }

  function invalidContext(element, state, placement) {
    deactivate(element, state);
    if (placement.reference)
      listenForLayout(state, placement.reference);
    if (state.invalidContext) return;
    AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT,
      { extension: extensionName, element, target: placement.target });
    state.invalidContext = true;
  }

  function observe(state, element, target, reference) {
    if (state.target === target && state.reference === reference) return;
    listenForLayout(state, reference);
    state.target = target;
    if (state.observer) state.observer.disconnect();
    if (state.intersectionObserver) state.intersectionObserver.disconnect();
    for (const observed of new Set([element, target, reference])) {
      if (!observed) continue;
      if (state.observer) state.observer.observe(observed);
      if (state.intersectionObserver) state.intersectionObserver.observe(observed);
    }
  }

  function listenForLayout(state, reference) {
    if (state.reference === reference) return;
    if (state.reference) AelluxJs.offTarget(state.reference, layoutEvent, state.layoutListener);
    state.reference = reference;
    if (reference) AelluxJs.onTarget(reference, layoutEvent, state.layoutListener);
  }

  function applyBaseStyles(element) {
    element.style.setProperty("position", "absolute");
    element.style.setProperty("left", "0px");
    element.style.setProperty("top", "0px");
    element.style.setProperty("transform",
      "translate3d(var(--ae-anchor-x, 0px), var(--ae-anchor-y, 0px), 0)");
    element.style.setProperty("transform-origin",
      "var(--ae-anchor-origin-x, 50%) var(--ae-anchor-origin-y, 0%)");
  }

  function deactivate(element, state, memory = elementMemories.get(element)) {
    if (state.reference) AelluxJs.offTarget(state.reference, layoutEvent, state.layoutListener);
    if (state.observer) state.observer.disconnect();
    if (state.intersectionObserver) state.intersectionObserver.disconnect();
    state.target = state.reference = null;
    element.classList.remove(anchoredClass);
    if (state.active && memory) memory.restore();
    state.active = false;
  }

  function resolveElement(value) {
    if (!value || !value.trim()) return null;
    const selector = value.trim();
    const id = selector[0] === "#" ? selector.slice(1) : selector;
    const byId = document.getElementById(id);
    if (byId) return byId;
    try { return document.querySelector(selector); }
    catch (_) { return null; }
  }

  function parseCandidates(value) {
    const result = [];
    for (const token of (value || "").split(",")) {
      const pair = token.trim().toLowerCase().split(":");
      if (pair.length !== 2 || !pivots[pair[0].trim()] || !pivots[pair[1].trim()]) continue;
      result.push({ target: pivots[pair[0].trim()], self: pivots[pair[1].trim()] });
    }
    return result;
  }

  function toReference(rect, reference, referenceRect, scaleX, scaleY) {
    return {
      left: (rect.left - referenceRect.left) / scaleX - reference.clientLeft + reference.scrollLeft,
      top: (rect.top - referenceRect.top) / scaleY - reference.clientTop + reference.scrollTop,
      width: rect.width / scaleX,
      height: rect.height / scaleY
    };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
