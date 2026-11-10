# Feedback Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

Stability describes implementation maturity and validation, not API compatibility. Only the [minimal initialization and declarative activation/mounting contract](../runtime/compatibility-commitment.md) is protected during `0.1.x`.

Feedback owns semantic communication and message application. Visual effects are optional requests to Present through `$ae.comm`; Feedback owns no animation operations, temporary motion classes or keyframes. The `motion` payload remains an effect request. Without Present, events, subscriptions, messages and semantic classes continue to work.

`feedback` sends structured feedback events, lets application code subscribe by type, and updates mounted feedback boundaries. It is included in the `full` runtime. In Basic, register it with `$ae.ext("feedback")`. For visual effects, also register `$ae.ext("present", { loadStyle: true })` and mount a containing `data-ae-present` region. Add `loadWhen: "[data-ae-feedback]"` for lazy loading.

```js
const feedback = await $ae.wait("feedback");
const subscription = feedback.on("warning", ({ message }) => {
  console.warn(message);
});

feedback.warning("Check the form before continuing.");
subscription.off();
```

## Publishing feedback

The convenience methods are `warning(message, target?, value?, motion?)`, `error(...)`, `success(...)`, `announce(...)`, `busy(...)`, `validate(...)`, and `progress(...)`. The argument order is the same for all seven methods. `send({ type, message, target, value, motion })` accepts the same fields. `type` must be one of those seven names and `message` must be a string. `target`, when supplied, must be a DOM element; otherwise the event starts at `document`. `value` is passed through to consumers. `motion` is an optional string.

```js
const field = document.getElementById("email");
feedback.error("Enter a valid email address.", field, null, "shake");
feedback.progress("Uploading…", field, 0.5);
```

Each call dispatches a bubbling, cancelable `AelluxJsFeedback` event from the target. Its `detail` contains `{ type, message, value, target, motion }`. `on(type, handler)` subscribes to one type; `on("*", handler)` receives every type. Use `off(type, handler)` or the object returned by `on()` to unsubscribe. Subscribers run after the event dispatch, even when a boundary stops propagation or a listener cancels the event. The Extension clears subscriptions when destroyed.

## Mounted feedback boundaries

Mounted elements expose a `feedback` controller with `warning(message, value?, motion?)`, `error(...)`, `success(...)`, `announce(...)`, `busy(...)`, `validate(...)`, `progress(...)`, and `send({ type, message, value, motion })`. These methods dispatch from the mounted element automatically; `send()` also uses that element if its payload contains a different `target`. The controller is removed on unmount and recreated on remount.

```js
const boundary = document.querySelector("[data-ae-feedback]");
const controller = $ae.mountManager.controller(boundary);
controller.feedback.error("Check the form.", null, "shake");
controller.feedback.send({ type: "progress", message: "Uploading", value: 0.5 });
```

Add `data-ae-feedback` to an element to handle feedback events that reach it. An empty value accepts every type; a space-separated list accepts only the named types. The nearest matching boundary stops propagation. A boundary updates the message and applies a type class to itself, the message target, and the effect target. Type classes have the form `ae--feedback-warning`, `ae--feedback-error`, and so on; previously added type classes remain until application code removes them.

```html
<section data-ae-present="" data-ae-feedback="error warning"
         data-ae-feedback-message-target="email-message"
         data-ae-feedback-effect-target="email-field">
  <label for="email-field">Email</label>
  <input id="email-field" type="email" aria-describedby="email-message">
  <p id="email-message" role="alert"></p>
</section>
```

`data-ae-feedback-message-target` and `data-ae-feedback-effect-target` accept an element ID, with or without `#`. If omitted, each target is the boundary itself. The message updates the first direct text node of the message target, or appends a text node if none exists. Child elements are preserved. A missing or invalid target ID records `WARN_INVALID_ELEMENT_OR_ID` (`2011`) and skips that target. Boundaries are mounted and unmounted with the normal DOM lifecycle.

