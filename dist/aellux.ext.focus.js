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

  // src/internal/focus-spatial.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function validSpatialRect(rect) {
    return !!rect && [rect.left, rect.top, rect.right, rect.bottom].every(Number.isFinite) && rect.right > rect.left && rect.bottom > rect.top;
  }
  function selectSpatialCandidate(origin, candidates, direction) {
    if (!["left", "right", "up", "down"].includes(direction)) return null;
    const horizontal = direction === "left" || direction === "right";
    const forward = direction === "right" || direction === "down";
    const start = horizontal ? "left" : "top", end = horizontal ? "right" : "bottom";
    const crossStart = horizontal ? "top" : "left", crossEnd = horizontal ? "bottom" : "right";
    if (origin && !validSpatialRect(origin)) return null;
    let best = null, bestScore = null;
    for (const candidate of candidates) {
      const rect = candidate.rect;
      if (!validSpatialRect(rect)) continue;
      let score;
      if (!origin) {
        score = [forward ? rect[start] : -rect[end], rect[crossStart]];
      } else {
        const advance = (rect[start] + rect[end] - (origin[start] + origin[end])) / 2 * (forward ? 1 : -1);
        if (advance <= 0) continue;
        const overlap = Math.min(origin[crossEnd], rect[crossEnd]) - Math.max(origin[crossStart], rect[crossStart]);
        const primaryGap = Math.max(0, forward ? rect[start] - origin[end] : origin[start] - rect[end]);
        const crossGap = Math.max(0, -overlap);
        const crossOffset = Math.abs((rect[crossStart] + rect[crossEnd] - origin[crossStart] - origin[crossEnd]) / 2);
        score = [overlap > 0 ? 0 : 1, primaryGap + crossGap * 3 + crossOffset * 0.1, advance];
      }
      const different = bestScore && score.findIndex((value, index) => value !== bestScore[index]);
      if (!bestScore || different >= 0 && score[different] < bestScore[different]) {
        best = candidate;
        bestScore = score;
      }
    }
    return best;
  }

  // src/aellux.ext.focus.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const aelluxJs = root.aelluxJs;
    const extensionName = "focus";
    if (!aelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    aelluxJs.extAttach(extensionName, {
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
    const attribute = aelluxJs.attr(extensionName);
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
    const scopeSelector = `[${aelluxJs.attr("focus-scope")}], dialog, [aria-modal="true"]`;
    const navAttribute = aelluxJs.attr("focus-nav");
    const keyboardWidgetSelector = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="scrollbar"], [role="tablist"], [role="tab"], [role="menu"], [role="menubar"], [role="menuitem"], [role="listbox"], [role="option"], [role="grid"], [role="treegrid"], [role="tree"], [role="treeitem"], [role="radiogroup"], [role="radio"], [role="toolbar"], audio[controls], video[controls]';
    const focusClasses = [null, aelluxJs.className("focus-player1"), aelluxJs.className("focus-player2"), aelluxJs.className("focus-player3")];
    const focusClass = (id) => focusClasses[id] || aelluxJs.className("focus-player" + id);
    function init() {
      createContext(1);
      aelluxJs.comm.handle("focus.command", consumeCommand, { owner: extensionName });
      aelluxJs.comm.handle("focus.context", ({ focusId }) => getContext(focusId), { owner: extensionName });
      contextObserver = new root.MutationObserver((records) => {
        if (records.some((record) => Array.from(contexts.values()).some((context) => !context.scope.isConnected || context.element && (record.type === "attributes" && record.target.contains(context.element) || record.type === "childList" && Array.from(record.removedNodes).some((node) => node.contains(context.element)))))) pruneContexts();
      });
      contextObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "inert", "disabled", "aria-disabled", "class", "style", "open", "aria-hidden"]
      });
      aelluxJs.mountManager.add({
        extensionName,
        selector: `[${attribute}]`,
        priority: 0,
        mount: mountFocusElement,
        unmount: unmountFocusElement
      });
      aelluxJs.on("$focusin", onFocusIn, true);
      aelluxJs.on("$focus", onFocusChange, true);
      aelluxJs.on("$blur", onBlur, true);
      aelluxJs.onEvent(root, "$focus", onWindowFocus);
      aelluxJs.onEvent(root, "$blur", onWindowBlur);
      aelluxJs.on("SnapshotRestore", onSnapshotRestore);
      aelluxJs.on("DismissFocusLost", onDismissFocusLost);
      aelluxJs.on("UnpopFocusLost", onDismissFocusLost);
      aelluxJs.on("Unmount", onContextUnmount);
      aelluxJs.on("Mount", onContextMount);
      remember(document.activeElement, false);
      syncNative(document.activeElement);
    }
    function destroy() {
      aelluxJs.comm.removeOwner(extensionName);
      contextObserver == null ? void 0 : contextObserver.disconnect();
      contextObserver = null;
      for (const context of contexts.values()) clearContext(context);
      contexts.clear();
      shortcutActions.clear();
      aelluxJs.off("$focusin", onFocusIn, true);
      aelluxJs.off("$focus", onFocusChange, true);
      aelluxJs.off("$blur", onBlur, true);
      aelluxJs.offEvent(root, "$focus", onWindowFocus);
      aelluxJs.offEvent(root, "$blur", onWindowBlur);
      aelluxJs.off("SnapshotRestore", onSnapshotRestore);
      aelluxJs.off("DismissFocusLost", onDismissFocusLost);
      aelluxJs.off("UnpopFocusLost", onDismissFocusLost);
      aelluxJs.off("Unmount", onContextUnmount);
      aelluxJs.off("Mount", onContextMount);
      aelluxJs.mountManager.remove({ extensionName });
      entries.length = 0;
      current = null;
    }
    function mountFocusElement(element) {
      const type = element.getAttribute(attribute);
      switch (type) {
        case "next":
          aelluxJs.onEvent(element, "$keydown", onNextKeyDown);
          nextElements.add(element);
          if (!element.hasAttribute("enterkeyhint") && element.matches(textEntrySelector)) {
            hintMemories.set(element, aelluxJs.persist.element.save(element, ["enterkeyhint"], []));
            element.setAttribute("enterkeyhint", "next");
          }
          break;
      }
    }
    function unmountFocusElement(element) {
      var _a;
      if (nextElements.delete(element)) aelluxJs.offEvent(element, "$keydown", onNextKeyDown);
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
    function isValid(element, spatial = false) {
      if (!element || element === document.body || element === document.documentElement || !element.isConnected || typeof element.focus !== "function" || element.matches(":disabled, [disabled], [hidden], [inert]") || element.closest('[aria-disabled="true"]')) return false;
      for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
        if (node.hidden || node.hasAttribute("inert") || spatial && node.getAttribute("aria-hidden") === "true") return false;
        const style = root.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || spatial && (style.contentVisibility === "hidden" || Number(style.opacity) === 0)) return false;
        if (spatial && node.hasAttribute(aelluxJs.attr("present")) && (node.classList.contains(aelluxJs.className("dismissed")) || node.classList.contains(aelluxJs.className("unpop")))) return false;
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
      aelluxJs.dispatch("PushState", {
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
      aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, __spreadValues({ extension: extensionName, reason }, extra));
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
      aelluxJs.comm.emit("focus.changed", detail);
      aelluxJs.dispatch("FocusChange", { detail });
    }
    function destroyContext(focusId) {
      if (focusId === 1 || !contexts.has(focusId)) return false;
      clearContext(contexts.get(focusId));
      contexts.delete(focusId);
      aelluxJs.comm.emit("focus.context-destroyed", { focusId });
      aelluxJs.dispatch("FocusContextDestroy", { detail: { focusId } });
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
      const context = contexts.get(focusId);
      const element = typeof elementOrId === "string" ? document.getElementById(elementOrId.replace(/^#/, "")) : elementOrId;
      return applyFocus(context, element);
    }
    function applyFocus(context, element, preventScroll = false) {
      var _a;
      if (!context || element !== null && (!isValid(element) || !context.scope.contains(element))) return false;
      if (element && context.syncDOM) {
        element.focus({ preventScroll });
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
      const scope = nearest && context.scope.contains(nearest) ? nearest : context.scope;
      const modal = Array.from(document.querySelectorAll('dialog[open], [aria-modal="true"]')).reverse().find((element) => {
        if (!isValid(element)) return false;
        try {
          return element.matches(":modal") || element.getAttribute("aria-modal") === "true";
        } catch (_) {
          return element.getAttribute("aria-modal") === "true";
        }
      });
      if (modal && !modal.contains(context.element || context.scope)) return null;
      return scope;
    }
    function navigate(context, command, scope) {
      var _a;
      const region = (context.element || context.scope).closest(`[${navAttribute}]`);
      const policy = ((_a = region == null ? void 0 : region.getAttribute(navAttribute)) == null ? void 0 : _a.trim().toLowerCase()) || "auto";
      if (policy === "none") return false;
      const keyboard = command.source === "keyboard";
      if (keyboard && (policy === "native" || context.syncDOM && policy !== "spatial")) return false;
      if (!keyboard && command.source !== "gamepad" && context.syncDOM && policy !== "spatial") return false;
      if (region && scope.contains(region)) scope = region;
      const focused = context.element;
      const origin = focused && available(focused, scope, true) ? focused.getBoundingClientRect() : null;
      const candidates = Array.from(scope.querySelectorAll(focusableSelector)).filter((element) => element !== focused && available(element, scope, true)).map((element) => ({ element, rect: element.getBoundingClientRect() }));
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
      const shortcutAttribute = aelluxJs.attr("shortcut");
      const candidates = [scope, ...scope.querySelectorAll(`[${shortcutAttribute}]`)].filter((element) => element.hasAttribute(shortcutAttribute) && available(element, scope));
      return candidates.map((element, order) => ({
        element,
        order,
        shortcuts: parseShortcuts(element.getAttribute(shortcutAttribute)),
        distance: distance(context.element, element, scope),
        priority: Number(element.getAttribute(aelluxJs.attr("shortcut-priority"))) || 0
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
      const action = element.getAttribute(aelluxJs.attr("shortcut-action")) || "click";
      if (!aelluxJs.dispatchFrom(element, "BeforeShortcut", { cancelable: true, detail: { command, action } })) return false;
      if (action === "click") element.click();
      else {
        const handler = shortcutActions.get(action);
        if (handler) {
          if (handler(element, command) === false) return false;
        } else if (["pop", "unpop", "dismiss"].includes(action)) {
          const id = element.getAttribute(aelluxJs.attr("shortcut-target"));
          const target = id ? document.getElementById(id.replace(/^#/, "")) : element;
          if (!target) return false;
          const response = aelluxJs.comm.request("present." + action, { element: target });
          if (!response.handled) return false;
        } else {
          warn("Unknown shortcut action.", { value: action, element });
          return false;
        }
      }
      aelluxJs.dispatchFrom(element, "Shortcut", { detail: { command, action } });
      return true;
    }
    function consumeCommand(command) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      const context = contexts.get(command.focusId);
      if (!context) {
        warn("Input command refers to an unknown focus context; command blocked.", { focusId: command.focusId });
        return false;
      }
      if (!["press", "repeat"].includes(command.phase) || ((_a = command.originalEvent) == null ? void 0 : _a.defaultPrevented) || ((_b = command.originalEvent) == null ? void 0 : _b.isComposing) || ((_c = command.originalEvent) == null ? void 0 : _c.keyCode) === 229) return false;
      if (command.source === "point") return false;
      const focused = context.element;
      const inputScope = (focused || context.scope).closest(`[${aelluxJs.attr("inputs")}]`);
      if (inputScope && !inputScope.getAttribute(aelluxJs.attr("inputs")).split(/\s+/).includes(command.source)) return false;
      const origin = (_d = command.originalEvent) == null ? void 0 : _d.target;
      const editable = (element) => element == null ? void 0 : element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]');
      const reserved = ((_e = command.modifiers) == null ? void 0 : _e.meta) || ((_f = command.modifiers) == null ? void 0 : _f.ctrl) && ["KeyW", "KeyT", "KeyN", "KeyR", "KeyL", "KeyF", "KeyP", "KeyS", "KeyC", "KeyV", "KeyX", "KeyA", "KeyZ", "KeyY"].includes(command.code) || ((_g = command.modifiers) == null ? void 0 : _g.alt) && ["ArrowLeft", "ArrowRight", "F4"].includes(command.code);
      if (command.source === "keyboard" && (editable(origin) || editable(focused) || command.code === "Tab" || reserved)) return false;
      const directional = (_h = command.action) == null ? void 0 : _h.startsWith("navigate-");
      if (command.source === "keyboard" && directional && (((_i = origin == null ? void 0 : origin.closest) == null ? void 0 : _i.call(origin, keyboardWidgetSelector)) || (focused == null ? void 0 : focused.closest(keyboardWidgetSelector)) || Object.values(command.modifiers || {}).some(Boolean))) return false;
      const candidate = eligibleShortcuts(command.focusId, command)[0];
      if (candidate && command.phase === "press") return executeShortcut(candidate.element, command);
      const scope = activeScope(context);
      if (!scope) return false;
      if (directional) return navigate(context, command, scope);
      if (context.syncDOM && command.source === "keyboard") return false;
      if (command.action === "confirm" && command.phase === "press" && focused && available(focused, scope)) {
        focused.click();
        return true;
      }
      return false;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.focus.js.map
