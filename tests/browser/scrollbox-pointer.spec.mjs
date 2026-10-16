import { expect, test } from "@playwright/test";

const elasticAmount = (force, limit) => limit * (1 - Math.exp(-force / (3 * limit)));

const box = (id, mode = "pointer", extra = "", content = "", momentum = "false") =>
  `<div id="${id}" data-ae-scrollbox="${mode}" ${extra}
    ${momentum === null ? "" : `data-ae-scrollbox-momentum="${momentum}"`}
    style="width:100px;height:100px;overflow:auto;--ae-scroll-x-progress:.2;--ae-scroll-y-progress:.3">
    <div style="width:300px;height:300px">${content}</div></div>`;

async function setup(page, html, { coarse = false } = {}) {
  await page.goto("/tests/index.htm");
  if (coarse) await page.evaluate(() => {
    const matchMedia = window.matchMedia.bind(window);
    window.matchMedia = query => query.includes("hover: hover")
      ? { matches: false } : matchMedia(query);
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(markup => {
    document.body.innerHTML = markup;
    AelluxJs.ext("scrollbox");
  }, html);
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
}

async function drag(page, id, pointerType = "mouse") {
  return page.evaluate(({ id, pointerType }) => {
    const element = document.getElementById(id);
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 17,
      pointerType, button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 17,
      pointerType, buttons: 1, clientX: x - 50, clientY: y - 40
    }));
    const during = element.style.getPropertyValue("user-select");
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType,
      button: 0, buttons: 0, clientX: x - 50, clientY: y - 40
    }));
    return { x: element.scrollLeft, y: element.scrollTop,
      during, after: element.style.getPropertyValue("user-select") };
  }, { id, pointerType });
}

test("scroll edge classes follow both axes and clear on unmount", async ({ page }) => {
  await setup(page, box("edges", "native"));

  const classes = () => page.evaluate(() => {
    const names = ["v-start", "v-end", "h-start", "h-end"];
    const element = document.getElementById("edges");
    return names.map(name => element.classList.contains(`ae--scroll-${name}`));
  });

  await expect.poll(classes).toEqual([true, false, true, false]);

  await page.evaluate(() => document.getElementById("edges")
    .scrollTo({ top: 4, left: 4, behavior: "instant" }));
  await expect.poll(classes).toEqual([true, false, true, false]);

  await page.evaluate(() => document.getElementById("edges")
    .scrollTo({ top: 100, left: 100, behavior: "instant" }));
  await expect.poll(classes).toEqual([false, false, false, false]);

  await page.evaluate(() => {
    const element = document.getElementById("edges");
    element.scrollTo({
      top: element.scrollHeight - element.clientHeight - 4,
      left: element.scrollWidth - element.clientWidth - 4,
      behavior: "instant"
    });
  });
  await expect.poll(classes).toEqual([false, true, false, true]);

  await page.evaluate(() => AelluxJs.mountManager.unmount("edges", "scrollbox"));
  expect(await classes()).toEqual([false, false, false, false]);
});

test("scroll edge classes stay fixed during elastic pressure", async ({ page }) => {
  await setup(page, `<div id="elastic-edges" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto">
    <div data-ae-scrollbox-elastic style="display:inline-block;width:100px;height:300px"></div>
  </div>`);

  await page.evaluate(() => {
    const element = document.getElementById("elastic-edges");
    element.scrollTo({ top: element.scrollHeight - element.clientHeight, behavior: "instant" });
  });
  await expect.poll(() => page.evaluate(() => document.getElementById("elastic-edges")
    .classList.contains("ae--scroll-v-end"))).toBe(true);

  const duringPressure = await page.evaluate(async () => {
    const element = document.getElementById("elastic-edges");
    element.dispatchEvent(new WheelEvent("wheel", {
      bubbles: true, cancelable: true, deltaY: 60
    }));
    element.scrollTo({ top: 50, behavior: "instant" });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return element.classList.contains("ae--scroll-v-end");
  });

  expect(duringPressure).toBe(true);
  await expect.poll(() => page.evaluate(() => document.getElementById("elastic-edges")
    .classList.contains("ae--scroll-v-end"))).toBe(false);
});

test("snap change reports the selected item after scrolling settles", async ({ page }) => {
  await setup(page, `<div id="snap-events" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:300px;height:100px">
      <div data-ae-snap-item id="snap-one" style="flex:none;width:100px"></div>
      <div data-ae-snap-item id="snap-two" style="flex:none;width:100px"></div>
      <div data-ae-snap-item id="snap-three" style="flex:none;width:100px"></div>
    </div>
  </div>`);

  await page.evaluate(() => {
    window.snapEvents = [];
    document.getElementById("snap-events").addEventListener("AelluxJsScrollboxSnapChange", event => {
      const { item, index, previousIndex, axis } = event.detail;
      window.snapEvents.push({ item: item.id, index, previousIndex, axis });
    });
    AelluxJs.mountManager.controller("snap-events").scrollbox.goto(1);
  });

  await expect.poll(() => page.evaluate(() => window.snapEvents)).toEqual([
    { item: "snap-two", index: 1, previousIndex: 0, axis: "x" }
  ]);
  await page.evaluate(() => AelluxJs.mountManager.controller("snap-events").scrollbox.goto(1));
  await page.waitForTimeout(180);
  expect(await page.evaluate(() => window.snapEvents)).toHaveLength(1);
});

test("long smooth snap navigation reports only the reached destination", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:500px;height:100px">
      ${Array.from({ length: 5 }, (_, index) =>
        `<div id="item-${index}" data-ae-snap-item style="flex:none;width:100px"></div>`).join("")}
    </div>
  </div>`);

  await page.evaluate(() => {
    const element = document.getElementById("gallery");
    window.snapEvents = [];
    element.addEventListener("AelluxJsScrollboxSnapChange", event => {
      window.snapEvents.push(event.detail.index);
    });
    AelluxJs.mountManager.controller("gallery").scrollbox.goto(4);
  });

  await expect.poll(() => page.evaluate(() => window.snapEvents), { timeout: 10000 })
    .toEqual([4]);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(400);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.snapEvents)).toEqual([4]);
});

test("a descendant scrollend does not finish its parent snap navigation", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:500px;height:100px">
      ${Array.from({ length: 5 }, (_, index) =>
        `<div id="item-${index}" data-ae-snap-item style="flex:none;width:100px"></div>`).join("")}
    </div>
  </div>`);

  await page.evaluate(() => {
    const element = document.getElementById("gallery");
    window.snapEvents = [];
    element.addEventListener("AelluxJsScrollboxSnapChange", event =>
      window.snapEvents.push(event.detail.index));
    AelluxJs.mountManager.controller("gallery").scrollbox.goto(4);
    setTimeout(() => document.getElementById("item-0")
      .dispatchEvent(new Event("scrollend", { bubbles: true })), 100);
  });

  await expect.poll(() => page.evaluate(() => window.snapEvents), { timeout: 10000 })
    .toEqual([4]);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.snapEvents)).toEqual([4]);
});

test("pointer scroll start and end report the activated gesture", async ({ page }) => {
  await setup(page, box("pointer-events"));

  const events = await page.evaluate(() => {
    const element = document.getElementById("pointer-events");
    const events = [];
    for (const name of ["PointerScrollStart", "PointerScrollEnd"]) {
      element.addEventListener(`AelluxJs${name}`, event => {
        const { axis, pointerId, pointerType, elements } = event.detail;
        events.push({ name, axis, pointerId, pointerType,
          elements: elements.map(item => item.id) });
      });
    }

    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true,
      pointerId: 29, pointerType: "mouse", button: 0, buttons: 1,
      clientX: 70, clientY: 70
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true,
      pointerId: 29, pointerType: "mouse", buttons: 1,
      clientX: 30, clientY: 70
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true,
      pointerId: 29, pointerType: "mouse", button: 0, buttons: 0,
      clientX: 30, clientY: 70
    }));
    return events;
  });

  expect(events).toEqual(["PointerScrollStart", "PointerScrollEnd"].map(name => ({
    name, axis: "x", pointerId: 29, pointerType: "mouse", elements: ["pointer-events"]
  })));
});

test("elastic wrapper normalizes non-inline display while snap keeps its layout", async ({ page }) => {
  await setup(page, `<div id="block" data-ae-scrollbox style="width:100px;height:100px">
    <div data-ae-scrollbox-elastic style="display:block!important;width:100px;height:300px"></div>
  </div>
  <div id="flex" data-ae-scrollbox data-ae-scrollbox-snap style="width:100px;height:100px">
    <div style="display:flex;width:300px">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>
  <div id="grid" data-ae-scrollbox data-ae-scrollbox-snap style="width:100px;height:100px">
    <div data-ae-scrollbox-elastic
      style="display:grid;grid-auto-flow:column;width:300px">
      <div data-ae-snap-item style="width:100px;height:100px"></div>
      <div data-ae-snap-item style="width:100px;height:100px"></div>
      <div data-ae-snap-item style="width:100px;height:100px"></div>
    </div>
  </div>`);
  const result = await page.evaluate(async () => {
    const ids = ["block", "flex", "grid"];
    const wrappers = ids.map(id => document.getElementById(id).firstElementChild);
    const displays = wrappers.map(item => getComputedStyle(item).display);
    const warnings = AelluxJs.diagnostics.showHistory().filter(item => item.code === 2016);
    await AelluxJs.mountManager.unmount(document.body, "scrollbox");
    return { displays, warnings: warnings.length,
      restored: wrappers.map(item => [item.style.getPropertyValue("display"),
        item.style.getPropertyPriority("display")]) };
  });
  expect(result).toEqual({ displays: ["inline-block", "flex", "inline-grid"],
    warnings: 2, restored: [["block", "important"], ["flex", ""], ["grid", ""]] });
});

test("snap initializes and controller navigates its direct children", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow:auto">
    <div style="display:flex;width:300px">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);
  expect(await page.evaluate(() => document.getElementById("gallery").scrollLeft)).toBe(0);
  expect(await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.goto(2))).toBe(true);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(200);
  expect(await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.previous()))
    .toBe(true);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(100);
  expect(await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.next()))
    .toBe(true);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(200);
  expect(await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.goto(3)))
    .toBe(false);
});

test("snap without an elastic wrapper ignores custom scrollbars", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    data-ae-scrollbar="x"
    style="display:flex;width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div id="first" data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    <div id="second" data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    <div id="third" data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
  </div>`);

  const initial = await page.evaluate(() => {
    const box = document.getElementById("gallery");
    const bar = box.querySelector(":scope > [data-ae-scrollbar-horizontal]");
    return {
      children: box.children.length,
      barAlign: bar.style.scrollSnapAlign,
      itemAlign: getComputedStyle(box.children[1]).scrollSnapAlign,
      errors: AelluxJs.diagnostics.showHistory().filter(item => item.code === 1121).length
    };
  });
  expect(initial).toEqual({ children: 4, barAlign: "", itemAlign: "center", errors: 0 });

  expect(await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.goto(2)))
    .toBe(true);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(200);
  expect(await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.goto(3)))
    .toBe(false);
});

test("snap requires marked items and follows marker changes", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div id="item" style="width:300px;height:100px;scroll-snap-align:start"></div>
  </div>`);

  const initial = await page.evaluate(() => ({
    enabled: AelluxJs.mountManager.controller("gallery").scrollbox.goto(0),
    errors: AelluxJs.diagnostics.showHistory().filter(item => item.code === 1121).length
  }));
  expect(initial).toEqual({ enabled: false, errors: 1 });

  await page.evaluate(() => document.getElementById("item")
    .setAttribute("data-ae-snap-item", ""));
  await expect.poll(() => page.evaluate(() => getComputedStyle(
    document.getElementById("item")).scrollSnapAlign)).toBe("center");
  expect(await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.goto(0)))
    .toBe(true);

  await page.evaluate(() => document.getElementById("item")
    .removeAttribute("data-ae-snap-item"));
  await expect.poll(() => page.evaluate(() => getComputedStyle(
    document.getElementById("item")).scrollSnapAlign)).toBe("start");
  expect(await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.goto(0)))
    .toBe(false);
});

