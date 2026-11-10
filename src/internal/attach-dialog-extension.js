/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function attachDialogExtension(root, prepareDialog = () => {}) {
  const aelluxJs = root.aelluxJs;
  const extensionName = "dialog";
  if (!aelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.aelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }

  aelluxJs.extAttach(extensionName, { init, destroy, show, showModal, close });

  function init() {
    for (const [name, method] of Object.entries({ show, showModal, close }))
      aelluxJs.comm.handle("dialog." + name, ({ element, args = [] }) => method(element, ...args), { owner: extensionName });
    aelluxJs.mountManager.add({
      // Lower priorities mount first, before ordinary consuming Extensions.
      extensionName, selector: "dialog", priority: -1,
      mount: element => prepareDialog(element),
      controllers: ["show", "showModal", "close"]
    });
  }

  function destroy() {
    aelluxJs.comm.removeOwner(extensionName);
    aelluxJs.mountManager.remove({ extensionName });
  }

  function show(element, ...args) { return element.show(...args); }
  function showModal(element, ...args) { return element.showModal(...args); }
  function close(element, ...args) { return element.close(...args); }
}
