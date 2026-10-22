import { expect, test } from "@playwright/test";

const text = "A complete label that is substantially wider than its available space";
const markup = (contents = text, extra = "") => `<div id="label" data-ae-overflow-marquee class="wrap"
  style="width:140px;font:16px/20px monospace;padding:3px 7px;border:2px solid;white-space:normal;
  --ae-overflow-marquee-speed:900;--ae-overflow-marquee-delay:80ms" ${extra}>${contents}</div>`;

async function start(page, html = markup(), options = {}, wrapped = true) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ html, options }) => {
    document.body.innerHTML = '<style>.wrap{white-space:normal}</style>' + html;
    if (options.mode === "basic") AelluxJs.ext("overflow-marquee", { loadStyle: true });
    AelluxJs.init({ mode: "full", ...options });
  }, { html, options });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.overflowMarquee?.initialized)).toBe(true);
  expect(await page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document));
  await expect(page.locator("#label > [data-ae-overflow-marquee-viewport] > [data-ae-overflow-marquee-content]")).toHaveCount(wrapped ? 1 : 0);
}

for (const forceLegacy of [false, true]) for (const limit of ["200", "200px"]) {
  test(`pixel limit skips marquee presentation until content strictly exceeds it (${limit}, legacy=${forceLegacy})`, async ({ page }) => {
    const html = markup('<span id="original" style="display:inline-block;width:200px;height:20px">Label</span>')
      .replace("data-ae-overflow-marquee class", `data-ae-overflow-marquee="${limit}" class`);
    await start(page, html, { mode: limit === "200" ? "basic" : "full", forceLegacy }, false);
    const host = page.locator("#label");
    await expect(host).toHaveCSS("white-space", "normal");
    await expect(host).toHaveCSS("overflow", "visible");
    await expect(host).not.toHaveAttribute("title");
    await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-ready");
    await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
    const original = await host.evaluate(element => {
      window.limitOriginal = element.firstChild;
      window.limitStyle = element.getAttribute("style");
      window.limitClicks = 0;
      element.firstChild.addEventListener("click", () => window.limitClicks++);
      return element.getBoundingClientRect().width;
    });
    // The gate still applies when content overflows the narrower host.
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      window.limitProbes = 0;
      const createRange = document.createRange.bind(document);
      document.createRange = () => { window.limitProbes++; return createRange(); };
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("scroll"));
      document.getElementById("label").dispatchEvent(new Event("mouseenter"));
      document.getElementById("label").dispatchEvent(new Event("focusin"));
    });
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.limitProbes)).toBe(0);
    await expect(host.locator("[data-ae-overflow-marquee-viewport]")).toHaveCount(0);
    await page.locator("#original").evaluate(element => element.style.width = "201px");
    await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
    await expect(host).toHaveCSS("width", "140px");
    expect(await host.evaluate(element => element.getBoundingClientRect().width)).toBe(original);
    await page.locator("#original").evaluate(element => element.style.width = "199px");
    await expect(host.locator("[data-ae-overflow-marquee-viewport]")).toHaveCount(0);
    await expect(host).not.toHaveAttribute("title");
    await expect(host).toHaveCSS("white-space", "normal");
    expect(await host.evaluate(element => element.firstChild === window.limitOriginal &&
      element.getAttribute("style") === window.limitStyle)).toBe(true);
    await page.evaluate(() => { window.limitOriginal.click(); });
    expect(await page.evaluate(() => window.limitClicks)).toBe(1);
    // A height greater than the limit also qualifies; motion stays horizontal.
    await page.locator("#original").evaluate(element => element.style.height = "201px");
    await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
    await host.evaluate(element => element.setAttribute("data-ae-overflow-marquee", "1000px"));
    await expect(host.locator("[data-ae-overflow-marquee-viewport]")).toHaveCount(0);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("label"), "overflow-marquee"));
    await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-ready");
  });
}

