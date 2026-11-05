import { expect, test } from "@playwright/test";

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`dismiss contract replaces beta names (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<button id="trigger" data-ae-trigger="dismiss" data-ae-target="#panel">Close</button>
      <button id="explicit" data-ae-dismiss="panel">Close by ID</button>
      <div id="panel" data-ae-present="" data-ae-dismiss-on-click="none" hidden>
        <button id="nested" data-ae-dismiss>Close ancestor</button></div>`, { mode, forceLegacy });
    const api = await page.evaluate(() => ({
      publicDismiss: typeof $ae.ext.present.dismiss, mountedDismiss: typeof $ae("panel").present.dismiss,
      publicUnpop: typeof $ae.ext.present.unpop, mountedUnpop: typeof $ae("panel").present.unpop
    }));
    expect(api).toEqual({ publicDismiss: "function", mountedDismiss: "function", publicUnpop: "function", mountedUnpop: "function" });
    for (const id of ["trigger", "explicit", "nested"]) {
      await page.evaluate(() => $ae.ext.present.pop(document.getElementById("panel")));
      await page.locator(`#${id}`).click();
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
    }
    const result = await page.evaluate(async () => {
      const panel = document.getElementById("panel");
      await $ae(panel).present.pop();
      const events = [];
      for (const name of ["BeforeDismiss", "Layout", "Dismissing", "Dismiss", "BeforeUnpop", "Unpopping", "Unpop"])
        panel.addEventListener(AelluxJs.eventName(name), event => events.push({ name, bubbles: event.bubbles,
          cancelable: event.cancelable, origin: event.detail?.origin, durationMs: event.detail?.durationMs }));
      await $ae(panel).present.toggle(false);
      await $ae.ext.present.dismiss(panel);
      return { events, progress: ["--ae-pop-progress", "--ae-dismiss-progress"].map(name => getComputedStyle(panel).getPropertyValue(name).trim()),
        oldProgress: getComputedStyle(panel).getPropertyValue("--ae-unpop-progress"), classes: [...panel.classList] };
    });
    expect(result.events.map(event => event.name)).toEqual(["BeforeDismiss", "Layout", "Dismissing", "Dismiss"]);
    expect(result.events.map(event => event.cancelable)).toEqual([true, false, false, false]);
    expect(result.events.every(event => event.bubbles)).toBe(true);
    expect(result.events[1]).toMatchObject({ origin: "present.dismiss", durationMs: 0 });
    expect(result.progress).toEqual(["0", "1"]);
    expect(result.oldProgress).toBe("1");
    expect(result.classes).not.toContain("ae--unpopping");
    expect(result.classes).not.toContain("ae--dismissing");
  });

  test(`only renamed automatic dismissal attributes are active (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<button id="outside">Outside</button><div id="panel" data-ae-present=""
      data-ae-auto-unpop="0ms" data-ae-unpop-on-click="inside" data-ae-unpop-on-outside="false" hidden>
      <button id="inside">Inside</button></div>`, { mode, forceLegacy });
    await page.evaluate(() => $ae("panel").present.pop());
    await page.waitForTimeout(100);
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
    await page.locator("#inside").click();
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
    await page.locator("#outside").click();
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
    await page.evaluate(async () => {
      await $ae("panel").present.pop();
      const panel = document.getElementById("panel");
      panel.setAttribute("data-ae-dismiss-on-click", "none");
      window.countdown = [];
      panel.addEventListener("AelluxJsProgress", event => countdown.push({ bubbles: event.bubbles,
        cancelable: event.cancelable, ...event.detail }));
      panel.setAttribute("data-ae-auto-dismiss", "80ms");
    });
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
    const countdown = await page.evaluate(() => window.countdown);
    expect(countdown[0]).toMatchObject({ value: 0, max: 1, elapsedMs: 0, durationMs: 80, remainingMs: 80, bubbles: false, cancelable: false });
    expect(countdown.at(-1)).toMatchObject({ value: 1, max: 1, status: "completed", elapsedMs: 80, durationMs: 80, remainingMs: 0 });
    expect(countdown.every((sample, index) => index === 0 || sample.value >= countdown[index - 1].value)).toBe(true);
  });
}

