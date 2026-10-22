/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Installed only by the Legacy entries. Like the other platform polyfills,
// registrations last for the document lifetime rather than an Extension mount.
export function installDialogPolyfill(root, css) {
  var document = root.document;
  var probe = document.createElement("dialog");
  if (hasDialogAPI(probe)) return;

  // Keep upstream's document/form listeners out of browsers with native support.
  var dialogPolyfill = require("dialog-polyfill");
  var style = document.createElement("style");
  style.setAttribute(root.AelluxJs.attr("dialog-polyfill-style"), "");
  style.textContent = css;
  // These rules emulate UA defaults; application styles should come after them.
  document.head.insertBefore(style, document.head.firstChild);

  root.AelluxJs.on("BeforeMount", function (event) {
    var mountRoot = event.detail.root;
    if (mountRoot.nodeType === 1 && mountRoot.localName === "dialog") register(mountRoot);
    var dialogs = mountRoot.querySelectorAll("dialog");
    for (var index = 0; index < dialogs.length; index++) register(dialogs[index]);
  });

  function register(dialog) {
    if (hasDialogAPI(dialog)) return;
    // registerDialog only checks showModal; force the fallback for partial APIs.
    dialogPolyfill.forceRegisterDialog(dialog);
  }
}

function hasDialogAPI(dialog) {
  return typeof dialog.show === "function" &&
    typeof dialog.showModal === "function" && typeof dialog.close === "function";
}
