# Bootstrap Integration

aellux.js complements Bootstrap; it does not replace or bundle it. Bootstrap owns its visual system and components, while aellux.js manages independently loadable UX behaviors.

## Namespaces

- aellux.js declarations use `data-ae-*`.
- Runtime state classes use `ae--*`.
- aellux.js events use the `AelluxJs` prefix.

These namespaces are designed to avoid collisions with Bootstrap's public classes and data attributes.

## Loading Order

When an application's Extension stylesheet should take precedence over Bootstrap, load it after Bootstrap:

```html
<link rel="stylesheet" href="./bootstrap.min.css">
<link rel="stylesheet" href="./styles/extension.css">
<script src="./dist/aellux.js"></script>
```

The application controls the selectors and priority of its Extension stylesheet.

## JavaScript Coexistence

Extensions should avoid unnecessary `preventDefault()` and `stopPropagation()`, should not remove third-party listeners, and must keep mounting idempotent when Bootstrap reveals or modifies content dynamically.

After inserting or revealing dynamic markup, update only the affected root when possible:

```js
await $ae.mount(changedElement);
```

The browser validation suite includes a repeatable Bootstrap CSS coexistence scenario. Bootstrap JavaScript components remain outside the validated scope.

## Validation Scope

The `tests/browser/bootstrap-integration.html` scenario loads the versioned local fixture `tests/fixtures/bootstrap-5.3.8.min.css` before aellux.js. It verifies the fixture integrity, confirms Bootstrap button styles are applied, exercises declarative lazy Extension loading, and checks that Preference mounts without removing Bootstrap classes. The test rejects external requests, so it runs without CDN or network access.

The proven scope is CSS and namespace coexistence with Bootstrap 5.3.8 for the markup exercised by that scenario. Bootstrap JavaScript components, dynamically revealed Bootstrap content, plugin events and listener coexistence are not covered by this result.
