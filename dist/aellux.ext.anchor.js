(() => {
  // src/aellux.ext.anchor.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "anchor";
    if (!AelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    const ORIGIN_X = "--ae-anchor-origin-x", ORIGIN_Y = "--ae-anchor-origin-y", ANCHOR_OPACITY = "--anchor-opacity";
    const attribute = AelluxJs.attr(extensionName);
    const presentAttribute = AelluxJs.attr("present");
    const targetAttribute = AelluxJs.attr("anchor-target");
    const layoutEvent = AelluxJs.eventName("Layout");
    const anchoredClass = AelluxJs.className("anchored");
    const baseProperties = ["position", "left", "top", "transform", "transform-origin"];
    const ownedProperties = [
      ...baseProperties,
      "--ae-anchor-x",
      "--ae-anchor-y",
      ORIGIN_X,
      ORIGIN_Y,
      ANCHOR_OPACITY
    ];
    const pivots = {
      "top-left": [0, 0],
      "top-center": [0.5, 0],
      "top-right": [1, 0],
      "center-left": [0, 0.5],
      center: [0.5, 0.5],
      "center-right": [1, 0.5],
      "bottom-left": [0, 1],
      "bottom-center": [0.5, 1],
      "bottom-right": [1, 1]
    };
    const anchors = /* @__PURE__ */ new Map();
    const elementMemories = /* @__PURE__ */ new WeakMap();
    let nextLayoutId = 2e6;
    AelluxJs.extAttach(extensionName, { init, destroy });
    function init() {
      AelluxJs.registerCssProperty(
        { name: "--ae-anchor-x", syntax: "<length>", initialValue: "0px" },
        { name: "--ae-anchor-y", syntax: "<length>", initialValue: "0px" },
        { name: ORIGIN_X, syntax: "<percentage>", initialValue: "50%" },
        { name: ORIGIN_Y, syntax: "<percentage>", initialValue: "0%" },
        { name: ANCHOR_OPACITY, syntax: "<number>", initialValue: "1" }
      );
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${attribute}]`,
        priority: 0,
        mount: mountAnchor,
        unmount: unmountAnchor,
        update: (element) => updateAnchor(element, true)
      });
    }
    async function destroy() {
      await Promise.all(Array.from(anchors.keys(), unmountAnchor));
      AelluxJs.mountManager.remove({ extensionName });
    }
    function mountAnchor(element) {
      if (anchors.has(element)) return;
      elementMemories.set(element, AelluxJs.persist.element.save(element, [], ownedProperties));
      const state = {
        invalidContext: false,
        active: false,
        revision: 0,
        target: null,
        reference: null,
        layoutId: nextLayoutId++,
        styleLayoutId: nextLayoutId++,
        layoutUntil: 0,
        layoutSingle: false,
        layoutFinalPending: false,
        layoutPolling: false,
        updatePending: false,
        updateDirty: false,
        repeatPending: false,
        lastUpdateAt: -Infinity,
        updateTimer: null,
        updateTimerDue: false,
        layoutListener: (event) => scheduleLayoutUpdate(event),
        observer: null,
        intersectionObserver: null
      };
      anchors.set(element, state);
      if (element.offsetParent) listenForLayout(state, element.offsetParent);
      if (anchors.size === 1) {
        AelluxJs.onEvent(root, "$scroll", scheduleUpdate, { capture: true, passive: true });
        AelluxJs.onEvent(root, "$resize", scheduleUpdate);
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
      if (state.reference) AelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
      if (state.observer) state.observer.disconnect();
      if (state.intersectionObserver) state.intersectionObserver.disconnect();
      if (state.updateTimer !== null) root.clearTimeout(state.updateTimer);
      anchors.delete(element);
      if (!anchors.size) {
        AelluxJs.offEvent(root, "$scroll", scheduleUpdate, true);
        AelluxJs.offEvent(root, "$resize", scheduleUpdate);
      }
      AelluxJs.waitLayout.cancel(state.layoutId);
      AelluxJs.waitLayout.cancel(state.styleLayoutId);
      await AelluxJs.waitLayout.update(state.styleLayoutId, deactivate, [element, state, memory]);
    }
    function scheduleUpdate() {
      if (!anchors.size) return;
      for (const element of anchors.keys()) scheduleAnchor(element);
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
          state.layoutUntil = now() + 1e3 / (maxFPS || 60);
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
          }, 1e3 / maxFPS);
        }
        return;
      }
      state.updateTimerDue = false;
      const due = maxFPS ? state.lastUpdateAt + 1e3 / maxFPS : -Infinity;
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
        repeat: repeat ? { ms: 0 } : void 0,
        maxFPS,
        abort: () => !anchors.has(element) || repeat && now() >= state.layoutUntil && !state.layoutSingle && !state.layoutFinalPending
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
      updateAnchor(element).catch((cause) => {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
          { cause, extension: extensionName, element, method: "update" }
        );
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
      return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
    }
    async function updateAnchor(element, ensureLatest = false) {
      const state = anchors.get(element);
      if (!state) return;
      const revision = ++state.revision;
      const current = () => anchors.get(element) === state && state.revision === revision;
      const retry = () => ensureLatest && anchors.get(element) === state ? updateAnchor(element, true) : void 0;
      const targetValue = element.getAttribute(targetAttribute);
      const useReference = !targetValue || !targetValue.trim();
      const target = useReference ? null : resolveElement(targetValue);
      const candidates = parseCandidates(element.getAttribute(attribute));
      if (!target && !useReference || !candidates.length) {
        await AelluxJs.waitLayout.update(state.styleLayoutId, () => {
          if (current()) deactivate(element, state);
        });
        if (!current()) return retry();
        return;
      }
      let placement = await AelluxJs.waitLayout.read(
        state.styleLayoutId,
        () => current() ? readPlacement(element, target, candidates, state.active) : null
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
          applyBaseStyles(element);
          state.active = true;
        });
        if (!current()) return retry();
        placement = await AelluxJs.waitLayout.read(
          state.styleLayoutId,
          () => current() ? readPlacement(element, useReference ? null : target, candidates, true) : null
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
        state.invalidContext = false;
        observe(state, element, placement.target, placement.reference);
        const selected = placement.selected;
        element.style.setProperty("--ae-anchor-x", `${selected.x}px`);
        element.style.setProperty("--ae-anchor-y", `${selected.y}px`);
        element.style.setProperty(ORIGIN_X, `${selected.self[0] * 100}%`);
        element.style.setProperty(ORIGIN_Y, `${selected.self[1] * 100}%`);
        element.style.setProperty(ANCHOR_OPACITY, placement.opacity);
        for (const name of baseProperties) element.style.removeProperty(name);
        element.classList.add(anchoredClass);
        state.lastUpdateAt = now();
        applied = true;
      });
      if (!applied && anchors.get(element) === state) return updateAnchor(element, ensureLatest);
    }
    function readPlacement(element, target, candidates, measure) {
      const reference = element.offsetParent;
      target = target || reference;
      if (target && isInvisible(target)) return { hidden: true, target, reference };
      if (!reference || target !== reference && target.offsetParent !== reference) {
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
        reference,
        referenceRect,
        scaleX,
        scaleY
      );
      let selected = null;
      for (const candidate of candidates) {
        const x = targetRect.left + targetRect.width * candidate.target[0] - selfWidth * candidate.self[0];
        const y = targetRect.top + targetRect.height * candidate.target[1] - selfHeight * candidate.self[1];
        const result = { x, y, self: candidate.self };
        if (!selected) selected = result;
        if (x >= boundaryRect.left && y >= boundaryRect.top && x + selfWidth <= boundaryRect.left + boundaryRect.width && y + selfHeight <= boundaryRect.top + boundaryRect.height) {
          selected = result;
          break;
        }
      }
      const present = target.closest(`[${presentAttribute}]`);
      const opacity = present ? root.getComputedStyle(present).opacity : "1";
      return { valid: true, target, reference, selected, opacity };
    }
    function isInvisible(element) {
      const visibility = root.getComputedStyle(element).visibility;
      if (visibility === "hidden" || visibility === "collapse") return true;
      for (let current = element; current && current.nodeType === 1; current = current.parentElement) {
        const style = root.getComputedStyle(current);
        const inline = current.style;
        if (current.hidden || inline.display === "none" || inline.visibility === "hidden" || inline.visibility === "collapse" || inline.opacity === "0" || style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) return true;
      }
      return false;
    }
    function hideForTarget(element, state, placement) {
      deactivate(element, state);
      state.invalidContext = false;
      if (placement.reference) listenForLayout(state, placement.reference);
    }
    function invalidContext(element, state, placement) {
      deactivate(element, state);
      if (placement.reference)
        listenForLayout(state, placement.reference);
      if (state.invalidContext) return;
      AelluxJs.diagnostics.error(
        AelluxJs.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT,
        { extension: extensionName, element, target: placement.target }
      );
      state.invalidContext = true;
    }
    function observe(state, element, target, reference) {
      if (state.target === target && state.reference === reference) return;
      listenForLayout(state, reference);
      state.target = target;
      if (state.observer) state.observer.disconnect();
      if (state.intersectionObserver) state.intersectionObserver.disconnect();
      for (const observed of /* @__PURE__ */ new Set([element, target, reference])) {
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
    function applyBaseStyles(element) {
      element.style.setProperty("position", "absolute");
      element.style.setProperty("left", "0px");
      element.style.setProperty("top", "0px");
      element.style.setProperty(
        "transform",
        "translate3d(var(--ae-anchor-x, 0px), var(--ae-anchor-y, 0px), 0)"
      );
      element.style.setProperty(
        "transform-origin",
        "var(--ae-anchor-origin-x, 50%) var(--ae-anchor-origin-y, 0%)"
      );
    }
    function deactivate(element, state, memory = elementMemories.get(element)) {
      if (state.reference) AelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
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
      try {
        return document.querySelector(selector);
      } catch (_) {
        return null;
      }
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
})();
//# sourceMappingURL=aellux.ext.anchor.js.map
