import { expect, test } from "@playwright/test";

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
      const first = AelluxJs.dep("better-scroll@1.0", url);
      const second = AelluxJs.dep("better-scroll@1.0", url);
      const immediate = document.querySelectorAll('script[data-ae-dep="better-scroll@1.0"]').length;
      const pending = AelluxJs.registry.dep["better-scroll@1.0"].state;
      const readyBeforeLoad = window.sharedDependencyReady === true;

      for (const name of ["first-dep", "second-dep"]) {
        AelluxJs.ext(name);
        AelluxJs.extAttach(name, {
          async init() {
            await AelluxJs.dep("better-scroll@1.0", url);
            if (!window.sharedDependencyReady) throw new Error("Dependency is not ready");
          }
        });
      }
      const [script, firstExtension, secondExtension] = await Promise.all([
        first, AelluxJs.wait("first-dep"), AelluxJs.wait("second-dep")
      ]);
      const afterLoad = AelluxJs.dep("better-scroll@1.0", url);
      return {
        sharedPromise: first === second && first === afterLoad,
        immediate,
        pending,
        readyBeforeLoad,
        loaded: AelluxJs.registry.dep["better-scroll@1.0"].state,
        scriptMatches: script === AelluxJs.registry.dep["better-scroll@1.0"].script,
        extensionsReady: firstExtension.initialized && secondExtension.initialized,
        scriptCount: document.querySelectorAll('script[data-ae-dep="better-scroll@1.0"]').length
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
