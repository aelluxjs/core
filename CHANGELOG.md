# Changelog

All notable changes to Aellux will be documented in this file.

## [Unreleased]

No changes recorded after `0.1.0-beta.1` yet.

## [0.1.0-beta.1] - Unreleased

Initial public beta of the Aellux Extension runtime.

### Added

- Aellux boot script with `basic` and `full` runtime modes.
- Programmatic Extension registration through `$ae.ext()` and declarative loading through `link[rel="aellux-ext"]`.
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
- Core polyfills bundled once with the Legacy orchestrator for language APIs, observers, events, animation frames and networking.
- Legacy `basic` and `full` distributions matching the Modern runtime mode selection.
- Normal, minified, source map, Modern, Legacy, individual Extension, orchestrator, and full-bundle distribution artifacts.
- Third-party Extension scaffold, compatibility contract, Legacy reference builder, and documented Core polyfill boundary.
- Browser validation suite covering 17 Modern, Legacy, Bootstrap, loading, failure-isolation, and lifecycle scenarios.
- Apache License 2.0 and beta documentation organized under `docs/`.

### Changed

- Renamed UX modules to Aellux Extensions and the public API to `ext` terminology.
- Standardized Extension element controllers around `mount` and `unmount`.
- Renamed the Extension selector/controller map from `mountDOM` to `mountMap` across the runtime, Extensions, scaffold, documentation, and tests.
- Moved extension-specific defaults out of the Aellux boot script.
- Kept the boot body ES5-compatible and moved reusable boot, asset-loading, mounting, diagnostics, persistence, and layout behavior into build-integrated helpers.
- Made the Adaptive Extension the source of its runtime and generated CSS parameters.
- Renamed the Adaptive `wide` and `ultrawide` states and utility aliases to `xl` and `xxl`.
- Organized browser validation pages and their runner under `tests/browser/`.

### Fixed

- Normalized generated Aellux event names, including names containing hyphens.
- Isolated extension initialization failures so they do not prevent orchestrator readiness.
- Prevented duplicate or concurrent Extension loading and removed loaded Extensions from the lazy index.
- Made repeated element updates, unmounts, Extension destruction, and global destruction release resources predictably.
- Preserved custom stylesheet URLs declared through `data-ae-load-style` and handled boolean `loadStyle: true` correctly.
- Cleared asset load handlers and pending layout work during teardown.
- Ensured asynchronous content replacement unmounts existing Aellux behavior before replacing DOM nodes.

### Known Limitations

- Public APIs may still change before `1.0.0`.
- Legacy output provides ES5 syntax and documented polyfills, not unrestricted support for every historical ES5 browser.
- Fundamental DOM capabilities remain the responsibility of the host browser.
- Bootstrap is supported as an integration target but is not bundled or required.
- Experimental components under `examples/components/` are not part of the Core compatibility contract.
