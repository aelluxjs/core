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

## Viewport Events

Viewport dispatches three bubbling, composed, noncancelable events from each observed element through `$ae.dispatchFrom()`. Subscribe on that element or delegate on `document` using `$ae.eventName()`:

```js
document.addEventListener($ae.eventName("ViewportChange"), event => {
  const { x1, y1, x2, y2, visible, state, measurable } = event.detail;
  if (!measurable) return;
  console.log(event.target, x1, y1, x2, y2, visible, state);
});

element.addEventListener($ae.eventName("ViewportFullyInside"), event => {
  console.log("Fully contained", event.detail.initial);
});
element.addEventListener($ae.eventName("ViewportFullyOutside"), event => {
  console.log("No positive-area intersection", event.detail.previous);
});
```

| Event | Publication rule |
| --- | --- |
| `ViewportChange` | <span style="white-space: normal !important;">The primary notification: first measurable geometry, then relevant changes in relative position, relative dimensions, visible fraction, geometric state, measurability or reference identity. A scroll notification alone does not force an event.</span> |
| `ViewportFullyInside` | <span style="white-space: normal !important;">Entry into `inside`, including the first measurable publication when already contained. Movement while remaining inside does not repeat it.</span> |
| `ViewportFullyOutside` | <span style="white-space: normal !important;">Entry into `outside`, including the first measurable publication when already outside. Movement while remaining outside does not repeat it. Unmount, destroy, declaration removal and loss of measurable geometry do not produce this event.</span> |

All three share this payload shape:

```js
{
  viewport: document, // Or the native scroll container element.
  x1: -0.5, y1: -0.5, x2: 0.5, y2: 0.5,
  x: 0, y: 0, visible: 1,
  state: "inside", measurable: true,
  previous: null,
  initial: true
}
```

`viewport` identifies the actual reference: a scroll container element, or `document` for the document viewport. `previous` is an independent snapshot of the last published geometry, with the same geometric fields but without another `previous` or `initial`. It is `null` on the first publication. `initial` is `true` only for the first measurable publication after mount. Event payloads and their `previous` objects are copies: changing one does not modify the internal snapshot or another event's payload. The referenced DOM objects retain their identity.

Coordinates use physical directions even in RTL: the reference's top-left is `(-1, -1)`, its center is `(0, 0)`, and its bottom-right is `(1, 1)`. The four edges are calculated from the same rectangles as the existing CSS outputs:

```js
x1 = (elementRect.left - viewportCenterX) * 2 / viewportWidth;
y1 = (elementRect.top - viewportCenterY) * 2 / viewportHeight;
x2 = (elementRect.right - viewportCenterX) * 2 / viewportWidth;
y2 = (elementRect.bottom - viewportCenterY) * 2 / viewportHeight;
x = (x1 + x2) / 2;
y = (y1 + y2) / 2;
```

**Event coordinates are not clamped.** Distant elements can have coordinates beyond `-2` or `2`. The CSS outputs `--ae-viewport-x` and `--ae-viewport-y` retain their `[-2, 2]` clamp. Events always include both axes and all four edges, even with `data-ae-viewport="x"` or `"y"`; axis selection continues to control only CSS position publication. `visible` uses the existing two-dimensional area fraction.

| State | Geometry |
| --- | --- |
| `inside` | <span style="white-space: normal !important;">Every edge lies within the reference bounds, including exact coincidence. A larger element cannot be inside.</span> |
| `partial` | <span style="white-space: normal !important;">Intersection has positive area, but at least one edge extends beyond the reference. Oversized overlapping elements are partial.</span> |
| `outside` | <span style="white-space: normal !important;">Intersection has no positive area. Touching a reference edge without overlapping area is outside.</span> |

Zero-sized, hidden or non-finite element/reference geometry is unmeasurable. Selected CSS positions and visible area keep publishing neutral `0`, while the event snapshot uses `x1`, `y1`, `x2`, `y2`, `x`, `y` and `state` as `null`, `visible: 0`, and `measurable: false`. Unknown initial geometry stays silent until the first valid publication, which has `previous: null` and `initial: true`. After a valid publication, losing measurability emits only `ViewportChange`; repeated unchanged unknown geometry stays silent. Recovery emits Change and, when appropriate, the matching FullyInside/FullyOutside event, with `initial: false`.

Notifications share the existing `waitLayout.read()`/`update()` batches. Numeric differences must exceed an absolute tolerance of `0.000001` in normalized coordinates or visible fraction, compared with the last published snapshot. State, measurability and reference identity changes bypass that tolerance, as does an element edge crossing or reaching either reference boundary. This includes oversized elements that remain `partial` while crossing an edge. Containment and positive-area intersection use exact measured bounds, so even a smaller boundary crossing is reported. At most one Change is emitted per element in a geometry update; no independent event timer, observation system or additional rectangle measurement is introduced.

