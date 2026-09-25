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

The orchestrator adds `ae--mounted` after a relevant controller completes `mount` and removes it after `unmount`. The boot script's weak CSS uses the state to reveal content and hide the loader.

Place `data-ae-wait-mounted` on an element that is itself mounted by at least one Extension, as in the example where `<main>` also declares `data-ae-adaptive`. A wrapper with no matching Extension controller does not receive `ae--mounted` automatically.

## Failure Behavior

An Extension failure must not block orchestrator readiness. Loading failures are isolated and reported through diagnostics. Applications should still verify that every waiting element has a valid mount declaration so configuration errors cannot leave it hidden.

Applications should keep meaningful initial HTML and avoid making essential content depend exclusively on JavaScript mounting.
