import { expect, test } from "@playwright/test";

async function start(page) {
  await page.goto("/tests/fixtures/documentation-app/nested-menu.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    AelluxJs.ext("present", { loadStyle: true });
    AelluxJs.init({ mode: "basic", environment: "development" });
  });
  await expect.poll(() => page.evaluate(() => !!AelluxJs.ext.present?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "present"));
}

for (const width of [1280, 390]) {
  test(`Documentation-style nested menu groups preserve their parent and coordinate siblings (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await start(page);
    if (width < 768) await page.locator(".navbar-toggler").click();

    const core = page.locator("#children-core-extensions");
    const optional = page.locator("#children2-optional");
    const bundled = page.locator("#children2-bundled");
    const coreButton = page.locator('[data-ae-target="#children-core-extensions"]');
    const optionalButton = page.locator('[data-ae-target="#children2-optional"]');
    const bundledButton = page.locator('[data-ae-target="#children2-bundled"]');
    const selected = () => page.evaluate(() => {
      const parent = document.getElementById("children-core-extensions");
      const nested = document.getElementById("children2-optional");
      return [parent, nested].map(panel =>
        AelluxJs.ext.present.selected(panel.closest("[data-ae-present-group]"))?.id ?? null);
    });
    const parentOpen = async () => {
      await expect(core).toBeVisible();
      await expect(coreButton).toHaveAttribute("aria-expanded", "true");
    };

    await expect(optional).toBeVisible();
    await expect.poll(selected).toEqual(["children-core-extensions", "children2-optional"]);
    await optionalButton.click();
    await expect(optional).toHaveJSProperty("hidden", true);
    await expect(optionalButton).toHaveAttribute("aria-expanded", "false");
    await parentOpen();

    await optionalButton.focus();
    await page.keyboard.press("Enter");
    await expect(optionalButton).toHaveAttribute("aria-expanded", "true");
    await parentOpen();
    await bundledButton.click();
    await expect(bundled).toBeVisible();
    await expect(optional).toHaveJSProperty("hidden", true);
    await expect.poll(selected).toEqual(["children-core-extensions", "children2-bundled"]);
    await parentOpen();

    await bundledButton.click();
    await expect(bundled).toHaveJSProperty("hidden", true);
    await expect.poll(selected).toEqual(["children-core-extensions", null]);
    await parentOpen();
    await optionalButton.click();
    await expect(optionalButton).toHaveAttribute("aria-expanded", "true");
    await coreButton.click();
    await expect(core).toHaveJSProperty("hidden", true);
    await coreButton.click();
    await expect(optional).toBeVisible();
    await parentOpen();

    await page.locator('[data-ae-target="#children-runtime"]').click();
    await expect(core).toHaveJSProperty("hidden", true);
    await coreButton.click();
    await expect(page.locator("#children-runtime")).toHaveJSProperty("hidden", true);
    await expect(optional).toBeVisible();
    await expect.poll(selected).toEqual(["children-core-extensions", "children2-optional"]);

    await page.setViewportSize({ width: width < 768 ? 1280 : 390, height: 900 });
    if (width >= 768) await page.locator(".navbar-toggler").click();
    await parentOpen();
    await optionalButton.click();
    await expect(optional).toHaveJSProperty("hidden", true);
    await parentOpen();
    expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2021))).toEqual([]);
  });
}
