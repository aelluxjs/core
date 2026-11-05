import { expect, test } from "@playwright/test";

async function start(page, markup, options = {}) {
  await page.goto("/tests/index.htm");
  await page.evaluate(markup => { document.body.innerHTML = markup; }, markup);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => {
    if (options.mode === "basic") $ae.ext("present", { loadStyle: true });
    $ae.init({ mode: "full", ...options });
  }, options);
  await expect.poll(() => page.evaluate(() => typeof $ae("panel")?.present?.unpop)).toBe("function");
  await page.evaluate(async () => {
    const link = document.querySelector('link[data-ae-ext-style="present"],link[data-ae-full-style]');
    if (!link.sheet) await new Promise(resolve => link.addEventListener("load", resolve, { once: true }));
  });
}

const visual = `<div id="panel" data-ae-present="opacity transform" data-ae-dismiss-on-click="none" hidden
  style="--ae-pop-duration:1200ms;--ae-dismiss-duration:600ms;--ae-pop-ease:cubic-bezier(.4,.1,.8,.5);
  --ae-from-opacity:.1;--ae-pop-opacity:.9;--ae-dismiss-opacity:.5;
  --ae-from-transform:rotate(0deg) translateX(10px);--ae-pop-transform:rotate(270deg) translateX(40px);
  --ae-dismiss-transform:scale(1.5)">Content</div>`;

for (const forceLegacy of [false, true]) for (const curve of ["advanced", "native"]) {
  test(`unpop retraces ${curve} overshoot instead of easing toward from again (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<div id="panel" data-ae-present="transform" hidden style="--ae-pop-duration:1200ms;
      ${curve === "advanced" ? "--ae-pop-ease:linear;--ae-pop-aellux-ease:backOut;" : `--ae-pop-ease:${forceLegacy ? "LINEAR" : "linear"}(0,1.0877 50%,1.06414 75%,1);`}
      --ae-from-transform:translateX(0px);--ae-pop-transform:translateX(100px)">Content</div>`,
    { forceLegacy, cssMotionController: curve === "advanced" });
    test.skip(!await page.evaluate(() => CSS.supports("animation-timing-function", "linear(0, 1)")), "Advanced sampled easing requires CSS linear().");
    await page.evaluate(() => { window.opening = $ae("panel").present.pop(); });
    await expect(page.locator("#panel")).toHaveClass(/ae--popping/);
    if (curve === "advanced") await expect.poll(() => page.locator("#panel").evaluate(element => element.getAnimations().some(animation => animation.playState === "paused"))).toBe(true);
    const result = await page.evaluate(async () => {
      const panel = document.getElementById("panel");
      const read = () => new DOMMatrixReadOnly(getComputedStyle(panel).transform).m41;
      const original = panel.getAnimations();
      original.forEach(animation => { animation.pause(); animation.currentTime = 900; });
      const before = read();
      original.forEach(animation => { animation.currentTime = 600; });
      const expected = read();
      original.forEach(animation => { animation.currentTime = 900; });
      const closing = $ae(panel).present.unpop();
      const after = read();
      panel.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 300; });
      const midway = read();
      await $ae.unmount(panel, "present");
      await Promise.all([window.opening, closing]);
      return { before, expected, after, midway };
    });
    expect(result.before).toBeGreaterThan(100);
    expect(result.expected).toBeGreaterThan(result.before + 1);
    expect(result.after).toBeCloseTo(result.before, 1);
    expect(result.midway).toBeCloseTo(result.expected, 1);
  });
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) for (const cssMotionController of [false, true]) {
  test(`unpop replays a partial nonlinear opening (${mode}, legacy=${forceLegacy}, controlled=${cssMotionController})`, async ({ page }) => {
    await start(page, visual, { mode, forceLegacy, cssMotionController });
    await page.evaluate(() => { window.opening = $ae("panel").present.pop(); });
    await expect(page.locator("#panel")).toHaveClass(/ae--popping/);
    await page.waitForTimeout(80);
    const result = await page.evaluate(async () => {
      const element = document.getElementById("panel");
      const read = () => {
        const style = getComputedStyle(element), matrix = new DOMMatrixReadOnly(style.transform);
        return { opacity: Number(style.opacity), matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f] };
      };
      const original = element.getAnimations();
      original.forEach(animation => { animation.pause(); animation.currentTime = 720; });
      const before = read();
      original.forEach(animation => { animation.currentTime = 360; });
      const expected = read();
      original.forEach(animation => { animation.currentTime = 720; });
      const events = [];
      for (const name of ["BeforeUnpop", "Layout", "Unpopping", "Unpop", "BeforeDismiss", "Dismiss"])
        element.addEventListener(`AelluxJs${name}`, event => events.push({ name, cancelable: event.cancelable, ...event.detail }));
      window.closing = $ae(element).present.unpop();
      const after = read();
      const reverse = element.getAnimations();
      reverse.forEach(animation => { animation.pause(); animation.currentTime = 360; });
      const midway = read();
      reverse.forEach(animation => animation.play());
      await Promise.all([window.opening, window.closing]);
      return { before, expected, after, midway, events, hidden: element.hidden,
        progress: ["--ae-pop-progress", "--ae-dismiss-progress", "--ae-unpop-progress"].map(name => getComputedStyle(element).getPropertyValue(name).trim()),
        styles: ["opacity", "transform", "transition-property", "animation-name"].map(name => element.style.getPropertyValue(name)) };
    });
    expect(result.after.opacity).toBeCloseTo(result.before.opacity, 2);
    expect(result.midway.opacity).toBeCloseTo(result.expected.opacity, 2);
    result.after.matrix.forEach((value, index) => expect(value).toBeCloseTo(result.before.matrix[index], 1));
    result.midway.matrix.forEach((value, index) => expect(value).toBeCloseTo(result.expected.matrix[index], 1));
    expect(result.events.map(event => event.name)).toEqual(["BeforeUnpop", "Layout", "Unpopping", "Unpop"]);
    expect(result.events[0].cancelable).toBe(true);
    expect(result.events[1]).toMatchObject({ origin: "present.unpop", durationMs: 720 });
    expect(result.hidden).toBe(true);
    expect(result.progress).toEqual(["0", "1", "1"]);
    expect(result.styles).toEqual(["", "", "", ""]);
  });
}

