(() => {
  // src/internal/attach-dialog-extension.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function attachDialogExtension(root, prepareDialog = () => {
  }) {
    const AelluxJs = root.AelluxJs;
    const extensionName = "dialog";
    if (!AelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    AelluxJs.extAttach(extensionName, { init, destroy, show, showModal, close });
    function init() {
      AelluxJs.mountManager.add({
        // Lower priorities mount first, before ordinary consuming Extensions.
        extensionName,
        selector: "dialog",
        priority: -1,
        mount: (element) => prepareDialog(element),
        controllers: ["show", "showModal", "close"]
      });
    }
    function destroy() {
      AelluxJs.mountManager.remove({ extensionName });
    }
    function show(element, ...args) {
      return element.show(...args);
    }
    function showModal(element, ...args) {
      return element.showModal(...args);
    }
    function close(element, ...args) {
      return element.close(...args);
    }
  }

  // src/aellux.ext.dialog.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  attachDialogExtension(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.dialog.js.map
