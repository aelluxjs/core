/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Required compatibility: ES5. This helper is bundled into the aellux.js boot script and must not
// introduce runtime syntax or APIs that prevent the Legacy fallback path from being reached.

export function buildDiagnostics(catalog) {
  var levels = { error: 0, warn: 1, info: 2 };
  var consoleMethods = ["error", "warn", "info"];
  var historyLimit = 100;
  var history = [];
  var historyStart = 0;
  // This is deliberately bounded by history: diagnostics are often emitted from
  // observers and an unbounded "already reported" cache would itself leak.
  var identities = [];
  var resourceIds = typeof WeakMap === "function" ? new WeakMap() : null;
  var nextResourceId = 1;
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
      var count = Math.min(lines, history.length);
      var entries = [];
      for (var i = 0; i < count; i++) {
        entries.push(history[(historyStart + history.length - count + i) % history.length]);
      }
      if (typeof console !== "undefined" && typeof console.log === "function") {
        for (var j = 0; j < entries.length; j++) {
          var entry = entries[j];
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
    var identity = diagnosticIdentity(definition, context);
    if (identities.indexOf(identity) !== -1) return diagnostics.create(definition, context);
    var diagnostic = diagnostics.create(definition, context);
    var entry = {
      timestamp: new Date().toISOString(),
      level: level,
      code: definition.code,
      message: definition.message,
      context: context
    };
    if (history.length < historyLimit) {
      history.push(entry);
      identities.push(identity);
    } else {
      identities[historyStart] = identity;
      history[historyStart] = entry;
      historyStart = (historyStart + 1) % historyLimit;
    }
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

  function diagnosticIdentity(definition, context) {
    return String(definition.code) + "|" + identityValue(context, []);
  }

  function identityValue(value, seen) {
    if (value === null) return "null";
    var type = typeof value;
    if (type !== "object" && type !== "function") return type + ":" + String(value);
    if (value && value.nodeType) return "element:" + resourceId(value);
    if (seen.indexOf(value) !== -1) return "circular";
    seen.push(value);
    var result;
    if (Array.isArray(value)) {
      result = "[" + value.map(function (item) { return identityValue(item, seen); }).join(",") + "]";
    } else {
      var keys = Object.keys(value).sort();
      result = "{" + keys.map(function (key) {
        return key + ":" + identityValue(value[key], seen);
      }).join(",") + "}";
    }
    seen.pop();
    return result;
  }

  function resourceId(resource) {
    if (!resourceIds) return String(resource);
    var id = resourceIds.get(resource);
    if (!id) { id = nextResourceId++; resourceIds.set(resource, id); }
    return id;
  }

  for (var name in catalog) {
    if (Object.prototype.hasOwnProperty.call(catalog, name)) {
      diagnostics[name] = catalog[name];
    }
  }
  return diagnostics;
}
