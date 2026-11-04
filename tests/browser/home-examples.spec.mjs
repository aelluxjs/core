import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const logs = new WeakMap();
test.beforeEach(async ({ page, context }) => {
  const log = { errors: [], allow404: false };
  logs.set(page, log);
  page.on("pageerror", error => log.errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !(log.allow404 && message.text().includes("404"))) log.errors.push(message.text());
  });
  // Use the existing versioned Bootstrap fixture; the examples still load their public dist scripts.
  await context.route("https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css", route =>
    route.fulfill({ path: "tests/fixtures/bootstrap-5.3.8.min.css", contentType: "text/css" }));
  // Behavior tests use system font fallbacks to stay independent of Google Fonts.
  await context.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ body: "", contentType: "text/css" }));
  await context.route("https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12/**", route => {
    const file = new URL(route.request().url()).pathname.split("/").pop();
    return route.fulfill({ path: `tests/fixtures/highlightjs-11.12.0/${file}`,
      contentType: file.endsWith(".css") ? "text/css" : "text/javascript" });
  });
});
test.afterEach(async ({ page }) => expect(logs.get(page).errors).toEqual([]));

async function openExample(page, name, extension) {
  await page.goto(`/home/examples/${name}.htm`);
  await expect.poll(() => page.evaluate(name => !!window.$ae?.ext[name]?.initialized, extension)).toBe(true);
}

test("brand SVGs own their styles, default to light and detect either theme attribute", async ({ page }) => {
  await page.goto("/home/index.htm");
  const result = await page.evaluate(async () => {
    const frame = document.createElement("iframe");
    frame.srcdoc = document.getElementById("brand-symbol").outerHTML + document.getElementById("brand-logotype").outerHTML;
    const loaded = new Promise(resolve => { frame.onload = resolve; });
    document.body.append(frame);
    await loaded;
    const doc = frame.contentDocument;
    const colors = () => [".ae-brand-tile", ".ae-brand-word"].map(selector =>
      frame.contentWindow.getComputedStyle(doc.querySelector(selector)).fill);
    const states = [colors()];
    for (const attribute of ["data-bs-theme", "data-ae-color-scheme"]) {
      doc.documentElement.setAttribute(attribute, "dark");
      states.push(colors());
      doc.documentElement.setAttribute(attribute, "light");
      states.push(colors());
      doc.documentElement.removeAttribute(attribute);
    }
    frame.remove();
    return states;
  });
  expect(result).toEqual([
    ["rgb(255, 193, 7)", "rgb(23, 25, 28)"],
    ["rgb(255, 218, 106)", "rgb(248, 249, 250)"],
    ["rgb(255, 193, 7)", "rgb(23, 25, 28)"],
    ["rgb(255, 218, 106)", "rgb(248, 249, 250)"],
    ["rgb(255, 193, 7)", "rgb(23, 25, 28)"]
  ]);
});

