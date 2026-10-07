(function() {
  // src/src/aellux.ext.present.js
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
    var POP = "Pop", UNPOP = "Unpop", BEFORE = "Before", PING = "ping", MILLISECOND = "ms", SECOND = "s", ARIA_EXPANDED = "aria-expanded", ARIA_CONTROLS = "aria-controls";
    var presentElements = /* @__PURE__ */ new Map();
    var triggerElementsSet = /* @__PURE__ */ new Set();
    var triggerTargets = /* @__PURE__ */ new Map();
    var initialTriggerControls = /* @__PURE__ */ new WeakMap();
    var attrMemoryUsers = /* @__PURE__ */ new WeakMap();
    var initialAttributes = ["hidden", ARIA_EXPANDED, ARIA_CONTROLS, attr.presentMotion];
    function init(options) {
      mountMap.set("[".concat(attr.present, "]"), {
        mount: mountPresentContainer,
        unmount: unmountPresentContainer
      });
      mountMap.set("[".concat([attr.trigger, attr.dismiss, attr.target].join("],["), "]"), {
        mount: mountTriggerElement,
        unmount: unmountTriggerElement
      });
      document.addEventListener("click", OnClick);
    }
    function destroy() {
      mountMap.clear();
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
      var presentMotion = element.querySelector(":scope>[".concat(attr.presentMotion, "]")) || element;
      rememberAttributes(element);
      if (presentMotion !== element) rememberAttributes(presentMotion);
      if (presentMotion === element) {
        if (!presentMotion.hasAttribute(attr.presentMotion)) presentMotion.setAttribute(attr.presentMotion, "auto");
      } else {
        if (!element.hidden) {
          element.hidden = presentMotion.hidden;
        }
        presentMotion.hidden = false;
      }
      var presentController = {
        interruptTransition: null,
        direction: null,
        timeout: null,
        presentMotion: presentMotion,
        classList: presentMotion.classList,
        triggers: /* @__PURE__ */ new Set(),
        setAriaExpanded: function setAriaExpanded(value) {
          element.setAttribute(ARIA_EXPANDED, value);
          this.triggers.forEach(updateTriggerAriaExpanded);
        },
        stop: function stop() {
          var _this$classList;
          (_this$classList = this.classList).remove.apply(_this$classList, _toConsumableArray(Object.values(className)));
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
      if (controller.presentMotion !== element) restoreAttributes(controller.presentMotion);
      restoreAttributes(element);
    }
    function mountTriggerElement(triggerElement) {
      if (triggerElementsSet.has(triggerElement)) return;
      initialTriggerControls.set(triggerElement, triggerElement.getAttribute(ARIA_CONTROLS));
      rememberAttributes(triggerElement);
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
      restoreAttributes(triggerElement);
      initialTriggerControls.delete(triggerElement);
    }
    function refreshTriggerTargets(triggerElement) {
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
      var initial = initialTriggerControls.get(triggerElement);
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
    function presentTransition(element, gotoVisible) {
      var controller = presentElements.get(element);
      if (!controller) return;
      if (controller.direction === null) controller.direction = element.hidden ? UNPOP : POP;
      if (typeof gotoVisible === "undefined" || gotoVisible === null) gotoVisible = controller.direction === POP ? false : true;
      var newDirection = gotoVisible ? POP : UNPOP;
      if (element.hidden && !gotoVisible || newDirection === controller.direction) {
        return;
      }
      var allowEvent = AelluxJs.dispatchFrom(element, "".concat(BEFORE).concat(newDirection), {
        bubbles: true,
        cancelable: true
      });
      if (!allowEvent) {
        return;
      }
      controller.stop();
      controller.direction = newDirection;
      new Promise(function(completeTransition, interruptTransition) {
        controller.interruptTransition = interruptTransition;
        var c = className["".concat(newDirection).concat(PING).toLowerCase()];
        var duration = root.getComputedStyle(controller.presentMotion).getPropertyValue("--ae-".concat(newDirection, "-duration").toLowerCase()).trim();
        var time = getString2Time(duration);
        controller.classList.add(c);
        element.hidden = false;
        controller.timeout = setTimeout(finishTransition, time, element, controller, c, gotoVisible, completeTransition);
        AelluxJs.dispatchFrom(element, "".concat(newDirection).concat(PING), {
          bubbles: true
        });
      }).then(function() {
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
      }).catch(function(error) {
        switch (error && error.code) {
          case AelluxJs.diagnostics.WARN_INTERRUPTION.code:
            AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_INTERRUPTION, {
              cause: error,
              extension: extensionName,
              element: element
            });
            break;
          default:
            AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION, {
              cause: error,
              extension: extensionName,
              element: element
            });
            break;
        }
      });
    }
    function finishTransition(element, controller, c, gotoVisible, completeTransition) {
      controller.classList.remove(c);
      element.hidden = gotoVisible ? false : true;
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
    function rememberAttributes(element) {
      var users = attrMemoryUsers.get(element) || 0;
      if (users === 0) AelluxJs.attrMem.save(element, initialAttributes);
      attrMemoryUsers.set(element, users + 1);
    }
    function restoreAttributes(element) {
      var users = attrMemoryUsers.get(element);
      if (!users) return;
      if (users > 1) {
        attrMemoryUsers.set(element, users - 1);
        return;
      }
      attrMemoryUsers.delete(element);
      AelluxJs.attrMem.restore(element);
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
