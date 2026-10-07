/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import "./aellux.orchestrator.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;

root.AelluxJs.bundledExtensions = Object.freeze({
  "preference": () => import("./aellux.ext.preference.js"),
  "stateNavigation": () => import("./aellux.ext.state-navigation.js"),
  "feedback": () => import("./aellux.ext.feedback.js"),
  "adaptive": () => import("./aellux.ext.adaptive.js"),
  "present": () => import("./aellux.ext.present.js")
});

root.AelluxJs.ext("adaptive", { loadStyle: true });
