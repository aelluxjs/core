/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Progress Extension
 *
 * Purpose: enhances native progress and meter controls, optionally connecting
 * progress values to an existing producer's progress events.
 *
 * Capability profile: structure and state, with event-driven value updates and
 * Legacy fallbacks for unsupported native controls.
 *
 * Inputs and activation: mounts `progress, meter`. A progress element with
 * `data-ae-progress-target` subscribes to `AelluxJsProgress` on the referenced
 * producer ID and reconnects when that target attribute changes.
 *
 * Outputs and owned state: maps valid producer value/max ratios into the native
 * progress range, preserving the control's authored range. Only the Legacy
 * distribution installs unsupported-control fallbacks.
 *
 * Lifecycle: disconnects target listeners and attribute observation, restores
 * the original value attribute and destroys element-local fallbacks on unmount.
 *
 * Accessibility: retains native progress and meter semantics; applications
 * provide accessible labels and meaningful range and value descriptions.
 */
import { installProgressFallback } from "./internal/install-progress-fallback.js";

(function (root) {
  "use strict";
  const aelluxJs = root.aelluxJs;
  const extensionName = "progress";
  if (!aelluxJs) throw new Error('[aellux.js] Load the boot script before the progress Extension.');
  const targetAttribute = aelluxJs.attr("progress-target");
  const mounted = new Map();
  aelluxJs.extAttach(extensionName, { init, destroy });

  function init() {
    aelluxJs.mountManager.add({ extensionName, selector: "progress, meter", priority: -1,
      mount, unmount, update: connect });
  }
  function destroy() {
    aelluxJs.mountManager.remove({ extensionName });
    for (const element of mounted.keys()) unmount(element);
  }
  function mount(element) {
    if (mounted.has(element)) return;
    const state = { target: null, memory: aelluxJs.persist.element.save(element, ["value"]),
      fallback: typeof __AELLUX_PROGRESS_LEGACY__ !== "undefined" && __AELLUX_PROGRESS_LEGACY__
        ? installProgressFallback(root, element) : null, observer: null, listener: null };
    state.listener = event => {
      if (!element.isConnected || !mounted.has(element)) return;
      const detail = event.detail;
      if (!detail || typeof detail.value !== "number" || typeof detail.max !== "number" ||
        !Number.isFinite(detail.value) || !Number.isFinite(detail.max) ||
        detail.max <= 0 || detail.value < 0 || detail.value > detail.max) return;
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
    const state = mounted.get(element);
    if (!state) return;
    mounted.delete(element);
    state.observer?.disconnect();
    if (state.target) aelluxJs.offEvent(state.target, "Progress", state.listener);
    state.memory.restore();
    state.fallback?.destroy();
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
