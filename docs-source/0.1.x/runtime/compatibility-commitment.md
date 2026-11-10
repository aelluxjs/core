# Compatibility Commitment — aellux.js 0.1.x

aellux.js is currently in its initial development stage.

Throughout the `0.1.x` release line, compatibility is maintained for the minimal global initialization contract and the core declarative Extension activation and mounting mechanisms documented for version `0.1.0`.

Extension-specific APIs, behavioral configuration attributes, methods, events, CSS interfaces, and implementation details may evolve, including through incompatible changes, regardless of whether an Extension is classified as Stable or Not stable. Extension stability classifications indicate implementation maturity and validation status, not API compatibility guarantees. Relevant changes will be documented, with migration guidance provided when appropriate.

This commitment begins with `0.1.0`; it does not retroactively stabilize earlier betas. The package currently remains a prerelease. [Technical compatibility](../compatibility.md) and [Browser support](browser-support.md) describe platform requirements and tested environments, independently of this maintenance policy.

## Minimal protected contract

This is an exhaustive list of protected interfaces. Being documented, public, reachable through `$ae`, or included in generated editor metadata does not add an interface to this list.

### Global initialization

- The browser boot exposes the global namespace `aelluxJs` and its alias `$ae`.
- This is the finalized spelling for `0.1.0`; earlier beta globals are not covered retroactively. See [Brand Naming and Migration](../brand-naming.md) before upgrading an existing integration.
- `$ae.init()` initializes the selected distribution. `$ae.init({ mode: "basic" })` and `$ae.init({ mode: "full" })` remain the fundamental modes.
- Basic permits explicit declarations of desired Extensions before initialization through `$ae.ext(nameOrUrl, options?)`. Protection covers registration by name or Extension URL and participation in initial loading/mounting, rather than every registration option or runtime helper.
- Full automatically registers the official Extensions, permitting initial declarative activation/mounting without declaring each one separately. Bundling versus loading a separate script is an implementation choice; deploy matching boot/runtime/Extension assets and satisfy documented platform prerequisites.

Initialization settings beyond those explicitly listed, global helper methods, and post-initialization control APIs do not receive an implicit guarantee. Calling a method through the global namespace does not make it part of the protected initialization contract.

### Declarative activation and initial mounting

`<link rel="aelluxjs-ext" href="name-or-extension-url">` continues to declare an Extension for the initial mount. The names and basic loading roles of `data-ae-load-when` (selector-driven loading), `data-ae-builds` (available runtime variants) and `data-ae-load-style` (stylesheet request) on these declarations are preserved. Additional options, extended value grammars and loading heuristics are outside the guarantee. The runtime's rewritten `rel="aelluxjs-ext-registered"` is an internal marker.

The following names retain their minimum role of identifying eligible markup for the corresponding Extension, once registered and loaded. Presence alone is not a promise that every element or every attribute value is valid; retain suitable native markup and any minimum target/value needed to identify an activation. Initial startup continues to integrate these declarations into its mount pass.

| Extension | Protected activation / mounting declaration |
| --- | --- |
| Adaptive | `data-ae-adaptive` |
| Anchor | `data-ae-anchor` |
| Feedback | `data-ae-feedback` |
| Focus | `data-ae-focus`; `data-ae-focus-scope`, `data-ae-focus-nav` and `data-ae-shortcut` also trigger Full activation |
| Input | `data-ae-point`, `data-ae-inputs`, `data-ae-shortcut-hint`; `data-ae-shortcut` also triggers Full activation |
| Preference | `data-ae-preference` |
| Present | `data-ae-present`, `data-ae-present-group`, `data-ae-present-trigger` |
| Scrollbox | `data-ae-scrollbox` |
| Viewport | `data-ae-viewport` |
| Ajax Href | `data-ae-ajax-href` on eligible anchors; activates delegated navigation rather than a mounted controller |
| Dialog | Native `dialog` elements; no activation data attribute |
| Progress | Native `progress` and `meter` elements; no activation data attribute |
| Overflow Marquee | `data-ae-overflow-marquee` |
| PWA | `data-ae-pwa` |
| Scrollbox Snap | `data-ae-scrollbox` together with `data-ae-scrollbox-snap` |
| State Navigation | Explicit registration in Basic, automatic startup registration in Full; no element mounting declaration |

