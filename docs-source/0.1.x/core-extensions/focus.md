# Focus Extension

**Distribution:** Bundled Extension. **Stability:** Not stable.

Stability describes implementation maturity and validation, not API compatibility. Only the [minimal initialization and declarative activation/mounting contract](../runtime/compatibility-commitment.md) is protected during `0.1.x`.

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

Directional navigation uses visual rectangles within the nearest active scope, bounded by the configured context container. It never transfers to another logical context or wraps at an edge. Independent screen-reader focus is not provided.

## Spatial navigation and input policy

`data-ae-focus-nav` applies from the nearest declared ancestor (or current target itself); nested declarations override outer policy. It is read for every directional command, so inserted regions and attribute changes require no geometry-cache invalidation. In Basic, declare both Focus and Input; Full activates Focus on focus declarations, including `data-ae-focus-nav`. Enable physical adapters with `data-ae-inputs`.

| Value | Directional behavior |
| --- | --- |
| `auto` (default) | Gamepad and contexts without DOM synchronization navigate spatially. Keyboard in synchronized context 1 stays native. Other sources in synchronized contexts require an explicit spatial policy. |
| `spatial` | Also enables keyboard directions and application-supplied normalized directions in this region. Native editing and widget keys remain protected. |
| `native` | Preserves keyboard directions, including independent contexts. Gamepad and other sources retain their automatic policy; this does not disable gamepad. |
| `none` | Disables automatic directional navigation for every source in the region. Explicit contextual shortcuts retain their own contract. |

Tab and Shift+Tab always retain browser navigation. Focus does not alter `tabindex`, implement roving tabindex or supply `aria-activedescendant`. IME, already prevented commands, text-entry/select/contenteditable keys, directional commands in ARIA composites and arrow-dependent native/custom controls remain under their native/component keyboard owner. Directional commands with modifiers are not consumed by spatial navigation. Enter/Space activation and scoped shortcuts keep their existing behavior.

**Traditional website:** keep the default policy, preserving native Tab, arrows and scrolling.

```html
<main data-ae-inputs="point keyboard">
  <a href="/library/">Library</a>
  <input aria-label="Search">
</main>
```

**Keyboard spatial menu:** use semantic navigation with native buttons/links; ARIA menus/tablists/grids still require their own APG keyboard behavior.

```html
<main data-ae-inputs="point keyboard">
  <nav aria-label="Sections" data-ae-focus-scope data-ae-focus-nav="spatial">
    <button>Home</button><button>Library</button><button>Documentation</button>
    <section data-ae-focus-nav="native"><input aria-label="Filter"></section>
  </nav>
</main>
```

**Gamepad interface:** gamepad remains opt-in in Input; D-pad and primary-stick directions feed the same Focus geometry. Keyboard remains native under `auto`, including when gamepad can move context 1's DOM focus.

```html
<main data-ae-inputs="point keyboard gamepad">
  <section id="inventoryPanel" data-ae-focus-scope>
    <button id="sword">Sword</button><button id="shield">Shield</button>
  </section>
</main>
```

**Two independent focuses:** after Input and Focus initialize and markup is mounted, bind the application's chosen device session to context 2. Session IDs come from `input.devices()`; they are not browser gamepad indices. Release application-owned routing when its player session ends.

```js
const input = $ae.ext.input;
const focus = $ae.ext.focus;
focus.createContext(2, { scope: document.getElementById("inventoryPanel") });
focus.setFocus(1, "sword");
focus.setFocus(2, "sword"); // player classes coexist
const secondDeviceId = input.devices()[1]?.deviceId;
const removeRoute = input.registerRouter(command =>
  secondDeviceId && command.deviceId === secondDeviceId ? 2 : undefined);
// Player 2 directions move only context 2; document.activeElement belongs to 1.
// Call removeRoute() on application player teardown or reassignment.
```

### Geometry, boundaries and scrolling

Focus measures eligible targets with `getBoundingClientRect()` synchronously for each command. It filters disconnected, disabled, inert, hidden/collapsed/content-hidden and transparent ancestors, effectively closed Present regions and invalid or zero-area rectangles. Native focusable elements, contenteditable and explicit `tabindex` controls, including `tabindex="-1"` logical/programmatic targets, participate without changing their tabindex. Visibility is not restricted to the global viewport.

Candidates must advance their rectangle center in the requested direction. Perpendicular interval overlap takes priority; within each alignment class, the score is primary edge gap plus three times the perpendicular gap plus 0.1 times perpendicular center offset. Primary center advance then breaks ties, followed by candidate DOM order. This uses edges and overlap rather than center distance alone. In an irregular grid, an aligned target can beat a closer diagonal target. A context without a target enters from the requested visual edge; an invalid/no candidate leaves the current focus unchanged and returns unhandled.

The nearest `data-ae-focus-scope`, dialog or modal region bounds candidates; nested isolated scopes are excluded rather than entered automatically. A navigation-policy region inside that boundary narrows navigation further, even without `data-ae-focus-scope`. Context programmatic scope remains the outer limit. Inactive/hidden modal declarations do not block navigation; active modals isolate contexts outside them.

