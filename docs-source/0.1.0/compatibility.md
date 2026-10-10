# Compatibility for aellux.js 0.1.0 Beta

aellux.js `0.1.0-beta.6` is intended for progressive enhancement in existing browser interfaces. It provides an ES5-compatible boot distribution that selects an ES2017+ Modern runtime or an ES5-syntax Legacy runtime with bundled polyfills.

This beta validates the runtime contract and integration strategy. Its tested desktop-engine matrix is published in [Browser support](runtime/browser-support.md). The older versions listed there remain syntax references, and the release does not claim unrestricted compatibility with browsers capable of parsing ES5.

## Runtime Profiles

| Profile | Basic mode | Full mode | Syntax baseline |
| --- | --- | --- | --- |
| Modern | `aellux.orchestrator.js` | `aellux.full.js` | ES2017+ |
| Legacy | `aellux.orchestrator.legacy.js` | `aellux.full.legacy.js` | ES5 output plus runtime polyfills |

The distributed `aellux.js` boot script is ES5-compatible. Build-time imports used by its source are bundled away and do not appear in the browser distribution.

## Runtime Selection

The boot script selects Legacy when required browser capabilities are missing, when Modern startup fails, or when Legacy is explicitly forced:

```js
$ae.init({ mode: "basic", forceLegacy: true });
```

For browser testing, append `?aellux-debug-legacy=1` or `?aellux-debug-legacy=true` to the page URL.

The preliminary minimum versions for parsing the Modern distribution are documented in [Browser support](runtime/browser-support.md). Those versions are syntax references rather than guarantees that every required Web Platform API is present.

## Extension Compatibility

Core Extensions are distributed as Modern and generated Legacy variants. The Legacy orchestrator provides shared polyfills, so individual Legacy Extension files do not bundle the same polyfills again.

Third-party Extensions declare their published artifacts through `builds: ["modern"]`, `builds: ["legacy"]`, or `builds: ["modern", "legacy"]`. The declarative equivalent is `data-ae-builds`. aellux.js selects the available compatible artifact and reports diagnostic `1106` before requesting a Modern-only Extension from a Legacy runtime.

See [Authoring Third-Party aellux.js Extensions](extensions/authoring.md) for lifecycle rules, filename conventions, the reference Legacy build, and the exact polyfill boundary.

## Bootstrap

aellux.js does not require or bundle Bootstrap. Its attributes, classes, and events use aellux.js-specific namespaces. Optional Extension stylesheets can be loaded after Bootstrap when an application needs them to take precedence. The automated suite validates basic CSS and namespace coexistence with the local Bootstrap 5.3.8 fixture; it does not claim compatibility with Bootstrap JavaScript components or plugins.

See [Bootstrap integration](integrations/bootstrap.md) and the browser validation scenario in `tests/browser/bootstrap-integration.html`.

## Current Limits

- The historical browser versions in the syntax table are references rather than tested support claims.
- The Legacy profile is validated through forced execution in the current tested desktop engines. No historical browser version is included in the `0.1.0` support matrix.
- Legacy execution still depends on the host providing fundamental DOM capabilities.
- Mobile browsers are not included in the validated matrix.
- Applications must call `$ae.mount(root)` after relevant dynamic DOM insertion and `$ae.unmount(root)` before removing mounted content when cleanup is required.

See [Browser support](runtime/browser-support.md), [Modern and Legacy runtimes](runtime/modern-legacy.md), [ES5 support level](runtime/es5-support.md), and [Modern and Legacy Extension variants](extensions/legacy-variants.md) for details.
