# Point Extension

**Distribution:** Bundled Extension. **Stability:** Not stable.

`point` is an official **Bundled Extension** that tracks the pointers currently pressed or hovering over the document and relates them to mounted elements with `data-ae-point`. It is included in the `full` runtime. Basic requires explicit registration; the example below loads it eagerly during mounting:

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

## Tap recognition

Mounted `button[data-ae-point]`, `a[data-ae-point]` and `[role="button"][data-ae-point]` controls also emit `AelluxJsTap`. The nearest Point target must be eligible and enabled; an attribute on an unmounted element does not activate recognition. Native disabled controls (including disabled fieldsets), `aria-disabled="true"`, inert controls and `data-ae-point="0"` cannot tap.

```html
<button id="action" data-ae-point>Activate</button>
```

```js
$ae.onEvent(document.getElementById("action"), "tap", event => {
  const { pointerType, pointerId, duration, distance } = event.detail;
  console.log(pointerType, pointerId, duration, distance);
});
```

Recognition uses a primary pointer's main button and completes synchronously on `pointerup`, within 300 ms. Maximum radial displacement from the press position is 10 CSS px for touch and pen, or 4 CSS px for mouse. The maximum observed displacement counts even if the pointer returns to its starting position, including coalesced samples when available. `pointercancel`, excessive movement or duration, release outside the control, and overlapping touch contacts cancel recognition. Captured releases use the control's bounds at press time. If scrolling retargets an uncaptured release, the same press area remains valid; ancestor scroll offsets are checked only to allow that retargeting, never to cancel a tap.

The event is a bubbling, composed `CustomEvent`, named through `$ae.eventName("tap")`. Its `detail` contains `pointerType`, `pointerId`, `duration` in milliseconds, maximum `distance` in CSS px, and `originalEvent` (the releasing PointerEvent). It can cross a Shadow DOM boundary when the control has been explicitly mounted. Unmounting cancels pending taps; remounting enables fresh presses without duplicating listeners.

Scroll events never independently cancel recognition, including inside Scrollbox. A valid tap still emits when a Point notification or tap handler scrolls an element. Native `pointercancel` and pointer movement limits continue to apply. Point does not prevent defaults, synthesize clicks, wait for clicks or deduplicate tap against click. A pointer activation can emit both `tap` and native `click`; consumers subscribing to both must coordinate their own actions. Keyboard activation keeps its native click path and does not generate tap.

## Bundle cost

Tap recognition adds no dependencies. Against the preceding artifacts, minified Point grows from 4,057 to 5,894 bytes (gzip: 1,550 to 2,236), and Legacy Point from 7,338 to 9,325 bytes (gzip: 2,753 to 3,465). Adding Point alone grows Full by 1,837 bytes / 646 gzip bytes in Modern and 1,989 bytes / 680 gzip bytes in Legacy. Including [Present's tap/click routing](present.md#tap-and-native-click), the combined Full delta is 3,016 bytes / 1,052 gzip bytes in Modern and 3,459 bytes / 1,110 gzip bytes in Legacy.

Modern Point retains its 6 KiB raw / 3 KiB gzip budget. Legacy Point's budget changes from 8 / 3 KiB to 9.5 / 3.5 KiB. The combined feature changes Modern Full from 131.5 / 42.75 KiB to 135.5 / 44 KiB; Legacy Full's raw budget changes from 451 to 454.5 KiB and retains its 138 KiB gzip budget. The preceding Modern Full artifact already exceeded its former raw limit by 257 bytes; the measured tap delta above is separate from that baseline excess.

## Accessibility profile

- **Capabilities:** interaction and input; infrastructure for multi-pointer tracking.
- **Owned state:** pointer records, pointable relations, non-bubbling `AelluxJsPointer*` events and bubbling `AelluxJsTap` notifications.
- **Consumer responsibility:** every essential pointer action must also have a native keyboard-operable control or equivalent non-pointer path.
- **Not applicable:** the Extension creates no controls and changes no semantic, focus, visual or motion state by itself.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Input APIs | Known Limit | <span style="white-space: normal !important;">Point listens to Pointer Events without a separate mouse/touch compatibility layer. Pointer notifications do not bubble and pointer records update in place.</span> | <span style="white-space: normal !important;">Verify Pointer Events, listen on the selected target and copy values when retaining historical samples.</span> |
| Tap scope | Known Limit | <span style="white-space: normal !important;">Tap recognition applies to eligible mounted buttons, links and role buttons, within the limits in Tap recognition. Cancellation or overlapping touch contacts discard the candidate.</span> | <span style="white-space: normal !important;">Provide native keyboard controls and a gesture-specific recognizer for other interactions.</span> |
| Click coexistence | Potential Risk | <span style="white-space: normal !important;">A pointer action can produce both tap and native click. Point neither suppresses defaults nor deduplicates consumer actions.</span> | <span style="white-space: normal !important;">Coordinate the two paths; Present has its own documented deduplication.</span> |
| Gestures | Potential Risk | <span style="white-space: normal !important;">Browser scrolling, pointer capture and other handlers affect native targeting and cancellation; high-frequency subscribers can add main-thread work.</span> | <span style="white-space: normal !important;">Handle cancel/release paths and keep movement handlers inexpensive.</span> |
| Coverage | Validation Gap | <span style="white-space: normal !important;">Synthetic pointer and available touch-emulation checks cover defined paths; Firefox touch-emulation cases are capability-skipped. Real pen, multitouch and device gestures require hardware.</span> | <span style="white-space: normal !important;">Validate target devices and do not count emulation skips as device coverage.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.point.js), [point.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/point.spec.mjs), [point-tap.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/point-tap.spec.mjs).
