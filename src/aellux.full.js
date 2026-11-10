/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import "./aellux.orchestrator.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;

root.aelluxJs.bundledExtensions = Object.freeze({
  "preference": () => import("./aellux.ext.preference.js"),
  "stateNavigation": () => import("./aellux.ext.state-navigation.js"),
  "feedback": () => import("./aellux.ext.feedback.js"),
  "focus": () => import("./aellux.ext.focus.js"),
  "input": () => import("./aellux.ext.input.js"),
  "anchor": () => import("./aellux.ext.anchor.js"),
  "viewport": () => import("./aellux.ext.viewport.js"),
  "scrollbox": () => import("./aellux.ext.scrollbox.js"),
  "adaptive": () => import("./aellux.ext.adaptive.js"),
  "present": () => import("./aellux.ext.present.js")
});

// The version-matched boot script already supplies the signed official index.
// Reuse it instead of embedding a second copy in both Full variants.

// Full runtime startup registers the official Core selectors. Optional
// Extensions resolve separate signed scripts, including Overflow Marquee and
// Scrollbox Snap until their migration to external extensions.
