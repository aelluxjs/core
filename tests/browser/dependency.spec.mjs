import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";

for (const forceLegacy of [false, true]) {
  test(`dep loads and shares a stylesheet before init (${forceLegacy ? "legacy" : "modern"})`, async ({ page }) => {
    const css = "body { --dependency-ready: loaded; }";
    const integrity = "sha384-" + createHash("sha384").update(css).digest("base64");
    let requests = 0;
    await page.route("**/dependency.CSS?version=1", async route => {
      requests++;
      await new Promise(resolve => setTimeout(resolve, 80));
      await route.fulfill({ contentType: "text/css", body: css });
    });
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });
    const result = await page.evaluate(async ({ integrity, forceLegacy }) => {
      const url = "./dependency.CSS?version=1#theme";
      const first = AelluxJs.dep("theme", url, integrity, "anonymous");
      const pending = AelluxJs.registry.dep.theme.state;
      AelluxJs.init({ mode: "basic", forceLegacy });
      const second = AelluxJs.dep("theme", url);
      const link = await first;
      return {
        shared: first === second && first === AelluxJs.dep("theme", url),
        pending,
        loaded: AelluxJs.registry.dep.theme.state,
        tag: link.tagName,
        rel: link.rel,
        url: link.href.slice(location.origin.length),
        security: [link.integrity, link.crossOrigin],
        count: document.querySelectorAll('[data-ae-dep="theme"]').length,
        applied: getComputedStyle(document.body).getPropertyValue("--dependency-ready").trim(),
        handlersCleared: link.onload === null && link.onerror === null
      };
    }, { integrity, forceLegacy });
    expect(requests).toBe(1);
    expect(result).toEqual({
      shared: true, pending: "loading", loaded: "loaded", tag: "LINK", rel: "stylesheet",
      url: "/dist/dependency.CSS?version=1#theme", security: [integrity, "anonymous"],
      count: 1, applied: "loaded", handlersCleared: true
    });
  });
}

test("dep rejects a failed stylesheet, removes it and allows retry", async ({ page }) => {
  let requests = 0;
  await page.route("**/retry-dependency.css", route => {
    requests++;
    if (requests === 1) return route.abort("failed");
    return route.fulfill({ contentType: "text/css", body: "body { --retry-ready: loaded; }" });
  });
  await startRuntime(page);
  const result = await page.evaluate(async () => {
    const url = "/virtual/retry-dependency.css";
    const first = AelluxJs.dep("theme-retry", url);
    const second = AelluxJs.dep("theme-retry", url);
    const conflict = await AelluxJs.dep("theme-retry", "/virtual/other.js").catch(error => error.code);
    const failed = await first.catch(error => error.code);
    const cleaned = !Object.hasOwn(AelluxJs.registry.dep, "theme-retry") &&
      !document.querySelector('[data-ae-dep="theme-retry"]');
    const link = await AelluxJs.dep("theme-retry", url, { crossOrigin: "anonymous" });
    return {
      shared: first === second, conflict, failed, cleaned,
      tag: link.tagName, crossOrigin: link.crossOrigin,
      applied: getComputedStyle(document.body).getPropertyValue("--retry-ready").trim()
    };
  });
  expect(requests).toBe(2);
  expect(result).toEqual({
    shared: true, conflict: 1117, failed: 1118, cleaned: true,
    tag: "LINK", crossOrigin: "anonymous", applied: "loaded"
  });
});

async function startRuntime(page, forceLegacy = false) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(forceLegacy => AelluxJs.init({ mode: "basic", forceLegacy }), forceLegacy);
  await expect.poll(() => page.evaluate(() => AelluxJs.mountManager !== null)).toBe(true);
}

test("dep loads immediately before init and retains the registration afterward", async ({ page }) => {
  let requests = 0;
  await page.route("**/early-dependency.js", route => {
    requests++;
    return route.fulfill({
      contentType: "text/javascript",
      body: "window.earlyDependencyReady = true;"
    });
  });
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });

  const result = await page.evaluate(async () => {
    const first = AelluxJs.dep("early@1.0", "/virtual/early-dependency.js");
    const insertedBeforeInit = document.querySelectorAll('script[data-ae-dep="early@1.0"]').length;
    AelluxJs.init({ mode: "basic" });
    const second = AelluxJs.dep("early@1.0", "/virtual/early-dependency.js");
    await first;
    return {
      insertedBeforeInit,
      sharedPromise: first === second,
      ready: window.earlyDependencyReady === true,
      state: AelluxJs.registry.dep["early@1.0"].state
    };
  });

  expect(requests).toBe(1);
  expect(result).toEqual({
    insertedBeforeInit: 1,
    sharedPromise: true,
    ready: true,
    state: "loaded"
  });
});

