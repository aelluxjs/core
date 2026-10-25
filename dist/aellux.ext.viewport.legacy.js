(function() {
  // src/src/aellux.ext.viewport.js
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
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
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
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the viewport extension.");
    var extensionName = "viewport";
    var attribute = AelluxJs.attr(extensionName);
    var properties = ["--ae-viewport-x", "--ae-viewport-y", "--ae-viewport-visible"];
    var document = root.document;
    var states = /* @__PURE__ */ new Map();
    var groups = /* @__PURE__ */ new Map();
    var resizeTargets = /* @__PURE__ */ new Map();
    var nextLayoutId = 6e6;
    var mutations = null, resizeObserver = null;
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy
    });
    function init() {
      AelluxJs.registerCssProperty.apply(AelluxJs, _toConsumableArray(properties.map(function(name) {
        return {
          name: name,
          syntax: "<number>",
          initialValue: "0",
          inherits: false
        };
      })));
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attribute, "]"),
        mount: mount,
        update: update,
        unmount: unmount
      });
    }
    function destroy() {
      var _iterator = _createForOfIteratorHelper(states.keys()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var element = _step.value;
          unmount(element);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
    }
    function mount(element) {
      if (states.has(element)) return;
      var state = {
        element: element,
        group: null,
        configuration: null,
        axes: "both",
        memories: properties.map(function(property) {
          return AelluxJs.persist.element.save(element, [], [property]);
        }),
        writtenStyle: null,
        values: [],
        resizeTargets: /* @__PURE__ */ new Set()
      };
      states.set(element, state);
      if (states.size === 1) startObserving();
      join(state, document);
      return update(element);
    }
    function update(_x) {
      return _update.apply(this, arguments);
    }
    function _update() {
      _update = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee(element) {
        var state, group;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              state = states.get(element);
              if (state) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              group = state.group;
              _context.n = 2;
              return schedule(group);
            case 2:
              if (states.get(element) === state && state.group !== group) {
                _context.n = 1;
                break;
              }
            case 3:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _update.apply(this, arguments);
    }
    function unmount(element) {
      var state = states.get(element);
      if (!state) return;
      states.delete(element);
      leave(state);
      observeSizes(state, /* @__PURE__ */ new Set());
      var _iterator2 = _createForOfIteratorHelper(state.memories), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var memory = _step2.value;
          memory.restore();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      if (!states.size) stopObserving();
    }
    function startObserving() {
      AelluxJs.onEvent(root, "$resize", scheduleAll);
      AelluxJs.onEvent(document, "$load", scheduleAll, true);
      AelluxJs.onEvent(document, AelluxJs.eventName("Layout"), onLayout);
      if (root.ResizeObserver) resizeObserver = new root.ResizeObserver(scheduleAll);
      if (root.MutationObserver) {
        mutations = new root.MutationObserver(function(records) {
          if (records.some(function(record) {
            var state = states.get(record.target);
            return record.type !== "attributes" || record.attributeName !== "style" || !state || record.target.getAttribute("style") !== state.writtenStyle;
          })) scheduleAll();
        });
        mutations.observe(document, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: [attribute, "class", "style", "hidden", "open", "width", "height", "src"]
        });
      }
    }
    function stopObserving() {
      var _mutations, _resizeObserver;
      AelluxJs.offEvent(root, "$resize", scheduleAll);
      AelluxJs.offEvent(document, "$load", scheduleAll, true);
      AelluxJs.offEvent(document, AelluxJs.eventName("Layout"), onLayout);
      (_mutations = mutations) === null || _mutations === void 0 || _mutations.disconnect();
      (_resizeObserver = resizeObserver) === null || _resizeObserver === void 0 || _resizeObserver.disconnect();
      mutations = resizeObserver = null;
      resizeTargets.clear();
    }
    function onLayout(event) {
      var _event$detail;
      var duration = Number((_event$detail = event.detail) === null || _event$detail === void 0 ? void 0 : _event$detail.durationMs);
      var _iterator3 = _createForOfIteratorHelper(groups.values()), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var group = _step3.value;
          if (Number.isFinite(duration) && duration > 0) group.layoutUntil = Math.max(group.layoutUntil, root.performance.now() + duration);
          schedule(group);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
    function scheduleAll() {
      var _iterator4 = _createForOfIteratorHelper(groups.values()), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var group = _step4.value;
          schedule(group);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
    function join(state, reference) {
      var _state$group, _group$intersection;
      if (((_state$group = state.group) === null || _state$group === void 0 ? void 0 : _state$group.reference) === reference) return;
      leave(state);
      var group = groups.get(reference);
      if (!group) {
        group = {
          reference: reference,
          states: /* @__PURE__ */ new Set(),
          id: nextLayoutId++,
          active: true,
          pending: null,
          dirty: false,
          timer: null,
          layoutUntil: 0,
          intersection: null
        };
        group.onScroll = function() {
          return schedule(group);
        };
        AelluxJs.onEvent(reference === document ? root : reference, "$scroll", group.onScroll, {
          passive: true
        });
        if (root.IntersectionObserver) {
          group.intersection = new root.IntersectionObserver(group.onScroll, {
            root: reference === document ? null : reference,
            threshold: [0, 1e-6, 1]
          });
        }
        groups.set(reference, group);
      }
      state.group = group;
      group.states.add(state);
      (_group$intersection = group.intersection) === null || _group$intersection === void 0 || _group$intersection.observe(state.element);
    }
    function leave(state) {
      var _group$intersection2, _group$intersection3;
      var group = state.group;
      if (!group) return;
      group.states.delete(state);
      (_group$intersection2 = group.intersection) === null || _group$intersection2 === void 0 || _group$intersection2.unobserve(state.element);
      state.group = null;
      if (group.states.size) return;
      group.active = false;
      AelluxJs.waitLayout.cancel(group.id);
      if (group.timer !== null) root.clearTimeout(group.timer);
      (_group$intersection3 = group.intersection) === null || _group$intersection3 === void 0 || _group$intersection3.disconnect();
      AelluxJs.offEvent(group.reference === document ? root : group.reference, "$scroll", group.onScroll);
      groups.delete(group.reference);
    }
    function schedule(group) {
      if (!(group !== null && group !== void 0 && group.active)) return;
      if (group.pending) {
        group.dirty = true;
        return group.pending;
      }
      group.pending = refresh(group).finally(function() {
        group.pending = null;
        if (!group.active) return;
        if (group.dirty) {
          group.dirty = false;
          schedule(group);
        } else if (root.performance.now() < group.layoutUntil && group.timer === null) {
          group.timer = root.setTimeout(function() {
            group.timer = null;
            schedule(group);
          }, 16);
        }
      });
      return group.pending;
    }
    function refresh(_x2) {
      return _refresh.apply(this, arguments);
    }
    function _refresh() {
      _refresh = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2(group) {
        var measurements;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.n) {
            case 0:
              _context2.n = 1;
              return AelluxJs.waitLayout.read(group.id, function() {
                return measure(group);
              });
            case 1:
              measurements = _context2.v;
              if (!(!group.active || !measurements)) {
                _context2.n = 2;
                break;
              }
              return _context2.a(2);
            case 2:
              _context2.n = 3;
              return AelluxJs.waitLayout.update(group.id, function() {
                var _iterator8 = _createForOfIteratorHelper(measurements), _step8;
                try {
                  for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
                    var _step8$value = _step8.value, state = _step8$value.state, values = _step8$value.values;
                    if (states.get(state.element) !== state || state.group !== group) continue;
                    if (values === null) {
                      AelluxJs.mountManager.unmount(state.element, extensionName);
                      continue;
                    }
                    for (var index = 0; index < properties.length; index++) {
                      if (values[index] === state.values[index]) continue;
                      if (values[index] === null) state.memories[index].restore();
                      else state.element.style.setProperty(properties[index], String(values[index]), state.memories[index].cssProperties[properties[index]].priority);
                    }
                    state.values = values;
                    state.writtenStyle = state.element.getAttribute("style");
                  }
                } catch (err) {
                  _iterator8.e(err);
                } finally {
                  _iterator8.f();
                }
              });
            case 3:
              return _context2.a(2);
          }
        }, _callee2);
      }));
      return _refresh.apply(this, arguments);
    }
    function measure(group) {
      var measurements = [];
      var viewport;
      for (var _i = 0, _Array$from = Array.from(group.states); _i < _Array$from.length; _i++) {
        var state = _Array$from[_i];
        var element = state.element;
        if (!element.isConnected) continue;
        if (!element.hasAttribute(attribute)) {
          measurements.push({
            state: state,
            values: null
          });
          continue;
        }
        var targets = /* @__PURE__ */ new Set([element]);
        var reference = document;
        for (var parent = element.parentElement; parent; parent = parent.parentElement) {
          targets.add(parent);
          var _iterator5 = _createForOfIteratorHelper(parent.children), _step5;
          try {
            for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
              var sibling = _step5.value;
              targets.add(sibling);
            }
          } catch (err) {
            _iterator5.e(err);
          } finally {
            _iterator5.f();
          }
          var rootStyle = parent === document.body ? root.getComputedStyle(document.documentElement) : null;
          var propagatedBody = rootStyle && rootStyle.overflowX === "visible" && rootStyle.overflowY === "visible";
          if (reference === document && parent !== (document.scrollingElement || document.documentElement) && !propagatedBody && scrollable(parent)) reference = parent;
        }
        observeSizes(state, targets);
        configure(state);
        if (reference !== group.reference) {
          join(state, reference);
          schedule(state.group);
          continue;
        }
        if (!viewport) viewport = viewportRect(reference);
        measurements.push({
          state: state,
          values: valuesFor(state, viewport)
        });
      }
      return measurements;
    }
    function configure(state) {
      var value = state.element.getAttribute(attribute);
      if (value === state.configuration) return;
      state.configuration = value;
      state.axes = value === "x" || value === "y" ? value : "both";
      if (value !== "" && value !== "both" && value !== "x" && value !== "y") {
        AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
          extension: extensionName,
          element: state.element,
          attribute: attribute,
          value: value,
          reason: "Unknown viewport axis; using both.",
          suggestion: 'Use an empty value, "both", "x", or "y".'
        });
      }
    }
    function scrollable(element) {
      var style = root.getComputedStyle(element);
      return ["X", "Y"].some(function(axis) {
        var overflow = style["overflow" + axis];
        return overflow === "auto" || overflow === "scroll" || overflow === "hidden" && element[axis === "X" ? "scrollWidth" : "scrollHeight"] > element[axis === "X" ? "clientWidth" : "clientHeight"];
      });
    }
    function observeSizes(state, targets) {
      if (!resizeObserver) return;
      var _iterator6 = _createForOfIteratorHelper(state.resizeTargets), _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
          var target = _step6.value;
          if (targets.has(target)) continue;
          var count = resizeTargets.get(target) - 1;
          if (count) resizeTargets.set(target, count);
          else {
            resizeTargets.delete(target);
            resizeObserver.unobserve(target);
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      var _iterator7 = _createForOfIteratorHelper(targets), _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
          var _target = _step7.value;
          if (state.resizeTargets.has(_target)) continue;
          var _count = resizeTargets.get(_target) || 0;
          if (!_count) resizeObserver.observe(_target);
          resizeTargets.set(_target, _count + 1);
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      state.resizeTargets = targets;
    }
    function viewportRect(reference) {
      if (reference === document) {
        var scrolling = document.scrollingElement || document.documentElement;
        return {
          left: 0,
          top: 0,
          width: document.documentElement.clientWidth || scrolling.clientWidth || root.innerWidth,
          height: document.documentElement.clientHeight || scrolling.clientHeight || root.innerHeight
        };
      }
      var rect = reference.getBoundingClientRect();
      var style = root.getComputedStyle(reference);
      var borderSize = function borderSize2(axis) {
        return parseFloat(style[axis]) + (style.boxSizing === "border-box" ? 0 : axis === "width" ? parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth) : parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth));
      };
      var width = borderSize("width"), height = borderSize("height");
      var left = parseFloat(style.borderLeftWidth), right = parseFloat(style.borderRightWidth);
      var top = parseFloat(style.borderTopWidth), bottom = parseFloat(style.borderBottomWidth);
      var scaleX = rect.width / width, scaleY = rect.height / height;
      var scrollbarX = Math.max(0, reference.offsetWidth - reference.clientWidth - Math.round(left + right));
      var scrollbarY = Math.max(0, reference.offsetHeight - reference.clientHeight - Math.round(top + bottom));
      var leftScrollbar = Math.max(0, reference.clientLeft - Math.round(left));
      return {
        left: rect.left + (left + leftScrollbar) * scaleX,
        top: rect.top + top * scaleY,
        width: Math.max(0, width - left - right - scrollbarX) * scaleX,
        height: Math.max(0, height - top - bottom - scrollbarY) * scaleY
      };
    }
    function valuesFor(state, viewport) {
      var rect = state.element.getBoundingClientRect();
      var x = 0, y = 0, visible = 0;
      if ([viewport.left, viewport.top, viewport.width, viewport.height, rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) && viewport.width > 0 && viewport.height > 0 && rect.width > 0 && rect.height > 0) {
        x = clamp((rect.left + rect.width / 2 - viewport.left - viewport.width / 2) * 2 / viewport.width, -2, 2);
        y = clamp((rect.top + rect.height / 2 - viewport.top - viewport.height / 2) * 2 / viewport.height, -2, 2);
        var width = Math.max(0, Math.min(rect.right, viewport.left + viewport.width) - Math.max(rect.left, viewport.left));
        var height = Math.max(0, Math.min(rect.bottom, viewport.top + viewport.height) - Math.max(rect.top, viewport.top));
        visible = clamp(width / rect.width * (height / rect.height), 0, 1);
      }
      return [state.axes === "y" ? null : x, state.axes === "x" ? null : y, visible];
    }
    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.viewport.legacy.js.map
