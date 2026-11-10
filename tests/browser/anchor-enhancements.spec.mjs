import { expect, test } from "@playwright/test";
import { installAnchorProbe } from "./anchor-probe.mjs";

async function start(page, html, options = {}) {
  await page.goto("/tests/index.htm");
  await page.evaluate(html => { document.body.innerHTML = html; }, html);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ mode = "full", forceLegacy = false, noResizeObserver = false, noAnimations = false, noScrollEnd = false, ...initialization }) => {
    if (noResizeObserver) window.ResizeObserver = class { observe() {} disconnect() {} };
    if (noAnimations) Element.prototype.getAnimations = undefined;
    if (noScrollEnd) {
      window.addEventListener("scrollend", event => event.stopImmediatePropagation(), true);
      for (const target of [window, document, document.documentElement]) {
        for (let prototype = target; prototype; prototype = Object.getPrototypeOf(prototype)) delete prototype.onscrollend;
      }
    }
    if (mode === "basic") {
      AelluxJs.ext("anchor", { loadStyle: true });
      if (document.querySelector("[data-ae-present-group]")) AelluxJs.ext("present", { loadStyle: true });
    }
    AelluxJs.init({ mode, forceLegacy, ...initialization });
  }, options);
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document));
  await installAnchorProbe(page);
}

const stage = `<style>body{margin:0} #ref{position:relative;width:750px;height:550px}
  .target{position:absolute} #a{left:20px;top:20px;width:80px;height:40px}
  #b{left:300px;top:100px;width:160px;height:70px} #c{left:160px;top:200px;width:110px;height:50px}</style>`;
const targets = `<div id="a" class="target"></div><div id="b" class="target"></div><div id="c" class="target"></div>`;
const indicator = `<div id="indicator" data-ae-anchor="bottom-right:top-right" data-ae-anchor-target="a"
  data-ae-anchor-match="width height" style="--ae-anchor-switch-duration:500ms;--ae-anchor-switch-ease:linear;opacity:1"></div>`;

async function geometry(page, id = "indicator", target = "a") {
  return page.evaluate(({ id, target }) => {
    const element = document.getElementById(id);
    const reference = document.getElementById(target);
    const a = element.getBoundingClientRect(), b = reference.getBoundingClientRect();
    return { width: a.width, height: a.height, right: a.right, top: a.top,
      targetWidth: b.width, targetHeight: b.height, targetRight: b.right, targetBottom: b.bottom,
      x: element.style.getPropertyValue("--ae-anchor-x"),
      publishedWidth: parseFloat(element.style.getPropertyValue("--ae-anchor-target-width")) };
  }, { id, target });
}

async function aligned(page, target) {
  await expect.poll(async () => {
    const g = await geometry(page, "indicator", target);
    return Math.max(Math.abs(g.right - g.targetRight), Math.abs(g.top - g.targetBottom),
      Math.abs(g.width - g.targetWidth), Math.abs(g.height - g.targetHeight));
  }).toBeLessThan(1);
}

for (const forceLegacy of [false, true]) {
  test(`target visibility follows computed CSS overrides on the target and its ancestors (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<style>
      .rendered { display:block!important; visibility:visible!important; opacity:1!important }
      .concealed { display:none!important }
    </style><div id="ref"><div id="panel" data-ae-present="" hidden class="rendered"
      style="display:none;visibility:hidden;opacity:0">
      <div id="a" class="target rendered" data-ae-present="" hidden
        style="display:none;visibility:hidden;opacity:0">Target</div>
    </div>${indicator}</div>`, { forceLegacy });
    await aligned(page, "a");
    await expect(page.locator("#a")).toBeVisible();
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
    for (const id of ["a", "panel"]) {
      await page.locator(`#${id}`).evaluate(element => element.classList.remove("rendered"));
      await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
      await page.locator(`#${id}`).evaluate(element => element.classList.add("rendered"));
      await aligned(page, "a");
      await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
    }
    await page.locator("#panel").evaluate(element => element.classList.add("concealed"));
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
    await page.locator("#panel").evaluate(element => element.classList.remove("concealed"));
    await aligned(page, "a");
    expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 1119))).toEqual([]);
  });

  test(`target can restore inherited visibility but cannot escape ancestor opacity (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<div id="ref"><div id="panel" style="visibility:hidden">
      <div id="a" class="target" style="visibility:visible">Target</div>
    </div>${indicator}</div>`, { forceLegacy });
    await aligned(page, "a");
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
    await page.locator("#a").evaluate(element => { element.style.visibility = ""; });
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
    await page.locator("#a").evaluate(element => { element.style.visibility = "visible"; });
    await aligned(page, "a");
    for (const property of ["opacity", "contentVisibility"]) {
      await page.locator("#panel").evaluate((element, property) => {
        element.style[property] = property === "opacity" ? "0" : "hidden";
      }, property);
      await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
      await page.locator("#panel").evaluate((element, property) => { element.style[property] = ""; }, property);
      await aligned(page, "a");
    }
  });
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`matching geometry, override, invalid tokens and restoration (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<div id="ref" style="transform:scale(1.2);transform-origin:0 0">${targets}
      <div id="indicator" data-ae-anchor="bottom-right:top-right" data-ae-anchor-target="a"
        data-ae-anchor-match="width height" style="--ae-anchor-target-width:9px!important;padding:3px;border:2px solid"></div></div>`, { mode, forceLegacy });
    await aligned(page, "a");
    expect((await geometry(page)).publishedWidth).toBeCloseTo(80, 1);
    await page.locator("#a").evaluate(element => { element.style.width = "130px"; element.style.height = "60px"; element.style.transform = "scale(1.1)"; element.style.transformOrigin = "0 0"; });
    await aligned(page, "a");
    await page.locator("#indicator").evaluate(element => { element.style.width = "50px"; });
    await page.evaluate(() => $ae("indicator").anchor.update());
    await expect.poll(async () => Math.abs((await geometry(page)).right - (await geometry(page)).targetRight)).toBeLessThan(1);
    await expect(page.locator("#indicator")).toHaveCSS("width", "50px");
    await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-match", "width invalid"));
    await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 2022))).toBe(true);
    await page.locator("#indicator").evaluate(element => element.removeAttribute("data-ae-anchor-match"));
    await page.evaluate(() => $ae("indicator").anchor.update());
    expect((await geometry(page)).publishedWidth).toBeGreaterThan(130);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("indicator"), "anchor"));
    expect(await page.locator("#indicator").evaluate(element => [
      element.style.getPropertyValue("--ae-anchor-target-width"),
      element.style.getPropertyPriority("--ae-anchor-target-width"),
      element.style.getPropertyValue("--ae-anchor-target-height"), element.style.width
    ])).toEqual(["9px", "important", "", "50px"]);
  });
}

