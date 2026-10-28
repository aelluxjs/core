import { test } from "node:test";
import assert from "node:assert/strict";
import { createCssMotionController } from "../../src/internal/create-css-motion-controller.js";
import { diagnoseMotionResources } from "../../src/internal/diagnose-resources.js";

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

test("development motion diagnostics ignore existing effects without changing native completion", async () => {
  let finishExisting, applied = false, settled = false;
  const existing = { finished: new Promise(resolve => { finishExisting = resolve; }),
    effect: { getKeyframes() { assert.fail("An existing animation must not be diagnosed as a new effect"); } } };
  const element = { nodeType: 1, getAnimations: () => applied ? [existing, added] : [existing] };
  const added = { finished: Promise.resolve(), effect: { target: element, getKeyframes: () => [{ opacity: 0 }, { opacity: 1 }] } };
  const api = { options: { cssMotionController: false, environment: "development" },
    currentPreference: () => "no-preference", waitLayout: { cancel() {}, setVisualFPSLimit() {} } };
  const motion = createCssMotionController({ setTimeout, clearTimeout }, () => api);
  const pending = motion.run(element, { id: motion.id(), apply() { applied = true; } });
  pending.then(() => { settled = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, false);
  finishExisting();
  assert.equal((await pending).status, "completed");
});

test("per-keyframe replacement overrides additive effect composition for resource diagnostics", () => {
  const warnings = [];
  const element = { classList: { contains: name => name === "ae--anchored" }, getAttribute: () => null,
    hasAttribute: () => false, parentElement: null };
  const api = { options: { environment: "development" }, ext: { anchor: { initialized: true } },
    className: name => `ae--${name}`, attr: name => `data-ae-${name}`,
    diagnostics: { warn: (_definition, context) => warnings.push(context) } };
  const effect = composite => ({ target: element, composite: "add",
    getKeyframes: () => [{ transform: "translateX(2px)", composite }] });
  diagnoseMotionResources(api, element, [{ effect: effect("auto") }], "feedback");
  assert.equal(warnings.length, 0);
  diagnoseMotionResources(api, element, [{ effect: effect("replace") }], "feedback");
  assert.deepEqual(warnings.map(context => context.writers), [["anchor", "feedback"]]);
});

for (const subtree of [false, true]) test(`subtree capture shares one clock and preserves preexisting child effects (${subtree})`, async () => {
  let applied = false, time = 0;
  const effects = [];
  const effect = () => {
    const animation = { currentTime: -1, effect: { getComputedTiming: () => ({ endTime: 100 }),
      getKeyframes: () => [{ opacity: 0 }, { opacity: 1 }] }, pause() {}, finish() {}, cancel() {} };
    effects.push(animation);
    return animation;
  };
  const parentEffect = effect(), childEffect = effect(), existing = effect();
  const child = { getAnimations: () => applied ? [existing, childEffect] : [existing] };
  const parent = { nodeType: 1, isConnected: true, getBoundingClientRect() {},
    getAnimations: () => applied ? [parentEffect] : [], querySelectorAll: () => [child] };
  let sequences = 0;
  const api = { options: {}, currentPreference: () => "no-preference", layoutMaxFPS: () => 30,
    waitLayout: { cancel() {}, setVisualFPSLimit() {}, sequence(id, stage) {
      sequences++;
      if (stage.read) stage.update(stage.read());
      else { time = 50; stage.update(); }
      return Promise.resolve({ status: "completed" });
    } } };
  class Animation { pause() {} get currentTime() { return 0; } }
  const motion = createCssMotionController({ Animation, performance: { now: () => time } }, () => api);
  await motion.run(parent, { id: motion.id(), subtree, apply() { applied = true; } });
  assert.equal(parentEffect.currentTime, 50);
  assert.equal(childEffect.currentTime, subtree ? 50 : -1);
  assert.equal(existing.currentTime, -1);
  assert.equal(sequences, 2);
});

test("native subtree completion excludes an existing infinite descendant animation", async () => {
  let applied = false;
  const existing = { finished: new Promise(() => {}) };
  const child = { getAnimations: () => [existing] };
  const added = { finished: Promise.resolve() };
  const element = { nodeType: 1, querySelectorAll: () => [child], getAnimations: () => applied ? [added] : [] };
  const api = { options: { cssMotionController: false }, currentPreference: () => "no-preference",
    waitLayout: { cancel() {}, setVisualFPSLimit() {} } };
  const motion = createCssMotionController({ setTimeout, clearTimeout }, () => api);
  let timer;
  try {
    const result = await Promise.race([
      motion.run(element, { id: motion.id(), subtree: true, apply() { applied = true; } }),
      new Promise(resolve => { timer = setTimeout(() => resolve("stalled"), 100); })
    ]);
    assert.equal(result.status, "completed");
  } finally { clearTimeout(timer); }
});
