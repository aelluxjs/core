# Editor support

Aellux ships generated semantic metadata for HTML/CSS completion, hover documentation and values. These files are development tooling; browsers do not load them and they add no code to the runtime bundles.

| File in `dist/` | Purpose |
| --- | --- |
| `aellux.html-data.json` | VS Code HTML Custom Data 1.1: public attributes, known values,<br>examples and documentation links. |
| `aellux.css-data.json` | VS Code CSS Custom Data 1.1: public CSS custom properties, syntax and<br>descriptions. |
| `aellux.web-types.json` | JetBrains Web Types: HTML attributes, CSS properties/classes and DOM<br>events. |
| `aellux.semantic.json` | Shared semantic catalog, including internal/output roles and the<br>existing boot and runtime API shape contract, for other tooling. |

## VS Code

Add the files to your application's `.vscode/settings.json` after installing `@aelluxjs/core`:

```json
{
  "html.customData": [
    "./node_modules/@aelluxjs/core/dist/aellux.html-data.json"
  ],
  "css.customData": [
    "./node_modules/@aelluxjs/core/dist/aellux.css-data.json"
  ]
}
```

Paths are relative to the workspace. In an Aellux checkout, use `./dist/aellux.html-data.json` and `./dist/aellux.css-data.json`; the repository settings already reference these paths. Reload the VS Code window after changing Custom Data settings. The built-in HTML/CSS language services consume these files; other template-language extensions may require their own configuration.

These are the native [VS Code Custom Data](https://code.visualstudio.com/api/extension-guides/custom-data-extension) formats. Custom Data does not supply JavaScript signatures or a runtime linter. VS Code's CSS Custom Data format has no custom class contribution kind; the class catalog is available through Web Types and the shared semantic file.

## JetBrains

The published package declares its metadata through:

```json
{
  "web-types": "./dist/aellux.web-types.json"
}
```

This is the [Web Types package discovery convention](https://github.com/JetBrains/web-types#distribution). For a local project or an IDE setup requiring an explicit reference, add the path to that project's `package.json`:

```json
{
  "web-types": "./node_modules/@aelluxjs/core/dist/aellux.web-types.json"
}
```

Use `./dist/aellux.web-types.json` in an Aellux checkout. Existing native HTML tags are extended rather than replaced. DOM events are contributed in the JS namespace. Closed attribute sets use TypeScript literal unions; selectors, IDs, pivot lists, property lists and preference values remain open strings. The metadata does not override the library's normal JavaScript symbols or claim to provide TypeScript declarations.

## Semantic coverage

The complete catalog currently contains 56 attributes, 54 CSS properties, 1,568 classes and 38 events. Native editor files expose 48 public input/output attributes and 42 public CSS properties; private runtime markers and implementation properties stay in the shared catalog. The native `link` tag also receives the `aelluxjs-ext` relation suggestion.

Descriptions distinguish editable inputs from runtime outputs such as progress, measured dimensions, resolved root preferences and state classes. Suggestions for open grammars are examples, not exhaustive allowed values. For example, `data-ae-target` accepts application IDs, and `data-ae-anchor` accepts candidate lists; neither is restricted to the examples. Removed `data-ae-present-key` is excluded: Present Group membership uses native IDs.

The shipped catalog follows the default naming constants and default Adaptive thresholds. Adaptive utility classes are collected from the actual CSS generator, including classes such as `p-ux-sm-3` and `ar-16x9`. Application-defined IDs, preference values, custom Extension attributes and runtime-specific thresholds require application metadata when additional completions are desired.

## Generation and validation

```sh
npm run build:editor-data
npm run test:unit
```

`build:core`, the complete `build`, and `prepack` regenerate the files as well. The package exports `@aelluxjs/core/semantic`, `/html-data`, `/css-data` and `/web-types` for tooling that resolves package subpaths. Editor settings use filesystem paths to the JSON files.

The authoring definitions live in `scripts/semantic-definitions.mjs`; `scripts/build-editor-data.mjs` renders both native formats from those definitions and the current package version. API shapes come from `src/internal/aellux-api-contract.js`; naming comes from the existing normalization helper, and Adaptive defaults/classes come from the Extension and stylesheet generator. These build-time modules are not imported by runtime code.

Unit tests validate the native files against locally retained official schemas, check generation drift and literal attribute coverage, and verify open grammars, string-valued booleans, tag scope, generated classes, output/private roles and event semantics. Normal generation and tests do not fetch schemas or contact an editor service.
