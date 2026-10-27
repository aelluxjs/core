# Events

AelluxJs uses the `AelluxJs` prefix for its DOM events by default. Its event helpers also accept exact names without this prefix. The main API listens on `document`; `onEvent` and `offEvent` listen on an explicit target; a mounted element controller listens on its element. A document listener also receives bubbling events from elements:

```js
const onUpdate = event => console.log(event.type);
$ae.on("Update", onUpdate);
$ae.off("Update", onUpdate);

const panel = $ae("panel");
const onLayout = event => console.log(event.target);
panel.on("Layout", onLayout);
panel.off("Layout", onLayout);
```

The modern runtime dispatches `CustomEvent` objects; the boot API uses a regular `Event` until the runtime starts. Unless noted below, events bubble, are not cancelable, and have no `detail` payload.

## Event names and formatting

`$ae.eventName(name)` returns the DOM event type used by AelluxJs. The same conversion applies to `on`, `off`, `onEvent`, `offEvent`, `dispatch`, `dispatchFrom`, and a mounted element controller's `on`, `off` and `dispatch`. Naming follows the same rules in the boot API and the Modern and Legacy runtimes.

```js
$ae.eventName("ready");           // "AelluxJsReady"
$ae.eventName("viewportChange");  // "AelluxJsViewportChange"
$ae.eventName("viewport-change"); // "AelluxJsViewportChange"
$ae.eventName("AelluxJsReady");   // "AelluxJsReady"
```

For a name without an escape marker, a name already starting with the exact `AelluxJs` prefix is returned unchanged. Otherwise, the helper uppercases an initial lowercase ASCII letter and lowercase letters following `-`, removes those hyphens, and adds the prefix. Existing uppercase letters and other characters are preserved. The table below uses the default prefix shipped with aellux.js:

| Input | DOM event type |
| --- | --- |
| `ready`, `Ready` | `AelluxJsReady` |
| `viewportChange`, `ViewportChange`, `viewport-change` | `AelluxJsViewportChange` |
| `pointerDown`, `PointerDown`, `pointer-down` | `AelluxJsPointerDown` |
| `pointerdown` | `AelluxJsPointerdown` |
| `AelluxJsPointerDown` | `AelluxJsPointerDown` |
| `AelluxJsready` | `AelluxJsready` |
| `my_event` | `AelluxJsMy_event` |
| `my.event` | `AelluxJsMy.event` |
| `click` | `AelluxJsClick` |
| `$click`, `#click`, `_click`, `!click` | `click` |
| `!my-CustomEvent` | `my-CustomEvent` |

Event types are case-sensitive. The helper does not infer word boundaries in an all-lowercase name, so `pointerdown` does not identify the official `AelluxJsPointerDown` notification. Already-prefixed names are not reformatted or repaired. Underscores and dots inside a name are preserved, and unescaped names are not trimmed. Pass one event name per call; spaces and commas do not declare multiple listeners.

### Exact names without the prefix

A leading `$`, `#`, `_` or `!` bypasses prefixing and capitalization. These four markers have identical naming behavior: exactly one leading marker is removed, then surrounding whitespace is trimmed from the remaining name. Case, punctuation and internal whitespace are preserved. The marker must be the first character of the input.

```js
$ae.eventName("$  resize  ");    // "resize"
$ae.eventName("!my-CustomEvent"); // "my-CustomEvent"
$ae.eventName("!!custom");        // "!custom"
```

Use an exact name to listen for a native DOM event through the Aellux helpers:

```js
const button = document.createElement("button");
const onClick = event => console.log(event.type); // "click"

$ae.onEvent(button, "$click", onClick);
button.click();
$ae.offEvent(button, "$click", onClick);
```

Without the marker, `onEvent(button, "click", handler)` listens for `AelluxJsClick`. The same escape syntax works for custom events from other libraries; it is not restricted to native event names.

The markers only select the event name. They do not enable delegation, change propagation or cancellation, or convert a dispatched `CustomEvent` into a `MouseEvent` or `PointerEvent`. For example, `dispatch("$click")` emits an event named `click` using the dispatch implementation described above.

