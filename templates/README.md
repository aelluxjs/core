# Aellux Extension Scaffold

Copy `aellux.ext.template.js` to `src/aellux.ext.<extension-name>.js` for a core Aellux Extension, or to `examples/components/` for an experimental extension. Templates are not included in the core build.

Set `extensionName` to the extension's kebab-case name before calling `Aellux.extRegister(extensionName, api)`. The bootstrap converts that name to the camelCase API key: `tab-group` registers `Aellux.tabGroup`. Use `Aellux.attr(extensionName)` for the extension's primary attribute, when applicable. Initialize any constants exposed by the API before registering it.

- `init` is synchronous: it registers DOM handlers and sets up extension-wide services without returning a Promise. Load asynchronous dependencies separately; DOM mounting and content loading may remain asynchronous.
- `destroy` releases extension-wide listeners, observers, and other resources.
- `mountDOM` maps selectors to `mount` and `unmount` handlers consumed by the orchestrator.
- `mountElement` sets up matching elements; repeated calls must not duplicate listeners or resources.
- `unmountElement` releases resources associated with an element.

For extensions without element behavior, remove `attr`, `mountDOM`, the DOM handlers, and their DOM registration. Keep `extensionName`, `Aellux.extRegister`, `init`, `destroy`, the IIFE, and the Apache 2.0 license identifier. Use ES2017-compatible syntax and register public APIs through `Aellux.extRegister`, without ESM exports.

Call `Aellux.ext("<extension-name>")` after `Aellux.init({ mode: "basic" })` when a core extension should be loaded individually. To include it in the full core bundle, also add its loader to `src/aellux.full.esm.js`. Experimental components require a separate script tag and registration; they do not belong to the core bundle.
