(() => {
  // src/aellux.ext.progress.js
  (function(root) {
    "use strict";
    const aelluxJs = root.aelluxJs;
    const extensionName = "progress";
    if (!aelluxJs) throw new Error("[aellux.js] Load the boot script before the progress Extension.");
    const targetAttribute = aelluxJs.attr("progress-target");
    const mounted = /* @__PURE__ */ new Map();
    aelluxJs.extAttach(extensionName, { init, destroy });
    function init() {
      aelluxJs.mountManager.add({
        extensionName,
        selector: "progress, meter",
        priority: -1,
        mount,
        unmount,
        update: connect
      });
    }
    function destroy() {
      aelluxJs.mountManager.remove({ extensionName });
      for (const element of mounted.keys()) unmount(element);
    }
    function mount(element) {
      if (mounted.has(element)) return;
      const state = {
        target: null,
        memory: aelluxJs.persist.element.save(element, ["value"]),
        fallback: false ? installProgressFallback(root, element) : null,
        observer: null,
        listener: null
      };
      state.listener = (event) => {
        if (!element.isConnected || !mounted.has(element)) return;
        const detail = event.detail;
        if (!detail || typeof detail.value !== "number" || typeof detail.max !== "number" || !Number.isFinite(detail.value) || !Number.isFinite(detail.max) || detail.max <= 0 || detail.value < 0 || detail.value > detail.max) return;
        const max = element.max;
        if (!Number.isFinite(max) || max <= 0) return;
        element.value = Math.max(0, Math.min(max, detail.value / detail.max * max));
      };
      mounted.set(element, state);
      if (element.tagName.toLowerCase() === "progress") {
        state.observer = new root.MutationObserver(() => connect(element));
        state.observer.observe(element, { attributes: true, attributeFilter: [targetAttribute] });
        connect(element);
      }
    }
    function connect(element) {
      const state = mounted.get(element);
      if (!state || element.tagName.toLowerCase() !== "progress") return;
      if (state.target) aelluxJs.offEvent(state.target, "Progress", state.listener);
      const id = element.getAttribute(targetAttribute);
      state.target = id === null ? null : aelluxJs.elementOrId(id, { method: "progress.target" });
      if (state.target) aelluxJs.onEvent(state.target, "Progress", state.listener);
    }
    function unmount(element) {
      var _a, _b;
      const state = mounted.get(element);
      if (!state) return;
      mounted.delete(element);
      (_a = state.observer) == null ? void 0 : _a.disconnect();
      if (state.target) aelluxJs.offEvent(state.target, "Progress", state.listener);
      state.memory.restore();
      (_b = state.fallback) == null ? void 0 : _b.destroy();
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
//# sourceMappingURL=aellux.ext.progress.js.map
