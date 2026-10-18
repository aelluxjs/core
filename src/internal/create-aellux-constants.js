/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Build-time helper shared by the ES5 boot bundle and the importable ESM entry.
export function createAelluxConstants() {
  return {
    AELLUXJS_SHORT_JS_NAME: "$ae",
    AELLUXJS_EXT_SCRIPT_PREFIX: "ext",

    AELLUXJS_CLASS_NAME_PREFFIX: "ae--?",
    AELLUXJS_CSS_VAR_PREFFIX: "--ae-?",
    AELLUXJS_EVENT_NAME_PREFFIX: "AelluxJs?",
    AELLUXJS_DATA_ATTRIBUTE_NAME_PREFFIX: "ae-?",

    AELLUXJS_DIAGNOSTICS: {
      ERROR_BOOTSTRAP_NOT_FOUND: { code: 1000, message: "aellux.js boot script could not be located." },
      ERROR_NOT_INITIALIZED: { code: 1001, message: "aellux.js has not been initialized." },
      ERROR_INVALID_MODE: { code: 1002, message: "aellux.js mode must be basic or full." },
      ERROR_INVALID_VERBOSE_LEVEL: { code: 1003, message: "aellux.js verboseLevel must be 0, 1, 2, or the matching error, warn, info key." },
      ERROR_CONTROLLER_NOT_FOUND: { code: 1004, message: "No controller was found for this element. It may not be mounted." },
      ERROR_MOUNT: { code: 1006, message: "aellux.js failed to mount a root." },
      ERROR_EXTENSION_DUPLICATE: { code: 1101, message: "aellux.js Extension is already registered." },
      ERROR_EXTENSION_INITIALIZE: { code: 1102, message: "aellux.js Extension failed to initialize." },
      ERROR_EXTENSION_MOUNT: { code: 1103, message: "aellux.js Extension failed to mount or unmount an element." },
      ERROR_EXTENSION_UNMOUNT: { code: 1104, message: "aellux.js Extension failed to unmount." },
      ERROR_EXTENSION_DESTROY: { code: 1105, message: "aellux.js Extension failed to destroy." },
      ERROR_EXTENSION_INCOMPATIBLE: { code: 1106, message: "aellux.js Extension has no compatible build for the selected runtime." },
      ERROR_EXTENSION_SELECTOR: { code: 1107, message: "aellux.js Extension failed to iterate a selector." },
      ERROR_CALLBACK: { code: 1108, message: "aellux.js Extension selector callback failed." },
      ERROR_EXTENSION_TRANSITION: { code: 1109, message: "aellux.js Extension transition failed." },
      ERROR_EXTENSION_NOT_REGISTERED: { code: 1110, message: "aellux.js Extension is not registered." },
      ERROR_PRESENT_CONTROL_TARGET_MISSING: { code: 1111, message: "A present control has no target selector and is not inside a present container." },
      ERROR_EXTENSION_ATTACH: { code: 1112, message: "aellux.js Extension attachment has invalid arguments." },
      ERROR_MOUNT_REGISTRATION: { code: 1113, message: "aellux.js Mount registration has invalid arguments." },
      ERROR_EXTENSION_LOAD_WHEN: { code: 1114, message: "aellux.js Extension loadWhen selector is invalid." },
      ERROR_MOUNT_MAP_IN_USE: { code: 1115, message: "A mount map cannot be removed while elements are still mounted." },
      ERROR_DEPENDENCY_ARGUMENT: { code: 1116, message: "aellux.js Dependency registration has invalid arguments." },
      ERROR_DEPENDENCY_CONFLICT: { code: 1117, message: "aellux.js Dependency label is already registered with a different URL." },
      ERROR_DEPENDENCY_LOAD: { code: 1118, message: "aellux.js Dependency script could not be loaded." },
      ERROR_ANCHOR_REFERENCE_CONTEXT: { code: 1119, message: "Anchor target and anchored element must share the same containing block / absolute positioning reference." },
      ERROR_SCROLLBOX_ELASTIC_WRAPPER: { code: 1120, message: "Elastic Scrollbox requires exactly one direct child marked with data-ae-scrollbox-elastic." },
      ERROR_SCROLLBOX_SNAP_ITEMS: { code: 1121, message: "Snap Scrollbox requires at least one eligible data-ae-snap-item." },
      ERROR_FEEDBACK_ARGUMENT: { code: 1122, message: "Feedback requires a string message, a known string type, a string motion when provided, and a DOM Element target when provided." },
      ERROR_LEGACY_RUNTIME_START: { code: 1201, message: "aellux.js Legacy runtime failed to start." },
      ERROR_LEGACY_RUNTIME_LOAD: { code: 1202, message: "aellux.js Legacy runtime could not be loaded." },
      ERROR_MODERN_RUNTIME_START: { code: 1203, message: "aellux.js Modern runtime failed to start; trying Legacy runtime." },
      ERROR_MODERN_RUNTIME_LOAD: { code: 1204, message: "aellux.js Modern runtime could not be loaded; trying Legacy runtime." },
      WARN_BROWSER_UNSUPPORTED: { code: 2000, message: "Browser environment is not available." },
      WARN_BROWSER_CAPABILITIES: { code: 2001, message: "Some browser capabilities are unavailable; trying Legacy runtime." },
      WARN_INTERRUPTION: { code: 2002, message: "aellux.js Extension transition was interrupted." },
      WARN_EXTENSION_STYLE_LOAD: { code: 2004, message: "aellux.js Extension stylesheet could not be loaded." },
      WARN_CONTROLLER_METHOD_MISSING: { code: 2005, message: "A mounted controller method is not available on its Extension." },
      WARN_STORAGE_FALLBACK: { code: 2006, message: "Browser storage is unavailable; values will be kept in memory only." },
      WARN_PRESENT_MOTION_HIDDEN: { code: 2008, message: "A present-motion child should not be hidden; hidden belongs on its present container." },
      WARN_NAVIGATION_EVENT_INVALID: { code: 2009, message: "A state-navigation event has missing or invalid detail properties." },
      WARN_PRESENT_MOTION_MISSING: { code: 2010, message: "A present container has no direct present-motion child; one was generated automatically." },
      WARN_INVALID_ELEMENT_OR_ID: { code: 2011, message: "Expected a DOM Element or an existing element ID, optionally prefixed with #." },
      WARN_SCROLLBOX_MODE_INVALID: { code: 2012, message: "Scrollbox mode must be native or pointer; using native." },
      WARN_SCROLLBOX_OPTIONS_JSON: { code: 2013, message: "Scrollbox options are not valid JSON; using defaults." },
      WARN_SCROLLBOX_OPTIONS_OBJECT: { code: 2014, message: "Scrollbox options must be a JSON object; using defaults." },
      WARN_SCROLLBOX_ELASTIC_LIMIT_INVALID: { code: 2015, message: "Scrollbox elastic limit must be one or two nonnegative fractions or pixel values; using 1/4." },
      WARN_SCROLLBOX_WRAPPER_DISPLAY: { code: 2016, message: "Scrollbox elastic wrappers require an inline display; converting to an inline counterpart when available." },
      WARN_LAYOUT_MAX_FPS_INVALID: { code: 2017, message: "data-ae-maxfps must be a finite number greater than zero; the limit was ignored." },
      INFO_LEGACY_FALLBACK: { code: 3000, message: "aellux.js is starting the Legacy runtime." },
      INFO_PRESENT_MEASURED_LAYOUT: { code: 3001, message: "Present measures size transitions without a direct present-motion child; add one to use the grid layout strategy." },
      INFO_FEEDBACK_MOTION_CUSTOM: { code: 3002, message: "The requested feedback motion is not standard. Standard motions are listed in the diagnostic context." }
    },

    AELLUXJS_DEFAULT_INITIALIZATION_OPTIONS: {
      mode: "full",
      verboseLevel: 0,
      forceLegacy: false,
      skipGlobalMount: false,
      autoViewportMeta: true,
      basePath: null,
      crossOrigin: null,
      extensions: {}
    },

    AELLUXJS_MODERN_API_DEPENDENCIES: [
      "Promise", "Map", "CustomEvent", "requestAnimationFrame", "cancelAnimationFrame", "fetch",
      { name: "Object", function: ["assign", "entries", "freeze"] },
      { name: "Array", function: ["from", "isArray"] }
    ]
  };
}
