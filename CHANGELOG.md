# Changelog

All notable changes to aellux.js will be documented in this file.

## [Unreleased]

### Added

- Added the Compatibility Commitment for AelluxJS `0.1.x`, effective from `0.1.0`, covering Stable public JavaScript, HTML, CSS, events, loading and integration contracts. Linked it from the documentation navigation and reference pages; recorded pending support policies and contract discrepancies separately for maintainer review without changing Extension stability or runtime behavior.

### Changed

- Replaced Present `data-ae-unpop-on-outside` with `data-ae-unpop-on-click`: `outside`/`out` (default), `inside`/`in`, or `false`/`none`. Explicit controls retain one action per interaction.
- The old click-dismissal attribute is no longer read. Migrate `data-ae-unpop-on-outside="false"` to `data-ae-unpop-on-click="false"`; omission or an empty value preserves outside-click dismissal. Point taps share the policy; hover dismissal and auto-unpop remain independent. The Present guide includes the value reference and migration examples.

- Centralized development-only HTML, Extension declaration, CSS Motion resource and PWA manifest diagnostics in `src/internal/development-helpers.js`. Duplicate-attribute validation now uses `validateDoubleAttributeHTML()`, preserving the initial document's independent one-shot source inspection and production guards.
- Positioned Docweaver notifications at the top of the viewport with spacing between pooled messages and reduced vertical padding.

### Fixed

- Docweaver notifications now disable outside-click dismissal, so the click that starts a subsequent request preserves existing notifications until their own timers expire or their pool slot is reused.
- Removed duplicate toast message IDs and shared message/motion targets; Feedback now updates the selected notification independently while preserving its native progress control.
- Updated the documentation's Full bundle preload integrity to match the generated artifact.

## [0.1.0-beta.10] - 2026-10-28

### Added

- Present Group accepts a positive integer capacity (empty defaults to one). `popNext()` allocates closed members while capacity is available, then reuses the oldest active member without dismissing other presentations. Reservations count immediately, invalid capacities warn/fall back to one, and explicit `show()` stays exclusive.

- Optional Progress Extension mounts native progress/meter controls, lazily loads with Full, and includes element-local Legacy fallbacks without external polyfill assets. Generic nonbubbling `AelluxJsProgress` consumers preserve native ranges and restore mount-time values on teardown.
- Present auto-unpop resets progress to zero at `Popping` without starting the close timer, then publishes elapsed-time progress after opening completes. Present Group `popNext()` rotates a bounded pool with independent visibility/timers, while explicit selection returns to exclusive behavior. Feedback prepares independent pooled messages before opening through the public Present API.

- Independent Optional Viewport Extension: lazy `[data-ae-viewport]` geometry observation, normalized X/Y position and visible area, grouped scheduler work, native scroll container discovery and inline-style restoration in Modern and Legacy builds. No implementation is bundled into Full.

