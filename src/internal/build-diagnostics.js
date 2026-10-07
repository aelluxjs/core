/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Required compatibility: ES5. This helper is bundled into the aellux.js boot script and must not
// introduce runtime syntax or APIs that prevent the Legacy fallback path from being reached.

export function buildDiagnostics(catalog) {
  var levels = { error: 0, warn: 1, info: 2 };
  var consoleMethods = ["error", "warn", "info"];
  var history = [];
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
        requestedLevel !== levels.info) {
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
    error: function (definition, context) {
      return emit(levels.error, definition, context);
    },
    warn: function (definition, context) {
      return emit(levels.warn, definition, context);
    },
    info: function (definition, context) {
      return emit(levels.info, definition, context);
    },
    showHistory: function (lines) {
      if (typeof lines === "undefined") lines = history.length;
      if (typeof lines !== "number" || !isFinite(lines) ||
        lines < 0 || lines !== Math.floor(lines)) {
        throw new RangeError("diagnostics.showHistory(lines) requires a non-negative integer.");
      }
      var entries = history.slice(Math.max(0, history.length - lines));
      if (typeof console !== "undefined" && typeof console.log === "function") {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          var message = "[" + entry.timestamp + "] [aellux.js " +
            entry.code + "] " + entry.message;
          if (entry.context) console.log(message, entry.context);
          else console.log(message);
        }
      }
      return entries;
    }
  };

  function getVerboseLevel() {
    return diagnostics.verboseLevel;
  }

  function emit(level, definition, context) {
    var diagnostic = diagnostics.create(definition, context);
    history.push({
      timestamp: new Date().toISOString(),
      level: level,
      code: definition.code,
      message: definition.message,
      context: context
    });
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
