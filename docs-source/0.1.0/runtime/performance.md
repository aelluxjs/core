# Performance and Bundle Budget

The release build checks the byte size of each shipped minified runtime, Core Extension, and generated Extension stylesheet. The check measures raw bytes and gzip bytes at compression level 9. It excludes source maps because browsers do not request them as part of a normal production load.

Run the check after a build:

```sh
npm run build:core
npm run test:budget
```

The CI workflow runs the same command after `npm run build`. A pull request fails if an artifact exceeds either limit. Review the generated artifact and its delivery cost before changing a limit.

## Limits

[`scripts/bundle-budget.config.mjs`](https://github.com/aelluxjs/core/blob/main/scripts/bundle-budget.config.mjs) is the source of truth for every raw and gzip limit. It covers the minified boot, ESM entry, Modern and Legacy orchestrators, Full runtimes, Core Extensions (including separate Scrollbox Snap files), and generated Extension stylesheets. The `test:budget` command prints each artifact's measured size beside its current limit and fails if a new minified JavaScript or CSS file has no budget. Full incorporates eight Core Extensions and makes Scrollbox and Scrollbox Snap available through separate on-demand files.

## Scope and Limitations

This budget detects distribution-size regressions. It does not measure page-specific network time, parsing time, boot time, layout, mount duration, memory use, or real-user performance. The Legacy full bundle is materially larger because it includes the shared polyfills required for its ES5 path. Runtime-performance budgets require representative application fixtures and remain post-release work.

For layout work inside an Extension, use [`waitLayout`](wait-layout.md) to batch geometry reads and dependent CSS or DOM writes. The guide includes code for coalescing frequent scroll and resize notifications.