A standalone `data-ae-present-target` is a routing reference and does not activate or mount an interaction control. See the [Declarative Action Naming Convention](../extensions/declarative-action-naming.md).

For attributes serving both activation and configuration, **only the activation/mounting role is protected**. For example, `data-ae-focus` remains a Focus mounting declaration, while its behavioral value `next` is not frozen. Input's modality list, Present actions/targets/group capacity, Anchor placement, Scrollbox settings, Snap strategies and all other behavioral values, formats and defaults may evolve. A mounting attribute's name does not guarantee the behavior currently configured by its value. Markup alone does not register Extensions in Basic.

The checked implementation is the boot's `init`, the initial mount helper's link processing, Full's official activation selectors and each Extension's mount selector. See [Runtime API](api.md), [registration](../extensions/registration.md), [lazy loading](../extensions/lazy-loading.md) and the [Extension index](../core-extensions/README.md). These usage references describe more APIs than the protected subset.

## Interfaces outside the guarantee

The following may change incompatibly within `0.1.x`, for both Stable and Not stable Extensions:

- Extension APIs and controller methods, their inputs, return values and asynchronous behavior.
- Behavioral configuration attributes, values, formats, defaults and post-initialization options, including `data-ae-focus-nav`.
- Extension events, payloads, timing and behavioral heuristics.
- CSS classes, custom properties, generated styling hooks and visual interfaces.
- Internal communication contracts, implementation details and storage structures.
- Programmatic mounting, updating, unmounting and destruction; lifecycle methods and events; `wait()`, `extAttach()`, diagnostic, request, scheduling, persistence and other global helpers absent from the exhaustive protected list.
- Package subpaths, editor catalog schemas, auxiliary artifact names and packaging details beyond the minimal ability to initialize and activate/mount the selected distribution.

Current documentation remains a factual reference for each published version. Removing an API compatibility guarantee does not remove its usage documentation or authorize arbitrary changes without a technical reason.

## Extension maturity

| Classification | Meaning |
| --- | --- |
| Stable | Implementation considered sufficiently mature, documented, tested and validated for its documented environments and scope. |
| Not stable | Implementation and contracts are still stabilizing and may change more frequently. |

Neither classification guarantees API compatibility. Existing classifications remain unchanged: nine Stable and seven Not stable Extensions, independently of the ten Bundled and six Optional implementations. See the [complete index](../core-extensions/README.md#stability).

## Incompatible changes and maintenance

Changes outside the protected subset may ship in a subsequent `0.1.x`; an Extension API change does not require `0.2.0`. No formal deprecation period or retention through the entire line is required for these interfaces.

Maintenance practice is to record relevant changes in the CHANGELOG, identify public API renames/removals, update reference documentation and examples, and provide migration guidance when appropriate. Avoid incompatible changes without an identifiable technical benefit. The change from DOM-order directional Focus to spatial geometry, for example, is documented with its keyboard policy and scope boundaries in the [Focus guide](../core-extensions/focus.md).

This replaces the previous broad protection of Stable Extension APIs, all documented Core methods, controller/lifecycle contracts, events and CSS. Only the explicit initialization and declarative activation/mounting subset above remains protected. It reserves room for architectural corrections while preserving a useful minimum for early adoption.

Applicable build, unit, browser, bundle and documentation checks remain maintenance quality gates; they are not a compatibility promise for every tested behavior. Record coverage, limitations and migration needs honestly. No fixed bundle size, performance target, universal accessibility certification or support duration is promised. Pending support windows, security-reporting and publication procedures remain separate, non-normative proposals in the [Compatibility Policy Review](compatibility-policy-review.md).
