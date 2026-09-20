/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

(function () {
  "use strict";

  const extensionName = "state-navigation";
  const globalSnapshot = {};

  Aellux.extRegister(extensionName, {
    init, destroy,
    tabOpen, ajaxHref, flowStep, formUpdate, updateBaseTitle,
    normalize,
    globalSnapshot
  });

  const globalRemoveSnapshot = {};
  let globalSnapshotString = "";
  let skipHashChange = null;
  let baseTitle = "";
  let useHash = true;

  function init() {
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);

    if ("useHash" in Aellux.options) { useHash = Aellux.options.useHash; }

    baseTitle = document.title;
    onHashChange();
    history.replaceState({
      aelluxState: true,
      snapshot: Object.assign({}, globalSnapshot)
    }, "");
  }

  async function destroy() {
    window.removeEventListener("popstate", onPopState);
    window.removeEventListener("hashchange", onHashChange);
  }

  function updateBaseTitle(title) {

  }

  function tabOpen(tabGroupId, tabId, title) {
    return change(tabGroupId, tabId, title);
  }

  function ajaxHref(url, selectors) {
    history.replaceState({ aelluxState: true, snapshot: globalSnapshot, ajaxHref: selectors }, "", window.location.href);
    updateSnapshotData();
    history.pushState({ aelluxState: true, snapshot: null, ajaxHref: selectors }, "", url);
  }

  function flowStep(flowId, step, options) {

  }

  function formUpdate(formId, event, value, options) {

  }

  function normalize(key, value, title = undefined, silent) {
    return change(key, value, title, silent);
  }

  async function change(key, value, title, silent = false) {
    if (globalSnapshot.title === title &&
      globalSnapshot[key] === value) return;

    if (title) globalSnapshot.title = title.replace(/\s+/g, " ");
    else delete globalSnapshot.title;

    globalSnapshot[key] = value;
    updateSnapshotData(snapshotToString(globalSnapshot));

    const state = { aelluxState: true, snapshot: Object.assign({}, globalSnapshot) };
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

  function dispatchSnapshotEvent(name) {
    document.title = (globalSnapshot.title || false) ?
      `${globalSnapshot.title} - ${baseTitle}` :
      baseTitle;

    const options = {
      detail: {
        snapshot: globalSnapshot,
        removeSnapshot: globalRemoveSnapshot
      },
      bubbles: true
    };
    Aellux.dispatch(name, options);
  }

  function dispatchEventRestore() {
    return dispatchSnapshotEvent("SnapshotRestore");
  }

  function onHashChange() {
    if (!useHash) return;
    if (skipHashChange === window.location.hash) { skipHashChange = null; return; }
    updateSnapshotData(window.location.hash.substring(1));
    dispatchEventRestore();
  }

  function onPopState(event) {
    const browserState = event.state;
    if (!browserState || !browserState.aelluxState) return;

    if (browserState.ajaxHref && Aellux.ajaxHref) {
      Aellux.ajaxHref.load(
        window.location.href,
        browserState.ajaxHref,
        { ignoreHistory: true }
      );
    }

    if (browserState.snapshot) {
      updateSnapshotData(snapshotToString(browserState.snapshot));
      dispatchEventRestore();
    } else if (useHash) {
      updateSnapshotData(window.location.hash.substring(1));
      dispatchEventRestore();
    }

    if (!useHash) return;
    skipHashChange = window.location.hash;
    setTimeout(function () {
      if (skipHashChange === window.location.hash)
        skipHashChange = null;
    }, 0);
  }
})();
