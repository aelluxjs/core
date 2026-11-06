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
  // Standalone examples use system fonts; the homepage brand loads Geist below.
  await context.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ body: "", contentType: "text/css" }));
  // The brand SVGs import Geist directly; export tests use the real frozen font.
  await context.route("https://fonts.gstatic.com/s/geist/**", route =>
    route.fulfill({ path: "tests/fixtures/geist-v5/geist-latin.woff2", contentType: "font/woff2" }));
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

test("homepage getting started columns stay stable across zoom-equivalent viewport changes", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/home/index.htm#getting-started");
  const container = page.locator("#getting-started > .container");
  await expect(page.locator("[data-ae-adaptive], [data-ae-wait-mounted]")).toHaveCount(0);
  // 1920 -> 1536 CSS pixels models the available-width change at 100% -> 125% zoom.
  for (const width of [1920, 1536, 1000, 980, 1920]) {
    await page.setViewportSize({ width, height: Math.round(width * 1080 / 1920) });
    const expectedColumns = width >= 992 ? 2 : 1;
    const samples = await container.evaluate(async element => {
      const samples = [];
      for (let i = 0; i < 20; i++) {
        await new Promise(requestAnimationFrame);
        const articles = [...element.querySelectorAll("article")];
        samples.push({
          sameRow: Math.abs(articles[0].getBoundingClientRect().top - articles[1].getBoundingClientRect().top) < 1,
          columnFraction: articles[0].getBoundingClientRect().width / articles[0].parentElement.getBoundingClientRect().width
        });
      }
      return samples;
    });
    for (const sample of samples) {
      expect(sample.sameRow).toBe(expectedColumns === 2);
      expect(sample.columnFraction).toBeCloseTo(1 / expectedColumns, 3);
    }
  }
});

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
    ["rgb(255, 193, 7)", "rgb(33, 37, 41)"],
    ["rgb(255, 193, 7)", "rgb(222, 226, 230)"],
    ["rgb(255, 193, 7)", "rgb(33, 37, 41)"],
    ["rgb(255, 193, 7)", "rgb(222, 226, 230)"],
    ["rgb(255, 193, 7)", "rgb(33, 37, 41)"]
  ]);
});