test("width and height matching remain independent and preserve viewport candidates", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-match", "width"));
  await expect.poll(async () => (await geometry(page)).height).toBe(0);
  expect((await geometry(page)).width).toBe(80);
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-match", "height"));
  await expect.poll(async () => (await geometry(page)).height).toBe(40);
  expect((await geometry(page)).width).toBe(0);
  await page.evaluate(() => {
    const target = document.getElementById("a"), anchor = document.getElementById("indicator");
    Object.assign(target.style, { left: "650px", top: "560px", width: "100px", height: "30px" });
    anchor.setAttribute("data-ae-anchor-match", "width height");
    anchor.setAttribute("data-ae-anchor", "bottom-right:top-left,top-right:bottom-right");
  });
  await page.evaluate(() => $ae("indicator").anchor.update());
  expect(await page.locator("#indicator").evaluate(element => [
    element.style.getPropertyValue("--ae-anchor-origin-x"), element.style.getPropertyValue("--ae-anchor-origin-y")
  ])).toEqual(["100%", "100%"]);
  expect((await geometry(page)).right).toBeCloseTo(750, 0);
  expect((await geometry(page)).top).toBeCloseTo(530, 0);
});

test("known layout motion tracks intermediate dimensions without ResizeObserver and stops when idle", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`, { noResizeObserver: true });
  await aligned(page, "a");
  const result = await page.evaluate(async () => {
    const target = document.getElementById("a"), anchor = document.getElementById("indicator");
    const widths = [];
    const observer = new MutationObserver(() => widths.push(parseFloat(anchor.style.getPropertyValue("--ae-anchor-target-width"))));
    observer.observe(anchor, { attributes: true, attributeFilter: ["style"] });
    target.style.transition = "width 400ms linear,height 400ms linear";
    getComputedStyle(target).width;
    target.style.width = "180px";
    target.style.height = "90px";
    AelluxJs.dispatchFrom(target, "Layout", { bubbles: true, detail: { durationMs: 400 } });
    await new Promise(resolve => setTimeout(resolve, 800));
    const after = widths.length;
    await new Promise(resolve => setTimeout(resolve, 250));
    observer.disconnect();
    return { widths, idleWrites: widths.length - after };
  });
  expect(result.widths.some(width => width > 80 && width < 180)).toBe(true);
  expect(result.idleWrites).toBe(0);
  await aligned(page, "a");
});

for (const mode of ["basic", "full"]) {
  for (const forceLegacy of [false, true]) {
    test(`one scheduled clock interpolates matched dimensions and position (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
      await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`, { mode, forceLegacy });
      await aligned(page, "a");
      await page.locator("#indicator").evaluate(element => {
        element.setAttribute("data-ae-maxfps", "10");
        window.unrelated = element.animate([{ opacity: .8 }, { opacity: .9 }], { duration: 10000, iterations: Infinity });
        element.setAttribute("data-ae-anchor-target", "b");
      });
      await aligned(page, "b");
      const samples = await page.evaluate(() => switchProbe.operations[0].frames);
      expect(samples.some(sample => sample.width > 85 && sample.width < 155)).toBe(true);
      for (const sample of samples) {
        const progress = (sample.width - 80) / 80;
        expect(sample.x).toBeCloseTo(20 + 280 * progress, 1);
        expect(sample.y).toBeCloseTo(60 + 110 * progress, 1);
        expect(sample.height).toBeCloseTo(40 + 30 * progress, 1);
      }
      expect(await page.evaluate(() => switchProbe.operations.length)).toBe(1);
      expect(await page.locator("#indicator").evaluate(element => element.getAnimations().filter(animation => animation.transitionProperty).length)).toBe(0);
      await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
      expect(await page.evaluate(() => window.unrelated.playState)).toBe("running");
    });
  }
}

for (const forceLegacy of [false, true]) {
  for (const fallback of ["disabled", "unavailable"]) {
    test(`fallback retargets on one clock without owning existing effects (${fallback}, legacy=${forceLegacy})`, async ({ page }) => {
      await start(page, `${stage}<style>#c{width:50px}</style><div id="ref">${targets}${indicator}</div>`, {
        forceLegacy, cssMotionController: fallback !== "disabled", noAnimations: fallback === "unavailable"
      });
      await aligned(page, "a");
      await page.locator("#indicator").evaluate(element => {
        window.unrelated = element.animate([{ opacity: .8 }, { opacity: .9 }], { duration: 10000, iterations: Infinity });
        element.setAttribute("data-ae-anchor-target", "b");
      });
      await expect.poll(async () => (await geometry(page)).width).toBeGreaterThan(85);
      const before = await geometry(page);
      expect(before.width).toBeLessThan(160);
      const handoff = await page.locator("#indicator").evaluate(async element => {
        const before = { left: element.getBoundingClientRect().left, width: parseFloat(getComputedStyle(element).width) };
        const at = performance.now();
        element.setAttribute("data-ae-anchor-target", "c");
        await $ae(element).anchor.update();
        const after = { left: element.getBoundingClientRect().left, width: parseFloat(getComputedStyle(element).width) };
        return { before: { left: before.left, width: before.width }, after: { left: after.left, width: after.width }, elapsed: performance.now() - at };
      });
      // Native compositor values can materialize a frame after the JS sample.
      // Allow that frame while still rejecting a jump to either destination.
      expect(Math.abs(handoff.after.left - handoff.before.left)).toBeLessThan(handoff.elapsed + 20);
      expect(Math.abs(handoff.after.width - handoff.before.width)).toBeLessThan(handoff.elapsed * .2 + 5);
      expect(handoff.after.width).toBeGreaterThan(52);
      expect(handoff.after.width).toBeLessThan(158);
      await aligned(page, "c");
      await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
      expect(await page.evaluate(() => window.unrelated.playState)).toBe("running");
    });
  }
}

