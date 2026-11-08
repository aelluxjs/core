import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const entry = "/home/library/index.htm";
const first = "#snippet-hello-present";
const last = "#snippet-next-focus";
const sidebar = "#snippet-responsive-sidebar";
const sourceWindow = {};
runInNewContext(await readFile(new URL("../../home/library/assets/snippets.js", import.meta.url), "utf8"), { window: sourceWindow });
const sidebarSource = sourceWindow.librarySource.snippets.find(snippet => snippet.id === "responsive-sidebar").code;

async function openSidebar(page) {
  await open(page);
  await page.locator('#category-filters [data-category="navegacao"]').click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(2);
  await expect(page.locator(`${sidebar} h3`)).toHaveText("Responsive Sidebar");
  await page.locator(`${sidebar} .preview-slot`).scrollIntoViewIfNeeded();
  await expect(page.locator(`${sidebar} .preview-state`)).toHaveText("· ao vivo");
  await page.locator(`${sidebar} [data-action="expand"]`).click();
  return page.frameLocator(`${sidebar} iframe`);
}

async function settledSidebar(frame, desktop) {
  const root = frame.locator(".ae-lib-sidebar");
  const panel = frame.locator("#ae-sidebar-nav");
  await expect(root).not.toHaveAttribute("data-sidebar-switching");
  await expect(panel).toHaveClass(/ae--dismissed/);
  await expect(panel).not.toHaveClass(/ae--(?:popping|dismissing|will-change)/);
  if (desktop) await expect(panel).toBeVisible();
  else await expect(panel).toBeHidden();
  await expect(panel).toHaveAttribute("aria-expanded", String(desktop));
  expect(await panel.evaluate(element => element.inert)).toBe(!desktop);
}

async function open(page) {
  await page.goto(entry);
  await expect(page.locator(`${first} .preview-state`)).toHaveText("· ao vivo");
}

test.use({ viewport: { width: 390, height: 844 } });

