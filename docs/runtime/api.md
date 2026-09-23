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

## Extension Access

```js
$ae.ext("adaptive", { loadStyle: true });
const adaptive = await $ae.wait("adaptive");
```

`ext()` registers loading information. `wait()` loads and initializes the Extension when necessary, then resolves to its public API or `null` after an isolated initialization failure.

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