for (const theme of ["light", "dark"]) {
  for (const variant of ["symbol", "logotype"]) {
    test(`brand ${variant} SVG and PNG downloads preserve ${theme} colors and transparency`, async ({ page }) => {
      await page.goto("/home/index.htm");
      await expect.poll(() => page.evaluate(() => !!$ae.ext.svgDownloader?.initialized)).toBe(true);
      await page.getByRole("button", { name: theme === "dark" ? "Dark" : "Light", exact: true }).click();
      const wordColor = await page.evaluate(async () => {
        await document.fonts.ready;
        return getComputedStyle(document.querySelector(".hero-prism-text")).color;
      });
      await expect(page.locator(`#brand-${variant} .ae-brand-tile`)).toHaveCSS("fill",
        await page.locator(".hero .brand-mark").evaluate(el => getComputedStyle(el).backgroundColor));
      await expect(page.locator(`#brand-${variant} .ae-brand-glyph`)).toHaveCSS("fill",
        await page.locator(".hero .brand-mark").evaluate(el => getComputedStyle(el).color));
      await expect(page.locator(`#brand-${variant} .ae-brand-glyph`)).toHaveCSS("font-family", /Geist/);
      await expect(page.locator(`#brand-${variant} .ae-brand-glyph`)).toHaveCSS("font-weight", "650");
      if (variant === "logotype") {
        await expect(page.locator("#brand-logotype .ae-brand-word")).toHaveCSS("fill", wordColor);
        await expect(page.locator("#brand-logotype .ae-brand-word")).toHaveCSS("font-weight", "650");
        await expect(page.locator("#brand-logotype .ae-brand-suffix")).toHaveCSS("font-weight", "400");
        const proportions = await page.evaluate(() => {
          const word = document.querySelector("#brand-logotype .ae-brand-word");
          const tile = document.querySelector("#brand-logotype .ae-brand-tile");
          const glyph = document.querySelector("#brand-logotype .ae-brand-glyph");
          const hero = document.querySelector(".hero-prism-text");
          const heroTile = document.querySelector(".hero .brand-mark");
          return {
            tile: tile.getBBox().width / parseFloat(getComputedStyle(word).fontSize),
            heroTile: heroTile.getBoundingClientRect().width / parseFloat(getComputedStyle(hero).fontSize),
            glyph: parseFloat(getComputedStyle(glyph).fontSize) / parseFloat(getComputedStyle(word).fontSize),
            heroGlyph: parseFloat(getComputedStyle(heroTile).fontSize) / parseFloat(getComputedStyle(hero).fontSize)
          };
        });
        expect(proportions.tile).toBeCloseTo(proportions.heroTile, 3);
        expect(proportions.glyph).toBeCloseTo(proportions.heroGlyph, 3);
      }
      const original = await page.locator(`#brand-${variant}`).evaluate(svg => svg.outerHTML);
      for (const format of ["svg", "png"]) {
        const pending = page.waitForEvent("download");
        await page.locator(`[data-ae-svg-downloader="brand-${variant}"][data-ae-svg-format="${format}"]`).click();
        const download = await pending;
        expect(download.suggestedFilename()).toBe(`aellux-${variant}.${format}`);
        const buffer = await readFile(await download.path());
        const rendered = await page.evaluate(async ({ base64, format, wordColor }) => {
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
            const allPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            const expected = wordColor.match(/\d+/g).map(Number);
            let wordPixels = 0;
            const bounds = { left: canvas.width, top: canvas.height, right: 0, bottom: 0 };
            for (let i = 0; i < allPixels.length; i += 4) {
              if (!allPixels[i + 3]) continue;
              const x = (i / 4) % canvas.width, y = Math.floor(i / 4 / canvas.width);
              bounds.left = Math.min(bounds.left, x);
              bounds.top = Math.min(bounds.top, y);
              bounds.right = Math.max(bounds.right, x);
              bounds.bottom = Math.max(bounds.bottom, y);
              if (x > 224 && allPixels[i] === expected[0] && allPixels[i + 1] === expected[1] && allPixels[i + 2] === expected[2] && allPixels[i + 3] === 255) wordPixels++;
            }
            let fontDifference = 0;
            if (format === "svg") {
              const withoutFont = (await blob.text()).replace(/@font-face\s*\{[^}]*\}/g, "");
              const fallback = new Image();
              await new Promise((resolve, reject) => {
                fallback.onload = resolve; fallback.onerror = reject;
                fallback.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withoutFont)}`;
              });
              context.clearRect(0, 0, canvas.width, canvas.height);
              context.drawImage(fallback, 0, 0);
              const fallbackPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
              for (let i = 0; i < allPixels.length; i += 4) {
                if (allPixels[i] !== fallbackPixels[i] || allPixels[i + 1] !== fallbackPixels[i + 1] ||
                  allPixels[i + 2] !== fallbackPixels[i + 2] || allPixels[i + 3] !== fallbackPixels[i + 3]) fontDifference++;
              }
            }
            const tileIndex = (144 * canvas.width + 84) * 4;
            let pngDifference = 0;
            if (format === "svg") window.brandSVGExportPixels = allPixels;
            else {
              const reference = window.brandSVGExportPixels;
              for (let i = 0; i < allPixels.length; i += 4) {
                pngDifference = Math.max(pngDifference, Math.abs(allPixels[i + 3] - reference[i + 3]));
                for (let channel = 0; channel < 3; channel++) {
                  // Compare premultiplied color: PNG round trips may round the
                  // RGB of translucent edge pixels, especially in WebKit.
                  pngDifference = Math.max(pngDifference,
                    Math.abs(allPixels[i + channel] * allPixels[i + 3] / 255 - reference[i + channel] * reference[i + 3] / 255));
                }
              }
            }
            return { width: canvas.width, height: canvas.height, tile: [...allPixels.slice(tileIndex, tileIndex + 4)],
              corner: [...allPixels.slice(0, 4)], bounds, wordPixels, fontDifference, pngDifference };
          } finally { URL.revokeObjectURL(url); }
        }, { base64: buffer.toString("base64"), format, wordColor });
        expect(rendered.width).toBe(variant === "symbol" ? 384 : 904);
        expect(rendered.height).toBe(384);
        expect(rendered.tile).toEqual([255, 193, 7, 255]);
        expect(rendered.corner[3]).toBe(0);
        expect(rendered.bounds.left).toBe(64);
        expect(rendered.bounds.top).toBeGreaterThanOrEqual(64);
        expect(rendered.bounds.right).toBeLessThanOrEqual(rendered.width - 65);
        if (variant === "logotype") expect(rendered.width - rendered.bounds.right - 1).toBeLessThanOrEqual(85);
        expect(rendered.bounds.bottom).toBeLessThanOrEqual(rendered.height - 65);
        if (variant === "logotype") expect(rendered.wordPixels).toBeGreaterThan(1000);
        if (format === "svg") {
          expect(buffer.toString("utf8")).toContain("@font-face");
          expect(buffer.toString("utf8")).toContain("data:font/woff2;base64,");
          expect(buffer.toString("utf8")).not.toContain("https://fonts.");
          expect(rendered.fontDifference).toBeGreaterThan(100);
          const frozenColors = await page.evaluate(async svg => {
            const frame = document.createElement("iframe");
            frame.srcdoc = `<html data-bs-theme="dark" data-ae-color-scheme="dark"><body>${svg}</body></html>`;
            const loaded = new Promise(resolve => { frame.onload = resolve; });
            document.body.append(frame);
            await loaded;
            const lettering = frame.contentDocument.querySelector(".ae-brand-word, .ae-brand-glyph:last-child");
            const colors = [frame.contentWindow.getComputedStyle(lettering).fill];
            frame.contentDocument.documentElement.setAttribute("data-bs-theme", "light");
            frame.contentDocument.documentElement.setAttribute("data-ae-color-scheme", "light");
            colors.push(frame.contentWindow.getComputedStyle(lettering).fill);
            frame.remove();
            return colors;
          }, buffer.toString("utf8"));
          const expected = variant === "logotype" ? wordColor : "rgb(33, 37, 41)";
          expect(frozenColors).toEqual([expected, expected]);
        } else {
          expect(rendered.pngDifference).toBeLessThanOrEqual(2);
        }
      }
      expect(await page.locator(`#brand-${variant}`).evaluate(svg => svg.outerHTML)).toBe(original);
    });
  }
}

test("inline head initialization publishes preferences early and loads Full only on the homepage", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("AelluxJsPreferences", "colorScheme=dark"));
  const documents = ["index", "examples/carousel", "examples/viewport", "examples/floating",
    "examples/navigation"];
  const stylesheet = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css";
  for (const document of documents) {
    const homepage = document === "index";
    const extensions = homepage ? ["preference", "present", "scrollbox", "anchor", "viewport"]
      : document === "examples/carousel" ? ["preference", "scrollbox", "viewport", "input", "present"]
      : document === "examples/viewport" ? ["preference", "viewport", "scrollbox"]
      : document === "examples/floating" ? ["preference", "anchor", "present", "input", "focus"]
      : ["preference", "state-navigation", "present", "focus", "adaptive", "feedback"];
    const styles = homepage ? ["aellux.full.css"]
      : document === "examples/carousel" ? ["aellux.ext.scrollbox.css", "aellux.ext.present.css"]
      : document === "examples/floating" ? ["aellux.ext.anchor.css", "aellux.ext.present.css"]
      : document === "examples/viewport" ? ["aellux.ext.scrollbox.css"]
      : ["aellux.ext.present.css", "aellux.ext.adaptive.css", "aellux.ext.feedback.css"];
    const assets = [];
    const recordAsset = request => {
      const url = new URL(request.url());
      if (request.frame() === page.mainFrame() && url.pathname.startsWith("/dist/")) {
        assets.push(url.pathname.split("/").pop().replace(".min.", "."));
      }
    };
    page.on("request", recordAsset);
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
        syncBootstrapThemeTag: $ae.options.syncBootstrapThemeTag,
        colorScheme: $ae.currentPreference("color-scheme"),
        bootstrapTheme: window.document.documentElement.getAttribute("data-bs-theme"),
        stylesheetLoaded: !!window.document.querySelector('link[href*="bootstrap@"]')?.sheet
      }));
    } finally {
      release();
      await navigation;
    }
    expect(earlyState).toEqual({ mode: homepage ? "full" : "basic", syncBootstrapThemeTag: true,
      colorScheme: "dark", bootstrapTheme: "dark", stylesheetLoaded: false });
    await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
    await expect.poll(() => page.evaluate(names => names.every(name => {
      const key = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      return !!$ae.ext[key]?.initialized;
    }), extensions)).toBe(true);
    expect(assets.sort()).toEqual([
      "aellux.js", homepage ? "aellux.full.js" : "aellux.orchestrator.js",
      ...(homepage ? [] : extensions).map(name => `aellux.ext.${name}.js`),
      ...(extensions.includes("input") ? ["aellux.input.point.js", "aellux.input.keyboard.js"] : []),
      ...styles
    ].sort());
    page.off("request", recordAsset);
    await page.unroute(stylesheet);
  }
});

