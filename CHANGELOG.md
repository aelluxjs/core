# Changelog

All notable changes to aellux.js will be documented in this file.

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
