(function() {
  // src/internal/create-input-gamepad.js
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
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
  var standardButtons = ["south", "east", "west", "north", "left-shoulder", "right-shoulder", "left-trigger", "right-trigger", "select", "start", "left-stick", "right-stick", "dpad-up", "dpad-down", "dpad-left", "dpad-right", "home"];
  function identifyGamepadFamily(id) {
    if (/nintendo|switch|joy-con|057e/i.test(id)) return "nintendo";
    if (/playstation|dualshock|dualsense|054c/i.test(id)) return "playstation";
    if (/xbox|xinput|045e/i.test(id)) return "xbox";
    return "generic";
  }
  function createGamepadAdapter(api2, root, emit, changed) {
    var identify = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : identifyGamepadFamily;
    var sessions = /* @__PURE__ */ new Map();
    var frame = null, running = false;
    function read() {
      try {
        return root.navigator.getGamepads ? Array.from(root.navigator.getGamepads()).filter(function(pad) {
          return pad && pad.connected;
        }) : [];
      } catch (_) {
        return [];
      }
    }
    function descriptor(session) {
      return Object.freeze({
        deviceId: session.deviceId,
        source: "gamepad",
        index: session.index,
        model: session.model,
        family: session.family,
        mapping: session.mapping
      });
    }
    function notify(session, connected) {
      changed(descriptor(session), connected, sessions.size > 0);
    }
    function remove(index) {
      var session = sessions.get(index);
      if (!session) return;
      sessions.delete(index);
      notify(session, false);
    }
    function schedule() {
      if (running && sessions.size && !root.document.hidden && frame === null) frame = root.requestAnimationFrame(poll);
    }
    function command(session, code, phase, value, action) {
      emit(_objectSpread(_objectSpread({}, descriptor(session)), {}, {
        code: code,
        phase: phase,
        value: value,
        action: action,
        intentional: phase === "press" || phase === "repeat"
      }));
    }
    function poll() {
      frame = null;
      if (!running || root.document.hidden) return;
      var pads = read();
      var indices = new Set(pads.map(function(pad) {
        return pad.index;
      }));
      var _iterator = _createForOfIteratorHelper(sessions.keys()), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var index = _step.value;
          if (!indices.has(index)) remove(index);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var now = root.performance.now();
      var _iterator2 = _createForOfIteratorHelper(pads), _step2;
      try {
        var _loop = function _loop2() {
          var pad = _step2.value;
          var session = sessions.get(pad.index);
          if (session && (session.model !== pad.id || session.mapping !== pad.mapping)) {
            remove(pad.index);
            session = null;
          }
          if (!session) {
            api2.registry.inputDeviceSequence = (api2.registry.inputDeviceSequence || 0) + 1;
            session = {
              deviceId: "gamepad:" + api2.registry.inputDeviceSequence,
              index: pad.index,
              model: pad.id,
              family: identify(pad.id) || "generic",
              mapping: pad.mapping,
              buttons: [],
              repeats: [],
              axes: [],
              directions: []
            };
            sessions.set(pad.index, session);
            notify(session, true);
          }
          pad.buttons.forEach(function(button, index2) {
            var pressed = typeof button === "number" ? button > 0.5 : button.pressed || button.value > 0.5;
            var code = pad.mapping === "standard" ? standardButtons[index2] || "button" + index2 : "button" + index2;
            var previous = !!session.buttons[index2];
            session.buttons[index2] = pressed;
            if (pressed !== previous) {
              session.repeats[index2] = now + 400;
              command(session, code, pressed ? "press" : "release", typeof button === "number" ? button : button.value);
            } else if (pressed && now >= session.repeats[index2]) {
              session.repeats[index2] = now + 100;
              command(session, code, "repeat", typeof button === "number" ? button : button.value);
            }
          });
          pad.axes.forEach(function(raw, index2) {
            var previous = session.axes[index2] || 0;
            var value = Math.abs(raw) >= (previous ? 0.35 : 0.55) ? Math.max(-1, Math.min(1, raw)) : 0;
            session.axes[index2] = value;
            if (Math.abs(value - previous) >= 0.08 || !value && previous) command(session, "axis" + index2, "move", value);
            if (pad.mapping !== "standard" || index2 > 1) return;
            var direction = value ? index2 === 0 ? value < 0 ? "left" : "right" : value < 0 ? "up" : "down" : null;
            var old = session.directions[index2];
            session.directions[index2] = direction;
            if (old !== direction) {
              if (old) command(session, "stick-" + old, "release", 0);
              if (direction) command(session, "stick-" + direction, "press", value, "navigate-" + direction);
              session.repeats["axis" + index2] = now + 400;
            } else if (direction && now >= session.repeats["axis" + index2]) {
              session.repeats["axis" + index2] = now + 100;
              command(session, "stick-" + direction, "repeat", value, "navigate-" + direction);
            }
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
      schedule();
    }
    function wake() {
      if (frame !== null) root.cancelAnimationFrame(frame);
      frame = null;
      poll();
    }
    function disconnected(event) {
      remove(event.gamepad.index);
      if (!sessions.size && frame !== null) {
        root.cancelAnimationFrame(frame);
        frame = null;
      }
    }
    function visibility() {
      if (root.document.hidden) {
        if (frame !== null) root.cancelAnimationFrame(frame);
        frame = null;
        return;
      }
      var _iterator3 = _createForOfIteratorHelper(read()), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var pad = _step3.value;
          var session = sessions.get(pad.index);
          if (session) {
            session.buttons = pad.buttons.map(function(button) {
              return !!button.pressed;
            });
            session.repeats = session.buttons.map(function() {
              return Infinity;
            });
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      wake();
    }
    return {
      init: function init() {
        running = true;
        root.addEventListener("gamepadconnected", wake);
        root.addEventListener("gamepaddisconnected", disconnected);
        root.document.addEventListener("visibilitychange", visibility);
        poll();
      },
      destroy: function destroy() {
        running = false;
        if (frame !== null) root.cancelAnimationFrame(frame);
        frame = null;
        root.removeEventListener("gamepadconnected", wake);
        root.removeEventListener("gamepaddisconnected", disconnected);
        root.document.removeEventListener("visibilitychange", visibility);
        var _iterator4 = _createForOfIteratorHelper(sessions.keys()), _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
            var index = _step4.value;
            remove(index);
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      },
      devices: function devices() {
        return Array.from(sessions.values(), descriptor);
      }
    };
  }

  // src/src/aellux.input.gamepad.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var api = (typeof globalThis !== "undefined" ? globalThis : window).aelluxJs;
  api.registry.inputAdapters = api.registry.inputAdapters || {};
  api.registry.inputAdapters.gamepad = function(_ref) {
    var root = _ref.root, emit = _ref.emit, changed = _ref.changed, identify = _ref.identify;
    return createGamepadAdapter(api, root, emit, changed, function(id) {
      return identify(id) || identifyGamepadFamily(id);
    });
  };
})();
//# sourceMappingURL=aellux.input.gamepad.legacy.js.map
