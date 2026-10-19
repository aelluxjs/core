(function() {
  // src/src/aellux.ext.focus.js
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
      restoreLastFocus: restoreLastFocus
    });
    var attribute = AelluxJs.attr(extensionName);
    var snapshotKey = "ae-focus";
    var entries = [];
    var hintMemories = /* @__PURE__ */ new WeakMap();
    var nextElements = /* @__PURE__ */ new WeakSet();
    var textEntrySelector = "input:not([type]), input[type=text], input[type=search], input[type=email], input[type=url], input[type=tel], input[type=password], input[type=number], textarea, [contenteditable]:not([contenteditable=false])";
    var focusableSelector = "a[href], area[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])";
    var current = null, restoring = false;
    function init() {
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
      AelluxJs.onTarget(root, "$focus", onWindowFocus);
      AelluxJs.onTarget(root, "$blur", onWindowBlur);
      AelluxJs.on("SnapshotRestore", onSnapshotRestore);
      AelluxJs.on("UnpopFocusLost", onUnpopFocusLost);
      remember(document.activeElement, false);
    }
    function destroy() {
      AelluxJs.off("$focusin", onFocusIn, true);
      AelluxJs.off("$focus", onFocusChange, true);
      AelluxJs.off("$blur", onBlur, true);
      AelluxJs.offTarget(root, "$focus", onWindowFocus);
      AelluxJs.offTarget(root, "$blur", onWindowBlur);
      AelluxJs.off("SnapshotRestore", onSnapshotRestore);
      AelluxJs.off("UnpopFocusLost", onUnpopFocusLost);
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
          AelluxJs.onTarget(element, "$keydown", onNextKeyDown);
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
      if (nextElements.delete(element)) AelluxJs.offTarget(element, "$keydown", onNextKeyDown);
      (_hintMemories$get = hintMemories.get(element)) === null || _hintMemories$get === void 0 || _hintMemories$get.restore();
      hintMemories.delete(element);
    }
    function onNextKeyDown(event) {
      if (event.key !== "Enter" || event.isComposing || event.repeat || event.defaultPrevented || event.target !== event.currentTarget && event.target.closest(focusableSelector) !== event.currentTarget) return;
      var elements = document.querySelectorAll(focusableSelector);
      var foundCurrent = false;
      var _iterator = _createForOfIteratorHelper(elements), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var element = _step.value;
          if (element === event.currentTarget) {
            foundCurrent = true;
          } else if (foundCurrent && element.tabIndex >= 0 && isValid(element)) {
            event.preventDefault();
            element.focus();
            return;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
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
      var start = (index < 0 ? entries.length : index) - 1;
      for (var i = start; i >= 0; i--) {
        if (restore(entries[i])) return true;
      }
      return false;
    }
    function onUnpopFocusLost() {
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
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.focus.legacy.js.map
