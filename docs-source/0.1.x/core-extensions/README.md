# Core Extensions

Core Extensions are the sixteen official Extensions distributed with aellux.js. Each owns a focused behavior and follows the shared registration, mounting and lifecycle contract.

This index groups Extensions by how their implementation is delivered in Full. Each page also declares its stability.

## Extension index

- [Bundled Extensions](#bundled-extensions)
- [Optional Extensions](#optional-extensions)

## Distribution

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
| Stable | Stabilized public API and behavior. |
| Not stable (unstable) | Public API and behavior may change during stabilization. |

Distribution and stability are independent. Focus and Point are included in Full and remain **Not stable**. Ajax Href, Dialog, Progress, PWA and Viewport are also **Not stable** and load separately. The other nine official Extensions are **Stable**.

Stability appears on each Extension page and in the index below. Navigation groups follow distribution. Documented limits and compatibility requirements apply to both statuses. Each Extension's Known Limits & Risks section describes its boundaries; see also the [shared Core limits](../runtime/known-limits-and-risks.md).

The [Compatibility Commitment](../runtime/compatibility-commitment.md) protects Stable public contracts from `0.1.0` throughout `0.1.x`. Not stable Extensions remain available but may change incompatibly with documented migration guidance. This policy does not change the classifications below or retroactively stabilize earlier betas.

<h2 id="bundled-extensions">Bundled Extensions</h2>

These eleven Extensions are included in the Full JavaScript bundle.

| Extension | Stability |
| --- | --- |
| [Adaptive](adaptive.md) | Stable |
| [Anchor](anchor.md) | Stable |
| [Overflow Marquee](overflow-marquee.md) | Stable |
| [Feedback](feedback.md) | Stable |
| [Focus](focus.md) | Not stable |
| [Point](point.md) | Not stable |
| [Preference](preference.md) | Stable |
| [Present](present.md) | Stable |
| [Scrollbox](scrollbox.md) | Stable |
| [Scrollbox Snap](scrollbox-snap.md) | Stable |
| [State Navigation](state-navigation.md) | Stable |

<h2 id="optional-extensions">Optional Extensions</h2>

These five Extensions load separate signed scripts. Full registers them automatically; Basic requires an explicit declaration.

| Extension | Stability |
| --- | --- |
| [Ajax Href](optional/ajax-href.md) | Not stable |
| [Dialog](optional/dialog.md) | Not stable |
| [Progress](optional/progress.md) | Not stable |
| [PWA](optional/pwa.md) | Not stable |
| [Viewport](optional/viewport.md) | Not stable |
