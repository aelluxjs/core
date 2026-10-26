# Runtime API

The browser distribution exposes `AelluxJs` and its short alias `$ae` on the global object.

Modules can import the shared API through `@aelluxjs/core`:

```js
import AelluxJs from "@aelluxjs/core";
```

This entry creates the core API when it is absent. The browser boot script starts the runtime through `init()`.

## Naming and element lookup

The naming helpers use the configured AelluxJs prefixes and convert camelCase names to kebab-case. For example, `$ae.attr("targetMessage")` returns `data-ae-target-message`, `$ae.className("feedbackError")` returns `ae--feedback-error`, and `$ae.cssVar("panelWidth")` returns `--ae-panel-width`. `extFilename(name)` returns the matching Extension script filename for the current minified setting; `extName(filename)` extracts an Extension name from that filename.

`$ae.elementOrId(value, options?)` resolves a DOM element or an element ID, with or without a leading `#`. By default, only element nodes are accepted. Pass `{ defaultElement: element }` to use a fallback when `value` is `null` or `undefined`, or `{ allowedNodeTypes: [...] }` to accept other node types. Invalid values and missing IDs record `WARN_INVALID_ELEMENT_OR_ID` (`2011`) and return `null`; `options.method` can identify the caller in that diagnostic. This helper is available before runtime initialization.

## Events

Use `eventName()` to resolve an event name, `on`/`off` or `onEvent`/`offEvent` to manage listeners, and `dispatch`/`dispatchFrom` to emit events. See [Events](events.md) for prefix and formatting rules, exact DOM names, targets, options, examples and the event reference.

## Initialization

```js
$ae.init({ mode: "full" });
```

