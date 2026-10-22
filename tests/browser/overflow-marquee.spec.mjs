import { expect, test } from "@playwright/test";

const text = "A complete label that is substantially wider than its available space";
const markup = (contents = text, extra = "") => `<div id="label" data-ae-overflow-marquee class="wrap"
  style="width:140px;font:16px/20px monospace;padding:3px 7px;border:2px solid;white-space:normal;
  --ae-overflow-marquee-speed:900;--ae-overflow-marquee-delay:80ms" ${extra}>${contents}</div>`;

async function start(page, html = markup(), options = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ html, options }) => {
    document.body.innerHTML = '<style>.wrap{white-space:normal}</style>' + html;
    if (options.mode === "basic") AelluxJs.ext("overflow-marquee");
    AelluxJs.init({ mode: "full", ...options });
  }, { html, options });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.overflowMarquee?.initialized)).toBe(true);
  expect(await page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document));
  await expect(page.locator("#label > [data-ae-overflow-marquee-content]")).toHaveCount(1);
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`marquee mounts from its attribute and jumps back after a linear pass (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    const requests = [];
    page.on("request", request => { if (request.url().includes("aellux.ext.overflow-marquee")) requests.push(request.url()); });
    await start(page, markup(), { mode, forceLegacy });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toContain(forceLegacy ? "aellux.ext.overflow-marquee.legacy.js" : "aellux.ext.overflow-marquee.js");
    expect(await page.evaluate(() => document.querySelector("#label [data-ae-anchor]"))).toBeNull();
    const host = page.locator("#label");
    const content = host.locator("[data-ae-overflow-marquee-content]");
    await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
    await expect(host).toHaveAttribute("title", text);
    await expect(host).toHaveCSS("white-space", "nowrap");
    await expect(content).toHaveCSS("white-space", "nowrap");
    expect(await host.evaluate(element => element.style.whiteSpace)).toBe("normal");
    expect(await host.evaluate(element => element.getBoundingClientRect().height)).toBe(30);
    const pass = await host.evaluate(async element => {
      const wrapper = element.firstElementChild;
      const style = getComputedStyle(element);
      const baseline = () => element.getBoundingClientRect().left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
      const distance = wrapper.getBoundingClientRect().width - (element.clientWidth - 14);
      let minimum = 0, started = false;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Marquee did not complete a pass")), 5000);
        const sample = () => {
          const x = wrapper.getBoundingClientRect().left - baseline();
          minimum = Math.min(minimum, x);
          if (x < -5) started = true;
          if (started && x > -1 && wrapper.getAttribute("data-ae-overflow-marquee-content") === "top-left:top-left") {
            clearTimeout(timeout); resolve({ minimum, distance, x });
          }
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
    });
    expect(pass.minimum).toBeLessThan(-pass.distance * 0.6);
    expect(Math.abs(pass.x)).toBeLessThan(1);
    expect(await host.textContent()).toBe(text);
    expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry => entry.level === 0))).toEqual([]);
  });
}

for (const forceLegacy of [false, true]) test(`root reduced motion keeps ellipsis and title, and can resume (${forceLegacy})`, async ({ page }) => {
  await start(page, markup(), { forceLegacy });
  await page.evaluate(() => document.documentElement.setAttribute("data-ae-reduced-motion", "reduced"));
  const host = page.locator("#label"), content = host.locator("[data-ae-overflow-marquee-content]");
  await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
  await expect(content).toHaveCSS("transform", "none");
  await expect(content).toHaveCSS("text-overflow", "ellipsis");
  await expect(content).toHaveCSS("white-space", "nowrap");
  await expect(host).toHaveAttribute("title", text);
  expect(await content.evaluate(element => element.getAnimations().length)).toBe(0);
  await page.evaluate(() => document.documentElement.setAttribute("data-ae-reduced-motion", "no-preference"));
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
});

for (const forceLegacy of [false, true]) test(`both ends hold for the configured delay before the next phase (${forceLegacy})`, async ({ page }) => {
  await start(page, markup().replace("80ms", "350ms"), { forceLegacy });
  const holds = await page.locator("#label").evaluate(async element => {
    const wrapper = element.firstElementChild;
    let endAt = null, startAt = null;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Both endpoint holds did not complete")), 7000);
      const sample = () => {
        const now = performance.now();
        const x = new DOMMatrixReadOnly(getComputedStyle(wrapper).transform).m41;
        const phase = wrapper.getAttribute("data-ae-overflow-marquee-content");
        if (endAt === null && x < -50 && phase === "bottom-right:bottom-right" && wrapper.style.transition === "none") endAt = now;
        if (endAt !== null && startAt === null && Math.abs(x) < 1 && phase === "top-left:top-left") startAt = now;
        if (startAt !== null && x < -5 && phase === "bottom-right:bottom-right") {
          clearTimeout(timeout);
          resolve({ endHold: startAt - endAt, startHold: now - startAt });
        } else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  });
  expect(holds.endHold).toBeGreaterThanOrEqual(300);
  expect(holds.startHold).toBeGreaterThanOrEqual(300);
  expect(Math.abs(holds.endHold - holds.startHold)).toBeLessThan(180);
});

for (const options of [{}, { forceLegacy: true }, { cssMotionController: false }]) {
  test(`hover and focus within pause together and resume in place (${JSON.stringify(options)})`, async ({ page }) => {
    await start(page, markup(`<a id="first" href="#label">${text}</a><a id="second" href="#label"> More</a>`, 'tabindex="0"'), options);
    const host = page.locator("#label"), content = host.locator("[data-ae-overflow-marquee-content]");
    const offset = () => content.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
    await expect.poll(offset, { intervals: [20, 40] }).toBeLessThan(-50);
    const box = await host.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect.poll(() => content.evaluate(element => element.getAnimations().length)).toBe(0);
    const frozen = await offset();
    expect(frozen).toBeLessThan(-20);
    await page.waitForTimeout(250);
    expect(await offset()).toBeCloseTo(frozen, 1);
    await expect(host).toHaveAttribute("title", `${text} More`);
    await host.focus();
    await page.mouse.move(900, 600);
    await page.waitForTimeout(150);
    expect(await offset()).toBeCloseTo(frozen, 1);
    for (const id of ["first", "second"]) {
      await page.locator(`#${id}`).focus();
      await page.waitForTimeout(120);
      expect(await offset()).toBeCloseTo(frozen, 1);
    }
    await page.evaluate(() => document.activeElement.blur());
    await expect.poll(offset, { intervals: [20, 40] }).toBeLessThan(frozen - 25);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("label"), "overflow-marquee"));
    await host.hover();
    await host.focus();
    await page.waitForTimeout(100);
    await expect(content).toHaveCount(0);
  });
}

