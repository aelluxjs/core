# Focus Extension

`focus` currently contains a lifecycle scaffold. It registers `data-ae-focus` for mounting, but its mount and unmount handlers are empty. Marking an element with this attribute does not currently change focus or keyboard behavior.

The source file is built as an individual Extension, but `focus` is not included in the `full` runtime's bundled Extension list. Registering it separately provides only the scaffold described above. Treat focus behavior as pending implementation.