For each publication, CSS outputs are applied first, then the internal snapshot advances, then `ViewportChange` fires, followed by the matching state transition event. Unmount/destroy requests during Change suppress the subsequent state event, including during an initial asynchronous mount; a canceled lifecycle preflight retains the state event. These are asynchronous scheduler notifications and can trail compositor scrolling or animation. They do not guarantee frame-by-frame synchronization or perceptual visibility, and Viewport continues to leave animation, focus, scroll and presentation decisions to consumers.

### Event delivery cost

Measured raw/gzip level 9 bytes, compared with the implementation before these events:

| Viewport artifact | Before | After | Delta |
| --- | --- | --- | --- |
| Modern | 13,974 / 3,749 | 18,641 / 4,906 | +4,667 / +1,157 |
| Modern minified | 6,672 / 2,851 | 8,876 / 3,693 | +2,204 / +842 |
| Legacy | 25,775 / 6,758 | 32,441 / 8,273 | +6,666 / +1,515 |
| Legacy minified | 11,883 / 4,860 | 15,084 / 5,959 | +3,201 / +1,099 |

Only Viewport's four artifact budgets increase: Modern raw/gzip limits become 18.5/5 KiB (regular) and 9/3.75 KiB (minified); Legacy becomes 32/8.25 KiB and 15/6 KiB. Full and Orchestrator delivery sizes remain unchanged because Viewport stays Experimental, external and lazy. The boot's embedded signed metadata changes, with the same minified raw/gzip size of 47,129/16,046 bytes. Global budgets remain unchanged.

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

## Known Limits & Risks

See [Core Known Limits & Risks](../../runtime/known-limits-and-risks.md) for the shared architecture and classification convention. **Known Limit** means a confirmed implementation or contract restriction. **Potential Risk** describes an outcome that may occur under the stated conditions, without identifying a confirmed defect. **Validation Gap** means the available tests do not establish reliability for that scenario. **Known Issue** is reserved for a reproducible defect. Viewport remains Experimental; evaluate these boundaries before depending on its geometry for interactions or animations. The [implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.viewport.js) and the linked spec below provide the evidence for this section.

### Known Limits

