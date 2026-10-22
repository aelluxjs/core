/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createOverflowMarquee } from "./internal/create-overflow-marquee.js";

// This Extension owns the content wrapper, weak CSS and visibility-aware
// lifecycle. Anchor is loaded in init solely to supply its placement map.
(function (root) {
  "use strict";
  const api = root.AelluxJs;
  const extensionName = "overflow-marquee";
  if (!api) throw new Error('[aellux.js] Load the boot script before the overflow-marquee extension.');
  let marquee = null, placements = null, weakStyle = null;
  api.extAttach(extensionName, { init, destroy });

  async function init() {
    if (!api.registry.ext.anchor) api.ext("anchor");
    const anchor = await api.wait("anchor");
    if (!anchor?.createPlacementMap) throw new Error("[aellux.js] Overflow Marquee requires Anchor's placement map.");
    placements = anchor.createPlacementMap();
    marquee = createOverflowMarquee(root, api, {
      ...placements,
      measure: (element, end) => placements.measure(element, end ? "bottom-right:bottom-right" : "top-left:top-left")
    });
    api.registerCssProperty(
      { name: "--ae-overflow-marquee-speed", syntax: "<number>", initialValue: "30" },
      { name: "--ae-overflow-marquee-delay", syntax: "<time>", initialValue: "1200ms" }
    );
    weakStyle = root.document.createElement("style");
    weakStyle.setAttribute(api.attr("overflow-marquee-style"), "");
    weakStyle.textContent = marquee.css.replace(/\s*([{};:,])\s*/g, "$1").replace(/;}/g, "}").trim();
    root.document.head.appendChild(weakStyle);
    api.mountManager.add({ extensionName, selector: marquee.selector,
      mount: marquee.mount, unmount: marquee.unmount, update: marquee.update });
  }

  async function destroy() {
    await marquee?.destroy();
    placements?.destroy();
    api.mountManager.remove({ extensionName });
    weakStyle?.remove();
    marquee = placements = weakStyle = null;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
