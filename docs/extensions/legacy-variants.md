# Modern and Legacy Extension Variants

> Status: the build generates ES5-syntax variants from the Modern sources; API compatibility and polyfill requirements remain under review.

The beta target allows an Aellux Extension to declare one of three compatibility profiles:

- Modern-only;
- Legacy-only; or
- Modern and Legacy variants.

The orchestrator selects the Legacy filename when the boot script has selected the Legacy runtime. Individual Extensions do not repeat environment detection.

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

The runtime compatibility metadata and required polyfills must be defined before this document can be considered stable.
