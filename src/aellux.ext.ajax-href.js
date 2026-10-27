/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/**
 * Ajax Href Extension
 *
 * Purpose: replaces selected page regions with matching content from an HTML
 * response and coordinates their unmount and mount lifecycle.
 *
 * Capability profile: asynchronous content navigation with optional history
 * and feedback integration.
 *
 * Inputs and activation: Full initializes lazily for a[data-ae-ajax-href]. The
 * attribute accepts a CSS selector list, defaulting to title,body when empty;
 * load(url, selectors, options) also
 * accepts selector arrays. Click interception handles eligible same-origin links.
 *
 * Outputs and owned state: replaces the first match for each selector, preserves
 * regions missing from the response, and emits AjaxHref lifecycle events. It
 * requests history and title updates and publishes optional busy/progress feedback.
 *
 * Lifecycle: a new request aborts the previous one when supported. Snapshot
 * restoration reloads recorded regions without pushing history. Destruction
 * removes listeners and aborts the pending request.
 *
 * Accessibility: keeps native anchor behavior for modified clicks, fragments,
 * downloads and other excluded links. Applications must provide useful hrefs
 * and manage focus and announcements after content replacement.
 */

import { validateHTMLSource } from "./internal/validate-html-source.js";

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "ajax-href";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  AelluxJs.extAttach(extensionName, { init, destroy, load });
  const attribute = AelluxJs.attr(extensionName);

  function init() {
    document.addEventListener("click", onClick);
    AelluxJs.on("SnapshotRestore", OnSnapshotRestoreAjax);
  }

  function destroy() {
    document.removeEventListener("click", onClick);
    AelluxJs.off("SnapshotRestore", OnSnapshotRestoreAjax);
    if (previousController) { previousController.abort(); }
    previousController = null;
  }

  let previousController = null;

  async function load(url, selectors, options = {}) {
    options = options || {};
    const selectorList = AelluxJs.parseSelectors(selectors, invalid =>
      selectorDiagnostic(invalid.value, invalid.reason));
    if (!selectorList) return null;
    const elements = new Map();
    for (const selector of selectorList) {
      const currentElement = document.querySelector(selector);
      if (currentElement) elements.set(selector, currentElement);
      else selectorDiagnostic(selector, "No current element matches the selector.");
    }
    if (!elements.size) return null;
    if (previousController) { previousController.abort(); }
    const controller =
      "AbortController" in window ?
        new AbortController() :
        { signal: null, abort: () => null };
    previousController = controller;

    elements.forEach(currentElement => updateFeedback(currentElement, true));

    AelluxJs.dispatch("AjaxHrefStart", { detail: { url, selectors } });

    try {
      const response = await AelluxJs.request(url, { signal: controller.signal });
      const html = await response.text();
      if (previousController !== controller) return null;
      validateHTMLSource(AelluxJs, html, response.url || String(url));
      const loadedDocument = new DOMParser().parseFromString(html, "text/html");
      let historyRequested = false;

      for (const selector of selectorList) {
        if (previousController !== controller) return null;
        const currentElement = elements.get(selector);
        if (!currentElement) continue;

        const loadedElement = loadedDocument.querySelector(selector);
        if (!loadedElement || await AelluxJs.unmount(currentElement) === false) {
          if (!loadedElement)
            selectorDiagnostic(selector, "No response element matches the selector.", currentElement);
          updateFeedback(currentElement, false);
          continue;
        }

        const replacement = document.importNode(loadedElement, true);
        if (previousController !== controller) return null;
        // Commit navigation only after a response region has passed its unmount
        // veto. Keep the new base URL in effect when mounting imported content.
        if (!historyRequested && !options.ignoreHistory) {
          AelluxJs.dispatch("PushAjaxReplace", { detail: { url, selectors } });
          historyRequested = true;
        }
        currentElement.parentNode.replaceChild(replacement, currentElement);

        if (selector === "title") {
          AelluxJs.dispatch("UpdateBaseTitle", {
            detail: { title: replacement.textContent }
          });
        }

        await AelluxJs.mount(replacement);

        updateFeedback(replacement, false, "Ajax loaded");
      }

      AelluxJs.dispatch("AjaxHrefLoaded", { detail: { url, selectors } });
    }
    catch (error) {
      elements.forEach(currentElement => updateFeedback(currentElement, false));
      // Superseded requests must not report failures for the active navigation.
      if (previousController !== controller) return null;
      if (controller.signal?.aborted || error?.name === "AbortError") return null;

      const status = error?.response?.status ?? error?.status ?? null;
      AelluxJs.dispatch("AjaxHrefError", { detail: { url, selectors, error, status } });
      throw error;
    }
    finally {
      if (previousController === controller)
        previousController = null;
      AelluxJs.dispatch("AjaxHrefComplete", { detail: { url, selectors } });
    }
  }

  function updateFeedback(element, busy, label = "Ajax loading") {
    const feedback = AelluxJs.ext.feedback;
    if (!feedback) return;
    feedback.busy(label, element, busy);
    feedback.progress(label, element, busy ? 0 : 1);
  }

  function selectorDiagnostic(value, reason, element = null) {
    AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_TARGET, {
      extension: extensionName, element, attribute, value, reason,
      suggestion: "Use valid CSS selectors identifying content in both the current document and the AJAX response."
    });
  }

  function onClick(event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const target = event.target && event.target.nodeType === 1
      ? event.target : event.target && event.target.parentElement;
    const link = target && target.closest(`a[${attribute}]`);
    if (!link || !link.href || link.tagName !== "A") return;
    const rawHref = link.getAttribute("href");
    if (link.target && link.target !== "_self") return;
    if (rawHref && rawHref.startsWith("#")) return;
    if (link.hasAttribute("download") || link.hasAttribute("data-no-ajax")) return;

    const selectors = link.getAttribute(attribute).trim() || "title,body";

    const destinyUrl = comparableUrl(link.href);
    const currentUrl = comparableUrl(window.location.href);
    if (destinyUrl.origin !== currentUrl.origin) {
      AelluxJs.dispatch("AjaxHrefDropOrigin");
      return;
    }
    if (destinyUrl.href === currentUrl.href) {
      if (destinyUrl.hash && destinyUrl.hash !== currentUrl.hash) return;
      event.preventDefault();
      const url = link.href;
      AelluxJs.dispatch("AjaxHrefStart", { detail: { url, selectors } });
      AelluxJs.dispatch("AjaxHrefLoaded", { detail: { url, selectors } });
      AelluxJs.dispatch("AjaxHrefComplete", { detail: { url, selectors } });
      return;
    }

    event.preventDefault();
    // The error event reports failures from fire-and-forget navigation.
    load(link.href, selectors).catch(() => {});
  }

  function OnSnapshotRestoreAjax(event) {
    if (!event.detail || !event.detail.popState) return;

    const state = event.detail.popState;
    if (state.ajaxReplace) {
      const url = state.ajaxReplace.url;
      const selectors = state.ajaxReplace.selectors;
      load(url, selectors, { ignoreHistory: true }).catch(() => {});
    }
  }

  function comparableUrl(value) {
    const url = new URL(value, window.location.href);
    return {
      origin: url.origin,
      href: `${url.origin}${url.pathname}${url.search}`,
      hash: url.hash
    };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