- Optional external PWA Extension with lazy declarative install controls, native prompt handling, replaceable English/Portuguese manual guidance, semantic state events, explicit worker registration and application-controlled updates. Its independent classic worker provides scoped, versioned precache and configurable network/cache strategies with conservative privacy defaults; neither implementation nor PWA styles enter Full/Core bundles.
- Point recognizes short primary taps on mounted buttons, links and role buttons, emitting bubbling, composed `AelluxJsTap` events independently of native click and scroll, with lifecycle cleanup and Modern/Legacy coverage.
- Present routes Point taps through its existing trigger, dismiss and outside activation behavior, deferring tap-only actions so a matching native click takes priority without a duplicate action; pending fallbacks are cleaned up on unmount and destruction.
- Development diagnostics identify competing transform writers (`2033`) from actual CSS Motion effects and Present declarations on Elastic wrappers. Transformed Snap items now emit the existing `2020` warning.
- Overflow Marquee waits for the configured delay at both ends of each pass and pauses by default during mouse hover or focus within, preserving the position and remaining endpoint delay until every pause reason clears.
- A dedicated Overflow Marquee Extension mounts `data-ae-overflow-marquee`, initializing Anchor as its placement dependency. It owns forced single-line weak CSS, linear overflow motion with an instant reset, root reduced-motion ellipsis, and native desktop `title` tooltips. Animation starts only while visible and preserves its position and remaining delay while hidden, offscreen or in a background document. Wrapping preserves original nodes and is reversed on unmount. Full loads its separate Modern or Legacy file on demand; Basic requires explicit registration of `overflow-marquee`.
- Development diagnostics now report duplicate HTML attributes (`2032`), including discarded `class` and `style` values, with source locations and corrective suggestions. Initial document source is inspected once asynchronously; AJAX Href reuses response text before parsing, and production performs neither check.
- Cancelable `BeforeMount` and `BeforeUnmount` lifecycle events prevent the corresponding pass before callbacks or state changes; teardown and AJAX replacement respect unmount cancellation.
- Generated semantic catalog, VS Code HTML/CSS Custom Data and JetBrains Web Types with attribute/value documentation, CSS properties/classes and DOM events. Metadata is regenerated by the build, shipped in `dist`, and exposed through package metadata/subpaths; native formats are checked against offline official schemas.
- Development mounts and explicit updates now diagnose likely attribute typos, missing Extensions, invalid values/targets, incomplete structures, keyboard reachability and blocking CSS. Configuration contexts include the element, attribute, value, reason and suggested correction, with seven shared warning codes (`2024`–`2030`).
- Present target failures, AJAX selector failures and Adaptive parameter validation now provide actionable runtime diagnostics; AJAX preserves current content when a response region is missing and accepts commas inside selector functions and quoted attribute values.
- Core now exposes `$ae.cubicBezier(t, x1, y1, x2, y2)` and accepts CSS `cubic-bezier(...)` easing strings.
- Present adds group selection, delegated hover behavior, bounded CSS progress, and an optional selection bridge to Anchor.
- Anchor adds target dimension matching and native target-switch transitions.
- Core now exposes numeric easing through `$ae.ease(name, t)` in Modern and Legacy runtimes.
- `waitLayout` now supports identified work, ordered sequences, repetition, cancellation, and adaptive frame pacing.
- Feedback boundaries now update message text, apply type and motion classes, and ship a generated stylesheet for standard motions.
- The Core API now exposes `elementOrId()` and `cssVar()` helpers.
- Scrollbox now supports custom vertical and horizontal scrollbars through `data-ae-scrollbar`, including draggable thumbs, track clicks that center the thumb on the click, and overlay positioning with transforms.
- Raised boot, full-bundle, and Scrollbox size budgets for custom scrollbars.
- Scrollbox snap centers its first point on mount, selects the nearest point or next swipe point on PDS release, supports elastic wrappers, and exposes `next`, `previous`, and `goto(index)` controller methods.
- Snap now runs after native scrollbar scrolling through `scrollend`, with a short scroll-idle fallback for older browsers.
- Snap now routes mouse wheel input to the next or previous point after horizontal wheel conversion when applicable.
- Raised the boot, full-bundle, and Scrollbox size budgets for snap support.

- Anchor now schedules repositioning when an observed intersection changes, where `IntersectionObserver` is available.
- Anchor checks the target's position relative to its positioning reference every second and updates when it changes.
- Raised the full-bundle raw-size budgets for Anchor's intersection observer.
- Elastic Scrollbox accepts one or two maximum displacement values as fractions or pixels through `data-ae-scrollbox-elastic`.
- Weak CSS now uses smooth scrolling by default and restores immediate scrolling for all elements when reduced motion is requested.
- Scrollbox now supports native and desktop pointer-drag modes with horizontal wheel handoff at scroll boundaries.
- Vertical-only pointer Scrollboxes ignore mostly horizontal drag gestures.
- Pointer momentum now advances by 10% of the remaining distance per frame and stops at three-decimal precision.
- Scrollbox now supports opt-in elastic edges for native wheel, native touch, and desktop pointer gestures by translating its sole marked content child.
- Desktop pointer dragging now cancels wheel events until the drag ends.
- Desktop pointer dragging in Scrollbox now has optional momentum, enabled by default and controlled by `data-ae-scrollbox-momentum`.
- Shared dependencies now accept positional SRI and crossorigin arguments.
- Added Anchor and Scrollbox Extensions to the full Modern and Legacy bundles. Anchor exposes pivot-based placement through weak CSS and CSS custom properties; Scrollbox exposes normalized scroll progress on both axes.
- Added the public `$ae.registerCssProperty()` helper with feature detection and graceful handling of rejected registrations.