test("dismiss preserves native continuity without Web Animations inspection", async ({ page }) => {
  await start(page, `<div id="panel" data-ae-present="opacity" hidden
    style="--ae-pop-duration:1200ms;--ae-dismiss-duration:500ms;--ae-pop-ease:linear;--ae-dismiss-ease:linear">Content</div>`, { forceLegacy: true });
  await page.evaluate(() => {
    document.getElementById("panel").getAnimations = undefined;
    window.opening = $ae("panel").present.pop();
  });
  await expect.poll(() => page.locator("#panel").evaluate(element => Number(getComputedStyle(element).opacity)), { intervals: [16] }).toBeGreaterThan(.3);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("panel");
    const before = Number(getComputedStyle(element).opacity);
    const closing = $ae(element).present.dismiss();
    const after = Number(getComputedStyle(element).opacity);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const next = Number(getComputedStyle(element).opacity);
    await Promise.all([window.opening, closing]);
    return { before, after, next, hidden: element.hidden, opacity: element.style.opacity };
  });
  expect(result.before).toBeLessThan(.8);
  expect(result.after).toBeCloseTo(result.before, 2);
  expect(result.next).toBeLessThanOrEqual(result.before + .01);
  expect(result.next).toBeGreaterThan(0);
  expect(result).toMatchObject({ hidden: true, opacity: "" });
});