for (const forceLegacy of [false, true]) {
  test(`dimension switching respects the property ceiling and preserves low FPS handoff priorities (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`, { forceLegacy, cssMotionPropertyMaxFPS: 10 });
    await aligned(page, "a");
    await page.locator("#indicator").evaluate(element => {
      element.style.setProperty("transition-property", "transform, width, height, opacity", "important");
      element.style.setProperty("transition-duration", "1800ms, 1800ms, 1800ms, 8000ms", "important");
      element.style.setProperty("width", "var(--ae-anchor-target-width)", "important");
      element.style.setProperty("height", "var(--ae-anchor-target-height)", "important");
      element.style.setProperty("--ae-anchor-switch-duration", "1800ms");
      element.setAttribute("data-ae-maxfps", "30");
      element.style.opacity = ".5";
      element.getBoundingClientRect();
      window.unrelatedTransition = element.getAnimations().find(animation => animation.transitionProperty === "opacity");
      element.setAttribute("data-ae-anchor-target", "b");
    });
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
    const cadence = await page.locator("#indicator").evaluate(async element => {
      let previous = null, changes = 0, synchronized = true;
      const until = performance.now() + 650;
      while (performance.now() < until) {
        await new Promise(requestAnimationFrame);
        const width = parseFloat(element.style.getPropertyValue("--ae-anchor-target-width"));
        const height = parseFloat(element.style.getPropertyValue("--ae-anchor-target-height"));
        synchronized &&= Math.abs((width - 80) / 80 - (height - 40) / 30) < .001;
        if (width !== previous) changes++;
        previous = width;
      }
      const before = element.getBoundingClientRect(), at = performance.now();
      element.setAttribute("data-ae-anchor-target", "c");
      await $ae(element).anchor.update();
      const after = element.getBoundingClientRect();
      return { changes, synchronized, widthBefore: before.width, widthAfter: after.width,
        xBefore: before.left, xAfter: after.left, elapsed: performance.now() - at,
        styles: ["width", "height", "transition-property"].map(property =>
          [element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]),
        transform: element.style.transform, unrelated: window.unrelatedTransition?.playState,
        preserved: element.getAnimations().includes(window.unrelatedTransition) };
    });
    expect(cadence.synchronized).toBe(true);
    expect(cadence.changes).toBeGreaterThanOrEqual(2);
    expect(cadence.changes).toBeLessThanOrEqual(9);
    expect(Math.abs(cadence.widthAfter - cadence.widthBefore)).toBeLessThan(cadence.elapsed * .06 + 6);
    expect(Math.abs(cadence.xAfter - cadence.xBefore)).toBeLessThan(cadence.elapsed * .2 + 18);
    expect(cadence.styles).toEqual([["var(--ae-anchor-target-width)", "important"],
      ["var(--ae-anchor-target-height)", "important"], ["opacity", "important"]]);
    expect(cadence.transform).toBe("");
    expect(cadence.unrelated).toBe("running");
    expect(cadence.preserved).toBe(true);
    await aligned(page, "c");
    expect(await page.locator("#indicator").evaluate(element => element.style.getPropertyValue("transition-property"))).toBe("transform, width, height, opacity");
  });
}

test("switching shares position and size timing, retargets continuously and ignores equivalent targets", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await expect.poll(async () => (await geometry(page, "indicator", "b")).width).toBeGreaterThan(85);
  const sample = await geometry(page, "indicator", "b");
  expect(sample.width).toBeLessThan(160);
  const before = await page.locator("#indicator").evaluate(element => ({ x: element.getBoundingClientRect().left, at: performance.now() }));
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "c"));
  await page.evaluate(() => $ae("indicator").anchor.update());
  const after = await page.locator("#indicator").evaluate(element => ({ x: element.getBoundingClientRect().left, at: performance.now() }));
  // Account for real motion while protocol calls and WaitLayout phases run.
  expect(Math.abs(after.x - before.x)).toBeLessThan((after.at - before.at) + 5);
  await aligned(page, "c");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "#c"));
  await page.evaluate(() => $ae("indicator").anchor.update());
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
});