test("pixel limit measures unwrapped text, reacts to replacement and does not impose a width", async ({ page }) => {
  await start(page, markup("Short").replace("data-ae-overflow-marquee class", 'data-ae-overflow-marquee="250.5px" class'), {}, false);
  const host = page.locator("#label");
  await host.evaluate((element, value) => element.textContent = value, text);
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
  await host.evaluate(element => element.style.width = "900px");
  await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
  await expect(host).toHaveCSS("width", "900px");
  await host.evaluate(element => element.textContent = "Short");
  await expect(host.locator("[data-ae-overflow-marquee-viewport]")).toHaveCount(0);
  await host.evaluate(element => element.setAttribute("data-ae-overflow-marquee", ""));
  await expect(host.locator("[data-ae-overflow-marquee-viewport]")).toHaveCount(1);
});

test("pixel limit preserves missing styles and includes the content line height", async ({ page }) => {
  await start(page, '<div style="width:10px;font:16px/40px monospace"><a id="label" data-ae-overflow-marquee="200px">ii</a></div>', {}, false);
  const host = page.locator("#label");
  await expect(host).not.toHaveAttribute("style");
  await host.evaluate(element => element.setAttribute("data-ae-overflow-marquee", "30px"));
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
  await host.evaluate(element => element.setAttribute("data-ae-overflow-marquee", "200px"));
  await expect(host.locator("[data-ae-overflow-marquee-viewport]")).toHaveCount(0);
  await expect(host).not.toHaveAttribute("style");
});

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`marquee mounts from its attribute and jumps back after a linear pass (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    const requests = [];
    page.on("request", request => {
      if (request.resourceType() === "script" && request.url().includes("aellux.ext.overflow-marquee")) requests.push(request.url());
    });
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
      const wrapper = element.querySelector("[data-ae-overflow-marquee-content]");
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
    const wrapper = element.querySelector("[data-ae-overflow-marquee-content]");
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
    const frozenFade = await host.locator("[data-ae-overflow-marquee-viewport]").evaluate(element =>
      parseFloat(getComputedStyle(element).getPropertyValue("--ae-overflow-marquee-offset")));
    expect(frozenFade).toBeCloseTo(Math.abs(frozen), 1);
    expect(frozen).toBeLessThan(-20);
    await page.waitForTimeout(250);
    expect(await offset()).toBeCloseTo(frozen, 1);
    expect(await host.locator("[data-ae-overflow-marquee-viewport]").evaluate(element =>
      parseFloat(getComputedStyle(element).getPropertyValue("--ae-overflow-marquee-offset")))).toBe(frozenFade);
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
    await expect(host.locator("[data-ae-overflow-marquee-viewport]")).toHaveCount(0);
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
    AelluxJs.ext("anchor", { loadStyle: true });
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

test("destroy releases wrappers and placements while retaining the shared Full stylesheet", async ({ page }) => {
  await start(page);
  await expect(page.locator("link[data-ae-full-style]")).toHaveCount(1);
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
  await host.evaluate((element, text) => { element.querySelector("[data-ae-overflow-marquee-content]").firstChild.nodeValue = text; }, text);
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
  await expect.poll(() => host.evaluate(element => element.querySelector("[data-ae-overflow-marquee-content]").getAnimations().length)).toBe(0);
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
      const x = new DOMMatrixReadOnly(getComputedStyle(element.querySelector("[data-ae-overflow-marquee-content]")).transform).m41;
      return x < -60 && x > -300;
    }), { intervals: [20, 40] }).toBe(true);
    await parent.evaluate(element => { element.style.opacity = "0"; });
    await expect.poll(() => host.evaluate(element => element.querySelector("[data-ae-overflow-marquee-content]").getAnimations().length)).toBe(0);
    const snapshot = await host.evaluate(element => ({
      x: new DOMMatrixReadOnly(getComputedStyle(element.querySelector("[data-ae-overflow-marquee-content]")).transform).m41, runs: window.marqueeRuns
    }));
    expect(snapshot.x).toBeLessThan(-30);
    await page.waitForTimeout(750);
    const paused = await host.evaluate(element => ({
      x: new DOMMatrixReadOnly(getComputedStyle(element.querySelector("[data-ae-overflow-marquee-content]")).transform).m41, runs: window.marqueeRuns
    }));
    expect(paused).toEqual(snapshot);
    expect(await host.locator("[data-ae-overflow-marquee-viewport]").evaluate(element =>
      parseFloat(getComputedStyle(element).getPropertyValue("--ae-overflow-marquee-offset")))).toBeCloseTo(Math.abs(paused.x), 1);
    const restored = await parent.evaluate(async element => {
      element.style.opacity = "1";
      await new Promise(resolve => requestAnimationFrame(resolve));
      return new DOMMatrixReadOnly(getComputedStyle(document.querySelector("[data-ae-overflow-marquee-content]")).transform).m41;
    });
    expect(Math.abs(restored - snapshot.x)).toBeLessThan(35);
    await expect.poll(() => page.evaluate(() => window.marqueeRuns)).toBeGreaterThan(snapshot.runs);
    await expect.poll(() => host.evaluate(element =>
      new DOMMatrixReadOnly(getComputedStyle(element.querySelector("[data-ae-overflow-marquee-content]")).transform).m41)).toBeLessThan(snapshot.x - 30);
  });
}

test("leaving the viewport pauses motion and keeps the remaining restart delay", async ({ page }) => {
  await start(page, markup().replace("80ms", "1500ms"));
  const host = page.locator("#label");
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
  await host.evaluate(element => { element.style.marginTop = "2000px"; });
  await page.waitForTimeout(1700);
  expect(await host.evaluate(element => element.querySelector("[data-ae-overflow-marquee-content]").getAnimations().length)).toBe(0);
  await host.evaluate(element => { element.style.marginTop = "0px"; });
  await page.waitForTimeout(250);
  expect(await host.evaluate(element => getComputedStyle(element.querySelector("[data-ae-overflow-marquee-content]")).transform)).toMatch(/matrix\(1, 0, 0, 1, 0, 0\)/);
  await expect.poll(() => host.evaluate(element =>
    new DOMMatrixReadOnly(getComputedStyle(element.querySelector("[data-ae-overflow-marquee-content]")).transform).m41), { intervals: [20, 50] }).toBeLessThan(-20);
});

test("display:none and background documents suspend without losing progress", async ({ page }) => {
  await start(page, markup().replace("900", "150"));
  const host = page.locator("#label");
  for (const reason of ["display", "document"]) {
    await expect.poll(() => host.evaluate(element =>
      new DOMMatrixReadOnly(getComputedStyle(element.querySelector("[data-ae-overflow-marquee-content]")).transform).m41)).toBeLessThan(-35);
    const before = await host.evaluate(element =>
      new DOMMatrixReadOnly(getComputedStyle(element.querySelector("[data-ae-overflow-marquee-content]")).transform).m41);
    await host.evaluate((element, reason) => {
      if (reason === "display") element.style.display = "none";
      else {
        Object.defineProperty(document, "hidden", { configurable: true, value: true });
        document.dispatchEvent(new Event("visibilitychange"));
      }
    }, reason);
    await expect.poll(() => host.evaluate(element => element.querySelector("[data-ae-overflow-marquee-content]").getAnimations().length)).toBe(0);
    const offset = await host.evaluate(element => parseFloat(element.querySelector("[data-ae-overflow-marquee-content]").style.getPropertyValue("--ae-anchor-x")));
    expect(offset).toBeLessThan(-20);
    expect(Math.abs(offset - before)).toBeLessThan(20);
    await page.waitForTimeout(400);
    expect(await host.evaluate(element => parseFloat(element.querySelector("[data-ae-overflow-marquee-content]").style.getPropertyValue("--ae-anchor-x")))).toBe(offset);
    const restored = await host.evaluate(async (element, reason) => {
      if (reason === "display") element.style.display = "block";
      else {
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
      return new DOMMatrixReadOnly(getComputedStyle(element.querySelector("[data-ae-overflow-marquee-content]")).transform).m41;
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
  await expect.poll(() => host.evaluate(element => element.querySelector("[data-ae-overflow-marquee-content]").getAnimations().length)).toBe(0);
  const offset = await host.evaluate(element => element.querySelector("[data-ae-overflow-marquee-content]").style.getPropertyValue("--ae-anchor-x"));
  await page.waitForTimeout(200);
  expect(await host.evaluate(element => element.querySelector("[data-ae-overflow-marquee-content]").style.getPropertyValue("--ae-anchor-x"))).toBe(offset);
  await page.locator("#clip").evaluate(element => { element.style.visibility = "visible"; });
  await expect.poll(() => host.evaluate(element => element.querySelector("[data-ae-overflow-marquee-content]").getAnimations().length)).toBeGreaterThan(0);
});

test("CSS reveal transitions, overridden hidden and missing IntersectionObserver use final visibility", async ({ page }) => {
  await page.addInitScript(() => { window.IntersectionObserver = undefined; });
  await start(page, `<section id="parent" style="opacity:0;transition:opacity 100ms">${markup(text, "hidden").replace("width:140px", "display:block;width:140px")}</section>`);
  const host = page.locator("#label");
  await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
  await page.locator("#parent").evaluate(element => { element.style.opacity = "1"; });
  await expect(host).toHaveAttribute("data-ae-overflow-marquee-active", "");
  await page.locator("#parent").evaluate(element => { element.style.opacity = "0"; });
  await expect.poll(() => host.evaluate(element => element.querySelector("[data-ae-overflow-marquee-content]").getAnimations().length)).toBe(0);
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("label"), "overflow-marquee"));
  await page.locator("#parent").evaluate(element => { element.style.opacity = "1"; });
  await page.waitForTimeout(200);
  await expect(host.locator("[data-ae-overflow-marquee-content]")).toHaveCount(0);
  await expect(host).toHaveText(text);
  await expect(host).not.toHaveAttribute("title");
});

// Sample actual rendered alpha over the white host, including the gradient's
// width and strength; inspecting only custom properties would miss paint bugs.
async function edgePixels(page, viewport) {
  const png = (await viewport.screenshot()).toString("base64");
  return page.evaluate(async png => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const red = x => context.getImageData(x, 5, 1, 1).data[0];
    return { left: red(0), right: red(image.width - 1), middle: red(Math.floor(image.width / 2)) };
  }, png);
}

for (const forceLegacy of [false, true]) for (const direction of ["ltr", "rtl"]) {
  test(`fade paints progressive hidden amounts on a stationary viewport (${direction}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, markup('<span style="display:inline-block;width:400px;height:20px;background:black">label</span>', `dir="${direction}"`)
      .replace("white-space:normal", "white-space:normal;background:white;border-color:blue")
      .replace("900", "100"), { forceLegacy, cssMotionController: false });
    const viewport = page.locator("[data-ae-overflow-marquee-viewport]");
    const content = page.locator("[data-ae-overflow-marquee-content]");
    await expect.poll(() => content.evaluate(element => element.getAnimations().length)).toBe(1);
    const rect = await viewport.boundingBox();
    const samples = [];
    for (const fraction of [0, 0.02, 0.5, 0.98, 1]) {
      const geometry = await viewport.evaluate((element, fraction) => {
        const wrapper = element.firstElementChild;
        for (const node of [element, wrapper]) for (const animation of node.getAnimations()) {
          animation.pause();
          animation.currentTime = animation.effect.getComputedTiming().duration * fraction;
        }
        return { x: new DOMMatrixReadOnly(getComputedStyle(wrapper).transform).m41,
          offset: parseFloat(getComputedStyle(element).getPropertyValue("--ae-overflow-marquee-offset")),
          distance: parseFloat(element.style.getPropertyValue("--ae-overflow-marquee-distance")),
          hostMask: getComputedStyle(element.parentElement).maskImage,
          mask: getComputedStyle(element).maskImage };
      }, fraction);
      expect(geometry.offset).toBeCloseTo(geometry.distance * fraction, 1);
      expect(Math.abs(geometry.x)).toBeCloseTo(geometry.offset, 1);
      expect(geometry.hostMask).toBe("none");
      expect(geometry.mask).toContain("linear-gradient");
      expect(await viewport.boundingBox()).toEqual(rect);
      const pixels = await edgePixels(page, viewport);
      expect(pixels.middle).toBe(0);
      samples.push(direction === "rtl" ? { left: pixels.right, right: pixels.left } : pixels);
    }
    expect(samples[0].left).toBeLessThan(5);
    expect(samples[0].right).toBeGreaterThan(220);
    expect(samples[1].left).toBeGreaterThan(30);
    expect(samples[1].left).toBeLessThan(150);
    expect(samples[2].left).toBeGreaterThan(220);
    expect(samples[2].right).toBeGreaterThan(220);
    expect(samples[3].right).toBeGreaterThan(30);
    expect(samples[3].right).toBeLessThan(150);
    expect(samples[4].left).toBeGreaterThan(220);
    expect(samples[4].right).toBeLessThan(5);
    // Zero size makes the mask fully opaque, even at an interior position.
    await page.locator("#label").evaluate(element => element.style.setProperty("--ae-overflow-marquee-fade-size", "0px"));
    expect(await edgePixels(page, viewport)).toEqual({ left: 0, right: 0, middle: 0 });
  });
}

