(function() {
  // src/internal/input-shortcuts.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function parseShortcuts(value) {
    return String(value || "").split(";").map(function(part) {
      var match = part.trim().match(/^([a-z][a-z0-9-]*):([^:;\s]+)$/i);
      if (!match) return null;
      var tokens = match[2].split("+");
      var code = tokens.pop();
      var modifiers = tokens.map(function(token) {
        return token.toLowerCase();
      }).sort();
      if (!code || modifiers.some(function(token) {
        return !["alt", "ctrl", "meta", "shift"].includes(token);
      }) || new Set(modifiers).size !== modifiers.length) return null;
      return Object.freeze({
        source: match[1].toLowerCase(),
        code: code,
        modifiers: Object.freeze(modifiers)
      });
    }).filter(Boolean);
  }
  function matchesShortcut(shortcut, command) {
    var modifiers = command.modifiers || {};
    return shortcut.source === command.source && shortcut.code === command.code && ["alt", "ctrl", "meta", "shift"].every(function(name) {
      return !!modifiers[name] === shortcut.modifiers.includes(name);
    });
  }

  // src/src/aellux.ext.focus.js
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
  }
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r2) {
        return Object.getOwnPropertyDescriptor(e, r2).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
        _defineProperty(e, r2, t[r2]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
        Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
      });
    }
    return e;
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == _typeof(i) ? i : i + "";
  }
  function _toPrimitive(t, r) {
    if ("object" != _typeof(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
        t && (r = t);
        var _n = 0, F = function F2() {
        };
        return { s: F, n: function n() {
          return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
        }, e: function e2(r2) {
          throw r2;
        }, f: F };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o, a = true, u = false;
    return { s: function s() {
      t = t.call(r);
    }, n: function n() {
      var r2 = t.next();
      return a = r2.done, r2;
    }, e: function e2(r2) {
      u = true, o = r2;
    }, f: function f() {
      try {
        a || null == t.return || t.return();
      } finally {
        if (u) throw o;
      }
    } };
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
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
      restoreLastFocus: restoreLastFocus,
      createContext: createContext,
      destroyContext: destroyContext,
      getContext: getContext,
      setFocus: setFocus,
      updateContext: updateContext,
      eligibleShortcuts: eligibleShortcuts,
      registerShortcutAction: registerShortcutAction
    });
    var attribute = AelluxJs.attr(extensionName);
    var snapshotKey = "ae-focus";
    var entries = [];
    var hintMemories = /* @__PURE__ */ new WeakMap();
    var nextElements = /* @__PURE__ */ new WeakSet();
    var textEntrySelector = "input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])";
    var focusableSelector = "a[href], area[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])";
    var current = null, restoring = false;
    var contexts = /* @__PURE__ */ new Map();
    var shortcutActions = /* @__PURE__ */ new Map();
    var contextObserver = null;
    var scopeSelector = "[".concat(AelluxJs.attr("focus-scope"), '], dialog, [aria-modal="true"]');
    var focusClasses = [null, AelluxJs.className("focus-player1"), AelluxJs.className("focus-player2"), AelluxJs.className("focus-player3")];
    var focusClass = function focusClass2(id) {
      return focusClasses[id] || AelluxJs.className("focus-player" + id);
    };
    function init() {
      createContext(1);
      AelluxJs.comm.handle("focus.command", consumeCommand, {
        owner: extensionName
      });
      AelluxJs.comm.handle("focus.context", function(_ref) {
        var focusId = _ref.focusId;
        return getContext(focusId);
      }, {
        owner: extensionName
      });
      contextObserver = new root.MutationObserver(function(records) {
        if (records.some(function(record) {
          return Array.from(contexts.values()).some(function(context) {
            return !context.scope.isConnected || context.element && (record.type === "attributes" && record.target.contains(context.element) || record.type === "childList" && Array.from(record.removedNodes).some(function(node) {
              return node.contains(context.element);
            }));
          });
        })) pruneContexts();
      });
      contextObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "inert", "disabled", "aria-disabled", "class", "style"]
      });
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attribute, "]"),
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
      var _contextObserver;
      AelluxJs.comm.removeOwner(extensionName);
      (_contextObserver = contextObserver) === null || _contextObserver === void 0 || _contextObserver.disconnect();
      contextObserver = null;
      var _iterator = _createForOfIteratorHelper(contexts.values()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var context = _step.value;
          clearContext(context);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
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
      var _hintMemories$get;
      if (nextElements.delete(element)) AelluxJs.offEvent(element, "$keydown", onNextKeyDown);
      (_hintMemories$get = hintMemories.get(element)) === null || _hintMemories$get === void 0 || _hintMemories$get.restore();
      hintMemories.delete(element);
    }
    function onNextKeyDown(event) {
      if (event.key !== "Enter" || event.isComposing || event.repeat || event.defaultPrevented || event.target !== event.currentTarget && event.target.closest(focusableSelector) !== event.currentTarget) return;
      var elements = document.querySelectorAll(focusableSelector);
      var foundCurrent = false;
      var _iterator2 = _createForOfIteratorHelper(elements), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var element = _step2.value;
          if (element === event.currentTarget) {
            foundCurrent = true;
          } else if (foundCurrent && element.tabIndex >= 0 && isValid(element)) {
            event.preventDefault();
            element.focus();
            return;
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
    function isValid(element) {
      if (!element || element === document.body || element === document.documentElement || !element.isConnected || typeof element.focus !== "function" || element.matches(":disabled, [disabled], [hidden], [inert]") || element.closest('[aria-disabled="true"]')) return false;
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
        element: element
      };
      entries.push(entry);
      if (entries.length > 100) entries.shift();
      current = entry;
      if (!push || !stateNavigationEligible(element) || !element.id || !element.id.trim()) return;
      AelluxJs.dispatch("PushState", {
        detail: {
          key: snapshotKey,
          value: element.id
        }
      });
    }
    function stateNavigationEligible(element) {
      if (element.hasAttribute(attribute)) return true;
      var name = element.tagName && element.tagName.toLowerCase();
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
      Promise.resolve().then(function() {
        return syncNative(document.activeElement);
      });
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
      var index = entries.indexOf(current);
      var start = (index < 0 ? entries.length : index) - 1;
      for (var i = start; i >= 0; i--) {
        if (restore(entries[i])) return true;
      }
      return false;
    }
    function onDismissFocusLost() {
      restoreLastFocus();
    }
    function onSnapshotRestore(event) {
      var snapshot = event.detail && event.detail.snapshot;
      if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, snapshotKey)) return;
      var target = document.getElementById(snapshot[snapshotKey]);
      if (target && stateNavigationEligible(target)) {
        for (var i = entries.length - 1; i >= 0; i--) {
          if (entries[i].element === target) {
            if (!restore(entries[i])) restoreLastFocus();
            return;
          }
        }
        if (restore({
          element: target
        })) return;
      }
      restoreLastFocus();
    }
    function warn(reason) {
      var extra = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, _objectSpread({
        extension: extensionName,
        reason: reason
      }, extra));
    }
    function getContext() {
      var focusId = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
      var context = contexts.get(focusId);
      return context ? Object.freeze(_objectSpread({}, context)) : null;
    }
    function createContext(focusId) {
      var _ref2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref2$scope = _ref2.scope, scope = _ref2$scope === void 0 ? document.body : _ref2$scope, _ref2$syncDOM = _ref2.syncDOM, syncDOM = _ref2$syncDOM === void 0 ? focusId === 1 : _ref2$syncDOM;
      if (!Number.isSafeInteger(focusId) || focusId < 1 || contexts.has(focusId) || !scope || scope.nodeType !== 1 || !scope.isConnected || focusId !== 1 && syncDOM) return false;
      contexts.set(focusId, {
        focusId: focusId,
        element: null,
        scope: scope,
        syncDOM: !!syncDOM
      });
      return getContext(focusId);
    }
    function clearContext(context) {
      var previous = context.element;
      context.element = null;
      previous === null || previous === void 0 || previous.classList.remove(focusClass(context.focusId));
      if (previous) publishFocus({
        focusId: context.focusId,
        element: null,
        previous: previous
      });
    }
    function publishFocus(detail) {
      AelluxJs.comm.emit("focus.changed", detail);
      AelluxJs.dispatch("FocusChange", {
        detail: detail
      });
    }
    function destroyContext(focusId) {
      if (focusId === 1 || !contexts.has(focusId)) return false;
      clearContext(contexts.get(focusId));
      contexts.delete(focusId);
      AelluxJs.comm.emit("focus.context-destroyed", {
        focusId: focusId
      });
      AelluxJs.dispatch("FocusContextDestroy", {
        detail: {
          focusId: focusId
        }
      });
      return true;
    }
    function updateContext(focusId) {
      var _ref3 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, scope = _ref3.scope, syncDOM = _ref3.syncDOM;
      var context = contexts.get(focusId);
      if (!context || scope && (scope.nodeType !== 1 || !scope.isConnected) || focusId !== 1 && syncDOM) return false;
      if (scope) context.scope = scope;
      if (syncDOM !== void 0) context.syncDOM = !!syncDOM;
      if (context.element && !context.scope.contains(context.element)) clearContext(context);
      if (context.syncDOM) syncNative(document.activeElement);
      return getContext(focusId);
    }
    function assign(context, element) {
      if (context.element === element) return true;
      var previous = context.element;
      previous === null || previous === void 0 || previous.classList.remove(focusClass(context.focusId));
      context.element = element;
      element === null || element === void 0 || element.classList.add(focusClass(context.focusId));
      publishFocus({
        focusId: context.focusId,
        element: element,
        previous: previous
      });
      return true;
    }
    function setFocus(focusId, elementOrId) {
      var _context$element;
      var context = contexts.get(focusId);
      var element = typeof elementOrId === "string" ? document.getElementById(elementOrId.replace(/^#/, "")) : elementOrId;
      if (!context || element !== null && (!isValid(element) || !context.scope.contains(element))) return false;
      if (element && context.syncDOM) {
        element.focus();
        if (document.activeElement !== element) return false;
      }
      if (!element && context.syncDOM) (_context$element = context.element) === null || _context$element === void 0 || _context$element.blur();
      return assign(context, element);
    }
    function syncNative(element) {
      var context = contexts.get(1);
      if (context !== null && context !== void 0 && context.syncDOM) assign(context, isValid(element) && context.scope.contains(element) ? element : null);
    }
    function pruneContexts() {
      var _iterator3 = _createForOfIteratorHelper(contexts.values()), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var context = _step3.value;
          if (!context.scope.isConnected && context.focusId !== 1) {
            destroyContext(context.focusId);
            continue;
          }
          if (context.element && (!isValid(context.element) || !context.scope.contains(context.element))) clearContext(context);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      for (var index = entries.length - 1; index >= 0; index--) if (!entries[index].element.isConnected) entries.splice(index, 1);
      if (current && !current.element.isConnected) current = null;
    }
    function onContextUnmount(event) {
      var _event$detail = event.detail, scope = _event$detail.root, extensions = _event$detail.extensions;
      if (extensions && !extensions.includes(extensionName)) return;
      if (event.detail.detachedOnly) {
        pruneContexts();
        return;
      }
      var _iterator4 = _createForOfIteratorHelper(contexts.values()), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var context = _step4.value;
          if (context.focusId !== 1 && scope.contains(context.scope)) destroyContext(context.focusId);
          else if (context.element && scope.contains(context.element)) clearContext(context);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      for (var index = entries.length - 1; index >= 0; index--) if (scope.contains(entries[index].element)) entries.splice(index, 1);
      if (current && scope.contains(current.element)) current = null;
    }
    function onContextMount() {
      syncNative(document.activeElement);
      var _iterator5 = _createForOfIteratorHelper(contexts.values()), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var context = _step5.value;
          if (context.element && isValid(context.element)) context.element.classList.add(focusClass(context.focusId));
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
    function activeScope(context) {
      var _context$element2;
      var nearest = (_context$element2 = context.element) === null || _context$element2 === void 0 ? void 0 : _context$element2.closest(scopeSelector);
      var scope = nearest && context.scope.contains(nearest) ? nearest : context.scope;
      var modal = Array.from(document.querySelectorAll('dialog[open], [aria-modal="true"]')).reverse().find(function(element) {
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
      var nearest = element.closest(scopeSelector);
      return !nearest || nearest === scope || !scope.contains(nearest);
    }
    function distance(a, b, scope) {
      var ancestors = /* @__PURE__ */ new Map();
      var depth = 0;
      for (var node = a; node; node = node.parentElement) {
        ancestors.set(node, depth++);
        if (node === scope) break;
      }
      depth = 0;
      for (var _node = b; _node; _node = _node.parentElement) {
        if (ancestors.has(_node)) return depth + ancestors.get(_node);
        if (_node === scope) break;
        depth++;
      }
      return Infinity;
    }
    function eligibleShortcuts() {
      var focusId = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
      var command = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
      var context = contexts.get(focusId);
      if (!context || !context.element || !isValid(context.element)) return [];
      var scope = activeScope(context);
      if (!scope) return [];
      var shortcutAttribute = AelluxJs.attr("shortcut");
      var candidates = [scope].concat(_toConsumableArray(scope.querySelectorAll("[".concat(shortcutAttribute, "]")))).filter(function(element) {
        return element.hasAttribute(shortcutAttribute) && available(element, scope);
      });
      return candidates.map(function(element, order) {
        return {
          element: element,
          order: order,
          shortcuts: parseShortcuts(element.getAttribute(shortcutAttribute)),
          distance: distance(context.element, element, scope),
          priority: Number(element.getAttribute(AelluxJs.attr("shortcut-priority"))) || 0
        };
      }).filter(function(item) {
        return !command || item.shortcuts.some(function(shortcut) {
          return matchesShortcut(shortcut, command);
        });
      }).sort(function(a, b) {
        return a.distance - b.distance || b.priority - a.priority || a.order - b.order;
      });
    }
    function registerShortcutAction(name, handler) {
      var _ref4 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, signal = _ref4.signal;
      if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof handler !== "function" || shortcutActions.has(name)) throw new TypeError("Invalid or duplicate shortcut action.");
      var _remove = function remove() {
        if (shortcutActions.get(name) === handler) shortcutActions.delete(name);
        signal === null || signal === void 0 || signal.removeEventListener("abort", _remove);
      };
      if (!(signal !== null && signal !== void 0 && signal.aborted)) {
        shortcutActions.set(name, handler);
        signal === null || signal === void 0 || signal.addEventListener("abort", _remove, {
          once: true
        });
      }
      return _remove;
    }
    function executeShortcut(element, command) {
      var action = element.getAttribute(AelluxJs.attr("shortcut-action")) || "click";
      if (!AelluxJs.dispatchFrom(element, "BeforeShortcut", {
        cancelable: true,
        detail: {
          command: command,
          action: action
        }
      })) return false;
      if (action === "click") element.click();
      else {
        var handler = shortcutActions.get(action);
        if (handler) {
          if (handler(element, command) === false) return false;
        } else if (["pop", "unpop", "dismiss"].includes(action)) {
          var id = element.getAttribute(AelluxJs.attr("shortcut-target"));
          var target = id ? document.getElementById(id.replace(/^#/, "")) : element;
          if (!target) return false;
          var response = AelluxJs.comm.request("present." + action, {
            element: target
          });
          if (!response.handled) return false;
        } else {
          warn("Unknown shortcut action.", {
            value: action,
            element: element
          });
          return false;
        }
      }
      AelluxJs.dispatchFrom(element, "Shortcut", {
        detail: {
          command: command,
          action: action
        }
      });
      return true;
    }
    function consumeCommand(command) {
      var _command$originalEven, _command$originalEven2, _command$modifiers, _command$modifiers2, _command$modifiers3, _command$action;
      var context = contexts.get(command.focusId);
      if (!context) {
        warn("Input command refers to an unknown focus context; command blocked.", {
          focusId: command.focusId
        });
        return false;
      }
      if (!["press", "repeat"].includes(command.phase) || (_command$originalEven = command.originalEvent) !== null && _command$originalEven !== void 0 && _command$originalEven.defaultPrevented) return false;
      if (command.source === "point") return false;
      var focused = context.element;
      var inputScope = (focused || context.scope).closest("[".concat(AelluxJs.attr("inputs"), "]"));
      if (inputScope && !inputScope.getAttribute(AelluxJs.attr("inputs")).split(/\s+/).includes(command.source)) return false;
      var origin = (_command$originalEven2 = command.originalEvent) === null || _command$originalEven2 === void 0 ? void 0 : _command$originalEven2.target;
      var editable = function editable2(element) {
        return element === null || element === void 0 ? void 0 : element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]');
      };
      var reserved = ((_command$modifiers = command.modifiers) === null || _command$modifiers === void 0 ? void 0 : _command$modifiers.meta) || ((_command$modifiers2 = command.modifiers) === null || _command$modifiers2 === void 0 ? void 0 : _command$modifiers2.ctrl) && ["KeyW", "KeyT", "KeyN", "KeyR", "KeyL", "KeyF", "KeyP", "KeyS", "KeyC", "KeyV", "KeyX", "KeyA", "KeyZ", "KeyY"].includes(command.code) || ((_command$modifiers3 = command.modifiers) === null || _command$modifiers3 === void 0 ? void 0 : _command$modifiers3.alt) && ["ArrowLeft", "ArrowRight", "F4"].includes(command.code);
      if (command.source === "keyboard" && (editable(origin) || editable(focused) || command.code === "Tab" || reserved)) return false;
      var candidate = eligibleShortcuts(command.focusId, command)[0];
      if (candidate && command.phase === "press") return executeShortcut(candidate.element, command);
      if (context.syncDOM && command.source === "keyboard") return false;
      var scope = activeScope(context);
      if (!scope) return false;
      if (command.action === "confirm" && command.phase === "press" && focused && available(focused, scope)) {
        focused.click();
        return true;
      }
      if (!((_command$action = command.action) !== null && _command$action !== void 0 && _command$action.startsWith("navigate-"))) return false;
      var elements = Array.from(scope.querySelectorAll(focusableSelector)).filter(function(element) {
        return element.tabIndex >= 0 && available(element, scope);
      });
      if (!elements.length) return false;
      var index = elements.indexOf(focused);
      var direction = command.action.slice(9);
      var step = direction === "left" || direction === "up" ? -1 : 1;
      var next = index < 0 ? step > 0 ? 0 : elements.length - 1 : Math.max(0, Math.min(elements.length - 1, index + step));
      return setFocus(command.focusId, elements[next]);
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.focus.legacy.js.map
