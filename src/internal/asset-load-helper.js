/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Required compatibility: ES5. This helper may be bundled into the Aellux boot script and must not
// introduce runtime syntax or APIs that prevent the Legacy fallback path from being reached.

export function assetLoadHelper(asset, options) {
  var loadCallback = options.loadCallback;
  var errorCallback = options.errorCallback;

  function clear() {
    asset.onload = null;
    asset.onerror = null;
  }

  asset.onload = function (event) {
    clear();
    if (typeof loadCallback === "function") {
      return loadCallback(event);
    }
  };

  asset.onerror = function (event) {
    clear();
    if (typeof errorCallback === "function") {
      return errorCallback(event);
    }
  };

  document.head.appendChild(asset);

  return { clear: clear };
}
