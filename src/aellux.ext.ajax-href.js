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
 * attribute accepts a CSS selector list; load(url, selectors, options) also
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

(function (root) {
  "use strict";

  const AelluxJs = root.AelluxJs;
  const extensionName = "ajax-href";
  if (!AelluxJs) {
    throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
  }
  AelluxJs.extAttach(extensionName, { init, destroy, load });
  const attr = {
    ajaxHref: AelluxJs.attr(extensionName)
  };

  function init() {
    document.addEventListener("click", onClick);
    AelluxJs.on("SnapshotRestore", OnSnapshotRestoreAjax);
  }

  function destroy() {
    document.removeEventListener("click", onClick);
    AelluxJs.off("SnapshotRestore", OnSnapshotRestoreAjax);
    if (previousController) { previousController.abort(); }
  }

  let previousController = null;

  async function load(url, selectors, options = {}) {
    options = options || {};
    const selectorList = parseSelectors(selectors);
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

    elements.forEach(function (currentElement) {
      //feedback busy/progress
      if (AelluxJs.ext.feedback) {
        AelluxJs.ext.feedback.busy(currentElement, "Ajax loading", true);
        AelluxJs.ext.feedback.progress(currentElement, "Ajax loading", 0);
      }
      //AJAX PROGRESS UPDATE VALUE
    });

    if (!("ignoreHistory" in options) || !options.ignoreHistory) {
      AelluxJs.dispatch(
        "PushAjaxReplace",
        { detail: { url, selectors } }
      );
    }

    AelluxJs.dispatch("AjaxHrefStart");

    try {
      const response = await AelluxJs.request(url, { signal: controller.signal });
      const html = await response.text();
      const loadedDocument = new DOMParser().parseFromString(html, "text/html");

      for (const selector of selectorList) {
        const currentElement = elements.get(selector);
        if (!currentElement) continue;

        const loadedElement = loadedDocument.querySelector(selector);
        if (!loadedElement || await AelluxJs.unmount(currentElement) === false) {
          if (!loadedElement)
            selectorDiagnostic(selector, "No response element matches the selector.", currentElement);
          if (AelluxJs.ext.feedback) {
            AelluxJs.ext.feedback.busy(currentElement, "Ajax loading", false);
            AelluxJs.ext.feedback.progress(currentElement, "Ajax loading", 1);
          }
          continue;
        }

        const replacement = document.importNode(loadedElement, true);
        currentElement.parentNode.replaceChild(replacement, currentElement);

        if (selector === "title") {
          AelluxJs.dispatch("UpdateBaseTitle", {
            detail: { title: replacement.textContent }
          });
        }

        await AelluxJs.mount(replacement);

        //feedback busy/progress
        if (AelluxJs.ext.feedback) {
          AelluxJs.ext.feedback.busy(replacement, "Ajax loaded", false);
          AelluxJs.ext.feedback.progress(replacement, "Ajax loaded", 1);
        }
      }

      AelluxJs.dispatch("AjaxHrefLoaded");
    }
    catch (error) {
      selectorList.forEach(function (selector) {
        const currentElement = elements.get(selector);
        if (!currentElement) return;
        //feedback busy/progress
        if (AelluxJs.ext.feedback) {
          AelluxJs.ext.feedback.busy(currentElement, "Ajax loading", false);
          AelluxJs.ext.feedback.progress(currentElement, "Ajax loading", 1);
        }
      });

      AelluxJs.dispatch("AjaxHrefError");

      if (error.name === "AbortError") return null;
      throw error;
    }
    finally {
      if (previousController === controller)
        previousController = null;
      AelluxJs.dispatch("AjaxHrefComplete");
    }
  }

  function selectorDiagnostic(value, reason, element = null) {
    AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_TARGET, {
      extension: extensionName, element, attribute: attr.ajaxHref, value, reason,
      suggestion: "Use valid CSS selectors identifying content in both the current document and the AJAX response."
    });
  }

  function parseSelectors(selectors) {
    const list = [];
    // Split only top-level commas, preserving :is(), attribute values and escapes.
    for (const input of Array.isArray(selectors) ? selectors : [selectors]) {
      if (typeof input !== "string" || !input.trim()) {
        selectorDiagnostic(input, "Expected a nonempty selector string or array of strings.");
        return null;
      }
      let start = 0, depth = 0, quote = null;
      for (let index = 0; index <= input.length; index++) {
        const char = input[index];
        if (char === "\\") { index++; continue; }
        if (quote) { if (char === quote) quote = null; continue; }
        if (char === '"' || char === "'") { quote = char; continue; }
        if (char === "(" || char === "[") depth++;
        if (char === ")" || char === "]") depth--;
        if (index === input.length || char === "," && depth === 0) {
          const selector = input.slice(start, index).trim();
          try {
            if (!selector) throw new SyntaxError("Empty selector");
            document.querySelector(selector);
          } catch (_) {
            selectorDiagnostic(input, "Invalid CSS selector.");
            return null;
          }
          if (!list.includes(selector)) list.push(selector);
          start = index + 1;
        }
      }
      if (quote || depth !== 0) {
        selectorDiagnostic(input, "Unbalanced CSS selector.");
        return null;
      }
    }
    if (!list.length) {
      selectorDiagnostic(selectors, "Expected at least one CSS selector.");
      return null;
    }
    return list;
  }

  function onClick(event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const target = event.target && event.target.nodeType === 1
      ? event.target : event.target && event.target.parentElement;
    const link = target && target.closest(`a[${attr.ajaxHref}]`);
    if (!link || !link.href || link.tagName !== "A") return;
    const rawHref = link.getAttribute("href");
    if (link.target && link.target !== "_self") return;
    if (rawHref && rawHref.startsWith("#")) return;
    if (link.hasAttribute("download") || link.hasAttribute("data-no-ajax")) return;

    const selectors = link.getAttribute(attr.ajaxHref);
    if (!selectors) return;

    const destinyUrl = comparableUrl(link.href);
    const currentUrl = comparableUrl(window.location.href);
    if (destinyUrl.origin !== currentUrl.origin) {
      AelluxJs.dispatch("AjaxHrefDropOrigin");
      return;
    }
    if (destinyUrl.href === currentUrl.href) {
      if (destinyUrl.hash && destinyUrl.hash !== currentUrl.hash) return;
      event.preventDefault();
      AelluxJs.dispatch("AjaxHrefStart");
      AelluxJs.dispatch("AjaxHrefLoaded");
      AelluxJs.dispatch("AjaxHrefComplete");
      return;
    }

    event.preventDefault();
    load(link.href, selectors);
  }

  function OnSnapshotRestoreAjax(event) {
    if (!event.detail || !event.detail.popState) return;

    const state = event.detail.popState;
    if (state.ajaxReplace) {
      const url = state.ajaxReplace.url;
      const selectors = state.ajaxReplace.selectors;
      load(url, selectors, { ignoreHistory: true });
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
