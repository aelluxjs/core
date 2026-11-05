# Homepage examples

Run `node tests/browser/server.mjs` from the repository root and open
`http://127.0.0.1:4173/home/index.htm`. Serve over HTTP for runtime loading and
same-origin source viewing. Each example also runs as a standalone page.

The four experiences use only the ten bundled primitives. They do not register
or load optional Extensions, Bootstrap JavaScript or external image libraries.

- `carousel.htm`: **Places to Pause** combines Scrollbox dragging/native touch,
  Viewport visibility on separate visual children, Point-enabled native buttons
  and an exclusive Present Group for destination field notes. The tiny script
  only connects the previous/next buttons to native scrolling. This is free
  scrolling; it does not load Scrollbox Snap.
- `viewport.htm`: **A Little Space** is a horizontal visual story. Viewport
  publishes geometry to visual children, whose scale, opacity and layered shapes
  respond through CSS. Scrollbox supplies pointer dragging and a scrollbar.
  Preference controls motion; reduced motion removes the effects. It has no
  custom interaction script.
- `floating.htm`: **Make It Yours** combines Anchor, Present, Point and Focus.
  An always-mounted outer wrapper follows the workspace card and chooses a
  placement in the iframe viewport; the inner editor owns visibility/motion.
  The range changes application layout and announces Layout. Enter advances
  through the fields, and Focus restores the previous visible target when the
  editor closes. The script handles the range, live title and Escape only.
- `navigation.htm`: **Your Next Big Idea** composes Present Groups, Focus,
  Preference, Adaptive, State Navigation and Feedback into a local setup flow.
  Native form validation and Enter navigation serve the first step. Theme
  choices synchronize with the homepage and other previews. A range resizes
  the workspace card; Adaptive changes its layout at a component-local 360px
  threshold. State Navigation records the selected step; Back/Forward selects
  the corresponding Present member and focuses its heading. Focus-only state
  changes do not reselect the step or steal input focus. Feedback opens an
  inline notice through Present, which owns automatic dismissal. No request
  is made and no workspace is created on a server. Form edits stay in memory;
  history restores navigation, not form snapshots.

The homepage uses Full and its shared stylesheet, with an explicit registration
for the custom SVG Downloader. Every standalone example uses Basic and registers
only the Extensions and styles it needs, before calling `$ae.init()` inline in
its head. The boot option `syncBootstrapThemeTag` publishes the theme before
styles; Preference owns later changes, persistence and option-button
`aria-pressed`. Same-origin storage events synchronize separate windows.

Bootstrap 5.3.8 supplies layout, spacing, typography and controls. Shared
`../assets/home.css` supplies colors, focus indicators and reusable landscape
artwork; inline styles describe dimensions and Extension-driven effects.
Standalone pages use system fonts. Only the homepage loads Geist.
There is no dedicated examples stylesheet.

Source disclosures fetch the exact executed HTML and JavaScript. Shared
`home.css` is omitted from the file list. Highlight.js loads through `$ae.dep()`
with cached 11.12 CDN dependencies and GitHub light/dark styles. The source stays
readable and copyable if highlighting fails. Preserve the relative `home/` and
`dist/` structure when deploying under a repository prefix.

Viewport, Point and Focus retain their documented stability status. Browser
regressions cover core interactions, runtime assets, intermediate visual values,
keyboard focus, touch emulation, motion preferences, reflow and runnable source.
Touch emulation does not replace checks on physical devices.
