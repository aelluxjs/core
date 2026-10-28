/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Return the native exception to callers that own configuration diagnostics.
// Keep this helper ES5-compatible: it is also included in the boot bundle.
export function validateSelector(document, value) {
  if (typeof value !== "string" || !value.trim())
    return { value: value, reason: "Expected a nonempty selector string." };
  try {
    document.querySelector(value);
    return null;
  } catch (cause) {
    return { value: value, reason: "Invalid CSS selector.", cause: cause };
  }
}

export function createSelectorHelper(document) {
  function isValidSelector(value) {
    return validateSelector(document, value) === null;
  }

  function parseSelectors(value, onInvalid) {
    var list = [];
    var inputs = Array.isArray(value) ? value : [value];
    function reject(input, reason, cause) {
      if (typeof onInvalid === "function")
        onInvalid({ value: input, reason: reason, cause: cause });
      return null;
    }
    function append(input, start, end) {
      var selector = input.slice(start, end).trim();
      var invalid = validateSelector(document, selector);
      if (invalid) {
        reject(input, "Invalid CSS selector.", invalid.cause);
        return false;
      }
      if (list.indexOf(selector) === -1) list.push(selector);
      return true;
    }
    for (var inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
      var input = inputs[inputIndex];
      if (typeof input !== "string" || !input.trim())
        return reject(input, "Expected a nonempty selector string or array of strings.");
      var start = 0, stack = [], quote = null, comment = false;
      for (var index = 0; index < input.length; index++) {
        var char = input[index];
        if (comment) {
          if (char === "*" && input[index + 1] === "/") { comment = false; index++; }
          continue;
        }
        if (char === "\\") { index++; continue; }
        if (quote) { if (char === quote) quote = null; continue; }
        if (char === "/" && input[index + 1] === "*") { comment = true; index++; continue; }
        if (char === '"' || char === "'") { quote = char; continue; }
        if (char === "(" || char === "[") stack.push(char);
        if (char === ")" || char === "]") {
          if (stack.pop() !== (char === ")" ? "(" : "["))
            return reject(input, "Invalid CSS selector.");
        }
        if (char === "," && !stack.length) {
          if (!append(input, start, index)) return null;
          start = index + 1;
        }
      }
      // Validate the final region before reporting structural errors, retaining
      // the browser's original exception for malformed selectors such as "[".
      if (!append(input, start, input.length)) return null;
      if (quote || stack.length || comment)
        return reject(input, "Unbalanced CSS selector.");
    }
    if (!list.length) return reject(value, "Expected at least one CSS selector.");
    return list;
  }

  return { isValidSelector: isValidSelector, parseSelectors: parseSelectors };
}
