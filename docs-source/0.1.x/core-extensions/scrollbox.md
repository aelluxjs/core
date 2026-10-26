# Scrollbox Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

`data-ae-scrollbox` uses the browser's native scrolling and publishes `--ae-scroll-y-progress` and `--ae-scroll-x-progress` on the scroll container. Each value runs from 0 at the start to 1 at the end of its axis; an axis without overflow reports 0. Repeated scroll events share one layout read and one CSS update in the next frame, using the latest position. Native `scroll` events continue to reach ordinary listeners, including Anchor's capture listener. On unmount, Scrollbox restores the previous inline progress values and priorities.

Scrollbox marks positions within 5 px of each scroll limit with `ae--scroll-v-start`, `ae--scroll-v-end`, `ae--scroll-h-start`, and `ae--scroll-h-end` on the container. An axis without overflow has both its start and end classes. During elastic pressure and its return animation, the classes keep their last state; they update again when the effect ends. Scrollbox removes these classes on unmount.

```css
[data-ae-scrollbox]:not(.ae--scroll-v-end) {
  box-shadow: inset 0 -8px 8px -8px rgb(0 0 0 / 0.25);
}
```

Scrollbox uses the external `aellux.ext.scrollbox.css`, requested with `{ loadStyle: true }` in Basic or included in the shared Full stylesheet. This weak CSS supplies `overflow: auto`, `contain: layout paint`, and thin scrollbars. It gives the elastic child `display: inline-block` with `vertical-align: top` so the inline line box adds no scrollable space below. If application CSS sets the elastic wrapper to `block`, `flex`, or `grid`, Scrollbox reports diagnostic 2016 and uses `inline-block`, `inline-flex`, or `inline-grid` respectively. It restores the previous inline `display` when the wrapper changes or unmounts. The boot's global weak CSS enables smooth programmatic scrolling on all elements; `html[data-ae-reduced-motion="reduced"]` restores immediate scrolling and removes custom scrollbar transitions. Elastic snapback also finishes immediately under that attribute. Pointer dragging and momentum set each position immediately so they follow the gesture. An application can override the weak styles. Basic Scrollbox and snap do not require a content wrapper; elastic edges require a single marked content child.

## Overflow fade

Scrollbox follows bubbling `AelluxJsLayout` events from its container, ancestors and descendants. A finite positive `detail.durationMs` keeps measurements updated through the transition at the configured layout FPS. Present's final `Pop` and `Unpop` events also refresh the box, so a fade measured while an ancestor has `scale(0)` recovers without scroll input.

Overflowing Scrollboxes receive a visual transparency fade by default. The top, right, bottom and left fades correspond to the actual content hidden beyond each physical edge. User scrolling and programmatic scrolling, including smooth Snap travel, update them through the existing `publish(state)` layout read/update. Fitting content and axes whose computed overflow is not `auto` or `scroll` contribute no fade. RTL scroll offsets are normalized to physical left/right distances, including older positive-coordinate models. Native overscroll is clamped to the real range; Elastic uses the original scroll bounds and axis availability rather than its temporary transformed extent.

```html
<div data-ae-scrollbox data-ae-scrollbox-fade="false">
  <!-- Scrolling remains available without the visual fade. -->
</div>
```

The attribute defaults to enabled; empty and `true` also enable it. Only `false` disables it. Attribute changes reconfigure the mounted box. Invalid values keep the default and use semantic configuration diagnostic 2026 in development mode.

```css
.scrollable {
  --ae-scrollbox-fade-size: 16px;
}
```

Use a nonnegative CSS length. Each fade's width is limited to the hidden distance, this maximum and half the visible axis. Its strength also decreases as the hidden distance approaches zero: 4px of hidden content produces a subtle fade covering at most 4px. `0px` removes the visual effect. Reduced motion keeps the indication because it adds no animation or artificial transition.

When the Scrollbox has exactly one direct content element, the mask is applied to that child, preserving the Scrollbox's background, border and scrollbars. Direct custom scrollbar elements are excluded from this count. With multiple content elements, the mask is applied to the Scrollbox itself. Detection stops at the second content child, avoiding a scan of long lists on every scroll update. Adding, removing or replacing children transfers the mask and restores the previous target's owned values and priorities.

