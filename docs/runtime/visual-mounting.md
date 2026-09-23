# Visual Mounting States

Aellux can hide content while its required Extensions and resources are mounting, display a loader, and expose completion through `ae--mounted`.

## Current Runtime Contract

```html
<main data-ae-wait-mounted>
  <div data-ae-loader>Loading…</div>
  <section data-ae-adaptive>Content</section>
</main>
```

The boot script recognizes `data-ae-wait-mounted` and provides the minimal weak CSS required for the waiting state.

The orchestrator adds `ae--mounted` after the relevant controller completes `mount` and removes it after `unmount`. The boot script's weak CSS uses the state to reveal content and hide the loader.

## Failure Behavior

An Extension failure must not block orchestrator readiness. Preventing a waiting element from remaining hidden indefinitely is still a beta requirement and must be verified before release.

Applications should keep meaningful initial HTML and avoid making essential content depend exclusively on JavaScript mounting.
