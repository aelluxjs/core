/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createMountHelper } from "./create-mount-helper.js";
import utilsNameCase from "./utils-name-case.js";

export function buildMountMapManager(root) {
  const { toCamelCase, fromCamelCase } = utilsNameCase;
  const mountedElements = new Map(); //DOM, string Set
  const elementControllers = new WeakMap(); //DOM, object
  const maps = new Map();

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
    initialAttribute: helper.initialAttribute
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
    if (typeof extensionName !== "string" ||
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$|^[a-z][a-zA-Z0-9]*$/.test(extensionName))
      return reject("extensionName");
    const key = keyFor(extensionName);
    if (key in Object.prototype || key === "prototype")
      return reject("extensionName");
    if (!Object.prototype.hasOwnProperty.call(root.AelluxJs.registry.ext, key))
      return reject("extensionName");
    if (typeof selector !== "string" || !selector.trim())
      return reject("selector");
    try {
      root.document.querySelector(selector);
    } catch (cause) {
      return reject("selector", cause);
    }
    if (typeof mount !== "function") return reject("mount");
    if (unmount !== undefined && typeof unmount !== "function") return reject("unmount");
    if (update !== undefined && typeof update !== "function") return reject("update");
    if (controllers !== undefined &&
      (!Array.isArray(controllers) || controllers.some(name => typeof name !== "string" || !name.trim())))
      return reject("controllers");
    const allowed = ["extensionName", "selector", "mount", "unmount", "update", "controllers"];
    const unknown = Object.keys(options).find(name => !allowed.includes(name));
    if (unknown) return reject(unknown);

    let map = maps.get(key);
    if (!map) {
      map = new Map();
      maps.set(key, map);
    }
    map.set(selector, { mount, unmount, update, controllers });
    root.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
    return manager;
  }

  function remove({ extensionName, selector } = {}) {
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
