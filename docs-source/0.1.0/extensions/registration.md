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

Use the [aellux.js Extension scaffold](https://github.com/aelluxjs/core/blob/main/templates/README.md) for the complete lifecycle structure.
Third-party authors should also follow the [Extension authoring and compatibility contract](authoring.md).
Review [CSP requirements and Extension trust](csp-and-trust.md) before registering assets from another origin.
