import { expect, test } from "@playwright/test";

async function start(page, { mode = "full", forceLegacy = false, markup = '<button id="install" data-ae-pwa="install">Install App</button>', options = {} } = {}) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(async ({ mode, forceLegacy, markup, options }) => {
    document.body.innerHTML = markup;
    if (mode === "basic") AelluxJs.ext("pwa", { loadWhen: "[data-ae-pwa]" });
    await new Promise(resolve => {
      AelluxJs.on("Ready", resolve, { once: true });
      AelluxJs.init({ mode, forceLegacy, extensions: { pwa: options } });
    });
  }, { mode, forceLegacy, markup, options });
}
async function nativeEvent(page, outcome = "accepted") {
  await page.evaluate(outcome => {
    window.promptCalls = 0;
    window.notifications = [];
    for (const name of ["PwaInstallRequested", "PwaInstallAccepted", "PwaInstallDismissed", "PwaInstalled"]) {
      AelluxJs.on(name, event => notifications.push({ name, installed: event.detail.status.installed }));
    }
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = () => {
      promptCalls++;
      window.promptInClick = window.inClick === true;
      window.promptActivation = navigator.userActivation?.isActive;
      return Promise.resolve({ outcome });
    };
    event.userChoice = Promise.resolve({ outcome });
    window.addEventListener("click", () => { window.inClick = true; }, { capture: true });
    window.addEventListener("click", () => { window.inClick = false; });
    window.dispatchEvent(event);
    window.promptPrevented = event.defaultPrevented;
  }, outcome);
}

