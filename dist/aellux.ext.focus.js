(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // src/internal/input-shortcuts.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function parseShortcuts(value) {
    return String(value || "").split(";").map((part) => {
      const match = part.trim().match(/^([a-z][a-z0-9-]*):([^:;\s]+)$/i);
      if (!match) return null;
      const tokens = match[2].split("+");
      const code = tokens.pop();
      const modifiers = tokens.map((token) => token.toLowerCase()).sort();
      if (!code || modifiers.some((token) => !["alt", "ctrl", "meta", "shift"].includes(token)) || new Set(modifiers).size !== modifiers.length) return null;
      return Object.freeze({ source: match[1].toLowerCase(), code, modifiers: Object.freeze(modifiers) });
    }).filter(Boolean);
  }
  function matchesShortcut(shortcut, command) {
    const modifiers = command.modifiers || {};
    return shortcut.source === command.source && shortcut.code === command.code && ["alt", "ctrl", "meta", "shift"].every((name) => !!modifiers[name] === shortcut.modifiers.includes(name));
  }

  // src/aellux.ext.focus.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "focus";
    if (!AelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    AelluxJs.extAttach(extensionName, {
      init,
      destroy,
      restoreLastFocus,
      createContext,
      destroyContext,
      getContext,
      setFocus,
      updateContext,
      eligibleShortcuts,
      registerShortcutAction
    });
    const attribute = AelluxJs.attr(extensionName);
    const snapshotKey = "ae-focus";
    const entries = [];
    const hintMemories = /* @__PURE__ */ new WeakMap();
    const nextElements = /* @__PURE__ */ new WeakSet();
    const textEntrySelector = "input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])";
    const focusableSelector = "a[href], area[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])";
    let current = null, restoring = false;
    const contexts = /* @__PURE__ */ new Map();
    const shortcutActions = /* @__PURE__ */ new Map();
    let contextObserver = null;
    const scopeSelector = `[${AelluxJs.attr("focus-scope")}], dialog, [aria-modal="true"]`;
    const focusClasses = [null, AelluxJs.className("focus-player1"), AelluxJs.className("focus-player2"), AelluxJs.className("focus-player3")];
    const focusClass = (id) => focusClasses[id] || AelluxJs.className("focus-player" + id);
    function init() {
      createContext(1);
      AelluxJs.comm.handle("focus.command", consumeCommand, { owner: extensionName });
      AelluxJs.comm.handle("focus.context", ({ focusId }) => getContext(focusId), { owner: extensionName });
      contextObserver = new root.MutationObserver((records) => {
        if (records.some((record) => Array.from(contexts.values()).some((context) => !context.scope.isConnected || context.element && (record.type === "attributes" && record.target.contains(context.element) || record.type === "childList" && Array.from(record.removedNodes).some((node) => node.contains(context.element)))))) pruneContexts();
      });
      contextObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "inert", "disabled", "aria-disabled", "class", "style"]
      });
      AelluxJs.mountManager.add({
        extensionName,
        selector: `[${attribute}]`,
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
      contextObserver == null ? void 0 : contextObserver.disconnect();
      contextObserver = null;
      for (const context of contexts.values()) clearContext(context);
      contexts.clear();
      shortcutActions.clear();
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
      var _a;
      if (nextElements.delete(element)) AelluxJs.offEvent(element, "$keydown", onNextKeyDown);
      (_a = hintMemories.get(element)) == null ? void 0 : _a.restore();
      hintMemories.delete(element);
    }
    function onNextKeyDown(event) {
      if (event.key !== "Enter" || event.isComposing || event.repeat || event.defaultPrevented || event.target !== event.currentTarget && event.target.closest(focusableSelector) !== event.currentTarget) return;
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
      if (!element || element === document.body || element === document.documentElement || !element.isConnected || typeof element.focus !== "function" || element.matches(":disabled, [disabled], [hidden], [inert]") || element.closest('[aria-disabled="true"]')) return false;
      for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
        if (node.hidden || node.hasAttribute("inert")) return false;
        const style = root.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
      }
      return element.getClientRects().length > 0;
    }
    function remember(element, push) {
      if (!isValid(element) || current && current.element === element) return;
      const entry = { element };
      entries.push(entry);
      if (entries.length > 100) entries.shift();
      current = entry;
      if (!push || !stateNavigationEligible(element) || !element.id || !element.id.trim()) return;
      AelluxJs.dispatch("PushState", {
        detail: { key: snapshotKey, value: element.id }
      });
    }
    function stateNavigationEligible(element) {
      if (element.hasAttribute(attribute)) return true;
      const name = element.tagName && element.tagName.toLowerCase();
      if (name === "textarea" || name === "select") return true;
      if (name === "input") return String(element.type || "text").toLowerCase() !== "hidden";
      return element.isContentEditable || element.hasAttribute("contenteditable") && element.getAttribute("contenteditable") !== "false";
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
      try {
        entry.element.focus();
      } finally {
        restoring = false;
      }
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
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, __spreadValues({ extension: extensionName, reason }, extra));
    }
    function getContext(focusId = 1) {
      const context = contexts.get(focusId);
      return context ? Object.freeze(__spreadValues({}, context)) : null;
    }
    function createContext(focusId, { scope = document.body, syncDOM = focusId === 1 } = {}) {
      if (!Number.isSafeInteger(focusId) || focusId < 1 || contexts.has(focusId) || !scope || scope.nodeType !== 1 || !scope.isConnected || focusId !== 1 && syncDOM) return false;
      contexts.set(focusId, { focusId, element: null, scope, syncDOM: !!syncDOM });
      return getContext(focusId);
    }
    function clearContext(context) {
      const previous = context.element;
      context.element = null;
      previous == null ? void 0 : previous.classList.remove(focusClass(context.focusId));
      if (previous) publishFocus({ focusId: context.focusId, element: null, previous });
    }
    function publishFocus(detail) {
      AelluxJs.comm.emit("focus.changed", detail);
      AelluxJs.dispatch("FocusChange", { detail });
    }
    function destroyContext(focusId) {
      if (focusId === 1 || !contexts.has(focusId)) return false;
      clearContext(contexts.get(focusId));
      contexts.delete(focusId);
      AelluxJs.comm.emit("focus.context-destroyed", { focusId });
      AelluxJs.dispatch("FocusContextDestroy", { detail: { focusId } });
      return true;
    }
    function updateContext(focusId, { scope, syncDOM } = {}) {
      const context = contexts.get(focusId);
      if (!context || scope && (scope.nodeType !== 1 || !scope.isConnected) || focusId !== 1 && syncDOM) return false;
      if (scope) context.scope = scope;
      if (syncDOM !== void 0) context.syncDOM = !!syncDOM;
      if (context.element && !context.scope.contains(context.element)) clearContext(context);
      if (context.syncDOM) syncNative(document.activeElement);
      return getContext(focusId);
    }
    function assign(context, element) {
      if (context.element === element) return true;
      const previous = context.element;
      previous == null ? void 0 : previous.classList.remove(focusClass(context.focusId));
      context.element = element;
      element == null ? void 0 : element.classList.add(focusClass(context.focusId));
      publishFocus({ focusId: context.focusId, element, previous });
      return true;
    }
    function setFocus(focusId, elementOrId) {
      var _a;
      const context = contexts.get(focusId);
      const element = typeof elementOrId === "string" ? document.getElementById(elementOrId.replace(/^#/, "")) : elementOrId;
      if (!context || element !== null && (!isValid(element) || !context.scope.contains(element))) return false;
      if (element && context.syncDOM) {
        element.focus();
        if (document.activeElement !== element) return false;
      }
      if (!element && context.syncDOM) (_a = context.element) == null ? void 0 : _a.blur();
      return assign(context, element);
    }
    function syncNative(element) {
      const context = contexts.get(1);
      if (context == null ? void 0 : context.syncDOM) assign(context, isValid(element) && context.scope.contains(element) ? element : null);
    }
    function pruneContexts() {
      for (const context of contexts.values()) {
        if (!context.scope.isConnected && context.focusId !== 1) {
          destroyContext(context.focusId);
          continue;
        }
        if (context.element && (!isValid(context.element) || !context.scope.contains(context.element))) clearContext(context);
      }
      for (let index = entries.length - 1; index >= 0; index--) if (!entries[index].element.isConnected) entries.splice(index, 1);
      if (current && !current.element.isConnected) current = null;
    }
    function onContextUnmount(event) {
      const { root: scope, extensions } = event.detail;
      if (extensions && !extensions.includes(extensionName)) return;
      if (event.detail.detachedOnly) {
        pruneContexts();
        return;
      }
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
      var _a;
      const nearest = (_a = context.element) == null ? void 0 : _a.closest(scopeSelector);
      let scope = nearest && context.scope.contains(nearest) ? nearest : context.scope;
      const modal = Array.from(document.querySelectorAll('dialog[open], [aria-modal="true"]')).reverse().find((element) => {
        try {
          return element.matches(":modal") || element.getAttribute("aria-modal") === "true";
        } catch (_) {
          return element.getAttribute("aria-modal") === "true";
        }
      });
      if (modal && !modal.contains(context.element)) return null;
      return scope;
    }
    function available(element, scope) {
      if (!isValid(element) || !scope.contains(element)) return false;
      const nearest = element.closest(scopeSelector);
      return !nearest || nearest === scope || !scope.contains(nearest);
    }
    function distance(a, b, scope) {
      const ancestors = /* @__PURE__ */ new Map();
      let depth = 0;
      for (let node = a; node; node = node.parentElement) {
        ancestors.set(node, depth++);
        if (node === scope) break;
      }
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
      const candidates = [scope, ...scope.querySelectorAll(`[${shortcutAttribute}]`)].filter((element) => element.hasAttribute(shortcutAttribute) && available(element, scope));
      return candidates.map((element, order) => ({
        element,
        order,
        shortcuts: parseShortcuts(element.getAttribute(shortcutAttribute)),
        distance: distance(context.element, element, scope),
        priority: Number(element.getAttribute(AelluxJs.attr("shortcut-priority"))) || 0
      })).filter((item) => !command || item.shortcuts.some((shortcut) => matchesShortcut(shortcut, command))).sort((a, b) => a.distance - b.distance || b.priority - a.priority || a.order - b.order);
    }
    function registerShortcutAction(name, handler, { signal } = {}) {
      if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof handler !== "function" || shortcutActions.has(name)) throw new TypeError("Invalid or duplicate shortcut action.");
      const remove = () => {
        if (shortcutActions.get(name) === handler) shortcutActions.delete(name);
        signal == null ? void 0 : signal.removeEventListener("abort", remove);
      };
      if (!(signal == null ? void 0 : signal.aborted)) {
        shortcutActions.set(name, handler);
        signal == null ? void 0 : signal.addEventListener("abort", remove, { once: true });
      }
      return remove;
    }
    function executeShortcut(element, command) {
      const action = element.getAttribute(AelluxJs.attr("shortcut-action")) || "click";
      if (!AelluxJs.dispatchFrom(element, "BeforeShortcut", { cancelable: true, detail: { command, action } })) return false;
      if (action === "click") element.click();
      else {
        const handler = shortcutActions.get(action);
        if (handler) {
          if (handler(element, command) === false) return false;
        } else if (["pop", "unpop", "dismiss"].includes(action)) {
          const id = element.getAttribute(AelluxJs.attr("shortcut-target"));
          const target = id ? document.getElementById(id.replace(/^#/, "")) : element;
          if (!target) return false;
          const response = AelluxJs.comm.request("present." + action, { element: target });
          if (!response.handled) return false;
        } else {
          warn("Unknown shortcut action.", { value: action, element });
          return false;
        }
      }
      AelluxJs.dispatchFrom(element, "Shortcut", { detail: { command, action } });
      return true;
    }
    function consumeCommand(command) {
      var _a, _b, _c, _d, _e, _f;
      const context = contexts.get(command.focusId);
      if (!context) {
        warn("Input command refers to an unknown focus context; command blocked.", { focusId: command.focusId });
        return false;
      }
      if (!["press", "repeat"].includes(command.phase) || ((_a = command.originalEvent) == null ? void 0 : _a.defaultPrevented)) return false;
      if (command.source === "point") return false;
      const focused = context.element;
      const inputScope = (focused || context.scope).closest(`[${AelluxJs.attr("inputs")}]`);
      if (inputScope && !inputScope.getAttribute(AelluxJs.attr("inputs")).split(/\s+/).includes(command.source)) return false;
      const origin = (_b = command.originalEvent) == null ? void 0 : _b.target;
      const editable = (element) => element == null ? void 0 : element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]');
      const reserved = ((_c = command.modifiers) == null ? void 0 : _c.meta) || ((_d = command.modifiers) == null ? void 0 : _d.ctrl) && ["KeyW", "KeyT", "KeyN", "KeyR", "KeyL", "KeyF", "KeyP", "KeyS", "KeyC", "KeyV", "KeyX", "KeyA", "KeyZ", "KeyY"].includes(command.code) || ((_e = command.modifiers) == null ? void 0 : _e.alt) && ["ArrowLeft", "ArrowRight", "F4"].includes(command.code);
      if (command.source === "keyboard" && (editable(origin) || editable(focused) || command.code === "Tab" || reserved)) return false;
      const candidate = eligibleShortcuts(command.focusId, command)[0];
      if (candidate && command.phase === "press") return executeShortcut(candidate.element, command);
      if (context.syncDOM && command.source === "keyboard") return false;
      const scope = activeScope(context);
      if (!scope) return false;
      if (command.action === "confirm" && command.phase === "press" && focused && available(focused, scope)) {
        focused.click();
        return true;
      }
      if (!((_f = command.action) == null ? void 0 : _f.startsWith("navigate-"))) return false;
      const elements = Array.from(scope.querySelectorAll(focusableSelector)).filter((element) => element.tabIndex >= 0 && available(element, scope));
      if (!elements.length) return false;
      const index = elements.indexOf(focused);
      const direction = command.action.slice(9);
      const step = direction === "left" || direction === "up" ? -1 : 1;
      const next = index < 0 ? step > 0 ? 0 : elements.length - 1 : Math.max(0, Math.min(elements.length - 1, index + step));
      return setFocus(command.focusId, elements[next]);
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.focus.js.map
