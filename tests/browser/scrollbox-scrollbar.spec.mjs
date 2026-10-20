import { expect, test } from "@playwright/test";

async function setup(page, markup) {
  const usesSnap = markup.includes("data-ae-scrollbox-snap");
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ html, usesSnap }) => {
    document.body.innerHTML = html;
    AelluxJs.ext("scrollbox");
    if (usesSnap) AelluxJs.ext("scrollbox-snap");
  }, { html: markup, usesSnap });
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  if (usesSnap) await page.addScriptTag({ url: "/src/aellux.ext.scrollbox-snap.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
  if (usesSnap)
    await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollboxSnap?.initialized)).toBe(true);
}

test("custom scrollbar stays over the viewport and supports track click and thumb drag", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="vertical"
    style="width:120px;height:120px;overflow-y:auto;overflow-x:hidden;
      --ae-scrollbar-track-color:rgb(70, 80, 90);--ae-scrollbar-opacity-fade:1">
    <div style="height:600px;width:100px"></div>
  </div>`);
  const box = page.locator("#box");
  const track = page.locator("#box > [data-ae-scrollbar-vertical]");
  await expect(track).toHaveCount(1);
  await expect(box).toHaveClass(/ae--native-sb-hide/);
  await page.evaluate(() => document.getElementById("box").scrollTop = 80);
  await expect.poll(async () => {
    const a = await box.boundingBox(), b = await track.boundingBox();
    return Math.round(b.y - a.y);
  }).toBe(0);
  const start = await track.boundingBox();
  await page.mouse.click(start.x + 4, start.y + 80);
  await expect.poll(() => box.evaluate(element => element.scrollTop)).toBeGreaterThan(80);
  await expect.poll(() => track.evaluate(element => {
    const position = Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-position"));
    const size = Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size"));
    return Math.abs(position + size / 2 - 80);
  })).toBeLessThan(1.5);
  const thumb = await track.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size")));
  const thumbPosition = await track.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-position")));
  const verticalThumb = await track.evaluate(element => {
    const before = getComputedStyle(element, "::before");
    return { size: Number.parseFloat(before.height),
      position: new DOMMatrixReadOnly(before.transform).m42 };
  });
  expect(verticalThumb.size).toBeCloseTo(thumb, 1);
  expect(verticalThumb.position).toBeCloseTo(thumbPosition, 0);
  const rect = await track.boundingBox();
  await page.mouse.move(rect.x + 4, rect.y + thumbPosition + thumb / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + 4, rect.y + 95, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => box.evaluate(element => element.scrollTop)).toBeGreaterThan(300);
  await expect(track).toHaveCSS("opacity", "1");
  await box.evaluate(element => element.style.setProperty("--ae-scrollbar-opacity-fade", "0"));
  await page.mouse.move(rect.x + 140, rect.y + 140);
  await expect(track).toHaveCSS("opacity", "0");
});

test("transparent or invisible scrollbar tracks ignore track clicks", async ({ page }) => {
  await setup(page, `<div id="transparent" data-ae-scrollbox data-ae-scrollbar="vertical"
    style="width:120px;height:120px;overflow-y:auto;overflow-x:hidden;
      --ae-scrollbar-opacity-fade:1">
    <div style="height:600px;width:100px"></div>
  </div>
  <div id="invisible" data-ae-scrollbox data-ae-scrollbar="vertical"
    style="width:120px;height:120px;overflow-y:auto;overflow-x:hidden;
      --ae-scrollbar-track-color:rgb(70, 80, 90);--ae-scrollbar-opacity-fade:0;
      --ae-scrollbar-opacity-visible:0">
    <div style="height:600px;width:100px"></div>
  </div>`);
  for (const id of ["transparent", "invisible"]) {
    const box = page.locator(`#${id}`);
    const track = box.locator(":scope > [data-ae-scrollbar-vertical]");
    const rect = await track.boundingBox();
    await page.mouse.click(rect.x + 4, rect.y + 90);
    await page.waitForTimeout(50);
    expect(await box.evaluate(element => element.scrollTop)).toBe(0);
  }
});

