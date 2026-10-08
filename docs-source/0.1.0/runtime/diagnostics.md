# Diagnostics

The aellux.js boot script exposes structured diagnostics through `AelluxJs.diagnostics` and `$ae.diagnostics`. This capability is available before the orchestrator starts, allowing boot, runtime, and Extension failures to use the same catalog.

Runtime status is also available there: `diagnostics.legacy` identifies the selected Legacy runtime, `diagnostics.supported` indicates that the Modern runtime started successfully, and `diagnostics.notAvailable` lists missing Modern browser capabilities.

Each catalog entry contains a numeric aellux.js diagnostic code and its default message:

```js
$ae.diagnostics.ERROR_NOT_INITIALIZED;
// { code: 1001, message: "aellux.js has not been initialized." }
```

## Choosing a severity

Choose the method from the outcome of the event, not from the current `verboseLevel`:

| Method | Use when | Example |
| --- | --- | --- |
| `error()` | An operation failed or could not complete as intended. | An Extension failed to initialize. |
| `warn()` | The system can continue, but a limitation or unexpected condition needs attention. | A browser capability is missing and the Legacy runtime will be used. |
| `info()` | An expected state change is useful to observe. | The Legacy runtime is starting. |

All three methods accept a catalog definition and an optional context object, return an `AelluxJsDiagnosticError`, and record the event in the diagnostic history. `error()` writes to `console.error`, `warn()` to `console.warn`, and `info()` to `console.info` when their level is visible.

For example:

```js
const diagnostic = $ae.diagnostics.error(
  $ae.diagnostics.ERROR_EXTENSION_INITIALIZE,
  { extension: "example", cause: error }
);

$ae.diagnostics.warn(
  $ae.diagnostics.WARN_BROWSER_CAPABILITIES,
  { notAvailable: ["CustomEvent"] }
);

$ae.diagnostics.info($ae.diagnostics.INFO_LEGACY_FALLBACK);
```

Use `create()` when the caller must throw or otherwise handle the error without logging or recording it immediately:

```js
throw $ae.diagnostics.create(
  $ae.diagnostics.ERROR_NOT_INITIALIZED,
  { operation: "update" }
);
```

Errors created by the helper use the name `AelluxJsDiagnosticError`, expose the numeric `code`, and preserve optional details in `context`.

## Verbosity and history

Set `verboseLevel` in `init()` to control console output. The default is `"error"` (or `0`). You can pass a name or its integer value:

| `verboseLevel` | Console output |
| --- | --- |
| `"error"` or `0` | Errors only. |
| `"warn"` or `1` | Errors and warnings. |
| `"info"` or `2` | Errors, warnings, and informational messages. |

```js
$ae.init({ verboseLevel: "warn" });
```

`error()`, `warn()`, and `info()` are always recorded, even when the selected level hides them from the console. Call `$ae.diagnostics.showHistory(10)` to print the last 10 entries with timestamps; omit the argument to print all entries. The method also returns the selected entries, including their timestamp, level, code, message, and context. Passing `0` prints and returns no entries. Replaying history does not record new diagnostics.

## Code Ranges

- `1000-1099`: boot and Core usage errors.
- `1100-1199`: Extension lifecycle errors.
- `1200-1299`: runtime errors.
- `2000-2099`: warnings.
- `3000-3099`: informational messages.

Applications should compare numeric codes or catalog entries instead of parsing console messages.

## Extension Compatibility

`ERROR_EXTENSION_INCOMPATIBLE` uses code `1106`. It is reported before requesting an Extension script when its declared `builds` do not provide an artifact compatible with the selected runtime. Its context contains the Extension name, selected runtime, and declared builds.

## Mounting and Extension Assets

An invalid root selector passed to `mount()` or `unmount()` records `ERROR_MOUNT_ROOT_SELECTOR` (`1005`) with the selector, operation, and cause. An Extension whose `init()` rejects records `ERROR_EXTENSION_INITIALIZE` (`1102`); the Extension remains uninitialized. A stylesheet load failure records `WARN_EXTENSION_STYLE_LOAD` (`2004`) with the Extension name and URL. The Extension can still initialize after that warning.

Waiting for an unregistered Extension records `ERROR_EXTENSION_NOT_REGISTERED` (`1110`) and rejects with that diagnostic. A mounted controller name without a matching public Extension method records `WARN_CONTROLLER_METHOD_MISSING` (`2005`). If browser storage is unavailable, `WARN_STORAGE_FALLBACK` (`2006`) identifies the storage area and key prefix; values are then held in memory for the current page only.

State navigation records `WARN_NAVIGATION_AJAX_HREF_UNAVAILABLE` (`2007`) when a history entry requires `ajax-href` restoration but that Extension is unavailable. Feedback subscriber exceptions and rejected promises record `ERROR_CALLBACK` (`1108`); other subscribers continue to receive the feedback.