for (const cssMotionController of [true, false]) for (const forceLegacy of [false, true]) {
  test(`dismiss handoff respects veto, restart, replacement and teardown (controlled=${cssMotionController}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<div id="panel" data-ae-present="opacity height" hidden
      style="width:100px;height:100px;max-height:240px!important;--ae-pop-duration:900ms;--ae-dismiss-duration:600ms;--ae-pop-ease:linear;--ae-dismiss-ease:linear"></div>`,
    { cssMotionController, forceLegacy });
    await page.evaluate(() => { window.opening = $ae("panel").present.pop(); });
    await expect.poll(() => page.locator("#panel").evaluate(element => Number(getComputedStyle(element).opacity)), { intervals: [16] }).toBeGreaterThan(.25);
    const veto = await page.evaluate(async () => {
      const element = document.getElementById("panel");
      const animations = element.getAnimations();
      const styles = element.style.cssText;
      const before = Number(getComputedStyle(element).opacity);
      element.addEventListener("AelluxJsBeforeDismiss", event => event.preventDefault(), { once: true });
      await $ae(element).present.dismiss();
      return { same: animations.every(animation => element.getAnimations().includes(animation)),
        styles: styles === element.style.cssText, before, after: Number(getComputedStyle(element).opacity) };
    });
    expect(veto.same).toBe(true);
    expect(veto.styles).toBe(true);
    expect(veto.after).toBeGreaterThanOrEqual(veto.before - .01);
    const restarted = await page.evaluate(async () => {
      const element = document.getElementById("panel");
      const closing = $ae(element).present.dismiss();
      const opening = $ae(element).present.pop();
      const reset = Number(getComputedStyle(element).opacity);
      const replacement = $ae(element).present.dismiss();
      await Promise.all([window.opening, closing, opening, replacement]);
      return { reset, hidden: element.hidden, max: element.style.maxHeight,
        priority: element.style.getPropertyPriority("max-height") };
    });
    expect(restarted).toEqual({ reset: 0, hidden: true, max: "240px", priority: "important" });
    await page.evaluate(() => { window.opening = $ae("panel").present.pop(); });
    await expect.poll(() => page.locator("#panel").evaluate(element => Number(getComputedStyle(element).opacity)), { intervals: [16] }).toBeGreaterThan(.25);
    await page.evaluate(() => { window.closing = $ae("panel").present.dismiss(); });
    await expect.poll(() => page.locator("#panel").evaluate(element =>
      element.classList.contains(AelluxJs.className("dismissing")) && element.getAnimations().length > 0), { intervals: [16] }).toBe(true);
    const cleanup = await page.evaluate(async () => {
      const element = document.getElementById("panel");
      // Allow the shared controller's capture/preparation to own the new effects.
      for (let index = 0; index < 3; index++) await new Promise(requestAnimationFrame);
      const animations = element.getAnimations();
      await AelluxJs.unmount(element, "present");
      await Promise.all([window.opening, window.closing]);
      return { max: element.style.maxHeight, priority: element.style.getPropertyPriority("max-height"),
        temporary: ["opacity", "transition-property", "--ae-pop-progress", "--ae-present-pop-phase"]
          .map(property => element.style.getPropertyValue(property)),
        paused: animations.some(animation => animation.playState === "paused") };
    });
    expect(cleanup).toEqual({ max: "240px", priority: "important", temporary: ["", "", "", ""], paused: false });
  });

  test(`group closes an opening member from its rendered state (controlled=${cssMotionController}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<style>[data-ae-present] { --ae-pop-duration:1200ms;--ae-dismiss-duration:600ms;--ae-pop-ease:linear;--ae-dismiss-ease:linear }</style>
      <div id="group" data-ae-present-group data-ae-present-active="a">
        <div id="a" data-ae-present="opacity">A</div><div id="b" data-ae-present="opacity" hidden>B</div></div>`,
    { cssMotionController, forceLegacy });
    await page.evaluate(() => { window.selection = $ae("group").present.show("b"); });
    await expect.poll(() => page.locator("#b").evaluate(element => Number(getComputedStyle(element).opacity)), { intervals: [16] }).toBeGreaterThan(.3);
    const result = await page.evaluate(async () => {
      const element = document.getElementById("b");
      const before = Number(getComputedStyle(element).opacity);
      const selected = $ae("group").present.show("a");
      const after = Number(getComputedStyle(element).opacity);
      await Promise.all([window.selection, selected]);
      return { before, after, hidden: element.hidden, selected: $ae("group").present.selected().id };
    });
    expect(result.before).toBeLessThan(.8);
    expect(result.after).toBeCloseTo(result.before, 2);
    expect(result).toMatchObject({ hidden: true, selected: "a" });
  });

  for (const kind of ["visual", "grid-height", "grid-width", "grid-height-custom", "grid-width-custom", "measured-height", "measured-width"]) {
    test(`dismiss preserves intermediate ${kind} (controlled=${cssMotionController}, legacy=${forceLegacy})`, async ({ page }) => {
      const dimension = kind.includes("height") ? "height" : "width";
      const grid = kind.startsWith("grid");
      const measured = kind.startsWith("measured");
      await start(page, `<style>
        #panel { --ae-pop-duration:1200ms; --ae-dismiss-duration:700ms;
          --ae-pop-ease:linear; --ae-dismiss-ease:linear;
          --ae-from-opacity:.2; --ae-pop-opacity:.85; --ae-dismiss-opacity:.1;
          --ae-from-transform:translateY(30px); --ae-pop-transform:translateY(0);
          --ae-dismiss-transform:translateY(-20px);
          ${kind.endsWith("custom") ? `--ae-from-${dimension}:11px;--ae-pop-${dimension}:151px;--ae-dismiss-${dimension}:7px;` : ""}
          ${measured ? "display:inline-block;max-height:300px!important;max-width:300px!important;" : ""}
        }
        #content { width:160px; height:120px; opacity:var(--ae-pop-progress); }
      </style><div id="panel" data-ae-present="${kind === "visual" ? "opacity transform" : dimension}" hidden>
        <div id="content" ${grid ? "data-ae-present-motion" : ""}><div style="width:160px;height:120px"></div></div></div>`, { cssMotionController, forceLegacy });
      await page.evaluate(({ kind, dimension }) => {
        const element = document.getElementById("panel");
        window.readPresent = () => {
          const style = getComputedStyle(element);
          return { value: kind === "visual" ? Number(style.opacity) : parseFloat(style[dimension]),
            transform: new DOMMatrixReadOnly(style.transform).m42,
            pop: Number(style.getPropertyValue("--ae-pop-progress")),
            dismiss: Number(style.getPropertyValue("--ae-dismiss-progress")),
            child: Number(getComputedStyle(document.getElementById("content")).opacity) };
        };
        window.opening = $ae(element).present.pop();
      }, { kind, dimension });
      await expect.poll(() => page.evaluate(() => window.readPresent().pop), { intervals: [16] }).toBeGreaterThan(.3);
      const result = await page.evaluate(async () => {
        const element = document.getElementById("panel");
        const before = window.readPresent();
        const oldAnimations = element.getAnimations();
        let dismissing = 0;
        element.addEventListener("AelluxJsDismissing", () => dismissing++);
        const closing = $ae(element).present.dismiss();
        const samples = [window.readPresent()];
        await $ae(element).present.dismiss();
        for (let i = 0; i < 7; i++) {
          await new Promise(requestAnimationFrame);
          samples.push(window.readPresent());
        }
        const active = element.getAnimations().map(animation => ({
          duration: animation.effect.getTiming().duration,
          property: animation.transitionProperty,
          frames: animation.effect.getKeyframes()
        }));
        element.getAnimations().forEach(animation => { animation.currentTime = 699.9; });
        const endpoint = window.readPresent();
        await Promise.all([window.opening, closing]);
        return { before, samples, active, endpoint, final: window.readPresent(), hidden: element.hidden, dismissing,
          obsoletePaused: oldAnimations.some(animation => animation.playState === "paused"),
          styles: ["opacity", "transform", "grid-template-rows", "grid-template-columns", "transition-property", "height", "width"]
            .map(property => element.style.getPropertyValue(property)),
          max: [element.style.maxHeight, element.style.maxWidth],
          priorities: [element.style.getPropertyPriority("max-height"), element.style.getPropertyPriority("max-width")] };
      });
      expect(result.before.pop).toBeLessThan(.8);
      const tolerance = kind === "visual" ? .025 : 2;
      expect(Math.abs(result.samples[0].value - result.before.value), JSON.stringify(result)).toBeLessThan(tolerance);
      for (const sample of result.samples) {
        expect(sample.value).toBeLessThanOrEqual(result.before.value + tolerance);
        expect(sample.value).toBeGreaterThan(kind === "visual" ? .1 : 0);
        expect(sample.pop).toBeLessThanOrEqual(result.before.pop + .025);
        expect(sample.child).toBeCloseTo(sample.pop, 2);
        if (kind === "visual") {
          expect(sample.transform).toBeLessThanOrEqual(result.before.transform + .5);
          expect(sample.transform).toBeGreaterThan(-20);
        }
      }
      expect(result.samples.at(-1).value).toBeLessThan(result.before.value);
      expect(result.active.some(animation => animation.duration === 700)).toBe(true);
      expect(result.endpoint.value).toBeCloseTo(kind === "visual" ? .1 : kind.endsWith("custom") ? 7 : 0, 1);
      if (kind === "visual") expect(result.endpoint.transform).toBeCloseTo(-20, 1);
      expect(result.final).toMatchObject({ pop: 0, dismiss: 1 });
      expect(result.hidden).toBe(true);
      expect(result.dismissing).toBe(1);
      expect(result.obsoletePaused).toBe(false);
      expect(result.styles).toEqual(["", "", "", "", "", "", ""]);
      expect(result.max).toEqual(["", ""]);
      expect(result.priorities).toEqual(["", ""]);
    });
  }
}