test("snap uses horizontal by default and centers only its selected axis", async ({ page }) => {
  await setup(page, `<div id="horizontal" data-ae-scrollbox data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow:auto">
    <div style="display:flex;width:300px;height:200px">
      <div data-ae-snap-item style="flex:none;width:100px;height:40px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:40px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:40px"></div>
    </div>
  </div>
  <div id="vertical" data-ae-scrollbox data-ae-scrollbox-snap="vertical"
    style="width:100px;height:100px;overflow-x:hidden;overflow-y:auto">
    <div style="width:300px;height:300px">
      <div data-ae-snap-item style="width:40px;height:100px"></div>
      <div data-ae-snap-item style="width:40px;height:100px"></div>
      <div data-ae-snap-item style="width:40px;height:100px"></div>
    </div>
  </div>`);
  const styles = await page.evaluate(() => ["horizontal", "vertical"].map(id => {
    const element = document.getElementById(id);
    return [getComputedStyle(element).scrollSnapType,
      getComputedStyle(element.firstElementChild.children[1]).scrollSnapAlign];
  }));
  expect(styles).toEqual([["x mandatory", "center"], ["y mandatory", "center"]]);

  await page.evaluate(() => document.getElementById("vertical")
    .setAttribute("data-ae-scrollbox-snap", "horizontal"));
  await expect.poll(() => page.evaluate(() => getComputedStyle(
    document.getElementById("vertical")).scrollSnapType)).toBe("x mandatory");
  await page.evaluate(() => document.getElementById("vertical")
    .setAttribute("data-ae-scrollbox-snap", "vertical"));
  await expect.poll(() => page.evaluate(() => getComputedStyle(
    document.getElementById("vertical")).scrollSnapType)).toBe("y mandatory");

  await page.evaluate(() => {
    AelluxJs.mountManager.controller("horizontal").scrollbox.goto(1);
    AelluxJs.mountManager.controller("vertical").scrollbox.goto(1);
  });
  await expect.poll(() => page.evaluate(() => ["horizontal", "vertical"].map(id => {
    const element = document.getElementById(id);
    return [element.scrollLeft, element.scrollTop];
  }))).toEqual([[100, 0], [0, 100]]);
});

test("snap item values align controller navigation on both axes", async ({ page }) => {
  await setup(page, `<div id="horizontal" data-ae-scrollbox data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;gap:20px;width:260px;height:100px">
      <div data-ae-snap-item style="flex:none;width:60px;height:100px"></div>
      <div data-ae-snap-item="left" style="flex:none;width:60px;height:100px"></div>
      <div data-ae-snap-item="right" style="flex:none;width:60px;height:100px"></div>
    </div>
  </div>
  <div id="vertical" data-ae-scrollbox data-ae-scrollbox-snap="vertical"
    style="width:100px;height:100px;overflow-x:hidden;overflow-y:auto">
    <div style="display:flex;flex-direction:column;gap:20px;height:260px">
      <div data-ae-snap-item style="flex:none;width:100px;height:60px"></div>
      <div data-ae-snap-item="top" style="flex:none;width:100px;height:60px"></div>
      <div data-ae-snap-item="bottom" style="flex:none;width:100px;height:60px"></div>
    </div>
  </div>`);

  const alignments = await page.evaluate(() => ["horizontal", "vertical"].map(id =>
    Array.from(document.getElementById(id).firstElementChild.children,
      item => getComputedStyle(item).scrollSnapAlign)));
  expect(alignments).toEqual([["center", "start", "end"], ["center", "start", "end"]]);

  await page.evaluate(() => ["horizontal", "vertical"].forEach(id =>
    AelluxJs.mountManager.controller(id).scrollbox.goto(1)));
  await expect.poll(() => page.evaluate(() => [
    document.getElementById("horizontal").scrollLeft,
    document.getElementById("vertical").scrollTop
  ])).toEqual([80, 80]);

  await page.evaluate(() => ["horizontal", "vertical"].forEach(id =>
    AelluxJs.mountManager.controller(id).scrollbox.goto(2)));
  await expect.poll(() => page.evaluate(() => [
    document.getElementById("horizontal").scrollLeft,
    document.getElementById("vertical").scrollTop
  ])).toEqual([120, 120]);

  await page.evaluate(() => {
    const box = document.getElementById("horizontal");
    box.firstElementChild.children[1].setAttribute("data-ae-snap-item", "center");
    AelluxJs.mountManager.controller("horizontal").scrollbox.goto(1);
  });
  await expect.poll(() => page.evaluate(() => document.getElementById("horizontal")
    .scrollLeft)).toBe(60);
});

test("snap restores the box and child inline rules on unmount", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:180px;height:100px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity">
    <div style="display:flex;width:240px">
      <div data-ae-snap-item style="flex:none;width:80px;height:100px;scroll-snap-align:start"></div>
      <div data-ae-snap-item style="flex:none;width:80px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:80px;height:100px"></div>
    </div>
  </div>`);
  const styles = await page.evaluate(async () => {
    const element = document.getElementById("gallery");
    const child = element.firstElementChild.firstElementChild;
    const during = [getComputedStyle(element).scrollSnapType,
      getComputedStyle(child).scrollSnapAlign];
    await AelluxJs.mountManager.unmount(element, "scrollbox");
    return { during, after: [element.style.scrollSnapType, child.style.scrollSnapAlign],
      ready: element.classList.contains("ae--snap-ready") };
  });
  expect(styles).toEqual({ during: ["x mandatory", "center"],
    after: ["x", "start"], ready: false });
});

test("snap children publish viewport and focus values through native scrolling", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:300px">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);
  const values = (left = null) => page.evaluate(async left => {
    const element = document.getElementById("gallery");
    if (left !== null) {
      element.style.setProperty("scroll-snap-type", "none", "important");
      element.scrollTo({ left, behavior: "instant" });
      element.dispatchEvent(new Event("scroll"));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    return Array.from(element.firstElementChild.children,
      item => [Number(item.style.getPropertyValue("--ae-snap-viewport")),
        Number(item.style.getPropertyValue("--ae-snap-focus"))]);
  }, left);
  await expect.poll(values).toEqual([[0, 1], [2, 0], [2, 0]]);
  expect(await values(50)).toEqual([[-1, 0.5], [1, 0.5], [2, 0]]);
  expect(await values(100)).toEqual([[-2, 0], [0, 1], [2, 0]]);
  await page.evaluate(() => AelluxJs.mountManager.unmount(document.body, "scrollbox"));
  expect(await values()).toEqual([[-2, 0], [0, 1], [2, 0]]);
});

test("vertical snap children publish values along the vertical axis", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap="vertical"
    style="width:100px;height:100px;overflow-x:hidden;overflow-y:auto">
    <div style="width:100px">
      <div data-ae-snap-item style="height:100px"></div>
      <div data-ae-snap-item style="height:100px"></div>
      <div data-ae-snap-item style="height:100px"></div>
    </div>
  </div>`);
  await page.evaluate(() => document.getElementById("gallery")
    .scrollTo({ top: 100, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => Array.from(
    document.querySelectorAll("[data-ae-snap-item]"),
    item => [Number(item.style.getPropertyValue("--ae-snap-viewport")),
      Number(item.style.getPropertyValue("--ae-snap-focus"))]
  ))).toEqual([[-2, 0], [0, 1], [2, 0]]);
});

test("native scroll end snaps the nearest point after scrollbar scrolling", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap="vertical"
    style="width:100px;height:100px;overflow:auto">
    <div style="width:100px">
      <div data-ae-snap-item style="height:100px"></div>
      <div data-ae-snap-item style="height:100px"></div>
      <div data-ae-snap-item style="height:100px"></div>
    </div>
  </div>`);
  await page.evaluate(() => {
    const element = document.getElementById("gallery");
    element.scrollTo({ top: 130, behavior: "instant" });
    element.dispatchEvent(new Event("scrollend"));
  });
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollTop))
    .toBe(100);
});

test("native snap compares centers only on the selected axis", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow:auto">
    <div style="position:relative;width:400px;height:400px">
      <div data-ae-snap-item id="first" style="position:absolute;left:0;top:0;width:100px;height:100px"></div>
      <div data-ae-snap-item id="horizontal-nearest"
        style="position:absolute;left:180px;top:300px;width:100px;height:100px"></div>
      <div data-ae-snap-item id="diagonal-nearest"
        style="position:absolute;left:240px;top:0;width:100px;height:100px"></div>
    </div>
  </div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("gallery");
    const events = [];
    element.addEventListener("AelluxJsScrollboxSnapChange", event =>
      events.push(event.detail.item.id));
    element.style.setProperty("scroll-snap-type", "none", "important");
    element.scrollTo({ left: 125, top: 0, behavior: "instant" });
    element.dispatchEvent(new Event("scrollend"));
    return { events, top: element.scrollTop };
  });
  expect(result).toEqual({ events: ["horizontal-nearest"], top: 0 });
});

test("snap change compares each item's requested alignment", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="position:relative;width:300px;height:100px">
      <div data-ae-snap-item id="first"
        style="position:absolute;left:0;width:40px;height:100px"></div>
      <div data-ae-snap-item="left" id="aligned-left"
        style="position:absolute;left:100px;width:40px;height:100px"></div>
      <div data-ae-snap-item id="centered"
        style="position:absolute;left:180px;width:40px;height:100px"></div>
    </div>
  </div>`);

  const selected = await page.evaluate(() => {
    const element = document.getElementById("gallery");
    const events = [];
    element.addEventListener("AelluxJsScrollboxSnapChange", event =>
      events.push(event.detail.item.id));
    element.style.setProperty("scroll-snap-type", "none", "important");
    element.scrollTo({ left: 120, behavior: "instant" });
    element.dispatchEvent(new Event("scrollend"));
    return events;
  });
  expect(selected).toEqual(["aligned-left"]);
});

for (const ending of ["pointerup", "pointercancel"]) {
  test(`snap completion waits for ${ending} before starting its idle timer`, async ({ page }) => {
    await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
      style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
      <div style="display:flex;width:300px">
        <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
        <div data-ae-snap-item id="second" style="flex:none;width:100px;height:100px"></div>
        <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      </div>
    </div>`);
    await page.evaluate(() => {
      const element = document.getElementById("gallery");
      window.snapChanges = [];
      element.addEventListener("AelluxJsScrollboxSnapChange", event =>
        window.snapChanges.push(event.detail.index));
      element.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, isPrimary: true, pointerId: 91,
        pointerType: "touch", button: 0, buttons: 1
      }));
      AelluxJs.mountManager.controller("gallery").scrollbox.goto(1);
    });
    await page.waitForTimeout(170);
    expect(await page.evaluate(() => window.snapChanges)).toEqual([]);
    await page.evaluate(ending => window.dispatchEvent(new PointerEvent(ending, {
      bubbles: true, isPrimary: true, pointerId: 91,
      pointerType: "touch", button: 0, buttons: 0
    })), ending);
    await expect.poll(() => page.evaluate(() => window.snapChanges)).toEqual([1]);
  });
}

test("snap timer waits for touchend after a touch pointer is canceled", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:300px">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item id="second" style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);
  await page.evaluate(() => {
    const element = document.getElementById("gallery");
    window.snapChanges = [];
    element.addEventListener("AelluxJsScrollboxSnapChange", event =>
      window.snapChanges.push(event.detail.index));
    const touch = { identifier: 92 };
    const start = new Event("touchstart", { bubbles: true });
    Object.defineProperty(start, "changedTouches", { value: [touch] });
    element.dispatchEvent(start);
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 92,
      pointerType: "touch", button: 0, buttons: 1
    }));
    AelluxJs.mountManager.controller("gallery").scrollbox.goto(1);
    window.dispatchEvent(new PointerEvent("pointercancel", {
      bubbles: true, isPrimary: true, pointerId: 92,
      pointerType: "touch", button: 0, buttons: 0
    }));
  });
  await page.waitForTimeout(170);
  expect(await page.evaluate(() => window.snapChanges)).toEqual([]);
  await page.evaluate(() => {
    const end = new Event("touchend", { bubbles: true });
    Object.defineProperty(end, "changedTouches", { value: [{ identifier: 92 }] });
    window.dispatchEvent(end);
  });
  await expect.poll(() => page.evaluate(() => window.snapChanges)).toEqual([1]);
});

test("snap reports the first or last point at a scroll limit", async ({ page }) => {
  await setup(page, `<div id="start" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:280px">
      <div data-ae-snap-item id="start-first" style="flex:none;width:20px;height:100px"></div>
      <div data-ae-snap-item id="start-middle" style="flex:none;width:60px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:200px;height:100px"></div>
    </div>
  </div>
  <div id="end" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:280px">
      <div data-ae-snap-item style="flex:none;width:200px;height:100px"></div>
      <div data-ae-snap-item id="end-middle" style="flex:none;width:60px;height:100px"></div>
      <div data-ae-snap-item id="end-last" style="flex:none;width:20px;height:100px"></div>
    </div>
  </div>`);
  const result = await page.evaluate(() => {
    const start = document.getElementById("start");
    const end = document.getElementById("end");
    const events = [];
    start.addEventListener("AelluxJsScrollboxSnapChange", event =>
      events.push(event.detail.item.id));
    end.addEventListener("AelluxJsScrollboxSnapChange", event =>
      events.push(event.detail.item.id));
    start.scrollTo({ left: 0, behavior: "instant" });
    end.scrollTo({ left: end.scrollWidth - end.clientWidth, behavior: "instant" });
    start.dispatchEvent(new Event("scrollend"));
    end.dispatchEvent(new Event("scrollend"));
    return events;
  });
  expect(result).toEqual(["end-last"]);
});

test("wheel conversion preserves native CSS snap", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow:auto">
    <div style="display:flex;width:300px">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);
  const wheel = deltas => page.evaluate(values => {
    const element = document.getElementById("gallery");
    return values.map(deltaY => {
      const event = new WheelEvent("wheel", {
        deltaY, bubbles: true, cancelable: true
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
  }, deltas);
  expect(await wheel([120])).toEqual([true]);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(100);
  expect(await wheel([120])).toEqual([false]);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(200);
  expect(await wheel([120])).toEqual([false]);
  expect(await wheel([-120])).toEqual([true]);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(100);
});

test("converted snap wheel stretches only the horizontal elastic axis", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div id="wrapper" data-ae-scrollbox-elastic
      style="display:flex;width:300px;height:200px">
      <div data-ae-snap-item style="flex:none;width:100px;height:200px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:200px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:200px"></div>
    </div>
  </div>`);
  await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.goto(2));
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(200);
  const result = await page.evaluate(() => {
    const element = document.getElementById("gallery");
    const event = new WheelEvent("wheel", {
      deltaY: 120, bubbles: true, cancelable: true
    });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented,
      overflowY: getComputedStyle(element).overflowY,
      maxY: element.scrollHeight - element.clientHeight,
      transform: document.getElementById("wrapper").style.transform };
  });
  expect(result.prevented).toBe(false);
  expect(result.overflowY).toBe("hidden");
  expect(result.maxY).toBeGreaterThan(1);
  expect(result.transform).toMatch(/^scale\([^,]+, 1\) translate3d\(-[^,]+, 0px, 0px\)/);
});

