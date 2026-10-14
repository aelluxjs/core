# Registering aellux.js Extensions

Use `$ae.ext(...)` to declare an Extension before the runtime needs it.

## Label

```js
$ae.ext("preference");
```

A name resolves to `aellux.ext.<name>.js` relative to the aellux.js boot script. Loading `aellux.min.js` selects matching `.min.js` Extension files.

## URL

```js
$ae.ext("./extensions/aellux.ext.example.js");
```

Custom URLs should preserve the `aellux.ext.<name>.js` filename convention so the runtime can derive the Extension name and optional stylesheet URL reliably.

## Options

```js
$ae.ext("preference", {
  builds: ["modern", "legacy"],
  loadWhen: "[data-ae-preference]"
});
```

- `builds` declares published JavaScript variants: `modern`, `legacy`, or both. Omitting it promises both variants.
- `loadWhen` delays loading until a matching element is discovered.
- An invalid `loadWhen` selector reports `ERROR_EXTENSION_LOAD_WHEN` (`1114`), and `ext()` leaves the Extension undeclared.
- `loadStyle: true` requests the stylesheet derived from the Extension script URL; a URL string requests that specific stylesheet.
- `integrity` supplies SRI hashes for third-party Extension files; `crossOrigin` controls the associated `crossorigin` attribute. See [CSP and Extension trust](csp-and-trust.md#subresource-integrity).

Register each name once. Duplicate declarations currently report an error and do not replace the existing registration.

Register Extensions before calling `$ae.init()` in `basic` mode so the first document update can load eager Extensions and index lazy ones:

```js
$ae.ext("feedback");
$ae.init({ mode: "basic" });
```

## Shared script dependencies

Call `$ae.dep(label, url)` before or after `$ae.init()`, including from an Extension's `init()`, to load a classic script immediately. It returns a Promise that resolves to the script element only after the browser's `load` event. Await it before using a global supplied by the dependency:

```js
async function init() {
  await AelluxJs.dep("shared-widget@1.0", "/vendor/shared-widget.min.js");
  // The dependency is ready here.
}
```

The first call owns the label. Calls from other Extensions with the same label and URL return the same Promise, including while the script is still loading, so the script is inserted only once. A later call with the same label but a different URL rejects with `ERROR_DEPENDENCY_CONFLICT` (`1117`). A failed load rejects with `ERROR_DEPENDENCY_LOAD` (`1118`), removes its script and registry entry, and lets a later call retry. Empty labels or URLs reject with `ERROR_DEPENDENCY_ARGUMENT` (`1116`). Records are available at `$ae.registry.dep[label]` and remain cached when an Extension is destroyed.

As with Extension assets, a URL beginning with `./` resolves relative to the aellux.js base path. Other relative URLs follow normal browser URL resolution. Optional third argument `{ integrity, crossOrigin }` applies SRI and CORS attributes to the dependency script.

## Extension Attachment

An Extension script exposes its API through `AelluxJs.extAttach()`:

```js
(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "example";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  AelluxJs.extAttach(extensionName, { init, destroy });

  function init() {}
  function destroy() {}
})(typeof globalThis !== "undefined" ? globalThis : window);
```

Declare the Extension with `ext()` before calling `extAttach()`. The attachment supplies its definitive API object. `extAttach()` requires a valid kebab-case or camelCase Extension name and an API object with an `init()` function. `destroy()`, when provided, must also be a function. Invalid arguments report `ERROR_EXTENSION_ATTACH` (`1112`) and leave the Extension unattached. A missing declaration reports `ERROR_EXTENSION_NOT_REGISTERED` (`1110`); a second attachment reports `ERROR_EXTENSION_DUPLICATE` (`1101`).

`init(options)` may complete synchronously or return a Promise. The runtime awaits it before marking the Extension as initialized and resolving `$ae.wait(extensionName)`. A thrown error or rejected Promise reports `ERROR_EXTENSION_INITIALIZE` (`1102`), leaves the Extension uninitialized, and permits a later initialization attempt.

Use the [aellux.js Extension scaffold](https://github.com/aelluxjs/core/blob/main/templates/README.md) for the complete lifecycle structure.
Third-party authors should also follow the [Extension authoring and compatibility contract](authoring.md).
Review [CSP requirements and Extension trust](csp-and-trust.md) before registering assets from another origin.