### Native DOM APIs and listener removal

Native `addEventListener`, `removeEventListener`, `Event` and `CustomEvent` use the exact string supplied to them. They do not apply Aellux prefixes or remove escape markers. Use `click` directly for a native click listener, and use `$ae.eventName(name)` to obtain an Aellux event type:

```js
const type = $ae.eventName("panel-ready");
const onPanelReady = event => console.log(event.detail.panelId);

document.addEventListener(type, onPanelReady);
$ae.dispatch("panel-ready", { detail: { panelId: "main" } });
document.removeEventListener(type, onPanelReady);
```

Here `panel-ready` is an application-defined event. To remove a listener, use the same target, handler reference, resulting DOM event type and `capture` value. Different input spellings can identify the same resulting event type, as shown in the conversion table.

## Listener targets and dispatch options

`on(event, handler, options)` and `off(event, handler, options)` listen on `document`. Use `onEvent(target, event, handler, options)` and `offEvent(target, event, handler, options)` for any other `EventTarget`, including `window`, an element, or a media query. A mounted element controller's `on` and `off` use its element. The optional `options` argument is passed to the native listener methods; use the same `capture` value when removing a listener.

```js
const onResize = event => console.log(event.type); // "resize"
$ae.onEvent(window, "$resize", onResize, { passive: true });
// When the listener is no longer needed:
$ae.offEvent(window, "$resize", onResize);
```

`dispatch(event, options?)` dispatches from `document`, and `dispatchFrom(target, event, options?)` dispatches from another event target. A mounted element controller's `dispatch` uses its element. These methods return the native `dispatchEvent()` boolean: `false` if a cancelable event was canceled, otherwise `true`.

Events bubble by default and are not cancelable unless requested. Pass `detail`, `bubbles` or `cancelable` in `options`. The boot API includes `detail` on its regular `Event` objects before the orchestrator replaces dispatch with `CustomEvent` creation. A raw name selects the exact event type under either implementation.

## Runtime lifecycle

| Event | When it is dispatched |
| --- | --- |
| `AelluxJsAwake` | The modern runtime script loads, before its startup begins. |
| `AelluxJsLegacy` | The legacy fallback script loads, before its startup begins. |
| `AelluxJsBeforeMount` | <span class="large">Cancelable before a valid mount pass changes waiting state, processes declarative links, loads Extensions or invokes mount callbacks.</span> |
| `AelluxJsMount` | <span class="large">A valid mount pass finishes. It can also fire when the pass finds no new elements.</span> |
| `AelluxJsReady` | <span class="large">Startup completes its initial mount pass. The orchestrator is available, although individual Extensions or elements may have failed to mount.</span> |
| `AelluxJsBeforeUnmount` | <span class="large">Cancelable before a valid unmount pass invokes cleanup callbacks or removes registrations and controllers.</span> |
| `AelluxJsUnmount` | <span class="large">A valid unmount pass finishes. It can also fire when no matching elements were mounted.</span> |
| `AelluxJsUpdate` | <span class="large">A valid `$ae.mountManager.update(...)` pass finishes after awaiting the matching mounted `update` callbacks. It also fires if no matching callback exists.</span> |

These lifecycle events are dispatched on `document`. `Mount`, `Unmount`, and `Update` carry `detail: { root, extensions, elements }`. `root` is the resolved root of the pass, `extensions` is the selected name array or `null` for all Extensions, and `elements` contains distinct elements actually mounted, unmounted, or passed to an `update` callback. An update callback that throws still counts as invoked. The array is empty for a pass with no affected elements. An invalid root does not start a pass or dispatch its event. `$ae(element).update()` and an Extension controller's `update()` use this same mount manager. For a size update on one Adaptive element, listen for `AelluxJsAdaptiveUpdate` instead.

`BeforeMount` and `BeforeUnmount` carry `detail: { root, extensions }`, with normalized Extension names in a new array, or `null` for all Extensions. `BeforeUnmount` also includes `detachedOnly`, which is `true` for automatic cleanup of removed elements and `false` for explicit passes. Call `event.preventDefault()` synchronously to cancel the entire pass. A canceled mount resolves to `[]`; a canceled unmount resolves to `false`. No matching completion event is emitted, no callback runs, and mounted controllers and waiting attributes retain their previous state. Valid empty passes still emit their before and completion events. `Update` has no cancellation hook.

