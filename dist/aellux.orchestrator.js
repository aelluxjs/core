(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

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
    const MIN_FPS = 5;
    const FPS_STEP = 15;
    const queues = { read: [], update: [] };
    const groups = /* @__PURE__ */ new Map();
    const tasks = /* @__PURE__ */ new Set();
    const sequenceStarts = /* @__PURE__ */ new Map();
    let frameRequest = null;
    let phase = "idle";
    let waitingForVisibility = false;
    let idleSince = null;
    let nativeFPS = null;
    let limitFPS = null;
    let initialDeltas = [];
    let lastFrameTime = null;
    let frameCredit = 0;
    let samples = [];
    let slowStreak = 0;
    let lastAdjustment = -Infinity;
    let stableSince = null;
    let recoveryDelay = 3e3;
    let trialLimit = null;
    const now = () => performance.now();
    const hidden = () => typeof document !== "undefined" && document.hidden;
    const hasWork = () => queues.read.length > 0 || queues.update.length > 0;
    function publishLimit() {
      if (typeof document === "undefined" || !document.documentElement) return;
      const value = nativeFPS !== null && limitFPS !== null && limitFPS < nativeFPS ? String(limitFPS) : null;
      if (value === null) {
        if (document.documentElement.hasAttribute("data-ae-fps"))
          document.documentElement.removeAttribute("data-ae-fps");
      } else if (document.documentElement.getAttribute("data-ae-fps") !== value) {
        document.documentElement.setAttribute("data-ae-fps", value);
      }
    }
    function resetMeasurements(resetLimit) {
      lastFrameTime = null;
      frameCredit = 0;
      samples = [];
      slowStreak = 0;
      stableSince = null;
      initialDeltas = [];
      if (resetLimit) {
        nativeFPS = null;
        limitFPS = null;
        lastAdjustment = -Infinity;
      }
      publishLimit();
      trialLimit = null;
      recoveryDelay = 3e3;
    }
    function onVisible() {
      if (hidden()) return;
      document.removeEventListener("visibilitychange", onVisible);
      waitingForVisibility = false;
      resetMeasurements(true);
      scheduleFrame();
    }
    function scheduleFrame() {
      if (frameRequest !== null || phase !== "idle" || !hasWork()) return;
      if (hidden()) {
        if (!waitingForVisibility) {
          document.addEventListener("visibilitychange", onVisible);
          waitingForVisibility = true;
        }
        return;
      }
      if (idleSince !== null && now() - idleSince > 250) resetMeasurements(true);
      idleSince = null;
      frameRequest = requestAnimationFrame(flushFrame);
    }
    function stopFrameIfIdle() {
      if (hasWork()) return;
      if (frameRequest !== null) cancelAnimationFrame(frameRequest);
      frameRequest = null;
      if (waitingForVisibility) document.removeEventListener("visibilitychange", onVisible);
      waitingForVisibility = false;
      if (phase === "idle") idleSince = now();
    }
    function observeFrame(time) {
      const previous = lastFrameTime;
      lastFrameTime = time;
      if (previous === null) return true;
      const delta = time - previous;
      if (delta <= 0 || delta > 250) {
        frameCredit = 0;
        samples = [];
        slowStreak = 0;
        stableSince = null;
        return true;
      }
      if (nativeFPS === null) {
        initialDeltas.push(delta);
        if (initialDeltas.length >= 8) {
          const ordered = initialDeltas.slice().sort((a, b) => a - b);
          nativeFPS = Math.max(MIN_FPS, Math.round(1e3 / ordered[4]));
          limitFPS = nativeFPS;
          initialDeltas = [];
        }
      } else {
        const expected = 1e3 / Math.max(MIN_FPS, limitFPS);
        const slow = delta > expected * 1.23;
        slowStreak = slow ? slowStreak + 1 : 0;
        samples.push({ time, slow, delay: delta, cost: 0 });
        while (samples.length && time - samples[0].time > 1e3) samples.shift();
        adjustLimit(time);
      }
      if (limitFPS === null || limitFPS >= nativeFPS) return true;
      const period = 1e3 / limitFPS;
      frameCredit += delta;
      if (frameCredit + 1e-3 < period) return false;
      frameCredit = Math.min(period, frameCredit - period);
      return true;
    }
    function adjustLimit(time) {
      if (samples.length < 8 || time - samples[0].time < 700) return;
      const slowCount = samples.reduce((n, item) => n + (item.slow ? 1 : 0), 0);
      if (slowStreak >= 4 || slowCount / samples.length >= 0.35) {
        stableSince = null;
        if (time - lastAdjustment >= 1e3 && limitFPS > MIN_FPS) {
          const previous = limitFPS;
          const delay = Math.max(...samples.filter((sample) => sample.slow).map((sample) => Math.max(sample.delay, sample.cost)));
          limitFPS = Math.min(limitFPS, adaptiveLimit(1e3 / delay));
          publishLimit();
          if (trialLimit === previous) recoveryDelay = Math.min(3e4, recoveryDelay * 2);
          trialLimit = null;
          lastAdjustment = time;
          samples = [];
          slowStreak = 0;
          frameCredit = 0;
        }
      } else {
        if (stableSince === null) stableSince = time;
        if (limitFPS < nativeFPS && time - stableSince >= recoveryDelay && time - lastAdjustment >= recoveryDelay) {
          limitFPS = Math.min(nativeFPS, limitFPS + FPS_STEP);
          publishLimit();
          trialLimit = limitFPS;
          lastAdjustment = time;
          stableSince = null;
          samples = [];
          frameCredit = 0;
        }
      }
    }
    function adaptiveLimit(observedFPS) {
      let candidate = nativeFPS;
      while (candidate > MIN_FPS && candidate > observedFPS) {
        candidate = Math.max(MIN_FPS, candidate - FPS_STEP);
      }
      return candidate;
    }
    function flushFrame(time) {
      frameRequest = null;
      if (hidden()) {
        resetMeasurements(true);
        scheduleFrame();
        return;
      }
      if (!observeFrame(time)) {
        scheduleFrame();
        return;
      }
      const start = now();
      phase = "read";
      const reads = queues.read.splice(0);
      for (const task of reads) runTask(task);
      Promise.resolve().then(() => {
        phase = "update";
        const updates = queues.update.splice(0);
        for (const task of updates) runTask(task);
        if (nativeFPS !== null && samples.length) {
          const cost = now() - start;
          const sample = samples[samples.length - 1];
          sample.cost = cost;
          if (cost > 1e3 / Math.max(MIN_FPS, limitFPS) * 0.8) sample.slow = true;
        }
        phase = "idle";
        if (hasWork()) scheduleFrame();
        else idleSince = now();
      });
    }
    function removeTask(task) {
      tasks.delete(task);
      if (!task.group) return;
      task.group.tasks.delete(task);
      if (task.group[task.phase] === task) task.group[task.phase] = null;
      if (!task.group.sequence && task.group.tasks.size === 0 && groups.get(task.group.id) === task.group) groups.delete(task.group.id);
    }
    function settleTask(task, error, value) {
      if (task.state === "settled") return;
      task.state = "settled";
      removeTask(task);
      if (error) task.reject(value);
      else task.resolve(value);
    }
    function cancelTask(task) {
      if (task.state === "settled") return;
      if (task.state === "pending") {
        const queue = queues[task.phase];
        const index = queue.indexOf(task);
        if (index !== -1) queue.splice(index, 1);
      }
      settleTask(task, false, void 0);
    }
    function runTask(task) {
      if (task.state !== "pending") return;
      task.state = "running";
      if (task.group && task.group[task.phase] === task) task.group[task.phase] = null;
      let result;
      try {
        result = task.parameters ? task.callback.apply(void 0, task.parameters) : task.callback();
      } catch (error) {
        settleTask(task, true, error);
        return;
      }
      let then;
      try {
        then = result && result.then;
      } catch (error) {
        settleTask(task, true, error);
        return;
      }
      if (typeof then === "function") {
        Promise.resolve(result).then(
          (value) => settleTask(task, false, value),
          (error) => settleTask(task, true, error)
        );
      } else {
        settleTask(task, false, result);
      }
    }
    function makeGroup(id) {
      const group = { id, read: null, update: null, tasks: /* @__PURE__ */ new Set(), sequence: null };
      groups.set(id, group);
      return group;
    }
    function cancelGroup(group, status) {
      if (groups.get(group.id) === group) groups.delete(group.id);
      const sequence2 = group.sequence;
      if (sequence2 && sequence2.active) {
        sequence2.active = false;
        if (sequence2.timer !== null) clearTimeout(sequence2.timer);
        sequence2.timer = null;
        detachAbortSignals(sequence2);
        group.sequence = null;
      }
      for (const task of Array.from(group.tasks)) cancelTask(task);
      if (sequence2) sequence2.resolve({ id: group.id, status });
      stopFrameIfIdle();
    }
    function queueTask(kind, callback, parameters, id, owner) {
      let group = null;
      if (id !== void 0) {
        group = owner ? owner.group : groups.get(id);
        if (!owner && group && (group.sequence || group[kind])) {
          cancelGroup(group, "superseded");
          group = null;
        }
        if (!group) group = makeGroup(id);
      }
      let task;
      const promise = new Promise((resolve, reject) => {
        task = { phase: kind, callback, parameters, group, resolve, reject, state: "pending" };
      });
      tasks.add(task);
      if (group) {
        group[kind] = task;
        group.tasks.add(task);
      }
      queues[kind].push(task);
      scheduleFrame();
      return promise;
    }
    function validId(id) {
      if (!Number.isSafeInteger(id)) throw new TypeError("waitLayout ID must be a safe integer");
    }
    function request(kind, first, second, third) {
      if (typeof first === "number") {
        validId(first);
        return queueTask(kind, second, third, first, null);
      }
      return queueTask(kind, first, second, void 0, null);
    }
    function validateStages(stages) {
      if (!stages.length) throw new TypeError("sequence() requires at least one stage");
      return stages.map((stage) => {
        if (!stage || typeof stage !== "object" || typeof stage.read !== "function" && typeof stage.update !== "function") {
          throw new TypeError("Each sequence stage needs a read or update callback");
        }
        if (stage.read !== void 0 && typeof stage.read !== "function" || stage.update !== void 0 && typeof stage.update !== "function") {
          throw new TypeError("Sequence callbacks must be functions");
        }
        let abort = null;
        let signal = null;
        if (typeof stage.abort === "function") abort = stage.abort;
        else if (stage.abort !== void 0) {
          const candidate = stage.abort && (stage.abort.signal || stage.abort);
          if (!candidate || typeof candidate.aborted !== "boolean" || typeof candidate.addEventListener !== "function" || typeof candidate.removeEventListener !== "function") {
            throw new TypeError("abort must be a function, AbortController, or AbortSignal");
          }
          signal = candidate;
        }
        let interval = 0;
        let times = 1;
        if (stage.repeat !== void 0) {
          const repeat = stage.repeat;
          if (!repeat || typeof repeat !== "object" || repeat.ms !== void 0 && repeat.s !== void 0) {
            throw new TypeError("repeat must use either ms or s");
          }
          interval = repeat.ms !== void 0 ? repeat.ms : repeat.s !== void 0 ? repeat.s * 1e3 : 0;
          if (!Number.isFinite(interval) || interval < 0) throw new RangeError("Invalid repeat interval");
          times = repeat.times === void 0 ? repeat.ms !== void 0 || repeat.s !== void 0 ? Infinity : 1 : repeat.times;
          if (repeat.times !== void 0 && (!Number.isSafeInteger(times) || times < 1)) {
            throw new RangeError("repeat.times must be a positive integer");
          }
        }
        if (stage.maxFPS !== void 0 && (!Number.isFinite(stage.maxFPS) || stage.maxFPS <= 0)) {
          throw new RangeError("maxFPS must be positive");
        }
        return {
          read: stage.read,
          update: stage.update,
          abort,
          signal,
          interval,
          times,
          maxFPS: stage.maxFPS
        };
      });
    }
    function detachAbortSignals(owner) {
      for (const signal of owner.abortSignals) {
        signal.removeEventListener("abort", owner.abortHandler);
      }
      owner.abortSignals.length = 0;
    }
    function sequence(id, ...stages) {
      validId(id);
      const configs = validateStages(stages);
      const previous = groups.get(id);
      if (previous) cancelGroup(previous, "superseded");
      const group = makeGroup(id);
      let resolve;
      let reject;
      const result = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      const owner = {
        group,
        configs,
        index: 0,
        count: 0,
        lastStart: null,
        timer: null,
        active: true,
        resolve,
        reject,
        abortSignals: [],
        abortHandler: null
      };
      group.sequence = owner;
      owner.abortHandler = () => finishSequence(owner, "aborted");
      try {
        for (const config of configs) {
          if (config.signal && !owner.abortSignals.includes(config.signal)) {
            config.signal.addEventListener("abort", owner.abortHandler);
            owner.abortSignals.push(config.signal);
          }
        }
        if (owner.abortSignals.some((signal) => signal.aborted)) {
          finishSequence(owner, "aborted");
        } else {
          startIteration(owner);
        }
      } catch (error) {
        finishSequence(owner, null, error);
      }
      return result;
    }
    function finishSequence(owner, status, error) {
      if (!owner.active) return;
      const group = owner.group;
      owner.active = false;
      if (owner.timer !== null) clearTimeout(owner.timer);
      owner.timer = null;
      detachAbortSignals(owner);
      group.sequence = null;
      if (groups.get(group.id) === group) groups.delete(group.id);
      for (const task of Array.from(group.tasks)) cancelTask(task);
      stopFrameIfIdle();
      if (status === null) owner.reject(error);
      else owner.resolve({ id: group.id, status });
    }
    function checkAbort(owner, config) {
      if (!owner.active || !config.abort) return false;
      const result = config.abort();
      if (typeof result !== "boolean") throw new TypeError("abort must return a boolean");
      if (result) finishSequence(owner, "aborted");
      return result;
    }
    function startIteration(owner) {
      if (!owner.active) return;
      const config = owner.configs[owner.index];
      const previousStart = sequenceStarts.get(owner.group.id);
      const minimumStart = config.maxFPS === void 0 || !previousStart || previousStart.owner === owner ? 0 : previousStart.time + 1e3 / config.maxFPS;
      if (minimumStart > now()) {
        owner.timer = setTimeout(() => {
          owner.timer = null;
          startIteration(owner);
        }, Math.max(0, minimumStart - now() - 1));
        return;
      }
      try {
        if (checkAbort(owner, config)) return;
      } catch (error) {
        finishSequence(owner, null, error);
        return;
      }
      owner.lastStart = now();
      sequenceStarts.set(owner.group.id, { owner, time: owner.lastStart });
      const read = config.read ? queueTask("read", () => {
        if (checkAbort(owner, config)) return;
        return config.read();
      }, void 0, owner.group.id, owner) : Promise.resolve(void 0);
      read.then((value) => {
        if (!owner.active) return;
        try {
          if (checkAbort(owner, config)) return;
        } catch (error) {
          finishSequence(owner, null, error);
          return;
        }
        return config.update ? queueTask("update", (input) => {
          if (checkAbort(owner, config)) return;
          return config.update(input);
        }, [value], owner.group.id, owner) : void 0;
      }).then(() => {
        if (owner.active) completeIteration(owner, config);
      }, (error) => finishSequence(owner, null, error));
    }
    function completeIteration(owner, config) {
      owner.count++;
      if (owner.count >= config.times) {
        owner.index++;
        owner.count = 0;
        owner.lastStart = null;
        if (owner.index >= owner.configs.length) {
          finishSequence(owner, "completed");
          return;
        }
        startIteration(owner);
        return;
      }
      const completed = now();
      const fpsDue = config.maxFPS === void 0 ? completed : owner.lastStart + 1e3 / config.maxFPS;
      const due = Math.max(completed + config.interval, fpsDue);
      const delay = Math.max(0, due - now() - 1);
      if (delay > 1) {
        owner.timer = setTimeout(() => {
          owner.timer = null;
          startIteration(owner);
        }, delay);
      } else {
        startIteration(owner);
      }
    }
    function clear() {
      if (frameRequest !== null) cancelAnimationFrame(frameRequest);
      frameRequest = null;
      if (waitingForVisibility) document.removeEventListener("visibilitychange", onVisible);
      waitingForVisibility = false;
      for (const group of Array.from(groups.values())) cancelGroup(group, "cleared");
      for (const task of Array.from(tasks)) cancelTask(task);
      queues.read.length = 0;
      queues.update.length = 0;
      phase = "idle";
      idleSince = null;
      resetMeasurements(true);
      sequenceStarts.clear();
    }
    function cancel(id) {
      validId(id);
      const group = groups.get(id);
      if (!group) return false;
      cancelGroup(group, "aborted");
      return true;
    }
    return Object.freeze({
      read: (first, second, third) => request("read", first, second, third),
      update: (first, second, third) => request("update", first, second, third),
      sequence,
      cancel,
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
        root.AelluxJs.onEvent(element, event, handler, options);
      },
      off(event, handler, options) {
        root.AelluxJs.offEvent(element, event, handler, options);
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

  // src/internal/create-css-motion-controller.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function createCssMotionController(root, getAelluxJs) {
    const operations = /* @__PURE__ */ new Map();
    let nextId = 4e6;
    function id() {
      return nextId++;
    }
    function supported(element) {
      if (getAelluxJs().options.cssMotionController === false) return false;
      const Animation = root.Animation;
      return !!(element && typeof element.getAnimations === "function" && Animation && Animation.prototype && typeof Animation.prototype.pause === "function" && "currentTime" in Animation.prototype);
    }
    function cancel(operationId) {
      const operation = operations.get(operationId);
      if (!operation) return false;
      operation.cancelled = true;
      getAelluxJs().waitLayout.cancel(operationId);
      const nativeResolve = operation.nativeResolve;
      release(operation, false);
      if (nativeResolve) nativeResolve({ id: operationId, status: "aborted", mode: "native" });
      return true;
    }
    function run(element, options = {}) {
      const AelluxJs2 = getAelluxJs();
      const operationId = options.id;
      if (!Number.isSafeInteger(operationId))
        return Promise.reject(new TypeError("motion.run() requires a safe integer ID"));
      if (!element || element.nodeType !== 1 || typeof options.apply !== "function")
        return Promise.reject(new TypeError("motion.run() requires an Element and apply callback"));
      cancel(operationId);
      const operation = {
        id: operationId,
        element,
        options,
        animations: [],
        before: /* @__PURE__ */ new Set(),
        start: 0,
        endTime: 0,
        done: false,
        cancelled: false,
        controlled: false,
        captureFailed: false,
        conservative: false,
        nativeTimer: null,
        nativeResolve: null
      };
      operations.set(operationId, operation);
      if (AelluxJs2.currentPreference("reduced-motion") === "reduced") {
        options.apply();
        operations.delete(operationId);
        return Promise.resolve({ id: operationId, status: "completed", mode: "reduced" });
      }
      if (!supported(element)) return nativeRun(operation);
      try {
        for (const animation of element.getAnimations()) operation.before.add(animation);
        options.apply();
      } catch (error) {
        operations.delete(operationId);
        return Promise.reject(error);
      }
      const requestedMaxFPS = options.maxFPS === void 0 ? AelluxJs2.layoutMaxFPS(element) : options.maxFPS;
      const externalAbort = typeof options.abort === "function" ? options.abort : null;
      const shouldAbort = () => operation.cancelled || !element.isConnected || (externalAbort ? externalAbort() : false);
      const captureResult = AelluxJs2.waitLayout.sequence(operationId, {
        read: () => capture(operation),
        update: (animations) => prepare(operation, animations),
        abort: shouldAbort
      });
      return captureResult.then((sequenceResult) => {
        if (sequenceResult.status !== "completed") {
          release(operation, false);
          return { id: operationId, status: sequenceResult.status, mode: "native" };
        }
        if (operation.captureFailed && !operation.cancelled) {
          release(operation, false);
          operations.set(operationId, operation);
          return nativeWait(operation);
        }
        const policyFPS = operation.conservative ? propertyPolicyFPS(AelluxJs2.options.cssMotionPropertyMaxFPS, AelluxJs2) : void 0;
        const maxFPS = minimumFPS(requestedMaxFPS, policyFPS);
        return AelluxJs2.waitLayout.sequence(operationId, {
          update: () => advance(operation),
          repeat: { ms: 0 },
          maxFPS,
          abort: () => operation.done || shouldAbort()
        }).then((progressResult) => {
          const completed = operation.done && !operation.cancelled;
          release(operation, completed);
          return {
            id: operationId,
            status: completed ? "completed" : progressResult.status,
            mode: "controlled"
          };
        });
      }, (error) => {
        release(operation, false, true);
        throw error;
      });
    }
    function capture(operation) {
      operation.element.getBoundingClientRect();
      return operation.element.getAnimations().filter((animation) => !operation.before.has(animation) && controllable(animation));
    }
    function controllable(animation) {
      try {
        const effect = animation && animation.effect;
        return !!(effect && typeof effect.getComputedTiming === "function" && typeof animation.pause === "function");
      } catch (_) {
        return false;
      }
    }
    function prepare(operation, animations) {
      if (!animations.length) {
        operation.captureFailed = true;
        operation.done = true;
        return;
      }
      let endTime = 0;
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = 0;
        const timing = animation.effect.getComputedTiming();
        const end = Number(timing.endTime);
        if (Number.isFinite(end)) endTime = Math.max(endTime, end);
        applyAelluxEasing(operation, animation);
        if (!onlyTransformAndOpacity(animation)) operation.conservative = true;
      }
      operation.animations = animations;
      operation.endTime = endTime;
      operation.start = now();
      operation.controlled = true;
      if (!(endTime > 0)) operation.done = true;
    }
    function onlyTransformAndOpacity(animation) {
      try {
        if (typeof root.CSSTransition === "function" && animation instanceof root.CSSTransition) {
          return animation.transitionProperty === "transform" || animation.transitionProperty === "opacity";
        }
        const frames = animation.effect.getKeyframes();
        if (!frames.length) return false;
        const metadata = /* @__PURE__ */ new Set(["offset", "computedOffset", "easing", "composite"]);
        let found = false;
        for (const frame of frames) {
          for (const property of Object.keys(frame)) {
            if (metadata.has(property)) continue;
            found = true;
            if (property !== "transform" && property !== "opacity") return false;
          }
        }
        return found;
      } catch (_) {
        return false;
      }
    }
    function positiveFPS(value, fallback) {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? number : fallback;
    }
    function propertyPolicyFPS(value, AelluxJs2) {
      if (value === null || value === 0) return void 0;
      const number = Number(value);
      if (Number.isFinite(number) && number > 0) return number;
      if (value !== void 0) {
        AelluxJs2.diagnostics.warn(
          AelluxJs2.diagnostics.WARN_CSS_MOTION_PROPERTY_MAX_FPS_INVALID,
          { option: "cssMotionPropertyMaxFPS", value, fallback: 40 }
        );
      }
      return 40;
    }
    function minimumFPS(first, second) {
      const values = [first, second].filter((value) => Number.isFinite(value) && value > 0);
      return values.length ? Math.min(...values) : void 0;
    }
    function advance(operation) {
      if (!operation.controlled || operation.done) return;
      const elapsed = Math.max(0, now() - operation.start);
      const time = Math.min(elapsed, operation.endTime);
      for (const animation of operation.animations) animation.currentTime = time;
      if (elapsed >= operation.endTime) operation.done = true;
    }
    function applyAelluxEasing(operation, animation) {
      const name = operation.options.easing;
      if (!name || !root.CSS || typeof root.CSS.supports !== "function" || !animation.effect || typeof animation.effect.updateTiming !== "function") return;
      const easing = sampledLinear(name);
      if (!easing || !root.CSS.supports("animation-timing-function", easing)) return;
      animation.effect.updateTiming({ easing });
    }
    function sampledLinear(name) {
      const AelluxJs2 = getAelluxJs();
      const points = [];
      try {
        for (let index = 0; index <= 60; index++) {
          const progress = index / 60;
          const value = AelluxJs2.ease(name, progress);
          if (!Number.isFinite(value)) return null;
          points.push(`${round(value)} ${round(progress * 100)}%`);
        }
      } catch (_) {
        return null;
      }
      return `linear(${points.join(", ")})`;
    }
    function nativeRun(operation) {
      operation.options.apply();
      return nativeWait(operation);
    }
    function nativeWait(operation) {
      const animations = typeof operation.element.getAnimations === "function" ? operation.element.getAnimations().filter((animation) => !operation.before.has(animation)) : [];
      if (animations.length && animations.every((animation) => animation.finished && typeof animation.finished.then === "function")) {
        return Promise.all(animations.map((animation) => animation.finished.catch(() => void 0))).then(() => {
          if (operations.get(operation.id) === operation) operations.delete(operation.id);
          return { id: operation.id, status: operation.cancelled ? "aborted" : "completed", mode: "native" };
        });
      }
      const explicit = Number(operation.options.nativeDuration);
      const duration = Number.isFinite(explicit) ? explicit : cssMotionTime(operation.element);
      return new Promise((resolve) => {
        operation.nativeResolve = resolve;
        const complete = () => {
          if (operations.get(operation.id) !== operation) return;
          operations.delete(operation.id);
          operation.nativeResolve = null;
          resolve({ id: operation.id, status: "completed", mode: "native" });
        };
        if (Number.isFinite(duration) && duration > 0) {
          operation.nativeTimer = root.setTimeout(complete, duration);
        } else {
          Promise.resolve().then(complete);
        }
      });
    }
    function cssMotionTime(element) {
      try {
        const style = root.getComputedStyle(element);
        return Math.max(
          listTime(style.animationDuration, style.animationDelay, style.animationIterationCount),
          listTime(style.transitionDuration, style.transitionDelay)
        );
      } catch (_) {
        return 0;
      }
    }
    function listTime(durations, delays, iterations) {
      const durationList = String(durations || "0s").split(",");
      const delayList = String(delays || "0s").split(",");
      const iterationList = String(iterations || "1").split(",");
      const count = Math.max(durationList.length, delayList.length, iterationList.length);
      let maximum = 0;
      for (let index = 0; index < count; index++) {
        const duration = cssTime(durationList[index % durationList.length]);
        const delay = cssTime(delayList[index % delayList.length]);
        const rawIterations = iterationList[index % iterationList.length].trim();
        const iterationCount = rawIterations === "infinite" ? 1 : Number(rawIterations);
        maximum = Math.max(maximum, Math.max(0, delay) + duration * (Number.isFinite(iterationCount) ? Math.max(0, iterationCount) : 1));
      }
      return maximum;
    }
    function cssTime(value) {
      const text = String(value || "0s").trim().toLowerCase();
      const number = parseFloat(text);
      if (!Number.isFinite(number)) return 0;
      return text.endsWith("ms") ? number : number * 1e3;
    }
    function release(operation, finish, resume = false) {
      if (operation.nativeTimer !== null) root.clearTimeout(operation.nativeTimer);
      operation.nativeTimer = null;
      for (const animation of operation.animations) {
        try {
          if (finish) animation.finish();
          else if (resume) animation.play();
          else animation.cancel();
        } catch (_) {
        }
      }
      operation.animations.length = 0;
      if (operations.get(operation.id) === operation) operations.delete(operation.id);
    }
    function now() {
      return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
    }
    function round(value) {
      return Math.round(value * 1e5) / 1e5;
    }
    return Object.freeze({ run, cancel, id, supported });
  }

  // src/internal/ease.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var EASE_PREFIX = "ease";
  var IN = "in";
  var OUT = "out";
  var IN_OUT = "inout";
  var DIRECTIONS = [IN_OUT, OUT, IN];
  var QUAD = "quad";
  var CUBIC = "cubic";
  var QUART = "quart";
  var QUINT = "quint";
  var SINE = "sine";
  var EXPO = "expo";
  var CIRC = "circ";
  var BACK = "back";
  var ELASTIC = "elastic";
  var BOUNCE = "bounce";
  var FAMILIES = [QUAD, CUBIC, QUART, QUINT, SINE, EXPO, CIRC, BACK, ELASTIC, BOUNCE];
  var ALIASES = {
    quadratic: QUAD,
    quartic: QUART,
    quintic: QUINT,
    sinusoidal: SINE,
    exponential: EXPO,
    circular: CIRC
  };
  function bounceOut(t) {
    const n = 7.5625;
    const d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) {
      t -= 1.5 / d;
      return n * t * t + 0.75;
    }
    if (t < 2.5 / d) {
      t -= 2.25 / d;
      return n * t * t + 0.9375;
    }
    t -= 2.625 / d;
    return n * t * t + 0.984375;
  }
  function easeIn(family, t) {
    switch (family) {
      case QUAD:
        return t * t;
      case CUBIC:
        return t * t * t;
      case QUART:
        return t * t * t * t;
      case QUINT:
        return t * t * t * t * t;
      case SINE:
        return 1 - Math.cos(t * Math.PI / 2);
      case EXPO:
        return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
      case CIRC:
        return 1 - Math.sqrt(1 - t * t);
      case BACK:
        return t * t * (2.70158 * t - 1.70158);
      case ELASTIC:
        return t === 0 || t === 1 ? t : -Math.pow(2, 10 * t - 10) * Math.sin((10 * t - 10.75) * 2 * Math.PI / 3);
      case BOUNCE:
        return 1 - bounceOut(1 - t);
      default:
        throw new RangeError(`Unknown easing family: ${family}`);
    }
  }
  function ease(name, t) {
    if (typeof name !== "string" || typeof t !== "number" || !Number.isFinite(t)) {
      throw new TypeError("ease(name, t) requires a name and a finite number");
    }
    t = Math.min(1, Math.max(0, t));
    let key = name.replace(/[\s_-]/g, "").toLowerCase();
    if (key.startsWith(EASE_PREFIX)) key = key.slice(EASE_PREFIX.length);
    if (key === "linear") return t;
    if (key === "smoothstep") return t * t * (3 - 2 * t);
    if (key === "smootherstep") return t * t * t * (t * (6 * t - 15) + 10);
    let family = "";
    let direction = "";
    for (const candidate of DIRECTIONS) {
      if (key.endsWith(candidate)) {
        family = key.slice(0, -candidate.length);
        direction = candidate;
        break;
      }
      if (key.startsWith(candidate)) {
        family = key.slice(candidate.length);
        direction = candidate;
        break;
      }
    }
    family = ALIASES[family] || family;
    if (!FAMILIES.includes(family)) throw new RangeError(`Unknown easing: ${name}`);
    if (direction === IN) return easeIn(family, t);
    if (direction === OUT) return 1 - easeIn(family, 1 - t);
    if (family === BACK) {
      const c = 1.70158 * 1.525;
      const x = t < 0.5 ? 2 * t : 2 * t - 2;
      return t < 0.5 ? x * x * ((c + 1) * x - c) / 2 : (x * x * ((c + 1) * x + c) + 2) / 2;
    }
    if (family === ELASTIC) {
      if (t === 0 || t === 1) return t;
      const wave = Math.sin((20 * t - 11.125) * 2 * Math.PI / 4.5);
      return t < 0.5 ? -Math.pow(2, 20 * t - 10) * wave / 2 : Math.pow(2, -20 * t + 10) * wave / 2 + 1;
    }
    return t < 0.5 ? easeIn(family, 2 * t) / 2 : 1 - easeIn(family, 2 - 2 * t) / 2;
  }

  // src/aellux.orchestrator.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const { toCamelCase: toCamelCase2, fromCamelCase: fromCamelCase2 } = utils_name_case_default;
    const officialPackage = "@aelluxjs/core";
    const orchestratorVersion = true ? "0.1.0-beta.10" : "0.1.0-beta.10";
    if (root.AelluxJs.version !== orchestratorVersion) {
      const error = root.AelluxJs.diagnostics.error(
        root.AelluxJs.diagnostics.ERROR_RUNTIME_VERSION_MISMATCH,
        { expected: root.AelluxJs.version, found: orchestratorVersion }
      );
      root.AelluxJs.orchestratorVersion = orchestratorVersion;
      root.AelluxJs.startAelluxJs = () => Promise.reject(error);
      return;
    }
    root.AelluxJs.orchestratorVersion = orchestratorVersion;
    const extensionPromises = {};
    const aria = createAriaHelper();
    const mountManager = buildMountMapManager(root);
    const layoutScheduler = buildLayoutScheduler();
    const motion = createCssMotionController(root, () => root.AelluxJs);
    root.AelluxJs = Object.assign(
      root.AelluxJs,
      {
        async startAelluxJs() {
          if (root.AelluxJs.bundledExtensions) {
            Object.keys(root.AelluxJs.bundledExtensions).forEach((key) => {
              if (!(key in AelluxJs.registry.ext)) AelluxJs.ext(key);
              const name = fromCamelCase2(key);
              const metadata = AelluxJs.extIndex.official && AelluxJs.extIndex.official.extensions[name];
              if (metadata && metadata.coreCompatibility) {
                AelluxJs.registry.ext[key].coreCompatibility = metadata.coreCompatibility;
                AelluxJs.registry.ext[key].official = true;
              }
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
        ease,
        aria,
        motion,
        waitLayout: layoutScheduler,
        mountManager
      }
    );
    root[root.AelluxJs.shortJSName] = root.AelluxJs;
    function getExtension(extensionName) {
      const request = parseExtensionRequest(extensionName);
      extensionName = request.name;
      const key = toCamelCase2(extensionName);
      if (extensionPromises[key])
        return extensionPromises[key];
      if (!(key in AelluxJs.registry.ext)) {
        return Promise.reject(AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_NOT_REGISTERED,
          { extension: extensionName }
        ));
      }
      if (AelluxJs.ext[key]) {
        if (AelluxJs.ext[key].initialized) {
          extensionPromises[key] = Promise.resolve(AelluxJs.ext[key]);
        } else {
          extensionPromises[key] = Promise.resolve().then(() => extensionInitialize(extensionName)).catch((error) => {
            if (!error || !error.aelluxCompatibility) {
              AelluxJs.diagnostics.error(
                AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
                { cause: error, extension: extensionName }
              );
            }
            delete extensionPromises[key];
            return null;
          });
        }
        return extensionPromises[key];
      }
      const bundledLoader = AelluxJs.bundledExtensions ? AelluxJs.bundledExtensions[key] : null;
      extensionPromises[key] = Promise.resolve().then(() => {
        const registration = AelluxJs.registry.ext[key];
        return (registration.implicit || request.version) && !bundledLoader && !AelluxJs.ext[key] ? resolveImplicitRegistration(extensionName, registration, request.version) : registration;
      }).then(async (data) => {
        if (!hasCompatibleBuild(data)) {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_INCOMPATIBLE,
            {
              extension: extensionName,
              runtime: AelluxJs.diagnostics.legacy ? "legacy" : "modern",
              builds: data && data.builds
            }
          );
          delete AelluxJs.registry.lazyExtSelectors[key];
          return null;
        }
        if (!AelluxJs.ext[key]) await appendExtensionAssets(extensionName, bundledLoader);
        if (!AelluxJs.ext[key].initialized) return extensionInitialize(extensionName);
        return AelluxJs.ext[key];
      }).catch((error) => {
        if (!error || !error.aelluxCompatibility) {
          const registration = AelluxJs.registry.ext[key];
          if (registration && registration.implicit && !registration.manifestResolved) {
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_NOT_FOUND,
              { extension: extensionName }
            );
          }
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_INITIALIZE,
            { cause: error, extension: extensionName }
          );
        }
        delete extensionPromises[key];
        return null;
      });
      return extensionPromises[key];
    }
    function parseExtensionRequest(value) {
      const text = String(value || "").trim();
      const match = /^([a-z][a-z0-9-]*)(?:@([0-9]+(?:\.[0-9]+){0,2}(?:-[0-9A-Za-z.-]+)?))?$/i.exec(text);
      return { name: fromCamelCase2(match ? match[1] : text), version: match && match[2] || null };
    }
    async function extensionInitialize(extensionName) {
      extensionName = fromCamelCase2(extensionName);
      const key = toCamelCase2(extensionName);
      const registration = AelluxJs.registry.ext[key];
      if (registration.coreCompatibility && !versionSatisfies(AelluxJs.version, registration.coreCompatibility)) {
        const context = {
          extension: extensionName,
          coreVersion: AelluxJs.version,
          coreCompatibility: registration.coreCompatibility
        };
        if (registration.skipCompatibilityCheck === true) {
          AelluxJs.diagnostics.warn(
            AelluxJs.diagnostics.WARN_EXTENSION_COMPATIBILITY_SKIPPED,
            __spreadProps(__spreadValues({}, context), { explicitlySkipped: true })
          );
        } else {
          const error = AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_EXTENSION_VERSION_INCOMPATIBLE,
            context
          );
          error.aelluxCompatibility = true;
          throw error;
        }
      }
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
      const useLegacyBuild = AelluxJs.diagnostics.legacy || data.builds.indexOf("modern") === -1;
      const artifact = data.artifacts && data.artifacts[useLegacyBuild ? "legacy" : "modern"];
      const url = data.url.replace(/^\.\//, AelluxJs.aelluxBasePath);
      const scriptURL = artifact ? artifact.url : useLegacyBuild ? toLegacyScriptURL(url) : url;
      const minifiedScript = /\.min\.js(?=[?#]|$)/.test(scriptURL);
      const scriptVariant = useLegacyBuild ? minifiedScript ? "legacyMin" : "legacy" : minifiedScript ? "modernMin" : "modern";
      const loadPromises = [];
      for (const dependency of data.dependencies || []) {
        if (typeof dependency === "string") continue;
        loadPromises.push(AelluxJs.dep(
          dependency.label,
          dependency.url,
          { integrity: dependency.integrity, crossOrigin: dependency.crossOrigin }
        ));
      }
      if (bundledLoader) {
        loadPromises.push(Promise.resolve().then(() => bundledLoader()));
      } else {
        loadPromises.push(new Promise(
          (resolve, reject) => {
            const attr = AelluxJs.attr("ext");
            const script = document.createElement("script");
            script.src = scriptURL;
            script.setAttribute(attr, extensionName);
            applyAssetIntegrity(script, artifact && artifact.integrity || getExtensionIntegrity(data, scriptVariant, scriptURL), data.crossOrigin);
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
            const href = data.styleArtifact ? data.styleArtifact.url : styleDefaultURL ? url.replace(/\.js(?=[?#]|$)/, ".css") : data.loadStyle;
            const attrStyle = AelluxJs.attr("ext-style");
            const link = document.createElement("link");
            link.href = href;
            link.rel = "stylesheet";
            link.setAttribute(attrStyle, extensionName);
            applyAssetIntegrity(link, data.styleArtifact && data.styleArtifact.integrity || getExtensionIntegrity(data, "style", href), data.crossOrigin);
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
    async function resolveImplicitRegistration(extensionName, registration, requestedVersion = null) {
      const officialURL = AelluxJs.extIndex.officialURL || AelluxJs.aelluxBasePath + "aellux.extensions.min.json";
      const requestedURL = requestedVersion && requestedVersion !== AelluxJs.version ? `https://cdn.jsdelivr.net/npm/${officialPackage}@${encodeURIComponent(requestedVersion)}/dist/aellux.extensions.min.json` : officialURL;
      let entry = null;
      let sourceURL = requestedURL;
      try {
        const embeddedOfficial = requestedVersion ? null : AelluxJs.extIndex.official;
        const embeddedEntry = embeddedOfficial && embeddedOfficial.extensions[extensionName];
        const official = embeddedEntry && embeddedEntry.builds ? embeddedOfficial : await loadExtensionIndex(requestedVersion ? `official@${requestedVersion}` : "official", requestedURL);
        entry = official.extensions[extensionName] || null;
      } catch (error) {
        reportIndexFailure(error, "official", requestedURL);
      }
      if (!entry && AelluxJs.extIndex.fallbackURL) {
        sourceURL = AelluxJs.extIndex.fallbackURL;
        try {
          const fallback = AelluxJs.extIndex.fallback || await loadExtensionIndex("fallback", sourceURL);
          entry = fallback.extensions[extensionName] || null;
        } catch (error) {
          reportIndexFailure(error, "custom", sourceURL);
        }
      }
      if (!entry) return registration;
      applyManifestEntry(registration, entry, sourceURL, extensionName);
      return registration;
    }
    function loadExtensionIndex(kind, url) {
      const promiseKey = kind + "Promise";
      if (AelluxJs.extIndex[promiseKey]) return AelluxJs.extIndex[promiseKey];
      validateManifestURL(url, kind);
      AelluxJs.extIndex[promiseKey] = AelluxJs.request(url).then((response) => response.json()).then((index) => {
        validateExtensionIndex(index, kind, url);
        AelluxJs.extIndex[kind] = index;
        AelluxJs.diagnostics.info(
          AelluxJs.diagnostics.INFO_EXTENSION_INDEX_LOADED,
          { source: kind, url, extensions: Object.keys(index.extensions).length }
        );
        return index;
      }).catch((error) => {
        AelluxJs.extIndex[promiseKey] = null;
        throw error;
      });
      return AelluxJs.extIndex[promiseKey];
    }
    function validateManifestURL(url, kind) {
      let parsed;
      try {
        parsed = new URL(url, document.baseURI);
      } catch (_) {
        throw manifestError(kind, url, "valid URL");
      }
      const development = AelluxJs.options.environment === "development";
      if (parsed.protocol !== "https:" && parsed.origin !== location.origin && !development) {
        throw manifestError(kind, url, "HTTPS for external manifests");
      }
    }
    function validateExtensionIndex(index, kind, url) {
      if (!index || index.schemaVersion !== 1 || typeof index.coreVersion !== "string" || !index.extensions || typeof index.extensions !== "object" || Array.isArray(index.extensions)) {
        throw manifestError(kind, url, "schemaVersion 1, coreVersion, and extensions object");
      }
      if (index.coreVersion !== AelluxJs.version) {
        throw manifestError(
          kind,
          url,
          `coreVersion ${AelluxJs.version} (received ${index.coreVersion})`
        );
      }
      for (const [name, entry] of Object.entries(index.extensions)) {
        if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || !entry || typeof entry.coreCompatibility !== "string" || !entry.builds || typeof entry.builds !== "object") {
          throw manifestError(kind, url, `valid metadata for ${name}`);
        }
        for (const variant of ["modern", "legacy"]) {
          const artifact = entry.builds[variant];
          if (!artifact) continue;
          if (typeof artifact.url !== "string" || typeof artifact.integrity !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(artifact.integrity)) {
            throw manifestError(kind, url, `URL and SHA-384 integrity for ${name}/${variant}`);
          }
          validateArtifactURL(artifact.url, url, kind);
          if (artifact.regular) {
            if (typeof artifact.regular.url !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(artifact.regular.integrity || "")) {
              throw manifestError(kind, url, `regular URL and SHA-384 integrity for ${name}/${variant}`);
            }
            validateArtifactURL(artifact.regular.url, url, kind);
          }
        }
        if (!entry.builds.modern && !entry.builds.legacy)
          throw manifestError(kind, url, `a runtime build for ${name}`);
        if (entry.style) {
          if (typeof entry.style.url !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(entry.style.integrity || "")) {
            throw manifestError(kind, url, `URL and SHA-384 integrity for ${name}/style`);
          }
          validateArtifactURL(entry.style.url, url, kind);
          if (entry.style.regular) {
            if (typeof entry.style.regular.url !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(entry.style.regular.integrity || "")) {
              throw manifestError(kind, url, `regular URL and SHA-384 integrity for ${name}/style`);
            }
            validateArtifactURL(entry.style.regular.url, url, kind);
          }
        }
        if (!Array.isArray(entry.dependencies)) {
          throw manifestError(kind, url, `dependencies array for ${name}`);
        }
        for (const dependency of entry.dependencies) {
          if (typeof dependency === "string") continue;
          if (!dependency || typeof dependency.label !== "string" || !dependency.label.trim() || typeof dependency.url !== "string" || typeof dependency.integrity !== "string" || !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(dependency.integrity)) {
            throw manifestError(kind, url, `dependency URL and SHA-384 integrity for ${name}`);
          }
          validateArtifactURL(dependency.url, url, kind);
        }
      }
    }
    function validateArtifactURL(url, manifestURL, kind) {
      let parsed;
      try {
        parsed = new URL(url, new URL(manifestURL, document.baseURI));
      } catch (_) {
        throw manifestError(kind, manifestURL, `valid artifact URL: ${url}`);
      }
      const development = AelluxJs.options.environment === "development";
      if (parsed.protocol !== "https:" && parsed.origin !== location.origin && !development)
        throw manifestError(kind, manifestURL, `HTTPS artifact URL: ${url}`);
    }
    function manifestError(kind, url, expected) {
      return AelluxJs.diagnostics.create(
        AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID,
        { source: kind, url, expected }
      );
    }
    function reportIndexFailure(error, source, url) {
      if (error && error.code === AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID.code) {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_INVALID,
          { source, url, expected: error.context && error.context.expected, cause: error }
        );
      } else {
        AelluxJs.diagnostics.error(
          AelluxJs.diagnostics.ERROR_EXTENSION_INDEX_LOAD,
          { source, url, cause: error }
        );
      }
    }
    function applyManifestEntry(registration, entry, manifestURL, extensionName) {
      const base = new URL(manifestURL, document.baseURI);
      const artifacts = {};
      for (const variant of ["modern", "legacy"]) {
        if (entry.builds[variant] && (!registration.explicitBuilds || registration.builds.includes(variant))) {
          const declared = !AelluxJs.minified && entry.builds[variant].regular ? entry.builds[variant].regular : entry.builds[variant];
          artifacts[variant] = {
            url: new URL(declared.url, base).href,
            integrity: declared.integrity
          };
        }
      }
      const selected = artifacts[AelluxJs.diagnostics.legacy ? "legacy" : "modern"] || !AelluxJs.diagnostics.legacy && artifacts.legacy;
      registration.artifacts = artifacts;
      registration.manifestResolved = true;
      registration.builds = Object.keys(artifacts);
      if (selected) registration.url = selected.url;
      registration.coreCompatibility = entry.coreCompatibility;
      registration.dependencies = (entry.dependencies || []).map((dependency) => typeof dependency === "string" ? dependency : __spreadProps(__spreadValues({}, dependency), {
        url: new URL(dependency.url, base).href
      }));
      registration.official = AelluxJs.extIndex.official && AelluxJs.extIndex.official.extensions[extensionName] === entry;
      if (entry.style && registration.loadStyle && registration.loadStyle !== "false") {
        const declaredStyle = !AelluxJs.minified && entry.style.regular ? entry.style.regular : entry.style;
        registration.styleArtifact = {
          url: new URL(declaredStyle.url, base).href,
          integrity: declaredStyle.integrity
        };
      }
    }
    function versionSatisfies(version, range) {
      if (typeof range !== "string" || !range.trim()) return true;
      return range.split("||").some((group) => group.trim().split(/\s+/).every((token) => {
        if (token === "*" || token.toLowerCase() === "latest") return true;
        const match = token.match(/^(\^|~|>=|<=|>|<|=)?(.+)$/);
        if (!match) return false;
        const operator = match[1] || "=";
        const comparison = compareVersions(version, match[2]);
        if (operator === "=") return comparison === 0;
        if (operator === ">") return comparison > 0;
        if (operator === ">=") return comparison >= 0;
        if (operator === "<") return comparison < 0;
        if (operator === "<=") return comparison <= 0;
        const current = parseVersion(version);
        const expected = parseVersion(match[2]);
        if (!current || !expected || comparison < 0) return false;
        if (operator === "~") return current[0] === expected[0] && current[1] === expected[1];
        return expected[0] > 0 ? current[0] === expected[0] : expected[1] > 0 ? current[0] === 0 && current[1] === expected[1] : current[0] === 0 && current[1] === 0 && current[2] === expected[2];
      }));
    }
    function compareVersions(first, second) {
      const a = parseVersion(first);
      const b = parseVersion(second);
      if (!a || !b) return first === second ? 0 : -1;
      for (let index = 0; index < 3; index++) if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
      if (a[3] === b[3]) return 0;
      if (!a[3]) return 1;
      if (!b[3]) return -1;
      return a[3] > b[3] ? 1 : -1;
    }
    function parseVersion(version) {
      const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] || ""] : null;
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