for (const theme of ["light", "dark"]) {
  for (const variant of ["symbol", "logotype"]) {
    test(`brand ${variant} SVG and PNG downloads preserve ${theme} colors and transparency`, async ({ page }) => {
      await page.goto("/home/index.htm");
      await expect.poll(() => page.evaluate(() => !!$ae.ext.svgDownloader?.initialized)).toBe(true);
      await page.getByRole("button", { name: theme === "dark" ? "Dark" : "Light", exact: true }).click();
      const original = await page.locator(`#brand-${variant}`).evaluate(svg => svg.outerHTML);
      for (const format of ["svg", "png"]) {
        const pending = page.waitForEvent("download");
        await page.locator(`[data-ae-svg-downloader="brand-${variant}"][data-ae-svg-format="${format}"]`).click();
        const download = await pending;
        expect(download.suggestedFilename()).toBe(`aellux-${variant}.${format}`);
        const buffer = await readFile(await download.path());
        const rendered = await page.evaluate(async ({ base64, format, theme }) => {
          const blob = await (await fetch(`data:image/${format === "svg" ? "svg+xml" : "png"};base64,${base64}`)).blob();
          // Image loading has no host ancestors and must retain the selected colors.
          const url = URL.createObjectURL(blob);
          try {
            const image = new Image();
            await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);
            const pixel = (x, y) => [...context.getImageData(x, y, 1, 1).data];
            const pixels = context.getImageData(280, 0, Math.max(1, canvas.width - 280), canvas.height).data;
            const expected = theme === "dark" ? [248, 249, 250] : [23, 25, 28];
            let wordPixels = 0;
            for (let i = 0; i < pixels.length; i += 4) {
              if (pixels[i] === expected[0] && pixels[i + 1] === expected[1] && pixels[i + 2] === expected[2] && pixels[i + 3] === 255) wordPixels++;
            }
            return { width: canvas.width, height: canvas.height, tile: pixel(20, 20), corner: pixel(0, 0), wordPixels };
          } finally { URL.revokeObjectURL(url); }
        }, { base64: buffer.toString("base64"), format, theme });
        expect(rendered.width).toBe(variant === "symbol" ? 256 : 1024);
        expect(rendered.height).toBe(256);
        expect(rendered.tile).toEqual(theme === "dark" ? [255, 218, 106, 255] : [255, 193, 7, 255]);
        expect(rendered.corner[3]).toBe(0);
        if (variant === "logotype") expect(rendered.wordPixels).toBeGreaterThan(1000);
        if (format === "svg") {
          const frozenColors = await page.evaluate(async svg => {
            const frame = document.createElement("iframe");
            frame.srcdoc = `<html data-bs-theme="dark" data-ae-color-scheme="dark"><body>${svg}</body></html>`;
            const loaded = new Promise(resolve => { frame.onload = resolve; });
            document.body.append(frame);
            await loaded;
            const tile = frame.contentDocument.querySelector(".ae-brand-tile");
            const colors = [frame.contentWindow.getComputedStyle(tile).fill];
            frame.contentDocument.documentElement.setAttribute("data-bs-theme", "light");
            frame.contentDocument.documentElement.setAttribute("data-ae-color-scheme", "light");
            colors.push(frame.contentWindow.getComputedStyle(tile).fill);
            frame.remove();
            return colors;
          }, buffer.toString("utf8"));
          const expected = theme === "dark" ? "rgb(255, 218, 106)" : "rgb(255, 193, 7)";
          expect(frozenColors).toEqual([expected, expected]);
        }
      }
      expect(await page.locator(`#brand-${variant}`).evaluate(svg => svg.outerHTML)).toBe(original);
    });
  }
}

test("inline head initialization publishes preferences before styles and deferred handlers", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("AelluxJsPreferences", "colorScheme=dark"));
  const documents = ["index", "examples/carousel", "examples/viewport", "examples/floating",
    "examples/navigation", "examples/navigation-details", "examples/navigation-activity"];
  const stylesheet = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css";
  for (const document of documents) {
    let release, requested;
    const gate = new Promise(resolve => { release = resolve; });
    const request = new Promise(resolve => { requested = resolve; });
    await page.route(stylesheet, async route => {
      requested();
      await gate;
      await route.fulfill({ path: "tests/fixtures/bootstrap-5.3.8.min.css", contentType: "text/css" });
    });
    const navigation = page.goto(`/home/${document}.htm`);
    let earlyState;
    try {
      await request;
      // Speculative CSS requests can precede execution of the blocking boot script.
      await expect.poll(() => page.evaluate(() => window.$ae?.options.syncBootstrapThemeTag), { timeout: 5000 }).toBe(true);
      earlyState = await page.evaluate(() => ({
        mode: $ae.options.mode,
        preferenceRegistered: !!$ae.registry.ext.preference,
        syncBootstrapThemeTag: $ae.options.syncBootstrapThemeTag,
        colorScheme: $ae.currentPreference("color-scheme"),
        bootstrapTheme: window.document.documentElement.getAttribute("data-bs-theme"),
        stylesheetLoaded: !!window.document.querySelector('link[href*="bootstrap@"]')?.sheet
      }));
    } finally {
      release();
      await navigation;
    }
    expect(earlyState).toEqual({ mode: "basic", preferenceRegistered: true, syncBootstrapThemeTag: true,
      colorScheme: "dark", bootstrapTheme: "dark", stylesheetLoaded: false });
    await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
    await page.unroute(stylesheet);
  }
});

