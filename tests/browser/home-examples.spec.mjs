import { expect, test } from "@playwright/test";

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
});
test.afterEach(async ({ page }) => expect(logs.get(page).errors).toEqual([]));

async function openExample(page, name, extension) {
  await page.goto(`/home/examples/${name}.htm`);
  await expect.poll(() => page.evaluate(name => !!window.$ae?.ext[name]?.initialized, extension)).toBe(true);
}

test("carousel uses real snap navigation and pointer dragging", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 432 });
  await openExample(page, "carousel", "scrollboxSnap");
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator("#carousel-position")).toHaveText("Card 2 of 5");
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

test("Viewport publishes geometry to visual children and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 432 });
  await openExample(page, "viewport", "viewport");
  const card = page.locator("#viewport-card-3");
  await expect.poll(() => card.evaluate(e => e.style.getPropertyValue("--ae-viewport-visible"))).not.toBe("");
  const before = await card.evaluate(e => Number(e.style.getPropertyValue("--ae-viewport-visible")));
  await page.locator(".viewport-scroll").focus();
  await page.keyboard.press("End");
  await expect.poll(() => card.evaluate(e => Number(e.style.getPropertyValue("--ae-viewport-visible")))).toBeGreaterThan(before);
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

test("homepage embeds four themed demos and displays the exact runnable source", async ({ page }) => {
  await page.goto("/home/index.htm");
  await expect(page.locator("iframe.example-frame")).toHaveCount(4);
  await page.locator("iframe").evaluateAll(frames => frames.forEach(frame => { frame.loading = "eager"; }));
  for (const frameElement of await page.locator("iframe").all()) {
    const frame = await frameElement.contentFrame();
    await expect.poll(() => frame.locator("html").getAttribute("data-ae-color-scheme")).not.toBeNull();
  }
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  for (const frameElement of await page.locator("iframe").all()) {
    const frame = await frameElement.contentFrame();
    await expect(frame.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  }
  const source = page.locator('[data-example-source="carousel"]');
  await source.locator(":scope > summary").click();
  for (const file of await source.locator(".source-file").all()) {
    const path = await file.locator("summary").textContent();
    await file.locator("summary").click();
    await expect(file.locator("button")).toBeEnabled();
    expect(await file.locator("code").textContent()).toBe(await (await page.request.get(`/home/${path}`)).text());
  }
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scripts = await page.evaluate(() => [...document.scripts].map(script => script.src));
  expect(scripts.some(src => src.includes("bootstrap") && src.endsWith(".js"))).toBe(false);
});
