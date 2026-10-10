# Performance and Bundle Budget

The release build checks the byte size of each shipped minified runtime, Core Extension, and generated Adaptive stylesheet. The check measures raw bytes and gzip bytes at compression level 9. It excludes source maps because browsers do not request them as part of a normal production load.

Run the check after a build:

```sh
npm run build:core
npm run test:budget
```

The CI workflow runs the same command after `npm run build`. A pull request fails if an artifact exceeds either limit in [`scripts/bundle-budget.config.mjs`](https://github.com/aelluxjs/core/blob/main/scripts/bundle-budget.config.mjs). Change a limit only with an intentional review of the generated artifact and its delivery cost.

## 0.1.0 Baseline and Limits

The table records the release-candidate baseline measured on October 10, 2026. Limits are rounded upward to allow small implementation changes while detecting material growth.

| Artifact | Baseline raw | Baseline gzip | Raw limit | Gzip limit |
| --- | ---: | ---: | ---: | ---: |
| `aellux.min.js` | 25.6 KiB | 9.3 KiB | 28 KiB | 11 KiB |
| `aellux.esm.min.js` | 14.6 KiB | 5.0 KiB | 16 KiB | 6 KiB |
| `aellux.orchestrator.min.js` | 16.8 KiB | 6.0 KiB | 20 KiB | 7 KiB |
| `aellux.full.min.js` | 34.4 KiB | 11.1 KiB | 40 KiB | 13 KiB |
| `aellux.full.legacy.min.js` | 316.8 KiB | 109.4 KiB | 350 KiB | 125 KiB |
| `aellux.ext.adaptive.min.css` | 104.1 KiB | 8.2 KiB | 120 KiB | 10 KiB |

Each separately distributed minified Core Extension is also checked. Their individual limits are held in the executable configuration so the documentation does not duplicate a second table of values.

## Scope and Limitations

This budget detects distribution-size regressions. It does not measure page-specific network time, parsing time, boot time, layout, mount duration, memory use, or real-user performance. The Legacy full bundle is materially larger because it includes the shared polyfills required for its ES5 path. Runtime-performance budgets require representative application fixtures and remain post-release work.
