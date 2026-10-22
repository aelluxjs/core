import { expect, test } from "@playwright/test";

async function start(page, html, options = {}) {
  await page.goto("/tests/index.htm");
  await page.evaluate(html => { document.body.innerHTML = html; }, html);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ mode = "full", forceLegacy = false, noResizeObserver = false }) => {
    if (noResizeObserver) window.ResizeObserver = class { observe() {} disconnect() {} };
    if (mode === "basic") {
      AelluxJs.ext("anchor");
      if (document.querySelector("[data-ae-present-group]")) AelluxJs.ext("present", { loadStyle: true });
    }
    AelluxJs.init({ mode, forceLegacy });
  }, options);
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document));
}

const stage = `<style>body{margin:0} #ref{position:relative;width:750px;height:550px}
  .target{position:absolute} #a{left:20px;top:20px;width:80px;height:40px}
  #b{left:300px;top:100px;width:160px;height:70px} #c{left:160px;top:200px;width:110px;height:50px}</style>`;
const targets = `<div id="a" class="target"></div><div id="b" class="target"></div><div id="c" class="target"></div>`;
const indicator = `<div id="indicator" data-ae-anchor="bottom-right:top-right" data-ae-anchor-target="a"
  data-ae-anchor-match="width height" style="--ae-anchor-switch-duration:500ms;--ae-anchor-switch-ease:linear;opacity:1"></div>`;

async function geometry(page, id = "indicator", target = "a") {
  return page.evaluate(({ id, target }) => {
    const element = document.getElementById(id);
    const reference = document.getElementById(target);
    const a = element.getBoundingClientRect(), b = reference.getBoundingClientRect();
    return { width: a.width, height: a.height, right: a.right, top: a.top,
      targetWidth: b.width, targetHeight: b.height, targetRight: b.right, targetBottom: b.bottom,
      x: element.style.getPropertyValue("--ae-anchor-x"),
      publishedWidth: parseFloat(element.style.getPropertyValue("--ae-anchor-target-width")) };
  }, { id, target });
}

async function aligned(page, target) {
  await expect.poll(async () => {
    const g = await geometry(page, "indicator", target);
    return Math.max(Math.abs(g.right - g.targetRight), Math.abs(g.top - g.targetBottom),
      Math.abs(g.width - g.targetWidth), Math.abs(g.height - g.targetHeight));
  }).toBeLessThan(1);
}

for (const forceLegacy of [false, true]) {
  test(`target visibility follows computed CSS overrides on the target and its ancestors (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<style>
      .rendered { display:block!important; visibility:visible!important; opacity:1!important }
      .concealed { display:none!important }
    </style><div id="ref"><div id="panel" data-ae-present="" hidden class="rendered"
      style="display:none;visibility:hidden;opacity:0">
      <div id="a" class="target rendered" data-ae-present="" hidden
        style="display:none;visibility:hidden;opacity:0">Target</div>
    </div>${indicator}</div>`, { forceLegacy });
    await aligned(page, "a");
    await expect(page.locator("#a")).toBeVisible();
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
    for (const id of ["a", "panel"]) {
      await page.locator(`#${id}`).evaluate(element => element.classList.remove("rendered"));
      await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
      await page.locator(`#${id}`).evaluate(element => element.classList.add("rendered"));
      await aligned(page, "a");
      await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
    }
    await page.locator("#panel").evaluate(element => element.classList.add("concealed"));
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
    await page.locator("#panel").evaluate(element => element.classList.remove("concealed"));
    await aligned(page, "a");
    expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 1119))).toEqual([]);
  });

  test(`target can restore inherited visibility but cannot escape ancestor opacity (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<div id="ref"><div id="panel" style="visibility:hidden">
      <div id="a" class="target" style="visibility:visible">Target</div>
    </div>${indicator}</div>`, { forceLegacy });
    await aligned(page, "a");
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
    await page.locator("#a").evaluate(element => { element.style.visibility = ""; });
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
    await page.locator("#a").evaluate(element => { element.style.visibility = "visible"; });
    await aligned(page, "a");
    for (const property of ["opacity", "contentVisibility"]) {
      await page.locator("#panel").evaluate((element, property) => {
        element.style[property] = property === "opacity" ? "0" : "hidden";
      }, property);
      await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
      await page.locator("#panel").evaluate((element, property) => { element.style[property] = ""; }, property);
      await aligned(page, "a");
    }
  });
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`matching geometry, override, invalid tokens and restoration (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<div id="ref" style="transform:scale(1.2);transform-origin:0 0">${targets}
      <div id="indicator" data-ae-anchor="bottom-right:top-right" data-ae-anchor-target="a"
        data-ae-anchor-match="width height" style="--ae-anchor-target-width:9px!important;padding:3px;border:2px solid"></div></div>`, { mode, forceLegacy });
    await aligned(page, "a");
    expect((await geometry(page)).publishedWidth).toBeCloseTo(80, 1);
    await page.locator("#a").evaluate(element => { element.style.width = "130px"; element.style.height = "60px"; element.style.transform = "scale(1.1)"; element.style.transformOrigin = "0 0"; });
    await aligned(page, "a");
    await page.locator("#indicator").evaluate(element => { element.style.width = "50px"; });
    await page.evaluate(() => $ae("indicator").anchor.update());
    await expect.poll(async () => Math.abs((await geometry(page)).right - (await geometry(page)).targetRight)).toBeLessThan(1);
    await expect(page.locator("#indicator")).toHaveCSS("width", "50px");
    await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-match", "width invalid"));
    await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 2022))).toBe(true);
    await page.locator("#indicator").evaluate(element => element.removeAttribute("data-ae-anchor-match"));
    await page.evaluate(() => $ae("indicator").anchor.update());
    expect((await geometry(page)).publishedWidth).toBeGreaterThan(130);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("indicator"), "anchor"));
    expect(await page.locator("#indicator").evaluate(element => [
      element.style.getPropertyValue("--ae-anchor-target-width"),
      element.style.getPropertyPriority("--ae-anchor-target-width"),
      element.style.getPropertyValue("--ae-anchor-target-height"), element.style.width
    ])).toEqual(["9px", "important", "", "50px"]);
  });
}

