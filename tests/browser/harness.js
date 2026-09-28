/*! aellux.js validation examples | SPDX-License-Identifier: Apache-2.0 */

(function (root) {
  "use strict";

  function setResult(status, message) {
    var output = document.getElementById("validation-result");
    document.documentElement.setAttribute("data-test-status", status);
    document.documentElement.setAttribute("data-test-message", message);
    if (!output) {
      output = document.createElement("pre");
      output.id = "validation-result";
      document.body.appendChild(output);
    }
    output.textContent = status.toUpperCase() + ": " + message;
  }

  root.AelluxJsValidation = {
    run: function (test, timeout) {
      var completed = false;
      var timer = setTimeout(function () {
        if (!completed) setResult("failed", "AelluxJsReady timeout");
      }, timeout || 15000);

      function assert(condition, message) {
        if (!condition) throw new Error(message);
      }

      AelluxJs.on("Ready", function onReady() {
        AelluxJs.off("Ready", onReady);
        try {
          var result = test(assert);
          if (result && typeof result.then === "function") {
            result.then(pass, fail);
          } else {
            pass();
          }
        } catch (error) {
          fail(error);
        }
      });

      function pass() {
        completed = true;
        clearTimeout(timer);
        setResult("passed", "Scenario completed successfully");
      }

      function fail(error) {
        completed = true;
        clearTimeout(timer);
        setResult("failed", error && error.message ? error.message : String(error));
      }
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
