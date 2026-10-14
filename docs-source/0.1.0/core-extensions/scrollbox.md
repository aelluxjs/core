# Scrollbox Extension

`data-ae-scrollbox` uses the browser's native scrolling and publishes `--ae-scroll-y-progress` and `--ae-scroll-x-progress` on the scroll container. Each value runs from 0 at the start to 1 at the end of its axis; an axis without overflow reports 0. Native `scroll` events continue to reach ordinary listeners, including Anchor's capture listener. On unmount, Scrollbox restores the previous inline progress values and priorities.

The boot's weak CSS supplies `overflow: auto`, `contain: layout paint`, and thin scrollbars. It also enables smooth programmatic scrolling on all elements; `prefers-reduced-motion: reduce` restores immediate scrolling. Pointer dragging and momentum set each position immediately so they follow the gesture. An application can override the weak styles. Scrollbox works with any content structure; it does not require a single content child or load a scrolling library.

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

In `pointer` mode, a quick release continues scrolling with gradually decreasing speed. Momentum is enabled by default and applies only to desktop pointer dragging. It uses BetterScroll-like limits: more than 15 px within the latest 300 ms of dragging, a deceleration value of 0.0015, and a maximum animation time of 2500 ms. It stops at the scroll boundary, on a new pointer or wheel interaction, when the mode changes, or when the box unmounts. Set `data-ae-scrollbox-momentum="false"` to disable it:

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

Scrollbox updates measurements after content mutations, box resize, or window resize. Resize updates use a 100 ms throttle.
