/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import "./aellux.orchestrator.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;

root.Aellux.bundledExtensions = Object.freeze({
  "preferences": () => import("./aellux.ext.preferences.js"),
  "state-navigation": () => import("./aellux.ext.state-navigation.js"),
  "adaptive": () => import("./aellux.ext.adaptive.js"),
  "feedback": () => import("./aellux.ext.feedback.js"),
  "ajax-href": () => import("./aellux.ext.ajax-href.js")
});