The mask uses a horizontal and a vertical `linear-gradient()`, combined with `mask-composite:intersect` (WebKit's `source-in` equivalent). Their transparency multiplies at the corners. A child mask is sized and positioned against the scroll viewport during the existing `publish(state)` layout read/update, so the fade stays at the visible edges as the child scrolls or Elastic transforms it. If composition is unavailable, one gradient follows the configured Snap axis, otherwise the only scrollable axis or vertical when both scroll. Without mask support, scrolling continues without the effect. No wrappers or overlays are introduced; transition measurements use the shared layout scheduler. Private hidden-distance and mask-geometry properties are restored, including prior priorities, when the target changes or on unmount.

**Painting limitation:** a CSS mask composites its target together with the target's contents. With one content child, only that child's painting is faded. When the Scrollbox itself is the target, its background, border and any native or custom scrollbar painted in the faded region are also attenuated. Their interaction remains available. Use a single content child, keep decoration on an existing surrounding element, adjust the fade size or disable the effect when an opaque border, background or scrollbar is required. Native scrolling, PDS, Elastic, Snap, nested boxes and sticky descendants retain their structure and behavior. Masking does not change focus, keyboard operation, text selection or pointer hit testing.

An application mask already present on the Scrollbox at the first publish reserves the container for the application: automatic masking remains disabled for that mount. A child with an existing application mask, or a child that is itself a Scrollbox, also retains ownership of its mask; the parent does not add an automatic fade. Scrollbox never writes inline `mask-*` properties. The generated mask rules use zero-specificity selectors, allowing later application styles to override them. Unmount restores the preceding marker, distance and geometry values without touching authored masks.

## Custom scrollbars

Add `data-ae-scrollbar="vertical"`, `"horizontal"`, or both (for example, `"v h"` or `"y x"`) to show custom scrollbars. An empty `data-ae-scrollbar` enables both axes. Set it to `"none"` to hide native scrollbars without creating custom bars. Scrollbox creates `data-ae-scrollbar-vertical` and `data-ae-scrollbar-horizontal` as direct children of the scrollbox, or reuses existing direct children with those attributes. They sit beside the content and are excluded from the elastic wrapper's single-child check. A bar is never a snap point unless explicitly marked with `data-ae-snap-item`. A bar appears only when its axis overflows and its computed `overflow-x` or `overflow-y` is `auto` or `scroll`; `hidden` and `clip` keep that axis's bar at `display: none`. Scrollbox adds `ae--native-sb-hide` for custom bars and for `"none"` to hide native scrollbars.

The bars normally fade between opacity 0 and 1. Set inherited `--ae-scrollbar-opacity-fade` and `--ae-scrollbar-opacity-visible` on the scrollbox, including through inline CSS, to customize those values. Setting both to `1` keeps the bars opaque whenever their axis is scrollable. Mouse and pointer hover are tracked separately, so either one keeps the bars visible. They fade out after both hovers end or a click starts outside the box, unless PDS is active. After PDS ends, they remain visible for one second; when that timer ends, any active mouse or pointer hover still keeps them visible. The track overlays the viewport and follows scrolling with `translate3d`; its thumb uses a separate transform. Drag the thumb with a mouse, pen, or touch to scroll continuously; the track and thumb positions update during the movement so they remain under the pointer. While a scrollbar is being dragged, PDS cannot start on that scrollbox or its scroll chain, and CSS snap alignment is suspended until release. Clicking outside the thumb recenters it on the track only when the computed track background is visible and its opacity is greater than zero; a transparent or invisible track does not respond to that click. The weak CSS uses the same system `CanvasText` based colors as its native scrollbar styling. Set inherited `--ae-scrollbar-thumb-color`, `--ae-scrollbar-thumb-hover-color`, `--ae-scrollbar-track-color`, `--ae-scrollbar-thumb-radius`, and `--ae-scrollbar-size` on the scrollbox, including through inline CSS, to customize the thumb colors, track color, thumb corner radius, and bar thickness. The color properties have no registered initial value, so the weak CSS uses its `CanvasText` based thumb colors and transparent track when they are unset. The radius and thickness default to `10px` and `8px`. The same values style native scrollbars when custom bars are not enabled. Owned bar elements are removed at unmount; pre-existing bars and their original inline scrollbar properties are preserved.

```html
<div data-ae-scrollbox="pointer" data-ae-scrollbar="v h"
  style="width: 20rem; height: 12rem">
  <div data-ae-scrollbox-elastic><!-- scrollable content --></div>
</div>
```

```html
<div data-ae-scrollbox style="width: 20rem; height: 12rem">
  <div><!-- scrollable content --></div>
</div>
```

## Modes

| Value | Behavior |
| --- | --- |
| `native` | <span style="white-space: normal !important;">Default, including an empty attribute. Uses browser scrolling and updates the progress properties.</span> |
| `pointer` | <span style="white-space: normal !important;">Adds mouse or pen drag-to-scroll on a hover-capable device with a fine pointer. Scrolling, wheel input, and progress remain native. On other devices it behaves like `native`.</span> |

```html
<div data-ae-scrollbox="pointer" style="width: 20rem; height: 12rem">
  <div><!-- scrollable content --></div>
</div>
```

Pointer Drag Scroll (PDS) uses the primary mouse button or pen. Once movement reaches 3 px, the larger component of that first movement locks the gesture to the horizontal or vertical axis. PDS keeps working when the pointer moves outside the box. Touch input retains native behavior. PDS does not start on links, buttons, form controls, editable content, or explicitly draggable elements. On open content, PDS prevents the pointer-down default so the browser does not start its own drag or edge scroll. Text and excluded elements keep their native pointer-down behavior. The cursor is `grab` over empty scrollable content, keeps its native appearance over selectable text and excluded elements, and becomes `grabbing` once PDS begins. On desktop, pointer mode cancels cancelable mouse events from the same button while PDS is moving, including when the pointer leaves the box. The matching release and click are canceled too; events from other mouse buttons remain available. A second or later mouse click stops drag tracking and allows native text selection when no drag is underway. PDS leaves `user-select` unchanged; its temporary scroll-behavior and cursor styles are restored when the gesture ends. Change the mode with `$ae.mountManager.update(element, "scrollbox")` after editing the attribute.

A completed PDS gesture, including a snap flick consumed during the text-selection wait, does not count toward the next double-click sequence. Rapid re-grabs near the same starting position remain draggable; ordinary double and triple clicks keep native text selection.

Once PDS begins, Scrollbox adds `ae--pointerscrolling` to the box. Scrollbox's weak CSS applies `cursor: grabbing !important` to the box and its contents until the gesture ends. If its only direct child enables `data-ae-scrollbox-elastic`, that child and its descendants also receive `pointer-events: none !important` during PDS. Scrollbox cancels wheel input over the box during this interval, along with the default action of its `pointermove`, matching-button `mousemove`, `touchmove`, and cancelable drag events. Canceling `dragstart` prevents a native drag from taking over the gesture. Native `scroll` events still reach listeners and report the updated scroll position.

`AelluxJsPointerScrollStart` fires when PDS actually activates, after the axis is locked. `AelluxJsPointerScrollEnd` fires after its temporary classes and styles are removed. Both events originate on the scrollbox where the gesture began and bubble; their `detail` contains `{ axis, pointerId, pointerType, elements }`, where `elements` lists the activated boxes in a nested chain. A snap flick that ends before PDS activates emits neither event.

Gestures starting on text wait 100 ms after pointer-down so a native selection can begin. The first qualifying movement still chooses the axis during that wait. A text selection that remains unchanged from pointer-down does not block PDS; a new or altered selection stops tracking and remains intact. A collapsed caret by itself does not count as a text selection. In a vertical-only scroll chain, movement of more than 10 px vertically starts PDS immediately when vertical movement is dominant, and prevents native selection. Otherwise PDS scrolls in the locked axis after the wait, including any movement already made while waiting. PDS only captures an axis whose computed overflow is `auto` or `scroll` and whose content overflows. `hidden`, `clip`, and other non-scrollable overflow values disable PDS on that axis even if its content is larger than the box. A nested gesture can continue on an ancestor that permits the chosen axis.

In nested pointer Scrollboxes, the innermost box consumes movement in the locked axis until it reaches an edge. Any remaining movement goes to the next scrollable pointer Scrollbox, repeating upward as needed. Computed `overscroll-behavior-x` or `overscroll-behavior-y` on a box can stop this PDS chain in that axis: `contain` and `none` keep movement within that box, while `auto` allows the usual handoff. A box whose overflow is disabled in the chosen axis does not stop that axis's chain. Reversing direction returns to the innermost box first. Elastic pressure applies only after every eligible box reaches its edge; release momentum applies to the last box that moved. `contain` allows local elastic feedback at the edge; `none` disables that feedback in its axis.

```html
<div data-ae-scrollbox="pointer" style="overflow: auto">
  <div data-ae-scrollbox="pointer"
       style="overflow: auto; overscroll-behavior-y: contain">
    <div>Vertical PDS stops at this inner box.</div>
  </div>
</div>
```

For native touch, keep the browser's default `touch-action` on nested boxes that scroll in different axes. A mostly vertical touch over a vertical child can scroll that child; a mostly horizontal touch can reach the horizontal parent. Forcing `touch-action: pan-y` on the child can block the parent's horizontal gesture when the touch starts inside the child.

```html
<div data-ae-scrollbox style="width: 20rem; overflow-x: auto; overflow-y: hidden">
  <div style="display: flex; width: max-content">
    <div data-ae-scrollbox style="width: 20rem; height: 12rem; overflow-x: hidden; overflow-y: auto">
      <!-- Vertical content -->
    </div>
    <div data-ae-scrollbox style="width: 20rem; height: 12rem; overflow-x: hidden; overflow-y: auto">
      <!-- Another vertical column -->
    </div>
  </div>
</div>
```

In `pointer` mode, a quick release continues scrolling with gradually decreasing speed. Momentum is enabled by default and applies only to desktop pointer dragging. An enabled `data-ae-scrollbox-snap` disables PDS momentum for the entire box, including dragging in the other axis and when `data-ae-scrollbox-momentum="true"`. Without snap, momentum starts after more than 15 px within the latest 300 ms of dragging and uses a deceleration value of 0.0015 to calculate the destination. Each animation frame moves 10% of the remaining distance to that destination; it ends when both axes match to three decimal places. It stops at the scroll boundary, immediately on pointer-down anywhere inside the box (including controls, nested content, native scrollbar presses, and custom scrollbar thumb/track grabs), or on any wheel event, even when that event is noncancelable, already prevented, or uses Ctrl for zoom. Interruption happens before drag eligibility checks and does not require pointer movement. Momentum does not resume when that interaction ends; only a new qualifying drag release can start it again. Enabling snap, changing the mode, or unmounting also stops momentum. Set `data-ae-scrollbox-momentum="false"` to disable it:

```html
<div data-ae-scrollbox="pointer" data-ae-scrollbox-momentum="false">
  <div>Scrollable content</div>
</div>
```

## Horizontal wheel handoff

On a fine-pointer desktop, a predominantly vertical wheel gesture scrolls a horizontal-only box sideways while it has room in that direction. At a boundary, each box consumes only the distance still available and passes the remainder to the next eligible ancestor, including ordinary scroll containers and the document. This continues through three or more levels and alternating vertical and horizontal axes. Each horizontal-only Scrollbox evaluates its own conversion; after that box reaches its edge, the remaining intent keeps its original wheel axis for the next ancestor. A vertical child keeps its native wheel behavior while it has room.

Elastic feedback at a boundary does not consume the remaining scroll intent: the wrapper may stretch while an ancestor scrolls. For example, a 120 px gesture with 20 px of space left scrolls that box 20 px and passes 100 px upward. `overscroll-behavior-x` or `overscroll-behavior-y` stops the handoff in the axis actually used by that level: `contain` retains local elastic feedback, and `none` also disables it. A restriction on an unused axis does not block the gesture. When Scrollbox handles the movement and handoff itself, it cancels the native default to avoid scrolling ancestors a second time.

Only axes with `overflow: auto` or `scroll` count as wheel-scrollable, except the document's native scrolling element. Content taller than a box with `overflow-y: hidden` does not stop horizontal conversion or produce vertical elastic pressure. Wheel input wholly inside the original box's native range remains native. This behavior applies to both modes.

With snap enabled, each wheel gesture advances to the next or previous point instead of scrolling by pixels. The dominant wheel delta determines the gesture direction. A predominantly vertical gesture also navigates a horizontal snap box; a horizontal-only gesture does not navigate a vertical snap box. Repeated cancelable wheel events within 120 ms count as one gesture. Some browsers make later events in a wheel sequence noncancelable, so native scrolling can continue after the first snap step. At the first or last item, a wheel gesture toward that edge follows the normal wheel path: it can stretch an elastic wrapper and continue to a scrollable ancestor when the browser permits chaining.

`Ctrl` + wheel is left to the browser for zoom. Scrollbox also leaves noncancelable wheel events untouched; neither gesture starts snap navigation, elastic pressure, or horizontal conversion.

Set `data-ae-scrollbox-wheel-horizontal="false"` to disable the vertical-to-horizontal conversion, including snap navigation. A vertical wheel gesture then follows its native path; a horizontal wheel gesture still navigates horizontal snap items:

```html
<div data-ae-scrollbox data-ae-scrollbox-wheel-horizontal="false">
  <div>Horizontal content</div>
</div>
```

## Elastic edges

Place `data-ae-scrollbox-elastic` on the Scrollbox's only direct child to enable elastic edges in either `native` or `pointer` mode. That child wraps all scrollable content. A marked child alongside another direct child reports diagnostic 1120 and leaves the elastic effect disabled. When pointer dragging, touch dragging, or a wheel gesture pushes past a scroll limit, Scrollbox sets `transform-origin` to the pressed edge and applies `scale(...) translate3d(...)` to the wrapper. The effect applies only to axes with computed `overflow: auto` or `scroll` and actual scrollable overflow; `overflow: hidden` disables it on that axis even when content exceeds the box. Computed `overscroll-behavior-x: none` or `overscroll-behavior-y: none` also prevents this effect in the respective axis; `contain` still permits it. On each axis, the scale grows the wrapper's scrollable extent by the same number of pixels as the elastic displacement. Pressure starts with one third of the pointer or wheel movement and slows exponentially as it approaches the configured maximum. At the bottom or right edge, Scrollbox keeps the wrapper's scrollable extent stable while the transform moves its content, including content that overflows the wrapper's own box. On release, each animation frame moves the elastic displacement 15% toward zero; reduced-motion users get an immediate return. The original inline transform, transform origin, and minimum size are restored when the effect ends. Set the child's attribute to `false` to disable the effect.

The attribute value sets the maximum displacement. With no value it defaults to `1/4` of the visible size on each axis. Fractions such as `1/2` use the visible size of their axis; `30px` and `30` both mean 30 pixels. One value applies to both axes. Two values follow CSS shorthand order: vertical, then horizontal. For example, `data-ae-scrollbox-elastic="1/4 40px"` limits vertical pressure to one quarter of the visible height and horizontal pressure to 40 pixels. Invalid values report diagnostic 2015 and use the defaults.

```html
<div data-ae-scrollbox="native" style="width: 20rem; height: 12rem">
  <div data-ae-scrollbox-elastic>Scrollable content</div>
</div>
```

Scrollbox updates measurements after content mutations, box resize, or window resize. Resize updates use a 100 ms throttle.

## Snap points

Snap points are provided by the optional [Scrollbox Snap](scrollbox-snap.md) Extension. Register `scrollbox-snap`; it registers and waits for Scrollbox before mounting. Its API, events, and interaction hooks are documented on that page.

`AelluxJsScrollboxSnapChange` fires on the scrollbox when a newly selected snap point finishes settling. Its `detail` contains `{ item, index, previousIndex, axis }`; the initial selection uses `previousIndex: null`. Selecting the same item again does not emit another change.

```js
document.getElementById("gallery").addEventListener("AelluxJsScrollboxSnapChange", event => {
  const { item, index } = event.detail;
  console.log(index, item);
});
```

Each `data-ae-snap-item` receives inline `--ae-snap-focus` at mount and as the box scrolls or refreshes. It uses the snap axis: `1` means aligned, falls by the alignment distance divided by the viewport size, and clamps to `0`. Prior inline values and priorities are restored on unmount. For normalized position and visible area, add `data-ae-viewport` to the item and use the independent [Viewport Extension](optional/viewport.md). The former `--ae-snap-viewport` output has been removed; use `--ae-viewport-x` or `--ae-viewport-y`. Snap works without Viewport.

Place `data-ae-scrollbox-snap` on the Scrollbox itself and mark each point with `data-ae-snap-item`. An empty value or `horizontal` selects the horizontal axis; `vertical` selects the vertical axis. Without elastic, marked descendants of the scrollbox are points; with elastic, only marked descendants inside its wrapper are points. Items belonging to a nested scrollbox are excluded. If no eligible item exists, diagnostic 1121 reports the missing points and snap stays disabled. The weak CSS applies `scroll-snap-type: x mandatory` or `y mandatory` to the box. An empty `data-ae-snap-item` aligns its center; `start`, `left`, and `top` align its start, while `end`, `right`, and `bottom` align its end along the selected axis. The directional names are aliases for CSS's logical `start` and `end`. The extension toggles CSS classes to suspend snapping during PDS, elastic pressure, scrollbar thumb dragging, and wheel input beyond the first or last item. At a list end, wheel input follows native scrolling and can reach an ancestor when `overscroll-behavior` permits it. The snap rule returns 120 ms after the last edge wheel event. The focus and viewport variables keep updating while snapping is suspended. At mount, Scrollbox aligns the first point immediately. Snap does not alter the box's or items' inline snap declarations.

For a quick flick in desktop PDS, Scrollbox advances one point from the gesture's starting item in the gesture direction. Further pointer moves in that drag keep the same starting item. The flick must last no more than 100 ms, move more than 1 px but less than 100 px, and either finish within 50 ms or reach 0.5 px/ms. Only movement along the snap axis counts. A short desktop flick can finish within the 100 ms text-selection wait if selection did not start. Longer PDS gestures let CSS Scroll Snap choose the destination. PDS momentum does not run while snap is enabled. Touch scrolling and its momentum remain native; snap items use `scroll-snap-stop: always` to prevent a native fling from passing over an intermediate point. Touch release does not trigger scripted flick navigation.

Native CSS Scroll Snap permits free scrolling within a snap point wider or taller than the viewport. Use points no larger than the viewport when every release must align to one center; flicks and controller navigation can still move between oversized points.

A new mouse or pen press interrupts smooth snap scrolling at its current position and discards any pending flick from the previous gesture. Snap is suspended immediately, before the PDS threshold or text-selection wait ends, so an earlier animation cannot continue moving the held box. Snap resumes after the last pointer is released or canceled, or when the window loses focus. Native touch scrolling keeps its usual snap and momentum behavior.

Snap boxes use `scroll-behavior: auto` so native snap positioning does not inherit the boot's general smooth scrolling rule. Controllers, wheel steps, and scripted flicks still request smooth navigation explicitly. PDS preserves fractional pointer movement across events; rounding a scroll position does not create elastic pressure or send movement to a parent before an edge is reached.

While elastic pressure is active and throughout its return, Scrollbox temporarily sets `scroll-snap-type: none`. It restores the snap rule only after the elastic wrapper returns to its original position. A new pointer press or cancelable wheel interaction during the return immediately restores the wrapper and cancels the remaining return frames before processing the new interaction. This also applies to pointer presses on controls and custom scrollbars. Snap navigation from the new wheel input therefore uses the restored item positions.

When scrolling settles, Scrollbox identifies the selected point and emits `AelluxJsScrollboxSnapChange`. It uses `scrollend` when available, with a 120 ms scroll-idle fallback. During controller navigation and flick navigation, reaching the requested position completes the navigation. If scrolling stops at another position for 500 ms, the pending destination is cleared and the actual selected point is reported. A new cancelable wheel, pointer, or touch gesture also clears that pending destination. It waits for an active pointer or touch to end before using the fallback. A position within 10 px of either scroll limit selects the first or last point directly; otherwise it compares each item's requested alignment with the corresponding viewport position. The event reports the selection; it does not perform an additional alignment scroll.

```html
<div id="gallery" data-ae-scrollbox="pointer" data-ae-scrollbox-snap
  data-ae-scrollbar="horizontal" style="display: flex; width: 20rem; overflow: auto">
  <article data-ae-snap-item="left">First</article>
  <article data-ae-snap-item>Second</article>
  <article data-ae-snap-item="right">Third</article>
</div>
```

Keep Present transform and Feedback transform motion off the elastic wrapper itself; development diagnostics report competing writers with code `2033`. Animate a child of the wrapper instead. Apply visual transforms to children of `data-ae-snap-item` as well; development mounts and explicit updates report a transformed item with code `2020`. When `ResizeObserver` is available, Snap observes both the box and eligible items so its viewport/focus variables refresh when an item resizes without changing the box's dimensions.

Snap can share the elastic wrapper:

```html
<div data-ae-scrollbox data-ae-scrollbox-snap style="width: 20rem; overflow: auto">
  <div data-ae-scrollbox-elastic style="display: flex">
    <article data-ae-snap-item>First</article>
    <article data-ae-snap-item>Second</article>
    <article data-ae-snap-item>Third</article>
  </div>
</div>
```

For a vertical list, use `data-ae-scrollbox-snap="vertical"`:

```html
<div data-ae-scrollbox data-ae-scrollbox-snap="vertical"
  style="height: 20rem; overflow-y: auto">
  <section data-ae-snap-item="top">First</section>
  <section data-ae-snap-item="bottom">Second</section>
</div>
```

The mounted controller exposes `scrollbox.next()`, `scrollbox.previous()`, and `scrollbox.goto(index)`:

```js
const gallery = $ae("gallery").scrollbox;
gallery.goto(2);     // Align the third point according to its attribute.
gallery.next();      // Move to the following point.
gallery.previous();  // Move to the preceding point.
```

`index` is zero-based in DOM order. All three methods return `true` when a point is available and `false` otherwise. They work in both native and pointer modes.

## Distribution cost

Tracking Layout transitions and Present completion adds 421/175 bytes to minified Scrollbox Modern and 477/176 bytes to Legacy (raw/gzip level 9). Legacy's limits change from 47/14.75 to 47.5/15 KiB; the other affected artifacts retain their limits.

The four-edge fade adds 1,958/730 bytes to Scrollbox Modern, 2,108/698 bytes to Legacy and 1,706/242 bytes to its stylesheet (raw/gzip level 9), compared with the preceding checked-in artifacts. The Modern script retains its existing limits. The dedicated CSS raw limit increases from 5 to 6.5 KiB; Legacy changes from 44/14 to 46/14.5 KiB (raw/gzip).

Applying the fade to a single content child adds viewport geometry and target restoration. Compared with the preceding checked-in artifacts, minified raw/gzip level 9 sizes change as follows:

| Artifact | Before (bytes) | After (bytes) | Delta (bytes) |
| --- | --- | --- | --- |
| Scrollbox Modern | 41,063 / 13,259 | 42,203 / 13,646 | +1,140 / +387 |
| Scrollbox Legacy | 46,757 / 14,584 | 47,993 / 15,019 | +1,236 / +435 |
| Scrollbox CSS | 6,198 / 1,194 | 6,650 / 1,270 | +452 / +76 |
| Full Modern | 190,334 / 58,564 | 191,474 / 59,002 | +1,140 / +438 |
| Full Legacy | 517,450 / 152,324 | 518,689 / 152,708 | +1,239 / +384 |
| Full CSS | 124,196 / 11,622 | 124,648 / 11,701 | +452 / +79 |

Scrollbox Legacy's limits change from 46/14.5 to 47/14.75 KiB (raw/gzip). The other affected artifacts retain their existing limits.

| Artifact | Raw / gzip bytes | Limit raw / gzip |
| --- | ---: | ---: |
| `aellux.ext.scrollbox.min.js` | 41,063 / 13,259 | 46 / 14 KiB |
| `aellux.ext.scrollbox.legacy.min.js` | 46,757 / 14,584 | 46 / 14.5 KiB |
| `aellux.ext.scrollbox.min.css` | 6,198 / 1,194 | 6.5 / 1.5 KiB |
| `aellux.orchestrator.min.js` | 63,459 / 21,146 | 62 / 20.75 KiB |
| `aellux.orchestrator.legacy.min.js` | 336,068 / 106,160 | 328.5 / 104 KiB |
| `aellux.full.min.js` | 134,414 / 43,621 | 131.5 / 42.75 KiB |
| `aellux.full.legacy.min.js` | 447,169 / 133,006 | 437 / 138 KiB |
| `aellux.full.min.css` | 124,021 / 11,598 | 122 / 12 KiB |

Together with Overflow Marquee's fade, the shared controller and semantic validation add 667/168 bytes to Orchestrator Modern and 690/162 bytes to Legacy. Their combined contribution to Full is 667/202 bytes in Modern, 690/162 bytes in Legacy and 3,265/436 bytes in Full CSS. Orchestrator Modern's gzip limit changes from 20.5 to 20.75 KiB; Orchestrator Legacy's raw limit changes from 328 to 328.5 KiB. Full Modern changes from 131/42.5 to 131.5/42.75 KiB, and Full CSS's raw limit changes from 121 to 122 KiB. Full Legacy retains its existing limits.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Native input | Known Limit | <span style="white-space: normal !important;">PDS enhances primary mouse/pen input on hover/fine-pointer devices; touch scrolling and momentum remain native. Excluded controls and active text selection keep their input behavior.</span> | <span style="white-space: normal !important;">Choose native mode where appropriate and preserve browser touch-action and keyboard access.</span> |
| Nested scrolling | Known Limit | <span style="white-space: normal !important;">Axis availability and overscroll-behavior govern handoff. Ctrl-wheel and noncancelable wheel events stay native; enabling Snap disables PDS momentum.</span> | <span style="white-space: normal !important;">Configure each axis deliberately and follow the wheel and Snap interaction contracts.</span> |
| Elastic structure | Known Limit | <span style="white-space: normal !important;">Elastic requires a single marked content child, excluding bars. It owns temporary wrapper transforms and adjusts block/flex/grid display to inline equivalents.</span> | <span style="white-space: normal !important;">Use a dedicated wrapper and animate descendants instead of competing for transform.</span> |
| Custom bars | Known Limit | <span style="white-space: normal !important;">Custom scrollbar dragging is a pointer enhancement. Hiding native bars does not add a complete keyboard or assistive-technology scrollbar widget.</span> | <span style="white-space: normal !important;">Retain an operable scroll region and verify keyboard reachability when replacing native affordances.</span> |
| Fade painting | Known Limit | <span style="white-space: normal !important;">With one content child, only that child is masked. Otherwise the mask attenuates the container, background, border and bars together. Missing mask/composite support reduces or omits fading; authored masks take precedence as documented.</span> | <span style="white-space: normal !important;">Use one content child, keep decoration outside the masked box or disable fading when it obscures required visuals.</span> |
| Reconfiguration | Potential Risk | <span style="white-space: normal !important;">Frequent mutations, resizing and many boxes add geometry and paint work. Large masks and elastic transforms have page-dependent composition costs; content is not virtualized.</span> | <span style="white-space: normal !important;">Profile representative lists and gesture chains; avoid unnecessary active effects.</span> |
| Competing input | Potential Risk | <span style="white-space: normal !important;">Other drag, selection and wheel handlers can claim the same gesture. New input cancels owned momentum/elastic recovery before the next interaction.</span> | <span style="white-space: normal !important;">Coordinate handlers and allow the documented cancel/cleanup path to run.</span> |
| Coverage | Validation Gap | <span style="white-space: normal !important;">Nested axes, repeated drags, fades and scrollbar geometry have fixtures; desktop automation does not establish physical touchpad/pen behavior, mobile overscroll or every OS scrollbar mode.</span> | <span style="white-space: normal !important;">Validate these environments and long-content performance directly.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.scrollbox.js), [scrollbox-pointer.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scrollbox-pointer.spec.mjs), [scrollbox-wheel-chain.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scrollbox-wheel-chain.spec.mjs), [scrollbox-scrollbar.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scrollbox-scrollbar.spec.mjs), [scrollbox-fade.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scrollbox-fade.spec.mjs).
