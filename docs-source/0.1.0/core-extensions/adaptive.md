# Adaptive Extension

`adaptive` adds size and shape classes to elements marked with `data-ae-adaptive`. It is included in the `full` runtime and automatically requests its stylesheet there. In `basic` mode, register it with `$ae.ext("adaptive", { loadStyle: true })` before initialization.

```html
<div data-ae-adaptive>Responsive content</div>
```

The Extension measures each marked element with `ResizeObserver`, or uses the window resize event when that API is unavailable. It applies one shape class (`ae--shape-vertical`, `ae--shape-square`, or `ae--shape-horizontal`) according to width divided by height. It also toggles `ae--fits-<size>` classes when `sqrt(width * height)` reaches each configured minimum. After an update it dispatches `AelluxJsAdaptiveUpdate` from the element. Unmounting restores the element's initial attributes, including its classes and inline style.

## Configuration

Pass `adaptiveParams` through the Extension options. Each supplied group is merged with its defaults:

```js
$ae.init({
  mode: "full",
  extensions: {
    adaptive: {
      adaptiveParams: {
        minSizes: { medium: 800 },
        ratioShapes: { vertical: 0.8, horizontal: 1.25 }
      }
    }
  }
});
```

The default size thresholds are `compact: 0`, `small: 480`, `medium: 768`, `large: 1024`, `xl: 1280`, and `xxl: 1600`. The default shape thresholds are `vertical: 0.8` and `horizontal: 1.25`. `adaptiveParams.experienceScale` also contains `near: 1` and `far: 1.5`, but the current class calculation does not use those values.

The generated `aellux.ext.adaptive.css` supplies state-based utility classes. Load it when using those utilities outside the `full` runtime.
