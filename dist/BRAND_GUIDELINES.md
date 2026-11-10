# ællux Brand Naming Guidelines

This is the authoritative naming policy for the aellux ecosystem. It applies to current source code, documentation, examples, metadata, templates, tests and distributions. Names retain their prescribed case at the beginning of sentences and in titles.

## Names and scope

| Context | Official Name |
| --- | --- |
| Canonical brand | `aellux` |
| Stylized brand | `ællux` |
| Semantic model | `aellux` |
| Manifesto | `aellux manifesto` |
| Canonical JavaScript library | `aellux.js` |
| Stylized JavaScript library | `ællux.js` |
| JavaScript global object | `aelluxJs` |
| JavaScript API reference | `aellux.js API` |
| Documentation | `aellux.js Docs` |

**aellux is the semantic model; aellux.js is a JavaScript implementation of that model for the Web Platform.** The brand encompasses the manifesto, principles and semantic approach to building interactive digital user interfaces. The library is a product implementing those principles; its existence does not define or limit the manifesto's conceptual scope. Avoid calling the library only “aellux” where readers could confuse the implementation with the model.

## Canonical and artistic presentation

Use lowercase `aellux` for the brand and model, and `aellux.js` for the library, in running text, technical documentation, academic references, accessible descriptions and search metadata. Do not capitalize either name in a heading or at the beginning of a sentence.

The artistic forms `ællux` and `ællux.js` are preferred for appropriate institutional headings, presentation covers, promotional materials, visual identity and editorial compositions. Prefer `ællux` for the main manifesto title. The ligature is a presentation choice; `aellux` remains valid in every context, including headings when readability, accessibility or technical constraints favor it.

The yellow square logotype already contains `æ`. When it appears alongside a name, prefer the text `aellux` (or `aellux.js` for the library) to avoid unnecessary visual repetition. Combining the logotype and the artistic name remains permitted when the composition warrants it. Do not automatically alter existing logos, SVGs or other artwork to enforce this preference.

Use ASCII in programming identifiers, package names, technical paths and URLs. Preserve conforming published names such as `@aelluxjs/core`, `aellux.js`, `data-ae-*` and `rel="aelluxjs-ext"`. Keep existing domains and canonical URLs. Search fields, HTML titles, descriptions, Open Graph, Twitter Cards and structured data should use the canonical ASCII names so searches for “ae” can find the project.

## JavaScript API

The public global object is `globalThis.aelluxJs`, with the existing short alias `$ae`. The importable ESM entry returns the same API instance. Use `aelluxJs` in operational examples and as the conventional local name for that import:

```js
import aelluxJs from "@aelluxjs/core";

aelluxJs.ext("focus");
aelluxJs.init({ mode: "basic" });
```

Browser scripts can call these same methods after loading `aellux.js`. The camelCase identifier names a JavaScript object; it is distinct from the library's commercial name. Do not expose `aellux`, `aelluxJS` or the retired `AelluxJs` as alternative library globals.

This policy does not mechanically rename internal identifiers, classes, types, constants or independent protocol names. Their language conventions and existing contracts still apply. For example, `createAelluxApi`, `createAelluxConstants`, `startAelluxJs`, `AelluxPWAConfig`, the `AelluxJsReady` DOM event and the `AelluxJsPreferences` storage key are legitimate technical identifiers. Their spelling does not designate an alternative library global.

## Correct and incorrect usage

| Use | Avoid | Reason |
| --- | --- | --- |
| `aellux semantic model` | `Aellux semantic model` | The brand remains lowercase. |
| `aellux manifesto` | `Aellux Manifesto` | Preserve the canonical brand. |
| `aellux.js library` | `AelluxJS`, `Aellux.js`, `AelluxJs`, `aelluxJS` | The product name includes `.js`. |
| `ællux.js — Documentation` | `Ællux.js — Documentation` | The artistic form also remains lowercase. |
| `aelluxJs.init()` | `AelluxJs.init()`, `aelluxJS.init()` | The global uses exactly this camelCase spelling. |
| `The aellux.js library implements the aellux model.` | `aellux is just the JavaScript library.` | Distinguish model and implementation. |

## Pre-0.1.0 migration and compatibility

The development version replaces the earlier `AelluxJs` global with `aelluxJs`. This is a **potentially breaking API change** for integrations using the earlier beta global. There is no compatibility alias for the retired name. Replace global references and conventional ESM import bindings in application code, callbacks, third-party extensions, loaders and copied snippets. Applications using `$ae` retain that alias.

Deploy matching boot, Modern/Legacy runtimes, Full bundles, independent extensions and adapters together. Older extension scripts can still refer to the retired global, and an older boot/runtime mixed with new artifacts can fail even if the filenames or beta version match. Refresh application-owned offline caches when updating; the Library worker changes its cache version with this migration. Existing published release artifacts and Git tags remain immutable.

The [Compatibility Commitment](../docs-source/0.1.x/runtime/compatibility-commitment.md) begins with the finalized `0.1.0` initialization spelling; it does not retroactively protect earlier beta globals. DOM event names, persistence keys, extension contracts, CSS namespaces, package names and published URLs are retained by this naming migration.

## Contribution checks and exceptions

Run `npm run test:naming` after changing names or examples and after regenerating distributions/documentation. CI runs this check after the build. It examines current first-party text, including generated artifacts and embedded examples, while allowing separately identified historical material, migration explanations, incorrect examples and established technical identifiers.

Keep released changelog sections, archival milestone reports, third-party code, licenses and existing artwork intact. Any new exception in current code must be narrowly justified in the checker. A historical reference or negative test must not become an operational example depending on the retired global. See the [published naming and migration guide](../docs-source/0.1.x/brand-naming.md) for integration instructions.
