/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "focus";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  const attr = {
    extensionName: AelluxJs.attr(extensionName)
  };

  AelluxJs.extAttach(extensionName, { init, destroy });

  function init(options) {
    AelluxJs.mountManager.add(
      extensionName, `[${attr.extensionName}]`, mountElement, unmountElement
    );
  }

  function destroy() {
    AelluxJs.mountManager.remove(extensionName);
  }

  function mountElement(element) {
  }

  function unmountElement(element) {
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
