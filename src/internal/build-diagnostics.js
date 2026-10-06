/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Required compatibility: ES5. This helper is bundled into the aellux.js boot script and must not
// introduce runtime syntax or APIs that prevent the Legacy fallback path from being reached.

export function buildDiagnostics(catalog) {
  var levels = { error: 0, warn: 1, announce: 2 };
  var consoleMethods = ["error", "warn", "info"];
  var diagnostics = {
    legacy: false,
    supported: false,
    notAvailable: [],
    levels: levels,
    verboseLevel: levels.error,
    update: function (options) {
      var requestedLevel = options &&
        Object.prototype.hasOwnProperty.call(options, "verboseLevel")
        ? options.verboseLevel : diagnostics.verboseLevel;
      if (typeof requestedLevel === "string" &&
        Object.prototype.hasOwnProperty.call(levels, requestedLevel)) {
        requestedLevel = levels[requestedLevel];
      }
      if (requestedLevel !== levels.error &&
        requestedLevel !== levels.warn &&
        requestedLevel !== levels.announce) {
        throw diagnostics.create(diagnostics.ERROR_INVALID_VERBOSE_LEVEL);
      }
      diagnostics.verboseLevel = requestedLevel;
      return requestedLevel;
    },
    create: function (definition, context) {
      var error = new Error(definition.message);
      error.name = "AelluxJsDiagnosticError";
      error.code = definition.code;
      if (context) error.context = context;
      return error;
    },
    report: function (definition, context) {
      return emit(levels.error, definition, context);
    },
    warn: function (definition, context) {
      return emit(levels.warn, definition, context);
    },
    announce: function (definition, context) {
      return emit(levels.announce, definition, context);
    }
  };

  function getVerboseLevel() {
    return diagnostics.verboseLevel;
  }

  function emit(level, definition, context) {
    var diagnostic = diagnostics.create(definition, context);
    var verboseLevel = getVerboseLevel();
    var consoleMethod = consoleMethods[level];
    if ((level === levels.error || level <= verboseLevel) &&
      typeof console !== "undefined" && typeof console[consoleMethod] === "function") {
      console[consoleMethod](
        "[aellux.js " + definition.code + "] " + definition.message,
        context || ""
      );
    }
    return diagnostic;
  }

  for (var name in catalog) {
    if (Object.prototype.hasOwnProperty.call(catalog, name)) {
      diagnostics[name] = catalog[name];
    }
  }
  return diagnostics;
}
