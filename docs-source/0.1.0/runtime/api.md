# Runtime API

The browser distribution exposes `AelluxJs` and its short alias `$ae` on the global object.

Modules can import the shared API through `@aelluxjs/core`:

```js
import AelluxJs from "@aelluxjs/core";
```

This entry creates the core API when it is absent. The browser boot script starts the runtime through `init()`.

## Initialization

```js
$ae.init({ mode: "full" });
```

Supported runtime modes are `full` and `basic`. See [Getting Started](../getting-started.md) for their loading behavior.
Pass Extension-specific configuration through `extensions` in `init()` options. Keys such as `"tab-group"` are normalized to `tabGroup` in `$ae.options.extensions`, and each Extension receives its matching object in `init(options)`. An Extension with no matching configuration receives `{}`.

## DOM Lifecycle

```js
await $ae.mount(root);
await $ae.unmount(root);
```

`mount(root)` discovers matching declarations, loads required Extensions, and requests idempotent `mount` operations. `unmount(root)` requests the corresponding cleanup operations. When `root` is omitted, the document is used.

Extensions register element handlers with `$ae.mountManager.add({ extensionName, selector, mount, unmount, update, controllers })` during `init()` and call `$ae.mountManager.remove({ extensionName, selector })` during `destroy()`. Omitting `selector` removes all registrations for the Extension. `$ae.mountManager.mount(root, extensionNames)` and `$ae.mountManager.unmount(root, extensionNames)` use the same lifecycle execution as `$ae.mount()` and `$ae.unmount()`. `$ae.mountManager.update(root, extensionNames)` runs `update` handlers only for elements already mounted; registrations without an `update` handler are skipped.

After an element mounts, use `$ae(elementOrId).{extensionName}.{mountedExtensionMethod}(...args)` to call its public Extension methods. `AelluxJs(elementOrId)` works the same way. Both calls resolve through `mountManager.controller(elementOrId)`. `elementOrId` can be a DOM element, an ID, or an ID prefixed with `#`. Invalid values and IDs that do not resolve emit a warning and return `null`. An element without a mounted controller emits an error explaining that it may not be mounted, then returns `null`. Before runtime initialization, the shortcut returns `null`. The `controllers` names registered by an Extension become methods under its camelCase namespace. Each method receives the element as its first argument, followed by `...args`:

```js
$ae("#panel").present.pop();
$ae("#panel").present.toggle(false);
```

Unmounting removes the corresponding methods from the element controller.

Every mounted element controller offers `mount(extensionNames)`, `unmount(extensionNames)`, and `update(extensionNames)`. These methods use that element as the root, including matching descendants, and return promises. `mount` is idempotent; `update` tries every declared `update` callback for mounted elements and leaves mount registrations intact. A mounted Extension namespace also has an `update` property: `$ae(element).present.update` is `null` when no mounted `present` map declares an `update` callback; otherwise it is a function that updates that Extension's mounted elements under the root. After `unmount` removes every registration, a new controller is created on a later mount.

```js
await $ae("panel").update();
await $ae("panel").unmount();
await $ae.mount(document.getElementById("panel"));
```

## Destruction

```js
await $ae.destroyExtensions("preference");
await $ae.destroy();
```

`destroyExtensions()` unmounts and destroys selected initialized Extensions. Without names, it processes all loaded Extensions. `destroy()` first clears pending layout work, then destroys loaded Extensions.

## Extension Access

```js
$ae.ext("preference", {
  builds: ["modern", "legacy"],
  loadWhen: "[data-ae-preference]"
});
const preference = await $ae.wait("preference");
$ae.ext.preference === preference;
```

`ext()` registers loading information in `$ae.registry.ext` using camelCase keys. Its `builds` option declares `modern`, `legacy`, or both published artifacts; omission defaults to both. `wait()` loads and initializes the compatible Extension when necessary, then resolves to its public API or `null` after an isolated initialization or compatibility failure. Registered Extension APIs are available under `$ae.ext.<camelCaseName>`. `$ae.registry.dep` is available for dependency records. The lazy selector and mount indexes are `$ae.registry.lazyExtSelectors` and `$ae.registry.extMounters`.

`extName(filename)` extracts the Extension name from an `aellux.ext.<name>.js` filename.

Preference media queries are available in `$ae.registry.preferenceMediaQueries`.

## Events

```js
$ae.on("Ready", handler);
$ae.off("Ready", handler);
$ae.dispatch("Example", { detail: {} });
```

aellux.js event names use the `AelluxJs` prefix. `Ready` becomes `AelluxJsReady`. Readiness means the orchestrator is available; it does not guarantee that every Extension or element mounted successfully.

## Persistence

```js
$ae.persist.local.set("key", "value");
$ae.persist.local.get("key", "fallback");
$ae.persist.session.set("key", "value");
```

Persistence uses Web Storage when available and falls back to in-memory storage when it is not.

## Diagnostics

Structured errors, warnings, and informational messages are available through `$ae.diagnostics`. See [Diagnostics](diagnostics.md) for severity guidelines, verbosity, history, codes, and contextual data.
