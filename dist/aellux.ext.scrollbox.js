(() => {
  // src/aellux.ext.scrollbox.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "scrollbox";
    if (!AelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    const attribute = AelluxJs.attr(extensionName);
    const scrollboxes = /* @__PURE__ */ new Map();
    const properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
    AelluxJs.extAttach(extensionName, { init, destroy });
    function init() {
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${attribute}]`,
        mount: mountScrollbox,
        unmount: unmountScrollbox
      });
    }
    function destroy() {
      for (const element of scrollboxes.keys()) unmountScrollbox(element);
      AelluxJs.mountManager.remove({ extensionName });
    }
    function mountScrollbox(element) {
      if (scrollboxes.has(element)) return;
      const previous = properties.map((name) => ({
        value: element.style.getPropertyValue(name),
        priority: element.style.getPropertyPriority(name)
      }));
      const onScroll = () => updateProgress(element);
      scrollboxes.set(element, { onScroll, previous });
      element.addEventListener("scroll", onScroll, { passive: true });
      updateProgress(element);
    }
    function unmountScrollbox(element) {
      const state = scrollboxes.get(element);
      if (!state) return;
      element.removeEventListener("scroll", state.onScroll);
      properties.forEach((name, index) => {
        const original = state.previous[index];
        if (original.value) element.style.setProperty(name, original.value, original.priority);
        else element.style.removeProperty(name);
      });
      scrollboxes.delete(element);
    }
    function updateProgress(element) {
      element.style.setProperty(properties[0], progress(element.scrollTop, element.scrollHeight - element.clientHeight));
      element.style.setProperty(properties[1], progress(element.scrollLeft, element.scrollWidth - element.clientWidth));
    }
    function progress(position, distance) {
      return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.scrollbox.js.map
