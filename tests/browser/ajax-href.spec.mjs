import { expect, test } from "@playwright/test";

for (const variant of [
  { boot: "aellux.js", forceLegacy: false },
  { boot: "aellux.min.js", forceLegacy: false },
  { boot: "aellux.js", forceLegacy: true },
  { boot: "aellux.min.js", forceLegacy: true }
]) {
  test(`Ajax Href settles Feedback for missing regions and request errors (${variant.boot}, legacy=${variant.forceLegacy})`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: `/dist/${variant.boot}` });
    const result = await page.evaluate(async forceLegacy => {
      document.body.innerHTML = '<main id="content">Old</main><aside id="missing">Keep</aside>';
      await new Promise(resolve => {
        AelluxJs.on("Ready", resolve, { once: true });
        AelluxJs.init({ mode: "basic", forceLegacy });
      });
      await Promise.all([AelluxJs.wait("ajax-href"), AelluxJs.wait("feedback")]);
      const payloads = [];
      AelluxJs.ext.feedback.on("*", payload => payloads.push({
        type: payload.type, target: payload.target.id, value: payload.value
      }));
      AelluxJs.request = async () => ({ url: "/next.htm", text: async () => '<main id="content">New</main>' });
      await AelluxJs.ext.ajaxHref.load("/next.htm", "#content,#missing", { ignoreHistory: true });
      const loaded = payloads.splice(0);
      AelluxJs.request = async () => { throw new Error("Request failed"); };
      let error;
      try { await AelluxJs.ext.ajaxHref.load("/failed.htm", "#content,#missing"); }
      catch (cause) { error = cause.message; }
      return { loaded, failed: payloads, error,
        content: document.getElementById("content").textContent,
        missing: document.getElementById("missing").textContent };
    }, variant.forceLegacy);
    const feedback = (target, busy) => [
      { type: "busy", target, value: busy },
      { type: "progress", target, value: busy ? 0 : 1 }
    ];
    const expected = [...feedback("content", true), ...feedback("missing", true),
      ...feedback("content", false), ...feedback("missing", false)];
    expect(result).toEqual({ loaded: expected, failed: expected, error: "Request failed", content: "New", missing: "Keep" });
  });

  test(`Ajax Href activates only for anchors and replaces mounted content (${variant.boot}, legacy=${variant.forceLegacy})`, async ({ page }) => {
    const extensionRequests = [];
    page.on("request", request => {
      if (/aellux\.ext\.ajax-href/.test(request.url())) extensionRequests.push(request.url());
    });
    await page.route("**/ajax-next.htm", route => route.fulfill({
      contentType: "text/html",
      body: '<title>Ajax next</title><main id="content"><span data-probe>New content</span></main>'
    }));
    await page.goto("/tests/index.htm");
    await page.evaluate(() => {
      document.body.innerHTML = '<div data-ae-ajax-href="#content"></div><main id="content"><span data-probe>Old content</span></main>';
    });
    await page.addScriptTag({ url: `/dist/${variant.boot}` });
    await page.evaluate(forceLegacy => new Promise(resolve => {
      document.addEventListener("AelluxJsReady", resolve, { once: true });
      AelluxJs.init({ mode: "full", forceLegacy });
    }), variant.forceLegacy);
    expect(await page.evaluate(() => AelluxJs.ext.ajaxHref?.initialized === true)).toBe(false);
    await page.evaluate(async () => {
      window.lifecycle = [];
      AelluxJs.ext("probe");
      AelluxJs.extAttach("probe", { init() {} });
      await AelluxJs.wait("probe");
      AelluxJs.mountManager.add({
        extensionName: "probe", selector: "[data-probe]",
        mount: element => window.lifecycle.push(`mount:${element.textContent}`),
        unmount: element => window.lifecycle.push(`unmount:${element.textContent}`)
      });
      await AelluxJs.mount(document.querySelector("#content"));
      const link = document.createElement("a");
      link.id = "ajax-link";
      link.href = "/ajax-next.htm";
      link.textContent = "Next";
      link.setAttribute("data-ae-ajax-href", "title,#content");
      document.body.appendChild(link);
      await AelluxJs.mount(link);
      window.ajaxEvents = [];
      for (const name of ["AjaxHrefStart", "AjaxHrefLoaded", "AjaxHrefComplete"]) {
        AelluxJs.on(name, () => window.ajaxEvents.push(name));
      }
    });
    expect(await page.evaluate(() => AelluxJs.ext.ajaxHref.initialized)).toBe(true);
    await page.click("#ajax-link");
    await expect(page.locator("#content")).toHaveText("New content");
    await expect(page).toHaveTitle("Ajax next");
    await expect.poll(() => page.evaluate(() => window.ajaxEvents)).toEqual([
      "AjaxHrefStart", "AjaxHrefLoaded", "AjaxHrefComplete"
    ]);
    expect(await page.evaluate(() => window.lifecycle)).toEqual([
      "mount:Old content", "unmount:Old content", "mount:New content"
    ]);
    await expect(page).toHaveURL(/\/ajax-next.htm$/);
    const suffix = `${variant.forceLegacy ? ".legacy" : ""}${variant.boot.includes(".min.") ? ".min" : ""}.js`;
    expect(extensionRequests.map(url => new URL(url).pathname)).toEqual([`/dist/aellux.ext.ajax-href${suffix}`]);
  });

  test(`Ajax Href defaults to title and body for empty attributes (${variant.boot}, legacy=${variant.forceLegacy})`, async ({ page }) => {
    await page.route("**/ajax-default-*.htm", route => {
      const step = Number(new URL(route.request().url()).pathname.match(/ajax-default-(\d+)/)[1]);
      const attribute = step === 1 ? 'data-ae-ajax-href=""' : 'data-ae-ajax-href="   "';
      return route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><head><title>Page ${step}</title><meta name="response-head" content="new"></head><body data-page="${step}"><main data-probe>Page ${step}</main><a id="next" href="/ajax-default-${step + 1}.htm" ${attribute}>Next</a></body></html>`
      });
    });
    await page.goto("/tests/index.htm");
    await page.evaluate(() => {
      document.title = "Original page";
      document.body.innerHTML = '<main data-probe>Original page</main><a id="next" href="/ajax-default-1.htm" data-ae-ajax-href>Next</a>';
      window.originalHead = document.head;
      window.originalBody = document.body;
    });
    await page.addScriptTag({ url: `/dist/${variant.boot}` });
    await page.evaluate(forceLegacy => new Promise(resolve => {
      document.addEventListener("AelluxJsReady", resolve, { once: true });
      AelluxJs.init({ mode: "full", forceLegacy });
    }), variant.forceLegacy);
    await page.evaluate(async () => {
      window.lifecycle = [];
      window.ajaxSelectors = [];
      AelluxJs.on("AjaxHrefComplete", event => window.ajaxSelectors.push(event.detail.selectors));
      AelluxJs.ext("probe");
      AelluxJs.extAttach("probe", { init() {} });
      await AelluxJs.wait("probe");
      AelluxJs.mountManager.add({
        extensionName: "probe", selector: "[data-probe]",
        mount: element => window.lifecycle.push(`mount:${element.textContent}`),
        unmount: element => window.lifecycle.push(`unmount:${element.textContent}`)
      });
      await AelluxJs.mount(document.body);
    });

    for (let step = 1; step <= 3; step++) {
      await page.click("#next");
      await expect(page.locator("body")).toHaveAttribute("data-page", String(step));
      await expect(page).toHaveTitle(`Page ${step}`);
      await expect(page).toHaveURL(new RegExp(`/ajax-default-${step}\\.htm$`));
      await expect.poll(() => page.evaluate(() => window.ajaxSelectors.length)).toBe(step);
      expect(await page.evaluate(() => ({
        headPreserved: document.head === window.originalHead,
        bodyReplaced: document.body !== window.originalBody,
        selectors: history.state.ajaxReplace.selectors
      }))).toEqual({ headPreserved: true, bodyReplaced: true, selectors: "title,body" });
      await expect(page.locator('meta[name="response-head"]')).toHaveCount(0);
      // State Navigation must retain the newly loaded base title.
      await page.evaluate(() => AelluxJs.ext.stateNavigation.updateBaseTitle());
      await expect(page).toHaveTitle(`Page ${step}`);
    }
    expect(await page.evaluate(() => window.lifecycle)).toEqual([
      "mount:Original page", "unmount:Original page", "mount:Page 1",
      "unmount:Page 1", "mount:Page 2", "unmount:Page 2", "mount:Page 3"
    ]);
    expect(await page.evaluate(() => window.ajaxSelectors)).toEqual(["title,body", "title,body", "title,body"]);
  });
}

test("Basic resolves Ajax Href through the official registry", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => new Promise(resolve => {
    document.body.innerHTML = '<a href="/next.htm" data-ae-ajax-href="main">Next</a>';
    AelluxJs.ext("ajax-href", { loadWhen: "a[data-ae-ajax-href]" });
    document.addEventListener("AelluxJsReady", resolve, { once: true });
    AelluxJs.init({ mode: "basic" });
  }));
  expect(await page.evaluate(() => AelluxJs.ext.ajaxHref.initialized)).toBe(true);
  await expect(page.locator('script[src$="aellux.ext.ajax-href.js"]')).toHaveCount(1);
});
