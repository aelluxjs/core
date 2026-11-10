(function() {
  // src/internal/create-css-easing.js
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
  function createCssEasing(value, api) {
    var name = String(value || "ease-in-out").trim().toLowerCase();
    var keywords = {
      ease: ".25,.1,.25,1",
      "ease-in": ".42,0,1,1",
      "ease-out": "0,0,.58,1",
      "ease-in-out": ".42,0,.58,1"
    };
    if (name === "linear") return function(progress) {
      return progress;
    };
    var steps = /^(?:steps\(\s*(\d+)\s*(?:,\s*(jump-start|jump-end|jump-none|jump-both|start|end)\s*)?\)|step-(start|end))$/.exec(name);
    if (steps) {
      var count = steps[3] ? 1 : Number(steps[1]);
      var position = steps[3] || steps[2] || "end";
      var start = position === "start" || position === "jump-start" || position === "jump-both";
      var jumps = count + (position === "jump-both" ? 1 : position === "jump-none" ? -1 : 0);
      if (count > 0 && jumps > 0) return function(progress) {
        return Math.max(0, Math.min(1, (Math.floor(progress * count) + (start ? 1 : 0)) / jumps));
      };
    }
    var linear = /^linear\(([^()]*)\)$/.exec(name);
    if (linear) {
      var points = [];
      var _iterator = _createForOfIteratorHelper(linear[1].split(",")), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var stop = _step.value;
          var tokens = stop.trim().split(/\s+/);
          var values = tokens.filter(function(token) {
            return !token.endsWith("%");
          });
          var positions = tokens.filter(function(token) {
            return token.endsWith("%");
          });
          if (values.length !== 1 || positions.length > 2 || !tokens.every(function(token) {
            return /^[+-]?(?:\d*\.\d+|\d+\.?)(?:e[+-]?\d+)?%?$/.test(token);
          })) return fallback(api);
          var _iterator2 = _createForOfIteratorHelper(positions.length ? positions : [null]), _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
              var _position = _step2.value;
              points.push({
                x: _position === null ? null : parseFloat(_position) / 100,
                y: Number(values[0])
              });
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (points.length < 2) return fallback(api);
      if (points[0].x === null) points[0].x = 0;
      if (points[points.length - 1].x === null) points[points.length - 1].x = 1;
      var largest = -Infinity;
      for (var _i = 0, _points = points; _i < _points.length; _i++) {
        var point = _points[_i];
        if (point.x !== null) largest = point.x = Math.max(largest, point.x);
      }
      for (var index = 1; index < points.length; index++) {
        if (points[index].x !== null) continue;
        var begin = index - 1;
        while (points[index].x === null) index++;
        for (var cursor = begin + 1; cursor < index; cursor++) points[cursor].x = points[begin].x + (points[index].x - points[begin].x) * (cursor - begin) / (index - begin);
      }
      return function(progress) {
        var index2 = 0;
        while (index2 < points.length - 1 && points[index2 + 1].x <= progress) index2++;
        var first = points[Math.min(index2, points.length - 2)], second = points[Math.min(index2 + 1, points.length - 1)];
        return second.x === first.x ? progress < first.x ? first.y : second.y : first.y + (second.y - first.y) * (progress - first.x) / (second.x - first.x);
      };
    }
    var curve = keywords[name] ? "cubic-bezier(".concat(keywords[name], ")") : name;
    var cubic = /^cubic-bezier\(([^()]*)\)$/.exec(curve);
    if (cubic) {
      var _values = cubic[1].split(",").map(function(value2) {
        return value2.trim();
      });
      if (_values.length === 4 && _values.every(function(value2) {
        return /^[+-]?(?:\d*\.\d+|\d+\.?)(?:e[+-]?\d+)?$/.test(value2);
      })) curve = "cubic-bezier(".concat(_values.map(Number).join(","), ")");
    }
    if (/^cubic-bezier\(/.test(curve)) {
      try {
        api.ease(curve, 0.5);
        return function(progress) {
          return api.ease(curve, progress);
        };
      } catch (_) {
      }
    }
    return fallback(api);
  }
  function fallback(api) {
    return function(progress) {
      return api.ease("cubic-bezier(.25,.1,.25,1)", progress);
    };
  }

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
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray2(r) || _nonIterableSpread();
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray2(r);
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray2(r, e) || _nonIterableRest();
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
  function _createForOfIteratorHelper2(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray2(r)) || e && r && "number" == typeof r.length) {
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
  function _unsupportedIterableToArray2(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray2(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray2(r, a) : void 0;
    }
  }
  function _arrayLikeToArray2(r, a) {
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
    var aelluxJs = root.aelluxJs;
    var extensionName = "anchor";
    if (!aelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    var ORIGIN_X = "--ae-anchor-origin-x", ORIGIN_Y = "--ae-anchor-origin-y", ANCHOR_OPACITY = "--anchor-opacity";
    var attribute = aelluxJs.attr(extensionName);
    var presentAttribute = aelluxJs.attr("present");
    var targetAttribute = aelluxJs.attr("anchor-target");
    var matchAttribute = aelluxJs.attr("anchor-match");
    var scrollIntoViewAttribute = aelluxJs.attr("anchor-scroll-into-view");
    var groupAttribute = aelluxJs.attr("present-group");
    var layoutEvent = aelluxJs.eventName("Layout");
    var anchoredClass = aelluxJs.className("anchored");
    var switchingClass = aelluxJs.className("anchor-switching");
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
    var placementMaps = /* @__PURE__ */ new Set();
    var requestedMaps = /* @__PURE__ */ new Map();
    var nextLayoutId = 2e6;
    var mutations = null;
    aelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      createPlacementMap: createPlacementMap
    });
    function init() {
      aelluxJs.comm.handle("anchor.placement", placementRequest, {
        owner: extensionName
      });
      aelluxJs.registerCssProperty({
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
      aelluxJs.mountManager.add({
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
        var _iterator11, _step11, map;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              aelluxJs.comm.removeOwner(extensionName);
              _iterator11 = _createForOfIteratorHelper2(placementMaps);
              try {
                for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
                  map = _step11.value;
                  map.destroy();
                }
              } catch (err) {
                _iterator11.e(err);
              } finally {
                _iterator11.f();
              }
              requestedMaps.clear();
              _context.n = 1;
              return Promise.all(Array.from(anchors.keys(), unmountAnchor));
            case 1:
              aelluxJs.mountManager.remove({
                extensionName: extensionName
              });
            case 2:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _destroy.apply(this, arguments);
    }
    function placementRequest(_ref) {
      var action = _ref.action, owner = _ref.owner, element = _ref.element, pairs = _ref.pairs, target = _ref.target, placement = _ref.placement;
      if (action === "invisible") return isInvisible(element);
      var map = requestedMaps.get(owner);
      if (action === "dispose") {
        var _map;
        (_map = map) === null || _map === void 0 || _map.destroy();
        requestedMaps.delete(owner);
        return true;
      }
      if (action === "mount" && !map) {
        map = createPlacementMap();
        requestedMaps.set(owner, map);
      }
      if (!map) return null;
      if (action === "mount") return map.mount(element);
      if (action === "unmount") return map.unmount(element);
      if (action === "measure") return map.measure(element, pairs, target);
      if (action === "place") return map.place(element, placement);
      return null;
    }
    function createPlacementMap() {
      var memories = /* @__PURE__ */ new Map();
      var disposed = false;
      var map = {
        mount: function mount(element) {
          if (!disposed && !memories.has(element)) memories.set(element, aelluxJs.persist.element.save(element, ["class"], ownedProperties));
        },
        unmount: function unmount(element) {
          var _memories$get;
          (_memories$get = memories.get(element)) === null || _memories$get === void 0 || _memories$get.restore();
          memories.delete(element);
        },
        measure: function measure(element, pairs) {
          var target = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : element.parentElement;
          var candidates = parseCandidates(pairs);
          if (memories.has(element) && candidates.length) return readPlacement(element, target, candidates, true);
          return null;
        },
        place: function place(element, placement) {
          if (memories.has(element) && placement !== null && placement !== void 0 && placement.valid) writePlacement(element, placement);
        },
        invisible: isInvisible,
        destroy: function destroy2() {
          disposed = true;
          var _iterator = _createForOfIteratorHelper2(memories.keys()), _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done; ) {
              var element = _step.value;
              map.unmount(element);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
          placementMaps.delete(map);
        }
      };
      placementMaps.add(map);
      return map;
    }
    function mountAnchor(element) {
      if (anchors.has(element)) return;
      elementMemories.set(element, aelluxJs.persist.element.save(element, [], ownedProperties));
      var state = {
        invalidContext: false,
        active: false,
        revision: 0,
        target: null,
        resolvedTarget: null,
        reference: null,
        group: null,
        lastPlacement: null,
        switchOperation: null,
        motionId: aelluxJs.motion.id(),
        scrollVisible: false,
        scrollPending: false,
        ownClass: null,
        ownStyle: null,
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
        aelluxJs.onEvent(root, "$scroll", scheduleUpdate, {
          capture: true,
          passive: true
        });
        aelluxJs.onEvent(root, "$resize", scheduleUpdate);
        aelluxJs.on("PresentGroupChange", onGroupChange);
        if (typeof root.MutationObserver === "function") {
          mutations = new root.MutationObserver(onMutations);
          mutations.observe(document, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: [attribute, targetAttribute, matchAttribute, scrollIntoViewAttribute, groupAttribute, aelluxJs.attr("reduced-motion"), "id", "hidden", "class", "style"]
          });
        }
      }
      if (typeof root.ResizeObserver === "function") {
        state.observer = new root.ResizeObserver(function(entries) {
          if (state.switchOperation !== null && entries.every(function(entry) {
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
              if (state.reference) aelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
              if (state.observer) state.observer.disconnect();
              if (state.intersectionObserver) state.intersectionObserver.disconnect();
              if (state.updateTimer !== null) root.clearTimeout(state.updateTimer);
              anchors.delete(element);
              if (!anchors.size) {
                aelluxJs.offEvent(root, "$scroll", scheduleUpdate, true);
                aelluxJs.offEvent(root, "$resize", scheduleUpdate);
                aelluxJs.off("PresentGroupChange", onGroupChange);
                if (mutations) mutations.disconnect();
                mutations = null;
              }
              aelluxJs.waitLayout.cancel(state.layoutId);
              aelluxJs.waitLayout.cancel(state.styleLayoutId);
              _context2.n = 2;
              return aelluxJs.waitLayout.update(state.styleLayoutId, deactivate, [element, state, memory]);
            case 2:
              return _context2.a(2);
          }
        }, _callee2);
      }));
      return _unmountAnchor.apply(this, arguments);
    }
    function scheduleUpdate(event) {
      if (!anchors.size) return;
      var source = (event === null || event === void 0 ? void 0 : event.type) === "scroll" ? scrollSource(event) : null;
      var _iterator2 = _createForOfIteratorHelper2(anchors), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var _step2$value = _slicedToArray(_step2.value, 2), element = _step2$value[0], state = _step2$value[1];
          if (source && !relevantScroll(source, element, state)) continue;
          scheduleAnchor(element);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
    function scrollSource(event) {
      return event.target === document || event.target === root ? document.scrollingElement || document.documentElement : event.target;
    }
    function relevantScroll(source, element, state) {
      var _source$contains, _source$contains2;
      return ((_source$contains = source.contains) === null || _source$contains === void 0 ? void 0 : _source$contains.call(source, element)) || ((_source$contains2 = source.contains) === null || _source$contains2 === void 0 ? void 0 : _source$contains2.call(source, effectiveTarget(element, state)));
    }
    function onGroupChange(event) {
      var _iterator3 = _createForOfIteratorHelper2(anchors), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var _event$detail;
          var _step3$value = _slicedToArray(_step3.value, 2), element = _step3$value[0], state = _step3$value[1];
          if (state.group === ((_event$detail = event.detail) === null || _event$detail === void 0 ? void 0 : _event$detail.group)) scheduleAnchor(element);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
    function onMutations(records) {
      var affected = /* @__PURE__ */ new Set();
      var _iterator4 = _createForOfIteratorHelper2(records), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var record = _step4.value;
          var node = record.target;
          var structural = record.type === "childList";
          var visual = record.attributeName === "class" || record.attributeName === "style";
          var _iterator6 = _createForOfIteratorHelper2(anchors), _step6;
          try {
            for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
              var _state$reference;
              var _step6$value = _slicedToArray(_step6.value, 2), element = _step6$value[0], state = _step6$value[1];
              if (visual) {
                if (node === element && element.hasAttribute(scrollIntoViewAttribute) && (element.getAttribute("class") !== state.ownClass || element.getAttribute("style") !== state.ownStyle)) affected.add(element);
                if (node !== element && (node.contains(element) || state.resolvedTarget && node.contains(state.resolvedTarget) || state.group && node.contains(state.group) || targetChanged(element, state))) affected.add(element);
                continue;
              }
              if (node === element || node === document.documentElement || node.contains(element) || state.resolvedTarget && node.contains(state.resolvedTarget) || state.group && node.contains(state.group) || structural && (_state$reference = state.reference) !== null && _state$reference !== void 0 && _state$reference.contains(node) || targetChanged(element, state)) affected.add(element);
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      var _iterator5 = _createForOfIteratorHelper2(affected), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var _element = _step5.value;
          scheduleAnchor(_element);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
    function targetChanged(element, state) {
      var value = element.getAttribute(targetAttribute);
      return value && value.trim() && resolveElement(value) !== (state.group || state.resolvedTarget);
    }
    function associationDiagnostic(element, reason) {
      aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_ANCHOR_GROUP, {
        extension: extensionName,
        element: element,
        reason: reason,
        attribute: targetAttribute,
        value: element.getAttribute(targetAttribute),
        suggestion: "Reference an element or Present Group without circular targets, share a positioning reference, and keep dimension-matched Anchors out of normal flow."
      });
    }
    function effectiveTarget(element, state) {
      var value = element.getAttribute(targetAttribute);
      var target = value && value.trim() ? resolveElement(value) : element.offsetParent;
      state.group = value && value.trim() && target !== null && target !== void 0 && target.hasAttribute(groupAttribute) ? target : null;
      return state.group ? aelluxJs.comm.request("present.selection", {
        group: state.group
      }).value || null : target;
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
        var _iterator7 = _createForOfIteratorHelper2(anchors), _step7;
        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
            var _step7$value = _slicedToArray(_step7.value, 2), element = _step7$value[0], state = _step7$value[1];
            var maxFPS = aelluxJs.layoutMaxFPS(element);
            state.layoutUntil = now() + 1e3 / (maxFPS || 60);
            state.layoutSingle = true;
            state.layoutFinalPending = true;
            scheduleAnchor(element, true);
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
        return;
      }
      var _iterator8 = _createForOfIteratorHelper2(anchors), _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
          var _step8$value = _slicedToArray(_step8.value, 2), _element2 = _step8$value[0], _state = _step8$value[1];
          _state.layoutUntil = Math.max(_state.layoutUntil, now() + durationMs);
          _state.layoutSingle = false;
          _state.layoutFinalPending = true;
          scheduleAnchor(_element2, durationMs > 0);
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
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
      var maxFPS = aelluxJs.layoutMaxFPS(element);
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
      var sequence = aelluxJs.waitLayout.sequence(state.layoutId, {
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
        aelluxJs.diagnostics.error(aelluxJs.diagnostics.ERROR_EXTENSION_MOUNT, {
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
        var ensureLatest, state, revision, current, retry, target, candidates, placement, applied, visible, _args3 = arguments;
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
              return aelluxJs.waitLayout.update(state.styleLayoutId, function() {
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
              return aelluxJs.waitLayout.read(state.styleLayoutId, function() {
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
              return aelluxJs.waitLayout.update(state.styleLayoutId, function() {
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
              return aelluxJs.waitLayout.update(state.styleLayoutId, function() {
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
              return aelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (!current()) return;
                state.active = true;
                if (state.lastPlacement) writePlacement(element, state.lastPlacement);
              });
            case 14:
              if (current()) {
                _context3.n = 15;
                break;
              }
              return _context3.a(2, retry());
            case 15:
              _context3.n = 16;
              return aelluxJs.waitLayout.read(state.styleLayoutId, function() {
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
              return aelluxJs.waitLayout.update(state.styleLayoutId, function() {
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
              return aelluxJs.waitLayout.update(state.styleLayoutId, function() {
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
              return aelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (!current()) return;
                if (effectiveTarget(element, state) !== placement.target) return;
                state.invalidContext = false;
                observe(state, element, placement.target, placement.reference);
                var previous = state.lastPlacement;
                var switching = previous && previous.target !== placement.target;
                if (!previous || switching) state.scrollPending = true;
                var moved = !previous || previous.signature !== placement.signature;
                if (switching && placement.duration > 0) {
                  startSwitch(element, state, placement);
                } else if (state.switchOperation && !switching && aelluxJs.currentPreference("reduced-motion") !== "reduced") {
                  state.switchOperation.toGeometry = placement;
                } else if (state.switchOperation) {
                  writePlacement(element, placement);
                  stopSwitch(element, state);
                } else {
                  stopSwitch(element, state);
                  if (moved) placeDirectly(element, placement);
                  else writePlacement(element, placement);
                }
                if (switching) {
                  state.scrollPending = false;
                  state.scrollVisible = true;
                  scrollTargetIntoView(element, placement.target);
                }
                rememberVisual(element, state);
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
              if (!(!applied || !element.hasAttribute(scrollIntoViewAttribute))) {
                _context3.n = 27;
                break;
              }
              return _context3.a(2);
            case 27:
              _context3.n = 28;
              return aelluxJs.waitLayout.read(state.styleLayoutId, function() {
                return current() && !isInvisible(element);
              });
            case 28:
              visible = _context3.v;
              if (current()) {
                _context3.n = 29;
                break;
              }
              return _context3.a(2, retry());
            case 29:
              if (visible && !state.scrollVisible) state.scrollPending = true;
              state.scrollVisible = visible;
              if (!(!visible || !state.scrollPending)) {
                _context3.n = 30;
                break;
              }
              return _context3.a(2);
            case 30:
              _context3.n = 31;
              return aelluxJs.waitLayout.update(state.styleLayoutId, function() {
                if (!current() || effectiveTarget(element, state) !== placement.target) return;
                state.scrollPending = false;
                scrollTargetIntoView(element, placement.target);
              });
            case 31:
              return _context3.a(2);
          }
        }, _callee3);
      }));
      return _updateAnchor.apply(this, arguments);
    }
    function scrollTargetIntoView(element, target) {
      var tokens = (element.getAttribute(scrollIntoViewAttribute) || "").trim().split(/\s+/);
      if (tokens.length !== 2 || tokens.some(function(token) {
        return !["start", "center", "end", "nearest"].includes(token);
      })) return;
      target.scrollIntoView({
        block: tokens[0],
        inline: tokens[1],
        behavior: aelluxJs.currentPreference("reduced-motion") === "reduced" ? "instant" : "smooth"
      });
    }
    function rememberVisual(element, state) {
      state.ownClass = element.getAttribute("class");
      state.ownStyle = element.getAttribute("style");
    }
    function readPlacement(element, target, candidates, measure) {
      var reference = element.offsetParent;
      target = target || reference;
      if (target && isInvisible(target)) return {
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
      }))) aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_ANCHOR_MATCH, {
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
      var visual = toReference(selfRect, reference, referenceRect, scaleX, scaleY);
      var fromSelf = [ORIGIN_X, ORIGIN_Y].map(function(name) {
        return (parseFloat(style.getPropertyValue(name)) || 0) / 100;
      });
      var matrix = /^matrix(3d)?\(([^)]*)\)$/.exec(style.transform);
      var components = matrix ? matrix[2].split(",").map(Number) : null;
      var visualX = components ? components[matrix[1] ? 12 : 4] : visual.left - element.offsetLeft;
      var visualY = components ? components[matrix[1] ? 13 : 5] : visual.top - element.offsetTop;
      var fromGeometry = {
        width: parseFloat(style.getPropertyValue("--ae-anchor-target-width")) || 0,
        height: parseFloat(style.getPropertyValue("--ae-anchor-target-height")) || 0,
        selected: {
          x: visualX,
          y: visualY,
          self: fromSelf,
          pivotX: visualX + visual.width * fromSelf[0],
          pivotY: visualY + visual.height * fromSelf[1]
        }
      };
      var projectSize = function projectSize2(axis, actual, desired) {
        var _anchors$get;
        var inline = element.style[axis].replace(/\s+/g, "");
        if (!tokens.includes(axis) || inline && inline !== "var(--ae-anchor-target-".concat(axis, ")")) return actual;
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
        return !((_anchors$get = anchors.get(element)) !== null && _anchors$get !== void 0 && _anchors$get.switchOperation) && Math.abs(parseFloat(style[axis]) - constrain(previous)) > 0.5 ? actual : constrain(desired) + (borderBox ? 0 : extra);
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
      var _iterator9 = _createForOfIteratorHelper2(candidates), _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
          var candidate = _step9.value;
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
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      var present = target.closest("[".concat(presentAttribute, "]"));
      var opacity = present ? root.getComputedStyle(present).opacity : "1";
      var rawDuration = style.getPropertyValue("--ae-anchor-switch-duration").trim();
      var duration = aelluxJs.currentPreference("reduced-motion") === "reduced" ? 0 : Math.max(0, (parseFloat(rawDuration) || 0) * (rawDuration.endsWith("ms") ? 1 : 1e3));
      var position = tokens.includes("width") || tokens.includes("height") ? [selected.pivotX, selected.pivotY] : [selected.x, selected.y];
      return {
        valid: true,
        target: target,
        reference: reference,
        selected: selected,
        opacity: opacity,
        duration: duration,
        scaleX: scaleX,
        scaleY: scaleY,
        fromGeometry: fromGeometry,
        easing: style.getPropertyValue("--ae-anchor-switch-ease").trim() || "ease-in-out",
        width: targetRect.width,
        height: targetRect.height,
        signature: [].concat(position, [targetRect.width, targetRect.height], _toConsumableArray(selected.self)).join("/")
      };
    }
    function writePlacement(element, placement) {
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
    }
    function isInvisible(element) {
      var visibility = root.getComputedStyle(element).visibility;
      if (visibility === "hidden" || visibility === "collapse") return true;
      for (var current = element; current && current.nodeType === 1; current = current.parentElement) {
        var style = root.getComputedStyle(current);
        if (style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) return true;
      }
      return false;
    }
    function hideForTarget(element, state, placement) {
      var _state$lastPlacement;
      var previous = state.group && ((_state$lastPlacement = state.lastPlacement) === null || _state$lastPlacement === void 0 ? void 0 : _state$lastPlacement.target) !== placement.target ? state.lastPlacement : null;
      deactivate(element, state);
      state.lastPlacement = previous;
      state.invalidContext = false;
      if (placement.reference) listenForLayout(state, placement.reference);
    }
    function invalidContext(element, state, placement) {
      deactivate(element, state);
      if (placement.reference) listenForLayout(state, placement.reference);
      if (state.invalidContext) return;
      aelluxJs.diagnostics.error(aelluxJs.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT, {
        extension: extensionName,
        element: element,
        target: placement.target,
        attribute: targetAttribute,
        value: element.getAttribute(targetAttribute),
        reason: "Anchor and target use incompatible positioning references.",
        suggestion: "Place both elements in the same containing block, or use that block as the target."
      });
      state.invalidContext = true;
    }
    function observe(state, element, target, reference) {
      if (state.target === target && state.reference === reference) return;
      listenForLayout(state, reference);
      state.target = target;
      if (state.observer) state.observer.disconnect();
      if (state.intersectionObserver) state.intersectionObserver.disconnect();
      var _iterator0 = _createForOfIteratorHelper2(/* @__PURE__ */ new Set([element, target, reference])), _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done; ) {
          var observed = _step0.value;
          if (!observed) continue;
          if (state.observer) state.observer.observe(observed);
          if (state.intersectionObserver) state.intersectionObserver.observe(observed);
        }
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
    }
    function listenForLayout(state, reference) {
      if (state.reference === reference) return;
      if (state.reference) aelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
      state.reference = reference;
      if (reference) aelluxJs.onEvent(reference, layoutEvent, state.layoutListener);
    }
    function deactivate(element, state) {
      var memory = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : elementMemories.get(element);
      stopSwitch(element, state);
      if (state.reference) aelluxJs.offEvent(state.reference, layoutEvent, state.layoutListener);
      if (state.observer) state.observer.disconnect();
      if (state.intersectionObserver) state.intersectionObserver.disconnect();
      state.target = state.reference = null;
      element.classList.remove(anchoredClass);
      if (state.active && memory) memory.restore();
      state.active = false;
      state.lastPlacement = null;
      state.scrollVisible = false;
      state.scrollPending = false;
      rememberVisual(element, state);
    }
    function stopSwitch(element, state) {
      var keepStyles = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
      var operation = state.switchOperation;
      state.switchOperation = null;
      aelluxJs.waitLayout.cancel(state.motionId);
      aelluxJs.waitLayout.setVisualFPSLimit(state.motionId, null);
      element.classList.remove(switchingClass);
      if (!keepStyles && operation !== null && operation !== void 0 && operation.styles) {
        element.getBoundingClientRect();
        operation.styles.restore();
      }
      rememberVisual(element, state);
      return (operation === null || operation === void 0 ? void 0 : operation.styles) || null;
    }
    function suppressTransitions(element) {
      var style = root.getComputedStyle(element);
      if (!style.transitionDuration.split(",").some(function(value) {
        return parseFloat(value) > 0;
      })) return null;
      var properties = style.transitionProperty.split(",").map(function(property) {
        return property.trim();
      });
      var controlled = ["transform", "transform-origin"].concat(_toConsumableArray((element.getAttribute(matchAttribute) || "").split(/\s+/).filter(function(property) {
        return property === "width" || property === "height";
      })), _toConsumableArray(ownedProperties.filter(function(property) {
        return property.startsWith("--ae-anchor-");
      })));
      var horizontal = !style.writingMode || style.writingMode.startsWith("horizontal");
      if (controlled.includes("width")) controlled.push(horizontal ? "inline-size" : "block-size");
      if (controlled.includes("height")) controlled.push(horizontal ? "block-size" : "inline-size");
      var memory = aelluxJs.persist.element.save(element, [], ["transition-property", "transition-duration", "transition-delay", "transition-timing-function"]);
      var durations = style.transitionDuration.split(","), delays = style.transitionDelay.split(",");
      var timing = style.transitionTimingFunction.match(/(?:[^,(]|\([^)]*\))+/g) || ["ease"];
      var retained = [], times = [], waits = [], easings = [];
      properties.forEach(function(property, index) {
        var _iterator1 = _createForOfIteratorHelper2(property === "all" ? Array.from(style) : [property]), _step1;
        try {
          for (_iterator1.s(); !(_step1 = _iterator1.n()).done; ) {
            var name = _step1.value;
            if (name === "none" || controlled.includes(name.replace(/^-(?:webkit|moz|ms|o)-/, ""))) continue;
            retained.push(name);
            times.push(durations[index % durations.length]);
            waits.push(delays[index % delays.length]);
            easings.push(timing[index % timing.length]);
          }
        } catch (err) {
          _iterator1.e(err);
        } finally {
          _iterator1.f();
        }
      });
      element.style.setProperty("transition-property", retained.join(",") || "none", "important");
      element.style.setProperty("transition-duration", times.join(",") || "0s", "important");
      element.style.setProperty("transition-delay", waits.join(",") || "0s", "important");
      element.style.setProperty("transition-timing-function", easings.join(",") || "ease", "important");
      return memory;
    }
    function placeDirectly(element, placement) {
      var memory = suppressTransitions(element);
      try {
        writePlacement(element, placement);
        if (memory) element.getBoundingClientRect();
      } finally {
        memory === null || memory === void 0 || memory.restore();
      }
    }
    function setValue(style, name, value) {
      if (style.getPropertyValue(name) === value && !style.getPropertyPriority(name)) return;
      if (style.getPropertyPriority(name)) style.removeProperty(name);
      style.setProperty(name, value);
    }
    function startSwitch(element, state, placement) {
      var _state$switchOperatio;
      var from = ((_state$switchOperatio = state.switchOperation) === null || _state$switchOperatio === void 0 ? void 0 : _state$switchOperatio.rendered) || placement.fromGeometry;
      var retained = stopSwitch(element, state, true);
      var operation = {
        target: placement.target,
        startedAt: now(),
        duration: placement.duration,
        easing: createCssEasing(placement.easing, aelluxJs),
        fromGeometry: from,
        toGeometry: placement,
        rendered: from,
        styles: retained || suppressTransitions(element)
      };
      state.switchOperation = operation;
      element.classList.add(switchingClass);
      renderSwitch(element, state, operation);
      var limits = [aelluxJs.layoutMaxFPS(element)];
      var matching = (element.getAttribute(matchAttribute) || "").split(/\s+/).some(function(axis) {
        return axis === "width" || axis === "height";
      });
      var policy = aelluxJs.options.cssMotionPropertyMaxFPS;
      if (matching && policy !== null && policy !== 0) {
        var value = Number(policy);
        if (Number.isFinite(value) && value > 0) limits.push(value);
        else {
          if (policy !== void 0) aelluxJs.diagnostics.warn(aelluxJs.diagnostics.WARN_CSS_MOTION_PROPERTY_MAX_FPS_INVALID, {
            extension: "core",
            option: "cssMotionPropertyMaxFPS",
            value: policy,
            fallback: 55,
            reason: "CSS Motion frame rate must be finite and greater than zero; using 55 FPS.",
            suggestion: "Use a positive finite number or omit the option for the default."
          });
          limits.push(55);
        }
      }
      var maxFPS = limits.filter(function(value2) {
        return Number.isFinite(value2) && value2 > 0;
      }).reduce(function(min, value2) {
        return Math.min(min, value2);
      }, Infinity);
      aelluxJs.waitLayout.setVisualFPSLimit(state.motionId, maxFPS === Infinity ? null : maxFPS);
      aelluxJs.waitLayout.sequence(state.motionId, {
        update: function update() {
          return renderSwitch(element, state, operation);
        },
        repeat: {
          ms: 0
        },
        maxFPS: maxFPS === Infinity ? void 0 : maxFPS,
        abort: function abort() {
          return anchors.get(element) !== state || state.switchOperation !== operation;
        }
      }).catch(function(cause) {
        if (state.switchOperation === operation) stopSwitch(element, state);
        aelluxJs.diagnostics.error(aelluxJs.diagnostics.ERROR_EXTENSION_MOUNT, {
          cause: cause,
          extension: extensionName,
          element: element,
          method: "switch"
        });
      });
    }
    function renderSwitch(element, state, operation) {
      if (state.switchOperation !== operation || effectiveTarget(element, state) !== operation.target) return;
      var progress = Math.max(0, Math.min(1, (now() - operation.startedAt) / operation.duration));
      var from = operation.fromGeometry, to = operation.toGeometry;
      var eased = operation.easing(progress);
      var mix = function mix2(a, b) {
        return a + (b - a) * eased;
      };
      var geometry = {
        target: to.target,
        reference: to.reference,
        opacity: to.opacity,
        width: Math.max(0, mix(from.width, to.width)),
        height: Math.max(0, mix(from.height, to.height)),
        selected: {
          x: mix(from.selected.x, to.selected.x),
          y: mix(from.selected.y, to.selected.y),
          pivotX: mix(from.selected.pivotX, to.selected.pivotX),
          pivotY: mix(from.selected.pivotY, to.selected.pivotY),
          self: from.selected.self.map(function(value, axis) {
            return mix(value, to.selected.self[axis]);
          })
        }
      };
      operation.rendered = progress === 1 ? to : geometry;
      writePlacement(element, operation.rendered);
      if (progress === 1 || aelluxJs.currentPreference("reduced-motion") === "reduced") {
        writePlacement(element, to);
        stopSwitch(element, state);
        scheduleAnchor(element);
      }
      rememberVisual(element, state);
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
      var _iterator10 = _createForOfIteratorHelper2((value || "").split(",")), _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
          var token = _step10.value;
          var pair = token.trim().toLowerCase().split(":");
          if (pair.length !== 2 || !pivots[pair[0].trim()] || !pivots[pair[1].trim()]) continue;
          result.push({
            target: pivots[pair[0].trim()],
            self: pivots[pair[1].trim()]
          });
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
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
