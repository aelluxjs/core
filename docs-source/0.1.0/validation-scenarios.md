# Validation Scenarios

The scenario HTML pages listed below are focused browser checks for the `0.1.0-beta` release. Each reports `PASSED` or `FAILED` in its document. Playwright also runs `.spec.mjs` tests for runtime APIs, Extension behavior, generated assets, and DOM state in Chromium, Firefox, and WebKit.

## Automated Run

Install the Playwright browsers and run the scenarios:

```sh
npx playwright install
npm run test:browser
```

`test:browser` builds `dist/` before testing. Use `npm run test:browser -- --project=chromium` to run only Chromium. To use an installed Chrome or Edge instead of Playwright's Chromium, set `AELLUXJS_TEST_BROWSER_CHANNEL` to `chrome` or `msedge` and select the Chromium project. The [Bootstrap](https://getbootstrap.com/) scenario uses the versioned local fixture `tests/fixtures/bootstrap-5.3.8.min.css` and requires no CDN or network access.

To run one spec after a build, use `npx playwright test tests/browser/full-bundle.spec.mjs --project=chromium`. For a Scrollbox change, replace that path with `tests/browser/scrollbox-pointer.spec.mjs` or `tests/browser/scrollbox-scrollbar.spec.mjs`. Direct `npx playwright test` commands use the current `dist/` files; run `npm run build:core` first after changing runtime or Extension source. The full bundle spec compares the bundled, registered, and lazy Core Extensions with the explicit list in `src/official-extension-definitions.js` in the normal and minified Modern and Legacy runtimes. Extension registry tests verify that separate Scrollbox and Snap files load when needed. Run `npm run test:budget` after a build to check raw and gzip artifact limits.

## Browser Matrix

The Playwright configuration runs Chromium, Firefox, and WebKit. The suite covers both normal Modern selection and forced Legacy execution. Forced Legacy validates the ES5 distribution path in these current engines; it does not establish support for historical versions of those browsers.

Run the complete matrix with one worker when recording a release result:

```sh
npm run test:browser -- --workers=1
```

The test runner's summary gives the current count and result. One worker reduces resource contention during the full browser matrix; Playwright starts the local HTTP fixture through its `webServer` configuration.

## Scenario Pages

| Scenario | Example |
| --- | --- |
| Native HTML and Web Platform | [`html-web-platform.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/html-web-platform.html) |
| [Bootstrap](https://getbootstrap.com/) coexistence | [`bootstrap-integration.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/bootstrap-integration.html) |
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
| API normalization and builds | Global and ESM identity, camelCase Extension keys and options,<br>compound filenames, Modern and Legacy selection, minified files,<br>optional styles, and incompatible builds. |
| Full distribution coverage | Bundled Core Extensions initialize from the Full runtime; Dialog,<br>Overflow Marquee, PWA, Scrollbox and Scrollbox Snap load separate<br>compatible files on demand, without a duplicate script request or a<br>manifest fetch for the current Core version. Modern, Legacy, normal,<br>and minified paths are checked. |
| Diagnostics | Severity, verbosity updates, retained history, invalid selectors and<br>registrations, unavailable storage, callback failures, transitions,<br>and lifecycle failures. |
| Configuration diagnostics | Development-only semantic mount/update checks, scoped Extensions,<br>configured prefixes, custom selector attributes, actionable<br>targets/values/structure, CSS and keyboard reachability, quiet<br>hidden/group states, Modern/Legacy paths, runtime AJAX validation and<br>Adaptive numeric fallbacks. |
| Loading | Eager and lazy loading, shared concurrent Promises, failed `init()`<br>retry, failed script retry, optional stylesheet failure, and<br>lazy-index cleanup after success or destruction. |
| Lifecycle failure isolation | Rejected initialization, partial element mounting, failed update and<br>unmount callbacks, failed destroy callbacks, and continued work for<br>unaffected elements, registrations, and Extensions. |
| Controllers and mount maps | Controller lookup, bound public methods and element-scoped events,<br>forced mount/update/unmount, missing methods, duplicate maps,<br>ascending map priorities, active-map removal protection, and cleanup<br>after the last registration. |
| Mount results and attributes | Unique return values, partial success results, concurrent mounts,<br>failed-mount rollback, overlapping registrations, lifecycle event<br>details with distinct affected elements, and restoration of `data-ae-*`,<br>`aria-*`, and `hidden`. |
| Resource cleanup | Element and global listeners, Extension scripts and styles, mount<br>maps, controllers, layout queues, failed and dormant lazy<br>registrations, and the mount manager observer. |
| Detached elements | Removal during async mount, observer cleanup, moves within the<br>document, explicit unmount races, and global cleanup when<br>`MutationObserver` is unavailable. |
| Accessibility contracts | Native keyboard activation for Preference controls, Focus restoration<br>and hint cleanup, Present focus release plus ARIA state<br>synchronization, failed-mount `aria-busy` cleanup, and root attributes<br>for reduced motion, contrast, and forced colors. |
| Extension event details | Adaptive dimensions, Preference changes, Scrollbox snap and pointer<br>scroll events, and State Navigation snapshot copies. |
| Feedback | Boundary type filtering, text and class updates, generated motion<br>stylesheet loading, and invalid argument diagnostics. |
| Layout and presentation | Anchor geometry, event-driven refresh and throttling; Adaptive resize<br>fallback; Present transitions, focus release, ARIA state, and<br>generated styles. |
| Scrollbox interactions | Native progress, pointer drag and selection rules, nested scroll<br>handoff, momentum, elastic pressure, snap navigation, custom scrollbar<br>dragging, and scroll edge classes. |
| Asset integrity and dependencies | Variant-specific SRI, changed-byte rejection, `crossorigin`, CSS<br>property registration, and dependency registration and retry. |

The contract suite does not establish support for historical or mobile browsers and does not replace the separate accessibility review or additional iframe scenarios.
