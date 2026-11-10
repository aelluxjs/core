(function() {
  // src/internal/create-input-keyboard.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createKeyboardAdapter(api2, root, emit) {
    function onKey(event) {
      if (event.isComposing || event.keyCode === 229) return;
      emit({
        deviceId: "keyboard",
        source: "keyboard",
        code: event.code || event.key,
        key: event.key,
        phase: event.type === "keyup" ? "release" : event.repeat ? "repeat" : "press",
        modifiers: {
          alt: event.altKey,
          ctrl: event.ctrlKey,
          meta: event.metaKey,
          shift: event.shiftKey
        },
        originalEvent: event,
        target: event.target,
        intentional: event.isTrusted && event.type === "keydown"
      });
    }
    return {
      init: function init() {
        api2.on("$keydown", onKey);
        api2.on("$keyup", onKey);
      },
      destroy: function destroy() {
        api2.off("$keydown", onKey);
        api2.off("$keyup", onKey);
      }
    };
  }

  // src/src/aellux.input.keyboard.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var api = (typeof globalThis !== "undefined" ? globalThis : window).aelluxJs;
  api.registry.inputAdapters = api.registry.inputAdapters || {};
  api.registry.inputAdapters.keyboard = function(_ref) {
    var root = _ref.root, emit = _ref.emit;
    return createKeyboardAdapter(api, root, emit);
  };
})();
//# sourceMappingURL=aellux.input.keyboard.legacy.js.map