test("sticky scrollbar tracks remain fixed without changing the scroll area", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="x y"
    style="width:200px;height:100px;overflow:auto">
    <div id="content" style="width:800px;height:400px"></div>
  </div>`);
  const result = await page.evaluate(() => {
    const box = document.getElementById("box");
    const vertical = box.querySelector(":scope > [data-ae-scrollbar-vertical]");
    const horizontal = box.querySelector(":scope > [data-ae-scrollbar-horizontal]");
    const measure = () => {
      const rect = box.getBoundingClientRect();
      const v = vertical.getBoundingClientRect();
      const h = horizontal.getBoundingClientRect();
      return { vertical: [v.right - rect.left, v.top - rect.top],
        horizontal: [h.left - rect.left, h.bottom - rect.top] };
    };
    const before = measure();
    const size = [box.scrollWidth, box.scrollHeight];
    box.scrollLeft = 100;
    box.scrollTop = 70;
    return { before, after: measure(), size,
      order: [box.firstElementChild === vertical, box.lastElementChild === horizontal] };
  });
  expect(result.size).toEqual([800, 400]);
  expect(result.order).toEqual([true, true]);
  expect(result.after.vertical).toEqual(result.before.vertical);
  expect(result.after.horizontal).toEqual(result.before.horizontal);
});

test("custom scrollbar opacities inherit inline values and respond to changes", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="v h"
    style="width:120px;height:120px;overflow:auto">
    <div style="width:300px;height:300px"></div>
  </div>`);
  const box = page.locator("#box");
  const bars = box.locator(":scope > [data-ae-scrollbar-vertical], :scope > [data-ae-scrollbar-horizontal]");
  await expect(bars).toHaveCount(2);
  await page.mouse.move(500, 500);
  await expect.poll(() => bars.evaluateAll(elements => elements.map(element =>
    getComputedStyle(element).opacity))).toEqual(["0", "0"]);

  await box.evaluate(element => {
    element.style.setProperty("--ae-scrollbar-opacity-fade", "0.35");
    element.style.setProperty("--ae-scrollbar-opacity-visible", "0.8");
  });
  await expect.poll(() => bars.evaluateAll(elements => elements.map(element =>
    getComputedStyle(element).opacity))).toEqual(["0.35", "0.35"]);
  const rect = await box.boundingBox();
  await page.mouse.move(rect.x + 20, rect.y + 20);
  await expect.poll(() => bars.evaluateAll(elements => elements.map(element =>
    getComputedStyle(element).opacity))).toEqual(["0.8", "0.8"]);

  await page.mouse.move(500, 500);
  await expect.poll(() => bars.evaluateAll(elements => elements.map(element =>
    getComputedStyle(element).opacity))).toEqual(["0.35", "0.35"]);
  await box.evaluate(element => element.style.setProperty("--ae-scrollbar-opacity-fade", "1"));
  await expect.poll(() => bars.evaluateAll(elements => elements.map(element =>
    getComputedStyle(element).opacity))).toEqual(["1", "1"]);
});

