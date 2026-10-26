# PWA

**Distribution:** Optional Extension. **Stability:** Not stable.

PWA is an official, optional Extension for page-side installation, installation guidance and explicit Service Worker registration. Its Modern and Legacy implementations are **external and lazy**, including in Full mode. No PWA implementation, guide styles or worker handlers are incorporated into Core, Orchestrator, Full JavaScript or Full CSS. Full knows only the signed official entry and the `[data-ae-pwa]` selector. A page without a declaration or explicit load does not download PWA, attach its listeners, create UI or register a worker.

## Loading and installation

Full recognizes this explicit declaration, including dynamically inserted elements followed by `$ae.mount(element)`:

```html
<!-- In the document head; provide the application-owned manifest file. -->
<link rel="manifest" href="./manifest.webmanifest">
<button type="button" data-ae-pwa="install">Install App</button>
<script src="./dist/aellux.js"></script>
<script>$ae.init({ mode: "full" });</script>
```

Basic also registers PWA automatically for lazy loading. Explicit registration can customize that policy:

```js
$ae.ext("pwa", { loadWhen: "[data-ae-pwa]" });
$ae.init({ mode: "basic" });
```

To use the API without declarative controls, explicitly load it with `await $ae.wait("pwa")` after runtime initialization. Load it **before** wiring a native installation control: awaiting a lazy load inside a click can lose transient user activation. Once initialized, call either API directly from the user gesture:

```js
$ae.ext.pwa.install();
$ae(button).pwa.install(); // Mounted data-ae-pwa control
```

Both share one implementation. Declarative controls use native `click` only, including Enter and Space on a button; Point is unnecessary. Repeated mounting does not duplicate listeners. Prefer a native `<button type="button">`.

`install(options)` returns a Promise with `{ outcome, status }`. Outcomes include `accepted`, `dismissed`, `manual`, `custom`, `unknown` and `unavailable`. Native acceptance does not confirm installation. A captured `beforeinstallprompt` is consumed once; `prompt()` runs synchronously before application events or asynchronous work. Concurrent native requests share the result. An `appinstalled` event or positive standalone signal confirms the observed installed/running state.

An event emitted **before this lazy Extension loads may be missed**. There is no early bootstrap listener. Prompt availability and eligibility are browser decisions. There is no synthetic native installation prompt.

## State and fallback

```js
$ae.ext.pwa.status();
// {
//   installed: null, installMethod: "unknown", canPrompt: false,
//   platform: "unknown", browser: "firefox", serviceWorker: "unregistered"
// }
```

`installed` is `true` for an observed installation, `(display-mode: standalone)` or `navigator.standalone`. Otherwise it is `null`: a normal browser tab cannot establish that the app is absent from the device. These signals describe this execution context, not an inventory of installed applications. `installMethod` is `native`, `manual`, `unknown` or `unavailable`. `canPrompt` reports whether a usable event is held. `serviceWorker` is independent: `unavailable`, `unregistered`, `registering`, `registered`, `waiting` or `error`. It describes registrations managed by this Extension instance, not all origin registrations.