test("elastic pressure suspends CSS snap through the return animation", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div data-ae-scrollbox-elastic
      style="display:flex;width:300px;height:100px">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);

  await page.evaluate(() => {
    const element = document.getElementById("gallery");
    element.scrollTo({ left: 200, behavior: "instant" });
    element.dispatchEvent(new WheelEvent("wheel", {
      deltaY: 80, bubbles: true, cancelable: true
    }));
  });
  expect(await page.evaluate(() => getComputedStyle(
    document.getElementById("gallery")).scrollSnapType)).toBe("none");
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => getComputedStyle(
    document.getElementById("gallery")).scrollSnapType)).toBe("none");
  await expect.poll(() => page.evaluate(() => getComputedStyle(
    document.getElementById("gallery")).scrollSnapType),
    { timeout: 10000 }).toBe("x mandatory");
});

test("a native touch flick advances one CSS snap point within 100 ms", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:300px">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);

  await page.evaluate(() => {
    const element = document.getElementById("gallery");
    const start = new Event("touchstart", { bubbles: true });
    Object.defineProperty(start, "changedTouches", { value: [{
      identifier: 47, clientX: 60, clientY: 50
    }] });
    element.dispatchEvent(start);

    const end = new Event("touchend", { bubbles: true });
    Object.defineProperty(end, "changedTouches", { value: [{
      identifier: 47, clientX: 58, clientY: 50
    }] });
    window.dispatchEvent(end);
  });
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery")
    .scrollLeft)).toBe(100);
});

test("horizontal wheel ignores hidden vertical overflow during elastic pressure", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div id="wrapper" data-ae-scrollbox-elastic
      style="width:300px;height:200px"></div>
  </div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("gallery");
    element.scrollTo({ left: element.scrollWidth, behavior: "instant" });
    const event = new WheelEvent("wheel", {
      deltaX: 130, deltaY: 120, bubbles: true, cancelable: true
    });
    element.dispatchEvent(event);
    return { maxY: element.scrollHeight - element.clientHeight,
      maxX: element.scrollWidth - element.clientWidth,
      scrollLeft: element.scrollLeft,
      transform: document.getElementById("wrapper").style.transform };
  });
  expect(result.maxY).toBeGreaterThan(1);
  expect(result.maxX).toBeGreaterThan(1);
  expect(result.transform).toMatch(/^scale\([^,]+, 1\) translate3d\(-[^,]+, 0px, 0px\)/);
});

test("pointer snap advances one point on a fast horizontal swipe", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="pointer" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow:auto">
    <div data-ae-scrollbox-elastic
      style="display:flex;width:300px">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);
  await page.evaluate(() => {
    const element = document.getElementById("gallery");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 232,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 232,
      pointerType: "mouse", buttons: 1, clientX: x - 60, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 232, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 60, clientY: y
    }));
  });
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(100);
});