### Changed

- Basic starts with no Extension registrations. Applications explicitly declare each desired Extension through `$ae.ext(...)` or `<link rel="aelluxjs-ext">`, choosing eager loading, a `loadWhen` selector or a deferred `load: false` request. Official metadata still resolves declared names and their compatible signed artifacts.
- Raised only the affected Orchestrator and Full bundle limits for shared transform diagnostics and integration fixes; the diagnostics guide records previous limits and measured raw/gzip costs.
- AJAX Href commits history only when the first response region is accepted for replacement; network failures, missing response regions and total unmount vetoes preserve the URL. Superseded responses cannot replace current content. Busy/progress Feedback calls use the public argument order.
- Scrollbox Snap observes item sizes as well as its viewport so item geometry variables refresh when content resizes independently.
- Anchor now follows a Present Group's selected member when `data-ae-anchor-target` references that group, supporting multiple independent Anchors per group. Removed the reverse `data-ae-present-group-anchor` association; migrate its reference onto each Anchor's target attribute.
- Raised the affected Boot, Orchestrator, Full and AJAX Href bundle limits for duplicate-attribute source diagnostics; measurements and previous/current limits are documented in the diagnostics guide.
- Present no longer registers or writes low-hardware step variables; hardware markers do not override its configured easing.

- CSS Motion's conservative property ceiling now defaults to 55 FPS; Present's progress channels share the lightweight transform/opacity classification. The scheduler applies visual limits without a second timer-based cap that could undershoot on WebKit.
- Raised Modern Orchestrator's raw-size limit from 56 to 56.5 KiB and Full Legacy's from 425 to 426 KiB for cancelable lifecycle passes; gzip limits are unchanged.
- Raised the affected Boot, ESM, Orchestrator, Adaptive, Present and Snap bundle limits for the configuration diagnostics; the measured sizes and previous/new limits are documented in the diagnostics guide. Full Modern's gzip limit rises from 40 to 40.5 KiB; its raw limit and Full Legacy limits are unchanged.
- Present Group selects members by their HTML `id`; removed `data-ae-present-key`. IDs outside the group's mounted membership are rejected with diagnostic 2021.
- Raised Anchor and Present bundle limits for the new capabilities, and the Modern Orchestrator gzip limit from 14 to 15 KiB for cubic bezier easing and CSS Motion lifecycle fixes (14.2 KiB measured).
- CSS Motion ignores stale capture continuations after replacement and releases finished native CSS transitions to avoid retained values in Firefox.
- Feedback methods now share the `(message, target, value, motion)` argument order and validate their payloads before dispatch.
- Full mode now loads the generated Feedback stylesheet.
- Updated raw bundle limits for the current boot, ESM, full, Anchor, Feedback, and Present artifacts, and added a Feedback CSS limit.
- Scrollbox now batches progress, snap variables, and custom scrollbar measurements before applying their CSS updates in one frame; pointer gestures keep synchronous scroll decisions.
- Adaptive uses the first `ResizeObserver` entry for initial dimensions and defers fallback mount measurement to the layout scheduler.
- Present waits one layout frame instead of forcing an immediate geometry read when separating measured transition states.
- Raised raw-size budgets for the full bundles and Scrollbox after layout batching.
- Custom Scrollbox scrollbars now hide on axes with non-scrollable overflow, including `hidden` and `clip`.
- Snap now centers only its main scroll axis and uses `nearest` alignment on the other axis.
- Custom Scrollbox scrollbars remain visible for one second after PDS; active mouse or pointer hover takes precedence when the hide timer ends.
- Custom Scrollbox scrollbars now keep separate mouse and pointer hover states, remaining visible until both end; adjusted full-bundle and Scrollbox raw-size budgets.
- PDS no longer sets or restores `user-select` during a drag.
- PDS now ignores axes whose computed overflow is not scrollable, even when their content exceeds the viewport, and hands nested gestures to an eligible ancestor.
- Vertical-only PDS now starts early after more than 10 px of dominant vertical movement without a separate 6 px horizontal drift limit.
- Wheel snap navigation now uses the active point index and skips nearest-point selection when its scrolling ends.
- Elastic and snap wrappers now warn on non-inline display and normalize block, flex, and grid to inline counterparts, restoring the original inline display on unmount.
- Horizontal wheel conversion and elastic pressure now respect each axis's computed overflow, including `overflow-y: hidden` when content still extends vertically.
- Snap release prioritizes the point nearest the viewport center, then uses a short flick or significant displacement of the current point to advance wide carousel items.
- Snap now projects point centers by an additional pointer delta before comparison and accepts very short, fast flicks while rejecting slow short drags.
- Snap recognizes flicks released during the 100 ms text-selection wait, while preserving any selection that changed during the gesture.
- Snap children expose inline `--ae-snap-focus` alignment proximity. The former `--ae-snap-viewport` output is removed: add `data-ae-viewport="x"` or `"y"` and consume `--ae-viewport-x` or `--ae-viewport-y` from the independent Viewport Extension.
- A single click inside a partly visible snap point now centers it; clicks inside fully visible points leave scrolling unchanged.
- Snap selection now chooses the first or last point within 10 px of the corresponding scroll limit.

