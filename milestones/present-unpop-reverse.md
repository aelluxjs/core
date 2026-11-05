# Present reverse playback

Status: implemented on `release/0.1.0`, following the separate dismissal migration. The design below records the architectural requirements; the public contract is documented in [Present](../docs-source/0.1.x/core-extensions/present.md#opening-reverse-playback).

`dismiss()` performs an independent outgoing animation from the current rendered state to the configured `dismiss` destination. `unpop()` reverses the original `pop()` presentation toward its `from` state, preserving the actual opening trajectory.

For `from: scale(0.5)`, `pop: scale(1)` and `dismiss: scale(1.2)`, pop travels 0.5 → 1, dismissal travels current → 1.2, and reverse playback travels current → 0.5 along the opening trajectory. A second independent animation targeting `from` does not reproduce reversal of nonlinear easing.

## Implemented decisions

- Public and mounted `unpop()` plus `data-ae-trigger="unpop"` invoke actual reversal. No independent unpop destinations, duration or easing properties were reintroduced. Old automatic unpop attributes remain inactive.
- Opening effects retain original keyframes, easing and per-property timing. Reverse playback uses negative delay and reverse direction to travel only the already played segment on the existing CSS Motion scheduler or native timing. Completed openings retain serializable trajectory data, not animation resources. A region initially visible uses an implied full opening.
- Native CSS-only fallback uses generated keyframes with captured endpoints and original CSS easing. Grid tracks retain their authored units because browsers can report identical current pixel tracks from `getKeyframes()`.
- `BeforeUnpop` can veto before cancellation; Layout/Unpopping/Unpop and UnpopFocusLost preserve normal presentation routing/cleanup. Pop progress travels backwards; normalized unpop progress advances to one. Hidden/presented state endpoints are documented in the guide.
- Maintainer decision: calling `unpop()` during active independent `dismiss()` returns false and preserves that operation, since dismissal can lie outside the opening trajectory. Dismiss can replace reverse playback continuously; explicit pop can replace it with its normal from-state restart. Default toggle/groups/automation continue dismissing.
- Reverse cleanup restores temporary inline values/priorities, measured caps, transition/animation declarations and endpoint variables, including replacement/unmount/destroy paths.

## Technical considerations

- Retain the actual opening trajectory and progress when interrupted; define timing/easing reversal, including overshoot, partial openings and repeated reversal.
- Assess existing CSS Motion Controller capabilities and native fallback before changing architecture. Preserve opacity, transform, grid/measured dimensions and author inline-style restoration.
- Define progress channels, cancellation, focus release, completion events and Promise settlement explicitly; no names or payloads are promised by this note.
- Preserve `dismiss()` as the default closing path for toggle(false), groups, controls and automation. Only explicit pop restarts from `from`.

## Acceptance criteria

- Reverse a complete and a partial opening along the original trajectory in controlled and native motion, with nonlinear easing and appropriate remaining time.
- Preserve intermediate visual state through pop/reverse/dismiss replacements, repeated calls, vetoes, reduced motion, errors, unmount and destroy.
- Validate progress/focus/completion semantics, dimensions and temporary-style cleanup in Modern/Legacy across Chromium, Firefox and WebKit.
- Introduce the real public contract and its docs/editor metadata together, without reusing the old independent-closing meaning of `unpop`.

## Validation - 2026-11-04

- Core/docs generation, all **96 unit tests**, bundle budgets and git diff whitespace checks passed. Version remains 0.1.0-beta.10.
- Full browser matrix completed with **3715 passed, 38 capability skips and 3 failures**. All three failures were the new initially-visible reverse progress case: rotation was correct, but the public pop channel was still a literal stable endpoint. The replay now binds it to its animated private phase.
- The three failing browser cases passed after rebuilding (**3 passed**). The complete matrix was not repeated after this localized progress fix.
- Reversal, CSS Motion, Full distribution and SRI were then rechecked across Chromium, Firefox and WebKit: **193 passed, 2 capability skips, zero failures**. This includes all 126 new reversal cases in Modern/Legacy and the applicable Basic/Full combinations.
- The final input-normalization check used both native linear() and LINEAR(), advanced overshoot, completed opening progress and the initially-visible case: **27 passed** across all three engines. Exact easing strings avoid WebKit getTiming() stop rounding; native and advanced curves retrace the same intermediate coordinates.
- All **78 source maps** parsed; **344 embedded repository source entries** matched current source using their final src-relative paths. Existing repeated src path prefixes were not changed. Package dry-run contained **198 entries**, including expected Modern/Legacy/CSS/editor artifacts and no development or temporary files.
- An earlier trace-enabled broad run was interrupted after its worker did not exit; the completed trace-disabled matrix above replaces that attempt as validation evidence. An isolated-server attempt also exposed a test expectation fixed to port 4173; Full now checks the configured baseURL. Neither issue was classified as a library regression.
- Local raw logs and JSON results are retained under `test-results/present-unpop-validation/` (ignored by Git). Before/after bytes and the six affected budget adjustments are recorded in [performance](../docs-source/0.1.x/runtime/performance.md#present-opening-reverse-playback). No new dependencies or per-frame interpolation loop were added.

## Implementation files

- `src/aellux.ext.present.js` and `.css.js`: public/mounted API, trigger routing, lifecycle, groups, progress, styles and native keyframes.
- `src/internal/create-present-playback.js`: opening capture, replay, remaining-time clipping and temporary-style restoration.
- `src/internal/sample-css-easing.js` and `create-css-motion-controller.js`: shared exact sampled curves, reverse progress FPS classification and owned native completion.
- Focus and Scrollbox consume reverse focus/completion events. Semantic definitions/development diagnostics advertise the new contract; generated metadata, bundles, CSS, maps, SRI and docs were regenerated.
- `tests/browser/present-unpop.spec.mjs`: 42 behavioral cases; related Present/controller/metadata tests updated. `tests/browser/full-bundle.spec.mjs` uses the configured server origin.
- The Present, events, CSS Motion, Focus, compatibility, validation and performance guides document the final contract. `docs/teste.htm` has distinct Dismiss and Reverse controls. The earlier dismissal report is marked historical. Existing unrelated worktree edits were preserved.
