import { expect, test } from "@playwright/test";

test("A documentation-style consumer chooses navigation messages from technical failure details", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    window.messages = [];
    window.handlers = {};
    window.AelluxJs = {
      dep: () => new Promise(() => {}), init() {},
      on: (name, handler) => { window.handlers[name] = handler; }
    };
    window.$ae = () => ({ feedback: { error: message => window.messages.push(message) } });
  });
  await page.addScriptTag({ url: "/tests/fixtures/documentation-app/main.js" });
  const messages = await page.evaluate(() => {
    const fail = (status, name, online = true) => {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: online });
      window.handlers.AjaxHrefError({ detail: { status, error: { name } } });
    };
    for (const status of [404, 403, 429, 503, 418]) fail(status, "AelluxJsRequestError", false);
    fail(null, "TimeoutError");
    fail(null, "TypeError");
    fail(null, "TypeError", false);
    fail(null, "Error", false);
    fail(null, "AbortError");
    return window.messages;
  });
  expect(messages).toEqual([
    "Page not found.",
    "You do not have permission to access this content.",
    "Too many requests. Please try again later.",
    "The server encountered a problem. Please try again later.",
    "Unable to load this page. Please try again.",
    "The request took too long. Please try again.",
    "Unable to connect to the server.",
    "Please check your internet connection.",
    "Unable to load this page. Please try again."
  ]);
});

for (const variant of [
  { boot: "aellux.js", forceLegacy: false },
  { boot: "aellux.min.js", forceLegacy: false },
  { boot: "aellux.js", forceLegacy: true },
  { boot: "aellux.min.js", forceLegacy: true }
]) {
  test(`Ajax Href preserves failure causes and silences canceled navigation (${variant.boot}, legacy=${variant.forceLegacy})`, async ({ page }) => {
    await page.route("**/ajax-error/*", route => route.fulfill({
      status: Number(new URL(route.request().url()).pathname.split("/").pop()),
      contentType: "text/html", body: '<main id="content">Error response</main>'
    }));
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: `/dist/${variant.boot}` });
    const result = await page.evaluate(async forceLegacy => {
      document.body.innerHTML = '<main id="content">Old</main>';
      AelluxJs.ext("ajax-href", { load: false });
      await new Promise(resolve => {
        AelluxJs.on("Ready", resolve, { once: true });
        AelluxJs.init({ mode: "basic", forceLegacy });
      });
      await AelluxJs.wait("ajax-href");
      const failures = [];
      const completions = [];
      let lastError;
      AelluxJs.on("AjaxHrefError", event => {
        lastError = event.detail.error;
        failures.push({ status: event.detail.status, name: lastError.name });
      });
      AelluxJs.on("AjaxHrefComplete", event => completions.push(event.detail.url));
      const identities = [];
      for (const status of [404, 403, 429, 503]) {
        try { await AelluxJs.ext.ajaxHref.load(`/ajax-error/${status}`, "#content"); }
        catch (error) { identities.push(error === lastError && error.response.status === status); }
      }
      for (const error of [new TypeError("Network failure"), new DOMException("Timed out", "TimeoutError")]) {
        AelluxJs.request = async () => { throw error; };
        try { await AelluxJs.ext.ajaxHref.load("/failure", "#content"); }
        catch (cause) { identities.push(cause === error && cause === lastError); }
      }
      AelluxJs.request = async () => { throw new DOMException("Canceled", "AbortError"); };
      const aborted = await AelluxJs.ext.ajaxHref.load("/abort", "#content");

      // Keep the successor pending until the aborted fetch has settled.
      let resolveNext;
      AelluxJs.request = (_url, { signal }) => new Promise((_resolve, reject) => {
        // Some custom request implementations do not preserve AbortError.
        signal.addEventListener("abort", () => reject(new TypeError("Obsolete network failure")));
      });
      const previous = AelluxJs.ext.ajaxHref.load("/previous", "#content");
      AelluxJs.request = () => new Promise(resolve => { resolveNext = resolve; });
      const next = AelluxJs.ext.ajaxHref.load("/next", "#content", { ignoreHistory: true });
      const superseded = await previous;
      resolveNext({ text: async () => '<main id="content">New</main>' });
      await next;
      return { failures, identities, aborted, superseded, completions: completions.length,
        content: document.querySelector("#content").textContent };
    }, variant.forceLegacy);
    expect(result).toEqual({
      failures: [404, 403, 429, 503].map(status => ({ status, name: "AelluxJsRequestError" })).concat([
        { status: null, name: "TypeError" }, { status: null, name: "TimeoutError" }
      ]),
      identities: Array(6).fill(true), aborted: null, superseded: null, completions: 9, content: "New"
    });
  });

  test(`Ajax Href leaves Feedback to consumers for missing regions and request errors (${variant.boot}, legacy=${variant.forceLegacy})`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: `/dist/${variant.boot}` });
    const result = await page.evaluate(async forceLegacy => {
      document.body.innerHTML = '<main id="content">Old</main><aside id="missing">Keep</aside>';
      AelluxJs.ext("ajax-href", { load: false });
      AelluxJs.ext("feedback", { load: false });
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
    expect(result).toEqual({ loaded: [], failed: [], error: "Request failed", content: "New", missing: "Keep" });
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
