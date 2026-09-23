# Modern and Legacy Extension Variants

> Status: the filename convention and placeholder files exist, but functional Legacy variants are not implemented yet.

The beta target allows an Aellux Extension to declare one of three compatibility profiles:

- Modern-only;
- Legacy-only; or
- Modern and Legacy variants.

The Aellux Core should select the compatible variant after the boot script selects the runtime. Individual Extensions should not repeat environment detection.

## Filename Convention

- Modern: `aellux.ext.<name>.js`
- Legacy: `aellux.ext.<name>.legacy.js`
- Minified Legacy: `aellux.ext.<name>.legacy.min.js`

The Legacy orchestrator follows the same convention as `aellux.orchestrator.legacy.js`.

## Requirements Under Review

- Metadata that identifies available runtime targets.
- A clear diagnostic when no compatible variant exists.
- Independent loading of JavaScript and optional styles for the selected variant.
- Equivalent public APIs where both variants are provided.

The final naming convention and registration API must be defined before this document can be considered stable.
