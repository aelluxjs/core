# Scrollbox Extension

`data-ae-scrollbox` uses the browser's native scrolling and publishes `--ae-scroll-y-progress` and `--ae-scroll-x-progress` on the scroll container. Each value runs from 0 at the start to 1 at the end of its axis; an axis without overflow reports 0. Native `scroll` events continue to reach ordinary listeners, including Anchor's capture listener. On unmount, Scrollbox restores the previous inline progress values and priorities.

The boot's weak CSS supplies `overflow: auto`, `contain: layout paint`, and thin scrollbars. It also enables smooth programmatic scrolling on all elements; `prefers-reduced-motion: reduce` restores immediate scrolling. Pointer dragging and momentum set each position immediately so they follow the gesture. An application can override the weak styles. Basic Scrollbox works with any content structure and does not load a scrolling library. Elastic edges require a single marked content child.

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

Drag with the primary mouse button or pen. The gesture starts after a small movement and follows both scroll axes; it keeps working when the pointer moves outside the box. Touch input retains native behavior. Dragging does not start on links, buttons, form controls, editable content, or explicitly draggable elements. The temporary text-selection style is restored when the gesture ends. Change the mode with `$ae.mountManager.update(element, "scrollbox")` after editing the attribute.

In a vertical-only box, a mostly horizontal pointer movement selects text normally. Scrollbox waits for at least 6 px of vertical movement before taking over the gesture for dragging. Once horizontal movement reaches 8 px while vertical movement remains below 6 px, it leaves the gesture to native text selection.

In `pointer` mode, a quick release continues scrolling with gradually decreasing speed. Momentum is enabled by default and applies only to desktop pointer dragging. It starts after more than 15 px within the latest 300 ms of dragging and uses a deceleration value of 0.0015 to calculate the destination. Each animation frame moves 10% of the remaining distance to that destination; it ends when both axes match to three decimal places. It stops at the scroll boundary, on a new pointer or wheel interaction, when the mode changes, or when the box unmounts. Set `data-ae-scrollbox-momentum="false"` to disable it:

```html
<div data-ae-scrollbox="pointer" data-ae-scrollbox-momentum="false">
  <div>Scrollable content</div>
</div>
```

## Horizontal wheel handoff

On a fine-pointer desktop, a predominantly vertical wheel gesture scrolls a horizontal-only box sideways while it has room in that direction. At either edge, the next wheel event passes to the parent or document. Native horizontal wheel gestures remain native. A box with meaningful vertical overflow does not convert vertical wheel motion. This behavior applies to both modes.

Set `data-ae-scrollbox-wheel-horizontal="false"` to disable the vertical-to-horizontal conversion:

```html
<div data-ae-scrollbox data-ae-scrollbox-wheel-horizontal="false">
  <div>Horizontal content</div>
</div>
```

## Elastic edges

Place `data-ae-scrollbox-elastic` on the Scrollbox's only direct child to enable elastic edges in either `native` or `pointer` mode. That child wraps all scrollable content. A marked child alongside another direct child reports diagnostic 1120 and leaves the elastic effect disabled. When pointer dragging, touch dragging, or a wheel gesture pushes past a scroll limit, Scrollbox sets `transform-origin` to the pressed edge and applies `scale(...) translate3d(...)` to the wrapper. The active axis scales up to 1.1. The displacement is one third of the force beyond the limit, capped at one quarter of the visible size of that axis. On release, its transform returns to the value measured at mount over 800 ms; reduced-motion users get an immediate return. The original inline transform and transform origin are restored on unmount. Set the child's attribute to `false` to disable the effect.

```html
<div data-ae-scrollbox="native" style="width: 20rem; height: 12rem">
  <div data-ae-scrollbox-elastic>Scrollable content</div>
</div>
```

Scrollbox updates measurements after content mutations, box resize, or window resize. Resize updates use a 100 ms throttle.
