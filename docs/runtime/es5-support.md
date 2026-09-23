# ES5 Support Level

ES5 compatibility describes the syntax baseline of the Aellux boot script and Babel-generated Legacy variants. It does not mean unrestricted support for every historical browser capable of parsing ES5.

## Boot Script

The boot script avoids modern syntax so it can perform capability detection before selecting the Modern or Legacy runtime. Optional APIs are checked before use where the boot process requires them.

## APIs and Polyfills

Syntax compatibility alone does not provide missing browser APIs. For this reason, `aellux.orchestrator.legacy.js` includes compatibility layers for:

- ES language APIs supplied by `core-js`, including `Promise`, collections, symbols, `Object` helpers, `Array` helpers and `URLSearchParams`;
- `fetch`;
- `CustomEvent`;
- `requestAnimationFrame`;
- `MutationObserver`;
- `IntersectionObserver`;
- `ResizeObserver`;
- `Element.prototype.matches`; and
- `NodeList.prototype.forEach`.

The generated Legacy Extensions do not embed these dependencies again. They are loaded after, and share the environment prepared by, the Legacy orchestrator.

Browser primitives such as the DOM, `XMLHttpRequest` and `DOMParser` are still expected from the host environment. The final supported browser matrix remains part of the `0.1.0-beta` milestone, so ES5 syntax must not be interpreted as unrestricted support for every old browser.

## Build Tooling

Node.js 20 or newer is required to build Aellux. This tooling requirement is independent of the browser syntax baseline.