async function start(page, markup, options = {}) {
  await page.goto("/tests/index.htm");
  await page.mouse.move(-100, -100);
  await page.evaluate(markup => { document.body.innerHTML = markup; }, markup);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => {
    if (options.mode === "basic") AelluxJs.ext("present", { loadStyle: true });
    AelluxJs.init({ mode: "full", ...options });
  }, options);
  await expect.poll(() => page.evaluate(() => !!AelluxJs.ext.present?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "present"));
  await expect(page.locator('link[data-ae-ext-style="present"],link[data-ae-full-style]')).toHaveCount(1);
  await page.evaluate(async () => {
    const link = document.querySelector('link[data-ae-ext-style="present"],link[data-ae-full-style]');
    if (!link.sheet) await new Promise(resolve => link.addEventListener("load", resolve, { once: true }));
  });
}

async function trackGroupWarnings(page) {
  await page.evaluate(() => {
    window.groupWarnings = 0;
    const warn = AelluxJs.diagnostics.warn;
    AelluxJs.diagnostics.warn = function (definition, context) {
      if (definition.code === 2021) window.groupWarnings++;
      return warn.call(this, definition, context);
    };
  });
}

const panels = `<div id="group" data-ae-present-group data-ae-present-active="a" class="view-a">
  <section id="a" data-ae-present="opacity" data-ae-present-when="view-a">A</section>
  <section id="b" data-ae-present="opacity" data-ae-present-when="view-b" hidden><button id="inside">B</button></section>
  <section id="c" data-ae-present="opacity" hidden>C</section>
</div>`;

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`group IDs reject targets outside mounted membership (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<div id="group" data-ae-present-group data-ae-present-active="a">
      <div id="a" data-ae-present>A</div>
      <div><div id="wrapped" data-ae-present hidden>Wrapped descendant</div></div>
      <div id="plain-child" hidden>Not Present</div>
      <div id="unmounted" data-ae-present hidden>Unmounted</div>
      <div data-ae-present-group><div id="nested-member" data-ae-present hidden>Nested</div></div>
    </div>
    <div id="outside" data-ae-present hidden>Outside</div>
    <div data-ae-present-group><div id="other-member" data-ae-present hidden>Other group</div></div>`, { mode, forceLegacy });
    await trackGroupWarnings(page);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("unmounted"), "present"));
    for (const id of ["outside", "other-member", "nested-member", "plain-child", "unmounted", "group", "missing"]) {
      const result = await page.evaluate(async id => {
        const controller = $ae("group").present;
        const before = window.groupWarnings;
        const accepted = await controller.show(id);
        return { accepted, warned: window.groupWarnings > before, selected: controller.selected()?.id,
          active: document.getElementById("group").getAttribute("data-ae-present-active") };
      }, id);
      expect(result, id).toEqual({ accepted: false, warned: true, selected: "a", active: "a" });
      const warningsBefore = await page.evaluate(id => {
        const count = window.groupWarnings;
        document.getElementById("group").setAttribute("data-ae-present-active", id);
        return count;
      }, id);
      await expect.poll(() => page.evaluate(() => window.groupWarnings))
        .toBeGreaterThan(warningsBefore);
      expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("a");
      await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
      for (const target of ["outside", "other-member", "nested-member", "wrapped", "unmounted"]) {
        await expect(page.locator(`#${target}`)).toHaveJSProperty("hidden", true);
      }
      await page.evaluate(() => $ae("group").present.show("a"));
    }
    const result = await page.evaluate(async () => {
      let key;
      document.getElementById("group").addEventListener("AelluxJsPresentGroupChange", event => {
        key = event.detail.key;
      }, { once: true });
      return { accepted: await $ae("group").present.show("wrapped"), key };
    });
    expect(result).toEqual({ accepted: true, key: "wrapped" });
    await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  });
}