test("custom scrollbar inherits inline colors, thumb radius, and thickness", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="v h"
    style="width:120px;height:120px;overflow:auto;
      --ae-scrollbar-thumb-color:rgb(10, 20, 30);
      --ae-scrollbar-thumb-hover-color:rgb(40, 50, 60);
      --ae-scrollbar-track-color:rgb(70, 80, 90);
      --ae-scrollbar-thumb-radius:6px;
      --ae-scrollbar-size:14px">
    <div style="width:300px;height:300px"></div>
  </div>`);
  const box = page.locator("#box");
  const vertical = box.locator(":scope > [data-ae-scrollbar-vertical]");
  const horizontal = box.locator(":scope > [data-ae-scrollbar-horizontal]");
  const values = async bar => bar.evaluate(element => {
    const style = getComputedStyle(element);
    const thumb = getComputedStyle(element, "::before");
    const rect = element.getBoundingClientRect();
    const boxRect = element.parentElement.getBoundingClientRect();
    return { color: thumb.backgroundColor, track: style.backgroundColor,
      radius: thumb.borderRadius, width: rect.width, height: rect.height,
      right: Math.round(boxRect.right - rect.right),
      bottom: Math.round(boxRect.bottom - rect.bottom) };
  });
  await expect.poll(() => values(vertical)).toMatchObject({
    color: "rgb(10, 20, 30)", track: "rgb(70, 80, 90)", radius: "6px",
    width: 14, right: 0
  });
  await expect.poll(() => values(horizontal)).toMatchObject({
    color: "rgb(10, 20, 30)", track: "rgb(70, 80, 90)", radius: "6px",
    height: 14, bottom: 0
  });
  const rect = await vertical.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 10);
  await expect.poll(() => values(vertical)).toMatchObject({ color: "rgb(40, 50, 60)" });
});

test("custom scrollbar uses CanvasText fallbacks when colors are unset", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="vertical"
    style="width:120px;height:120px;overflow-y:auto">
    <div style="height:300px"></div>
  </div>`);
  const bar = page.locator("#box > [data-ae-scrollbar-vertical]");
  const colors = await bar.evaluate(element => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = "color-mix(in srgb, CanvasText 50%, transparent)";
    document.body.appendChild(probe);
    const expected = getComputedStyle(probe).backgroundColor;
    const actual = getComputedStyle(element, "::before").backgroundColor;
    probe.remove();
    return { actual, expected };
  });
  expect(colors.actual).toBe(colors.expected);
  const rect = await bar.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 10);
  const hoverColors = await bar.evaluate(element => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = "color-mix(in srgb, CanvasText 90%, transparent)";
    document.body.appendChild(probe);
    const expected = getComputedStyle(probe).backgroundColor;
    const actual = getComputedStyle(element, "::before").backgroundColor;
    probe.remove();
    return { actual, expected };
  });
  expect(hoverColors.actual).toBe(hoverColors.expected);
});

test("snap pauses during scrollbar thumb drag while focus variables update", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbox-snap
    data-ae-scrollbar="horizontal"
    style="width:120px;height:120px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:360px">
      <div data-ae-snap-item style="flex:none;width:120px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:120px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:120px;height:100px"></div>
    </div>
  </div>`);

  const box = page.locator("#box");
  const track = page.locator("#box > [data-ae-scrollbar-horizontal]");
  const rect = await track.boundingBox();
  const thumb = await track.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size")));

  await page.mouse.move(rect.x + thumb / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await expect(box).toHaveCSS("scroll-snap-type", "none");

  await page.mouse.move(rect.x + thumb / 2 + 22, rect.y + rect.height / 2,
    { steps: 4 });
  await expect.poll(() => box.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await expect.poll(() => box.evaluate(element =>
    Number.parseFloat(element.querySelector("[data-ae-snap-item]")
      .style.getPropertyValue("--ae-snap-viewport")))).toBeLessThan(0);

  await page.mouse.up();
  await expect(box).toHaveCSS("scroll-snap-type", "x mandatory");
});

test("scrollbar none hides native bars without creating custom bars", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="none"
    style="width:120px;height:120px;overflow:auto">
    <div style="width:300px;height:300px"></div>
  </div>`);

  const box = page.locator("#box");
  await expect(box).toHaveClass(/ae--native-sb-hide/);
  await expect(box.locator("[data-ae-scrollbar-horizontal], [data-ae-scrollbar-vertical]"))
    .toHaveCount(0);
  await box.evaluate(element => element.setAttribute("data-ae-scrollbar", "horizontal"));
  await expect(box.locator("[data-ae-scrollbar-horizontal]")).toHaveCount(1);
  await box.evaluate(element => element.removeAttribute("data-ae-scrollbar"));
  await expect(box).not.toHaveClass(/ae--native-sb-hide/);
});

