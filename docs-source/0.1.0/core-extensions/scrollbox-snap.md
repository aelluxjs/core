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

The extension applies the native CSS Scroll Snap rules, aligns the first item at mount, and publishes `--ae-snap-viewport` and `--ae-snap-focus` on each item. It preserves and restores pre-existing inline values when unmounted.

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

Desktop Pointer Drag Scroll also emits `AelluxJsScrollboxSnapGesture` with `detail` containing `phase` (`"start"` or `"end"`), `axis`, `moved`, coordinates, and timestamps. The end event is cancelable. Scrollbox Snap cancels it for an eligible snap axis, which prevents PDS momentum and lets snap settle the gesture, including its one-item flick behavior.
