import { expect, test } from "@playwright/test";

// Axes and available distances are ordered from the innermost box outward.
async function setupChain(page, { axes = ["y", "x", "y"], rooms = [0, 0, 300],
  sign = 1, styles = {}, elastic = true, plain = [], zeroRange = [], snap = false } = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ axes, styles, elastic, plain, zeroRange, snap }) => {
    let child = "";
    axes.forEach((axis, index) => {
      const size = 120 + index * 20, extra = zeroRange.includes(index) ? 0 : 300;
      const points = snap && index === 1 ? Array.from({ length: 3 }, (_, point) =>
        `<div data-ae-snap-item style="position:absolute;left:${point * 150}px;top:0;width:140px;height:140px"></div>`).join("") : "";
      child = `<div id="level${index}" ${plain.includes(index) ? "" : 'data-ae-scrollbox="native"'}
        ${snap && index === 1 ? "data-ae-scrollbox-snap" : ""}
        style="position:sticky;left:0;top:0;width:${size}px;height:${size}px;overflow-${axis}:auto;overflow-${axis === "x" ? "y" : "x"}:hidden;${styles[index] || ""}">
        <div id="content${index}" ${elastic && !plain.includes(index) ? "data-ae-scrollbox-elastic" : ""}
          style="position:relative;display:inline-block;vertical-align:top;width:${size + (axis === "x" ? extra : 0)}px;height:${size + (axis === "y" ? extra : 0)}px">${points}${child}</div></div>`;
    });
    document.body.innerHTML = child;
    AelluxJs.ext("scrollbox");
    if (snap) AelluxJs.ext("scrollbox-snap");
  }, { axes, styles, elastic, plain, zeroRange, snap });
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  if (snap) await page.addScriptTag({ url: "/src/aellux.ext.scrollbox-snap.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await page.waitForFunction(snap => AelluxJs.ext.scrollbox?.initialized &&
    (!snap || AelluxJs.ext.scrollboxSnap?.initialized), snap);
  await page.evaluate(({ axes, rooms, sign, snap }) => {
    if (snap && rooms[1] === 0) AelluxJs.ext.scrollboxSnap.goto(document.getElementById("level1"), 2, "instant");
    axes.forEach((axis, index) => {
      const element = document.getElementById(`level${index}`);
      const maximum = axis === "x" ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight;
      const position = sign > 0 ? maximum - rooms[index] : rooms[index];
      element.scrollTo({ left: axis === "x" ? position : 0, top: axis === "y" ? position : 0, behavior: "instant" });
    });
  }, { axes, rooms, sign, snap });
}

const positions = (page, axes) => page.evaluate(axes => axes.map((axis, index) => {
  const element = document.getElementById(`level${index}`);
  return element[axis === "x" ? "scrollLeft" : "scrollTop"];
}), axes);

async function wheel(page, { deltaY = 120, deltaX = 0, deltaMode = 0 } = {}) {
  return page.evaluate(options => {
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...options });
    document.getElementById("level0").dispatchEvent(event);
    const elements = Array.from(document.querySelectorAll("[data-ae-scrollbox]")).reverse();
    return { prevented: event.defaultPrevented,
      elastic: elements.map(element => element.firstElementChild.style.transform.includes("scale(")),
      releasing: elements.map(element => element.firstElementChild.classList.contains("ae--scrollbox-elastic-release")) };
  }, { deltaX, deltaY, deltaMode });
}

for (const axes of [["y", "x", "y"], ["y", "y", "x", "y"], ["y", "x", "x", "y"], ["y", "x", "y", "x", "y"]]) {
  for (const sign of [1, -1]) {
    test(`elastic ${axes.join("→")} wheel passes only the remainder ${sign > 0 ? "forward" : "backward"}`, async ({ page }) => {
      const rooms = axes.map((_, index) => index === axes.length - 1 ? 300 : (index + 1) * 10);
      await setupChain(page, { axes, rooms, sign });
      const before = await positions(page, axes);
      const result = await wheel(page, { deltaY: sign * 120 });
      const after = await positions(page, axes);
      const spent = rooms.slice(0, -1).reduce((sum, room) => sum + room, 0);
      expect(after.map((value, index) => (value - before[index]) * sign))
        .toEqual([...rooms.slice(0, -1), 120 - spent]);
      expect(result.prevented).toBe(true);
      expect(result.elastic).toEqual([...axes.slice(0, -1).map(() => true), false]);
    });
  }
}

test("elastic chain does not skip an available horizontal parent after two vertical limits", async ({ page }) => {
  const axes = ["y", "y", "x", "y"];
  await setupChain(page, { axes, rooms: [0, 0, 300, 300] });
  const before = await positions(page, axes);
  await wheel(page);
  const after = await positions(page, axes);
  expect(after.map((value, index) => value - before[index])).toEqual([0, 0, 120, 0]);
});

for (const behavior of ["contain", "none"]) {
  for (const level of [0, 1]) {
    test(`elastic chain respects ${behavior} at ${level === 0 ? "vertical" : "converted horizontal"} boundary`, async ({ page }) => {
      test.skip(!await page.evaluate(() => CSS.supports("overscroll-behavior", "contain")), "CSS overscroll behavior unavailable");
      await setupChain(page, { styles: { [level]: `overscroll-behavior-${level === 0 ? "y" : "x"}:${behavior}` } });
      const before = await positions(page, ["y", "x", "y"]);
      const result = await wheel(page);
      expect(await positions(page, ["y", "x", "y"])).toEqual(before);
      expect(result.prevented).toBe(true);
      expect(result.elastic[0]).toBe(level !== 0 || behavior === "contain");
      expect(result.elastic[1]).toBe(level === 1 && behavior === "contain");
    });
  }
}