for (const forceLegacy of [false, true]) {
  test(`rapid genuine targets during document scroll each start one continuous timeline (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<style>#ref{position:fixed;top:0;left:0}body{height:6000px}</style>
      <div id="ref">${targets}${indicator}</div>`, { forceLegacy });
    await aligned(page, "a");
    const result = await page.evaluate(async () => {
      const anchor = document.getElementById("indicator"), samples = [];
      anchor.setAttribute("data-ae-anchor-target", "b");
      await waitAnchor(() => switchProbe.operations.length === 1);
      window.scrollTo({ top: 5000, behavior: "smooth" });
      for (const [index, id] of ["c", "a"].entries()) {
        const previous = switchProbe.operations.at(-1);
        await waitAnchor(() => performance.now() - previous.at >= 100);
        const before = anchor.getBoundingClientRect(), at = performance.now();
        anchor.setAttribute("data-ae-anchor-target", id);
        await waitAnchor(() => switchProbe.operations.length === index + 2);
        const after = anchor.getBoundingClientRect();
        samples.push({ before: before.width, after: after.width, elapsed: performance.now() - at,
          switching: anchor.classList.contains("ae--anchor-switching"), scrollY });
      }
      await waitAnchor(() => !anchor.classList.contains("ae--anchor-switching"));
      return { samples, targets: switchProbe.operations.map(operation => operation.target),
        duration: performance.now() - switchProbe.operations.at(-1).at };
    });
    expect(result.targets).toEqual(["b", "c", "a"]);
    expect(result.duration).toBeGreaterThanOrEqual(470);
    expect(result.duration).toBeLessThan(850);
    for (const sample of result.samples) {
      expect(sample.switching).toBe(true);
      expect(sample.scrollY).toBeGreaterThan(0);
      expect(Math.abs(sample.after - sample.before)).toBeLessThan(sample.elapsed * .25 + 3);
    }
    await aligned(page, "a");
    await page.waitForTimeout(600);
    await aligned(page, "a");
    expect(await page.evaluate(() => switchProbe.operations.length)).toBe(3);
  });

  for (const fallback of ["controlled", "disabled", "unavailable"]) test(`smooth scroll updates a sticky destination without changing its clock (${fallback}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<style>#ref{overflow:auto}#b{position:sticky;top:20px;margin:300px 0 0 300px}</style>
      <div id="ref">${targets}${indicator}<div style="height:2500px"></div></div>`, {
      forceLegacy, cssMotionController: fallback !== "disabled", noAnimations: fallback === "unavailable"
    });
    await aligned(page, "a");
    const result = await page.evaluate(async () => {
      const anchor = document.getElementById("indicator"), ref = document.getElementById("ref");
      anchor.setAttribute("data-ae-anchor-target", "b");
      await waitAnchor(() => switchProbe.operations.length === 1);
      const operation = switchProbe.operations[0];
      await waitAnchor(() => performance.now() - operation.at >= 100);
      ref.scrollTo({ top: 1200, behavior: "smooth" });
      const frame = await waitAnchorFrame(operation, 220);
      const middle = { width: frame.width, switching: frame.switching, top: ref.scrollTop, elapsed: frame.at - operation.at };
      await waitAnchor(() => !anchor.classList.contains("ae--anchor-switching"));
      return { middle, count: switchProbe.operations.length,
        duration: performance.now() - operation.at, frames: operation.frames };
    });
    expect(result.middle.switching).toBe(true);
    expect(result.middle.width).toBeGreaterThan(80);
    expect(result.middle.width).toBeLessThan(160);
    expect(Math.abs(result.middle.width - (80 + 80 * result.middle.elapsed / 500))).toBeLessThan(1);
    expect(result.middle.top).toBeGreaterThan(0);
    expect(result.count).toBe(1);
    expect(result.duration).toBeGreaterThanOrEqual(470);
    expect(result.duration).toBeLessThan(850);
    for (const frame of result.frames) {
      const progress = (frame.width - 80) / 80;
      expect(frame.height).toBeCloseTo(40 + 30 * progress, 1);
    }
    await aligned(page, "b");
    await page.locator("#ref").evaluate(element => element.scrollTo({ top: 1300, behavior: "instant" }));
    await aligned(page, "b");
    expect(await page.evaluate(() => switchProbe.operations.length)).toBe(1);
  });
}

test("moving and resizing the same target retain the original origin and completion deadline", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  const result = await page.evaluate(async () => {
    const anchor = document.getElementById("indicator"), target = document.getElementById("b");
    anchor.setAttribute("data-ae-anchor-target", "b");
    await waitAnchor(() => switchProbe.operations.length === 1);
    const operation = switchProbe.operations[0];
    await waitAnchor(() => performance.now() - operation.at >= 150);
    Object.assign(target.style, { left: "400px", top: "160px", width: "200px", height: "90px" });
    await $ae(anchor).anchor.update();
    const changedAt = performance.now();
    const frame = await waitAnchorFrame(operation, 330);
    await waitAnchor(() => !anchor.classList.contains("ae--anchor-switching"));
    return { frame, changedAt, at: operation.at, duration: performance.now() - operation.at, count: switchProbe.operations.length };
  });
  const progress = (result.frame.width - 80) / 120;
  expect(progress).toBeGreaterThan(.58);
  expect(progress).toBeLessThan(1);
  expect(Math.abs(progress - (result.frame.at - result.at) / 500)).toBeLessThan(.02);
  expect(result.frame.height).toBeCloseTo(40 + 50 * progress, 1);
  expect(result.frame.pivotX).toBeCloseTo(100 + 500 * progress, 1);
  expect(result.frame.pivotY).toBeCloseTo(60 + 190 * progress, 1);
  expect(result.count).toBe(1);
  expect(result.duration).toBeGreaterThanOrEqual(470);
  expect(result.duration).toBeLessThan(850);
  await aligned(page, "b");
});

test("same-target updates retain the captured duration and easing after configuration changes", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  const sample = await page.evaluate(async () => {
    const anchor = document.getElementById("indicator"), target = document.getElementById("b");
    anchor.setAttribute("data-ae-anchor-target", "b");
    await waitAnchor(() => switchProbe.operations.length === 1);
    const operation = switchProbe.operations[0];
    await waitAnchor(() => performance.now() - operation.at >= 150);
    anchor.style.setProperty("--ae-anchor-switch-duration", "0ms");
    anchor.style.setProperty("--ae-anchor-switch-ease", "steps(1,end)");
    target.style.left = "400px";
    await $ae(anchor).anchor.update();
    const frame = await waitAnchorFrame(operation, 300);
    const middle = { switching: frame.switching, width: frame.width, elapsed: frame.at - operation.at };
    await waitAnchor(() => !anchor.classList.contains("ae--anchor-switching"));
    return { middle, duration: performance.now() - operation.at, count: switchProbe.operations.length };
  });
  expect(sample.middle.switching).toBe(true);
  expect(sample.middle.width).toBeGreaterThan(120);
  expect(sample.middle.width).toBeLessThan(160);
  expect(Math.abs(sample.middle.width - (80 + 80 * sample.middle.elapsed / 500))).toBeLessThan(1);
  expect(sample.count).toBe(1);
  expect(sample.duration).toBeGreaterThanOrEqual(470);
  expect(sample.duration).toBeLessThan(850);
  await aligned(page, "b");
});