test("hover preserves the remaining end hold before the instant reset", async ({ page }) => {
  await start(page, markup(text, 'tabindex="0"').replace("80ms", "600ms"));
  const host = page.locator("#label"), content = host.locator("[data-ae-overflow-marquee-content]");
  await expect.poll(() => content.evaluate(element =>
    element.getAttribute("data-ae-overflow-marquee-content") === "bottom-right:bottom-right" && element.style.transition === "none"),
  { intervals: [20, 40] }).toBe(true);
  await host.hover();
  const end = await content.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  expect(end).toBeLessThan(-100);
  await page.waitForTimeout(700);
  expect(await content.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)).toBe(end);
  await page.mouse.move(900, 600);
  await page.waitForTimeout(150);
  expect(await content.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)).toBe(end);
  await expect(content).toHaveAttribute("data-ae-overflow-marquee-content", "top-left:top-left");
  expect(await content.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)).toBe(0);
});

test("Anchor alone does not mount marquees and Full keeps the dedicated extension lazy", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(html => {
    document.body.innerHTML = html;
    AelluxJs.ext("anchor");
    AelluxJs.init({ mode: "basic" });
  }, markup());
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document));
  await expect(page.locator("[data-ae-overflow-marquee-content]")).toHaveCount(0);
  const requests = [];
  page.on("request", request => { if (request.url().includes("aellux.ext.overflow-marquee")) requests.push(request.url()); });
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = '<div style="position:relative;width:100px;height:40px"><div data-ae-anchor="top-left:top-left">Anchor</div></div>';
    AelluxJs.init({ mode: "full" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document));
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => !!AelluxJs.ext.overflowMarquee?.initialized)).toBe(false);
});

test("destroy releases the dedicated stylesheet, wrappers and both placement lifecycles", async ({ page }) => {
  await start(page);
  await expect(page.locator("style[data-ae-overflow-marquee-style]")).toHaveCount(1);
  await page.evaluate(() => AelluxJs.destroy());
  await expect(page.locator("[data-ae-overflow-marquee-content]")).toHaveCount(0);
  await expect(page.locator("style[data-ae-overflow-marquee-style]")).toHaveCount(0);
  await expect(page.locator("style[data-ae-anchor-style]")).toHaveCount(0);
  await expect(page.locator("#label")).toHaveText(text);
  await page.waitForTimeout(150);
  await expect(page.locator("[data-ae-overflow-marquee-content]")).toHaveCount(0);
});

test("fitting labels stay static and react to edits and complete content replacement", async ({ page }) => {
  await start(page, markup("Short"));
  const host = page.locator("#label");
  await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
  await expect(host).not.toHaveAttribute("title");
  await host.evaluate((element, text) => { element.firstElementChild.firstChild.nodeValue = text; }, text);
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
  await expect(host).toHaveAttribute("title", text);
  await host.evaluate(element => { element.textContent = "Replacement"; });
  await expect(host.locator("[data-ae-overflow-marquee-content]")).toHaveCount(1);
  await expect(host).toHaveText("Replacement");
  await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
  await expect(host).not.toHaveAttribute("title");
});