test("touch can drag a snap scrollbar without activating a snap flick", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "CDP touch input is Chromium-only");
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbox-snap
    data-ae-scrollbar="horizontal"
    style="width:120px;height:120px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:360px">
      <div data-ae-snap-item style="flex:none;width:120px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:120px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:120px;height:100px"></div>
    </div>
  </div>`);

  const box = page.locator("#box");
  const track = page.locator("#box > [data-ae-scrollbar-horizontal]");
  const rect = await track.boundingBox();
  const thumb = await track.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size")));
  const x = rect.x + thumb / 2, y = rect.y + rect.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart", touchPoints: [{ x, y, id: 1 }]
  });
  await expect(box).toHaveCSS("scroll-snap-type", "none");
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove", touchPoints: [{ x: x + 25, y, id: 1 }]
  });
  await expect.poll(() => box.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd", touchPoints: []
  });
  await expect(box).toHaveCSS("scroll-snap-type", "x mandatory");
});

for (const axis of ["vertical", "horizontal"]) {
  test(`${axis} scrollbar drag excludes pointer drag scroll`, async ({ page }) => {
    await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbar="${axis}"
      style="width:120px;height:120px;overflow:${axis === "vertical" ? "hidden auto" : "auto hidden"}">
      <div id="content" style="width:600px;height:600px"></div>
    </div>`);
    const box = page.locator("#box");
    const track = page.locator(`#box > [data-ae-scrollbar-${axis}]`);
    await expect(track).toHaveCount(1);
    await box.evaluate(element => {
      window.scrollbarPdsActivations = 0;
      window.scrollbarTrackOffsets = [];
      new MutationObserver(() => {
        if (element.classList.contains("ae--pointerscrolling"))
          window.scrollbarPdsActivations++;
      }).observe(element, { attributes: true, attributeFilter: ["class"] });
    });
    await track.evaluate((element, axis) => element.addEventListener("pointermove", () => {
      const box = element.parentElement.getBoundingClientRect();
      const bar = element.getBoundingClientRect();
      window.scrollbarTrackOffsets.push(axis === "vertical" ? bar.top - box.top : bar.left - box.left);
    }), axis);
    const rect = await track.boundingBox();
    const size = await track.evaluate(element =>
      Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size")));
    const x = axis === "vertical" ? rect.x + rect.width / 2 : rect.x + size / 2;
    const y = axis === "vertical" ? rect.y + size / 2 : rect.y + rect.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + (axis === "horizontal" ? 30 : 0),
      y + (axis === "vertical" ? 30 : 0), { steps: 3 });
    const duringDrag = await box.evaluate((element, axis) => {
      const content = element.querySelector("#content");
      const rect = content.getBoundingClientRect();
      const x = rect.left + 40, y = rect.top + 40;
      content.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, cancelable: true, isPrimary: true, pointerId: 901,
        pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
      }));
      window.dispatchEvent(new PointerEvent("pointermove", {
        bubbles: true, cancelable: true, isPrimary: true, pointerId: 901,
        pointerType: "mouse", buttons: 1,
        clientX: x - (axis === "horizontal" ? 40 : 0),
        clientY: y - (axis === "vertical" ? 40 : 0)
      }));
      return {
        pds: element.classList.contains("ae--pointerscrolling"),
        scroll: axis === "vertical" ? element.scrollTop : element.scrollLeft
      };
    }, axis);
    expect(duringDrag.pds).toBe(false);
    expect(duringDrag.scroll).toBeGreaterThan(0);
    await page.mouse.up();
    await expect(box).not.toHaveClass(/ae--pointerscrolling/);
    expect(await page.evaluate(() => window.scrollbarPdsActivations)).toBe(0);
    expect(Math.max(...await page.evaluate(() =>
      window.scrollbarTrackOffsets.map(Math.abs)))).toBeLessThan(2);
  });
}

