/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Focus Extension
 *
 * Purpose: reserves the `[data-ae-focus]` mounting contract for future focus
 * management behavior.
 *
 * Capability profile: infrastructure scaffold. The current implementation has
 * no operational interaction, state or focus-management capability.
 *
 * Inputs and activation: marked elements are discoverable by the mount manager,
 * but the current mount and unmount callbacks perform no work.
 *
 * Outputs and owned state: none. It does not move, trap, restore or expose focus.
 *
 * Lifecycle: the current scaffold allocates no resources.
 *
 * Accessibility limitation: this extension must not be treated as an
 * accessibility feature. Consumers remain responsible for focus order,
 * visibility, restoration and keyboard behavior until a contract is built and
 * tested.
 */

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "focus";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  const attr = {
    extensionName: AelluxJs.attr(extensionName)
  };

  AelluxJs.extAttach(extensionName, { init, destroy });

  function init(options) {
    AelluxJs.mountManager.add({
      extensionName, selector: `[${attr.extensionName}]`,
      mount: mountElement, unmount: unmountElement
    });
  }

  function destroy() {
    AelluxJs.mountManager.remove({ extensionName });
  }

  function mountElement(element) {
  }

  function unmountElement(element) {
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
