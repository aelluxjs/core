# Lazy Extension Loading

Lazy loading delays an Extension until a matching element is found during `$ae.mount(root)`.

Basic starts with no Extension registrations. Declare each desired Extension explicitly and supply `loadWhen` to select the markup that activates it. Full registers the official Extensions automatically, includes the Bundled implementations and loads Optional Extensions (Ajax Href, Dialog, Progress, PWA and Viewport) from separate signed files when their selectors match. Full initializes Preference and State Navigation at startup. Explicit host registrations can replace unused Full defaults. Basic styles remain opt-in through `loadStyle: true`.

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

`$ae.ext(name)` without `loadWhen` registers an eager load during mounting. With `{ load: false }`, register first and then use `$ae.wait(name)` to load the Extension explicitly. State Navigation has no activation selector and uses this option for deferred API access. `$ae.wait(name)` rejects an unregistered name, even when the official catalog contains it.

Loading promises are cached while a load or initialization attempt is pending, so concurrent requests share one attempt. The runtime removes the Extension from the lazy selector index only after successful initialization. If loading or initialization fails, the attempt resolves to `null`, its cached promise is cleared, and the lazy selector remains registered so a later request can retry. An incompatible build is terminal for the active runtime: its lazy selector is removed and its `null` result remains cached.
