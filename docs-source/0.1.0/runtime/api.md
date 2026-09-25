# Runtime API

The browser distribution exposes `Aellux` and its short alias `$ae` on the global object.

## Initialization

```js
$ae.init({ mode: "full" });
```

Supported runtime modes are `full` and `basic`. See [Getting Started](../getting-started.md) for their loading behavior.

## DOM Lifecycle

```js
await $ae.update(root);
await $ae.unmount(root);
```

`update(root)` discovers matching declarations, loads required Extensions, and requests idempotent `mount` operations. `unmount(root)` requests the corresponding cleanup operations. When `root` is omitted, the document is used.

## Destruction

```js
await $ae.destroyExtensions("adaptive");
await $ae.destroy();
```

`destroyExtensions()` unmounts and destroys selected initialized Extensions. Without labels, it processes all loaded Extensions. `destroy()` first clears pending layout work, then destroys loaded Extensions.

## Extension Access

```js
$ae.ext("adaptive", {
  builds: ["modern", "legacy"],
  loadStyle: true
});
const adaptive = await $ae.wait("adaptive");
```

`ext()` registers loading information. Its `builds` option declares `modern`, `legacy`, or both published artifacts; omission defaults to both. `wait()` loads and initializes the compatible Extension when necessary, then resolves to its public API or `null` after an isolated initialization or compatibility failure.

## Events

```js
$ae.on("Ready", handler);
$ae.off("Ready", handler);
$ae.dispatch("Example", { detail: {} });
```

Aellux event names use the `Aellux` prefix. `Ready` becomes `AelluxReady`. Readiness means the orchestrator is available; it does not guarantee that every Extension or element mounted successfully.

## Persistence

```js
$ae.persist.local.set("key", "value");
$ae.persist.local.get("key", "fallback");
$ae.persist.session.set("key", "value");
```

Persistence uses Web Storage when available and falls back to in-memory storage when it is not.

## Diagnostics

Structured errors are available through `$ae.diagnostics`. See [Diagnostics](diagnostics.md) for numeric codes, default messages, contextual data, and reporting behavior.