test("carousel uses real snap navigation and pointer dragging", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 432 });
  await openExample(page, "carousel", "scrollboxSnap");
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator("#carousel-position")).toHaveText("Card 2 of 5");
  await expect(page.locator("#carousel-focus")).toHaveAttribute("data-ae-anchor-target", "carousel-card-2");
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page.locator("#carousel-position")).toHaveText("Card 1 of 5");
  const box = await page.locator("#gallery").boundingBox();
  await page.mouse.move(box.x + box.width - 35, box.y + box.height - 25);
  await page.mouse.down();
  await page.mouse.move(box.x + 35, box.y + box.height - 25, { steps: 16 });
  await page.mouse.up();
  await expect(page.locator("#carousel-position")).not.toHaveText("Card 1 of 5");
  expect(await page.locator("#gallery").evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await page.evaluate(() => $ae("gallery").scrollbox.goto(4));
  await expect(page.locator("#carousel-position")).toHaveText("Card 5 of 5");
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  await expect(page.locator("#carousel-focus")).toHaveAttribute("data-ae-anchor-target", "carousel-card-5");
  await expect.poll(() => page.locator("#carousel-focus").evaluate(element => {
    const actual = element.getBoundingClientRect();
    const target = document.getElementById("carousel-card-5").getBoundingClientRect();
    return Math.max(Math.abs(actual.left - target.left), Math.abs(actual.top - target.top),
      Math.abs(actual.width - target.width), Math.abs(actual.height - target.height));
  })).toBeLessThan(1);
});

test("carousel retains native touch panning", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Native touch input is driven through Chromium CDP.");
  await page.setViewportSize({ width: 375, height: 500 });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await openExample(page, "carousel", "scrollboxSnap");
  const box = await page.locator("#gallery").boundingBox();
  const y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width - 20, y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + box.width - 20 - i * 20, y }] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.locator("#gallery").evaluate(element => element.scrollLeft)).toBeGreaterThan(10);
  await cdp.detach();
});

test("Viewport scrolls horizontally, publishes geometry to visual children and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 432 });
  await openExample(page, "viewport", "viewport");
  const card = page.locator("#viewport-card-3");
  await expect.poll(() => card.evaluate(e => e.style.getPropertyValue("--ae-viewport-visible"))).not.toBe("");
  const before = await card.evaluate(e => Number(e.style.getPropertyValue("--ae-viewport-visible")));
  const scroller = page.locator(".viewport-scroll");
  await scroller.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => scroller.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
  await scroller.evaluate(e => e.scrollTo({ left: e.scrollWidth }));
  await expect.poll(() => card.evaluate(e => Number(e.style.getPropertyValue("--ae-viewport-visible")))).toBeGreaterThan(before);
  expect(await scroller.evaluate(e => e.scrollTop)).toBe(0);
  expect(await scroller.evaluate(e => e.scrollHeight <= e.clientHeight)).toBe(true);
  await expect.poll(() => card.evaluate(e => getComputedStyle(e).transform)).not.toBe("none");
  expect(await page.locator(".viewport-step").first().evaluate(e => e.style.getPropertyValue("--ae-viewport-visible"))).toBe("");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-ae-reduced-motion", "reduced");
  await expect(card).toHaveCSS("transform", "none");
  await expect(card).toHaveCSS("opacity", "1");
});

test("Anchor repositions the Present panel and keyboard dismissal restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 432 });
  await openExample(page, "floating", "present");
  const trigger = page.getByRole("button", { name: "Toggle panel" });
  const panel = page.locator("#floating-panel");
  await expect(panel).toBeHidden();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toHaveClass(/ae--pop/);
  const geometry = () => page.evaluate(() => {
    const t = document.getElementById("floating-trigger").getBoundingClientRect();
    const p = document.getElementById("floating-panel").getBoundingClientRect();
    return { below: Math.abs(p.top - t.bottom) < 2, above: Math.abs(p.bottom - t.top) < 2,
      centered: Math.abs(p.left + p.width / 2 - t.left - t.width / 2) < 2 };
  });
  await expect.poll(geometry).toMatchObject({ below: true, centered: true });
  await page.locator("#trigger-position").fill("180");
  await page.locator("#trigger-position").dispatchEvent("input");
  await expect.poll(geometry).toMatchObject({ above: true, centered: true });
  await page.setViewportSize({ width: 375, height: 432 });
  await expect.poll(geometry).toMatchObject({ centered: true });
  await page.getByRole("button", { name: "Close panel" }).focus();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(panel).toHaveClass(/ae--pop/);
  await page.getByRole("button", { name: "Close panel" }).click();
  await expect(panel).toBeHidden();
});

