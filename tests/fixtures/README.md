# Browser Test Fixtures

`bootstrap-5.3.8.min.css` is the official Bootstrap 5.3.8 minified stylesheet,
stored locally so the browser suite does not depend on a CDN or network access.

- Upstream package: `bootstrap@5.3.8`
- Upstream path: `dist/css/bootstrap.min.css`
- SHA-384: `sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB`
- License: MIT, as identified in the stylesheet header
- Complete license text: `bootstrap-5.3.8.LICENSE` (from the upstream v5.3.8 tag)

The fixture is test-only and is not included in the published npm package.

`highlightjs-11.12.0/` freezes the official Highlight.js browser build and GitHub
light/dark styles from `@highlightjs/cdn-assets@11.12.0`, matching Docweaver's 11.12
CDN series. Homepage tests route `$ae.dep()` requests to these files so they test
real tokenization, dependency reuse and theme switching without network access.
The build includes the HTML/XML, JavaScript and CSS grammars used by the examples.
The upstream BSD-3-Clause license is included as `highlightjs-11.12.0/LICENSE`.
These fixtures are test-only and excluded from the published npm package. Google
Fonts requests use an empty stylesheet during behavior tests; font fallback is
independent of the example interactions.
