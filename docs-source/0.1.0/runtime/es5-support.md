# ES5 Support Level

ES5 compatibility describes the syntax baseline of the Aellux boot script and Babel-generated Legacy variants. It does not mean unrestricted support for every historical browser capable of parsing ES5.

## Boot Script

The generated `dist/aellux.js` boot script avoids modern runtime syntax so it can perform capability detection before selecting the Modern or Legacy runtime. Source-level imports only organize internal helpers during development and are bundled away. Optional APIs are checked before use where the boot process requires them.

## APIs and Polyfills

Syntax compatibility alone does not provide missing browser APIs. For this reason, the selected Legacy runtime, `aellux.orchestrator.legacy.js` or `aellux.full.legacy.js`, includes compatibility layers for:

- ES language APIs supplied by `core-js`, including `Promise`, collections, symbols, `Object` helpers, `Array` helpers and `URLSearchParams`;
- `fetch`;
- `CustomEvent`;
- `requestAnimationFrame` and `cancelAnimationFrame`;
- `MutationObserver`;
- `IntersectionObserver`;
- `ResizeObserver`;
- `Element.prototype.matches`; and
- `NodeList.prototype.forEach`.

The generated Legacy Extensions do not embed these dependencies again. They are loaded after, and share the environment prepared by, the Legacy orchestrator.

Third-party Extensions may rely on this list only while running under the Aellux Legacy runtime. Any additional API must be feature-detected and included by the Extension's own build or loaded as an explicit dependency. Babel or another transpiler can produce ES5 syntax, but does not automatically provide missing browser APIs.

Browser primitives such as the DOM, `XMLHttpRequest` and `DOMParser` are still expected from the host environment. The final supported browser matrix remains part of the `0.1.0-beta` milestone, so ES5 syntax must not be interpreted as unrestricted support for every old browser.

See [Authoring Third-Party Aellux Extensions](../extensions/authoring.md) for the publication contract and reference build.

## Build Tooling

Node.js 20 or newer is required to build Aellux. This tooling requirement is independent of the browser syntax baseline.
