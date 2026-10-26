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
| `warn()` | <span style="white-space: normal !important;">The system can continue, but a limitation or unexpected condition needs attention.</span> | <span style="white-space: normal !important;">A browser capability is missing and the Legacy runtime will be used.</span> |
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
| `2020` | <span style="white-space: normal !important;">An effective CSS transform is applied directly to a Snap item. Apply visual transforms to its children instead.</span> |
| `2024` | <span style="white-space: normal !important;">Likely misspelled Aellux attribute, with a suggested spelling.</span> |
| `2025` | <span style="white-space: normal !important;">Declared behavior requires an Extension that is not initialized.</span> |
| `2026` | Invalid attribute, numeric parameter, or pivot. |
| `2027` | <span style="white-space: normal !important;">Missing/incompatible target, unmeasurable explicitly updated Anchor target, or invalid/missing AJAX selector.</span> |
| `2028` | <span style="white-space: normal !important;">Snap without Scrollbox, an orphan Snap item, a misplaced Elastic wrapper, or PWA without a manifest link/nonempty `href`.</span> |
| `2029` | <span style="white-space: normal !important;">Present trigger/dismiss control is not reachable with the keyboard.</span> |
| `2030` | <span style="white-space: normal !important;">Effective CSS blocks requested layout/scrolling, or a motion duration is invalid.</span> |
| `2031` | <span style="white-space: normal !important;">Present and Anchor both request transform on one element. Anchor takes priority; remove the Present transform token or animate a child.</span> |
| `2032` | <span style="white-space: normal !important;">Duplicate HTML attributes on one start tag; the browser keeps the first value and discards subsequent values. Includes `class`, `style`, native and custom attributes.</span> |
| `2033` | <span style="white-space: normal !important;">Behaviors replace the same CSS resource on one element. The context identifies the `property` and its `writers`.</span> |

`WARN_RESOURCE_CONFLICT` (`2033`) checks persistent transform writers without a separate ownership registry. Development mounts and explicit updates diagnose Present transform on a valid Elastic wrapper. When CSS Motion captures an actual replacing transform effect, it compares that effect with Anchor, Elastic and Present on the effect's target. Feedback passes its resolved `data-ae-target-transform` destination, so animating a child remains valid. This works with controlled and native CSS Motion when Web Animations exposes keyframes. Opacity-only effects, additive composition, pseudo-elements and separate targets are excluded. Reduced motion with no active effect emits no motion conflict. Browsers without inspectable effects skip this runtime check; production skips all resource checks.

The checks report incompatible composition and preserve the requested animation. Move visual animation onto a child to keep positioning and elastic transforms independent. They do not automatically merge transforms, inspect arbitrary application animations outside CSS Motion, or infer a conflict merely from two Extension declarations.

`WARN_ATTRIBUTE_DUPLICATE` (`2032`) inspects original HTML text in development, since duplicate attributes no longer exist in the parsed DOM. After the first unscoped document mount, Core makes one asynchronous GET for the initial document URL with `cache: "force-cache"`, preferring the HTTP cache. This inspection does not delay mounting or `Ready`; unavailable source is skipped without failing the mount. Scoped mounts and explicit updates do not request source. AJAX Href inspects each response text before parsing, using the existing response without an additional request. Production skips both checks, even with warning verbosity enabled.

Duplicate warnings identify `source`, `tagName`, `attribute`, the first raw `value`, all raw `values`, and the one-based `line`/`column` of the first repeated attribute, plus a zero-based character `offset`. These locations refer to the inspected response, so no live `element` is inferred. Repeated `class` attributes should become one space-separated class list; repeated `style` attributes should become one list of intended CSS declarations. Attribute names are compared without ASCII case distinctions. Comments, quoted attribute contents and HTML text elements such as script/style/textarea are skipped. Repeated class tokens and repeated CSS declarations inside one attribute are outside this check.

This is a source start-tag check, not a complete HTML conformance validator. It covers the fetched initial HTML and AJAX responses, including template contents; it cannot recover duplicates discarded earlier by application calls such as `innerHTML`. The initial GET can differ from the navigation response on dynamic pages and remains subject to browser cache and network policies.

Attribute spelling checks follow the configured prefix and accept attributes used by registered custom Extension selectors. They suggest only names within one edit of a known name, including adjacent transpositions; arbitrary application attributes are not rejected. This is a typo check, not an exhaustive HTML schema.

Present Group reuses `2021` for missing member IDs, groups without identifiable members, and invalid conditions. Selection failures include the active attribute and a corrective suggestion. Anchor keeps `1119`, `2022`, and `2023` for incompatible positioning references, dimension matching, and group associations.

Hidden Present targets and a group-driven Anchor with no selected member are normal states and remain quiet. An explicit Anchor update can report an unmeasurable ordinary target; ordinary observer updates do not run the semantic scan. The validator does not guess whether custom CSS, a transient hidden state, or a focusable custom control with application keyboard handlers is incorrect. CSS warnings require an invalid value or evidence of blocked behavior, such as overflowing Pointer Scrollbox content with disabled overflow, a size-motion Present container without effective grid display, or a hidden container made visible by CSS. Check stylesheet requests, CSP and overriding rules when such a warning appears; reduced motion and custom styling alone are not errors.

