(() => {
  // src/aellux.ext.focus.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "focus";
    if (!AelluxJs) throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    const attribute = AelluxJs.attr(extensionName);
    const snapshotKey = "ae-focus";
    const entries = [];
    let sequence = 0;
    let current = null;
    let restoring = false;
    AelluxJs.extAttach(extensionName, { init, destroy, restoreLastFocus });
    function init() {
      AelluxJs.mountManager.add({ extensionName, selector: `[${attribute}]`, mount: mountElement, unmount: unmountElement });
      document.addEventListener("focusin", onFocusIn, true);
      document.addEventListener("focus", onFocusChange, true);
      document.addEventListener("blur", onBlur, true);
      root.addEventListener("focus", onWindowFocus);
      root.addEventListener("blur", onWindowBlur);
      document.addEventListener(AelluxJs.eventName("SnapshotRestore"), onSnapshotRestore);
      if (isValid(document.activeElement)) remember(document.activeElement, false);
    }
    function destroy() {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focus", onFocusChange, true);
      document.removeEventListener("blur", onBlur, true);
      root.removeEventListener("focus", onWindowFocus);
      root.removeEventListener("blur", onWindowBlur);
      document.removeEventListener(AelluxJs.eventName("SnapshotRestore"), onSnapshotRestore);
      AelluxJs.mountManager.remove({ extensionName });
      entries.length = 0;
      current = null;
    }
    function mountElement(element) {
      if (element.getAttribute(attribute) !== "next" || element.hasAttribute("enterkeyhint")) return;
      if (element.matches("input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])"))
        element.setAttribute("enterkeyhint", "next");
    }
    function unmountElement() {
    }
    function isValid(element) {
      if (!element || element === document.body || element === document.documentElement || !element.isConnected || typeof element.focus !== "function" || element.matches(":disabled, [hidden], [inert]")) return false;
      for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
        if (node.hidden || node.hasAttribute("inert")) return false;
        const style = root.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
      }
      return element.getClientRects().length > 0;
    }
    function remember(element, push) {
      if (!isValid(element) || current && current.element === element) return;
      const entry = { token: String(++sequence), element };
      entries.push(entry);
      if (entries.length > 100) entries.shift();
      current = entry;
      const navigation = AelluxJs.ext.stateNavigation;
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
      const index = entries.indexOf(current);
      for (let i = (index < 0 ? entries.length : index) - 1; i >= 0; i--) {
        if (restore(entries[i])) return true;
      }
      return false;
    }
    function onSnapshotRestore(event) {
      const snapshot = event.detail && event.detail.snapshot;
      if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, snapshotKey)) return;
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].token === snapshot[snapshotKey]) {
          if (!restore(entries[i])) restoreLastFocus();
          return;
        }
      }
      restoreLastFocus();
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.focus.js.map
