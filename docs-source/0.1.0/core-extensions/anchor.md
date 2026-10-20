# Anchor Extension

`data-ae-anchor` positions an element against a target using pairs of pivots. The target is named by `data-ae-anchor-target`; when that attribute is absent or empty, the target is the anchored element's `offsetParent` (its absolute-positioning reference). Anchor is included in the `full` runtime. In `basic` mode, register it with `$ae.ext("anchor")`.

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

Before the first valid calculation, the boot's weak CSS keeps the element hidden and applies `contain: layout paint`. Once calculated, the `ae--anchored` class makes it visible and applies absolute positioning at `top: 0; left: 0` with `translate3d()`. Anchor publishes `--ae-anchor-x`, `--ae-anchor-y`, `--ae-anchor-origin-x`, and `--ae-anchor-origin-y` as inline CSS properties. If the target is inside a `data-ae-present` element, Anchor also copies that element's computed opacity to `--anchor-opacity`; otherwise it writes `1`. The weak CSS uses `opacity: var(--anchor-opacity, 1)` for mounted anchors, and application CSS can override the opacity. Add a `transform` transition in your own CSS if you want animated movement. On unmount, Anchor removes its class and restores the previous inline values and priorities.

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

The matching rules use `box-sizing: border-box`; application CSS may override that too. Anchor projects the matching dimensions while evaluating viewport candidates, then writes dimensions and position together. The matching transform uses a percentage self-pivot, so the actual CSS box remains aligned without positioning against its previous width or height. Normal width/height declarations, padding, borders and size constraints remain the browser's responsibility. Applications overriding `transform` also take responsibility for the resulting positioning.

ResizeObserver and existing Layout events keep intermediate target dimensions updated. A known-duration `AelluxJsLayout` event also works without ResizeObserver. There is no permanent geometry polling: finite layout tracking ends after its announced duration. The global adaptive scheduler and `data-ae-maxfps` limit geometry measurements and updates. As with existing Anchor tracking, a measured position can lag a moving target by the eligible read/update cadence; a low FPS ceiling trades tracking frequency for less work.

Anchor installs one owned, zero-specificity stylesheet when the Extension initializes. Independent loading still needs only `$ae.ext("anchor")`; no additional stylesheet request is required. Unmount restores previous inline geometry values and priorities. Destruction removes the Extension's additional stylesheet. The boot's original Anchor visibility and positioning rules remain available independently.

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

`data-ae-present-group-anchor` names one Anchor by ID, with or without `#`. Present owns the accepted selection and publishes its changes; Anchor resolves the selected element through the optional public Present interface. Neither Extension imports the other's implementation.

```html
<div id="views" data-ae-present-group data-ae-present-active="first"
     data-ae-present-group-anchor="indicator"
     style="position:relative;min-height:12rem">
  <section id="first" data-ae-present="opacity" data-ae-present-key="first"
           style="width:12rem">First content</section>
  <section id="second" data-ae-present="opacity" data-ae-present-key="second"
           style="width:18rem" hidden>Second content</section>
  <div id="indicator" class="selection-anchor"
       data-ae-anchor="bottom-left:bottom-left" data-ae-anchor-match="width height"
       style="--ae-anchor-switch-duration:250ms;--ae-anchor-switch-ease:ease-in-out;
              opacity:1;pointer-events:none;background:color-mix(in srgb,Highlight 15%,transparent)"></div>
</div>
<button type="button" data-ae-trigger="pop" data-ae-target="second">Second view</button>
```

Or select with `await $ae("views").present.show("second")`. Attribute changes, class selection and triggers all use the same accepted selection. The associated Anchor changes target as soon as that selection is confirmed and the member is available for presentation, including during Pop preparation; it does not wait for Pop completion. A canceled BeforePop/BeforeUnpop does not publish a new selection. The normal Present opacity-copying behavior remains; the example overrides opacity to keep its decorative marker visible throughout opening.

Target precedence is:

1. A declared, valid Present Group association uses that group's mounted selection.
2. Without an association, `data-ae-anchor-target` applies.
3. Without either, the positioning reference remains the target.

An associated group with no selection, or whose Present controller has not mounted yet, leaves the Anchor inactive. Removing the association restores normal target resolution. Present does not rewrite `data-ae-anchor-target`. Late loading, remount and dynamically inserted members use the existing selection; Anchor does not scan keys or maintain another selection registry. An Anchor may sit outside the group if it shares the selected member's positioning reference.

`WARN_ANCHOR_GROUP` (2023) reports missing/non-Anchor association IDs, multiple groups controlling one Anchor, circular target chains and matching configurations involving an in-flow Anchor. Conflicting and circular targets remain inactive. Invalid member selection is diagnosed by Present (2021). Incompatible positioning references retain `ERROR_ANCHOR_REFERENCE_CONTEXT` (1119). Dimension matching requires an out-of-flow Anchor; application CSS that places a matched Anchor back in normal flow can create a size dependency and is rejected before matching begins.

## Delivery B distribution cost

The matching geometry, native switching lifecycle, shared association observer, validation and owned weak stylesheet add the following standalone distribution cost. Values are bytes; gzip uses level 9.

| Artifact | Before raw / gzip | Delivery B raw / gzip | Approved limit raw / gzip |
| --- | ---: | ---: | ---: |
| `aellux.ext.anchor.min.js` | 8,913 / 3,296 | 13,959 / 5,070 | 15 / 6 KiB |
| `aellux.ext.anchor.legacy.min.js` | 15,241 / 5,600 | 21,339 / 7,525 | 23 / 8 KiB |

The compressed increases are 1,774 and 1,925 bytes respectively. No dependency or animation scheduler is added. The new weak rules ship with Anchor rather than enlarging the boot's weak stylesheet. Boot, Full and Present remain within their existing limits.

The approved limits are 15/6 KiB for Modern and 23/8 KiB for Legacy (raw/gzip), increased from 9/4 and 16/6 KiB respectively. These limits cover the Delivery B output with modest room for maintenance, and both Anchor artifacts pass `test:budget`.
