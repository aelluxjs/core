import { expect, test } from "@playwright/test";

async function start(page, markup, forceLegacy, extensions, missing = []) {
  await page.goto("/tests/index.htm");
  await page.evaluate(({ markup, missing }) => {
    document.body.innerHTML = markup;
    for (const tag of missing) {
      const ctor = tag === "progress" ? HTMLProgressElement : HTMLMeterElement;
      Object.defineProperty(ctor.prototype, tag === "progress" ? "position" : "optimum",
        { configurable: true, value: undefined });
    }
  }, { markup, missing });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ forceLegacy, extensions }) => new Promise(resolve => {
    for (const name of extensions) aelluxJs.ext(name, { loadStyle: name === "scrollbox" });
    aelluxJs.on("Ready", resolve, { once: true });
    aelluxJs.init({ mode: "basic", forceLegacy });
  }), { forceLegacy, extensions });
}

async function observeUpdates(page) {
  await page.evaluate(() => {
    window.cssPublications = [];
    window.fallbackRenders = [];
    window.inLayoutUpdate = false;
    const scheduler = aelluxJs.waitLayout;
    const updating = callback => (...values) => {
      window.inLayoutUpdate = true;
      const controls = [...document.querySelectorAll("[data-ae-progress-fallback]")];
      const before = controls.map(element => element.lastElementChild.style.cssText);
      try {
        const result = callback(...values);
        controls.forEach((element, index) => {
          const bar = element.lastElementChild;
          if (bar && before[index] !== bar.style.cssText) window.fallbackRenders.push({
            id: element.id, width: bar.style.width, color: bar.style.backgroundColor,
            value: element.getAttribute("aria-valuenow"), update: window.inLayoutUpdate
          });
        });
        return result;
      }
      finally { window.inLayoutUpdate = false; }
    };
    aelluxJs.waitLayout = { ...scheduler, update(...args) {
      const index = typeof args[0] === "number" ? 1 : 0;
      args[index] = updating(args[index]);
      return scheduler.update(...args);
    }, sequence(id, ...stages) {
      return scheduler.sequence(id, ...stages.map(stage => ({ ...stage,
        ...(stage.update ? { update: updating(stage.update) } : {})
      })));
    } };
    const original = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(name, value, priority) {
      if (name === "--ae-snap-focus" || name.startsWith("--ae-scrollbar-") ||
        this === document.getElementById("elastic")?.style &&
        (name === "transform" || name === "transform-origin" || name.startsWith("margin-"))) {
        window.cssPublications.push({ name, value: String(value), update: window.inLayoutUpdate });
      }
      return original.call(this, name, value, priority);
    };
    // Use a deterministic slow shared cadence to expose event-handler bypasses.
    aelluxJs.waitLayout.setVisualFPSLimit(990001, 5);
  });
}

