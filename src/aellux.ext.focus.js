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
 * `restoreLastFocus()`. Each new focus target emits `AelluxJsPushState`; when
 * state-navigation is active it records the `ae-focus` snapshot state. Snapshot
 * restoration returns to that target if it is still connected and visible.
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
  const generatedHints = new WeakSet();
  const nextElements = new WeakSet();
  const textEntrySelector = "input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])";
  const focusableSelector = "a[href], area[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])";

  let sequence = 0, current = null, restoring = false;

  function init() {
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attribute}]`,
      mount: mountFocusElement,
      unmount: unmountFocusElement
    });
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focus", onFocusChange, true);
    document.addEventListener("blur", onBlur, true);
    root.addEventListener("focus", onWindowFocus);
    root.addEventListener("blur", onWindowBlur);
    AelluxJs.on("SnapshotRestore", onSnapshotRestore);
    AelluxJs.on("UnpopFocusLost", onUnpopFocusLost);
    remember(document.activeElement, false);
  }

  function destroy() {
    document.removeEventListener("focusin", onFocusIn, true);
    document.removeEventListener("focus", onFocusChange, true);
    document.removeEventListener("blur", onBlur, true);
    root.removeEventListener("focus", onWindowFocus);
    root.removeEventListener("blur", onWindowBlur);
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
        element.addEventListener("keydown", onNextKeyDown);
        nextElements.add(element);
        if (!element.hasAttribute("enterkeyhint") && element.matches(textEntrySelector)) {
          element.setAttribute("enterkeyhint", "next");
          generatedHints.add(element);
        }
        break;
    }
  }

  function unmountFocusElement(element) {
    if (nextElements.delete(element)) element.removeEventListener("keydown", onNextKeyDown);
    if (generatedHints.delete(element)) element.removeAttribute("enterkeyhint");
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
    const entry = { token: String(++sequence), element };
    entries.push(entry);
    if (entries.length > 100) entries.shift();
    current = entry;
    if (!push) return;
    AelluxJs.dispatch("PushState", {
      detail: { key: snapshotKey, value: entry.token }
    });
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
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].token === snapshot[snapshotKey]) {
        if (!restore(entries[i])) restoreLastFocus();
        return;
      }
    }
    restoreLastFocus();
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
