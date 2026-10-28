# Adaptive Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

`adaptive` adds size and shape classes to elements marked with `data-ae-adaptive`. It is included in the `full` runtime and its CSS is supplied by the shared Full stylesheet. In Basic, register it explicitly with `$ae.ext("adaptive", { loadStyle: true })` before initialization. Add `loadWhen: "[data-ae-adaptive]"` for lazy loading.

```html
<div id="responsive" data-ae-adaptive>Responsive content</div>
```

The Extension measures each marked element with `ResizeObserver`, or uses the window resize event when that API is unavailable. With `ResizeObserver`, the first observer entry supplies the initial size; otherwise the initial size is read in the next layout frame. It applies one shape class (`ae--shape-vertical`, `ae--shape-square`, or `ae--shape-horizontal`) according to width divided by height. It also sets `aria-orientation` to `vertical` when height exceeds width and to `horizontal` otherwise, including square elements. It toggles `ae--fits-<size>` classes when `sqrt(width * height)` reaches each configured minimum. The element receives inline `--ae-width` and `--ae-height` values as unitless numbers in pixels. After an update it dispatches `AelluxJsAdaptiveUpdate` from the element. Initial `ae--*` classes are discarded before mounting. Unmounting removes the managed classes and restores the initial `aria-orientation`, `--ae-width`, and `--ae-height` values and priorities; unrelated classes and inline styles are left as they are.

`AelluxJsAdaptiveUpdate` includes the measured dimensions in `detail`, so listeners can use them without reading layout again:

```js
document.getElementById("responsive").addEventListener("AelluxJsAdaptiveUpdate", event => {
  const { width, height, ratio } = event.detail;
  console.log(width, height, ratio);
});
```

## Accessibility profile

- **Capabilities:** visual and adaptive; infrastructure.
- **Owned state:** the `ae--shape-*` and `ae--fits-*` classes and `aria-orientation`.
- **Consumer responsibility:** CSS using those classes must preserve content, readable reflow, zoom support and sufficient contrast.
- **Not applicable:** the Extension creates no controls and manages no focus or motion.

## Configuration

Pass `adaptiveParams` through the Extension options. Each supplied group is merged with its defaults during initialization. The resulting parameters are read-only after initialization:

```js
$ae.init({
  mode: "full",
  extensions: {
    adaptive: {
      adaptiveParams: {
        minSizes: { medium: 800 },
        ratioShapes: { vertical: 0.8, horizontal: 1.25 }
      }
    }
  }
});
```

The default size thresholds are `compact: 0`, `small: 480`, `medium: 768`, `large: 1024`, `xl: 1280`, and `xxl: 1600`. The default shape thresholds are `vertical: 0.8` and `horizontal: 1.25`. `adaptiveParams.experienceScale` also contains `near: 1` and `far: 1.5`, but the current class calculation does not use those values.

Parameter groups must be objects. Minimum sizes must be finite nonnegative numbers; ratio and experience boundaries must be finite positive numbers, with the lower boundary less than the upper boundary. Invalid values record `2026` and retain defaults; reversed boundaries restore the default pair. Standard size names with thresholds out of ascending order also record `2026`, while preserving the configured thresholds. Custom size names remain supported.

The generated `aellux.ext.adaptive.css` supplies state-based utility classes. Load it when using those utilities outside the `full` runtime.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Geometry | Known Limit | <span class="large">ResizeObserver supplies content-box sizes; the fallback reads bounding rectangles, including borders and transforms. Hidden or zero-sized content has no useful responsive dimensions.</span> | <span class="large">Use measurable structural elements and verify the box model for the active observation path.</span> |
| Refresh | Known Limit | <span class="large">Without ResizeObserver, initial mounting and window resize trigger measurements. Element-only CSS changes have no dedicated observer or mounted update handler.</span> | <span class="large">Trigger the window resize fallback after undetected size changes; mountManager.update() does not measure Adaptive.</span> |
| Configuration | Known Limit | <span class="large">Parameters freeze at initialization. Fit classes use sqrt(width * height); experienceScale is currently unused. Invalid values follow the Configuration fallbacks.</span> | <span class="large">Configure thresholds before initialization and use the documented area-based metric.</span> |
| Layout feedback | Potential Risk | <span class="large">Styles consuming shape/fit classes can change the observed size and repeatedly cross thresholds. Many changing targets increase callback and layout work.</span> | <span class="large">Avoid size rules that toggle their own threshold and profile responsive workloads.</span> |
| Coverage | Validation Gap | <span class="large">Existing cases check resizing, the window fallback, configuration and restoration; they do not establish every hidden/revealed, zoom or transformed-box combination.</span> | <span class="large">Validate those combinations before depending on exact threshold transitions.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.adaptive.js), [adaptive.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/adaptive.spec.mjs).
