# Ajax Href Extension

`ajax-href` replaces selected page regions with matching elements from a same-origin HTML response. This Experimental Extension is excluded from the Full bundle and loads its separate signed script in both Full and Basic when mounting `a[data-ae-ajax-href]`. Dynamically inserted links activate it through `$ae.mount(container)`.

```html
<a href="./next.htm" data-ae-ajax-href="title,#content">Next page</a>
<main id="content">Current content</main>
```

Basic registers it automatically; explicit registration can customize the activation selector:

```js
$ae.ext("ajax-href", { loadWhen: "a[data-ae-ajax-href]" });
$ae.init({ mode: "basic" });
```

The attribute holds comma-separated CSS selectors, preserving commas inside functions such as `:is()` and quoted attribute values. For each selector, the first current element is unmounted, replaced by the first matching response element, and mounted again. Invalid selectors and missing current/response regions record diagnostic `2027` with a correction suggestion. When no current region matches, `load()` returns `null` without starting a request. Missing response regions preserve current content. Modified clicks, download links, fragment-only links, other browsing targets, `data-no-ajax`, and cross-origin destinations retain native navigation.

After activation, `$ae.ext.ajaxHref.load(url, selectors, options)` provides the same replacement operation; `selectors` can also be an array. `{ ignoreHistory: true }` suppresses `PushAjaxReplace`. Otherwise the event is dispatched once, after the response arrives and the first matching region passes its unmount veto, immediately before that replacement. A failed request, a response with no matching regions, or vetoes on every region preserve the current URL and history. State Navigation handles that event and restores Ajax replacements through `SnapshotRestore`; it is already initialized in Full. In Basic mode, call `await $ae.wait("state-navigation")` if history integration is needed.

Canceling `BeforeUnmount` for a current region preserves that DOM element and its mounted behaviors; Ajax Href skips its replacement and continues with other selected regions. Canceling `BeforeMount` for a replacement leaves its imported HTML in place without mounting its behaviors. These vetoes affect the individual lifecycle pass; they do not undo history or replacements already completed for other regions.

The Extension dispatches `AjaxHrefStart`, `AjaxHrefLoaded`, `AjaxHrefError`, and `AjaxHrefComplete`, and `AjaxHrefDropOrigin` when a click targets another origin. Starting a request aborts the previous request when `AbortController` is available. Destroying the Extension removes its click and snapshot listeners and aborts the pending request.

## Accessibility profile

Use native anchors with useful `href` destinations. Consumers must manage focus and announce changed content as appropriate; this Extension does not move focus or create a live region. The optional Feedback Extension receives busy and progress updates when available.