test("CSS snap flick advances wide items while a slow drag stays within one point", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="pointer" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:900px">
      <div data-ae-snap-item style="flex:none;width:300px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:300px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:300px;height:100px"></div>
    </div>
  </div>`);
  const move = async (distance, pointerId, immediateRelease = false) =>
    page.evaluate(({ distance, pointerId, immediateRelease }) => {
    const element = document.getElementById("gallery");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId,
      pointerType: "mouse", buttons: 1, clientX: x - distance, clientY: y
    }));
    const point = { x: x - distance, y };
    if (immediateRelease) window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId, pointerType: "mouse",
      button: 0, buttons: 0, clientX: point.x, clientY: point.y
    }));
    return point;
  }, { distance, pointerId, immediateRelease });
  const release = async (point, pointerId) => page.evaluate(({ point, pointerId }) => {
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId, pointerType: "mouse",
      button: 0, buttons: 0, clientX: point.x, clientY: point.y
    }));
  }, { point, pointerId });
  const reset = async () => {
    await page.evaluate(() => AelluxJs.mountManager.controller("gallery").scrollbox.goto(0));
    await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
      .toBe(100);
  };

  await move(2, 301, true);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(400);

  await reset();
  const drag = await move(35, 302);
  await page.waitForTimeout(150);
  await release(drag, 302);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBeGreaterThan(125);

  await reset();
  const small = await move(2, 303);
  await page.waitForTimeout(250);
  await release(small, 303);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBeLessThan(110);
});

test("a longer drag lets CSS snap choose the nearest point", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="pointer" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:300px">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("gallery");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 95, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 304,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 304,
      pointerType: "mouse", buttons: 1, clientX: x - 90, clientY: y
    }));
    const center = rect.left + element.clientWidth / 2;
    const items = Array.from(element.firstElementChild.children);
    const distances = items.map(item => {
      const box = item.getBoundingClientRect();
      return Math.abs(box.left + box.width / 2 - center);
    });
    const nearest = distances.indexOf(Math.min(...distances));
    return { nearest, left: element.scrollLeft, x: x - 90, y };
  });
  expect(result.nearest).toBe(1);
  expect(result.left).toBe(90);
  await page.waitForTimeout(250);
  await page.evaluate(point => window.dispatchEvent(new PointerEvent("pointerup", {
    bubbles: true, isPrimary: true, pointerId: 304, pointerType: "mouse",
    button: 0, buttons: 0, clientX: point.x, clientY: point.y
  })), result);
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(100);
});

test("text-origin snap flick works before the 100 ms selection wait ends", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="pointer" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:300px">
      <div data-ae-snap-item id="text" style="flex:none;width:100px;height:100px">selectable words</div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);
  const pending = await page.evaluate(() => {
    const text = document.getElementById("text");
    const rect = text.getBoundingClientRect();
    const x = rect.left + 10, y = rect.top + 10;
    text.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 305,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const move = new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 305,
      pointerType: "mouse", buttons: 1, clientX: x - 2, clientY: y
    });
    window.dispatchEvent(move);
    const pending = { prevented: move.defaultPrevented,
      left: document.getElementById("gallery").scrollLeft };
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 305, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 2, clientY: y
    }));
    return pending;
  });
  expect(pending).toEqual({ prevented: false, left: 0 });
  await expect.poll(() => page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(100);
});

test("selection during the snap wait prevents an early flick", async ({ page }) => {
  await setup(page, `<div id="gallery" data-ae-scrollbox="pointer" data-ae-scrollbox-snap
    style="width:100px;height:100px;overflow-x:auto;overflow-y:hidden">
    <div style="display:flex;width:300px">
      <div data-ae-snap-item id="text" style="flex:none;width:100px;height:100px">selectable words</div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>
  </div>`);
  const result = await page.evaluate(() => {
    const text = document.getElementById("text");
    const rect = text.getBoundingClientRect();
    const x = rect.left + 10, y = rect.top + 10;
    text.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 306,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 306,
      pointerType: "mouse", buttons: 1, clientX: x - 2, clientY: y
    }));
    const range = document.createRange();
    range.setStart(text.firstChild, 0);
    range.setEnd(text.firstChild, 4);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 306, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 2, clientY: y
    }));
    return { selected: selection.toString(),
      left: document.getElementById("gallery").scrollLeft };
  });
  expect(result).toEqual({ selected: "sele", left: 0 });
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => document.getElementById("gallery").scrollLeft))
    .toBe(0);
});

test("native is the default and never loads a dependency", async ({ page }) => {
  let requests = 0;
  await page.route("https://unpkg.com/**", route => { requests++; return route.abort(); });
  await setup(page, box("empty", "") + box("native", "native") + box("pointer"));
  expect(requests).toBe(0);
  expect(await page.evaluate(() => Object.keys(AelluxJs.registry.dep))).toEqual([]);
  expect(await drag(page, "empty")).toMatchObject({ x: 0, y: 0 });
  expect(await drag(page, "native")).toMatchObject({ x: 0, y: 0 });
  expect(await drag(page, "pointer")).toMatchObject({ x: 50, y: 0 });
});

test("pointer drag keeps native scroll events and progress", async ({ page }) => {
  await setup(page, box("box"));
  await page.evaluate(() => {
    const element = document.getElementById("box");
    window.scrollEvents = [];
    window.addEventListener("scroll", event => {
      if (event.target === element) window.scrollEvents.push(event.isTrusted);
    }, true);
  });
  expect(await drag(page, "box")).toEqual({ x: 50, y: 0, during: "", after: "" });
  await expect.poll(() => page.evaluate(() => ({
    events: window.scrollEvents.length,
    x: document.getElementById("box").style.getPropertyValue("--ae-scroll-x-progress"),
    y: document.getElementById("box").style.getPropertyValue("--ae-scroll-y-progress")
  }))).toMatchObject({ x: "0.25", y: "0" });
  expect(await page.evaluate(() => window.scrollEvents.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollEvents.every(Boolean))).toBe(true);
});

for (const axis of ["x", "y"]) {
  test(`nested pointer boxes hand ${axis} scrolling to ancestors at the edge`, async ({ page }) => {
    await setup(page, `<div id="outer" data-ae-scrollbox="pointer"
      data-ae-scrollbox-momentum="false" style="width:120px;height:120px;overflow:auto">
      <div style="width:300px;height:360px">
        <div id="inner" data-ae-scrollbox="pointer"
          data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
          <div style="width:300px;height:300px"></div>
        </div>
      </div>
    </div>`);
    const result = await page.evaluate(axis => {
      const inner = document.getElementById("inner");
      const outer = document.getElementById("outer");
      const rect = inner.getBoundingClientRect();
      const x = rect.left + 50, y = rect.top + 50;
      inner.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, cancelable: true, isPrimary: true, pointerId: 122,
        pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
      }));
      const move = (primary, secondary) => {
        window.dispatchEvent(new PointerEvent("pointermove", {
          bubbles: true, cancelable: true, isPrimary: true, pointerId: 122,
          pointerType: "mouse", buttons: 1,
          clientX: x - (axis === "x" ? primary : secondary),
          clientY: y - (axis === "y" ? primary : secondary)
        }));
        return { inner: [inner.scrollLeft, inner.scrollTop],
          outer: [outer.scrollLeft, outer.scrollTop] };
      };
      const first = move(150, 20);
      const second = move(300, 40);
      const reverse = move(280, 40);
      window.dispatchEvent(new PointerEvent("pointerup", {
        bubbles: true, isPrimary: true, pointerId: 122, pointerType: "mouse",
        button: 0, buttons: 0, clientX: x, clientY: y
      }));
      return { first, second, reverse, classes: [
        inner.classList.contains("ae--pointerscrolling"),
        outer.classList.contains("ae--pointerscrolling")
      ] };
    }, axis);
    const inner = axis === "x" ? [150, 0] : [0, 150];
    const innerLimit = axis === "x" ? [200, 0] : [0, 200];
    const innerReverse = axis === "x" ? [180, 0] : [0, 180];
    const outer = axis === "x" ? [100, 0] : [0, 100];
    expect(result).toEqual({ first: { inner, outer: [0, 0] },
      second: { inner: innerLimit, outer }, reverse: { inner: innerReverse, outer },
      classes: [false, false] });
  });
}

for (const [axis, behavior] of [["x", "contain"], ["y", "none"]]) {
  test(`pointer chaining stops at overscroll-behavior-${axis}: ${behavior}`, async ({ page }) => {
    await setup(page, `<div id="outer" data-ae-scrollbox="pointer"
      data-ae-scrollbox-momentum="false" style="width:120px;height:120px;overflow:auto">
      <div style="width:300px;height:360px">
        <div id="inner" data-ae-scrollbox="pointer"
          data-ae-scrollbox-momentum="false"
          style="width:100px;height:100px;overflow:auto;overscroll-behavior-${axis}:${behavior}">
          <div style="width:300px;height:300px"></div>
        </div>
      </div>
    </div>`);
    const result = await page.evaluate(({ axis, behavior }) => {
      const inner = document.getElementById("inner");
      const outer = document.getElementById("outer");
      const rect = inner.getBoundingClientRect();
      const x = rect.left + 50, y = rect.top + 50;
      inner.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, cancelable: true, isPrimary: true, pointerId: 191,
        pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
      }));
      window.dispatchEvent(new PointerEvent("pointermove", {
        bubbles: true, cancelable: true, isPrimary: true, pointerId: 191,
        pointerType: "mouse", buttons: 1,
        clientX: x - (axis === "x" ? 300 : 0),
        clientY: y - (axis === "y" ? 300 : 0)
      }));
      const positions = {
        inner: axis === "x" ? inner.scrollLeft : inner.scrollTop,
        outer: axis === "x" ? outer.scrollLeft : outer.scrollTop,
        supported: CSS.supports(`overscroll-behavior-${axis}`, behavior)
      };
      window.dispatchEvent(new PointerEvent("pointerup", {
        bubbles: true, isPrimary: true, pointerId: 191,
        pointerType: "mouse", button: 0, buttons: 0
      }));
      return positions;
    }, { axis, behavior });
    expect(result).toEqual({ inner: 200, outer: result.supported ? 0 : 100,
      supported: result.supported });
  });
}

test("nested pointer scrolling skips a child without the chosen axis", async ({ page }) => {
  await setup(page, `<div id="outer" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:120px;height:120px;overflow:auto">
    <div style="width:300px;height:360px">
      <div id="inner" data-ae-scrollbox="pointer"
        data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
        <div style="width:100px;height:300px"></div>
      </div>
    </div>
  </div>`);
  const result = await page.evaluate(() => {
    const inner = document.getElementById("inner");
    const outer = document.getElementById("outer");
    const rect = inner.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    inner.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 123,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 123,
      pointerType: "mouse", buttons: 1, clientX: x - 60, clientY: y - 10
    }));
    const during = { inner: [inner.scrollLeft, inner.scrollTop],
      outer: [outer.scrollLeft, outer.scrollTop] };
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 123, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 60, clientY: y - 10
    }));
    return during;
  });
  expect(result).toEqual({ inner: [0, 0], outer: [60, 0] });
});

for (const axis of ["x", "y"]) {
  test(`pointer scrolling ignores overflow-${axis}: hidden despite overflowing content`,
    async ({ page }) => {
      await setup(page, `<div id="box" data-ae-scrollbox="pointer"
        data-ae-scrollbox-momentum="false"
        style="width:100px;height:100px;overflow-${axis}:hidden;overflow-${axis === "x" ? "y" : "x"}:auto">
        <div style="width:300px;height:300px"></div>
      </div>`);
      const result = await page.evaluate(axis => {
        const element = document.getElementById("box");
        const rect = element.getBoundingClientRect();
        const gesture = (id, startX, startY, moveX, moveY) => {
          element.dispatchEvent(new PointerEvent("pointerdown", {
            bubbles: true, cancelable: true, isPrimary: true, pointerId: id,
            pointerType: "mouse", button: 0, buttons: 1,
            clientX: rect.left + startX, clientY: rect.top + startY
          }));
          const move = new PointerEvent("pointermove", {
            bubbles: true, cancelable: true, isPrimary: true, pointerId: id,
            pointerType: "mouse", buttons: 1,
            clientX: rect.left + moveX, clientY: rect.top + moveY
          });
          window.dispatchEvent(move);
          const during = { prevented: move.defaultPrevented,
            active: element.classList.contains("ae--pointerscrolling"),
            x: element.scrollLeft, y: element.scrollTop };
          window.dispatchEvent(new PointerEvent("pointerup", {
            bubbles: true, isPrimary: true, pointerId: id, pointerType: "mouse",
            button: 0, buttons: 0, clientX: rect.left + moveX, clientY: rect.top + moveY
          }));
          return during;
        };
        const disabled = gesture(151, 30, 30,
          axis === "x" ? -30 : 30, axis === "y" ? -30 : 30);
        const enabled = gesture(152, 70, 70,
          axis === "y" ? 10 : 70, axis === "x" ? 10 : 70);
        return { disabled, enabled, overflow: getComputedStyle(element)[
          axis === "x" ? "overflowX" : "overflowY"] };
      }, axis);
      expect(result.overflow).toBe("hidden");
      expect(result.disabled).toEqual({ prevented: false, active: false, x: 0, y: 0 });
      expect(result.enabled).toEqual(axis === "x" ?
        { prevented: true, active: true, x: 0, y: 60 } :
        { prevented: true, active: true, x: 60, y: 0 });
    });
}

test("nested pointer scrolling skips hidden overflow in the child and uses the parent", async ({ page }) => {
  await setup(page, `<div id="outer" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:120px;height:120px;overflow:auto">
    <div style="width:300px;height:360px">
      <div id="inner" data-ae-scrollbox="pointer"
        data-ae-scrollbox-momentum="false"
        style="width:100px;height:100px;overflow-x:hidden;overflow-y:auto">
        <div style="width:300px;height:300px"></div>
      </div>
    </div>
  </div>`);
  const result = await page.evaluate(() => {
    const inner = document.getElementById("inner");
    const outer = document.getElementById("outer");
    const rect = inner.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    inner.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 153,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 153,
      pointerType: "mouse", buttons: 1, clientX: x - 60, clientY: y
    }));
    const during = { inner: inner.scrollLeft, outer: outer.scrollLeft };
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 153, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 60, clientY: y
    }));
    return during;
  });
  expect(result).toEqual({ inner: 0, outer: 60 });
});

test("pointer scrolling passes one gesture through three nested boxes", async ({ page }) => {
  await setup(page, `<div id="outer" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
    <div style="width:100px;height:500px">
      <div id="middle" data-ae-scrollbox="pointer"
        data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
        <div style="width:100px;height:300px">
          <div id="inner" data-ae-scrollbox="pointer"
            data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
            <div style="width:100px;height:200px"></div>
          </div>
        </div>
      </div>
    </div>
  </div>`);
  const result = await page.evaluate(() => {
    const boxes = ["inner", "middle", "outer"].map(id => document.getElementById(id));
    const rect = boxes[0].getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    boxes[0].dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 125,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 125,
      pointerType: "mouse", buttons: 1, clientX: x, clientY: y - 400
    }));
    const positions = boxes.map(element => element.scrollTop);
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 125, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x, clientY: y - 400
    }));
    return positions;
  });
  expect(result).toEqual([100, 200, 100]);
});

test("move defaults are canceled only after pointer scrolling begins", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "<input id='control'>"));
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    const pointerMove = offset => {
      const event = new PointerEvent("pointermove", {
        bubbles: true, cancelable: true, isPrimary: true, pointerId: 96,
        pointerType: "mouse", button: -1, buttons: 1,
        clientX: x - offset, clientY: y - offset
      });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const touchMove = () => {
      const event = new Event("touchmove", { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const mouseMove = () => {
      const event = new MouseEvent("mousemove", {
        bubbles: true, cancelable: true, buttons: 1
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    };
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 96, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const pending = { pointer: pointerMove(1), touch: touchMove(), mouse: mouseMove() };
    const during = { pointer: pointerMove(30), touch: touchMove(), mouse: mouseMove() };
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 96, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 30, clientY: y - 30
    }));
    const after = { touch: touchMove(), mouse: mouseMove() };
    document.getElementById("control").dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 97, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const control = { touch: touchMove(), mouse: mouseMove() };
    return { pending, during, after, control };
  });
  expect(result).toEqual({
    pending: { pointer: false, touch: false, mouse: false },
    during: { pointer: true, touch: true, mouse: true },
    after: { touch: false, mouse: false },
    control: { touch: false, mouse: false }
  });
});

test("drag events are canceled only while pointer scrolling is active", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "<div id='item' draggable='true'>drag</div>"));
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const item = document.getElementById("item");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    const drag = type => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      item.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const before = drag("dragstart");
    item.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 97, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const draggable = drag("dragstart");
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 98, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const pending = drag("dragstart");
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 98,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y - 30
    }));
    const during = ["dragstart", "drag", "dragenter", "dragover", "dragleave", "drop", "dragend"]
      .map(drag);
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 98, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 30, clientY: y - 30
    }));
    const after = drag("dragover");
    return { before, draggable, pending, during, after };
  });
  expect(result).toEqual({ before: false, draggable: false, pending: false,
    during: [true, true, true, true, true, true, true], after: false });
});

test("pointer scroll uses grab on open space and grabbing during text-origin scrolling", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto">
    <div style="width:180px;height:300px;padding-top:20px">
      <span id="text">selectable words here</span>
      <button id="button">Click</button>
      <div id="item" draggable="true">Drag me</div>
    </div></div>`);
  const box = await page.locator("#box").boundingBox();
  await page.mouse.move(box.x + 160, box.y + 10);
  expect(await page.locator("#box").evaluate(element => element.style.cursor)).toBe("grab");

  for (const id of ["text", "button", "item"]) {
    const rect = await page.locator(`#${id}`).boundingBox();
    await page.mouse.move(rect.x + 4, rect.y + rect.height / 2);
    expect(await page.locator("#box").evaluate(element => element.style.cursor)).toBe("");
  }

  const text = await page.locator("#text").boundingBox();
  await page.mouse.move(text.x + 5, text.y + text.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.move(text.x + 5, text.y - 10, { steps: 4 });
  expect(await page.locator("#box").evaluate(element => ({
    active: element.classList.contains("ae--pointerscrolling"),
    cursor: getComputedStyle(element).cursor,
    textCursor: getComputedStyle(element.querySelector("#text")).cursor
  }))).toEqual({ active: true, cursor: "grabbing", textCursor: "grabbing" });
  await page.mouse.up();
  await page.mouse.move(box.x - 20, box.y - 20);
  expect(await page.locator("#box").evaluate(element => element.style.cursor)).toBe("");
});

test("pointer scroll reserves open space but leaves text and controls native", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto">
    <div style="width:180px;height:300px;padding-top:20px">
      <span id="text">selectable words here</span>
      <button id="button">Click</button>
      <input id="input" value="editable text">
      <div id="item" draggable="true">Drag me</div>
    </div></div>`);
  await page.evaluate(() => {
    window.pointerDowns = [];
    document.addEventListener("pointerdown", event => {
      if (event.target.closest("#box")) window.pointerDowns.push({
        target: event.target.id || "open", prevented: event.defaultPrevented
      });
    });
  });
  const rect = await page.locator("#box").boundingBox();
  await page.mouse.click(rect.x + 160, rect.y + 10);
  for (const id of ["text", "button", "input", "item"]) {
    await page.locator(`#${id}`).click();
  }
  expect(await page.evaluate(() => window.pointerDowns)).toEqual([
    { target: "open", prevented: true },
    { target: "text", prevented: false },
    { target: "button", prevented: false },
    { target: "input", prevented: false },
    { target: "item", prevented: false }
  ]);
});

