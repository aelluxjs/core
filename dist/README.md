# Aellux

Aellux is a lightweight, modular library for building better browser interfaces through declarative HTML attributes, adaptive CSS classes, and focused UX modules.

Instead of coupling interface behavior to a framework or filling markup with imperative JavaScript, Aellux lets the document describe the experience it needs. The runtime observes those declarations, loads the relevant modules, and keeps the interface synchronized with its available space and navigation state.

## Why Aellux?

Browser UX is made of several independent concerns: adapting layouts to available space, preserving interface state during navigation, remembering user preferences, loading content, and coordinating interactive components. Aellux treats each concern as a focused UX module instead of combining every behavior into a single runtime.

- **Adaptive composition** Measures containers and exposes spatial information to CSS;
- **State navigation** maintains continuity across history entries and URL changes;
- **Persistence** retains interface choices;
- additional modules can provide their own declarative behaviors. Pages load only the capabilities selected in `Aellux.options.load`.

The library is designed around three complementary layers:

- **Attributes** declare the UX behaviors requested by the document.
- **Classes** expose state that CSS can use to present those behaviors.
- **Modules** implement separate UX responsibilities behind those declarations.

This separation keeps markup readable, CSS expressive, and JavaScript focused. It also allows each UX module to evolve independently without making adaptive composition—or any other feature—the center of the entire library.

## Current Features

- Declarative activation through `data-aellux-*` attributes.
- Container-aware adaptive classes powered by `ResizeObserver`.
- Shape detection for vertical, square, and horizontal spaces.
- Configurable size classes from compact through ultrawide.
- Browser history and URL hash synchronization for interface snapshots.
- Local and session persistence helpers.
- Dynamically loaded UX modules with optional module preloading.
- Read/update layout scheduling to reduce layout thrashing.
- Native light and dark color-scheme support.

## Quick Start

### Build and distribution

Requires Node.js 20 or newer:

```sh
npm install
npm run build
```

