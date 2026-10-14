import { expect, test } from "@playwright/test";

const box = (id, mode = "pointer", extra = "", content = "", momentum = "false") =>
  `<div id="${id}" data-ae-scrollbox="${mode}" ${extra}
    ${momentum === null ? "" : `data-ae-scrollbox-momentum="${momentum}"`}
    style="width:100px;height:100px;overflow:auto;--ae-scroll-x-progress:.2;--ae-scroll-y-progress:.3">
    <div style="width:300px;height:300px">${content}</div></div>`;

async function setup(page, html, { coarse = false } = {}) {
  await page.goto("/tests/index.htm");
  if (coarse) await page.evaluate(() => {
    const matchMedia = window.matchMedia.bind(window);
    window.matchMedia = query => query.includes("hover: hover")
      ? { matches: false } : matchMedia(query);
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(markup => {
    document.body.innerHTML = markup;
    AelluxJs.ext("scrollbox");
  }, html);
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
}

async function drag(page, id, pointerType = "mouse") {
  return page.evaluate(({ id, pointerType }) => {
    const element = document.getElementById(id);
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 17,
      pointerType, button: 0, buttons: 1, clientX: x, clientY: y
    }));
    const during = element.style.getPropertyValue("user-select");
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 17,
      pointerType, buttons: 1, clientX: x - 50, clientY: y - 40
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType,
      button: 0, buttons: 0, clientX: x - 50, clientY: y - 40
    }));
    return { x: element.scrollLeft, y: element.scrollTop,
      during, after: element.style.getPropertyValue("user-select") };
  }, { id, pointerType });
}

test("native is the default and never loads a dependency", async ({ page }) => {
  let requests = 0;
  await page.route("https://unpkg.com/**", route => { requests++; return route.abort(); });
  await setup(page, box("empty", "") + box("native", "native") + box("pointer"));
  expect(requests).toBe(0);
  expect(await page.evaluate(() => Object.keys(AelluxJs.registry.dep))).toEqual([]);
  expect(await drag(page, "empty")).toMatchObject({ x: 0, y: 0 });
  expect(await drag(page, "native")).toMatchObject({ x: 0, y: 0 });
  expect(await drag(page, "pointer")).toMatchObject({ x: 50, y: 40 });
});

test("pointer drag keeps native scroll events and progress", async ({ page }) => {
  await setup(page, box("box"));
  await page.evaluate(() => {
    const element = document.getElementById("box");
    window.scrollEvents = [];
    window.addEventListener("scroll", event => {
      if (event.target === element) window.scrollEvents.push(event.isTrusted);
    }, true);
  });
  expect(await drag(page, "box")).toEqual({ x: 50, y: 40, during: "none", after: "" });
  await expect.poll(() => page.evaluate(() => ({
    events: window.scrollEvents.length,
    x: document.getElementById("box").style.getPropertyValue("--ae-scroll-x-progress"),
    y: document.getElementById("box").style.getPropertyValue("--ae-scroll-y-progress")
  }))).toMatchObject({ x: "0.25", y: "0.2" });
  expect(await page.evaluate(() => window.scrollEvents.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollEvents.every(Boolean))).toBe(true);
});

test("real mouse drag scrolls while the pointer leaves the box", async ({ page }) => {
  await setup(page, box("box"));
  const rect = await page.locator("#box").boundingBox();
  await page.mouse.move(rect.x + 70, rect.y + 70);
  await page.mouse.down();
  await page.mouse.move(rect.x - 3, rect.y - 3, { steps: 3 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => {
    const element = document.getElementById("box");
    return [element.scrollLeft, element.scrollTop];
  })).toEqual([73, 73]);
});

