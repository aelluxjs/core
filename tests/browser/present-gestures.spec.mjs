import { expect, test } from "@playwright/test";

const panel = (attributes = 'class="ae--unpop" data-ae-present-gesture="up"', style = "") => `
  <div id="source" style="width:200px;height:40px">Handle</div>
  <div id="panel" data-ae-present="transform opacity" data-ae-dismiss-on-click="none" ${attributes}
    style="width:200px;height:200px;--ae-from-transform:translateY(200px);--ae-pop-transform:translateY(0px);
    --ae-dismiss-transform:translateX(-200px);--ae-from-opacity:.2;--ae-pop-opacity:1;
    --ae-pop-duration:300ms;--ae-dismiss-duration:300ms;--ae-pop-ease:linear;--ae-dismiss-ease:linear;
    --ae-present-gesture-distance:200px;${style}">Content</div>`;

async function start(page, markup = panel(), options = {}) {
  await page.goto("/tests/index.htm");
  await page.evaluate(markup => { document.body.innerHTML = markup; }, markup);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => {
    $ae.ext("present", { loadStyle: true });
    if (options.withScrollbox) $ae.ext("scrollbox", { loadStyle: true });
    const { withScrollbox, ...initOptions } = options;
    $ae.init({ mode: "basic", ...initOptions });
  }, options);
  await expect.poll(() => page.evaluate(() => typeof $ae("panel")?.present?.pop)).toBe("function");
  await page.evaluate(async () => {
    const link = document.querySelector('link[data-ae-ext-style="present"]');
    if (!link.sheet) await new Promise(resolve => link.addEventListener("load", resolve, { once: true }));
    window.events = [];
    for (const name of ["BeforePop", "Popping", "Pop", "BeforeUnpop", "Unpopping", "Unpop", "BeforeDismiss", "Dismissing", "Dismiss"])
      document.getElementById("panel").addEventListener(`AelluxJs${name}`, () => events.push(name));
    window.pointer = (type, x = 0, y = 0, source = "panel", extra = {}) => {
      const target = type === "pointerdown" ? document.getElementById(source) : document;
      target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7,
        pointerType: "mouse", isPrimary: true, button: 0, clientX: x, clientY: y, ...extra }));
    };
    window.read = () => {
      const element = document.getElementById("panel"), style = getComputedStyle(element), matrix = new DOMMatrix(style.transform);
      return { x: matrix.m41, y: matrix.m42, opacity: +style.opacity, hidden: element.hidden,
        classes: element.className.replace(/\bae--mounted\b/g, "").trim(), progress: +style.getPropertyValue("--ae-pop-progress"),
        animations: element.getAnimations().length, paused: element.getAnimations().every(animation => animation.playState === "paused") };
    };
  });
}

