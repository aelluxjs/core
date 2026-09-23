# Modern and Legacy Runtimes

The Aellux boot script is responsible for capability detection and runtime selection.

## Modern Runtime

When the required syntax and browser APIs are available, the boot script loads either:

- `aellux.orchestrator.js` in `basic` mode; or
- `aellux.full.js` in `full` mode.

The orchestrator and Modern Extensions target ES2017+ syntax. They use Promises, async functions, observers, `fetch`, custom events, and other modern Web Platform APIs.

## Legacy Runtime

When required capabilities are unavailable, or the Modern runtime fails to load, the boot script requests `aellux.orchestrator.legacy.js`.

The Legacy path is part of the `0.1.0-beta` target but is not yet a complete runtime. The Legacy orchestrator and each core Extension currently have ES5-compatible placeholder files. Do not claim production Legacy compatibility until their implementations and integration tests are complete.

## Selection Rules

The boot script checks the capabilities required by the orchestrator before loading it. Missing capabilities are recorded in `Aellux.notAvailable`. A forced-Legacy development option is planned but not implemented yet.

See [ES5 support level](es5-support.md) and [Modern and Legacy Extension variants](../extensions/legacy-variants.md).
