# Preference Extension

`preference` stores user choices, combines them with defaults, and reflects the result in document attributes. It is included in the `full` runtime. In `basic` mode, register it with `$ae.ext("preference")`.

```js
const preference = await $ae.wait("preference");
preference.set("colorScheme", "dark");
preference.update();
console.log(preference.get("colorScheme"));
```

`set(name, value)` saves the user value in the `AelluxJsPreferences` persistence store. Call `update()` to recompute and publish the current values; `set()` does not call `update()` automatically. Changes from the browser `storage` event are updated automatically. `update()` also dispatches `AelluxJsPreferencesChange`.

## Preference controls

An element marked with `data-ae-preference` is a clickable preference container. Descendants with `data-ae-option` set a value for that preference and receive the `ae--active` class when selected.

```html
<div data-ae-preference="colorScheme">
  <button type="button" data-ae-option="light">Light</button>
  <button type="button" data-ae-option="dark">Dark</button>
</div>
```

The Extension also recognizes `data-ae-label`, `data-ae-next`, and `data-ae-prev`. The next and previous controls are not implemented yet, so do not rely on them to cycle values.

Defaults currently cover color scheme, contrast, reduced motion, reduced transparency, forced colors, text scale, interface scale, extended timing, large targets, haptics, and sound. User values are loaded from persistence when the Extension initializes.
