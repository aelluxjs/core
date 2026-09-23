/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Aellux Legacy orchestrator placeholder.
// The functional ES5 runtime remains part of the 0.1.0-beta milestone.

(function (root) {
  "use strict";

  var Aellux = root.Aellux;
  if (!Aellux) return;

  if (root.console && typeof root.console.warn === "function") {
    root.console.warn("[Aellux] Legacy orchestrator is not implemented yet.");
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
