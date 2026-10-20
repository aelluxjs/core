(function() {
  // src/src/aellux.ext.anchor.js
  function _regenerator() {
    /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
    var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag";
    function i(r2, n2, o2, i2) {
      var c2 = n2 && n2.prototype instanceof Generator ? n2 : Generator, u2 = Object.create(c2.prototype);
      return _regeneratorDefine2(u2, "_invoke", (function(r3, n3, o3) {
        var i3, c3, u3, f2 = 0, p = o3 || [], y = false, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d2(t2, r4) {
          return i3 = t2, c3 = 0, u3 = e, G.n = r4, a;
        } };
        function d(r4, n4) {
          for (c3 = r4, u3 = n4, t = 0; !y && f2 && !o4 && t < p.length; t++) {
            var o4, i4 = p[t], d2 = G.p, l = i4[2];
            r4 > 3 ? (o4 = l === n4) && (u3 = i4[(c3 = i4[4]) ? 5 : (c3 = 3, 3)], i4[4] = i4[5] = e) : i4[0] <= d2 && ((o4 = r4 < 2 && d2 < i4[1]) ? (c3 = 0, G.v = n4, G.n = i4[1]) : d2 < l && (o4 = r4 < 3 || i4[0] > n4 || n4 > l) && (i4[4] = r4, i4[5] = n4, G.n = l, c3 = 0));
          }
          if (o4 || r4 > 1) return a;
          throw y = true, n4;
        }
        return function(o4, p2, l) {
          if (f2 > 1) throw TypeError("Generator is already running");
          for (y && 1 === p2 && d(p2, l), c3 = p2, u3 = l; (t = c3 < 2 ? e : u3) || !y; ) {
            i3 || (c3 ? c3 < 3 ? (c3 > 1 && (G.n = -1), d(c3, u3)) : G.n = u3 : G.v = u3);
            try {
              if (f2 = 2, i3) {
                if (c3 || (o4 = "next"), t = i3[o4]) {
                  if (!(t = t.call(i3, u3))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  u3 = t.value, c3 < 2 && (c3 = 0);
                } else 1 === c3 && (t = i3.return) && t.call(i3), c3 < 2 && (u3 = TypeError("The iterator does not provide a '" + o4 + "' method"), c3 = 1);
                i3 = e;
              } else if ((t = (y = G.n < 0) ? u3 : r3.call(n3, G)) !== a) break;
            } catch (t2) {
              i3 = e, c3 = 1, u3 = t2;
            } finally {
              f2 = 1;
            }
          }
          return { value: t, done: y };
        };
      })(r2, o2, i2), true), u2;
    }
    var a = {};
    function Generator() {
    }
    function GeneratorFunction() {
    }
    function GeneratorFunctionPrototype() {
    }
    t = Object.getPrototypeOf;
    var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function() {
      return this;
    }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
    function f(e2) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e2, GeneratorFunctionPrototype) : (e2.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e2, o, "GeneratorFunction")), e2.prototype = Object.create(u), e2;
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function() {
      return this;
    }), _regeneratorDefine2(u, "toString", function() {
      return "[object Generator]";
    }), (_regenerator = function _regenerator2() {
      return { w: i, m: f };
    })();
  }
  function _regeneratorDefine2(e, r, n, t) {
    var i = Object.defineProperty;
    try {
      i({}, "", {});
    } catch (e2) {
      i = 0;
    }
    _regeneratorDefine2 = function _regeneratorDefine(e2, r2, n2, t2) {
      function o(r3, n3) {
        _regeneratorDefine2(e2, r3, function(e3) {
          return this._invoke(r3, n3, e3);
        });
      }
      r2 ? i ? i(e2, r2, { value: n2, enumerable: !t2, configurable: !t2, writable: !t2 }) : e2[r2] = n2 : (o("next", 0), o("throw", 1), o("return", 2));
    }, _regeneratorDefine2(e, r, n, t);
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
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e, n, i, u, a = [], f = true, o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f = false;
        } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
      } catch (r2) {
        o = true, n = r2;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
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
  function asyncGeneratorStep(n, t, e, r, o, a, c) {
    try {
      var i = n[a](c), u = i.value;
    } catch (n2) {
      return void e(n2);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
  }
  function _asyncToGenerator(n) {
    return function() {
      var t = this, e = arguments;
      return new Promise(function(r, o) {
        var a = n.apply(t, e);
        function _next(n2) {
          asyncGeneratorStep(a, r, o, _next, _throw, "next", n2);
        }
        function _throw(n2) {
          asyncGeneratorStep(a, r, o, _next, _throw, "throw", n2);
        }
        _next(void 0);
      });
    };
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var AelluxJs = root.AelluxJs;
    var extensionName = "anchor";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    var ORIGIN_X = "--ae-anchor-origin-x", ORIGIN_Y = "--ae-anchor-origin-y", ANCHOR_OPACITY = "--anchor-opacity";
    var attribute = AelluxJs.attr(extensionName);
    var presentAttribute = AelluxJs.attr("present");
    var targetAttribute = AelluxJs.attr("anchor-target");
    var matchAttribute = AelluxJs.attr("anchor-match");
    var groupAttribute = AelluxJs.attr("present-group");
    var groupAnchorAttribute = AelluxJs.attr("present-group-anchor");
    var layoutEvent = AelluxJs.eventName("Layout");
    var anchoredClass = AelluxJs.className("anchored");
    var switchingClass = AelluxJs.className("anchor-switching");
    var baseProperties = ["position", "left", "top", "transform", "transform-origin"];
    var ownedProperties = [].concat(baseProperties, ["--ae-anchor-x", "--ae-anchor-y", ORIGIN_X, ORIGIN_Y, ANCHOR_OPACITY, "--ae-anchor-target-width", "--ae-anchor-target-height", "--ae-anchor-pivot-x", "--ae-anchor-pivot-y"]);
    var pivots = {
      "top-left": [0, 0],
      "top-center": [0.5, 0],
      "top-right": [1, 0],
      "center-left": [0, 0.5],
      center: [0.5, 0.5],
      "center-right": [1, 0.5],
      "bottom-left": [0, 1],
      "bottom-center": [0.5, 1],
      "bottom-right": [1, 1]
    };
    var anchors = /* @__PURE__ */ new Map();
    var elementMemories = /* @__PURE__ */ new WeakMap();
    var nextLayoutId = 2e6;
    var mutations = null;
    var weakStyle = null;
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy
    });
    function init() {
      weakStyle = document.createElement("style");
      weakStyle.setAttribute(AelluxJs.attr("anchor-style"), "");
      weakStyle.textContent = "\n      :where([".concat(attribute, "][").concat(matchAttribute, '~="width"]) {\n        width:var(--ae-anchor-target-width,0px);box-sizing:border-box;\n      }\n      :where([').concat(attribute, "][").concat(matchAttribute, '~="height"]) {\n        height:var(--ae-anchor-target-height,0px);box-sizing:border-box;\n      }\n      :where([').concat(attribute, "][").concat(matchAttribute, "].").concat(anchoredClass, ") {\n        transform:translate3d(var(--ae-anchor-pivot-x),var(--ae-anchor-pivot-y),0)\n          translate(calc(0% - var(--ae-anchor-origin-x)),calc(0% - var(--ae-anchor-origin-y)));\n      }\n      :where([").concat(attribute, "].").concat(switchingClass, ") {\n        transition-property:transform,width,height;\n        transition-duration:var(--ae-anchor-switch-duration,0ms);\n        transition-timing-function:var(--ae-anchor-switch-ease,ease-in-out);transition-delay:0s;\n      }\n      :where(html[").concat(AelluxJs.attr("reduced-motion"), '="reduced"] [').concat(attribute, "].").concat(switchingClass, ") {transition:none;}\n    ").replace(/\s*([{};:,])\s*/g, "$1").replace(/;}/g, "}").trim();
      document.head.appendChild(weakStyle);
      AelluxJs.registerCssProperty({
        name: "--ae-anchor-x",
        syntax: "<length>",
        initialValue: "0px"
      }, {
        name: "--ae-anchor-y",
        syntax: "<length>",
        initialValue: "0px"
      }, {
        name: "--ae-anchor-target-width",
        syntax: "<length>",
        initialValue: "0px"
      }, {
        name: "--ae-anchor-target-height",
        syntax: "<length>",
        initialValue: "0px"
      }, {
        name: "--ae-anchor-switch-duration",
        syntax: "<time>",
        initialValue: "0ms"
      }, {
        name: ORIGIN_X,
        syntax: "<percentage>",
        initialValue: "50%"
      }, {
        name: ORIGIN_Y,
        syntax: "<percentage>",
        initialValue: "0%"
      }, {
        name: ANCHOR_OPACITY,
        syntax: "<number>",
        initialValue: "1"
      });
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attribute, "]"),
        priority: 0,
        mount: mountAnchor,
        unmount: unmountAnchor,
        update: function update(element) {
          return updateAnchor(element, true);
        }
      });
    }
    function destroy() {
      return _destroy.apply(this, arguments);
    }
    function _destroy() {
      _destroy = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee() {
        var _weakStyle;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              _context.n = 1;
              return Promise.all(Array.from(anchors.keys(), unmountAnchor));
            case 1:
              AelluxJs.mountManager.remove({
                extensionName: extensionName
              });
              (_weakStyle = weakStyle) === null || _weakStyle === void 0 || _weakStyle.remove();
              weakStyle = null;
            case 2:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _destroy.apply(this, arguments);
    }
    function mountAnchor(element) {
      if (anchors.has(element)) return;
      elementMemories.set(element, AelluxJs.persist.element.save(element, [], ownedProperties));
      var state = {
        invalidContext: false,
        active: false,
        revision: 0,
        target: null,
        resolvedTarget: null,
        reference: null,
        group: null,
        conflict: false,
        lastPlacement: null,
        switchTimer: null,
        interruptSwitch: false,
        layoutId: nextLayoutId++,
        styleLayoutId: nextLayoutId++,
        layoutUntil: 0,
        layoutSingle: false,
        layoutFinalPending: false,
        layoutPolling: false,
        updatePending: false,
        updateDirty: false,
        repeatPending: false,
        lastUpdateAt: -Infinity,
        updateTimer: null,
        updateTimerDue: false,
        layoutListener: function layoutListener(event) {
          return scheduleLayoutUpdate(event);
        },
        observer: null,
        intersectionObserver: null
      };
      anchors.set(element, state);
      if (element.offsetParent) listenForLayout(state, element.offsetParent);
      if (anchors.size === 1) {
        AelluxJs.onEvent(root, "$scroll", scheduleUpdate, {
          capture: true,
          passive: true
        });
        AelluxJs.onEvent(root, "$resize", scheduleUpdate);
        AelluxJs.on("PresentGroupChange", onGroupChange);
        if (typeof root.MutationObserver === "function") {
          mutations = new root.MutationObserver(onMutations);
          mutations.observe(document, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: [attribute, targetAttribute, matchAttribute, groupAttribute, groupAnchorAttribute, AelluxJs.attr("reduced-motion"), "id", "hidden", "class", "style"]
          });
        }
      }
      if (typeof root.ResizeObserver === "function") {
        state.observer = new root.ResizeObserver(function(entries) {
          if (state.switchTimer !== null && entries.every(function(entry) {
            return entry.target === element;
          })) return;
          scheduleAnchor(element);
        });
      }
      if (typeof root.IntersectionObserver === "function") {
        state.intersectionObserver = new root.IntersectionObserver(function() {
          return scheduleAnchor(element);
        });
      }
      refreshAssociations();
      return updateAnchor(element);
    }
    function unmountAnchor(_x) {
      return _unmountAnchor.apply(this, arguments);
    }
    function _unmountAnchor() {
      _unmountAnchor = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2(element) {
        var state, memory;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.n) {
            case 0:
              state = anchors.get(element);
              if (state) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2);
            case 1:
              memory = elementMemories.get(element);
              elementMemories.delete(element);
              state.revision++;
              stopSwitch(element, state);
              if (state.reference) AelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
              if (state.observer) state.observer.disconnect();
              if (state.intersectionObserver) state.intersectionObserver.disconnect();
              if (state.updateTimer !== null) root.clearTimeout(state.updateTimer);
              anchors.delete(element);
              if (!anchors.size) {
                AelluxJs.offEvent(root, "$scroll", scheduleUpdate, true);
                AelluxJs.offEvent(root, "$resize", scheduleUpdate);
                AelluxJs.off("PresentGroupChange", onGroupChange);
                if (mutations) mutations.disconnect();
                mutations = null;
              }
              AelluxJs.waitLayout.cancel(state.layoutId);
              AelluxJs.waitLayout.cancel(state.styleLayoutId);
              _context2.n = 2;
              return AelluxJs.waitLayout.update(state.styleLayoutId, deactivate, [element, state, memory]);
            case 2:
              return _context2.a(2);
          }
        }, _callee2);
      }));
      return _unmountAnchor.apply(this, arguments);
    }
    function scheduleUpdate() {
      if (!anchors.size) return;
      var _iterator = _createForOfIteratorHelper(anchors), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var _step$value = _slicedToArray(_step.value, 2), element = _step$value[0], state = _step$value[1];
          state.interruptSwitch = true;
          scheduleAnchor(element);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    function onGroupChange(event) {
      var _iterator2 = _createForOfIteratorHelper(anchors), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var _event$detail;
          var _step2$value = _slicedToArray(_step2.value, 2), element = _step2$value[0], state = _step2$value[1];
          if (state.group === ((_event$detail = event.detail) === null || _event$detail === void 0 ? void 0 : _event$detail.group)) scheduleAnchor(element);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
    function onMutations(records) {
      var affected = /* @__PURE__ */ new Set();
      var associationSelector = "[".concat(groupAnchorAttribute, "],[").concat(attribute, "]");
      var containsAssociation = function containsAssociation2(node2) {
        return node2.nodeType === 1 && (node2.matches(associationSelector) || node2.querySelector(associationSelector));
      };
      var associationsChanged = false;
      var _iterator3 = _createForOfIteratorHelper(records), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var record = _step3.value;
          var node = record.target;
          var structural = record.type === "childList";
          var visual = record.attributeName === "class" || record.attributeName === "style";
          if (structural ? [].concat(_toConsumableArray(record.addedNodes), _toConsumableArray(record.removedNodes)).some(containsAssociation) : record.attributeName === groupAnchorAttribute || record.attributeName === groupAttribute || (record.attributeName === "id" || record.attributeName === attribute) && (anchors.has(node) || node.hasAttribute(attribute))) associationsChanged = true;
          var _iterator6 = _createForOfIteratorHelper(anchors), _step6;
          try {
            for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
              var _state$reference;
              var _step6$value = _slicedToArray(_step6.value, 2), _element = _step6$value[0], state = _step6$value[1];
              if (visual) {
                if (node !== _element && state.resolvedTarget && node.contains(state.resolvedTarget)) affected.add(_element);
                continue;
              }
              if (node === _element || node === document.documentElement || node.contains(_element) || state.resolvedTarget && node.contains(state.resolvedTarget) || structural && (_state$reference = state.reference) !== null && _state$reference !== void 0 && _state$reference.contains(node) || !state.group && _element.hasAttribute(targetAttribute) && resolveElement(_element.getAttribute(targetAttribute)) !== state.resolvedTarget) affected.add(_element);
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      if (associationsChanged) {
        refreshAssociations();
        var _iterator4 = _createForOfIteratorHelper(anchors.keys()), _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
            var element = _step4.value;
            affected.add(element);
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }
      var _iterator5 = _createForOfIteratorHelper(affected), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var _element2 = _step5.value;
          scheduleAnchor(_element2);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
    function associationDiagnostic(group, reason) {
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_ANCHOR_GROUP, {
        extension: extensionName,
        element: group,
        reason: reason
      });
    }
    function refreshAssociations() {
      var _iterator7 = _createForOfIteratorHelper(anchors.values()), _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
          var state = _step7.value;
          state.group = null;
          state.conflict = false;
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      var _iterator8 = _createForOfIteratorHelper(document.querySelectorAll("[".concat(groupAttribute, "][").concat(groupAnchorAttribute, "]"))), _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
          var group = _step8.value;
          var id = (group.getAttribute(groupAnchorAttribute) || "").replace(/^#/, "");
          var element = id && !/\s/.test(id) ? document.getElementById(id) : null;
          if (!element || !element.hasAttribute(attribute)) {
            associationDiagnostic(group, "Expected an existing Anchor ID.");
            continue;
          }
          var _state = anchors.get(element);
          if (!_state) continue;
          if (_state.group) {
            _state.conflict = true;
            associationDiagnostic(group, "Multiple groups reference the same Anchor.");
          } else _state.group = group;
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
    }
    function effectiveTarget(element, state) {
      var _AelluxJs$ext$present, _AelluxJs$ext$present2;
      if (state.conflict) return null;
      if (state.group) return ((_AelluxJs$ext$present = AelluxJs.ext.present) === null || _AelluxJs$ext$present === void 0 || (_AelluxJs$ext$present2 = _AelluxJs$ext$present.selected) === null || _AelluxJs$ext$present2 === void 0 ? void 0 : _AelluxJs$ext$present2.call(_AelluxJs$ext$present, state.group)) || null;
      var value = element.getAttribute(targetAttribute);
      return value && value.trim() ? resolveElement(value) : element.offsetParent;
    }
    function circularTarget(element, target) {
      var visited = /* @__PURE__ */ new Set([element]);
      while (target) {
        if (visited.has(target)) return true;
        visited.add(target);
        var state = anchors.get(target);
        if (!state) return false;
        target = effectiveTarget(target, state);
      }
      return false;
    }
    function scheduleLayoutUpdate(event) {
      var durationMs = Number(event && event.detail ? event.detail.durationMs : NaN);
      if (!Number.isFinite(durationMs) || durationMs < 0) {
        scheduleUpdate();
        return;
      }
      if (durationMs === 0) {
        var _iterator9 = _createForOfIteratorHelper(anchors), _step9;
        try {
          for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
            var _step9$value = _slicedToArray(_step9.value, 2), element = _step9$value[0], state = _step9$value[1];
            var maxFPS = AelluxJs.layoutMaxFPS(element);
            state.layoutUntil = now() + 1e3 / (maxFPS || 60);
            state.layoutSingle = true;
            state.layoutFinalPending = true;
            scheduleAnchor(element, true);
          }
        } catch (err) {
          _iterator9.e(err);
        } finally {
          _iterator9.f();
        }
        return;
      }
      var _iterator0 = _createForOfIteratorHelper(anchors), _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done; ) {
          var _step0$value = _slicedToArray(_step0.value, 2), _element3 = _step0$value[0], _state2 = _step0$value[1];
          _state2.layoutUntil = Math.max(_state2.layoutUntil, now() + durationMs);
          _state2.layoutSingle = false;
          _state2.layoutFinalPending = true;
          scheduleAnchor(_element3, durationMs > 0);
        }
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
    }
    function scheduleAnchor(element) {
      var repeat = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
      var state = anchors.get(element);
      if (!state) return;
      if (state.updatePending) {
        state.updateDirty = true;
        state.repeatPending = state.repeatPending || repeat;
        return;
      }
      var maxFPS = AelluxJs.layoutMaxFPS(element);
      if (maxFPS && !repeat && !state.updateTimerDue) {
        if (state.updateTimer === null) {
          state.updateTimer = root.setTimeout(function() {
            state.updateTimer = null;
            state.updateTimerDue = true;
            scheduleAnchor(element);
          }, 1e3 / maxFPS);
        }
        return;
      }
      state.updateTimerDue = false;
      var due = maxFPS ? state.lastUpdateAt + 1e3 / maxFPS : -Infinity;
      if (due > now()) {
        if (state.updateTimer === null) {
          state.updateTimer = root.setTimeout(function() {
            state.updateTimer = null;
            scheduleAnchor(element, repeat);
          }, Math.max(0, due - now()));
        }
        return;
      }
      if (state.layoutPolling) {
        state.updateDirty = true;
        return;
      }
      var run = function run2() {
        if (state.layoutSingle && now() < state.layoutUntil) return;
        state.layoutSingle = false;
        if (repeat && now() >= state.layoutUntil) state.layoutFinalPending = false;
        requestAnchorUpdate(element, state);
      };
      if (repeat) state.layoutPolling = true;
      var sequence = AelluxJs.waitLayout.sequence(state.layoutId, {
        update: run,
        repeat: repeat ? {
          ms: 0
        } : void 0,
        maxFPS: maxFPS,
        abort: function abort() {
          return !anchors.has(element) || repeat && now() >= state.layoutUntil && !state.layoutSingle && !state.layoutFinalPending;
        }
      });
      if (repeat) sequence.finally(function() {
        if (anchors.get(element) !== state) return;
        state.layoutPolling = false;
        if (state.updateDirty) scheduleAnchor(element);
      });
    }
    function requestAnchorUpdate(element, state) {
      if (state.updatePending) {
        state.updateDirty = true;
        return;
      }
      state.updatePending = true;
      state.updateDirty = false;
      updateAnchor(element).catch(function(cause) {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT, {
          cause: cause,
          extension: extensionName,
          element: element,
          method: "update"
        });
      }).finally(function() {
        if (anchors.get(element) !== state) return;
        state.updatePending = false;
        if (state.updateDirty && !state.layoutPolling) {
          var repeat = state.repeatPending;
          state.repeatPending = false;
          scheduleAnchor(element, repeat);
        }
      });
    }
    function now() {
      return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
    }
    function updateAnchor(_x2) {
      return _updateAnchor.apply(this, arguments);
    }
    function _updateAnchor() {
      _updateAnchor = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee3(element) {
        var ensureLatest, state, revision, current, retry, target, candidates, placement, applied, _args3 = arguments;
        return _regenerator().w(function(_context3) {
          while (1) switch (_context3.n) {
            case 0:
              ensureLatest = _args3.length > 1 && _args3[1] !== void 0 ? _args3[1] : false;
              state = anchors.get(element);
              if (state) {
                _context3.n = 1;
                break;
              }
              return _context3.a(2);
            case 1:
              revision = ++state.revision;
              current = function current2() {
                return anchors.get(element) === state && state.revision === revision;
              };
              retry = function retry2() {
                return ensureLatest && anchors.get(element) === state ? updateAnchor(element, true) : void 0;
              };
              target = effectiveTarget(element, state);
              state.resolvedTarget = target;
              candidates = parseCandidates(element.getAttribute(attribute));
              if (!(!target || !target.isConnected || !candidates.length || circularTarget(element, target))) {
                _context3.n = 4;
                break;
              }
              if (target && circularTarget(element, target)) associationDiagnostic(element, "Circular target reference.");
              _context3.n = 2;
              return AelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (current()) deactivate(element, state);
              });
            case 2:
              if (current()) {
                _context3.n = 3;
                break;
              }
              return _context3.a(2, retry());
            case 3:
              return _context3.a(2);
            case 4:
              _context3.n = 5;
              return AelluxJs.waitLayout.read(state.styleLayoutId, function() {
                return current() ? readPlacement(element, target, candidates, state.active) : null;
              });
            case 5:
              placement = _context3.v;
              if (current()) {
                _context3.n = 6;
                break;
              }
              return _context3.a(2, retry());
            case 6:
              if (placement) {
                _context3.n = 7;
                break;
              }
              return _context3.a(2);
            case 7:
              if (!placement.hidden) {
                _context3.n = 10;
                break;
              }
              _context3.n = 8;
              return AelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (current()) hideForTarget(element, state, placement);
              });
            case 8:
              if (current()) {
                _context3.n = 9;
                break;
              }
              return _context3.a(2, retry());
            case 9:
              return _context3.a(2);
            case 10:
              if (placement.valid) {
                _context3.n = 13;
                break;
              }
              _context3.n = 11;
              return AelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (current()) invalidContext(element, state, placement);
              });
            case 11:
              if (current()) {
                _context3.n = 12;
                break;
              }
              return _context3.a(2, retry());
            case 12:
              return _context3.a(2);
            case 13:
              if (state.active) {
                _context3.n = 24;
                break;
              }
              _context3.n = 14;
              return AelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (!current()) return;
                state.active = true;
              });
            case 14:
              if (current()) {
                _context3.n = 15;
                break;
              }
              return _context3.a(2, retry());
            case 15:
              _context3.n = 16;
              return AelluxJs.waitLayout.read(state.styleLayoutId, function() {
                return current() ? readPlacement(element, target, candidates, true) : null;
              });
            case 16:
              placement = _context3.v;
              if (current()) {
                _context3.n = 17;
                break;
              }
              return _context3.a(2, retry());
            case 17:
              if (placement) {
                _context3.n = 18;
                break;
              }
              return _context3.a(2);
            case 18:
              if (!placement.hidden) {
                _context3.n = 21;
                break;
              }
              _context3.n = 19;
              return AelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (current()) hideForTarget(element, state, placement);
              });
            case 19:
              if (current()) {
                _context3.n = 20;
                break;
              }
              return _context3.a(2, retry());
            case 20:
              return _context3.a(2);
            case 21:
              if (placement.valid) {
                _context3.n = 24;
                break;
              }
              _context3.n = 22;
              return AelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (current()) invalidContext(element, state, placement);
              });
            case 22:
              if (current()) {
                _context3.n = 23;
                break;
              }
              return _context3.a(2, retry());
            case 23:
              return _context3.a(2);
            case 24:
              applied = false;
              _context3.n = 25;
              return AelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (!current()) return;
                state.invalidContext = false;
                observe(state, element, placement.target, placement.reference);
                var previous = state.lastPlacement;
                var switching = previous && previous.target !== placement.target;
                var moved = !previous || previous.signature !== placement.signature;
                if (switching && placement.duration > 0 && !state.interruptSwitch) {
                  startSwitch(element, state, placement.duration);
                } else if (moved || state.interruptSwitch || !placement.duration) stopSwitch(element, state);
                state.interruptSwitch = false;
                var selected = placement.selected;
                var style = element.style;
                setValue(style, "--ae-anchor-x", "".concat(selected.x, "px"));
                setValue(style, "--ae-anchor-y", "".concat(selected.y, "px"));
                setValue(style, ORIGIN_X, "".concat(selected.self[0] * 100, "%"));
                setValue(style, ORIGIN_Y, "".concat(selected.self[1] * 100, "%"));
                setValue(style, ANCHOR_OPACITY, placement.opacity);
                setValue(style, "--ae-anchor-target-width", "".concat(placement.width, "px"));
                setValue(style, "--ae-anchor-target-height", "".concat(placement.height, "px"));
                setValue(style, "--ae-anchor-pivot-x", "".concat(selected.pivotX, "px"));
                setValue(style, "--ae-anchor-pivot-y", "".concat(selected.pivotY, "px"));
                element.classList.add(anchoredClass);
                state.lastUpdateAt = now();
                state.lastPlacement = placement;
                applied = true;
              });
            case 25:
              if (!(!applied && anchors.get(element) === state)) {
                _context3.n = 26;
                break;
              }
              return _context3.a(2, updateAnchor(element, ensureLatest));
            case 26:
              return _context3.a(2);
          }
        }, _callee3);
      }));
      return _updateAnchor.apply(this, arguments);
    }
    function readPlacement(element, target, candidates, measure) {
      var _target;
      var reference = element.offsetParent;
      target = target || reference;
      var presenting = anchors.get(element).group && (_target = target) !== null && _target !== void 0 && _target.hasAttribute(presentAttribute) ? target : null;
      if (target && isInvisible(target, presenting)) return {
        hidden: true,
        target: target,
        reference: reference
      };
      if (!reference || target !== reference && target.offsetParent !== reference) {
        return {
          valid: false,
          target: target,
          reference: reference
        };
      }
      var style = root.getComputedStyle(element);
      var tokens = (element.getAttribute(matchAttribute) || "").trim().split(/\s+/).filter(Boolean);
      if (element.hasAttribute(matchAttribute) && (!tokens.length || tokens.some(function(token) {
        return token !== "width" && token !== "height";
      }))) AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_ANCHOR_MATCH, {
        extension: extensionName,
        element: element,
        value: element.getAttribute(matchAttribute)
      });
      if ((tokens.includes("width") || tokens.includes("height")) && style.position !== "absolute" && style.position !== "fixed") {
        associationDiagnostic(element, "Dimension matching requires an out-of-flow Anchor.");
        return {
          hidden: true,
          target: target,
          reference: reference
        };
      }
      if (!measure) return {
        valid: true,
        target: target
      };
      var referenceRect = reference.getBoundingClientRect();
      var scaleX = reference.offsetWidth ? referenceRect.width / reference.offsetWidth : 1;
      var scaleY = reference.offsetHeight ? referenceRect.height / reference.offsetHeight : 1;
      var targetRect = toReference(target.getBoundingClientRect(), reference, referenceRect, scaleX, scaleY);
      var selfRect = element.getBoundingClientRect();
      var projectSize = function projectSize2(axis, actual, desired) {
        if (!tokens.includes(axis) || element.style[axis]) return actual;
        var previous = parseFloat(element.style.getPropertyValue("--ae-anchor-target-".concat(axis))) || 0;
        var sides = axis === "width" ? ["Left", "Right"] : ["Top", "Bottom"];
        var extra = sides.reduce(function(sum, side) {
          return sum + (parseFloat(style["padding".concat(side)]) || 0) + (parseFloat(style["border".concat(side, "Width")]) || 0);
        }, 0);
        var borderBox = style.boxSizing === "border-box";
        var minimum = Math.max(borderBox ? extra : 0, parseFloat(style.getPropertyValue("min-".concat(axis))) || 0);
        var maximum = parseFloat(style.getPropertyValue("max-".concat(axis)));
        var constrain = function constrain2(value) {
          return Math.max(minimum, Math.min(Number.isFinite(maximum) ? maximum : Infinity, value));
        };
        return anchors.get(element).switchTimer === null && Math.abs(parseFloat(style[axis]) - constrain(previous)) > 0.5 ? actual : constrain(desired) + (borderBox ? 0 : extra);
      };
      var selfWidth = projectSize("width", selfRect.width / scaleX, targetRect.width);
      var selfHeight = projectSize("height", selfRect.height / scaleY, targetRect.height);
      var boundaryRect = toReference({
        left: 0,
        top: 0,
        width: root.innerWidth,
        height: root.innerHeight
      }, reference, referenceRect, scaleX, scaleY);
      var selected = null;
      var _iterator1 = _createForOfIteratorHelper(candidates), _step1;
      try {
        for (_iterator1.s(); !(_step1 = _iterator1.n()).done; ) {
          var candidate = _step1.value;
          var x = targetRect.left + targetRect.width * candidate.target[0] - selfWidth * candidate.self[0];
          var y = targetRect.top + targetRect.height * candidate.target[1] - selfHeight * candidate.self[1];
          var result = {
            x: x,
            y: y,
            self: candidate.self,
            pivotX: targetRect.left + targetRect.width * candidate.target[0],
            pivotY: targetRect.top + targetRect.height * candidate.target[1]
          };
          if (!selected) selected = result;
          if (x >= boundaryRect.left && y >= boundaryRect.top && x + selfWidth <= boundaryRect.left + boundaryRect.width && y + selfHeight <= boundaryRect.top + boundaryRect.height) {
            selected = result;
            break;
          }
        }
      } catch (err) {
        _iterator1.e(err);
      } finally {
        _iterator1.f();
      }
      var present = target.closest("[".concat(presentAttribute, "]"));
      var opacity = present ? root.getComputedStyle(present).opacity : "1";
      var rawDuration = style.getPropertyValue("--ae-anchor-switch-duration").trim();
      var duration = AelluxJs.currentPreference("reduced-motion") === "reduced" ? 0 : Math.max(0, (parseFloat(rawDuration) || 0) * (rawDuration.endsWith("ms") ? 1 : 1e3));
      return {
        valid: true,
        target: target,
        reference: reference,
        selected: selected,
        opacity: opacity,
        duration: duration,
        width: targetRect.width,
        height: targetRect.height,
        signature: [selected.x, selected.y, targetRect.width, targetRect.height].concat(_toConsumableArray(selected.self)).join("/")
      };
    }
    function isInvisible(element, presenting) {
      var visibility = root.getComputedStyle(element).visibility;
      if (visibility === "hidden" || visibility === "collapse") return true;
      for (var current = element; current && current.nodeType === 1; current = current.parentElement) {
        var style = root.getComputedStyle(current);
        var inline = current.style;
        if (current.hidden || inline.display === "none" || inline.visibility === "hidden" || inline.visibility === "collapse" || current !== presenting && inline.opacity === "0" || style.display === "none" || style.contentVisibility === "hidden" || current !== presenting && Number(style.opacity) === 0) return true;
      }
      return false;
    }
    function hideForTarget(element, state, placement) {
      deactivate(element, state);
      state.invalidContext = false;
      if (placement.reference) listenForLayout(state, placement.reference);
    }
    function invalidContext(element, state, placement) {
      deactivate(element, state);
      if (placement.reference) listenForLayout(state, placement.reference);
      if (state.invalidContext) return;
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT, {
        extension: extensionName,
        element: element,
        target: placement.target
      });
      state.invalidContext = true;
    }
    function observe(state, element, target, reference) {
      if (state.target === target && state.reference === reference) return;
      listenForLayout(state, reference);
      state.target = target;
      if (state.observer) state.observer.disconnect();
      if (state.intersectionObserver) state.intersectionObserver.disconnect();
      var _iterator10 = _createForOfIteratorHelper(/* @__PURE__ */ new Set([element, target, reference])), _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
          var observed = _step10.value;
          if (!observed) continue;
          if (state.observer) state.observer.observe(observed);
          if (state.intersectionObserver) state.intersectionObserver.observe(observed);
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
    }
    function listenForLayout(state, reference) {
      if (state.reference === reference) return;
      if (state.reference) AelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
      state.reference = reference;
      if (reference) AelluxJs.onEvent(reference, layoutEvent, state.layoutListener);
    }
    function deactivate(element, state) {
      var memory = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : elementMemories.get(element);
      stopSwitch(element, state);
      if (state.reference) AelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
      if (state.observer) state.observer.disconnect();
      if (state.intersectionObserver) state.intersectionObserver.disconnect();
      state.target = state.reference = null;
      element.classList.remove(anchoredClass);
      if (state.active && memory) memory.restore();
      state.active = false;
      state.lastPlacement = null;
    }
    function stopSwitch(element, state) {
      if (state.switchTimer !== null) root.clearTimeout(state.switchTimer);
      state.switchTimer = null;
      element.classList.remove(switchingClass);
    }
    function setValue(style, name, value) {
      if (style.getPropertyValue(name) === value && !style.getPropertyPriority(name)) return;
      if (style.getPropertyPriority(name)) style.removeProperty(name);
      style.setProperty(name, value);
    }
    function startSwitch(element, state, duration) {
      if (state.switchTimer !== null) root.clearTimeout(state.switchTimer);
      element.classList.add(switchingClass);
      state.switchTimer = root.setTimeout(function() {
        if (anchors.get(element) !== state) return;
        stopSwitch(element, state);
        scheduleAnchor(element);
      }, duration + 100);
    }
    function resolveElement(value) {
      if (!value || !value.trim()) return null;
      var selector = value.trim();
      var id = selector[0] === "#" ? selector.slice(1) : selector;
      var byId = document.getElementById(id);
      if (byId) return byId;
      try {
        return document.querySelector(selector);
      } catch (_) {
        return null;
      }
    }
    function parseCandidates(value) {
      var result = [];
      var _iterator11 = _createForOfIteratorHelper((value || "").split(",")), _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
          var token = _step11.value;
          var pair = token.trim().toLowerCase().split(":");
          if (pair.length !== 2 || !pivots[pair[0].trim()] || !pivots[pair[1].trim()]) continue;
          result.push({
            target: pivots[pair[0].trim()],
            self: pivots[pair[1].trim()]
          });
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      return result;
    }
    function toReference(rect, reference, referenceRect, scaleX, scaleY) {
      return {
        left: (rect.left - referenceRect.left) / scaleX - reference.clientLeft + reference.scrollLeft,
        top: (rect.top - referenceRect.top) / scaleY - reference.clientTop + reference.scrollTop,
        width: rect.width / scaleX,
        height: rect.height / scaleY
      };
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.anchor.legacy.js.map
