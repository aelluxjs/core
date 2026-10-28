# Progress and accumulated notifications implementation report

Implementation date: 2026-10-28. Initial implementation branch: `update/beta.10`. Baseline: `35895693` (the current checkout, later than the requested reference `19cddeef`). Version remains `0.1.0-beta.10`.

## Contracts and architecture

- The Progress body lives in `src/aellux.ext.progress.js` as the same root IIFE used by the other Extensions, with `init`, `destroy`, mount/update/unmount and direct `extAttach`. The Legacy build enables only the fallback branch at build time; Modern tree-shakes that implementation out.
- Optional `progress` mounts `progress, meter`, with Full lazy registration and Basic explicit registration. Modern preserves native controls. Legacy embeds independent per-tag fallbacks. No mandatory Present or Feedback dependency is introduced.
- `data-ae-progress-target` belongs only to progress controls and resolves an existing producer ID. Valid generic `{ value, max }` events scale to the consumer's native max. Attribute retargeting disconnects the previous listener; teardown restores the original value attribute.
- Generic `AelluxJsProgress` is nonbubbling and noncancelable. Present resets progress to exact zero before `Popping` without scheduling closure, then emits running countdown progress from zero after opening, based on `performance.now()`, and completed progress at one before its existing timeout requests unpop. Frames stop on cancellation, replacement, detach and teardown. A vetoed expiration is not retried.
- `present.popNext(group, prepare?)` and its mounted group controller synchronously reserve/rotate a direct mounted member. Capacity defaults to one, accepts positive integers and diagnoses invalid values. Closed members are allocated before the oldest active member is reused, preserving all other presentations; explicit `show()` or changed active/condition inputs reconcile exclusive selection. A veto consumes the rotated slot without opening. A vetoed exclusive selection preserves accumulated visibility. Completion resolves to the member or null; preparation errors reject.
- Feedback uses the public group API and shared rendering logic to apply content/classes/motion before opening. Children survive message updates. Absolute explicit targets remain shared when configured that way. Empty Present target discovery is preserved.

## Source files

Created:

- `src/aellux.ext.progress.js`
- `src/internal/has-progress-api.js`
- `src/internal/install-progress-fallback.js`
- `tests/browser/progress-notifications.spec.mjs`
- `tests/browser/present-group-capacity.spec.mjs`
- `tests/unit/progress-contract.test.mjs`
- `docs-source/0.1.x/core-extensions/optional/progress.md`
- This report.

Modified runtime/build sources: `src/aellux.js`, `src/aellux.orchestrator.js`, `src/aellux.ext.present.js`, `src/aellux.ext.feedback.js`, `src/official-extension-definitions.js`, `src/internal/validate-declarations.js`, `scripts/build-core.mjs`, `scripts/build-editor-data.mjs`, `scripts/semantic-definitions.mjs` and `scripts/bundle-budget.config.mjs`.

Modified tests also include `tests/browser/present-aria.spec.mjs` (updatable controller contract) and `tests/browser/core-loading.spec.mjs` for normal/minified, Modern/Legacy registration and SRI loading.

Modified documentation: `CHANGELOG.md`, `docs-source/0.1.x/summary.json`, Core Extensions overview, Present, Feedback, Official Registry, Events, README, Getting Started, lazy loading, CSP, runtime API, Modern/Legacy, ES5 support, performance and shared risks. Builds regenerate distributions, source maps, SRI/manifests, editor metadata and rendered documentation. The pre-existing change to `templates/docweaver/css/style.css` is preserved.

## Polyfill evaluation and licensing

The fallback is original Apache-2.0 code with no added third-party dependency. Existing third-party notices remain applicable to the unchanged shared Legacy runtime; no new notice file is required.

Upstream source bytes measured on 2026-10-28 (unminified source, gzip level 6):

