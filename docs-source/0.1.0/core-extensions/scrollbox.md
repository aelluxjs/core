# Scrollbox Extension

`data-ae-scrollbox` uses the browser's native scrolling and publishes `--ae-scroll-y-progress` and `--ae-scroll-x-progress` on the scroll container. Each value runs from 0 at the start to 1 at the end of its axis; an axis without overflow reports 0. Native `scroll` events continue to reach ordinary listeners, including Anchor's capture listener. On unmount, Scrollbox restores the previous inline progress values and priorities.

The boot's weak CSS supplies `overflow: auto`, `contain: layout paint`, and thin scrollbars. It gives elastic and snap children `display: inline-block` with `vertical-align: top` so the inline line box adds no scrollable space below. If application CSS sets the wrapper to `block`, `flex`, or `grid`, Scrollbox reports diagnostic 2016 and uses `inline-block`, `inline-flex`, or `inline-grid` respectively. It restores the previous inline `display` when the wrapper changes or unmounts. It also enables smooth programmatic scrolling on all elements; `prefers-reduced-motion: reduce` restores immediate scrolling. Pointer dragging and momentum set each position immediately so they follow the gesture. An application can override the weak styles. Basic Scrollbox works with any content structure and does not load a scrolling library. Elastic edges and snap require a single marked content child.

```html
<div data-ae-scrollbox style="width: 20rem; height: 12rem">
  <div><!-- scrollable content --></div>
</div>
```

## Modes

| Value | Behavior |
| --- | --- |
| `native` | Default, including an empty attribute. Uses browser scrolling and updates the progress properties. |
| `pointer` | Adds mouse or pen drag-to-scroll on a hover-capable device with a fine pointer. Scrolling, wheel input, and progress remain native. On other devices it behaves like `native`. |

```html
<div data-ae-scrollbox="pointer" style="width: 20rem; height: 12rem">
  <div><!-- scrollable content --></div>
</div>
```

Pointer Drag Scroll (PDS) uses the primary mouse button or pen. Once movement reaches 3 px, the larger component of that first movement locks the gesture to the horizontal or vertical axis. PDS keeps working when the pointer moves outside the box. Touch input retains native behavior. PDS does not start on links, buttons, form controls, editable content, or explicitly draggable elements. On open content, PDS prevents the pointer-down default so the browser does not start its own drag or edge scroll. Text and excluded elements keep their native pointer-down behavior. The cursor is `grab` over empty scrollable content, keeps its native appearance over selectable text and excluded elements, and becomes `grabbing` once PDS begins. On desktop, pointer mode cancels cancelable mouse events from the same button while PDS is moving, including when the pointer leaves the box. The matching release and click are canceled too; events from other mouse buttons remain available. A second or later mouse click stops drag tracking and allows native text selection when no drag is underway. The temporary text-selection, scroll-behavior, and cursor styles are restored when PDS ends. Change the mode with `$ae.mountManager.update(element, "scrollbox")` after editing the attribute.

Once PDS begins, Scrollbox adds `ae--pointerscrolling` to the box. The boot's weak CSS applies `cursor: grabbing !important` to the box and its contents until the gesture ends. If its only direct child enables `data-ae-scrollbox-elastic`, that child and its descendants also receive `pointer-events: none !important` during PDS. Scrollbox cancels wheel input over the box during this interval, along with the default action of its `pointermove`, matching-button `mousemove`, `touchmove`, and cancelable drag events. Canceling `dragstart` prevents a native drag from taking over the gesture. Native `scroll` events still reach listeners and report the updated scroll position.

Gestures starting on text wait 100 ms after pointer-down so a native selection can begin. The first qualifying movement still chooses the axis during that wait. A text selection that remains unchanged from pointer-down does not block PDS; a new or altered selection stops tracking and remains intact. A collapsed caret by itself does not count as a text selection. In a vertical-only scroll chain, movement of more than 10 px vertically starts PDS immediately when vertical movement is dominant, and prevents native selection. Otherwise PDS scrolls in the locked axis after the wait, including any movement already made while waiting. PDS only captures an axis whose computed overflow is `auto` or `scroll` and whose content overflows. `hidden`, `clip`, and other non-scrollable overflow values disable PDS on that axis even if its content is larger than the box. A nested gesture can continue on an ancestor that permits the chosen axis.

In nested pointer Scrollboxes, the innermost box consumes movement in the locked axis until it reaches an edge. Any remaining movement goes to the next scrollable ancestor, repeating upward as needed. Reversing direction returns to the innermost box first. Elastic pressure applies only after every eligible box reaches its edge; release momentum applies to the last box that moved.

In `pointer` mode, a quick release continues scrolling with gradually decreasing speed. Momentum is enabled by default and applies only to desktop pointer dragging. It starts after more than 15 px within the latest 300 ms of dragging and uses a deceleration value of 0.0015 to calculate the destination. Each animation frame moves 10% of the remaining distance to that destination; it ends when both axes match to three decimal places. It stops at the scroll boundary, on a new pointer or wheel interaction, when the mode changes, or when the box unmounts. Set `data-ae-scrollbox-momentum="false"` to disable it:

```html
<div data-ae-scrollbox="pointer" data-ae-scrollbox-momentum="false">
  <div>Scrollable content</div>
</div>
```

## Horizontal wheel handoff

On a fine-pointer desktop, a predominantly vertical wheel gesture scrolls a horizontal-only box sideways while it has room in that direction. If one event goes beyond an edge, the box reaches the edge and shows elastic pressure when enabled, while the uncanceled wheel event also scrolls the parent or document. Further wheel events at that edge continue both behaviors. Native horizontal wheel gestures remain native. Only axes with `overflow: auto` or `scroll` count as wheel-scrollable: content taller than a box with `overflow-y: hidden` does not stop the horizontal conversion or produce vertical elastic pressure. This behavior applies to both modes.

