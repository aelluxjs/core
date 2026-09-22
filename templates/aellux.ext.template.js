/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

(function () {
  "use strict";

  const extensionName = "template";
  const attr = {
    extensionName: Aellux.attr(extensionName)
  };
  const mountDOM = new Map();

  Aellux.extRegister(extensionName, { init, destroy, mountDOM });

  function init() {
    mountDOM.set(`[${attr.extensionName}]`, {
      mount: mountElement,
      unmount: unmountElement
    });
  }

  function destroy() {
    mountDOM.clear();
  }

  function mountElement(element) {
  }

  function unmountElement(element) {
  }
})();
