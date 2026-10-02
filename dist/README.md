# aellux.js

aellux.js is a lightweight extension-management library for modular UX behaviors in browser interfaces. It complements Bootstrap and other visual systems with declarative HTML attributes and independently loadable JavaScript Extensions.

An **EXT (aellux.js Extension)** owns one focused UX responsibility and exposes its API under `AelluxJs.ext` and its `$ae.ext` alias. The aellux.js boot script selects the runtime, while the orchestrator loads Extensions and coordinates `init`, `mount`, `unmount`, and `destroy`.

aellux.js does not require or bundle Bootstrap. Its `data-ae-*` and `ae--*` namespaces are designed to coexist with existing applications and frameworks.

## Quick Start

```html
<script src="./dist/aellux.js"></script>
<script>
  $ae.init({ mode: "full" });
</script>
```

Use `full` to load all core Extensions. Use `basic` to register only what the page needs:

```html
<script src="./dist/aellux.js"></script>
<script>
  $ae.ext("preference");
  $ae.ext("feedback");
  $ae.init({ mode: "basic" });
</script>
```

See [Getting Started](../docs/getting-started.md) for build instructions, runtime modes, and distribution details.

## Documentation

- [Documentation index](../docs/README.md)
- [Beta compatibility](../docs/compatibility.md)
- [Runtime API](../docs/runtime/api.md)
- [Diagnostics](../docs/runtime/diagnostics.md)
- [Modern and Legacy runtimes](../docs/runtime/modern-legacy.md)
- [Browser support baseline](../docs/runtime/browser-support.md)
- [ES5 support level](../docs/runtime/es5-support.md)
- [Visual mounting states](../docs/runtime/visual-mounting.md)
- [Bootstrap integration](../docs/integrations/bootstrap.md)
- [Registering aellux.js Extensions](../docs/extensions/registration.md)
- [Authoring third-party Extensions](../docs/extensions/authoring.md)
- [Declarative Extension loading](../docs/extensions/declarative-loading.md)
- [Lazy loading](../docs/extensions/lazy-loading.md)
- [Optional Extension styles](../docs/extensions/styles.md)
- [Modern and Legacy Extension variants](../docs/extensions/legacy-variants.md)
- [Browser validation scenarios](../docs/validation-scenarios.md)
- [Extension scaffold](../templates/README.md)

## Core Capabilities

- Declarative activation through `data-ae-*` attributes.
- Selective eager or lazy Extension loading.
- Optional styles associated with individual Extensions.
- Idempotent DOM mounting through `$ae.update(root)`.
- Browser history, preferences, feedback, persistence, and asynchronous content behaviors.
- ES5-compatible boot script with an [ES2017+ Modern browser baseline](../docs/runtime/browser-support.md).

## Build

Node.js 20 or newer is required for build tooling:

```sh
npm install
npx playwright install
npm run build
npm run test:browser
```

`test:browser` rebuilds the distribution and runs the browser scenarios with Playwright in Chromium, Firefox, and WebKit. Use `npm run test:browser -- --project=chromium` to run one browser.

Generated browser files are written to `dist/`. The distribution uses classic scripts isolated in IIFEs; it does not expose ESM named or default exports.

## Project Status

aellux.js `0.1.0-beta.6` is the current prerelease. Beta 1 established the initial runtime, Extension contract, Modern/Legacy distributions, and repeatable browser validation scenarios. The Beta 2 cycle focused on CI, multi-browser coverage, real Legacy validation, security, accessibility, and commercial distribution readiness.

Review the [0.1.0 Beta 2 milestone](../docs/milestones/0.1.0-beta.2.md), the [Beta 1 milestone](../docs/milestones/0.1.0-beta.1.md), and delivered changes in the [changelog](../CHANGELOG.md).

## License

aellux.js is licensed under the [Apache License 2.0](LICENSE). Third-party dependencies remain subject to their own licenses.

## Author

[Pec Rodrigues](https://github.com/pecrodrigues)
