# Pointer Extension

`pointer` tracks the pointers currently pressed or hovering over the document and relates them to mounted elements with `data-ae-pointable`. It is a standalone core Extension and is not included in the `full` runtime bundle. Register it before initialization:

```html
<div id="canvas" data-ae-pointable="2"></div>
```

```js
$ae.ext("pointer");
$ae.init({ mode: "basic" });
$ae.on("Ready", function (event) {
  const pointers = $ae("canvas").pointer.pointers();
  console.log(pointers);
})
```

An empty `data-ae-pointable` allows one pointer by default. A non-negative integer sets the maximum number of pointers associated with that element; `0` disables association and invalid values use the default of one. Nested pointables have their own limits. The mounted controller method `$ae(elementOrId).pointer.pointers()` returns the pointers currently associated with that element.

Each pointer record has `pointerId`, `pointerType`, `initial`, `current`, `delta`, `buttons`, `pressed`, `hover`, and `pointables`. Positions use viewport `clientX` and `clientY` coordinates as `{ x, y }`; `delta` is `current - initial`. `pointables` lists the associated mounted elements from nearest to outermost. The returned array is a snapshot; its pointer records update in place.

The Extension listens to `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, and `pointerout` in the capture phase. It dispatches `AelluxJsPointerDown`, `AelluxJsPointerMove`, `AelluxJsPointerUp`, `AelluxJsPointerCancel`, and `AelluxJsPointerHover` directly on each associated pointable, from nearest to outermost. These events use `bubbles: false`, so a pointable excluded by its limit does not receive a child's event. `detail` contains `pointer`, `pointables`, and `originalEvent`; `detail.pointables` is a snapshot of the nearest-to-outermost chain when the event was dispatched. Hover events also set `detail.hover` to `true` or `false` and are sent only to pointables being entered or left. The initial position is set on the first observed hover or press and resets on each press. Mouse and pen pointers remain tracked while hovering after release. Touch pointers leave after their `PointerUp` event; canceled pointers leave after `PointerCancel`. Destroying the Extension removes its listeners, mount map, and tracked pointers.
