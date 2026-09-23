# Changelog

All notable changes to Aellux will be documented in this file.

## [Unreleased]

### Added

- Aellux boot script with `basic` and `full` runtime modes.
- Aellux Extension registration and lifecycle management.
- Declarative extension loading through `link[rel="aellux-ext"]`.
- Adaptive container states and Bootstrap-compatible adaptive utilities.
- Core Extensions for adaptive behavior, preferences, state navigation, feedback, and asynchronous links.
- ES5-compatible boot and fallback paths with an ES2017+ orchestrator and Extensions.
- Build-generated ES5-syntax Legacy variants for the orchestrator and core Extensions using the `.legacy.js` convention.

### Changed

- Standardized extension element controllers around `mount` and `unmount`.
- Renamed UX modules to Aellux Extensions and the public API to `ext` terminology.
- Moved extension-specific defaults out of the Aellux boot script.
- Made the Adaptive Extension the source of its runtime and generated CSS parameters.

### Fixed

- Normalized generated Aellux event names, including names containing hyphens.
- Isolated extension initialization failures so they do not prevent orchestrator readiness.

## [0.1.0-beta.1] - Unreleased

Initial public beta of the Aellux Extension runtime.
