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
| `read(id, callback, parameters?)` | Queue one identified read. | Promise of the callback's return value. |
| `update(id, callback, parameters?)` | Queue one identified update. | Promise of the callback's return value. |
| `sequence(id, ...stages)` | Run ordered, optionally repeated read/update cycles. | Promise of `{ id, status }`. |
| `cancel(id)` | Cancel work owned by one numeric ID. | `true` if that ID had work. |
| `clear()` | Cancel queued layout work during full runtime destruction. | <span style="white-space: normal !important;">Queued Promises resolve with `undefined`; their callbacks do not run.</span> |

The optional `parameters` argument is an array passed as the callback's arguments. IDs must be safe integers, including `0`. Calls without an ID keep their original independent queue behavior. These methods schedule work; they do not observe future changes automatically.

## Adaptive frame rate

`waitLayout` samples `requestAnimationFrame()` timestamps while it has frame work. It starts at the browser's measured frame rate and, after sustained slow frames or expensive callbacks, selects the nearest 15-FPS budget at or below the observed cadence, down to 5 FPS. A severe drop therefore reaches the fitting low budget in one adjustment; for example, a 60 FPS budget observed at 10 FPS falls directly to 5 FPS. When every budget is above the observed cadence, it uses the 5 FPS floor. It tries to recover one step after a longer stable period. The limiter skips work on selected browser frames; it never runs catch-up frames. It pauses work while the page is hidden and resumes from a fresh measurement when visible. CSS animations and native rendering remain under browser control. There is no ongoing frame monitor when the queue is idle.

## Identify and replace related work

An ID can hold one pending read and one pending update. They form a group. Adding the other phase joins that group; queuing a second task for the same phase cancels both pending tasks in the old group and starts a new group. Canceled task Promises resolve with `undefined`.

```js
const layoutId = 100;

function refresh() {
  $ae.waitLayout.read(layoutId, () => panel.getBoundingClientRect());
  $ae.waitLayout.update(layoutId, () => panel.classList.add("ready"));
}

function unmount() {
  $ae.waitLayout.cancel(layoutId); // Does not affect another ID.
}
```

Use a distinct ID for each independent feature or mounted instance. A new `sequence()` with an existing ID replaces all pending work for that ID. An external `read()` or `update()` with the sequence's ID also replaces that sequence. Results from canceled asynchronous reads cannot start its old update.

## Run a sequence

Each stage can define `read`, `update`, or both. A synchronous read passes its result to the update in the same eligible frame when possible. An asynchronous read is awaited without blocking other work; its update runs in a later eligible frame. Stages run in the order supplied.

```js
const result = await $ae.waitLayout.sequence(200,
  {
    read: () => panel.getBoundingClientRect(),
    update: rect => panel.style.setProperty("--width", `${rect.width}px`)
  },
  {
    read: () => panel.scrollTop,
    update: top => indicator.style.transform = `translateY(${top}px)`,
    repeat: { ms: 100, times: 20 },
    maxFPS: 30,
    abort: () => !panel.isConnected
  }
);
// result.status: "completed", "aborted", "superseded", or "cleared"
```

`repeat.ms` and `repeat.s` are alternative minimum intervals, counted from the end of the previous cycle. `repeat.times` includes the first cycle. An interval without `times` repeats until the sequence is canceled, replaced, aborted, or cleared. `times` alone repeats on subsequent eligible frames. Cycles never overlap or accumulate after a pause. When `maxFPS` is omitted, a repeated stage runs on every eligible browser frame, subject only to its `repeat` interval and the adaptive global limit. When provided, `maxFPS` caps complete read-to-update cycles; the adaptive global limit may lower them further.

`abort` may be a function, an `AbortSignal`, or an `AbortController`. A function must synchronously return a boolean; it is checked before a cycle and before callbacks that have waited in the queue. A signal stops the entire sequence immediately when its controller is aborted, including while an asynchronous read or repeat timer is pending. A signal supplied to a later stage is active from the start of the sequence. Already aborted signals prevent the first callback from running.

```js
const controller = new AbortController();
const work = $ae.waitLayout.sequence(300, {
  read: () => panel.getBoundingClientRect(),
  update: rect => panel.style.width = `${rect.width}px`,
  repeat: { ms: 100 },
  abort: controller.signal // abort: controller also works.
});

function unmount() {
  controller.abort();
}

const result = await work; // { id: 300, status: "aborted" } after abort()
```

Callback errors reject the sequence Promise and stop that sequence; other IDs continue. `cancel(id)` resolves an active sequence with `{ id, status: "aborted" }`. Full runtime destruction calls `clear()`, resolving sequences with `"cleared"`.

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

This keeps the latest scroll position without queuing one read and one write for every event. The `dirty` flag preserves notifications that arrive while a task is pending. An Extension may call `cancel(itsId)` during unmount. Do not call `$ae.waitLayout.clear()` from an Extension's unmount: it clears the runtime's shared queues, including work owned by other Extensions. The runtime calls it during full destruction.

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

Present Group notifications describe accepted logical state before visual completion. Anchor schedules its measurement through WaitLayout and tracks a Present `Layout` event only for its announced duration, including an eligible final placement. A hidden or unavailable target leaves the Anchor inactive until a relevant mutation, layout or observer notification makes it measurable. This does not add permanent retry polling. Unmount cancels the feature's layout IDs; global destruction also clears the scheduler.
