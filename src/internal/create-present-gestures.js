/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

const directions = { up: ["y", -1], down: ["y", 1], left: ["x", -1], right: ["x", 1] };
const clamp = value => Math.max(0, Math.min(1, value));

// Input recognition only. Present owns the transition, timeline and lifecycle.
export function createPresentGestures(root, api, services) {
  const entries = new Map(), sources = new Map();
  let interaction = null, suppressed = null, suppressTimer = null;
  const attribute = name => api.attr(`present-gesture${name ? `-${name}` : ""}`);
  // Keep native controls and scrollbar thumbs out; scrollable regions are
  // arbitrated by direction and remaining travel after pointer intent.
  const inputExceptions = "a:not([draggable='false']),button:not([draggable='false'])," +
    "input,textarea,select,[contenteditable],[draggable='true']," +
    `[${api.attr("scrollbar-vertical")}],[${api.attr("scrollbar-horizontal")}]`;
  const warn = (element, name, value, reason) => api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE,
    { extension: "present", element, attribute: name, value, reason });
  const state = element => services.state(element);

  function update(element) {
    if (!element.hasAttribute(attribute(""))) { remove(element); return; }
    const signature = ["", "source", "unpop", "dismiss"].map(name => element.getAttribute(attribute(name))).join("|");
    const direction = element.getAttribute(attribute(""));
    if (!directions[direction]) {
      remove(element); warn(element, attribute(""), direction, "Use up, down, left or right."); return;
    }
    const value = element.getAttribute(attribute("source"));
    const id = value?.replace(/^#/, "");
    const source = value === "document" ? root.document : value
      ? (!/[\s#]/.test(id) && root.document.getElementById(id)) : element;
    if (source?.matches?.("a,button") && source.getAttribute("draggable") !== "false") {
      api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_VALUE, { extension: "present", element: source,
        attribute: "draggable", value: source.getAttribute("draggable"),
        reason: "An interactive Present gesture source requires draggable=false; applying it automatically.",
        suggestion: 'Declare draggable="false" on the gesture source.' });
      source.setAttribute("draggable", "false");
    }
    if (entries.get(element)?.signature === signature && entries.get(element)?.source === source) return;
    remove(element);
    if (!source) {
      api.diagnostics.warn(api.diagnostics.WARN_CONFIGURATION_TARGET, { extension: "present", element,
        attribute: attribute("source"), value, reason: "Gesture source ID was not found." }); return;
    }
    let dismiss = element.getAttribute(attribute("dismiss"));
    if (dismiss && (!directions[dismiss] || directions[dismiss][0] === directions[direction][0])) {
      warn(element, attribute("dismiss"), dismiss, "Dismiss must use a direction on the other axis."); dismiss = null;
    }
    const unpop = element.getAttribute(attribute("unpop"));
    if (unpop !== null && !["", "true", "false"].includes(unpop))
      warn(element, attribute("unpop"), unpop, "Use true or false; invalid values enable gesture Unpop.");
    const entry = { element, source, direction, dismiss, unpop: unpop !== "false", signature };
    entries.set(element, entry);
    for (const target of new Set([source, element])) {
      if (!sources.has(target)) { sources.set(target, new Set()); target.addEventListener("pointerdown", down, true); }
      sources.get(target).add(entry);
    }
    inspect(element);
  }

  function inspect(element) {
    if (entries.get(element)?.source === element && root.getComputedStyle(element).display === "none")
      api.diagnostics.info(api.diagnostics.INFO_PRESENT_GESTURE_HIDDEN, { extension: "present", element });
  }

  function remove(element) {
    const entry = entries.get(element);
    if (!entry) return;
    if (interaction?.owner?.entry === entry || interaction?.candidates.some(candidate => candidate.entry === entry)) cancel();
    entries.delete(element);
    for (const target of new Set([entry.source, element])) {
      const set = sources.get(target);
      set.delete(entry);
      if (!set.size) { target.removeEventListener("pointerdown", down, true); sources.delete(target); }
    }
  }

  function down(event) {
    if (interaction && interaction.id !== event.pointerId) { cancel(); return; }
    if (event.button !== 0 || event.isPrimary === false || event.defaultPrevented) return;
    const target = event.target;
    if (!target.closest || target.closest(inputExceptions)) return;
    if (!interaction) {
      interaction = { id: event.pointerId, x: event.clientX, y: event.clientY, candidates: [], owner: null, target };
      for (const name of ["pointermove", "pointerup", "pointercancel", "lostpointercapture"])
        root.addEventListener(name, move, { capture: true, passive: false });
    }
    for (const entry of sources.get(event.currentTarget) || []) {
      if (interaction.candidates.some(candidate => candidate.entry === entry)) continue;
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
      const property = `--ae-present-${name}-threshold`, raw = style.getPropertyValue(property).trim();
      const value = raw === "" ? .5 : Number(raw);
      thresholds[name] = Number.isFinite(value) && value >= 0 && value <= 1 ? value : .5;
      if (thresholds[name] !== value) warn(element, property, raw, "Use a number between 0 and 1; using 0.5.");
    }
    const property = "--ae-present-gesture-distance", raw = style.getPropertyValue(property).trim();
    let distance = 0;
    if (raw && raw !== "auto") {
      // Let CSS resolve relative lengths, viewport units and calc(). The probe
      // is measured once per gesture, never from pointermove after ownership.
      const probe = root.document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;padding:0;border:0;min-width:0;max-width:none;height:0;";
      probe.style.fontSize = style.fontSize;
      probe.style.width = raw;
      if (probe.style.width && !raw.includes("%")) {
        element.appendChild(probe); distance = parseFloat(root.getComputedStyle(probe).width); probe.remove();
      }
      if (!(distance > 0)) warn(element, property, raw, "Use a positive CSS length or auto; using auto.");
    }
    return { ...thresholds, distance: distance > 0 ? distance : 0,
      fallback: Math.max(1, axis === "x" ? element.offsetWidth : element.offsetHeight) };
  }

  function move(event) {
    const current = interaction;
    if (!current || current.id !== event.pointerId) return;
    if (event.type !== "pointermove") { release(event.type !== "pointerup"); return; }
    const x = event.clientX - current.x, y = event.clientY - current.y;
    if (!current.owner) {
      if (Math.max(Math.abs(x), Math.abs(y)) < 8) return;
      const axis = Math.abs(x) > Math.abs(y) * 1.2 ? "x" : Math.abs(y) > Math.abs(x) * 1.2 ? "y" : null;
      if (!axis) return;
      const delta = axis === "x" ? x : y;
      const candidates = current.candidates.filter(candidate => {
        const { entry, origin } = candidate;
        if (!entry.element.isConnected || state(entry.element) !== origin || services.busy(entry.element)) return false;
        const main = directions[entry.direction], dismiss = directions[entry.dismiss];
        candidate.dismiss = origin === "Pop" && dismiss?.[0] === axis && delta * dismiss[1] > 0;
        candidate.sign = candidate.dismiss ? dismiss[1] : main[1];
        return candidate.dismiss || (main[0] === axis && (origin === "Pop" ? entry.unpop && delta * main[1] < 0 : delta * main[1] > 0));
      });
      // Most specific interactive region first; visual presentation order breaks
      // ties for global/shared sources. One pointer has exactly one owner.
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
      if (!candidate) { clear(); return; }
      if (nativeScroll(current.target, candidate.entry.element, axis, delta)) {
        // Let the scroll container consume this movement, but keep watching.
        // If it reaches an edge, start Present from the remaining drag only.
        current.x = event.clientX;
        current.y = event.clientY;
        return;
      }
      if (!root.KeyframeEffect?.prototype.setKeyframes || !candidate.entry.element.getAnimations) {
        warn(candidate.entry.element, attribute(""), candidate.entry.direction, "Interactive Present requires inspectable Web Animations transitions."); clear(); return;
      }
      const params = parameters(candidate.entry.element, axis);
      let resolve;
      const settled = new Promise(done => { resolve = done; });
      const owner = current.owner = { ...candidate, params, axis, displacement: 0, progress: candidate.dismiss ? 0 : candidate.origin === "Pop" ? 1 : 0,
        handle: null, released: null, settled,
        attach(handle, autoDistance) {
          this.handle = handle;
          if (!params.distance) params.distance = autoDistance || Math.max(1, axis === "x" ? this.entry.element.offsetWidth : this.entry.element.offsetHeight);
          this.progress = clamp(this.start + this.displacement / params.distance);
          this.seek();
          if (this.released !== null) this.finish(this.released);
        },
        seek() { this.handle?.seek(this.progress); },
        finish(cancelled) {
          this.released = cancelled;
          if (!this.handle) return;
          const target = cancelled ? this.dismiss ? 0 : this.origin === "Pop" ? 1 : 0
            : this.dismiss ? +(this.progress >= params.dismiss)
            : this.origin === "Pop" ? +(this.progress > params.unpop) : +(this.progress >= params.pop);
          const destination = this.dismiss ? target ? "Dismiss" : this.origin : target ? "Pop" : this.origin === "Dismiss" ? "Dismiss" : "Unpop";
          this.handle.playTo(target).then(() => resolve(destination), () => resolve(null));
        },
        abort() { resolve(null); if (interaction?.owner === this) clear(); }
      };
      owner.start = owner.progress;
      services.begin(candidate.entry.element, candidate.dismiss ? "Dismiss" : candidate.origin === "Pop" ? "Unpop" : "Pop", owner);
      if (interaction !== current) return;
      // Capture starts only after intent. Failure/veto keeps native input free.
      try { current.target.setPointerCapture(event.pointerId); current.captured = true; } catch (_) { /* document routing remains available */ }
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
    const owner = interaction?.owner;
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
    event.preventDefault(); event.stopImmediatePropagation(); clearClick();
  }
  function clearClick() {
    clearTimeout(suppressTimer); suppressTimer = null; suppressed = null;
    root.document.removeEventListener("click", click, true);
  }
  function clear() {
    const previous = interaction; interaction = null;
    for (const name of ["pointermove", "pointerup", "pointercancel", "lostpointercapture"])
      root.removeEventListener(name, move, true);
    if (previous?.captured) try { previous.target.releasePointerCapture(previous.id); } catch (_) { /* detached target */ }
  }
  function cancel() { release(true); }
  return { update, remove, inspect, destroy() { cancel(); for (const element of [...entries.keys()]) remove(element); clearClick(); } };
}
