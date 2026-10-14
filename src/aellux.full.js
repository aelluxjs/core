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
  "scrollbox": () => import("./aellux.ext.scrollbox.js"),
  "adaptive": () => import("./aellux.ext.adaptive.js"),
  "present": () => import("./aellux.ext.present.js")
});

root.AelluxJs.ext("adaptive", { loadStyle: true });
root.AelluxJs.ext("present", { loadStyle: true });
