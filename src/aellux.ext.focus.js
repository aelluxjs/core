/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { parseShortcuts, matchesShortcut } from "./internal/input-shortcuts.js";
import { selectSpatialCandidate } from "./internal/focus-spatial.js";

/**
 * Focus Extension
 *
 * Purpose: manages independent logical focuses and scoped shortcuts, with
 * bidirectional native focus synchronization and history for context 1.
 *
 * Capability profile: routed command consumption, logical navigation,
 * contextual component actions and optional browser-history integration.
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
 * on destruction. Logical context classes and command subscriptions are released
 * too. Focus history does not survive a page reload.
 *
 * Accessibility: Enter Next follows document order; directional commands use
 * visual rectangles under the nearest focus-nav policy. Tab, editing and ARIA
 * widget keys remain native. Logical contexts do not announce focus changes.
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
    restoreLastFocus, createContext, destroyContext, getContext, setFocus, updateContext,
    eligibleShortcuts, registerShortcutAction
  });

  const attribute = AelluxJs.attr(extensionName);
  const snapshotKey = "ae-focus";
  const entries = [];
  const hintMemories = new WeakMap();
  const nextElements = new WeakSet();
  const textEntrySelector = "input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])";
  const focusableSelector = "a[href], area[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])";

  let current = null, restoring = false;
  const contexts = new Map();
  const shortcutActions = new Map();
  let contextObserver = null;
  const scopeSelector = `[${AelluxJs.attr("focus-scope")}], dialog, [aria-modal="true"]`;
  const navAttribute = AelluxJs.attr("focus-nav");
  const keyboardWidgetSelector = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), ' +
    '[role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="scrollbar"], ' +
    '[role="tablist"], [role="tab"], [role="menu"], [role="menubar"], [role="menuitem"], ' +
    '[role="listbox"], [role="option"], [role="grid"], [role="treegrid"], [role="tree"], [role="treeitem"], ' +
    '[role="radiogroup"], [role="radio"], [role="toolbar"], audio[controls], video[controls]';
  const focusClasses = [null, AelluxJs.className("focus-player1"), AelluxJs.className("focus-player2"), AelluxJs.className("focus-player3")];
  const focusClass = id => focusClasses[id] || AelluxJs.className("focus-player" + id);

  function init() {
    createContext(1);
    AelluxJs.comm.handle("focus.command", consumeCommand, { owner: extensionName });
    AelluxJs.comm.handle("focus.context", ({ focusId }) => getContext(focusId), { owner: extensionName });
    contextObserver = new root.MutationObserver(records => {
      if (records.some(record => Array.from(contexts.values()).some(context =>
        !context.scope.isConnected || (context.element &&
          ((record.type === "attributes" && record.target.contains(context.element)) ||
            (record.type === "childList" && Array.from(record.removedNodes).some(node => node.contains(context.element)))))))) pruneContexts();
    });
    contextObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true,
      attributeFilter: ["hidden", "inert", "disabled", "aria-disabled", "class", "style", "open", "aria-hidden"] });
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
    AelluxJs.on("DismissFocusLost", onDismissFocusLost);
    AelluxJs.on("UnpopFocusLost", onDismissFocusLost);
    AelluxJs.on("Unmount", onContextUnmount);
    AelluxJs.on("Mount", onContextMount);
    remember(document.activeElement, false);
    syncNative(document.activeElement);
  }

  function destroy() {
    AelluxJs.comm.removeOwner(extensionName);
    contextObserver?.disconnect(); contextObserver = null;
    for (const context of contexts.values()) clearContext(context);
    contexts.clear(); shortcutActions.clear();
    AelluxJs.off("$focusin", onFocusIn, true);
    AelluxJs.off("$focus", onFocusChange, true);
    AelluxJs.off("$blur", onBlur, true);
    AelluxJs.offEvent(root, "$focus", onWindowFocus);
    AelluxJs.offEvent(root, "$blur", onWindowBlur);
    AelluxJs.off("SnapshotRestore", onSnapshotRestore);
    AelluxJs.off("DismissFocusLost", onDismissFocusLost);
    AelluxJs.off("UnpopFocusLost", onDismissFocusLost);
    AelluxJs.off("Unmount", onContextUnmount);
    AelluxJs.off("Mount", onContextMount);
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

  function isValid(element, spatial = false) {
    if (!element || element === document.body || element === document.documentElement ||
      !element.isConnected || typeof element.focus !== "function" ||
      element.matches(":disabled, [disabled], [hidden], [inert]") || element.closest('[aria-disabled="true"]')) return false;
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      if (node.hidden || node.hasAttribute("inert") || (spatial && node.getAttribute("aria-hidden") === "true")) return false;
      const style = root.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" ||
        (spatial && (style.contentVisibility === "hidden" || Number(style.opacity) === 0))) return false;
      // Native history follows actual focus, including opening preparation.
      // Only directional candidate selection rejects presentation state.
      if (spatial && node.hasAttribute(AelluxJs.attr("present")) &&
        (node.classList.contains(AelluxJs.className("dismissed")) || node.classList.contains(AelluxJs.className("unpop")))) return false;
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
    syncNative(event.target);
    if (!restoring) remember(event.target, true);
  }

  function onFocusChange(event) {
    syncNative(event.target);
    if (!restoring) remember(event.target, true);
  }

  function onBlur(event) {
    if (!restoring) remember(event.target, false);
    Promise.resolve().then(() => syncNative(document.activeElement));
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
    syncNative(entry.element);
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

  function onDismissFocusLost() {
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

  function warn(reason, extra = {}) {
    AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, { extension: extensionName, reason, ...extra });
  }
  function getContext(focusId = 1) {
    const context = contexts.get(focusId);
    return context ? Object.freeze({ ...context }) : null;
  }
  function createContext(focusId, { scope = document.body, syncDOM = focusId === 1 } = {}) {
    if (!Number.isSafeInteger(focusId) || focusId < 1 || contexts.has(focusId) ||
      !scope || scope.nodeType !== 1 || !scope.isConnected || (focusId !== 1 && syncDOM)) return false;
    contexts.set(focusId, { focusId, element: null, scope, syncDOM: !!syncDOM });
    return getContext(focusId);
  }
  function clearContext(context) {
    const previous = context.element;
    context.element = null;
    previous?.classList.remove(focusClass(context.focusId));
    if (previous) publishFocus({ focusId: context.focusId, element: null, previous });
  }
  function publishFocus(detail) {
    AelluxJs.comm.emit("focus.changed", detail);
    AelluxJs.dispatch("FocusChange", { detail });
  }
  function destroyContext(focusId) {
    if (focusId === 1 || !contexts.has(focusId)) return false;
    clearContext(contexts.get(focusId)); contexts.delete(focusId);
    AelluxJs.comm.emit("focus.context-destroyed", { focusId });
    AelluxJs.dispatch("FocusContextDestroy", { detail: { focusId } });
    return true;
  }
  function updateContext(focusId, { scope, syncDOM } = {}) {
    const context = contexts.get(focusId);
    if (!context || (scope && (scope.nodeType !== 1 || !scope.isConnected)) || (focusId !== 1 && syncDOM)) return false;
    if (scope) context.scope = scope;
    if (syncDOM !== undefined) context.syncDOM = !!syncDOM;
    if (context.element && !context.scope.contains(context.element)) clearContext(context);
    if (context.syncDOM) syncNative(document.activeElement);
    return getContext(focusId);
  }
  function assign(context, element) {
    if (context.element === element) return true;
    const previous = context.element;
    previous?.classList.remove(focusClass(context.focusId));
    context.element = element;
    element?.classList.add(focusClass(context.focusId));
    publishFocus({ focusId: context.focusId, element, previous });
    return true;
  }
  function setFocus(focusId, elementOrId) {
    const context = contexts.get(focusId);
    const element = typeof elementOrId === "string" ? document.getElementById(elementOrId.replace(/^#/, "")) : elementOrId;
    return applyFocus(context, element);
  }
  function applyFocus(context, element, preventScroll = false) {
    if (!context || (element !== null && (!isValid(element) || !context.scope.contains(element)))) return false;
    if (element && context.syncDOM) {
      element.focus({ preventScroll });
      if (document.activeElement !== element) return false;
    }
    if (!element && context.syncDOM) context.element?.blur();
    return assign(context, element);
  }
  function syncNative(element) {
    const context = contexts.get(1);
    if (context?.syncDOM) assign(context, isValid(element) && context.scope.contains(element) ? element : null);
  }
  function pruneContexts() {
    for (const context of contexts.values()) {
      if (!context.scope.isConnected && context.focusId !== 1) { destroyContext(context.focusId); continue; }
      if (context.element && (!isValid(context.element) || !context.scope.contains(context.element))) clearContext(context);
    }
    for (let index = entries.length - 1; index >= 0; index--) if (!entries[index].element.isConnected) entries.splice(index, 1);
    if (current && !current.element.isConnected) current = null;
  }
  function onContextUnmount(event) {
    const { root: scope, extensions } = event.detail;
    if (extensions && !extensions.includes(extensionName)) return;
    if (event.detail.detachedOnly) { pruneContexts(); return; }
    for (const context of contexts.values()) {
      if (context.focusId !== 1 && scope.contains(context.scope)) destroyContext(context.focusId);
      else if (context.element && scope.contains(context.element)) clearContext(context);
    }
    for (let index = entries.length - 1; index >= 0; index--) if (scope.contains(entries[index].element)) entries.splice(index, 1);
    if (current && scope.contains(current.element)) current = null;
  }
  function onContextMount() {
    syncNative(document.activeElement);
    for (const context of contexts.values()) if (context.element && isValid(context.element)) context.element.classList.add(focusClass(context.focusId));
  }
  function activeScope(context) {
    const nearest = context.element?.closest(scopeSelector);
    const scope = nearest && context.scope.contains(nearest) ? nearest : context.scope;
    // A modal native dialog isolates all contexts outside it.
    const modal = Array.from(document.querySelectorAll('dialog[open], [aria-modal="true"]')).reverse()
      .find(element => {
        if (!isValid(element)) return false;
        try { return element.matches(":modal") || element.getAttribute("aria-modal") === "true"; }
        catch (_) { return element.getAttribute("aria-modal") === "true"; }
      });
    if (modal && !modal.contains(context.element || context.scope)) return null;
    return scope;
  }

  function navigate(context, command, scope) {
    const region = (context.element || context.scope).closest(`[${navAttribute}]`);
    const policy = region?.getAttribute(navAttribute)?.trim().toLowerCase() || "auto";
    if (policy === "none") return false;
    const keyboard = command.source === "keyboard";
    if (keyboard && (policy === "native" || (context.syncDOM && policy !== "spatial"))) return false;
    if (!keyboard && command.source !== "gamepad" && context.syncDOM && policy !== "spatial") return false;
    // Declaring a region also bounds its navigation, even without focus-scope.
    if (region && scope.contains(region)) scope = region;
    const focused = context.element;
    // Collect all geometry before any focus/class/scroll writes. Fresh reads
    // keep synchronous commands correct after responsive layout or transforms.
    const origin = focused && available(focused, scope, true) ? focused.getBoundingClientRect() : null;
    const candidates = Array.from(scope.querySelectorAll(focusableSelector))
      .filter(element => element !== focused && available(element, scope, true))
      .map(element => ({ element, rect: element.getBoundingClientRect() }));
    const selected = selectSpatialCandidate(origin, candidates, command.action.slice(9));
    if (!selected || !applyFocus(context, selected.element, true)) return false;
    reveal(selected.element, scope);
    return true;
  }

  function reveal(element, scope) {
    if (scope === document.body || scope === document.documentElement) {
      element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      return;
    }
    // Scroll only ancestors within this navigation boundary. Native scroll
    // events notify Scrollbox; Focus does not reproduce its physics engine.
    for (let node = element.parentElement; node && scope.contains(node); node = node.parentElement) {
      const style = root.getComputedStyle(node);
      const rect = element.getBoundingClientRect(), box = node.getBoundingClientRect();
      const left = box.left + node.clientLeft, top = box.top + node.clientTop;
      const offset = (start, end, min, max) => start < min ? start - min : end > max ? Math.min(end - max, start - min) : 0;
      const x = /^(auto|scroll|overlay)$/.test(style.overflowX) ? offset(rect.left, rect.right, left, left + node.clientWidth) : 0;
      const y = /^(auto|scroll|overlay)$/.test(style.overflowY) ? offset(rect.top, rect.bottom, top, top + node.clientHeight) : 0;
      if (x || y) node.scrollBy({ left: x, top: y, behavior: "instant" });
      if (node === scope) break;
    }
  }
  function available(element, scope, spatial = false) {
    if (!isValid(element, spatial) || !scope.contains(element)) return false;
    const nearest = element.closest(scopeSelector);
    return !nearest || nearest === scope || !scope.contains(nearest);
  }
  function distance(a, b, scope) {
    const ancestors = new Map(); let depth = 0;
    for (let node = a; node; node = node.parentElement) { ancestors.set(node, depth++); if (node === scope) break; }
    depth = 0;
    for (let node = b; node; node = node.parentElement) {
      if (ancestors.has(node)) return depth + ancestors.get(node);
      if (node === scope) break;
      depth++;
    }
    return Infinity;
  }
  function eligibleShortcuts(focusId = 1, command = null) {
    const context = contexts.get(focusId);
    if (!context || !context.element || !isValid(context.element)) return [];
    const scope = activeScope(context);
    if (!scope) return [];
    const shortcutAttribute = AelluxJs.attr("shortcut");
    const candidates = [scope, ...scope.querySelectorAll(`[${shortcutAttribute}]`)]
      .filter(element => element.hasAttribute(shortcutAttribute) && available(element, scope));
    return candidates.map((element, order) => ({ element, order,
      shortcuts: parseShortcuts(element.getAttribute(shortcutAttribute)),
      distance: distance(context.element, element, scope),
      priority: Number(element.getAttribute(AelluxJs.attr("shortcut-priority"))) || 0 }))
      .filter(item => !command || item.shortcuts.some(shortcut => matchesShortcut(shortcut, command)))
      .sort((a, b) => a.distance - b.distance || b.priority - a.priority || a.order - b.order);
  }
  function registerShortcutAction(name, handler, { signal } = {}) {
    if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof handler !== "function" || shortcutActions.has(name)) throw new TypeError("Invalid or duplicate shortcut action.");
    const remove = () => { if (shortcutActions.get(name) === handler) shortcutActions.delete(name); signal?.removeEventListener("abort", remove); };
    if (!signal?.aborted) { shortcutActions.set(name, handler); signal?.addEventListener("abort", remove, { once: true }); }
    return remove;
  }
  function executeShortcut(element, command) {
    const action = element.getAttribute(AelluxJs.attr("shortcut-action")) || "click";
    if (!AelluxJs.dispatchFrom(element, "BeforeShortcut", { cancelable: true, detail: { command, action } })) return false;
    if (action === "click") element.click();
    else {
      const handler = shortcutActions.get(action);
      if (handler) { if (handler(element, command) === false) return false; }
      else if (["pop", "unpop", "dismiss"].includes(action)) {
        const id = element.getAttribute(AelluxJs.attr("shortcut-target"));
        const target = id ? document.getElementById(id.replace(/^#/, "")) : element;
        if (!target) return false;
        const response = AelluxJs.comm.request("present." + action, { element: target });
        if (!response.handled) return false;
      } else { warn("Unknown shortcut action.", { value: action, element }); return false; }
    }
    AelluxJs.dispatchFrom(element, "Shortcut", { detail: { command, action } });
    return true;
  }
  function consumeCommand(command) {
    const context = contexts.get(command.focusId);
    if (!context) { warn("Input command refers to an unknown focus context; command blocked.", { focusId: command.focusId }); return false; }
    if (!["press", "repeat"].includes(command.phase) || command.originalEvent?.defaultPrevented ||
      command.originalEvent?.isComposing || command.originalEvent?.keyCode === 229) return false;
    if (command.source === "point") return false; // Native pointer focus/click owns activation.
    const focused = context.element;
    const inputScope = (focused || context.scope).closest(`[${AelluxJs.attr("inputs")}]`);
    if (inputScope && !inputScope.getAttribute(AelluxJs.attr("inputs")).split(/\s+/).includes(command.source)) return false;
    const origin = command.originalEvent?.target;
    const editable = element => element?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]');
    // Preserve text editing, IME, browser/system modifier shortcuts and Tab.
    const reserved = command.modifiers?.meta ||
      (command.modifiers?.ctrl && ["KeyW", "KeyT", "KeyN", "KeyR", "KeyL", "KeyF", "KeyP", "KeyS", "KeyC", "KeyV", "KeyX", "KeyA", "KeyZ", "KeyY"].includes(command.code)) ||
      (command.modifiers?.alt && ["ArrowLeft", "ArrowRight", "F4"].includes(command.code));
    if (command.source === "keyboard" && (editable(origin) || editable(focused) || command.code === "Tab" || reserved)) return false;
    const directional = command.action?.startsWith("navigate-");
    if (command.source === "keyboard" && directional &&
      (origin?.closest?.(keyboardWidgetSelector) || focused?.closest(keyboardWidgetSelector) ||
        Object.values(command.modifiers || {}).some(Boolean))) return false;
    const candidate = eligibleShortcuts(command.focusId, command)[0];
    if (candidate && command.phase === "press") return executeShortcut(candidate.element, command);
    const scope = activeScope(context);
    if (!scope) return false;
    if (directional) return navigate(context, command, scope);
    // Keyboard confirmation remains native for the DOM-synchronized context.
    if (context.syncDOM && command.source === "keyboard") return false;
    if (command.action === "confirm" && command.phase === "press" && focused && available(focused, scope)) {
      focused.click(); return true;
    }
    return false;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
