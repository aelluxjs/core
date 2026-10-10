# Preference Extension

`preference` stores user choices, combines them with defaults, and reflects the result in document attributes. It is included in the `full` runtime. In `basic` mode, register it with `$ae.ext("preference")`.

## Accessibility profile

- **Capabilities:** interaction and input; structure and state; visual preference policy; storage and media-query integration.
- **Owned state:** computed preference values, root preference attributes, option active classes and associated input values or checked state.
- **Consumer responsibility:** use native keyboard-operable controls with accessible names and preserve meaningful labels when mirroring selected content.
- **Limitation:** generic elements marked as options, next or previous controls do not receive button semantics or keyboard behavior automatically.

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

The Extension also recognizes `data-ae-label`, `data-ae-next`, and `data-ae-prev`. `data-ae-next` and `data-ae-prev` cycle through the built-in values for the container preference and wrap at either end. Preference names may use camelCase or kebab-case. If the current value is not recognized, next selects the first built-in value and previous selects the last.

```html
<div data-ae-preference="color-scheme">
  <button type="button" data-ae-prev>Previous</button>
  <span data-ae-label></span>
  <button type="button" data-ae-next>Next</button>
</div>
```

The cycling order is the order listed in the defaults below. Values loaded from persistence are matched by their string representation, so numeric preferences such as text scale continue from the persisted value.

Defaults currently cover color scheme, contrast, reduced motion, reduced transparency, forced colors, text scale, interface scale, extended timing, large targets, haptics, and sound. User values are loaded from persistence when the Extension initializes.
