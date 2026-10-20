import { expect, test } from "@playwright/test";

async function start(page, options = {}) {
  await page.goto("/tests/index.htm");
  await page.addStyleTag({ content: `
    #motion-box { opacity: 0; transition: opacity 240ms ease-out; }
    #motion-box.active { opacity: 1; }
    #motion-box.combined { opacity: 1; height: 80px; }
    @keyframes motion-test { from { transform: translateX(0); } to { transform: translateX(20px); } }
    #motion-box.animated { animation: motion-test 240ms ease-in-out both; }
  ` });
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="motion-box" data-ae-maxfps="30" style="height:20px;transition-property:opacity,height"></div>';
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

test("rapid replacements cannot schedule an obsolete capture over the current operation", async ({ page }) => {
  await start(page);
  const results = await page.evaluate(async () => {
    const element = document.getElementById("motion-box");
    const id = AelluxJs.motion.id();
    getComputedStyle(element).opacity;
    const run = visible => AelluxJs.motion.run(element, {
      id, apply: () => element.classList.toggle("active", visible), nativeDuration: 240
    });
    return Promise.all([run(true), run(false), run(true)]);
  });
  expect(results.slice(0, 2).map(result => result.status)).toEqual(["aborted", "aborted"]);
  expect(results[2].status).toBe("completed");
  await expect(page.locator("#motion-box")).toHaveCSS("opacity", "1");
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

test("a mixed-property operation uses one timeline at the conservative FPS", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Exact WAAPI sampling is asserted in Chromium.");
  await start(page, { cssMotionPropertyMaxFPS: 5 });
  const observation = await page.evaluate(async () => {
    const element = document.getElementById("motion-box");
    getComputedStyle(element).height;
    const samples = [];
    let running = true;
    function sample() {
      const animations = element.getAnimations();
      if (animations.length === 2) {
        samples.push(animations.map(animation => Number(animation.currentTime)));
      }
      if (running) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
    const result = await AelluxJs.motion.run(element, {
      id: AelluxJs.motion.id(),
      apply: () => element.classList.add("combined")
    });
    running = false;
    const distinct = new Set(samples.map(times => times.join("/")));
    return {
      result,
      distinct: distinct.size,
      synchronized: samples.every(times => Math.abs(times[0] - times[1]) < 0.01)
    };
  });
  expect(observation.result).toMatchObject({ status: "completed", mode: "controlled" });
  expect(observation.synchronized).toBe(true);
  expect(observation.distinct).toBeLessThanOrEqual(3);
});
