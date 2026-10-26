# Anchor Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

`data-ae-anchor` positions an element against a target using pairs of pivots. The target is named by `data-ae-anchor-target`; when that attribute is absent or empty, the target is the anchored element's `offsetParent` (its absolute-positioning reference). Anchor is included in the `full` runtime. In Basic, register it explicitly with `$ae.ext("anchor", { loadStyle: true })` before initialization. Add `loadWhen: "[data-ae-anchor]"` for lazy loading.

```html
<div style="position: relative">
  <button id="trigger">Open</button>
  <div data-ae-anchor-target="trigger"
       data-ae-anchor="bottom-left:top-left, top-left:bottom-left">
    Menu content
  </div>
</div>
```

Each comma-separated candidate has the form `target-pivot:self-pivot`. The example first places the menu's top-left corner at the trigger's bottom-left corner. If that placement does not fit in the viewport, Anchor tries the second pair. The available pivots are `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, and `bottom-right`. If no candidate fits, Anchor uses the first valid pair.

To place an element against its positioning parent, omit `data-ae-anchor-target` or leave it empty:

```html
<div style="position: relative; width: 20rem; height: 12rem">
  <div data-ae-anchor="bottom-right:bottom-right">Bottom-right</div>
</div>
```

The anchored element and an explicit target must share the same `offsetParent`. The target may also be that `offsetParent` itself. This is the positioning reference, which need not be the immediate DOM parent. If an explicit target is missing or the pivot list has no valid pair, Anchor leaves the element inactive. If the positioning references differ, Anchor reports `ERROR_ANCHOR_REFERENCE_CONTEXT` and leaves the element inactive.

Anchor uses the external `aellux.ext.anchor.css`, requested with `{ loadStyle: true }` in Basic or included in the shared Full stylesheet. Before the first valid calculation, this weak CSS keeps the element hidden and applies `contain: layout paint`. Once calculated, the `ae--anchored` class makes it visible and applies absolute positioning at `top: 0; left: 0` with `translate3d()`. Anchor publishes `--ae-anchor-x`, `--ae-anchor-y`, `--ae-anchor-origin-x`, and `--ae-anchor-origin-y` as inline CSS properties. If the target is inside a `data-ae-present` element, Anchor also copies that element's computed opacity to `--anchor-opacity`; otherwise it writes `1`. The weak CSS uses `opacity: var(--anchor-opacity, 1)` for mounted anchors, and application CSS can override the opacity. Add a `transform` transition in your own CSS if you want animated movement. On unmount, Anchor removes its class and restores the previous inline values and priorities.

Anchor updates after captured scroll events, including native Scrollbox scrolling, window resize, observed size changes, intersection changes when `IntersectionObserver` is available, or a bubbling `AelluxJsLayout` event received by the shared positioning parent. There is no Anchor-specific FPS attribute or fixed default throttle. Use the shared `data-ae-maxfps` attribute when an anchored element needs an explicit ceiling; otherwise the global adaptive `waitLayout` cadence applies. Anchor observes the anchored element, target, and positioning reference; it does not normally poll their positions. Present emits `AelluxJsLayout` when a Pop or Unpop transition starts, with `detail.origin` set to `"present.pop"` or `"present.unpop"` and `detail.durationMs` set to the transition time. Anchor then checks the position throughout that duration at the eligible scheduler cadence. A zero duration schedules one deferred check. Other code that changes layout without triggering those observers can dispatch the event from a descendant of the positioning parent:

```js
$ae.dispatchFrom(document.getElementById("menu"), "Layout", {
  detail: { origin: "app.openPanel", durationMs: 300 },
  bubbles: true
});
```

Changes to the target, pivot and matching attributes are observed automatically. To await an explicit placement update:

```js
const anchor = document.getElementById("menu");
anchor.setAttribute("data-ae-anchor-target", "new-trigger");
await $ae.mountManager.update(anchor, "anchor");
```

Anchor reads geometry through `$ae.waitLayout.read()` and writes CSS through `$ae.waitLayout.update()`.

## Overflow Marquee

Single-line overflow animation is provided by the separate [Overflow Marquee](overflow-marquee.md) Extension. It initializes Anchor as its geometry dependency, then owns its own mount map, stylesheet and visibility-aware motion. Register `$ae.ext("overflow-marquee")`; an ordinary Anchor registration does not mount those elements.

## Target Visibility

Anchor uses computed CSS to decide whether its target is visible. A `hidden` attribute or an inline declaration does not suppress anchoring when the cascade overrides it. For example, a Present container with `hidden` remains an eligible target if its effective display, visibility and opacity make it visible.

Computed `visibility:hidden` or `collapse` on the target deactivates the Anchor. A descendant may restore inherited visibility with `visibility:visible`. Effective `display:none`, `content-visibility:hidden` or zero opacity on the target or any ancestor also deactivates the Anchor; descendants cannot override an ancestor's zero opacity or absent display. The same checks apply to a selected Present Group member, including during transitions. These checks concern CSS visibility rather than viewport intersection or occlusion by another element.

## Dimension Matching

`data-ae-anchor-match="width"`, `"height"` or `"width height"` applies the target's corresponding dimensions through weak CSS. Without the attribute, Anchor retains its original sizing behavior. Empty values and unknown tokens report `WARN_ANCHOR_MATCH` (2022); recognized tokens still work.

```html
<div style="position:relative">
  <button id="menu-trigger">Open menu</button>
  <div data-ae-anchor="bottom-right:top-right"
       data-ae-anchor-target="menu-trigger"
       data-ae-anchor-match="width">Menu content</div>
