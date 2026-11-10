# ællux.js Naming and Migration

The [official Brand Naming Guidelines](https://github.com/aelluxjs/core/blob/main/BRAND_GUIDELINES.md) are the authoritative reference for contributors and integrations.

The **aellux** brand represents the manifesto, principles and semantic model for interactive digital user interfaces. **aellux.js** is a JavaScript implementation of that model for the Web Platform. The artistic forms **ællux** and **ællux.js** are suitable for visual headings; running text, accessible descriptions and search metadata use the canonical ASCII names. Both brands remain lowercase, including in titles and at the beginning of sentences. Beside the yellow square logotype, prefer the ASCII text because the logo already contains the ligature.

## Public object migration

The development version replaces the earlier `AelluxJs` global with **`aelluxJs`**, before the finalized `0.1.0` contract takes effect. This is a potentially breaking change for integrations with earlier betas. The retired global has no compatibility alias. The existing `$ae` alias remains available.

After loading the browser boot script, use:

```js
aelluxJs.ext("focus");
aelluxJs.init({ mode: "basic" });
```

Modules conventionally import the shared object as:

```js
import aelluxJs from "@aelluxjs/core";

aelluxJs.attr("preference");
```

Update references in application code, callbacks, third-party extension registration and copied examples. Deploy the boot, Modern/Legacy runtime, Full bundle, independent extensions and input adapters from the same build. Mixing old and new assets can fail even when the filenames or beta version match. Refresh application-owned offline caches; the Library worker's cache version is updated for this migration.

## Technical names and historical material

The library name is `aellux.js`; `aelluxJs` is the JavaScript object identifier. Existing internal functions, classes and constants retain their language conventions. The `AelluxJsReady` event, other DOM event names, persistence keys such as `AelluxJsPreferences`, `AelluxPWAConfig`, `$ae`, `data-ae-*`, filenames, `@aelluxjs/core` and published URLs retain their existing spelling. These names are separate technical contracts.

Released changelog entries, archival milestone reports, third-party materials and existing artwork can contain historical names. Current operational examples use the finalized API. See the [Runtime API](runtime/api.md), [Getting Started](getting-started.md) and the [Compatibility Commitment](runtime/compatibility-commitment.md).