test("width and height matching remain independent and preserve viewport candidates", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-match", "width"));
  await expect.poll(async () => (await geometry(page)).height).toBe(0);
  expect((await geometry(page)).width).toBe(80);
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-match", "height"));
  await expect.poll(async () => (await geometry(page)).height).toBe(40);
  expect((await geometry(page)).width).toBe(0);
  await page.evaluate(() => {
    const target = document.getElementById("a"), anchor = document.getElementById("indicator");
    Object.assign(target.style, { left: "650px", top: "560px", width: "100px", height: "30px" });
    anchor.setAttribute("data-ae-anchor-match", "width height");
    anchor.setAttribute("data-ae-anchor", "bottom-right:top-left,top-right:bottom-right");
  });
  await page.evaluate(() => $ae("indicator").anchor.update());
  expect(await page.locator("#indicator").evaluate(element => [
    element.style.getPropertyValue("--ae-anchor-origin-x"), element.style.getPropertyValue("--ae-anchor-origin-y")
  ])).toEqual(["100%", "100%"]);
  expect((await geometry(page)).right).toBeCloseTo(750, 0);
  expect((await geometry(page)).top).toBeCloseTo(530, 0);
});

test("known layout motion tracks intermediate dimensions without ResizeObserver and stops when idle", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`, { noResizeObserver: true });
  await aligned(page, "a");
  const result = await page.evaluate(async () => {
    const target = document.getElementById("a"), anchor = document.getElementById("indicator");
    const widths = [];
    const observer = new MutationObserver(() => widths.push(parseFloat(anchor.style.getPropertyValue("--ae-anchor-target-width"))));
    observer.observe(anchor, { attributes: true, attributeFilter: ["style"] });
    target.style.transition = "width 400ms linear,height 400ms linear";
    getComputedStyle(target).width;
    target.style.width = "180px";
    target.style.height = "90px";
    AelluxJs.dispatchFrom(target, "Layout", { bubbles: true, detail: { durationMs: 400 } });
    await new Promise(resolve => setTimeout(resolve, 800));
    const after = widths.length;
    await new Promise(resolve => setTimeout(resolve, 250));
    observer.disconnect();
    return { widths, idleWrites: widths.length - after };
  });
  expect(result.widths.some(width => width > 80 && width < 180)).toBe(true);
  expect(result.idleWrites).toBe(0);
  await aligned(page, "a");
});

test("native switching shares position and size timing, retargets continuously and ignores equivalent targets", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await expect(page.locator("#indicator")).toHaveCSS("transition-duration", "0.5s");
  await expect(page.locator("#indicator")).toHaveCSS("transition-timing-function", "linear");
  await expect.poll(async () => (await geometry(page, "indicator", "b")).width).toBeGreaterThan(85);
  const sample = await geometry(page, "indicator", "b");
  expect(sample.width).toBeLessThan(160);
  const before = await page.locator("#indicator").evaluate(element => ({ x: element.getBoundingClientRect().left, at: performance.now() }));
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "c"));
  await page.evaluate(() => $ae("indicator").anchor.update());
  const after = await page.locator("#indicator").evaluate(element => ({ x: element.getBoundingClientRect().left, at: performance.now() }));
  // Account for real motion while protocol calls and WaitLayout phases run.
  expect(Math.abs(after.x - before.x)).toBeLessThan((after.at - before.at) + 5);
  await aligned(page, "c");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "#c"));
  await page.evaluate(() => $ae("indicator").anchor.update());
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
});

test("scroll and resize interrupt switching for immediate tracking; hidden, removed and reduced targets deactivate safely", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  for (const event of ["scroll", "resize"]) {
    const target = await page.locator("#indicator").evaluate(element => {
      const target = element.getAttribute("data-ae-anchor-target") === "b" ? "a" : "b";
      element.setAttribute("data-ae-anchor-target", target);
      return target;
    });
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
    await page.evaluate(event => window.dispatchEvent(new Event(event)), event);
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
    await aligned(page, target);
  }
  await page.locator("#a").evaluate(element => { element.hidden = true; });
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.locator("#a").evaluate(element => { element.hidden = false; });
  await aligned(page, "a");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await aligned(page, "b");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
  await page.locator("#b").evaluate(element => element.remove());
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
});

const group = `<div id="group" data-ae-present-group data-ae-present-active="a"
  class="view-a">
  <section id="a" class="target" data-ae-present="opacity" data-ae-present-when="view-a">A</section>
  <section id="b" class="target" data-ae-present="opacity" data-ae-present-when="view-b" hidden
    style="--ae-pop-duration:700ms">B</section>
  <section id="c" class="target" data-ae-present="opacity" hidden>C</section></div>`;
const groupIndicator = indicator.replace('data-ae-anchor-target="a"', 'data-ae-anchor-target="group"');

for (const forceLegacy of [false, true]) test(`group-selected target still requires effective visibility (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, `${stage}<style>#a{transition:none!important}#a.transparent{opacity:0!important}</style>
    <div id="ref">${group}${groupIndicator}</div>`, { forceLegacy });
  await aligned(page, "a");
  await page.locator("#a").evaluate(element => element.classList.add("transparent"));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("a");
  await page.locator("#a").evaluate(element => element.classList.remove("transparent"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
  await aligned(page, "a");
});

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`group association, selection event, veto, precedence and remount (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `${stage}<div id="ref">${group}${groupIndicator}</div>`, { mode, forceLegacy });
    await aligned(page, "a");
    expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("a");
    await page.evaluate(() => {
      window.changes = [];
      document.addEventListener("AelluxJsPresentGroupChange", event => window.changes.push({
        previous: event.detail.previous?.id || null, current: event.detail.current?.id || null,
        key: event.detail.key, hidden: event.detail.current?.hidden,
        expanded: event.detail.current?.getAttribute("aria-expanded")
      }));
      window.selection = $ae("group").present.show("b");
    });
    await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
    expect(await page.evaluate(() => window.changes[0])).toEqual({ previous: "a", current: "b", key: "b", hidden: false, expanded: "false" });
    await page.evaluate(() => window.selection);
    await aligned(page, "b");
    await page.evaluate(async () => {
      document.getElementById("c").addEventListener("AelluxJsBeforePop", event => event.preventDefault(), { once: true });
      await $ae("group").present.show("c");
    });
    expect(await page.evaluate(() => window.changes.length)).toBe(1);
    await aligned(page, "b");
    await page.evaluate(() => {
      const group = document.getElementById("group");
      group.className = "view-a";
      group.removeAttribute("data-ae-present-active");
    });
    await aligned(page, "a");
    await page.evaluate(() => $ae("group").present.show(""));
    await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
    await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "a"));
    // Retargeting an ordinary element leaves group selection independent.
    await expect(page.locator("#indicator")).toHaveAttribute("data-ae-anchor-target", "a");
    await page.evaluate(async () => {
      await AelluxJs.unmount(document.getElementById("group"), "present");
      await AelluxJs.mount(document.getElementById("group"), "present");
      document.getElementById("indicator").setAttribute("data-ae-anchor-target", "#group");
    });
    await aligned(page, "a");
  });
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) test(`multiple Anchors follow one group independently (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
  const inside = '<div id="other" data-ae-anchor="bottom-right:top-right" data-ae-anchor-match="width height" data-ae-anchor-target="#group" style="--ae-anchor-switch-duration:0ms"></div>';
  await start(page, `${stage}<div id="ref">${group.replace("</div>", inside + "</div>")}${groupIndicator}</div>`, { mode, forceLegacy });
  await aligned(page, "a");
  await expect.poll(async () => (await geometry(page, "other", "a")).width).toBe(80);
  await page.evaluate(() => $ae("group").present.show("b"));
  await aligned(page, "b");
  await expect.poll(async () => (await geometry(page, "other", "b")).width).toBe(160);
  await expect(page.locator("#other")).not.toHaveClass(/ae--anchor-switching/);
  await page.evaluate(() => $ae("group").present.show(""));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await expect(page.locator("#other")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(() => $ae("group").present.show("b"));
  await aligned(page, "b");
  await expect(page.locator("#other")).toHaveClass(/ae--anchored/);
  await page.locator("#other").evaluate(element => element.setAttribute("data-ae-anchor-target", "a"));
  await expect(page.locator("#other")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(() => $ae("group").present.show("a"));
  await expect(page.locator("#other")).toHaveClass(/ae--anchored/);
  await page.evaluate(() => document.getElementById("a").remove());
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(async () => {
    document.getElementById("group").insertAdjacentHTML("afterbegin", '<section id="a" class="target" data-ae-present="opacity" hidden>A replacement</section>');
    await AelluxJs.mount(document.getElementById("a"));
  });
  await aligned(page, "a");
  await page.locator("#other").evaluate(element => element.setAttribute("data-ae-anchor-target", "#group"));
  await expect.poll(async () => (await geometry(page, "other", "a")).width).toBe(80);
  await page.evaluate(async () => {
    document.getElementById("other").setAttribute("data-ae-anchor-target", "b");
    await AelluxJs.unmount(document.getElementById("other"), "anchor");
  });
  await expect(page.locator("#other")).not.toHaveClass(/ae--anchored|ae--anchor-switching/);
  expect(await page.locator("#other").evaluate(element => element.style.getPropertyValue("--ae-anchor-target-width"))).toBe("");
  await page.evaluate(() => $ae("group").present.show("b"));
  await aligned(page, "b");
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2023 || entry.code === 1119))).toEqual([]);
});

