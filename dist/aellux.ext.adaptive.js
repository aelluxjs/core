(() => {
  /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function() {
    "use strict";
    const extensionName = "adaptive";
    const attr = {
      adaptive: Aellux.attr(extensionName)
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
    Aellux.extRegister(extensionName, { init, destroy, mountMap, adaptiveParams });
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
      return Aellux.waitLayout.read(() => {
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
  })();
})();
//# sourceMappingURL=aellux.ext.adaptive.js.map