- Pointer Drag Scroll (PDS) now cancels `pointermove`, `touchmove`, and matching-button `mousemove` defaults once scrolling begins. It prevents native pointer-down behavior on open content, preserves text and controls, and changes the cursor from `grab` to `grabbing` during PDS.
- PDS also cancels cancelable native drag events while the scroll gesture is active.
- PDS now uses `ae--pointerscrolling` to apply the `grabbing` cursor during scrolling and disable pointer events on an active elastic child.
- PDS now leaves an active text selection alone and waits 100 ms before scrolling gestures that start on text.
- PDS now locks each gesture to its first dominant axis and passes remaining movement from nested pointer Scrollboxes to scrollable ancestors.
- PDS now compares text selection against its pointer-down state, allowing an unchanged earlier selection. Vertical-only scroll chains start dragging before the 100 ms wait when dominant vertical movement exceeds 10 px.
- Converted vertical wheel input now keeps elastic pressure in horizontal-only Scrollboxes while allowing events beyond an edge to scroll the parent.
- Weak CSS now gives elastic Scrollbox content `display: inline-block`.
- Desktop pointer Scrollboxes now cancel mouse events from the button used for an active scroll drag, including the matching release and click, to suppress native edge autoscroll from draggable descendants.
- Focus now records `ae-focus={elementid}` only for focused elements with an ID; elements without one remain in local focus history.
- Desktop pointer Scrollboxes now cancel `mousedown` from the button used for an active drag; other mouse buttons remain available.
- Elastic pressure now eases exponentially toward its limit and returns with a 15% per-frame interpolation.
- Raised the Scrollbox and full-bundle size budgets for configurable elastic limits and frame-based snapback.
- Elastic Scrollbox scale now grows its scrollable wrapper extent by the elastic displacement in pixels.
- Removed the elastic Scrollbox `::after` spacer.
- Elastic Scrollbox now uses `transform-origin` at the pressed edge and applies scale before translation in its wrapper transform, restoring both inline properties on unmount.
- Raised the Scrollbox and full-bundle size budgets for the elastic edge option.
- Removed BetterScroll loading and its development dependency; Scrollbox uses native browser scrolling in both modes.
- Raised the boot raw-size budget to 30 KiB for positional dependency arguments.
- Removed automatic `data-ae-low-hardware` detection from the boot; applications can set the attribute explicitly.
- Made `data-ae-present-motion` optional. Present keeps grid transitions when it exists and measures `max-height`/`max-width` transitions without it, preserving the original content structure and reporting an informational diagnostic.
- Raised Present's minified JavaScript raw budget from 8 KiB to 10 KiB for the measured transition path; the 4 KiB gzip limit is unchanged.
- Raised full bundle budgets for the nine-Extension release and added individual Anchor and Scrollbox budgets.
- Adaptive and Scrollbox restore their previous inline CSS custom properties when unmounted.
- Updated package and documentation references to `0.1.0-beta.10`.
- Refined Feedback `no` motion with smaller horizontal displacement and alternating rotation, and `yes` motion with vertical displacement and X-axis rotation.
- Updated the documentation error toast to use danger styling and `shake` feedback motion.

