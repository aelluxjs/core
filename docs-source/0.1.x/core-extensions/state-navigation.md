# State Navigation Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

`state-navigation` manages snapshots through the current window's browser history and, by default, its URL hash. It is included in the `full` runtime. Basic requires explicit registration. `$ae.ext("state-navigation")` before initialization enables eager loading. To defer it, register with `{ load: false }` and call `await $ae.wait("state-navigation")` after runtime initialization; it has no activation selector.

## Accessibility profile

- **Capabilities:** structure and state; browser-history and application integration.
- **Owned state:** the Aellux namespace in `history.state`, the snapshot registry, title updates and navigation events.
- **Consumer responsibility:** code replacing page content must manage focus, preserve document structure and announce navigation results when needed.
- **Iframe:** each window keeps its own snapshot, history state and restoration events, including when the parent page also uses `state-navigation`.

```js
const navigation = await $ae.wait("state-navigation");
navigation.setState("tab", "details", "Details");
```

`setState(key, value, title, silent)` updates a snapshot entry. With `silent: true`, it replaces the current history entry; otherwise it pushes a new entry. `globalSnapshot` exposes the current snapshot, and `updateBaseTitle(title)` changes the title suffix used for later updates.

Other Extensions can request a state update without accessing `state-navigation` directly:

```js
$ae.dispatch("PushState", {
  detail: { key: "tab", value: "details", title: "Details" }
});
```

The `key` and `value` fields must be non-empty strings; `title` is optional. State Navigation consumes this command when loaded; malformed details produce a navigation warning without changing history. Focus uses this event contract to record the focused element's ID as `ae-focus`.

The Extension dispatches `AelluxJsSnapshotChange` after writing a new state and `AelluxJsSnapshotRestore` after reading a state from history or the hash. Event `detail` contains `snapshot`, `removeSnapshot`, and `popState`. For a `popstate` restoration, `popState` is the history entry that was read; it is `undefined` for a hash-only restoration or a snapshot change. The snapshot and document title are updated before `AelluxJsSnapshotRestore` is dispatched. The current implementation reads `useHash` from the top-level `$ae.options.useHash` setting. With `useHash: false`, restoring a history entry whose snapshot is `null` clears the current snapshot.

The event's `snapshot` and `removeSnapshot` values are copies made at dispatch time, so retaining a detail object does not expose later changes to the internal snapshot. `popState` is also copied, including its snapshot and Ajax replacement metadata.

Dispatch `AelluxJsPushAjaxReplace` to record the current and target URLs in browser history, or `AelluxJsUpdateBaseTitle` to update the base document title:

```js
$ae.dispatch("PushAjaxReplace", {
  detail: { url: "/details", selectors: ["#main"] }
});
$ae.dispatch("UpdateBaseTitle", {
  detail: { title: "Example" }
});
```

Each history entry stores `ajaxReplace: { url, selectors }`; the target entry has `snapshot: null`. The optional `ajaxHref` Extension can use this history metadata when available. It is not part of the `full` runtime's bundled Extension list. Malformed event details produce a navigation warning.

## Parent page and iframe

A browser fixture runs this Extension in `basic` mode in both a parent page and an iframe, keeping Focus out of this history-isolation test. Its test confirms that after a parent state followed by an iframe `ajaxReplace` state, the first Back fires `popstate` and `AelluxJsSnapshotRestore` only in the iframe; the next Back fires them only in the parent. The test passes in Chromium, Firefox and WebKit. Build `dist/` first, then run `npx playwright test tests/browser/state-navigation-iframe.spec.mjs` to repeat it, or start `node tests/browser/server.mjs` and open `/tests/browser/state-navigation-iframe-parent.html` to use the buttons manually.

The parent and iframe do not need an owner marker to route `popstate`: each instance reads the history state of its own window. Applications that need to share data between the two documents can implement that exchange separately.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| State model | Known Limit | <span class="large">Snapshots serialize through URLSearchParams and use history/hash, not durable application storage. Reload reconstructs hash data when enabled; it does not restore arbitrary component memory or form state.</span> | <span class="large">Store serializable navigation keys and implement application restoration separately.</span> |
| History ownership | Potential Risk | <span class="large">Only marked Aellux popstate entries are restored. Current-entry replacement merges external fields, but a newly pushed entry does not promise to copy another router state.</span> | <span class="large">Coordinate history and title ownership rather than interleaving independent writers.</span> |
| Restoration | Known Limit | <span class="large">SnapshotRestore publishes state after title/snapshot updates; it does not itself mount or render UI. Ajax replacement requires the separately loaded Ajax Href consumer.</span> | <span class="large">Load consumers before relying on commands and handle their asynchronous completion.</span> |
| Iframe scope | Known Limit | <span class="large">Each window has its own snapshot and handlers. The Extension is not a cross-origin state-sharing or message-routing layer.</span> | <span class="large">Implement explicit, origin-checked communication when parent and frame must coordinate.</span> |
| History volume | Potential Risk | <span class="large">Frequent non-silent updates create navigation entries and trigger subscribers. Browser history limits and application listener costs remain relevant.</span> | <span class="large">Use silent replacement for transient state and keep secrets out of URL hashes.</span> |
| Coverage | Validation Gap | <span class="large">Tests cover marked state, copied details and same-origin parent/iframe traversal. Reload/session recovery and coordination with cross-origin frames or independent routers need additional checks.</span> | <span class="large">Validate the intended navigation topology and refresh behavior.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.state-navigation.js), [scenarios.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scenarios.spec.mjs), [state-navigation-iframe.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/state-navigation-iframe.spec.mjs).
