import { expect, test } from "@playwright/test";

async function setup(page, markup) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(html => {
    document.body.innerHTML = html;
    AelluxJs.ext("scrollbox");
  }, markup);
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
}

test("custom scrollbar stays over the viewport and supports track click and thumb drag", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="vertical"
    style="width:120px;height:120px;overflow-y:auto;overflow-x:hidden">
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
  const rect = await track.boundingBox();
  await page.mouse.move(rect.x + 4, rect.y + thumbPosition + thumb / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + 4, rect.y + 95, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => box.evaluate(element => element.scrollTop)).toBeGreaterThan(300);
  await expect(track).toHaveCSS("opacity", "1");
  await page.mouse.move(rect.x + 140, rect.y + 140);
  await expect(track).toHaveCSS("opacity", "0");
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

test("PDS hide timer keeps a scrollbar visible while mouse hover remains active", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbar="v"
    style="width:120px;height:120px;overflow-y:auto">
    <div style="height:500px"></div>
  </div>`);
  const box = page.locator("#box");
  const track = page.locator("#box > [data-ae-scrollbar-vertical]");
  const result = await box.evaluate(element => {
    element.dispatchEvent(new MouseEvent("mouseenter"));
    const content = element.firstElementChild;
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
  await box.evaluate(element => element.dispatchEvent(new MouseEvent("mouseleave")));
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
    const content = element.firstElementChild;
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
    style="width:120px;height:120px;overflow-x:auto;overflow-y:hidden">
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
