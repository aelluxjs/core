/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import utilsNameCase from "./utils-name-case.js";
import { createControllerHelper } from "./create-controller-helper.js";

export function createMountHelper(root, extensionPromises, mountMaps, mountedElements, elementControllers) {
  const { toCapitalized, toCamelCase, fromCamelCase } = utilsNameCase;

  return { mount, unmount, update };

  async function update(rootOrSelector, extensionNames = null) {
    for (const rootElement of resolveRoots(rootOrSelector, "update")) {
      await AelluxJsForce(rootElement, "update", extensionNames);
    }
    return true;
  }

  async function unmount(rootOrSelector, extensionNames = null) {
    for (const rootElement of resolveRoots(rootOrSelector, "unmount")) {
      await AelluxJsForce(rootElement, "unmount", extensionNames);
    }
    return true;
  }

  async function mount(rootOrSelector, extensionNames = null) {
    const AelluxJs = root.AelluxJs;
    for (const rootElement of resolveRoots(rootOrSelector, "mount")) {
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
        Object.entries(root.AelluxJs.registry.ext)) {
        if (options.loadWhen) continue;
        waitExtensions.push(AelluxJs.wait(key));
      }
      await Promise.all(waitExtensions);

      await AelluxJsForce(rootElement, "mount", extensionNames);

      allWaiters.forEach(waiter => waiter.setAttribute("aria-busy", "false"));
    }
    return true;
  }

  async function AelluxJsForce(rootElement, method, extensionNames = null) {
    const AelluxJs = root.AelluxJs;
    if (typeof extensionNames === "string")
      extensionNames = [extensionNames];

    var filter;
    if (!extensionNames) {
      const mounterSelectors = Object.values(AelluxJs.registry.extMounters);
      const lazySelectors = Object.values(AelluxJs.registry.lazyExtSelectors);
      filter = [...mounterSelectors, ...lazySelectors];
    } else {
      filter = [];
      extensionNames = extensionNames.map(_ => fromCamelCase(_));

      for (const [key, selectorString] of Object.entries(AelluxJs.registry.extMounters))
        if (extensionNames.indexOf(fromCamelCase(key)) !== -1)
          filter.push(selectorString);

      for (const [key, selectorString] of Object.entries(AelluxJs.registry.lazyExtSelectors))
        if (extensionNames.indexOf(fromCamelCase(key)) !== -1)
          filter.push(selectorString);
    }

    if (filter.length === 0) return;

    const allElements = findElements(rootElement, filter.join(","));
    const updatedMounts = method === "update" ? new WeakMap() : null;
    for (const element of allElements) {
      const elementsAffected = new Set();
      var localExtensionNames;

      if (extensionNames) {
        localExtensionNames = new Set(extensionNames);
      } else {
        localExtensionNames = new Set();
        //Load needed lazies
        for (const [key, selector]
          of Object.entries(AelluxJs.registry.lazyExtSelectors))
          if (element.matches(selector) && filter.indexOf(selector) !== -1)
            localExtensionNames.add(fromCamelCase(key));

        //Mount readies
        for (const [key, selector]
          of Object.entries(AelluxJs.registry.extMounters))
          if (element.matches(selector) && filter.indexOf(selector) !== -1)
            localExtensionNames.add(fromCamelCase(key));
      }

      for (const extensionName of localExtensionNames) {
        const extensionPromise = method === "mount" ?
          AelluxJs.wait(extensionName) :
          extensionPromises[toCamelCase(extensionName)];
        if (!extensionPromise) { continue; }
        const extension = await extensionPromise;
        if (!extension) { continue; }
        const mounter = mountMaps.get(toCamelCase(extensionName));
        if (!mounter) { continue; }
        for (const [selector, controller] of mounter) {
          try {
            if (!controller[method]) { continue; }
            const mountableElements = findElements(element, selector);
            for (const mountable of mountableElements) {
              const mountId = `${extensionName}@${selector}`;
              if (method === "update") {
                if (!isMounted(mountable, mountId)) continue;
                let seen = updatedMounts.get(mountable);
                if (!seen) {
                  seen = new Set();
                  updatedMounts.set(mountable, seen);
                }
                if (seen.has(mountId)) continue;
                seen.add(mountId);
                await controller.update(mountable);
                continue;
              }
              const mounting = (method === "mount");
              if (mounting === isMounted(mountable, mountId)) continue;
              await controller[method](mountable);
              elementsAffected.add(mountable);
              setMounted(mountable, mountId, mounting);
              if (mounting) {
                let elementController = elementControllers.get(mountable);
                if (!elementController) {
                  elementController = createControllerHelper(root, mountable);
                  elementControllers.set(mountable, elementController);
                }
                elementController.spawn(
                  extensionName, mountId, controller.controllers,
                  typeof controller.update === "function"
                );
              } else {
                const elementController = elementControllers.get(mountable);
                if (elementController) {
                  elementController.despawn(mountId);
                  if (!elementController.hasMounts()) elementControllers.delete(mountable);
                }
              }
            }
          } catch (error) {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
              {
                cause: error,
                extension: extensionName,
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

  function resolveRoots(rootOrSelector, method) {
    if (!rootOrSelector) { return [document]; }
    if (typeof rootOrSelector === "string") {
      try { return Array.from(document.querySelectorAll(rootOrSelector)); }
      catch (error) {
        const diagnostics = root.AelluxJs.diagnostics;
        diagnostics.error(diagnostics.ERROR_MOUNT_ROOT_SELECTOR, {
          cause: error, selector: rootOrSelector, method
        });
        return [];
      }
    }
    if (
      rootOrSelector instanceof Element ||
      rootOrSelector instanceof Document ||
      rootOrSelector instanceof DocumentFragment
    ) { return [rootOrSelector]; }
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
}
