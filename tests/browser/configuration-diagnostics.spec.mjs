import { expect, test } from "@playwright/test";

async function start(page, markup, options = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => AelluxJs.init({
    mode: "full", environment: "development", verboseLevel: "error", skipGlobalMount: true, ...options
  }), options);
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  await page.evaluate(async markup => {
    document.body.innerHTML = markup;
    await AelluxJs.mount(document);
  }, markup);
}

async function diagnostics(page) {
  return page.evaluate(() => AelluxJs.diagnostics.showHistory().map(entry => ({
    code: entry.code, element: entry.context?.element?.id,
    attribute: entry.context?.attribute, value: entry.context?.value,
    reason: entry.context?.reason, suggestion: entry.context?.suggestion
  })));
}

for (const forceLegacy of [false, true]) test(`declarations diagnose typos, targets, values and keyboard access (${forceLegacy ? "Legacy" : "Modern"})`, async ({ page }) => {
  await start(page, `<div id="typo" data-ae-presnt></div>
    <div id="control" data-ae-trigger="open" data-ae-target="missing"></div>
    <button id="wrong" data-ae-trigger data-ae-target="plain"></button><div id="plain"></div>
    <div id="point" data-ae-point="2.5"></div>`, { forceLegacy });
  const entries = await diagnostics(page);
  expect(entries).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 2024, element: "typo", attribute: "data-ae-presnt", suggestion: expect.stringContaining("data-ae-present") }),
    expect.objectContaining({ code: 2026, element: "control", attribute: "data-ae-trigger", value: "open" }),
    expect.objectContaining({ code: 2027, element: "control", value: "missing" }),
    expect.objectContaining({ code: 2027, element: "wrong", reason: "Target is not a Present container." }),
    expect.objectContaining({ code: 2029, element: "control" }),
    expect.objectContaining({ code: 2026, element: "point" })
  ]));
  for (const entry of entries.filter(entry => entry.code >= 2024 && entry.code <= 2030)) {
    expect(entry.reason).toBeTruthy();
    expect(entry.suggestion).toBeTruthy();
    expect(entry.attribute).toBeTruthy();
  }
  const count = entries.length;
  await page.evaluate(() => AelluxJs.mount(document));
  expect((await diagnostics(page)).length).toBe(count);
});

test("basic reports missing Extensions after mounting and gives actionable controller errors", async ({ page }) => {
  await start(page, '<div id="unmounted" data-ae-present></div>', { mode: "basic" });
  await page.evaluate(() => AelluxJs("unmounted"));
  expect(await diagnostics(page)).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 2025, element: "unmounted", suggestion: expect.stringContaining('wait("present")') }),
    expect.objectContaining({ code: 1004, element: "unmounted", suggestion: expect.stringContaining("await $ae.mount") })
  ]));
});

test("production skips semantic scans even with warning verbosity", async ({ page }) => {
  await start(page, '<div id="typo" data-ae-presnt></div><div data-ae-focus="wrong"></div>', { environment: "production", verboseLevel: "warn" });
  expect((await diagnostics(page)).filter(entry => entry.code >= 2024 && entry.code <= 2030)).toEqual([]);
});

test("scoped mounts validate only the requested Extensions", async ({ page }) => {
  await start(page, "");
  await page.evaluate(async () => {
    document.body.innerHTML = '<div data-ae-presnt></div><div data-ae-point="bad"></div><input data-ae-focus="wrong">';
    await AelluxJs.mount(document, "point");
  });
  const entries = (await diagnostics(page)).filter(entry => entry.code >= 2024 && entry.code <= 2030);
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({ code: 2026, attribute: "data-ae-point" });
});

test("custom selector attributes and unrelated application data are accepted", async ({ page }) => {
  await start(page, "");
  await page.evaluate(async () => {
    AelluxJs.ext("custom", { loadWhen: "[data-ae-presnt]" });
    AelluxJs.extAttach("custom", { init() {
      AelluxJs.mountManager.add({ extensionName: "custom", selector: "[data-ae-presnt]", mount() {} });
    }});
    document.body.innerHTML = '<div data-ae-presnt data-ae-application-owned></div>';
    await AelluxJs.mount(document);
  });
  expect((await diagnostics(page)).filter(entry => entry.code === 2024)).toEqual([]);
});

