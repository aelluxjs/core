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
      group: AelluxJs.attr("present-group"),
      active: AelluxJs.attr("present-active"),
      when: AelluxJs.attr("present-when"),
      triggerOn: AelluxJs.attr("trigger-on"),
      autoUnpop: AelluxJs.attr("auto-unpop"),
      presentMotion: AelluxJs.attr("present-motion"),
      unpopOnClick: AelluxJs.attr("unpop-on-click"),
      trigger: AelluxJs.attr("trigger"),
      //toggle,pop,unpop
      dismiss: AelluxJs.attr("dismiss"),
      //target ID
      target: AelluxJs.attr("target")
      //target ID
    };
    var className = {
      pop: AelluxJs.className("pop"),
      popping: AelluxJs.className("popping"),
      unpopping: AelluxJs.className("unpopping"),
      willChange: AelluxJs.className("will-change"),
      grid: AelluxJs.className("present-grid")
    };
    var presentSelector = "[".concat(attr.present, "]");
    var groupSelector = "[".concat(attr.group, "]");
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      pop: pop,
      unpop: unpop,
      toggle: toggle,
      trigger: trigger,
      show: show,
      selected: selected,
      popNext: popNext
    });
    var POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", DEFAULT_PRESENT = "opacity transform height width", OPACITY_SYNTAX = "<number> | <percentage>", TRANSFORM_SYNTAX = "<transform-list> | none";
    var TRANSITION_PREPARE_TIME = 100;
    var TAP_CLICK_WAIT_TIME = 32;
    var presentElements = /* @__PURE__ */ new Map();
    var openPresentElements = /* @__PURE__ */ new Set();
    var fallbackMotionId = 5e6;
    var triggerElementsSet = /* @__PURE__ */ new Set();
    var triggerTargets = /* @__PURE__ */ new Map();
    var triggersByTargetId = /* @__PURE__ */ new Map();
    var indexedTriggerValues = /* @__PURE__ */ new Map();
    var elementMemories = /* @__PURE__ */ new WeakMap();
    var containerAriaHandlers = /* @__PURE__ */ new WeakMap();
    var triggerAriaHandlers = /* @__PURE__ */ new WeakMap();
    var measuredMemories = /* @__PURE__ */ new WeakMap();
    var groups = /* @__PURE__ */ new Map();
    var hoverTimers = /* @__PURE__ */ new Map();
    var hoveredTriggers = /* @__PURE__ */ new Set();
    var pendingTaps = /* @__PURE__ */ new Set();
    var groupObserver = null;
    var groupsQueued = false;
    var interpolatedProgress = false;
    var autoObserver = null;
    var presentationSequence = 0;
    var cssProperties = [["pop-progress", "<number>", "0"], ["unpop-progress", "<number>", "1"], ["present-pop-phase", "<number>", "0"], ["present-unpop-phase", "<number>", "1"], ["from-opacity", OPACITY_SYNTAX, "0"], ["pop-opacity", OPACITY_SYNTAX, "1"], ["unpop-opacity", OPACITY_SYNTAX, "0"], ["from-transform", TRANSFORM_SYNTAX, "scale(0.5)"], ["pop-transform", TRANSFORM_SYNTAX, "scale(1)"], ["unpop-transform", TRANSFORM_SYNTAX, "scale(1.2)"], ["from-height", "*", "0fr"], ["pop-height", "*", "1fr"], ["unpop-height", "*", "0fr"], ["from-width", "*", "0fr"], ["pop-width", "*", "1fr"], ["unpop-width", "*", "0fr"], ["pop-ease", "*", "ease-out"], ["unpop-ease", "*", "ease-in"], ["pop-duration", "<time>", "250ms"], ["unpop-duration", "<time>", "250ms"]];
    function init(options) {
      var descriptors = cssProperties.map(function(_ref) {
        var _ref2 = _slicedToArray(_ref, 3), name = _ref2[0], syntax = _ref2[1], initialValue = _ref2[2];
        return {
          name: "--ae-".concat(name),
          syntax: syntax,
          initialValue: initialValue
        };
      });
      var progressRegistered = AelluxJs.registerCssProperty.apply(AelluxJs, _toConsumableArray(descriptors.slice(0, 4)));
      interpolatedProgress = !!(progressRegistered && root.CSS.supports && root.CSS.supports("opacity", "clamp(0, 0.5, 1)"));
      AelluxJs.registerCssProperty.apply(AelluxJs, _toConsumableArray(descriptors.slice(4)));
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: presentSelector,
        priority: 0,
        mount: mountPresentContainer,
        unmount: unmountPresentContainer,
        update: function update(element) {
          return autoUnpopSchedule(element, presentElements.get(element));
        },
        controllers: ["pop", "unpop", "trigger", "toggle"]
      });
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        priority: 0,
        selector: "[".concat([attr.trigger, attr.dismiss, attr.target].join("],["), "]"),
        mount: mountTriggerElement,
        unmount: unmountTriggerElement
      });
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: groupSelector,
        priority: 1,
        mount: mountGroup,
        unmount: unmountGroup,
        controllers: ["show", "selected", "popNext"]
      });
      autoObserver = new root.MutationObserver(function(records) {
        var _iterator = _createForOfIteratorHelper(records), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var record = _step.value;
            var controller = presentElements.get(record.target);
            if (controller) autoUnpopSchedule(record.target, controller);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      });
      autoObserver.observe(document, {
        subtree: true,
        attributes: true,
        attributeFilter: [attr.autoUnpop]
      });
      document.addEventListener("pointerover", onHover);
      document.addEventListener("pointerout", onHover);
      AelluxJs.on("$click", OnClick);
      AelluxJs.on("tap", onTap);
      AelluxJs.onEvent(root, "$resize", refreshExpandedStates);
    }
    function destroy() {
      var _autoObserver;
      (_autoObserver = autoObserver) === null || _autoObserver === void 0 || _autoObserver.disconnect();
      autoObserver = null;
      AelluxJs.mountManager.remove({
        extensionName: extensionName
      });
      AelluxJs.off("$click", OnClick);
      AelluxJs.off("tap", onTap);
      var _iterator2 = _createForOfIteratorHelper(pendingTaps), _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          var pending = _step2.value;
          cancelPendingTap(pending);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      AelluxJs.offEvent(root, "$resize", refreshExpandedStates);
      document.removeEventListener("pointerover", onHover);
      document.removeEventListener("pointerout", onHover);
      var _iterator3 = _createForOfIteratorHelper(groups.keys()), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var group = _step3.value;
          unmountGroup(group);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      var _iterator4 = _createForOfIteratorHelper(hoverTimers.keys()), _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
          var target = _step4.value;
          cancelHoverClose(target);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      hoveredTriggers.clear();
      var _iterator5 = _createForOfIteratorHelper(triggerElementsSet), _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
          var triggerElement = _step5.value;
          unmountTriggerElement(triggerElement);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      var _iterator6 = _createForOfIteratorHelper(presentElements.keys()), _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
          var element = _step6.value;
          unmountPresentContainer(element);
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      openPresentElements.clear();
    }
    function mountPresentContainer(element) {
      if (presentElements.has(element)) return;
      elementMemories.set(element, AelluxJs.persist.element.save(element, [attr.present, attr.presentMotion, "hidden"], ["--ae-pop-progress", "--ae-unpop-progress", "--ae-present-pop-phase", "--ae-present-unpop-phase"]));
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
        motionId: AelluxJs.motion ? AelluxJs.motion.id() : fallbackMotionId++,
        transition: null,
        operationRevision: 0,
        presentationOrder: element.hidden ? 0 : ++presentationSequence,
        autoUnpopTimeout: null,
        autoCountdown: null,
        direction: null,
        classList: element.classList,
        triggers: /* @__PURE__ */ new Set(),
        triggerExpanded: !element.hidden,
        setAriaExpanded: function setAriaExpanded(value) {
          this.expanded = value === "true";
          containerAriaHandlers.get(element).set({
            expanded: this.expanded
          });
        },
        setTriggerExpanded: function setTriggerExpanded(value) {
          this.triggerExpanded = value;
          this.triggers.forEach(updateTriggerAriaExpanded);
        },
        stop: function stop() {
          var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          var replacement = options.replacement === true;
          var transitionStart = options.transitionStart === true;
          var transition = this.transition;
          if (transition) {
            transition.cancelled = true;
            transition.replacement = replacement;
            if (AelluxJs.motion) AelluxJs.motion.cancel(this.motionId);
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
          cancelAutoUnpop(this);
          if (transitionStart) {
            this.classList.remove(className.unpopping);
          } else {
            this.classList.remove(className.pop, className.popping, className.unpopping, className.willChange);
          }
          if (!replacement) restoreMeasuredStyles(element, this);
        }
      };
      if (!element.hidden) {
        presentController.classList.add(className.pop);
        openPresentElements.add(element);
      }
      presentElements.set(element, presentController);
      var _iterator7 = _createForOfIteratorHelper(element.querySelectorAll("[".concat(attr.trigger, "],[").concat(attr.dismiss, "],[").concat(attr.target, "]"))), _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
          var _triggerElement = _step7.value;
          if (triggerTargets.get(_triggerElement) === element) {
            presentController.triggers.add(_triggerElement);
            updateTriggerAriaExpanded(_triggerElement);
          }
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      var idTriggers = triggersByTargetId.get(element.id);
      if (idTriggers) {
        var _iterator8 = _createForOfIteratorHelper(idTriggers), _step8;
        try {
          for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
            var triggerElement = _step8.value;
            refreshTriggerTargets(triggerElement);
          }
        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }
      }
      setProgress(element, !element.hidden);
      syncAriaExpanded(element, presentController);
      queueGroups();
      autoUnpopSchedule(element, presentController);
    }
    function unmountPresentContainer(element) {
      var _AelluxJs$waitLayout, _containerAriaHandler, _elementMemories$get;
      if (!presentElements.has(element)) return;
      cancelElementTaps(element);
      var controller = presentElements.get(element);
      cancelHoverClose(element);
      var _iterator9 = _createForOfIteratorHelper(controller.triggers), _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
          var button = _step9.value;
          hoveredTriggers.delete(button);
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      controller.stop();
      (_AelluxJs$waitLayout = AelluxJs.waitLayout) === null || _AelluxJs$waitLayout === void 0 || _AelluxJs$waitLayout.cancel(controller.motionId);
      element.classList.remove(className.grid);
      presentElements.delete(element);
      openPresentElements.delete(element);
      (_containerAriaHandler = containerAriaHandlers.get(element)) === null || _containerAriaHandler === void 0 || _containerAriaHandler.release();
      containerAriaHandlers.delete(element);
      (_elementMemories$get = elementMemories.get(element)) === null || _elementMemories$get === void 0 || _elementMemories$get.restore();
      elementMemories.delete(element);
      controller.triggers.forEach(updateTriggerAriaExpanded);
      queueGroups();
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
      cancelElementTaps(triggerElement);
      hoveredTriggers.delete(triggerElement);
      var target = triggerTargets.get(triggerElement);
      if (target) {
        var _presentElements$get;
        cancelHoverClose(target);
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
          selector: value,
          reason: "Present targets accept one element ID, not a CSS selector list.",
          suggestion: "Use one existing Present ID, optionally prefixed with #."
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
      var container = triggerElement.closest(presentSelector);
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
      if (previousTarget !== target) hoveredTriggers.delete(triggerElement);
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
      var expanded = ((_presentElements$get4 = presentElements.get(target)) === null || _presentElements$get4 === void 0 ? void 0 : _presentElements$get4.triggerExpanded) === true;
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
      if (!["pop", "unpop", "toggle"].includes(trigger2)) AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: extensionName,
        element: element,
        attribute: attr.trigger,
        value: trigger2,
        reason: "Unknown Present action; using toggle.",
        suggestion: "Use pop, unpop, or toggle."
      });
      var method = trigger2 === "pop" ? pop : trigger2 === "unpop" ? unpop : toggle;
      return method(element);
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
              return AelluxJs.waitLayout.read(controller.motionId, function() {
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
        var forceRepop, groupOperation, presentationOrder, controller, group, groupState, groupRevision, hasCapacity, newDirection, transition, _groups$get, revision, allowEvent, reusePreparation, waitForPreparation, previousSize, computed, interrupted, size, prepared, duration, timeMs, activateTransition, advancedEase, motionOptions, completed, autoUnpopValue, _duration, motionResult, ownsTransition, _args2 = arguments, _t, _t2;
        return _regenerator().w(function(_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              forceRepop = _args2.length > 2 && _args2[2] !== void 0 ? _args2[2] : false;
              groupOperation = _args2.length > 3 && _args2[3] !== void 0 ? _args2[3] : false;
              presentationOrder = _args2.length > 4 ? _args2[4] : void 0;
              controller = presentElements.get(element);
              if (controller) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2);
            case 1:
              if (controller.direction === null) controller.direction = element.hidden ? UNPOP : POP;
              if (typeof gotoVisible === "undefined" || gotoVisible === null) gotoVisible = controller.direction === POP ? false : true;
              group = element.closest(groupSelector);
              groupState = groups.get(group);
              groupRevision = groupState === null || groupState === void 0 ? void 0 : groupState.revision;
              if (!(!groupOperation && groupState && !groupState.accumulating && element !== group)) {
                _context2.n = 4;
                break;
              }
              if (element.id) {
                _context2.n = 2;
                break;
              }
              groupDiagnostic(group, "Present Group members must have an ID.");
              return _context2.a(2, false);
            case 2:
              if (!gotoVisible) {
                _context2.n = 3;
                break;
              }
              return _context2.a(2, show(group, element.id));
            case 3:
              if (!(groups.get(group).selected === element)) {
                _context2.n = 4;
                break;
              }
              return _context2.a(2, show(group, ""));
            case 4:
              hasCapacity = function hasCapacity2() {
                return groupOperation || element === group || !gotoVisible || !(groupState !== null && groupState !== void 0 && groupState.accumulating) || groupMemberActive(element, groupState) || activeGroupMembers(group, groupState).length < groupLimit(group, groupState);
              };
              if (hasCapacity()) {
                _context2.n = 5;
                break;
              }
              return _context2.a(2, false);
            case 5:
              newDirection = gotoVisible ? POP : UNPOP;
              if (!(element.hidden && !gotoVisible || newDirection === controller.direction && !forceRepop)) {
                _context2.n = 6;
                break;
              }
              if (!controller.transition) syncAriaExpanded(element, controller);
              return _context2.a(2);
            case 6:
              transition = null;
              _context2.p = 7;
              revision = controller.operationRevision;
              allowEvent = groupOperation || AelluxJs.dispatchFrom(element, "".concat(BEFORE).concat(newDirection), {
                bubbles: true,
                cancelable: true
              });
              if (!(!allowEvent || controller.operationRevision !== revision || presentElements.get(element) !== controller || !element.isConnected)) {
                _context2.n = 8;
                break;
              }
              return _context2.a(2);
            case 8:
              if (!(!groupOperation && element !== group && (element.closest(groupSelector) !== group || groupState && (groups.get(group) !== groupState || groupState.revision !== groupRevision)))) {
                _context2.n = 9;
                break;
              }
              return _context2.a(2);
            case 9:
              if (hasCapacity()) {
                _context2.n = 10;
                break;
              }
              return _context2.a(2, false);
            case 10:
              controller.operationRevision++;
              if (gotoVisible) controller.presentationOrder = presentationOrder === void 0 ? ++presentationSequence : presentationOrder;
              if (!gotoVisible || !groupOperation) (_groups$get = groups.get(group)) === null || _groups$get === void 0 || _groups$get.reservations.delete(element);
              if (forceRepop && (!element.hidden || controller.transition)) {
                controller.stop();
                element.hidden = true;
                openPresentElements.delete(element);
                syncAriaExpanded(element, controller);
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
              controller.setTriggerExpanded(gotoVisible);
              setPhase(element, "pop", "0");
              setPhase(element, "unpop", "0");
              element.style.setProperty("--ae-pop-progress", "0");
              element.style.setProperty("--ae-unpop-progress", "0");
              root.getComputedStyle(element).getPropertyValue("--ae-pop-progress");
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
                _context2.n = 12;
                break;
              }
              _context2.n = 11;
              return prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation);
            case 11:
              size = _context2.v;
            case 12:
              if (!(controller.transition !== transition)) {
                _context2.n = 13;
                break;
              }
              return _context2.a(2);
            case 13:
              if (controller.motionEnabled) {
                controller.classList.add(className.willChange);
              }
              if (!waitForPreparation) {
                _context2.n = 14;
                break;
              }
              prepared = new Promise(function(resolve) {
                transition.timeout = setTimeout(function() {
                  transition.timeout = null;
                  resolve();
                }, TRANSITION_PREPARE_TIME);
              });
              _context2.n = 14;
              return Promise.race([prepared, interrupted]);
            case 14:
              transition.className = className["".concat(newDirection).concat(PING).toLowerCase()];
              duration = root.getComputedStyle(element).getPropertyValue("--ae-".concat(newDirection, "-duration").toLowerCase()).trim();
              timeMs = getString2Time(duration);
              activateTransition = function activateTransition2() {
                if (controller.transition !== transition) return;
                controller.classList.remove(className.pop, className.popping, className.unpopping);
                controller.classList.add(transition.className);
                if (interpolatedProgress) {
                  element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
                  element.style.setProperty("--ae-unpop-progress", "clamp(0, var(--ae-present-unpop-phase), 1)");
                }
                setPhase(element, gotoVisible ? "pop" : "unpop", "1");
                if (size) {
                  if (controller.measuredHeight) {
                    element.style.setProperty("max-height", "".concat(gotoVisible ? size.height : 0, "px"), "important");
                  }
                  if (controller.measuredWidth) {
                    element.style.setProperty("max-width", "".concat(gotoVisible ? size.width : 0, "px"), "important");
                  }
                }
              };
              advancedEase = root.getComputedStyle(element).getPropertyValue("--ae-".concat(newDirection, "-aellux-ease").toLowerCase()).trim() || void 0;
              motionOptions = {
                extension: extensionName,
                id: controller.motionId,
                apply: activateTransition,
                easing: advancedEase,
                nativeDuration: timeMs,
                maxFPS: AelluxJs.layoutMaxFPS ? AelluxJs.layoutMaxFPS(element) : void 0,
                abort: function abort() {
                  return controller.transition !== transition || !element.isConnected;
                }
              };
              completed = AelluxJs.motion ? AelluxJs.motion.run(element, motionOptions) : legacyMotionRun(motionOptions, transition);
              AelluxJs.dispatchFrom(element, "Layout", {
                detail: {
                  origin: "present.".concat(newDirection).toLowerCase(),
                  durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
                },
                bubbles: true
              });
              if (!(controller.transition !== transition || !element.isConnected)) {
                _context2.n = 15;
                break;
              }
              return _context2.a(2);
            case 15:
              autoUnpopValue = gotoVisible && element.getAttribute(attr.autoUnpop);
              if (autoUnpopValue) {
                _duration = getString2Time(autoUnpopValue);
                if (Number.isFinite(_duration) && _duration >= 0) {
                  emitAutoUnpopProgress(element, 0, _duration);
                }
              }
              if (!(controller.transition !== transition || !element.isConnected)) {
                _context2.n = 16;
                break;
              }
              return _context2.a(2);
            case 16:
              AelluxJs.dispatchFrom(element, "".concat(newDirection).concat(PING), {
                bubbles: true
              });
              _context2.n = 17;
              return Promise.race([completed, interrupted]);
            case 17:
              motionResult = _context2.v;
              if (!(controller.transition !== transition || motionResult && motionResult.status !== "completed")) {
                _context2.n = 18;
                break;
              }
              return _context2.a(2);
            case 18:
              finishTransition(element, controller, transition, gotoVisible);
              if (gotoVisible && !element.hidden) {
                autoUnpopSchedule(element, controller);
                controller.classList.add(className.pop);
                AelluxJs.dispatchFrom(element, POP, {
                  bubbles: true
                });
              }
              if (!gotoVisible && element.hidden) {
                AelluxJs.dispatchFrom(element, UNPOP, {
                  bubbles: true
                });
              }
              _context2.n = 23;
              break;
            case 19:
              _context2.p = 19;
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
              _context2.n = _t2 === AelluxJs.diagnostics.WARN_INTERRUPTION.code ? 20 : 22;
              break;
            case 20:
              if (!(transition && transition.cancelled)) {
                _context2.n = 21;
                break;
              }
              return _context2.a(3, 23);
            case 21:
              AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_INTERRUPTION, {
                cause: _t,
                extension: extensionName,
                element: element,
                replacement: transition && transition.replacement === true
              });
              return _context2.a(3, 23);
            case 22:
              AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION, {
                cause: _t,
                extension: extensionName,
                element: element
              });
              return _context2.a(3, 23);
            case 23:
              _context2.p = 23;
              if (transition && controller.transition === transition) {
                controller.transition = null;
                controller.classList.remove(className.willChange);
              }
              return _context2.f(23);
            case 24:
              return _context2.a(2);
          }
        }, _callee2, null, [[7, 19, 23, 24]]);
      }));
      return _presentTransition.apply(this, arguments);
    }
    function legacyMotionRun(options, transition) {
      options.apply();
      return new Promise(function(resolve) {
        transition.timeout = setTimeout(function() {
          transition.timeout = null;
          resolve({
            id: options.id,
            status: "completed",
            mode: "native"
          });
        }, Math.max(0, Number(options.nativeDuration) || 0));
      });
    }
    function finishTransition(element, controller, transition, gotoVisible) {
      controller.classList.toggle(className.pop, gotoVisible);
      controller.classList.remove(transition.className);
      restoreMeasuredStyles(element, controller);
      var focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
      element.hidden = gotoVisible ? false : true;
      setProgress(element, gotoVisible);
      syncAriaExpanded(element, controller);
      refreshExpandedStates();
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
    }
    function autoUnpopSchedule(element, controller) {
      if (!controller) return;
      cancelAutoUnpop(controller);
      var autoUnpopValue = element.getAttribute(attr.autoUnpop);
      if (element.hidden || controller.transition && !controller.classList.contains(className.pop) || !element.isConnected || !autoUnpopValue) return;
      var duration = getString2Time(autoUnpopValue);
      if (!Number.isFinite(duration) || duration < 0) return;
      var countdown = {
        start: root.performance.now(),
        duration: duration,
        frame: null,
        last: 0
      };
      controller.autoCountdown = countdown;
      var valid = function valid2() {
        return controller.autoCountdown === countdown && presentElements.get(element) === controller && element.isConnected;
      };
      var emit = function emit2(completed) {
        var initial = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        var elapsedMs = initial ? 0 : Math.min(duration, Math.max(0, root.performance.now() - countdown.start));
        emitAutoUnpopProgress(element, elapsedMs, duration, completed);
      };
      var _tick = function tick() {
        var _AelluxJs$layoutMaxFP;
        if (!valid()) {
          if (controller.autoCountdown === countdown) cancelAutoUnpop(controller);
          return;
        }
        var now = root.performance.now();
        var fps = ((_AelluxJs$layoutMaxFP = AelluxJs.layoutMaxFPS) === null || _AelluxJs$layoutMaxFP === void 0 ? void 0 : _AelluxJs$layoutMaxFP.call(AelluxJs, element)) || AelluxJs.options.cssMotionPropertyMaxFPS || 55;
        if (now - countdown.last >= 1e3 / fps) {
          countdown.last = now;
          emit(false);
        }
        if (valid()) countdown.frame = root.requestAnimationFrame(_tick);
      };
      controller.autoUnpopTimeout = setTimeout(function() {
        if (!valid()) {
          if (controller.autoCountdown === countdown) cancelAutoUnpop(controller);
          return;
        }
        if (countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
        countdown.frame = null;
        controller.autoUnpopTimeout = null;
        emit(true);
        if (!valid()) return;
        controller.autoCountdown = null;
        unpop(element);
      }, duration);
      emit(false, true);
      if (valid()) countdown.frame = root.requestAnimationFrame(_tick);
    }
    function emitAutoUnpopProgress(element, elapsedMs, duration) {
      var completed = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
      AelluxJs.dispatchFrom(element, "Progress", {
        bubbles: false,
        cancelable: false,
        detail: {
          value: completed ? 1 : duration ? elapsedMs / duration : 0,
          max: 1,
          status: completed ? "completed" : "running",
          elapsedMs: elapsedMs,
          durationMs: duration,
          remainingMs: Math.max(0, duration - elapsedMs)
        }
      });
    }
    function cancelAutoUnpop(controller) {
      if (controller.autoUnpopTimeout !== null) clearTimeout(controller.autoUnpopTimeout);
      var countdown = controller.autoCountdown;
      if (countdown && countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
      controller.autoUnpopTimeout = null;
      controller.autoCountdown = null;
    }
    function clickAutoUnpop(eventTarget, currentExceptions) {
      var _iterator0 = _createForOfIteratorHelper(openPresentElements), _step0;
      try {
        var _loop = function _loop2() {
          var pContainer = _step0.value;
          if (pContainer.hidden === true || currentExceptions.some(function(e) {
            return pContainer.contains(e);
          })) return 0;
          var mode = (pContainer.getAttribute(attr.unpopOnClick) || "outside").trim().toLowerCase();
          if (mode === "false" || mode === "none") return 0;
          var inside = pContainer.contains(eventTarget);
          if (inside === (mode === "inside" || mode === "in")) unpop(pContainer);
        }, _ret;
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done; ) {
          _ret = _loop();
          if (_ret === 0) continue;
        }
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
    }
    function refreshChangedTrigger(button) {
      if (!triggerElementsSet.has(button)) return;
      var value = button.getAttribute(attr.dismiss) || button.getAttribute(attr.target);
      if (value !== indexedTriggerValues.get(button)) refreshTriggerTargets(button);
    }
    function OnClick(event) {
      var target = activationTarget(event);
      if (!target) return;
      var matched;
      var _iterator1 = _createForOfIteratorHelper(pendingTaps), _step1;
      try {
        for (_iterator1.s(); !(_step1 = _iterator1.n()).done; ) {
          var _pending$event$detail, _pending$event$detail2;
          var pending = _step1.value;
          var pointerId = event.pointerId;
          var compatibilityClick = event.pointerType === "mouse" && ["touch", "pen"].includes((_pending$event$detail = pending.event.detail) === null || _pending$event$detail === void 0 ? void 0 : _pending$event$detail.pointerType);
          if (!compatibilityClick && typeof pointerId === "number" && typeof ((_pending$event$detail2 = pending.event.detail) === null || _pending$event$detail2 === void 0 ? void 0 : _pending$event$detail2.pointerId) === "number" && pointerId !== pending.event.detail.pointerId) continue;
          if (pending.target === target || pending.target.contains(target) || target.contains(pending.target)) matched = pending;
        }
      } catch (err) {
        _iterator1.e(err);
      } finally {
        _iterator1.f();
      }
      if (matched) cancelPendingTap(matched);
      activate(event, target);
    }
    function activationTarget(event) {
      var path = event.composedPath ? event.composedPath() : [];
      var target = path[0] || event.target;
      return target !== null && target !== void 0 && target.closest ? target : null;
    }
    function onTap(event) {
      var _AelluxJs$mountManage;
      var target = activationTarget(event);
      if (!target) return;
      var control = target.closest("[".concat(attr.trigger, "],[").concat(attr.dismiss, "]"));
      if (control) refreshChangedTrigger(control);
      var pending = {
        event: event,
        target: target,
        hoverSuppressed: control && suppressHoverClick(control, event),
        present: triggerTargets.get(control),
        point: (_AelluxJs$mountManage = AelluxJs.mountManager.controller(target)) === null || _AelluxJs$mountManage === void 0 ? void 0 : _AelluxJs$mountManage.point,
        timer: null
      };
      pendingTaps.add(pending);
      pending.timer = setTimeout(function() {
        var _AelluxJs$mountManage2;
        pendingTaps.delete(pending);
        if (!target.isConnected || pending.point && ((_AelluxJs$mountManage2 = AelluxJs.mountManager.controller(target)) === null || _AelluxJs$mountManage2 === void 0 ? void 0 : _AelluxJs$mountManage2.point) !== pending.point) return;
        activate(event, target, pending.hoverSuppressed);
      }, TAP_CLICK_WAIT_TIME);
    }
    function cancelPendingTap(pending) {
      clearTimeout(pending.timer);
      pendingTaps.delete(pending);
    }
    function cancelElementTaps(element) {
      var _iterator10 = _createForOfIteratorHelper(pendingTaps), _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
          var pending = _step10.value;
          if (element.contains(pending.target) || pending.present === element) cancelPendingTap(pending);
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
    }
    function activate(event, eventTarget, hoverSuppressed) {
      var container = eventTarget.closest(presentSelector);
      var exceptions = [];
      var button;
      button = eventTarget.closest("[".concat(attr.trigger, "]"));
      if (button) {
        refreshChangedTrigger(button);
        var triggerAttr = button.getAttribute(attr.trigger);
        var targetSelector = button.getAttribute(attr.target);
        if (targetSelector) {
          var target = targetById(targetSelector);
          diagnoseTarget(button, target, attr.target, targetSelector);
          if (target) {
            exceptions.push(target);
            if (!(hoverSuppressed !== null && hoverSuppressed !== void 0 ? hoverSuppressed : suppressHoverClick(button, event))) trigger(target, triggerAttr);
          }
        } else if (container) {
          exceptions.push(container);
          if (!(hoverSuppressed !== null && hoverSuppressed !== void 0 ? hoverSuppressed : suppressHoverClick(button, event))) trigger(container, triggerAttr);
        } else {
          AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING, {
            extension: extensionName,
            element: button,
            action: "trigger"
          });
        }
      }
      button = eventTarget.closest("[".concat(attr.dismiss, "]"));
      if (button) {
        refreshChangedTrigger(button);
        var dismiss = button.getAttribute(attr.dismiss);
        var _targetSelector = button.getAttribute(attr.target);
        if (dismiss || _targetSelector) {
          var _target = targetById(dismiss || _targetSelector);
          diagnoseTarget(button, _target, dismiss ? attr.dismiss : attr.target, dismiss || _targetSelector);
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
      clickAutoUnpop(eventTarget, exceptions);
    }
    function diagnoseTarget(element, target, attribute, value) {
      if (!targetIdFor(value)) return;
      if (target && target.hasAttribute(attr.present)) return;
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_TARGET, {
        extension: extensionName,
        element: element,
        attribute: attribute,
        value: value,
        reason: target ? "Target is not a Present container." : "Target element was not found.",
        suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
      });
    }
    function syncAriaExpanded(element, controller) {
      var visible = element.isConnected;
      var visibility = root.getComputedStyle(element).visibility;
      if (visibility === "hidden" || visibility === "collapse") visible = false;
      for (var current = element; visible && current; current = current.parentElement) {
        var style = root.getComputedStyle(current);
        if (style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) visible = false;
      }
      if (controller.expanded !== visible) controller.setAriaExpanded(String(visible));
    }
    function refreshExpandedStates() {
      var _iterator11 = _createForOfIteratorHelper(presentElements), _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
          var _step11$value = _slicedToArray(_step11.value, 2), element = _step11$value[0], controller = _step11$value[1];
          if (!controller.transition) syncAriaExpanded(element, controller);
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
    }
    function setProgress(element, visible) {
      setPhase(element, "pop", visible ? "1" : "0");
      setPhase(element, "unpop", visible ? "0" : "1");
      element.style.setProperty("--ae-pop-progress", visible ? "1" : "0");
      element.style.setProperty("--ae-unpop-progress", visible ? "0" : "1");
    }
    function setPhase(element, direction, value) {
      element.style.setProperty("--ae-present-".concat(direction, "-phase"), value);
      if (!interpolatedProgress) element.style.setProperty("--ae-".concat(direction, "-progress"), value);
    }
    function groupMembers(group) {
      var includeUnidentified = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
      return _toConsumableArray(presentElements.keys()).filter(function(element) {
        return element.isConnected && element !== group && (includeUnidentified || element.id) && element.closest(groupSelector) === group;
      });
    }
    function groupLimit(group, state) {
      var value = group.getAttribute(attr.group);
      if (state.limitValue === value) return state.limit;
      state.limitValue = value;
      var text = (value || "").trim();
      var limit = text === "" ? 1 : Number(text);
      var valid = text === "" || /^\d+$/.test(text) && Number.isSafeInteger(limit) && limit > 0;
      state.limit = valid ? limit : 1;
      if (!valid) AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: extensionName,
        element: group,
        attribute: attr.group,
        value: value,
        reason: "Present Group capacity must be a positive integer.",
        suggestion: "Use a positive integer, or leave the attribute empty for a capacity of 1."
      });
      return state.limit;
    }
    function groupMemberActive(member, state) {
      var _presentElements$get5;
      return state.reservations.has(member) || !member.hidden && ((_presentElements$get5 = presentElements.get(member)) === null || _presentElements$get5 === void 0 ? void 0 : _presentElements$get5.direction) !== UNPOP;
    }
    function activeGroupMembers(group, state) {
      return groupMembers(group, true).filter(function(member) {
        return groupMemberActive(member, state);
      });
    }
    function mountGroup(group) {
      if (groups.has(group)) return;
      var visible = groupMembers(group).filter(function(member) {
        return !member.hidden;
      });
      groups.set(group, {
        selected: visible.length === 1 ? visible[0] : null,
        accumulating: false,
        reservations: /* @__PURE__ */ new Map(),
        revision: 0,
        pending: Promise.resolve(true),
        jobs: /* @__PURE__ */ new Map(),
        memory: AelluxJs.persist.element.save(group, [attr.active])
      });
      groupLimit(group, groups.get(group));
      if (!groupObserver && typeof root.MutationObserver === "function") {
        groupObserver = new root.MutationObserver(function(records) {
          if (records.some(function(record) {
            return record.type === "childList" || record.attributeName !== "class" || groups.has(record.target);
          })) queueGroups();
        });
        groupObserver.observe(document, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["class", "id", attr.active, attr.when, attr.group]
        });
      }
      queueGroups();
    }
    function unmountGroup(group) {
      var state = groups.get(group);
      if (!state) return;
      state.revision++;
      groups.delete(group);
      state.jobs.clear();
      state.reservations.clear();
      publishGroup(group, state, null);
      var _iterator12 = _createForOfIteratorHelper(groupMembers(group)), _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done; ) {
          var member = _step12.value;
          var controller = presentElements.get(member);
          if (controller.transition) {
            var visible = controller.direction === POP;
            controller.stop();
            member.hidden = !visible;
            controller.classList.toggle(className.pop, visible);
            controller.setTriggerExpanded(visible);
            setProgress(member, visible);
            syncAriaExpanded(member, controller);
            if (!visible) openPresentElements.delete(member);
          }
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
      state.memory.restore();
      if (!groups.size && groupObserver) {
        groupObserver.disconnect();
        groupObserver = null;
      }
    }
    function queueGroups() {
      if (groupsQueued || !groups.size) return;
      groupsQueued = true;
      Promise.resolve().then(function() {
        groupsQueued = false;
        groups.forEach(function(state, group) {
          reconcileGroup(group);
          if (groups.get(group) === state) publishGroup(group, state, state.selected);
        });
      });
    }
    function groupDiagnostic(group, reason) {
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_PRESENT_GROUP_SELECTION, {
        extension: extensionName,
        element: group,
        attribute: attr.active,
        value: group.getAttribute(attr.active),
        reason: reason,
        suggestion: "Use unique native IDs on Present members of this group; select one ID or one matching condition."
      });
    }
    function reconcileGroup(group) {
      var exclusive = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
      if (!group.isConnected || !group.hasAttribute(attr.group)) return;
      var members = groupMembers(group);
      var state = groups.get(group);
      groupLimit(group, state);
      if (state.accumulating) {
        if (!exclusive && state.accumulationInputs === selectionInputs(group)) return;
      }
      if (!members.includes(state.selected)) state.selected = null;
      var matches;
      if (group.hasAttribute(attr.active)) {
        var id = group.getAttribute(attr.active);
        matches = id === "" ? [] : members.filter(function(member) {
          return member.id === id;
        });
        if (id && matches.length !== 1) {
          groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
          return;
        }
      } else {
        matches = members.filter(function(member) {
          var token = member.getAttribute(attr.when);
          return token && !/\s/.test(token) && group.classList.contains(token);
        });
        if (!matches.length) {
          var visible = members.filter(function(member) {
            return !member.hidden && presentElements.get(member).direction !== UNPOP;
          });
          if (visible.length > 1) groupDiagnostic(group, "Multiple initially visible members.");
          else if (!state.selected) state.selected = visible[0] || null;
          return;
        }
      }
      if (matches.length > 1) {
        groupDiagnostic(group, "Multiple members match the container classes.");
        return;
      }
      return selectGroup(group, matches[0] || null, members);
    }
    function show(group, id) {
      var state = groups.get(group);
      if (!state || typeof id !== "string") return Promise.resolve(false);
      var matches = groupMembers(group).filter(function(member) {
        return member.id === id;
      });
      if (id && matches.length !== 1) {
        groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
        return Promise.resolve(false);
      }
      if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
      var result = reconcileGroup(group, true);
      return Promise.resolve(result === void 0 ? state.pending : result);
    }
    function selectionInputs(group) {
      return JSON.stringify([group.getAttribute(attr.active), groupMembers(group).filter(function(member) {
        var token = member.getAttribute(attr.when);
        return token && !/\s/.test(token) && group.classList.contains(token);
      }).map(function(member) {
        return member.id;
      }).sort()]);
    }
    function popNext(group, prepare) {
      var state = groups.get(group);
      if (!state || !group.isConnected || !group.hasAttribute(attr.group)) return Promise.resolve(null);
      var members = Array.from(group.children).filter(function(member2) {
        return member2 !== group && member2.hasAttribute(attr.present) && presentElements.has(member2) && member2.closest(groupSelector) === group;
      });
      var limit = groupLimit(group, state);
      var active = activeGroupMembers(group, state);
      var inactive = members.filter(function(member2) {
        return !groupMemberActive(member2, state);
      });
      var closed = inactive.filter(function(member2) {
        return member2.hidden;
      });
      var available = closed.length ? closed : inactive;
      var candidates = active.length < limit && available.length ? available : members.filter(function(member2) {
        return active.includes(member2);
      }).sort(function(left, right) {
        var order = function order2(member2) {
          var _state$reservations$g;
          return ((_state$reservations$g = state.reservations.get(member2)) === null || _state$reservations$g === void 0 ? void 0 : _state$reservations$g.order) || presentElements.get(member2).presentationOrder;
        };
        return order(right) - order(left);
      });
      var member = candidates[candidates.length - 1];
      if (!member) return Promise.resolve(null);
      var entering = !state.accumulating;
      if (entering) {
        state.revision++;
        state.jobs.clear();
        state.accumulating = true;
        state.accumulationInputs = selectionInputs(group);
        state.selected = null;
      }
      var controller = presentElements.get(member);
      var revision = state.revision;
      var capacity = group.getAttribute(attr.group);
      var inputs = selectionInputs(group);
      var previousReservation = state.reservations.get(member);
      var reservation = {
        revision: controller.operationRevision,
        order: ++presentationSequence
      };
      state.reservations.set(member, reservation);
      group.insertBefore(member, members[0]);
      var valid = function valid2() {
        var preflight = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        return groups.get(group) === state && state.revision === revision && state.accumulating && state.reservations.get(member) === reservation && presentElements.get(member) === controller && controller.operationRevision === reservation.revision && (!preflight || group.getAttribute(attr.group) === capacity && selectionInputs(group) === inputs) && member.isConnected && member.parentElement === group && member.closest(groupSelector) === group;
      };
      var release = function release2() {
        var restore = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        if (state.reservations.get(member) !== reservation) return;
        if (restore && previousReservation && groups.get(group) === state && state.revision === revision && state.accumulating && presentElements.get(member) === controller && previousReservation.revision === controller.operationRevision && member.isConnected && member.closest(groupSelector) === group) {
          state.reservations.set(member, previousReservation);
        } else state.reservations.delete(member);
      };
      var job;
      try {
        if (entering) publishGroup(group, state, null);
        if (!valid(true)) {
          release(true);
          return Promise.resolve(null);
        }
        if (typeof prepare === "function") prepare(member);
        if (!valid(true) || !AelluxJs.dispatchFrom(member, "BeforePop", {
          bubbles: true,
          cancelable: true
        }) || !valid(true)) {
          release(true);
          return Promise.resolve(null);
        }
        reservation.revision++;
        job = presentTransition(member, true, true, true, reservation.order);
      } catch (error) {
        release(true);
        return Promise.reject(error);
      }
      return job.then(function() {
        return valid() && !member.hidden && presentElements.get(member).direction === POP ? member : null;
      }).finally(function() {
        return release();
      });
    }
    function selected(group) {
      var state = groups.get(group);
      var member = state && state.selected;
      return member && member !== group && presentElements.has(member) && member.isConnected && member.id && member.closest(groupSelector) === group ? member : null;
    }
    function publishGroup(group, state, current) {
      if (state.announced === current) return;
      var previous = state.announced || null;
      state.announced = current;
      AelluxJs.dispatchFrom(group, "PresentGroupChange", {
        bubbles: true,
        detail: {
          group: group,
          previous: previous,
          current: current,
          key: current && current.id
        }
      });
    }
    function selectGroup(group, selected2, members) {
      var state = groups.get(group);
      var changes = members.filter(function(member2) {
        var controller = presentElements.get(member2);
        return member2 === selected2 ? member2.hidden || controller.direction === UNPOP : !member2.hidden && controller.direction !== UNPOP;
      });
      if (state.selected === selected2 && !changes.length) {
        state.accumulating = false;
        state.reservations.clear();
        return state.pending;
      }
      var revision = ++state.revision;
      var active = group.getAttribute(attr.active);
      var classes = group.getAttribute("class");
      var ids = members.map(function(member2) {
        return member2.id;
      });
      var conditions = members.map(function(member2) {
        return member2.getAttribute(attr.when);
      });
      var valid = function valid2() {
        return groups.get(group) === state && state.revision === revision && group.isConnected && group.hasAttribute(attr.group) && group.getAttribute(attr.active) === active && group.getAttribute("class") === classes && groupMembers(group).length === members.length && members.every(function(member2, index) {
          return presentElements.has(member2) && member2.isConnected && member2.closest(groupSelector) === group && member2.id === ids[index] && member2.getAttribute(attr.when) === conditions[index];
        });
      };
      var _iterator13 = _createForOfIteratorHelper(changes), _step13;
      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done; ) {
          var member = _step13.value;
          var allowed = AelluxJs.dispatchFrom(member, member === selected2 ? "BeforePop" : "BeforeUnpop", {
            bubbles: true,
            cancelable: true
          });
          if (!valid()) {
            queueGroups();
            return false;
          }
          if (!allowed) {
            if (state.accumulating) {
              state.accumulationInputs = selectionInputs(group);
              return false;
            }
            if (state.revision === revision) {
              var _state$selected;
              var id = ((_state$selected = state.selected) === null || _state$selected === void 0 ? void 0 : _state$selected.id) || "";
              if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
            }
            return false;
          }
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }
      state.accumulating = false;
      state.reservations.clear();
      state.selected = selected2;
      var complete;
      var pending = new Promise(function(resolve) {
        complete = resolve;
      });
      state.pending = pending;
      var _iterator14 = _createForOfIteratorHelper(changes), _step14;
      try {
        var _loop2 = function _loop22() {
          var member2 = _step14.value;
          var job = presentTransition(member2, member2 === selected2, false, true);
          if (groups.get(group) !== state || state.revision !== revision) {
            complete(false);
            return {
              v: pending
            };
          }
          state.jobs.set(member2, job);
          job.then(function() {
            if (state.jobs.get(member2) === job) state.jobs.delete(member2);
          });
        }, _ret2;
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done; ) {
          _ret2 = _loop2();
          if (_ret2) return _ret2.v;
        }
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }
      publishGroup(group, state, selected2);
      Promise.all(members.map(function(member2) {
        return state.jobs.get(member2);
      })).then(function() {
        var current = groupMembers(group);
        complete(groups.get(group) === state && state.revision === revision && (!selected2 || current.includes(selected2)) && current.every(function(member2) {
          return member2 === selected2 ? !member2.hidden : member2.hidden;
        }));
      });
      return pending;
    }
    function cancelHoverClose(target) {
      clearTimeout(hoverTimers.get(target));
      hoverTimers.delete(target);
    }
    function inHoverRegion(target, node) {
      if (!node || !node.nodeType) return false;
      if (target.contains(node)) return true;
      var _iterator15 = _createForOfIteratorHelper(triggerElementsSet), _step15;
      try {
        for (_iterator15.s(); !(_step15 = _iterator15.n()).done; ) {
          var button = _step15.value;
          if (button.getAttribute(attr.triggerOn) === "hover" && triggerTargets.get(button) === target && button.contains(node)) return true;
        }
      } catch (err) {
        _iterator15.e(err);
      } finally {
        _iterator15.f();
      }
      return false;
    }
    function suppressHoverClick(button, event) {
      var _event$detail;
      var pointerType = event.pointerType || ((_event$detail = event.detail) === null || _event$detail === void 0 ? void 0 : _event$detail.pointerType);
      var pointerActivation = typeof event.detail === "number" ? event.detail > 0 : !!pointerType;
      return button.getAttribute(attr.triggerOn) === "hover" && pointerActivation && pointerType !== "touch" && hoveredTriggers.has(button);
    }
    function onHover(event) {
      var _event$target;
      if (event.pointerType === "touch" || !((_event$target = event.target) !== null && _event$target !== void 0 && _event$target.closest)) return;
      var entering = event.type === "pointerover";
      var button = event.target.closest("[".concat(attr.trigger, "][").concat(attr.triggerOn, '="hover"]'));
      if (button && triggerElementsSet.has(button) && !button.contains(event.relatedTarget)) {
        refreshChangedTrigger(button);
        var target = triggerTargets.get(button);
        if (target && presentElements.has(target)) {
          if (entering) {
            cancelHoverClose(target);
            hoveredTriggers.add(button);
            var action = button.getAttribute(attr.trigger);
            if (action === "pop") toggle(target, true);
            else trigger(target, action);
          } else hoveredTriggers.delete(button);
        }
      }
      var _iterator16 = _createForOfIteratorHelper(openPresentElements), _step16;
      try {
        var _loop3 = function _loop32() {
          var target2 = _step16.value;
          if (!inHoverRegion(target2, event.target)) return 1;
          if (entering || inHoverRegion(target2, event.relatedTarget)) cancelHoverClose(target2);
          else if (_toConsumableArray(triggerElementsSet).some(function(control) {
            return triggerTargets.get(control) === target2 && control.getAttribute(attr.triggerOn) === "hover" && control.getAttribute(attr.trigger) !== "unpop";
          })) {
            cancelHoverClose(target2);
            hoverTimers.set(target2, setTimeout(function() {
              hoverTimers.delete(target2);
              if (presentElements.has(target2) && target2.isConnected && !inHoverRegion(target2, document.activeElement)) unpop(target2);
            }, 120));
          }
        };
        for (_iterator16.s(); !(_step16 = _iterator16.n()).done; ) {
          if (_loop3()) continue;
        }
      } catch (err) {
        _iterator16.e(err);
      } finally {
        _iterator16.f();
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
