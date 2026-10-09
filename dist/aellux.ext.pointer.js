(() => {
  // src/aellux.ext.pointer.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "pointer";
    if (!AelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    const trackedPointers = /* @__PURE__ */ new Map();
    const pointableElements = /* @__PURE__ */ new Set();
    const pointableAttribute = AelluxJs.attr("pointable");
    const pointableSelector = `[${pointableAttribute}]`;
    AelluxJs.extAttach(extensionName, {
      init,
      destroy,
      pointers
    });
    function init() {
      AelluxJs.mountManager.add({
        extensionName,
        selector: pointableSelector,
        mount: mountPointable,
        unmount: unmountPointable,
        controllers: ["pointers"]
      });
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("pointermove", onPointerMove, true);
      document.addEventListener("pointerup", onPointerUp, true);
      document.addEventListener("pointercancel", onPointerCancel, true);
      document.addEventListener("pointerover", onPointerOver, true);
      document.addEventListener("pointerout", onPointerOut, true);
    }
    function destroy() {
      AelluxJs.mountManager.remove({ extensionName });
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerCancel, true);
      document.removeEventListener("pointerover", onPointerOver, true);
      document.removeEventListener("pointerout", onPointerOut, true);
      trackedPointers.clear();
      pointableElements.clear();
    }
    function mountPointable(element) {
      pointableElements.add(element);
    }
    function unmountPointable(element) {
      pointableElements.delete(element);
      for (const pointer of trackedPointers.values()) {
        pointer.pointables = pointer.pointables.filter((pointable) => pointable !== element);
      }
    }
    function pointers(element) {
      return Array.from(trackedPointers.values()).filter((pointer) => pointer.pointables.includes(element));
    }
    function limitFor(element) {
      const value = element.getAttribute(pointableAttribute);
      if (value === null || !value.trim()) return 1;
      const trimmed = value.trim();
      const limit = Number(trimmed);
      return /^\d+$/.test(trimmed) && Number.isSafeInteger(limit) ? limit : 1;
    }
    function pointablesFor(target, pointer) {
      const result = [];
      let element = target && target.nodeType === 1 ? target : target && target.parentElement;
      while (element) {
        if (pointableElements.has(element) && element.hasAttribute(pointableAttribute)) {
          let occupied = 0;
          for (const other of trackedPointers.values()) {
            if (other !== pointer && other.pointables.includes(element)) occupied++;
          }
          if (occupied < limitFor(element)) result.push(element);
        }
        element = element.parentElement;
      }
      return result;
    }
    function dispatchPointer(name, pointer, originalEvent, targets = pointer.pointables, hover, pointables = pointer.pointables) {
      const chain = pointables.slice();
      for (const element of targets.slice()) {
        AelluxJs.dispatchFrom(element, name, {
          bubbles: false,
          detail: { pointer, pointables: chain.slice(), originalEvent, hover }
        });
      }
    }
    function canHover(event) {
      return event.pointerType === "mouse" || event.pointerType === "pen";
    }
    function addPointer(event, pressed, hover) {
      const x = event.clientX;
      const y = event.clientY;
      const pointer = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        initial: { x, y },
        current: { x, y },
        delta: { x: 0, y: 0 },
        buttons: event.buttons,
        pressed,
        hover,
        pointables: []
      };
      trackedPointers.set(event.pointerId, pointer);
      return pointer;
    }
    function updatePointer(pointer, event) {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      pointer.delta.x = pointer.current.x - pointer.initial.x;
      pointer.delta.y = pointer.current.y - pointer.initial.y;
      pointer.buttons = event.buttons;
    }
    function onPointerDown(event) {
      const pointer = trackedPointers.get(event.pointerId) || addPointer(event, true, canHover(event));
      pointer.initial.x = event.clientX;
      pointer.initial.y = event.clientY;
      pointer.pointerType = event.pointerType;
      pointer.pressed = true;
      pointer.hover = canHover(event);
      updatePointer(pointer, event);
      pointer.pointables = pointablesFor(event.target, pointer);
      dispatchPointer("PointerDown", pointer, event);
    }
    function onPointerMove(event) {
      let pointer = trackedPointers.get(event.pointerId);
      if (!pointer) {
        if (!canHover(event)) return;
        pointer = addPointer(event, false, true);
      }
      updatePointer(pointer, event);
      pointer.pointables = pointablesFor(event.target, pointer);
      dispatchPointer("PointerMove", pointer, event);
    }
    function onPointerUp(event) {
      const pointer = trackedPointers.get(event.pointerId);
      if (!pointer) return;
      updatePointer(pointer, event);
      pointer.pressed = false;
      pointer.pointables = pointablesFor(event.target, pointer);
      dispatchPointer("PointerUp", pointer, event);
      if (!pointer.hover) trackedPointers.delete(event.pointerId);
    }
    function onPointerCancel(event) {
      const pointer = trackedPointers.get(event.pointerId);
      if (pointer) {
        updatePointer(pointer, event);
        pointer.pressed = false;
        pointer.pointables = pointablesFor(event.target, pointer);
        dispatchPointer("PointerCancel", pointer, event);
      }
      trackedPointers.delete(event.pointerId);
    }
    function onPointerOver(event) {
      if (!canHover(event)) return;
      const pointer = trackedPointers.get(event.pointerId) || addPointer(event, false, true);
      const previous = pointer.pointables;
      updatePointer(pointer, event);
      pointer.hover = true;
      pointer.pointables = pointablesFor(event.target, pointer);
      const entered = pointer.pointables.filter((element) => !previous.includes(element));
      dispatchPointer("PointerHover", pointer, event, entered, true);
    }
    function onPointerOut(event) {
      const pointer = trackedPointers.get(event.pointerId);
      if (!pointer) return;
      const relatedTarget = event.relatedTarget;
      updatePointer(pointer, event);
      const previous = pointer.pointables;
      const nextPointables = pointablesFor(relatedTarget, pointer);
      const left = previous.filter((element) => !nextPointables.includes(element));
      dispatchPointer("PointerHover", pointer, event, left, false, previous);
      pointer.pointables = previous.filter((element) => nextPointables.includes(element));
      if (!relatedTarget || !relatedTarget.nodeType || !document.contains(relatedTarget)) {
        pointer.hover = false;
        pointer.pointables = [];
      }
      if (!pointer.pressed && !pointer.hover) trackedPointers.delete(event.pointerId);
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.pointer.js.map
