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
| API normalization and builds | <span style="white-space: normal !important;">Global and ESM identity, camelCase Extension keys and options, compound filenames, Modern and Legacy selection, minified files, optional styles, and incompatible builds.</span> |
| Full distribution coverage | <span style="white-space: normal !important;">Bundled Extensions initialize from the Full runtime; Optional Extensions (Ajax Href, Dialog, PWA and Viewport) load separate compatible files on demand, without a duplicate script request or a manifest fetch for the current Core version. Modern, Legacy, normal, and minified paths are checked.</span> |
| Diagnostics | <span style="white-space: normal !important;">Severity, verbosity updates, retained history, invalid selectors and registrations, unavailable storage, callback failures, transitions, and lifecycle failures.</span> |
| Configuration diagnostics | <span style="white-space: normal !important;">Development-only semantic mount/update checks, scoped Extensions, configured prefixes, custom selector attributes, actionable targets/values/structure, CSS and keyboard reachability, quiet hidden/group states, Modern/Legacy paths, runtime AJAX validation and Adaptive numeric fallbacks.</span> |
| Loading | <span style="white-space: normal !important;">Eager and lazy loading, shared concurrent Promises, failed `init()` retry, failed script retry, optional stylesheet failure, and lazy-index cleanup after success or destruction.</span> |
| Lifecycle failure isolation | <span style="white-space: normal !important;">Rejected initialization, partial element mounting, failed update and unmount callbacks, failed destroy callbacks, and continued work for unaffected elements, registrations, and Extensions.</span> |
| Controllers and mount maps | <span style="white-space: normal !important;">Controller lookup, bound public methods and element-scoped events, forced mount/update/unmount, missing methods, duplicate maps, ascending map priorities, active-map removal protection, and cleanup after the last registration.</span> |
| Mount results and attributes | <span style="white-space: normal !important;">Unique return values, partial success results, concurrent mounts, failed-mount rollback, overlapping registrations, lifecycle event details with distinct affected elements, and restoration of `data-ae-*`, `aria-*`, and `hidden`.</span> |
| Resource cleanup | <span style="white-space: normal !important;">Element and global listeners, Extension scripts and styles, mount maps, controllers, layout queues, failed and dormant lazy registrations, and the mount manager observer.</span> |
| Detached elements | <span style="white-space: normal !important;">Removal during async mount, observer cleanup, moves within the document, explicit unmount races, and global cleanup when `MutationObserver` is unavailable.</span> |
| Accessibility contracts | <span style="white-space: normal !important;">Native keyboard activation for Preference controls, Focus restoration and hint cleanup, Present focus release plus ARIA state synchronization, failed-mount `aria-busy` cleanup, and root attributes for reduced motion, contrast, and forced colors.</span> |
| Extension event details | <span style="white-space: normal !important;">Adaptive dimensions, Preference changes, Scrollbox snap and pointer scroll events, and State Navigation snapshot copies.</span> |
| Feedback | <span style="white-space: normal !important;">Boundary type filtering, text and class updates, generated motion stylesheet loading, and invalid argument diagnostics.</span> |
| Layout and presentation | <span style="white-space: normal !important;">Anchor geometry, event-driven refresh and throttling; Adaptive resize fallback; Present transitions, focus release, ARIA state, and generated styles.</span> |
| Scrollbox interactions | <span style="white-space: normal !important;">Native progress, pointer drag and selection rules, nested scroll handoff, momentum, elastic pressure, snap navigation, custom scrollbar dragging, and scroll edge classes.</span> |
| Viewport geometry | <span style="white-space: normal !important;">Nearest native scrollport and document selection, normalized axes, geometric visible area, borders, scale and fractional dimensions, continuous scroll, native resize/layout changes, bounded Layout notifications, observer fallbacks, awaited mounting, reparenting, inline restoration, grouped cleanup and independent Snap navigation in Modern/Legacy builds. Basic/Full lazy loading and exclusion from global bundles are also checked.</span> |
| Asset integrity and dependencies | <span style="white-space: normal !important;">Variant-specific SRI, changed-byte rejection, `crossorigin`, CSS property registration, and dependency registration and retry.</span> |

The contract suite does not establish support for historical or mobile browsers and does not replace the separate accessibility review or additional iframe scenarios.
