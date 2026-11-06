/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function createKeyboardAdapter(api, root, emit) {
  function onKey(event) {
    if (event.isComposing || event.keyCode === 229) return;
    emit({ deviceId: "keyboard", source: "keyboard", code: event.code || event.key,
      key: event.key, phase: event.type === "keyup" ? "release" : event.repeat ? "repeat" : "press",
      modifiers: { alt: event.altKey, ctrl: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey },
      originalEvent: event, target: event.target, intentional: event.isTrusted && event.type === "keydown" });
  }
  return {
    init() { api.on("$keydown", onKey); api.on("$keyup", onKey); },
    destroy() { api.off("$keydown", onKey); api.off("$keyup", onKey); }
  };
}