test("desktop pointer drag cancels wheel until pointer release", async ({ page }) => {
  await setup(page, box("box"));
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    let bubbled = 0;
    document.body.addEventListener("wheel", () => { bubbled++; });
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 29, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 29,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y - 30
    }));
    const during = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true });
    element.dispatchEvent(during);
    const scrollLeft = element.scrollLeft, scrollTop = element.scrollTop;
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 29, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 30, clientY: y - 30
    }));
    const after = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true });
    element.dispatchEvent(after);
    return { preventedDuring: during.defaultPrevented, preventedAfter: after.defaultPrevented,
      bubbled, scrollLeft, scrollTop };
  });
  expect(result).toEqual({ preventedDuring: true, preventedAfter: false,
    bubbled: 1, scrollLeft: 30, scrollTop: 0 });
});

test("real mouse drag scrolls while the pointer leaves the box", async ({ page }) => {
  await setup(page, box("box"));
  const rect = await page.locator("#box").boundingBox();
  await page.mouse.move(rect.x + 70, rect.y + 70);
  await page.mouse.down();
  await page.mouse.move(rect.x + 70, rect.y - 3, { steps: 3 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => document.getElementById("box").scrollTop))
    .toBeGreaterThan(70);
  expect(await page.evaluate(() => document.getElementById("box").scrollLeft)).toBe(0);
});

test("only the pointer drag button has mouse events canceled", async ({ page }) => {
  await setup(page, box("box"));
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 93, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const before = new MouseEvent("mousedown", {
      bubbles: true, cancelable: true, button: 0, buttons: 1, detail: 1
    });
    element.dispatchEvent(before);
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 93,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y - 30
    }));
    const whileDragging = [0, 1, 2].map(button => {
      const event = new MouseEvent("mousedown", {
        bubbles: true, cancelable: true, button, buttons: 1, detail: 1
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
    const repeated = new MouseEvent("mousedown", {
      bubbles: true, cancelable: true, button: 0, buttons: 1, detail: 2
    });
    element.dispatchEvent(repeated);
    const after = new MouseEvent("mousedown", {
      bubbles: true, cancelable: true, button: 0, buttons: 1, detail: 1
    });
    element.dispatchEvent(after);
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 93, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 30, clientY: y - 30
    }));
    return { before: before.defaultPrevented, whileDragging,
      repeated: repeated.defaultPrevented, after: after.defaultPrevented };
  });
  expect(result).toEqual({ before: false, whileDragging: [true, false, false],
    repeated: true, after: false });
});

test("mousemove is canceled only during pointer scrolling, including over a draggable child", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto">
    <div style="width:300px;height:300px"><div id="draggable" draggable="true">drag</div></div>
  </div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const draggable = document.getElementById("draggable");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    const mouseMove = (buttons = 1) => {
      const event = new MouseEvent("mousemove", {
        bubbles: true, cancelable: true, buttons, clientX: x, clientY: y
      });
      draggable.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const before = mouseMove();
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 94, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const pending = mouseMove();
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 94,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y - 30
    }));
    const during = mouseMove();
    const otherButton = mouseMove(2);
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 94, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 30, clientY: y - 30
    }));
    const after = mouseMove(0);
    return { before, pending, during, otherButton, after };
  });
  expect(result).toEqual({ before: false, pending: false, during: true,
    otherButton: false, after: false });
});

test("mouse release and click are canceled only for the drag button", async ({ page }) => {
  await setup(page, box("box"));
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    const mouse = (type, button, buttons = 0) => {
      const event = new MouseEvent(type, {
        bubbles: true, cancelable: true, button, buttons
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    };
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 95, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 95,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y - 30
    }));
    const during = {
      mouseup: mouse("mouseup", 0), click: mouse("click", 0),
      dblclick: mouse("dblclick", 0), contextmenu: mouse("contextmenu", 2),
      rightClick: mouse("click", 2)
    };
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 95, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 30, clientY: y - 30
    }));
    const release = { mouseup: mouse("mouseup", 0), click: mouse("click", 0),
      rightClick: mouse("click", 2) };
    await new Promise(resolve => setTimeout(resolve, 0));
    const later = mouse("click", 0);
    return { during, release, later };
  });
  expect(result).toEqual({
    during: { mouseup: true, click: true, dblclick: true,
      contextmenu: false, rightClick: false },
    release: { mouseup: true, click: true, rightClick: false }, later: false
  });
});

for (const elastic of [false, true]) {
  test(`second click dragged outside does not start pointer scrolling${elastic ? " with elastic" : ""}`,
    async ({ page }) => {
      const childAttribute = elastic ? " data-ae-scrollbox-elastic" : "";
      await setup(page, `<div id="box" data-ae-scrollbox="pointer"
        data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
        <div${childAttribute} style="width:300px;height:300px"></div></div>`);
      const rect = await page.locator("#box").boundingBox();
      const x = rect.x + 50, y = rect.y + 50;
      await page.mouse.move(x, y);
      await page.mouse.click(x, y);
      await page.mouse.down({ clickCount: 2 });
      await page.mouse.move(rect.x - 20, rect.y - 20, { steps: 4 });
      const during = await page.evaluate(() => {
        const element = document.getElementById("box");
        return { x: element.scrollLeft, y: element.scrollTop,
          userSelect: element.style.getPropertyValue("user-select"),
          transform: element.firstElementChild.style.transform };
      });
      await page.mouse.up();
      expect(during).toEqual({ x: 0, y: 0, userSelect: "", transform: "" });
    });
}

for (const clickCount of [2, 3]) {
  test(`${clickCount} mouse clicks allow native selection without pointer dragging`, async ({ page }) => {
    await setup(page, `<div id="box" data-ae-scrollbox="pointer"
      data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto;font:16px monospace">
      <div style="width:180px;height:300px;padding-top:60px;box-sizing:border-box">
        <span id="text">selectable words in the scrollbox</span>
      </div></div>`);
    await page.evaluate(() => {
      window.mouseDownEvents = [];
      document.addEventListener("mousedown", event => {
        if (event.target.closest("#box")) window.mouseDownEvents.push({
          detail: event.detail, prevented: event.defaultPrevented
        });
      });
    });
    const rect = await page.locator("#text").boundingBox();
    const x = rect.x + 8, y = rect.y + rect.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.click(x, y);
    await page.mouse.down({ clickCount });
    await page.mouse.move(x + 80, y, { steps: 4 });
    const during = await page.evaluate(() => ({
      selection: getSelection().toString(),
      scrollTop: document.getElementById("box").scrollTop,
      userSelect: document.getElementById("box").style.getPropertyValue("user-select"),
      events: window.mouseDownEvents
    }));
    await page.mouse.up();
    expect(during.events.at(-1)).toEqual({ detail: clickCount, prevented: false });
    expect(during.selection.length).toBeGreaterThan(0);
    expect(during.scrollTop).toBe(0);
    expect(during.userSelect).toBe("");
  });
}

test("pointer mode keeps mousedown and horizontal selection native in vertical-only boxes", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbox-momentum="false"
    style="width:200px;height:100px;overflow:auto;font:16px monospace">
    <div style="width:180px;height:300px;padding-top:60px;box-sizing:border-box"><span id="text">abcdefghijklmno</span></div>
  </div>`);
  await page.evaluate(() => {
    document.addEventListener("mousedown", event => {
      window.mouseDownPrevented = event.defaultPrevented;
    });
  });
  const rect = await page.locator("#text").boundingBox();
  await page.mouse.move(rect.x + 5, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + 100, rect.y + rect.height / 2, { steps: 5 });
  await page.mouse.up();
  const result = await page.evaluate(() => ({
    selection: getSelection().toString(),
    scrollTop: document.getElementById("box").scrollTop,
    userSelect: document.getElementById("box").style.getPropertyValue("user-select"),
    mouseDownPrevented: window.mouseDownPrevented
  }));
  expect(result.selection.length).toBeGreaterThan(0);
  expect(result.scrollTop).toBe(0);
  expect(result.userSelect).toBe("");
  expect(result.mouseDownPrevented).toBe(false);
});

test("horizontal-first motion keeps selection even if the pointer later moves vertically", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto;font:16px monospace">
    <div style="width:180px;height:300px;padding-top:60px;box-sizing:border-box">
      <span id="text">selectable words here</span>
    </div></div>`);
  await page.evaluate(() => {
    window.pointerMovesPrevented = [];
    window.addEventListener("pointermove", event => {
      if (event.buttons & 1) window.pointerMovesPrevented.push(event.defaultPrevented);
    });
  });
  const rect = await page.locator("#text").boundingBox();
  const x = rect.x + 5, y = rect.y + rect.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y + 8);
  await page.mouse.move(x + 40, y - 35);
  const result = await page.evaluate(() => ({
    selection: getSelection().toString(),
    userSelect: document.getElementById("box").style.getPropertyValue("user-select"),
    movesPrevented: window.pointerMovesPrevented
  }));
  await page.mouse.up();
  expect(result.selection.length).toBeGreaterThan(0);
  expect(result.movesPrevented).toEqual([false, false]);
  expect(result.userSelect).toBe("");
});

test("text selection takes precedence over pointer scrolling in a two-axis box", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto;font:16px monospace">
    <div style="width:300px;height:300px;padding-top:60px;box-sizing:border-box">
      <span id="text">selectable words here</span>
    </div></div>`);
  const rect = await page.locator("#text").boundingBox();
  const x = rect.x + 5, y = rect.y + rect.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y + 8, { steps: 5 });
  await expect.poll(() => page.evaluate(() => getSelection().toString().length))
    .toBeGreaterThan(0);
  await page.mouse.move(x + 40, y - 35);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    return { selection: getSelection().toString(), x: element.scrollLeft,
      y: element.scrollTop, active: element.classList.contains("ae--pointerscrolling") };
  });
  await page.mouse.up();
  expect(result.selection.length).toBeGreaterThan(0);
  expect(result).toMatchObject({ x: 0, y: 0, active: false });
});

test("an active text selection stops pending pointer scrolling", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto">
    <div style="width:300px;height:300px"><span id="text">selectable words here</span></div>
  </div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const text = document.getElementById("text");
    const rect = text.getBoundingClientRect();
    const x = rect.left + 5, y = rect.top + rect.height / 2;
    text.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 120, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const range = document.createRange();
    range.setStart(text.firstChild, 0);
    range.setEnd(text.firstChild, 8);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const move = new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 120,
      pointerType: "mouse", buttons: 1, clientX: x, clientY: y - 30
    });
    window.dispatchEvent(move);
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 120, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x, clientY: y - 30
    }));
    return { selection: selection.toString(), prevented: move.defaultPrevented,
      x: element.scrollLeft, y: element.scrollTop,
      active: element.classList.contains("ae--pointerscrolling") };
  });
  expect(result).toEqual({ selection: "selectab", prevented: false,
    x: 0, y: 0, active: false });
});

test("an unchanged selection from pointerdown does not block scrolling", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto">
    <div style="width:300px;height:300px"><span id="text">selectable words here</span></div>
  </div>`);
  const pending = await page.evaluate(() => {
    const element = document.getElementById("box");
    const text = document.getElementById("text");
    const range = document.createRange();
    range.setStart(text.firstChild, 0);
    range.setEnd(text.firstChild, 4);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const rect = text.getBoundingClientRect();
    const x = rect.left + 5, y = rect.top + rect.height / 2;
    text.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 127, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 127,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y
    }));
    return { selection: selection.toString(), x: element.scrollLeft };
  });
  expect(pending).toEqual({ selection: "sele", x: 0 });
  await expect.poll(() => page.evaluate(() => document.getElementById("box").scrollLeft))
    .toBe(30);
  const selection = await page.evaluate(() => {
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 127, pointerType: "mouse",
      button: 0, buttons: 0
    }));
    return getSelection().toString();
  });
  expect(selection).toBe("sele");
});

