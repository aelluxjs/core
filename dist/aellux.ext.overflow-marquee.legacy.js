(function() {
  // src/internal/parse-overflow-marquee-limit.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function parseOverflowMarqueeLimit(value) {
    var text = (value || "").trim();
    if (!text) return null;
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)(?:px)?$/i.test(text)) return void 0;
    var limit = parseFloat(text);
    return Number.isFinite(limit) ? limit : void 0;
  }

  // src/internal/create-overflow-marquee.js
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
    }), (_regenerator = function _regenerator3() {
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
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createOverflowMarquee(root, api, anchor) {
    var _root$matchMedia;
    var attribute = api.attr("overflow-marquee");
    var contentAttribute = api.attr("overflow-marquee-content");
    var activeAttribute = api.attr("overflow-marquee-active");
    var readyAttribute = api.attr("overflow-marquee-ready");
    var viewportAttribute = api.attr("overflow-marquee-viewport");
    var fadeAttribute = api.attr("overflow-marquee-fade");
    var offsetProperty = "--ae-overflow-marquee-offset";
    var reducedAttribute = api.attr("reduced-motion");
    var selector = "[".concat(attribute, "]");
    var states = /* @__PURE__ */ new Map();
    var desktop = (_root$matchMedia = root.matchMedia) === null || _root$matchMedia === void 0 ? void 0 : _root$matchMedia.call(root, "(any-hover: hover) and (any-pointer: fine)");
    var observer = null;
    return {
      selector: selector,
      mount: mount,
      unmount: unmount,
      update: update,
      destroy: destroy
    };
    function listenMedia(add) {
      if (desktop !== null && desktop !== void 0 && desktop.addEventListener) desktop[add ? "addEventListener" : "removeEventListener"]("change", refreshAll);
      else if (desktop !== null && desktop !== void 0 && desktop.addListener) desktop[add ? "addListener" : "removeListener"](refreshAll);
    }
    function refreshAll(event) {
      var _iterator = _createForOfIteratorHelper(states), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var _step$value = _slicedToArray(_step.value, 2), element = _step$value[0], state = _step$value[1];
          if (state.enabled || (event === null || event === void 0 ? void 0 : event.type) === "resize" || (event === null || event === void 0 ? void 0 : event.type) === "loadingdone") schedule(element);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    function motionChanged(event) {
      var _iterator2 = _createForOfIteratorHelper(states), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var _step2$value = _slicedToArray(_step2.value, 2), element = _step2$value[0], state = _step2$value[1];
          if (!state.enabled) continue;
          if (event.target !== state.wrapper && event.target !== state.viewport && (event.target.contains(element) || element.contains(event.target))) schedule(element);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
    function visible(state) {
      if (!state.element.isConnected || root.document.hidden || state.intersecting === false || anchor.invisible(state.wrapper.isConnected ? state.wrapper : state.element)) return false;
      var bounds = state.element.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.right > 0 && bounds.bottom > 0 && bounds.left < root.innerWidth && bounds.top < root.innerHeight;
    }
    function interacting(state) {
      return state.element.contains(root.document.activeElement) || !!(desktop !== null && desktop !== void 0 && desktop.matches && state.element.matches(":hover"));
    }
    function canRun(state) {
      return visible(state) && !interacting(state);
    }
    function mount(_x) {
      return _mount.apply(this, arguments);
    }
    function _mount() {
      _mount = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee(element) {
        var wrapper, viewport, state, _root$document$fonts, _root$document$fonts$, _i3, _arr2, name;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              if (!states.has(element)) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              wrapper = root.document.createElement("span");
              viewport = root.document.createElement("span");
              viewport.setAttribute(viewportAttribute, "");
              wrapper.setAttribute(contentAttribute, "top-left:top-left");
              state = {
                element: element,
                wrapper: wrapper,
                viewport: viewport,
                revision: 0,
                signature: null,
                pending: null,
                dirty: false,
                timer: null,
                motionId: api.motion.id(),
                layoutId: api.motion.id(),
                cycleId: api.motion.id(),
                ownedTitle: null,
                paused: true,
                intersecting: root.IntersectionObserver ? false : null,
                phase: "wait",
                x: 0,
                memory: api.persist.element.save(element, [activeAttribute, readyAttribute]),
                resize: null,
                intersection: null,
                enabled: false,
                probeStyle: void 0
              };
              states.set(element, state);
              state.onInteraction = function() {
                return schedule(element);
              };
              if (states.size === 1) {
                if (root.MutationObserver) {
                  observer = new root.MutationObserver(function(records) {
                    var _iterator3 = _createForOfIteratorHelper(states), _step3;
                    try {
                      var _loop = function _loop2() {
                        var _step3$value = _slicedToArray(_step3.value, 2), host = _step3$value[0], value = _step3$value[1];
                        if (records.some(function(record) {
                          var node = record.target;
                          if ((node === value.wrapper || node === value.viewport) && record.type === "attributes") return false;
                          if (record.type === "attributes" && node === host && record.attributeName === activeAttribute) return false;
                          if (record.type === "attributes" && node === host && record.attributeName === "style" && host.getAttribute("style") === value.probeStyle) return false;
                          if (!value.enabled && record.type === "attributes" && [fadeAttribute, reducedAttribute, "dir"].includes(record.attributeName)) return false;
                          return node === root.document.documentElement || host.contains(node) || node.contains(host);
                        })) schedule(host);
                      };
                      for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
                        _loop();
                      }
                    } catch (err) {
                      _iterator3.e(err);
                    } finally {
                      _iterator3.f();
                    }
                  });
                  observer.observe(root.document, {
                    subtree: true,
                    childList: true,
                    characterData: true,
                    attributes: true,
                    attributeFilter: [attribute, fadeAttribute, reducedAttribute, "class", "style", "hidden", "dir"]
                  });
                }
                root.document.addEventListener("visibilitychange", refreshAll);
                for (_i3 = 0, _arr2 = ["transitionend", "transitioncancel", "animationstart", "animationend", "animationcancel"]; _i3 < _arr2.length; _i3++) {
                  name = _arr2[_i3];
                  root.document.addEventListener(name, motionChanged, true);
                }
                root.addEventListener("resize", refreshAll);
                root.addEventListener("scroll", refreshAll, {
                  capture: true,
                  passive: true
                });
                (_root$document$fonts = root.document.fonts) === null || _root$document$fonts === void 0 || (_root$document$fonts$ = _root$document$fonts.addEventListener) === null || _root$document$fonts$ === void 0 || _root$document$fonts$.call(_root$document$fonts, "loadingdone", refreshAll);
                listenMedia(true);
              }
              if (root.ResizeObserver) {
                state.resize = new root.ResizeObserver(function() {
                  return schedule(element);
                });
                state.resize.observe(element);
              }
              if (root.IntersectionObserver) {
                state.intersection = new root.IntersectionObserver(function(entries) {
                  var entry = entries[entries.length - 1];
                  state.intersecting = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
                  schedule(element);
                }, {
                  threshold: [0, 1e-6]
                });
              }
              _context.n = 2;
              return update(element);
            case 2:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _mount.apply(this, arguments);
    }
    function unwrap(state) {
      if (state.viewport.parentNode !== state.element) return;
      reconcile(state);
      while (state.wrapper.firstChild) state.element.insertBefore(state.wrapper.firstChild, state.viewport);
      state.viewport.remove();
    }
    function enable(state, enabled) {
      if (state.enabled === enabled) return;
      state.enabled = enabled;
      var element = state.element, wrapper = state.wrapper;
      for (var _i = 0, _arr = ["mouseenter", "mouseleave", "focusin", "focusout"]; _i < _arr.length; _i++) {
        var name = _arr[_i];
        element[enabled ? "addEventListener" : "removeEventListener"](name, state.onInteraction);
      }
      if (enabled) {
        var _state$resize, _state$intersection;
        element.setAttribute(readyAttribute, "");
        reconcile(state);
        anchor.mount(wrapper);
        (_state$resize = state.resize) === null || _state$resize === void 0 || _state$resize.observe(wrapper);
        (_state$intersection = state.intersection) === null || _state$intersection === void 0 || _state$intersection.observe(element);
      } else {
        var _state$resize2, _state$intersection2;
        stop(state);
        state.paused = true;
        state.signature = null;
        state.placements = null;
        (_state$resize2 = state.resize) === null || _state$resize2 === void 0 || _state$resize2.unobserve(wrapper);
        (_state$intersection2 = state.intersection) === null || _state$intersection2 === void 0 || _state$intersection2.disconnect();
        state.intersecting = root.IntersectionObserver ? false : null;
        anchor.unmount(wrapper);
        unwrap(state);
        tooltip(state, null);
        element.removeAttribute(activeAttribute);
        element.removeAttribute(readyAttribute);
      }
    }
    function exceedsLimit(state, limit) {
      var element = state.element, wrapper = state.wrapper;
      state.probeStyle = element.getAttribute("style");
      try {
        element.style.setProperty("white-space", "nowrap", "important");
        var range = root.document.createRange();
        range.selectNodeContents(state.viewport.parentNode === element && wrapper.parentNode === state.viewport ? wrapper : element);
        var bounds = range.getBoundingClientRect();
        var lineHeight = element.textContent.trim() ? parseFloat(root.getComputedStyle(element).lineHeight) || 0 : 0;
        return bounds.width > limit || Math.max(bounds.height, lineHeight) > limit;
      } finally {
        if (state.probeStyle === null) {
          element.getAttribute("style");
          element.removeAttribute("style");
        } else element.setAttribute("style", state.probeStyle);
      }
    }
    function reconcile(state) {
      var element = state.element, wrapper = state.wrapper, viewport = state.viewport;
      if (viewport.parentNode !== element) viewport.textContent = "";
      if (viewport.parentNode !== element || wrapper.parentNode !== viewport) wrapper.textContent = "";
      if (viewport.parentNode === element && wrapper.parentNode === viewport && element.childNodes.length === 1 && viewport.childNodes.length === 1) return;
      var contents = root.document.createDocumentFragment();
      var _collect = function collect(parent) {
        for (var _i2 = 0, _Array$from = Array.from(parent.childNodes); _i2 < _Array$from.length; _i2++) {
          var node = _Array$from[_i2];
          if (node === viewport || node === wrapper) _collect(node);
          else contents.appendChild(node);
        }
      };
      _collect(element);
      wrapper.appendChild(contents);
      viewport.appendChild(wrapper);
      element.appendChild(viewport);
    }
    function schedule(element) {
      var state = states.get(element);
      if (!state) return;
      rememberProgress(state);
      if (state.enabled) {
        if (!visible(state)) {
          pause(state);
          return;
        }
        if (interacting(state)) pause(state);
      }
      update(element).catch(function(cause) {
        return api.diagnostics.error(api.diagnostics.ERROR_EXTENSION_MOUNT, {
          extension: "overflow-marquee",
          element: element,
          method: "update",
          cause: cause
        });
      });
    }
    function update(element) {
      var state = states.get(element);
      if (!state) return Promise.resolve();
      if (state.pending) {
        state.dirty = true;
        return state.pending;
      }
      state.pending = refresh(state).finally(function() {
        state.pending = null;
        if (state.dirty && states.get(element) === state) {
          state.dirty = false;
          schedule(element);
        }
      });
      return state.pending;
    }
    function refresh(_x2) {
      return _refresh.apply(this, arguments);
    }
    function _refresh() {
      _refresh = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2(state) {
        var element, wrapper, layoutId, alive, limit, eligible, measured, signature, revision, placements, _t;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.n) {
            case 0:
              element = state.element, wrapper = state.wrapper, layoutId = state.layoutId;
              alive = function alive2() {
                return states.get(element) === state;
              };
              rememberProgress(state);
              if (!(state.enabled && !visible(state))) {
                _context2.n = 1;
                break;
              }
              pause(state);
              return _context2.a(2);
            case 1:
              limit = parseOverflowMarqueeLimit(element.getAttribute(attribute));
              if (!(limit != null)) {
                _context2.n = 5;
                break;
              }
              _context2.n = 2;
              return api.waitLayout.read(layoutId, function() {
                return alive() && exceedsLimit(state, limit);
              });
            case 2:
              eligible = _context2.v;
              if (alive()) {
                _context2.n = 3;
                break;
              }
              return _context2.a(2);
            case 3:
              if (eligible) {
                _context2.n = 5;
                break;
              }
              _context2.n = 4;
              return api.waitLayout.update(layoutId, function() {
                if (alive()) enable(state, false);
              });
            case 4:
              return _context2.a(2);
            case 5:
              if (state.enabled) {
                _context2.n = 6;
                break;
              }
              _context2.n = 6;
              return api.waitLayout.update(layoutId, function() {
                if (alive()) enable(state, true);
              });
            case 6:
              if (alive()) {
                _context2.n = 7;
                break;
              }
              return _context2.a(2);
            case 7:
              if (visible(state)) {
                _context2.n = 8;
                break;
              }
              pause(state);
              return _context2.a(2);
            case 8:
              if (interacting(state)) pause(state);
              _context2.n = 9;
              return api.waitLayout.update(layoutId, function() {
                if (alive()) reconcile(state);
              });
            case 9:
              if (alive()) {
                _context2.n = 10;
                break;
              }
              return _context2.a(2);
            case 10:
              _context2.n = 11;
              return api.waitLayout.read(layoutId, function() {
                var style = root.getComputedStyle(element);
                var padding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
                var width = element.clientWidth - padding;
                var content = wrapper.scrollWidth;
                var overflow = content > width + 1;
                var reduced = api.currentPreference("reduced-motion") === "reduced";
                var rawSpeed = Number(style.getPropertyValue("--ae-overflow-marquee-speed").trim());
                var rawDelay = style.getPropertyValue("--ae-overflow-marquee-delay").trim();
                var delayValue = /^(?:\d+(?:\.\d+)?|\.\d+)(ms|s)$/.exec(rawDelay);
                return {
                  width: width,
                  content: content,
                  overflow: overflow,
                  active: overflow && !reduced,
                  fade: element.getAttribute(fadeAttribute) !== "false",
                  speed: Number.isFinite(rawSpeed) && rawSpeed > 0 ? rawSpeed : 30,
                  delay: delayValue ? parseFloat(rawDelay) * (delayValue[1] === "s" ? 1e3 : 1) : 1200,
                  direction: style.direction,
                  text: wrapper.textContent.replace(/\s+/g, " ").trim()
                };
              });
            case 11:
              measured = _context2.v;
              if (!(!alive() || !measured)) {
                _context2.n = 12;
                break;
              }
              return _context2.a(2);
            case 12:
              signature = JSON.stringify(_objectSpread(_objectSpread({}, measured), {}, {
                fade: void 0
              }));
              _context2.n = 13;
              return api.waitLayout.update(layoutId, function() {
                var _root$CSS;
                if (!alive()) return;
                tooltip(state, measured.overflow && desktop !== null && desktop !== void 0 && desktop.matches ? measured.text : null);
                state.viewport.setAttribute(viewportAttribute, measured.overflow && measured.fade && (!measured.active || typeof ((_root$CSS = root.CSS) === null || _root$CSS === void 0 ? void 0 : _root$CSS.registerProperty) === "function") ? "fade" : "");
                if (signature === state.signature) return;
                stop(state);
                state.signature = signature;
                state.measured = measured;
                state.placements = null;
                state.phase = "wait";
                state.remaining = measured.delay;
                state.x = 0;
                wrapper.style.transition = "none";
                wrapper.setAttribute(contentAttribute, "top-left:top-left");
                wrapper.style.setProperty("--ae-anchor-x", "0px");
                state.viewport.style.transition = "none";
                state.viewport.style.setProperty(offsetProperty, "0px");
                state.viewport.style.setProperty("--ae-overflow-marquee-distance", "".concat(Math.max(0, measured.content - measured.width), "px"));
                state.viewport.setAttribute("dir", measured.direction);
                element.toggleAttribute ? element.toggleAttribute(activeAttribute, measured.active) : measured.active ? element.setAttribute(activeAttribute, "") : element.removeAttribute(activeAttribute);
              });
            case 13:
              if (!(!alive() || signature !== state.signature || !measured.active || state.timer !== null || state.running)) {
                _context2.n = 14;
                break;
              }
              return _context2.a(2);
            case 14:
              if (canRun(state)) {
                _context2.n = 15;
                break;
              }
              pause(state);
              return _context2.a(2);
            case 15:
              revision = state.revision;
              _t = state.placements;
              if (_t) {
                _context2.n = 17;
                break;
              }
              _context2.n = 16;
              return api.waitLayout.read(layoutId, function() {
                var start = anchor.measure(wrapper, false);
                var end = anchor.measure(wrapper, true);
                if (!(start !== null && start !== void 0 && start.valid) || !(end !== null && end !== void 0 && end.valid)) return null;
                var distance = Math.max(0, start.selected.x - end.selected.x);
                var rtl = measured.direction === "rtl";
                var placement = function placement2(base, x) {
                  return _objectSpread(_objectSpread({}, base), {}, {
                    selected: _objectSpread(_objectSpread({}, base.selected), {}, {
                      x: x,
                      y: 0
                    })
                  });
                };
                return {
                  start: placement(rtl ? end : start, 0),
                  end: placement(rtl ? start : end, rtl ? distance : -distance),
                  distance: distance
                };
              });
            case 16:
              _t = _context2.v;
            case 17:
              placements = _t;
              if (!(!alive() || revision !== state.revision || !placements)) {
                _context2.n = 18;
                break;
              }
              return _context2.a(2);
            case 18:
              _context2.n = 19;
              return api.waitLayout.update(layoutId, function() {
                if (!alive() || revision !== state.revision) return;
                state.placements = placements;
                state.viewport.style.setProperty("--ae-overflow-marquee-distance", "".concat(placements.distance, "px"));
                if (!canRun(state)) {
                  pause(state);
                  return;
                }
                state.paused = false;
                anchor.place(wrapper, at(state, state.x));
                if (state.phase === "travel") cycle(state);
                else wait(state);
              });
            case 19:
              return _context2.a(2);
          }
        }, _callee2);
      }));
      return _refresh.apply(this, arguments);
    }
    function at(state, x) {
      var base = state.placements.start;
      return _objectSpread(_objectSpread({}, base), {}, {
        selected: _objectSpread(_objectSpread({}, base.selected), {}, {
          x: x
        })
      });
    }
    function freezeFade(state) {
      state.viewport.style.transition = "none";
      state.viewport.style.setProperty(offsetProperty, "".concat(Math.abs(state.x), "px"));
    }
    function wait(state) {
      var revision = state.revision;
      state.deadline = now() + state.remaining;
      state.timer = root.setTimeout(function() {
        if (revision === state.revision && states.get(state.element) === state) cycle(state);
      }, state.remaining);
    }
    function now() {
      return root.performance.now();
    }
    function rememberProgress(state) {
      var _state$animation;
      if (!state.running || state.started === void 0) return;
      var time = (_state$animation = state.animation) === null || _state$animation === void 0 ? void 0 : _state$animation.currentTime;
      if (time != null) state.elapsed = Number(time);
      else if (!state.controlled) state.elapsed = now() - state.started;
      var progress = state.duration > 0 ? Math.min(1, (state.elapsed || 0) / state.duration) : 1;
      state.x = state.from + (state.placements.end.selected.x - state.from) * progress;
    }
    function pause(state) {
      if (state.paused) return;
      rememberProgress(state);
      if (state.timer !== null) state.remaining = Math.max(0, state.deadline - now());
      stop(state);
      state.paused = true;
      state.wrapper.style.transition = "none";
      freezeFade(state);
      if (state.placements) anchor.place(state.wrapper, at(state, state.x));
    }
    function tooltip(state, text) {
      var element = state.element;
      if (state.ownedTitle !== null && element.getAttribute("title") !== state.ownedTitle) state.ownedTitle = null;
      if (!text) {
        if (state.ownedTitle !== null) element.removeAttribute("title");
        state.ownedTitle = null;
      } else if (state.ownedTitle !== null || !element.hasAttribute("title")) {
        if (element.getAttribute("title") !== text) element.setAttribute("title", text);
        state.ownedTitle = text;
      }
    }
    function cycle(_x3) {
      return _cycle.apply(this, arguments);
    }
    function _cycle() {
      _cycle = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee3(state) {
        var measured, placements, revision, current, duration, completion, result, _t2;
        return _regenerator().w(function(_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              measured = state.measured, placements = state.placements;
              revision = state.revision;
              current = function current2() {
                return states.get(state.element) === state && revision === state.revision;
              };
              state.timer = null;
              if (current()) {
                _context3.n = 1;
                break;
              }
              return _context3.a(2);
            case 1:
              state.remaining = 0;
              if (canRun(state)) {
                _context3.n = 2;
                break;
              }
              pause(state);
              return _context3.a(2);
            case 2:
              state.running = true;
              state.started = void 0;
              _context3.p = 3;
              if (!(state.phase === "end")) {
                _context3.n = 5;
                break;
              }
              _context3.n = 4;
              return api.waitLayout.update(state.cycleId, function() {
                if (!current()) return;
                state.wrapper.style.transition = "none";
                state.wrapper.setAttribute(contentAttribute, "top-left:top-left");
                state.x = 0;
                freezeFade(state);
                anchor.place(state.wrapper, placements.start);
                state.phase = "wait";
                state.running = false;
                state.remaining = measured.delay;
                if (canRun(state)) wait(state);
                else pause(state);
              });
            case 4:
              return _context3.a(2);
            case 5:
              state.phase = "travel";
              duration = Math.abs(placements.end.selected.x - state.x) / measured.speed * 1e3;
              _context3.n = 6;
              return api.waitLayout.read(state.cycleId, function() {
                root.getComputedStyle(state.viewport).getPropertyValue(offsetProperty);
                return root.getComputedStyle(state.wrapper).transform;
              });
            case 6:
              if (current()) {
                _context3.n = 7;
                break;
              }
              return _context3.a(2);
            case 7:
              if (canRun(state)) {
                _context3.n = 8;
                break;
              }
              pause(state);
              return _context3.a(2);
            case 8:
              state.from = state.x;
              state.duration = duration;
              state.elapsed = 0;
              state.animation = null;
              state.controlled = api.motion.supported(state.wrapper);
              state.started = now();
              completion = api.motion.run(state.viewport, {
                id: state.motionId,
                subtree: true,
                nativeDuration: duration,
                maxFPS: api.layoutMaxFPS(state.element),
                abort: function abort() {
                  rememberProgress(state);
                  return !current();
                },
                apply: function apply() {
                  state.wrapper.style.transition = "transform ".concat(duration, "ms linear");
                  state.viewport.style.transition = "".concat(offsetProperty, " ").concat(duration, "ms linear");
                  state.viewport.style.setProperty(offsetProperty, "".concat(placements.distance, "px"));
                  state.wrapper.setAttribute(contentAttribute, "bottom-right:bottom-right");
                  anchor.place(state.wrapper, placements.end);
                }
              });
              _context3.n = 9;
              return api.waitLayout.read(state.cycleId, function() {
                var _state$wrapper$getAni, _state$wrapper;
                if (current()) state.animation = ((_state$wrapper$getAni = (_state$wrapper = state.wrapper).getAnimations) === null || _state$wrapper$getAni === void 0 ? void 0 : _state$wrapper$getAni.call(_state$wrapper).find(function(animation) {
                  return animation.transitionProperty === "transform";
                })) || null;
              });
            case 9:
              _context3.n = 10;
              return completion;
            case 10:
              result = _context3.v;
              if (!(!current() || result.status !== "completed")) {
                _context3.n = 11;
                break;
              }
              return _context3.a(2);
            case 11:
              _context3.n = 12;
              return api.waitLayout.update(state.cycleId, function() {
                if (!current()) return;
                state.wrapper.style.transition = "none";
                anchor.place(state.wrapper, placements.end);
                state.running = false;
                state.x = placements.end.selected.x;
                freezeFade(state);
                state.animation = null;
                state.phase = "end";
                state.remaining = measured.delay;
                if (canRun(state)) wait(state);
                else pause(state);
              });
            case 12:
              _context3.n = 14;
              break;
            case 13:
              _context3.p = 13;
              _t2 = _context3.v;
              if (current()) api.diagnostics.error(api.diagnostics.ERROR_EXTENSION_TRANSITION, {
                extension: "overflow-marquee",
                element: state.element,
                cause: _t2
              });
            case 14:
              _context3.p = 14;
              if (current()) state.running = false;
              return _context3.f(14);
            case 15:
              return _context3.a(2);
          }
        }, _callee3, null, [[3, 13, 14, 15]]);
      }));
      return _cycle.apply(this, arguments);
    }
    function stop(state) {
      state.revision++;
      if (state.timer !== null) root.clearTimeout(state.timer);
      state.timer = null;
      state.running = false;
      api.motion.cancel(state.motionId);
      api.waitLayout.cancel(state.cycleId);
      state.animation = null;
    }
    function unmount(_x4) {
      return _unmount.apply(this, arguments);
    }
    function _unmount() {
      _unmount = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee4(element) {
        var _state$resize3, _state$intersection3;
        var state, _i4, _arr3, name, _observer, _root$document$fonts2, _root$document$fonts3, _i5, _arr4, _name;
        return _regenerator().w(function(_context4) {
          while (1) switch (_context4.n) {
            case 0:
              state = states.get(element);
              if (state) {
                _context4.n = 1;
                break;
              }
              return _context4.a(2);
            case 1:
              states.delete(element);
              stop(state);
              api.waitLayout.cancel(state.layoutId);
              (_state$resize3 = state.resize) === null || _state$resize3 === void 0 || _state$resize3.disconnect();
              (_state$intersection3 = state.intersection) === null || _state$intersection3 === void 0 || _state$intersection3.disconnect();
              for (_i4 = 0, _arr3 = ["mouseenter", "mouseleave", "focusin", "focusout"]; _i4 < _arr3.length; _i4++) {
                name = _arr3[_i4];
                element.removeEventListener(name, state.onInteraction);
              }
              _context4.n = 2;
              return anchor.unmount(state.wrapper);
            case 2:
              unwrap(state);
              tooltip(state, null);
              state.memory.restore();
              if (!states.size) {
                (_observer = observer) === null || _observer === void 0 || _observer.disconnect();
                observer = null;
                root.document.removeEventListener("visibilitychange", refreshAll);
                for (_i5 = 0, _arr4 = ["transitionend", "transitioncancel", "animationstart", "animationend", "animationcancel"]; _i5 < _arr4.length; _i5++) {
                  _name = _arr4[_i5];
                  root.document.removeEventListener(_name, motionChanged, true);
                }
                root.removeEventListener("resize", refreshAll);
                root.removeEventListener("scroll", refreshAll, true);
                (_root$document$fonts2 = root.document.fonts) === null || _root$document$fonts2 === void 0 || (_root$document$fonts3 = _root$document$fonts2.removeEventListener) === null || _root$document$fonts3 === void 0 || _root$document$fonts3.call(_root$document$fonts2, "loadingdone", refreshAll);
                listenMedia(false);
              }
            case 3:
              return _context4.a(2);
          }
        }, _callee4);
      }));
      return _unmount.apply(this, arguments);
    }
    function destroy() {
      return _destroy.apply(this, arguments);
    }
    function _destroy() {
      _destroy = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee5() {
        var _i6, _Array$from2, _element;
        return _regenerator().w(function(_context5) {
          while (1) switch (_context5.n) {
            case 0:
              _i6 = 0, _Array$from2 = Array.from(states.keys());
            case 1:
              if (!(_i6 < _Array$from2.length)) {
                _context5.n = 3;
                break;
              }
              _element = _Array$from2[_i6];
              _context5.n = 2;
              return unmount(_element);
            case 2:
              _i6++;
              _context5.n = 1;
              break;
            case 3:
              return _context5.a(2);
          }
        }, _callee5);
      }));
      return _destroy.apply(this, arguments);
    }
  }

  // src/src/aellux.ext.overflow-marquee.js
  function _typeof2(o) {
    "@babel/helpers - typeof";
    return _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof2(o);
  }
  function _regenerator2() {
    /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
    var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag";
    function i(r2, n2, o2, i2) {
      var c2 = n2 && n2.prototype instanceof Generator ? n2 : Generator, u2 = Object.create(c2.prototype);
      return _regeneratorDefine22(u2, "_invoke", (function(r3, n3, o3) {
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
    var c = [][n] ? t(t([][n]())) : (_regeneratorDefine22(t = {}, n, function() {
      return this;
    }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
    function f(e2) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e2, GeneratorFunctionPrototype) : (e2.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine22(e2, o, "GeneratorFunction")), e2.prototype = Object.create(u), e2;
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine22(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine22(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine22(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine22(u), _regeneratorDefine22(u, o, "Generator"), _regeneratorDefine22(u, n, function() {
      return this;
    }), _regeneratorDefine22(u, "toString", function() {
      return "[object Generator]";
    }), (_regenerator2 = function _regenerator3() {
      return { w: i, m: f };
    })();
  }
  function _regeneratorDefine22(e, r, n, t) {
    var i = Object.defineProperty;
    try {
      i({}, "", {});
    } catch (e2) {
      i = 0;
    }
    _regeneratorDefine22 = function _regeneratorDefine(e2, r2, n2, t2) {
      function o(r3, n3) {
        _regeneratorDefine22(e2, r3, function(e3) {
          return this._invoke(r3, n3, e3);
        });
      }
      r2 ? i ? i(e2, r2, { value: n2, enumerable: !t2, configurable: !t2, writable: !t2 }) : e2[r2] = n2 : (o("next", 0), o("throw", 1), o("return", 2));
    }, _regeneratorDefine22(e, r, n, t);
  }
  function ownKeys2(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r2) {
        return Object.getOwnPropertyDescriptor(e, r2).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys2(Object(t), true).forEach(function(r2) {
        _defineProperty2(e, r2, t[r2]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys2(Object(t)).forEach(function(r2) {
        Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
      });
    }
    return e;
  }
  function _defineProperty2(e, r, t) {
    return (r = _toPropertyKey2(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
  }
  function _toPropertyKey2(t) {
    var i = _toPrimitive2(t, "string");
    return "symbol" == _typeof2(i) ? i : i + "";
  }
  function _toPrimitive2(t, r) {
    if ("object" != _typeof2(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof2(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function asyncGeneratorStep2(n, t, e, r, o, a, c) {
    try {
      var i = n[a](c), u = i.value;
    } catch (n2) {
      return void e(n2);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
  }
  function _asyncToGenerator2(n) {
    return function() {
      var t = this, e = arguments;
      return new Promise(function(r, o) {
        var a = n.apply(t, e);
        function _next(n2) {
          asyncGeneratorStep2(a, r, o, _next, _throw, "next", n2);
        }
        function _throw(n2) {
          asyncGeneratorStep2(a, r, o, _next, _throw, "throw", n2);
        }
        _next(void 0);
      });
    };
  }
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var api = root.AelluxJs;
    var extensionName = "overflow-marquee";
    if (!api) throw new Error("[aellux.js] Load the boot script before the overflow-marquee extension.");
    var marquee = null, placements = null;
    api.extAttach(extensionName, {
      init: init,
      destroy: destroy
    });
    function init() {
      return _init.apply(this, arguments);
    }
    function _init() {
      _init = _asyncToGenerator2(/* @__PURE__ */ _regenerator2().m(function _callee() {
        var anchor;
        return _regenerator2().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              if (!api.registry.ext.anchor) api.ext("anchor");
              _context.n = 1;
              return api.wait("anchor");
            case 1:
              anchor = _context.v;
              if (anchor !== null && anchor !== void 0 && anchor.createPlacementMap) {
                _context.n = 2;
                break;
              }
              throw new Error("[aellux.js] Overflow Marquee requires Anchor's placement map.");
            case 2:
              placements = anchor.createPlacementMap();
              marquee = createOverflowMarquee(root, api, _objectSpread2(_objectSpread2({}, placements), {}, {
                measure: function measure(element, end) {
                  return placements.measure(element, end ? "bottom-right:bottom-right" : "top-left:top-left");
                }
              }));
              api.registerCssProperty({
                name: "--ae-overflow-marquee-speed",
                syntax: "<number>",
                initialValue: "30"
              }, {
                name: "--ae-overflow-marquee-delay",
                syntax: "<time>",
                initialValue: "1200ms"
              }, {
                name: "--ae-overflow-marquee-fade-size",
                syntax: "<length>",
                initialValue: "16px"
              }, {
                name: "--ae-overflow-marquee-offset",
                syntax: "<length>",
                initialValue: "0px",
                inherits: false
              });
              api.mountManager.add({
                extensionName: extensionName,
                selector: marquee.selector,
                mount: marquee.mount,
                unmount: marquee.unmount,
                update: marquee.update
              });
            case 3:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _init.apply(this, arguments);
    }
    function destroy() {
      return _destroy.apply(this, arguments);
    }
    function _destroy() {
      _destroy = _asyncToGenerator2(/* @__PURE__ */ _regenerator2().m(function _callee2() {
        var _marquee, _placements;
        return _regenerator2().w(function(_context2) {
          while (1) switch (_context2.n) {
            case 0:
              _context2.n = 1;
              return (_marquee = marquee) === null || _marquee === void 0 ? void 0 : _marquee.destroy();
            case 1:
              (_placements = placements) === null || _placements === void 0 || _placements.destroy();
              api.mountManager.remove({
                extensionName: extensionName
              });
              marquee = placements = null;
            case 2:
              return _context2.a(2);
          }
        }, _callee2);
      }));
      return _destroy.apply(this, arguments);
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.overflow-marquee.legacy.js.map
