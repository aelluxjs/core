# ES5 Support Level

ES5 compatibility describes the syntax baseline of the aellux.js boot script and Babel-generated Legacy variants. It does not mean unrestricted support for every historical browser capable of parsing ES5.

## Boot Script

The generated `dist/aellux.js` boot script avoids modern runtime syntax so it can perform capability detection before selecting the Modern or Legacy runtime. Source-level imports only organize internal helpers during development and are bundled away. Optional APIs are checked before use where the boot process requires them.

## APIs and Polyfills

Syntax compatibility alone does not provide missing browser APIs. For this reason, the selected Legacy runtime, `aellux.orchestrator.legacy.js` or `aellux.full.legacy.js`, includes compatibility layers for:

- ES language APIs supplied by `core-js`, including `Promise`, collections, symbols, `Object` helpers, `Array` helpers and `URLSearchParams`;
- `fetch`;
- `CustomEvent`;
- `requestAnimationFrame` and `cancelAnimationFrame`;
- `Element.prototype.matches`; and
- `NodeList.prototype.forEach`.

The generated Legacy Extensions do not embed these shared dependencies again. They are loaded after, and share the environment prepared by, the Legacy orchestrator. Extension-specific compatibility belongs to the corresponding Extension.

`<dialog>` is the standard element for Aellux modal interfaces. Missing dialog methods select the Legacy runtime automatically, but the runtime does not install the fallback globally. The official [Dialog Extension](../core-extensions/dialog.md) embeds `dialog-polyfill` and its CSS exclusively in its Legacy files. Full loads it on demand for `dialog`; Basic requires `$ae.ext("dialog")`. Registration occurs during Dialog mounting, before its controllers become available. Await mounting before calling dialog methods; with `skipGlobalMount: true`, explicitly mount the desired subtree. Native dialog implementations are preserved, including when Legacy is forced.

The fallback implements the established dialog API, not newer features such as `requestClose()` or `closedby`. Place modal dialogs directly under `<body>` where possible: unlike the native top layer, the fallback is subject to ancestor stacking contexts. Style both `dialog::backdrop` and `dialog + .backdrop` when customizing the backdrop. See the [upstream limitations](https://github.com/GoogleChrome/dialog-polyfill#limitations).

Third-party Extensions may rely on this list only while running under the aellux.js Legacy runtime. Any additional API must be feature-detected and included by the Extension's own build or loaded as an explicit dependency. Babel or another transpiler can produce ES5 syntax, but does not automatically provide missing browser APIs.

Browser primitives such as the DOM, `XMLHttpRequest` and `DOMParser` are still expected from the host environment. For `0.1.0`, the Legacy contract covers the ES5 output, runtime selection and fallback, shared polyfill installation, and generated Extension variants when exercised in the current tested browser engines. It does not declare compatibility with any historical browser version. ES5 syntax must therefore not be interpreted as unrestricted support for old browsers.

See [Extension Authoring](../extensions/authoring.md) for the publication contract and reference build.

## Build Tooling

Node.js 20 or newer is required to build aellux.js. This tooling requirement is independent of the browser syntax baseline.