for (const forceLegacy of [false, true]) for (const cssMotionController of [false, true]) {
  test(`completed advanced opening can be reversed and repeatedly replaced (legacy=${forceLegacy}, controlled=${cssMotionController})`, async ({ page }) => {
    await start(page, visual.replace("1200ms", "350ms").replace("--ae-pop-ease:", "--ae-pop-aellux-ease:backOut;--ae-pop-ease:"),
      { forceLegacy, cssMotionController });
    await page.evaluate(() => $ae("panel").present.pop());
    const result = await page.evaluate(async () => {
      const element = document.getElementById("panel"), controller = $ae(element).present;
      let before = 0;
      element.addEventListener("AelluxJsBeforeUnpop", () => before++);
      const first = controller.unpop();
      await controller.unpop();
      const records = element.getAnimations().map(animation => animation.effect.getTiming());
      element.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 300; });
      const pop = Number(getComputedStyle(element).getPropertyValue("--ae-pop-progress"));
      const phase = Number(getComputedStyle(element).getPropertyValue("--ae-present-pop-phase"));
      element.getAnimations().forEach(animation => animation.play());
      await first;
      await controller.pop();
      const closing = controller.unpop();
      const reopening = controller.pop();
      await Promise.all([closing, reopening]);
      return { before, records, pop, phase, hidden: element.hidden, style: element.style.transitionProperty,
        progress: getComputedStyle(element).getPropertyValue("--ae-pop-progress").trim() };
    });
    expect(result.before).toBe(2);
    expect(result.records.some(record => record.direction === "reverse" && record.duration === 350)).toBe(true);
    expect(result.pop).toBeCloseTo(Math.max(0, Math.min(1, result.phase)), 3);
    expect(result.pop).toBeLessThan(.9);
    expect(result).toMatchObject({ hidden: false, style: "", progress: "1" });
  });

  for (const kind of ["grid-height", "grid-width", "measured-height", "measured-width"]) {
    test(`unpop preserves and restores ${kind} (legacy=${forceLegacy}, controlled=${cssMotionController})`, async ({ page }) => {
      const dimension = kind.endsWith("height") ? "height" : "width";
      await start(page, `<div id="panel" data-ae-present="${dimension}" data-ae-dismiss-on-click="none" hidden
        style="width:150px;height:120px;max-height:240px!important;max-width:280px!important;
        --ae-pop-duration:1200ms;--ae-pop-ease:linear;--ae-from-height:7px;--ae-from-width:9px;
        --ae-pop-height:120px;--ae-pop-width:150px">
        <div ${kind.startsWith("grid") ? "data-ae-present-motion" : ""}><div style="width:150px;height:120px"></div></div></div>`,
      { forceLegacy, cssMotionController });
      await page.evaluate(() => { window.opening = $ae("panel").present.pop(); });
      await expect(page.locator("#panel")).toHaveClass(/ae--popping/);
      await page.waitForTimeout(80);
      const result = await page.evaluate(async dimension => {
        const element = document.getElementById("panel");
        const read = () => parseFloat(getComputedStyle(element)[dimension]);
        element.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 600; });
        const before = read();
        const closing = $ae(element).present.unpop();
        const after = read();
        element.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 300; });
        const midway = read();
        element.getAnimations().forEach(animation => animation.play());
        await Promise.all([window.opening, closing]);
        return { before, after, midway, hidden: element.hidden,
          caps: [element.style.maxHeight, element.style.maxWidth],
          priorities: [element.style.getPropertyPriority("max-height"), element.style.getPropertyPriority("max-width")] };
      }, dimension);
      expect(result.before).toBeGreaterThan(20);
      expect(result.after).toBeCloseTo(result.before, 0);
      expect(result.midway).toBeLessThan(result.before - 10);
      expect(result.hidden).toBe(true);
      expect(result.caps).toEqual(["240px", "280px"]);
      expect(result.priorities).toEqual(["important", "important"]);
    });
  }

  test(`veto, dismiss ownership, replacement and teardown (legacy=${forceLegacy}, controlled=${cssMotionController})`, async ({ page }) => {
    await start(page, visual, { forceLegacy, cssMotionController });
    await page.evaluate(() => { window.opening = $ae("panel").present.pop(); });
    await expect(page.locator("#panel")).toHaveClass(/ae--popping/);
    const result = await page.evaluate(async () => {
      const element = document.getElementById("panel"), controller = $ae(element).present;
      const original = element.getAnimations(), style = element.style.cssText;
      element.addEventListener("AelluxJsBeforeUnpop", event => event.preventDefault(), { once: true });
      await controller.unpop();
      const veto = style === element.style.cssText && original.every(animation => element.getAnimations().includes(animation));
      const dismissing = controller.dismiss();
      const dismissal = element.getAnimations(), dismissalStyle = element.style.cssText;
      const refused = await controller.unpop();
      const untouched = dismissalStyle === element.style.cssText && dismissal.every(animation => element.getAnimations().includes(animation));
      await Promise.all([window.opening, dismissing]);
      await controller.pop();
      const reversing = controller.unpop();
      element.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 300; });
      const current = Number(getComputedStyle(element).opacity);
      const replacement = controller.dismiss();
      const continuous = Math.abs(Number(getComputedStyle(element).opacity) - current) < .02;
      await Promise.all([reversing, replacement]);
      const restored = [element.style.opacity, element.style.transform, element.style.transitionProperty];
      await controller.pop();
      const closing = controller.unpop();
      await $ae.unmount(element, "present");
      await closing;
      return { veto, refused, untouched, continuous, restored, progress: element.style.getPropertyValue("--ae-unpop-progress"),
        animations: element.getAnimations().length, styles: [element.style.opacity, element.style.transform, element.style.transitionProperty] };
    });
    expect(result).toEqual({ veto: true, refused: false, untouched: true, continuous: true, restored: ["", "", ""], progress: "", animations: 0, styles: ["", "", ""] });
  });
}

