# Progress Extension

**Distribution:** Optional Extension. **Stability:** Not stable.

Progress mounts `progress, meter` without a `data-ae-progress` marker. `<progress>` describes task completion; omit `value` for indeterminate work. `<meter>` describes a scalar measurement in a known range, such as storage usage. It is not a task timer.

## Loading and native controls

Full automatically registers Progress and requests its signed script only when matching markup is mounted. Basic requires explicit registration:

```html
<progress id="download" max="100" aria-label="Download"></progress>
<meter min="0" max="100" low="20" high="80" optimum="10" value="35"
       aria-label="Storage used"></meter>
<script src="./dist/aellux.js"></script>
<script>
  $ae.ext("progress", { loadWhen: "progress, meter" });
  $ae.init({ mode: "basic" });
</script>
```

Use the native element properties directly: `progress.value`, `progress.max`, `progress.position`, and `meter.value/min/max/low/high/optimum`. The Extension adds no alternative setters and keeps no duplicate numeric state. Native elements receive no replacement children, appearance rules or ARIA attributes.

## Generic progress producers

Only `<progress>` accepts `data-ae-progress-target="producer-id"`, with or without `#`. It listens directly on the resolved existing element:

```html
<section id="operation"></section>
<progress max="200" data-ae-progress-target="operation" aria-label="Operation"></progress>
```

```js
$ae.dispatchFrom(document.getElementById("operation"), "Progress", {
  bubbles: false,
  cancelable: false,
  detail: { value: 25, max: 100 }
});
// The consumer now has value 50 and retains max 200.
```

`AelluxJsProgress` is independent of this Extension and Feedback. Any producer can emit it, and multiple controls can consume the same producer. Both values must be finite numbers, `max > 0`, and `0 <= value <= max`; invalid payloads are ignored. The consumer computes `value / max * progress.max`. A valid first event makes an indeterminate control determinate. `<meter>` does not consume temporal progress. `feedback.progress()` continues publishing the separate `AelluxJsFeedback` contract.

## Present auto-unpop

```html
<section id="notification" data-ae-present="opacity" data-ae-auto-unpop="5000" hidden>
  Operation completed.
  <progress max="100" value="0" data-ae-progress-target="notification"
            aria-label="Time until notification closes"></progress>
</section>
```

Present emits zero after opening completes, monotonically elapsed progress while waiting, and one before requesting closure. Detail includes `status: "running"` or `"completed"`, `elapsedMs`, `durationMs`, and `remainingMs`. The timer remains independent of motion duration/easing. A canceled `BeforeUnpop` leaves completed progress at one without retrying. See [Present](../present.md) and the [stacked Feedback example](../feedback.md#stacked-notifications).

## Modern and Legacy compatibility

The four artifacts are `aellux.ext.progress.js`, `aellux.ext.progress.min.js`, `aellux.ext.progress.legacy.js`, and `aellux.ext.progress.legacy.min.js`. Modern uses native controls. Bootstrap probes each tag separately, including numeric reflection and partial APIs; missing capabilities select Legacy. Forced Legacy preserves complete native implementations.

Only the Legacy Extension includes the small Aellux fallback. Unsupported tags receive element-local property descriptors, a noninteractive visual bar and ARIA range semantics. Attributes remain the source of truth. Determinate progress fills proportionally; indeterminate progress uses a striped full-width indicator (solid where CSS gradients are unsupported). Meter clamps ranges and indicates optimum/suboptimum regions with color. Existing children and authored attributes remain intact. No additional script or stylesheet is requested; no fallback implementation is included in Core, Orchestrator or Full.

The implementation is original Apache-2.0 code, adding no third-party dependency or notice. Evaluated alternatives were [Lea Verou's MIT Progress polyfill](https://github.com/LeaVerou/HTML5-Progress-polyfill) (separate CSS and obsolete DOM mutation events) and [fisker's MIT meter-polyfill](https://github.com/fisker/meter-polyfill) (a larger standalone implementation with document-wide installation). Their code is not incorporated. Distribution costs are recorded in the [implementation report](../../progress-implementation-report.md).

## Lifecycle

Mount priority is `-1`, before Present starts initially visible timers. Dynamic subtrees use `$ae.mount(subtree)` and `$ae.unmount(subtree)`. Changing `data-ae-progress-target` reconnects the listener automatically; `$ae(element).progress.update()` retries resolution when a target is inserted later. Missing/invalid IDs use the existing element/ID diagnostic.

Unmount/destroy disconnect listeners and observers and restore the original `value` attribute, including its absence. Legacy also removes its generated bar, restores managed styles/ARIA, and restores original own-property descriptors. Remount creates a fresh integration. Native `max` remains application-owned.

## Accessibility Profile

Provide an accessible name with `<label>`, `aria-label` or `aria-labelledby`; do not rely on color alone to explain meter ranges. Native controls retain platform semantics. For unsupported Legacy tags, prefer explicit `aria-label` or `aria-labelledby`, since native label association may be unavailable. The fallback supplies range roles and values and omits `aria-valuenow` for indeterminate progress. No focusable or interactive controls are added. Automatic closing notifications need an application-appropriate announcement strategy and sufficient reading time.

## Known Limits & Risks

| Area | Classification | Boundary |
| --- | --- | --- |
| Rendering | Known Limit | Fallback visuals are functional, not pixel-equivalent to native controls. External CSS can override their appearance. |
| Target discovery | Known Limit | A missing target requires an update or retarget after insertion. IDs resolve in the document. |
| Lifecycle | Known Limit | Values changed while mounted restore to their original mount snapshot on unmount. Direct native calls remain available. |
| Compatibility | Validation Gap | Simulated missing/partial APIs in current engines and ES5 builds do not establish support on every historical browser. DOM property descriptors and MutationObserver are required. |
| Accessibility | Validation Gap | Automated range checks do not establish physical assistive-technology equivalence. Test the required browser/screen-reader combinations. |
