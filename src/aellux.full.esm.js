/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import "./aellux.orchestrator.js";

const root = typeof globalThis !== "undefined" ? globalThis : window;

function appendBundledStyle(extensionName) {
  return new Promise(resolve => {
    const data = root.Aellux.extRegistry[extensionName];
    const url = data.url.replace(/^\.\//, root.Aellux.aelluxBasePath);
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = url.replace(/\.js(?=[?#]|$)/, ".css");
    link.setAttribute(root.Aellux.attr("ext-style"), extensionName);
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

root.Aellux.bundledExtensions = Object.freeze({
  "preferences": () => import("./aellux.ext.preferences.js"),
  "state-navigation": () => import("./aellux.ext.state-navigation.js"),
  "adaptive": () => Promise.all([
    import("./aellux.ext.adaptive.js"),
    appendBundledStyle("adaptive")
  ]),
  "feedback": () => import("./aellux.ext.feedback.js"),
  "ajax-href": () => import("./aellux.ext.ajax-href.js")
});
