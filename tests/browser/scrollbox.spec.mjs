import { expect, test } from "@playwright/test";

test("scrollbox exposes progress in both axes and restores styles on unmount", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="scrollbox" data-ae-scrollbox="native"
        style="width: 100px; height: 100px; overflow: auto;
          --ae-scroll-x-progress: .4; --ae-scroll-y-progress: .7">
        <div id="content" style="width: 300px; height: 400px"></div>
      </div>`;
    AelluxJs.ext("scrollbox", { loadStyle: true });
  });
  await page.addScriptTag({ url: "/dist/aellux.ext.scrollbox.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
  expect(await page.evaluate(() => AelluxJs.ext.scrollboxSnap?.initialized ?? false)).toBe(false);

  const progress = () => page.evaluate(() => {
    const element = document.getElementById("scrollbox");
    return ["--ae-scroll-y-progress", "--ae-scroll-x-progress"]
      .map(name => Number(element.style.getPropertyValue(name)));
  });
  await expect.poll(progress).toEqual([0, 0]);

  await page.evaluate(() => document.getElementById("scrollbox").scrollTo(100, 150));
  await expect.poll(progress).toEqual([0.5, 0.5]);
  expect(await page.locator("#content").evaluate(element =>
    ["--ae-scroll-y-progress", "--ae-scroll-x-progress"].map(name =>
      Number(getComputedStyle(element).getPropertyValue(name))))).toEqual([0.5, 0.5]);

  await page.evaluate(() => document.getElementById("scrollbox").scrollTo(999, 999));
  await expect.poll(progress).toEqual([1, 1]);

  await page.evaluate(() => AelluxJs.unmount(document.getElementById("scrollbox"), "scrollbox"));
  expect(await progress()).toEqual([0.7, 0.4]);
});

test("snap focus reaches content nested inside a snap item", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `<div data-ae-scrollbox data-ae-scrollbox-snap
      style="width:100px;height:100px;overflow-x:auto;display:flex">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px">
        <span id="nested"></span>
      </div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>`;
    AelluxJs.ext("scrollbox", { loadStyle: true });
    AelluxJs.ext("scrollbox-snap");
  });
  await page.addScriptTag({ url: "/dist/aellux.ext.scrollbox.js" });
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox-snap.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollboxSnap?.initialized)).toBe(true);
  await expect.poll(() => page.locator("#nested").evaluate(element =>
    Number(getComputedStyle(element).getPropertyValue("--ae-snap-focus")))).toBe(1);
});

test("native touch drag rejects programmatic snap navigation", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `<div id="box" data-ae-scrollbox data-ae-scrollbox-snap
      style="width:100px;height:100px;overflow-x:auto;display:flex">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>`;
    AelluxJs.ext("scrollbox", { loadStyle: true });
    AelluxJs.ext("scrollbox-snap");
  });
  await page.addScriptTag({ url: "/dist/aellux.ext.scrollbox.js" });
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox-snap.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollboxSnap?.initialized)).toBe(true);
  await expect.poll(() => page.evaluate(() =>
    !!AelluxJs.mountManager?.controller(document.getElementById("box"))?.scrollbox
  )).toBe(true);

  const result = await page.evaluate(() => {
    const box = document.getElementById("box");
    const controller = AelluxJs.mountManager.controller(box).scrollbox;
    const originalScrollTo = box.scrollTo.bind(box);
    let calls = 0;
    box.scrollTo = (...args) => { calls++; return originalScrollTo(...args); };
    const dispatchTouch = type => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, "changedTouches", { value: [{ identifier: 1 }] });
      box.dispatchEvent(event);
    };
    dispatchTouch("touchstart");
    const before = calls;
    const during = [controller.goto(1), controller.next(), controller.previous()];
    const duringCalls = calls - before;
    dispatchTouch("touchend");
    const after = controller.goto(1);
    return { during, duringCalls, after, afterCalls: calls - before };
  });
  expect(result).toEqual({ during: [false, false, false], duringCalls: 0,
    after: true, afterCalls: 1 });
});

test("destroying Snap leaves Scrollbox scrolling and releases navigation", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `<div id="box" data-ae-scrollbox="native" data-ae-scrollbox-snap
      style="width:100px;height:100px;overflow-x:auto;display:flex">
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
      <div data-ae-snap-item style="flex:none;width:100px;height:100px"></div>
    </div>`;
    AelluxJs.ext("scrollbox", { loadStyle: true });
    AelluxJs.ext("scrollbox-snap");
  });
  await page.addScriptTag({ url: "/dist/aellux.ext.scrollbox.js" });
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox-snap.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollboxSnap?.initialized)).toBe(true);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    await AelluxJs.destroyExtensions("scrollbox-snap");
    element.scrollTo({ left: 100, behavior: "instant" });
    await new Promise(resolve => requestAnimationFrame(resolve));
    return {
      base: AelluxJs.ext.scrollbox.initialized,
      ready: element.classList.contains("ae--snap-ready"),
      navigation: AelluxJs.mountManager.controller(element).scrollbox.goto(0),
      left: element.scrollLeft
    };
  });
  expect(result).toEqual({ base: true, ready: false, navigation: false, left: 100 });
});
