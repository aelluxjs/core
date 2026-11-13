import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const html = readFileSync(new URL("../../docs/0.1.x/index.htm", import.meta.url), "utf8");

test("mobile documentation drawers reverse from their exposed drag handles", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/index.htm");
  await page.addStyleTag({ url: "/tests/fixtures/bootstrap-5.3.8.min.css" });
  await page.addStyleTag({ url: "/docs/assets/docweaver/css/style.css" });
  await page.evaluate(markup => {
    const parsed = new DOMParser().parseFromString(markup, "text/html");
    document.body.replaceChildren(
      document.importNode(parsed.querySelector("header"), true),
      document.importNode(parsed.querySelector(".toc-header"), true)
    );
    window.drawerEvents = [];
    for (const id of ["navbarSupportedContent", "toc-collapse"])
      document.getElementById(id).addEventListener("AelluxJsUnpop", () => drawerEvents.push(id));
  }, html);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => new Promise(resolve => {
    aelluxJs.ext("present", { loadStyle: true });
    aelluxJs.on("Ready", resolve, { once: true });
    aelluxJs.init({ mode: "basic" });
  }));
  await expect.poll(() => page.evaluate(() => typeof $ae("toc-collapse")?.present?.toggle)).toBe("function");

  const drag = (selector, dx, dy) => page.evaluate(({ selector, dx, dy }) => {
    const handle = document.querySelector(selector);
    const rect = handle.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const dispatch = (target, type, px, py) => target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 7, pointerType: "mouse", isPrimary: true,
      button: 0, buttons: type === "pointerup" ? 0 : 1, clientX: px, clientY: py
    }));
    dispatch(handle, "pointerdown", x, y);
    dispatch(document, "pointermove", x + dx, y + dy);
    dispatch(document, "pointerup", x + dx, y + dy);
  }, { selector, dx, dy });

  await page.locator("#button-navbar-menu").click();
  await expect(page.locator("#navbarSupportedContent")).toHaveClass(/(?:^|\s)ae--pop(?:\s|$)/);
  expect(await page.locator(".docs-drawer-handle").evaluate(el => getComputedStyle(el).touchAction)).toBe("pan-y");
  await drag(".docs-drawer-handle", 300, 0);
  await expect(page.locator("#navbarSupportedContent")).toHaveJSProperty("hidden", true);

  await page.locator("#button-toc-menu").click();
  await expect(page.locator("#toc-collapse")).toHaveClass(/(?:^|\s)ae--pop(?:\s|$)/);
  expect(await page.locator(".toc-drag-handle").evaluate(el => getComputedStyle(el).touchAction)).toBe("pan-x");
  await drag(".toc-drag-handle", 0, -600);
  await expect(page.locator("#toc-collapse")).toHaveJSProperty("hidden", true);
  expect(await page.evaluate(() => drawerEvents)).toEqual(["navbarSupportedContent", "toc-collapse"]);
});

for (const selector of ["a.nav-link:visible", "button.nav-link:visible"]) test(`mouse drag on drawer ${selector.split(".")[0]} closes without native dragging`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/index.htm");
  await page.addStyleTag({ url: "/tests/fixtures/bootstrap-5.3.8.min.css" });
  await page.addStyleTag({ url: "/docs/assets/docweaver/css/style.css" });
  await page.evaluate(markup => {
    const parsed = new DOMParser().parseFromString(markup, "text/html");
    document.body.replaceChildren(document.importNode(parsed.querySelector("header"), true));
  }, html);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => new Promise(resolve => {
    aelluxJs.ext("present", { loadStyle: true });
    aelluxJs.ext("scrollbox", { loadStyle: true });
    aelluxJs.on("Ready", resolve, { once: true });
    aelluxJs.init({ mode: "basic" });
  }));
  await page.locator("#button-navbar-menu").click();
  await expect(page.locator("#navbarSupportedContent")).toHaveClass(/\bae--pop\b/);
  const control = page.locator(`#navbarSupportedContent nav ${selector}`).first();
  await expect(control).toHaveAttribute("draggable", "false");
  const box = await control.boundingBox();
  const x = box.x + 12, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 420, y, { steps: 24 });
  await page.mouse.up();
  await expect(page.locator("#navbarSupportedContent")).toHaveJSProperty("hidden", true);
});

