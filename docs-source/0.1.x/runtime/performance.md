# Performance and Bundle Budget

The release build checks the byte size of each shipped minified runtime, Core Extension, and generated Extension stylesheet. The check measures raw bytes and gzip bytes at compression level 9. It excludes source maps because browsers do not request them as part of a normal production load.

Run the check after a build:

```sh
npm run build:core
npm run test:budget
```

The CI workflow runs the same command after `npm run build`. A pull request fails if an artifact exceeds either limit. Review the generated artifact and its delivery cost before changing a limit.

## Limits

[`scripts/bundle-budget.config.mjs`](https://github.com/aelluxjs/core/blob/main/scripts/bundle-budget.config.mjs) is the source of truth for every raw and gzip limit. It covers the minified boot, ESM entry, Modern and Legacy orchestrators, Full runtimes, Core Extensions (including separate Dialog and Scrollbox Snap files), and generated Extension stylesheets. The `test:budget` command prints each artifact's measured size beside its current limit and fails if a new minified JavaScript or CSS file has no budget. Full incorporates eleven Bundled Extensions. Only the Optional Extensions (Ajax Href, Dialog, PWA and Viewport) use separate on-demand scripts in Full. Basic loads separately the Extensions explicitly registered by the developer and their declared dependencies.

## Core delivery split

Bundled Extensions ship inside Full, while Optional Extensions (Ajax Href, Dialog, PWA and Viewport) remain external. Basic embeds no Extension implementations and starts with no registrations. The following measurements record the earlier Full delivery split; they are not updated measurements for later registration changes. Measured minified raw/gzip level 9 bytes and revised limits:

| Artifact | Before raw / gzip bytes | After raw / gzip bytes | Limits raw / gzip KiB |
| --- | --- | --- | --- |
| Modern orchestrator | 63,454 / 21,135 | 65,106 / 21,478 | 64.5 / 21.5 |
| Legacy orchestrator | 336,063 / 106,151 | 337,826 / 106,564 | 331 / 105 |
| Modern Full | 128,936 / 40,488 | 190,435 / 58,625 | 188 / 58 |
| Legacy Full | 439,936 / 130,175 | 517,539 / 152,376 | 508 / 150 |

The Full increase includes Scrollbox, Snap and Overflow Marquee and removes Ajax Href. The two existing standalone Ajax Href budget excesses are unchanged by this delivery split.

## Viewport delivery

The optional [Viewport Extension](../core-extensions/optional/viewport.md) ships independently, without CSS, dependencies or implementation code in Full/Orchestrator. The following sizes use raw bytes and gzip level 9, compared with the preceding checked-in artifacts:

| Artifact | Before raw / gzip bytes | After raw / gzip bytes |
| --- | --- | --- |
| Viewport Modern | New | 13,974 / 3,749 |
| Viewport Modern minified | New | 6,672 / 2,851 |
| Viewport Legacy | New | 25,775 / 6,758 |
| Viewport Legacy minified | New | 11,883 / 4,860 |
| Snap Modern minified | 10,526 / 4,040 | 10,336 / 3,975 |
| Snap Legacy minified | 13,010 / 4,810 | 12,832 / 4,729 |
| Full Modern minified | 190,435 / 58,625 | 190,334 / 58,564 |
| Full Legacy minified | 517,539 / 152,376 | 517,450 / 152,324 |
| Orchestrator Modern minified | 65,106 / 21,478 | 65,195 / 21,488 |
| Orchestrator Legacy minified | 337,826 / 106,564 | 337,915 / 106,577 |
| Boot minified | 46,326 / 15,771 | 47,129 / 16,045 |

Viewport's regular budgets are 14/4 KiB raw/gzip for Modern and 26/7 KiB for Legacy; minified budgets are 7/3 KiB and 12/5 KiB respectively. Boot's signed registry entries add 803/274 bytes and its limits change from 47.5/15.5 KiB to 48/16 KiB. Full gets smaller because removing Snap's old position calculation outweighs the new registration entry; Orchestrator adds only registration metadata. Existing Ajax Href budget excesses remain byte-identical to the preceding artifacts.

## Scope and Limitations

The [Dialog Extension](../core-extensions/optional/dialog.md) Legacy script exclusively includes `dialog-polyfill` 0.5.6, its CSS and per-element mount registration. Compared with the preceding checked-in artifacts, the measured minified sizes are raw/gzip level 9 bytes:

| Artifact | Before raw / gzip bytes | After raw / gzip bytes | Limits at that change raw / gzip |
| --- | --- | --- | --- |
| Legacy orchestrator | 349,522 / 109,918 | 336,063 / 106,151 | 328.5 / 104 KiB |
| Legacy Full | 464,668 / 138,283 | 451,842 / 134,544 | 441.5 / 132 KiB |
| Dialog Modern | Separate artifact added | 825 / 450 | 1 / 0.5 KiB |
| Dialog Legacy | Separate artifact added | 14,529 / 4,870 | 14.5 / 5 KiB |

The global Legacy limits decrease from 342/108 KiB and 454.5/138 KiB respectively. Orchestrator loses 13,459 raw and 3,767 gzip bytes; Full loses 12,826 raw and 3,739 gzip bytes. Full Modern adds 626/264 bytes and the boot adds 789/271 bytes for the new signed registry entry and selective registration, within their existing limits. Pages without dialogs do not download the Extension. Modern artifacts contain no dialog fallback code or CSS.

This budget detects distribution-size regressions. It does not measure page-specific network time, parsing time, boot time, layout, mount duration, memory use, or real-user performance. The Legacy full bundle is materially larger because it includes the shared polyfills required for its ES5 path. Runtime-performance budgets require representative application fixtures and remain post-release work.

For layout work inside an Extension, use [`waitLayout`](wait-layout.md) to batch geometry reads and dependent CSS or DOM writes. The guide includes code for coalescing frequent scroll and resize notifications.

PWA has independent budgets for its Modern/Legacy Extension and classic reusable worker. Its code and guide styles never enter Full or Core. Full reuses the signed index from the version-matched boot script to avoid duplicating registry metadata. See [PWA](../core-extensions/optional/pwa.md).
