/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Required compatibility: ES5. This helper is bundled into the Aellux boot script and must not
// introduce runtime syntax or APIs that prevent the Legacy fallback path from being reached.

export function buildDiagnostics(catalog) {
  var diagnostics = {
    create: function (definition, context) {
      var error = new Error(definition.message);
      error.name = "AelluxDiagnosticError";
      error.code = definition.code;
      if (context) error.context = context;
      return error;
    },
    report: function (definition, context) {
      var error = diagnostics.create(definition, context);
      if (typeof console !== "undefined" && typeof console.error === "function") {
        console.error(
          "[Aellux " + definition.code + "] " + definition.message,
          context || ""
        );
      }
      return error;
    }
  };

  for (var name in catalog) {
    if (Object.prototype.hasOwnProperty.call(catalog, name)) {
      diagnostics[name] = catalog[name];
    }
  }
  return diagnostics;
}
