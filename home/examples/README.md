# Homepage examples

Run `node tests/browser/server.mjs` from the repository root and open
`http://127.0.0.1:4173/home/index.htm`. Serve over HTTP; Ajax Href and source viewing
require same-origin requests. Each `.htm` file also runs as a standalone page.

- `carousel.htm`: Scrollbox owns pointer dragging and native touch scrolling;
  Scrollbox Snap owns alignment, selection and controller navigation.
- `viewport.htm`: Viewport measures wrappers and publishes CSS values to separate
  visual children, avoiding feedback from their scale and translation. Reduced
  motion disables the visual effects.
- `floating.htm`: Anchor positions an always-mounted outer wrapper; Present owns
  the inner disclosure. Both the Anchor wrapper and its trigger share the same
  positioning reference. The range changes application layout and announces a
  Layout event; Anchor calculates placement and fallback within the iframe viewport.
  The panel uses explicit dismissal so moving the range leaves it open.
- `navigation.htm`, `navigation-details.htm`, `navigation-activity.htm`: real HTML
  responses replace `#navigation-content` through Ajax Href. State Navigation
  records and restores history in the preview's window. Feedback publishes and
  renders loading, success and error messages; the example supplies CSS, focus
  handling and a live region. Pending-request accounting keeps an obsolete
  completion from clearing an active loading indicator.

The **Try a 404** button deliberately requests the nonexistent
`unavailable-demo.htm`. A server's genuine 404 response produces error feedback
without replacing the current panel or writing a successful history entry. An
HTTP error may appear in browser network/console tools for this deliberate action.
Aborted and superseded requests do not produce error presentation.

All examples use public `dist/` artifacts in Basic mode, explicitly registering
only their required Extensions and Preference. Preference's
`syncBootstrapThemeTag` keeps each preview aligned with the saved homepage theme;
storage events synchronize separate windows on the same origin. Bootstrap 5.3.8
CSS provides presentation. Bootstrap JavaScript is not loaded.

The homepage's native source disclosures fetch these exact HTML, JavaScript and
CSS files; no separately maintained code excerpts are used. Preserve the relative
`home/` and `dist/` structure when deploying under a repository prefix such as
`/core/`. Viewport and Ajax Href remain unstable Extensions. Touch emulation does
not replace checks on physical devices.