for (const forceLegacy of [false, true]) {
  test(`CSS-only reversal preserves nonlinear opening and inline priorities (legacy=${forceLegacy})`, async ({ page }) => {
    await page.addInitScript(() => { Element.prototype.getAnimations = undefined; });
    await start(page, `<style>#panel {max-height:240px!important}</style><div id="panel" data-ae-present="opacity transform height" hidden data-ae-dismiss-on-click="none"
      style="height:120px;max-height:240px!important;--ae-pop-duration:1000ms;--ae-pop-ease:ease-in;
      --ae-from-transform:scale(.5);--ae-pop-transform:scale(1);--ae-dismiss-transform:scale(1.5)">Content</div>`, { forceLegacy });
    await page.evaluate(() => { window.opening = $ae("panel").present.pop(); });
    await expect.poll(() => page.locator("#panel").evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.2);
    const sample = await page.evaluate(() => {
      const element = document.getElementById("panel");
      const before = Number(getComputedStyle(element).opacity);
      window.closing = $ae(element).present.unpop();
      return { before, after: Number(getComputedStyle(element).opacity) };
    });
    expect(sample.after).toBeCloseTo(sample.before, 1);
    const height = await page.locator("#panel").evaluate(element => parseFloat(getComputedStyle(element).height));
    await expect.poll(() => page.locator("#panel").evaluate(element => parseFloat(getComputedStyle(element).height)), { intervals: [16] }).toBeLessThan(height - 2);
    await page.evaluate(() => Promise.all([window.opening, window.closing]));
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
    expect(await page.locator("#panel").evaluate(element => [element.style.maxHeight, element.style.getPropertyPriority("max-height"), element.style.animationName]))
      .toEqual(["240px", "important", ""]);
  });
}

