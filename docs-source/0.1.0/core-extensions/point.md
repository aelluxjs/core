# Point Extension

`point` tracks the pointers currently pressed or hovering over the document and relates them to mounted elements with `data-ae-point`. It is a standalone core Extension and is not included in the `full` runtime bundle. Register it before initialization:

```html
<div id="canvas" data-ae-point="2"></div>
```

```js
$ae.ext("point");
$ae.init({ mode: "basic" });
$ae.on("Ready", function (event) {
  const pointers = $ae("canvas").point.pointers();
  console.log(pointers);
})
```

An empty `data-ae-point` allows one pointer by default. A non-negative integer sets the maximum number of pointers associated with that element; `0` disables association and invalid values use the default of one. Each pointer selects the nearest mounted element with available capacity, continuing up the ancestor tree if a nearer element is full or disabled. The mounted controller method `$ae(elementOrId).point.pointers()` returns the pointers whose current `target` is that element.

Each pointer record is an `AePointer` instance with `pointerId`, `pointerType`, `initial`, `current`, `delta`, `movement`, `time`, `deltaTime`, `buttons`, `pressed`, `hover`, `target`, and `pressStart`. Positions use viewport `clientX` and `clientY` coordinates as `{ x, y }`; `delta` is `current - initial`, while `movement` is `current - last dispatched position`. The first dispatched event has zero movement. Events with no recipient do not advance that reference position. `time.pressStart` and `time.pressEnd` are `performance.now()` timestamps in milliseconds. Both are `null` before a press; `pressEnd` remains `null` while pressed. `deltaTime` returns the elapsed milliseconds from `pressStart` to the current time while pressed, then the fixed duration between `pressStart` and `pressEnd`. Each new press resets the timing. `target` is the current mounted element or `null`; `pressStart` is the element selected on the latest `pointerdown`, or `null` before the first press. The array returned by `pointers()` is a snapshot; its pointer records update in place.

The Extension listens to `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, and `pointerout` in the capture phase. It dispatches `AelluxJsPointerDown`, `AelluxJsPointerMove`, `AelluxJsPointerUp`, `AelluxJsPointerCancel`, and `AelluxJsPointerHover` directly on the selected element. These events use `bubbles: false`, so an ancestor does not receive a child's event unless it becomes the selected target. `detail` contains `pointer`, the current `target`, the `pressStart` element, and `originalEvent`. `PointerUp` and `PointerCancel` reach the current target and the press origin when they differ, once per element. When release occurs outside every marked element, `detail.target` is `null` and the event still reaches `pressStart`. Unmounting an element clears matching stored references. Hover events also set `detail.hover` to `true` or `false` and are sent only when the selected target changes. The initial position is set on the first observed hover or press and resets on each press. Mouse and pen pointers remain tracked while hovering after release. Touch pointers leave after their `PointerUp` event; canceled pointers leave after `PointerCancel`. Destroying the Extension removes its listeners, mount map, and tracked pointers.

## Accessibility profile

- **Capabilities:** interaction and input; infrastructure for multi-pointer tracking.
- **Owned state:** pointer records, pointable relations and non-bubbling `AelluxJsPointer*` events.
- **Consumer responsibility:** every essential pointer action must also have a native keyboard-operable control or equivalent non-pointer path.
- **Not applicable:** the Extension creates no controls and changes no semantic, focus, visual or motion state by itself.