All entries below are **Known Limits**. See [Axes and outputs](#axes-and-outputs), [Choosing the reference and keeping it current](#choosing-the-reference-and-keeping-it-current), and [Transforms and Present](#transforms-and-present) for formulas and examples.

| Limit | Contract and impact |
| --- | --- |
| L1: Geometric visibility | <span style="white-space: normal !important;">`--ae-viewport-visible` measures rectangular intersection, without evaluating occlusion, opacity, masks, complex clipping, effective content visibility or blocked interaction. A value greater than `0` does not guarantee that the user can see or interact with the element.</span> |
| L2: Nearest reference only | <span style="white-space: normal !important;">The nearest qualifying native scroll container supplies both axes. Clipping regions from all ancestors are not combined: an element fully inside its immediate reference may still be clipped by an outer container.</span> |
| L3: Axis-aligned bounds | <span style="white-space: normal !important;">Measurements use `getBoundingClientRect()`. Scrollport calculations compensate for axis-aligned scale; rotation, skew, perspective and other 3D transforms remain rectangular approximations, without polygon intersection accuracy.</span> |
| L4: Clamped CSS positions | <span style="white-space: normal !important;">`--ae-viewport-x` and `--ae-viewport-y` clamp to `[-2, 2]`. Distant elements can publish identical CSS values beyond those bounds. Viewport event coordinates remain unclamped; both describe relative rectangular geometry.</span> |
| L5: Oversized elements | <span style="white-space: normal !important;">Visible area is divided by the element's total rectangular area, rather than the viewport's area. An element larger than its reference may never reach `--ae-viewport-visible: 1`.</span> |
| L6: Unmeasurable geometry | <span style="white-space: normal !important;">Zero-sized or non-finite element/reference geometry publishes neutral `0` for selected CSS positions and visible area. Event coordinates/state are `null` with `measurable: false`; unknown initial geometry stays silent. Neutral CSS positions do not prove center alignment or outside state; unselected axes retain their authored declarations.</span> |
| L7: Physical coordinates | <span style="white-space: normal !important;">Negative X means left and positive X means right; negative Y means above and positive Y means below. RTL writing direction does not reverse these signs.</span> |
| L8: Observation only | <span style="white-space: normal !important;">Viewport publishes geometry without controlling scroll, animation, `pop()`/`unpop()`, `hidden`, opacity, transforms or interaction state. Present and other consumers require explicit integration.</span> |
| L9: Notification precision and cadence | <span style="white-space: normal !important;">`ViewportChange`, `ViewportFullyInside` and `ViewportFullyOutside` describe processed scheduler samples. Numeric changes use a normalized `0.000001` tolerance; state and reference-edge crossings bypass it. Intermediate geometry between processed samples can be missed. Events are asynchronous and are not synchronized frame by frame with the compositor. The shared `Layout` event remains a refresh input.</span> |

### Performance Risks

These are **Potential Risks**, not measured performance regressions or numerical capacity limits.

| Risk | Conditions | Potential impact |
| --- | --- | --- |
| Large observation sets | <span style="white-space: normal !important;">Hundreds or thousands of mounted elements.</span> | <span style="white-space: normal !important;">More geometry processing and retained observation state.</span> |
| Frequent scrolling | <span style="white-space: normal !important;">Continuous touch, pointer or programmatic scrolling.</span> | <span style="white-space: normal !important;">Frequent geometry recalculation for the affected reference.</span> |
| Complex DOM hierarchy | <span style="white-space: normal !important;">Deep nesting and many sibling elements.</span> | <span style="white-space: normal !important;">More ancestor traversal, target collection and size observation.</span> |
| Frequent layout changes | <span style="white-space: normal !important;">Dynamic content, resizing and announced layout transitions.</span> | <span style="white-space: normal !important;">Repeated scheduling and measurement.</span> |
| Large observed documents | <span style="white-space: normal !important;">Frequent DOM, text, class or relevant attribute/style changes across the document.</span> | <span style="white-space: normal !important;">Additional mutation processing and refreshes across reference groups.</span> |

`measure()` walks each mounted element's ancestors and collects their children as size targets. `observeSizes()` shares one ResizeObserver and reference-counts targets, but also retains each element's target set. Large overlapping hierarchies can therefore increase memory and notification work even when individual targets share an observer. `viewportRect()` computes reference geometry once per group measurement; each mounted element still needs its own bounding rectangle.

While elements are mounted, MutationObserver watches the document subtree for child, text and selected attribute changes. Viewport filters out style notifications matching its own last publication, but unrelated application changes can still schedule all groups. Dynamic rendering, long lists and repeated class/style updates can amplify this work.

The [shared scheduler](../../runtime/wait-layout.md) batches reads and writes, and unchanged outputs are not rewritten. This reduces redundant work without eliminating measurements or guaranteeing constant cost as the document grows. There is no continuous idle animation loop; continuous scroll and layout notifications can still request frequent updates. A finite positive `Layout` duration requests repeated checks only for that interval. Enable `data-ae-viewport` selectively and profile representative workloads. [Bundle budgets](../../runtime/performance.md#scope-and-limitations) measure delivery size, not runtime speed or memory use.

### Behavioral Risks

The following are **Potential Risks** with implementation-based conditions, rather than confirmed browser defects.

**R1: Geometric feedback.** Using an observed element's own outputs to drive its transform changes the rectangle measured on later updates. This can produce oscillation, visual instability or recurring updates; timing may vary across engines. Observe a stable structural wrapper and animate a descendant instead. The [wrapper and child example](#transforms-and-present) also shows the explicit inheritance required when CSS properties are registered.

**R2: Delayed geometry.** Outputs describe the last processed scheduler cycle, which can temporarily trail rapid scrolling or animation in the compositor. Scheduler throttling and hidden-page suspension also affect publication timing. Do not treat the values as a guarantee of frame-perfect synchronization; see [waitLayout](../../runtime/wait-layout.md).

**R3: Changes without notifications.** CSS-only position or transform changes may produce neither size changes nor relevant mutation/intersection notifications. Detection depends on the available APIs and triggers; not every geometric change is automatically observed. After an otherwise undetected change, request publication explicitly:

```js
await $ae.mountManager.update(element, "viewport");
```

For an application-controlled transition, a bubbling `Layout` notification can announce a finite tracking interval:

```js
$ae.dispatchFrom(element, "Layout", { detail: { durationMs: 250 } });
```

Use the transition's expected duration; this requests scheduled checks rather than compositor synchronization. See [Events](../../runtime/events.md) for the shared event contract.

**R4: Changing scroll containers.** Reparenting or changing CSS overflow can change the selected reference. Relevant updates rediscover the nearest container and transfer the element to its group, but previously published values can remain until the new group's publication. Await an explicit update when subsequent application work depends on the new reference.

**R5: Present and hidden content.** When Present applies `hidden` and removes measurable geometry, neutral outputs are expected. They are not an instruction to start another transition. Observe a stable wrapper when a child's presentation can change, and keep presentation decisions under the application's or Present's control.

**R6: Concurrent CSS writers.** Viewport saves inline output values and priorities at mount, writes selected outputs when its calculated values change, and restores the saved snapshot on unmount or axis deactivation. External writes to the same properties are not merged into that snapshot and are not guaranteed to survive later publication or restoration. Coordinate ownership or use separate application properties. See [Lifecycle](#lifecycle).

### Compatibility & Validation Gaps

**Browser API fallbacks (Known Limits).** These APIs are feature-detected rather than all being mandatory for Viewport:

| Unavailable API | Remaining behavior and boundary |
| --- | --- |
| `ResizeObserver` | <span style="white-space: normal !important;">Scroll, window resize, load, mutations and Layout notifications still schedule updates. Size changes without another notification need an explicit refresh.</span> |
| `IntersectionObserver` | <span style="white-space: normal !important;">Rectangle calculations and scroll updates continue; intersection callbacks no longer provide an additional refresh trigger. IntersectionObserver does not supply the published visible fraction.</span> |
| `MutationObserver` | <span style="white-space: normal !important;">The Extension's document mutation trigger is absent. Remaining notifications and explicit mount/update calls must cover application changes; automatic discovery of every DOM/style change is not guaranteed.</span> |
| `CSS.registerProperty` | <span style="white-space: normal !important;">Outputs are still written inline, but unregistered custom properties use native inheritance rather than registered `inherits: false` behavior. Descendant styles must account for this difference.</span> |

Update coverage and freshness depend on the available triggers. Legacy syntax and shared polyfills do not establish support for every historical browser. Forced Legacy execution in current engines is distinct from testing old browsers directly; see [Browser support](../../runtime/browser-support.md#legacy-scope).

**Coverage boundaries (Validation Gaps).** The existing [Viewport spec](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/viewport.spec.mjs) defines Modern and forced Legacy cases for the desktop engine matrix. Its presence establishes the scope of automated checks, not a new test-run result. See [Validation scenarios](../../validation-scenarios.md#core-contract-regression-matrix) for the broader contract matrix.

| Area | Existing checks | Additional validation needed |
| --- | --- | --- |
| Mobile viewport | <span style="white-space: normal !important;">Document viewport and window resize cases in desktop engines.</span> | <span style="white-space: normal !important;">Real iOS Safari and Android Chrome, virtual keyboards, browser UI changes, orientation and pinch zoom. The document reference uses document client dimensions with window fallbacks; it does not track VisualViewport offsets, scale or events. Full visual viewport behavior remains unvalidated.</span> |
| Fractional geometry | <span style="white-space: normal !important;">Fractional element/scrollport dimensions, borders and axis-aligned CSS scales.</span> | <span style="white-space: normal !important;">Browser zoom, high device pixel ratios and platform scrollbar variations require application-specific checks; existing fixtures do not establish every combination.</span> |
| Nested and dynamic layouts | <span style="white-space: normal !important;">Nearest nested reference, overflow changes, reparenting and explicit updates after group transfer.</span> | <span style="white-space: normal !important;">Sticky/fixed positioning, complex ancestor transforms and advanced layouts with multiple scrolling axes need dedicated checks beyond these fixtures.</span> |
| Observer fallbacks | <span style="white-space: normal !important;">Cases disable ResizeObserver, IntersectionObserver and CSS registration together, then check publication, scroll, style changes and restoration.</span> | <span style="white-space: normal !important;">The Viewport spec does not disable MutationObserver; its absence and additional API combinations require separate validation.</span> |
| Feedback and load | <span style="white-space: normal !important;">Idle scheduling and a child-transform case with non-inheriting registered outputs.</span> | <span style="white-space: normal !important;">That child case does not validate self-driven transforms or a child explicitly inheriting changing outputs. Large observation sets and mutation-heavy workloads need reproducible runtime benchmarks.</span> |

These gaps identify where evidence is incomplete; they do not establish defects in a particular browser.

### Recommended Practices

1. Enable Viewport only on elements that need geometric information; profile before mounting hundreds or thousands of elements.
2. Use stable structural wrappers as references and apply visual transforms to descendants, following the [explicit inheritance example](#transforms-and-present).
3. Treat `--ae-viewport-visible` as an area fraction, without inferring perceptual visibility or interaction availability.
4. Use normalized positions for bounded relative effects; obtain absolute coordinates separately when needed.
5. Allow for scheduled publication delays instead of assuming frame-perfect synchronization.
6. Await explicit updates after otherwise undetected layout changes or reference changes that subsequent work depends on; use bounded Layout notifications for known transitions.
7. Coordinate writes to the three output properties and allow lifecycle restoration to restore the original inline snapshot.
8. Validate mobile behavior on real devices, plus the zoom, transforms, scrolling axes and API fallbacks relevant to the application.
9. Account for Viewport's Experimental status when choosing production dependencies and recheck its contract when upgrading.
