# Present Extension

`present` controls the visibility of elements marked with `data-ae-present`. It is included in the `full` runtime. In `basic` mode, register it with `$ae.ext("present")`.

```html
<button type="button" data-ae-trigger="toggle" data-ae-target="#details">Details</button>
<section id="details" data-ae-present hidden>
  <button type="button" data-ae-dismiss>Close</button>
  Content
</section>
```

`data-ae-trigger` accepts `pop`, `unpop`, or `toggle`; an unrecognized value also toggles. `data-ae-target` and `data-ae-dismiss` can select targets with CSS selectors. Without a selector, a trigger or dismiss control acts on its closest `data-ae-present` container. Invalid selectors are reported through diagnostics.

A trigger or dismiss control with neither a selector nor a containing `data-ae-present` reports `ERROR_PRESENT_CONTROL_TARGET_MISSING` (`1111`). When a direct `data-ae-present-motion` child starts hidden, the Extension moves that state to the container and reports `WARN_PRESENT_MOTION_HIDDEN` (`2008`).

## Motion and state

The Extension exposes `pop(element)`, `unpop(element)`, `toggle(element, goto)`, and `trigger(element, action)` through `$ae.ext.present`. It manages `hidden` and `aria-expanded` on the container and updates `aria-expanded` and `aria-controls` on its triggers. A direct child marked `data-ae-present-motion` can carry the transition classes; otherwise the container itself is used.

The transition classes are `ae--popping`, `ae--unpopping`, and `ae--pop`. CSS custom properties `--ae-pop-duration` and `--ae-unpop-duration` on the motion element set the corresponding duration. The Extension emits cancelable `AelluxJsBeforePop` and `AelluxJsBeforeUnpop` events, followed by `AelluxJsPopping`/`AelluxJsUnpopping` and `AelluxJsPop`/`AelluxJsUnpop` as transitions progress.

`data-ae-auto-unpop` specifies a delay before closing an open container. Outside clicks also close open containers unless `data-ae-unpop-on-outside="false"` is set. On unmount, the mount helper restores the initial attributes on the container, its existing descendants, and the trigger controls it mounted.
