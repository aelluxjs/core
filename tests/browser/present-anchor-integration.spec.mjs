import { expect, test } from "@playwright/test";

const fixture = `<style>
  body{margin:0} #ref{position:relative;width:740px;height:480px;overflow:auto}
  .panel{position:absolute;width:90px;height:50px;--ae-pop-duration:400ms;--ae-unpop-duration:400ms}
  #a{left:30px;top:50px} #b{left:280px;top:140px;width:150px;height:80px}
  #c{left:500px;top:260px;width:110px;height:60px}
  </style><button id="trigger" data-ae-trigger="pop" data-ae-trigger-on="hover" data-ae-target="b">Open B</button>
  <div id="ref"><div id="group" data-ae-present-group data-ae-present-active="a">
  <div id="a" class="panel" data-ae-present="opacity">A</div>
  <div id="b" class="panel" data-ae-present="opacity" hidden><button id="inside">B</button></div>
  <div id="c" class="panel" data-ae-present="opacity" hidden>C</div></div>
  <div id="indicator" data-ae-anchor="bottom-right:top-right" data-ae-anchor-match="width height"
  style="--ae-anchor-switch-duration:350ms;--ae-anchor-switch-ease:linear"></div></div>`;

const groupFixture = fixture.replace('id="indicator"', 'id="indicator" data-ae-anchor-target="group"');

async function start(page, options = {}, html = fixture) {
  const { minified = false, ...runtimeOptions } = options;
  await page.goto("/tests/index.htm");
  await page.evaluate(html => { document.body.innerHTML = html; }, html);
  await page.addScriptTag({ url: minified ? "/dist/aellux.min.js" : "/dist/aellux.js" });
  await page.evaluate(options => {
    if (options.mode === "basic") {
      AelluxJs.ext("present", { loadStyle: true });
      AelluxJs.ext("anchor");
    }
    AelluxJs.init({ mode: "full", ...options });
  }, runtimeOptions);
  await expect.poll(() => page.evaluate(() =>
    (!document.querySelector("[data-ae-present-group]") || !!AelluxJs.ext.present?.initialized) && !!AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document));
}

for (const forceLegacy of [false, true]) for (const cssMotionController of [true, false]) for (const grid of [true, false]) {
  test(`Anchor owns transform during Present pop/unpop (legacy=${forceLegacy}, controlled=${cssMotionController}, grid=${grid})`, async ({ page }) => {
    await start(page, { forceLegacy, cssMotionController }, `<style>
      #ref{position:relative;margin:80px;width:500px;height:300px}
      #trigger{position:relative;width:150px;height:40px}
      #menu{position:absolute;--ae-pop-duration:250ms;--ae-unpop-duration:250ms;
        --ae-from-transform:translateX(200px) scale(.3);--ae-pop-transform:scale(2);--ae-unpop-transform:translateY(100px)}
      #content{height:60px}
      </style><div id="ref"><button id="trigger">Versions</button>
      <div id="menu" data-ae-anchor="bottom-right:top-right" data-ae-anchor-target="trigger"
        data-ae-anchor-match="width" data-ae-present="opacity transform height" hidden>
        <div id="content" ${grid ? "data-ae-present-motion" : ""}>0.1.0</div>
      </div></div>`);
    await page.evaluate(async () => {
      const menu = document.getElementById("menu");
      window.anchorMotionStates = [];
      for (const event of ["AelluxJsPopping", "AelluxJsUnpopping"]) menu.addEventListener(event, () => {
        window.anchorMotionStates.push({ event, properties: getComputedStyle(menu).transitionProperty });
      });
      await $ae("menu").present.pop();
    });
    const alignment = () => page.evaluate(() => {
      const menu = document.getElementById("menu"), rect = menu.getBoundingClientRect();
      const trigger = document.getElementById("trigger").getBoundingClientRect();
      return { right: Math.abs(rect.right - trigger.right), top: Math.abs(rect.top - trigger.bottom),
        width: Math.abs(rect.width - trigger.width), opacity: getComputedStyle(menu).opacity };
    });
    await expect.poll(alignment).toEqual({ right: 0, top: 0, width: 0, opacity: "1" });
    await page.evaluate(async () => {
      document.getElementById("trigger").style.left = "70px";
      document.getElementById("trigger").style.top = "40px";
      await AelluxJs.mountManager.update("menu", "anchor");
    });
    await expect.poll(alignment).toEqual({ right: 0, top: 0, width: 0, opacity: "1" });
    await page.evaluate(() => $ae("menu").present.unpop());
    await expect(page.locator("#menu")).toHaveJSProperty("hidden", true);
    const states = await page.evaluate(() => window.anchorMotionStates);
    expect(states).toHaveLength(2);
    for (const { properties } of states) {
      expect(properties.split(",").map(value => value.trim())).not.toContain("transform");
      expect(properties).toContain("opacity");
    }
    expect(await page.locator("#menu").getAttribute("data-ae-present")).toBe("opacity transform height");
  });
}

