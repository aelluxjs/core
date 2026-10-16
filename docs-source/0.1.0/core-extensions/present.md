# Present Extension

`present` controls the visibility of elements marked with `data-ae-present`. It is included in the `full` runtime, which automatically requests its generated stylesheet. In `basic` mode, register the script and stylesheet with `$ae.ext("present", { loadStyle: true })`.

## Accessibility profile

- **Capabilities:** interaction and input; structure and state; motion and timing.
- **Owned state:** presentation and `will-change` classes and its changes to `hidden`, `aria-expanded` and `aria-controls`.
- **Consumer responsibility:** use native, named trigger and dismiss controls; ensure configured motion respects reduced-motion preferences; manage focus for dialog, disclosure and similar patterns.
- **Focus on close:** if the active element is inside the region when it becomes hidden, Present releases its focus and emits `AelluxJsUnpopFocusLost`. Focus restoration is handled by the optional Focus Extension.

```html
<button type="button" data-ae-trigger="toggle" data-ae-target="#details">Details</button>
<section id="details" data-ae-present hidden>
  <div data-ae-present-motion>
    <button type="button" data-ae-dismiss>Close</button>
    Content
  </div>
</section>
```

`data-ae-trigger` accepts `pop`, `unpop`, or `toggle`; an unrecognized value also toggles. `data-ae-target` and `data-ae-dismiss` each accept one element ID, with or without a leading `#` (for example, `details` or `#details`). Without an ID, a trigger or dismiss control acts on its closest `data-ae-present` container. Invalid IDs are reported through diagnostics.

A trigger or dismiss control with neither an ID nor a containing `data-ae-present` reports `ERROR_PRESENT_CONTROL_TARGET_MISSING` (`1111`).

## Motion and state

The Extension exposes `pop(element)`, `unpop(element)`, `toggle(element, goto)`, and `trigger(element, action)` through `$ae.ext.present`. A mounted element also has controller methods:

```js
const panel = $ae("details").present;
await panel.pop();
await panel.unpop();
```

Each method returns a Promise that resolves after preparation and transition cleanup, including the final visibility, classes, ARIA state and events. Present manages `hidden`, `aria-expanded`, `ae--pop`, `ae--popping`, and `ae--unpopping` on the main `data-ae-present` container and updates `aria-expanded` and `aria-controls` on its triggers.

Calling `pop(element)` starts a fresh opening even when the region is already open or opening. It interrupts any active transition, removes presentation state classes, hides the region immediately, and starts the new pop from its hidden state. `toggle(element, true)` keeps its existing idempotent behavior.

`data-ae-present-motion` is optional. A direct child with that attribute keeps the grid strategy for `height` and `width` transitions, without measuring the final dimensions explicitly. Without it, Present leaves the content in place, records `INFO_PRESENT_MEASURED_LAYOUT` (`3001`) for size transitions, measures the visible container, and animates `max-height` and `max-width` in pixels. This path incurs a layout read. Explicit `height` and `width` values in the container's styles determine the measured final size. Temporary inline maximum dimensions are restored after a transition or interruption. All visibility, classes, and ARIA state remain on the main `data-ae-present` element.

Before starting a transition from a stable state, Present makes the container available for layout, adds `ae--will-change` to it, and waits 100 ms so the browser can prepare the declared properties. During this preparation, the existing `ae--pop` or `ae--popping` state remains intact; it is replaced atomically when `ae--popping` or `ae--unpopping` is applied. When an active transition is reversed, Present preserves `ae--will-change` and starts the replacement transition without repeating the preparation delay. Measured-size transitions without that delay wait one layout frame to separate their starting and ending sizes. The class is removed after the final transition finishes or when a transition is interrupted without a replacement. The stable open state uses `ae--pop` on the container.

The generated `aellux.ext.present.css` stylesheet treats the whitespace-separated `data-ae-present` value as a list of transition instructions. `opacity` controls opacity and `transform` controls transform. `height` and `width` control `grid-template-rows` and `grid-template-columns` when a direct motion child exists, or measured `max-height` and `max-width` when it does not. Values can be used alone or in any combination, such as `data-ae-present="opacity height"`. An empty attribute remains empty and disables the transition with zero duration. The value `all` expands to `opacity transform height width` during mount and is restored to its original value on unmount.

The `--ae-from-height`, `--ae-pop-height`, and `--ae-unpop-height` properties define the height keyframes, while `--ae-from-width`, `--ae-pop-width`, and `--ae-unpop-width` define the width keyframes. Its minified counterpart is `aellux.ext.present.min.css`; the boot runtime selects the variant that matches the loaded Aellux script. CSS custom properties `--ae-pop-duration` and `--ae-unpop-duration` on the container set the corresponding duration. When the document root has `data-ae-reduced-motion="reduced"`, the generated stylesheet disables transitions. When it has `data-ae-low-hardware`, Present uses stepped easing and derives the step count from the transition duration; `--ae-pop-low-steps` and `--ae-unpop-low-steps` can override those counts. The Extension emits cancelable `AelluxJsBeforePop` and `AelluxJsBeforeUnpop` events immediately, waits through the preparation period, then emits `AelluxJsPopping`/`AelluxJsUnpopping` and finally `AelluxJsPop`/`AelluxJsUnpop` as transitions progress. After each completed Pop or Unpop, it emits a bubbling `AelluxJsLayout` event from the Present element to notify layout observers such as Anchor.

When an `unpop` hides a region containing the active element, Present releases focus if the browser has not already done so, then dispatches `UnpopFocusLost` through `AelluxJs.dispatch`. If the active element is outside the region at the time it becomes hidden, no focus event is dispatched.

`data-ae-auto-unpop` specifies a delay before closing an open container. Outside clicks also close open containers unless `data-ae-unpop-on-outside="false"` is set. On unmount, the mount helper restores the initial `data-ae-*`, `aria-*`, and `hidden` attributes on each mounted container and trigger control.
