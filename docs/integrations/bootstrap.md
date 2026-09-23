# Bootstrap Integration

Aellux complements Bootstrap; it does not replace or bundle it. Bootstrap owns its visual system and components, while Aellux manages independently loadable UX behaviors.

## Namespaces

- Aellux declarations use `data-ae-*`.
- Runtime state classes use `ae--*`.
- Adaptive utilities use names such as `p-ux-md-2`.
- Aellux events use the `Aellux` prefix.

These namespaces are designed to avoid collisions with Bootstrap's public classes and data attributes.

## Loading Order

When Aellux adaptive utilities are intended to override Bootstrap utilities contextually, load the Adaptive CSS after Bootstrap:

```html
<link rel="stylesheet" href="./bootstrap.min.css">
<link rel="stylesheet" href="./dist/aellux.ext.adaptive.css">
<script src="./dist/aellux.js"></script>
```

Adaptive utility declarations use `!important` where they are specifically intended to override Bootstrap utility declarations.

## JavaScript Coexistence

Extensions should avoid unnecessary `preventDefault()` and `stopPropagation()`, should not remove third-party listeners, and must keep mounting idempotent when Bootstrap reveals or modifies content dynamically.

After inserting or revealing dynamic markup, update only the affected root when possible:

```js
await $ae.update(changedElement);
```

An official Bootstrap integration page and repeatable compatibility tests remain requirements for `0.1.0-beta`.
