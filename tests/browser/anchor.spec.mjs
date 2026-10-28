import { expect, test } from "@playwright/test";

async function startAnchor(page, markup, options = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ html, disableObservers }) => {
    if (disableObservers) {
      window.ResizeObserver = class { observe() {} disconnect() {} };
      window.IntersectionObserver = class { observe() {} disconnect() {} };
    }
    document.body.innerHTML = html;
    AelluxJs.ext("anchor", { loadStyle: true });
  }, { html: markup, disableObservers: options.disableObservers });
  await page.addScriptTag({ url: "/dist/aellux.ext.anchor.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.anchor?.initialized)).toBe(true);
}

const properties = [
  "position", "left", "top", "transform", "transform-origin",
  "--ae-anchor-x", "--ae-anchor-y", "--ae-anchor-origin-x", "--ae-anchor-origin-y",
  "--anchor-opacity"
];

test("anchor follows its target's nearest Present opacity and allows CSS overrides", async ({ page }) => {
  await startAnchor(page, `
    <style>.developer-override { opacity: .9; }</style>
    <div id="reference" style="position: relative; width: 300px; height: 200px">
      <div id="present" data-ae-present="opacity" style="opacity: .4">
        <div id="target" style="position: absolute; left: 20px; top: 15px;
          width: 30px; height: 20px"></div>
      </div>
      <div id="plain" style="position: absolute; left: 80px; top: 15px;
        width: 30px; height: 20px"></div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width: 10px; height: 10px"><span id="anchor-child"></span></div>
    </div>`);
  const opacity = () => page.locator("#anchor").evaluate(element => ({
    variable: element.style.getPropertyValue("--anchor-opacity"),
    computed: getComputedStyle(element).opacity
  }));
  await expect.poll(opacity).toEqual({ variable: "0.4", computed: "0.4" });
  expect(await page.locator("#anchor-child").evaluate(element =>
    getComputedStyle(element).getPropertyValue("--anchor-opacity"))).toBe("0.4");

  await page.evaluate(() => {
    const present = document.getElementById("present");
    present.style.opacity = "0.25";
    present.dispatchEvent(new CustomEvent("AelluxJsLayout", { bubbles: true,
      detail: { durationMs: 0 } }));
  });
  await expect.poll(opacity).toEqual({ variable: "0.25", computed: "0.25" });

  await page.locator("#anchor").evaluate(element =>
    element.classList.add("developer-override"));
  expect(await opacity()).toEqual({ variable: "0.25", computed: "0.9" });

  await page.locator("#anchor").evaluate(element =>
    element.setAttribute("data-ae-anchor-target", "plain"));
  await page.evaluate(() => AelluxJs.mountManager.update(document.getElementById("anchor"), "anchor"));
  await expect.poll(opacity).toEqual({ variable: "1", computed: "0.9" });
});

test("empty or omitted target anchors to the positioning parent", async ({ page }) => {
  await startAnchor(page, `
    <div id="reference" style="position: relative; width: 300px; height: 200px">
      <div id="omitted" data-ae-anchor="bottom-right:bottom-right"
        style="width: 20px; height: 10px"></div>
      <div id="empty" data-ae-anchor-target="" data-ae-anchor="bottom-right:bottom-right"
        style="width: 20px; height: 10px"></div>
      <div id="explicit" data-ae-anchor-target="reference"
        data-ae-anchor="bottom-right:bottom-right" style="width: 20px; height: 10px"></div>
    </div>`);
  const read = () => page.evaluate(() => ["omitted", "empty", "explicit"].map(id => {
    const element = document.getElementById(id);
    return {
      anchored: element.classList.contains("ae--anchored"),
      x: element.style.getPropertyValue("--ae-anchor-x"),
      y: element.style.getPropertyValue("--ae-anchor-y")
    };
  }));
  await expect.poll(() => read().then(values => values.every(value => value.anchored))).toBe(true);
  expect(await read()).toEqual(Array(3).fill({ anchored: true, x: "280px", y: "190px" }));
});

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
  await expect.poll(y).toBe("150px");
  await page.evaluate(() => document.getElementById("scroller").scrollTop = 100);
  await expect.poll(y).toBe("50px");
  expect(await page.locator("#reference").evaluate(element => element.children.length)).toBe(2);
});

test("intersection changes schedule placement updates and unmount disconnects the observer", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    window.anchorIntersectionObservers = [];
    window.IntersectionObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.observed = new Set();
        window.anchorIntersectionObservers.push(this);
      }
      observe(element) { this.observed.add(element); }
      disconnect() { this.observed.clear(); }
    };
    document.body.innerHTML = `<div id="reference" style="position:relative;width:300px;height:100px">
      <div id="target" style="position:absolute;left:20px;top:10px;width:30px;height:20px"></div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width:10px;height:10px"></div></div>`;
    AelluxJs.ext("anchor", { loadStyle: true });
  });
  await page.addScriptTag({ url: "/dist/aellux.ext.anchor.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x"))).toBe("20px");
  expect(await page.evaluate(() => Array.from(window.anchorIntersectionObservers[0].observed,
    element => element.id).sort())).toEqual(["anchor", "reference", "target"]);
  await page.evaluate(() => {
    document.getElementById("target").style.left = "45px";
    window.anchorIntersectionObservers[0].callback([]);
  });
  await expect.poll(() => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x"))).toBe("45px");
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("anchor"), "anchor"));
  expect(await page.evaluate(() => window.anchorIntersectionObservers[0].observed.size)).toBe(0);
});

