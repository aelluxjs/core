(function () {
  "use strict";


  const extensionName = "tab-group";
  const attr = {
    tabGroup: Aellux.attr(extensionName),
    tabPanel: Aellux.attr("tab-panel"),
    tab: Aellux.attr("tab"),
    title: Aellux.attr("title"),
    ready: Aellux.attr("ready"),
  }
  const modifier = {
    active: Aellux.className("active")
  }
  const mountDOM = new Map();
  const controllers = new WeakMap();

  Aellux.extRegister(extensionName, { init, destroy, mountDOM });

  function init() {
    mountDOM.set(`[${attr.tabGroup}]`, { mount: mountTabGroup, unmount: unmountTabGroup });
    Aellux.on("SnapshotRestore", onSnapshotRestore);
  }
  async function destroy() {
    Aellux.off("SnapshotRestore", onSnapshotRestore);
  }

  function mountTabGroup(tabGroupContainer) {
    updateController(tabGroupContainer);
  }

  function unmountTabGroup(tabGroupContainer) {
    const adaptiveController = controllers.get(tabGroupContainer);
    if (!adaptiveController) return;
    tabGroupContainer.removeEventListener("keydown", adaptiveController.onkeydown);
    tabGroupContainer.removeEventListener("click", adaptiveController.onclick);
    controllers.delete(tabGroupContainer);
  }

  function onSnapshotRestore(event) {
    if (!event.detail) return;
    const detail = event.detail;
    for (const tabGroupContainer of Object.keys(controllers)) {
      snapshotRestoreController(tabGroupContainer, detail);
    }
  }

  function updateController(tabGroup) {
    if (!controllers.has(tabGroup)) {
      const controller = _createController(tabGroup);
      controllers.set(tabGroup, controller);

      tabGroup.addEventListener("keydown", controller.onkeydown);
      tabGroup.addEventListener("click", controller.onclick);

      controller.changeTab(loadPersistTab(tabGroup), false);
      Aellux.wait("state-navigation").then(() => { snapshotNormalization(tabGroup); });
      Aellux.dispatchFrom(tabGroup, "TabsReady", { detail: null });
    }
  }

  function snapshotRestoreController(tabGroup, detail) {
    const controller = controllers.get(tabGroup);
    if (!controller) return;
    if (!detail || !detail.snapshot) return;

    let tab = null;
    if (tabGroup.id in detail.snapshot) {
      const tabId = detail.snapshot[tabGroup.id];
      tab = tabGroup.querySelector(`#${tabId}`);
    }
    if (!tab) return;
    if (tab.getAttribute("aria-selected") === "false") // Prevent select what is already
      controller.changeTab(tab, true);
  }

  function _createController(tabGroup) {
    tabGroup.id = tabGroup.id || "tabGroup";
    tabGroup.setAttribute("role", "tablist");

    tabGroup.querySelectorAll(`[${attr.tab}]`).forEach(tab => {
      const panelId = tab.getAttribute(attr.tab);
      tab.id = tab.id || `${tabGroup.id}-tab-${panelId}`;
      tab.setAttribute("aria-controls", panelId);
      tab.setAttribute("aria-selected", false);
      tab.setAttribute("role", "tab");
      const panel = document.querySelector(`#${panelId}`);
      panel.setAttribute(attr.tabPanel, panelId);
      //Se tiver LI de parent role=presentation
    });

    return {
      tabGroupId: tabGroup.id,
      currentSelectedTab: null,
      onkeydown(event) {

      },
      onclick(event) {
        const target = event.target;
        const tab = target.closest(`[${attr.tab}]`);
        if (!tab) return;

        const controller = controllers.get(tabGroup);
        const showTitle = tab.hasAttribute(attr.title);
        const title = tab.getAttribute(attr.title) || tab.innerText;
        controller.changeTab(tab, true);
        if (Aellux.stateNavigation) Aellux.stateNavigation.tabOpen(
          tabGroup.id,
          tab.id,
          showTitle ? title : undefined
        );
      },
      changeTab(currentTab, save) {
        const controller = controllers.get(tabGroup);
        if (controller.currentSelectedTab !== currentTab) {
          tabGroup.querySelectorAll(`[${attr.tab}]`).forEach((tab) => {
            if (currentTab === false) { currentTab = tab; }
            const selected = tab === currentTab || tab.id === currentTab;
            if (selected && currentTab !== tab) currentTab = tab;

            const panelId = tab.getAttribute(attr.tab);
            tab.setAttribute("aria-selected", selected);
            tab.setAttribute("tabindex", selected ? 0 : -1);
            const panel = document.querySelector(`#${panelId}`);
            if (panel) panel.classList.toggle(modifier.active, selected);
          });
          Aellux.dispatchFrom(currentTab, "TabsChange", { detail: controller });
        }
        if (save) savePersistTab(tabGroup, currentTab);
        controller.currentSelectedTab = currentTab;
      }
    };
  }

  function savePersistTab(tabGroup, tab) {
    if (tabGroup.hasAttribute("data-aellux-persist")) {
      const where = tabGroup.getAttribute("data-aellux-persist") || "session";
      if (where === "local" || where === "session") {
        Aellux.persist[where].set("current-tab-" + tabGroup.id, tab.id);
      }
    }
  }

  function loadPersistTab(tabGroup) {
    var current = false;

    if (tabGroup.hasAttribute("data-aellux-persist")) {
      const where = tabGroup.getAttribute("data-aellux-persist") || "session";
      if (where === "local" || where === "session") {
        current = Aellux.persist[where].get("current-tab-" + tabGroup.id, false);
      }
    }
    return current;
  }

  function snapshotNormalization(tabGroup) {
    const adaptiveController = controllers.get(tabGroup);
    const tabGroupId = adaptiveController.tabGroupId;
    const tab = adaptiveController.currentSelectedTab;
    const snapshot = Aellux.stateNavigation.globalSnapshot;

    if (!tab || !snapshot ||
      (tabGroupId in snapshot && snapshot[tabGroupId] === tab.id))
      return; //SNAPSHOT ALIGNED

    //SNAPSHOT WRONG? UPDATE SILENTLY
    if (Aellux.stateNavigation) Aellux.stateNavigation.normalize(tabGroupId, tab.id, tab.innerText, true);
  }
})();
