import { expect, test } from "@playwright/test";

const entry = "/home/library/index.htm";
const first = "#snippet-hello-present";
const last = "#snippet-next-focus";

async function open(page) {
  await page.goto(entry);
  await expect(page.locator(`${first} .preview-state`)).toHaveText("· ao vivo");
}

test.use({ viewport: { width: 390, height: 844 } });

test("source renders the feed, and the mobile/desktop layouts fit the viewport", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await open(page);
  await expect(page.locator("[data-snippet]")).toHaveCount(6);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("navigation", { name: "Menu inferior" })).toBeVisible();
  }
  const frame = page.frameLocator(`${first} iframe`);
  await frame.getByRole("button", { name: /Dizer/ }).click();
  await expect(frame.locator("#hello")).toBeVisible();
  expect(errors).toEqual([]);
});

test("search applies on submit, normalizes accents, and combines categories and tags", async ({ page }) => {
  await open(page);
  await page.locator("#search").fill("ANIMACAO");
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(6);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(1);
  await page.locator("#clear-filters").click();
  await page.locator('#category-filters [data-category="rolagem"]').click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(2);
  await page.locator('[data-tag="scrollbox"]').click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(1);
  await page.locator("#clear-filters").click();
  await page.locator('.bottom-nav [data-view="categories"]').click();
  await expect(page.locator("#category-grid button")).toHaveCount(4);
  await page.locator('#category-grid [data-category="interacao"]').click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(2);
});

test("only visible previews execute, while code survives unloading and re-entry", async ({ page }) => {
  await open(page);
  await expect(page.locator(`${last} iframe`)).not.toHaveAttribute("srcdoc");
  await page.locator(`${last} .preview-slot`).scrollIntoViewIfNeeded();
  await expect(page.locator(`${last} .preview-state`)).toHaveText("· ao vivo");
  await expect(page.locator(`${first} iframe`)).not.toHaveAttribute("srcdoc");
  await page.locator(`${first} .preview-slot`).scrollIntoViewIfNeeded();
  await expect(page.locator(`${first} .preview-state`)).toHaveText("· ao vivo");
  await expect(page.frameLocator(`${first} iframe`).getByRole("button", { name: /Dizer/ })).toBeVisible();
});

