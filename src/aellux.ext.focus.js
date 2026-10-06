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
  const mountMap = new Map();

  AelluxJs.extAttach(extensionName, { init, destroy, mountMap });

  function init(options) {
    mountMap.set(`[${attr.extensionName}]`, {
      mount: mountElement,
      unmount: unmountElement
    });
  }

  function destroy() {
    mountMap.clear();
  }

  function mountElement(element) {
  }

  function unmountElement(element) {
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