test("origins and pivots share the size clock in a scaled bordered reference", async ({ page }) => {
  await start(page, `${stage}<style>#indicator{left:.5px;top:.25px;margin-left:3px;margin-top:2px}</style>
    <div id="ref" style="transform:scale(1.3);transform-origin:0 0;border:5px solid;padding:10px">${targets}${indicator}</div>`);
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
  const snapshot = await page.evaluate(async () => {
    const anchor = document.getElementById("indicator"), ref = document.getElementById("ref");
    let sample = null;
    switchProbe.onFrame = (operation, frame) => {
      if (!frame.switching || frame.at - operation.at < 250) return;
      const value = name => parseFloat(anchor.style.getPropertyValue(name));
      const box = anchor.getBoundingClientRect(), reference = ref.getBoundingClientRect();
      sample = { width: value("--ae-anchor-target-width"), originX: value("--ae-anchor-origin-x"), originY: value("--ae-anchor-origin-y"),
        pivotX: value("--ae-anchor-pivot-x"), pivotY: value("--ae-anchor-pivot-y"),
        left: (box.left - reference.left) / 1.3 - ref.clientLeft,
        top: (box.top - reference.top) / 1.3 - ref.clientTop,
        boxWidth: box.width / 1.3, boxHeight: box.height / 1.3 };
      switchProbe.onFrame = null;
    };
    anchor.setAttribute("data-ae-anchor", "top-left:bottom-left");
    anchor.setAttribute("data-ae-anchor-target", "b");
    await waitAnchor(() => sample !== null);
    return sample;
  });
  const progress = (snapshot.width - 80) / 80;
  expect(progress).toBeGreaterThan(.4);
  expect(progress).toBeLessThan(1);
  expect(snapshot.originX).toBeCloseTo(100 * (1 - progress), 1);
  expect(snapshot.originY).toBeCloseTo(100 * progress, 1);
  expect(snapshot.pivotX).toBeCloseTo(100 + 200 * progress, 1);
  expect(snapshot.pivotY).toBeCloseTo(60 + 40 * progress, 1);
  // Layout may quantize fractional lengths before applying percentage transforms.
  expect(Math.abs(snapshot.left - (snapshot.pivotX - snapshot.boxWidth * snapshot.originX / 100 + 3.5))).toBeLessThan(.2);
  expect(Math.abs(snapshot.top - (snapshot.pivotY - snapshot.boxHeight * snapshot.originY / 100 + 2.25))).toBeLessThan(.2);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
});

for (const forceLegacy of [false, true]) test(`CSS curves match native easing with Web Animations APIs unavailable (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`, { forceLegacy });
  await aligned(page, "a");
  const samples = await page.evaluate(async () => {
    const anchor = document.getElementById("indicator");
    const curves = ["cubic-bezier(.34,1.56,.64,1)", "steps(4,jump-both)", "linear(0,.3 30% 70%,1)"]
      .filter(curve => CSS.supports("transition-timing-function", curve));
    const oracles = curves.map(easing => {
      const effect = new KeyframeEffect(null, [], { duration: 500, easing, fill: "both" });
      return { effect, animation: new Animation(effect) };
    });
    Element.prototype.getAnimations = undefined;
    Element.prototype.animate = undefined;
    window.Animation = window.KeyframeEffect = undefined;
    const results = [];
    for (const [index, easing] of curves.entries()) {
      const fromWidth = parseFloat(anchor.style.getPropertyValue("--ae-anchor-target-width"));
      const id = index % 2 ? "a" : "b", toWidth = id === "a" ? 80 : 160;
      anchor.style.setProperty("--ae-anchor-switch-ease", easing);
      anchor.setAttribute("data-ae-anchor-target", id);
      await waitAnchor(() => switchProbe.operations.length === index + 1);
      const operation = switchProbe.operations.at(-1);
      await waitAnchor(() => operation.frames.some(frame => frame.at - operation.at >= 170));
      const frame = operation.frames.at(-1), progress = (frame.at - operation.at) / 500;
      oracles[index].animation.currentTime = progress * 500;
      results.push({ easing, actual: (frame.width - fromWidth) / (toWidth - fromWidth),
        expected: oracles[index].effect.getComputedTiming().progress });
      await waitAnchor(() => !anchor.classList.contains("ae--anchor-switching"));
    }
    return results;
  });
  expect(samples.length).toBeGreaterThanOrEqual(2);
  for (const sample of samples) expect(Math.abs(sample.actual - sample.expected), JSON.stringify(sample)).toBeLessThan(.03);
});

test("scroll longer than the switch leaves direct tracking and no idle animation work", async ({ page }) => {
  await start(page, `${stage}<style>#ref{overflow:auto}#b{position:sticky;top:20px;margin:300px 0 0 300px}</style>
    <div id="ref">${targets}${indicator}<div style="height:2500px"></div></div>`);
  await aligned(page, "a");
  const result = await page.evaluate(async () => {
    const anchor = document.getElementById("indicator"), ref = document.getElementById("ref");
    anchor.setAttribute("data-ae-anchor-target", "b");
    await waitAnchor(() => switchProbe.operations.length === 1);
    const operation = switchProbe.operations[0];
    const started = performance.now();
    while (performance.now() - started < 950) {
      ref.scrollTo({ top: (performance.now() - started) * .8, behavior: "instant" });
      await new Promise(requestAnimationFrame);
    }
    await $ae(anchor).anchor.update();
    const frames = operation.frames.length;
    await new Promise(resolve => setTimeout(resolve, 150));
    return { count: switchProbe.operations.length, framesAfter: operation.frames.length - frames,
      completedAt: operation.frames.find(frame => !frame.switching)?.at - operation.at,
      switching: anchor.classList.contains("ae--anchor-switching") };
  });
  expect(result.count).toBe(1);
  expect(result.completedAt).toBeGreaterThanOrEqual(470);
  expect(result.completedAt).toBeLessThan(850);
  expect(result.switching).toBe(false);
  expect(result.framesAfter).toBe(0);
  await aligned(page, "b");
});

