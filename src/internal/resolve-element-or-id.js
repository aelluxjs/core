/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function resolveElementOrId(root, elementOrId, options = {}) {
  const fallback = options.defaultElement;
  if ((elementOrId === undefined || elementOrId === null) && fallback) {
    return fallback;
  }

  const requested = elementOrId;
  if (typeof elementOrId === "string") {
    const id = elementOrId.trim().replace(/^#/, "");
    elementOrId = id ? root.document.getElementById(id) : null;
  }

  const allowedNodeTypes = options.allowedNodeTypes || [root.Node.ELEMENT_NODE];
  if (elementOrId && allowedNodeTypes.indexOf(elementOrId.nodeType) !== -1) {
    return elementOrId;
  }

  const diagnostics = root.AelluxJs.diagnostics;
  diagnostics.warn(diagnostics.WARN_INVALID_ELEMENT_OR_ID, {
    elementOrId: requested,
    method: options.method
  });
  return null;
}
