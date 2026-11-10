(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/internal/create-input-gamepad.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var standardButtons = [
    "south",
    "east",
    "west",
    "north",
    "left-shoulder",
    "right-shoulder",
    "left-trigger",
    "right-trigger",
    "select",
    "start",
    "left-stick",
    "right-stick",
    "dpad-up",
    "dpad-down",
    "dpad-left",
    "dpad-right",
    "home"
  ];
  function identifyGamepadFamily(id) {
    if (/nintendo|switch|joy-con|057e/i.test(id)) return "nintendo";
    if (/playstation|dualshock|dualsense|054c/i.test(id)) return "playstation";
    if (/xbox|xinput|045e/i.test(id)) return "xbox";
    return "generic";
  }
  function createGamepadAdapter(api2, root, emit, changed, identify = identifyGamepadFamily) {
    const sessions = /* @__PURE__ */ new Map();
    let frame = null, running = false;
    function read() {
      try {
        return root.navigator.getGamepads ? Array.from(root.navigator.getGamepads()).filter((pad) => pad && pad.connected) : [];
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
      const session = sessions.get(index);
      if (!session) return;
      sessions.delete(index);
      notify(session, false);
    }
    function schedule() {
      if (running && sessions.size && !root.document.hidden && frame === null) frame = root.requestAnimationFrame(poll);
    }
    function command(session, code, phase, value, action) {
      emit(__spreadProps(__spreadValues({}, descriptor(session)), { code, phase, value, action, intentional: phase === "press" || phase === "repeat" }));
    }
    function poll() {
      frame = null;
      if (!running || root.document.hidden) return;
      const pads = read();
      const indices = new Set(pads.map((pad) => pad.index));
      for (const index of sessions.keys()) if (!indices.has(index)) remove(index);
      const now = root.performance.now();
      for (const pad of pads) {
        let session = sessions.get(pad.index);
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
        pad.buttons.forEach((button, index) => {
          const pressed = typeof button === "number" ? button > 0.5 : button.pressed || button.value > 0.5;
          const code = pad.mapping === "standard" ? standardButtons[index] || "button" + index : "button" + index;
          const previous = !!session.buttons[index];
          session.buttons[index] = pressed;
          if (pressed !== previous) {
            session.repeats[index] = now + 400;
            command(session, code, pressed ? "press" : "release", typeof button === "number" ? button : button.value);
          } else if (pressed && now >= session.repeats[index]) {
            session.repeats[index] = now + 100;
            command(session, code, "repeat", typeof button === "number" ? button : button.value);
          }
        });
        pad.axes.forEach((raw, index) => {
          const previous = session.axes[index] || 0;
          const value = Math.abs(raw) >= (previous ? 0.35 : 0.55) ? Math.max(-1, Math.min(1, raw)) : 0;
          session.axes[index] = value;
          if (Math.abs(value - previous) >= 0.08 || !value && previous) command(session, "axis" + index, "move", value);
          if (pad.mapping !== "standard" || index > 1) return;
          const direction = value ? index === 0 ? value < 0 ? "left" : "right" : value < 0 ? "up" : "down" : null;
          const old = session.directions[index];
          session.directions[index] = direction;
          if (old !== direction) {
            if (old) command(session, "stick-" + old, "release", 0);
            if (direction) command(session, "stick-" + direction, "press", value, "navigate-" + direction);
            session.repeats["axis" + index] = now + 400;
          } else if (direction && now >= session.repeats["axis" + index]) {
            session.repeats["axis" + index] = now + 100;
            command(session, "stick-" + direction, "repeat", value, "navigate-" + direction);
          }
        });
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
      for (const pad of read()) {
        const session = sessions.get(pad.index);
        if (session) {
          session.buttons = pad.buttons.map((button) => !!button.pressed);
          session.repeats = session.buttons.map(() => Infinity);
        }
      }
      wake();
    }
    return {
      init() {
        running = true;
        root.addEventListener("gamepadconnected", wake);
        root.addEventListener("gamepaddisconnected", disconnected);
        root.document.addEventListener("visibilitychange", visibility);
        poll();
      },
      destroy() {
        running = false;
        if (frame !== null) root.cancelAnimationFrame(frame);
        frame = null;
        root.removeEventListener("gamepadconnected", wake);
        root.removeEventListener("gamepaddisconnected", disconnected);
        root.document.removeEventListener("visibilitychange", visibility);
        for (const index of sessions.keys()) remove(index);
      },
      devices() {
        return Array.from(sessions.values(), descriptor);
      }
    };
  }

  // src/aellux.input.gamepad.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var api = (typeof globalThis !== "undefined" ? globalThis : window).aelluxJs;
  api.registry.inputAdapters = api.registry.inputAdapters || {};
  api.registry.inputAdapters.gamepad = ({ root, emit, changed, identify }) => createGamepadAdapter(api, root, emit, changed, (id) => identify(id) || identifyGamepadFamily(id));
})();
//# sourceMappingURL=aellux.input.gamepad.js.map
