/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Viewport observes geometry only. The nearest native scroll container is the
 * reference for both axes; no Scrollbox or presentation extension is required.
 * Reads and writes are batched per reference through the shared scheduler.
 */
(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the viewport extension.");
  const extensionName = "viewport";
  const attribute = AelluxJs.attr(extensionName);
  const properties = ["--ae-viewport-x", "--ae-viewport-y", "--ae-viewport-visible"];
  const document = root.document;
  const states = new Map();
  const groups = new Map();
  const resizeTargets = new Map();
  let nextLayoutId = 6000000;
  let mutations = null, resizeObserver = null;

  AelluxJs.extAttach(extensionName, { init, destroy });

  function init() {
    AelluxJs.registerCssProperty(...properties.map(name =>
      ({ name, syntax: "<number>", initialValue: "0", inherits: false })));
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attribute}]`, mount, update, unmount
    });
  }

  function destroy() {
    for (const element of states.keys()) unmount(element);
    AelluxJs.mountManager.remove({ extensionName });
  }

  function mount(element) {
    if (states.has(element)) return;
    const state = { element, group: null, configuration: null, axes: "both",
      memories: properties.map(property => AelluxJs.persist.element.save(element, [], [property])),
      writtenStyle: null, values: [], resizeTargets: new Set() };
    states.set(element, state);
    if (states.size === 1) startObserving();
    // Discovery belongs to the read phase too. New elements initially share the
    // document batch, then join their own scrollport without synchronous layout.
    join(state, document);
    return update(element);
  }

  async function update(element) {
    const state = states.get(element);
    if (!state) return;
    // A read can transfer the element to another reference and cancel its old
    // batch. Mount/update resolve only after the new group's first publication.
    let group;
    do {
      group = state.group;
      await schedule(group);
    } while (states.get(element) === state && state.group !== group);
  }

  function unmount(element) {
    const state = states.get(element);
    if (!state) return;
    states.delete(element);
    leave(state);
    observeSizes(state, new Set());
    for (const memory of state.memories) memory.restore();
    if (!states.size) stopObserving();
  }

  function startObserving() {
    AelluxJs.onEvent(root, "$resize", scheduleAll);
    AelluxJs.onEvent(document, "$load", scheduleAll, true);
    AelluxJs.onEvent(document, AelluxJs.eventName("Layout"), onLayout);
    if (root.ResizeObserver) resizeObserver = new root.ResizeObserver(scheduleAll);
    if (root.MutationObserver) {
      mutations = new root.MutationObserver(records => {
        if (records.some(record => {
          const state = states.get(record.target);
          return record.type !== "attributes" || record.attributeName !== "style" ||
            !state || record.target.getAttribute("style") !== state.writtenStyle;
        })) scheduleAll();
      });
      mutations.observe(document, { childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: [attribute, "class", "style", "hidden", "open", "width", "height", "src"] });
    }
  }

  function stopObserving() {
    AelluxJs.offEvent(root, "$resize", scheduleAll);
    AelluxJs.offEvent(document, "$load", scheduleAll, true);
    AelluxJs.offEvent(document, AelluxJs.eventName("Layout"), onLayout);
    mutations?.disconnect();
    resizeObserver?.disconnect();
    mutations = resizeObserver = null;
    resizeTargets.clear();
  }

  function onLayout(event) {
    const duration = Number(event.detail?.durationMs);
    for (const group of groups.values()) {
      if (Number.isFinite(duration) && duration > 0)
        group.layoutUntil = Math.max(group.layoutUntil, root.performance.now() + duration);
      schedule(group);
    }
  }

  function scheduleAll() {
    for (const group of groups.values()) schedule(group);
  }

  function join(state, reference) {
    if (state.group?.reference === reference) return;
    leave(state);
    let group = groups.get(reference);
    if (!group) {
      group = { reference, states: new Set(), id: nextLayoutId++, active: true,
        pending: null, dirty: false, timer: null, layoutUntil: 0, intersection: null };
      group.onScroll = () => schedule(group);
      AelluxJs.onEvent(reference === document ? root : reference, "$scroll", group.onScroll, { passive: true });
      if (root.IntersectionObserver) {
        group.intersection = new root.IntersectionObserver(group.onScroll,
          { root: reference === document ? null : reference, threshold: [0, 0.000001, 1] });
      }
      groups.set(reference, group);
    }
    state.group = group;
    group.states.add(state);
    group.intersection?.observe(state.element);
  }

  function leave(state) {
    const group = state.group;
    if (!group) return;
    group.states.delete(state);
    group.intersection?.unobserve(state.element);
    state.group = null;
    if (group.states.size) return;
    group.active = false;
    AelluxJs.waitLayout.cancel(group.id);
    if (group.timer !== null) root.clearTimeout(group.timer);
    group.intersection?.disconnect();
    AelluxJs.offEvent(group.reference === document ? root : group.reference, "$scroll", group.onScroll);
    groups.delete(group.reference);
  }

  function schedule(group) {
    if (!group?.active) return;
    if (group.pending) {
      group.dirty = true;
      return group.pending;
    }
    group.pending = refresh(group).finally(() => {
      group.pending = null;
      if (!group.active) return;
      if (group.dirty) {
        group.dirty = false;
        schedule(group);
      } else if (root.performance.now() < group.layoutUntil && group.timer === null) {
        // Only an explicit, finite Layout transition requests repeated checks.
        group.timer = root.setTimeout(() => {
          group.timer = null;
          schedule(group);
        }, 16);
      }
    });
    return group.pending;
  }

  async function refresh(group) {
    const measurements = await AelluxJs.waitLayout.read(group.id, () => measure(group));
    if (!group.active || !measurements) return;
    await AelluxJs.waitLayout.update(group.id, () => {
      for (const { state, values } of measurements) {
        if (states.get(state.element) !== state || state.group !== group) continue;
        if (values === null) {
          AelluxJs.mountManager.unmount(state.element, extensionName);
          continue;
        }
        for (let index = 0; index < properties.length; index++) {
          if (values[index] === state.values[index]) continue;
          // An unselected axis keeps the author's original inline declaration.
          if (values[index] === null) state.memories[index].restore();
          else state.element.style.setProperty(properties[index], String(values[index]),
            state.memories[index].cssProperties[properties[index]].priority);
        }
        state.values = values;
        state.writtenStyle = state.element.getAttribute("style");
      }
    });
  }

  function measure(group) {
    const measurements = [];
    let viewport;
    for (const state of Array.from(group.states)) {
      const element = state.element;
      // Detached cleanup is owned by mountManager. Never retain/write geometry
      // while its asynchronous unmount pass is still pending.
      if (!element.isConnected) continue;
      if (!element.hasAttribute(attribute)) {
        // Restoration can affect application CSS too; keep it in the write
        // phase instead of interleaving it with other elements' measurements.
        measurements.push({ state, values: null });
        continue;
      }
      const targets = new Set([element]);
      let reference = document;
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        targets.add(parent);
        // A sibling can move the item without changing its size or the
        // scrollport's size (images, fonts and native CSS layout changes).
        for (const sibling of parent.children) targets.add(sibling);
        const rootStyle = parent === document.body ? root.getComputedStyle(document.documentElement) : null;
        const propagatedBody = rootStyle && rootStyle.overflowX === "visible" && rootStyle.overflowY === "visible";
        if (reference === document && parent !== (document.scrollingElement || document.documentElement) &&
            !propagatedBody && scrollable(parent))
          reference = parent;
      }
      observeSizes(state, targets);
      configure(state);
      if (reference !== group.reference) {
        join(state, reference);
        schedule(state.group);
        continue;
      }
      if (!viewport) viewport = viewportRect(reference);
      measurements.push({ state, values: valuesFor(state, viewport) });
    }
    return measurements;
  }

  function configure(state) {
    const value = state.element.getAttribute(attribute);
    if (value === state.configuration) return;
    state.configuration = value;
    state.axes = value === "x" || value === "y" ? value : "both";
    if (value !== "" && value !== "both" && value !== "x" && value !== "y") {
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: extensionName, element: state.element, attribute, value,
        reason: "Unknown viewport axis; using both.",
        suggestion: 'Use an empty value, "both", "x", or "y".'
      });
    }
  }

  function scrollable(element) {
    const style = root.getComputedStyle(element);
    return ["X", "Y"].some(axis => {
      const overflow = style["overflow" + axis];
      return overflow === "auto" || overflow === "scroll" || overflow === "hidden" &&
        element[axis === "X" ? "scrollWidth" : "scrollHeight"] > element[axis === "X" ? "clientWidth" : "clientHeight"];
    });
  }

  function observeSizes(state, targets) {
    if (!resizeObserver) return;
    for (const target of state.resizeTargets) {
      if (targets.has(target)) continue;
      const count = resizeTargets.get(target) - 1;
      if (count) resizeTargets.set(target, count);
      else {
        resizeTargets.delete(target);
        resizeObserver.unobserve(target);
      }
    }
    for (const target of targets) {
      if (state.resizeTargets.has(target)) continue;
      const count = resizeTargets.get(target) || 0;
      if (!count) resizeObserver.observe(target);
      resizeTargets.set(target, count + 1);
    }
    state.resizeTargets = targets;
  }

  function viewportRect(reference) {
    if (reference === document) {
      const scrolling = document.scrollingElement || document.documentElement;
      return { left: 0, top: 0, width: document.documentElement.clientWidth || scrolling.clientWidth || root.innerWidth,
        height: document.documentElement.clientHeight || scrolling.clientHeight || root.innerHeight };
    }
    const rect = reference.getBoundingClientRect();
    const style = root.getComputedStyle(reference);
    // Computed border-box dimensions retain fractions that offsetWidth rounds.
    const borderSize = axis => parseFloat(style[axis]) + (style.boxSizing === "border-box" ? 0 :
      axis === "width" ? parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth) :
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth));
    const width = borderSize("width"), height = borderSize("height");
    const left = parseFloat(style.borderLeftWidth), right = parseFloat(style.borderRightWidth);
    const top = parseFloat(style.borderTopWidth), bottom = parseFloat(style.borderBottomWidth);
    const scaleX = rect.width / width, scaleY = rect.height / height;
    // client/offset sizes are integers. Use them only to detect scrollbar
    // thickness; keep the fractional computed scrollport dimensions intact.
    const scrollbarX = Math.max(0, reference.offsetWidth - reference.clientWidth - Math.round(left + right));
    const scrollbarY = Math.max(0, reference.offsetHeight - reference.clientHeight - Math.round(top + bottom));
    const leftScrollbar = Math.max(0, reference.clientLeft - Math.round(left));
    return { left: rect.left + (left + leftScrollbar) * scaleX,
      top: rect.top + top * scaleY,
      width: Math.max(0, width - left - right - scrollbarX) * scaleX,
      height: Math.max(0, height - top - bottom - scrollbarY) * scaleY };
  }

  function valuesFor(state, viewport) {
    const rect = state.element.getBoundingClientRect();
    let x = 0, y = 0, visible = 0;
    if ([viewport.left, viewport.top, viewport.width, viewport.height, rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) &&
        viewport.width > 0 && viewport.height > 0 && rect.width > 0 && rect.height > 0) {
      x = clamp((rect.left + rect.width / 2 - viewport.left - viewport.width / 2) * 2 / viewport.width, -2, 2);
      y = clamp((rect.top + rect.height / 2 - viewport.top - viewport.height / 2) * 2 / viewport.height, -2, 2);
      const width = Math.max(0, Math.min(rect.right, viewport.left + viewport.width) - Math.max(rect.left, viewport.left));
      const height = Math.max(0, Math.min(rect.bottom, viewport.top + viewport.height) - Math.max(rect.top, viewport.top));
      visible = clamp(width / rect.width * (height / rect.height), 0, 1);
    }
    return [state.axes === "y" ? null : x, state.axes === "x" ? null : y, visible];
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