for (const transition of ["all", "transform, width, height, opacity"]) for (const noAnimations of [false, true]) {
  test(`dynamic switching preserves application transition timing and priorities (${transition}, no WAAPI=${noAnimations})`, async ({ page }) => {
    await start(page, `${stage}<style>#ref{overflow:auto} #b{position:sticky;top:20px;margin:300px 0 0 300px}</style>
      <div id="ref">${targets}${indicator}<div style="height:1500px"></div></div>`);
    await aligned(page, "a");
    await page.locator("#indicator").evaluate((element, { transition, noAnimations }) => {
      window.inspectAnimations = element.getAnimations.bind(element);
      window.transitionStartedAt = performance.now();
      if (noAnimations) Element.prototype.getAnimations = undefined;
      element.style.setProperty("transition-property", transition, "important");
      element.style.setProperty("transition-duration", transition === "all" ? "2s" : "500ms, 500ms, 500ms, 2s", "important");
      element.style.setProperty("transition-delay", "0s", "important");
      element.style.setProperty("width", "var(--ae-anchor-target-width)", "important");
      element.style.setProperty("height", "var(--ae-anchor-target-height)", "important");
      element.style.opacity = ".5";
      element.getBoundingClientRect();
      window.opacityTransition = inspectAnimations().find(animation => animation.transitionProperty === "opacity");
      window.authoredTransitions = ["transition-property", "transition-duration", "transition-delay", "transition-timing-function", "width", "height"].map(property =>
        [element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
      element.setAttribute("data-ae-anchor-target", "b");
    }, { transition, noAnimations });
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
    await page.locator("#ref").evaluate(element => { element.scrollTop = 350; });
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
    const result = await page.locator("#indicator").evaluate(element => ({
      transitions: ["transition-property", "transition-duration", "transition-delay", "transition-timing-function", "width", "height"].map(property =>
        [element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]),
      expected: window.authoredTransitions,
      opacityRunning: window.opacityTransition?.playState === "running" && inspectAnimations().includes(window.opacityTransition),
      geometryTransitions: inspectAnimations().filter(animation => ["transform", "width", "height"].includes(animation.transitionProperty)).length,
      x: element.style.getPropertyValue("--ae-anchor-x"),
      elapsed: performance.now() - window.transitionStartedAt,
      opacityState: window.opacityTransition?.playState,
      effects: inspectAnimations().map(animation => [animation.transitionProperty, animation.playState, animation.currentTime]),
      width: element.getBoundingClientRect().width
    }));
    expect(result.transitions).toEqual(result.expected);
    expect(result.opacityRunning, JSON.stringify(result)).toBe(true);
    expect(result.geometryTransitions, JSON.stringify(result)).toBe(0);
    expect(result.x).toBe("300px");
    await aligned(page, "b");
    await page.locator("#ref").evaluate(element => { element.scrollTop = 450; });
    await aligned(page, "b");
    await page.waitForTimeout(600);
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
    await aligned(page, "b");
    await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "a"));
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => AelluxJs.updatePreferenceAttributesHTML({ reducedMotion: "reduced" }));
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
    expect(await page.evaluate(() => inspectAnimations().filter(animation => ["transform", "width", "height"].includes(animation.transitionProperty)).length)).toBe(0);
    await aligned(page, "a");
  });
}

test("scrolling an independent region and synthetic scroll notifications preserve a normal switch", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}
    <div id="independent" style="overflow:auto;width:50px;height:50px"><div style="height:800px"></div></div></div>`);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await page.evaluate(async () => {
    document.getElementById("independent").scrollTop = 200;
    window.dispatchEvent(new Event("scroll"));
    await AelluxJs.waitLayout.update(() => {});
    await AelluxJs.waitLayout.update(() => {});
  });
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await aligned(page, "b");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
});

for (const forceLegacy of [false, true]) test(`wheel scrolling a Scrollbox preserves the Anchor timeline (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, `${stage}<div id="ref" data-ae-scrollbox="native" style="overflow:auto">
    ${targets}${indicator.replace("500ms", "900ms")}<div style="height:1800px"></div></div>`, { forceLegacy });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await page.mouse.move(650, 450);
  await page.mouse.wheel(0, 180);
  await expect.poll(() => page.locator("#ref").evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await aligned(page, "b");
  await page.mouse.wheel(0, 180);
  await aligned(page, "b");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
  expect(await page.evaluate(() => switchProbe.operations.length)).toBe(1);
});

