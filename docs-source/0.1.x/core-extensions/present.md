# Present Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

Stability describes implementation maturity and validation, not API compatibility. Only the [minimal initialization and declarative activation/mounting contract](../runtime/compatibility-commitment.md) is protected during `0.1.x`.

`present` controls the visibility of elements marked with `data-ae-present`. It is included in the `full` runtime, with CSS supplied by the shared Full stylesheet. In Basic, register it explicitly with `$ae.ext("present", { loadStyle: true })`. Supply `loadWhen` to choose a lazy activation selector, including trigger markup when needed.

## Declarative actions

Present follows the normative [Declarative Action Naming Convention](../extensions/declarative-action-naming.md). Mount controls with `data-ae-present-trigger="pop|unpop|dismiss|toggle|effect"`; empty defaults to toggle. `data-ae-present-target` selects one native ID, optionally prefixed with #, or omission uses the closest Present ancestor. A target without a trigger creates no control or ARIA relationship. Use `unpop` for a close button that reverses the opening motion, and `dismiss` for an independent outgoing motion. `data-ae-present-trigger-on="hover"` retains delegated hover behavior; click, keyboard and Input Tap share the same action routing. Attribute values are read at command time; use the normal mount/update lifecycle after changing declarations.

## Temporary effects

Present manages state transitions and temporary effects independently. Effects do not change Pop/Unpop/Dismiss state. They also work on already visible `data-ae-present=""` elements without a preceding Pop.

`$ae.ext.present.effect(element, name, effectTarget?)` and `$ae(element).present.effect(name, effectTarget?)` return a Promise resolving to `{ status }`: `completed`, `aborted` or `skipped`. The optional target must be the mounted Present itself or a descendant Element. `cancelEffect()` cancels active and pending requests within the region. Each Present owns at most one request; the latest request replaces the previous one. Two owners cannot animate the same effect target concurrently.

The controller's active transition is the source of truth for idle. Requests during Popping, Unpopping or Dismissing wait for that exact operation (and any transitioning containing Present). A successful completion runs the latest effect only if its destination remains mounted and effectively visible. A replacement, cancellation, unmount or destroy discards the old request. Accepted presentation transitions stop effects before reading or changing presentation properties; a canceled Before event leaves the active effect intact. Effects do not restart automatically after an interruption. Hidden destinations are skipped instead of saved for a future reveal.

Presets are `shake`, `yes`, `no`, `breathe`, `tremble`, `pulse` and `alert`. Their keyframes ship only in Present CSS. Present temporarily owns `ae--present-effect-{name}`; define a finite animation on that class for application effects. CSS remains responsible for appearance and timing, with the shared [CSS Motion Controller](../runtime/css-motion.md) handling supported progression. `--ae-present-effect-aellux-ease` selects optional advanced easing. Reduced motion skips effects without leaving classes, pending requests or lifecycle work.

Presets replace transform. A target owned by Anchor or Elastic, with configured Present transform, or with a nonidentity stable transform is skipped and emits development diagnostic 2033. Use an untransformed inner element to preserve the presentation endpoint and authored styles. Custom effects must compose with their target properties; inspectable conflicting replacing transforms receive the existing resource diagnostic. No wrappers are generated and effect cleanup restores authored classes and styles.

`data-ae-present-motion` retains its grid-child meaning. Declarative effects use a separate setting:

```html
<button data-ae-present-trigger="effect" data-ae-present-target="notice" data-ae-present-effect="shake">Shake</button>
<article id="notice" data-ae-present="">Always visible content</article>
```

For a transform presentation, use an internal target programmatically or through Feedback:

```html
<article id="notice" data-ae-present="opacity transform" data-ae-feedback
         data-ae-feedback-message-target="notice-content"
         data-ae-feedback-effect-target="notice-content" hidden>
  <div id="notice-content">Message</div>
</article>
```

```js
await $ae("notice").present.pop();
await $ae("notice").present.effect("shake", document.getElementById("notice-content"));
```

## Operations and prerelease migration

`pop()` shows a region using its opening animation. `dismiss()` closes it from the current rendered state using an independent destination, duration and easing. `toggle(element, false)` reverses with Unpop; `toggle(element, true)` opens idempotently. Explicit `pop()` restarts from `from`.

`unpop()` reverses the original opening trajectory back to `from`, including the travelled portion of an incomplete opening. With `--ae-from-transform: scale(0.5)`, `--ae-pop-transform: scale(1)` and `--ae-dismiss-transform: scale(1.2)`, opening travels from 0.5 to 1, dismissal travels from the current scale to 1.2, and reverse playback returns toward 0.5 along the opening trajectory. Dismissal does not reverse the opening timeline.

This is a breaking prerelease finalization before the `0.1.0` compatibility baseline. Migrate existing beta dismissal consumers together. The current `unpop()` is a distinct reverse operation, never an alias for dismissal.

| Previous dismissal contract | Current contract |
| --- | --- |
| `$ae.ext.present.unpop(element)`, `$ae(element).present.unpop()` | `$ae.ext.present.dismiss(element)`, `$ae(element).present.dismiss()` |
| `data-ae-trigger="unpop"` (former dismissal action) | `data-ae-present-trigger="dismiss"` |
| `data-ae-auto-unpop` | `data-ae-auto-dismiss` |
| `data-ae-unpop-on-click` | `data-ae-dismiss-on-click` (same values/default) |
| `--ae-unpop-opacity`, `--ae-unpop-transform`, `--ae-unpop-height`, `--ae-unpop-width` | Corresponding `--ae-dismiss-*` destinations |
| `--ae-unpop-duration`, `--ae-unpop-ease`, `--ae-unpop-aellux-ease` | Corresponding `--ae-dismiss-*` timing/easing |
| `--ae-unpop-progress` | `--ae-dismiss-progress` (hidden: 1, presented: 0) |
| `ae--unpopping` | `ae--dismissing` |
| `AelluxJsBeforeUnpop` | `AelluxJsBeforeDismiss` |
| `AelluxJsUnpopping` | `AelluxJsDismissing` |
| `AelluxJsUnpop` | `AelluxJsDismiss` |
| `AelluxJsUnpopFocusLost` | `AelluxJsDismissFocusLost` |
| Layout `detail.origin: "present.unpop"` | `detail.origin: "present.dismiss"` (same `durationMs`) |
| Private `--ae-present-unpop-phase` | Private `--ae-present-dismiss-phase` (not application configuration) |

