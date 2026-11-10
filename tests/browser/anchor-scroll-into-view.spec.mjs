import { expect, test } from "@playwright/test";
import { installAnchorProbe } from "./anchor-probe.mjs";

async function start(page, { mode = "basic", forceLegacy = false, hidden = false, duration = 0, group = false } = {}) {
  await page.goto("/tests/index.htm");
  await page.evaluate(({ hidden, duration, group }) => {
    document.body.innerHTML = `<style>
      body { margin:0 } #scroller { position:relative; width:300px; height:180px; overflow:auto }
      #space { width:1400px; height:900px } .target { position:absolute; width:40px; height:30px }
      #a { left:600px; top:400px } #b { left:1000px; top:700px } #c { left:800px; top:500px }
      .invisible { visibility:hidden }
    </style><div id="scroller" ${hidden ? 'style="opacity:0"' : ""}><div id="space"></div>
      ${group ? '<div id="group" data-ae-present-group data-ae-present-active="a">' : ""}
      <div id="a" class="target" ${group ? 'data-ae-present="opacity"' : ""}></div>
      <div id="b" class="target" ${group ? 'data-ae-present="opacity" hidden' : ""}></div>
      <div id="c" class="target" ${group ? 'data-ae-present="opacity" hidden' : ""}></div>
      ${group ? "</div>" : ""}
      <div id="indicator" data-ae-anchor="top-left:top-left" data-ae-anchor-target="${group ? "group" : "a"}"
        data-ae-anchor-match="width height" data-ae-anchor-scroll-into-view="center center"
        style="--ae-anchor-switch-duration:${duration}ms;--ae-anchor-switch-ease:linear"></div></div>`;
    window.scrollCalls = [];
    const native = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      scrollCalls.push({ id: this.id, options, left: this.getBoundingClientRect().left,
        top: this.getBoundingClientRect().top,
        switching: document.getElementById("indicator").classList.contains("ae--anchor-switching"),
        anchorX: document.getElementById("indicator").style.getPropertyValue("--ae-anchor-x") });
      return native.call(this, options);
    };
  }, { hidden, duration, group });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ mode, forceLegacy }) => {
    if (mode === "basic") {
      aelluxJs.ext("anchor", { loadStyle: true });
      if (document.getElementById("group")) aelluxJs.ext("present", { loadStyle: true });
    }
    aelluxJs.init({ mode, forceLegacy });
  }, { mode, forceLegacy });
  await expect.poll(() => page.evaluate(() => !!aelluxJs.ext.anchor?.initialized)).toBe(true);
  await page.evaluate(() => aelluxJs.mount(document));
  await installAnchorProbe(page);
}

const calls = page => page.evaluate(() => scrollCalls);
async function count(page, value) { await expect.poll(async () => (await calls(page)).length).toBe(value); }
async function centered(page) {
  await expect.poll(() => page.evaluate(() => {
    const anchor = document.getElementById("indicator").getBoundingClientRect();
    const scroller = document.getElementById("scroller");
    const rect = scroller.getBoundingClientRect();
    return Math.max(Math.abs(anchor.left + anchor.width / 2 - rect.left - scroller.clientWidth / 2),
      Math.abs(anchor.top + anchor.height / 2 - rect.top - scroller.clientHeight / 2));
  })).toBeLessThan(2);
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`Anchor scrolls its target once per change without a completion scroll (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, { mode, forceLegacy });
    await count(page, 1);
    await centered(page);
    expect((await calls(page))[0]).toMatchObject({ id: "a",
      options: { block: "center", inline: "center", behavior: "smooth" } });
    await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
    await count(page, 2);
    expect((await calls(page))[1]).toMatchObject({ id: "b", switching: false, anchorX: "1000px" });
    await centered(page);
    await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "#b"));
    await page.evaluate(async () => {
      document.getElementById("scroller").scrollTo(0, 0);
      window.dispatchEvent(new Event("resize"));
      await aelluxJs.mountManager.update(document.getElementById("indicator"), "anchor");
    });
    await page.waitForTimeout(250);
    expect((await calls(page)).length).toBe(2);
  });

  test(`Anchor waits for visibility and scrolls once per reappearance (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, { mode, forceLegacy, hidden: true });
    expect(await calls(page)).toEqual([]);
    await page.locator("#scroller").evaluate(element => { element.style.opacity = "1"; });
    await count(page, 1);
    await centered(page);
    for (const id of ["a", "indicator", "scroller"]) {
      await page.locator(`#${id}`).evaluate(element => element.classList.add("invisible"));
      await page.evaluate(() => aelluxJs.mountManager.update(document.getElementById("indicator"), "anchor"));
      const previous = (await calls(page)).length;
      await page.locator(`#${id}`).evaluate(element => element.classList.remove("invisible"));
      await count(page, previous + 1);
    }
  });
}


test("rapid automatic scroll requests create one timeline per genuine target and no completion scroll", async ({ page }) => {
  await start(page, { duration: 500 });
  await centered(page);
  await page.evaluate(async () => {
    const anchor = document.getElementById("indicator");
    for (const [index, id] of ["b", "c", "a"].entries()) {
      anchor.setAttribute("data-ae-anchor-target", id);
      await waitAnchor(() => switchProbe.operations.length === index + 1);
      const operation = switchProbe.operations.at(-1);
      await waitAnchor(() => performance.now() - operation.at >= 100);
      if (!anchor.classList.contains("ae--anchor-switching")) throw new Error("Automatic scroll ended switching early");
    }
  });
  await centered(page);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
  expect((await calls(page)).map(call => call.id)).toEqual(["a", "b", "c", "a"]);
  expect((await calls(page)).slice(1).every(call => call.switching)).toBe(true);
  expect(await page.evaluate(() => switchProbe.operations.length)).toBe(3);
  await page.locator("#indicator").evaluate(element => element.setAttribute("data-ae-anchor-target", "b"));
  await count(page, 5);
  const styles = await page.evaluate(async () => {
    const anchor = document.getElementById("indicator");
    await aelluxJs.unmount(anchor, "anchor");
    return anchor.getAttribute("style");
  });
  await page.waitForTimeout(600);
  expect(await page.locator("#indicator").getAttribute("style")).toBe(styles);
  expect((await calls(page)).map(call => call.id)).toEqual(["a", "b", "c", "a", "b"]);
});

