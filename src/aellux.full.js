/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import "./aellux.orchestrator.js";
import { officialExtensionDefinitions } from "./official-extension-definitions.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;

root.AelluxJs.bundledExtensions = Object.freeze({
  "preference": () => import("./aellux.ext.preference.js"),
  "stateNavigation": () => import("./aellux.ext.state-navigation.js"),
  "feedback": () => import("./aellux.ext.feedback.js"),
  "focus": () => import("./aellux.ext.focus.js"),
  "point": () => import("./aellux.ext.point.js"),
  "anchor": () => import("./aellux.ext.anchor.js"),
  "adaptive": () => import("./aellux.ext.adaptive.js"),
  "present": () => import("./aellux.ext.present.js"),
  "scrollbox": () => import("./aellux.ext.scrollbox.js")
});

root.AelluxJs.extIndex.official = Object.freeze({
  schemaVersion: 1,
  coreVersion: root.AelluxJs.version,
  embedded: true,
  extensions: Object.freeze(officialExtensionDefinitions.reduce((extensions, definition) => {
    extensions[definition.name] = Object.freeze({
      coreCompatibility: root.AelluxJs.version,
      bundled: true,
      dependencies: definition.dependencies
    });
    return extensions;
  }, {}))
});

// The code is bundled, while initialization remains demand-driven. This avoids
// network fetches yet does not attach extension listeners without matching DOM.
root.AelluxJs.ext("adaptive", { loadWhen: "[data-ae-adaptive]", loadStyle: true });
root.AelluxJs.ext("anchor", { loadWhen: "[data-ae-anchor]" });
root.AelluxJs.ext("feedback", { loadWhen: "[data-ae-feedback]", loadStyle: true });
root.AelluxJs.ext("focus", { loadWhen: "[data-ae-focus]" });
root.AelluxJs.ext("point", { loadWhen: "[data-ae-point]" });
root.AelluxJs.ext("present", {
  loadWhen: "[data-ae-present],[data-ae-present-trigger],[data-ae-present-dismiss],[data-ae-present-target]",
  loadStyle: true
});
root.AelluxJs.ext("scrollbox", { loadWhen: "[data-ae-scrollbox]" });