test("mouse and pointer hover keep scrollbars visible independently", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="v"
    style="width:120px;height:120px;overflow-y:auto">
    <div style="height:500px"></div>
  </div>`);
  const box = page.locator("#box");
  const track = page.locator("#box > [data-ae-scrollbar-vertical]");
  const emit = (name, pointerType = "") => box.evaluate((element, { name, pointerType }) => {
    const event = name.startsWith("pointer") ?
      new PointerEvent(name, { pointerType }) : new MouseEvent(name);
    element.dispatchEvent(event);
  }, { name, pointerType });
  await expect(track).toHaveCSS("opacity", "0");
  await emit("pointerenter", "pen");
  await expect(track).toHaveCSS("opacity", "1");
  await emit("mouseenter");
  await emit("pointerleave", "pen");
  await expect(track).toHaveCSS("opacity", "1");
  await emit("mouseleave");
  await expect(track).toHaveCSS("opacity", "0");
  await emit("mouseenter");
  await emit("pointerenter", "mouse");
  await emit("mouseleave");
  await expect(track).toHaveCSS("opacity", "1");
  await emit("pointerleave", "mouse");
  await expect(track).toHaveCSS("opacity", "0");
});

test("desktop pointer movement restores a scrollbar when hover state was lost inside the box", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="v"
    style="width:120px;height:120px;overflow-y:auto">
    <div id="content" style="height:500px"></div>
  </div>`);
  const box = page.locator("#box");
  const track = box.locator("[data-ae-scrollbar-vertical]");
  await box.evaluate(element => {
    element.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    element.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
  });
  await expect(track).toHaveCSS("opacity", "0");

  await page.locator("#content").evaluate(element => element.dispatchEvent(
    new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" })));
  await expect(track).toHaveCSS("opacity", "1");

  await box.evaluate(element =>
    element.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" })));
  await page.locator("#content").evaluate(element => element.dispatchEvent(
    new PointerEvent("pointermove", { bubbles: true, pointerType: "touch" })));
  await expect(track).toHaveCSS("opacity", "0");

  await page.locator("#content").evaluate(element => element.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" })));
  await expect(track).toHaveCSS("opacity", "1");
  await page.locator("#content").evaluate(element => element.dispatchEvent(
    new PointerEvent("pointerup", { bubbles: true, pointerType: "mouse" })));
  await expect(track).toHaveCSS("opacity", "0");
});

test("grab cursor keeps its scrollbar visible after hover state expires", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbar="v"
    style="width:120px;height:120px;overflow-y:auto">
    <div id="content" style="height:500px"></div>
  </div>`);
  const box = page.locator("#box");
  const track = box.locator("[data-ae-scrollbar-vertical]");
  await page.locator("#content").evaluate(element => element.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" })));
  await expect(box).toHaveCSS("cursor", "grab");
  await expect(track).toHaveCSS("opacity", "1");

  await box.evaluate(element => element.dispatchEvent(
    new PointerEvent("pointerleave", { pointerType: "mouse" })));
  await page.waitForTimeout(450);
  await expect(box).toHaveCSS("cursor", "grab");
  await expect(track).toHaveCSS("opacity", "1");

  await box.evaluate(element => element.dispatchEvent(
    new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse" })));
  await expect(box).not.toHaveCSS("cursor", "grab");
  await expect(track).toHaveCSS("opacity", "0");
});

test("mobile tap leaves the scrollbar hidden and native scroll reveals it", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium");
  const context = await browser.newContext({ hasTouch: true, isMobile: true,
    viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="v"
      style="width:120px;height:120px;overflow-y:auto">
      <div id="content" style="height:500px"></div>
    </div>`);
    const box = page.locator("#box");
    const track = box.locator("[data-ae-scrollbar-vertical]");
    await expect(track).toHaveCSS("opacity", "0");
    await page.locator("#content").evaluate(element => element.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" })));
    await page.locator("#content").evaluate(element => element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerType: "touch" })));
    await page.waitForTimeout(200);
    await expect(track).toHaveCSS("opacity", "0");

    await box.evaluate(element => { element.scrollTop = 80; });
    await expect(track).toHaveCSS("opacity", "1");
    await expect(track).toHaveCSS("opacity", "0");
  } finally {
    await context.close();
  }
});

test("mobile scroll reveals a horizontal scrollbar at its current position", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium");
  const context = await browser.newContext({ hasTouch: true, isMobile: true,
    viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="horizontal"
      style="width:120px;height:120px;overflow-x:auto;overflow-y:hidden">
      <div id="content" style="width:400px;height:100px"></div>
    </div>`);
    const result = await page.evaluate(() => {
      const box = document.getElementById("box");
      const bar = box.querySelector("[data-ae-scrollbar-horizontal]");
      box.scrollTo({ left: 80, behavior: "instant" });
      box.dispatchEvent(new Event("scroll"));
      const boxRect = box.getBoundingClientRect();
      const barRect = bar.getBoundingClientRect();
      return { scrollLeft: box.scrollLeft, offset: barRect.left - boxRect.left,
        opacity: getComputedStyle(bar).opacity };
    });
    expect(result.scrollLeft).toBe(80);
    expect(Math.abs(result.offset)).toBeLessThan(1);
    await expect(page.locator("#box > [data-ae-scrollbar-horizontal]"))
      .toHaveCSS("opacity", "1");
  } finally {
    await context.close();
  }
});

test("desktop scroll updates horizontal scrollbar alignment immediately", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="horizontal"
    style="width:120px;height:120px;overflow-x:auto;overflow-y:hidden">
    <div style="width:400px;height:100px"></div>
  </div>`);
  const result = await page.evaluate(() => {
    const box = document.getElementById("box");
    const bar = box.querySelector(":scope > [data-ae-scrollbar-horizontal]");
    box.scrollTo({ left: 80, behavior: "instant" });
    box.dispatchEvent(new Event("scroll"));
    return { scrollLeft: box.scrollLeft,
      offset: bar.getBoundingClientRect().left - box.getBoundingClientRect().left };
  });
  expect(result.scrollLeft).toBe(80);
  expect(Math.abs(result.offset)).toBeLessThan(1);
});

