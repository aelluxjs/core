# UXM Scaffold

Copy `aellux.uxm.template.js` to `src/aellux.uxm.<module-name>.js` for a core UXM, or to `examples/components/` for an experimental component. Templates are not included in the core build.

Set `moduleName` to the module's kebab-case name before calling `Aellux.uxmRegister(moduleName, api)`. The bootstrap converts that name to the camelCase API key: `tab-group` registers `Aellux.tabGroup`. Use `Aellux.attr(moduleName)` for the module's primary attribute, when applicable. Initialize any constants exposed by the API before registering it.

- `init` registers DOM handlers and sets up module-wide services.
- `destroy` releases module-wide listeners, observers, and other resources.
- `mountDOM` maps selectors to `update` and `unmount` handlers consumed by the orchestrator.
- `updateElement` sets up or updates matching elements; repeated calls must not duplicate listeners or resources.
- `unmountElement` releases resources associated with an element.

For modules without element behavior, remove `attr`, `mountDOM`, the DOM handlers, and their DOM registration. Keep `moduleName`, `Aellux.uxmRegister`, `init`, `destroy`, the IIFE, and the Apache 2.0 license identifier. Use ES2017-compatible syntax and register public APIs through `Aellux.uxmRegister`, without ESM exports.

Add a core UXM's kebab-case name to `Aellux.init({ load: [...] })` when it should be initialized. To include it in the full core bundle, also add a loader to `src/aellux.full.esm.js`. Experimental components require a separate script tag before initialization; they do not belong to the core bundle.