for (const forceLegacy of [false, true]) {
  test(`minified Basic loads independent extensions with final SRI (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, { mode: "basic", minified: true, forceLegacy }, groupFixture);
    await aligned(page, "a");
    expect(await page.evaluate(() => $ae("group").present.show("b"))).toBe(true);
    await aligned(page, "b");
    const files = await page.locator('script[data-ae-ext]').evaluateAll(scripts => scripts.map(s => ({ src: s.src, integrity: s.integrity })));
    // Loading with SRI enabled also exercises the browser's hash check.
    const independent = files.filter(file => /aellux\.ext\.(present|anchor)\./.test(file.src));
    expect(independent).toHaveLength(2);
    expect(independent.every(file => file.src.endsWith(forceLegacy ? ".legacy.min.js" : ".min.js") && file.integrity.startsWith("sha384-"))).toBe(true);
  });
}

async function aligned(page, id) {
  await expect.poll(() => page.evaluate(id => {
    const a = document.getElementById("indicator").getBoundingClientRect();
    const b = document.getElementById(id).getBoundingClientRect();
    return Math.max(Math.abs(a.right - b.right), Math.abs(a.top - b.bottom),
      Math.abs(a.width - b.width), Math.abs(a.height - b.height));
  }, id)).toBeLessThan(1);
}

for (const mutation of ["attribute", "remove", "id"]) {
  test(`BeforePop ${mutation} invalidates the preflight without publishing a stale selection`, async ({ page }) => {
    await start(page);
    const result = await page.evaluate(async mutation => {
      const group = document.getElementById("group"), b = document.getElementById("b");
      const changes = [];
      group.addEventListener("AelluxJsPresentGroupChange", e => changes.push(e.detail.current?.id));
      b.addEventListener("AelluxJsBeforePop", () => {
        if (mutation === "attribute") group.setAttribute("data-ae-present-active", "c");
        if (mutation === "remove") b.remove();
        if (mutation === "id") b.id = "changed";
      }, { once: true });
      const accepted = await $ae("group").present.show("b");
      return { accepted, changes };
    }, mutation);
    expect(result.accepted).toBe(false);
    expect(result.changes).not.toContain("b");
    if (mutation === "attribute") await expect.poll(() => page.evaluate(() => $ae("group").present.selected()?.id)).toBe("c");
    else await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
  });
}

for (const failure of ["throws", "incompatible", "duplicate"]) {
  test(`progress registration ${failure} keeps bounded, numeric progress and visual completion`, async ({ page }) => {
    await page.addInitScript(failure => {
      if (failure === "throws") CSS.registerProperty = () => { throw new Error("Registration rejected"); };
      else for (const name of ["--ae-present-pop-phase", "--ae-present-unpop-phase"])
        CSS.registerProperty({ name, syntax: failure === "incompatible" ? "<length>" : "<number>", inherits: true,
          initialValue: failure === "incompatible" ? "0px" : "0" });
    }, failure);
    await start(page);
    const result = await page.evaluate(async () => {
      const b = document.getElementById("b"), samples = [];
      let sampling = true;
      const read = () => {
        samples.push(getComputedStyle(b).getPropertyValue("--ae-pop-progress").trim());
        if (sampling) requestAnimationFrame(read);
      };
      requestAnimationFrame(read);
      await $ae("group").present.show("b");
      sampling = false;
      return { samples, final: getComputedStyle(b).getPropertyValue("--ae-pop-progress").trim() };
    });
    expect(result.samples.length).toBeGreaterThan(0);
    expect(result.samples.every(value => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1)).toBe(true);
    expect(result.final).toBe("1");
  });
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) for (const cssMotionController of [false, true]) {
  test(`integrated interruption, logical target, geometry and teardown (${mode}, legacy=${forceLegacy}, motion=${cssMotionController})`, async ({ page }) => {
    await start(page, { mode, forceLegacy, cssMotionController }, groupFixture);
    await aligned(page, "a");
    const results = await page.evaluate(() => {
      const c = $ae("group").present;
      return Promise.all([c.show("b"), c.show("c"), c.show("a")]);
    });
    expect(results).toEqual([false, false, true]);
    await aligned(page, "a");
    const intermediate = await page.evaluate(async () => {
      const anchor = document.getElementById("indicator");
      window.pending = $ae("group").present.show("b");
      const selected = $ae("group").present.selected()?.id;
      // Sample in-page: two separate protocol reads can straddle completion.
      const width = await new Promise(resolve => {
        const sample = () => {
          const value = anchor.getBoundingClientRect().width;
          if (value > 91) resolve(value);
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      return { selected, width };
    });
    expect(intermediate.selected).toBe("b");
    expect(intermediate.width).toBeGreaterThan(91);
    expect(intermediate.width).toBeLessThan(150);
    await page.setViewportSize({ width: 850, height: 650 });
    await page.evaluate(() => window.pending);
    await aligned(page, "b");
    await page.locator("#inside").focus();
    await page.mouse.move(800, 600);
    await page.waitForTimeout(180);
    await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
    await page.locator("#trigger").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Tab");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => $ae("group").present.show("c"));
    await aligned(page, "c");
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
    const result = await page.evaluate(async () => {
      const group = document.getElementById("group"), anchor = document.getElementById("indicator");
      const pending = $ae("group").present.show("a");
      await AelluxJs.unmount(group, "present");
      await AelluxJs.unmount(anchor, "anchor");
      const accepted = await pending;
      await AelluxJs.mount(group, "present");
      await AelluxJs.mount(anchor, "anchor");
      await $ae("group").present.show("b");
      await AelluxJs.destroy();
      return { accepted, classes: document.querySelectorAll(".ae--popping,.ae--unpopping,.ae--will-change,.ae--anchor-switching,.ae--anchored").length,
        paused: document.getAnimations().filter(a => a.playState === "paused").length,
        warnings: AelluxJs.diagnostics.showHistory().filter(e => e.level <= AelluxJs.diagnostics.levels.warn).map(e => e.code) };
    });
    expect(result).toEqual({ accepted: false, classes: 0, paused: 0, warnings: [] });
  });
}

test("Anchor placement preserves application inline styles while mounted and on unmount", async ({ page }) => {
  await start(page, {}, fixture.replace('--ae-anchor-switch-duration:350ms;', 'left:17px!important;top:19px;transform:translateX(7px)!important;--ae-anchor-switch-duration:350ms;'));
  const read = () => page.locator("#indicator").evaluate(e => [e.style.left, e.style.getPropertyPriority("left"), e.style.top, e.style.transform, e.style.getPropertyPriority("transform")]);
  expect(await read()).toEqual(["17px", "important", "19px", "translateX(7px)", "important"]);
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("indicator"), "anchor"));
  expect(await read()).toEqual(["17px", "important", "19px", "translateX(7px)", "important"]);
});

test("unrelated DOM mutations do not rescan groups or measure every Anchor", async ({ page }, testInfo) => {
  const measurements = [];
  await page.addInitScript(() => {
    const Native = MutationObserver;
    window.mutationAudit = { enabled: false, calls: 0, processingMs: 0 };
    window.MutationObserver = class extends Native {
      constructor(callback) {
        const owned = /\/dist\/aellux/.test(new Error().stack);
        super((records, observer) => {
          const audit = window.mutationAudit;
          if (!owned || !audit.enabled) return callback(records, observer);
          const start = performance.now();
          try { return callback(records, observer); }
          finally { audit.calls++; audit.processingMs += performance.now() - start; }
        });
      }
    };
  });
  for (const count of [1, 10, 40]) {
    await start(page, {}, `<div id="unrelated"></div><div style="position:relative;width:800px;height:500px">
      ${Array.from({ length: count }, (_, i) => `<div id="group${i}" data-ae-present-group data-ae-present-active="target${i}">
        <div id="target${i}" data-ae-present style="position:absolute;width:30px;height:20px"></div></div>
        <div id="anchor${i}" data-ae-anchor="bottom-left:top-left" data-ae-anchor-target="group${i}"></div>`).join("")}</div>`);
    await expect(page.locator(".ae--anchored")).toHaveCount(count);
    await page.waitForTimeout(300);
    measurements.push(await page.evaluate(async count => {
      let reads = 0, writes = 0, scans = 0, scheduledFrames = 0;
      const rect = Element.prototype.getBoundingClientRect;
      const set = CSSStyleDeclaration.prototype.setProperty;
      const query = document.querySelectorAll;
      const frame = window.requestAnimationFrame;
      Element.prototype.getBoundingClientRect = function (...args) { reads++; return rect.apply(this, args); };
      CSSStyleDeclaration.prototype.setProperty = function (...args) { writes++; return set.apply(this, args); };
      document.querySelectorAll = function (selector) { if (selector.includes("present-group")) scans++; return query.call(this, selector); };
      window.requestAnimationFrame = function (...args) { scheduledFrames++; return frame.apply(this, args); };
      window.mutationAudit.enabled = true;
      const begin = performance.now();
      const unrelated = document.getElementById("unrelated");
      for (let i = 0; i < 50; i++) {
        unrelated.hidden = !unrelated.hidden;
        unrelated.id = `unrelated${i}`;
        unrelated.appendChild(document.createElement("span"));
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      const result = { count, reads, writes, scans, scheduledFrames, observationMs: performance.now() - begin,
        callbacks: window.mutationAudit.calls, processingMs: window.mutationAudit.processingMs };
      await new Promise(resolve => setTimeout(resolve, 200));
      result.idleReads = reads - result.reads;
      result.idleWrites = writes - result.writes;
      window.mutationAudit.enabled = false;
      Element.prototype.getBoundingClientRect = rect;
      CSSStyleDeclaration.prototype.setProperty = set;
      document.querySelectorAll = query;
      window.requestAnimationFrame = frame;
      return result;
    }, count));
  }
  await testInfo.attach("mutation-cost", { body: JSON.stringify(measurements, null, 2), contentType: "application/json" });
  console.log("Anchor mutation cost:", JSON.stringify(measurements));
  for (const result of measurements) {
    expect(result.callbacks).toBeGreaterThan(0);
    expect(result).toMatchObject({ reads: 0, writes: 0, scans: 0, scheduledFrames: 0, idleReads: 0, idleWrites: 0 });
  }
});

test("member replacement during Pop, veto, clearing and scrolling follow the logical selection", async ({ page }) => {
  await start(page, {}, groupFixture);
  await aligned(page, "a");
  await page.evaluate(() => {
    const ref = document.getElementById("ref");
    ref.style.height = "200px";
    ref.insertAdjacentHTML("beforeend", '<div style="height:900px;pointer-events:none"></div>');
    window.pending = $ae("group").present.show("b");
  });
  const result = await page.evaluate(async () => {
    const old = document.getElementById("b"), replacement = old.cloneNode(true);
    old.replaceWith(replacement);
    replacement.hidden = true;
    await AelluxJs.mount(replacement, "present");
    return { obsolete: await window.pending, latest: await $ae("group").present.show("b") };
  });
  expect(result).toEqual({ obsolete: false, latest: true });
  await page.evaluate(() => { document.getElementById("ref").scrollTop = 80; });
  await aligned(page, "b");
  expect(await page.evaluate(() => {
    document.getElementById("c").addEventListener("AelluxJsBeforePop", e => e.preventDefault(), { once: true });
    return $ae("group").present.show("c");
  })).toBe(false);
  await aligned(page, "b");
  await page.evaluate(() => $ae("group").present.show(""));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(() => $ae("group").present.show("a"));
  await aligned(page, "a");
});

test("Anchor initialized before Present recovers when the group mounts", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(html => { document.body.innerHTML = html; }, groupFixture);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => { AelluxJs.ext("anchor"); AelluxJs.init({ mode: "basic" }); });
  await expect.poll(() => page.evaluate(() => !!AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "anchor"));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(async () => {
    AelluxJs.ext("present", { loadStyle: true });
    await AelluxJs.mount(document, "present");
  });
  await expect.poll(() => page.evaluate(() => !!AelluxJs.ext.present?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "present"));
  await aligned(page, "a");
});

test("destroy during combined motion disconnects observers and leaves no delayed writes", async ({ page }) => {
  await page.addInitScript(() => {
    window.liveObservers = {};
    for (const name of ["MutationObserver", "ResizeObserver", "IntersectionObserver"]) {
      const Native = window[name], live = new Set();
      window.liveObservers[name] = live;
      window[name] = class extends Native {
        constructor(...args) { super(...args); this.auditStack = new Error().stack; }
        observe(...args) {
          // Playwright installs its own observer in the page as well.
          if (/\/(?:dist|src)\/aellux/.test(this.auditStack)) live.add(this);
          return super.observe(...args);
        }
        disconnect() { live.delete(this); return super.disconnect(); }
      };
    }
  });
  await start(page, {}, groupFixture);
  await aligned(page, "a");
  expect(await page.evaluate(() => Object.values(window.liveObservers).every(live => live.size > 0))).toBe(true);
  await page.locator("#trigger").hover();
  await page.mouse.move(900, 650);
  const snapshot = await page.evaluate(async () => {
    window.pending = $ae("group").present.show("c");
    await AelluxJs.destroy();
    return { result: await window.pending, html: document.body.innerHTML,
      observers: Object.fromEntries(Object.entries(window.liveObservers).map(([name, live]) => [name, live.size])) };
  });
  expect(snapshot.result).toBe(false);
  expect(snapshot.observers).toEqual({ MutationObserver: 0, ResizeObserver: 0, IntersectionObserver: 0 });
  await page.waitForTimeout(700);
  expect(await page.locator("body").innerHTML()).toBe(snapshot.html);
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === "paused").length)).toBe(0);
});

for (const boxSizing of ["border-box", "content-box"]) {
  test(`constraints, padding and border use the effective matching box (${boxSizing})`, async ({ page }) => {
    await start(page, {}, fixture.replace('</style>', `#indicator{box-sizing:${boxSizing};padding:7px;border:3px solid;
      min-width:100px;max-width:120px;min-height:60px;max-height:75px}</style>`)
      .replace('data-ae-anchor-match="width height"', 'data-ae-anchor-target="a" data-ae-anchor-match="width height"'));
    const measure = () => page.evaluate(() => {
      const anchor = document.getElementById("indicator").getBoundingClientRect(), target = document.getElementById("a").getBoundingClientRect();
      return { error: Math.max(Math.abs(anchor.right - target.right), Math.abs(anchor.top - target.bottom)),
        width: anchor.width, height: anchor.height };
    });
    const extra = boxSizing === "content-box" ? 20 : 0;
    await expect.poll(measure).toEqual({ error: 0, width: 100 + extra, height: 60 + extra });
    await page.locator("#a").evaluate(element => { element.style.width = "240px"; element.style.height = "140px"; });
    await page.evaluate(() => $ae("indicator").anchor.update());
    await expect.poll(measure).toEqual({ error: 0, width: 120 + extra, height: 75 + extra });
  });
}

test("class and style visibility changes reactivate the resolved target without polling", async ({ page }) => {
  await start(page, {}, `<style>#ref{position:relative;width:500px;height:300px}.target{position:absolute;width:90px;height:50px;opacity:0}.ready{opacity:1}</style>
    <div id="ref"><div id="a" class="target"></div><div id="indicator" data-ae-anchor="bottom-right:top-right"
    data-ae-anchor-target="a" data-ae-anchor-match="width height"></div></div>`);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.locator("#a").evaluate(e => e.classList.add("ready"));
  await aligned(page, "a");
  await page.locator("#a").evaluate(e => e.classList.remove("ready"));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.locator("#a").evaluate(e => { e.style.opacity = "1"; });
  await aligned(page, "a");
});

test("external-only CSP blocks both owned style blocks; lifecycle remains idempotent", async ({ page }) => {
  await page.addInitScript(() => {
    window.styleViolations = [];
    document.addEventListener("securitypolicyviolation", event => {
      if (event.effectiveDirective.startsWith("style-src")) window.styleViolations.push(event.blockedURI);
    });
  });
  await page.route("**/tests/csp-audit.htm", route => route.fulfill({
    contentType: "text/html", headers: { "Content-Security-Policy": "script-src 'self'; style-src 'self'" },
    body: '<!doctype html><div style="position:relative"><div id="indicator" data-ae-anchor="bottom-left:top-left" data-ae-anchor-match="width"></div></div><script src="/dist/aellux.js"></script>'
  }));
  await page.goto("/tests/csp-audit.htm");
  await page.evaluate(() => { AelluxJs.ext("anchor"); AelluxJs.init({ mode: "basic" }); });
  await expect.poll(() => page.evaluate(() => !!AelluxJs.ext.anchor?.initialized)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.styleViolations.filter(uri => uri === "inline").length)).toBeGreaterThanOrEqual(2);
  expect(await page.locator("[data-ae-anchor-style]").evaluate(style => style.sheet === null)).toBe(true);
  await page.evaluate(async () => {
    await AelluxJs.mount(document, "anchor");
    await AelluxJs.unmount(document.getElementById("indicator"), "anchor");
    await AelluxJs.mount(document, "anchor");
  });
  await expect(page.locator("[data-ae-anchor-style]")).toHaveCount(1);
  await page.evaluate(() => AelluxJs.destroy());
  await expect(page.locator("[data-ae-anchor-style]")).toHaveCount(0);
});
