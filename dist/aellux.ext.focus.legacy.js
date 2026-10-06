(function() {
  // src/src/aellux.ext.focus.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var AelluxJs = root.AelluxJs;
    var extensionName = "focus";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    var attr = {
      extensionName: AelluxJs.attr(extensionName)
    };
    var mountMap = /* @__PURE__ */ new Map();
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      mountMap: mountMap
    });
    function init(options) {
      mountMap.set("[".concat(attr.extensionName, "]"), {
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
})();
//# sourceMappingURL=aellux.ext.focus.legacy.js.map
