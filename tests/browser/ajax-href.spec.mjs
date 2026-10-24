import { expect, test } from "@playwright/test";

for (const variant of [
  { boot: "aellux.js", forceLegacy: false },
  { boot: "aellux.min.js", forceLegacy: false },
  { boot: "aellux.js", forceLegacy: true },
  { boot: "aellux.min.js", forceLegacy: true }
]) {
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
