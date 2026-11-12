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
