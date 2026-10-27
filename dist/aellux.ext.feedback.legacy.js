(function() {
  // src/src/aellux.ext.feedback.js
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
    var extensionName = "feedback";
    if (!AelluxJs) {
      throw new Error('[aellux.js] Cannot attach the "'.concat(extensionName, '" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.'));
    }
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      warning: warning,
      error: error,
      success: success,
      announce: announce,
      busy: busy,
      validate: validate,
      progress: progress,
      on: on,
      off: off,
      send: send
    });
    var motionOptions = ["shake", "yes", "no", "breathe", "tremble", "pulse", "alert"];
    var feedbackTypes = ["warning", "error", "success", "announce", "busy", "progress", "validate"];
    var handlers = /* @__PURE__ */ new Map();
    var motionOperations = /* @__PURE__ */ new Map();
    var motionIds = /* @__PURE__ */ new WeakMap();
    var feedbackAttribute = AelluxJs.attr(extensionName);
    var messageTargetAttribute = AelluxJs.attr("messageTarget");
    var transformTargetAttribute = AelluxJs.attr("transformTarget");
    var presentTargetAttribute = AelluxJs.attr("presentTarget");
    var presentSelector = "[".concat(AelluxJs.attr("present"), "]");
    function init() {
      AelluxJs.mountManager.add({
        extensionName: extensionName,
        selector: "[".concat(feedbackAttribute, "]"),
        priority: 0,
        mount: mountFeedback,
        unmount: unmountFeedback,
        controllers: feedbackTypes.concat("send")
      });
    }
    function destroy() {
      return _destroy.apply(this, arguments);
    }
    function _destroy() {
      _destroy = _asyncToGenerator(/* @__PURE__ */ _regenerator().m(function _callee() {
        var _iterator2, _step2, operation;
        return _regenerator().w(function(_context) {
          while (1) switch (_context.n) {
            case 0:
              AelluxJs.mountManager.remove({
                extensionName: extensionName
              });
              _iterator2 = _createForOfIteratorHelper(motionOperations.values());
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
                  operation = _step2.value;
                  AelluxJs.motion.cancel(operation.id);
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              motionOperations.clear();
              handlers.clear();
            case 1:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _destroy.apply(this, arguments);
    }
    function mountFeedback(element) {
      AelluxJs.onEvent(element, "Feedback", onFeedback);
    }
    function unmountFeedback(element) {
      AelluxJs.offEvent(element, "Feedback", onFeedback);
    }
    function onFeedback(event) {
      var element = event.currentTarget;
      var value = element.getAttribute(feedbackAttribute);
      if (value === null) return;
      var list = value.trim();
      if (list) {
        var _type = event.detail && event.detail.type;
        var names = list.split(/\s+/);
        if (!names.includes(_type)) {
          return;
        }
      }
      event.stopPropagation();
      if (!event.detail) return;
      var _event$detail = event.detail, message = _event$detail.message, type = _event$detail.type, motion = _event$detail.motion;
      var messageTarget = element.getAttribute(messageTargetAttribute);
      var transformTarget = element.getAttribute(transformTargetAttribute);
      var messageElement = AelluxJs.elementOrId(messageTarget, {
        defaultElement: element
      });
      var transformElement = AelluxJs.elementOrId(transformTarget, {
        defaultElement: element
      });
      if (messageElement && typeof message === "string") {
        var textNode = null;
        var _iterator = _createForOfIteratorHelper(messageElement.childNodes), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var child = _step.value;
            if (child.nodeType === 3) {
              textNode = child;
              break;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        if (textNode) textNode.nodeValue = message;
        else messageElement.appendChild(messageElement.ownerDocument.createTextNode(message));
      }
      if (feedbackTypes.includes(type)) {
        var typeClass = AelluxJs.className("feedback-".concat(type));
        for (var _i = 0, _arr = [element, messageElement, transformElement]; _i < _arr.length; _i++) {
          var target = _arr[_i];
          if (target) target.classList.add(typeClass);
        }
      }
      var presentTarget = element.getAttribute(presentTargetAttribute);
      var present = AelluxJs.ext.present;
      if (presentTarget !== null && present !== null && present !== void 0 && present.initialized) {
        if (presentTarget.trim()) {
          var presentElement = AelluxJs.elementOrId(presentTarget);
          if (presentElement) present.pop(presentElement);
        } else {
          var _target = (messageElement === null || messageElement === void 0 ? void 0 : messageElement.closest(presentSelector)) || (transformElement === null || transformElement === void 0 ? void 0 : transformElement.closest(presentSelector));
          if (_target) present.pop(_target);
        }
      }
      if (transformElement) {
        var motionPrefix = AelluxJs.className("feedback-motion-");
        for (var _i2 = 0, _Array$from = Array.from(transformElement.classList); _i2 < _Array$from.length; _i2++) {
          var className = _Array$from[_i2];
          if (className.startsWith(motionPrefix)) transformElement.classList.remove(className);
        }
        var previous = motionOperations.get(transformElement);
        if (previous) AelluxJs.motion.cancel(previous.id);
        motionOperations.delete(transformElement);
        if (typeof motion === "string") {
          var motionClass = AelluxJs.className("feedback-motion-".concat(motion));
          var id = motionIds.get(transformElement);
          if (id === void 0) {
            id = AelluxJs.motion.id();
            motionIds.set(transformElement, id);
          }
          var operation = {
            id: id,
            className: motionClass
          };
          motionOperations.set(transformElement, operation);
          var advancedEase = root.getComputedStyle(transformElement).getPropertyValue("--ae-feedback-aellux-ease").trim() || void 0;
          AelluxJs.motion.run(transformElement, {
            extension: extensionName,
            id: id,
            apply: function apply() {
              return transformElement.classList.add(motionClass);
            },
            easing: advancedEase,
            abort: function abort() {
              return !transformElement.isConnected;
            }
          }).catch(function(cause) {
            AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION, {
              cause: cause,
              extension: extensionName,
              element: transformElement
            });
          }).finally(function() {
            if (motionOperations.get(transformElement) !== operation) return;
            transformElement.classList.remove(motionClass);
            motionOperations.delete(transformElement);
          });
        }
      }
    }
    function on(type, handler) {
      if (!handlers.has(type)) {
        handlers.set(type, /* @__PURE__ */ new Set());
      }
      handlers.get(type).add(handler);
      return {
        off: function off2() {
          removeHandler(type, handler);
        }
      };
    }
    function off(type, handler) {
      return removeHandler(type, handler);
    }
    function warning(message, target, value, motion) {
      publish("warning", message, target, value, motion);
    }
    function error(message, target, value, motion) {
      publish("error", message, target, value, motion);
    }
    function success(message, target, value, motion) {
      publish("success", message, target, value, motion);
    }
    function announce(message, target, value, motion) {
      publish("announce", message, target, value, motion);
    }
    function busy(message, target, value, motion) {
      publish("busy", message, target, value, motion);
    }
    function validate(message, target, value, motion) {
      publish("validate", message, target, value, motion);
    }
    function progress(message, target, value, motion) {
      publish("progress", message, target, value, motion);
    }
    function publish(type, message, target, value, motion) {
      if (message && message.nodeType === 1) {
        var element = message;
        message = target;
        target = element;
      }
      send({
        type: type,
        message: message,
        value: value,
        target: target,
        motion: motion
      });
    }
    function send(input, payload) {
      var _ref = payload || input, type = _ref.type, message = _ref.message, value = _ref.value, target = _ref.target, motion = _ref.motion;
      if (input && input.nodeType === 1) target = input;
      if (typeof message !== "string") {
        reportInvalidArgument("message", message);
        return;
      }
      if (!feedbackTypes.includes(type)) {
        reportInvalidArgument("type", type);
        return;
      }
      if (typeof motion !== "undefined" && typeof motion !== "string") {
        reportInvalidArgument("motion", motion);
        return;
      }
      if (typeof target === "undefined") target = root.document;
      else if (!target || target.nodeType !== 1 || typeof target.dispatchEvent !== "function") {
        reportInvalidArgument("target", target);
        return;
      }
      if (typeof motion === "string" && !motionOptions.includes(motion)) {
        AelluxJs.diagnostics.info(AelluxJs.diagnostics.INFO_FEEDBACK_MOTION_CUSTOM, {
          extension: extensionName,
          motion: motion,
          standardMotions: motionOptions.slice()
        });
      }
      var feedback = {
        type: type,
        message: message,
        value: value,
        target: target,
        motion: motion
      };
      var options = {
        detail: feedback,
        bubbles: true,
        cancelable: true
      };
      AelluxJs.dispatchFrom(target, "Feedback", options);
      notifyHandlers(type, feedback);
      notifyHandlers("*", feedback);
    }
    function reportInvalidArgument(argument, value) {
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_FEEDBACK_ARGUMENT, {
        extension: extensionName,
        argument: argument,
        value: value
      });
    }
    function notifyHandlers(type, feedback) {
      if (!handlers.has(type)) return;
      handlers.get(type).forEach(function(call) {
        try {
          var result = call(feedback);
          if (result && typeof result.then === "function") {
            Promise.resolve(result).catch(function(error2) {
              return reportCallbackError(error2, type);
            });
          }
        } catch (error2) {
          reportCallbackError(error2, type);
        }
      });
    }
    function reportCallbackError(error2, type) {
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_CALLBACK, {
        cause: error2,
        extension: extensionName,
        type: type
      });
    }
    function removeHandler(type, handler) {
      var typeHandlers = handlers.get(type);
      if (!typeHandlers) return false;
      var removed = typeHandlers.delete(handler);
      if (typeHandlers.size === 0) handlers.delete(type);
      return removed;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.feedback.legacy.js.map
