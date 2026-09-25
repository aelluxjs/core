# Modern and Legacy Runtimes

The Aellux boot script is responsible for capability detection and runtime selection.

## Modern Runtime

When the required syntax and browser APIs are available, the boot script loads either:

- `aellux.orchestrator.js` in `basic` mode; or
- `aellux.full.js` in `full` mode.

The orchestrator and Modern Extensions target ES2017+ syntax. They use Promises, async functions, observers, `fetch`, custom events, and other modern Web Platform APIs.

## Legacy Runtime

When required capabilities are unavailable, or the Modern runtime fails to load, the boot script preserves the selected mode:

- `aellux.orchestrator.legacy.js` in `basic` mode; or
- `aellux.full.legacy.js` in `full` mode.

The build transpiles the Modern orchestrator and each core Extension into ES5-syntax Legacy variants. Both Legacy runtime files install the Core polyfills before starting the runtime. Individually loaded Extensions reuse that environment and therefore do not duplicate those polyfills in each generated file.

This provides the intended compatibility layer, but it is not an unrestricted guarantee for every historical ES5 browser. The supported browser matrix and integration tests must still be completed before production Legacy support can be claimed.

## Selection Rules

The boot script checks the capabilities required by the orchestrator before loading it. Missing capabilities are recorded in `Aellux.notAvailable`.

Force Legacy through initialization options or the development query parameter:

```js
$ae.init({ mode: "basic", forceLegacy: true });
```

```text
?aellux-debug-legacy=1
```

See [ES5 support level](es5-support.md) and [Modern and Legacy Extension variants](../extensions/legacy-variants.md).
