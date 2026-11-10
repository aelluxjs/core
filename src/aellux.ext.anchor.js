/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createCssEasing } from "./internal/create-css-easing.js";

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
 * `data-ae-anchor-target`; a Present Group target resolves to its selected member.
 * Without an explicit target, the positioning parent is the target.
 * `data-ae-anchor-scroll-into-view="block inline"` optionally scrolls the Anchor
 * target on visibility or effective target changes. Switching keeps one clock
 * while scroll/layout updates replace only its destination geometry.
 * `data-ae-maxfps` sets an optional maximum update rate.
 * Scroll, resize, size and intersection changes, and bubbling `AelluxJsLayout`
 * events schedule placement updates at the configured rate. A Layout event with
 * `detail.durationMs` keeps checking at that interval until the time expires;
 * zero duration schedules one check after the configured interval.
 *
 * Outputs and owned state: publishes anchor position and origin through inline
 * CSS properties. The external stylesheet hides uncalculated elements and positions
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

  const
    ORIGIN_X = "--ae-anchor-origin-x",
    ORIGIN_Y = "--ae-anchor-origin-y",
    ANCHOR_OPACITY = "--anchor-opacity";

  const attribute = AelluxJs.attr(extensionName);
  const presentAttribute = AelluxJs.attr("present");
  const targetAttribute = AelluxJs.attr("anchor-target");
  const matchAttribute = AelluxJs.attr("anchor-match");
  const scrollIntoViewAttribute = AelluxJs.attr("anchor-scroll-into-view");
  const groupAttribute = AelluxJs.attr("present-group");
  const layoutEvent = AelluxJs.eventName("Layout");
  const anchoredClass = AelluxJs.className("anchored");
  const switchingClass = AelluxJs.className("anchor-switching");

  const baseProperties = ["position", "left", "top", "transform", "transform-origin"];
  const ownedProperties = [
    ...baseProperties,
    "--ae-anchor-x", "--ae-anchor-y",
    ORIGIN_X, ORIGIN_Y, ANCHOR_OPACITY,
    "--ae-anchor-target-width", "--ae-anchor-target-height",
    "--ae-anchor-pivot-x", "--ae-anchor-pivot-y"
  ];
  const pivots = {
    "top-left": [0, 0], "top-center": [0.5, 0], "top-right": [1, 0],
    "center-left": [0, 0.5], center: [0.5, 0.5], "center-right": [1, 0.5],
    "bottom-left": [0, 1], "bottom-center": [0.5, 1], "bottom-right": [1, 1]
  };

  const anchors = new Map();
  const elementMemories = new WeakMap();
  const placementMaps = new Set();
  const requestedMaps = new Map();
  let nextLayoutId = 2000000;
  let mutations = null;
  AelluxJs.extAttach(extensionName, { init, destroy, createPlacementMap });

  function init() {
    AelluxJs.comm.handle("anchor.placement", placementRequest, { owner: extensionName });
    AelluxJs.registerCssProperty(
      { name: "--ae-anchor-x", syntax: "<length>", initialValue: "0px" },
      { name: "--ae-anchor-y", syntax: "<length>", initialValue: "0px" },
      { name: "--ae-anchor-target-width", syntax: "<length>", initialValue: "0px" },
      { name: "--ae-anchor-target-height", syntax: "<length>", initialValue: "0px" },
      { name: "--ae-anchor-switch-duration", syntax: "<time>", initialValue: "0ms" },
      { name: ORIGIN_X, syntax: "<percentage>", initialValue: "50%" },
      { name: ORIGIN_Y, syntax: "<percentage>", initialValue: "0%" },
      { name: ANCHOR_OPACITY, syntax: "<number>", initialValue: "1" }
    );
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attribute}]`,
      priority: 0,
      mount: mountAnchor, unmount: unmountAnchor,
      update: element => updateAnchor(element, true)
    });
  }

  async function destroy() {
    AelluxJs.comm.removeOwner(extensionName);
    for (const map of placementMaps) map.destroy();
    requestedMaps.clear();
    await Promise.all(Array.from(anchors.keys(), unmountAnchor));
    AelluxJs.mountManager.remove({ extensionName });
  }

  function placementRequest({ action, owner, element, pairs, target, placement }) {
    if (action === "invisible") return isInvisible(element);
    let map = requestedMaps.get(owner);
    if (action === "dispose") {
      map?.destroy(); requestedMaps.delete(owner); return true;
    }
    if (action === "mount" && !map) {
      map = createPlacementMap(); requestedMaps.set(owner, map);
    }
    if (!map) return null;
    if (action === "mount") return map.mount(element);
    if (action === "unmount") return map.unmount(element);
    if (action === "measure") return map.measure(element, pairs, target);
    if (action === "place") return map.place(element, placement);
    return null;
  }

  // Public application API. Extension consumers use data-only comm requests;
  // the owned maps never join ordinary Anchor tracking.
  function createPlacementMap() {
    const memories = new Map();
    let disposed = false;
    const map = {
      mount(element) {
        if (!disposed && !memories.has(element))
          memories.set(element, AelluxJs.persist.element.save(element, ["class"], ownedProperties));
      },
      unmount(element) {
        memories.get(element)?.restore();
        memories.delete(element);
      },
      measure(element, pairs, target = element.parentElement) {
        const candidates = parseCandidates(pairs);
        if (memories.has(element) && candidates.length) return readPlacement(element, target, candidates, true);
        return null;
      },
      place(element, placement) {
        if (memories.has(element) && placement?.valid) writePlacement(element, placement);
      },
      invisible: isInvisible,
      destroy() {
        disposed = true;
        for (const element of memories.keys()) map.unmount(element);
        placementMaps.delete(map);
      }
    };
    placementMaps.add(map);
    return map;
  }

  function mountAnchor(element) {
    if (anchors.has(element)) return;
    elementMemories.set(element, AelluxJs.persist.element.save(element, [], ownedProperties));
    const state = {
      invalidContext: false, active: false, revision: 0,
      target: null, resolvedTarget: null, reference: null,
      group: null, lastPlacement: null, switchOperation: null,
      motionId: AelluxJs.motion.id(),
      scrollVisible: false, scrollPending: false, ownClass: null, ownStyle: null,
      layoutId: nextLayoutId++, styleLayoutId: nextLayoutId++,
      layoutUntil: 0, layoutSingle: false,
      layoutFinalPending: false,
      layoutPolling: false, updatePending: false, updateDirty: false, repeatPending: false,
      lastUpdateAt: -Infinity, updateTimer: null, updateTimerDue: false,
      layoutListener: event => scheduleLayoutUpdate(event),
      observer: null, intersectionObserver: null
    };

    anchors.set(element, state);
    // A hidden target can become visible before the asynchronous first
    // placement completes. Subscribe to its containing block immediately so
    // the Present Layout event that starts that transition is never missed.
    if (element.offsetParent) listenForLayout(state, element.offsetParent);
    if (anchors.size === 1) {
      AelluxJs.onEvent(root, "$scroll", scheduleUpdate, { capture: true, passive: true });
      AelluxJs.onEvent(root, "$resize", scheduleUpdate);
      AelluxJs.on("PresentGroupChange", onGroupChange);
      if (typeof root.MutationObserver === "function") {
        mutations = new root.MutationObserver(onMutations);
        mutations.observe(document, { subtree: true, childList: true, attributes: true,
          attributeFilter: [attribute, targetAttribute, matchAttribute, scrollIntoViewAttribute, groupAttribute,
            AelluxJs.attr("reduced-motion"), "id", "hidden", "class", "style"] });
      }
    }
    if (typeof root.ResizeObserver === "function") {
      state.observer = new root.ResizeObserver(entries => {
        if (state.switchOperation !== null && entries.every(entry => entry.target === element)) return;
        scheduleAnchor(element);
      });
    }
    if (typeof root.IntersectionObserver === "function") {
      state.intersectionObserver = new root.IntersectionObserver(() => scheduleAnchor(element));
    }
    return updateAnchor(element);
  }

  async function unmountAnchor(element) {
    const state = anchors.get(element);
    if (!state) return;
    const memory = elementMemories.get(element);
    elementMemories.delete(element);
    state.revision++;
    stopSwitch(element, state);
    if (state.reference) AelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
    if (state.observer) state.observer.disconnect();
    if (state.intersectionObserver) state.intersectionObserver.disconnect();
    if (state.updateTimer !== null) root.clearTimeout(state.updateTimer);
    anchors.delete(element);
    if (!anchors.size) {
      AelluxJs.offEvent(root, "$scroll", scheduleUpdate, true);
      AelluxJs.offEvent(root, "$resize", scheduleUpdate);
      AelluxJs.off("PresentGroupChange", onGroupChange);
      if (mutations) mutations.disconnect();
      mutations = null;
    }
    AelluxJs.waitLayout.cancel(state.layoutId);
    AelluxJs.waitLayout.cancel(state.styleLayoutId);
    await AelluxJs.waitLayout.update(state.styleLayoutId, deactivate, [element, state, memory]);
  }

  function scheduleUpdate(event) {
    if (!anchors.size) return;
    const source = event?.type === "scroll" ? scrollSource(event) : null;
    for (const [element, state] of anchors) {
      if (source && !relevantScroll(source, element, state)) continue;
      scheduleAnchor(element);
    }
  }

  function scrollSource(event) {
    return event.target === document || event.target === root
      ? document.scrollingElement || document.documentElement : event.target;
  }

  function relevantScroll(source, element, state) {
    return source.contains?.(element) || source.contains?.(effectiveTarget(element, state));
  }

  function onGroupChange(event) {
    for (const [element, state] of anchors)
      if (state.group === event.detail?.group) scheduleAnchor(element);
  }

  function onMutations(records) {
    const affected = new Set();
    for (const record of records) {
      const node = record.target;
      const structural = record.type === "childList";
      const visual = record.attributeName === "class" || record.attributeName === "style";
      for (const [element, state] of anchors) {
        // Present can mount after Anchor's first read, revealing a target by
        // class alone. Ignore our own visual writes to avoid observer loops.
        if (visual) {
          if (node === element && element.hasAttribute(scrollIntoViewAttribute) &&
              (element.getAttribute("class") !== state.ownClass || element.getAttribute("style") !== state.ownStyle)) affected.add(element);
          if (node !== element && (node.contains(element) || state.resolvedTarget && node.contains(state.resolvedTarget) ||
              state.group && node.contains(state.group) || targetChanged(element, state))) affected.add(element);
          continue;
        }
        if (node === element || node === document.documentElement ||
          node.contains(element) || state.resolvedTarget && node.contains(state.resolvedTarget) ||
          state.group && node.contains(state.group) ||
          structural && state.reference?.contains(node) ||
          targetChanged(element, state)) affected.add(element);
      }
    }
    for (const element of affected) scheduleAnchor(element);
  }

  function targetChanged(element, state) {
    const value = element.getAttribute(targetAttribute);
    return value && value.trim() && resolveElement(value) !== (state.group || state.resolvedTarget);
  }

  function associationDiagnostic(element, reason) {
    AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_ANCHOR_GROUP,
      { extension: extensionName, element, reason,
        attribute: targetAttribute, value: element.getAttribute(targetAttribute),
        suggestion: "Reference an element or Present Group without circular targets, share a positioning reference, and keep dimension-matched Anchors out of normal flow." });
  }

  function effectiveTarget(element, state) {
    const value = element.getAttribute(targetAttribute);
    const target = value && value.trim() ? resolveElement(value) : element.offsetParent;
    state.group = value && value.trim() && target?.hasAttribute(groupAttribute) ? target : null;
    return state.group ? AelluxJs.comm.request("present.selection", { group: state.group }).value || null : target;
  }

  function circularTarget(element, target) {
    const visited = new Set([element]);
    while (target) {
      if (visited.has(target)) return true;
      visited.add(target);
      const state = anchors.get(target);
      if (!state) return false;
      target = effectiveTarget(target, state);
    }
    return false;
  }

  function scheduleLayoutUpdate(event) {
    const durationMs = Number(event && event.detail ? event.detail.durationMs : NaN);
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      scheduleUpdate();
      return;
    }

    if (durationMs === 0) {
      for (const [element, state] of anchors) {
        const maxFPS = AelluxJs.layoutMaxFPS(element);
        state.layoutUntil = now() + 1000 / (maxFPS || 60);
        state.layoutSingle = true;
        state.layoutFinalPending = true;
        scheduleAnchor(element, true);
      }
      return;
    }

    for (const [element, state] of anchors) {
      state.layoutUntil = Math.max(state.layoutUntil, now() + durationMs);
      state.layoutSingle = false;
      state.layoutFinalPending = true;
      scheduleAnchor(element, durationMs > 0);
    }
  }

  function scheduleAnchor(element, repeat = false) {
    const state = anchors.get(element);
    if (!state) return;
    // A pending placement owns its revision until both layout phases finish.
    // Starting another sequence before that point invalidates the first read
    // and can lose the Layout event emitted by a newly-visible Present.
    if (state.updatePending) {
      state.updateDirty = true;
      state.repeatPending = state.repeatPending || repeat;
      return;
    }
    const maxFPS = AelluxJs.layoutMaxFPS(element);
    if (maxFPS && !repeat && !state.updateTimerDue) {
      if (state.updateTimer === null) {
        state.updateTimer = root.setTimeout(() => {
          state.updateTimer = null;
          state.updateTimerDue = true;
          scheduleAnchor(element);
        }, 1000 / maxFPS);
      }
      return;
    }
    state.updateTimerDue = false;
    const due = maxFPS ? state.lastUpdateAt + 1000 / maxFPS : -Infinity;
    if (due > now()) {
      if (state.updateTimer === null) {
        state.updateTimer = root.setTimeout(() => {
          state.updateTimer = null;
          scheduleAnchor(element, repeat);
        }, Math.max(0, due - now()));
      }
      return;
    }
    if (state.layoutPolling) {
      state.updateDirty = true;
      return;
    }
    const run = () => {
      if (state.layoutSingle && now() < state.layoutUntil) return;
      state.layoutSingle = false;
      if (repeat && now() >= state.layoutUntil) state.layoutFinalPending = false;
      requestAnchorUpdate(element, state);
    };
    if (repeat) state.layoutPolling = true;
    const sequence = AelluxJs.waitLayout.sequence(state.layoutId, {
      update: run,
      repeat: repeat ? { ms: 0 } : undefined,
      maxFPS,
      abort: () => !anchors.has(element) ||
        (repeat && now() >= state.layoutUntil && !state.layoutSingle &&
          !state.layoutFinalPending)
    });
    if (repeat) sequence.finally(() => {
      if (anchors.get(element) !== state) return;
      state.layoutPolling = false;
      if (state.updateDirty) scheduleAnchor(element);
    });
  }

  function requestAnchorUpdate(element, state) {
    if (state.updatePending) {
      state.updateDirty = true;
      return;
    }
    state.updatePending = true;
    state.updateDirty = false;
    updateAnchor(element).catch(cause => {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
          { cause, extension: extensionName, element, method: "update" });
      }).finally(() => {
        if (anchors.get(element) !== state) return;
        state.updatePending = false;
        if (state.updateDirty && !state.layoutPolling) {
          const repeat = state.repeatPending;
          state.repeatPending = false;
          scheduleAnchor(element, repeat);
        }
      });
  }

  function now() {
    return root.performance && typeof root.performance.now === "function"
      ? root.performance.now() : Date.now();
  }

  async function updateAnchor(element, ensureLatest = false) {
    const state = anchors.get(element);
    if (!state) return;
    const revision = ++state.revision;
    const current = () => anchors.get(element) === state && state.revision === revision;
    const retry = () => ensureLatest && anchors.get(element) === state ?
      updateAnchor(element, true) : undefined;
    const target = effectiveTarget(element, state);
    state.resolvedTarget = target;
    const candidates = parseCandidates(element.getAttribute(attribute));
    if (!target || !target.isConnected || !candidates.length || circularTarget(element, target)) {
      if (target && circularTarget(element, target))
        associationDiagnostic(element, "Circular target reference.");
      await AelluxJs.waitLayout.update(state.styleLayoutId, () => {
        if (current()) deactivate(element, state);
      });
      if (!current()) return retry();
      return;
    }

    let placement = await AelluxJs.waitLayout.read(state.styleLayoutId, () =>
      current() ? readPlacement(element, target, candidates, state.active) : null
    );
    if (!current()) return retry();
    if (!placement) return;
    if (placement.hidden) {
      await AelluxJs.waitLayout.update(state.styleLayoutId, () => {
        if (current()) hideForTarget(element, state, placement);
      });
      if (!current()) return retry();
      return;
    }
    if (!placement.valid) {
      await AelluxJs.waitLayout.update(state.styleLayoutId, () => {
        if (current()) invalidContext(element, state, placement);
      });
      if (!current()) return retry();
      return;
    }
    if (!state.active) {
      await AelluxJs.waitLayout.update(state.styleLayoutId, () => {
        if (!current()) return;
        state.active = true;
        if (state.lastPlacement) writePlacement(element, state.lastPlacement);
      });
      if (!current()) return retry();
      placement = await AelluxJs.waitLayout.read(state.styleLayoutId, () =>
        current() ? readPlacement(element, target, candidates, true) : null
      );
      if (!current()) return retry();
      if (!placement) return;
      if (placement.hidden) {
        await AelluxJs.waitLayout.update(state.styleLayoutId, () => {
          if (current()) hideForTarget(element, state, placement);
        });
        if (!current()) return retry();
        return;
      }
      if (!placement.valid) {
        await AelluxJs.waitLayout.update(state.styleLayoutId, () => {
          if (current()) invalidContext(element, state, placement);
        });
        if (!current()) return retry();
        return;
      }
    }
    let applied = false;
    await AelluxJs.waitLayout.update(state.styleLayoutId, () => {
      if (!current()) return;
      // A retarget can land between the read and write phases. Discard that
      // destination; scroll alone must not starve publication on every frame.
      if (effectiveTarget(element, state) !== placement.target) return;
      state.invalidContext = false;
      observe(state, element, placement.target, placement.reference);
      const previous = state.lastPlacement;
      const switching = previous && previous.target !== placement.target;
      if (!previous || switching) state.scrollPending = true;
      const moved = !previous || previous.signature !== placement.signature;
      if (switching && placement.duration > 0) {
        startSwitch(element, state, placement);
      } else if (state.switchOperation && !switching && AelluxJs.currentPreference("reduced-motion") !== "reduced") {
        // Same target, same origin and clock. Publishing new CSS destinations
        // here would start competing native transitions; only replace the data.
        state.switchOperation.toGeometry = placement;
      } else if (state.switchOperation) {
        // Reduced motion or an immediate genuine retarget must publish the
        // destination while our transition mask is still held.
        writePlacement(element, placement);
        stopSwitch(element, state);
      } else {
        stopSwitch(element, state);
        if (moved) placeDirectly(element, placement);
        else writePlacement(element, placement);
      }
      if (switching) {
        state.scrollPending = false;
        state.scrollVisible = true;
        scrollTargetIntoView(element, placement.target);
      }
      rememberVisual(element, state);
      state.lastUpdateAt = now();
      state.lastPlacement = placement;
      applied = true;
    });
    // Observers may queue a newer revision while an explicit update is in
    // flight. Complete the latest revision so mountManager.update() does not
    // resolve with stale anchor variables (notably in WebKit).
    if (!applied && anchors.get(element) === state) return updateAnchor(element, ensureLatest);
    if (!applied || !element.hasAttribute(scrollIntoViewAttribute)) return;
    // Initial placement and reappearance need a visibility check after our
    // hidden rule is released. Target changes already requested scrolling;
    // transition cleanup and ordinary tracking do not re-arm that request.
    const visible = await AelluxJs.waitLayout.read(state.styleLayoutId, () =>
      current() && !isInvisible(element));
    if (!current()) return retry();
    if (visible && !state.scrollVisible) state.scrollPending = true;
    state.scrollVisible = visible;
    if (!visible || !state.scrollPending) return;
    await AelluxJs.waitLayout.update(state.styleLayoutId, () => {
      // A DOM retarget can precede the observer's next scheduled revision.
      if (!current() || effectiveTarget(element, state) !== placement.target) return;
      state.scrollPending = false;
      scrollTargetIntoView(element, placement.target);
    });
  }

  function scrollTargetIntoView(element, target) {
    const tokens = (element.getAttribute(scrollIntoViewAttribute) || "").trim().split(/\s+/);
    if (tokens.length !== 2 || tokens.some(token => !["start", "center", "end", "nearest"].includes(token))) return;
    target.scrollIntoView({ block: tokens[0], inline: tokens[1],
      behavior: AelluxJs.currentPreference("reduced-motion") === "reduced" ? "instant" : "smooth" });
  }

  function rememberVisual(element, state) {
    state.ownClass = element.getAttribute("class");
    state.ownStyle = element.getAttribute("style");
  }

  function readPlacement(element, target, candidates, measure) {
    const reference = element.offsetParent;
    target = target || reference;
    if (target && isInvisible(target)) return { hidden: true, target, reference };
    if (!reference || (target !== reference && target.offsetParent !== reference)) {
      return { valid: false, target, reference };
    }
    const style = root.getComputedStyle(element);
    const tokens = (element.getAttribute(matchAttribute) || "").trim().split(/\s+/).filter(Boolean);
    if (element.hasAttribute(matchAttribute) && (!tokens.length || tokens.some(token => token !== "width" && token !== "height")))
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_ANCHOR_MATCH,
        { extension: extensionName, element, value: element.getAttribute(matchAttribute) });
    if ((tokens.includes("width") || tokens.includes("height")) && style.position !== "absolute" && style.position !== "fixed") {
      associationDiagnostic(element, "Dimension matching requires an out-of-flow Anchor.");
      return { hidden: true, target, reference };
    }
    if (!measure) return { valid: true, target };

    const referenceRect = reference.getBoundingClientRect();
    const scaleX = reference.offsetWidth ? referenceRect.width / reference.offsetWidth : 1;
    const scaleY = reference.offsetHeight ? referenceRect.height / reference.offsetHeight : 1;
    const targetRect = toReference(target.getBoundingClientRect(), reference, referenceRect, scaleX, scaleY);
    const selfRect = element.getBoundingClientRect();
    const visual = toReference(selfRect, reference, referenceRect, scaleX, scaleY);
    const fromSelf = [ORIGIN_X, ORIGIN_Y].map(name => (parseFloat(style.getPropertyValue(name)) || 0) / 100);
    // Read translation itself: subtracting integer offsetLeft/Top from a visual
    // box with fractional layout offsets or margins can round the origin.
    const matrix = /^matrix(3d)?\(([^)]*)\)$/.exec(style.transform);
    const components = matrix ? matrix[2].split(",").map(Number) : null;
    const visualX = components ? components[matrix[1] ? 12 : 4] : visual.left - element.offsetLeft;
    const visualY = components ? components[matrix[1] ? 13 : 5] : visual.top - element.offsetTop;
    const fromGeometry = { width: parseFloat(style.getPropertyValue("--ae-anchor-target-width")) || 0,
      height: parseFloat(style.getPropertyValue("--ae-anchor-target-height")) || 0,
      selected: { x: visualX, y: visualY, self: fromSelf,
        pivotX: visualX + visual.width * fromSelf[0], pivotY: visualY + visual.height * fromSelf[1] } };
    const projectSize = (axis, actual, desired) => {
      const inline = element.style[axis].replace(/\s+/g, "");
      if (!tokens.includes(axis) || inline && inline !== `var(--ae-anchor-target-${axis})`) return actual;
      const previous = parseFloat(element.style.getPropertyValue(`--ae-anchor-target-${axis}`)) || 0;
      const sides = axis === "width" ? ["Left", "Right"] : ["Top", "Bottom"];
      const extra = sides.reduce((sum, side) => sum + (parseFloat(style[`padding${side}`]) || 0) +
        (parseFloat(style[`border${side}Width`]) || 0), 0);
      const borderBox = style.boxSizing === "border-box";
      const minimum = Math.max(borderBox ? extra : 0, parseFloat(style.getPropertyValue(`min-${axis}`)) || 0);
      const maximum = parseFloat(style.getPropertyValue(`max-${axis}`));
      const constrain = value => Math.max(minimum, Math.min(Number.isFinite(maximum) ? maximum : Infinity, value));
      // An application width/height that differs from the prior weak match
      // remains authoritative. The percentage self-pivot also uses its actual box.
      return !anchors.get(element)?.switchOperation && Math.abs(parseFloat(style[axis]) - constrain(previous)) > 0.5
        ? actual : constrain(desired) + (borderBox ? 0 : extra);
    };
    const selfWidth = projectSize("width", selfRect.width / scaleX, targetRect.width);
    const selfHeight = projectSize("height", selfRect.height / scaleY, targetRect.height);
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
      const result = { x, y, self: candidate.self,
        pivotX: targetRect.left + targetRect.width * candidate.target[0],
        pivotY: targetRect.top + targetRect.height * candidate.target[1] };
      if (!selected) selected = result;
      if (x >= boundaryRect.left && y >= boundaryRect.top &&
        x + selfWidth <= boundaryRect.left + boundaryRect.width &&
        y + selfHeight <= boundaryRect.top + boundaryRect.height) {
        selected = result;
        break;
      }
    }
    const present = target.closest(`[${presentAttribute}]`);
    const opacity = present ? root.getComputedStyle(present).opacity : "1";
    const rawDuration = style.getPropertyValue("--ae-anchor-switch-duration").trim();
    const duration = AelluxJs.currentPreference("reduced-motion") === "reduced" ? 0 :
      Math.max(0, (parseFloat(rawDuration) || 0) * (rawDuration.endsWith("ms") ? 1 : 1000));
    // Matched positioning uses the target pivot plus a percentage self-pivot.
    // Its rendered width/height may change during motion (including authored
    // inline sizing); that alone must not look like a changed destination.
    const position = tokens.includes("width") || tokens.includes("height")
      ? [selected.pivotX, selected.pivotY] : [selected.x, selected.y];
    return { valid: true, target, reference, selected, opacity, duration, scaleX, scaleY, fromGeometry,
      easing: style.getPropertyValue("--ae-anchor-switch-ease").trim() || "ease-in-out",
      width: targetRect.width, height: targetRect.height,
      signature: [...position, targetRect.width, targetRect.height, ...selected.self].join("/") };
  }

  function writePlacement(element, placement) {
    const selected = placement.selected;
    const style = element.style;
    setValue(style, "--ae-anchor-x", `${selected.x}px`);
    setValue(style, "--ae-anchor-y", `${selected.y}px`);
    setValue(style, ORIGIN_X, `${selected.self[0] * 100}%`);
    setValue(style, ORIGIN_Y, `${selected.self[1] * 100}%`);
    setValue(style, ANCHOR_OPACITY, placement.opacity);
    setValue(style, "--ae-anchor-target-width", `${placement.width}px`);
    setValue(style, "--ae-anchor-target-height", `${placement.height}px`);
    setValue(style, "--ae-anchor-pivot-x", `${selected.pivotX}px`);
    setValue(style, "--ae-anchor-pivot-y", `${selected.pivotY}px`);
    element.classList.add(anchoredClass);
  }

  function isInvisible(element) {
    const visibility = root.getComputedStyle(element).visibility;
    if (visibility === "hidden" || visibility === "collapse") return true;
    for (let current = element; current && current.nodeType === 1; current = current.parentElement) {
      const style = root.getComputedStyle(current);
      // The cascade can override hidden and inline declarations. Visibility is
      // inherited and may be restored by the target; display and opacity still
      // suppress the entire subtree when effective on an ancestor.
      if (style.display === "none" || style.contentVisibility === "hidden" ||
        Number(style.opacity) === 0) return true;
    }
    return false;
  }

  function hideForTarget(element, state, placement) {
    // Keep the prior geometry across a group switch's invisible preparation,
    // so it can seed the transition once the new target becomes visible.
    const previous = state.group && state.lastPlacement?.target !== placement.target
      ? state.lastPlacement : null;
    deactivate(element, state);
    state.lastPlacement = previous;
    state.invalidContext = false;
    if (placement.reference) listenForLayout(state, placement.reference);
  }

  function invalidContext(element, state, placement) {
    deactivate(element, state);
    if (placement.reference)
      listenForLayout(state, placement.reference);
    if (state.invalidContext) return;
    AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT,
      { extension: extensionName, element, target: placement.target,
        attribute: targetAttribute, value: element.getAttribute(targetAttribute),
        reason: "Anchor and target use incompatible positioning references.",
        suggestion: "Place both elements in the same containing block, or use that block as the target." });
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
    if (state.reference) AelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
    state.reference = reference;
    if (reference) AelluxJs.onEvent(reference, layoutEvent, state.layoutListener);
  }

  function deactivate(element, state, memory = elementMemories.get(element)) {
    stopSwitch(element, state);
    if (state.reference) AelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
    if (state.observer) state.observer.disconnect();
    if (state.intersectionObserver) state.intersectionObserver.disconnect();
    state.target = state.reference = null;
    element.classList.remove(anchoredClass);
    if (state.active && memory) memory.restore();
    state.active = false;
    state.lastPlacement = null;
    state.scrollVisible = false;
    state.scrollPending = false;
    rememberVisual(element, state);
  }

  function stopSwitch(element, state, keepStyles = false) {
    const operation = state.switchOperation;
    state.switchOperation = null;
    AelluxJs.waitLayout.cancel(state.motionId);
    AelluxJs.waitLayout.setVisualFPSLimit(state.motionId, null);
    element.classList.remove(switchingClass);
    if (!keepStyles && operation?.styles) {
      // Commit the last frame before re-enabling authored transitions.
      element.getBoundingClientRect();
      operation.styles.restore();
    }
    rememberVisual(element, state);
    return operation?.styles || null;
  }

  function suppressTransitions(element) {
    const style = root.getComputedStyle(element);
    if (!style.transitionDuration.split(",").some(value => parseFloat(value) > 0)) return null;
    const properties = style.transitionProperty.split(",").map(property => property.trim());
    const controlled = ["transform", "transform-origin",
      ...(element.getAttribute(matchAttribute) || "").split(/\s+/).filter(property => property === "width" || property === "height"),
      ...ownedProperties.filter(property => property.startsWith("--ae-anchor-"))];
    const horizontal = !style.writingMode || style.writingMode.startsWith("horizontal");
    if (controlled.includes("width")) controlled.push(horizontal ? "inline-size" : "block-size");
    if (controlled.includes("height")) controlled.push(horizontal ? "block-size" : "inline-size");
    const memory = AelluxJs.persist.element.save(element, [], ["transition-property", "transition-duration", "transition-delay", "transition-timing-function"]);
    // Remove the controlled properties entirely: setting their duration to zero
    // alone does not cancel an already running native transition. Expand all
    // from computed CSS even without WAAPI, retaining unrelated list timings.
    const durations = style.transitionDuration.split(","), delays = style.transitionDelay.split(",");
    const timing = style.transitionTimingFunction.match(/(?:[^,(]|\([^)]*\))+/g) || ["ease"];
    const retained = [], times = [], waits = [], easings = [];
    properties.forEach((property, index) => {
      for (const name of property === "all" ? Array.from(style) : [property]) {
        if (name === "none" || controlled.includes(name.replace(/^-(?:webkit|moz|ms|o)-/, ""))) continue;
        retained.push(name);
        times.push(durations[index % durations.length]);
        waits.push(delays[index % delays.length]);
        easings.push(timing[index % timing.length]);
      }
    });
    element.style.setProperty("transition-property", retained.join(",") || "none", "important");
    element.style.setProperty("transition-duration", times.join(",") || "0s", "important");
    element.style.setProperty("transition-delay", waits.join(",") || "0s", "important");
    element.style.setProperty("transition-timing-function", easings.join(",") || "ease", "important");
    return memory;
  }

  function placeDirectly(element, placement) {
    const memory = suppressTransitions(element);
    try {
      writePlacement(element, placement);
      if (memory) element.getBoundingClientRect();
    } finally { memory?.restore(); }
  }

  function setValue(style, name, value) {
    if (style.getPropertyValue(name) === value && !style.getPropertyPriority(name)) return;
    // WebKit may retain an important registered value when its priority is
    // replaced in one call. Memory retains the original value and priority.
    if (style.getPropertyPriority(name)) style.removeProperty(name);
    style.setProperty(name, value);
  }

  function startSwitch(element, state, placement) {
    // Our last published frame is newer than an asynchronous geometry read
    // when a frame and a genuine retarget arrive in the same scheduler batch.
    const from = state.switchOperation?.rendered || placement.fromGeometry;
    const retained = stopSwitch(element, state, true);
    const operation = {
      target: placement.target, startedAt: now(), duration: placement.duration,
      easing: createCssEasing(placement.easing, AelluxJs),
      fromGeometry: from, toGeometry: placement, rendered: from,
      styles: retained || suppressTransitions(element)
    };
    state.switchOperation = operation;
    element.classList.add(switchingClass);
    renderSwitch(element, state, operation);
    const limits = [AelluxJs.layoutMaxFPS(element)];
    const matching = (element.getAttribute(matchAttribute) || "").split(/\s+/).some(axis => axis === "width" || axis === "height");
    const policy = AelluxJs.options.cssMotionPropertyMaxFPS;
    if (matching && policy !== null && policy !== 0) {
      const value = Number(policy);
      if (Number.isFinite(value) && value > 0) limits.push(value);
      else {
        if (policy !== undefined) AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CSS_MOTION_PROPERTY_MAX_FPS_INVALID,
          { extension: "core", option: "cssMotionPropertyMaxFPS", value: policy, fallback: 55,
            reason: "CSS Motion frame rate must be finite and greater than zero; using 55 FPS.",
            suggestion: "Use a positive finite number or omit the option for the default." });
        limits.push(55);
      }
    }
    const maxFPS = limits.filter(value => Number.isFinite(value) && value > 0).reduce((min, value) => Math.min(min, value), Infinity);
    AelluxJs.waitLayout.setVisualFPSLimit(state.motionId, maxFPS === Infinity ? null : maxFPS);
    AelluxJs.waitLayout.sequence(state.motionId, {
      update: () => renderSwitch(element, state, operation),
      repeat: { ms: 0 }, maxFPS: maxFPS === Infinity ? undefined : maxFPS,
      abort: () => anchors.get(element) !== state || state.switchOperation !== operation
    }).catch(cause => {
      if (state.switchOperation === operation) stopSwitch(element, state);
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
        { cause, extension: extensionName, element, method: "switch" });
    });
  }

  function renderSwitch(element, state, operation) {
    if (state.switchOperation !== operation || effectiveTarget(element, state) !== operation.target) return;
    const progress = Math.max(0, Math.min(1, (now() - operation.startedAt) / operation.duration));
    const from = operation.fromGeometry, to = operation.toGeometry;
    const eased = operation.easing(progress);
    const mix = (a, b) => a + (b - a) * eased;
    const geometry = { target: to.target, reference: to.reference, opacity: to.opacity,
      width: Math.max(0, mix(from.width, to.width)), height: Math.max(0, mix(from.height, to.height)),
      selected: { x: mix(from.selected.x, to.selected.x), y: mix(from.selected.y, to.selected.y),
        pivotX: mix(from.selected.pivotX, to.selected.pivotX), pivotY: mix(from.selected.pivotY, to.selected.pivotY),
        self: from.selected.self.map((value, axis) => mix(value, to.selected.self[axis])) } };
    operation.rendered = progress === 1 ? to : geometry;
    writePlacement(element, operation.rendered);
    if (progress === 1 || AelluxJs.currentPreference("reduced-motion") === "reduced") {
      writePlacement(element, to);
      stopSwitch(element, state);
      // One final scheduled measurement catches a scroll/layout notification
      // still in flight at the deadline. No progress loop remains when idle.
      scheduleAnchor(element);
    }
    rememberVisual(element, state);
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
