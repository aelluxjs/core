import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const dependency = "**/better-scroll@2.5.1/dist/better-scroll.min.js";
const fakeBetterScroll = `
window.betterScrollCalls = [];
window.BetterScroll = {
  createBScroll(wrapper, options) {
    const listeners = {};
    const instance = {
      wrapper, options, x: 0, y: 0, destroyed: false, refreshes: 0,
      maxScrollX: 0, maxScrollY: 0,
      refresh() {
        this.refreshes++;
        this.maxScrollX = -Math.max(0, wrapper.scrollWidth - wrapper.clientWidth);
        this.maxScrollY = -Math.max(0, wrapper.scrollHeight - wrapper.clientHeight);
      },
      on(name, fn) { (listeners[name] ||= new Set()).add(fn); },
      off(name, fn) { listeners[name]?.delete(fn); },
      scrollTo(x, y) {
        this.x = Math.max(this.maxScrollX, Math.min(0, x));
        this.y = Math.max(this.maxScrollY, Math.min(0, y));
        listeners.scroll?.forEach(fn => fn());
      },
      destroy() { this.destroyed = true; }
    };
    instance.refresh();
    window.betterScrollCalls.push(instance);
    return instance;
  }
};`;

async function setup(page, html, { fail = false, touch = false } = {}) {
  let requests = 0;
  await page.route(dependency, route => {
    requests++;
    return fail ? route.abort("failed") :
      route.fulfill({ contentType: "text/javascript", body: fakeBetterScroll });
  });
  await page.goto("/tests/index.htm");
  if (touch) {
    await page.addInitScript(() => {});
    await page.evaluate(() => {
      Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 5 });
    });
  }
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(html => {
    document.body.innerHTML = html;
    AelluxJs.ext("scrollbox");
  }, html);
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
  return () => requests;
}

const box = (id, mode = "enhance", extra = "", style = "width:100px;height:100px;overflow:auto") =>
  `<div id="${id}" data-ae-scrollbox="${mode}" ${extra} style="${style}">
    <div style="width:300px;height:300px"></div></div>`;
const horizontal = (id, mode = "native", extra = "") =>
  box(id, mode, extra, "width:100px;height:100px;overflow:auto") .replace("height:300px", "height:100px");

test("native never loads dependency; auto chooses desktop and touch sources", async ({ page }) => {
  const requests = await setup(page, box("native", "native") + box("auto", "auto"));
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(1);
  expect(requests()).toBe(1);
  expect(await page.evaluate(() => document.querySelectorAll('script[data-ae-dep="better-scroll"]').length)).toBe(1);
  await page.evaluate(async () => {
    document.getElementById("auto").setAttribute("data-ae-scrollbox", "native");
    await AelluxJs.mountManager.update(document.getElementById("auto"), "scrollbox");
  });
  expect(await page.evaluate(() => window.betterScrollCalls[0].destroyed)).toBe(true);
});

