# Compatibility Commitment — AelluxJS 0.1.x

> Preserve stable public contracts and observable behavior without freezing their internal implementation.

This document defines how AelluxJS preserves and evolves its public contracts, beginning with `0.1.0` and continuing through subsequent `0.1.x` releases. [Compatibility](../compatibility.md) describes technical requirements and validated environments; this commitment defines the rules for changing the API within those boundaries.

The current package is still a prerelease. This commitment does not retroactively stabilize earlier betas, their superseded names, or their behavior. The release baseline is the public contract delivered with `0.1.0`; a compatible public addition receives protection from the release that introduces it.

## 1. Scope & Stability

[Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html#spec-item-4) treats `0.y.z` as initial development and does not automatically establish a stable public API. AelluxJS adopts the narrower, project-specific commitment below for the `0.1.x` line.

| Classification | Compatibility commitment | AelluxJS examples |
| --- | --- | --- |
| Stable Public API | Preserved throughout `0.1.x`, subject to documented exceptional fixes. | <span class="large">Documented Core methods such as `$ae.mount()`, `BeforeMount`, and Stable Extension contracts such as Present's `pop()`, `data-ae-present`, and `--ae-pop-progress`.</span> |
| Experimental Public API | May evolve, including incompatible changes, with appropriate documentation. | <span class="large">The Not stable Focus and Point APIs; Optional Viewport attributes, outputs and events.</span> |
| Internal Implementation | No compatibility guarantee. | <span class="large">Private controller maps, Marquee's generated wrapper structure, `data-ae-scrollbox-fade-state`, and `--ae-present-pop-phase`.</span> |

Protection applies to documented public names, supported inputs, defaults, results and observable semantics under the documented prerequisites. It does not imply identical behavior for invalid inputs unless their handling is itself documented. Known limits, required markup, lifecycle rules, dependencies and platform capabilities remain part of each contract.

### Extension classification

The [Core Extensions index](../core-extensions/README.md#stability) and individual guides establish the current classification:

| Stability | Current distribution in Full | Extensions |
| --- | --- | --- |
| Stable | Bundled | <span class="large">[Adaptive](../core-extensions/adaptive.md), [Anchor](../core-extensions/anchor.md), [Overflow Marquee](../core-extensions/overflow-marquee.md), [Feedback](../core-extensions/feedback.md), [Preference](../core-extensions/preference.md), [Present](../core-extensions/present.md), [Scrollbox](../core-extensions/scrollbox.md), [Scrollbox Snap](../core-extensions/scrollbox-snap.md), [State Navigation](../core-extensions/state-navigation.md).</span> |
| Not stable | Bundled | [Focus](../core-extensions/focus.md), [Point](../core-extensions/point.md). |
| Not stable | Optional | <span class="large">[Ajax Href](../core-extensions/optional/ajax-href.md), [Dialog](../core-extensions/optional/dialog.md), [Progress](../core-extensions/optional/progress.md), [PWA](../core-extensions/optional/pwa.md), [Viewport](../core-extensions/optional/viewport.md).</span> |

All sixteen remain available during `0.1.x`. Stable Extensions receive the public-contract protection in this document. Not stable means experimental: their methods, markup, CSS and events may change incompatibly, with changelog entries and migration guidance for affected usage. Their current documentation still governs use of each published version.

Stability, distribution, platform compatibility and API compatibility are separate dimensions. Bundled does not mean Stable; Optional does not mean experimental. A loading or packaging change cannot revoke an existing Stable contract. Reclassifying an already Stable interface does not permit its incompatible removal within this line. Third-party Extension behavior is governed by its author; the documented Core registration and lifecycle interfaces remain protected.

## 2. Versioning & API Evolution

Releases after `0.1.0` may include bug fixes, maintenance, internal refactoring, performance improvements, compatible functionality, additional Extensions, new methods or attributes, and optional fields or options. Within this line, these changes use subsequent `0.1.x` versions. New options must preserve existing defaults and valid usage when omitted. Adding an optional field must preserve the meaning and type of existing fields.

For Stable Public APIs, a normal `0.1.x` update must not:

- remove a public method or rename a public attribute;
- reinterpret an existing supported value or incompatibly change a documented default;
- introduce incompatible required parameters or change existing parameter meanings;
- incompatibly change a return type, Promise result or documented failure outcome;
- remove required event fields, change their types, or change documented event routing or order; or
- change established operational semantics while retaining the same signature.

Intentional incompatible changes to Stable APIs belong in a future `0.2.x` line. A bug fix may correct behavior that violates the documented contract; relying on an undocumented defect does not turn it into a guaranteed feature. If a proposed fix would also break documented valid usage, it must be assessed as an incompatibility rather than silently described as maintenance.

Deprecation must identify the affected interface, explain the reason, name a replacement when available, and include migration guidance in the documentation and changelog. A deprecated Stable interface continues to work throughout `0.1.x` under its existing contract. Removal belongs in a later line; this is not a promise of indefinite support. There is no fixed notice period or automatic promotion schedule for experimental APIs.

A security vulnerability or severe defect may require an exceptional incompatible fix. Such a change requires an explicit maintainer decision for that case and documentation of the reason, affected contracts and versions, mitigation or migration, and validation. This is not standing permission to bypass compatibility. The general exception procedure and support-policy proposals remain pending in the separate [Policy Decisions Pending Review](https://github.com/aelluxjs/core/blob/release/0.1.0/milestones/0.1.x-compatibility-policy-review.md).

## 3. JavaScript Public API

The public namespace `AelluxJs` and alias `$ae`, the shared API's documented package entry, and the documented Core methods retain their names and semantics. The [Runtime API](api.md), [Extension registration](../extensions/registration.md) and [authoring contract](../extensions/authoring.md) define the protected surface; this page does not reproduce their complete reference.

Compatibility includes parameter order, supported options and defaults, return types and meanings, availability before or after initialization, and documented asynchronous behavior. In particular:

- `mount()` remains idempotent and resolves to distinct elements newly mounted by that call. Partial failures, empty results and cancellation retain their documented meanings.
- `wait(name)` requires registration, awaits Extension initialization and returns the API or the documented `null` failure result. An asynchronous `init(options)` must finish before the Extension is reported initialized; supported retries remain available.
- Mounted controllers remain accessible through `$ae(elementOrId)` and `mountManager.controller()`. Documented Extension methods keep their element binding. Unmount removes the corresponding methods; a later mount may create a new controller. Controller object identity after remount is not guaranteed.
- Initialization, mount, update, unmount and destruction preserve their documented ordering, cleanup and cancellation behavior. Updating mounted elements does not implicitly register or mount every new declaration. Extension authors retain their obligations to release owned resources.
- Promise settlement, cancellation, supersession and failure must follow each operation's reference. A resolved Promise is not a universal success flag or proof of visual completion. For example, an interrupted Present request can settle without reaching its endpoint, and a canceled unmount resolves to `false`.

Behavior is part of the interface. Standalone `present.pop(element)` restarts opening even when already open; `toggle(element, true)` and opening an already selected exclusive group member have their documented idempotent semantics. Making standalone `pop()` idempotent would be incompatible despite preserving its signature. See [Present](../core-extensions/present.md).

Public error contracts are protected where documented: for example, `request()` rejects unsuccessful HTTP responses with `AelluxJsRequestError` and its `status`, `statusText` and `response`; an automatic error event does not consume a direct caller's Promise rejection. Experimental producers retain their experimental status.

Documented diagnostic identifiers, numeric codes and their meanings remain usable. The documented diagnostics API, severity and verbosity behavior remain public; explanatory wording, stack traces, auxiliary context and internal diagnostic construction may evolve. Required context fields are protected only where documented as part of a specific public contract. Applications should branch on documented codes or structured fields rather than message text. See [Diagnostics](diagnostics.md) and [asynchronous failures](events.md#asynchronous-failures).

Source exports, private helpers, caches, controller storage and undocumented functions do not become Stable merely because they are reachable or appear in an API-shape inspection. Registry access documented by the reference retains its documented use; this does not authorize arbitrary mutation of runtime indexes or freeze their private representation.

## 4. Declarative HTML & CSS Contracts

Public semantic contracts include documented `data-ae-*` inputs and outputs, accepted syntax and values, defaults, public `--ae-*` properties, and classes documented for application use. For Stable behavior, these names, value types, units, ranges and meanings are preserved just as JavaScript contracts are.

Examples include `data-ae-unpop-on-click` values and their default outside dismissal, Present's numeric `--ae-pop-progress` range of `0..1`, Scrollbox's numeric `--ae-scroll-x-progress` range of `0..1`, and Present's documented `ae--pop` state class. A documented output is for observation or styling; setting it is not automatically a supported command.

Dynamic updates follow each Extension's contract. Observer-backed reconfiguration remains supported where documented, such as Present Group selection and Marquee fade changes. New DOM insertion still requires `$ae.mount(root)`. Use the documented controller or `mountManager.update()` where required; there is no promise that arbitrary attribute or CSS changes are observed automatically.

The generated `dist/aellux.semantic.json` catalog, maintained through `scripts/semantic-definitions.mjs`, helps identify names, syntax, defaults and input/output/internal roles. Its native editor formats are described in [Editor support](../integrations/editor-tooling.md). Open-grammar suggestions are examples rather than closed enums. Catalog inclusion alone does not stabilize an internal entry or an experimental Extension. Automatically collected class names and API shapes must be interpreted alongside the specialized public guide; conflicting descriptions require review rather than silent reclassification.

Internal implementation details may change: generated wrapper nesting, auxiliary classes and attributes, private CSS properties, animation bookkeeping and intermediate state machinery receive no independent guarantee. For example, `--ae-present-pop-phase` is internal even though the similarly named `--ae-pop-progress` is public. A documented state class remains public even when the code that manages it changes.

The design principle is **reusable UX behavior without prescribing visual appearance**. Public styling hooks and documented behavior are preserved, while stylesheet generation, selector organization, keyframe implementation and private geometry may evolve. This does not promise identical pixels, computed styles, every intermediate animation value, or invariability of all CSS produced by Extensions. Host styles and documented capability fallbacks still affect rendering.

## 5. Event Contracts

For Stable events, the contract includes the public name, originating target, `bubbles`, `composed`, `cancelable`, required `detail` fields and types, emission conditions, documented relative order, and the meanings of states or transitions. Use `eventName()` and the [Events reference](events.md) for naming and routing. Runtime dispatch defaults to bubbling, noncancelable events; composition is opt-in, so bubbling alone does not promise crossing a shadow boundary. Per-producer declarations take precedence over defaults.

Different event roles must retain their meaning:

| Role | Example | Meaning to preserve |
| --- | --- | --- |
| Intention or command | `PushState` | A request handled by State Navigation; dispatch alone does not prove completion. |
| Cancelable pre-operation | `BeforeMount`, `BeforePop` | Synchronous `preventDefault()` vetoes the documented operation before its effects. |
| Transition in progress | `Popping`, `Unpopping` | A transition starts; the requested endpoint has not necessarily been reached. |
| Completion | `Pop`, `Unpop`, `Mount` | The corresponding current operation or pass finishes according to its own contract. |
| State update | `PreferencesChange` | Reports resolved state and changed keys; it is not a request to change state. |
| Numeric progress | `Progress` | Reports finite `{ value, max }`, with `max > 0` and `0 <= value <= max`, on its producer. |

For example, lifecycle before/completion events originate on `document`; canceling a mount suppresses `Mount` but does not prevent startup from emitting `Ready`. `Ready` does not guarantee that every element mounted successfully. Present emits its before-event before transition-start and current completion notifications; interrupted requests must not publish an obsolete successful completion. See [Runtime lifecycle](events.md#runtime-lifecycle) and [Present](../core-extensions/present.md) for the precise exceptions and payloads.

Required event fields cannot be removed or incompatibly retyped. Optional fields may be added without changing existing meaning. Consumers should tolerate additional fields. Payload ownership and snapshot guarantees apply only where the producer documents them; event detail is not universally immutable.

Generic `AelluxJsProgress` is nonbubbling and noncancelable and must be observed on the producer. It does not require the experimental Progress Extension. `feedback.progress()` continues to emit the distinct, cancelable `AelluxJsFeedback` contract, including boundary handling. These channels are not interchangeable.

Notifications from Not stable Extensions, such as Point's `Tap` and Viewport's geometry events, remain experimental even though listed in the shared reference. Application-defined events and Docweaver theme events do not acquire Core stability from using the same naming helpers.

This commitment does not guarantee undocumented event timing, exact frequency, event counts per frame, compositor synchronization, or a total order across unrelated operations. Cancellation must be synchronous; a Promise returned by an event listener does not delay dispatch. Scheduler and browser throttling remain applicable.

## 6. Distribution & Loading Compatibility

Documented loading interfaces remain supported across Basic/Full and Modern/Legacy. Basic starts with no Extension registrations; declarations through `$ae.ext(...)` or `<link rel="aelluxjs-ext">` select the desired Extensions and loading policy. Full makes all official Extensions available through automatic registration, currently embedding eleven Bundled implementations and lazily loading five Optional scripts. Registration, loading, initialization and mounting are distinct stages.

Eager loading, `loadWhen`, deferred `load: false` followed by `wait()`, optional stylesheet loading, declared dependencies, `extAttach()`, and compatible build selection preserve their documented contracts. An Extension may change its internal loading or packaging strategy while maintaining documented usage, resource requirements and availability. Applications must still meet each Extension's dependency and mount requirements. See [Registration](../extensions/registration.md), [Lazy loading](../extensions/lazy-loading.md), [Styles](../extensions/styles.md) and [Authoring](../extensions/authoring.md).

The npm package's public entry and subpaths are preserved during `0.1.x`: the root import/default entry, `/boot`, `/esm`, `/full`, `/full/legacy`, `/orchestrator`, `/orchestrator/legacy`, `/semantic`, `/html-data`, `/css-data`, `/web-types` and documented paths under `/dist/*`. Documented browser filenames, minified and Legacy variants, public stylesheets, official registry files and metadata discovery remain supported. A file's presence under `dist` does not make every undocumented internal file a permanent public entry.

The [official registry](../extensions/official-registry.md) describes the versioned metadata, resolution order, exact official Core compatibility, compatible build declarations and diagnostics. Official approval is explicit; a source filename alone does not grant official status. Third-party compatibility ranges do not imply a compatibility guarantee for arbitrary mixed assets. Deploy matching boot/runtime/Extension/CSS resources: boot and orchestrator version mismatch prevents startup, and incompatible declared Extension versions are rejected unless the documented check is explicitly skipped.

SRI is specific to the final bytes of each published artifact. A new version has its own integrity values; compatibility does not promise unchanged bytes or hashes between versions. Skipping a version check does not bypass SRI or URL validation. CSP, CORS, trusted origins and resource availability remain deployment requirements; see [CSP and trust](../extensions/csp-and-trust.md).

Public paths receive the same exceptional-change review as other Stable interfaces. Internal bundle layout, dependency organization, private file count and byte-for-byte output are not frozen. This commitment does not establish a new project-operated CDN, an npm publication/withdrawal procedure, or permanent availability of third-party hosts.

## 7. Platform & Integration Compatibility

The boot distribution has ES5 syntax. Modern targets ES2017+; Legacy provides ES5 output plus its documented shared polyfills. Parsing ES5, running the complete Legacy distribution, and passing validation on a particular browser/OS are three different claims. Required host DOM APIs and Extension-specific dependencies still apply. See [Browser support](browser-support.md), [Modern & Legacy](modern-legacy.md) and [ES5 support](es5-support.md).

The recorded matrix covers Playwright-managed Chromium, Firefox and WebKit desktop engines, including forced Legacy, with exact versions and recorded scope maintained in [Browser support](browser-support.md) and [Validation scenarios](../validation-scenarios.md). This document adds no new test result. Those tests do not establish support for all commercial Chrome, Edge, Safari or Firefox versions. Historical browsers, including Internet Explorer, and mobile devices are outside the validated matrix. An ES2017 syntax-reference table or a Babel target does not expand that matrix.

Within the documented platform scope, updates must preserve supported public behavior and disclose changes to prerequisites or validated coverage. A new feature may require an additional capability without making it mandatory for existing Stable usage. A regression in previously documented supported usage requires compatibility review; adding a limitation to a page does not by itself make the regression compatible.

Progressive enhancement favors available, sufficiently compatible native APIs. Polyfills and fallbacks activate according to feature detection and the documented loading contract. Core Legacy supplies only its listed shared polyfills; Extensions own extra compatibility layers. For example, declaring and mounting Dialog is necessary for its Legacy element fallback; forcing Legacy does not replace a complete native dialog. A fallback preserves its documented public behavior without promising perfect visual or internal equivalence to the browser, such as a native top layer.

AelluxJS integrates with existing HTML and CSS through its namespaces and lifecycle. Applications remain responsible for native semantics, explicit mounting of dynamic content and coordination of managed styles, focus and history. Bootstrap is neither required nor bundled. The recorded Bootstrap 5.3.8 fixture validates basic CSS and namespace coexistence; it does not guarantee interoperability with Bootstrap JavaScript components, plugins or arbitrary other libraries. See [Bootstrap integration](../integrations/bootstrap.md).

Documented accessible behaviors remain part of Stable contracts, including applicable keyboard paths, focus handling, ARIA state, cleanup and reduced-motion behavior. The [accessibility requirements](../extensions/accessibility.md) apply according to each Extension's capabilities. They do not certify arbitrary application markup, universal WCAG conformance, equivalent screen-reader behavior, physical input devices or untested assistive technologies.

## 8. Maintenance & Quality Assurance

Published changes must pass the validation gates applicable to their scope. The repository's CI verifies distribution/documentation builds, unit tests, bundle budgets, browser tests, package contents and generated-file consistency. API or behavior changes need relevant regression coverage, including loading and lifecycle effects where applicable. Documentation-only work requires editorial, link, navigation and documentation-build checks; it does not establish a fresh runtime test result.

Distribution validation must check that public artifacts, compatible variants and official metadata describe the delivered files, including final-byte integrity. The build and packaging references are maintained in [Getting Started](../getting-started.md), [Official registry](../extensions/official-registry.md) and [Validation scenarios](../validation-scenarios.md).

Record released public changes in the changelog. Document migrations for experimental incompatibilities and any explicitly approved exceptional Stable fix. Keep deprecated APIs identified and usable for this line, and update [Known Limits & Risks](known-limits-and-risks.md) and individual Extension limits when evidence or contracts change. Separate demonstrated issues, potential risks, validation gaps and historical test results.

Security reports and severe defects require assessment of affected versions, contracts and mitigations. No private reporting channel, response deadline, correction SLA, commercial availability or guaranteed support duration is established by this commitment. General exception handling, the maintenance focus on the latest `0.1.x`, backports, and a dedicated reporting process require the separate maintainer decisions recorded in the [policy review](https://github.com/aelluxjs/core/blob/release/0.1.0/milestones/0.1.x-compatibility-policy-review.md). There is no commitment to maintain every earlier patch version simultaneously.

Compatibility is a maintenance rule, not a guarantee of zero bugs. Bundle budgets are internal quality controls that may evolve with reviewed changes; they do not promise an exact permanent size. No fixed latency, FPS, memory ceiling or capacity follows from this document. Performance improvements must preserve documented semantics, but actual performance depends on content, device, browser, workload and application integration. See [Performance and bundle budget](performance.md#scope-and-limitations).