for (const forceLegacy of [false, true]) {
  test(`thumb dragging keeps scroll synchronous and publishes CSS in update (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<div id="box" data-ae-scrollbox="native" data-ae-scrollbar="vertical"
      style="width:200px;height:100px;overflow:auto;--ae-scrollbar-opacity-fade:1">
      <div style="height:1000px"></div></div>`, forceLegacy, ["scrollbox"]);
    const bar = page.locator("[data-ae-scrollbar-vertical]");
    await expect.poll(() => bar.evaluate(element =>
      parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size"))))
      .toBeGreaterThan(0);
    const rect = await bar.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + 4);
    await bar.evaluate(element => element.addEventListener("pointerdown", event => {
      window.dragPointerId = event.pointerId;
    }, { once: true }));
    await page.mouse.down();
    await observeUpdates(page);
    const immediate = await bar.evaluate((element, { x, y }) => {
      const box = document.getElementById("box");
      const before = element.style.getPropertyValue("--ae-scrollbar-thumb-position");
      for (const offset of [20, 40, 60]) element.dispatchEvent(new PointerEvent("pointermove", {
        bubbles: true, cancelable: true, pointerId: window.dragPointerId, pointerType: "mouse", buttons: 1,
        clientX: x, clientY: y + offset
      }));
      return { top: box.scrollTop, before,
        after: element.style.getPropertyValue("--ae-scrollbar-thumb-position"),
        writes: window.cssPublications.length };
    }, { x: rect.x + rect.width / 2, y: rect.y + 4 });
    expect(immediate.top).toBeGreaterThan(0);
    expect(immediate.after).toBe(immediate.before);
    expect(immediate.writes).toBe(0);
    await expect.poll(() => bar.evaluate(element =>
      parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-position"))))
      .toBeCloseTo(60, 1);
    expect(await page.evaluate(() => window.cssPublications.length > 0 &&
      window.cssPublications.every(write => write.update))).toBe(true);
    await page.mouse.up();
  });

  test(`scrollbar and Snap CSS bursts publish the latest position in update (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<div id="box" data-ae-scrollbox="native" data-ae-scrollbar="vertical"
      data-ae-scrollbox-snap="vertical" style="width:200px;height:100px;overflow:auto">
      ${[0, 1, 2].map(index => `<article id="item${index}" data-ae-snap-item
        style="height:100px;--ae-snap-focus:.25!important"></article>`).join("")}</div>`,
    forceLegacy, ["scrollbox", "scrollbox-snap"]);
    await expect.poll(() => page.locator("#item0").evaluate(e => Number(e.style.getPropertyValue("--ae-snap-focus"))))
      .toBe(1);
    await page.locator("#box").evaluate(e => e.style.setProperty("scroll-snap-type", "none", "important"));
    await observeUpdates(page);
    const immediate = await page.evaluate(() => {
      const box = document.getElementById("box");
      const bar = box.querySelector("[data-ae-scrollbar-vertical]");
      const before = bar.style.getPropertyValue("--ae-scrollbar-thumb-position");
      for (const top of [40, 100, 200]) {
        box.scrollTop = top;
        box.dispatchEvent(new Event("scroll"));
      }
      return { before, after: bar.style.getPropertyValue("--ae-scrollbar-thumb-position"),
        focus: Number(document.getElementById("item2").style.getPropertyValue("--ae-snap-focus")),
        writes: window.cssPublications.length };
    });
    expect(immediate.after).toBe(immediate.before);
    expect(immediate.focus).toBe(0);
    expect(immediate.writes).toBe(0);
    await expect.poll(() => page.locator("#item2").evaluate(e => Number(e.style.getPropertyValue("--ae-snap-focus"))))
      .toBe(1);
    await expect.poll(() => page.locator("[data-ae-scrollbar-vertical]").evaluate(e =>
      parseFloat(e.style.getPropertyValue("--ae-scrollbar-thumb-position")))).toBeGreaterThan(60);
    expect(await page.evaluate(() => window.cssPublications.length > 0 &&
      window.cssPublications.every(write => write.update))).toBe(true);

    const restored = await page.evaluate(async () => {
      const box = document.getElementById("box");
      box.scrollTop = 40;
      box.dispatchEvent(new Event("scroll"));
      await aelluxJs.unmount(box, "scrollbox-snap");
      await aelluxJs.unmount(box, "scrollbox");
      return [...box.querySelectorAll("article")].map(e => e.getAttribute("style"));
    });
    await page.waitForTimeout(450);
    expect(await page.locator("article").evaluateAll(elements => elements.map(e => e.getAttribute("style"))))
      .toEqual(restored);
    expect(await page.locator("article").evaluateAll(elements => elements.every(e =>
      Number(e.style.getPropertyValue("--ae-snap-focus")) === .25 &&
      e.style.getPropertyPriority("--ae-snap-focus") === "important"))).toBe(true);
  });

  test(`elastic CSS follows update and interruption cannot revive pending pressure (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<div id="box" data-ae-scrollbox="native" style="width:100px;height:100px;overflow:auto">
      <div id="elastic" data-ae-scrollbox-elastic style="width:100px;height:300px;transform:translateZ(0);margin-bottom:4px">
        <button id="control">Stop</button></div></div>`, forceLegacy, ["scrollbox"]);
    await observeUpdates(page);
    const immediate = await page.evaluate(() => {
      const box = document.getElementById("box"), wrapper = document.getElementById("elastic");
      const before = wrapper.style.transform;
      for (let i = 0; i < 3; i++) box.dispatchEvent(new WheelEvent("wheel",
        { bubbles: true, cancelable: true, deltaY: -60 }));
      return { before, after: wrapper.style.transform, writes: window.cssPublications.length };
    });
    expect(immediate.after).toBe(immediate.before);
    expect(immediate.writes).toBe(0);
    await expect.poll(() => page.evaluate(() => window.cssPublications.filter(write =>
      write.name === "transform" && write.value.startsWith("scale(")).length), { intervals: [10, 20] })
      .toBeGreaterThan(1);
    expect(await page.evaluate(() => window.cssPublications.every(write => write.update))).toBe(true);
    const restored = await page.evaluate(() => {
      document.getElementById("control").dispatchEvent(new PointerEvent("pointerdown",
        { bubbles: true, pointerType: "mouse", pointerId: 810, button: 0, buttons: 1, isPrimary: true }));
      return document.getElementById("elastic").getAttribute("style");
    });
    expect(await page.locator("#elastic").evaluate(e => e.style.transform)).toBe(immediate.before);
    await page.waitForTimeout(450);
    expect(await page.locator("#elastic").getAttribute("style")).toBe(restored);
    await expect(page.locator("#elastic")).not.toHaveClass(/ae--scrollbox-elastic-release/);
  });
}