test("auto stays native with touch capability", async ({ page }) => {
  const requests = await setup(page, horizontal("auto", "auto"), { touch: true });
  await page.evaluate(() => AelluxJs.mount(document.getElementById("auto"), "scrollbox"));
  expect(requests()).toBe(0);
  expect(await page.evaluate(() => !!window.betterScrollCalls)).toBe(false);
  expect(await page.evaluate(() => {
    const element = document.getElementById("auto");
    const event = new WheelEvent("wheel", { deltaY: 80, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented, x: element.scrollLeft };
  })).toEqual({ prevented: false, x: 0 });
});

test("native alone never requests BetterScroll and can switch to enhance", async ({ page }) => {
  const requests = await setup(page, box("a", "native"));
  expect(requests()).toBe(0);
  expect(await page.evaluate(() => !!AelluxJs.registry.dep["better-scroll"])).toBe(false);
  await page.evaluate(async () => {
    const element = document.getElementById("a");
    element.setAttribute("data-ae-scrollbox", "enhance");
    await AelluxJs.mountManager.update(element, "scrollbox");
  });
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(1);
  expect(requests()).toBe(1);
});

test("concurrent enhanced boxes share load; options merge and updates recreate only one", async ({ page }) => {
  const requests = await setup(page,
    box("a", "enhance", `data-ae-scrollbox-options='{"bounce":true}'`) +
    box("b", "enhance", "data-ae-scrollbox-options=''"));
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(2);
  expect(requests()).toBe(1);
  const first = await page.evaluate(() => window.betterScrollCalls.map(i => i.options));
  expect(first[0].bounce).toBe(true);
  expect(first[1].bounce).toBe(false);
  expect(first[0].click).toBe(true);
  await page.evaluate(async () => {
    const a = document.getElementById("a");
    a.setAttribute("data-ae-scrollbox-options", '{"bounce":false,"probeType":2}');
    await AelluxJs.mountManager.update(a, "scrollbox");
  });
  expect(await page.evaluate(() => ({
    count: window.betterScrollCalls.length,
    oldDestroyed: window.betterScrollCalls[0].destroyed,
    otherDestroyed: window.betterScrollCalls[1].destroyed,
    options: window.betterScrollCalls[2].options
  }))).toMatchObject({
    count: 3, oldDestroyed: true, otherDestroyed: false,
    options: { bounce: false, probeType: 2, click: true }
  });
  await page.evaluate(async () => AelluxJs.unmount(document.getElementById("a"), "scrollbox"));
  expect(await page.evaluate(() => window.betterScrollCalls.map(i => i.destroyed))).toEqual([true, false, true]);
});

test("invalid options diagnose and retain defaults", async ({ page }) => {
  await setup(page, box("a", "enhance", `data-ae-scrollbox-options='{'`) +
    box("b", "enhance", `data-ae-scrollbox-options='[]'`) +
    box("c", "enhance", `data-ae-scrollbox-options='null'`) +
    box("d", "enhance", `data-ae-scrollbox-options='42'`) +
    box("e", "enhance", `data-ae-scrollbox-options='true'`) +
    box("f", "enhance", `data-ae-scrollbox-options='&quot;text&quot;'`));
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(6);
  const result = await page.evaluate(() => ({
    values: window.betterScrollCalls.map(i => i.options.bounce),
    codes: AelluxJs.diagnostics.showHistory(20).map(i => i.code)
  }));
  expect(result.values).toEqual([false, false, false, false, false, false]);
  expect(result.codes).toContain(2013);
  expect(result.codes.filter(code => code === 2014)).toHaveLength(5);
});

test("invalid mode diagnoses and falls back to auto", async ({ page }) => {
  await setup(page, box("a", "unknown"));
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(1);
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory(10).some(i => i.code === 2012))).toBe(true);
});

test("failed dependency falls back to native and update can retry", async ({ page }) => {
  let requests = 0;
  await page.route(dependency, route => {
    requests++;
    return requests === 1 ? route.abort("failed") :
      route.fulfill({ contentType: "text/javascript", body: fakeBetterScroll });
  });
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(html => { document.body.innerHTML = html; AelluxJs.ext("scrollbox"); }, box("a"));
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
  expect(await page.evaluate(() => !!window.betterScrollCalls)).toBe(false);
  await page.evaluate(() => document.getElementById("a").scrollTo(0, 100));
  await expect.poll(() => page.evaluate(() =>
    Number(document.getElementById("a").style.getPropertyValue("--ae-scroll-y-progress")))).toBe(0.5);
  await page.evaluate(() => AelluxJs.mountManager.update(document.getElementById("a"), "scrollbox"));
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(1);
  expect(requests).toBe(2);
});

for (const [description, body, code] of [
  ["missing BetterScroll export", "window.otherLibrary = true;", 2015],
  ["BetterScroll initialization failure",
    "window.BetterScroll = { createBScroll() { throw new Error('init failed'); } };", 1120]
]) {
  test(`${description} diagnoses and preserves native progress`, async ({ page }) => {
    await page.route(dependency, route => route.fulfill({
      contentType: "text/javascript", body
    }));
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });
    await page.evaluate(html => { document.body.innerHTML = html; AelluxJs.ext("scrollbox"); }, box("a"));
    await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
    await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
    await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
    await page.evaluate(() => document.getElementById("a").scrollTo(0, 100));
    await expect.poll(() => page.evaluate(() =>
      Number(document.getElementById("a").style.getPropertyValue("--ae-scroll-y-progress")))).toBe(0.5);
    expect(await page.evaluate(code => AelluxJs.diagnostics.showHistory(20)
      .some(entry => entry.code === code), code)).toBe(true);
  });
}

