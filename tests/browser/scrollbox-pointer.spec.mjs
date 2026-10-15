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

test("desktop pointer drag cancels wheel until pointer release", async ({ page }) => {
  await setup(page, box("box"));
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 70, y = rect.top + 70;
    let bubbled = 0;
    document.body.addEventListener("wheel", () => { bubbled++; });
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 29, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 29,
      pointerType: "mouse", buttons: 1, clientX: x - 30, clientY: y - 30
    }));
    const during = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true });
    element.dispatchEvent(during);
    const scrollTop = element.scrollTop;
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 29, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 30, clientY: y - 30
    }));
    const after = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true });
    element.dispatchEvent(after);
    return { preventedDuring: during.defaultPrevented, preventedAfter: after.defaultPrevented,
      bubbled, scrollTop };
  });
  expect(result).toEqual({ preventedDuring: true, preventedAfter: false,
    bubbled: 1, scrollTop: 30 });
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

for (const elastic of [false, true]) {
  test(`second click dragged outside does not start pointer scrolling${elastic ? " with elastic" : ""}`,
    async ({ page }) => {
      const childAttribute = elastic ? " data-ae-scrollbox-elastic" : "";
      await setup(page, `<div id="box" data-ae-scrollbox="pointer"
        data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
        <div${childAttribute} style="width:300px;height:300px"></div></div>`);
      const rect = await page.locator("#box").boundingBox();
      const x = rect.x + 50, y = rect.y + 50;
      await page.mouse.move(x, y);
      await page.mouse.click(x, y);
      await page.mouse.down({ clickCount: 2 });
      await page.mouse.move(rect.x - 20, rect.y - 20, { steps: 4 });
      const during = await page.evaluate(() => {
        const element = document.getElementById("box");
        return { x: element.scrollLeft, y: element.scrollTop,
          userSelect: element.style.getPropertyValue("user-select"),
          transform: element.firstElementChild.style.transform };
      });
      await page.mouse.up();
      expect(during).toEqual({ x: 0, y: 0, userSelect: "", transform: "" });
    });
}

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

test("elastic pointer drag transforms its marked wrapper and restores it on unmount", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto;padding:7px 9px 11px 13px">
    <div data-ae-scrollbox-elastic
      style="width:300px;height:300px;transform:scale(1);transform-origin:25% 75%"></div></div>`);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const rect = element.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    const pointer = (type, clientX, clientY, buttons) => new PointerEvent(type, {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 19,
      pointerType: "mouse", button: type === "pointermove" ? -1 : 0,
      buttons, clientX, clientY
    });
    element.dispatchEvent(pointer("pointerdown", x, y, 1));
    window.dispatchEvent(pointer("pointermove", x + 30, y + 60, 1));
    const stretched = wrapper.style.transform;
    const activeOrigin = wrapper.style.transformOrigin;
    window.dispatchEvent(pointer("pointerup", x + 30, y + 60, 0));
    const releasing = wrapper.classList.contains("ae--scrollbox-elastic-release");
    await AelluxJs.unmount(element, "scrollbox");
    return { stretched, activeOrigin, releasing, transform: wrapper.style.transform,
      origin: wrapper.style.transformOrigin,
      padding: element.style.getPropertyValue("padding"),
      releaseClass: wrapper.classList.contains("ae--scrollbox-elastic-release") };
  });
  expect(result.stretched).toContain("translate3d(10px, 20px, 0px)");
  expect(result.stretched).toMatch(/scale\(1\.\d+, 1\.\d+\)/);
  expect(result.stretched.startsWith("scale(")).toBe(true);
  expect(result.activeOrigin.startsWith("0% 0%")).toBe(true);
  expect(result.releasing).toBe(true);
  expect(result.transform).toBe("scale(1)");
  expect(result.origin.startsWith("25% 75%")).toBe(true);
  expect(result.padding).toBe("7px 9px 11px 13px");
  expect(result.releaseClass).toBe(false);
});

test("elastic native wheel transforms its wrapper and settles", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div></div>`);
  const stretched = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const event = new WheelEvent("wheel", { deltaY: -60, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    const transform = wrapper.style.transform;
    await new Promise(resolve => setTimeout(resolve, 160));
    return { prevented: event.defaultPrevented,
      transform, releasing: wrapper.classList.contains("ae--scrollbox-elastic-release"),
      settlingScale: new DOMMatrixReadOnly(getComputedStyle(wrapper).transform).m22 };
  });
  expect(stretched.prevented).toBe(true);
  expect(stretched.transform).toContain("translate3d(0px, 20px, 0px)");
  expect(stretched.transform).toMatch(/scale\(1, 1\.\d+\)/);
  expect(stretched.releasing).toBe(true);
  expect(stretched.settlingScale).toBeGreaterThan(1);
  expect(stretched.settlingScale).toBeLessThan(1.1);
  await expect.poll(() => page.evaluate(() => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    return { transform: wrapper.style.transform,
      releaseClass: wrapper.classList.contains("ae--scrollbox-elastic-release") };
  })).toEqual({ transform: "", releaseClass: false });
});

