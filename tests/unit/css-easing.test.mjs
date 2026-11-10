import assert from "node:assert/strict";
import test from "node:test";
import { createCssEasing } from "../../src/internal/create-css-easing.js";
import { ease } from "../../src/internal/ease.js";

const curve = value => createCssEasing(value, { ease });
test("CSS easing preserves keywords, cubic timing and overshoot without Web Animations", () => {
  assert.equal(curve("linear")(.37), .37);
  assert.equal(curve("ease")(.5), ease("cubic-bezier(.25,.1,.25,1)", .5));
  assert.equal(curve("ease-in-out")(.5), .5);
  assert.ok(curve("cubic-bezier(.2,1.5,.8,1.5)")(.5) > 1);
  assert.equal(curve("cubic-bezier(.2,0,.8,1)")(0), 0);
  assert.equal(curve("cubic-bezier(.2,0,.8,1)")(1), 1);
  assert.equal(curve("cubic-bezier(0.,0.,1.,1.)")(.5), .5);
  assert.equal(curve("invalid")(.5), curve("ease")(.5));
});

test("CSS steps use the specified boundary, jump count and endpoint semantics", () => {
  assert.deepEqual([0, .249, .25, .999, 1].map(curve("steps(4,end)")), [0, 0, .25, .75, 1]);
  assert.deepEqual([0, .25, .999, 1].map(curve("steps(4,jump-start)")), [.25, .5, 1, 1]);
  assert.deepEqual([0, .25, .75, 1].map(curve("steps(4,jump-none)")), [0, 1 / 3, 1, 1]);
  assert.deepEqual([0, .25, .999, 1].map(curve("steps(4,jump-both)")), [.2, .4, .8, 1]);
  assert.equal(curve("step-start")(0), 1);
  assert.equal(curve("step-end")(.999), 0);
  assert.equal(curve("steps(1,jump-none)")(.5), curve("ease")(.5));
});

test("CSS linear stops retain plateaus, omitted positions, backwards stops and discontinuities", () => {
  const plateau = curve("linear(0, .5 25% 75%, 1)");
  assert.deepEqual([0, .125, .25, .5, .75, .875, 1].map(plateau), [0, .25, .5, .5, .5, .75, 1]);
  assert.equal(curve("linear(0, .25, .5, 1)")(1 / 3), .25);
  assert.equal(curve("linear(0 20%, .5 10%, 1)")(.2), .5);
  assert.equal(curve("linear(0, 0 50%, 1 50%, 1)")(.5), 1);
});
