# waitLayout

`AelluxJs.waitLayout` schedules layout work in two phases: `read()` runs measurements together at the start of a rendering frame, then `update()` runs DOM and CSS changes after those reads. Both methods return a Promise that resolves with the callback's return value. The API is available after the runtime initializes; `$ae.waitLayout` is the same object.

```js
await $ae.waitLayout.read(() => element.getBoundingClientRect());
await $ae.waitLayout.update(() => element.classList.add("ae--ready"));
```

This reduces forced reflows caused by alternating writes and measurements. A queued task normally waits for a rendering frame. When an `update()` is queued from a completed `read()`, it can run in that frame's update phase. A `read()` queued during the update phase runs in a later frame.

| Method | Use | Result |
| --- | --- | --- |
| `read(callback, parameters?)` | Read geometry or computed styles. | Promise of the callback's return value. |
| `update(callback, parameters?)` | Write styles, attributes, classes, or DOM nodes. | Promise of the callback's return value. |
| `clear()` | Cancel queued layout work during full runtime destruction. | Queued Promises resolve with `undefined`; their callbacks do not run. |

The optional `parameters` argument is an array passed as the callback's arguments. These methods schedule work; they do not observe future changes automatically.

## Measure once, then apply the result

Collect related geometry and computed styles in one read callback. Put every dependent style and DOM mutation in the update callback. Check that an asynchronous result still belongs to the mounted element before applying it.

```js
let revision = 0;
let mounted = true;

async function refresh() {
  const current = ++revision;
  const size = await $ae.waitLayout.read(() => ({
    width: panel.getBoundingClientRect().width,
    available: container.clientWidth,
    display: getComputedStyle(panel).display
  }));
  if (!mounted || current !== revision || !size) return;

  await $ae.waitLayout.update(() => {
    if (!mounted || current !== revision) return;
    panel.style.setProperty("--panel-width", `${size.width}px`);
    panel.classList.toggle("fits", size.width <= size.available);
    panel.dataset.display = size.display;
  });
}

function unmount() {
  mounted = false;
  revision++;
  panel.style.removeProperty("--panel-width");
  panel.classList.remove("fits");
  delete panel.dataset.display;
}
```

The cleanup above illustrates ownership; an Extension that overwrites existing inline values should save their values and priorities at mount and restore them at unmount.

## Coalesce frequent notifications

A scroll, resize, or observer callback may run many times before the next frame. Keep one measurement and publication in flight, and remember if a newer notification arrived while it was running.

```js
let pending = false;
let dirty = false;
let disposed = false;

function scheduleProgress() {
  dirty = true;
  if (pending || disposed) return;
  pending = true;

  $ae.waitLayout.read(() => {
    dirty = false;
    return {
      top: box.scrollTop,
      max: Math.max(0, box.scrollHeight - box.clientHeight)
    };
  }).then(({ top, max }) => $ae.waitLayout.update(() => {
    if (disposed) return;
    box.style.setProperty("--scroll-progress", max ? top / max : 0);
  })).catch(error => {
    console.error(error);
  }).finally(() => {
    pending = false;
    if (dirty && !disposed) scheduleProgress();
  });
}

box.addEventListener("scroll", scheduleProgress, { passive: true });

function unmountProgress() {
  disposed = true;
  box.removeEventListener("scroll", scheduleProgress);
  box.style.removeProperty("--scroll-progress");
}
```

This keeps the latest scroll position without queuing one read and one write for every event. The `dirty` flag preserves notifications that arrive while a task is pending. Do not call `$ae.waitLayout.clear()` from an Extension's unmount: it clears the runtime's shared queues, including work owned by other Extensions. The runtime calls it during full destruction.

## When another frame is necessary

If a measurement must reflect a DOM change made by the Extension, write first and then request a new read. That read runs in a later frame because the current frame's read phase has passed.

```js
await $ae.waitLayout.update(() => panel.classList.add("expanded"));
const expandedHeight = await $ae.waitLayout.read(() => panel.getBoundingClientRect().height);
await $ae.waitLayout.update(() => panel.style.setProperty(
  "--expanded-height", `${expandedHeight}px`
));
```

Use this extra frame only when the second measurement depends on the first write. Reads required to decide an immediate pointer or wheel response can stay synchronous; batch the resulting visual publication when possible. See [Extension Authoring](../extensions/authoring.md#layout-work-in-core-extensions) for the Core Extension rule.
