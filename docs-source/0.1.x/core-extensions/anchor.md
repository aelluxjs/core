# Anchor Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

Stability describes implementation maturity and validation, not API compatibility. Only the [minimal initialization and declarative activation/mounting contract](../runtime/compatibility-commitment.md) is protected during `0.1.x`.

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

Anchor updates after captured scroll events, including native Scrollbox scrolling, window resize, observed size changes, intersection changes when `IntersectionObserver` is available, or a bubbling `AelluxJsLayout` event received by the shared positioning parent. There is no Anchor-specific FPS attribute or fixed default throttle. Use the shared `data-ae-maxfps` attribute when an anchored element needs an explicit ceiling; otherwise the global adaptive `waitLayout` cadence applies. Anchor observes the anchored element, target, and positioning reference; it does not normally poll their positions. Present emits `AelluxJsLayout` when a Pop or Dismiss transition starts, with `detail.origin` set to `"present.pop"` or `"present.dismiss"` and `detail.durationMs` set to the transition time. Anchor then checks the position throughout that duration at the eligible scheduler cadence. A zero duration schedules one deferred check. Other code that changes layout without triggering those observers can dispatch the event from a descendant of the positioning parent:

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

Single-line overflow animation is provided by the separate [Overflow Marquee](optional/overflow-marquee.md) Extension. It initializes Anchor as its geometry dependency, then owns its own mount map, stylesheet and visibility-aware motion. Register `$ae.ext("overflow-marquee")`; an ordinary Anchor registration does not mount those elements.

## Target Visibility

Anchor uses computed CSS to decide whether its target is visible. A `hidden` attribute or an inline declaration does not suppress anchoring when the cascade overrides it. For example, a Present container with `hidden` remains an eligible target if its effective display, visibility and opacity make it visible.

Computed `visibility:hidden` or `collapse` on the target deactivates the Anchor. A descendant may restore inherited visibility with `visibility:visible`. Effective `display:none`, `content-visibility:hidden` or zero opacity on the target or any ancestor also deactivates the Anchor; descendants cannot override an ancestor's zero opacity or absent display. The same checks apply to a selected Present Group member, including during transitions. These checks concern CSS visibility rather than viewport intersection or occlusion by another element.

## Scroll Into View

Set `data-ae-anchor-scroll-into-view="center center"` to scroll the effective target into view when the Anchor first becomes visible, reappears after being hidden, or changes its effective target (including a Present Group selection):

```html
<div data-ae-anchor="top-left:top-left" data-ae-anchor-target="selected-item"
     data-ae-anchor-match="width height"
     data-ae-anchor-scroll-into-view="center center"></div>
```

The two whitespace-separated values map to native `scrollIntoView({ block, inline })`, in that order. Each accepts `start`, `center`, `end` or `nearest`. Missing, empty or invalid values disable this behavior. Attribute changes are observed automatically and affect subsequent visibility or target changes.

On an effective target change, Anchor establishes the new target-switch operation and requests the new target's `scrollIntoView()` once. The same timeline continues while scrolling moves its destination; it does not wait for scrolling to finish. Anchor does not scroll again on completion and never calls `scrollIntoView()` on the Anchor itself. Initial placement and reappearance check visibility after the internal hidden rule is released, then scroll the target. Scrolling is smooth, or instant when the current reduced-motion preference is `reduced`. Visibility means effective CSS visibility, including the Anchor and its ancestors; being outside the viewport does not suppress the request. Ordinary tracking, resize and scroll events, equivalent target spellings and repeated placement updates do not request scrolling again. Native `scrollIntoView` can scroll multiple containing scroll areas, including the document, and honors CSS scroll margins and padding. This option does not move focus.

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

Every valid placement publishes `--ae-anchor-target-width` and `--ae-anchor-target-height`, even when matching is disabled. Outside target switching, their pixel values describe the target's bounding rectangle in the positioning reference's coordinate system, compensating for the reference's axis-aligned scale. During switching they publish the interpolated matching inputs; the measured destination is retained separately. Target transforms contribute to that bounding rectangle. Arbitrary rotation or skew of the shared positioning reference is outside this coordinate model.

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

The default duration is `0ms`. Initial placement does not animate. A different valid target adds the internal `ae--anchor-switching` class and captures the currently rendered placement as a fixed origin in the positioning reference's coordinates. The operation retains its start time, duration and CSS easing; changes to those CSS configuration values apply to the next target change. Reduced Motion remains an immediate exception. An equivalent target spelling, such as `panel` versus `#panel`, does not start another operation. A genuine target replacement captures the last rendered frame and starts a new timeline with the configured duration, including during scrolling.

During target-switch transitions, Anchor continuously updates the destination geometry without restarting the animation timeline. Scroll and layout changes may move the destination while duration, easing, and progress remain uninterrupted. This includes document and containing-element scrolling, Scrollbox, wheel, touch, scrollbar, programmatic scrolling and automatic `scrollIntoView()`. Window resize and geometry changes of the same effective target also update the existing destination. Independent scroll regions do not schedule placement work for that Anchor.