Close controls now use `data-ae-present-trigger="dismiss"`, with `data-ae-present-target` or the closest Present ancestor. `--ae-pop-progress` keeps its meaning and endpoints; `AelluxJsProgress` keeps its countdown payload and timing. Removed automatic-dismissal attributes are not read. The `unpop` trigger value, progress channel, class and events now identify actual reverse playback; migrate old dismissal usage explicitly rather than relying on its former meaning.

## Accessibility profile

- **Capabilities:** interaction and input; structure and state; motion and timing.
- **Owned state:** presentation and `will-change` classes and its changes to `hidden`, `aria-expanded` and `aria-controls`.
- **Consumer responsibility:** use native, named trigger and dismiss controls; ensure configured motion respects reduced-motion preferences; manage focus for dialog, disclosure and similar patterns.
- **Focus on close:** if the active element is inside the region when it becomes hidden, Present releases its focus and emits `AelluxJsDismissFocusLost` or `AelluxJsUnpopFocusLost`, according to the operation, with `detail: { element, focused }`. Focus restoration is handled by the optional Focus Extension.

```html
<button type="button" data-ae-present-trigger="toggle" data-ae-present-target="#details">Details</button>
<section id="details" data-ae-present hidden>
  <div data-ae-present-motion>
    <button type="button" data-ae-present-trigger="dismiss">Close</button>
    Content
  </div>
</section>
```

`data-ae-present-trigger` accepts `pop`, `dismiss`, `unpop`, `toggle` or `effect`; an unrecognized value records a configuration warning and still toggles. `data-ae-present-target` accepts one element ID, with or without a leading `#` (for example, `details` or `#details`). Without an ID, a trigger or dismiss control acts on its closest `data-ae-present` container. Invalid, missing and incompatible targets are reported through diagnostics.

A trigger or dismiss control with neither an ID nor a containing `data-ae-present` reports `ERROR_PRESENT_CONTROL_TARGET_MISSING` (`1111`).

## Tap and native click

Present also consumes Input's `AelluxJsTap` notifications through the same trigger, dismiss and outside-activation routing as native click. Add `data-ae-point` to an eligible button, link or role button and mount it with Input. Full registers Input and Present automatically; Basic requires explicit declarations for both Extensions.

```html
<button type="button" data-ae-point data-ae-present-trigger="toggle" data-ae-present-target="details">Details</button>
```

Click keeps priority: Present queues a tap fallback with a 32 ms grace period, allowing touch compatibility clicks delivered in a later input task to arrive first. A click reaching Present before that fallback, on the same control or its descendants and with the same pointer ID when reported consistently, cancels the pending tap and performs the action immediately. WebKit can report a touch/pen compatibility click as mouse input with another ID; that pair is matched by its target within the same grace period. A tap without that click performs the action once when its fallback runs. Different controls and different IDs of the same pointer type remain independent, and a later gesture is accepted normally. This deduplication belongs to Present; Input continues to emit tap immediately and native click remains unchanged.

Keyboard clicks keep their normal path. Mouse taps on an already hovered trigger respect the existing hover suppression; touch taps retain their configured action. Unmounting a related Present target or control, unmounting/remounting its Input controller, or destroying Present cancels the pending fallback. Destroy also removes the tap listener.