test("Ajax Href loads HTML with Feedback, restores browser history and reports real failures", async ({ page }) => {
  await openExample(page, "navigation", "ajaxHref");
  await page.evaluate(() => { window.navigationSentinel = document.getElementById("navigation-demo"); });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route("**/home/examples/navigation-details.htm", async route => { await gate; await route.continue(); });
  try {
    await page.getByRole("link", { name: "Details", exact: true }).click();
    await expect(page.locator("#navigation-demo")).toHaveAttribute("aria-busy", "true");
    await expect(page.locator("#navigation-status")).toHaveText("Loading the next panel…");
  } finally { release(); }
  await expect(page.locator("#navigation-heading")).toHaveText("Details");
  await expect(page.locator("#navigation-status")).toHaveText("Loaded Details.");
  await expect(page.locator("#navigation-content")).toBeFocused();
  await expect(page.locator("#navigation-demo")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("link", { name: "Activity", exact: true }).click();
  await expect(page.locator("#navigation-heading")).toHaveText("Activity");
  await page.evaluate(() => history.back());
  await expect(page.locator("#navigation-heading")).toHaveText("Details");
  await page.evaluate(() => history.back());
  await expect(page.locator("#navigation-heading")).toHaveText("Overview");
  await page.evaluate(() => history.forward());
  await expect(page.locator("#navigation-heading")).toHaveText("Details");
  expect(await page.evaluate(() => window.navigationSentinel === document.getElementById("navigation-demo"))).toBe(true);
  const previousURL = page.url();
  logs.get(page).allow404 = true;
  await page.getByRole("button", { name: "Try a 404" }).click();
  await expect(page.locator("#navigation-status")).toContainText("not found (404)");
  await expect(page.locator("#navigation-demo")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#navigation-heading")).toHaveText("Details");
  expect(page.url()).toBe(previousURL);
});

test("superseded Ajax navigation does not show an error or clear active loading", async ({ page }) => {
  await openExample(page, "navigation", "ajaxHref");
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route("**/home/examples/navigation-details.htm", async route => {
    await gate;
    await route.fulfill({ path: "home/examples/navigation-details.htm", contentType: "text/html" });
  });
  try {
    await page.getByRole("link", { name: "Details", exact: true }).click();
    await expect(page.locator("#navigation-demo")).toHaveAttribute("aria-busy", "true");
    await page.getByRole("link", { name: "Activity", exact: true }).click();
    await expect(page.locator("#navigation-heading")).toHaveText("Activity");
  } finally { release(); }
  await expect(page.locator("#navigation-demo")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#navigation-status")).toHaveText("Loaded Activity.");
  await expect(page.locator("#navigation-status")).not.toHaveClass(/ae--feedback-error/);
});

for (const reducedMotion of ["no-preference", "reduce"]) {
  test(`main navigation appears when main leaves the top and hides on return (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/home/index.htm");
    await expect.poll(() => page.locator("#main").evaluate(element =>
      element.style.getPropertyValue("--ae-viewport-y"))).not.toBe("");
    const wrapper = page.locator("#main-navigation-wrapper");
    await expect(wrapper).toHaveJSProperty("hidden", true);
    await expect(wrapper).toHaveCSS("display", "none");
    await page.evaluate(() => {
      window.navigationTransitions = { pop: 0, unpop: 0 };
      for (const [eventName, key] of [["BeforePop", "pop"], ["BeforeUnpop", "unpop"]]) {
        $ae.on(eventName, event => {
          if (event.target.id === "main-navigation-wrapper") navigationTransitions[key]++;
        });
      }
    });
    const scrollAndSample = top => wrapper.evaluate(async (element, top) => {
      window.scrollTo({ top, behavior: "instant" });
      const frames = [];
      const deadline = performance.now() + 3000;
      do {
        const computed = getComputedStyle(element);
        const matrix = new DOMMatrix(computed.transform);
        frames.push({ hidden: element.hidden, scaleY: matrix.m22, translateY: matrix.m42,
          opacity: Number(computed.opacity),
          closing: element.classList.contains("ae--unpopping") });
        if (top > 0 ? element.classList.contains("ae--pop") : element.hidden) return frames;
        await new Promise(requestAnimationFrame);
      } while (performance.now() < deadline);
      throw new Error("Navigation did not reach its requested visibility");
    }, top);
    const opening = await scrollAndSample(1);
    if (reducedMotion === "no-preference") {
      expect(opening.some(frame => !frame.hidden && frame.scaleY > .5 && frame.scaleY < 1 &&
        frame.translateY > 0 && frame.opacity > 0 && frame.opacity < 1)).toBe(true);
    }
    await expect(wrapper).toHaveClass(/(?:^|\s)ae--pop(?:\s|$)/);
    await expect(wrapper).toHaveJSProperty("hidden", false);
    await page.evaluate(async () => {
      window.scrollTo({ top: 20, behavior: "instant" });
      await $ae.mountManager.update(document.getElementById("main"), "viewport");
    });
    expect(await page.evaluate(() => navigationTransitions.pop)).toBe(1);
    const closing = await scrollAndSample(0);
    if (reducedMotion === "no-preference") {
      expect(closing.some(frame => !frame.hidden && frame.closing && frame.scaleY > 1 && frame.scaleY < 1.2 &&
        Math.abs(frame.translateY) < .1 && frame.opacity > 0 && frame.opacity < 1)).toBe(true);
    }
    await expect(wrapper).toHaveJSProperty("hidden", true);
    await expect(wrapper).toHaveCSS("display", "none");
    expect(await page.evaluate(() => navigationTransitions)).toEqual({ pop: 1, unpop: 1 });
  });
}

test("main navigation opens on an initial section fragment and remains open after outside clicks", async ({ page }) => {
  await page.goto("/home/index.htm#examples");
  const wrapper = page.locator("#main-navigation-wrapper");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(wrapper).toHaveClass(/(?:^|\s)ae--pop(?:\s|$)/);
  await expect(wrapper).toHaveJSProperty("hidden", false);
  await page.evaluate(() => {
    window.navigationCloseRequests = 0;
    $ae.on("BeforeUnpop", event => {
      if (event.target.id === "main-navigation-wrapper") navigationCloseRequests++;
    });
  });
  await page.locator("#examples-title").click();
  expect(await page.evaluate(() => navigationCloseRequests)).toBe(0);
  await expect(wrapper).toHaveClass(/(?:^|\s)ae--pop(?:\s|$)/);
});

test("homepage section Viewports select when the block top crosses the screen midpoint and restore Back to top", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/home/index.htm");
  await expect.poll(() => page.evaluate(() => !!$ae.ext.viewport?.initialized)).toBe(true);
  const marker = page.locator('nav[aria-label="Main navigation"] [data-ae-anchor]');
  await expect(page.locator("section.hero")).toHaveAttribute("data-ae-viewport", "y");
  await expect(page.locator("#item1")).toHaveAttribute("href", "#main");
  await expect(page.locator("#item2")).toHaveAttribute("href", "#getting-started");
  await expect(page.locator("#item2")).toHaveText("Start");
  await page.evaluate(() => {
    window.homeViewportSnapshots = {};
    document.addEventListener($ae.eventName("ViewportChange"), event => {
      if (event.target.id) homeViewportSnapshots[event.target.id] = event.detail;
    });
  });
  let previous = "item1";
  for (const [id, target] of [["getting-started", "item2"], ["examples", "item3"], ["extensions", "item4"]]) {
    const section = page.locator(`#${id}`);
    const title = page.locator(`#${id}-title`);
    await expect(section).toHaveAttribute("data-ae-viewport", "y");
    await section.evaluate(element => window.scrollTo({
      top: scrollY + element.getBoundingClientRect().top - innerHeight + 20, behavior: "instant"
    }));
    await expect.poll(() => section.evaluate(element => Number(element.style.getPropertyValue("--ae-viewport-visible")))).toBeGreaterThan(0);
    expect(await section.evaluate(element => Number(element.style.getPropertyValue("--ae-viewport-visible")))).toBeLessThan(1);
    await expect(marker).toHaveAttribute("data-ae-anchor-target", previous);
    await section.evaluate(element => window.scrollTo({
      top: scrollY + element.getBoundingClientRect().top - innerHeight / 2 - 10, behavior: "instant"
    }));
    await expect.poll(() => page.evaluate(id => homeViewportSnapshots[id]?.y1, id)).toBeCloseTo(.025, 2);
    await expect(marker).toHaveAttribute("data-ae-anchor-target", previous);
    await section.evaluate(element => window.scrollTo({
      top: scrollY + element.getBoundingClientRect().top - innerHeight / 2 + 10, behavior: "instant"
    }));
    await expect.poll(() => page.evaluate(id => homeViewportSnapshots[id]?.y1, id)).toBeCloseTo(-.025, 2);
    await expect(marker).toHaveAttribute("data-ae-anchor-target", target);
    expect(await title.evaluate(element => element.getBoundingClientRect().top > innerHeight / 2)).toBe(true);
    if (id !== "getting-started")
      expect(await section.evaluate(element => element.getBoundingClientRect().bottom > innerHeight)).toBe(true);
    await section.evaluate(element => window.scrollTo({
      top: scrollY + element.getBoundingClientRect().top - 50, behavior: "instant"
    }));
    await expect(marker).toHaveAttribute("data-ae-anchor-target", target);
    await expect.poll(() => marker.evaluate(element => {
      const a = element.getBoundingClientRect();
      const b = document.getElementById(element.dataset.aeAnchorTarget).getBoundingClientRect();
      return Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top),
        Math.abs(a.width - b.width), Math.abs(a.height - b.height));
    })).toBeLessThan(1);
    previous = target;
  }
  await page.locator("#examples").evaluate(element => window.scrollTo({
    top: scrollY + element.getBoundingClientRect().top - 50, behavior: "instant"
  }));
  await expect(marker).toHaveAttribute("data-ae-anchor-target", "item3");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => page.locator("section.hero").evaluate(element => Number(element.style.getPropertyValue("--ae-viewport-visible")))).toBeGreaterThan(0);
  await expect(marker).toHaveAttribute("data-ae-anchor-target", "item1");
});

