# Validation Scenarios

The pages in `tests/browser/` are focused browser scenarios for the `0.1.0-beta` release. Each page reports `PASSED` or `FAILED` in its document. Playwright runs them in Chromium, Firefox, and WebKit, and also checks dynamic mounting and extension CSS from outside the page.

## Automated Run

Install the Playwright browsers and run the scenarios:

```sh
npx playwright install
npm run test:browser
```

`test:browser` builds `dist/` before testing. Use `npm run test:browser -- --project=chromium` to run only Chromium. To use an installed Chrome or Edge instead of Playwright's Chromium, set `AELLUXJS_TEST_BROWSER_CHANNEL` to `chrome` or `msedge` and select the Chromium project. The Bootstrap scenario loads Bootstrap from jsDelivr and therefore requires network access.

## Scenario Pages

| Scenario | Example |
| --- | --- |
| Native HTML and Web Platform | [`html-web-platform.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/html-web-platform.html) |
| Bootstrap coexistence | [`bootstrap-integration.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/bootstrap-integration.html) |
| Dynamic DOM followed by `$ae.update(root)` | [`dynamic-update.html`](https://github.com/aelluxjs/core/blob/main/tests/browser/dynamic-update.html) |
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
