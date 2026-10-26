# CSP and Extension Trust

Content Security Policy (CSP) is set by the application serving the page. Review that policy against every aellux.js runtime and Extension asset the page uses. The notes below describe the current loading behavior; they are not a tested CSP compatibility profile.

## Script and stylesheet sources

The boot script adds a `<script src>` for the selected `basic` or `full` runtime, including its Legacy fallback when needed. In `basic` mode, the orchestrator also adds a `<script src>` for each registered Extension when it is needed. `loadWhen` delays that request until a matching element is found; it does not bypass CSP. Full incorporates the eleven Bundled Extensions, including Overflow Marquee, Scrollbox and Scrollbox Snap. Optional Extensions (Ajax Href, Dialog, PWA and Viewport) remain separate scripts loaded on demand. Separately registered third-party Extensions can also require their own files. See [Known Limits & Risks](../runtime/known-limits-and-risks.md#modular-loading) for the shared delivery boundaries.

Allow the actual runtime and Extension script origins in the page's `script-src` policy. A same-origin deployment may use `script-src 'self'` for these external files; a cross-origin Extension requires its specific origin to be allowed by the application's policy. Account for the Modern, Legacy, and minified artifact URLs that the page can request. A browser that blocks a script with CSP cannot initialize the corresponding runtime or Extension.

If an Extension has `loadStyle: true`, the orchestrator derives a `.css` URL from its script URL. If `loadStyle` is a string, it uses that URL directly. It adds a `<link rel="stylesheet">`, so the stylesheet origin must be allowed by `style-src`. A blocked Extension stylesheet is reported as a load warning and the JavaScript Extension may continue without its intended presentation.

In Basic mode, the boot script inserts one inline `<style>` for global weak defaults. A policy such as `style-src 'self'` can block it. In Full mode, these defaults and all generated Extension CSS are in the external `aellux.full.css` or `aellux.full.min.css`; the boot inserts one `<link data-ae-full-style>` and no global inline style block. Anchor, Scrollbox and Overflow Marquee do not insert their own inline stylesheets. Individual Extension CSS requested in Basic is also external.

The loader does not attach a CSP nonce to generated elements. Runtime inline style mutations and host-page initialization scripts still require assessment against the application's policy; loading Full's external stylesheet alone does not establish a complete restrictive CSP profile.

## Subresource integrity

`build:core` calculates SHA-384 integrity values from the final JavaScript and CSS files. It embeds only hashes for unminified assets in `aellux.js`, and only hashes for minified assets in `aellux.min.js`, including their Modern and Legacy variants. The boot script applies the matching `integrity` and `crossorigin="anonymous"` attributes to the orchestrator or `full` bundle and the shared Full stylesheet it loads. The orchestrator applies the generated values to separately loaded Core Extension scripts and stylesheets when their URLs point to the matching files beside the boot script. In `full` mode, bundled Extensions are part of the `full` runtime file, so that file's integrity value covers their code. The boot script itself cannot contain its own integrity value; applications can set one on their initial `<script src=".../aellux.js">` tag.


For a third-party Extension, declare the expected hashes with `$ae.ext()`:

```js
$ae.ext("./extensions/aellux.ext.example.js", {
  builds: ["modern", "legacy"],
  loadStyle: true,
  integrity: {
    modern: "sha384-...",
    modernMin: "sha384-...",
    legacy: "sha384-...",
    legacyMin: "sha384-...",
    style: "sha384-..."
  },
  crossOrigin: "anonymous"
});
```

Replace each placeholder with the hash of the exact published file. The loader selects `modern`, `modernMin`, `legacy`, or `legacyMin` from the script URL it actually requests. `style` applies to the optional stylesheet URL. A string `integrity` value can be used when the Extension always loads the same script bytes; it does not cover CSS. Missing entries do not add SRI to third-party files. `crossOrigin` is optional and defaults to `anonymous` when an integrity value is applied; an explicit value is also applied without integrity. Set `$ae.init({ crossOrigin: "use-credentials" })` to override the `crossorigin` value for the runtime and all Extension assets; an Extension's own `crossOrigin` takes precedence. Cross-origin assets with SRI require CORS support from the asset server. A changed file or wrong hash is rejected by the browser. SRI does not replace CSP source rules or make trusted code safe.

## URLs and trust boundary

`$ae.ext("name")` resolves a file relative to the aellux.js boot script. `$ae.ext("./extensions/aellux.ext.example.js")` uses a supplied URL; declarative `link[rel="aelluxjs-ext"]` registrations can also supply URLs. A custom `loadStyle` URL is resolved by the browser relative to the document. Review the final URLs, including any derived Legacy, minified, or CSS variant, before adding their origins to CSP.

Treat an Extension as application code. Once its script loads, it runs in the page's JavaScript context and can use the DOM and available browser APIs. `AelluxJs.extAttach()` registers its API; it does not sandbox the script or grant restricted permissions. Only register third-party Extensions from sources you trust, review the code and dependencies you distribute, and keep the asset URLs under application control. Avoid building registration URLs from untrusted page or user input. CSP limits where resources can be loaded from; it does not make allowed Extension code safe.

An Extension may load additional scripts, styles, images, fonts, or network data. Its author should document those dependencies; the application must evaluate their origins and the relevant CSP directives, such as `connect-src` for requests. This page does not claim that arbitrary third-party Extensions work under a given policy.

See [registration](registration.md), [declarative loading](declarative-loading.md), [optional styles](styles.md), and [third-party authoring](authoring.md) for the corresponding loading contracts.
