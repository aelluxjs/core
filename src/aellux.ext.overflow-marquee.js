/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createOverflowMarquee } from "./internal/create-overflow-marquee.js";

/**
 * Overflow Marquee Extension
 *
 * Purpose: reveals overflowing single-line content through repeated horizontal
 * motion, using Anchor geometry through data-only communication requests.
 *
 * Capability profile: visual overflow presentation, layout observation, and
 * motion and timing.
 *
 * Inputs and activation: mounts `[data-ae-overflow-marquee]` after loading and
 * awaiting Anchor. An optional pixel limit gates activation without setting
 * layout width. CSS properties configure speed, delay and fading; size, content,
 * visibility and interaction changes update the behavior.
 *
 * Outputs and owned state: moves original nodes into generated viewport/content
 * layers when enabled, owns readiness and activity attributes, animates the
 * content offset, and supplies a desktop tooltip for overflowing text.
 *
 * Lifecycle: pauses motion while hidden or interacting. Unmount cancels motion
 * and scheduled work, releases observations and Anchor placement, unwraps the
 * original nodes and restores owned attributes and tooltip state.
 *
 * Accessibility: pauses on focus and desktop hover and suppresses motion for
 * the reduced-motion preference. Applications keep full text accessible without
 * requiring animation or a desktop tooltip.
 */

(function (root) {
  "use strict";
  const api = root.aelluxJs;
  const extensionName = "overflow-marquee";
  if (!api) throw new Error('[aellux.js] Load the boot script before the overflow-marquee extension.');
  let marquee = null, placements = null;
  api.extAttach(extensionName, { init, destroy });

  async function init() {
    if (!api.registry.ext.anchor) api.ext("anchor");
    await api.wait("anchor");
    if (!api.comm.has("anchor.placement")) throw new Error("[aellux.js] Overflow Marquee requires Anchor geometry.");
    const owner = {};
    const request = (action, payload) => api.comm.request("anchor.placement", { action, owner, ...payload });
    placements = {
      mount: element => request("mount", { element }),
      unmount: element => request("unmount", { element }),
      measure: (element, end) => request("measure", { element, pairs: end ? "bottom-right:bottom-right" : "top-left:top-left" }).value,
      place: (element, placement) => request("place", { element, placement }),
      invisible: element => { const result = request("invisible", { element }); return !result.handled || result.value; },
      destroy: () => request("dispose")
    };
    marquee = createOverflowMarquee(root, api, placements);
    api.registerCssProperty(
      { name: "--ae-overflow-marquee-speed", syntax: "<number>", initialValue: "30" },
      { name: "--ae-overflow-marquee-delay", syntax: "<time>", initialValue: "1200ms" },
      { name: "--ae-overflow-marquee-fade-size", syntax: "<length>", initialValue: "16px" },
      { name: "--ae-overflow-marquee-offset", syntax: "<length>", initialValue: "0px", inherits: false }
    );
    api.mountManager.add({ extensionName, selector: marquee.selector,
      mount: marquee.mount, unmount: marquee.unmount, update: marquee.update });
  }

  async function destroy() {
    await marquee?.destroy();
    placements?.destroy();
    api.mountManager.remove({ extensionName });
    marquee = placements = null;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