### Fixed

- Overflow Marquee discards stale contents from a detached viewport before reusing it after application content replacement, preventing duplicated text during updates and unmount.
- Made documentation-style integration tests self-contained with frozen menu, navigation and enhancement fixtures, independent of the documentation templates.
- Anchor now determines target visibility from computed CSS, honoring overrides of `hidden` and inline styles, inherited visibility restored by descendants, and effective ancestor hiding. Present Group targets also respect zero opacity.
- Anchor takes priority when Present requests transform on the same element; Present keeps opacity and size motion without capturing Anchor placement transitions. Development validation reports warning 2031 with an actionable correction.

- Scrollbox interrupts momentum on pointer-down before drag eligibility checks, including custom scrollbar grabs and controls; all wheel events stop it before cancellation or zoom checks.

- Present updates `aria-expanded` on regions and their trigger, dismiss and target controls when opening or closing animations start, so controls animate with the panel instead of waiting for completion.
- Pointer dragging chooses its axis only after crossing the drag threshold, so initial cross-axis jitter cannot cancel a new drag after interrupting elastic recovery.
- Nested wheel scrolling passes only the unconsumed distance through alternating horizontal and vertical ancestors, even with elastic enabled at every level; explicit CSS overscroll boundaries stop the corresponding axis, and native movement is canceled after a scripted handoff to avoid duplicates.
- Completed pointer drags reset the multi-click history so rapid re-grabs near the same starting position remain draggable; ordinary double and triple clicks still allow native text selection.
- Desktop PDS release eases into its snap destination while keeping native snap suspended; a new press cancels all remaining animation frames, and reduced motion settles immediately.
- Scrollbox preserves fractional pointer movement across events so browser rounding does not create elastic pressure or send movement to a parent before reaching an edge.
- Snap boxes use automatic native scroll positioning while controller, wheel and scripted flick navigation retain their explicit smooth behavior.
- A new mouse or pen press stops smooth Scrollbox snap motion, clears pending flicks, and suspends snap until the last pointer ends or window focus is lost; native touch keeps its snap behavior.
- Scrollbox snap keeps the starting item fixed throughout a pointer drag and disables PDS momentum on both axes while snap is enabled.
- New pointer and wheel input finishes elastic recovery before measuring or processing the interaction, including presses on controls and custom scrollbars.
- Present Group validates synchronous Before-event declaration and membership changes before applying a swap; progress falls back safely when CSS property registration fails, and expected replacement/unmount cancellations no longer emit interruption warnings.
- Anchor preserves application inline positioning, filters unrelated DOM mutations, and recovers targets revealed by class or style without permanent polling.
- CSS Motion cancellation settles native waits even when `Animation.finished` stays pending, and partial capture failures resume effects already paused.
- Legacy source-map normalization preserves literal replacement tokens in embedded source text instead of corrupting JSON.
- Desktop pointer Scrollboxes now cancel `mousedown` only during an active drag and stop drag tracking on double and subsequent clicks so native selection works.
- Scrollbox pointer mode no longer starts a drag when a second or later click is held and moved outside the box.
- Elastic Scrollbox now keeps trailing scroll extent stable when content overflows the wrapper's own box, so bottom and right pressure remains visible.
- Anchor now uses its positioning parent when no target is specified and accepts that parent as an explicit target.

## [0.1.0-beta.9] - 2026-10-13

### Added

- Added `$ae.dep(label, url)` to load shared script dependencies immediately, including before initialization. Calls with the same label share one Promise that resolves after the script loads; failed loads can be retried.

