/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createOverflowMarquee } from "./internal/create-overflow-marquee.js";

// This Extension owns the content wrapper and visibility-aware
// lifecycle. Anchor supplies geometry through data-only communication requests.
(function (root) {
  "use strict";
  const api = root.AelluxJs;
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
