/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import "./aellux.orchestrator.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;

root.AelluxJs.bundledExtensions = Object.freeze({
  "preference": () => import("./aellux.ext.preference.js"),
  "stateNavigation": () => import("./aellux.ext.state-navigation.js"),
  "feedback": () => import("./aellux.ext.feedback.js"),
  "focus": () => import("./aellux.ext.focus.js"),
  "point": () => import("./aellux.ext.point.js"),
  "anchor": () => import("./aellux.ext.anchor.js"),
  "ajaxHref": () => import("./aellux.ext.ajax-href.js"),
  "adaptive": () => import("./aellux.ext.adaptive.js"),
  "present": () => import("./aellux.ext.present.js")
});

root.AelluxJs.extIndex.official = typeof __AELLUX_OFFICIAL_EXTENSION_MANIFEST__ !== "undefined"
  ? __AELLUX_OFFICIAL_EXTENSION_MANIFEST__ : null;

// Bundled Extensions initialize on demand without separate script requests.
// Scrollbox and Snap use the embedded official manifest to load separate files
// when their selectors match, keeping their code out of the Full runtime.
root.AelluxJs.ext("adaptive", { loadWhen: "[data-ae-adaptive]" });
root.AelluxJs.ext("anchor", { loadWhen: "[data-ae-anchor]" });
root.AelluxJs.ext("overflow-marquee", { loadWhen: "[data-ae-overflow-marquee]" });
root.AelluxJs.ext("ajax-href", { loadWhen: "a[data-ae-ajax-href]" });
root.AelluxJs.ext("feedback", { loadWhen: "[data-ae-feedback]" });
root.AelluxJs.ext("focus", { loadWhen: "[data-ae-focus]" });
root.AelluxJs.ext("point", { loadWhen: "[data-ae-point]" });
root.AelluxJs.ext("present", {
  loadWhen: "[data-ae-present],[data-ae-present-group],[data-ae-trigger],[data-ae-dismiss],[data-ae-target]"
});
root.AelluxJs.ext("scrollbox", { loadWhen: "[data-ae-scrollbox]" });
root.AelluxJs.ext("scrollbox-snap", { loadWhen: "[data-ae-scrollbox-snap]" });
