# Recent behavior and beta migration

Reviewed against the `release/0.1.0` checkout on 2026-11-10, based on commit `19979d63`. The package version remains `0.1.0-beta.10`; these changes are unreleased and the version number alone does not identify the asset revision. Deploy matching boot, runtime, extensions, adapters and styles, and refresh application-owned offline caches.

## Migration checklist

| Area | Current behavior and required migration |
| --- | --- |
| Global identifier | Use `aelluxJs` or `$ae`. The earlier capitalized global has no compatibility alias. DOM event names remain unchanged, including `AelluxJsReady`. See [Naming and Migration](brand-naming.md). |
| Present controls | Use `data-ae-present-trigger`, `data-ae-present-target` and `data-ae-present-trigger-on`. A target alone does not mount a control. Replace the old dismiss attribute with `data-ae-present-trigger="dismiss"`. See [Declarative Action Naming](extensions/declarative-action-naming.md). |
| Closing operations | `dismiss()` closes toward the independent dismiss destination from the rendered state; `unpop()` reverses the captured opening trajectory. Migrate earlier beta usages of Unpop that meant dismissal, including attributes, CSS and events, using the [Present migration table](core-extensions/present.md#operations-and-prerelease-migration). |
| Feedback destinations | Use `data-ae-feedback-message-target` and `data-ae-feedback-effect-target`. Semantic messages work without Present; visual effects require a mounted containing Present and Present CSS. The `motion` payload still requests an effect. See [Feedback](core-extensions/feedback.md). |
| Input adapters | Register `input`, replacing the former Point Extension. `data-ae-point` and Tap events remain available. Physical adapters use separate `aellux.input.*` assets; gamepad is opt-in. See [Input](core-extensions/input.md). |
| Full delivery | Full embeds ten primitives. Ajax Href, Dialog, Overflow Marquee, Progress, PWA and Scrollbox Snap remain separate Optional scripts. Basic still requires explicit registration. See [Official Registry](extensions/official-registry.md). |
| Bootstrap theme | `syncBootstrapThemeTag` is a top-level initialization option, disabled by default. It is no longer a Preference option; the boot owns the theme tag. See [Runtime API](runtime/api.md). |

## New behavior to account for

- **Present click closing:** click closing is opt-in. Both `data-ae-unpop-on-click` and `data-ae-dismiss-on-click` default to `false`. Both accept `inside`, `outside` and `false`; matching Dismiss takes priority. Set both to `false` to disable automatic click closing.

- **Present effects:** `effect()` returns a Promise with `completed`, `aborted` or `skipped` status. Only the latest request survives; effects wait for the captured transition, stop on accepted replacement transitions, and skip reduced motion. Preset transforms need an untransformed target; use an inner element when Present, Anchor or Elastic owns the outer transform. See [Temporary effects](core-extensions/present.md#temporary-effects).
- **Present gestures:** optional gestures scrub Pop, Unpop and Dismiss. Authored initial state classes can opt into CSS-owned closed visibility; a closed state does not necessarily mean hidden. Keep keyboard controls and configure local touch behavior. See [Interactive gestures](core-extensions/present.md#interactive-gestures).
- **Focus directions:** candidates follow visual geometry, scoped boundaries and native scrolling. `data-ae-focus-nav` is resolved for each command. Keyboard directions remain native under `auto` in synchronized context 1; spatial navigation requires opt-in there. Gamepad and independent contexts use spatial navigation automatically. See [Spatial navigation](core-extensions/focus.md#spatial-navigation-and-input-policy).
- **Anchor tracking:** geometry updates change an active transition's destination without restarting its original deadline. Changing the actual target starts a new transition. See [Anchor](core-extensions/anchor.md).
- **Extension communication:** `$ae.comm` provides synchronous named requests and notifications with owner cleanup. The provisional Input channel is removed. Internal calls no longer depend on replacing public Extension methods. See [Shared Communication](runtime/communication.md).

## Documentation and repository boundaries

The homepage, interactive examples and Library now belong to the separate [website repository](https://github.com/aelluxjs/aelluxjs.github.io). Their former `home/` files and browser tests are absent from this Core checkout. Historical changelog and audit results describe the repository at the time of those runs; they do not establish current website coverage.

Distribution tables in individual guides record the cost of particular changes. Use [Performance and Bundle Budget](runtime/performance.md) for the dated current artifact snapshot and the command that checks current limits. Historical measurements are not runtime benchmarks or evidence of a new validation run.

The [Compatibility Commitment](runtime/compatibility-commitment.md) starts at `0.1.0` and protects only the enumerated minimal initialization and declarative activation/mounting surface. Stable labels describe maturity. The [Compatibility Policy Review](runtime/compatibility-policy-review.md) remains pending and non-normative.
