/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import nameCase from "./utils-name-case.js";

export function createMountHelper(root, extensionPromises) {
  const { toCapitalized, toCamelCase, fromCamelCase } = nameCase;

  const mountedElements = new WeakMap(); //DOM, string Set

  async function AelluxJsForceUnmount(rootOrSelector, extensionLabels = null) {
    for (const rootElement of resolveRoots(rootOrSelector)) {
      await AelluxJsForce(rootElement, "unmount", extensionLabels);
    }
    return true;
  }

  async function AelluxJsForceUpdate(rootOrSelector, extensionLabels = null) {
    const AelluxJs = root.AelluxJs;
    for (const rootElement of resolveRoots(rootOrSelector)) {
      const allWaiters = findElements(rootElement, AelluxJs.attr("wait-mounted"));
      allWaiters.forEach(waiter => waiter.setAttribute("aria-busy", "true"));

      const allLinks = findElements(rootElement, "link[rel='aelluxjs-ext']");
      for (const link of allLinks) {
        const href = link.getAttribute("href");
        const loadWhen = link.getAttribute(AelluxJs.attr("load-when")) || undefined;
        const builds = link.getAttribute(AelluxJs.attr("builds")) || undefined;
        const loadStyleValue = link.getAttribute(AelluxJs.attr("load-style"));
        const loadStyle = loadStyleValue === null || loadStyleValue === "false"
          ? false
          : loadStyleValue || true;
        link.setAttribute("rel", "aelluxjs-ext-registered");
        AelluxJs.ext(href, { builds, loadWhen, loadStyle });
      }

      const waitExtensions = [];
      for (const [key, options] of
        Object.entries(root.AelluxJs.extRegistry)) {
        if (options.loadWhen) continue;
        waitExtensions.push(AelluxJs.wait(key));
      }
      await Promise.all(waitExtensions);

      await AelluxJsForce(rootElement, "mount", extensionLabels);

      allWaiters.forEach(waiter => waiter.setAttribute("aria-busy", "false"));
    }
    return true;
  }

  async function AelluxJsForce(rootElement, method, extensionLabels = null) {
    const AelluxJs = root.AelluxJs;
    if (typeof extensionLabels === "string")
      extensionLabels = [extensionLabels];

    var filter;
    if (!extensionLabels) {
      const mounterSelectors = Object.values(AelluxJs.extensionMounters);
      const lazySelectors = Object.values(AelluxJs.lazyExtensionSelectors);
      filter = [...mounterSelectors, ...lazySelectors];
    } else {
      filter = [];
      extensionLabels = extensionLabels.map(_ => fromCamelCase(_));

      for (const [key, selectorString] of Object.entries(AelluxJs.extensionMounters))
        if (extensionLabels.indexOf(fromCamelCase(key)) !== -1)
          filter.push(selectorString);

      for (const [key, selectorString] of Object.entries(AelluxJs.lazyExtensionSelectors))
        if (extensionLabels.indexOf(fromCamelCase(key)) !== -1)
          filter.push(selectorString);
    }

    if (filter.length === 0) return;

    const allElements = findElements(rootElement, filter.join(","));
    for (const element of allElements) {
      const elementsAffected = new Set();
      var localExtensionLabels;

      if (extensionLabels) {
        localExtensionLabels = new Set(extensionLabels);
      } else {
        localExtensionLabels = new Set();
        //Load needed lazies
        for (const [key, selector]
          of Object.entries(AelluxJs.lazyExtensionSelectors))
          if (element.matches(selector) && filter.indexOf(selector) !== -1)
            localExtensionLabels.add(fromCamelCase(key));

        //Mount readies
        for (const [key, selector]
          of Object.entries(AelluxJs.extensionMounters))
          if (element.matches(selector) && filter.indexOf(selector) !== -1)
            localExtensionLabels.add(fromCamelCase(key));
      }

      for (const extensionLabel of localExtensionLabels) {
        const extensionPromise = method === "mount" ?
          AelluxJs.wait(extensionLabel) :
          extensionPromises[toCamelCase(extensionLabel)];
        if (!extensionPromise) { continue; }
        const extension = await extensionPromise;
        if (!extension || !extension.mountMap) { continue; }
        const mounter = extension.mountMap;
        for (const [selector, controller] of mounter) {
          try {
            if (!controller[method]) { continue; }
            const mountableElements = findElements(element, selector);
            for (const mountable of mountableElements) {
              const mountId = `${extensionLabel}@${selector}`;
              const mounting = (method === "mount");
              if (mounting === isMounted(mountable, mountId)) continue;
              await controller[method](mountable);
              elementsAffected.add(mountable);
              setMounted(mountable, mountId, mounting);
            }
          } catch (error) {
            AelluxJs.diagnostics.report(
              AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
              {
                cause: error,
                extension: extensionLabel,
                method,
                selector
              }
            );
          }
        }
      }

      for (const affected of elementsAffected) {
        affected.classList.toggle(
          AelluxJs.className("mounted"),
          isMounted(affected)
        );
      }
    }
    AelluxJs.dispatch(toCapitalized(method));
  }

  function resolveRoots(root) {
    if (!root) { return [document]; }
    if (typeof root === "string") {
      try { return Array.from(document.querySelectorAll(root)); }
      catch (error) { return []; }
    }
    if (
      root instanceof Element ||
      root instanceof Document ||
      root instanceof DocumentFragment
    ) { return [root]; }
    return [];
  }

  function findElements(root, selector) {
    const elements = [];
    if (
      root.nodeType === Node.ELEMENT_NODE &&
      root.matches(selector)
    ) { elements.push(root); }
    if (root.querySelectorAll) {
      root.querySelectorAll(selector)
        .forEach(function (element) {
          elements.push(element);
        });
    }
    return elements;
  }

  function isMounted(element, mountId = null) {
    const mounts = mountedElements.get(element);
    if (!mounts) return false;
    return mountId ? mounts.has(mountId) : mounts.size > 0;
  }

  function setMounted(element, mountId, mounted = true) {
    if (!mountedElements.has(element)) {
      mountedElements.set(element, new Set());
    }
    const mounts = mountedElements.get(element);
    mounts[mounted ? "add" : "delete"](mountId);
    if (mounts.size === 0) mountedElements.delete(element);
  }

  return {
    AelluxJsForceUpdate,
    AelluxJsForceUnmount
  };
}
