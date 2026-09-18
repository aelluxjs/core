/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

(function () {
  "use strict";

  const moduleName = "template";
  const attr = {
    moduleName: Aellux.attr(moduleName)
  };
  const mountDOM = new Map();

  Aellux.uxmRegister(moduleName, { init, destroy, mountDOM });

  function init() {
    mountDOM.set(`[${attr.moduleName}]`, {
      update: updateElement,
      unmount: unmountElement
    });
  }

  function destroy() {
    mountDOM.clear();
  }

  function updateElement(element) {
  }

  function unmountElement(element) {
  }
})();
