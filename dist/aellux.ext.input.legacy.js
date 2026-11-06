(function() {
  // src/internal/input-shortcuts.js
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
  function shortcutLabel(shortcut) {
    var family = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "generic";
    if (!shortcut) return "";
    var faces = {
      xbox: {
        south: "A",
        east: "B",
        west: "X",
        north: "Y"
      },
      playstation: {
        south: "\xD7",
        east: "\u25CB",
        west: "\u25A1",
        north: "\u25B3"
      },
      nintendo: {
        south: "B",
        east: "A",
        west: "Y",
        north: "X"
      }
    };
    var label = shortcut.source === "keyboard" ? shortcut.code.replace(/^Key(?=[A-Z]$)|^Digit(?=\d$)/g, "") : faces[family] && faces[family][shortcut.code] || shortcut.code;
    return [].concat(_toConsumableArray(shortcut.modifiers.map(function(name) {
      return name[0].toUpperCase() + name.slice(1);
    })), [label]).join("+");
  }

  // src/src/aellux.ext.input.js
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
  }
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
  function _createForOfIteratorHelper(r, e) {
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
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var api = root.AelluxJs;
    if (!api) throw new Error("[aellux.js] Load the boot script before Input.");
    var extensionName = "input", attr = function attr2(name) {
      return api.attr(name);
    };
    var mounted = /* @__PURE__ */ new Set(), adapters = /* @__PURE__ */ new Map(), active = /* @__PURE__ */ new Map(), routers = [], families = [];
    var hintContexts = /* @__PURE__ */ new Map(), hints = /* @__PURE__ */ new Map();
    var loading = /* @__PURE__ */ new Map();
    var mountTokens = /* @__PURE__ */ new WeakMap();
    var outputs = ["gamepad", "active-input", "gamepad-family", "gamepad-model"];
    var actionMaps = {
      keyboard: {
        Enter: "confirm",
        Space: "confirm",
        Escape: "cancel",
        ArrowLeft: "navigate-left",
        ArrowRight: "navigate-right",
        ArrowUp: "navigate-up",
        ArrowDown: "navigate-down"
      },
      gamepad: {
        "dpad-left": "navigate-left",
        "dpad-right": "navigate-right",
        "dpad-up": "navigate-up",
        "dpad-down": "navigate-down"
      }
    };
    var running = false, observer = null, rootMemory = null, routerOrder = 0, familyOrder = 0;
    var _loop = function _loop2() {
      var name = _arr[_i];
      adapters.set(name, function() {
        return loadAdapter(name);
      });
    };
    for (var _i = 0, _arr = ["point", "keyboard", "gamepad"]; _i < _arr.length; _i++) {
      _loop();
    }
    api.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      pointers: function pointers(element) {
        var _active$get;
        return ((_active$get = active.get("point")) === null || _active$get === void 0 ? void 0 : _active$get.pointers(element)) || [];
      },
      registerRouter: registerRouter,
      removeRouters: removeRouters,
      resolveFocusId: resolveFocusId,
      dispatchCommand: dispatchCommand,
      registerAdapter: registerAdapter,
      registerGamepadFamily: registerGamepadFamily,
      devices: function devices() {
        var _active$get2;
        return ((_active$get2 = active.get("gamepad")) === null || _active$get2 === void 0 ? void 0 : _active$get2.devices()) || [];
      },
      setActionMap: setActionMap,
      setHintContext: setHintContext,
      describeShortcuts: parseShortcuts,
      refresh: refresh
    });
    function warn(reason) {
      var extra = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, _objectSpread({
        extension: extensionName,
        reason: reason
      }, extra));
    }
    function modalities(element) {
      var scope = element && element.nodeType === 1 ? element.closest("[".concat(attr("inputs"), "]")) : null;
      var value = scope ? scope.getAttribute(attr("inputs")) : root.document.documentElement.getAttribute(attr("inputs"));
      return new Set(value === null ? ["point", "keyboard"] : value.trim().split(/\s+/).filter(Boolean));
    }
    function accepts(source, element) {
      return modalities(element).has(source);
    }
    function init() {
      return _init.apply(this, arguments);
    }
    function _init() {
      _init = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee() {
        var _t;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              if (!running) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              running = true;
              rootMemory = api.persist.element.save(root.document.documentElement, outputs.map(attr), []);
              root.document.documentElement.setAttribute(attr("gamepad"), "false");
              api.mountManager.add({
                extensionName: extensionName,
                selector: ["point", "inputs", "shortcut-hint"].map(function(name) {
                  return "[".concat(attr(name), "]");
                }).join(","),
                mount: mount,
                unmount: unmount,
                update: refresh,
                controllers: ["pointers"]
              });
              api.comm.on("extension.destroyed", extensionDestroyed, {
                owner: extensionName
              });
              api.comm.on("focus.context-destroyed", contextDestroyed, {
                owner: extensionName
              });
              api.comm.handle("input.mount-token", function(_ref3) {
                var element = _ref3.element;
                return mountTokens.get(element) || null;
              }, {
                owner: extensionName
              });
              api.on("Unmount", onUnmount);
              observer = new root.MutationObserver(function(records) {
                if (records.some(function(record) {
                  return record.type === "attributes" || record.removedNodes.length || record.addedNodes.length;
                })) refresh().catch(function(cause) {
                  return warn("Input adapter refresh failed.", {
                    cause: cause
                  });
                });
              });
              observer.observe(root.document.documentElement, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ["inputs", "shortcut", "shortcut-hint", "shortcut-focus"].map(attr)
              });
              _context.p = 2;
              _context.n = 3;
              return refresh();
            case 3:
              _context.n = 5;
              break;
            case 4:
              _context.p = 4;
              _t = _context.v;
              destroy();
              throw _t;
            case 5:
              return _context.a(2);
          }
        }, _callee, null, [[2, 4]]);
      }));
      return _init.apply(this, arguments);
    }
    function mount(element) {
      var _active$get3;
      if (!mounted.has(element)) mountTokens.set(element, {});
      mounted.add(element);
      if (element.hasAttribute(attr("point"))) (_active$get3 = active.get("point")) === null || _active$get3 === void 0 || _active$get3.mount(element);
      return refresh();
    }
    function unmount(element) {
      var _active$get4;
      mounted.delete(element);
      mountTokens.delete(element);
      (_active$get4 = active.get("point")) === null || _active$get4 === void 0 || _active$get4.unmount(element);
      restoreHint(element);
      removeRouters(element);
      return refresh();
    }
    function loadAdapter(_x) {
      return _loadAdapter.apply(this, arguments);
    }
    function _loadAdapter() {
      _loadAdapter = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2(name) {
        var _api$registry$inputAd, _api$registry$inputAd2;
        var filename, _api$coreAssetIntegri, factory;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.n) {
            case 0:
              filename = "aellux.input.".concat(name).concat(api.diagnostics.legacy ? ".legacy" : "").concat(api.minified ? ".min" : "", ".js");
              if ((_api$registry$inputAd = api.registry.inputAdapters) !== null && _api$registry$inputAd !== void 0 && _api$registry$inputAd[name]) {
                _context2.n = 1;
                break;
              }
              _context2.n = 1;
              return api.dep("aellux-input-" + filename, "./" + filename, (_api$coreAssetIntegri = api.coreAssetIntegrity) === null || _api$coreAssetIntegri === void 0 ? void 0 : _api$coreAssetIntegri[filename]);
            case 1:
              factory = (_api$registry$inputAd2 = api.registry.inputAdapters) === null || _api$registry$inputAd2 === void 0 ? void 0 : _api$registry$inputAd2[name];
              if (factory) {
                _context2.n = 2;
                break;
              }
              throw new Error("Input adapter did not register: " + name);
            case 2:
              return _context2.a(2, factory({
                root: root,
                emit: dispatchCommand,
                accepts: accepts,
                changed: deviceChanged,
                identify: identifyFamily
              }));
          }
        }, _callee2);
      }));
      return _loadAdapter.apply(this, arguments);
    }
    function refresh() {
      return _refresh.apply(this, arguments);
    }
    function _refresh() {
      _refresh = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee5() {
        var requested, _iterator12, _step12, element, _iterator18, _step18, name, _iterator13, _step13, _name, _iterator14, _step14, _step14$value, _name2, adapter, _iterator16, _step16, entry, _iterator17, _step17, _step17$value, id;
        return _regenerator().w(function(_context5) {
          while (1) switch (_context5.n) {
            case 0:
              if (running) {
                _context5.n = 1;
                break;
              }
              return _context5.a(2);
            case 1:
              requested = modalities(root.document.documentElement);
              _iterator12 = _createForOfIteratorHelper(mounted);
              try {
                for (_iterator12.s(); !(_step12 = _iterator12.n()).done; ) {
                  element = _step12.value;
                  if (element.isConnected && element.hasAttribute(attr("inputs"))) {
                    _iterator18 = _createForOfIteratorHelper(modalities(element));
                    try {
                      for (_iterator18.s(); !(_step18 = _iterator18.n()).done; ) {
                        name = _step18.value;
                        requested.add(name);
                      }
                    } catch (err) {
                      _iterator18.e(err);
                    } finally {
                      _iterator18.f();
                    }
                  }
                }
              } catch (err) {
                _iterator12.e(err);
              } finally {
                _iterator12.f();
              }
              _iterator13 = _createForOfIteratorHelper(requested);
              try {
                for (_iterator13.s(); !(_step13 = _iterator13.n()).done; ) {
                  _name = _step13.value;
                  if (!adapters.has(_name)) warn("Unknown Input adapter.", {
                    value: _name
                  });
                }
              } catch (err) {
                _iterator13.e(err);
              } finally {
                _iterator13.f();
              }
              _iterator14 = _createForOfIteratorHelper(active);
              try {
                for (_iterator14.s(); !(_step14 = _iterator14.n()).done; ) {
                  _step14$value = _slicedToArray(_step14.value, 2), _name2 = _step14$value[0], adapter = _step14$value[1];
                  if (!requested.has(_name2)) {
                    active.delete(_name2);
                    adapter.destroy();
                  }
                }
              } catch (err) {
                _iterator14.e(err);
              } finally {
                _iterator14.f();
              }
              _context5.n = 2;
              return Promise.all(Array.from(requested).filter(function(name2) {
                return adapters.has(name2);
              }).map(/* @__PURE__ */ (function() {
                var _ref4 = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee4(name2) {
                  return _regenerator().w(function(_context4) {
                    while (1) switch (_context4.n) {
                      case 0:
                        if (!active.has(name2)) {
                          _context4.n = 1;
                          break;
                        }
                        return _context4.a(2);
                      case 1:
                        if (!loading.has(name2)) loading.set(name2, Promise.resolve().then(function() {
                          return adapters.get(name2)();
                        }).then(/* @__PURE__ */ (function() {
                          var _ref5 = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee3(adapter2) {
                            var _iterator15, _step15, element2;
                            return _regenerator().w(function(_context3) {
                              while (1) switch (_context3.n) {
                                case 0:
                                  if (!(!running || !adapters.has(name2) || !requestedModalities().has(name2))) {
                                    _context3.n = 1;
                                    break;
                                  }
                                  return _context3.a(2);
                                case 1:
                                  active.set(name2, adapter2);
                                  _context3.n = 2;
                                  return adapter2.init();
                                case 2:
                                  if (!(!running || !adapters.has(name2) || !requestedModalities().has(name2))) {
                                    _context3.n = 3;
                                    break;
                                  }
                                  if (active.get(name2) === adapter2) active.delete(name2);
                                  adapter2.destroy();
                                  return _context3.a(2);
                                case 3:
                                  if (name2 === "point") {
                                    _iterator15 = _createForOfIteratorHelper(mounted);
                                    try {
                                      for (_iterator15.s(); !(_step15 = _iterator15.n()).done; ) {
                                        element2 = _step15.value;
                                        if (element2.hasAttribute(attr("point"))) adapter2.mount(element2);
                                      }
                                    } catch (err) {
                                      _iterator15.e(err);
                                    } finally {
                                      _iterator15.f();
                                    }
                                  }
                                case 4:
                                  return _context3.a(2);
                              }
                            }, _callee3);
                          }));
                          return function(_x3) {
                            return _ref5.apply(this, arguments);
                          };
                        })()).finally(function() {
                          return loading.delete(name2);
                        }));
                        _context4.n = 2;
                        return loading.get(name2);
                      case 2:
                        return _context4.a(2);
                    }
                  }, _callee4);
                }));
                return function(_x2) {
                  return _ref4.apply(this, arguments);
                };
              })()));
            case 2:
              _iterator16 = _createForOfIteratorHelper(routers.slice());
              try {
                for (_iterator16.s(); !(_step16 = _iterator16.n()).done; ) {
                  entry = _step16.value;
                  if (entry.owner && entry.owner.nodeType && !entry.owner.isConnected) entry.remove();
                }
              } catch (err) {
                _iterator16.e(err);
              } finally {
                _iterator16.f();
              }
              _iterator17 = _createForOfIteratorHelper(hintContexts);
              try {
                for (_iterator17.s(); !(_step17 = _iterator17.n()).done; ) {
                  _step17$value = _slicedToArray(_step17.value, 1), id = _step17$value[0];
                  if (!Number.isSafeInteger(id)) hintContexts.delete(id);
                }
              } catch (err) {
                _iterator17.e(err);
              } finally {
                _iterator17.f();
              }
              updateHints();
            case 3:
              return _context5.a(2);
          }
        }, _callee5);
      }));
      return _refresh.apply(this, arguments);
    }
    function requestedModalities() {
      var names = modalities(root.document.documentElement);
      var _iterator = _createForOfIteratorHelper(mounted), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var element = _step.value;
          if (element.isConnected && element.hasAttribute(attr("inputs"))) {
            var _iterator2 = _createForOfIteratorHelper(modalities(element)), _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
                var name = _step2.value;
                names.add(name);
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return names;
    }
    function destroy() {
      var _observer, _rootMemory;
      running = false;
      (_observer = observer) === null || _observer === void 0 || _observer.disconnect();
      observer = null;
      api.comm.removeOwner(extensionName);
      var _iterator3 = _createForOfIteratorHelper(mounted), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var element = _step3.value;
          mountTokens.delete(element);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      api.off("Unmount", onUnmount);
      var _iterator4 = _createForOfIteratorHelper(active.values()), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var adapter = _step4.value;
          adapter.destroy();
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      active.clear();
      mounted.clear();
      var _iterator5 = _createForOfIteratorHelper(routers.slice()), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var entry = _step5.value;
          entry.remove();
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      var _iterator6 = _createForOfIteratorHelper(hints.keys()), _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
          var _element = _step6.value;
          restoreHint(_element);
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      hintContexts.clear();
      families.length = 0;
      (_rootMemory = rootMemory) === null || _rootMemory === void 0 || _rootMemory.restore();
      rootMemory = null;
      api.mountManager.remove({
        extensionName: extensionName
      });
    }
    function registerAdapter(name, factory) {
      if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof factory !== "function" || adapters.has(name)) throw new TypeError("Invalid or duplicate Input adapter.");
      adapters.set(name, factory);
      refresh().catch(function(cause) {
        return warn("Input adapter refresh failed.", {
          cause: cause
        });
      });
      return function() {
        var _active$get5;
        (_active$get5 = active.get(name)) === null || _active$get5 === void 0 || _active$get5.destroy();
        active.delete(name);
        adapters.delete(name);
      };
    }
    function registerRouter(resolve) {
      var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref$priority = _ref.priority, priority = _ref$priority === void 0 ? 0 : _ref$priority, _ref$owner = _ref.owner, owner = _ref$owner === void 0 ? null : _ref$owner, signal = _ref.signal;
      if (typeof resolve !== "function" || !Number.isFinite(priority)) throw new TypeError("A router requires a synchronous function and a finite priority.");
      if (signal !== null && signal !== void 0 && signal.aborted) return function() {
      };
      var entry = {
        resolve: resolve,
        priority: priority,
        owner: owner,
        order: routerOrder++,
        remove: function remove() {
          var index = routers.indexOf(entry);
          if (index !== -1) routers.splice(index, 1);
          signal === null || signal === void 0 || signal.removeEventListener("abort", entry.remove);
        }
      };
      routers.push(entry);
      routers.sort(function(a, b) {
        return b.priority - a.priority || a.order - b.order;
      });
      signal === null || signal === void 0 || signal.addEventListener("abort", entry.remove, {
        once: true
      });
      return entry.remove;
    }
    function removeRouters(owner) {
      var _iterator7 = _createForOfIteratorHelper(routers.slice()), _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
          var entry = _step7.value;
          if (entry.owner === owner) entry.remove();
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
    }
    function extensionDestroyed(detail) {
      removeRouters(detail.extension);
    }
    function contextDestroyed(detail) {
      hintContexts.delete(detail.focusId);
      updateHints();
    }
    function onUnmount(event) {
      var _event$detail = event.detail, scope = _event$detail.root, extensions = _event$detail.extensions, detachedOnly = _event$detail.detachedOnly;
      if (extensions && !extensions.includes(extensionName)) return;
      var _iterator8 = _createForOfIteratorHelper(routers.slice()), _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
          var _entry$owner;
          var entry = _step8.value;
          if ((_entry$owner = entry.owner) !== null && _entry$owner !== void 0 && _entry$owner.nodeType && (detachedOnly ? !entry.owner.isConnected : scope.contains(entry.owner))) entry.remove();
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
    }
    function resolveFocusId(command) {
      var _iterator9 = _createForOfIteratorHelper(routers.slice()), _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
          var _entry$owner2;
          var entry = _step9.value;
          if (!routers.includes(entry)) continue;
          if ((_entry$owner2 = entry.owner) !== null && _entry$owner2 !== void 0 && _entry$owner2.nodeType && !entry.owner.isConnected) {
            entry.remove();
            continue;
          }
          var id = void 0;
          try {
            id = entry.resolve(command);
          } catch (cause) {
            warn("Input router failed; command blocked.", {
              cause: cause,
              deviceId: command.deviceId
            });
            return null;
          }
          if (id === void 0) continue;
          if (id === null) return null;
          if (Number.isSafeInteger(id) && id > 0) return id;
          if (id && typeof id.then === "function") Promise.resolve(id).catch(function() {
          });
          warn("Invalid focus association; command blocked.", {
            value: id,
            deviceId: command.deviceId
          });
          return null;
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      return 1;
    }
    function dispatchCommand(value) {
      var _actionMaps$value$sou, _command$originalEven;
      if (!running || !value || typeof value.deviceId !== "string" || !value.deviceId || typeof value.source !== "string" || typeof value.code !== "string" || !["press", "release", "repeat", "move", "cancel"].includes(value.phase)) return false;
      if (!active.has(value.source) || value.target && !accepts(value.source, value.target)) return false;
      var normalized = Object.freeze(_objectSpread(_objectSpread({}, value), {}, {
        modifiers: Object.freeze(_objectSpread({}, value.modifiers)),
        action: value.action || ((_actionMaps$value$sou = actionMaps[value.source]) === null || _actionMaps$value$sou === void 0 ? void 0 : _actionMaps$value$sou[value.code]) || null,
        timestamp: root.performance.now()
      }));
      var focusId = resolveFocusId(normalized);
      if (focusId === null) {
        api.dispatch("InputBlocked", {
          detail: {
            command: normalized
          }
        });
        return false;
      }
      var command = Object.freeze(_objectSpread(_objectSpread({}, normalized), {}, {
        focusId: focusId
      }));
      if (command.intentional && (command.phase === "press" || command.phase === "repeat")) {
        setHintContext(focusId, {
          source: command.source,
          family: command.family || "generic",
          model: command.model || "",
          deviceId: command.deviceId
        });
        var html = root.document.documentElement;
        html.setAttribute(attr("active-input"), command.source);
        if (command.source === "gamepad") {
          html.setAttribute(attr("gamepad-family"), command.family);
          html.setAttribute(attr("gamepad-model"), command.model);
        }
      }
      if (!api.dispatch("BeforeInputCommand", {
        cancelable: true,
        detail: {
          command: command
        }
      })) return false;
      var response = api.comm.request("focus.command", command);
      var handled = response.handled && response.value === true;
      if (handled && (_command$originalEven = command.originalEvent) !== null && _command$originalEven !== void 0 && _command$originalEven.cancelable) command.originalEvent.preventDefault();
      api.dispatch("InputCommand", {
        detail: {
          command: command,
          handled: handled
        }
      });
      return handled;
    }
    function setActionMap(source, mapping) {
      actionMaps[source] = _objectSpread(_objectSpread({}, actionMaps[source]), mapping);
    }
    function registerGamepadFamily(identify) {
      var _ref2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref2$priority = _ref2.priority, priority = _ref2$priority === void 0 ? 0 : _ref2$priority;
      if (typeof identify !== "function" || !Number.isFinite(priority)) throw new TypeError("Invalid gamepad family detector.");
      var entry = {
        identify: identify,
        priority: priority,
        order: familyOrder++
      };
      families.push(entry);
      families.sort(function(a, b) {
        return b.priority - a.priority || a.order - b.order;
      });
      return function() {
        var index = families.indexOf(entry);
        if (index !== -1) families.splice(index, 1);
      };
    }
    function identifyFamily(id) {
      var _iterator0 = _createForOfIteratorHelper(families), _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done; ) {
          var entry = _step0.value;
          var result = entry.identify(id);
          if (result) return result;
        }
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      return null;
    }
    function deviceChanged(device, connected, operational) {
      if (running) root.document.documentElement.setAttribute(attr("gamepad"), String(operational));
      if (!connected) {
        var _iterator1 = _createForOfIteratorHelper(hintContexts), _step1;
        try {
          for (_iterator1.s(); !(_step1 = _iterator1.n()).done; ) {
            var _step1$value = _slicedToArray(_step1.value, 2), id = _step1$value[0], context = _step1$value[1];
            if (context.deviceId === device.deviceId) hintContexts.delete(id);
          }
        } catch (err) {
          _iterator1.e(err);
        } finally {
          _iterator1.f();
        }
      }
      api.dispatch(connected ? "InputDeviceConnected" : "InputDeviceDisconnected", {
        detail: {
          device: device
        }
      });
      updateHints();
    }
    function setHintContext(focusId, context) {
      if (!Number.isSafeInteger(focusId) || focusId < 1) throw new TypeError("Invalid hint focusId.");
      hintContexts.set(focusId, Object.freeze(_objectSpread({}, context)));
      updateHints();
    }
    function restoreHint(element) {
      var _hints$get;
      (_hints$get = hints.get(element)) === null || _hints$get === void 0 || _hints$get.restore();
      hints.delete(element);
    }
    function updateHints() {
      var _iterator10 = _createForOfIteratorHelper(hints.keys()), _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
          var element = _step10.value;
          if (!element.isConnected || !element.hasAttribute(attr("shortcut-hint"))) restoreHint(element);
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
      var _iterator11 = _createForOfIteratorHelper(mounted), _step11;
      try {
        var _loop2 = function _loop22() {
          var element2 = _step11.value;
          if (!element2.isConnected || !element2.hasAttribute(attr("shortcut-hint"))) return 1;
          if (!hints.has(element2)) hints.set(element2, api.persist.element.save(element2, ["shortcut-label", "shortcut-source", "gamepad-family", "shortcut-code", "gamepad-model"].map(attr), []));
          var explicit = element2.getAttribute(attr("shortcut-hint"));
          var owner = element2.closest("[".concat(attr("shortcut"), "]"));
          var descriptions = parseShortcuts(explicit || (owner === null || owner === void 0 ? void 0 : owner.getAttribute(attr("shortcut"))));
          var id = Number(element2.getAttribute(attr("shortcut-focus")) || 1);
          var context = hintContexts.get(id) || {
            source: "keyboard",
            family: "generic"
          };
          var description = descriptions.find(function(item) {
            return item.source === context.source;
          }) || descriptions[0];
          for (var _i2 = 0, _arr2 = [["shortcut-label", shortcutLabel(description, context.family)], ["shortcut-source", (description === null || description === void 0 ? void 0 : description.source) || ""], ["shortcut-code", (description === null || description === void 0 ? void 0 : description.code) || ""], ["gamepad-family", context.family || "generic"], ["gamepad-model", context.model || ""]]; _i2 < _arr2.length; _i2++) {
            var _arr2$_i = _slicedToArray(_arr2[_i2], 2), name = _arr2$_i[0], value = _arr2$_i[1];
            element2.setAttribute(attr(name), value);
          }
        };
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
          if (_loop2()) continue;
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.input.legacy.js.map
