import { expect, test } from "@playwright/test";

const hiddenProperties = ["top", "right", "bottom", "left"].map(side => `--ae-scrollbox-hidden-${side}`);
const boxHTML = (extra = "", content = '<div id="content" style="width:320px;height:300px;background:black"></div>') =>
  `<div id="box" data-ae-scrollbox="native" data-ae-scrollbar="none" style="width:120px;height:100px" ${extra}>${content}</div>`;
const content = box => box.locator(':scope > :not([data-ae-scrollbar-vertical]):not([data-ae-scrollbar-horizontal])').first();

async function start(page, html = boxHTML(), options = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ html, options }) => {
    document.body.innerHTML = '<style>body{margin:16px;background:white}[data-ae-scrollbox]{scroll-behavior:auto!important}</style>' + html;
    AelluxJs.init({ mode: "full", ...options });
  }, { html, options });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document));
  await expect.poll(() => page.locator("#box").evaluate(element => element.style.getPropertyValue("--ae-scrollbox-hidden-top"))).not.toBe("");
  return page.locator("#box");
}

async function distances(box) {
  return box.evaluate((element, properties) => properties.map(name =>
    parseFloat(element.style.getPropertyValue(name))), hiddenProperties);
}

async function scroll(box, x, y) {
  await box.evaluate((element, { x, y }) => element.scrollTo({ left: x, top: y, behavior: "instant" }), { x, y });
  await expect.poll(() => box.evaluate(element => {
    const maximumX = element.scrollWidth - element.clientWidth, maximumY = element.scrollHeight - element.clientHeight;
    const left = getComputedStyle(element).direction === "rtl" ? maximumX + element.scrollLeft : element.scrollLeft;
    return ["top", "right", "bottom", "left"].every((side, index) =>
      Math.abs(parseFloat(element.style.getPropertyValue(`--ae-scrollbox-hidden-${side}`)) -
        [element.scrollTop, maximumX - left, maximumY - element.scrollTop, left][index]) < 0.1);
  })).toBe(true);
}

async function pixels(page, box, inset = 0) {
  const png = (await box.screenshot()).toString("base64");
  return page.evaluate(async ({ png, inset }) => {
    const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext("2d"); context.drawImage(image, 0, 0);
    const pixel = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data);
    const x = Math.floor(image.width / 2), y = Math.floor(image.height / 2);
    return { top: pixel(x, inset)[0], right: pixel(image.width - 1 - inset, y)[0], bottom: pixel(x, image.height - 1 - inset)[0],
      left: pixel(inset, y)[0], middle: pixel(x, y)[0], corners: [pixel(0, 0)[0], pixel(image.width - 1, 0)[0],
        pixel(image.width - 1, image.height - 1)[0], pixel(0, image.height - 1)[0]] };
  }, { png, inset });
}

