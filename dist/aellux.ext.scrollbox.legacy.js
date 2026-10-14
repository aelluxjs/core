(function() {
  // src/src/aellux.ext.scrollbox.js
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
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
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
    var extensionName = "scrollbox";
    if (!AelluxJs) throw new Error("[aellux.js] Load the boot script before the scrollbox extension.");
    var attribute = AelluxJs.attr(extensionName);
    var optionsAttribute = AelluxJs.attr("scrollbox-options");
    var wheelAttribute = AelluxJs.attr("scrollbox-wheel-horizontal");
    var dependencyURL = "https://unpkg.com/better-scroll@2.5.1/dist/better-scroll.min.js";
    var dependencyIntegrity = "sha384-4mVyaBOPOLtUq+Cg7YRI7vesPIrJkaN/jQFWuTBl9acmb7D2yiAMXp0pxHVI3qM2";
    var RESIZE_INTERVAL_MS = 100;
    var properties = ["--ae-scroll-y-progress", "--ae-scroll-x-progress"];
    var betterScrollProperties = ["transform", "transform-origin", "transition", "transition-property", "transition-duration", "transition-timing-function", "transition-delay", "will-change", "overflow", "touch-action"];
    var scrollboxes = /* @__PURE__ */ new Map();
    var defaultOptions = Object.freeze({
      scrollX: false,
      scrollY: true,
      click: true,
      bounce: false,
      momentum: true,
      probeType: 3,
      mouseWheel: true,
      nestedScroll: true,
      scrollbar: {
        fade: true,
        interactive: true,
        scrollbarTrackClickable: true
      }
    });
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy
    });
    function init() {
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attribute, "]"),
        mount: mountScrollbox,
        update: updateScrollbox,
        unmount: unmountScrollbox
      });
    }
    function destroy() {
      var _iterator = _createForOfIteratorHelper(scrollboxes.keys()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var element = _step.value;
          unmountScrollbox(element);
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
    function mountScrollbox(_x) {
      return _mountScrollbox.apply(this, arguments);
    }
    function _mountScrollbox() {
      _mountScrollbox = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee(element) {
        var previous, state;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              if (!scrollboxes.has(element)) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              previous = properties.map(function(name) {
                return {
                  value: element.style.getPropertyValue(name),
                  priority: element.style.getPropertyPriority(name)
                };
              });
              state = {
                element: element,
                previous: previous,
                instance: null,
                mode: null,
                optionsText: null,
                parsedOptionsText: null,
                parsedOptions: null,
                wheelEnabled: true,
                desktop: false,
                wheelListening: false,
                disposed: false,
                generation: 0,
                metrics: null,
                axes: null,
                axisTimer: null,
                content: null,
                resizeObserver: null,
                mutationObserver: null,
                savedStyles: null,
                lastResizeTime: -RESIZE_INTERVAL_MS,
                resizeTimeout: null
              };
              state.onScroll = function() {
                if (!state.instance) publish(state);
              };
              state.onWheel = function(event) {
                return handleWheel(state, event);
              };
              state.onEnhancedScroll = function() {
                return publish(state);
              };
              scrollboxes.set(element, state);
              element.addEventListener("scroll", state.onScroll, {
                passive: true
              });
              observe(state);
              _context.n = 2;
              return configure(state);
            case 2:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _mountScrollbox.apply(this, arguments);
    }
    function updateScrollbox(_x2) {
      return _updateScrollbox.apply(this, arguments);
    }
    function _updateScrollbox() {
      _updateScrollbox = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2(element) {
        var state;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.n) {
            case 0:
              state = scrollboxes.get(element);
              if (!state) {
                _context2.n = 1;
                break;
              }
              _context2.n = 1;
              return configure(state);
            case 1:
              return _context2.a(2);
          }
        }, _callee2);
      }));
      return _updateScrollbox.apply(this, arguments);
    }
    function unmountScrollbox(element) {
      var state = scrollboxes.get(element);
      if (!state) return;
      state.disposed = true;
      state.generation++;
      element.removeEventListener("scroll", state.onScroll);
      if (state.wheelListening) element.removeEventListener("wheel", state.onWheel, true);
      if (state.resizeObserver) state.resizeObserver.disconnect();
      if (state.mutationObserver) state.mutationObserver.disconnect();
      if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
      if (state.axisTimer) root.clearTimeout(state.axisTimer);
      root.removeEventListener("resize", state.onResize);
      stopEnhancement(state);
      properties.forEach(function(name, index) {
        var original = state.previous[index];
        if (original.value) element.style.setProperty(name, original.value, original.priority);
        else element.style.removeProperty(name);
      });
      scrollboxes.delete(element);
    }
    function configure(_x3) {
      return _configure.apply(this, arguments);
    }
    function _configure() {
      _configure = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee3(state) {
        var force, element, mode, optionsText, shouldEnhance, changed, generation, userOptions, BetterScroll, content, geometry, nativeGeometry, horizontalOnly, options, instance, _args3 = arguments, _t, _t2;
        return _regenerator().w(function(_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              force = _args3.length > 1 && _args3[1] !== void 0 ? _args3[1] : false;
              element = state.element;
              mode = readMode(element);
              optionsText = element.getAttribute(optionsAttribute) || "";
              state.wheelEnabled = element.getAttribute(wheelAttribute) !== "false";
              state.desktop = isDesktop();
              if (state.desktop && !state.wheelListening) {
                element.addEventListener("wheel", state.onWheel, {
                  passive: false,
                  capture: true
                });
                state.wheelListening = true;
              } else if (!state.desktop && state.wheelListening) {
                element.removeEventListener("wheel", state.onWheel, true);
                state.wheelListening = false;
              }
              shouldEnhance = mode === "enhance" || mode === "auto" && state.desktop;
              changed = state.mode !== mode || state.optionsText !== optionsText;
              state.mode = mode;
              state.optionsText = optionsText;
              if (shouldEnhance) {
                _context3.n = 1;
                break;
              }
              stopEnhancement(state);
              refresh(state);
              return _context3.a(2);
            case 1:
              if (!(state.instance && !changed && !force)) {
                _context3.n = 2;
                break;
              }
              refresh(state);
              return _context3.a(2);
            case 2:
              stopEnhancement(state);
              generation = ++state.generation;
              if (state.parsedOptionsText !== optionsText) {
                state.parsedOptions = parseOptions(element, optionsText);
                state.parsedOptionsText = optionsText;
              }
              userOptions = state.parsedOptions;
              _context3.p = 3;
              _context3.n = 4;
              return AelluxJs.dep("better-scroll", dependencyURL, dependencyIntegrity, "anonymous");
            case 4:
              _context3.n = 6;
              break;
            case 5:
              _context3.p = 5;
              _t = _context3.v;
              if (!state.disposed && generation === state.generation) {
                AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_ENHANCEMENT_UNAVAILABLE, {
                  element: element,
                  cause: _t
                });
                refresh(state);
              }
              return _context3.a(2);
            case 6:
              if (!(state.disposed || generation !== state.generation)) {
                _context3.n = 7;
                break;
              }
              return _context3.a(2);
            case 7:
              BetterScroll = root.BetterScroll;
              if (!(!BetterScroll || typeof BetterScroll.createBScroll !== "function")) {
                _context3.n = 8;
                break;
              }
              AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_ENHANCEMENT_UNAVAILABLE, {
                element: element,
                reason: "BetterScroll.createBScroll is unavailable"
              });
              refresh(state);
              return _context3.a(2);
            case 8:
              content = element.firstElementChild;
              if (!(!content || content !== element.lastElementChild)) {
                _context3.n = 9;
                break;
              }
              AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_ENHANCEMENT_UNAVAILABLE, {
                element: element,
                reason: "BetterScroll requires one direct content element"
              });
              refresh(state);
              return _context3.a(2);
            case 9:
              geometry = contentMetrics(element, content);
              nativeGeometry = nativeMetrics(element);
              if (!(nativeGeometry.maxX > 1 && geometry.maxX <= 1 || nativeGeometry.maxY > 1 && geometry.maxY <= 1)) {
                _context3.n = 10;
                break;
              }
              AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_ENHANCEMENT_UNAVAILABLE, {
                element: element,
                reason: "Content element must cover the scrollable area"
              });
              refresh(state);
              return _context3.a(2);
            case 10:
              horizontalOnly = geometry.maxX > 1 && geometry.maxY <= 1;
              options = _objectSpread(_objectSpread({}, defaultOptions), {}, {
                scrollX: geometry.maxX > 1,
                scrollY: geometry.maxY > 1,
                mouseWheel: !horizontalOnly && state.desktop
              }, userOptions);
              state.savedStyles = [element, content].map(function(target) {
                return {
                  target: target,
                  values: betterScrollProperties.map(function(name) {
                    return {
                      value: target.style.getPropertyValue(name),
                      priority: target.style.getPropertyPriority(name)
                    };
                  })
                };
              });
              _context3.p = 11;
              instance = BetterScroll.createBScroll(element, options);
              if (!(!instance || typeof instance.on !== "function" || typeof instance.scrollTo !== "function")) {
                _context3.n = 12;
                break;
              }
              if (instance && typeof instance.destroy === "function") instance.destroy();
              throw new TypeError("Invalid BetterScroll instance");
            case 12:
              state.instance = instance;
              state.content = content;
              state.axes = axes(geometry);
              instance.on("scroll", state.onEnhancedScroll);
              instance.on("scrollEnd", state.onEnhancedScroll);
              refresh(state);
              _context3.n = 14;
              break;
            case 13:
              _context3.p = 13;
              _t2 = _context3.v;
              stopEnhancement(state);
              AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_SCROLLBOX_ENHANCEMENT_INIT, {
                element: element,
                cause: _t2
              });
              refresh(state);
            case 14:
              return _context3.a(2);
          }
        }, _callee3, null, [[11, 13], [3, 5]]);
      }));
      return _configure.apply(this, arguments);
    }
    function stopEnhancement(state) {
      if (state.axisTimer) root.clearTimeout(state.axisTimer);
      state.axisTimer = null;
      state.axes = null;
      state.content = null;
      var instance = state.instance;
      state.instance = null;
      if (instance) {
        try {
          instance.off("scroll", state.onEnhancedScroll);
          instance.off("scrollEnd", state.onEnhancedScroll);
          instance.destroy();
        } catch (cause) {
          AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_SCROLLBOX_ENHANCEMENT_INIT, {
            element: state.element,
            cause: cause
          });
        }
      }
      if (state.savedStyles) {
        var _iterator2 = _createForOfIteratorHelper(state.savedStyles), _step2;
        try {
          var _loop = function _loop2() {
            var _step2$value = _step2.value, target = _step2$value.target, values = _step2$value.values;
            betterScrollProperties.forEach(function(name, index) {
              var original = values[index];
              if (original.value) target.style.setProperty(name, original.value, original.priority);
              else target.style.removeProperty(name);
            });
          };
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
            _loop();
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
        state.savedStyles = null;
      }
    }
    function readMode(element) {
      var value = (element.getAttribute(attribute) || "auto").trim().toLowerCase();
      if (value === "native" || value === "auto" || value === "enhance") return value;
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_MODE_INVALID, {
        element: element,
        value: value
      });
      return "auto";
    }
    function parseOptions(element, text) {
      if (!text.trim()) return {};
      var parsed;
      try {
        parsed = JSON.parse(text);
      } catch (cause) {
        AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_OPTIONS_JSON, {
          element: element,
          value: text,
          cause: cause
        });
        return {};
      }
      if (!parsed || Array.isArray(parsed) || _typeof(parsed) !== "object") {
        AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_SCROLLBOX_OPTIONS_OBJECT, {
          element: element,
          value: text
        });
        return {};
      }
      return parsed;
    }
    function isDesktop() {
      return !!(root.matchMedia && root.matchMedia("(hover: hover) and (pointer: fine)").matches && (!root.navigator || root.navigator.maxTouchPoints === 0));
    }
    function observe(state) {
      state.onResize = function() {
        return scheduleResize(state);
      };
      root.addEventListener("resize", state.onResize, {
        passive: true
      });
      if (root.ResizeObserver) {
        state.resizeObserver = new root.ResizeObserver(function() {
          return scheduleResize(state);
        });
        state.resizeObserver.observe(state.element);
        var _iterator3 = _createForOfIteratorHelper(state.element.children), _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
            var child = _step3.value;
            state.resizeObserver.observe(child);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }
      if (root.MutationObserver) {
        state.mutationObserver = new root.MutationObserver(function() {
          if (state.resizeObserver) {
            state.resizeObserver.disconnect();
            state.resizeObserver.observe(state.element);
            var _iterator4 = _createForOfIteratorHelper(state.element.children), _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
                var _child = _step4.value;
                state.resizeObserver.observe(_child);
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
          }
          refresh(state);
        });
        state.mutationObserver.observe(state.element, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    }
    function scheduleResize(state) {
      if (state.disposed) return;
      var elapsed = now() - state.lastResizeTime;
      if (elapsed >= RESIZE_INTERVAL_MS) {
        if (state.resizeTimeout !== null) root.clearTimeout(state.resizeTimeout);
        state.resizeTimeout = null;
        flushResize(state);
        return;
      }
      if (state.resizeTimeout !== null) return;
      state.resizeTimeout = root.setTimeout(function() {
        return flushResize(state);
      }, RESIZE_INTERVAL_MS - elapsed);
    }
    function flushResize(state) {
      state.resizeTimeout = null;
      if (state.disposed) return;
      state.lastResizeTime = now();
      refresh(state);
    }
    function now() {
      return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
    }
    function refresh(state) {
      if (state.disposed) return;
      if (state.instance && state.element.firstElementChild !== state.content) {
        stopEnhancement(state);
        state.metrics = nativeMetrics(state.element);
        publish(state);
        configure(state, true);
        return;
      }
      if (state.instance) state.instance.refresh();
      state.metrics = state.instance ? enhancedMetrics(state.instance) : nativeMetrics(state.element);
      publish(state);
      if (state.instance && !state.axisTimer && axes(contentMetrics(state.element, state.element.firstElementChild)) !== state.axes) {
        state.axisTimer = root.setTimeout(function() {
          state.axisTimer = null;
          if (!state.disposed && state.instance) configure(state, true);
        }, 0);
      }
    }
    function contentMetrics(element, content) {
      return {
        maxX: Math.max(0, content.offsetWidth - element.clientWidth),
        maxY: Math.max(0, content.offsetHeight - element.clientHeight)
      };
    }
    function axes(metrics) {
      return String(metrics.maxX > 1) + ":" + String(metrics.maxY > 1);
    }
    function nativeMetrics(element) {
      return {
        maxX: Math.max(0, element.scrollWidth - element.clientWidth),
        maxY: Math.max(0, element.scrollHeight - element.clientHeight),
        page: element.clientHeight || 1
      };
    }
    function enhancedMetrics(instance) {
      return {
        maxX: Math.max(0, -instance.maxScrollX),
        maxY: Math.max(0, -instance.maxScrollY),
        page: instance.wrapper.clientHeight || 1
      };
    }
    function publish(state) {
      var metrics = state.metrics || nativeMetrics(state.element);
      var x = state.instance ? -state.instance.x : state.element.scrollLeft;
      var y = state.instance ? -state.instance.y : state.element.scrollTop;
      state.element.style.setProperty(properties[0], progress(y, metrics.maxY));
      state.element.style.setProperty(properties[1], progress(x, metrics.maxX));
    }
    function progress(position, distance) {
      return distance > 0 ? Math.min(1, Math.max(0, position / distance)) : 0;
    }
    function handleWheel(state, event) {
      if (!state.desktop || event.defaultPrevented) return;
      var metrics = state.metrics;
      if (!metrics || metrics.maxX <= 1 || metrics.maxY > 1) return;
      var horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (horizontalIntent && !state.instance) return;
      if (!horizontalIntent && !state.wheelEnabled) return;
      var factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.page : 1;
      var delta = (horizontalIntent ? event.deltaX : event.deltaY) * factor;
      if (!delta) return;
      var current = state.instance ? -state.instance.x : state.element.scrollLeft;
      var next = Math.max(0, Math.min(metrics.maxX, current + delta));
      if (next === current) return;
      event.preventDefault();
      if (state.instance) {
        event.stopImmediatePropagation();
        state.instance.scrollTo(-next, state.instance.y, 0);
        publish(state);
      } else {
        state.element.scrollLeft = next;
        publish(state);
      }
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.scrollbox.legacy.js.map