for (const forceLegacy of [false, true]) test(`Anchor retargets groups, selectors, recreated groups and plain elements (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, `${stage}<div id="ref">${group}${groupIndicator}
    <div id="alternate" class="follow" data-ae-present-group data-ae-present-active="d">
      <div id="d" class="target" data-ae-present="" style="left:400px;top:300px;width:60px;height:30px">D</div>
    </div></div>`, { forceLegacy });
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", ".follow"));
  await aligned(page, "d");
  // A change to the old group must not steal the Anchor back.
  await page.evaluate(() => $ae("group").present.show("b"));
  await aligned(page, "d");
  await page.locator("#alternate").evaluate(element => { element.id = "renamed"; });
  await aligned(page, "d");
  await page.locator("#renamed").evaluate(element => element.classList.remove("follow"));
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.locator("#renamed").evaluate(element => element.classList.add("follow"));
  await aligned(page, "d");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "group"));
  await aligned(page, "b");
  await page.locator("#group").evaluate(element => element.removeAttribute("data-ae-present-group"));
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchored/);
  await expect.poll(async () => (await geometry(page, "indicator", "group")).width).toBe(750);
  await page.locator("#group").evaluate(element => element.setAttribute("data-ae-present-group", ""));
  await aligned(page, "b");
  await page.evaluate(() => document.getElementById("group").remove());
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  await page.evaluate(async markup => {
    document.getElementById("ref").insertAdjacentHTML("afterbegin", markup);
    await AelluxJs.mount(document.getElementById("group"));
  }, group);
  await aligned(page, "a");
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "d"));
  await aligned(page, "d");
});

test("circular associations and incompatible positioning contexts are diagnosed", async ({ page }) => {
  await start(page, `${stage}<div id="ref"><div id="group" data-ae-present-group data-ae-present-active="self">
    <div id="self" data-ae-present data-ae-anchor="top-left:top-left" data-ae-anchor-target="group"></div></div>
    <div style="position:relative"><div id="nested" style="width:30px;height:30px"></div></div>
    <div id="indicator" data-ae-anchor="top-left:top-left" data-ae-anchor-target="nested"></div></div>`);
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 2023))).toBe(true);
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 1119))).toBe(true);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
});

test("Anchor loaded after Present reads the accepted selection without replaying group changes", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(html => { document.body.innerHTML = html; }, `${stage}<div id="ref">${group}${groupIndicator}</div>`);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => { AelluxJs.ext("present", { loadStyle: true }); AelluxJs.init({ mode: "basic" }); });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.present?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "present"));
  await page.evaluate(async () => {
    await $ae("group").present.show("b");
    AelluxJs.ext("anchor");
    await AelluxJs.mount(document, "anchor");
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "anchor"));
  await aligned(page, "b");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
});

test("zero duration, CSS steps easing and unmount during a switch leave no delayed writes", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${targets}${indicator}</div>`);
  await aligned(page, "a");
  await page.evaluate(() => {
    const element = document.getElementById("indicator");
    element.style.setProperty("--ae-anchor-switch-duration", "0ms");
    element.setAttribute("data-ae-anchor-target", "b");
  });
  await aligned(page, "b");
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
  await page.evaluate(() => {
    const element = document.getElementById("indicator");
    element.style.setProperty("--ae-anchor-switch-duration", "600ms");
    element.style.setProperty("--ae-anchor-switch-ease", "steps(4,end)");
    element.setAttribute("data-ae-anchor-target", "a");
  });
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await expect(page.locator("#indicator")).toHaveCSS("transition-timing-function", "steps(4)");
  const snapshot = await page.evaluate(async () => {
    const element = document.getElementById("indicator");
    await AelluxJs.unmount(element, "anchor");
    return element.getAttribute("style");
  });
  await page.waitForTimeout(800);
  expect(await page.locator("#indicator").getAttribute("style")).toBe(snapshot);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored|ae--anchor-switching/);
  await page.evaluate(() => AelluxJs.mount(document.getElementById("indicator"), "anchor"));
  await aligned(page, "a");
  await expect(page.locator("[data-ae-anchor-style]")).toHaveCount(1);
  await page.evaluate(() => AelluxJs.destroy());
  await expect(page.locator("[data-ae-anchor-style]")).toHaveCount(0);
});