| Candidate | License | Raw bytes | Gzip bytes | Decision |
| --- | --- | ---: | ---: | --- |
| [Lea Verou HTML5 Progress JS](https://github.com/LeaVerou/HTML5-Progress-polyfill/blob/master/progress-polyfill.js) | MIT | 5,112 | 1,717 | ES5-era implementation; obsolete mutation events, separate CSS and global installation do not fit mount-local ownership. |
| Same Progress CSS | MIT | 1,836 | 918 | Would need embedding and lifecycle adaptation. |
| [fisker meter-polyfill JS](https://github.com/fisker/meter-polyfill/blob/master/dist/meter-polyfill.js) | MIT | 29,453 | 6,986 | ES5-compatible distribution, substantially larger and document-wide installation. |

None of this upstream code was copied into the implementation. Native prototype descriptors remain untouched, even when a constructor or partial API is missing; fallback descriptors belong only to mounted unsupported elements.

## Validation

Complete feature validation before the subsequent source-layout refactor:

| Check | Result |
| --- | --- |
| `npm run build:core` | Passed; Modern/Legacy scripts, minification, source maps, manifest/SRI and semantic/editor data regenerated. |
| `npm run build` | Passed; Core and documentation phases completed. |
| `npm run test:unit` | 92 passed; no failures or skips. |
| `npm run test:budget` | Passed for all configured artifacts, including all four Progress variants. |
| `npm run test:browser -- --workers=3` | 3,027 passed, 36 skipped, zero failures; 3,063 total cases in 15.7 minutes. |
| `git diff --check` | Passed. |

| Browser | Passed | Skipped | Failed |
| --- | ---: | ---: | ---: |
| chromium | 1021 | 0 | 0 |
| firefox | 1006 | 15 | 0 |
| webkit | 1000 | 21 | 0 |

The 36 skips are existing engine/capability-conditioned tests: Firefox and WebKit CSS-motion/scheduler capabilities, Firefox native-touch cases, and engine-specific Scrollbox pointer, scrollbar and wheel-chain cases. All 78 new Progress/notification cases ran without skips across the three engines. Modern and forced Legacy paths, Basic/Full registration, native controls, simulated missing constructors and partial APIs, embedded fallbacks, generic producers, initially visible auto-unpop, controlled-clock cancellation/restart, independent timers, teardown, rotation, reentrancy, exclusive selection, empty messages and retained child controls are covered.

That complete browser run occurred after all original feature changes and fixture corrections, before moving the Progress body into its main source file. Post-refactor checks are recorded separately below. Eighteen focused final regression checks also passed across the three engines before that complete run. No historical browser or physical assistive-technology validation is claimed.

### Source layout refactor validation

After moving the Progress body into its own main source file: Core build passed; 93 unit tests passed; all bundle budgets passed without increasing limits. The Progress/notifications and core-loading suites passed 105 browser cases across Chromium, Firefox and WebKit. After deduplicating retained Modern license notices, the final delivery artifacts passed another 27 core-loading cases across the three engines. The full 3,063-case browser suite was not rerun for this source-layout refactor.

The target listener, validation, scaling, retargeting and value restoration stay in the main IIFE. No attach factory or separate Progress Legacy entry remains. Modern and Legacy use the same Extension body, with build-time selection of the unsupported-control fallback. All distributions retain their license notice.

### Popping-time progress reset

On branch `release/0.1.0`, valid auto-unpop configuration now emits zero on the Present producer immediately before `Popping`. It resets associated native progress controls during opening. The timer and elapsed-time updates still start only after opening completes. Both reset and countdown share the same event serializer; replacement or teardown during layout/reset dispatch prevents stale transition notifications. A vetoed `BeforePop` emits no reset.

Relative to commit `93836376`, the Present Modern minified artifact increases by 213 raw / 58 gzip bytes; Legacy increases by 321 raw / 100 gzip bytes. Raw limits move from 22.5 to 22.75 KiB and from 30.5 to 30.75 KiB respectively; gzip limits remain unchanged. Core build, 93 unit tests and bundle budgets passed. The 12 new Basic/Full, Modern/Legacy cases passed in Chromium, Firefox and WebKit. The focused Progress/notifications and Present enhancements run completed with 164 passed, one Firefox native-touch capability skip and zero failures across Chromium, Firefox and WebKit. The complete browser matrix was not rerun for this reset change.

### Numeric capacity and oldest-member reuse

Empty `data-ae-present-group` now defaults to one; positive integer values set the maximum number of active/reserved presentations. Invalid values use diagnostic 2026 once per changed value and fall back to one. `popNext()` prefers closed direct members while there is capacity, otherwise replays the oldest active direct member without unpopping other members. Reuse age tracks accepted presentations rather than DOM position; a refused reuse restores an earlier reservation. Explicit selection remains exclusive. Lower limits preserve already accepted/opening members and constrain subsequent allocations; closing effects can briefly overlap visually. Direct member opening while a pool is full returns false; individual dismissal remains independent.

Existing accumulation examples declare capacities explicitly (three for the Feedback example, two for Docweaver's toast pool). This is an intentional change for empty-valued groups that previously accumulated without a numeric limit. The semantic catalog/editor data describe the new positive-integer grammar. Core build, documentation generation, all 93 unit tests and bundle budgets passed. The final focused browser run covered capacity, Progress notifications, Present enhancements/ARIA, Feedback and Docweaver menus: 476 passed, one Firefox native-touch capability skip, zero failures across Chromium, Firefox and WebKit. This includes all 144 new capacity cases in Basic/Full and Modern/forced Legacy. The entire browser matrix was not rerun for this capacity change.

Measured minified deltas relative to `9c0ffed0`, raw and gzip level 9 bytes:

| Artifact | Delta raw | Delta gzip |
| --- | ---: | ---: |
| aellux.ext.present.min.js | +1710 | +606 |
| aellux.ext.present.legacy.min.js | +2149 | +644 |
| aellux.full.min.js | +1710 | +583 |
| aellux.full.legacy.min.js | +2148 | +692 |

Only the affected Present/Full limits increase. Present Modern moves from 22.75/8 to 24.5/8.5 KiB raw/gzip; Present Legacy from 30.75/10.5 to 33/11.25; Full Modern from 192/59.5 to 194/60; Full Legacy raw from 512.5 to 515 with its existing 152 KiB gzip limit unchanged. These increases cover parsing/diagnostics, capacity accounting, presentation age, reentrant preflight and reservation restoration.

## Distribution costs

Final bytes include source-map comments. Gzip uses level 9, matching `test:budget`. Deltas compare baseline `35895693`.

| Artifact | Raw bytes | Gzip bytes | Delta raw | Delta gzip |
| --- | ---: | ---: | ---: | ---: |
| aellux.min.js | 50157 | 17129 | +1733 | +556 |
| aellux.full.min.js | 197947 | 61045 | +5239 | +1567 |
| aellux.full.legacy.min.js | 526448 | 155024 | +6350 | +1773 |
| aellux.ext.present.min.js | 24767 | 8659 | +4730 | +1535 |
| aellux.ext.present.legacy.min.js | 33437 | 11338 | +5612 | +1578 |
| aellux.ext.feedback.min.js | 4547 | 1990 | +341 | +94 |
| aellux.ext.feedback.legacy.min.js | 8803 | 3860 | +572 | +140 |
| aellux.ext.progress.js | 3024 | 1068 | new | new |
| aellux.ext.progress.min.js | 1656 | 850 | new | new |
| aellux.ext.progress.legacy.js | 13007 | 3866 | new | new |
| aellux.ext.progress.legacy.min.js | 7432 | 2987 | new | new |

Budget changes are limited to affected artifacts: boot 48/16.5 to 50/17 KiB raw/gzip; Full Modern 188.25/58.25 to 194/60; Full Legacy 508/150 to 515/152; Present Modern 20/7.25 to 24.5/8.5; Present Legacy 28/9.75 to 33/11.25; Feedback Modern raw 4.25 to 4.625 (gzip remains 2). Feedback Legacy limits are unchanged. Four Progress budgets cover the new delivery variants. The measured deltas account for capability probes/registry metadata, countdown publication, group reservations/concurrency and shared Feedback preparation; fallback code remains outside Core/Full.

## Known limits and risks

Fallback appearance is functional rather than identical to native controls. Indeterminate fallback progress is striped without claiming native animation equivalence. The fallback requires DOM descriptors and MutationObserver; current-engine missing/partial capability simulation and ES5 output do not prove every historical browser.

Accessible names, announcement strategy, reading time and screen-reader/device verification remain application responsibilities. Use separate transform owners for Present and Feedback motion. Explicit absolute message targets intentionally share content. Missing producer IDs are retried by update/retarget rather than a permanent document-wide discovery loop. Application changes to a mounted progress value restore to the original snapshot on teardown.
