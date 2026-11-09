import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { openCodePen } from "./library-codepen.mjs";

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
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(4);
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
  await expect(page.locator("[data-snippet]")).toHaveCount(17);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("navigation", { name: "Menu inferior" })).toBeVisible();
  }
  const frame = page.frameLocator(`${first} iframe`);
  await frame.getByRole("button", { name: /Dizer/ }).click();
  await expect(frame.locator("#ae-welcome-message")).toBeVisible();
  expect(errors).toEqual([]);
});

test("search applies on submit, normalizes accents, and combines categories and tags", async ({ page }) => {
  await open(page);
  await page.locator("#search").fill("ANIMACAO");
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(17);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(1);
  await page.locator("#clear-filters").click();
  await page.locator('#category-filters [data-category="rolagem"]').click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(3);
  await page.locator('[data-tag="scrollbox"]').first().click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(2);
  await page.locator("#clear-filters").click();
  await page.locator('.bottom-nav [data-view="categories"]').click();
  await expect(page.locator("#category-grid button")).toHaveCount(7);
  await page.locator('#category-grid [data-category="interacoes"]').click();
  await expect(page.locator("[data-snippet]:visible")).toHaveCount(1);
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
  await tabs.getByRole("tab", { name: "Pausar", exact: true }).click();
  await expect(tabs.locator("#ae-tabs-pause")).toBeVisible();
  await expect(tabs.locator("#ae-tabs-make")).toBeHidden();
  await expect(tabs.getByRole("tab", { name: "Pausar" })).toHaveAttribute("aria-selected", "true");
  await tabs.getByRole("tab", { name: "Pausar" }).press("Home");
  await expect(tabs.getByRole("tab", { name: "Criar" })).toBeFocused();
  await expect(tabs.locator("#ae-tabs-make")).toBeVisible();

  const scroll = await show("slow-scroll");
  const gallery = scroll.locator("[data-ae-scrollbox]");
  const box = await gallery.boundingBox();
  await page.mouse.move(box.x + box.width * .8, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .2, box.y + 60, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => gallery.evaluate(element => element.scrollLeft)).toBeGreaterThan(20);

  const viewport = await show("in-view");
  const shape = viewport.locator("#ae-reveal-idea");
  await expect.poll(() => shape.evaluate(element => element.style.getPropertyValue("--ae-viewport-y"))).not.toBe("");
  const before = await shape.evaluate(element => element.style.getPropertyValue("--ae-viewport-y"));
  await viewport.getByRole("region", { name: "História com revelação ao rolar", exact: true }).evaluate(element => { element.scrollTop = 150; });
  await expect.poll(() => shape.evaluate(element => element.style.getPropertyValue("--ae-viewport-y"))).not.toBe(before);

  const preference = await show("your-theme");
  await preference.locator('[data-ae-option="dark"]').click();
  await expect(preference.locator("html")).toHaveAttribute("data-bs-theme", "dark");

  const focus = await show("next-focus");
  await focus.locator("#ae-focus-name").fill("Ada");
  await focus.locator("#ae-focus-name").press("Enter");
  await expect(focus.locator("#ae-focus-idea")).toBeFocused();
  await focus.locator("#ae-focus-idea").fill("Uma biblioteca de boas ideias");
  await focus.getByRole("button", { name: "Guardar esta ideia ↗" }).click();
  await expect(focus.getByRole("status")).toBeVisible();
});

test("previews hide source, ignore old drafts and keep a noninteractive yellow background in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1300 });
  await page.addInitScript(() => localStorage.setItem("aellux-library-v1", JSON.stringify({
    drafts: { "hello-present": '<h1 id="old-draft">Old draft</h1>' }
  })));
  await open(page);
  await expect(page.locator("#feed textarea, #feed pre, .editor-panel")).toHaveCount(0);
  const frame = page.frameLocator(`${first} iframe`);
  await expect(frame.locator("#old-draft")).toHaveCount(0);
  expect(await frame.locator("body").evaluate(() => { try { return !!parent.document; } catch { return false; } })).toBe(false);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { $ae.ext.preference.set("colorScheme", theme); $ae.ext.preference.update(); }, theme);
    await expect(frame.locator("html")).toHaveAttribute("data-bs-theme", theme);
    expect(await frame.locator("body").evaluate(body => {
      const style = getComputedStyle(body, "::before");
      return { content: style.content, background: style.backgroundColor, position: style.position, inset: style.inset, pointerEvents: style.pointerEvents, zIndex: style.zIndex };
    })).toEqual({ content: '\"\"', background: "rgba(255, 214, 58, 0.12)", position: "fixed", inset: "0px", pointerEvents: "none", zIndex: "-1" });
    await frame.getByRole("button", { name: /Dizer/ }).click();
    await expect(frame.locator("#ae-welcome-message")).toBeVisible();
    await frame.getByRole("button", { name: "Entendi" }).click();
    await expect(frame.locator("#ae-welcome-message")).toBeHidden();
    await expect(frame.locator("#ae-welcome-message")).not.toHaveClass(/ae--(?:popping|dismissing|unpopping)/);
  }
});

