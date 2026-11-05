# Present dismissal migration report

Historical report for the dismissal rename. The subsequent distinct reverse operation is now implemented; see [Present reverse playback](present-unpop-reverse.md) and the current Present guide. Statements below about reserving or removing the former unpop operation describe the migration stage, not the new reverse API.

Implemented from reference commit `79b9e497b54e` on `release/0.1.0`. Package version remains `0.1.0-beta.10`. No commit, push or publication was performed.

## Contract changes

- Public Extension and mounted controllers expose `dismiss(element)` / `$ae(element).present.dismiss()`. The former `unpop()` dismissal method has no alias or placeholder.
- Trigger actions are `pop`, `dismiss` and `toggle`. Existing `data-ae-dismiss` ID/target/ancestor resolution is preserved. Unknown actions still warn and toggle.
- `data-ae-auto-unpop` becomes `data-ae-auto-dismiss`; `data-ae-unpop-on-click` becomes `data-ae-dismiss-on-click`, with unchanged values, defaults, timers and countdown payloads. Removed attributes are inactive, including the already-obsolete outside-only attribute.
- Closing opacity, transform, height, width, duration, ease, advanced easing and progress now use `--ae-dismiss-*`. The private phase is `--ae-present-dismiss-phase` and the state class is `ae--dismissing`. Opening properties/classes retain their semantics and defaults.
- Events are `AelluxJsBeforeDismiss`, `AelluxJsDismissing`, `AelluxJsDismiss` and `AelluxJsDismissFocusLost`. Layout origin is `present.dismiss`; `durationMs` is unchanged. Generic `AelluxJsProgress` retains its payload, timing and routing.

