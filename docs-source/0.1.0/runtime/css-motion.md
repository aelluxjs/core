# CSS Motion Controller

`AelluxJs.motion` coordinates CSS transitions and CSS animations with `waitLayout`. CSS remains responsible for properties, keyframes, duration, delay, iterations and the normal CSS easing. In browsers with sufficient Web Animations API support, Aellux pauses only the animations created by the requested state change and advances their `currentTime` from a monotonic clock. `waitLayout.sequence()` decides which frames perform those updates, including adaptive FPS reduction and the element's optional `data-ae-maxfps` limit.

The controller intentionally accepts a small main-thread cost under ideal conditions. Its purpose is predictable degradation: if the browser begins missing frames because of a constrained device or competing applications, the shared scheduler can reduce update frequency instead of allowing managed motion to contribute to stalls.

Controlled operations containing any animated property other than `transform` and `opacity` have a conservative default ceiling of 40 FPS. Configure it with `cssMotionPropertyMaxFPS` in `init()`. This is a workload policy, not a promise that `transform` or `opacity` stays on the GPU: browser composition and painting still depend on the document and device. Classification applies to the whole operation. If one transition combines `opacity`, `transform`, and `height`, all captured animations share one clock at the lowest applicable limit from `data-ae-maxfps`, `run({ maxFPS })`, and `cssMotionPropertyMaxFPS`; properties never receive independent schedules.

```js
$ae.init({
  mode: "full",
  cssMotionPropertyMaxFPS: 40
});
```

Use `0` or `null` to disable this special property ceiling. This does not disable
the adaptive `waitLayout` scheduler or an element's `data-ae-maxfps` limit.
Omitting the option (or passing `undefined`) retains the 40 FPS default.

```js
const motionId = $ae.motion.id();
await $ae.motion.run(panel, {
  id: motionId,
  apply: () => panel.classList.add("open"),
  maxFPS: $ae.layoutMaxFPS(panel),
  abort: () => !panel.isConnected
});
```

`run()` returns `{ id, status, mode }`. `mode` is `"controlled"`, `"native"`, or `"reduced"`. A new operation with the same ID replaces the previous operation. `$ae.motion.cancel(id)` cancels owned scheduler work and releases captured animations.

## Native fallback and disabling control

Set the global initialization option `cssMotionController` to `false` to disable temporal control completely:

```js
$ae.init({ mode: "full", cssMotionController: false });
```

The option defaults to `true`. When disabled, or when the browser lacks reliable `getAnimations()`, `pause()`, mutable `currentTime`, or computed timing, state classes and CSS are still applied normally. The controller does not pause frames, create a progress sequence, or impose a JavaScript FPS limit. No Web Animations polyfill is loaded.

## Advanced Aellux easing

Controlled motion can opt into an easing name supported by `$ae.ease()`. When the browser accepts CSS `linear()`, the controller samples the Aellux curve into a native timing function and lets the browser continue interpolating the CSS properties. Samples retain values outside `0..1`, preserving Back and Elastic overshoot without applying the original CSS easing a second time.

Present reads `--ae-pop-aellux-ease` and `--ae-unpop-aellux-ease`. Feedback reads `--ae-feedback-aellux-ease` from its transform target.

```css
.panel {
  --ae-pop-ease: ease-out;
  --ae-pop-aellux-ease: elasticOut;
}
.field { --ae-feedback-aellux-ease: bounceOut; }
```

Always keep a valid CSS fallback such as `linear`, `ease`, `ease-in`, `ease-out`, or `ease-in-out`. Advanced Aellux names are never inserted directly into CSS timing properties. If sampled `linear()` is unsupported, the declared CSS easing remains in effect. Reduced motion bypasses intermediate controlled frames while preserving state and completion lifecycle.