test("gallery combines native navigation, pointer dragging and exclusive field notes", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 640 });
  await openExample(page, "carousel", "present");
  await page.getByRole("button", { name: "Next places" }).click();
  await expect.poll(() => page.locator("#gallery").evaluate(e => e.scrollLeft)).toBeGreaterThan(100);
  await page.getByRole("button", { name: "Previous places" }).click();
  await expect.poll(() => page.locator("#gallery").evaluate(e => e.scrollLeft)).toBeLessThan(2);
  const box = await page.locator("#gallery").boundingBox();
  await page.mouse.move(box.x + box.width - 35, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 35, box.y + 80, { steps: 16 });
  await page.mouse.up();
  await expect.poll(() => page.locator("#gallery").evaluate(e => e.scrollLeft)).toBeGreaterThan(50);
  const explore = page.getByRole("button", { name: "Explore Into the dunes" });
  await explore.scrollIntoViewIfNeeded();
  await explore.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#gallery-notes")).toHaveAttribute("data-ae-present-active", "notes-03");
  await expect(page.locator("#notes-01")).toBeHidden();
  await expect(page.locator("#notes-03")).toBeVisible();
  await expect(explore).toHaveAttribute("aria-expanded", "true");
});

test("gallery retains native touch panning and Point activation opens a single selection", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Native touch input is driven through Chromium CDP.");
  await page.setViewportSize({ width: 375, height: 640 });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await openExample(page, "carousel", "input");
  const box = await page.locator("#gallery").boundingBox();
  const y = box.y + 70;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width - 20, y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + box.width - 20 - i * 20, y }] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.locator("#gallery").evaluate(e => e.scrollLeft)).toBeGreaterThan(10);
  const explore = page.getByRole("button", { name: "Explore Into the dunes" });
  await explore.scrollIntoViewIfNeeded();
  const target = await explore.boundingBox();
  const point = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  await page.evaluate(() => {
    window.galleryPops = 0;
    $ae.onEvent(document.getElementById("notes-03"), "BeforePop", () => galleryPops++);
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator("#notes-03")).toHaveClass(/ae--pop/);
  expect(await page.evaluate(() => galleryPops)).toBe(1);
  await cdp.detach();
});