test("real touch drag closes both mobile drawer handles", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Touch injection uses Chromium's input protocol.");
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto("/tests/index.htm");
    await page.addStyleTag({ url: "/tests/fixtures/bootstrap-5.3.8.min.css" });
    await page.addStyleTag({ url: "/docs/assets/docweaver/css/style.css" });
    await page.evaluate(markup => {
      const parsed = new DOMParser().parseFromString(markup, "text/html");
      document.body.replaceChildren(
        document.importNode(parsed.querySelector("header"), true),
        document.importNode(parsed.querySelector(".toc-header"), true)
      );
      window.pointerCancels = 0;
      window.addEventListener("pointercancel", () => pointerCancels++, true);
    }, html);
    await page.addScriptTag({ url: "/dist/aellux.js" });
    await page.evaluate(() => new Promise(resolve => {
      aelluxJs.ext("present", { loadStyle: true });
      aelluxJs.on("Ready", resolve, { once: true });
      aelluxJs.init({ mode: "basic" });
    }));
    await page.locator("#button-navbar-menu").click();
    await expect(page.locator("#navbarSupportedContent")).toHaveClass(/\bae--pop\b/);
    const input = await context.newCDPSession(page);
    const dragTouch = async (selector, dx, dy, steps = 8) => {
      const box = await page.locator(selector).boundingBox();
      const start = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 };
      await input.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
      for (let step = 1; step <= steps; step++)
        await input.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...start,
          x: start.x + dx * step / steps, y: start.y + dy * step / steps }] });
      await input.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    await dragTouch(".docs-drawer-handle", 300, 0);
    await expect(page.locator("#navbarSupportedContent")).toHaveJSProperty("hidden", true);
    await page.locator("#button-navbar-menu").click();
    await expect(page.locator("#navbarSupportedContent")).toHaveClass(/\bae--pop\b/);
    await dragTouch(".docs-drawer-handle", 80, 0, 1);
    await expect(page.locator("#navbarSupportedContent")).toHaveJSProperty("hidden", true);
    await page.locator("#button-toc-menu").click();
    await expect(page.locator("#toc-collapse")).toHaveClass(/\bae--pop\b/);
    await dragTouch(".toc-drag-handle", 0, -600);
    await expect(page.locator("#toc-collapse")).toHaveJSProperty("hidden", true);
    await page.locator("#button-toc-menu").click();
    await expect(page.locator("#toc-collapse")).toHaveClass(/\bae--pop\b/);
    await dragTouch(".toc-drag-handle", 0, -80, 1);
    await expect(page.locator("#toc-collapse")).toHaveJSProperty("hidden", true);
    expect(await page.evaluate(() => pointerCancels)).toBe(0);
  } finally { await context.close(); }
});

for (const closing of ["toggle", "outside"]) test(`TOC ${closing} visibly reverses its opening transition`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/index.htm");
  await page.addStyleTag({ url: "/tests/fixtures/bootstrap-5.3.8.min.css" });
  await page.addStyleTag({ url: "/docs/assets/docweaver/css/style.css" });
  await page.evaluate(markup => {
    const parsed = new DOMParser().parseFromString(markup, "text/html");
    document.body.replaceChildren(document.importNode(parsed.querySelector(".toc-header"), true));
  }, html);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => new Promise(resolve => {
    aelluxJs.ext("present", { loadStyle: true });
    aelluxJs.on("Ready", resolve, { once: true });
    aelluxJs.init({ mode: "basic" });
  }));
  const panel = page.locator("#toc-collapse");
  await page.locator("#button-toc-menu").click();
  await expect(panel).toHaveClass(/\bae--pop\b/);
  if (closing === "toggle") await page.locator("#button-toc-menu").click();
  else await page.locator("body").evaluate(element => element.click());
  const samples = await panel.evaluate(async element => {
    const read = () => ({ klass: element.className, hidden: element.hidden,
      scale: new DOMMatrix(getComputedStyle(element).transform).m22 });
    const values = [read()];
    for (let i = 0; i < 7; i++) { await new Promise(resolve => setTimeout(resolve, 20)); values.push(read()); }
    return values;
  });
  expect(samples.some(sample => sample.klass.includes("ae--unpopping") && !sample.hidden && sample.scale > 0 && sample.scale < 1)).toBe(true);
  expect(samples.some(sample => sample.klass.includes("ae--dismissing"))).toBe(false);
  await expect(panel).toHaveJSProperty("hidden", true);
});
