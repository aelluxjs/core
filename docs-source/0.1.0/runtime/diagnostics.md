# Diagnostics

The Aellux boot script exposes structured diagnostics through `Aellux.diagnostics` and `$ae.diagnostics`. This capability is available before the orchestrator starts, allowing boot, runtime, and Extension failures to use the same catalog.

Each catalog entry contains a numeric Aellux error code and its default message:

```js
$ae.diagnostics.ERROR_NOT_INITIALIZED;
// { code: 1001, message: "Aellux has not been initialized." }
```

Use `report()` to create a diagnostic error and emit it through `console.error`:

```js
const diagnostic = $ae.diagnostics.report(
  $ae.diagnostics.ERROR_EXTENSION_INITIALIZE,
  { extension: "example", cause: error }
);
```

Use `create()` when the caller must throw or otherwise handle the error without logging it immediately:

```js
throw $ae.diagnostics.create(
  $ae.diagnostics.ERROR_NOT_INITIALIZED,
  { operation: "update" }
);
```

Errors created by the helper use the name `AelluxDiagnosticError`, expose the numeric `code`, and preserve optional details in `context`.

## Code Ranges

- `1000-1099`: boot and Core usage errors.
- `1100-1199`: Extension lifecycle errors.
- `1200-1299`: Legacy runtime errors.

Applications should compare numeric codes or catalog entries instead of parsing console messages.

## Extension Compatibility

`ERROR_EXTENSION_INCOMPATIBLE` uses code `1106`. It is reported before requesting an Extension script when its declared `builds` do not provide an artifact compatible with the selected runtime. Its context contains the Extension name, selected runtime, and declared builds.
