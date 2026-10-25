import { expect, test } from "@playwright/test";

async function setup(page, markup, forceLegacy = false, fallback = false, events = false) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(async ({ forceLegacy, fallback, events }) => {
    await new Promise(resolve => {
      AelluxJs.on("Ready", resolve, { once: true });
      AelluxJs.init({ mode: "basic", forceLegacy, environment: "development" });
    });
    if (fallback) {
      window.ResizeObserver = window.IntersectionObserver = undefined;
      Object.defineProperty(CSS, "registerProperty", { configurable: true, value: undefined });
    }
    window.viewportProbe = { listeners: new Map(), reads: 0, writes: 0, observers: [] };
    const on = AelluxJs.onEvent, off = AelluxJs.offEvent;
    AelluxJs.onEvent = function (target, name, callback, ...args) {
      if (name === "$scroll") viewportProbe.listeners.set(callback, target);
      return on.call(this, target, name, callback, ...args);
    };
    AelluxJs.offEvent = function (target, name, callback, ...args) {
      if (name === "$scroll") viewportProbe.listeners.delete(callback);
      return off.call(this, target, name, callback, ...args);
    };
    // The scheduler's method table is frozen. Wrap the exposed table rather
    // than silently assigning methods that cannot be replaced.
    AelluxJs.waitLayout = { ...AelluxJs.waitLayout };
    for (const phase of ["read", "update"]) {
      const original = AelluxJs.waitLayout[phase];
      AelluxJs.waitLayout[phase] = function (...args) {
        if (args[0] >= 6000000) viewportProbe[phase === "read" ? "reads" : "writes"]++;
        return original.apply(this, args);
      };
    }
    for (const name of ["ResizeObserver", "IntersectionObserver"]) {
      const Native = window[name];
      if (!Native) continue;
      window[name] = class extends Native {
        constructor(...args) { super(...args); this.targets = new Set(); viewportProbe.observers.push(this); }
        observe(target, ...args) { this.targets.add(target); return super.observe(target, ...args); }
        unobserve(target) { this.targets.delete(target); return super.unobserve(target); }
        disconnect() { this.targets.clear(); return super.disconnect(); }
      };
    }
    if (events) {
      viewportProbe.rectReads = 0;
      const rect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        if (this.id === "item") viewportProbe.rectReads++;
        return rect.call(this);
      };
      window.viewportEvents = [];
      window.viewportDetails = [];
      window.viewportEventAction = events;
      const snapshot = value => value && ({ ...value,
        viewport: value.viewport === document ? "document" : value.viewport.id });
      for (const name of ["ViewportChange", "ViewportFullyInside", "ViewportFullyOutside"]) {
        document.addEventListener(AelluxJs.eventName(name), event => {
          viewportDetails.push(event.detail);
          viewportEvents.push({ name, target: event.target.id,
            bubbles: event.bubbles, composed: event.composed, cancelable: event.cancelable,
            cycle: viewportProbe.reads,
            css: ["x", "y", "visible"].map(axis => event.target.style.getPropertyValue(`--ae-viewport-${axis}`)),
            detail: { ...snapshot(event.detail), previous: snapshot(event.detail.previous) } });
          if (name !== "ViewportChange") return;
          if (viewportEventAction === "mutate") {
            event.detail.x1 = 999; event.detail.state = "outside";
            if (event.detail.previous) event.detail.previous.x1 = 999;
          } else if (typeof viewportEventAction === "string") {
            const action = viewportEventAction;
            viewportEventAction = null;
            if (action === "remove") event.target.removeAttribute("data-ae-viewport");
            else if (action === "detach") event.target.remove();
            else if (action === "destroy") window.viewportLifecycle = AelluxJs.destroyExtensions("viewport");
            else {
              if (action === "cancel") AelluxJs.on("BeforeUnmount", event => event.preventDefault(), { once: true });
              window.viewportLifecycle = AelluxJs.unmount(event.target, "viewport");
            }
          }
        });
      }
    }
  }, { forceLegacy, fallback, events });
  await page.evaluate(async markup => {
    document.body.style.margin = "0";
    document.body.innerHTML = markup;
    await AelluxJs.mount(document.body);
  }, markup);
  if (markup.includes("data-ae-viewport") && events !== "destroy")
    await expect.poll(() => page.evaluate(() => AelluxJs.ext.viewport?.initialized)).toBe(true);
}