Anchor publishes interpolated position, pivots, origins and matching inputs together through `waitLayout`. Every frame uses elapsed time from the original start, a fixed origin and the most recently measured destination. It does not use the preceding frame as a new origin. Coordinates compensate for reference scale and scroll offsets; native scrolling moves the containing content independently, without a second scroll compensation. Weak CSS applies the interpolated inputs, so authored sizing constraints and overrides still control the actual box.

At the first eligible update at or beyond the original deadline, Anchor publishes its latest destination and removes `ae--anchor-switching`. Scrolling may continue afterward: ordinary placement tracking stays directly aligned without starting another transition. No `scrollend` listener or scroll-settling timer is needed. A target change between measurement and publication discards the older measurement, and queued frames from replaced or unmounted operations cannot publish an old target. Hidden, removed or invalid targets retain their existing deactivation behavior; reduced motion places directly.

Geometry measurement and temporal publication may run at different eligible cadences. Both reuse WaitLayout's adaptive scheduling and `data-ae-maxfps`; matching width or height also applies the shared `cssMotionPropertyMaxFPS` ceiling (55 FPS by default). Progress depends on elapsed time, so a lower update rate does not lengthen the configured duration. The finite progress sequence ends on completion or teardown; there is no permanent animation polling.

Anchor owns numeric geometry interpolation rather than changing the endpoints of a native CSS Transition. This keeps the same behavior when `cssMotionController` is `false` or Web Animations APIs are unavailable, without changing the public [CSS Motion](../runtime/css-motion.md) API. `--ae-anchor-switch-ease` accepts CSS keywords, `cubic-bezier(...)`, `steps(...)` including jump variants, and piecewise `linear(...)`; overshoot and step boundaries are retained. Aellux easing family names are not interpreted as CSS easing values.

During a switch, Anchor temporarily excludes transform, transform-origin, matching dimensions and its geometry variables from authored transition lists, including `transition: all` and logical size aliases. Unrelated transitions retain their existing timing, delays and easing. Completion and teardown restore the authored transition declarations and priorities. Direct tracking suppresses competing transitions only for the bounded geometry publication when required. Existing unrelated Web Animations are not captured or canceled. Unmount/destroy cancels pending reads, publications and progress tasks and restores original inline geometry.

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

Or select with `await $ae("views").present.show("second")`. Attribute changes, class selection and triggers all use the same accepted selection. The associated Anchor resolves the target as soon as that selection is confirmed and positions against it once its computed CSS passes the visibility checks; it does not wait for Pop completion. A canceled BeforePop/BeforeDismiss does not publish a new selection. The normal Present opacity-copying behavior remains; the example overrides opacity to keep its decorative marker opaque while the target fades in, once the target's opacity is greater than zero.

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