### Changed

- Present trigger and dismiss targets now accept one element ID, with or without a leading `#`. Present indexes controls by target ID and tracks open containers directly.
- Updated the package and current documentation references to `0.1.0-beta.9`.
- Limited retained diagnostics to the latest 100 entries with a circular buffer.
- Standardized element and ID resolution for mount, unmount, update, and controller lookup, with a shared invalid-input diagnostic.
- Reduced temporary allocations during mounted-element traversal and layout scheduling. Detached-element cleanup now runs only after relevant DOM removals and coalesces repeated observer notifications.
- Reduced per-element mount state to one initial-attribute snapshot with a user count, preserving restoration across multiple registrations and failed mounts.
- Mount now waits for every matching Extension to load before searching for mountable elements, and avoids repeated searches within nested activation scopes.
- Adaptive now batches resize updates, precomputes size thresholds, freezes initialized parameters, and synchronizes `aria-orientation`.
- Point now selects a single nearest eligible `target` instead of retaining pointable chains. It keeps one `pressStart` reference so release and cancellation still reach the press origin.
- Preference now indexes mounted controls by preference and refreshes only controls whose computed value changes; `PreferencesChange` remains dispatched on every `update()` call.
- An empty `data-ae-present` value now disables motion; use `all` to enable every Present transition. Present also avoids an array allocation when clearing transition classes.

### Fixed

- Restored low-hardware detection in the boot script for browsers reporting no more than four logical processors or 4 GiB of device memory.
- Stabilized Present ARIA and transition coverage, and added browser coverage for shared attribute restoration, selective Preference updates, Point routing, and Adaptive updates.

## [0.1.0-beta.8] - 2026-10-11

### Changed

- Updated the package and current documentation references to `0.1.0-beta.8`.
- Corrected the Extension authoring contract to document the awaited asynchronous lifecycle and updated the scaffold callbacks accordingly.
- Updated Preference value labels so `data-ae-label="<value>"` elements reflect the currently selected option through their visibility.
- Present now uses a direct motion child as a contained content container and generates that wrapper with a warning when it is missing, while keeping all visibility and transition properties on the main Present container. Its `opacity`, `transform`, `height`, and `width` attribute tokens independently enable the corresponding transition, with all four enabled by default. It also applies temporary `will-change` preparation, waits 100 ms before transitions from a stable state, and reuses that preparation when an active transition is replaced in the opposite direction. Its transition rules ship in generated standalone CSS instead of the boot weak CSS. Reduced-motion mode disables these transitions, while low-hardware mode uses duration-derived stepped easing.
- The boot script now marks the document root with `data-ae-low-hardware` when the browser reports no more than four logical processors or 4 GiB of device memory.
- Added the `autoViewportMeta` initialization option, enabled by default, to control automatic insertion of a missing viewport meta tag.

## [0.1.0-beta.7] - 2026-10-10

### Added

- Added the root ESM package export alongside the classic boot entry.
- Added the centralized `mountManager`, element-controller cache, callable `$ae(elementOrId)` controller facade, public mounted lifecycle methods, and initial-attribute access during mounting.
- Added the `present`, `point`, and `focus` Core Extensions, each distributed separately with Modern and Legacy artifacts and browser coverage.
- Added responsive Adaptive classes derived from element dimensions and generated Adaptive CSS.
- Added structured diagnostics with numeric codes, verbosity levels, retained history, and coverage for registration, mounting, lifecycle, selector, and callback failures.
- Added state-navigation snapshot metadata for `ajaxReplace`, parent/iframe validation, and event-driven commands for state updates and title changes.
- Added integrity metadata for generated assets, configurable `crossorigin`, third-party license notices, and a local Bootstrap fixture for offline validation.
- Added a CI-enforced bundle budget for minified Modern, Legacy, stylesheet, and individual Core Extension artifacts, measured as raw and gzip bytes.
- Added Performance and Bundle Budget documentation with the `0.1.0` baseline, limits, and scope.
- Added automated coverage for native keyboard activation of Preference controls and publishing and clearing motion, contrast, and forced-color preferences.
- Added the `AelluxJsPushState` event contract so Extensions can request state updates without directly accessing State Navigation.
- Added dedicated Core Extension, accessibility, CSP, browser-support, validation, and authoring documentation.