test("Legacy Progress keeps values synchronous and publishes coalesced fallback CSS in update", async ({ page }) => {
  await start(page, '<progress id="progress" value=".1"></progress>', true, ["progress"], ["progress"]);
  const bar = page.locator("#progress > span");
  await expect.poll(() => bar.evaluate(e => e.style.width)).toBe("10%");
  await observeUpdates(page);
  const immediate = await page.evaluate(() => {
    const element = document.getElementById("progress");
    for (const value of [.2, .4, .8]) element.value = value;
    return { value: element.value, attribute: element.getAttribute("value"),
      width: element.firstElementChild.style.width };
  });
  expect(immediate).toEqual({ value: .8, attribute: "0.8", width: "10%" });
  await expect.poll(() => bar.evaluate(e => e.style.width)).toBe("80%");
  expect(await page.evaluate(() => window.fallbackRenders)).toEqual([
    { id: "progress", width: "80%", color: "rgb(40, 120, 181)", value: "0.8", update: true }
  ]);
  const detached = await page.evaluate(async () => {
    const element = document.getElementById("progress"), bar = element.firstElementChild;
    element.value = .3;
    await aelluxJs.unmount(element, "progress");
    window.detachedFallback = bar;
    return bar.getAttribute("style");
  });
  await page.waitForTimeout(450);
  expect(await page.evaluate(() => window.detachedFallback.getAttribute("style"))).toBe(detached);
  await expect(page.locator("#progress > span")).toHaveCount(0);
});

test("Legacy meter attribute bursts publish the latest width, color and ARIA together in update", async ({ page }) => {
  await start(page, '<meter id="meter" min="0" max="100" low="20" high="80" optimum="50" value="50"></meter>',
    true, ["progress"], ["meter"]);
  const bar = page.locator("#meter > span");
  await expect.poll(() => bar.evaluate(element => element.style.width)).toBe("50%");
  await observeUpdates(page);
  const immediate = await page.evaluate(() => {
    const element = document.getElementById("meter");
    for (const [name, value] of [["value", "70"], ["value", "80"], ["max", "200"],
      ["high", "60"], ["optimum", "10"]]) element.setAttribute(name, value);
    return { value: element.value, max: element.max, width: element.firstElementChild.style.width,
      aria: element.getAttribute("aria-valuenow") };
  });
  expect(immediate).toEqual({ value: 80, max: 200, width: "50%", aria: "50" });
  await expect.poll(() => bar.evaluate(element => element.style.width)).toBe("40%");
  expect(await page.evaluate(() => window.fallbackRenders)).toEqual([
    { id: "meter", width: "40%", color: "rgb(188, 49, 49)", value: "80", update: true }
  ]);
  await expect(page.locator("#meter")).toHaveAttribute("aria-valuemax", "200");
});
