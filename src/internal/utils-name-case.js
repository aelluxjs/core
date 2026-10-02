/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Build-time exports only. Bundled callers keep these helpers inside their IIFE.
// The function bodies use ES5 syntax so they can also be bundled into the boot script.
function toCapitalized(name) {
  return name.replace(/^([a-z])|-([a-z])/g, function (_, first, afterHyphen) {
    return (first || afterHyphen).toUpperCase();
  });
}

function toCamelCase(name) {
  return name.replace(/-([a-z])/g, function (_, character) {
    return character.toUpperCase();
  });
}

function fromCamelCase(name) {
  return name.replace(/([A-Z])/g, "-$1").toLowerCase();
}

export default {
  toCapitalized,
  toCamelCase,
  fromCamelCase
};
