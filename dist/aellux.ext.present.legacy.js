(function() {
  // src/src/aellux.ext.present.js
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
      unpopOnOutside: AelluxJs.attr("unpop-on-outside"),
      trigger: AelluxJs.attr("trigger"),
      //toggle,pop,unpop
      dismiss: AelluxJs.attr("dismiss"),
      //selector
      target: AelluxJs.attr("target")
      //selector
    };
    var className = {
      pop: AelluxJs.className("pop"),
      popping: AelluxJs.className("popping"),
      unpopping: AelluxJs.className("unpopping")
    };
    var mountMap = /* @__PURE__ */ new Map();
    AelluxJs.extAttach(extensionName, {
      init: init,
      destroy: destroy,
      mountMap: mountMap,
      pop: pop,
      unpop: unpop,
      toggle: toggle,
      trigger: trigger
    });
    var presentElements = /* @__PURE__ */ new Map();
    function init(options) {
      mountMap.set("[".concat(attr.present, "]"), {
        mount: mountElement,
        unmount: unmountElement
      });
      document.addEventListener("click", OnClick);
    }
    function destroy() {
      mountMap.clear();
      document.removeEventListener("click", OnClick);
      var _iterator = _createForOfIteratorHelper(presentElements.values()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var controller = _step.value;
          controller.stop();
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      presentElements.clear();
    }
    function mountElement(element) {
      var controller = {
        interruptTransition: null,
        direction: null,
        timeout: null,
        stop: function stop() {
          if (this.interruptTransition !== null && typeof this.interruptTransition === "function") {
            this.interruptTransition();
            this.interruptTransition = null;
          }
          if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }
        }
      };
      presentElements.set(element, controller);
      autoUnpopSchedule(element, controller);
    }
    function unmountElement(element) {
      if (!presentElements.has(element)) return;
      var controller = presentElements.get(element);
      controller.stop();
      presentElements.delete(element);
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
    function pop(element) {
      return changeState(element, true);
    }
    function unpop(element) {
      return changeState(element, false);
    }
    function toggle(element) {
      var gotoVisible = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0;
      return changeState(element, gotoVisible);
    }
    function changeState(element) {
      var gotoVisible = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0;
      var controller = presentElements.get(element);
      if (!controller) return;
      if (controller.direction === null) controller.direction = element.hidden ? "unpop" : "pop";
      if (typeof gotoVisible === "undefined" || gotoVisible === null) gotoVisible = controller.direction === "pop" ? false : true;
      var newDirection = gotoVisible ? "pop" : "unpop";
      if (element.hidden && !gotoVisible || newDirection === controller.direction) {
        return;
      }
      controller.stop();
      controller.direction = newDirection;
      new Promise(function(completeTransition, interruptTransition) {
        var _element$classList;
        controller.interruptTransition = interruptTransition;
        var c = className["".concat(newDirection, "ping")];
        var duration = root.getComputedStyle(element).getPropertyValue("--ae-".concat(newDirection, "-duration")).trim();
        var time = getString2Time(duration);
        (_element$classList = element.classList).remove.apply(_element$classList, _toConsumableArray(Object.values(className)));
        AelluxJs.dispatchFrom(element, "".concat(newDirection, "ping"));
        element.hidden = false;
        element.classList.add(c);
        controller.timeout = setTimeout(function() {
          element.classList.remove(c);
          element.hidden = gotoVisible ? false : true;
          controller.interruptTransition = null;
          controller.timeout = null;
          completeTransition();
        }, time);
      }).then(function() {
        if (gotoVisible && !element.hidden) {
          autoUnpopSchedule(element, controller);
          element.classList.add(className.pop);
          AelluxJs.dispatchFrom(element, "Pop");
        }
        if (!gotoVisible && element.hidden) {
          AelluxJs.dispatchFrom(element, "Unpop");
        }
      }).catch(function(interrupt) {
      });
    }
    function autoUnpopSchedule(element, controller) {
      var autoUnpop = element.getAttribute(attr.autoUnpop);
      if (!element.hidden && autoUnpop) {
        var autoTime = getString2Time(autoUnpop);
        controller.timeout = setTimeout(function() {
          controller.timeout = null;
          unpop(element);
        }, autoTime);
      }
    }
    function outsideClickAutoUnpop(currentExceptions) {
      var _iterator2 = _createForOfIteratorHelper(presentElements.keys()), _step2;
      try {
        var _loop = function _loop2() {
          var container = _step2.value;
          if (container.hidden === true || container.getAttribute(attr.unpopOnOutside) === "false" || currentExceptions.some(function(e) {
            return container.contains(e);
          })) {
            return 1;
          }
          unpop(container);
        };
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
          if (_loop()) continue;
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
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
          document.querySelectorAll(targetSelector).forEach(function(element) {
            exceptions.push(element);
            trigger(element, triggerAttr);
          });
        } else if (container) {
          exceptions.push(container);
          trigger(container, triggerAttr);
        } else {
        }
      }
      button = event.target.closest("[".concat(attr.dismiss, "]"));
      if (button) {
        var dismiss = button.getAttribute(attr.dismiss);
        var _targetSelector = button.getAttribute(attr.target);
        if (dismiss || _targetSelector) {
          document.querySelectorAll(dismiss || _targetSelector).forEach(function(element) {
            exceptions.push(element);
            unpop(element);
          });
        } else if (container) {
          exceptions.push(container);
          unpop(container);
        } else {
        }
      }
      outsideClickAutoUnpop(exceptions);
    }
    function getString2Time(string) {
      return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
    }
    function getMillisecondsMulti(value) {
      return !value.endsWith("ms") && value.endsWith("s") ? 1e3 : 1;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.present.legacy.js.map
