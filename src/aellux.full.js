/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import "./aellux.orchestrator.js";
import { officialExtensionDefinitions } from "./official-extension-definitions.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;

root.AelluxJs.bundledExtensions = Object.freeze({
  "preference": () => import("./aellux.ext.preference.js"),
  "stateNavigation": () => import("./aellux.ext.state-navigation.js"),
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

// Full keeps only its foundational extensions in the entry bundle. The rest
// stay official, but load their normal Core artifact only when matching DOM
// appears during mount (or when the application explicitly waits for one).
root.AelluxJs.ext("./aellux.ext.adaptive.js", { loadWhen: "[data-ae-adaptive]", loadStyle: true });
root.AelluxJs.ext("./aellux.ext.anchor.js", { loadWhen: "[data-ae-anchor]" });
root.AelluxJs.ext("./aellux.ext.feedback.js", { loadWhen: "[data-ae-feedback]", loadStyle: true });
root.AelluxJs.ext("./aellux.ext.focus.js", { loadWhen: "[data-ae-focus]" });
root.AelluxJs.ext("./aellux.ext.point.js", { loadWhen: "[data-ae-point]" });
root.AelluxJs.ext("./aellux.ext.present.js", {
  loadWhen: "[data-ae-present],[data-ae-present-trigger],[data-ae-present-dismiss],[data-ae-present-target]",
  loadStyle: true
});