</div>
```

Every valid placement publishes `--ae-anchor-target-width` and `--ae-anchor-target-height`, even when matching is disabled. Their pixel values describe the target's bounding rectangle in the positioning reference's coordinate system, compensating for the reference's axis-aligned scale. Target transforms contribute to that bounding rectangle. Arbitrary rotation or skew of the shared positioning reference is outside this coordinate model.

```css
.menu-decoration {
  max-width: var(--ae-anchor-target-width);
}
/* Application declarations override the zero-specificity matching rules. */
.menu { width: 20rem; max-height: 15rem; }
```

The matching rules use `box-sizing: border-box`; application CSS may override that too. Anchor projects the matching dimensions while evaluating viewport candidates, then writes dimensions and position together. The matching transform uses a percentage self-pivot, so the actual CSS box remains aligned without positioning against its previous width or height. Normal width/height declarations, padding, borders and size constraints remain the browser's responsibility. Applications overriding `transform` also take responsibility for the resulting positioning. When Anchor and Present share an element, Anchor takes priority over Present transform motion. Present retains opacity and size motion and leaves Anchor transform out of its transitions. Development validation reports `WARN_PRESENT_ANCHOR_TRANSFORM` (`2031`) when Present also requests transform (including `all`); animate a child for an independent visual transform.

ResizeObserver and existing Layout events keep intermediate target dimensions updated. A known-duration `AelluxJsLayout` event also works without ResizeObserver. There is no permanent geometry polling: finite layout tracking ends after its announced duration. The global adaptive scheduler and `data-ae-maxfps` limit geometry measurements and updates. As with existing Anchor tracking, a measured position can lag a moving target by the eligible read/update cadence; a low FPS ceiling trades tracking frequency for less work.

Anchor's zero-specificity rules are supplied by its external stylesheet in Basic or the shared Full stylesheet. Independent loading needs `{ loadStyle: true }` or application-supplied equivalent CSS. Unmount restores prior inline geometry values and priorities. Destruction removes an individually loaded stylesheet; the shared Full stylesheet remains.

Application inline `position`, `left`, `top`, `transform` and `transform-origin` declarations remain intact while mounted. They override the weak positioning rules; overriding transform or offsets makes the application responsible for the resulting placement. Matching still publishes the target's dimensions without writing application width or height. The shared DOM observer filters unrelated mutations before scheduling geometry work; association scans run only when group/Anchor declarations or their DOM membership can change. Stable interfaces have no permanent geometry polling.

Anchor's external stylesheet, or the shared Full stylesheet, must be allowed by the application's CSP. Blocking that CSS disables its default visibility, positioning, matching and switching rules; initialization alone does not prove those rules were applied. See [CSP and trust](../extensions/csp-and-trust.md).

## Target Switching Motion

Configure deliberate changes of the effective target separately from normal tracking:

```css
.selection-anchor {
  --ae-anchor-switch-duration: 250ms;
  --ae-anchor-switch-ease: ease-in-out;
}
```

The default duration is `0ms`. CSS easing values such as `linear`, `ease`, `cubic-bezier(...)` and `steps(...)` are supported. Initial placement does not animate. A different valid target adds the internal `ae--anchor-switching` class, and native CSS transitions interpolate transform, width and height with one duration and easing. Matching dimensions therefore animate along with the target change. An equivalent target spelling, such as `panel` versus `#panel`, does not restart motion. Rapid replacements use native retargeting from the current visual position.

