/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// TODO: Test state-navigation when the same extension runs in an iframe and
// its parent page. Iframe history, hash, and state synchronization are not
// covered by the current tests; iframe compatibility is not yet verified.

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "state-navigation";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  const globalSnapshot = {};

  AelluxJs.extAttach(extensionName, {
    init, destroy,
    tabOpen, ajaxReplace, flowStep, formFocus, updateBaseTitle,
    setState,
    globalSnapshot
  });

  const globalRemoveSnapshot = {};
  let globalSnapshotString = "";
  let skipHashChange = null;
  let baseTitle = "";
  let useHash = true;

  function init(options) {
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);
    AelluxJs.on("SnapshotRestore", OnSnapshotRestoreAjax);

    if ("useHash" in AelluxJs.options) { useHash = AelluxJs.options.useHash; }

    baseTitle = document.title;
    onHashChange();
    history.replaceState({
      aelluxJsState: true,
      snapshot: Object.assign({}, globalSnapshot)
    }, "");
  }

  async function destroy() {
    window.removeEventListener("popstate", onPopState);
    window.removeEventListener("hashchange", onHashChange);
    AelluxJs.off("SnapshotRestore", OnSnapshotRestoreAjax);
  }

  function updateBaseTitle(title) {
    baseTitle = title;
  }

  function tabOpen(tabGroupId, tabId, title) {
    return change(tabGroupId, tabId, title);
  }

  function flowStep(flowId, stepId, title) {
    return change(flowId, stepId, title);
  }

  function formFocus(formId, focusId, title) {
    return change(formId, focusId, title);
  }

  function ajaxReplace(url, selectors) {
    const currentState = {
      aelluxJsState: true,
      snapshot: globalSnapshot,
      ajaxReplace: { url: window.location.href, selectors }
    }, targetState = {
      aelluxJsState: true,
      snapshot: null,
      ajaxReplace: { url, selectors }
    };

    history.replaceState(currentState, "", window.location.href);
    updateSnapshotData();
    history.pushState(targetState, "", url);
  }

  function setState(key, value, title = undefined, silent = false) {
    return change(key, value, title, silent);
  }

  async function change(key, value, title = undefined, silent = false) {
    if (globalSnapshot.title === title &&
      globalSnapshot[key] === value) return;

    if (title) globalSnapshot.title = title.replace(/\s+/g, " ");
    else delete globalSnapshot.title;

    globalSnapshot[key] = value;
    updateSnapshotData(snapshotToString(globalSnapshot));

    const state = { aelluxJsState: true, snapshot: Object.assign({}, globalSnapshot) };
    const url = useHash ? `#${globalSnapshotString}` : undefined;

    if (silent) history.replaceState(state, "", url);
    else history.pushState(state, "", url);

    dispatchSnapshotEvent("SnapshotChange");
  }

  function updateSnapshotData(string) {
    globalSnapshotString = string;

    for (const key in globalRemoveSnapshot) { delete globalRemoveSnapshot[key]; } //CLEAR
    Object.assign(globalRemoveSnapshot, globalSnapshot); //OLD

    for (const key in globalSnapshot) { delete globalSnapshot[key]; } //CLEAR
    (new URLSearchParams(string)).forEach((value, key) => globalSnapshot[key] = value); //NEW

    for (const key in globalRemoveSnapshot) { //FILTER REMOVED 
      if (key in globalSnapshot) { delete globalRemoveSnapshot[key]; }
    }
  }

  function snapshotToString(snapshot) {
    return (new URLSearchParams(snapshot || {})).toString();
  }

  function dispatchSnapshotEvent(name, browserState = undefined) {
    document.title = (globalSnapshot.title || false) ?
      `${globalSnapshot.title} - ${baseTitle}` :
      baseTitle;

    const options = {
      detail: {
        snapshot: globalSnapshot,
        removeSnapshot: globalRemoveSnapshot,
        browserState
      },
      bubbles: true
    };
    AelluxJs.dispatch(name, options);
  }

  function onHashChange() {
    if (!useHash) return;
    if (skipHashChange === window.location.hash) { skipHashChange = null; return; }
    updateSnapshotData(window.location.hash.substring(1));
    dispatchSnapshotEvent("SnapshotRestore");
  }

  function onPopState(event) {
    const browserState = event.state;
    if (!browserState || !browserState.aelluxJsState) return;

    if (browserState.snapshot)
      updateSnapshotData(snapshotToString(browserState.snapshot));
    else if (useHash)
      updateSnapshotData(window.location.hash.substring(1));
    else
      updateSnapshotData("");

    dispatchSnapshotEvent("SnapshotRestore", browserState);

    if (!useHash) return;
    skipHashChange = window.location.hash;
    setTimeout(function () {
      if (skipHashChange === window.location.hash)
        skipHashChange = null;
    }, 0);
  }

  function OnSnapshotRestoreAjax(event) {
    if (!event.detail || !event.detail.browserState) return;

    const state = event.detail.browserState;
    if (state.ajaxReplace) {
      const url = state.ajaxReplace.url;
      const selectors = state.ajaxReplace.selectors;
      const extAjaxHref = AelluxJs.ext.ajaxHref;
      if (extAjaxHref && typeof extAjaxHref.load === "function") {
        extAjaxHref.load(url, selectors, { ignoreHistory: true });
      } else {
        AelluxJs.diagnostics.warn(
          AelluxJs.diagnostics.WARN_NAVIGATION_AJAX_HREF_UNAVAILABLE,
          { url, selectors }
        );
      }
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
