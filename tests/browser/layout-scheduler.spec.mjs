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