The full old/new table is in [Present](../docs-source/0.1.x/core-extensions/present.md#operations-and-prerelease-migration).

## Runtime and integration

All closing paths retain the existing transition engine: explicit controls, toggle(false), exclusive and accumulating groups, cancellation/preflight, timed dismissal, click/Point tap, hover, focus release and lifecycle cleanup. Internal direction is `DISMISS = "Dismiss"`.

Dismissal captures the rendered state before canceling the previous motion, including opacity, transform, grid/measured dimensions and progress, then travels directly toward the independent dismissal destination. Temporary styles and priorities are restored on completion, replacement and teardown. Only explicit pop restarts from from. No reverse playback mechanism was added.

Event/class routing now explicitly selects Popping/Dismissing; it no longer appends a shared suffix to direction names. The close-control target variable was renamed locally to avoid shadowing the new dismiss function. Focus and Scrollbox consume the renamed events. CSS Motion retains its existing policy and scheduling with the renamed progress/phase channels.

Sources of truth were updated before regenerating bundles, CSS, maps, integrity/manifest entries, editor data and Docweaver output. The semantic catalog also explicitly describes Present methods and both advanced easing properties. Homepage, floating example, documentation fixtures and the manually authored `docs/teste.htm` use the new contract. The latter has no generator source and was edited directly.

## Compatibility and future reverse playback

Publication checked on 2026-11-04: `npm view @aelluxjs/core versions dist-tags --json` listed only beta versions through beta.9; GitHub's public releases collection for aelluxjs/core was empty. The checked-out package is beta.10. This is a breaking beta API finalization before the protected 0.1.0 baseline; no version number was changed.

Future `unpop()` is documented in [the reverse-playback design note](present-unpop-reverse.md). It must reverse the actual opening trajectory toward from, accounting for current progress, nonlinear easing/timing, controlled/native fallback, dimensions, progress/events and interrupted operations. Toggle, groups and automation must continue using dismissal by default.

## Validation

Local raw logs and JSON reports are retained under `test-results/present-dismiss-validation/` (ignored by Git), including the full-run and isolated-rerun JSON results.

- `npm run build`: passed (core, metadata and docs). The initial sandboxed esbuild attempt was blocked by ancestor-directory access; the authorized execution outside the sandbox passed.
- `npm run build:editor-data`: passed after completing the semantic method/easing descriptions.
- `npm run test:unit`: **95 passed**, zero failures, after regenerating metadata. An earlier run during artifact generation saw stale generated metadata; the final run passed.
- `npm run test:budget`: all configured budgets passed without changing limits.
- New dismissal-contract cases: **24 passed**, across Chromium/Firefox/WebKit, Basic/Full and Modern/Legacy.
- Full existing browser suite: **3588 passed, 38 skipped, 4 failed**, in 17.2 minutes with four workers.
- Follow-up `npx playwright test --last-failed --workers=1`: **4 passed**, zero failures. Three full-run failures were the same alphabetically sorted controller-method expectation, corrected to place dismiss first; the running suite had already cached the previous expectation. The fourth was an unchanged Anchor sticky-target timing test in WebKit, which reached width 160 before an assertion requiring less than 159; it passed in the isolated rerun without an Anchor change. This remains a timing-sensitive test under concurrent load.
- No unresolved failures from the attempted browser matrix. The entire 3,630-case matrix was not repeated after the test-only ordering correction; all four failing browser cases were rerun. The 38 skips are existing engine/capability-specific exclusions (native touch/CDP, motion inspection, overscroll behavior and reduced-motion emulation), not newly deferred tests.
- `npm pack --dry-run --ignore-scripts --json`: **198 package entries**; expected Modern/Legacy Present files, CSS and all four metadata files present; development/test/temp files absent. Build was already validated separately.
- **78 source maps** parsed successfully with embedded source coverage and normalized newlines. All 324 embedded repository-source entries matched current sources when compared using their final src-relative path. Existing repeated src path prefixes already occur in HEAD; this task does not change that unrelated path behavior.
- `git diff --check`: passed.

Coverage includes API availability/removal, declarative controls, toggle, auto-dismiss mutation/countdown, click/hover/Point, group selection/capacity/preflight, event order/veto/focus, new CSS names, progress endpoints, intermediate controlled/native values, registered-property fallback, reduced motion, measured-style restoration, repeated operations, rapid replacement, unmount and destroy.

## Remaining old terminology

Case-sensitive and case-insensitive repository searches were reviewed, including generated output and hidden files while excluding Git internals, dependencies and test results.

1. Runtime, active examples, CSS and editor metadata requiring migration: **none remain**.
2. Historical/migration references: old/new names in the Present guide, the prerelease compatibility note, historical changelog entries and this report. Generated docs retain the corresponding explanatory text.
3. Future reverse operation: the Present introduction and reverse-playback design note; validation docs explicitly exclude it from current functionality.
4. Negative regression assertions: old method/attribute/event/property/class names occur intentionally in the new browser/unit removal tests.
5. Unrelated legacy-name occurrences: none found. Unrelated PWA dismissal events retain their names.

## Modified files

The following 157 files belong to this migration. Generated pages throughout docs/0.1.x change because the shared template contains Present controls and notifications. Ajax Href/PWA maps also embed the updated shared development diagnostics.

Concurrent acknowledgment edits observed in `README.md` and `dist/README.md` were preserved and are excluded from this migration inventory.

### root (1)

- `CHANGELOG.md`

### dist (61)

- `dist/aellux.css-data.json`
- `dist/aellux.ext.ajax-href.js.map`
- `dist/aellux.ext.ajax-href.legacy.js.map`
- `dist/aellux.ext.ajax-href.legacy.min.js.map`
- `dist/aellux.ext.ajax-href.min.js.map`
- `dist/aellux.ext.focus.js`
- `dist/aellux.ext.focus.js.map`
- `dist/aellux.ext.focus.legacy.js`
- `dist/aellux.ext.focus.legacy.js.map`
- `dist/aellux.ext.focus.legacy.min.js`
- `dist/aellux.ext.focus.legacy.min.js.map`
- `dist/aellux.ext.focus.min.js`
- `dist/aellux.ext.focus.min.js.map`
- `dist/aellux.ext.present.css`
- `dist/aellux.ext.present.js`
- `dist/aellux.ext.present.js.map`
- `dist/aellux.ext.present.legacy.js`
- `dist/aellux.ext.present.legacy.js.map`
- `dist/aellux.ext.present.legacy.min.js`
- `dist/aellux.ext.present.legacy.min.js.map`
- `dist/aellux.ext.present.min.css`
- `dist/aellux.ext.present.min.js`
- `dist/aellux.ext.present.min.js.map`
- `dist/aellux.ext.pwa.js.map`
- `dist/aellux.ext.pwa.legacy.js.map`
- `dist/aellux.ext.pwa.legacy.min.js.map`
- `dist/aellux.ext.pwa.min.js.map`
- `dist/aellux.ext.scrollbox.js`
- `dist/aellux.ext.scrollbox.js.map`
- `dist/aellux.ext.scrollbox.legacy.js`
- `dist/aellux.ext.scrollbox.legacy.js.map`
- `dist/aellux.ext.scrollbox.legacy.min.js`
- `dist/aellux.ext.scrollbox.legacy.min.js.map`
- `dist/aellux.ext.scrollbox.min.js`
- `dist/aellux.ext.scrollbox.min.js.map`
- `dist/aellux.extensions.min.json`
- `dist/aellux.full.css`
- `dist/aellux.full.js`
- `dist/aellux.full.js.map`
- `dist/aellux.full.legacy.js`
- `dist/aellux.full.legacy.js.map`
- `dist/aellux.full.legacy.min.js`
- `dist/aellux.full.legacy.min.js.map`
- `dist/aellux.full.min.css`
- `dist/aellux.full.min.js`
- `dist/aellux.full.min.js.map`
- `dist/aellux.html-data.json`
- `dist/aellux.js`
- `dist/aellux.js.map`
- `dist/aellux.min.js`
- `dist/aellux.min.js.map`
- `dist/aellux.orchestrator.js`
- `dist/aellux.orchestrator.js.map`
- `dist/aellux.orchestrator.legacy.js`
- `dist/aellux.orchestrator.legacy.js.map`
- `dist/aellux.orchestrator.legacy.min.js`
- `dist/aellux.orchestrator.legacy.min.js.map`
- `dist/aellux.orchestrator.min.js`
- `dist/aellux.orchestrator.min.js.map`
- `dist/aellux.semantic.json`
- `dist/aellux.web-types.json`

### docs-source (14)

- `docs-source/0.1.x/README.md`
- `docs-source/0.1.x/core-extensions/anchor.md`
- `docs-source/0.1.x/core-extensions/feedback.md`
- `docs-source/0.1.x/core-extensions/focus.md`
- `docs-source/0.1.x/core-extensions/optional/progress.md`
- `docs-source/0.1.x/core-extensions/optional/viewport.md`
- `docs-source/0.1.x/core-extensions/present.md`
- `docs-source/0.1.x/core-extensions/scrollbox.md`
- `docs-source/0.1.x/progress-implementation-report.md`
- `docs-source/0.1.x/runtime/api.md`
- `docs-source/0.1.x/runtime/compatibility-commitment.md`
- `docs-source/0.1.x/runtime/css-motion.md`
- `docs-source/0.1.x/runtime/events.md`
- `docs-source/0.1.x/validation-scenarios.md`

### docs (48)

- `docs/0.1.x/compatibility.htm`
- `docs/0.1.x/core-extensions/adaptive.htm`
- `docs/0.1.x/core-extensions/anchor.htm`
- `docs/0.1.x/core-extensions/feedback.htm`
- `docs/0.1.x/core-extensions/focus.htm`
- `docs/0.1.x/core-extensions/index.htm`
- `docs/0.1.x/core-extensions/optional/ajax-href.htm`
- `docs/0.1.x/core-extensions/optional/dialog.htm`
- `docs/0.1.x/core-extensions/optional/progress.htm`
- `docs/0.1.x/core-extensions/optional/pwa.htm`
- `docs/0.1.x/core-extensions/optional/viewport.htm`
- `docs/0.1.x/core-extensions/overflow-marquee.htm`
- `docs/0.1.x/core-extensions/point.htm`
- `docs/0.1.x/core-extensions/preference.htm`
- `docs/0.1.x/core-extensions/present.htm`
- `docs/0.1.x/core-extensions/scrollbox-snap.htm`
- `docs/0.1.x/core-extensions/scrollbox.htm`
- `docs/0.1.x/core-extensions/state-navigation.htm`
- `docs/0.1.x/extensions/accessibility.htm`
- `docs/0.1.x/extensions/authoring.htm`
- `docs/0.1.x/extensions/csp-and-trust.htm`
- `docs/0.1.x/extensions/declarative-loading.htm`
- `docs/0.1.x/extensions/lazy-loading.htm`
- `docs/0.1.x/extensions/legacy-variants.htm`
- `docs/0.1.x/extensions/official-registry.htm`
- `docs/0.1.x/extensions/registration.htm`
- `docs/0.1.x/extensions/styles.htm`
- `docs/0.1.x/getting-started.htm`
- `docs/0.1.x/index.htm`
- `docs/0.1.x/integrations/bootstrap.htm`
- `docs/0.1.x/integrations/editor-tooling.htm`
- `docs/0.1.x/progress-implementation-report.htm`
- `docs/0.1.x/runtime/api.htm`
- `docs/0.1.x/runtime/browser-support.htm`
- `docs/0.1.x/runtime/compatibility-commitment.htm`
- `docs/0.1.x/runtime/css-motion.htm`
- `docs/0.1.x/runtime/diagnostics.htm`
- `docs/0.1.x/runtime/es5-support.htm`
- `docs/0.1.x/runtime/events.htm`
- `docs/0.1.x/runtime/known-limits-and-risks.htm`
- `docs/0.1.x/runtime/modern-legacy.htm`
- `docs/0.1.x/runtime/performance.htm`
- `docs/0.1.x/runtime/visual-mounting.htm`
- `docs/0.1.x/runtime/wait-layout.htm`
- `docs/0.1.x/validation-scenarios.htm`
- `docs/assets/docweaver/css/style.css`
- `docs/assets/docweaver/js/main.js`
- `docs/teste.htm`

### home (5)

- `home/assets/home.css`
- `home/assets/home.js`
- `home/examples/floating.htm`
- `home/examples/floating.js`
- `home/index.htm`

### milestones (2)

- `milestones/present-dismiss-migration.md`
- `milestones/present-unpop-reverse.md`

### scripts (1)

- `scripts/semantic-definitions.mjs`

### src (6)

- `src/aellux.ext.focus.js`
- `src/aellux.ext.present.css.js`
- `src/aellux.ext.present.js`
- `src/aellux.ext.scrollbox.js`
- `src/internal/create-css-motion-controller.js`
- `src/internal/development-helpers.js`

### templates (3)

- `templates/docweaver/css/style.css`
- `templates/docweaver/docs-layout.eta.htm`
- `templates/docweaver/js/main.js`

### tests (16)

- `tests/browser/anchor.spec.mjs`
- `tests/browser/css-motion.spec.mjs`
- `tests/browser/css-property-registration.spec.mjs`
- `tests/browser/docweaver-notifications.spec.mjs`
- `tests/browser/home-examples.spec.mjs`
- `tests/browser/present-anchor-integration.spec.mjs`
- `tests/browser/present-aria.spec.mjs`
- `tests/browser/present-enhancements.spec.mjs`
- `tests/browser/present-group-capacity.spec.mjs`
- `tests/browser/present-tap.spec.mjs`
- `tests/browser/progress-notifications.spec.mjs`
- `tests/browser/scrollbox-fade.spec.mjs`
- `tests/fixtures/documentation-app/main.js`
- `tests/fixtures/documentation-app/nested-menu.htm`
- `tests/unit/css-motion.test.mjs`
- `tests/unit/editor-data.test.mjs`
