(function() {
  /*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function() {
    "use strict";
    var extensionName = "adaptive";
    var attr = {
      adaptive: Aellux.attr(extensionName)
    };
    var modifier = {
      shapeHorizontal: Aellux.className("shape-horizontal"),
      shapeVertical: Aellux.className("shape-vertical"),
      shapeSquare: Aellux.className("shape-square")
    };
    var mountMap = /* @__PURE__ */ new Map();
    var adaptiveParams = {
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
    Aellux.extRegister(extensionName, {
      init: init,
      destroy: destroy,
      mountMap: mountMap,
      adaptiveParams: adaptiveParams
    });
    function init() {
      mountMap.set("[".concat(attr.adaptive, "]"), {
        mount: mountAdaptive,
        unmount: unmountAdaptive
      });
    }
    function destroy() {
    }
    function mountAdaptive(adaptiveContainer) {
      Aellux.observe(adaptiveContainer, "resize");
      adaptiveContainer.addEventListener(Aellux.eventName("ResizeObserver"), onResizeObserver);
    }
    function unmountAdaptive(adaptiveContainer) {
      Aellux.unobserve(adaptiveContainer, "resize");
      adaptiveContainer.removeEventListener(Aellux.eventName("ResizeObserver"), onResizeObserver);
    }
    function onResizeObserver(event) {
      var entry = event.detail;
      var width = entry.contentRect.width;
      var height = entry.contentRect.height;
      var adaptiveContainer = entry.target;
      var params = adaptiveParams;
      var ratioBreakpoints = params.ratioShapes;
      var ratio = height > 0 ? width / height : 0;
      adaptiveContainer.classList.toggle(modifier.shapeVertical, ratio < ratioBreakpoints.vertical);
      adaptiveContainer.classList.toggle(modifier.shapeHorizontal, ratio > ratioBreakpoints.horizontal);
      adaptiveContainer.classList.toggle(modifier.shapeSquare, ratio >= ratioBreakpoints.vertical && ratio <= ratioBreakpoints.horizontal);
      var sizes = Object.keys(params.minSizes);
      var spaceBreakpoints = params.minSizes;
      var space = Math.sqrt(width * height);
      for (var i = 0; i < sizes.length; i++) {
        var size = sizes[i];
        adaptiveContainer.classList.toggle(Aellux.className("fits-" + size), space >= spaceBreakpoints[size]);
      }
      Aellux.dispatchFrom(adaptiveContainer, "AdaptiveUpdate", {
        detail: null
      });
    }
    function inferOrientation(flexBox) {
      var selector = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "*";
      return Aellux.waitLayout.read(function() {
        var fallback = "horizontal";
        var style = getComputedStyle(flexBox);
        if (style.display === "flex" || style.display === "inline-flex") {
          return style.flexDirection.indexOf("column") === 0 ? "vertical" : "horizontal";
        }
        if (!selector || selector.length === 0) return fallback;
        var children = flexBox.querySelectorAll(selector);
        if (children.length < 2) return fallback;
        var first = children[0].getBoundingClientRect();
        var second = children[1].getBoundingClientRect();
        var deltaX = Math.abs(second.left + second.width / 2 - (first.left + first.width / 2));
        var deltaY = Math.abs(second.top + second.height / 2 - (first.top + first.height / 2));
        return deltaY > deltaX ? "vertical" : "horizontal";
      });
    }
  })();
})();
//# sourceMappingURL=aellux.ext.adaptive.legacy.js.map
