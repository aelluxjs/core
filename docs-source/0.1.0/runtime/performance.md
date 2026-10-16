# Performance and Bundle Budget

The release build checks the byte size of each shipped minified runtime, Core Extension, and generated Extension stylesheet. The check measures raw bytes and gzip bytes at compression level 9. It excludes source maps because browsers do not request them as part of a normal production load.

Run the check after a build:

```sh
npm run build:core
npm run test:budget
```

The CI workflow runs the same command after `npm run build`. A pull request fails if an artifact exceeds either limit in [`scripts/bundle-budget.config.mjs`](https://github.com/aelluxjs/core/blob/main/scripts/bundle-budget.config.mjs). Change a limit only with an intentional review of the generated artifact and its delivery cost.

## 0.1.0 Baseline and Limits

The table records the beta.10 build measured on October 14, 2026. Limits are rounded upward to allow small implementation changes while detecting material growth. The full bundle includes all nine Core Extensions.

| Artifact | Baseline raw | Baseline gzip | Raw limit | Gzip limit |
| --- | ---: | ---: | ---: | ---: |
| `aellux.min.js` | 27.9 KiB | 10.4 KiB | 29 KiB | 12 KiB |
| `aellux.esm.min.js` | 17.0 KiB | 5.7 KiB | 18 KiB | 7 KiB |
| `aellux.orchestrator.min.js` | 17.5 KiB | 6.3 KiB | 21 KiB | 8 KiB |
| `aellux.full.min.js` | 54.4 KiB | 16.9 KiB | 56 KiB | 18 KiB |
| `aellux.full.legacy.min.js` | 350.3 KiB | 117.1 KiB | 360 KiB | 130 KiB |
| `aellux.ext.adaptive.min.css` | 104.1 KiB | 8.2 KiB | 121 KiB | 11 KiB |
| `aellux.ext.present.min.css` | 3.8 KiB | 0.8 KiB | 4 KiB | 2 KiB |

Each separately distributed minified Core Extension, including Anchor and Scrollbox, is also checked. Their individual limits are held in the executable configuration so the documentation does not duplicate a second table of values.

## Scope and Limitations

This budget detects distribution-size regressions. It does not measure page-specific network time, parsing time, boot time, layout, mount duration, memory use, or real-user performance. The Legacy full bundle is materially larger because it includes the shared polyfills required for its ES5 path. Runtime-performance budgets require representative application fixtures and remain post-release work.

For layout work inside an Extension, use [`waitLayout`](wait-layout.md) to batch geometry reads and dependent CSS or DOM writes. The guide includes code for coalescing frequent scroll and resize notifications.

The Present JavaScript raw limit is 10 KiB after adding the optional measured size-transition path; its 4 KiB gzip limit remains unchanged.