Scroll or window resize interrupts the temporary transition and immediately applies the next eligible placement. A geometry change of the current target also interrupts switching to prioritize tracking; opacity-only changes do not. CSS transitions supplied independently by application styles remain under application control. Hidden or removed targets deactivate the Anchor, and reduced motion disables switching. Unmount cancels pending placement and transition cleanup.

Switch interpolation deliberately uses native CSS rather than taking ownership through CSS Motion Controller. This preserves native retargeting and keeps ordinary tracking independent of a paused motion timeline. Geometry still follows WaitLayout's adaptive FPS and `data-ae-maxfps`; the native visual transition runs at the browser's cadence. `cssMotionPropertyMaxFPS` and advanced `$ae.ease()` curves do not control Anchor switching. The finite cleanup timer only removes the temporary state; it does not calculate animation progress.

## Present Group Anchor

When `data-ae-anchor-target` resolves to an element with `data-ae-present-group`, Anchor automatically uses that group's accepted selected member as its effective target. The reference accepts the usual ID, optionally prefixed with `#`, or a CSS selector. Each Anchor declares its own target, so multiple Anchors can follow the same group from inside or outside it. Present owns the accepted selection and publishes its changes; Anchor queries the optional public Present interface. Neither Extension imports the other's implementation.

```html
<div id="views" data-ae-present-group data-ae-present-active="first"
     style="position:relative;min-height:12rem">
  <section id="first" data-ae-present="opacity"
           style="width:12rem">First content</section>
  <section id="second" data-ae-present="opacity"
           style="width:18rem" hidden>Second content</section>
  <div id="indicator" class="selection-anchor"
       data-ae-anchor-target="views"
       data-ae-anchor="bottom-left:bottom-left" data-ae-anchor-match="width height"
       style="--ae-anchor-switch-duration:250ms;--ae-anchor-switch-ease:ease-in-out;
              opacity:1;pointer-events:none;background:color-mix(in srgb,Highlight 15%,transparent)"></div>
  <div data-ae-anchor-target="#views" data-ae-anchor="top-right:bottom-right">
    Selection label
  </div>
</div>
<button type="button" data-ae-trigger="pop" data-ae-target="second">Second view</button>
```

Or select with `await $ae("views").present.show("second")`. Attribute changes, class selection and triggers all use the same accepted selection. The associated Anchor resolves the target as soon as that selection is confirmed and positions against it once its computed CSS passes the visibility checks; it does not wait for Pop completion. A canceled BeforePop/BeforeUnpop does not publish a new selection. The normal Present opacity-copying behavior remains; the example overrides opacity to keep its decorative marker opaque while the target fades in, once the target's opacity is greater than zero.

Target resolution is:

1. Resolve the explicit `data-ae-anchor-target` ID or selector.
2. If that element is a Present Group, use its mounted selection; otherwise use the element itself.
3. With no explicit target, use the Anchor's positioning reference itself, even if that reference is also a group.

An explicit group target with no selection, or whose Present controller has not mounted yet, leaves the Anchor inactive. It does not fall back to the group's box or search for a visible member. Changing `data-ae-anchor-target` can switch between groups and ordinary elements; removing it restores the positioning-reference default. Present does not rewrite the attribute. Late loading, remount and dynamically inserted members use the existing selection; Anchor does not scan member IDs or maintain another selection registry. Each Anchor must share the selected member's positioning reference, including when it sits inside the group. Independent matching, pivots, switching durations and FPS limits remain local to each Anchor.

`WARN_ANCHOR_GROUP` (2023) reports circular target chains and matching configurations involving an in-flow Anchor, with the Anchor's `data-ae-anchor-target` in its context. Multiple Anchors targeting one group are supported. Invalid member selection is diagnosed by Present (2021). Incompatible positioning references retain `ERROR_ANCHOR_REFERENCE_CONTEXT` (1119). Dimension matching requires an out-of-flow Anchor; application CSS that places a matched Anchor back in normal flow can create a size dependency and is rejected before matching begins.

