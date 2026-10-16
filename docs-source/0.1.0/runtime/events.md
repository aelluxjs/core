# Events

AelluxJs names its DOM events with the `AelluxJs` prefix. The main API listens on `document`; a mounted element controller listens on its element. A document listener also receives bubbling events from elements:

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
| `AelluxJsMount` | A valid mount pass finishes. It can also fire when the pass finds no new elements. |
| `AelluxJsReady` | Startup completes its initial mount pass. The orchestrator is available, although individual Extensions or elements may have failed to mount. |
| `AelluxJsUnmount` | A valid unmount pass finishes. It can also fire when no matching elements were mounted. |
| `AelluxJsUpdate` | A valid `$ae.mountManager.update(...)` pass finishes after awaiting the matching mounted `update` callbacks. It also fires if no matching callback exists. |

These lifecycle events are dispatched on `document`. `AelluxJsUpdate` is a pass completion signal: it does not identify an element, include a `detail` payload, or mean that a visual change occurred. An invalid root does not start an update pass and does not dispatch it. `$ae(element).update()` and an Extension controller's `update()` use this same mount manager. For a size update on one Adaptive element, listen for `AelluxJsAdaptiveUpdate` instead.

```js
document.addEventListener("AelluxJsUpdate", () => {
  // A mount manager update pass finished.
});

await $ae.mountManager.update(document.getElementById("panel"));
```

## Core Extension notifications

These events are available when the corresponding Extension is loaded. Events from elements bubble to `document` unless marked otherwise.

| Extension | Event | Target and payload |
| --- | --- | --- |
| Adaptive | `AelluxJsAdaptiveUpdate` | Updated element; `detail` is `null`. |
| Feedback | `AelluxJsFeedback` | Feedback target, or `document`; `detail` is `{ type, message, value, target }`. |
| Point | `AelluxJsPointerDown`, `AelluxJsPointerMove`, `AelluxJsPointerUp`, `AelluxJsPointerCancel`, `AelluxJsPointerHover` | Selected element; `detail` includes `pointer`, `target`, `pressStart`, `originalEvent`, and `hover`. These events do **not** bubble. |
| Preference | `AelluxJsPreferencesChange` | `document`; dispatched on each preference update, even if values do not change. |
| Present | `AelluxJsBeforePop`, `AelluxJsBeforeUnpop` | Present element; cancelable before a transition starts. |
| Present | `AelluxJsPopping`, `AelluxJsUnpopping`, `AelluxJsPop`, `AelluxJsUnpop` | Present element; transition start and completion notifications. |
| Present | `AelluxJsLayout` | Present element; bubbles after a completed Pop or Unpop to indicate that layout may have changed. Anchor listens for it on the shared positioning parent. |
| Present | `AelluxJsUnpopFocusLost` | `document`; an active descendant lost focus while the region closed. |
| State Navigation | `AelluxJsSnapshotChange`, `AelluxJsSnapshotRestore` | `document`; `detail` contains `snapshot`, `removeSnapshot`, and `popState`. |

```js
panel.addEventListener("AelluxJsLayout", () => {
  console.log("A completed Present transition may have changed layout");
});
```

## Extension command events

These are requests that one Extension or application can dispatch for another Extension to handle. They are not lifecycle notifications.

| Event | Consumer and required `detail` |
| --- | --- |
| `AelluxJsPushState` | State Navigation; `{ key, value, title? }`. Focus dispatches it when the focused element has an ID. |
| `AelluxJsPushAjaxReplace` | State Navigation; `{ url, selectors }`. |
| `AelluxJsUpdateBaseTitle` | State Navigation; `{ title }`. |

Dispatch a command on `document` like this:

```js
$ae.dispatch("PushState", {
  detail: { key: "section", value: "intro" }
});
```

See [State Navigation](../core-extensions/state-navigation.md) for validation rules and history behavior. Scrollbox publishes native `scroll` events rather than a separate `AelluxJsScroll` event.
