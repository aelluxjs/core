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

`environment: "development"` selects `"info"` when `verboseLevel` is omitted. `environment: "production"` is the default and keeps error-only output. An explicit `verboseLevel` always wins in either environment; environment selection is not inferred from the hostname.

```js
$ae.init({ environment: "development" });
$ae.init({ environment: "production", verboseLevel: "warn" });
```

`error()`, `warn()`, and `info()` are recorded even when the selected level hides them from the console. The history retains the 100 most recent entries; older entries and their context references are released as new diagnostics arrive. Call `$ae.diagnostics.showHistory(10)` to print the last 10 retained entries with timestamps; omit the argument to print all retained entries. The method also returns the selected entries, including their timestamp, level, code, message, and context. Passing `0` prints and returns no entries. Replaying history does not record new diagnostics.

Equivalent diagnostics are deduplicated while their original entry remains in this circular history. Identity includes the code plus the relevant context (including element identity), so separate elements are not collapsed. Once an entry ages out, the same condition can be reported again.

## Development configuration checks

With `environment: "development"`, mounting validates declarations after lazy Extensions have loaded and all mount registrations have completed. `mountManager.update()` repeats those checks after updates. Scoped mounts and updates validate only the requested Extensions. The checks use the existing diagnostic history and do not install additional observers. Production skips these DOM scans, independently of `verboseLevel`.

Configuration diagnostics explain what happened, identify the element/attribute/value, and suggest a correction in `context`:

```js
{
  code: 2027,
  context: {
    extension: "present",
    element: controlElement,
    attribute: "data-ae-target",
    value: "menu",
    reason: "Target element was not found.",
    suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
  }
}
```

| Code | Meaning |
| --- | --- |
| `2024` | Likely misspelled Aellux attribute, with a suggested spelling. |
| `2025` | Declared behavior requires an Extension that is not initialized. |
| `2026` | Invalid attribute, numeric parameter, pivot or CSS step count. |
| `2027` | Missing/incompatible target, unmeasurable explicitly updated Anchor target, or invalid/missing AJAX selector. |
| `2028` | Snap without Scrollbox, an orphan Snap item, or a misplaced Elastic wrapper. |
| `2029` | Present trigger/dismiss control is not reachable with the keyboard. |
| `2030` | Effective CSS blocks requested layout/scrolling, or a motion duration is invalid. |

Attribute spelling checks follow the configured prefix and accept attributes used by registered custom Extension selectors. They suggest only names within one edit of a known name, including adjacent transpositions; arbitrary application attributes are not rejected. This is a typo check, not an exhaustive HTML schema.

Present Group reuses `2021` for missing member IDs, groups without identifiable members, and invalid conditions. Selection failures include the active attribute and a corrective suggestion. Anchor keeps `1119`, `2022`, and `2023` for incompatible positioning references, dimension matching, and group associations.

Hidden Present targets and a group-driven Anchor with no selected member are normal states and remain quiet. An explicit Anchor update can report an unmeasurable ordinary target; ordinary observer updates do not run the semantic scan. The validator does not guess whether custom CSS, a transient hidden state, or a focusable custom control with application keyboard handlers is incorrect. CSS warnings require an invalid value or evidence of blocked behavior, such as overflowing Pointer Scrollbox content with disabled overflow, a size-motion Present container without effective grid display, or a hidden container made visible by CSS. Check stylesheet requests, CSP and overriding rules when such a warning appears; reduced motion and custom styling alone are not errors.

Runtime target failures in Present, AJAX selector failures, and Adaptive option validation also use contextual diagnostics in production. Invalid Adaptive numeric values retain defaults, reversed ratio/experience boundaries restore their default pair, and out-of-order named minimum sizes are reported while preserving those thresholds. AJAX validates selectors before starting a request; when no current region matches it returns `null`, and missing response regions preserve current content. Commas within selector functions or quoted attribute values remain part of that selector.

### Distribution cost

The validator is bundled with the runtime; its production guard avoids DOM scans, but its code still contributes to downloads. The diagnostic catalog and richer contexts also add bytes to Boot/ESM and Extension artifacts. Measurements below use minified output and gzip level 9. Limits are in KiB, written as raw/gzip; measured sizes are bytes. These are maintenance limits, not performance guarantees.

