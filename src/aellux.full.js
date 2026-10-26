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
  "overflowMarquee": () => import("./aellux.ext.overflow-marquee.js"),
  "scrollbox": () => import("./aellux.ext.scrollbox.js"),
  "scrollboxSnap": () => import("./aellux.ext.scrollbox-snap.js"),
  "adaptive": () => import("./aellux.ext.adaptive.js"),
  "present": () => import("./aellux.ext.present.js")
});

// The version-matched boot script already supplies the signed official index.
// Reuse it instead of embedding a second copy in both Full variants.

// Shared runtime startup registers Core selectors in both modes. Optional
// Extensions (Ajax Href, Dialog, PWA and Viewport) resolve separate signed scripts.
