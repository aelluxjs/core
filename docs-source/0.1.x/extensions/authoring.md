# Authoring aellux.js Extensions

An aellux.js Extension is a classic browser script that attaches one focused behavior through `aelluxJs.extAttach()`. Core and third-party Extensions follow the same naming, lifecycle, compatibility, and cleanup rules.

## Primitives and Full distribution

The Full bundle automatically includes all Core primitives: reusable building blocks for components and new behaviors. It does not bundle every Extension available in Core. Optional navigation and environment Extensions, such as Ajax Href and PWA, remain separate signed scripts loaded on demand. Preference is a bundled primitive and initializes automatically in Full.

Dialog and Progress remain Optional Extensions because their main additional value is Legacy compatibility. Modern browsers already provide native dialog, progress and meter controls; the separate Legacy artifacts supply the missing behavior and required fallback styles without adding that compatibility code to Full.

Being an official Core Extension does not imply bundle membership. Full registers the optional Core Extensions for lazy loading, while Basic requires explicit registration for every Extension. Bundled primitives may also initialize lazily when matching markup is mounted; inclusion in the bundle does not make every primitive eager. See the [Core Extensions index](../core-extensions/README.md) for the current distribution.

Overflow Marquee and Scrollbox Snap are specialized behaviors and remain outside the Full JavaScript bundle pending migration to external extensions. Marquee's stylesheet also stays separate. Their current lazy registrations are transitional.

The [Compatibility Commitment](../runtime/compatibility-commitment.md) protects only the listed minimal global initialization and declarative activation/mounting interfaces during `0.1.x`. Authoring, lifecycle and Extension-specific APIs remain documented usage contracts for the current version and may evolve incompatibly. Stable indicates maturity and validation, not compatibility; third-party policies belong to their authors.