test("group observes member ID changes and rejects duplicate IDs without changing selection", async ({ page }) => {
  await start(page, `<div id="group" data-ae-present-group data-ae-present-active="renamed">
    <div id="a" data-ae-present>A</div><div id="b" data-ae-present hidden>B</div></div>`);
  await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(e => e.code === 2021))).toBe(true);
  await page.locator("#b").evaluate(element => { element.id = "renamed"; });
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  await expect(page.locator("#renamed")).toHaveJSProperty("hidden", false);
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("renamed");
  await trackGroupWarnings(page);
  await page.evaluate(async () => {
    const group = document.getElementById("group");
    group.insertAdjacentHTML("beforeend", '<div id="duplicate" data-ae-present hidden>1</div><div id="duplicate" data-ae-present hidden>2</div>');
    await AelluxJs.mount(group, "present");
  });
  const duplicate = await page.evaluate(async () => {
    const warnings = window.groupWarnings;
    return { accepted: await $ae("group").present.show("duplicate"),
      warned: window.groupWarnings > warnings };
  });
  expect(duplicate).toEqual({ accepted: false, warned: true });
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("renamed");
  await expect(page.locator('[id="duplicate"]:visible')).toHaveCount(0);
  await page.locator("#renamed").evaluate(element => element.removeAttribute("id"));
  await expect.poll(() => page.evaluate(() => $ae("group").present.selected())).toBe(null);
});

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`group attribute, classes, API, veto and rapid replacement (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, panels, { mode, forceLegacy });
    await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
    expect(await page.evaluate(() => $ae("group").present.show("a"))).toBe(true);
    await page.evaluate(() => $ae("group").present.show("b"));
    await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
    await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "b");
    await page.evaluate(() => {
      document.getElementById("group").className = "view-a";
    });
    await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
    await page.evaluate(() => document.getElementById("group").removeAttribute("data-ae-present-active"));
    await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
    await page.evaluate(() => {
      document.getElementById("group").className = "view-b";
    });
    await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
    await page.locator("#inside").focus();
    expect(await page.evaluate(async () => {
      document.getElementById("b").addEventListener("AelluxJsBeforeDismiss", event => event.preventDefault(), { once: true });
      return $ae("group").present.show("c");
    })).toBe(false);
    await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
    await expect(page.locator("#c")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "b");
    const results = await page.evaluate(async () => {
      const controller = $ae("group").present;
      return Promise.all([controller.show("a"), controller.show("c"), controller.show("b")]);
    });
    expect(results.at(-1)).toBe(true);
    for (const id of ["a", "c"]) await expect(page.locator(`#${id}`)).toHaveJSProperty("hidden", true);
    await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
    expect(await page.evaluate(() => $ae.ext.present.show(document.getElementById("group"), "missing"))).toBe(false);
    await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "b");
  });
}

