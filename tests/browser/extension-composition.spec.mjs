import { expect, test } from "@playwright/test";

async function start(page, markup, options = {}) {
  const { minified = false, ...runtimeOptions } = options;
  await page.goto("/tests/index.htm");
  await page.evaluate(markup => { document.body.innerHTML = markup; }, markup);
  await page.addScriptTag({ url: minified ? "/dist/aellux.min.js" : "/dist/aellux.js" });
  await page.evaluate(options => AelluxJs.init({ mode: "full", environment: "development", ...options }), runtimeOptions);
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  await page.evaluate(() => AelluxJs.mount(document));
}

const gallery = (attributes = "", wrapperAttributes = "") => `<div id="box" data-ae-scrollbox="pointer" ${attributes}
  style="width:300px;height:100px;overflow:auto"><div id="wrapper" ${wrapperAttributes}
  style="display:inline-flex;width:900px;height:100px">
  ${[0, 1, 2].map(i => `<div id="item${i}" data-ae-snap-item="start" style="flex:none;width:300px;height:100px"></div>`).join("")}
  </div></div>`;

for (const cssMotionController of [true, false]) {
  test(`Feedback replaces Anchor positioning during transform motion (controlled=${cssMotionController})`, async ({ page }) => {
    await start(page, `<div style="position:relative;margin:100px;width:500px;height:300px">
      <button id="target" style="margin-left:150px">Target</button>
      <div id="anchor" data-ae-anchor="bottom-right:top-right" data-ae-anchor-target="target"
        data-ae-anchor-match="width" data-ae-feedback style="height:50px">Panel</div></div>`, { cssMotionController });
    await expect.poll(() => page.locator("#anchor").evaluate(el => Math.abs(el.getBoundingClientRect().right - document.getElementById("target").getBoundingClientRect().right))).toBeLessThan(1);
    const result = await page.evaluate(async () => {
      const el = document.getElementById("anchor");
      const before = el.getBoundingClientRect().right;
      AelluxJs.ext.feedback.error("", el, null, "shake");
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return { displacement: Math.abs(el.getBoundingClientRect().right - before),
        warnings: AelluxJs.diagnostics.showHistory().filter(e => e.code === 2033).map(e => e.context.property) };
    });
    expect(result.displacement).toBeGreaterThan(30);
    expect(result.warnings).toContain("transform");
  });
}

test("Elastic wrapper conflicts are diagnosed but opacity and child motion remain composable", async ({ page }) => {
  await start(page, gallery("", 'data-ae-scrollbox-elastic data-ae-present="transform" data-ae-feedback'));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => e.code === 2033).length)).toBe(1);
  await page.evaluate(() => AelluxJs.ext.feedback.error("", document.getElementById("wrapper"), null, "pulse"));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => e.code === 2033).map(e => e.context.writers))).toEqual([
    ["scrollbox-elastic", "present"], ["scrollbox-elastic", "feedback"], ["present", "feedback"]
  ]);
  await start(page, gallery("", 'data-ae-scrollbox-elastic data-ae-present="opacity"') +
    '<div data-ae-feedback data-ae-transform-target="child" data-ae-anchor="bottom-left:top-left"><span id="child">Child</span></div>');
  await page.evaluate(() => AelluxJs.ext.feedback.error("", document.getElementById("child"), null, "shake"));
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => e.code === 2033).length)).toBe(0);
});

test("Snap diagnoses item transforms while allowing child transforms and disabled Snap", async ({ page }) => {
  await start(page, gallery('data-ae-scrollbox-snap').replace('id="item1"', 'id="item1" class="scaled"') +
    '<style>.scaled{transform:scale(.8)}</style>');
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => e.code === 2020).map(e => e.context.element.id))).toEqual(["item1"]);
  await start(page, gallery('data-ae-scrollbox-snap="false"').replace('id="item1"', 'id="item1" class="scaled"') +
    '<style>.scaled{transform:scale(.8)}</style>');
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => e.code === 2020).length)).toBe(0);
  await start(page, gallery('data-ae-scrollbox-snap') +
    '<style>#item1>span{display:block;transform:scale(.8)}</style>');
  await page.evaluate(async () => {
    document.getElementById("item1").innerHTML = "<span>Child</span>";
    await AelluxJs.mountManager.update(document);
  });
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => e.code === 2020).length)).toBe(0);
});

test("Snap defers initial alignment until its Present container is measurable", async ({ page }) => {
  await start(page, '<div id="panel" data-ae-present="" hidden>' +
    gallery('data-ae-scrollbox-snap').replace('width:900px', 'padding-left:100px;width:900px') + '</div>');
  await page.evaluate(() => $ae("panel").present.pop());
  await expect.poll(() => page.locator("#box").evaluate(el => el.scrollLeft)).toBe(100);
});

