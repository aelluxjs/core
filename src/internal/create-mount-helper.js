/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import utilsNameCase from "./utils-name-case.js";
import { createControllerHelper } from "./create-controller-helper.js";

export function createMountHelper(root, mountMaps, mountedElements, elementControllers) {
  const { toCapitalized, toCamelCase, fromCamelCase } = utilsNameCase;
  const initialAttributeValues = new WeakMap();
  const mountAttributeRecords = new WeakMap();
  const pendingMounts = new WeakMap();
  const pendingUnmounts = new WeakMap();
  const classPrefix = root.AelluxJs.className("");

  return { mount, unmount, unmountDetached, update, initialAttribute };

  function initialAttribute(element, name) {
    return initialAttributeValues.get(element)?.initial.get(name) ?? null;
  }

  async function update(rootOrSelector, extensionNames = null) {
    for (const rootElement of resolveRoots(rootOrSelector, "update")) {
      await AelluxJsMounted(rootElement, "update", extensionNames);
    }
    return true;
  }

  async function unmount(rootOrSelector, extensionNames = null) {
    for (const rootElement of resolveRoots(rootOrSelector, "unmount")) {
      await AelluxJsMounted(rootElement, "unmount", extensionNames);
    }
    return true;
  }

  async function unmountDetached() {
    if (![...mountedElements.keys()].some(element => !element.isConnected)) return false;
    await AelluxJsMounted(root.document, "unmount", null, true);
    return true;
  }

  async function mount(rootOrSelector, extensionNames = null) {
    const AelluxJs = root.AelluxJs;
    const newlyMounted = new Set();
    for (const rootElement of resolveRoots(rootOrSelector, "mount")) {
      const waitMountedAttr = AelluxJs.attr("wait-mounted");
      const allWaiters = findElements(rootElement, `[${waitMountedAttr}]`);
      allWaiters.forEach(waiter => waiter.setAttribute("aria-busy", "true"));
      try {
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

        await AelluxJsMount(rootElement, extensionNames, newlyMounted);

      } catch (error) {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_MOUNT, {
          cause: error, root: rootElement, extensions: extensionNames
        });
      } finally {
        allWaiters.forEach(waiter => waiter.setAttribute("aria-busy", "false"));
      }
    }
    return Array.from(newlyMounted);
  }

  async function AelluxJsMount(rootElement, extensionNames, newlyMounted) {
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
        const extensionPromise = AelluxJs.wait(extensionName);
        if (!extensionPromise) { continue; }
        const extension = await extensionPromise;
        if (!extension) { continue; }
        const mounter = mountMaps.get(toCamelCase(extensionName));
        if (!mounter) { continue; }
        for (const [selector, controller] of mounter) {
          try {
            if (!controller.mount) { continue; }
            const mountableElements = findElements(element, selector);
            for (const mountable of mountableElements) {
              const mountId = `${extensionName}@${selector}`;
              if (isMounted(mountable, mountId)) {
                const pendingMount = getPendingMount(mountable, mountId);
                if (pendingMount) await pendingMount;
                continue;
              }
              if (!isMounted(mountable)) {
                for (const name of Array.from(mountable.classList)) {
                  if (name.startsWith(classPrefix)) mountable.classList.remove(name);
                }
              }
              rememberInitialAttributes(mountable, mountId);
              setMounted(mountable, mountId);
              const finishPendingMount = beginPendingMount(mountable, mountId);
              try {
                await controller.mount(mountable);
                let elementController = elementControllers.get(mountable);
                if (!elementController) {
                  elementController = createControllerHelper(root, mountable);
                  elementControllers.set(mountable, elementController);
                }
                elementController.spawn(
                  extensionName, mountId, controller.controllers,
                  typeof controller.update === "function"
                );
                elementsAffected.add(mountable);
                newlyMounted.add(mountable);
              } catch (error) {
                setMounted(mountable, mountId, false);
                const elementController = elementControllers.get(mountable);
                if (elementController) {
                  elementController.despawn(mountId);
                  if (!elementController.hasMounts()) elementControllers.delete(mountable);
                }
                restoreInitialAttributes(mountable, mountId);
                AelluxJs.diagnostics.error(
                  AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
                  {
                    cause: error,
                    extension: extensionName,
                    method: "mount",
                    selector,
                    element: mountable
                  }
                );
              } finally {
                finishPendingMount();
              }
            }
          } catch (error) {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT,
              {
                cause: error,
                extension: extensionName,
                method: "mount",
                selector
              }
            );
          }
        }
      }

      for (const affected of elementsAffected) {
        if (!affected.isConnected || !isMounted(affected)) {
          if (!affected.isConnected) await unmountElementRegistrations(affected);
          newlyMounted.delete(affected);
          continue;
        }
        affected.classList.toggle(
          AelluxJs.className("mounted"),
          isMounted(affected)
        );
      }
    }
    AelluxJs.dispatch("Mount");
  }

  async function AelluxJsMounted(rootElement, method, extensionNames = null, detachedOnly = false) {
    const AelluxJs = root.AelluxJs;
    const selectedNames = extensionNames === null
      ? null
      : new Set((typeof extensionNames === "string" ? [extensionNames] : extensionNames)
        .map(name => fromCamelCase(name)));

    for (const [element, mountIds] of Array.from(mountedElements)) {
      const inRoot = element === rootElement || rootElement.contains(element);
      const detachedInGlobalUnmount = method === "unmount" &&
        rootElement === root.document && !element.isConnected;
      if (detachedOnly ? element.isConnected || hasPendingMounts(element) :
        !inRoot && !detachedInGlobalUnmount) continue;

      for (const mountId of Array.from(mountIds)) {
        const separator = mountId.indexOf("@");
        const extensionName = mountId.slice(0, separator);
        const selector = mountId.slice(separator + 1);
        if (selectedNames && !selectedNames.has(extensionName)) continue;

        const extensionKey = toCamelCase(extensionName);
        const mounter = mountMaps.get(extensionKey);
        const controller = mounter && mounter.get(selector);

        if (method === "unmount") {
          await unmountRegistration(element, mountId, controller, extensionName, selector);
          continue;
        }

        try {
          if (controller && controller[method]) {
            await controller[method](element);
          }
        } catch (error) {
          AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT, {
            cause: error, extension: extensionName, method, selector
          });
        }
      }
    }
    AelluxJs.dispatch(toCapitalized(method));
  }

  async function unmountRegistration(element, mountId, controller, extensionName, selector) {
    const pendingMount = getPendingMount(element, mountId);
    if (pendingMount) await pendingMount;
    if (!isMounted(element, mountId)) return;
    let tasks = pendingUnmounts.get(element);
    if (!tasks) {
      tasks = new Map();
      pendingUnmounts.set(element, tasks);
    }
    if (tasks.has(mountId)) {
      await tasks.get(mountId);
      return;
    }
    let finish;
    tasks.set(mountId, new Promise(resolve => { finish = resolve; }));
    const AelluxJs = root.AelluxJs;
    const diagnostics = AelluxJs.diagnostics;
    try {
      try {
        if (controller && controller.unmount) await controller.unmount(element);
      } catch (cause) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
          cause, extension: extensionName, method: "unmount", selector
        });
      }

      try {
        setMounted(element, mountId, false);
        const elementController = elementControllers.get(element);
        if (elementController) {
          elementController.despawn(mountId);
          if (!elementController.hasMounts()) elementControllers.delete(element);
        }
        element.classList.toggle(AelluxJs.className("mounted"), isMounted(element));
        restoreInitialAttributes(element, mountId);
      } catch (cause) {
        diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
          cause, extension: extensionName, method: "unmount", selector
        });
      }
    } finally {
      tasks.delete(mountId);
      if (!tasks.size) pendingUnmounts.delete(element);
      finish();
    }
  }

  async function unmountElementRegistrations(element) {
    const mountIds = Array.from(mountedElements.get(element) || []);
    for (const mountId of mountIds) {
      const separator = mountId.indexOf("@");
      const extensionName = mountId.slice(0, separator);
      const selector = mountId.slice(separator + 1);
      const mounter = mountMaps.get(toCamelCase(extensionName));
      const controller = mounter && mounter.get(selector);
      await unmountRegistration(element, mountId, controller, extensionName, selector);
    }
  }

  function beginPendingMount(element, mountId) {
    let mounts = pendingMounts.get(element);
    if (!mounts) {
      mounts = new Map();
      pendingMounts.set(element, mounts);
    }
    let finish;
    mounts.set(mountId, new Promise(resolve => { finish = resolve; }));
    return function () {
      mounts.delete(mountId);
      if (!mounts.size) pendingMounts.delete(element);
      finish();
    };
  }

  function getPendingMount(element, mountId) {
    return pendingMounts.get(element)?.get(mountId) || null;
  }

  function hasPendingMounts(element) {
    return Boolean(pendingMounts.get(element)?.size);
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

  function rememberInitialAttributes(element, mountId) {
    const targets = [element];
    const retained = [];
    try {
      for (const target of targets) {
        let record = initialAttributeValues.get(target);
        if (!record) {
          record = {
            initial: new Map(Array.from(target.attributes)
              .filter(attribute => isRestoredAttribute(attribute.name))
              .map(attribute => [attribute.name, attribute.value])),
            users: 0
          };
          initialAttributeValues.set(target, record);
        }
        record.users++;
        retained.push(target);
      }
    } catch (error) {
      releaseInitialAttributes(retained);
      throw error;
    }
    let mounts = mountAttributeRecords.get(element);
    if (!mounts) { mounts = new Map(); mountAttributeRecords.set(element, mounts); }
    mounts.set(mountId, targets);
  }

  function restoreInitialAttributes(element, mountId) {
    const mounts = mountAttributeRecords.get(element);
    if (!mounts || !mounts.has(mountId)) return;
    releaseInitialAttributes(mounts.get(mountId));
    mounts.delete(mountId);
    if (!mounts.size) mountAttributeRecords.delete(element);
  }

  function releaseInitialAttributes(targets) {
    for (const target of targets) {
      const record = initialAttributeValues.get(target);
      if (--record.users) continue;
      for (const attribute of Array.from(target.attributes)) {
        if (isRestoredAttribute(attribute.name) && !record.initial.has(attribute.name)) {
          target.removeAttribute(attribute.name);
        }
      }
      for (const [name, value] of record.initial) {
        if (target.getAttribute(name) !== value) target.setAttribute(name, value);
      }
      initialAttributeValues.delete(target);
    }
  }

  function isRestoredAttribute(name) {
    return name === "hidden" || name.startsWith("data-ae-") || name.startsWith("aria-");
  }
}
