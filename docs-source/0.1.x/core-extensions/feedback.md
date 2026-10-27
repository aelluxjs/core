# Feedback Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

Standard motion effects replace `transform` on the resolved `data-ae-transform-target` element (the boundary itself by default). Keep that element separate from Anchor positioning, an Elastic Scrollbox wrapper, or Present transform. In development, an inspectable replacing transform effect records diagnostic `2033` with its writers. Animate a child to compose those behaviors; opacity-only custom effects and additive transforms do not trigger that warning.

`feedback` sends structured feedback events, lets application code subscribe by type, and updates mounted feedback boundaries. It is included in the `full` runtime. In Basic, register it explicitly with `$ae.ext("feedback", { loadStyle: true })` to include the standard motion styles, or omit `loadStyle` if animations are unnecessary. Add `loadWhen: "[data-ae-feedback]"` for lazy loading.

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

Add `data-ae-feedback` to an element to handle feedback events that reach it. An empty value accepts every type; a space-separated list accepts only the named types. The nearest matching boundary stops propagation. A boundary updates the message and applies a type class to itself, the message target, and the transform target. Type classes have the form `ae--feedback-warning`, `ae--feedback-error`, and so on; previously added type classes remain until application code removes them.

```html
<section data-ae-feedback="error warning"
         data-ae-message-target="email-message"
         data-ae-transform-target="email-field">
  <label for="email-field">Email</label>
  <input id="email-field" type="email" aria-describedby="email-message">
  <p id="email-message" role="alert"></p>
</section>
```

`data-ae-message-target` and `data-ae-transform-target` accept an element ID, with or without `#`. If omitted, each target is the boundary itself. The message updates the first direct text node of the message target, or appends a text node if none exists. Child elements are preserved. A missing or invalid target ID records `WARN_INVALID_ELEMENT_OR_ID` (`2011`) and skips that target. Boundaries are mounted and unmounted with the normal DOM lifecycle.

The transform target receives `ae--feedback-motion-{motion}` for the duration declared by CSS. A new event cancels the previous owned motion and replaces its class. The shared [CSS Motion Controller](../runtime/css-motion.md) controls compatible animations through `waitLayout`; custom keyframes remain browser-interpolated. Set `--ae-feedback-aellux-ease` to an `$ae.ease()` name for optional advanced controlled easing. The generated stylesheet provides `shake`, `yes`, `no`, `breathe`, `tremble`, `pulse`, and `alert`; reduced motion disables them. A custom motion name can be supplied by application CSS and records an informational diagnostic.

Set `data-ae-present-target` on the boundary to request `Present.pop()` for each accepted feedback event:

| Attribute | Present behavior |
| --- | --- |
| Omitted | No Present request. |
| Empty or whitespace-only | Find the closest `data-ae-present` element for each resolved message and transform target, including the target itself. Request pop once per distinct Present element. |
| Element ID, with or without `#` | Request pop only on that element. |

Feedback updates the text and type classes before requesting the pop, then starts any requested feedback motion. The call also applies when the Present target is already open, following the usual Present replay behavior, auto-unpop timing, groups and cancelable `BeforePop` event. Feedback does not await the transition. Present must already be initialized and targets mounted; its public API ignores unmounted elements. In Basic, explicitly register Present as well as Feedback. If Present is unavailable, message and motion handling still run. An invalid explicit target ID records `2011` when Present is initialized. Automatic discovery skips unresolved message/transform targets and does not open further ancestors above their nearest Present element.

```html
<section data-ae-feedback
         data-ae-message-target="status-message"
         data-ae-transform-target="status-message"
         data-ae-present-target="status-panel">
  <button id="submit">Submit</button>
</section>
<aside id="status-panel" data-ae-present="opacity" hidden>
  <p id="status-message" role="status"></p>
</aside>
```

The attributes `data-ae-target-message` and `data-ae-target-transform` have been renamed to `data-ae-message-target` and `data-ae-transform-target`; update existing markup to the new names.

The Present integration, including empty-target discovery, and target rename change the minified Modern script from 4,016/1,738 to 4,298/1,849 raw/gzip level 9 bytes, and Legacy from 8,035/3,557 to 8,394/3,706 bytes. The Modern raw budget increases from 4 to 4.25 KiB; its 2 KiB gzip limit and Legacy's 9/4 KiB limits remain unchanged. Full includes the integration in its existing bundle budgets.

## Accessibility profile

- **Capabilities:** event distribution, boundary text updates, and optional motion classes.
- **Owned state:** subscriptions, mounted listeners, motion classes, and CSS Motion operations.
- **Consumer responsibility:** choose suitable semantics, live region priority, and focus behavior. `announce()` publishes an event but does not create a live region.
- **Motion:** the generated styles respect the AelluxJs reduced-motion attribute. Application supplied motion styles must handle reduced motion themselves.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Delivery | Known Limit | <span class="large">A matching boundary stops DOM propagation, but typed and wildcard subscriptions still run after send() dispatches the event, even if it is canceled.</span> | <span class="large">Coordinate boundary rendering and subscriptions; event cancellation does not cancel subscribers.</span> |
| Rendering | Known Limit | <span class="large">Boundaries update the first direct text node and retain child markup. Type classes accumulate until application code removes them; announce() creates no live region.</span> | <span class="large">Choose message targets, reset obsolete type styling and supply appropriate announcement semantics.</span> |
| Motion | Potential Risk | <span class="large">Standard motion replaces the resolved transform target transform and can compete with Anchor, Present or an elastic wrapper.</span> | <span class="large">Animate a separate descendant; see the transform ownership guidance at the start of this page.</span> |
| Messages | Potential Risk | <span class="large">Frequent feedback or multiple renderers can repeat announcements and work. Message and value payloads are visible to application subscribers.</span> | <span class="large">Coalesce progress, avoid duplicate rendering and exclude sensitive data from shared messages.</span> |
| Coverage | Validation Gap | <span class="large">Boundary text, filtering, argument checks, motion and explicit Present targets have automated checks; these do not validate live-region announcements in real screen readers.</span> | <span class="large">Review announcement priority and repetition with the target assistive technologies.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.feedback.js), [feedback.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/feedback.spec.mjs), [extension-composition.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/extension-composition.spec.mjs).