test("changing a pre-existing selection during the wait prevents scrolling", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto">
    <div style="width:300px;height:300px"><span id="text">selectable words here</span></div>
  </div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const text = document.getElementById("text");
    const selection = getSelection();
    const range = document.createRange();
    range.setStart(text.firstChild, 0);
    range.setEnd(text.firstChild, 4);
    selection.removeAllRanges();
    selection.addRange(range);
    const rect = text.getBoundingClientRect();
    const x = rect.left + 5, y = rect.top + rect.height / 2;
    text.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 128, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    range.setEnd(text.firstChild, 8);
    const move = new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 128,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y
    });
    window.dispatchEvent(move);
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 128, pointerType: "mouse",
      button: 0, buttons: 0
    }));
    return { selection: selection.toString(), prevented: move.defaultPrevented,
      x: element.scrollLeft, active: element.classList.contains("ae--pointerscrolling") };
  });
  expect(result).toEqual({ selection: "selectab", prevented: false, x: 0, active: false });
});

test("vertical-only text drag takes over before 100 ms when motion is vertical", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto">
    <div style="width:180px;height:300px"><span id="text">selectable words here</span></div>
  </div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const text = document.getElementById("text");
    const rect = text.getBoundingClientRect();
    const x = rect.left + 5, y = rect.top + rect.height / 2;
    text.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 129, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const move = new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 129,
      pointerType: "mouse", buttons: 1, clientX: x + 8, clientY: y - 11
    });
    window.dispatchEvent(move);
    const during = { prevented: move.defaultPrevented, x: element.scrollLeft,
      y: element.scrollTop, active: element.classList.contains("ae--pointerscrolling") };
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 129, pointerType: "mouse",
      button: 0, buttons: 0
    }));
    return during;
  });
  expect(result).toEqual({ prevented: true, x: 0, y: 11, active: true });
});

test("text-origin pointer scrolling waits 100 ms for selection", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:200px;height:100px;overflow:auto">
    <div style="width:300px;height:300px"><span id="text">selectable words here</span></div>
  </div>`);
  const pending = await page.evaluate(() => {
    const element = document.getElementById("box");
    const text = document.getElementById("text");
    const rect = text.getBoundingClientRect();
    const x = rect.left + 5, y = rect.top + rect.height / 2;
    window.textPointer = { x, y };
    text.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 121, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const move = new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 121,
      pointerType: "mouse", buttons: 1, clientX: x, clientY: y - 30
    });
    window.dispatchEvent(move);
    return { prevented: move.defaultPrevented, y: element.scrollTop,
      active: element.classList.contains("ae--pointerscrolling") };
  });
  expect(pending).toEqual({ prevented: false, y: 0, active: false });
  await page.waitForTimeout(120);
  const active = await page.evaluate(() => {
    const element = document.getElementById("box");
    const { x, y } = window.textPointer;
    const move = new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 121,
      pointerType: "mouse", buttons: 1, clientX: x, clientY: y - 30
    });
    window.dispatchEvent(move);
    const result = { prevented: move.defaultPrevented, y: element.scrollTop,
      active: element.classList.contains("ae--pointerscrolling") };
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 121, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x, clientY: y - 30
    }));
    return result;
  });
  expect(active).toEqual({ prevented: true, y: 30, active: true });
});

test("the first text-origin direction stays locked after the selection wait", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
    <div style="width:300px;height:300px"><span id="text">selectable words here</span></div>
  </div>`);
  await page.evaluate(() => {
    const text = document.getElementById("text");
    const rect = text.getBoundingClientRect();
    const x = rect.left + 5, y = rect.top + rect.height / 2;
    window.textPointer = { x, y };
    text.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 126, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 126,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y - 10
    }));
  });
  await page.waitForTimeout(120);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const { x, y } = window.textPointer;
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 126,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y - 60
    }));
    const positions = [element.scrollLeft, element.scrollTop];
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 126, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 30, clientY: y - 60
    }));
    return positions;
  });
  expect(result).toEqual([30, 0]);
});

test("vertical pointer movement still drags a vertical-only box", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbox-momentum="false"
    style="width:200px;height:100px;overflow:auto;font:16px monospace">
    <div style="width:180px;height:300px;padding-top:60px;box-sizing:border-box"><span id="text">abcdefghijklmno</span></div>
  </div>`);
  const rect = await page.locator("#text").boundingBox();
  await page.mouse.move(rect.x + 5, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.move(rect.x + 5, rect.y - 40, { steps: 5 });
  await page.mouse.up();
  expect(await page.evaluate(() => document.getElementById("box").scrollTop))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => document.getElementById("box")
    .style.getPropertyValue("user-select"))).toBe("");
});

test("touch and interactive controls do not start pointer dragging", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "<button id='button'>Click</button>"));
  expect(await drag(page, "box", "touch")).toMatchObject({ x: 0, y: 0 });
  await page.evaluate(() => {
    window.buttonClicks = 0;
    document.getElementById("button").addEventListener("click", () => { window.buttonClicks++; });
    document.addEventListener("mousedown", event => {
      if (event.target.id === "button") window.buttonMouseDownPrevented = event.defaultPrevented;
    });
  });
  await page.locator("#button").click();
  expect(await page.evaluate(() => ({
    prevented: window.buttonMouseDownPrevented, clicks: window.buttonClicks
  }))).toEqual({ prevented: false, clicks: 1 });
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const button = document.getElementById("button");
    const rect = button.getBoundingClientRect();
    button.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 22, pointerType: "mouse",
      button: 0, buttons: 1, clientX: rect.left + 5, clientY: rect.top + 5
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, isPrimary: true, pointerId: 22, pointerType: "mouse",
      buttons: 1, clientX: 0, clientY: 0
    }));
    return { x: element.scrollLeft, y: element.scrollTop,
      userSelect: element.style.getPropertyValue("user-select") };
  });
  expect(result).toEqual({ x: 0, y: 0, userSelect: "" });
});

test("pointer mode keeps native behavior on a coarse-pointer device", async ({ page }) => {
  await setup(page, box("box"), { coarse: true });
  expect(await drag(page, "box")).toMatchObject({ x: 0, y: 0 });
  await page.evaluate(() => document.getElementById("box").scrollTo(50, 40));
  await expect.poll(() => page.evaluate(() => [
    document.getElementById("box").style.getPropertyValue("--ae-scroll-x-progress"),
    document.getElementById("box").style.getPropertyValue("--ae-scroll-y-progress")
  ])).toEqual(["0.25", "0.2"]);
});

test("pointer dragging preserves an existing user-select declaration", async ({ page }) => {
  await setup(page, box("box"));
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.style.setProperty("user-select", "text", "important");
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 171,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 171,
      pointerType: "mouse", buttons: 1, clientX: x - 50, clientY: y - 40
    }));
    const read = () => [element.style.getPropertyValue("user-select"),
      element.style.getPropertyPriority("user-select")];
    const during = read();
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 171, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 50, clientY: y - 40
    }));
    return { during, after: read(), x: element.scrollLeft, y: element.scrollTop };
  });
  expect(result).toEqual({ during: ["text", "important"], after: ["text", "important"],
    x: 50, y: 0 });
});

test("content resize refreshes native progress", async ({ page }) => {
  await setup(page, box("box", "native"));
  await page.evaluate(() => document.getElementById("box").scrollTo(100, 0));
  await expect.poll(() => page.evaluate(() => Number(document.getElementById("box")
    .style.getPropertyValue("--ae-scroll-x-progress")))).toBe(0.5);
  await page.evaluate(() => { document.getElementById("box").firstElementChild.style.width = "400px"; });
  await expect.poll(() => page.evaluate(() => Number(document.getElementById("box")
    .style.getPropertyValue("--ae-scroll-x-progress")))).toBeCloseTo(1 / 3, 3);
});

test("mode changes and unmount stop an active drag and restore inline styles", async ({ page }) => {
  await setup(page, box("box"));
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.style.setProperty("user-select", "text", "important");
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 7, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    element.setAttribute("data-ae-scrollbox", "native");
    await AelluxJs.mountManager.update(element, "scrollbox");
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, isPrimary: true, pointerId: 7, pointerType: "mouse",
      buttons: 1, clientX: x - 50, clientY: y - 50
    }));
    const afterSwitch = { x: element.scrollLeft, y: element.scrollTop,
      userSelect: element.style.getPropertyValue("user-select"),
      priority: element.style.getPropertyPriority("user-select") };
    await AelluxJs.unmount(element, "scrollbox");
    return { afterSwitch,
      progress: [element.style.getPropertyValue("--ae-scroll-x-progress"),
        element.style.getPropertyValue("--ae-scroll-y-progress")] };
  });
  expect(result).toEqual({
    afterSwitch: { x: 0, y: 0, userSelect: "text", priority: "important" },
    progress: [".2", ".3"]
  });
});

test("vertical wheel converts for horizontal-only native boxes and releases at an edge", async ({ page }) => {
  await setup(page, `<div id="parent" style="width:180px;height:120px;overflow:auto">
    <div style="height:500px">
      <div id="box" data-ae-scrollbox="pointer" style="width:100px;height:100px;overflow:auto">
        <div style="width:300px;height:100px"></div>
      </div>
    </div></div>`);
  const wheel = deltaY => page.evaluate(value => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", { deltaY: value, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented, x: element.scrollLeft };
  }, deltaY);
  expect(await wheel(120)).toEqual({ prevented: true, x: 120 });
  expect(await wheel(120)).toEqual({ prevented: false, x: 200 });
  expect(await wheel(120)).toEqual({ prevented: false, x: 200 });
});

test("vertical wheel stops converting when vertical scrolling becomes available", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto">
    <div id="content" style="width:300px;height:100px"></div>
  </div>`);
  const wheel = () => page.evaluate(() => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", {
      deltaY: 40, bubbles: true, cancelable: true
    });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented, x: element.scrollLeft };
  });
  expect(await wheel()).toEqual({ prevented: true, x: 40 });
  await page.evaluate(() => document.getElementById("content").style.height = "300px");
  expect(await wheel()).toEqual({ prevented: false, x: 40 });
  await page.evaluate(() => document.getElementById("box").style.overflowY = "hidden");
  expect(await wheel()).toEqual({ prevented: true, x: 80 });
});

test("converted wheel stretches an elastic child and scrolls its vertical parent", async ({ page }) => {
  await setup(page, `<div id="parent" data-ae-scrollbox="native"
    style="width:180px;height:120px;overflow:auto">
    <div style="height:500px">
      <div id="box" data-ae-scrollbox="pointer" style="width:100px;height:100px;overflow:auto">
        <div id="elastic" data-ae-scrollbox-elastic style="width:300px;height:100px"></div>
      </div>
    </div></div>`);
  const wheel = deltaY => page.evaluate(value => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", { deltaY: value, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented, x: element.scrollLeft,
      transform: document.getElementById("elastic").style.transform };
  }, deltaY);
  expect(await wheel(120)).toEqual({ prevented: true, x: 120, transform: "" });
  const crossing = await wheel(120);
  expect(crossing).toMatchObject({ prevented: false, x: 200 });
  expect(crossing.transform).toContain("scale(");
  const edge = await wheel(120);
  expect(edge).toMatchObject({ prevented: false, x: 200 });
  expect(edge.transform).toContain("scale(");
  await page.evaluate(() => {
    document.getElementById("parent").scrollTo({ top: 0, behavior: "instant" });
    window.wheelAtParent = null;
    document.getElementById("parent").addEventListener("wheel", event => {
      window.wheelAtParent = {
        prevented: event.defaultPrevented,
        transform: document.getElementById("elastic").style.transform
      };
    });
  });
  const rect = await page.locator("#box").boundingBox();
  await page.mouse.move(rect.x + 50, rect.y + 50);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => page.evaluate(() => window.wheelAtParent)).toMatchObject({
    prevented: false, transform: expect.stringContaining("scale(")
  });
  await expect.poll(() => page.evaluate(() => document.getElementById("parent").scrollTop))
    .toBeGreaterThan(0);
});

test("pointer release keeps scrolling with momentum enabled by default", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "", null)
    .replace("width:300px;height:300px", "width:1000px;height:1000px"));
  const released = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    await new Promise(resolve => setTimeout(resolve, 16));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 17,
      pointerType: "mouse", buttons: 1, clientX: x - 40, clientY: y - 40
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 40, clientY: y - 40
    }));
    return [element.scrollLeft, element.scrollTop];
  });
  expect(released).toEqual([40, 0]);
  await expect.poll(() => page.evaluate(() => document.getElementById("box").scrollLeft))
    .toBeGreaterThan(40);
  expect(await page.evaluate(() => document.getElementById("box").scrollTop)).toBe(0);
});