for (const forceLegacy of [false, true]) {
  test(`one content child receives the fade while the box keeps its decoration (${forceLegacy})`, async ({ page }) => {
    const box = await start(page, boxHTML().replace('height:100px',
      'height:100px;background:yellow;border:4px solid red;padding:6px;transform:scale(1.25);transform-origin:top left')
      .replace('background:black', 'background:black;margin:8px;transform:scale(1.05);transform-origin:top left'), { forceLegacy });
    const content = page.locator('#content');
    await expect(box).toHaveCSS('mask-image', 'none');
    await expect(content).toHaveCSS('mask-image', /linear-gradient/);
    await scroll(box, 70, 80);
    const image = await pixels(page, box);
    expect(image.top).toBe(255);
    expect(image.left).toBe(255);
    expect(image.middle).toBe(0);
    const inside = await pixels(page, box, 5);
    for (const side of ["top", "right", "bottom", "left"]) expect(inside[side]).toBeGreaterThan(200);
    expect(inside.middle).toBe(0);
  });

  for (const childCount of [1, 2]) test(`four physical fades compose and weaken continuously at every boundary (${childCount} children, ${forceLegacy})`, async ({ page }) => {
    const box = await start(page, boxHTML().replace('</div></div>', `</div>${childCount === 2 ? '<i hidden></i>' : ''}</div>`), { forceLegacy });
    await expect(childCount === 1 ? content(box) : box).toHaveAttribute("data-ae-scrollbox-fade-state", "both");
    expect(await distances(box)).toEqual([0, 200, 200, 0]);
    const initial = await pixels(page, box);
    expect(initial.top).toBe(0); expect(initial.left).toBe(0);
    expect(initial.right).toBeGreaterThan(220); expect(initial.bottom).toBeGreaterThan(220);
    await scroll(box, 4, 10);
    const partial = await pixels(page, box);
    expect(partial.left).toBeGreaterThan(30); expect(partial.left).toBeLessThan(90);
    expect(partial.top).toBeGreaterThan(110); expect(partial.top).toBeLessThan(180);
    await scroll(box, 70, 80);
    const middle = await pixels(page, box);
    for (const side of ["top", "right", "bottom", "left"]) expect(middle[side]).toBeGreaterThan(220);
    expect(middle.middle).toBe(0);
    for (const corner of middle.corners) expect(corner).toBeGreaterThan(middle.top);
    await scroll(box, 999, 999);
    const end = await pixels(page, box);
    expect(end.right).toBe(0); expect(end.bottom).toBe(0);
    expect(end.left).toBeGreaterThan(220); expect(end.top).toBeGreaterThan(220);
    await box.evaluate(element => element.style.setProperty("--ae-scrollbox-fade-size", "0px"));
    const zero = await pixels(page, box);
    for (const side of ["top", "right", "bottom", "left", "middle"]) expect(zero[side]).toBe(0);
    expect(await box.locator(":scope > *").count()).toBe(childCount);
  });

  for (const axis of ["x", "y", "none"]) test(`only scrollable ${axis} axes contribute, and fitting content has no mask (${forceLegacy})`, async ({ page }) => {
    const markup = `<div style="width:${axis === "x" ? 320 : 100}px;height:${axis === "y" ? 300 : 80}px;background:black"></div>`;
    const box = await start(page, boxHTML("", markup), { forceLegacy });
    expect(await distances(box)).toEqual([0, axis === "x" ? 200 : 0, axis === "y" ? 200 : 0, 0]);
    if (axis === "none") await expect(content(box)).toHaveCSS("mask-image", "none");
    else {
      await expect(content(box)).toHaveCSS("mask-image", /linear-gradient/);
      await box.evaluate((element, axis) => element.style.setProperty(axis === "x" ? "overflow-x" : "overflow-y", "hidden"), axis);
      await page.evaluate(() => AelluxJs.mountManager.update(document));
      await expect(content(box)).toHaveCSS("mask-image", "none");
    }
  });

  for (const mode of ["native", "pointer"]) test(`RTL maps negative scroll offsets to physical sides (${mode}, ${forceLegacy})`, async ({ page }) => {
    const box = await start(page, boxHTML('dir="rtl"').replace('scrollbox="native"', `scrollbox="${mode}"`), { forceLegacy });
    expect(await distances(box)).toEqual([0, 0, 200, 200]);
    await scroll(box, -4, 0);
    expect(await distances(box)).toEqual([0, 4, 200, 196]);
    const near = await pixels(page, box);
    expect(near.right).toBeGreaterThan(30); expect(near.right).toBeLessThan(90);
    await scroll(box, -999, 200);
    expect(await distances(box)).toEqual([200, 200, 0, 0]);
    await expect(box).toHaveAttribute("data-ae-scrollbox", mode);
  });

  test(`dynamic configuration, geometry, reduced motion and unmount preserve DOM and styles (${forceLegacy})`, async ({ page }) => {
    const box = await start(page, boxHTML('data-ae-scrollbox-fade="false"'), { forceLegacy, environment: "development" });
    await expect(content(box)).toHaveCSS("mask-image", "none");
    await box.evaluate(element => element.setAttribute("data-ae-scrollbox-fade", "true"));
    await expect(content(box)).toHaveCSS("mask-image", /linear-gradient/);
    await box.evaluate(element => element.setAttribute("data-ae-scrollbox-fade", "invalid"));
    await page.evaluate(() => AelluxJs.mountManager.update(document));
    expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry =>
      entry.context?.attribute === "data-ae-scrollbox-fade").map(entry => entry.code))).toContain(2026);
    await box.evaluate(element => element.removeAttribute("data-ae-scrollbox-fade"));
    await page.evaluate(() => document.documentElement.setAttribute("data-ae-reduced-motion", "reduced"));
    await expect(content(box)).toHaveCSS("mask-image", /linear-gradient/);
    await box.evaluate(element => { element.style.width = "400px"; element.style.height = "400px"; });
    await expect(content(box)).toHaveCSS("mask-image", "none");
    await box.evaluate(element => { element.style.width = "120px"; element.style.height = "100px"; });
    await expect(content(box)).toHaveCSS("mask-image", /linear-gradient/);
    await page.locator("#content").evaluate(element => { element.style.width = "100px"; element.style.height = "80px"; });
    await expect(content(box)).toHaveCSS("mask-image", "none");
    const identity = await page.evaluate(async () => {
      const box = document.getElementById("box"), child = document.getElementById("content");
      let clicks = 0; child.addEventListener("click", () => clicks++);
      await AelluxJs.unmount(box, "scrollbox"); child.click();
      return { same: box.firstElementChild === child, clicks, state: box.hasAttribute("data-ae-scrollbox-fade-state"),
        values: ["top", "right", "bottom", "left"].map(side => box.style.getPropertyValue(`--ae-scrollbox-hidden-${side}`)) };
    });
    expect(identity).toEqual({ same: true, clicks: 1, state: false, values: ["", "", "", ""] });
  });

  test(`authored masks and existing distance priorities survive mount and unmount (${forceLegacy})`, async ({ page }) => {
    const box = await start(page, '<style>:where(#box){mask-image:linear-gradient(to right,black,transparent)}</style>' +
      boxHTML().replace('height:100px', 'height:100px;--ae-scrollbox-hidden-top:7px!important'), { forceLegacy });
    await expect(box).not.toHaveAttribute("data-ae-scrollbox-fade-state");
    const mask = await box.evaluate(element => getComputedStyle(element).maskImage);
    expect(mask.match(/linear-gradient/g)).toHaveLength(1);
    await scroll(box, 100, 100);
    await expect(box).toHaveCSS("mask-image", mask);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("box"), "scrollbox"));
    expect(await box.evaluate(element => [element.style.getPropertyValue("--ae-scrollbox-hidden-top"),
      element.style.getPropertyPriority("--ae-scrollbox-hidden-top")])).toEqual(["7px", "important"]);
    await expect(box).toHaveCSS("mask-image", mask);
  });

  test(`child changes transfer the mask and restore preceding values and priorities (${forceLegacy})`, async ({ page }) => {
    const box = await start(page, boxHTML().replace('background:black',
      'background:black;--ae-scrollbox-hidden-top:7px!important;--ae-scrollbox-mask-left:3px!important'), { forceLegacy });
    const child = content(box);
    await expect(child).toHaveCSS("mask-image", /linear-gradient/);
    await scroll(box, 70, 80);
    await box.evaluate(element => element.appendChild(document.createElement('span')));
    await expect(box).toHaveCSS("mask-image", /linear-gradient/);
    await expect(child).toHaveCSS("mask-image", "none");
    const authored = element => ['--ae-scrollbox-hidden-top', '--ae-scrollbox-mask-left'].map(name =>
      [element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
    expect(await child.evaluate(authored)).toEqual([['7px', 'important'], ['3px', 'important']]);
    await box.evaluate(element => element.lastElementChild.remove());
    await expect(box).toHaveCSS("mask-image", "none");
    await expect(child).toHaveCSS("mask-image", /linear-gradient/);
    await box.evaluate(element => {
      window.previousFadeChild = element.firstElementChild;
      const replacement = document.createElement('div');
      replacement.id = 'replacement';
      replacement.style.cssText = 'width:320px;height:300px;background:black';
      element.replaceChild(replacement, element.firstElementChild);
    });
    const replacement = page.locator('#replacement');
    await expect(replacement).toHaveCSS("mask-image", /linear-gradient/);
    expect(await page.evaluate(() => {
      const child = window.previousFadeChild;
      return [child.hasAttribute('data-ae-scrollbox-fade-state'),
        child.style.getPropertyValue('--ae-scrollbox-hidden-top'), child.style.getPropertyPriority('--ae-scrollbox-hidden-top'),
        child.style.getPropertyValue('--ae-scrollbox-mask-left'), child.style.getPropertyPriority('--ae-scrollbox-mask-left')];
    })).toEqual([false, '7px', 'important', '3px', 'important']);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById('box'), 'scrollbox'));
    await expect(replacement).toHaveCSS("mask-image", "none");
    expect(await replacement.evaluate(authored)).toEqual([['', ''], ['', '']]);
    await expect(replacement).not.toHaveAttribute('data-ae-scrollbox-fade-state');
  });

  test(`an authored child mask is preserved without masking its parent (${forceLegacy})`, async ({ page }) => {
    const box = await start(page, boxHTML().replace('background:black',
      'background:black;mask-image:linear-gradient(to right,black,transparent)'), { forceLegacy });
    const child = content(box);
    const mask = await child.evaluate(element => getComputedStyle(element).maskImage);
    await expect(box).toHaveCSS('mask-image', 'none');
    await expect(child).not.toHaveAttribute('data-ae-scrollbox-fade-state');
    await scroll(box, 80, 90);
    await expect(child).toHaveCSS('mask-image', mask);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById('box'), 'scrollbox'));
    await expect(child).toHaveCSS('mask-image', mask);
  });

  test(`composition fallback selects vertical, Snap's horizontal axis, and no-mask fallback stays scrollable (${forceLegacy})`, async ({ page }) => {
    await page.addInitScript(() => {
      const supports = CSS.supports.bind(CSS);
      CSS.supports = (name, value) => name.includes("mask-composite") ? false : supports(name, value);
    });
    const box = await start(page, boxHTML(), { forceLegacy });
    await expect(content(box)).toHaveAttribute("data-ae-scrollbox-fade-state", "y");
    expect((await content(box).evaluate(element => getComputedStyle(element).maskImage)).match(/linear-gradient/g)).toHaveLength(1);
    await box.evaluate(element => element.setAttribute("data-ae-scrollbox-snap", "horizontal"));
    await expect(content(box)).toHaveAttribute("data-ae-scrollbox-fade-state", "x");
    await scroll(box, 80, 70);
    await page.addInitScript(() => { const supports = CSS.supports.bind(CSS);
      CSS.supports = (name, value) => name.includes("mask-image") ? false : supports(name, value); });
    const unsupported = await start(page, boxHTML(), { forceLegacy });
    await expect(unsupported).toHaveCSS("mask-image", "none");
    await expect(content(unsupported)).toHaveCSS("mask-image", "none");
    await scroll(unsupported, 50, 60);
    expect(await distances(unsupported)).toEqual([60, 150, 140, 50]);
  });
}

