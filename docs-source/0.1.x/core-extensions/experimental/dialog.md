# Dialog Extension

Dialog mounts native `<dialog>` elements without requiring `data-ae-dialog`. It exposes the standard element API through the existing Aellux controllers. It adds no animations or custom modal state.

## Loading and mounting

In Full and Basic modes, mounting a subtree containing `<dialog>` loads the compatible Experimental Dialog Extension on demand. Pages without dialogs do not request its script. Its implementation stays outside the Full bundle.

Both modes register Dialog automatically:

```html
<dialog id="example" aria-labelledby="example-title">
  <h2 id="example-title">Confirm action</h2>
  <form method="dialog"><button value="accepted">Accept</button></form>
</dialog>
<script src="./dist/aellux.js"></script>
<script>
  $ae.init({ mode: "basic" });
</script>
```

Explicit registration can customize loading. Missing dialog methods still select the Legacy runtime, but the fallback is installed only when a dialog is mounted.

Await the initial `Ready` event or an explicit mount before using controllers. With `skipGlobalMount: true`, mount the desired element or subtree yourself. Dynamic dialogs use the same lifecycle:

```js
const dialog = document.getElementById("example");
await $ae.mount(dialog);
$ae(dialog).dialog.showModal();
$ae(dialog).dialog.close("accepted");
```

Dialog mounts at priority `-1`, before ordinary priority `0` Extensions, so consumers can call its methods during their mount callbacks. Register Dialog alongside those consumers and include it in the same mount operation; a mount explicitly filtered to a consumer does not load omitted Extensions.

## Controller API

| Method | Forwarded call |
| --- | --- |
| `$ae(dialog).dialog.show()` | `dialog.show()` |
| `$ae(dialog).dialog.showModal()` | `dialog.showModal()` |
| `$ae(dialog).dialog.close()` | `dialog.close()` |
| `$ae(dialog).dialog.close(returnValue)` | `dialog.close(returnValue)` |

Methods preserve arguments, return values, receiver and exceptions. Native calls remain available. The element owns `open`, `returnValue`, focus and the `cancel` and `close` events; the Extension does not maintain a second open state. It does not add `requestClose()` or `closedby` support.

## Modern and Legacy

Modern only registers the mount map and forwards methods. It leaves native functions and `HTMLDialogElement.prototype` unchanged, and installs no Dialog listeners or CSS.

Legacy checks each element for all three methods: `show`, `showModal` and `close`. Complete native implementations are preserved even with `forceLegacy: true`. If any method is missing, the Extension registers that element with `dialog-polyfill` 0.5.6, including for partially available APIs.

The four scripts are `aellux.ext.dialog.js`, `aellux.ext.dialog.min.js`, `aellux.ext.dialog.legacy.js` and `aellux.ext.dialog.legacy.min.js`. Only the two Legacy Dialog files include the polyfill and its CSS. CSS is installed once, when fallback registration is first needed; it requires no separate stylesheet, script or CDN download. Neither the Legacy orchestrator nor Full includes this dependency.

## Lifecycle and limitations

Repeated mounts do not duplicate controllers or polyfill registrations. Unmount removes the controller namespace using the standard controller lifecycle. Destroy removes the mount map; registering and mounting Dialog again restores controllers. Native methods remain unchanged. Legacy keeps its element registrations, shared stylesheet and upstream manager for the document lifetime so other dialogs and direct element calls remain usable. Reloading the Extension reuses that shared manager.

The fallback supports `show()`, `showModal()`, `close()`, `returnValue`, Escape/cancel and `<form method="dialog">`. It cannot reproduce the native top layer. Place modal dialogs directly under `<body>` where possible because ancestor stacking contexts can obscure a polyfilled modal. Style both `dialog::backdrop` and `dialog + .backdrop` for backdrop customization. See the [upstream limitations](https://github.com/GoogleChrome/dialog-polyfill#limitations).

Consumers provide accessible names, appropriate content and usable controls. The Legacy syntax target does not establish support for untested historical browsers; see [ES5 support](../../runtime/es5-support.md). Third-party BSD-3-Clause notices ship with the Legacy Dialog artifact and in the distribution license files.
