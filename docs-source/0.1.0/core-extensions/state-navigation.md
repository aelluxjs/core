# State Navigation Extension

`state-navigation` manages snapshots through the current window's browser history and, by default, its URL hash. It is included in the `full` runtime. In `basic` mode, register it with `$ae.ext("state-navigation")`.

## Accessibility profile

- **Capabilities:** structure and state; browser-history and application integration.
- **Owned state:** the Aellux namespace in `history.state`, the snapshot registry, title updates and navigation events.
- **Consumer responsibility:** code replacing page content must manage focus, preserve document structure and announce navigation results when needed.
- **Limitation:** parent-page and iframe coordination is outside the validated 0.1.0 scope.

```js
const navigation = await $ae.wait("state-navigation");
navigation.setState("tab", "details", "Details");
```

`setState(key, value, title, silent)` updates a snapshot entry. With `silent: true`, it replaces the current history entry; otherwise it pushes a new entry. `globalSnapshot` exposes the current snapshot, and `updateBaseTitle(title)` changes the title suffix used for later updates.

The Extension dispatches `AelluxJsSnapshotChange` after writing a new state and `AelluxJsSnapshotRestore` after reading a state from history or the hash. Event `detail` contains `snapshot`, `removeSnapshot`, and `popState`. For a `popstate` restoration, `popState` is the history entry that was read; it is `undefined` for a hash-only restoration or a snapshot change. The snapshot and document title are updated before `AelluxJsSnapshotRestore` is dispatched. The current implementation reads `useHash` from the top-level `$ae.options.useHash` setting. With `useHash: false`, restoring a history entry whose snapshot is `null` clears the current snapshot.

Dispatch `AelluxJsPushAjaxReplace` with `detail: { url, selectors }` to record the current and target URLs in browser history. Each entry stores `ajaxReplace: { url, selectors }`; the target entry has `snapshot: null`. The optional `ajaxHref` Extension can use this history metadata when available. It is not part of the `full` runtime's bundled Extension list. Dispatch `AelluxJsUpdateBaseTitle` with `detail: { title }` to update the base document title. Malformed event details produce a navigation warning.

## Iframe compatibility pending

The scenario where this Extension runs inside an iframe while the parent page also uses it has not been tested. The current test coverage does not verify iframe history traversal, hash behavior, or synchronization of state between the iframe and parent page. Iframe compatibility remains unverified until those scenarios are tested and any required parent-frame communication is implemented.
