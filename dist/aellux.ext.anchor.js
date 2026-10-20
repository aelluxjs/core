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
    const matchAttribute = AelluxJs.attr("anchor-match");
    const groupAttribute = AelluxJs.attr("present-group");
    const groupAnchorAttribute = AelluxJs.attr("present-group-anchor");
    const layoutEvent = AelluxJs.eventName("Layout");
    const anchoredClass = AelluxJs.className("anchored");
    const switchingClass = AelluxJs.className("anchor-switching");
    const baseProperties = ["position", "left", "top", "transform", "transform-origin"];
    const ownedProperties = [
      ...baseProperties,
      "--ae-anchor-x",
      "--ae-anchor-y",
      ORIGIN_X,
      ORIGIN_Y,
      ANCHOR_OPACITY,
      "--ae-anchor-target-width",
      "--ae-anchor-target-height",
      "--ae-anchor-pivot-x",
      "--ae-anchor-pivot-y"
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
    let mutations = null;
    let weakStyle = null;
    AelluxJs.extAttach(extensionName, { init, destroy });
    function init() {
      weakStyle = document.createElement("style");
      weakStyle.setAttribute(AelluxJs.attr("anchor-style"), "");
      weakStyle.textContent = `
      :where([${attribute}][${matchAttribute}~="width"]) {
        width:var(--ae-anchor-target-width,0px);box-sizing:border-box;
      }
      :where([${attribute}][${matchAttribute}~="height"]) {
        height:var(--ae-anchor-target-height,0px);box-sizing:border-box;
      }
      :where([${attribute}][${matchAttribute}].${anchoredClass}) {
        transform:translate3d(var(--ae-anchor-pivot-x),var(--ae-anchor-pivot-y),0)
          translate(calc(0% - var(--ae-anchor-origin-x)),calc(0% - var(--ae-anchor-origin-y)));
      }
      :where([${attribute}].${switchingClass}) {
        transition-property:transform,width,height;
        transition-duration:var(--ae-anchor-switch-duration,0ms);
        transition-timing-function:var(--ae-anchor-switch-ease,ease-in-out);transition-delay:0s;
      }
      :where(html[${AelluxJs.attr("reduced-motion")}="reduced"] [${attribute}].${switchingClass}) {transition:none;}
    `.replace(/\s*([{};:,])\s*/g, "$1").replace(/;}/g, "}").trim();
      document.head.appendChild(weakStyle);
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
      weakStyle == null ? void 0 : weakStyle.remove();
      weakStyle = null;
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
        group: null,
        conflict: false,
        lastPlacement: null,
        switchTimer: null,
        interruptSwitch: false,
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
        AelluxJs.on("PresentGroupChange", onGroupChange);
        if (typeof root.MutationObserver === "function") {
          mutations = new root.MutationObserver(() => {
            refreshAssociations();
            for (const anchor of anchors.keys()) scheduleAnchor(anchor);
          });
          mutations.observe(document, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: [
              attribute,
              targetAttribute,
              matchAttribute,
              groupAttribute,
              groupAnchorAttribute,
              AelluxJs.attr("reduced-motion"),
              "id",
              "hidden"
            ]
          });
        }
      }
      if (typeof root.ResizeObserver === "function") {
        state.observer = new root.ResizeObserver((entries) => {
          if (state.switchTimer !== null && entries.every((entry) => entry.target === element)) return;
          scheduleAnchor(element);
        });
      }
      if (typeof root.IntersectionObserver === "function") {
        state.intersectionObserver = new root.IntersectionObserver(() => scheduleAnchor(element));
      }
      refreshAssociations();
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
    function scheduleUpdate() {
      if (!anchors.size) return;
      for (const [element, state] of anchors) {
        state.interruptSwitch = true;
        scheduleAnchor(element);
      }
    }
    function onGroupChange(event) {
      var _a;
      for (const [element, state] of anchors)
        if (state.group === ((_a = event.detail) == null ? void 0 : _a.group)) scheduleAnchor(element);
    }
    function associationDiagnostic(group, reason) {
      AelluxJs.diagnostics.warn(
        AelluxJs.diagnostics.WARN_ANCHOR_GROUP,
        { extension: extensionName, element: group, reason }
      );
    }
    function refreshAssociations() {
      for (const state of anchors.values()) {
        state.group = null;
        state.conflict = false;
      }
      for (const group of document.querySelectorAll(`[${groupAttribute}][${groupAnchorAttribute}]`)) {
        const id = (group.getAttribute(groupAnchorAttribute) || "").replace(/^#/, "");
        const element = id && !/\s/.test(id) ? document.getElementById(id) : null;
        if (!element || !element.hasAttribute(attribute)) {
          associationDiagnostic(group, "Expected an existing Anchor ID.");
          continue;
        }
        const state = anchors.get(element);
        if (!state) continue;
        if (state.group) {
          state.conflict = true;
          associationDiagnostic(group, "Multiple groups reference the same Anchor.");
        } else state.group = group;
      }
    }
    function effectiveTarget(element, state) {
      var _a, _b;
      if (state.conflict) return null;
      if (state.group) return ((_b = (_a = AelluxJs.ext.present) == null ? void 0 : _a.selected) == null ? void 0 : _b.call(_a, state.group)) || null;
      const value = element.getAttribute(targetAttribute);
      return value && value.trim() ? resolveElement(value) : element.offsetParent;
    }
    function circularTarget(element, target) {
      const visited = /* @__PURE__ */ new Set([element]);
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
      const target = effectiveTarget(element, state);
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
          () => current() ? readPlacement(element, target, candidates, true) : null
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
        const previous = state.lastPlacement;
        const switching = previous && previous.target !== placement.target;
        const moved = !previous || previous.signature !== placement.signature;
        if (switching && placement.duration > 0 && !state.interruptSwitch) {
          startSwitch(element, state, placement.duration);
        } else if (moved || state.interruptSwitch || !placement.duration) stopSwitch(element, state);
        state.interruptSwitch = false;
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
        for (const name of baseProperties) element.style.removeProperty(name);
        element.classList.add(anchoredClass);
        state.lastUpdateAt = now();
        state.lastPlacement = placement;
        applied = true;
      });
      if (!applied && anchors.get(element) === state) return updateAnchor(element, ensureLatest);
    }
    function readPlacement(element, target, candidates, measure) {
      const reference = element.offsetParent;
      target = target || reference;
      const presenting = anchors.get(element).group && (target == null ? void 0 : target.hasAttribute(presentAttribute)) ? target : null;
      if (target && isInvisible(target, presenting)) return { hidden: true, target, reference };
      if (!reference || target !== reference && target.offsetParent !== reference) {
        return { valid: false, target, reference };
      }
      const style = root.getComputedStyle(element);
      const tokens = (element.getAttribute(matchAttribute) || "").trim().split(/\s+/).filter(Boolean);
      if (element.hasAttribute(matchAttribute) && (!tokens.length || tokens.some((token) => token !== "width" && token !== "height")))
        AelluxJs.diagnostics.warn(
          AelluxJs.diagnostics.WARN_ANCHOR_MATCH,
          { extension: extensionName, element, value: element.getAttribute(matchAttribute) }
        );
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
      const projectSize = (axis, actual, desired) => {
        if (!tokens.includes(axis) || element.style[axis]) return actual;
        const previous = parseFloat(element.style.getPropertyValue(`--ae-anchor-target-${axis}`)) || 0;
        const sides = axis === "width" ? ["Left", "Right"] : ["Top", "Bottom"];
        const extra = sides.reduce((sum, side) => sum + (parseFloat(style[`padding${side}`]) || 0) + (parseFloat(style[`border${side}Width`]) || 0), 0);
        const borderBox = style.boxSizing === "border-box";
        const minimum = Math.max(borderBox ? extra : 0, parseFloat(style.getPropertyValue(`min-${axis}`)) || 0);
        const maximum = parseFloat(style.getPropertyValue(`max-${axis}`));
        const constrain = (value) => Math.max(minimum, Math.min(Number.isFinite(maximum) ? maximum : Infinity, value));
        return anchors.get(element).switchTimer === null && Math.abs(parseFloat(style[axis]) - constrain(previous)) > 0.5 ? actual : constrain(desired) + (borderBox ? 0 : extra);
      };
      const selfWidth = projectSize("width", selfRect.width / scaleX, targetRect.width);
      const selfHeight = projectSize("height", selfRect.height / scaleY, targetRect.height);
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
        const result = {
          x,
          y,
          self: candidate.self,
          pivotX: targetRect.left + targetRect.width * candidate.target[0],
          pivotY: targetRect.top + targetRect.height * candidate.target[1]
        };
        if (!selected) selected = result;
        if (x >= boundaryRect.left && y >= boundaryRect.top && x + selfWidth <= boundaryRect.left + boundaryRect.width && y + selfHeight <= boundaryRect.top + boundaryRect.height) {
          selected = result;
          break;
        }
      }
      const present = target.closest(`[${presentAttribute}]`);
      const opacity = present ? root.getComputedStyle(present).opacity : "1";
      const rawDuration = style.getPropertyValue("--ae-anchor-switch-duration").trim();
      const duration = AelluxJs.currentPreference("reduced-motion") === "reduced" ? 0 : Math.max(0, (parseFloat(rawDuration) || 0) * (rawDuration.endsWith("ms") ? 1 : 1e3));
      return {
        valid: true,
        target,
        reference,
        selected,
        opacity,
        duration,
        width: targetRect.width,
        height: targetRect.height,
        signature: [selected.x, selected.y, targetRect.width, targetRect.height, ...selected.self].join("/")
      };
    }
    function isInvisible(element, presenting) {
      const visibility = root.getComputedStyle(element).visibility;
      if (visibility === "hidden" || visibility === "collapse") return true;
      for (let current = element; current && current.nodeType === 1; current = current.parentElement) {
        const style = root.getComputedStyle(current);
        const inline = current.style;
        if (current.hidden || inline.display === "none" || inline.visibility === "hidden" || inline.visibility === "collapse" || current !== presenting && inline.opacity === "0" || style.display === "none" || style.contentVisibility === "hidden" || current !== presenting && Number(style.opacity) === 0) return true;
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
      stopSwitch(element, state);
      if (state.reference) AelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
      if (state.observer) state.observer.disconnect();
      if (state.intersectionObserver) state.intersectionObserver.disconnect();
      state.target = state.reference = null;
      element.classList.remove(anchoredClass);
      if (state.active && memory) memory.restore();
      state.active = false;
      state.lastPlacement = null;
    }
    function stopSwitch(element, state) {
      if (state.switchTimer !== null) root.clearTimeout(state.switchTimer);
      state.switchTimer = null;
      element.classList.remove(switchingClass);
    }
    function setValue(style, name, value) {
      if (style.getPropertyPriority(name)) style.removeProperty(name);
      style.setProperty(name, value);
    }
    function startSwitch(element, state, duration) {
      if (state.switchTimer !== null) root.clearTimeout(state.switchTimer);
      element.classList.add(switchingClass);
      state.switchTimer = root.setTimeout(() => {
        if (anchors.get(element) !== state) return;
        stopSwitch(element, state);
        scheduleAnchor(element);
      }, duration + 100);
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
