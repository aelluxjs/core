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
        task.resolve(task.parameters ? task.callback.apply(void 0, task.parameters) : task.callback());
      } catch (error) {
        task.reject(error);
      }
    }
    function queueTask(queue, callback, parameters) {
      var promise = new Promise(function(resolve, reject) {
        queue.push({
          callback,
          parameters,
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
      read: (callback, parameters) => queueTask(readQueue, callback, parameters),
      update: (callback, parameters) => queueTask(updateQueue, callback, parameters),
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
      on(event, handler, options) {
        root.AelluxJs.onTarget(element, event, handler, options);
      },
      off(event, handler, options) {
        root.AelluxJs.offTarget(element, event, handler, options);
      },
      dispatch(event, options) {
        return root.AelluxJs.dispatchFrom(element, event, options);
      },
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

  // src/internal/resolve-element-or-id.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function resolveElementOrId(root, elementOrId, options) {
    options = options || {};
    var fallback = options.defaultElement;
    if ((elementOrId === void 0 || elementOrId === null) && fallback) {
      return fallback;
    }
    var requested = elementOrId;
    if (typeof elementOrId === "string") {
      var id = elementOrId.trim().replace(/^#/, "");
      elementOrId = id ? root.document.getElementById(id) : null;
    }
    var allowedNodeTypes = options.allowedNodeTypes || [root.Node.ELEMENT_NODE];
    if (elementOrId && allowedNodeTypes.indexOf(elementOrId.nodeType) !== -1) {
      return elementOrId;
    }
    var diagnostics = root.AelluxJs.diagnostics;
    diagnostics.warn(diagnostics.WARN_INVALID_ELEMENT_OR_ID, {
      elementOrId: requested,
      method: options.method
    });
    return null;
  }

  // src/internal/create-mount-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createMountHelper(root, mountMaps, mountedElements, elementControllers) {
    const UNMOUNT = "unmount";
    const { toCapitalized: toCapitalized2, toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const pendingMounts = /* @__PURE__ */ new WeakMap();
    const pendingUnmounts = /* @__PURE__ */ new WeakMap();
    const mountRecords = /* @__PURE__ */ new WeakMap();
    let mountOrder = 0;
    const classPrefix = root.AelluxJs.className("");
    return { mount, unmount, unmountDetached, update };
    async function update(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, "update");
      if (!rootElement) return false;
      await AelluxJsMounted(rootElement, "update", extensionNames);
      return true;
    }
    async function unmount(elementOrId, extensionNames = null) {
      const rootElement = resolveMountElement(elementOrId, UNMOUNT);
      if (!rootElement) return false;
      await AelluxJsMounted(rootElement, UNMOUNT, extensionNames);
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
      await AelluxJsMounted(root.document, UNMOUNT, null, true);
      return true;
    }
    async function mount(elementOrId, extensionNames = null) {
      const AelluxJs2 = root.AelluxJs;
      const newlyMounted = /* @__PURE__ */ new Set();
      const rootElement = resolveMountElement(elementOrId, "mount");
      if (!rootElement) return [];
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
      if (filter.length === 0) {
        AelluxJs2.dispatch("Mount", {
          detail: { root: rootElement, extensions: extensionNames, elements: [] }
        });
        return;
      }
      const candidatesByExtension = /* @__PURE__ */ new Map();
      const allElements = findElements(rootElement, filter.join(","));
      for (const element of allElements) {
        let localExtensionNames;
        if (extensionNames) {
          localExtensionNames = extensionNames;
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
          let candidates = candidatesByExtension.get(extensionName);
          if (!candidates) {
            candidates = /* @__PURE__ */ new Set();
            candidatesByExtension.set(extensionName, candidates);
          }
          candidates.add(element);
        }
      }
      const extensions = Array.from(candidatesByExtension);
      const loaded = await Promise.all(
        extensions.map(([extensionName]) => AelluxJs2.wait(extensionName).then(
          (value) => ({ value }),
          (error) => ({ error })
        ))
      );
      for (const result of loaded) {
        if (Object.prototype.hasOwnProperty.call(result, "error")) throw result.error;
      }
      const registrations = [];
      for (let index = 0; index < extensions.length; index++) {
        if (!loaded[index].value) continue;
        const [extensionName, candidates] = extensions[index];
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        if (!mounter) continue;
        const searchRoots = [];
        for (const candidate of candidates) {
          let ancestor = candidate.parentNode;
          while (ancestor && !candidates.has(ancestor)) ancestor = ancestor.parentNode;
          if (!ancestor) searchRoots.push(candidate);
        }
        for (const [selector, controller] of mounter) {
          registrations.push({
            extensionName,
            selector,
            controller,
            searchRoots,
            priority: controller.priority,
            order: registrations.length
          });
        }
      }
      registrations.sort((left, right) => left.priority - right.priority || left.order - right.order);
      const elementsAffected = /* @__PURE__ */ new Set();
      for (const { extensionName, selector, controller, searchRoots } of registrations) {
        try {
          if (!controller.mount) {
            continue;
          }
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
              setMounted(mountable, mountId, true, controller.priority);
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
      for (const affected of elementsAffected) {
        if (!affected.isConnected || !isMounted(affected)) {
          if (!affected.isConnected) await unmountElementRegistrations(affected);
          newlyMounted.delete(affected);
          continue;
        }
        affected.classList.toggle(AelluxJs2.className("mounted"), true);
      }
      AelluxJs2.dispatch("Mount", {
        detail: {
          root: rootElement,
          extensions: extensionNames,
          elements: Array.from(newlyMounted)
        }
      });
    }
    async function AelluxJsMounted(rootElement, method, extensionNames = null, detachedOnly = false) {
      const AelluxJs2 = root.AelluxJs;
      const selectedNames = extensionNames === null ? null : new Set((typeof extensionNames === "string" ? [extensionNames] : extensionNames).map((name) => fromCamelCase2(name)));
      const affected = /* @__PURE__ */ new Set();
      const registrations = [];
      for (const [element, mountIds] of Array.from(mountedElements)) {
        const inRoot = element === rootElement || rootElement.contains(element);
        const detachedInGlobalUnmount = method === UNMOUNT && rootElement === root.document && !element.isConnected;
        if (detachedOnly ? element.isConnected || hasPendingMounts(element) : !inRoot && !detachedInGlobalUnmount) continue;
        for (const mountId of Array.from(mountIds)) {
          const separator = mountId.indexOf("@");
          const extensionName = mountId.slice(0, separator);
          const selector = mountId.slice(separator + 1);
          if (selectedNames && !selectedNames.has(extensionName)) continue;
          const extensionKey = toCamelCase2(extensionName);
          const mounter = mountMaps.get(extensionKey);
          const controller = mounter && mounter.get(selector);
          if (method === UNMOUNT) {
            registrations.push({ element, mountId, controller, extensionName, selector });
            continue;
          }
          try {
            if (controller && controller[method]) {
              affected.add(element);
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
      if (method === UNMOUNT) {
        registrations.sort(compareUnmountOrder);
        for (const { element, mountId, controller, extensionName, selector } of registrations) {
          if (await unmountRegistration(element, mountId, controller, extensionName, selector))
            affected.add(element);
        }
      }
      AelluxJs2.dispatch(toCapitalized2(method), {
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
        tasks = /* @__PURE__ */ new Map();
        pendingUnmounts.set(element, tasks);
      }
      if (tasks.has(mountId)) {
        await tasks.get(mountId);
        return false;
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
            method: UNMOUNT,
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
        } catch (cause) {
          diagnostics.error(diagnostics.ERROR_EXTENSION_MOUNT, {
            cause,
            extension: extensionName,
            method: UNMOUNT,
            selector
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
      const registrations = Array.from(mountedElements.get(element) || [], (mountId) => {
        const separator = mountId.indexOf("@");
        const extensionName = mountId.slice(0, separator);
        const selector = mountId.slice(separator + 1);
        const mounter = mountMaps.get(toCamelCase2(extensionName));
        const controller = mounter && mounter.get(selector);
        return { element, mountId, controller, extensionName, selector };
      });
      registrations.sort(compareUnmountOrder);
      for (const { mountId, controller, extensionName, selector } of registrations) {
        await unmountRegistration(element, mountId, controller, extensionName, selector);
      }
    }
    function compareUnmountOrder(left, right) {
      var _a, _b, _c, _d, _e, _f;
      const leftRecord = (_a = mountRecords.get(left.element)) == null ? void 0 : _a.get(left.mountId);
      const rightRecord = (_b = mountRecords.get(right.element)) == null ? void 0 : _b.get(right.mountId);
      return ((_c = rightRecord == null ? void 0 : rightRecord.priority) != null ? _c : 0) - ((_d = leftRecord == null ? void 0 : leftRecord.priority) != null ? _d : 0) || ((_e = rightRecord == null ? void 0 : rightRecord.order) != null ? _e : 0) - ((_f = leftRecord == null ? void 0 : leftRecord.order) != null ? _f : 0);
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
    function setMounted(element, mountId, mounted = true, priority = 0) {
      if (!mountedElements.has(element)) {
        mountedElements.set(element, /* @__PURE__ */ new Set());
      }
      const mounts = mountedElements.get(element);
      mounts[mounted ? "add" : "delete"](mountId);
      let records = mountRecords.get(element);
      if (mounted) {
        if (!records) {
          records = /* @__PURE__ */ new Map();
          mountRecords.set(element, records);
        }
        records.set(mountId, { priority, order: mountOrder++ });
      } else if (records) {
        records.delete(mountId);
        if (!records.size) mountRecords.delete(element);
      }
      if (mounts.size === 0) mountedElements.delete(element);
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
      observer = new root.MutationObserver((records) => {
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
      unmountQueue = task.catch(() => {
      });
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
        (error) => {
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
      const priority = options.priority === void 0 ? 0 : options.priority;
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
      if (typeof priority !== "number" || !isFinite(priority)) return reject("priority");
      if (unmount !== void 0 && typeof unmount !== "function") return reject("unmount");
      if (update !== void 0 && typeof update !== "function") return reject("update");
      if (controllers !== void 0 && (!Array.isArray(controllers) || controllers.some((name) => typeof name !== "string" || !name.trim())))
        return reject("controllers");
      const allowed = ["extensionName", "selector", "mount", "unmount", "update", "controllers", "priority"];
      const unknown = Object.keys(options).find((name) => !allowed.includes(name));
      if (unknown) return reject(unknown);
      let map = maps.get(key);
      if (!map) {
        map = /* @__PURE__ */ new Map();
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

  // src/internal/create-aria-helper.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createAriaHelper() {
    const elements = /* @__PURE__ */ new WeakMap();
    let nextOrder = 0;
    function attributeName(name) {
      if (typeof name !== "string" || !/^(?:aria-)?[a-z][a-z0-9-]*$/.test(name)) {
        throw new TypeError("Invalid ARIA name");
      }
      return name.startsWith("aria-") ? name : `aria-${name}`;
    }
    function attributeValue(name, value) {
      if (value === null || value === void 0) {
        throw new TypeError("Use unset() for null");
      }
      if (Array.isArray(value)) {
        return value.join(" ");
      }
      if (name === "aria-hidden" && typeof value !== "boolean") {
        throw new TypeError("Invalid aria-hidden value");
      }
      return String(value);
    }
    function write(element, name, value) {
      if (value === null) {
        if (element.hasAttribute(name)) element.removeAttribute(name);
      } else if (element.getAttribute(name) !== value) {
        element.setAttribute(name, value);
      }
    }
    function reconcile(element, record, name) {
      var _a;
      let winner = null;
      let hidden = false;
      record.handlers.forEach((handler) => {
        if (!handler.values.has(name)) return;
        if (name === "aria-hidden" && handler.values.get(name) === "true") hidden = true;
        if (!winner || handler.priority > winner.priority || handler.priority === winner.priority && handler.order > winner.order) {
          winner = handler;
        }
      });
      if (!winner) {
        write(element, name, (_a = record.baseline.get(name)) != null ? _a : null);
        record.baseline.delete(name);
        return;
      }
      write(element, name, name === "aria-hidden" && hidden ? "true" : winner.values.get(name));
    }
    function register(element, options = {}) {
      if (!element || element.nodeType !== 1) {
        throw new TypeError("Invalid ARIA element");
      }
      const priority = options.priority === void 0 ? 0 : options.priority;
      if (typeof priority !== "number" || !Number.isFinite(priority)) {
        throw new TypeError("Invalid ARIA priority");
      }
      let record = elements.get(element);
      if (!record) {
        record = { handlers: /* @__PURE__ */ new Set(), baseline: /* @__PURE__ */ new Map() };
        elements.set(element, record);
      }
      const handler = { priority, order: nextOrder++, values: /* @__PURE__ */ new Map() };
      record.handlers.add(handler);
      let released = false;
      return {
        set(values) {
          if (released) return false;
          if (!values || typeof values !== "object") {
            throw new TypeError("Invalid ARIA values");
          }
          const updates = Object.entries(values).map(([key, value]) => {
            const name = attributeName(key);
            return [name, attributeValue(name, value)];
          });
          updates.forEach(([name, value]) => {
            if (!record.baseline.has(name)) record.baseline.set(name, element.getAttribute(name));
            handler.values.set(name, value);
            reconcile(element, record, name);
          });
          return true;
        },
        unset(key) {
          if (released) return false;
          const name = attributeName(key);
          if (!handler.values.delete(name)) return false;
          reconcile(element, record, name);
          return true;
        },
        initial(key) {
          const name = attributeName(key);
          return record.baseline.has(name) ? record.baseline.get(name) : element.getAttribute(name);
        },
        release() {
          if (released) return false;
          released = true;
          record.handlers.delete(handler);
          handler.values.forEach((_, name) => reconcile(element, record, name));
          handler.values.clear();
          if (!record.handlers.size) elements.delete(element);
          return true;
        }
      };
    }
    return { register };
  }

  // src/aellux.orchestrator.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const extensionPromises = {};
    const aria = createAriaHelper();
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
            const startCallback = function() {
              if (AelluxJs.options.skipGlobalMount === true) {
                AelluxJs.off("$DOMContentLoaded", startCallback);
                resolve();
                return;
              }
              AelluxJs.mount().then(function() {
                AelluxJs.off("$DOMContentLoaded", startCallback);
                resolve();
              });
            };
            if (document.readyState === "loading")
              AelluxJs.on("$DOMContentLoaded", startCallback, { once: true });
            else
              startCallback();
          });
          AelluxJs.dispatch("Ready");
          return true;
        },
        async mount(elementOrId, extensionNames = null) {
          return mountManager.mount(elementOrId, extensionNames);
        },
        async unmount(elementOrId, extensionNames = null) {
          return mountManager.unmount(elementOrId, extensionNames);
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
        aria,
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