With snap enabled, wheel input moves one point forward or backward from the active snap index instead of scrolling by the wheel delta. Horizontal-only boxes still convert a predominantly vertical wheel delta to horizontal when conversion is enabled. Wheel events within a 120 ms gesture window count as one step. The scroll end of this wheel-driven animation does not search for another point. At the first or last point, the wheel event may continue to a scrollable ancestor, and elastic pressure still provides edge feedback when enabled.

Set `data-ae-scrollbox-wheel-horizontal="false"` to disable the vertical-to-horizontal conversion:

```html
<div data-ae-scrollbox data-ae-scrollbox-wheel-horizontal="false">
  <div>Horizontal content</div>
</div>
```

## Elastic edges

Place `data-ae-scrollbox-elastic` on the Scrollbox's only direct child to enable elastic edges in either `native` or `pointer` mode. That child wraps all scrollable content. A marked child alongside another direct child reports diagnostic 1120 and leaves the elastic effect disabled. When pointer dragging, touch dragging, or a wheel gesture pushes past a scroll limit, Scrollbox sets `transform-origin` to the pressed edge and applies `scale(...) translate3d(...)` to the wrapper. On each axis, the scale grows the wrapper's scrollable extent by the same number of pixels as the elastic displacement. Pressure starts with one third of the pointer or wheel movement and slows exponentially as it approaches the configured maximum. At the bottom or right edge, Scrollbox keeps the wrapper's scrollable extent stable while the transform moves its content, including content that overflows the wrapper's own box. On release, each animation frame moves the elastic displacement 15% toward zero; reduced-motion users get an immediate return. The original inline transform, transform origin, and minimum size are restored when the effect ends. Set the child's attribute to `false` to disable the effect.

The attribute value sets the maximum displacement. With no value it defaults to `1/4` of the visible size on each axis. Fractions such as `1/2` use the visible size of their axis; `30px` and `30` both mean 30 pixels. One value applies to both axes. Two values follow CSS shorthand order: vertical, then horizontal. For example, `data-ae-scrollbox-elastic="1/4 40px"` limits vertical pressure to one quarter of the visible height and horizontal pressure to 40 pixels. Invalid values report diagnostic 2015 and use the defaults.

```html
<div data-ae-scrollbox="native" style="width: 20rem; height: 12rem">
  <div data-ae-scrollbox-elastic>Scrollable content</div>
</div>
```

Scrollbox updates measurements after content mutations, box resize, or window resize. Resize updates use a 100 ms throttle.

## Snap points

Each direct child of the snap wrapper receives inline `--ae-snap-viewport` and `--ae-snap-focus` values at mount and as the box scrolls or refreshes. The values use the snap axis and compare the child's center with the viewport center. `--ae-snap-viewport` is `0` at the center, `-1` and `1` at the starting and ending viewport edges, and clamps to `-2` and `2` farther outside. `--ae-snap-focus` is `1` at the center, `0.5` at either viewport edge, and clamps to `0` at the outside limits. These inline values remain on the children after unmount.

Place `data-ae-scrollbox-snap` on the Scrollbox's only direct child. Each direct child of that wrapper is a snap point. The same wrapper may also have `data-ae-scrollbox-elastic`. An invalid wrapper reports diagnostic 1121 and disables snap. At mount, the first point is centered immediately. On PDS release, Scrollbox adds the pointer's movement delta once more to each point's center and selects the projected center nearest the viewport center. This gives a drag more weight when choosing a point, even before that point becomes physically nearest. The chosen point is centered with `scrollIntoView({ block: "center", inline: "center" })`. If the current point remains nearest, a flick longer than 1 px and shorter than 100 px advances one point when it lasts at most 50 ms, or when it lasts at most 200 ms and reaches 0.5 px/ms. A drag that moves the current point's center at least one quarter of the viewport size farther from center also advances one point. A smaller, slower drag returns to the current point. Text-origin gestures normally wait 100 ms for native selection, but a snap flick released within that interval can advance before PDS starts if the selection did not change. Only gestures on the chosen scroll axis count; when both axes overflow, horizontal has priority. Snap replaces PDS momentum for that release. If elastic pressure is active, snap waits for the wrapper to return before centering.

Scrollbar dragging and other native scrolling outside the snap wheel handler select the nearest point when the element's `scrollend` event fires. Browsers without `scrollend` use a 120 ms idle timer after the last `scroll` event. At PDS release or native scroll end, a scroll position within 10 px of the starting or ending limit selects the first or last point directly, before comparing centers or considering flicks. Scrollbox waits while PDS is active and ignores a completed snap that is already aligned.

A single click inside a snap point centers that point when any part of it lies outside the Scrollbox viewport. Clicking a point that is fully visible leaves the scroll position unchanged.

```html
<div id="gallery" data-ae-scrollbox="pointer" style="width: 20rem; overflow: auto">
  <div data-ae-scrollbox-snap data-ae-scrollbox-elastic style="display: flex">
    <article>First</article>
    <article>Second</article>
    <article>Third</article>
  </div>
</div>
```

The mounted controller exposes `scrollbox.next()`, `scrollbox.previous()`, and `scrollbox.goto(index)`. `index` is zero-based in DOM order. All three return `true` when a point is available and `false` otherwise. For example, `$ae.mountManager.controller("gallery").scrollbox.goto(2)` centers the third point. These methods work in both native and pointer modes.
