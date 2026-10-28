/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Focus Extension
 *
 * Purpose: records focus history and restores a previous valid target.
 *
 * Capability profile: focus management and optional browser-history integration.
 *
 * Inputs and activation: observes focus and blur on the document and window.
 * Mounted `data-ae-focus="next"` text-entry elements receive
 * `enterkeyhint="next"` when no hint is already declared and move focus
 * to the next available control when Enter is pressed.
 *
 * Outputs and owned state: keeps up to 100 in-memory focus entries and exposes
 * `restoreLastFocus()`. A new focus target with an ID emits `AelluxJsPushState`;
 * when state-navigation is active it records that ID as `ae-focus`. Snapshot
 * restoration returns to the matching target if it is connected and visible.
 *
 * Lifecycle: removes listeners and mounted behavior, then clears focus history
 * on destruction. Focus history does not survive a page reload.
 *
 * Accessibility: follows document order for Enter navigation and does not
 * announce focus changes. Consumers remain responsible for suitable focus order.
 */

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "focus";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  AelluxJs.extAttach(extensionName, {
    init, destroy,
    restoreLastFocus
  });

  const attribute = AelluxJs.attr(extensionName);
  const snapshotKey = "ae-focus";
  const entries = [];
  const hintMemories = new WeakMap();
  const nextElements = new WeakSet();
  const textEntrySelector = "input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])";
  const focusableSelector = "a[href], area[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])";

  let current = null, restoring = false;

  function init() {
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attribute}]`,
      priority: 0,
      mount: mountFocusElement,
      unmount: unmountFocusElement
    });
    AelluxJs.on("$focusin", onFocusIn, true);
    AelluxJs.on("$focus", onFocusChange, true);
    AelluxJs.on("$blur", onBlur, true);
    AelluxJs.onEvent(root, "$focus", onWindowFocus);
    AelluxJs.onEvent(root, "$blur", onWindowBlur);
    AelluxJs.on("SnapshotRestore", onSnapshotRestore);
    AelluxJs.on("UnpopFocusLost", onUnpopFocusLost);
    remember(document.activeElement, false);
  }

  function destroy() {
    AelluxJs.off("$focusin", onFocusIn, true);
    AelluxJs.off("$focus", onFocusChange, true);
    AelluxJs.off("$blur", onBlur, true);
    AelluxJs.offEvent(root, "$focus", onWindowFocus);
    AelluxJs.offEvent(root, "$blur", onWindowBlur);
    AelluxJs.off("SnapshotRestore", onSnapshotRestore);
    AelluxJs.off("UnpopFocusLost", onUnpopFocusLost);
    AelluxJs.mountManager.remove({ extensionName });
    entries.length = 0;
    current = null;
  }

  function mountFocusElement(element) {
    const type = element.getAttribute(attribute);
    switch (type) {
      case "next":
        AelluxJs.onEvent(element, "$keydown", onNextKeyDown);
        nextElements.add(element);
        if (!element.hasAttribute("enterkeyhint") && element.matches(textEntrySelector)) {
          hintMemories.set(element, AelluxJs.persist.element.save(element, ["enterkeyhint"], []));
          element.setAttribute("enterkeyhint", "next");
        }
        break;
    }
  }

  function unmountFocusElement(element) {
    if (nextElements.delete(element)) AelluxJs.offEvent(element, "$keydown", onNextKeyDown);
    hintMemories.get(element)?.restore();
    hintMemories.delete(element);
  }

  function onNextKeyDown(event) {
    if (event.key !== "Enter" || event.isComposing || event.repeat || event.defaultPrevented ||
      (event.target !== event.currentTarget && event.target.closest(focusableSelector) !== event.currentTarget)) return;
    const elements = document.querySelectorAll(focusableSelector);
    let foundCurrent = false;
    for (const element of elements) {
      if (element === event.currentTarget) {
        foundCurrent = true;
      } else if (foundCurrent && element.tabIndex >= 0 && isValid(element)) {
        event.preventDefault();
        element.focus();
        return;
      }
    }
  }

  function isValid(element) {
    if (!element || element === document.body || element === document.documentElement ||
      !element.isConnected || typeof element.focus !== "function" ||
      element.matches(":disabled, [hidden], [inert]")) return false;
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      if (node.hidden || node.hasAttribute("inert")) return false;
      const style = root.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
    }
    return element.getClientRects().length > 0;
  }

  function remember(element, push) {
    if (!isValid(element) || (current && current.element === element)) return;
    const entry = { element };
    entries.push(entry);
    if (entries.length > 100) entries.shift();
    current = entry;
    if (!push || !stateNavigationEligible(element) || !element.id || !element.id.trim()) return;
    AelluxJs.dispatch("PushState", {
      detail: { key: snapshotKey, value: element.id }
    });
  }

  // Focus history is broader than browser-state history: buttons and links can
  // still be restored, but only editing controls (or an explicit declaration)
  // create a navigation snapshot.
  function stateNavigationEligible(element) {
    if (element.hasAttribute(attribute)) return true;
    const name = element.tagName && element.tagName.toLowerCase();
    if (name === "textarea" || name === "select") return true;
    if (name === "input") return String(element.type || "text").toLowerCase() !== "hidden";
    return element.isContentEditable || (element.hasAttribute("contenteditable") &&
      element.getAttribute("contenteditable") !== "false");
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
    try { entry.element.focus(); } finally { restoring = false; }
    if (document.activeElement !== entry.element) return false;
    current = entry;
    return true;
  }

  function restoreLastFocus() {
    const index = entries.indexOf(current);
    const start = (index < 0 ? entries.length : index) - 1;
    for (let i = start; i >= 0; i--) {
      if (restore(entries[i])) return true;
    }
    return false;
  }

  function onUnpopFocusLost() {
    restoreLastFocus();
  }

  function onSnapshotRestore(event) {
    const snapshot = event.detail && event.detail.snapshot;
    if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, snapshotKey)) return;
    const target = document.getElementById(snapshot[snapshotKey]);
    if (target && stateNavigationEligible(target)) {
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].element === target) {
          if (!restore(entries[i])) restoreLastFocus();
          return;
        }
      }
      if (restore({ element: target })) return;
    }
    restoreLastFocus();
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
