# Aellux

Aellux is a lightweight extension-management library for modular UX behaviors in browser interfaces. It complements Bootstrap and other visual systems with declarative HTML attributes, adaptive CSS utilities, and independently loadable JavaScript Extensions.

An **EXT (Aellux Extension)** owns one focused UX responsibility and exposes its API through the global `Aellux` object and its `$ae` alias. The Aellux boot script selects the runtime, while the orchestrator loads Extensions and coordinates `init`, `mount`, `unmount`, and `destroy`.

Aellux does not require or bundle Bootstrap. Its `data-ae-*`, `ae--*`, and `*-ux-*` namespaces are designed to coexist with existing applications and frameworks.

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
  $ae.ext("preferences");
  $ae.ext("adaptive", {
    loadWhen: "[data-ae-adaptive]",
    loadStyle: true
  });
  $ae.init({ mode: "basic" });
</script>
```

See [Getting Started](docs/getting-started.md) for build instructions, runtime modes, and distribution details.

## Documentation

- [Documentation index](docs/README.md)
- [Beta compatibility](docs/compatibility.md)
- [Runtime API](docs/runtime/api.md)
- [Diagnostics](docs/runtime/diagnostics.md)
- [Modern and Legacy runtimes](docs/runtime/modern-legacy.md)
- [ES5 support level](docs/runtime/es5-support.md)
- [Visual mounting states](docs/runtime/visual-mounting.md)
- [Bootstrap integration](docs/integrations/bootstrap.md)
- [Registering Aellux Extensions](docs/extensions/registration.md)
- [Authoring third-party Extensions](docs/extensions/authoring.md)
- [Declarative Extension loading](docs/extensions/declarative-loading.md)
- [Lazy loading](docs/extensions/lazy-loading.md)
- [Optional Extension styles](docs/extensions/styles.md)
- [Modern and Legacy Extension variants](docs/extensions/legacy-variants.md)
- [Adaptive Extension](docs/extensions/adaptive.md)
- [Browser validation scenarios](docs/validation-scenarios.md)
- [Extension scaffold](templates/README.md)

## Core Capabilities

- Declarative activation through `data-ae-*` attributes.
- Selective eager or lazy Extension loading.
- Optional styles associated with individual Extensions.
- Idempotent DOM mounting through `$ae.update(root)`.
- Container-aware adaptive states powered by `ResizeObserver`.
- Browser history, preferences, feedback, persistence, and asynchronous content behaviors.
- ES5-compatible boot script with an ES2017+ Modern runtime.

## Build

Node.js 20 or newer is required for build tooling:

```sh
npm install
npm run build
npm run test:browser
```

Generated browser files are written to `dist/`. The distribution uses classic scripts isolated in IIFEs; it does not expose ESM named or default exports.

## Project Status

Aellux is under active development toward `0.1.0-beta.1`. Modern and forced-Legacy paths, Bootstrap coexistence, Extension loading modes, and isolated failures have repeatable browser validation scenarios; broader compatibility testing remains part of the beta work.

Track the release scope in the [0.1.0 Beta milestone](docs/milestones/0.1.0-beta.md) and delivered changes in the [changelog](CHANGELOG.md).

## License

Aellux is licensed under the [Apache License 2.0](LICENSE). Third-party dependencies remain subject to their own licenses.