test("layout event on the shared positioning parent replaces position polling", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    // Exercise Layout independently of automatic DOM/size observation.
    window.MutationObserver = undefined;
    window.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    window.IntersectionObserver = class {
      observe() {}
      disconnect() {}
    };
    document.body.innerHTML = `<div style="position:relative;width:300px;height:100px">
      <div id="target" style="position:absolute;left:20px;top:10px;width:30px;height:20px"></div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width:10px;height:10px"></div>
      <div id="other" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width:10px;height:10px"></div></div>`;
    AelluxJs.ext("anchor", { loadStyle: true });
  });
  await page.addScriptTag({ url: "/dist/aellux.ext.anchor.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  const x = () => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x")
  );
  await expect.poll(x).toBe("20px");
  await page.evaluate(() => document.getElementById("target").style.left = "45px");
  await page.waitForTimeout(1200);
  expect(await x()).toBe("20px");
  await page.evaluate(() => document.getElementById("target").dispatchEvent(
    new CustomEvent("AelluxJsLayout", { bubbles: true })
  ));
  await expect.poll(x).toBe("45px");
  await page.evaluate(async () => {
    await AelluxJs.unmount(document.getElementById("anchor"), "anchor");
    document.getElementById("target").style.left = "60px";
    document.getElementById("target").dispatchEvent(
      new CustomEvent("AelluxJsLayout", { bubbles: true })
    );
  });
  await expect.poll(() => page.locator("#other").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x")
  )).toBe("60px");
});

test("layout duration keeps anchor checking at the configured interval", async ({ page }) => {
  await startAnchor(page, `
    <div style="position: relative; width: 300px; height: 100px">
      <div id="target" style="position: absolute; left: 20px; top: 10px; width: 30px; height: 20px"></div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width: 10px; height: 10px"></div>
    </div>`);

  const x = () => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x")
  );
  await expect.poll(x).toBe("20px");

  await page.evaluate(() => {
    document.getElementById("target").dispatchEvent(new CustomEvent("AelluxJsLayout", {
      detail: { origin: "test.move", durationMs: 400 }, bubbles: true
    }));
    setTimeout(() => { document.getElementById("target").style.left = "45px"; }, 150);
  });
  await expect.poll(x, { timeout: 1000 }).toBe("45px");
});

test("zero layout duration checks once after the configured interval", async ({ page }) => {
  await startAnchor(page, `
    <div style="position: relative; width: 300px; height: 100px">
      <div id="target" style="position: absolute; left: 20px; top: 10px; width: 30px; height: 20px"></div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width: 10px; height: 10px"></div>
    </div>`, { disableObservers: true });

  const x = () => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x")
  );
  await expect.poll(x).toBe("20px");
  const earlyPosition = await page.evaluate(async () => {
    const target = document.getElementById("target");
    target.style.left = "45px";
    target.dispatchEvent(new CustomEvent("AelluxJsLayout", {
      detail: { durationMs: 0 }, bubbles: true
    }));
    await new Promise(resolve => setTimeout(resolve, 15));
    return document.getElementById("anchor").style.getPropertyValue("--ae-anchor-x");
  });
  expect(earlyPosition).toBe("20px");
  await expect.poll(x).toBe("45px");
});

test("shared maxfps attribute limits Anchor updates", async ({ page }) => {
  await startAnchor(page, `
    <div style="position: relative; width: 300px; height: 100px">
      <div id="target" style="position: absolute; left: 20px; top: 10px; width: 30px; height: 20px"></div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        data-ae-maxfps="5" style="width: 10px; height: 10px"></div>
    </div>`, { disableObservers: true });

  await expect.poll(() => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x"))).toBe("20px");
  const earlyPosition = await page.evaluate(async () => {
    const target = document.getElementById("target");
    window.dispatchEvent(new Event("scroll"));
    await new Promise(resolve => setTimeout(resolve, 20));
    target.style.left = "45px";
    window.dispatchEvent(new Event("scroll"));
    await new Promise(resolve => setTimeout(resolve, 80));
    return document.getElementById("anchor").style.getPropertyValue("--ae-anchor-x");
  });
  expect(earlyPosition).toBe("20px");
  await expect.poll(() => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x"))).toBe("45px");
});

test("present layout event activates an anchor whose target started hidden", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `<div style="position:relative;width:300px;height:100px">
      <div id="panel" data-ae-present hidden
        style="--ae-pop-duration:0ms;--ae-unpop-duration:0ms">
        <div id="target" style="position:absolute;left:40px;top:20px;width:30px;height:20px"></div>
      </div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width:10px;height:10px"></div>
    </div>`;
    AelluxJs.init({ mode: "full" });
  });
  await expect.poll(() => page.evaluate(() =>
    typeof $ae("panel")?.present?.pop === "function"
  )).toBe(true);
  await expect(page.locator("#anchor")).not.toHaveClass(/ae--anchored/);

  await page.evaluate(() => $ae("panel").present.pop());
  await expect.poll(() => page.locator("#anchor").evaluate(element =>
    element.style.getPropertyValue("--ae-anchor-x")
  )).toBe("40px");

  await page.evaluate(() => $ae("panel").present.unpop());
  await expect(page.locator("#anchor")).not.toHaveClass(/ae--anchored/);
});

