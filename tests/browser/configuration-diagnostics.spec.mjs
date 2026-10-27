import { expect, test } from "@playwright/test";

async function start(page, markup, { deferPresent = false, ...options } = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ deferPresent, options }) => {
    if (deferPresent) AelluxJs.ext("present", { load: false });
    AelluxJs.init({
      mode: "full", environment: "development", verboseLevel: "error", skipGlobalMount: true, ...options
    });
  }, { deferPresent, options });
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

for (const forceLegacy of [false, true]) test(`initial HTML source diagnoses duplicate attributes once (${forceLegacy ? "Legacy" : "Modern"})`, async ({ page }) => {
  let requests = 0;
  await page.route("**/duplicate-source.html", route => {
    requests++;
    return route.fulfill({ contentType: "text/html", body: `<!doctype html>
<div id="duplicate" class="first" CLASS='discarded' style="color:red" style="display:none">visible</div>
<template><input disabled DISABLED></template>
<script>window.example = '<div class=a class=b>';</script>` });
  });
  await page.goto("/duplicate-source.html");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(forceLegacy => AelluxJs.init({
    mode: "basic", environment: "development", verboseLevel: "error", forceLegacy
  }), forceLegacy);
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2032).length)).toBe(3);
  const entries = await page.evaluate(() => AelluxJs.diagnostics.showHistory()
    .filter(entry => entry.code === 2032).map(entry => entry.context));
  expect(entries).toEqual(expect.arrayContaining([
    expect.objectContaining({ attribute: "class", value: "first", values: ["first", "discarded"], line: 2,
      source: expect.stringContaining("/duplicate-source.html"), suggestion: expect.stringContaining("class names") }),
    expect.objectContaining({ attribute: "style", values: ["color:red", "display:none"], suggestion: expect.stringContaining("CSS declarations") }),
    expect.objectContaining({ attribute: "disabled", tagName: "input", values: ["", ""] })
  ]));
  await expect(page.locator("#duplicate")).toHaveClass("first");
  await expect(page.locator("#duplicate")).toBeVisible();
  await page.evaluate(async () => {
    await AelluxJs.mount(document);
    await AelluxJs.mountManager.update(document);
  });
  expect((await diagnostics(page)).filter(entry => entry.code === 2032)).toHaveLength(3);
  expect(requests).toBe(2); // Initial navigation and one source inspection.
});

test("source inspection respects mount scope and never blocks a mount on a pending request", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic", environment: "development", skipGlobalMount: true }));
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  const result = await page.evaluate(async () => {
    let requests = 0;
    AelluxJs.request = () => { requests++; return new Promise(() => {}); };
    await AelluxJs.mount(document.body);
    await AelluxJs.mount(document, []);
    await AelluxJs.mountManager.update(document);
    const scopedRequests = requests;
    await AelluxJs.mount(document);
    await AelluxJs.mount(document);
    return { scopedRequests, requests };
  });
  expect(result).toEqual({ scopedRequests: 0, requests: 1 });
});

test("unavailable initial source remains optional and is not requested repeatedly", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic", environment: "development", skipGlobalMount: true }));
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  const result = await page.evaluate(async () => {
    let requests = 0;
    AelluxJs.request = () => { requests++; return Promise.reject(new Error("Source unavailable")); };
    const mounted = await AelluxJs.mount(document);
    await AelluxJs.mount(document);
    return { requests, mounted, errors: AelluxJs.diagnostics.showHistory().filter(entry => entry.level === 0) };
  });
  expect(result).toEqual({ requests: 1, mounted: [], errors: [] });
});

for (const forceLegacy of [false, true]) test(`AJAX diagnoses the raw response before duplicate attributes are discarded (${forceLegacy ? "Legacy" : "Modern"})`, async ({ page }) => {
  await start(page, '<main id="content">old</main>', { forceLegacy });
  await page.evaluate(async () => { AelluxJs.ext("ajax-href"); await AelluxJs.wait("ajax-href"); });
  let requests = 0;
  await page.route("**/duplicate-response", route => {
    requests++;
    return route.fulfill({ contentType: "text/html", body: '<main id="content" class="first" class="second" style="color:red" STYLE="display:none">new</main>' });
  });
  await page.evaluate(async () => {
    await AelluxJs.ext.ajaxHref.load("/duplicate-response", "#content", { ignoreHistory: true });
    await AelluxJs.ext.ajaxHref.load("/duplicate-response", "#content", { ignoreHistory: true });
  });
  expect(requests).toBe(2); // No source refetch for either AJAX response.
  const entries = (await diagnostics(page)).filter(entry => entry.code === 2032);
  expect(entries).toHaveLength(2);
  expect(entries.map(entry => entry.attribute)).toEqual(["class", "style"]);
  await expect(page.locator("#content")).toHaveClass("first");
  await expect(page.locator("#content")).toBeVisible();
  await expect(page.locator("#content")).toHaveText("new");
});

