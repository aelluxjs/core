import { expect, test } from "@playwright/test";

async function startAnchor(page, markup) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(html => {
    document.body.innerHTML = html;
    AelluxJs.ext("anchor");
  }, markup);
  await page.addScriptTag({ url: "/src/aellux.ext.anchor.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
}

const properties = [
  "position", "left", "top", "transform", "transform-origin",
  "--ae-anchor-x", "--ae-anchor-y", "--ae-anchor-origin-x", "--ae-anchor-origin-y"
];

test("anchor positions against a shared containing block and updates without moving DOM nodes", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await startAnchor(page, `
    <style>[data-ae-anchor] { transition: transform 10ms linear; }</style>
    <div id="reference" style="position: relative; margin: 80px 0 0 100px; width: 500px; height: 400px">
      <div id="target" style="position: absolute; left: 40px; top: 30px; width: 100px; height: 40px"></div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-center:top-center"
        style="width: 40px; height: 20px"></div>
    </div>`);

  const read = () => page.evaluate(() => {
    const element = document.getElementById("anchor");
    const style = element.style;
    const computed = getComputedStyle(element);
    return {
      parent: element.parentElement.id,
      siblings: element.parentElement.children.length,
      anchored: element.classList.contains("ae--anchored"),
      position: computed.position, left: computed.left, top: computed.top,
      visibility: computed.visibility, contain: computed.contain,
      inlinePosition: style.position, inlineTransform: style.transform,
      x: style.getPropertyValue("--ae-anchor-x"),
      y: style.getPropertyValue("--ae-anchor-y"),
      originX: style.getPropertyValue("--ae-anchor-origin-x"),
      originY: style.getPropertyValue("--ae-anchor-origin-y"),
      transform: computed.transform,
      transition: computed.transitionProperty,
      targetStyle: document.getElementById("target").getAttribute("style")
    };
  });
  await expect.poll(() => read().then(result => result.anchored)).toBe(true);
  const initial = await read();
  expect(initial).toMatchObject({
    parent: "reference", siblings: 2, anchored: true,
    position: "absolute", left: "0px", top: "0px",
    visibility: "visible", contain: "layout paint",
    inlinePosition: "", inlineTransform: "",
    x: "70px", y: "30px", originX: "50%", originY: "0%",
    transition: "transform"
  });
  expect(initial.transform).not.toBe("none");

  await page.evaluate(() => {
    document.getElementById("target").style.left = "100px";
    window.dispatchEvent(new Event("scroll"));
  });
  await expect.poll(() => read().then(result => result.x)).toBe("130px");
  expect((await read()).left).toBe("0px");
  await expect.poll(() => page.locator("#anchor").evaluate(element =>
    element.getBoundingClientRect().left
  )).toBeGreaterThan(200);

  await page.evaluate(() => {
    document.getElementById("target").style.top = "60px";
    window.dispatchEvent(new Event("resize"));
  });
  await expect.poll(() => read().then(result => result.y)).toBe("60px");

  await page.evaluate(() => {
    const element = document.getElementById("anchor");
    element.setAttribute("data-ae-anchor", "bottom-right:top-left");
    return AelluxJs.mountManager.update(element, "anchor");
  });
  expect(await read()).toMatchObject({ x: "200px", y: "100px", originX: "0%", originY: "0%" });
  expect((await read()).targetStyle).toContain("left: 100px");
});

test("anchor maps every self pivot and changes origin with viewport fallback", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await startAnchor(page, `
    <div style="position: relative; width: 800px; height: 600px">
      <div id="target" style="position: absolute; left: 200px; top: 200px; width: 50px; height: 40px"></div>
      <div id="anchor" data-ae-anchor-target="#target" data-ae-anchor="center:center"
        style="width: 40px; height: 60px"></div>
    </div>`);
  const origins = {
    "top-left": ["0%", "0%"], "top-center": ["50%", "0%"], "top-right": ["100%", "0%"],
    "center-left": ["0%", "50%"], center: ["50%", "50%"], "center-right": ["100%", "50%"],
    "bottom-left": ["0%", "100%"], "bottom-center": ["50%", "100%"], "bottom-right": ["100%", "100%"]
  };
  for (const [pivot, expected] of Object.entries(origins)) {
    const actual = await page.evaluate(async pivot => {
      const element = document.getElementById("anchor");
      element.setAttribute("data-ae-anchor", `center:${pivot}`);
      await AelluxJs.mountManager.update(element, "anchor");
      return {
        variables: ["--ae-anchor-origin-x", "--ae-anchor-origin-y"]
          .map(name => element.style.getPropertyValue(name)),
        computed: getComputedStyle(element).transformOrigin
      };
    }, pivot);
    expect(actual.variables).toEqual(expected);
    const [x, y] = expected.map((value, index) =>
      Number.parseFloat(value) * (index === 0 ? 40 : 60) / 100
    );
    expect(actual.computed).toMatch(new RegExp(`^${x}px ${y}px(?: 0px)?$`));
  }

  await page.evaluate(async () => {
    const target = document.getElementById("target");
    target.style.top = "550px";
    const element = document.getElementById("anchor");
    element.setAttribute("data-ae-anchor", "bottom-center:top-center,top-center:bottom-center");
    await AelluxJs.mountManager.update(element, "anchor");
  });
  expect(await page.locator("#anchor").evaluate(element => ({
    y: element.style.getPropertyValue("--ae-anchor-y"),
    origin: element.style.getPropertyValue("--ae-anchor-origin-y")
  }))).toEqual({ y: "490px", origin: "100%" });
});

