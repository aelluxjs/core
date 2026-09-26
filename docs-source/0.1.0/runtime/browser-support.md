# Browser Support

Aellux uses an ES5-compatible boot script to select either the Modern or Legacy runtime. Browser support therefore depends on the selected runtime, the Web Platform APIs available in the host, and any additional requirements introduced by loaded Extensions.

## Modern Syntax Baseline

The Modern distribution targets ES2017+ syntax. The following versions are a preliminary reference for browsers capable of parsing that syntax level:

| Browser | Minimum reference version |
| --- | ---: |
| Chrome | 55+ |
| Firefox | 52+ |
| Safari | 11+ |
| Edge | 15+ |
| iOS Safari | 11+ |
| Samsung Internet | 6.2+ |

This table is a raw syntax baseline, not a complete browser-support guarantee. A browser may parse ES2017 while lacking a Web Platform API required by the runtime or by an Extension.

## Effective Compatibility

Before selecting the Modern runtime, the boot script checks the capabilities listed in its Modern dependency catalog. Missing capabilities are recorded in `Aellux.notAvailable`, and Aellux selects the Legacy runtime when necessary.

Each Aellux Extension remains responsible for feature-detecting browser APIs outside the Core compatibility contract. If an Extension requires an unavailable API, its build must provide or load the corresponding fallback.

## Legacy Scope

The Legacy distribution provides ES5 syntax and the shared polyfills documented in [ES5 support level](es5-support.md). It does not guarantee support for every historical browser capable of parsing ES5 because fundamental DOM behavior and Extension-specific APIs still depend on the host environment.

See [Modern and Legacy runtimes](modern-legacy.md) for runtime selection and [Compatibility for Aellux 0.1.0 Beta](../compatibility.md) for the current release contract.