test("horizontal wheel consumes until limits in native and enhanced modes", async ({ page }) => {
  await setup(page, `<div id="parent" style="width:180px;height:120px;overflow:auto">
    <div style="height:500px">${horizontal("native")}${horizontal("enhanced", "enhance")}</div></div>`);
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(1);
  const wheel = (id, dy, dx = 0, mode = 0) => page.evaluate(({ id, dy, dx, mode }) => {
    const el = document.getElementById(id);
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true,
      deltaY: dy, deltaX: dx, deltaMode: mode });
    el.dispatchEvent(event);
    return { prevented: event.defaultPrevented, x: el.scrollLeft,
      enhancedX: window.betterScrollCalls[0].x };
  }, { id, dy, dx, mode });
  expect((await wheel("native", 80)).prevented).toBe(true);
  expect((await wheel("native", -40)).x).toBe(40);
  expect((await wheel("native", 999)).x).toBe(200);
  expect((await wheel("native", 40)).prevented).toBe(false);
  expect((await wheel("native", -999)).x).toBe(0);
  expect((await wheel("native", -40)).prevented).toBe(false);
  expect((await wheel("enhanced", 80)).enhancedX).toBe(-80);
  expect((await wheel("enhanced", 999)).enhancedX).toBe(-200);
  expect((await wheel("enhanced", 40)).prevented).toBe(false);
  const horizontalGesture = await wheel("enhanced", 20, -80);
  expect(horizontalGesture.enhancedX).toBe(-120);
  expect(horizontalGesture.prevented).toBe(true);
  expect((await wheel("native", 1, 0, 1)).x).toBe(16);
  expect((await wheel("native", 1, 0, 2)).x).toBe(116);
  expect((await wheel("native", 20, 80)).prevented).toBe(false);
});

test("wheel opt-out, two-axis boxes, refresh and remount", async ({ page }) => {
  await setup(page, horizontal("opt", "native", 'data-ae-scrollbox-wheel-horizontal="false"') +
    box("both", "native") + horizontal("size", "enhance"));
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(1);
  const result = await page.evaluate(() => {
    const spin = id => {
      const ev = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true });
      document.getElementById(id).dispatchEvent(ev);
      return ev.defaultPrevented;
    };
    const opt = spin("opt"), both = spin("both");
    const size = document.getElementById("size");
    const instance = window.betterScrollCalls[0];
    const before = instance.refreshes;
    size.firstElementChild.style.width = "400px";
    return { opt, both, before };
  });
  expect(result).toMatchObject({ opt: false, both: false });
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls[0].refreshes))
    .toBeGreaterThan(result.before);
  await page.evaluate(async () => {
    const size = document.getElementById("size");
    await AelluxJs.unmount(size, "scrollbox");
    await AelluxJs.mount(size, "scrollbox");
  });
  expect(await page.evaluate(() => ({
    destroyed: window.betterScrollCalls[0].destroyed,
    count: window.betterScrollCalls.length
  }))).toEqual({ destroyed: true, count: 2 });
  const once = await page.evaluate(() => {
    const event = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true });
    document.getElementById("size").dispatchEvent(event);
    return window.betterScrollCalls[1].x;
  });
  expect(once).toBe(-40);
});

test("resize bursts refresh BetterScroll at most once per 100 ms and cancel on unmount", async ({ page }) => {
  await setup(page, horizontal("a", "enhance"));
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(1);
  const result = await page.evaluate(async () => {
    const instance = window.betterScrollCalls[0];
    await new Promise(resolve => setTimeout(resolve, 150));
    const before = instance.refreshes;
    for (let index = 0; index < 5; index++) dispatchEvent(new Event("resize"));
    await new Promise(resolve => setTimeout(resolve, 30));
    const early = instance.refreshes;
    await new Promise(resolve => setTimeout(resolve, 130));
    const late = instance.refreshes;
    return { before, early, late };
  });
  expect(result.early - result.before).toBe(1);
  expect(result.late - result.before).toBe(2);
  const canceled = await page.evaluate(async () => {
    const element = document.getElementById("a");
    const instance = window.betterScrollCalls[0];
    await new Promise(resolve => setTimeout(resolve, 150));
    dispatchEvent(new Event("resize"));
    dispatchEvent(new Event("resize"));
    await AelluxJs.unmount(element, "scrollbox");
    const before = instance.refreshes;
    await new Promise(resolve => setTimeout(resolve, 130));
    return { before, after: instance.refreshes };
  });
  expect(canceled.after).toBe(canceled.before);
});