test("production neither refetches initial HTML nor inspects duplicate AJAX attributes", async ({ page }) => {
  await start(page, '<main id="content">old</main>', { environment: "production", verboseLevel: "warn" });
  await page.evaluate(async () => { AelluxJs.ext("ajax-href"); await AelluxJs.wait("ajax-href"); });
  await page.route("**/duplicate-response", route => route.fulfill({ contentType: "text/html", body: '<main id="content" class="a" class="b">new</main>' }));
  const requests = await page.evaluate(async () => {
    const original = AelluxJs.request;
    const requests = [];
    AelluxJs.request = (...args) => { requests.push(args[0]); return original(...args); };
    await AelluxJs.mount(document);
    await AelluxJs.ext.ajaxHref.load("/duplicate-response", "#content", { ignoreHistory: true });
    return requests;
  });
  expect(requests).toEqual(["/duplicate-response"]);
  expect((await diagnostics(page)).filter(entry => entry.code === 2032)).toEqual([]);
  await expect(page.locator("#content")).toHaveText("new");
});

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
  await start(page, '<div id="unmounted" data-ae-present></div>', { mode: "basic", deferPresent: true });
  await page.evaluate(() => AelluxJs("unmounted"));
  expect(await diagnostics(page)).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 2025, element: "unmounted", suggestion: expect.stringContaining('wait("present")') }),
    expect.objectContaining({ code: 1004, element: "unmounted", suggestion: expect.stringContaining("await $ae.mount") })
  ]));
});

for (const forceLegacy of [false, true]) test(`Present/Anchor transform conflict reports Anchor priority (${forceLegacy ? "Legacy" : "Modern"})`, async ({ page }) => {
  await start(page, `<div style="position:relative">
    <button id="trigger">Open</button>
    <div id="conflict" data-ae-anchor="bottom-left:top-left" data-ae-anchor-target="trigger" data-ae-present="opacity transform" hidden></div>
    <div id="all" data-ae-anchor="bottom-left:top-left" data-ae-anchor-target="trigger" data-ae-present="all" hidden></div>
    <div id="safe" data-ae-anchor="bottom-left:top-left" data-ae-anchor-target="trigger" data-ae-present="opacity" hidden></div>
  </div>`, { forceLegacy });
  const entries = (await diagnostics(page)).filter(entry => entry.code === 2031);
  expect(entries.map(entry => entry.element).sort()).toEqual(["all", "conflict"]);
  expect(entries).toEqual(expect.arrayContaining([
    expect.objectContaining({ element: "conflict", attribute: "data-ae-present", value: "opacity transform",
      reason: expect.stringContaining("Anchor takes priority"), suggestion: expect.stringContaining("child") })
  ]));
  await page.evaluate(() => AelluxJs.mount(document));
  expect((await diagnostics(page)).filter(entry => entry.code === 2031)).toHaveLength(2);
  await page.evaluate(async () => {
    document.getElementById("safe").setAttribute("data-ae-present", "transform");
    await AelluxJs.mountManager.update("safe", "anchor");
  });
  expect((await diagnostics(page)).filter(entry => entry.code === 2031).map(entry => entry.element))
    .toContain("safe");
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

test("Anchor targeting a group with no selected member remains quiet", async ({ page }) => {
  await start(page, `<div style="position:relative;width:300px;height:150px">
    <section id="group" data-ae-present-group data-ae-present-active="">
      <div id="member" data-ae-present hidden style="position:absolute"></div></section>
    <div id="anchor" data-ae-anchor="bottom-center:top-center" data-ae-anchor-target="group"></div></div>`);
  await page.evaluate(() => AelluxJs.mountManager.update(document));
  expect((await diagnostics(page)).filter(entry => entry.code === 2027)).toEqual([]);
});

test("Anchor group targets explain a missing Present Extension", async ({ page }) => {
  await start(page, `<div style="position:relative"><section id="group" data-ae-present-group>
    <div id="member" data-ae-present>Member</div></section>
    <div id="anchor" data-ae-anchor="bottom-left:top-left" data-ae-anchor-target="group"></div></div>`, { mode: "basic", deferPresent: true });
  await page.evaluate(async () => { AelluxJs.ext("anchor", { loadStyle: true }); await AelluxJs.mount(document, "anchor"); });
  expect(await diagnostics(page)).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 2025, element: "anchor", attribute: "data-ae-anchor-target", reason: "A Present Group target requires Present." })
  ]));
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

test("AJAX declarations accept empty defaults and diagnose each selector in a list", async ({ page }) => {
  await start(page, `<main id="content">original</main>
    <a id="empty" href="/next" data-ae-ajax-href></a>
    <a id="whitespace" href="/next" data-ae-ajax-href="   "></a>
    <a id="valid" href="/next" data-ae-ajax-href=':is(#content, #other), body'></a>
    <a id="partial" href="/next" data-ae-ajax-href="#content, #absent"></a>
    <a id="invalid" href="/next" data-ae-ajax-href="["></a>`);
  const entries = (await diagnostics(page)).filter(entry =>
    entry.attribute === "data-ae-ajax-href" && entry.code === 2026);
  expect(entries.map(entry => ({ element: entry.element, reason: entry.reason }))).toEqual([
    { element: "partial", reason: "No current content matches the AJAX selector." },
    { element: "invalid", reason: "The AJAX selector is invalid." }
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
