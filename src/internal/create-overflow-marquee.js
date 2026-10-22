/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// The dedicated Extension owns wrapping and motion; Anchor supplies geometry.
export function createOverflowMarquee(root, api, anchor) {
  const attribute = api.attr("overflow-marquee");
  const contentAttribute = api.attr("overflow-marquee-content");
  const activeAttribute = api.attr("overflow-marquee-active");
  const reducedAttribute = api.attr("reduced-motion");
  const selector = `[${attribute}]`;
  const states = new Map();
  const desktop = root.matchMedia?.("(any-hover: hover) and (any-pointer: fine)");
  let observer = null;

  const css = `
    :where(${selector}:not([hidden])) {display:block}
    :where(${selector}) {position:relative;min-width:0;overflow:hidden;overflow:clip;text-overflow:ellipsis;white-space:nowrap!important}
    :where([${contentAttribute}]) {display:block;position:relative;width:auto;max-width:none;contain:none;visibility:inherit;opacity:1;pointer-events:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap!important;transform:none;transition:none}
    :where([${activeAttribute}]>[${contentAttribute}]) {width:max-content;overflow:visible;transform:translate3d(var(--ae-anchor-x,0px),0,0)}
    :where(html[${reducedAttribute}="reduced"] ${selector}>[${contentAttribute}]) {width:auto;overflow:hidden;text-overflow:ellipsis;transform:none!important;transition:none!important}
  `;
  return { selector, css, mount, unmount, update, destroy };

  function listenMedia(add) {
    if (desktop?.addEventListener) desktop[add ? "addEventListener" : "removeEventListener"]("change", refreshAll);
    else if (desktop?.addListener) desktop[add ? "addListener" : "removeListener"](refreshAll);
  }

  function refreshAll() { for (const element of states.keys()) schedule(element); }

  function motionChanged(event) {
    for (const [element, state] of states) {
      if (event.target !== state.wrapper && (event.target.contains(element) || element.contains(event.target))) schedule(element);
    }
  }

  function visible(state) {
    if (!state.element.isConnected || root.document.hidden || state.intersecting === false ||
      anchor.invisible(state.wrapper.isConnected ? state.wrapper : state.element)) return false;
    const bounds = state.element.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0 && bounds.right > 0 && bounds.bottom > 0 &&
      bounds.left < root.innerWidth && bounds.top < root.innerHeight;
  }

  function interacting(state) {
    return state.element.contains(root.document.activeElement) ||
      !!(desktop?.matches && state.element.matches(":hover"));
  }

  function canRun(state) { return visible(state) && !interacting(state); }

  async function mount(element) {
    if (states.has(element)) return;
    const wrapper = root.document.createElement("span");
    wrapper.setAttribute(contentAttribute, "top-left:top-left");
    const state = { element, wrapper, revision: 0, signature: null, pending: null, dirty: false,
      timer: null, motionId: api.motion.id(), layoutId: api.motion.id(), cycleId: api.motion.id(), ownedTitle: null,
      paused: true, intersecting: root.IntersectionObserver ? false : null, phase: "wait", x: 0,
      memory: api.persist.element.save(element, [activeAttribute]), resize: null, intersection: null };
    states.set(element, state);
    state.onInteraction = () => schedule(element);
    for (const name of ["mouseenter", "mouseleave", "focusin", "focusout"])
      element.addEventListener(name, state.onInteraction);
    reconcile(state);
    if (states.size === 1) {
      if (root.MutationObserver) {
        observer = new root.MutationObserver(records => {
          for (const [host, value] of states) {
            if (records.some(record => {
              const node = record.target;
              if (node === value.wrapper && record.type === "attributes") return false;
              if (record.type === "attributes" && node === host && record.attributeName === activeAttribute) return false;
              return node === root.document.documentElement || host.contains(node) || node.contains(host);
            })) schedule(host);
          }
        });
        observer.observe(root.document, { subtree: true, childList: true, characterData: true, attributes: true,
          attributeFilter: [attribute, reducedAttribute, "class", "style", "hidden", "dir"] });
      }
      root.document.addEventListener("visibilitychange", refreshAll);
      for (const name of ["transitionend", "transitioncancel", "animationstart", "animationend", "animationcancel"])
        root.document.addEventListener(name, motionChanged, true);
      root.addEventListener("resize", refreshAll);
      root.addEventListener("scroll", refreshAll, { capture: true, passive: true });
      root.document.fonts?.addEventListener?.("loadingdone", refreshAll);
      listenMedia(true);
    }
    if (root.ResizeObserver) {
      state.resize = new root.ResizeObserver(() => schedule(element));
      state.resize.observe(element);
      state.resize.observe(wrapper);
    }
    if (root.IntersectionObserver) {
      state.intersection = new root.IntersectionObserver(entries => {
        const entry = entries[entries.length - 1];
        state.intersecting = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
        schedule(element);
      });
      state.intersection.observe(element);
    }
    await anchor.mount(wrapper);
    await update(element);
  }

  function reconcile(state) {
    const { element, wrapper } = state;
    if (wrapper.parentNode !== element) wrapper.textContent = "";
    if (wrapper.parentNode === element && element.childNodes.length === 1) return;
    const contents = root.document.createDocumentFragment();
    for (const node of Array.from(element.childNodes)) {
      if (node === wrapper) while (wrapper.firstChild) contents.appendChild(wrapper.firstChild);
      else contents.appendChild(node);
    }
    wrapper.appendChild(contents);
    element.appendChild(wrapper);
  }

  function schedule(element) {
    const state = states.get(element);
    if (!state) return;
    rememberProgress(state);
    // Suspend synchronously, including when the layout scheduler itself is
    // waiting for the document to become visible. No idle animation polling.
    if (!visible(state)) { pause(state); return; }
    if (interacting(state)) pause(state);
    update(element).catch(cause => api.diagnostics.error(api.diagnostics.ERROR_EXTENSION_MOUNT,
      { extension: "overflow-marquee", element, method: "update", cause }));
  }

  function update(element) {
    const state = states.get(element);
    if (!state) return Promise.resolve();
    if (state.pending) { state.dirty = true; return state.pending; }
    state.pending = refresh(state).finally(() => {
      state.pending = null;
      if (state.dirty && states.get(element) === state) { state.dirty = false; schedule(element); }
    });
    return state.pending;
  }

  async function refresh(state) {
    const { element, wrapper, layoutId } = state;
    const alive = () => states.get(element) === state;
    rememberProgress(state);
    if (!visible(state)) { pause(state); return; }
    if (interacting(state)) pause(state);
    await api.waitLayout.update(layoutId, () => { if (alive()) reconcile(state); });
    if (!alive()) return;
    const measured = await api.waitLayout.read(layoutId, () => {
      const style = root.getComputedStyle(element);
      const padding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
      const width = element.clientWidth - padding;
      const content = wrapper.scrollWidth;
      const overflow = content > width + 1;
      const reduced = api.currentPreference("reduced-motion") === "reduced";
      const rawSpeed = Number(style.getPropertyValue("--ae-overflow-marquee-speed").trim());
      const rawDelay = style.getPropertyValue("--ae-overflow-marquee-delay").trim();
      const delayValue = /^(?:\d+(?:\.\d+)?|\.\d+)(ms|s)$/.exec(rawDelay);
      return { width, content, overflow, active: overflow && !reduced,
        speed: Number.isFinite(rawSpeed) && rawSpeed > 0 ? rawSpeed : 30,
        delay: delayValue ? parseFloat(rawDelay) * (delayValue[1] === "s" ? 1000 : 1) : 1200,
        direction: style.direction, text: wrapper.textContent.replace(/\s+/g, " ").trim() };
    });
    if (!alive() || !measured) return;
    const signature = JSON.stringify(measured);
    await api.waitLayout.update(layoutId, () => {
      if (!alive()) return;
      tooltip(state, measured.overflow && desktop?.matches ? measured.text : null);
      if (signature === state.signature) return;
      stop(state);
      state.signature = signature;
      state.measured = measured;
      state.placements = null;
      state.phase = "wait";
      state.remaining = measured.delay;
      state.x = 0;
      wrapper.style.transition = "none";
      wrapper.setAttribute(contentAttribute, "top-left:top-left");
      wrapper.style.setProperty("--ae-anchor-x", "0px");
      element.toggleAttribute ? element.toggleAttribute(activeAttribute, measured.active) :
        measured.active ? element.setAttribute(activeAttribute, "") : element.removeAttribute(activeAttribute);
    });
    if (!alive() || signature !== state.signature || !measured.active || state.timer !== null || state.running) return;
    if (!canRun(state)) { pause(state); return; }
    const revision = state.revision;
    const placements = state.placements || await api.waitLayout.read(layoutId, () => {
      const start = anchor.measure(wrapper, false);
      const end = anchor.measure(wrapper, true);
      if (!start?.valid || !end?.valid) return null;
      const style = root.getComputedStyle(element);
      const inset = ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"]
        .reduce((sum, property) => sum + (parseFloat(style[property]) || 0), 0);
      const distance = Math.max(0, start.selected.x - end.selected.x + inset);
      const rtl = measured.direction === "rtl";
      const placement = (base, x) => ({ ...base, selected: { ...base.selected, x, y: 0 } });
      return { start: placement(rtl ? end : start, 0), end: placement(rtl ? start : end, rtl ? distance : -distance), distance };
    });
    if (!alive() || revision !== state.revision || !placements) return;
    await api.waitLayout.update(layoutId, () => {
      if (!alive() || revision !== state.revision) return;
      state.placements = placements;
      if (!canRun(state)) { pause(state); return; }
      state.paused = false;
      anchor.place(wrapper, at(state, state.x));
      if (state.phase === "travel") cycle(state);
      else wait(state);
    });
  }

  function at(state, x) {
    const base = state.placements.start;
    return { ...base, selected: { ...base.selected, x } };
  }

  function wait(state) {
    const revision = state.revision;
    state.deadline = now() + state.remaining;
    state.timer = root.setTimeout(() => {
      if (revision === state.revision && states.get(state.element) === state) cycle(state);
    }, state.remaining);
  }

  function now() { return root.performance.now(); }

  function rememberProgress(state) {
    if (!state.running || state.started === undefined) return;
    // Read the owned effect's time, not layout, on the shared controller's
    // existing frames. Retain the last sample if display:none cancels CSS.
    const time = state.animation?.currentTime;
    if (time != null) state.elapsed = Number(time);
    else if (!state.controlled) state.elapsed = now() - state.started;
    const progress = state.duration > 0 ? Math.min(1, (state.elapsed || 0) / state.duration) : 1;
    state.x = state.from + (state.placements.end.selected.x - state.from) * progress;
  }

  function pause(state) {
    if (state.paused) return;
    rememberProgress(state);
    if (state.timer !== null) state.remaining = Math.max(0, state.deadline - now());
    stop(state);
    state.paused = true;
    state.wrapper.style.transition = "none";
    if (state.placements) anchor.place(state.wrapper, at(state, state.x));
  }

  function tooltip(state, text) {
    const element = state.element;
    if (state.ownedTitle !== null && element.getAttribute("title") !== state.ownedTitle) state.ownedTitle = null;
    if (!text) {
      if (state.ownedTitle !== null) element.removeAttribute("title");
      state.ownedTitle = null;
    } else if (state.ownedTitle !== null || !element.hasAttribute("title")) {
      if (element.getAttribute("title") !== text) element.setAttribute("title", text);
      state.ownedTitle = text;
    }
  }

  async function cycle(state) {
    const { measured, placements } = state;
    const revision = state.revision;
    const current = () => states.get(state.element) === state && revision === state.revision;
    state.timer = null;
    if (!current()) return;
    state.remaining = 0;
    if (!canRun(state)) { pause(state); return; }
    state.running = true;
    state.started = undefined;
    try {
      if (state.phase === "end") {
        await api.waitLayout.update(state.cycleId, () => {
          if (!current()) return;
          // After the end hold, jump back without a return transition.
          state.wrapper.style.transition = "none";
          state.wrapper.setAttribute(contentAttribute, "top-left:top-left");
          state.x = 0;
          anchor.place(state.wrapper, placements.start);
          state.phase = "wait";
          state.running = false;
          state.remaining = measured.delay;
          if (canRun(state)) wait(state);
          else pause(state);
        });
        return;
      }
      state.phase = "travel";
      const duration = Math.abs(placements.end.selected.x - state.x) / measured.speed * 1000;
      await api.waitLayout.read(state.cycleId, () => root.getComputedStyle(state.wrapper).transform);
      if (!current()) return;
      if (!canRun(state)) { pause(state); return; }
      state.from = state.x;
      state.duration = duration;
      state.elapsed = 0;
      state.animation = null;
      state.controlled = api.motion.supported(state.wrapper);
      state.started = now();
      const completion = api.motion.run(state.wrapper, { id: state.motionId, nativeDuration: duration,
        maxFPS: api.layoutMaxFPS(state.element), abort() { rememberProgress(state); return !current(); }, apply() {
          state.wrapper.style.transition = `transform ${duration}ms linear`;
          state.wrapper.setAttribute(contentAttribute, "bottom-right:bottom-right");
          anchor.place(state.wrapper, placements.end);
        } });
      await api.waitLayout.read(state.cycleId, () => {
        if (current()) state.animation = state.wrapper.getAnimations?.().find(animation => animation.transitionProperty === "transform") || null;
      });
      const result = await completion;
      if (!current() || result.status !== "completed") return;
      await api.waitLayout.update(state.cycleId, () => {
        if (!current()) return;
        state.wrapper.style.transition = "none";
        anchor.place(state.wrapper, placements.end);
        state.running = false;
        state.x = placements.end.selected.x;
        state.animation = null;
        state.phase = "end";
        state.remaining = measured.delay;
        if (canRun(state)) wait(state);
        else pause(state);
      });
    } catch (cause) {
      if (current()) api.diagnostics.error(api.diagnostics.ERROR_EXTENSION_TRANSITION,
        { extension: "overflow-marquee", element: state.element, cause });
    } finally { if (current()) state.running = false; }
  }

  function stop(state) {
    state.revision++;
    if (state.timer !== null) root.clearTimeout(state.timer);
    state.timer = null;
    state.running = false;
    api.motion.cancel(state.motionId);
    api.waitLayout.cancel(state.cycleId);
    state.animation = null;
  }

  async function unmount(element) {
    const state = states.get(element);
    if (!state) return;
    states.delete(element);
    stop(state);
    api.waitLayout.cancel(state.layoutId);
    state.resize?.disconnect();
    state.intersection?.disconnect();
    for (const name of ["mouseenter", "mouseleave", "focusin", "focusout"])
      element.removeEventListener(name, state.onInteraction);
    await anchor.unmount(state.wrapper);
    if (state.wrapper.parentNode === element) {
      while (state.wrapper.firstChild) element.insertBefore(state.wrapper.firstChild, state.wrapper);
      state.wrapper.remove();
    }
    tooltip(state, null);
    state.memory.restore();
    if (!states.size) {
      observer?.disconnect(); observer = null;
      root.document.removeEventListener("visibilitychange", refreshAll);
      for (const name of ["transitionend", "transitioncancel", "animationstart", "animationend", "animationcancel"])
        root.document.removeEventListener(name, motionChanged, true);
      root.removeEventListener("resize", refreshAll);
      root.removeEventListener("scroll", refreshAll, true);
      root.document.fonts?.removeEventListener?.("loadingdone", refreshAll);
      listenMedia(false);
    }
  }

  async function destroy() { for (const element of Array.from(states.keys())) await unmount(element); }
}
