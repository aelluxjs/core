# Scrollbox Snap Extension

**Distribution:** Bundled Extension. **Stability:** Stable.

In Basic mode, register `$ae.ext("scrollbox", { loadStyle: true })` alongside Scrollbox Snap, or supply Scrollbox CSS yourself. Full includes these styles in its shared stylesheet.

Scrollbox Snap é uma Extensão opcional que adiciona pontos de alinhamento ao [Scrollbox](scrollbox.md). Carregue somente `scrollbox-snap`; durante seu `init`, ela registra Scrollbox caso ainda não esteja registrado e aguarda `AelluxJs.wait("scrollbox")` antes de montar qualquer ponto.

```js
$ae.ext("scrollbox-snap");
$ae.init({ mode: "basic" });
```

No bundle `full`, `data-ae-scrollbox-snap` carrega a extensão sob demanda. O atributo também deve estar no elemento que possui `data-ae-scrollbox`.

```html
<div id="gallery" data-ae-scrollbox="pointer" data-ae-scrollbox-snap
  style="display: flex; width: 20rem; overflow: auto">
  <article data-ae-snap-item="left">First</article>
  <article data-ae-snap-item>Second</article>
  <article data-ae-snap-item="right">Third</article>
</div>
```

An empty `data-ae-scrollbox-snap` value selects the horizontal axis. Use `vertical` for a vertical list. An empty `data-ae-snap-item` aligns its center; `start`, `left`, and `top` align its start, while `end`, `right`, and `bottom` align its end. Snap items inside a nested Scrollbox are excluded. A missing eligible item reports diagnostic 1121.

The extension applies the native CSS Scroll Snap rules, aligns the first item at mount, and publishes only `--ae-snap-focus` on each item: alignment proximity from `0` to `1`, where `1` means aligned. It preserves and restores pre-existing inline values when unmounted. On a cancelable desktop wheel event targeted at the snap box, it advances one item in the dominant direction; repeated events in 120 ms stay within that one navigation. A nested Scrollbox under the cursor owns its wheel event, so an enclosing snap box does not navigate from it.

`AelluxJsScrollboxSnapChange` fires when scrolling settles on a new item. Its `detail` is `{ item, index, previousIndex, axis }`; the initial item has `previousIndex: null`.

```js
document.getElementById("gallery").addEventListener("AelluxJsScrollboxSnapChange", event => {
  console.log(event.detail.index, event.detail.item);
});
```

The existing Scrollbox controller exposes navigation whenever this Extension is mounted:

```js
const gallery = $ae("gallery").scrollbox;
gallery.goto(2);
gallery.next();
gallery.previous();
```

The index is zero based. Each method returns `true` when a snap item is available.

## Position migration

`--ae-snap-viewport` has been removed. Add `data-ae-viewport="x"` or `data-ae-viewport="y"` to each item requiring position information and use `--ae-viewport-x` or `--ae-viewport-y`. The independent [Viewport Extension](optional/viewport.md) selects the nearest native scroll container, which can differ from the owning Snap box when another scroll container intervenes. Choose the relevant dimension yourself. Snap continues to publish `--ae-snap-focus` and works without Viewport.

## Interaction hooks

Scrollbox emits `AelluxJsScrollboxInteraction` from its element while a custom scrollbar thumb, Pointer Drag Scroll, or elastic edge interaction is active. Its `detail` is `{ reason, active }`, where `reason` is `"scrollbar"`, `"pointer"`, or `"elastic"`. Scrollbox Snap uses this event to suspend native snap alignment during those interactions and resume it afterward. Other Extensions can consume the same event without accessing Scrollbox state.

Desktop Pointer Drag Scroll also emits `AelluxJsScrollboxSnapGesture` with `detail` containing `phase` (`"probe"`, `"start"`, or `"end"`), `axis`, `moved`, coordinates, and timestamps. Probe and end are cancelable. Probes occur before PDS starts. Scrollbox Snap accepts an eligible short flick at probe and cancels end for the snap axis, letting snap settle the gesture, including its one-item flick behavior. The starting item stays fixed throughout the drag. An enabled snap declaration disables PDS momentum in all axes, even with `data-ae-scrollbox-momentum="true"`; native touch momentum remains unchanged.

