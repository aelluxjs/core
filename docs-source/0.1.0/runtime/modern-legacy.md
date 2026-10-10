# Modern and Legacy Runtimes

The aellux.js boot script is responsible for capability detection and runtime selection.

## Modern Runtime

When the required syntax and browser APIs are available, the boot script loads either:

- `aellux.orchestrator.js` in `basic` mode; or
- `aellux.full.js` in `full` mode.

The orchestrator and Modern Extensions target ES2017+ syntax. They use Promises, async functions, `fetch`, custom events, and other modern Web Platform APIs. See the [browser support baseline](browser-support.md) for preliminary minimum browser versions and the distinction between syntax support and effective runtime compatibility.

## Legacy Runtime

When required capabilities are unavailable, or the Modern runtime fails to load, the boot script preserves the selected mode:

- `aellux.orchestrator.legacy.js` in `basic` mode; or
- `aellux.full.legacy.js` in `full` mode.

The build transpiles the Modern orchestrator and each core Extension into ES5-syntax Legacy variants. Both Legacy runtime files install the Core polyfills before starting the runtime. Individually loaded Extensions reuse that environment and therefore do not duplicate those polyfills in each generated file.

For `0.1.0`, automated validation forces this profile in the same current Chromium, Firefox, and WebKit engines used by the Modern suite. It verifies boot selection, the Legacy orchestrator, shared polyfill setup, and compatible Extension variants. The release does not claim support for historical Chrome, Firefox, Safari, Edge Legacy, or Internet Explorer versions. A historical browser enters the support matrix only after a separate run on that exact browser and operating system.

## Selection Rules

The boot script checks the capabilities required by the orchestrator before loading it. Missing capabilities are recorded in `AelluxJs.diagnostics.notAvailable`.

Force Legacy through initialization options or the development query parameter:

```js
$ae.init({ mode: "basic", forceLegacy: true });
```

```text
?aellux-debug-legacy=1
```

See [Browser support](browser-support.md), [ES5 support level](es5-support.md), and [Modern and Legacy Extension variants](../extensions/legacy-variants.md).
