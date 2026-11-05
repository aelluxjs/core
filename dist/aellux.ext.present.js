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
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };

  // src/internal/sample-css-easing.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  function sampleCssEasing(api, name) {
    const points = [];
    const round = (value) => Math.round(value * 1e5) / 1e5;
    try {
      for (let index = 0; index <= 60; index++) {
        const progress = index / 60;
        const value = api.ease(name, progress);
        if (!Number.isFinite(value)) return null;
        points.push(`${round(value)} ${round(progress * 100)}%`);
      }
    } catch (_) {
      return null;
    }
    return `linear(${points.join(", ")})`;
  }

  // src/internal/create-present-playback.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var presentPlaybackProperties = [
    "opacity",
    "transform",
    "grid-template-rows",
    "grid-template-columns",
    "max-height",
    "max-width",
    "--ae-present-pop-phase"
  ];
  var camel = (name) => name.startsWith("--") ? name : name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  var suffix = (name) => name.replace(/^--ae-present-/, "");
  var seconds = (value) => (parseFloat(value) || 0) * (String(value).trim().endsWith("ms") ? 1 : 1e3);
  var list = (value) => value.split(/,(?![^()]*\))/).map((item) => item.trim());
  var animationProperties = ["name", "duration", "delay", "timing-function", "direction", "fill-mode", "iteration-count", "play-state"];
  var transitionProperties = ["property", "duration", "delay", "timing-function"];
  function createPresentPlayback(root, api) {
    let interpolatedSizes = false;
    const now = () => root.performance.now();
    const animations = (element) => {
      try {
        return element.getAnimations();
      } catch (_) {
        return null;
      }
    };
    const properties = (element, controller, progress) => {
      const tokens = (element.getAttribute(api.attr("present")) || "").split(/\s+/);
      return presentPlaybackProperties.filter((property) => {
        if (property === "--ae-present-pop-phase") return progress;
        if (property === "transform") return tokens.includes(property) && !element.hasAttribute(api.attr("anchor"));
        if (property === "opacity") return tokens.includes(property);
        const dimension = /rows|height/.test(property) ? "height" : "width";
        return tokens.includes(dimension) && property.startsWith(controller.presentMotion ? "grid" : "max");
      });
    };
    function init() {
      interpolatedSizes = !!api.registerCssProperty(...["height", "width"].map((dimension) => ({
        name: `--ae-present-reverse-max-${dimension}`,
        syntax: "<length>",
        initialValue: "0px"
      })));
    }
    function capture(element, controller, apply, size, progress, direction = "pop") {
      var _a, _b;
      const computed = root.getComputedStyle(element);
      const tracks = properties(element, controller, progress).map((property) => {
        const dimension = /rows|height/.test(property) ? "height" : "width";
        const to = property === "--ae-present-pop-phase" ? "1" : property.startsWith("max-") ? `${direction === "pop" ? size[dimension] : 0}px` : computed.getPropertyValue(`--ae-${direction}-${property.startsWith("grid") ? dimension : property}`).trim();
        const from = property.startsWith("grid") ? computed.getPropertyValue(`--ae-${direction === "pop" ? "from" : "pop"}-${dimension}`).trim() : computed.getPropertyValue(property).trim();
        return { property, from, to };
      });
      const before = animations(element);
      apply();
      const style = root.getComputedStyle(element);
      const names = list(style.transitionProperty), durations = list(style.transitionDuration), delays = list(style.transitionDelay), easings = list(style.transitionTimingFunction);
      for (const track of tracks) {
        let index = names.lastIndexOf(track.property);
        if (index < 0) index = names.lastIndexOf("all");
        track.duration = index < 0 ? 0 : seconds(durations[index % durations.length]);
        track.delay = index < 0 ? 0 : seconds(delays[index % delays.length]);
        track.easing = index < 0 ? "linear" : easings[index % easings.length];
      }
      const after = animations(element);
      const advanced = style.getPropertyValue(`--ae-${direction}-aellux-ease`).trim();
      const curve = advanced && ((_a = api.motion) == null ? void 0 : _a.supported(element)) ? sampleCssEasing(api, advanced) : null;
      return {
        tracks,
        effects: after == null ? void 0 : after.filter((effect) => !(before == null ? void 0 : before.includes(effect)) && tracks.some((track) => track.property === effect.transitionProperty)),
        advancedEasing: curve && ((_b = root.CSS) == null ? void 0 : _b.supports("animation-timing-function", curve)) ? curve : null,
        nativeEasing: style.getPropertyValue(`--ae-${direction}-ease`).trim(),
        start: now(),
        completed: false
      };
    }
    function snapshot(element, controller, progress) {
      let record = controller.opening;
      if (!record) {
        if (controller.transition) return [];
        const owned = properties(element, controller, progress);
        const memory = api.persist.element.save(element, [], owned);
        const transition = api.persist.element.save(element, [], ["transition-property"]);
        const classes = ["pop", "popping"].map((name) => api.className(name)).filter((name) => element.classList.contains(name));
        const to = owned.map((property) => {
          const style2 = root.getComputedStyle(element);
          if (property === "transform" || property.startsWith("grid")) {
            const name = property === "transform" ? property : property.endsWith("rows") ? "height" : "width";
            return style2.getPropertyValue(`--ae-pop-${name}`).trim() || style2.getPropertyValue(property).trim();
          }
          return property.startsWith("max-") ? style2.getPropertyValue(property.slice(4)).trim() : style2.getPropertyValue(property).trim();
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
            const start = property === "transform" || property.startsWith("grid") ? from.getPropertyValue(`--ae-from-${name}`).trim() : from.getPropertyValue(property).trim();
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
        return record.effects.map((animation) => {
          const timing = animation.effect.getTiming();
          if (record.advancedEasing) timing.easing = record.advancedEasing;
          else if (/^linear\(/i.test(record.nativeEasing || "") && timing.easing.startsWith("linear(")) timing.easing = record.nativeEasing;
          const duration = Number(timing.duration);
          const time = record.completed ? duration : Math.max(0, Math.min(duration, Number(animation.currentTime) - timing.delay));
          const source = record.tracks.find((track) => track.property === animation.transitionProperty);
          const frames = source.property.startsWith("grid") ? [{ [camel(source.property)]: source.from }, { [camel(source.property)]: source.to }] : animation.effect.getKeyframes().map((_a) => {
            var _b = _a, { computedOffset } = _b, frame = __objRest(_b, ["computedOffset"]);
            return frame;
          });
          return {
            property: animation.transitionProperty,
            frames,
            timing,
            time,
            duration
          };
        }).filter((track) => Number.isFinite(track.duration) && track.duration > 0 && track.time > 0);
      }
      return record.tracks.map((track) => __spreadProps(__spreadValues({}, track), {
        frames: [{ [camel(track.property)]: track.from }, { [camel(track.property)]: track.to }],
        timing: { easing: /^linear\(/i.test(record.nativeEasing || "") ? record.nativeEasing : track.easing },
        time: record.completed ? track.duration : Math.max(0, Math.min(track.duration, now() - record.start - track.delay))
      })).filter((track) => track.duration > 0 && track.time > 0 && track.from !== track.to);
    }
    function complete(element, controller, progress) {
      if (!controller.opening) return;
      controller.opening.completed = true;
      const tracks = snapshot(element, controller, progress);
      controller.opening = { completed: true, start: now(), tracks: [], effects: null, saved: tracks };
    }
    function reverse(element, tracks, progress, interactive = false) {
      const duration = Math.max(0, ...tracks.map((track) => track.time));
      const owned = [...new Set(tracks.map((track) => track.property))];
      const privateProperties = owned.flatMap((property) => ["from", "to"].map((phase) => `--ae-present-reverse-${phase}-${suffix(property)}`));
      privateProperties.push(...owned.filter((property) => property.startsWith("max-")).map((property) => `--ae-present-reverse-${property}`));
      let memory = null, effects = [];
      const inspectable = typeof element.getAnimations === "function" && root.KeyframeEffect && typeof root.KeyframeEffect.prototype.setKeyframes === "function";
      function apply() {
        var _a;
        memory = api.persist.element.save(element, [], [
          ...owned,
          ...privateProperties,
          ...transitionProperties.map((name) => `transition-${name}`),
          ...animationProperties.map((name) => `animation-${name}`)
        ]);
        const style = element.style;
        if (!duration) return;
        if (inspectable) {
          style.setProperty("transition-property", "none", "important");
          for (const track of tracks) style.setProperty(track.property, track.frames[0][camel(track.property)], track.property.startsWith("--") ? "" : "important");
          element.getBoundingClientRect();
          style.setProperty("transition-property", owned.join(","), "important");
          style.setProperty("transition-duration", tracks.map((track) => `${track.duration}ms`).join(","), "important");
          style.setProperty("transition-delay", "0ms", "important");
          style.setProperty("transition-timing-function", "linear", "important");
          for (const track of tracks) style.setProperty(track.property, track.frames[track.frames.length - 1][camel(track.property)], track.property.startsWith("--") ? "" : "important");
          effects = ((_a = animations(element)) == null ? void 0 : _a.filter((animation) => owned.includes(animation.transitionProperty))) || [];
          for (const animation of effects) {
            const track = tracks.find((track2) => track2.property === animation.transitionProperty);
            animation.effect.setKeyframes(track.frames);
            animation.effect.updateTiming({
              duration: track.duration,
              easing: interactive ? "linear" : track.timing.easing || "linear",
              delay: interactive ? 0 : track.time - track.duration,
              direction: interactive ? "normal" : "reverse",
              fill: "both",
              iterations: 1,
              iterationStart: 0,
              endDelay: 0
            });
            if (interactive) animation.pause();
            animation.currentTime = 0;
          }
        } else {
          const computed = root.getComputedStyle(element);
          const previous = animationProperties.map((name) => computed.getPropertyValue(`animation-${name}`));
          const additions = [[], [], [], [], [], [], [], []];
          for (const track of tracks) {
            const name = suffix(track.property);
            style.setProperty(`--ae-present-reverse-from-${name}`, track.frames[0][camel(track.property)]);
            style.setProperty(`--ae-present-reverse-to-${name}`, track.frames[track.frames.length - 1][camel(track.property)]);
            if (track.property.startsWith("max-") && interpolatedSizes)
              style.setProperty(track.property, `var(--ae-present-reverse-${track.property})`, "important");
            else style.setProperty(track.property, track.frames[0][camel(track.property)]);
            const nativeName = track.property.startsWith("max-") && !interpolatedSizes ? `${name}-plain` : name;
            const values = [
              api.className(`present-reverse-${nativeName}`),
              `${track.duration}ms`,
              `${track.time - track.duration}ms`,
              track.timing.easing || "linear",
              "reverse",
              "both",
              "1",
              "running"
            ];
            values.forEach((value, index) => additions[index].push(value));
          }
          animationProperties.forEach((name, index) => style.setProperty(`animation-${name}`, [previous[index], ...additions[index]].join(","), "important"));
        }
        if (progress && !interactive) {
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
      return {
        duration,
        apply,
        seek(value) {
          for (const effect of effects) effect.currentTime = value * Number(effect.effect.getTiming().duration);
        },
        playTo(target) {
          for (const animation of effects) {
            const track = tracks.find((track2) => track2.property === animation.transitionProperty);
            const timing = animation.effect.getTiming();
            const value = Number(animation.currentTime) / Number(timing.duration);
            animation.effect.updateTiming({ easing: track.timing.easing || "linear" });
            let best = value, error = Infinity;
            const evaluate = (fraction) => {
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
                  else {
                    low = middle;
                    lowValue = result;
                  }
                }
                const candidate = (low + high) / 2;
                if (Math.abs(candidate - value) < error) {
                  best = candidate;
                  error = Math.abs(candidate - value);
                }
              }
              previous = next;
              previousTime = time;
            }
            if (value !== 0 && value !== 1 && Math.abs(evaluate(best) - value) > 1e-4) {
              animation.effect.updateTiming({ easing: "linear" });
              best = value;
            }
            animation.currentTime = (value === 0 || value === 1 ? value : best) * track.duration;
            animation.playbackRate = target ? 1 : -1;
            animation.play();
            if (value === target) animation.finish();
          }
          return Promise.all(effects.map((effect) => effect.finished));
        },
        cleanup() {
          for (const animation of effects) animation.cancel();
          effects = [];
          memory == null ? void 0 : memory.restore();
          memory = null;
        }
      };
    }
    function full(element, controller, progress) {
      var _a;
      if ((_a = controller.opening) == null ? void 0 : _a.saved) return controller.opening.saved;
      const record = controller.opening;
      if (record) {
        const completed = record.completed;
        record.completed = true;
        try {
          return snapshot(element, controller, progress);
        } finally {
          record.completed = completed;
        }
      }
      return snapshot(element, controller, progress);
    }
    function control(element, source, dismiss, progress, unpop) {
      var _a;
      const tracks = source.filter((track) => !track.property.startsWith("--ae-"));
      const duration = Math.max(0, ...tracks.map((track) => track.duration));
      const easing = ((_a = tracks[0]) == null ? void 0 : _a.timing.easing) || "linear";
      const channels = progress ? ["--ae-present-pop-phase", "--ae-present-dismiss-phase", "--ae-pop-progress", "--ae-dismiss-progress"] : [];
      if (unpop) channels.push("--ae-unpop-progress");
      for (const property of channels) {
        const forward = property.includes("dismiss") ? dismiss : property.includes("unpop") ? dismiss : !dismiss;
        tracks.push({
          property,
          duration,
          time: duration,
          timing: { easing },
          frames: [{ [property]: forward ? "0" : "1" }, { [property]: forward ? "1" : "0" }]
        });
      }
      return reverse(element, tracks, false, true);
    }
    return { init, capture, full, control, snapshot: (element, controller, progress) => {
      var _a;
      return ((_a = controller.opening) == null ? void 0 : _a.saved) || snapshot(element, controller, progress);
    }, complete, reverse };
  }

  // src/internal/create-present-gestures.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  var directions = { up: ["y", -1], down: ["y", 1], left: ["x", -1], right: ["x", 1] };
  var clamp = (value) => Math.max(0, Math.min(1, value));
  function createPresentGestures(root, api, services) {
    const entries = /* @__PURE__ */ new Map(), sources = /* @__PURE__ */ new Map();
    let interaction = null, suppressed = null, suppressTimer = null;
    const attribute = (name) => api.attr(`present-gesture${name ? `-${name}` : ""}`);
    const warn = (element, name, value, reason) => api.diagnostics.warn(
      api.diagnostics.WARN_CONFIGURATION_VALUE,
      { extension: "present", element, attribute: name, value, reason }
    );
    const state = (element) => services.state(element);
    function update(element) {
      var _a, _b;
      if (!element.hasAttribute(attribute(""))) {
        remove(element);
        return;
      }
      const signature = ["", "source", "unpop", "dismiss"].map((name) => element.getAttribute(attribute(name))).join("|");
      const direction = element.getAttribute(attribute(""));
      if (!directions[direction]) {
        remove(element);
        warn(element, attribute(""), direction, "Use up, down, left or right.");
        return;
      }
      const value = element.getAttribute(attribute("source"));
      const id = value == null ? void 0 : value.replace(/^#/, "");
      const source = value === "document" ? root.document : value ? !/[\s#]/.test(id) && root.document.getElementById(id) : element;
      if (((_a = entries.get(element)) == null ? void 0 : _a.signature) === signature && ((_b = entries.get(element)) == null ? void 0 : _b.source) === source) return;
      remove(element);
      if (!source) {
        api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_TARGET, {
          extension: "present",
          element,
          attribute: attribute("source"),
          value,
          reason: "Gesture source ID was not found."
        });
        return;
      }
      let dismiss = element.getAttribute(attribute("dismiss"));
      if (dismiss && (!directions[dismiss] || directions[dismiss][0] === directions[direction][0])) {
        warn(element, attribute("dismiss"), dismiss, "Dismiss must use a direction on the other axis.");
        dismiss = null;
      }
      const unpop = element.getAttribute(attribute("unpop"));
      if (unpop !== null && !["", "true", "false"].includes(unpop))
        warn(element, attribute("unpop"), unpop, "Use true or false; invalid values enable gesture Unpop.");
      const entry = { element, source, direction, dismiss, unpop: unpop !== "false", signature };
      entries.set(element, entry);
      for (const target of /* @__PURE__ */ new Set([source, element])) {
        if (!sources.has(target)) {
          sources.set(target, /* @__PURE__ */ new Set());
          target.addEventListener("pointerdown", down);
        }
        sources.get(target).add(entry);
      }
      inspect(element);
    }
    function inspect(element) {
      var _a;
      if (((_a = entries.get(element)) == null ? void 0 : _a.source) === element && root.getComputedStyle(element).display === "none")
        api.diagnostics.info(api.diagnostics.INFO_PRESENT_GESTURE_HIDDEN, { extension: "present", element });
    }
    function remove(element) {
      var _a;
      const entry = entries.get(element);
      if (!entry) return;
      if (((_a = interaction == null ? void 0 : interaction.owner) == null ? void 0 : _a.entry) === entry || (interaction == null ? void 0 : interaction.candidates.some((candidate) => candidate.entry === entry))) cancel();
      entries.delete(element);
      for (const target of /* @__PURE__ */ new Set([entry.source, element])) {
        const set = sources.get(target);
        set.delete(entry);
        if (!set.size) {
          target.removeEventListener("pointerdown", down);
          sources.delete(target);
        }
      }
    }
    function down(event) {
      if (interaction && interaction.id !== event.pointerId) {
        cancel();
        return;
      }
      if (event.button !== 0 || event.isPrimary === false || event.defaultPrevented) return;
      const target = event.target;
      if (!target.closest || target.closest("input,textarea,select,button,a,[contenteditable]:not([contenteditable=false]),[data-ae-scrollbox]")) return;
      if (!interaction) {
        interaction = { id: event.pointerId, x: event.clientX, y: event.clientY, candidates: [], owner: null, target };
        for (const name of ["pointermove", "pointerup", "pointercancel", "lostpointercapture"])
          root.document.addEventListener(name, move, { capture: true, passive: false });
      }
      for (const entry of sources.get(event.currentTarget) || []) {
        if (interaction.candidates.some((candidate) => candidate.entry === entry)) continue;
        const origin = state(entry.element);
        const onElement = entry.element.contains(target);
        const onSource = entry.source === root.document || entry.source.contains(target);
        if (services.busy(entry.element)) continue;
        if (origin === "Pop" ? onElement : onSource)
          interaction.candidates.push({ entry, origin });
      }
    }
    function parameters(element, axis) {
      const style = root.getComputedStyle(element);
      const thresholds = {};
      for (const name of ["pop", "unpop", "dismiss"]) {
        const property2 = `--ae-present-${name}-threshold`, raw2 = style.getPropertyValue(property2).trim();
        const value = raw2 === "" ? 0.5 : Number(raw2);
        thresholds[name] = Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.5;
        if (thresholds[name] !== value) warn(element, property2, raw2, "Use a number between 0 and 1; using 0.5.");
      }
      const property = "--ae-present-gesture-distance", raw = style.getPropertyValue(property).trim();
      let distance = 0;
      if (raw && raw !== "auto") {
        const probe = root.document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;padding:0;border:0;min-width:0;max-width:none;height:0;";
        probe.style.fontSize = style.fontSize;
        probe.style.width = raw;
        if (probe.style.width && !raw.includes("%")) {
          element.appendChild(probe);
          distance = parseFloat(root.getComputedStyle(probe).width);
          probe.remove();
        }
        if (!(distance > 0)) warn(element, property, raw, "Use a positive CSS length or auto; using auto.");
      }
      return __spreadProps(__spreadValues({}, thresholds), {
        distance: distance > 0 ? distance : 0,
        fallback: Math.max(1, axis === "x" ? element.offsetWidth : element.offsetHeight)
      });
    }
    function move(event) {
      var _a;
      const current = interaction;
      if (!current || current.id !== event.pointerId) return;
      if (event.type !== "pointermove") {
        release(event.type !== "pointerup");
        return;
      }
      const x = event.clientX - current.x, y = event.clientY - current.y;
      if (!current.owner) {
        if (Math.max(Math.abs(x), Math.abs(y)) < 8) return;
        const axis = Math.abs(x) > Math.abs(y) * 1.2 ? "x" : Math.abs(y) > Math.abs(x) * 1.2 ? "y" : null;
        if (!axis) return;
        const delta = axis === "x" ? x : y;
        const candidates = current.candidates.filter((candidate2) => {
          const { entry, origin } = candidate2;
          if (!entry.element.isConnected || state(entry.element) !== origin || services.busy(entry.element)) return false;
          const main = directions[entry.direction], dismiss = directions[entry.dismiss];
          candidate2.dismiss = origin === "Pop" && (dismiss == null ? void 0 : dismiss[0]) === axis && delta * dismiss[1] > 0;
          candidate2.sign = candidate2.dismiss ? dismiss[1] : main[1];
          return candidate2.dismiss || main[0] === axis && (origin === "Pop" ? entry.unpop && delta * main[1] < 0 : delta * main[1] > 0);
        });
        candidates.sort((a, b) => {
          const left = a.origin === "Pop" ? a.entry.element : a.entry.source;
          const right = b.origin === "Pop" ? b.entry.element : b.entry.source;
          if (left !== right) {
            if (left.contains(right)) return 1;
            if (right.contains(left)) return -1;
          }
          return services.order(b.entry.element) - services.order(a.entry.element);
        });
        const candidate = candidates[0];
        if (!candidate || nativeScroll(current.target, candidate.entry.element, axis, delta)) {
          clear();
          return;
        }
        if (!((_a = root.KeyframeEffect) == null ? void 0 : _a.prototype.setKeyframes) || !candidate.entry.element.getAnimations) {
          warn(candidate.entry.element, attribute(""), candidate.entry.direction, "Interactive Present requires inspectable Web Animations transitions.");
          clear();
          return;
        }
        const params = parameters(candidate.entry.element, axis);
        let resolve;
        const settled = new Promise((done) => {
          resolve = done;
        });
        const owner2 = current.owner = __spreadProps(__spreadValues({}, candidate), {
          params,
          axis,
          displacement: 0,
          progress: candidate.dismiss ? 0 : candidate.origin === "Pop" ? 1 : 0,
          handle: null,
          released: null,
          settled,
          attach(handle, autoDistance) {
            this.handle = handle;
            if (!params.distance) params.distance = autoDistance || Math.max(1, axis === "x" ? this.entry.element.offsetWidth : this.entry.element.offsetHeight);
            this.progress = clamp(this.start + this.displacement / params.distance);
            this.seek();
            if (this.released !== null) this.finish(this.released);
          },
          seek() {
            var _a2;
            (_a2 = this.handle) == null ? void 0 : _a2.seek(this.progress);
          },
          finish(cancelled) {
            this.released = cancelled;
            if (!this.handle) return;
            const target = cancelled ? this.dismiss ? 0 : this.origin === "Pop" ? 1 : 0 : this.dismiss ? +(this.progress >= params.dismiss) : this.origin === "Pop" ? +(this.progress > params.unpop) : +(this.progress >= params.pop);
            const destination = this.dismiss ? target ? "Dismiss" : this.origin : target ? "Pop" : this.origin === "Dismiss" ? "Dismiss" : "Unpop";
            this.handle.playTo(target).then(() => resolve(destination), () => resolve(null));
          },
          abort() {
            resolve(null);
            if ((interaction == null ? void 0 : interaction.owner) === this) clear();
          }
        });
        owner2.start = owner2.progress;
        services.begin(candidate.entry.element, candidate.dismiss ? "Dismiss" : candidate.origin === "Pop" ? "Unpop" : "Pop", owner2);
        if (interaction !== current) return;
        try {
          current.target.setPointerCapture(event.pointerId);
          current.captured = true;
        } catch (_) {
        }
      }
      const owner = current.owner;
      const displacement = (owner.axis === "x" ? x : y) * owner.sign;
      owner.displacement = displacement;
      owner.progress = clamp(owner.start + displacement / (owner.params.distance || owner.params.fallback));
      owner.seek();
      if (event.cancelable) event.preventDefault();
    }
    function nativeScroll(target, element, axis, delta) {
      for (let current = target; current && current !== element && current !== root.document; current = current.parentElement) {
        const style = root.getComputedStyle(current);
        if (!/auto|scroll/.test(axis === "x" ? style.overflowX : style.overflowY)) continue;
        const position = axis === "x" ? current.scrollLeft : current.scrollTop;
        const maximum = axis === "x" ? current.scrollWidth - current.clientWidth : current.scrollHeight - current.clientHeight;
        if (maximum > 0 && (delta < 0 ? position < maximum : position > 0)) return true;
      }
      return false;
    }
    function release(cancelled) {
      const owner = interaction == null ? void 0 : interaction.owner;
      if (owner) {
        owner.finish(cancelled);
        suppressed = interaction.target;
        clearTimeout(suppressTimer);
        root.document.addEventListener("click", click, true);
        suppressTimer = setTimeout(clearClick, 500);
      }
      clear();
    }
    function click(event) {
      if (!suppressed || !(suppressed === event.target || suppressed.contains(event.target) || event.target.contains(suppressed))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      clearClick();
    }
    function clearClick() {
      clearTimeout(suppressTimer);
      suppressTimer = null;
      suppressed = null;
      root.document.removeEventListener("click", click, true);
    }
    function clear() {
      const previous = interaction;
      interaction = null;
      for (const name of ["pointermove", "pointerup", "pointercancel", "lostpointercapture"])
        root.document.removeEventListener(name, move, true);
      if (previous == null ? void 0 : previous.captured) try {
        previous.target.releasePointerCapture(previous.id);
      } catch (_) {
      }
    }
    function cancel() {
      release(true);
    }
    return { update, remove, inspect, destroy() {
      cancel();
      for (const element of [...entries.keys()]) remove(element);
      clearClick();
    } };
  }

  // src/aellux.ext.present.js
  /*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */
  (function(root) {
    "use strict";
    const AelluxJs = root.AelluxJs;
    const extensionName = "present";
    if (!AelluxJs) {
      throw new Error(`[aellux.js] Cannot attach the "${extensionName}" extension: root.AelluxJs is not defined. Load the aellux.js boot script before this extension.`);
    }
    const attr = {
      present: AelluxJs.attr(extensionName),
      group: AelluxJs.attr("present-group"),
      active: AelluxJs.attr("present-active"),
      when: AelluxJs.attr("present-when"),
      triggerOn: AelluxJs.attr("trigger-on"),
      autoDismiss: AelluxJs.attr("auto-dismiss"),
      presentMotion: AelluxJs.attr("present-motion"),
      dismissOnClick: AelluxJs.attr("dismiss-on-click"),
      trigger: AelluxJs.attr("trigger"),
      //toggle,pop,dismiss,unpop
      dismiss: AelluxJs.attr("dismiss"),
      //target ID
      target: AelluxJs.attr("target")
      //target ID
    };
    const className = {
      pop: AelluxJs.className("pop"),
      popping: AelluxJs.className("popping"),
      dismissing: AelluxJs.className("dismissing"),
      unpopping: AelluxJs.className("unpopping"),
      unpop: AelluxJs.className("unpop"),
      dismissed: AelluxJs.className("dismissed"),
      willChange: AelluxJs.className("will-change"),
      grid: AelluxJs.className("present-grid")
    };
    const presentSelector = `[${attr.present}]`;
    const groupSelector = `[${attr.group}]`;
    AelluxJs.extAttach(extensionName, {
      init,
      destroy,
      pop,
      dismiss,
      unpop,
      toggle,
      trigger,
      show,
      selected,
      popNext
    });
    const POP = "Pop", DISMISS = "Dismiss", UNPOP = "Unpop", BEFORE = "Before", MILLISECOND = "ms", SECOND = "s", DEFAULT_PRESENT = "opacity transform height width", OPACITY_SYNTAX = "<number> | <percentage>", TRANSFORM_SYNTAX = "<transform-list> | none";
    const TRANSITION_PREPARE_TIME = 100;
    const TAP_CLICK_WAIT_TIME = 32;
    const presentElements = /* @__PURE__ */ new Map();
    const openPresentElements = /* @__PURE__ */ new Set();
    let fallbackMotionId = 5e6;
    const triggerElementsSet = /* @__PURE__ */ new Set();
    const triggerTargets = /* @__PURE__ */ new Map();
    const triggersByTargetId = /* @__PURE__ */ new Map();
    const indexedTriggerValues = /* @__PURE__ */ new Map();
    const elementMemories = /* @__PURE__ */ new WeakMap();
    const containerAriaHandlers = /* @__PURE__ */ new WeakMap();
    const triggerAriaHandlers = /* @__PURE__ */ new WeakMap();
    const measuredMemories = /* @__PURE__ */ new WeakMap();
    const groups = /* @__PURE__ */ new Map();
    const hoverTimers = /* @__PURE__ */ new Map();
    const hoveredTriggers = /* @__PURE__ */ new Set();
    const pendingTaps = /* @__PURE__ */ new Set();
    let groupObserver = null;
    let groupsQueued = false;
    let interpolatedProgress = false;
    let interpolatedUnpop = false;
    const playback = createPresentPlayback(root, AelluxJs);
    const gestures = createPresentGestures(root, AelluxJs, {
      state: (element) => {
        var _a;
        return (_a = presentElements.get(element)) == null ? void 0 : _a.state;
      },
      busy: (element) => {
        var _a;
        return !!((_a = presentElements.get(element)) == null ? void 0 : _a.transition);
      },
      order: (element) => {
        var _a;
        return ((_a = presentElements.get(element)) == null ? void 0 : _a.presentationOrder) || 0;
      },
      begin(element, direction, gesture) {
        const controller = presentElements.get(element);
        controller.gestureRequest = gesture;
        presentTransition(element, direction === POP, false, false, void 0, direction).finally(() => {
          if (controller.gestureRequest === gesture) controller.gestureRequest = null;
          if (controller.gesture !== gesture) gesture.abort();
        });
        if (!controller.transition) gesture.abort();
      }
    });
    let autoObserver = null;
    let presentationSequence = 0;
    const cssProperties = [
      ["pop-progress", "<number>", "0"],
      ["dismiss-progress", "<number>", "1"],
      ["present-pop-phase", "<number>", "0"],
      ["present-dismiss-phase", "<number>", "1"],
      ["from-opacity", OPACITY_SYNTAX, "0"],
      ["pop-opacity", OPACITY_SYNTAX, "1"],
      ["dismiss-opacity", OPACITY_SYNTAX, "0"],
      ["from-transform", TRANSFORM_SYNTAX, "scale(0.5)"],
      ["pop-transform", TRANSFORM_SYNTAX, "scale(1)"],
      ["dismiss-transform", TRANSFORM_SYNTAX, "scale(1.2)"],
      ["from-height", "*", "0fr"],
      ["pop-height", "*", "1fr"],
      ["dismiss-height", "*", "0fr"],
      ["from-width", "*", "0fr"],
      ["pop-width", "*", "1fr"],
      ["dismiss-width", "*", "0fr"],
      ["pop-ease", "*", "ease-out"],
      ["dismiss-ease", "*", "ease-in"],
      ["pop-duration", "<time>", "250ms"],
      ["dismiss-duration", "<time>", "250ms"]
    ];
    function init(options) {
      playback.init();
      const descriptors = cssProperties.map(([name, syntax, initialValue]) => ({ name: `--ae-${name}`, syntax, initialValue }));
      const progressRegistered = AelluxJs.registerCssProperty(...descriptors.slice(0, 4));
      interpolatedProgress = !!(progressRegistered && root.CSS.supports && root.CSS.supports("opacity", "clamp(0, 0.5, 1)"));
      interpolatedUnpop = !!AelluxJs.registerCssProperty({ name: "--ae-unpop-progress", syntax: "<number>", initialValue: "1" });
      AelluxJs.registerCssProperty(...descriptors.slice(4));
      AelluxJs.mountManager.add({
        extensionName,
        selector: presentSelector,
        priority: 0,
        mount: mountPresentContainer,
        unmount: unmountPresentContainer,
        update: (element) => autoDismissSchedule(element, presentElements.get(element)),
        controllers: ["pop", "dismiss", "unpop", "trigger", "toggle"]
      });
      AelluxJs.mountManager.add({
        extensionName,
        priority: 0,
        selector: `[${[
          attr.trigger,
          attr.dismiss,
          attr.target
        ].join("],[")}]`,
        mount: mountTriggerElement,
        unmount: unmountTriggerElement
      });
      AelluxJs.mountManager.add({
        extensionName,
        selector: groupSelector,
        priority: 1,
        mount: mountGroup,
        unmount: unmountGroup,
        controllers: ["show", "selected", "popNext"]
      });
      autoObserver = new root.MutationObserver((records) => {
        for (const record of records) {
          const controller = presentElements.get(record.target);
          if (controller) {
            if (record.attributeName !== attr.autoDismiss) gestures.update(record.target);
            autoDismissSchedule(record.target, controller);
          }
        }
        if (records.some((record) => record.type === "childList" || record.attributeName === "id")) {
          for (const element of presentElements.keys()) if (element.hasAttribute(AelluxJs.attr("present-gesture-source"))) gestures.update(element);
        }
      });
      autoObserver.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: [
        attr.autoDismiss,
        "id",
        ...["", "-source", "-unpop", "-dismiss"].map((suffix2) => AelluxJs.attr(`present-gesture${suffix2}`))
      ] });
      document.addEventListener("pointerover", onHover);
      document.addEventListener("pointerout", onHover);
      AelluxJs.on("$click", OnClick);
      AelluxJs.on("tap", onTap);
      AelluxJs.onEvent(root, "$resize", refreshExpandedStates);
    }
    function destroy() {
      gestures.destroy();
      autoObserver == null ? void 0 : autoObserver.disconnect();
      autoObserver = null;
      AelluxJs.mountManager.remove({ extensionName });
      AelluxJs.off("$click", OnClick);
      AelluxJs.off("tap", onTap);
      for (const pending of pendingTaps) cancelPendingTap(pending);
      AelluxJs.offEvent(root, "$resize", refreshExpandedStates);
      document.removeEventListener("pointerover", onHover);
      document.removeEventListener("pointerout", onHover);
      for (const group of groups.keys()) unmountGroup(group);
      for (const target of hoverTimers.keys()) cancelHoverClose(target);
      hoveredTriggers.clear();
      for (const triggerElement of triggerElementsSet) {
        unmountTriggerElement(triggerElement);
      }
      for (const element of presentElements.keys()) {
        unmountPresentContainer(element);
      }
      openPresentElements.clear();
    }
    function mountPresentContainer(element) {
      if (presentElements.has(element)) return;
      elementMemories.set(element, AelluxJs.persist.element.save(
        element,
        [attr.present, attr.presentMotion, "hidden"],
        [
          "--ae-pop-progress",
          "--ae-dismiss-progress",
          "--ae-unpop-progress",
          "--ae-present-pop-phase",
          "--ae-present-dismiss-phase"
        ]
      ));
      containerAriaHandlers.set(element, AelluxJs.aria.register(element));
      const initialState = element.classList.contains(className.dismissed) ? DISMISS : element.classList.contains(className.unpop) || element.hidden ? UNPOP : POP;
      const legacyHidden = element.hidden || ![className.pop, className.unpop, className.dismissed].some((name) => element.classList.contains(name));
      if ((element.getAttribute(attr.present) || "").trim().toLowerCase() === "all") {
        element.setAttribute(attr.present, DEFAULT_PRESENT);
      }
      if (element.hasAttribute(attr.presentMotion)) {
        element.removeAttribute(attr.presentMotion);
      }
      const presentMotion = element.querySelector(`:scope>[${attr.presentMotion}]`);
      const tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
      const measuredHeight = !presentMotion && tokens.includes("height");
      const measuredWidth = !presentMotion && tokens.includes("width");
      if (presentMotion) element.classList.add(className.grid);
      else if (measuredHeight || measuredWidth) {
        AelluxJs.diagnostics.info(
          AelluxJs.diagnostics.INFO_PRESENT_MEASURED_LAYOUT,
          { extension: extensionName, element }
        );
      }
      const presentController = {
        state: initialState,
        legacyHidden,
        initialClasses: [className.pop, className.unpop, className.dismissed].filter((name) => element.classList.contains(name)),
        gesture: null,
        gestureRequest: null,
        presentMotion,
        measuredHeight,
        measuredWidth,
        motionEnabled: (element.getAttribute(attr.present) || "").trim() !== "",
        motionId: AelluxJs.motion ? AelluxJs.motion.id() : fallbackMotionId++,
        transition: null,
        handoff: null,
        opening: null,
        reverse: null,
        operationRevision: 0,
        presentationOrder: element.hidden ? 0 : ++presentationSequence,
        autoDismissTimeout: null,
        autoCountdown: null,
        direction: initialState,
        classList: element.classList,
        triggers: /* @__PURE__ */ new Set(),
        triggerExpanded: initialState === POP,
        setAriaExpanded: function(value) {
          this.expanded = value === "true";
          containerAriaHandlers.get(element).set({ expanded: this.expanded });
        },
        setTriggerExpanded: function(value) {
          this.triggerExpanded = value;
          this.triggers.forEach(updateTriggerAriaExpanded);
        },
        stop: function(options = {}) {
          var _a, _b, _c;
          (_a = this.gesture) == null ? void 0 : _a.abort();
          this.gesture = null;
          const replacement = options.replacement === true;
          const transitionStart = options.transitionStart === true;
          const transition = this.transition;
          if (transition) {
            transition.cancelled = true;
            transition.replacement = replacement;
            if (AelluxJs.motion) AelluxJs.motion.cancel(this.motionId);
            if (transition.timeout !== null) {
              clearTimeout(transition.timeout);
              transition.timeout = null;
            }
            if (!transitionStart && transition.className) {
              this.classList.remove(transition.className);
            }
            this.transition = null;
            transition.interrupt(
              AelluxJs.diagnostics.create(
                AelluxJs.diagnostics.WARN_INTERRUPTION,
                { extensionName, replacement }
              )
            );
          }
          cancelAutoDismiss(this);
          (_b = this.reverse) == null ? void 0 : _b.cleanup();
          this.reverse = null;
          (_c = this.gestureDisplay) == null ? void 0 : _c.restore();
          this.gestureDisplay = null;
          restoreHandoff(this);
          if (transitionStart) {
            this.classList.remove(className.dismissing, className.unpopping);
          } else {
            this.classList.remove(
              className.pop,
              className.popping,
              className.dismissing,
              className.unpopping,
              className.willChange
            );
          }
          if (!replacement) restoreMeasuredStyles(element, this);
        }
      };
      establishState(element, presentController, initialState);
      if (initialState === POP) {
        openPresentElements.add(element);
      }
      presentElements.set(element, presentController);
      for (const triggerElement of element.querySelectorAll(
        `[${attr.trigger}],[${attr.dismiss}],[${attr.target}]`
      )) {
        if (triggerTargets.get(triggerElement) === element) {
          presentController.triggers.add(triggerElement);
          updateTriggerAriaExpanded(triggerElement);
        }
      }
      const idTriggers = triggersByTargetId.get(element.id);
      if (idTriggers) {
        for (const triggerElement of idTriggers) {
          refreshTriggerTargets(triggerElement);
        }
      }
      setProgress(element, initialState === POP);
      syncAriaExpanded(element, presentController);
      queueGroups();
      autoDismissSchedule(element, presentController);
      gestures.update(element);
    }
    function unmountPresentContainer(element) {
      var _a, _b, _c;
      if (!presentElements.has(element)) return;
      cancelElementTaps(element);
      const controller = presentElements.get(element);
      gestures.remove(element);
      cancelHoverClose(element);
      for (const button of controller.triggers) hoveredTriggers.delete(button);
      controller.stop();
      (_a = AelluxJs.waitLayout) == null ? void 0 : _a.cancel(controller.motionId);
      element.classList.remove(className.grid);
      element.classList.remove(className.pop, className.unpop, className.dismissed);
      element.classList.add(...controller.initialClasses);
      presentElements.delete(element);
      openPresentElements.delete(element);
      (_b = containerAriaHandlers.get(element)) == null ? void 0 : _b.release();
      containerAriaHandlers.delete(element);
      (_c = elementMemories.get(element)) == null ? void 0 : _c.restore();
      elementMemories.delete(element);
      controller.triggers.forEach(updateTriggerAriaExpanded);
      queueGroups();
    }
    function mountTriggerElement(triggerElement) {
      if (triggerElementsSet.has(triggerElement)) return;
      triggerAriaHandlers.set(triggerElement, AelluxJs.aria.register(triggerElement));
      triggerElementsSet.add(triggerElement);
      refreshTriggerTargets(triggerElement);
    }
    function unmountTriggerElement(triggerElement) {
      var _a, _b;
      if (!triggerElementsSet.has(triggerElement)) return;
      cancelElementTaps(triggerElement);
      hoveredTriggers.delete(triggerElement);
      const target = triggerTargets.get(triggerElement);
      if (target) {
        cancelHoverClose(target);
        (_a = presentElements.get(target)) == null ? void 0 : _a.triggers.delete(triggerElement);
        triggerTargets.delete(triggerElement);
      }
      unindexTriggerTarget(triggerElement);
      triggerElementsSet.delete(triggerElement);
      (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.release();
      triggerAriaHandlers.delete(triggerElement);
    }
    function targetIdFor(value) {
      if (!value) return null;
      const id = value.charAt(0) === "#" ? value.slice(1) : value;
      return id && !/[\s#]/.test(id) ? id : null;
    }
    function targetById(value) {
      const id = targetIdFor(value);
      if (!id) {
        AelluxJs.diagnostics.error(AelluxJs.diagnostics.ERROR_EXTENSION_SELECTOR, {
          cause: new SyntaxError(),
          extension: extensionName,
          selector: value,
          reason: "Present targets accept one element ID, not a CSS selector list.",
          suggestion: "Use one existing Present ID, optionally prefixed with #."
        });
        return null;
      }
      return document.getElementById(id);
    }
    function unindexTriggerTarget(triggerElement) {
      const previous = indexedTriggerValues.get(triggerElement);
      const id = targetIdFor(previous);
      if (id) {
        const triggers = triggersByTargetId.get(id);
        triggers.delete(triggerElement);
        if (!triggers.size) triggersByTargetId.delete(id);
      }
      indexedTriggerValues.delete(triggerElement);
    }
    function indexTriggerTarget(triggerElement, value) {
      if (indexedTriggerValues.get(triggerElement) === value) return;
      unindexTriggerTarget(triggerElement);
      indexedTriggerValues.set(triggerElement, value);
      const id = targetIdFor(value);
      if (id) {
        let triggers = triggersByTargetId.get(id);
        if (!triggers) {
          triggers = /* @__PURE__ */ new Set();
          triggersByTargetId.set(id, triggers);
        }
        triggers.add(triggerElement);
      }
    }
    function refreshTriggerTargets(triggerElement) {
      var _a, _b, _c, _d, _e;
      const previousTarget = triggerTargets.get(triggerElement);
      const targetSelector = triggerElement.getAttribute(attr.target);
      const dismiss2 = triggerElement.getAttribute(attr.dismiss);
      indexTriggerTarget(triggerElement, dismiss2 || targetSelector);
      const container = triggerElement.closest(presentSelector);
      if (previousTarget) {
        (_a = presentElements.get(previousTarget)) == null ? void 0 : _a.triggers.delete(triggerElement);
      }
      let target = null;
      if (dismiss2 || targetSelector) {
        target = targetById(dismiss2 || targetSelector);
      } else if (container && container.id) {
        target = container;
      }
      if (previousTarget !== target) hoveredTriggers.delete(triggerElement);
      if (!target || !target.id) {
        triggerTargets.delete(triggerElement);
        (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.unset("expanded");
        (_c = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _c.unset("controls");
        return;
      }
      triggerTargets.set(triggerElement, target);
      (_d = presentElements.get(target)) == null ? void 0 : _d.triggers.add(triggerElement);
      const targetIds = /* @__PURE__ */ new Set([target.id]);
      const initial = (_e = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _e.initial("controls");
      if (initial) {
        initial.trim().split(/\s+/).forEach((x) => targetIds.add(x));
      }
      updateTriggerAriaExpanded(triggerElement);
      triggerAriaHandlers.get(triggerElement).set({ controls: [...targetIds] });
    }
    function updateTriggerAriaExpanded(triggerElement) {
      var _a, _b;
      const target = triggerTargets.get(triggerElement);
      if (!target) return;
      const expanded = ((_a = presentElements.get(target)) == null ? void 0 : _a.triggerExpanded) === true;
      (_b = triggerAriaHandlers.get(triggerElement)) == null ? void 0 : _b.set({ expanded });
    }
    function pop(element) {
      return presentTransition(element, true, true);
    }
    function dismiss(element) {
      return presentTransition(element, false);
    }
    function unpop(element) {
      return presentTransition(element, false, false, false, void 0, UNPOP);
    }
    function toggle(element, goto) {
      return presentTransition(element, goto);
    }
    function trigger(element, trigger2) {
      trigger2 = typeof trigger2 === "string" ? (trigger2 || "toggle").toLowerCase() : "toggle";
      if (!["pop", "dismiss", "unpop", "toggle"].includes(trigger2)) AelluxJs.diagnostics.warn(
        AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE,
        {
          extension: extensionName,
          element,
          attribute: attr.trigger,
          value: trigger2,
          reason: "Unknown Present action; using toggle.",
          suggestion: "Use pop, dismiss, unpop, or toggle."
        }
      );
      const method = trigger2 === "pop" ? pop : trigger2 === "dismiss" ? dismiss : trigger2 === "unpop" ? unpop : toggle;
      return method(element);
    }
    function restoreMeasuredStyles(element, controller) {
      const memory = measuredMemories.get(element);
      if (!memory) return;
      memory.restore();
      measuredMemories.delete(element);
    }
    function restoreHandoff(controller) {
      var _a;
      (_a = controller.handoff) == null ? void 0 : _a.memory.restore();
      controller.handoff = null;
    }
    function captureHandoff(element, controller) {
      if ((controller.measuredHeight || controller.measuredWidth) && !measuredMemories.has(element)) {
        measuredMemories.set(element, AelluxJs.persist.element.save(element, [], ["max-height", "max-width"]));
      }
      const tokens = (element.getAttribute(attr.present) || "").split(/\s+/);
      const properties = [];
      if (tokens.includes("opacity")) properties.push("opacity");
      if (tokens.includes("transform") && !element.hasAttribute(AelluxJs.attr("anchor"))) properties.push("transform");
      if (tokens.includes("height")) properties.push(...controller.presentMotion ? ["grid-template-rows", "height"] : ["max-height"]);
      if (tokens.includes("width")) properties.push(...controller.presentMotion ? ["grid-template-columns", "width"] : ["max-width"]);
      properties.push(
        "--ae-present-pop-phase",
        "--ae-present-dismiss-phase",
        "--ae-pop-progress",
        "--ae-dismiss-progress",
        "--ae-unpop-progress"
      );
      const computed = root.getComputedStyle(element);
      const values = properties.map((property) => {
        let value = computed.getPropertyValue(property).trim();
        if (property === "max-height" || property === "max-width") {
          const dimension = property.slice(4);
          value = `${Math.max(0, parseFloat(computed[dimension]) || 0)}px`;
        }
        return [property, value];
      });
      if (controller.reverse) {
        controller.reverse.cleanup();
        controller.reverse = null;
        restoreHandoff(controller);
      }
      const memory = AelluxJs.persist.element.save(element, [], [...properties, "transition-property"]);
      const transition = AelluxJs.persist.element.save(element, [], ["transition-property"]);
      const freeze = () => {
        element.style.setProperty("transition-property", "none", "important");
        for (const [property, value] of values) element.style.setProperty(property, value, property.startsWith("--") ? "" : "important");
        element.getBoundingClientRect();
      };
      freeze();
      return { memory, transition, values, freeze };
    }
    async function prepareMeasuredSize(element, controller, gotoVisible, previousSize, waitForPreparation) {
      if (!controller.measuredHeight && !controller.measuredWidth) return null;
      if (!measuredMemories.has(element)) {
        measuredMemories.set(element, AelluxJs.persist.element.save(
          element,
          [],
          ["max-height", "max-width"]
        ));
      }
      if (gotoVisible || !previousSize) measuredMemories.get(element).restore();
      let size = previousSize;
      if (gotoVisible || !size) {
        const states = [className.unpop, className.dismissed].filter((name) => element.classList.contains(name));
        if (gotoVisible) element.classList.remove(...states);
        const computed = root.getComputedStyle(element);
        const height = parseFloat(computed.height);
        const width = parseFloat(computed.width);
        size = {
          height: Number.isFinite(height) ? height : element.scrollHeight,
          width: Number.isFinite(width) ? width : element.scrollWidth
        };
        if (gotoVisible) element.classList.add(...states);
      }
      const start = previousSize || (gotoVisible ? { height: 0, width: 0 } : size);
      if (controller.measuredHeight) {
        element.style.setProperty("max-height", `${Math.max(0, start.height)}px`, "important");
      }
      if (controller.measuredWidth) {
        element.style.setProperty("max-width", `${Math.max(0, start.width)}px`, "important");
      }
      if (!waitForPreparation)
        await AelluxJs.waitLayout.read(
          controller.motionId,
          () => element.getBoundingClientRect()
        );
      return size;
    }
    async function presentTransition(element, gotoVisible, forceRepop = false, groupOperation = false, presentationOrder, closingDirection = DISMISS) {
      var _a, _b, _c, _d, _e;
      const controller = presentElements.get(element);
      if (!controller) return;
      const gesture = controller.gestureRequest;
      const reversing = closingDirection === UNPOP && gotoVisible === false;
      if (reversing && controller.direction === DISMISS && controller.transition) return false;
      if (controller.direction === null)
        controller.direction = element.hidden ? DISMISS : POP;
      if (typeof gotoVisible === "undefined" || gotoVisible === null)
        gotoVisible = controller.direction === POP ? false : true;
      const group = element.closest(groupSelector);
      const groupState = groups.get(group);
      const groupRevision = groupState == null ? void 0 : groupState.revision;
      if (!groupOperation && groupState && !groupState.accumulating && element !== group) {
        if (!element.id) {
          groupDiagnostic(group, "Present Group members must have an ID.");
          return false;
        }
        if (gotoVisible) return show(group, element.id);
        if (groups.get(group).selected === element) {
          if (!reversing) return show(group, "");
          if (group.getAttribute(attr.active) !== "") group.setAttribute(attr.active, "");
          return selectGroup(group, null, groupMembers(group), UNPOP);
        }
      }
      const hasCapacity = () => groupOperation || element === group || !gotoVisible || !(groupState == null ? void 0 : groupState.accumulating) || groupMemberActive(element, groupState) || activeGroupMembers(group, groupState).length < groupLimit(group, groupState);
      if (!hasCapacity()) return false;
      const newDirection = gotoVisible ? POP : closingDirection;
      if (controller.state !== POP && !controller.transition && !gotoVisible || newDirection === controller.direction && !forceRepop) {
        if (!controller.transition) syncAriaExpanded(element, controller);
        return;
      }
      let transition = null;
      try {
        const revision = controller.operationRevision;
        const allowEvent = groupOperation || AelluxJs.dispatchFrom(
          element,
          `${BEFORE}${newDirection}`,
          { bubbles: true, cancelable: true }
        );
        if (!allowEvent || controller.operationRevision !== revision || presentElements.get(element) !== controller || !element.isConnected) return;
        if (!groupOperation && element !== group && (element.closest(groupSelector) !== group || groupState && (groups.get(group) !== groupState || groupState.revision !== groupRevision))) return;
        if (!hasCapacity()) return false;
        controller.operationRevision++;
        const impliedReverse = reversing && !controller.opening && !controller.transition;
        const reverseTracks = reversing && controller.motionEnabled && ((_a = AelluxJs.currentPreference) == null ? void 0 : _a.call(AelluxJs, "reduced-motion")) !== "reduced" ? gesture ? playback.full(element, controller, false) : playback.snapshot(element, controller, interpolatedProgress) : [];
        if (gotoVisible) controller.opening = null;
        if (gotoVisible) controller.presentationOrder = presentationOrder === void 0 ? ++presentationSequence : presentationOrder;
        if (!gotoVisible || !groupOperation) (_b = groups.get(group)) == null ? void 0 : _b.reservations.delete(element);
        if (forceRepop && (!element.hidden || controller.transition)) {
          controller.stop();
          element.hidden = true;
          openPresentElements.delete(element);
          syncAriaExpanded(element, controller);
          element.getBoundingClientRect();
        }
        const reusePreparation = !forceRepop && controller.motionEnabled && controller.transition !== null && controller.classList.contains(className.willChange);
        const waitForPreparation = !gesture && controller.motionEnabled && !reusePreparation && !reversing;
        let previousSize = null;
        const handoff = !gesture && !gotoVisible && controller.motionEnabled ? captureHandoff(element, controller) : null;
        if (handoff && (controller.measuredHeight || controller.measuredWidth)) {
          const computed = root.getComputedStyle(element);
          previousSize = {
            height: parseFloat(computed.maxHeight),
            width: parseFloat(computed.maxWidth)
          };
        }
        if (!forceRepop) {
          controller.stop({ replacement: !!handoff || reusePreparation, transitionStart: true });
        }
        controller.handoff = handoff;
        controller.gestureRequest = null;
        controller.gesture = gesture;
        controller.direction = newDirection;
        if (reversing) controller.reverse = gesture ? playback.control(element, reverseTracks, false, interpolatedProgress, interpolatedUnpop) : playback.reverse(element, reverseTracks, interpolatedUnpop);
        controller.setTriggerExpanded(gotoVisible);
        if (!handoff) {
          setPhase(element, "pop", "0");
          setPhase(element, "dismiss", "0");
          element.style.setProperty("--ae-pop-progress", "0");
          element.style.setProperty("--ae-dismiss-progress", "0");
        }
        if (gotoVisible || reversing) element.style.setProperty("--ae-unpop-progress", "0");
        root.getComputedStyle(element).getPropertyValue("--ae-pop-progress");
        const interrupted = new Promise((_, interruptTransition) => {
          transition = {
            className: null,
            timeout: null,
            interrupt: interruptTransition,
            replacement: false
          };
          controller.transition = transition;
        });
        interrupted.catch(() => {
        });
        element.hidden = false;
        if (gesture && root.getComputedStyle(element).display === "none") {
          controller.gestureDisplay = AelluxJs.persist.element.save(element, [], ["display"]);
          element.style.setProperty("display", controller.presentMotion ? "inline-grid" : "block", "important");
        }
        openPresentElements.add(element);
        let size = null;
        if (!reversing && (controller.measuredHeight || controller.measuredWidth))
          size = await prepareMeasuredSize(
            element,
            controller,
            gotoVisible,
            previousSize,
            waitForPreparation || !!gesture
          );
        if (controller.transition !== transition) return;
        if (controller.motionEnabled) {
          controller.classList.add(className.willChange);
        }
        if (waitForPreparation) {
          const prepared = new Promise((resolve) => {
            transition.timeout = setTimeout(() => {
              transition.timeout = null;
              resolve();
            }, TRANSITION_PREPARE_TIME);
          });
          await Promise.race([prepared, interrupted]);
        }
        transition.className = gotoVisible ? className.popping : reversing ? className.unpopping : className.dismissing;
        const configurationDirection = reversing ? POP : newDirection;
        const duration = root.getComputedStyle(element).getPropertyValue(`--ae-${configurationDirection}-duration`.toLowerCase()).trim();
        const timeMs = reversing ? controller.reverse.duration : getString2Time(duration);
        const applyDestination = () => {
          controller.classList.remove(
            className.unpop,
            className.dismissed,
            className.pop,
            className.popping,
            className.dismissing,
            className.unpopping
          );
          controller.classList.add(transition.className);
          if (interpolatedProgress) {
            element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
            element.style.setProperty("--ae-dismiss-progress", "clamp(0, var(--ae-present-dismiss-phase), 1)");
          }
          setPhase(element, "pop", gotoVisible ? "1" : "0");
          setPhase(element, "dismiss", gotoVisible ? "0" : "1");
          if (size) {
            if (controller.measuredHeight) {
              element.style.setProperty("max-height", `${gotoVisible ? size.height : 0}px`, "important");
            }
            if (controller.measuredWidth) {
              element.style.setProperty("max-width", `${gotoVisible ? size.width : 0}px`, "important");
            }
          }
        };
        const activateTransition = () => {
          if (controller.transition !== transition) return;
          if (gesture) {
            let tracks = reverseTracks;
            if (!reversing) {
              const opening = controller.opening;
              controller.opening = playback.capture(element, controller, applyDestination, size, gotoVisible && interpolatedProgress, gotoVisible ? "pop" : "dismiss");
              tracks = playback.full(element, controller, false);
              controller.opening = gotoVisible ? { saved: tracks, completed: true } : opening;
              controller.reverse = playback.control(element, tracks, gesture.dismiss, interpolatedProgress, interpolatedUnpop);
            }
            controller.classList.remove(className.pop, className.unpop, className.dismissed, className.popping, className.unpopping, className.dismissing);
            controller.classList.add(transition.className);
            controller.reverse.apply();
            let distance = 0;
            const transform = tracks == null ? void 0 : tracks.find((track) => track.property === "transform");
            if (transform) try {
              const frames = transform.frames;
              const from = new root.DOMMatrix(frames[0].transform), to = new root.DOMMatrix(frames[frames.length - 1].transform);
              distance = Math.abs(gesture.axis === "x" ? to.m41 - from.m41 : to.m42 - from.m42);
            } catch (_) {
            }
            let previous = gesture.progress;
            gesture.attach({
              seek(value) {
                if (controller.transition !== transition) return;
                controller.reverse.seek(value);
                if (!gesture.dismiss && value !== previous) {
                  transition.className = value > previous ? className.popping : className.unpopping;
                  controller.classList.remove(className.popping, className.unpopping);
                  controller.classList.add(transition.className);
                }
                previous = value;
                const popValue = gesture.dismiss ? 1 - value : value;
                if (!interpolatedProgress) {
                  setPhase(element, "pop", String(popValue));
                  setPhase(element, "dismiss", String(gesture.dismiss ? value : 1 - value));
                  element.style.setProperty("--ae-pop-progress", String(popValue));
                  element.style.setProperty("--ae-dismiss-progress", String(gesture.dismiss ? value : 1 - value));
                }
                if (!interpolatedUnpop) element.style.setProperty("--ae-unpop-progress", String(1 - popValue));
              },
              playTo(target) {
                if (controller.transition !== transition) return Promise.reject();
                if (!gesture.dismiss) {
                  transition.className = target ? className.popping : className.unpopping;
                  controller.classList.remove(className.popping, className.unpopping);
                  controller.classList.add(transition.className);
                }
                return controller.reverse.playTo(target);
              }
            }, distance);
            return;
          }
          if (reversing) {
            handoff == null ? void 0 : handoff.memory.restore();
            if (interpolatedProgress)
              element.style.setProperty("--ae-pop-progress", "clamp(0, var(--ae-present-pop-phase), 1)");
            controller.classList.remove(className.pop, className.popping, className.dismissing);
            controller.classList.add(className.unpopping);
            controller.reverse.apply();
            return;
          }
          if (handoff) {
            handoff.memory.restore();
            element.style.setProperty("transition-property", "none", "important");
            applyDestination();
            const computed = root.getComputedStyle(element);
            const tracks = handoff.values.filter(([property]) => property.startsWith("grid-template-") || property === "height" || property === "width").map(([property]) => [property, computed.getPropertyValue(property)]);
            handoff.freeze();
            handoff.transition.restore();
            const properties = root.getComputedStyle(element).transitionProperty;
            element.getBoundingClientRect();
            handoff.memory.restore();
            applyDestination();
            if (tracks.length) element.style.setProperty("transition-property", `${properties}, height, width`, "important");
            for (const [property, value] of tracks) element.style.setProperty(property, value, "important");
          } else if (gotoVisible) {
            controller.opening = playback.capture(element, controller, applyDestination, size, interpolatedProgress);
          } else applyDestination();
        };
        const advancedEase = root.getComputedStyle(element).getPropertyValue(`--ae-${configurationDirection}-aellux-ease`.toLowerCase()).trim() || void 0;
        const motionOptions = {
          extension: extensionName,
          id: controller.motionId,
          ownedOnly: reversing,
          apply: activateTransition,
          easing: reversing && !impliedReverse ? void 0 : advancedEase,
          nativeDuration: timeMs,
          maxFPS: AelluxJs.layoutMaxFPS ? AelluxJs.layoutMaxFPS(element) : void 0,
          abort: () => controller.transition !== transition || !element.isConnected
        };
        const completed = gesture ? (activateTransition(), gesture.settled) : AelluxJs.motion ? AelluxJs.motion.run(element, motionOptions) : legacyMotionRun(motionOptions, transition);
        AelluxJs.dispatchFrom(element, "Layout", {
          detail: {
            origin: `present.${newDirection}`.toLowerCase(),
            durationMs: Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0
          },
          bubbles: true
        });
        if (controller.transition !== transition || !element.isConnected) return;
        const autoDismissValue = gotoVisible && element.getAttribute(attr.autoDismiss);
        if (autoDismissValue) {
          const duration2 = getString2Time(autoDismissValue);
          if (Number.isFinite(duration2) && duration2 >= 0) {
            emitAutoDismissProgress(element, 0, duration2);
          }
        }
        if (controller.transition !== transition || !element.isConnected) return;
        AelluxJs.dispatchFrom(element, gotoVisible ? "Popping" : reversing ? "Unpopping" : "Dismissing", { bubbles: true });
        const motionResult = await Promise.race([completed, interrupted]);
        if (controller.transition !== transition || gesture && !motionResult || !gesture && motionResult && motionResult.status !== "completed") return;
        if (gesture) {
          const finalVisible = motionResult === POP;
          controller.direction = motionResult;
          controller.setTriggerExpanded(finalVisible);
          finishTransition(element, controller, transition, finalVisible);
          if (groupState && groups.get(group) === groupState && !groupState.accumulating) {
            const selected2 = finalVisible ? element : groupState.selected === element ? null : groupState.selected;
            groupState.selected = selected2;
            const active = (selected2 == null ? void 0 : selected2.id) || "";
            if (group.getAttribute(attr.active) !== active) group.setAttribute(attr.active, active);
            publishGroup(group, groupState, selected2);
          }
          controller.gesture = null;
          AelluxJs.dispatchFrom(element, motionResult, { bubbles: true });
          if (finalVisible) autoDismissSchedule(element, controller);
          return;
        }
        if (gotoVisible) playback.complete(element, controller, interpolatedProgress);
        finishTransition(element, controller, transition, gotoVisible);
        if (gotoVisible && !element.hidden) {
          autoDismissSchedule(element, controller);
          controller.classList.add(className.pop);
          AelluxJs.dispatchFrom(element, POP, { bubbles: true });
        }
        if (!gotoVisible && controller.state !== POP) {
          AelluxJs.dispatchFrom(element, newDirection, { bubbles: true });
        }
      } catch (error) {
        const ownsTransition = transition && controller.transition === transition;
        if (ownsTransition && transition.timeout !== null) {
          clearTimeout(transition.timeout);
          transition.timeout = null;
        }
        if (ownsTransition && transition.className) {
          controller.classList.remove(transition.className);
        }
        switch (error && error.code) {
          case AelluxJs.diagnostics.WARN_INTERRUPTION.code:
            if (transition && transition.cancelled) break;
            AelluxJs.diagnostics.warn(
              AelluxJs.diagnostics.WARN_INTERRUPTION,
              {
                cause: error,
                extension: extensionName,
                element,
                replacement: transition && transition.replacement === true
              }
            );
            break;
          default:
            AelluxJs.diagnostics.error(
              AelluxJs.diagnostics.ERROR_EXTENSION_TRANSITION,
              { cause: error, extension: extensionName, element }
            );
            break;
        }
      } finally {
        if (transition && controller.transition === transition) {
          (_c = controller.gesture) == null ? void 0 : _c.abort();
          controller.gesture = null;
          (_d = controller.reverse) == null ? void 0 : _d.cleanup();
          controller.reverse = null;
          (_e = controller.gestureDisplay) == null ? void 0 : _e.restore();
          controller.gestureDisplay = null;
          restoreHandoff(controller);
          restoreMeasuredStyles(element, controller);
          controller.transition = null;
          controller.classList.remove(className.willChange);
        }
      }
    }
    function legacyMotionRun(options, transition) {
      options.apply();
      return new Promise((resolve) => {
        transition.timeout = setTimeout(() => {
          transition.timeout = null;
          resolve({ id: options.id, status: "completed", mode: "native" });
        }, Math.max(0, Number(options.nativeDuration) || 0));
      });
    }
    function finishTransition(element, controller, transition, gotoVisible) {
      var _a, _b;
      restoreHandoff(controller);
      const focused = !gotoVisible && element.contains(document.activeElement) ? document.activeElement : null;
      controller.classList.remove(className.popping, className.unpopping, className.dismissing);
      establishState(element, controller, gotoVisible ? POP : controller.direction);
      element.hidden = !gotoVisible && controller.legacyHidden;
      (_a = controller.reverse) == null ? void 0 : _a.cleanup();
      controller.reverse = null;
      (_b = controller.gestureDisplay) == null ? void 0 : _b.restore();
      controller.gestureDisplay = null;
      restoreMeasuredStyles(element, controller);
      setProgress(element, gotoVisible);
      syncAriaExpanded(element, controller);
      refreshExpandedStates();
      gestures.inspect(element);
      if (!gotoVisible) openPresentElements.delete(element);
      else openPresentElements.add(element);
      if (focused && !controller.expanded) {
        if (document.activeElement === focused) focused.blur();
        if (document.activeElement !== focused) AelluxJs.dispatch(`${controller.direction}FocusLost`, {
          detail: { element, focused }
        });
      }
      transition.timeout = null;
    }
    function establishState(element, controller, state) {
      controller.state = state;
      controller.classList.toggle(className.pop, state === POP);
      controller.classList.toggle(className.unpop, state === UNPOP);
      controller.classList.toggle(className.dismissed, state === DISMISS);
    }
    function autoDismissSchedule(element, controller) {
      if (!controller) return;
      cancelAutoDismiss(controller);
      const autoDismissValue = element.getAttribute(attr.autoDismiss);
      if (controller.state !== POP || controller.transition && !controller.classList.contains(className.pop) || !element.isConnected || !autoDismissValue) return;
      const duration = getString2Time(autoDismissValue);
      if (!Number.isFinite(duration) || duration < 0) return;
      const countdown = { start: root.performance.now(), duration, frame: null, last: 0 };
      controller.autoCountdown = countdown;
      const valid = () => controller.autoCountdown === countdown && presentElements.get(element) === controller && element.isConnected;
      const emit = (completed, initial = false) => {
        const elapsedMs = initial ? 0 : Math.min(duration, Math.max(0, root.performance.now() - countdown.start));
        emitAutoDismissProgress(element, elapsedMs, duration, completed);
      };
      const tick = () => {
        var _a;
        if (!valid()) {
          if (controller.autoCountdown === countdown) cancelAutoDismiss(controller);
          return;
        }
        const now = root.performance.now();
        const fps = ((_a = AelluxJs.layoutMaxFPS) == null ? void 0 : _a.call(AelluxJs, element)) || AelluxJs.options.cssMotionPropertyMaxFPS || 55;
        if (now - countdown.last >= 1e3 / fps) {
          countdown.last = now;
          emit(false);
        }
        if (valid()) countdown.frame = root.requestAnimationFrame(tick);
      };
      controller.autoDismissTimeout = setTimeout(() => {
        if (!valid()) {
          if (controller.autoCountdown === countdown) cancelAutoDismiss(controller);
          return;
        }
        if (countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
        countdown.frame = null;
        controller.autoDismissTimeout = null;
        emit(true);
        if (!valid()) return;
        controller.autoCountdown = null;
        dismiss(element);
      }, duration);
      emit(false, true);
      if (valid()) countdown.frame = root.requestAnimationFrame(tick);
    }
    function emitAutoDismissProgress(element, elapsedMs, duration, completed = false) {
      AelluxJs.dispatchFrom(element, "Progress", {
        bubbles: false,
        cancelable: false,
        detail: {
          value: completed ? 1 : duration ? elapsedMs / duration : 0,
          max: 1,
          status: completed ? "completed" : "running",
          elapsedMs,
          durationMs: duration,
          remainingMs: Math.max(0, duration - elapsedMs)
        }
      });
    }
    function cancelAutoDismiss(controller) {
      if (controller.autoDismissTimeout !== null) clearTimeout(controller.autoDismissTimeout);
      const countdown = controller.autoCountdown;
      if (countdown && countdown.frame !== null) root.cancelAnimationFrame(countdown.frame);
      controller.autoDismissTimeout = null;
      controller.autoCountdown = null;
    }
    function clickAutoDismiss(eventTarget, currentExceptions) {
      for (const pContainer of openPresentElements) {
        if (pContainer.hidden === true || currentExceptions.some((e) => pContainer.contains(e))) continue;
        const mode = (pContainer.getAttribute(attr.dismissOnClick) || "outside").trim().toLowerCase();
        if (mode === "false" || mode === "none") continue;
        const inside = pContainer.contains(eventTarget);
        if (inside === (mode === "inside" || mode === "in")) dismiss(pContainer);
      }
    }
    function refreshChangedTrigger(button) {
      if (!triggerElementsSet.has(button)) return;
      const value = button.getAttribute(attr.dismiss) || button.getAttribute(attr.target);
      if (value !== indexedTriggerValues.get(button)) refreshTriggerTargets(button);
    }
    function OnClick(event) {
      var _a, _b;
      const target = activationTarget(event);
      if (!target) return;
      let matched;
      for (const pending of pendingTaps) {
        const pointerId = event.pointerId;
        const compatibilityClick = event.pointerType === "mouse" && ["touch", "pen"].includes((_a = pending.event.detail) == null ? void 0 : _a.pointerType);
        if (!compatibilityClick && typeof pointerId === "number" && typeof ((_b = pending.event.detail) == null ? void 0 : _b.pointerId) === "number" && pointerId !== pending.event.detail.pointerId) continue;
        if (pending.target === target || pending.target.contains(target) || target.contains(pending.target))
          matched = pending;
      }
      if (matched) cancelPendingTap(matched);
      activate(event, target);
    }
    function activationTarget(event) {
      const path = event.composedPath ? event.composedPath() : [];
      const target = path[0] || event.target;
      return (target == null ? void 0 : target.closest) ? target : null;
    }
    function onTap(event) {
      var _a;
      const target = activationTarget(event);
      if (!target) return;
      const control = target.closest(`[${attr.trigger}],[${attr.dismiss}]`);
      if (control) refreshChangedTrigger(control);
      const pending = {
        event,
        target,
        hoverSuppressed: control && suppressHoverClick(control, event),
        present: triggerTargets.get(control),
        point: (_a = AelluxJs.mountManager.controller(target)) == null ? void 0 : _a.point,
        timer: null
      };
      pendingTaps.add(pending);
      pending.timer = setTimeout(() => {
        var _a2;
        pendingTaps.delete(pending);
        if (!target.isConnected || pending.point && ((_a2 = AelluxJs.mountManager.controller(target)) == null ? void 0 : _a2.point) !== pending.point) return;
        activate(event, target, pending.hoverSuppressed);
      }, TAP_CLICK_WAIT_TIME);
    }
    function cancelPendingTap(pending) {
      clearTimeout(pending.timer);
      pendingTaps.delete(pending);
    }
    function cancelElementTaps(element) {
      for (const pending of pendingTaps) {
        if (element.contains(pending.target) || pending.present === element)
          cancelPendingTap(pending);
      }
    }
    function activate(event, eventTarget, hoverSuppressed) {
      const container = eventTarget.closest(presentSelector);
      const exceptions = [];
      var button;
      button = eventTarget.closest(`[${attr.trigger}]`);
      if (button) {
        refreshChangedTrigger(button);
        const triggerAttr = button.getAttribute(attr.trigger);
        const targetSelector = button.getAttribute(attr.target);
        if (targetSelector) {
          const target = targetById(targetSelector);
          diagnoseTarget(button, target, attr.target, targetSelector);
          if (target) {
            exceptions.push(target);
            if (!(hoverSuppressed != null ? hoverSuppressed : suppressHoverClick(button, event))) trigger(target, triggerAttr);
          }
        } else if (container) {
          exceptions.push(container);
          if (!(hoverSuppressed != null ? hoverSuppressed : suppressHoverClick(button, event))) trigger(container, triggerAttr);
        } else {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
            { extension: extensionName, element: button, action: "trigger" }
          );
        }
      }
      button = eventTarget.closest(`[${attr.dismiss}]`);
      if (button) {
        refreshChangedTrigger(button);
        const dismissTargetId = button.getAttribute(attr.dismiss);
        const targetSelector = button.getAttribute(attr.target);
        if (dismissTargetId || targetSelector) {
          const target = targetById(dismissTargetId || targetSelector);
          diagnoseTarget(button, target, dismissTargetId ? attr.dismiss : attr.target, dismissTargetId || targetSelector);
          if (target) {
            exceptions.push(target);
            dismiss(target);
          }
        } else if (container) {
          exceptions.push(container);
          dismiss(container);
        } else {
          AelluxJs.diagnostics.error(
            AelluxJs.diagnostics.ERROR_PRESENT_CONTROL_TARGET_MISSING,
            { extension: extensionName, element: button, action: "dismiss" }
          );
        }
      }
      clickAutoDismiss(eventTarget, exceptions);
    }
    function diagnoseTarget(element, target, attribute, value) {
      if (!targetIdFor(value)) return;
      if (target && target.hasAttribute(attr.present)) return;
      AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_TARGET, {
        extension: extensionName,
        element,
        attribute,
        value,
        reason: target ? "Target is not a Present container." : "Target element was not found.",
        suggestion: "Use one existing Present element ID, optionally prefixed with #, and mount it before interacting."
      });
    }
    function syncAriaExpanded(element, controller) {
      let visible = element.isConnected;
      const visibility = root.getComputedStyle(element).visibility;
      if (visibility === "hidden" || visibility === "collapse") visible = false;
      for (let current = element; visible && current; current = current.parentElement) {
        const style = root.getComputedStyle(current);
        if (style.display === "none" || style.contentVisibility === "hidden" || Number(style.opacity) === 0) visible = false;
      }
      if (controller.expanded !== visible) controller.setAriaExpanded(String(visible));
    }
    function refreshExpandedStates() {
      for (const [element, controller] of presentElements) {
        if (!controller.transition) syncAriaExpanded(element, controller);
      }
    }
    function setProgress(element, visible) {
      setPhase(element, "pop", visible ? "1" : "0");
      setPhase(element, "dismiss", visible ? "0" : "1");
      element.style.setProperty("--ae-pop-progress", visible ? "1" : "0");
      element.style.setProperty("--ae-dismiss-progress", visible ? "0" : "1");
      element.style.setProperty("--ae-unpop-progress", visible ? "0" : "1");
    }
    function setPhase(element, direction, value) {
      element.style.setProperty(`--ae-present-${direction}-phase`, value);
      if (!interpolatedProgress) element.style.setProperty(`--ae-${direction}-progress`, value);
    }
    function groupMembers(group, includeUnidentified = false) {
      return [...presentElements.keys()].filter((element) => element.isConnected && element !== group && (includeUnidentified || element.id) && element.closest(groupSelector) === group);
    }
    function groupLimit(group, state) {
      const value = group.getAttribute(attr.group);
      if (state.limitValue === value) return state.limit;
      state.limitValue = value;
      const text = (value || "").trim();
      const limit = text === "" ? 1 : Number(text);
      const valid = text === "" || /^\d+$/.test(text) && Number.isSafeInteger(limit) && limit > 0;
      state.limit = valid ? limit : 1;
      if (!valid) AelluxJs.diagnostics.warn(AelluxJs.diagnostics.WARN_CONFIGURATION_VALUE, {
        extension: extensionName,
        element: group,
        attribute: attr.group,
        value,
        reason: "Present Group capacity must be a positive integer.",
        suggestion: "Use a positive integer, or leave the attribute empty for a capacity of 1."
      });
      return state.limit;
    }
    function groupMemberActive(member, state) {
      return state.reservations.has(member) || isPresented(member);
    }
    function isPresented(element) {
      const controller = presentElements.get(element);
      return controller && (controller.transition ? controller.direction === POP : controller.state === POP);
    }
    function activeGroupMembers(group, state) {
      return groupMembers(group, true).filter((member) => groupMemberActive(member, state));
    }
    function mountGroup(group) {
      if (groups.has(group)) return;
      const visible = groupMembers(group).filter((member) => {
        var _a;
        return ((_a = presentElements.get(member)) == null ? void 0 : _a.state) === POP;
      });
      groups.set(group, {
        selected: visible.length === 1 ? visible[0] : null,
        accumulating: false,
        reservations: /* @__PURE__ */ new Map(),
        revision: 0,
        pending: Promise.resolve(true),
        jobs: /* @__PURE__ */ new Map(),
        memory: AelluxJs.persist.element.save(group, [attr.active])
      });
      groupLimit(group, groups.get(group));
      if (!groupObserver && typeof root.MutationObserver === "function") {
        groupObserver = new root.MutationObserver((records) => {
          if (records.some((record) => record.type === "childList" || record.attributeName !== "class" || groups.has(record.target))) queueGroups();
        });
        groupObserver.observe(document, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["class", "id", attr.active, attr.when, attr.group]
        });
      }
      queueGroups();
    }
    function unmountGroup(group) {
      const state = groups.get(group);
      if (!state) return;
      state.revision++;
      groups.delete(group);
      state.jobs.clear();
      state.reservations.clear();
      publishGroup(group, state, null);
      for (const member of groupMembers(group)) {
        const controller = presentElements.get(member);
        if (controller.transition) {
          const visible = controller.direction === POP;
          controller.stop();
          member.hidden = !visible && controller.legacyHidden;
          establishState(member, controller, visible ? POP : controller.direction);
          controller.setTriggerExpanded(visible);
          setProgress(member, visible);
          syncAriaExpanded(member, controller);
          if (!visible) openPresentElements.delete(member);
        }
      }
      state.memory.restore();
      if (!groups.size && groupObserver) {
        groupObserver.disconnect();
        groupObserver = null;
      }
    }
    function queueGroups() {
      if (groupsQueued || !groups.size) return;
      groupsQueued = true;
      Promise.resolve().then(() => {
        groupsQueued = false;
        groups.forEach((state, group) => {
          reconcileGroup(group);
          if (groups.get(group) === state) publishGroup(group, state, state.selected);
        });
      });
    }
    function groupDiagnostic(group, reason) {
      AelluxJs.diagnostics.warn(
        AelluxJs.diagnostics.WARN_PRESENT_GROUP_SELECTION,
        {
          extension: extensionName,
          element: group,
          attribute: attr.active,
          value: group.getAttribute(attr.active),
          reason,
          suggestion: "Use unique native IDs on Present members of this group; select one ID or one matching condition."
        }
      );
    }
    function reconcileGroup(group, exclusive = false) {
      if (!group.isConnected || !group.hasAttribute(attr.group)) return;
      const members = groupMembers(group);
      const state = groups.get(group);
      groupLimit(group, state);
      if (state.accumulating) {
        if (!exclusive && state.accumulationInputs === selectionInputs(group)) return;
      }
      if (!members.includes(state.selected)) state.selected = null;
      let matches;
      if (group.hasAttribute(attr.active)) {
        const id = group.getAttribute(attr.active);
        matches = id === "" ? [] : members.filter((member) => member.id === id);
        if (id && matches.length !== 1) {
          groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
          return;
        }
      } else {
        matches = members.filter((member) => {
          const token = member.getAttribute(attr.when);
          return token && !/\s/.test(token) && group.classList.contains(token);
        });
        if (!matches.length) {
          const visible = members.filter(isPresented);
          if (visible.length > 1) groupDiagnostic(group, "Multiple initially visible members.");
          else if (!state.selected) state.selected = visible[0] || null;
          return;
        }
      }
      if (matches.length > 1) {
        groupDiagnostic(group, "Multiple members match the container classes.");
        return;
      }
      return selectGroup(group, matches[0] || null, members);
    }
    function show(group, id) {
      const state = groups.get(group);
      if (!state || typeof id !== "string") return Promise.resolve(false);
      const matches = groupMembers(group).filter((member) => member.id === id);
      if (id && matches.length !== 1) {
        groupDiagnostic(group, "Active ID must match one mounted Present descendant in this group.");
        return Promise.resolve(false);
      }
      if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
      const result = reconcileGroup(group, true);
      return Promise.resolve(result === void 0 ? state.pending : result);
    }
    function selectionInputs(group) {
      return JSON.stringify([group.getAttribute(attr.active), groupMembers(group).filter((member) => {
        const token = member.getAttribute(attr.when);
        return token && !/\s/.test(token) && group.classList.contains(token);
      }).map((member) => member.id).sort()]);
    }
    function popNext(group, prepare) {
      const state = groups.get(group);
      if (!state || !group.isConnected || !group.hasAttribute(attr.group)) return Promise.resolve(null);
      const members = Array.from(group.children).filter((member2) => member2 !== group && member2.hasAttribute(attr.present) && presentElements.has(member2) && member2.closest(groupSelector) === group);
      const limit = groupLimit(group, state);
      const active = activeGroupMembers(group, state);
      const inactive = members.filter((member2) => !groupMemberActive(member2, state));
      const closed = inactive.filter((member2) => {
        var _a;
        return ((_a = presentElements.get(member2)) == null ? void 0 : _a.state) !== POP;
      });
      const available = closed.length ? closed : inactive;
      const candidates = active.length < limit && available.length ? available : members.filter((member2) => active.includes(member2)).sort((left, right) => {
        const order = (member2) => {
          var _a;
          return ((_a = state.reservations.get(member2)) == null ? void 0 : _a.order) || presentElements.get(member2).presentationOrder;
        };
        return order(right) - order(left);
      });
      const member = candidates[candidates.length - 1];
      if (!member) return Promise.resolve(null);
      const entering = !state.accumulating;
      if (entering) {
        state.revision++;
        state.jobs.clear();
        state.accumulating = true;
        state.accumulationInputs = selectionInputs(group);
        state.selected = null;
      }
      const controller = presentElements.get(member);
      const revision = state.revision;
      const capacity = group.getAttribute(attr.group);
      const inputs = selectionInputs(group);
      const previousReservation = state.reservations.get(member);
      const reservation = { revision: controller.operationRevision, order: ++presentationSequence };
      state.reservations.set(member, reservation);
      group.insertBefore(member, members[0]);
      const valid = (preflight = false) => groups.get(group) === state && state.revision === revision && state.accumulating && state.reservations.get(member) === reservation && presentElements.get(member) === controller && controller.operationRevision === reservation.revision && (!preflight || group.getAttribute(attr.group) === capacity && selectionInputs(group) === inputs) && member.isConnected && member.parentElement === group && member.closest(groupSelector) === group;
      const release = (restore = false) => {
        if (state.reservations.get(member) !== reservation) return;
        if (restore && previousReservation && groups.get(group) === state && state.revision === revision && state.accumulating && presentElements.get(member) === controller && previousReservation.revision === controller.operationRevision && member.isConnected && member.closest(groupSelector) === group) {
          state.reservations.set(member, previousReservation);
        } else state.reservations.delete(member);
      };
      let job;
      try {
        if (entering) publishGroup(group, state, null);
        if (!valid(true)) {
          release(true);
          return Promise.resolve(null);
        }
        if (typeof prepare === "function") prepare(member);
        if (!valid(true) || !AelluxJs.dispatchFrom(member, "BeforePop", { bubbles: true, cancelable: true }) || !valid(true)) {
          release(true);
          return Promise.resolve(null);
        }
        reservation.revision++;
        job = presentTransition(member, true, true, true, reservation.order);
      } catch (error) {
        release(true);
        return Promise.reject(error);
      }
      return job.then(() => valid() && !member.hidden && presentElements.get(member).direction === POP ? member : null).finally(() => release());
    }
    function selected(group) {
      const state = groups.get(group);
      const member = state && state.selected;
      return member && member !== group && presentElements.has(member) && member.isConnected && member.id && member.closest(groupSelector) === group ? member : null;
    }
    function publishGroup(group, state, current) {
      if (state.announced === current) return;
      const previous = state.announced || null;
      state.announced = current;
      AelluxJs.dispatchFrom(group, "PresentGroupChange", {
        bubbles: true,
        detail: { group, previous, current, key: current && current.id }
      });
    }
    function selectGroup(group, selected2, members, closingDirection = DISMISS) {
      var _a;
      const state = groups.get(group);
      const changes = members.filter((member) => member === selected2 ? !isPresented(member) : isPresented(member));
      if (state.selected === selected2 && !changes.length) {
        state.accumulating = false;
        state.reservations.clear();
        return state.pending;
      }
      const revision = ++state.revision;
      const active = group.getAttribute(attr.active);
      const classes = group.getAttribute("class");
      const ids = members.map((member) => member.id);
      const conditions = members.map((member) => member.getAttribute(attr.when));
      const valid = () => groups.get(group) === state && state.revision === revision && group.isConnected && group.hasAttribute(attr.group) && group.getAttribute(attr.active) === active && group.getAttribute("class") === classes && groupMembers(group).length === members.length && members.every((member, index) => presentElements.has(member) && member.isConnected && member.closest(groupSelector) === group && member.id === ids[index] && member.getAttribute(attr.when) === conditions[index]);
      for (const member of changes) {
        const allowed = AelluxJs.dispatchFrom(
          member,
          member === selected2 ? "BeforePop" : `${BEFORE}${closingDirection}`,
          { bubbles: true, cancelable: true }
        );
        if (!valid()) {
          queueGroups();
          return false;
        }
        if (!allowed) {
          if (state.accumulating) {
            state.accumulationInputs = selectionInputs(group);
            return false;
          }
          if (state.revision === revision) {
            const id = ((_a = state.selected) == null ? void 0 : _a.id) || "";
            if (group.getAttribute(attr.active) !== id) group.setAttribute(attr.active, id);
          }
          return false;
        }
      }
      state.accumulating = false;
      state.reservations.clear();
      state.selected = selected2;
      let complete;
      const pending = new Promise((resolve) => {
        complete = resolve;
      });
      state.pending = pending;
      for (const member of changes) {
        const job = presentTransition(member, member === selected2, false, true, void 0, closingDirection);
        if (groups.get(group) !== state || state.revision !== revision) {
          complete(false);
          return pending;
        }
        state.jobs.set(member, job);
        job.then(() => {
          if (state.jobs.get(member) === job) state.jobs.delete(member);
        });
      }
      publishGroup(group, state, selected2);
      Promise.all(members.map((member) => state.jobs.get(member))).then(() => {
        const current = groupMembers(group);
        complete(groups.get(group) === state && state.revision === revision && (!selected2 || current.includes(selected2)) && current.every((member) => {
          var _a2, _b;
          return member === selected2 ? ((_a2 = presentElements.get(member)) == null ? void 0 : _a2.state) === POP : ((_b = presentElements.get(member)) == null ? void 0 : _b.state) !== POP;
        }));
      });
      return pending;
    }
    function cancelHoverClose(target) {
      clearTimeout(hoverTimers.get(target));
      hoverTimers.delete(target);
    }
    function inHoverRegion(target, node) {
      if (!node || !node.nodeType) return false;
      if (target.contains(node)) return true;
      for (const button of triggerElementsSet) {
        if (button.getAttribute(attr.triggerOn) === "hover" && triggerTargets.get(button) === target && button.contains(node)) return true;
      }
      return false;
    }
    function suppressHoverClick(button, event) {
      var _a;
      const pointerType = event.pointerType || ((_a = event.detail) == null ? void 0 : _a.pointerType);
      const pointerActivation = typeof event.detail === "number" ? event.detail > 0 : !!pointerType;
      return button.getAttribute(attr.triggerOn) === "hover" && pointerActivation && pointerType !== "touch" && hoveredTriggers.has(button);
    }
    function onHover(event) {
      var _a;
      if (event.pointerType === "touch" || !((_a = event.target) == null ? void 0 : _a.closest)) return;
      const entering = event.type === "pointerover";
      const button = event.target.closest(`[${attr.trigger}][${attr.triggerOn}="hover"]`);
      if (button && triggerElementsSet.has(button) && !button.contains(event.relatedTarget)) {
        refreshChangedTrigger(button);
        const target = triggerTargets.get(button);
        if (target && presentElements.has(target)) {
          if (entering) {
            cancelHoverClose(target);
            hoveredTriggers.add(button);
            const action = button.getAttribute(attr.trigger);
            if (action === "pop") toggle(target, true);
            else trigger(target, action);
          } else hoveredTriggers.delete(button);
        }
      }
      for (const target of openPresentElements) {
        if (!inHoverRegion(target, event.target)) continue;
        if (entering || inHoverRegion(target, event.relatedTarget)) cancelHoverClose(target);
        else if ([...triggerElementsSet].some((control) => triggerTargets.get(control) === target && control.getAttribute(attr.triggerOn) === "hover" && !["dismiss", "unpop"].includes(control.getAttribute(attr.trigger)))) {
          cancelHoverClose(target);
          hoverTimers.set(target, setTimeout(() => {
            hoverTimers.delete(target);
            if (presentElements.has(target) && target.isConnected && !inHoverRegion(target, document.activeElement)) dismiss(target);
          }, 120));
        }
      }
    }
    function getString2Time(string) {
      return string ? parseFloat(string) * getMillisecondsMulti(string) : 0;
    }
    function getMillisecondsMulti(value) {
      return !value.endsWith(MILLISECOND) && value.endsWith(SECOND) ? 1e3 : 1;
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);
})();
//# sourceMappingURL=aellux.ext.present.js.map
