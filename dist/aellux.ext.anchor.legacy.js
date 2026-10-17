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
    var extensionName = "anchor";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    var ORIGIN_X = "--ae-anchor-origin-x", ORIGIN_Y = "--ae-anchor-origin-y", ANCHOR_OPACITY = "--anchor-opacity";
    var attribute = AelluxJs.attr(extensionName);
    var presentAttribute = AelluxJs.attr("present");
    var targetAttribute = AelluxJs.attr("anchor-target");
    var fpsAttribute = AelluxJs.attr("anchor-fps");
    var layoutEvent = AelluxJs.eventName("Layout");
    var anchoredClass = AelluxJs.className("anchored");
    var baseProperties = ["position", "left", "top", "transform", "transform-origin"];
    var ownedProperties = [].concat(baseProperties, ["--ae-anchor-x", "--ae-anchor-y", ORIGIN_X, ORIGIN_Y, ANCHOR_OPACITY]);
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
    var DEFAULT_FPS = 30;
    var DEFAULT_INTERVAL_MS = Math.round(1e3 / DEFAULT_FPS);
    var anchors = /* @__PURE__ */ new Map();
    var elementMemories = /* @__PURE__ */ new WeakMap();
    var updateTimeout = null;
    var layoutUpdateTimeout = null;
    var layoutUpdateUntil = 0;
    var lastUpdateTime = -DEFAULT_INTERVAL_MS;
    function updateIntervalMs() {
      var interval = Infinity;
      var _iterator = _createForOfIteratorHelper(anchors.keys()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var element = _step.value;
          var value = element.getAttribute(fpsAttribute);
          var fps = value === null || !value.trim() ? NaN : Number(value);
          var elementInterval = Number.isFinite(fps) && fps > 0 ? Math.max(1, Math.round(1e3 / fps)) : DEFAULT_INTERVAL_MS;
          interval = Math.min(interval, elementInterval);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return Number.isFinite(interval) ? interval : DEFAULT_INTERVAL_MS;
    }
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy
    });
    function init() {
      AelluxJs.registerCssProperty({
        name: "--ae-anchor-x",
        syntax: "<length>",
        initialValue: "0px"
      }, {
        name: "--ae-anchor-y",
        syntax: "<length>",
        initialValue: "0px"
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
        update: updateAnchor
      });
    }
    function destroy() {
      return _destroy.apply(this, arguments);
    }
    function _destroy() {
      _destroy = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee() {
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              if (updateTimeout !== null) clearTimeout(updateTimeout);
              if (layoutUpdateTimeout !== null) clearTimeout(layoutUpdateTimeout);
              updateTimeout = null;
              layoutUpdateTimeout = null;
              layoutUpdateUntil = 0;
              lastUpdateTime = -DEFAULT_INTERVAL_MS;
              _context.n = 1;
              return Promise.all(Array.from(anchors.keys(), unmountAnchor));
            case 1:
              AelluxJs.mountManager.remove({
                extensionName: extensionName
              });
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
        reference: null,
        layoutListener: function layoutListener(event) {
          return scheduleLayoutUpdate(event);
        },
        observer: null,
        intersectionObserver: null
      };
      anchors.set(element, state);
      if (anchors.size === 1) {
        AelluxJs.onTarget(root, "$scroll", scheduleUpdate, {
          capture: true,
          passive: true
        });
        AelluxJs.onTarget(root, "$resize", scheduleUpdate);
      }
      if (typeof root.ResizeObserver === "function") {
        state.observer = new root.ResizeObserver(scheduleUpdate);
      }
      if (typeof root.IntersectionObserver === "function") {
        state.intersectionObserver = new root.IntersectionObserver(scheduleUpdate);
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
              if (state.reference) AelluxJs.offTarget(state.reference, layoutEvent, state.layoutListener);
              if (state.observer) state.observer.disconnect();
              if (state.intersectionObserver) state.intersectionObserver.disconnect();
              anchors.delete(element);
              if (!anchors.size) {
                AelluxJs.offTarget(root, "$scroll", scheduleUpdate, true);
                AelluxJs.offTarget(root, "$resize", scheduleUpdate);
                if (updateTimeout !== null) clearTimeout(updateTimeout);
                if (layoutUpdateTimeout !== null) clearTimeout(layoutUpdateTimeout);
                updateTimeout = null;
                layoutUpdateTimeout = null;
                layoutUpdateUntil = 0;
                lastUpdateTime = -DEFAULT_INTERVAL_MS;
              }
              _context2.n = 2;
              return AelluxJs.waitLayout.update(deactivate, [element, state, memory]);
            case 2:
              return _context2.a(2);
          }
        }, _callee2);
      }));
      return _unmountAnchor.apply(this, arguments);
    }
    function scheduleUpdate() {
      if (!anchors.size) return;
      var interval = updateIntervalMs();
      var elapsed = now() - lastUpdateTime;
      if (elapsed >= interval) {
        if (updateTimeout !== null) clearTimeout(updateTimeout);
        updateTimeout = null;
        flushUpdate();
        return;
      }
      if (updateTimeout !== null) return;
      updateTimeout = setTimeout(flushUpdate, interval - elapsed);
    }
    function scheduleLayoutUpdate(event) {
      var interval = updateIntervalMs();
      var durationMs = Number(event && event.detail ? event.detail.durationMs : NaN);
      if (!Number.isFinite(durationMs) || durationMs < 0) {
        scheduleUpdate();
        return;
      }
      if (durationMs === 0) {
        if (layoutUpdateTimeout === null) layoutUpdateTimeout = setTimeout(checkLayoutUpdate, interval);
        return;
      }
      scheduleUpdate();
      layoutUpdateUntil = Math.max(layoutUpdateUntil, now() + durationMs);
      if (layoutUpdateTimeout !== null) return;
      layoutUpdateTimeout = setTimeout(checkLayoutUpdate, Math.min(interval, durationMs));
    }
    function checkLayoutUpdate() {
      layoutUpdateTimeout = null;
      scheduleUpdate();
      var remaining = layoutUpdateUntil - now();
      if (remaining > 0) {
        layoutUpdateTimeout = setTimeout(checkLayoutUpdate, Math.min(updateIntervalMs(), remaining));
      } else {
        layoutUpdateUntil = 0;
      }
    }
    function flushUpdate() {
      updateTimeout = null;
      lastUpdateTime = now();
      var _iterator2 = _createForOfIteratorHelper(anchors.keys()), _step2;
      try {
        var _loop = function _loop2() {
          var element = _step2.value;
          updateAnchor(element).catch(function(cause) {
            AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT, {
              cause: cause,
              extension: extensionName,
              element: element,
              method: "update"
            });
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
    }
    function now() {
      return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
    }
    function updateAnchor(_x2) {
      return _updateAnchor.apply(this, arguments);
    }
    function _updateAnchor() {
      _updateAnchor = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee3(element) {
        var state, revision, current, targetValue, useReference, target, candidates, placement;
        return _regenerator().w(function(_context3) {
          while (1) switch (_context3.n) {
            case 0:
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
              targetValue = element.getAttribute(targetAttribute);
              useReference = !targetValue || !targetValue.trim();
              target = useReference ? null : resolveElement(targetValue);
              candidates = parseCandidates(element.getAttribute(attribute));
              if (!(!target && !useReference || !candidates.length)) {
                _context3.n = 3;
                break;
              }
              _context3.n = 2;
              return AelluxJs.waitLayout.update(function() {
                if (current()) deactivate(element, state);
              });
            case 2:
              return _context3.a(2);
            case 3:
              _context3.n = 4;
              return AelluxJs.waitLayout.read(function() {
                return current() ? readPlacement(element, target, candidates, state.active) : null;
              });
            case 4:
              placement = _context3.v;
              if (!(!current() || !placement)) {
                _context3.n = 5;
                break;
              }
              return _context3.a(2);
            case 5:
              if (!placement.hidden) {
                _context3.n = 7;
                break;
              }
              _context3.n = 6;
              return AelluxJs.waitLayout.update(function() {
                if (current()) hideForTarget(element, state, placement);
              });
            case 6:
              return _context3.a(2);
            case 7:
              if (placement.valid) {
                _context3.n = 9;
                break;
              }
              _context3.n = 8;
              return AelluxJs.waitLayout.update(function() {
                if (current()) invalidContext(element, state, placement);
              });
            case 8:
              return _context3.a(2);
            case 9:
              if (state.active) {
                _context3.n = 17;
                break;
              }
              _context3.n = 10;
              return AelluxJs.waitLayout.update(function() {
                if (!current()) return;
                applyBaseStyles(element);
                state.active = true;
              });
            case 10:
              if (current()) {
                _context3.n = 11;
                break;
              }
              return _context3.a(2);
            case 11:
              _context3.n = 12;
              return AelluxJs.waitLayout.read(function() {
                return current() ? readPlacement(element, useReference ? null : target, candidates, true) : null;
              });
            case 12:
              placement = _context3.v;
              if (!(!current() || !placement)) {
                _context3.n = 13;
                break;
              }
              return _context3.a(2);
            case 13:
              if (!placement.hidden) {
                _context3.n = 15;
                break;
              }
              _context3.n = 14;
              return AelluxJs.waitLayout.update(function() {
                if (current()) hideForTarget(element, state, placement);
              });
            case 14:
              return _context3.a(2);
            case 15:
              if (placement.valid) {
                _context3.n = 17;
                break;
              }
              _context3.n = 16;
              return AelluxJs.waitLayout.update(function() {
                if (current()) invalidContext(element, state, placement);
              });
            case 16:
              return _context3.a(2);
            case 17:
              _context3.n = 18;
              return AelluxJs.waitLayout.update(function() {
                if (!current()) return;
                state.invalidContext = false;
                observe(state, element, placement.target, placement.reference);
                var selected = placement.selected;
                element.style.setProperty("--ae-anchor-x", "".concat(selected.x, "px"));
                element.style.setProperty("--ae-anchor-y", "".concat(selected.y, "px"));
                element.style.setProperty(ORIGIN_X, "".concat(selected.self[0] * 100, "%"));
                element.style.setProperty(ORIGIN_Y, "".concat(selected.self[1] * 100, "%"));
                element.style.setProperty(ANCHOR_OPACITY, placement.opacity);
                var _iterator6 = _createForOfIteratorHelper(baseProperties), _step6;
                try {
                  for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
                    var name = _step6.value;
                    element.style.removeProperty(name);
                  }
                } catch (err) {
                  _iterator6.e(err);
                } finally {
                  _iterator6.f();
                }
                element.classList.add(anchoredClass);
              });
            case 18:
              return _context3.a(2);
          }
        }, _callee3);
      }));
      return _updateAnchor.apply(this, arguments);
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
      if (!measure) return {
        valid: true,
        target: target
      };
      var referenceRect = reference.getBoundingClientRect();
      var scaleX = reference.offsetWidth ? referenceRect.width / reference.offsetWidth : 1;
      var scaleY = reference.offsetHeight ? referenceRect.height / reference.offsetHeight : 1;
      var targetRect = toReference(target.getBoundingClientRect(), reference, referenceRect, scaleX, scaleY);
      var selfRect = element.getBoundingClientRect();
      var selfWidth = selfRect.width / scaleX;
      var selfHeight = selfRect.height / scaleY;
      var boundaryRect = toReference({
        left: 0,
        top: 0,
        width: root.innerWidth,
        height: root.innerHeight
      }, reference, referenceRect, scaleX, scaleY);
      var selected = null;
      var _iterator3 = _createForOfIteratorHelper(candidates), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var candidate = _step3.value;
          var x = targetRect.left + targetRect.width * candidate.target[0] - selfWidth * candidate.self[0];
          var y = targetRect.top + targetRect.height * candidate.target[1] - selfHeight * candidate.self[1];
          var result = {
            x: x,
            y: y,
            self: candidate.self
          };
          if (!selected) selected = result;
          if (x >= boundaryRect.left && y >= boundaryRect.top && x + selfWidth <= boundaryRect.left + boundaryRect.width && y + selfHeight <= boundaryRect.top + boundaryRect.height) {
            selected = result;
            break;
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      var present = target.closest("[".concat(presentAttribute, "]"));
      var opacity = present ? root.getComputedStyle(present).opacity : "1";
      return {
        valid: true,
        target: target,
        reference: reference,
        selected: selected,
        opacity: opacity
      };
    }
    function isInvisible(element) {
      var visibility = root.getComputedStyle(element).visibility;
      if (visibility === "hidden" || visibility === "collapse") return true;
      for (var current = element; current && current.nodeType === 1; current = current.parentElement) {
        var style = root.getComputedStyle(current);
        if (current.hidden || style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) return true;
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
      var _iterator4 = _createForOfIteratorHelper(/* @__PURE__ */ new Set([element, target, reference])), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var observed = _step4.value;
          if (!observed) continue;
          if (state.observer) state.observer.observe(observed);
          if (state.intersectionObserver) state.intersectionObserver.observe(observed);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
    function listenForLayout(state, reference) {
      if (state.reference === reference) return;
      if (state.reference) AelluxJs.offTarget(state.reference, layoutEvent, state.layoutListener);
      state.reference = reference;
      if (reference) AelluxJs.onTarget(reference, layoutEvent, state.layoutListener);
    }
    function applyBaseStyles(element) {
      element.style.setProperty("position", "absolute");
      element.style.setProperty("left", "0px");
      element.style.setProperty("top", "0px");
      element.style.setProperty("transform", "translate3d(var(--ae-anchor-x, 0px), var(--ae-anchor-y, 0px), 0)");
      element.style.setProperty("transform-origin", "var(--ae-anchor-origin-x, 50%) var(--ae-anchor-origin-y, 0%)");
    }
    function deactivate(element, state) {
      var memory = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : elementMemories.get(element);
      if (state.reference) AelluxJs.offTarget(state.reference, layoutEvent, state.layoutListener);
      if (state.observer) state.observer.disconnect();
      if (state.intersectionObserver) state.intersectionObserver.disconnect();
      state.target = state.reference = null;
      element.classList.remove(anchoredClass);
      if (state.active && memory) memory.restore();
      state.active = false;
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
      var _iterator5 = _createForOfIteratorHelper((value || "").split(",")), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var token = _step5.value;
          var pair = token.trim().toLowerCase().split(":");
          if (pair.length !== 2 || !pivots[pair[0].trim()] || !pivots[pair[1].trim()]) continue;
          result.push({
            target: pivots[pair[0].trim()],
            self: pivots[pair[1].trim()]
          });
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
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
