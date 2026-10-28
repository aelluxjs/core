# aellux.js Extension Scaffold

Copy `aellux.ext.template.js` to `src/aellux.ext.<extension-name>.js` for a core aellux.js Extension, or into a separate project for a third-party Extension. Templates are not included in the core build.

For a third-party package, copy both `aellux.ext.template.js` and `build-extension.mjs` into the Extension project. The complete contract is documented in [Authoring Third-Party aellux.js Extensions](../docs/extensions/authoring.md).

Set `extensionName` to the extension's kebab-case name before calling `AelluxJs.extAttach(extensionName, api)`. The bootstrap converts that name to the camelCase API key under `AelluxJs.ext`: `tab-group` registers `AelluxJs.ext.tabGroup`. Use `AelluxJs.attr(extensionName)` for the extension's primary attribute, when applicable. Initialize any constants exposed by the API before attaching it.

- `init(options)` receives the Extension's object from `AelluxJs.options.extensions` (or `{}`). It may return a Promise; the runtime awaits it before setting `initialized` and resolving `AelluxJs.wait(extensionName)`. Keep initialization idempotent and leave mount maps and Extension-wide services ready before the Promise resolves. A rejected initialization is diagnosed and may be retried later.
- `destroy` may be asynchronous and releases extension-wide listeners, observers, and other resources before its Promise resolves.
- `AelluxJs.mountManager.add()` registers selectors and handlers during `init`; `remove()` clears them during `destroy`.
- `mountElement`, `unmountElement`, and an optional `updateElement` may be asynchronous; the mount manager awaits them. Repeated mounts must not duplicate listeners or resources.
- Public controller methods may also be asynchronous. Their Promise is returned to the caller.
- `unmountElement` releases resources associated with an element before its Promise resolves.

For extensions without element behavior, remove `attr`, the DOM handlers, and their DOM registration. Keep `extensionName`, `AelluxJs.extAttach`, `init`, `destroy`, the IIFE, and the Apache 2.0 license identifier. Use ES2017-compatible syntax and attach public APIs through `AelluxJs.extAttach`, without ESM exports.

## Compatibility Builds

Declare the artifacts that the package actually publishes:

```js
$ae.ext("example", { builds: ["modern", "legacy"] });
```

- `modern` corresponds to `aellux.ext.example.js` and the ES2017+ runtime.
- `legacy` corresponds to `aellux.ext.example.legacy.js` transpiled to ES5 syntax.
- Omitting `builds` means both artifacts are expected.

Install the reference builder dependencies and generate normal and minified variants:

```sh
npm install --save-dev @babel/core @babel/preset-env esbuild
node build-extension.mjs ./src/aellux.ext.example.js ./dist
```

The Legacy Core already provides `core-js/stable`, `fetch`, `CustomEvent`, animation frame functions, `Element.matches`, and `NodeList.forEach`. Observer APIs and any other additional browser APIs must be feature-detected and polyfilled by the Extension when required. Transpiling syntax does not polyfill missing browser APIs.

Call `AelluxJs.ext("<extension-name>")` before `AelluxJs.init({ mode: "basic" })` when a core Extension should be loaded individually. To include it in the full core bundle, also add its loader to `src/aellux.full.js`. Third-party components can be declared by URL through `$ae.ext(...)` or `<link rel="aelluxjs-ext">`; they do not belong to the core bundle.
