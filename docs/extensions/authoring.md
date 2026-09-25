# Authoring Third-Party Aellux Extensions

An Aellux Extension is a classic browser script that registers one focused behavior through `Aellux.extRegister()`. Third-party Extensions follow the same naming, lifecycle, compatibility, and cleanup rules as Core Extensions.

Start from [`templates/aellux.ext.template.js`](../../templates/aellux.ext.template.js). The scaffold contains the required structure and a compatibility summary.

## Required Contract

1. Name the source and Modern artifact `aellux.ext.<name>.js`.
2. Use the same kebab-case `<name>` as `extensionName` in `Aellux.extRegister(extensionName, api)`.
3. Publish a classic script contained by an IIFE. Distribution files must not require ESM imports or exports.
4. Keep `init()` synchronous and idempotent.
5. Make every `mount` idempotent and release its listeners, observers, timers, and references in the corresponding `unmount`.
6. Release Extension-wide resources in `destroy()`.
7. Keep the public API and lifecycle behavior equivalent across Modern and Legacy variants.

The runtime exposes a kebab-case name as camelCase: `tab-group` becomes `Aellux.tabGroup`.

## Declaring Available Builds

The `builds` option describes the artifacts published by the Extension:

```js
$ae.ext("example", { builds: ["modern", "legacy"] });
```

- `builds: ["modern"]` loads `aellux.ext.example.js` only with the Modern runtime. The Legacy runtime reports diagnostic `1106` without requesting an incompatible script.
- `builds: ["legacy"]` loads `aellux.ext.example.legacy.js`. An ES5 Legacy artifact can also run under the Modern runtime.
- `builds: ["modern", "legacy"]` selects the artifact matching the runtime.
- Omitting `builds` defaults to both variants and therefore promises that both files are published.

The declarative equivalent is:

```html
<link rel="aellux-ext"
      href="./extensions/aellux.ext.example.js"
      data-ae-builds="modern legacy">
```

Custom URLs must retain the `aellux.ext.<name>.js` logical filename. Aellux derives `.legacy.js` and `.min.js` variants from that URL.

## Modern and Legacy Artifacts

The Modern source baseline is ES2017+. Legacy support requires ES5 syntax; changing only the filename is not sufficient.

Expected files for an Extension supporting both targets are:

```text
aellux.ext.example.js
aellux.ext.example.min.js
aellux.ext.example.legacy.js
aellux.ext.example.legacy.min.js
```

The reference builder in [`templates/build-extension.mjs`](../../templates/build-extension.mjs) bundles the source as a classic script and generates all four files. Install its build dependencies in the Extension project:

```sh
npm install --save-dev @babel/core @babel/preset-env esbuild
node build-extension.mjs ./src/aellux.ext.example.js ./dist
```

The builder targets ES2017 for Modern files and uses Babel with an IE 11 target to emit ES5-compatible Legacy syntax. Authors may use another toolchain, but the filenames and runtime contract must remain the same.

## Polyfills Available in Legacy

The Legacy orchestrator provides these compatibility layers once for all Extensions:

- `core-js/stable`, including `Promise`, `Map`, `Set`, `WeakMap`, `Symbol`, common `Object` and `Array` helpers, and URL-related language APIs;
- `fetch`;
- `CustomEvent`;
- `requestAnimationFrame` and `cancelAnimationFrame`;
- `MutationObserver`;
- `IntersectionObserver`;
- `ResizeObserver`;
- `Element.prototype.matches`; and
- `NodeList.prototype.forEach`.

The Core does not guarantee every browser or application API. If an Extension requires another capability, such as `WebSocket`, Web Components, a Canvas API, extra `Intl` locale data, or a third-party package, it must feature-detect that dependency and bundle or load its own fallback. Additional polyfills should avoid replacing a native implementation when one is already available.

Transpilation only changes syntax. It does not create missing browser APIs, so an Extension is not Legacy-compatible until both its syntax and runtime dependencies are covered.

## Styles and Resources

Use `loadStyle: true` when the stylesheet follows the Extension filename, or pass a stylesheet URL. Modern and Legacy JavaScript variants share the same CSS unless the Extension implements an explicit alternative resource strategy.

Do not leave the Extension partially initialized when an optional resource fails. Report failures through `Aellux.diagnostics` and preserve usable fallback behavior whenever possible.

## Publication Checklist

- Modern artifact follows the filename convention.
- Declared `builds` matches the files actually published.
- Legacy artifact parses as ES5 and exposes the same API.
- Extra APIs are feature-detected and polyfilled by the Extension when required.
- `init`, `mount`, `unmount`, and `destroy` obey the lifecycle contract.
- Repeated mount and destroy operations do not duplicate or retain resources.
- Both runtime selections are covered by browser tests.