test("Snap refreshes item variables when content resizes without resizing the box", async ({ page }) => {
  await start(page, gallery('data-ae-scrollbox-snap'));
  await page.evaluate(() => { document.getElementById("item1").style.width = "150px"; });
  await expect.poll(() => page.locator("#item1").evaluate(el => {
    const box = document.getElementById("box"), rect = el.getBoundingClientRect();
    const distance = rect.left - box.getBoundingClientRect().left - box.clientLeft;
    const expected = Math.max(0, 1 - Math.abs(distance) / box.clientWidth);
    return Math.abs(Number(el.style.getPropertyValue("--ae-snap-focus")) - expected);
  })).toBeLessThan(.001);
});

for (const failure of ["network", "missing", "veto"]) {
  test(`Ajax ${failure} preserves the URL and history when no region is replaced`, async ({ page }) => {
    await start(page, '<a data-ae-ajax-href="#content" href="/next.htm">Next</a><main id="content">Original</main>');
    const result = await page.evaluate(async failure => {
      const before = { url: location.href, length: history.length };
      AelluxJs.request = failure === "network" ? async () => { throw new Error("offline"); } :
        async () => ({ url: "/next.htm", text: async () => failure === "missing" ? "<p>Missing</p>" : '<main id="content">New</main>' });
      if (failure === "veto") AelluxJs.on("BeforeUnmount", e => e.preventDefault());
      try { await AelluxJs.ext.ajaxHref.load("/next.htm", "#content"); } catch (_) { /* Expected network failure. */ }
      return { before, after: { url: location.href, length: history.length }, content: document.getElementById("content").textContent };
    }, failure);
    expect(result.after).toEqual(result.before);
    expect(result.content).toBe("Original");
  });
}

test("Feedback transform masks an active elastic transform", async ({ page }) => {
  await start(page, gallery("", "data-ae-scrollbox-elastic data-ae-feedback"));
  const result = await page.evaluate(async () => {
    const box = document.getElementById("box"), wrapper = document.getElementById("wrapper");
    box.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: -100 }));
    const elastic = wrapper.style.transform;
    AelluxJs.ext.feedback.error("", wrapper, null, "pulse");
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { elastic, inline: wrapper.style.transform, effective: getComputedStyle(wrapper).transform,
      warnings: AelluxJs.diagnostics.showHistory().filter(e => e.code === 2033).map(e => e.context.writers) };
  });
  expect(result.elastic).toContain("scale(");
  expect(result.inline).toContain("scale(");
  expect(result.effective).not.toBe(await page.evaluate(value => new DOMMatrix(value).toString(), result.inline));
  expect(result.warnings).toContainEqual(["scrollbox-elastic", "feedback"]);
});

test("An active elastic inline transform prevents Present's requested transform", async ({ page }) => {
  await start(page, gallery("", 'data-ae-scrollbox-elastic data-ae-present="transform"'));
  const result = await page.evaluate(() => {
    const box = document.getElementById("box"), wrapper = document.getElementById("wrapper");
    wrapper.style.transition = "none";
    getComputedStyle(wrapper).transform;
    box.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: -100 }));
    wrapper.style.setProperty("--ae-pop-transform", "scale(2)");
    const inline = new DOMMatrix(wrapper.style.transform), effective = new DOMMatrix(getComputedStyle(wrapper).transform);
    return { difference: Math.max(...["a", "d", "e", "f"].map(key => Math.abs(inline[key] - effective[key]))), scale: effective.a,
      requested: getComputedStyle(wrapper).getPropertyValue("--ae-pop-transform").trim() };
  });
  expect(result.requested).toBe("scale(2)");
  expect(result.difference).toBeLessThan(.001);
  expect(result.scale).not.toBe(2);
});

for (const forceLegacy of [false, true]) test(`Minified composition diagnostics work in ${forceLegacy ? "Legacy" : "Modern"}`, async ({ page }) => {
  await start(page, gallery('data-ae-scrollbox-snap', "data-ae-scrollbox-elastic data-ae-feedback") +
    '<style>#item1{transform:scale(.8)}</style>', { minified: true, forceLegacy });
  await page.evaluate(() => AelluxJs.ext.feedback.error("", document.getElementById("wrapper"), null, "shake"));
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => e.code === 2033).map(e => e.context.writers)))
    .toEqual([["scrollbox-elastic", "feedback"]]);
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => e.code === 2020).length)).toBe(1);
});

