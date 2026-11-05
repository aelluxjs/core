/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { sampleCssEasing } from "./sample-css-easing.js";

export const presentPlaybackProperties = [
  "opacity", "transform", "grid-template-rows", "grid-template-columns",
  "max-height", "max-width", "--ae-present-pop-phase"
];

const camel = name => name.startsWith("--") ? name : name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
const suffix = name => name.replace(/^--ae-present-/, "");
const seconds = value => (parseFloat(value) || 0) * (String(value).trim().endsWith("ms") ? 1 : 1000);
const list = value => value.split(/,(?![^()]*\))/).map(item => item.trim());
const animationProperties = ["name", "duration", "delay", "timing-function", "direction", "fill-mode", "iteration-count", "play-state"];
const transitionProperties = ["property", "duration", "delay", "timing-function"];

export function createPresentPlayback(root, api) {
  let interpolatedSizes = false;
  const now = () => root.performance.now();
  const animations = element => {
    try { return element.getAnimations(); } catch (_) { return null; }
  };
  const properties = (element, controller, progress) => {
    const tokens = (element.getAttribute(api.attr("present")) || "").split(/\s+/);
    return presentPlaybackProperties.filter(property => {
      if (property === "--ae-present-pop-phase") return progress;
      if (property === "transform") return tokens.includes(property) && !element.hasAttribute(api.attr("anchor"));
      if (property === "opacity") return tokens.includes(property);
      const dimension = /rows|height/.test(property) ? "height" : "width";
      return tokens.includes(dimension) && property.startsWith(controller.presentMotion ? "grid" : "max");
    });
  };

  function init() {
    interpolatedSizes = !!api.registerCssProperty(...["height", "width"].map(dimension => ({
      name: `--ae-present-reverse-max-${dimension}`, syntax: "<length>", initialValue: "0px"
    })));
  }

  function capture(element, controller, apply, size, progress, direction = "pop") {
    const computed = root.getComputedStyle(element);
    const tracks = properties(element, controller, progress).map(property => {
      const dimension = /rows|height/.test(property) ? "height" : "width";
      const to = property === "--ae-present-pop-phase" ? "1" : property.startsWith("max-")
        ? `${direction === "pop" ? size[dimension] : 0}px` : computed.getPropertyValue(`--ae-${direction}-${property.startsWith("grid") ? dimension : property}`).trim();
      const from = property.startsWith("grid")
        ? computed.getPropertyValue(`--ae-${direction === "pop" ? "from" : "pop"}-${dimension}`).trim() : computed.getPropertyValue(property).trim();
      return { property, from, to };
    });
    const before = animations(element);
    apply();
    const style = root.getComputedStyle(element);
    const names = list(style.transitionProperty), durations = list(style.transitionDuration),
      delays = list(style.transitionDelay), easings = list(style.transitionTimingFunction);
    for (const track of tracks) {
      let index = names.lastIndexOf(track.property);
      if (index < 0) index = names.lastIndexOf("all");
      track.duration = index < 0 ? 0 : seconds(durations[index % durations.length]);
      track.delay = index < 0 ? 0 : seconds(delays[index % delays.length]);
      track.easing = index < 0 ? "linear" : easings[index % easings.length];
    }
    const after = animations(element);
    const advanced = style.getPropertyValue(`--ae-${direction}-aellux-ease`).trim();
    const curve = advanced && api.motion?.supported(element) ? sampleCssEasing(api, advanced) : null;
    return { tracks, effects: after?.filter(effect => !before?.includes(effect) &&
      tracks.some(track => track.property === effect.transitionProperty)),
      advancedEasing: curve && root.CSS?.supports("animation-timing-function", curve) ? curve : null,
      nativeEasing: style.getPropertyValue(`--ae-${direction}-ease`).trim(),
      start: now(), completed: false };
  }

  function snapshot(element, controller, progress) {
    let record = controller.opening;
    if (!record) {
      // A region mounted visible has an implied, fully travelled opening.
      // Measure both states synchronously; no intermediate state is painted.
      if (controller.transition) return [];
      const owned = properties(element, controller, progress);
      const memory = api.persist.element.save(element, [], owned);
      const transition = api.persist.element.save(element, [], ["transition-property"]);
      const classes = ["pop", "popping"].map(name => api.className(name)).filter(name => element.classList.contains(name));
      const to = owned.map(property => {
        const style = root.getComputedStyle(element);
        if (property === "transform" || property.startsWith("grid")) {
          const name = property === "transform" ? property : property.endsWith("rows") ? "height" : "width";
          return style.getPropertyValue(`--ae-pop-${name}`).trim() || style.getPropertyValue(property).trim();
        }
        return property.startsWith("max-") ? style.getPropertyValue(property.slice(4)).trim() : style.getPropertyValue(property).trim();
      });
      const style = root.getComputedStyle(element);
      const duration = seconds(style.getPropertyValue("--ae-pop-duration"));
      const easing = style.getPropertyValue("--ae-pop-ease").trim() || "ease-out";
      try {
        element.style.setProperty("transition-property", "none", "important");
        element.classList.remove(...classes);
        if (controller.measuredHeight) element.style.setProperty("max-height", "0px", "important");
        if (controller.measuredWidth) element.style.setProperty("max-width", "0px", "important");
        if (progress) element.style.setProperty("--ae-present-pop-phase", "0");
        const from = root.getComputedStyle(element);
        record = { completed: true, start: now(), tracks: owned.map((property, index) => {
          const name = property === "transform" ? property : property.endsWith("rows") ? "height" : "width";
          const start = property === "transform" || property.startsWith("grid")
            ? from.getPropertyValue(`--ae-from-${name}`).trim() : from.getPropertyValue(property).trim();
          return { property, from: start, to: to[index], duration, delay: 0, easing };
        }) };
      } finally {
        element.classList.add(...classes);
        memory.restore();
        element.getBoundingClientRect();
        transition.restore();
      }
    }
    if (record.effects) {
      return record.effects.map(animation => {
        const timing = animation.effect.getTiming();
        if (record.advancedEasing) timing.easing = record.advancedEasing;
        else if (/^linear\(/i.test(record.nativeEasing || "") && timing.easing.startsWith("linear(")) timing.easing = record.nativeEasing;
        const duration = Number(timing.duration);
        const time = record.completed ? duration : Math.max(0, Math.min(duration, Number(animation.currentTime) - timing.delay));
        const source = record.tracks.find(track => track.property === animation.transitionProperty);
        // Grid getKeyframes() can expose two identical current pixel tracks.
        // Preserve the actual authored opening tracks (including fr units).
        const frames = source.property.startsWith("grid")
          ? [{ [camel(source.property)]: source.from }, { [camel(source.property)]: source.to }]
          : animation.effect.getKeyframes().map(({ computedOffset, ...frame }) => frame);
        return { property: animation.transitionProperty, frames,
          timing, time, duration };
      }).filter(track => Number.isFinite(track.duration) && track.duration > 0 && track.time > 0);
    }
    return record.tracks.map(track => ({ ...track,
      frames: [{ [camel(track.property)]: track.from }, { [camel(track.property)]: track.to }],
      timing: { easing: /^linear\(/i.test(record.nativeEasing || "") ? record.nativeEasing : track.easing },
      time: record.completed ? track.duration : Math.max(0, Math.min(track.duration, now() - record.start - track.delay))
    })).filter(track => track.duration > 0 && track.time > 0 && track.from !== track.to);
  }

  function complete(element, controller, progress) {
    if (!controller.opening) return;
    controller.opening.completed = true;
    // Keep only serializable trajectory data after completion, never effects.
    const tracks = snapshot(element, controller, progress);
    controller.opening = { completed: true, start: now(), tracks: [], effects: null, saved: tracks };
  }

  function reverse(element, tracks, progress, interactive = false) {
    const duration = Math.max(0, ...tracks.map(track => track.time));
    const owned = [...new Set(tracks.map(track => track.property))];
    const privateProperties = owned.flatMap(property => ["from", "to"].map(phase => `--ae-present-reverse-${phase}-${suffix(property)}`));
    privateProperties.push(...owned.filter(property => property.startsWith("max-")).map(property => `--ae-present-reverse-${property}`));
    let memory = null, effects = [];
    const inspectable = typeof element.getAnimations === "function" && root.KeyframeEffect &&
      typeof root.KeyframeEffect.prototype.setKeyframes === "function";
    function apply() {
      memory = api.persist.element.save(element, [], [...owned, ...privateProperties,
        ...transitionProperties.map(name => `transition-${name}`), ...animationProperties.map(name => `animation-${name}`)]);
      const style = element.style;
      if (!duration) return;
      if (inspectable) {
        // Real CSS transitions retain their priority over author !important
        // dimensions. Recreate the original endpoints, then reverse their
        // original frames/timing before the browser can paint a reset.
        style.setProperty("transition-property", "none", "important");
        for (const track of tracks) style.setProperty(track.property, track.frames[0][camel(track.property)], track.property.startsWith("--") ? "" : "important");
        element.getBoundingClientRect();
        style.setProperty("transition-property", owned.join(","), "important");
        style.setProperty("transition-duration", tracks.map(track => `${track.duration}ms`).join(","), "important");
        style.setProperty("transition-delay", "0ms", "important");
        style.setProperty("transition-timing-function", "linear", "important");
        for (const track of tracks) style.setProperty(track.property, track.frames[track.frames.length - 1][camel(track.property)], track.property.startsWith("--") ? "" : "important");
        effects = animations(element)?.filter(animation => owned.includes(animation.transitionProperty)) || [];
        for (const animation of effects) {
          const track = tracks.find(track => track.property === animation.transitionProperty);
          animation.effect.setKeyframes(track.frames);
          animation.effect.updateTiming({ duration: track.duration, easing: interactive ? "linear" : track.timing.easing || "linear",
            delay: interactive ? 0 : track.time - track.duration, direction: interactive ? "normal" : "reverse", fill: "both", iterations: 1, iterationStart: 0, endDelay: 0 });
          if (interactive) animation.pause();
          animation.currentTime = 0;
        }
      } else {
        // CSS-only replay uses the same endpoints and easing, with a negative
        // delay to omit the untravelled end of the opening trajectory.
        const computed = root.getComputedStyle(element);
        const previous = animationProperties.map(name => computed.getPropertyValue(`animation-${name}`));
        const additions = [[], [], [], [], [], [], [], []];
        for (const track of tracks) {
          const name = suffix(track.property);
          style.setProperty(`--ae-present-reverse-from-${name}`, track.frames[0][camel(track.property)]);
          style.setProperty(`--ae-present-reverse-to-${name}`, track.frames[track.frames.length - 1][camel(track.property)]);
          // The animation owns these values temporarily; restore their author
          // value and priority during every completion/interruption path.
          if (track.property.startsWith("max-") && interpolatedSizes)
            style.setProperty(track.property, `var(--ae-present-reverse-${track.property})`, "important");
          else style.setProperty(track.property, track.frames[0][camel(track.property)]);
          const nativeName = track.property.startsWith("max-") && !interpolatedSizes ? `${name}-plain` : name;
          const values = [api.className(`present-reverse-${nativeName}`), `${track.duration}ms`, `${track.time - track.duration}ms`,
            track.timing.easing || "linear", "reverse", "both", "1", "running"];
          values.forEach((value, index) => additions[index].push(value));
        }
        animationProperties.forEach((name, index) => style.setProperty(`animation-${name}`, [previous[index], ...additions[index]].join(","), "important"));
      }
      if (progress && !interactive) {
        // Independent normalized reverse-operation progress; pop progress is
        // replayed on the actual opening trajectory above.
        style.setProperty("--ae-unpop-progress", "0");
        element.getBoundingClientRect();
        const computed = root.getComputedStyle(element);
        const previous = list(computed.transitionProperty);
        const durations = list(computed.transitionDuration), delays = list(computed.transitionDelay), easings = list(computed.transitionTimingFunction);
        style.setProperty("transition-property", [...previous, "--ae-unpop-progress"].join(","), "important");
        for (const [name, values, extra] of [["duration", durations, `${duration}ms`], ["delay", delays, "0ms"], ["timing-function", easings, "linear"]])
          style.setProperty(`transition-${name}`, [...previous.map((_, index) => values[index % values.length]), extra].join(","), "important");
        style.setProperty("--ae-unpop-progress", "1");
      }
    }
    return { duration, apply,
      seek(value) {
        for (const effect of effects) effect.currentTime = value * Number(effect.effect.getTiming().duration);
      },
      playTo(target) {
        for (const animation of effects) {
          const track = tracks.find(track => track.property === animation.transitionProperty);
          const timing = animation.effect.getTiming();
          const value = Number(animation.currentTime) / Number(timing.duration);
          // Restore the authored curve at the same rendered position. Searching
          // timing progress needs no layout and keeps the original keyframes.
          animation.effect.updateTiming({ easing: track.timing.easing || "linear" });
          let best = value, error = Infinity;
          const evaluate = fraction => {
            animation.currentTime = fraction * track.duration;
            return animation.effect.getComputedTiming().progress;
          };
          let previous = evaluate(0), previousTime = 0;
          for (let index = 1; index <= 120; index++) {
            const time = index / 120, next = evaluate(time);
            if ((previous - value) * (next - value) <= 0) {
              let low = previousTime, high = time, lowValue = previous;
              for (let step = 0; step < 20; step++) {
                const middle = (low + high) / 2, result = evaluate(middle);
                if ((lowValue - value) * (result - value) <= 0) high = middle;
                else { low = middle; lowValue = result; }
              }
              const candidate = (low + high) / 2;
              if (Math.abs(candidate - value) < error) { best = candidate; error = Math.abs(candidate - value); }
            }
            previous = next; previousTime = time;
          }
          if (value !== 0 && value !== 1 && Math.abs(evaluate(best) - value) > .0001) {
            // Discontinuous easing (for example steps()) cannot represent every
            // scrubbed position. Keep linear timing instead of introducing a jump.
            animation.effect.updateTiming({ easing: "linear" }); best = value;
          }
          animation.currentTime = (value === 0 || value === 1 ? value : best) * track.duration;
          animation.playbackRate = target ? 1 : -1;
          animation.play();
          if (value === target) animation.finish();
        }
        return Promise.all(effects.map(effect => effect.finished));
      }, cleanup() {
      for (const animation of effects) animation.cancel();
      effects = [];
      memory?.restore();
      memory = null;
    } };
  }

  function full(element, controller, progress) {
    if (controller.opening?.saved) return controller.opening.saved;
    const record = controller.opening;
    if (record) {
      const completed = record.completed;
      record.completed = true;
      try { return snapshot(element, controller, progress); }
      finally { record.completed = completed; }
    }
    return snapshot(element, controller, progress);
  }

  function control(element, source, dismiss, progress, unpop) {
    const tracks = source.filter(track => !track.property.startsWith("--ae-"));
    const duration = Math.max(0, ...tracks.map(track => track.duration));
    const easing = tracks[0]?.timing.easing || "linear";
    const channels = progress ? ["--ae-present-pop-phase", "--ae-present-dismiss-phase", "--ae-pop-progress", "--ae-dismiss-progress"] : [];
    if (unpop) channels.push("--ae-unpop-progress");
    for (const property of channels) {
      const forward = property.includes("dismiss") ? dismiss : property.includes("unpop") ? dismiss : !dismiss;
      tracks.push({ property, duration, time: duration, timing: { easing },
        frames: [{ [property]: forward ? "0" : "1" }, { [property]: forward ? "1" : "0" }] });
    }
    return reverse(element, tracks, false, true);
  }

  return { init, capture, full, control, snapshot: (element, controller, progress) => controller.opening?.saved || snapshot(element, controller, progress), complete, reverse };
}