These hooks also cover startup mounting, element controller methods and automatic detached cleanup. Canceling the startup mount still allows `Ready`; applications can retry mounting later. A veto of detached cleanup preserves the registrations until a later cleanup or explicit unmount; it does not create a retry loop. `destroyExtensions()` and `destroy()` return `false` when their unmount is canceled and preserve the Extensions and runtime resources. Ajax Href retains a region whose unmount was canceled and continues processing its other selected regions.

```js
const preventUnmount = event => {
  if (event.detail.root === document.getElementById("editor") && hasUnsavedChanges()) {
    event.preventDefault();
  }
};
$ae.on("BeforeUnmount", preventUnmount);

const unmounted = await $ae.unmount("editor"); // false when canceled
$ae.off("BeforeUnmount", preventUnmount);
```

```js
document.addEventListener("AelluxJsMount", event => {
  console.log(event.detail.elements); // Newly mounted DOM elements.
});

await $ae.mountManager.update(document.getElementById("panel"));
```

## Core Extension notifications

Viewport events always originate from the observed element, including when `data-ae-viewport-target` redirects CSS outputs to another element. Missing or conflicting CSS destinations do not suppress geometry events. See [Viewport CSS targets](../core-extensions/optional/viewport.md#publishing-on-another-element).

These events are available when the corresponding Extension is loaded. Events from elements bubble to `document` unless marked otherwise.

| Extension | Event | Target and payload |
| --- | --- | --- |
| Adaptive | `AelluxJsAdaptiveUpdate` | Updated element; `detail` is `{ width, height, ratio }`. |
| Viewport | `AelluxJsViewportChange` | <span class="large">Observed element; bubbling, composed and noncancelable. First measurable publication, then relevant geometry/reference changes, including loss and recovery of measurability. `detail` is `{ viewport, x1, y1, x2, y2, x, y, visible, state, measurable, previous, initial }`. Coordinates are unclamped, physical and always include both axes. CSS positions remain clamped. `previous` is an independent snapshot; initial unknown geometry is silent.</span> |
| Viewport | `AelluxJsViewportFullyInside`, `AelluxJsViewportFullyOutside` | <span class="large">Same target, propagation and payload as Change. Emitted after Change only on entry into `inside` (all edges contained, inclusive) or `outside` (no positive-area intersection), including an initial matching measurable state. Unknown geometry uses null coordinates/state and never generates a Fully event; unmount/destroy do not imply FullyOutside. See [Viewport Events](../core-extensions/optional/viewport.md#viewport-events) for ordering, tolerance and scheduling limits.</span> |
| Feedback | `AelluxJsFeedback` | <span class="large">Feedback target, or `document`; `detail` is `{ type, message, value, target, motion }`. The event is cancelable. A matching mounted feedback boundary stops propagation.</span> |
| Point | <span class="large">`AelluxJsPointerDown`, `AelluxJsPointerMove`, `AelluxJsPointerUp`, `AelluxJsPointerCancel`, `AelluxJsPointerHover`</span> | <span class="large">Selected element; `detail` includes `pointer`, `target`, `pressStart`, `originalEvent`, and `hover`. These events do **not** bubble.</span> |
| Point | `AelluxJsTap` | <span class="large">Eligible mounted button, link or role button; bubbling and composed. `detail` is `{ pointerType, pointerId, duration, distance, originalEvent }`. Emitted on a valid short primary release, independently of native click and scroll.</span> |
| Preference | `AelluxJsPreferencesChange` | <span class="large">`document`; `detail` is `{ changed, preferences }`, with a changed-key array and a snapshot of current values. `changed` can be empty.</span> |
| Present | `AelluxJsBeforePop`, `AelluxJsBeforeUnpop` | Present element; cancelable before a transition starts. |
| Present | <span class="large">`AelluxJsPopping`, `AelluxJsUnpopping`, `AelluxJsPop`, `AelluxJsUnpop`</span> | <span class="large">Present element; transition start and completion notifications.</span> |
| Present | `AelluxJsLayout` | <span class="large">Present element; bubbles when a Pop or Unpop transition starts. `detail` contains `origin` (`"present.pop"` or `"present.unpop"`) and `durationMs`, the maximum expected layout change time in milliseconds. Anchor listens on the shared positioning parent.</span> |
| Present | `AelluxJsUnpopFocusLost` | <span class="large">`document`; `detail` is `{ element, focused }`, identifying the closed Present region and the element that lost focus.</span> |
| Scrollbox | `AelluxJsScrollboxSnapChange` | <span class="large">Scrollbox element; `detail` is `{ item, index, previousIndex, axis }` after a new snap item is selected and scrolling settles. The initial item uses `previousIndex: null`.</span> |
| Scrollbox | `AelluxJsScrollboxInteraction` | <span class="large">Scrollbox element; `detail` is `{ reason, active }` for `scrollbar`, `pointer`, or `elastic`. It is the integration hook used by Scrollbox Snap to suspend and resume native snap alignment.</span> |
| Scrollbox | `AelluxJsScrollboxSnapGesture` | <span class="large">Scrollbox element; desktop PDS integration event. `detail` includes `phase` (`"probe"`, `"start"`, or `"end"`), `axis`, `moved`, start and final coordinates, and timestamps. Probe and end are cancelable; Scrollbox Snap accepts a short eligible flick at probe, then cancels end to prevent PDS momentum before snap settles the gesture.</span> |
| Scrollbox | `AelluxJsScrollboxWheel` | <span class="large">Scrollbox element; cancelable before Scrollbox handles a cancelable wheel event targeted at that box. `detail.event` is the native wheel event. Scrollbox Snap cancels it when it advances an item.</span> |
| Scrollbox | `AelluxJsPointerScrollStart`, `AelluxJsPointerScrollEnd` | <span class="large">Pointer gesture's originating scrollbox; `detail` is `{ axis, pointerId, pointerType, elements }`. `elements` lists the scrollboxes activated for that gesture. A short flick that never activates PDS does not emit them.</span> |
| State Navigation | `AelluxJsSnapshotChange`, `AelluxJsSnapshotRestore` | <span class="large">`document`; `detail` contains copies of `snapshot`, `removeSnapshot`, and `popState`.</span> |

```js
panel.addEventListener("AelluxJsLayout", event => {
  console.log(event.detail.origin); // "present.pop" or "present.unpop"
  console.log(event.detail.durationMs); // Maximum transition time in milliseconds.
});
```

## Extension command events

These are requests that one Extension or application can dispatch for another Extension to handle. They are not lifecycle notifications.

| Event | Consumer and required `detail` |
| --- | --- |
| `AelluxJsPushState` | <span class="large">State Navigation; `{ key, value, title? }`. Focus dispatches it when the focused element has an ID.</span> |
| `AelluxJsPushAjaxReplace` | State Navigation; `{ url, selectors }`. |
| `AelluxJsUpdateBaseTitle` | State Navigation; `{ title }`. |

Dispatch a command on `document` like this:

```js
$ae.dispatch("PushState", {
  detail: { key: "section", value: "intro" }
});
```

See [State Navigation](../core-extensions/state-navigation.md) for validation rules and history behavior. Scrollbox publishes native `scroll` events rather than a separate `AelluxJsScroll` event.

## Optional PWA notifications

The external [PWA Extension](../core-extensions/optional/pwa.md) normalizes `PwaInstallAvailable`, `PwaInstallRequested`, `PwaInstallAccepted`, `PwaInstallDismissed`, `PwaInstallManual`, `PwaInstalled`, `PwaWorkerRegistered`, `PwaUpdateAvailable`, `PwaUpdateComplete` and `PwaError` through `AelluxJs.eventName()`. All include `detail.status`; worker notifications include `registration`, and errors include `operation` and `error`. They bubble from an initiating control or dispatch on `document`. No PWA event listener is installed until the Extension is explicitly initialized.
