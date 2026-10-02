/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Declarative shape of the core browser API. Future validation scripts can read this
// module without loading a browser, executing the bootstrap, or calling API methods.
// Every listed property is required in its phase. `optionalProperties` lists fields
// created only after init() or by the full bundle. The planned Extension namespace
// keeps public Extension APIs at AelluxJs.ext.<camelCaseName> (also $ae.ext.<camelCaseName>).
// `dynamicProperties` describes those APIs; their names come from extRegistry.

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
    namesFrom: "extRegistry",
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
  "ERROR_EXTENSION_DUPLICATE",
  "ERROR_EXTENSION_INITIALIZE",
  "ERROR_EXTENSION_MOUNT",
  "ERROR_EXTENSION_UNMOUNT",
  "ERROR_EXTENSION_DESTROY",
  "ERROR_EXTENSION_INCOMPATIBLE",
  "ERROR_LEGACY_RUNTIME_START",
  "ERROR_LEGACY_RUNTIME_LOAD"
];

var diagnosticProperties = { create: method, report: method };
for (var i = 0; i < diagnosticNames.length; i++) {
  diagnosticProperties[diagnosticNames[i]] = diagnosticDefinition;
}

var bootstrapProperties = Object.freeze({
  shortJSName: Object.freeze({ type: "string", "const": "$ae" }),
  diagnostics: Object.freeze({ type: "object", properties: Object.freeze(diagnosticProperties) }),
  options: Object.freeze({
    type: "object",
    properties: Object.freeze({
      mode: text,
      forceLegacy: flag,
      basePath: Object.freeze({ type: ["string", "null"] })
    })
  }),
  minified: flag,
  legacy: flag,
  supported: flag,
  notAvailable: list,
  waitLayout: Object.freeze({ type: "null" }),
  init: method,
  persist: Object.freeze({
    type: "object",
    properties: Object.freeze({ local: memory, session: memory, preferences: memory })
  }),
  updatePreferencesAttributesHTML: method,
  on: method,
  off: method,
  attr: method,
  className: method,
  extFilename: method,
  extLabel: method,
  eventName: method,
  noConflict: method,
  lazyExtensionSelectors: record,
  extensionMounters: record,
  extRegistry: record,
  ext: extensionNamespace,
  extRegister: method,
  startAelluxJs: method,
  destroy: method,
  destroyExtensions: method,
  dispatchFrom: method,
  dispatch: method,
  wait: method,
  update: method,
  unmount: method,
  request: method,
  preferencesMediaQueries: mediaQueries
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

var aelluxApiContract = Object.freeze({
  // Both browser globals must reference the same object.
  globals: Object.freeze(["AelluxJs", "$ae"]),
  bootstrap: Object.freeze({
    type: "object",
    properties: bootstrapProperties,
    optionalProperties: Object.freeze({ aelluxBasePath: text })
  }),
  runtime: Object.freeze({
    type: "object",
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