test("horizontal pointer movement selects text in a vertical-only box", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbox-momentum="false"
    style="width:200px;height:100px;overflow:auto;font:16px monospace">
    <div style="width:180px;height:300px;padding-top:60px;box-sizing:border-box"><span id="text">abcdefghijklmno</span></div>
  </div>`);
  const rect = await page.locator("#text").boundingBox();
  await page.mouse.move(rect.x + 5, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + 100, rect.y + rect.height / 2, { steps: 5 });
  await page.mouse.up();
  const result = await page.evaluate(() => ({
    selection: getSelection().toString(),
    scrollTop: document.getElementById("box").scrollTop,
    userSelect: document.getElementById("box").style.getPropertyValue("user-select")
  }));
  expect(result.selection.length).toBeGreaterThan(0);
  expect(result.scrollTop).toBe(0);
  expect(result.userSelect).toBe("");
});

test("vertical pointer movement still drags a vertical-only box", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbox-momentum="false"
    style="width:200px;height:100px;overflow:auto;font:16px monospace">
    <div style="width:180px;height:300px;padding-top:60px;box-sizing:border-box"><span id="text">abcdefghijklmno</span></div>
  </div>`);
  const rect = await page.locator("#text").boundingBox();
  await page.mouse.move(rect.x + 5, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + 5, rect.y - 40, { steps: 5 });
  await page.mouse.up();
  expect(await page.evaluate(() => document.getElementById("box").scrollTop))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => document.getElementById("box")
    .style.getPropertyValue("user-select"))).toBe("");
});

test("touch and interactive controls do not start pointer dragging", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "<button id='button'>Click</button>"));
  expect(await drag(page, "box", "touch")).toMatchObject({ x: 0, y: 0 });
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const button = document.getElementById("button");
    const rect = button.getBoundingClientRect();
    button.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 22, pointerType: "mouse",
      button: 0, buttons: 1, clientX: rect.left + 5, clientY: rect.top + 5
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, isPrimary: true, pointerId: 22, pointerType: "mouse",
      buttons: 1, clientX: 0, clientY: 0
    }));
    return { x: element.scrollLeft, y: element.scrollTop,
      userSelect: element.style.getPropertyValue("user-select") };
  });
  expect(result).toEqual({ x: 0, y: 0, userSelect: "" });
});

test("pointer mode keeps native behavior on a coarse-pointer device", async ({ page }) => {
  await setup(page, box("box"), { coarse: true });
  expect(await drag(page, "box")).toMatchObject({ x: 0, y: 0 });
  await page.evaluate(() => document.getElementById("box").scrollTo(50, 40));
  await expect.poll(() => page.evaluate(() => [
    document.getElementById("box").style.getPropertyValue("--ae-scroll-x-progress"),
    document.getElementById("box").style.getPropertyValue("--ae-scroll-y-progress")
  ])).toEqual(["0.25", "0.2"]);
});

test("content resize refreshes native progress", async ({ page }) => {
  await setup(page, box("box", "native"));
  await page.evaluate(() => document.getElementById("box").scrollTo(100, 0));
  await expect.poll(() => page.evaluate(() => Number(document.getElementById("box")
    .style.getPropertyValue("--ae-scroll-x-progress")))).toBe(0.5);
  await page.evaluate(() => { document.getElementById("box").firstElementChild.style.width = "400px"; });
  await expect.poll(() => page.evaluate(() => Number(document.getElementById("box")
    .style.getPropertyValue("--ae-scroll-x-progress")))).toBeCloseTo(1 / 3, 3);
});

test("mode changes and unmount stop an active drag and restore inline styles", async ({ page }) => {
  await setup(page, box("box"));
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.style.setProperty("user-select", "text", "important");
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 7, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    element.setAttribute("data-ae-scrollbox", "native");
    await AelluxJs.mountManager.update(element, "scrollbox");
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, isPrimary: true, pointerId: 7, pointerType: "mouse",
      buttons: 1, clientX: x - 50, clientY: y - 50
    }));
    const afterSwitch = { x: element.scrollLeft, y: element.scrollTop,
      userSelect: element.style.getPropertyValue("user-select"),
      priority: element.style.getPropertyPriority("user-select") };
    await AelluxJs.unmount(element, "scrollbox");
    return { afterSwitch,
      progress: [element.style.getPropertyValue("--ae-scroll-x-progress"),
        element.style.getPropertyValue("--ae-scroll-y-progress")] };
  });
  expect(result).toEqual({
    afterSwitch: { x: 0, y: 0, userSelect: "text", priority: "important" },
    progress: [".2", ".3"]
  });
});

test("vertical wheel converts for horizontal-only native boxes and releases at an edge", async ({ page }) => {
  await setup(page, `<div id="parent" style="width:180px;height:120px;overflow:auto">
    <div style="height:500px">
      <div id="box" data-ae-scrollbox="pointer" style="width:100px;height:100px;overflow:auto">
        <div style="width:300px;height:100px"></div>
      </div>
    </div></div>`);
  const wheel = deltaY => page.evaluate(value => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", { deltaY: value, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented, x: element.scrollLeft };
  }, deltaY);
  expect(await wheel(120)).toEqual({ prevented: true, x: 120 });
  expect(await wheel(120)).toEqual({ prevented: true, x: 200 });
  expect(await wheel(120)).toEqual({ prevented: false, x: 200 });
});