for (const cssMotionController of [true, false]) {
  test(`progress endpoints, easing, reversal and restoration (controller=${cssMotionController})`, async ({ page }) => {
    await start(page, `<div id="panel" data-ae-present="opacity" hidden data-ae-maxfps="20"
      style="--ae-pop-duration:600ms;--ae-dismiss-duration:300ms;--ae-pop-ease:ease-in;--ae-pop-progress:0.7">
      <span id="child" style="opacity:var(--ae-pop-progress)">Content</span></div>
      <div id="visible" data-ae-present="opacity">Visible</div>`, { cssMotionController });
    const progress = () => page.locator("#panel").evaluate(element => {
      const style = getComputedStyle(element);
      return [Number(style.getPropertyValue("--ae-pop-progress")), Number(style.getPropertyValue("--ae-dismiss-progress"))];
    });
    expect(await progress()).toEqual([0, 1]);
    expect(await page.locator("#visible").evaluate(element => [
      getComputedStyle(element).getPropertyValue("--ae-pop-progress").trim(),
      getComputedStyle(element).getPropertyValue("--ae-dismiss-progress").trim()
    ])).toEqual(["1", "0"]);
    await page.evaluate(() => { window.opening = $ae("panel").present.pop(); });
    await expect.poll(async () => (await progress())[0]).toBeGreaterThan(0);
    const sample = await page.locator("#panel").evaluate(element => {
      const animation = element.getAnimations().find(a => a.transitionProperty === "--ae-present-pop-phase");
      return { value: Number(getComputedStyle(element).getPropertyValue("--ae-pop-progress")),
        time: Number(animation?.currentTime), duration: animation?.effect.getTiming().duration,
        child: Number(getComputedStyle(document.getElementById("child")).opacity) };
    });
    expect(sample.value).toBeGreaterThan(0);
    expect(sample.value).toBeLessThan(1);
    expect(sample.child).toBeCloseTo(sample.value, 2);
    expect(sample.value).toBeLessThan(sample.time / sample.duration + 0.06);
    await page.evaluate(() => $ae("panel").present.dismiss());
    expect(await progress()).toEqual([0, 1]);
    await page.evaluate(async () => {
      await Promise.all([$ae("panel").present.pop(), $ae("panel").present.pop()]);
    });
    expect(await progress()).toEqual([1, 0]);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("panel"), "present"));
    expect(await page.locator("#panel").evaluate(element => [
      element.style.getPropertyValue("--ae-pop-progress"), element.style.getPropertyValue("--ae-dismiss-progress")
    ])).toEqual(["0.7", ""]);
  });
}

test("groups diagnose ambiguity, isolate nested members, mount dynamically and restore on unmount", async ({ page }) => {
  await start(page, panels);
  await page.evaluate(() => {
    const group = document.getElementById("group");
    group.removeAttribute("data-ae-present-active");
    group.className = "view-a view-b";
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 2021))).toBe(true);
  await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.evaluate(async () => {
    const group = document.getElementById("group");
    group.insertAdjacentHTML("beforeend", `<div id="nested" data-ae-present-group data-ae-present-active="nested-a">
      <div id="nested-a" data-ae-present hidden>Nested</div></div>
      <div id="dynamic" data-ae-present hidden>Dynamic</div>`);
    await AelluxJs.mount(group, "present");
    await $ae("group").present.show("dynamic");
  });
  await expect(page.locator("#nested-a")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#dynamic")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  await page.evaluate(async () => {
    document.getElementById("dynamic").remove();
    await $ae("group").present.show("b");
    await AelluxJs.unmount(document.getElementById("group"), "present");
  });
  await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "a");
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.evaluate(() => AelluxJs.mount(document.getElementById("group"), "present"));
  await page.evaluate(() => $ae("group").present.show("b"));
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
});

test("hover shares trigger/panel region, tolerates gaps, preserves keyboard and outside clicks", async ({ page }) => {
  await start(page, `<button id="trigger" data-ae-trigger="pop" data-ae-trigger-on="hover" data-ae-target="b"><span>Open</span></button>
    <button id="other" data-ae-trigger="pop" data-ae-trigger-on="hover" data-ae-target="b">Other</button>${panels}`);
  await page.locator("#trigger span").hover();
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  await page.locator("#b").hover();
  await page.waitForTimeout(180);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
  await page.mouse.move(900, 600);
  await page.waitForTimeout(40);
  await page.locator("#other").hover();
  await page.waitForTimeout(180);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
  await page.mouse.move(900, 600);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.locator("#trigger").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await page.locator("#trigger").evaluate(element => element.blur());
  await page.mouse.click(900, 600);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
});

