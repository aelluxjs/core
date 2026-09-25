# Compatibility for Aellux 0.1.0 Beta

Aellux `0.1.0-beta.1` is intended for progressive enhancement in existing browser interfaces. It provides an ES5-compatible boot distribution that selects an ES2017+ Modern runtime or an ES5-syntax Legacy runtime with bundled polyfills.

This beta validates the runtime contract and integration strategy. It does not yet claim a final browser support matrix or unrestricted compatibility with every browser capable of parsing ES5.

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

## Extension Compatibility

Core Extensions are distributed as Modern and generated Legacy variants. The Legacy orchestrator provides shared polyfills, so individual Legacy Extension files do not bundle the same polyfills again.

Third-party Extensions declare their published artifacts through `builds: ["modern"]`, `builds: ["legacy"]`, or `builds: ["modern", "legacy"]`. The declarative equivalent is `data-ae-builds`. Aellux selects the available compatible artifact and reports diagnostic `1106` before requesting a Modern-only Extension from a Legacy runtime.

See [Authoring Third-Party Aellux Extensions](extensions/authoring.md) for lifecycle rules, filename conventions, the reference Legacy build, and the exact polyfill boundary.

## Bootstrap

Aellux does not require or bundle Bootstrap. Its attributes, classes, events, and adaptive utilities use Aellux-specific namespaces. Adaptive utilities may intentionally override Bootstrap utilities when their stylesheet is loaded after Bootstrap.

See [Bootstrap integration](integrations/bootstrap.md) and the repository's `examples/tabs.htm` integration example.

## Current Limits

- The final tested browser matrix is not yet published.
- Legacy support depends on the host providing fundamental DOM capabilities.
- Experimental components under `examples/components/` are not part of the Core compatibility contract.
- Applications must call `$ae.update(root)` after relevant dynamic DOM insertion and `$ae.unmount(root)` before removing mounted content when cleanup is required.

See [Modern and Legacy runtimes](runtime/modern-legacy.md), [ES5 support level](runtime/es5-support.md), and [Modern and Legacy Extension variants](extensions/legacy-variants.md) for details.