test("unpop trigger clears exclusive selection; groups and toggle still dismiss by default", async ({ page }) => {
  await start(page, `<button id="reverse" data-ae-trigger="unpop" data-ae-target="panel">Reverse</button>
    <div id="group" data-ae-present-group data-ae-present-active="panel">
      <div id="panel" data-ae-present="opacity" style="--ae-pop-duration:180ms">A</div>
      <div id="other" data-ae-present="opacity" hidden>B</div></div>`);
  await page.evaluate(() => {
    window.names = [];
    for (const name of ["BeforeUnpop", "BeforeDismiss"]) document.addEventListener(`AelluxJs${name}`, () => names.push(name));
  });
  await page.locator("#reverse").click();
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
  expect(await page.evaluate(() => $ae("group").present.selected())).toBeNull();
  await page.evaluate(async () => {
    await $ae("group").present.show("panel");
    await $ae("group").present.show("other");
    await $ae("other").present.toggle(false);
  });
  expect(await page.evaluate(() => window.names)).toEqual(["BeforeUnpop", "BeforeDismiss", "BeforeDismiss"]);
});

test("reverse focus release, discrete progress and reduced motion retain lifecycle", async ({ page }) => {
  await page.addInitScript(() => { CSS.registerProperty = undefined; });
  await start(page, `<div id="panel" data-ae-present="opacity" hidden style="--ae-pop-duration:180ms">
    <button id="inside">Inside</button></div>`);
  await page.evaluate(() => $ae("panel").present.pop());
  const result = await page.evaluate(async () => {
    const panel = document.getElementById("panel"), inside = document.getElementById("inside");
    inside.focus();
    const focus = [];
    $ae.on("UnpopFocusLost", event => focus.push({ origin: event.target === document,
      panel: event.detail.element === panel, focused: event.detail.focused === inside }));
    const closing = $ae(panel).present.unpop();
    const during = panel.style.getPropertyValue("--ae-unpop-progress");
    await closing;
    const final = panel.style.getPropertyValue("--ae-unpop-progress");
    await $ae(panel).present.pop();
    document.documentElement.setAttribute("data-ae-reduced-motion", "reduced");
    const at = performance.now();
    await $ae(panel).present.unpop();
    return { focus, during, final, elapsed: performance.now() - at, hidden: panel.hidden };
  });
  expect(result.focus).toEqual([{ origin: true, panel: true, focused: true }]);
  expect(result.during).toBe("0");
  expect(result.final).toBe("1");
  expect(result.elapsed).toBeLessThan(100);
  expect(result.hidden).toBe(true);
});

test("exclusive reverse veto preserves selection and an accumulating reverse releases capacity", async ({ page }) => {
  await start(page, `<div id="group" data-ae-present-group data-ae-present-active="panel">
    <div id="panel" data-ae-present="opacity" style="--ae-pop-duration:300ms">A</div>
    <div id="other" data-ae-present="opacity" hidden>B</div></div>`);
  const result = await page.evaluate(async () => {
    const panel = document.getElementById("panel"), group = document.getElementById("group");
    panel.addEventListener("AelluxJsBeforeUnpop", event => event.preventDefault(), { once: true });
    await $ae(panel).present.unpop();
    const veto = { selected: $ae(group).present.selected()?.id, active: group.getAttribute("data-ae-present-active"), hidden: panel.hidden };
    const first = await $ae(group).present.popNext();
    const closing = $ae(first).present.unpop();
    const next = await $ae(group).present.popNext();
    await closing;
    return { veto, first: first.id, next: next.id, nextVisible: !next.hidden };
  });
  expect(result.veto).toEqual({ selected: "panel", active: "panel", hidden: false });
  expect(result.first).not.toBe(result.next);
  expect(result.nextVisible).toBe(true);
});

test("an initially visible region reverses its configured full rotation and progress", async ({ page }) => {
  await start(page, `<div id="panel" data-ae-present="transform" style="--ae-pop-duration:800ms;--ae-pop-ease:linear;
    --ae-from-transform:rotate(0deg);--ae-pop-transform:rotate(270deg)">Content</div>`);
  const result = await page.evaluate(async () => {
    const panel = document.getElementById("panel"), closing = $ae(panel).present.unpop();
    panel.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 400; });
    const matrix = new DOMMatrixReadOnly(getComputedStyle(panel).transform);
    const progress = Number(getComputedStyle(panel).getPropertyValue("--ae-pop-progress"));
    await $ae.unmount(panel, "present");
    await closing;
    return { a: matrix.a, b: matrix.b, progress };
  });
  expect(result.a).toBeCloseTo(-Math.SQRT1_2, 3);
  expect(result.b).toBeCloseTo(Math.SQRT1_2, 3);
  expect(result.progress).toBeCloseTo(.5, 3);
});
