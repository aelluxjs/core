import { expect, test } from "@playwright/test";

async function start(page, options = {}) {
  await page.goto("/tests/index.htm");
  await page.addStyleTag({ content: `
    #motion-box { opacity: 0; transition: opacity 240ms ease-out; }
    #motion-box.active { opacity: 1; }
    @keyframes motion-test { from { transform: translateX(0); } to { transform: translateX(20px); } }
    #motion-box.animated { animation: motion-test 240ms ease-in-out both; }
  ` });
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="motion-box" data-ae-maxfps="30"></div>';
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => AelluxJs.init({ mode: "basic", skipGlobalMount: true, ...options }), options);
  await expect.poll(() => page.evaluate(() => typeof AelluxJs.motion?.run)).toBe("function");
}

test("CSS motion is controlled or safely falls back per browser operation", async ({ page, browserName }) => {
  await start(page);
  await page.evaluate(() => {
    const element = document.getElementById("motion-box");
    getComputedStyle(element).opacity;
    window.motionResult = AelluxJs.motion.run(element, {
      id: AelluxJs.motion.id(),
      apply: () => element.classList.add("active")
    });
  });
  if (browserName === "chromium") {
    await expect.poll(() => page.locator("#motion-box").evaluate(element =>
      element.getAnimations()[0]?.playState)).toBe("paused");
  }
  const result = await page.evaluate(() => window.motionResult);
  expect(result.status).toBe("completed");
  expect(["controlled", "native"]).toContain(result.mode);
  await expect(page.locator("#motion-box")).toHaveCSS("opacity", "1");
});

test("cssMotionController false leaves CSS motion native", async ({ page }) => {
  await start(page, { cssMotionController: false });
  const result = await page.evaluate(async () => {
    const element = document.getElementById("motion-box");
    getComputedStyle(element).opacity;
    const promise = AelluxJs.motion.run(element, {
      id: AelluxJs.motion.id(),
      apply: () => element.classList.add("active")
    });
    await new Promise(resolve => setTimeout(resolve, 30));
    const playState = element.getAnimations()[0]?.playState;
    return { playState, result: await promise };
  });
  expect(result.playState).toBe("running");
  expect(result.result).toMatchObject({ status: "completed", mode: "native" });
});

test("advanced Aellux easing is represented as native linear samples", async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const element = document.getElementById("motion-box");
    window.motionResult = AelluxJs.motion.run(element, {
      id: AelluxJs.motion.id(),
      easing: "elasticOut",
      apply: () => element.classList.add("animated")
    });
  });
  await expect.poll(() => page.locator("#motion-box").evaluate(element =>
    element.getAnimations()[0]?.effect.getTiming().easing || "")).toMatch(/^linear\(/);
  await page.evaluate(() => window.motionResult);
});
