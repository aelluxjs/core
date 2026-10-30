<h1 id="bootstrap-integration"><a href="https://getbootstrap.com/">Bootstrap</a> Integration</h1>

aellux.js complements [Bootstrap](https://getbootstrap.com/); it does not replace or bundle it. [Bootstrap](https://getbootstrap.com/) owns its visual system and components, while aellux.js manages independently loadable UX behaviors.

## Namespaces

- aellux.js declarations use `data-ae-*`.
- Runtime state classes use `ae--*`.
- aellux.js events use the `AelluxJs` prefix.

These namespaces are designed to avoid collisions with [Bootstrap](https://getbootstrap.com/)'s public classes and data attributes.

## Loading Order

When an application's Extension stylesheet should take precedence over [Bootstrap](https://getbootstrap.com/), load it after [Bootstrap](https://getbootstrap.com/):

```html
<link rel="stylesheet" href="./bootstrap.min.css">
<link rel="stylesheet" href="./styles/extension.css">
<script src="./dist/aellux.js"></script>
```

The application controls the selectors and priority of its Extension stylesheet.

When adding motion or accessibility rules alongside [Bootstrap](https://getbootstrap.com/), target AelluxJs preference attributes on `<html>` so a saved local choice and the device setting both affect the result. For example, use `html[data-ae-reduced-motion="reduced"] .custom-transition { transition: none; }` for application owned motion. Apply this convention to future integration styles and scripts; use `$ae.currentPreference("reduced-motion")` in JavaScript before starting optional animations.

## Color Modes

Preference can synchronize Bootstrap 5.3's `data-bs-theme` attribute on `<html>` without Bootstrap JavaScript:

```js
$ae.init({
  mode: "full",
  extensions: {
    preference: { syncBootstrapThemeTag: true }
  }
});
```

The option defaults to `false`. When enabled, Preference writes the resolved `light` or `dark` theme at initialization and on subsequent updates, including device changes while the choice is `auto`. It updates the attribute before `PreferencesChange` and restores the previous attribute on destruction. In Basic, register `$ae.ext("preference")` explicitly and pass the same Extension options with `mode: "basic"`. Bootstrap CSS remains an application dependency; synchronization starts after Preference loads. See [Preference](../core-extensions/preference.md#bootstrap-color-mode) for the full contract.

## JavaScript Coexistence

Extensions should avoid unnecessary `preventDefault()` and `stopPropagation()`, should not remove third-party listeners, and must keep mounting idempotent when [Bootstrap](https://getbootstrap.com/) reveals or modifies content dynamically.

After inserting or revealing dynamic markup, update only the affected root when possible:

```js
await $ae.mount(changedElement);
```

The browser validation suite includes a repeatable [Bootstrap](https://getbootstrap.com/) CSS coexistence scenario. [Bootstrap](https://getbootstrap.com/) JavaScript components remain outside the validated scope.

## Validation Scope

The `tests/browser/bootstrap-integration.html` scenario loads the versioned local fixture `tests/fixtures/bootstrap-5.3.8.min.css` before aellux.js. It verifies the fixture integrity, confirms [Bootstrap](https://getbootstrap.com/) button styles are applied, exercises declarative lazy Extension loading, and checks that Preference mounts without removing [Bootstrap](https://getbootstrap.com/) classes. The test rejects external requests, so it runs without CDN or network access.

The proven scope is CSS and namespace coexistence with [Bootstrap](https://getbootstrap.com/) 5.3.8 for the markup exercised by that scenario. [Bootstrap](https://getbootstrap.com/) JavaScript components, dynamically revealed [Bootstrap](https://getbootstrap.com/) content, plugin events and listener coexistence are not covered by this result.
