/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function buildLayoutScheduler() {
  const MIN_FPS = 5;
  const FPS_STEP = 15;
  const queues = { read: [], update: [] };
  const groups = new Map();
  const tasks = new Set();
  // Survives replacement of a sequence so event coalescing cannot bypass an
  // element's FPS limit.
  const sequenceStarts = new Map();
  let frameRequest = null;
  let phase = "idle";
  let waitingForVisibility = false;
  let idleSince = null;

  // rAF timestamps measure browser cadence; performance.now() measures callback cost.
  let nativeFPS = null;
  let limitFPS = null;
  let initialDeltas = [];
  let lastFrameTime = null;
  let frameCredit = 0;
  let samples = [];
  let slowStreak = 0;
  let lastAdjustment = -Infinity;
  let stableSince = null;
  let recoveryDelay = 3000;
  let trialLimit = null;

  const now = () => performance.now();
  const hidden = () => typeof document !== "undefined" && document.hidden;
  const hasWork = () => queues.read.length > 0 || queues.update.length > 0;

  function publishLimit() {
    if (typeof document === "undefined" || !document.documentElement) return;
    const value = nativeFPS !== null && limitFPS !== null && limitFPS < nativeFPS
      ? String(limitFPS) : null;
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
    recoveryDelay = 3000;
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
        nativeFPS = Math.max(MIN_FPS, Math.round(1000 / ordered[4]));
        limitFPS = nativeFPS;
        initialDeltas = [];
      }
    } else {
      const expected = 1000 / Math.max(MIN_FPS, limitFPS);
      const slow = delta > expected * 1.23;
      slowStreak = slow ? slowStreak + 1 : 0;
      samples.push({ time, slow, delay: delta, cost: 0 });
      while (samples.length && time - samples[0].time > 1000) samples.shift();
      adjustLimit(time);
    }
    if (limitFPS === null || limitFPS >= nativeFPS) return true;
    const period = 1000 / limitFPS;
    frameCredit += delta;
    if (frameCredit + 0.001 < period) return false;
    frameCredit = Math.min(period, frameCredit - period);
    return true;
  }

  function adjustLimit(time) {
    if (samples.length < 8 || time - samples[0].time < 700) return;
    const slowCount = samples.reduce((n, item) => n + (item.slow ? 1 : 0), 0);
    if (slowStreak >= 4 || slowCount / samples.length >= 0.35) {
      stableSince = null;
      if (time - lastAdjustment >= 1000 && limitFPS > MIN_FPS) {
        const previous = limitFPS;
        const delay = Math.max(...samples.filter(sample => sample.slow)
          .map(sample => Math.max(sample.delay, sample.cost)));
        limitFPS = Math.min(limitFPS, adaptiveLimit(1000 / delay));
        publishLimit();
        if (trialLimit === previous) recoveryDelay = Math.min(30000, recoveryDelay * 2);
        trialLimit = null;
        lastAdjustment = time;
        samples = [];
        slowStreak = 0;
        frameCredit = 0;
      }
    } else {
      if (stableSince === null) stableSince = time;
      if (limitFPS < nativeFPS && time - stableSince >= recoveryDelay &&
          time - lastAdjustment >= recoveryDelay) {
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
        if (cost > (1000 / Math.max(MIN_FPS, limitFPS)) * 0.8) sample.slow = true;
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
    if (!task.group.sequence && task.group.tasks.size === 0 &&
        groups.get(task.group.id) === task.group) groups.delete(task.group.id);
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
    settleTask(task, false, undefined);
  }

  function runTask(task) {
    if (task.state !== "pending") return;
    task.state = "running";
    if (task.group && task.group[task.phase] === task) task.group[task.phase] = null;
    let result;
    try {
      result = task.parameters
        ? task.callback.apply(undefined, task.parameters)
        : task.callback();
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
        value => settleTask(task, false, value),
        error => settleTask(task, true, error)
      );
    } else {
      settleTask(task, false, result);
    }
  }

  function makeGroup(id) {
    const group = { id, read: null, update: null, tasks: new Set(), sequence: null };
    groups.set(id, group);
    return group;
  }

  function cancelGroup(group, status) {
    if (groups.get(group.id) === group) groups.delete(group.id);
    const sequence = group.sequence;
    if (sequence && sequence.active) {
      sequence.active = false;
      if (sequence.timer !== null) clearTimeout(sequence.timer);
      sequence.timer = null;
      detachAbortSignals(sequence);
      group.sequence = null;
    }
    for (const task of Array.from(group.tasks)) cancelTask(task);
    if (sequence) sequence.resolve({ id: group.id, status });
    stopFrameIfIdle();
  }

  function queueTask(kind, callback, parameters, id, owner) {
    let group = null;
    if (id !== undefined) {
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
    return queueTask(kind, first, second, undefined, null);
  }

  function validateStages(stages) {
    if (!stages.length) throw new TypeError("sequence() requires at least one stage");
    return stages.map(stage => {
      if (!stage || typeof stage !== "object" ||
          (typeof stage.read !== "function" && typeof stage.update !== "function")) {
        throw new TypeError("Each sequence stage needs a read or update callback");
      }
      if ((stage.read !== undefined && typeof stage.read !== "function") ||
          (stage.update !== undefined && typeof stage.update !== "function")) {
        throw new TypeError("Sequence callbacks must be functions");
      }
      let abort = null;
      let signal = null;
      if (typeof stage.abort === "function") abort = stage.abort;
      else if (stage.abort !== undefined) {
        const candidate = stage.abort && (stage.abort.signal || stage.abort);
        if (!candidate || typeof candidate.aborted !== "boolean" ||
            typeof candidate.addEventListener !== "function" ||
            typeof candidate.removeEventListener !== "function") {
          throw new TypeError("abort must be a function, AbortController, or AbortSignal");
        }
        signal = candidate;
      }
      let interval = 0;
      let times = 1;
      if (stage.repeat !== undefined) {
        const repeat = stage.repeat;
        if (!repeat || typeof repeat !== "object" ||
            (repeat.ms !== undefined && repeat.s !== undefined)) {
          throw new TypeError("repeat must use either ms or s");
        }
        interval = repeat.ms !== undefined ? repeat.ms : (repeat.s !== undefined ? repeat.s * 1000 : 0);
        if (!Number.isFinite(interval) || interval < 0) throw new RangeError("Invalid repeat interval");
        times = repeat.times === undefined
          ? (repeat.ms !== undefined || repeat.s !== undefined ? Infinity : 1)
          : repeat.times;
        if (repeat.times !== undefined && (!Number.isSafeInteger(times) || times < 1)) {
          throw new RangeError("repeat.times must be a positive integer");
        }
      }
      if (stage.maxFPS !== undefined && (!Number.isFinite(stage.maxFPS) || stage.maxFPS <= 0)) {
        throw new RangeError("maxFPS must be positive");
      }
      return { read: stage.read, update: stage.update, abort, signal,
        interval, times, maxFPS: stage.maxFPS };
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
    const result = new Promise((res, rej) => { resolve = res; reject = rej; });
    const owner = { group, configs, index: 0, count: 0, lastStart: null,
      timer: null, active: true, resolve, reject, abortSignals: [],
      abortHandler: null };
    group.sequence = owner;
    owner.abortHandler = () => finishSequence(owner, "aborted");
    try {
      for (const config of configs) {
        if (config.signal && !owner.abortSignals.includes(config.signal)) {
          config.signal.addEventListener("abort", owner.abortHandler);
          owner.abortSignals.push(config.signal);
        }
      }
      if (owner.abortSignals.some(signal => signal.aborted)) {
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
    const minimumStart = config.maxFPS === undefined || !previousStart || previousStart.owner === owner
      ? 0 : previousStart.time + 1000 / config.maxFPS;
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
    const read = config.read
      ? queueTask("read", () => {
          if (checkAbort(owner, config)) return;
          return config.read();
        }, undefined, owner.group.id, owner)
      : Promise.resolve(undefined);
    read.then(value => {
      if (!owner.active) return;
      try {
        if (checkAbort(owner, config)) return;
      } catch (error) {
        finishSequence(owner, null, error);
        return;
      }
      return config.update
        ? queueTask("update", input => {
            if (checkAbort(owner, config)) return;
            return config.update(input);
          }, [value], owner.group.id, owner)
        : undefined;
    }).then(() => {
      if (owner.active) completeIteration(owner, config);
    }, error => finishSequence(owner, null, error));
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
    const fpsDue = config.maxFPS === undefined
      ? completed
      : owner.lastStart + 1000 / config.maxFPS;
    const due = Math.max(completed + config.interval, fpsDue);
    // Wake just before the deadline so the next rAF can carry the cycle.
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