test("elastic native touch stretches while pulling beyond an edge", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;padding:6px">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const touchEvent = (type, y, active) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", { value: active ? [
        { identifier: 1, clientX: 40, clientY: y }
      ] : [] });
      return event;
    };
    element.dispatchEvent(touchEvent("touchstart", 40, true));
    const move = touchEvent("touchmove", 100, true);
    element.dispatchEvent(move);
    const transform = element.firstElementChild.style.transform;
    element.dispatchEvent(touchEvent("touchend", 100, false));
    return { prevented: move.defaultPrevented, transform,
      releasing: element.firstElementChild.classList.contains("ae--scrollbox-elastic-release") };
  });
  expect(result.prevented).toBe(true);
  expect(result.transform).toContain("translate3d(0px, 20px, 0px)");
  expect(result.transform).toMatch(/scale\(1, 1\.\d+\)/);
  expect(result.releasing).toBe(true);
});

test("elastic pointer drag moves its wrapper away from bottom and right edges", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto;padding:7px 9px 11px 13px">
    <div data-ae-scrollbox-elastic style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const maxX = element.scrollWidth - element.clientWidth;
    const maxY = element.scrollHeight - element.clientHeight;
    element.scrollTo({ left: maxX, top: maxY, behavior: "instant" });
    const rect = element.getBoundingClientRect();
    const wrapper = element.firstElementChild;
    const beforeGapX = rect.right - wrapper.getBoundingClientRect().right;
    const beforeGapY = rect.bottom - wrapper.getBoundingClientRect().bottom;
    const x = rect.left + 50, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 23, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 23,
      pointerType: "mouse", buttons: 1, clientX: x - 60, clientY: y - 60
    }));
    return {
      transform: wrapper.style.transform,
      origin: wrapper.style.transformOrigin,
      scrollLeft: element.scrollLeft, scrollTop: element.scrollTop, maxX, maxY,
      gapX: rect.right - wrapper.getBoundingClientRect().right - beforeGapX,
      gapY: rect.bottom - wrapper.getBoundingClientRect().bottom - beforeGapY
    };
  });
  expect(result.transform).toContain("translate3d(-20px, -20px, 0px)");
  expect(result.transform).toMatch(/scale\(1\.\d+(?:, 1\.\d+)?\)/);
  expect(result.transform.startsWith("scale(")).toBe(true);
  expect(Number.parseFloat(result.origin.split(" ")[0])).toBeGreaterThanOrEqual(300);
  expect(Number.parseFloat(result.origin.split(" ")[1])).toBeGreaterThanOrEqual(300);
  expect(result.scrollLeft).toBe(result.maxX);
  expect(result.scrollTop).toBe(result.maxY);
  expect(result.gapX).toBeGreaterThan(15);
  expect(result.gapY).toBeGreaterThan(15);
});

