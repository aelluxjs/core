# Lazy Extension Loading

Lazy loading delays an Extension until a matching element is found during `$ae.update(root)`.

```js
$ae.ext("adaptive", {
  loadWhen: "[data-ae-adaptive]",
  loadStyle: true
});
```

The same behavior can be declared in HTML:

```html
<link rel="aellux-ext" href="adaptive"
      data-ae-load-when="[data-ae-adaptive]"
      data-ae-load-style>
```

When the selector matches, the orchestrator loads and initializes the Extension, registers its mount selectors, and mounts matching elements in the affected scope.

Loading promises are cached to prevent duplicate concurrent loads. The current runtime removes the Extension from the lazy selector index after successful initialization. Moving that removal to the beginning of loading remains an explicit lifecycle review item for the beta.