Core sources live in `src/`, build tooling in `scripts/`, and experimental components in `examples/components/`. Only core sources are built and distributed. The flat `dist/` directory contains the ES5 bootstrap and legacy fallback, ES2017 orchestrator, individual core UXMs, and the full core bundle. All distributed JavaScript files are classic scripts isolated in IIFEs, with minified versions and source maps. `src/aellux.full.esm.js` is only a bundler entry: it generates `aellux.full.js` and `aellux.full.min.js`, not an ESM distribution. Obsolete generated artifacts are removed after a successful build. The build uses [esbuild](https://esbuild.github.io/api/) for bundling and minification; modern browser APIs are not polyfilled.

Use the [UXM scaffold](templates/README.md) to create new core modules or experimental components. Templates remain outside the build inputs.

Serve the repository over HTTP after building to use `index.htm` and the examples.

```html
<script src="./dist/aellux.js"></script>
<script>
  Aellux.init({ runtime: "orchestrator" });
</script>
```

Choose `runtime: "full"` to load the orchestrator and all core UXMs from one runtime file. Only modules listed in `load` are initialized. Orchestrator mode loads core UXMs individually. Loading `aellux.min.js` selects matching minified files. Both modes retain the legacy fallback path. Experimental example components are excluded from both distributions and are not currently activated.

The full bundle is a runtime, not a standalone bootstrap: load it through `Aellux.init({ runtime: "full" })`. Example styles remain in `examples/` and are not library runtime dependencies.

The browser distribution exposes the global `Aellux` API; it does not provide ESM named or default exports. Load it with a classic `<script>` tag.

Load the bootstrap script and initialize Aellux after it:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>My Aellux interface</title>

    <script src="./aellux.js"></script>
    <script>
      Aellux.init({
        defaultAdaptiveCSS: true
      });
    </script>
  </head>
  <body>
    <!-- Your interface -->
  </body>
</html>
```

The bootstrap automatically loads the modern classic-script runtime and the modules listed in `Aellux.options.load`.

## Adaptive Composition

Add `data-aellux-adaptive` to a container to make its composition react to the space it actually occupies:

```html
<main data-ae-adaptive>
  <!-- Adaptive content -->
</main>
```

As the container changes, Aellux applies shape classes:

- `ux-shape-vertical`
- `ux-shape-square`
- `ux-shape-horizontal`

It also applies cumulative size classes when the container has enough space:

- `ux-fits-compact`
- `ux-fits-small`
- `ux-fits-medium`
- `ux-fits-large`
- `ux-fits-wide`
- `ux-fits-ultrawide`

Because these classes belong to the container rather than the viewport, child layouts can adapt correctly wherever they are placed.

## Configuration

Pass an options object to `Aellux.init()` to override the defaults:

```js
Aellux.init({
  defaultAdaptiveCSS: true,
  useHash: true,
  load: [
    "preferences",
    "state-navigation",
    "adaptive",
    "feedback",
    "ajax-href"
  ],
  adaptiveParams: {
    minSizes: {
      compact: 0,
      small: 480,
      medium: 768,
      large: 1024,
      wide: 1280,
      ultrawide: 1600
    },
    ratioShapes: {
      vertical: 0.8,
      horizontal: 1.25
    }
  }
});
```

Options are deeply merged with the library defaults, so only the values that need to change must be provided.

## Runtime API

The global `Aellux` object provides the main integration points:

```js
Aellux.on("Ready", handler);
Aellux.off("Ready", handler);
Aellux.dispatch("UpdateDOM", { detail: {} });

Aellux.persist.local.set("key", "value");
Aellux.persist.local.get("key", "fallback");

Aellux.persist.session.set("key", "value");
Aellux.persist.session.get("key", "fallback");
```

Custom events use the `Aellux` prefix. For example, `Aellux.on("Ready", handler)` listens for `AelluxReady`.

`AelluxReady` signals that the orchestrator is initialized and available. It does not guarantee that every UX module initialized successfully or that elements have finished mounting. Module failures are reported independently and do not prevent orchestrator readiness. Use component-specific events, such as `AelluxAdaptiveUpdate`, to track individual components.

## Design Principles

- Prefer semantic, declarative HTML over imperative setup code.
- Adapt components to their own space, not only to the viewport.
- Keep behavior modular and load only the UX capabilities requested by the page.
- Build on browser standards such as custom events, `ResizeObserver`, History API, and Web Storage.
- Preserve progressive enhancement by keeping the initial HTML meaningful.

## Browser Support

The bootstrap and legacy fallback use ES5-compatible syntax. The orchestrator, individual UXMs, and full bundle target ES2017 and later (ES2017+). This is a syntax baseline, not a guarantee of support in every browser implementing ES2017.

All distributed JavaScript files are classic scripts isolated in IIFEs; ES modules are not required in the browser. Modern browser APIs are required separately and are not polyfilled. Depending on the selected UXMs, these include:

- Promises and async functions
- `ResizeObserver`, `MutationObserver`, and `IntersectionObserver`
- `fetch`, `CustomEvent`, and `requestAnimationFrame`
- `URLSearchParams`

The asynchronous-links UXM uses `AbortController` when available; without it, requests still run but cannot be canceled through that API. The bootstrap checks required runtime capabilities and selects the legacy path when those checks fail.

A legacy bootstrap path exists, but the legacy runtime is not implemented yet.

Node.js 20 or newer is required for build tooling, independently of the browser syntax baseline.

## Project Status

Aellux is under active development. The core includes preferences, state navigation, adaptive composition, feedback, and asynchronous links. Experimental components remain only in `examples/components/` and are currently inactive in the examples.

See `examples/` for development markup and experimental demonstrations.

## License

Aellux is licensed under the [Apache License 2.0](LICENSE). You may use, modify, and distribute it, including in commercial projects, subject to the license terms. The software is provided without warranties.

The distribution includes the license text and retains license identifiers in normal and minified JavaScript and adaptive CSS files. Third-party dependencies remain subject to their own licenses.