test("enhanced wheel opt-out keeps natural horizontal gestures", async ({ page }) => {
  await setup(page, horizontal("a", "enhance", 'data-ae-scrollbox-wheel-horizontal="false"'));
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(1);
  const result = await page.evaluate(() => {
    const element = document.getElementById("a");
    const vertical = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true });
    element.dispatchEvent(vertical);
    const horizontal = new WheelEvent("wheel", { deltaX: 40, bubbles: true, cancelable: true });
    element.dispatchEvent(horizontal);
    return { vertical: vertical.defaultPrevented, horizontal: horizontal.defaultPrevented,
      x: window.betterScrollCalls[0].x };
  });
  expect(result).toEqual({ vertical: false, horizontal: true, x: -40 });
});

test("content changing overflow axes recreates enhancement with current axes", async ({ page }) => {
  await setup(page, horizontal("a", "enhance"));
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(1);
  await page.evaluate(() => {
    const content = document.getElementById("a").firstElementChild;
    content.style.width = "100px";
    content.style.height = "300px";
  });
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(2);
  expect(await page.evaluate(() => ({
    oldDestroyed: window.betterScrollCalls[0].destroyed,
    options: window.betterScrollCalls[1].options
  }))).toMatchObject({
    oldDestroyed: true, options: { scrollX: false, scrollY: true, mouseWheel: true }
  });
  await page.evaluate(() => {
    const replacement = document.createElement("div");
    replacement.style.cssText = "width:300px;height:100px";
    document.getElementById("a").replaceChildren(replacement);
  });
  await expect.poll(() => page.evaluate(() => window.betterScrollCalls?.length)).toBe(3);
  expect(await page.evaluate(() => window.betterScrollCalls[1].destroyed)).toBe(true);
});

test("wheel releases the vertical parent after the horizontal edge", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium");
  await setup(page, `<div id="parent" style="height:120px;width:180px;overflow:auto">
    <div style="height:500px">${horizontal("child")}</div></div>`);
  const child = page.locator("#child");
  const bounds = await child.boundingBox();
  await page.mouse.move(bounds.x + 50, bounds.y + 50);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => page.evaluate(() => document.getElementById("child").scrollLeft)).toBe(120);
  expect(await page.evaluate(() => document.getElementById("parent").scrollTop)).toBe(0);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => page.evaluate(() => document.getElementById("child").scrollLeft)).toBe(200);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => page.evaluate(() => document.getElementById("parent").scrollTop)).toBeGreaterThan(0);
});

test("real BetterScroll bundle publishes normalized progress and destroys cleanly", async ({ page }) => {
  const source = await readFile(new URL("../../node_modules/better-scroll/dist/better-scroll.min.js", import.meta.url), "utf8");
  await page.route(dependency, route => route.fulfill({
    contentType: "text/javascript",
    body: source + `
      window.realInstances = [];
      const createRealBScroll = BetterScroll.createBScroll;
      BetterScroll.createBScroll = (element, options) => {
        const instance = createRealBScroll(element, options);
        window.realInstances.push(instance);
        return instance;
      };`
  }));
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(html => { document.body.innerHTML = html; AelluxJs.ext("scrollbox"); }, box("real"));
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => window.realInstances?.length)).toBe(1);
  const values = await page.evaluate(() => {
    const instance = window.realInstances[0];
    instance.scrollTo(-100, -100, 0);
    const element = document.getElementById("real");
    return {
      x: Number(element.style.getPropertyValue("--ae-scroll-x-progress")),
      y: Number(element.style.getPropertyValue("--ae-scroll-y-progress")),
      maxX: instance.maxScrollX,
      maxY: instance.maxScrollY
    };
  });
  expect(values).toMatchObject({ x: 0.5, y: 0.5, maxX: -200, maxY: -200 });
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("real"), "scrollbox"));
  expect(await page.evaluate(() => document.getElementById("real").style.getPropertyValue("--ae-scroll-x-progress"))).toBe("");
  expect(await page.evaluate(() => document.getElementById("real").firstElementChild.style.transform)).toBe("");
});
