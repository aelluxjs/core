# Modern and Legacy Extension Variants

The compatibility contract uses explicit `builds` metadata. Core polyfills are bundled once in the Legacy orchestrator, while each Extension publishes only its behavior and any additional dependencies it owns.

The compatibility model recognizes three possible Extension profiles:

- Modern-only;
- Legacy-only; or
- Modern and Legacy variants.

Declare the available artifacts when registering an Extension:

```js
$ae.ext("example", { builds: ["modern", "legacy"] });
```

- A Modern-only Extension uses `builds: ["modern"]`. A Legacy runtime reports diagnostic `1106` and does not request it.
- A Legacy-only Extension uses `builds: ["legacy"]`. Modern browsers can execute this ES5 artifact, so Aellux selects the Legacy filename in either runtime.
- An Extension with both builds uses `builds: ["modern", "legacy"]`, and Aellux selects the matching artifact.
- Omitting `builds` defaults to both and promises that both files exist.

## Filename Convention

- Modern: `aellux.ext.<name>.js`
- Legacy: `aellux.ext.<name>.legacy.js`
- Minified Legacy: `aellux.ext.<name>.legacy.min.js`

The Legacy runtime follows the same convention with `aellux.orchestrator.legacy.js` for `basic` mode and `aellux.full.legacy.js` for `full` mode.

The same metadata can be declared with `data-ae-builds="modern legacy"` on `link[rel="aellux-ext"]`.

Both variants must register the same Extension name and expose equivalent public APIs. Optional styles are independent of the JavaScript target and are shared unless an Extension explicitly manages another strategy.

See the [third-party authoring contract](authoring.md) for build instructions and the Legacy polyfill boundary.