for (const forceLegacy of [false, true]) {
  test(`Full without PWA has no PWA download, listeners, dialog or worker (Legacy=${forceLegacy})`, async ({ page }) => {
    const requests = [];
    page.on("request", request => requests.push(request.url()));
    await page.addInitScript(() => {
      const add = window.addEventListener;
      window.pwaListeners = [];
      window.addEventListener = function (name, ...args) {
        if (["beforeinstallprompt", "appinstalled"].includes(name)) pwaListeners.push(name);
        return add.call(this, name, ...args);
      };
    });
    await start(page, { forceLegacy, markup: "<main>Application</main>" });
    expect(await page.evaluate(() => ({ loaded: !!AelluxJs.ext.pwa, listeners: pwaListeners,
      bundled: Object.keys(AelluxJs.bundledExtensions).includes("pwa") }))).toEqual({ loaded: false, listeners: [], bundled: false });
    expect(requests.some(url => /ext\.pwa|pwa\.sw/.test(url))).toBe(false);
    expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(values => values.length))).toBe(0);
    await expect(page.locator("dialog")).toHaveCount(0);
  });
  for (const mode of ["basic", "full"]) {
    test(`${mode} lazy mount, synchronous prompt, keyboard and remount (Legacy=${forceLegacy})`, async ({ page }) => {
      await start(page, { mode, forceLegacy });
      expect(await page.evaluate(() => !!$ae("install").pwa)).toBe(true);
      await page.evaluate(async () => { await AelluxJs.mount(); await AelluxJs.mount(); });
      await nativeEvent(page);
      await page.locator("#install").focus();
      await page.keyboard.press("Enter");
      await expect.poll(() => page.evaluate(() => notifications.length)).toBe(2);
      expect(await page.evaluate(() => ({ calls: promptCalls, inClick: promptInClick, prevented: promptPrevented,
        installed: $ae.ext.pwa.status().installed, point: !!$ae.ext.point }))).toEqual({ calls: 1, inClick: true, prevented: true, installed: null, point: false });
      // userActivation is supplied by the real browser while the prompt API is controlled.
      expect(await page.evaluate(() => promptActivation)).toBe(true);
      await page.evaluate(async () => {
        await AelluxJs.unmount("install", "pwa");
        await AelluxJs.mount("install", "pwa");
        window.dispatchEvent(new Event("appinstalled"));
        window.dispatchEvent(new Event("appinstalled"));
      });
      expect(await page.evaluate(() => notifications.filter(value => value.name === "PwaInstalled").length)).toBe(1);
      expect(await page.evaluate(() => $ae("install").pwa.status().installed)).toBe(true);
      expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(values => values.length))).toBe(0);
    });
  }
  test(`dynamic declaration loads once; destroy and explicit re-registration work (Legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, { forceLegacy, markup: "<main></main>" });
    expect(await page.evaluate(() => !!AelluxJs.ext.pwa)).toBe(false);
    await page.evaluate(async () => {
      const button = document.createElement("button");
      button.id = "install";
      button.setAttribute("data-ae-pwa", "install");
      button.textContent = "Install";
      document.body.appendChild(button);
      await AelluxJs.mount(button);
      await AelluxJs.mount(button);
    });
    await nativeEvent(page, "dismissed");
    await page.locator("#install").click();
    await expect.poll(() => page.evaluate(() => notifications.map(value => value.name))).toEqual(["PwaInstallRequested", "PwaInstallDismissed"]);
    await page.evaluate(async () => {
      await AelluxJs.destroyExtensions("pwa");
      window.oldNotifications = notifications.length;
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(await page.evaluate(() => notifications.length === oldNotifications)).toBe(true);
    await page.evaluate(async () => {
      AelluxJs.ext("pwa", { loadWhen: "[data-ae-pwa]" });
      await AelluxJs.mount("install", "pwa");
    });
    expect(await page.evaluate(() => !!$ae("install").pwa)).toBe(true);
  });
}

test("Basic explicitly loads programmatic API without markup or worker registration", async ({ page }) => {
  await start(page, { mode: "basic", markup: "<main>App</main>" });
  expect(await page.evaluate(() => !!$ae.ext.pwa)).toBe(false);
  expect(await page.evaluate(async () => !!(await $ae.wait("pwa")))).toBe(true);
  expect(await page.evaluate(() => $ae.ext.pwa.status().installMethod)).toBe("unknown");
  await page.evaluate(() => $ae.ext.pwa.install());
  await expect(page.locator("dialog")).toHaveCount(0);
});

for (const forceLegacy of [false, true]) {
  test(`manual Safari guide is lazy, accessible, localizable and replaceable (Legacy=${forceLegacy})`, async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone) AppleWebKit/605.1 Version/18.0 Mobile/15E148 Safari/604.1" });
    });
    await start(page, { forceLegacy, options: { language: "pt-BR" } });
    expect(await page.evaluate(() => $ae.ext.pwa.status().installMethod)).toBe("manual");
    expect(await page.evaluate(() => !!$ae.ext.dialog)).toBe(false);
    await page.locator("#install").focus();
    await page.locator("#install").click();
    const dialog = page.getByRole("dialog", { name: "Adicionar à Tela de Início" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Fechar" })).toBeFocused();
    await expect(dialog.locator("li")).toHaveCount(3);
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog")).toHaveCount(0);
    await expect(page.locator("#install")).toBeFocused();
    await page.evaluate(() => $ae.ext.pwa.install({ fallback: "none" }));
    await expect(page.locator("dialog")).toHaveCount(0);
    await page.evaluate(() => $ae("install").pwa.install({ fallback: context => {
      window.customContext = context.status.installMethod;
    } }));
    expect(await page.evaluate(() => customContext)).toBe("manual");
    await page.evaluate(() => $ae.ext.pwa.install({ language: "en", texts: { title: "Custom title" }, template: () => {
      const content = document.createElement("p"); content.textContent = "Custom instructions and icons"; return content;
    } }));
    await expect(page.getByRole("dialog", { name: "Custom title" })).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.locator("dialog")).toHaveCount(0);
  });
}

test("standalone is a positive runtime signal; embedded iOS stays unknown", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
    Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone) AppleWebKit/605.1 Mobile/15E148" });
  });
  await start(page);
  expect(await page.evaluate(() => $ae.ext.pwa.status().installed)).toBe(true);
  await page.evaluate(() => { Object.defineProperty(navigator, "standalone", { value: false }); });
  expect(await page.evaluate(() => $ae.ext.pwa.status().installMethod)).toBe("unknown");
});

test("manual guide uses existing Legacy dialog compatibility when native dialog methods are absent", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone) Version/18.0 Safari/605.1" });
    for (const name of ["show", "showModal", "close"]) {
      Object.defineProperty(HTMLDialogElement.prototype, name, { configurable: true, value: undefined });
    }
  });
  await start(page, { options: { language: "en" } });
  expect(await page.evaluate(() => AelluxJs.diagnostics.legacy)).toBe(true);
  await page.locator("#install").click();
  await expect(page.getByRole("dialog", { name: "Add to Home Screen" })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(page.locator(".backdrop")).toHaveCount(0);
});

test("destroy cancels a guide whose lazy Dialog load is pending", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone) Version/18.0 Safari/605.1" });
  });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route("**/aellux.ext.dialog.js", async route => { await gate; await route.continue(); });
  await start(page);
  await page.evaluate(() => { window.guideResult = $ae.ext.pwa.install(); });
  await expect(page.locator('script[data-ae-ext="dialog"]')).toHaveCount(1);
  await page.evaluate(() => $ae.destroyExtensions("pwa"));
  release();
  await page.evaluate(() => guideResult);
  await expect(page.locator("dialog")).toHaveCount(0);
});

test("same-origin local worker serves configured offline fallback and public assets, keeps registration on destroy", async ({ page, context, browserName }) => {
  await page.goto("/tests/browser/fixtures/pwa/app.html");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(async () => {
    $ae.ext("pwa");
    await new Promise(resolve => { $ae.on("Ready", resolve, { once: true }); $ae.init({ mode: "basic" }); });
    window.registered = 0;
    $ae.on("PwaWorkerRegistered", () => registered++);
    await Promise.all([1, 2].map(() => $ae.ext.pwa.register({ script: "./sw.js", scope: "./" })));
    await navigator.serviceWorker.ready;
  });
  expect(await page.evaluate(() => registered)).toBe(1);
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.getRegistration().then(value => value.active?.state))).toBe("activated");
  expect(await page.evaluate(async () => {
    try { await $ae.ext.pwa.register({ script: "https://example.org/sw.js" }); return false; } catch { return true; }
  })).toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  expect(await page.evaluate(() => fetch("./assets/public.txt", { credentials: "omit" }).then(response => response.text()))).toContain("Public PWA asset");
  await page.evaluate(() => fetch("./assets/private.txt", { credentials: "omit" }));
  expect(await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys.find(key => key.startsWith("aellux-pwa:")));
    return !!(await cache.match(new URL("./assets/private.txt", location.href).href));
  })).toBe(false);
  if (browserName === "chromium") await context.setOffline(true);
  else await page.evaluate(() => new Promise(resolve => {
    // Playwright offline mode does not consistently affect worker fetches in
    // Firefox and can block cached responses in WebKit. Fail the fixture's
    // worker network directly while preserving real registration/cache/events.
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    navigator.serviceWorker.controller.postMessage({ type: "FIXTURE_OFFLINE", value: true }, [channel.port2]);
  }));
  expect(await page.evaluate(() => fetch("./assets/public.txt", { credentials: "omit" }).then(response => response.text()))).toContain("Public PWA asset");
  await page.goto("/tests/browser/fixtures/pwa/missing.html");
  await expect(page.getByRole("heading", { name: "PWA offline" })).toBeVisible();
  await context.setOffline(false);
  if (browserName !== "chromium") await page.evaluate(() => new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    navigator.serviceWorker.controller.postMessage({ type: "FIXTURE_OFFLINE", value: false }, [channel.port2]);
  }));
  await page.goto("/tests/browser/fixtures/pwa/app.html");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(async () => {
    $ae.ext("pwa");
    await new Promise(resolve => { $ae.on("Ready", resolve, { once: true }); $ae.init({ mode: "basic" }); });
    await $ae.ext.pwa.register({ script: "./sw.js", scope: "./" });
    await $ae.ext.pwa.checkUpdate();
    window.available = 0;
    window.completed = 0;
    $ae.on("PwaUpdateAvailable", () => available++);
    $ae.on("PwaUpdateComplete", () => completed++);
    await $ae.ext.pwa.register({ script: "./sw-v2.js", scope: "./" });
  });
  await expect.poll(() => page.evaluate(() => available)).toBe(1);
  expect(await page.evaluate(() => completed)).toBe(0);
  expect(await page.evaluate(() => $ae.ext.pwa.applyUpdate())).toBe(true);
  await expect.poll(() => page.evaluate(() => completed)).toBe(1);
  await page.evaluate(async () => {
    await $ae.destroyExtensions("pwa");
  });
  expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(values => values.length))).toBe(1);
});