test("Viewport publishes intermediate geometry and motion preference disables layered effects", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 640 });
  await openExample(page, "viewport", "viewport");
  const card = page.locator("#viewport-card-3");
  await expect.poll(() => card.evaluate(e => e.style.getPropertyValue("--ae-viewport-visible"))).not.toBe("");
  const scroller = page.locator(".viewport-scroll");
  await scroller.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => scroller.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
  // Half a panel is visible: verify actual intermediate CSS, beyond endpoints.
  await scroller.evaluate(e => e.scrollTo({ left: e.scrollWidth - e.clientWidth * 1.5, behavior: "instant" }));
  await expect.poll(() => card.evaluate(e => Number(e.style.getPropertyValue("--ae-viewport-visible")))).toBeGreaterThan(.2);
  const middle = await card.evaluate(e => ({ visible: Number(e.style.getPropertyValue("--ae-viewport-visible")), opacity: Number(getComputedStyle(e).opacity), scale: new DOMMatrix(getComputedStyle(e).transform).m11 }));
  expect(middle.visible).toBeLessThan(.95);
  expect(middle.opacity).toBeGreaterThan(.3);
  expect(middle.opacity).toBeLessThan(.97);
  expect(middle.scale).toBeGreaterThan(.92);
  expect(middle.scale).toBeLessThan(1);
  expect(await scroller.evaluate(e => e.scrollTop)).toBe(0);
  expect(await scroller.evaluate(e => e.scrollHeight <= e.clientHeight)).toBe(true);
  expect(await page.locator(".viewport-step").first().evaluate(e => e.style.getPropertyValue("--ae-viewport-visible"))).toBe("");
  await page.getByRole("button", { name: "Less motion" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-ae-reduced-motion", "reduced");
  await expect(card).toHaveCSS("transform", "none");
  await expect(card).toHaveCSS("opacity", "1");
  await expect(card.locator(".story-orbit > span")).toHaveCSS("transform", "none");
  await page.getByRole("button", { name: "System motion" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(card).toHaveCSS("transform", "none");
});

test("workspace editor follows its card, advances fields and restores focus on dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 600 });
  await openExample(page, "floating", "focus");
  const trigger = page.getByRole("button", { name: "Edit", exact: true });
  const panel = page.locator("#floating-panel");
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
  await expect.poll(geometry).toMatchObject({ above: true, centered: true });
  await page.setViewportSize({ width: 375, height: 600 });
  await expect.poll(geometry).toMatchObject({ centered: true });
  await page.getByLabel("Workspace name", { exact: true }).fill("Studio South");
  await expect(page.locator("#floating-trigger h2")).toHaveText("Studio South");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("A little reminder")).toBeFocused();
  await page.getByLabel("A little reminder").fill("A fresh start.");
  await expect(page.locator("#workspace-reminder")).toHaveText("A fresh start.");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Done", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(page.locator("#trigger-position")).toBeFocused();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Workspace name", { exact: true }).focus();
  await page.getByRole("button", { name: "Done", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  await expect(panel).toBeHidden();
});

test("local setup composes Focus, Preference, Adaptive, history and automatic Feedback", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 640 });
  await openExample(page, "navigation", "adaptive");
  await page.getByLabel("Project name").fill("Good Things");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Your name")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Continue" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#style")).toHaveClass(/ae--pop/);
  await expect(page.locator("#style-heading")).toBeFocused();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  await expect(page.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "See your workspace" }).click();
  await expect(page.locator("#preview")).toHaveClass(/ae--pop/);
  await expect(page.locator("#preview-name")).toHaveText("Good Things");
  const preview = page.locator("#workspace-preview");
  await page.locator("#preview-width").fill("220");
  await expect(preview).not.toHaveClass(/ae--fits-small/);
  await expect(preview.locator(".preview-layout")).toHaveCSS("flex-direction", "column");
  await page.locator("#preview-width").fill("460");
  // The configured small threshold is deliberately local to this component.
  await expect(preview).toHaveClass(/ae--fits-small/);
  await expect(preview.locator(".preview-layout")).toHaveCSS("flex-direction", "row");
  await page.getByRole("button", { name: "2. Style" }).click();
  await expect(page.locator("#style")).toHaveClass(/ae--pop/);
  await page.evaluate(() => history.back());
  await expect(page.locator("#preview")).toHaveClass(/ae--pop/);
  await page.evaluate(() => history.forward());
  await expect(page.locator("#style")).toHaveClass(/ae--pop/);
  await page.getByRole("button", { name: "3. Preview" }).click();
  await page.getByRole("button", { name: "Create local preview" }).click();
  await expect(page.locator("#setup-message")).toContainText("Your local preview is ready");
  await expect(page.locator("#setup-notice")).toHaveClass(/ae--pop/);
  await expect(page.locator("#setup-notice")).toBeHidden({ timeout: 8000 });
});

for (const name of ["carousel", "viewport", "floating", "navigation"]) {
  test(name + " reflows at narrow widths and with enlarged text", async ({ page }) => {
    await openExample(page, name, "preference");
    for (const width of [240, 320, 520]) {
      await page.setViewportSize({ width, height: 640 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");
    await page.setViewportSize({ width: 320, height: 640 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

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
      window.navigationTransitions = { pop: 0, dismiss: 0 };
      for (const [eventName, key] of [["BeforePop", "pop"], ["BeforeDismiss", "dismiss"]]) {
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
          closing: element.classList.contains("ae--dismissing") });
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
    expect(await page.evaluate(() => navigationTransitions)).toEqual({ pop: 1, dismiss: 1 });
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
    $ae.on("BeforeDismiss", event => {
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
  await expect(page.getByRole("button", { name: "Auto", exact: true })).toHaveAttribute("aria-pressed", "true");
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
