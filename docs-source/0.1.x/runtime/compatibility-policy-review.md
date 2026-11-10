# Compatibility Policy Review — aellux.js 0.1.x

**Status:** Pending maintainer review; non-normative. These proposals do not create support obligations or authorize exceptions.

The [Compatibility Commitment](compatibility-commitment.md) defines only minimal initialization and declarative activation/mounting protection beginning with `0.1.0`. This page records policy proposals that still require an explicit maintainer decision. The package remains `0.1.0-beta.10`; publishing this review does not adopt its proposals or promote the package to a stable release.

## Existing foundations and sources

| Foundation | Current source | Consequence for the commitment |
| --- | --- | --- |
| Stable / Not stable | [Extension index](../core-extensions/README.md#stability) and individual guides | Nine Stable Extensions and seven Not stable Extensions; labels indicate maturity and validation, not API preservation. This review does not change their status. |
| Bundled / Optional | [Official definitions](https://github.com/aelluxjs/core/blob/release/0.1.0/src/official-extension-definitions.js), [Full source](https://github.com/aelluxjs/core/blob/release/0.1.0/src/aellux.full.js), [registry guide](../extensions/official-registry.md) | Ten implementations in Full and six Optional scripts; Basic requires explicit registration. Distribution is independent of stability. |
| Public API and lifecycle | [Runtime API](api.md), [Events](events.md), [Authoring](../extensions/authoring.md) | Document current usage; only the explicit initialization and activation/mounting subset is protected. |
| Public versus internal semantics | [Semantic definitions](https://github.com/aelluxjs/core/blob/release/0.1.0/scripts/semantic-definitions.mjs), [catalog generator](https://github.com/aelluxjs/core/blob/release/0.1.0/scripts/build-editor-data.mjs), [editor guide](../integrations/editor-tooling.md) | Catalog inclusion and public visibility do not expand the protected subset. |
| Platform and accessibility boundaries | [Browser support](browser-support.md), [ES5 support](es5-support.md), [Accessibility](../extensions/accessibility.md) | Preserve the recorded scope; no new historical-browser, mobile or assistive-technology guarantee. |
| Quality gates | [CI workflow](https://github.com/aelluxjs/core/blob/release/0.1.0/.github/workflows/ci.yml), [package scripts](https://github.com/aelluxjs/core/blob/release/0.1.0/package.json), [release milestone](https://github.com/aelluxjs/core/blob/release/0.1.0/milestones/0.1.0.md) | Use existing applicable validation and distinguish recorded coverage from a fresh run. |

The adopted commitment permits incompatible changes to Extension APIs within `0.1.x`, regardless of maturity label, without a mandatory deprecation period or `0.2.0` requirement. The previous broader Stable-API preservation rule is superseded. Historical beta changelogs remain migration evidence.

## Decisions pending maintainer approval

| Decision | Existing state | Proposal for review | Until approved |
| --- | --- | --- | --- |
| Security / severe-defect exceptions | The repository describes trust boundaries and validation, but has no general exception policy. | Require impact analysis, a compatible mitigation when feasible, explicit maintainer approval, affected-version disclosure, migration guidance and targeted validation before an exceptional change to the minimal protected subset. | No blanket exception. Review each concrete case explicitly; documenting a change alone does not approve it. |
| Maintenance focus and backports | No release support window or backport schedule is defined. | Concentrate fixes on the latest `0.1.x`; backport selectively when the maintainer decides it is warranted. | No simultaneous-maintenance obligation for all patches, no end date, and no promised correction SLA. |
| Vulnerability reporting | A dedicated channel remains a post-release task in the release milestone; package metadata lists the public issue tracker for ordinary bugs. | Choose and publish a private reporting route and disclosure process before claiming that one exists. | No private channel, response deadline or security support window is established by this review. |
| Deprecation notice and experimental promotion | The release milestone leaves the broader policy and promotion criteria open. | Consider optional notice practices and evidence for maturity promotion; unprotected APIs have no required deprecation period or line-wide retention. | No fixed number of releases or days, automatic promotion or indefinite support; maturity changes do not alter the minimal protected subset. |
| npm release / withdrawal procedure | The release milestone still requires immutable version publication, package inspection and correction/withdrawal procedures. | Approve that operational process independently of API preservation. | Publishing this review does not authorize an npm publication, tag, version bump, CDN rollout or withdrawal. |

Each proposal requires an explicit maintainer decision before it can be presented as adopted policy. Making the proposals publicly available does not change the current Compatibility Commitment.

## Recorded contract discrepancies

| Area | Evidence | Interpretation and follow-up |
| --- | --- | --- |
| Historical Focus / Point delivery notes | Earlier release milestone entries describe Focus and Point, now [Input](../core-extensions/input.md), outside Full. The milestone identifies those packaging notes as historical. Focus and Input are currently Bundled and Not stable. | Use the current Extension index and individual guides for names, distribution and stability; read earlier delivery notes as historical records. |
| Effect easing hook | The former Feedback hook had conflicting public/private documentation. Effect ownership now belongs to Present, with `--ae-present-effect-aellux-ease` documented as an optional effect input in the generated catalog. | The migration resolves the classification discrepancy. This Extension configuration remains outside the minimal compatibility commitment. |
| Editor catalog counts | The editor guide's numeric coverage summary is a point-in-time snapshot; the generated catalog and definitions list the actual entries. | Use named entries and roles rather than treating counts as a compatibility or completeness guarantee. |

This review records policy and documentation questions. Any resolution that changes behavior requires its own implementation and validation.