test("touch hover is ignored, click toggles once, descendants and remount do not duplicate pop", async ({ page }) => {
  await start(page, `<button id="trigger" data-ae-trigger="toggle" data-ae-trigger-on="hover" data-ae-target="panel"><span>Open</span></button>
    <div id="panel" data-ae-present="opacity" hidden>Panel</div>`);
  await page.evaluate(() => {
    window.pops = 0;
    document.getElementById("panel").addEventListener("AelluxJsBeforePop", () => window.pops++);
    document.getElementById("trigger").dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "touch" }));
    document.getElementById("trigger").click();
  });
  await expect(page.locator("#panel")).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => window.pops)).toBe(1);
  await page.evaluate(async () => {
    await $ae("panel").present.dismiss();
    await AelluxJs.unmount(document.getElementById("trigger"), "present");
    await AelluxJs.mount(document.getElementById("trigger"), "present");
  });
  await page.locator("#trigger").hover();
  await page.locator("#trigger span").hover();
  await expect(page.locator("#panel")).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => window.pops)).toBe(2);
  await page.locator("#trigger").click();
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
  await page.mouse.move(900, 600);
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("panel"), "present"));
  await page.waitForTimeout(200);
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
});

for (const fallback of ["unregistered", "no-waapi", "reduced"]) {
  test(`progress preserves visual completion with ${fallback}`, async ({ page }) => {
    await page.addInitScript(fallback => {
      if (fallback === "unregistered") CSS.registerProperty = undefined;
      if (fallback === "no-waapi") Element.prototype.getAnimations = undefined;
    }, fallback);
    if (fallback === "reduced") await page.emulateMedia({ reducedMotion: "reduce" });
    await start(page, '<div id="panel" data-ae-present="opacity" hidden>Content</div>');
    await page.evaluate(() => $ae("panel").present.pop());
    await expect(page.locator("#panel")).toHaveCSS("opacity", "1");
    await expect(page.locator("#panel")).toHaveCSS("--ae-pop-progress", "1");
    await page.evaluate(() => $ae("panel").present.dismiss());
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#panel")).toHaveCSS("--ae-dismiss-progress", "1");
  });
}

test("group preserves unspecified initial states and ignores irrelevant classes without duplicate events", async ({ page }) => {
  await start(page, `<div id="group" data-ae-present-group>
    <div id="a" data-ae-present data-ae-present-when="view-a" hidden>A</div>
    <div id="b" data-ae-present data-ae-present-when="view-b" hidden>B</div></div>`);
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.evaluate(() => {
    window.pops = 0;
    document.getElementById("group").addEventListener("AelluxJsBeforePop", () => window.pops++);
    document.getElementById("group").className = "unmatched";
  });
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => window.pops)).toBe(0);
  await page.evaluate(() => { document.getElementById("group").className = "view-b"; });
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await page.evaluate(() => document.getElementById("group").classList.add("irrelevant"));
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => window.pops)).toBe(1);
  expect(await page.evaluate(async () => {
    document.getElementById("a").addEventListener("AelluxJsBeforePop", event => event.preventDefault(), { once: true });
    return $ae("group").present.show("a");
  })).toBe(false);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
});

test("group reentrant BeforePop selection and unmount cannot revive obsolete operations", async ({ page }) => {
  await start(page, panels);
  await page.evaluate(async () => {
    document.getElementById("b").addEventListener("AelluxJsBeforePop", () => {
      window.latest = $ae("group").present.show("c");
    }, { once: true });
    await $ae("group").present.show("b");
    await window.latest;
  });
  await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "c");
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await expect(page.locator("#c")).toHaveJSProperty("hidden", false);
  await page.evaluate(async () => {
    window.obsolete = $ae("group").present.show("a");
    await AelluxJs.unmount(document.getElementById("group"), "present");
    await window.obsolete;
  });
  await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#c")).toHaveJSProperty("hidden", true);
  expect(await page.locator(".ae--popping,.ae--dismissing,.ae--will-change").count()).toBe(0);
});

