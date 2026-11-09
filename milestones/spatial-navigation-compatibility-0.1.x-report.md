# Spatial Focus and 0.1.x compatibility revision

Implementation and validation record for `release/0.1.0`, 2026-11-09. This report does not publish a package or establish policy beyond the canonical [Compatibility Commitment](../docs-source/0.1.x/runtime/compatibility-commitment.md).

## Changed files

- Runtime: `src/aellux.ext.focus.js`, new `src/internal/focus-spatial.js`, `src/aellux.orchestrator.js`, `src/internal/development-helpers.js`.
- Metadata/budgets: `scripts/semantic-definitions.mjs`, `scripts/bundle-budget.config.mjs`; regenerated boot, Focus, orchestrator and Full artifacts, source maps, signed registry and editor metadata under `dist/`.
- Tests: new `tests/unit/focus-spatial.test.mjs`, new `tests/browser/focus-spatial.spec.mjs`; `tests/browser/home-examples.spec.mjs` now waits for responsive layout; `tests/browser/present-anchor-integration.spec.mjs` explicitly loads its dynamically inserted boot synchronously.
- Guides: `docs-source/0.1.x/core-extensions/focus.md`, `input.md`, all sixteen Extension maturity notices, the Core index, accessibility, authoring, validation scenarios and editor tooling.
- Policy: `docs-source/0.1.x/runtime/compatibility-commitment.md`, `compatibility-policy-review.md`, `api.md`, `browser-support.md`, the version overview/technical compatibility page, root `README.md`, `docs-source/README.md` and `CHANGELOG.md`.
- Generated documentation: corresponding HTML pages under `docs/0.1.x/`. The existing Present-to-Input cost link now targets `#distribution-cost`.

Changes already in progress in `home/library/` and its dedicated tests were preserved. They are not part of this implementation.

## Spatial strategy

Input still normalizes physical commands, associates `deviceId` with `focusId` through synchronous routers, applies action maps and requests `focus.command` through `$ae.comm`. Focus owns policy, scope, eligibility, target selection and logical focus. No new Extension, dependency, physical adapter call or parallel communication channel was added.

The internal pure rectangle selector requires center advance in the requested direction. It prioritizes perpendicular interval overlap. Within each alignment class it scores primary edge gap plus three times perpendicular gap plus 0.1 times perpendicular center offset, then center advance and stable DOM order. It supports irregular grids and unequal element sizes without relying exclusively on Euclidean center distance. No wrap or destination leaves focus unchanged and reports the command unhandled.

Focus reads fresh rectangles synchronously for each command, collecting candidate geometry before focus/class/scroll writes. This avoids stale responsive/transform geometry and complex cache invalidation while retaining the synchronous command contract. Selection excludes disabled, detached, inert, hidden/content-hidden/transparent, effectively closed Present and unmeasurable targets. Native history retains its existing eligibility, including controls focused during opening preparation; spatial filters do not rewrite native focus history.

The nearest focus scope/dialog/modal bounds navigation inside the programmatic context scope; nested isolated scopes are excluded. A declared navigation-policy region can narrow that boundary further. Native nearest scrolling reveals the selected element inside the boundary, also for logical-only contexts, and lets Scrollbox observe normal scroll events.

## Modality policy

New attribute: `data-ae-focus-nav`, resolved from the nearest declaration on every directional command, including dynamic DOM/attribute changes.

| Value | Behavior |
| --- | --- |
| `auto` | Spatial for enabled gamepad and independent logical contexts. DOM-synchronized keyboard context 1 stays native. Other sources are not automatically spatial in synchronized contexts. |
| `spatial` | Also enables keyboard and application-adapter directions in the region. |
| `native` | Keeps keyboard directions native, including independent contexts; gamepad retains its automatic policy. |
| `none` | Disables automatic directions for all sources. Explicit contextual shortcuts retain their own contract. |

Gamepad remains opt-in through Input. Tab/Shift+Tab, composition, text editing, select/slider/spinbutton controls, composite ARIA widget directions, modified arrows and already prevented commands retain keyboard ownership. A physical default is prevented only after consumption. No tabindex changes, roving tabindex or independent screen-reader cursors are introduced. Player classes coexist; contexts above 1 never call `.focus()` or change `document.activeElement`.

## Protected compatibility subset