test("nested boxes retain independent mask geometry and sticky descendants", async ({ page }) => {
  const box = await start(page, boxHTML("", '<div style="width:320px;height:300px"><div id="sticky" style="position:sticky;top:0;height:10px;background:red"></div>' +
    '<div id="inner" data-ae-scrollbox data-ae-scrollbar="none" style="width:80px;height:60px"><div style="width:180px;height:160px;background:black"></div></div></div>'));
  const inner = page.locator("#inner");
  await scroll(box, 30, 40); await scroll(inner, 10, 20);
  expect(await distances(inner)).toEqual([20, 90, 80, 10]);
  expect(await distances(box)).toEqual([40, 170, 160, 30]);
  await expect(page.locator("#sticky")).toHaveCSS("position", "sticky");
  expect(await page.locator("#sticky").evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo((await box.boundingBox()).y, 1);
});

test("a direct child Scrollbox retains ownership of its own fade", async ({ page }) => {
  const box = await start(page, boxHTML("", '<div id="inner" data-ae-scrollbox data-ae-scrollbar="none" style="width:320px;height:300px">' +
    '<div id="inner-content" style="width:600px;height:500px;background:black"></div></div>'));
  const inner = page.locator("#inner"), innerContent = page.locator("#inner-content");
  await expect(box).toHaveCSS("mask-image", "none");
  await expect(inner).toHaveCSS("mask-image", "none");
  await expect(innerContent).toHaveCSS("mask-image", /linear-gradient/);
  await scroll(box, 30, 40);
  await scroll(inner, 20, 10);
  expect(await distances(inner)).toEqual([10, 260, 190, 20]);
  await box.evaluate(element => element.setAttribute("data-ae-scrollbox-fade", "false"));
  await expect(innerContent).toHaveCSS("mask-image", /linear-gradient/);
  expect(await distances(inner)).toEqual([10, 260, 190, 20]);
});

test("small viewports keep a visible center and small overflow stays proportional", async ({ page }) => {
  const box = await start(page, boxHTML().replace('width:120px;height:100px', 'width:12px;height:12px')
    .replace('width:320px;height:300px', 'width:16px;height:16px'));
  const initial = await pixels(page, box);
  expect(initial.middle).toBe(0);
  expect(initial.bottom).toBeGreaterThan(20); expect(initial.bottom).toBeLessThan(90);
  await scroll(box, 2, 2);
  const middle = await pixels(page, box);
  expect(middle.middle).toBe(0);
});

for (const forceLegacy of [false, true]) test(`smooth Snap publishes intermediate fades and Elastic retains real limits (${forceLegacy})`, async ({ page }) => {
  const content = '<div id="elastic" data-ae-scrollbox-elastic style="display:inline-flex;height:100px">' +
    [0, 1, 2].map(index => `<div data-ae-snap-item="start" style="flex:none;width:120px;height:100px;background:black">${index}</div>`).join("") + '</div>';
  const box = await start(page, boxHTML('data-ae-scrollbox-snap="horizontal"', content), { forceLegacy });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollboxSnap?.initialized)).toBe(true);
  await expect(box).toHaveClass(/ae--snap-ready/);
  expect(await page.evaluate(() => AelluxJs(document.getElementById("box")).scrollbox.goto(2, "smooth"))).toBe(true);
  await expect.poll(async () => { const values = await distances(box); return values[3] > 1 && values[1] > 1; },
    { intervals: [10, 20] }).toBe(true);
  await expect.poll(() => distances(box)).toEqual([0, 0, 0, 240]);
  await box.evaluate(element => element.dispatchEvent(new WheelEvent("wheel", { deltaX: 160, bubbles: true, cancelable: true })));
  await expect.poll(() => page.locator("#elastic").evaluate(element => element.style.transform)).toContain("scale");
  const values = [];
  for (let index = 0; index < 5; index++) {
    values.push(await distances(box));
    await page.waitForTimeout(30);
  }
  for (const sample of values) expect(sample).toEqual([0, 0, 0, 240]);
  await expect.poll(() => page.locator("#elastic").evaluate(element => element.style.transform)).toBe("");
  expect(await box.locator(":scope > [data-ae-scrollbox-elastic]").count()).toBe(1);
});