### Changed

- Reworked the public Extension API around camelCase registry keys, hyphenated asset names, `AelluxJs.ext`, and the `AelluxJs`/`$ae` callable controller facade.
- Moved mount-map declarations from Extensions into the central manager and made mount operations return the unique elements newly affected by the operation.
- Restored Adaptive to the `full` bundle and removed the former `ajax-href` Extension from Core; `ajaxReplace` is now State Navigation metadata for an optional external consumer.
- Renamed the former Pointer Extension to `point` and renamed `preferences` to `preference`.
- Moved initial `data-ae-*`, `aria-*`, and `hidden` restoration into the mount lifecycle and limited it to mounted elements.
- Hardened Modern/Legacy selection, lazy loading, retries, detached-element cleanup, destruction, and generated source-map consistency.
- Focus now communicates its snapshot token through `AelluxJsPushState`; State Navigation validates and consumes that event when active.
- Present releases focus before hiding a region that contains the active element and emits `AelluxJsUnpopFocusLost`; Focus restores a previous valid target when it receives that event.
- Recorded the desktop validation matrix as 306 passing tests in Playwright Chromium, Firefox, and WebKit, and clarified that mobile browsers remain outside the supported matrix.
- Completed and documented the automated accessibility baseline for keyboard, focus, ARIA state, loader state, and Preference contracts.

### Fixed

- Prevented duplicate concurrent mounts, recovered failed lazy Extension initialization and asset loading, and cleaned registrations, controllers, listeners, assets, and detached elements during unmount or destruction.
- Preserved existing `history.state` while State Navigation replaces its own snapshot data.
- Restored Present trigger state and ARIA attributes reliably across remounts and interrupted transitions.
- Restored `enterkeyhint` correctly on Focus unmount by removing only hints generated by the Extension.
- Cleared stale root preference attributes when reduced motion, contrast, or forced colors return to `auto`.

## [0.1.0-beta.6] - 2026-10-01

### Changed

- Moved the Adaptive Extension and its generated stylesheet out of Core; the full bundle now includes only Core Extensions.
- Updated browser validation and documentation examples to use Core Extensions.
- Regenerated the documentation theme stylesheet.

## [0.1.0-beta.5] - 2026-09-30

### Changed

- Regenerated the documentation with updated navigation, code highlighting, responsive tables, and the Bootstrap bundle.

### Fixed

- Mount and unmount operations now dispatch their corresponding lifecycle events.

## [0.1.0-beta.4] - 2026-09-30

### Changed

- Updated `@wolimp/docweaver` to beta.6 and regenerated the static documentation.

### Fixed

- Restored the AJAX link lifecycle events by using the Core `dispatch` API.

## [0.1.0-beta.3] - 2026-09-30

### Changed

- Prepared the `0.1.0-beta.3` Core distribution.

### Fixed

- Preference option labels now update associated controls, including unchecked inputs and IDs with CSS special characters, without failing when a target is missing.

## [0.1.0-beta.2]

### Changed

- Bumped the package prerelease version to `0.1.0-beta.2`.
- Moved documentation generation and its theme to `@wolimp/docweaver` beta.2, using its `buildDocs` API and public path support.
- Updated `@wolimp/docweaver` to beta.3 and regenerated the static documentation.
- Updated `@wolimp/docweaver` to beta.4 and regenerated the static documentation.
- Updated `@wolimp/docweaver` to beta.5 and regenerated the static documentation.

## [0.1.0-beta.1]

Initial public beta of the aellux.js Extension runtime.

### Added