for (const forceLegacy of [false, true]) {
  test(`fade reconfigures without restarting and survives reduced motion and geometry changes (${forceLegacy})`, async ({ page }) => {
    await start(page, markup(text, 'tabindex="0"').replace("900", "100"), { forceLegacy });
    const host = page.locator("#label"), viewport = host.locator("[data-ae-overflow-marquee-viewport]");
    await expect.poll(() => viewport.evaluate(element =>
      parseFloat(getComputedStyle(element).getPropertyValue("--ae-overflow-marquee-offset")))).toBeGreaterThan(30);
    await host.focus();
    const frozen = await viewport.evaluate(element => getComputedStyle(element).getPropertyValue("--ae-overflow-marquee-offset"));
    for (const value of ["false", "true", null]) {
      await host.evaluate((element, value) => value === null ? element.removeAttribute("data-ae-overflow-marquee-fade") :
        element.setAttribute("data-ae-overflow-marquee-fade", value), value);
      if (value === "false") await expect(viewport).toHaveCSS("mask-image", "none");
      else await expect(viewport).toHaveCSS("mask-image", /linear-gradient/);
      expect(await viewport.evaluate(element => getComputedStyle(element).getPropertyValue("--ae-overflow-marquee-offset"))).toBe(frozen);
    }
    await page.evaluate(() => document.documentElement.setAttribute("data-ae-reduced-motion", "reduced"));
    await expect(host).not.toHaveAttribute("data-ae-overflow-marquee-active");
    await expect(viewport).toHaveCSS("mask-image", /linear-gradient/);
    await expect(viewport).toHaveCSS("--ae-overflow-marquee-offset", "0px");
    await expect(host.locator("[data-ae-overflow-marquee-content]")).toHaveCSS("text-overflow", "ellipsis");
    await host.evaluate(element => element.style.width = "1200px");
    await expect(viewport).toHaveCSS("mask-image", "none");
    await host.evaluate(element => element.style.width = "140px");
    await expect(viewport).toHaveCSS("mask-image", /linear-gradient/);
    await viewport.evaluate(element => element.textContent = "Short");
    await expect(host).toHaveText("Short");
    await expect(viewport).toHaveCSS("mask-image", "none");
    await host.evaluate((element, text) => element.textContent = text, text);
    await expect(viewport).toHaveCSS("mask-image", /linear-gradient/);
    await host.evaluate(element => element.textContent = "Short");
    await expect(viewport).toHaveCSS("mask-image", "none");
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("label"), "overflow-marquee"));
    await expect(host.locator("span")).toHaveCount(0);
    await expect(host).toHaveText("Short");
  });

  test(`small overflow has a proportionate fade and invalid declarations use semantic diagnostics (${forceLegacy})`, async ({ page }) => {
    await start(page, markup('<span style="display:inline-block;width:144px;height:20px;background:black">label</span>')
      .replace("white-space:normal", "white-space:normal;background:white")
      .replace("80ms", "10000ms"), { forceLegacy, environment: "development" });
    const viewport = page.locator("[data-ae-overflow-marquee-viewport]");
    const pixels = await edgePixels(page, viewport);
    expect(pixels.left).toBe(0);
    expect(pixels.right).toBeGreaterThan(30);
    expect(pixels.right).toBeLessThan(90);
    await page.locator("#label").evaluate(element => element.setAttribute("data-ae-overflow-marquee-fade", "invalid"));
    await page.evaluate(() => AelluxJs.mountManager.update(document));
    const diagnostics = await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry =>
      entry.context?.attribute === "data-ae-overflow-marquee-fade").map(entry => entry.code));
    expect(diagnostics).toContain(2026);
    await expect(viewport).toHaveCSS("mask-image", /linear-gradient/);
    expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry => entry.level === 0))).toEqual([]);
  });
}