test("mobile horizontal drag keeps the scrollbar aligned on every frame", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium");
  const context = await browser.newContext({ hasTouch: true, isMobile: true,
    viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbox-snap
      data-ae-scrollbar="horizontal"
      style="width:300px;height:120px;overflow-x:auto;overflow-y:hidden">
      <div data-ae-scrollbox-elastic style="display:inline-flex">
        <div data-ae-snap-item style="flex:none;width:300px;height:100px"></div>
        <div data-ae-snap-item style="flex:none;width:300px;height:100px"></div>
        <div data-ae-snap-item style="flex:none;width:300px;height:100px"></div>
      </div>
    </div>`);
    const box = page.locator("#box");
    await expect(box.locator(":scope > [data-ae-scrollbar-horizontal]"))
      .toHaveCSS("display", "block");
    await page.evaluate(() => {
      window.__scrollbarOffsets = [];
      window.__sampleScrollbar = true;
      const box = document.getElementById("box");
      const bar = box.querySelector(":scope > [data-ae-scrollbar-horizontal]");
      function sample() {
        if (!window.__sampleScrollbar) return;
        window.__scrollbarOffsets.push({ scrollLeft: box.scrollLeft,
          offset: bar.getBoundingClientRect().left - box.getBoundingClientRect().left });
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    const rect = await box.boundingBox();
    const x = rect.x + rect.width * .7;
    const y = rect.y + rect.height * .5;
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart",
      touchPoints: [{ x, y, id: 1 }] });
    for (let i = 1; i <= 12; i++) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove",
        touchPoints: [{ x: x - i * 12, y, id: 1 }] });
      await page.waitForTimeout(16);
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(200);
    const samples = await page.evaluate(() => {
      window.__sampleScrollbar = false;
      return window.__scrollbarOffsets;
    });
    expect(Math.max(...samples.map(sample => sample.scrollLeft))).toBeGreaterThan(50);
    expect(Math.max(...samples.map(sample => Math.abs(sample.offset)))).toBeLessThan(1);
  } finally {
    await context.close();
  }
});

test("touch release timeout preserves an active desktop pointer hover", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="v"
    style="width:120px;height:120px;overflow-y:auto">
    <div id="content" style="height:500px"></div>
  </div>`);
  const box = page.locator("#box");
  const track = box.locator("[data-ae-scrollbar-vertical]");
  await box.evaluate(element => {
    element.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    const content = element.querySelector("#content");
    content.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerType: "touch"
    }));
    content.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, pointerType: "touch"
    }));
  });
  await expect(track).toHaveCSS("opacity", "1");
  await page.waitForTimeout(1150);
  await expect(track).toHaveCSS("opacity", "1");
  await box.evaluate(element =>
    element.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" })));
  await expect(track).toHaveCSS("opacity", "0");
});

