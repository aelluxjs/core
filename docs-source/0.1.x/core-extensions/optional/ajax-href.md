# Ajax Href Extension

**Distribution:** Optional Extension. **Stability:** Not stable.

`ajax-href` replaces selected page regions with matching elements from a same-origin HTML response. This Optional Extension is excluded from the Full bundle. Full registers it for lazy loading when mounting `a[data-ae-ajax-href]`; Basic requires explicit registration. With the selector registered, dynamically inserted links activate it through `$ae.mount(container)`.

```html
<a href="./next.htm" data-ae-ajax-href>Next page (title and body)</a>
<a href="./next.htm" data-ae-ajax-href="title,#content">Next page</a>
<main id="content">Current content</main>
```

In Basic, declare its activation selector explicitly:

```js
$ae.ext("ajax-href", { loadWhen: "a[data-ae-ajax-href]" });
$ae.init({ mode: "basic" });
```

The attribute holds comma-separated CSS selectors, preserving commas inside functions such as `:is()` and quoted attribute values. A bare, empty, or whitespace-only `data-ae-ajax-href` defaults to `title,body`: it replaces the title and the entire body while preserving the rest of the current head. Pages using this default should share compatible head resources. For each selector, the first current element is unmounted, replaced by the first matching response element, and mounted again. Invalid selectors and missing current/response regions record diagnostic `2027` with a correction suggestion. When no current region matches, `load()` returns `null` without starting a request. Missing response regions preserve current content. Modified clicks, download links, fragment-only links, other browsing targets, `data-no-ajax`, and cross-origin destinations retain native navigation.

After activation, `$ae.ext.ajaxHref.load(url, selectors, options)` provides the same replacement operation; `selectors` can also be an array. `{ ignoreHistory: true }` suppresses `PushAjaxReplace`. Otherwise the event is dispatched once, after the response arrives and the first matching region passes its unmount veto, immediately before that replacement. A failed request, a response with no matching regions, or vetoes on every region preserve the current URL and history. State Navigation handles that event and restores Ajax replacements through `SnapshotRestore`; it is already initialized in Full. In Basic mode, call `await $ae.wait("state-navigation")` if history integration is needed.

Canceling `BeforeUnmount` for a current region preserves that DOM element and its mounted behaviors; Ajax Href skips its replacement and continues with other selected regions. Canceling `BeforeMount` for a replacement leaves its imported HTML in place without mounting its behaviors. These vetoes affect the individual lifecycle pass; they do not undo history or replacements already completed for other regions.

The Extension dispatches `AjaxHrefStart`, `AjaxHrefLoaded`, `AjaxHrefError`, and `AjaxHrefComplete`, and `AjaxHrefDropOrigin` when a click targets another origin. Starting a request aborts the previous request when `AbortController` is available. Destroying the Extension removes its click and snapshot listeners and aborts the pending request.

## Accessibility profile

Use native anchors with useful `href` destinations. Consumers must manage focus and announce changed content as appropriate; this Extension does not move focus or create a live region. The optional Feedback Extension receives busy and progress updates when available.

## Known Limits & Risks

See [Core Known Limits & Risks](../../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Replacement scope | Known Limit | <span class="large">Each selector replaces its first current/response match sequentially. Missing regions and unmount vetoes preserve that region; prior replacements are not rolled back.</span> | <span class="large">Use distinct, non-overlapping regions and design for partial replacement rather than an atomic page transaction.</span> |
| Resources/state | Known Limit | <span class="large">An empty attribute replaces title and body, preserving other current head resources. Replaced nodes lose component identity/state; mounting does not migrate arbitrary framework state.</span> | <span class="large">Share compatible head resources and explicitly preserve or reconstruct application state.</span> |
| Request order | Known Limit | <span class="large">New requests abort old fetches when supported and identity guards reject superseded response work. Regions already replaced before a new request began are not undone.</span> | <span class="large">Await load() when dependent work needs completion and coordinate rapid navigation.</span> |
| Errors/events | Potential Risk | <span class="large">Network, parsing or mounting failures can leave partial work. AjaxHrefComplete is also emitted for failed/superseded attempts; it is not a success signal.</span> | <span class="large">Handle load() rejection and the lifecycle, including missing-region diagnostics.</span> |
| Trust | Known Limit | <span class="large">Same-origin click filtering and HTML diagnostics do not sanitize imported content. Programmatic URLs, endpoints and response HTML remain application trust decisions.</span> | <span class="large">Validate endpoints/content and review CSP and URL handling before insertion.</span> |
| Focus/history | Potential Risk | <span class="large">Replacement can remove the active control. History requires State Navigation and does not restore arbitrary frontend state or announce content.</span> | <span class="large">Coordinate focus/announcements, mount/unmount and any external router.</span> |
| Coverage | Validation Gap | <span class="large">Tests cover superseded responses, partial vetoes, missing regions and retained head resources. Third-party teardown races and assistive-technology navigation need integration checks.</span> | <span class="large">Exercise rapid navigation with real components and failure responses.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.ajax-href.js), [ajax-href.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/ajax-href.spec.mjs), [extension-composition.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/extension-composition.spec.mjs).