const fixture = (extra = "", item = "", overflow = "auto") => `
  <div id="box" style="position:relative;width:200px;height:200px;border:10px solid;overflow:${overflow};${extra}">
    <div style="position:relative;width:1000px;height:1000px">
      <article id="item" data-ae-viewport style="position:absolute;left:50px;top:50px;width:100px;height:100px;${item}"></article>
    </div>
  </div>`;

const values = (page, id = "item") => page.locator(`#${id}`).evaluate(element =>
  ["x", "y", "visible"].map(name => element.style.getPropertyValue(`--ae-viewport-${name}`)));

async function expectGeometry(page, expected, id = "item", tolerance = .015) {
  await expect.poll(async () => {
    const actual = await values(page, id);
    if (actual.some(value => value === "")) return Infinity;
    return Math.max(...expected.map((value, index) => Math.abs(Number(actual[index]) - value)));
  }).toBeLessThan(tolerance);
}

for (const legacy of [false, true]) test.describe(`Viewport ${legacy ? "Legacy" : "Modern"}`, () => {
  test("centers, four edges, visibility and clamping use the inner bordered scrollport", async ({ page }) => {
    // Hidden overflow scrolls programmatically and avoids platform scrollbar widths.
    await setup(page, fixture("", "", "hidden"), legacy);
    await expectGeometry(page, [0, 0, 1]);
    for (const [left, top, expected] of [
      [-50, 50, [-1, 0, .5]], [150, 50, [1, 0, .5]],
      [50, -50, [0, -1, .5]], [50, 150, [0, 1, .5]],
      [-50, -50, [-1, -1, .25]], [500, 500, [2, 2, 0]],
      [-500, -500, [-2, -2, 0]]
    ]) {
      await page.locator("#item").evaluate((el, [left, top]) => {
        el.style.left = `${left}px`; el.style.top = `${top}px`;
      }, [left, top]);
      await expectGeometry(page, expected);
    }
  });

  test("oversized and fractional elements retain finite area fractions", async ({ page }) => {
    await setup(page, fixture("", "left:0;top:0;width:400px;height:400px", "hidden"), legacy);
    await expectGeometry(page, [1, 1, .25]);
    await page.locator("#item").evaluate(el => Object.assign(el.style,
      { left: "49.75px", top: "49.25px", width: "100.5px", height: "101.5px" }));
    await expectGeometry(page, [0, 0, 1], "item", .00001);
  });

  test("scaled ancestors use a consistent coordinate system", async ({ page }) => {
    await setup(page, `<div style="transform:scale(1.5,.75);transform-origin:0 0">${fixture("", "", "hidden")}</div>`, legacy);
    await expectGeometry(page, [0, 0, 1], "item", .001);
    await page.locator("#box").evaluate(el => el.scrollTo({ left: 50, top: 50, behavior: "instant" }));
    await expectGeometry(page, [-.5, -.5, 1], "item", .001);
  });

  test("fractional scrollport dimensions survive scale and border compensation", async ({ page }) => {
    await setup(page, fixture("width:200.5px;height:201.5px;transform:scale(1.25)", "left:50px;top:50px;width:100.5px;height:101.5px", "hidden"), legacy);
    await expectGeometry(page, [0, 0, 1], "item", .00001);
  });

  test("zero and hidden geometry becomes measurable again", async ({ page }) => {
    await setup(page, fixture("display:none", "", "hidden"), legacy);
    await expectGeometry(page, [0, 0, 0]);
    await page.locator("#box").evaluate(el => el.style.display = "block");
    await expectGeometry(page, [0, 0, 1]);
    await page.locator("#box").evaluate(el => { el.style.width = "0"; el.style.height = "0"; });
    await expectGeometry(page, [0, 0, 0]);
  });

  for (const overflow of ["auto", "scroll", "hidden"]) {
    test(`native overflow:${overflow} updates continuously while fully visible`, async ({ page }) => {
      await setup(page, fixture("", "left:80px;top:80px;width:20px;height:20px", overflow), legacy);
      const before = (await values(page)).map(Number);
      await expect.poll(() => values(page).then(v => v[2])).toBe("1");
      await page.locator("#box").evaluate(el => el.scrollTo(20, 30));
      await expect.poll(async () => {
        const after = (await values(page)).map(Number);
        return after[0] < before[0] && after[1] < before[1] && after[2] === 1;
      }).toBe(true);
    });
  }

  test("nearest nested container supplies both axes; clip is skipped", async ({ page }) => {
    await setup(page, `<div style="width:500px;height:500px;overflow:auto">
      <div style="overflow:clip;width:400px;height:400px">${fixture("", "", "hidden")}</div></div>`, legacy);
    await expectGeometry(page, [0, 0, 1]);
    await page.locator("#box").evaluate(el => el.style.overflow = "clip");
    await expectGeometry(page, [-.56, -.56, 1]);
    await expect.poll(() => page.evaluate(() => [...viewportProbe.listeners.values()].some(el => el.id === "box"))).toBe(false);
  });

  test("non-scrollable hidden ancestor is skipped and document scroll updates position", async ({ page }) => {
    await setup(page, `<div style="overflow:hidden;width:200px;height:200px">
      <article id="item" data-ae-viewport style="width:100px;height:100px"></article></div><div style="height:3000px"></div>`, legacy);
    await expect.poll(() => page.evaluate(() => [...viewportProbe.listeners.values()].includes(window))).toBe(true);
    const y = Number((await values(page))[1]);
    await page.evaluate(() => scrollTo(0, 100));
    await expect.poll(() => values(page).then(v => Number(v[1]))).toBeLessThan(y);
    await expect.poll(() => values(page).then(v => Number(v[2]))).toBe(0);
  });

  test("axis reconfiguration restores authored inactive values and invalid axes warn", async ({ page }) => {
    await setup(page, fixture("", "--ae-viewport-x:7!important;--ae-viewport-y:8!important", "hidden"), legacy);
    await expectGeometry(page, [0, 0, 1]);
    await page.locator("#item").evaluate(el => el.setAttribute("data-ae-viewport", "x"));
    await expectGeometry(page, [0, 8, 1]);
    await page.locator("#item").evaluate(el => el.setAttribute("data-ae-viewport", "y"));
    await expectGeometry(page, [7, 0, 1]);
    await page.locator("#item").evaluate(el => el.setAttribute("data-ae-viewport", "both"));
    await expectGeometry(page, [0, 0, 1]);
    await page.locator("#item").evaluate(el => el.setAttribute("data-ae-viewport", "invalid"));
    await expectGeometry(page, [0, 0, 1]);
    expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry =>
      entry.context?.extension === "viewport" && entry.context?.value === "invalid"))).toBe(true);
  });

  test("container and target resize, sibling layout and window resize refresh geometry", async ({ page }) => {
    await setup(page, `<div id="box" style="width:200px;height:200px;overflow:hidden">
      <div id="sibling" style="height:50px"></div>
      <article id="item" data-ae-viewport style="width:100px;height:100px;margin-left:50px"></article>
      <div style="height:1000px"></div></div>`, legacy);
    await expectGeometry(page, [0, 0, 1]);
    // Native animation changes layout without further DOM mutations.
    await page.locator("#sibling").evaluate(el => el.animate([{ height: "50px" }, { height: "100px" }], { duration: 150, fill: "forwards" }));
    await expectGeometry(page, [0, .5, 1]);
    await page.locator("#item").evaluate(el => el.style.height = "200px");
    await expectGeometry(page, [0, 1, .5]);
    await page.locator("#box").evaluate(el => el.style.height = "400px");
    await expectGeometry(page, [0, 0, 1]);
    await page.setViewportSize({ width: 900, height: 700 });
    await expectGeometry(page, [0, 0, 1]);
  });

  test("moving a mounted element changes its group; unmount/remount preserves inline priorities", async ({ page }) => {
    await setup(page, fixture("", "--ae-viewport-x:9!important", "hidden") +
      '<div id="other" style="position:relative;width:400px;height:400px;overflow:scroll"></div>', legacy);
    await expectGeometry(page, [0, 0, 1]);
    await page.evaluate(() => document.getElementById("other").appendChild(document.getElementById("item")));
    await expectGeometry(page, [-.5, -.5, 1]);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("item"), "viewport"));
    expect(await values(page)).toEqual(["9", "", ""]);
    expect(await page.locator("#item").evaluate(el => el.style.getPropertyPriority("--ae-viewport-x"))).toBe("important");
    await page.evaluate(() => AelluxJs.mount(document.getElementById("item"), "viewport"));
    await expectGeometry(page, [-.5, -.5, 1]);
  });

  test("dynamic subtree mounts share one listener and release resources on detach/destroy", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy);
    await expectGeometry(page, [0, 0, 1]);
    await page.evaluate(async () => {
      const element = document.getElementById("item").cloneNode(); element.id = "second";
      for (const name of ["x", "y", "visible"]) element.style.removeProperty(`--ae-viewport-${name}`);
      document.getElementById("item").parentElement.appendChild(element);
      await AelluxJs.mount(element);
    });
    await expectGeometry(page, [0, 0, 1], "second");
    await expect.poll(() => page.evaluate(() => viewportProbe.listeners.size)).toBe(1);
    await page.locator("#second").evaluate(el => { window.detachedViewport = el; el.remove(); });
    await expect.poll(() => page.evaluate(() => detachedViewport.style.getPropertyValue("--ae-viewport-x"))).toBe("");
    await page.evaluate(() => AelluxJs.destroy("viewport"));
    expect(await values(page)).toEqual(["", "", ""]);
    expect(await page.evaluate(() => ({ listeners: viewportProbe.listeners.size,
      targets: viewportProbe.observers.reduce((sum, observer) => sum + observer.targets.size, 0) }))).toEqual({ listeners: 0, targets: 0 });
  });

  test("idle observations and child transforms do not feed back; properties do not inherit", async ({ page }) => {
    await setup(page, fixture("", "left:0", "hidden"), legacy);
    await expectGeometry(page, [-.5, 0, 1]);
    const result = await page.evaluate(async () => {
      const child = document.createElement("div"); child.style.transform = "translateX(calc(10px * var(--ae-viewport-x)))";
      document.getElementById("item").appendChild(child);
      await new Promise(resolve => setTimeout(resolve, 200));
      const before = viewportProbe.reads;
      await new Promise(resolve => setTimeout(resolve, 150));
      return { reads: viewportProbe.reads - before, inherited: getComputedStyle(child).getPropertyValue("--ae-viewport-x").trim() };
    });
    expect(result).toEqual({ reads: 0, inherited: "0" });
  });

  test("Legacy observer and CSS registration fallbacks still publish and restore inline values", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy, true);
    await expectGeometry(page, [0, 0, 1]);
    await page.locator("#box").evaluate(el => el.scrollTo({ left: 50, top: 50, behavior: "instant" }));
    await expectGeometry(page, [-.5, -.5, 1]);
    await page.locator("#item").evaluate(el => el.style.width = "200px");
    await expectGeometry(page, [0, -.5, 1]);
    await page.evaluate(() => AelluxJs.unmount(document.body, "viewport"));
    expect(await values(page)).toEqual(["", "", ""]);
  });

  test("document geometry responds to a window resize", async ({ page }) => {
    await setup(page, '<article id="item" data-ae-viewport style="position:absolute;left:50px;top:50px;width:100px;height:100px"></article>', legacy);
    await page.setViewportSize({ width: 800, height: 600 });
    await expectGeometry(page, [-.75, -2 / 3, 1]);
    await page.setViewportSize({ width: 400, height: 400 });
    await expectGeometry(page, [-.5, -.5, 1]);
  });

  test("bounded Layout events update native transform motion without size observers", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy, true);
    await expectGeometry(page, [0, 0, 1]);
    await page.locator("#item").evaluate(el => {
      el.animate([{ transform: "none" }, { transform: "translateX(50px)" }], { duration: 150, fill: "forwards" });
      AelluxJs.dispatchFrom(el, "Layout", { detail: { durationMs: 250 } });
    });
    await expectGeometry(page, [.5, 0, 1]);
    const delta = await page.evaluate(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const reads = viewportProbe.reads;
      await new Promise(resolve => setTimeout(resolve, 100));
      return viewportProbe.reads - reads;
    });
    expect(delta).toBe(0);
  });

  test("removing the declaration and readding it supports a fresh mount", async ({ page }) => {
    await setup(page, fixture("", "--ae-viewport-visible:.3!important", "hidden"), legacy);
    await expectGeometry(page, [0, 0, 1]);
    await page.locator("#item").evaluate(el => el.removeAttribute("data-ae-viewport"));
    await expect.poll(() => values(page)).toEqual(["", "", ".3"]);
    await page.evaluate(async () => {
      const element = document.getElementById("item"); element.setAttribute("data-ae-viewport", "both");
      await AelluxJs.mount(element);
    });
    await expectGeometry(page, [0, 0, 1]);
  });

  test("pending work is cancelled on unmount and repeated mounts do not duplicate listeners", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy);
    await expectGeometry(page, [0, 0, 1]);
    await page.evaluate(async () => {
      const element = document.getElementById("item");
      document.getElementById("box").dispatchEvent(new Event("scroll"));
      await AelluxJs.unmount(element, "viewport");
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    expect(await values(page)).toEqual(["", "", ""]);
    expect(await page.evaluate(() => viewportProbe.listeners.size)).toBe(0);
    await page.evaluate(async () => {
      await AelluxJs.mount(document.body);
      await AelluxJs.mount(document.body);
    });
    await expectGeometry(page, [0, 0, 1]);
    expect(await page.evaluate(() => viewportProbe.listeners.size)).toBe(1);
  });

  test("awaited mount and update publish values after discovering a new scroll container", async ({ page }) => {
    await setup(page, "", legacy);
    const result = await page.evaluate(async markup => {
      document.body.innerHTML = markup + '<div id="other" style="position:relative;width:400px;height:400px;overflow:scroll"></div>';
      await AelluxJs.mount(document.body);
      const element = document.getElementById("item");
      const mounted = element.style.getPropertyValue("--ae-viewport-visible");
      document.getElementById("other").appendChild(element);
      await AelluxJs.mountManager.update(element, "viewport");
      return { mounted, updated: element.style.getPropertyValue("--ae-viewport-x") };
    }, fixture("", "", "hidden"));
    expect(result).toEqual({ mounted: "1", updated: "-0.5" });
  });

  test("Snap remains independent and navigation preserves focus with optional Viewport", async ({ page }) => {
    await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbox-snap
      style="width:200px;height:100px;overflow:auto"><div style="display:flex;width:600px">
      ${[0, 1, 2].map(i => `<article id="item${i}" data-ae-snap-item style="flex:none;width:200px;height:100px"></article>`).join("")}
      </div></div>`, legacy);
    expect(await page.evaluate(() => !!AelluxJs.ext.viewport)).toBe(false);
    await page.evaluate(() => AelluxJs.mountManager.controller("box").scrollbox.goto(1));
    await expect.poll(() => page.locator("#box").evaluate(el => el.scrollLeft)).toBe(200);
    await expect.poll(() => page.locator("#item1").evaluate(el => el.style.getPropertyValue("--ae-snap-focus"))).toBe("1");
    await page.evaluate(async () => {
      document.getElementById("item1").setAttribute("data-ae-viewport", "x");
      await AelluxJs.mount(document.getElementById("item1"));
    });
    await expect.poll(() => values(page, "item1").then(v => v[0])).toBe("0");
    await page.evaluate(() => AelluxJs.mountManager.controller("box").scrollbox.next());
    await expect.poll(() => page.locator("#box").evaluate(el => el.scrollLeft)).toBe(400);
    await page.evaluate(() => AelluxJs.mountManager.controller("box").scrollbox.previous());
    await expect.poll(() => page.locator("#box").evaluate(el => el.scrollLeft)).toBe(200);
    expect(await page.locator("[data-ae-snap-item]").evaluateAll(items => items.map(el => el.style.getPropertyValue("--ae-snap-viewport")))).toEqual(["", "", ""]);
  });
});

const eventLog = page => page.evaluate(() => viewportEvents);
const changes = async page => (await eventLog(page)).filter(event => event.name === "ViewportChange");
async function changeGeometry(page, style) {
  await page.locator("#item").evaluate((element, style) => Object.assign(element.style, style), style);
  await page.evaluate(() => AelluxJs.mountManager.update(document.getElementById("item"), "viewport"));
}

for (const legacy of [false, true]) test.describe(`Viewport events ${legacy ? "Legacy" : "Modern"}`, () => {
  test("unclamped edge coordinates, containment and CSS publication share one measurement", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy, false, true);
    let log = await eventLog(page);
    expect(log.map(event => event.name)).toEqual(["ViewportChange", "ViewportFullyInside"]);
    const first = log[0];
    expect(first).toMatchObject({ target: "item", bubbles: true, composed: true, cancelable: false,
      css: ["0", "0", "1"], detail: { viewport: "box", x1: -.5, y1: -.5, x2: .5, y2: .5,
        x: 0, y: 0, visible: 1, state: "inside", measurable: true, previous: null, initial: true } });
    expect(log[1].detail).toEqual(first.detail);
    for (const [left, top, width, height, expected] of [
      [-50, 50, 100, 100, [-1.5, -.5, -.5, .5, .5, "partial"]],
      [150, 50, 100, 100, [.5, -.5, 1.5, .5, .5, "partial"]],
      [50, -50, 100, 100, [-.5, -1.5, .5, -.5, .5, "partial"]],
      [50, 150, 100, 100, [-.5, .5, .5, 1.5, .5, "partial"]],
      [0, 0, 200, 200, [-1, -1, 1, 1, 1, "inside"]],
      [0, 0, 400, 400, [-1, -1, 3, 3, .25, "partial"]],
      [500, 500, 100, 100, [4, 4, 5, 5, 0, "outside"]],
      [-500, -500, 100, 100, [-6, -6, -5, -5, 0, "outside"]]
    ]) {
      await changeGeometry(page, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
      const event = (await changes(page)).at(-1), detail = event.detail;
      expect([detail.x1, detail.y1, detail.x2, detail.y2, detail.visible, detail.state]).toEqual(expected);
      expect(detail.x).toBe((detail.x1 + detail.x2) / 2);
      expect(detail.y).toBe((detail.y1 + detail.y2) / 2);
      expect(event.css.map(Number)).toEqual([Math.max(-2, Math.min(2, detail.x)),
        Math.max(-2, Math.min(2, detail.y)), detail.visible]);
    }
    const probe = await page.evaluate(() => ({ rects: viewportProbe.rectReads, reads: viewportProbe.reads }));
    expect(probe.rects).toBeGreaterThan(0);
    expect(probe.rects).toBeLessThanOrEqual(probe.reads);
  });

  for (const [left, state, terminal] of [[50, "inside", "ViewportFullyInside"],
    [150, "partial", null], [200, "outside", "ViewportFullyOutside"]]) {
    test(`initial ${state} emits Change before its matching state event`, async ({ page }) => {
      await setup(page, fixture("", `left:${left}px`, "hidden"), legacy, false, true);
      const log = await eventLog(page);
      expect(log.map(event => event.name)).toEqual(terminal ? ["ViewportChange", terminal] : ["ViewportChange"]);
      expect(log[0].detail).toMatchObject({ state, initial: true, previous: null, measurable: true });
    });
  }

  test("state transitions are distinct from movement and unchanged scroll notifications", async ({ page }) => {
    await setup(page, fixture("", "left:200px", "hidden"), legacy, false, true);
    const expected = ["ViewportChange", "ViewportFullyOutside"];
    for (const [left, terminal] of [[150, null], [50, "ViewportFullyInside"], [150, null],
      [200, "ViewportFullyOutside"], [50, "ViewportFullyInside"], [200, "ViewportFullyOutside"], [210, null]]) {
      const previous = (await changes(page)).at(-1).detail;
      await changeGeometry(page, { left: `${left}px` });
      expected.push("ViewportChange"); if (terminal) expected.push(terminal);
      const event = (await changes(page)).at(-1);
      const { previous: ignoredPrevious, initial: ignoredInitial, ...snapshot } = previous;
      expect(event.detail.previous).toEqual(snapshot);
      expect(event.detail.initial).toBe(false);
    }
    await page.evaluate(async () => {
      const element = document.getElementById("item"), box = document.getElementById("box");
      for (let index = 0; index < 20; index++) box.dispatchEvent(new Event("scroll"));
      await AelluxJs.mountManager.update(element, "viewport");
      await AelluxJs.mountManager.update(element, "viewport");
    });
    const log = await eventLog(page);
    expect(log.map(event => event.name)).toEqual(expected);
    const cycles = log.filter(event => event.name === "ViewportChange").map(event => event.cycle);
    expect(new Set(cycles).size).toBe(cycles.length);
  });

  test("relative dimensions emit Change even when center and visible CSS values are unchanged", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy, false, true);
    await changeGeometry(page, { left: "60px", top: "60px", width: "80px", height: "80px" });
    const log = await eventLog(page);
    expect(log.map(event => event.name)).toEqual(["ViewportChange", "ViewportFullyInside", "ViewportChange"]);
    expect(log[2]).toMatchObject({ css: ["0", "0", "1"], detail: { x1: -.4, y1: -.4, x2: .4, y2: .4 } });
  });

  for (const axis of ["x", "y"]) test(`${axis} selects CSS only, while events retain both axes`, async ({ page }) => {
    await setup(page, fixture("", "left:300px;top:400px;--ae-viewport-x:9;--ae-viewport-y:8", "hidden")
      .replace("data-ae-viewport ", `data-ae-viewport="${axis}" `), legacy, false, true);
    const event = (await changes(page))[0];
    expect(event.detail).toMatchObject({ x1: 2, y1: 3, x2: 3, y2: 4, x: 2.5, y: 3.5, state: "outside" });
    expect(event.css).toEqual(axis === "x" ? ["2", "8", "0"] : ["9", "2", "0"]);
  });

  test("epsilon suppresses numeric noise without hiding exact boundary crossings", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy, false, true);
    await page.locator("#item").evaluate(element => {
      const rect = element.getBoundingClientRect.bind(element);
      window.viewportNoise = .00005;
      element.getBoundingClientRect = () => {
        const value = rect();
        return { left: value.left + viewportNoise, right: value.right + viewportNoise,
          top: value.top, bottom: value.bottom, width: value.width, height: value.height };
      };
    });
    await page.evaluate(() => AelluxJs.mountManager.update(document.getElementById("item"), "viewport"));
    expect(await changes(page)).toHaveLength(1);
    await page.evaluate(() => { viewportNoise = 0; });
    await changeGeometry(page, { left: "0px" });
    expect((await changes(page)).at(-1).detail.state).toBe("inside");
    await page.evaluate(async () => {
      viewportNoise = -.00001;
      await AelluxJs.mountManager.update(document.getElementById("item"), "viewport");
    });
    expect((await changes(page)).at(-1).detail.state).toBe("partial");
    await page.evaluate(() => { viewportNoise = 0; });
    await changeGeometry(page, { left: "200px" });
    expect((await changes(page)).at(-1).detail.state).toBe("outside");
    await page.evaluate(async () => {
      viewportNoise = -.00001;
      await AelluxJs.mountManager.update(document.getElementById("item"), "viewport");
    });
    expect((await changes(page)).at(-1).detail.state).toBe("partial");
    await page.evaluate(() => { viewportNoise = 0; });
    await changeGeometry(page, { left: "0px", width: "400px" });
    const before = (await changes(page)).length;
    await page.evaluate(async () => {
      viewportNoise = -.00001;
      await AelluxJs.mountManager.update(document.getElementById("item"), "viewport");
    });
    const log = await changes(page);
    expect(log).toHaveLength(before + 1);
    expect(log.at(-1).detail.state).toBe("partial");
    expect(log.at(-1).detail.previous.state).toBe("partial");
  });

  test("document references and RTL retain physical normalized coordinates", async ({ page }) => {
    await setup(page, '<article id="item" data-ae-viewport style="position:absolute;left:50px;top:50px;width:100px;height:100px"></article>', legacy, false, true);
    expect((await changes(page))[0].detail.viewport).toBe("document");
    await page.evaluate(async markup => {
      await AelluxJs.unmount(document.getElementById("item"), "viewport");
      document.body.innerHTML = markup;
      viewportEvents.length = 0;
      await AelluxJs.mount(document.body);
    }, fixture("direction:rtl", "", "hidden"));
    const detail = (await changes(page))[0].detail;
    const expected = await page.evaluate(() => {
      const box = document.getElementById("box"), item = document.getElementById("item");
      const reference = box.getBoundingClientRect(), rect = item.getBoundingClientRect();
      const left = reference.left + box.clientLeft, top = reference.top + box.clientTop;
      return [(rect.left - left - box.clientWidth / 2) * 2 / box.clientWidth,
        (rect.top - top - box.clientHeight / 2) * 2 / box.clientHeight,
        (rect.right - left - box.clientWidth / 2) * 2 / box.clientWidth,
        (rect.bottom - top - box.clientHeight / 2) * 2 / box.clientHeight];
    });
    expect([detail.x1, detail.y1, detail.x2, detail.y2]).toEqual(expected);
  });

  test("a new viewport reference emits Change even with identical normalized geometry", async ({ page }) => {
    await setup(page, fixture("", "", "hidden") +
      '<div id="other" style="position:relative;width:200px;height:200px;border:10px solid;overflow:hidden"><div style="width:1000px;height:1000px"></div></div>', legacy, false, true);
    await page.evaluate(async () => {
      document.getElementById("other").firstElementChild.appendChild(document.getElementById("item"));
      await AelluxJs.mountManager.update(document.getElementById("item"), "viewport");
    });
    const log = await eventLog(page);
    expect(log.map(event => event.name)).toEqual(["ViewportChange", "ViewportFullyInside", "ViewportChange"]);
    expect(log[2].detail).toMatchObject({ viewport: "other", x: 0, y: 0, state: "inside", initial: false,
      previous: { viewport: "box", x: 0, y: 0, state: "inside" } });
  });

  test("unmeasurable geometry reports null snapshots without false FullyOutside events", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy, false, true);
    for (const [id, property, invalid, restored] of [["item", "width", "0px", "100px"],
      ["item", "height", "0px", "100px"], ["item", "display", "none", "block"],
      ["box", "width", "0px", "200px"], ["box", "height", "0px", "200px"]]) {
      const before = (await eventLog(page)).length;
      await page.locator(`#${id}`).evaluate((el, [property, value]) => { el.style[property] = value; }, [property, invalid]);
      await page.evaluate(() => AelluxJs.mountManager.update(document.getElementById("item"), "viewport"));
      let log = await eventLog(page);
      expect(log.slice(before).map(event => event.name)).toEqual(["ViewportChange"]);
      expect(log.at(-1).detail).toMatchObject({ x1: null, y1: null, x2: null, y2: null,
        x: null, y: null, visible: 0, state: null, measurable: false, initial: false });
      await page.locator(`#${id}`).evaluate((el, [property, value]) => { el.style[property] = value; }, [property, restored]);
      await page.evaluate(() => AelluxJs.mountManager.update(document.getElementById("item"), "viewport"));
      log = await eventLog(page);
      expect(log.slice(before + 1).map(event => event.name)).toEqual(["ViewportChange", "ViewportFullyInside"]);
    }
    await page.locator("#item").evaluate(element => {
      window.viewportNativeRect = element.getBoundingClientRect.bind(element);
      element.getBoundingClientRect = () => ({ left: NaN, right: Infinity, top: 0, bottom: 100, width: 100, height: 100 });
    });
    await page.evaluate(() => AelluxJs.mountManager.update(document.getElementById("item"), "viewport"));
    expect((await changes(page)).at(-1).detail).toMatchObject({ measurable: false, x: null, state: null });
    await page.locator("#item").evaluate(element => { element.getBoundingClientRect = viewportNativeRect; });
    await page.evaluate(() => AelluxJs.mountManager.update(document.getElementById("item"), "viewport"));
    expect((await changes(page)).at(-1).detail.measurable).toBe(true);
    expect((await eventLog(page)).some(event => event.name === "ViewportFullyOutside")).toBe(false);
  });

  test("unknown initial geometry waits for the first valid initial snapshot", async ({ page }) => {
    await setup(page, fixture("", "width:0", "hidden"), legacy, false, true);
    expect(await eventLog(page)).toEqual([]);
    await changeGeometry(page, { width: "100px" });
    expect((await changes(page))[0].detail).toMatchObject({ initial: true, previous: null, state: "inside" });
  });

  test("listener mutations cannot alter internal or subsequent event snapshots", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy, false, "mutate");
    let log = await eventLog(page);
    expect(log[1].detail).toEqual(log[0].detail);
    await changeGeometry(page, { left: "60px" });
    log = await eventLog(page);
    expect(log.at(-1).detail).toMatchObject({ x1: -.4, previous: { x1: -.5, state: "inside" } });
    await changeGeometry(page, { left: "200px" });
    log = await eventLog(page);
    expect(log.at(-1).name).toBe("ViewportFullyOutside");
    expect(log.at(-1).detail).toEqual(log.at(-2).detail);
    expect(log.at(-1).detail.previous.x1).toBe(-.4);
  });

  for (const action of ["unmount", "destroy", "remove", "detach", "cancel"]) {
    test(`${action} during initial Change suppresses obsolete state events unless canceled`, async ({ page }) => {
      await setup(page, fixture("", "", "hidden"), legacy, false, action);
      await page.evaluate(async () => { await window.viewportLifecycle; });
      const log = await eventLog(page);
      expect(log.map(event => event.name)).toEqual(action === "cancel" ?
        ["ViewportChange", "ViewportFullyInside"] : ["ViewportChange"]);
    });
  }

  test("unmount, attribute removal and remount start fresh without duplicate events", async ({ page }) => {
    await setup(page, fixture("", "", "hidden"), legacy, false, true);
    await page.evaluate(async () => {
      const item = document.getElementById("item");
      await AelluxJs.unmount(item, "viewport");
      await AelluxJs.mount(item, "viewport");
      await AelluxJs.mount(item, "viewport");
      item.removeAttribute("data-ae-viewport");
      await AelluxJs.mountManager.update(item, "viewport");
      item.setAttribute("data-ae-viewport", "");
      await AelluxJs.mount(item, "viewport");
    });
    const log = await eventLog(page);
    expect(log.map(event => event.name)).toEqual(Array(3).fill(["ViewportChange", "ViewportFullyInside"]).flat());
    for (const event of log) expect(event.detail).toMatchObject({ previous: null, initial: true });
    expect(await page.evaluate(() => viewportProbe.listeners.size)).toBe(1);
  });
});
