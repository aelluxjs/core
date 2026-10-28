/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Used only by the Dialog Legacy Extension during its own mount. Upstream
// registrations and shared styles last for the document lifetime.
export function installDialogPolyfill(root, dialog, css) {
  if (hasDialogAPI(dialog)) return;
  var document = root.document;

  var attribute = root.AelluxJs.attr("dialog-polyfill-style");
  var style = document.querySelector("style[" + attribute + "]");
  if (!style) {
    style = document.createElement("style");
    style.setAttribute(attribute, "");
    style.textContent = css;
    // These rules emulate UA defaults; application styles should come after them.
    document.head.insertBefore(style, document.head.firstChild);
  }
  // Keep upstream's document/form listeners out of native browsers. Retain its
  // instance with the shared stylesheet so destroying and reloading the
  // Extension does not install another manager or wrap form.submit again.
  var dialogPolyfill = style.aelluxDialogPolyfill;
  if (!dialogPolyfill) {
    dialogPolyfill = require("dialog-polyfill");
    Object.defineProperty(style, "aelluxDialogPolyfill", { value: dialogPolyfill });
  }
  // registerDialog only checks showModal; force the fallback for partial APIs.
  // A registered element has all three methods, including after remount.
  dialogPolyfill.forceRegisterDialog(dialog);
}

function hasDialogAPI(dialog) {
  return typeof dialog.show === "function" &&
    typeof dialog.showModal === "function" && typeof dialog.close === "function";
}