test("elastic trailing pivot follows content overflowing its wrapper", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false" style="width:100px;height:100px;overflow:auto">
    <div data-ae-scrollbox-elastic style="width:100px;height:100px">
      <div id="content" style="width:400px;height:400px"></div>
    </div></div>`);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const content = document.getElementById("content");
    const rect = element.getBoundingClientRect();
    element.scrollTo({ left: element.scrollWidth, top: element.scrollHeight, behavior: "instant" });
    const before = content.getBoundingClientRect();
    const beforeScroll = { x: element.scrollLeft, y: element.scrollTop };
    const beforeWrapper = { width: wrapper.offsetWidth, height: wrapper.offsetHeight };
    const x = rect.left + 50, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 53, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 53,
      pointerType: "mouse", buttons: 1, clientX: x - 60, clientY: y - 60
    }));
    const after = content.getBoundingClientRect();
    const origin = wrapper.style.transformOrigin.split(" ");
    const result = { gapX: before.right - after.right, gapY: before.bottom - after.bottom,
      originX: Number.parseFloat(origin[0]), originY: Number.parseFloat(origin[1]),
      wrapperWidth: wrapper.offsetWidth, wrapperHeight: wrapper.offsetHeight, beforeWrapper,
      contentWidth: wrapper.scrollWidth, contentHeight: wrapper.scrollHeight,
      beforeScroll, afterScroll: { x: element.scrollLeft, y: element.scrollTop },
      transform: wrapper.style.transform };
    await AelluxJs.unmount(element, "scrollbox");
    return { ...result, restoredMinWidth: wrapper.style.minWidth,
      restoredMinHeight: wrapper.style.minHeight };
  });
  expect(result.beforeWrapper).toEqual({ width: 100, height: 100 });
  expect(result.wrapperWidth).toBeGreaterThanOrEqual(400);
  expect(result.wrapperHeight).toBeGreaterThanOrEqual(400);
  expect(result.originX).toBeGreaterThanOrEqual(result.contentWidth);
  expect(result.originY).toBeGreaterThanOrEqual(result.contentHeight);
  expect(result.afterScroll).toEqual(result.beforeScroll);
  expect(result.gapX, JSON.stringify(result)).toBeGreaterThan(15);
  expect(result.gapY).toBeGreaterThan(15);
  expect(result.restoredMinWidth).toBe("");
  expect(result.restoredMinHeight).toBe("");
});

test("elastic bottom and right transform animates during release", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer"
    data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div data-ae-scrollbox-elastic style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const wrapper = element.firstElementChild;
    const rect = element.getBoundingClientRect();
    const gap = () => ({
      x: rect.right - wrapper.getBoundingClientRect().right,
      y: rect.bottom - wrapper.getBoundingClientRect().bottom
    });
    element.scrollTo({ left: element.scrollWidth, top: element.scrollHeight, behavior: "instant" });
    const before = gap();
    const x = rect.left + 50, y = rect.top + 50;
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, isPrimary: true, pointerId: 41, pointerType: "mouse",
      button: 0, buttons: 1, clientX: x, clientY: y
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 41,
      pointerType: "mouse", buttons: 1, clientX: x - 60, clientY: y - 60
    }));
    const during = gap();
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, isPrimary: true, pointerId: 41, pointerType: "mouse",
      button: 0, buttons: 0, clientX: x - 60, clientY: y - 60
    }));
    await new Promise(resolve => setTimeout(resolve, 250));
    const middle = gap();
    const matrix = new DOMMatrixReadOnly(getComputedStyle(wrapper).transform);
    return { before, during, middle, scaleX: matrix.m11, scaleY: matrix.m22 };
  });
  expect(result.scaleX).toBeGreaterThan(1);
  expect(result.scaleX).toBeLessThan(1.1);
  expect(result.scaleY).toBeGreaterThan(1);
  expect(result.scaleY).toBeLessThan(1.1);
  expect(result.middle.x).toBeGreaterThan(result.before.x);
  expect(result.middle.y).toBeGreaterThan(result.before.y);
  expect(result.middle.x).toBeLessThan(result.during.x);
  expect(result.middle.y).toBeLessThan(result.during.y);
});

test("elastic native wheel moves its wrapper at bottom and right limits", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div data-ae-scrollbox-elastic style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    element.scrollTo({ left: element.scrollWidth, top: element.scrollHeight, behavior: "instant" });
    const event = new WheelEvent("wheel", {
      deltaX: 60, deltaY: 60, bubbles: true, cancelable: true
    });
    element.dispatchEvent(event);
    return {
      prevented: event.defaultPrevented,
      transform: element.firstElementChild.style.transform,
      scrollLeft: element.scrollLeft, scrollTop: element.scrollTop,
      maxX: element.scrollWidth - element.clientWidth,
      maxY: element.scrollHeight - element.clientHeight
    };
  });
  expect(result.prevented).toBe(true);
  expect(result.transform).toContain("translate3d(-20px, -20px, 0px)");
  expect(result.transform).toMatch(/scale\(1\.\d+(?:, 1\.\d+)?\)/);
  expect(result.scrollLeft).toBe(result.maxX);
  expect(result.scrollTop).toBe(result.maxY);
});

test("elastic false on the child leaves native wheel and transform unchanged", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native"
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div data-ae-scrollbox-elastic="false" style="width:100px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", { deltaY: -60, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented,
      padding: element.style.getPropertyValue("padding"),
      transform: element.firstElementChild.style.transform,
      boxSizing: getComputedStyle(element).boxSizing };
  });
  expect(result).toEqual({ prevented: false, padding: "8px",
    transform: "", boxSizing: "content-box" });
});

test("elastic reports a diagnostic when its marked child is not the only direct child", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native" style="width:100px;height:100px">
    <div data-ae-scrollbox-elastic style="width:100px;height:300px"></div>
    <div>extra child</div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", { deltaY: -60, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented,
      code: AelluxJs.diagnostics.showHistory(1)[0]?.code,
      transform: element.firstElementChild.style.transform };
  });
  expect(result).toEqual({ prevented: false, code: 1120, transform: "" });
});
