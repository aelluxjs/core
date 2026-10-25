import { expect, test } from "@playwright/test";

async function setup(page, markup, forceLegacy = false, fallback = false) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(async ({ forceLegacy, fallback }) => {
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
  }, { forceLegacy, fallback });
  await page.evaluate(async markup => {
    document.body.style.margin = "0";
    document.body.innerHTML = markup;
    await AelluxJs.mount(document.body);
  }, markup);
  if (markup.includes("data-ae-viewport"))
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