test("source renders the feed, and the mobile/desktop layouts fit the viewport", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await open(page);
  await expect(page.locator("[data-snippet]")).toHaveCount(7);
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
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(7);
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
  for (const id of ["little-tabs", "responsive-sidebar", "slow-scroll", "in-view", "your-theme", "next-focus"]) {
    await page.locator(`#snippet-${id} .preview-slot`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#snippet-${id} .preview-state`)).toHaveText("· ao vivo");
    await expect(page.frameLocator(`#snippet-${id} iframe`).locator("h1, .ae-lib-sidebar__title")).toBeVisible();
    if (id === "responsive-sidebar") {
      const frame = page.frameLocator(`${sidebar} iframe`);
      await frame.getByRole("button", { name: "Abrir navegação" }).click();
      await expect(frame.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
      await expect(frame.locator("#ae-sidebar-nav")).toHaveClass(/ae--pop(?:\s|$)/);
      await frame.getByRole("button", { name: "Fechar navegação" }).click();
      await settledSidebar(frame, false);
    }
  }
  const frame = page.frameLocator(`${last} iframe`);
  await frame.locator("#name").fill("Ada");
  await frame.locator("#name").press("Enter");
  await expect(frame.locator("#idea")).toBeFocused();
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Responsive Sidebar uses measured container width and works at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    const frame = await openSidebar(page);
    const root = frame.locator(".ae-lib-sidebar");
    const panel = frame.locator("#ae-sidebar-nav");
    const opener = frame.getByRole("button", { name: "Abrir navegação" });
    await expect.poll(() => root.evaluate(element => Number(element.style.getPropertyValue("--ae-width"))))
      .toBeCloseTo(width, 0);
    const measured = await root.evaluate(element => element.getBoundingClientRect().width);
    const desktop = measured >= 768;
    await expect(frame.locator("nav")).toHaveCount(1);
    await settledSidebar(frame, desktop);
    expect(await root.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await frame.locator("html").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (desktop) {
      await expect(opener).toBeHidden();
      await expect(frame.locator(".ae-lib-sidebar__backdrop")).toBeHidden();
      await panel.getByRole("link").first().focus();
      await expect(panel.getByRole("link").first()).toBeFocused();
      const content = frame.getByRole("main");
      await content.evaluate(element => { element.scrollTop = 100; });
      expect(await content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    } else {
      await expect(opener).toHaveAttribute("aria-controls", "ae-sidebar-nav");
      await expect(opener).toHaveAttribute("aria-expanded", "false");
      await opener.focus();
      await page.keyboard.press("Tab");
      await expect(frame.getByRole("main")).toBeFocused();
      for (const [key, close] of [["Enter", "button"], ["Space", "backdrop"], ["Enter", "escape"], ["Enter", "link"]]) {
        await opener.focus();
        await opener.press(key);
        await expect(panel).toHaveClass(/ae--pop(?:\s|$)/);
        await expect(opener).toHaveAttribute("aria-expanded", "true");
        await expect(panel.getByRole("button", { name: "Fechar navegação" })).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(panel.getByRole("link").first()).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(panel.getByRole("button")).toBeFocused();
        if (close === "button") await panel.getByRole("button").click();
        if (close === "backdrop") await frame.locator(".ae-lib-sidebar__backdrop").click({ position: { x: width - 8, y: 100 } });
        if (close === "escape") await page.keyboard.press("Escape");
        if (close === "link") await panel.getByRole("link").first().click();
        await settledSidebar(frame, false);
        await expect(opener).toBeFocused();
        await expect(page.locator(`${sidebar} .preview-shell`)).toHaveClass(/is-fullscreen/);
      }
      // This drawer is non-modal: native Tab can leave its navigation.
      await opener.click();
      await expect(panel).toHaveClass(/ae--pop(?:\s|$)/);
      await panel.getByRole("link").last().focus();
      await page.keyboard.press("Tab");
      await expect(frame.getByRole("main")).toBeFocused();
      await page.keyboard.press("Escape");
      await settledSidebar(frame, false);
      await expect(opener).toBeFocused();
    }
    expect(errors).toEqual([]);
    await expect(page.locator(`${sidebar} .preview-state`)).toHaveText("· ao vivo");
  });
}

test("Responsive Sidebar survives interrupted transitions and responds to a narrow container in a wide viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  const frame = await openSidebar(page);
  const root = frame.locator(".ae-lib-sidebar");
  const panel = frame.locator("#ae-sidebar-nav");
  await settledSidebar(frame, true);
  for (const width of [390, 1024, 320, 1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => root.evaluate(element => Number(element.style.getPropertyValue("--ae-width")))).toBeCloseTo(width, 0);
    await settledSidebar(frame, width >= 768);
  }
  const opener = frame.getByRole("button", { name: "Abrir navegação" });
  await opener.click();
  await expect(opener).toHaveAttribute("aria-expanded", "true");
  await page.setViewportSize({ width: 1024, height: 900 });
  await settledSidebar(frame, true);
  await root.evaluate(element => { element.style.width = "390px"; });
  await expect(root).not.toHaveClass(/ae--fits-medium/);
  await settledSidebar(frame, false);
  await opener.click();
  await expect(opener).toHaveAttribute("aria-expanded", "true");
  // Cross the threshold while Present is still preparing or playing its opening.
  await root.evaluate(async element => {
    for (const width of [800, 360, 900, 320, 1024]) {
      element.style.width = `${width}px`;
      await new Promise(resolve => setTimeout(resolve, 35));
    }
  });
  await expect(root).toHaveClass(/ae--fits-medium/);
  await settledSidebar(frame, true);
  const geometry = await panel.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, width: rect.width, transform: getComputedStyle(element).transform };
  });
  expect(geometry.left).toBeCloseTo(0, 0);
  expect(geometry.width).toBe(256);
  expect(geometry.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
  await root.evaluate(element => { element.style.width = "320px"; });
  await expect(root).not.toHaveClass(/ae--fits-medium/);
  await settledSidebar(frame, false);
});

