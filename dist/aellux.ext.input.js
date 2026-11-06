(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

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
  function shortcutLabel(shortcut, family = "generic") {
    if (!shortcut) return "";
    const faces = {
      xbox: { south: "A", east: "B", west: "X", north: "Y" },
      playstation: { south: "\xD7", east: "\u25CB", west: "\u25A1", north: "\u25B3" },
      nintendo: { south: "B", east: "A", west: "Y", north: "X" }
    };
    const label = shortcut.source === "keyboard" ? shortcut.code.replace(/^Key(?=[A-Z]$)|^Digit(?=\d$)/g, "") : faces[family] && faces[family][shortcut.code] || shortcut.code;
    return [...shortcut.modifiers.map((name) => name[0].toUpperCase() + name.slice(1)), label].join("+");
  }

  // src/aellux.ext.input.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const api = root.AelluxJs;
    if (!api) throw new Error("[aellux.js] Load the boot script before Input.");
    const extensionName = "input", attr = (name) => api.attr(name);
    const mounted = /* @__PURE__ */ new Set(), adapters = /* @__PURE__ */ new Map(), active = /* @__PURE__ */ new Map(), routers = [], families = [];
    const hintContexts = /* @__PURE__ */ new Map(), hints = /* @__PURE__ */ new Map();
    const loading = /* @__PURE__ */ new Map();
    const mountTokens = /* @__PURE__ */ new WeakMap();
    const outputs = ["gamepad", "active-input", "gamepad-family", "gamepad-model"];
    const actionMaps = {
      keyboard: {
        Enter: "confirm",
        Space: "confirm",
        Escape: "cancel",
        ArrowLeft: "navigate-left",
        ArrowRight: "navigate-right",
        ArrowUp: "navigate-up",
        ArrowDown: "navigate-down"
      },
      gamepad: { "dpad-left": "navigate-left", "dpad-right": "navigate-right", "dpad-up": "navigate-up", "dpad-down": "navigate-down" }
    };
    let running = false, observer = null, rootMemory = null, routerOrder = 0, familyOrder = 0;
    for (const name of ["point", "keyboard", "gamepad"]) adapters.set(name, () => loadAdapter(name));
    api.extAttach(extensionName, {
      init,
      destroy,
      pointers: (element) => {
        var _a;
        return ((_a = active.get("point")) == null ? void 0 : _a.pointers(element)) || [];
      },
      registerRouter,
      removeRouters,
      resolveFocusId,
      dispatchCommand,
      registerAdapter,
      registerGamepadFamily,
      devices: () => {
        var _a;
        return ((_a = active.get("gamepad")) == null ? void 0 : _a.devices()) || [];
      },
      setActionMap,
      setHintContext,
      describeShortcuts: parseShortcuts,
      refresh
    });
    function warn(reason, extra = {}) {
      api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, __spreadValues({ extension: extensionName, reason }, extra));
    }
    function modalities(element) {
      const scope = element && element.nodeType === 1 ? element.closest(`[${attr("inputs")}]`) : null;
      const value = scope ? scope.getAttribute(attr("inputs")) : root.document.documentElement.getAttribute(attr("inputs"));
      return new Set(value === null ? ["point", "keyboard"] : value.trim().split(/\s+/).filter(Boolean));
    }
    function accepts(source, element) {
      return modalities(element).has(source);
    }
    async function init() {
      if (running) return;
      running = true;
      rootMemory = api.persist.element.save(root.document.documentElement, outputs.map(attr), []);
      root.document.documentElement.setAttribute(attr("gamepad"), "false");
      api.mountManager.add({
        extensionName,
        selector: ["point", "inputs", "shortcut-hint"].map((name) => `[${attr(name)}]`).join(","),
        mount,
        unmount,
        update: refresh,
        controllers: ["pointers"]
      });
      api.comm.on("extension.destroyed", extensionDestroyed, { owner: extensionName });
      api.comm.on("focus.context-destroyed", contextDestroyed, { owner: extensionName });
      api.comm.handle("input.mount-token", ({ element }) => mountTokens.get(element) || null, { owner: extensionName });
      api.on("Unmount", onUnmount);
      observer = new root.MutationObserver((records) => {
        if (records.some((record) => record.type === "attributes" || record.removedNodes.length || record.addedNodes.length)) refresh().catch((cause) => warn("Input adapter refresh failed.", { cause }));
      });
      observer.observe(root.document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["inputs", "shortcut", "shortcut-hint", "shortcut-focus"].map(attr)
      });
      try {
        await refresh();
      } catch (cause) {
        destroy();
        throw cause;
      }
    }
    function mount(element) {
      var _a;
      if (!mounted.has(element)) mountTokens.set(element, {});
      mounted.add(element);
      if (element.hasAttribute(attr("point"))) (_a = active.get("point")) == null ? void 0 : _a.mount(element);
      return refresh();
    }
    function unmount(element) {
      var _a;
      mounted.delete(element);
      mountTokens.delete(element);
      (_a = active.get("point")) == null ? void 0 : _a.unmount(element);
      restoreHint(element);
      removeRouters(element);
      return refresh();
    }
    async function loadAdapter(name) {
      var _a, _b, _c;
      const filename = `aellux.input.${name}${api.diagnostics.legacy ? ".legacy" : ""}${api.minified ? ".min" : ""}.js`;
      if (!((_a = api.registry.inputAdapters) == null ? void 0 : _a[name])) {
        await api.dep("aellux-input-" + filename, "./" + filename, (_b = api.coreAssetIntegrity) == null ? void 0 : _b[filename]);
      }
      const factory = (_c = api.registry.inputAdapters) == null ? void 0 : _c[name];
      if (!factory) throw new Error("Input adapter did not register: " + name);
      return factory({ root, emit: dispatchCommand, accepts, changed: deviceChanged, identify: identifyFamily });
    }
    async function refresh() {
      if (!running) return;
      const requested = modalities(root.document.documentElement);
      for (const element of mounted) if (element.isConnected && element.hasAttribute(attr("inputs"))) {
        for (const name of modalities(element)) requested.add(name);
      }
      for (const name of requested) if (!adapters.has(name)) warn("Unknown Input adapter.", { value: name });
      for (const [name, adapter] of active) if (!requested.has(name)) {
        active.delete(name);
        adapter.destroy();
      }
      await Promise.all(Array.from(requested).filter((name) => adapters.has(name)).map(async (name) => {
        if (active.has(name)) return;
        if (!loading.has(name)) loading.set(name, Promise.resolve().then(() => adapters.get(name)()).then(async (adapter) => {
          if (!running || !adapters.has(name) || !requestedModalities().has(name)) return;
          active.set(name, adapter);
          await adapter.init();
          if (!running || !adapters.has(name) || !requestedModalities().has(name)) {
            if (active.get(name) === adapter) active.delete(name);
            adapter.destroy();
            return;
          }
          if (name === "point") {
            for (const element of mounted) if (element.hasAttribute(attr("point"))) adapter.mount(element);
          }
        }).finally(() => loading.delete(name)));
        await loading.get(name);
      }));
      for (const entry of routers.slice()) if (entry.owner && entry.owner.nodeType && !entry.owner.isConnected) entry.remove();
      for (const [id] of hintContexts) if (!Number.isSafeInteger(id)) hintContexts.delete(id);
      updateHints();
    }
    function requestedModalities() {
      const names = modalities(root.document.documentElement);
      for (const element of mounted) if (element.isConnected && element.hasAttribute(attr("inputs"))) for (const name of modalities(element)) names.add(name);
      return names;
    }
    function destroy() {
      running = false;
      observer == null ? void 0 : observer.disconnect();
      observer = null;
      api.comm.removeOwner(extensionName);
      for (const element of mounted) mountTokens.delete(element);
      api.off("Unmount", onUnmount);
      for (const adapter of active.values()) adapter.destroy();
      active.clear();
      mounted.clear();
      for (const entry of routers.slice()) entry.remove();
      for (const element of hints.keys()) restoreHint(element);
      hintContexts.clear();
      families.length = 0;
      rootMemory == null ? void 0 : rootMemory.restore();
      rootMemory = null;
      api.mountManager.remove({ extensionName });
    }
    function registerAdapter(name, factory) {
      if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof factory !== "function" || adapters.has(name)) throw new TypeError("Invalid or duplicate Input adapter.");
      adapters.set(name, factory);
      refresh().catch((cause) => warn("Input adapter refresh failed.", { cause }));
      return () => {
        var _a;
        (_a = active.get(name)) == null ? void 0 : _a.destroy();
        active.delete(name);
        adapters.delete(name);
      };
    }
    function registerRouter(resolve, { priority = 0, owner = null, signal } = {}) {
      if (typeof resolve !== "function" || !Number.isFinite(priority)) throw new TypeError("A router requires a synchronous function and a finite priority.");
      if (signal == null ? void 0 : signal.aborted) return () => {
      };
      const entry = { resolve, priority, owner, order: routerOrder++, remove() {
        const index = routers.indexOf(entry);
        if (index !== -1) routers.splice(index, 1);
        signal == null ? void 0 : signal.removeEventListener("abort", entry.remove);
      } };
      routers.push(entry);
      routers.sort((a, b) => b.priority - a.priority || a.order - b.order);
      signal == null ? void 0 : signal.addEventListener("abort", entry.remove, { once: true });
      return entry.remove;
    }
    function removeRouters(owner) {
      for (const entry of routers.slice()) if (entry.owner === owner) entry.remove();
    }
    function extensionDestroyed(detail) {
      removeRouters(detail.extension);
    }
    function contextDestroyed(detail) {
      hintContexts.delete(detail.focusId);
      updateHints();
    }
    function onUnmount(event) {
      var _a;
      const { root: scope, extensions, detachedOnly } = event.detail;
      if (extensions && !extensions.includes(extensionName)) return;
      for (const entry of routers.slice()) if (((_a = entry.owner) == null ? void 0 : _a.nodeType) && (detachedOnly ? !entry.owner.isConnected : scope.contains(entry.owner))) entry.remove();
    }
    function resolveFocusId(command) {
      var _a;
      for (const entry of routers.slice()) {
        if (!routers.includes(entry)) continue;
        if (((_a = entry.owner) == null ? void 0 : _a.nodeType) && !entry.owner.isConnected) {
          entry.remove();
          continue;
        }
        let id;
        try {
          id = entry.resolve(command);
        } catch (cause) {
          warn("Input router failed; command blocked.", { cause, deviceId: command.deviceId });
          return null;
        }
        if (id === void 0) continue;
        if (id === null) return null;
        if (Number.isSafeInteger(id) && id > 0) return id;
        if (id && typeof id.then === "function") Promise.resolve(id).catch(() => {
        });
        warn("Invalid focus association; command blocked.", { value: id, deviceId: command.deviceId });
        return null;
      }
      return 1;
    }
    function dispatchCommand(value) {
      var _a, _b;
      if (!running || !value || typeof value.deviceId !== "string" || !value.deviceId || typeof value.source !== "string" || typeof value.code !== "string" || !["press", "release", "repeat", "move", "cancel"].includes(value.phase)) return false;
      if (!active.has(value.source) || value.target && !accepts(value.source, value.target)) return false;
      const normalized = Object.freeze(__spreadProps(__spreadValues({}, value), {
        modifiers: Object.freeze(__spreadValues({}, value.modifiers)),
        action: value.action || ((_a = actionMaps[value.source]) == null ? void 0 : _a[value.code]) || null,
        timestamp: root.performance.now()
      }));
      const focusId = resolveFocusId(normalized);
      if (focusId === null) {
        api.dispatch("InputBlocked", { detail: { command: normalized } });
        return false;
      }
      const command = Object.freeze(__spreadProps(__spreadValues({}, normalized), { focusId }));
      if (command.intentional && (command.phase === "press" || command.phase === "repeat")) {
        setHintContext(focusId, { source: command.source, family: command.family || "generic", model: command.model || "", deviceId: command.deviceId });
        const html = root.document.documentElement;
        html.setAttribute(attr("active-input"), command.source);
        if (command.source === "gamepad") {
          html.setAttribute(attr("gamepad-family"), command.family);
          html.setAttribute(attr("gamepad-model"), command.model);
        }
      }
      if (!api.dispatch("BeforeInputCommand", { cancelable: true, detail: { command } })) return false;
      const response = api.comm.request("focus.command", command);
      const handled = response.handled && response.value === true;
      if (handled && ((_b = command.originalEvent) == null ? void 0 : _b.cancelable)) command.originalEvent.preventDefault();
      api.dispatch("InputCommand", { detail: { command, handled } });
      return handled;
    }
    function setActionMap(source, mapping) {
      actionMaps[source] = __spreadValues(__spreadValues({}, actionMaps[source]), mapping);
    }
    function registerGamepadFamily(identify, { priority = 0 } = {}) {
      if (typeof identify !== "function" || !Number.isFinite(priority)) throw new TypeError("Invalid gamepad family detector.");
      const entry = { identify, priority, order: familyOrder++ };
      families.push(entry);
      families.sort((a, b) => b.priority - a.priority || a.order - b.order);
      return () => {
        const index = families.indexOf(entry);
        if (index !== -1) families.splice(index, 1);
      };
    }
    function identifyFamily(id) {
      for (const entry of families) {
        const result = entry.identify(id);
        if (result) return result;
      }
      return null;
    }
    function deviceChanged(device, connected, operational) {
      if (running) root.document.documentElement.setAttribute(attr("gamepad"), String(operational));
      if (!connected) {
        for (const [id, context] of hintContexts) if (context.deviceId === device.deviceId) hintContexts.delete(id);
      }
      api.dispatch(connected ? "InputDeviceConnected" : "InputDeviceDisconnected", { detail: { device } });
      updateHints();
    }
    function setHintContext(focusId, context) {
      if (!Number.isSafeInteger(focusId) || focusId < 1) throw new TypeError("Invalid hint focusId.");
      hintContexts.set(focusId, Object.freeze(__spreadValues({}, context)));
      updateHints();
    }
    function restoreHint(element) {
      var _a;
      (_a = hints.get(element)) == null ? void 0 : _a.restore();
      hints.delete(element);
    }
    function updateHints() {
      for (const element of hints.keys()) if (!element.isConnected || !element.hasAttribute(attr("shortcut-hint"))) restoreHint(element);
      for (const element of mounted) {
        if (!element.isConnected || !element.hasAttribute(attr("shortcut-hint"))) continue;
        if (!hints.has(element)) hints.set(element, api.persist.element.save(
          element,
          ["shortcut-label", "shortcut-source", "gamepad-family", "shortcut-code", "gamepad-model"].map(attr),
          []
        ));
        const explicit = element.getAttribute(attr("shortcut-hint"));
        const owner = element.closest(`[${attr("shortcut")}]`);
        const descriptions = parseShortcuts(explicit || (owner == null ? void 0 : owner.getAttribute(attr("shortcut"))));
        const id = Number(element.getAttribute(attr("shortcut-focus")) || 1);
        const context = hintContexts.get(id) || { source: "keyboard", family: "generic" };
        const description = descriptions.find((item) => item.source === context.source) || descriptions[0];
        for (const [name, value] of [
          ["shortcut-label", shortcutLabel(description, context.family)],
          ["shortcut-source", (description == null ? void 0 : description.source) || ""],
          ["shortcut-code", (description == null ? void 0 : description.code) || ""],
          ["gamepad-family", context.family || "generic"],
          ["gamepad-model", context.model || ""]
        ]) element.setAttribute(attr(name), value);
      }
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.input.js.map
