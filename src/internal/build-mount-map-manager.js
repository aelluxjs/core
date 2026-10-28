/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createMountHelper } from "./create-mount-helper.js";
import { resolveElementOrId } from "./resolve-element-or-id.js";
import { validateSelector } from "./create-selector-helper.js";
import utilsNameCase from "./utils-name-case.js";

export function buildMountMapManager(root) {
  const { toCamelCase, fromCamelCase } = utilsNameCase;
  const mountedElements = new Map(); //DOM, string Set
  const elementControllers = new WeakMap(); //DOM, object
  const maps = new Map();
  let unmountQueue = Promise.resolve();
  let unmountScheduled = false;
  let rescanAfterUnmount = false;

  const helper = createMountHelper(
    root,
    maps,
    mountedElements,
    elementControllers
  );

  const manager = {
    add,
    remove,
    controller,
    mount: helper.mount,
    unmount: helper.unmount,
    update: helper.update,
    destroy
  };

  let observer = null;
  if (typeof root.MutationObserver === "function") {
    observer = new root.MutationObserver(records => {
      if (!hasRemovedNodes(records) || !hasDetachedMountedElement()) return;
      scheduleDetachedUnmount();
    });
    observer.observe(root.document, { childList: true, subtree: true });
  }
  function destroy() {
    if (!observer) return false;
    observer.disconnect();
    observer = null;
    return true;
  }

  return manager;

  function scheduleUnmount(operation) {
    const task = unmountQueue.then(operation);
    unmountQueue = task.catch(() => {});
    return task;
  }

  function hasRemovedNodes(records) {
    for (const record of records) {
      if (record.removedNodes.length) return true;
    }
    return false;
  }

  function hasDetachedMountedElement() {
    for (const element of mountedElements.keys()) {
      if (!element.isConnected) return true;
    }
    return false;
  }

  function scheduleDetachedUnmount() {
    if (unmountScheduled) {
      rescanAfterUnmount = true;
      return;
    }
    unmountScheduled = true;
    scheduleUnmount(() => helper.unmountDetached()).then(
      finishDetachedUnmount,
      error => {
        const diagnostics = root.AelluxJs.diagnostics;
        diagnostics.error(diagnostics.ERROR_EXTENSION_UNMOUNT, { cause: error });
        finishDetachedUnmount();
      }
    );
  }

  function finishDetachedUnmount() {
    unmountScheduled = false;
    if (!rescanAfterUnmount || !observer) return;
    rescanAfterUnmount = false;
    if (hasDetachedMountedElement()) scheduleDetachedUnmount();
  }

  function controller(elementOrId) {
    const diagnostics = root.AelluxJs.diagnostics;
    elementOrId = resolveElementOrId(root, elementOrId, { method: "controller" });
    if (!elementOrId) return null;

    const found = elementControllers.get(elementOrId);
    if (found) return found;

    diagnostics.error(diagnostics.ERROR_CONTROLLER_NOT_FOUND, {
      element: elementOrId, method: "controller",
      reason: "No completed mount exposes a controller for this element.",
      suggestion: "Register the required Extension, await $ae.mount(element), and inspect earlier load or mount diagnostics."
    });
    return null;
  }

  function keyFor(extensionName) {
    return toCamelCase(fromCamelCase(extensionName));
  }

  function add(options) {
    const diagnostics = root.AelluxJs.diagnostics;
    function reject(argument, cause) {
      diagnostics.error(diagnostics.ERROR_MOUNT_REGISTRATION, {
        extension: options && options.extensionName,
        selector: options && options.selector,
        argument, cause
      });
      return false;
    }
    if (!options || typeof options !== "object" || Array.isArray(options))
      return reject("options");

    const { extensionName, selector, mount, unmount, update, controllers } = options;
    const priority = options.priority === undefined ? 0 : options.priority;
    if (typeof extensionName !== "string" ||
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$|^[a-z][a-zA-Z0-9]*$/.test(extensionName))
      return reject("extensionName");
    const key = keyFor(extensionName);
    if (key in Object.prototype || key === "prototype")
      return reject("extensionName");
    if (!Object.prototype.hasOwnProperty.call(root.AelluxJs.registry.ext, key))
      return reject("extensionName");
    const invalidSelector = validateSelector(root.document, selector);
    if (invalidSelector) return reject("selector", invalidSelector.cause);
    if (typeof mount !== "function") return reject("mount");
    if (typeof priority !== "number" || !isFinite(priority)) return reject("priority");
    if (unmount !== undefined && typeof unmount !== "function") return reject("unmount");
    if (update !== undefined && typeof update !== "function") return reject("update");
    if (controllers !== undefined &&
      (!Array.isArray(controllers) || controllers.some(name => typeof name !== "string" || !name.trim())))
      return reject("controllers");
    const allowed = ["extensionName", "selector", "mount", "unmount", "update", "controllers", "priority"];
    const unknown = Object.keys(options).find(name => !allowed.includes(name));
    if (unknown) return reject(unknown);

    let map = maps.get(key);
    if (!map) {
      map = new Map();
      maps.set(key, map);
    }
    if (map.has(selector)) return reject("selector");
    map.set(selector, { mount, unmount, update, controllers, priority });
    root.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
    return manager;
  }

  function remove({ extensionName, selector } = {}) {
    if (typeof extensionName !== "string" || !extensionName) return false;
    const key = keyFor(extensionName);
    const map = maps.get(key);
    if (!map) return false;
    if (hasMountedRegistration(extensionName, selector)) {
      const diagnostics = root.AelluxJs.diagnostics;
      diagnostics.error(diagnostics.ERROR_MOUNT_MAP_IN_USE, {
        extension: fromCamelCase(extensionName), selector
      });
      return false;
    }

    const removed = selector === undefined ? true : map.delete(selector);
    if (selector === undefined || map.size === 0) {
      maps.delete(key);
      delete root.AelluxJs.registry.extMounters[key];
    } else if (removed) {
      root.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
    }
    return removed;
  }

  function hasMountedRegistration(extensionName, selector) {
    const prefix = `${fromCamelCase(extensionName)}@`;
    const mountId = selector === undefined ? null : `${prefix}${selector}`;
    for (const registrations of mountedElements.values()) {
      if (mountId) {
        if (registrations.has(mountId)) return true;
        continue;
      }
      for (const id of registrations) {
        if (id.startsWith(prefix)) return true;
      }
    }
    return false;
  }
}