test("momentum advances ten percent of the remaining distance each frame and terminates", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "", null)
    .replace("width:300px;height:300px", "width:1000px;height:1000px"));
  await page.evaluate(() => {
    window.pendingMomentumFrames = [];
    window.originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => {
      window.pendingMomentumFrames.push(callback);
      return window.pendingMomentumFrames.length;
    };
  });
  expect(await drag(page, "box")).toMatchObject({ x: 50, y: 0 });
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const positions = [];
    let previous = element.scrollLeft;
    try {
      for (let step = 0; step < 360 && window.pendingMomentumFrames.length; step++) {
        window.pendingMomentumFrames.shift()(performance.now());
        if (previous !== element.scrollLeft) {
          positions.push([element.scrollLeft, element.scrollTop]);
          previous = element.scrollLeft;
        }
        await Promise.resolve();
        await Promise.resolve();
      }
      return { positions, pending: window.pendingMomentumFrames.length };
    } finally {
      window.requestAnimationFrame = window.originalRequestAnimationFrame;
      delete window.pendingMomentumFrames;
      delete window.originalRequestAnimationFrame;
    }
  });
  expect(result.positions[0]).toEqual([135, 0]);
  expect(result.positions[1][0]).toBeGreaterThan(205);
  expect(result.positions[1][0]).toBeLessThan(220);
  expect(result.positions[1][1]).toBe(0);
  expect(result.positions.at(-1)).toEqual([900, 0]);
  expect(result.pending).toBe(0);
});

test("momentum false stops at release", async ({ page }) => {
  await setup(page, box("box"));
  expect(await drag(page, "box")).toMatchObject({ x: 50, y: 0 });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => {
    const element = document.getElementById("box");
    return [element.scrollLeft, element.scrollTop];
  })).toEqual([50, 0]);
});

test("disabling momentum while coasting stops the animation", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "", null)
    .replace("width:300px;height:300px", "width:1000px;height:1000px"));
  await drag(page, "box");
  await expect.poll(() => page.evaluate(() => document.getElementById("box").scrollLeft))
    .toBeGreaterThan(50);
  const stopped = await page.evaluate(async () => {
    const element = document.getElementById("box");
    element.setAttribute("data-ae-scrollbox-momentum", "false");
    await AelluxJs.mountManager.update(element, "scrollbox");
    return [element.scrollLeft, element.scrollTop];
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => {
    const element = document.getElementById("box");
    return [element.scrollLeft, element.scrollTop];
  })).toEqual(stopped);
});

test("a pause before release does not start momentum", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "", null));
  const released = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 17,
      pointerType: "mouse", buttons: 1, clientX: x - 40, clientY: y - 40
    }));
    await new Promise(resolve => setTimeout(resolve, 350));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 40, clientY: y - 40
    }));
    return [element.scrollLeft, element.scrollTop];
  });
  expect(released).toEqual([40, 0]);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => {
    const element = document.getElementById("box");
    return [element.scrollLeft, element.scrollTop];
  })).toEqual([40, 0]);
});

test("weak CSS makes scrolling smooth and honors reduced motion on every element", async ({ page }) => {
  await setup(page, box("box", "native"));
  const behaviors = () => page.evaluate(() => [
    document.documentElement, document.body, document.getElementById("box")
  ].map(element => getComputedStyle(element).scrollBehavior));
  expect(await behaviors()).toEqual(["smooth", "smooth", "smooth"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await behaviors()).toEqual(["auto", "auto", "auto"]);
});

test("elastic pointer drag transforms its marked wrapper and restores it on unmount", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto;padding:7px 9px 11px 13px">
    <div data-ae-scrollbox-elastic
      style="width:300px;height:300px;transform:scale(1);transform-origin:25% 75%"></div></div>`);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const rect = element.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    const pointer = (type, clientX, clientY, buttons) => new PointerEvent(type, {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 19,
      pointerType: "mouse", button: type === "pointermove" ? -1 : 0,
      buttons, clientX, clientY
    });
    element.dispatchEvent(pointer("pointerdown", x, y, 1));
    window.dispatchEvent(pointer("pointermove", x + 30, y + 60, 1));
    const stretched = wrapper.style.transform;
    const activeOrigin = wrapper.style.transformOrigin;
    const partialRect = wrapper.getBoundingClientRect();
    const partialGrowth = { x: partialRect.width - wrapper.offsetWidth,
      y: partialRect.height - wrapper.offsetHeight };
    window.dispatchEvent(pointer("pointermove", x + 120, y + 120, 1));
    const maxRect = wrapper.getBoundingClientRect();
    const maxGrowth = { x: maxRect.width - wrapper.offsetWidth,
      y: maxRect.height - wrapper.offsetHeight };
    const maxSpace = { x: element.clientWidth / 4, y: element.clientHeight / 4 };
    window.dispatchEvent(pointer("pointerup", x + 120, y + 120, 0));
    const releasing = wrapper.classList.contains("ae--scrollbox-elastic-release");
    await AelluxJs.unmount(element, "scrollbox");
    return { stretched, activeOrigin, partialGrowth, maxGrowth, maxSpace,
      releasing, transform: wrapper.style.transform,
      origin: wrapper.style.transformOrigin,
      padding: element.style.getPropertyValue("padding"),
      releaseClass: wrapper.classList.contains("ae--scrollbox-elastic-release") };
  });
  expect(result.stretched).toMatch(/translate3d\(0px, [\d.]+px, 0px\)/);
  expect(result.stretched).toMatch(/scale\(1, 1\.\d+\)/);
  expect(result.stretched.startsWith("scale(")).toBe(true);
  expect(result.partialGrowth.x).toBe(0);
  expect(result.partialGrowth.y).toBeCloseTo(2 * elasticAmount(60, result.maxSpace.y), 1);
  expect(result.maxGrowth.x).toBe(0);
  expect(result.maxGrowth.y).toBeCloseTo(2 * elasticAmount(120, result.maxSpace.y), 1);
  expect(result.activeOrigin.split(" ")[1]).toBe("0%");
  expect(result.releasing).toBe(true);
  expect(result.transform).toBe("scale(1)");
  expect(result.origin.startsWith("25% 75%")).toBe(true);
  expect(result.padding).toBe("7px 9px 11px 13px");
  expect(result.releaseClass).toBe(false);
});

test("elastic native wheel transforms its wrapper and settles", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div></div>`);
  const stretched = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const event = new WheelEvent("wheel", { deltaY: -60, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    const transform = wrapper.style.transform;
    await new Promise(resolve => setTimeout(resolve, 160));
    return { prevented: event.defaultPrevented, limit: element.clientHeight / 4,
      transform, releasing: wrapper.classList.contains("ae--scrollbox-elastic-release"),
      settlingScale: new DOMMatrixReadOnly(getComputedStyle(wrapper).transform).m22 };
  });
  expect(stretched.prevented).toBe(true);
  expect(Number.parseFloat(/translate3d\(0px, ([\d.]+)px/.exec(stretched.transform)[1]))
    .toBeCloseTo(elasticAmount(60, stretched.limit), 1);
  expect(stretched.transform).toMatch(/scale\(1, 1\.\d+\)/);
  expect(stretched.releasing).toBe(true);
  expect(stretched.settlingScale).toBeGreaterThan(1);
  expect(stretched.settlingScale).toBeLessThan(1.1);
  await expect.poll(() => page.evaluate(() => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    return { transform: wrapper.style.transform,
      releaseClass: wrapper.classList.contains("ae--scrollbox-elastic-release") };
  })).toEqual({ transform: "", releaseClass: false });
});

test("overscroll-behavior none suppresses elastic pressure in its axis", async ({ page }) => {
  const supported = await page.evaluate(() => CSS.supports("overscroll-behavior-y", "none"));
  test.skip(!supported, "This browser does not support overscroll-behavior");

  await setup(page, `<div id="none" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;overscroll-behavior-y:none">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div>
  </div>
  <div id="contain" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;overscroll-behavior-y:contain">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div>
  </div>`);

  const result = await page.evaluate(() => ["none", "contain"].map(id => {
    const element = document.getElementById(id);
    const wheel = new WheelEvent("wheel", {
      deltaY: -60, bubbles: true, cancelable: true
    });
    element.dispatchEvent(wheel);
    return { id, prevented: wheel.defaultPrevented,
      transform: element.firstElementChild.style.transform };
  }));

  expect(result[0]).toEqual({ id: "none", prevented: false, transform: "" });
  expect(result[1].prevented).toBe(true);
  expect(result[1].transform).toContain("translate3d");
});

test("pointer drag with overscroll-behavior none reverses without elastic force", async ({ page }) => {
  const supported = await page.evaluate(() => CSS.supports("overscroll-behavior-y", "none"));
  test.skip(!supported, "This browser does not support overscroll-behavior");

  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto;overscroll-behavior-y:none">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div>
  </div>`);

  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 340,
      pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y
    }));
    for (const position of [y + 60, y - 40]) window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 340,
      pointerType: "mouse", buttons: 1, clientX: x, clientY: position
    }));
    const result = { transform: element.firstElementChild.style.transform,
      scrollTop: element.scrollTop };
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 340,
      pointerType: "mouse", button: 0, buttons: 0,
      clientX: x, clientY: y - 40
    }));
    return result;
  });

  expect(result.transform).toBe("");
  expect(result.scrollTop).toBe(100);
});

test("native touch respects overscroll-behavior none during elastic pressure", async ({ page }) => {
  const supported = await page.evaluate(() => CSS.supports("overscroll-behavior-y", "none"));
  test.skip(!supported, "This browser does not support overscroll-behavior");

  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;overscroll-behavior-y:none">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div>
  </div>`);

  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const touchEvent = (type, y, active) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", { value: active ? [
        { identifier: 341, clientX: 40, clientY: y }
      ] : [] });
      return event;
    };
    element.dispatchEvent(touchEvent("touchstart", 40, true));
    const move = touchEvent("touchmove", 100, true);
    element.dispatchEvent(move);
    const result = { prevented: move.defaultPrevented,
      transform: element.firstElementChild.style.transform };
    element.dispatchEvent(touchEvent("touchend", 100, false));
    return result;
  });

  expect(result).toEqual({ prevented: false, transform: "" });
});

test("elastic native touch stretches while pulling beyond an edge", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;padding:6px">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const touchEvent = (type, y, active) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", { value: active ? [
        { identifier: 1, clientX: 40, clientY: y }
      ] : [] });
      return event;
    };
    element.dispatchEvent(touchEvent("touchstart", 40, true));
    const move = touchEvent("touchmove", 100, true);
    element.dispatchEvent(move);
    const transform = element.firstElementChild.style.transform;
    element.dispatchEvent(touchEvent("touchend", 100, false));
    return { prevented: move.defaultPrevented, limit: element.clientHeight / 4, transform,
      releasing: element.firstElementChild.classList.contains("ae--scrollbox-elastic-release") };
  });
  expect(result.prevented).toBe(true);
  expect(Number.parseFloat(/translate3d\(0px, ([\d.]+)px/.exec(result.transform)[1]))
    .toBeCloseTo(elasticAmount(60, result.limit), 1);
  expect(result.transform).toMatch(/scale\(1, 1\.\d+\)/);
  expect(result.releasing).toBe(true);
});

test("elastic pointer drag moves its wrapper away from the right edge", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto;padding:7px 9px 11px 13px">
    <div data-ae-scrollbox-elastic style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const maxX = element.scrollWidth - element.clientWidth;
    const maxY = element.scrollHeight - element.clientHeight;
    element.scrollTo({ left: maxX, top: maxY, behavior: "instant" });
    const rect = element.getBoundingClientRect();
    const wrapper = element.firstElementChild;
    const beforeGapX = rect.right - wrapper.getBoundingClientRect().right;
    const beforeGapY = rect.bottom - wrapper.getBoundingClientRect().bottom;
    const x = rect.left + 50, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 23, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 23,
      pointerType: "mouse", buttons: 1, clientX: x - 60, clientY: y - 60
    }));
    return {
      transform: wrapper.style.transform,
      origin: wrapper.style.transformOrigin,
      scrollLeft: element.scrollLeft, scrollTop: element.scrollTop, maxX, maxY,
      gapX: rect.right - wrapper.getBoundingClientRect().right - beforeGapX,
      gapY: rect.bottom - wrapper.getBoundingClientRect().bottom - beforeGapY
    };
  });
  expect(result.transform).toMatch(/translate3d\(-[\d.]+px, 0px, 0px\)/);
  expect(result.transform).toMatch(/scale\(1\.\d+, 1\)/);
  expect(result.transform.startsWith("scale(")).toBe(true);
  expect(Number.parseFloat(result.origin.split(" ")[0])).toBeGreaterThanOrEqual(300);
  expect(Number.parseFloat(result.origin.split(" ")[1])).toBeGreaterThan(0);
  expect(result.scrollLeft).toBe(result.maxX);
  expect(result.scrollTop).toBe(result.maxY);
  expect(result.gapX).toBeGreaterThan(10);
  expect(result.gapY).toBeCloseTo(0, 1);
});

