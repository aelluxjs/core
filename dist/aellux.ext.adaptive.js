(() => {
  // src/aellux.ext.adaptive.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "adaptive";
    if (!AelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    const attr = {
      adaptive: AelluxJs.attr(extensionName)
    };
    const mountMap = /* @__PURE__ */ new Map();
    const adaptiveParams = {
      experienceScale: {
        near: 1,
        far: 1.5
      },
      minSizes: {
        compact: 0,
        small: 480,
        medium: 768,
        large: 1024,
        xl: 1280,
        xxl: 1600
      },
      ratioShapes: {
        vertical: 0.8,
        //>square<
        horizontal: 1.25
      }
    };
    AelluxJs.extAttach(extensionName, { init, destroy, mountMap, adaptiveParams });
    function init() {
      mountMap.set(`[${attr.adaptive}]`, {
        mount: mountAdaptive,
        unmount: unmountAdaptive
      });
    }
    function destroy() {
    }
    function mountAdaptive() {
    }
    function unmountAdaptive() {
    }
    function inferOrientation(flexBox, selector = "*") {
      return AelluxJs.waitLayout.read(() => {
        const fallback = "horizontal";
        var style = getComputedStyle(flexBox);
        if (style.display === "flex" || style.display === "inline-flex") {
          return style.flexDirection.indexOf("column") === 0 ? "vertical" : "horizontal";
        }
        if (!selector || selector.length === 0) return fallback;
        var children = flexBox.querySelectorAll(selector);
        if (children.length < 2) return fallback;
        var first = children[0].getBoundingClientRect();
        var second = children[1].getBoundingClientRect();
        var deltaX = Math.abs(
          second.left + second.width / 2 - (first.left + first.width / 2)
        );
        var deltaY = Math.abs(
          second.top + second.height / 2 - (first.top + first.height / 2)
        );
        return deltaY > deltaX ? "vertical" : "horizontal";
      });
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.adaptive.js.map
