# Focus Extension

**Distribution:** Bundled Extension. **Stability:** Not stable.

`focus` is an official **Bundled Extension** included in the `full` runtime. Basic requires explicit registration.

Focus consumes already routed commands from [Input](input.md). It does not import or poll physical adapters. The existing native focus history, Next behavior and State Navigation integration below remain available without Input.

## Logical contexts and synchronization

Context `1` exists by default and synchronizes bidirectionally with native DOM focus. Every current target receives `ae--focus-playerN`, including `ae--focus-player1` for conventional interfaces. Multiple context classes can coexist on one element. Contexts above 1 remain logical and never call native `.focus()`.

```js
const focus = $ae.ext.focus;
focus.createContext(2, { scope: document.getElementById("panel") });
focus.setFocus(2, "inventory");
focus.getContext(2); // immutable snapshot: { focusId, element, scope, syncDOM }
focus.updateContext(1, { syncDOM: false }); // optional independent logical context 1
focus.destroyContext(2);
```

IDs are positive safe integers. Duplicate/invalid creation or invalid targets return `false`. `setFocus(id, null)` clears a logical target. Context 1 cannot be destroyed independently; `updateContext` may change its scope/synchronization. A context cannot focus outside its scope, on a disabled/hidden/inert target or in a detached tree. Detached scope contexts are removed; invalid current elements lose their class and reference. Context 1, history and all classes are released on Extension destruction. Only context 1 may synchronize with the DOM.

Navigation uses eligible controls in DOM order within the nearest active scope, bounded by the configured context container. Left/up move backward; right/down forward; edges do not wrap. With native synchronization, keyboard navigation stays native. Gamepad navigation can move native focus 1. Independent contexts also accept semantic navigation/confirm commands. Directional spatial geometry and independent screen-reader focus are not provided.

## Contextual shortcuts

```html
<section id="panel" data-ae-focus-scope>
  <button id="inventory" data-ae-shortcut="keyboard:KeyI; gamepad:north">
    Inventory <kbd data-ae-shortcut-hint aria-hidden="true"></kbd>
  </button>
</section>
```

The nearest `data-ae-focus-scope`, dialog or `aria-modal="true"` ancestor bounds resolution. Descendants in another isolated scope are excluded; active modal dialogs prevent contexts outside them from executing commands. The currently focused element wins first. Other candidates are sorted by DOM edge distance through their nearest common ancestor, then descending `data-ae-shortcut-priority`, then DOM order. Ancestors and descendant component actions participate in the same search. Only one eligible action executes per press. Native disabled controls, disabled fieldsets, `aria-disabled`, hidden/collapsed/inert ancestors and detached targets are excluded.

Physical source and code must match; modifiers match exactly. Shortcuts ignore repeat/release/move phases. Text entry, composition, already prevented events, native Tab, system Meta commands and essential browser/editing combinations retain native processing. Other declared Ctrl/Alt combinations are supported. A keyboard shortcut on a native button prevents the subsequent native default activation after executing, so Enter/Space do not activate twice.

The default action is the native control's `.click()`, which reuses Present triggers, tabs and application handlers. `data-ae-shortcut-action="pop|unpop|dismiss"` optionally targets a mounted Present by `data-ae-shortcut-target="id"`; Focus requests Present operations through the shared `comm` mediator; Present owns their implementation. A hidden Present can be the target of a visible action, while the shortcut owner itself must remain eligible. Other components register named actions with `registerShortcutAction(name, (element, command) => handled, { signal })`, which returns a remover. Returning `false` leaves the command unconsumed.

`eligibleShortcuts(focusId, command?)` returns descriptors in resolution order, allowing presentation/integration code to read Focus's eligibility decision without implementing another resolver. `BeforeShortcut` can veto an action; `Shortcut` reports execution. Their detail is `{ command, action }`. `FocusChange` reports `{ focusId, element, previous }`; `FocusContextDestroy` reports `{ focusId }`.

## Native focus history

`data-ae-focus="next"` adds `enterkeyhint="next"` to text-entry inputs, textareas and editable elements when `enterkeyhint` is absent. An explicit hint is preserved. Pressing Enter on a mounted element moves focus to the next connected, visible, enabled focusable control in document order. If there is no next control, Enter keeps its usual behavior. This also applies when a mobile keyboard sends Enter for its Next or confirmation key.

```html
<label>Name <input id="name" data-ae-focus="next"></label>
<label>Email <input id="email" data-ae-focus="next" type="email"></label>
<button type="submit">Continue</button>
```

Register Focus before initializing Basic:

```js
$ae.ext("focus");
$ae.init({ mode: "basic" });
```

The Extension observes `focusin`, capture-phase `focus` and `blur` on the document, and `focus` and `blur` on the window. A blur preserves the last valid element target; repeated notifications for the same element do not create duplicate history entries. Focus changes are recorded in a bounded, in-memory history. Call `AelluxJs.ext.focus.restoreLastFocus()` to focus the previous connected, visible target. It returns `true` if focus moved and `false` when no valid target remains. Hidden, inert, disabled and detached targets are skipped.

```js
const restored = $ae.ext.focus.restoreLastFocus();
```

When Present dispatches `AelluxJsDismissFocusLost` or `AelluxJsUnpopFocusLost` after hiding a region containing the active element, Focus attempts to restore the previous valid target from its history. Ordinary blur events do not trigger automatic restoration.

For a focused input, textarea, select, editable element or element explicitly declaring `data-ae-focus`, a non-empty `id` lets Focus emit `AelluxJsPushState` with `detail: { key: "ae-focus", value: element.id }`. Ordinary buttons and links can enter local focus history without creating navigation snapshots unless explicitly declared. State Navigation records eligible IDs in the hash as `ae-focus={elementid}` and dispatches `AelluxJsSnapshotRestore` to restore a matching connected, visible, eligible element. Elements without an ID still enter local history for `restoreLastFocus()`, but do not push a state. Without State Navigation, the command remains available to another consumer.

With the default hash navigation setting, recorded focus changes also change the hash. Set `useHash: false` in the Core options if that URL behavior is unwanted. Local focus history remains in memory and does not survive a page reload. Unmount removes an `enterkeyhint` generated by Focus while preserving a value originally declared by the application.

The Extension does not trap focus or announce navigation changes. Applications remain responsible for suitable focus order and accessible controls. A `change` event alone does not move focus, so changing a value and clicking another control retains the user's chosen target.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Navigation | Known Limit | <span class="large">Enter navigation scans eligible controls in document order, rather than sorting positive tabindex values. It is not a focus trap or a complete Shadow DOM navigation model.</span> | <span class="large">Keep a meaningful native document/tab order and supply any required modal focus policy.</span> |
| Restoration | Known Limit | <span class="large">Local history holds at most 100 entries and does not survive reload. Disabled, hidden, inert, disconnected or unmeasurable targets are skipped; focus() may still fail.</span> | <span class="large">Check restoreLastFocus() and provide a valid fallback when no previous target can receive focus.</span> |
| Other handlers | Potential Risk | <span class="large">Application key handlers, validation and rerendering can change the next target or move focus again. A next declaration consumes eligible Enter navigation, including on editable content.</span> | <span class="large">Coordinate Enter behavior and retain submission or multiline editing where needed.</span> |
| Coverage | Validation Gap | <span class="large">Desktop tests check hints, Enter navigation and history restoration. Real mobile Next keys, IME workflows and screen-reader navigation require direct validation.</span> | <span class="large">Test the actual keyboard and assistive-technology combinations used by the form.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/dist/aellux.ext.focus.js), [focus.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/focus.spec.mjs).