test("scrolling a nested container updates coordinates in the shared reference", async ({ page }) => {
  await startAnchor(page, `
    <div id="reference" style="position: relative; width: 300px; height: 300px">
      <div id="scroller" style="width: 120px; height: 100px; overflow: auto">
        <div style="height: 150px"></div>
        <div id="target" style="width: 40px; height: 20px"></div>
        <div style="height: 250px"></div>
      </div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width: 20px; height: 10px"></div>
    </div>`);
  const y = () => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-y")
  );
  expect(await y()).toBe("150px");
  await page.evaluate(() => document.getElementById("scroller").scrollTop = 100);
  await expect.poll(y).toBe("50px");
  expect(await page.locator("#reference").evaluate(element => element.children.length)).toBe(2);
});

test("scroll bursts throttle layout measurements and keep the latest position", async ({ page }) => {
  await startAnchor(page, `
    <div style="position: relative; width: 300px; height: 100px">
      <div id="target" style="position: absolute; left: 20px; top: 10px; width: 30px; height: 20px"></div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width: 10px; height: 10px"></div>
    </div>`);
  await page.waitForTimeout(150);
  const result = await page.evaluate(async () => {
    const target = document.getElementById("target");
    const original = target.getBoundingClientRect;
    const measurements = [];
    target.getBoundingClientRect = function () {
      measurements.push(performance.now());
      return original.call(this);
    };
    for (let index = 0; index < 8; index++) {
      target.style.left = `${30 + index}px`;
      window.dispatchEvent(new Event("scroll"));
      await new Promise(resolve => setTimeout(resolve, 12));
    }
    await new Promise(resolve => setTimeout(resolve, 220));
    return {
      measurements,
      x: document.getElementById("anchor").style.getPropertyValue("--ae-anchor-x")
    };
  });
  expect(result.x).toBe("37px");
  expect(result.measurements.length).toBeGreaterThan(0);
  expect(result.measurements.length).toBeLessThanOrEqual(3);
});

test("different containing blocks report once and preserve positioning", async ({ page }) => {
  await startAnchor(page, `
    <div style="position: relative"><div id="target" style="width: 40px; height: 30px"></div></div>
    <div style="position: relative"><div id="anchor" data-ae-anchor-target="target"
      data-ae-anchor="top-left:top-left"
      style="position: fixed !important; left: 9px !important; top: 8px;
        transform: rotate(10deg); transform-origin: 10% 20%;
        --ae-anchor-x: 7px; --ae-anchor-y: 6px; --ae-anchor-origin-x: 4%; --ae-anchor-origin-y: 3%"></div></div>`);

  const snapshot = () => page.evaluate(names => {
    const style = document.getElementById("anchor").style;
    return names.map(name => [style.getPropertyValue(name), style.getPropertyPriority(name)]);
  }, properties);
  const initial = await snapshot();
  expect(initial[0]).toEqual(["fixed", "important"]);
  expect(initial[1]).toEqual(["9px", "important"]);
  expect(initial[5]).toEqual(["7px", ""]);

  const count = () => page.evaluate(() =>
    AelluxJs.diagnostics.showHistory(100).filter(entry =>
      entry.code === AelluxJs.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT.code
    ).length
  );
  expect(await count()).toBe(1);
  expect(await page.locator("#anchor").evaluate(element => ({
    anchored: element.classList.contains("ae--anchored"),
    visibility: getComputedStyle(element).visibility
  }))).toEqual({ anchored: false, visibility: "hidden" });
  await page.evaluate(() => {
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
  });
  await page.waitForTimeout(100);
  expect(await count()).toBe(1);
  expect(await snapshot()).toEqual(initial);
});

test("unmount restores owned inline values and priorities", async ({ page }) => {
  await startAnchor(page, `
    <div style="position: relative; width: 300px; height: 200px">
      <div id="target" style="position: absolute; left: 60px; top: 30px; width: 30px; height: 20px"></div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width: 20px; height: 10px; position: relative !important; left: 8px !important;
          top: 4px; transform: rotate(3deg); transform-origin: 20% 30%;
          --ae-anchor-x: 5px !important; --ae-anchor-origin-x: 7%"></div>
    </div>`);
  const beforeUnmount = await page.locator("#anchor").evaluate((element, names) =>
    names.map(name => [element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]),
  properties);
  expect(beforeUnmount[0]).toEqual(["", ""]);
  await expect(page.locator("#anchor")).toHaveClass(/ae--anchored/);
  await expect(page.locator("#anchor")).toHaveCSS("position", "absolute");
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("anchor"), "anchor"));
  await expect(page.locator("#anchor")).not.toHaveClass(/ae--anchored/);
  const restored = await page.locator("#anchor").evaluate((element, names) =>
    names.map(name => [element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]),
  properties);
  const originalOrigin = await page.evaluate(() => {
    const style = document.createElement("div").style;
    style.transformOrigin = "20% 30%";
    return style.transformOrigin;
  });
  expect(restored).toEqual([
    ["relative", "important"], ["8px", "important"], ["4px", ""],
    ["rotate(3deg)", ""], [originalOrigin, ""],
    ["5px", "important"], ["", ""], ["7%", ""], ["", ""]
  ]);
});

test("legacy bundle completes asynchronous anchor updates", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div style="position: relative; width: 200px; height: 100px">
        <div id="target" style="position: absolute; left: 30px; top: 20px; width: 40px; height: 20px"></div>
        <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
          style="width: 10px; height: 10px"></div>
      </div>`;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full", forceLegacy: true }));
  await expect.poll(() => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x")
  )).toBe("30px");
  await page.evaluate(async () => {
    document.getElementById("target").style.left = "50px";
    await AelluxJs.mountManager.update(document.getElementById("anchor"), "anchor");
  });
  expect(await page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x")
  )).toBe("50px");
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("anchor"), "anchor"));
  expect(await page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x")
  )).toBe("");
});
