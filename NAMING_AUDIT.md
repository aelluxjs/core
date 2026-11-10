# Naming audit — 2026-11-10

The authoritative policy is [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md). The public [naming and migration guide](docs-source/0.1.x/brand-naming.md) describes the pre-0.1.0 API change.

## Scope and changes

The initial inventory covered all 609 tracked files, including generated output. Searches covered old spellings, capitalized brand variants, global exposure/consumption, embedded scripts, string-based evaluation and ambiguous references to the library as the semantic model. Context review separated prose, executable API references and independent technical contracts before validating the generated artifacts.

The final change set contains 415 files: 42 runtime sources, 183 distribution files, 33 documentation sources, 51 generated documentation files, 8 homepage/Library files, 6 templates, 5 scripts, 81 test files, 1 CI workflow and 5 root documents/configuration files. Generated bundles and source maps account for most distribution changes.

| Area | Reviewed and corrected |
| --- | --- |
| Core and exports | Browser boot, default ESM export, instance reuse, orchestrator, Full registration and mount/controller helpers now use `aelluxJs`. |
| Extensions and loaders | Independent extensions, CSS generators, input adapters, dynamic imports, external-extension scaffold, dependency loading and build-time VM contexts consume the same global. |
| Documentation | README, current versioned sources, API examples, extension authoring, compatibility commitment, navigation, migration guide and theme scripts distinguish `aellux`, `aellux.js` and `aelluxJs`. |
| Pages and examples | Homepage, standalone examples, Library metadata, manifest, snippet preview support and browser fixtures use current names; the Library worker cache version is 8. |
| Metadata and generation | Package description, editor catalog labels, generated HTML/SEO, source maps, Modern/Legacy, minified/unminified bundles, signed manifests and the documentation preload hash are aligned. Package/file names, domains and existing URL paths are preserved. |
| Regression prevention | `npm run test:naming` scans current first-party text and generated artifacts in CI. A deliberate obsolete operational reference was rejected; the canonical global and existing event names passed. Behavioral tests exercise actual globals, exports, startup, extension loading and generated-document navigation. |

The main inconsistencies were competing brand/library spellings, the retired capitalized global across consumers and build scripts, an uppercase Library label, prose confusing the global identifier with the library, and documentation about the DOM event prefix that required separate treatment from the global rename.

## Retained exceptions and compatibility

- DOM events retain their existing names, including `AelluxJsReady` and the event-prefix template. Editor metadata continues to describe that same event namespace.
- Persistence keys, history markers, CSS/HTML namespaces, `AelluxPWAConfig`, internal functions/constants and the `$ae` alias retain their contracts. Local/internal identifiers follow JavaScript conventions rather than branding rules.
- Released changelog sections, archival milestone reports, third-party code/licenses and existing SVG/bitmap artwork remain intact. The change is recorded in the unreleased changelog section. Migration explanations, incorrect-usage tables and narrow negative-test assertions are intentional exceptions in the checker.
- The new global is a potentially breaking API change for earlier beta integrations. There is no retired-global compatibility alias. Third-party extensions and copied callbacks using the earlier global require migration. Deploy matching boot/runtime/extension/adapter assets and refresh application-owned offline caches, including when the beta version number is unchanged.
- This work does not alter the behavior or contracts of Input, Focus, Present or other extensions. It does not publish a release or change existing Git tags.

## Validation

| Check | Result |
| --- | --- |
| `npm run build` | Passed; generated 90 JavaScript artifacts plus source maps, editor data and documentation, covering unminified/minified Modern/Legacy and ESM delivery. |
| `npm run test:unit` | 117 passed, including ESM global exposure in fresh processes without `window`. |
| `npm run test:naming` | Passed across 571 current first-party text files, including generated files. The deliberate regression probe was rejected and then removed. |
| `npm run test:budget` | All configured raw/gzip limits passed without increasing budgets. |
| Global and generated-document browser tests | 39 cases passed across Chromium, Firefox and WebKit; tested both boot/ESM load orders, instance identity, absence of retired/brand globals, extension loading and real documentation navigation. |
| Selected browser regressions | Initial run: 612 passed, 6 skipped, 6 failed. The failures came from two negative assertions whose historical property names had been incorrectly treated as prose. After restoring those assertions, all six cases passed on rerun. The final 45-case run included these six cases and all 39 global/documentation cases. |
| Rendered documentation links | 52 pages and 3,272 local links passed, using the actual heading-ID generator in Chromium. |
| Package inspection | `npm pack --dry-run --ignore-scripts` passed after the final build: 226 entries; the official guidelines are included. |
| Historical/artwork preservation | Released changelog sections were compared with HEAD and remain identical; milestone, third-party and SVG files have no changes. |
| Whitespace | `git diff --check` passed. |

The selected browser coverage totals **657 distinct passing cases and 6 declared skips** after the corrected assertions passed. The six skips are the existing Firefox/WebKit exclusions for native touch-gallery behavior, native multi-touch gamepad behavior and complete Service Worker offline reload. Chromium exercised these cases. The selection covered `core-loading`, `full-bundle`, `extension-registry`, `dependency`, `integrity`, `communication`, `scenarios`, `library`, `library-catalog`, `home-examples` and `docweaver-menu`, plus the new global and generated-document tests. It is not a claim that the entire repository browser suite ran.

During migration, unit validation also caught literal DOM event-name templates that required preserving their historical prefix independently of the global rename. These were corrected before the final 117-test unit pass. Build/browser execution required access outside the filesystem sandbox; package inspection used a workspace-local npm cache. All final checks completed successfully.

No implementation or build issues remain open in this audit. External applications and third-party extensions using earlier beta globals still require the documented migration and coordinated asset deployment.