test("Anchor follows intermediate Present frames under CSS Motion control", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="reference" style="position:relative;width:500px;height:120px">
        <div id="panel" data-ae-present="transform" hidden style="position:absolute;left:20px;top:10px;
          width:40px;height:30px;--ae-from-transform:translateX(0px);
          --ae-pop-transform:translateX(120px);--ae-pop-duration:400ms">
          target
        </div>
        <div id="anchor" data-ae-anchor-target="panel" data-ae-anchor="top-left:top-left"
          style="width:10px;height:10px"></div>
      </div>`;
    AelluxJs.init({ mode: "full", cssMotionController: true });
  });
  await expect.poll(() => page.evaluate(() =>
    typeof AelluxJs("panel")?.present?.pop)).toBe("function");

  const sample = await page.evaluate(async () => {
    const panel = document.getElementById("panel");
    const anchor = document.getElementById("anchor");
    let layoutDetail = null;
    const positions = [];
    const observer = new MutationObserver(() => {
      const position = parseFloat(anchor.style.getPropertyValue("--ae-anchor-x"));
      if (Number.isFinite(position)) positions.push(position);
    });
    observer.observe(anchor, { attributes: true, attributeFilter: ["style"] });
    panel.addEventListener("AelluxJsLayout", event => { layoutDetail = event.detail; }, { once: true });
    const started = new Promise(resolve =>
      panel.addEventListener("AelluxJsPopping", resolve, { once: true }));
    const completed = AelluxJs(panel).present.pop();
    await started;
    await completed;
    while (Math.abs(parseFloat(anchor.style.getPropertyValue("--ae-anchor-x")) - 140) > 0.5) {
      await new Promise(resolve => setTimeout(resolve, 16));
    }
    observer.disconnect();
    return {
      intermediate: positions.find(position => position > 20 && position < 140),
      final: parseFloat(anchor.style.getPropertyValue("--ae-anchor-x")),
      durationMs: layoutDetail && layoutDetail.durationMs
    };
  });

  expect(sample.durationMs).toBe(400);
  expect(sample.intermediate).toBeGreaterThan(20);
  expect(sample.intermediate).toBeLessThan(140);
  expect(sample.final).toBeCloseTo(140, 0);
});

test("hidden Present targets hide their anchors without a reference context diagnostic", async ({ page }) => {
  await startAnchor(page, `
    <div style="position: relative; width: 300px; height: 100px">
      <div id="panel" data-ae-present hidden>
        <div><div id="target" style="position: absolute; left: 40px; top: 20px;
          width: 30px; height: 20px"></div></div>
      </div>
      <div id="anchor" data-ae-anchor-target="target" data-ae-anchor="top-left:top-left"
        style="width: 10px; height: 10px"></div>
    </div>`);

  const update = () => page.evaluate(async () => {
    await AelluxJs.mountManager.update(document.getElementById("anchor"), "anchor");
    return {
      anchored: document.getElementById("anchor").classList.contains("ae--anchored"),
      diagnostics: AelluxJs.diagnostics.showHistory(100).filter(entry =>
        entry.code === AelluxJs.diagnostics.ERROR_ANCHOR_REFERENCE_CONTEXT.code).length
    };
  });
  expect(await update()).toEqual({ anchored: false, diagnostics: 0 });

  for (const property of ["display", "visibility", "opacity"]) {
    await page.evaluate(property => {
      const panel = document.getElementById("panel");
      panel.hidden = false;
      panel.style[property] = property === "display" ? "none" :
        property === "visibility" ? "hidden" : "0";
    }, property);
    expect(await update(), property).toEqual({ anchored: false, diagnostics: 0 });
    await page.evaluate(property => {
      document.getElementById("panel").style[property] = "";
    }, property);
    expect(await update()).toEqual({ anchored: true, diagnostics: 0 });
  }
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
  expect(result.measurements.length).toBeLessThanOrEqual(5);
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
  await expect.poll(count).toBe(1);
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
          --ae-anchor-x: 5px !important; --ae-anchor-origin-x: 7%;
          --anchor-opacity: .8"></div>
    </div>`);
  await expect(page.locator("#anchor")).toHaveClass(/ae--anchored/);
  // Application positioning overrides the weak defaults while mounted too.
  await expect(page.locator("#anchor")).toHaveCSS("position", "relative");
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
    ["5px", "important"], ["", ""], ["7%", ""], ["", ""], [".8", ""]
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