All candidate measurements finish before changing focus/classes/scroll. No persistent geometry cache or continuous measurement loop is needed; responsive layout, CSS transforms, scroll and insertion are measured on the next synchronous command. Commands retain their synchronous `comm` result; no scheduler wait is inserted.

Selected targets are revealed with native nearest scrolling. Inside a region, only scrollable ancestors through its navigation boundary are adjusted; a document-wide scope uses native `scrollIntoView`. Logical-only movement can scroll its region without calling `.focus()` or changing native focus. Scrollbox receives normal scroll events; Focus does not reproduce its physics or force scrolling when navigation is disabled. At an edge, an unconsumed keyboard arrow can still perform native scrolling.

The conceptual references are the experimental [CSS Spatial Navigation draft](https://www.w3.org/TR/css-nav-1/) and [WAI-ARIA APG keyboard conventions](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/). This implementation uses stable rectangle/focus/scroll APIs; it does not implement the draft's experimental browser APIs or replace APG widget behavior.

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

## Bundle cost

Measured on 2026-11-09 against the preceding checked-in artifacts, using minified bytes and gzip level 9, matching the budget checker. Full includes the shared runtime and bundled Focus implementation; these are net distribution changes, not measured runtime speed improvements. Boot/SRI and editor metadata are also regenerated. Physical Input adapters and Input's implementation are unchanged.

| Artifact | Before raw / gzip bytes | After raw / gzip bytes | Delta raw / gzip bytes | Budget raw / gzip KiB |
| --- | --- | --- | --- | --- |
| `aellux.ext.focus.min.js` | 11,574 / 4,540 | 14,417 / 5,577 | +2,843 / +1,037 | 11.5 / 4.5 -> 14.5 / 5.75 |
| `aellux.ext.focus.legacy.min.js` | 15,123 / 5,530 | 19,309 / 6,773 | +4,186 / +1,243 | 15.25 / 5.5 -> 19 / 6.875 |
| `aellux.full.min.js` | 227,227 / 70,649 | 230,048 / 71,661 | +2,821 / +1,012 | 223 / 69 -> 226 / 70.5 |
| `aellux.full.legacy.min.js` | 565,255 / 166,995 | 569,495 / 168,138 | +4,240 / +1,143 | 553.5 / 164 -> 558 / 165 |

Only these four budget entries increase to account for geometry, native-key policy and scoped reveal. Per-command work is linear in eligible controls and includes computed-style ancestor checks; profile large scopes. Fresh measurements avoid a complex invalidation cache and do not introduce continuous idle work.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Navigation | Known Limit | <span class="large">Enter navigation scans eligible controls in document order, rather than sorting positive tabindex values. It is not a focus trap or a complete Shadow DOM navigation model.</span> | <span class="large">Keep a meaningful native document/tab order and supply any required modal focus policy.</span> |
| Spatial geometry | Known Limit | <span class="large">Axis-aligned rectangles approximate transformed shapes and inline fragments. Virtualized/unrendered nodes, iframe interiors, shadow-root interiors, occlusion and complex clipping are not modeled. Beam priority may favor a distant aligned target.</span> | <span class="large">Validate irregular layouts and materialize virtualized targets. Future scoring/container strategies must preserve context ownership.</span> |
| Spatial scroll | Known Limit | <span class="large">Only native scrollable ancestors inside the navigation boundary are revealed. Transform-based scrollers, complex transformed coordinates and oversized targets have limited alignment; outer containers are not scrolled across an isolated boundary.</span> | <span class="large">Use native overflow/Scrollbox; provide application reveal behavior when needed.</span> |
| Logical players | Validation Gap | <span class="large">Simulated D-pad/stick tests validate routing and geometry, not physical console/TV hardware or multiple screen-reader cursors.</span> | <span class="large">Test physical devices and retain a visible indicator per player.</span> |
| Restoration | Known Limit | <span class="large">Local history holds at most 100 entries and does not survive reload. Disabled, hidden, inert, disconnected or unmeasurable targets are skipped; focus() may still fail.</span> | <span class="large">Check restoreLastFocus() and provide a valid fallback when no previous target can receive focus.</span> |
| Other handlers | Potential Risk | <span class="large">Application key handlers, validation and rerendering can change the next target or move focus again. A next declaration consumes eligible Enter navigation, including on editable content.</span> | <span class="large">Coordinate Enter behavior and retain submission or multiline editing where needed.</span> |
| Coverage | Validation Gap | <span class="large">Desktop tests check hints, Enter navigation and history restoration. Real mobile Next keys, IME workflows and screen-reader navigation require direct validation.</span> | <span class="large">Test the actual keyboard and assistive-technology combinations used by the form.</span> |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/release/0.1.0/src/aellux.ext.focus.js), [native Focus regressions](https://github.com/aelluxjs/core/blob/release/0.1.0/tests/browser/focus.spec.mjs), and repository coverage in `tests/unit/focus-spatial.test.mjs`, `tests/browser/focus-spatial.spec.mjs` and `tests/browser/input-focus.spec.mjs`.
