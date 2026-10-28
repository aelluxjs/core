# Present Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

`present` controls the visibility of elements marked with `data-ae-present`. It is included in the `full` runtime, with CSS supplied by the shared Full stylesheet. In Basic, register it explicitly with `$ae.ext("present", { loadStyle: true })`. Supply `loadWhen` to choose a lazy activation selector, including trigger markup when needed.

## Accessibility profile

- **Capabilities:** interaction and input; structure and state; motion and timing.
- **Owned state:** presentation and `will-change` classes and its changes to `hidden`, `aria-expanded` and `aria-controls`.
- **Consumer responsibility:** use native, named trigger and dismiss controls; ensure configured motion respects reduced-motion preferences; manage focus for dialog, disclosure and similar patterns.
- **Focus on close:** if the active element is inside the region when it becomes hidden, Present releases its focus and emits `AelluxJsUnpopFocusLost` with `detail: { element, focused }`. Focus restoration is handled by the optional Focus Extension.

```html
<button type="button" data-ae-trigger="toggle" data-ae-target="#details">Details</button>
<section id="details" data-ae-present hidden>
  <div data-ae-present-motion>
    <button type="button" data-ae-dismiss>Close</button>
    Content
  </div>
</section>
```

`data-ae-trigger` accepts `pop`, `unpop`, or `toggle`; an unrecognized value records a configuration warning and still toggles. `data-ae-target` and `data-ae-dismiss` each accept one element ID, with or without a leading `#` (for example, `details` or `#details`). Without an ID, a trigger or dismiss control acts on its closest `data-ae-present` container. Invalid, missing and incompatible targets are reported through diagnostics.

A trigger or dismiss control with neither an ID nor a containing `data-ae-present` reports `ERROR_PRESENT_CONTROL_TARGET_MISSING` (`1111`).

## Tap and native click

Present also consumes Point's `AelluxJsTap` notifications through the same trigger, dismiss and outside-activation routing as native click. Add `data-ae-point` to an eligible button, link or role button and mount it with Point. Full registers Point and Present automatically; Basic requires explicit declarations for both Extensions.

```html
<button type="button" data-ae-point data-ae-trigger="toggle" data-ae-target="details">Details</button>
```

Click keeps priority: Present queues a tap fallback with a 32 ms grace period, allowing touch compatibility clicks delivered in a later input task to arrive first. A click reaching Present before that fallback, on the same control or its descendants and with the same pointer ID when reported consistently, cancels the pending tap and performs the action immediately. WebKit can report a touch/pen compatibility click as mouse input with another ID; that pair is matched by its target within the same grace period. A tap without that click performs the action once when its fallback runs. Different controls and different IDs of the same pointer type remain independent, and a later gesture is accepted normally. This deduplication belongs to Present; Point continues to emit tap immediately and native click remains unchanged.

Keyboard clicks keep their normal path. Mouse taps on an already hovered trigger respect the existing hover suppression; touch taps retain their configured action. Unmounting a related Present target or control, unmounting/remounting its Point controller, or destroying Present cancels the pending fallback. Destroy also removes the tap listener.

