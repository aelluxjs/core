# Viewport Extension

Viewport is an **Experimental** official Extension that publishes an element's position and geometric visible area relative to its nearest native scroll container. It works with ordinary HTML/CSS, independently of Scrollbox, Snap and Present. It never changes scroll, presentation, focus or DOM structure.

```html
<div style="height:400px;overflow:auto">
  <article data-ae-viewport>Content A</article>
  <article data-ae-viewport>Content B</article>
</div>
```

## Loading

Basic and Full automatically register `[data-ae-viewport]` for lazy loading. Full does not bundle the implementation. Without matching mounted markup there is no Viewport download, initialization, observer or scroll listener. No stylesheet, extra dependency or global polyfill is required. Modern and Legacy scripts are distributed separately, including minified variants.

```js
$ae.init({ mode: "basic" }); // mode: "full" also supports Viewport
// After inserting new markup:
await $ae.mount(document.getElementById("new-content"));
```

## Axes and outputs

Only `data-ae-viewport` configures the Extension:

| Value | Position outputs |
| --- | --- |
| Empty or `both` | `--ae-viewport-x` and `--ae-viewport-y` |
| `x` | `--ae-viewport-x` |
| `y` | `--ae-viewport-y` |

Invalid values report the standard configuration warning and fall back to `both`. Changing the attribute reconfigures mounted elements. An unselected axis retains its original inline declaration; switching axes restores that declaration and its priority.

Each selected position is calculated as:

```js
normalized = (elementCenter - viewportCenter) * 2 / viewportSize;
normalized = Math.max(-2, Math.min(2, normalized));
```

`0` aligns the element's center with the viewport center. On X, `-1` is the left edge and `1` the right edge; on Y, `-1` is the top edge and `1` the bottom edge. These are physical directions, including in RTL layouts. Values clamp at `-2` and `2`. The reference is the inner scrollport, excluding borders and scrollbars.

`--ae-viewport-visible` is always published, regardless of the selected position axes. It is the intersection area divided by the element's area, between `0` and `1`. A half-visible element yields `0.5`; an element twice the viewport's width and height can reach only `0.25`. It measures both dimensions, including when the position setting is `x` or `y`.

This is rectangular geometry, not CSS opacity or effective visibility. It does not account for occlusion by other elements, rounded clipping, masks, or clipping by other ancestors outside the chosen reference. A viewport or element without measurable dimensions publishes neutral `0` values until measurable again.

All three properties are registered as numbers with initial value `0` and `inherits: false`. Values are still written inline when `CSS.registerProperty` is unavailable.

## Choosing the reference and keeping it current

The nearest ancestor with computed `overflow-x` or `overflow-y` of `auto` or `scroll` is the reference for **both** axes. `hidden` also qualifies when the corresponding axis has programmatic scroll capacity. `clip` does not qualify. Viewport inspects native CSS, without looking for `data-ae-scrollbox`.

Without a suitable ancestor it uses the document viewport and document scrolling. Nested scroll containers use the nearest one, and moving an observed element into another container refreshes its reference.

Scroll updates positions even while visible area remains constant. Window resize, container/element resize, relevant DOM and style changes, loaded resources and `AelluxJsLayout` notifications also refresh geometry. A Layout notification with finite positive `detail.durationMs` requests checks for the duration of that transition. Idle elements do not run a continuous frame loop.

Elements sharing a reference share one scroll listener, an IntersectionObserver when supported, and a scheduled batch of reads followed by writes. A shared ResizeObserver tracks element, ancestor and sibling size changes that can shift layout. Only changed output values are written. Mutation, load, scroll, resize and Layout notifications provide fallbacks where ResizeObserver or IntersectionObserver is unavailable; in those environments a purely CSS-driven size change without any notification needs an explicit `$ae.mountManager.update(element, "viewport")` or Layout event.

## Scrollbox Snap and migration

Snap continues to own navigation, native snap behavior, gestures, settling, change events and `--ae-snap-focus`, the proximity to the requested alignment. It does not require Viewport or add Viewport attributes automatically.

```html
<div data-ae-scrollbox data-ae-scrollbox-snap
  style="display:flex;width:400px;overflow:auto">
  <article data-ae-snap-item data-ae-viewport="x"
    style="flex:none;width:400px">First</article>
  <article data-ae-snap-item data-ae-viewport="x"
    style="flex:none;width:400px">Second</article>
</div>
```

The old `--ae-snap-viewport` property has been removed from Snap and its semantic catalog. Migration:

```text
Before: --ae-snap-viewport
After:  add data-ae-viewport="x" or "y" to the item
        use --ae-viewport-x or --ae-viewport-y
```

The new reference is the nearest native scroll container, which can differ from the owning Snap box when another scroll container intervenes. Choose the relevant axis explicitly; Snap's axis does not configure Viewport. Alignment proximity remains `--ae-snap-focus` and is independent of the item's center position.

## Transforms and Present

Viewport reads bounding rectangles and compensates for ancestor axis-aligned scale when measuring scrollport borders and dimensions. Rotation, skew and perspective use rectangular bounds and are approximations, not polygon intersections.

A transform applied to the observed element changes its measured rectangle. Driving that transform from the same element's Viewport outputs can cause geometric feedback. Observe a structural wrapper and apply effects to a child. Because the registered outputs do not inherit, opt the child into inheritance explicitly:

```html
<article data-ae-viewport>
  <div class="animated-content">Content</div>
</article>
```

```css
.animated-content {
  --ae-viewport-x: inherit;
  --ae-viewport-y: inherit;
  transform: translateX(calc(12px * var(--ae-viewport-x)));
}
```

Without CSS property registration, custom properties follow native inheritance behavior; explicitly inheriting the child values works in either environment.

An element can declare both `data-ae-viewport` and `data-ae-present="opacity transform"`. Present continues to own presentation and transitions. Viewport does not drive `pop()`/`unpop()` progress, add animation settings or execute animations. Prefer separate structural and visual elements when transforms are involved.

## Lifecycle

Use the normal mount, update, unmount and destroy APIs, including subtree mounting. Viewport saves prior inline output values and priorities through `persist.element.save()`. Unmount removes the element from observation, invalidates its pending writes and restores those values. The last element leaving a reference releases the group's listener, observer, timer and scheduler tasks. Removing mounted elements uses mountManager's detached cleanup. Destroy releases all Extension resources; remounting creates fresh observation without duplicate listeners.
