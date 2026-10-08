/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import utilsNameCase from "./utils-name-case.js";

export function createControllerHelper(root, element) {
  const { toCamelCase, fromCamelCase } = utilsNameCase;
  const mounts = new Map();
  const controller = { spawn, despawn, hasMounts };

  function spawn(extensionName, mountId, methodNames) {
    const key = toCamelCase(fromCamelCase(extensionName));
    const extension = root.AelluxJs.ext[key];
    const methods = Array.isArray(methodNames) ? methodNames : [];
    for (const name of methods) {
      if (typeof name === "string" && extension && typeof extension[name] === "function") continue;
      const diagnostics = root.AelluxJs.diagnostics;
      diagnostics.warn(diagnostics.WARN_CONTROLLER_METHOD_MISSING, {
        extension: key, method: name, mountId, element
      });
    }
    mounts.set(mountId, {
      extension: key,
      methods
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
    const names = new Set();
    for (const registration of mounts.values()) {
      if (registration.extension !== key) continue;
      for (const name of registration.methods) {
        if (typeof name === "string" && extension && typeof extension[name] === "function") {
          names.add(name);
        }
      }
    }

    if (names.size === 0) {
      const namespace = controller[key];
      if (namespace) {
        for (const name of Object.keys(namespace)) delete namespace[name];
      }
      delete controller[key];
      return;
    }

    const namespace = controller[key] || Object.create(null);
    for (const name of Object.keys(namespace)) {
      if (!names.has(name)) delete namespace[name];
    }
    for (const name of names) {
      namespace[name] = (...args) => {
        const current = root.AelluxJs.ext[key];
        return current[name](element, ...args);
      };
    }
    controller[key] = namespace;
  }

  return controller;
}
