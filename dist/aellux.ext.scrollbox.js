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

  // src/aellux.ext.scrollbox.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "scrollbox";
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the scrollbox extension.");
    const attribute = AelluxJs.attr(extensionName);
    const optionsAttribute = AelluxJs.attr("scrollbox-options");
    const wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
    const dependencyURL = "https://unpkg.com/better-scroll@2.5.1/dist/better-scroll.min.js";
    const dependencyIntegrity = "sha384-4mVyaBOPOLtUq+Cg7YRI7vesPIrJkaN/jQFWuTBl9acmb7D2yiAMXp0pxHVI3qM2";
    const RESIZE_INTERVAL_MS = 100;
    const properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
    const betterScrollProperties = [
      "transform",
      "transform-origin",
      "transition",
      "transition-property",
      "transition-duration",
      "transition-timing-function",
      "transition-delay",
      "will-change",
      "overflow",
      "touch-action"
    ];
    const scrollboxes = /* @__PURE__ */ new Map();
    const defaultOptions = Object.freeze({
      scrollX: false,
      scrollY: true,
      click: true,
      bounce: false,
      momentum: true,
      probeType: 3,
      mouseWheel: true,
      nestedScroll: true,
      scrollbar: {
        fade: true,
        interactive: true,
        scrollbarTrackClickable: true
      }
    });
    AelluxJs.extAttach(extensionName, { init, destroy });
    function init() {
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${attribute}]`,
        mount: mountScrollbox,
        update: updateScrollbox,
        unmount: unmountScrollbox
      });
    }
    function destroy() {
      for (const element of scrollboxes.keys()) unmountScrollbox(element);
      AelluxJs.mountManager.remove({ extensionName });
    }
    async function mountScrollbox(element) {
      if (scrollboxes.has(element)) return;
      const previous = properties.map((name) => ({
        value: element.style.getPropertyValue(name),
        priority: element.style.getPropertyPriority(name)
      }));
      const state = {
        element,
        previous,
        instance: null,
        mode: null,
        optionsText: null,
        parsedOptionsText: null,
        parsedOptions: null,
        wheelEnabled: true,
        desktop: false,
        wheelListening: false,
        disposed: false,
        generation: 0,
        metrics: null,
        axes: null,
        axisTimer: null,
        content: null,
        resizeObserver: null,
        mutationObserver: null,
        savedStyles: null,
        lastResizeTime: -RESIZE_INTERVAL_MS,
        resizeTimeout: null
      };
      state.onScroll = () => {
        if (!state.instance) publish(state);
      };
      state.onWheel = (event) => handleWheel(state, event);
      state.onEnhancedScroll = () => publish(state);
      scrollboxes.set(element, state);
      element.addEventListener("scroll", state.onScroll, { passive: true });
      observe(state);
      await configure(state);
    }
    async function updateScrollbox(element) {
      const state = scrollboxes.get(element);
      if (state) await configure(state);
    }
    function unmountScrollbox(element) {
      const state = scrollboxes.get(element);
      if (!state) return;
      state.disposed = true;
      state.generation++;
      element.removeEventListener("scroll", state.onScroll);
      if (state.wheelListening) element.removeEventListener("wheel", state.onWheel, true);
      if (state.resizeObserver) state.resizeObserver.disconnect();
      if (state.mutationObserver) state.mutationObserver.disconnect();
      if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
      if (state.axisTimer) root.clearTimeout(state.axisTimer);
      root.removeEventListener("resize", state.onResize);
      stopEnhancement(state);
      properties.forEach((name, index) => {
        const original = state.previous[index];
        if (original.value) element.style.setProperty(name, original.value, original.priority);
        else element.style.removeProperty(name);
      });
      scrollboxes.delete(element);
    }
    async function configure(state, force = false) {
      const element = state.element;
      const mode = readMode(element);
      const optionsText = element.getAttribute(optionsAttribute) || "";
      state.wheelEnabled = element.getAttribute(wheelAttribute) !== "false";
      state.desktop = isDesktop();
      if (state.desktop && !state.wheelListening) {
        element.addEventListener("wheel", state.onWheel, { passive: false, capture: true });
        state.wheelListening = true;
      } else if (!state.desktop && state.wheelListening) {
        element.removeEventListener("wheel", state.onWheel, true);
        state.wheelListening = false;
      }
      const shouldEnhance = mode === "enhance" || mode === "auto" && state.desktop;
      const changed = state.mode !== mode || state.optionsText !== optionsText;
      state.mode = mode;
      state.optionsText = optionsText;
      if (!shouldEnhance) {
        stopEnhancement(state);
        refresh(state);
        return;
      }
      if (state.instance && !changed && !force) {
        refresh(state);
        return;
      }
      stopEnhancement(state);
      const generation = ++state.generation;
      if (state.parsedOptionsText !== optionsText) {
        state.parsedOptions = parseOptions(element, optionsText);
        state.parsedOptionsText = optionsText;
      }
      const userOptions = state.parsedOptions;
      try {
        await AelluxJs.dep("better-scroll", dependencyURL, dependencyIntegrity, "anonymous");
      } catch (cause) {
        if (!state.disposed && generation === state.generation) {
          AelluxJs.diagnostics.warn(
            AelluxJs.diagnostics.WARN_SCROLLBOX_ENHANCEMENT_UNAVAILABLE,
            { element, cause }
          );
          refresh(state);
        }
        return;
      }
      if (state.disposed || generation !== state.generation) return;
      const BetterScroll = root.BetterScroll;
      if (!BetterScroll || typeof BetterScroll.createBScroll !== "function") {
        AelluxJs.diagnostics.warn(
          AelluxJs.diagnostics.WARN_SCROLLBOX_ENHANCEMENT_UNAVAILABLE,
          { element, reason: "BetterScroll.createBScroll is unavailable" }
        );
        refresh(state);
        return;
      }
      const content = element.firstElementChild;
      if (!content || content !== element.lastElementChild) {
        AelluxJs.diagnostics.warn(
          AelluxJs.diagnostics.WARN_SCROLLBOX_ENHANCEMENT_UNAVAILABLE,
          { element, reason: "BetterScroll requires one direct content element" }
        );
        refresh(state);
        return;
      }
      const geometry = contentMetrics(element, content);
      const nativeGeometry = nativeMetrics(element);
      if (nativeGeometry.maxX > 1 && geometry.maxX <= 1 || nativeGeometry.maxY > 1 && geometry.maxY <= 1) {
        AelluxJs.diagnostics.warn(
          AelluxJs.diagnostics.WARN_SCROLLBOX_ENHANCEMENT_UNAVAILABLE,
          { element, reason: "Content element must cover the scrollable area" }
        );
        refresh(state);
        return;
      }
      const horizontalOnly = geometry.maxX > 1 && geometry.maxY <= 1;
      const options = __spreadValues(__spreadProps(__spreadValues({}, defaultOptions), {
        scrollX: geometry.maxX > 1,
        scrollY: geometry.maxY > 1,
        mouseWheel: !horizontalOnly && state.desktop
      }), userOptions);
      state.savedStyles = [element, content].map((target) => ({
        target,
        values: betterScrollProperties.map((name) => ({
          value: target.style.getPropertyValue(name),
          priority: target.style.getPropertyPriority(name)
        }))
      }));
      try {
        const instance = BetterScroll.createBScroll(element, options);
        if (!instance || typeof instance.on !== "function" || typeof instance.scrollTo !== "function") {
          if (instance && typeof instance.destroy === "function") instance.destroy();
          throw new TypeError("Invalid BetterScroll instance");
        }
        state.instance = instance;
        state.content = content;
        state.axes = axes(geometry);
        instance.on("scroll", state.onEnhancedScroll);
        instance.on("scrollEnd", state.onEnhancedScroll);
        refresh(state);
      } catch (cause) {
        stopEnhancement(state);
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_SCROLLBOX_ENHANCEMENT_INIT,
          { element, cause }
        );
        refresh(state);
      }
    }
    function stopEnhancement(state) {
      if (state.axisTimer) root.clearTimeout(state.axisTimer);
      state.axisTimer = null;
      state.axes = null;
      state.content = null;
      const instance = state.instance;
      state.instance = null;
      if (instance) {
        try {
          instance.off("scroll", state.onEnhancedScroll);
          instance.off("scrollEnd", state.onEnhancedScroll);
          instance.destroy();
        } catch (cause) {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_SCROLLBOX_ENHANCEMENT_INIT,
            { element: state.element, cause }
          );
        }
      }
      if (state.savedStyles) {
        for (const { target, values } of state.savedStyles) {
          betterScrollProperties.forEach((name, index) => {
            const original = values[index];
            if (original.value) target.style.setProperty(name, original.value, original.priority);
            else target.style.removeProperty(name);
          });
        }
        state.savedStyles = null;
      }
    }
    function readMode(element) {
      const value = (element.getAttribute(attribute) || "auto").trim().toLowerCase();
      if (value === "native" || value === "auto" || value === "enhance") return value;
      AelluxJs.diagnostics.warn(
        AelluxJs.diagnostics.WARN_SCROLLBOX_MODE_INVALID,
        { element, value }
      );
      return "auto";
    }
    function parseOptions(element, text) {
      if (!text.trim()) return {};
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (cause) {
        AelluxJs.diagnostics.warn(
          AelluxJs.diagnostics.WARN_SCROLLBOX_OPTIONS_JSON,
          { element, value: text, cause }
        );
        return {};
      }
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        AelluxJs.diagnostics.warn(
          AelluxJs.diagnostics.WARN_SCROLLBOX_OPTIONS_OBJECT,
          { element, value: text }
        );
        return {};
      }
      return parsed;
    }
    function isDesktop() {
      return !!(root.matchMedia && root.matchMedia("(hover: hover) and (pointer: fine)").matches && (!root.navigator || root.navigator.maxTouchPoints === 0));
    }
    function observe(state) {
      state.onResize = () => scheduleResize(state);
      root.addEventListener("resize", state.onResize, { passive: true });
      if (root.ResizeObserver) {
        state.resizeObserver = new root.ResizeObserver(() => scheduleResize(state));
        state.resizeObserver.observe(state.element);
        for (const child of state.element.children) state.resizeObserver.observe(child);
      }
      if (root.MutationObserver) {
        state.mutationObserver = new root.MutationObserver(() => {
          if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver.observe(state.element);
            for (const child of state.element.children) state.resizeObserver.observe(child);
          }
          refresh(state);
        });
        state.mutationObserver.observe(state.element, { childList: true, subtree: true, characterData: true });
      }
    }
    function scheduleResize(state) {
      if (state.disposed) return;
      const elapsed = now() - state.lastResizeTime;
      if (elapsed >= RESIZE_INTERVAL_MS) {
        if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
        state.resizeTimeout = null;
        flushResize(state);
        return;
      }
      if (state.resizeTimeout !== null) return;
      state.resizeTimeout = root.setTimeout(() => flushResize(state), RESIZE_INTERVAL_MS - elapsed);
    }
    function flushResize(state) {
      state.resizeTimeout = null;
      if (state.disposed) return;
      state.lastResizeTime = now();
      refresh(state);
    }
    function now() {
      return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
    }
    function refresh(state) {
      if (state.disposed) return;
      if (state.instance && state.element.firstElementChild !== state.content) {
        stopEnhancement(state);
        state.metrics = nativeMetrics(state.element);
        publish(state);
        configure(state, true);
        return;
      }
      if (state.instance) state.instance.refresh();
      state.metrics = state.instance ? enhancedMetrics(state.instance) : nativeMetrics(state.element);
      publish(state);
      if (state.instance && !state.axisTimer && axes(contentMetrics(state.element, state.element.firstElementChild)) !== state.axes) {
        state.axisTimer = root.setTimeout(() => {
          state.axisTimer = null;
          if (!state.disposed && state.instance) configure(state, true);
        }, 0);
      }
    }
    function contentMetrics(element, content) {
      return {
        maxX: Math.max(0, content.offsetWidth - element.clientWidth),
        maxY: Math.max(0, content.offsetHeight - element.clientHeight)
      };
    }
    function axes(metrics) {
      return String(metrics.maxX > 1) + ":" + String(metrics.maxY > 1);
    }
    function nativeMetrics(element) {
      return {
        maxX: Math.max(0, element.scrollWidth - element.clientWidth),
        maxY: Math.max(0, element.scrollHeight - element.clientHeight),
        page: element.clientHeight || 1
      };
    }
    function enhancedMetrics(instance) {
      return {
        maxX: Math.max(0, -instance.maxScrollX),
        maxY: Math.max(0, -instance.maxScrollY),
        page: instance.wrapper.clientHeight || 1
      };
    }
    function publish(state) {
      const metrics = state.metrics || nativeMetrics(state.element);
      const x = state.instance ? -state.instance.x : state.element.scrollLeft;
      const y = state.instance ? -state.instance.y : state.element.scrollTop;
      state.element.style.setProperty(properties[0], progress(y, metrics.maxY));
      state.element.style.setProperty(properties[1], progress(x, metrics.maxX));
    }
    function progress(position, distance) {
      return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
    }
    function handleWheel(state, event) {
      if (!state.desktop || event.defaultPrevented) return;
      const metrics = state.metrics;
      if (!metrics || metrics.maxX <= 1 || metrics.maxY > 1) return;
      const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (horizontalIntent && !state.instance) return;
      if (!horizontalIntent && !state.wheelEnabled) return;
      const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
      const delta = (horizontalIntent ? event.deltaX : event.deltaY) * factor;
      if (!delta) return;
      const current = state.instance ? -state.instance.x : state.element.scrollLeft;
      const next = Math.max(0, Math.min(metrics.maxX, current + delta));
      if (next === current) return;
      event.preventDefault();
      if (state.instance) {
        event.stopImmediatePropagation();
        state.instance.scrollTo(-next, state.instance.y, 0);
        publish(state);
      } else {
        state.element.scrollLeft = next;
        publish(state);
      }
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.scrollbox.js.map