| Artifact | Measured raw / gzip bytes | Previous limits | Current limits |
| --- | --- | --- | --- |
| `aellux.min.js` | 46,986 / 14,998 | 45 / 15 | 46 / 15 |
| `aellux.esm.min.js` | 24,801 / 8,451 | 24 / 8 | 25 / 8.5 |
| `aellux.orchestrator.min.js` | 57,264 / 19,136 | 43 / 15 | 56.5 / 19 |
| `aellux.orchestrator.legacy.min.js` | 324,497 / 103,748 | 300 / 97 | 318 / 102 |
| `aellux.full.min.js` | 127,592 / 41,020 | 130 / 40 | 130 / 40.5 |
| `aellux.ext.adaptive.min.js` | 4,915 / 2,291 | 4 / 3 | 5 / 3 |
| `aellux.ext.adaptive.legacy.min.js` | 8,329 / 3,513 | 6 / 3 | 8.5 / 3.5 |
| `aellux.ext.present.min.js` | 18,342 / 6,549 | 18 / 6.25 | 18.5 / 6.5 |
| `aellux.ext.present.legacy.min.js` | 25,755 / 9,108 | 25 / 9 | 26 / 9 |
| `aellux.ext.scrollbox-snap.min.js` | 10,388 / 4,020 | 10 / 4 | 10.5 / 4 |

Cancelable mount/unmount preflight and cancellation-aware teardown raise the Modern Orchestrator raw limit from 56 to 56.5 KiB and Full Legacy from 425 to 426 KiB. With the CSS Motion cadence correction and lightweight Present progress classification, Full Legacy measures 435,136 / 130,268 bytes, with its gzip limit retained at 138 KiB. Other limits are unchanged. `npm run test:budget` checks every minified distribution artifact.

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

An invalid element, invalid ID, or missing ID passed to `mount()`, `unmount()`, `update()`, or controller lookup records `WARN_INVALID_ELEMENT_OR_ID` (`2011`) with the received value and operation. IDs can be passed with or without a leading `#`. An Extension whose `init()` rejects records `ERROR_EXTENSION_INITIALIZE` (`1102`); the Extension remains uninitialized. A stylesheet load failure records `WARN_EXTENSION_STYLE_LOAD` (`2004`) with the Extension name and URL. The Extension can still initialize after that warning.

If mounting a root fails while registering assets, waiting for Extensions, or discovering mountable elements, `ERROR_MOUNT` (`1006`) records the cause, root, and selected Extension names. Waiting elements have `aria-busy` reset to `false` after the attempt.

Waiting for an unregistered Extension records `ERROR_EXTENSION_NOT_REGISTERED` (`1110`) and rejects with that diagnostic. A mounted controller name without a matching public Extension method records `WARN_CONTROLLER_METHOD_MISSING` (`2005`). If browser storage is unavailable, `WARN_STORAGE_FALLBACK` (`2006`) identifies the storage area and key prefix; values are then held in memory for the current page only.

`ext()` records `ERROR_EXTENSION_LOAD_WHEN` (`1114`) when a supplied `loadWhen` selector is invalid and does not register the Extension. `extAttach()` records `ERROR_EXTENSION_ATTACH` (`1112`) when its name, API object, lifecycle methods, or a changed declared `loadWhen` selector is invalid. Its context identifies the rejected argument, and the API is not attached. It records `ERROR_EXTENSION_NOT_REGISTERED` (`1110`) when no preceding `ext()` declaration exists and `ERROR_EXTENSION_DUPLICATE` (`1101`) for a second attachment.

`dep()` rejects and records `ERROR_DEPENDENCY_ARGUMENT` (`1116`) for an empty label or URL, `ERROR_DEPENDENCY_CONFLICT` (`1117`) when a label already names a different URL, and `ERROR_DEPENDENCY_LOAD` (`1118`) when the script fails to load. A load failure clears that label so the dependency can be retried.

Present records `INFO_PRESENT_MEASURED_LAYOUT` (`3001`) when a `height` or `width` transition has no direct `data-ae-present-motion` child. The container remains unchanged structurally; size transitions use measured pixel maximums instead of the grid strategy.

Present's expected replacement, restart and unmount cancellations do not record interruption warnings. An unexpected interruption diagnostic still records `WARN_INTERRUPTION` (`2002`); transition failures retain `ERROR_EXTENSION_TRANSITION` (`1109`). This distinction does not change centralized diagnostic deduplication.

`mountManager.add()` records `ERROR_MOUNT_REGISTRATION` (`1113`) when a registration argument or CSS selector is invalid, or when the same Extension and selector are already registered. Its context identifies the rejected argument; no mount registration is added or replaced. `mountManager.remove()` records `ERROR_MOUNT_MAP_IN_USE` (`1115`) and leaves the map registered when a matching element is still mounted or mounting.

State navigation records `WARN_NAVIGATION_EVENT_INVALID` (`2009`) when `PushAjaxReplace` or `UpdateBaseTitle` receives malformed event details. Exceptions while handling those events record `ERROR_CALLBACK` (`1108`). Feedback subscriber exceptions and rejected promises also record `ERROR_CALLBACK`; other subscribers continue to receive the feedback.

Feedback records `ERROR_FEEDBACK_ARGUMENT` (`1122`) and skips dispatch when `message`, `type`, `motion`, or `target` is invalid. A valid but nonstandard motion records `INFO_FEEDBACK_MOTION_CUSTOM` (`3002`); the caller must provide its animation rule.
