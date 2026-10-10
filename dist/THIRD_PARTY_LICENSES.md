# Third-party material in aellux.js

This file describes material shipped with `@aelluxjs/core` and material kept only in this repository. The project code is Apache-2.0; see `LICENSE`. Versions below reflect `package-lock.json` for `0.1.0-beta.6`. Recheck this list when the lockfile or build inputs change.

## Published npm package

The Modern JavaScript and CSS bundles use project source. The Legacy orchestrator and full bundles include the following MIT-licensed code. Some Legacy Extension bundles also contain Babel-generated helper code. Complete upstream license texts, including copyright and permission notices, are in `third-party/licenses/` in this package.

| Component | Locked version | Included in | License text |
| --- | --- | --- | --- |
| `@babel/helpers` | 7.29.7 | Babel-generated Legacy helpers | `third-party/licenses/babel-helpers.LICENSE` |
| `core-js` | 3.50.0 | Legacy orchestrator and full polyfills | `third-party/licenses/core-js.LICENSE` |
| `custom-event-polyfill` | 1.0.7 | Legacy orchestrator and full polyfills | `third-party/licenses/custom-event-polyfill.LICENSE` |
| `raf` | 3.4.1 | Legacy orchestrator and full polyfills | `third-party/licenses/raf.LICENSE` |
| `performance-now` | 2.1.0 | Transitive dependency of `raf` in Legacy bundles | `third-party/licenses/performance-now.LICENSE` |
| `whatwg-fetch` | 3.6.20 | Legacy orchestrator and full polyfills | `third-party/licenses/whatwg-fetch.LICENSE` |

Legacy orchestrator and full bundles carry a short third-party banner. The package contains this report and the full texts even when a bundle is minified. Source maps contain source content and should be distributed with their corresponding package notices.

## Repository and documentation site only

- `tests/fixtures/bootstrap-5.3.8.min.css` is a test fixture, not part of the npm package. Its header retains Bootstrap's MIT attribution. The complete upstream text is in `tests/fixtures/bootstrap-5.3.8.LICENSE`.
- The documentation build uses `@wolimp/docweaver` 0.1.0-beta.8, pinned to commit `fcad3db8b8195a0c61852ce71b3129a502a79354`. Its theme assets are copied to `docs/assets/docweaver/`, and its templates contribute to generated pages. The generated asset directory contains its Apache-2.0 `LICENSE` and a short attribution file. The upstream package has no `NOTICE` file.
- Other build and test packages, including esbuild, Babel, Playwright, Eta and Marked, execute during development. Their package code is not copied into the published runtime bundles. The lockfile records their versions and license identifiers. It currently contains 418 non-root package entries: 405 MIT, 5 Apache-2.0, 5 ISC, 2 BSD-2-Clause and 1 CC-BY-4.0 (`caniuse-lite`, build data only).

## Notice decision

No separate project `NOTICE` file is required for the material found in this audit. The Apache-2.0 dependency copied into the documentation site has no upstream `NOTICE` to propagate. This report and the accompanying full license texts record the incorporated third-party material. Review this decision if dependencies, templates or copied assets change.