- aellux.js boot script with `basic` and `full` runtime modes.
- Programmatic Extension registration through `$ae.ext()` and declarative loading through `link[rel="aelluxjs-ext"]`.
- Eager and selector-driven lazy Extension loading with duplicate-load protection.
- Extension lifecycle APIs for idempotent `init`, `mount`, `unmount`, isolated destruction, and global Core destruction.
- Optional Extension styles derived from the script URL or loaded from a custom URL.
- Mounted-state handling through `data-ae-wait-mounted`, `data-ae-loader`, `aria-busy`, and `ae--mounted`.
- Adaptive container states and Bootstrap-compatible adaptive utilities.
- Core Extensions for adaptive behavior, preferences, state navigation, feedback, and asynchronous links.
- Structured diagnostics with numeric codes for boot, lifecycle, loading, compatibility, and Legacy runtime failures.
- Explicit `builds` metadata for Modern-only, Legacy-only, and dual-build Extensions, including declarative `data-ae-builds` support.
- ES5-compatible boot and fallback paths with an ES2017+ Modern orchestrator and Extensions.
- Build-generated ES5-syntax Legacy variants for the orchestrator and core Extensions using the `.legacy.js` convention.
- Core polyfills bundled once with the Legacy orchestrator for language APIs, events, animation frames, and networking.
- Legacy `basic` and `full` distributions matching the Modern runtime mode selection.
- Normal, minified, source map, Modern, Legacy, individual Extension, orchestrator, and full-bundle distribution artifacts.
- Third-party Extension scaffold, compatibility contract, Legacy reference builder, and documented Core polyfill boundary.
- Browser validation suite covering 17 Modern, Legacy, Bootstrap, loading, failure-isolation, and lifecycle scenarios.
- Playwright automation for the browser scenarios across Chromium, Firefox, and WebKit, including dynamic mounting and CSS checks.
- Apache License 2.0, versioned documentation sources, and generated static documentation under `docs/`.
- Browser support baseline for the Modern and Legacy distributions.

### Changed

- Renamed the global browser object to `AelluxJs` and the event prefix to `AelluxJs`; `$ae` remains the short alias.
- Aligned internal helpers, persistence keys, error names, browser validations, and displayed brand text with `AelluxJs` and `aellux.js`.
- Renamed the browser history marker to `aelluxJsState` and the declarative Extension relation to `aelluxjs-ext`.
- Renamed UX modules to aellux.js Extensions and the public API to `ext` terminology.
- Standardized Extension element controllers around `mount` and `unmount`.
- Renamed the Extension selector/controller map from `mountDOM` to `mountMap` across the runtime, Extensions, scaffold, documentation, and tests.
- Moved extension-specific defaults out of the aellux.js boot script.
- Kept the boot body ES5-compatible and moved reusable boot, asset-loading, mounting, diagnostics, persistence, and layout behavior into build-integrated helpers.
- Made the Adaptive Extension the source of its runtime and generated CSS parameters.
- Renamed the Adaptive `wide` and `ultrawide` states and utility aliases to `xl` and `xxl`.
- Organized browser validation pages and their runner under `tests/browser/`.
- Removed shared Observer dependencies and polyfills from Core and the Adaptive Extension.
- Limited the npm package to `dist/`, `CHANGELOG.md`, `README.md`, `LICENSE`, and the required `package.json`.
- Replaced the custom documentation renderer with Eta and MarkdownIt.
- Removed the standalone example pages and experimental Extensions; browser validation scenarios remain under `tests/`.

### Fixed

- Normalized generated aellux.js event names, including names containing hyphens.
- Isolated extension initialization failures so they do not prevent orchestrator readiness.
- Prevented duplicate or concurrent Extension loading and removed loaded Extensions from the lazy index.
- Made repeated element updates, unmounts, Extension destruction, and global destruction release resources predictably.
- Preserved custom stylesheet URLs declared through `data-ae-load-style` and handled boolean `loadStyle: true` correctly.
- Cleared asset load handlers and pending layout work during teardown.
- Ensured asynchronous content replacement unmounts existing aellux.js behavior before replacing DOM nodes.
- Made generated documentation URLs independent of the checkout directory name.

### Known Limitations

- Public APIs may still change before `1.0.0`.
- Legacy output provides ES5 syntax and documented polyfills, not unrestricted support for every historical ES5 browser.
- Fundamental DOM capabilities remain the responsibility of the host browser.
- Bootstrap is supported as an integration target but is not bundled or required.
