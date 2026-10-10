/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Declarative shape of the core browser API. Future validation scripts can read this
// module without loading a browser, executing the bootstrap, or calling API methods.
// Every listed property is required in its phase. `optionalProperties` lists fields
// created only after init() or by the full bundle. The planned Extension namespace
// keeps public Extension APIs at AelluxJs.ext.<camelCaseName> (also $ae.ext.<camelCaseName>).
// `dynamicProperties` describes those APIs; their names come from registry.ext.

(function (root) {
"use strict";

var method = Object.freeze({ type: "function" });
var text = Object.freeze({ type: "string" });
var flag = Object.freeze({ type: "boolean" });
var list = Object.freeze({ type: "array" });
var mediaQuery = Object.freeze({ type: ["object", "null"] });
var record = Object.freeze({ type: "object", additionalProperties: true });
var extensionNamespace = Object.freeze({
  type: "function",
  dynamicProperties: Object.freeze({
    namesFrom: "registry.ext",
    nameFormat: "camelCase",
    type: "object"
  })
});

var memory = Object.freeze({
  type: "object",
  properties: Object.freeze({
    get: method,
    set: method,
    getObject: method,
    setObject: method
  })
});

var mediaQueries = Object.freeze({
  type: "object",
  properties: Object.freeze({
    colorScheme: Object.freeze({
      type: "object",
      properties: Object.freeze({ light: mediaQuery, dark: mediaQuery })
    }),
    reducedMotion: Object.freeze({
      type: "object",
      properties: Object.freeze({ reduced: mediaQuery, "no-preference": mediaQuery })
    }),
    reducedTransparency: Object.freeze({
      type: "object",
      properties: Object.freeze({ reduced: mediaQuery, "no-preference": mediaQuery })
    }),
    forcedColors: Object.freeze({
      type: "object",
      properties: Object.freeze({ active: mediaQuery, "no-preference": mediaQuery })
    }),
    contrast: Object.freeze({
      type: "object",
      properties: Object.freeze({ more: mediaQuery, less: mediaQuery, "no-preference": mediaQuery })
    })
  })
});

var diagnosticDefinition = Object.freeze({
  type: "object",
  properties: Object.freeze({
    code: Object.freeze({ type: "number" }),
    message: text
  })
});

var diagnosticNames = [
  "ERROR_BOOTSTRAP_NOT_FOUND",
  "ERROR_NOT_INITIALIZED",
  "ERROR_INVALID_MODE",
  "ERROR_INVALID_VERBOSE_LEVEL",
  "ERROR_CONTROLLER_NOT_FOUND",
  "ERROR_MOUNT_ROOT_SELECTOR",
  "ERROR_MOUNT",
  "ERROR_EXTENSION_DUPLICATE",
  "ERROR_EXTENSION_INITIALIZE",
  "ERROR_EXTENSION_MOUNT",
  "ERROR_EXTENSION_UNMOUNT",
  "ERROR_EXTENSION_DESTROY",
  "ERROR_EXTENSION_INCOMPATIBLE",
  "ERROR_EXTENSION_SELECTOR",
  "ERROR_CALLBACK",
  "ERROR_EXTENSION_TRANSITION",
  "ERROR_EXTENSION_NOT_REGISTERED",
  "ERROR_PRESENT_CONTROL_TARGET_MISSING",
  "ERROR_EXTENSION_ATTACH",
  "ERROR_MOUNT_REGISTRATION",
  "ERROR_EXTENSION_LOAD_WHEN",
  "ERROR_LEGACY_RUNTIME_START",
  "ERROR_LEGACY_RUNTIME_LOAD",
  "ERROR_MODERN_RUNTIME_START",
  "ERROR_MODERN_RUNTIME_LOAD",
  "WARN_BROWSER_UNSUPPORTED",
  "WARN_BROWSER_CAPABILITIES",
  "WARN_INTERRUPTION",
  "WARN_INVALID_CONTROLLER_ELEMENT",
  "WARN_EXTENSION_STYLE_LOAD",
  "WARN_CONTROLLER_METHOD_MISSING",
  "WARN_STORAGE_FALLBACK",
  "WARN_PRESENT_MOTION_HIDDEN",
  "WARN_NAVIGATION_EVENT_INVALID",
  "INFO_LEGACY_FALLBACK"
];

var diagnosticProperties = {
  create: method,
  update: method,
  error: method,
  warn: method,
  info: method,
  showHistory: method,
  verboseLevel: Object.freeze({ type: "integer", "enum": Object.freeze([0, 1, 2]) }),
  levels: Object.freeze({
    type: "object",
    properties: Object.freeze({
      error: Object.freeze({ type: "integer", "const": 0 }),
      warn: Object.freeze({ type: "integer", "const": 1 }),
      info: Object.freeze({ type: "integer", "const": 2 })
    })
  })
};
diagnosticProperties.legacy = flag;
diagnosticProperties.supported = flag;
diagnosticProperties.notAvailable = list;
for (var i = 0; i < diagnosticNames.length; i++) {
  diagnosticProperties[diagnosticNames[i]] = diagnosticDefinition;
}

var bootstrapProperties = Object.freeze({
  shortJSName: Object.freeze({ type: "string", "const": "$ae" }),
  diagnostics: Object.freeze({
    type: "object",
    properties: Object.freeze(diagnosticProperties)
  }),
  options: Object.freeze({
    type: "object",
    properties: Object.freeze({
      mode: text,
      verboseLevel: Object.freeze({
        type: ["integer", "string"],
        "enum": Object.freeze([0, 1, 2, "error", "warn", "info"])
      }),
      forceLegacy: flag,
      basePath: Object.freeze({ type: ["string", "null"] }),
      extensions: record
    })
  }),
  minified: flag,
  waitLayout: Object.freeze({ type: "null" }),
  mountManager: Object.freeze({ type: "null" }),
  init: method,
  persist: Object.freeze({
    type: "object",
    properties: Object.freeze({ local: memory, session: memory, preferences: memory })
  }),
  updatePreferenceAttributesHTML: method,
  on: method,
  off: method,
  attr: method,
  attrMem: Object.freeze({
    type: "object",
    properties: Object.freeze({ save: method, restore: method })
  }),
  className: method,
  extFilename: method,
  extName: method,
  eventName: method,
  noConflict: method,
  registry: Object.freeze({
    type: "object",
    properties: Object.freeze({
      ext: record,
      dep: record,
      lazyExtSelectors: record,
      extMounters: record,
      preferenceMediaQueries: mediaQueries
    })
  }),
  ext: extensionNamespace,
  extAttach: method,
  startAelluxJs: method,
  destroy: method,
  destroyExtensions: method,
  dispatchFrom: method,
  dispatch: method,
  wait: method,
  mount: method,
  unmount: method,
  request: method
});

var layoutScheduler = Object.freeze({
  type: "object",
  properties: Object.freeze({ read: method, update: method, clear: method })
});

var runtimeProperties = {};
for (var property in bootstrapProperties) {
  if (Object.prototype.hasOwnProperty.call(bootstrapProperties, property)) {
    runtimeProperties[property] = bootstrapProperties[property];
  }
}
runtimeProperties.waitLayout = layoutScheduler;
runtimeProperties.mountManager = Object.freeze({
  type: "object",
  properties: Object.freeze({
    add: method, remove: method, mount: method, unmount: method, update: method,
    controller: method, initialAttribute: method, destroy: method
  })
});

var aelluxApiContract = Object.freeze({
  // Both browser globals must reference the same object.
  globals: Object.freeze(["AelluxJs", "$ae"]),
  bootstrap: Object.freeze({
    type: "function",
    properties: bootstrapProperties,
    optionalProperties: Object.freeze({ aelluxBasePath: text })
  }),
  runtime: Object.freeze({
    type: "function",
    properties: Object.freeze(runtimeProperties),
    optionalProperties: Object.freeze({
      aelluxBasePath: text,
      bundledExtensions: record
    })
  })
});

// A classic script exposes the contract globally; CommonJS consumers use the same object.
root.aelluxApiContract = aelluxApiContract;
if (typeof module !== "undefined" && module.exports) {
  module.exports = aelluxApiContract;
}
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