test("dep accepts positional SRI and crossorigin and keeps the options-object overload", async ({ page }) => {
  const source = "window.secureDependencyReady = true;";
  const integrity = "sha384-" + createHash("sha384").update(source).digest("base64");
  let requests = 0;
  await page.route("**/secure-dependency-*.js", route => {
    requests++;
    return route.fulfill({
      contentType: "text/javascript",
      headers: { "access-control-allow-origin": "*" },
      body: source
    });
  });
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });

  const result = await page.evaluate(async integrity => {
    const url = "/virtual/secure-dependency-positional.js";
    const first = AelluxJs.dep("secure-positional", url, integrity, "anonymous");
    const second = AelluxJs.dep("secure-positional", url);
    const script = await first;
    const objectScript = await AelluxJs.dep("secure-object",
      "/virtual/secure-dependency-object.js", { integrity, crossOrigin: "anonymous" });
    const invalid = await AelluxJs.dep("secure-invalid", url, 42, "anonymous")
      .catch(error => error.code);
    return {
      shared: first === second,
      ready: window.secureDependencyReady,
      positional: [script.integrity, script.crossOrigin],
      object: [objectScript.integrity, objectScript.crossOrigin],
      invalid
    };
  }, integrity);

  expect(requests).toBe(2);
  expect(result).toEqual({
    shared: true, ready: true,
    positional: [integrity, "anonymous"],
    object: [integrity, "anonymous"],
    invalid: 1116
  });
});

for (const forceLegacy of [false, true]) {
  test(`dep shares a pending script across Extensions and waits for load (${forceLegacy ? "legacy" : "modern"})`, async ({ page }) => {
    let requests = 0;
    await page.route("**/shared-dependency.js", async route => {
      requests++;
      await new Promise(resolve => setTimeout(resolve, 80));
      await route.fulfill({
        contentType: "text/javascript",
        body: "window.sharedDependencyReady = true;"
      });
    });
    await startRuntime(page, forceLegacy);

    const result = await page.evaluate(async () => {
      const url = "/virtual/shared-dependency.js";
      const first = AelluxJs.dep("shared-widget@1.0", url);
      const second = AelluxJs.dep("shared-widget@1.0", url);
      const immediate = document.querySelectorAll('script[data-ae-dep="shared-widget@1.0"]').length;
      const pending = AelluxJs.registry.dep["shared-widget@1.0"].state;
      const readyBeforeLoad = window.sharedDependencyReady === true;

      for (const name of ["first-dep", "second-dep"]) {
        AelluxJs.ext(name);
        AelluxJs.extAttach(name, {
          async init() {
            await AelluxJs.dep("shared-widget@1.0", url);
            if (!window.sharedDependencyReady) throw new Error("Dependency is not ready");
          }
        });
      }
      const [script, firstExtension, secondExtension] = await Promise.all([
        first, AelluxJs.wait("first-dep"), AelluxJs.wait("second-dep")
      ]);
      const afterLoad = AelluxJs.dep("shared-widget@1.0", url);
      return {
        sharedPromise: first === second && first === afterLoad,
        immediate,
        pending,
        readyBeforeLoad,
        loaded: AelluxJs.registry.dep["shared-widget@1.0"].state,
        scriptMatches: script === AelluxJs.registry.dep["shared-widget@1.0"].script,
        extensionsReady: firstExtension.initialized && secondExtension.initialized,
        scriptCount: document.querySelectorAll('script[data-ae-dep="shared-widget@1.0"]').length
      };
    });

    expect(requests).toBe(1);
    expect(result).toEqual({
      sharedPromise: true,
      immediate: 1,
      pending: "loading",
      readyBeforeLoad: false,
      loaded: "loaded",
      scriptMatches: true,
      extensionsReady: true,
      scriptCount: 1
    });
  });
}

test("dep rejects conflicting URLs and retries a failed load", async ({ page }) => {
  let requests = 0;
  await page.route("**/retry-dependency.js", async route => {
    requests++;
    if (requests === 1) return route.abort("failed");
    return route.fulfill({ contentType: "text/javascript", body: "window.retryDependencyReady = true;" });
  });
  await startRuntime(page);

  const result = await page.evaluate(async () => {
    const label = "retry@1.0";
    const url = "/virtual/retry-dependency.js";
    const first = AelluxJs.dep(label, url);
    const concurrent = AelluxJs.dep(label, url);
    const conflict = await AelluxJs.dep(label, "/virtual/other.js").catch(error => error.code);
    const failed = await first.catch(error => error.code);
    const registeredAfterFailure = Object.hasOwn(AelluxJs.registry.dep, label);
    const scriptAfterFailure = document.querySelectorAll('script[data-ae-dep="retry@1.0"]').length;
    const retried = await AelluxJs.dep(label, url);
    const invalid = await AelluxJs.dep("", url).catch(error => error.code);
    return {
      sharedFailure: first === concurrent,
      conflict,
      failed,
      registeredAfterFailure,
      scriptAfterFailure,
      retryReady: window.retryDependencyReady === true && retried === AelluxJs.registry.dep[label].script,
      invalid
    };
  });

  expect(requests).toBe(2);
  expect(result).toEqual({
    sharedFailure: true,
    conflict: 1117,
    failed: 1118,
    registeredAfterFailure: false,
    scriptAfterFailure: 0,
    retryReady: true,
    invalid: 1116
  });
});
