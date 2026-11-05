# Optional Extension Styles

Extensions may be JavaScript-only or may request a stylesheet associated with their script.

## JavaScript Only

```js
$ae.ext("example");
```

`loadStyle` defaults to `false`.

In Basic mode, request each Extension stylesheet with `{ loadStyle: true }`, or provide the CSS yourself. This applies to Adaptive, Present, Feedback, Scrollbox, Anchor and Overflow Marquee. Their JavaScript does not generate inline stylesheet blocks. Scrollbox's CSS includes snap, elastic and scrollbar rules. Unmounting elements retains the loader's stylesheet; destroying the Extension removes its individual stylesheet link.

## Full stylesheet

The build generates `aellux.full.css` and `aellux.full.min.css` from the global weak CSS and the Bundled Extension CSS generators. `init({ mode: "full" })` loads the matching file through one `<link data-ae-full-style>`, using the configured base path and SHA-384 integrity. Modern and Legacy runtimes share the same CSS; a minified boot selects the minified CSS.

The boot waits for this stylesheet before starting the Full runtime and mounting Extensions. Full does not insert the global weak inline style or inject Extension style blocks. Bundled Extensions reuse the shared stylesheet; Optional Extensions with CSS, currently Overflow Marquee, load their individual signed stylesheets on demand. Extensions remain lazy; the shared CSS is available before any of them initialize. Explicit custom stylesheet URLs still load independently. Destroying an Extension retains the shared Full stylesheet. If Full CSS fails to load, diagnostic 2004 reports it and JavaScript startup continues.

The current raw/gzip limits are maintained in `scripts/bundle-budget.config.mjs`. See [Performance and Bundle Budget](../runtime/performance.md#primitives-only-full-bundle) for measured delivery costs of the primitives-only Full bundle.

## JavaScript and CSS

Use `true` to derive the stylesheet URL from the Extension script URL:

```js
$ae.ext("example", { loadStyle: true });
```

For `aellux.ext.example.js`, the runtime derives `aellux.ext.example.css`. Query strings and fragments are preserved by the script URL handling where applicable. The example Extension and stylesheet must be supplied by the application.

The declarative equivalent is:

```html
<link rel="aelluxjs-ext" href="example" data-ae-load-style>
```

## Specific Stylesheet URL

Set `loadStyle` to a URL when the stylesheet does not follow the Extension filename convention:

```js
$ae.ext("feedback", {
  loadStyle: "./styles/feedback-theme.css"
});
```

The declarative equivalent places the URL directly in `data-ae-load-style`:

```html
<link rel="aelluxjs-ext"
      href="feedback"
      data-ae-load-style="./styles/feedback-theme.css">
```

Relative custom stylesheet URLs are resolved by the browser relative to the document URL. An empty attribute or the value `true` requests the derived stylesheet; the value `false` disables stylesheet loading.

The orchestrator waits for requested assets before initializing and mounting the Extension. A stylesheet load error is treated as non-fatal so JavaScript behavior can continue when possible.

Extensions remain responsible for declaring their own required assets.
