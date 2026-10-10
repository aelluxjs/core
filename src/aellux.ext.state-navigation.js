/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * State Navigation Extension
 *
 * Purpose: coordinates browser history entries, hash state, document titles and
 * saved DOM snapshots for navigation flows controlled by Aellux events.
 *
 * Capability profile: structure and state, with browser-history and application
 * integration.
 *
 * Inputs and activation: listens for popstate, hash changes and the extension's
 * push, replace and title command events. Init options configure snapshot limits
 * and title behavior.
 *
 * Outputs and owned state: merges its namespace into `history.state`, stores
 * bounded snapshots and dispatches restoration/navigation events. It does not
 * replace document content itself.
 *
 * Lifecycle: removes browser and document listeners and clears the in-memory
 * snapshot registry when destroyed.
 *
 * Accessibility and scope: consumers replacing content must manage focus,
 * document structure and status announcements after navigation. Coordination
 * across parent documents and iframes is outside the validated 0.1.0 scope.
 */

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
    updateBaseTitle, setState,
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
    AelluxJs.on("PushAjaxReplace", OnPushAjaxReplace);
    AelluxJs.on("UpdateBaseTitle", OnUpdateBaseTitle);

    if ("useHash" in AelluxJs.options)
      useHash = AelluxJs.options.useHash;

    baseTitle = document.title;
    onHashChange();
    history.replaceState(mergeHistoryState({
      aelluxJsState: true,
      snapshot: Object.assign({}, globalSnapshot)
    }), "");
  }

  async function destroy() {
    window.removeEventListener("popstate", onPopState);
    window.removeEventListener("hashchange", onHashChange);
    AelluxJs.off("PushAjaxReplace", OnPushAjaxReplace);
    AelluxJs.off("UpdateBaseTitle", OnUpdateBaseTitle);
  }

  function updateBaseTitle(title = null) {
    baseTitle = title ?? baseTitle;
    document.title = (globalSnapshot.title || false) ?
      `${globalSnapshot.title} - ${baseTitle}` :
      baseTitle;
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

    if (silent) history.replaceState(mergeHistoryState(state), "", url);
    else history.pushState(state, "", url);

    dispatchSnapshotEvent("SnapshotChange");
  }

  function updateSnapshotData(string = "") {
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

  function dispatchSnapshotEvent(name, popState = undefined) {
    updateBaseTitle();

    const options = {
      detail: {
        snapshot: globalSnapshot,
        removeSnapshot: globalRemoveSnapshot,
        popState
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
    const popState = event.state;
    if (!popState || !popState.aelluxJsState) return;

    if (popState.snapshot)
      updateSnapshotData(snapshotToString(popState.snapshot));
    else if (useHash)
      updateSnapshotData(window.location.hash.substring(1));
    else
      updateSnapshotData();

    dispatchSnapshotEvent("SnapshotRestore", popState);

    if (!useHash) return;
    skipHashChange = window.location.hash;
    setTimeout(function () {
      if (skipHashChange === window.location.hash)
        skipHashChange = null;
    }, 0);
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

    history.replaceState(mergeHistoryState(currentState), "", window.location.href);
    updateSnapshotData();
    history.pushState(targetState, "", url);
  }

  function mergeHistoryState(state) {
    const currentState = history.state;
    if (!currentState || typeof currentState !== "object" || Array.isArray(currentState))
      return state;
    return Object.assign({}, currentState, state);
  }

  function OnPushAjaxReplace(event) {
    try {
      const detail = event && event.detail;
      if (!detail || typeof detail !== "object" ||
        typeof detail.url !== "string" || !detail.url.trim() ||
        !Object.prototype.hasOwnProperty.call(detail, "selectors") ||
        detail.selectors == null) {
        AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
          extension: extensionName, event: "PushAjaxReplace",
          expected: "detail: { url: non-empty string, selectors: value }"
        });
        return;
      }
      ajaxReplace(detail.url, detail.selectors);
    } catch (cause) {
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_CALLBACK, {
        extension: extensionName, event: "PushAjaxReplace", cause
      });
    }
  }

  function OnUpdateBaseTitle(event) {
    try {
      const detail = event && event.detail;
      if (!detail || typeof detail !== "object" ||
        !Object.prototype.hasOwnProperty.call(detail, "title") ||
        typeof detail.title !== "string") {
        AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_NAVIGATION_EVENT_INVALID, {
          extension: extensionName, event: "UpdateBaseTitle",
          expected: "detail: { title: string }"
        });
        return;
      }
      updateBaseTitle(detail.title);
    } catch (cause) {
      AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_CALLBACK, {
        extension: extensionName, event: "UpdateBaseTitle", cause
      });
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