test("Point tracking coexists with Scrollbox pointer dragging", async ({ page }) => {
  await start(page, gallery('data-ae-point data-ae-scrollbox-momentum="false"'));
  const result = await page.evaluate(() => {
    const box = document.getElementById("box"), rect = box.getBoundingClientRect();
    const emit = (type, x) => box.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true,
      pointerId: 910, pointerType: "mouse", isPrimary: true, button: 0, buttons: type === "pointerup" ? 0 : 1,
      clientX: rect.left + x, clientY: rect.top + 40 }));
    emit("pointerdown", 200);
    emit("pointermove", 100);
    const pointers = AelluxJs.ext.point.pointers(box);
    const held = { scroll: box.scrollLeft, pointers: pointers.length, pressed: pointers[0]?.pressed };
    emit("pointerup", 100);
    return { held, released: AelluxJs.ext.point.pointers(box).filter(pointer => pointer.pressed).length };
  });
  expect(result).toEqual({ held: { scroll: 100, pointers: 1, pressed: true }, released: 0 });
});

for (const cssMotionController of [true, false]) {
  test(`Opacity-only and additive Feedback effects avoid transform warnings (controlled=${cssMotionController})`, async ({ page }) => {
    await start(page, `<style>
      .ae--feedback-motion-fade{animation:fade 1s} @keyframes fade{from{opacity:.2}to{opacity:1}}
      .ae--feedback-motion-add{animation:add 1s;animation-composition:add} @keyframes add{from{transform:translateX(0)}to{transform:translateX(5px)}}
      </style><div id="anchor" data-ae-anchor="bottom-left:top-left" data-ae-feedback>Panel</div>`, { cssMotionController });
    for (const motion of ["fade", "add"]) {
      await page.evaluate(motion => AelluxJs.ext.feedback.error("", document.getElementById("anchor"), null, motion), motion);
      await page.waitForTimeout(100);
    }
    expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => e.code === 2033).length)).toBe(0);
  });
}

test("Production skips resource and transformed Snap diagnostics", async ({ page }) => {
  await start(page, gallery('data-ae-scrollbox-snap', 'data-ae-scrollbox-elastic data-ae-present="transform" data-ae-feedback') +
    '<style>#item1{transform:scale(.8)}</style>', { environment: "production" });
  await page.evaluate(() => AelluxJs.ext.feedback.error("", document.getElementById("wrapper"), null, "pulse"));
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(e => [2020, 2033].includes(e.code)).length)).toBe(0);
});

test("Ajax commits one history entry after a partial veto with external Feedback listeners", async ({ page }) => {
  await start(page, '<a data-ae-ajax-href="#one,#two" href="/next.htm">Next</a><main id="one">Old one</main><aside id="two">Old two</aside>');
  const result = await page.evaluate(async () => {
    await AelluxJs.wait("feedback");
    const payloads = [];
    AelluxJs.ext.feedback.on("*", payload => payloads.push({ type: payload.type, target: payload.target.id, value: payload.value }));
    // The application owns this connection; Ajax Href only emits lifecycle events.
    for (const [name, busy] of [["AjaxHrefStart", true], ["AjaxHrefComplete", false]]) {
      AelluxJs.on(name, () => {
        for (const id of ["one", "two"]) {
          AelluxJs.ext.feedback.busy("Navigation", document.getElementById(id), busy);
        }
      });
    }
    AelluxJs.request = async () => ({ url: "/next.htm", text: async () => '<main id="one">New one</main><aside id="two">New two</aside>' });
    AelluxJs.on("BeforeUnmount", event => { if (event.detail.root.id === "two") event.preventDefault(); });
    const before = history.length;
    await AelluxJs.ext.ajaxHref.load("/next.htm", "#one,#two");
    return { added: history.length - before, path: location.pathname, one: document.getElementById("one").textContent,
      two: document.getElementById("two").textContent, payloads,
      invalid: AelluxJs.diagnostics.showHistory().filter(e => e.code === 1122).length };
  });
  expect(result).toMatchObject({ added: 1, path: "/next.htm", one: "New one", two: "Old two", invalid: 0 });
  expect(result.payloads).toContainEqual({ type: "busy", target: "one", value: true });
  expect(result.payloads).toContainEqual({ type: "busy", target: "two", value: false });
});

test("A superseded Ajax response cannot replace content or create a stale history entry", async ({ page }) => {
  await start(page, '<a data-ae-ajax-href="#content" href="/next.htm">Next</a><main id="content">Original</main>');
  const result = await page.evaluate(async () => {
    let resolveOld;
    AelluxJs.request = url => url === "/old.htm" ? new Promise(resolve => { resolveOld = resolve; }) :
      Promise.resolve({ url, text: async () => '<main id="content">Newest</main>' });
    const before = history.length;
    const old = AelluxJs.ext.ajaxHref.load("/old.htm", "#content");
    await AelluxJs.ext.ajaxHref.load("/new.htm", "#content");
    resolveOld({ url: "/old.htm", text: async () => '<main id="content">Stale</main>' });
    await old;
    return { added: history.length - before, path: location.pathname, text: document.getElementById("content").textContent };
  });
  expect(result).toEqual({ added: 1, path: "/new.htm", text: "Newest" });
});