test("progress shares elapsed-time sampling under low FPS and retains the opening channel on close", async ({ page }) => {
  await start(page, `<div id="panel" data-ae-present="opacity" data-ae-maxfps="8" hidden
    style="--ae-pop-duration:350ms;--ae-dismiss-duration:350ms;--ae-pop-ease:linear;--ae-dismiss-ease:linear">Content</div>`,
  { cssMotionPropertyMaxFPS: 5 });
  const observation = await page.evaluate(async () => {
    const panel = document.getElementById("panel");
    const start = performance.now();
    await $ae("panel").present.pop();
    const elapsed = performance.now() - start;
    window.closing = $ae("panel").present.dismiss();
    return { elapsed, reset: getComputedStyle(panel).getPropertyValue("--ae-pop-progress").trim() };
  });
  expect(observation.elapsed).toBeGreaterThanOrEqual(420);
  expect(observation.elapsed).toBeLessThan(2500);
  expect(observation.reset).toBe("1");
  await expect.poll(() => page.locator("#panel").evaluate(element =>
    Number(getComputedStyle(element).getPropertyValue("--ae-dismiss-progress")))).toBeGreaterThan(0);
  await page.evaluate(() => window.closing);
  await expect(page.locator("#panel")).toHaveCSS("--ae-dismiss-progress", "1");
});

for (const cssMotionController of [false, true]) {
  test(`overshooting easing keeps public progress bounded (controller=${cssMotionController})`, async ({ page }) => {
    await start(page, `<div id="panel" data-ae-present="opacity" hidden
      style="--ae-pop-duration:1000ms;--ae-pop-ease:cubic-bezier(.3,2,.7,2);--ae-pop-aellux-ease:backOut">Content</div>`,
    { cssMotionController });
    const samples = await page.evaluate(async () => {
      const panel = document.getElementById("panel");
      const samples = [];
      let sampling = true;
      const sample = () => {
        samples.push(Number(getComputedStyle(panel).getPropertyValue("--ae-pop-progress")));
        if (sampling) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      await $ae("panel").present.pop();
      sampling = false;
      return samples;
    });
    expect(samples.some(value => value > 0 && value < 1)).toBe(true);
    expect(samples.every(value => value >= 0 && value <= 1)).toBe(true);
  });
}

test("a member removed or moved during selection cannot complete the former group request", async ({ page }) => {
  await start(page, `${panels}<div id="destination" data-ae-present-group></div>`);
  const removed = await page.evaluate(async () => {
    const pending = $ae("group").present.show("b");
    const member = document.getElementById("b");
    member.remove();
    await AelluxJs.unmount(member, "present");
    return pending;
  });
  expect(removed).toBe(false);
  const moved = await page.evaluate(async () => {
    const pending = $ae("group").present.show("c");
    document.getElementById("destination").append(document.getElementById("c"));
    return pending;
  });
  expect(moved).toBe(false);
  await page.evaluate(() => $ae("destination").present.show("c"));
  await expect(page.locator("#c")).toHaveJSProperty("hidden", false);
});

test("native touch activation of a hover toggle opens once", async ({ browser, browserName, baseURL }) => {
  test.skip(browserName === "firefox", "Playwright Firefox does not expose touchscreen.tap; synthetic touch pointer coverage runs separately.");
  const context = await browser.newContext({ hasTouch: true, baseURL });
  const page = await context.newPage();
  try {
    await start(page, `<button id="trigger" data-ae-trigger="toggle" data-ae-trigger-on="hover" data-ae-target="panel">Open</button>
      <div id="panel" data-ae-present="opacity" hidden>Content</div>`);
    await page.locator("#trigger").tap();
    await expect(page.locator("#panel")).toHaveAttribute("aria-expanded", "true");
    await page.waitForTimeout(200);
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
    await page.locator("#trigger").tap();
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
  } finally {
    await context.close();
  }
});

test("hover click suppression follows live trigger mode and target changes", async ({ page }) => {
  await start(page, `<button id="trigger" data-ae-trigger="toggle" data-ae-trigger-on="hover" data-ae-target="a">Open</button>
    <div id="a" data-ae-present="opacity" hidden>A</div><div id="b" data-ae-present="opacity" hidden>B</div>`);
  await page.locator("#trigger").hover();
  await expect(page.locator("#a")).toHaveAttribute("aria-expanded", "true");
  await page.locator("#trigger").evaluate(element => element.setAttribute("data-ae-target", "b"));
  await page.locator("#trigger").click();
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await page.mouse.move(900, 600);
  await page.locator("#trigger").evaluate(element => element.blur());
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.locator("#trigger").hover();
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await page.locator("#trigger").evaluate(element => element.setAttribute("data-ae-trigger-on", "click"));
  await page.locator("#trigger").click();
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
});
