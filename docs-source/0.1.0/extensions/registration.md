# Registering Aellux Extensions

Use `$ae.ext(...)` to declare an Extension before the runtime needs it.

## Label

```js
$ae.ext("preferences");
```

A label resolves to `aellux.ext.<label>.js` relative to the Aellux boot script. Loading `aellux.min.js` selects matching `.min.js` Extension files.

## URL

```js
$ae.ext("./extensions/aellux.ext.example.js");
```

Custom URLs should preserve the `aellux.ext.<label>.js` filename convention so the runtime can derive the Extension label and optional stylesheet URL reliably.

## Options

```js
$ae.ext("adaptive", {
  builds: ["modern", "legacy"],
  loadWhen: "[data-ae-adaptive]",
  loadStyle: true
});
```

- `builds` declares published JavaScript variants: `modern`, `legacy`, or both. Omitting it promises both variants.
- `loadWhen` delays loading until a matching element is discovered.
- `loadStyle: true` requests the stylesheet derived from the Extension script URL; a URL string requests that specific stylesheet.

Register each label once. Duplicate declarations currently report an error and do not replace the existing registration.

Register Extensions before calling `$ae.init()` in `basic` mode so the first document update can load eager Extensions and index lazy ones:

```js
$ae.ext("feedback");
$ae.init({ mode: "basic" });
```

## Extension Registration

An Extension script exposes its API through `Aellux.extRegister()`:

```js
(function () {
  "use strict";

  const extensionName = "example";
  Aellux.extRegister(extensionName, { init, destroy });

  function init() {}
  function destroy() {}
})();
```

Use the [Aellux Extension scaffold](../../templates/README.md) for the complete lifecycle structure.
Third-party authors should also follow the [Extension authoring and compatibility contract](authoring.md).
