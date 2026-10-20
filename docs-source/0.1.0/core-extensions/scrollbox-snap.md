# Scrollbox Snap Extension

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

The extension applies the native CSS Scroll Snap rules, aligns the first item at mount, and publishes `--ae-snap-viewport` and `--ae-snap-focus` on each item. It preserves and restores pre-existing inline values when unmounted. On a cancelable desktop wheel event targeted at the snap box, it advances one item in the dominant direction; repeated events in 120 ms stay within that one navigation. A nested Scrollbox under the cursor owns its wheel event, so an enclosing snap box does not navigate from it.

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

## Interaction hooks

Scrollbox emits `AelluxJsScrollboxInteraction` from its element while a custom scrollbar thumb, Pointer Drag Scroll, or elastic edge interaction is active. Its `detail` is `{ reason, active }`, where `reason` is `"scrollbar"`, `"pointer"`, or `"elastic"`. Scrollbox Snap uses this event to suspend native snap alignment during those interactions and resume it afterward. Other Extensions can consume the same event without accessing Scrollbox state.

Desktop Pointer Drag Scroll also emits `AelluxJsScrollboxSnapGesture` with `detail` containing `phase` (`"probe"`, `"start"`, or `"end"`), `axis`, `moved`, coordinates, and timestamps. Probe and end are cancelable. Probes occur before PDS starts. Scrollbox Snap accepts an eligible short flick at probe and cancels end for the snap axis, letting snap settle the gesture, including its one-item flick behavior. The starting item stays fixed throughout the drag. An enabled snap declaration disables PDS momentum in all axes, even with `data-ae-scrollbox-momentum="true"`; native touch momentum remains unchanged.

A new pointer press or cancelable wheel interaction during elastic recovery immediately restores the wrapper and cancels its remaining return frames before processing the input. Wheel snap navigation then measures the restored item positions. Pointer presses on controls or custom scrollbars also finish the recovery.

A mouse or pen press also interrupts any smooth snap animation immediately and discards a pending flick from the previous gesture. CSS snap stays suspended while the pointer is held, including movement below the PDS threshold and the text-selection wait. The current position stays fixed until the new drag moves it. Releasing or canceling the last pointer restores snap; losing window focus also clears the gesture. Touch input keeps native CSS snap and momentum.