Only `AelluxJs`, `$ae`, `$ae.init()` with fundamental `basic`/`full` initialization, minimal initial `$ae.ext(nameOrUrl, options?)` declaration, automatic official registration in Full, HTML Extension link declarations and the enumerated declarative activation/mounting names remain protected. The exhaustive [activation table](../docs-source/0.1.x/runtime/compatibility-commitment.md#declarative-activation-and-initial-mounting) includes native Dialog/Progress/Meter activation and State Navigation's lack of an element mount selector.

Names that combine activation and configuration retain only their activation/mounting role. Their behavioral values, formats, defaults and additional options are not frozen. Global availability, documentation and editor catalog inclusion do not extend the protected subset.

The earlier broad guarantees for Stable Extension methods, controllers, events/payloads, CSS, configuration and all documented Core/lifecycle helpers are removed. Programmatic mounting, lifecycle control, internal communication and unlisted helpers receive no implicit guarantee. Stable now means mature implementation with documentation and appropriate validation. All sixteen classifications remain unchanged. Unprotected incompatibilities may ship within `0.1.x` without mandatory `0.2.0` or formal deprecation periods; relevant changes, renames/removals and migration guidance must still be documented when appropriate.

## Bundle measurements

Minified artifact bytes; gzip level 9, matching the budget checker. Baseline is the preceding checked-in `HEAD` artifact. Only these four budget entries increase. Input and its physical adapters are unchanged.

| Artifact | Before raw / gzip | After raw / gzip | Delta raw / gzip | New budget KiB raw / gzip |
| --- | --- | --- | --- | --- |
| Focus Modern | 11,574 / 4,540 | 14,417 / 5,577 | +2,843 / +1,037 | 14.5 / 5.75 |
| Focus Legacy | 15,123 / 5,530 | 19,309 / 6,773 | +4,186 / +1,243 | 19 / 6.875 |
| Full Modern | 227,227 / 70,649 | 230,048 / 71,661 | +2,821 / +1,012 | 226 / 70.5 |
| Full Legacy | 565,255 / 166,995 | 569,495 / 168,138 | +4,240 / +1,143 | 558 / 165 |

## Validation

- Runtime and documentation builds completed. The sandbox's esbuild ancestor-directory denial was resolved by running the authorized build outside the sandbox.
- `npm run test:unit`: 112 passed.
- `npm run test:budget`: passed with the measured four-entry adjustment.
- Focus spatial plus the affected homepage scenarios: 72 passed across Chromium, Firefox and WebKit, covering Modern and Legacy.
- Documentation audit: 48 generated pages, 3,456 rendered internal links and 259 local Markdown references passed. The browser audit used the published `/core/` asset prefix and theme-generated heading IDs.
- Present/Anchor integration after correcting boot loading: 99 passed across all three engines.
- Full browser matrix: 4,215 cases executed with four workers through `playwright.isolated.config.mjs`; 4,159 passed, 44 declared capability/engine skips, 12 failed on the initial broad run (22.8 minutes). The failures comprise eight Chromium boot-fixture assertions corrected and covered by the 99-case integration rerun, two WebKit native Anchor timing assertions, and the same library preview click timeout in Chromium/Firefox.
- Each of the ten non-library failures subsequently passed three repetitions: 30 passes in total, comprising the 10-case `--last-failed` rerun, 16 additional Chromium integration repetitions and four additional WebKit timing repetitions. The Anchor assertions passed unchanged in these isolated reruns; no Anchor runtime change was made. These reruns validate the corrected fixture and temporal checks separately from the initial matrix.
- Declared skips: 19 in Firefox and 25 in WebKit, for engine/driver-specific touch/CDP, offline coverage, CSS sampling and related capability boundaries. Spatial Focus cases have no skips.
- Remaining failing scenario: the library preview click test in Chromium and Firefox. Its neighboring-card/search-panel pointer interception also reproduces with the original `HEAD` distribution. The entire browser matrix is therefore not reported as green.
- `git diff --check`: passed after final reporting.

The initial sandbox Firefox page-creation failure did not reproduce outside the sandbox. The broad suite exposed a stale Present/Anchor fixture expecting no warnings while inserting an implicitly asynchronous boot; its loading setup was corrected. A library preview click timeout was independently reproduced using the original `HEAD` distribution: a neighboring card/search panel intercepts the click. No library product/test edits were made for that unrelated issue.

Reproduction commands use the local test server (`node tests/browser/server.mjs`):

```sh
npm run build:core
npm run build:docs
npm run test:unit
npm run test:budget
npx playwright test --config=playwright.isolated.config.mjs --workers=4
npx playwright test --config=playwright.isolated.config.mjs tests/browser/present-anchor-integration.spec.mjs --workers=2
npx playwright test --config=playwright.isolated.config.mjs tests/browser/present-anchor-integration.spec.mjs --grep "integrated interruption" --project=chromium --repeat-each=2 --workers=1
npx playwright test --config=playwright.isolated.config.mjs tests/browser/anchor-enhancements.spec.mjs --grep "native fallback.*legacy=false" --project=webkit --repeat-each=2 --workers=1
```

No package version, npm publication, GitHub release, commit or push was created by this task. Changes remain available locally for review.

## Limits and later work

Bounding rectangles approximate transformed/rotated shapes, inline fragments and complex clipping; they do not model occlusion. Unrendered virtualized items, iframe/shadow-root interiors and automatic transfers between isolated containers are outside this version. Beam priority can favor a distant aligned target. Native scrolling is bounded by the region; transform-only scrolling and oversized targets have limited alignment. Large scopes require profiling of synchronous geometry and ancestor-style checks.

Physical TV/console devices, mobile IME workflows and assistive technology still require direct validation. Future work may refine scoring, virtualized-target integration or explicit container transfers while preserving logical context ownership. The [CSS Spatial Navigation draft](https://www.w3.org/TR/css-nav-1/) and [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) are conceptual references; no experimental browser spatial API is required.