The effect target must belong to a mounted Present. Feedback requests `present.effect` after synchronous message and presentation routing, using the target's closest Present as owner. Present applies `ae--present-effect-{motion}` only when idle and effectively visible, replaces pending effects, cancels them on accepted transitions and skips reduced motion. The seven presets and custom finite CSS animations are described under [Present effects](present.md#temporary-effects). An effect target outside mounted Present remains a semantic destination without animation. A custom effect name still records the informational Feedback diagnostic.

Set `data-ae-present-target` on the boundary to request `Present.pop()` for each accepted feedback event:

| Attribute | Present behavior |
| --- | --- |
| Omitted | No Present request. |
| Empty or whitespace-only | Use the message target's closest `data-ae-present` element, including the target itself. If none exists, use the effect target's closest Present element. Request pop only on that element. |
| Element ID, with or without `#` | Request pop only on that element. |

Feedback updates the text and type classes before requesting the pop, then forwards any requested effect to Present. The call also applies when the Present target is already open, following the usual Present replay behavior, auto-dismiss timing, groups and cancelable `BeforePop` event. Feedback does not await the transition. Present must already be initialized and targets mounted; its public API ignores unmounted elements. In Basic, explicitly register Present as well as Feedback. If Present is unavailable, messages and semantic classes still update, with no visual effect. A hidden target or vetoed opening does not retain an effect for later. An invalid explicit target ID records `2011` when Present is initialized. Automatic discovery falls back to the effect target when the message target is unresolved or has no closest Present element. It does not open additional Present elements or search above the selected nearest container.

```html
<section data-ae-feedback
         data-ae-feedback-message-target="status-message"
         data-ae-feedback-effect-target="status-message"
         data-ae-present-target="status-panel">
  <button id="submit">Submit</button>
</section>
<aside id="status-panel" data-ae-present="opacity" hidden>
  <p id="status-message" role="status"></p>
</aside>
```

The prerelease names `data-ae-message-target` and `data-ae-transform-target` are replaced by `data-ae-feedback-message-target` and `data-ae-feedback-effect-target`. See the [Declarative Action Naming Convention](../extensions/declarative-action-naming.md). A standalone `data-ae-present-target` never creates an interaction control.

Historical measurement before effect migration: the Present integration, including empty-target discovery, and target rename changed the minified Modern script from 4,016/1,738 to 4,298/1,849 raw/gzip level 9 bytes, and Legacy from 8,035/3,557 to 8,394/3,706 bytes. The Modern raw budget increases from 4 to 4.25 KiB; its 2 KiB gzip limit and Legacy's 9/4 KiB limits remain unchanged. Full includes the integration in its existing bundle budgets.

## Accessibility profile

- **Capabilities:** event distribution, boundary text updates, semantic classes and optional effect requests.
- **Owned state:** subscriptions, mounted listeners, message text and semantic feedback classes. Present owns motion classes, cancellation and CSS Motion operations.
- **Consumer responsibility:** choose suitable semantics, live region priority, and focus behavior. `announce()` publishes an event but does not create a live region.
- **Motion:** Present skips effect requests under reduced motion while preserving Feedback semantics.

<h2 id="stacked-notifications">Stacked notifications</h2>

A nonempty `data-ae-present-target` can identify a mounted Present Group. Feedback requests `present.pop-next` through the mediator and prepares the reserved member before `BeforePop` and opening motion. An ordinary Present target continues using `present.pop()`. Empty target discovery retains the closest message Present, then the effect Present fallback. Missing/uninitialized Present leaves Feedback usable.

Without explicit message/effect targets, a group uses its reserved member as both logical destinations. Feedback replaces the first direct text node or appends one, preserving children such as buttons and progress controls. Each member keeps an independent message and current feedback type class; reuse replaces its prior type. Explicit message and effect IDs remain absolute destinations, so sharing one across notifications shares that content/motion instead of isolating it.

