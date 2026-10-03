(() => {
  // src/aellux.ext.ajax-href.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function() {
    "use strict";
    const extensionName = "ajax-href";
    AelluxJs.extAttach(extensionName, { init, destroy, load });
    const attr = {
      ajaxHref: AelluxJs.attr(extensionName)
    };
    function init(options) {
      document.addEventListener("click", onClick);
    }
    function destroy() {
      document.removeEventListener("click", onClick);
      if (previousController) {
        previousController.abort();
      }
    }
    let previousController = null;
    async function load(url, selectors, options = {}) {
      options = options || {};
      if (previousController) {
        previousController.abort();
      }
      const controller = "AbortController" in window ? new AbortController() : { signal: null, abort: () => null };
      previousController = controller;
      const selectorList = (Array.isArray(selectors) ? selectors : selectors.split(",")).map((selector) => selector.trim()).filter(Boolean);
      const elements = /* @__PURE__ */ new Map();
      selectorList.forEach(function(selector) {
        const currentElement = document.querySelector(selector);
        if (!currentElement) return;
        elements.set(selector, currentElement);
        if (AelluxJs.ext.feedback) {
          AelluxJs.ext.feedback.busy(currentElement, "Ajax loading", true);
          AelluxJs.ext.feedback.progress(currentElement, "Ajax loading", 0);
        }
      });
      if (!options.ignoreHistory && AelluxJs.ext.stateNavigation) {
        AelluxJs.ext.stateNavigation.ajaxHref(url, selectors);
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
          if (selector === "title" && AelluxJs.ext.stateNavigation)
            AelluxJs.ext.stateNavigation.updateBaseTitle(replacement.innerText);
          await AelluxJs.update(replacement);
          if (AelluxJs.ext.feedback) {
            AelluxJs.ext.feedback.busy(replacement, "Ajax loaded", false);
            AelluxJs.ext.feedback.progress(replacement, "Ajax loaded", 1);
          }
        }
        AelluxJs.dispatch("AjaxHrefLoaded");
      } catch (error) {
        selectorList.forEach(function(selector) {
          const currentElement = elements.get(selector);
          if (!currentElement) return;
          if (AelluxJs.ext.feedback) {
            AelluxJs.ext.feedback.busy(currentElement, "Ajax loading", false);
            AelluxJs.ext.feedback.progress(currentElement, "Ajax loading", 1);
          }
        });
        AelluxJs.dispatch("AjaxHrefError");
        if (error.name === "AbortError") return null;
        throw error;
      } finally {
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
      AelluxJs.ext.ajaxHref.load(link.href, selectors);
    }
    function comparableUrl(value) {
      const url = new URL(value, window.location.href);
      return {
        origin: url.origin,
        href: `${url.origin}${url.pathname}${url.search}`,
        hash: url.hash
      };
    }
  })();
})();
//# sourceMappingURL=aellux.ext.ajax-href.js.map
