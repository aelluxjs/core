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
      //target ID
      target: AelluxJs.attr("target"),
      //target ID
      lowHardware: AelluxJs.attr("low-hardware")
    };
    var className = {
      pop: AelluxJs.className("pop"),
      popping: AelluxJs.className("popping"),
      unpopping: AelluxJs.className("unpopping"),
      willChange: AelluxJs.className("will-change"),
      grid: AelluxJs.className("present-grid")
    };
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      pop: pop,
      unpop: unpop,
      toggle: toggle,
      trigger: trigger
    });
    var POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", TRANSITION_PREPARE_TIME = 100, DEFAULT_PRESENT = "opacity transform height width";
    var presentElements = /* @__PURE__ */ new Map();
    var openPresentElements = /* @__PURE__ */ new Set();
    var triggerElementsSet = /* @__PURE__ */ new Set();
    var triggerTargets = /* @__PURE__ */ new Map();
    var triggersByTargetId = /* @__PURE__ */ new Map();
    var indexedTriggerValues = /* @__PURE__ */ new Map();
    var elementMemories = /* @__PURE__ */ new WeakMap();
    var containerAriaHandlers = /* @__PURE__ */ new WeakMap();
    var triggerAriaHandlers = /* @__PURE__ */ new WeakMap();
    var measuredMemories = /* @__PURE__ */ new WeakMap();
    function init(options) {
      AelluxJs.registerCssProperty({
        name: "--ae-from-opacity",
        syntax: "<number> | <percentage>",
        inherits: false,
        initialValue: "0"
      }, {
        name: "--ae-pop-opacity",
        syntax: "<number> | <percentage>",
        inherits: false,
        initialValue: "1"
      }, {
        name: "--ae-unpop-opacity",
        syntax: "<number> | <percentage>",
        inherits: false,
        initialValue: "0"
      }, {
        name: "--ae-from-transform",
        syntax: "<transform-list> | none",
        inherits: false,
        initialValue: "scale(0.5)"
      }, {
        name: "--ae-pop-transform",
        syntax: "<transform-list> | none",
        inherits: false,
        initialValue: "scale(1)"
      }, {
        name: "--ae-unpop-transform",
        syntax: "<transform-list> | none",
        inherits: false,
        initialValue: "scale(1.2)"
      }, {
        name: "--ae-from-height",
        syntax: "*",
        inherits: false,
        initialValue: "0fr"
      }, {
        name: "--ae-pop-height",
        syntax: "*",
        inherits: false,
        initialValue: "1fr"
      }, {
        name: "--ae-unpop-height",
        syntax: "*",
        inherits: false,
        initialValue: "0fr"
      }, {
        name: "--ae-from-width",
        syntax: "*",
        inherits: false,
        initialValue: "0fr"
      }, {
        name: "--ae-pop-width",
        syntax: "*",
        inherits: false,
        initialValue: "1fr"
      }, {
        name: "--ae-unpop-width",
        syntax: "*",
        inherits: false,
        initialValue: "0fr"
      }, {
        name: "--ae-pop-ease",
        syntax: "*",
        inherits: false,
        initialValue: "ease-out"
      }, {
        name: "--ae-unpop-ease",
        syntax: "*",
        inherits: false,
        initialValue: "ease-in"
      }, {
        name: "--ae-pop-duration",
        syntax: "<time>",
        inherits: false,
        initialValue: "250ms"
      }, {
        name: "--ae-unpop-duration",
        syntax: "<time>",
        inherits: false,
        initialValue: "250ms"
      }, {
        name: "--ae-pop-low-steps",
        syntax: "<integer>",
        inherits: false,
        initialValue: "4"
      }, {
        name: "--ae-unpop-low-steps",
        syntax: "<integer>",
        inherits: false,
        initialValue: "4"
      });
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(attr.present, "]"),
        priority: 0,
        mount: mountPresentContainer,
        unmount: unmountPresentContainer,
        controllers: ["pop", "unpop", "trigger", "toggle"]
      });
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        priority: 0,
        selector: "[".concat([attr.trigger, attr.dismiss, attr.target].join("],["), "]"),
        mount: mountTriggerElement,
        unmount: unmountTriggerElement
      });
      AelluxJs.on("$click", OnClick);
    }
    function destroy() {
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
      AelluxJs.off("$click", OnClick);
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
      openPresentElements.clear();
    }
    function mountPresentContainer(element) {
      if (presentElements.has(element)) return;
      elementMemories.set(element, AelluxJs.persist.element.save(element, [attr.present, attr.presentMotion, "hidden"], ["--ae-pop-low-steps", "--ae-unpop-low-steps"]));
      containerAriaHandlers.set(element, AelluxJs.aria.register(element));
      if ((element.getAttribute(attr.present) || "").trim().toLowerCase() === "all") {
        element.setAttribute(attr.present, DEFAULT_PRESENT);
      }
      if (element.hasAttribute(attr.presentMotion)) {
        element.removeAttribute(attr.presentMotion);
      }
      var presentMotion = element.querySelector(":scope>[".concat(attr.presentMotion, "]"));
      var tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
      var measuredHeight = !presentMotion && tokens.includes("height");
      var measuredWidth = !presentMotion && tokens.includes("width");
      if (presentMotion) element.classList.add(className.grid);
      else if (measuredHeight || measuredWidth) {
        AelluxJs.diagnostics.info(AelluxJs.diagnostics.INFO_PRESENT_MEASURED_LAYOUT, {
          extension: extensionName,
          element: element
        });
      }
      var presentController = {
        presentMotion: presentMotion,
        measuredHeight: measuredHeight,
        measuredWidth: measuredWidth,
        motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
        transition: null,
        autoUnpopTimeout: null,
        direction: null,
        classList: element.classList,
        triggers: /* @__PURE__ */ new Set(),
        setAriaExpanded: function setAriaExpanded(value) {
          this.expanded = value === "true";
          containerAriaHandlers.get(element).set({
            expanded: this.expanded
          });
          this.triggers.forEach(updateTriggerAriaExpanded);
        },
        stop: function stop() {
          var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          var replacement = options.replacement === true;
          var transitionStart = options.transitionStart === true;
          var transition = this.transition;
          if (transition) {
            transition.replacement = replacement;
            if (transition.timeout !== null) {
              clearTimeout(transition.timeout);
              transition.timeout = null;
            }
            if (!transitionStart && transition.className) {
              this.classList.remove(transition.className);
            }
            this.transition = null;
            transition.interrupt(AelluxJs.diagnostics.create(AelluxJs.diagnostics.WARN_INTERRUPTION, {
              extensionName: extensionName,
              replacement: replacement
            }));
          }
          if (this.autoUnpopTimeout !== null) {
            clearTimeout(this.autoUnpopTimeout);
            this.autoUnpopTimeout = null;
          }
          if (transitionStart) {
            this.classList.remove(className.unpopping);
          } else {
            this.classList.remove(className.pop, className.popping, className.unpopping, className.willChange);
          }
          if (!replacement) restoreMeasuredStyles(element, this);
        }
      };
      presentController.setAriaExpanded(element.hidden ? "false" : "true");
      if (!element.hidden) {
        presentController.classList.add(className.pop);
        openPresentElements.add(element);
      }
      presentElements.set(element, presentController);
      var _iterator3 = _createForOfIteratorHelper(element.querySelectorAll("[".concat(attr.trigger, "],[").concat(attr.dismiss, "],[").concat(attr.target, "]"))), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var _triggerElement = _step3.value;
          if (triggerTargets.get(_triggerElement) === element) {
            presentController.triggers.add(_triggerElement);
            updateTriggerAriaExpanded(_triggerElement);
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      var idTriggers = triggersByTargetId.get(element.id);
      if (idTriggers) {
        var _iterator4 = _createForOfIteratorHelper(idTriggers), _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
            var triggerElement = _step4.value;
            refreshTriggerTargets(triggerElement);
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }
      autoUnpopSchedule(element, presentController);
    }
    function unmountPresentContainer(element) {
      var _containerAriaHandler, _elementMemories$get;
      if (!presentElements.has(element)) return;
      var controller = presentElements.get(element);
      controller.stop();
      element.classList.remove(className.grid);
      presentElements.delete(element);
      openPresentElements.delete(element);
      (_containerAriaHandler = containerAriaHandlers.get(element)) === null || _containerAriaHandler === void 0 || _containerAriaHandler.release();
      containerAriaHandlers.delete(element);
      (_elementMemories$get = elementMemories.get(element)) === null || _elementMemories$get === void 0 || _elementMemories$get.restore();
      elementMemories.delete(element);
      controller.triggers.forEach(updateTriggerAriaExpanded);
    }
    function mountTriggerElement(triggerElement) {
      if (triggerElementsSet.has(triggerElement)) return;
      triggerAriaHandlers.set(triggerElement, AelluxJs.aria.register(triggerElement));
      triggerElementsSet.add(triggerElement);
      refreshTriggerTargets(triggerElement);
    }
    function unmountTriggerElement(triggerElement) {
      var _triggerAriaHandlers$;
      if (!triggerElementsSet.has(triggerElement)) return;
      var target = triggerTargets.get(triggerElement);
      if (target) {
        var _presentElements$get;
        (_presentElements$get = presentElements.get(target)) === null || _presentElements$get === void 0 || _presentElements$get.triggers.delete(triggerElement);
        triggerTargets.delete(triggerElement);
      }
      unindexTriggerTarget(triggerElement);
      triggerElementsSet.delete(triggerElement);
      (_triggerAriaHandlers$ = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$ === void 0 || _triggerAriaHandlers$.release();
      triggerAriaHandlers.delete(triggerElement);
    }
    function targetIdFor(value) {
      if (!value) return null;
      var id = value.charAt(0) === "#" ? value.slice(1) : value;
      return id && !/[\s#]/.test(id) ? id : null;
    }
    function targetById(value) {
      var id = targetIdFor(value);
      if (!id) {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_SELECTOR, {
          cause: new SyntaxError(),
          extension: extensionName,
          selector: value
        });
        return null;
      }
      return document.getElementById(id);
    }
    function unindexTriggerTarget(triggerElement) {
      var previous = indexedTriggerValues.get(triggerElement);
      var id = targetIdFor(previous);
      if (id) {
        var triggers = triggersByTargetId.get(id);
        triggers.delete(triggerElement);
        if (!triggers.size) triggersByTargetId.delete(id);
      }
      indexedTriggerValues.delete(triggerElement);
    }
    function indexTriggerTarget(triggerElement, value) {
      if (indexedTriggerValues.get(triggerElement) === value) return;
      unindexTriggerTarget(triggerElement);
      indexedTriggerValues.set(triggerElement, value);
      var id = targetIdFor(value);
      if (id) {
        var triggers = triggersByTargetId.get(id);
        if (!triggers) {
          triggers = /* @__PURE__ */ new Set();
          triggersByTargetId.set(id, triggers);
        }
        triggers.add(triggerElement);
      }
    }
    function refreshTriggerTargets(triggerElement) {
      var _presentElements$get3, _triggerAriaHandlers$4;
      var previousTarget = triggerTargets.get(triggerElement);
      var targetSelector = triggerElement.getAttribute(attr.target);
      var dismiss = triggerElement.getAttribute(attr.dismiss);
      indexTriggerTarget(triggerElement, dismiss || targetSelector);
      var container = triggerElement.closest("[".concat(attr.present, "]"));
      if (previousTarget) {
        var _presentElements$get2;
        (_presentElements$get2 = presentElements.get(previousTarget)) === null || _presentElements$get2 === void 0 || _presentElements$get2.triggers.delete(triggerElement);
      }
      var target = null;
      if (dismiss || targetSelector) {
        target = targetById(dismiss || targetSelector);
      } else if (container && container.id) {
        target = container;
      }
      if (!target || !target.id) {
        var _triggerAriaHandlers$2, _triggerAriaHandlers$3;
        triggerTargets.delete(triggerElement);
        (_triggerAriaHandlers$2 = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$2 === void 0 || _triggerAriaHandlers$2.unset("expanded");
        (_triggerAriaHandlers$3 = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$3 === void 0 || _triggerAriaHandlers$3.unset("controls");
        return;
      }
      triggerTargets.set(triggerElement, target);
      (_presentElements$get3 = presentElements.get(target)) === null || _presentElements$get3 === void 0 || _presentElements$get3.triggers.add(triggerElement);
      var targetIds = /* @__PURE__ */ new Set([target.id]);
      var initial = (_triggerAriaHandlers$4 = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$4 === void 0 ? void 0 : _triggerAriaHandlers$4.initial("controls");
      if (initial) {
        initial.trim().split(/\s+/).forEach(function(x) {
          return targetIds.add(x);
        });
      }
      updateTriggerAriaExpanded(triggerElement);
      triggerAriaHandlers.get(triggerElement).set({
        controls: _toConsumableArray(targetIds)
      });
    }
    function updateTriggerAriaExpanded(triggerElement) {
      var _presentElements$get4, _triggerAriaHandlers$5;
      var target = triggerTargets.get(triggerElement);
      if (!target) return;
      var expanded = ((_presentElements$get4 = presentElements.get(target)) === null || _presentElements$get4 === void 0 ? void 0 : _presentElements$get4.expanded) === true;
      (_triggerAriaHandlers$5 = triggerAriaHandlers.get(triggerElement)) === null || _triggerAriaHandlers$5 === void 0 || _triggerAriaHandlers$5.set({
        expanded: expanded
      });
    }
    function pop(element) {
      return presentTransition(element, true, true);
    }
    function unpop(element) {
      return presentTransition(element, false);
    }
    function toggle(element, goto) {
      return presentTransition(element, goto);
    }
    function trigger(element, trigger2) {
      trigger2 = typeof trigger2 === "string" ? (trigger2 || "toggle").toLowerCase() : "toggle";
      var method = AelluxJs.ext.present[trigger2];
      return method && typeof method === "function" ? method(element) : toggle(element);
    }
    function restoreMeasuredStyles(element, controller) {
      var memory = measuredMemories.get(element);
      if (!memory) return;
      memory.restore();
      measuredMemories.delete(element);
    }
    function prepareMeasuredSize(_x, _x2, _x3, _x4, _x5) {
      return _prepareMeasuredSize.apply(this, arguments);
    }
    function _prepareMeasuredSize() {
      _prepareMeasuredSize = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee(element, controller, gotoVisible, previousSize, waitForPreparation) {
        var size, computed, height, width, start;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              if (!(!controller.measuredHeight && !controller.measuredWidth)) {
                _context.n = 1;
                break;
              }
              return _context.a(2, null);
            case 1:
              if (!measuredMemories.has(element)) {
                measuredMemories.set(element, AelluxJs.persist.element.save(element, [], ["max-height", "max-width"]));
              }
              measuredMemories.get(element).restore();
              size = previousSize;
              if (gotoVisible || !size) {
                computed = root.getComputedStyle(element);
                height = parseFloat(computed.height);
                width = parseFloat(computed.width);
                size = {
                  height: Number.isFinite(height) ? height : element.scrollHeight,
                  width: Number.isFinite(width) ? width : element.scrollWidth
                };
              }
              start = previousSize || (gotoVisible ? {
                height: 0,
                width: 0
              } : size);
              if (controller.measuredHeight) {
                element.style.setProperty("max-height", "".concat(Math.max(0, start.height), "px"), "important");
              }
              if (controller.measuredWidth) {
                element.style.setProperty("max-width", "".concat(Math.max(0, start.width), "px"), "important");
              }
              if (waitForPreparation) {
                _context.n = 2;
                break;
              }
              _context.n = 2;
              return AelluxJs.waitLayout.read(function() {
                return element.getBoundingClientRect();
              });
            case 2:
              return _context.a(2, size);
          }
        }, _callee);
      }));
      return _prepareMeasuredSize.apply(this, arguments);
    }
    function presentTransition(_x6, _x7) {
      return _presentTransition.apply(this, arguments);
    }
    function _presentTransition() {
      _presentTransition = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee2(element, gotoVisible) {
        var forceRepop, controller, newDirection, transition, allowEvent, reusePreparation, waitForPreparation, previousSize, computed, interrupted, size, prepared, duration, timeMs, activateTransition, completed, ownsTransition, _args2 = arguments, _t, _t2;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              forceRepop = _args2.length > 2 && _args2[2] !== void 0 ? _args2[2] : false;
              controller = presentElements.get(element);
              if (controller) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2);
            case 1:
              if (controller.direction === null) controller.direction = element.hidden ? UNPOP : POP;
              if (typeof gotoVisible === "undefined" || gotoVisible === null) gotoVisible = controller.direction === POP ? false : true;
              newDirection = gotoVisible ? POP : UNPOP;
              if (!(element.hidden && !gotoVisible || newDirection === controller.direction && !forceRepop)) {
                _context2.n = 2;
                break;
              }
              return _context2.a(2);
            case 2:
              transition = null;
              _context2.p = 3;
              allowEvent = AelluxJs.dispatchFrom(element, "".concat(BEFORE).concat(newDirection), {
                bubbles: true,
                cancelable: true
              });
              if (allowEvent) {
                _context2.n = 4;
                break;
              }
              return _context2.a(2);
            case 4:
              if (forceRepop && (!element.hidden || controller.transition)) {
                controller.stop();
                element.hidden = true;
                openPresentElements.delete(element);
                controller.setAriaExpanded("false");
                element.getBoundingClientRect();
              }
              reusePreparation = !forceRepop && controller.motionEnabled && controller.transition !== null && controller.classList.contains(className.willChange);
              waitForPreparation = controller.motionEnabled && !reusePreparation;
              previousSize = null;
              if (reusePreparation && (controller.measuredHeight || controller.measuredWidth)) {
                computed = root.getComputedStyle(element);
                previousSize = {
                  height: parseFloat(computed.maxHeight),
                  width: parseFloat(computed.maxWidth)
                };
              }
              if (!forceRepop) {
                controller.stop({
                  replacement: reusePreparation,
                  transitionStart: true
                });
              }
              controller.direction = newDirection;
              interrupted = new Promise(function(_, interruptTransition) {
                transition = {
                  className: null,
                  timeout: null,
                  interrupt: interruptTransition,
                  replacement: false
                };
                controller.transition = transition;
              });
              interrupted.catch(function() {
              });
              element.hidden = false;
              openPresentElements.add(element);
              size = null;
              if (!(controller.measuredHeight || controller.measuredWidth)) {
                _context2.n = 6;
                break;
              }
              _context2.n = 5;
              return prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation);
            case 5:
              size = _context2.v;
            case 6:
              if (!(controller.transition !== transition)) {
                _context2.n = 7;
                break;
              }
              return _context2.a(2);
            case 7:
              if (controller.motionEnabled) {
                controller.classList.add(className.willChange);
              }
              if (!waitForPreparation) {
                _context2.n = 8;
                break;
              }
              prepared = new Promise(function(resolve) {
                transition.timeout = setTimeout(function() {
                  transition.timeout = null;
                  resolve();
                }, TRANSITION_PREPARE_TIME);
              });
              _context2.n = 8;
              return Promise.race([prepared, interrupted]);
            case 8:
              transition.className = className["".concat(newDirection).concat(PING).toLowerCase()];
              duration = root.getComputedStyle(element).getPropertyValue("--ae-".concat(newDirection, "-duration").toLowerCase()).trim();
              timeMs = getString2Time(duration);
              activateTransition = function activateTransition2() {
                if (controller.transition !== transition) return;
                element.style.setProperty("--ae-".concat(newDirection, "-low-steps").toLowerCase(), Math.max(1, parseInt(timeMs / 62.5)));
                controller.classList.remove(className.pop, className.popping, className.unpopping);
                controller.classList.add(transition.className);
                if (size) {
                  if (controller.measuredHeight) {
                    element.style.setProperty("max-height", "".concat(gotoVisible ? size.height : 0, "px"), "important");
                  }
                  if (controller.measuredWidth) {
                    element.style.setProperty("max-width", "".concat(gotoVisible ? size.width : 0, "px"), "important");
                  }
                }
              };
              if (!(size && !waitForPreparation)) {
                _context2.n = 10;
                break;
              }
              _context2.n = 9;
              return AelluxJs.waitLayout.update(activateTransition);
            case 9:
              _context2.n = 11;
              break;
            case 10:
              activateTransition();
            case 11:
              if (!(controller.transition !== transition)) {
                _context2.n = 12;
                break;
              }
              return _context2.a(2);
            case 12:
              completed = new Promise(function(completeTransition) {
                transition.timeout = setTimeout(finishTransition, timeMs, element, controller, transition, gotoVisible, completeTransition);
              });
              AelluxJs.dispatchFrom(element, "Layout", {
                detail: {
                  origin: "present.".concat(newDirection).toLowerCase(),
                  durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
                },
                bubbles: true
              });
              AelluxJs.dispatchFrom(element, "".concat(newDirection).concat(PING), {
                bubbles: true
              });
              _context2.n = 13;
              return Promise.race([completed, interrupted]);
            case 13:
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
              _context2.n = 17;
              break;
            case 14:
              _context2.p = 14;
              _t = _context2.v;
              ownsTransition = transition && controller.transition === transition;
              if (ownsTransition && transition.timeout !== null) {
                clearTimeout(transition.timeout);
                transition.timeout = null;
              }
              if (ownsTransition && transition.className) {
                controller.classList.remove(transition.className);
              }
              if (ownsTransition) restoreMeasuredStyles(element, controller);
              _t2 = _t && _t.code;
              _context2.n = _t2 === AelluxJs.diagnostics.WARN_INTERRUPTION.code ? 15 : 16;
              break;
            case 15:
              AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_INTERRUPTION, {
                cause: _t,
                extension: extensionName,
                element: element,
                replacement: transition && transition.replacement === true
              });
              return _context2.a(3, 17);
            case 16:
              AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION, {
                cause: _t,
                extension: extensionName,
                element: element
              });
              return _context2.a(3, 17);
            case 17:
              _context2.p = 17;
              if (transition && controller.transition === transition) {
                controller.transition = null;
                controller.classList.remove(className.willChange);
              }
              return _context2.f(17);
            case 18:
              return _context2.a(2);
          }
        }, _callee2, null, [[3, 14, 17, 18]]);
      }));
      return _presentTransition.apply(this, arguments);
    }
    function finishTransition(element, controller, transition, gotoVisible, completeTransition) {
      controller.classList.remove(transition.className);
      restoreMeasuredStyles(element, controller);
      var focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
      element.hidden = gotoVisible ? false : true;
      if (element.hidden) openPresentElements.delete(element);
      else openPresentElements.add(element);
      if (focused) {
        if (document.activeElement === focused) focused.blur();
        if (document.activeElement !== focused) AelluxJs.dispatch("UnpopFocusLost", {
          detail: {
            element: element,
            focused: focused
          }
        });
      }
      transition.timeout = null;
      completeTransition();
    }
    function autoUnpopSchedule(element, controller) {
      var autoUnpopValue = element.getAttribute(attr.autoUnpop);
      if (!element.hidden && autoUnpopValue) {
        var autoTime = getString2Time(autoUnpopValue);
        controller.autoUnpopTimeout = setTimeout(autoUnpop, autoTime, element, controller);
      }
    }
    function autoUnpop(element, controller) {
      controller.autoUnpopTimeout = null;
      unpop(element);
    }
    function outsideClickAutoUnpop(currentExceptions) {
      var _iterator5 = _createForOfIteratorHelper(openPresentElements), _step5;
      try {
        var _loop = function _loop2() {
          var pContainer = _step5.value;
          if (pContainer.hidden === true || pContainer.getAttribute(attr.unpopOnOutside) === "false" || currentExceptions.some(function(e) {
            return pContainer.contains(e);
          })) {
            return 1;
          }
          unpop(pContainer);
        };
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          if (_loop()) continue;
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
    function refreshChangedTrigger(button) {
      if (!triggerElementsSet.has(button)) return;
      var value = button.getAttribute(attr.dismiss) || button.getAttribute(attr.target);
      if (value !== indexedTriggerValues.get(button)) refreshTriggerTargets(button);
    }
    function OnClick(event) {
      if (!event.target) return;
      var container = event.target.closest("[".concat(attr.present, "]"));
      var exceptions = [event.target];
      var button;
      button = event.target.closest("[".concat(attr.trigger, "]"));
      if (button) {
        refreshChangedTrigger(button);
        var triggerAttr = button.getAttribute(attr.trigger);
        var targetSelector = button.getAttribute(attr.target);
        if (targetSelector) {
          var target = targetById(targetSelector);
          if (target) {
            exceptions.push(target);
            trigger(target, triggerAttr);
          }
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
        refreshChangedTrigger(button);
        var dismiss = button.getAttribute(attr.dismiss);
        var _targetSelector = button.getAttribute(attr.target);
        if (dismiss || _targetSelector) {
          var _target = targetById(dismiss || _targetSelector);
          if (_target) {
            exceptions.push(_target);
            unpop(_target);
          }
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
    function getString2Time(string) {
      return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
    }
    function getMillisecondsMulti(value) {
      return !value.endsWith(MILLISECOND) && value.endsWith(SECOND) ? 1e3 : 1;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.present.legacy.js.map
