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

Before the first valid calculation, the boot's weak CSS keeps the element hidden and applies `contain: layout paint`. Once calculated, the `ae--anchored` class makes it visible and applies absolute positioning at `top: 0; left: 0` with `translate3d()`. Anchor publishes `--ae-anchor-x`, `--ae-anchor-y`, `--ae-anchor-origin-x`, and `--ae-anchor-origin-y` as inline CSS properties. Add a `transform` transition in your own CSS if you want animated movement. On unmount, Anchor removes its class and restores the previous inline values and priorities.

Anchor updates after captured scroll events, window resize, or observed size changes, with a 100 ms throttle. It reads geometry through `$ae.waitLayout.read()` and writes CSS through `$ae.waitLayout.update()`. After changing the target or pivot attributes, call `$ae.mountManager.update(element, "anchor")` to recalculate immediately.
