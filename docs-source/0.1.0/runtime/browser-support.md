# Browser Support

aellux.js uses an ES5-compatible boot script to select either the Modern or Legacy runtime. Browser support therefore depends on the selected runtime, the Web Platform APIs available in the host, and any additional requirements introduced by loaded Extensions.

## Modern Syntax Baseline

The Modern distribution targets ES2017+ syntax. The following versions are a preliminary reference for browsers capable of parsing that syntax level:

| Browser | Min Ref |
| --- | ---: |
| Chrome | 55+ |
| Firefox | 52+ |
| Safari | 11+ |
| Edge | 15+ |

This table is a raw syntax baseline, not a complete browser-support guarantee. A browser may parse ES2017 while lacking a Web Platform API required by the runtime or by an Extension.

## Effective Compatibility

Before selecting the Modern runtime, the boot script checks the capabilities listed in its Modern dependency catalog. Missing capabilities are recorded in `AelluxJs.diagnostics.notAvailable`, and aellux.js selects the Legacy runtime when necessary.

Each aellux.js Extension remains responsible for feature-detecting browser APIs outside the Core compatibility contract. If an Extension requires an unavailable API, its build must provide or load the corresponding fallback.

## Validated Desktop Engines

The `0.1.0` release candidate has automated coverage in the following Playwright-managed engines on Windows 11 Pro. These versions identify the exact test environment; Chromium is not a Google Chrome support claim, and Playwright WebKit is not an Apple Safari support claim.

| Runner | Engine | Playwright revision |
| --- | --- | ---: |
| Playwright 1.63.0 | Chromium 153.0.8010.12 | 1243 |
| Playwright 1.63.0 | Firefox 155.0 | 1543 |
| Playwright 1.63.0 | WebKit 26.6 | 2359 |

The recorded run and its command are maintained in [Validation scenarios](../validation-scenarios.md). No mobile browser is included in this matrix.

## Legacy Scope

The Legacy distribution provides ES5 syntax and the shared polyfills documented in [ES5 support level](es5-support.md). Its `0.1.0` validation forces the Legacy profile in the current desktop engines listed above. Historical browser versions are outside the support matrix because they have not been tested directly.

See [Modern and Legacy runtimes](modern-legacy.md) for runtime selection and [Compatibility for aellux.js 0.1.0 Beta](../compatibility.md) for the current release contract.
