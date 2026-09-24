# Adaptive Extension

The Adaptive Extension observes the size and shape of a container rather than relying only on viewport breakpoints.

```html
<main data-ae-adaptive>
  <section class="p-ux-sm-2 p-ux-lg-4">Adaptive content</section>
</main>
```

## Runtime States

Shape classes:

- `ae--shape-vertical`
- `ae--shape-square`
- `ae--shape-horizontal`

Cumulative size classes:

- `ae--fits-compact`
- `ae--fits-small`
- `ae--fits-medium`
- `ae--fits-large`
- `ae--fits-xl`
- `ae--fits-xxl`

The Extension dispatches `AelluxAdaptiveUpdate` after applying current state.

## Styles

The generated Adaptive stylesheet provides contextual utilities such as spacing, display, flex alignment, positioning, columns, text behavior, and aspect ratio. Utility selectors activate beneath the corresponding Adaptive state class.

```js
$ae.ext("adaptive", {
  loadWhen: "[data-ae-adaptive]",
  loadStyle: true
});
```

The Adaptive Extension owns its breakpoint configuration, and the CSS build reads that same configuration to keep runtime states and generated selectors synchronized.
