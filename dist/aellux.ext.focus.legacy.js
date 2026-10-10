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
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      restoreLastFocus: restoreLastFocus
    });
    var attribute = AelluxJs.attr(extensionName);
    var snapshotKey = "ae-focus";
    var entries = [];
    var sequence = 0, current = null, restoring = false;
    function init() {
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attribute, "]"),
        mount: mountFocusElement,
        unmount: unmountFocusElement
      });
      document.addEventListener("focusin", onFocusIn, true);
      document.addEventListener("focus", onFocusChange, true);
      document.addEventListener("blur", onBlur, true);
      root.addEventListener("focus", onWindowFocus);
      root.addEventListener("blur", onWindowBlur);
      AelluxJs.on("SnapshotRestore", onSnapshotRestore);
      remember(document.activeElement, false);
    }
    function destroy() {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focus", onFocusChange, true);
      document.removeEventListener("blur", onBlur, true);
      root.removeEventListener("focus", onWindowFocus);
      root.removeEventListener("blur", onWindowBlur);
      AelluxJs.off("SnapshotRestore", onSnapshotRestore);
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
      entries.length = 0;
      current = null;
    }
    function mountFocusElement(element) {
      var type = element.getAttribute(attribute);
      switch (type) {
        case "next":
          if (!element.hasAttribute("enterkeyhint") && element.matches("input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])")) element.setAttribute("enterkeyhint", "next");
          break;
      }
    }
    function unmountFocusElement() {
    }
    function isValid(element) {
      if (!element || element === document.body || element === document.documentElement || !element.isConnected || typeof element.focus !== "function" || element.matches(":disabled, [hidden], [inert]")) return false;
      for (var node = element; node && node.nodeType === 1; node = node.parentElement) {
        if (node.hidden || node.hasAttribute("inert")) return false;
        var style = root.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
      }
      return element.getClientRects().length > 0;
    }
    function remember(element, push) {
      if (!isValid(element) || current && current.element === element) return;
      var entry = {
        token: String(++sequence),
        element: element
      };
      entries.push(entry);
      if (entries.length > 100) entries.shift();
      current = entry;
      var navigation = AelluxJs.ext.stateNavigation;
      if (push && navigation && navigation.initialized) navigation.setState(snapshotKey, entry.token);
    }
    function onFocusIn(event) {
      if (!restoring) remember(event.target, true);
    }
    function onFocusChange(event) {
      if (!restoring) remember(event.target, true);
    }
    function onBlur(event) {
      if (!restoring) remember(event.target, false);
    }
    function onWindowFocus() {
      if (!restoring) remember(document.activeElement, true);
    }
    function onWindowBlur() {
      if (!restoring) remember(document.activeElement, false);
    }
    function restore(entry) {
      if (!entry || !isValid(entry.element)) return false;
      restoring = true;
      try {
        entry.element.focus();
      } finally {
        restoring = false;
      }
      if (document.activeElement !== entry.element) return false;
      current = entry;
      return true;
    }
    function restoreLastFocus() {
      var index = entries.indexOf(current);
      for (var i = (index < 0 ? entries.length : index) - 1; i >= 0; i--) {
        if (restore(entries[i])) return true;
      }
      return false;
    }
    function onSnapshotRestore(event) {
      var snapshot = event.detail && event.detail.snapshot;
      if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, snapshotKey)) return;
      for (var i = entries.length - 1; i >= 0; i--) {
        if (entries[i].token === snapshot[snapshotKey]) {
          if (!restore(entries[i])) restoreLastFocus();
          return;
        }
      }
      restoreLastFocus();
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.focus.legacy.js.map
