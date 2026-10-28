/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function resolveElementOrId(root, elementOrId, options) {
  options = options || {};
  var fallback = options.defaultElement;
  if ((elementOrId === undefined || elementOrId === null) && fallback) {
    return fallback;
  }

  var requested = elementOrId;
  if (typeof elementOrId === "string") {
    var id = elementOrId.trim().replace(/^#/, "");
    elementOrId = id ? root.document.getElementById(id) : null;
  }

  var allowedNodeTypes = options.allowedNodeTypes || [root.Node.ELEMENT_NODE];
  if (elementOrId && allowedNodeTypes.indexOf(elementOrId.nodeType) !== -1) {
    return elementOrId;
  }

  var diagnostics = root.AelluxJs.diagnostics;
  diagnostics.warn(diagnostics.WARN_INVALID_ELEMENT_OR_ID, {
    elementOrId: requested,
    method: options.method
  });
  return null;
}
