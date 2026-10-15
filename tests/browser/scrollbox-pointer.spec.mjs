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

test("elastic pointer drag adds to mounted padding and restores it on unmount", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbox-elastic
    data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto;padding:7px 9px 11px 13px">
    <div style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("box");
    const rect = element.getBoundingClientRect();
    const x = rect.left + 50, y = rect.top + 50;
    const pointer = (type, clientX, clientY, buttons) => new PointerEvent(type, {
      bubbles: true, cancelable: true, isPrimary: true, pointerId: 19,
      pointerType: "mouse", button: type === "pointermove" ? -1 : 0,
      buttons, clientX, clientY
    });
    element.dispatchEvent(pointer("pointerdown", x, y, 1));
    window.dispatchEvent(pointer("pointermove", x + 30, y + 60, 1));
    const stretched = ["padding-top", "padding-right", "padding-bottom", "padding-left"]
      .map(name => Number.parseFloat(element.style.getPropertyValue(name)));
    window.dispatchEvent(pointer("pointerup", x + 30, y + 60, 0));
    const releasing = element.classList.contains("ae--scrollbox-elastic-release");
    await AelluxJs.unmount(element, "scrollbox");
    return { stretched, releasing, padding: element.style.getPropertyValue("padding"),
      releaseClass: element.classList.contains("ae--scrollbox-elastic-release") };
  });
  expect(result.stretched[0]).toBe(27);
  expect(result.stretched[3]).toBe(23);
  expect(result.releasing).toBe(true);
  expect(result.padding).toBe("7px 9px 11px 13px");
  expect(result.releaseClass).toBe(false);
});

test("elastic native wheel stretches at the edge and settles to mounted padding", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native" data-ae-scrollbox-elastic
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div style="width:100px;height:300px"></div></div>`);
  const stretched = await page.evaluate(() => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", { deltaY: -60, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented,
      paddingTop: Number.parseFloat(element.style.getPropertyValue("padding-top")) };
  });
  expect(stretched).toEqual({ prevented: true, paddingTop: 28 });
  await expect.poll(() => page.evaluate(() => document.getElementById("box")
    .classList.contains("ae--scrollbox-elastic-release"))).toBe(true);
  const settlingPadding = await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return Number.parseFloat(getComputedStyle(document.getElementById("box")).paddingTop);
  });
  expect(settlingPadding).toBeGreaterThan(8);
  expect(settlingPadding).toBeLessThan(28);
  await expect.poll(() => page.evaluate(() => {
    const element = document.getElementById("box");
    return { padding: element.style.getPropertyValue("padding"),
      releaseClass: element.classList.contains("ae--scrollbox-elastic-release") };
  })).toEqual({ padding: "8px", releaseClass: false });
});

test("elastic native touch stretches while pulling beyond an edge", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native" data-ae-scrollbox-elastic
    style="width:100px;height:100px;overflow:auto;padding:6px">
    <div style="width:100px;height:300px"></div></div>`);
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
    const paddingTop = Number.parseFloat(element.style.getPropertyValue("padding-top"));
    element.dispatchEvent(touchEvent("touchend", 100, false));
    return { prevented: move.defaultPrevented, paddingTop,
      releasing: element.classList.contains("ae--scrollbox-elastic-release") };
  });
  expect(result).toEqual({ prevented: true, paddingTop: 26, releasing: true });
});

test("elastic pointer drag exposes bottom and right padding past their scroll limits", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="pointer" data-ae-scrollbox-elastic
    data-ae-scrollbox-momentum="false"
    style="width:100px;height:100px;overflow:auto;padding:7px 9px 11px 13px">
    <div style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const maxX = element.scrollWidth - element.clientWidth;
    const maxY = element.scrollHeight - element.clientHeight;
    element.scrollTo({ left: maxX, top: maxY, behavior: "instant" });
    const rect = element.getBoundingClientRect();
    const child = element.firstElementChild;
    const beforeGapX = rect.right - child.getBoundingClientRect().right;
    const beforeGapY = rect.bottom - child.getBoundingClientRect().bottom;
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
      paddingRight: Number.parseFloat(element.style.getPropertyValue("padding-right")),
      paddingBottom: Number.parseFloat(element.style.getPropertyValue("padding-bottom")),
      scrollLeft: element.scrollLeft, scrollTop: element.scrollTop, maxX, maxY,
      elasticMaxX: element.scrollWidth - element.clientWidth,
      elasticMaxY: element.scrollHeight - element.clientHeight,
      gapX: rect.right - child.getBoundingClientRect().right - beforeGapX,
      gapY: rect.bottom - child.getBoundingClientRect().bottom - beforeGapY
    };
  });
  expect(result.paddingRight).toBe(29);
  expect(result.paddingBottom).toBe(31);
  expect(result.scrollLeft).toBeGreaterThan(result.maxX);
  expect(result.scrollTop).toBeGreaterThan(result.maxY);
  expect(result.scrollLeft).toBe(result.elasticMaxX);
  expect(result.scrollTop).toBe(result.elasticMaxY);
  expect(result.gapX).toBeGreaterThan(15);
  expect(result.gapY).toBeGreaterThan(15);
});

test("elastic native wheel stays at the new bottom and right limits", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native" data-ae-scrollbox-elastic
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div style="width:300px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    element.scrollTo({ left: element.scrollWidth, top: element.scrollHeight, behavior: "instant" });
    const event = new WheelEvent("wheel", {
      deltaX: 60, deltaY: 60, bubbles: true, cancelable: true
    });
    element.dispatchEvent(event);
    return {
      prevented: event.defaultPrevented,
      paddingRight: Number.parseFloat(element.style.getPropertyValue("padding-right")),
      paddingBottom: Number.parseFloat(element.style.getPropertyValue("padding-bottom")),
      scrollLeft: element.scrollLeft, scrollTop: element.scrollTop,
      maxX: element.scrollWidth - element.clientWidth,
      maxY: element.scrollHeight - element.clientHeight
    };
  });
  expect(result.prevented).toBe(true);
  expect(result.paddingRight).toBe(28);
  expect(result.paddingBottom).toBe(28);
  expect(result.scrollLeft).toBe(result.maxX);
  expect(result.scrollTop).toBe(result.maxY);
});

test("elastic false leaves native wheel and padding unchanged", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox="native" data-ae-scrollbox-elastic="false"
    style="width:100px;height:100px;overflow:auto;padding:8px">
    <div style="width:100px;height:300px"></div></div>`);
  const result = await page.evaluate(() => {
    const element = document.getElementById("box");
    const event = new WheelEvent("wheel", { deltaY: -60, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return { prevented: event.defaultPrevented,
      padding: element.style.getPropertyValue("padding"),
      boxSizing: getComputedStyle(element).boxSizing };
  });
  expect(result).toEqual({ prevented: false, padding: "8px", boxSizing: "content-box" });
});
