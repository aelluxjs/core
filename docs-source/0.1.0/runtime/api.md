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
await $ae.update(root);
await $ae.unmount(root);
```

`update(root)` discovers matching declarations, loads required Extensions, and requests idempotent `mount` operations. `unmount(root)` requests the corresponding cleanup operations. When `root` is omitted, the document is used.

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

Structured errors are available through `$ae.diagnostics`. See [Diagnostics](diagnostics.md) for numeric codes, default messages, contextual data, and reporting behavior.
