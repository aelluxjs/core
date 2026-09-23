# Optional Extension Styles

Extensions may be JavaScript-only or may request a stylesheet associated with their script.

## JavaScript Only

```js
$ae.ext("feedback");
```

`loadStyle` defaults to `false`.

## JavaScript and CSS

```js
$ae.ext("adaptive", { loadStyle: true });
```

For `aellux.ext.adaptive.js`, the runtime derives `aellux.ext.adaptive.css`. Query strings and fragments are preserved by the script URL handling where applicable.

The declarative equivalent is:

```html
<link rel="aellux-ext" href="adaptive" data-ae-load-style>
```

The orchestrator waits for requested assets before initializing and mounting the Extension. A stylesheet load error is treated as non-fatal so JavaScript behavior can continue when possible.

The full core bundle always requests the Adaptive stylesheet through its bundled loader. Other Extensions remain responsible for declaring their own required assets.
