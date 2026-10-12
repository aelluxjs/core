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
  <button type="button" data-ae-dismiss>Close</button>
  Content
</section>
```

`data-ae-trigger` accepts `pop`, `unpop`, or `toggle`; an unrecognized value also toggles. `data-ae-target` and `data-ae-dismiss` can select targets with CSS selectors. Without a selector, a trigger or dismiss control acts on its closest `data-ae-present` container. Invalid selectors are reported through diagnostics.

A trigger or dismiss control with neither a selector nor a containing `data-ae-present` reports `ERROR_PRESENT_CONTROL_TARGET_MISSING` (`1111`).

## Motion and state

The Extension exposes `pop(element)`, `unpop(element)`, `toggle(element, goto)`, and `trigger(element, action)` through `$ae.ext.present`. Each method returns a Promise that resolves after preparation and transition cleanup, including the final visibility, classes, ARIA state and events. It manages `hidden`, `aria-expanded`, `ae--pop`, `ae--popping`, and `ae--unpopping` on the main `data-ae-present` container and updates `aria-expanded` and `aria-controls` on its triggers.

Every Present container uses a direct child marked with `data-ae-present-motion` for opacity and transform. When that child is absent, the Extension creates a `div` wrapper, marks it with `data-ae-present-motion="auto"`, and moves all existing child nodes into it. Unmounting removes an automatically generated wrapper and returns its child nodes to their original container. A supplied direct motion child is reused and preserved.

Before starting either transition, Present makes the container available for layout, adds `ae--will-change` to it, and waits 100 ms so the browser can prepare the container and its motion child through the generated CSS. It then adds `ae--popping` or `ae--unpopping` to the container. The temporary `ae--will-change` class is removed when the transition finishes or is interrupted; the stable open state uses `ae--pop` on the container.

The generated `aellux.ext.present.css` stylesheet limits the motion child to opacity and transform transitions. An empty `data-ae-present` value uses only those transitions; `data-ae-present="height"` also transitions the container's grid rows, `data-ae-present="width"` transitions its grid columns, and `data-ae-present="width height"` transitions both axes. The `--ae-from-height`, `--ae-pop-height`, and `--ae-unpop-height` properties define the height keyframes, while `--ae-from-width`, `--ae-pop-width`, and `--ae-unpop-width` define the width keyframes. The motion child also receives layout and paint containment. Its minified counterpart is `aellux.ext.present.min.css`; the boot runtime selects the variant that matches the loaded Aellux script. CSS custom properties `--ae-pop-duration` and `--ae-unpop-duration` on the container set the corresponding duration. When the document root has `data-ae-reduced-motion="reduced"`, the generated stylesheet disables transitions. When it has `data-ae-low-hardware`, Present uses stepped easing and derives the step count from the transition duration; `--ae-pop-low-steps` and `--ae-unpop-low-steps` can override those counts. The Extension emits cancelable `AelluxJsBeforePop` and `AelluxJsBeforeUnpop` events immediately, waits through the preparation period, then emits `AelluxJsPopping`/`AelluxJsUnpopping` and finally `AelluxJsPop`/`AelluxJsUnpop` as transitions progress.

When an `unpop` hides a region containing the active element, Present releases focus if the browser has not already done so, then dispatches `UnpopFocusLost` through `AelluxJs.dispatch`. If the active element is outside the region at the time it becomes hidden, no focus event is dispatched.

`data-ae-auto-unpop` specifies a delay before closing an open container. Outside clicks also close open containers unless `data-ae-unpop-on-outside="false"` is set. On unmount, the mount helper restores the initial `data-ae-*`, `aria-*`, and `hidden` attributes on each mounted container and trigger control, while Present restores any content moved into an automatic motion wrapper.