test("structure, group membership, pivots and Focus report their contracts", async ({ page }) => {
  await start(page, `<div id="snap" data-ae-scrollbox-snap="vertical"></div>
    <div id="elastic" data-ae-scrollbox-elastic></div>
    <section id="group" data-ae-present-group><div data-ae-present hidden></div></section>
    <div id="anchor" data-ae-anchor="bottom:top" data-ae-anchor-target="absent"></div>
    <div id="focus" data-ae-focus="next"></div>`);
  expect(await diagnostics(page)).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 2028, element: "snap" }),
    expect.objectContaining({ code: 2028, element: "elastic" }),
    expect.objectContaining({ code: 2021, element: "group" }),
    expect.objectContaining({ code: 2021, attribute: "id" }),
    expect.objectContaining({ code: 2026, element: "anchor" }),
    expect.objectContaining({ code: 2027, element: "anchor" }),
    expect.objectContaining({ code: 2026, element: "focus" })
  ]));
});

test("snap values and pointer overflow are checked without flagging content that fits", async ({ page }) => {
  await start(page, `<div id="snap" data-ae-scrollbox data-ae-scrollbox-snap="diagonal" style="overflow:auto;width:80px;height:40px">
    <div id="item" data-ae-snap-item="middle" style="width:200px;height:60px"></div></div>
    <div id="blocked" data-ae-scrollbox="pointer" style="overflow:hidden;width:40px;height:40px"><div style="width:100px;height:100px"></div></div>
    <div id="unused-axis" data-ae-scrollbox="pointer" style="overflow-x:hidden;overflow-y:auto;width:40px;height:40px"><div style="width:100px;height:10px"></div></div>
    <div id="fits" data-ae-scrollbox="pointer" style="overflow:hidden;width:100px;height:100px">small</div>`);
  const entries = await diagnostics(page);
  expect(entries).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 2026, element: "snap" }),
    expect.objectContaining({ code: 2026, element: "item" }),
    expect.objectContaining({ code: 2030, element: "blocked" }),
    expect.objectContaining({ code: 2030, element: "unused-axis" })
  ]));
  expect(entries.filter(entry => entry.element === "fits")).toEqual([]);
});

test("valid declarations and hidden Present targets remain quiet", async ({ page }) => {
  await start(page, `<div style="position:relative;width:300px;height:150px">
    <div id="target" data-ae-present hidden style="position:absolute;width:40px;height:20px"></div>
    <div id="anchor" data-ae-anchor="bottom-center:top-center" data-ae-anchor-target="target"></div>
    </div><button data-ae-trigger="pop" data-ae-target="target"></button><input data-ae-focus="next">
    <div data-ae-point="0"></div>`);
  await page.evaluate(() => AelluxJs.mountManager.update(document));
  expect((await diagnostics(page)).filter(entry => entry.code >= 2024 && entry.code <= 2030)).toEqual([]);
});

test("group-driven Anchor ignores its absent fallback while no member is selected", async ({ page }) => {
  await start(page, `<div style="position:relative;width:300px;height:150px">
    <section data-ae-present-group data-ae-present-active="" data-ae-present-group-anchor="anchor">
      <div id="member" data-ae-present hidden style="position:absolute"></div></section>
    <div id="anchor" data-ae-anchor="bottom-center:top-center" data-ae-anchor-target="missing-fallback"></div></div>`);
  await page.evaluate(() => AelluxJs.mountManager.update(document));
  expect((await diagnostics(page)).filter(entry => entry.code === 2027)).toEqual([]);
});

test("computed CSS checks report blocked layout and malformed typed property declarations", async ({ page }) => {
  await start(page, `<style>#panel { display:block!important } #panel[hidden] {display:block!important}</style>
    <div id="panel" data-ae-present="height" hidden style="--ae-pop-duration:fast"><div data-ae-present-motion></div></div>`);
  expect((await diagnostics(page)).filter(entry => entry.code === 2030)).toEqual(expect.arrayContaining([
    expect.objectContaining({ value: "fast", reason: expect.stringContaining("--ae-pop-duration") }),
    expect.objectContaining({ reason: expect.stringContaining("grid") }),
    expect.objectContaining({ reason: expect.stringContaining("hidden") })
  ]));
});

test("runtime target failures are diagnosed in production after declarations change", async ({ page }) => {
  await start(page, '<button id="control" data-ae-trigger="pop" data-ae-target="missing">open</button>', { environment: "production" });
  await page.locator("#control").click();
  expect(await diagnostics(page)).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 2027, element: "control", value: "missing" })
  ]));
});

