# Scrollbox Extension

`data-ae-scrollbox` publishes `--ae-scroll-y-progress` and `--ae-scroll-x-progress` on the scroll container. Each value is a number from 0 at the start to 1 at the end of its axis; an axis without overflow reports 0. On unmount, Scrollbox restores the previous inline values and priorities. Scrollbox does not dispatch its own public scroll event.

```html
<div data-ae-scrollbox="auto" style="overflow: auto; width: 20rem; height: 12rem">
  <div><!-- scrollable content --></div>
</div>
```

## Modes

| Value | Behavior |
| --- | --- |
| `native` | Web Platform scrolling only; BetterScroll is never loaded. |
| `auto` | Default, including an empty attribute. Uses BetterScroll on a fine-pointer, hover-capable desktop without touch points; otherwise native. |
| `enhance` | Attempts BetterScroll regardless of input capabilities. Mount waits for the dependency. |

BetterScroll 2.5.1 is loaded on demand through the shared `$ae.dep("better-scroll", …)` registry. Multiple boxes share one load. If loading or initialization fails, that box keeps native scrolling and the same progress properties. A later update can retry a failed dependency load. BetterScroll requires exactly one direct content element; other structures retain native scrolling.

The BetterScroll defaults are `scrollX: false`, `scrollY: true`, `click: true`, `bounce: false`, `momentum: true`, `probeType: 3`, and `mouseWheel: true`. Scrollbox replaces the two axis values with the axes that actually overflow. It enables the wheel plugin on desktop except for horizontal-only boxes, whose wheel events are handled by Scrollbox. No snap or visual plugin is enabled.

Override defaults with a JSON object:

```html
<div data-ae-scrollbox="enhance"
     data-ae-scrollbox-options='{"bounce":true}'>
  <div>Content</div>
</div>
```

Options are shallow merged over the defaults without changing other boxes. An empty attribute uses the defaults. Invalid JSON or a non-object value emits a diagnostic and also uses the defaults. Call `$ae.mountManager.update(element, "scrollbox")` after changing the mode or options; Scrollbox switches source or recreates the BetterScroll instance as needed.

## Horizontal wheel handoff

On desktop, a predominantly vertical mouse wheel scrolls a horizontal-only box sideways while it has space in that direction. At either edge, the next wheel event passes to the vertical parent or document. This applies in native and enhanced modes. Predominantly horizontal gestures keep their horizontal intent. A box with meaningful vertical overflow does not convert vertical wheel motion.

```html
<div data-ae-scrollbox data-ae-scrollbox-wheel-horizontal="false">
  <div>Horizontal content</div>
</div>
```

Set `data-ae-scrollbox-wheel-horizontal="false"` to disable the conversion.