test("unmount restores node identity, listeners, styles and authored title without wrapping twice", async ({ page }) => {
  await start(page, markup(`<a id="link" href="#label">${text}</a>`, 'title="Authored tooltip"'));
  const result = await page.evaluate(async () => {
    const host = document.getElementById("label"), link = document.getElementById("link");
    const originalStyle = host.getAttribute("style");
    let clicks = 0;
    link.addEventListener("click", event => { event.preventDefault(); clicks++; });
    await AelluxJs.mount(host, "overflow-marquee");
    const wrappers = host.querySelectorAll("[data-ae-overflow-marquee-content]").length;
    await AelluxJs.unmount(host, "overflow-marquee");
    link.click();
    return { wrappers, sameNode: host.firstChild === link, clicks, title: host.title,
      sameStyle: host.getAttribute("style") === originalStyle,
      wrappersAfter: host.querySelectorAll("[data-ae-overflow-marquee-content]").length };
  });
  expect(result).toEqual({ wrappers: 1, sameNode: true, clicks: 1, title: "Authored tooltip", sameStyle: true, wrappersAfter: 0 });
});

test("desktop title ownership preserves application changes and avoids tooltips without hover", async ({ page }) => {
  await start(page);
  await page.locator("#label").evaluate(element => { element.title = "Application update"; });
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("label"), "overflow-marquee"));
  await expect(page.locator("#label")).toHaveAttribute("title", "Application update");
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = query => query.includes("any-hover") ? { matches: false, addEventListener() {}, removeEventListener() {} } : original(query);
  });
  await start(page);
  await expect(page.locator("#label")).not.toHaveAttribute("title");
});

test("hidden labels and window resizing without ResizeObserver recompute overflow", async ({ page }) => {
  await page.addInitScript(() => { window.ResizeObserver = undefined; });
  await start(page);
  const host = page.locator("#label");
  await host.evaluate(element => { element.hidden = true; });
  await expect.poll(() => host.evaluate(element => element.firstElementChild.getAnimations().length)).toBe(0);
  await host.evaluate(element => { element.hidden = false; element.style.width = "1200px"; });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
  await expect(host).not.toHaveAttribute("title");
  await host.evaluate(element => { element.style.width = "140px"; });
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
});

for (const options of [{}, { forceLegacy: true }, { cssMotionController: false }]) {
  test(`invisible labels stay idle and pause in place until visible (${JSON.stringify(options)})`, async ({ page }) => {
    await start(page, `<section id="parent" style="opacity:0">${markup()}</section>`, options);
    const host = page.locator("#label"), parent = page.locator("#parent");
    await page.evaluate(() => {
      const original = AelluxJs.motion.run;
      window.marqueeRuns = 0;
      AelluxJs.motion = { ...AelluxJs.motion, run(...args) { window.marqueeRuns++; return original(...args); } };
    });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.marqueeRuns)).toBe(0);
    await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
    await parent.evaluate(element => { element.style.opacity = "1"; });
    await expect.poll(() => host.evaluate(element => {
      const x = new DOMMatrixReadOnly(getComputedStyle(element.firstElementChild).transform).m41;
      return x < -60 && x > -300;
    }), { intervals: [20, 40] }).toBe(true);
    await parent.evaluate(element => { element.style.opacity = "0"; });
    await expect.poll(() => host.evaluate(element => element.firstElementChild.getAnimations().length)).toBe(0);
    const snapshot = await host.evaluate(element => ({
      x: new DOMMatrixReadOnly(getComputedStyle(element.firstElementChild).transform).m41, runs: window.marqueeRuns
    }));
    expect(snapshot.x).toBeLessThan(-30);
    await page.waitForTimeout(750);
    const paused = await host.evaluate(element => ({
      x: new DOMMatrixReadOnly(getComputedStyle(element.firstElementChild).transform).m41, runs: window.marqueeRuns
    }));
    expect(paused).toEqual(snapshot);
    const restored = await parent.evaluate(async element => {
      element.style.opacity = "1";
      await new Promise(resolve => requestAnimationFrame(resolve));
      return new DOMMatrixReadOnly(getComputedStyle(document.querySelector("[data-ae-overflow-marquee-content]")).transform).m41;
    });
    expect(Math.abs(restored - snapshot.x)).toBeLessThan(35);
    await expect.poll(() => page.evaluate(() => window.marqueeRuns)).toBeGreaterThan(snapshot.runs);
    await expect.poll(() => host.evaluate(element =>
      new DOMMatrixReadOnly(getComputedStyle(element.firstElementChild).transform).m41)).toBeLessThan(snapshot.x - 30);
  });
}

