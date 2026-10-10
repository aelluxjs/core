# Focus Extension

Register `focus` separately with `AelluxJs.ext("focus")`. It is not included in the `full` bundle.

`data-ae-focus="next"` adds `enterkeyhint="next"` to text-entry inputs, textareas and editable elements when `enterkeyhint` is absent. An explicit hint is preserved. It changes the mobile keyboard's Enter key label, not the focus order or Enter key behavior.

The Extension observes `focusin`, capture-phase `focus` and `blur` on the document, and `focus` and `blur` on the window. A blur preserves the last valid element target; repeated notifications for the same element do not create duplicate history entries. Focus changes are recorded in a bounded, in-memory history. Call `AelluxJs.ext.focus.restoreLastFocus()` to focus the previous connected, visible target. It returns `true` if focus moved and `false` when no valid target remains. Hidden, inert, disabled and detached targets are skipped.

When `state-navigation` is initialized, each focus change also pushes its token into the `ae-focus` snapshot field. A `SnapshotRestore` event restores that target if it remains valid. This works within the current document lifetime; focus tokens do not survive a page reload. With the default hash navigation setting, focus changes also change the hash. Set `useHash: false` in the Core options if that URL behavior is unwanted.

The Extension does not trap focus or announce navigation changes. Applications remain responsible for suitable focus order and accessible controls.