test("missing property interpolation keeps native marquee motion functional without discrete masks", async ({ page }) => {
  await page.addInitScript(() => { CSS.registerProperty = undefined; });
  await start(page);
  await expect(page.locator("[data-ae-overflow-marquee-viewport]")).toHaveCSS("mask-image", "none");
  await expect.poll(() => page.locator("[data-ae-overflow-marquee-content]").evaluate(element =>
    new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)).toBeLessThan(-30);
});

for (const options of [{}, { forceLegacy: true }, { cssMotionController: false }]) {
  test(`fade and transform share the live clock and FPS limit (${JSON.stringify(options)})`, async ({ page }) => {
    await start(page, markup(text, 'data-ae-maxfps="15"').replace("900", "100"), options);
    const content = page.locator("[data-ae-overflow-marquee-content]");
    await expect.poll(() => content.evaluate(element => element.getAnimations().length)).toBe(1);
    const differences = await content.evaluate(element => new Promise(resolve => {
      const samples = [];
      const sample = () => {
        const x = Math.abs(new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
        const offset = parseFloat(getComputedStyle(element.parentElement).getPropertyValue("--ae-overflow-marquee-offset"));
        samples.push(Math.abs(x - offset));
        if (samples.length === 20) resolve(samples);
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }));
    expect(Math.max(...differences)).toBeLessThan(0.1);
  });
}

for (const forceLegacy of [false, true]) test(`native cycles preserve existing infinite descendant animations (${forceLegacy})`, async ({ page }) => {
  await start(page, '<style>@keyframes child-glow{from{opacity:.8}to{opacity:1}}</style>' +
    markup(`<span id="animated-child" style="animation:child-glow 1s linear infinite">${text}</span>`),
    { forceLegacy, cssMotionController: false });
  const content = page.locator("[data-ae-overflow-marquee-content]");
  await expect.poll(() => content.evaluate(element =>
    element.getAttribute("data-ae-overflow-marquee-content") === "bottom-right:bottom-right" && element.style.transition === "none"),
    { intervals: [20, 40] }).toBe(true);
  await expect(content).toHaveAttribute("data-ae-overflow-marquee-content", "top-left:top-left");
  expect(await page.locator("#animated-child").evaluate(element => element.getAnimations()[0].playState)).toBe("running");
});
