# Events

AelluxJs names its DOM events with the `AelluxJs` prefix. The main API listens on `document`; `onEvent` and `offEvent` listen on an explicit target; a mounted element controller listens on its element. A document listener also receives bubbling events from elements:

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

## Runtime lifecycle

| Event | When it is dispatched |
| --- | --- |
| `AelluxJsAwake` | The modern runtime script loads, before its startup begins. |
| `AelluxJsLegacy` | The legacy fallback script loads, before its startup begins. |
| `AelluxJsBeforeMount` | <span style="white-space: normal !important;">Cancelable before a valid mount pass changes waiting state, processes declarative links, loads Extensions or invokes mount callbacks.</span> |
| `AelluxJsMount` | <span style="white-space: normal !important;">A valid mount pass finishes. It can also fire when the pass finds no new elements.</span> |
| `AelluxJsReady` | <span style="white-space: normal !important;">Startup completes its initial mount pass. The orchestrator is available, although individual Extensions or elements may have failed to mount.</span> |
| `AelluxJsBeforeUnmount` | <span style="white-space: normal !important;">Cancelable before a valid unmount pass invokes cleanup callbacks or removes registrations and controllers.</span> |
| `AelluxJsUnmount` | <span style="white-space: normal !important;">A valid unmount pass finishes. It can also fire when no matching elements were mounted.</span> |
| `AelluxJsUpdate` | <span style="white-space: normal !important;">A valid `$ae.mountManager.update(...)` pass finishes after awaiting the matching mounted `update` callbacks. It also fires if no matching callback exists.</span> |

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

These events are available when the corresponding Extension is loaded. Events from elements bubble to `document` unless marked otherwise.

| Extension | Event | Target and payload |
| --- | --- | --- |
| Adaptive | `AelluxJsAdaptiveUpdate` | Updated element; `detail` is `{ width, height, ratio }`. |
| Feedback | `AelluxJsFeedback` | <span style="white-space: normal !important;">Feedback target, or `document`; `detail` is `{ type, message, value, target, motion }`. The event is cancelable. A matching mounted feedback boundary stops propagation.</span> |
| Point | <span style="white-space: normal !important;">`AelluxJsPointerDown`, `AelluxJsPointerMove`, `AelluxJsPointerUp`, `AelluxJsPointerCancel`, `AelluxJsPointerHover`</span> | <span style="white-space: normal !important;">Selected element; `detail` includes `pointer`, `target`, `pressStart`, `originalEvent`, and `hover`. These events do **not** bubble.</span> |
| Point | `AelluxJsTap` | <span style="white-space: normal !important;">Eligible mounted button, link or role button; bubbling and composed. `detail` is `{ pointerType, pointerId, duration, distance, originalEvent }`. Emitted on a valid short primary release, independently of native click and scroll.</span> |
| Preference | `AelluxJsPreferencesChange` | <span style="white-space: normal !important;">`document`; `detail` is `{ changed, preferences }`, with a changed-key array and a snapshot of current values. `changed` can be empty.</span> |
| Present | `AelluxJsBeforePop`, `AelluxJsBeforeUnpop` | Present element; cancelable before a transition starts. |
| Present | <span style="white-space: normal !important;">`AelluxJsPopping`, `AelluxJsUnpopping`, `AelluxJsPop`, `AelluxJsUnpop`</span> | <span style="white-space: normal !important;">Present element; transition start and completion notifications.</span> |
| Present | `AelluxJsLayout` | <span style="white-space: normal !important;">Present element; bubbles when a Pop or Unpop transition starts. `detail` contains `origin` (`"present.pop"` or `"present.unpop"`) and `durationMs`, the maximum expected layout change time in milliseconds. Anchor listens on the shared positioning parent.</span> |
| Present | `AelluxJsUnpopFocusLost` | <span style="white-space: normal !important;">`document`; `detail` is `{ element, focused }`, identifying the closed Present region and the element that lost focus.</span> |
| Scrollbox | `AelluxJsScrollboxSnapChange` | <span style="white-space: normal !important;">Scrollbox element; `detail` is `{ item, index, previousIndex, axis }` after a new snap item is selected and scrolling settles. The initial item uses `previousIndex: null`.</span> |
| Scrollbox | `AelluxJsScrollboxInteraction` | <span style="white-space: normal !important;">Scrollbox element; `detail` is `{ reason, active }` for `scrollbar`, `pointer`, or `elastic`. It is the integration hook used by Scrollbox Snap to suspend and resume native snap alignment.</span> |
| Scrollbox | `AelluxJsScrollboxSnapGesture` | <span style="white-space: normal !important;">Scrollbox element; desktop PDS integration event. `detail` includes `phase` (`"probe"`, `"start"`, or `"end"`), `axis`, `moved`, start and final coordinates, and timestamps. Probe and end are cancelable; Scrollbox Snap accepts a short eligible flick at probe, then cancels end to prevent PDS momentum before snap settles the gesture.</span> |
| Scrollbox | `AelluxJsScrollboxWheel` | <span style="white-space: normal !important;">Scrollbox element; cancelable before Scrollbox handles a cancelable wheel event targeted at that box. `detail.event` is the native wheel event. Scrollbox Snap cancels it when it advances an item.</span> |
| Scrollbox | `AelluxJsPointerScrollStart`, `AelluxJsPointerScrollEnd` | <span style="white-space: normal !important;">Pointer gesture's originating scrollbox; `detail` is `{ axis, pointerId, pointerType, elements }`. `elements` lists the scrollboxes activated for that gesture. A short flick that never activates PDS does not emit them.</span> |
| State Navigation | `AelluxJsSnapshotChange`, `AelluxJsSnapshotRestore` | <span style="white-space: normal !important;">`document`; `detail` contains copies of `snapshot`, `removeSnapshot`, and `popState`.</span> |

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
| `AelluxJsPushState` | <span style="white-space: normal !important;">State Navigation; `{ key, value, title? }`. Focus dispatches it when the focused element has an ID.</span> |
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

The external [PWA Extension](../core-extensions/pwa.md) normalizes `PwaInstallAvailable`, `PwaInstallRequested`, `PwaInstallAccepted`, `PwaInstallDismissed`, `PwaInstallManual`, `PwaInstalled`, `PwaWorkerRegistered`, `PwaUpdateAvailable`, `PwaUpdateComplete` and `PwaError` through `AelluxJs.eventName()`. All include `detail.status`; worker notifications include `registration`, and errors include `operation` and `error`. They bubble from an initiating control or dispatch on `document`. No PWA event listener is installed until the Extension is explicitly initialized.
