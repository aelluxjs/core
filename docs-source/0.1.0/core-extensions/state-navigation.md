# State Navigation Extension

`state-navigation` manages snapshots through the current window's browser history and, by default, its URL hash. It is included in the `full` runtime. In `basic` mode, register it with `$ae.ext("state-navigation")`.

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

The Extension dispatches `AelluxJsSnapshotChange` after writing a new state and `AelluxJsSnapshotRestore` after reading a state from history or the hash. Event `detail` contains `snapshot`, `removeSnapshot`, and `popState`. For a `popstate` restoration, `popState` is the history entry that was read; it is `undefined` for a hash-only restoration or a snapshot change. The snapshot and document title are updated before `AelluxJsSnapshotRestore` is dispatched. The current implementation reads `useHash` from the top-level `$ae.options.useHash` setting. With `useHash: false`, restoring a history entry whose snapshot is `null` clears the current snapshot.

Dispatch `AelluxJsPushAjaxReplace` with `detail: { url, selectors }` to record the current and target URLs in browser history. Each entry stores `ajaxReplace: { url, selectors }`; the target entry has `snapshot: null`. The optional `ajaxHref` Extension can use this history metadata when available. It is not part of the `full` runtime's bundled Extension list. Dispatch `AelluxJsUpdateBaseTitle` with `detail: { title }` to update the base document title. Malformed event details produce a navigation warning.

## Parent page and iframe

A browser fixture now runs this Extension in both a parent page and an iframe. Its test confirms that after a parent state followed by an iframe `ajaxReplace` state, the first Back fires `popstate` and `AelluxJsSnapshotRestore` only in the iframe; the next Back fires them only in the parent. The test passes in Chromium, Firefox and WebKit. Run `npx playwright test tests/browser/state-navigation-iframe.spec.mjs` to repeat it, or start `node tests/browser/server.mjs` and open `/tests/browser/state-navigation-iframe-parent.html` to use the buttons manually.

The parent and iframe do not need an owner marker to route `popstate`: each instance reads the history state of its own window. Applications that need to share data between the two documents can implement that exchange separately.