test("a CSS limit on the unused axis does not block converted horizontal intent", async ({ page }) => {
  test.skip(!await page.evaluate(() => CSS.supports("overscroll-behavior", "contain")), "CSS overscroll behavior unavailable");
  await setupChain(page, { styles: { 1: "overscroll-behavior-y:contain" } });
  await wheel(page);
  expect((await positions(page, ["y", "x", "y"]))[2]).toBe(120);
});

test("an empty scroll container still honors an explicit CSS chain boundary", async ({ page }) => {
  test.skip(!await page.evaluate(() => CSS.supports("overscroll-behavior", "contain")), "CSS overscroll behavior unavailable");
  await setupChain(page, { axes: ["y", "y", "y"], styles: { 1: "overscroll-behavior-y:contain" }, zeroRange: [1] });
  await wheel(page);
  expect((await positions(page, ["y", "y", "y"]))[2]).toBe(0);
});

for (const deltaMode of [1, 2]) {
  test(`wheel delta mode ${deltaMode} is normalized once across converted ancestors`, async ({ page }) => {
    await setupChain(page, { rooms: [20, 30, 300] });
    await wheel(page, { deltaY: deltaMode === 1 ? 10 : 1, deltaMode });
    expect((await positions(page, ["y", "x", "y"]))[2]).toBe((deltaMode === 1 ? 160 : 120) - 50);
  });
}

test("unmanaged scrollable ancestors receive the same unconsumed distance", async ({ page }) => {
  await setupChain(page, { plain: [1, 2], rooms: [0, 0, 300] });
  await wheel(page);
  expect((await positions(page, ["y", "x", "y"]))[2]).toBe(120);
});

test("a plain scroll container can stop the chain with CSS", async ({ page }) => {
  test.skip(!await page.evaluate(() => CSS.supports("overscroll-behavior", "contain")), "CSS overscroll behavior unavailable");
  await setupChain(page, { axes: ["y", "y", "y"], plain: [1], styles: { 1: "overscroll-behavior-y:contain" } });
  await wheel(page);
  expect((await positions(page, ["y", "y", "y"]))[2]).toBe(0);
});

test("disabled horizontal conversion passes vertical intent to a later ancestor", async ({ page }) => {
  await setupChain(page, { rooms: [0, 300, 300] });
  await page.evaluate(() => {
    const middle = document.getElementById("level1");
    middle.setAttribute("data-ae-scrollbox-wheel-horizontal", "false");
    AelluxJs.mountManager.update(middle, "scrollbox");
  });
  await wheel(page);
  expect(await positions(page, ["y", "x", "y"])).toEqual([300, 0, 120]);
});

for (const axes of [["y", "x", "y"], ["y", "x", "y", "x", "y"]]) {
  test(`trusted wheel crosses ${axes.length} elastic levels exactly once`, async ({ page }) => {
    await setupChain(page, { axes, rooms: axes.map((_, index) => index === axes.length - 1 ? 300 : 0) });
    const rect = await page.locator("#level0").boundingBox();
    await page.mouse.move(rect.x + 60, rect.y + 60);
    await page.mouse.wheel(0, 120);
    const expected = axes.map((_, index) => index === axes.length - 1 ? 120 : 300);
    await expect.poll(() => positions(page, axes)).toEqual(expected);
    await page.waitForTimeout(120);
    expect(await positions(page, axes)).toEqual(expected);
  });
}

test("another wheel during ancestor elastic recovery uses restored bounds", async ({ page }) => {
  await setupChain(page);
  await wheel(page);
  await expect.poll(() => page.locator("#content1").evaluate(element =>
    element.classList.contains("ae--scrollbox-elastic-release"))).toBe(true);
  const resumed = await wheel(page, { deltaY: 60 });
  expect(await positions(page, ["y", "x", "y"])).toEqual([300, 300, 180]);
  // Check cancellation in the dispatch turn, before the new wheel's 80 ms idle
  // deadline can legitimately start another release between browser round trips.
  expect(resumed.releasing[1]).toBe(false);
});

test("native horizontal intent stays horizontal through vertical ancestors", async ({ page }) => {
  await setupChain(page, { axes: ["x", "y", "x"], rooms: [20, 300, 300] });
  const before = await positions(page, ["x", "y", "x"]);
  await wheel(page, { deltaX: 120, deltaY: 0 });
  const after = await positions(page, ["x", "y", "x"]);
  expect(after.map((value, index) => value - before[index])).toEqual([20, 0, 100]);
});

test("wheel remainder reaches the document without a duplicate native scroll", async ({ page }) => {
  await setupChain(page);
  await page.evaluate(() => {
    document.body.style.height = "2000px";
    document.scrollingElement.scrollTo({ top: 0, behavior: "instant" });
    const outer = document.getElementById("level2");
    outer.scrollTo({ top: outer.scrollHeight - outer.clientHeight, behavior: "instant" });
  });
  const rect = await page.locator("#level0").boundingBox();
  await page.mouse.move(rect.x + 60, rect.y + 60);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => page.evaluate(() => document.scrollingElement.scrollTop)).toBe(120);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => document.scrollingElement.scrollTop)).toBe(120);
});

test("a handed wheel keeps snap navigation at the horizontal parent", async ({ page }) => {
  await setupChain(page, { rooms: [0, 300, 300], snap: true });
  await wheel(page);
  await expect.poll(() => positions(page, ["y", "x", "y"])).toEqual([300, 150, 0]);
  await page.evaluate(() => AelluxJs.ext.scrollboxSnap.goto(document.getElementById("level1"), 2, "instant"));
  await wheel(page);
  expect((await positions(page, ["y", "x", "y"]))[2]).toBe(120);
});
