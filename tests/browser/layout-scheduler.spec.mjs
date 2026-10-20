import { expect, test } from "@playwright/test";

test("runtime exposes identified layout work and ordered sequences", async ({ page }) => {
  await page.goto("/tests/browser/runtime-modern.html");
  await expect.poll(() => page.evaluate(() => typeof AelluxJs.waitLayout?.sequence))
    .toBe("function");

  const result = await page.evaluate(async () => {
    const scheduler = AelluxJs.waitLayout;
    const events = [];
    const oldRead = scheduler.read(900, () => events.push("old read"));
    const oldUpdate = scheduler.update(900, () => events.push("old update"));
    const current = scheduler.read(900, () => events.push("current"));
    const sequence = scheduler.sequence(901,
      {
        read: () => { events.push("measure"); return 5; },
        update: value => events.push("render " + value)
      },
      {
        update: () => events.push("repeat"),
        repeat: { times: 2 },
        maxFPS: 60
      }
    );
    const canceled = scheduler.read(902, () => events.push("canceled"));
    const didCancel = scheduler.cancel(902);
    return {
      oldReadCanceled: (await oldRead) === undefined,
      oldUpdateCanceled: (await oldUpdate) === undefined,
      canceled: (await canceled) === undefined,
      didCancel,
      current: await current,
      sequence: await sequence,
      events
    };
  });

  expect(result).toEqual({
    oldReadCanceled: true,
    oldUpdateCanceled: true,
    canceled: true,
    didCancel: true,
    current: 1,
    sequence: { id: 901, status: "completed" },
    events: ["current", "measure", "render 5", "repeat", "repeat"]
  });
});

test("runtime accepts AbortController and AbortSignal in sequence abort", async ({ page }) => {
  await page.goto("/tests/browser/runtime-modern.html");
  await expect.poll(() => page.evaluate(() => typeof AelluxJs.waitLayout?.sequence))
    .toBe("function");

  const result = await page.evaluate(async () => {
    const scheduler = AelluxJs.waitLayout;
    const calls = [];
    const preAborted = new AbortController();
    preAborted.abort();
    const first = scheduler.sequence(910, {
      read: () => calls.push("first"),
      abort: preAborted.signal
    });
    const controller = new AbortController();
    const second = scheduler.sequence(911, {
      update: () => calls.push("second"),
      abort: controller
    });
    controller.abort();
    return { first: await first, second: await second, calls };
  });

  expect(result).toEqual({
    first: { id: 910, status: "aborted" },
    second: { id: 911, status: "aborted" },
    calls: []
  });
});

test("legacy runtime executes identified layout sequences", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic", forceLegacy: true }));
  await expect.poll(() => page.evaluate(() => typeof AelluxJs.waitLayout?.sequence))
    .toBe("function");

  const result = await page.evaluate(async () => {
    const values = [];
    const outcome = await AelluxJs.waitLayout.sequence(920, {
      read: () => 7,
      update: value => values.push(value)
    });
    return { outcome, values, legacy: AelluxJs.diagnostics.legacy };
  });
  expect(result).toEqual({
    outcome: { id: 920, status: "completed" },
    values: [7],
    legacy: true
  });
});

test("active CSS Motion FPS limit preserves anonymous work from separate extensions", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Controlled CSS Motion is verified in Chromium.");
  await page.goto("/tests/index.htm");
  await page.addStyleTag({ content: `
    #motion { opacity: 0; transition: opacity 900ms linear; }
    #motion.active { opacity: 1; }
  ` });
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="motion" data-ae-maxfps="5"></div>';
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic", skipGlobalMount: true }));
  await expect.poll(() => page.evaluate(() => typeof AelluxJs.motion?.run)).toBe("function");
  await page.evaluate(() => {
    const element = document.getElementById("motion");
    getComputedStyle(element).opacity;
    window.motionResult = AelluxJs.motion.run(element, {
      id: AelluxJs.motion.id(),
      apply: () => element.classList.add("active")
    });
  });
  await expect.poll(() => page.locator("#motion").evaluate(element =>
    element.getAnimations()[0]?.playState)).toBe("paused");

  const result = await page.evaluate(async () => {
    const scheduler = AelluxJs.waitLayout;
    const events = [];
    const work = [
      scheduler.read(() => { events.push("anchor read"); return 1; }),
      scheduler.read(() => { events.push("scrollbox read"); return 2; }),
      scheduler.update(() => { events.push("anchor update"); return 3; }),
      scheduler.update(() => { events.push("scrollbox update"); return 4; }),
      scheduler.read(3001, () => { events.push("id 3001"); return 5; }),
      scheduler.read(3002, () => { events.push("id 3002"); return 6; })
    ];
    return { values: await Promise.all(work), events, motion: await window.motionResult };
  });
  expect(result.motion).toMatchObject({ status: "completed", mode: "controlled" });
  expect(result.values).toEqual([1, 2, 3, 4, 5, 6]);
  expect(result.events).toEqual(["anchor read", "scrollbox read", "id 3001", "id 3002",
    "anchor update", "scrollbox update"]);
});