test("main navigation scrolls the Anchor target into view on reveal and section changes", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.addInitScript(() => {
    window.navigationScrollCalls = [];
    const native = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      if (this.closest("#main-navigation")) navigationScrollCalls.push({
        id: this.id, anchor: this.hasAttribute("data-ae-anchor"), options
      });
      return native.call(this, options);
    };
  });
  await page.goto("/home/index.htm");
  await expect.poll(() => page.evaluate(() => !!$ae.ext.viewport?.initialized)).toBe(true);
  const marker = page.locator("#main-navigation [data-ae-anchor]");
  await expect(marker).toHaveAttribute("data-ae-anchor-scroll-into-view", "center center");
  expect(await page.evaluate(() => navigationScrollCalls)).toEqual([]);
  for (const [id, target] of [["getting-started", "item2"], ["extensions", "item4"]]) {
    const previous = await page.evaluate(() => navigationScrollCalls.length);
    await page.locator(`#${id}`).evaluate(element => window.scrollTo({
      top: scrollY + element.getBoundingClientRect().top - 20, behavior: "instant"
    }));
    await expect(marker).toHaveAttribute("data-ae-anchor-target", target);
    await expect.poll(() => page.evaluate(() => navigationScrollCalls.length)).toBeGreaterThan(previous);
    await expect.poll(() => marker.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const nav = element.closest("nav").getBoundingClientRect();
      return rect.left >= nav.left - 1 && rect.right <= nav.right + 1;
    })).toBe(true);
  }
  expect(await page.evaluate(() => navigationScrollCalls.every(call => !call.anchor && /^item\d+$/.test(call.id) &&
    call.options.block === "center" && call.options.inline === "center"))).toBe(true);
});

