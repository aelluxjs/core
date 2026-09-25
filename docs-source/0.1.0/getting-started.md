# Getting Started

## Requirements

Node.js 20 or newer is required to build the project. The browser runtime has separate compatibility requirements described in [Modern and Legacy runtimes](runtime/modern-legacy.md).

```sh
npm install
npm run build
```

Core sources live in `src/`, build tooling in `scripts/`, experimental components in `examples/components/`, and generated browser files in `dist/`.

## Full Mode

Full mode loads the orchestrator and the complete core Extension bundle:

```html
<script src="./dist/aellux.js"></script>
<script>
  Aellux.init({ mode: "full" });
</script>
```

The full bundle is a runtime loaded by the Aellux boot script; it is not a standalone entry point.

## Basic Mode

Basic mode loads the orchestrator and only the Extensions registered by the page:

```html
<script src="./dist/aellux.js"></script>
<script>
  $ae.ext("preferences");
  $ae.ext("adaptive", { loadStyle: true });
  $ae.init({ mode: "basic" });
</script>
```

Use `aellux.min.js` to select the matching minified runtime and Extension files.

## Distribution

The browser distribution consists of classic scripts isolated in IIFEs. It does not expose ESM named or default exports. The source file `src/aellux.full.esm.js` is only the bundler entry used to generate `aellux.full.js` and `aellux.full.min.js`.

Serve the repository over HTTP to run `index.htm` and the examples.