test("matching rejects an in-flow Anchor before a containing layout can feed back", async ({ page }) => {
  await start(page, `<style>#indicator{position:relative}</style>
    <div id="ref" style="position:relative;display:inline-block">
      <div id="indicator" data-ae-anchor="bottom-right:bottom-right" data-ae-anchor-match="width height">Content</div></div>`);
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 2023))).toBe(true);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchored/);
  expect(await page.locator("#indicator").evaluate(element => element.style.getPropertyValue("--ae-anchor-target-width"))).toBe("");
});

test("group switches under a low FPS ceiling follow the last selection and track its measured Pop", async ({ page }) => {
  await start(page, `${stage}<div id="ref">${group}${groupIndicator}</div>`);
  await aligned(page, "a");
  await page.evaluate(() => {
    const anchor = document.getElementById("indicator"), member = document.getElementById("b");
    anchor.setAttribute("data-ae-maxfps", "10");
    member.setAttribute("data-ae-present", "width height");
  });
  // Remount the member to select Present's measured sizing strategy.
  await page.evaluate(async () => {
    const member = document.getElementById("b");
    await AelluxJs.unmount(member, "present");
    member.setAttribute("data-ae-present", "width height");
    await AelluxJs.mount(member, "present");
    const controller = $ae("group").present;
    window.latest = controller.show("b");
    controller.show("c");
    window.latest = controller.show("b");
  });
  await page.evaluate(() => window.latest);
  await aligned(page, "b");
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("b");
  await expect(page.locator("#indicator")).toHaveAttribute("data-ae-anchor-target", "group");
});
