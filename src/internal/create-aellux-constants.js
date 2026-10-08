/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Build-time helper shared by the ES5 boot bundle and the importable ESM entry.
export function createAelluxConstants() {
  return {
    AELLUXJS_SHORT_JS_NAME: "$ae",
    AELLUXJS_EXT_SCRIPT_PREFIX: "ext",

    AELLUXJS_CLASS_NAME_PREFFIX: "ae--?",
    AELLUXJS_EVENT_NAME_PREFFIX: "AelluxJs?",
    AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX: "ae-?",

    AELLUXJS_DIAGNOSTICS: {
      ERROR_BOOTSTRAP_NOT_FOUND: { code: 1000, message: "aellux.js boot script could not be located." },
      ERROR_NOT_INITIALIZED: { code: 1001, message: "aellux.js has not been initialized." },
      ERROR_INVALID_MODE: { code: 1002, message: "aellux.js mode must be basic or full." },
      ERROR_INVALID_VERBOSE_LEVEL: { code: 1003, message: "aellux.js verboseLevel must be 0, 1, 2, or the matching error, warn, info key." },
      ERROR_CONTROLLER_NOT_FOUND: { code: 1004, message: "No controller was found for this element. It may not be mounted." },
      ERROR_EXTENSION_DUPLICATE: { code: 1101, message: "aellux.js Extension is already registered." },
      ERROR_EXTENSION_INITIALIZE: { code: 1102, message: "aellux.js Extension failed to initialize." },
      ERROR_EXTENSION_MOUNT: { code: 1103, message: "aellux.js Extension failed to mount or unmount an element." },
      ERROR_EXTENSION_UNMOUNT: { code: 1104, message: "aellux.js Extension failed to unmount." },
      ERROR_EXTENSION_DESTROY: { code: 1105, message: "aellux.js Extension failed to destroy." },
      ERROR_EXTENSION_INCOMPATIBLE: { code: 1106, message: "aellux.js Extension has no compatible build for the selected runtime." },
      ERROR_EXTENSION_SELECTOR: { code: 1107, message: "aellux.js Extension failed to iterate a selector." },
      ERROR_CALLBACK: { code: 1108, message: "aellux.js Extension selector callback failed." },
      ERROR_EXTENSION_TRANSITION: { code: 1109, message: "aellux.js Extension transition failed." },
      ERROR_LEGACY_RUNTIME_START: { code: 1201, message: "aellux.js Legacy runtime failed to start." },
      ERROR_LEGACY_RUNTIME_LOAD: { code: 1202, message: "aellux.js Legacy runtime could not be loaded." },
      ERROR_MODERN_RUNTIME_START: { code: 1203, message: "aellux.js Modern runtime failed to start; trying Legacy runtime." },
      ERROR_MODERN_RUNTIME_LOAD: { code: 1204, message: "aellux.js Modern runtime could not be loaded; trying Legacy runtime." },
      WARN_BROWSER_UNSUPPORTED: { code: 2000, message: "Browser environment is not available." },
      WARN_BROWSER_CAPABILITIES: { code: 2001, message: "Some browser capabilities are unavailable; trying Legacy runtime." },
      WARN_INTERRUPTION: { code: 2002, message: "aellux.js Extension transition was interrupted." },
      WARN_INVALID_CONTROLLER_ELEMENT: { code: 2003, message: "Controller lookup requires a DOM Element or an existing element ID, optionally prefixed with #." },
      INFO_LEGACY_FALLBACK: { code: 3000, message: "aellux.js is starting the Legacy runtime." }
    },

    AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS: {
      mode: "full",
      verboseLevel: 0,
      forceLegacy: false,
      basePath: null,
      extensions: {}
    },

    AELLUXJS_MODERN_API_DEPENDENCIES: [
      "Promise", "Map", "CustomEvent", "requestAnimationFrame", "cancelAnimationFrame", "fetch",
      { name: "Object", function: ["assign", "entries", "freeze"] },
      { name: "Array", function: ["from", "isArray"] }
    ]
  };
}