test("mouseover and pointer down use independent visibility timers", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="v"
    style="width:120px;height:120px;overflow-y:auto">
    <div id="content" style="height:500px"></div>
  </div>`);
  const box = page.locator("#box");
  const track = box.locator("[data-ae-scrollbar-vertical]");
  await box.evaluate(element => {
    const content = element.querySelector("#content");
    content.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    content.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerType: "mouse"
    }));
    content.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, pointerType: "mouse"
    }));
    content.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  });
  await expect(track).toHaveCSS("opacity", "1");
  await page.waitForTimeout(450);
  await expect(track).toHaveCSS("opacity", "1");
  await expect(track).toHaveCSS("opacity", "0");

  await box.evaluate(element => {
    const content = element.querySelector("#content");
    content.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    content.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  });
  await expect(track).toHaveCSS("opacity", "1");
  await expect(track).toHaveCSS("opacity", "0");
});

test("PDS hide timer keeps a scrollbar visible while mouse hover remains active", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbar="v"
    style="width:120px;height:120px;overflow-y:auto">
    <div style="height:500px"></div>
  </div>`);
  const box = page.locator("#box");
  const track = page.locator("#box > [data-ae-scrollbar-vertical]");
  const result = await box.evaluate(element => {
    element.dispatchEvent(new MouseEvent("mouseenter"));
    const content = element.querySelector(":scope > div:not([data-ae-scrollbar-vertical])");
    const rect = content.getBoundingClientRect();
    const x = rect.left + 40, y = rect.top + 70;
    content.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 901,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 901,
      pointerType: "mouse", buttons: 1, clientX: x, clientY: y - 40
    }));
    const active = element.classList.contains("ae--pointerscrolling");
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 901,
      pointerType: "mouse", button: 0, buttons: 0, clientX: x, clientY: y - 40
    }));
    return { active, ended: !element.classList.contains("ae--pointerscrolling") };
  });
  expect(result).toEqual({ active: true, ended: true });
  await expect(track).toHaveCSS("opacity", "1");
  await page.waitForTimeout(1150);
  await expect(track).toHaveCSS("opacity", "1");
  await box.evaluate(element => {
    element.dispatchEvent(new MouseEvent("mouseleave"));
    element.dispatchEvent(new PointerEvent("pointerout", {
      bubbles: true, pointerType: "mouse"
    }));
  });
  await expect(track).toHaveCSS("opacity", "0");
});

test("PDS hide timer fades the scrollbar when no hover remains", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbar="v"
    style="width:120px;height:120px;overflow-y:auto">
    <div style="height:500px"></div>
  </div>`);
  const track = page.locator("#box > [data-ae-scrollbar-vertical]");
  await page.evaluate(() => {
    const element = document.getElementById("box");
    const content = element.querySelector(":scope > div:not([data-ae-scrollbar-vertical])");
    const rect = content.getBoundingClientRect();
    const x = rect.left + 40, y = rect.top + 70;
    content.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 902,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 902,
      pointerType: "mouse", buttons: 1, clientX: x, clientY: y - 40
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 902,
      pointerType: "mouse", button: 0, buttons: 0, clientX: x, clientY: y - 40
    }));
    element.dispatchEvent(new PointerEvent("pointerout", {
      bubbles: true, pointerType: "mouse"
    }));
  });
  await expect(track).toHaveCSS("opacity", "1");
  await page.waitForTimeout(1150);
  await expect(track).toHaveCSS("opacity", "0");
});

test("scrollbars are siblings of the elastic wrapper and are removed on unmount", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbox-snap data-ae-scrollbar="h v"
    style="width:120px;height:120px;overflow:auto">
    <div data-ae-scrollbox-elastic style="display:flex;width:360px;height:360px">
      <div data-ae-snap-item style="flex:none;width:120px;height:360px"></div>
      <div data-ae-snap-item style="flex:none;width:120px;height:360px"></div>
      <div data-ae-snap-item style="flex:none;width:120px;height:360px"></div>
    </div>
  </div>`);
  const result = await page.evaluate(async () => {
    const box = document.getElementById("box");
    const before = {
      children: box.children.length,
      vertical: box.querySelectorAll(":scope > [data-ae-scrollbar-vertical]").length,
      horizontal: box.querySelectorAll(":scope > [data-ae-scrollbar-horizontal]").length,
      errors: AelluxJs.diagnostics.showHistory().filter(item =>
        item.code === 1120 || item.code === 1121).length
    };
    await AelluxJs.mountManager.unmount(document.body, "scrollbox");
    return { before, after: box.children.length,
      hiddenClass: box.classList.contains("ae--native-sb-hide") };
  });
  expect(result).toEqual({ before: { children: 3, vertical: 1, horizontal: 1,
    errors: 0 }, after: 1, hiddenClass: false });
});

