/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

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

  function init(options) {
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
    if (previousController) { previousController.abort(); }
    const controller =
      "AbortController" in window ?
        new AbortController() :
        { signal: null, abort: () => null };
    previousController = controller;

    const selectorList = (
      Array.isArray(selectors) ?
        selectors :
        selectors.split(",")
    ).map(selector => selector.trim())
      .filter(Boolean);

    const elements = new Map();

    selectorList.forEach(function (selector) {
      const currentElement = document.querySelector(selector);
      if (!currentElement) return;
      elements.set(selector, currentElement);
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
        if (!loadedElement) continue;

        await AelluxJs.unmount(currentElement);

        const replacement = document.importNode(loadedElement, true);
        currentElement.replaceWith(replacement);

        if (selector === "title") {
          AelluxJs.dispatch("UpdateBaseTitle", {
            detail: { title: replacement.innerText }
          });
        }

        await AelluxJs.update(replacement);

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

  function onClick(event) {
    if (event.button !== 0) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest(`[${attr.ajaxHref}]`);
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