test("leaving the viewport pauses motion and keeps the remaining restart delay", async ({ page }) => {
  await start(page, markup().replace("80ms", "1500ms"));
  const host = page.locator("#label");
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
  await host.evaluate(element => { element.style.marginTop = "2000px"; });
  await page.waitForTimeout(1700);
  expect(await host.evaluate(element => element.firstElementChild.getAnimations().length)).toBe(0);
  await host.evaluate(element => { element.style.marginTop = "0px"; });
  await page.waitForTimeout(250);
  expect(await host.evaluate(element => getComputedStyle(element.firstElementChild).transform)).toMatch(/matrix\(1, 0, 0, 1, 0, 0\)/);
  await expect.poll(() => host.evaluate(element =>
    new DOMMatrixReadOnly(getComputedStyle(element.firstElementChild).transform).m41), { intervals: [20, 50] }).toBeLessThan(-20);
});

test("display:none and background documents suspend without losing progress", async ({ page }) => {
  await start(page, markup().replace("900", "150"));
  const host = page.locator("#label");
  for (const reason of ["display", "document"]) {
    await expect.poll(() => host.evaluate(element =>
      new DOMMatrixReadOnly(getComputedStyle(element.firstElementChild).transform).m41)).toBeLessThan(-35);
    const before = await host.evaluate(element =>
      new DOMMatrixReadOnly(getComputedStyle(element.firstElementChild).transform).m41);
    await host.evaluate((element, reason) => {
      if (reason === "display") element.style.display = "none";
      else {
        Object.defineProperty(document, "hidden", { configurable: true, value: true });
        document.dispatchEvent(new Event("visibilitychange"));
      }
    }, reason);
    await expect.poll(() => host.evaluate(element => element.firstElementChild.getAnimations().length)).toBe(0);
    const offset = await host.evaluate(element => parseFloat(element.firstElementChild.style.getPropertyValue("--ae-anchor-x")));
    expect(offset).toBeLessThan(-20);
    expect(Math.abs(offset - before)).toBeLessThan(20);
    await page.waitForTimeout(400);
    expect(await host.evaluate(element => parseFloat(element.firstElementChild.style.getPropertyValue("--ae-anchor-x")))).toBe(offset);
    const restored = await host.evaluate(async (element, reason) => {
      if (reason === "display") element.style.display = "block";
      else {
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
      return new DOMMatrixReadOnly(getComputedStyle(element.firstElementChild).transform).m41;
    }, reason);
    expect(Math.abs(restored - offset)).toBeLessThan(15);
  }
});

test("ancestor clipping and CSS visibility changes wake only visible labels", async ({ page }) => {
  await start(page, `<section id="clip" style="height:30px;overflow:hidden"><div style="height:80px"></div>${markup()}</section>`);
  const host = page.locator("#label");
  await page.waitForTimeout(200);
  await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
  await page.locator("#clip").evaluate(element => { element.scrollTop = 80; });
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
  await page.locator("#clip").evaluate(element => { element.style.visibility = "hidden"; });
  await expect.poll(() => host.evaluate(element => element.firstElementChild.getAnimations().length)).toBe(0);
  const offset = await host.evaluate(element => element.firstElementChild.style.getPropertyValue("--ae-anchor-x"));
  await page.waitForTimeout(200);
  expect(await host.evaluate(element => element.firstElementChild.style.getPropertyValue("--ae-anchor-x"))).toBe(offset);
  await page.locator("#clip").evaluate(element => { element.style.visibility = "visible"; });
  await expect.poll(() => host.evaluate(element => element.firstElementChild.getAnimations().length)).toBeGreaterThan(0);
});

test("CSS reveal transitions, overridden hidden and missing IntersectionObserver use final visibility", async ({ page }) => {
  await page.addInitScript(() => { window.IntersectionObserver = undefined; });
  await start(page, `<section id="parent" style="opacity:0;transition:opacity 100ms">${markup(text, "hidden").replace("width:140px", "display:block;width:140px")}</section>`);
  const host = page.locator("#label");
  await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
  await page.locator("#parent").evaluate(element => { element.style.opacity = "1"; });
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
  await page.locator("#parent").evaluate(element => { element.style.opacity = "0"; });
  await expect.poll(() => host.evaluate(element => element.firstElementChild.getAnimations().length)).toBe(0);
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("label"), "overflow-marquee"));
  await page.locator("#parent").evaluate(element => { element.style.opacity = "1"; });
  await page.waitForTimeout(200);
  await expect(host.locator("[data-ae-overflow-marquee-content]")).toHaveCount(0);
  await expect(host).toHaveText(text);
  await expect(host).not.toHaveAttribute("title");
});
