# State Navigation Extension

`state-navigation` manages snapshots through the current window's browser history and, by default, its URL hash. It is included in the `full` runtime. In `basic` mode, register it with `$ae.ext("state-navigation")`.

```js
const navigation = await $ae.wait("state-navigation");
navigation.setState("tab", "details", "Details");
```

`setState(key, value, title, silent)` updates a snapshot entry. With `silent: true`, it replaces the current history entry; otherwise it pushes a new entry. The helper methods `tabOpen(tabGroupId, tabId, title)`, `flowStep(flowId, stepId, title)`, and `formFocus(formId, focusId, title)` call the same state update. `globalSnapshot` exposes the current snapshot, and `updateBaseTitle(title)` changes the title suffix used for later updates.

The Extension dispatches `AelluxJsSnapshotChange` after writing a new state and `AelluxJsSnapshotRestore` after reading a state from history or the hash. Event `detail` contains `snapshot` and `removeSnapshot`. It writes the current document title from the snapshot title and the base title captured at initialization. The current implementation reads `useHash` from the top-level `$ae.options.useHash` setting.

`ajaxHref(url, selectors)` integrates with the optional `ajaxHref` Extension when it is available; it is not part of the `full` runtime's bundled Extension list.

## Iframe compatibility pending

The scenario where this Extension runs inside an iframe while the parent page also uses it has not been tested. The current test coverage does not verify iframe history traversal, hash behavior, or synchronization of state between the iframe and parent page. Iframe compatibility remains unverified until those scenarios are tested and any required parent-frame communication is implemented.
