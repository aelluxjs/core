(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/aellux.ext.viewport.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the viewport extension.");
    const extensionName = "viewport";
    const attribute = AelluxJs.attr(extensionName);
    const properties = ["--ae-viewport-x", "--ae-viewport-y", "--ae-viewport-visible"];
    const EVENT_EPSILON = 1e-6;
    const document = root.document;
    const states = /* @__PURE__ */ new Map();
    const groups = /* @__PURE__ */ new Map();
    const resizeTargets = /* @__PURE__ */ new Map();
    let nextLayoutId = 6e6;
    let mutations = null, resizeObserver = null;
    AelluxJs.extAttach(extensionName, { init, destroy });
    function init() {
      AelluxJs.registerCssProperty(...properties.map((name) => ({ name, syntax: "<number>", initialValue: "0", inherits: false })));
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${attribute}]`,
        mount,
        update,
        unmount
      });
    }
    function destroy() {
      for (const element of states.keys()) unmount(element);
      AelluxJs.mountManager.remove({ extensionName });
    }
    function mount(element) {
      if (states.has(element)) return;
      const state = {
        element,
        group: null,
        configuration: null,
        axes: "both",
        memories: properties.map((property) => AelluxJs.persist.element.save(element, [], [property])),
        writtenStyle: null,
        values: [],
        snapshot: null,
        unmountRequest: null,
        resizeTargets: /* @__PURE__ */ new Set()
      };
      states.set(element, state);
      if (states.size === 1) startObserving();
      join(state, document);
      return update(element);
    }
    async function update(element) {
      const state = states.get(element);
      if (!state) return;
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
      observeSizes(state, /* @__PURE__ */ new Set());
      for (const memory of state.memories) memory.restore();
      if (!states.size) stopObserving();
    }
    function startObserving() {
      AelluxJs.onEvent(root, "$resize", scheduleAll);
      AelluxJs.onEvent(document, "$load", scheduleAll, true);
      AelluxJs.onEvent(document, AelluxJs.eventName("Layout"), onLayout);
      AelluxJs.onEvent(document, AelluxJs.eventName("BeforeUnmount"), onBeforeUnmount);
      if (root.ResizeObserver) resizeObserver = new root.ResizeObserver(scheduleAll);
      if (root.MutationObserver) {
        mutations = new root.MutationObserver((records) => {
          if (records.some((record) => {
            const state = states.get(record.target);
            return record.type !== "attributes" || record.attributeName !== "style" || !state || record.target.getAttribute("style") !== state.writtenStyle;
          })) scheduleAll();
        });
        mutations.observe(document, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: [attribute, "class", "style", "hidden", "open", "width", "height", "src"]
        });
      }
    }
    function stopObserving() {
      AelluxJs.offEvent(root, "$resize", scheduleAll);
      AelluxJs.offEvent(document, "$load", scheduleAll, true);
      AelluxJs.offEvent(document, AelluxJs.eventName("Layout"), onLayout);
      AelluxJs.offEvent(document, AelluxJs.eventName("BeforeUnmount"), onBeforeUnmount);
      mutations == null ? void 0 : mutations.disconnect();
      resizeObserver == null ? void 0 : resizeObserver.disconnect();
      mutations = resizeObserver = null;
      resizeTargets.clear();
    }
    function onLayout(event) {
      var _a;
      const duration = Number((_a = event.detail) == null ? void 0 : _a.durationMs);
      for (const group of groups.values()) {
        if (Number.isFinite(duration) && duration > 0)
          group.layoutUntil = Math.max(group.layoutUntil, root.performance.now() + duration);
        schedule(group);
      }
    }
    function onBeforeUnmount(event) {
      const { root: subtree, extensions, detachedOnly } = event.detail;
      if (extensions && !extensions.includes(extensionName)) return;
      for (const state of states.values()) {
        if (detachedOnly && state.element.isConnected) continue;
        if (state.element === subtree || subtree.contains(state.element) || subtree === document && !state.element.isConnected) state.unmountRequest = event;
      }
    }
    function current(state, group) {
      return states.get(state.element) === state && state.group === group && state.element.isConnected && state.element.hasAttribute(attribute) && (!state.unmountRequest || state.unmountRequest.defaultPrevented);
    }
    function scheduleAll() {
      for (const group of groups.values()) schedule(group);
    }
    function join(state, reference) {
      var _a, _b;
      if (((_a = state.group) == null ? void 0 : _a.reference) === reference) return;
      leave(state);
      let group = groups.get(reference);
      if (!group) {
        group = {
          reference,
          states: /* @__PURE__ */ new Set(),
          id: nextLayoutId++,
          active: true,
          pending: null,
          dirty: false,
          timer: null,
          layoutUntil: 0,
          intersection: null
        };
        group.onScroll = () => schedule(group);
        AelluxJs.onEvent(reference === document ? root : reference, "$scroll", group.onScroll, { passive: true });
        if (root.IntersectionObserver) {
          group.intersection = new root.IntersectionObserver(
            group.onScroll,
            { root: reference === document ? null : reference, threshold: [0, 1e-6, 1] }
          );
        }
        groups.set(reference, group);
      }
      state.group = group;
      group.states.add(state);
      (_b = group.intersection) == null ? void 0 : _b.observe(state.element);
    }
    function leave(state) {
      var _a, _b;
      const group = state.group;
      if (!group) return;
      group.states.delete(state);
      (_a = group.intersection) == null ? void 0 : _a.unobserve(state.element);
      state.group = null;
      if (group.states.size) return;
      group.active = false;
      AelluxJs.waitLayout.cancel(group.id);
      if (group.timer !== null) root.clearTimeout(group.timer);
      (_b = group.intersection) == null ? void 0 : _b.disconnect();
      AelluxJs.offEvent(group.reference === document ? root : group.reference, "$scroll", group.onScroll);
      groups.delete(group.reference);
    }
    function schedule(group) {
      if (!(group == null ? void 0 : group.active)) return;
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
        for (const { state, values, snapshot, changed } of measurements) {
          if (states.get(state.element) !== state || state.group !== group) continue;
          if (values === null) {
            AelluxJs.mountManager.unmount(state.element, extensionName);
            continue;
          }
          if (!current(state, group)) continue;
          for (let index = 0; index < properties.length; index++) {
            if (values[index] === state.values[index]) continue;
            if (values[index] === null) state.memories[index].restore();
            else state.element.style.setProperty(
              properties[index],
              String(values[index]),
              state.memories[index].cssProperties[properties[index]].priority
            );
          }
          state.values = values;
          state.writtenStyle = state.element.getAttribute("style");
          if (changed) {
            const previous = state.snapshot;
            state.snapshot = snapshot;
            const initial = previous === null;
            const emit = (name) => AelluxJs.dispatchFrom(state.element, name, {
              bubbles: true,
              composed: true,
              cancelable: false,
              detail: __spreadProps(__spreadValues({}, snapshot), { previous: previous && __spreadValues({}, previous), initial })
            });
            emit("ViewportChange");
            if (current(state, group) && snapshot.measurable && snapshot.state !== (previous == null ? void 0 : previous.state)) {
              if (snapshot.state === "inside") emit("ViewportFullyInside");
              else if (snapshot.state === "outside") emit("ViewportFullyOutside");
            }
          }
        }
      });
    }
    function measure(group) {
      const measurements = [];
      let viewport;
      for (const state of Array.from(group.states)) {
        const element = state.element;
        if (!element.isConnected) continue;
        if (!element.hasAttribute(attribute)) {
          measurements.push({ state, values: null });
          continue;
        }
        const targets = /* @__PURE__ */ new Set([element]);
        let reference = document;
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          targets.add(parent);
          for (const sibling of parent.children) targets.add(sibling);
          const rootStyle = parent === document.body ? root.getComputedStyle(document.documentElement) : null;
          const propagatedBody = rootStyle && rootStyle.overflowX === "visible" && rootStyle.overflowY === "visible";
          if (reference === document && parent !== (document.scrollingElement || document.documentElement) && !propagatedBody && scrollable(parent))
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
        const { values, snapshot } = valuesFor(state, viewport);
        measurements.push({ state, values, snapshot, changed: geometryChanged(state.snapshot, snapshot) });
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
          extension: extensionName,
          element: state.element,
          attribute,
          value,
          reason: "Unknown viewport axis; using both.",
          suggestion: 'Use an empty value, "both", "x", or "y".'
        });
      }
    }
    function scrollable(element) {
      const style = root.getComputedStyle(element);
      return ["X", "Y"].some((axis) => {
        const overflow = style["overflow" + axis];
        return overflow === "auto" || overflow === "scroll" || overflow === "hidden" && element[axis === "X" ? "scrollWidth" : "scrollHeight"] > element[axis === "X" ? "clientWidth" : "clientHeight"];
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
        return {
          left: 0,
          top: 0,
          width: document.documentElement.clientWidth || scrolling.clientWidth || root.innerWidth,
          height: document.documentElement.clientHeight || scrolling.clientHeight || root.innerHeight
        };
      }
      const rect = reference.getBoundingClientRect();
      const style = root.getComputedStyle(reference);
      const borderSize = (axis) => parseFloat(style[axis]) + (style.boxSizing === "border-box" ? 0 : axis === "width" ? parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth) : parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth));
      const width = borderSize("width"), height = borderSize("height");
      const left = parseFloat(style.borderLeftWidth), right = parseFloat(style.borderRightWidth);
      const top = parseFloat(style.borderTopWidth), bottom = parseFloat(style.borderBottomWidth);
      const scaleX = rect.width / width, scaleY = rect.height / height;
      const scrollbarX = Math.max(0, reference.offsetWidth - reference.clientWidth - Math.round(left + right));
      const scrollbarY = Math.max(0, reference.offsetHeight - reference.clientHeight - Math.round(top + bottom));
      const leftScrollbar = Math.max(0, reference.clientLeft - Math.round(left));
      return {
        left: rect.left + (left + leftScrollbar) * scaleX,
        top: rect.top + top * scaleY,
        width: Math.max(0, width - left - right - scrollbarX) * scaleX,
        height: Math.max(0, height - top - bottom - scrollbarY) * scaleY
      };
    }
    function valuesFor(state, viewport) {
      const rect = state.element.getBoundingClientRect();
      let x = 0, y = 0, visible = 0;
      const snapshot = {
        viewport: state.group.reference,
        x1: null,
        y1: null,
        x2: null,
        y2: null,
        x: null,
        y: null,
        visible,
        state: null,
        measurable: false
      };
      if ([
        viewport.left,
        viewport.top,
        viewport.width,
        viewport.height,
        rect.left,
        rect.top,
        rect.right,
        rect.bottom,
        rect.width,
        rect.height
      ].every(Number.isFinite) && viewport.width > 0 && viewport.height > 0 && rect.width > 0 && rect.height > 0) {
        const centerX = viewport.left + viewport.width / 2, centerY = viewport.top + viewport.height / 2;
        const x1 = (rect.left - centerX) * 2 / viewport.width, x2 = (rect.right - centerX) * 2 / viewport.width;
        const y1 = (rect.top - centerY) * 2 / viewport.height, y2 = (rect.bottom - centerY) * 2 / viewport.height;
        if (![x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2].every(Number.isFinite))
          return { values: [state.axes === "y" ? null : 0, state.axes === "x" ? null : 0, 0], snapshot };
        snapshot.x1 = x1;
        snapshot.y1 = y1;
        snapshot.x2 = x2;
        snapshot.y2 = y2;
        snapshot.x = (x1 + x2) / 2;
        snapshot.y = (y1 + y2) / 2;
        x = clamp(snapshot.x, -2, 2);
        y = clamp(snapshot.y, -2, 2);
        const width = Math.max(0, Math.min(rect.right, viewport.left + viewport.width) - Math.max(rect.left, viewport.left));
        const height = Math.max(0, Math.min(rect.bottom, viewport.top + viewport.height) - Math.max(rect.top, viewport.top));
        visible = clamp(width / rect.width * (height / rect.height), 0, 1);
        snapshot.visible = visible;
        snapshot.measurable = true;
        snapshot.state = width > 0 && height > 0 ? rect.left >= viewport.left && rect.top >= viewport.top && rect.right <= viewport.left + viewport.width && rect.bottom <= viewport.top + viewport.height ? "inside" : "partial" : "outside";
      }
      return { values: [state.axes === "y" ? null : x, state.axes === "x" ? null : y, visible], snapshot };
    }
    function geometryChanged(previous, snapshot) {
      if (!previous) return snapshot.measurable;
      if (snapshot.viewport !== previous.viewport || snapshot.measurable !== previous.measurable || snapshot.state !== previous.state) return true;
      if (snapshot.measurable && ["x1", "y1", "x2", "y2"].some((key) => [-1, 1].some((edge) => Math.sign(snapshot[key] - edge) !== Math.sign(previous[key] - edge)))) return true;
      return ["x1", "y1", "x2", "y2", "x", "y", "visible"].some((key) => Math.abs(snapshot[key] - previous[key]) > EVENT_EPSILON);
    }
    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.viewport.js.map
