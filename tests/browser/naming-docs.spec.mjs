import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

test("generated documentation boots, explains the model and navigates to the migration guide", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  // Serve the published /core prefix from this checkout, including signed assets.
  await page.route("**/core/**", async route => {
    const pathname = new URL(route.request().url()).pathname.replace(/^\/core\//, "");
    const path = fileURLToPath(new URL(`../../${pathname}`, import.meta.url));
    await route.fulfill({ path });
  });
  // External presentation helpers are independent of the library migration.
  await page.route("https://cdn.jsdelivr.net/**", async route => {
    const url = route.request().url();
    if (/bootstrap.*\.css$/.test(url)) {
      await route.fulfill({ path: fileURLToPath(new URL("../fixtures/bootstrap-5.3.8.min.css", import.meta.url)), contentType: "text/css" });
    } else if (url.endsWith(".css")) {
      await route.fulfill({ body: "", contentType: "text/css" });
    } else {
      const body = url.includes("tocbot.min.js") ? "window.tocbot = { init() {}, refresh() {} };" :
        url.includes("highlight.min.js") ? "window.hljs = { highlightElement() {} };" : "";
      await route.fulfill({ body, contentType: "text/javascript" });
    }
  });
  await page.goto("/core/docs/0.1.x/index.htm");
  await expect.poll(() => page.evaluate(() => globalThis.aelluxJs?.diagnostics.supported)).toBe(true);
  await expect(page.locator(".js-toc-content")).toContainText("aellux semantic model");
  await expect(page.locator(".js-toc-content")).toContainText("aellux.js library");
  await page.getByRole("link", { name: "Brand Naming and Migration", exact: true }).first().click();
  await expect(page).toHaveURL(/\/brand-naming\.htm$/);
  await expect(page.getByRole("heading", { name: "ællux.js Naming and Migration", exact: true })).toBeVisible();
  await expect(page.locator(".js-toc-content")).toContainText("aelluxJs.init");
  expect(await page.title()).toContain("aellux.js");
  expect(await page.locator('meta[property="og:site_name"]').getAttribute("content")).toBe("aellux.js");
  expect(errors).toEqual([]);
});
