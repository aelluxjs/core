# Input Extension

**Distribution:** Bundled Extension. **Stability:** Not stable.

Stability describes implementation maturity and validation, not API compatibility. Only the [minimal initialization and declarative activation/mounting contract](../runtime/compatibility-commitment.md) is protected during `0.1.x`.

Input captures physical sources and produces commands. Synchronous routers resolve `deviceId → focusId`; [Focus](focus.md) owns logical navigation and contextual shortcut execution. Input never invokes UI components. No Multiplayer Extension is included.

Directional commands (`navigate-up/down/left/right`) are interpreted geometrically by Focus, using the nearest `data-ae-focus-nav="auto|spatial|native|none"` policy. Under `auto`, enabled gamepads and independent logical contexts use spatial navigation; synchronized keyboard context 1 keeps native arrows. `spatial` opts a region into keyboard directions; `native` preserves keyboard directions without disabling gamepad; `none` blocks automatic directional navigation. See [Focus examples and boundaries](focus.md#spatial-navigation-and-input-policy).

Input continues to normalize D-pad and primary-stick directions, resolve synchronous routers and request `focus.command` through `comm`; it does not select targets or read spatial geometry. Application-registered adapters follow the same route: explicit spatial policy permits normalized directions from other sources in synchronized contexts without assuming every future source wants spatial behavior. Input prevents a physical event's default only when Focus reports consumption; no destination leaves the command unhandled. Native Tab, editing/IME, modified arrows, ARIA widget commands and already handled events remain protected.

## Modalities and loading

`data-ae-inputs="point keyboard gamepad"` selects enabled adapters. The inherited default is `point keyboard`; gamepad requires opt-in. An empty value disables input in that scope. Nested mounted scopes may enable additional modalities. Changing the attribute refreshes adapters automatically; await `$ae.ext.input.refresh()` when subsequent code needs the new adapter immediately.

```html
<main data-ae-inputs="point keyboard gamepad" data-ae-focus-scope>
  <button data-ae-shortcut="keyboard:KeyI; gamepad:north">
    Inventory <kbd data-ae-shortcut-hint aria-hidden="true"></kbd>
  </button>
</main>
```

```js
$ae.ext("input", { loadStyle: true });
$ae.ext("focus");
$ae.init({ mode: "basic" });
```

Full supplies the Input stylesheet through `aellux.full.css`. Basic can request `aellux.ext.input.css` with `loadStyle: true`. Point, Keyboard and Gamepad implementations are independent `aellux.input.*.js` assets, fetched only when enabled, through the existing dependency loader and boot integrity metadata. Modern/minified and Legacy variants are generated. Adapter initialization completes before the mount/Ready promise. No gamepad polling or gamepad asset request occurs while Gamepad is disabled. Adapters enabled later load asynchronously; callers may await `refresh()`.

`registerAdapter(name, factory)` adds a modality; its factory returns an adapter (or Promise) with `init()` and `destroy()`. It returns a removal function. Use the factory to load an application adapter on demand. Source commands can be submitted with `dispatchCommand(command)`; unregistered/disabled sources do not dispatch.

## Pointer compatibility

`input` is an official **Bundled Extension** that tracks the pointers currently pressed or hovering over the document and relates them to mounted elements with `data-ae-point`. It is included in the `full` runtime. Basic requires explicit registration; the example below loads it eagerly during mounting:

```html
<div id="canvas" data-ae-point="2"></div>
```

```js
$ae.ext("input");
$ae.init({ mode: "basic" });
$ae.on("Ready", function (event) {
  const pointers = $ae("canvas").input.pointers();
  console.log(pointers);
})
```

An empty `data-ae-point` allows one pointer by default. A non-negative integer sets the maximum number of pointers associated with that element; `0` disables association and invalid values use the default of one. Each pointer selects the nearest mounted element with available capacity, continuing up the ancestor tree if a nearer element is full or disabled. The mounted controller method `$ae(elementOrId).input.pointers()` returns the pointers whose current `target` is that element.

Each pointer record is an `AePointer` instance with `pointerId`, `pointerType`, `initial`, `current`, `delta`, `movement`, `time`, `deltaTime`, `buttons`, `pressed`, `hover`, `target`, and `pressStart`. Positions use viewport `clientX` and `clientY` coordinates as `{ x, y }`; `delta` is `current - initial`, while `movement` is `current - last dispatched position`. The first dispatched event has zero movement. Events with no recipient do not advance that reference position. `time.pressStart` and `time.pressEnd` are `performance.now()` timestamps in milliseconds. Both are `null` before a press; `pressEnd` remains `null` while pressed. `deltaTime` returns the elapsed milliseconds from `pressStart` to the current time while pressed, then the fixed duration between `pressStart` and `pressEnd`. Each new press resets the timing. `target` is the current mounted element or `null`; `pressStart` is the element selected on the latest `pointerdown`, or `null` before the first press. The array returned by `pointers()` is a snapshot; its pointer records update in place.

The Extension listens to `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, and `pointerout` in the capture phase. It dispatches `AelluxJsPointerDown`, `AelluxJsPointerMove`, `AelluxJsPointerUp`, `AelluxJsPointerCancel`, and `AelluxJsPointerHover` directly on the selected element. These events use `bubbles: false`, so an ancestor does not receive a child's event unless it becomes the selected target. `detail` contains `pointer`, the current `target`, the `pressStart` element, and `originalEvent`. `PointerUp` and `PointerCancel` reach the current target and the press origin when they differ, once per element. When release occurs outside every marked element, `detail.target` is `null` and the event still reaches `pressStart`. Unmounting an element clears matching stored references. Hover events also set `detail.hover` to `true` or `false` and are sent only when the selected target changes. The initial position is set on the first observed hover or press and resets on each press. Mouse and pen pointers remain tracked while hovering after release. Touch pointers leave after their `PointerUp` event; canceled pointers leave after `PointerCancel`. Destroying the Extension removes its listeners, mount map, and tracked pointers.

## Tap recognition

Mounted `button[data-ae-point]`, `a[data-ae-point]` and `[role="button"][data-ae-point]` controls also emit `AelluxJsTap`. The nearest Input target must be eligible and enabled; an attribute on an unmounted element does not activate recognition. Native disabled controls (including disabled fieldsets), `aria-disabled="true"`, inert controls and `data-ae-point="0"` cannot tap.

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

Scroll events never independently cancel recognition, including inside Scrollbox. A valid tap still emits when an Input notification or tap handler scrolls an element. Native `pointercancel` and pointer movement limits continue to apply. Input does not prevent defaults, synthesize clicks, wait for clicks or deduplicate tap against click. A pointer activation can emit both `tap` and native `click`; consumers subscribing to both must coordinate their own actions. Keyboard activation keeps its native click path and does not generate tap.

## Commands and device identity

Commands are immutable snapshots with `deviceId`, `source`, physical `code`, semantic `action` (or `null`), `phase` (`press`, `release`, `repeat`, `move`, `cancel`), monotonic `timestamp`, and resolved positive integer `focusId`. Optional fields include `originalEvent`, `target`, `key`, exact `modifiers` (`ctrl`, `alt`, `shift`, `meta`), pointer `contactId`, coordinates, and gamepad `index`, `model`, `family`, `mapping`, `value`.

Keyboard uses `deviceId: "keyboard"` and physical KeyboardEvent codes such as `KeyI`. Pointer sources use `point:mouse`, `point:touch` or `point:pen`; `contactId` identifies the transient contact, not a persistent physical device. Browsers do not expose independent physical keyboard identities through Keyboard Events.

Each observed gamepad session receives a fresh `gamepad:N` ID. The Gamepad API index is separate metadata. Disconnect/reconnect, a detected model replacement or a move to a different index creates a new session. Never persist player assignments by index. Identical devices replaced without an observable disconnection cannot be distinguished reliably; refresh associations from device lifecycle events. Browser exposure can require a user gesture and may be denied by Permissions Policy. See the [Gamepad specification](https://w3c.github.io/gamepad/).

Standard mapping button codes are `south`, `east`, `west`, `north`, shoulder/trigger/stick buttons, `select`, `start`, `dpad-up/down/left/right`, and `home`. Nonstandard mappings keep `buttonN` and `axisN`; no positional layout is invented. Face positions have **no implicit confirm/cancel action**. Directional pads and standard left-stick directions produce navigation. Keyboard Enter/Space map to confirm, Escape to cancel, and arrows to navigation, while the DOM-synchronized keyboard context retains native behavior by default; explicitly spatial regions enable contextual directions.

```js
// Explicit application convention; it does not change physical button codes.
$ae.ext.input.setActionMap("gamepad", { south: "confirm", east: "cancel" });
```

Gamepad polling runs on animation frames only while at least one exposed device is connected and the document is visible. Connection events wake an idle adapter. Axes have a 0.55 engagement / 0.35 release dead zone; small changes do not switch active input. Held controls repeat after 400 ms, every 100 ms. Hiding the document suspends polling. Button holds on resume require release before another activation.

Families (`xbox`, `playstation`, `nintendo`, `generic`) are best-effort model heuristics, used for presentation only. `registerGamepadFamily(id => familyOrNull, { priority })` adds a detector and returns its remover. Register detectors before connecting devices; reconnect to reidentify an existing session.

## Synchronous routing

```js
const associations = new Map();
const remove = $ae.ext.input.registerRouter(command => {
  // undefined: no association; null: explicitly blocked; positive integer: destination.
  return associations.get(command.deviceId);
}, { priority: 10, owner: "my-extension" });

associations.set(deviceId, 2);
associations.set(disabledDeviceId, null);
remove();
```

Higher priority runs first. Equal priorities follow registration order. The first result other than `undefined` decides the route. No applicable result means focus `1`. `null` blocks and never falls back. Invalid results (including Promises, zero and strings) or router errors diagnose and block. A valid ID without a Focus context diagnoses in Focus and does not fall back. A router cannot create a context implicitly.

The optional `owner` can be an Extension's kebab-case name or a DOM element. Extension destruction and element unmount/detachment release its routers. An `AbortSignal` also provides deterministic cleanup. Application code may call `removeRouters(owner)`. `resolveFocusId(command)` is a synchronous routing probe.

Processing order is capture → normalization → routing → `BeforeInputCommand` → synchronous `$ae.comm.request("focus.command", command)` → `InputCommand`. `BeforeInputCommand` can cancel processing, but cannot mutate the frozen destination. `InputCommand` observes `{ command, handled }` after consumption. `InputBlocked` observes blocked commands. `InputDeviceConnected` / `InputDeviceDisconnected` carry `{ device }`. Components should consume routed commands through Focus, rather than routing by DOM listener order.

## CSS shortcut hints

`data-ae-shortcut-hint` accepts a descriptor or inherits the closest `data-ae-shortcut`. Hints work with Input alone. A shared parser describes `source:code` alternatives separated by semicolons; exact modifier combinations use `keyboard:Ctrl+Shift+KeyI`. Input publishes `data-ae-shortcut-label`, `data-ae-shortcut-source`, `data-ae-shortcut-code`, `data-ae-gamepad-family`, and `data-ae-gamepad-model`. The default `::before` reads the label; CSS supplies shape and color. No SVG, image or icon font is used.

Use `data-ae-shortcut-focus="2"` to select a context's presentation. `setHintContext(2, { source: "gamepad", family: "playstation", model: "DualSense" })` sets it programmatically. Intentional routed interaction updates that focus's metadata; unrelated contexts remain independent. Native synthetic events and analog noise do not change presentation. Global `data-ae-active-input` is only a convenience output, never an adapter switch.

`data-ae-gamepad="true|false"` on the root reports exposed connected devices while the Gamepad adapter is enabled, independently of last interaction. `data-ae-gamepad-family` and model describe the last intentional gamepad. Hints restore authored metadata on unmount/destroy. Give redundant visual hints `aria-hidden="true"` and retain an accessible action name.

Customize `--ae-shortcut-hint-border`, `--ae-shortcut-hint-radius`, `--ae-shortcut-hint-color`, and `--ae-shortcut-hint-background`, or override the selectors/pseudoelement entirely. Optional `data-ae-shortcut-hint-position="anchor"` uses CSS Anchor Positioning and `--ae-shortcut-anchor` (default `--ae-shortcut`); declare the corresponding `anchor-name` on the action. Unsupported browsers retain inline layout.

## Migration

The public `point` Extension and its `aellux.ext.point*.js` artifacts become `input` / `aellux.ext.input*.js`. Replace `$ae.ext("point")`, `$ae.wait("point")`, and `.point.pointers()` with `input`. No second public Point Extension or compatibility bundle is registered. The `data-ae-point` pointer-capacity attribute and Pointer/Tap events remain compatible. Deploy the new boot, runtime and adapter artifacts together.

## Known Limits & Risks

Gamepad family recognition is heuristic, and native screen-reader focus cannot provide simultaneous independent accessibility focus. Applications must expose semantic native controls and choose an accessible single-focus path. Multiplayer assignment, accounts and teams remain outside Input and Focus. Pointer Events have no separate legacy mouse/touch fallback; independently identifiable physical keyboards are not exposed. Gamepad tests use controlled browser API snapshots and do not replace checks with real controllers.

## Distribution cost

Input/Focus introduction checkpoint, before the shared communication mediator: measured minified bytes, raw / gzip level 9, against the preceding checked-in artifacts. Current mediator-related costs are in [Shared Communication](../runtime/communication.md).

| Artifact | Before | After |
| --- | --- | --- |
| Boot | 50,763 / 17,392 | 52,178 / 18,022 |
| ESM | 27,220 / 9,391 | 27,643 / 9,507 |
| Orchestrator Modern | 66,666 / 21,990 | 67,197 / 22,156 |
| Full Modern | 214,313 / 66,682 | 225,397 / 70,012 |
| Full Legacy | 540,520 / 161,215 | 561,989 / 166,083 |
| Focus Modern | 3,623 / 1,631 | 11,460 / 4,500 |
| Focus Legacy | 4,741 / 2,176 | 15,004 / 5,476 |
| Input Modern | New | 9,892 / 3,891 |
| Input Legacy | New | 19,140 / 6,814 |
| Point adapter Modern / Legacy | Separate assets | 6,197 / 2,289; 9,633 / 3,525 |
| Keyboard adapter Modern / Legacy | Separate assets | 845 / 479; 896 / 493 |
| Gamepad adapter Modern / Legacy | Separate assets | 3,863 / 1,704; 6,293 / 2,550 |
| Input CSS | New | 1,014 / 458 |

Full embeds Input and Focus but downloads only requested physical adapters separately. These are distribution measurements, without page/network runtime benchmarks. Boot grows for signed adapter metadata; ESM/Orchestrator grow for the synchronous channel and lifecycle integration. The previous Boot 50/17 KiB, ESM 26.75/9.25 and Orchestrator Modern 65.25/21.5 budgets become 51.5/18, 27.25/9.5 and 66/21.75. Focus's former 5/3 KiB budgets become Modern 11.5/4.5 and Legacy 15.25/5.5. Full stays within its existing limits. Dedicated Input/adapter/CSS budgets replace deleted Point artifact budgets.
