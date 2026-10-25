(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/internal/find-duplicate-attributes.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function findDuplicateAttributes(html) {
    const duplicates = [];
    const space = /[\t\n\f\r ]/;
    const lower = (text) => text.replace(/[A-Z]/g, (char) => char.toLowerCase());
    let index = 0, lineIndex = 0, line = 1, column = 1;
    while ((index = html.indexOf("<", index)) !== -1) {
      if (html.startsWith("<!--", index)) {
        const end = /--!?>/.exec(html.slice(index + 4));
        index = end ? index + 4 + end.index + end[0].length : html.length;
        continue;
      }
      if (html.startsWith("<![CDATA[", index)) {
        const end = html.indexOf("]]>", index + 9);
        index = end < 0 ? html.length : end + 3;
        continue;
      }
      if (/[!?/]/.test(html[index + 1] || "")) {
        const end = html.indexOf(">", index + 2);
        index = end < 0 ? html.length : end + 1;
        continue;
      }
      if (!/[a-z]/i.test(html[index + 1] || "")) {
        index++;
        continue;
      }
      const tagStart = ++index;
      while (index < html.length && !space.test(html[index]) && !/[/>]/.test(html[index])) index++;
      const tagName = lower(html.slice(tagStart, index));
      const attributes = /* @__PURE__ */ new Map();
      while (index < html.length && html[index] !== ">") {
        if (space.test(html[index]) || html[index] === "/") {
          index++;
          continue;
        }
        const offset = index++;
        while (index < html.length && !space.test(html[index]) && !/[=/>]/.test(html[index])) index++;
        const attribute = lower(html.slice(offset, index).replace(/\0/g, "\uFFFD"));
        while (space.test(html[index] || "")) index++;
        let value = "";
        if (html[index] === "=") {
          index++;
          while (space.test(html[index] || "")) index++;
          const quote = html[index];
          if (quote === '"' || quote === "'") {
            const start = ++index;
            while (index < html.length && html[index] !== quote) index++;
            value = html.slice(start, index);
            if (index < html.length) index++;
          } else {
            const start = index;
            while (index < html.length && !space.test(html[index]) && html[index] !== ">") index++;
            value = html.slice(start, index);
          }
        }
        const previous = attributes.get(attribute);
        if (previous) {
          previous.values.push(value);
          if (!previous.duplicate) {
            while (lineIndex < offset) {
              const char = html[lineIndex++];
              if (char === "\r" || char === "\n" && html[lineIndex - 2] !== "\r") {
                line++;
                column = 1;
              } else if (char !== "\n") column++;
            }
            previous.duplicate = { tagName, attribute, value: previous.values[0], values: previous.values, offset, line, column };
          }
        } else attributes.set(attribute, { values: [value] });
      }
      if (index >= html.length) break;
      for (const attribute of attributes.values())
        if (attribute.duplicate) duplicates.push(attribute.duplicate);
      index++;
      if (tagName === "plaintext") break;
      if (/^(script|style|textarea|title|xmp|iframe|noembed|noframes|noscript)$/.test(tagName)) {
        const closing = new RegExp(`</${tagName}(?=[\\t\\n\\f\\r />])`, "ig");
        closing.lastIndex = index;
        const end = closing.exec(html);
        index = end ? end.index : html.length;
      }
    }
    return duplicates;
  }

  // src/internal/report-configuration.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function reportConfiguration(api, name, context) {
    if (context.element && context.attribute && !("value" in context))
      context.value = context.element.getAttribute(context.attribute);
    return api.diagnostics.warn(api.diagnostics[name], context);
  }

  // src/internal/validate-html-source.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function validateHTMLSource(api, html, source) {
    if (api.options.environment !== "development") return;
    for (const duplicate of findDuplicateAttributes(html)) {
      const { attribute } = duplicate;
      reportConfiguration(api, "WARN_ATTRIBUTE_DUPLICATE", __spreadProps(__spreadValues({
        extension: "core",
        source
      }, duplicate), {
        reason: `The ${attribute} attribute occurs more than once on the same start tag; the HTML parser keeps the first value and discards the others.`,
        suggestion: attribute === "class" ? "Combine all class names in one class attribute, separated by spaces." : attribute === "style" ? "Combine the intended CSS declarations in one style attribute, separated by semicolons." : `Keep one ${attribute} attribute with the intended value.`
      }));
    }
  }

  // src/aellux.ext.ajax-href.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
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
      if (previousController) {
        previousController.abort();
      }
      previousController = null;
    }
    let previousController = null;
    async function load(url, selectors, options = {}) {
      options = options || {};
      const selectorList = parseSelectors(selectors);
      if (!selectorList) return null;
      const elements = /* @__PURE__ */ new Map();
      for (const selector of selectorList) {
        const currentElement = document.querySelector(selector);
        if (currentElement) elements.set(selector, currentElement);
        else selectorDiagnostic(selector, "No current element matches the selector.");
      }
      if (!elements.size) return null;
      if (previousController) {
        previousController.abort();
      }
      const controller = "AbortController" in window ? new AbortController() : { signal: null, abort: () => null };
      previousController = controller;
      elements.forEach((currentElement) => updateFeedback(currentElement, true));
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
      } catch (error) {
        elements.forEach((currentElement) => updateFeedback(currentElement, false));
        AelluxJs.dispatch("AjaxHrefError");
        if (error.name === "AbortError") return null;
        throw error;
      } finally {
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
        extension: extensionName,
        element,
        attribute,
        value,
        reason,
        suggestion: "Use valid CSS selectors identifying content in both the current document and the AJAX response."
      });
    }
    function parseSelectors(selectors) {
      const list = [];
      for (const input of Array.isArray(selectors) ? selectors : [selectors]) {
        if (typeof input !== "string" || !input.trim()) {
          selectorDiagnostic(input, "Expected a nonempty selector string or array of strings.");
          return null;
        }
        let start = 0, depth = 0, quote = null;
        for (let index = 0; index <= input.length; index++) {
          const char = input[index];
          if (char === "\\") {
            index++;
            continue;
          }
          if (quote) {
            if (char === quote) quote = null;
            continue;
          }
          if (char === '"' || char === "'") {
            quote = char;
            continue;
          }
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
      const target = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
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
})();
//# sourceMappingURL=aellux.ext.ajax-href.js.map
