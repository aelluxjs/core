/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import "./aellux.orchestrator.js";
import { assetLoadHelper } from "./internal/asset-load-helper.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;

function appendBundledStyle(extensionName) {
  return new Promise(resolve => {
    const data = root.AelluxJs.extRegistry[extensionName];
    const url = data.url.replace(/^\.\//, root.AelluxJs.aelluxBasePath);
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = url.replace(/\.js(?=[?#]|$)/, ".css");
    link.setAttribute(root.AelluxJs.attr("ext-style"), extensionName);
    assetLoadHelper(link, {
      loadCallback: resolve,
      errorCallback: resolve
    });
  });
}

root.AelluxJs.bundledExtensions = Object.freeze({
  "preferences": () => import("./aellux.ext.preferences.js"),
  "state-navigation": () => import("./aellux.ext.state-navigation.js"),
  "adaptive": () => Promise.all([
    import("./aellux.ext.adaptive.js"),
    appendBundledStyle("adaptive")
  ]),
  "feedback": () => import("./aellux.ext.feedback.js"),
  "ajax-href": () => import("./aellux.ext.ajax-href.js")
});
