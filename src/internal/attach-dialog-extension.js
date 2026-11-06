/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function attachDialogExtension(root, prepareDialog = () => {}) {
  const AelluxJs = root.AelluxJs;
  const extensionName = "dialog";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }

  AelluxJs.extAttach(extensionName, { init, destroy, show, showModal, close });

  function init() {
    for (const [name, method] of Object.entries({ show, showModal, close }))
      AelluxJs.comm.handle("dialog." + name, ({ element, args = [] }) => method(element, ...args), { owner: extensionName });
    AelluxJs.mountManager.add({
      // Lower priorities mount first, before ordinary consuming Extensions.
      extensionName, selector: "dialog", priority: -1,
      mount: element => prepareDialog(element),
      controllers: ["show", "showModal", "close"]
    });
  }

  function destroy() {
    AelluxJs.comm.removeOwner(extensionName);
    AelluxJs.mountManager.remove({ extensionName });
  }

  function show(element, ...args) { return element.show(...args); }
  function showModal(element, ...args) { return element.showModal(...args); }
  function close(element, ...args) { return element.close(...args); }
}
