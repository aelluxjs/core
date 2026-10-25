# Feedback Extension

Standard motion effects replace `transform` on the resolved `data-ae-target-transform` element (the boundary itself by default). Keep that element separate from Anchor positioning, an Elastic Scrollbox wrapper, or Present transform. In development, an inspectable replacing transform effect records diagnostic `2033` with its writers. Animate a child to compose those behaviors; opacity-only custom effects and additive transforms do not trigger that warning.

`feedback` sends structured feedback events, lets application code subscribe by type, and updates mounted feedback boundaries. It is included in the `full` runtime. Basic automatically registers this Extension for lazy loading; opt into its stylesheet with `$ae.ext("feedback", { loadStyle: true })` to include the standard motion styles, or omit `loadStyle` if animations are unnecessary.

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
         data-ae-target-message="email-message"
         data-ae-target-transform="email-field">
  <label for="email-field">Email</label>
  <input id="email-field" type="email" aria-describedby="email-message">
  <p id="email-message" role="alert"></p>
</section>
```

`data-ae-target-message` and `data-ae-target-transform` accept an element ID, with or without `#`. If omitted, each target is the boundary itself. The message updates the first direct text node of the message target, or appends a text node if none exists. Child elements are preserved. A missing or invalid target ID records `WARN_INVALID_ELEMENT_OR_ID` (`2011`) and skips that target. Boundaries are mounted and unmounted with the normal DOM lifecycle.

The transform target receives `ae--feedback-motion-{motion}` for the duration declared by CSS. A new event cancels the previous owned motion and replaces its class. The shared [CSS Motion Controller](../runtime/css-motion.md) controls compatible animations through `waitLayout`; custom keyframes remain browser-interpolated. Set `--ae-feedback-aellux-ease` to an `$ae.ease()` name for optional advanced controlled easing. The generated stylesheet provides `shake`, `yes`, `no`, `breathe`, `tremble`, `pulse`, and `alert`; reduced motion disables them. A custom motion name can be supplied by application CSS and records an informational diagnostic.

## Accessibility profile

- **Capabilities:** event distribution, boundary text updates, and optional motion classes.
- **Owned state:** subscriptions, mounted listeners, motion classes, and CSS Motion operations.
- **Consumer responsibility:** choose suitable semantics, live region priority, and focus behavior. `announce()` publishes an event but does not create a live region.
- **Motion:** the generated styles respect the AelluxJs reduced-motion attribute. Application supplied motion styles must handle reduced motion themselves.
