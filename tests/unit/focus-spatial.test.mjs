import assert from "node:assert/strict";
import { test } from "node:test";
import { selectSpatialCandidate, validSpatialRect } from "../../src/internal/focus-spatial.js";

const rect = (left, top, width = 40, height = 30) => ({ left, top, right: left + width, bottom: top + height });
const item = (id, ...args) => ({ id, rect: rect(...args) });
const pick = (origin, candidates, direction) => selectSpatialCandidate(origin, candidates, direction)?.id ?? null;

test("spatial selection follows all four visual directions despite shuffled DOM order", () => {
  const origin = rect(100, 100);
  const candidates = [item("down", 100, 200), item("left", 0, 100), item("up", 100, 0), item("right", 200, 100)];
  for (const direction of ["up", "down", "left", "right"]) assert.equal(pick(origin, candidates, direction), direction);
});

test("irregular grids prefer overlapping beams and edge gaps over nearest centers", () => {
  assert.equal(pick(rect(0, 100), [item("diagonal", 50, 60), item("aligned", 200, 100)], "right"), "aligned");
  assert.equal(pick(rect(0, 0), [item("small", 50, 0), item("large", 41, 0, 500)], "right"), "large");
  const grid = [item("A", 0, 0), item("B", 100, 0), item("C", 200, 0), item("E", 200, 100),
    item("F", 0, 200), item("G", 100, 200), item("H", 200, 200)];
  assert.equal(pick(rect(0, 100), grid, "up"), "A");
  assert.equal(pick(rect(0, 100), grid, "down"), "F");
  assert.equal(pick(rect(0, 100), grid, "right"), "E");
  assert.equal(pick(rect(100, 0), grid, "down"), "G");
});

test("diagonal fallback penalizes perpendicular gaps and ties preserve candidate order", () => {
  assert.equal(pick(rect(0, 0), [item("farCross", 50, 150), item("nearCross", 70, 35)], "right"), "nearCross");
  assert.equal(pick(rect(0, 0), [item("first", 100, 0), item("second", 100, 0)], "right"), "first");
});

test("overlapping rectangles require forward centers; edges never wrap", () => {
  assert.equal(pick(rect(0, 0), [item("overlap", 20, 0)], "right"), "overlap");
  assert.equal(pick(rect(0, 0), [item("behind", -50, 0), item("same", 0, 0)], "right"), null);
  assert.equal(pick(rect(0, 0), [], "down"), null);
  assert.equal(pick(rect(0, 0), [item("a", 100, 0)], "invalid"), null);
});

test("unmeasurable and nonfinite rectangles cannot become spatial targets", () => {
  for (const invalid of [rect(0, 0, 0), rect(0, 0, 40, 0), rect(NaN, 0), rect(0, Infinity), null]) {
    assert.equal(validSpatialRect(invalid), false);
    assert.equal(pick(rect(0, 0), [{ id: "bad", rect: invalid }], "right"), null);
  }
});

test("empty logical contexts enter from a visual edge; offscreen geometry remains eligible", () => {
  const candidates = [item("last", 100, 5000), item("first", 100, -500), item("middle", 100, 0)];
  assert.equal(pick(null, candidates, "down"), "first");
  assert.equal(pick(null, candidates, "up"), "last");
  assert.equal(pick(rect(100, 0), [item("offscreen", 100, 5000)], "down"), "offscreen");
});
