# Documentation source

Versioned pages live under `0.1.x/`; `summary.json` controls their navigation. Edit the Markdown sources and run `npm run build:docs` to update the rendered pages.

Prefer a small working code example near each user-facing API or behavior. Show the actual declaration or call before listing its variants and edge cases. Use HTML for declarative attributes, CSS for styling contracts, and JavaScript for lifecycle methods and events. Include the setup, asynchronous handling, and cleanup needed to make an example accurate; keep unrelated implementation details out of it.

When a paragraph needs a complete call, configuration object, DOM fragment, selector usage, or sequence of operations, introduce it briefly and place the code in a fenced block. Keep inline code for short identifiers, attribute names, literal values, and references to examples already shown. Prefer one small runnable example over a long paragraph that spells out several calls. Do not duplicate the same example in prose immediately after its block.

For example, a page about a DOM event should show its listener and the action that triggers it:

```js
document.addEventListener("AelluxJsUpdate", () => {
  console.log("The mounted update pass finished");
});

await $ae.mountManager.update(document.getElementById("panel"));
```

Check examples against the current source and generated runtime before describing timing, event payloads, or browser behavior. Link to the dedicated API page for longer examples instead of repeating the same explanation across Extension pages.
