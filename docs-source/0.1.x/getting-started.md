# Getting Started

## Requirements

Node.js 20 or newer is required to build the project. The browser runtime has separate compatibility requirements described in [Modern and Legacy runtimes](runtime/modern-legacy.md) and the [browser support baseline](runtime/browser-support.md).

```sh
npm install
npm run build
```

Core sources live in `src/`, build tooling in `scripts/`, browser validation pages in `tests/browser/`, and generated browser files in `dist/`.

## Full Mode

Full mode makes the supported Core Extensions available through the boot script and the Full runtime:

```html
<script src="./dist/aellux.js"></script>
<script>
  AelluxJs.init({ mode: "full" });
</script>
```

The Full runtime is loaded by the aellux.js boot script. Its **Bundled Extensions** are Adaptive, Anchor, Overflow Marquee, Feedback, Focus, Point, Preference, Present, Scrollbox, Scrollbox Snap and State Navigation. Preference and State Navigation initialize at startup; the remaining implementations initialize when matching markup is mounted, without separate script requests.

**Optional Extensions** (Ajax Href, Dialog, PWA and Viewport) are registered but excluded from the Full JavaScript bundle. Mounting `a[data-ae-ajax-href]`, `<dialog>`, `[data-ae-pwa]` or `[data-ae-viewport]` loads the corresponding signed script using the official metadata embedded in the boot script. Modern/Legacy and normal/minified variants follow boot selection. The Dialog Legacy Extension contains its own polyfill and CSS. PWA keeps its reusable Service Worker as a separate application-managed artifact and adds no shared styles. Bundled and Optional describe delivery in Full, rather than maturity or stability.

Full automatically loads `aellux.full.css` (or `.min.css` with the minified boot) beside the runtime, using the configured base path. Deploy this stylesheet with the JavaScript artifacts. It includes the global defaults and all Core Extension CSS.

## Basic Mode

Basic mode loads the orchestrator with no Extension registrations. Declare each Extension through `$ae.ext(...)` or `<link rel="aelluxjs-ext">`. Markup attributes alone do not register or load Extensions. For example, register Scrollbox with its stylesheet and an explicit lazy selector:

```html
<script src="./dist/aellux.js"></script>
<script>
  $ae.ext("scrollbox", { loadWhen: "[data-ae-scrollbox]", loadStyle: true });
  $ae.init({ mode: "basic" });
</script>
```

`$ae.ext(name)` registers an Extension for eager loading during mounting. Supply `loadWhen` to load it only when your selector matches, or `load: false` to defer it until an explicit `$ae.wait(name)`. Registrations can be made before initialization or before a later mount. `$ae.wait(name)` requires an existing registration.

State Navigation has no HTML selector. Register it explicitly when history integration is needed:

```js
$ae.ext("state-navigation", { load: false });
$ae.on("Ready", async () => {
  await $ae.wait("state-navigation");
});
$ae.init({ mode: "basic" });
```

Basic Extension styles remain opt-in with `{ loadStyle: true }`. Selected Extensions can declare and load their own required Extension dependencies; see [Extension dependencies](extensions/registration.md#extension-dependencies).

Use `aellux.min.js` to select the matching minified runtime and Extension files.

## Distribution

The boot, runtimes, and Extensions are classic scripts isolated in IIFEs. The separate `aellux.esm.js` and `aellux.esm.min.js` module entries export the shared Core API as their default. They do not replace the browser boot script, which starts the runtime through `$ae.init()`:

```js
import AelluxJs from "@aelluxjs/core";
console.log(AelluxJs.attr("scrollbox"));
```

The source file `src/aellux.full.js` is the bundler entry used to generate `aellux.full.js` and `aellux.full.min.js`.

Serve the repository over HTTP to run the browser validation pages linked from `tests/index.htm`.
