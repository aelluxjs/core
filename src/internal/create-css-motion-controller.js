/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// CSS remains the motion definition. This service only owns time progression
// when the browser exposes enough of Web Animations to do that safely.
export function createCssMotionController(root, getAelluxJs) {
  const operations = new Map();
  let nextId = 4000000;

  function id() {
    return nextId++;
  }

  function supported(element) {
    if (getAelluxJs().options.cssMotionController === false) return false;
    const Animation = root.Animation;
    return !!(element && typeof element.getAnimations === "function" &&
      Animation && Animation.prototype &&
      typeof Animation.prototype.pause === "function" &&
      "currentTime" in Animation.prototype);
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
    const AelluxJs = getAelluxJs();
    const operationId = options.id;
    if (!Number.isSafeInteger(operationId))
      return Promise.reject(new TypeError("motion.run() requires a safe integer ID"));
    if (!element || element.nodeType !== 1 || typeof options.apply !== "function")
      return Promise.reject(new TypeError("motion.run() requires an Element and apply callback"));

    cancel(operationId);
    const operation = {
      id: operationId, element, options, animations: [], before: new Set(),
      start: 0, endTime: 0, done: false, cancelled: false, controlled: false,
      captureFailed: false, conservative: false, nativeTimer: null, nativeResolve: null
    };
    operations.set(operationId, operation);

    if (AelluxJs.currentPreference("reduced-motion") === "reduced") {
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

    const requestedMaxFPS = options.maxFPS === undefined
      ? AelluxJs.layoutMaxFPS(element) : options.maxFPS;
    const externalAbort = typeof options.abort === "function" ? options.abort : null;
    const shouldAbort = () => operation.cancelled || !element.isConnected ||
      (externalAbort ? externalAbort() : false);

    const captureResult = AelluxJs.waitLayout.sequence(operationId, {
      read: () => capture(operation),
      update: animations => prepare(operation, animations),
      abort: shouldAbort
    });

    return captureResult.then(sequenceResult => {
      // A completed capture can still have its continuation queued when the
      // same ID is replaced. It must not schedule over the new operation.
      if (operation.cancelled || operations.get(operationId) !== operation) {
        release(operation, false);
        return { id: operationId, status: "aborted", mode: "native" };
      }
      if (sequenceResult.status !== "completed") {
        release(operation, false);
        return { id: operationId, status: sequenceResult.status, mode: "native" };
      }
      if (operation.captureFailed && !operation.cancelled) {
        release(operation, false);
        operations.set(operationId, operation);
        return nativeWait(operation);
      }
      const policyFPS = operation.conservative
        ? propertyPolicyFPS(AelluxJs.options.cssMotionPropertyMaxFPS, AelluxJs) : undefined;
      const maxFPS = minimumFPS(requestedMaxFPS, policyFPS);
      operation.visualFPS = maxFPS;
      AelluxJs.waitLayout.setVisualFPSLimit(operation.id, maxFPS);
      return AelluxJs.waitLayout.sequence(operationId, {
        update: () => advance(operation),
        repeat: { ms: 0 },
        maxFPS,
        abort: () => operation.done || shouldAbort()
      }).then(progressResult => {
        const completed = operation.done && !operation.cancelled;
        release(operation, completed);
        return {
          id: operationId,
          status: completed ? "completed" : progressResult.status,
          mode: "controlled"
        };
      });
    }, error => {
      // If capture/control fails after CSS state was applied, resume anything
      // paused and let CSS complete rather than leaving the visual state stuck.
      release(operation, false, true);
      throw error;
    });
  }

  function capture(operation) {
    // The read occurs after the state-changing update, allowing transitions to
    // be materialized by style calculation without a per-frame layout read.
    operation.element.getBoundingClientRect();
    return operation.element.getAnimations().filter(animation =>
      !operation.before.has(animation) && controllable(animation));
  }

  function controllable(animation) {
    try {
      const effect = animation && animation.effect;
      return !!(effect && typeof effect.getComputedTiming === "function" &&
        typeof animation.pause === "function");
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
    // Retain ownership before pausing: a later effect can reject control.
    operation.animations = animations;
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = 0;
      const timing = animation.effect.getComputedTiming();
      const end = Number(timing.endTime);
      if (Number.isFinite(end)) endTime = Math.max(endTime, end);
      applyAelluxEasing(operation, animation);
      if (!onlyTransformAndOpacity(animation)) operation.conservative = true;
    }
    operation.endTime = endTime;
    operation.start = now();
    operation.controlled = true;
    if (!(endTime > 0)) operation.done = true;
  }

  function onlyTransformAndOpacity(animation) {
    try {
      if (typeof root.CSSTransition === "function" && animation instanceof root.CSSTransition) {
        return animation.transitionProperty === "transform" ||
          animation.transitionProperty === "opacity";
      }
      const frames = animation.effect.getKeyframes();
      if (!frames.length) return false;
      const metadata = new Set(["offset", "computedOffset", "easing", "composite"]);
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

  function propertyPolicyFPS(value, AelluxJs) {
    // null and zero intentionally mean no *special* property policy. The
    // element maxFPS and adaptive scheduler remain in effect.
    if (value === null || value === 0) return undefined;
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
    if (value !== undefined) {
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CSS_MOTION_PROPERTY_MAX_FPS_INVALID,
        { option: "cssMotionPropertyMaxFPS", value, fallback: 40 });
    }
    return 40;
  }

  function minimumFPS(first, second) {
    const values = [first, second].filter(value =>
      Number.isFinite(value) && value > 0);
    return values.length ? Math.min(...values) : undefined;
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
    if (!name || !root.CSS || typeof root.CSS.supports !== "function" ||
      !animation.effect || typeof animation.effect.updateTiming !== "function") return;
    const easing = sampledLinear(name);
    if (!easing || !root.CSS.supports("animation-timing-function", easing)) return;
    animation.effect.updateTiming({ easing });
  }

  function sampledLinear(name) {
    const AelluxJs = getAelluxJs();
    const points = [];
    try {
      // Explicit percentages preserve overshoot values from Back and Elastic.
      for (let index = 0; index <= 60; index++) {
        const progress = index / 60;
        const value = AelluxJs.ease(name, progress);
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
    const animations = typeof operation.element.getAnimations === "function"
      ? operation.element.getAnimations().filter(animation => !operation.before.has(animation)) : [];
    return new Promise(resolve => {
      operation.nativeResolve = resolve;
      const complete = () => {
        if (operations.get(operation.id) !== operation) return;
        operations.delete(operation.id);
        operation.nativeResolve = null;
        resolve({ id: operation.id, status: "completed", mode: "native" });
      };
      if (animations.length && animations.every(animation => animation.finished &&
        typeof animation.finished.then === "function")) {
        Promise.all(animations.map(animation => animation.finished.catch(() => undefined))).then(complete);
        return;
      }
      const explicit = Number(operation.options.nativeDuration);
      const duration = Number.isFinite(explicit) ? explicit : cssMotionTime(operation.element);
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
      maximum = Math.max(maximum, Math.max(0, delay) + duration *
        (Number.isFinite(iterationCount) ? Math.max(0, iterationCount) : 1));
    }
    return maximum;
  }

  function cssTime(value) {
    const text = String(value || "0s").trim().toLowerCase();
    const number = parseFloat(text);
    if (!Number.isFinite(number)) return 0;
    return text.endsWith("ms") ? number : number * 1000;
  }

  function release(operation, finish, resume = false) {
    if (operations.get(operation.id) === operation)
      getAelluxJs().waitLayout.setVisualFPSLimit(operation.id, null);
    if (operation.nativeTimer !== null) root.clearTimeout(operation.nativeTimer);
    operation.nativeTimer = null;
    for (const animation of operation.animations) {
      try {
        if (finish) {
          animation.finish();
          // CSS transitions already have their final value in the stylesheet.
          // Release the finished effect too: Firefox can otherwise retain stale
          // registered-property values across hide/restart cycles. CSS keyframe
          // animations keep their fill behavior.
          if (typeof root.CSSTransition === "function" && animation instanceof root.CSSTransition)
            animation.cancel();
        }
        else if (resume) animation.play();
        else animation.cancel();
      } catch (_) { /* Animation may already have been replaced by CSS. */ }
    }
    operation.animations.length = 0;
    if (operations.get(operation.id) === operation) operations.delete(operation.id);
  }

  function now() {
    return root.performance && typeof root.performance.now === "function"
      ? root.performance.now() : Date.now();
  }

  function round(value) {
    return Math.round(value * 100000) / 100000;
  }

  return Object.freeze({ run, cancel, id, supported });
}
