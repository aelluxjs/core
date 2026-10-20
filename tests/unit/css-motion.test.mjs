import { test } from "node:test";
import assert from "node:assert/strict";
import { createCssMotionController } from "../../src/internal/create-css-motion-controller.js";

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
