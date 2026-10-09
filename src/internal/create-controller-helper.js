/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import utilsNameCase from "./utils-name-case.js";

export function createControllerHelper(root, element) {
  const { toCamelCase, fromCamelCase } = utilsNameCase;
  const mounts = new Map();
  const controller = {
    spawn, despawn, hasMounts,
    mount(extensionNames = null) {
      return root.AelluxJs.mountManager.mount(element, extensionNames);
    },
    unmount(extensionNames = null) {
      return root.AelluxJs.mountManager.unmount(element, extensionNames);
    },
    update(extensionNames = null) {
      return root.AelluxJs.mountManager.update(element, extensionNames);
    }
  };

  function spawn(extensionName, mountId, methodNames, updatable = false) {
    const key = toCamelCase(fromCamelCase(extensionName));
    const extension = root.AelluxJs.ext[key];
    const methods = Array.isArray(methodNames) ? methodNames : [];
    for (const name of methods) {
      if (name === "update" && updatable) continue;
      if (typeof name === "string" && extension && typeof extension[name] === "function") continue;
      const diagnostics = root.AelluxJs.diagnostics;
      diagnostics.warn(diagnostics.WARN_CONTROLLER_METHOD_MISSING, {
        extension: key, method: name, mountId, element
      });
    }
    mounts.set(mountId, {
      extension: key,
      methods,
      updatable
    });
    refresh(key);
    return controller[key] || null;
  }

  function despawn(mountId) {
    const registration = mounts.get(mountId);
    if (!registration) return false;
    mounts.delete(mountId);
    refresh(registration.extension);
    return true;
  }

  function hasMounts() {
    return mounts.size > 0;
  }

  function refresh(key) {
    const extension = root.AelluxJs.ext[key];
    const registrations = Array.from(mounts.values())
      .filter(registration => registration.extension === key);
    const names = new Set();
    for (const registration of registrations) {
      for (const name of registration.methods) {
        if (name !== "update" && typeof name === "string" &&
          extension && typeof extension[name] === "function") {
          names.add(name);
        }
      }
    }

    if (registrations.length === 0) {
      const namespace = controller[key];
      if (namespace) {
        for (const name of Object.keys(namespace)) delete namespace[name];
      }
      delete controller[key];
      return;
    }

    const namespace = controller[key] || Object.create(null);
    for (const name of Object.keys(namespace)) {
      if (name !== "update" && !names.has(name)) delete namespace[name];
    }
    for (const name of names) {
      namespace[name] = (...args) => {
        const current = root.AelluxJs.ext[key];
        return current[name](element, ...args);
      };
    }
    namespace.update = registrations.some(registration => registration.updatable)
      ? () => root.AelluxJs.mountManager.update(element, key)
      : null;
    controller[key] = namespace;
  }

  return controller;
}
