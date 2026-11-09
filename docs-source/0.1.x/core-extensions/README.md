# Core Extensions

Core Extensions are the sixteen official Extensions distributed with aellux.js. Each owns a focused behavior and follows the shared registration, mounting and lifecycle contract.

The Full bundle automatically includes all Core primitives: reusable building blocks for components and new behaviors, covering sizing, positioning, feedback, focus, pointer state, preferences, presentation, scrolling, history and viewport geometry. It does not bundle every Extension available in Core. Optional navigation and environment Extensions, such as Ajax Href and PWA, remain separate and load on demand. Preference is bundled and initializes automatically in Full.

Components and specialized behaviors load separately. Overflow Marquee and Scrollbox Snap remain registered as separate scripts temporarily, pending migration to external extensions. Each page also declares its stability.

## Extension index

- [Bundled Extensions](#bundled-extensions)
- [Optional Extensions](#optional-extensions)

## Distribution

Dialog and Progress remain Optional Extensions because their main additional value is Legacy compatibility. Modern browsers already provide native dialog, progress and meter controls; the separate Legacy artifacts supply the missing behavior and required fallback styles without adding that compatibility code to Full.

| Category | Full mode | Basic mode |
| --- | --- | --- |
| Bundled Extensions | Implementation included in the Full JavaScript bundle. | Explicit registration; separate script. |
| Optional Extensions | Separate signed scripts loaded on demand. | Explicit registration; separate script. |

Full automatically registers all sixteen official Extensions. Preference and State Navigation initialize at startup; the other Bundled Extensions initialize when matching markup is mounted or the Extension is explicitly requested. Optional Extensions load their own compatible scripts when needed.

Basic starts with no Extension registrations. The developer declares each desired Extension through `$ae.ext(...)` or `<link rel="aelluxjs-ext">` and chooses eager loading, a `loadWhen` selector, or `load: false` followed by `$ae.wait(name)`. Markup attributes alone do not register Extensions. Selected Extensions may declare their own required dependencies.

```js
$ae.ext("scrollbox", { loadWhen: "[data-ae-scrollbox]", loadStyle: true });
$ae.init({ mode: "basic" });
```

State Navigation has no activation selector; register it explicitly before requesting its API. Basic Extension styles are opt-in through `loadStyle: true`. See [Getting Started](../getting-started.md) and [Lazy Loading](../extensions/lazy-loading.md) for configuration and loading details.

## Stability

| Status | Meaning |
| --- | --- |
| Stable | Mature implementation with usage documentation, tests and validation appropriate to its documented scope; no API compatibility guarantee. |
| Not stable (unstable) | Implementation and contracts are still stabilizing and may change more frequently; no API compatibility guarantee. |

Distribution and stability are independent. Focus, Input and Viewport are included in Full and remain **Not stable**. Ajax Href, Dialog, Progress and PWA are also **Not stable** and load separately. Overflow Marquee and Scrollbox Snap remain **Stable** while delivered separately. Nine official Extensions are **Stable**.

Stability appears on each Extension page and in the index below. Navigation groups follow distribution. Documented limits and compatibility requirements apply to both statuses. Each Extension's Known Limits & Risks section describes its boundaries; see also the [shared Core limits](../runtime/known-limits-and-risks.md).

The [Compatibility Commitment](../runtime/compatibility-commitment.md) protects only minimal global initialization and declarative activation/mounting during `0.1.x`. Stable and Not stable describe maturity and validation, independently of API compatibility. Extension methods, behavioral attributes, events and CSS may change incompatibly within this line, with relevant changes documented and migration guidance when appropriate. Classifications below remain unchanged.

<h2 id="bundled-extensions">Bundled Extensions</h2>

These ten Extensions are included in the Full JavaScript bundle.

| Extension | Stability |
| --- | --- |
| [Adaptive](adaptive.md) | Stable |
| [Anchor](anchor.md) | Stable |
| [Feedback](feedback.md) | Stable |
| [Focus](focus.md) | Not stable |
| [Input](input.md) | Not stable |
| [Preference](preference.md) | Stable |
| [Present](present.md) | Stable |
| [Scrollbox](scrollbox.md) | Stable |
| [State Navigation](state-navigation.md) | Stable |
| [Viewport](viewport.md) | Not stable |

<h2 id="optional-extensions">Optional Extensions</h2>

These six Extensions load separate signed scripts. Full registers them automatically; Basic requires an explicit declaration.

| Extension | Stability |
| --- | --- |
| [Ajax Href](optional/ajax-href.md) | Not stable |
| [Dialog](optional/dialog.md) | Not stable |
| [Overflow Marquee](optional/overflow-marquee.md) | Stable |
| [Progress](optional/progress.md) | Not stable |
| [PWA](optional/pwa.md) | Not stable |
| [Scrollbox Snap](optional/scrollbox-snap.md) | Stable |
