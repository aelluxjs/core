# Feedback Extension

`feedback` sends structured feedback events and lets application code subscribe to feedback types. It is included in the `full` runtime. In `basic` mode, register it with `$ae.ext("feedback")`.

```js
const feedback = await $ae.wait("feedback");
const subscription = feedback.on("warning", ({ message }) => {
  console.warn(message);
});

feedback.warning("Check the form before continuing.");
subscription.off();
```

The convenience methods are `warning(message)`, `error(message)`, `success(message)`, and `announce(message)`. For a target element, use `busy(target, message, value)`, `validate(target, message, value)`, or `progress(target, message, value)`. `send({ type, message, value, target })` handles custom types; `target` defaults to `document`.

Each call dispatches an `AelluxJsFeedback` event from the target. Its `detail` contains `{ type, message, value, target }`. `on(type, handler)` subscribes to one type; `on("*", handler)` receives every type. Use `off(type, handler)` or the object returned by `on()` to unsubscribe. The Extension clears subscriptions when destroyed.

The Extension emits feedback; it does not render a toast, alert, or progress indicator by itself.
