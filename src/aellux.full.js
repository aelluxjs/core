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
  "scrollbox": () => import("./aellux.ext.scrollbox.js"),
  "adaptive": () => import("./aellux.ext.adaptive.js"),
  "present": () => import("./aellux.ext.present.js")
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

root.AelluxJs.ext("adaptive", { loadStyle: true });
root.AelluxJs.ext("feedback", { loadStyle: true });
root.AelluxJs.ext("present", { loadStyle: true });
