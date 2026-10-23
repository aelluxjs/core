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

The Full runtime is loaded by the aellux.js boot script; it is not a standalone entry point. **Full means integrated availability, not physical inclusion in one file.** It incorporates Adaptive, Ajax Href, Anchor, Feedback, Focus, Point, Preference, Present, and State Navigation. Adaptive, Ajax Href, Anchor, Feedback, Focus, Point, and Present initialize when matching markup is mounted; Preference and State Navigation initialize at startup. Ajax Href uses `a[data-ae-ajax-href]`.

Full also registers Dialog, Overflow Marquee, PWA, Scrollbox and Scrollbox Snap for on-demand loading, keeping their implementations in separate distribution files. Mounting a native `<dialog>` requests the [Dialog Extension](core-extensions/dialog.md), whose Legacy script contains its own polyfill and inline CSS. `data-ae-overflow-marquee` requests its dedicated Extension, which initializes Anchor before registering its mount map. Mounting an element with `data-ae-scrollbox` requests the compatible Scrollbox script. Mounting one with both `data-ae-scrollbox` and `data-ae-scrollbox-snap` also requests Snap, which waits for Scrollbox before mounting. The Full runtime reuses official artifact metadata embedded in the boot script, so these requests do not require a separate manifest download for the current Core version. Modern or Legacy and normal or minified files follow the boot selection. PWA is entirely optional: `[data-ae-pwa]` requests its external script, and its reusable Service Worker remains a separate application-managed artifact. PWA adds no shared styles. All other generated Core Extension styles are supplied by the shared Full stylesheet. No separate registration is needed for these Core Extensions in `full` mode.

Full automatically loads `aellux.full.css` (or `.min.css` with the minified boot) beside the runtime, using the configured base path. Deploy this stylesheet with the JavaScript artifacts. It includes the global defaults and all Core Extension CSS.

## Basic Mode

Basic mode loads the orchestrator and only the Extensions registered by the page:

```html
<script src="./dist/aellux.js"></script>
<script>
  $ae.ext("preference");
  $ae.ext("feedback");
  $ae.init({ mode: "basic" });
</script>
```

Use `aellux.min.js` to select the matching minified runtime and Extension files.

## Distribution

The boot, runtimes, and Extensions are classic scripts isolated in IIFEs. The separate `aellux.esm.js` and `aellux.esm.min.js` module entries export the shared Core API as their default. They do not replace the browser boot script, which starts the runtime through `$ae.init()`:

```js
import AelluxJs from "@aelluxjs/core";
console.log(AelluxJs.attr("scrollbox"));
```

The source file `src/aellux.full.js` is the bundler entry used to generate `aellux.full.js` and `aellux.full.min.js`.

Serve the repository over HTTP to run the browser validation pages linked from `tests/index.htm`.
