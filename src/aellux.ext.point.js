/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Point Extension
 *
 * Purpose: normalizes active Pointer Events and routes point lifecycle events
 * directly to the nearest eligible mounted `data-ae-point` element.
 *
 * Capability profile: interaction and input routing, with infrastructure for
 * multi-pointer state.
 *
 * Inputs and activation: tracks pointer down, move, up, cancel, over and out at
 * document level. The integer value of `data-ae-point` limits simultaneous
 * pointers for an element. Empty or invalid values default to one; zero disables
 * association.
 *
 * Outputs and owned state: keeps positions, movement, press timing, press origin
 * and current target. It dispatches non-bubbling `AelluxJsPointer*` events and
 * exposes `point.pointers()` on mounted controllers.
 *
 * Lifecycle: removes global listeners, clears tracked pointers and releases
 * per-element pointer references on unmount or destruction.
 *
 * Accessibility: pointer gestures are an enhancement channel. Every essential
 * action must also have a native keyboard-operable UI or equivalent input path
 * supplied by the consumer.
 */

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "point";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }

  const trackedPointers = new Map();
  const pointableElements = new Set();
  const pointableAttribute = AelluxJs.attr("point");
  const pointableSelector = `[${pointableAttribute}]`;

  AelluxJs.extAttach(extensionName, {
    init, destroy, pointers
  });

  function init() {
    AelluxJs.mountManager.add({
      extensionName, selector: pointableSelector,
      priority: 0,
      mount: mountPointable, unmount: unmountPointable,
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
      if (pointer.target === element) pointer.target = null;
      if (pointer.pressStart === element) pointer.pressStart = null;
    }
  }

  function pointers(element) {
    const result = [];
    for (const pointer of trackedPointers.values()) {
      if (pointer.target === element) result.push(pointer);
    }
    return result;
  }

  function limitFor(element) {
    const value = element.getAttribute(pointableAttribute);
    if (value === null || !value.trim()) return 1;
    const trimmed = value.trim();
    const limit = Number(trimmed);
    return /^\d+$/.test(trimmed) && Number.isSafeInteger(limit) ? limit : 1;
  }

  function targetFor(target, pointer) {
    let element = target && target.nodeType === 1 ? target : target && target.parentElement;
    while (element) {
      if (pointableElements.has(element) && element.hasAttribute(pointableAttribute)) {
        let occupied = 0;
        for (const other of trackedPointers.values()) {
          if (other !== pointer && other.target === element) occupied++;
        }
        if (occupied < limitFor(element)) return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  function dispatchPointer(name, pointer, originalEvent, recipient, hover,
    target = pointer.target, pressStart = pointer.pressStart) {
    if (!recipient) return;
    AelluxJs.dispatchFrom(recipient, name, {
      bubbles: false,
      detail: {
        pointer, target, pressStart,
        originalEvent, hover
      }
    });
  }

  function dispatchToTarget(name, pointer, originalEvent) {
    if (!pointer.target) return;
    pointer.beforeDispatch();
    dispatchPointer(name, pointer, originalEvent, pointer.target);
  }

  function dispatchRelease(name, pointer, originalEvent) {
    const target = pointer.target;
    const pressStart = pointer.pressStart;
    if (!target && !pressStart) return;
    pointer.beforeDispatch();
    dispatchPointer(name, pointer, originalEvent, target, undefined, target, pressStart);
    if (pressStart !== target)
      dispatchPointer(name, pointer, originalEvent, pressStart, undefined, target, pressStart);
  }

  function updateHoverTarget(pointer, event, nextTarget) {
    const previousTarget = pointer.target;
    if (previousTarget === nextTarget) return;
    if (previousTarget || nextTarget) pointer.beforeDispatch();
    dispatchPointer("PointerHover", pointer, event, previousTarget, false);
    pointer.target = nextTarget;
    dispatchPointer("PointerHover", pointer, event, nextTarget, true);
  }

  function canHover(event) {
    return event.pointerType === "mouse" || event.pointerType === "pen";
  }

  function addPointer(event, pressed, hover) {
    const pointer = new AePointer(event, pressed, hover);
    trackedPointers.set(event.pointerId, pointer);
    return pointer;
  }

  function onPointerDown(event) {
    const pointer = trackedPointers.get(event.pointerId) ||
      addPointer(event, true, canHover(event));
    pointer.initial.x = event.clientX;
    pointer.initial.y = event.clientY;
    pointer.pointerType = event.pointerType;
    pointer.pressed = true;
    pointer.startPress();
    pointer.hover = canHover(event);
    pointer.update(event);
    pointer.target = targetFor(event.target, pointer);
    pointer.pressStart = pointer.target;
    dispatchToTarget("PointerDown", pointer, event);
  }

  function onPointerMove(event) {
    let pointer = trackedPointers.get(event.pointerId);
    if (!pointer) {
      if (!canHover(event)) return;
      pointer = addPointer(event, false, true);
    }
    pointer.update(event);
    pointer.target = targetFor(event.target, pointer);
    dispatchToTarget("PointerMove", pointer, event);
  }

  function onPointerUp(event) {
    const pointer = trackedPointers.get(event.pointerId);
    if (!pointer) return;
    pointer.update(event);
    pointer.pressed = false;
    pointer.endPress();
    pointer.target = targetFor(event.target, pointer);
    dispatchRelease("PointerUp", pointer, event);
    if (!pointer.hover) trackedPointers.delete(event.pointerId);
  }

  function onPointerCancel(event) {
    const pointer = trackedPointers.get(event.pointerId);
    if (pointer) {
      pointer.update(event);
      pointer.pressed = false;
      pointer.endPress();
      pointer.target = targetFor(event.target, pointer);
      dispatchRelease("PointerCancel", pointer, event);
    }
    trackedPointers.delete(event.pointerId);
  }

  function onPointerOver(event) {
    if (!canHover(event)) return;
    const pointer = trackedPointers.get(event.pointerId) ||
      addPointer(event, false, true);
    pointer.update(event);
    pointer.hover = true;
    updateHoverTarget(pointer, event, targetFor(event.target, pointer));
  }

  function onPointerOut(event) {
    const pointer = trackedPointers.get(event.pointerId);
    if (!pointer) return;
    const relatedTarget = event.relatedTarget;
    pointer.update(event);
    updateHoverTarget(pointer, event, targetFor(relatedTarget, pointer));
    if (!relatedTarget || !relatedTarget.nodeType || !document.contains(relatedTarget)) {
      pointer.hover = false;
      pointer.target = null;
    }
    if (!pointer.pressed && !pointer.hover) trackedPointers.delete(event.pointerId);
  }

  class AePointer {
    constructor(event, pressed, hover) {
      const x = event.clientX;
      const y = event.clientY;
      this.pointerId = event.pointerId;
      this.pointerType = event.pointerType;
      this.initial = { x, y };
      this.current = { x, y };
      this.delta = { x: 0, y: 0 };
      this.movement = { x: 0, y: 0 };
      this.lastDispatched = { x, y };
      this.time = { pressStart: null, pressEnd: null };
      this.buttons = event.buttons;
      this.pressed = pressed;
      this.hover = hover;
      this.target = null;
      this.pressStart = null;
    }

    get deltaTime() {
      if (this.time.pressStart === null) return 0;
      return (this.time.pressEnd ?? root.performance.now()) - this.time.pressStart;
    }

    startPress() {
      this.time.pressStart = root.performance.now();
      this.time.pressEnd = null;
    }

    endPress() {
      if (this.time.pressStart !== null && this.time.pressEnd === null)
        this.time.pressEnd = root.performance.now();
    }

    update(event) {
      this.current.x = event.clientX;
      this.current.y = event.clientY;
      this.delta.x = this.current.x - this.initial.x;
      this.delta.y = this.current.y - this.initial.y;
      this.buttons = event.buttons;
    }

    beforeDispatch() {
      this.movement.x = this.current.x - this.lastDispatched.x;
      this.movement.y = this.current.y - this.lastDispatched.y;
      this.lastDispatched.x = this.current.x;
      this.lastDispatched.y = this.current.y;
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
