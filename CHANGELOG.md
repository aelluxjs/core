# Changelog

All notable changes to aellux.js will be documented in this file.

## Unreleased

### Added

- Anchor now schedules repositioning when an observed intersection changes, where `IntersectionObserver` is available.
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

### Changed

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

### Fixed

- Desktop pointer Scrollboxes now cancel `mousedown` only during an active drag and stop drag tracking on double and subsequent clicks so native selection works.
- Scrollbox pointer mode no longer starts a drag when a second or later click is held and moved outside the box.
- Elastic Scrollbox now keeps trailing scroll extent stable when content overflows the wrapper's own box, so bottom and right pressure remains visible.
- Anchor now uses its positioning parent when no target is specified and accepts that parent as an explicit target.

## [0.1.0-beta.10] - 2026-10-14

### Added

- Added Anchor and Scrollbox Extensions to the full Modern and Legacy bundles. Anchor exposes pivot-based placement through weak CSS and CSS custom properties; Scrollbox exposes normalized scroll progress on both axes.
- Added the public `$ae.registerCssProperty()` helper with feature detection and graceful handling of rejected registrations.

### Changed

- Removed automatic `data-ae-low-hardware` detection from the boot; applications can set the attribute explicitly.
- Made `data-ae-present-motion` optional. Present keeps grid transitions when it exists and measures `max-height`/`max-width` transitions without it, preserving the original content structure and reporting an informational diagnostic.
- Raised Present's minified JavaScript raw budget from 8 KiB to 10 KiB for the measured transition path; the 4 KiB gzip limit is unchanged.
- Raised full bundle budgets for the nine-Extension release and added individual Anchor and Scrollbox budgets.
- Adaptive and Scrollbox restore their previous inline CSS custom properties when unmounted.
- Updated package and documentation references to `0.1.0-beta.10`.

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
