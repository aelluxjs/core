# Preference Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

`preference` stores user choices, combines them with defaults, and reflects the result in document attributes. It is included in the `full` runtime. In Basic, register it explicitly with `$ae.ext("preference")` before initialization. Add `loadWhen: "[data-ae-preference]"` to activate it through markup, or `load: false` to defer loading until `await $ae.wait("preference")` after runtime initialization.

## Accessibility profile

- **Capabilities:** interaction and input; structure and state; visual preference policy; storage and media-query integration.
- **Owned state:** computed preference values, root preference attributes, option active classes, option-button `aria-pressed`, value-label visibility and associated input values or checked state. Bootstrap's root `data-bs-theme` belongs to the boot preference publisher.
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

Set the top-level boot initialization option `syncBootstrapThemeTag` to `true` to synchronize Bootstrap's root color-mode attribute with the resolved AelluxJS color scheme:

```js
$ae.init({
  mode: "full",
  syncBootstrapThemeTag: true
});
```

The boot publishes the initial theme synchronously inside `$ae.init()`, before downloading or mounting the runtime and Extensions. This works in Basic without registering Preference. Register `$ae.ext("preference")` when using preference controls and its automatic storage/device updates.

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `syncBootstrapThemeTag` | boolean | `false` | Top-level boot option. When `true`, writes `data-bs-theme="light"` or `data-bs-theme="dark"` on `<html>` when the boot preference publisher runs. |

Initial synchronization reads persisted/device preferences. Later calls to the public `$ae.updatePreferenceAttributesHTML()` publisher also synchronize the attribute, including the ordinary publication performed by Preference before `PreferencesChange`. Declared controls, programmatic `set()` followed by `update()`, device changes in `auto` mode, and storage events retain their existing Preference update path. `auto` publishes the resolved `light` or `dark` value; an unresolved color scheme falls back to `light`. `set()` alone still only saves the choice.

When the option is omitted or `false`, the boot publisher leaves `data-bs-theme` untouched. Destroying or unmounting Preference does not restore or remove this boot-owned attribute. Without Preference, call the publisher explicitly to reflect later saved/device changes. This option does not load Bootstrap CSS or JavaScript or change nested Bootstrap color-mode overrides. Load Bootstrap 5.3 CSS separately to apply its color modes.

Migration: replace the previous `extensions.preference.syncBootstrapThemeTag` setting with the top-level `syncBootstrapThemeTag`. Theme synchronization is no longer an Extension initialization option.

## Preference controls

An element marked with `data-ae-preference` is a clickable preference container. Descendants with `data-ae-option` set a value for that preference and receive the `ae--active` class when selected. Option values and current values are compared as strings, including numeric preferences such as text scale.

Options with button semantics also receive `aria-pressed="true"` or `"false"`, synchronized on mount and preference changes before `PreferencesChange`. This covers native buttons, button/submit/reset inputs and elements explicitly authored with `role="button"`. The shared ARIA helper preserves the original attribute and restores it when the option is released or its container unmounts. Labels, radio/checkbox inputs, generic elements and controls with other explicit roles do not acquire pressed semantics. Preference does not add roles or keyboard support; associated inputs continue using their existing value/checked synchronization. Next/previous controls do not represent a selected option and do not receive `aria-pressed` automatically.

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
| System choices | Known Limit | <span class="large">Explicit local values can override device preferences; auto uses available media queries. Reflected attributes do not supply theme styles, sound or haptics. Bootstrap root synchronization belongs to the boot publisher and is opt-in.</span> | <span class="large">Consume resolved HTML attributes/currentPreference() and provide application presentation; load Bootstrap CSS separately when using the top-level syncBootstrapThemeTag option.</span> |
| Persistence | Potential Risk | <span class="large">Storage is origin/browser-profile state, without account or cross-device synchronization. Storage events update other contexts, but concurrent writers have no conflict-resolution protocol.</span> | <span class="large">Coordinate writers and handle access/quota failures using the Core persistence contract.</span> |
| Controls | Known Limit | <span class="large">Generic option/next/previous elements do not acquire native keyboard behavior or control roles. Built-in cycling follows the documented value lists.</span> | <span class="large">Use named native buttons or inputs and synchronize additional frontend state.</span> |
| Coverage | Validation Gap | <span class="large">Resolved preferences and controls have browser checks; long-running concurrent tabs and later storage quota/access revocation need targeted validation.</span> | <span class="large">Test deployment storage restrictions and required cross-tab flows.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.preference.js), [current-preference.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/current-preference.spec.mjs), [scenarios.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scenarios.spec.mjs).