The limits remain 15/6 KiB for Modern and 23/8 KiB for Legacy (raw/gzip), increased from 9/4 and 16/6 KiB respectively. The separate [Overflow Marquee](optional/overflow-marquee.md#distribution-cost) distribution has its own measured limits; Anchor does not include that implementation.

### Scroll Into View distribution cost

The declarative Scroll Into View option adds visibility tracking, target-scroll requests and authoring attribute recognition without another dependency or permanent polling. Compared with the build before this option, minified Modern Anchor grows from 13,863 / 5,098 to 14,909 / 5,408 bytes (raw / gzip level 9); Legacy grows from 21,303 / 7,535 to 22,524 / 7,889 bytes. Both retain their existing Extension budgets.

Full Modern grows from 199,901 / 61,728 to 200,971 / 62,020 bytes, and Full Legacy from 524,208 / 155,421 to 525,445 / 155,796 bytes. Full Modern budgets move from 195.5 / 60.5 to 196.5 / 60.75 KiB, and Full Legacy's gzip budget from 152 to 152.25 KiB (raw remains 515 KiB).

### Controlled switching cost

CSS Motion integration, rendered-frame handoff and scheduled completion change the minified artifacts as follows. Values are bytes; gzip uses level 9.

| Artifact | Previous raw / gzip | Current raw / gzip | Delta raw / gzip |
| --- | ---: | ---: | ---: |
| Anchor Modern | 14,909 / 5,408 | 16,058 / 5,767 | +1,149 / +359 |
| Anchor Legacy | 22,524 / 7,889 | 23,905 / 8,296 | +1,381 / +407 |
| Full Modern | 214,121 / 65,963 | 215,270 / 66,267 | +1,149 / +304 |
| Full Legacy | 544,068 / 160,470 | 545,453 / 160,895 | +1,385 / +425 |

Anchor Modern's raw budget moves from 15 to 16 KiB (gzip stays 6 KiB); Anchor Legacy moves from 23 / 8 to 23.5 / 8.25 KiB. Full Modern moves from 209.5 / 64.75 to 210.5 / 65 KiB, and Full Legacy from 531.75 / 157 to 533 / 157.5 KiB.

### Dynamic destination cost

Dynamic destination switching replaces the earlier scroll-completion policy. It removes active-scroll/scrollend tracking and adds a finite numeric interpolation sequence, fixed-origin handoff and CSS easing evaluation, including steps and piecewise linear curves without Web Animations. The existing transition-list preservation remains. No dependency or public CSS Motion API is added. Measurements compare against the immediately preceding local scroll-completion implementation on `release/0.1.0`; values are bytes with gzip level 9.

| Minified artifact | Before raw / gzip | After raw / gzip | Delta raw / gzip |
| --- | ---: | ---: | ---: |
| Anchor Modern | 18,751 / 6,667 | 21,368 / 7,740 | +2,617 / +1,073 |
| Anchor Legacy | 26,936 / 9,266 | 30,698 / 10,571 | +3,762 / +1,305 |
| Full Modern | 232,349 / 72,395 | 234,881 / 73,521 | +2,532 / +1,126 |
| Full Legacy | 572,106 / 168,865 | 575,895 / 170,045 | +3,789 / +1,180 |
| Anchor CSS | 1,239 / 479 | 904 / 381 | -335 / -98 |
| Full CSS | 125,159 / 11,925 | 124,824 / 11,862 | -335 / -63 |

Anchor Modern budgets move from 18.5 / 6.625 to 21 / 7.625 KiB (raw / gzip); Legacy moves from 26.5 / 9.125 to 30 / 10.375 KiB. Full Modern moves from 227 / 70.75 to 229.5 / 72 KiB; Full Legacy moves from 559 / 165 to 562.5 / 166.25 KiB. CSS budgets remain unchanged. Boot retains its raw size; signed registry values change with the new JavaScript and stylesheet artifacts.

## Application placement maps and Extension communication

`$ae.ext.anchor.createPlacementMap()` creates an independently owned set of placements. Wait for Anchor initialization before calling it. The map exposes `mount(element)`, `measure(element, pairs, target = element.parentElement)`, `place(element, placement)`, `unmount(element)`, `invisible(element)` and `destroy()`. Pivot strings use the same `target:self` syntax as declarative Anchors. An invalid or unmounted measurement returns `null`; check `placement.valid` before using its geometry. `invisible()` checks computed CSS, without viewport intersection.

The application owns its mount selector, wrapping, positioning CSS, observers and timing. The map saves owned styles and class on mount and restores them on unmount or destruction. Use `waitLayout.read()` for measurement and `waitLayout.update()` for placement. Elements in this map need no `data-ae-anchor` and do not install ordinary Anchor tracking. Extension consumers such as Overflow Marquee request geometry through the data-only `anchor.placement` [communication contract](../runtime/communication.md), without receiving the placement map API. Destroying Anchor disposes all remaining maps.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Reference | Known Limit | <span class="large">Anchor and explicit target must share an offsetParent, or the target must be that reference. Missing, effectively hidden or invalid targets leave placement inactive.</span> | <span class="large">Use a shared positioning context and follow Target Visibility.</span> |
| Boundaries | Known Limit | <span class="large">Candidate fitting uses the window rectangle and falls back to the first valid pair when none fits. It does not combine all ancestor clipping regions or move content into the top layer.</span> | <span class="large">Choose a containing context that permits the desired overlay; inspect ancestor overflow.</span> |
| Transforms | Known Limit | <span class="large">Geometry compensates for axis-aligned reference scale. Rotating or skewing the shared reference is outside this model; application transform/offset overrides control final placement.</span> | <span class="large">Keep measurement contexts simple and apply decorative transforms to a child.</span> |
| Matching | Known Limit | <span class="large">Dimension matching requires an out-of-flow Anchor. Present yields transform ownership to Anchor on a shared element.</span> | <span class="large">Use absolute positioning for matching and separate visual motion from placement.</span> |
| Tracking | Potential Risk | <span class="large">Unannounced position-only CSS motion may escape observation; scheduled placement can trail a moving target. Many active anchors add geometry work.</span> | <span class="large">Announce bounded Layout motion or await an explicit update; profile the chosen FPS ceiling.</span> |
| Coverage | Validation Gap | <span class="large">Fixtures exercise matching, switching, nested scroll and Present integration; physical mobile visual-viewport changes and arbitrary 3D contexts are not established by them.</span> | <span class="large">Validate mobile overlays and precision-sensitive transforms directly.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.anchor.js), [anchor.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/anchor.spec.mjs), [anchor-enhancements.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/anchor-enhancements.spec.mjs), [present-anchor-integration.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/present-anchor-integration.spec.mjs).