test("elastic pointer drag moves its wrapper away from the bottom edge", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
    <div data-ae-scrollbox-elastic style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    element.scrollTo({ top: element.scrollHeight, behavior: "instant" });
    const maxY = element.scrollHeight - element.clientHeight;
    const rect = element.getBoundingClientRect();
    const before = wrapper.getBoundingClientRect().bottom;
    const x = rect.left + 50, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 124, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 124,
      pointerType: "mouse", buttons: 1, clientX: x, clientY: y - 60
    }));
    const result = { transform: wrapper.style.transform,
      origin: wrapper.style.transformOrigin, scrollTop: element.scrollTop,
      maxY, gapY: before - wrapper.getBoundingClientRect().bottom };
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 124, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x, clientY: y - 60
    }));
    return result;
  });
  expect(result.transform).toMatch(/translate3d\(0px, -[\d.]+px, 0px\)/);
  expect(result.transform).toMatch(/scale\(1, 1\.\d+\)/);
  expect(Number.parseFloat(result.origin.split(" ")[1])).toBeGreaterThanOrEqual(300);
  expect(result.scrollTop).toBe(result.maxY);
  expect(result.gapY).toBeGreaterThan(10);
});

test("elastic trailing pivot follows content overflowing its wrapper", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
    <div data-ae-scrollbox-elastic style="width:100px;height:100px">
      <div id="content" style="width:400px;height:400px"></div>
    </div></div>`);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const content = document.getElementById("content");
    const rect = element.getBoundingClientRect();
    element.scrollTo({ left: element.scrollWidth, top: element.scrollHeight, behavior: "instant" });
    const before = content.getBoundingClientRect();
    const beforeScroll = { x: element.scrollLeft, y: element.scrollTop };
    const beforeWrapper = { width: wrapper.offsetWidth, height: wrapper.offsetHeight };
    const x = rect.left + 50, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 53, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 53,
      pointerType: "mouse", buttons: 1, clientX: x - 60, clientY: y - 60
    }));
    const after = content.getBoundingClientRect();
    const origin = wrapper.style.transformOrigin.split(" ");
    const result = { gapX: before.right - after.right, gapY: before.bottom - after.bottom,
      originX: Number.parseFloat(origin[0]), originY: Number.parseFloat(origin[1]),
      wrapperWidth: wrapper.offsetWidth, wrapperHeight: wrapper.offsetHeight, beforeWrapper,
      contentWidth: wrapper.scrollWidth, contentHeight: wrapper.scrollHeight,
      beforeScroll, afterScroll: { x: element.scrollLeft, y: element.scrollTop },
      transform: wrapper.style.transform };
    await AelluxJs.unmount(element, "scrollbox");
    return { ...result, restoredMinWidth: wrapper.style.minWidth,
      restoredMinHeight: wrapper.style.minHeight };
  });
  expect(result.beforeWrapper).toEqual({ width: 100, height: 100 });
  expect(result.wrapperWidth).toBeGreaterThanOrEqual(400);
  expect(result.wrapperHeight).toBe(100);
  expect(result.originX).toBeGreaterThanOrEqual(result.contentWidth);
  expect(result.originY).toBe(50);
  expect(result.afterScroll).toEqual(result.beforeScroll);
  expect(result.gapX, JSON.stringify(result)).toBeGreaterThan(10);
  expect(result.gapY).toBeCloseTo(0, 1);
  expect(result.restoredMinWidth).toBe("");
  expect(result.restoredMinHeight).toBe("");
});

test("elastic bottom and right transform animates during release", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div data-ae-scrollbox-elastic style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const rect = element.getBoundingClientRect();
    const gap = () => ({
      x: rect.right - wrapper.getBoundingClientRect().right,
      y: rect.bottom - wrapper.getBoundingClientRect().bottom
    });
    element.scrollTo({ left: element.scrollWidth, top: element.scrollHeight, behavior: "instant" });
    const before = gap();
    const x = rect.left + 50, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 41, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 41,
      pointerType: "mouse", buttons: 1, clientX: x - 60, clientY: y - 60
    }));
    const during = gap();
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 41, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 60, clientY: y - 60
    }));
    await new Promise(resolve => setTimeout(resolve, 250));
    const middle = gap();
    const matrix = new DOMMatrixReadOnly(getComputedStyle(wrapper).transform);
    return { before, during, middle, scaleX: matrix.m11, scaleY: matrix.m22 };
  });
  expect(result.scaleX).toBeGreaterThan(1);
  expect(result.scaleX).toBeLessThan(1.1);
  expect(result.scaleY).toBe(1);
  expect(result.middle.x).toBeGreaterThan(result.before.x);
  expect(result.middle.y).toBeCloseTo(result.before.y, 1);
  expect(result.middle.x).toBeLessThan(result.during.x);
  expect(result.middle.y).toBeCloseTo(result.during.y, 1);
});

test("elastic native wheel moves its wrapper at bottom and right limits", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div data-ae-scrollbox-elastic style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    element.scrollTo({ left: element.scrollWidth, top: element.scrollHeight, behavior: "instant" });
    const event = new WheelEvent("wheel", {
      deltaX: 60, deltaY: 60, bubbles: true, cancelable: true
    });
    element.dispatchEvent(event);
    return {
      prevented: event.defaultPrevented,
      transform: element.firstElementChild.style.transform,
      scrollLeft: element.scrollLeft, scrollTop: element.scrollTop,
      maxX: element.scrollWidth - element.clientWidth,
      maxY: element.scrollHeight - element.clientHeight
    };
  });
  expect(result.prevented).toBe(true);
  expect(result.transform).toMatch(/translate3d\(-[\d.]+px, -[\d.]+px, 0px\)/);
  expect(result.transform).toMatch(/scale\(1\.\d+(?:, 1\.\d+)?\)/);
  expect(result.scrollLeft).toBe(result.maxX);
  expect(result.scrollTop).toBe(result.maxY);
});

test("elastic limits accept fractions and pixel values per axis", async ({ page }) => {
  const cases = [
    { value: "", y: 25, x: 25 },
    { value: "1/4 1/2", y: 25, x: 50 },
    { value: "30px 40px", y: 30, x: 40 },
    { value: "35 45", y: 35, x: 45 },
    { value: "30px", y: 30, x: 30 },
    { value: "invalid", y: 25, x: 25 }
  ];
  await setup(page, cases.map(({ value }, index) =>
    `<div id="box-${index}" data-ae-scrollbox="native"
      style="width:100px;height:100px;overflow:auto">
      <div data-ae-scrollbox-elastic="${value}" style="width:300px;height:300px"></div>
    </div>`).join(""));
  const result = await page.evaluate(count => Array.from({ length: count }, (_, index) => {
    const element = document.getElementById(`box-${index}`);
    const wrapper = element.firstElementChild;
    element.dispatchEvent(new WheelEvent("wheel", {
      deltaX: -600, deltaY: -600, bubbles: true, cancelable: true
    }));
    const transform = wrapper.style.transform;
    const scale = /scale\(([^,()]+)(?:,\s*([^)]+))?\)/.exec(transform);
    const translate = /translate3d\(([^p]+)px, ([^p]+)px, 0(?:px)?\)/.exec(transform);
    return {
      x: Number(translate[1]), y: Number(translate[2]),
      grownX: (Number(scale[1]) - 1) * Math.max(wrapper.offsetWidth, wrapper.scrollWidth),
      grownY: (Number(scale[2] || scale[1]) - 1) *
        Math.max(wrapper.offsetHeight, wrapper.scrollHeight),
      width: element.clientWidth, height: element.clientHeight, transform
    };
  }), cases.length);
  for (const [index, item] of result.entries()) {
    const expected = cases[index];
    const limitY = expected.value === "" || expected.value === "invalid" ||
      expected.value.startsWith("1/4") ? item.height / 4 : expected.y;
    const limitX = expected.value === "" || expected.value === "invalid"
      ? item.width / 4 : expected.value === "1/4 1/2" ? item.width / 2 : expected.x;
    const y = limitY * (1 - Math.exp(-600 / (3 * limitY)));
    const x = limitX * (1 - Math.exp(-600 / (3 * limitX)));
    expect(item.y).toBeCloseTo(y, 4);
    expect(item.x).toBeCloseTo(x, 4);
    expect(item.grownY, JSON.stringify(item)).toBeCloseTo(2 * y, 1);
    expect(item.grownX).toBeCloseTo(2 * x, 1);
  }
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory(1)[0]?.code)).toBe(2015);
});

test("elastic pressure eases toward the limit and returns by 15 percent per frame", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const rect = element.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    const frameCallbacks = [];
    window.requestAnimationFrame = callback => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    };
    const amount = () => Number.parseFloat(/translate3d\(0px, ([\d.]+)px/.exec(
      wrapper.style.transform)[1]);
    const pointer = (type, clientY, buttons) => new PointerEvent(type, {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 91,
      pointerType: "mouse", button: type === "pointermove" ? -1 : 0,
      buttons, clientX: x, clientY
    });
    element.dispatchEvent(pointer("pointerdown", y, 1));
    const pressures = [];
    for (const force of [30, 60, 90]) {
      window.dispatchEvent(pointer("pointermove", y + force, 1));
      pressures.push(amount());
    }
    window.dispatchEvent(pointer("pointerup", y + 90, 0));
    const beforeFrame = amount();
    for (let step = 0; step < 4 && frameCallbacks.length && amount() === beforeFrame; step++)
      frameCallbacks.shift()(performance.now());
    const afterFrame = amount();
    return { pressures, beforeFrame, afterFrame, limit: element.clientHeight / 4 };
  });
  for (const [index, force] of [30, 60, 90].entries()) {
    expect(result.pressures[index]).toBeCloseTo(elasticAmount(force, result.limit), 2);
  }
  expect(result.pressures[1] - result.pressures[0])
    .toBeLessThan(result.pressures[0]);
  expect(result.pressures[2] - result.pressures[1])
    .toBeLessThan(result.pressures[1] - result.pressures[0]);
  expect(result.afterFrame).toBeCloseTo(result.beforeFrame * 0.85, 2);
});

test("elastic snapback is immediate with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const rect = element.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    const pointer = (type, clientY, buttons) => new PointerEvent(type, {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 92,
      pointerType: "mouse", button: type === "pointermove" ? -1 : 0,
      buttons, clientX: x, clientY
    });
    element.dispatchEvent(pointer("pointerdown", y, 1));
    window.dispatchEvent(pointer("pointermove", y + 60, 1));
    const during = wrapper.style.transform;
    window.dispatchEvent(pointer("pointerup", y + 60, 0));
    return { during, after: wrapper.style.transform,
      releasing: wrapper.classList.contains("ae--scrollbox-elastic-release") };
  });
  expect(result.during).toContain("translate3d(");
  expect(result.after).toBe("");
  expect(result.releasing).toBe(false);
});

test("elastic false on the child leaves native wheel and transform unchanged", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div data-ae-scrollbox-elastic="false" style="width:100px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", { deltaY: -60, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented,
      padding: element.style.getPropertyValue("padding"),
      transform: element.firstElementChild.style.transform,
      boxSizing: getComputedStyle(element).boxSizing };
  });
  expect(result).toEqual({ prevented: false, padding: "8px",
    transform: "", boxSizing: "content-box" });
});

test("elastic reports a diagnostic when its marked child is not the only direct child", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native" style="width:100px;height:100px">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div>
    <div>extra child</div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", { deltaY: -60, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented,
      code: AelluxJs.diagnostics.showHistory(1)[0]?.code,
      transform: element.firstElementChild.style.transform };
  });
  expect(result).toEqual({ prevented: false, code: 1120, transform: "" });
});