test("homepage section Viewports work on a short viewport and link clicks wait for visibility to select", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 320 });
  await page.goto("/home/index.htm");
  await expect.poll(() => page.evaluate(() => !!$ae.ext.viewport?.initialized)).toBe(true);
  const marker = page.locator('nav[aria-label="Main navigation"] [data-ae-anchor]');
  for (const [id, target] of [["getting-started", "item2"], ["examples", "item3"], ["extensions", "item4"]]) {
    const section = page.locator(`#${id}`);
    await section.evaluate(element => window.scrollTo({
      top: scrollY + element.getBoundingClientRect().top - 20, behavior: "instant"
    }));
    await expect.poll(() => section.evaluate(element => Number(element.style.getPropertyValue("--ae-viewport-visible")))).toBeGreaterThan(0);
    await expect(marker).toHaveAttribute("data-ae-anchor-target", target);
  }
  await page.locator("#item1").click();
  await expect(marker).toHaveAttribute("data-ae-anchor-target", "item1");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page).toHaveURL(/#main$/);
  const immediateTarget = await page.locator("#item4").evaluate(link => {
    link.click();
    return document.querySelector('nav[aria-label="Main navigation"] [data-ae-anchor]').dataset.aeAnchorTarget;
  });
  expect(immediateTarget).toBe("item1");
  await expect.poll(() => page.locator("#extensions").evaluate(element =>
    Number(element.style.getPropertyValue("--ae-viewport-visible")))).toBeGreaterThan(0);
  await expect(marker).toHaveAttribute("data-ae-anchor-target", "item4");
});

