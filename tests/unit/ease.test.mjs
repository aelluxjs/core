import { test } from "node:test";
import assert from "node:assert/strict";
import { cubicBezier, ease } from "../../src/internal/ease.js";

function near(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be close to ${expected}`);
}

test("Core exposes conventional easing families and endpoint values", () => {
  for (const family of [
    "quad", "cubic", "quart", "quint", "sine", "expo",
    "circ", "back", "elastic", "bounce"
  ]) {
    for (const direction of ["In", "Out", "InOut"]) {
      near(ease(family + direction, 0), 0);
      near(ease(family + direction, 1), 1);
    }
  }
  near(ease("linear", 0.35), 0.35);
  near(ease("smoothStep", 0.5), 0.5);
  near(ease("smootherStep", 0.5), 0.5);
});

test("Core resolves prefixed, kebab-case, and direction-first names", () => {
  const reference = ease("backOut", 0.5);
  for (const name of [
    "easeBackOut", "back-out", "ease-back-out",
    "outBack", "easeOutBack", "ease_out_back"
  ]) near(ease(name, 0.5), reference);
  near(ease("quadratic-in", 0.5), ease("quadIn", 0.5));
  near(ease("ease-sinusoidal-in-out", 0.3), ease("sineInOut", 0.3));
  near(ease("exponential-out", 0.3), ease("expoOut", 0.3));
  near(ease("circular-in", 0.3), ease("circIn", 0.3));
});

test("Core clamps progress and preserves curve overshoot", () => {
  near(ease("quadIn", 0.5), 0.25);
  near(ease("cubicOut", 0.5), 0.875);
  near(ease("backInOut", 0.25), -0.09968184375);
  assert.ok(ease("backOut", 0.5) > 1);
  assert.ok(ease("backIn", 0.5) < 0);
  assert.ok(ease("elasticOut", 0.2) > 1);
  near(ease("linear", 1.2), 1);
  near(ease("linear", -0.2), 0);
  near(ease("backOut", 1.2), 1);
  near(ease("backIn", -0.2), 0);
  assert.throws(() => ease("unknownOut", 0.5), RangeError);
  assert.throws(() => ease("backOut", NaN), TypeError);
});

test("CSS cubic bezier resolves X before evaluating Y", () => {
  near(ease("cubic-bezier(0.25, 0.1, 0.25, 1)", 0.5), 0.802403387584857, 1e-10);
  near(cubicBezier(0.5, 0.42, 0, 1, 1), 0.3153568125725393);
  near(ease("  CUBIC-BEZIER(.42, +0, 1e0, 1)  ", 0.5), 0.3153568125725393);
  near(ease("cubic-bezier(0, 0, 1, 1)", 0.27), 0.27);
  assert.ok(ease("cubic-bezier(.3, -1, .7, 2)", 0.1) < 0);
  assert.ok(ease("cubic-bezier(.3, -1, .7, 2)", 0.9) > 1);
});

test("Cubic bezier handles flat derivatives, endpoints and clamped input", () => {
  // With X(u) = u^3 and Y(u) = u, the answer is the cube root of t.
  for (const t of [1e-9, 0.001, 0.5, 0.999]) {
    near(cubicBezier(t, 0, 1 / 3, 0, 2 / 3), Math.cbrt(t));
    near(cubicBezier(1 - t, 1, 1 / 3, 1, 2 / 3), 1 - Math.cbrt(t), 1e-8);
  }
  near(cubicBezier(0.5, 1, 0, 0, 1), 0.5);
  near(ease("cubic-bezier(.25, -2, .75, 3)", -1), 0);
  near(ease("cubic-bezier(.25, -2, .75, 3)", 2), 1);
});

test("CSS cubic bezier rejects malformed numbers and invalid control points", () => {
  for (const name of [
    "cubic-bezier(0, 0, 1)", "cubic-bezier(0, 0, 1, 1, 1)",
    "cubic-bezier(0, , 1, 1)", "cubic-bezier(0, 0px, 1, 1)",
    "cubic-bezier(0, 0, 1., 1)", "cubic-bezier(0, 0, 0x1, 1)",
    "cubic-bezier(0, 0, 1, 1) junk", "cubic-bezier(0, 0, 1, --1)",
    "cubic-bezier(-.1, 0, 1, 1)", "cubic-bezier(0, 0, 1.1, 1)"
  ]) assert.throws(() => ease(name, 0.5), RangeError, name);
  assert.throws(() => ease("cubic-bezier(0, 1e999, 1, 1)", 0.5), TypeError);
  assert.throws(() => cubicBezier(0.5, 0, NaN, 1, 1), TypeError);
  assert.throws(() => cubicBezier("0.5", 0, 0, 1, 1), TypeError);
  assert.throws(() => cubicBezier(0.5, 0, 0, -1, 1), RangeError);
});
