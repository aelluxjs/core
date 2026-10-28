# Official Extension Registry

The build publishes `dist/aellux.extensions.min.json` with schema version `1`. Its `coreVersion` comes from `package.json`; every approved entry has an exact `coreCompatibility`, Modern and Legacy URLs with SHA-384 integrity, optional stylesheet metadata, and a dependency list. Approval is controlled by the explicit list in `src/official-extension-definitions.js`: the presence of an Extension source file alone never makes it official.

Set `AELLUX_OFFICIAL_CDN_BASE` to an immutable HTTPS distribution base while building release artifacts. The build appends the encoded package version and filename. Without that release setting, package builds use `./` URLs so the registry remains usable beside the files in `dist`. The build validates all required local artifacts and final-byte hashes and writes `aellux.extensions.report.json`; invalid or incomplete official metadata fails the build.

## Resolution and caching

Both modes reuse the signed official metadata embedded by the version-matched boot script, avoiding an index request for the current Core version. This metadata resolves explicitly registered names; it does not register Extensions in Basic. Basic requires `$ae.ext(...)` or a link declaration for each desired Extension and loads its separate compatible script according to the supplied options. Full automatically registers all official Extensions and bundles Adaptive, Anchor, Overflow Marquee, Feedback, Focus, Point, Preference, Present, Scrollbox, Scrollbox Snap and State Navigation. Optional Extensions (Ajax Href, Dialog, Progress, PWA and Viewport) remain external; Full supplies their activation selectors. Full initializes Preference and State Navigation at startup. In Basic, choose their loading policy explicitly, registering a name before calling `$ae.wait(name)`.

Resolution order is: an explicit URL/registration, a bundled implementation, official metadata, the configured custom fallback, and finally the historical local filename convention. A custom index cannot silently replace an official entry.

```js
$ae.extIndex.setFallback("https://example.org/my-extensions.json");
$ae.ext("my-extension");
$ae.init({ mode: "basic" });
```

Custom indexes use the same schema and require SHA-384 integrity for declared scripts, styles, and remote dependency objects. A dependency may instead be a string only when it names one already registered by the host. External manifests and artifacts require HTTPS in production. `environment: "development"` permits local non-HTTPS development. JSON is parsed as data and is never executed; SRI authenticates an artifact against a declared hash but does not make the manifest origin itself trustworthy.

## Core compatibility

Third-party registrations may declare an exact version or a range using `^`, `~`, comparison operators, whitespace intersections, or `||` alternatives:

```js
$ae.ext("./extensions/aellux.ext.example.js", {
  coreCompatibility: "^0.1.0",
  integrity: "sha384-..."
});
```

Missing compatibility metadata preserves the earlier behavior and is not presented as validated. An incompatible declaration blocks `init()` with `ERROR_EXTENSION_VERSION_INCOMPATIBLE` (`1123`). `skipCompatibilityCheck: true` allows initialization but always records `WARN_EXTENSION_COMPATIBILITY_SKIPPED` (`2018`) with the current Core version and declared range; it never bypasses SRI or URL checks.

Bootscript and Orchestrator expose `AelluxJs.version` and `AelluxJs.orchestratorVersion`. Both are compiled from `package.json`. A mismatch—typically stale cache across releases—records `ERROR_RUNTIME_VERSION_MISMATCH` (`1124`) and prevents runtime startup in Modern, Legacy, Basic, and Full builds.