A new pointer press or cancelable wheel interaction during elastic recovery immediately restores the wrapper and cancels its remaining return frames before processing the input. Wheel snap navigation then measures the restored item positions. Pointer presses on controls or custom scrollbars also finish the recovery.

A mouse or pen press also interrupts any smooth snap animation immediately and discards a pending flick from the previous gesture. CSS snap stays suspended while the pointer is held, including movement below the PDS threshold and the text-selection wait. The current position stays fixed until the new drag moves it. Releasing or canceling the last pointer restores snap; losing window focus also clears the gesture. Touch input keeps native CSS snap and momentum.

Snap boxes use `scroll-behavior: auto` for native snap positioning. Desktop PDS release smoothly settles at the nearest snap point, or advances one point for an eligible flick, using a 300 ms easing that a new press cancels immediately. Native snap stays suspended until this animation finishes; reduced motion settles immediately. Oversized items retain free scrolling while they cover the viewport. Controller navigation and wheel steps keep their explicit smooth behavior. Fractional pointer coordinates are accumulated without turning browser rounding into elastic force or parent scrolling.

## Known Limits & Risks

See [Core Known Limits & Risks](../runtime/known-limits-and-risks.md) for classifications and shared architecture, loading and lifecycle boundaries.

| Area | Type | Description | Recommendation |
| --- | --- | --- | --- |
| Dependency | Known Limit | <span style="white-space: normal !important;">Snap waits for Scrollbox and mounts after its base map. It needs the Scrollbox declaration and CSS; a filtered mount omitting the base element behavior does not satisfy that contract.</span> | <span style="white-space: normal !important;">Mount both behaviors together and include Scrollbox styles in Basic.</span> |
| Native alignment | Known Limit | <span style="white-space: normal !important;">Oversized snap areas allow free native scrolling while covering the viewport. Touch fling and CSS Scroll Snap remain browser behavior, rather than scripted desktop flick navigation.</span> | <span style="white-space: normal !important;">Use viewport-sized items when every release must align to one point.</span> |
| Outputs | Known Limit | <span style="white-space: normal !important;">Snap publishes alignment proximity as --ae-snap-focus. Normalized position and visible area belong to the independent Viewport Extension.</span> | <span style="white-space: normal !important;">Follow Position migration when replacing --ae-snap-viewport.</span> |
| Completion | Known Limit | <span style="white-space: normal !important;">Navigation methods return a boolean for an available request, not a Promise for settled scrolling. New input interrupts pending navigation; settle notifications describe actual selection.</span> | <span style="white-space: normal !important;">Use ScrollboxSnapChange for selection changes; true does not mean completed travel.</span> |
| Wheel/geometry | Potential Risk | <span style="white-space: normal !important;">Noncancelable wheel events keep native behavior. Item transforms, fractional positions and dynamic layout can change alignment while navigation is pending.</span> | <span style="white-space: normal !important;">Animate item descendants, await layout changes and check final selection after interruption.</span> |
| Observation cost | Potential Risk | <span style="white-space: normal !important;">Scroll updates visit eligible item rectangles; item resize and membership changes refresh state. Large item sets increase measurement and observation work.</span> | <span style="white-space: normal !important;">Limit mounted snap items and profile realistic scrolling.</span> |
| Coverage | Validation Gap | <span style="white-space: normal !important;">Release, regrab, nested-wheel and fractional movement paths have fixtures. Physical touch/trackpad sequences and advanced RTL/transformed dynamic layouts need application validation.</span> | Test actual devices and axis/direction combinations. |

Evidence: [Implementation](https://github.com/aelluxjs/core/blob/update/beta.10/src/aellux.ext.scrollbox-snap.js), [scrollbox-snap-release.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scrollbox-snap-release.spec.mjs), [scrollbox.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scrollbox.spec.mjs), [scrollbox-pointer.spec.mjs](https://github.com/aelluxjs/core/blob/update/beta.10/tests/browser/scrollbox-pointer.spec.mjs).
