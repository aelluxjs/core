/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { createMountHelper } from "./create-mount-helper.js";
import utilsNameCase from "./utils-name-case.js";

export function buildMountMapManager(root, extensionPromises) {
  const { toCamelCase, fromCamelCase } = utilsNameCase;
  const maps = new Map();
  const helper = createMountHelper(root, extensionPromises, maps);

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

  function mount(rootOrSelector, extensionNames = null) {
    return helper.AelluxJsForceUpdate(rootOrSelector, extensionNames);
  }

  function unmount(rootOrSelector, extensionNames = null) {
    return helper.AelluxJsForceUnmount(rootOrSelector, extensionNames);
  }

  const manager = { add, remove, mount, unmount };
  return manager;
}
