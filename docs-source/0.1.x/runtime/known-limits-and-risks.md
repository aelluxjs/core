# Known Limits & Risks

This page describes shared Core and runtime boundaries. Each [official Extension](#official-extension-reference) documents its own constraints. These notes describe the current contract; they do not establish new test results or guarantee identical behavior in every host environment.

| Type | Meaning |
| --- | --- |
| Known Limit | <span class="large">A restriction established by the implementation or public contract.</span> |
| Potential Risk | <span class="large">An outcome that may occur under stated operating conditions; it is not a confirmed defect.</span> |
| Validation Gap | <span class="large">A scenario whose reliability is not established by the available validation.</span> |
| Known Issue | <span class="large">A reproducible defect, requiring an observed result and a regression test or issue reference when available. A missing test alone is not a Known Issue.</span> |

## Known Limits

### Runtime and compatibility

**Known Limit.** The ES5 boot selects Modern or Legacy using its capability catalog. Modern syntax support is only one input: available DOM APIs, Extension dependencies and the selected distribution also matter. Legacy supplies the documented shared polyfills and ES5 output; it does not establish support for every historical browser. Extensions remain responsible for APIs outside that shared contract.

Feature detection establishes that a checked surface exists, not that every implementation has identical semantics, performance or integration. A polyfill can provide a useful API without reproducing every native platform feature, as with Dialog's top layer. Do not turn preliminary syntax-version references into functional support promises. See [Browser support](browser-support.md), [Modern and Legacy](modern-legacy.md), and [ES5 support](es5-support.md).

### Modular loading

**Known Limit.** Full incorporates the eleven Bundled Extensions and registers all official Extensions. Optional Extensions (Ajax Href, Dialog, PWA and Viewport) remain separate lazy scripts. Basic starts with no Extension registrations; the host must declare each desired Extension and its loading policy. `$ae.wait(name)` requires an existing registration. Selected Extensions may declare required Extension dependencies during initialization. Bundled availability and initialization are separate: matching markup or an explicit request still determines when lazy behavior initializes.

**Potential Risk.** On-demand loading adds first-use network and initialization latency. Missing files, incorrect base URLs, unavailable registry metadata for a requested version, incompatible build declarations, unavailable third-party dependencies, CSP blocks or an SRI mismatch can prevent loading. The current version can reuse the boot's signed registry without fetching a manifest; custom/version-specific delivery must provide the resources its registration requires. Concurrent loads and supported retries do not guarantee eventual success while the delivery problem remains.

Extension CSS has its own delivery contract. A stylesheet load warning may leave JavaScript initialized without its intended presentation. Deploy matching boot/runtime/Extension/CSS files together and verify the actual derived Modern, Legacy and minified URLs. See [Official registry](../extensions/official-registry.md), [Lazy loading](../extensions/lazy-loading.md), [Extension styles](../extensions/styles.md), and [CSP and trust](../extensions/csp-and-trust.md).

### Events and observation

**Known Limit.** Event dispatch is synchronous; the operation or observer that dispatches it may run asynchronously. A lifecycle completion event follows the awaited callbacks for that pass, while an Extension's `Layout` or logical-selection notification can precede visual completion. The event catalog defines the distinction; events are not a stream of every browser layout or compositor change.

Cancelable preflight listeners must call `preventDefault()` synchronously. Returning a Promise from a listener does not delay DOM event dispatch or veto an operation after dispatch ends. Register initial-state listeners before initialization or query the relevant current-state API after loading: notifications are not generally replayed for late subscribers. Teardown and state replacement can themselves publish events, such as Present Group selection removal. Event detail is not universally immutable: use each producer's payload contract. See [Events](events.md).

## Performance Risks

All rows below are **Potential Risks**, not measured regressions or capacity limits.

| Conditions | Potential impact | Practice |
| --- | --- | --- |
| <span class="large">Many geometry consumers, large DOM subtrees, or frequent resize/scroll/mutations.</span> | <span class="large">More measurements, callbacks, style calculation and layout work on the main thread.</span> | <span class="large">Mount only needed behavior and profile representative content and input.</span> |
| <span class="large">Expensive scheduled callbacks or unrelated application work.</span> | <span class="large">Reduced publication cadence and delayed interaction feedback.</span> | <span class="large">Keep callbacks bounded and avoid extra layout reads in event subscribers.</span> |
| <span class="large">Effects change the same geometry that determines their input.</span> | <span class="large">Feedback and repeated layout or paint work.</span> | <span class="large">Separate structural measurement elements from visual effects.</span> |

`waitLayout` batches geometry reads and dependent writes; it cannot remove the cost of the requested operations or coordinate arbitrary work in other libraries. Its adaptive FPS policy, explicit ceilings and hidden-page suspension mean callbacks need not run every browser frame. Native CSS and compositor animation can progress between measurements. A resolved scheduled task describes that task's result, not a frame-perfect lock to the compositor or the final settlement of all future observer notifications. See [waitLayout](wait-layout.md) and [CSS Motion](css-motion.md).

[Bundle budgets](performance.md#scope-and-limitations) measure distribution bytes. They are not runtime latency, memory, layout or real-user performance benchmarks; those require workload-specific measurements.

## Behavioral Risks

### Lifecycle and mounting

**Known Limit.** Initialization and element mounting can be asynchronous. Await `$ae.wait(name)` before using an Extension service and await `$ae.mount(root)` before using newly mounted controllers. Handle a missing Extension result, diagnostics and partial mount results rather than treating Promise settlement as universal success. Dynamic insertion alone does not replace the explicit mount contract. An Extension dependency that initializes successfully may still need its element included in the same mount pass; an Extension filter can omit it.

Mounting, updates, detached-node cleanup and destruction use the shared lifecycle. In-flight mount/removal and unmount cleanup have regression coverage, including moves and callback failures. This is not a guarantee that arbitrary third-party asynchronous side effects are canceled automatically. Extension authors must release their own resources and guard late writes; application code should avoid using controllers after their mount ends.

**Potential Risk.** A synchronous `BeforeMount` or `BeforeUnmount` veto can intentionally leave the desired operation incomplete. A canceled mount resolves to `[]`; canceled unmount resolves to `false`. Canceling startup mount still permits `Ready`. Vetoing detached cleanup retains registrations until a later cleanup or explicit unmount; it starts no retry loop. Destruction can return `false` if unmount is vetoed. Updates have no preflight cancellation hook. Check results and retry deliberately after the veto condition changes. See [Events](events.md#runtime-lifecycle) and [Authoring](../extensions/authoring.md#dom-mount-contract).

**Potential Risk.** High-frequency handlers and reentrant state changes can add work or supersede pending operations. Present's group preflight and Ajax Href's response identity guards cover their documented cases; they do not make arbitrary application listener sequences transactional. Await the operation whose resulting state matters, and use each Extension's interruption contract.

### Persistence and shared state

**Known Limit.** Only explicitly persisted values use storage. Preferences can use `localStorage`; Focus history is bounded in memory, and State Navigation uses the current window's history/hash rather than a durable application database. When obtaining a storage object fails or its required methods are unavailable, the persistence helper reports a memory fallback. Later `getItem()`/`setItem()` failures, quota exhaustion or access revocation are not covered by that initial fallback check and can still throw. Handle persistence failures without assuming the choice survived reload or reached another tab.

**Potential Risk.** Sharing managed attributes, classes or inline styles with another script requires coordinated ownership. `persist.element.save()` restores a saved snapshot of named properties/attributes, including original inline priority; it is not a merge of external edits made during the mount. Individual Extensions can have more selective policies, such as Marquee's owned tooltip. Preference storage notifications do not provide cross-device synchronization, conflict resolution or a transaction protocol. See [Preference](../core-extensions/preference.md#known-limits-risks) and the individual lifecycle sections.

### Security and trust

**Known Limit.** Loaded Extensions run as application code in the page's JavaScript context. Registration is not a sandbox or a grant of restricted permissions. Review distributed third-party code, dependencies and origins. CSP controls allowed resource loads and execution; SRI checks expected resource bytes. Neither guarantees that allowed code is safe, and SRI does not replace CSP. The loader does not add CSP nonces to its generated elements.

**Potential Risk.** Untrusted registration URLs, fetched HTML or custom renderer content can cross application trust boundaries. Keep asset URLs under application control, validate external content, and apply application security controls before insertion. Ajax Href is not an HTML sanitizer. Assess initialization scripts, inline style mutations, worker imports and network requests against the deployment's policy; this documentation does not establish a universal restrictive-CSP profile. See [CSP and Extension trust](../extensions/csp-and-trust.md).

### Accessibility and integration

**Known Limit.** Behavior attributes do not turn arbitrary markup into complete accessible controls. Use native HTML semantics, names and keyboard paths; configure focus handling and announcements for content replacement and custom interfaces. Preference publishes resolved reduced-motion and other settings, but application styles and third-party effects must consume those settings themselves.

**Potential Risk.** Other frameworks can replace managed nodes, intercept input, overwrite transforms or compete for focus/history. Use the normal unmount/mount lifecycle around replacement, coordinate ownership, and preserve native navigation and input alternatives. Automated DOM/ARIA assertions do not demonstrate universal WCAG conformance or assistive-technology compatibility. See [Accessibility requirements](../extensions/accessibility.md) and [Bootstrap integration](../integrations/bootstrap.md).

## Compatibility & Validation Gaps

| Evidence | Boundary |
| --- | --- |
| Unit tests | <span class="large">Exercise the supplied helper logic and controlled environments; they do not establish rendered browser or device behavior.</span> |
| Playwright Chromium, Firefox and WebKit | <span class="large">Exercise current desktop engines and available capabilities. Capability skips remain gaps for the skipped paths; Chromium is not an installed Chrome/Edge test and WebKit is not full iOS Safari validation.</span> |
| Forced Legacy | <span class="large">Exercises the Legacy distribution in current engines, without establishing historical-browser support.</span> |
| Commercial browsers and physical devices | <span class="large">OS input, real mobile keyboards, touch/pen hardware, installation UI and visual viewport changes need direct validation beyond desktop emulation.</span> |
| Application integration | <span class="large">Screen readers, restrictive CSP deployments, heavy workloads, storage failure combinations and third-party asynchronous races require their own reproducible checks.</span> |

The unestablished scenarios above are **Validation Gaps**, not browser-specific Known Issues. Existing checks include lifecycle vetoes, async mounting/removal, resource integrity, storage-access fallback and several cross-Extension combinations. They do not cover every possible interleaving or deployment. Consult [Browser support](browser-support.md), [Compatibility](../compatibility.md), and [Validation scenarios](../validation-scenarios.md) for the current recorded scope. Test presence is distinct from a fresh successful run; preserve failures, infrastructure failures and capability skips as separate results.

## Recommended Practices

1. Deploy a consistent asset set and verify final lazy-load URLs, CSS, CSP and integrity configuration.
2. Register listeners before initialization when initial notifications matter; await initialization/mount and inspect results before accessing services or controllers.
3. Coordinate DOM, CSS, focus, history and storage ownership with other libraries. Use explicit unmount/mount around replacement.
4. Batch layout work, keep subscriptions inexpensive, and profile the elements and gestures the application actually uses.
5. Provide native keyboard and navigation alternatives, consume resolved accessibility preferences, and review real assistive-technology behavior.
6. Prioritize physical mobile input/viewport and installation tests, historical targets if required, failure-mode coverage and representative runtime benchmarks.
7. Follow the [documentation convention](../extensions/authoring.md#known-limits-risks) as contracts and evidence evolve. Record a Known Issue only with a reproducible observation.

## Official Extension Reference

The [official catalog](https://github.com/aelluxjs/core/blob/update/beta.10/src/official-extension-definitions.js) defines these fifteen Extensions. Optional distribution status does not remove an Extension from this documentation contract.

| Bundled Extensions | Optional Extensions |
| --- | --- |
| [Adaptive](../core-extensions/adaptive.md#known-limits-risks) | [Ajax Href](../core-extensions/optional/ajax-href.md#known-limits-risks) |
| [Anchor](../core-extensions/anchor.md#known-limits-risks) | [Dialog](../core-extensions/optional/dialog.md#known-limits-risks) |
| [Feedback](../core-extensions/feedback.md#known-limits-risks) | [PWA](../core-extensions/optional/pwa.md#known-limits-risks) |
| [Focus](../core-extensions/focus.md#known-limits-risks) | [Viewport](../core-extensions/optional/viewport.md#known-limits-risks) |
| [Overflow Marquee](../core-extensions/overflow-marquee.md#known-limits-risks) | |
| [Point](../core-extensions/point.md#known-limits-risks) | |
| [Preference](../core-extensions/preference.md#known-limits-risks) | |
| [Present](../core-extensions/present.md#known-limits-risks) | |
| [Scrollbox](../core-extensions/scrollbox.md#known-limits-risks) | |
| [Scrollbox Snap](../core-extensions/scrollbox-snap.md#known-limits-risks) | |
| [State Navigation](../core-extensions/state-navigation.md#known-limits-risks) | |

Evidence for the shared boundaries includes the [mount helper](https://github.com/aelluxjs/core/blob/update/beta.10/src/internal/create-mount-helper.js), [storage helper](https://github.com/aelluxjs/core/blob/update/beta.10/src/internal/build-persist-memory.js), [element snapshot helper](https://github.com/aelluxjs/core/blob/update/beta.10/src/internal/create-save-element-memory-helper.js), [preflight checks](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/lifecycle-preflight.spec.mjs), [runtime contract checks](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scenarios.spec.mjs), and the guides linked above.
