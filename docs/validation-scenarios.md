# Validation Scenarios

The pages in `tests/browser/` are focused browser scenarios for the `0.1.0-beta` release. Each page reports `PASSED` or `FAILED` in its document and can also be run automatically with Chrome or Edge.

## Automated Run

Build the distribution before running the scenarios:

```sh
npm run build
npm run test:browser
```

Set `AELLUX_TEST_BROWSER` to an executable path when Chrome or Edge is not installed in a standard location. The Bootstrap scenario loads Bootstrap from jsDelivr and therefore requires network access.

## Scenario Pages

| Scenario | Example |
| --- | --- |
| Native HTML and Web Platform | [`html-web-platform.html`](../tests/browser/html-web-platform.html) |
| Bootstrap coexistence | [`bootstrap-integration.html`](../tests/browser/bootstrap-integration.html) |
| Dynamic DOM followed by `$ae.update(root)` | [`dynamic-update.html`](../tests/browser/dynamic-update.html) |
| Eager Extension loading | [`extension-eager.html`](../tests/browser/extension-eager.html) |
| Lazy Extension loading | [`extension-lazy.html`](../tests/browser/extension-lazy.html) |
| Extension with associated CSS | [`extension-with-css.html`](../tests/browser/extension-with-css.html) |
| JavaScript-only Extension | [`extension-without-css.html`](../tests/browser/extension-without-css.html) |
| Modern-only Extension rejected by Legacy runtime | [`extension-modern-only.html`](../tests/browser/extension-modern-only.html) |
| Legacy-only Extension loaded by Modern runtime | [`extension-legacy-only.html`](../tests/browser/extension-legacy-only.html) |
| Idempotent boot and Extension initialization | [`lifecycle-init-idempotence.html`](../tests/browser/lifecycle-init-idempotence.html) |
| Idempotent element mount and resource-releasing unmount | [`lifecycle-element-mount-unmount.html`](../tests/browser/lifecycle-element-mount-unmount.html) |
| Isolated Extension destruction | [`lifecycle-extension-destroy.html`](../tests/browser/lifecycle-extension-destroy.html) |
| Global Core destruction | [`lifecycle-core-destroy.html`](../tests/browser/lifecycle-core-destroy.html) |
| Modern runtime selection | [`runtime-modern.html`](../tests/browser/runtime-modern.html) |
| Forced Legacy runtime selection | [`runtime-legacy-forced.html`](../tests/browser/runtime-legacy-forced.html) |
| Modern and Legacy Extension builds | [`extension-modern-legacy.html`](../tests/browser/extension-modern-legacy.html) |
| Isolated Extension failure | [`extension-failure-isolation.html`](../tests/browser/extension-failure-isolation.html) |

The shared [`harness.js`](../tests/browser/harness.js) waits for `AelluxReady`, applies a timeout, records assertion failures, and exposes the final status through `data-test-status` for the automated runner.