Supported runtime modes are `full` and `basic`. Full registers the official Extensions automatically. Basic starts with no Extension registrations: declare each desired Extension through `$ae.ext(...)` or a link declaration before loading it. See [Getting Started](../getting-started.md) for their loading behavior.
The optional `crossOrigin` initialization setting controls the `crossorigin` attribute on runtime and Extension assets; integrity-protected assets use `anonymous` by default. See [CSP and Extension trust](../extensions/csp-and-trust.md#subresource-integrity).
The `autoViewportMeta` option defaults to `true`. During initialization, the boot checks for `<meta name="viewport">` and adds `<meta name="viewport" content="width=device-width, initial-scale=1">` when it is absent. Set `autoViewportMeta: false` to leave the document head unchanged.
The `skipGlobalMount` option defaults to `false`. Set it to `true` to finish orchestrator initialization and dispatch `Ready` without automatically mounting the document. Call `$ae.mount(document)` later to mount it explicitly.

The `cssMotionController` option defaults to `true`. Set it to `false` to leave CSS motion under native browser timing, without a `waitLayout` progress sequence. See [CSS Motion Controller](css-motion.md).
The boot does not set `data-ae-low-hardware`. Present does not use this marker to change animation easing.
`$ae.registerCssProperty(...descriptors)` accepts one or more descriptors in the same format as `CSS.registerProperty()`. When `inherits` is omitted, AelluxJs sets it to `true`; pass `inherits: false` only when the property must not reach descendants or pseudo-elements. It attempts every registration and returns `true` only when all succeed, or `false` when the API is unavailable, no descriptors are supplied, or any registration is rejected, including an already registered name. Extensions can call it during their `init()` without requiring Properties and Values API support for their basic behavior.
Pass Extension-specific configuration through `extensions` in `init()` options:

```js
$ae.init({
  extensions: {
    "tab-group": { initialTab: "overview" }
  }
});
```

Keys such as `"tab-group"` are normalized to `tabGroup` in `$ae.options.extensions`, and each Extension receives its matching object in `init(options)`. An Extension with no matching configuration receives `{}`.
An Extension's `init(options)` may return a Promise. The runtime awaits it before setting the Extension's `initialized` flag and resolving `wait(extensionName)`; rejection is diagnosed as `ERROR_EXTENSION_INITIALIZE` (`1102`) and leaves the Extension available for a later retry.

## Numeric easing

`$ae.ease(name, t)` evaluates a curve at numeric progress `t` in both `basic` and `full` modes. The boot API exposes the method, but calling it before the orchestrator loads throws `ERROR_NOT_INITIALIZED` (`1001`). It does not require the Present Extension.

The method clamps `t` to `0`–`1` before evaluating the curve. Its result is not clamped, so `back` and `elastic` curves can overshoot. It returns a number for scripted UI motion and does not change Present's CSS timing functions.

```js
const scale = $ae.ease("backOut", progress);
element.style.transform = `scale(${scale})`;
```

The families `quad`, `cubic`, `quart`, `quint`, `sine`, `expo`, `circ`, `back`, `elastic`, and `bounce` each have `In`, `Out`, and `InOut` variants. `linear`, `smoothStep`, and `smootherStep` are also available. Names ignore case, spaces, underscores, and hyphens. An optional `ease` prefix and direction-first names are accepted: `backOut`, `easeBackOut`, `back-out`, `ease-back-out`, and `easeOutBack` evaluate the same curve. Long family names such as `quadratic`, `quartic`, `quintic`, `sinusoidal`, `exponential`, and `circular` are aliases. Invalid names or nonfinite `t` values throw.

CSS `cubic-bezier(x1, y1, x2, y2)` strings are also accepted, for example `$ae.ease("cubic-bezier(0.25, 0.1, 0.25, 1)", 0.5)`, which returns approximately `0.802403`. The evaluator solves the curve's X coordinate for `t` before returning Y. Both X control coordinates must be in `0..1`; Y may lie outside that range for overshoot. Decimal and exponent notation are supported. Input progress remains clamped to `0..1`, as with named curves; malformed strings and invalid control points throw.

## DOM Lifecycle

```js
await $ae.mount(elementOrId);
await $ae.unmount(elementOrId);
```

`mount(elementOrId)` resolves one root from a DOM element or an existing element ID, with or without a leading `#`. It discovers matching declarations below that root, loads required Extensions, and requests idempotent `mount` operations. It resolves to an array of DOM elements mounted during that call, with each element listed once across the matching mount maps; it returns `[]` when nothing is newly mounted or the root cannot be resolved. A failed element mount is diagnosed and its registration is rolled back; later matching elements continue mounting. The returned array contains only the successful mounts. `unmount(elementOrId)` requests the corresponding cleanup operations and returns `false` when the root cannot be resolved. When the argument is omitted, the document is used. When `MutationObserver` is available, the mount manager automatically unmounts mounted elements removed from the document; moving an element elsewhere in the document keeps it mounted. Without that API, call `unmount(document)` or `destroyExtensions()` to clean detached elements. Unmounting the document also cleans previously mounted elements that have been detached; unmounting a specific element stays within that element's subtree.

Before each mount or unmount pass, the runtime emits cancelable `BeforeMount` or `BeforeUnmount` on `document`. Their `detail` identifies the resolved `root` and normalized `extensions`. Calling `preventDefault()` synchronously cancels the pass before any callbacks or state changes, suppresses `Mount`/`Unmount`, and resolves to `[]` for mount or `false` for unmount. The same hooks apply to element controller methods and automatic detached cleanup. A canceled unmount also prevents `destroyExtensions()` or `destroy()` from destroying the affected resources. See [Events](events.md#runtime-lifecycle) for payloads, startup behavior and examples.

Extensions register element handlers during `init()` and remove their registration during `destroy()`:

```js
$ae.mountManager.add({
  extensionName: "example",
  selector: "[data-ae-example]",
  priority: 0,
  mount(element) { /* attach behavior */ },
  unmount(element) { /* release behavior */ },
  update(element) { /* refresh behavior */ }
});

$ae.mountManager.remove({ extensionName: "example" });
```

Omitting `selector` removes all registrations for the Extension. The manager's `mount(elementOrId, extensionNames)` and `unmount(elementOrId, extensionNames)` use the same single-root resolution and lifecycle execution as `$ae.mount()` and `$ae.unmount()`. Its `update(elementOrId, extensionNames)` runs `update` handlers only for elements already mounted; registrations without an `update` handler are skipped.

`add()` requires a previously declared Extension name, valid CSS selector, and `mount` function. `unmount` and `update` are optional functions; `controllers` is an optional array of nonempty method names. `priority` is an optional finite number, defaulting to `0`. Mount registrations run in ascending priority order across Extensions and selectors; registrations with equal priority keep their previous discovery order. Unmount runs in descending priority order, reversing the actual mount order for equal priorities. Invalid registration arguments and attempts to replace an existing `extensionName` and `selector` pair report `ERROR_MOUNT_REGISTRATION` (`1113`), return `false`, and leave the mount map unchanged. `remove()` returns `false` and reports `ERROR_MOUNT_MAP_IN_USE` (`1115`) if any matching element is still mounted or mounting; unmount those elements before removing the map.

The mount helper removes existing `ae--*` classes from an element before its first mount, leaving other classes intact. Extensions that change attributes or inline styles should save the specific values they own with `$ae.persist.element.save()` during mount and restore them during unmount. The mount manager does not restore attributes automatically. Library classes are managed by their Extensions rather than restored from the initial HTML.

After an element mounts, use `$ae(elementOrId).{extensionName}.{mountedExtensionMethod}(...args)` to call its public Extension methods. `AelluxJs(elementOrId)` works the same way. Both calls resolve through `mountManager.controller(elementOrId)`. `elementOrId` can be a DOM element, an ID, or an ID prefixed with `#`. Invalid values and IDs that do not resolve emit a warning and return `null`. An element without a mounted controller emits an error explaining that it may not be mounted, then returns `null`. Before runtime initialization, the shortcut returns `null`. The `controllers` names registered by an Extension become methods under its camelCase namespace. Each method receives the element as its first argument, followed by `...args`:

```js
await $ae("#panel").present.pop();
await $ae("#panel").present.toggle(false);
```

Unmounting removes the corresponding methods from the element controller.

Every mounted element controller offers `mount(extensionNames)`, `unmount(extensionNames)`, and `update(extensionNames)`. These methods use that element as the root, including matching descendants, and return promises. `mount` is idempotent; `update` tries every declared `update` callback for mounted elements and leaves mount registrations intact. A mounted Extension namespace also has an `update` property: `$ae(element).present.update` is `null` when no mounted `present` map declares an `update` callback; otherwise it is a function that updates that Extension's mounted elements under the root. After `unmount` removes every registration, a new controller is created on a later mount.

The controller also offers `on(event, handler, options)`, `off(event, handler, options)`, and `dispatch(event, options)`. These use the same event names and options as the main API, but `on` and `off` register on the mounted element, and `dispatch` calls `dispatchFrom` with that element as the target:

```js
const panel = $ae("panel");
const onLayout = event => console.log(event.target);
panel.on("Layout", onLayout);
panel.dispatch("Layout", { bubbles: true });
panel.off("Layout", onLayout);
```

```js
await $ae("panel").update();
await $ae("panel").unmount();
await $ae.mount(document.getElementById("panel"));
```

## Layout Scheduling

`$ae.waitLayout.read(callback)` batches geometry and computed-style reads; `$ae.waitLayout.update(callback)` applies dependent DOM and CSS changes after those reads. Both return Promises. Queue the update after the read when it needs the measured value:

```js
const width = await $ae.waitLayout.read(() => panel.getBoundingClientRect().width);
await $ae.waitLayout.update(() => panel.style.setProperty("--panel-width", `${width}px`));
```

Use numeric IDs to group and replace pending reads and updates, or `sequence(id, ...stages)` for ordered and repeated cycles with `maxFPS` and `abort` (a boolean callback, `AbortSignal`, or `AbortController`). `cancel(id)` stops one feature's work; `clear()` cancels all work during full runtime destruction. The scheduler adapts its task rate to sustained frame pressure. See [waitLayout](wait-layout.md) for frame order, lifecycle guards, and examples.

Present's mounted group controller exposes `show(key): Promise<boolean>` and `selected(): Element | null`; the extension-level equivalents take the group element first. `show()` resolves `false` for refused, invalidated, superseded or unmounted selections. `selected()` reports accepted logical state without waiting for visual completion. See [Present](../core-extensions/present.md#programmatic-selection-and-lifecycle) for declarative precedence and event timing; [Anchor](../core-extensions/anchor.md#present-group-anchor) consumes that selection through the optional public interface.

## Destruction

```js
await $ae.destroyExtensions("preference");
await $ae.destroy();
```

`destroyExtensions()` unmounts and destroys selected Extensions. Without names, it processes every registered Extension, including lazy registrations that never initialized or whose last attempt failed. Cleanup removes registry entries, mount maps, and script or stylesheet assets marked for that Extension even when its `destroy()` callback fails. `destroy()` first clears pending layout work, then destroys registered Extensions and calls `$ae.mountManager.destroy()`.

`$ae.mountManager.destroy()` disconnects the optional removal observer owned by the manager. It returns `true` when an active observer is disconnected and `false` when no observer is active, including later calls. It does not unmount elements or destroy Extensions by itself; use `$ae.destroy()` for complete Core cleanup.

## Extension Access

```js
$ae.ext("preference", {
  builds: ["modern", "legacy"],
  loadWhen: "[data-ae-preference]"
});
const preference = await $ae.wait("preference");
$ae.ext.preference === preference;
```

`ext()` registers loading information in `$ae.registry.ext` using camelCase keys. Its `builds` option declares `modern`, `legacy`, or both published artifacts; omission defaults to both. `wait()` loads and initializes the compatible Extension when necessary, then resolves to its public API or `null` after an isolated initialization or compatibility failure. Registered Extension APIs are available under `$ae.ext.<camelCaseName>`.

Load a shared script dependency and await its `load` event before using it:

```js
await $ae.dep("shared-widget", "/vendor/shared-widget.min.js");
```

Pass `integrity` and `crossOrigin` as the third and fourth arguments when the dependency needs SRI and CORS attributes. Omitting `crossOrigin` when SRI is supplied uses `anonymous`; the options-object form also works. Calls with the same label and URL share one load, recorded in `$ae.registry.dep[label]`. The lazy selector and mount indexes are `$ae.registry.lazyExtSelectors` and `$ae.registry.extMounters`.

`extName(filename)` extracts the Extension name from an `aellux.ext.<name>.js` filename.

Preference media queries are available in `$ae.registry.preferenceMediaQueries`.
`$ae.currentPreference(name)` reads the resolved preference attribute from `<html>` and returns its string value or `null` when absent. It accepts kebab-case and camelCase names, for example `$ae.currentPreference("reduced-motion")` and `$ae.currentPreference("reducedMotion")`. It is available before `init()` and reflects the latest device and local preference after the boot or Preference Extension updates the root attributes. Use it instead of reading the HTML attribute directly in application JavaScript.

`$ae.updatePreferenceAttributesHTML(preferences?)` recomputes the root preference attributes from a supplied preference object, or from persisted preferences when omitted. The boot and Preference Extension call it as part of normal preference updates. `$ae.request(url, options?)` is available after runtime initialization; it calls `fetch` with default `GET` and `credentials: "same-origin"`, resolves to a successful `Response`, and rejects unsuccessful HTTP responses with an `AelluxJsRequestError` containing `status`, `statusText`, and `response`.

## Persistence

```js
$ae.persist.local.set("key", "value");
$ae.persist.local.get("key", "fallback");
$ae.persist.session.set("key", "value");
```

Persistence uses Web Storage when available and falls back to in-memory storage when it is not.

For an Extension that changes an element during `mount()`, use `$ae.persist.element.save(element, attributes, cssProperties)` to capture only the attributes and inline CSS properties it owns. Each list is an array of names; CSS names use CSS syntax such as `max-height` or `--custom-property`. The returned object exposes `attributes` and `cssProperties` maps. Each entry records `present` and `value`; CSS entries also record `priority` (for `!important`). Call `restore()` during `unmount()` and discard the object afterward. Restoration returns `true` when the element is available and restores absent entries by removing them. It also works for a detached element that still exists.

```js
const memories = new WeakMap();

function mount(element) {
  memories.set(element, $ae.persist.element.save(
    element, ["aria-expanded", "hidden"], ["max-height", "--panel-progress"]
  ));
  // Change the saved attributes and inline styles here.
}

function unmount(element) {
  const memory = memories.get(element);
  if (memory) memory.restore();
  memories.delete(element);
}
```

Snapshots are independent, so each Extension can save its own list.

## ARIA ownership

After the runtime loads, `AelluxJs.aria.register(element, { priority })` returns a handler for one element. `priority` defaults to `0` and is independent of mount registration priority. Use `set()` during mount or update, `unset(name)` to withdraw one value, and `release()` during unmount. The helper saves each attribute's original presence and value when it first receives a claim, and restores them when the last claim ends.

```js
const aria = AelluxJs.aria.register(element, { priority: 10 });
aria.set({ expanded: true, controls: ["panel-id"], label: "Open panel" });
aria.unset("label");
aria.release();
```

Names can be short (`expanded`) or full (`aria-expanded`). A later registered handler wins a priority tie, even if an earlier handler updates afterward. For `aria-hidden`, `true` wins whenever any active handler requests it. Other attributes use the highest-priority handler. ID arrays are serialized as space-separated values; `aria-controls` uses the same priority rule rather than combining handlers' target lists. A handler's `initial(name)` reads the original attribute value, or `null` if it was absent. `set()` updates only the names provided, so use `unset()` or `release()` to withdraw claims. The HTML `hidden` attribute is separate and remains under the Extension's control.

## Diagnostics

Structured errors, warnings, and informational messages are available through `$ae.diagnostics`. See [Diagnostics](diagnostics.md) for severity guidelines, verbosity, history, codes, and contextual data.