The integration adds no dependencies. Minified Present grows from 18,858 to 20,037 bytes (gzip: 6,727 to 7,124), and Legacy Present from 26,358 to 27,825 bytes (gzip: 9,329 to 9,760). Budgets change from 18.5 / 6.5 KiB to 20 / 7.25 KiB for Modern and from 26 / 9 KiB to 28 / 9.75 KiB for Legacy. Both preceding gzip artifacts already exceeded their old limits. Combined Full costs are recorded in [Point](point.md#bundle-cost).

## Motion and state

The Extension exposes `pop(element)`, `unpop(element)`, `toggle(element, goto)`, and `trigger(element, action)` through `$ae.ext.present`. A mounted element also has controller methods:

```js
const panel = $ae("details").present;
await panel.pop();
await panel.unpop();
```

Each method returns a Promise. For a transition that remains current, it resolves after preparation and cleanup, including final visibility, classes, ARIA state and completion events. An interrupted request can settle without reaching its requested endpoint; inspect the current operation or state rather than treating the earlier Promise as successful completion. Present manages `hidden`, `aria-expanded`, `ae--pop`, `ae--popping`, and `ae--unpopping` on the main `data-ae-present` container and updates `aria-expanded` and `aria-controls` on its triggers.

After a `BeforePop` or `BeforeUnpop` preflight accepts the action, associated trigger, dismiss and target controls immediately receive the requested `aria-expanded` value, before preparation. The region retains its prior value during the transition and synchronizes to effective CSS visibility at completion. A closing region can therefore remain expanded while its controls already report `false`. Vetoes preserve the accepted state; reversals update controls when accepted, and closing applies `hidden` only when it finishes. CSS that overrides `hidden` can keep the region effectively visible.

Calling `pop(element)` starts a fresh opening even when the region is already open or opening. It interrupts any active transition, removes presentation state classes, hides the region immediately, and starts the new pop from its hidden state. `toggle(element, true)` keeps its existing idempotent behavior.

`data-ae-present-motion` is optional. A direct child with that attribute keeps the grid strategy for `height` and `width` transitions, without measuring the final dimensions explicitly. Without it, Present leaves the content in place, records `INFO_PRESENT_MEASURED_LAYOUT` (`3001`) for size transitions, measures the visible container, and animates `max-height` and `max-width` in pixels. This path incurs a layout read. Explicit `height` and `width` values in the container's styles determine the measured final size. Temporary inline maximum dimensions are restored after a transition or interruption. All visibility, classes, and ARIA state remain on the main `data-ae-present` element.

Before starting a transition from a stable state, Present makes the container available for layout, adds `ae--will-change` to it, and waits 100 ms so the browser can prepare the declared properties. During this preparation, the existing `ae--pop` or `ae--popping` state remains intact; it is replaced atomically when `ae--popping` or `ae--unpopping` is applied. When an active transition is reversed, Present preserves `ae--will-change` and starts the replacement transition without repeating the preparation delay. Measured-size transitions without that delay wait one layout frame to separate their starting and ending sizes. The class is removed after the final transition finishes or when a transition is interrupted without a replacement. The stable open state uses `ae--pop` on the container.

The generated `aellux.ext.present.css` stylesheet treats the whitespace-separated `data-ae-present` value as a list of transition instructions. `opacity` controls opacity and `transform` controls transform. `height` and `width` control `grid-template-rows` and `grid-template-columns` when a direct motion child exists, or measured `max-height` and `max-width` when it does not. Values can be used alone or in any combination, such as `data-ae-present="opacity height"`. When the same container also declares `data-ae-anchor`, Anchor owns `transform`: Present ignores its transform token and excludes transform from its transition properties, while opacity and size motion remain available. Development validation reports `WARN_PRESENT_ANCHOR_TRANSFORM` (`2031`); remove the transform token or animate a child to keep a separate visual transform. The original Present declaration is preserved. An empty attribute remains empty and disables the transition with zero duration. The value `all` expands to `opacity transform height width` during mount and is restored to its original value on unmount.

The `--ae-from-height`, `--ae-pop-height`, and `--ae-unpop-height` properties define the height keyframes, while `--ae-from-width`, `--ae-pop-width`, and `--ae-unpop-width` define the width keyframes. Its minified counterpart is `aellux.ext.present.min.css`; the boot runtime selects the variant that matches the loaded Aellux script. CSS custom properties `--ae-pop-duration` and `--ae-unpop-duration` on the container set the corresponding duration. Present delegates compatible transitions to the shared [CSS Motion Controller](../runtime/css-motion.md), so `waitLayout` controls their update frequency while CSS remains their definition. Optional `--ae-pop-aellux-ease` and `--ae-unpop-aellux-ease` values select an advanced `$ae.ease()` curve in controlled mode; the existing valid CSS easing remains the native fallback. When the document root has `data-ae-reduced-motion="reduced"`, the generated stylesheet disables transitions. Present preserves the configured easing regardless of hardware; it does not derive step counts or override timing functions for low-hardware markers. The Extension emits cancelable `AelluxJsBeforePop` and `AelluxJsBeforeUnpop` events immediately, waits through the preparation period, then emits `AelluxJsPopping`/`AelluxJsUnpopping` and finally `AelluxJsPop`/`AelluxJsUnpop` as transitions progress. It emits a bubbling `AelluxJsLayout` event from the Present element when the transition starts, notifying layout observers such as Anchor. The event carries `detail.origin` as `"present.pop"` or `"present.unpop"` and `detail.durationMs` as the transition time in milliseconds.

When an `unpop` hides a region containing the active element, Present releases focus if the browser has not already done so, then dispatches `UnpopFocusLost` through `AelluxJs.dispatch`. If the active element is outside the region at the time it becomes hidden, no focus event is dispatched.

`data-ae-auto-unpop` specifies a delay before closing an open container. Outside clicks also close open containers unless `data-ae-unpop-on-outside="false"` is set. On unmount, Present restores the attributes it changes on each container and trigger control, including `data-ae-present`, `data-ae-present-motion`, `aria-expanded`, `aria-controls`, and `hidden` where applicable.

## Present Progress

Present registers two inheritable numeric CSS properties on each mounted region. `--ae-pop-progress` advances from 0 to 1 during opening; `--ae-unpop-progress` advances from 0 to 1 during closing. Initially hidden regions have values `0, 1`; initially visible regions have `1, 0`. Both channels reset to zero when a transition starts. Opening finishes at `1, 0`, and closing finishes at `0, 1`. Repeated standalone `pop()` calls restart progress along with the existing visual transition. Reversals reset the previous channel immediately rather than animating it backwards. Unmount restores the original inline values and priorities.

```css
.panel-content {
  opacity: var(--ae-pop-progress, 0);
  transform: translateY(calc(20px * (1 - var(--ae-pop-progress, 0))));
}
```

Put `.panel-content` inside a `data-ae-present="opacity"` region to consume its inherited progress. The properties use the region's existing duration and CSS easing. Registered properties interpolate natively; captured transitions use the same CSS Motion Controller timeline as the other visual properties, including advanced Aellux easing and adaptive WaitLayout scheduling. Present's four progress/phase properties share the lightweight classification of `transform` and `opacity`, so they do not impose the conservative property ceiling by themselves. Height and width transitions still use `cssMotionPropertyMaxFPS` (55 by default), further limited by `data-ae-maxfps` and adaptive FPS. Elapsed time determines duration, independently of the number of updates. Private registered phase properties carry interpolation; the public properties clamp those phases to 0–1, including with overshooting CSS and advanced Aellux easings. Only the active phase is transitioned, so resetting the opposite channel does not animate backwards.

Interpolation is enabled only when all four progress/phase registrations succeed and CSS `clamp()` is supported. A missing API, a thrown registration error, or an already registered name (including a conflicting definition) selects the conservative discrete fallback. The registration API cannot inspect an existing descriptor, so even compatible duplicate registrations do not establish interpolation support. Progress remains numeric and bounded, stable endpoints remain available, and the existing visual transitions continue. Web Animations is optional: disabling the controller or missing its APIs keeps native CSS motion. Reduced motion disables transitions. CSS transition progress has no polyfill or independent animation loop. Auto-unpop temporal progress is a separate event channel described below.

## Present Group

A `data-ae-present-group` container coordinates mounted Present descendants by their own HTML `id`. Membership belongs to the nearest group, so nested groups are independent. Each member needs a unique ID; `data-ae-present-active` and `show(id)` use that exact ID, without a leading `#`.

```html
<div id="views" data-ae-present-group data-ae-present-active="home">
  <section id="home" data-ae-present="opacity">Home</section>
  <section id="settings" data-ae-present="opacity" hidden>
    <button data-ae-dismiss>Close settings</button>
    Settings
  </section>
</div>
```

Changing `data-ae-present-active` starts outgoing and incoming transitions together. One member is selected logically; both may remain visible until the outgoing transition completes. An empty active value clears the selection and closes members. Missing or duplicate member IDs preserve the previous selection and report `WARN_PRESENT_GROUP_SELECTION` (2021). An ID outside the group, in another group or inside a nested group is rejected with the same warning, even if that element exists in the document. The target must be a mounted Present member of this group. With no declared selection, a valid initial visible member is preserved; an all-hidden group stays closed. Multiple initially visible members are diagnosed rather than choosing an arbitrary winner.

### Selection by container class

```html
<div data-ae-present-group class="view-home">
  <section id="home" data-ae-present="opacity"
    data-ae-present-when="view-home">Home</section>
  <section id="settings" data-ae-present="opacity"
    data-ae-present-when="view-settings" hidden>Settings</section>
</div>
```

`data-ae-present-when` names one container class, without a leading dot. It is not a CSS selector. When the active attribute exists, it takes precedence over all classes. Removing the attribute re-enables class selection. No matching class preserves the current state; multiple matching members report diagnostic 2021 and preserve the current selection. A shared MutationObserver watches changes; there is no polling or per-frame group evaluation. Unrelated class changes that keep the selected member do not restart its transition.

### Programmatic selection and lifecycle

```js
await $ae.ext.present.show(document.getElementById("views"), "settings");
// The mounted controller binds the same operation to its container:
await $ae("views").present.show("home");
```

`show()` sets `data-ae-present-active` and uses the same reconciliation as direct attribute changes. Its Promise resolves to `true` for a completed current selection and `false` for invalid, refused or superseded requests. In exclusive mode, member `pop()`, `toggle()`, triggers and dismissals also respect the group selection; opening an already selected member is idempotent in a group. Standalone `pop()` retains its restart behavior.

Unmount during a pending selection resolves that request to `false`; a completed request keeps its result. Before listeners that change the active attribute, class selection, membership or member IDs invalidate the current preflight before any visual change. The observer reconciles the new declaration independently. Calling `show()` from a Before listener likewise supersedes the outer request. A veto without such a replacement preserves the accepted selection, including when it establishes explicit attribute precedence over classes.

All required `BeforePop`/`BeforeUnpop` events are checked before a group swap starts. Canceling either refuses the swap, preserves the accepted selection and updates the active attribute to that selection. This also establishes explicit attribute precedence if a class-based swap is refused. Individual transition and completion events, focus release, `hidden` and trigger ARIA continue to belong to Present. The group adds no tabs, dialog or other ARIA roles. Rapid changes replace obsolete transitions; old completion Promises cannot select an earlier member. Dynamically inserted members join after `AelluxJs.mount()`, and removed or moved members no longer participate in the former group. Unmount releases shared observation when the last group leaves and restores the group's original active attribute.

## Accumulating Present Groups and progress

`data-ae-present-group` accepts a capacity. An empty value or `"1"` means one active presentation; a positive decimal integer such as `"2"` allows two. Zero, negative/fractional values, exponent notation and unsafe integers emit configuration diagnostic `2026` and fall back to one. Whitespace is trimmed. The numeric value does not select members or replace the explicit exclusive-selection contract.

`$ae.ext.present.popNext(group, prepare?)` and `$ae(group).present.popNext(prepare?)` reserve a slot synchronously. While capacity is available, they choose the last closed eligible direct member in DOM order. Fully closed members take priority over members still closing; an outgoing slot can be restarted when no closed slot is available. Once the capacity or available HTML pool is exhausted, they reuse the oldest active eligible member. The reserved member moves before the first eligible direct member, optional synchronous `prepare(member)` runs, and `BeforePop`/opening follow. Wrapped members, unmounted nodes and nested groups' members are never moved out of their structure. No elements or IDs are created. All active mounted members owned by the group count toward capacity, including wrapped descendants; a full group with no reusable direct member returns null.

Reusing a member calls `pop()` on that same member and restarts its presentation, progress and auto-unpop. It does not call `unpop()` or `BeforeUnpop` on another member. Other open members retain their content, transitions and timers. A vetoed `BeforePop` keeps the member's visibility and reuse age; the synchronous DOM rotation remains consumed. The Promise resolves to the member or `null` on no eligible slot, veto, teardown, configuration change during preflight or supersession. Preparation errors reject it.

Using `popNext()` activates accumulation and clears the exclusive logical selection after reservation/rotation. `selected()` returns `null` in this mode even with capacity one. Reservations and opening transitions count toward capacity immediately, so consecutive or reentrant calls cannot allocate excess slots. A successful reuse becomes the newest presentation. Independently unpopping a member frees its slot; the next call can use a closed member instead of replaying an open one. Direct member `pop()`/`toggle(true)` cannot open an additional member when full (they resolve to `false`), while reopening an active member and individual dismissal remain available.

`data-ae-present-group="2"` therefore keeps two independent notifications. A third call reuses the oldest of those two, even if the HTML contains another unused member. Empty groups now have capacity one; applications that previously relied on accumulation must declare their desired capacity explicitly.

An accepted explicit `show(group, id)` still performs exclusive selection, irrespective of capacity, and returns its existing boolean Promise. Changed `data-ae-present-active` or matching `data-ae-present-when` inputs also reconcile exclusive selection. Existing declarations stay suspended during accumulation until changed. A vetoed exclusive request preserves independently open members and does not retry automatically.

Capacity changes apply to future allocations. Increasing it makes more slots available. Lowering it preserves members already open or opening: further calls reuse existing slots until individual dismissals bring the count below the new limit. Capacity counts active/opening presentations; closing animations can briefly coexist visually with replacements. Native `hidden` mutations remain application-owned, and ordinary groups using exclusive selection retain their previous initial-state reconciliation.

Present emits the generic nonbubbling, noncancelable `AelluxJsProgress` on the Present element while waiting for auto-unpop. It needs neither Progress nor Feedback. At the start of `Popping`, a configured auto-unpop emits `{ value: 0, max: 1, status: "running" }` to reset associated controls before opening. After opening completes, the countdown emits zero again and intermediate fractions use monotonic elapsed time; the final payload is `{ value: 1, max: 1, status: "completed" }`, emitted before requesting `unpop()`. Additional fields are `elapsedMs`, `durationMs` and `remainingMs`.

The `Popping` reset starts no timer. Counting starts after opening completes, or when an initially visible element is mounted. It is independent of motion easing/duration. The original timeout determines closure; animation frames publish progress subject to the existing element/global FPS limits and require no layout reads. Background-frame throttling does not extend the timeout. No progress loop remains after cancellation, unmount, destroy or removal. A new accepted pop restarts at zero; changing/removing the auto-unpop attribute restarts/cancels the timer. A zero duration emits zero followed by completed progress on the timeout. If `BeforeUnpop` vetoes expiration, the completed countdown does not retry. See [Progress](optional/progress.md) for native bars and [Feedback](feedback.md#stacked-notifications) for bounded notification pools.

## Hover Triggers

```html
<button type="button" data-ae-trigger="pop" data-ae-trigger-on="hover"
  data-ae-target="settings">Settings</button>
```

`data-ae-trigger-on="click"` is the default. `hover` changes how `pop`, `unpop` or `toggle` is invoked. Pointer entry activates the trigger once, ignoring movements between its descendants and touch pointer events. Hover `pop` keeps an already open region open. In exclusive mode, triggers targeting group members select those members through the group.

Opening controls and their target form one shared hover region, including multiple triggers for the same target. Moving into the target keeps it open. Leaving the region schedules close after 120 ms; returning cancels it. Focus inside the shared region prevents hover dismissal. Outside clicks still close according to `data-ae-unpop-on-outside`; hover close is independent of that outside-click option. Dismiss and auto-unpop retain their normal behavior.

Keep native buttons or links: keyboard activation continues to invoke the configured action, and ordinary click/tap remains available on devices without hover. A mouse click on a currently hovered trigger does not invoke its action a second time. Touch pointer entry is ignored so a tap is handled once by conventional activation. Listeners are delegated and removed on extension destruction; pending target close timers are canceled when the target is unmounted.

## Group selection notifications and Anchor

`$ae.ext.present.selected(groupElement)` and `$ae("views").present.selected()` return the accepted mounted member, or `null`. This is a read-only query of the same selection used by `show()`; it does not select an ID or wait for the opening animation. Existing `show()`, trigger and transition contracts are preserved.

Present emits the bubbling `AelluxJsPresentGroupChange` event when an accepted logical selection changes, including initial confirmation, removal of the selected member and group teardown. Its detail is `{ group, previous, current, key }`, using element references; `key` is the current member's HTML ID, or `null` when there is no selection. It is emitted after cancelable Before events have accepted the swap and the incoming member has been made available for presentation. A refused swap emits no change. Reentrant or superseded operations cannot publish an obsolete selection. Consumers that load after the event can query `selected()`.

For a swap with motion, all required `BeforePop`/`BeforeUnpop` events run first. The group accepts its logical selection, starts member transitions and updates their controls' requested `aria-expanded`, then publishes `PresentGroupChange`. After preparation, each member emits `Layout` with the intended duration and then `Popping` or `Unpopping`. Completion updates `hidden`, progress and the region's effective-visibility ARIA state before `Pop` or `Unpop`. Outgoing and incoming members complete independently; there is no ordering guarantee between their completion events. Interruption does not emit a successful completion event for the obsolete transition. With motion disabled, a member may reach its endpoint before the group notification; consumers should query logical selection and measure through WaitLayout rather than infer selection from completion order.

```html
<div id="views" data-ae-present-group data-ae-present-active="home-panel"
     style="position:relative">
  <section id="home-panel" data-ae-present="opacity">Home</section>
  <section id="settings-panel" data-ae-present="opacity" hidden>Settings</section>
  <div id="selection-indicator" data-ae-anchor="bottom-left:bottom-left"
       data-ae-anchor-target="views" data-ae-anchor-match="width"
       style="--ae-anchor-switch-duration:250ms;--ae-anchor-switch-ease:ease-in-out"></div>
</div>
```

Each Anchor points `data-ae-anchor-target` at the group's ID or CSS selector and automatically follows its accepted selected member. Multiple Anchors can follow one group, each with independent pivots, matching and switching options. Anchor owns target resolution, geometry and diagnostics; Present performs no geometry calculations and does not require Anchor to be loaded. See [Anchor](anchor.md#present-group-anchor) for compatible positioning references and an integrated example. A group with no selected member leaves all Anchors targeting it inactive.

Delivery B adds the query and notification bridge without increasing Present's existing limits. Its minified Modern script is 17,240 bytes (gzip: 6,106), compared with Delivery A's 16,914 / 5,971 bytes. Legacy is 24,552 / 8,662 bytes, compared with 24,334 / 8,528. Shared selector strings avoid repeated construction and keep both artifacts inside the 17/6 and 24/9 KiB limits respectively.

## Delivery A distribution cost

Group reconciliation and cancelable selection, shared observation, delegated hover cleanup, and bounded progress increase the standalone minified Modern script from 11,034 to 16,914 bytes (gzip level 9: 4,098 to 5,971). Legacy grows from 17,363 to 24,334 bytes (gzip: 6,459 to 8,528), including transpilation of the new behavior. This is an increase of 1,873 and 2,069 compressed bytes respectively. Full continues to fit its existing budget.

The Modern budget changes explicitly from 11/5 KiB raw/gzip to 17/6 KiB; Legacy changes from 18/7 KiB to 24/9 KiB. These limits cover the three requested capabilities with a small margin for fixes. The stylesheet retains its existing 4/2 KiB budget. No new dependency, animation service or permanent scheduling loop is added.

## Delivery C stability cost

Delivery C's preflight validation of synchronous declaration/membership changes, safe registration fallback, expected-cancellation diagnostics and group job cleanup measured 17,717 bytes raw / 6,262 gzip in Modern and 25,112 / 8,822 in Legacy. Relative to Delivery B this added 477 / 156 bytes and 560 / 160 bytes respectively. Its maintenance limits were 18 / 6.25 KiB for Modern and 25 / 9 KiB for Legacy. Subsequent configuration diagnostics raise those limits to 18.5 / 6.5 KiB and 26 / 9 KiB respectively; see [Diagnostics](../runtime/diagnostics.md) for current measurements and runtime bundle limits. The stylesheet limits are unchanged. The repository's `milestones/0.1.0-delivery-c.md` audit records the earlier regressions, compatibility and remaining release work.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Logical/visual state | Known Limit | <span class="large">Accepted group selection and trigger expanded state can precede visual completion. Outgoing and incoming members may be visible together; completion order is not guaranteed.</span> | <span class="large">Query selected() for logical membership and await show() for a completed current selection.</span> |
| Interruption | Known Limit | <span class="large">Superseded transitions do not publish obsolete successful completion. Standalone pop() restarts from hidden; toggle(..., true) and group opening follow their documented idempotent behavior.</span> | <span class="large">Choose the matching API and handle false from invalid, refused or superseded group show() requests.</span> |
| Progress | Known Limit | <span class="large">Interpolation requires successful property/phase registration and clamp support. Missing or duplicate registration selects bounded discrete endpoints while visual transitions remain available.</span> | <span class="large">Validate the registration path before requiring continuous progress; see Present Progress.</span> |
| CSS ownership | Potential Risk | <span class="large">Present owns hidden and presentation state. Anchor owns a shared element transform; other replacing transform writers can still compete. External hidden/style changes can conflict with transitions.</span> | <span class="large">Apply independent transforms to descendants and coordinate visibility through the mounted API.</span> |
| Layout cost | Potential Risk | <span class="large">Size transitions without a direct motion child measure dimensions; many simultaneous transitions or changing content add layout work.</span> | <span class="large">Use the motion-child strategy where appropriate and profile real content changes.</span> |
| Semantics | Known Limit | <span class="large">Groups add no tabs/dialog roles. Focus is released when closing hides the active element; restoration relies on Focus or application integration.</span> | <span class="large">Provide the semantics, keyboard behavior, reduced-motion styles and focus destination required by the UI pattern.</span> |
| Coverage | Validation Gap | <span class="large">Tests exercise group vetoes, reversal, ARIA, progress fallbacks and tap/click routing. Real assistive-technology workflows and physical hover/touch hybrids are not established by desktop fixtures.</span> | <span class="large">Validate the UI pattern and devices beyond DOM/ARIA assertions.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.present.js), [present-enhancements.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/present-enhancements.spec.mjs), [present-aria.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/present-aria.spec.mjs), [present-tap.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/present-tap.spec.mjs).