test("the snippets mount working tabs, pointer scrolling, Viewport CSS, theme and Focus", async ({ page }) => {
  await open(page);
  async function show(id) {
    await page.locator(`#snippet-${id} .preview-slot`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#snippet-${id} .preview-state`)).toHaveText("· ao vivo");
    return page.frameLocator(`#snippet-${id} iframe`);
  }
  const tabs = await show("little-tabs");
  await tabs.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(tabs.locator("#pause")).toBeVisible();
  await expect(tabs.locator("#make")).toBeHidden();

  const scroll = await show("slow-scroll");
  const gallery = scroll.locator("[data-ae-scrollbox]");
  const box = await gallery.boundingBox();
  await page.mouse.move(box.x + box.width * .8, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .2, box.y + 60, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => gallery.evaluate(element => element.scrollLeft)).toBeGreaterThan(20);

  const viewport = await show("in-view");
  const shape = viewport.locator("#shape");
  await expect.poll(() => shape.evaluate(element => element.style.getPropertyValue("--ae-viewport-y"))).not.toBe("");
  const before = await shape.evaluate(element => element.style.getPropertyValue("--ae-viewport-y"));
  await viewport.getByRole("region").evaluate(element => { element.scrollTop = 150; });
  await expect.poll(() => shape.evaluate(element => element.style.getPropertyValue("--ae-viewport-y"))).not.toBe(before);

  const preference = await show("your-theme");
  await preference.locator('[data-ae-option="dark"]').click();
  await expect(preference.locator("html")).toHaveAttribute("data-bs-theme", "dark");

  const focus = await show("next-focus");
  await focus.locator("#name").fill("Ada");
  await focus.locator("#name").press("Enter");
  await expect(focus.locator("#idea")).toBeFocused();
});

test("editing is debounced, persists locally, and keeps the preview isolated", async ({ page }) => {
  await open(page);
  // A tall viewport keeps the preview visible while the editor is focused.
  await page.setViewportSize({ width: 900, height: 1300 });
  const editor = page.locator(`${first} textarea`);
  const initial = await editor.inputValue();
  const code = `<main class="p-4"><h1 id="edited">Minha edição</h1></main><script>try { parent.document.body.dataset.escaped = "yes"; } catch { document.body.dataset.isolated = "yes"; }</script>`;
  await editor.fill(code);
  await expect(page.frameLocator(`${first} iframe`).locator("#edited")).toHaveCount(0);
  await expect(page.frameLocator(`${first} iframe`).locator("#edited")).toHaveText("Minha edição");
  await expect(page.frameLocator(`${first} iframe`).locator("body")).toHaveAttribute("data-isolated", "yes");
  expect(await page.locator("body").getAttribute("data-escaped")).toBeNull();
  await page.reload();
  await expect(editor).toHaveValue(code);
  await page.locator(`${first} [data-action="reset"]`).click();
  await expect(editor).toHaveValue(initial);
});

test("fullscreen uses fixed positioning and restores the card on Back, Forward and Escape", async ({ page }) => {
  await open(page);
  const shell = page.locator(`${first} .preview-shell`);
  const editor = page.locator(`${first} textarea`);
  await page.setViewportSize({ width: 900, height: 1300 });
  // Repeated srcdoc execution must not insert extra iframe history entries.
  for (const text of ["primeira", "segunda"]) {
    await editor.fill(`<main class="p-4"><p>${text}</p></main>`);
    await expect(page.frameLocator(`${first} iframe`).locator("p")).toHaveText(text);
  }
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.locator(`${first} [data-action="expand"]`).click();
  await expect(shell).toHaveClass(/is-fullscreen/);
  expect(await shell.evaluate(element => { const rect = element.getBoundingClientRect(); return { position: getComputedStyle(element).position, x: rect.x, y: rect.y, width: rect.width, height: rect.height }; })).toEqual({ position: "fixed", x: 0, y: 0, width: 900, height: 1300 });
  expect(await page.evaluate(() => $ae.ext.stateNavigation.globalSnapshot.preview)).toBe("hello-present");
  await page.goBack();
  await expect(shell).not.toHaveClass(/is-fullscreen/);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  await page.goForward();
  await expect(shell).toHaveClass(/is-fullscreen/);
  await page.locator(`${first} [data-action="back"]`).click();
  await expect(shell).not.toHaveClass(/is-fullscreen/);
  await page.locator(`${first} [data-action="expand"]`).click();
  await page.frameLocator(`${first} iframe`).locator("body").press("Escape");
  await expect(shell).not.toHaveClass(/is-fullscreen/);
  await expect(page.locator(`${first} [data-action="expand"]`)).toBeFocused();
});

test("bookmarks and drafts survive reloading; saved view has a useful empty state", async ({ page }) => {
  await open(page);
  await page.locator('.bottom-nav [data-view="saved"]').click();
  await expect(page.locator("#empty-state")).toBeVisible();
  await page.locator('[data-action="explore"]').click();
  await page.locator(`${first} [data-action="save"]`).click();
  await page.reload();
  await expect(page.locator(`${first} [data-action="save"]`)).toHaveAttribute("aria-pressed", "true");
  await page.locator('.bottom-nav [data-view="saved"]').click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(1);
  await page.locator(`${first} [data-action="save"]`).click();
  await expect(page.locator("#empty-state")).toBeVisible();
});

test("installation calls the captured native PWA prompt from the click", async ({ page }) => {
  await open(page);
  await page.evaluate(async () => { await $ae.wait("pwa"); });
  await page.evaluate(() => {
    window.libraryPromptCalls = 0;
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = () => { window.libraryPromptCalls++; return Promise.resolve({ outcome: "dismissed" }); };
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
  });
  await page.locator('.bottom-nav [data-action="install"]').click();
  expect(await page.evaluate(() => window.libraryPromptCalls)).toBe(1);
});

test("all examples, including unseen ones, work after a complete offline reload", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Real service worker/offline coverage runs in Chromium; UI is covered in all engines.");
  await open(page);
  await expect(page.locator("#offline-status")).toHaveText("Biblioteca pronta para usar offline.");
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(`${first} .preview-state`)).toHaveText("· ao vivo");
  await expect(page.locator("#connection-label")).toHaveText("Offline");
  for (const id of ["little-tabs", "slow-scroll", "in-view", "your-theme", "next-focus"]) {
    await page.locator(`#snippet-${id} .preview-slot`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#snippet-${id} .preview-state`)).toHaveText("· ao vivo");
    await expect(page.frameLocator(`#snippet-${id} iframe`).locator("h1")).toBeVisible();
  }
  const frame = page.frameLocator(`${last} iframe`);
  await frame.locator("#name").fill("Ada");
  await frame.locator("#name").press("Enter");
  await expect(frame.locator("#idea")).toBeFocused();
});
