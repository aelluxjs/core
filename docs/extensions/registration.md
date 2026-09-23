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
  loadWhen: "[data-ae-adaptive]",
  loadStyle: true
});
```

- `loadWhen` delays loading until a matching element is discovered.
- `loadStyle` requests the stylesheet derived from the Extension script URL.

Register each label once. Duplicate declarations currently report an error and do not replace the existing registration.

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