Start from [`templates/aellux.ext.template.js`](https://github.com/aelluxjs/core/blob/main/templates/aellux.ext.template.js). The scaffold contains the required structure and a compatibility summary.

## Required Contract

1. Name the source and Modern artifact `aellux.ext.<name>.js`.
2. Use the same kebab-case `<name>` as `extensionName` in `aelluxJs.extAttach(extensionName, api)`.
3. Publish a classic script contained by an IIFE. Distribution files must not require ESM imports or exports.
4. Keep `init(options)` idempotent. It may return a Promise when initialization requires asynchronous work.
5. Make every `mount` idempotent and release its listeners, observers, timers, and references in the corresponding `unmount`.
6. Release Extension-wide resources in `destroy()`.
7. Keep the public API and lifecycle behavior equivalent across Modern and Legacy variants.
8. Core Extensions that publish or define CSS custom properties must register each property during `init()` with `aelluxJs.registerCssProperty()`, using an appropriate syntax and initial value. Properties inherit by default; set `inherits: false` only when descendants must receive the initial value instead.
9. Recurring visual publication of CSS custom properties and ordinary CSS properties must follow the shared adaptive `waitLayout` cadence. Batch related writes in `update()` or a sequence's `update` stage, coalesce repeated notifications, and document any correctness-critical synchronous exceptions. See [Adaptive CSS publication](#adaptive-css-publication).

The runtime exposes a kebab-case name as camelCase under `aelluxJs.ext`: `tab-group` becomes `aelluxJs.ext.tabGroup`.
An Extension receives its configuration as the `options` argument to `init(options)`. Supply it through `extensions`:

```js
$ae.init({
  extensions: {
    "tab-group": { initialTab: "overview" }
  }
});
```

The boot script normalizes `tab-group` to `tabGroup` in `$ae.options.extensions`. Extensions without a matching entry receive `{}`.

The runtime awaits the value returned by `init(options)`. The Extension receives `initialized: true` only after that value resolves, and `$ae.wait(extensionName)` resolves to its public API at that point. Concurrent calls share the pending initialization. If `init()` throws or its Promise rejects, the runtime reports `ERROR_EXTENSION_INITIALIZE` (`1102`), leaves `initialized` false, resolves that attempt to `null`, and allows a later call to retry initialization. Register mount maps and expose usable Extension-wide services before the Promise resolves.

Register commands/queries and notifications through [`$ae.comm`](../runtime/communication.md), using the Extension's kebab-case name as `owner`. Consume another Extension through named data contracts rather than its `.ext` API, controller object or implementation imports. Public DOM events remain observation/cancellation and external integration surfaces. Shared Core services such as `motion`, `waitLayout`, `mountManager` and dependency loading remain available directly. Initialization failure and destruction release owned mediator records automatically; Extension `destroy()` should also call `comm.removeOwner(extensionName)`.

Every Extension must follow the applicable [accessibility requirements](accessibility.md). Declare its capability profile and document only the relevant interaction, structure, presentation, motion, integration, infrastructure, lifecycle, and limitation fields. Requirements outside the declared behavior may be marked not applicable with a short reason.

Document any additional resource origins your Extension requires and see [CSP requirements and Extension trust](csp-and-trust.md) for the host application's loading constraints.

## Known Limits & Risks

Every official Extension must maintain a `## Known Limits & Risks` section as part of its public documentation, including Optional Extensions. Link to the [shared Core boundaries](../runtime/known-limits-and-risks.md) and describe only constraints specific to the Extension.

Document relevant contract limits, API dependencies and fallbacks, identified operational risks, validation gaps and practical recommendations. Prefer a concise table with `Area`, `Type`, `Description` and `Recommendation` columns; add explanations or the `Known Limits`, `Performance Risks`, `Behavioral Risks`, `Compatibility & Validation Gaps` and `Recommended Practices` subsections only where useful. There is no minimum number of entries, and no requirement to invent risks or fill empty categories.

Use **Known Limit** for a demonstrated contract restriction, **Potential Risk** for a conditional outcome, and **Validation Gap** for reliability not established by the available checks. Reserve **Known Issue** for a reproducible defect; give the observed behavior and link to a regression test or issue when available. Cite the relevant implementation, existing contract, test or validation matrix. Test presence does not establish a new passing result, and a hypothetical scenario is not a confirmed browser defect.

Summarize existing explanations with internal links instead of duplicating them. Keep the section proportional to the behavior and revise it when the public contract, compatibility requirements or validation evidence changes.

## DOM Mount Contract

Extensions with element behavior register their selectors and handlers with `aelluxJs.mountManager` during `init()`:

```js
aelluxJs.extAttach(extensionName, { init, destroy });

function init() {
  aelluxJs.mountManager.add({
    extensionName, selector: "[data-ae-example]",
    priority: 0,
    mount: mountElement, unmount: unmountElement
  });
}

function destroy() {
  aelluxJs.mountManager.remove({ extensionName });
}
```

The manager runs matching handlers through the mount helper during `$ae.mount(root)` and `$ae.unmount(root)`. Mount registrations run in ascending `priority` order across Extensions and selectors. The default is `0`, and equal priorities keep discovery order. Register before mounting and remove only after unmounting. `mount` must be safe against repeated calls, and `unmount` must reverse the element-level resources created by `mount`.

## Layout work in Core Extensions

Core Extensions must avoid interleaving DOM or CSS writes with reads that can force layout, such as `getBoundingClientRect()`, `offsetWidth`, `clientHeight`, `scrollWidth`, and `getComputedStyle()`. Collect related measurements in one `$ae.waitLayout.read()` callback, then apply dependent styles, classes, attributes, or DOM changes in `$ae.waitLayout.update()`. Queueing the update from the completed read lets the scheduler run the writes after the batched reads in the same layout frame when possible.

### Adaptive CSS publication

The standard performance cadence for runtime-owned CSS publication is the shared adaptive `waitLayout` cadence. This applies to ordinary properties and custom properties, including values driven by scroll, resize, observers, pointer input, timers, or progress events. Group related writes in one eligible update and retain the latest pending values instead of publishing once per incoming notification. The cadence applies to the visual batch, not separately to each `setProperty()` call within that batch. Avoid independent `requestAnimationFrame()` loops for visual publication that bypass the scheduler's response to sustained frame pressure.

This rule does not impose a fixed FPS ceiling or require an active CSS Motion operation. `cssMotionPropertyMaxFPS` is an additional policy for controlled CSS Motion operations with conservative properties; it is not the default rate for all CSS writes. Use `motion.run()` when coordinating a CSS transition or animation, including optional aellux.js easing. Use `waitLayout.update()` when publishing computed values directly. See [CSS publication cadence](../runtime/wait-layout.md#css-publication-cadence).

Native scrolling and momentum do not need to pass through CSS Motion. Publishing CSS values derived from their position is separate work and follows the shared cadence. Keep input decisions and motion cancellation synchronous when deferring them would change the interaction. Initial setup, transition preparation or handoff, interruption freezes, and unmount restoration may also require synchronous writes to preserve a valid state before paint. Keep these operations bounded and tied to their lifecycle boundary; they are not an exemption for recurring visual updates. Cancel pending publications before releasing owned styles, and do not queue restoration that could run after a subsequent mount.

This is an authoring contract, not automatic interception of browser CSS writes. CSS stylesheet interpolation remains native unless explicitly captured by CSS Motion. Application and third-party code must opt into the scheduler for their own publications.

The runtime applies this rule to the following publication paths:

| Path | Scheduled publication |
| --- | --- |
| Scrollbox Snap focus | A replaceable read/update sequence measures item proximity and publishes `--ae-snap-focus` at the shared cadence. |
| Scrollbox custom scrollbars | Scroll and thumb-drag handlers request the existing coalesced Scrollbox read/update publication. |
| Legacy Progress fallback | Logical values reflect synchronously; width, colors and ARIA ranges render together in a coalesced update. |
| Scrollbox elasticity | Gesture and return calculations retain their own timing; transforms, origins and compensating margins publish together in update. Interruption cancels pending writes before synchronously restoring the wrapper. |

Adaptive dimensions, ordinary Anchor placement, Scrollbox progress/fade publication, and Viewport output also use the shared scheduler. Present transition preparation and Marquee pause/freeze operations include synchronous lifecycle writes; their controlled animation timelines use CSS Motion. Repository consumers retain separate direct paths: the floating example changes its target margin directly on input, and the documentation theme writes Ajax opacity and loading-bar styles from event handlers and timers. These consumer paths are not made adaptive merely by setting `cssMotionPropertyMaxFPS`.

For a single measurement and write, no revision guard is needed. These three forms do the same work. With `async`/`await`:

```js
async function refresh() {
  const geometry = await aelluxJs.waitLayout.read(() => ({
    width: element.getBoundingClientRect().width,
    available: container.clientWidth
  }));

  await aelluxJs.waitLayout.update(() => {
    element.style.setProperty("--ae-width", `${geometry.width}px`);
    element.classList.toggle("ae--fits", geometry.width <= geometry.available);
  });
}
```

The equivalent nested Promise form puts `update()` in `.then(geometry => ...)`:

```js
function refreshWithThen() {
  return aelluxJs.waitLayout.read(() => ({
    width: element.getBoundingClientRect().width,
    available: container.clientWidth
  })).then(geometry => aelluxJs.waitLayout.update(() => {
    element.style.setProperty("--ae-width", `${geometry.width}px`);
    element.classList.toggle("ae--fits", geometry.width <= geometry.available);
  }));
}
```

An `update()` may also be queued directly inside the `read()` callback after collecting the values. Returning its Promise makes the outer `read()` Promise wait for the write:

```js
function refreshInsideRead() {
  return aelluxJs.waitLayout.read(() => {
    const width = element.getBoundingClientRect().width;
    const available = container.clientWidth;
    return aelluxJs.waitLayout.update(() => {
      element.style.setProperty("--ae-width", `${width}px`);
      element.classList.toggle("ae--fits", width <= available);
    });
  });
}
```

All three forms batch the reads before the dependent writes. The `isCurrent` guard used in some Core Extensions serves a separate purpose: `waitLayout` is asynchronous, so an element can unmount or a newer refresh can start before an older callback writes. For that case, give the mounted element a revision and check it inside `update()`:

```js
const state = {
  mounted: true, revision: 0,
  width: {
    value: element.style.getPropertyValue("--ae-width"),
    priority: element.style.getPropertyPriority("--ae-width")
  }
};

function refreshMounted() {
  const revision = ++state.revision;
  return aelluxJs.waitLayout.read(() => element.getBoundingClientRect().width)
    .then(width => aelluxJs.waitLayout.update(() => {
      if (!state.mounted || revision !== state.revision) return;
      element.style.setProperty("--ae-width", `${width}px`);
    }));
}

function unmount() {
  state.mounted = false;
  state.revision++;
  if (state.width.value)
    element.style.setProperty("--ae-width", state.width.value, state.width.priority);
  else
    element.style.removeProperty("--ae-width");
}
```

The guard is only needed where that race is possible; it is not a requirement for using `waitLayout` itself. The example also restores the original inline value and priority on unmount.

Coalesce repeated scroll, resize, observer, and pointer notifications into one pending measurement and publication when the latest state is sufficient. Do not build a chain of separate read and update frames for values that can be gathered together. Guard asynchronous callbacks against unmounting or a newer update before writing. Keep reads needed for an immediate input decision synchronous when delaying them would change the interaction; schedule the resulting visual publication through `waitLayout` where practical. Restore any inline values an Extension owns when its mount ends. Third-party Extensions can use the same pattern. See the [waitLayout guide](../runtime/wait-layout.md) for a complete event-coalescing example and frame-order details.

## Declaring Available Builds

The `builds` option describes the artifacts published by the Extension:

```js
$ae.ext("example", { builds: ["modern", "legacy"] });
```

- `builds: ["modern"]` loads `aellux.ext.example.js` only with the Modern runtime. The Legacy runtime reports diagnostic `1106` without requesting an incompatible script.
- `builds: ["legacy"]` loads `aellux.ext.example.legacy.js`. An ES5 Legacy artifact can also run under the Modern runtime.
- `builds: ["modern", "legacy"]` selects the artifact matching the runtime.
- Omitting `builds` defaults to both variants and therefore promises that both files are published.

The declarative equivalent is:

```html
<link rel="aelluxjs-ext"
      href="./extensions/aellux.ext.example.js"
      data-ae-builds="modern legacy">
```

Custom URLs must retain the `aellux.ext.<name>.js` logical filename. aellux.js derives `.legacy.js` and `.min.js` variants from that URL.

## Modern and Legacy Artifacts

The Modern source baseline is ES2017+. Legacy support requires ES5 syntax; changing only the filename is not sufficient.

Expected files for an Extension supporting both targets are:

```text
aellux.ext.example.js
aellux.ext.example.min.js
aellux.ext.example.legacy.js
aellux.ext.example.legacy.min.js
```

The reference builder in [`templates/build-extension.mjs`](https://github.com/aelluxjs/core/blob/main/templates/build-extension.mjs) bundles the source as a classic script and generates all four files. Install its build dependencies in the Extension project:

```sh
npm install --save-dev @babel/core @babel/preset-env esbuild
node build-extension.mjs ./src/aellux.ext.example.js ./dist
```

The builder targets ES2017 for Modern files and uses Babel with an IE 11 target to emit ES5-compatible Legacy syntax. Authors may use another toolchain, but the filenames and runtime contract must remain the same.

## Polyfills Available in Legacy

The Legacy orchestrator provides these compatibility layers once for all Extensions:

- `core-js/stable`, including `Promise`, `Map`, `Set`, `WeakMap`, `Symbol`, common `Object` and `Array` helpers, and URL-related language APIs;
- `fetch`;
- `CustomEvent`;
- `requestAnimationFrame` and `cancelAnimationFrame`;
- `Element.prototype.matches`; and
- `NodeList.prototype.forEach`.

The Core does not guarantee every browser or application API. Dialog compatibility belongs to the official [Dialog Extension](../core-extensions/optional/dialog.md), which bundles its fallback in its Legacy files and mounts before ordinary consumers. If an Extension requires another capability, such as `WebSocket`, Web Components, a Canvas API, extra `Intl` locale data, or a third-party package, it must feature-detect that dependency and bundle or load its own fallback. Additional polyfills should avoid replacing a native implementation when one is already available.

Transpilation only changes syntax. It does not create missing browser APIs, so an Extension is not Legacy-compatible until both its syntax and runtime dependencies are covered.

## Styles and Resources

Use `loadStyle: true` when the stylesheet follows the Extension filename, or pass a stylesheet URL. Modern and Legacy JavaScript variants share the same CSS unless the Extension implements an explicit alternative resource strategy.

Core Extensions must register every CSS custom property they write or define for application customization during `init()`. Group descriptors in one call when possible:

```js
aelluxJs.registerCssProperty(
  { name: "--ae-example-progress", syntax: "<number>", initialValue: "0" },
  { name: "--ae-example-offset", syntax: "<length>", initialValue: "0px" }
);
```

`registerCssProperty()` defaults `inherits` to `true`, checks browser support for `CSS.registerProperty()`, and handles rejected registrations, including duplicate names. The Extension should continue to work with ordinary custom properties when the API is unavailable. Match each initial value to the stylesheet's default and cover registered values in browser tests. See the [Runtime API](../runtime/api.md#initialization) for the method's return value.

Do not leave the Extension partially initialized when an optional resource fails. Report failures through `aelluxJs.diagnostics` and preserve usable fallback behavior whenever possible.

## Publication Checklist

- Modern artifact follows the filename convention.
- Declared `builds` matches the files actually published.
- Legacy artifact parses as ES5 and exposes the same API.
- Extra APIs are feature-detected and polyfilled by the Extension when required.
- `init`, `mount`, `unmount`, and `destroy` obey the lifecycle contract.
- Repeated mount and destroy operations do not duplicate or retain resources.
- Layout-sensitive Core Extensions batch measurements with `waitLayout.read()` and dependent writes with `waitLayout.update()` without adding avoidable frame delays.
- Recurring CSS publications use the shared adaptive cadence, coalesce repeated notifications, and identify any correctness-critical synchronous boundary writes; they do not depend on an active CSS Motion operation or a fixed property FPS ceiling.
- Core Extensions register their published and customizable CSS properties in `init()` through `registerCssProperty()` and keep working when registration is unavailable.
- The accessibility capability profile is documented and its applicable minimum behavior is validated.
- Both runtime selections are covered by browser tests.
