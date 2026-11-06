# Shared communication

`$ae.comm` is a small synchronous mediator available in the ES5 boot, before `init()`. The same instance survives runtime startup and is shared by Basic and Full. Extensions consume named data contracts rather than another Extension's API object, implementation import or mounted controller. Application code may still call public Extension APIs directly.

## Commands and queries

```js
// Provider registers in init().
const remove = $ae.comm.handle("inventory.selection", ({ panel }) => {
  return selectedItem(panel);
}, { owner: "inventory" });

// Consumer receives data, never the provider's API.
const response = $ae.comm.request("inventory.selection", { panel });
if (response.handled) renderSelection(response.value);
```

`handle(name, handler, { owner, signal }?)` returns an idempotent remover. There is exactly one handler per command/query. Duplicate registration reports diagnostic **1130** and throws without replacing the original. `has(name)` probes availability without loading or initializing an Extension.

`request(name, payload)` returns `{ handled, value }` immediately. An absent provider returns `{ handled: false, value: undefined }`; a provider returning `null`, `false` or `undefined` still produces `handled: true`. Each contract defines whether `false` means refusal or an ordinary value. Missing providers do not trigger fallback behavior or implicit loading.

Synchronous return values and exceptions stay synchronous. An asynchronous operation returns its Promise in `value`; callers await or catch it explicitly. Lookup and handler invocation are atomic within the current JavaScript call. Removal does not cancel an operation already running; its owning Extension retains responsibility for cancellation and stale-completion guards.

```js
const response = $ae.comm.request("present.pop", { element });
if (response.handled) await response.value;
```

## Notifications

`on(name, handler, { owner, signal, priority }?)` registers a notification listener and returns its remover. `emit(name, payload)` synchronously notifies all active listeners and returns their count. Higher priorities run first; ties use registration order. Removal during delivery takes immediate effect; listeners added during delivery wait for the next emission. Synchronous exceptions and rejected asynchronous listeners report diagnostic **1131**, allowing other listeners to run. Asynchronous listeners are not awaited.

```js
const remove = $ae.comm.on("focus.changed", ({ focusId, element }) => {
  updateOverlay(focusId, element);
}, { owner: "overlay", priority: 10 });
```

## Ownership and lifecycle

Use the Extension's kebab-case name as `owner`. The orchestrator removes that owner's handlers and listeners after destruction, including when teardown throws, and after a failed initialization so retry cannot duplicate registrations. Official Extensions also remove their records in their own `destroy()` methods. `removeOwner(owner)` releases all records for one owner; `clear()` releases the entire mediator and is called by Core destruction. An `AbortSignal` offers independent cleanup, and already-aborted signals do not register anything. Object owners are compared by identity; application code owns their cleanup.

The boot does not know contract names, players, components or devices. Dependency registration/loading remains the orchestrator's job: an Extension may await a declared dependency's readiness, then use its communication contract. Public DOM events remain available for observation, cancellation and external integrations. Existing DOM event contracts continue to work; the mediator does not automatically duplicate or translate them.

## Official contracts

| Contract | Provider | Payload / result |
| --- | --- | --- |
| `focus.command` | Focus | Immutable routed command; synchronous boolean indicating consumption. Input resolves routing before this request. |
| `focus.context` | Focus | `{ focusId }`; context snapshot or `null`. |
| `input.mount-token` | Input | `{ element }`; opaque mount identity or `null`. Remount replaces the token. |
| `present.pop`, `present.unpop`, `present.dismiss` | Present | `{ element }`; existing operation result, including its Promise when applicable. |
| `present.toggle` | Present | `{ element, goto }`; existing toggle result. |
| `present.show` | Present | `{ group, member }`; selects the member ID through the existing group operation. |
| `present.selection` | Present | `{ group }`; selected element or `null`. |
| `present.pop-next` | Present | `{ group, preparation? }`; Promise resolving to the reserved/presented member or `null`. |
| `feedback.prepare` | Feedback | `{ boundary, feedback, element }`; applies feedback to a reserved member before Present's `BeforePop`. |
| `anchor.placement` | Anchor | `{ action, owner, element, pairs?, target?, placement? }`; actions `mount`, `unmount`, `measure`, `place`, `invisible`, `dispose`. Measurements return geometry data, not a placement API. |
| `scrollbox-snap.next`, `scrollbox-snap.previous` | Scrollbox Snap | `{ element }`; boolean. |
| `scrollbox-snap.goto` | Scrollbox Snap | `{ element, index, behavior }`; boolean. |
| `dialog.show`, `dialog.showModal`, `dialog.close` | Dialog | `{ element, args? }`; existing native/Legacy-compatible operation result. |