Runtime target failures in Present, AJAX selector failures, and Adaptive option validation also use contextual diagnostics in production. Invalid Adaptive numeric values retain defaults, reversed ratio/experience boundaries restore their default pair, and out-of-order named minimum sizes are reported while preserving those thresholds. AJAX validates selectors before starting a request; when no current region matches it returns `null`, and missing response regions preserve current content. Commas within selector functions or quoted attribute values remain part of that selector.

The optional [PWA Extension](../core-extensions/optional/pwa.md#application-manifest-purpose-declaration-and-checks) checks the native manifest declaration during its own initialization and installation requests in development. Missing `link[rel~="manifest"]` or a missing/blank `href` uses `WARN_CONFIGURATION_STRUCTURE` (`2028`) with `extension: "pwa"` and an actionable suggestion. Add `<link rel="manifest" href="./manifest.webmanifest">` in the document head and supply the file; see [why installation needs manifest metadata](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable#installability) and the [manifest property reference](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference). A worker registration does not replace the manifest. This check stays inside the lazy PWA script, does not run on pages without PWA, and adds no production diagnostic scan or manifest download. A declared link is not proof that its file exists, parses correctly or meets browser eligibility requirements; the warning does not block installation or offline APIs. The [minimal worker example](../core-extensions/optional/pwa.md#minimal-swjs-with-importscripts) explains a same-origin `sw.js` importing the independent worker implementation.

### Distribution cost

The validator is bundled with the runtime; its production guard avoids DOM scans, but its code still contributes to downloads. The diagnostic catalog and richer contexts also add bytes to Boot/ESM and Extension artifacts. Measurements below use minified output and gzip level 9. Limits are in KiB, written as raw/gzip; measured sizes are bytes. These are maintenance limits, not performance guarantees.

| Artifact | Measured raw / gzip bytes | Previous limits | Current limits |
| --- | --- | --- | --- |
| `aellux.min.js` | 47,091 / 15,026 | 45 / 15 | 46 / 15 |
| `aellux.esm.min.js` | 24,906 / 8,476 | 24 / 8 | 25 / 8.5 |
| `aellux.orchestrator.min.js` | 57,553 / 19,224 | 43 / 15 | 56.5 / 19 |
| `aellux.orchestrator.legacy.min.js` | 324,802 / 103,843 | 300 / 97 | 318 / 102 |
| `aellux.full.min.js` | 127,881 / 41,113 | 130 / 40 | 130 / 40.5 |
| `aellux.ext.adaptive.min.js` | 4,915 / 2,291 | 4 / 3 | 5 / 3 |
| `aellux.ext.adaptive.legacy.min.js` | 8,329 / 3,513 | 6 / 3 | 8.5 / 3.5 |
| `aellux.ext.present.min.js` | 18,342 / 6,549 | 18 / 6.25 | 18.5 / 6.5 |
| `aellux.ext.present.legacy.min.js` | 25,755 / 9,108 | 25 / 9 | 26 / 9 |
| `aellux.ext.scrollbox-snap.min.js` | 10,388 / 4,020 | 10 / 4 | 10.5 / 4 |

Cancelable mount/unmount preflight and cancellation-aware teardown raise the Modern Orchestrator raw limit from 56 to 56.5 KiB and Full Legacy from 425 to 426 KiB. With the CSS Motion cadence correction and lightweight Present progress classification, Full Legacy measures 435,441 / 130,367 bytes, with its gzip limit retained at 138 KiB. Other limits are unchanged. `npm run test:budget` checks every minified distribution artifact.

Duplicate-attribute source inspection adds the scanner and its development guard to the runtime and AJAX artifacts. The following measurements and limits supersede the affected entries above; all other limits remain unchanged:

| Artifact | Measured raw / gzip bytes | Previous limits | Current limits |
| --- | --- | --- | --- |
| `aellux.min.js` | 47,218 / 15,071 | 46 / 15 | 46.5 / 15 |
| `aellux.orchestrator.min.js` | 60,119 / 20,213 | 56.5 / 19 | 59 / 20 |
| `aellux.orchestrator.legacy.min.js` | 330,868 / 105,121 | 318 / 102 | 324 / 103 |
| `aellux.full.min.js` | 130,488 / 42,236 | 130 / 40.5 | 130 / 41.5 |
| `aellux.full.legacy.min.js` | 441,545 / 131,670 | 426 / 138 | 432 / 138 |
| `aellux.ext.ajax-href.min.js` | 7,096 / 3,049 | 5 / 3 | 7 / 3 |
| `aellux.ext.ajax-href.legacy.min.js` | 14,608 / 5,531 | 12 / 5 | 14.5 / 5.5 |

Resource conflict diagnostics, eligible Snap item style checks and the associated integration fixes add the following costs relative to `321cef0`. These limits supersede the affected entries above. All other artifact limits, including Boot/ESM and Full Legacy gzip, remain unchanged.

| Artifact | Measured raw / gzip bytes | Added raw / gzip bytes | Previous limits | Current limits |
| --- | --- | --- | --- | --- |
| `aellux.orchestrator.min.js` | 62,551 / 20,899 | 2,341 / 644 | 59 / 20 | 62 / 20.5 |
| `aellux.orchestrator.legacy.min.js` | 335,131 / 105,919 | 4,155 / 762 | 324 / 103 | 328 / 104 |
| `aellux.full.min.js` | 133,617 / 43,261 | 2,435 / 709 | 130 / 42 | 131 / 42.5 |
| `aellux.full.legacy.min.js` | 446,470 / 132,741 | 4,251 / 785 | 432 / 138 | 437 / 138 |

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