test("pointer release keeps scrolling with momentum enabled by default", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "", null)
    .replace("width:300px;height:300px", "width:1000px;height:1000px"));
  const released = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    await new Promise(resolve => setTimeout(resolve, 16));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 17,
      pointerType: "mouse", buttons: 1, clientX: x - 40, clientY: y - 40
    }));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 40, clientY: y - 40
    }));
    return [element.scrollLeft, element.scrollTop];
  });
  expect(released).toEqual([40, 40]);
  await expect.poll(() => page.evaluate(() => document.getElementById("box").scrollLeft))
    .toBeGreaterThan(40);
  await expect.poll(() => page.evaluate(() => document.getElementById("box").scrollTop))
    .toBeGreaterThan(40);
});

test("momentum advances ten percent of the remaining distance each frame and terminates", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "", null)
    .replace("width:300px;height:300px", "width:1000px;height:1000px"));
  await page.evaluate(() => {
    window.pendingMomentumFrames = [];
    window.originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => {
      window.pendingMomentumFrames.push(callback);
      return window.pendingMomentumFrames.length;
    };
  });
  expect(await drag(page, "box")).toMatchObject({ x: 50, y: 40 });
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const positions = [];
    try {
      for (let step = 0; step < 180 && window.pendingMomentumFrames.length; step++) {
        window.pendingMomentumFrames.shift()(performance.now());
        positions.push([element.scrollLeft, element.scrollTop]);
      }
      return { positions, pending: window.pendingMomentumFrames.length };
    } finally {
      window.requestAnimationFrame = window.originalRequestAnimationFrame;
      delete window.pendingMomentumFrames;
      delete window.originalRequestAnimationFrame;
    }
  });
  expect(result.positions[0]).toEqual([135, 126]);
  expect(result.positions[1][0]).toBeGreaterThan(205);
  expect(result.positions[1][0]).toBeLessThan(220);
  expect(result.positions[1][1]).toBeCloseTo(203, 0);
  expect(result.positions.at(-1)).toEqual([900, 900]);
  expect(result.pending).toBe(0);
});

test("momentum false stops at release", async ({ page }) => {
  await setup(page, box("box"));
  expect(await drag(page, "box")).toMatchObject({ x: 50, y: 40 });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => {
    const element = document.getElementById("box");
    return [element.scrollLeft, element.scrollTop];
  })).toEqual([50, 40]);
});

test("disabling momentum while coasting stops the animation", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "", null)
    .replace("width:300px;height:300px", "width:1000px;height:1000px"));
  await drag(page, "box");
  await expect.poll(() => page.evaluate(() => document.getElementById("box").scrollLeft))
    .toBeGreaterThan(50);
  const stopped = await page.evaluate(async () => {
    const element = document.getElementById("box");
    element.setAttribute("data-ae-scrollbox-momentum", "false");
    await AelluxJs.mountManager.update(element, "scrollbox");
    return [element.scrollLeft, element.scrollTop];
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => {
    const element = document.getElementById("box");
    return [element.scrollLeft, element.scrollTop];
  })).toEqual(stopped);
});

test("a pause before release does not start momentum", async ({ page }) => {
  await setup(page, box("box", "pointer", "", "", null));
  const released = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 17,
      pointerType: "mouse", buttons: 1, clientX: x - 40, clientY: y - 40
    }));
    await new Promise(resolve => setTimeout(resolve, 350));
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 17, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 40, clientY: y - 40
    }));
    return [element.scrollLeft, element.scrollTop];
  });
  expect(released).toEqual([40, 40]);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => {
    const element = document.getElementById("box");
    return [element.scrollLeft, element.scrollTop];
  })).toEqual([40, 40]);
});

test("weak CSS makes scrolling smooth and honors reduced motion on every element", async ({ page }) => {
  await setup(page, box("box", "native"));
  const behaviors = () => page.evaluate(() => [
    document.documentElement, document.body, document.getElementById("box")
  ].map(element => getComputedStyle(element).scrollBehavior));
  expect(await behaviors()).toEqual(["smooth", "smooth", "smooth"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await behaviors()).toEqual(["auto", "auto", "auto"]);
});