test("an existing scrollbar is reused and its inline values survive unmount", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="y"
    style="width:100px;height:100px;overflow-y:auto">
    <div style="height:400px"></div>
    <div id="existing" data-ae-scrollbar-vertical
      style="--ae-scrollbar-x:7px!important"></div>
  </div>`);
  const result = await page.evaluate(async () => {
    const box = document.getElementById("box");
    const existing = document.getElementById("existing");
    const count = box.querySelectorAll(":scope > [data-ae-scrollbar-vertical]").length;
    await AelluxJs.mountManager.unmount(document.body, "scrollbox");
    return { count, retained: box.contains(existing),
      value: existing.style.getPropertyValue("--ae-scrollbar-x"),
      priority: existing.style.getPropertyPriority("--ae-scrollbar-x") };
  });
  expect(result).toEqual({ count: 1, retained: true, value: "7px", priority: "important" });
});

test("the horizontal thumb maps its drag to horizontal scroll", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="x"
    style="width:120px;height:120px;overflow-x:auto;overflow-y:hidden;
      --ae-scrollbar-track-color:rgb(70, 80, 90);--ae-scrollbar-opacity-fade:1">
    <div style="width:600px;height:100px"></div>
  </div>`);
  const track = page.locator("#box > [data-ae-scrollbar-horizontal]");
  const thumb = await track.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size")));
  const rect = await track.boundingBox();
  await page.mouse.click(rect.x + 80, rect.y + 4);
  await expect.poll(() => track.evaluate(element => {
    const position = Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-position"));
    const size = Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size"));
    return Math.abs(position + size / 2 - 80);
  })).toBeLessThan(1.5);
  const thumbPosition = await track.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-position")));
  const horizontalThumb = await track.evaluate(element => {
    const before = getComputedStyle(element, "::before");
    return { size: Number.parseFloat(before.width),
      position: new DOMMatrixReadOnly(before.transform).m41 };
  });
  expect(horizontalThumb.size).toBeCloseTo(thumb, 1);
  expect(horizontalThumb.position).toBeCloseTo(thumbPosition, 0);
  await page.mouse.move(rect.x + thumbPosition + thumb / 2, rect.y + 4);
  await page.mouse.down();
  await page.mouse.move(rect.x + 95, rect.y + 4, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => document.getElementById("box").scrollLeft))
    .toBeGreaterThan(300);
});

test("hidden overflow hides only the scrollbar on that axis", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="x y"
    style="width:120px;height:120px;overflow-x:auto;overflow-y:hidden">
    <div style="width:400px;height:400px"></div>
  </div>`);
  const horizontal = page.locator("#box > [data-ae-scrollbar-horizontal]");
  const vertical = page.locator("#box > [data-ae-scrollbar-vertical]");
  await expect(horizontal).toHaveCSS("display", "block");
  await expect(vertical).toHaveCSS("display", "none");
  await page.evaluate(() => {
    const element = document.getElementById("box");
    element.style.setProperty("overflow-x", "hidden");
    element.style.setProperty("overflow-y", "auto");
    AelluxJs.mountManager.update(element, "scrollbox");
  });
  await expect(horizontal).toHaveCSS("display", "none");
  await expect(vertical).toHaveCSS("display", "block");
});

test("scrollbox batches repeated scroll measurements into one frame", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="vertical"
    style="width:120px;height:120px;overflow-y:auto">
    <div style="height:600px"></div>
  </div>`);
  await expect.poll(() => page.evaluate(() =>
    document.getElementById("box").style.getPropertyValue("--ae-scroll-y-progress"))).toBe("0");
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const original = window.getComputedStyle;
    let reads = 0;
    window.getComputedStyle = function (target, ...args) {
      if (target === element) reads++;
      return original.call(this, target, ...args);
    };
    element.scrollTo({ top: 240, behavior: "instant" });
    for (let index = 0; index < 40; index++)
      element.dispatchEvent(new Event("scroll"));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.getComputedStyle = original;
    return { reads, progress: Number(element.style.getPropertyValue("--ae-scroll-y-progress")) };
  });
  expect(result.reads).toBeLessThanOrEqual(2);
  expect(result.progress).toBeCloseTo(0.5, 2);
});