test("Adaptive rejects invalid numeric boundaries and preserves finite defaults", async ({ page }) => {
  await start(page, "");
  await page.evaluate(async () => {
    AelluxJs.options.extensions.adaptive = { adaptiveParams: {
      ratioShapes: { vertical: 3, horizontal: 1 }, minSizes: { small: -1, large: "huge" }
    }};
    document.body.innerHTML = '<div data-ae-adaptive></div>';
    await AelluxJs.mount(document);
  });
  const entries = (await diagnostics(page)).filter(entry => entry.code === 2026);
  expect(entries.map(entry => entry.attribute)).toEqual(expect.arrayContaining([
    "adaptiveParams.ratioShapes", "adaptiveParams.minSizes.small", "adaptiveParams.minSizes.large"
  ]));
  expect(await page.evaluate(() => AelluxJs.ext.adaptive.adaptiveParams.minSizes.small)).toBe(480);
});

test("AJAX reports invalid, absent current, and absent response selectors", async ({ page }) => {
  await start(page, '<main id="content">original</main>');
  await page.evaluate(() => AelluxJs.wait("ajax-href"));
  const requests = [];
  await page.route("**/diagnostic-response", route => {
    requests.push(route.request().url());
    return route.fulfill({ contentType: "text/html", body: "<main id=other>response</main>" });
  });
  await page.evaluate(async () => {
    await AelluxJs.ext.ajaxHref.load("/diagnostic-response", "[");
    await AelluxJs.ext.ajaxHref.load("/diagnostic-response", "#absent");
    await AelluxJs.ext.ajaxHref.load("/diagnostic-response", "#content");
  });
  expect(requests).toHaveLength(1);
  await expect(page.locator("#content")).toHaveText("original");
  expect((await diagnostics(page)).filter(entry => entry.code === 2027).map(entry => entry.reason)).toEqual([
    "Invalid CSS selector.", "No current element matches the selector.", "No response element matches the selector."
  ]);
});

test("AJAX preserves commas within valid selectors and replaces multiple regions", async ({ page }) => {
  await start(page, '<main id="content">old</main><aside data-region="a,b">old</aside>');
  await page.evaluate(() => AelluxJs.wait("ajax-href"));
  await page.route("**/diagnostic-response", route => route.fulfill({ contentType: "text/html", body: '<main id="content">new</main><aside data-region="a,b">new</aside>' }));
  await page.evaluate(() => AelluxJs.ext.ajaxHref.load("/diagnostic-response", ':is(#content, #other), [data-region="a,b"]'));
  await expect(page.locator("#content")).toHaveText("new");
  await expect(page.locator("aside")).toHaveText("new");
  expect((await diagnostics(page)).filter(entry => entry.code === 2027)).toEqual([]);
});

test("explicit updates diagnose changed declarations and respect CSS ownership", async ({ page }) => {
  await start(page, '<div style="position:relative;width:200px;height:100px"><div id="anchor" data-ae-anchor="center:center" style="--ae-pop-duration:fast"></div></div>');
  expect((await diagnostics(page)).filter(entry => entry.code === 2030)).toEqual([]);
  await page.evaluate(async () => {
    const element = document.getElementById("anchor");
    element.setAttribute("data-ae-anchor", "bottom:top");
    await AelluxJs.mountManager.update(element, "anchor");
  });
  expect(await diagnostics(page)).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 2026, element: "anchor", value: "bottom:top" })
  ]));
});

test("spelling checks use the configured attribute prefix", async ({ page }) => {
  await start(page, "");
  await page.evaluate(async () => {
    const { validateDeclarations } = await import("/src/internal/validate-declarations.js");
    const original = AelluxJs.attr;
    AelluxJs.attr = name => original(name).replace("data-ae-", "data-ui-");
    try {
      document.body.innerHTML = '<div id="typo" data-ui-presnt></div>';
      validateDeclarations(window, document.body);
    } finally { AelluxJs.attr = original; }
  });
  expect(await diagnostics(page)).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 2024, attribute: "data-ui-presnt", suggestion: expect.stringContaining("data-ui-present") })
  ]));
});

test("custom hiding with visibility or ancestor opacity is not called a visible hidden container", async ({ page }) => {
  await start(page, `<style>[data-ae-present][hidden] {display:block!important}</style>
    <div data-ae-present hidden style="visibility:hidden">hidden</div>
    <div style="opacity:0"><div data-ae-present hidden>hidden</div></div>`);
  expect((await diagnostics(page)).filter(entry => entry.code === 2030)).toEqual([]);
});