test("homepage embeds four themed demos and displays the exact runnable source", async ({ page }) => {
  await page.goto("/home/index.htm");
  await expect(page.locator(".hero .eyebrow")).toContainText("UX Made Easy");
  await expect(page.locator(".brand-mark")).toHaveCSS("font-family", /Geist/);
  await expect(page.getByRole("button", { name: "System", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("iframe.example-frame")).toHaveCount(4);
  await page.locator("iframe").evaluateAll(frames => frames.forEach(frame => { frame.loading = "eager"; }));
  for (const frameElement of await page.locator("iframe").all()) {
    const frame = await frameElement.contentFrame();
    await expect.poll(() => frame.locator("html").getAttribute("data-ae-color-scheme")).not.toBeNull();
    await expect(frame.locator("h1")).not.toHaveCSS("font-family", /Geist/);
  }
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  await expect(page.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  for (const frameElement of await page.locator("iframe").all()) {
    const frame = await frameElement.contentFrame();
    await expect(frame.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  }
  const source = page.locator('[data-example-source="carousel"]');
  await source.locator(":scope > .source-toggle").click();
  await expect(source.locator(".source-file > .source-toggle")).toHaveText([
    "examples/carousel.htm", "examples/carousel.js"
  ]);
  for (const file of await source.locator(".source-file").all()) {
    const path = await file.locator(":scope > .source-toggle").textContent();
    await file.locator(":scope > .source-toggle").click();
    await expect(file.getByRole("button", { name: `Copy ${path}`, exact: true })).toBeEnabled();
    await expect(file.locator("code")).toHaveAttribute("data-highlighted", "yes");
    await expect(file.locator("pre")).toHaveAttribute("data-ae-scrollbar", "horizontal vertical");
    await expect(file.locator("pre")).toHaveAttribute("data-ae-scrollbar-parent", "wrapper");
    await expect(file.locator(".code-wrapper > [data-ae-scrollbar-vertical]")).toHaveCount(1);
    await expect(file.locator(".code-wrapper > [data-ae-scrollbar-horizontal]")).toHaveCount(1);
    await expect(file.locator("pre")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(file.locator("code")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(file.locator(".code-wrapper")).toHaveCSS("border-top-width", "1px");
    expect(await file.locator('code [class^="hljs-"]').count()).toBeGreaterThan(0);
    expect(await file.locator("code").textContent()).toBe(await (await page.request.get(`/home/${path}`)).text());
  }
  await expect(page.locator('script[data-ae-dep="highlightjs"]')).toHaveCount(1);
  await expect(page.locator('link[data-ae-dep^="highlightjs-css"]')).toHaveCount(2);
  await expect(page.locator('link[data-ae-dep="highlightjs-css-dark"]')).toHaveJSProperty("disabled", false);
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator('link[data-ae-dep="highlightjs-css-dark"]')).toHaveJSProperty("disabled", true);
  await expect(page.locator('link[data-ae-dep="highlightjs-css"]')).toHaveJSProperty("disabled", false);
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scripts = await page.evaluate(() => [...document.scripts].map(script => script.src));
  expect(scripts.some(src => src.includes("bootstrap") && src.endsWith(".js"))).toBe(false);
});
