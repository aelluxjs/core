# Ajax Href Extension

`ajax-href` replaces selected page regions with matching elements from a same-origin HTML response. Full includes its implementation and initializes it only when mounting `a[data-ae-ajax-href]`. Dynamically inserted links activate it through `$ae.mount(container)`.

```html
<a href="./next.htm" data-ae-ajax-href="title,#content">Next page</a>
<main id="content">Current content</main>
```

In Basic mode, register the official Extension before initialization:

```js
$ae.ext("ajax-href", { loadWhen: "a[data-ae-ajax-href]" });
$ae.init({ mode: "basic" });
```

The attribute holds comma-separated CSS selectors. For each selector, the first current element is unmounted, replaced by the first matching response element, and mounted again. Missing elements are skipped. Modified clicks, download links, fragment-only links, other browsing targets, `data-no-ajax`, and cross-origin destinations retain native navigation.

After activation, `$ae.ext.ajaxHref.load(url, selectors, options)` provides the same replacement operation; `selectors` can also be an array. `{ ignoreHistory: true }` suppresses `PushAjaxReplace`. State Navigation handles that event and restores Ajax replacements through `SnapshotRestore`; it is already initialized in Full. In Basic mode, register `state-navigation` separately if history integration is needed.

The Extension dispatches `AjaxHrefStart`, `AjaxHrefLoaded`, `AjaxHrefError`, and `AjaxHrefComplete`, and `AjaxHrefDropOrigin` when a click targets another origin. Starting a request aborts the previous request when `AbortController` is available. Destroying the Extension removes its click and snapshot listeners and aborts the pending request.

## Accessibility profile

Use native anchors with useful `href` destinations. Consumers must manage focus and announce changed content as appropriate; this Extension does not move focus or create a live region. The optional Feedback Extension receives busy and progress updates when available.
