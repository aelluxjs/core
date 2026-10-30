# Preference Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

`preference` stores user choices, combines them with defaults, and reflects the result in document attributes. It is included in the `full` runtime. In Basic, register it explicitly with `$ae.ext("preference")` before initialization. Add `loadWhen: "[data-ae-preference]"` to activate it through markup, or `load: false` to defer loading until `await $ae.wait("preference")` after runtime initialization.

## Accessibility profile

- **Capabilities:** interaction and input; structure and state; visual preference policy; storage and media-query integration.
- **Owned state:** computed preference values, root preference attributes, option active classes, value-label visibility and associated input values or checked state. With `syncBootstrapThemeTag: true`, also owns the root `data-bs-theme` attribute until destruction.
- **Consumer responsibility:** use native keyboard-operable controls with accessible names and provide meaningful text for every value label.
- **Limitation:** generic elements marked as options, next or previous controls do not receive button semantics or keyboard behavior automatically.

```js
const preference = await $ae.wait("preference");
preference.set("colorScheme", "dark");
preference.update();
console.log(preference.get("colorScheme"));
```

`set(name, value)` saves the user value in the `AelluxJsPreferences` persistence store. Call `update()` to recompute and publish the current values; `set()` does not call `update()` automatically. Changes from the browser `storage` event are updated automatically. `update()` synchronizes mounted controls for preferences whose computed values changed and always dispatches `AelluxJsPreferencesChange`, including when the values stay the same. Newly mounted controls are synchronized immediately.

For application styles and Extensions, prefer the resolved attributes on `<html>` over direct device media queries. The boot reads persisted choices and device preferences to set these attributes, and Preference updates them when the choice or device setting changes. An explicit local choice such as `no-preference` can override a device request for reduced motion. Use the same attributes in examples and future integrations:

```css
html[data-ae-reduced-motion="reduced"] .animated-panel {
  animation: none;
  transition: none;
}
```

In JavaScript, check `$ae.currentPreference("reduced-motion") === "reduced"` before starting optional motion. The method reads the resolved value from `<html>` and returns `null` when no value is published. The same approach applies to other resolved preferences, such as `contrast` and `forced-colors`. Device media queries remain an input to AelluxJs preference resolution.

`AelluxJsPreferencesChange` carries a changed-key array and a copy of the current values. The array is empty when an update finds no changed values:

```js
$ae.on("PreferencesChange", event => {
  const { changed, preferences } = event.detail;
  if (changed.includes("colorScheme")) console.log(preferences.colorScheme);
});
```

## Bootstrap color mode

Set the initialization option `extensions.preference.syncBootstrapThemeTag` to `true` to synchronize Bootstrap's root color-mode attribute with the resolved AelluxJS color scheme:

```js
$ae.init({
  mode: "full",
  extensions: {
    preference: { syncBootstrapThemeTag: true }
  }
});
```

In Basic mode, register Preference explicitly with `$ae.ext("preference")` before calling `$ae.init()` with the same `extensions.preference` options and `mode: "basic"`.

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `syncBootstrapThemeTag` | boolean | `false` | When `true`, writes `data-bs-theme="light"` or `data-bs-theme="dark"` on `<html>` during Preference updates. |

Synchronization starts when Preference initializes and occurs before `PreferencesChange` dispatch. Persisted choices, declared controls, programmatic `set()` followed by `update()`, device changes in `auto` mode, and storage events all use the same update path. `auto` publishes the resolved `light` or `dark` value; an unresolved color scheme falls back to `light`. `set()` alone still only saves the choice.

When the option is omitted or `false`, Preference leaves `data-bs-theme` untouched. When enabled, destroying Preference restores the attribute's previous value, or removes it if it was originally absent. This option only writes the root attribute; it does not load Bootstrap CSS or JavaScript, change nested Bootstrap color-mode overrides, or synchronize the attribute during boot before Preference loads. Load Bootstrap 5.3 CSS separately to apply its color modes.

## Preference controls

An element marked with `data-ae-preference` is a clickable preference container. Descendants with `data-ae-option` set a value for that preference and receive the `ae--active` class when selected.

```html
<div data-ae-preference="colorScheme">
  <button type="button" data-ae-option="light">Light</button>
  <button type="button" data-ae-option="dark">Dark</button>
</div>
```

The Extension also recognizes `data-ae-label`, `data-ae-next`, and `data-ae-prev`. A descendant marked with `data-ae-label="<value>"` is visible when its value matches the container's current computed preference and receives `hidden` while another value is selected. This allows each option to have its own markup instead of copying content into a shared label. More than one label may declare the same value, and numeric values are matched by their string representation.

`data-ae-next` and `data-ae-prev` cycle through the built-in values for the container preference and wrap at either end. Preference names may use camelCase or kebab-case. If the current value is not recognized, next selects the first built-in value and previous selects the last.

```html
<div data-ae-preference="color-scheme">
  <button type="button" data-ae-prev>Previous</button>
  <span data-ae-label="auto">Use system setting</span>
  <span data-ae-label="light" hidden>Light theme</span>
  <span data-ae-label="dark" hidden>Dark theme</span>
  <button type="button" data-ae-next>Next</button>
</div>
```

The cycling order is the order listed in the defaults below. Values loaded from persistence are matched by their string representation, so numeric preferences such as text scale continue from the persisted value.

Defaults currently cover color scheme, contrast, reduced motion, reduced transparency, forced colors, text scale, interface scale, extended timing, large targets, haptics, and sound. User values are loaded from persistence when the Extension initializes.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Publication | Known Limit | <span class="large">set() saves the choice without publishing it; update() reflects values and emits PreferencesChange, including an empty changed list.</span> | <span class="large">Call update() after programmatic set() and inspect changed before expensive subscriber work.</span> |
| System choices | Known Limit | <span class="large">Explicit local values can override device preferences; auto uses available media queries. Reflected attributes do not supply theme styles, sound or haptics. Bootstrap root synchronization is opt-in and begins at Preference initialization.</span> | <span class="large">Consume resolved HTML attributes/currentPreference() and provide application presentation; load Bootstrap CSS separately when using syncBootstrapThemeTag.</span> |
| Persistence | Potential Risk | <span class="large">Storage is origin/browser-profile state, without account or cross-device synchronization. Storage events update other contexts, but concurrent writers have no conflict-resolution protocol.</span> | <span class="large">Coordinate writers and handle access/quota failures using the Core persistence contract.</span> |
| Controls | Known Limit | <span class="large">Generic option/next/previous elements do not acquire native keyboard behavior or control roles. Built-in cycling follows the documented value lists.</span> | <span class="large">Use named native buttons or inputs and synchronize additional frontend state.</span> |
| Coverage | Validation Gap | <span class="large">Resolved preferences and controls have browser checks; long-running concurrent tabs and later storage quota/access revocation need targeted validation.</span> | <span class="large">Test deployment storage restrictions and required cross-tab flows.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.preference.js), [current-preference.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/current-preference.spec.mjs), [scenarios.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scenarios.spec.mjs).
