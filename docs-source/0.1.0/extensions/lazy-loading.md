# Lazy Extension Loading

Lazy loading delays an Extension until a matching element is found during `$ae.mount(root)`.

```js
$ae.ext("preference", {
  loadWhen: "[data-ae-preference]"
});
```

The same behavior can be declared in HTML:

```html
<link rel="aelluxjs-ext" href="preference"
      data-ae-load-when="[data-ae-preference]">
```

When the selector matches, the orchestrator loads and initializes the Extension, registers its mount selectors, and mounts matching elements in the affected scope.

Loading promises are cached while a load or initialization attempt is pending, so concurrent requests share one attempt. The runtime removes the Extension from the lazy selector index only after successful initialization. If loading or initialization fails, the attempt resolves to `null`, its cached promise is cleared, and the lazy selector remains registered so a later request can retry. An incompatible build is terminal for the active runtime: its lazy selector is removed and its `null` result remains cached.