Manual instructions currently require a recognizable Safari iOS/iPadOS user agent, including the desktop-style iPad user agent with touch capability. Embedded browsers and uncertain identities stay `unknown`. Other browsers may offer installation through their own UI; absence of `beforeinstallprompt` does not prove manual instructions apply. UA detection is a conservative heuristic and can be spoofed. The Safari instructions are based on [Apple's Home Screen procedure](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios). Automated tests simulate iOS identities; physical iPhone/iPad installation has not been validated by this suite.

```js
$ae.ext.pwa.install({ fallback: "default" }); // Default, recognized manual environment only
$ae.ext.pwa.install({ fallback: "none" });    // State/events, no built-in guide
$ae.ext.pwa.install({ fallback: context => renderMyInstallUI(context) });
```

`context` contains `{ status, element, manifest, manifestURL }`. `manifestURL` reads the first native manifest link when its `href` is nonempty, or is `null` when that declaration is absent or empty, without fetching it or delaying the native prompt. Optional `manifest` data supplied by the developer is forwarded to custom renderers; this does not create the browser's manifest link or replace its file. A custom fallback may explain unknown environments; the default does not guess instructions. Installed/unavailable contexts return without presenting guidance.

## Default guide and customization

The default guide loads Dialog only when actually requested, then mounts a native `<dialog>` through the existing controller lifecycle. Dialog supplies Legacy compatibility when necessary. The native modal supplies focus handling, Escape and a close button; no PWA stylesheet or global CSS is installed. It never opens on initialization. The title names the dialog, and the close button receives initial focus. Destroy removes an open guide and its pending presentation is invalidated.

English and Brazilian Portuguese defaults are provided. The document language, then navigator language, is used unless `language` is supplied. Configure initialization defaults or override individual calls:

```js
$ae.init({ mode: "full", extensions: { pwa: {
  language: "pt-BR",
  texts: {
    title: "Instale nosso aplicativo",
    intro: "Siga estas etapas:",
    close: "Fechar",
    steps: ["Abra Compartilhar.", "Escolha Adicionar à Tela de Início.", "Confirme."]
  }
} } });
```

`template(context)` replaces the guide content and returns a DOM node; it receives `texts` as well as the fallback context. Supply your own headings, text, icons and ordered instructions. A labeled close button remains available, and the dialog receives the configured accessible title. For complete rendering control, use a `fallback` function instead; provide accessible names, keyboard operation and appropriate focus handling in your UI. Custom strings are rendered as text, never interpreted as HTML.

```js
$ae.ext.pwa.install({ template: ({ texts }) => {
  const content = document.createElement("section");
  const heading = document.createElement("h2");
  heading.textContent = texts.title;
  content.appendChild(heading);
  // Add application-owned icons and steps here.
  return content;
} });
```

## Semantic events

Subscribe through `$ae.on(name, handler)` or `AelluxJs.eventName(name)`. All names use the existing normalization contract. Events bubble from an initiating element or are dispatched on `document`. Every `detail` includes a fresh `status` snapshot.

| Name | Meaning / additional detail |
| --- | --- |
| `PwaInstallAvailable` | Captured native prompt |
| `PwaInstallRequested` | Installation requested |
| `PwaInstallAccepted` | Native choice accepted; `outcome` |
| `PwaInstallDismissed` | Native choice dismissed; `outcome` |
| `PwaInstallManual` | Known manual environment; fallback context |
| `PwaInstalled` | Positive installed or standalone signal observed |
| `PwaWorkerRegistered` | Registration completed; `registration` |
| `PwaUpdateAvailable` | Replacement worker waiting; `registration`, `worker` |
| `PwaUpdateComplete` | Managed active worker acquired control; `registration` |
| `PwaError` | Failure; `operation` (`install`, `register`, `update`), `error` |

Availability, choice and worker events do not depend on the built-in UI. Repeated installed events and notifications for the same waiting worker are suppressed. Native `prompt()` runs before `PwaInstallRequested` so application event handlers cannot consume transient activation before the browser prompt.

## Explicit worker registration and updates

```js
const pwa = await $ae.wait("pwa");
const registration = await pwa.register({ script: "./sw.js", scope: "./" });
await pwa.checkUpdate();
$ae.on("PwaUpdateAvailable", event => {
  // Offer an application-owned update button.
  updateButton.hidden = false;
});
updateButton.addEventListener("click", () => pwa.applyUpdate());
```

`register()` requires a nonempty `script` URL on the page origin, without credentials or fragment. Optional `scope` must share that origin and contain no query or fragment; `type` accepts `classic` (native default) or `module`, and `updateViaCache` accepts `all`, `imports` or `none`. The reusable worker below is classic and must use `classic`. The browser enforces HTTPS (with trusted local development exceptions), script MIME type, CSP and directory scope limits, including `Service-Worker-Allowed`. Relative URLs resolve against `document.baseURI`; the application need not control `/`.

Identical concurrent or repeated registrations are shared within the instance. One registration is observed at a time; registering another script/scope switches the observed registration. `checkUpdate()` calls the native `registration.update()` and returns that registration, or `null` if none is managed. Existing waiting replacements are also detected after registration.

No automatic `skipWaiting`, `clients.claim()` or reload occurs. `applyUpdate()` returns `false` if there is no waiting worker; otherwise it posts `{ type: "AELLUX_PWA_SKIP_WAITING" }` and returns `true`. The supplied reusable worker understands that explicit command. Other workers need their own handler. Applications decide if and when to reload after `PwaUpdateComplete`. Destroy releases observers and controls but **does not unregister workers, delete persistent caches or uninstall the app**.

## Application manifest: purpose, declaration and checks

The Web App Manifest supplies the browser with application metadata used for installation and launch: identity, name, icons, starting URL, display mode and navigation scope. Provide an application-owned JSON file and reference it from the head of every entry page that offers installation:

```html
<head>
  <link rel="manifest" href="./manifest.webmanifest">
</head>
```

A PWA button or registered Service Worker does not supply these metadata. For the browser's installable-PWA flow, configure the manifest and the members required by the target browser; a link alone does not establish eligibility or guarantee `beforeinstallprompt`. Some browsers also allow adding ordinary sites to the Home Screen, so a missing manifest does not prove that every installation route is unavailable. See [MDN: installation requirements and the role of the manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable#installability).

For the available properties and their meanings, use the [MDN manifest members reference](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference). Start with `id`, `name`/`short_name`, `icons`, `start_url`, `scope` and `display`, then add application-specific fields such as colors or shortcuts. Check each property's browser compatibility. The [W3C Web Application Manifest specification](https://www.w3.org/TR/appmanifest/) defines the format and processing rules; the [MDN manifest guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest#deploying_a_manifest) explains linking and serving the file. Serve it as JSON, preferably with `Content-Type: application/manifest+json`. Relative resource paths, such as icon `src` values, resolve against the manifest URL; consult each member's own URL resolution rules. The manifest's `scope` describes application navigation and is distinct from the Service Worker's registration scope.

When PWA initializes or `install()` is requested with `environment: "development"`, it checks for a native `link` whose `rel` contains the `manifest` token and whose `href` is nonempty. A missing link or missing/blank `href` records `WARN_CONFIGURATION_STRUCTURE` (`2028`), with `extension: "pwa"`, the relevant element/attribute, reason and corrective suggestion. Repeated equivalent warnings use the existing diagnostic deduplication. A manifest added later is recognized on the next installation request. Production performs no diagnostic presence scan, and pages that never load PWA gain no check or listener.

This check examines the declaration only: it does not fetch the manifest, parse its JSON, verify icons, validate its members or establish installability. Use browser developer tools to inspect the actual manifest response and installation issues. The warning does not block mounting, installation APIs or independent offline support. Aellux never generates a manifest in the browser.

## Minimal `sw.js` with `importScripts()`

Host the principal worker in the application's origin, for example `/my-app/sw.js`, and deploy the reusable script beside the other Aellux assets:

```js
// /my-app/sw.js — classic worker, executed outside the page
self.AelluxPWAConfig = { name: "example", version: "1.0.0" };
importScripts("./vendor/aellux.pwa.sw.min.js");
```

Register that local entry from the page after explicitly loading PWA:

```js
const pwa = await $ae.wait("pwa");
await pwa.register({ script: "./sw.js", scope: "./", type: "classic" });
```

`importScripts()` synchronously executes the shared script inside the same classic worker. Assign `self.AelluxPWAConfig` **before** importing so that the shared implementation reads your settings while registering its handlers. The relative import above resolves against the principal worker URL, giving `/my-app/vendor/aellux.pwa.sw.min.js`; Aellux cache/offline configuration URLs instead resolve against the registration scope. This API is named `importScripts()` (plural), works in workers, and cannot be used with `type: "module"`. See the [external `importScripts()` reference](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts).

This minimum registers worker lifecycle handlers but enables no precache, managed request caching or offline fallback. Add an explicit `offline` page and `cache` policies as in the complete example below to enable those capabilities. The manifest link remains in the page; `sw.js` does not replace it. The principal worker must be same-origin; only the imported reusable script may use a CDN, subject to the applicable security policies. Serve the scripts with a JavaScript MIME type over HTTPS or a trusted local development origin.

## Complete local example

Host these application files in the same directory (for example `/my-app/`):

```html
<!-- index.html -->
<html lang="en">
<head>
  <link rel="manifest" href="./manifest.webmanifest">
  <meta name="theme-color" content="#2455aa">
</head>
<body>
  <button type="button" data-ae-pwa="install">Install App</button>
  <button type="button" id="update" hidden>Apply update</button>
  <script src="./vendor/aellux.js"></script>
  <script>
    $ae.on("Ready", async () => {
      const pwa = await $ae.wait("pwa");
      try {
        await pwa.register({ script: "./sw.js", scope: "./" });
      } catch (error) { console.error("Offline support unavailable", error); }
    }, { once: true });
    $ae.on("PwaUpdateAvailable", () => { document.querySelector("#update").hidden = false; });
    document.querySelector("#update").addEventListener("click", () => $ae.ext.pwa.applyUpdate());
    $ae.init({ mode: "full" });
  </script>
</body>
</html>
```

```json
{
  "id": "./",
  "name": "Example Application",
  "short_name": "Example",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2455aa",
  "icons": [
    { "src": "./icons/app-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icons/app-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Provide your actual icon files and manifest. PWA does not generate a manifest in the browser or replace the platform manifest. Service Worker support is independent of installation support; installation can work without this worker or any worker registered by the Extension.

```js
// /my-app/sw.js, same-origin principal worker
self.AelluxPWAConfig = {
  name: "example",
  version: "1.0.0",
  offline: "./offline.html",
  cache: {
    precache: ["./offline.html", "./assets/app.css"],
    navigation: "network-first",
    assets: "cache-first",
    paths: ["./assets/"]
  }
};
importScripts("./vendor/aellux.pwa.sw.min.js");
```

```html
<!-- offline.html: self-contained, public fallback -->
<!doctype html><html lang="en"><meta charset="utf-8">
<title>Offline</title><h1>You are offline</h1><p>Reconnect to continue.</p></html>
```

Copy the generated worker to `vendor/`, or import the version-pinned CDN file from your same-origin principal worker:

```js
importScripts("https://cdn.jsdelivr.net/npm/@aelluxjs/core@0.1.0-beta.10/dist/aellux.pwa.sw.min.js");
```

This is a deployment URL for the package version; it requires that version to be published. Configure your CSP, import policies, response headers and availability for your chosen CDN. Never pass a CDN URL as the principal `register({ script })`. Local hosting avoids this external import dependency. The worker has no Aellux runtime or DOM dependency.

## Cache policies and safety

Without configuration no requests are intercepted or cached. All configured URLs resolve relative to the registration scope and must remain on its origin and within its path. `offline` is automatically added to precache. Precache fetches omit credentials and installation fails for unsuccessful, redirected or unsafe responses. Caches include the application name, registration scope and version; activation deletes only old versions with that exact ownership prefix. Keep `name` stable and change `version` for deployments. Separate applications need distinct scope/name identities.

`cache.navigation` explicitly selects the navigation policy; `cache.assets` applies only to precached URLs and `cache.paths`. A path ending in `/` matches descendants; other paths match exactly, and a path containing a query requires an exact URL match. Supported policies:

| Policy | Behavior |
| --- | --- |
| `network-first` | Network, then matching cache on network failure |
| `cache-first` | Cache, otherwise fetch and store an eligible response |
| `stale-while-revalidate` | Cache if present; refresh in the worker lifetime |
| `network-only` | No managed interception/cache, including offline fallback |

Navigation failures can use the explicitly configured public offline page. HTTP error responses remain network responses. No retry loops are used. Non-GET, cross-origin, out-of-scope, authorization-bearing, no-store and common sensitive paths (`api`, `auth`, `login`, `logout`, `account`, `admin`) are excluded. Credentialed requests, range requests and request no-cache/private directives are excluded from cache. Responses with `private`, `no-store`, `no-cache`, Set-Cookie, identity-varying headers, opaque type or redirects are not stored. Cross-origin and opaque caching are deliberately unsupported in this initial release.

Normal browser navigation usually carries credentials, so its contents are **not cached by default**, even with `navigation: "network-first"`; an explicit public offline fallback still works. `cache.allowCredentials: true` permits caching configured credentialed requests and must be used only for routes your application guarantees are public. Header and sensitive-path checks remain active. Do not enable it for personalized pages. For public programmatic assets, use `fetch(url, { credentials: "omit" })` when appropriate. The worker cannot reliably infer server-side authentication from a normal cookie-bearing request; this conservative default avoids that ambiguity. Cache Storage is subject to browser quotas and eviction; failed runtime cache writes do not discard successful network responses.

## Distribution and validation scope

The build emits `aellux.ext.pwa.js`, `.min.js`, `.legacy.js`, `.legacy.min.js`, plus the independent `aellux.pwa.sw.js` and `.min.js`, with source maps. Extension SRI is in the official catalog; worker hashes are included in generated asset integrity metadata. The worker is never an Extension dependency. Legacy degrades to unavailable capabilities without installation/worker polyfills.

Automated coverage uses Chromium, Firefox and WebKit for loading, native click/keyboard, controlled prompt events, simulated iOS guidance, real local worker registration and configured offline behavior. It does not claim that headless desktop engines reproduce actual OS installation or physical iOS/iPadOS Share menus. Native prompt semantics follow the [WICG installation contract](https://wicg.github.io/manifest-incubations/); worker scope/cache behavior follows the [Service Workers specification](https://www.w3.org/TR/service-workers/).

## Known Limits & Risks

See [Core Known Limits & Risks](../../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Independent capabilities | Known Limit | <span style="white-space: normal !important;">Installation, worker registration and offline availability are separate. Manifest presence diagnostics do not fetch/validate the file or establish installability.</span> | <span style="white-space: normal !important;">Validate the manifest and test each capability independently.</span> |
| Prompt timing | Known Limit | <span style="white-space: normal !important;">beforeinstallprompt may be unavailable or missed before lazy initialization. A held prompt is consumed once and requires user activation; accepted does not confirm installation.</span> | <span style="white-space: normal !important;">Initialize before wiring installation UI and invoke install() directly from the gesture.</span> |
| Detection | Known Limit | <span style="white-space: normal !important;">Manual Safari guidance uses conservative UA/touch heuristics. Unknown is not proof of absence; standalone signals describe this execution context.</span> | <span style="white-space: normal !important;">Provide suitable guidance without claiming an installed-app inventory.</span> |
| Worker origin | Known Limit | <span style="white-space: normal !important;">Registration needs an available secure-context worker API and a same-origin principal script. Scope restrictions apply; the reusable importScripts worker is classic, although register() also accepts module.</span> | <span style="white-space: normal !important;">Use a same-origin classic principal for the reusable worker and configure before importing.</span> |
| Offline policy | Known Limit | <span style="white-space: normal !important;">The reusable worker intercepts nothing by default. Configured cache paths stay within origin/scope; cross-origin, opaque and sensitive responses are excluded. HTTP errors are not offline network failures.</span> | <span style="white-space: normal !important;">Configure public precache/fallback routes and test offline navigation explicitly.</span> |
| Private data | Potential Risk | <span style="white-space: normal !important;">allowCredentials opts configured credentialed requests into caching. Header/path checks cannot prove a response is public or infer every authentication scheme.</span> | <span style="white-space: normal !important;">Keep the conservative default unless routes are guaranteed public; never cache personalized content.</span> |
| Availability/storage | Potential Risk | <span style="white-space: normal !important;">Network/CDN import failures, unsafe precache responses, quotas and eviction can prevent worker installation or remove offline resources.</span> | <span style="white-space: normal !important;">Control assets, version deployments and test network/storage failure paths.</span> |
| Updates/lifecycle | Known Limit | <span style="white-space: normal !important;">applyUpdate() messages a waiting worker; the worker must implement that protocol. It does not reload the page. Destroy releases page observers without unregistering persistent workers.</span> | <span style="white-space: normal !important;">Coordinate activation, application state and worker/cache ownership.</span> |
| Coverage | Validation Gap | <span style="white-space: normal !important;">Unit tests and local workers cover policies and controlled prompts; simulated iOS identities and desktop headless engines do not validate physical iOS/Android installation UI or OS lifecycle.</span> | <span style="white-space: normal !important;">Prioritize real-device install/update/offline tests and quota/eviction scenarios.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.pwa.js), [pwa.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/pwa.spec.mjs), [Reusable worker](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.pwa.sw.js), [Page unit checks](https://github.com/aelluxjs/core/blob/update/beta.10/tests/unit/pwa.test.mjs), [Worker unit checks](https://github.com/aelluxjs/core/blob/update/beta.10/tests/unit/pwa-sw.test.mjs).
