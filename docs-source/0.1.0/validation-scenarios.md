# Validation Scenarios

The pages in `tests/browser/` are focused browser scenarios for the `0.1.0-beta` release. Each page reports `PASSED` or `FAILED` in its document. Playwright runs them in Chromium, Firefox, and WebKit, and also checks dynamic mounting and extension CSS from outside the page.

## Automated Run

Install the Playwright browsers and run the scenarios:

```sh
npx playwright install
npm run test:browser
```

`test:browser` builds `dist/` before testing. Use `npm run test:browser -- --project=chromium` to run only Chromium. To use an installed Chrome or Edge instead of Playwright's Chromium, set `AELLUXJS_TEST_BROWSER_CHANNEL` to `chrome` or `msedge` and select the Chromium project. The Bootstrap scenario loads Bootstrap from jsDelivr and therefore requires network access.

## Recorded Desktop Environment

The release-candidate run uses Playwright 1.63.0 on Windows 11 Pro (`10.0.26200.0`):

| Project | Engine version | Playwright revision |
| --- | --- | ---: |
| `chromium` | 153.0.8010.12 | 1243 |
| `firefox` | 155.0 | 1543 |
| `webkit` | 26.6 | 2359 |

The suite covers both normal Modern selection and forced Legacy execution. Forced Legacy validates the ES5 distribution path in these current engines; it does not establish support for historical versions of those browsers.

The complete matrix was run on October 10, 2026 with:

```sh
npm run test:browser -- --workers=1
```

Result: **276 passed** across the three projects. A single worker is used for the recorded release run to keep the local HTTP fixture available for the entire matrix.

## Scenario Pages

| Scenario | Example |
| --- | --- |
| Native HTML and Web Platform | [`html-web-platform.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/html-web-platform.html) |
| Bootstrap coexistence | [`bootstrap-integration.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/bootstrap-integration.html) |
| Dynamic DOM followed by `$ae.mount(root)` | [`dynamic-update.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/dynamic-update.html) |
| Eager Extension loading | [`extension-eager.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/extension-eager.html) |
| Lazy Extension loading | [`extension-lazy.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/extension-lazy.html) |
| Extension with associated CSS | [`extension-with-css.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/extension-with-css.html) |
| JavaScript-only Extension | [`extension-without-css.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/extension-without-css.html) |
| Modern-only Extension rejected by Legacy runtime | [`extension-modern-only.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/extension-modern-only.html) |
| Legacy-only Extension loaded by Modern runtime | [`extension-legacy-only.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/extension-legacy-only.html) |
| Idempotent boot and Extension initialization | [`lifecycle-init-idempotence.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/lifecycle-init-idempotence.html) |
| Idempotent element mount and resource-releasing unmount | [`lifecycle-element-mount-unmount.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/lifecycle-element-mount-unmount.html) |
| Isolated Extension destruction | [`lifecycle-extension-destroy.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/lifecycle-extension-destroy.html) |
| Global Core destruction | [`lifecycle-core-destroy.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/lifecycle-core-destroy.html) |
| Modern runtime selection | [`runtime-modern.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/runtime-modern.html) |
| Forced Legacy runtime selection | [`runtime-legacy-forced.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/runtime-legacy-forced.html) |
| Modern and Legacy Extension builds | [`extension-modern-legacy.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/extension-modern-legacy.html) |
| Isolated Extension failure | [`extension-failure-isolation.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/extension-failure-isolation.html) |

The shared [`harness.js`](https://github.com/aelluxjs/core/blob/main/tests/browser/harness.js) waits for `AelluxJsReady`, applies a timeout, records assertion failures, and exposes the final status through `data-test-status` for Playwright.

## Core Contract Regression Matrix

The browser suite covers the release contract in Chromium, Firefox, and WebKit:

| Contract area | Covered behavior |
| --- | --- |
| API normalization and builds | Global and ESM identity, camelCase Extension keys and options, compound filenames, Modern and Legacy selection, minified files, optional styles, and incompatible builds. |
| Diagnostics | Severity, verbosity updates, retained history, invalid selectors and registrations, unavailable storage, callback failures, transitions, and lifecycle failures. |
| Loading | Eager and lazy loading, shared concurrent Promises, failed `init()` retry, failed script retry, optional stylesheet failure, and lazy-index cleanup after success or destruction. |
| Lifecycle failure isolation | Rejected initialization, partial element mounting, failed update and unmount callbacks, failed destroy callbacks, and continued work for unaffected elements, registrations, and Extensions. |
| Controllers and mount maps | Controller lookup, bound public methods, forced mount/update/unmount, missing methods, duplicate maps, active-map removal protection, and cleanup after the last registration. |
| Mount results and attributes | Unique return values, partial success results, concurrent mounts, failed-mount rollback, overlapping registrations, and restoration of `data-ae-*`, `aria-*`, and `hidden`. |
| Resource cleanup | Element and global listeners, Extension scripts and styles, mount maps, controllers, layout queues, failed and dormant lazy registrations, and the mount manager observer. |
| Detached elements | Removal during async mount, observer cleanup, moves within the document, explicit unmount races, and global cleanup when `MutationObserver` is unavailable. |

The contract suite does not establish support for historical or mobile browsers and does not replace the separate accessibility review or iframe testing tasks.