For `present.pop-next`, `preparation` is `{ contract, payload }`. Present reserves a member and requests that contract with the payload plus `element` before preflight/motion. An unavailable or refused preparer rejects the operation and releases its reservation. No preparer callback or Extension API crosses the boundary. Public application `present.popNext(group, prepareCallback)` remains supported.

Notifications: `focus.changed` carries `{ focusId, element, previous }`; `focus.context-destroyed` carries `{ focusId }`; `extension.destroyed` carries `{ extension }`. Input uses these notifications for hint/router cleanup. DOM `FocusChange`, `FocusContextDestroy` and `ExtensionDestroy` remain public.

## Migration and boundaries

The provisional `$ae.inputCommands` channel is replaced by `comm.request("focus.command", command)`. Scrollbox's internal `registerSnapController` / `unregisterSnapController` hooks are removed; Snap owns and releases its communication handlers. Public Scrollbox `next`, `previous`, `goto`, and public Anchor placement maps remain available to applications. Internal consumers use mediator requests.

Instrumentation that previously replaced a public Extension method to observe internal calls should observe the communication contract or public DOM lifecycle events instead. Providers bind their own implementation when registering a contract, independently of later changes to their public API object.

Contracts are local JavaScript communication, not an RPC serialization or security boundary. Payloads may contain DOM elements and opaque identity tokens, but should not expose Extension APIs or implementation callbacks. Use immutable command data where routing must remain fixed. The mediator performs no buffering, replay, scheduling, player assignment or automatic retries.

## Distribution cost

The mediator replaces the provisional Input-only channel. Boot/ESM contain the shared helper; Full contains the provider/consumer contracts and lifecycle cleanup. Minified artifacts are measured in raw / gzip level 9 bytes. Limits are in KiB. These figures measure distribution size, not runtime latency or memory.

| Artifact | Measured raw / gzip bytes | Previous limits | Current limits |
| --- | --- | --- | --- |
| aellux.min.js | 54,044 / 18,630 | 51.5 / 18 | 53.25 / 18.75 |
| aellux.esm.min.js | 29,509 / 10,087 | 27.25 / 9.5 | 29 / 10 |
| aellux.full.min.js | 227,223 / 70,646 | 223 / 69 | 223 / 69 |
| aellux.full.legacy.min.js | 565,251 / 166,993 | 550 / 163 | 553.5 / 164 |
| aellux.ext.dialog.min.js | 988 / 537 | 1 / 0.5 | 1.125 / 0.625 |
| aellux.ext.dialog.legacy.min.js | 16,205 / 5,509 | 14.5 / 5 | 16.25 / 5.5 |
| aellux.ext.anchor.min.js | 16,450 / 5,931 | 16 / 6 | 16.5 / 6 |
| aellux.ext.anchor.legacy.min.js | 24,337 / 8,470 | 23.5 / 8.25 | 24.25 / 8.5 |
| aellux.ext.overflow-marquee.min.js | 14,082 / 5,001 | 13.5 / 5 | 14.25 / 5.25 |
| aellux.ext.overflow-marquee.legacy.min.js | 26,111 / 8,235 | 25.5 / 8 | 26 / 8.25 |
| aellux.ext.feedback.min.js | 4,918 / 2,117 | 4.625 / 2 | 5 / 2.25 |
| aellux.ext.present.min.js | 50,512 / 16,532 | 49 / 16 | 50 / 16.5 |
| aellux.ext.present.legacy.min.js | 69,899 / 20,981 | 66.5 / 20.25 | 69 / 21 |

Only affected limits change. Full Modern retains its limits; the Optional Dialog/Marquee scripts remain separate downloads. Shared communication does not introduce third-party libraries, polling or a second runtime scheduler.
