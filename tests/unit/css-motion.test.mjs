import { test } from "node:test";
import assert from "node:assert/strict";
import { createCssMotionController } from "../../src/internal/create-css-motion-controller.js";

async function propertyPolicy(properties, options = {}, transition = true, requestedFPS) {
  class Animation {
    pause() {}
    finish() {}
    cancel() {}
    get currentTime() { return 0; }
    set currentTime(value) {}
  }
  class CSSTransition extends Animation {}
  let applied = false;
  const limits = [], stageLimits = [], warnings = [];
  const animations = properties.map(property => Object.assign(
    transition ? new CSSTransition() : new Animation(), {
      transitionProperty: property,
      effect: {
        getComputedTiming: () => ({ endTime: 0 }),
        getKeyframes: () => [{ [property]: 0 }, { [property]: 1 }]
      }
    }));
  const api = { options, currentPreference: () => "no-preference", layoutMaxFPS: () => requestedFPS,
    diagnostics: { WARN_CSS_MOTION_PROPERTY_MAX_FPS_INVALID: {}, warn: (_definition, context) => warnings.push(context) },
    waitLayout: { cancel() {}, setVisualFPSLimit: (_id, value) => limits.push(value),
      sequence(id, stage) {
        if (stage.read) stage.update(stage.read());
        else { stageLimits.push(stage.maxFPS); stage.update(); }
        return Promise.resolve({ status: "completed" });
      } }
  };
  const motion = createCssMotionController({ Animation, CSSTransition }, () => api);
  const element = { nodeType: 1, isConnected: true, getBoundingClientRect() {},
    getAnimations: () => applied ? animations : [] };
  await motion.run(element, { id: motion.id(), apply() { applied = true; } });
  return { limit: limits[0], stageLimit: stageLimits[0], warnings };
}

for (const transition of [true, false]) {
  test(`Present progress shares transform/opacity policy (CSS transition=${transition})`, async () => {
    const result = await propertyPolicy([
      "transform", "opacity", "--ae-pop-progress", "--ae-unpop-progress",
      "--ae-present-pop-phase", "--ae-present-unpop-phase"
    ], { cssMotionPropertyMaxFPS: 5 }, transition);
    assert.equal(result.limit, undefined);
    assert.equal(result.stageLimit, undefined);
  });
}

test("layout and arbitrary custom properties default to a single 55 FPS ceiling", async () => {
  for (const property of ["height", "--widget-width"]) {
    const result = await propertyPolicy(["opacity", property]);
    assert.equal(result.limit, 55);
    assert.equal(result.stageLimit, undefined);
  }
  assert.equal((await propertyPolicy(["height"], {}, true, 30)).limit, 30);
  assert.equal((await propertyPolicy(["height"], { cssMotionPropertyMaxFPS: 0 })).limit, undefined);
  const invalid = await propertyPolicy(["height"], { cssMotionPropertyMaxFPS: "invalid" });
  assert.equal(invalid.limit, 55);
  assert.equal(invalid.warnings[0].fallback, 55);
});

test("cancelling native CSS motion settles even when Animation.finished stays pending", async () => {
  const api = { options: { cssMotionController: false }, currentPreference: () => "no-preference",
    waitLayout: { cancel() {}, setVisualFPSLimit() {} } };
  const motion = createCssMotionController({ setTimeout, clearTimeout }, () => api);
  const element = { nodeType: 1, getAnimations: () => [{ finished: new Promise(() => {}) }] };
  const id = motion.id();
  const pending = motion.run(element, { id, apply() {} });
  assert.equal(motion.cancel(id), true);
  let timeout;
  try {
    const result = await Promise.race([pending, new Promise(resolve => {
      timeout = setTimeout(() => resolve("pending"), 100);
    })]);
    assert.deepEqual(result, { id, status: "aborted", mode: "native" });
  } finally { clearTimeout(timeout); }
});

test("a partial WAAPI capture failure resumes every effect already paused", async () => {
  let applied = false, paused = false;
  const effect = { getComputedTiming: () => ({ endTime: 200 }), getKeyframes: () => [{ opacity: 0 }, { opacity: 1 }] };
  const first = { effect, pause() { paused = true; }, play() { paused = false; } };
  const second = { effect, pause() { throw new Error("pause rejected"); }, play() {} };
  const api = { options: {}, currentPreference: () => "no-preference", layoutMaxFPS: () => 60,
    waitLayout: { cancel() {}, setVisualFPSLimit() {},
      sequence(id, options) { return Promise.resolve().then(() => {
        options.update(options.read());
        return { status: "completed" };
      }); } } };
  class Animation { pause() {} get currentTime() { return 0; } }
  const motion = createCssMotionController({ Animation }, () => api);
  const element = { nodeType: 1, isConnected: true, getBoundingClientRect() {},
    getAnimations: () => applied ? [first, second] : [] };
  await assert.rejects(motion.run(element, { id: motion.id(), apply() { applied = true; } }), /pause rejected/);
  assert.equal(paused, false);
});