test("custom scrollbars keep their tracks and drag interaction with the stationary mask", async ({ page }) => {
  const box = await start(page, boxHTML().replace('data-ae-scrollbar="none"', 'data-ae-scrollbar="vertical horizontal"')
    .replace('height:100px', 'height:100px;--ae-scrollbar-opacity-fade:1;--ae-scrollbar-opacity-visible:1'));
  const bar = box.locator("[data-ae-scrollbar-vertical]");
  await expect(bar).toHaveCSS("display", "block");
  await expect(box.locator("[data-ae-scrollbar-horizontal]")).toHaveCSS("display", "block");
  await expect(box).toHaveClass(/ae--native-sb-hide/);
  const rect = await bar.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 10);
  await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2, rect.y + 55, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await distances(box))[0]).toBeGreaterThan(20);
  await expect(box).toHaveCSS("mask-image", "none");
  await expect(content(box)).toHaveCSS("mask-image", /linear-gradient/);
  await expect(bar).toHaveCSS("mask-image", "none");
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("box"), "scrollbox"));
  await expect(box.locator("[data-ae-scrollbar-vertical]")).toHaveCount(0);
  await expect(box.locator("[data-ae-scrollbar-horizontal]")).toHaveCount(0);
  await expect(box).toHaveCSS("mask-image", "none");
  await expect(content(box)).toHaveCSS("mask-image", "none");
});

for (const model of ["default", "reverse"]) test(`historical positive RTL scroll coordinates normalize to physical distances (${model})`, async ({ page }) => {
  await page.addInitScript(model => {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "scrollLeft");
    Object.defineProperty(Element.prototype, "scrollLeft", {
      configurable: true,
      get() {
        const value = descriptor.get.call(this);
        if (getComputedStyle(this).direction !== "rtl") return value;
        return model === "default" ? this.scrollWidth - this.clientWidth + value : -value;
      },
      set(value) {
        if (getComputedStyle(this).direction === "rtl") value = model === "default" ? value - (this.scrollWidth - this.clientWidth) : -value;
        descriptor.set.call(this, value);
      }
    });
  }, model);
  const box = await start(page, boxHTML('dir="rtl"'));
  expect(await distances(box)).toEqual([0, 0, 200, 200]);
  await box.evaluate((element, model) => { element.scrollLeft = model === "default" ? 196 : 4; }, model);
  await expect.poll(() => distances(box)).toEqual([0, 4, 200, 196]);
});