test("copy actions export current source or the full runtime document and preserve the manual fallback", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.copiedLibraryText = null;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async text => { window.copiedLibraryText = text; }
    } });
  });
  const editor = page.locator(`${sidebar} textarea`);
  const original = await editor.inputValue();
  let fullExample;
  for (const code of [original, `${original}\n<!-- Edição que também será copiada -->`]) {
    await editor.fill(code);
    await page.locator(`${sidebar} [data-action="copy"]`).click();
    const snippet = await page.evaluate(() => window.copiedLibraryText);
    expect(snippet).toBe(code);
    expect(snippet).toContain("<style>");
    expect(snippet).toContain("<script>");
    expect(snippet).toContain("ae-lib-sidebar");
    expect(snippet).not.toMatch(/<!doctype|<(?:html|head|body)(?:\s|>)|\$ae\.init\(|\$ae\.ext\(/i);
    await expect(page.locator("#notice")).toContainText("Snippet copiado");
    await page.locator(`${sidebar} [data-action="copy-full"]`).click();
    const full = await page.evaluate(() => window.copiedLibraryText);
    fullExample = full;
    expect(full).toContain("<!doctype html>");
    expect(full).toContain("bootstrap.min.css");
    expect(full).toContain("aellux.min.js");
    expect(full).toContain('$ae.ext("adaptive", {loadStyle:true})');
    expect(full).toContain('$ae.init({mode:"basic"');
    expect(full).toContain(code);
    await expect(page.locator("#notice")).toContainText("Exemplo completo copiado");
  }
  await page.locator(`${sidebar} [data-action="reset"]`).click();
  await expect(editor).toHaveValue(original);
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new Error("Clipboard unavailable"); };
  });
  for (const action of ["copy", "copy-full"]) {
    await page.locator(`${sidebar} [data-action="${action}"]`).click();
    await expect(editor).toBeFocused();
    expect(await editor.evaluate(element => element.selectionEnd - element.selectionStart)).toBe(original.length);
    await expect(page.locator("#notice")).toContainText("copie o código pelo teclado");
  }
  await page.route("**/tests/copied-sidebar.htm", route => route.fulfill({ contentType: "text/html; charset=utf-8", body: fullExample }));
  await page.goto("/tests/copied-sidebar.htm");
  await expect(page.locator(".ae-lib-sidebar")).toHaveClass(/ae--fits-compact/);
  await settledSidebar(page, false);
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await expect(page.locator("#ae-sidebar-nav")).toHaveClass(/ae--pop(?:\s|$)/);
  await page.keyboard.press("Escape");
  await settledSidebar(page, false);
});

for (const lateMount of [false, true]) {
  test(`Responsive Sidebar embeds without Bootstrap, with reduced motion, ${lateMount ? "after" : "before"} runtime startup`, async ({ page }) => {
    const errors = [], requests = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => requests.push(request.url()));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route("**/tests/sidebar-embed.htm", route => route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html>
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#host{width:390px;max-width:100%}</style>
      <script src="/dist/aellux.min.js"></script><script>$ae.ext("present",{loadStyle:true});$ae.ext("adaptive",{loadStyle:true});$ae.ext("focus");$ae.init({mode:"basic",useHash:false});</script></head>
      <body><nav id="host-navigation"><a href="#host">Host navigation</a></nav><button id="host-button">Host control</button><div id="host">${lateMount ? "" : sidebarSource}</div></body></html>` }));
    await page.goto("/tests/sidebar-embed.htm");
    if (lateMount) {
      await expect.poll(() => page.evaluate(() => !!$ae.ext.focus?.initialized)).toBe(true);
      await page.evaluate(async code => {
        const host = document.getElementById("host");
        host.innerHTML = code;
        const previous = host.querySelector("script");
        const script = document.createElement("script");
        script.textContent = previous.textContent;
        previous.replaceWith(script);
        await $ae.mount(host);
      }, sidebarSource);
    }
    await expect(page.locator(".ae-lib-sidebar")).toHaveClass(/ae--fits-compact/);
    await settledSidebar(page, false);
    const opener = page.getByRole("button", { name: "Abrir navegação" });
    const panel = page.locator("#ae-sidebar-nav");
    await opener.click();
    await expect(panel).toHaveClass(/ae--pop(?:\s|$)/);
    expect(await panel.evaluate(element => getComputedStyle(element).transitionDuration)).toBe("0s");
    await page.keyboard.press("Escape");
    await settledSidebar(page, false);
    await expect(opener).toBeFocused();
    // 200% / 400% zoom equivalents: less available CSS width and larger text.
    for (const [width, textSize] of [[720, "100%"], [360, "200%"], [320, "200%"]]) {
      await page.locator("#host").evaluate((element, value) => { element.style.width = `${value}px`; }, width);
      await page.locator(".ae-lib-sidebar").evaluate((element, value) => { element.style.fontSize = value; }, textSize);
      await expect.poll(() => page.locator(".ae-lib-sidebar").evaluate(element => Number(element.style.getPropertyValue("--ae-width")))) .toBe(width);
      await opener.click();
      await expect(panel).toHaveClass(/ae--pop(?:\s|$)/);
      await panel.getByRole("link").first().evaluate(element => { element.textContent = "Navegação com um rótulo muito longo para testar a quebra de linhas"; });
      expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.locator(".ae-lib-sidebar").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      await page.keyboard.press("Escape");
      await settledSidebar(page, false);
    }
    expect(await page.locator("#host-button").evaluate(element => element.offsetWidth)).toBeLessThan(200);
    expect(await page.locator("#host-navigation").evaluate(element => getComputedStyle(element).position)).toBe("static");
    expect(requests.some(url => /bootstrap|fonts\./i.test(url))).toBe(false);
    expect(errors).toEqual([]);
  });
}