for (const forceLegacy of [false, true]) test(`scroll tracking settles without scrollend and subsequent changes animate (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, `${stage}<style>#ref{overflow:auto}</style><div id="ref">${targets}${indicator}
    <div style="height:2000px"></div></div>`, { forceLegacy, noScrollEnd: true });
  await aligned(page, "a");
  expect(await page.locator("#ref").evaluate(element => "onscrollend" in element)).toBe(false);
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await page.locator("#ref").evaluate(element => element.scrollTo({ top: 1300, behavior: "smooth" }));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
  await aligned(page, "b");
  await expect.poll(() => page.locator("#ref").evaluate(element => element.scrollTop)).toBe(1300);
  await page.evaluate(async () => { for (let frame = 0; frame < 8; frame++) await AelluxJs.waitLayout.update(() => {}); });
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "c"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await aligned(page, "c");
});

test("a target change between scroll measurement and publication never writes the older target", async ({ page }) => {
  await start(page, `${stage}<style>#ref{overflow:auto} #b{position:sticky;top:20px;margin:300px 0 0 300px}</style>
    <div id="ref">${targets}${indicator}<div style="height:1500px"></div></div>`);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  const values = await page.evaluate(async () => {
    const anchor = document.getElementById("indicator"), target = document.getElementById("b");
    const original = target.getBoundingClientRect;
    let armed = true;
    let fromWidth = null;
    target.getBoundingClientRect = function () {
      const result = original.call(this);
      if (armed) {
        armed = false;
        fromWidth = parseFloat(anchor.style.getPropertyValue("--ae-anchor-target-width"));
        anchor.setAttribute("data-ae-anchor-target", "c");
        document.getElementById("c").style.width = "125px";
      }
      return result;
    };
    const published = [];
    const observer = new MutationObserver(() => published.push(anchor.style.getPropertyValue("--ae-anchor-target-width")));
    observer.observe(anchor, { attributes: true, attributeFilter: ["style"] });
    document.getElementById("ref").scrollTo({ top: 350, behavior: "instant" });
    await $ae(anchor).anchor.update();
    await waitAnchor(() => switchProbe.operations.length === 2 && published.length > 1);
    target.getBoundingClientRect = original;
    observer.disconnect();
    return { published, fromWidth, targets: switchProbe.operations.map(operation => operation.target) };
  });
  expect(values.targets).toEqual(["b", "c"]);
  expect(values.published.length).toBeGreaterThan(0);
  expect(values.published.every(value => parseFloat(value) >= Math.min(values.fromWidth, 125) - .01 &&
    parseFloat(value) <= Math.max(values.fromWidth, 125) + .01)).toBe(true);
  await aligned(page, "c");
  await page.waitForTimeout(600);
  await aligned(page, "c");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
});

test("resize preserves the timeline; hidden, removed and reduced targets deactivate safely", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  expect(await page.evaluate(() => switchProbe.operations.length)).toBe(1);
  await aligned(page, "b");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "a"));
  await aligned(page, "a");
  await page.locator("#a").evaluate(element => { element.hidden = true; });
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.locator("#a").evaluate(element => { element.hidden = false; });
  await aligned(page, "a");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await aligned(page, "b");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
  await page.locator("#b").evaluate(element => element.remove());
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
});

const group = `<div id="group" data-ae-present-group data-ae-present-active="a"
  class="view-a">
  <section id="a" class="target" data-ae-present="opacity" data-ae-present-when="view-a">A</section>
  <section id="b" class="target" data-ae-present="opacity" data-ae-present-when="view-b" hidden
    style="--ae-pop-duration:700ms">B</section>
  <section id="c" class="target" data-ae-present="opacity" hidden>C</section></div>`;
const groupIndicator = indicator.replace('data-ae-anchor-target="a"', 'data-ae-anchor-target="group"');

for (const forceLegacy of [false, true]) test(`group-selected target still requires effective visibility (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, `${stage}<style>#a{transition:none!important}#a.transparent{opacity:0!important}</style>
    <div id="ref">${group}${groupIndicator}</div>`, { forceLegacy });
  await aligned(page, "a");
  await page.locator("#a").evaluate(element => element.classList.add("transparent"));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("a");
  await page.locator("#a").evaluate(element => element.classList.remove("transparent"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
  await aligned(page, "a");
});

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`group association, selection event, veto, precedence and remount (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<div id="ref">${group}${groupIndicator}</div>`, { mode, forceLegacy });
    await aligned(page, "a");
    expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("a");
    await page.evaluate(() => {
      window.changes = [];
      document.addEventListener("AelluxJsPresentGroupChange", event => window.changes.push({
        previous: event.detail.previous?.id || null, current: event.detail.current?.id || null,
        key: event.detail.key, hidden: event.detail.current?.hidden,
        expanded: event.detail.current?.getAttribute("aria-expanded")
      }));
      window.selection = $ae("group").present.show("b");
    });
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
    expect(await page.evaluate(() => window.changes[0])).toEqual({ previous: "a", current: "b", key: "b", hidden: false, expanded: "false" });
    await page.evaluate(() => window.selection);
    await aligned(page, "b");
    await page.evaluate(async () => {
      document.getElementById("c").addEventListener("AelluxJsBeforePop", event => event.preventDefault(), { once: true });
      await $ae("group").present.show("c");
    });
    expect(await page.evaluate(() => window.changes.length)).toBe(1);
    await aligned(page, "b");
    await page.evaluate(() => {
      const group = document.getElementById("group");
      group.className = "view-a";
      group.removeAttribute("data-ae-present-active");
    });
    await aligned(page, "a");
    await page.evaluate(() => $ae("group").present.show(""));
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
    await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "a"));
    // Retargeting an ordinary element leaves group selection independent.
    await expect(page.locator("#indicator")).toHaveAttribute("data-ae-anchor-target", "a");
    await page.evaluate(async () => {
      await AelluxJs.unmount(document.getElementById("group"), "present");
      await AelluxJs.mount(document.getElementById("group"), "present");
      document.getElementById("indicator").setAttribute("data-ae-anchor-target", "#group");
    });
    await aligned(page, "a");
  });
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) test(`multiple Anchors follow one group independently (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
  const inside = '<div id="other" data-ae-anchor="bottom-right:top-right" data-ae-anchor-match="width height" data-ae-anchor-target="#group" style="--ae-anchor-switch-duration:0ms"></div>';
  await start(page, `${stage}<div id="ref">${group.replace("</div>", inside + "</div>")}${groupIndicator}</div>`, { mode, forceLegacy });
  await aligned(page, "a");
  await expect.poll(async () => (await geometry(page, "other", "a")).width).toBe(80);
  await page.evaluate(() => $ae("group").present.show("b"));
  await aligned(page, "b");
  await expect.poll(async () => (await geometry(page, "other", "b")).width).toBe(160);
  await expect(page.locator("#other")).not.toHaveClass(/ae--anchor-switching/);
  await page.evaluate(() => $ae("group").present.show(""));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await expect(page.locator("#other")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(() => $ae("group").present.show("b"));
  await aligned(page, "b");
  await expect(page.locator("#other")).toHaveClass(/ae--anchored/);
  await page.locator("#other").evaluate(element => element.setAttribute("data-ae-anchor-target", "a"));
  await expect(page.locator("#other")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(() => $ae("group").present.show("a"));
  await expect(page.locator("#other")).toHaveClass(/ae--anchored/);
  await page.evaluate(() => document.getElementById("a").remove());
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(async () => {
    document.getElementById("group").insertAdjacentHTML("afterbegin", '<section id="a" class="target" data-ae-present="opacity" hidden>A replacement</section>');
    await AelluxJs.mount(document.getElementById("a"));
  });
  await aligned(page, "a");
  await page.locator("#other").evaluate(element => element.setAttribute("data-ae-anchor-target", "#group"));
  await expect.poll(async () => (await geometry(page, "other", "a")).width).toBe(80);
  await page.evaluate(async () => {
    document.getElementById("other").setAttribute("data-ae-anchor-target", "b");
    await AelluxJs.unmount(document.getElementById("other"), "anchor");
  });
  await expect(page.locator("#other")).not.toHaveClass(/ae--anchored|ae--anchor-switching/);
  expect(await page.locator("#other").evaluate(element => element.style.getPropertyValue("--ae-anchor-target-width"))).toBe("");
  await page.evaluate(() => $ae("group").present.show("b"));
  await aligned(page, "b");
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2023 || entry.code === 1119))).toEqual([]);
});

for (const forceLegacy of [false, true]) test(`Anchor retargets groups, selectors, recreated groups and plain elements (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, `${stage}<div id="ref">${group}${groupIndicator}
    <div id="alternate" class="follow" data-ae-present-group data-ae-present-active="d">
      <div id="d" class="target" data-ae-present="" style="left:400px;top:300px;width:60px;height:30px">D</div>
    </div></div>`, { forceLegacy });
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", ".follow"));
  await aligned(page, "d");
  // A change to the old group must not steal the Anchor back.
  await page.evaluate(() => $ae("group").present.show("b"));
  await aligned(page, "d");
  await page.locator("#alternate").evaluate(element => { element.id = "renamed"; });
  await aligned(page, "d");
  await page.locator("#renamed").evaluate(element => element.classList.remove("follow"));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.locator("#renamed").evaluate(element => element.classList.add("follow"));
  await aligned(page, "d");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "group"));
  await aligned(page, "b");
  await page.locator("#group").evaluate(element => element.removeAttribute("data-ae-present-group"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
  await expect.poll(async () => (await geometry(page, "indicator", "group")).width).toBe(750);
  await page.locator("#group").evaluate(element => element.setAttribute("data-ae-present-group", ""));
  await aligned(page, "b");
  await page.evaluate(() => document.getElementById("group").remove());
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(async markup => {
    document.getElementById("ref").insertAdjacentHTML("afterbegin", markup);
    await AelluxJs.mount(document.getElementById("group"));
  }, group);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "d"));
  await aligned(page, "d");
});