test("fullscreen uses fixed positioning and restores the card on Back, Forward and Escape", async ({ page }) => {
  await open(page);
  const shell = page.locator(`${first} .preview-shell`);
  await page.setViewportSize({ width: 900, height: 1300 });
  // Repeated srcdoc execution must not insert extra iframe history entries.
  for (let reload = 0; reload < 2; reload++) {
    await page.locator(`${last} .preview-slot`).scrollIntoViewIfNeeded();
    await expect(page.locator(`${first} iframe`)).not.toHaveAttribute("srcdoc");
    await page.locator(`${first} .preview-slot`).scrollIntoViewIfNeeded();
    await expect(page.locator(`${first} .preview-state`)).toHaveText("· ao vivo");
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

test("bookmarks survive reloading; saved view has a useful empty state", async ({ page }) => {
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
  for (const { id } of sourceWindow.librarySource.snippets) {
    await page.locator(`#snippet-${id} .preview-slot`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#snippet-${id} .preview-state`)).toHaveText("· ao vivo");
    await expect(page.frameLocator(`#snippet-${id} iframe`).getByRole("heading").first()).toBeVisible();
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
  await frame.locator("#ae-focus-name").fill("Ada");
  await frame.locator("#ae-focus-name").press("Enter");
  await expect(frame.locator("#ae-focus-idea")).toBeFocused();
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

test("CodePen opens by POST in a separate window with editable source and working self-contained dependencies", async ({ page }) => {
  await open(page);
  await page.evaluate(() => { $ae.ext.preference.set("colorScheme", "dark"); $ae.ext.preference.update(); });
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  // Bootstrap/Input and the standalone Sidebar exercise both dependency paths.
  for (const id of ["hello-present", "responsive-sidebar"]) {
    const card = page.locator(`#snippet-${id}`);
    await card.locator(".preview-slot").scrollIntoViewIfNeeded();
    await expect(card.locator(".preview-state")).toHaveText("· ao vivo");
    if (id === "responsive-sidebar") await card.locator('[data-action="expand"]').click();
    const { pen, request, data } = await openCodePen(page, card.locator('[data-action="codepen"]'));
    expect(request.method()).toBe("POST");
    expect(request.headers()["content-type"]).toContain("application/x-www-form-urlencoded");
    expect(request.headers().referer).toBeUndefined();
    expect(await pen.evaluate(() => window.opener)).toBeNull();
    expect(page.url()).toContain(entry);
    expect(data.title).toContain(id === "hello-present" ? "Welcome Notification" : "Responsive Sidebar");
    expect(data.html).not.toMatch(/<style|<script/i);
    expect(data.css).toContain(id === "hello-present" ? ".ae-lib-welcome" : ".ae-lib-sidebar");
    expect(data.js).toContain("$ae.startAelluxJs()");
    expect(data.head).toContain('$ae.ext("present", {loadStyle:false})');
    expect(JSON.stringify(data)).not.toMatch(/localhost|127\.0\.0\.1|library-preview-background|library-ready|library-theme/);
    expect(await pen.locator("script[src], link[rel=stylesheet]").count()).toBe(0);
    await expect(pen.locator("html")).toHaveAttribute("data-bs-theme", "dark");
    if (id === "hello-present") {
      await expect(pen.getByRole("button", { name: /Dizer/ })).toHaveCSS("display", "inline-block");
      await pen.getByRole("button", { name: /Dizer/ }).click();
      await expect(pen.locator("#ae-welcome-message")).toBeVisible();
    } else {
      await settledSidebar(pen, false);
      await pen.getByRole("button", { name: "Abrir navegação" }).click();
      await expect(pen.locator("#ae-sidebar-nav")).toHaveClass(/ae--pop(?:\s|$)/);
      await pen.keyboard.press("Escape");
      await settledSidebar(pen, false);
      await expect(card.locator(".preview-shell")).toHaveClass(/is-fullscreen/);
    }
    await pen.close();
  }
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
