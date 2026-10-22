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

  // src/internal/parse-overflow-marquee-limit.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function parseOverflowMarqueeLimit(value) {
    const text = (value || "").trim();
    if (!text) return null;
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)(?:px)?$/i.test(text)) return void 0;
    const limit = parseFloat(text);
    return Number.isFinite(limit) ? limit : void 0;
  }

  // src/internal/create-overflow-marquee.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createOverflowMarquee(root, api, anchor) {
    var _a;
    const attribute = api.attr("overflow-marquee");
    const contentAttribute = api.attr("overflow-marquee-content");
    const activeAttribute = api.attr("overflow-marquee-active");
    const readyAttribute = api.attr("overflow-marquee-ready");
    const viewportAttribute = api.attr("overflow-marquee-viewport");
    const fadeAttribute = api.attr("overflow-marquee-fade");
    const offsetProperty = "--ae-overflow-marquee-offset";
    const reducedAttribute = api.attr("reduced-motion");
    const selector = `[${attribute}]`;
    const states = /* @__PURE__ */ new Map();
    const desktop = (_a = root.matchMedia) == null ? void 0 : _a.call(root, "(any-hover: hover) and (any-pointer: fine)");
    let observer = null;
    return { selector, mount, unmount, update, destroy };
    function listenMedia(add) {
      if (desktop == null ? void 0 : desktop.addEventListener) desktop[add ? "addEventListener" : "removeEventListener"]("change", refreshAll);
      else if (desktop == null ? void 0 : desktop.addListener) desktop[add ? "addListener" : "removeListener"](refreshAll);
    }
    function refreshAll(event) {
      for (const [element, state] of states)
        if (state.enabled || (event == null ? void 0 : event.type) === "resize" || (event == null ? void 0 : event.type) === "loadingdone") schedule(element);
    }
    function motionChanged(event) {
      for (const [element, state] of states) {
        if (!state.enabled) continue;
        if (event.target !== state.wrapper && event.target !== state.viewport && (event.target.contains(element) || element.contains(event.target))) schedule(element);
      }
    }
    function visible(state) {
      if (!state.element.isConnected || root.document.hidden || state.intersecting === false || anchor.invisible(state.wrapper.isConnected ? state.wrapper : state.element)) return false;
      const bounds = state.element.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.right > 0 && bounds.bottom > 0 && bounds.left < root.innerWidth && bounds.top < root.innerHeight;
    }
    function interacting(state) {
      return state.element.contains(root.document.activeElement) || !!((desktop == null ? void 0 : desktop.matches) && state.element.matches(":hover"));
    }
    function canRun(state) {
      return visible(state) && !interacting(state);
    }
    async function mount(element) {
      var _a2, _b;
      if (states.has(element)) return;
      const wrapper = root.document.createElement("span");
      const viewport = root.document.createElement("span");
      viewport.setAttribute(viewportAttribute, "");
      wrapper.setAttribute(contentAttribute, "top-left:top-left");
      const state = {
        element,
        wrapper,
        viewport,
        revision: 0,
        signature: null,
        pending: null,
        dirty: false,
        timer: null,
        motionId: api.motion.id(),
        layoutId: api.motion.id(),
        cycleId: api.motion.id(),
        ownedTitle: null,
        paused: true,
        intersecting: root.IntersectionObserver ? false : null,
        phase: "wait",
        x: 0,
        memory: api.persist.element.save(element, [activeAttribute, readyAttribute]),
        resize: null,
        intersection: null,
        enabled: false,
        probeStyle: void 0
      };
      states.set(element, state);
      state.onInteraction = () => schedule(element);
      if (states.size === 1) {
        if (root.MutationObserver) {
          observer = new root.MutationObserver((records) => {
            for (const [host, value] of states) {
              if (records.some((record) => {
                const node = record.target;
                if ((node === value.wrapper || node === value.viewport) && record.type === "attributes") return false;
                if (record.type === "attributes" && node === host && record.attributeName === activeAttribute) return false;
                if (record.type === "attributes" && node === host && record.attributeName === "style" && host.getAttribute("style") === value.probeStyle) return false;
                if (!value.enabled && record.type === "attributes" && [fadeAttribute, reducedAttribute, "dir"].includes(record.attributeName)) return false;
                return node === root.document.documentElement || host.contains(node) || node.contains(host);
              })) schedule(host);
            }
          });
          observer.observe(root.document, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: [attribute, fadeAttribute, reducedAttribute, "class", "style", "hidden", "dir"]
          });
        }
        root.document.addEventListener("visibilitychange", refreshAll);
        for (const name of ["transitionend", "transitioncancel", "animationstart", "animationend", "animationcancel"])
          root.document.addEventListener(name, motionChanged, true);
        root.addEventListener("resize", refreshAll);
        root.addEventListener("scroll", refreshAll, { capture: true, passive: true });
        (_b = (_a2 = root.document.fonts) == null ? void 0 : _a2.addEventListener) == null ? void 0 : _b.call(_a2, "loadingdone", refreshAll);
        listenMedia(true);
      }
      if (root.ResizeObserver) {
        state.resize = new root.ResizeObserver(() => schedule(element));
        state.resize.observe(element);
      }
      if (root.IntersectionObserver) {
        state.intersection = new root.IntersectionObserver((entries) => {
          const entry = entries[entries.length - 1];
          state.intersecting = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
          schedule(element);
        }, { threshold: [0, 1e-6] });
      }
      await update(element);
    }
    function unwrap(state) {
      if (state.viewport.parentNode !== state.element) return;
      reconcile(state);
      while (state.wrapper.firstChild) state.element.insertBefore(state.wrapper.firstChild, state.viewport);
      state.viewport.remove();
    }
    function enable(state, enabled) {
      var _a2, _b, _c, _d;
      if (state.enabled === enabled) return;
      state.enabled = enabled;
      const { element, wrapper } = state;
      for (const name of ["mouseenter", "mouseleave", "focusin", "focusout"])
        element[enabled ? "addEventListener" : "removeEventListener"](name, state.onInteraction);
      if (enabled) {
        element.setAttribute(readyAttribute, "");
        reconcile(state);
        anchor.mount(wrapper);
        (_a2 = state.resize) == null ? void 0 : _a2.observe(wrapper);
        (_b = state.intersection) == null ? void 0 : _b.observe(element);
      } else {
        stop(state);
        state.paused = true;
        state.signature = null;
        state.placements = null;
        (_c = state.resize) == null ? void 0 : _c.unobserve(wrapper);
        (_d = state.intersection) == null ? void 0 : _d.disconnect();
        state.intersecting = root.IntersectionObserver ? false : null;
        anchor.unmount(wrapper);
        unwrap(state);
        tooltip(state, null);
        element.removeAttribute(activeAttribute);
        element.removeAttribute(readyAttribute);
      }
    }
    function exceedsLimit(state, limit) {
      const { element, wrapper } = state;
      state.probeStyle = element.getAttribute("style");
      try {
        element.style.setProperty("white-space", "nowrap", "important");
        const range = root.document.createRange();
        range.selectNodeContents(state.viewport.parentNode === element && wrapper.parentNode === state.viewport ? wrapper : element);
        const bounds = range.getBoundingClientRect();
        const lineHeight = element.textContent.trim() ? parseFloat(root.getComputedStyle(element).lineHeight) || 0 : 0;
        return bounds.width > limit || Math.max(bounds.height, lineHeight) > limit;
      } finally {
        if (state.probeStyle === null) {
          element.getAttribute("style");
          element.removeAttribute("style");
        } else element.setAttribute("style", state.probeStyle);
      }
    }
    function reconcile(state) {
      const { element, wrapper, viewport } = state;
      if (viewport.parentNode !== element || wrapper.parentNode !== viewport) wrapper.textContent = "";
      if (viewport.parentNode === element && wrapper.parentNode === viewport && element.childNodes.length === 1 && viewport.childNodes.length === 1) return;
      const contents = root.document.createDocumentFragment();
      const collect = (parent) => {
        for (const node of Array.from(parent.childNodes)) {
          if (node === viewport || node === wrapper) collect(node);
          else contents.appendChild(node);
        }
      };
      collect(element);
      wrapper.appendChild(contents);
      viewport.appendChild(wrapper);
      element.appendChild(viewport);
    }
    function schedule(element) {
      const state = states.get(element);
      if (!state) return;
      rememberProgress(state);
      if (state.enabled) {
        if (!visible(state)) {
          pause(state);
          return;
        }
        if (interacting(state)) pause(state);
      }
      update(element).catch((cause) => api.diagnostics.error(
        api.diagnostics.ERROR_EXTENSION_MOUNT,
        { extension: "overflow-marquee", element, method: "update", cause }
      ));
    }
    function update(element) {
      const state = states.get(element);
      if (!state) return Promise.resolve();
      if (state.pending) {
        state.dirty = true;
        return state.pending;
      }
      state.pending = refresh(state).finally(() => {
        state.pending = null;
        if (state.dirty && states.get(element) === state) {
          state.dirty = false;
          schedule(element);
        }
      });
      return state.pending;
    }
    async function refresh(state) {
      const { element, wrapper, layoutId } = state;
      const alive = () => states.get(element) === state;
      rememberProgress(state);
      if (state.enabled && !visible(state)) {
        pause(state);
        return;
      }
      const limit = parseOverflowMarqueeLimit(element.getAttribute(attribute));
      if (limit != null) {
        const eligible = await api.waitLayout.read(layoutId, () => alive() && exceedsLimit(state, limit));
        if (!alive()) return;
        if (!eligible) {
          await api.waitLayout.update(layoutId, () => {
            if (alive()) enable(state, false);
          });
          return;
        }
      }
      if (!state.enabled) await api.waitLayout.update(layoutId, () => {
        if (alive()) enable(state, true);
      });
      if (!alive()) return;
      if (!visible(state)) {
        pause(state);
        return;
      }
      if (interacting(state)) pause(state);
      await api.waitLayout.update(layoutId, () => {
        if (alive()) reconcile(state);
      });
      if (!alive()) return;
      const measured = await api.waitLayout.read(layoutId, () => {
        const style = root.getComputedStyle(element);
        const padding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
        const width = element.clientWidth - padding;
        const content = wrapper.scrollWidth;
        const overflow = content > width + 1;
        const reduced = api.currentPreference("reduced-motion") === "reduced";
        const rawSpeed = Number(style.getPropertyValue("--ae-overflow-marquee-speed").trim());
        const rawDelay = style.getPropertyValue("--ae-overflow-marquee-delay").trim();
        const delayValue = /^(?:\d+(?:\.\d+)?|\.\d+)(ms|s)$/.exec(rawDelay);
        return {
          width,
          content,
          overflow,
          active: overflow && !reduced,
          fade: element.getAttribute(fadeAttribute) !== "false",
          speed: Number.isFinite(rawSpeed) && rawSpeed > 0 ? rawSpeed : 30,
          delay: delayValue ? parseFloat(rawDelay) * (delayValue[1] === "s" ? 1e3 : 1) : 1200,
          direction: style.direction,
          text: wrapper.textContent.replace(/\s+/g, " ").trim()
        };
      });
      if (!alive() || !measured) return;
      const signature = JSON.stringify(__spreadProps(__spreadValues({}, measured), { fade: void 0 }));
      await api.waitLayout.update(layoutId, () => {
        var _a2;
        if (!alive()) return;
        tooltip(state, measured.overflow && (desktop == null ? void 0 : desktop.matches) ? measured.text : null);
        state.viewport.setAttribute(viewportAttribute, measured.overflow && measured.fade && (!measured.active || typeof ((_a2 = root.CSS) == null ? void 0 : _a2.registerProperty) === "function") ? "fade" : "");
        if (signature === state.signature) return;
        stop(state);
        state.signature = signature;
        state.measured = measured;
        state.placements = null;
        state.phase = "wait";
        state.remaining = measured.delay;
        state.x = 0;
        wrapper.style.transition = "none";
        wrapper.setAttribute(contentAttribute, "top-left:top-left");
        wrapper.style.setProperty("--ae-anchor-x", "0px");
        state.viewport.style.transition = "none";
        state.viewport.style.setProperty(offsetProperty, "0px");
        state.viewport.style.setProperty("--ae-overflow-marquee-distance", `${Math.max(0, measured.content - measured.width)}px`);
        state.viewport.setAttribute("dir", measured.direction);
        element.toggleAttribute ? element.toggleAttribute(activeAttribute, measured.active) : measured.active ? element.setAttribute(activeAttribute, "") : element.removeAttribute(activeAttribute);
      });
      if (!alive() || signature !== state.signature || !measured.active || state.timer !== null || state.running) return;
      if (!canRun(state)) {
        pause(state);
        return;
      }
      const revision = state.revision;
      const placements = state.placements || await api.waitLayout.read(layoutId, () => {
        const start = anchor.measure(wrapper, false);
        const end = anchor.measure(wrapper, true);
        if (!(start == null ? void 0 : start.valid) || !(end == null ? void 0 : end.valid)) return null;
        const distance = Math.max(0, start.selected.x - end.selected.x);
        const rtl = measured.direction === "rtl";
        const placement = (base, x) => __spreadProps(__spreadValues({}, base), { selected: __spreadProps(__spreadValues({}, base.selected), { x, y: 0 }) });
        return { start: placement(rtl ? end : start, 0), end: placement(rtl ? start : end, rtl ? distance : -distance), distance };
      });
      if (!alive() || revision !== state.revision || !placements) return;
      await api.waitLayout.update(layoutId, () => {
        if (!alive() || revision !== state.revision) return;
        state.placements = placements;
        state.viewport.style.setProperty("--ae-overflow-marquee-distance", `${placements.distance}px`);
        if (!canRun(state)) {
          pause(state);
          return;
        }
        state.paused = false;
        anchor.place(wrapper, at(state, state.x));
        if (state.phase === "travel") cycle(state);
        else wait(state);
      });
    }
    function at(state, x) {
      const base = state.placements.start;
      return __spreadProps(__spreadValues({}, base), { selected: __spreadProps(__spreadValues({}, base.selected), { x }) });
    }
    function freezeFade(state) {
      state.viewport.style.transition = "none";
      state.viewport.style.setProperty(offsetProperty, `${Math.abs(state.x)}px`);
    }
    function wait(state) {
      const revision = state.revision;
      state.deadline = now() + state.remaining;
      state.timer = root.setTimeout(() => {
        if (revision === state.revision && states.get(state.element) === state) cycle(state);
      }, state.remaining);
    }
    function now() {
      return root.performance.now();
    }
    function rememberProgress(state) {
      var _a2;
      if (!state.running || state.started === void 0) return;
      const time = (_a2 = state.animation) == null ? void 0 : _a2.currentTime;
      if (time != null) state.elapsed = Number(time);
      else if (!state.controlled) state.elapsed = now() - state.started;
      const progress = state.duration > 0 ? Math.min(1, (state.elapsed || 0) / state.duration) : 1;
      state.x = state.from + (state.placements.end.selected.x - state.from) * progress;
    }
    function pause(state) {
      if (state.paused) return;
      rememberProgress(state);
      if (state.timer !== null) state.remaining = Math.max(0, state.deadline - now());
      stop(state);
      state.paused = true;
      state.wrapper.style.transition = "none";
      freezeFade(state);
      if (state.placements) anchor.place(state.wrapper, at(state, state.x));
    }
    function tooltip(state, text) {
      const element = state.element;
      if (state.ownedTitle !== null && element.getAttribute("title") !== state.ownedTitle) state.ownedTitle = null;
      if (!text) {
        if (state.ownedTitle !== null) element.removeAttribute("title");
        state.ownedTitle = null;
      } else if (state.ownedTitle !== null || !element.hasAttribute("title")) {
        if (element.getAttribute("title") !== text) element.setAttribute("title", text);
        state.ownedTitle = text;
      }
    }
    async function cycle(state) {
      const { measured, placements } = state;
      const revision = state.revision;
      const current = () => states.get(state.element) === state && revision === state.revision;
      state.timer = null;
      if (!current()) return;
      state.remaining = 0;
      if (!canRun(state)) {
        pause(state);
        return;
      }
      state.running = true;
      state.started = void 0;
      try {
        if (state.phase === "end") {
          await api.waitLayout.update(state.cycleId, () => {
            if (!current()) return;
            state.wrapper.style.transition = "none";
            state.wrapper.setAttribute(contentAttribute, "top-left:top-left");
            state.x = 0;
            freezeFade(state);
            anchor.place(state.wrapper, placements.start);
            state.phase = "wait";
            state.running = false;
            state.remaining = measured.delay;
            if (canRun(state)) wait(state);
            else pause(state);
          });
          return;
        }
        state.phase = "travel";
        const duration = Math.abs(placements.end.selected.x - state.x) / measured.speed * 1e3;
        await api.waitLayout.read(state.cycleId, () => {
          root.getComputedStyle(state.viewport).getPropertyValue(offsetProperty);
          return root.getComputedStyle(state.wrapper).transform;
        });
        if (!current()) return;
        if (!canRun(state)) {
          pause(state);
          return;
        }
        state.from = state.x;
        state.duration = duration;
        state.elapsed = 0;
        state.animation = null;
        state.controlled = api.motion.supported(state.wrapper);
        state.started = now();
        const completion = api.motion.run(state.viewport, {
          id: state.motionId,
          subtree: true,
          nativeDuration: duration,
          maxFPS: api.layoutMaxFPS(state.element),
          abort() {
            rememberProgress(state);
            return !current();
          },
          apply() {
            state.wrapper.style.transition = `transform ${duration}ms linear`;
            state.viewport.style.transition = `${offsetProperty} ${duration}ms linear`;
            state.viewport.style.setProperty(offsetProperty, `${placements.distance}px`);
            state.wrapper.setAttribute(contentAttribute, "bottom-right:bottom-right");
            anchor.place(state.wrapper, placements.end);
          }
        });
        await api.waitLayout.read(state.cycleId, () => {
          var _a2, _b;
          if (current()) state.animation = ((_b = (_a2 = state.wrapper).getAnimations) == null ? void 0 : _b.call(_a2).find((animation) => animation.transitionProperty === "transform")) || null;
        });
        const result = await completion;
        if (!current() || result.status !== "completed") return;
        await api.waitLayout.update(state.cycleId, () => {
          if (!current()) return;
          state.wrapper.style.transition = "none";
          anchor.place(state.wrapper, placements.end);
          state.running = false;
          state.x = placements.end.selected.x;
          freezeFade(state);
          state.animation = null;
          state.phase = "end";
          state.remaining = measured.delay;
          if (canRun(state)) wait(state);
          else pause(state);
        });
      } catch (cause) {
        if (current()) api.diagnostics.error(
          api.diagnostics.ERROR_EXTENSION_TRANSITION,
          { extension: "overflow-marquee", element: state.element, cause }
        );
      } finally {
        if (current()) state.running = false;
      }
    }
    function stop(state) {
      state.revision++;
      if (state.timer !== null) root.clearTimeout(state.timer);
      state.timer = null;
      state.running = false;
      api.motion.cancel(state.motionId);
      api.waitLayout.cancel(state.cycleId);
      state.animation = null;
    }
    async function unmount(element) {
      var _a2, _b, _c, _d;
      const state = states.get(element);
      if (!state) return;
      states.delete(element);
      stop(state);
      api.waitLayout.cancel(state.layoutId);
      (_a2 = state.resize) == null ? void 0 : _a2.disconnect();
      (_b = state.intersection) == null ? void 0 : _b.disconnect();
      for (const name of ["mouseenter", "mouseleave", "focusin", "focusout"])
        element.removeEventListener(name, state.onInteraction);
      await anchor.unmount(state.wrapper);
      unwrap(state);
      tooltip(state, null);
      state.memory.restore();
      if (!states.size) {
        observer == null ? void 0 : observer.disconnect();
        observer = null;
        root.document.removeEventListener("visibilitychange", refreshAll);
        for (const name of ["transitionend", "transitioncancel", "animationstart", "animationend", "animationcancel"])
          root.document.removeEventListener(name, motionChanged, true);
        root.removeEventListener("resize", refreshAll);
        root.removeEventListener("scroll", refreshAll, true);
        (_d = (_c = root.document.fonts) == null ? void 0 : _c.removeEventListener) == null ? void 0 : _d.call(_c, "loadingdone", refreshAll);
        listenMedia(false);
      }
    }
    async function destroy() {
      for (const element of Array.from(states.keys())) await unmount(element);
    }
  }

  // src/aellux.ext.overflow-marquee.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const api = root.AelluxJs;
    const extensionName = "overflow-marquee";
    if (!api) throw new Error("[aellux.js] Load the boot script before the overflow-marquee extension.");
    let marquee = null, placements = null;
    api.extAttach(extensionName, { init, destroy });
    async function init() {
      if (!api.registry.ext.anchor) api.ext("anchor");
      const anchor = await api.wait("anchor");
      if (!(anchor == null ? void 0 : anchor.createPlacementMap)) throw new Error("[aellux.js] Overflow Marquee requires Anchor's placement map.");
      placements = anchor.createPlacementMap();
      marquee = createOverflowMarquee(root, api, __spreadProps(__spreadValues({}, placements), {
        measure: (element, end) => placements.measure(element, end ? "bottom-right:bottom-right" : "top-left:top-left")
      }));
      api.registerCssProperty(
        { name: "--ae-overflow-marquee-speed", syntax: "<number>", initialValue: "30" },
        { name: "--ae-overflow-marquee-delay", syntax: "<time>", initialValue: "1200ms" },
        { name: "--ae-overflow-marquee-fade-size", syntax: "<length>", initialValue: "16px" },
        { name: "--ae-overflow-marquee-offset", syntax: "<length>", initialValue: "0px", inherits: false }
      );
      api.mountManager.add({
        extensionName,
        selector: marquee.selector,
        mount: marquee.mount,
        unmount: marquee.unmount,
        update: marquee.update
      });
    }
    async function destroy() {
      await (marquee == null ? void 0 : marquee.destroy());
      placements == null ? void 0 : placements.destroy();
      api.mountManager.remove({ extensionName });
      marquee = placements = null;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.overflow-marquee.js.map
