# Declarative Extension Loading

Pages can register Extensions through link declarations discovered by the orchestrator:

```html
<link rel="aellux-ext" href="adaptive"
      data-ae-load-when="[data-ae-adaptive]"
      data-ae-load-style>
```

## Attributes

- `href` accepts an Extension label or a URL following the Aellux Extension filename convention.
- `data-ae-load-when` provides the selector used for lazy loading.
- `data-ae-load-style` requests the associated stylesheet when empty or set to `true`; a stylesheet URL requests that specific resource, and `false` disables it.

After processing a declaration, the orchestrator changes its relation to `aellux-ext-registered` so subsequent updates do not register it again.

Declarations may be present in the initial document or inside a root later passed to `$ae.update(root)`.

See [registering Extensions](registration.md), [lazy loading](lazy-loading.md), and [optional styles](styles.md).