## Delivery B distribution cost

The following historical measurements describe Delivery B, before CSS was moved out of the Extension JavaScript into external stylesheets. They include matching geometry, native switching, association observation, validation and the then-owned weak stylesheet. Values are bytes; gzip uses level 9.

| Artifact | Before raw / gzip | Delivery B raw / gzip | Approved limit raw / gzip |
| --- | ---: | ---: | ---: |
| `aellux.ext.anchor.min.js` | 8,913 / 3,296 | 13,959 / 5,070 | 15 / 6 KiB |
| `aellux.ext.anchor.legacy.min.js` | 15,241 / 5,600 | 21,339 / 7,525 | 23 / 8 KiB |

The compressed increases are 1,774 and 1,925 bytes respectively. No dependency or animation scheduler is added. The new weak rules ship with Anchor rather than enlarging the boot's weak stylesheet. Boot, Full and Present remain within their existing limits.

The limits remain 15/6 KiB for Modern and 23/8 KiB for Legacy (raw/gzip), increased from 9/4 and 16/6 KiB respectively. The separate [Overflow Marquee](overflow-marquee.md#distribution-cost) distribution has its own measured limits; Anchor does not include that implementation.

## Placement maps for dependent Extensions

`$ae.ext.anchor.createPlacementMap()` creates an independently owned set of placements. Wait for Anchor initialization before calling it. The map exposes `mount(element)`, `measure(element, pairs, target = element.parentElement)`, `place(element, placement)`, `unmount(element)`, `invisible(element)` and `destroy()`. Pivot strings use the same `target:self` syntax as declarative Anchors. An invalid or unmounted measurement returns `null`; check `placement.valid` before using its geometry. `invisible()` checks computed CSS, without viewport intersection.

The consumer owns its mount selector, wrapping, positioning CSS, observers and timing. The map saves the owned styles and class on mount and restores them on unmount or destruction. Use `waitLayout.read()` for measurement and `waitLayout.update()` for placement. Elements in this map need no `data-ae-anchor` and do not install ordinary Anchor tracking. Overflow Marquee uses this API for its generated wrappers. Destroying Anchor disposes any remaining placement maps.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Reference | Known Limit | <span style="white-space: normal !important;">Anchor and explicit target must share an offsetParent, or the target must be that reference. Missing, effectively hidden or invalid targets leave placement inactive.</span> | <span style="white-space: normal !important;">Use a shared positioning context and follow Target Visibility.</span> |
| Boundaries | Known Limit | <span style="white-space: normal !important;">Candidate fitting uses the window rectangle and falls back to the first valid pair when none fits. It does not combine all ancestor clipping regions or move content into the top layer.</span> | <span style="white-space: normal !important;">Choose a containing context that permits the desired overlay; inspect ancestor overflow.</span> |
| Transforms | Known Limit | <span style="white-space: normal !important;">Geometry compensates for axis-aligned reference scale. Rotating or skewing the shared reference is outside this model; application transform/offset overrides control final placement.</span> | <span style="white-space: normal !important;">Keep measurement contexts simple and apply decorative transforms to a child.</span> |
| Matching | Known Limit | <span style="white-space: normal !important;">Dimension matching requires an out-of-flow Anchor. Present yields transform ownership to Anchor on a shared element.</span> | <span style="white-space: normal !important;">Use absolute positioning for matching and separate visual motion from placement.</span> |
| Tracking | Potential Risk | <span style="white-space: normal !important;">Unannounced position-only CSS motion may escape observation; scheduled placement can trail a moving target. Many active anchors add geometry work.</span> | <span style="white-space: normal !important;">Announce bounded Layout motion or await an explicit update; profile the chosen FPS ceiling.</span> |
| Coverage | Validation Gap | <span style="white-space: normal !important;">Fixtures exercise matching, switching, nested scroll and Present integration; physical mobile visual-viewport changes and arbitrary 3D contexts are not established by them.</span> | <span style="white-space: normal !important;">Validate mobile overlays and precision-sensitive transforms directly.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.anchor.js), [anchor.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/anchor.spec.mjs), [anchor-enhancements.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/anchor-enhancements.spec.mjs), [present-anchor-integration.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/present-anchor-integration.spec.mjs).
