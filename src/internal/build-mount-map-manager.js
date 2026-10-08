/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createMountHelper } from "./create-mount-helper.js";
import utilsNameCase from "./utils-name-case.js";

export function buildMountMapManager(root, extensionPromises) {
  const { toCamelCase, fromCamelCase } = utilsNameCase;
  const mountedElements = new WeakMap(); //DOM, string Set
  const elementControllers = new WeakMap(); //DOM, object
  const maps = new Map();

  const helper = createMountHelper(
    root,
    extensionPromises,
    maps,
    mountedElements,
    elementControllers
  );

  const manager = {
    add,
    remove,
    controller,
    mount: helper.mount,
    unmount: helper.unmount
  };
  return manager;

  function controller(elementOrId) {
    const requested = elementOrId;
    if (typeof elementOrId === "string")
      elementOrId = root.document.getElementById(elementOrId.replace(/^#/, ""));

    const diagnostics = root.AelluxJs.diagnostics;
    if (!elementOrId || elementOrId.nodeType !== 1) {
      diagnostics.warn(diagnostics.WARN_INVALID_CONTROLLER_ELEMENT, { elementOrId: requested });
      return null;
    }

    const found = elementControllers.get(elementOrId);
    if (found) return found;

    diagnostics.error(diagnostics.ERROR_CONTROLLER_NOT_FOUND, { element: elementOrId });
    return null;
  }

  function keyFor(extensionName) {
    return toCamelCase(fromCamelCase(extensionName));
  }

  function add(extensionName, selector, mount, unmount, update, controllers) {
    if (typeof extensionName !== "string" || !extensionName ||
      typeof selector !== "string" || !selector.trim()) {
      throw new TypeError("mountManager.add requires an extension name and selector");
    }
    const key = keyFor(extensionName);
    let map = maps.get(key);
    if (!map) {
      map = new Map();
      maps.set(key, map);
    }
    map.set(selector, { mount, unmount, update, controllers });
    root.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
    return manager;
  }

  function remove(extensionName, selector) {
    if (typeof extensionName !== "string" || !extensionName) return false;
    const key = keyFor(extensionName);
    const map = maps.get(key);
    if (!map) return false;

    const removed = selector === undefined ? true : map.delete(selector);
    if (selector === undefined || map.size === 0) {
      maps.delete(key);
      delete root.AelluxJs.registry.extMounters[key];
    } else if (removed) {
      root.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
    }
    return removed;
  }
}
