/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import utilsNameCase from "./utils-name-case.js";
import { createControllerHelper } from "./create-controller-helper.js";
import { resolveElementOrId } from "./resolve-element-or-id.js";

export function createMountHelper(root, mountMaps, mountedElements, elementControllers) {
  const { toCapitalized, toCamelCase, fromCamelCase } = utilsNameCase;
  const initialAttributeValues = new WeakMap();
  const pendingMounts = new WeakMap();
  const pendingUnmounts = new WeakMap();
  const classPrefix = root.AelluxJs.className("");

  return { mount, unmount, unmountDetached, update, initialAttribute };

  function initialAttribute(element, name) {
    return initialAttributeValues.get(element)?.initial.get(name) ?? null;
  }

  async function update(elementOrId, extensionNames = null) {
    const rootElement = resolveMountElement(elementOrId, "update");
    if (!rootElement) return false;
    await AelluxJsMounted(rootElement, "update", extensionNames);
    return true;
  }

  async function unmount(elementOrId, extensionNames = null) {
    const rootElement = resolveMountElement(elementOrId, "unmount");
    if (!rootElement) return false;
    await AelluxJsMounted(rootElement, "unmount", extensionNames);
    return true;
  }

  async function unmountDetached() {
    let hasDetachedElement = false;
    for (const element of mountedElements.keys()) {
      if (!element.isConnected) {
        hasDetachedElement = true;
        break;
      }
    }
    if (!hasDetachedElement) return false;
    await AelluxJsMounted(root.document, "unmount", null, true);
    return true;
  }

  async function mount(elementOrId, extensionNames = null) {
    const AelluxJs = root.AelluxJs;
    const newlyMounted = new Set();
    const rootElement = resolveMountElement(elementOrId, "mount");
    if (!rootElement) return [];
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

    if (filter.length === 0) {
      AelluxJs.dispatch("Mount", {
        detail: { root: rootElement, extensions: extensionNames, elements: [] }
      });
      return;
    }

    const candidatesByExtension = new Map();
    const allElements = findElements(rootElement, filter.join(","));
    for (const element of allElements) {
      let localExtensionNames;
      if (extensionNames) {
        localExtensionNames = extensionNames;
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
        let candidates = candidatesByExtension.get(extensionName);
        if (!candidates) {
          candidates = new Set();
          candidatesByExtension.set(extensionName, candidates);
        }
        candidates.add(element);
      }
    }

    const extensions = Array.from(candidatesByExtension);
    const loaded = await Promise.all(
      extensions.map(([extensionName]) => AelluxJs.wait(extensionName).then(
        value => ({ value }),
        error => ({ error })
      ))
    );
    for (const result of loaded) {
      if (Object.prototype.hasOwnProperty.call(result, "error")) throw result.error;
    }

    const registrations = [];
    for (let index = 0; index < extensions.length; index++) {
      if (!loaded[index].value) continue;

      const [extensionName, candidates] = extensions[index];
      const mounter = mountMaps.get(toCamelCase(extensionName));
      if (!mounter) continue;

      const searchRoots = [];
      for (const candidate of candidates) {
        let ancestor = candidate.parentNode;
        while (ancestor && !candidates.has(ancestor)) ancestor = ancestor.parentNode;
        if (!ancestor) searchRoots.push(candidate);
      }

      for (const [selector, controller] of mounter) {
        registrations.push({
          extensionName, selector, controller, searchRoots,
          priority: controller.priority,
          order: registrations.length
        });
      }
    }

    registrations.sort((left, right) =>
      left.priority - right.priority || left.order - right.order);

    const elementsAffected = new Set();
    for (const { extensionName, selector, controller, searchRoots } of registrations) {
      try {
        if (!controller.mount) { continue; }
        for (const searchRoot of searchRoots) {
          const mountableElements = findElements(searchRoot, selector);
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
            rememberInitialAttributes(mountable);
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
              restoreInitialAttributes(mountable);
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

    for (const affected of elementsAffected) {
      if (!affected.isConnected || !isMounted(affected)) {
        if (!affected.isConnected) await unmountElementRegistrations(affected);
        newlyMounted.delete(affected);
        continue;
      }
      affected.classList.toggle(AelluxJs.className("mounted"), true);
    }
    AelluxJs.dispatch("Mount", {
      detail: {
        root: rootElement,
        extensions: extensionNames,
        elements: Array.from(newlyMounted)
      }
    });
  }

  async function AelluxJsMounted(rootElement, method, extensionNames = null, detachedOnly = false) {
    const AelluxJs = root.AelluxJs;
    const selectedNames = extensionNames === null
      ? null
      : new Set((typeof extensionNames === "string" ? [extensionNames] : extensionNames)
        .map(name => fromCamelCase(name)));
    const affected = new Set();

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
          if (await unmountRegistration(element, mountId, controller, extensionName, selector))
            affected.add(element);
          continue;
        }

        try {
          if (controller && controller[method]) {
            affected.add(element);
            await controller[method](element);
          }
        } catch (error) {
          AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_MOUNT, {
            cause: error, extension: extensionName, method, selector
          });
        }
      }
    }
    AelluxJs.dispatch(toCapitalized(method), {
      detail: {
        root: rootElement,
        extensions: selectedNames ? Array.from(selectedNames) : null,
        elements: Array.from(affected)
      }
    });
  }

  async function unmountRegistration(element, mountId, controller, extensionName, selector) {
    const pendingMount = getPendingMount(element, mountId);
    if (pendingMount) await pendingMount;
    if (!isMounted(element, mountId)) return false;
    let tasks = pendingUnmounts.get(element);
    if (!tasks) {
      tasks = new Map();
      pendingUnmounts.set(element, tasks);
    }
    if (tasks.has(mountId)) {
      await tasks.get(mountId);
      return false;
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
        restoreInitialAttributes(element);
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
    return !isMounted(element, mountId);
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

  function resolveMountElement(elementOrId, method) {
    return resolveElementOrId(root, elementOrId, {
      defaultElement: root.document,
      allowedNodeTypes: [
        root.Node.ELEMENT_NODE,
        root.Node.DOCUMENT_NODE,
        root.Node.DOCUMENT_FRAGMENT_NODE
      ],
      method
    });
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

  function rememberInitialAttributes(element) {
    const record = initialAttributeValues.get(element);
    if (record) {
      record.users++;
      return;
    }
    const initial = new Map();
    for (const attribute of element.attributes) {
      if (isRestoredAttribute(attribute.name))
        initial.set(attribute.name, attribute.value);
    }
    initialAttributeValues.set(element, { initial, users: 1 });
  }

  function restoreInitialAttributes(element) {
    const record = initialAttributeValues.get(element);
    if (!record || --record.users) return;
    for (let index = element.attributes.length - 1; index >= 0; index--) {
      const name = element.attributes[index].name;
      if (isRestoredAttribute(name) && !record.initial.has(name))
        element.removeAttribute(name);
    }
    for (const [name, value] of record.initial) {
      if (element.getAttribute(name) !== value) element.setAttribute(name, value);
    }
    initialAttributeValues.delete(element);
  }

  function isRestoredAttribute(name) {
    return name === "hidden" || name.startsWith("data-ae-") || name.startsWith("aria-");
  }
}
