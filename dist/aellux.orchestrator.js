(() => {
  // src/internal/asset-load-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function assetLoadHelper(asset, options) {
    var loadCallback = options.loadCallback;
    var errorCallback = options.errorCallback;
    function clear() {
      asset.onload = null;
      asset.onerror = null;
    }
    asset.onload = function(event) {
      clear();
      if (typeof loadCallback === "function") {
        return loadCallback(event);
      }
    };
    asset.onerror = function(event) {
      clear();
      if (typeof errorCallback === "function") {
        return errorCallback(event);
      }
    };
    document.head.appendChild(asset);
    return { clear };
  }

  // src/internal/build-layout-scheduler.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildLayoutScheduler() {
    var readQueue = [];
    var updateQueue = [];
    var frameRequest = null;
    var phase = "idle";
    function scheduleFrame() {
      if (frameRequest !== null || phase !== "idle") return;
      frameRequest = requestAnimationFrame(flushFrame);
    }
    function flushFrame() {
      frameRequest = null;
      phase = "read";
      var reads = readQueue.splice(0);
      for (var i = 0; i < reads.length; i++)
        runTask(reads[i]);
      Promise.resolve().then(function() {
        phase = "update";
        var updates = updateQueue.splice(0);
        for (var i2 = 0; i2 < updates.length; i2++)
          runTask(updates[i2]);
        phase = "idle";
        if (readQueue.length || updateQueue.length) scheduleFrame();
      });
    }
    function runTask(task) {
      try {
        task.resolve(task.callback());
      } catch (error) {
        task.reject(error);
      }
    }
    function queueTask(queue, callback) {
      var promise = new Promise(function(resolve, reject) {
        queue.push({
          callback,
          resolve,
          reject
        });
      });
      if (phase === "idle") scheduleFrame();
      return promise;
    }
    function clear() {
      if (frameRequest !== null) {
        cancelAnimationFrame(frameRequest);
        frameRequest = null;
      }
      settleQueue(readQueue);
      settleQueue(updateQueue);
      phase = "idle";
    }
    function settleQueue(queue) {
      var tasks = queue.splice(0);
      for (var i = 0; i < tasks.length; i++) {
        tasks[i].resolve(void 0);
      }
    }
    return Object.freeze({
      read: (callback) => queueTask(readQueue, callback),
      update: (callback) => queueTask(updateQueue, callback),
      clear
    });
  }

  // src/internal/utils-name-case.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function toCapitalized(name) {
    return name.replace(/^([a-z])|-([a-z])/g, function(_, first, afterHyphen) {
      return (first || afterHyphen).toUpperCase();
    });
  }
  function toCamelCase(name) {
    return name.replace(/-([a-z])/g, function(_, character) {
      return character.toUpperCase();
    });
  }
  function fromCamelCase(name) {
    return name.replace(/([A-Z])/g, "-$1").toLowerCase();
  }
  var utils_name_case_default = {
    toCapitalized,
    toCamelCase,
    fromCamelCase
  };

  // src/internal/create-controller-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createControllerHelper(root, element) {
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const mounts = /* @__PURE__ */ new Map();
    const controller = {
      spawn,
      despawn,
      hasMounts,
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
      const key = toCamelCase2(fromCamelCase2(extensionName));
      const extension = root.AelluxJs.ext[key];
      const methods = Array.isArray(methodNames) ? methodNames : [];
      for (const name of methods) {
        if (name === "update" && updatable) continue;
        if (typeof name === "string" && extension && typeof extension[name] === "function") continue;
        const diagnostics = root.AelluxJs.diagnostics;
        diagnostics.warn(diagnostics.WARN_CONTROLLER_METHOD_MISSING, {
          extension: key,
          method: name,
          mountId,
          element
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
      const registrations = Array.from(mounts.values()).filter((registration) => registration.extension === key);
      const names = /* @__PURE__ */ new Set();
      for (const registration of registrations) {
        for (const name of registration.methods) {
          if (name !== "update" && typeof name === "string" && extension && typeof extension[name] === "function") {
            names.add(name);
          }
        }
      }
      if (registrations.length === 0) {
        const namespace2 = controller[key];
        if (namespace2) {
          for (const name of Object.keys(namespace2)) delete namespace2[name];
        }
        delete controller[key];
        return;
      }
      const namespace = controller[key] || /* @__PURE__ */ Object.create(null);
      for (const name of Object.keys(namespace)) {
        if (name !== "update" && !names.has(name)) delete namespace[name];
      }
      for (const name of names) {
        namespace[name] = (...args) => {
          const current = root.AelluxJs.ext[key];
          return current[name](element, ...args);
        };
      }
      namespace.update = registrations.some((registration) => registration.updatable) ? () => root.AelluxJs.mountManager.update(element, key) : null;
      controller[key] = namespace;
    }
    return controller;
  }

  // src/internal/create-mount-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createMountHelper(root, mountMaps, mountedElements, elementControllers) {
    const { toCapitalized: toCapitalized2, toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const initialAttributeValues = /* @__PURE__ */ new WeakMap();
    const mountAttributeRecords = /* @__PURE__ */ new WeakMap();
    const pendingMounts = /* @__PURE__ */ new WeakMap();
    const pendingUnmounts = /* @__PURE__ */ new WeakMap();
    const classPrefix = root.AelluxJs.className("");
    return { mount, unmount, unmountDetached, update, initialAttribute };
    function initialAttribute(element, name) {
      var _a, _b;
      return (_b = (_a = initialAttributeValues.get(element)) == null ? void 0 : _a.initial.get(name)) != null ? _b : null;
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
      if (![...mountedElements.keys()].some((element) => !element.isConnected)) return false;
      await AelluxJsMounted(root.document, "unmount", null, true);
      return true;
    }
    async function mount(rootOrSelector, extensionNames = null) {
      const AelluxJs2 = root.AelluxJs;
      const newlyMounted = /* @__PURE__ */ new Set();
      for (const rootElement of resolveRoots(rootOrSelector, "mount")) {
        const waitMountedAttr = AelluxJs2.attr("wait-mounted");
        const allWaiters = findElements(rootElement, `[${waitMountedAttr}]`);
        allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "true"));
        try {
          const allLinks = findElements(rootElement, "link[rel='aelluxjs-ext']");
          for (const link of allLinks) {
            const href = link.getAttribute("href");
            const loadWhen = link.getAttribute(AelluxJs2.attr("load-when")) || void 0;
            const builds = link.getAttribute(AelluxJs2.attr("builds")) || void 0;
            const loadStyleValue = link.getAttribute(AelluxJs2.attr("load-style"));
            const loadStyle = loadStyleValue === null || loadStyleValue === "false" ? false : loadStyleValue || true;
            link.setAttribute("rel", "aelluxjs-ext-registered");
            AelluxJs2.ext(href, { builds, loadWhen, loadStyle });
          }
          const waitExtensions = [];
          for (const [key, options] of Object.entries(root.AelluxJs.registry.ext)) {
            if (options.loadWhen) continue;
            waitExtensions.push(AelluxJs2.wait(key));
          }
          await Promise.all(waitExtensions);
          await AelluxJsMount(rootElement, extensionNames, newlyMounted);
        } catch (error) {
          AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_MOUNT, {
            cause: error,
            root: rootElement,
            extensions: extensionNames
          });
        } finally {
          allWaiters.forEach((waiter) => waiter.setAttribute("aria-busy", "false"));
        }
      }
      return Array.from(newlyMounted);
    }
    async function AelluxJsMount(rootElement, extensionNames, newlyMounted) {
      const AelluxJs2 = root.AelluxJs;
      if (typeof extensionNames === "string")
        extensionNames = [extensionNames];
      var filter;
      if (!extensionNames) {
        const mounterSelectors = Object.values(AelluxJs2.registry.extMounters);
        const lazySelectors = Object.values(AelluxJs2.registry.lazyExtSelectors);
        filter = [...mounterSelectors, ...lazySelectors];
      } else {
        filter = [];
        extensionNames = extensionNames.map((_) => fromCamelCase2(_));
        for (const [key, selectorString] of Object.entries(AelluxJs2.registry.extMounters))
          if (extensionNames.indexOf(fromCamelCase2(key)) !== -1)
            filter.push(selectorString);
        for (const [key, selectorString] of Object.entries(AelluxJs2.registry.lazyExtSelectors))
          if (extensionNames.indexOf(fromCamelCase2(key)) !== -1)
            filter.push(selectorString);
      }
      if (filter.length === 0) return;
      const allElements = findElements(rootElement, filter.join(","));
      for (const element of allElements) {
        const elementsAffected = /* @__PURE__ */ new Set();
        var localExtensionNames;
        if (extensionNames) {
          localExtensionNames = new Set(extensionNames);
        } else {
          localExtensionNames = /* @__PURE__ */ new Set();
          for (const [key, selector] of Object.entries(AelluxJs2.registry.lazyExtSelectors))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionNames.add(fromCamelCase2(key));
          for (const [key, selector] of Object.entries(AelluxJs2.registry.extMounters))
            if (element.matches(selector) && filter.indexOf(selector) !== -1)
              localExtensionNames.add(fromCamelCase2(key));
        }
        for (const extensionName of localExtensionNames) {
          const extensionPromise = AelluxJs2.wait(extensionName);
          if (!extensionPromise) {
            continue;
          }
          const extension = await extensionPromise;
          if (!extension) {
            continue;
          }
          const mounter = mountMaps.get(toCamelCase2(extensionName));
          if (!mounter) {
            continue;
          }
          for (const [selector, controller] of mounter) {
            try {
              if (!controller.mount) {
                continue;
              }
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
                    extensionName,
                    mountId,
                    controller.controllers,
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
                  AelluxJs2.diagnostics.error(
                    AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
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
              AelluxJs2.diagnostics.error(
                AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT,
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
            AelluxJs2.className("mounted"),
            isMounted(affected)
          );
        }
      }
      AelluxJs2.dispatch("Mount");
    }
    async function AelluxJsMounted(rootElement, method, extensionNames = null, detachedOnly = false) {
      const AelluxJs2 = root.AelluxJs;
      const selectedNames = extensionNames === null ? null : new Set((typeof extensionNames === "string" ? [extensionNames] : extensionNames).map((name) => fromCamelCase2(name)));
      for (const [element, mountIds] of Array.from(mountedElements)) {
        const inRoot = element === rootElement || rootElement.contains(element);
        const detachedInGlobalUnmount = method === "unmount" && rootElement === root.document && !element.isConnected;
        if (detachedOnly ? element.isConnected || hasPendingMounts(element) : !inRoot && !detachedInGlobalUnmount) continue;
        for (const mountId of Array.from(mountIds)) {
          const separator = mountId.indexOf("@");
          const extensionName = mountId.slice(0, separator);
          const selector = mountId.slice(separator + 1);
          if (selectedNames && !selectedNames.has(extensionName)) continue;
          const extensionKey = toCamelCase2(extensionName);
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
            AelluxJs2.diagnostics.error(AelluxJs2.diagnostics.ERROR_EXTENSION_MOUNT, {
              cause: error,
              extension: extensionName,
              method,
              selector
            });
          }
        }
      }
      AelluxJs2.dispatch(toCapitalized2(method));
    }
    async function unmountRegistration(element, mountId, controller, extensionName, selector) {
      const pendingMount = getPendingMount(element, mountId);
      if (pendingMount) await pendingMount;
      if (!isMounted(element, mountId)) return;
      let tasks = pendingUnmounts.get(element);
      if (!tasks) {
        tasks = /* @__PURE__ */ new Map();
        pendingUnmounts.set(element, tasks);
      }
      if (tasks.has(mountId)) {
        await tasks.get(mountId);
        return;
      }
      let finish;
      tasks.set(mountId, new Promise((resolve) => {
        finish = resolve;
      }));
      const AelluxJs2 = root.AelluxJs;
      const diagnostics = AelluxJs2.diagnostics;
      try {
        try {
          if (controller && controller.unmount) await controller.unmount(element);
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
            cause,
            extension: extensionName,
            method: "unmount",
            selector
          });
        }
        try {
          setMounted(element, mountId, false);
          const elementController = elementControllers.get(element);
          if (elementController) {
            elementController.despawn(mountId);
            if (!elementController.hasMounts()) elementControllers.delete(element);
          }
          element.classList.toggle(AelluxJs2.className("mounted"), isMounted(element));
          restoreInitialAttributes(element, mountId);
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
            cause,
            extension: extensionName,
            method: "unmount",
            selector
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
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        const controller = mounter && mounter.get(selector);
        await unmountRegistration(element, mountId, controller, extensionName, selector);
      }
    }
    function beginPendingMount(element, mountId) {
      let mounts = pendingMounts.get(element);
      if (!mounts) {
        mounts = /* @__PURE__ */ new Map();
        pendingMounts.set(element, mounts);
      }
      let finish;
      mounts.set(mountId, new Promise((resolve) => {
        finish = resolve;
      }));
      return function() {
        mounts.delete(mountId);
        if (!mounts.size) pendingMounts.delete(element);
        finish();
      };
    }
    function getPendingMount(element, mountId) {
      var _a;
      return ((_a = pendingMounts.get(element)) == null ? void 0 : _a.get(mountId)) || null;
    }
    function hasPendingMounts(element) {
      var _a;
      return Boolean((_a = pendingMounts.get(element)) == null ? void 0 : _a.size);
    }
    function resolveRoots(rootOrSelector, method) {
      if (!rootOrSelector) {
        return [document];
      }
      if (typeof rootOrSelector === "string") {
        try {
          return Array.from(document.querySelectorAll(rootOrSelector));
        } catch (error) {
          const diagnostics = root.AelluxJs.diagnostics;
          diagnostics.error(diagnostics.ERROR_MOUNT_ROOT_SELECTOR, {
            cause: error,
            selector: rootOrSelector,
            method
          });
          return [];
        }
      }
      if (rootOrSelector instanceof Element || rootOrSelector instanceof Document || rootOrSelector instanceof DocumentFragment) {
        return [rootOrSelector];
      }
      return [];
    }
    function findElements(root2, selector) {
      const elements = [];
      if (root2.nodeType === Node.ELEMENT_NODE && root2.matches(selector)) {
        elements.push(root2);
      }
      if (root2.querySelectorAll) {
        root2.querySelectorAll(selector).forEach(function(element) {
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
        mountedElements.set(element, /* @__PURE__ */ new Set());
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
              initial: new Map(Array.from(target.attributes).filter((attribute) => isRestoredAttribute(attribute.name)).map((attribute) => [attribute.name, attribute.value])),
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
      if (!mounts) {
        mounts = /* @__PURE__ */ new Map();
        mountAttributeRecords.set(element, mounts);
      }
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

  // src/internal/build-mount-map-manager.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function buildMountMapManager(root) {
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const mountedElements = /* @__PURE__ */ new Map();
    const elementControllers = /* @__PURE__ */ new WeakMap();
    const maps = /* @__PURE__ */ new Map();
    let unmountQueue = Promise.resolve();
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
      initialAttribute: helper.initialAttribute,
      destroy
    };
    let observer = null;
    if (typeof root.MutationObserver === "function") {
      observer = new root.MutationObserver((records) => {
        if (!records.some((record) => record.removedNodes.length)) return;
        scheduleUnmount(() => helper.unmountDetached()).catch((error) => {
          const diagnostics = root.AelluxJs.diagnostics;
          diagnostics.error(diagnostics.ERROR_EXTENSION_UNMOUNT, { cause: error });
        });
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
      unmountQueue = task.catch(() => {
      });
      return task;
    }
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
      return toCamelCase2(fromCamelCase2(extensionName));
    }
    function add(options) {
      const diagnostics = root.AelluxJs.diagnostics;
      function reject(argument, cause) {
        diagnostics.error(diagnostics.ERROR_MOUNT_REGISTRATION, {
          extension: options && options.extensionName,
          selector: options && options.selector,
          argument,
          cause
        });
        return false;
      }
      if (!options || typeof options !== "object" || Array.isArray(options))
        return reject("options");
      const { extensionName, selector, mount, unmount, update, controllers } = options;
      if (typeof extensionName !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$|^[a-z][a-zA-Z0-9]*$/.test(extensionName))
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
      if (unmount !== void 0 && typeof unmount !== "function") return reject("unmount");
      if (update !== void 0 && typeof update !== "function") return reject("update");
      if (controllers !== void 0 && (!Array.isArray(controllers) || controllers.some((name) => typeof name !== "string" || !name.trim())))
        return reject("controllers");
      const allowed = ["extensionName", "selector", "mount", "unmount", "update", "controllers"];
      const unknown = Object.keys(options).find((name) => !allowed.includes(name));
      if (unknown) return reject(unknown);
      let map = maps.get(key);
      if (!map) {
        map = /* @__PURE__ */ new Map();
        maps.set(key, map);
      }
      if (map.has(selector)) return reject("selector");
      map.set(selector, { mount, unmount, update, controllers });
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
          extension: fromCamelCase2(extensionName),
          selector
        });
        return false;
      }
      const removed = selector === void 0 ? true : map.delete(selector);
      if (selector === void 0 || map.size === 0) {
        maps.delete(key);
        delete root.AelluxJs.registry.extMounters[key];
      } else if (removed) {
        root.AelluxJs.registry.extMounters[key] = [...map.keys()].join(",");
      }
      return removed;
    }
    function hasMountedRegistration(extensionName, selector) {
      const prefix = `${fromCamelCase2(extensionName)}@`;
      const mountId = selector === void 0 ? null : `${prefix}${selector}`;
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

  // src/aellux.orchestrator.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const extensionPromises = {};
    const mountManager = buildMountMapManager(root);
    const layoutScheduler = buildLayoutScheduler();
    root.AelluxJs = Object.assign(
      root.AelluxJs,
      {
        async startAelluxJs() {
          if (root.AelluxJs.bundledExtensions) {
            Object.keys(root.AelluxJs.bundledExtensions).forEach((key) => {
              if (!(key in AelluxJs.registry.ext)) AelluxJs.ext(key);
            });
          }
          await new Promise((resolve) => {
            const startMountCallback = function() {
              AelluxJs.mount().then(function() {
                document.removeEventListener(
                  "DOMContentLoaded",
                  startMountCallback
                );
                resolve();
              });
            };
            if (document.readyState === "loading")
              document.addEventListener(
                "DOMContentLoaded",
                startMountCallback,
                { once: true }
              );
            else
              startMountCallback();
          });
          AelluxJs.dispatch("Ready");
          return true;
        },
        async mount(rootOrSelector, extensionNames = null) {
          return mountManager.mount(rootOrSelector, extensionNames);
        },
        async unmount(rootOrSelector, extensionNames = null) {
          return mountManager.unmount(rootOrSelector, extensionNames);
        },
        async destroy() {
          AelluxJs.waitLayout.clear();
          await AelluxJs.destroyExtensions();
          mountManager.destroy();
        },
        async destroyExtensions(extensionNames) {
          if (typeof extensionNames === "string")
            extensionNames = [extensionNames];
          if (!extensionNames)
            extensionNames = Object.keys(AelluxJs.registry.ext);
          extensionNames = extensionNames.map((_) => fromCamelCase2(_));
          try {
            await AelluxJs.unmount(document, extensionNames);
          } catch (error) {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_UNMOUNT,
              { cause: error, extensions: extensionNames }
            );
          }
          for (const extensionName of extensionNames) {
            const key = toCamelCase2(extensionName);
            let extension;
            try {
              if (!extensionPromises[key]) continue;
              extension = await extensionPromises[key];
              if (extension && extension.destroy) {
                await extension.destroy();
              }
            } catch (error) {
              AelluxJs.diagnostics.error(
                AelluxJs.diagnostics.ERROR_EXTENSION_DESTROY,
                { cause: error, extension: extensionName }
              );
            } finally {
              delete AelluxJs.ext[key];
              delete extensionPromises[key];
              delete AelluxJs.registry.ext[key];
              mountManager.remove({ extensionName });
              delete AelluxJs.registry.lazyExtSelectors[key];
              removeExtensionAssets(extensionName);
              if (extension) extension.initialized = false;
            }
          }
        },
        dispatchFrom(from, event, options) {
          options = options || {};
          if (!("bubbles" in options)) {
            options.bubbles = true;
          }
          if (!("cancelable" in options)) {
            options.cancelable = false;
          }
          return from.dispatchEvent(
            new CustomEvent(
              AelluxJs.eventName(event),
              options
            )
          );
        },
        wait(extensionName) {
          return getExtension(extensionName);
        },
        request: defaultRequest,
        waitLayout: layoutScheduler,
        mountManager
      }
    );
    root[root.AelluxJs.shortJSName] = root.AelluxJs;
    function getExtension(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      if (extensionPromises[key])
        return extensionPromises[key];
      const data = AelluxJs.registry.ext[key];
      if (data && !hasCompatibleBuild(data)) {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_INCOMPATIBLE,
          {
            extension: extensionName,
            runtime: AelluxJs.diagnostics.legacy ? "legacy" : "modern",
            builds: data.builds
          }
        );
        delete AelluxJs.registry.lazyExtSelectors[key];
        extensionPromises[key] = Promise.resolve(null);
        return extensionPromises[key];
      }
      if (AelluxJs.ext[key]) {
        if (!AelluxJs.ext[key].initialized) {
          extensionPromises[key] = Promise.resolve().then(() => extensionInitialize(extensionName)).catch((error) => {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
              { cause: error, extension: extensionName }
            );
            delete extensionPromises[key];
            return null;
          });
          return extensionPromises[key];
        }
        extensionPromises[key] = Promise.resolve(AelluxJs.ext[key]);
        return extensionPromises[key];
      }
      if (!(key in AelluxJs.registry.ext)) {
        return Promise.reject(AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_NOT_REGISTERED,
          { extension: extensionName }
        ));
      }
      const bundledLoader = AelluxJs.bundledExtensions ? AelluxJs.bundledExtensions[key] : null;
      extensionPromises[key] = appendExtensionAssets(extensionName, bundledLoader).then(() => extensionInitialize(extensionName)).catch((error) => {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
          { cause: error, extension: extensionName }
        );
        delete extensionPromises[key];
        return null;
      });
      return extensionPromises[key];
    }
    async function extensionInitialize(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const options = AelluxJs.options.extensions[key] || {};
      await AelluxJs.ext[key].init(options);
      AelluxJs.ext[key].initialized = true;
      delete AelluxJs.registry.lazyExtSelectors[key];
      return AelluxJs.ext[key];
    }
    async function appendExtensionAssets(extensionName, bundledLoader = null) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const data = AelluxJs.registry.ext[key];
      const url = data.url.replace(/^\.\//, AelluxJs.aelluxBasePath);
      const useLegacyBuild = AelluxJs.diagnostics.legacy || data.builds.indexOf("modern") === -1;
      const scriptURL = useLegacyBuild ? toLegacyScriptURL(url) : url;
      const minifiedScript = /\.min\.js(?=[?#]|$)/.test(scriptURL);
      const scriptVariant = useLegacyBuild ? minifiedScript ? "legacyMin" : "legacy" : minifiedScript ? "modernMin" : "modern";
      const loadPromises = [];
      if (bundledLoader) {
        loadPromises.push(Promise.resolve().then(() => bundledLoader()));
      } else {
        loadPromises.push(new Promise(
          (resolve, reject) => {
            const attr = AelluxJs.attr("ext");
            const script = document.createElement("script");
            script.src = scriptURL;
            script.setAttribute(attr, extensionName);
            applyAssetIntegrity(script, getExtensionIntegrity(data, scriptVariant, scriptURL), data.crossOrigin);
            assetLoadHelper(script, {
              loadCallback: resolve,
              errorCallback: reject
            });
          }
        ));
      }
      if (data.loadStyle && data.loadStyle !== "false") {
        loadPromises.push(new Promise(
          (resolve) => {
            const styleDefaultURL = data.loadStyle === true || data.loadStyle === "true" || data.loadStyle === "";
            const href = styleDefaultURL ? url.replace(/\.js(?=[?#]|$)/, ".css") : data.loadStyle;
            const attrStyle = AelluxJs.attr("ext-style");
            const link = document.createElement("link");
            link.href = href;
            link.rel = "stylesheet";
            link.setAttribute(attrStyle, extensionName);
            applyAssetIntegrity(link, getExtensionIntegrity(data, "style", href), data.crossOrigin);
            assetLoadHelper(link, {
              loadCallback: resolve,
              errorCallback: () => {
                AelluxJs.diagnostics.warn(
                  AelluxJs.diagnostics.WARN_EXTENSION_STYLE_LOAD,
                  { extension: extensionName, url: link.href }
                );
                resolve();
              }
            });
          }
        ));
      }
      return Promise.all(loadPromises);
    }
    function getExtensionIntegrity(data, variant, url) {
      const declared = data.integrity;
      const explicit = typeof declared === "string" ? variant === "style" ? null : declared : declared && declared[variant];
      if (explicit) return explicit;
      const basePath = AelluxJs.aelluxBasePath;
      if (!url.startsWith(basePath)) return null;
      const filename = url.slice(basePath.length);
      const builtin = AelluxJs.coreAssetIntegrity;
      return builtin && Object.prototype.hasOwnProperty.call(builtin, filename) ? builtin[filename] : null;
    }
    function applyAssetIntegrity(asset, integrity, crossOrigin) {
      if (integrity) asset.setAttribute("integrity", integrity);
      if (integrity || crossOrigin || AelluxJs.options.crossOrigin) {
        asset.setAttribute("crossorigin", crossOrigin || AelluxJs.options.crossOrigin || "anonymous");
      }
    }
    function toLegacyScriptURL(url) {
      return url.replace(
        /(?:\.legacy)?(?:\.min)?\.js(?=[?#]|$)/,
        ".legacy" + (AelluxJs.minified ? ".min" : "") + ".js"
      );
    }
    function removeExtensionAssets(extensionName) {
      const scriptAttribute = AelluxJs.attr("ext");
      const styleAttribute = AelluxJs.attr("ext-style");
      document.querySelectorAll(`script[${scriptAttribute}], link[${styleAttribute}]`).forEach((asset) => {
        if (asset.getAttribute(scriptAttribute) === extensionName || asset.getAttribute(styleAttribute) === extensionName) {
          asset.remove();
        }
      });
    }
    function hasCompatibleBuild(data) {
      if (!data || !Array.isArray(data.builds) || data.builds.length === 0) return false;
      if (AelluxJs.diagnostics.legacy) return data.builds.indexOf("legacy") !== -1;
      return data.builds.indexOf("modern") !== -1 || data.builds.indexOf("legacy") !== -1;
    }
    function defaultRequest(url, options) {
      var requestOptions = Object.assign(
        { method: "GET", credentials: "same-origin" },
        options
      );
      return fetch(url, requestOptions).then(function(response) {
        if (!response.ok) {
          var error = new Error("HTTP " + response.status + " " + response.statusText);
          error.name = "AelluxJsRequestError";
          error.status = response.status;
          error.statusText = response.statusText;
          error.response = response;
          throw error;
        }
        return response;
      }).catch(function(error) {
        throw error;
      });
    }
    ;
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.orchestrator.js.map