The integration adds no dependencies. Minified Present grows from 18,858 to 20,037 bytes (gzip: 6,727 to 7,124), and Legacy Present from 26,358 to 27,825 bytes (gzip: 9,329 to 9,760). Budgets change from 18.5 / 6.5 KiB to 20 / 7.25 KiB for Modern and from 26 / 9 KiB to 28 / 9.75 KiB for Legacy. Both preceding gzip artifacts already exceeded their old limits. Combined Full costs are recorded in [Input](input.md#distribution-cost).

## Motion and state

The Extension exposes `pop(element)`, `dismiss(element)`, `unpop(element)`, `toggle(element, goto)`, and `trigger(element, action)` through `$ae.ext.present`. A mounted element also has controller methods:

```js
const panel = $ae("details").present;
await panel.pop();
await panel.unpop(); // Replay the opening backwards to from.
await panel.pop();
await panel.dismiss();
```

Each method returns a Promise. For a transition that remains current, it resolves after preparation and cleanup, including final visibility, classes, ARIA state and completion events. An interrupted request can settle without reaching its requested endpoint; inspect the current operation or state rather than treating the earlier Promise as successful completion. Present manages `aria-expanded`, established classes `ae--pop`, `ae--unpop`, `ae--dismissed`, and transitional classes `ae--popping`, `ae--dismissing`, `ae--unpopping` on the main container. It manages `hidden` for legacy declarations and updates `aria-expanded` and `aria-controls` on its triggers. Explicit initial state classes allow CSS-owned closed visibility as described under Interactive gestures.

After a `BeforePop`, `BeforeDismiss` or `BeforeUnpop` preflight accepts the action, associated trigger controls immediately receive the requested `aria-expanded` value, before preparation. The region retains its prior value during the transition and synchronizes to effective CSS visibility at completion. A closing region can therefore remain expanded while its controls already report `false`. Vetoes preserve the accepted state; reversals update controls when accepted, and legacy closing applies `hidden` only when it finishes. CSS that overrides `hidden` can keep the region effectively visible.

Calling `pop(element)` starts a fresh opening even when the region is already open, opening or closing: **CURRENT → FROM → POP**. It interrupts any active transition, removes presentation state classes, hides the region immediately, and restarts from the configured `from` state using the pop duration and easing. `toggle(element, true)` keeps its existing idempotent behavior.

Calling `dismiss(element)` closes from the **currently rendered state → DISMISS**, including when opening is incomplete or a Present Group changes selection during opening. Present captures opacity, transform, size and progress before canceling the previous motion, then transitions directly to the configured closing destination with `--ae-dismiss-duration`, `--ae-dismiss-ease` and, in controlled mode, `--ae-dismiss-aellux-ease`. There is no intermediate reset to `pop` or `from`. Repeated `dismiss()` calls remain idempotent. A vetoed `BeforeDismiss` leaves the current motion untouched.

### Opening reverse playback

`$ae.ext.present.unpop(element)` and `$ae(element).present.unpop()` replay the captured opening trajectory in reverse. Opening keyframes, easing and per-property timing are retained, including CSS Motion's sampled advanced easing. The trajectory consists of Present's declared CSS transitions; author keyframe animations are outside this reverse contract. Exact sampled/configured linear() strings are retained because WebKit timing serialization rounds their stops. If 400 ms of an 800 ms opening has been travelled, reversal uses that 400 ms segment backwards. It does not start a fresh 800 ms ease from the current value. A completed opening reverses its full active duration; opening delays are not added again. If opening is still in preparation, there is no travelled motion and reversal completes immediately. A region mounted already visible uses an implied full opening between its initial endpoints.

Reverse playback starts at the rendered position without the opening preparation delay. The same CSS Motion scheduler can control it; with control disabled it runs natively. Without Web Animations inspection, generated native CSS keyframes replay the captured CSS opening endpoints/easing with reverse direction and a negative delay that excludes the untravelled segment. Inline values, priorities, transition/animation declarations and temporary endpoint variables are restored after completion, replacement, errors and teardown. Reduced motion completes immediately. Layout/content changes during playback do not recapture an earlier opening.

`BeforeUnpop` is cancelable and leaves the current presentation untouched when vetoed. The accepted operation emits `Layout` (`origin: "present.unpop"`, `durationMs` equal to the longest reverse segment), `Unpopping` and, after hiding/cleanup, `Unpop`. Focus release uses `UnpopFocusLost` on document with the same `{ element, focused }` payload as dismissal. Repeated reversal or a hidden target is idempotent.

Calling `unpop()` during an independent `dismiss()` resolves to `false`, without interrupting it, changing its styles or emitting reverse events. The dismissal may already lie outside the original opening trajectory. Calling `dismiss()` during reversal remains supported and closes continuously toward its own destination. Explicit `pop()` replaces either closing operation and restarts from `from`.

An explicit reverse control is `<button data-ae-present-trigger="unpop" data-ae-present-target="details">Reverse</button>`. Toggle closing also uses Unpop. Timed/click/hover closing and outgoing group selection continue using `dismiss()`. Reversing an exclusively selected member clears that selection with the same group preflight/ownership rules; independent pool members release their capacity when reversal is accepted.

`--ae-unpop-progress` is bounded normalized reverse-operation progress, 0 at acceptance and 1 on completion, using the remaining travel time. `--ae-pop-progress` follows the captured opening curve backwards and remains clamped; `--ae-dismiss-progress` is not animated as an independent dismissal during reversal. Stable hidden endpoints are `(pop, dismiss, unpop) = (0, 1, 1)` and fully presented endpoints are `(1, 0, 0)`. Opening resets all closing progress to zero. Missing property registration uses discrete reverse progress while preserving visual completion.

There are no `--ae-unpop-opacity`, transform, size, duration or easing settings: reverse playback derives its trajectory from opening. The old `data-ae-auto-unpop` and `data-ae-unpop-on-click` attributes remain inactive. Generic `AelluxJsProgress` remains the auto-dismiss countdown event.

The handoff temporarily retains computed values inline. Grid closing resolves its destination tracks and container size in pixels in one synchronous layout pass, preserving both the visible box and its tracks during fractional-grid interpolation. Measured closing retains the current size instead of restoring the expanded cap before measurement. Temporary declarations, including author values and priorities, are restored on completion, replacement, error and unmount; endpoint custom properties remain authored. The grid destination is measured when closing starts, so content/layout changes during that close do not retarget its pixel destination. Native CSS and CSS Motion use the same handoff; CSS Motion still starts each replacement timeline at zero. Reduced motion retains immediate endpoints.

`data-ae-present-motion` is optional. A direct child with that attribute uses grid tracks for `height` and `width`; closing measures the tracks and box for the rendered-state handoff described above. Without it, Present leaves the content in place, records `INFO_PRESENT_MEASURED_LAYOUT` (`3001`) for size transitions, measures the visible container, and animates `max-height` and `max-width` in pixels. This path incurs a layout read. Explicit `height` and `width` values in the container's styles determine the measured final size. Temporary inline maximum dimensions are restored after a transition or interruption. All visibility, classes, and ARIA state remain on the main `data-ae-present` element.

Before starting a pop or dismiss transition from a stable state, Present makes the container available for layout, adds `ae--will-change` to it, and waits 100 ms so the browser can prepare the declared properties. During this preparation, the existing `ae--pop` or `ae--popping` state remains intact; it is replaced atomically when `ae--popping` or `ae--dismissing` is applied. When an active transition is reversed, Present preserves `ae--will-change` and starts the replacement transition without repeating the preparation delay. Measured-size transitions without that delay wait one layout frame to separate their starting and ending sizes. The class is removed after the final transition finishes or when a transition is interrupted without a replacement. The stable open state uses `ae--pop` on the container.

The generated `aellux.ext.present.css` stylesheet treats the whitespace-separated `data-ae-present` value as a list of transition instructions. `opacity` controls opacity and `transform` controls transform. `height` and `width` control `grid-template-rows` and `grid-template-columns` when a direct motion child exists, or measured `max-height` and `max-width` when it does not. Values can be used alone or in any combination, such as `data-ae-present="opacity height"`. When the same container also declares `data-ae-anchor`, Anchor owns `transform`: Present ignores its transform token and excludes transform from its transition properties, while opacity and size motion remain available. Development validation reports `WARN_PRESENT_ANCHOR_TRANSFORM` (`2031`); remove the transform token or animate a child to keep a separate visual transform. The original Present declaration is preserved. An empty attribute remains empty and disables the transition with zero duration. The value `all` expands to `opacity transform height width` during mount and is restored to its original value on unmount.

The `--ae-from-height`, `--ae-pop-height`, and `--ae-dismiss-height` properties define the height keyframes, while `--ae-from-width`, `--ae-pop-width`, and `--ae-dismiss-width` define the width keyframes. Its minified counterpart is `aellux.ext.present.min.css`; the boot runtime selects the variant that matches the loaded aellux.js script. CSS custom properties `--ae-pop-duration` and `--ae-dismiss-duration` on the container set the corresponding duration. Present delegates compatible transitions to the shared [CSS Motion Controller](../runtime/css-motion.md), so `waitLayout` controls their update frequency while CSS remains their definition. Optional `--ae-pop-aellux-ease` and `--ae-dismiss-aellux-ease` values select an advanced `$ae.ease()` curve in controlled mode; the existing valid CSS easing remains the native fallback. When the document root has `data-ae-reduced-motion="reduced"`, the generated stylesheet disables transitions. Present preserves the configured easing regardless of hardware; it does not derive step counts or override timing functions for low-hardware markers. The Extension emits cancelable `AelluxJsBeforePop` and `AelluxJsBeforeDismiss` events immediately, waits through the preparation period, then emits `AelluxJsPopping`/`AelluxJsDismissing` and finally `AelluxJsPop`/`AelluxJsDismiss` as transitions progress. It emits a bubbling `AelluxJsLayout` event from the Present element when the transition starts, notifying layout observers such as Anchor. The event carries `detail.origin` as `"present.pop"` or `"present.dismiss"` and `detail.durationMs` as the transition time in milliseconds.

When an `dismiss` hides a region containing the active element, Present releases focus if the browser has not already done so, then dispatches `DismissFocusLost` through `aelluxJs.dispatch`. If the active element is outside the region at the time it becomes hidden, no focus event is dispatched.

`data-ae-auto-dismiss` specifies a delay before closing an open container. `data-ae-dismiss-on-click` controls click dismissal: `outside` (default) or `out` closes on outside clicks; `inside` or `in` closes on clicks within the container; `false` or `none` disables click dismissal. Trigger and dismiss controls retain their explicit action without a second automatic action on the same target. This option also applies to Input tap activation. On unmount, Present restores the attributes it changes on each container and trigger control, including `data-ae-present`, `data-ae-present-motion`, `aria-expanded`, `aria-controls`, and `hidden` where applicable.

### Click dismissal

Set `data-ae-dismiss-on-click` on the Present container:

| Value | Behavior |
| --- | --- |
| Omitted, empty, `outside`, or `out` | Close when a click occurs outside the container. |
| `inside` or `in` | Close when a click occurs inside the container. |
| `false` or `none` | Disable automatic click dismissal. Explicit controls and auto-dismiss still work. |

```html
<div data-ae-present="opacity" data-ae-dismiss-on-click="inside" hidden>
  Click this notification to dismiss it.
</div>

<div data-ae-present="opacity" data-ae-dismiss-on-click="false"
     data-ae-auto-dismiss="3s" hidden>
  This notification closes after three seconds, independently of clicks.
</div>
```

This replaces `data-ae-unpop-on-outside`; the old attribute is no longer read. Replace `data-ae-unpop-on-outside="false"` with `data-ae-dismiss-on-click="false"`. For the previous default behavior, omit the new attribute or use `outside`. Input taps use the same policy, and explicit trigger/dismiss actions are not followed by a second automatic dismissal on the same target. The setting does not change hover dismissal.

## Present Progress

Opening and dismissal expose two inheritable numeric CSS channels on each mounted region; reverse-operation progress is described above. `--ae-pop-progress` advances from 0 to 1 during opening; `--ae-dismiss-progress` advances toward 1 during closing. Initially hidden regions have values `0, 1`; initially visible regions have `1, 0`. Opening finishes at `1, 0`, and closing finishes at `0, 1`. Opening resets both channels to zero; repeated standalone `pop()` calls restart progress along with the visual transition. Closing retains the current values: pop progress interpolates back toward zero while dismiss progress advances toward one, using the closing duration and easing. Thus inherited CSS such as the example below does not jump when an opening is interrupted. Unmount restores the original inline values and priorities.

The two channels are directional values, not complementary percentages: their sum can be less than one when closing interrupts opening. A consumer cannot assume `--ae-pop-progress` always increases, or infer the rendered opacity/transform from progress when custom endpoints differ. Both phases animate during closing; this replaces the former immediate reset of the opposite channel. Explicit opening still intentionally resets progress. Without successful registration, progress remains discrete and cannot guarantee intermediate continuity; the actual presentation properties still close from their rendered values.

```css
.panel-content {
  opacity: var(--ae-pop-progress, 0);
  transform: translateY(calc(20px * (1 - var(--ae-pop-progress, 0))));
}
```

Put `.panel-content` inside a `data-ae-present="opacity"` region to consume its inherited progress. The properties use the region's existing duration and CSS easing. Registered properties interpolate natively; captured transitions use the same CSS Motion Controller timeline as the other visual properties, including advanced aellux.js easing and adaptive WaitLayout scheduling. The four opening/dismissal progress/phase properties and `--ae-unpop-progress` share the lightweight classification of `transform` and `opacity`, so they do not impose the conservative property ceiling by themselves. Height and width transitions still use `cssMotionPropertyMaxFPS` (55 by default), further limited by `data-ae-maxfps` and adaptive FPS. Elapsed time determines duration, independently of the number of updates. Private registered phase properties carry interpolation; the public properties clamp those phases to 0–1, including with overshooting CSS and advanced aellux.js easings.

Opening/dismissal interpolation is enabled only when all four corresponding progress/phase registrations succeed and CSS `clamp()` is supported. A missing API, a thrown registration error, or an already registered name (including a conflicting definition) selects the conservative discrete fallback. The registration API cannot inspect an existing descriptor, so even compatible duplicate registrations do not establish interpolation support. Progress remains numeric and bounded, stable endpoints remain available, and the existing visual transitions continue. Web Animations is optional: disabling the controller or missing its APIs keeps native CSS motion. Reduced motion disables transitions. CSS transition progress has no polyfill or independent animation loop. Auto-dismiss temporal progress is a separate event channel described below.

## Present Group

A `data-ae-present-group` container coordinates mounted Present descendants by their own HTML `id`. Membership belongs to the nearest group, so nested groups are independent. Each member needs a unique ID; `data-ae-present-active` and `show(id)` use that exact ID, without a leading `#`.

```html
<div id="views" data-ae-present-group data-ae-present-active="home">
  <section id="home" data-ae-present="opacity">Home</section>
  <section id="settings" data-ae-present="opacity" hidden>
    <button data-ae-present-trigger="dismiss">Close settings</button>
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

All required `BeforePop`/`BeforeDismiss` events are checked before a group swap starts. Canceling either refuses the swap, preserves the accepted selection and updates the active attribute to that selection. This also establishes explicit attribute precedence if a class-based swap is refused. Individual transition and completion events, focus release, `hidden` and trigger ARIA continue to belong to Present. The group adds no tabs, dialog or other ARIA roles. Rapid changes replace obsolete transitions; old completion Promises cannot select an earlier member. Dynamically inserted members join after `aelluxJs.mount()`, and removed or moved members no longer participate in the former group. Unmount releases shared observation when the last group leaves and restores the group's original active attribute.

## Accumulating Present Groups and progress

`data-ae-present-group` accepts a capacity. An empty value or `"1"` means one active presentation; a positive decimal integer such as `"2"` allows two. Zero, negative/fractional values, exponent notation and unsafe integers emit configuration diagnostic `2026` and fall back to one. Whitespace is trimmed. The numeric value does not select members or replace the explicit exclusive-selection contract.

`$ae.ext.present.popNext(group, prepare?)` and `$ae(group).present.popNext(prepare?)` reserve a slot synchronously. While capacity is available, they choose the last closed eligible direct member in DOM order. Fully closed members take priority over members still closing; an outgoing slot can be restarted when no closed slot is available. Once the capacity or available HTML pool is exhausted, they reuse the oldest active eligible member. The reserved member moves before the first eligible direct member, optional synchronous `prepare(member)` runs, and `BeforePop`/opening follow. Wrapped members, unmounted nodes and nested groups' members are never moved out of their structure. No elements or IDs are created. All active mounted members owned by the group count toward capacity, including wrapped descendants; a full group with no reusable direct member returns null.

Reusing a member calls `pop()` on that same member and restarts its presentation, progress and auto-dismiss. It does not call `dismiss()` or `BeforeDismiss` on another member. Other open members retain their content, transitions and timers. A vetoed `BeforePop` keeps the member's visibility and reuse age; the synchronous DOM rotation remains consumed. The Promise resolves to the member or `null` on no eligible slot, veto, teardown, configuration change during preflight or supersession. Preparation errors reject it.

Using `popNext()` activates accumulation and clears the exclusive logical selection after reservation/rotation. `selected()` returns `null` in this mode even with capacity one. Reservations and opening transitions count toward capacity immediately, so consecutive or reentrant calls cannot allocate excess slots. A successful reuse becomes the newest presentation. Independently dismissing a member frees its slot; the next call can use a closed member instead of replaying an open one. Direct member `pop()`/`toggle(true)` cannot open an additional member when full (they resolve to `false`), while reopening an active member and individual dismissal remain available.

`data-ae-present-group="2"` therefore keeps two independent notifications. A third call reuses the oldest of those two, even if the HTML contains another unused member. Empty groups now have capacity one; applications that previously relied on accumulation must declare their desired capacity explicitly.

An accepted explicit `show(group, id)` still performs exclusive selection, irrespective of capacity, and returns its existing boolean Promise. Changed `data-ae-present-active` or matching `data-ae-present-when` inputs also reconcile exclusive selection. Existing declarations stay suspended during accumulation until changed. A vetoed exclusive request preserves independently open members and does not retry automatically.

Capacity changes apply to future allocations. Increasing it makes more slots available. Lowering it preserves members already open or opening: further calls reuse existing slots until individual dismissals bring the count below the new limit. Capacity counts active/opening presentations; closing animations can briefly coexist visually with replacements. Native `hidden` mutations remain application-owned, and ordinary groups using exclusive selection retain their previous initial-state reconciliation.

Present emits the generic nonbubbling, noncancelable `AelluxJsProgress` on the Present element while waiting for auto-dismiss. It needs neither Progress nor Feedback. At the start of `Popping`, a configured auto-dismiss emits `{ value: 0, max: 1, status: "running" }` to reset associated controls before opening. After opening completes, the countdown emits zero again and intermediate fractions use monotonic elapsed time; the final payload is `{ value: 1, max: 1, status: "completed" }`, emitted before requesting `dismiss()`. Additional fields are `elapsedMs`, `durationMs` and `remainingMs`. Completion normalizes `elapsedMs` to `durationMs` and `remainingMs` to zero, even when timer and performance-clock precision differ; this does not change the timeout that requests closure.

The `Popping` reset starts no timer. Counting starts after opening completes, or when an initially visible element is mounted. It is independent of motion easing/duration. The original timeout determines closure; animation frames publish progress subject to the existing element/global FPS limits and require no layout reads. Background-frame throttling does not extend the timeout. No progress loop remains after cancellation, unmount, destroy or removal. A new accepted pop restarts at zero; changing/removing the auto-dismiss attribute restarts/cancels the timer. A zero duration emits zero followed by completed progress on the timeout. If `BeforeDismiss` vetoes expiration, the completed countdown does not retry. See [Progress](optional/progress.md) for native bars and [Feedback](feedback.md#stacked-notifications) for bounded notification pools.

## Hover Triggers

```html
<button type="button" data-ae-present-trigger="pop" data-ae-present-trigger-on="hover"
  data-ae-present-target="settings">Settings</button>
```

`data-ae-present-trigger-on="click"` is the default. `hover` changes how `pop`, `dismiss`, `unpop` or `toggle` is invoked. Pointer entry activates the trigger once, ignoring movements between its descendants and touch pointer events. Hover `pop` keeps an already open region open. In exclusive mode, triggers targeting group members select those members through the group.

Opening controls and their target form one shared hover region, including multiple triggers for the same target. Moving into the target keeps it open. Leaving the region schedules close after 120 ms; returning cancels it. Focus inside the shared region prevents hover dismissal. Click dismissal follows `data-ae-dismiss-on-click`; hover close is independent of that click option. Dismiss and auto-dismiss retain their normal behavior.

Keep native buttons or links: keyboard activation continues to invoke the configured action, and ordinary click/tap remains available on devices without hover. A mouse click on a currently hovered trigger does not invoke its action a second time. Touch pointer entry is ignored so a tap is handled once by conventional activation. Listeners are delegated and removed on extension destruction; pending target close timers are canceled when the target is unmounted.

## Group selection notifications and Anchor

`$ae.ext.present.selected(groupElement)` and `$ae("views").present.selected()` return the accepted mounted member, or `null`. This is a read-only query of the same selection used by `show()`; it does not select an ID or wait for the opening animation. Existing `show()`, trigger and transition contracts are preserved.

Present emits the bubbling `AelluxJsPresentGroupChange` event when an accepted logical selection changes, including initial confirmation, removal of the selected member and group teardown. Its detail is `{ group, previous, current, key }`, using element references; `key` is the current member's HTML ID, or `null` when there is no selection. It is emitted after cancelable Before events have accepted the swap and the incoming member has been made available for presentation. A refused swap emits no change. Reentrant or superseded operations cannot publish an obsolete selection. Consumers that load after the event can query `selected()`.

For a swap with motion, all required `BeforePop`/`BeforeDismiss` events run first. The group accepts its logical selection, starts member transitions and updates their controls' requested `aria-expanded`, then publishes `PresentGroupChange`. After preparation, each member emits `Layout` with the intended duration and then `Popping` or `Dismissing`. Completion updates `hidden`, progress and the region's effective-visibility ARIA state before `Pop` or `Dismiss`. Outgoing and incoming members complete independently; there is no ordering guarantee between their completion events. Interruption does not emit a successful completion event for the obsolete transition. With motion disabled, a member may reach its endpoint before the group notification; consumers should query logical selection and measure through WaitLayout rather than infer selection from completion order.

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

## Rendered-state closing distribution cost

The closing handoff remains local to Present and adds no dependency or scheduler. The shared CSS Motion implementation and its cancellation/preparation semantics are unchanged. Measurements below compare generated artifacts before and after this change (bytes, gzip level 9):

| Artifact | Before raw / gzip | After raw / gzip | Delta raw / gzip |
| --- | --- | --- | --- |
| Present Modern minified JS | 24,873 / 8,704 | 26,718 / 9,199 | +1,845 / +495 |
| Present Legacy minified JS | 33,541 / 11,373 | 35,710 / 11,936 | +2,169 / +563 |
| Present minified CSS | 4,079 / 804 | 4,102 / 805 | +23 / +1 |
| Full Modern minified JS | 198,206 / 61,347 | 198,993 / 61,492 | +787 / +145 |
| Full Legacy minified JS | 522,177 / 155,031 | 523,198 / 155,218 | +1,021 / +187 |
| Full minified CSS | 124,819 / 11,728 | 124,442 / 11,663 | -377 / -65 |

The Full deltas include regeneration of previously stale Scrollbox output from unchanged source, so they are net distribution changes rather than the isolated cost of Present. Only affected budgets increase: Present Modern from 24.5/8.5 to 26.25/9.125 KiB raw/gzip, Present Legacy from 33/11.25 to 35/11.75 KiB, Present CSS raw from 4 to 4.125 KiB, and Full Modern from 194/60 to 195/60.25 KiB. Full Legacy and the other stylesheet limits remain unchanged.

## Interactive gestures

Gestures are optional input for the existing Present transitions. Without `data-ae-present-gesture`, Present installs no gesture listeners. `pop()` presents, `unpop()` follows the opening timeline backwards, and `dismiss()` uses its independent outgoing destination. All three methods and keyboard controls remain available regardless of gesture configuration.

| Attribute | Values | Default |
| --- | --- | --- |
| `data-ae-present-gesture` | `up`, `down`, `left`, `right`: physical movement for Pop | Disabled |
| `data-ae-present-gesture-source` | One ID, optionally prefixed with `#`, or `document` | Present itself |
| `data-ae-present-gesture-unpop` | `false` disables gesture Unpop; `true` enables it | `true` |
| `data-ae-present-gesture-dismiss` | Optional direction on the other axis | Disabled |

Unpop always uses the opposite of the Pop direction. Unpop and Dismiss begin on the Present itself; the configured source supplies Pop input. Changing these attributes, replacing the source ID, or adding a previously missing source refreshes the listeners. A missing source reports configuration diagnostic `2027`. An invalid direction or a Dismiss direction on the Pop/Unpop axis reports `2026`; a conflicting Dismiss disables only that gesture.

Links and buttons, including their descendants, can start gestures when they have an explicit `draggable="false"`, following the Scrollbox rule. An effective gesture source that is itself a link or button is automatically given `draggable="false"` when missing or different, with configuration warning `2026` identifying the source and its previous value. Declare the attribute explicitly to avoid the warning. This correction also applies when the source appears later or is replaced. Other form controls, elements with a `contenteditable` attribute, explicitly draggable descendants and Scrollbox scrollbar thumbs remain excluded.

| CSS property | Default | Release decision |
| --- | --- | --- |
| `--ae-present-pop-threshold` | `0.5` | From a closed state, Pop when progress is at or above this value |
| `--ae-present-unpop-threshold` | `0.5` | From Pop, Unpop when progress is at or below this value |
| `--ae-present-dismiss-threshold` | `0.5` | Dismiss when its independent progress is at or above this value |
| `--ae-present-gesture-distance` | `auto` | Positive CSS length for one full travel |

The main timeline is normalized as `0 = Unpop`, `1 = Pop`. For example, a 300px distance and a 150px opening drag produce progress `0.5`. Setting Pop to `0.6` and Unpop to `0.4` produces hysteresis: the origin determines the result between those limits. A fast outward Unpop flick can finish before the distance threshold: it must travel at least 24px, reach 0.55px/ms over recent movement, and be released within 90ms of its last move. Samples older than 120ms do not govern a continuing flick. Pausing at the end, moving back toward Pop, or canceling retains the usual destination. The remaining Unpop playback uses the captured opening timeline and easing; there is no separate inertial animation. Pop and Dismiss still use their distance thresholds. Values are read through computed style at the beginning of each gesture, including inline declarations, media queries and the cascade. Invalid thresholds use `0.5`; invalid distances use `auto`, with diagnostic `2026`. Explicit distance supports CSS lengths such as `320px`, `20rem`, `50vh` and `calc(20rem + 8px)`; percentages are not supported. Auto uses the translation difference when the captured transform endpoints resolve to matrices, otherwise the element's layout dimension on that axis, with a minimum of 1px. Rotation, scale and layout-dependent percentage transforms should use an explicit distance.

After an 8px intent distance and axis predominance, the gesture pauses and seeks the same captured transition tracks used by Present playback. It does not recreate animations on pointermove. Drag scrubbing is linear with physical distance; reversing movement changes `ae--popping` to `ae--unpopping`, or vice versa, on the same effects. Dismiss retains `ae--dismissing` throughout its attempt, including return travel. Releasing resumes the original keyframes and configured easing from the corresponding rendered position. No preparation delay is added to gestures. Pointer cancellation, capture loss or an additional pointer return toward the origin. An explicit API call can replace the interaction, and unmount cancels owned work and restores temporary styles.

`BeforePop`, `BeforeUnpop` and `BeforeDismiss` retain their cancelable preflight. An accepted gesture emits the corresponding transition-start event and `Layout`. Scrubbing emits no repeated completion events. Settlement emits one completion event for its actual destination: for example, a canceled Unpop returns to Pop and emits `Pop`. Programmatic replacement suppresses the superseded gesture's completion. There is no new public gesture event family. CSS progress outputs follow the controlled tracks when custom-property registration is available; without it they update during drag and settle at completion.

### Semantic states and visible closed regions

The established classes are `ae--pop`, `ae--unpop` and `ae--dismissed`. Temporary classes are `ae--popping`, `ae--unpopping` and `ae--dismissing`. Established classes are mutually exclusive at completion. Declaring an established state class before mounting opts into CSS-owned closed visibility: `ae--unpop` and `ae--dismissed` do not inherently mean invisibility or removal from the accessibility tree. A partially exposed region can therefore receive pointers itself. A declaration without these state classes retains legacy automatic `hidden` closing; an initially `hidden` region also retains that behavior, including when it has an explicit state class. ARIA still follows effective rendered visibility, while trigger expansion follows the accepted operation.

An initially hidden region can be opened through an external source. Present removes `hidden` before preparing the captured timeline. If author CSS also computes `display:none`, gesture preparation temporarily supplies `block` (or `inline-grid` with a motion child); its original inline display and priority are restored on settlement, replacement, failure and teardown. Define the Pop state so it can render after that temporary override is released. Only Present-owned property transitions are scrubbed; independent CSS keyframe animations and arbitrary extra transition properties are not a gesture timeline.

`INFO_PRESENT_GESTURE_HIDDEN` (`3004`) records when the configured source is the Present itself and its computed display is `none`. It does not block mounting or change CSS. Use an external source for such a region. The diagnostic infrastructure deduplicates equivalent situations. A rendered, partially exposed Unpop region produces no hidden-source INFO.

### Bottom region with an exposed handle

```html
<button data-ae-present-trigger="pop" data-ae-present-target="bottom-region">Open</button>
<section id="bottom-region" class="ae--unpop bottom-region"
  data-ae-present="transform" data-ae-present-gesture="up"
  data-ae-present-gesture-dismiss="left" data-ae-dismiss-on-click="none"
  style="--ae-from-transform:translateY(288px);--ae-pop-transform:translateY(0px);
    --ae-dismiss-transform:translateX(-110%);--ae-present-gesture-distance:288px;
    --ae-present-pop-threshold:.6;--ae-present-unpop-threshold:.4">
  <div>Drag handle</div>
  <button data-ae-present-trigger="unpop">Close to handle</button>
  <button data-ae-present-trigger="dismiss">Dismiss independently</button>
</section>
<style>
  .bottom-region { position:fixed; bottom:0; height:320px; touch-action:none; }
</style>
```

### Side region with an external source

```html
<div id="side-handle" style="touch-action:pan-y">Drag right</div>
<button data-ae-present-trigger="pop" data-ae-present-target="side-region">Open side region</button>
<aside id="side-region" class="ae--unpop" data-ae-present="transform"
  data-ae-present-gesture="right" data-ae-present-gesture-source="side-handle"
  data-ae-present-gesture-unpop="false" data-ae-present-gesture-dismiss="up"
  style="--ae-from-transform:translateX(-280px);--ae-pop-transform:translateX(0px);
    --ae-dismiss-transform:translateY(-110%);--ae-present-gesture-distance:280px;
    width:280px;touch-action:pan-x">
  <button data-ae-present-trigger="unpop">Reverse programmatically</button>
</aside>
```

Choose touch-action on a local handle or region according to the intended gesture axes. Browsers decide native touch scrolling at pointerdown, so preventing a later pointermove cannot reclaim a gesture already assigned to scrolling. A local handle needing both axes may require `touch-action:none`; Present never sets it globally. Inputs, links/buttons without `draggable="false"` and contenteditable regions retain their input. If a nested Scrollbox or native scroll container can scroll in the initial drag direction, it owns that entire press even after reaching its edge. Release and start a new outward gesture from the edge to move Present. Scrollbar thumbs remain excluded. On touch surfaces, the browser may cancel the pointer after assigning it to native scrolling; a dedicated handle remains useful. Completed drags suppress the associated compatibility click, while ordinary presses remain clicks. Shared sources choose the most specific matching region, then the most recently presented region; one pointer controls one Present. Keep keyboard buttons available and choose accessible semantics for the component built with Present.

### Gesture distribution cost

The gesture recognizer is private to Present and introduces no package dependency. Measurements compare the preceding build with this implementation, including Scrollbox-compatible controls and automatic interactive-source correction, in bytes (gzip level 9):

| Artifact | Before raw / gzip | After raw / gzip | Budget raw / gzip (KiB) |
| --- | --- | --- | --- |
| Present Modern | 36,995 / 12,135 | 49,932 / 16,318 | 36.25 / 12 → 49 / 16 |
| Present Legacy | 50,752 / 15,735 | 67,972 / 20,648 | 49.75 / 15.5 → 66.5 / 20.25 |
| Present CSS | 5,703 / 1,009 | 6,134 / 1,066 | 5.75 / 2 → 6.125 / 2 |
| Full Modern | 215,270 / 66,267 | 228,321 / 70,513 | 210.5 / 65 → 223 / 69 |
| Full Legacy | 545,453 / 160,895 | 562,863 / 165,880 | 533 / 157.5 → 550 / 163 |
| Full CSS | 126,376 / 11,952 | 126,807 / 12,017 | 123.75 / 12 → 124 / 12 |
| ESM boot | 26,971 / 9,287 | 27,220 / 9,391 | 26.5 / 9.25 → 26.75 / 9.25 |
| Modern Orchestrator | 66,546 / 21,946 | 66,657 / 21,988 | 65 / 21.5 → 65.25 / 21.5 |

The boot and Orchestrator deltas include the INFO catalog entry and preservation of authored Present state classes during mounting. Without gesture opt-in there are no gesture pointer listeners or continuous gesture scheduling loops. Discontinuous easing such as `steps()` retains linear timing on release when the authored curve cannot represent the current scrubbed value without a jump.

The later flick detection raises the current raw caps to 55 KiB for Present Modern and 235 KiB for Full Modern; their gzip caps stay at 17.75 KiB and 73.25 KiB. The resulting builds measure 55,738 / 18,027 bytes and 239,896 / 74,969 bytes (raw / gzip), respectively.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Gesture capability | Known Limit | Interactive scrubbing requires inspectable Web Animations transitions and `setKeyframes()`. Browsers without them retain the programmatic CSS fallback and report `2026` on gesture intent. | Use programmatic and keyboard alternatives. |
| Gesture ownership | Known Limit | New drags start from established states. Active automatic transitions retain ownership until completion or explicit API replacement. Sources use light-DOM ID lookup. | Finish or replace an operation before beginning a new gesture. |
| Touch and distance | Potential Risk | Native touch scrolling can cancel an unconfigured axis. Auto distance is an estimate for non-translational geometry. Physical device and assistive-technology behavior needs application validation. | Set local touch-action and an explicit distance where needed; test target devices. |
| Logical/visual state | Known Limit | <span class="large">Accepted group selection and trigger expanded state can precede visual completion. Outgoing and incoming members may be visible together; completion order is not guaranteed.</span> | <span class="large">Query selected() for logical membership and await show() for a completed current selection.</span> |
| Interruption | Known Limit | <span class="large">Superseded transitions do not publish obsolete successful completion. Standalone pop() restarts from hidden; toggle(..., true) and group opening follow their documented idempotent behavior.</span> | <span class="large">Choose the matching API and handle false from invalid, refused or superseded group show() requests.</span> |
| Progress | Known Limit | <span class="large">Interpolation requires successful property/phase registration and clamp support. Missing or duplicate registration selects bounded discrete endpoints while visual transitions remain available.</span> | <span class="large">Validate the registration path before requiring continuous progress; see Present Progress.</span> |
| CSS ownership | Potential Risk | <span class="large">Present owns hidden and presentation state. Anchor owns a shared element transform; other replacing transform writers can still compete. External hidden/style changes can conflict with transitions.</span> | <span class="large">Apply independent transforms to descendants and coordinate visibility through the mounted API.</span> |
| Layout cost | Potential Risk | <span class="large">Size transitions without a direct motion child measure dimensions; many simultaneous transitions or changing content add layout work.</span> | <span class="large">Use the motion-child strategy where appropriate and profile real content changes.</span> |
| Semantics | Known Limit | <span class="large">Groups add no tabs/dialog roles. Focus is released when closing hides the active element; restoration relies on Focus or application integration.</span> | <span class="large">Provide the semantics, keyboard behavior, reduced-motion styles and focus destination required by the UI pattern.</span> |
| Coverage | Validation Gap | <span class="large">Tests exercise group vetoes, reversal, ARIA, progress fallbacks and tap/click routing. Real assistive-technology workflows and physical hover/touch hybrids are not established by desktop fixtures.</span> | <span class="large">Validate the UI pattern and devices beyond DOM/ARIA assertions.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/release/0.1.0/src/aellux.ext.present.js), [present-enhancements.spec.mjs](https://github.com/aelluxjs/core/blob/release/0.1.0/tests/browser/present-enhancements.spec.mjs), [present-aria.spec.mjs](https://github.com/aelluxjs/core/blob/release/0.1.0/tests/browser/present-aria.spec.mjs), [present-tap.spec.mjs](https://github.com/aelluxjs/core/blob/release/0.1.0/tests/browser/present-tap.spec.mjs).

## Effect distribution cost

Measured against the committed pre-migration artifacts (`fa32fa5c`) in this working branch, in bytes (raw / gzip level 9). These measurements supersede the historical delivery snapshots above.

| Minified artifact | Before | After | Delta |
| --- | --- | --- | --- |
| aellux.ext.present.min.js | 50,516 / 16,535 | 54,650 / 17,682 | +4,134 / +1,147 |
| aellux.ext.present.legacy.min.js | 69,903 / 20,983 | 75,541 / 22,443 | +5,638 / +1,460 |
| aellux.ext.present.min.css | 6,134 / 1,066 | 8,892 / 1,459 | +2,758 / +393 |
| aellux.ext.feedback.min.js | 4,918 / 2,117 | 4,666 / 2,050 | -252 / -67 |
| aellux.ext.feedback.legacy.min.js | 9,167 / 3,991 | 8,980 / 3,903 | -187 / -88 |
| aellux.ext.feedback.min.css | 2,790 / 541 | 74 / 94 | -2,716 / -447 |
| aellux.full.min.js | 234,881 / 73,521 | 238,729 / 74,617 | +3,848 / +1,096 |
| aellux.full.legacy.min.js | 575,895 / 170,045 | 581,410 / 171,397 | +5,515 / +1,352 |
| aellux.full.min.css | 124,824 / 11,862 | 124,866 / 11,867 | +42 / +5 |

Basic consumers loading only Feedback no longer download its animation implementation or presets. Consumers needing visual effects load Present and its stylesheet explicitly. Present CSS carries the sole preset definitions; Feedback CSS remains an empty licensed compatibility artifact. Full includes those definitions once, with only a small stylesheet change from the new class names.

Budgets (raw / gzip KiB) become 54 / 17.75 for Present Modern, 75 / 22.5 for Present Legacy and 9 / 1.5 for Present CSS; Full Modern becomes 234 / 73.25 and Full Legacy 569 / 168. Feedback budgets shrink to 4.75 / 2.125 for Modern, 8.875 / 3.875 for Legacy and 0.25 / 0.25 for its licensed CSS artifact. Full CSS retains its existing 124 / 12 budget. Deploy the new runtime, styles and migrated declarations together.
