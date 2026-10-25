import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Eta } from "eta";
import { expect, test } from "@playwright/test";

const themePath = fileURLToPath(new URL("../../templates/docweaver/", import.meta.url));
const eta = new Eta({ views: themePath });

async function start(page) {
  const { summary } = JSON.parse(await readFile(new URL("../../docs-source/0.1.x/summary.json", import.meta.url), "utf8"));
  for (const group of summary) group.active = false;
  const core = summary.find(group => group.slug === "core-extensions");
  core.active = true;
  core.children.find(group => group.slug === "experimental").active = true;
  // Exercise multiple nested panels without adding a fictitious section to the docs.
  core.children.push({ label: "Preview", slug: "preview", children: [{ label: "Preview page", href: "#preview" }] });
  const html = eta.render("docs-layout.eta.htm", {
    menuTree: summary, title: "Docs", pageTitle: "Docs", description: "", faviconPath: null,
    homeHref: "#home", outputPath: "/templates/docweaver", breadcrumb: [], contentHtml: "",
    version: "0.1.x", versions: [], prevLink: null, nextLink: null
  }).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<link\b[^>]*>/gi, "");
  await page.route("**/tests/docweaver-menu.htm", route => route.fulfill({ contentType: "text/html", body: html }));
  await page.goto("/tests/docweaver-menu.htm");
  await page.addStyleTag({ url: "/tests/fixtures/bootstrap-5.3.8.min.css" });
  await page.addStyleTag({ url: "/templates/docweaver/css/inline-style.css" });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    AelluxJs.ext("present", { loadStyle: true });
    AelluxJs.init({ mode: "basic", environment: "development" });
  });
  await expect.poll(() => page.evaluate(() => !!AelluxJs.ext.present?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "present"));
}

for (const width of [1280, 390]) {
  test(`Docweaver nested menu groups preserve their parent and coordinate siblings (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await start(page);
    if (width < 768) await page.locator(".navbar-toggler").click();

    const core = page.locator("#children-core-extensions");
    const experimental = page.locator("#children2-experimental");
    const preview = page.locator("#children2-preview");
    const coreButton = page.locator('[data-ae-target="#children-core-extensions"]');
    const experimentalButton = page.locator('[data-ae-target="#children2-experimental"]');
    const previewButton = page.locator('[data-ae-target="#children2-preview"]');
    const selected = () => page.evaluate(() => {
      const parent = document.getElementById("children-core-extensions");
      const nested = document.getElementById("children2-experimental");
      return [parent, nested].map(panel =>
        AelluxJs.ext.present.selected(panel.closest("[data-ae-present-group]"))?.id ?? null);
    });
    const parentOpen = async () => {
      await expect(core).toBeVisible();
      await expect(coreButton).toHaveAttribute("aria-expanded", "true");
    };

    await expect(experimental).toBeVisible();
    await expect.poll(selected).toEqual(["children-core-extensions", "children2-experimental"]);
    await experimentalButton.click();
    await expect(experimental).toHaveJSProperty("hidden", true);
    await expect(experimentalButton).toHaveAttribute("aria-expanded", "false");
    await parentOpen();

    await experimentalButton.focus();
    await page.keyboard.press("Enter");
    await expect(experimentalButton).toHaveAttribute("aria-expanded", "true");
    await parentOpen();
    await previewButton.click();
    await expect(preview).toBeVisible();
    await expect(experimental).toHaveJSProperty("hidden", true);
    await expect.poll(selected).toEqual(["children-core-extensions", "children2-preview"]);
    await parentOpen();

    await previewButton.click();
    await expect(preview).toHaveJSProperty("hidden", true);
    await expect.poll(selected).toEqual(["children-core-extensions", null]);
    await parentOpen();
    await experimentalButton.click();
    await expect(experimentalButton).toHaveAttribute("aria-expanded", "true");
    await coreButton.click();
    await expect(core).toHaveJSProperty("hidden", true);
    await coreButton.click();
    await expect(experimental).toBeVisible();
    await parentOpen();

    await page.locator('[data-ae-target="#children-runtime"]').click();
    await expect(core).toHaveJSProperty("hidden", true);
    await coreButton.click();
    await expect(page.locator("#children-runtime")).toHaveJSProperty("hidden", true);
    await expect(experimental).toBeVisible();
    await expect.poll(selected).toEqual(["children-core-extensions", "children2-experimental"]);

    await page.setViewportSize({ width: width < 768 ? 1280 : 390, height: 900 });
    if (width >= 768) await page.locator(".navbar-toggler").click();
    await parentOpen();
    await experimentalButton.click();
    await expect(experimental).toHaveJSProperty("hidden", true);
    await parentOpen();
    expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2021))).toEqual([]);
  });
}