test("circular associations and incompatible positioning contexts are diagnosed", async ({ page }) => {
  await start(page, `${stage}<div id="ref"><div id="group" data-ae-present-group data-ae-present-active="self">
    <div id="self" data-ae-present data-ae-anchor="top-left:top-left" data-ae-anchor-target="group"></div></div>
    <div style="position:relative"><div id="nested" style="width:30px;height:30px"></div></div>
    <div id="indicator" data-ae-anchor="top-left:top-left" data-ae-anchor-target="nested"></div></div>`);
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 2023))).toBe(true);
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 1119))).toBe(true);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
});

test("Anchor loaded after Present reads the accepted selection without replaying group changes", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(html => { document.body.innerHTML = html; }, `${stage}<div id="ref">${group}${groupIndicator}</div>`);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    AelluxJs.ext("present", { loadStyle: true });
    AelluxJs.ext("anchor", { load: false, loadStyle: true });
    AelluxJs.init({ mode: "basic" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.present?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "present"));
  await page.evaluate(async () => {
    await $ae("group").present.show("b");
    await AelluxJs.wait("anchor");
    await AelluxJs.mount(document, "anchor");
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "anchor"));
  await aligned(page, "b");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
});

test("zero duration, CSS steps easing and unmount during a switch leave no delayed writes", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  await page.evaluate(() => {
    const element = document.getElementById("indicator");
    element.style.setProperty("--ae-anchor-switch-duration", "0ms");
    element.setAttribute("data-ae-anchor-target", "b");
  });
  await aligned(page, "b");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
  await page.evaluate(() => {
    const element = document.getElementById("indicator");
    element.style.setProperty("--ae-anchor-switch-duration", "600ms");
    element.style.setProperty("--ae-anchor-switch-ease", "steps(4,end)");
    element.setAttribute("data-ae-anchor-target", "a");
  });
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await expect.poll(() => page.locator("#indicator").evaluate(element => parseFloat(element.style.getPropertyValue("--ae-anchor-target-width")))).toBeLessThan(150);
  const stepFrames = await page.evaluate(() => switchProbe.operations.at(-1).frames.map(frame => frame.width));
  expect(stepFrames.every(width => [160, 140, 120, 100, 80].some(value => Math.abs(width - value) < .1))).toBe(true);
  const snapshot = await page.evaluate(async () => {
    const element = document.getElementById("indicator");
    await AelluxJs.unmount(element, "anchor");
    return element.getAttribute("style");
  });
  await page.waitForTimeout(800);
  expect(await page.locator("#indicator").getAttribute("style")).toBe(snapshot);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored|ae--anchor-switching/);
  await page.evaluate(() => AelluxJs.mount(document.getElementById("indicator"), "anchor"));
  await aligned(page, "a");
  await expect(page.locator("link[data-ae-full-style]")).toHaveCount(1);
  await page.evaluate(() => AelluxJs.destroy());
  await expect(page.locator("link[data-ae-full-style]")).toHaveCount(1);
});

test("matching rejects an in-flow Anchor before a containing layout can feed back", async ({ page }) => {
  await start(page, `<style>#indicator{position:relative}</style>
    <div id="ref" style="position:relative;display:inline-block">
      <div id="indicator" data-ae-anchor="bottom-right:bottom-right" data-ae-anchor-match="width height">Content</div></div>`);
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 2023))).toBe(true);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  expect(await page.locator("#indicator").evaluate(element => element.style.getPropertyValue("--ae-anchor-target-width"))).toBe("");
});

test("group switches under a low FPS ceiling follow the last selection and track its measured Pop", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${group}${groupIndicator}</div>`);
  await aligned(page, "a");
  await page.evaluate(() => {
    const anchor = document.getElementById("indicator"), member = document.getElementById("b");
    anchor.setAttribute("data-ae-maxfps", "10");
    member.setAttribute("data-ae-present", "width height");
  });
  // Remount the member to select Present's measured sizing strategy.
  await page.evaluate(async () => {
    const member = document.getElementById("b");
    await AelluxJs.unmount(member, "present");
    member.setAttribute("data-ae-present", "width height");
    await AelluxJs.mount(member, "present");
    const controller = $ae("group").present;
    window.latest = controller.show("b");
    controller.show("c");
    window.latest = controller.show("b");
  });
  await page.evaluate(() => window.latest);
  await aligned(page, "b");
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("b");
  await expect(page.locator("#indicator")).toHaveAttribute("data-ae-anchor-target", "group");
});
