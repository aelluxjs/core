(function() {
  // src/src/aellux.ext.present.js
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
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    var AelluxJs = root.AelluxJs;
    var extensionName = "present";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    var attr = {
      present: AelluxJs.attr(extensionName),
      autoUnpop: AelluxJs.attr("auto-unpop"),
      presentMotion: AelluxJs.attr("present-motion"),
      unpopOnOutside: AelluxJs.attr("unpop-on-outside"),
      trigger: AelluxJs.attr("trigger"),
      //toggle,pop,unpop
      dismiss: AelluxJs.attr("dismiss"),
      //selector
      target: AelluxJs.attr("target"),
      //selector,
      lowHardware: AelluxJs.attr("low-hardware")
    };
    var className = {
      pop: AelluxJs.className("pop"),
      popping: AelluxJs.className("popping"),
      unpopping: AelluxJs.className("unpopping"),
      willChange: AelluxJs.className("will-change")
    };
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      pop: pop,
      unpop: unpop,
      toggle: toggle,
      trigger: trigger
    });
    var POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", TRANSITION_PREPARE_TIME = 100, ARIA_EXPANDED = "aria-expanded", ARIA_CONTROLS = "aria-controls", DEFAULT_PRESENT = "opacity transform height width";
    var presentElements = /* @__PURE__ */ new Map();
    var triggerElementsSet = /* @__PURE__ */ new Set();
    var triggerTargets = /* @__PURE__ */ new Map();
    function init(options) {
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attr.present, "]"),
        mount: mountPresentContainer,
        unmount: unmountPresentContainer,
        controllers: ["pop", "unpop", "trigger", "toggle"]
      });
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat([attr.trigger, attr.dismiss, attr.target].join("],["), "]"),
        mount: mountTriggerElement,
        unmount: unmountTriggerElement
      });
      document.addEventListener("click", OnClick);
    }
    function destroy() {
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
      document.removeEventListener("click", OnClick);
      var _iterator = _createForOfIteratorHelper(triggerElementsSet), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var triggerElement = _step.value;
          unmountTriggerElement(triggerElement);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var _iterator2 = _createForOfIteratorHelper(presentElements.keys()), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var element = _step2.value;
          unmountPresentContainer(element);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      triggerTargets.clear();
    }
    function mountPresentContainer(element) {
      if (presentElements.has(element)) return;
      if (!(element.getAttribute(attr.present) || "").trim()) {
        element.setAttribute(attr.present, DEFAULT_PRESENT);
      }
      if (element.hasAttribute(attr.presentMotion)) {
        element.removeAttribute(attr.presentMotion);
      }
      var presentMotion = element.querySelector(":scope>[".concat(attr.presentMotion, "]"));
      var generatedMotion = false;
      if (!presentMotion) {
        AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_PRESENT_MOTION_MISSING, {
          extension: extensionName,
          element: element
        });
        presentMotion = document.createElement("div");
        presentMotion.setAttribute(attr.presentMotion, "");
        while (element.firstChild) {
          presentMotion.appendChild(element.firstChild);
        }
        element.appendChild(presentMotion);
        generatedMotion = true;
      }
      var presentController = {
        generatedMotion: generatedMotion,
        presentMotion: presentMotion,
        interruptTransition: null,
        direction: null,
        timeout: null,
        classList: element.classList,
        triggers: /* @__PURE__ */ new Set(),
        setAriaExpanded: function setAriaExpanded(value) {
          element.setAttribute(ARIA_EXPANDED, value);
          this.triggers.forEach(updateTriggerAriaExpanded);
        },
        stop: function stop() {
          var pop2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
          for (var _i = 0, _Object$values = Object.values(className); _i < _Object$values.length; _i++) {
            var c = _Object$values[_i];
            if (pop2 || c !== className.pop) {
              this.classList.remove(c);
            }
          }
          if (this.interruptTransition !== null && typeof this.interruptTransition === "function") {
            this.interruptTransition(AelluxJs.diagnostics.create(AelluxJs.diagnostics.WARN_INTERRUPTION, {
              extensionName: extensionName
            }));
            this.interruptTransition = null;
          }
          if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }
        }
      };
      presentController.setAriaExpanded(element.hidden ? "false" : "true");
      if (!element.hidden) {
        presentController.classList.add(className.pop);
      }
      presentElements.set(element, presentController);
      var _iterator3 = _createForOfIteratorHelper(triggerElementsSet), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var triggerElement = _step3.value;
          refreshTriggerTargets(triggerElement);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      var _iterator4 = _createForOfIteratorHelper(triggerTargets), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var _step4$value = _slicedToArray(_step4.value, 2), _triggerElement = _step4$value[0], targets = _step4$value[1];
          if (targets.has(element)) {
            presentController.triggers.add(_triggerElement);
            updateTriggerAriaExpanded(_triggerElement);
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      autoUnpopSchedule(element, presentController);
    }
    function unmountPresentContainer(element) {
      if (!presentElements.has(element)) return;
      var controller = presentElements.get(element);
      controller.stop();
      presentElements.delete(element);
      controller.triggers.forEach(updateTriggerAriaExpanded);
      if (controller.generatedMotion && controller.presentMotion.parentElement === element) {
        while (controller.presentMotion.firstChild) {
          element.insertBefore(controller.presentMotion.firstChild, controller.presentMotion);
        }
        controller.presentMotion.remove();
      }
    }
    function mountTriggerElement(triggerElement) {
      if (triggerElementsSet.has(triggerElement)) return;
      triggerElementsSet.add(triggerElement);
      refreshTriggerTargets(triggerElement);
    }
    function unmountTriggerElement(triggerElement) {
      if (!triggerElementsSet.has(triggerElement)) return;
      var targets = triggerTargets.get(triggerElement);
      if (targets) {
        var _iterator5 = _createForOfIteratorHelper(targets), _step5;
        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
            var _presentElements$get;
            var target = _step5.value;
            (_presentElements$get = presentElements.get(target)) === null || _presentElements$get === void 0 || _presentElements$get.triggers.delete(triggerElement);
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
        triggerTargets.delete(triggerElement);
      }
      triggerElementsSet.delete(triggerElement);
    }
    function refreshTriggerTargets(triggerElement) {
      var _AelluxJs$mountManage, _AelluxJs$mountManage2;
      var targetIds = /* @__PURE__ */ new Set();
      var previousTargets = triggerTargets.get(triggerElement);
      var targets = /* @__PURE__ */ new Set();
      var targetSelector = triggerElement.getAttribute(attr.target);
      var dismiss = triggerElement.getAttribute(attr.dismiss);
      var container = triggerElement.closest("[".concat(attr.present, "]"));
      if (previousTargets) {
        var _iterator6 = _createForOfIteratorHelper(previousTargets), _step6;
        try {
          for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
            var _presentElements$get2;
            var target = _step6.value;
            (_presentElements$get2 = presentElements.get(target)) === null || _presentElements$get2 === void 0 || _presentElements$get2.triggers.delete(triggerElement);
          }
        } catch (err) {
          _iterator6.e(err);
        } finally {
          _iterator6.f();
        }
      }
      if (dismiss || targetSelector) {
        iterateSelector(document, dismiss || targetSelector, function(present) {
          if (!present.id) {
            return;
          }
          targetIds.add(present.id);
          targets.add(present);
          var controller2 = presentElements.get(present);
          if (controller2) {
            controller2.triggers.add(triggerElement);
          }
        });
      } else if (container && container.id) {
        targetIds.add(container.id);
        targets.add(container);
        var controller = presentElements.get(container);
        if (controller) {
          controller.triggers.add(triggerElement);
        }
      }
      if (targets.size === 0) {
        triggerTargets.delete(triggerElement);
        return;
      }
      triggerTargets.set(triggerElement, targets);
      var initial = (_AelluxJs$mountManage = (_AelluxJs$mountManage2 = AelluxJs.mountManager).initialAttribute) === null || _AelluxJs$mountManage === void 0 ? void 0 : _AelluxJs$mountManage.call(_AelluxJs$mountManage2, triggerElement, ARIA_CONTROLS);
      if (initial) {
        initial.trim().split(/\s+/).forEach(function(x) {
          return targetIds.add(x);
        });
      }
      updateTriggerAriaExpanded(triggerElement);
      triggerElement.setAttribute(ARIA_CONTROLS, _toConsumableArray(targetIds).join(" "));
    }
    function updateTriggerAriaExpanded(triggerElement) {
      var targets = triggerTargets.get(triggerElement);
      if (!targets) return;
      var expanded = _toConsumableArray(targets).some(function(target) {
        var controller = presentElements.get(target);
        return controller && target.getAttribute(ARIA_EXPANDED) === "true";
      });
      triggerElement.setAttribute(ARIA_EXPANDED, String(expanded));
    }
    function pop(element) {
      return presentTransition(element, true);
    }
    function unpop(element) {
      return presentTransition(element, false);
    }
    function toggle(element, goto) {
      return presentTransition(element, goto);
    }
    function trigger(element, trigger2) {
      switch (trigger2) {
        case "pop":
          return pop(element);
          break;
        case "unpop":
          return unpop(element);
          break;
        case "toggle":
          return toggle(element);
          break;
        default:
          return toggle(element);
          break;
      }
    }
    function presentTransition(_x, _x2) {
      return _presentTransition.apply(this, arguments);
    }
    function _presentTransition() {
      _presentTransition = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee(element, gotoVisible) {
        var controller, newDirection, transitionClass, transitionStarted, allowEvent, interrupted, prepared, duration, timeMs, completed, _t, _t2;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              controller = presentElements.get(element);
              if (controller) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              if (controller.direction === null) controller.direction = element.hidden ? UNPOP : POP;
              if (typeof gotoVisible === "undefined" || gotoVisible === null) gotoVisible = controller.direction === POP ? false : true;
              newDirection = gotoVisible ? POP : UNPOP;
              if (!(element.hidden && !gotoVisible || newDirection === controller.direction)) {
                _context.n = 2;
                break;
              }
              return _context.a(2);
            case 2:
              transitionClass = null;
              transitionStarted = false;
              _context.p = 3;
              allowEvent = AelluxJs.dispatchFrom(element, "".concat(BEFORE).concat(newDirection), {
                bubbles: true,
                cancelable: true
              });
              if (allowEvent) {
                _context.n = 4;
                break;
              }
              return _context.a(2);
            case 4:
              controller.stop(gotoVisible);
              controller.direction = newDirection;
              transitionStarted = true;
              interrupted = new Promise(function(_, interruptTransition) {
                controller.interruptTransition = interruptTransition;
              });
              element.hidden = false;
              controller.classList.add(className.willChange);
              prepared = new Promise(function(resolve) {
                controller.timeout = setTimeout(function() {
                  controller.timeout = null;
                  resolve();
                }, TRANSITION_PREPARE_TIME);
              });
              _context.n = 5;
              return Promise.race([prepared, interrupted]);
            case 5:
              transitionClass = className["".concat(newDirection).concat(PING).toLowerCase()];
              duration = root.getComputedStyle(element).getPropertyValue("--ae-".concat(newDirection, "-duration").toLowerCase()).trim();
              timeMs = getString2Time(duration);
              if (root.document && root.document.documentElement.hasAttribute(attr.lowHardware)) {
                element.style.setProperty("--ae-".concat(newDirection, "-low-steps").toLowerCase(), Math.max(1, parseInt(timeMs / 62.5)));
              }
              controller.classList.add(transitionClass);
              completed = new Promise(function(completeTransition) {
                controller.timeout = setTimeout(finishTransition, timeMs, element, controller, transitionClass, gotoVisible, completeTransition);
              });
              AelluxJs.dispatchFrom(element, "".concat(newDirection).concat(PING), {
                bubbles: true
              });
              _context.n = 6;
              return Promise.race([completed, interrupted]);
            case 6:
              if (gotoVisible && !element.hidden) {
                autoUnpopSchedule(element, controller);
                controller.classList.add(className.pop);
                controller.setAriaExpanded("true");
                AelluxJs.dispatchFrom(element, POP, {
                  bubbles: true
                });
              }
              if (!gotoVisible && element.hidden) {
                controller.setAriaExpanded("false");
                AelluxJs.dispatchFrom(element, UNPOP, {
                  bubbles: true
                });
              }
              _context.n = 10;
              break;
            case 7:
              _context.p = 7;
              _t = _context.v;
              if (transitionStarted && controller.timeout !== null) {
                clearTimeout(controller.timeout);
                controller.timeout = null;
              }
              if (transitionStarted) {
                controller.interruptTransition = null;
                if (transitionClass) controller.classList.remove(transitionClass);
              }
              _t2 = _t && _t.code;
              _context.n = _t2 === AelluxJs.diagnostics.WARN_INTERRUPTION.code ? 8 : 9;
              break;
            case 8:
              AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_INTERRUPTION, {
                cause: _t,
                extension: extensionName,
                element: element
              });
              return _context.a(3, 10);
            case 9:
              AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION, {
                cause: _t,
                extension: extensionName,
                element: element
              });
              return _context.a(3, 10);
            case 10:
              _context.p = 10;
              if (transitionStarted) controller.classList.remove(className.willChange);
              return _context.f(10);
            case 11:
              return _context.a(2);
          }
        }, _callee, null, [[3, 7, 10, 11]]);
      }));
      return _presentTransition.apply(this, arguments);
    }
    function finishTransition(element, controller, c, gotoVisible, completeTransition) {
      controller.classList.remove(c);
      var focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
      element.hidden = gotoVisible ? false : true;
      if (focused) {
        if (document.activeElement === focused) focused.blur();
        if (document.activeElement !== focused) AelluxJs.dispatch("UnpopFocusLost");
      }
      controller.interruptTransition = null;
      controller.timeout = null;
      completeTransition();
    }
    function autoUnpopSchedule(element, controller) {
      var autoUnpopValue = element.getAttribute(attr.autoUnpop);
      if (!element.hidden && autoUnpopValue) {
        var autoTime = getString2Time(autoUnpopValue);
        controller.timeout = setTimeout(autoUnpop, autoTime, element, controller);
      }
    }
    function autoUnpop(element, controller) {
      controller.timeout = null;
      unpop(element);
    }
    function outsideClickAutoUnpop(currentExceptions) {
      var _iterator7 = _createForOfIteratorHelper(presentElements.keys()), _step7;
      try {
        var _loop = function _loop2() {
          var pContainer = _step7.value;
          if (pContainer.hidden === true || pContainer.getAttribute(attr.unpopOnOutside) === "false" || currentExceptions.some(function(e) {
            return pContainer.contains(e);
          })) {
            return 1;
          }
          unpop(pContainer);
        };
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
          if (_loop()) continue;
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
    }
    function OnClick(event) {
      if (!event.target) return;
      var container = event.target.closest("[".concat(attr.present, "]"));
      var exceptions = [event.target];
      var button;
      button = event.target.closest("[".concat(attr.trigger, "]"));
      if (button) {
        var triggerAttr = button.getAttribute(attr.trigger);
        var targetSelector = button.getAttribute(attr.target);
        if (targetSelector) {
          iterateSelector(document, targetSelector, function(element) {
            exceptions.push(element);
            trigger(element, triggerAttr);
          });
        } else if (container) {
          exceptions.push(container);
          trigger(container, triggerAttr);
        } else {
          AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING, {
            extension: extensionName,
            element: button,
            action: "trigger"
          });
        }
      }
      button = event.target.closest("[".concat(attr.dismiss, "]"));
      if (button) {
        var dismiss = button.getAttribute(attr.dismiss);
        var _targetSelector = button.getAttribute(attr.target);
        if (dismiss || _targetSelector) {
          iterateSelector(document, dismiss || _targetSelector, function(element) {
            exceptions.push(element);
            unpop(element);
          });
        } else if (container) {
          exceptions.push(container);
          unpop(container);
        } else {
          AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING, {
            extension: extensionName,
            element: button,
            action: "dismiss"
          });
        }
      }
      outsideClickAutoUnpop(exceptions);
    }
    function iterateSelector(element, selector, callback) {
      try {
        element.querySelectorAll(selector).forEach(function(element2) {
          try {
            callback(element2);
          } catch (error) {
            AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_CALLBACK, {
              cause: error,
              extension: extensionName,
              selector: selector
            });
          }
        });
      } catch (error) {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_SELECTOR, {
          cause: error,
          extension: extensionName,
          selector: selector
        });
      }
    }
    function getString2Time(string) {
      return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
    }
    function getMillisecondsMulti(value) {
      return !value.endsWith(MILLISECOND) && value.endsWith(SECOND) ? 1e3 : 1;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.present.legacy.js.map