for (const forceLegacy of [false, true]) test(`automatic scroll preserves switching until its original deadline (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, { duration: 500, forceLegacy });
  await centered(page);
  const result = await page.evaluate(async () => {
    const anchor = document.getElementById("indicator"), scroller = document.getElementById("scroller");
    const initial = scroller.scrollLeft;
    anchor.setAttribute("data-ae-anchor-target", "b");
    await waitAnchor(() => switchProbe.operations.length === 1);
    const operation = switchProbe.operations[0];
    const frame = await waitAnchorFrame(operation, 220);
    await waitAnchor(() => scroller.scrollLeft !== initial);
    const middle = { switching: frame.switching, x: frame.x, elapsed: frame.at - operation.at };
    await waitAnchor(() => !anchor.classList.contains("ae--anchor-switching"));
    return { middle, duration: performance.now() - operation.at, count: switchProbe.operations.length };
  });
  expect(result.middle.switching).toBe(true);
  expect(result.middle.x).toBeGreaterThan(600);
  expect(result.middle.x).toBeLessThan(1000);
  expect(Math.abs(result.middle.x - (600 + 400 * result.middle.elapsed / 500))).toBeLessThan(3);
  expect(result.count).toBe(1);
  expect(result.duration).toBeGreaterThanOrEqual(470);
  expect(result.duration).toBeLessThan(850);
  await centered(page);
  await page.waitForTimeout(600);
  expect((await calls(page)).map(call => call.id)).toEqual(["a", "b"]);
});

test("a scrollIntoView request without displacement keeps the normal target transition", async ({ page }) => {
  await start(page, { duration: 500 });
  await centered(page);
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    // All targets are now visible; native nearest alignment needs no scroll.
    document.getElementById("b").style.cssText = "left:650px;top:410px";
    document.getElementById("indicator").setAttribute("data-ae-anchor-scroll-into-view", "nearest nearest");
    document.getElementById("indicator").setAttribute("data-ae-anchor-target", "b");
  });
  await expect(page.locator("#indicator")).toHaveClass(/ae--anchor-switching/);
  await count(page, 2);
  await expect(page.locator("#indicator")).not.toHaveClass(/ae--anchor-switching/);
});

test("a retarget during placement scrolls each accepted target once", async ({ page }) => {
  await start(page);
  await count(page, 1);
  await centered(page);
  await page.evaluate(() => {
    const anchor = document.getElementById("indicator");
    const observer = new MutationObserver(() => {
      if (anchor.style.getPropertyValue("--ae-anchor-x") !== "1000px") return;
      observer.disconnect();
      anchor.setAttribute("data-ae-anchor-target", "c");
    });
    observer.observe(anchor, { attributes: true, attributeFilter: ["style"] });
    anchor.setAttribute("data-ae-anchor-target", "b");
  });
  await expect(page.locator("#indicator")).toHaveAttribute("data-ae-anchor-target", "c");
  await count(page, 3);
  await centered(page);
  await page.waitForTimeout(200);
  expect((await calls(page)).map(call => call.id)).toEqual(["a", "b", "c"]);
});

test("alignment changes, invalid or absent options and reduced motion use the current configuration", async ({ page }) => {
  await start(page);
  await count(page, 1);
  await page.evaluate(async () => {
    const anchor = document.getElementById("indicator");
    for (const value of [null, "", "center", "wrong center", "center center extra"]) {
      if (value === null) anchor.removeAttribute("data-ae-anchor-scroll-into-view");
      else anchor.setAttribute("data-ae-anchor-scroll-into-view", value);
      anchor.setAttribute("data-ae-anchor-target", anchor.getAttribute("data-ae-anchor-target") === "a" ? "b" : "a");
      await aelluxJs.mountManager.update(anchor, "anchor");
    }
  });
  expect((await calls(page)).length).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => aelluxJs.updatePreferenceAttributesHTML({ reducedMotion: "reduced" }));
  await expect.poll(() => page.evaluate(() => aelluxJs.currentPreference("reduced-motion"))).toBe("reduced");
  await page.locator("#indicator").evaluate(element => {
    element.setAttribute("data-ae-anchor-scroll-into-view", "end nearest");
    element.setAttribute("data-ae-anchor-target", "c");
  });
  await count(page, 2);
  expect((await calls(page))[1].options).toEqual({ block: "end", inline: "nearest", behavior: "instant" });
});

for (const forceLegacy of [false, true]) {
  test(`Present Group selection scrolls the Anchor after the new member becomes visible (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, { group: true, duration: 200, forceLegacy });
    await count(page, 1);
    await centered(page);
    await page.evaluate(() => aelluxJs("group").present.show("b"));
    await count(page, 2);
    await centered(page);
    expect((await calls(page))[1]).toMatchObject({ id: "b", switching: true });
    await page.evaluate(() => aelluxJs("group").present.show("b"));
    await page.waitForTimeout(200);
    expect((await calls(page)).length).toBe(2);
  });
}