for (const forceLegacy of [false, true]) {
  test(`scrubs the real timeline in both directions and resumes continuously (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, panel(), { forceLegacy });
    await page.evaluate(() => pointer("pointerdown", 0, 200));
    for (const [y, progress] of [[150, .25], [100, .5], [50, .75], [0, 1], [100, .5]]) {
      await page.evaluate(y => pointer("pointermove", 0, y), y);
      const value = await page.evaluate(() => read());
      expect(value.y).toBeCloseTo(200 * (1 - progress), 1);
      expect(value.opacity).toBeCloseTo(.2 + .8 * progress, 2);
      expect(value.progress).toBeCloseTo(progress, 2);
      expect(value.paused).toBe(true);
      expect(value.classes).toMatch(/ae--(?:popping|unpopping)/);
      if (y === 150) await page.evaluate(() => { window.effects = document.getElementById("panel").getAnimations(); });
      expect(await page.evaluate(() => effects.every(effect => document.getElementById("panel").getAnimations().includes(effect)))).toBe(true);
    }
    expect((await page.evaluate(() => read())).classes).toContain("ae--unpopping");
    const released = await page.evaluate(() => { const before = read(); pointer("pointerup", 0, 100); return { before, after: read() }; });
    expect(released.after.y).toBeCloseTo(released.before.y, 1);
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
    expect(await page.evaluate(() => events)).toEqual(["BeforePop", "Popping", "Pop"]);
    expect((await page.evaluate(() => read())).hidden).toBe(false);
    await page.evaluate(() => { pointer("pointerdown", 0, 0); pointer("pointermove", 0, 150); });
    expect((await page.evaluate(() => read())).classes).toContain("ae--unpopping");
    expect((await page.evaluate(() => read())).y).toBeCloseTo(150, 1);
    await page.evaluate(() => pointer("pointerup", 0, 150));
    await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
    expect((await page.evaluate(() => read())).hidden).toBe(false);
  });
}

test("threshold hysteresis, cancellation and repeated gesture configuration", async ({ page }) => {
  await start(page, panel(undefined, "--ae-present-pop-threshold:.6;--ae-present-unpop-threshold:.4"));
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 0, 100); pointer("pointerup", 0, 100); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 0, 50); pointer("pointerup", 0, 50); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  await page.evaluate(() => { pointer("pointerdown"); pointer("pointermove", 0, 100); pointer("pointerup", 0, 100); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  await page.evaluate(() => { pointer("pointerdown"); pointer("pointermove", 0, 175); pointer("pointercancel", 0, 175); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
});

test("dismiss has an independent progressive and reversible timeline", async ({ page }) => {
  await start(page, panel('class="ae--pop" data-ae-present-gesture="up" data-ae-present-gesture-dismiss="left"'));
  await page.evaluate(() => { pointer("pointerdown", 200); pointer("pointermove", 100); });
  let value = await page.evaluate(() => read());
  expect(value.x).toBeCloseTo(-100, 1);
  expect(value.classes).toContain("ae--dismissing");
  await page.evaluate(() => { pointer("pointermove", 175); pointer("pointerup", 175); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  await page.evaluate(() => { pointer("pointerdown", 200); pointer("pointermove", 25); pointer("pointerup", 25); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--dismissed\b/);
  value = await page.evaluate(() => read());
  expect(value.x).toBeCloseTo(-200, 1);
  expect(value.hidden).toBe(false);
  expect(await page.evaluate(() => events.filter(name => name === "Dismiss").length)).toBe(1);
});

for (const source of ["source", "#source", "document"]) {
  test(`external source ${source} prepares a legacy hidden Present`, async ({ page }) => {
    await start(page, panel(`hidden data-ae-present-gesture="up" data-ae-present-gesture-source="${source}"`));
    await page.evaluate(() => { pointer("pointerdown", 0, 200, "source"); pointer("pointermove", 0, 100); });
    expect((await page.evaluate(() => read())).y).toBeCloseTo(100, 1);
    await page.evaluate(() => pointer("pointerup", 0, 100));
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
    await page.evaluate(() => $ae("panel").present.unpop());
    expect((await page.evaluate(() => read())).hidden).toBe(true);
  });
}

test("Unpop gesture false leaves programmatic Unpop and Dismiss available", async ({ page }) => {
  await start(page, panel('class="ae--pop" data-ae-present-gesture="up" data-ae-present-gesture-unpop="false"'));
  await page.evaluate(() => { pointer("pointerdown"); pointer("pointermove", 0, 150); pointer("pointerup", 0, 150); });
  expect((await page.evaluate(() => read())).classes).toBe("ae--pop");
  await page.evaluate(() => $ae("panel").present.unpop());
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
  await page.evaluate(async () => { await $ae("panel").present.pop(); await $ae("panel").present.dismiss(); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--dismissed\b/);
});

test("horizontal gesture, invalid CSS fallback and responsive distance rereading", async ({ page }) => {
  await start(page, panel('class="ae--unpop" data-ae-present-gesture="right"', '--ae-present-pop-threshold:2;--ae-present-gesture-distance:calc(10em + 40px);font-size:16px;--ae-from-transform:translateX(-200px)'));
  await page.evaluate(() => { pointer("pointerdown"); pointer("pointermove", 100); });
  expect((await page.evaluate(() => read())).x).toBeCloseTo(-100, 1);
  await page.evaluate(() => pointer("pointercancel", 100));
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
  await page.evaluate(() => { document.getElementById("panel").style.setProperty("--ae-present-gesture-distance", "400px"); pointer("pointerdown"); pointer("pointermove", 100); });
  expect((await page.evaluate(() => read())).progress).toBeCloseTo(.25, 2);
});

test("configuration diagnostics disable only the conflicting gesture", async ({ page }) => {
  await start(page, panel('hidden data-ae-present-gesture="up" data-ae-present-gesture-dismiss="down"'));
  const codes = await page.evaluate(() => $ae.diagnostics.showHistory().map(entry => [entry.code, entry.level]));
  expect(codes).toContainEqual([3004, 2]);
  expect(codes).toContainEqual([2026, 1]);
  await page.evaluate(() => $ae("panel").present.pop());
  await page.evaluate(() => { pointer("pointerdown"); pointer("pointermove", 0, 175); pointer("pointerup", 0, 175); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
});

test("missing source can appear dynamically; source changes remove old listeners", async ({ page }) => {
  await start(page, panel('class="ae--unpop" data-ae-present-gesture="up" data-ae-present-gesture-source="late"'));
  expect(await page.evaluate(() => $ae.diagnostics.showHistory().some(entry => entry.code === 2027))).toBe(true);
  await page.evaluate(() => { const source = document.createElement("div"); source.id = "late"; document.body.append(source); });
  await page.evaluate(() => { pointer("pointerdown", 0, 200, "late"); pointer("pointermove", 0, 50); pointer("pointerup", 0, 50); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  await page.evaluate(async () => { await $ae("panel").present.unpop(); document.getElementById("panel").setAttribute("data-ae-present-gesture-source", "source"); });
  await page.evaluate(() => { pointer("pointerdown", 0, 200, "late"); pointer("pointermove", 0, 50); pointer("pointerup", 0, 50); });
  expect((await page.evaluate(() => read())).classes).toBe("ae--unpop");
});

test("shared document source chooses one Present deterministically", async ({ page }) => {
  await start(page, panel('class="ae--unpop" data-ae-present-gesture="up" data-ae-present-gesture-source="document"') +
    panel('class="ae--unpop" data-ae-present-gesture="up" data-ae-present-gesture-source="document"').replaceAll('id="panel"', 'id="second"').replaceAll('id="source"', 'id="second-source"'));
  await page.evaluate(() => { pointer("pointerdown", 0, 200, "source"); pointer("pointermove", 0, 25); pointer("pointerup", 0, 25); });
  await expect(page.locator("#second")).toHaveClass(/\bae--pop\b/);
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
});

test("destroy and programmatic replacement release a manually paused timeline", async ({ page }) => {
  await start(page);
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 0, 100); });
  await page.evaluate(() => $ae("panel").present.pop());
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  await page.evaluate(async () => { pointer("pointerdown"); pointer("pointermove", 0, 100); await $ae.unmount(document.getElementById("panel"), "present"); });
  const value = await page.evaluate(() => read());
  expect(value.animations).toBe(0);
  expect(value.classes).toBe("ae--unpop");
});

test("without opt-in or on native controls and scrollbar thumbs, pointer input remains native", async ({ page }) => {
  await start(page, panel('class="ae--unpop"'));
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 0, 25); pointer("pointerup", 0, 25); });
  expect((await page.evaluate(() => read())).classes).toBe("ae--unpop");
  await page.evaluate(() => { document.getElementById("panel").setAttribute("data-ae-present-gesture", "up"); });
  for (const markup of [
    '<input id="input" draggable="false">', '<select id="input" draggable="false"></select>',
    '<textarea id="input" draggable="false"></textarea>',
    '<button id="input">Control</button>', '<a id="input" href="#native">Link</a>',
    '<button draggable="true"><span id="input">Control</span></button>',
    '<a href="#native"><span id="input">Link</span></a>',
    '<button draggable="false"><span id="input" draggable="true">Native drag</span></button>',
    '<div contenteditable><button id="input" draggable="false">Editable</button></div>',
    '<div contenteditable="false"><a id="input" draggable="false">Contenteditable attribute</a></div>',
    '<div data-ae-scrollbar-vertical><button id="input" draggable="false">Scrollbar</button></div>',
    '<div data-ae-scrollbar-horizontal><a id="input" draggable="false">Scrollbar</a></div>'
  ]) {
    await page.evaluate(markup => { document.getElementById("panel").innerHTML = markup; pointer("pointerdown", 0, 200, "input"); pointer("pointermove", 0, 25); pointer("pointerup", 0, 25); }, markup);
    expect((await page.evaluate(() => read())).classes).toBe("ae--unpop");
  }
});

for (const forceLegacy of [false, true]) {
  for (const tag of ["a", "button"]) {
    test(`draggable=false ${tag} descendants scrub Pop, Unpop and Dismiss (legacy=${forceLegacy})`, async ({ page }) => {
      await start(page, panel('class="ae--unpop" data-ae-present-gesture="up" data-ae-present-gesture-dismiss="left"')
        .replace("Content</div>", `<${tag} draggable="false"><span id="control">Handle</span></${tag}></div>`), { forceLegacy });
      await page.evaluate(() => { pointer("pointerdown", 0, 200, "control"); pointer("pointermove", 0, 100); });
      expect((await page.evaluate(() => read())).y).toBeCloseTo(100, 1);
      await page.evaluate(() => { pointer("pointermove", 0, 25); pointer("pointerup", 0, 25); });
      await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
      await page.evaluate(() => { pointer("pointerdown", 0, 0, "control"); pointer("pointermove", 0, 100); });
      expect((await page.evaluate(() => read())).y).toBeCloseTo(100, 1);
      await page.evaluate(() => pointer("pointercancel", 0, 100));
      await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
      await page.evaluate(() => { pointer("pointerdown", 200, 0, "control"); pointer("pointermove", 100, 0); });
      expect((await page.evaluate(() => read())).x).toBeCloseTo(-100, 1);
      await page.evaluate(() => { pointer("pointermove", 25, 0); pointer("pointerup", 25, 0); });
      await expect(page.locator("#panel")).toHaveClass(/\bae--dismissed\b/);
    });
  }
}

for (const tag of ["a", "button"]) {
  test(`interactive ${tag} source warns and forces draggable=false, including replacement`, async ({ page }) => {
    await start(page, panel('class="ae--unpop" data-ae-present-gesture="up" data-ae-present-gesture-source="source"')
      .replace('<div id="source" style="width:200px;height:40px">Handle</div>', `<${tag} id="source"><span id="control">Handle</span></${tag}>`));
    await expect(page.locator("#source")).toHaveAttribute("draggable", "false");
    const warnings = () => page.evaluate(() => $ae.diagnostics.showHistory().filter(entry => entry.code === 2026 && entry.context.attribute === "draggable")
      .map(entry => ({ level: entry.level, value: entry.context.value, element: entry.context.element.id, reason: entry.context.reason })));
    expect(await warnings()).toEqual([expect.objectContaining({ level: 1, value: null, element: "source", reason: expect.stringContaining("automatically") })]);
    await page.evaluate(() => { pointer("pointerdown", 0, 200, "control"); pointer("pointermove", 0, 100); });
    expect((await page.evaluate(() => read())).y).toBeCloseTo(100, 1);
    await page.evaluate(() => { pointer("pointermove", 0, 25); pointer("pointerup", 0, 25); });
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
    await page.evaluate(async tag => {
      await $ae("panel").present.unpop();
      document.getElementById("source").outerHTML = `<${tag} id="source" draggable="true"><span id="control">Replacement</span></${tag}>`;
    }, tag);
    await expect(page.locator("#source")).toHaveAttribute("draggable", "false");
    expect(await warnings()).toEqual(expect.arrayContaining([expect.objectContaining({ level: 1, value: "true", element: "source" })]));
    await page.evaluate(() => { pointer("pointerdown", 0, 200, "control"); pointer("pointermove", 0, 25); pointer("pointerup", 0, 25); });
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  });

  test(`draggable=false ${tag} source preserves native activation and suppresses the drag click`, async ({ page }) => {
    await start(page, `<form id="form">${panel('class="ae--unpop" data-ae-present-gesture="up" data-ae-present-gesture-source="source"')
      .replace('<div id="source" style="width:200px;height:40px">Handle</div>',
        `<${tag} id="source" draggable="false" ${tag === "a" ? 'href="#native"' : 'type="submit"'} style="display:block;width:200px;height:220px"><span id="control" style="display:block;width:100%;height:100%">Handle</span></${tag}>`)}</form>`);
    await page.evaluate(() => {
      window.clicks = 0; window.submits = 0;
      document.getElementById("source").addEventListener("click", () => clicks++);
      document.getElementById("form").addEventListener("submit", event => { event.preventDefault(); submits++; });
    });
    expect(await page.evaluate(() => $ae.diagnostics.showHistory().some(entry => entry.code === 2026 && entry.context.attribute === "draggable"))).toBe(false);
    const box = await page.locator("#control").boundingBox();
    await page.mouse.click(box.x + 20, box.y + 175);
    expect(await page.evaluate(() => clicks)).toBe(1);
    if (tag === "a") await expect.poll(() => page.evaluate(() => location.hash)).toBe("#native");
    else expect(await page.evaluate(() => submits)).toBe(1);
    await page.mouse.move(box.x + 20, box.y + 175);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + 25, { steps: 5 });
    expect((await page.evaluate(() => read())).y).toBeCloseTo(50, 1);
    await page.mouse.up();
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
    expect(await page.evaluate(() => clicks)).toBe(1);
    expect(await page.evaluate(() => submits)).toBe(tag === "button" ? 1 : 0);
  });
}

for (const easing of ["cubic-bezier(.4,.1,.8,.5)", "backOut", "steps(4)"]) {
  test(`nonlinear release keeps its rendered position (${easing})`, async ({ page }) => {
    await start(page, panel(undefined, easing === "backOut" ? "--ae-pop-aellux-ease:backOut" : `--ae-pop-ease:${easing}`));
    const result = await page.evaluate(() => {
      pointer("pointerdown", 0, 200); pointer("pointermove", 0, 70);
      const before = read(); pointer("pointerup", 0, 50); return { before, after: read() };
    });
    expect(result.before.y).toBeCloseTo(70, 1);
    expect(result.after.y).toBeCloseTo(result.before.y, 1);
    expect(result.after.progress).toBeCloseTo(result.before.progress, 2);
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
    await page.evaluate(() => { window.reversePromise = $ae("panel").present.unpop(); });
    await expect(page.locator("#panel")).toHaveClass(/ae--unpopping/);
    await expect.poll(() => page.evaluate(() => +getComputedStyle(document.getElementById("panel")).getPropertyValue("--ae-pop-progress"))).toBeLessThan(.95);
    await page.evaluate(() => reversePromise);
  });
}

for (const grid of [false, true]) {
  test(`height scrubbing uses captured size tracks (grid=${grid})`, async ({ page }) => {
    await start(page, `<div id="source">Handle</div><div id="panel" hidden data-ae-present="height"
      data-ae-present-gesture="up" data-ae-present-gesture-source="source"
      style="width:200px;--ae-pop-duration:300ms;--ae-pop-ease:linear;--ae-present-gesture-distance:200px">
      <div ${grid ? "data-ae-present-motion" : ""}><div style="height:200px;width:100px">Content</div></div></div>`);
    await page.evaluate(() => { pointer("pointerdown", 0, 200, "source"); pointer("pointermove", 0, 100); });
    await expect.poll(() => page.locator("#panel").evaluate(element => element.getBoundingClientRect().height)).toBeCloseTo(100, 0);
    await page.evaluate(() => pointer("pointerup", 0, 100));
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
    expect(await page.locator("#panel").evaluate(element => element.getBoundingClientRect().height)).toBeCloseTo(200, 0);
    await page.evaluate(() => { pointer("pointerdown"); pointer("pointermove", 0, 150); pointer("pointerup", 0, 150); });
    await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
    expect((await page.evaluate(() => read())).hidden).toBe(true);
  });
}

test("independent Dismiss scrubs grid sizing from Pop and reverses its own track on cancel", async ({ page }) => {
  await start(page, `<div id="panel" class="ae--pop" data-ae-present="height" data-ae-present-gesture="up"
    data-ae-present-gesture-dismiss="left" style="width:200px;--ae-pop-duration:300ms;--ae-dismiss-duration:300ms;
    --ae-pop-ease:linear;--ae-dismiss-ease:linear;--ae-present-gesture-distance:200px">
    <div data-ae-present-motion><div style="height:200px">Content</div></div></div>`);
  await page.evaluate(() => { pointer("pointerdown", 200); pointer("pointermove", 100); });
  expect(await page.locator("#panel").evaluate(element => element.getBoundingClientRect().height)).toBeCloseTo(100, 0);
  await page.evaluate(() => pointer("pointercancel", 100));
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  expect(await page.locator("#panel").evaluate(element => element.getBoundingClientRect().height)).toBeCloseTo(200, 0);
});

test("initial Dismissed, auto distance, and author display:none restore correctly", async ({ page }) => {
  await start(page, panel('class="ae--dismissed" data-ae-present-gesture="up" data-ae-present-gesture-source="source"', "--ae-present-gesture-distance:auto") +
    '<style>#panel.ae--dismissed{display:none}</style>');
  expect((await page.evaluate(() => read())).classes).toBe("ae--dismissed");
  await page.evaluate(() => { pointer("pointerdown", 0, 200, "source"); pointer("pointermove", 0, 50); pointer("pointercancel", 0, 50); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--dismissed\b/);
  expect(await page.locator("#panel").evaluate(element => [getComputedStyle(element).display, element.style.display])).toEqual(["none", ""]);
  await page.evaluate(() => { pointer("pointerdown", 0, 200, "source"); pointer("pointermove", 0, -100); pointer("pointerup", 0, -100); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  expect(await page.locator("#panel").evaluate(element => element.style.display)).toBe("");
});

test("native touch dragging follows local touch-action without claiming the document", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Touch movement injection uses Chromium's input protocol.");
  const context = await browser.newContext({ hasTouch: true });
  const page = await context.newPage();
  try {
    await start(page, panel(undefined, "touch-action:pan-x"));
    const input = await context.newCDPSession(page);
    const box = await page.locator("#panel").boundingBox();
    const point = { x: box.x + 40, y: box.y + 150, id: 1 };
    await input.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    await input.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 50 }] });
    await input.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 150 }] });
    await expect.poll(() => page.evaluate(() => read().progress)).toBeCloseTo(.75, 1);
    expect(await page.evaluate(() => document.documentElement.style.touchAction)).toBe("");
    await input.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  } finally { await context.close(); }
});

test("gesture preflight veto, axis mismatch and second touch keep a safe origin", async ({ page }) => {
  await start(page);
  await page.evaluate(() => { document.getElementById("panel").addEventListener("AelluxJsBeforePop", event => event.preventDefault(), { once: true }); pointer("pointerdown", 0, 200); pointer("pointermove", 0, 50); pointer("pointerup", 0, 50); });
  expect((await page.evaluate(() => read())).classes).toBe("ae--unpop");
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 100, 200); pointer("pointerup", 100, 200); });
  expect((await page.evaluate(() => read())).classes).toBe("ae--unpop");
  await page.evaluate(() => { pointer("pointerdown", 0, 200, "panel", { pointerType: "touch" }); pointer("pointermove", 0, 50, "panel", { pointerType: "touch" }); pointer("pointerdown", 0, 50, "panel", { pointerType: "touch", pointerId: 8, isPrimary: false }); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
});

test("responsive CSS is reread at the next gesture and invalid distance falls back", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await start(page, panel() + '<style>@media(max-width:600px){#panel{--ae-present-gesture-distance:400px}}</style>');
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 0, 100); pointer("pointercancel", 0, 100); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
  await page.locator("#panel").evaluate(element => element.style.removeProperty("--ae-present-gesture-distance"));
  await page.setViewportSize({ width: 500, height: 700 });
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 0, 100); });
  expect((await page.evaluate(() => read())).progress).toBeCloseTo(.25, 2);
  await page.evaluate(() => pointer("pointercancel"));
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
  await page.locator("#panel").evaluate(element => element.style.setProperty("--ae-present-gesture-distance", "-1px"));
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 0, 100); });
  expect((await page.evaluate(() => read())).progress).toBeCloseTo(.5, 2);
  expect(await page.evaluate(() => $ae.diagnostics.showHistory().some(entry => entry.code === 2026 && entry.context.attribute === "--ae-present-gesture-distance"))).toBe(true);
});

test("a completed real mouse drag suppresses its click; a press remains a click", async ({ page }) => {
  await start(page, panel('class="ae--unpop" data-ae-present-gesture="up"', "--ae-from-transform:translateY(0px);--ae-pop-transform:translateY(-200px)"));
  await page.evaluate(() => { window.clicks = 0; document.addEventListener("click", () => clicks++); });
  const box = await page.locator("#panel").boundingBox();
  await page.mouse.click(box.x + 20, box.y + 150);
  expect(await page.evaluate(() => clicks)).toBe(1);
  await page.mouse.move(box.x + 20, box.y + 150);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + 25, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  expect(await page.evaluate(() => clicks)).toBe(1);
});

test("group selection and trigger expansion follow the actual gesture destination", async ({ page }) => {
  await start(page, '<button id="trigger" data-ae-present-target="panel" data-ae-present-trigger="pop">Open</button>' +
    '<div id="group" data-ae-present-group>' + panel() + '</div>');
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 0, 150); pointer("pointerup", 0, 150); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
  await expect(page.locator("#trigger")).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => $ae("group").present.selected()?.id || null)).toBe(null);
  await page.evaluate(() => { pointer("pointerdown", 0, 200); pointer("pointermove", 0, 25); pointer("pointerup", 0, 25); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("panel");
  await page.evaluate(() => { pointer("pointerdown"); pointer("pointermove", 0, 50); pointer("pointerup", 0, 50); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("panel");
  await expect(page.locator("#trigger")).toHaveAttribute("aria-expanded", "true");
});

test("scrollable descendants keep native movement and scrolling", async ({ page }) => {
  await start(page, panel().replace("Content</div>", '<div id="scroller" style="height:100px;overflow:auto"><div id="content" style="height:500px">Scrollable</div></div></div>'));
  const prevented = await page.evaluate(() => {
    pointer("pointerdown", 0, 200, "content");
    const event = new PointerEvent("pointermove", { bubbles: true, cancelable: true, pointerId: 7, clientY: 50 });
    document.dispatchEvent(event); pointer("pointerup", 0, 50); return event.defaultPrevented;
  });
  expect(prevented).toBe(false);
  expect((await page.evaluate(() => read())).classes).toBe("ae--unpop");
  await page.locator("#scroller").hover();
  await page.mouse.wheel(0, 100);
  await expect.poll(() => page.locator("#scroller").evaluate(element => element.scrollTop)).toBeGreaterThan(0);
});

test("Scrollbox keeps an entire drag, and a new outward drag at its edge reaches Present", async ({ page }) => {
  await start(page, panel('class="ae--pop" data-ae-present-gesture="up"')
    .replace("Content</div>", '<div id="scroller" data-ae-scrollbox="pointer" data-ae-scrollbox-momentum="false" style="height:100px;overflow:auto"><div id="content" style="height:500px"></div></div></div>'),
  { withScrollbox: true });
  const box = await page.locator("#scroller").boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.locator("#scroller").evaluate(element => { element.scrollTo({ top: 150, behavior: "instant" }); });
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 60, { steps: 6 });
  await page.mouse.up();
  expect(await page.locator("#scroller").evaluate(element => element.scrollTop)).toBeLessThan(150);
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);

  await page.locator("#scroller").evaluate(element => { element.scrollTo({ top: 40, behavior: "instant" }); });
  await expect(page.locator("#scroller")).toHaveJSProperty("scrollTop", 40);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 260, { steps: 26 });
  await page.mouse.up();
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  await expect(page.locator("#scroller")).toHaveJSProperty("scrollTop", 0);

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 260, { steps: 26 });
  await page.mouse.up();
  await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
  await expect(page.locator("#scroller")).toHaveJSProperty("scrollTop", 0);

  await page.evaluate(() => $ae("panel").present.pop());
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - 40, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  await expect.poll(() => page.locator("#scroller").evaluate(element => element.scrollTop)).toBeGreaterThan(0);
});

test("touch scroll reaches an edge before a separate outward drawer gesture", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Touch injection uses Chromium's input protocol.");
  const context = await browser.newContext({ hasTouch: true });
  const page = await context.newPage();
  try {
    await start(page, panel('class="ae--pop" data-ae-present-gesture="up"')
      .replace("Content</div>", '<div id="scroller" data-ae-scrollbox style="height:100px;overflow:auto"><div style="height:500px"></div></div></div>'),
    { withScrollbox: true });
    const box = await page.locator("#scroller").boundingBox();
    await page.evaluate(() => {
      window.touchCancels = 0;
      window.addEventListener("pointercancel", () => touchCancels++, true);
    });
    const input = await context.newCDPSession(page);
    const touch = async (distance) => {
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 };
      await input.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
      for (let step = 1; step <= 8; step++)
        await input.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y + distance * step / 8 }] });
      await input.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    await page.locator("#scroller").evaluate(element => element.scrollTo({ top: 40, behavior: "instant" }));
    await touch(220);
    await expect(page.locator("#scroller")).toHaveJSProperty("scrollTop", 0);
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
    const cancelsAfterScroll = await page.evaluate(() => touchCancels);
    await touch(220);
    await expect(page.locator("#panel")).toHaveClass(/\bae--unpop\b/);
    expect(await page.evaluate(() => touchCancels)).toBe(cancelsAfterScroll);
    await page.evaluate(() => $ae("panel").present.pop());
    await touch(-60);
    await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
    await expect.poll(() => page.locator("#scroller").evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  } finally { await context.close(); }
});

test("a more specific gesture source wins over document ownership", async ({ page }) => {
  await start(page, panel('class="ae--unpop" data-ae-present-gesture="up" data-ae-present-gesture-source="source"') +
    panel('class="ae--unpop" data-ae-present-gesture="up" data-ae-present-gesture-source="document"').replaceAll('id="panel"', 'id="second"').replaceAll('id="source"', 'id="second-source"'));
  await page.evaluate(() => { pointer("pointerdown", 0, 200, "source"); pointer("pointermove", 0, 25); pointer("pointerup", 0, 25); });
  await expect(page.locator("#panel")).toHaveClass(/\bae--pop\b/);
  await expect(page.locator("#second")).toHaveClass(/\bae--unpop\b/);
});