```html
<section id="feedback-source" data-ae-feedback data-ae-present-target="notifications"></section>
<div id="notifications" data-ae-present-group="3" aria-live="polite">
  <article id="notice-1" data-ae-present="opacity" data-ae-auto-dismiss="5000"
           data-ae-dismiss-on-click="false" hidden>
    <progress max="100" value="0" data-ae-progress-target="notice-1"
              aria-label="Time until notification closes"></progress>
  </article>
  <article id="notice-2" data-ae-present="opacity" data-ae-auto-dismiss="5000"
           data-ae-dismiss-on-click="false" hidden>
    <progress max="100" value="0" data-ae-progress-target="notice-2"
              aria-label="Time until notification closes"></progress>
  </article>
  <article id="notice-3" data-ae-present="opacity" data-ae-auto-dismiss="5000"
           data-ae-dismiss-on-click="false" hidden>
    <progress max="100" value="0" data-ae-progress-target="notice-3"
              aria-label="Time until notification closes"></progress>
  </article>
</div>
```

After mounting, publish normally: `$ae("feedback-source").feedback.success("Saved.")`. The group explicitly sets capacity to three, bounded by the three HTML members; a fourth message reuses the oldest active slot and resets only its auto-dismiss. An empty group value defaults to one. No application timer or member-selection code is needed. Basic registers Feedback, Present and [Progress](optional/progress.md) explicitly; Full registers them automatically.

Use opacity-only Present motion when animating Feedback on the same member. To combine transform animations, give Feedback an explicit descendant effect target and keep Present's transform on the outer member; do not have both replace one transform. Explicit descendant IDs are absolute, so configure independent sources/targets if per-member nested motion is required. Live-region announcements and reading time remain application responsibilities.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Delivery | Known Limit | <span class="large">A matching boundary stops DOM propagation, but typed and wildcard subscriptions still run after send() dispatches the event, even if it is canceled.</span> | <span class="large">Coordinate boundary rendering and subscriptions; event cancellation does not cancel subscribers.</span> |
| Rendering | Known Limit | <span class="large">Boundaries update the first direct text node and retain child markup. Ordinary boundaries retain accumulated type classes until application code removes them; grouped notifications replace the previous type on their resolved targets. announce() creates no live region.</span> | <span class="large">Choose message targets, reset obsolete type styling for ordinary boundaries and supply appropriate announcement semantics.</span> |
| Motion | Potential Risk | <span class="large">Present presets need an untransformed effect target inside mounted Present; incompatible preset targets are skipped and diagnosed.</span> | <span class="large">Animate a separate descendant; see the transform ownership guidance at the start of this page.</span> |
| Messages | Potential Risk | <span class="large">Frequent feedback or multiple renderers can repeat announcements and work. Message and value payloads are visible to application subscribers.</span> | <span class="large">Coalesce progress, avoid duplicate rendering and exclude sensitive data from shared messages.</span> |
| Coverage | Validation Gap | <span class="large">Boundary text, filtering, argument checks, motion and explicit Present targets have automated checks; these do not validate live-region announcements in real screen readers.</span> | <span class="large">Review announcement priority and repetition with the target assistive technologies.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/release/0.1.0/src/aellux.ext.feedback.js), [feedback.spec.mjs](https://github.com/aelluxjs/core/blob/release/0.1.0/tests/browser/feedback.spec.mjs), [extension-composition.spec.mjs](https://github.com/aelluxjs/core/blob/release/0.1.0/tests/browser/extension-composition.spec.mjs).

## Effect distribution change

Present now ships the presets and the effect controller. Feedback Modern changes from 4,918 / 2,117 to 4,666 / 2,050 bytes (raw / gzip level 9), Legacy from 9,167 / 3,991 to 8,980 / 3,903, and CSS from 2,790 / 541 to a licensed empty artifact of 74 / 94 bytes. Basic loads Present only when visual effects are needed. See [the complete before/after table and budget changes](present.md#effect-distribution-cost), including Full and selective Present loading.
